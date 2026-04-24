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

const AUDIO_BASE = "/audio/sound-effects/crt"

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
    `${AUDIO_BASE}/CMPTMisc-monitor_crt_hum._The-Elevenlabs.mp3`,
    `${AUDIO_BASE}/CMPTKey-Old_computer_termina-Elevenlabs.mp3`,
  ],
} as const

const ONESHOTS = {
  fuse: `${AUDIO_BASE}/A_single_heavy_indus_#4-1777051960039.mp3`,
  tick: `${AUDIO_BASE}/dos-beepmp3.mp3`,
  glitch: `${AUDIO_BASE}/glitch-crt.mp3`,
} as const

const MUSIC = {
  lobby: "/audio/music/Unattended_Lobby_entry.mp3",
} as const

// ── Gain defaults (linear 0–1). Tuned on first listen; retune freely. ─

const DEFAULT_LAYER_GAIN = {
  ballast: 0.18,
  hvac: 0.14,
  fan: 0.22,
  crtHum: 0.2,
  crtWhine: 0.0,
  oneshots: 0.9,
  eve: 1.0,
  music: 0.45,
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
  /** Temporarily duck music (usually driven internally by playEve). */
  duckMusic: (depth: number, fadeMs?: number) => void
  /** Release the duck back to full level. */
  unduckMusic: (fadeMs?: number) => void
  /** True once all preloads have resolved. */
  isReady: () => boolean
  /** Tear down everything. */
  dispose: () => void
}

// ── Implementation ──────────────────────────────────────────────────

async function fetchBuffer(ctx: AudioContext, url: string): Promise<AudioBuffer> {
  // Some of our sound files contain '#' characters (e.g. "_#1"). Without
  // encoding, fetch would treat everything after '#' as a URL fragment and
  // request the wrong resource. encodeURI preserves the slashes but escapes
  // the unsafe characters.
  const res = await fetch(encodeURI(url))
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

  // Eve buffers
  const eveBuffers = new Map<string, AudioBuffer>()

  // Oneshot buffers
  const oneShotBuffers = new Map<keyof typeof ONESHOTS, AudioBuffer>()

  // Music buffer + currently-playing source
  let musicBuffer: AudioBuffer | null = null
  let musicSource: AudioBufferSourceNode | null = null

  // Ambient layer handles (deferred until buffers resolve)
  const layers: Partial<Record<
    AmbientLayerName,
    ReturnType<typeof createAmbientLayer> | ReturnType<typeof createCrtWhine>
  >> = {}

  // Kick preloads
  let ready = false
  const preload = async () => {
    const evePromises = EVE_LINE_IDS.map(async (id) => {
      try {
        const buf = await fetchBuffer(ctx, `/audio/${id}.mp3`)
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

    await Promise.all([...evePromises, ...oneShotPromises, ...ambientPromises, musicPromise])
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
    for (const layer of Object.values(layers)) {
      if (layer) layer.dispose()
    }
    try { eveBus.disconnect() } catch { /* noop */ }
    try { oneShotBus.disconnect() } catch { /* noop */ }
    try { musicBus.disconnect() } catch { /* noop */ }
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
    isReady: () => ready,
    dispose,
  }
}
