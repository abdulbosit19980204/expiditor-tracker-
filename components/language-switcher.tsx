"use client"

import { useLanguage } from "@/lib/language-context"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

const languages = [
  { code: 'uz', name: 'O\'zbek', flag: '🇺🇿' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'en', name: 'English', flag: '🇺🇸' }
] as const

interface LanguageSwitcherProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'outline' | 'ghost'
}

export function LanguageSwitcher({ 
  className, 
  size = 'sm', 
  variant = 'outline' 
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()

  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base'
  }

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {languages.map((lang) => (
        <Button
          key={lang.code}
          variant={language === lang.code ? 'default' : variant}
          size="sm"
          onClick={() => setLanguage(lang.code as any)}
          className={cn(
            sizeClasses[size],
            "p-1 min-w-0 aspect-square",
            language === lang.code 
              ? "bg-blue-600 hover:bg-blue-700 text-white" 
              : "hover:bg-gray-100"
          )}
          title={lang.name}
        >
          {lang.flag}
        </Button>
      ))}
    </div>
  )
}
