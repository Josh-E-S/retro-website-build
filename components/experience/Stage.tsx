"use client"

import { useEffect, useState, type ReactNode } from "react"
import { AnimatedNoise } from "./AnimatedNoise"

/*
 * Stage — the CRT frame the post-unlock experience lives inside.
 *
 * Power-on animation (plays once on mount):
 *   0ms   — tiny bright horizontal line at screen center
 *   140ms — line stretches to ~40% width
 *   240ms — line reaches ~95% width, tube voltage bloom
 *   400ms — image snaps open vertically into a thin rectangle
 *   560ms — rectangle expands to full screen, one hard flicker
 *   760ms — stable
 *
 * Layer stack, back to front:
 *   1. Paper backdrop (warm radial wash)
 *   2. children (Terminal, Artifacts, etc.)
 *   3. Scanlines
 *   4. Rolling interlace band
 *   5. Occasional screen tear
 *   6. Animated noise (paper grain)
 *   7. Corner vignette
 *   8. Subtle flicker
 */

type Props = {
  children: ReactNode
  /**
   * "intro" dims the paper backdrop slightly so the intro video reads
   * stronger without competing with the cream surface. "running" leaves
   * the paper at full brightness for normal terminal text legibility.
   */
  dim?: boolean
}

type PowerStage = 0 | 1 | 2 | 3 | 4

export function Stage({ children, dim = false }: Props) {
  const [stage, setStage] = useState<PowerStage>(0)

  // Drive the power-on stages via chained timeouts. Each stage sets a
  // data attribute the CSS keys off to animate width/height/opacity.
  useEffect(() => {
    const t1 = window.setTimeout(() => setStage(1), 140)
    const t2 = window.setTimeout(() => setStage(2), 240)
    const t3 = window.setTimeout(() => setStage(3), 400)
    const t4 = window.setTimeout(() => setStage(4), 620)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
      window.clearTimeout(t3)
      window.clearTimeout(t4)
    }
  }, [])

  const [bandKey, setBandKey] = useState(0)
  useEffect(() => {
    if (stage < 4) return
    const id = window.setInterval(() => {
      setBandKey((n) => n + 1)
    }, 8000)
    return () => window.clearInterval(id)
  }, [stage])

  const [tearY, setTearY] = useState<number | null>(null)
  useEffect(() => {
    if (stage < 4) return
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
  }, [stage])

  // Power-on visual: a white bright "beam" that grows first horizontally,
  // then vertically, then settles into the full screen. Rendered on top of
  // the content until stage 4, at which point it fades out.
  const beam =
    stage === 0
      ? { width: "2px", height: "2px", opacity: 1, background: "#fff" }
      : stage === 1
      ? { width: "40%", height: "2px", opacity: 1, background: "#fff" }
      : stage === 2
      ? { width: "95%", height: "3px", opacity: 1, background: "#fff" }
      : stage === 3
      ? { width: "100%", height: "30%", opacity: 0.92, background: "#fff" }
      : { width: "100%", height: "100%", opacity: 0, background: "#fff" }

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
          opacity: stage >= 3 ? 1 : 0,
          transition: "opacity 260ms ease-out",
        }}
      >
        {/* Paper base — dimmed during intro via filter so the cream
            backdrop tones down without affecting the Terminal text or
            Artifacts layer above it. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 35%, rgba(255,255,255,0.55) 0%, transparent 55%), radial-gradient(ellipse at 50% 110%, var(--paper-deep) 0%, var(--paper) 60%)",
            animation: stage === 3 ? "crt-snap-flicker 240ms ease-out" : undefined,
            filter: dim ? "brightness(0.45)" : "none",
            transition: "filter 800ms ease-out",
          }}
        />

        {/* Dim wash — extra layer of black at low opacity sits above the
            paper but below content/intro/scanlines. Adds depth on top of
            the paper-base brightness drop without flattening saturation. */}
        {dim && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "#000",
              opacity: 0.35,
              pointerEvents: "none",
              zIndex: 1,
              transition: "opacity 800ms ease-out",
            }}
          />
        )}

        {/* Content layer — cyan/magenta print-registration offset */}
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

        {/* Scanlines */}
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

        {/* Rolling band */}
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

        {/* Noise */}
        <AnimatedNoise opacity={0.05} />

        {/* Vignette */}
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

        {/* Subtle flicker */}
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

      {/* Power-on beam. Sits on top until stage 4, then fades. */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: beam.width,
            height: beam.height,
            background: beam.background,
            opacity: beam.opacity,
            transition:
              "width 160ms ease-out, height 220ms ease-out, opacity 260ms ease-out",
            boxShadow:
              stage < 4
                ? "0 0 16px rgba(255,255,255,0.8), 0 0 40px rgba(255,255,255,0.3)"
                : "none",
          }}
        />
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
        @keyframes crt-snap-flicker {
          0% { filter: brightness(1.5); }
          40% { filter: brightness(0.85); }
          70% { filter: brightness(1.1); }
          100% { filter: brightness(1); }
        }
      `}</style>
    </div>
  )
}
