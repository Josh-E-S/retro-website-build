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

export type TerminalHandle = {
  /** Show a single stanza, replacing whatever is on screen. Returns when typed. */
  stanza: (
    lines: TerminalLine[],
    opts: { cps: number; size?: StanzaSize; holdAfterMs?: number },
  ) => Promise<void>
  /** Append a log line to the small-log stack (no clear). */
  pushLog: (line: TerminalLine, cps: number) => Promise<void>
  /** Dots cycle on the last log line (for INITIALIZING ... loop). */
  cycleDotsOnLastLog: (base: string, durationMs: number) => Promise<void>
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
  /** When true, push content down so the top-left corner logo never overlaps. */
  avoidCornerLogo?: boolean
  /** Optional keystroke sound hook — called per character during typing. */
  onKeystroke?: (kind: "short" | "long") => void
}

export function Terminal({ onReady, avoidCornerLogo, onKeystroke }: Props) {
  const [mode, setMode] = useState<Mode>("stanza")
  const [size, setSize] = useState<StanzaSize>("display")
  const [lines, setLines] = useState<RenderedLine[]>([])
  const [clearing, setClearing] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(false)
  const [cursorBlink, setCursorBlink] = useState(true)

  const linesRef = useRef<RenderedLine[]>([])
  linesRef.current = lines

  const keystrokeRef = useRef<((kind: "short" | "long") => void) | undefined>(undefined)
  keystrokeRef.current = onKeystroke

  useEffect(() => {
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
        // Fire a short keystroke per character typed — skip whitespace so
        // the audio stays tied to visible key presses.
        const ch = line.text[i - 1]
        if (ch && ch.trim().length > 0) {
          keystrokeRef.current?.("short")
        }
      }
      // Play a "long" keystroke at the end of each line — reads like the
      // return/enter after a completed entry.
      keystrokeRef.current?.("long")
    }

    const fadeOutCurrent = async () => {
      setClearing(true)
      await sleep(280)
      setLines([])
      setClearing(false)
    }

    const handle: TerminalHandle = {
      stanza: (newLines, opts) =>
        enqueue(async () => {
          setMode("stanza")
          setSize(opts.size ?? "display")
          // Replace whatever is on screen with a brief fade first.
          if (linesRef.current.length > 0) await fadeOutCurrent()
          for (const line of newLines) {
            await appendLineAnimated(line, opts.cps)
          }
          if (opts.holdAfterMs) await sleep(opts.holdAfterMs)
        }),
      pushLog: (line, cps) =>
        enqueue(async () => {
          // Switching into log mode clears any stanza on screen first.
          if (mode !== "log") {
            if (linesRef.current.length > 0) await fadeOutCurrent()
            setMode("log")
          }
          await appendLineAnimated(line, cps)
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
      clear: () => enqueue(fadeOutCurrent),
      showBlinkingCursor: (on: boolean) => setCursorVisible(on),
    }
    onReady(handle)
  }, [mode, onReady])

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
        paddingTop: avoidCornerLogo ? "clamp(200px, 22vh, 340px)" : "4vh",
        paddingBottom: avoidCornerLogo ? "clamp(200px, 22vh, 340px)" : "4vh",
        paddingLeft: "8vw",
        paddingRight: "8vw",
        opacity: clearing ? 0 : 1,
        transform: clearing ? "translateY(10px)" : "translateY(0)",
        transition:
          "opacity 280ms ease-out, transform 280ms ease-out, padding 1200ms cubic-bezier(0.65, 0, 0.35, 1)",
        zIndex: 1,
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
            color: size === "display" ? "var(--ink-deep)" : "var(--ink)",
            maxWidth: "24ch",
            textWrap: "balance" as never,
          }}
        >
          {lines.map((l) => (
            <div key={l.id} style={{ whiteSpace: "pre-wrap" }}>
              {l.text.slice(0, l.visibleChars)}
              {l.visibleChars < l.total && <span style={{ opacity: 0.5 }}>▋</span>}
            </div>
          ))}
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
    </div>
  )
}
