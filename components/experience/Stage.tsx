"use client"

import { useEffect, useState, type ReactNode } from "react"
import { AnimatedNoise } from "./AnimatedNoise"

/*
 * Stage — the CRT frame the post-unlock experience lives inside.
 *
 * Palette: cream/ink. Choice Industries reads as institutional, not
 * spaceship. The CRT is a desk terminal in an office. Scanlines are
 * subtle dark ink bands over paper, the glow is a soft ink smudge,
 * and the "chromatic aberration" is a print-offset registration shift
 * (cyan/magenta) rather than phosphor fringes.
 *
 * Layer stack:
 *   1. Paper backdrop (warm radial wash)
 *   2. children (terminal)
 *   3. Scanlines (subtle dark ink bands, multiply)
 *   4. Rolling interlace band (soft brightening drift every ~8s)
 *   5. Occasional screen tear
 *   6. Animated noise (paper grain)
 *   7. Corner vignette
 */

type Props = {
  poweredOn: boolean
  children: ReactNode
}

export function Stage({ poweredOn, children }: Props) {
  const [bandKey, setBandKey] = useState(0)
  useEffect(() => {
    if (!poweredOn) return
    const id = window.setInterval(() => {
      setBandKey((n) => n + 1)
    }, 8000)
    return () => window.clearInterval(id)
  }, [poweredOn])

  const [tearY, setTearY] = useState<number | null>(null)
  useEffect(() => {
    if (!poweredOn) return
    let timeoutId: number
    const schedule = () => {
      const delay = 22000 + Math.random() * 16000
      timeoutId = window.setTimeout(() => {
        setTearY(Math.random() * 100)
        window.setTimeout(() => setTearY(null), 80)
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
        background: "#000",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          clipPath: poweredOn ? "inset(0 0 0 0)" : "inset(50% 50% 50% 50%)",
          transition: "clip-path 520ms cubic-bezier(0.2, 0.7, 0.2, 1)",
          opacity: poweredOn ? 1 : 0,
        }}
      >
        {/* Paper base */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.55) 0%, transparent 55%), radial-gradient(ellipse at 50% 110%, var(--paper-deep) 0%, var(--paper) 60%)",
          }}
        />

        {/* Content layer. Print-registration offset gives a subtle CMYK
            ghost on body text without the phosphor-style glow of green CRTs. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            color: "var(--ink)",
            textShadow:
              "0.6px 0 0 rgba(200, 75, 143, 0.32), -0.6px 0 0 rgba(31, 182, 193, 0.3)",
            transform: tearY !== null ? "translateX(4px)" : "translateX(0)",
            transition: tearY !== null ? "none" : "transform 120ms",
          }}
        >
          {children}
        </div>

        {/* Scanlines — dark ink bands, multiplied so they stay subtle on paper. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            backgroundImage:
              "repeating-linear-gradient(to bottom, rgba(31,42,55,0.07) 0px, rgba(31,42,55,0.07) 1px, transparent 1px, transparent 3px)",
            mixBlendMode: "multiply",
            zIndex: 2,
          }}
        />

        {/* Rolling band — soft brightening wash drifting up. */}
        <div
          key={bandKey}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            height: "80px",
            pointerEvents: "none",
            background:
              "linear-gradient(to bottom, rgba(255,255,255,0) 0%, rgba(255,255,255,0.14) 50%, rgba(255,255,255,0) 100%)",
            mixBlendMode: "screen",
            zIndex: 3,
            animation: "crt-band-drift 2200ms linear",
            top: "100%",
          }}
        />

        {/* Noise — paper grain */}
        <AnimatedNoise opacity={0.05} />

        {/* Vignette — warm ink corners */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "radial-gradient(ellipse at center, transparent 55%, rgba(31,42,55,0.12) 90%, rgba(31,42,55,0.22) 100%)",
            zIndex: 4,
          }}
        />

        {/* Subtle flicker — near-imperceptible */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            zIndex: 5,
            background: "rgba(255,255,255,0)",
            animation: "crt-flicker 5.3s infinite steps(1)",
            mixBlendMode: "multiply",
          }}
        />

        {/* Tear line */}
        {tearY !== null && (
          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: `${tearY}%`,
              height: "1px",
              background: "rgba(31,42,55,0.5)",
              boxShadow: "0 0 6px rgba(31,42,55,0.35)",
              pointerEvents: "none",
              zIndex: 6,
            }}
          />
        )}
      </div>

      <style>{`
        @keyframes crt-band-drift {
          from { top: 100%; }
          to   { top: -80px; }
        }
        @keyframes crt-flicker {
          0%, 100% { background: rgba(255,255,255,0); }
          47% { background: rgba(255,255,255,0); }
          48% { background: rgba(31,42,55,0.04); }
          49% { background: rgba(255,255,255,0); }
          72% { background: rgba(255,255,255,0); }
          73% { background: rgba(255,255,255,0.05); }
          74% { background: rgba(255,255,255,0); }
        }
      `}</style>
    </div>
  )
}
