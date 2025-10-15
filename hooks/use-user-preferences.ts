"use client"

import { useState, useEffect, useCallback } from "react"

export interface UserPreferences {
  // Language preference
  language: string
  
  // Date range preferences
  defaultDateRange: {
    type: "current_month" | "last_week" | "last_month" | "custom"
    customRange?: { from: Date; to: Date }
  }
  
  // Filter preferences
  defaultFilters: {
    project: string
    sklad: string
    city: string
    filial: string
    status: string
  }
  
  // Saved filter presets
  savedFilters: Array<{
    id: string
    name: string
    filters: {
      dateRange: { from: Date; to: Date }
      project: string
      sklad: string
      city: string
      filial: string
      status: string
    }
    createdAt: Date
  }>
  
  // UI preferences
  ui: {
    sidebarCollapsed: boolean
    panelsExpanded: {
      statistics: boolean
      expeditors: boolean
      checks: boolean
      map: boolean
    }
    theme: "light" | "dark" | "system"
  }
  
  // Column visibility preferences
  columnVisibility: {
    expeditors: string[]
    checks: string[]
    statistics: string[]
  }
}

const defaultPreferences: UserPreferences = {
  language: "en",
  defaultDateRange: {
    type: "current_month"
  },
  defaultFilters: {
    project: "",
    sklad: "",
    city: "",
    filial: "",
    status: ""
  },
  savedFilters: [],
  ui: {
    sidebarCollapsed: false,
    panelsExpanded: {
      statistics: true,
      expeditors: true,
      checks: true,
      map: true
    },
    theme: "system"
  },
  columnVisibility: {
    expeditors: ["name", "phone_number", "transport_number", "filial"],
    checks: ["check_id", "project", "city", "total_sum", "status"],
    statistics: ["totalChecks", "deliveredChecks", "successRate", "totalSum"]
  }
}

export function useUserPreferences() {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences)
  const [isLoaded, setIsLoaded] = useState(false)

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem("user-preferences")
      if (stored) {
        const parsed = JSON.parse(stored)
        // Merge with defaults to handle new fields
        const merged = {
          ...defaultPreferences,
          ...parsed,
          // Ensure nested objects are merged properly
          defaultFilters: { ...defaultPreferences.defaultFilters, ...parsed.defaultFilters },
          ui: { ...defaultPreferences.ui, ...parsed.ui },
          columnVisibility: { ...defaultPreferences.columnVisibility, ...parsed.columnVisibility }
        }
        setPreferences(merged)
      }
    } catch (error) {
      console.error("Error loading user preferences:", error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Sync language preference with i18n when preferences change
  useEffect(() => {
    if (isLoaded && typeof window !== "undefined" && preferences.language) {
      // Import simple-i18n dynamically to avoid SSR issues
      import("../lib/simple-i18n").then(({ default: simpleI18n }) => {
        const currentLang = simpleI18n.getLanguage()
        if (preferences.language !== currentLang) {
          console.log("[UserPreferences] Syncing language:", preferences.language, "current:", currentLang)
          simpleI18n.changeLanguage(preferences.language)
        }
      })
    }
  }, [preferences.language, isLoaded])

  // Save preferences to localStorage whenever they change
  const updatePreferences = useCallback((updates: Partial<UserPreferences>) => {
    setPreferences(prev => {
      const newPrefs = { ...prev, ...updates }
      
      // Save to localStorage
      try {
        localStorage.setItem("user-preferences", JSON.stringify(newPrefs))
      } catch (error) {
        console.error("Error saving user preferences:", error)
      }
      
      return newPrefs
    })
  }, [])

  // Update specific nested preferences
  const updateNestedPreference = useCallback(<K extends keyof UserPreferences>(
    key: K,
    updates: Partial<UserPreferences[K]>
  ) => {
    updatePreferences({
      [key]: { ...preferences[key], ...updates }
    } as Partial<UserPreferences>)
  }, [preferences, updatePreferences])

  // Add a new saved filter
  const addSavedFilter = useCallback((name: string, filters: UserPreferences["savedFilters"][0]["filters"]) => {
    const newFilter = {
      id: Date.now().toString(),
      name,
      filters,
      createdAt: new Date()
    }
    
    updateNestedPreference("savedFilters", [
      ...preferences.savedFilters,
      newFilter
    ])
    
    return newFilter.id
  }, [preferences.savedFilters, updateNestedPreference])

  // Remove a saved filter
  const removeSavedFilter = useCallback((id: string) => {
    updateNestedPreference("savedFilters", 
      preferences.savedFilters.filter(filter => filter.id !== id)
    )
  }, [preferences.savedFilters, updateNestedPreference])

  // Update a saved filter
  const updateSavedFilter = useCallback((id: string, updates: Partial<UserPreferences["savedFilters"][0]>) => {
    updateNestedPreference("savedFilters",
      preferences.savedFilters.map(filter => 
        filter.id === id ? { ...filter, ...updates } : filter
      )
    )
  }, [preferences.savedFilters, updateNestedPreference])

  // Clear all preferences and reset to defaults
  const resetPreferences = useCallback(() => {
    setPreferences(defaultPreferences)
    localStorage.removeItem("user-preferences")
  }, [])

  return {
    preferences,
    isLoaded,
    updatePreferences,
    updateNestedPreference,
    addSavedFilter,
    removeSavedFilter,
    updateSavedFilter,
    resetPreferences
  }
}
