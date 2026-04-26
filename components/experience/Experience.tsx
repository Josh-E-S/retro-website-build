"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Landing } from "./Landing"
import { Boot } from "./Boot"
import { Stage } from "./Stage"
import { Terminal, type TerminalHandle } from "./Terminal"
import { Artifacts, type ArtifactsHandle } from "./Artifacts"
import { IntroVideo } from "./IntroVideo"
import { IntroWelcome } from "./IntroWelcome"
import { QuoteRotator } from "./QuoteRotator"
import { createClock } from "@/lib/experience/clock"
import { sequence, type Cue } from "@/lib/experience/sequence"
import { createAudioEngine, type AudioEngineHandle } from "@/lib/experience/audio/engine"

/*
 * Experience — top-level client component.
 *
 * State machine:
 *   "landing" — first screen. Stage running, audio gated by the
 *               SynchronizeAudio pushbutton. Side menu visible after
 *               audio's on; only "Enroll in Study" advances. Other
 *               menu items show TransmissionUnavailable stubs.
 *   "boot"    — Enroll clicked. Amber-on-black loading bar with status
 *               lines and gibberish; ends in a white flash that
 *               crossfades into the cream Stage. Music + ambient
 *               continue from landing seamlessly across this window.
 *   "intro"   — Welcome card with full instruction; PA narration
 *               starts ~4s after entering this phase. The clock is
 *               NOT started yet — boot sequence and Eve are deferred
 *               until the player commits a second time.
 *   "running" — Second input received. Intro video unmounts, the clock
 *               starts at t=0 and the welcome stanza → boot checklist →
 *               Eve sequence plays out as before.
 */

type Phase = "landing" | "boot" | "intro" | "running"

// Narration kicks ~4 seconds after entering intro (i.e. just after the
// white-flash settles into the cream stage).
const NARRATION_DELAY_AFTER_INTRO_MS = 1200
// Hold on the intro screen long enough for the welcome card to settle
// and the narration to start, then commit to running automatically.
const INTRO_AUTO_ADVANCE_MS = 3000

export function Experience() {
  const [phase, setPhase] = useState<Phase>("landing")
  const terminalRef = useRef<TerminalHandle | null>(null)
  // State mirror so children that need to observe the handle (e.g.
  // QuoteRotator) can re-render once the Terminal is ready.
  const [terminalHandle, setTerminalHandle] = useState<TerminalHandle | null>(null)
  const artifactsRef = useRef<ArtifactsHandle | null>(null)
  const audioRef = useRef<AudioEngineHandle | null>(null)
  // Synchronous guard so a same-tick keydown+pointerdown pair can't
  // double-trigger the intro→running transition.
  const introUnlockedRef = useRef(false)
  const cursorRef = useRef(0)
  // The single live clock. Guards against Strict Mode double-mount or any
  // effect-rerun spawning a parallel clock: if one already exists, the
  // effect is a no-op.
  const clockRef = useRef<ReturnType<typeof createClock> | null>(null)

  const handleCue = useCallback((cue: Cue) => {
    const term = terminalRef.current
    const art = artifactsRef.current
    switch (cue.type) {
      case "stanza":
        if (term) void term.stanza(cue.lines, {
          cps: cue.cps,
          size: cue.size,
          holdAfterMs: cue.holdAfterMs,
          variant: cue.variant,
        })
        // On a glitch-resolve stanza we also kick a glitch sound so the
        // audio arrival matches the visual chaos.
        if (cue.variant === "glitch_resolve" && audioRef.current) {
          audioRef.current.playArtifactSfx("glitch", "hard")
        }
        break
      case "log_line":
        if (term) void term.pushLog(cue.line, cue.cps)
        break
      case "log_dots":
        if (term) void term.cycleDotsOnLastLog(cue.base, cue.durationMs)
        break
      case "clear":
        if (term) void term.clear()
        break
      case "glitch_subtitle":
        if (term) term.glitchSubtitle({ text: cue.text, durationMs: cue.durationMs })
        break
      case "cursor_blink":
        if (term) term.showBlinkingCursor(cue.on)
        break
      case "eve_line": {
        // Pace the text typewriter to the actual voice line length so the
        // sentence finishes on screen at the same time Eve finishes speaking.
        // If the audio buffer isn't loaded yet, fall back to the cue's cps.
        const totalChars = cue.textLines.join(" ").length || 1
        const dur = audioRef.current?.getEveDuration(cue.id) ?? 0
        // Land the last character ~250ms before the voice ends so the
        // sentence doesn't visibly type past the audio.
        const speakingMs = Math.max(0, dur * 1000 - 250)
        const cps = speakingMs > 0 ? totalChars / (speakingMs / 1000) : cue.cps
        if (term) void term.stanza(
          cue.textLines.map((text, i) => ({ id: `${cue.id}_${i}`, text })),
          { cps, size: "display", holdAfterMs: cue.holdAfterMs },
        )
        // Play the matching Eve voice MP3. The audio engine drops the call
        // silently if the buffer isn't ready or the file is missing, so
        // this never blocks the on-screen text from rendering.
        if (audioRef.current) audioRef.current.playEve(cue.id)
        break
      }
      case "artifacts_ambient":
        if (art) (cue.on ? art.ambient.start() : art.ambient.stop())
        break
      case "glitch":
        // Artifacts fires the corresponding one-shot via onEvent, so we
        // don't call playOneShot here — that would double up.
        if (art) art.glitch(cue.intensity)
        break
      case "symbol":
        if (art) art.symbol(cue.kind)
        break
      case "clump":
        if (art) art.clump({ subtle: cue.subtle })
        break
      case "logo_position":
        // Logo is removed from the experience for now — cue is a no-op.
        break
      case "audio": {
        // Route the declared spec filenames to the available sound bank.
        const a = audioRef.current
        if (!a) break
        const linGain = Math.pow(10, cue.volume / 20) // cue.volume is dB
        if (cue.file.startsWith("fuse_")) {
          a.playOneShot("fuse", { gain: linGain, pan: cue.pan })
        } else if (cue.file.startsWith("ambient_tick") || cue.file.startsWith("crt_screen_clear")) {
          a.playOneShot("beep", { gain: linGain, pan: cue.pan })
        } else if (cue.file.startsWith("pentium_boot")) {
          a.playOneShot("pentiumBoot", { gain: linGain, pan: cue.pan })
        } else {
          // crt_power_on.wav and similar — no asset yet; drop silently.
        }
        break
      }
      case "ambient_start":
        if (audioRef.current) {
          const layerMap = { ballast: "ballast", hvac: "hvac", fan: "fan", crt_whine: "crtWhine", crt_hum: "crtHum" } as const
          const mapped = layerMap[cue.layer]
          if (mapped) audioRef.current.startAmbient(mapped, cue.fadeMs)
        }
        break
      case "ambient_dip":
        if (audioRef.current) {
          const layerMap = { ballast: "ballast", hvac: "hvac", fan: "fan", crt_whine: "crtWhine", crt_hum: "crtHum" } as const
          const mapped = layerMap[cue.layer]
          if (mapped) audioRef.current.dipAmbient(mapped, cue.depth, cue.durationMs)
        }
        break
      case "music_start":
        if (audioRef.current) audioRef.current.startMusic(cue.fadeMs)
        break
      case "music_stop":
        if (audioRef.current) audioRef.current.stopMusic(cue.fadeMs)
        break
      case "trapped_avatar":
        // Trapped-avatar audio + image overlay are disabled — the intro
        // video carries the AI-presence visuals/audio now. Cue is a no-op
        // until/unless we wire something else for these moments.
        break
    }
    // eslint-disable-next-line no-console
    console.log(`[cue] t=${cue.t.toFixed(2)} ${cue.type} (${cue.id})`)
  }, [])

  useEffect(() => {
    if (phase !== "running") return
    // Idempotent bootstrap: the clock is created at most ONCE for the
    // component's lifetime. Strict Mode double-mounts (and any spurious
    // effect re-runs) are safe — the guard short-circuits.
    //
    // We intentionally do NOT null the ref on cleanup. Strict Mode in
    // dev does mount → cleanup → mount again; clearing the ref in the
    // cleanup would let the second mount spawn a new clock, which is
    // exactly the bug we're preventing. On real unmount, the component
    // is gone anyway — the orphaned clock would stop at next tick due
    // to lost onTick referents, but in practice this effect only ends
    // when the whole app tears down.
    if (clockRef.current) return
    const sorted = [...sequence].sort((a, b) => a.t - b.t)
    cursorRef.current = 0
    const clock = createClock((t) => {
      while (
        cursorRef.current < sorted.length &&
        sorted[cursorRef.current].t <= t
      ) {
        handleCue(sorted[cursorRef.current])
        cursorRef.current += 1
      }
    })
    clock.start()
    clockRef.current = clock
    // No cleanup — see comment above.
  }, [phase, handleCue])

  // Stop the clock on real component unmount (not Strict Mode cycle).
  useEffect(() => {
    return () => {
      clockRef.current?.stop()
      clockRef.current = null
    }
  }, [])

  // Landing → Boot. The audio engine + ambient bed + music were
  // already started by Landing when the player engaged the
  // SynchronizeAudio button, so all we do here is store the handle
  // and advance the phase. A single boot-prep beep punctuates the
  // commitment without doubling up on the existing ambience.
  const handleEnroll = useCallback((engine: AudioEngineHandle) => {
    audioRef.current = engine
    engine.playOneShot("beep", { gain: Math.pow(10, -3 / 20), pan: 0 })
    setPhase("boot")
  }, [])

  // Boot completion handoff. Fired by Boot.tsx at the white-flash peak.
  const handleBootComplete = useCallback(() => {
    setPhase("intro")
  }, [])

  // Bar-lock relay click: a single dry tick when the loading bar hits
  // 100%. Reuses the existing "tick" oneshot.
  const handleBootBarLock = useCallback(() => {
    audioRef.current?.playOneShot("tick", { gain: 0.6 })
  }, [])

  // Schedule the distant-PA narration once we're in intro. Anchored to
  // phase entry, not to wall-clock time after first click — keeps the
  // narration beat consistent if boot length changes.
  useEffect(() => {
    if (phase !== "intro") return
    const id = window.setTimeout(() => {
      audioRef.current?.startNarration(1200)
    }, NARRATION_DELAY_AFTER_INTRO_MS)
    return () => window.clearTimeout(id)
  }, [phase])

  // Start artifacts ambient bed when intro mounts so glitches/symbols/
  // clumps run under the intro video. The clock isn't running during
  // intro, so the artifacts_on cue would never fire on its own.
  useEffect(() => {
    if (phase !== "intro") return
    const id = window.setTimeout(() => {
      artifactsRef.current?.ambient.start()
    }, 200)
    return () => window.clearTimeout(id)
  }, [phase])

  // Auto-advance from intro → running so the user doesn't have to click
  // again to hear Eve. We still keep the input listeners so an impatient
  // player can short-circuit the wait. The narration is intro-only and
  // we fade it briefly as we commit; Eve's first cue then fires off the
  // running clock at sequence.ts t≈24s.
  useEffect(() => {
    if (phase !== "intro") return
    const advance = () => {
      if (introUnlockedRef.current) return
      introUnlockedRef.current = true
      audioRef.current?.stopNarration(1200)
      setPhase("running")
    }
    const auto = window.setTimeout(advance, INTRO_AUTO_ADVANCE_MS)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Spacebar" || e.code === "Space") {
        e.preventDefault()
      }
      advance()
    }
    window.addEventListener("keydown", onKey)
    window.addEventListener("pointerdown", advance)
    window.addEventListener("touchstart", advance, { passive: true })
    return () => {
      window.clearTimeout(auto)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("pointerdown", advance)
      window.removeEventListener("touchstart", advance)
    }
  }, [phase])

  // Dispose the audio engine when the component tears down.
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.dispose()
        audioRef.current = null
      }
    }
  }, [])

  const handleTerminalReady = useCallback((h: TerminalHandle) => {
    terminalRef.current = h
    setTerminalHandle(h)
  }, [])

  return (
    <main aria-hidden="true">
      {phase === "landing" && <Landing onEnroll={handleEnroll} />}
      {phase === "boot" && (
        <Boot onComplete={handleBootComplete} onBarLock={handleBootBarLock} />
      )}
      {(phase === "intro" || phase === "running") && (
        <Stage dim={phase === "intro"}>
          {/* Terminal mounts in both phases — it stays empty during intro
              (no cues are firing) so it's just a transparent layer ready
              to receive the welcome stanza when the clock starts. */}
          <Terminal
            onReady={handleTerminalReady}
            onTypingStart={(kind) => audioRef.current?.startTyping(kind)}
            onTypingEnd={() => audioRef.current?.stopTyping()}
            dim={phase === "intro"}
          />
          <Artifacts
            ref={artifactsRef}
            onEvent={(ev) => {
              const engine = audioRef.current
              if (!engine) return
              switch (ev.kind) {
                case "tetris":
                  engine.playArtifactSfx("tetris")
                  break
                case "clump":
                  engine.playArtifactSfx("clump", ev.subtle ? "subtle" : "normal")
                  break
                case "symbol":
                  engine.playArtifactSfx("symbol")
                  break
                case "glitch":
                  engine.playArtifactSfx("glitch", ev.intensity)
                  // Random corrupted-voice fragment under the visual
                  // glitch — more likely on hard glitches so they read
                  // as a transmission breaking through.
                  if (Math.random() < (ev.intensity === "hard" ? 0.4 : 0.18)) {
                    engine.playGlitchVoice()
                  }
                  break
              }
            }}
          />
          {/* Intro video at 50% over the stage. Removed on phase advance,
              so its decoder is freed once the player commits. */}
          {phase === "intro" && <IntroVideo />}
          {/* Welcome card stays mounted into running so it can fade out
              gracefully on the phase transition rather than popping. */}
          <IntroWelcome visible={phase === "intro"} />
          {/* Quote rotator drives the Terminal during intro only. */}
          {phase === "intro" && <QuoteRotator terminal={terminalHandle} />}
        </Stage>
      )}
    </main>
  )
}
