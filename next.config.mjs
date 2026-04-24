/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const repo = 'retro-website-build'
const basePath = isProd ? `/${repo}` : ''

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  basePath,
  assetPrefix: isProd ? `/${repo}/` : '',
  trailingSlash: true,
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
}

export default nextConfig
