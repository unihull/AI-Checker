import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import enCommon from '@/locales/en/common.json'
import bnCommon from '@/locales/bn/common.json'
import hiCommon from '@/locales/hi/common.json'
import urCommon from '@/locales/ur/common.json'
import arCommon from '@/locales/ar/common.json'

const resources = {
  en: {
    common: enCommon
  },
  bn: {
    common: bnCommon
  },
  hi: {
    common: hiCommon
  },
  ur: {
    common: urCommon
  },
  ar: {
    common: arCommon
  }
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'common',
    
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },
    
    interpolation: {
      escapeValue: false
    },
    
    react: {
      useSuspense: false
    }
  })

// Set up RTL support
i18n.on('languageChanged', (lng) => {
  const isRTL = lng === 'ar' || lng === 'ur'
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr')
  document.documentElement.setAttribute('lang', lng)
  
  // Apply language-specific fonts
  const fontFamilies = {
    'en': "'Inter', system-ui, sans-serif",
    'bn': "'Noto Sans Bengali', 'Inter', system-ui, sans-serif",
    'hi': "'Noto Sans Devanagari', 'Inter', system-ui, sans-serif",
    'ur': "'Noto Nastaliq Urdu', 'Noto Sans Arabic', 'Inter', system-ui, sans-serif",
    'ar': "'Noto Sans Arabic', 'Inter', system-ui, sans-serif"
  }
  
  document.body.style.fontFamily = fontFamilies[lng as keyof typeof fontFamilies] || fontFamilies.en
})

export default i18n