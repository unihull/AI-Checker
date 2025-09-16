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
      <section className="relative py-32 px-4 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 dark:from-primary/10 dark:via-secondary/10 dark:to-accent/10 overflow-hidden">
        <div className="absolute inset-0 bg-grid-black/[0.1] animate-dramatic-fade-in"></div>
        <div className="container mx-auto">
            <div className="flex items-center justify-center mb-12">
              <Shield className="h-32 w-32 text-primary animate-dramatic-scale-pulse animate-intense-glow" />
            </div>
            <h1 className="text-6xl sm:text-7xl md:text-9xl font-black mb-8 text-center leading-tight tracking-tight gradient-text-vibrant animate-dramatic-shimmer text-glow-intense">
              {t('appName')}
            </h1>
            <p className="text-3xl md:text-4xl text-center text-muted-foreground mb-10 font-bold leading-relaxed animate-dramatic-fade-in text-shadow-glow">
              {t('tagline')}
            </p>
            
            <p className="text-xl md:text-2xl text-center text-muted-foreground mb-16 max-w-5xl mx-auto leading-relaxed animate-dramatic-fade-in font-medium" style={{ animationDelay: '0.3s' }}>
              Advanced AI-powered platform for forensic analysis and fact-checking of digital content. 
              Verify images, videos, audio, chat screenshots, URLs, and text claims with professional-grade accuracy.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-20">
              <Button 
                size="lg"
                className="px-12 py-4 text-xl font-bold btn-dramatic shadow-intense animate-rainbow-border"
                onClick={() => navigate('/analyze')} /* className="px-8 py-3 text-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" */
              >
                Verify Now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              
              <Button
                size="lg"
                variant="outline" 
                className="px-12 py-4 text-xl font-bold btn-dramatic border-3 border-primary/50 hover:border-primary shadow-intense"
                onClick={() => setShowAuthModal(true)}
              >
                Sign Up Free
              </Button>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-12 text-base text-muted-foreground">
              <div className="flex items-center space-x-3 animate-dramatic-fade-in glass-intense px-4 py-2 rounded-full" style={{ animationDelay: '0.5s' }}>
                <CheckCircle className="h-6 w-6 text-green-400 animate-intense-pulse" />
                <span className="font-semibold">IFCN Verified Partner</span>
              </div>
              <div className="flex items-center space-x-3 animate-dramatic-fade-in glass-intense px-4 py-2 rounded-full" style={{ animationDelay: '0.6s' }}>
                <CheckCircle className="h-6 w-6 text-green-400 animate-intense-pulse" />
                <span className="font-semibold">ISO 27001 Certified</span>
              </div>
              <div className="flex items-center space-x-3 animate-dramatic-fade-in glass-intense px-4 py-2 rounded-full" style={{ animationDelay: '0.7s' }}>
                <CheckCircle className="h-6 w-6 text-green-400 animate-intense-pulse" />
                <span className="font-semibold">GDPR Compliant</span>
              </div>
              <div className="flex items-center space-x-3 animate-dramatic-fade-in glass-intense px-4 py-2 rounded-full" style={{ animationDelay: '0.8s' }}>
                <CheckCircle className="h-6 w-6 text-green-400 animate-intense-pulse" />
                <span className="font-semibold">SOC 2 Type II</span>
              </div>
            </div>
        </div>
      </section>

      {/* Stats Section - Enhanced */}
      <section className="py-24 px-4 bg-gradient-to-br from-secondary/30 via-background to-accent/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots-vibrant opacity-10"></div>
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center interactive-dramatic glass-intense p-8 rounded-2xl border-glow">
                <div className="mb-6">
                  <stat.icon className="h-12 w-12 mx-auto text-primary mb-4 animate-intense-pulse" />
                </div>
                <div className="text-5xl font-black mb-4 gradient-text-vibrant animate-dramatic-shimmer">{stat.value}</div>
                <div className="text-lg font-semibold text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section - Enhanced */}
      <section className="py-28 px-4 bg-gradient-to-br from-primary/20 via-secondary/20 to-accent/20 relative overflow-hidden">
        <div className="absolute inset-0 bg-mesh-vibrant opacity-60"></div>
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-6xl md:text-7xl font-black mb-8 gradient-text-vibrant animate-dramatic-shimmer text-glow-intense">
              Comprehensive Content Verification
            </h2>
            <p className="text-2xl md:text-3xl text-muted-foreground max-w-4xl mx-auto font-semibold text-shadow-glow">
              Our AI-powered platform analyzes every type of digital content to help you distinguish fact from fiction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {features.map((feature, index) => (
              <Card key={index} className="card-dramatic-hover glass-intense shadow-dramatic border-glow animate-dramatic-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <CardHeader>
                  <div className="mb-6">
                    <feature.icon className={`h-12 w-12 ${feature.color} animate-intense-pulse`} />
                  </div>
                  <CardTitle className="text-2xl mb-4 font-black gradient-text-vibrant">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed text-muted-foreground font-medium">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Enhanced */}
      <section className="py-28 px-4 bg-gradient-to-br from-accent/30 via-background to-chart-4/30 relative overflow-hidden">
        <div className="absolute inset-0 bg-dots-vibrant opacity-15"></div>
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-6xl md:text-7xl font-black mb-8 gradient-text-vibrant animate-dramatic-shimmer text-glow-intense">
              How ProofLens Works
            </h2>
            <p className="text-2xl md:text-3xl text-muted-foreground font-semibold text-shadow-glow">
              Three simple steps to verify any digital content
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 max-w-6xl mx-auto">
            <div className="text-center space-y-4">
              <div className="w-32 h-32 bg-gradient-to-br from-primary to-secondary rounded-full flex items-center justify-center mx-auto shadow-intense animate-dramatic-scale-pulse border-glow" style={{ animationDelay: '0s' }}>
                <span className="text-4xl font-black text-white animate-intense-glow">1</span>
              </div>
              <h3 className="text-2xl font-black gradient-text-vibrant">Upload or Input</h3>
              <p className="text-base text-muted-foreground font-medium">
                Upload files, paste URLs, or enter text claims for analysis
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-32 h-32 bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mx-auto shadow-intense animate-dramatic-scale-pulse border-glow" style={{ animationDelay: '0.3s' }}>
                <span className="text-4xl font-black text-white animate-intense-glow">2</span>
              </div>
              <h3 className="text-2xl font-black gradient-text-vibrant">AI Analysis</h3>
              <p className="text-base text-muted-foreground font-medium">
                Our advanced algorithms analyze content for authenticity and accuracy
              </p>
            </div>

            <div className="text-center space-y-4">
              <div className="w-32 h-32 bg-gradient-to-br from-accent to-chart-4 rounded-full flex items-center justify-center mx-auto shadow-intense animate-dramatic-scale-pulse border-glow" style={{ animationDelay: '0.6s' }}>
                <span className="text-4xl font-black text-white animate-intense-glow">3</span>
              </div>
              <h3 className="text-2xl font-black gradient-text-vibrant">Get Results</h3>
              <p className="text-base text-muted-foreground font-medium">
                Receive detailed reports with confidence scores and evidence citations
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <PricingSection /> {/* This component will be updated separately if needed */}

      {/* CTA Section */}
      <section className="py-28 px-4 bg-gradient-to-br from-primary via-secondary to-accent text-primary-foreground relative overflow-hidden animate-gradient-shift">
        <div className="absolute inset-0 bg-grid-white/[0.1] animate-dramatic-fade-in"></div>
        <div className="container mx-auto text-center">
          <h2 className="text-6xl md:text-7xl font-black mb-10 text-glow-intense animate-dramatic-shimmer">
            Start Verifying Content Today
          </h2>
          <p className="text-2xl md:text-3xl text-primary-foreground/90 mb-12 max-w-4xl mx-auto font-semibold text-shadow-glow">
            Join thousands of journalists, researchers, and fact-checkers who trust ProofLens 
            for reliable content verification.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-8 justify-center mb-16">
            <Button 
              size="lg" 
              className="bg-white text-primary hover:bg-gray-100 px-12 py-4 text-xl font-bold btn-dramatic shadow-intense border-glow"
              onClick={() => navigate('/analyze')}
            >
              <Zap className="mr-3 h-6 w-6 animate-intense-pulse" />
              Start Free Analysis
            </Button>
            
            <Button 
              size="lg" /* className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-3 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300" */
              className="bg-transparent border-4 border-white text-white hover:bg-white hover:text-primary px-12 py-4 text-xl font-bold btn-dramatic shadow-intense"
              onClick={() => navigate('/pricing')}
            >
              View Pricing Plans
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-12 text-lg text-primary-foreground/90">
            <div className="flex items-center space-x-3 glass-intense px-6 py-3 rounded-full">
              <Lock className="h-6 w-6 animate-intense-pulse" />
              <span className="font-semibold">Secure & Private</span>
            </div>
            <div className="flex items-center space-x-3 glass-intense px-6 py-3 rounded-full">
              <CheckCircle className="h-6 w-6 animate-intense-pulse" />
              <span className="font-semibold">No Credit Card Required</span>
            </div>
            <div className="flex items-center space-x-3 glass-intense px-6 py-3 rounded-full">
              <Globe className="h-6 w-6 animate-intense-pulse" />
              <span className="font-semibold">Available Worldwide</span>
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