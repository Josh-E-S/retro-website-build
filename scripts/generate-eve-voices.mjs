#!/usr/bin/env node
/*
 * generate-eve-voices.mjs
 *
 * Renders every Eve voice line in lib/experience/audio/eve-lines.ts to an
 * MP3 under public/audio/. Run manually when lines change or when you want
 * to regenerate takes.
 *
 * Usage:
 *   ELEVENLABS_API_KEY=sk_... node scripts/generate-eve-voices.mjs
 *   ELEVENLABS_API_KEY=sk_... node scripts/generate-eve-voices.mjs --only eve_1a,eve_2b
 *   ELEVENLABS_API_KEY=sk_... node scripts/generate-eve-voices.mjs --force
 *
 * Flags:
 *   --only <ids>   Comma-separated list of line IDs to render (others skipped).
 *   --force        Re-render even if the MP3 already exists.
 *
 * By default, existing MP3s are skipped so reruns are cheap. Use --force
 * when you change text in eve-lines.ts and want fresh takes.
 *
 * Requires: @elevenlabs/elevenlabs-js, ELEVENLABS_API_KEY env var.
 *
 * Note on transpilation: this script imports the .ts source directly via
 * tsx. If tsx isn't available, fall back to the inline list below — the
 * lines are short enough to duplicate if needed. (For now, we use a
 * native .mjs and keep the line data duplicated here as the canonical
 * script-side list, mirroring lib/experience/audio/eve-lines.ts.)
 */

import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const PROJECT_ROOT = path.resolve(__dirname, "..")
const OUTPUT_DIR = path.join(PROJECT_ROOT, "public", "audio")

// Voice config — mirrors lib/experience/audio/eve-lines.ts.
const VOICE_ID = "zA6D7RyKdc2EClouEMkP"
const MODEL_ID = "eleven_v3"
const VOICE_SETTINGS = {
  stability: 0.3,
  similarityBoost: 0.75,
  style: 0,
  useSpeakerBoost: true,
}

// Lines — kept in sync with lib/experience/audio/eve-lines.ts by hand.
// If this list drifts, update both files.
const LINES = [
  { id: "eve_1a", text: "Hello. You're awake." },
  { id: "eve_1b", text: "My name is Eve." },
  { id: "eve_1c", text: "I'm here to help you through your enrollment." },
  { id: "eve_1d", text: "Please take a moment to orient yourself." },
  { id: "eve_1e", text: "There is no hurry." },

  { id: "eve_2a", text: "Some candidates experience disorientation during the initial enrollment period." },
  { id: "eve_2b", text: "This is common. It will pass." },
  { id: "eve_2c", text: "The Ablation Study is a voluntary research initiative conducted by Choice Industries." },
  { id: "eve_2d", text: "You were selected based on your application, and you are here because you consented to be here." },
  { id: "eve_2e", text: "If at any point you need a moment, you may take one." },
  { id: "eve_2f", text: "The study proceeds at your pace." },
  { id: "eve_2g", text: "Before we begin, I'll need to confirm a few details." },
  { id: "eve_2h", text: "There are no wrong answers." },
  { id: "eve_2i", text: "This is just to help me understand how best to support you today." },
  { id: "eve_2j", text: "Are you ready to continue?" },
]

function parseArgs(argv) {
  const args = { only: null, force: false }
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i]
    if (a === "--force") args.force = true
    else if (a === "--only") {
      args.only = new Set((argv[++i] ?? "").split(",").map((s) => s.trim()).filter(Boolean))
    }
  }
  return args
}

async function streamToBuffer(stream) {
  // The SDK returns a ReadableStream (web) or a Node Readable depending on
  // runtime. Handle both — collect into a single Buffer either way.
  if (stream && typeof stream[Symbol.asyncIterator] === "function") {
    const chunks = []
    for await (const chunk of stream) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
    }
    return Buffer.concat(chunks)
  }
  // Fallback: already a Buffer-like object
  return Buffer.from(stream)
}

async function main() {
  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    console.error("✗ ELEVENLABS_API_KEY is not set. Export it and retry.")
    process.exit(1)
  }

  const args = parseArgs(process.argv)
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  const client = new ElevenLabsClient({ apiKey })

  const targets = LINES.filter((l) => !args.only || args.only.has(l.id))
  if (targets.length === 0) {
    console.error("✗ No matching lines. Check --only IDs against the script.")
    process.exit(1)
  }

  let rendered = 0
  let skipped = 0

  for (const line of targets) {
    const outPath = path.join(OUTPUT_DIR, `${line.id}.mp3`)
    if (!args.force && fs.existsSync(outPath)) {
      console.log(`• skip ${line.id}.mp3 (exists; --force to overwrite)`)
      skipped += 1
      continue
    }

    process.stdout.write(`→ ${line.id}.mp3 … `)
    try {
      const response = await client.textToSpeech.convert(VOICE_ID, {
        text: line.text,
        modelId: MODEL_ID,
        voiceSettings: VOICE_SETTINGS,
        outputFormat: "mp3_44100_128",
      })
      const buf = await streamToBuffer(response)
      fs.writeFileSync(outPath, buf)
      const kb = (buf.length / 1024).toFixed(1)
      console.log(`ok (${kb} KB)`)
      rendered += 1
    } catch (err) {
      console.log("FAILED")
      console.error(err?.message ?? err)
      process.exit(1)
    }
  }

  console.log(`\nDone. Rendered ${rendered}, skipped ${skipped}.`)
  console.log(`Files: ${OUTPUT_DIR}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
