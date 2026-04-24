"use client"

import { useEffect, useRef, useState } from "react"

/*
 * Terminal — the typewriter surface inside the CRT.
 *
 * Exposes an imperative-ish API through props: the parent (Experience) calls
 * `pushTypewriter` / `clearScreen` / `setCenteredBlock` via a ref when cues
 * fire. Each rendered line is a string; typewriter progress lives in state.
 *
 * Left-aligned blocks stack from the top. Centered blocks replace the
 * visible lines (welcome screen). A clear cue fades the current content
 * out with a 10px vertical roll, then the next block starts from a clean
 * surface.
 */

export type TerminalLine = {
  id: string
  text: string
  centered?: boolean
  // Per-character timing overrides expressed as a map of charIndex → ms
  // added to that character's base delay. Used for the intentional
  // irregularities (ONLINE 150ms hitch, 848 digit pacing).
  charDelays?: Record<number, number>
}

export type TerminalHandle = {
  typewriter: (lines: TerminalLine[], cps: number, holdAfterMs?: number) => Promise<void>
  clear: () => Promise<void>
  setCenteredBlock: (lines: TerminalLine[], cps: number) => Promise<void>
  showProcessingDots: (base: string, ms: number) => Promise<void>
  showBlinkingCursor: (on: boolean) => void
}

type RenderedLine = {
  id: string
  text: string
  visibleChars: number
  centered: boolean
  total: number
}

type Props = {
  onReady: (handle: TerminalHandle) => void
}

export function Terminal({ onReady }: Props) {
  const [lines, setLines] = useState<RenderedLine[]>([])
  const [clearing, setClearing] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(false)
  const [cursorBlink, setCursorBlink] = useState(true)

  // Ref for the handle — we want a stable object the parent can call.
  const handleRef = useRef<TerminalHandle | null>(null)
  const linesRef = useRef<RenderedLine[]>([])
  linesRef.current = lines

  useEffect(() => {
    const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

    const typeLine = async (line: TerminalLine, cps: number): Promise<void> => {
      const perChar = 1000 / cps
      const total = line.text.length
      setLines((prev) => [
        ...prev,
        { id: line.id, text: line.text, visibleChars: 0, centered: !!line.centered, total },
      ])
      for (let i = 1; i <= total; i++) {
        const extra = line.charDelays?.[i - 1] ?? 0
        await sleep(perChar + extra)
        setLines((prev) =>
          prev.map((l) => (l.id === line.id ? { ...l, visibleChars: i } : l)),
        )
      }
    }

    const handle: TerminalHandle = {
      typewriter: async (newLines, cps, holdAfterMs) => {
        for (const line of newLines) {
          await typeLine(line, cps)
        }
        if (holdAfterMs) await sleep(holdAfterMs)
      },
      clear: async () => {
        setClearing(true)
        await sleep(300)
        setLines([])
        setClearing(false)
      },
      setCenteredBlock: async (newLines, cps) => {
        setLines([])
        for (const line of newLines) {
          await typeLine({ ...line, centered: true }, cps)
        }
      },
      showProcessingDots: async (base, ms) => {
        const id = `dots_${base}`
        const start = performance.now()
        // If a line with this id already exists, drive it. Otherwise create it.
        setLines((prev) => {
          if (prev.some((l) => l.id === id)) return prev
          return [...prev, { id, text: base, visibleChars: base.length, centered: false, total: base.length }]
        })
        const variants = [".", "..", "..."]
        let idx = 0
        while (performance.now() - start < ms) {
          const dots = variants[idx % variants.length]
          const text = base + " " + dots
          setLines((prev) =>
            prev.map((l) =>
              l.id === id ? { ...l, text, visibleChars: text.length, total: text.length } : l,
            ),
          )
          idx += 1
          await sleep(300)
        }
      },
      showBlinkingCursor: (on: boolean) => {
        setCursorVisible(on)
      },
    }
    handleRef.current = handle
    onReady(handle)
  }, [onReady])

  // Cursor blink at 1Hz.
  useEffect(() => {
    if (!cursorVisible) return
    const id = window.setInterval(() => setCursorBlink((v) => !v), 500)
    return () => window.clearInterval(id)
  }, [cursorVisible])

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "48px 56px",
        fontFamily: "var(--terminal-font)",
        fontSize: "16px",
        lineHeight: 1.5,
        letterSpacing: "0.02em",
        transform: clearing ? "translateY(10px)" : "translateY(0)",
        opacity: clearing ? 0 : 1,
        transition: "transform 300ms ease-out, opacity 300ms ease-out",
        zIndex: 1,
      }}
    >
      {lines.map((l) => (
        <div
          key={l.id}
          style={{
            textAlign: l.centered ? "center" : "left",
            whiteSpace: "pre",
          }}
        >
          {l.text.slice(0, l.visibleChars)}
          {l.visibleChars < l.total && <span style={{ opacity: 0.6 }}>▋</span>}
        </div>
      ))}
      {cursorVisible && lines.length > 0 && !clearing && (
        <div
          style={{
            textAlign: lines[lines.length - 1]?.centered ? "center" : "left",
            opacity: cursorBlink ? 1 : 0,
            transition: "opacity 80ms linear",
            marginTop: "4px",
          }}
        >
          ▋
        </div>
      )}
    </div>
  )
}
