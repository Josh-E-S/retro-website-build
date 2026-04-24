"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Wakeup } from "./Wakeup"
import { Stage } from "./Stage"
import { Terminal, type TerminalHandle } from "./Terminal"
import { Artifacts, type ArtifactsHandle } from "./Artifacts"
import { AvatarFlash, type AvatarFlashHandle } from "./AvatarFlash"
import { LogoStage, type LogoPosition as LogoStatePosition } from "./LogoStage"
import { createClock } from "@/lib/experience/clock"
import { sequence, type Cue } from "@/lib/experience/sequence"
import { createAudioEngine, type AudioEngineHandle } from "@/lib/experience/audio/engine"

/*
 * Experience — top-level client component.
 *
 * State machine:
 *   "wakeup"  — black screen with ESTABLISH LINK power button
 *   "running" — Stage mounted (auto-plays power-on animation); clock
 *               drives cues into Terminal / Artifacts / LogoStage
 */

type Phase = "wakeup" | "running"

export function Experience() {
  const [phase, setPhase] = useState<Phase>("wakeup")
  const [logoPos, setLogoPos] = useState<LogoStatePosition>("hidden")
  const terminalRef = useRef<TerminalHandle | null>(null)
  const artifactsRef = useRef<ArtifactsHandle | null>(null)
  const avatarFlashRef = useRef<AvatarFlashHandle | null>(null)
  const audioRef = useRef<AudioEngineHandle | null>(null)
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
      case "cursor_blink":
        if (term) term.showBlinkingCursor(cue.on)
        break
      case "eve_line":
        if (term) void term.stanza(
          cue.textLines.map((text, i) => ({ id: `${cue.id}_${i}`, text })),
          { cps: cue.cps, size: "display", holdAfterMs: cue.holdAfterMs },
        )
        // Play the matching Eve voice MP3. The audio engine drops the call
        // silently if the buffer isn't ready or the file is missing, so
        // this never blocks the on-screen text from rendering.
        if (audioRef.current) audioRef.current.playEve(cue.id)
        break
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
        setLogoPos(cue.position)
        break
      case "audio": {
        // Route the declared spec filenames to the available sound bank.
        const a = audioRef.current
        if (!a) break
        const linGain = Math.pow(10, cue.volume / 20) // cue.volume is dB
        if (cue.file.startsWith("fuse_")) {
          a.playOneShot("fuse", { gain: linGain, pan: cue.pan })
        } else if (cue.file.startsWith("ambient_tick") || cue.file.startsWith("crt_screen_clear")) {
          a.playOneShot("tick", { gain: linGain, pan: cue.pan })
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
        if (audioRef.current) audioRef.current.playTrappedAvatar()
        // Pair audio with the full-viewport avatar image + hard glitch.
        avatarFlashRef.current?.flash(8000)
        artifactsRef.current?.glitch("hard")
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

  const handleUnlock = useCallback((_latencyMs: number, audio: AudioEngineHandle) => {
    audioRef.current = audio
    setPhase("running")
  }, [])

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
  }, [])

  return (
    <main aria-hidden="true">
      {phase === "wakeup" && <Wakeup onUnlock={handleUnlock} />}
      {phase === "running" && (
        <Stage>
          <Terminal
            onReady={handleTerminalReady}
            avoidCornerLogo={logoPos === "corner"}
            onTypingStart={(kind) => audioRef.current?.startTyping(kind)}
            onTypingEnd={() => audioRef.current?.stopTyping()}
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
                  break
              }
            }}
          />
          <LogoStage position={logoPos} />
          <AvatarFlash ref={avatarFlashRef} />
        </Stage>
      )}
    </main>
  )
}
