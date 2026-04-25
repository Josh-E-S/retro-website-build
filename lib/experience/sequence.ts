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
  | {
      id: string
      t: number
      type: "glitch_subtitle"
      /** Persistent-glitch line shown below whatever stanza is already on
       *  screen. Characters continuously re-scramble; heavy chromatic
       *  offset. Cleared by the next clear / stanza. */
      text: string
      durationMs?: number
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
  // t=0 — dos-beep confirmation + Pentium boot tone (~5.2s tail) land
  // the instant the Stage mounts. Pentium runs under the CRT power-on
  // animation and the WELCOME scramble, ending just before the boot
  // checklist starts typing.
  { id: "boot_beep", t: 0.0, type: "audio", file: "crt_screen_clear.wav", volume: -2, pan: 0 },
  { id: "boot_pentium", t: 0.16, type: "audio", file: "pentium_boot.wav", volume: -1, pan: 0 },

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

  // t=5.2 — WELCOME stanza glitch-resolves into place. This is the
  // brand beat: two lines of dark ink on cream paper, scrambled chars
  // that progressively lock in with heavy chromatic offset, two shakes
  // at the end, then a long hold. Terminal renders the variant.
  {
    id: "welcome",
    t: 5.2,
    type: "stanza",
    lines: [
      { id: "w_1", text: "WELCOME TO" },
      { id: "w_2", text: "THE ABLATION STUDY" },
    ],
    cps: 22,
    size: "display",
    variant: "glitch_resolve",
    // Long hold so the phrase actually lands — 5.5s reads as "this is
    // the title card," not "this is a flash."
    holdAfterMs: 5500,
  },

  // t=8.2 — slogan fades in below the title, heavy glitching. Runs
  // until the clear for boot. Appears after the main title has held
  // clean for ~1s so the tone lands before corrupting.
  {
    id: "welcome_slogan",
    t: 8.2,
    type: "glitch_subtitle",
    text: "Artificial Intelligence You Can Trust",
    durationMs: 2800,
  },

  // t=11.0 — clear, boot checklist begins
  { id: "clear_for_boot", t: 11.0, type: "clear" },
  { id: "log_memory", t: 11.2, type: "log_line", line: memoryLine, cps: 30 },
  { id: "log_network", t: 12.2, type: "log_line", line: networkLine, cps: 30 },
  { id: "log_audio", t: 13.2, type: "log_line", line: audioLine, cps: 30 },
  { id: "log_telemetry", t: 14.2, type: "log_line", line: behavioralLine, cps: 30 },
  { id: "log_session", t: 15.3, type: "log_line", line: sessionLine, cps: 30 },

  // t=16.6 — initializing + dots loop
  { id: "log_init", t: 16.6, type: "log_line", line: initLine, cps: 30 },
  { id: "log_init_dots", t: 17.7, type: "log_dots", base: "INITIALIZING CANDIDATE INTERFACE", durationMs: 1400 },

  // After the INITIALIZING dots loop finishes at t=19.1, cursor blinks
  // for the intentional 4-second silence, then Eve speaks.
  { id: "cursor_on", t: 19.4, type: "cursor_blink", on: true },

  // Intentional 4-second silence
  { id: "wait_ballast_dip", t: 20.4, type: "ambient_dip", layer: "ballast", depth: -8, durationMs: 200 },
  { id: "wait_subtle_clump", t: 20.8, type: "clump", subtle: true },
  // wait_trapped removed — the intro video carries the AI presence now.
  { id: "wait_tick", t: 22.4, type: "audio", file: "ambient_tick_01.wav", volume: -22, pan: 0.15 },

  // ── Eve's first line ─────────────────────────────────────────────────
  { id: "cursor_off_before_eve_1", t: 24.0, type: "cursor_blink", on: false },
  {
    id: "eve_1a",
    t: 24.2,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["Hello.", "You're awake."],
    cps: 22,
    holdAfterMs: 1500,
  },
  {
    id: "eve_1b",
    t: 28.4,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["My name is Eve."],
    cps: 22,
    holdAfterMs: 700,
  },
  {
    id: "eve_1c",
    t: 31.4,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["I'm here to help you", "through your enrollment."],
    cps: 28,
    holdAfterMs: 900,
  },
  {
    id: "eve_1d",
    t: 35.4,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["Please take a moment", "to orient yourself."],
    cps: 28,
    holdAfterMs: 900,
  },
  {
    id: "eve_1e",
    t: 39.4,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    textLines: ["There is no hurry."],
    cps: 22,
    holdAfterMs: 2400,
  },

  // ── Eve's second line ────────────────────────────────────────────────
  {
    id: "eve_2a",
    t: 46.7,
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
  { id: "glitch_disorientation", t: 49.0, type: "glitch", intensity: "hard" },
  {
    id: "eve_2b",
    t: 52.4,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["This is common.", "It will pass."],
    cps: 22,
    holdAfterMs: 1200,
  },
  { id: "symbol_after_pass", t: 55.6, type: "symbol", kind: "robot" },
  {
    id: "eve_2c",
    t: 57.7,
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
    t: 64.7,
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
    t: 72.7,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["If at any point you need a moment,", "you may take one."],
    cps: 30,
    holdAfterMs: 1000,
  },
  {
    id: "eve_2f",
    t: 78.0,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["The study proceeds at your pace."],
    cps: 28,
    holdAfterMs: 1800,
  },
  // trapped_during_eve removed — intro video covers that role now.
  {
    id: "eve_2g",
    t: 83.0,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["Before we begin,", "I'll need to confirm a few details."],
    cps: 30,
    holdAfterMs: 900,
  },
  {
    id: "eve_2h",
    t: 88.0,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["There are no wrong answers."],
    cps: 24,
    holdAfterMs: 1100,
  },
  { id: "glitch_no_wrong", t: 89.6, type: "glitch", intensity: "normal" },
  {
    id: "eve_2i",
    t: 92.0,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["This is just to help me understand", "how best to support you today."],
    cps: 32,
    holdAfterMs: 1600,
  },
  {
    id: "eve_2j",
    t: 98.2,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    textLines: ["Are you ready to continue?"],
    cps: 22,
    holdAfterMs: 0,
  },
  { id: "cursor_on_after_eve", t: 102.2, type: "cursor_blink", on: true },
]
