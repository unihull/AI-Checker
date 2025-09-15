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
      {/* Hero Section */}
      <section className="relative py-24 px-4 bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="absolute inset-0 bg-grid-white/[0.02] bg-grid-black/[0.02]" />
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <Shield className="h-16 w-16 text-primary animate-float" />
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent leading-tight tracking-tight text-balance">
              {t('appName')}
            </h1>
            
            <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 font-medium leading-relaxed tracking-wide text-balance">
              {t('tagline')}
            </p>
            
            <p className="text-lg text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
              Advanced AI-powered platform for forensic analysis and fact-checking of digital content. 
              Verify images, videos, audio, chat screenshots, URLs, and text claims with professional-grade accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
              <Button 
                size="lg" 
                className="text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => navigate('/analyze')}
              >
                {t('verify')} Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-10 py-7 shadow-lg hover:shadow-xl transition-all duration-300"
                onClick={() => setShowAuthModal(true)}
              >
                {t('signup')} Free
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-6 mb-8">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 px-4 bg-muted/50">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <stat.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Comprehensive Content Verification
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Our AI-powered platform analyzes every type of digital content to help you distinguish fact from fiction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-xl transition-all duration-500 hover:scale-105 hover:bg-gradient-to-br hover:from-background hover:to-muted/30">
                <CardHeader>
                  <feature.icon className={`h-12 w-12 ${feature.color} mb-6 group-hover:scale-110 transition-transform duration-300`} />
                  <CardTitle className="text-xl mb-3 leading-tight">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              How ProofLens Works
            </h2>
            <p className="text-xl text-muted-foreground">
              Three simple steps to verify any digital content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                <span className="text-3xl font-bold text-primary">1</span>
              </div>
              <h3 className="text-xl font-semibold leading-tight">Upload or Input</h3>
              <p className="text-muted-foreground leading-relaxed">
                Upload files, paste URLs, or enter text claims for analysis
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                <span className="text-3xl font-bold text-primary">2</span>
              </div>
              <h3 className="text-xl font-semibold leading-tight">AI Analysis</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our advanced algorithms analyze content for authenticity and accuracy
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110">
                <span className="text-3xl font-bold text-primary">3</span>
              </div>
              <h3 className="text-xl font-semibold leading-tight">Get Results</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive detailed reports with confidence scores and evidence citations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-20 px-4 bg-primary/5">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Start Verifying Content Today
          </h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of journalists, researchers, and fact-checkers who trust ProofLens 
            for reliable content verification.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6"
              onClick={() => navigate('/analyze')}
            >
              <Zap className="mr-2 h-5 w-5" />
              Start Free Analysis
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6"
              onClick={() => navigate('/pricing')}
            >
              View Pricing Plans
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-6 mt-8 text-sm text-muted-foreground">
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