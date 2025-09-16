import React, { useEffect } from 'react'
import { BrowserRouter as Router } from 'react-router-dom'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { AppRoutes } from '@/app/routes'
import { useThemeStore } from '@/stores/themeStore'
import { useAuthStore } from '@/stores/authStore'
import { Toaster } from '@/components/ui/toaster'
import '@/app/i18n'

export default function App() {
  const { theme } = useThemeStore()
  const { initialize } = useAuthStore()

  useEffect(() => {
    // Apply theme to document
    try {
      document.documentElement.classList.toggle('dark', theme === 'dark')
    } catch (error) {
      console.warn('Theme application failed:', error)
    }
  }, [theme])

  useEffect(() => {
    // Initialize auth state with error handling
    try {
      initialize()
    } catch (error) {
      console.error('Auth initialization failed:', error)
    }
  }, [initialize])

  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background text-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-black/[0.02]" />
          <div className="relative z-10">
          <Header />
          <main className="flex-1">
            <AppRoutes />
          </main>
          <Footer />
          <Toaster />
          </div>
        </div>
      </Router>
    </ErrorBoundary>
  )
}