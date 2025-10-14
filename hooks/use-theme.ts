"use client"

import { useEffect } from "react"
import { useTheme } from "next-themes"
import { useUserPreferences } from "./use-user-preferences"

export function useThemeWithPreferences() {
  const { theme, setTheme } = useTheme()
  const { preferences, updateNestedPreference, isLoaded } = useUserPreferences()

  // Sync theme with user preferences when preferences load
  useEffect(() => {
    if (isLoaded && preferences.ui.theme !== theme) {
      setTheme(preferences.ui.theme)
    }
  }, [isLoaded, preferences.ui.theme, theme, setTheme])

  // Update user preferences when theme changes
  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    updateNestedPreference("ui", { theme: newTheme as "light" | "dark" | "system" })
  }

  return {
    theme: theme || "system",
    setTheme: handleThemeChange,
    isLoaded
  }
}
