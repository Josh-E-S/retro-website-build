/*
 * Clock — rAF-driven master clock for the opening sequence.
 *
 * Emits elapsed seconds on every animation frame. Pauses cleanly when the
 * tab is hidden and resumes without drift when it returns (the hidden time
 * is subtracted from wall-clock elapsed, so t= keeps advancing relative to
 * time the player actually experienced).
 */

export type ClockHandle = {
  start: () => void
  stop: () => void
  elapsed: () => number
}

export function createClock(onTick: (t: number) => void): ClockHandle {
  let rafId: number | null = null
  let startedAt = 0
  let pausedAt: number | null = null
  let pausedTotal = 0

  const tick = () => {
    const now = performance.now()
    const t = (now - startedAt - pausedTotal) / 1000
    onTick(t)
    rafId = requestAnimationFrame(tick)
  }

  const onVisibility = () => {
    if (document.hidden) {
      pausedAt = performance.now()
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
    } else if (pausedAt !== null) {
      pausedTotal += performance.now() - pausedAt
      pausedAt = null
      rafId = requestAnimationFrame(tick)
    }
  }

  return {
    start: () => {
      if (rafId !== null) return
      startedAt = performance.now()
      pausedTotal = 0
      pausedAt = null
      document.addEventListener("visibilitychange", onVisibility)
      rafId = requestAnimationFrame(tick)
    },
    stop: () => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId)
        rafId = null
      }
      document.removeEventListener("visibilitychange", onVisibility)
    },
    elapsed: () => {
      if (startedAt === 0) return 0
      const now = pausedAt ?? performance.now()
      return (now - startedAt - pausedTotal) / 1000
    },
  }
}
