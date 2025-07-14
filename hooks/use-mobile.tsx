"use client"

import { useEffect, useState } from "react"

/**
 * Returns true when the viewport width is ≤ 768 px.
 * Works in both mobile browsers and Telegram WebApps.
 */
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth <= breakpoint : false,
  )

  useEffect(() => {
    const media = window.matchMedia(`(max-width: ${breakpoint}px)`)

    const listener = (e: MediaQueryListEvent) => setIsMobile(e.matches)
    // Initial check
    setIsMobile(media.matches)

    // Listen for changes
    media.addEventListener("change", listener)
    return () => media.removeEventListener("change", listener)
  }, [breakpoint])

  return isMobile
}

/* ──────────────────────────────────────────────────────────
   Optional backward-compatibility export (prevents future
   “useMobile not found” errors if it’s referenced elsewhere)
─────────────────────────────────────────────────────────── */
export const useMobile = useIsMobile
