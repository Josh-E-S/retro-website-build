"use client"

/*
 * Experience — top-level client component for The Ablation Study.
 *
 * Phase 0 state: renders nothing. The page is black. That's correct —
 * the spec's opening is a black screen before any user interaction.
 *
 * Phase 1 will add:
 *   - <Unlock /> (press-to-start gate that kicks AudioContext + t=0)
 *   - master clock driving the Cue[] from lib/experience/sequence.ts
 *   - <Stage />, <Terminal />, <Captions />, <AccessibilityDock />
 *
 * Keeping this intentionally empty until those pieces arrive, so the
 * "fresh black screen" build stays honest.
 */
export function Experience() {
  return <main aria-hidden="true" />
}
