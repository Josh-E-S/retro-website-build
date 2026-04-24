"use client"

import { useCallback, useEffect, useImperativeHandle, useRef, useState, forwardRef } from "react"

/*
 * Artifacts — the corruption layer.
 *
 * Ported from the old V2 crt-hero.tsx but retuned for the cream/ink palette
 * and the Ablation Study's quieter tempo. The old version hit glitches
 * constantly; this one is sparse and precise — most of the time the screen
 * is clean, and when an artifact appears, it matters.
 *
 * Components:
 *   - Tetris blocks: small 2–5px tetromino shapes, drift in and fade.
 *     Runs always as faint ambient noise (ink on paper, low alpha).
 *   - Bitmap symbols: 7×7 pixel glyphs (heart / X / robot face). Rare,
 *     deliberate. Fired by cue.
 *   - Morse clumps: irregular horizontal runs of blocks. Subtle baseline
 *     ticks; stronger on glitch bursts.
 *   - Chroma slices: horizontal bands of the screen that shift x with
 *     cyan/magenta/yellow color fringes. Fired on glitch cue.
 *   - Ribbon: a single horizontal band during a glitch.
 *
 * Imperative handle:
 *   - glitch(intensity)       — one-shot burst
 *   - symbol(kind)            — one deliberate glyph
 *   - clump({subtle})         — one morse clump
 *   - ambient.start/.stop     — toggle baseline tetris
 */

export type ArtifactsHandle = {
  glitch: (intensity?: "normal" | "hard") => void
  symbol: (kind?: "heart" | "x" | "robot") => void
  clump: (opts?: { subtle?: boolean }) => void
  ambient: { start: () => void; stop: () => void }
}

type SliceSpec = {
  id: number
  top: number
  height: number
  shiftX: number
  chroma: "cyan" | "magenta" | "yellow" | "accent"
}

type Clump = {
  id: number
  top: number
  left: number
  blocks: { w: number; gap: number; h: number }[]
  shiftX: number
  ttl: number
}

type Tetris = {
  id: number
  top: number
  left: number
  cells: [number, number][]
  cellSize: number
  ttl: number
  opacity: number
}

type Symbol = {
  id: number
  top: number
  left: number
  cells: [number, number][]
  cellSize: number
  ttl: number
}

const TETRIS_SHAPES: [number, number][][] = [
  [[0, 0]],
  [[0, 0], [0, 1]],
  [[0, 0], [1, 0]],
  [[0, 0], [0, 1], [0, 2]],
  [[0, 0], [0, 1], [1, 0]],
  [[0, 0], [0, 1], [1, 1]],
  [[0, 0], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [1, 0], [1, 1]],
  [[0, 0], [0, 1], [0, 2], [1, 1]],
  [[0, 1], [1, 0], [1, 1], [1, 2]],
  [[0, 0], [0, 1], [1, 1], [1, 2]],
  [[0, 0], [1, 0], [2, 0]],
]

const SYMBOL_HEART: [number, number][] = [
  [1, 1], [1, 2], [1, 4], [1, 5],
  [2, 0], [2, 1], [2, 2], [2, 3], [2, 4], [2, 5], [2, 6],
  [3, 0], [3, 1], [3, 2], [3, 3], [3, 4], [3, 5], [3, 6],
  [4, 1], [4, 2], [4, 3], [4, 4], [4, 5],
  [5, 2], [5, 3], [5, 4],
  [6, 3],
]

const SYMBOL_X: [number, number][] = [
  [0, 0], [0, 1], [0, 5], [0, 6],
  [1, 0], [1, 1], [1, 2], [1, 4], [1, 5], [1, 6],
  [2, 1], [2, 2], [2, 3], [2, 4], [2, 5],
  [3, 2], [3, 3], [3, 4],
  [4, 1], [4, 2], [4, 3], [4, 4], [4, 5],
  [5, 0], [5, 1], [5, 2], [5, 4], [5, 5], [5, 6],
  [6, 0], [6, 1], [6, 5], [6, 6],
]

const SYMBOL_ROBOT: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [1, 0], [1, 6],
  [2, 0], [2, 2], [2, 4], [2, 6],
  [3, 0], [3, 6],
  [4, 0], [4, 6],
  [5, 0], [5, 2], [5, 3], [5, 4], [5, 6],
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6],
]

const SYMBOLS_BY_KIND = { heart: SYMBOL_HEART, x: SYMBOL_X, robot: SYMBOL_ROBOT }

function buildTetris(id: number): Tetris {
  const shape = TETRIS_SHAPES[Math.floor(Math.random() * TETRIS_SHAPES.length)]
  const cellSize = 2 + Math.floor(Math.random() * 4) // 2–5px (old V2)
  return {
    id,
    top: Math.random() * 96,
    left: Math.random() * 96,
    cells: shape,
    cellSize,
    ttl: 180 + Math.random() * 280,
    opacity: 0.35 + Math.random() * 0.3,
  }
}

function buildSymbol(id: number, kind: keyof typeof SYMBOLS_BY_KIND): Symbol {
  const cells = SYMBOLS_BY_KIND[kind]
  const cellSize = 3 + Math.floor(Math.random() * 4)
  return {
    id,
    top: 5 + Math.random() * 85,
    left: 5 + Math.random() * 85,
    cells,
    cellSize,
    ttl: 500 + Math.random() * 400,
  }
}

function buildClump(id: number, opts?: { subtle?: boolean }): Clump {
  const subtle = opts?.subtle ?? false
  const blockCount = subtle ? 2 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 5)
  const baseH = subtle ? 1 + Math.floor(Math.random() * 2) : 2 + Math.floor(Math.random() * 3)
  const blocks = Array.from({ length: blockCount }).map(() => {
    const style = Math.random()
    const w = style < 0.3 ? 3 + Math.random() * 4 : style < 0.75 ? 10 + Math.random() * 18 : 24 + Math.random() * 30
    const gap = 2 + Math.random() * 8
    const h = baseH + (Math.random() < 0.25 ? 1 : 0)
    return { w, gap, h }
  })
  return {
    id,
    top: 10 + Math.random() * 75,
    left: -5 + Math.random() * 90,
    blocks,
    shiftX: (Math.random() * 80 - 40) | 0,
    ttl: subtle ? 160 + Math.random() * 180 : 200 + Math.random() * 220,
  }
}

export type ArtifactEvent =
  | { kind: "tetris" }
  | { kind: "symbol"; which: "heart" | "x" | "robot" }
  | { kind: "clump"; subtle: boolean }
  | { kind: "glitch"; intensity: "normal" | "hard" }

type ArtifactsProps = {
  /** "ink" (default) for the cream/ink main experience; "amber" for Wakeup. */
  palette?: "ink" | "amber"
  /** Called whenever the layer spawns a visible event — from ambient
   *  auto-scheduling OR from an explicit handle call. Caller decides
   *  what (if any) audio to play. */
  onEvent?: (event: ArtifactEvent) => void
}

export const Artifacts = forwardRef<ArtifactsHandle, ArtifactsProps>(function Artifacts({ palette = "ink", onEvent }, ref) {
  const onEventRef = useRef(onEvent)
  onEventRef.current = onEvent
  const [tetris, setTetris] = useState<Tetris[]>([])
  const [symbols, setSymbols] = useState<Symbol[]>([])
  const [clumps, setClumps] = useState<Clump[]>([])
  const [slices, setSlices] = useState<SliceSpec[]>([])
  const [ribbon, setRibbon] = useState<number | null>(null)

  const ambientActiveRef = useRef(false)
  const nextIdRef = useRef(1)
  const ambientTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const cleanupAmbient = useCallback(() => {
    ambientTimersRef.current.forEach(clearTimeout)
    ambientTimersRef.current = []
  }, [])

  const startAmbient = useCallback(() => {
    if (ambientActiveRef.current) return
    ambientActiveRef.current = true

    // ─ Tetris ambient: 4 independent schedulers staggered over the first
    //   few seconds. Each runs forever at its own irregular cadence (1.2–4s),
    //   so at any moment 0–3 blocks are live across different parts of the
    //   screen. Matches the old V2 density.
    const scheduleTetris = (initialDelay: number) => {
      const run = () => {
        if (!ambientActiveRef.current) return
        const block = buildTetris(nextIdRef.current++)
        setTetris((prev) => [...prev, block])
        onEventRef.current?.({ kind: "tetris" })
        const cleanup = setTimeout(() => {
          setTetris((prev) => prev.filter((b) => b.id !== block.id))
        }, block.ttl + 40)
        ambientTimersRef.current.push(cleanup)
        const next = setTimeout(run, 1200 + Math.random() * 2800)
        ambientTimersRef.current.push(next)
      }
      const start = setTimeout(run, initialDelay)
      ambientTimersRef.current.push(start)
    }
    for (let i = 0; i < 4; i++) {
      scheduleTetris(700 + i * 650 + Math.random() * 800)
    }

    // ─ Symbols: rare, deliberate. A heart/X/robot drifts in every
    //   14–24 seconds on its own schedule, on top of any cue-fired ones.
    const kinds: Array<"heart" | "x" | "robot"> = ["heart", "x", "robot"]
    const scheduleSymbol = () => {
      const run = () => {
        if (!ambientActiveRef.current) return
        const kind = kinds[Math.floor(Math.random() * kinds.length)]
        const sym = buildSymbol(nextIdRef.current++, kind)
        setSymbols((prev) => [...prev, sym])
        onEventRef.current?.({ kind: "symbol", which: kind })
        const cleanup = setTimeout(() => {
          setSymbols((prev) => prev.filter((s) => s.id !== sym.id))
        }, sym.ttl + 80)
        ambientTimersRef.current.push(cleanup)
        const next = setTimeout(run, 14000 + Math.random() * 10000)
        ambientTimersRef.current.push(next)
      }
      const start = setTimeout(run, 9000 + Math.random() * 6000)
      ambientTimersRef.current.push(start)
    }
    scheduleSymbol()

    // ─ Subtle clumps: faint morse-ish patterns every 7–14 seconds. Not
    //   loud enough to read as glitch — just background texture.
    const scheduleClump = () => {
      const run = () => {
        if (!ambientActiveRef.current) return
        const c = buildClump(nextIdRef.current++, { subtle: true })
        setClumps((prev) => [...prev, c])
        onEventRef.current?.({ kind: "clump", subtle: true })
        const cleanup = setTimeout(() => {
          setClumps((prev) => prev.filter((x) => x.id !== c.id))
        }, c.ttl + 60)
        ambientTimersRef.current.push(cleanup)
        const next = setTimeout(run, 7000 + Math.random() * 7000)
        ambientTimersRef.current.push(next)
      }
      const start = setTimeout(run, 4000 + Math.random() * 3000)
      ambientTimersRef.current.push(start)
    }
    scheduleClump()
  }, [])

  const stopAmbient = useCallback(() => {
    ambientActiveRef.current = false
    cleanupAmbient()
    setTetris([])
    setSymbols([])
    setClumps([])
  }, [cleanupAmbient])

  const fireGlitch = useCallback((intensity: "normal" | "hard" = "normal") => {
    const hard = intensity === "hard"
    const count = (hard ? 3 : 2) + Math.floor(Math.random() * 2)
    const chromas: SliceSpec["chroma"][] = ["cyan", "magenta", "yellow", "accent"]
    const nextSlices: SliceSpec[] = Array.from({ length: count }).map(() => ({
      id: nextIdRef.current++,
      top: Math.random() * 85,
      height: 4 + Math.random() * (hard ? 20 : 12),
      shiftX: (Math.random() * (hard ? 160 : 100) - (hard ? 80 : 50)) | 0,
      chroma: chromas[Math.floor(Math.random() * chromas.length)],
    }))
    setSlices(nextSlices)
    if (Math.random() < (hard ? 0.85 : 0.45)) setRibbon(Math.random() * 90)

    const clumpCount = (hard ? 2 : 1) + (Math.random() < 0.5 ? 1 : 0)
    const newClumps = Array.from({ length: clumpCount }).map(() =>
      buildClump(nextIdRef.current++),
    )
    setClumps(newClumps)
    onEventRef.current?.({ kind: "glitch", intensity })

    // Tear down after a short window.
    const clearDelay = hard ? 420 : 280
    window.setTimeout(() => {
      setSlices([])
      setRibbon(null)
      setClumps([])
    }, clearDelay)
  }, [])

  const fireSymbol = useCallback((kind: "heart" | "x" | "robot" = "robot") => {
    const sym = buildSymbol(nextIdRef.current++, kind)
    setSymbols((prev) => [...prev, sym])
    onEventRef.current?.({ kind: "symbol", which: kind })
    window.setTimeout(() => {
      setSymbols((prev) => prev.filter((s) => s.id !== sym.id))
    }, sym.ttl + 100)
  }, [])

  const fireClump = useCallback((opts?: { subtle?: boolean }) => {
    onEventRef.current?.({ kind: "clump", subtle: !!opts?.subtle })
    const c = buildClump(nextIdRef.current++, opts)
    setClumps((prev) => [...prev, c])
    window.setTimeout(() => {
      setClumps((prev) => prev.filter((x) => x.id !== c.id))
    }, c.ttl + 60)
  }, [])

  useImperativeHandle(
    ref,
    () => ({
      glitch: fireGlitch,
      symbol: fireSymbol,
      clump: fireClump,
      ambient: { start: startAmbient, stop: stopAmbient },
    }),
    [fireGlitch, fireSymbol, fireClump, startAmbient, stopAmbient],
  )

  // Cleanup on unmount
  useEffect(() => () => cleanupAmbient(), [cleanupAmbient])

  // Mapping chroma keys → CSS color using our tokens.
  const chromaColor = (c: SliceSpec["chroma"]) =>
    c === "cyan"
      ? "var(--cyan)"
      : c === "magenta"
      ? "var(--magenta)"
      : c === "yellow"
      ? "var(--yellow)"
      : "var(--accent)"

  // Palette-derived colors. The ink palette is dark-on-light (cream
  // experience). The amber palette is bright-on-dark (Wakeup) so blocks
  // read against pure black.
  const blockHard = palette === "amber" ? "#d9b24a" : "var(--ink-deep)"
  const blockSoft = palette === "amber" ? "rgba(217, 178, 74, 0.75)" : "var(--ink)"
  // Print-registration / chromatic ghosts carry the amber bed when on
  // black so blocks pick up warm coronas rather than cold CMYK fringes.
  const blockShadow =
    palette === "amber"
      ? "drop-shadow(0.6px 0 0 rgba(228, 59, 37, 0.55)) drop-shadow(-0.6px 0 0 rgba(217, 178, 74, 0.45))"
      : "drop-shadow(0.5px 0 0 rgba(200, 75, 143, 0.4)) drop-shadow(-0.5px 0 0 rgba(31, 182, 193, 0.4))"
  const symbolShadow =
    palette === "amber"
      ? "drop-shadow(0.6px 0 0 rgba(228, 59, 37, 0.6)) drop-shadow(-0.6px 0 0 rgba(217, 178, 74, 0.5))"
      : "drop-shadow(0.5px 0 0 rgba(200, 75, 143, 0.45)) drop-shadow(-0.5px 0 0 rgba(31, 182, 193, 0.45))"

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 7 }}>
      {/* Tetris ambient */}
      {tetris.map((t) => (
        <div
          key={`t-${t.id}`}
          style={{
            position: "absolute",
            top: `${t.top}%`,
            left: `${t.left}%`,
            opacity: t.opacity,
            filter: blockShadow,
          }}
        >
          {t.cells.map(([r, c], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: r * t.cellSize,
                left: c * t.cellSize,
                width: t.cellSize,
                height: t.cellSize,
                background: blockHard,
              }}
            />
          ))}
        </div>
      ))}

      {/* Symbols */}
      {symbols.map((s) => (
        <div
          key={`s-${s.id}`}
          style={{
            position: "absolute",
            top: `${s.top}%`,
            left: `${s.left}%`,
            opacity: 0.7,
            filter: symbolShadow,
          }}
        >
          {s.cells.map(([r, c], i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                top: r * s.cellSize,
                left: c * s.cellSize,
                width: s.cellSize,
                height: s.cellSize,
                background: blockHard,
              }}
            />
          ))}
        </div>
      ))}

      {/* Clumps */}
      {clumps.map((c) => (
        <div
          key={`c-${c.id}`}
          style={{
            position: "absolute",
            top: `${c.top}%`,
            left: `${c.left}%`,
            transform: `translateX(${c.shiftX}px)`,
            display: "flex",
            alignItems: "center",
          }}
        >
          {c.blocks.map((b, i) => (
            <div
              key={i}
              style={{
                width: b.w,
                height: b.h,
                marginRight: b.gap,
                background: blockSoft,
                opacity: 0.45,
              }}
            />
          ))}
        </div>
      ))}

      {/* Chroma slices. On amber palette we use "screen" so the slice
          adds light to the black background instead of darkening. */}
      {slices.map((s) => (
        <div
          key={`sl-${s.id}`}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${s.top}%`,
            height: s.height,
            transform: `translateX(${s.shiftX}px)`,
            background: chromaColor(s.chroma),
            mixBlendMode: palette === "amber" ? "screen" : "multiply",
            opacity: palette === "amber" ? 0.7 : 0.5,
          }}
        />
      ))}

      {/* Ribbon */}
      {ribbon !== null && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${ribbon}%`,
            height: 2,
            background: blockHard,
            opacity: 0.7,
          }}
        />
      )}
    </div>
  )
})
