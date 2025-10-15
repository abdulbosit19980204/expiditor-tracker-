"use client"

import React from "react"
import { useTranslation } from "../lib/simple-i18n"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select"

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "uz", name: "O'zbek", flag: "🇺🇿" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
]

export function SimpleLanguageSwitcher() {
  const { t, changeLanguage, language } = useTranslation()

  const handleLanguageChange = (newLanguage: string) => {
    changeLanguage(newLanguage)
  }

  const currentLanguage = languages.find(lang => lang.code === language) || languages[0]

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 dark:text-gray-400">{t("language")}:</span>
      <Select value={language} onValueChange={handleLanguageChange}>
        <SelectTrigger className="w-[140px]">
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
    </div>
  )
}
