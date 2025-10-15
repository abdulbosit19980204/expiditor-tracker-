"use client"

import { useTranslation } from "../lib/simple-i18n"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"
import { useUserPreferences } from "@/hooks/use-user-preferences"

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "uz", name: "O'zbek", flag: "🇺🇿" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
]

interface LanguageSwitcherProps {
  variant?: "select" | "button"
}

export function LanguageSwitcher({ variant = "select" }: LanguageSwitcherProps) {
  const { changeLanguage, language } = useTranslation()
  const { preferences, updateNestedPreference, isLoaded } = useUserPreferences()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Sync with user preferences when loaded
  useEffect(() => {
    if (isLoaded && preferences.language && preferences.language !== language) {
      changeLanguage(preferences.language)
    }
  }, [isLoaded, preferences.language, language, changeLanguage])

  const handleLanguageChange = (value: string) => {
    try {
      changeLanguage(value)
      // Update user preferences
      updateNestedPreference("language", value)
    } catch (error) {
      console.warn("[LanguageSwitcher] Language change failed:", error)
    }
  }

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Languages className="h-4 w-4 mr-2" />
        🇺🇸 EN
      </Button>
    )
  }

  if (variant === "button") {
    return (
      <Button variant="outline" size="sm">
        <Languages className="h-4 w-4 mr-2" />
        {currentLanguage.flag} {currentLanguage.name}
      </Button>
    )
  }

  return (
    <Select value={language} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[140px]">
        <Languages className="h-4 w-4 mr-2" />
        <SelectValue>
          <div className="flex items-center gap-2">
            <span>{currentLanguage.flag}</span>
            <span>{currentLanguage.name}</span>
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {languages.map((lang) => (
          <SelectItem key={lang.code} value={lang.code}>
            <div className="flex items-center gap-2">
              <span>{lang.flag}</span>
              <span>{lang.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
