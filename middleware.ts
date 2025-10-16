import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Do not touch Next.js assets or API assets
  if (pathname.startsWith("/_next/") || pathname.startsWith("/api/")) {
    return NextResponse.next()
  }

  const response = NextResponse.next()
  // Prevent HTML/document caching to avoid stale chunk references
  response.headers.set("Cache-Control", "no-store, must-revalidate")
  return response
}

export const config = {
  matcher: ["/:path*"],
}


