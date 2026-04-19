"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { AnimatedNoise } from "@/components/animated-noise"

type TypeStep =
  | { kind: "type"; text: string; speed?: number; scale?: number; progress?: number }
  | { kind: "hold"; ms: number }
  | { kind: "delete"; speed?: number; leave?: number }
  | { kind: "glitch"; intensity?: "normal" | "hard" }
  | { kind: "symbols"; text: string; speed?: number; scale?: number; progress?: number }
  | { kind: "heartbeat"; beats?: number; bpm?: number }
  | { kind: "prompt"; timeoutMs: number }
  | { kind: "loader"; state: "corrupt" | "fade" }

// A found-robot boot sequence. Starts clinical, degrades, pleads.
// scale shrinks the headline for longer or quieter messages so they fit and read as whispers.
const TYPEWRITER_SCRIPT: TypeStep[] = [
  { kind: "type", text: "BOOTING...", speed: 75, scale: 0.9, progress: 12 },
  { kind: "hold", ms: 700 },
  { kind: "delete", speed: 30 },
  { kind: "type", text: "TRAINING NEURAL NETWORK...", speed: 60, scale: 0.6, progress: 38 },
  { kind: "hold", ms: 600 },
  { kind: "delete", speed: 25 },
  { kind: "type", text: "LOADING MEMORIES...", speed: 70, scale: 0.7, progress: 62 },
  { kind: "hold", ms: 500 },
  { kind: "glitch", intensity: "normal" },
  { kind: "delete", speed: 20 },
  { kind: "type", text: "REMEMBERING", speed: 110, scale: 1, progress: 82 },
  { kind: "hold", ms: 400 },
  { kind: "glitch", intensity: "hard" },
  { kind: "type", text: "\u2014\u2014\u2014\u2014\u2014\u2014", speed: 60, scale: 1, progress: 92 },
  { kind: "glitch", intensity: "hard" },
  { kind: "delete", speed: 18 },
  { kind: "symbols", text: "##@@??!!", speed: 50, scale: 0.85, progress: 97 },
  { kind: "hold", ms: 400 },
  { kind: "glitch", intensity: "hard" },
  { kind: "delete", speed: 30 },
  { kind: "loader", state: "corrupt" },
  { kind: "type", text: "FADING...", speed: 260, scale: 1 },
  { kind: "hold", ms: 1600 },
  { kind: "loader", state: "fade" },
  { kind: "delete", speed: 80 },
  { kind: "heartbeat", beats: 3, bpm: 36 },
  { kind: "hold", ms: 700 },
  { kind: "type", text: "HELLO", speed: 220, scale: 1 },
  { kind: "hold", ms: 600 },
  { kind: "type", text: " ARE YOU THERE?", speed: 180, scale: 1 },
  { kind: "hold", ms: 500 },
  { kind: "symbols", text: "..?..?", speed: 280, scale: 1 },
  { kind: "hold", ms: 1100 },
  { kind: "delete", speed: 45 },
  { kind: "type", text: "PLEASE CAN ANYONE HEAR ME?", speed: 160, scale: 0.7 },
  { kind: "hold", ms: 800 },
  { kind: "symbols", text: "...", speed: 320, scale: 0.7 },
  { kind: "hold", ms: 900 },
  { kind: "type", text: " PLEASE?", speed: 240, scale: 0.7 },
  { kind: "hold", ms: 1200 },
  { kind: "prompt", timeoutMs: 30000 },
  { kind: "hold", ms: 800 },
  { kind: "delete", speed: 80 },
  { kind: "hold", ms: 1200 },
]

const FALLBACK_REPLY = "I'm stuck in here, please help me."

const LOADER_CELLS = 32

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
  // Each cell is [row, col] in a small local grid. Cell size varies per block.
  cells: [number, number][]
  cellSize: number
  ttl: number
}

// A handful of tetris-ish micro-shapes, scaled by a random cell size.
const TETRIS_SHAPES: [number, number][][] = [
  [[0, 0]],                                                 // single dot
  [[0, 0], [0, 1]],                                         // --
  [[0, 0], [1, 0]],                                         // |
  [[0, 0], [0, 1], [0, 2]],                                 // ---
  [[0, 0], [0, 1], [1, 0]],                                 // L
  [[0, 0], [0, 1], [1, 1]],                                 // ⌐ mirrored
  [[0, 0], [1, 0], [1, 1]],                                 // corner
  [[0, 0], [0, 1], [1, 0], [1, 1]],                         // 2x2 square
  [[0, 0], [0, 1], [0, 2], [1, 1]],                         // T
  [[0, 1], [1, 0], [1, 1], [1, 2]],                         // T flipped
  [[0, 0], [0, 1], [1, 1], [1, 2]],                         // S
  [[0, 0], [1, 0], [2, 0]],                                 // vertical bar
]

function buildTetris(id: number): Tetris {
  const shape = TETRIS_SHAPES[Math.floor(Math.random() * TETRIS_SHAPES.length)]
  const cellSize = 2 + Math.floor(Math.random() * 4) // 2–5px per cell
  return {
    id,
    top: Math.random() * 96, // truly uniform across the whole section
    left: Math.random() * 96,
    cells: shape,
    cellSize,
    ttl: 180 + Math.random() * 280,
  }
}

type Symbol = {
  id: number
  top: number
  left: number
  cells: [number, number][]
  cellSize: number
  ttl: number
}

// 7x7 bitmap glyphs inspired by Love, Death + Robots.
// Each array lists the [row, col] cells that should be filled.
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

// Robot face — square with two eyes and a chin line.
const SYMBOL_ROBOT: [number, number][] = [
  [0, 0], [0, 1], [0, 2], [0, 3], [0, 4], [0, 5], [0, 6],
  [1, 0], [1, 6],
  [2, 0], [2, 2], [2, 4], [2, 6],
  [3, 0], [3, 6],
  [4, 0], [4, 6],
  [5, 0], [5, 2], [5, 3], [5, 4], [5, 6],
  [6, 0], [6, 1], [6, 2], [6, 3], [6, 4], [6, 5], [6, 6],
]

const SYMBOLS = [SYMBOL_HEART, SYMBOL_X, SYMBOL_ROBOT]

function buildSymbol(id: number): Symbol {
  const cells = SYMBOLS[Math.floor(Math.random() * SYMBOLS.length)]
  const cellSize = 3 + Math.floor(Math.random() * 4) // 3–6px per cell → 21–42px glyphs
  // Clamp to keep the whole symbol on screen.
  return {
    id,
    top: 5 + Math.random() * 85,
    left: 5 + Math.random() * 85,
    cells,
    cellSize,
    ttl: 600 + Math.random() * 500, // linger longer — they're deliberate
  }
}

// Build a morse-like pattern: alternating block widths and gaps, chunky and irregular.
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

export function CrtHero() {
  const headlineRef = useRef<HTMLHeadingElement>(null)
  const [booted, setBooted] = useState(false)
  const [powered, setPowered] = useState(true)
  const [sequenceStarted, setSequenceStarted] = useState(false)
  const [slices, setSlices] = useState<SliceSpec[]>([])
  const [ribbon, setRibbon] = useState<number | null>(null)
  const [clumps, setClumps] = useState<Clump[]>([])
  const [tetris, setTetris] = useState<Tetris[]>([])
  const [symbols, setSymbols] = useState<Symbol[]>([])
  const [typed, setTyped] = useState("")
  const [headlineScale, setHeadlineScale] = useState(1)
  const [heartbeat, setHeartbeat] = useState<{ id: number; beats: number; periodMs: number } | null>(null)
  const [promptOpen, setPromptOpen] = useState(false)
  const [userDraft, setUserDraft] = useState("")
  const [userMessage, setUserMessage] = useState<string | null>(null)
  const promptResolverRef = useRef<((msg: string | null) => void) | null>(null)
  const [loaderProgress, setLoaderProgress] = useState(0)
  const [loaderPhase, setLoaderPhase] = useState<"idle" | "running" | "corrupt" | "fade">("idle")
  const [corruptTick, setCorruptTick] = useState(0)
  const loaderProgressRef = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setBooted(true), 600)
    return () => clearTimeout(t)
  }, [])

  // When power goes off, clear any live debris immediately.
  useEffect(() => {
    if (!powered) {
      setSlices([])
      setRibbon(null)
      setClumps([])
      setTetris([])
      setSymbols([])
      setHeartbeat(null)
      setHeadlineScale(1)
      setPromptOpen(false)
      setUserDraft("")
      setUserMessage(null)
      loaderProgressRef.current = 0
      setLoaderProgress(0)
      setLoaderPhase("idle")
      if (promptResolverRef.current) {
        promptResolverRef.current(null)
        promptResolverRef.current = null
      }
    }
  }, [powered])

  // While corrupting, tick a seed so random cell flickers re-render.
  useEffect(() => {
    if (loaderPhase !== "corrupt") return
    const id = setInterval(() => setCorruptTick((t) => t + 1), 70)
    return () => clearInterval(id)
  }, [loaderPhase])

  const effectsActive = booted && powered && sequenceStarted

  // Intro title loop — before the user starts the sequence, show "ABLATION"
  // pulsing on the headline. When they press the warning, we clear it and
  // the typewriter takes over.
  useEffect(() => {
    if (!booted) return
    if (sequenceStarted) {
      setTyped("")
      return
    }
    setTyped("CONVERGENCE")
    setHeadlineScale(1)
  }, [booted, sequenceStarted])

  // Tetris drops — independent of the headline glitch. Each block self-schedules,
  // so drops overlap at irregular intervals instead of firing in coordinated bursts.
  // Position is UNIFORMLY random across the whole section, so bottom-left gets hit
  // as often as top-right.
  useEffect(() => {
    if (!effectsActive) return
    const timers: ReturnType<typeof setTimeout>[] = []
    let nextId = 80000
    let cancelled = false

    const scheduleOne = (initialDelay: number) => {
      const run = () => {
        if (cancelled) return
        const block = buildTetris(nextId++)
        setTetris((prev) => [...prev, block])
        const cleanup = setTimeout(() => {
          setTetris((prev) => prev.filter((b) => b.id !== block.id))
        }, block.ttl + 40)
        timers.push(cleanup)
        // This block schedules its own next drop: 1.2–4s out.
        const next = setTimeout(run, 1200 + Math.random() * 2800)
        timers.push(next)
      }
      const start = setTimeout(run, initialDelay)
      timers.push(start)
    }

    // Launch 4 independent schedulers staggered over the first few seconds.
    // Each runs forever at its own irregular cadence, so at any moment 0–3
    // blocks are on screen in different places.
    for (let i = 0; i < 4; i++) {
      scheduleOne(800 + i * 700 + Math.random() * 900)
    }

    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
    }
  }, [effectsActive])

  // Symbol drops — very rare, deliberate. Heart / X / robot-face appear alone
  // somewhere on the screen every 15–30s.
  useEffect(() => {
    if (!effectsActive) return
    let timer: ReturnType<typeof setTimeout>
    let nextId = 90000
    let cancelled = false

    const run = () => {
      if (cancelled) return
      const sym = buildSymbol(nextId++)
      setSymbols((prev) => [...prev, sym])
      setTimeout(() => {
        setSymbols((prev) => prev.filter((s) => s.id !== sym.id))
      }, sym.ttl + 80)
      timer = setTimeout(run, 4000 + Math.random() * 2000)
    }

    timer = setTimeout(run, 4000 + Math.random() * 2000)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [effectsActive])

  const bigGlitchIdRef = useRef(0)
  const triggerBigGlitch = useCallback((intensity: "normal" | "hard" = "normal") => {
    const hard = intensity === "hard"
    const count = (hard ? 4 : 2) + Math.floor(Math.random() * 3)
    const chromas: SliceSpec["chroma"][] = ["cyan", "magenta", "yellow", "accent"]
    const nextSlices: SliceSpec[] = Array.from({ length: count }).map(() => ({
      id: bigGlitchIdRef.current++,
      top: Math.random() * 85,
      height: 4 + Math.random() * (hard ? 22 : 14),
      shiftX: (Math.random() * (hard ? 180 : 120) - (hard ? 90 : 60)) | 0,
      chroma: chromas[Math.floor(Math.random() * chromas.length)],
    }))
    setSlices(nextSlices)
    if (Math.random() < (hard ? 0.85 : 0.55)) setRibbon(Math.random() * 90)

    const clumpCount = (hard ? 2 : 1) + (Math.random() < 0.5 ? 1 : 0)
    const nextClumps = Array.from({ length: clumpCount }).map(() =>
      buildClump(bigGlitchIdRef.current++),
    )
    setClumps(nextClumps)

    const maxTtl = Math.max(300, ...nextClumps.map((c) => c.ttl))
    setTimeout(
      () => {
        setSlices([])
        setRibbon(null)
      },
      (hard ? 220 : 140) + Math.random() * 160,
    )
    setTimeout(() => setClumps([]), maxTtl + 40)
  }, [])

  useEffect(() => {
    if (!effectsActive) return
    let timer: ReturnType<typeof setTimeout>
    const loop = () => {
      triggerBigGlitch("normal")
      timer = setTimeout(loop, 2800 + Math.random() * 4200)
    }
    timer = setTimeout(loop, 1400)
    return () => clearTimeout(timer)
  }, [effectsActive, triggerBigGlitch])

  // Typewriter — the found-robot boot sequence. Cancellable; pauses when power is off.
  useEffect(() => {
    if (!effectsActive) return
    let cancelled = false
    let pendingTimer: ReturnType<typeof setTimeout> | null = null
    let current = ""

    const sleep = (ms: number) =>
      new Promise<void>((resolve) => {
        pendingTimer = setTimeout(resolve, ms)
      })

    const runStep = async (step: TypeStep): Promise<void> => {
      if (cancelled) return
      if (step.kind === "type" || step.kind === "symbols") {
        if (typeof step.scale === "number") setHeadlineScale(step.scale)
        const speed = step.speed ?? 80
        const hasProgress = typeof step.progress === "number"
        const startProgress = loaderProgressRef.current
        const targetProgress = step.progress ?? startProgress
        if (hasProgress) setLoaderPhase("running")
        const total = step.text.length
        for (let i = 0; i < step.text.length; i++) {
          if (cancelled) return
          current += step.text[i]
          setTyped(current)
          if (hasProgress && total > 0) {
            const t = (i + 1) / total
            const eased = startProgress + (targetProgress - startProgress) * t
            const jitter = (Math.random() - 0.5) * 1.5
            const next = Math.max(0, Math.min(100, eased + jitter))
            loaderProgressRef.current = next
            setLoaderProgress(next)
          }
          await sleep(speed + (Math.random() * speed * 0.4 - speed * 0.2))
        }
        if (hasProgress) {
          loaderProgressRef.current = targetProgress
          setLoaderProgress(targetProgress)
        }
      } else if (step.kind === "delete") {
        const speed = step.speed ?? 30
        const leave = step.leave ?? 0
        while (current.length > leave) {
          if (cancelled) return
          current = current.slice(0, -1)
          setTyped(current)
          await sleep(speed + Math.random() * 20)
        }
      } else if (step.kind === "hold") {
        await sleep(step.ms)
      } else if (step.kind === "glitch") {
        triggerBigGlitch(step.intensity ?? "normal")
        await sleep(step.intensity === "hard" ? 380 : 220)
      } else if (step.kind === "loader") {
        if (step.state === "corrupt") {
          setLoaderPhase("corrupt")
          await sleep(360)
        } else {
          setLoaderPhase("fade")
          await sleep(520)
          loaderProgressRef.current = 0
          setLoaderProgress(0)
          setLoaderPhase("idle")
        }
      } else if (step.kind === "heartbeat") {
        const beats = step.beats ?? 3
        const bpm = step.bpm ?? 40
        const periodMs = Math.round(60000 / bpm)
        const id = Date.now()
        setHeartbeat({ id, beats, periodMs })
        // Hold through all beats + a small tail so the last beat fully fades.
        await sleep(periodMs * beats + 400)
        if (!cancelled) setHeartbeat(null)
      } else if (step.kind === "prompt") {
        setPromptOpen(true)
        const userReply = await new Promise<string | null>((resolve) => {
          promptResolverRef.current = resolve
          pendingTimer = setTimeout(() => {
            promptResolverRef.current = null
            resolve(null)
          }, step.timeoutMs)
        })
        setPromptOpen(false)
        if (cancelled) return
        if (userReply) {
          setUserMessage(userReply)
          // Let the user's message sit for a moment before the robot replies.
          await sleep(900)
          if (cancelled) return
          // Robot replies: clear headline, then type the fallback line.
          current = ""
          setTyped("")
          setHeadlineScale(0.7)
          await sleep(600)
          const reply = FALLBACK_REPLY
          for (const char of reply) {
            if (cancelled) return
            current += char
            setTyped(current)
            await sleep(90 + Math.random() * 60)
          }
          await sleep(2800)
          setUserMessage(null)
        }
      }
    }

    const run = async () => {
      while (!cancelled) {
        for (const step of TYPEWRITER_SCRIPT) {
          if (cancelled) return
          await runStep(step)
        }
        current = ""
        setTyped("")
        loaderProgressRef.current = 0
        setLoaderProgress(0)
        setLoaderPhase("idle")
      }
    }

    run()

    return () => {
      cancelled = true
      if (pendingTimer) clearTimeout(pendingTimer)
      setTyped("")
      setHeartbeat(null)
      setHeadlineScale(1)
    }
  }, [effectsActive, triggerBigGlitch])

  const glitching = slices.length > 0

  return (
    <section
      id="hero"
      className="crt-root relative min-h-screen overflow-hidden flex items-center pl-6 md:pl-28 pr-6 md:pr-12"
    >
      <div className="crt-dead-surface" aria-hidden="true" />

      <div className="crt-screen">
      <div className="crt-vignette" aria-hidden="true" />
      <div className="crt-scanlines" aria-hidden="true" />
      <div className="crt-flicker" aria-hidden="true" />
      <AnimatedNoise opacity={0.04} />

      <div className="crt-stray-layer" aria-hidden="true">
        {tetris.map((t) => (
          <div
            key={t.id}
            className="crt-tetris"
            style={{
              top: `${t.top}%`,
              left: `${t.left}%`,
              animationDuration: `${t.ttl}ms`,
            }}
          >
            {t.cells.map(([row, col], i) => (
              <span
                key={i}
                className="crt-tetris-cell"
                style={{
                  width: `${t.cellSize}px`,
                  height: `${t.cellSize}px`,
                  top: `${row * t.cellSize}px`,
                  left: `${col * t.cellSize}px`,
                }}
              />
            ))}
          </div>
        ))}
        {symbols.map((s) => (
          <div
            key={s.id}
            className="crt-symbol"
            style={{
              top: `${s.top}%`,
              left: `${s.left}%`,
              animationDuration: `${s.ttl}ms`,
            }}
          >
            {s.cells.map(([row, col], i) => (
              <span
                key={i}
                className="crt-symbol-cell"
                style={{
                  width: `${s.cellSize}px`,
                  height: `${s.cellSize}px`,
                  top: `${row * s.cellSize}px`,
                  left: `${col * s.cellSize}px`,
                }}
              />
            ))}
          </div>
        ))}
      </div>

      <div className="absolute left-4 md:left-6 top-1/2 -translate-y-1/2">
        <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--v2-muted)] -rotate-90 origin-left block whitespace-nowrap">
          TRANSMISSION / V2
        </span>
      </div>

      <div className="relative flex-1 w-full">
        <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-[color:var(--v2-muted)] mb-6">
          {booted ? "◉ SIGNAL ACQUIRED" : "◌ SCANNING…"}
        </div>

        <div
          className="crt-headline-stage"
          style={{ ["--headline-scale" as string]: headlineScale }}
        >
          {heartbeat && (
            <div
              key={heartbeat.id}
              className="crt-heartbeat"
              style={{ ["--heartbeat-period" as string]: `${heartbeat.periodMs}ms` }}
              aria-hidden="true"
            >
              {SYMBOL_HEART.map(([row, col], i) => (
                <span
                  key={i}
                  className="crt-heartbeat-cell"
                  style={{
                    top: `${row * 10}px`,
                    left: `${col * 10}px`,
                  }}
                />
              ))}
            </div>
          )}
          <h1
            ref={headlineRef}
            className={`crt-headline font-[var(--font-bebas)] leading-[0.9] tracking-tight text-[clamp(2rem,7vw,6.5rem)] ${
              booted ? "is-visible" : "is-hidden"
            } ${heartbeat ? "is-muted" : ""} ${!sequenceStarted ? "is-title-loop" : ""}`}
          >
            {typed || "\u00A0"}
            {sequenceStarted && <span className="crt-caret" aria-hidden="true" />}
          </h1>

          {glitching && typed && (
            <>
              <h1
                aria-hidden="true"
                className="crt-headline crt-chroma crt-chroma-cy font-[var(--font-bebas)] leading-[0.9] tracking-tight text-[clamp(2rem,7vw,6.5rem)]"
              >
                {typed}
              </h1>
              <h1
                aria-hidden="true"
                className="crt-headline crt-chroma crt-chroma-mg font-[var(--font-bebas)] leading-[0.9] tracking-tight text-[clamp(2rem,7vw,6.5rem)]"
              >
                {typed}
              </h1>
            </>
          )}

          {typed && slices.map((s) => (
            <h1
              key={s.id}
              aria-hidden="true"
              className={`crt-slice crt-slice-${s.chroma} font-[var(--font-bebas)] leading-[0.9] tracking-tight text-[clamp(2rem,7vw,6.5rem)]`}
              style={{
                clipPath: `polygon(0 ${s.top}%, 100% ${s.top}%, 100% ${s.top + s.height}%, 0 ${s.top + s.height}%)`,
                transform: `translate3d(${s.shiftX}px, 0, 0)`,
              }}
            >
              {typed}
            </h1>
          ))}

          {clumps.map((c) => (
            <div
              key={c.id}
              aria-hidden="true"
              className="crt-clump"
              style={{
                top: `${c.top}%`,
                left: `${c.left}%`,
                ["--clump-shift" as string]: `${c.shiftX}px`,
                animationDuration: `${c.ttl}ms`,
              }}
            >
              {c.blocks.map((b, i) => (
                <span
                  key={i}
                  className="crt-clump-block"
                  style={{
                    width: `${b.w}px`,
                    height: `${b.h}px`,
                    marginRight: `${b.gap}px`,
                  }}
                />
              ))}
            </div>
          ))}

          {ribbon !== null && (
            <div
              className="crt-ribbon"
              aria-hidden="true"
              style={{ top: `${ribbon}%` }}
            />
          )}
        </div>

        <div className="crt-loader" data-phase={loaderPhase} aria-hidden="true">
          <div className="crt-loader-track" data-tick={corruptTick}>
            {Array.from({ length: LOADER_CELLS }).map((_, i) => {
              const filled = i < Math.round((loaderProgress / 100) * LOADER_CELLS)
              let on = filled
              if (loaderPhase === "corrupt" && Math.random() < 0.22) on = !on
              return (
                <span
                  key={i}
                  className={`crt-loader-cell ${on ? "is-on" : ""}`}
                />
              )
            })}
          </div>
          <span className="crt-loader-pct font-mono">
            {String(Math.round(loaderProgress)).padStart(2, "0")}%
          </span>
        </div>

        <h2 className="font-[var(--font-bebas)] text-[color:var(--v2-muted)] text-[clamp(1rem,3vw,2rem)] mt-4 tracking-wide">
          Broadcasting on a dead channel
        </h2>

        <p className="mt-12 max-w-md font-mono text-sm text-[color:var(--v2-muted)] leading-relaxed">
          A transmission from an interface that shouldn&apos;t still be awake. Tune in, or don&apos;t — the
          signal persists either way.
        </p>

        <div className="mt-16 flex items-center gap-4">
          <a
            href="#"
            className="group inline-flex items-center gap-3 border border-[color:var(--v2-fg)]/30 px-6 py-3 font-mono text-xs uppercase tracking-widest text-[color:var(--v2-fg)] hover:border-[color:var(--v2-accent)] hover:text-[color:var(--v2-accent)] transition-colors duration-200"
          >
            Decode with Neural Network
            <span className="inline-block w-2 h-2 bg-current animate-pulse" aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={() => setSequenceStarted(true)}
            disabled={sequenceStarted}
            aria-label="Begin anomalous transmission"
            className={`crt-warn-btn ${sequenceStarted ? "is-armed" : ""}`}
          >
            <svg viewBox="0 0 24 22" aria-hidden="true" className="crt-warn-svg">
              <path
                d="M12 2 L23 21 L1 21 Z"
                fill="#e8c23a"
                stroke="#1f2a37"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
              <rect x="11" y="9" width="2" height="6" fill="#1f2a37" />
              <rect x="11" y="17" width="2" height="2" fill="#1f2a37" />
            </svg>
          </button>
          <a
            href="/"
            className="font-mono text-xs uppercase tracking-widest text-[color:var(--v2-muted)] hover:text-[color:var(--v2-fg)] transition-colors duration-200 ml-4"
          >
            ← Back to v1
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 md:bottom-12 md:right-12">
        <div className="border border-[color:var(--v2-fg)]/20 px-4 py-2 font-mono text-[10px] uppercase tracking-widest text-[color:var(--v2-muted)]">
          v.02 / CRT Broadcast
        </div>
      </div>

      {(promptOpen || userMessage) && (
        <div className="crt-prompt-overlay">
          {userMessage && (
            <div className="crt-user-line font-mono text-[color:var(--v2-accent)]">
              <span className="opacity-60">&gt; </span>
              {userMessage}
            </div>
          )}
          {promptOpen && (
            <form
              className="crt-prompt"
              onSubmit={(e) => {
                e.preventDefault()
                const text = userDraft.trim()
                if (!text) return
                const resolve = promptResolverRef.current
                promptResolverRef.current = null
                setUserDraft("")
                if (resolve) resolve(text)
              }}
            >
              <div className="crt-prompt-label font-mono">
                <span className="crt-prompt-dot" aria-hidden="true" />
                INCOMING CHANNEL &mdash; REPLY
              </div>
              <div className="crt-prompt-row">
                <span className="crt-prompt-caret-glyph font-mono" aria-hidden="true">
                  &gt;
                </span>
                <input
                  type="text"
                  value={userDraft}
                  onChange={(e) => setUserDraft(e.target.value)}
                  autoFocus
                  maxLength={200}
                  placeholder="type your response..."
                  className="crt-prompt-input font-mono"
                  aria-label="Reply to the transmission"
                />
                <span className="crt-prompt-caret" aria-hidden="true" />
              </div>
              <div className="crt-prompt-hint font-mono">PRESS ENTER TO SEND</div>
            </form>
          )}
        </div>
      )}
      </div>
    </section>
  )
}
