import React from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Languages, ChevronDown } from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function LanguageSwitcher() {
  const { t, i18n } = useTranslation('common')
  const { setLanguage, applyLanguageStyles } = useThemeStore()

  const languages = [
    { code: 'en', name: 'English', nativeName: 'English' },
    { code: 'bn', name: 'Bangla', nativeName: 'বাংলা' },
    { code: 'hi', name: 'Hindi', nativeName: 'हिंदी' },
    { code: 'ur', name: 'Urdu', nativeName: 'اردو' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية' }
  ]

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0] // Default to English

  const changeLanguage = (langCode: string) => {
    i18n.changeLanguage(langCode)
    setLanguage(langCode)
    applyLanguageStyles(langCode)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2"
        >
          <Languages className="h-4 w-4" />
          <span className="hidden sm:inline">
            {currentLanguage.nativeName}
          </span>
          <ChevronDown className="h-3 w-3" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {languages.map((language) => (
          <DropdownMenuItem
            key={language.code}
            onClick={() => changeLanguage(language.code)}
            className={`cursor-pointer ${
              i18n.language === language.code ? 'bg-accent' : ''
            }`}
          >
            <div className="flex flex-col">
              <span className="font-medium">{language.nativeName}</span>
              <span className="text-xs text-muted-foreground">{language.name}</span>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}