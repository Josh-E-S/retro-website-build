"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Wakeup } from "./Wakeup"
import { Stage } from "./Stage"
import { Terminal, type TerminalHandle } from "./Terminal"
import { createClock } from "@/lib/experience/clock"
import { sequence, type Cue } from "@/lib/experience/sequence"

/*
 * Experience — top-level client component.
 *
 * State machine:
 *   "wakeup"  — subjective blur come-to; first input unlocks
 *   "running" — Stage mounted; clock drives cues into Terminal + visual state
 *
 * Cue dispatch:
 *   - Sorted sequence is walked with a cursor pointer.
 *   - Each tick, fire every cue whose t has been crossed since last tick.
 *   - Visual cues (typewriter/welcome/processing_dots/screen_clear/cursor_blink)
 *     route into the Terminal via its handle.
 *   - Power-on cue flips the Stage's poweredOn prop.
 *   - Audio cues are no-ops until Phase 3.
 *   - eve_line renders a caption placeholder (silent preview).
 */

type Phase = "wakeup" | "running"

export function Experience() {
  const [phase, setPhase] = useState<Phase>("wakeup")
  const [poweredOn, setPoweredOn] = useState(false)
  const [caption, setCaption] = useState<string | null>(null)
  const terminalRef = useRef<TerminalHandle | null>(null)
  const cursorRef = useRef(0)

  const handleCue = useCallback((cue: Cue) => {
    const term = terminalRef.current
    switch (cue.type) {
      case "crt_power_on":
        setPoweredOn(true)
        break
      case "typewriter":
        if (term) void term.typewriter(cue.lines, cue.cps, cue.holdAfterMs)
        break
      case "processing_dots":
        if (term) void term.showProcessingDots(cue.base, cue.durationMs)
        break
      case "screen_clear":
        if (term) void term.clear()
        break
      case "welcome_block":
        if (term) void term.setCenteredBlock(cue.lines, cue.cps)
        break
      case "cursor_blink":
        if (term) term.showBlinkingCursor(cue.on)
        break
      case "eve_line":
        setCaption(cue.caption)
        // Simulate Eve's line duration — rough estimate until real audio lands.
        // Clear caption after a while so it doesn't stay forever.
        window.setTimeout(
          () => setCaption((c) => (c === cue.caption ? null : c)),
          Math.min(18000, 2500 + cue.caption.length * 55),
        )
        break
      case "audio":
      case "ambient_start":
      case "ambient_dip":
        // Stubbed until audio engine lands.
        break
    }
    // eslint-disable-next-line no-console
    console.log(`[cue] t=${cue.t.toFixed(2)} ${cue.type} (${cue.id})`)
  }, [])

  useEffect(() => {
    if (phase !== "running") return
    const sorted = [...sequence].sort((a, b) => a.t - b.t)
    cursorRef.current = 0
    const clock = createClock((t) => {
      while (
        cursorRef.current < sorted.length &&
        sorted[cursorRef.current].t <= t
      ) {
        handleCue(sorted[cursorRef.current])
        cursorRef.current += 1
      }
    })
    clock.start()
    return () => clock.stop()
  }, [phase, handleCue])

  const handleUnlock = useCallback(() => {
    setPhase("running")
  }, [])

  const handleTerminalReady = useCallback((h: TerminalHandle) => {
    terminalRef.current = h
  }, [])

  return (
    <main aria-hidden="true">
      {phase === "wakeup" && <Wakeup onUnlock={handleUnlock} />}
      {phase === "running" && (
        <Stage poweredOn={poweredOn}>
          <Terminal onReady={handleTerminalReady} />
          {caption && (
            <div
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                bottom: "48px",
                padding: "0 56px",
                fontFamily: "var(--terminal-font)",
                fontSize: "14px",
                lineHeight: 1.5,
                textAlign: "center",
                color: "var(--phosphor)",
                opacity: 0.9,
                zIndex: 2,
                maxWidth: "80ch",
                margin: "0 auto",
              }}
            >
              {caption}
            </div>
          )}
        </Stage>
      )}
    </main>
  )
}
