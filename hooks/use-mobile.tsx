"use client"

import { useEffect, useState } from "react"

/**
 * Small utility that returns `true` when the viewport width
 * is 640 px or smaller (Tailwind’s `sm` breakpoint).
 */
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 640)
    check() // initial
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  return isMobile
}

/* ▸ Back-compat alias (some files imported `useMobile`) */
export { useIsMobile as useMobile }
