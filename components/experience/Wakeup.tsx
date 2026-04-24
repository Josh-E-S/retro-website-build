"use client"

import { useEffect, useRef, useState } from "react"
import { createAudioEngine, type AudioEngineHandle } from "@/lib/experience/audio/engine"

/*
 * Wakeup — the unlock gate.
 *
 * Amber-on-black pre-start: bigger power button with a pulsing amber
 * glow outline, larger ESTABLISH LINK label below. Amber (not green)
 * reads as institutional/warning-light, not sci-fi — better fit for
 * Choice Industries, and transitions warmly into the cream/ink palette
 * once the player commits.
 *
 * Audio boot:
 *   1. First user input (mousemove/keydown/touchstart) creates the
 *      AudioContext and starts the pre-start bed:
 *         - CMPTKey keyboard-in-another-room loop (gain 0.35)
 *         - AMBSci dark-room creepy ambience (gain 0.28)
 *      Both fade in over 600ms and run until the button is pressed.
 *   2. On button press: play old-keyboard-long as a meaty click,
 *      fade the pre-start bed out over 400ms, and hand the engine
 *      up to Experience after 900ms.
 */

type Props = {
  onUnlock: (responseLatencyMs: number, audio: AudioEngineHandle) => void
}

const LATENCY_STORAGE_KEY = "ablation_response_latency_ms"

// Warning-light amber — sits between yellow and orange. Same value as
// --yellow in globals.css (#d9b24a) but we keep it inline here because
// pre-start has its own palette independent of the main experience.
const AMBER = "#d9b24a"
const AMBER_DEEP = "#a97e1f"
const AMBER_GLOW = "rgba(217, 178, 74, 0.55)"

export function Wakeup({ onUnlock }: Props) {
  const mountedAt = useRef(performance.now())
  const [unlocked, setUnlocked] = useState(false)
  const [pressed, setPressed] = useState(false)
  const engineRef = useRef<Promise<AudioEngineHandle> | null>(null)

  const ensureEngine = (): Promise<AudioEngineHandle> => {
    if (!engineRef.current) {
      engineRef.current = createAudioEngine().then((engine) => {
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
      /* storage off — fine */
    }
    setPressed(true)
    setUnlocked(true)
    void ensureEngine().then((engine) => {
      // Button click SFX — the long keystroke doubles as a satisfying
      // clunk for the power button press.
      engine.playKeystroke("long", { gain: 1.2 })
      engine.stopPreStartLoop(400)
      window.setTimeout(() => onUnlock(latency, engine), 900)
    })
  }

  useEffect(() => {
    if (unlocked) return
    const bootOnInput = () => {
      void ensureEngine()
    }
    window.addEventListener("mousemove", bootOnInput, { once: true, passive: true })
    window.addEventListener("touchstart", bootOnInput, { once: true, passive: true })

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
        color: AMBER,
        fontFamily: "var(--terminal-font)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "36px",
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
          border: `1px solid ${AMBER}`,
          background: pressed
            ? "rgba(217, 178, 74, 0.22)"
            : "rgba(217, 178, 74, 0.06)",
          color: AMBER,
          fontFamily: "var(--terminal-font)",
          width: "180px",
          height: "180px",
          borderRadius: "50%",
          cursor: unlocked ? "default" : "pointer",
          transform: pressed ? "scale(0.95)" : "scale(1)",
          transition:
            "transform 160ms ease-out, background 200ms ease-out, border-color 240ms ease-out",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
          animation: unlocked ? undefined : "amber-pulse 2.2s ease-in-out infinite",
        }}
      >
        <svg
          width="74"
          height="74"
          viewBox="0 0 40 40"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          aria-hidden="true"
          style={{
            filter: `drop-shadow(0 0 6px ${AMBER_GLOW})`,
          }}
        >
          <path d="M13 11 a12 12 0 1 0 14 0" />
          <line x1="20" y1="6" x2="20" y2="20" />
        </svg>
      </button>
      <div
        style={{
          fontSize: "20px",
          letterSpacing: "0.4em",
          textTransform: "uppercase",
          color: AMBER,
          textShadow: `0 0 12px ${AMBER_GLOW}, 0 0 2px ${AMBER_DEEP}`,
          animation: unlocked ? undefined : "amber-text-pulse 2.2s ease-in-out infinite",
        }}
      >
        Establish link
      </div>

      <style>{`
        @keyframes amber-pulse {
          0%, 100% {
            box-shadow:
              0 0 0 1px ${AMBER},
              0 0 16px 2px rgba(217, 178, 74, 0.25),
              0 0 0 0 rgba(217, 178, 74, 0.55),
              0 0 28px rgba(217, 178, 74, 0.15) inset;
            border-color: ${AMBER};
          }
          50% {
            box-shadow:
              0 0 0 2px ${AMBER},
              0 0 34px 6px rgba(217, 178, 74, 0.55),
              0 0 0 10px rgba(217, 178, 74, 0.08),
              0 0 38px rgba(217, 178, 74, 0.3) inset;
            border-color: #f2c85a;
          }
        }
        @keyframes amber-text-pulse {
          0%, 100% { text-shadow: 0 0 8px rgba(217, 178, 74, 0.45), 0 0 2px ${AMBER_DEEP}; }
          50%       { text-shadow: 0 0 22px rgba(217, 178, 74, 0.85), 0 0 3px ${AMBER_DEEP}; }
        }
      `}</style>
    </div>
  )
}
