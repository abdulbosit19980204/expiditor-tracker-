"use client"

import { useTranslation } from "react-i18next"
import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

export function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [mounted, setMounted] = useState(false)
  const [currentLang, setCurrentLang] = useState("en")

  useEffect(() => {
    setMounted(true)
    if (i18n.isInitialized) {
      setCurrentLang(i18n.language || "en")
    }
  }, [i18n])

  const handleLanguageChange = (value: string) => {
    if (i18n.isInitialized) {
      i18n.changeLanguage(value)
      setCurrentLang(value)
    }
  }

  if (!mounted) {
    return (
      <Button variant="outline" size="sm" disabled>
        <Languages className="h-4 w-4 mr-2" />
        EN
      </Button>
    )
  }

  return (
    <Select value={currentLang} onValueChange={handleLanguageChange}>
      <SelectTrigger className="w-[120px]">
        <Languages className="h-4 w-4 mr-2" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="uz">O'zbek</SelectItem>
        <SelectItem value="ru">Русский</SelectItem>
      </SelectContent>
    </Select>
  )
}
