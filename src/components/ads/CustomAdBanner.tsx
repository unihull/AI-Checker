import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { X, Zap, Crown, Star, ArrowRight } from 'lucide-react'

interface CustomAdBannerProps {
  placement: string
  className?: string
  dismissible?: boolean
}

interface AdPlacement {
  id: string
  placement_name: string
  placement_type: string
  ad_code: string
  ad_config: any
  target_plans: string[]
  active: boolean
}

export function CustomAdBanner({ placement, className = '', dismissible = false }: CustomAdBannerProps) {
  const { profile } = useAuthStore()
  const [adData, setAdData] = useState<AdPlacement | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (!profile || !profile.plan) return
    
    fetchAdPlacement()
  }, [profile, placement])

  const fetchAdPlacement = async () => {
    try {
      const { data } = await supabase
        .from('ad_placements')
        .select('*')
        .eq('placement_name', placement)
        .eq('active', true)
        .single()

      if (data && data.target_plans.includes(profile?.plan || 'free')) {
        setAdData(data)
      }
    } catch (error) {
      console.error('Failed to fetch ad placement:', error)
    }
  }

  if (!adData || dismissed || !profile || !adData.target_plans.includes(profile.plan)) {
    return null
  }

  if (adData.placement_type === 'google_ads') {
    // Return Google Ads component for Google ad placements
    return (
      <div className={`google-ads-placement ${className}`}>
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={adData.ad_config.client_id}
          data-ad-slot={adData.ad_code}
          data-ad-format="auto"
        />
      </div>
    )
  }

  if (adData.placement_type === 'custom_banner') {
    // Render enhanced custom banners
    return (
      <div className={`custom-ad-banner ${className}`}>
        {placement === 'upgrade_prompt' && (
          <UpgradePromptBanner 
            onDismiss={dismissible ? () => setDismissed(true) : undefined}
            config={adData.ad_config}
          />
        )}
        {placement === 'feature_highlight' && (
          <FeatureHighlightBanner 
            onDismiss={dismissible ? () => setDismissed(true) : undefined}
            config={adData.ad_config}
          />
        )}
        {placement === 'dashboard_banner' && (
          <DashboardBanner 
            onDismiss={dismissible ? () => setDismissed(true) : undefined}
            config={adData.ad_config}
          />
        )}
        {/* Fallback to raw HTML if no specific component */}
        {!['upgrade_prompt', 'feature_highlight', 'dashboard_banner'].includes(placement) && (
          <div 
            dangerouslySetInnerHTML={{ __html: adData.ad_code }}
            className="custom-html-ad"
          />
        )}
      </div>
    )
  }

  return null
}

interface BannerProps {
  onDismiss?: () => void
  config?: any
}

function UpgradePromptBanner({ onDismiss, config }: BannerProps) {
  return (
    <div className="relative p-6 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-full">
          <Crown className="h-8 w-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Unlock Premium Features
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Get unlimited analyses, advanced algorithms, and priority support with Pro plan.
          </p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Zap className="h-4 w-4 mr-2" />
          Upgrade Now
        </Button>
      </div>
    </div>
  )
}

function FeatureHighlightBanner({ onDismiss, config }: BannerProps) {
  return (
    <div className="relative p-6 bg-gradient-to-r from-green-50 to-teal-50 dark:from-green-950/20 dark:to-teal-950/20 rounded-lg border border-green-200 dark:border-green-800">
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <div className="flex items-center space-x-4">
        <div className="p-3 bg-green-100 dark:bg-green-900 rounded-full">
          <Star className="h-8 w-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            New AI-Powered Deepfake Detection
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Advanced neural network algorithms now detect sophisticated deepfakes with 98% accuracy.
          </p>
        </div>
        <Button variant="outline">
          Learn More
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}

function DashboardBanner({ onDismiss, config }: BannerProps) {
  return (
    <div className="relative p-4 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/20 dark:to-pink-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2"
          onClick={onDismiss}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
          🚀 Boost Your Fact-Checking Workflow
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
          Join 10,000+ professionals using ProofLens Pro for advanced verification features.
        </p>
        <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
          Start Free Trial
        </Button>
      </div>
    </div>
  )
}

// Hook for managing ad dismissal state
export function useAdDismissal(placementName: string) {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const dismissedAds = JSON.parse(localStorage.getItem('dismissed_ads') || '[]')
    setDismissed(dismissedAds.includes(placementName))
  }, [placementName])

  const dismissAd = () => {
    const dismissedAds = JSON.parse(localStorage.getItem('dismissed_ads') || '[]')
    if (!dismissedAds.includes(placementName)) {
      dismissedAds.push(placementName)
      localStorage.setItem('dismissed_ads', JSON.stringify(dismissedAds))
      setDismissed(true)
    }
  }

  return { dismissed, dismissAd }
}