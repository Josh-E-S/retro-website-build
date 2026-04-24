"use client"

import { useEffect, useRef, useState } from "react"

/*
 * Wakeup — the subjective come-to sequence that gates the real opening.
 *
 * The page loads to pure black with a heavy Gaussian blur. Two dim
 * terminal lines fade in through the haze. Center-screen, a small
 * circular "ESTABLISH LINK" button fades up as the blur clears — the
 * unlock is diegetic and clickable, framed as a desk intercom / comms
 * panel the candidate is pressing to confirm the connection.
 *
 * Keyboard + touch also unlock, so the player can still just press any
 * key. The first input (click, key, or touch) wins.
 *
 * The latency between mount and first input is saved to localStorage
 * as response_latency_ms for later flows to reference.
 */

type Props = {
  onUnlock: (responseLatencyMs: number) => void
}

const LATENCY_STORAGE_KEY = "ablation_response_latency_ms"

const FIRST_LINE_AT = 800
const SECOND_LINE_AT = 2600
const BUTTON_VISIBLE_AT = 3200
const BLUR_RELEASE_AT = 3800

export function Wakeup({ onUnlock }: Props) {
  const mountedAt = useRef(performance.now())
  const [elapsed, setElapsed] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [pressed, setPressed] = useState(false)

  useEffect(() => {
    let rafId: number
    const loop = () => {
      setElapsed(performance.now() - mountedAt.current)
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  const triggerUnlock = () => {
    if (unlocked) return
    const latency = performance.now() - mountedAt.current
    try {
      localStorage.setItem(LATENCY_STORAGE_KEY, String(Math.round(latency)))
    } catch {
      // storage disabled / private mode — not fatal
    }
    setPressed(true)
    setUnlocked(true)
    window.setTimeout(() => onUnlock(latency), 1200)
  }

  // Keyboard + touch fallback so the player doesn't *have* to aim at the button.
  useEffect(() => {
    if (unlocked) return
    const handler = () => triggerUnlock()
    window.addEventListener("keydown", handler, { once: true })
    window.addEventListener("touchstart", handler, { once: true, passive: true })
    return () => {
      window.removeEventListener("keydown", handler)
      window.removeEventListener("touchstart", handler)
    }
    // triggerUnlock intentionally re-referenced; fine since handler is one-shot.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unlocked])

  const firstLineVisible = elapsed >= FIRST_LINE_AT
  const secondLineVisible = elapsed >= SECOND_LINE_AT
  const buttonVisible = elapsed >= BUTTON_VISIBLE_AT

  const blurPx = unlocked
    ? 0
    : Math.max(2, 40 - Math.min(1, Math.max(0, (elapsed - BLUR_RELEASE_AT) / 2200)) * 38)

  const brightness = unlocked
    ? 1
    : 0.15 + Math.min(1, Math.max(0, (elapsed - FIRST_LINE_AT) / 5000)) * 0.75

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        color: "var(--terminal-dim)",
        fontFamily: "var(--terminal-font)",
        fontSize: "14px",
        lineHeight: 1.4,
        filter: `blur(${blurPx}px) brightness(${brightness})`,
        transition: unlocked
          ? "filter 1200ms cubic-bezier(0.2, 0.7, 0.2, 1)"
          : "filter 180ms linear",
        willChange: "filter",
        userSelect: "none",
      }}
    >
      {/* Diagnostic lines top-left. Stay dim through the whole wakeup. */}
      <div style={{ position: "absolute", top: "48px", left: "48px" }}>
        <div
          style={{
            opacity: firstLineVisible ? 0.55 : 0,
            transition: "opacity 1400ms ease-out",
          }}
        >
          {"> awaiting subject response …"}
        </div>
        <div
          style={{
            opacity: secondLineVisible ? 0.55 : 0,
            transition: "opacity 1400ms ease-out",
            marginTop: "8px",
          }}
        >
          {pressed
            ? "> response detected"
            : "> motor-response channel open"}
        </div>
      </div>

      {/* Center button. Fades in after the second line lands. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "20px",
        }}
      >
        <button
          onClick={triggerUnlock}
          disabled={unlocked}
          aria-label="Establish link"
          style={{
            appearance: "none",
            border: "1px solid rgba(236, 232, 220, 0.25)",
            background: pressed
              ? "rgba(236, 232, 220, 0.12)"
              : "rgba(236, 232, 220, 0.04)",
            color: "rgba(236, 232, 220, 0.85)",
            fontFamily: "var(--terminal-font)",
            width: "112px",
            height: "112px",
            borderRadius: "50%",
            cursor: unlocked ? "default" : "pointer",
            opacity: buttonVisible ? (pressed ? 1 : 0.78) : 0,
            transform: pressed ? "scale(0.96)" : "scale(1)",
            transition:
              "opacity 1200ms ease-out, transform 160ms ease-out, background 200ms ease-out",
            boxShadow: pressed
              ? "0 0 0 2px rgba(236, 232, 220, 0.18), 0 0 24px rgba(236, 232, 220, 0.18) inset"
              : "0 0 0 2px rgba(236, 232, 220, 0.06), 0 0 18px rgba(236, 232, 220, 0.08) inset",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
          }}
        >
          {/* Power glyph */}
          <svg
            width="40"
            height="40"
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
            opacity: buttonVisible ? 0.5 : 0,
            transition: "opacity 1200ms ease-out",
            fontSize: "11px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
          }}
        >
          Establish link
        </div>
      </div>
    </div>
  )
}
