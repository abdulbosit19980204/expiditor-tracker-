"use client"

import { useEffect, useState } from "react"
import { I18nextProvider } from "react-i18next"
import i18n from "./i18n"

export function ClientI18nProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    try {
      if (i18n.isInitialized) {
        setIsInitialized(true)
      } else {
        i18n.on('initialized', () => {
          setIsInitialized(true)
        })
        
        // Fallback timeout to ensure initialization
        const timeout = setTimeout(() => {
          console.warn("[ClientI18n] Initialization timeout, forcing ready state")
          setIsInitialized(true)
        }, 5000)
        
        return () => clearTimeout(timeout)
      }
    } catch (error) {
      console.error("[ClientI18n] Initialization error:", error)
      setIsInitialized(true) // Force initialization to prevent infinite loading
    }
  }, [])

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading application...</p>
        </div>
      </div>
    )
  }

  return (
    <I18nextProvider i18n={i18n}>
      {children}
    </I18nextProvider>
  )
}
