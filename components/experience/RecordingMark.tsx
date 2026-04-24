"use client"

import { LogoMark } from "./LogoMark"

/*
 * RecordingMark — the always-on corner watermark.
 *
 * Small Choice Industries logo in the bottom-right, with the red dot
 * in the logo pulsing at 0.5Hz as a "recording in progress" tell.
 * Mounted for the entire running state; never acknowledged by the
 * experience. The player may never consciously notice the blink,
 * but it's there the whole time.
 */

export function RecordingMark() {
  return (
    <div
      style={{
        position: "absolute",
        right: "24px",
        bottom: "24px",
        opacity: 0.6,
        zIndex: 6,
        pointerEvents: "none",
        display: "flex",
        alignItems: "center",
        gap: "10px",
      }}
    >
      <span
        style={{
          display: "inline-block",
          width: "8px",
          height: "8px",
          borderRadius: "50%",
          background: "#e43b25",
          boxShadow: "0 0 6px rgba(228, 59, 37, 0.6)",
          animation: "rec-pulse 2s infinite ease-in-out",
        }}
        aria-hidden="true"
      />
      <span
        style={{
          fontFamily: "var(--terminal-font)",
          fontSize: "9px",
          letterSpacing: "0.3em",
          textTransform: "uppercase",
          color: "var(--ink-muted)",
        }}
      >
        REC
      </span>
      <LogoMark variant="mark" style={{ opacity: 0.8 }} />
      <style>{`
        @keyframes rec-pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
      `}</style>
    </div>
  )
}
