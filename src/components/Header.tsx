import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'
import { ThemeToggle } from '@/components/ThemeToggle'
import { AuthModal } from '@/components/AuthModal'
import { Shield, Menu, X } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'

export function Header() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const { user, signOut, profile } = useAuthStore()

  const handleSignOut = async () => {
    try {
      await signOut()
      navigate('/')
    } catch (error) {
      console.error('Sign out failed:', error)
    }
  }

  const navigationItems = [
    { path: '/', label: t('home') },
    { path: '/analyze', label: t('analyze') },
    { path: '/fact-check', label: t('factCheck') },
    { path: '/reports', label: t('reports'), protected: true },
    { path: '/pricing', label: t('pricing') }
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 shadow-2xl shadow-primary/10">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="relative">
              <Shield className="h-10 w-10 text-primary drop-shadow-2xl group-hover:scale-125 transition-all duration-500 animate-glow" />
              <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl group-hover:bg-primary/50 transition-all duration-500 animate-pulse-soft" />
            </div>
            <span className="text-2xl font-black bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent drop-shadow-lg">{t('appName')}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            {navigationItems.map((item) => {
              if (item.protected && !user) return null
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="text-base font-semibold transition-all duration-400 hover:text-primary relative group py-3 px-2"
                >
                  <span className="relative z-10">{item.label}</span>
                  <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-chart-1 scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left rounded-full shadow-lg shadow-primary/50" />
                </Link>
              )
            })}
            {user && profile?.role === 'admin' && (
              <Link
                to="/admin"
                className="text-base font-semibold transition-all duration-400 hover:text-primary relative group py-3 px-2"
              >
                <span className="relative z-10">Admin</span>
                <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary to-chart-1 scale-x-0 group-hover:scale-x-100 transition-transform duration-400 origin-left rounded-full shadow-lg shadow-primary/50" />
              </Link>
            )}
          </nav>

          {/* Right Side Controls */}
          <div className="flex items-center space-x-4">
            <LanguageSwitcher />
            <ThemeToggle />
            
            {user ? (
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => navigate('/dashboard')}
                  className="text-sm"
                >
                  {t('dashboard')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="text-sm"
                >
                  {t('logout')}
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost"
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm"
                >
                  {t('login')}
                </Button>
                <Button
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm"
                >
                  {t('verify')}
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <nav className="flex flex-col space-y-2">
              {navigationItems.map((item) => {
                if (item.protected && !user) return null
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="px-2 py-2 text-sm font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </Link>
                )
              })}
              
              {user ? (
                <>
                  <Link
                    to="/dashboard"
                    className="px-2 py-2 text-sm font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('dashboard')}
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-2 py-2 text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-2 py-2 text-sm font-medium transition-colors hover:text-primary text-left"
                  >
                    {t('settings')}
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="px-2 py-2 text-sm font-medium transition-colors hover:text-primary text-left"
                  >
                    {t('logout')}
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setShowAuthModal(true)
                    setIsMenuOpen(false)
                  }}
                  className="px-2 py-2 text-sm font-medium transition-colors hover:text-primary text-left"
                >
                  {t('login')}
                </button>
              )}
            </nav>
          </div>
        )}
      </div>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
      />
    </header>
  )
}