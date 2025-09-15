import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface ThemeState {
  theme: 'light' | 'dark'
  language: string
  toggleTheme: () => void
  setTheme: (theme: 'light' | 'dark') => void
  setLanguage: (language: string) => void
  applyLanguageStyles: (language: string) => void
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      theme: 'light',
      language: 'en',
      toggleTheme: () => set((state) => ({ 
        theme: state.theme === 'light' ? 'dark' : 'light' 
      })),
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => {
        set({ language })
      },
      applyLanguageStyles: (language) => {
        // Apply RTL and font changes for different languages
        if (language === 'ar' || language === 'ur') {
          document.documentElement.setAttribute('dir', 'rtl')
          document.documentElement.setAttribute('lang', language)
          document.documentElement.className = language === 'ur' ? 'font-urdu' : 'font-arabic'
        } else {
          document.documentElement.setAttribute('dir', 'ltr')
          document.documentElement.setAttribute('lang', language)
          if (language === 'bn') {
            document.documentElement.className = 'font-bengali'
          } else if (language === 'hi') {
            document.documentElement.className = 'font-devanagari'
          } else {
            document.documentElement.className = ''
          }
        }
        
        // Store language preference
        localStorage.setItem('preferred-language', language)
      }
    }),
    {
      name: 'theme-storage'
    }
  )
)