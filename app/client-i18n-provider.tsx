"use client"

import type React from "react"

import { useEffect } from "react"
import "../app/i18n"

export function ClientI18nProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Initialize i18n on client side only
    import("../app/i18n")
  }, [])

  return <>{children}</>
}
