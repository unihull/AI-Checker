import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Zap } from 'lucide-react';
import { GoogleAds, GoogleAdSlots } from '@/components/ads/GoogleAds';
import { CustomAdBanner } from '@/components/ads/CustomAdBanner';

interface AdBannerProps {
  userPlan?: 'free' | 'pro' | 'enterprise';
  placement?: string;
  variant?: 'minimal' | 'standard' | 'premium';
}

export function AdBanner({ userPlan, placement = 'default_banner', variant = 'standard' }: AdBannerProps) {
  const { t } = useTranslation('common');

  if (userPlan && userPlan !== 'free') {
    return null; // Only show for free users
  }

  // Try custom ad placement first
  const customAd = <CustomAdBanner placement={placement} dismissible={true} />
  if (customAd) {
    return <div className="my-6">{customAd}</div>
  }

  // Fallback to Google Ads
  if (variant === 'minimal') {
    return (
      <div className="my-4">
        <GoogleAds 
          adSlot={GoogleAdSlots.BANNER}
          adFormat="banner"
          style={{ minHeight: '100px' }}
        />
      </div>
    )
  }

  // Standard upgrade prompt
  return (
    <div className="my-6">
      <GoogleAds 
        adSlot={GoogleAdSlots.BANNER}
        adFormat="auto"
        style={{ minHeight: '120px', marginBottom: '1rem' }}
      />
      
      <div className="p-6 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950/20 dark:to-orange-950/20 rounded-lg shadow-md border border-yellow-200 dark:border-yellow-800 text-center">
      <Zap className="h-8 w-8 text-orange-500 mx-auto mb-3" />
      <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Unlock Unlimited Features!
      </h3>
      <p className="text-muted-foreground mb-4">
        Enjoy more analyses, advanced algorithms, and priority support.
      </p>
      <Link to="/pricing">
        <Button className="bg-orange-500 hover:bg-orange-600 text-white">
          Upgrade to Pro Now
        </Button>
      </Link>
      </div>
    </div>
  );
}