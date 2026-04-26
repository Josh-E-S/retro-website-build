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

// Split title so "Choice Industries" reads as the corporate stamp the
// player remembers — smaller, looser welcome line; bigger, hard-stamped
// brand line below it.
const PREAMBLE_TEXT = "WELCOME TO"
const BRAND_TEXT = "CHOICE INDUSTRIES"
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

  const brandDisplay = useFlickerText(BRAND_TEXT, visible && appeared, {
    intervalMin: 600,
    intervalMax: 1300,
    parallelChance: 0.22,
  })

  const opacity = visible && appeared ? 1 : 0

  return (
    <div
      aria-hidden="true"
      className="intro-welcome"
      style={{
        position: "absolute",
        top: "10vh",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 7,
        pointerEvents: "none",
        textAlign: "center",
        maxWidth: "min(92vw, 720px)",
        opacity,
        transition: visible
          ? `opacity ${FADE_IN_MS}ms ease-out`
          : `opacity ${FADE_OUT_MS}ms ease-in`,
        userSelect: "none",
        // Wrap on narrow viewports — at clamp's 28px min the unwrapped
        // string is ~540px, well over a 375px phone width.
        whiteSpace: "normal",
        color: "rgba(245, 244, 238, 0.92)",
        fontFamily: "var(--display-font)",
      }}
    >
      {/* Preamble — small, thin, light. A receptionist's voice, not a logo. */}
      <div
        className="intro-welcome-preamble"
        style={{
          fontSize: "clamp(11px, 1.05vw, 15px)",
          fontWeight: 400,
          letterSpacing: "0.5em",
          textIndent: "0.5em",
          color: "rgba(232, 230, 220, 0.55)",
          textShadow: "0 1px 0 rgba(0, 0, 0, 0.55)",
        }}
      >
        {PREAMBLE_TEXT}
      </div>

      {/* Brand stamp — large, heavy, with the print-registration ghost.
          This is the corporation; the player should recognize it again. */}
      <div
        className="intro-welcome-brand"
        style={{
          marginTop: "10px",
          fontSize: "clamp(28px, 4.2vw, 56px)",
          fontWeight: 800,
          letterSpacing: "0.22em",
          textShadow: [
            "1.6px 0 0 rgba(31, 182, 193, 0.6)",   // cyan ghost (right)
            "-1.6px 0 0 rgba(200, 75, 143, 0.6)",  // magenta ghost (left)
            "0 1px 0 rgba(0, 0, 0, 0.55)",          // 1px drop for contrast
            "0 0 20px rgba(0, 0, 0, 0.6)",          // soft underglow
          ].join(", "),
          animation: "intro-welcome-flicker 4.2s ease-in-out infinite",
        }}
      >
        {brandDisplay}
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
        @media (max-width: 640px) {
          /* Tight tracking on narrow phones so the title doesn't crush
             into a column or run past the side menu. */
          .intro-welcome { top: 6vh; }
          .intro-welcome-preamble { letter-spacing: 0.32em; }
          .intro-welcome-brand { letter-spacing: 0.14em; line-height: 1.15; }
        }
      `}</style>
    </div>
  )
}
