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
    initialize()
  }, [initialize])

  return (
    <ErrorBoundary>
      <Router>
        <div className="relative min-h-screen bg-background overflow-hidden">
          {/* Background gradient mesh */}
          <div className="absolute inset-0 z-0 bg-mesh opacity-30 animate-fade-in"></div>
          {/* Background dots pattern */}
          <div className="absolute inset-0 z-0 bg-dots opacity-10 animate-fade-in"></div>
          {/* Floating gradient orbs */}
          <div className="absolute top-1/4 left-1/4 w-48 h-48 bg-primary rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float floating-element" style={{ animationDelay: '0s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-secondary rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float floating-element" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-56 h-56 bg-accent rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-float floating-element" style={{ animationDelay: '4s' }}></div>

          <Header />
          <AppRoutes />
          <Footer />
          <Toaster />
        </div>
      </Router>
    </ErrorBoundary>
  )
}