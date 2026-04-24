"use client"

import { useEffect, useRef, useState } from "react"
import { createAudioEngine, type AudioEngineHandle } from "@/lib/experience/audio/engine"
import { Artifacts, type ArtifactsHandle } from "./Artifacts"
import { AvatarFlash, type AvatarFlashHandle } from "./AvatarFlash"
import { LogoMark } from "./LogoMark"

/*
 * Wakeup — two-phase unlock gate.
 *
 * Phase 1 ("idle"): pure black, Choice Industries logo centered (heartbeat
 *   pulse), "THE ABLATION STUDY" title, "PRESS SPACE BAR TO BEGIN" prompt.
 *   Nothing moves, nothing glitches, no audio — the page is waiting.
 *
 * Phase 2 ("primed"): player presses space (or any key / touch / click).
 *   The AudioContext starts inside that gesture, the pre-start HVAC+fan
 *   bed fades in, the artifacts layer comes alive, and the amber power
 *   button + ESTABLISH LINK label fade in under the logo.
 *
 * Phase 3 ("clicked"): player clicks ESTABLISH LINK. dos-beep fires
 *   immediately, pentium boot sound at +160ms, pre-start bed fades out,
 *   engine handle is passed up to Experience at +900ms for the main
 *   sequence takeover.
 */

type Props = {
  onUnlock: (responseLatencyMs: number, audio: AudioEngineHandle) => void
}

const LATENCY_STORAGE_KEY = "ablation_response_latency_ms"

const AMBER = "#d9b24a"
const AMBER_DEEP = "#a97e1f"
const AMBER_GLOW = "rgba(217, 178, 74, 0.55)"

type Phase = "idle" | "primed" | "clicked"

type GlitchState = {
  intensity: number // 0–1
  offsetX: number
  brightMul: number
}

export function Wakeup({ onUnlock }: Props) {
  const mountedAt = useRef(performance.now())
  const [phase, setPhase] = useState<Phase>("idle")
  const [pressed, setPressed] = useState(false)
  const [glitch, setGlitch] = useState<GlitchState>({ intensity: 0, offsetX: 0, brightMul: 1 })
  const engineRef = useRef<Promise<AudioEngineHandle> | null>(null)
  const artifactsRef = useRef<ArtifactsHandle | null>(null)
  const avatarFlashRef = useRef<AvatarFlashHandle | null>(null)
  // Synchronous guards. React state updates are batched/async, so without
  // these refs a same-tick pair of events could slip past the checks.
  const primedFiredRef = useRef(false)
  const unlockFiredRef = useRef(false)

  const ensureEngine = (): Promise<AudioEngineHandle> => {
    if (!engineRef.current) {
      engineRef.current = createAudioEngine().then((engine) => {
        engine.startPreStartLoop(800)
        return engine
      })
    }
    return engineRef.current
  }

  const triggerPrime = () => {
    if (primedFiredRef.current) return
    primedFiredRef.current = true
    void ensureEngine()
    setPhase("primed")
  }

  const triggerUnlock = () => {
    // Must go through prime first (will be a no-op if already primed).
    triggerPrime()
    if (unlockFiredRef.current) return
    unlockFiredRef.current = true
    const latency = performance.now() - mountedAt.current
    try {
      localStorage.setItem(LATENCY_STORAGE_KEY, String(Math.round(latency)))
    } catch {
      /* storage off — fine */
    }
    setPressed(true)
    setPhase("clicked")
    void ensureEngine().then((engine) => {
      engine.playOneShot("beep", { gain: 0.9 })
      window.setTimeout(() => {
        engine.playOneShot("pentiumBoot", { gain: 0.95 })
      }, 160)
      engine.stopPreStartLoop(400)
      window.setTimeout(() => onUnlock(latency, engine), 900)
    })
  }

  // Idle-phase input listeners: space primes, other gestures too.
  useEffect(() => {
    if (phase !== "idle") return
    const onKey = (e: KeyboardEvent) => {
      // Space is the primary prompt but any key works.
      if (e.key === " " || e.key === "Spacebar" || e.code === "Space") {
        e.preventDefault()
        triggerPrime()
      } else {
        triggerPrime()
      }
    }
    const onAny = () => triggerPrime()
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

  // Primed-phase fallback unlock: keyboard / touch (the button click is
  // handled by its onClick handler directly).
  useEffect(() => {
    if (phase !== "primed") return
    const onKey = () => triggerUnlock()
    const onTouch = () => triggerUnlock()
    window.addEventListener("keydown", onKey, { once: true })
    window.addEventListener("touchstart", onTouch, { once: true, passive: true })
    return () => {
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("touchstart", onTouch)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase])

  // Artifacts + glitches only run once we're primed (not in idle).
  useEffect(() => {
    if (phase !== "primed") return
    const art = artifactsRef.current
    if (!art) return
    art.ambient.start()
    return () => art.ambient.stop()
  }, [phase])

  useEffect(() => {
    if (phase !== "primed") return
    let cancelled = false
    const timers: number[] = []

    const fireNormal = () => {
      if (cancelled) return
      const art = artifactsRef.current
      if (art) art.glitch("normal")
      const intensity = 0.45 + Math.random() * 0.35
      const offsetX = (Math.random() * 10 - 5) | 0
      setGlitch({ intensity, offsetX, brightMul: 1.35 })
      timers.push(window.setTimeout(() => {
        setGlitch({ intensity: intensity * 0.5, offsetX: -offsetX / 2, brightMul: 1.1 })
      }, 60))
      timers.push(window.setTimeout(() => {
        setGlitch({ intensity: 0, offsetX: 0, brightMul: 1 })
      }, 140))
      timers.push(window.setTimeout(fireNormal, 2800 + Math.random() * 3200))
    }

    const fireHard = () => {
      if (cancelled) return
      const art = artifactsRef.current
      if (art) art.glitch("hard")
      const intensity = 0.7 + Math.random() * 0.3
      const offsetX = (Math.random() * 20 - 10) | 0
      setGlitch({ intensity, offsetX, brightMul: 1.8 })
      timers.push(window.setTimeout(() => {
        setGlitch({ intensity: intensity * 0.6, offsetX: -offsetX / 2, brightMul: 1.3 })
      }, 70))
      timers.push(window.setTimeout(() => {
        setGlitch({ intensity: 0, offsetX: 0, brightMul: 1 })
      }, 180))
      timers.push(window.setTimeout(fireHard, 11000 + Math.random() * 9000))
    }

    // Trapped-avatar bursts: front-loaded, then taper. Timing is from
    // the moment of priming, so first firing lands within 15s of the
    // player pressing space.
    let trappedIndex = 0
    const fireTrappedAvatar = () => {
      if (cancelled) return
      const e = engineRef.current
      const chance = trappedIndex === 0 ? 0.95
        : trappedIndex === 1 ? 0.7
        : trappedIndex === 2 ? 0.45
        : 0.3
      if (e && Math.random() < chance) {
        void e.then((engine) => engine.playTrappedAvatar())
        // Pair the audio with the avatar image taking over the viewport
        // and a hard glitch burst the moment her face arrives.
        avatarFlashRef.current?.flash(8000)
        artifactsRef.current?.glitch("hard")
      }
      trappedIndex += 1
      const nextMs = trappedIndex === 1 ? 10000 + Math.random() * 10000
        : trappedIndex === 2 ? 18000 + Math.random() * 12000
        : 35000 + Math.random() * 25000
      timers.push(window.setTimeout(fireTrappedAvatar, nextMs))
    }

    timers.push(window.setTimeout(fireNormal, 3500 + Math.random() * 2000))
    timers.push(window.setTimeout(fireHard, 8000 + Math.random() * 4000))
    timers.push(window.setTimeout(fireTrappedAvatar, 8000 + Math.random() * 6000))

    return () => {
      cancelled = true
      timers.forEach(window.clearTimeout)
    }
  }, [phase])

  const glitchFilter = glitch.intensity > 0
    ? `brightness(${glitch.brightMul}) drop-shadow(${glitch.offsetX}px 0 0 rgba(31, 182, 193, ${0.6 * glitch.intensity})) drop-shadow(${-glitch.offsetX}px 0 0 rgba(200, 75, 143, ${0.6 * glitch.intensity}))`
    : "none"

  // Fade the whole screen out once the player clicks ESTABLISH LINK.
  const screenOpacity = phase === "clicked" ? 0 : 1

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
        opacity: screenOpacity,
        transition: "opacity 700ms ease-out",
        overflow: "hidden",
      }}
    >
      {/* Artifacts only mount in primed/clicked phase — idle stays clean. */}
      {phase !== "idle" && (
        <Artifacts
          ref={artifactsRef}
          palette="amber"
          onEvent={(ev) => {
            const ePromise = engineRef.current
            if (!ePromise) return
            void ePromise.then((engine) => {
              switch (ev.kind) {
                case "tetris":
                  engine.playArtifactSfx("tetris")
                  break
                case "clump":
                  engine.playArtifactSfx("clump", ev.subtle ? "subtle" : "normal")
                  break
                case "symbol":
                  engine.playArtifactSfx("symbol")
                  break
                case "glitch":
                  engine.playArtifactSfx("glitch", ev.intensity)
                  break
              }
            })
          }}
        />
      )}

      {/* Avatar scream flash — full-viewport overlay tied to the trapped-
          avatar audio. Sits above everything else at zIndex 50 so her
          face takes the whole frame when it arrives. */}
      <AvatarFlash ref={avatarFlashRef} />

      {/* Choice Industries logo as an independent overlay. Two states:
          - idle: in the centered stack, below title + prompt (via transform
            translation to the stack position, heartbeat pulse).
          - primed/clicked: slides to top-left and shrinks, acting as a
            persistent brand anchor while the button takes focus.
          Kept outside the centered stack so the slide animation is driven
          purely by its own top/left/transform properties. */}
      <div
        style={{
          position: "absolute",
          top: phase === "idle" ? "50%" : "24px",
          left: phase === "idle" ? "50%" : "24px",
          transform: phase === "idle"
            ? "translate(-50%, -5%) scale(1)"
            : "translate(0, 0) scale(0.55)",
          transformOrigin: phase === "idle" ? "center center" : "top left",
          width: "clamp(275px, 35vw, 450px)",
          transition:
            "top 900ms cubic-bezier(0.65, 0, 0.35, 1), left 900ms cubic-bezier(0.65, 0, 0.35, 1), transform 900ms cubic-bezier(0.65, 0, 0.35, 1), opacity 700ms ease-out",
          opacity: phase === "idle" ? 1 : 0.82,
          animation: phase === "idle" ? "wakeup-logo-heartbeat 2.4s ease-in-out infinite" : undefined,
          zIndex: 11,
          pointerEvents: "none",
        }}
      >
        <LogoMark variant="display" palette="amber" style={{ width: "100%" }} />
      </div>

      {/* Centered stack — title on top, then (idle only) prompt, then (primed
          only) the power button + ESTABLISH LINK label. Logo is NOT in this
          stack; it animates independently via the overlay above. */}
      <div
        style={{
          position: "relative",
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "28px",
          // On idle we bias the whole stack upward so the title sits
          // above the centered logo. On primed the logo has moved away,
          // so the stack centers normally.
          transform: phase === "idle"
            ? `translate(${glitch.offsetX}px, -200px)`
            : `translate(${glitch.offsetX}px, 0)`,
          filter: glitchFilter,
          transition: glitch.intensity > 0
            ? "none"
            : "transform 900ms cubic-bezier(0.65, 0, 0.35, 1), filter 160ms ease-out",
        }}
      >
        {/* Study title */}
        <div
          style={{
            fontSize: phase === "idle" ? "clamp(22px, 3vw, 34px)" : "16px",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: AMBER,
            textShadow: `0 0 12px ${AMBER_GLOW}, 0 0 2px ${AMBER_DEEP}`,
            opacity: phase === "idle" ? 1 : 0.7,
            transition: "font-size 700ms ease-out, opacity 700ms ease-out",
            animation: phase === "idle" ? "amber-text-pulse 2.6s ease-in-out infinite" : undefined,
          }}
        >
          The Ablation Study
        </div>

        {/* Idle prompt. Sits just below the title, above the logo. */}
        {phase === "idle" && (
          <div
            style={{
              fontSize: "14px",
              letterSpacing: "0.42em",
              textTransform: "uppercase",
              color: AMBER,
              textShadow: `0 0 8px ${AMBER_GLOW}`,
              animation: "amber-prompt-blink 1.8s ease-in-out infinite",
            }}
          >
            Press space bar to begin
          </div>
        )}

        {/* Power button + ESTABLISH LINK. Rendered only once primed. */}
        {phase !== "idle" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "28px",
              animation: "wakeup-button-enter 900ms cubic-bezier(0.2, 0.7, 0.2, 1) both",
            }}
          >
            <button
              onClick={triggerUnlock}
              disabled={phase === "clicked"}
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
                cursor: phase === "clicked" ? "default" : "pointer",
                transform: pressed ? "scale(0.95)" : "scale(1)",
                transition:
                  "transform 160ms ease-out, background 200ms ease-out, border-color 240ms ease-out",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: 0,
                animation: phase === "clicked" ? undefined : "amber-pulse 2.2s ease-in-out infinite",
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
                fontSize: "18px",
                letterSpacing: "0.4em",
                textTransform: "uppercase",
                color: AMBER,
                textShadow: `0 0 12px ${AMBER_GLOW}, 0 0 2px ${AMBER_DEEP}`,
                animation: phase === "clicked" ? undefined : "amber-text-pulse 2.2s ease-in-out infinite",
              }}
            >
              Establish link
            </div>
          </div>
        )}
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
        @keyframes amber-prompt-blink {
          0%, 100% { opacity: 0.55; }
          50%       { opacity: 1; }
        }
        @keyframes wakeup-logo-heartbeat {
          0%   { opacity: 0.65; }
          8%   { opacity: 1;    }
          16%  { opacity: 0.65; }
          24%  { opacity: 1;    }
          32%  { opacity: 0.65; }
          100% { opacity: 0.65; }
        }
        @keyframes wakeup-button-enter {
          from { opacity: 0; transform: translateY(12px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  )
}
