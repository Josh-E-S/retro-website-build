"use client"

import { useEffect, useRef, useState } from "react"
import { useFlickerText } from "@/lib/experience/use-flicker-text"

/*
 * Boot — the transitional phase between Wakeup and Intro.
 *
 * Runs for ~4.5 seconds on its own black/amber screen. From the moment
 * the player presses space:
 *
 *   0ms      ESTABLISHING LINK_ types in (per-character flicker)
 *   ~400ms   Loading bar appears; non-linear fill (stutters, one jump
 *            backwards, % digits occasionally scramble)
 *   throughout: corporate-internal status lines stream below the bar,
 *            some get corrupted mid-render
 *   ~3150ms  Single frame of "DO NOT TRUST" flickers in (~70% mark)
 *   ~4000ms  Bar locks at 100%, % digits scramble briefly, settle
 *   ~4200ms  White flash overlay fades up (CRT power-on)
 *   ~4350ms  Phase transition fires (Stage takes over underneath)
 *   ~4950ms  White flash fully out — by now the cream Stage owns the
 *            screen and music continues seamlessly across the boundary
 *
 * Audio is owned by Experience.handleUnlock — it scheduled the power-on
 * SFX, ambient ramp, and music fade-up before this component mounted.
 * Boot itself only fires a single relay-click on bar completion.
 */

const AMBER = "#d9b24a"
const AMBER_DEEP = "#a97e1f"
const AMBER_GLOW = "rgba(217, 178, 74, 0.55)"

const BOOT_DURATION_MS = 4500
const FLASH_START_MS = 4200
const FLASH_PEAK_MS = 4350
const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*+=?!/\\<>"

const BAR_CELLS = 40
const FILLED_CHAR = "▓" // ▓
const EMPTY_CHAR = "░" // ░

// Off-tone-creepy status lines. Order roughly mimics increasing
// invasiveness. A subset gets "corrupted" mid-render (chunk replaced
// with glyphs for a moment, then resolves). The phrases are deliberate:
// the player has not actually consented to anything yet, so lines like
// "CONSENT VERIFIED" land as quietly menacing.
type StatusLine = { text: string; appearAt: number; corruptAt?: number }

const STATUS_LINES: StatusLine[] = [
  { text: "> ESTABLISHING LINK", appearAt: 0 },
  { text: "> IDENTIFYING CANDIDATE ........... OK", appearAt: 700 },
  { text: "> MATCHING BIOMETRICS ............. OK", appearAt: 1300 },
  { text: "> RETRIEVING PRIOR SESSIONS ....... 12", appearAt: 1900, corruptAt: 2200 },
  { text: "> CONSENT VERIFIED ................ TRUE", appearAt: 2600 },
  { text: "> CALIBRATING NEURAL HANDSHAKE .... OK", appearAt: 3300 },
  { text: "> CANDIDATE INTERFACE ............. READY", appearAt: 4000 },
]

// Non-linear bar fill. Each control point is { atMs, percent }.
// Includes a 200ms stutter at 28%, a small backwards step at 55%,
// a brief pause at 70% (pairs with the DO NOT TRUST flash), and a
// final 200ms scramble before the lock to 100%.
const BAR_KEYFRAMES: Array<{ at: number; pct: number }> = [
  { at: 400, pct: 0 },
  { at: 700, pct: 8 },
  { at: 1100, pct: 28 },
  { at: 1300, pct: 28 },   // stutter hold
  { at: 1450, pct: 32 },
  { at: 2100, pct: 55 },
  { at: 2280, pct: 51 },   // backwards blip
  { at: 2500, pct: 60 },
  { at: 3050, pct: 70 },
  { at: 3250, pct: 70 },   // pause (DO NOT TRUST flashes during this)
  { at: 3700, pct: 88 },
  { at: 4000, pct: 96 },
  { at: 4150, pct: 100 },
]

// Linear interpolate the bar percent at a given t (ms).
function barPercentAt(tMs: number): number {
  if (tMs <= BAR_KEYFRAMES[0].at) return 0
  for (let i = 1; i < BAR_KEYFRAMES.length; i++) {
    const a = BAR_KEYFRAMES[i - 1]
    const b = BAR_KEYFRAMES[i]
    if (tMs <= b.at) {
      const span = b.at - a.at
      if (span <= 0) return b.pct
      const k = (tMs - a.at) / span
      return a.pct + (b.pct - a.pct) * k
    }
  }
  return BAR_KEYFRAMES[BAR_KEYFRAMES.length - 1].pct
}

// Render a 40-cell bar string for an integer 0..100.
function renderBar(pct: number): string {
  const filled = Math.round((Math.max(0, Math.min(100, pct)) / 100) * BAR_CELLS)
  return FILLED_CHAR.repeat(filled) + EMPTY_CHAR.repeat(BAR_CELLS - filled)
}

// Replace a random run inside a string with scramble glyphs.
function corruptChunk(text: string, runMin = 4, runMax = 8): string {
  if (text.length < runMin + 2) return text
  const len = runMin + Math.floor(Math.random() * (runMax - runMin + 1))
  const start = Math.floor(Math.random() * (text.length - len))
  let out = text.slice(0, start)
  for (let i = 0; i < len; i++) {
    out += SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]
  }
  out += text.slice(start + len)
  return out
}

type Props = {
  /** Fired ~4.35s in, just after the white flash peaks. */
  onComplete: () => void
  /** Optional — Boot fires this on the bar's "lock" event so the
   *  audio engine can play a relay-click. */
  onBarLock?: () => void
}

export function Boot({ onComplete, onBarLock }: Props) {
  const startedAt = useRef(performance.now())
  const [tMs, setTMs] = useState(0)
  const [showFlash, setShowFlash] = useState(false)
  // Visible status lines (by index — appearAt-driven).
  const [visibleCount, setVisibleCount] = useState(0)
  // Per-line corruption state: which lines should currently render
  // their text corrupted vs. clean.
  const [corruptedLines, setCorruptedLines] = useState<Record<number, string>>({})
  // One-frame "DO NOT TRUST" flash near the 70% mark.
  const [showDoNotTrust, setShowDoNotTrust] = useState(false)
  // % digit scramble during pauses + final lock.
  const [pctScramble, setPctScramble] = useState(false)
  // Bar lock (final 100% with relay click).
  const lockedRef = useRef(false)

  const headerDisplay = useFlickerText(
    "ESTABLISHING LINK",
    true,
    { intervalMin: 250, intervalMax: 600, parallelChance: 0.4 },
  )

  // Master rAF clock for the boot scene.
  useEffect(() => {
    let raf = 0
    let alive = true
    const tick = () => {
      if (!alive) return
      const elapsed = performance.now() - startedAt.current
      setTMs(elapsed)

      // Trigger DO NOT TRUST at ~3120ms for ~80ms.
      if (elapsed > 3120 && elapsed < 3210 && !showDoNotTrust) {
        setShowDoNotTrust(true)
      } else if (elapsed >= 3210 && showDoNotTrust) {
        setShowDoNotTrust(false)
      }

      // Bar lock at the keyframe end.
      if (!lockedRef.current && elapsed >= 4150) {
        lockedRef.current = true
        onBarLock?.()
      }

      // White flash fade-up.
      if (elapsed >= FLASH_START_MS && !showFlash) {
        setShowFlash(true)
      }

      // Phase handoff right at the flash peak — the cream Stage mounts
      // underneath the white-out, so the swap is hidden.
      if (elapsed >= FLASH_PEAK_MS) {
        alive = false
        onComplete()
        return
      }

      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
    // onComplete / onBarLock are stable callbacks from parent.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Status line appearance scheduler.
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    STATUS_LINES.forEach((line, i) => {
      timers.push(setTimeout(() => setVisibleCount((c) => Math.max(c, i + 1)), line.appearAt))
      if (line.corruptAt !== undefined) {
        // Hold a corrupted version for ~280ms, then resolve.
        const corruptStart = line.corruptAt
        const corruptEnd = corruptStart + 280
        const corruptTickMs = 60
        let elapsed = 0
        const corruptLoop = () => {
          if (elapsed > corruptEnd - corruptStart) {
            setCorruptedLines((cur) => {
              const next = { ...cur }
              delete next[i]
              return next
            })
            return
          }
          setCorruptedLines((cur) => ({
            ...cur,
            [i]: corruptChunk(line.text, 5, 10),
          }))
          elapsed += corruptTickMs
          timers.push(setTimeout(corruptLoop, corruptTickMs))
        }
        timers.push(setTimeout(corruptLoop, corruptStart))
      }
    })
    return () => timers.forEach(clearTimeout)
  }, [])

  // % digit scramble window: at the 28% stutter (1100–1300ms),
  // the 70% pause (3050–3250ms), and the final lock approach
  // (3950–4150ms).
  useEffect(() => {
    let raf = 0
    let alive = true
    const tick = () => {
      if (!alive) return
      const elapsed = performance.now() - startedAt.current
      const inStutter =
        (elapsed > 1100 && elapsed < 1300) ||
        (elapsed > 3050 && elapsed < 3250) ||
        (elapsed > 3950 && elapsed < 4150)
      setPctScramble(inStutter)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      alive = false
      cancelAnimationFrame(raf)
    }
  }, [])

  // Compute current bar values.
  const pct = lockedRef.current ? 100 : barPercentAt(tMs)
  const barText = renderBar(pct)
  const pctLabel = pctScramble && !lockedRef.current
    ? // 2-char scramble for the percent digits during pauses.
      `${SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]}${SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]}%`
    : `${Math.floor(pct).toString().padStart(2, " ")}%`

  // Visible status lines, with corruption applied where active.
  const visibleLines = STATUS_LINES.slice(0, visibleCount).map((line, i) => {
    const corrupted = corruptedLines[i]
    return corrupted ?? line.text
  })

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#000",
        color: AMBER,
        fontFamily: "var(--terminal-font, ui-monospace, monospace)",
        userSelect: "none",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "flex-start",
        padding: "calc(8vh) calc(8vw) 6vh",
        boxSizing: "border-box",
        gap: "20px",
      }}
    >
      {/* Header line — flickering ESTABLISHING LINK. */}
      <div
        style={{
          fontSize: "clamp(20px, 1.9vw, 26px)",
          letterSpacing: "0.32em",
          textTransform: "uppercase",
          color: AMBER,
          textShadow: `0 0 10px ${AMBER_GLOW}, 0 0 2px ${AMBER_DEEP}`,
          whiteSpace: "pre",
        }}
      >
        {`> ${headerDisplay}_`}
      </div>

      {/* Loading bar. Appears after ~400ms; we conditionally render so
          the screen feels paced. */}
      {tMs >= 400 && (
        <div
          style={{
            fontSize: "clamp(18px, 1.5vw, 22px)",
            letterSpacing: "0.05em",
            color: AMBER,
            textShadow: `0 0 8px ${AMBER_GLOW}`,
            whiteSpace: "pre",
          }}
        >
          {`[${barText}] ${pctLabel}`}
        </div>
      )}

      {/* Status lines — stream below the bar in scroll order. */}
      <div
        style={{
          marginTop: "10px",
          fontSize: "clamp(15px, 1.2vw, 18px)",
          letterSpacing: "0.18em",
          color: AMBER,
          textShadow: `0 0 6px ${AMBER_GLOW}`,
          opacity: 0.85,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          whiteSpace: "pre",
        }}
      >
        {visibleLines.map((text, i) => (
          <div key={i}>{text}</div>
        ))}
      </div>

      {/* Bottom blinking cursor — same cell shape as Wakeup's, smaller. */}
      <div
        style={{
          marginTop: "auto",
          width: "18px",
          height: "32px",
          background: AMBER,
          boxShadow: `0 0 10px ${AMBER_GLOW}, 0 0 3px ${AMBER_DEEP}`,
          animation: "wakeup-cursor-blink 1.1s steps(1) infinite",
        }}
      />

      {/* DO NOT TRUST one-frame flash. Larger, red, briefly overlays. */}
      {showDoNotTrust && (
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            pointerEvents: "none",
            zIndex: 5,
          }}
        >
          <div
            style={{
              fontSize: "clamp(40px, 5vw, 64px)",
              fontWeight: 800,
              letterSpacing: "0.4em",
              color: "#ff3a3a",
              textShadow: "0 0 18px rgba(255, 80, 80, 0.85), 0 0 4px #6a0000",
              transform: "translateX(2px)",
            }}
          >
            DO NOT TRUST
          </div>
        </div>
      )}

      {/* White flash overlay — fades in fast, holds, fades out slower.
          The phase swap fires at the peak so the next screen is hidden
          underneath the white-out. */}
      <div
        aria-hidden="true"
        style={{
          position: "absolute",
          inset: 0,
          background: "#ffffff",
          opacity: showFlash ? 1 : 0,
          transition: showFlash
            ? `opacity ${FLASH_PEAK_MS - FLASH_START_MS}ms ease-out`
            : "none",
          pointerEvents: "none",
          zIndex: 10,
        }}
      />

      <style>{`
        @keyframes wakeup-cursor-blink {
          0%, 49%   { opacity: 1; }
          50%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
