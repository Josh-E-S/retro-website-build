"use client"

import { useEffect, useRef, useState } from "react"
import { createAudioEngine, type AudioEngineHandle } from "@/lib/experience/audio/engine"
import { useFlickerText } from "@/lib/experience/use-flicker-text"

/*
 * Wakeup — simple space-to-begin gate.
 *
 *   "idle"  : pure black, title + prompt + blinking cursor.
 *   "done"  : space (or any gesture) pressed. Wakeup fades out, Pentium
 *             boot SFX + CRT power-on fire in the main experience, and
 *             the first CRT beat is the glitch-resolve WELCOME stanza.
 *
 * All the big branding + scramble work now happens on the CRT stage
 * (cream palette), not here. Wakeup's only job is to gate audio on a
 * valid user gesture and hand off cleanly.
 */

type Props = {
  onUnlock: (responseLatencyMs: number, audio: AudioEngineHandle) => void
}

const LATENCY_STORAGE_KEY = "ablation_response_latency_ms"

const AMBER = "#d9b24a"
const AMBER_DEEP = "#a97e1f"
const AMBER_GLOW = "rgba(217, 178, 74, 0.55)"

const TITLE_TEXT = "The Ablation Study"
const PROMPT_TEXT = "Press space bar to begin"

type Phase = "idle" | "done"

export function Wakeup({ onUnlock }: Props) {
  const mountedAt = useRef(performance.now())
  const [phase, setPhase] = useState<Phase>("idle")
  // Title display string — driven by a scramble loop while idle so a
  // few characters re-roll every ~120ms. Reads as "the title is alive
  // / unstable" without being unreadable.
  const engineRef = useRef<Promise<AudioEngineHandle> | null>(null)
  const unlockFiredRef = useRef(false)

  // Independent per-character flicker on title and prompt while idle.
  // Title gets a touch slower / slightly less parallel than the prompt
  // so the two don't sync up.
  const titleDisplay = useFlickerText(TITLE_TEXT, phase === "idle", {
    intervalMin: 380,
    intervalMax: 900,
    parallelChance: 0.28,
  })
  const promptDisplay = useFlickerText(PROMPT_TEXT, phase === "idle", {
    intervalMin: 480,
    intervalMax: 1100,
    parallelChance: 0.22,
  })

  const ensureEngine = (): Promise<AudioEngineHandle> => {
    if (!engineRef.current) {
      engineRef.current = createAudioEngine()
    }
    return engineRef.current
  }

  const triggerUnlock = () => {
    if (unlockFiredRef.current) return
    unlockFiredRef.current = true
    const latency = performance.now() - mountedAt.current
    try {
      localStorage.setItem(LATENCY_STORAGE_KEY, String(Math.round(latency)))
    } catch {
      /* storage off — fine */
    }
    setPhase("done")
    void ensureEngine().then((engine) => {
      // Hand off near-immediately so the audio engine + Experience's
      // power-on stack fire while the Wakeup is still mid-fade. The
      // visual side staggers itself: black hold → intro video fades in
      // slowly → music slowly fades up. Audio leads, video follows.
      window.setTimeout(() => onUnlock(latency, engine), 240)
    })
  }

  // Idle-phase input: any gesture (space / any key / pointer / touch)
  // triggers unlock. Space is the advertised path but we accept anything.
  useEffect(() => {
    if (phase !== "idle") return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Spacebar" || e.code === "Space") {
        e.preventDefault()
      }
      triggerUnlock()
    }
    const onAny = () => triggerUnlock()
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", onAny)
    window.addEventListener("touchstart", onAny, { passive: true })
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", onAny)
      window.removeEventListener("touchstart", onAny)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  const screenOpacity = phase === "done" ? 0 : 1

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
        gap: "0px",
        userSelect: "none",
        opacity: screenOpacity,
        transition: "opacity 1000ms ease-out",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: "clamp(40px, 5.5vw, 68px)",
          fontWeight: 700,
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: AMBER,
          textShadow: `0 0 12px ${AMBER_GLOW}, 0 0 2px ${AMBER_DEEP}`,
          animation: "amber-text-pulse 2.6s ease-in-out infinite",
          whiteSpace: "pre",
        }}
      >
        {titleDisplay}
      </div>

      <div
        style={{
          fontSize: "clamp(18px, 1.8vw, 22px)",
          letterSpacing: "0.42em",
          textTransform: "uppercase",
          color: AMBER,
          textShadow: `0 0 10px ${AMBER_GLOW}`,
          // No more global blink — the per-character flicker carries the
          // "alive" feel. Keeping whiteSpace: pre so spaces don't collapse
          // when individual chars swap to glyphs.
          whiteSpace: "pre",
        }}
      >
        {promptDisplay}
      </div>

      <div
        aria-hidden="true"
        style={{
          marginTop: "40px",
          width: "26px",
          height: "50px",
          background: AMBER,
          boxShadow: `0 0 14px ${AMBER_GLOW}, 0 0 4px ${AMBER_DEEP}`,
          animation: "wakeup-cursor-blink 1.1s steps(1) infinite",
        }}
      />

      <style>{`
        @keyframes amber-text-pulse {
          0%, 100% { text-shadow: 0 0 8px rgba(217, 178, 74, 0.45), 0 0 2px ${AMBER_DEEP}; }
          50%       { text-shadow: 0 0 22px rgba(217, 178, 74, 0.85), 0 0 3px ${AMBER_DEEP}; }
        }
        @keyframes amber-prompt-blink {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        @keyframes wakeup-cursor-blink {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
