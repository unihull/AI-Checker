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
        <div className="min-h-screen bg-background">
          <Header />
          <AppRoutes />
          <Footer />
          <Toaster />
        </div>
      </Router>
    </ErrorBoundary>
  )
}