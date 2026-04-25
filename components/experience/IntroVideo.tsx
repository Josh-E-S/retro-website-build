"use client"

import { useEffect, useRef, useState } from "react"
import { withBase } from "@/lib/base-path"

/*
 * IntroVideo — full-viewport intro footage at 50% opacity.
 *
 * Pacing intentionally matches "waking up." From mount:
 *   0 → 5000ms : pure black (opacity 0). Just sounds.
 *   5000 → 8000ms : slow fade up to 0.5 opacity over 3s.
 *
 * Plays muted on loop. Audio for this phase comes from the engine —
 * the video is silent on purpose.
 */

const FADE_DELAY_MS = 5000
const FADE_IN_MS = 3000
const PEAK_OPACITY = 0.5

export function IntroVideo() {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const [opacity, setOpacity] = useState(0)

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    void v.play().catch(() => {})
    // Hold black for the full delay, then ramp opacity up.
    const id = window.setTimeout(() => setOpacity(PEAK_OPACITY), FADE_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [])

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 2,
        opacity,
        transition: `opacity ${FADE_IN_MS}ms ease-out`,
        pointerEvents: "none",
      }}
    >
      <video
        ref={videoRef}
        src={withBase("/videos/intro.mp4")}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
          filter: "brightness(0.65) contrast(1.1)",
        }}
      />
    </div>
  )
}
