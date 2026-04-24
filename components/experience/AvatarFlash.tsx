"use client"

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from "react"

/*
 * AvatarFlash — full-viewport avatar video tied to trapped-avatar audio.
 *
 * When flash() is invoked, a random clip from the pool plays muted at
 * 85% peak opacity over the whole frame, fading in over ~1.8s, holding
 * for the remainder of the totalMs window, then fading out over ~500ms.
 * Videos are muted so they don't compete with the trapped-avatar audio
 * sample — the engine owns the sound; the video is the visual.
 *
 * Callers are responsible for pairing flash() with engine.playTrappedAvatar()
 * so the face and the scream land together.
 */

export type AvatarFlashHandle = {
  /** Play a random avatar clip; fade in, hold totalMs total, fade out. */
  flash: (totalMs?: number) => void
}

const FADE_IN_MS = 1800
const FADE_OUT_MS = 500
// Peak opacity when the avatar is fully "in." Low enough that she reads
// as a ghost bleeding through the stage — the terminal, logo, and
// artifacts all remain visible through her. Combined with the screen
// blend below, dark pixels in the video drop out and only the brighter
// areas (face, glitch artifacts) superimpose.
const PEAK_OPACITY = 0.5

const VIDEO_POOL = [
  "/videos/avatar-scream-1.mp4",
  "/videos/avatar-scream-2.mp4",
  "/videos/avatar-scream-3.mp4",
]

export const AvatarFlash = forwardRef<AvatarFlashHandle>(function AvatarFlash(_, ref) {
  const [visible, setVisible] = useState(false)
  const [opacity, setOpacity] = useState(0)
  const [videoSrc, setVideoSrc] = useState<string>(VIDEO_POOL[0])
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const timersRef = useRef<number[]>([])

  const clearTimers = () => {
    timersRef.current.forEach(window.clearTimeout)
    timersRef.current = []
  }

  const flash = useCallback((totalMs = 8000) => {
    clearTimers()
    // Pick a random clip per firing so back-to-back flashes don't reuse
    // the same footage.
    const pick = VIDEO_POOL[Math.floor(Math.random() * VIDEO_POOL.length)]
    setVideoSrc(pick)
    setVisible(true)
    setOpacity(0)

    // Next frame: ramp opacity up and kick playback. The video element
    // re-mounts when visible flips to true, so it starts from t=0.
    requestAnimationFrame(() => {
      setOpacity(PEAK_OPACITY)
      const v = videoRef.current
      if (v) {
        v.currentTime = 0
        // Safari may reject play() if the context didn't permit autoplay
        // — it's muted so this usually succeeds, but we swallow errors.
        void v.play().catch(() => {})
      }
    })

    const holdMs = Math.max(0, totalMs - FADE_IN_MS - FADE_OUT_MS)
    timersRef.current.push(
      window.setTimeout(() => {
        setOpacity(0)
      }, FADE_IN_MS + holdMs),
    )
    timersRef.current.push(
      window.setTimeout(() => {
        setVisible(false)
        const v = videoRef.current
        if (v) try { v.pause() } catch { /* noop */ }
      }, FADE_IN_MS + holdMs + FADE_OUT_MS + 80),
    )
  }, [])

  useImperativeHandle(ref, () => ({ flash }), [flash])

  if (!visible) return null

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        opacity,
        transition: `opacity ${opacity > 0 ? FADE_IN_MS : FADE_OUT_MS}ms ease-out`,
        // Screen blend = dark pixels of the video disappear; only brighter
        // areas (her face + glitch tears) ghost through. Combined with
        // low PEAK_OPACITY, reads as an apparition rather than an overlay.
        mixBlendMode: "screen",
        // Chromatic aberration tightens when she's fully in, wider while
        // she's arriving or leaving — reads as "resolving" / "losing grip."
        filter: opacity >= PEAK_OPACITY * 0.95
          ? "drop-shadow(1px 0 0 rgba(228, 59, 37, 0.45)) drop-shadow(-1px 0 0 rgba(31, 182, 193, 0.4))"
          : "drop-shadow(3px 0 0 rgba(228, 59, 37, 0.65)) drop-shadow(-3px 0 0 rgba(31, 182, 193, 0.6))",
      }}
    >
      <video
        ref={videoRef}
        src={videoSrc}
        autoPlay
        muted
        playsInline
        // No loop — the audio sample is 8s and the video is 5.2s; letting
        // the video end mid-fade is fine, the scream continues without it.
        // If we want to keep her face until the audio finishes, we could
        // loop, but the motion looping looks artificial.
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
          objectPosition: "center",
          display: "block",
        }}
      />
    </div>
  )
})
