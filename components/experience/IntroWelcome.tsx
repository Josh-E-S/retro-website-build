"use client"

import { useEffect, useState } from "react"
import { useFlickerText } from "@/lib/experience/use-flicker-text"

/*
 * IntroWelcome — the welcome card that sits over the cream Stage during
 * the intro phase. Title gets the same per-character flicker as the
 * Wakeup amber title; subtitle holds steady. Fades in shortly after the
 * white-flash residue is gone, fades out when the player commits.
 *
 * Rendered between Stage layers and the Terminal text layer (z=8) so the
 * scattered quotes still appear over it.
 */

const TITLE_TEXT = "WELCOME TO CHOICE INDUSTRIES"
const SUBTITLE_TEXT =
  "Press any key to begin enrollment, or watch the orientation now playing."

const FADE_IN_DELAY_MS = 600
const FADE_IN_MS = 1200
const FADE_OUT_MS = 700

type Props = {
  /** True while intro phase is active. Flip to false to fade the card
   *  out before unmount. */
  visible: boolean
  /** Override subtitle. Pass an empty string to suppress entirely (the
   *  landing page hides it because the side menu carries the call to
   *  action; intro keeps the default "press any key" line). */
  subtitle?: string | null
}

export function IntroWelcome({ visible, subtitle }: Props) {
  // Track whether we've cleared the initial fade-in delay. Without this
  // the card would pop in instantly on mount, undermining the white
  // flash → cream paper handoff.
  const [appeared, setAppeared] = useState(false)

  useEffect(() => {
    const id = window.setTimeout(() => setAppeared(true), FADE_IN_DELAY_MS)
    return () => window.clearTimeout(id)
  }, [])

  const titleDisplay = useFlickerText(TITLE_TEXT, visible && appeared, {
    intervalMin: 600,
    intervalMax: 1300,
    parallelChance: 0.22,
  })

  const opacity = visible && appeared ? 1 : 0

  return (
    <div
      aria-hidden="true"
      style={{
        position: "absolute",
        top: "10vh",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 7,
        pointerEvents: "none",
        textAlign: "center",
        opacity,
        transition: visible
          ? `opacity ${FADE_IN_MS}ms ease-out`
          : `opacity ${FADE_OUT_MS}ms ease-in`,
        userSelect: "none",
        whiteSpace: "pre",
        // Off-white with CMYK chromatic split + slow flicker — reads as
        // a digital transmission rather than a flashlight on the page.
        color: "rgba(245, 244, 238, 0.92)",
        fontFamily: "var(--display-font)",
      }}
    >
      <div
        style={{
          fontSize: "clamp(28px, 3.4vw, 44px)",
          fontWeight: 700,
          letterSpacing: "0.32em",
          // Cyan/magenta print-registration split + a soft drop shadow
          // for legibility against the dimmed paper. No raw white halo.
          textShadow: [
            "1.2px 0 0 rgba(31, 182, 193, 0.55)",   // cyan ghost (right)
            "-1.2px 0 0 rgba(200, 75, 143, 0.55)",  // magenta ghost (left)
            "0 1px 0 rgba(0, 0, 0, 0.45)",           // 1px drop for contrast
            "0 0 18px rgba(0, 0, 0, 0.55)",          // soft underglow lifts it off the paper
          ].join(", "),
          animation: "intro-welcome-flicker 4.2s ease-in-out infinite",
        }}
      >
        {titleDisplay}
      </div>

      {(() => {
        const text = subtitle === undefined ? SUBTITLE_TEXT : subtitle
        if (!text) return null
        return (
          <div
            style={{
              marginTop: "18px",
              fontSize: "clamp(14px, 1.15vw, 17px)",
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: "rgba(232, 230, 220, 0.78)",
              textShadow:
                "0 1px 0 rgba(0, 0, 0, 0.55), 0 0 12px rgba(0, 0, 0, 0.4)",
              maxWidth: "min(82vw, 720px)",
              margin: "18px auto 0",
              lineHeight: 1.55,
            }}
          >
            {text}
          </div>
        )
      })()}

      <style>{`
        @keyframes intro-welcome-flicker {
          0%, 100% { opacity: 1; }
          47%      { opacity: 0.94; }
          50%      { opacity: 0.86; }
          53%      { opacity: 0.96; }
        }
      `}</style>
    </div>
  )
}
