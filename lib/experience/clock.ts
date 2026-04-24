/*
 * Clock — rAF-driven master clock for the opening sequence.
 *
 * Phase 1 will implement:
 *   - start(t0 = performance.now())
 *   - onTick((tSeconds) => void) for the cue dispatcher
 *   - pause on document.hidden, resume without drift
 *   - stop() to tear down cleanly
 *
 * Phase 0 stub — defines the public shape only.
 */

export type ClockHandle = {
  start: () => void
  stop: () => void
  elapsed: () => number
}

export function createClock(_onTick: (t: number) => void): ClockHandle {
  return {
    start: () => {},
    stop: () => {},
    elapsed: () => 0,
  }
}
