/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production'
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    if (isProd) {
      return [
        {
          source: '/_next/static/:path*',
          headers: [
            { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
          ],
        },
        {
          // Runtime critical chunk: webpack
          source: '/_next/static/chunks/webpack-:hash.js',
          headers: [
            { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          ],
        },
        {
          // Runtime critical chunk: main-app
          source: '/_next/static/chunks/main-app-:hash.js',
          headers: [
            { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          ],
        },
        {
          // Prevent caching of HTML/doc responses so clients always get the latest build
          source: '/:path*',
          headers: [
            { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          ],
        },
      ]
    }
    // In dev, completely disable caching to avoid stale chunks during restarts
    return [
      { source: '/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
    ]
  },
}

export default nextConfig
