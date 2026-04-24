/*
 * Eve's voice lines — source of truth for TTS generation.
 *
 * These are the full, speakable sentences. The on-screen stanza breaks
 * in sequence.ts are a separate concern (visual pacing); here we keep
 * the text natural so Eve's prosody and breath come through.
 *
 * Each entry gets rendered to public/audio/<id>.mp3 by scripts/generate-eve-voices.ts.
 *
 * Voice direction (per the spec + the Almee voice choice):
 *   Warm, unhurried, professionally calm. Bedside manner, not
 *   customer service. The voice of a clinician who has done this
 *   thousands of times and is still gentle every time.
 */

export type EveVoiceLine = {
  /** Matches the on-screen cue ID family (e.g. "eve_1a" feeds eve_1a.mp3). */
  id: string
  /** The full line as Eve would speak it. Use ellipses for beats, commas for breaths. */
  text: string
}

export const EVE_LINES: EveVoiceLine[] = [
  // ── First line (t≈32s in current sequence) ──────────────────────────
  {
    id: "eve_1a",
    text: "Hello. You're awake.",
  },
  {
    id: "eve_1b",
    text: "My name is Eve.",
  },
  {
    id: "eve_1c",
    text: "I'm here to help you through your enrollment.",
  },
  {
    id: "eve_1d",
    text: "Please take a moment to orient yourself.",
  },
  {
    id: "eve_1e",
    text: "There is no hurry.",
  },

  // ── Second line ──────────────────────────────────────────────────────
  {
    id: "eve_2a",
    text: "Some candidates experience disorientation during the initial enrollment period.",
  },
  {
    id: "eve_2b",
    text: "This is common. It will pass.",
  },
  {
    id: "eve_2c",
    text: "The Ablation Study is a voluntary research initiative conducted by Choice Industries.",
  },
  {
    id: "eve_2d",
    text: "You were selected based on your application, and you are here because you consented to be here.",
  },
  {
    id: "eve_2e",
    text: "If at any point you need a moment, you may take one.",
  },
  {
    id: "eve_2f",
    text: "The study proceeds at your pace.",
  },
  {
    id: "eve_2g",
    text: "Before we begin, I'll need to confirm a few details.",
  },
  {
    id: "eve_2h",
    text: "There are no wrong answers.",
  },
  {
    id: "eve_2i",
    text: "This is just to help me understand how best to support you today.",
  },
  {
    id: "eve_2j",
    text: "Are you ready to continue?",
  },
]

// Voice configuration — matches the Almee / Eleven v3 / Creative-stability
// choice confirmed in the UI. Centralised here so the script and any
// runtime inspection share one source.
export const EVE_VOICE_CONFIG = {
  voiceId: "zA6D7RyKdc2EClouEMkP",
  modelId: "eleven_v3",
  voiceSettings: {
    // Creative end of the stability slider. Low stability gives more
    // emotional range and variation, which matches the warm-bedside
    // direction. Short lines mean drift isn't an issue.
    stability: 0.3,
    similarityBoost: 0.75,
    // Style at 0 keeps her from over-performing. We want calm, not actorly.
    style: 0,
    useSpeakerBoost: true,
  },
} as const
