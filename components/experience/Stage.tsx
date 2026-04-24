"use client"

import { useEffect, useState, type ReactNode } from "react"
import { AnimatedNoise } from "./AnimatedNoise"

/*
 * Stage — the CRT frame the post-unlock experience lives inside.
 *
 * Layer stack, back to front:
 *   1. Phosphor backdrop (near-black with faint green cast)
 *   2. children (the terminal renders here)
 *   3. Scanlines (repeating horizontal dark lines)
 *   4. Rolling interlace band (drifts up every ~8s)
 *   5. Random single-frame tear (~once every 30s)
 *   6. Animated noise grain
 *   7. Corner vignette
 *   8. Chromatic aberration is achieved via a CSS filter on the whole
 *      container so red/blue fringes land on all bright pixels, not
 *      manually per-element.
 *
 * Power-on animation: the whole viewport opens from a single pixel
 *   → horizontal line → rectangle → full screen over ~450ms. Controlled
 *   by the `poweredOn` prop so the parent can gate it on a cue.
 */

type Props = {
  poweredOn: boolean
  children: ReactNode
}

export function Stage({ poweredOn, children }: Props) {
  // Rolling band: drifts from bottom to top over ~1.6s, every ~8s.
  const [bandKey, setBandKey] = useState(0)
  useEffect(() => {
    if (!poweredOn) return
    const id = window.setInterval(() => {
      setBandKey((n) => n + 1)
    }, 8000)
    return () => window.clearInterval(id)
  }, [poweredOn])

  // Screen tear: random single-frame horizontal shift, ~once every 30s.
  const [tearY, setTearY] = useState<number | null>(null)
  useEffect(() => {
    if (!poweredOn) return
    let timeoutId: number
    const schedule = () => {
      const delay = 22000 + Math.random() * 16000
      timeoutId = window.setTimeout(() => {
        setTearY(Math.random() * 100)
        window.setTimeout(() => setTearY(null), 90)
        schedule()
      }, delay)
    }
    schedule()
    return () => window.clearTimeout(timeoutId)
  }, [poweredOn])

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#040604",
        overflow: "hidden",
        // Chromatic aberration — subtle red/blue fringes.
        // Applied as a drop-shadow stack on the container so bright pixels
        // pick up both channels at slight offsets.
        filter: poweredOn
          ? "drop-shadow(1px 0 0 rgba(255, 40, 40, 0.35)) drop-shadow(-1px 0 0 rgba(40, 80, 255, 0.35))"
          : "none",
      }}
    >
      {/* Power-on clip + brightness. The whole content gets clipped from a
          single central pixel outward, then brightness ramps up to 1.  */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: poweredOn
            ? "inset(0 0 0 0)"
            : "inset(50% 50% 50% 50%)",
          transition: "clip-path 450ms cubic-bezier(0.2, 0.7, 0.2, 1)",
          opacity: poweredOn ? 1 : 0,
          background: "#040604",
        }}
      >
        {/* Phosphor glow layer — very soft green wash behind content. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at center, rgba(51, 255, 102, 0.04) 0%, rgba(51, 255, 102, 0) 60%)",
            pointerEvents: "none",
          }}
        />

        {/* Content layer */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            color: "var(--phosphor)",
            textShadow:
              "0 0 4px rgba(51, 255, 102, 0.6), 0 0 12px rgba(51, 255, 102, 0.25)",
            transform: tearY !== null ? "translateX(6px)" : "translateX(0)",
            transition: tearY !== null ? "none" : "transform 120ms",
          }}
        >
          {children}
        </div>

        {/* Scanlines */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(0,0,0,0) 0px, rgba(0,0,0,0) 2px, rgba(0,0,0,0.45) 2px, rgba(0,0,0,0.45) 3px)",
            mixBlendMode: "multiply",
            zIndex: 2,
          }}
        />

        {/* Rolling interlace band */}
        <div
          key={bandKey}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "60px",
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.035) 50%, rgba(255,255,255,0) 100%)",
            mixBlendMode: "screen",
            zIndex: 3,
            animation: "crt-band-drift 1800ms linear",
            top: "100%",
          }}
        />

        {/* Noise grain */}
        <AnimatedNoise opacity={0.08} />

        {/* Vignette */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at center, rgba(0,0,0,0) 55%, rgba(0,0,0,0.45) 100%)",
            zIndex: 4,
          }}
        />

        {/* Screen tear overlay */}
        {tearY !== null && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${tearY}%`,
              height: "2px",
              background: "rgba(51, 255, 102, 0.8)",
              boxShadow: "0 0 8px rgba(51, 255, 102, 0.6)",
              pointerEvents: "none",
              zIndex: 5,
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes crt-band-drift {
          from { top: 100%; }
          to   { top: -60px; }
        }
      `}</style>
    </div>
  )
}
