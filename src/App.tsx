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
        <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 text-foreground relative overflow-hidden">
          <div className="absolute inset-0 bg-mesh" />
          <div className="absolute inset-0 bg-dots opacity-30" />
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-chart-1/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '2s' }} />
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