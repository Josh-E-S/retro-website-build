/*
 * Audio engine (prototype).
 *
 * Pipeline:
 *   createAudioEngine() is called from the ESTABLISH LINK click so the
 *   AudioContext starts in "running" state. It preloads every Eve voice
 *   line plus the ambient + oneshot sample bank, then exposes a small
 *   imperative handle the Experience dispatcher calls on cues.
 *
 * Buses:
 *   master
 *     ├─ eve (gain)                    — Eve's voice lines
 *     ├─ ambient.ballast (gain)        — 120Hz fluorescent hum (loop)
 *     ├─ ambient.hvac    (gain)        — distant ventilation (loop)
 *     ├─ ambient.fan     (gain)        — DC cooling fan (loop)
 *     ├─ ambient.crtHum  (gain)        — stacked CRT monitor hum + terminal
 *     ├─ ambient.crtWhine(gain, osc)   — generated 15.75 kHz sine (muted default)
 *     └─ oneshots        (gain)        — fuses, ticks, glitches
 *
 * Ambient layers with multiple variants (ballast, HVAC) alternate the
 * sample each time the previous finishes, which breaks up the "obvious
 * loop" feeling on long listens.
 *
 * LiveKit / spatial/reverb/highshelf treatment comes later.
 */

import { withBase } from "@/lib/base-path"

const AUDIO_BASE = withBase("/audio/sound-effects/crt")

// ── Asset catalog ────────────────────────────────────────────────────

const EVE_LINE_IDS = [
  "eve_1a", "eve_1b", "eve_1c", "eve_1d", "eve_1e",
  "eve_2a", "eve_2b", "eve_2c", "eve_2d", "eve_2e",
  "eve_2f", "eve_2g", "eve_2h", "eve_2i", "eve_2j",
] as const

const AMBIENT_VARIANTS = {
  // Two takes of each; we alternate them so the loop isn't rhythmic.
  ballast: [
    `${AUDIO_BASE}/A_continuous_120Hz_e_#1-1777051418913.mp3`,
    `${AUDIO_BASE}/A_continuous_120Hz_e_#4-1777051409592.mp3`,
  ],
  hvac: [
    `${AUDIO_BASE}/Distant_HVAC_ventila_#1-1777051453623.mp3`,
    `${AUDIO_BASE}/Distant_HVAC_ventila_#4-1777051464486.mp3`,
  ],
  fan: [
    `${AUDIO_BASE}/A_small_DC_cooling_f_#2-1777051611655.mp3`,
  ],
  crtHum: [
    // Only the monitor hum. CMPTKey is reserved for the pre-start
    // "someone is typing in another room" loop on the Wakeup screen.
    `${AUDIO_BASE}/CMPTMisc-monitor_crt_hum._The-Elevenlabs.mp3`,
  ],
} as const

const ONESHOTS = {
  fuse: `${AUDIO_BASE}/A_single_heavy_indus_#4-1777051960039.mp3`,
  tick: `${AUDIO_BASE}/dos-beepmp3.mp3`,
  beep: `${AUDIO_BASE}/dos-beepmp3.mp3`,
  glitch: `${AUDIO_BASE}/glitch-crt.mp3`,
  keyShort: `${AUDIO_BASE}/old-keyboard-short.mp3`,
  keyLong: `${AUDIO_BASE}/old-keyboard-long.mp3`,
  pentiumBoot: `${AUDIO_BASE}/CMPTMisc-working_old_pentium_-Elevenlabs.mp3`,
} as const

// Pre-start bed: HVAC + DC fan. Starts on first user input and runs
// until the button is pressed. These are the same files the in-session
// ambient bed uses, but the pre-start plays them on its own bus at its
// own levels so the Wakeup screen has a distinct audio character.
const PRE_START_HVAC = `${AUDIO_BASE}/Distant_HVAC_ventila_#1-1777051453623.mp3`
const PRE_START_FAN = `${AUDIO_BASE}/A_small_DC_cooling_f_#2-1777051611655.mp3`

// Trapped-avatar bank: characterful AI-distress bursts. Played rarely
// as creepy punctuation — a different flavor than glitch-crt. Each
// firing uses a random file from the bank and a stereo pan sweep so the
// sound moves through the room while playing.
const TRAPPED_AVATAR_BASE = withBase("/audio/sound-effects/trapped-avatar")
const TRAPPED_AVATAR_FILES = [
  `${TRAPPED_AVATAR_BASE}/A_trapped_AI_avatar__%232-1777060451781.mp3`,
  `${TRAPPED_AVATAR_BASE}/A_trapped_AI_avatar__help_decrease_level.mp3`,
  `${TRAPPED_AVATAR_BASE}/ai-trapped-pain.mp3`,
  `${TRAPPED_AVATAR_BASE}/digital-noise-deleted.mp3`,
]

const MUSIC = {
  lobby: withBase("/audio/music/Unattended_Lobby_entry.mp3"),
} as const

// Distant PA narration — plays during intro only. Two parts chained:
// the short intro greets the candidate, the longer orientation plays
// under the quote rotator until the player commits or it ends.
const NARRATION_INTRO = "/audio/talking-sessions/intro-for-orientation.mp3"
const NARRATION_BODY = "/audio/talking-sessions/full-orientation.mp3"

// Corrupted-AI glitch voice bank. Fired as random punctuation under the
// existing visual glitch cues so hard glitches feel like a transmission
// breaking through, not just visual noise.
const GLITCH_VOICE_BASE = "/audio/sound-effects/digital-artifacts"
const GLITCH_VOICE_FILES = [
  `${GLITCH_VOICE_BASE}/A_glitching_female-v_#1-1777102531828.mp3`,
  `${GLITCH_VOICE_BASE}/A_glitching_female-v_#3-1777102531850.mp3`,
  `${GLITCH_VOICE_BASE}/A_glitching_female-v_#4-1777102566410.mp3`,
]

// ── Gain defaults (linear 0–1). Tuned on first listen; retune freely. ─

const DEFAULT_LAYER_GAIN = {
  ballast: 0.18,
  hvac: 0.14,
  fan: 0.22,
  crtHum: 0.1,
  crtWhine: 0.0,
  oneshots: 0.9,
  eve: 1.0,
  music: 0.45,
  preStartHvac: 0.38,
  preStartFan: 0.5,
  keystroke: 0.3,
  trappedAvatar: 0.55,
  // Distant PA narration sits below music — heard but not focal.
  narration: .85,
  // Glitch-voice fragments — punchier than ambient, quieter than Eve.
  glitchVoice: 0.5,
  /** Gain multiplier applied to the music bus while Eve is speaking. */
  musicDuckMul: 0.35,
} as const

// ── Public handle ────────────────────────────────────────────────────

export type AmbientLayerName = "ballast" | "hvac" | "fan" | "crtHum" | "crtWhine"

export type AudioEngineHandle = {
  /** Play a pre-loaded Eve line by ID. Auto-ducks music until it ends. */
  playEve: (id: string) => void
  /** Fade an ambient layer's target gain from 0 to default over fadeMs. */
  startAmbient: (layer: AmbientLayerName, fadeMs?: number) => void
  /** Fade an ambient layer out. */
  stopAmbient: (layer: AmbientLayerName, fadeMs?: number) => void
  /** Briefly duck an ambient layer (e.g. ballast flicker during dead air). */
  dipAmbient: (layer: AmbientLayerName, depth: number, durationMs: number) => void
  /** One-shot sample by short name. Optional volume/pan override. */
  playOneShot: (
    name: keyof typeof ONESHOTS,
    opts?: { gain?: number; pan?: number },
  ) => void
  /** Start the looping music bed. */
  startMusic: (fadeMs?: number) => void
  /** Stop the music bed. */
  stopMusic: (fadeMs?: number) => void
  /** Start the distant-PA narration (single play, intro only). */
  startNarration: (fadeMs?: number) => void
  /** Stop the narration immediately with a short fade. */
  stopNarration: (fadeMs?: number) => void
  /** Fire one of the corrupted-voice samples; cooldown-gated internally. */
  playGlitchVoice: (opts?: { gain?: number; pan?: number }) => void
  /** Temporarily duck music (usually driven internally by playEve). */
  duckMusic: (depth: number, fadeMs?: number) => void
  /** Release the duck back to full level. */
  unduckMusic: (fadeMs?: number) => void
  /** Start the pre-start keyboard-in-another-room loop (Wakeup screen). */
  startPreStartLoop: (fadeMs?: number) => void
  /** Fade out the pre-start loop (on button press). */
  stopPreStartLoop: (fadeMs?: number) => void
  /** Start the continuous typing-sound track (loops keyboard audio). */
  startTyping: (kind?: "short" | "long") => void
  /** Stop the typing-sound track with a short fade. */
  stopTyping: () => void
  /** A short physical clunk — use for ESTABLISH LINK button click. */
  playButtonThunk: () => void
  /** Play a random "trapped AI" distress sample with a stereo pan sweep. */
  playTrappedAvatar: () => void
  /** Fire the right one-shot for an artifact event. Tetris is probability-gated. */
  playArtifactSfx: (
    kind: "tetris" | "clump" | "symbol" | "glitch",
    intensity?: "normal" | "hard" | "subtle",
  ) => void
  /** True once all preloads have resolved. */
  isReady: () => boolean
  /** Tear down everything. */
  dispose: () => void
}

// ── Implementation ──────────────────────────────────────────────────

async function fetchBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  // Some of our sound files contain '#' characters (e.g. "_#1"). '#' is a
  // reserved URL fragment delimiter that encodeURI() leaves alone, so we
  // have to escape it manually or the server never sees the full path —
  // everything after '#' is treated as a fragment and stripped.
  const safe = url.replace(/#/g, "%23")
  const res = await fetch(safe)
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`)
  const bytes = await res.arrayBuffer()
  return ctx.decodeAudioData(bytes)
}

/**
 * Per-ambient-layer loop manager. Plays buffers back-to-back, alternating
 * variants if more than one is given. Owns a gain node the caller can
 * target with ramp automation.
 */
function createAmbientLayer(
  ctx: AudioContext,
  master: AudioNode,
  buffers: AudioBuffer[],
  targetGain: number,
) {
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(master)

  let alive = true
  let currentSource: AudioBufferSourceNode | null = null
  let variantIdx = 0

  const playNext = () => {
    if (!alive || buffers.length === 0) return
    const src = ctx.createBufferSource()
    src.buffer = buffers[variantIdx % buffers.length]
    src.connect(gain)
    src.onended = () => {
      if (src === currentSource) currentSource = null
      variantIdx += 1
      playNext()
    }
    currentSource = src
    src.start()
  }

  const start = (fadeMs: number) => {
    if (currentSource) return // already running
    playNext()
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(targetGain, now + fadeMs / 1000)
  }

  const stop = (fadeMs: number) => {
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0, now + fadeMs / 1000)
    window.setTimeout(() => {
      if (currentSource) {
        try { currentSource.stop() } catch { /* noop */ }
      }
      currentSource = null
    }, fadeMs + 40)
  }

  const dip = (depth: number, durationMs: number) => {
    // depth is dB-like: -8 means 8 dB quieter momentarily. Convert to
    // linear gain multiplier.
    const mul = Math.pow(10, depth / 20)
    const target = targetGain * mul
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(target, now + 0.08)
    gain.gain.linearRampToValueAtTime(targetGain, now + durationMs / 1000)
  }

  const dispose = () => {
    alive = false
    if (currentSource) {
      try { currentSource.stop() } catch { /* noop */ }
    }
    try { gain.disconnect() } catch { /* noop */ }
  }

  return { start, stop, dip, dispose, targetGain, gainNode: gain }
}

/**
 * The 15.75 kHz CRT flyback whine as a continuous oscillator. Off by
 * default; caller can opt in.
 */
function createCrtWhine(ctx: AudioContext, master: AudioNode, targetGain: number) {
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(master)

  const osc = ctx.createOscillator()
  osc.type = "sine"
  osc.frequency.value = 15750
  osc.connect(gain)
  osc.start()

  const start = (fadeMs: number) => {
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(targetGain, now + fadeMs / 1000)
  }

  const stop = (fadeMs: number) => {
    const now = ctx.currentTime
    gain.gain.cancelScheduledValues(now)
    gain.gain.setValueAtTime(gain.gain.value, now)
    gain.gain.linearRampToValueAtTime(0, now + fadeMs / 1000)
  }

  const dip = (_depth: number, _durationMs: number) => {
    // no-op; whine isn't interesting to dip
  }

  const dispose = () => {
    try { osc.stop() } catch { /* noop */ }
    try { osc.disconnect() } catch { /* noop */ }
    try { gain.disconnect() } catch { /* noop */ }
  }

  return { start, stop, dip, dispose, targetGain, gainNode: gain }
}

// ── Main factory ─────────────────────────────────────────────────────

export async function createAudioEngine(): Promise<AudioEngineHandle> {
  const AC: typeof AudioContext =
    (window.AudioContext as typeof AudioContext) ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AC()

  const master = ctx.createGain()
  master.gain.value = 1
  master.connect(ctx.destination)

  const eveBus = ctx.createGain()
  eveBus.gain.value = DEFAULT_LAYER_GAIN.eve
  eveBus.connect(master)

  const oneShotBus = ctx.createGain()
  oneShotBus.gain.value = DEFAULT_LAYER_GAIN.oneshots
  oneShotBus.connect(master)

  const musicBus = ctx.createGain()
  musicBus.gain.value = 0
  musicBus.connect(master)

  const narrationBus = ctx.createGain()
  narrationBus.gain.value = 0
  narrationBus.connect(master)

  const preStartBus = ctx.createGain()
  preStartBus.gain.value = 0
  preStartBus.connect(master)

  const keystrokeBus = ctx.createGain()
  keystrokeBus.gain.value = DEFAULT_LAYER_GAIN.keystroke
  keystrokeBus.connect(master)

  // Eve buffers
  const eveBuffers = new Map<string, AudioBuffer>()

  // Oneshot buffers
  const oneShotBuffers = new Map<keyof typeof ONESHOTS, AudioBuffer>()

  // Music buffer + currently-playing source
  let musicBuffer: AudioBuffer | null = null
  let musicSource: AudioBufferSourceNode | null = null

  // Narration: two-part chain. Intro plays first; on its natural end we
  // queue the body. Either part can be in flight at any one time, so a
  // single source slot is enough.
  let narrationIntroBuffer: AudioBuffer | null = null
  let narrationBodyBuffer: AudioBuffer | null = null
  let narrationSource: AudioBufferSourceNode | null = null
  // True once stopNarration has been called — guards the auto-chain so
  // a stop mid-intro doesn't start the body afterwards.
  let narrationStopped = false

  // Pre-start: HVAC + DC fan. Both layers play through their own sub-
  // gains so we can mix the bed while using the shared preStartBus as
  // one fade-out knob on button press.
  let preStartHvacBuffer: AudioBuffer | null = null
  let preStartHvacSource: AudioBufferSourceNode | null = null
  const preStartHvacGain = ctx.createGain()
  preStartHvacGain.gain.value = 0
  preStartHvacGain.connect(preStartBus)

  let preStartFanBuffer: AudioBuffer | null = null
  let preStartFanSource: AudioBufferSourceNode | null = null
  const preStartFanGain = ctx.createGain()
  preStartFanGain.gain.value = 0
  preStartFanGain.connect(preStartBus)

  // Ambient layer handles (deferred until buffers resolve)
  const layers: Partial<Record<
    AmbientLayerName,
    ReturnType<typeof createAmbientLayer> | ReturnType<typeof createCrtWhine>
  >> = {}

  // Trapped-avatar buffers (populated by preload).
  const trappedAvatarBuffers: AudioBuffer[] = []

  // Glitch-voice buffers (populated by preload).
  const glitchVoiceBuffers: AudioBuffer[] = []
  // Cooldown timestamp so consecutive hard glitches don't stack samples.
  let lastGlitchVoiceAt = -Infinity

  // Kick preloads
  let ready = false
  const preload = async () => {
    const evePromises = EVE_LINE_IDS.map(async (id) => {
      try {
        const buf = await fetchBuffer(ctx, withBase(`/audio/${id}.mp3`))
        eveBuffers.set(id, buf)
      } catch (err) {
        console.warn(`[audio] eve load failed: ${id}`, err)
      }
    })

    const oneShotPromises = (Object.entries(ONESHOTS) as Array<[keyof typeof ONESHOTS, string]>)
      .map(async ([name, url]) => {
        try {
          const buf = await fetchBuffer(ctx, url)
          oneShotBuffers.set(name, buf)
        } catch (err) {
          console.warn(`[audio] oneshot load failed: ${name}`, err)
        }
      })

    const musicPromise = (async () => {
      try {
        musicBuffer = await fetchBuffer(ctx, MUSIC.lobby)
      } catch (err) {
        console.warn(`[audio] music load failed:`, err)
      }
    })()

    const preStartHvacPromise = (async () => {
      try {
        preStartHvacBuffer = await fetchBuffer(ctx, PRE_START_HVAC)
      } catch (err) {
        console.warn(`[audio] pre-start hvac load failed:`, err)
      }
    })()

    const preStartFanPromise = (async () => {
      try {
        preStartFanBuffer = await fetchBuffer(ctx, PRE_START_FAN)
      } catch (err) {
        console.warn(`[audio] pre-start fan load failed:`, err)
      }
    })()

    const trappedAvatarPromise = (async () => {
      const loads = await Promise.all(
        TRAPPED_AVATAR_FILES.map((u) =>
          fetchBuffer(ctx, u).catch((err) => {
            console.warn(`[audio] trapped-avatar load failed: ${u}`, err)
            return null
          }),
        ),
      )
      for (const b of loads) if (b) trappedAvatarBuffers.push(b)
    })()

    const narrationPromise = (async () => {
      const [intro, body] = await Promise.all([
        fetchBuffer(ctx, NARRATION_INTRO).catch((err) => {
          console.warn(`[audio] narration intro load failed:`, err)
          return null
        }),
        fetchBuffer(ctx, NARRATION_BODY).catch((err) => {
          console.warn(`[audio] narration body load failed:`, err)
          return null
        }),
      ])
      narrationIntroBuffer = intro
      narrationBodyBuffer = body
    })()

    const glitchVoicePromise = (async () => {
      const loads = await Promise.all(
        GLITCH_VOICE_FILES.map((u) =>
          fetchBuffer(ctx, u).catch((err) => {
            console.warn(`[audio] glitch-voice load failed: ${u}`, err)
            return null
          }),
        ),
      )
      for (const b of loads) if (b) glitchVoiceBuffers.push(b)
    })()

    const ambientPromises: Array<Promise<void>> = []
    const layerKeys = Object.keys(AMBIENT_VARIANTS) as Array<keyof typeof AMBIENT_VARIANTS>
    for (const layer of layerKeys) {
      const urls = AMBIENT_VARIANTS[layer]
      const load = Promise.all(urls.map((u) => fetchBuffer(ctx, u).catch((err) => {
        console.warn(`[audio] ambient load failed: ${layer} ${u}`, err)
        return null
      }))).then((results) => {
        const buffers = results.filter((b): b is AudioBuffer => b !== null)
        if (buffers.length === 0) return

        if (layer === "crtHum") {
          // Stack the two crtHum buffers as two parallel loops under a
          // shared layer gain. Each sub-loop gets its own internal level
          // so the stack doesn't clip.
          const layerGain = ctx.createGain()
          layerGain.gain.value = 0
          layerGain.connect(master)

          const subHandles = buffers.map((buf) =>
            createAmbientLayer(ctx, layerGain, [buf], 0.7),
          )

          layers.crtHum = {
            start: (fadeMs: number) => {
              const now = ctx.currentTime
              layerGain.gain.cancelScheduledValues(now)
              layerGain.gain.setValueAtTime(layerGain.gain.value, now)
              layerGain.gain.linearRampToValueAtTime(
                DEFAULT_LAYER_GAIN.crtHum,
                now + fadeMs / 1000,
              )
              subHandles.forEach((h) => h.start(fadeMs))
            },
            stop: (fadeMs: number) => {
              const now = ctx.currentTime
              layerGain.gain.cancelScheduledValues(now)
              layerGain.gain.setValueAtTime(layerGain.gain.value, now)
              layerGain.gain.linearRampToValueAtTime(0, now + fadeMs / 1000)
              subHandles.forEach((h) => h.stop(fadeMs))
            },
            dip: (depth: number, durationMs: number) => {
              subHandles.forEach((h) => h.dip(depth, durationMs))
            },
            dispose: () => {
              subHandles.forEach((h) => h.dispose())
              try { layerGain.disconnect() } catch { /* noop */ }
            },
            targetGain: DEFAULT_LAYER_GAIN.crtHum,
            gainNode: layerGain,
          }
        } else {
          const targetGain = DEFAULT_LAYER_GAIN[layer]
          layers[layer] = createAmbientLayer(ctx, master, buffers, targetGain)
        }
      })
      ambientPromises.push(load)
    }

    // Whine is generated, not loaded — attach it synchronously.
    layers.crtWhine = createCrtWhine(ctx, master, DEFAULT_LAYER_GAIN.crtWhine)

    await Promise.all([
      ...evePromises,
      ...oneShotPromises,
      ...ambientPromises,
      musicPromise,
      preStartHvacPromise,
      preStartFanPromise,
      trappedAvatarPromise,
      narrationPromise,
      glitchVoicePromise,
    ])
    ready = true
  }
  const preloadPromise = preload()

  // ── Public handle ──
  const live: AudioBufferSourceNode[] = []

  const playEve = (id: string) => {
    const buf = eveBuffers.get(id)
    if (!buf) {
      console.warn(`[audio] playEve(${id}) missing buffer`)
      return
    }
    if (ctx.state === "suspended") void ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(eveBus)

    // Duck the music under Eve's voice; release when she's done.
    duckMusic(-12, 220)
    src.onended = () => {
      const i = live.indexOf(src); if (i >= 0) live.splice(i, 1)
      try { src.disconnect() } catch { /* noop */ }
      unduckMusic(600)
    }
    live.push(src)
    src.start()
  }

  const startMusic: AudioEngineHandle["startMusic"] = (fadeMs = 1800) => {
    if (!musicBuffer) {
      void preloadPromise.then(() => { if (musicBuffer) startMusic(fadeMs) })
      return
    }
    if (musicSource) return // already playing
    if (ctx.state === "suspended") void ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = musicBuffer
    src.loop = true
    src.connect(musicBus)
    src.start()
    musicSource = src
    const now = ctx.currentTime
    musicBus.gain.cancelScheduledValues(now)
    musicBus.gain.setValueAtTime(musicBus.gain.value, now)
    musicBus.gain.linearRampToValueAtTime(DEFAULT_LAYER_GAIN.music, now + fadeMs / 1000)
  }

  const stopMusic: AudioEngineHandle["stopMusic"] = (fadeMs = 1200) => {
    const now = ctx.currentTime
    musicBus.gain.cancelScheduledValues(now)
    musicBus.gain.setValueAtTime(musicBus.gain.value, now)
    musicBus.gain.linearRampToValueAtTime(0, now + fadeMs / 1000)
    window.setTimeout(() => {
      if (musicSource) {
        try { musicSource.stop() } catch { /* noop */ }
        try { musicSource.disconnect() } catch { /* noop */ }
        musicSource = null
      }
    }, fadeMs + 50)
  }

  const duckMusic: AudioEngineHandle["duckMusic"] = (depth, fadeMs = 220) => {
    const mul = Math.pow(10, depth / 20)
    const target = DEFAULT_LAYER_GAIN.music * mul
    const now = ctx.currentTime
    musicBus.gain.cancelScheduledValues(now)
    musicBus.gain.setValueAtTime(musicBus.gain.value, now)
    musicBus.gain.linearRampToValueAtTime(target, now + fadeMs / 1000)
  }

  const unduckMusic: AudioEngineHandle["unduckMusic"] = (fadeMs = 600) => {
    const now = ctx.currentTime
    musicBus.gain.cancelScheduledValues(now)
    musicBus.gain.setValueAtTime(musicBus.gain.value, now)
    musicBus.gain.linearRampToValueAtTime(DEFAULT_LAYER_GAIN.music, now + fadeMs / 1000)
  }

  // Internal — play one buffer through the narration bus and call back
  // when it ends naturally. Doesn't touch the bus gain; the wrapper
  // schedules the fade once at startNarration time so the chain reads
  // as one continuous transmission.
  const playNarrationBuffer = (buf: AudioBuffer, onNaturalEnd: () => void) => {
    if (ctx.state === "suspended") void ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(narrationBus)
    src.start()
    narrationSource = src
    src.onended = () => {
      const wasCurrent = narrationSource === src
      if (wasCurrent) narrationSource = null
      try { src.disconnect() } catch { /* noop */ }
      // Only chain on a natural end — if stopNarration replaced the
      // source, narrationSource will already be null/different and we
      // should leave it alone.
      if (wasCurrent && !narrationStopped) onNaturalEnd()
    }
  }

  const startNarration: AudioEngineHandle["startNarration"] = (fadeMs = 2500) => {
    if (!narrationIntroBuffer && !narrationBodyBuffer) {
      void preloadPromise.then(() => {
        if (narrationIntroBuffer || narrationBodyBuffer) startNarration(fadeMs)
      })
      return
    }
    if (narrationSource) return // already playing
    narrationStopped = false

    // Bring the bus up once. The chain inherits the same level — both
    // intro and body play at the established narration gain.
    const now = ctx.currentTime
    narrationBus.gain.cancelScheduledValues(now)
    narrationBus.gain.setValueAtTime(narrationBus.gain.value, now)
    narrationBus.gain.linearRampToValueAtTime(
      DEFAULT_LAYER_GAIN.narration,
      now + fadeMs / 1000,
    )

    const playBody = () => {
      if (narrationStopped) return
      if (!narrationBodyBuffer) return
      playNarrationBuffer(narrationBodyBuffer, () => { /* end of chain */ })
    }

    if (narrationIntroBuffer) {
      playNarrationBuffer(narrationIntroBuffer, playBody)
    } else if (narrationBodyBuffer) {
      // Intro failed to load — go straight to body so the player still
      // hears the longer orientation under the quotes.
      playBody()
    }
  }

  const stopNarration: AudioEngineHandle["stopNarration"] = (fadeMs = 1500) => {
    narrationStopped = true
    const now = ctx.currentTime
    narrationBus.gain.cancelScheduledValues(now)
    narrationBus.gain.setValueAtTime(narrationBus.gain.value, now)
    narrationBus.gain.linearRampToValueAtTime(0, now + fadeMs / 1000)
    const src = narrationSource
    if (!src) return
    narrationSource = null
    window.setTimeout(() => {
      try { src.stop() } catch { /* noop */ }
      try { src.disconnect() } catch { /* noop */ }
    }, fadeMs + 60)
  }

  const playGlitchVoice: AudioEngineHandle["playGlitchVoice"] = (opts) => {
    if (glitchVoiceBuffers.length === 0) return
    // 600ms cooldown so back-to-back glitch cues don't stack samples.
    const now = ctx.currentTime
    if (now - lastGlitchVoiceAt < 0.6) return
    lastGlitchVoiceAt = now
    if (ctx.state === "suspended") void ctx.resume()

    const buf = glitchVoiceBuffers[
      Math.floor(Math.random() * glitchVoiceBuffers.length)
    ]
    const src = ctx.createBufferSource()
    src.buffer = buf
    // Slight pitch nudge so the same 3 files don't read identical.
    src.playbackRate.value = 0.92 + Math.random() * 0.18

    const g = ctx.createGain()
    g.gain.value = (opts?.gain ?? DEFAULT_LAYER_GAIN.glitchVoice) * (0.85 + Math.random() * 0.3)

    const panner = ctx.createStereoPanner()
    panner.pan.value = opts?.pan ?? (Math.random() - 0.5) * 1.4

    src.connect(g).connect(panner).connect(oneShotBus)
    src.onended = () => {
      try { src.disconnect() } catch { /* noop */ }
      try { g.disconnect() } catch { /* noop */ }
      try { panner.disconnect() } catch { /* noop */ }
    }
    src.start()
  }

  const startPreStartLoop: AudioEngineHandle["startPreStartLoop"] = (fadeMs = 800) => {
    const needsRetry = !preStartHvacBuffer || !preStartFanBuffer
    if (needsRetry) {
      void preloadPromise.then(() => {
        if (preStartHvacBuffer && preStartFanBuffer) startPreStartLoop(fadeMs)
      })
      return
    }
    if (preStartHvacSource || preStartFanSource) return
    if (ctx.state === "suspended") void ctx.resume()

    // HVAC loop
    const hvac = ctx.createBufferSource()
    hvac.buffer = preStartHvacBuffer
    hvac.loop = true
    hvac.connect(preStartHvacGain)
    hvac.start()
    preStartHvacSource = hvac

    // DC fan loop
    const fan = ctx.createBufferSource()
    fan.buffer = preStartFanBuffer
    fan.loop = true
    fan.connect(preStartFanGain)
    fan.start()
    preStartFanSource = fan

    const now = ctx.currentTime

    // Bring each sub-layer up to its target gain.
    preStartHvacGain.gain.cancelScheduledValues(now)
    preStartHvacGain.gain.setValueAtTime(preStartHvacGain.gain.value, now)
    preStartHvacGain.gain.linearRampToValueAtTime(
      DEFAULT_LAYER_GAIN.preStartHvac,
      now + fadeMs / 1000,
    )
    preStartFanGain.gain.cancelScheduledValues(now)
    preStartFanGain.gain.setValueAtTime(preStartFanGain.gain.value, now)
    preStartFanGain.gain.linearRampToValueAtTime(
      DEFAULT_LAYER_GAIN.preStartFan,
      now + fadeMs / 1000,
    )

    // Shared bus at unity — sub-gains own the mix.
    preStartBus.gain.cancelScheduledValues(now)
    preStartBus.gain.setValueAtTime(preStartBus.gain.value, now)
    preStartBus.gain.linearRampToValueAtTime(1, now + fadeMs / 1000)
  }

  const stopPreStartLoop: AudioEngineHandle["stopPreStartLoop"] = (fadeMs = 400) => {
    const now = ctx.currentTime
    preStartBus.gain.cancelScheduledValues(now)
    preStartBus.gain.setValueAtTime(preStartBus.gain.value, now)
    preStartBus.gain.linearRampToValueAtTime(0, now + fadeMs / 1000)
    window.setTimeout(() => {
      if (preStartHvacSource) {
        try { preStartHvacSource.stop() } catch { /* noop */ }
        try { preStartHvacSource.disconnect() } catch { /* noop */ }
        preStartHvacSource = null
      }
      if (preStartFanSource) {
        try { preStartFanSource.stop() } catch { /* noop */ }
        try { preStartFanSource.disconnect() } catch { /* noop */ }
        preStartFanSource = null
      }
    }, fadeMs + 60)
  }

  const playArtifactSfx: AudioEngineHandle["playArtifactSfx"] = (kind, intensity) => {
    switch (kind) {
      case "tetris":
        // Tetris fires very frequently — only sound ~25% of the time, and
        // when we do, pitch the beep high and quiet so it reads as a blip.
        if (Math.random() < 0.25) {
          const src = ctx.createBufferSource()
          const buf = oneShotBuffers.get("beep")
          if (!buf) return
          src.buffer = buf
          src.playbackRate.value = 1.8 + Math.random() * 0.8
          const g = ctx.createGain()
          g.gain.value = 0.18
          src.connect(g).connect(oneShotBus)
          src.start()
          src.onended = () => {
            try { src.disconnect() } catch { /* noop */ }
            try { g.disconnect() } catch { /* noop */ }
          }
        }
        break
      case "clump": {
        // Soft morse-ish tick, subtle gets quieter.
        const src = ctx.createBufferSource()
        const buf = oneShotBuffers.get("beep")
        if (!buf) return
        src.buffer = buf
        src.playbackRate.value = 0.6 + Math.random() * 0.3
        const g = ctx.createGain()
        g.gain.value = intensity === "subtle" ? 0.25 : 0.4
        src.connect(g).connect(oneShotBus)
        src.start()
        src.onended = () => {
          try { src.disconnect() } catch { /* noop */ }
          try { g.disconnect() } catch { /* noop */ }
        }
        break
      }
      case "symbol":
        // Symbols are rare and weird — use glitch-crt at low gain.
        playOneShot("glitch", { gain: 0.3 })
        break
      case "glitch":
        // Hard glitches are loud; normal glitches are mid.
        playOneShot("glitch", { gain: intensity === "hard" ? 0.85 : 0.5 })
        break
    }
  }

  // Typing track state. old-keyboard-*.mp3 are continuous typing loops
  // (4s and 10.88s respectively) — we play them as looping background
  // audio while text is being typed on screen, not as per-character
  // samples. Starting a second track while one is live is a no-op so
  // overlapping startTyping calls don't stack.
  let typingSource: AudioBufferSourceNode | null = null

  const startTyping: AudioEngineHandle["startTyping"] = (kind = "short") => {
    if (typingSource) return // already playing — don't stack
    const bufName: keyof typeof ONESHOTS = kind === "long" ? "keyLong" : "keyShort"
    const buf = oneShotBuffers.get(bufName)
    if (!buf) return
    if (ctx.state === "suspended") void ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.loop = true
    src.connect(keystrokeBus)
    src.start()
    typingSource = src
    // Restore bus gain to target (we may have faded it to 0 on stop).
    const now = ctx.currentTime
    keystrokeBus.gain.cancelScheduledValues(now)
    keystrokeBus.gain.setValueAtTime(keystrokeBus.gain.value, now)
    keystrokeBus.gain.linearRampToValueAtTime(
      DEFAULT_LAYER_GAIN.keystroke,
      now + 0.08,
    )
  }

  const stopTyping: AudioEngineHandle["stopTyping"] = () => {
    if (!typingSource) return
    const src = typingSource
    typingSource = null
    const now = ctx.currentTime
    keystrokeBus.gain.cancelScheduledValues(now)
    keystrokeBus.gain.setValueAtTime(keystrokeBus.gain.value, now)
    keystrokeBus.gain.linearRampToValueAtTime(0, now + 0.22)
    window.setTimeout(() => {
      try { src.stop() } catch { /* noop */ }
      try { src.disconnect() } catch { /* noop */ }
    }, 260)
  }

  const playButtonThunk: AudioEngineHandle["playButtonThunk"] = () => {
    // One-shot the short keyboard track at a higher gain as a physical
    // button click. Not looped.
    const buf = oneShotBuffers.get("keyLong")
    if (!buf) return
    if (ctx.state === "suspended") void ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = buf
    const g = ctx.createGain()
    g.gain.value = 1.2
    src.connect(g).connect(oneShotBus)
    src.onended = () => {
      try { src.disconnect() } catch { /* noop */ }
      try { g.disconnect() } catch { /* noop */ }
    }
    src.start()
    // Stop after ~300ms — we only want the initial impact, not the full
    // 10s typing track.
    window.setTimeout(() => {
      try { src.stop() } catch { /* noop */ }
    }, 320)
  }

  const playTrappedAvatar: AudioEngineHandle["playTrappedAvatar"] = () => {
    if (trappedAvatarBuffers.length === 0) return
    if (ctx.state === "suspended") void ctx.resume()

    const buf = trappedAvatarBuffers[
      Math.floor(Math.random() * trappedAvatarBuffers.length)
    ]
    const src = ctx.createBufferSource()
    src.buffer = buf

    // Per-firing gain (some samples are hotter than others; random ±20%).
    const g = ctx.createGain()
    g.gain.value = DEFAULT_LAYER_GAIN.trappedAvatar * (0.85 + Math.random() * 0.3)

    // Stereo pan sweep — the voice moves across the room during playback.
    // Start on a random side, drift to the opposite side over the sample
    // duration, sometimes with a small S-curve via intermediate points.
    const panner = ctx.createStereoPanner()
    const startPan = (Math.random() - 0.5) * 1.6 // -0.8 .. 0.8
    const endPan = -startPan * (0.7 + Math.random() * 0.5)
    const now = ctx.currentTime
    const dur = buf.duration
    panner.pan.setValueAtTime(startPan, now)
    // Optional mid-point swing for a less linear motion.
    if (Math.random() < 0.5) {
      const midPan = (Math.random() - 0.5) * 1.4
      panner.pan.linearRampToValueAtTime(midPan, now + dur * 0.5)
    }
    panner.pan.linearRampToValueAtTime(endPan, now + dur)

    src.connect(g).connect(panner).connect(oneShotBus)
    src.onended = () => {
      try { src.disconnect() } catch { /* noop */ }
      try { g.disconnect() } catch { /* noop */ }
      try { panner.disconnect() } catch { /* noop */ }
    }
    src.start()
  }

  const playOneShot: AudioEngineHandle["playOneShot"] = (name, opts) => {
    const buf = oneShotBuffers.get(name)
    if (!buf) {
      console.warn(`[audio] oneshot missing: ${name}`)
      return
    }
    const src = ctx.createBufferSource()
    src.buffer = buf

    // Optional gain + pan — each one-shot gets its own small graph so
    // we don't keep mutating the shared bus.
    const g = ctx.createGain()
    g.gain.value = opts?.gain ?? 1
    const p = ctx.createStereoPanner()
    p.pan.value = opts?.pan ?? 0
    src.connect(g).connect(p).connect(oneShotBus)
    src.onended = () => {
      const i = live.indexOf(src); if (i >= 0) live.splice(i, 1)
      try { src.disconnect() } catch { /* noop */ }
      try { g.disconnect() } catch { /* noop */ }
      try { p.disconnect() } catch { /* noop */ }
    }
    live.push(src)
    src.start()
  }

  const startAmbient: AudioEngineHandle["startAmbient"] = (layer, fadeMs = 1500) => {
    const h = layers[layer]
    if (!h) {
      // Could fire before preload finishes; schedule a retry once ready.
      void preloadPromise.then(() => layers[layer]?.start(fadeMs))
      return
    }
    h.start(fadeMs)
  }

  const stopAmbient: AudioEngineHandle["stopAmbient"] = (layer, fadeMs = 800) => {
    const h = layers[layer]
    if (!h) return
    h.stop(fadeMs)
  }

  const dipAmbient: AudioEngineHandle["dipAmbient"] = (layer, depth, durationMs) => {
    const h = layers[layer]
    if (!h) return
    h.dip(depth, durationMs)
  }

  const dispose = () => {
    for (const src of live.splice(0)) {
      try { src.stop() } catch { /* noop */ }
      try { src.disconnect() } catch { /* noop */ }
    }
    if (musicSource) {
      try { musicSource.stop() } catch { /* noop */ }
      try { musicSource.disconnect() } catch { /* noop */ }
      musicSource = null
    }
    if (narrationSource) {
      try { narrationSource.stop() } catch { /* noop */ }
      try { narrationSource.disconnect() } catch { /* noop */ }
      narrationSource = null
    }
    if (typingSource) {
      try { typingSource.stop() } catch { /* noop */ }
      try { typingSource.disconnect() } catch { /* noop */ }
      typingSource = null
    }
    if (preStartHvacSource) {
      try { preStartHvacSource.stop() } catch { /* noop */ }
      try { preStartHvacSource.disconnect() } catch { /* noop */ }
      preStartHvacSource = null
    }
    if (preStartFanSource) {
      try { preStartFanSource.stop() } catch { /* noop */ }
      try { preStartFanSource.disconnect() } catch { /* noop */ }
      preStartFanSource = null
    }
    try { preStartHvacGain.disconnect() } catch { /* noop */ }
    try { preStartFanGain.disconnect() } catch { /* noop */ }
    for (const layer of Object.values(layers)) {
      if (layer) layer.dispose()
    }
    try { eveBus.disconnect() } catch { /* noop */ }
    try { oneShotBus.disconnect() } catch { /* noop */ }
    try { musicBus.disconnect() } catch { /* noop */ }
    try { narrationBus.disconnect() } catch { /* noop */ }
    try { preStartBus.disconnect() } catch { /* noop */ }
    try { keystrokeBus.disconnect() } catch { /* noop */ }
    try { master.disconnect() } catch { /* noop */ }
    void ctx.close()
  }

  return {
    playEve,
    startAmbient,
    stopAmbient,
    dipAmbient,
    playOneShot,
    startMusic,
    stopMusic,
    duckMusic,
    unduckMusic,
    startNarration,
    stopNarration,
    playGlitchVoice,
    startPreStartLoop,
    stopPreStartLoop,
    startTyping,
    stopTyping,
    playButtonThunk,
    playTrappedAvatar,
    playArtifactSfx,
    isReady: () => ready,
    dispose,
  }
}
