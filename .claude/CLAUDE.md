# The Ablation Study — Project Notes

A psychological-horror web prototype. The player loads a URL and is pulled into a fictional research program run by **Choice Industries**. The whole experience lives in the browser as one continuous opening sequence — there is no menu, no header, no footer. The site IS the experience.

Tonal references: Severance (cold institutional calm), Alien (1979) retro-futurist interfaces, 2001: A Space Odyssey (AI voice from a ceiling), Control (brutalist-bureaucratic atmosphere).

## Tech foundation

- **Next.js 16 canary + React 19 + Tailwind v4** App Router. Strict mode on.
- **Web Audio API** hand-rolled engine — no audio library. Buses for music, eve voice, ambient layers, one-shots, keystroke loop, intro pre-start, music bed.
- **ElevenLabs TTS** for Eve's voice via `scripts/generate-eve-voices.mjs`. Lines pre-rendered to `public/audio/eve_*.mp3` so playback is instant.
- **No animation library.** A single `requestAnimationFrame` master clock fires cues from a sorted `Cue[]` array. CSS handles the rest.
- **Branch:** `intro-and-quotes` (current). Force-pushed `main` to match earlier work. Old "Apollo Labs / Pages setup" commits live in git history at `127a390` if ever needed.

## Architecture

```
app/
  layout.tsx              — title "—", 1×1 favicon, no chrome, hidden cursor
  page.tsx                — mounts <Experience />
  globals.css             — palette tokens (paper #ece8dc, ink #1f2a37, etc.)

components/experience/
  Experience.tsx          — top-level state machine: wakeup → intro → running
  Wakeup.tsx              — amber title + prompt + cursor; first input → unlock
  Stage.tsx               — CRT frame: power-on, scanlines, vignette, flicker, tear
  Terminal.tsx            — typewriter / glitch-resolve / log / glitch-subtitle
  Artifacts.tsx           — tetris, symbols, clumps, chroma slices, ribbon
  IntroVideo.tsx          — full-viewport intro.mp4 at 50% opacity, ghost overlay
  QuoteRotator.tsx        — fictional quote bank cycling during intro
  AnimatedNoise.tsx       — canvas RGB noise (paper grain)
  AvatarFlash.tsx         — full-viewport ghost avatar (currently unmounted)
  LogoMark.tsx, LogoStage.tsx — currently unused, kept for re-enable

lib/experience/
  clock.ts                — rAF master clock with pause-on-visibility
  sequence.ts             — the SINGLE tuning surface for the timeline
  audio/engine.ts         — buses, preload, all playback methods
  audio/eve-lines.ts      — canonical Eve text + voice config

scripts/
  generate-eve-voices.mjs — ElevenLabs runner, called via pnpm voices:gen
```

## Phase machine (Experience)

1. **`wakeup`** — black screen, amber title `THE ABLATION STUDY` (per-character flicker), `PRESS SPACE BAR TO BEGIN` (also flickering), big blinking block cursor. Pure black, no audio. First input gates the AudioContext.
2. **`intro`** — Stage mounts, IntroVideo + Artifacts + audio bed. Clock NOT running yet. QuoteRotator cycles fictional study quotes. Second input → running.
3. **`running`** — Clock starts at t=0, sequence fires: WELCOME glitch-resolve → boot checklist → 4-second silence → Eve speaks.

## Wake-up timing (after first click)

| t | Event |
|---|---|
| 0ms | dos-beep, then Pentium tone (160ms), then fuses (200ms, 600ms). Black. |
| 400ms | Distant ambient (HVAC + DC fan) starts 3s fade-in. |
| 240ms–5000ms | **Pure black for ~4.7s.** Audio leads — no video yet. |
| 5000ms | IntroVideo begins 3s fade-in (own internal delay). Ballast + CRT hum join. |
| 9000ms | Lobby music begins 3.5s fade-in. |
| 12500ms | First quote types in. |

Pacing rule: **the room comes alive in order — sound floor → sight → music → transmissions.** Don't fire things in parallel.

## Sequence timing (after second click)

| t | Event |
|---|---|
| 0ms | Clock starts. Power-on SFX cues fire as no-ops (audio guards). |
| 5.2s | WELCOME glitch-resolve stanza (1.8s scramble + 2 shakes + 5.5s hold). |
| 8.2s | "Artificial Intelligence You Can Trust" slogan glitches in below. |
| 11.0s | Clear, boot checklist begins (MEMORY, NETWORK, AUDIO, BEHAVIORAL TELEMETRY, SESSION COUNTER). |
| ~17s | INITIALIZING dots loop. |
| 19.4s | Cursor blinks, **intentional 4-second silence**. |
| 24.2s | Eve: "Hello. You're awake." |
| 24.2s–96s | Eve's two monologues, broken into ~15 stanzas with glitches/symbols. |

## Audio palette

- **Music:** `Unattended_Lobby_entry.mp3` — looping bed, auto-ducks under Eve.
- **Ambient bed:** ballast hum, distant HVAC (alternating variants), DC fan, CRT monitor hum stack. Each on its own gain bus.
- **Eve:** ElevenLabs Almee voice, `eleven_v3`, stability 0.3, similarity_boost 0.75. Voice ID `zA6D7RyKdc2EClouEMkP`. Pre-rendered MP3s in `public/audio/`.
- **One-shots:** fuse (heavy industrial), beep (dos-beep, also `crt_screen_clear`), glitch (glitch-crt), pentiumBoot (CRT startup), keyShort/keyLong (typing tracks).
- **Typing audio:** `old-keyboard-short.mp3` and `old-keyboard-long.mp3` are **continuous loops** during typing, NOT per-character samples. Critical fix — original per-char approach stacked dozens of overlapping plays.

## Visual palette

- **Cream/ink** main experience: `#ece8dc` paper, `#1f2a37` ink, `#0f1720` deep ink, muted blue accent `#6f8ea8`. CMYK print-registration ghost (`#1fb6c1` cyan / `#c84b8f` magenta) on text.
- **Amber Wakeup:** `#d9b24a` on pure black. Warning-light institutional, transitions warmly into the cream stage.
- **Dim mode** (intro phase only): paper backdrop dropped to `brightness(0.45)` + 35% black overlay. Terminal text switches to **near-white #ffffff with heavy glow** so quotes pop against the darkened paper. Also Terminal `zIndex: 8` (above scanlines, vignette, video, artifacts) so nothing muddies the text.

## Z-index stack

| z | Layer |
|---|---|
| 0 | Stage paper backdrop |
| 1 | Stage dim wash (intro only) |
| 2 | Stage scanlines |
| 2 | IntroVideo (intro only) |
| 3 | Stage rolling band |
| 4 | Stage vignette |
| 5 | Stage flicker |
| 6 | Stage tear |
| 7 | Artifacts (tetris/symbols/clumps/slices/ribbon) |
| 8 | **Terminal text** (above all overlays for legibility) |
| 20 | Stage power-on beam (early frames only) |
| 50 | AvatarFlash (currently unused) |

## Gotchas to avoid

- **Strict Mode double-mount:** Experience uses `clockRef` + Terminal uses `handleCreatedRef` to prevent parallel clocks / parallel chain queues. Never null these on cleanup — that's what spawned the duplicate-typing bug.
- **AudioContext gesture rule:** mousemove ISN'T a valid user activation per the spec — only click / keydown / pointerdown / touchstart. Don't create the AudioContext on mousemove or you get Chrome warnings.
- **`#` in URLs:** several sound files have `#` in their names (`A_continuous_120Hz_e_#1...`). `encodeURI` does NOT escape `#`. Use a manual `.replace(/#/g, "%23")`. The `fetchBuffer` helper in `engine.ts` does this.
- **Typewriter audio:** ONE looping track per typing burst, NOT per character.
- **Intro video size:** keep it ≤40MB compressed. ffmpeg recipe is in `audio/engine.ts` comments — `-crf 28 -preset slow -vf scale=1280:720 -an -movflags +faststart`.
- **Per-character flicker on idle text** uses an independent scheduler per char (4–6 frame burst at 35–60ms each, then settle). Don't go back to the synchronized "every 120ms re-roll all chars" pattern — it reads as a marquee, not a transmission.

## What's currently disabled

- **Logo** (LogoMark / LogoStage). Files kept for later re-enable.
- **AvatarFlash + trapped-avatar audio + scripted trapped_avatar cues.** Replaced by the looping intro video. The video files in `public/videos/` (avatar-scream-1/2/3.mp4 and the various robot variants) are unused but kept for future hooks.

## Run scripts

```
pnpm dev                  — Next dev server
pnpm build                — production build
pnpm voices:gen           — render Eve MP3s; skips existing
pnpm voices:gen --only eve_1a — render one line
pnpm voices:regen         — force re-render
```

`.env.local` holds `ELEVENLABS_API_KEY`. Already gitignored.

## Working with this codebase

- The full timeline lives in `lib/experience/sequence.ts`. **Edit timings there**, not in components.
- Per-quote scatter (random offset on screen) is in `QuoteRotator.tsx` and uses a `stanza` opt — reusable for other beats if you want to scatter Eve's lines.
- Glitch density: `Wakeup.tsx` has the cadence schedulers (normal every 2.8–6s, hard every 11–20s). `Artifacts.tsx` has the ambient tetris/symbols/clumps schedulers (always-on baseline).
- Voice settings in `lib/experience/audio/eve-lines.ts` — same file is duplicated in `scripts/generate-eve-voices.mjs` (intentional; the script must be self-contained .mjs with no ts imports).

## Branches

- **`main`** — force-pushed to match the latest `ablation-study-proto` state (earlier Apollo Labs PRs were nuked per user instruction).
- **`ablation-study-proto`** — the long-running prototype branch.
- **`intro-and-quotes`** — current branch. Adds the intro phase, quote rotator, dim mode, scattered quote positions, per-character flicker, and wake-up audio pacing.
