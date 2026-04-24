"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Wakeup } from "./Wakeup"
import { Stage } from "./Stage"
import { Terminal, type TerminalHandle } from "./Terminal"
import { Artifacts, type ArtifactsHandle } from "./Artifacts"
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
  const audioRef = useRef<AudioEngineHandle | null>(null)
  const cursorRef = useRef(0)

  const handleCue = useCallback((cue: Cue) => {
    const term = terminalRef.current
    const art = artifactsRef.current
    switch (cue.type) {
      case "stanza":
        if (term) void term.stanza(cue.lines, {
          cps: cue.cps,
          size: cue.size,
          holdAfterMs: cue.holdAfterMs,
        })
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
        if (art) art.glitch(cue.intensity)
        // Hard glitches also fire a glitch sound; normal ones stay visual-only
        // so they don't become loud every time.
        if (audioRef.current && cue.intensity === "hard") {
          audioRef.current.playOneShot("glitch", { gain: 0.8 })
        }
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
    }
    // eslint-disable-next-line no-console
    console.log(`[cue] t=${cue.t.toFixed(2)} ${cue.type} (${cue.id})`)
  }, [])

  useEffect(() => {
    if (phase !== "running") return
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
    return () => clock.stop()
  }, [phase, handleCue])

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
          />
          <Artifacts ref={artifactsRef} />
          <LogoStage position={logoPos} />
        </Stage>
      )}
    </main>
  )
}
