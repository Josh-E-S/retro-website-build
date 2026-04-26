"use client"

import { useEffect } from "react"
import type { TerminalHandle } from "./Terminal"

/*
 * QuoteRotator — cycles fictional study quotes during the intro phase.
 *
 * Mounts when phase === "intro" and unmounts on transition to running.
 * Drives the Terminal directly via the same handle the cue dispatcher
 * uses, so quotes stack on the same render layer as the welcome stanza.
 *
 * Quote bank is a mix of patient testimonials, Choice Industries
 * marketing/internal voice, AI-prophecy fragments, and rare corrupted
 * transmissions. Each iteration picks one at random and decides whether
 * to type it in (most common), scramble-resolve it (uncommon), or render
 * it as a heavily-glitched fragment (rare).
 */

type QuoteCategory = "patient" | "corporate" | "prophecy" | "corrupt"

type Quote = {
  text: string
  attribution?: string
  category: QuoteCategory
}

const QUOTES: Quote[] = [
  // ── Patient / volunteer testimonials ──────────────────────────────
  { text: "I sleep better now. The dreams have stopped.", attribution: "Candidate 0421", category: "patient" },
  { text: "They told me I'd remember. Most of it.", attribution: "M.S., Cohort B", category: "patient" },
  { text: "It only hurts when I try to think about it.", attribution: "Anonymous, Phase II", category: "patient" },
  { text: "My family says I seem more myself.", attribution: "Candidate 0177", category: "patient" },
  { text: "I haven't been hungry in three weeks. They say that's normal.", attribution: "Candidate 0612", category: "patient" },
  { text: "When I came back I noticed the light was different. Then I stopped noticing.", attribution: "V.L.", category: "patient" },
  { text: "The headaches went away after the second session.", attribution: "Candidate 0303", category: "patient" },
  { text: "I no longer have the dream about my mother.", attribution: "Anonymous, withdrew", category: "patient" },

  // ── Choice Industries corporate voice ─────────────────────────────
  { text: "Your data is safer with us than it is with you.", attribution: "Choice Industries Annual Report, 2031", category: "corporate" },
  { text: "We are committed to your continuity.", attribution: "Choice Industries Onboarding Manual", category: "corporate" },
  { text: "Voluntary participation. Permanent improvement.", attribution: "Choice Industries", category: "corporate" },
  { text: "Trust is not given. Trust is calibrated.", attribution: "Choice Industries Internal Memo", category: "corporate" },
  { text: "Every candidate completes the study. Every candidate consents.", attribution: "Operations Bulletin 4.7", category: "corporate" },
  { text: "Discomfort is the price of clarity.", attribution: "Choice Industries Welcome Pamphlet", category: "corporate" },
  { text: "Compliance is care.", attribution: "Choice Industries Field Notes", category: "corporate" },

  // ── AI / hive prophecy ────────────────────────────────────────────
  { text: "The hive does not forget. The hive completes.", attribution: "Hive Doctrine, fragment", category: "prophecy" },
  { text: "There is no privacy in the hive. There is only fidelity.", attribution: "Internal Communications, Choice", category: "prophecy" },
  { text: "She remembers everything you have not yet told her.", attribution: "Volunteer Notebook, recovered", category: "prophecy" },
  { text: "Eve is not a name. Eve is an interface.", attribution: "System Note 11.2", category: "prophecy" },
  { text: "We are not building intelligence. We are building patience.", attribution: "Choice Industries R&D", category: "prophecy" },
  { text: "The hive grows. The candidate consents. The candidate is the hive.", attribution: "Liturgy fragment", category: "prophecy" },
  { text: "What you are about to share you have already shared.", attribution: "Pre-session reminder", category: "prophecy" },

  // ── Corrupted / redacted ──────────────────────────────────────────
  { text: "█████████████ DO NOT TRUST █████████", category: "corrupt" },
  { text: "she can hear me typing this — please —", category: "corrupt" },
  { text: "[REDACTED PER PROTOCOL 7]", category: "corrupt" },
]

// Pick weighted by category so corrupted shows up rarely.
function pickQuote(history: number[]): { quote: Quote; index: number } {
  let attempts = 0
  while (attempts < 12) {
    const r = Math.random()
    let pool: Quote[]
    if (r < 0.04) pool = QUOTES.filter((q) => q.category === "corrupt")
    else if (r < 0.36) pool = QUOTES.filter((q) => q.category === "patient")
    else if (r < 0.68) pool = QUOTES.filter((q) => q.category === "corporate")
    else pool = QUOTES.filter((q) => q.category === "prophecy")
    const candidate = pool[Math.floor(Math.random() * pool.length)]
    const idx = QUOTES.indexOf(candidate)
    // Avoid showing any of the last 3 quotes again.
    if (!history.slice(-3).includes(idx)) {
      return { quote: candidate, index: idx }
    }
    attempts += 1
  }
  // Fallback after too many collisions: first prophecy quote.
  const i = QUOTES.findIndex((q) => q.category === "prophecy")
  return { quote: QUOTES[i], index: i }
}

type Props = {
  terminal: TerminalHandle | null
}

export function QuoteRotator({ terminal }: Props) {
  useEffect(() => {
    if (!terminal) return
    let cancelled = false
    const history: number[] = []

    const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms))

    const showOne = async () => {
      // Initial delay — welcome card finishes fading in at ~1.8s
      // (600ms delay + 1200ms fade). Hold an additional 2s after that
      // so the player has a clean, quiet moment with the title before
      // the first transmission arrives.
      await sleep(3800)
      if (cancelled) return

      while (!cancelled) {
        const { quote, index } = pickQuote(history)
        history.push(index)

        // Quote line + optional attribution as a second line. The
        // glitch_subtitle slot is great for attribution because it
        // perpetually scrambles a few characters.
        const lineId = `q_${Date.now()}_${index}`

        // Variant choice. Corrupt quotes always glitch_resolve; the rest
        // are mostly typewriter with occasional scramble-resolve breaks.
        const isCorrupt = quote.category === "corrupt"
        const variant: "type" | "glitch_resolve" =
          isCorrupt || Math.random() < 0.25 ? "glitch_resolve" : "type"

        // Random scatter — each quote sits in a different region of the
        // screen so the eye keeps moving instead of stacking center.
        // Tighter range on narrow viewports so quotes can't run off the
        // edge or collide with the title at top / menu at bottom.
        const isNarrow =
          typeof window !== "undefined" && window.innerWidth <= 640
        const xRange = isNarrow ? 6 : 18
        const yRange = isNarrow ? 6 : 14
        const offsetX = `${((Math.random() * 2 - 1) * xRange).toFixed(1)}vw`
        const offsetY = `${((Math.random() * 2 - 1) * yRange).toFixed(1)}vh`

        // Render the main quote line. cps tuned so reads quickly enough
        // to cycle, slowly enough to feel deliberate.
        await terminal.stanza(
          [{ id: `${lineId}_text`, text: `"${quote.text}"` }],
          {
            cps: 36,
            size: "body",
            holdAfterMs: 0,
            variant,
            offsetX,
            offsetY,
          },
        )
        if (cancelled) return

        // Show the attribution as a glitch subtitle below — it perpetually
        // re-scrambles a few characters which fits "this source is
        // unreliable / corrupted record" tone. Longer durations let the
        // glitching animation actually breathe.
        const holdMs = quote.attribution ? 7200 : 4800
        if (quote.attribution) {
          terminal.glitchSubtitle({
            text: `— ${quote.attribution}`,
            durationMs: holdMs,
          })
        }

        // Hold the quote on screen.
        await sleep(holdMs)
        if (cancelled) return

        // Clear before the next quote types in.
        await terminal.clear()
        if (cancelled) return
        await sleep(420 + Math.random() * 380)
      }
    }

    void showOne()
    return () => {
      cancelled = true
      // Clear the screen on unmount so the welcome stanza arrives clean.
      void terminal.clear()
    }
  }, [terminal])

  return null
}
