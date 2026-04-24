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
 *   - stanza       → Terminal.stanza (large centered, replaces screen)
 *   - log_line     → Terminal.pushLog (small left-aligned stack)
 *   - log_dots     → Terminal.cycleDotsOnLastLog
 *   - clear        → Terminal.clear
 *   - cursor_blink → Terminal.showBlinkingCursor
 *   - eve_line     → Terminal.stanza (no audio yet — Phase 3)
 *   - crt_power_on → Stage poweredOn
 *   - audio / ambient_*  → no-ops until Phase 3
 */

type Phase = "wakeup" | "running"

export function Experience() {
  const [phase, setPhase] = useState<Phase>("wakeup")
  const [poweredOn, setPoweredOn] = useState(false)
  const terminalRef = useRef<TerminalHandle | null>(null)
  const cursorRef = useRef(0)

  const handleCue = useCallback((cue: Cue) => {
    const term = terminalRef.current
    switch (cue.type) {
      case "crt_power_on":
        setPoweredOn(true)
        break
      case "stanza":
        if (term) void term.stanza(cue.lines, {
          cps: cue.cps,
          size: cue.size,
          holdAfterMs: cue.holdAfterMs,
        })
        break
      case "log_line":
        if (term) void term.pushLog(cue.line, cue.cps)
        break
      case "log_dots":
        if (term) void term.cycleDotsOnLastLog(cue.base, cue.durationMs)
        break
      case "clear":
        if (term) void term.clear()
        break
      case "cursor_blink":
        if (term) term.showBlinkingCursor(cue.on)
        break
      case "eve_line":
        if (term) void term.stanza(
          cue.textLines.map((text, i) => ({ id: `${cue.id}_${i}`, text })),
          { cps: cue.cps, size: "display", holdAfterMs: cue.holdAfterMs },
        )
        break
      case "audio":
      case "ambient_start":
      case "ambient_dip":
        // Stubbed until Phase 3 audio engine.
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
        </Stage>
      )}
    </main>
  )
}
