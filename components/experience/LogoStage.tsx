"use client"

import { LogoMark } from "./LogoMark"

/*
 * LogoStage — the Choice Industries logo as a persistent, position-aware
 * overlay above the Terminal.
 *
 * Three states:
 *   "hidden"  — not rendered (pre-power-on)
 *   "center"  — large, centered, slow pulse (the "this is the system" beat)
 *   "corner"  — small, top-left, no pulse (constant brand anchor while
 *               Eve speaks and the boot/welcome text fills the stage)
 *
 * Transitions are CSS animations on transform + font-size proxies, so the
 * logo smoothly slides and shrinks from center to corner.
 */

export type LogoPosition = "hidden" | "center" | "corner"

type Props = {
  position: LogoPosition
}

export function LogoStage({ position }: Props) {
  if (position === "hidden") return null

  const isCenter = position === "center"

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 3,
      }}
    >
      <div
        style={{
          position: "absolute",
          // Center state sits at 50/50 and scales up. Corner state anchors
          // the top-left at 32px/32px and scales down.
          top: isCenter ? "50%" : "32px",
          left: isCenter ? "50%" : "32px",
          transform: isCenter
            ? "translate(-50%, -50%) scale(1)"
            : "translate(0, 0) scale(0.32)",
          transformOrigin: isCenter ? "center center" : "top left",
          transition:
            "top 1200ms cubic-bezier(0.65, 0, 0.35, 1), left 1200ms cubic-bezier(0.65, 0, 0.35, 1), transform 1200ms cubic-bezier(0.65, 0, 0.35, 1)",
          animation: isCenter ? "logo-pulse 3.8s ease-in-out infinite" : undefined,
        }}
      >
        <LogoMark variant="display" />
      </div>

      <style>{`
        @keyframes logo-pulse {
          0%, 100% { opacity: 0.92; filter: drop-shadow(0.6px 0 0 rgba(200, 75, 143, 0.32)) drop-shadow(-0.6px 0 0 rgba(31, 182, 193, 0.3)); }
          50%       { opacity: 1;    filter: drop-shadow(0.6px 0 0 rgba(200, 75, 143, 0.5))  drop-shadow(-0.6px 0 0 rgba(31, 182, 193, 0.45)); }
        }
      `}</style>
    </div>
  )
}
