"use client"

import { useEffect } from "react"

/*
 * TransmissionUnavailable — placeholder overlay for menu items that
 * aren't wired yet (About / Your Rights / Future Studies / Terminate).
 *
 * Brutalist card, brief copy, dismiss on click-anywhere or Escape.
 * The Terminate item gets a slightly different message so it lands the
 * "you cannot leave" beat even before the real flow is built.
 */

type Props = {
  /** Which menu item triggered this overlay. Drives the copy. */
  itemId: "about" | "rights" | "future" | "terminate"
  onDismiss: () => void
}

const COPY: Record<Props["itemId"], { title: string; body: string }> = {
  about: {
    title: "TRANSMISSION QUEUED",
    body:
      "Choice Industries orientation video is being prepared for your viewing. Please return shortly.",
  },
  rights: {
    title: "DOCUMENT PENDING",
    body:
      "Your Candidate Bill of Rights is being printed for your records. Please return shortly.",
  },
  future: {
    title: "ARCHIVE LOCKED",
    body:
      "Future Studies are visible only to candidates who have completed enrollment.",
  },
  terminate: {
    title: "SESSION CANNOT BE TERMINATED AT THIS TIME",
    body:
      "Termination is not a service Choice Industries provides during active enrollment. Please continue.",
  },
}

export function TransmissionUnavailable({ itemId, onDismiss }: Props) {
  // Esc dismiss
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [onDismiss])

  const copy = COPY[itemId]
  const isTerminate = itemId === "terminate"

  return (
    <div
      onClick={onDismiss}
      style={{
        position: "absolute",
        inset: 0,
        zIndex: 12,
        background: "rgba(0, 0, 0, 0.55)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        cursor: "pointer",
      }}
      aria-modal="true"
      role="dialog"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "min(78vw, 560px)",
          padding: "28px 32px 26px",
          background: "rgba(15, 18, 22, 0.92)",
          border: `1px solid ${isTerminate ? "rgba(228, 59, 37, 0.65)" : "rgba(232, 230, 220, 0.35)"}`,
          boxShadow: [
            "inset 0 0 24px rgba(0,0,0,0.6)",
            isTerminate
              ? "0 0 22px rgba(228, 59, 37, 0.35)"
              : "0 0 22px rgba(0,0,0,0.45)",
          ].join(", "),
          fontFamily: "var(--terminal-font)",
          color: "rgba(232, 230, 220, 0.92)",
          cursor: "default",
        }}
      >
        <div
          style={{
            fontSize: "clamp(11px, 0.85vw, 13px)",
            letterSpacing: "0.42em",
            color: isTerminate ? "rgba(228, 59, 37, 0.85)" : "rgba(111, 142, 168, 0.85)",
            textTransform: "uppercase",
            marginBottom: "10px",
            paddingBottom: "8px",
            borderBottom: `1px solid ${isTerminate ? "rgba(228, 59, 37, 0.5)" : "rgba(232, 230, 220, 0.22)"}`,
          }}
        >
          Choice Industries — Notice
        </div>
        <div
          style={{
            fontSize: "clamp(16px, 1.4vw, 22px)",
            fontWeight: 700,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            color: isTerminate ? "#ff8a7a" : "#ffffff",
            textShadow: isTerminate
              ? "0 0 14px rgba(228, 59, 37, 0.7), 0 1px 0 rgba(0,0,0,0.6)"
              : "1px 0 0 rgba(31, 182, 193, 0.5), -1px 0 0 rgba(200, 75, 143, 0.5), 0 1px 0 rgba(0,0,0,0.55)",
            lineHeight: 1.3,
          }}
        >
          {copy.title}
        </div>
        <div
          style={{
            marginTop: "14px",
            fontFamily: "var(--display-font)",
            fontSize: "clamp(13px, 1.05vw, 16px)",
            letterSpacing: "0.04em",
            color: "rgba(232, 230, 220, 0.85)",
            lineHeight: 1.55,
          }}
        >
          {copy.body}
        </div>
        <div
          style={{
            marginTop: "20px",
            display: "flex",
            justifyContent: "flex-end",
            fontSize: "clamp(10px, 0.78vw, 12px)",
            letterSpacing: "0.32em",
            color: "rgba(232, 230, 220, 0.55)",
            textTransform: "uppercase",
          }}
        >
          Click anywhere · Esc to acknowledge
        </div>
      </div>
    </div>
  )
}
