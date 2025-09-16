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
          {/* Dramatic background effects */}
          <div className="absolute inset-0 z-0 bg-mesh-vibrant opacity-80 animate-gradient-shift"></div>
          <div className="absolute inset-0 z-0 bg-dots-vibrant opacity-20 animate-dramatic-fade-in"></div>
          
          {/* Multiple floating gradient orbs for depth */}
          <div className="absolute top-1/4 left-1/4 w-80 h-80 bg-primary rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-dramatic-float floating-dramatic" style={{ animationDelay: '0s' }}></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-dramatic-float floating-dramatic" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 w-72 h-72 bg-accent rounded-full mix-blend-multiply filter blur-3xl opacity-70 animate-dramatic-float floating-dramatic" style={{ animationDelay: '4s' }}></div>
          <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-chart-4 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-dramatic-float floating-dramatic" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-1/3 right-1/3 w-88 h-88 bg-chart-5 rounded-full mix-blend-multiply filter blur-3xl opacity-60 animate-dramatic-float floating-dramatic" style={{ animationDelay: '3s' }}></div>
          
          <div className="relative z-10">
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
        </div>
      </Router>
    </ErrorBoundary>
  )
}