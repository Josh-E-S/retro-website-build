"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { Stage } from "./Stage"
import { Artifacts, type ArtifactsHandle } from "./Artifacts"
import { IntroVideo } from "./IntroVideo"
import { IntroWelcome } from "./IntroWelcome"
import { QuoteRotator } from "./QuoteRotator"
import { Terminal, type TerminalHandle } from "./Terminal"
import { SynchronizeAudio } from "./SynchronizeAudio"
import { SideMenu, type MenuId } from "./SideMenu"
import { TransmissionUnavailable } from "./TransmissionUnavailable"
import {
  createAudioEngine,
  type AudioEngineHandle,
} from "@/lib/experience/audio/engine"

/*
 * Landing — the new first screen.
 *
 * Mounts the cream Stage with the full visual chaos package
 * (ambient artifacts, intro video, glitches, code streams) running
 * immediately on page load. Audio is gated behind the SynchronizeAudio
 * pushbutton: clicking it creates the AudioContext and brings up the
 * ambient bed + music. Quotes only start cycling after audio is on so
 * the room comes alive in order.
 *
 * Side menu is left-rail; only "Enroll in Study" is wired in stage 1.
 * The other 4 items show a TransmissionUnavailable stub. Terminate
 * shows a "session cannot be terminated" notice — first overt horror
 * beat before the user has even committed to enrollment.
 *
 * Narration does NOT play here — it's reserved for the post-Boot
 * intro phase ("ENROLL" path).
 */

type Props = {
  /** Called when the player chooses to enroll. Parent should advance
   *  to the boot phase, handing back the live audio engine so Boot,
   *  Intro, and Running play under the established music + ambient. */
  onEnroll: (engine: AudioEngineHandle) => void
}

export function Landing({ onEnroll }: Props) {
  const audioRef = useRef<AudioEngineHandle | null>(null)
  const artifactsRef = useRef<ArtifactsHandle | null>(null)
  const terminalRef = useRef<TerminalHandle | null>(null)
  const [terminalHandle, setTerminalHandle] = useState<TerminalHandle | null>(null)
  const [audioEngaged, setAudioEngaged] = useState(false)
  const [stub, setStub] = useState<Exclude<MenuId, "enroll"> | null>(null)
  // Same Strict-Mode guard pattern Experience uses on its imperative
  // handles — Terminal mounts can fire onReady twice in dev and we
  // don't want to swap the handle out from under us.
  const handleTerminalReady = useCallback((h: TerminalHandle) => {
    if (terminalRef.current && terminalRef.current === h) return
    terminalRef.current = h
    setTerminalHandle(h)
  }, [])

  // Start artifacts ambient bed once mounted. Code streams + tetris +
  // clumps + symbols start playing immediately, silent until the
  // audio engine is online.
  useEffect(() => {
    const id = window.setTimeout(() => {
      artifactsRef.current?.ambient.start()
    }, 200)
    return () => window.clearTimeout(id)
  }, [])

  const handleEnableAudio = useCallback(async () => {
    if (audioRef.current) return
    // Audio engine creation requires a user gesture. Click-handler is
    // a valid gesture, so this is safe.
    const engine = await createAudioEngine()
    audioRef.current = engine
    setAudioEngaged(true)

    // Power-on bed: a subtle thunk + the room layers come up. We use
    // the same staggered ramp as the old wakeup unlock, scaled down
    // because the player is already on the page (no need to convey
    // "you've just arrived"). Music joins after a beat.
    engine.playOneShot("tick", { gain: 0.7 })
    engine.playOneShot("beep", { gain: Math.pow(10, -8 / 20), pan: 0 })

    window.setTimeout(() => {
      engine.startAmbient("hvac", 2400)
      engine.startAmbient("fan", 2400)
    }, 220)

    window.setTimeout(() => {
      engine.startAmbient("ballast", 3000)
      engine.startAmbient("crtHum", 3500)
    }, 1800)

    window.setTimeout(() => engine.startMusic(3500), 4500)
  }, [])

  const handleSelect = useCallback((id: MenuId) => {
    if (!audioEngaged) {
      // Menu is hidden until audio's on, but defensively ignore early
      // selections.
      return
    }
    if (id === "enroll") {
      const engine = audioRef.current
      if (!engine) return
      onEnroll(engine)
      return
    }
    setStub(id)
  }, [audioEngaged, onEnroll])

  return (
    <Stage dim>
      <Terminal
        onReady={handleTerminalReady}
        onTypingStart={(kind) => audioRef.current?.startTyping(kind)}
        onTypingEnd={() => audioRef.current?.stopTyping()}
        dim
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
              if (Math.random() < (ev.intensity === "hard" ? 0.4 : 0.18)) {
                engine.playGlitchVoice()
              }
              break
          }
        }}
      />
      <IntroVideo />

      {/* Welcome card — title only on the landing. The side menu is the
          call to action. */}
      <IntroWelcome visible subtitle="" />

      {/* Quote rotator only after audio is engaged so quotes don't
          appear in silence. */}
      {audioEngaged && <QuoteRotator terminal={terminalHandle} />}

      {/* Audio gate. Hidden once engaged. */}
      {!audioEngaged && <SynchronizeAudio onEnable={handleEnableAudio} />}

      {/* Side menu fades in once audio's on. */}
      <SideMenu
        visible={audioEngaged}
        onSelect={handleSelect}
        onHover={() => audioRef.current?.playMenuTick()}
      />

      {/* Stub overlay for the four unwired menu items. */}
      {stub && (
        <TransmissionUnavailable
          itemId={stub}
          onDismiss={() => setStub(null)}
        />
      )}
    </Stage>
  )
}
