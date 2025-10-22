import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Do not modify Next static asset responses – avoid interfering with chunk serving
  if (pathname.startsWith('/_next/static') || pathname.startsWith('/_next/image') || pathname === '/favicon.ico') {
    return NextResponse.next()
  }

  const response = NextResponse.next()

  // Force no caching for API responses
  if (pathname.startsWith("/api/")) {
    // API routes - no caching
    response.headers.set("Cache-Control", "no-store, must-revalidate")
  } else {
    // HTML/pages - no caching to prevent stale chunk references
    response.headers.set("Cache-Control", "no-store, must-revalidate, no-cache")
    response.headers.set("Pragma", "no-cache")
    response.headers.set("Expires", "0")
  }

  return response
}

export const config = {
  // Skip Next assets and favicon entirely
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}


