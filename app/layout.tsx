import type React from "react"
import type { Metadata, Viewport } from "next"
import { withBase } from "@/lib/base-path"
import "./globals.css"

export const metadata: Metadata = {
  title: "—",
  description: "",
  robots: { index: false, follow: false },
  icons: {
    icon: [{ url: withBase("/favicon.png"), type: "image/png", sizes: "1x1" }],
  },
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
