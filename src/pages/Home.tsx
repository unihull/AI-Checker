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
      <section className="relative py-40 px-4 bg-gradient-to-br from-primary/20 via-chart-1/15 to-chart-2/20 overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="absolute inset-0 bg-dots opacity-20" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-gradient-to-r from-primary/20 to-chart-1/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-gradient-to-r from-chart-2/20 to-chart-3/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 w-[300px] h-[300px] bg-gradient-to-r from-chart-4/15 to-chart-5/15 rounded-full blur-3xl animate-scale-pulse" style={{ animationDelay: '1s' }} />
        <div className="container mx-auto relative z-10">
          <div className="text-center max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <Shield className="h-24 w-24 text-primary animate-float drop-shadow-2xl filter brightness-110" />
                <div className="absolute inset-0 bg-gradient-to-r from-primary/40 to-chart-1/40 rounded-full blur-3xl animate-glow" />
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-xl animate-pulse-soft" />
              </div>
            </div>
            
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black mb-10 bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent leading-[0.9] tracking-tighter text-balance drop-shadow-2xl text-glow">
              {t('appName')}
            </h1>
            
            <p className="text-3xl md:text-4xl text-foreground/90 mb-10 font-bold leading-tight tracking-wide text-balance text-shimmer">
              {t('tagline')}
            </p>
            
            <p className="text-2xl text-muted-foreground/80 mb-16 max-w-4xl mx-auto leading-relaxed font-medium text-balance">
              Advanced AI-powered platform for forensic analysis and fact-checking of digital content. 
              Verify images, videos, audio, chat screenshots, URLs, and text claims with professional-grade accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-10 justify-center mb-24">
              <Button 
                size="lg" 
                className="text-2xl px-16 py-10 shadow-2xl hover:shadow-3xl transition-all duration-500 bg-gradient-to-r from-primary via-chart-1 to-chart-2 hover:from-chart-2 hover:via-chart-1 hover:to-primary transform hover:scale-110 hover:-translate-y-2 font-black rounded-2xl border-2 border-primary/20 hover:border-primary/40 animate-glow"
                onClick={() => navigate('/analyze')}
              >
                {t('verify')} Now
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
              
              <Button 
                size="lg" 
                variant="outline" 
                className="text-2xl px-16 py-10 shadow-xl hover:shadow-2xl transition-all duration-500 border-3 border-primary/30 hover:border-primary/60 hover:bg-gradient-to-r hover:from-primary/10 hover:to-chart-1/10 transform hover:scale-110 hover:-translate-y-2 font-black rounded-2xl backdrop-blur-xl glass"
                onClick={() => setShowAuthModal(true)}
              >
                {t('signup')} Free
              </Button>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center gap-10 mb-12">
              {trustIndicators.map((indicator, index) => (
                <div key={index} className="flex items-center space-x-3 text-base text-muted-foreground glass px-6 py-3 rounded-full hover:bg-primary/10 transition-all duration-400 interactive-scale group">
                  <CheckCircle className="h-6 w-6 text-green-500 drop-shadow-lg group-hover:text-green-400 transition-colors duration-300" />
                  <span className="font-semibold group-hover:text-foreground transition-colors duration-300">{indicator}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 px-4 bg-gradient-to-r from-muted/20 via-background to-muted/20 backdrop-blur-xl relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-chart-1/5 opacity-50" />
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-16 relative z-10">
            {stats.map((stat, index) => (
              <div key={index} className="text-center group cursor-pointer">
                <div className="relative mb-4">
                  <stat.icon className="h-16 w-16 text-primary mx-auto group-hover:scale-125 transition-all duration-500 drop-shadow-2xl filter brightness-110" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/30 to-chart-1/30 rounded-full blur-2xl group-hover:blur-3xl group-hover:from-primary/50 group-hover:to-chart-1/50 transition-all duration-500" />
                </div>
                <div className="text-5xl font-black mb-3 bg-gradient-to-r from-primary via-chart-1 to-chart-2 bg-clip-text text-transparent drop-shadow-lg group-hover:scale-105 transition-transform duration-300">{stat.value}</div>
                <div className="text-lg text-muted-foreground font-semibold group-hover:text-foreground transition-colors duration-300">{stat.label}</div>
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
      <section className="py-32 px-4 bg-gradient-to-br from-primary/20 via-chart-1/15 to-chart-2/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh opacity-60" />
        <div className="absolute inset-0 bg-dots opacity-40" />
        <div className="absolute top-0 left-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/20 to-chart-1/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2 animate-scale-pulse" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-gradient-to-l from-chart-2/20 to-chart-3/20 rounded-full blur-3xl animate-float" />
        <div className="container mx-auto text-center">
          <h2 className="text-5xl md:text-6xl font-black mb-10 bg-gradient-to-r from-foreground via-primary to-chart-1 bg-clip-text text-transparent drop-shadow-2xl text-glow relative z-10">
            Start Verifying Content Today
          </h2>
          <p className="text-3xl text-muted-foreground/80 mb-16 max-w-4xl mx-auto font-semibold leading-relaxed text-balance relative z-10">
            Join thousands of journalists, researchers, and fact-checkers who trust ProofLens 
            for reliable content verification.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-10 justify-center mb-16 relative z-10">
            <Button 
              size="lg" 
              className="text-2xl px-16 py-10 shadow-3xl hover:shadow-4xl transition-all duration-700 bg-gradient-to-r from-primary via-chart-1 to-chart-2 hover:from-chart-2 hover:via-chart-1 hover:to-primary transform hover:scale-115 hover:-translate-y-3 font-black rounded-2xl border-2 border-primary/30 hover:border-primary/60 animate-glow"
              onClick={() => navigate('/analyze')}
            >
              <Zap className="mr-4 h-7 w-7 group-hover:rotate-12 transition-transform duration-300" />
              Start Free Analysis
            </Button>
            
            <Button 
              size="lg" 
              variant="outline" 
              className="text-2xl px-16 py-10 shadow-2xl hover:shadow-3xl transition-all duration-700 border-3 border-primary/40 hover:border-primary/70 hover:bg-gradient-to-r hover:from-primary/15 hover:to-chart-1/15 transform hover:scale-115 hover:-translate-y-3 font-black rounded-2xl backdrop-blur-xl glass"
              onClick={() => navigate('/pricing')}
            >
              View Pricing Plans
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-10 text-lg text-muted-foreground relative z-10">
            <div className="flex items-center space-x-4 glass px-6 py-4 rounded-full hover:bg-primary/10 transition-all duration-400 interactive-scale group">
              <Lock className="h-6 w-6 text-green-500 drop-shadow-lg group-hover:text-green-400 transition-colors duration-300" />
              <span className="font-semibold group-hover:text-foreground transition-colors duration-300">Secure & Private</span>
            </div>
            <div className="flex items-center space-x-4 glass px-6 py-4 rounded-full hover:bg-primary/10 transition-all duration-400 interactive-scale group">
              <CheckCircle className="h-6 w-6 text-blue-500 drop-shadow-lg group-hover:text-blue-400 transition-colors duration-300" />
              <span className="font-semibold group-hover:text-foreground transition-colors duration-300">No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-4 glass px-6 py-4 rounded-full hover:bg-primary/10 transition-all duration-400 interactive-scale group">
              <Globe className="h-6 w-6 text-purple-500 drop-shadow-lg group-hover:text-purple-400 transition-colors duration-300" />
              <span className="font-semibold group-hover:text-foreground transition-colors duration-300">Available Worldwide</span>
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