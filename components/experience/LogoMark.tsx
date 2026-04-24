"use client"

import Image from "next/image"

/*
 * LogoMark — the Choice Industries mark as it appears inside the CRT.
 *
 * Renders with the same cyan/magenta print-registration offset as the
 * rest of the stage, so it reads as being *on* this terminal rather
 * than floating on top. Two variants:
 *
 *   "display" — large, centered, shown as the header stanza during boot.
 *   "mark"    — small, dim, used for the bottom-right recording watermark.
 */

type Variant = "display" | "mark"

type Props = {
  variant?: Variant
  className?: string
  style?: React.CSSProperties
}

export function LogoMark({ variant = "display", className, style }: Props) {
  const size = variant === "display" ? 360 : 56
  return (
    <Image
      src="/choice-industries-logo.png"
      alt="Choice Industries"
      width={size}
      height={size}
      priority={variant === "display"}
      className={className}
      style={{
        width: variant === "display" ? "min(52vw, 520px)" : "56px",
        height: "auto",
        filter:
          "drop-shadow(0.6px 0 0 rgba(200, 75, 143, 0.32)) drop-shadow(-0.6px 0 0 rgba(31, 182, 193, 0.3))",
        mixBlendMode: "multiply",
        ...style,
      }}
    />
  )
}
