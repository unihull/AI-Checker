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
      <section className="relative py-32 px-4 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-black/[0.02]" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse-soft" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse-soft" style={{ animationDelay: '1s' }} />
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Shield className="h-20 w-20 text-primary animate-float drop-shadow-2xl" />
                <div className="absolute inset-0 bg-primary/30 rounded-full blur-2xl animate-glow" />
              </div>
            </div>
            
            <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold mb-8 bg-gradient-to-r from-primary via-purple-600 to-blue-600 bg-clip-text text-transparent leading-[1.1] tracking-tight text-balance drop-shadow-sm">
              {t('appName')}
            </h1>
            
            <p className="text-2xl md:text-3xl text-foreground/80 mb-8 font-semibold leading-relaxed tracking-wide text-balance">
              {t('tagline')}
            </p>
            
            <p className="text-xl text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
              Advanced AI-powered platform for forensic analysis and fact-checking of digital content. 
              Verify images, videos, audio, chat screenshots, URLs, and text claims with professional-grade accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-8 justify-center mb-20">
              <Button 
                size="lg" 
                className="text-xl px-12 py-8 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary transform hover:scale-105 hover:-translate-y-1 font-semibold"
                onClick={() => navigate('/analyze')}
              >
                {t('verify')} Now
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-xl px-12 py-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transform hover:scale-105 hover:-translate-y-1 font-semibold backdrop-blur-sm"
                onClick={() => setShowAuthModal(true)}
              >
                {t('signup')} Free
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-8 mb-8">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center space-x-3 text-sm text-muted-foreground bg-white/50 dark:bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 hover:bg-white/70 dark:hover:bg-black/30 transition-all duration-300">
                  <CheckCircle className="h-5 w-5 text-green-500 drop-shadow-sm" />
                  <span className="font-medium">{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-gradient-to-r from-muted/30 via-background to-muted/30 backdrop-blur-sm">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group">
                <div className="relative mb-4">
                  <stat.icon className="h-12 w-12 text-primary mx-auto group-hover:scale-110 transition-transform duration-300 drop-shadow-lg" />
                  <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl group-hover:bg-primary/30 transition-colors duration-300" />
                </div>
                <div className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">{stat.value}</div>
                <div className="text-base text-muted-foreground font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              Comprehensive Content Verification
            </h2>
            <p className="text-2xl text-muted-foreground max-w-3xl mx-auto font-medium leading-relaxed">
              Our AI-powered platform analyzes every type of digital content to help you distinguish fact from fiction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-700 hover:scale-105 hover:bg-gradient-to-br hover:from-background hover:to-muted/30 border-2 border-transparent hover:border-primary/20 backdrop-blur-sm">
                <CardHeader className="pb-4">
                  <div className="relative mb-6">
                    <feature.icon className={`h-16 w-16 ${feature.color} group-hover:scale-125 transition-all duration-500 drop-shadow-lg`} />
                    <div className={`absolute inset-0 ${feature.color.replace('text-', 'bg-')}/20 rounded-full blur-xl group-hover:blur-2xl transition-all duration-500`} />
                  </div>
                  <CardTitle className="text-2xl mb-4 leading-tight font-bold group-hover:text-primary transition-colors duration-300">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="pt-0">
                  <CardDescription className="text-lg leading-relaxed font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 px-4 bg-gradient-to-r from-muted/20 via-primary/5 to-muted/20 relative">
        <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-black/[0.02]" />
        <div className="container mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
              How ProofLens Works
            </h2>
            <p className="text-2xl text-muted-foreground font-medium">
              Three simple steps to verify any digital content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center space-y-6 group">
              <div className="w-24 h-24 bg-gradient-to-br from-primary to-purple-600 rounded-full flex items-center justify-center mx-auto shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-125 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
                <span className="text-4xl font-bold text-white relative z-10 drop-shadow-lg">1</span>
              </div>
              <h3 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors duration-300">Upload or Input</h3>
              <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                Upload files, paste URLs, or enter text claims for analysis
              </p>
            </div>

            <div className="text-center space-y-6 group">
              <div className="w-24 h-24 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-125 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
                <span className="text-4xl font-bold text-white relative z-10 drop-shadow-lg">2</span>
              </div>
              <h3 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors duration-300">AI Analysis</h3>
              <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                Our advanced algorithms analyze content for authenticity and accuracy
              </p>
            </div>

            <div className="text-center space-y-6 group">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-2xl hover:shadow-3xl transition-all duration-500 hover:scale-125 relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent rounded-full" />
                <span className="text-4xl font-bold text-white relative z-10 drop-shadow-lg">3</span>
              </div>
              <h3 className="text-2xl font-bold leading-tight group-hover:text-primary transition-colors duration-300">Get Results</h3>
              <p className="text-lg text-muted-foreground leading-relaxed font-medium">
                Receive detailed reports with confidence scores and evidence citations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection />

      {/* CTA Section */}
      <section className="py-24 px-4 bg-gradient-to-br from-primary/10 via-purple-500/5 to-blue-500/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-white/[0.02] dark:bg-grid-black/[0.02]" />
        <div className="absolute top-0 left-1/2 w-96 h-96 bg-primary/10 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2" />
        <div className="container mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-foreground via-primary to-foreground bg-clip-text text-transparent">
            Start Verifying Content Today
          </h2>
          <p className="text-2xl text-muted-foreground mb-12 max-w-3xl mx-auto font-medium leading-relaxed">
            Join thousands of journalists, researchers, and fact-checkers who trust ProofLens 
            for reliable content verification.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-xl px-12 py-8 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-r from-primary to-purple-600 hover:from-purple-600 hover:to-primary transform hover:scale-105 hover:-translate-y-1 font-semibold"
              onClick={() => navigate('/analyze')}
            >
              <Zap className="mr-3 h-6 w-6" />
              Start Free Analysis
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="text-xl px-12 py-8 shadow-xl hover:shadow-2xl transition-all duration-500 border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5 transform hover:scale-105 hover:-translate-y-1 font-semibold backdrop-blur-sm"
              onClick={() => navigate('/pricing')}
            >
              View Pricing Plans
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-8 text-base text-muted-foreground">
            <div className="flex items-center space-x-3 bg-white/50 dark:bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
              <Lock className="h-5 w-5 text-green-500" />
              <span className="font-medium">Secure & Private</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/50 dark:bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              <span className="font-medium">No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-3 bg-white/50 dark:bg-black/20 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20">
              <Globe className="h-5 w-5 text-purple-500" />
              <span className="font-medium">Available Worldwide</span>
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