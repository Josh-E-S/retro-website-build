"use client"

import { useEffect, useRef, useState } from "react"

/*
 * Terminal — the CRT's text surface.
 *
 * Two rendering modes:
 *
 *   "stanza" — large, centered horizontally+vertically. One stanza on
 *              screen at a time; each new stanza replaces the previous
 *              with a short fade/roll between them. Used for the boot
 *              header, welcome screen, and every line Eve speaks.
 *
 *   "log"    — small, left-aligned, stacks downward. Used only for the
 *              boot checklist (MEMORY / NETWORK / AUDIO / TELEMETRY /
 *              SESSION / INITIALIZING). Contrasts against the stanza
 *              mode to sell the "computer vs. broadcast" distinction.
 *
 * Imperative-ish API via TerminalHandle so the Experience dispatcher
 * can drive it cue by cue.
 */

export type TerminalLine = {
  id: string
  text: string
  /** Per-character extra delay (ms) keyed by 0-based index. */
  charDelays?: Record<number, number>
}

export type StanzaSize = "display" | "body"

export type GlitchSubtitleOpts = {
  text: string
  durationMs?: number
}

export type TerminalHandle = {
  /** Show a single stanza, replacing whatever is on screen. Returns when typed. */
  stanza: (
    lines: TerminalLine[],
    opts: {
      cps: number
      size?: StanzaSize
      holdAfterMs?: number
      /** "type" (default) or "glitch_resolve" — stanza arrival style. */
      variant?: "type" | "glitch_resolve"
      /**
       * Optional offset from the centered position. Strings so callers
       * can pass either px ("20px") or vw/vh ("4vw"). Useful for the
       * intro quote rotator which scatters quotes around the screen.
       */
      offsetX?: string
      offsetY?: string
    },
  ) => Promise<void>
  /** Append a log line to the small-log stack (no clear). */
  pushLog: (line: TerminalLine, cps: number) => Promise<void>
  /** Dots cycle on the last log line (for INITIALIZING ... loop). */
  cycleDotsOnLastLog: (base: string, durationMs: number) => Promise<void>
  /** Render a heavily-glitched subtitle line below the current stanza. */
  glitchSubtitle: (opts: GlitchSubtitleOpts) => void
  /** Clear the screen with a short vertical-roll fade. */
  clear: () => Promise<void>
  /** Turn the 1Hz blinking cursor on/off. Appears under the current stanza/log. */
  showBlinkingCursor: (on: boolean) => void
}

type RenderedLine = {
  id: string
  text: string
  visibleChars: number
  total: number
}

type Mode = "stanza" | "log"

type Props = {
  onReady: (handle: TerminalHandle) => void
  /** Called when a typewriter animation begins. Kind hints at line length
   *  so the audio side can pick the right track. */
  onTypingStart?: (kind: "short" | "long") => void
  /** Called when the current typewriter animation ends. */
  onTypingEnd?: () => void
  /** When true (intro phase), switch text from dark ink → cream so it
   *  pops against the dimmed paper. */
  dim?: boolean
}

export function Terminal({ onReady, onTypingStart, onTypingEnd, dim = false }: Props) {
  const [mode, setMode] = useState<Mode>("stanza")
  const [size, setSize] = useState<StanzaSize>("display")
  const [lines, setLines] = useState<RenderedLine[]>([])
  const [clearing, setClearing] = useState(false)
  const [glitchResolveActive, setGlitchResolveActive] = useState(false)
  const [glitchResolveShake, setGlitchResolveShake] = useState(false)
  // Glitch subtitle: persistent character re-scramble under the current
  // stanza. Cleared when setLines([]) runs or explicitly dismissed.
  // Per-stanza offset from center. Used by the QuoteRotator to scatter
  // intro quotes around the screen. Reset on each new stanza.
  const [stanzaOffset, setStanzaOffset] = useState<{ x: string; y: string }>({ x: "0px", y: "0px" })
  const [subtitle, setSubtitle] = useState<{ real: string; shown: string } | null>(null)
  const subtitleTimerRef = useRef<number | null>(null)
  const [cursorVisible, setCursorVisible] = useState(false)
  const [cursorBlink, setCursorBlink] = useState(true)

  const linesRef = useRef<RenderedLine[]>([])
  linesRef.current = lines

  const modeRef = useRef<Mode>("stanza")
  modeRef.current = mode

  const onTypingStartRef = useRef<((kind: "short" | "long") => void) | undefined>(undefined)
  onTypingStartRef.current = onTypingStart
  const onTypingEndRef = useRef<(() => void) | undefined>(undefined)
  onTypingEndRef.current = onTypingEnd

  const onReadyRef = useRef(onReady)
  onReadyRef.current = onReady

  // Idempotent guard: the handle is created at most ONCE for the
  // component's lifetime. Strict Mode (dev) cycles effects as
  // mount → cleanup → mount, and without this guard the second mount
  // would build a parallel serial chain queue — each queue independently
  // animates every incoming cue, which is exactly why typewriter text
  // and keystroke sounds were stacking up.
  const handleCreatedRef = useRef(false)

  useEffect(() => {
    if (handleCreatedRef.current) return
    handleCreatedRef.current = true
    const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

    // Global typing speed scale. 1.0 = sequence-declared cps; >1 slows
    // typing proportionally. Kept here as a single tuning knob so the
    // sequence file doesn't need a sweep every time we retune tempo.
    const TYPING_SLOWDOWN = 2.0

    // Serial queue — ensures typewriter cues fire one after the other
    // even when the dispatcher schedules them with overlapping timings.
    // Without this, slowing TYPING_SLOWDOWN causes consecutive lines to
    // animate in parallel and interleave visually.
    let chain: Promise<void> = Promise.resolve()
    const enqueue = <T,>(fn: () => Promise<T>): Promise<T> => {
      const next = chain.then(fn)
      chain = next.then(
        () => undefined,
        () => undefined,
      )
      return next
    }

    // Characters used to fill the scramble effect. Mix of glyphs + letters
    // so the frame reads as "text but corrupted" rather than just noise.
    const SCRAMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*+=?!/\\<>"
    const scrambleStr = (real: string): string => {
      let out = ""
      for (let i = 0; i < real.length; i++) {
        const c = real[i]
        if (c === " ") { out += " "; continue }
        out += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
      }
      return out
    }

    const renderLinesGlitchResolve = async (newLines: TerminalLine[]) => {
      // Phase A: fill the screen with scrambled text of correct lengths.
      setLines(newLines.map((l) => ({
        id: l.id,
        text: scrambleStr(l.text),
        visibleChars: l.text.length,
        total: l.text.length,
      })))
      setGlitchResolveActive(true)

      // Phase B: scramble over ~1800ms, re-rolling every 55ms. Each cycle
      // reveals a few real characters so the resolve feels progressive,
      // not a hard snap. Doubled from 900ms — the welcome beat is the
      // brand moment and deserves the weight.
      const scrambleDurationMs = 1800
      const cycleMs = 55
      const cycles = Math.floor(scrambleDurationMs / cycleMs)
      for (let k = 0; k < cycles; k++) {
        const progress = k / cycles // 0 → 1
        setLines(newLines.map((l) => {
          const locked = Math.floor(l.text.length * progress)
          let text = ""
          for (let i = 0; i < l.text.length; i++) {
            if (i < locked || l.text[i] === " ") {
              text += l.text[i]
            } else {
              text += SCRAMBLE_CHARS[Math.floor(Math.random() * SCRAMBLE_CHARS.length)]
            }
          }
          return { id: l.id, text, visibleChars: l.text.length, total: l.text.length }
        }))
        await sleep(cycleMs)
      }

      // Phase C: vibrate twice before the crisp reveal. Slightly longer
      // pauses so each shake reads as deliberate rather than a twitch.
      setGlitchResolveShake(true)
      await sleep(160)
      setGlitchResolveShake(false)
      await sleep(100)
      setGlitchResolveShake(true)
      await sleep(160)
      setGlitchResolveShake(false)
      await sleep(120)

      // Phase D: snap to the real text, drop the glitch effect.
      setLines(newLines.map((l) => ({
        id: l.id,
        text: l.text,
        visibleChars: l.text.length,
        total: l.text.length,
      })))
      setGlitchResolveActive(false)
    }

    const appendLineAnimated = async (line: TerminalLine, cps: number) => {
      const perChar = (1000 / cps) * TYPING_SLOWDOWN
      const total = line.text.length
      setLines((prev) => [
        ...prev,
        { id: line.id, text: line.text, visibleChars: 0, total },
      ])
      for (let i = 1; i <= total; i++) {
        const extra = line.charDelays?.[i - 1] ?? 0
        await sleep(perChar + extra)
        setLines((prev) =>
          prev.map((l) => (l.id === line.id ? { ...l, visibleChars: i } : l)),
        )
      }
    }

    const fadeOutCurrent = async () => {
      setClearing(true)
      await sleep(280)
      setLines([])
      setClearing(false)
    }

    // Decide which typing track fits a given total-character count. Long
    // stanzas (Eve's sentences, welcome screen) use the longer loop so
    // the pattern doesn't repeat audibly; short log lines use the shorter.
    const typingKindFor = (totalChars: number): "short" | "long" =>
      totalChars > 40 ? "long" : "short"

    const handle: TerminalHandle = {
      stanza: (newLines, opts) =>
        enqueue(async () => {
          setMode("stanza")
          setSize(opts.size ?? "display")
          setStanzaOffset({ x: opts.offsetX ?? "0px", y: opts.offsetY ?? "0px" })
          // Replace whatever is on screen with a brief fade first.
          if (linesRef.current.length > 0) await fadeOutCurrent()

          if (opts.variant === "glitch_resolve") {
            // No typewriter keystroke audio here — the stanza arrives
            // via scramble-resolve, not typing. The caller (dispatcher)
            // can separately fire glitch audio if desired.
            await renderLinesGlitchResolve(newLines)
          } else {
            const total = newLines.reduce((n, l) => n + l.text.length, 0)
            onTypingStartRef.current?.(typingKindFor(total))
            try {
              for (const line of newLines) {
                await appendLineAnimated(line, opts.cps)
              }
            } finally {
              onTypingEndRef.current?.()
            }
          }
          if (opts.holdAfterMs) await sleep(opts.holdAfterMs)
        }),
      pushLog: (line, cps) =>
        enqueue(async () => {
          // Switching into log mode clears any stanza on screen first.
          if (modeRef.current !== "log") {
            if (linesRef.current.length > 0) await fadeOutCurrent()
            setMode("log")
          }
          onTypingStartRef.current?.(typingKindFor(line.text.length))
          try {
            await appendLineAnimated(line, cps)
          } finally {
            onTypingEndRef.current?.()
          }
        }),
      cycleDotsOnLastLog: (base, durationMs) =>
        enqueue(async () => {
          const last = linesRef.current[linesRef.current.length - 1]
          if (!last) return
          const id = last.id
          const variants = ["", ".", "..", "..."]
          const start = performance.now()
          let i = 0
          while (performance.now() - start < durationMs) {
            const dots = variants[i % variants.length]
            const text = base + (dots ? " " + dots : "")
            setLines((prev) =>
              prev.map((l) =>
                l.id === id
                  ? { ...l, text, visibleChars: text.length, total: text.length }
                  : l,
              ),
            )
            i += 1
            await sleep(300)
          }
        }),
      glitchSubtitle: (opts: GlitchSubtitleOpts) => {
        // Fire-and-forget: the subtitle is a sibling to the main stanza
        // and doesn't belong in the serial chain — it runs in parallel.
        setSubtitle({ real: opts.text, shown: opts.text })
        if (opts.durationMs) {
          window.setTimeout(() => {
            setSubtitle((s) => (s && s.real === opts.text ? null : s))
          }, opts.durationMs)
        }
      },
      clear: () =>
        enqueue(async () => {
          setSubtitle(null)
          await fadeOutCurrent()
        }),
      showBlinkingCursor: (on: boolean) => setCursorVisible(on),
    }
    onReadyRef.current(handle)
    // Intentionally empty deps — the handle and its queue must live for
    // the full lifetime of the component. If this re-ran on re-render,
    // each new handle would start its own parallel chain, causing
    // overlapping typewriter animations and stacked keystroke sounds.
  }, [])

  // Perpetual character re-scramble on the glitch subtitle. While the
  // subtitle is active, every ~90ms a handful of characters swap to
  // random glyphs before returning. Reads as "the tagline is unstable."
  useEffect(() => {
    if (!subtitle) return
    const GLYPHS = "#@$%&*+=?!/\\<>"
    const id = window.setInterval(() => {
      setSubtitle((s) => {
        if (!s) return s
        const real = s.real
        let out = ""
        for (let i = 0; i < real.length; i++) {
          const ch = real[i]
          if (ch === " " || ch === "." || ch === ",") {
            out += ch
          } else if (Math.random() < 0.18) {
            out += GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
          } else {
            out += ch
          }
        }
        return { real, shown: out }
      })
    }, 90)
    subtitleTimerRef.current = id
    return () => {
      window.clearInterval(id)
      if (subtitleTimerRef.current === id) subtitleTimerRef.current = null
    }
  }, [subtitle?.real])

  useEffect(() => {
    if (!cursorVisible) return
    const id = window.setInterval(() => setCursorBlink((v) => !v), 500)
    return () => window.clearInterval(id)
  }, [cursorVisible])

  // Shared text color & per-mode typography.
  const stanzaFontSize = size === "display" ? "clamp(36px, 6vw, 80px)" : "clamp(22px, 2.4vw, 34px)"
  const stanzaLineHeight = size === "display" ? 1.1 : 1.35

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // The logo is top-left-weighted when in corner state, so bias
        // the text a little further from the top via padding. Symmetric
        // bottom padding keeps the optical center close to true screen
        // center. Values tuned for the 0.36-scale corner logo.
        paddingTop: "4vh",
        paddingBottom: "4vh",
        paddingLeft: "8vw",
        paddingRight: "8vw",
        opacity: clearing ? 0 : 1,
        transform: clearing ? "translateY(10px)" : "translateY(0)",
        transition:
          "opacity 280ms ease-out, transform 280ms ease-out, padding 1200ms cubic-bezier(0.65, 0, 0.35, 1)",
        // Above intro video (z=2), scanlines (z=2), rolling band (z=3),
        // vignette (z=4), flicker (z=5), tear (z=6), and artifacts (z=7).
        // Below the power-on beam (z=20). This ensures text is never
        // muddied by the multiply-blended scanlines or the vignette.
        zIndex: 8,
      }}
    >
      {mode === "stanza" ? (
        <div
          style={{
            textAlign: "center",
            fontFamily: "var(--display-font)",
            fontSize: stanzaFontSize,
            lineHeight: stanzaLineHeight,
            letterSpacing: "0.01em",
            // In dim mode (intro phase) use near-white so text fully
            // pops against the darkened paper. In normal mode use deep
            // ink for the paper-and-ink reading aesthetic.
            color: dim
              ? "#ffffff"
              : size === "display" ? "var(--ink-deep)" : "var(--ink)",
            textShadow: dim
              ? "0 0 28px rgba(255, 255, 255, 0.9), 0 0 10px rgba(255, 255, 255, 1), 0 0 3px rgba(255, 255, 255, 1)"
              : undefined,
            maxWidth: "24ch",
            textWrap: "balance" as never,
            // Glitch-resolve: heavy chromatic offset while scrambling,
            // plus a shake on the two vibration beats.
            filter: glitchResolveActive
              ? "drop-shadow(2px 0 0 rgba(200, 75, 143, 0.65)) drop-shadow(-2px 0 0 rgba(31, 182, 193, 0.6))"
              : "none",
            // Per-stanza offset (from QuoteRotator scatter) plus the
            // resolve-shake. Shake adds 6px translateX briefly.
            transform: `translate(calc(${stanzaOffset.x} + ${glitchResolveShake ? "6px" : "0px"}), ${stanzaOffset.y})`,
            transition: glitchResolveShake
              ? "none"
              : "transform 480ms cubic-bezier(0.45, 0.05, 0.4, 0.95)",
          }}
        >
          {lines.map((l) => (
            <div key={l.id} style={{ whiteSpace: "pre-wrap" }}>
              {l.text.slice(0, l.visibleChars)}
              {l.visibleChars < l.total && <span style={{ opacity: 0.5 }}>▋</span>}
            </div>
          ))}
          {/* Glitching subtitle sits under the main stanza. Heavy chromatic
              offset and perpetual character re-scramble make the tagline
              read as unstable — the brand is literally corrupting itself. */}
          {subtitle && (
            <div
              style={{
                marginTop: "1.4em",
                fontFamily: "var(--terminal-font)",
                fontSize: "clamp(14px, 1.5vw, 20px)",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: dim ? "rgba(255, 255, 255, 0.95)" : "var(--ink-soft)",
                whiteSpace: "pre-wrap",
                filter:
                  "drop-shadow(1.5px 0 0 rgba(200, 75, 143, 0.6)) drop-shadow(-1.5px 0 0 rgba(31, 182, 193, 0.55))",
                animation: "slogan-jitter 260ms steps(1) infinite",
              }}
            >
              {subtitle.shown}
            </div>
          )}
          {cursorVisible && lines.length > 0 && !clearing && (
            <div
              style={{
                opacity: cursorBlink ? 1 : 0,
                transition: "opacity 80ms linear",
                marginTop: "0.4em",
                fontSize: "0.6em",
              }}
            >
              ▋
            </div>
          )}
        </div>
      ) : (
        <div
          style={{
            width: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--terminal-font)",
            fontSize: "18px",
            lineHeight: 1.7,
            letterSpacing: "0.08em",
            color: "var(--ink-soft)",
            whiteSpace: "pre",
            textAlign: "center",
          }}
        >
          {lines.map((l) => (
            <div key={l.id}>
              {l.text.slice(0, l.visibleChars)}
              {l.visibleChars < l.total && <span style={{ opacity: 0.5 }}>▋</span>}
            </div>
          ))}
          {cursorVisible && lines.length > 0 && !clearing && (
            <div
              style={{
                opacity: cursorBlink ? 1 : 0,
                transition: "opacity 80ms linear",
              }}
            >
              ▋
            </div>
          )}
        </div>
      )}

      <style>{`
        /* Subtle position jitter on the glitch subtitle — amplifies the
           character re-scramble by making the whole line twitch a pixel
           or two every frame. steps(1) gives a hard, quantized motion. */
        @keyframes slogan-jitter {
          0%   { transform: translate(0, 0); }
          25%  { transform: translate(1px, 0); }
          50%  { transform: translate(-1px, 1px); }
          75%  { transform: translate(0, -1px); }
          100% { transform: translate(0, 0); }
        }
      `}</style>
    </div>
  )
}
