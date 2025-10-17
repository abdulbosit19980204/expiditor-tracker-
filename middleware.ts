import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Force no caching for all assets to prevent chunk errors
  if (pathname.startsWith("/_next/")) {
    // All Next.js assets - no caching to prevent stale references
    response.headers.set("Cache-Control", "no-store, must-revalidate, no-cache")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
  } else if (pathname.startsWith("/api/")) {
    // API routes - no caching
    response.headers.set("Cache-Control", "no-store, must-revalidate")
  } else {
    // HTML pages - no caching to prevent stale chunk references
    response.headers.set("Cache-Control", "no-store, must-revalidate, no-cache")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
  }

  return response
}

export const config = {
  matcher: ["/:path*"],
}


