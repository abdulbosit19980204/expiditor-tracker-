"use client"

import { useEffect, useState } from "react"
import { I18nextProvider } from "react-i18next"
import simpleI18n from "../lib/simple-i18n"

// Create a mock i18next-compatible object
const mockI18n = {
  ...simpleI18n,
  // Add any missing methods that components might expect
  on: () => () => {}, // Mock event listener
  off: () => {}, // Mock event remover
  emit: () => {}, // Mock event emitter
}

export function ClientI18nProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(true) // Simple i18n is always ready

  useEffect(() => {
    console.log("[ClientI18n] Using simple i18n implementation")
    setIsInitialized(true)
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
    <I18nextProvider i18n={mockI18n}>
      {children}
    </I18nextProvider>
  )
}
