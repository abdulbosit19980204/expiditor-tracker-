/** @type {import('next').NextConfig} */
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
  env: {
    YANDEX_MAPS_API_KEY: process.env.YANDEX_MAPS_API_KEY || '60bf1ed7-7273-4bf6-af8a-bb77a1f0c129',
    NEXT_PUBLIC_YANDEX_MAPS_API_KEY: process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY || '60bf1ed7-7273-4bf6-af8a-bb77a1f0c129',
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api',
  },
}

export default nextConfig
