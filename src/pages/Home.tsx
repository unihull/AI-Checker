import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PricingSection } from '@/components/PricingSection'
import { AuthModal } from '@/components/AuthModal'
import { 
  Shield, 
  Search, 
  FileImage, 
  Video, 
  Music, 
  Link as LinkIcon,
  MessageSquare,
  FileText,
  ArrowRight,
  CheckCircle,
  Globe,
  Zap,
  Lock,
  Users,
  TrendingUp
} from 'lucide-react'

export function Home() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const [showAuthModal, setShowAuthModal] = useState(false)

  const features = [
    {
      icon: FileImage,
      title: 'Image Analysis',
      description: 'Advanced forensics to detect manipulation, deepfakes, and synthetic content',
      color: 'text-blue-500'
    },
    {
      icon: Video,
      title: 'Video Verification',
      description: 'Frame-by-frame analysis, temporal consistency checks, and deepfake detection',
      color: 'text-red-500'
    },
    {
      icon: Music,
      title: 'Audio Forensics',
      description: 'Voice cloning detection, audio manipulation analysis, and authenticity verification',
      color: 'text-green-500'
    },
    {
      icon: MessageSquare,
      title: 'Chat Screenshots',
      description: 'Detect fabricated conversations, UI inconsistencies, and platform-specific markers',
      color: 'text-purple-500'
    },
    {
      icon: LinkIcon,
      title: 'URL Analysis',
      description: 'Website credibility assessment, content verification, and source validation',
      color: 'text-orange-500'
    },
    {
      icon: FileText,
      title: 'Fact Checking',
      description: 'AI-powered claim extraction, evidence retrieval, and verdict generation',
      color: 'text-teal-500'
    }
  ]

  const stats = [
    { value: '500K+', label: 'Analyses Completed', icon: TrendingUp },
    { value: '98%', label: 'Accuracy Rate', icon: CheckCircle },
    { value: '2', label: 'Languages Supported', icon: Globe },
    { value: '50+', label: 'Countries Served', icon: Users }
  ]

  const trustIndicators = [
    'IFCN Verified Partner',
    'ISO 27001 Certified',
    'GDPR Compliant',
    'SOC 2 Type II'
  ]

  return (
    <div className="min-h-screen">
      {/* Hero Section - Enhanced */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-950 overflow-hidden">
        <div className="container mx-auto">
            <div className="flex items-center justify-center mb-10">
              <Shield className="h-20 w-20 text-primary animate-scale-pulse" />
            </div>
            <h1 className="text-5xl sm:text-6xl md:text-8xl font-black mb-6 text-center leading-tight tracking-tight gradient-text animate-shimmer">
              {t('appName')}
            </h1>
            <p className="text-2xl md:text-3xl text-center text-muted-foreground mb-8 font-semibold leading-relaxed animate-fade-in">
              {t('tagline')}
            </p>
            
            <p className="text-lg md:text-xl text-center text-muted-foreground mb-12 max-w-4xl mx-auto leading-relaxed animate-fade-in" style={{ animationDelay: '0.2s' }}>
              Advanced AI-powered platform for forensic analysis and fact-checking of digital content. 
              Verify images, videos, audio, chat screenshots, URLs, and text claims with professional-grade accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Button 
                size="lg" 
                className="px-8 py-3"
                onClick={() => navigate('/analyze')} /* className="px-8 py-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" */
              >
                Verify Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button
                size="lg" 
                variant="outline" 
                className="px-8 py-3"
                onClick={() => setShowAuthModal(true)}
              >
                Sign Up Free
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>IFCN Verified Partner</span>
              </div>
              <div className="flex items-center space-x-2 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>ISO 27001 Certified</span>
              </div>
              <div className="flex items-center space-x-2 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-2 animate-fade-in" style={{ animationDelay: '0.7s' }}>
                <CheckCircle className="h-5 w-5 text-green-500" />
                <span>SOC 2 Type II</span>
              </div>
            </div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="py-20 px-4 bg-gradient-to-br from-background to-muted dark:from-gray-950 dark:to-gray-800">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="mb-3">
                  <stat.icon className="h-8 w-8 mx-auto text-primary mb-2" />
                </div>
                <div className="text-3xl font-bold mb-2 text-foreground">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-20 px-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-950">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground text-glow">
              Comprehensive Content Verification
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Our AI-powered platform analyzes every type of digital content to help you distinguish fact from fiction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="interactive-scale glass shadow-lg hover:shadow-2xl transition-all duration-300">
                <CardHeader>
                  <div className="mb-4">
                    <feature.icon className={`h-8 w-8 ${feature.color}`} />
                  </div>
                  <CardTitle className="text-xl mb-3 font-semibold">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Enhanced */}
      <section className="py-20 px-4 bg-gradient-to-br from-background to-muted dark:from-gray-950 dark:to-gray-800">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground text-glow">
              How ProofLens Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to verify any digital content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-lg animate-scale-pulse" style={{ animationDelay: '0s' }}>
                <span className="text-2xl font-bold text-white">1</span>
              </div>
              <h3 className="text-xl font-semibold">Upload or Input</h3>
              <p className="text-sm text-muted-foreground">
                Upload files, paste URLs, or enter text claims for analysis
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-lg animate-scale-pulse" style={{ animationDelay: '0.2s' }}>
                <span className="text-2xl font-bold text-white">2</span>
              </div>
              <h3 className="text-xl font-semibold">AI Analysis</h3>
              <p className="text-sm text-muted-foreground">
                Our advanced algorithms analyze content for authenticity and accuracy
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto shadow-lg animate-scale-pulse" style={{ animationDelay: '0.4s' }}>
                <span className="text-2xl font-bold text-white">3</span>
              </div>
              <h3 className="text-xl font-semibold">Get Results</h3>
              <p className="text-sm text-muted-foreground">
                Receive detailed reports with confidence scores and evidence citations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection /> {/* This component will be updated separately if needed */}

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary text-primary-foreground">
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Start Verifying Content Today
          </h2>
          <p className="text-xl text-primary-foreground/80 mb-8 max-w-3xl mx-auto">
            Join thousands of journalists, researchers, and fact-checkers who trust ProofLens 
            for reliable content verification.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-100 px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/analyze')}
            >
              <Zap className="mr-2 h-4 w-4" />
              Start Free Analysis
            </Button>
            
            <Button 
              size="lg" /* className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" */
              className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              onClick={() => navigate('/pricing')}
            >
              View Pricing Plans
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-primary-foreground/80">
            <div className="flex items-center space-x-2">
              <Lock className="h-4 w-4" />
              <span>Secure & Private</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4" />
              <span>Available Worldwide</span>
            </div>
          </div>
        </div>
      </section>

      <AuthModal 
        open={showAuthModal} 
        onOpenChange={setShowAuthModal}
      />
    </div>
  )
}