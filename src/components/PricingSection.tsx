import React from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Check, Star, Zap } from 'lucide-react'

interface PricingPlan {
  id: 'free' | 'pro' | 'enterprise'
  name: string
  price: string
  description: string
  features: string[]
  limitations?: string[]
  popular?: boolean
  cta: string
}

export function PricingSection() {
  const { t } = useTranslation('common')

  const plans: PricingPlan[] = [
    {
      id: 'free',
      name: t('freePlan'),
      price: '$0',
      description: 'Perfect for getting started with basic verification',
      features: [
        '5 analyses per day',
        'Basic detection algorithms',
        '10MB file size limit',
        '1 claim per analysis',
        'Standard support'
      ],
      limitations: [
        'Ad-supported',
        'Basic algorithms only',
        'No batch processing'
      ],
      cta: 'Get Started'
    },
    {
      id: 'pro',
      name: t('proPlan'),
      price: '$29',
      description: 'Advanced features for professionals and researchers',
      features: [
        '200 analyses per day',
        'Premium detection algorithms',
        '250MB file size limit',
        'Multiple claims per analysis',
        'URL analysis',
        'Batch processing',
        'PDF/JSON/CSV exports',
        'Shareable reports',
        'Blockchain verification hash',
        'Priority email support'
      ],
      popular: true,
      cta: t('upgradeNow')
    },
    {
      id: 'enterprise',
      name: t('enterprisePlan'),
      price: 'Custom',
      description: 'Comprehensive solution for organizations',
      features: [
        'Unlimited analyses',
        'Real-time API access',
        'Custom file size limits',
        'SSO/SAML integration',
        'Custom integrations',
        'White-label solution',
        'Private AI models',
        'Dedicated support manager',
        'SLA guarantee',
        'Custom training'
      ],
      cta: t('contactSales')
    }
  ]

  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">
            Choose Your Verification Plan
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            From individual fact-checkers to large organizations, we have the right plan for your verification needs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative ${plan.popular ? 'border-primary shadow-lg scale-105' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground px-3 py-1">
                    <Star className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <CardHeader className="text-center pb-2">
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <div className="text-4xl font-bold">
                  {plan.price}
                  {plan.id !== 'enterprise' && (
                    <span className="text-lg font-normal text-muted-foreground">/month</span>
                  )}
                </div>
                <CardDescription className="text-base">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3 text-green-700 dark:text-green-400">
                    ✓ What's Included:
                  </h4>
                  <ul className="space-y-2">
                    {plan.features.map((feature, index) => (
                      <li key={index} className="flex items-start space-x-2 text-sm">
                        <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {plan.limitations && (
                  <div>
                    <h4 className="font-semibold mb-3 text-orange-700 dark:text-orange-400">
                      ⚠ Limitations:
                    </h4>
                    <ul className="space-y-2">
                      {plan.limitations.map((limitation, index) => (
                        <li key={index} className="flex items-start space-x-2 text-sm text-muted-foreground">
                          <span className="mt-0.5">•</span>
                          <span>{limitation}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>

              <CardFooter>
                <Button 
                  className={`w-full ${plan.popular ? 'bg-primary' : ''}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  {plan.id === 'enterprise' && <Zap className="h-4 w-4 mr-2" />}
                  {plan.cta}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <p className="text-sm text-muted-foreground">
            All plans include a 14-day free trial. No credit card required for free plan.
          </p>
        </div>
      </div>
    </section>
  )
}