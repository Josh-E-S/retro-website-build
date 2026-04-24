/*
 * Sequence — the single tuning surface for the opening cue timeline.
 *
 * Phase 1 will populate this with the full Cue[] from the spec.
 * For Phase 0, only the type shape is defined so the rest of the
 * experience code can import against a stable contract.
 */

export type Cue =
  | { id: string; t: number; type: "audio"; file: string; volume: number; pan: number }
  | { id: string; t: number; type: "ambient_start"; layer: AmbientLayer }
  | { id: string; t: number; type: "crt_power_on" }
  | {
      id: string
      t: number
      type: "typewriter"
      lines: string[]
      cps: number
      holdAfter?: number
    }
  | { id: string; t: number; type: "screen_clear" }
  | { id: string; t: number; type: "wait"; duration: number }
  | { id: string; t: number; type: "eve_line"; audio: string; caption: string }

export type AmbientLayer = "ballast" | "hvac" | "crt_whine" | "fan"

export const sequence: Cue[] = []
