import React, { useEffect, useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'

interface GoogleAdsProps {
  adSlot: string
  adFormat?: 'auto' | 'rectangle' | 'banner' | 'leaderboard' | 'skyscraper'
  adLayout?: 'in-article' | 'fluid' | 'fixed'
  style?: React.CSSProperties
  className?: string
}

export function GoogleAds({ 
  adSlot, 
  adFormat = 'auto', 
  adLayout,
  style = {},
  className = '' 
}: GoogleAdsProps) {
  const { profile } = useAuthStore()
  const [adClient, setAdClient] = useState<string | null>(null)
  const [adsEnabled, setAdsEnabled] = useState(false)

  useEffect(() => {
    // Only show ads for free users
    if (profile?.plan !== 'free') {
      return
    }

    fetchAdSettings()
  }, [profile])

  const fetchAdSettings = async () => {
    try {
      // Check if ads are enabled
      const { data: adsEnabledSetting } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'enable_ads')
        .single()

      if (adsEnabledSetting?.setting_value?.value) {
        setAdsEnabled(true)

        // Get Google Ads client ID
        const { data: clientSetting } = await supabase
          .from('app_settings')
          .select('setting_value')
          .eq('setting_key', 'google_ads_client')
          .single()

        if (clientSetting?.setting_value?.value) {
          setAdClient(clientSetting.setting_value.value)
          loadGoogleAdsScript()
        }
      }
    } catch (error) {
      console.error('Failed to fetch ad settings:', error)
    }
  }

  const loadGoogleAdsScript = () => {
    // Check if AdSense script is already loaded
    if (document.querySelector('script[src*="adsbygoogle"]')) {
      return
    }

    // Load Google AdSense script
    const script = document.createElement('script')
    script.async = true
    script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js'
    script.crossOrigin = 'anonymous'
    document.head.appendChild(script)

    script.onload = () => {
      // Initialize ads after script loads
      setTimeout(() => {
        try {
          ;(window as any).adsbygoogle = (window as any).adsbygoogle || []
          ;(window as any).adsbygoogle.push({})
        } catch (error) {
          console.error('AdSense initialization failed:', error)
        }
      }, 100)
    }
  }

  // Don't render ads for non-free users or if ads are disabled
  if (!adsEnabled || !adClient || profile?.plan !== 'free') {
    return null
  }

  const adProps: any = {
    'data-ad-client': adClient,
    'data-ad-slot': adSlot,
    'data-ad-format': adFormat
  }

  if (adLayout) {
    adProps['data-ad-layout'] = adLayout
  }

  return (
    <div className={`google-ads-container ${className}`} style={style}>
      <ins
        className="adsbygoogle"
        style={{
          display: 'block',
          width: '100%',
          height: 'auto',
          ...style
        }}
        {...adProps}
      />
    </div>
  )
}

// Predefined ad slots for easy use
export const GoogleAdSlots = {
  BANNER: '1234567890',
  SIDEBAR: '1234567891', 
  FOOTER: '1234567892',
  IN_ARTICLE: '1234567893',
  MOBILE_BANNER: '1234567894'
}