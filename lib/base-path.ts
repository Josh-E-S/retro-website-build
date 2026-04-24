// Runtime helper that prefixes an app-absolute path (e.g. "/videos/x.mp4")
// with Next's basePath so it resolves correctly on GitHub Pages, where the
// site lives under /retro-website-build/. Next.js only auto-prefixes <Image>,
// <Link>, and router URLs — not raw <video>/<audio> src or fetch() paths.
export const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH ?? ''

export function withBase(path: string): string {
  if (!path.startsWith('/')) return path
  return `${BASE_PATH}${path}`
}
