/*
 * Sequence — the single tuning surface for the opening cue timeline.
 *
 * Timing reference: t=0 is the moment the Stage mounts after the
 * player presses ESTABLISH LINK. The Stage's multi-stage power-on
 * animation runs t=0.0 → ~0.8s on its own; cues below start after
 * the tube has settled.
 *
 * Rendering model:
 *   - LogoStage owns the Choice Industries logo. Two states: "center"
 *     (big, pulsing) and "corner" (small, top-left). Transitions on
 *     logo_position cues.
 *   - Terminal renders centered stanzas (one thought at a time) or
 *     centered small-log text (boot checklist).
 *   - Artifacts runs ambient corruption + fires glitch/symbol/clump
 *     cues on command.
 *
 * Audio cues remain declared here but are stubbed until Phase 3.
 */

export type TypewriterLine = {
  id: string
  text: string
  charDelays?: Record<number, number>
}

export type StanzaSize = "display" | "body"

export type LogoPosition = "center" | "corner"

export type Cue =
  | { id: string; t: number; type: "audio"; file: string; volume: number; pan: number }
  | { id: string; t: number; type: "ambient_start"; layer: AmbientLayer; target: number; fadeMs: number }
  | { id: string; t: number; type: "ambient_dip"; layer: AmbientLayer; depth: number; durationMs: number }
  | {
      id: string
      t: number
      type: "stanza"
      lines: TypewriterLine[]
      cps: number
      size?: StanzaSize
      holdAfterMs?: number
      /** Arrival style. "type" (default) runs the typewriter; "glitch_resolve"
       *  does a scrambled-char arrival with chromatic offset, settles clean. */
      variant?: "type" | "glitch_resolve"
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
  | { id: string; t: number; type: "logo_position"; position: LogoPosition }
  | { id: string; t: number; type: "music_start"; fadeMs?: number }
  | { id: string; t: number; type: "music_stop"; fadeMs?: number }
  | { id: string; t: number; type: "trapped_avatar" }

export type AmbientLayer = "ballast" | "hvac" | "crt_whine" | "fan" | "crt_hum"

// ── Boot checklist lines (rendered centered in log mode) ───────────────

const memoryLine: TypewriterLine = { id: "boot_memory", text: "MEMORY CHECK .......... OK" }
const networkLine: TypewriterLine = { id: "boot_network", text: "NETWORK ............... OK" }
const audioLine: TypewriterLine = { id: "boot_audio", text: "AUDIO SUBSYSTEM ....... OK" }

const behavioralText = "BEHAVIORAL TELEMETRY .. ONLINE"
const onlineIdx = behavioralText.indexOf("ONLINE")
const behavioralLine: TypewriterLine = {
  id: "boot_telemetry",
  text: behavioralText,
  charDelays: { [onlineIdx - 1]: 150 },
}

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

// ── Timeline ──────────────────────────────────────────────────────────
// t=0 is the moment the Stage mounts (post-unlock). The Stage's own
// power-on animation takes ~0.8s; we give it 1.0s of clean headroom
// before the logo appears.

export const sequence: Cue[] = [
  // t=0.2 — three fuses overlap the Stage power-on flicker
  { id: "fuse_1", t: 0.2, type: "audio", file: "fuse_01.wav", volume: -12, pan: -0.2 },
  { id: "fuse_2", t: 0.6, type: "audio", file: "fuse_02.wav", volume: -14, pan: 0.15 },

  // t=1.0 — baseline corruption starts
  { id: "artifacts_on", t: 1.0, type: "artifacts_ambient", on: true },

  // t=1.0 — ambient bed starts fading in
  { id: "amb_ballast", t: 1.0, type: "ambient_start", layer: "ballast", target: -24, fadeMs: 1500 },
  { id: "amb_hvac", t: 1.0, type: "ambient_start", layer: "hvac", target: -30, fadeMs: 1500 },
  { id: "amb_whine", t: 1.0, type: "ambient_start", layer: "crt_whine", target: -36, fadeMs: 1500 },
  { id: "amb_fan", t: 1.4, type: "ambient_start", layer: "fan", target: -28, fadeMs: 1500 },
  { id: "amb_crt_hum", t: 1.4, type: "ambient_start", layer: "crt_hum", target: -24, fadeMs: 1800 },

  // Lobby music bed fades in alongside the ambient layers.
  { id: "music_start", t: 1.2, type: "music_start", fadeMs: 2400 },

  // t=1.2 — logo comes up, big and centered, heartbeat pulse
  { id: "logo_center", t: 1.2, type: "logo_position", position: "center" },

  // t=4.8 — logo tucks to top-left BEFORE any text appears, so the
  // boot checklist (and everything after) has a clean centered stage.
  { id: "logo_to_corner", t: 4.8, type: "logo_position", position: "corner" },

  // t=5.0 — boot checklist begins (center-aligned small text)
  { id: "log_memory", t: 5.0, type: "log_line", line: memoryLine, cps: 30 },
  { id: "log_network", t: 6.0, type: "log_line", line: networkLine, cps: 30 },
  { id: "log_audio", t: 7.0, type: "log_line", line: audioLine, cps: 30 },
  { id: "log_telemetry", t: 8.0, type: "log_line", line: behavioralLine, cps: 30 },
  { id: "log_session", t: 9.1, type: "log_line", line: sessionLine, cps: 30 },

  // t=10.4 — initializing + dots loop
  { id: "log_init", t: 10.4, type: "log_line", line: initLine, cps: 30 },
  { id: "log_init_dots", t: 11.5, type: "log_dots", base: "INITIALIZING CANDIDATE INTERFACE", durationMs: 1400 },

  // t=13.0 — clear, welcome stanza arriving as a glitch-resolve
  { id: "clear_to_welcome", t: 13.0, type: "clear" },
  {
    id: "welcome_title",
    t: 13.3,
    type: "stanza",
    lines: [
      { id: "w_1", text: "WELCOME TO" },
      { id: "w_2", text: "THE ABLATION STUDY" },
    ],
    cps: 22,
    size: "display",
    variant: "glitch_resolve",
    // Hold longer — this is the beat that sets the tone for the whole
    // experience. Spec called 1.8s; we double+ it so the phrase lands.
    holdAfterMs: 5200,
  },
  {
    id: "welcome_sub",
    // Delayed ~3s to accommodate the longer hold above.
    t: 20.4,
    type: "stanza",
    lines: [
      { id: "ws_1", text: "A research initiative of" },
      { id: "ws_2", text: "Choice Industries" },
    ],
    cps: 32,
    size: "body",
    holdAfterMs: 1800,
  },
  {
    id: "welcome_notice",
    t: 24.1,
    type: "stanza",
    lines: [
      { id: "wn_1", text: "Your candidate session" },
      { id: "wn_2", text: "will begin momentarily." },
    ],
    cps: 32,
    size: "body",
    holdAfterMs: 1500,
  },
  {
    id: "remain",
    t: 27.9,
    type: "stanza",
    lines: [{ id: "r_1", text: "Please remain at your desk." }],
    cps: 32,
    size: "body",
    holdAfterMs: 600,
  },
  { id: "cursor_on", t: 29.7, type: "cursor_blink", on: true },

  // Intentional 4-second silence
  { id: "wait_ballast_dip", t: 30.9, type: "ambient_dip", layer: "ballast", depth: -8, durationMs: 200 },
  { id: "wait_subtle_clump", t: 31.3, type: "clump", subtle: true },
  // Trapped-avatar burst in the silence before Eve speaks — the player
  // hears the voice of something already in the system.
  { id: "wait_trapped", t: 31.9, type: "trapped_avatar" },
  { id: "wait_tick", t: 32.9, type: "audio", file: "ambient_tick_01.wav", volume: -22, pan: 0.15 },

  // ── Eve's first line ─────────────────────────────────────────────────
  { id: "cursor_off_before_eve_1", t: 34.8, type: "cursor_blink", on: false },
  {
    id: "eve_1a",
    t: 35.0,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["Hello.", "You're awake."],
    cps: 22,
    holdAfterMs: 1500,
  },
  {
    id: "eve_1b",
    t: 39.2,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["My name is Eve."],
    cps: 22,
    holdAfterMs: 700,
  },
  {
    id: "eve_1c",
    t: 42.2,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["I'm here to help you", "through your enrollment."],
    cps: 28,
    holdAfterMs: 900,
  },
  {
    id: "eve_1d",
    t: 46.2,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["Please take a moment", "to orient yourself."],
    cps: 28,
    holdAfterMs: 900,
  },
  {
    id: "eve_1e",
    t: 50.2,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["There is no hurry."],
    cps: 22,
    holdAfterMs: 2400,
  },

  // ── Eve's second line ────────────────────────────────────────────────
  {
    id: "eve_2a",
    t: 57.5,
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
  { id: "glitch_disorientation", t: 59.8, type: "glitch", intensity: "hard" },
  {
    id: "eve_2b",
    t: 63.2,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["This is common.", "It will pass."],
    cps: 22,
    holdAfterMs: 1200,
  },
  { id: "symbol_after_pass", t: 66.4, type: "symbol", kind: "robot" },
  {
    id: "eve_2c",
    t: 68.5,
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
    t: 75.5,
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
    t: 83.5,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["If at any point you need a moment,", "you may take one."],
    cps: 30,
    holdAfterMs: 1000,
  },
  {
    id: "eve_2f",
    t: 88.8,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["The study proceeds at your pace."],
    cps: 28,
    holdAfterMs: 1800,
  },
  // Another trapped voice right after "proceeds at your pace" — hard cut
  // against Eve's calm, the way the earlier glitch at "disorientation"
  // works. Timed in the beat between her lines.
  { id: "trapped_during_eve", t: 91.4, type: "trapped_avatar" },
  {
    id: "eve_2g",
    t: 93.8,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["Before we begin,", "I'll need to confirm a few details."],
    cps: 30,
    holdAfterMs: 900,
  },
  {
    id: "eve_2h",
    t: 98.8,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["There are no wrong answers."],
    cps: 24,
    holdAfterMs: 1100,
  },
  { id: "glitch_no_wrong", t: 100.4, type: "glitch", intensity: "normal" },
  {
    id: "eve_2i",
    t: 102.8,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["This is just to help me understand", "how best to support you today."],
    cps: 32,
    holdAfterMs: 1600,
  },
  {
    id: "eve_2j",
    t: 109.0,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["Are you ready to continue?"],
    cps: 22,
    holdAfterMs: 0,
  },
  { id: "cursor_on_after_eve", t: 113.0, type: "cursor_blink", on: true },
]
