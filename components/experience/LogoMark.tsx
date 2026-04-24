"use client"

import Image from "next/image"

/*
 * LogoMark — the Choice Industries mark.
 *
 * Two orthogonal axes:
 *
 *   variant — "display" | "mark"
 *     "display": big, centered, used as hero header / welcome beat.
 *     "mark":    small, dim, used for watermarks.
 *
 *   palette — "ink" | "amber"
 *     "ink":   dark ink-on-cream (choice-industries-logo.png). Used inside
 *              the CRT / post-unlock experience on the cream paper stage.
 *              Rendered with mix-blend-mode: multiply + cyan/magenta
 *              print-registration ghost so it reads as "printed on this
 *              terminal."
 *     "amber": amber-on-black (logo-Amber.png). Used on the Wakeup screen
 *              where the surface is pure black. No multiply blend (would
 *              kill the amber on black); a soft amber glow instead so the
 *              mark carries the same warning-light tone as the rest of
 *              the Wakeup UI.
 */

type Variant = "display" | "mark"
type Palette = "ink" | "amber"

type Props = {
  variant?: Variant
  palette?: Palette
  className?: string
  style?: React.CSSProperties
}

export function LogoMark({ variant = "display", palette = "ink", className, style }: Props) {
  const size = variant === "display" ? 360 : 56
  const src = palette === "amber" ? "/logo-Amber.png" : "/choice-industries-logo.png"

  // Palette-specific treatments.
  //   ink:   print-registration ghost + multiply blend against cream paper.
  //   amber: warm drop-shadow glow against black; no blend mode.
  const baseStyle: React.CSSProperties = palette === "amber"
    ? {
        width: variant === "display" ? "min(52vw, 520px)" : "56px",
        height: "auto",
        filter:
          "drop-shadow(0 0 10px rgba(217, 178, 74, 0.35)) drop-shadow(0 0 2px rgba(217, 178, 74, 0.55))",
      }
    : {
        width: variant === "display" ? "min(52vw, 520px)" : "56px",
        height: "auto",
        filter:
          "drop-shadow(0.6px 0 0 rgba(200, 75, 143, 0.32)) drop-shadow(-0.6px 0 0 rgba(31, 182, 193, 0.3))",
        mixBlendMode: "multiply" as const,
      }

  return (
    <Image
      src={src}
      alt="Choice Industries"
      width={size}
      height={size}
      priority={variant === "display"}
      className={className}
      style={{ ...baseStyle, ...style }}
    />
  )
}
