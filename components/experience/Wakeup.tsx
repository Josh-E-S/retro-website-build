"use client"

import { useEffect, useRef, useState } from "react"

/*
 * Wakeup — the unlock gate.
 *
 * Pure black screen. Power button + ESTABLISH LINK label visible from
 * the moment the page loads. Keyboard and touch also unlock as a
 * fallback. First input (click, key, touch) wins.
 *
 * On press, the button briefly flashes and we notify the parent after
 * 1.2s so the Stage's power-on animation can overlap with the hand-off.
 *
 * Latency from mount to first input persists to localStorage as
 * response_latency_ms for later flows to reference.
 */

type Props = {
  onUnlock: (responseLatencyMs: number) => void
}

const LATENCY_STORAGE_KEY = "ablation_response_latency_ms"

export function Wakeup({ onUnlock }: Props) {
  const mountedAt = useRef(performance.now())
  const [unlocked, setUnlocked] = useState(false)
  const [pressed, setPressed] = useState(false)

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
    window.setTimeout(() => onUnlock(latency), 900)
  }

  useEffect(() => {
    if (unlocked) return
    const handler = () => triggerUnlock()
    window.addEventListener("keydown", handler, { once: true })
    window.addEventListener("touchstart", handler, { once: true, passive: true })
    return () => {
      window.removeEventListener("keydown", handler)
      window.removeEventListener("touchstart", handler)
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
