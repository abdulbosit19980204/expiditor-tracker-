/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: false, // Enable ESLint checks
  },
  typescript: {
    ignoreBuildErrors: false, // Enable TypeScript checks
  },
  images: {
    unoptimized: true,
  },
  // Add error handling for better UX
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  },
}

export default nextConfig
