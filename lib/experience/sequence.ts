/*
 * Sequence — the single tuning surface for the opening cue timeline.
 *
 * Rendering model (updated in the palette/layout pass):
 *   - Most beats are large centered stanzas, one thought at a time.
 *   - The boot checklist is the one "small log" moment — contrast is
 *     part of the pacing.
 *   - Eve's long paragraphs are split into one-sentence stanzas so each
 *     statement lands alone on the screen.
 *
 * Audio cues remain declared here but are stubbed in the dispatcher
 * until Phase 3 lands the audio engine.
 */

export type TypewriterLine = {
  id: string
  text: string
  /** Per-character extra delay in ms, keyed by 0-based index. */
  charDelays?: Record<number, number>
}

export type StanzaSize = "display" | "body"

export type Cue =
  | { id: string; t: number; type: "audio"; file: string; volume: number; pan: number }
  | { id: string; t: number; type: "ambient_start"; layer: AmbientLayer; target: number; fadeMs: number }
  | { id: string; t: number; type: "ambient_dip"; layer: AmbientLayer; depth: number; durationMs: number }
  | { id: string; t: number; type: "crt_power_on" }
  | {
      id: string
      t: number
      type: "stanza"
      lines: TypewriterLine[]
      cps: number
      size?: StanzaSize
      holdAfterMs?: number
    }
  | { id: string; t: number; type: "log_line"; line: TypewriterLine; cps: number }
  | { id: string; t: number; type: "log_dots"; base: string; durationMs: number }
  | { id: string; t: number; type: "clear" }
  | { id: string; t: number; type: "cursor_blink"; on: boolean }
  | { id: string; t: number; type: "eve_line"; audio: string; textLines: string[]; cps: number; holdAfterMs?: number }
  | { id: string; t: number; type: "artifacts_ambient"; on: boolean }
  | { id: string; t: number; type: "glitch"; intensity?: "normal" | "hard" }
  | { id: string; t: number; type: "symbol"; kind?: "heart" | "x" | "robot" }
  | { id: string; t: number; type: "clump"; subtle?: boolean }
  | { id: string; t: number; type: "logo"; holdMs: number }

export type AmbientLayer = "ballast" | "hvac" | "crt_whine" | "fan"

// ── Boot checklist lines ──────────────────────────────────────────────────

const memoryLine: TypewriterLine = { id: "boot_memory", text: "MEMORY CHECK .......... OK" }
const networkLine: TypewriterLine = { id: "boot_network", text: "NETWORK ............... OK" }
const audioLine: TypewriterLine = { id: "boot_audio", text: "AUDIO SUBSYSTEM ....... OK" }

// "BEHAVIORAL TELEMETRY .. ONLINE" — 150ms hitch right before "ONLINE".
const behavioralText = "BEHAVIORAL TELEMETRY .. ONLINE"
const onlineIdx = behavioralText.indexOf("ONLINE")
const behavioralLine: TypewriterLine = {
  id: "boot_telemetry",
  text: behavioralText,
  charDelays: { [onlineIdx - 1]: 150 },
}

// "SESSION COUNTER ....... 848" — each digit 200ms apart.
const sessionText = "SESSION COUNTER ....... 848"
const firstDigitIdx = sessionText.length - 3
const sessionLine: TypewriterLine = {
  id: "boot_session",
  text: sessionText,
  charDelays: {
    [firstDigitIdx - 1]: 200,
    [firstDigitIdx]: 200,
    [firstDigitIdx + 1]: 200,
  },
}

const initLine: TypewriterLine = {
  id: "boot_init",
  text: "INITIALIZING CANDIDATE INTERFACE",
}

// ── Timeline ──────────────────────────────────────────────────────────────

export const sequence: Cue[] = [
  // t=2.0 / 3.2 / 4.5 — three fuses
  { id: "fuse_1", t: 2.0, type: "audio", file: "fuse_01.wav", volume: -12, pan: -0.2 },
  { id: "fuse_2", t: 3.2, type: "audio", file: "fuse_02.wav", volume: -14, pan: 0.15 },
  { id: "fuse_3", t: 4.5, type: "audio", file: "fuse_03.wav", volume: -18, pan: 0 },

  // t=5.0 — ambient bed begins to fade in
  { id: "amb_ballast", t: 5.0, type: "ambient_start", layer: "ballast", target: -24, fadeMs: 1500 },
  { id: "amb_hvac", t: 5.0, type: "ambient_start", layer: "hvac", target: -30, fadeMs: 1500 },
  { id: "amb_whine", t: 5.0, type: "ambient_start", layer: "crt_whine", target: -36, fadeMs: 1500 },

  // t=6.5 — CRT power-on (sound + visual)
  { id: "crt_power_audio", t: 6.5, type: "audio", file: "crt_power_on.wav", volume: -8, pan: 0 },
  { id: "crt_power_visual", t: 6.5, type: "crt_power_on" },
  { id: "amb_fan", t: 6.5, type: "ambient_start", layer: "fan", target: -28, fadeMs: 1500 },

  // t=7.5 — baseline tetris corruption starts running in the background
  { id: "artifacts_on", t: 7.5, type: "artifacts_ambient", on: true },

  // t=8.0 — Choice Industries logo reveals as the header beat
  { id: "header_logo", t: 8.0, type: "logo", holdMs: 3200 },

  // t=11.5 — clear to boot checklist (small log)
  { id: "clear_before_log", t: 11.5, type: "clear" },

  // t=11.8 — boot checklist, left-aligned small log
  { id: "log_memory", t: 11.8, type: "log_line", line: memoryLine, cps: 30 },
  { id: "log_network", t: 12.8, type: "log_line", line: networkLine, cps: 30 },
  { id: "log_audio", t: 13.8, type: "log_line", line: audioLine, cps: 30 },
  { id: "log_telemetry", t: 14.8, type: "log_line", line: behavioralLine, cps: 30 },
  { id: "log_session", t: 15.9, type: "log_line", line: sessionLine, cps: 30 },

  // ~t=17.0 — initializing with dots loop
  { id: "log_init", t: 17.2, type: "log_line", line: initLine, cps: 30 },
  { id: "log_init_dots", t: 18.3, type: "log_dots", base: "INITIALIZING CANDIDATE INTERFACE", durationMs: 1400 },

  // t=20.0 — clear, welcome stanza
  { id: "clear_to_welcome", t: 19.9, type: "clear" },
  {
    id: "welcome_title",
    t: 20.2,
    type: "stanza",
    lines: [
      { id: "w_1", text: "WELCOME TO" },
      { id: "w_2", text: "THE ABLATION STUDY" },
    ],
    cps: 22,
    size: "display",
    holdAfterMs: 1800,
  },

  // t=24.5 — smaller body stanza: "A research initiative of Choice Industries"
  {
    id: "welcome_sub",
    t: 24.5,
    type: "stanza",
    lines: [
      { id: "ws_1", text: "A research initiative of" },
      { id: "ws_2", text: "Choice Industries" },
    ],
    cps: 32,
    size: "body",
    holdAfterMs: 1800,
  },

  // t=28.2 — notice stanza
  {
    id: "welcome_notice",
    t: 28.2,
    type: "stanza",
    lines: [
      { id: "wn_1", text: "Your candidate session" },
      { id: "wn_2", text: "will begin momentarily." },
    ],
    cps: 32,
    size: "body",
    holdAfterMs: 1500,
  },

  // t=32.0 — remain at desk stanza (and cursor on, the room goes quiet)
  {
    id: "remain",
    t: 32.0,
    type: "stanza",
    lines: [{ id: "r_1", text: "Please remain at your desk." }],
    cps: 32,
    size: "body",
    holdAfterMs: 600,
  },
  { id: "cursor_on", t: 33.8, type: "cursor_blink", on: true },

  // Intentional 4-second silence window before Eve. Subliminal cues
  // declared here so the audio layer can drop a ballast dip + relay tick
  // during the wait without extra wiring.
  { id: "wait_ballast_dip", t: 35.0, type: "ambient_dip", layer: "ballast", depth: -8, durationMs: 200 },
  { id: "wait_subtle_clump", t: 35.4, type: "clump", subtle: true },
  { id: "wait_tick", t: 37.0, type: "audio", file: "ambient_tick_01.wav", volume: -22, pan: 0.15 },

  // ── Eve's first line, broken into individual stanzas ──────────────────
  { id: "cursor_off_before_eve_1", t: 37.9, type: "cursor_blink", on: false },
  {
    id: "eve_1a",
    t: 38.0,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["Hello.", "You're awake."],
    cps: 22,
    holdAfterMs: 1500,
  },
  {
    id: "eve_1b",
    t: 42.2,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["My name is Eve."],
    cps: 22,
    holdAfterMs: 700,
  },
  {
    id: "eve_1c",
    t: 45.2,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: [
      "I'm here to help you",
      "through your enrollment.",
    ],
    cps: 28,
    holdAfterMs: 900,
  },
  {
    id: "eve_1d",
    t: 49.2,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: [
      "Please take a moment",
      "to orient yourself.",
    ],
    cps: 28,
    holdAfterMs: 900,
  },
  {
    id: "eve_1e",
    t: 53.2,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["There is no hurry."],
    cps: 22,
    holdAfterMs: 2400,
  },

  // 3-second hold in silence per spec §3.3.

  // ── Eve's second line, broken into stanzas ─────────────────────────────
  {
    id: "eve_2a",
    t: 60.5,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: [
      "Some candidates experience",
      "disorientation",
      "during the initial enrollment period.",
    ],
    cps: 32,
    holdAfterMs: 1000,
  },
  // Hard glitch right as the word "disorientation" lands. The visual
  // contradicts Eve's calm — the screen momentarily loses integrity the
  // instant she names the thing the player is feeling.
  { id: "glitch_disorientation", t: 62.8, type: "glitch", intensity: "hard" },
  {
    id: "eve_2b",
    t: 66.2,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["This is common.", "It will pass."],
    cps: 22,
    holdAfterMs: 1200,
  },
  // A robot face appears somewhere on screen for ~500ms right after
  // "It will pass." The player will question whether they saw it.
  { id: "symbol_after_pass", t: 69.4, type: "symbol", kind: "robot" },
  {
    id: "eve_2c",
    t: 71.5,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: [
      "The Ablation Study is a",
      "voluntary research initiative",
      "conducted by Choice Industries.",
    ],
    cps: 32,
    holdAfterMs: 1200,
  },
  {
    id: "eve_2d",
    t: 78.5,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: [
      "You were selected",
      "based on your application,",
      "and you are here",
      "because you consented to be here.",
    ],
    cps: 32,
    holdAfterMs: 1400,
  },
  {
    id: "eve_2e",
    t: 86.5,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: [
      "If at any point you need a moment,",
      "you may take one.",
    ],
    cps: 30,
    holdAfterMs: 1000,
  },
  {
    id: "eve_2f",
    t: 91.8,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["The study proceeds at your pace."],
    cps: 28,
    holdAfterMs: 1800,
  },
  {
    id: "eve_2g",
    t: 96.8,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: [
      "Before we begin,",
      "I'll need to confirm a few details.",
    ],
    cps: 30,
    holdAfterMs: 900,
  },
  {
    id: "eve_2h",
    t: 101.8,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: [
      "There are no wrong answers.",
    ],
    cps: 24,
    holdAfterMs: 1100,
  },
  { id: "glitch_no_wrong", t: 103.4, type: "glitch", intensity: "normal" },
  {
    id: "eve_2i",
    t: 105.8,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: [
      "This is just to help me understand",
      "how best to support you today.",
    ],
    cps: 32,
    holdAfterMs: 1600,
  },
  {
    id: "eve_2j",
    t: 112.0,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["Are you ready to continue?"],
    cps: 22,
    holdAfterMs: 0,
  },
  { id: "cursor_on_after_eve", t: 116.0, type: "cursor_blink", on: true },
]
