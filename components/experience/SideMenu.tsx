"use client"

import { useState } from "react"

/*
 * SideMenu — the left-rail landing menu.
 *
 * Brutalist-CRT vocabulary, not a video-game menu. Numeric prefixes,
 * uppercase labels, single horizontal cyan/magenta line that slides
 * under the active item on hover. Selection state brightens the active
 * item and dims the rest.
 *
 * Five entries:
 *   01 — Enroll in Study   (wired)
 *   02 — About Choice Industries
 *   03 — Your Rights as a Candidate
 *   04 — Future Studies
 *   05 — Terminate Session
 */

export type MenuId =
  | "enroll"
  | "about"
  | "rights"
  | "future"
  | "terminate"

type Item = { id: MenuId; n: string; label: string }

const ITEMS: Item[] = [
  { id: "enroll",    n: "01", label: "Enroll in Study" },
  { id: "about",     n: "02", label: "About Choice Industries" },
  { id: "rights",    n: "03", label: "Your Rights as a Candidate" },
  { id: "future",    n: "04", label: "Future Studies" },
  { id: "terminate", n: "05", label: "Terminate Session" },
]

type Props = {
  /** True once SynchronizeAudio has been engaged. Menu fades in only
   *  after audio is on so the room comes alive in order. */
  visible: boolean
  /** Click handler. Caller decides what each id does (Enroll →
   *  advance, others → stub overlay). */
  onSelect: (id: MenuId) => void
  /** Fires once per hover-enter on an item. Caller plays a soft tick. */
  onHover?: (id: MenuId) => void
}

export function SideMenu({ visible, onSelect, onHover }: Props) {
  const [hover, setHover] = useState<MenuId | null>(null)

  const enter = (id: MenuId) => {
    setHover(id)
    onHover?.(id)
  }

  return (
    <div
      style={{
        position: "absolute",
        top: "50%",
        left: "5vw",
        transform: "translateY(-50%)",
        zIndex: 8,
        opacity: visible ? 1 : 0,
        transition: "opacity 1200ms ease-out 600ms",
        pointerEvents: visible ? "auto" : "none",
        userSelect: "none",
      }}
    >
      {/* Header strip */}
      <div
        style={{
          fontFamily: "var(--terminal-font)",
          fontSize: "clamp(10px, 0.78vw, 12px)",
          letterSpacing: "0.42em",
          color: "rgba(232, 230, 220, 0.55)",
          textShadow: "0 1px 0 rgba(0,0,0,0.55)",
          marginBottom: "14px",
          paddingBottom: "8px",
          borderBottom: "1px solid rgba(232, 230, 220, 0.22)",
          textTransform: "uppercase",
          maxWidth: "320px",
          whiteSpace: "pre",
        }}
      >
        Candidate Console — v4.7
      </div>

      <ul
        style={{
          listStyle: "none",
          margin: 0,
          padding: 0,
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {ITEMS.map((item) => {
          const isHover = hover === item.id
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                onMouseEnter={() => enter(item.id)}
                onMouseLeave={() => setHover((h) => (h === item.id ? null : h))}
                onFocus={() => enter(item.id)}
                onBlur={() => setHover((h) => (h === item.id ? null : h))}
                style={{
                  appearance: "none",
                  background: "transparent",
                  border: "none",
                  padding: "12px 4px",
                  minHeight: "44px",
                  cursor: "pointer",
                  fontFamily: "var(--display-font)",
                  fontSize: "clamp(18px, 1.55vw, 24px)",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  textAlign: "left",
                  color: isHover
                    ? "rgba(255, 255, 255, 1)"
                    : "rgba(232, 230, 220, 0.88)",
                  textShadow: isHover
                    ? [
                        "1.2px 0 0 rgba(31, 182, 193, 0.6)",
                        "-1.2px 0 0 rgba(200, 75, 143, 0.6)",
                        "0 1px 0 rgba(0,0,0,0.55)",
                        "0 0 16px rgba(0,0,0,0.5)",
                      ].join(", ")
                    : [
                        "0 1px 0 rgba(0,0,0,0.55)",
                        "0 0 14px rgba(0,0,0,0.4)",
                      ].join(", "),
                  transition:
                    "color 220ms ease-out, text-shadow 220ms ease-out",
                  display: "flex",
                  alignItems: "baseline",
                  gap: "14px",
                  position: "relative",
                  width: "100%",
                  maxWidth: "360px",
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--terminal-font)",
                    fontSize: "0.78em",
                    fontWeight: 700,
                    color: isHover
                      ? "var(--cyan)"
                      : "rgba(111, 142, 168, 0.7)",
                    letterSpacing: "0.1em",
                    minWidth: "2.6em",
                    transition: "color 220ms ease-out",
                  }}
                >
                  {item.n} —
                </span>
                <span style={{ flex: 1 }}>{item.label}</span>

                {/* Cyan/magenta bar that slides under the active item.
                    Two layered absolute strips for the print-registration
                    color split. */}
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 2,
                    height: "1px",
                    background: "var(--cyan)",
                    transform: isHover ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    width: "100%",
                    transition: "transform 240ms ease-out",
                  }}
                />
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute",
                    left: 0,
                    bottom: 1,
                    height: "1px",
                    background: "var(--magenta)",
                    transform: isHover ? "scaleX(1)" : "scaleX(0)",
                    transformOrigin: "left",
                    width: "100%",
                    transition: "transform 320ms ease-out 40ms",
                    opacity: 0.6,
                  }}
                />
              </button>
            </li>
          )
        })}
      </ul>

      {/* Footer strip — institutional version + a fake session id */}
      <div
        style={{
          marginTop: "22px",
          paddingTop: "10px",
          borderTop: "1px solid rgba(232, 230, 220, 0.22)",
          fontFamily: "var(--terminal-font)",
          fontSize: "clamp(9px, 0.7vw, 11px)",
          letterSpacing: "0.32em",
          color: "rgba(232, 230, 220, 0.45)",
          textTransform: "uppercase",
          textShadow: "0 1px 0 rgba(0,0,0,0.55)",
          maxWidth: "360px",
        }}
      >
        Session 0848 · Awaiting selection
      </div>
    </div>
  )
}
