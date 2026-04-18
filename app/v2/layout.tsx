import type React from "react"
import type { Metadata } from "next"
import "./v2.css"

export const metadata: Metadata = {
  title: "SIGNAL V2 — Broadcast on a Dead Channel",
  description: "CRT transmission studies. An experimental v2 aesthetic.",
}

export default function V2Layout({ children }: { children: React.ReactNode }) {
  return <div className="v2-root">{children}</div>
}
