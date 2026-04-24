"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Wakeup } from "./Wakeup"
import { createClock } from "@/lib/experience/clock"
import { sequence, type Cue } from "@/lib/experience/sequence"

/*
 * Experience — top-level client component for The Ablation Study.
 *
 * State machine:
 *   "wakeup"    — subjective blur come-to; first input unlocks
 *   "running"   — master clock active, cues firing against the sequence
 *
 * Phase 1 scope:
 *   - Mount <Wakeup /> first
 *   - On unlock, transition to "running" and start the master clock
 *   - Dispatch cues by t= (currently just logs them; Phases 2+ wire real behavior)
 *
 * The cue dispatcher uses a pointer into the sorted sequence array so
 * each cue fires exactly once as the clock crosses its t.
 */

type Phase = "wakeup" | "running"

export function Experience() {
  const [phase, setPhase] = useState<Phase>("wakeup")
  const [cuesFired, setCuesFired] = useState(0)
  const cursorRef = useRef(0)

  const handleCue = useCallback((cue: Cue) => {
    // Phase 1: log and count. Phases 2+ will replace this with real dispatch
    // into the audio engine, CRT stage, and terminal.
    // eslint-disable-next-line no-console
    console.log(`[cue] t=${cue.t.toFixed(2)} ${cue.type} (${cue.id})`)
    setCuesFired((n) => n + 1)
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

  const handleUnlock = useCallback((_latencyMs: number) => {
    setPhase("running")
  }, [])

  return (
    <main aria-hidden="true">
      {phase === "wakeup" && <Wakeup onUnlock={handleUnlock} />}
      {phase === "running" && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "#000",
            color: "var(--phosphor)",
            fontFamily: "var(--terminal-font)",
            fontSize: "14px",
            padding: "48px",
            opacity: 0.35,
          }}
        >
          {/* Phase 1 placeholder. Confirms the clock + cue dispatcher are alive. */}
          <div>{"> session t=0 established"}</div>
          <div style={{ marginTop: "8px" }}>
            {"> cues fired: "}
            {cuesFired}
          </div>
        </div>
      )}
    </main>
  )
}
