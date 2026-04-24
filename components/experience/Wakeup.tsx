"use client"

import { useEffect, useRef, useState } from "react"

/*
 * Wakeup — the subjective come-to sequence that gates the real opening.
 *
 * The player loads the page and sees pure black with a heavy Gaussian blur.
 * Terminal lines fade in through the blur, barely legible. The player's
 * first mousemove (or touchstart on mobile) is the unlock — framed in
 * fiction as "subject response detected." The latency between mount and
 * first input is saved to localStorage as response_latency_ms so later
 * flows can reference it.
 *
 * After the unlock, the blur clears over ~1.2s and onUnlock() fires,
 * which hands control to the sequence dispatcher (t=0).
 *
 * No audio here — AudioContext is still locked until the user gesture.
 * Phase 2 boots the audio engine on unlock.
 */

type Props = {
  onUnlock: (responseLatencyMs: number) => void
}

const LATENCY_STORAGE_KEY = "ablation_response_latency_ms"

// Visual phases keyed off elapsed ms from mount.
// - 0 → 800ms:    pure black, no text
// - 800 → 2600:   first line fades in, still heavily blurred
// - 2600 → 4500:  second line fades in, blur starts releasing
// - 4500 → 6000:  all text readable, blur nearly clear
// - 8000+:        fallback prompt appears if still no input
const FIRST_LINE_AT = 800
const SECOND_LINE_AT = 2600
const BLUR_RELEASE_AT = 3800
const FALLBACK_AT = 8000

export function Wakeup({ onUnlock }: Props) {
  const mountedAt = useRef(performance.now())
  const [elapsed, setElapsed] = useState(0)
  const [unlocked, setUnlocked] = useState(false)
  const [responseDetected, setResponseDetected] = useState(false)

  // Drive visual phases off rAF so blur/opacity animate smoothly without
  // re-rendering on every pixel. We only re-render on phase boundary
  // crossings — the animation itself is CSS.
  useEffect(() => {
    let rafId: number
    const loop = () => {
      setElapsed(performance.now() - mountedAt.current)
      rafId = requestAnimationFrame(loop)
    }
    rafId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(rafId)
  }, [])

  // Invisible unlock: first mousemove or touchstart anywhere fires it.
  useEffect(() => {
    if (unlocked) return
    const handler = () => {
      if (unlocked) return
      const latency = performance.now() - mountedAt.current
      try {
        localStorage.setItem(LATENCY_STORAGE_KEY, String(Math.round(latency)))
      } catch {
        // Private mode / disabled storage — not fatal, just lose the datum.
      }
      setResponseDetected(true)
      setUnlocked(true)
      // Hold the "response detected" flash briefly, then hand off.
      window.setTimeout(() => onUnlock(latency), 1200)
    }
    window.addEventListener("mousemove", handler, { once: true, passive: true })
    window.addEventListener("touchstart", handler, { once: true, passive: true })
    window.addEventListener("keydown", handler, { once: true })
    return () => {
      window.removeEventListener("mousemove", handler)
      window.removeEventListener("touchstart", handler)
      window.removeEventListener("keydown", handler)
    }
  }, [unlocked, onUnlock])

  // Visual state derived from elapsed time.
  const firstLineVisible = elapsed >= FIRST_LINE_AT
  const secondLineVisible = elapsed >= SECOND_LINE_AT
  const showFallback = !unlocked && elapsed >= FALLBACK_AT

  // Blur curve: 40px during wake-up, crashes to 0 on unlock.
  // Before unlock, ease from 40 → 8 as text becomes legible.
  const blurPx = unlocked
    ? 0
    : Math.max(2, 40 - Math.min(1, Math.max(0, (elapsed - BLUR_RELEASE_AT) / 2200)) * 38)

  // Brightness: 0.15 early → 0.9 readable → 1 on unlock.
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
        padding: "48px",
        filter: `blur(${blurPx}px) brightness(${brightness})`,
        transition: unlocked
          ? "filter 1200ms cubic-bezier(0.2, 0.7, 0.2, 1)"
          : "filter 180ms linear",
        willChange: "filter",
        userSelect: "none",
        pointerEvents: "none",
      }}
    >
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
        {responseDetected
          ? "> awaiting subject response … response detected"
          : "> motor-response channel open"}
      </div>

      {showFallback && (
        <div
          style={{
            position: "absolute",
            bottom: "48px",
            left: 0,
            right: 0,
            textAlign: "center",
            opacity: 0.3,
            color: "var(--terminal-dim)",
            fontSize: "12px",
            letterSpacing: "0.1em",
            animation: "wakeup-fallback-fade 800ms ease-out",
          }}
        >
          — move or press any key —
        </div>
      )}

      <style>{`
        @keyframes wakeup-fallback-fade {
          from { opacity: 0; }
          to   { opacity: 0.3; }
        }
      `}</style>
    </div>
  )
}
