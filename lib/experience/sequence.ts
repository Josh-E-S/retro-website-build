/*
 * Sequence — the single tuning surface for the opening cue timeline.
 *
 * Timing reference point is t=0, the moment the wakeup unlocks. Phase 2
 * wires the visual cues; audio cues (fuses, ambient, eve) are declared
 * here so the dispatcher has a stable contract, but the sink for them
 * is stubbed until Phase 3.
 *
 * Convention: every cue has a stable `id` so logs and tuning sessions
 * can reference specific beats without counting array indices.
 */

export type TypewriterLine = {
  id: string
  text: string
  centered?: boolean
  /** Per-character extra delay in ms, keyed by 0-based index. */
  charDelays?: Record<number, number>
}

export type Cue =
  | { id: string; t: number; type: "audio"; file: string; volume: number; pan: number }
  | { id: string; t: number; type: "ambient_start"; layer: AmbientLayer; target: number; fadeMs: number }
  | { id: string; t: number; type: "ambient_dip"; layer: AmbientLayer; depth: number; durationMs: number }
  | { id: string; t: number; type: "crt_power_on" }
  | {
      id: string
      t: number
      type: "typewriter"
      lines: TypewriterLine[]
      cps: number
      holdAfterMs?: number
    }
  | { id: string; t: number; type: "processing_dots"; base: string; durationMs: number }
  | { id: string; t: number; type: "screen_clear" }
  | { id: string; t: number; type: "welcome_block"; lines: TypewriterLine[]; cps: number }
  | { id: string; t: number; type: "cursor_blink"; on: boolean }
  | { id: string; t: number; type: "eve_line"; audio: string; caption: string }

export type AmbientLayer = "ballast" | "hvac" | "crt_whine" | "fan"

/*
 * Spec timeline — §3.3. All times are seconds from t=0 (post-unlock).
 *
 * Notes on the irregularities (§3.3):
 *   - BEHAVIORAL TELEMETRY .. ONLINE: "ONLINE" starts 150ms late.
 *     Implemented as a +150ms charDelay on the character just before "O".
 *   - SESSION COUNTER .. 848: each digit 200ms apart. The line is drawn
 *     fast until just before the digits, then each of "848" gets +200ms.
 */

const boot1: TypewriterLine = { id: "boot_header_1", text: "CHOICE INDUSTRIES" }
const boot2: TypewriterLine = { id: "boot_header_2", text: "SYSTEM BOOT 7.11.4" }

const memoryLine: TypewriterLine = { id: "boot_memory", text: "MEMORY CHECK .......... OK" }
const networkLine: TypewriterLine = { id: "boot_network", text: "NETWORK ............... OK" }
const audioLine: TypewriterLine = { id: "boot_audio", text: "AUDIO SUBSYSTEM ....... OK" }

// "BEHAVIORAL TELEMETRY .. ONLINE" — add 150ms hitch right before "ONLINE".
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

const welcomeLines: TypewriterLine[] = [
  { id: "w_blank_1", text: " " },
  { id: "w_title", text: "WELCOME TO THE ABLATION STUDY", centered: true },
  { id: "w_blank_2", text: " " },
  { id: "w_sub1", text: "A research initiative of", centered: true },
  { id: "w_sub2", text: "CHOICE INDUSTRIES", centered: true },
  { id: "w_blank_3", text: " " },
  { id: "w_rule", text: "─── ∙ ─── ∙ ───", centered: true },
  { id: "w_blank_4", text: " " },
  { id: "w_notice_1", text: "YOUR CANDIDATE SESSION WILL BEGIN", centered: true },
  { id: "w_notice_2", text: "MOMENTARILY", centered: true },
  { id: "w_blank_5", text: " " },
  { id: "w_notice_3", text: "PLEASE REMAIN AT YOUR DESK", centered: true },
]

export const sequence: Cue[] = [
  // t=2.0 / 3.2 / 4.5 — three fuses (audio stubbed until Phase 3)
  { id: "fuse_1", t: 2.0, type: "audio", file: "fuse_01.wav", volume: -12, pan: -0.2 },
  { id: "fuse_2", t: 3.2, type: "audio", file: "fuse_02.wav", volume: -14, pan: 0.15 },
  { id: "fuse_3", t: 4.5, type: "audio", file: "fuse_03.wav", volume: -18, pan: 0 },

  // t=5.0 — ambient bed fades in (reaches target at 6.5)
  { id: "amb_ballast", t: 5.0, type: "ambient_start", layer: "ballast", target: -24, fadeMs: 1500 },
  { id: "amb_hvac", t: 5.0, type: "ambient_start", layer: "hvac", target: -30, fadeMs: 1500 },
  { id: "amb_whine", t: 5.0, type: "ambient_start", layer: "crt_whine", target: -36, fadeMs: 1500 },

  // t=6.5 — CRT power-on (sound + visual)
  { id: "crt_power_audio", t: 6.5, type: "audio", file: "crt_power_on.wav", volume: -8, pan: 0 },
  { id: "crt_power_visual", t: 6.5, type: "crt_power_on" },
  { id: "amb_fan", t: 6.5, type: "ambient_start", layer: "fan", target: -28, fadeMs: 1500 },

  // t=8.5 — boot header
  {
    id: "boot_header",
    t: 8.5,
    type: "typewriter",
    lines: [boot1, boot2],
    cps: 30,
    holdAfterMs: 400,
  },

  // t=9.5 — boot checklist (runs through ~11.5)
  {
    id: "boot_checklist",
    t: 9.5,
    type: "typewriter",
    lines: [memoryLine, networkLine, audioLine, behavioralLine, sessionLine],
    cps: 30,
  },

  // t=11.0 — INITIALIZING + animated dots (~1.2s)
  {
    id: "boot_init",
    t: 11.0,
    type: "typewriter",
    lines: [{ id: "boot_blank", text: " " }, { id: "boot_init_line", text: "INITIALIZING CANDIDATE INTERFACE" }],
    cps: 30,
  },
  {
    id: "boot_dots",
    t: 12.3,
    type: "processing_dots",
    base: "INITIALIZING CANDIDATE INTERFACE",
    durationMs: 1200,
  },

  // t=13.6 — screen clear (small tick + 10px vertical roll)
  { id: "clear_tick", t: 13.6, type: "audio", file: "crt_screen_clear.wav", volume: -14, pan: 0 },
  { id: "clear_1", t: 13.6, type: "screen_clear" },

  // t=13.9 — welcome screen
  {
    id: "welcome",
    t: 13.9,
    type: "welcome_block",
    lines: welcomeLines,
    cps: 30,
  },

  // t=16.5 — cursor blink (approx; tuned after welcome completes)
  { id: "cursor_on", t: 16.5, type: "cursor_blink", on: true },

  // t=16.5 → 20.5 — the intentional 4-second silence (rendered as a noop;
  // the experience is already in steady state with just cursor + ambient).
  // Cues exist here for the audio layer to do the subliminal ballast dip
  // and relay tick during the wait. Leaving them declared so the timeline
  // is complete even before the audio engine lands.
  {
    id: "wait_ballast_dip",
    t: 17.5,
    type: "ambient_dip",
    layer: "ballast",
    depth: -8,
    durationMs: 200,
  },
  { id: "wait_tick", t: 19.5, type: "audio", file: "ambient_tick_01.wav", volume: -22, pan: 0.15 },

  // t=20.5 — Eve line 1 (stubbed as caption until Phase 3 audio engine)
  {
    id: "eve_1",
    t: 20.5,
    type: "eve_line",
    audio: "eve_line_01.mp3",
    caption:
      "Hello. You're awake.  My name is Eve. I'm here to help you through your enrollment. Please take a moment to orient yourself. There is no hurry.",
  },

  // t=34.5 — Eve line 2
  {
    id: "eve_2",
    t: 34.5,
    type: "eve_line",
    audio: "eve_line_02.mp3",
    caption:
      "Some candidates experience disorientation during the initial enrollment period. This is common. It will pass.  The Ablation Study is a voluntary research initiative conducted by Choice Industries. You were selected based on your application, and you are here because you consented to be here. If at any point you need a moment, you may take one. The study proceeds at your pace.  Before we begin, I'll need to confirm a few details. There are no wrong answers. This is just to help me understand how best to support you today.  Are you ready to continue?",
  },
]
