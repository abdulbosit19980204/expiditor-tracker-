import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Set cache headers based on path type
  if (pathname.startsWith("/_next/static/")) {
    // Static assets should be cached for a long time
    response.headers.set("Cache-Control", "public, max-age=31536000, immutable")
  } else if (pathname.startsWith("/_next/") || pathname.startsWith("/api/")) {
    // Other Next.js assets and API routes - no caching
    response.headers.set("Cache-Control", "no-store, must-revalidate")
  } else {
    // HTML pages - no caching to prevent stale chunk references
    response.headers.set("Cache-Control", "no-store, must-revalidate")
  }

  return response
}

export const config = {
  matcher: ["/:path*"],
}


