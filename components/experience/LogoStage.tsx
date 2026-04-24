"use client"

import { LogoMark } from "./LogoMark"

/*
 * LogoStage — the Choice Industries logo as a persistent, position-aware
 * overlay above the Terminal.
 *
 * Three states:
 *   "hidden"  — not rendered
 *   "center"  — large, centered, slow heartbeat-style opacity pulse
 *               (the "this is the system" beat during boot)
 *   "corner"  — small, tucked top-left out of the text zone,
 *               constant low opacity, no pulse
 *
 * Transitions are CSS on top/left/transform so the logo smoothly
 * slides + shrinks from center to corner over ~1.2s.
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
          top: isCenter ? "50%" : "20px",
          left: isCenter ? "50%" : "20px",
          transform: isCenter
            ? "translate(-50%, -50%) scale(1)"
            : "translate(0, 0) scale(0.18)",
          transformOrigin: isCenter ? "center center" : "top left",
          transition:
            "top 1200ms cubic-bezier(0.65, 0, 0.35, 1), left 1200ms cubic-bezier(0.65, 0, 0.35, 1), transform 1200ms cubic-bezier(0.65, 0, 0.35, 1), opacity 800ms ease-out",
          opacity: isCenter ? 1 : 0.62,
          animation: isCenter ? "logo-heartbeat 2.4s ease-in-out infinite" : undefined,
          filter:
            "drop-shadow(0.6px 0 0 rgba(200, 75, 143, 0.32)) drop-shadow(-0.6px 0 0 rgba(31, 182, 193, 0.3))",
        }}
      >
        <LogoMark variant="display" />
      </div>

      <style>{`
        /*
         * Heartbeat — a double-thump followed by a longer rest. Each
         * thump is a quick opacity rise-and-fall; the rest keeps the
         * logo faintly visible so it never disappears entirely.
         */
        @keyframes logo-heartbeat {
          0%   { opacity: 0.55; }
          8%   { opacity: 1;    }    /* thump 1 */
          16%  { opacity: 0.55; }
          24%  { opacity: 1;    }    /* thump 2 */
          32%  { opacity: 0.55; }
          100% { opacity: 0.55; }    /* long rest */
        }
      `}</style>
    </div>
  )
}
