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
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-sm">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Shield className="h-7 w-7 text-primary animate-pulse-soft" />
            <span className="text-2xl font-bold text-foreground gradient-text animate-shimmer">{t('appName')}</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-1">
            {navigationItems.map((item) => {
              if (item.protected && !user) return null
              return (
                <Link
                  key={item.path}
                  to={item.path} /* className="text-sm font-medium transition-colors hover:text-primary px-3 py-2" */
                  className="relative text-sm font-medium px-3 py-2 group transition-all duration-300 ease-out hover:text-primary"
                >
                  {item.label}
                  <span className="absolute left-0 bottom-0 h-[2px] w-0 bg-primary transition-all duration-300 ease-out group-hover:w-full"></span>
                </Link>
              )
            })}
            {user && profile?.role === 'admin' && (
              <Link
                to="/admin"
                className="text-sm font-medium transition-colors hover:text-primary px-3 py-2"
                /* className="relative text-sm font-medium px-3 py-2 group transition-all duration-300 ease-out hover:text-primary" */
              >
                Admin
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
                  onClick={() => navigate('/dashboard')} /* className="px-4 py-2 text-sm" */
                >
                  {t('dashboard')}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                >
                  {t('logout')}
                </Button>
              </div>
            ) : (
              <div className="hidden md:flex items-center space-x-2">
                <Button
                  variant="ghost" /* className="px-4 py-2 text-sm" */
                  onClick={() => setShowAuthModal(true)} /* className="px-4 py-2 text-sm" */
                >
                  {t('login')}
                </Button>
                <Button
                  onClick={() => setShowAuthModal(true)} /* className="px-4 py-2 text-sm" */
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
                    className="px-3 py-2 text-sm font-medium transition-colors hover:text-primary"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {t('dashboard')}
                  </Link>
                  {profile?.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="px-3 py-2 text-sm font-medium transition-colors hover:text-primary"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Admin
                    </Link>
                  )}
                  <Link
                    to="/settings"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-3 py-2 text-sm font-medium transition-colors hover:text-primary text-left"
                  >
                    {t('settings')}
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut()
                      setIsMenuOpen(false)
                    }}
                    className="px-3 py-2 text-sm font-medium transition-colors hover:text-primary text-left"
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
                  className="px-3 py-2 text-sm font-medium transition-colors hover:text-primary text-left"
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