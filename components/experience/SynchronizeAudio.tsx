"use client"

import { useEffect, useState } from "react"
import { useFlickerText } from "@/lib/experience/use-flicker-text"

/*
 * SynchronizeAudio — the landing-page audio gate.
 *
 * Quiet, brutalist call-to-action. A single bordered rectangle,
 * cream/ink palette, CMYK chromatic split on the label so it shares
 * visual language with the welcome card and the side menu. Fades out
 * once engaged so the landing reads cleanly.
 *
 * Click is the user gesture that unlocks AudioContext — the parent
 * uses onEnable to spin up the engine and start the ambient bed.
 */

const LABEL_TEXT = "SYNCHRONIZE AUDIO"
const SUBLABEL_TEXT = "Click to engage transmission"

const FADE_OUT_AFTER_MS = 600
const FADE_OUT_MS = 700

type Props = {
  onEnable: () => void
}

export function SynchronizeAudio({ onEnable }: Props) {
  const [engaged, setEngaged] = useState(false)
  const [hover, setHover] = useState(false)
  const [removed, setRemoved] = useState(false)

  const labelDisplay = useFlickerText(LABEL_TEXT, !engaged, {
    intervalMin: 420,
    intervalMax: 1000,
    parallelChance: 0.22,
  })

  useEffect(() => {
    if (!engaged) return
    const out = window.setTimeout(
      () => setRemoved(true),
      FADE_OUT_AFTER_MS + FADE_OUT_MS,
    )
    return () => window.clearTimeout(out)
  }, [engaged])

  if (removed) return null

  const handleClick = () => {
    if (engaged) return
    setEngaged(true)
    onEnable()
  }

  // Hover lifts the border + text shadow slightly. Engaged state freezes
  // the hover treatment on so the button reads "armed" during fade-out.
  const lit = hover || engaged

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
        opacity: engaged ? 0 : 1,
        transition: `opacity ${FADE_OUT_MS}ms ease-out ${FADE_OUT_AFTER_MS}ms`,
        pointerEvents: removed ? "none" : "auto",
      }}
    >
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        onFocus={() => setHover(true)}
        onBlur={() => setHover(false)}
        aria-label="Synchronize audio"
        style={{
          appearance: "none",
          cursor: engaged ? "default" : "pointer",
          padding: "16px 36px",
          background: "transparent",
          border: `1px solid ${lit ? "rgba(232, 230, 220, 0.9)" : "rgba(232, 230, 220, 0.45)"}`,
          color: lit
            ? "rgba(255, 255, 255, 1)"
            : "rgba(232, 230, 220, 0.85)",
          fontFamily: "var(--display-font)",
          textTransform: "uppercase",
          letterSpacing: "0.32em",
          fontSize: "clamp(13px, 1.05vw, 16px)",
          fontWeight: 700,
          // Same CMYK chromatic split + soft drop the welcome card uses
          // so the button reads as part of the same transmission family.
          textShadow: [
            "1.2px 0 0 rgba(31, 182, 193, 0.55)",
            "-1.2px 0 0 rgba(200, 75, 143, 0.55)",
            "0 1px 0 rgba(0, 0, 0, 0.45)",
            lit
              ? "0 0 22px rgba(0, 0, 0, 0.55)"
              : "0 0 14px rgba(0, 0, 0, 0.45)",
          ].join(", "),
          boxShadow: lit
            ? "0 0 18px rgba(0, 0, 0, 0.35)"
            : "0 0 10px rgba(0, 0, 0, 0.25)",
          transition:
            "border-color 240ms ease-out, color 240ms ease-out, text-shadow 240ms ease-out, box-shadow 240ms ease-out",
          whiteSpace: "pre",
        }}
      >
        {labelDisplay}
      </button>

      <div
        style={{
          marginTop: "12px",
          fontFamily: "var(--terminal-font)",
          fontSize: "clamp(10px, 0.78vw, 12px)",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: "rgba(232, 230, 220, 0.6)",
          textShadow: "0 1px 0 rgba(0, 0, 0, 0.5)",
        }}
      >
        {SUBLABEL_TEXT}
      </div>
    </div>
  )
}
