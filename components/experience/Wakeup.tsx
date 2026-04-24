"use client"

import { useEffect, useRef, useState } from "react"
import { createAudioEngine, type AudioEngineHandle } from "@/lib/experience/audio/engine"

/*
 * Wakeup — the unlock gate.
 *
 * Pure black screen. Power button + ESTABLISH LINK label visible from
 * the moment the page loads. Keyboard and touch also unlock as a fallback.
 *
 * Audio boot strategy:
 *   1. Engine is created on the *first* user input (mousemove, keydown,
 *      touchstart) — this is a valid user gesture so the AudioContext
 *      can start running. At this point we start the pre-start keyboard
 *      loop at low volume. The player hears "someone is typing in
 *      another room" while they decide whether to press the button.
 *   2. On the button press (or any other input after the first), the
 *      pre-start loop fades out and the engine handle is passed up to
 *      Experience via onUnlock. The main experience takes over.
 *
 * Latency from mount to first input persists to localStorage as
 * response_latency_ms.
 */

type Props = {
  onUnlock: (responseLatencyMs: number, audio: AudioEngineHandle) => void
}

const LATENCY_STORAGE_KEY = "ablation_response_latency_ms"

export function Wakeup({ onUnlock }: Props) {
  const mountedAt = useRef(performance.now())
  const [unlocked, setUnlocked] = useState(false)
  const [pressed, setPressed] = useState(false)
  // Engine is created on first input (any gesture); stored here so the
  // button press can reuse the same instance for the handoff to Experience.
  const engineRef = useRef<Promise<AudioEngineHandle> | null>(null)

  const ensureEngine = (): Promise<AudioEngineHandle> => {
    if (!engineRef.current) {
      engineRef.current = createAudioEngine().then((engine) => {
        // Kick the pre-start keyboard-in-another-room loop as soon as
        // the engine is ready. If the player is quick, they may press
        // the button before this resolves — that's fine, the loop just
        // never audibly started.
        engine.startPreStartLoop(600)
        return engine
      })
    }
    return engineRef.current
  }

  const triggerUnlock = () => {
    if (unlocked) return
    const latency = performance.now() - mountedAt.current
    try {
      localStorage.setItem(LATENCY_STORAGE_KEY, String(Math.round(latency)))
    } catch {
      // storage disabled — fine
    }
    setPressed(true)
    setUnlocked(true)
    // Reuse or create the engine; stop the pre-start loop; hand off.
    void ensureEngine().then((engine) => {
      engine.stopPreStartLoop(400)
      window.setTimeout(() => onUnlock(latency, engine), 900)
    })
  }

  useEffect(() => {
    if (unlocked) return
    // Boot the engine on any input so the pre-start loop starts before
    // the user commits to the button. These handlers run once each and
    // only matter until triggerUnlock fires.
    const bootOnInput = () => {
      void ensureEngine()
    }
    window.addEventListener("mousemove", bootOnInput, { once: true, passive: true })
    window.addEventListener("touchstart", bootOnInput, { once: true, passive: true })

    // Keyboard + touch also fully unlock as a fallback path.
    const unlockOnInput = () => triggerUnlock()
    window.addEventListener("keydown", unlockOnInput, { once: true })
    window.addEventListener("touchstart", unlockOnInput, { once: true, passive: true })
    return () => {
      window.removeEventListener("mousemove", bootOnInput)
      window.removeEventListener("touchstart", bootOnInput)
      window.removeEventListener("keydown", unlockOnInput)
      window.removeEventListener("touchstart", unlockOnInput)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        color: "rgba(236, 232, 220, 0.85)",
        fontFamily: "var(--terminal-font)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "20px",
        userSelect: "none",
        opacity: unlocked ? 0 : 1,
        transition: "opacity 700ms ease-out",
      }}
    >
      <button
        onClick={triggerUnlock}
        disabled={unlocked}
        aria-label="Establish link"
        style={{
          appearance: "none",
          border: "1px solid rgba(236, 232, 220, 0.3)",
          background: pressed
            ? "rgba(236, 232, 220, 0.14)"
            : "rgba(236, 232, 220, 0.04)",
          color: "rgba(236, 232, 220, 0.9)",
          fontFamily: "var(--terminal-font)",
          width: "120px",
          height: "120px",
          borderRadius: "50%",
          cursor: unlocked ? "default" : "pointer",
          opacity: pressed ? 1 : 0.85,
          transform: pressed ? "scale(0.96)" : "scale(1)",
          transition:
            "transform 160ms ease-out, background 200ms ease-out, box-shadow 200ms ease-out",
          boxShadow: pressed
            ? "0 0 0 2px rgba(236, 232, 220, 0.3), 0 0 28px rgba(236, 232, 220, 0.22) inset"
            : "0 0 0 1px rgba(236, 232, 220, 0.08), 0 0 22px rgba(236, 232, 220, 0.1) inset",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          animation: unlocked ? undefined : "btn-breathe 3.2s ease-in-out infinite",
        }}
      >
        <svg
          width="44"
          height="44"
          viewBox="0 0 40 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          aria-hidden="true"
        >
          <path d="M13 11 a12 12 0 1 0 14 0" />
          <line x1="20" y1="6" x2="20" y2="20" />
        </svg>
      </button>
      <div
        style={{
          fontSize: "11px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          opacity: 0.6,
        }}
      >
        Establish link
      </div>

      <style>{`
        @keyframes btn-breathe {
          0%, 100% { box-shadow: 0 0 0 1px rgba(236,232,220,0.08), 0 0 22px rgba(236,232,220,0.1) inset; }
          50%       { box-shadow: 0 0 0 1px rgba(236,232,220,0.14), 0 0 28px rgba(236,232,220,0.18) inset; }
        }
      `}</style>
    </div>
  )
}
