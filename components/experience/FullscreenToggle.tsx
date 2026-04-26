"use client"

import { useCallback, useEffect, useState } from "react"

/*
 * FullscreenToggle — small icon button pinned to the top-right.
 *
 * Hidden until JS confirms the Fullscreen API is available (some
 * embedded contexts disallow it; iOS Safari only supports it on
 * <video>, not document). Visible across every phase so the player
 * can swap modes whenever they want.
 */

function isFullscreenSupported(): boolean {
  if (typeof document === "undefined") return false
  const doc = document as Document & { webkitFullscreenEnabled?: boolean }
  return Boolean(doc.fullscreenEnabled || doc.webkitFullscreenEnabled)
}

function getFullscreenElement(): Element | null {
  const doc = document as Document & { webkitFullscreenElement?: Element | null }
  return document.fullscreenElement ?? doc.webkitFullscreenElement ?? null
}

async function enter(): Promise<void> {
  const el = document.documentElement as HTMLElement & {
    webkitRequestFullscreen?: () => Promise<void>
  }
  if (el.requestFullscreen) {
    await el.requestFullscreen()
  } else if (el.webkitRequestFullscreen) {
    await el.webkitRequestFullscreen()
  }
}

async function exit(): Promise<void> {
  const doc = document as Document & {
    webkitExitFullscreen?: () => Promise<void>
  }
  if (document.exitFullscreen) {
    await document.exitFullscreen()
  } else if (doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen()
  }
}

export function FullscreenToggle() {
  const [supported, setSupported] = useState(false)
  const [isFs, setIsFs] = useState(false)

  useEffect(() => {
    setSupported(isFullscreenSupported())
    const update = () => setIsFs(getFullscreenElement() !== null)
    update()
    document.addEventListener("fullscreenchange", update)
    document.addEventListener("webkitfullscreenchange", update)
    return () => {
      document.removeEventListener("fullscreenchange", update)
      document.removeEventListener("webkitfullscreenchange", update)
    }
  }, [])

  const toggle = useCallback(() => {
    if (getFullscreenElement()) void exit()
    else void enter()
  }, [])

  if (!supported) return null

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isFs ? "Exit fullscreen" : "Enter fullscreen"}
      title={isFs ? "Exit fullscreen" : "Enter fullscreen"}
      style={{
        position: "fixed",
        top: "max(env(safe-area-inset-top), 12px)",
        right: "max(env(safe-area-inset-right), 12px)",
        zIndex: 100,
        width: "36px",
        height: "36px",
        padding: 0,
        background: "rgba(15, 23, 32, 0.55)",
        border: "1px solid rgba(232, 230, 220, 0.35)",
        borderRadius: "4px",
        color: "rgba(232, 230, 220, 0.85)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(2px)",
        WebkitBackdropFilter: "blur(2px)",
        transition: "background 160ms ease, color 160ms ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "rgba(15, 23, 32, 0.78)"
        e.currentTarget.style.color = "rgba(255, 255, 255, 1)"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "rgba(15, 23, 32, 0.55)"
        e.currentTarget.style.color = "rgba(232, 230, 220, 0.85)"
      }}
    >
      {isFs ? (
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M3 6h3V3M10 3v3h3M13 10h-3v3M6 13v-3H3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="square"
          />
        </svg>
      ) : (
        <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
          <path
            d="M3 6V3h3M13 6V3h-3M3 10v3h3M13 10v3h-3"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinecap="square"
          />
        </svg>
      )}
    </button>
  )
}
