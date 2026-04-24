/*
 * Audio engine (minimal prototype).
 *
 * This is the proto-grade pipeline: create an AudioContext on the user
 * gesture (ESTABLISH LINK), preload every eve_*.mp3 into decoded buffers,
 * and play a specific buffer when an eve_line cue fires. No spatial
 * panning, no reverb, no highshelf yet — straight playback through the
 * master bus. LiveKit comes later.
 *
 * Public shape is deliberately small: create() returns a handle that the
 * Experience keeps in a ref and calls on cues.
 */

export type AudioEngineHandle = {
  /** Fire-and-forget playback for a pre-loaded Eve line by ID. */
  playEve: (id: string) => void
  /** Stop everything in flight and release nodes. */
  dispose: () => void
  /** Whether preload has completed — cues that arrive before this are no-ops. */
  isReady: () => boolean
}

const EVE_LINE_IDS = [
  "eve_1a",
  "eve_1b",
  "eve_1c",
  "eve_1d",
  "eve_1e",
  "eve_2a",
  "eve_2b",
  "eve_2c",
  "eve_2d",
  "eve_2e",
  "eve_2f",
  "eve_2g",
  "eve_2h",
  "eve_2i",
  "eve_2j",
] as const

/**
 * Create and boot the audio engine. Must be called from inside a user-
 * gesture handler (e.g. the ESTABLISH LINK click) so the AudioContext can
 * start in the "running" state.
 */
export async function createAudioEngine(): Promise<AudioEngineHandle> {
  // Prefer the standard AudioContext; Safari used to expose a prefixed
  // webkitAudioContext but current versions accept the unprefixed one too.
  const AC: typeof AudioContext =
    (window.AudioContext as typeof AudioContext) ||
    (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
  const ctx = new AC()

  // Master bus — we'll attach spatial nodes later; for now it's just gain.
  const master = ctx.createGain()
  master.gain.value = 1
  master.connect(ctx.destination)

  const eveBus = ctx.createGain()
  eveBus.gain.value = 1
  eveBus.connect(master)

  const buffers = new Map<string, AudioBuffer>()

  // Kick preload asynchronously. Cues that fire before a buffer is ready
  // are simply dropped (logged) — for a 32-second window before Eve's
  // first line, preload will almost always finish in time.
  const preload = async () => {
    await Promise.all(
      EVE_LINE_IDS.map(async (id) => {
        try {
          const res = await fetch(`/audio/${id}.mp3`)
          if (!res.ok) throw new Error(`${id}: HTTP ${res.status}`)
          const bytes = await res.arrayBuffer()
          const buf = await ctx.decodeAudioData(bytes)
          buffers.set(id, buf)
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn(`[audio] failed to load ${id}:`, err)
        }
      }),
    )
  }

  const preloadPromise = preload()

  // Track live sources so dispose() can stop them cleanly.
  const live: AudioBufferSourceNode[] = []

  const playEve = (id: string) => {
    const buf = buffers.get(id)
    if (!buf) {
      // eslint-disable-next-line no-console
      console.warn(`[audio] playEve("${id}") before buffer ready or missing file`)
      return
    }
    if (ctx.state === "suspended") void ctx.resume()
    const src = ctx.createBufferSource()
    src.buffer = buf
    src.connect(eveBus)
    src.onended = () => {
      const i = live.indexOf(src)
      if (i >= 0) live.splice(i, 1)
      try {
        src.disconnect()
      } catch {
        /* noop */
      }
    }
    live.push(src)
    src.start()
  }

  const dispose = () => {
    for (const src of live.splice(0)) {
      try {
        src.stop()
      } catch {
        /* noop */
      }
      try {
        src.disconnect()
      } catch {
        /* noop */
      }
    }
    try {
      eveBus.disconnect()
      master.disconnect()
    } catch {
      /* noop */
    }
    void ctx.close()
  }

  // Surface readiness — we fulfil the returned handle immediately but
  // the buffers populate in the background. isReady() reports actual state.
  let ready = false
  void preloadPromise.then(() => {
    ready = true
  })

  return {
    playEve,
    dispose,
    isReady: () => ready,
  }
}
