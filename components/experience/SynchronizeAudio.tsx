"use client"

import { useEffect, useState } from "react"
import { useFlickerText } from "@/lib/experience/use-flicker-text"

/*
 * SynchronizeAudio — the landing-page audio gate.
 *
 * A retro-futurist pushbutton with a phosphor ring. Sits center-bottom
 * of the landing while the room is silent. Click → fires onEnable
 * (which the parent uses to spin up the AudioContext and start the
 * ambient bed), then animates ON for ~900ms before fading out so the
 * landing reads cleanly without a permanent UI element.
 *
 * Looks like institutional audio hardware, not a video-game button —
 * brushed-metal frame, recessed bezel, illuminated label that reads
 * SYNCHRONIZE AUDIO with a slow per-character flicker so it feels
 * like a transmitter waiting to lock on.
 */

const LABEL_TEXT = "SYNCHRONIZE AUDIO"
const SUBLABEL_TEXT = "Click to engage transmission"

const PHOSPHOR_OFF = "#6f8ea8"   // accent
const PHOSPHOR_ON = "#d9b24a"    // amber

const FADE_OUT_AFTER_MS = 900
const FADE_OUT_MS = 700

type Props = {
  /** Called the instant the player clicks. Parent should: create the
   *  AudioEngine, start ambient bed, kick music etc. */
  onEnable: () => void
}

export function SynchronizeAudio({ onEnable }: Props) {
  const [engaged, setEngaged] = useState(false)
  const [removed, setRemoved] = useState(false)

  const labelDisplay = useFlickerText(LABEL_TEXT, !engaged, {
    intervalMin: 380,
    intervalMax: 950,
    parallelChance: 0.25,
  })

  useEffect(() => {
    if (!engaged) return
    const out = window.setTimeout(() => setRemoved(true), FADE_OUT_AFTER_MS + FADE_OUT_MS)
    return () => window.clearTimeout(out)
  }, [engaged])

  if (removed) return null

  const handleClick = () => {
    if (engaged) return
    setEngaged(true)
    onEnable()
  }

  const phosphor = engaged ? PHOSPHOR_ON : PHOSPHOR_OFF

  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        bottom: "12vh",
        transform: "translateX(-50%)",
        zIndex: 9,
        textAlign: "center",
        userSelect: "none",
        opacity: engaged && removed === false ? 0 : 1,
        // Two-stage fade: stay solid through the engage-thunk window,
        // then ease out fully.
        transition: `opacity ${FADE_OUT_MS}ms ease-out ${FADE_OUT_AFTER_MS}ms`,
        pointerEvents: removed ? "none" : "auto",
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        aria-label="Synchronize audio"
        style={{
          appearance: "none",
          border: "none",
          background: "transparent",
          padding: 0,
          cursor: engaged ? "default" : "pointer",
          display: "block",
        }}
      >
        {/* Outer brushed-metal frame */}
        <div
          style={{
            width: "clamp(180px, 18vw, 240px)",
            padding: "20px 24px 14px",
            background:
              "linear-gradient(180deg, #2a2f36 0%, #161a1f 50%, #2a2f36 100%)",
            border: "1px solid #0a0c0f",
            boxShadow: [
              "inset 0 1px 0 rgba(255,255,255,0.08)",
              "inset 0 -1px 0 rgba(0,0,0,0.6)",
              "0 8px 24px rgba(0,0,0,0.45)",
              engaged
                ? `0 0 38px ${phosphor}66, 0 0 12px ${phosphor}aa`
                : `0 0 14px ${phosphor}33`,
            ].join(", "),
            transition: "box-shadow 320ms ease-out",
          }}
        >
          {/* Recessed bezel + phosphor ring */}
          <div
            style={{
              position: "relative",
              width: "100%",
              padding: "16px 12px",
              background:
                "radial-gradient(ellipse at 50% 30%, #1c2128 0%, #0a0d11 75%)",
              border: `1px solid ${phosphor}`,
              borderRadius: "2px",
              boxShadow: [
                `inset 0 0 18px ${phosphor}${engaged ? "55" : "22"}`,
                `0 0 10px ${phosphor}${engaged ? "aa" : "33"}`,
              ].join(", "),
              transition:
                "border-color 320ms ease-out, box-shadow 320ms ease-out",
              animation: engaged
                ? "sync-audio-pulse 1.2s ease-in-out infinite"
                : undefined,
            }}
          >
            {/* Label */}
            <div
              style={{
                fontFamily: "var(--terminal-font)",
                fontSize: "clamp(13px, 1.05vw, 15px)",
                letterSpacing: "0.32em",
                fontWeight: 700,
                color: phosphor,
                textShadow: `0 0 8px ${phosphor}, 0 0 2px ${phosphor}`,
                whiteSpace: "pre",
              }}
            >
              {engaged ? "● TRANSMISSION ACTIVE" : labelDisplay}
            </div>
            {/* Sublabel */}
            <div
              style={{
                marginTop: "8px",
                fontFamily: "var(--terminal-font)",
                fontSize: "clamp(10px, 0.78vw, 12px)",
                letterSpacing: "0.22em",
                color: engaged ? `${phosphor}cc` : "#8a8578",
                textTransform: "uppercase",
                textShadow: engaged ? `0 0 4px ${phosphor}` : undefined,
              }}
            >
              {engaged ? "Synchronizing…" : SUBLABEL_TEXT}
            </div>

            {/* Hardware indicator dot */}
            <div
              style={{
                position: "absolute",
                top: 6,
                right: 8,
                width: 6,
                height: 6,
                borderRadius: "50%",
                background: phosphor,
                boxShadow: `0 0 6px ${phosphor}, 0 0 2px ${phosphor}`,
                animation: engaged
                  ? "sync-audio-dot 0.6s steps(1) infinite"
                  : "sync-audio-dot-off 1.8s ease-in-out infinite",
              }}
            />
          </div>

          {/* Bolt corners — institutional hardware detail */}
          {[
            { top: 4, left: 6 },
            { top: 4, right: 6 },
            { bottom: 4, left: 6 },
            { bottom: 4, right: 6 },
          ].map((pos, i) => (
            <div
              key={i}
              style={{
                position: "absolute",
                width: 4,
                height: 4,
                borderRadius: "50%",
                background: "#0a0c0f",
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                ...pos,
              }}
            />
          ))}
        </div>
      </button>

      <style>{`
        @keyframes sync-audio-pulse {
          0%, 100% {
            box-shadow:
              inset 0 0 18px ${PHOSPHOR_ON}55,
              0 0 10px ${PHOSPHOR_ON}aa;
          }
          50% {
            box-shadow:
              inset 0 0 26px ${PHOSPHOR_ON}88,
              0 0 22px ${PHOSPHOR_ON}dd;
          }
        }
        @keyframes sync-audio-dot {
          0%, 49% { opacity: 1; }
          50%, 100% { opacity: 0.25; }
        }
        @keyframes sync-audio-dot-off {
          0%, 100% { opacity: 0.45; }
          50%      { opacity: 0.85; }
        }
      `}</style>
    </div>
  )
}
