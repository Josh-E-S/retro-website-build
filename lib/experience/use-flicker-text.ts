"use client"

import { useEffect, useState } from "react"

/*
 * Independent per-character flicker scheduler.
 *
 * Picks 1–2 random characters at random intervals and spins them
 * through 4–6 random-glyph frames before settling back to clean.
 * Most characters sit still — only one or two are mid-flicker at any
 * given moment, then a different pair picks up. Reads as a live
 * transmission with intermittent corruption, not a marquee.
 *
 * Used by both Wakeup and Boot; the same scheduler keeps the visual
 * cadence consistent across phases.
 */

const SCRAMBLE_GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@$%&*+=?!/\\<>"

export function useFlickerText(
  realText: string,
  enabled: boolean,
  opts: { intervalMin?: number; intervalMax?: number; parallelChance?: number } = {},
): string {
  const intervalMin = opts.intervalMin ?? 350
  const intervalMax = opts.intervalMax ?? 800
  const parallelChance = opts.parallelChance ?? 0.3

  const [display, setDisplay] = useState(realText)

  useEffect(() => {
    if (!enabled) {
      setDisplay(realText)
      return
    }
    const charState: (string | null)[] = realText.split("").map(() => null)
    let cancelled = false
    const timers: ReturnType<typeof setTimeout>[] = []

    const render = () => {
      let out = ""
      for (let i = 0; i < realText.length; i++) {
        const real = realText[i]
        if (real === " " || real === "." || real === ",") {
          out += real
        } else {
          out += charState[i] ?? real
        }
      }
      setDisplay(out)
    }

    const flickerOne = (idx: number) => {
      if (cancelled) return
      const real = realText[idx]
      if (real === " " || real === "." || real === ",") return
      const frames = 4 + Math.floor(Math.random() * 3)
      const frameMs = 35 + Math.floor(Math.random() * 25)
      let f = 0
      const tick = () => {
        if (cancelled) return
        if (f >= frames) {
          charState[idx] = null
          render()
          return
        }
        charState[idx] = SCRAMBLE_GLYPHS[Math.floor(Math.random() * SCRAMBLE_GLYPHS.length)]
        render()
        f += 1
        timers.push(setTimeout(tick, frameMs))
      }
      tick()
    }

    const scheduleNext = () => {
      if (cancelled) return
      const wait = intervalMin + Math.random() * (intervalMax - intervalMin)
      timers.push(setTimeout(() => {
        if (cancelled) return
        const idxs: number[] = []
        const tryPick = () => {
          for (let attempt = 0; attempt < 8; attempt++) {
            const i = Math.floor(Math.random() * realText.length)
            const ch = realText[i]
            if (ch === " " || ch === "." || ch === ",") continue
            if (charState[i] !== null) continue
            if (idxs.includes(i)) continue
            return i
          }
          return -1
        }
        const first = tryPick()
        if (first >= 0) idxs.push(first)
        if (Math.random() < parallelChance) {
          const second = tryPick()
          if (second >= 0) idxs.push(second)
        }
        idxs.forEach((i) => flickerOne(i))
        scheduleNext()
      }, wait))
    }

    scheduleNext()
    return () => {
      cancelled = true
      timers.forEach(clearTimeout)
      setDisplay(realText)
    }
  }, [realText, enabled, intervalMin, intervalMax, parallelChance])

  return display
}
