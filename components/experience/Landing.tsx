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
 * Narration: the distant-PA orientation track plays here, starting
 * ~2s after music with no fade-in so it lands as a clear voice. It
 * keeps playing through enrollment and into the running phase, where
 * Eve's lines duck it.
 */

const MENU_IDLE_FADE_MS = 4000

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
  // Menu idle state. The menu fades to 0 after a few seconds of no
  // input; while idle the QuoteRotator runs. Any pointer/touch/key
  // wakes the menu and stops the quotes.
  const [menuIdle, setMenuIdle] = useState(false)
  const idleTimerRef = useRef<number | null>(null)
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
      engine.startAmbient("hvac", 1200)
      engine.startAmbient("fan", 1200)
    }, 120)

    window.setTimeout(() => {
      engine.startAmbient("ballast", 1500)
      engine.startAmbient("crtHum", 1500)
    }, 700)

    window.setTimeout(() => engine.startMusic(1500), 1200)

    // Distant-PA orientation narration: 2s after music starts (i.e.
    // ~3.2s after sync click), at full level — no fade-in so the
    // voice cuts in like a real PA. It keeps playing through enroll
    // and into the running phase, where Eve will duck it.
    window.setTimeout(() => engine.startNarration(0), 1200 + 2000)
  }, [])

  // Inactivity timer: any pointer/touch/key wakes the menu and clears
  // the quote rotator. Going N ms without input fades the menu out and
  // lets quotes start firing.
  useEffect(() => {
    if (!audioEngaged) return
    const wake = () => {
      setMenuIdle(false)
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
      idleTimerRef.current = window.setTimeout(
        () => setMenuIdle(true),
        MENU_IDLE_FADE_MS,
      )
    }
    wake()
    window.addEventListener("pointerdown", wake)
    window.addEventListener("touchstart", wake, { passive: true })
    window.addEventListener("keydown", wake)
    return () => {
      if (idleTimerRef.current) window.clearTimeout(idleTimerRef.current)
      window.removeEventListener("pointerdown", wake)
      window.removeEventListener("touchstart", wake)
      window.removeEventListener("keydown", wake)
    }
  }, [audioEngaged])

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

      {/* Quotes fire only when the menu has gone to sleep — they take
          over the screen when the player isn't actively engaging. */}
      <QuoteRotator
        terminal={terminalHandle}
        enabled={audioEngaged && menuIdle}
      />

      {/* Audio gate. Hidden once engaged. */}
      {!audioEngaged && <SynchronizeAudio onEnable={handleEnableAudio} />}

      {/* Side menu fades in once audio's on, fades to 0 when idle. */}
      <SideMenu
        visible={audioEngaged}
        idle={menuIdle}
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
