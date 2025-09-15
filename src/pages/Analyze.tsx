import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUpload } from '@/components/FileUpload'
import { URLAnalysis } from '@/components/URLAnalysis'
import { AnalysisProgress } from '@/components/AnalysisProgress'
import { ForensicReport } from '@/components/ForensicReport'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/lib/notifications'
import { FileImage, Video, Music, MessageSquare, Link as LinkIcon, FileText } from 'lucide-react'
import { fileToBase64, calculateFileHash } from '@/utils/fileUtils'

export function Analyze() {
  const { t } = useTranslation('common')
  const { user, profile } = useAuthStore()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [analysisSteps, setAnalysisSteps] = useState<any[]>([])
  
  const handleFileUpload = async (file: File) => {
    console.log('File upload started:', file.name)
    setSelectedFile(file)
    setIsAnalyzing(true)
    
    // Check user limits
    if (profile && profile.plan === 'free' && profile.analysis_count >= 5) {
      NotificationService.error(
        'Daily analysis limit reached. Please upgrade to continue.',
        { title: 'Analysis Limit Reached' }
      )
      setIsAnalyzing(false)
      return
    }
    
    setAnalysisSteps([
      { name: 'Upload', status: 'completed' },
      { name: 'File Processing', status: 'current' },
      { name: 'Forensic Analysis', status: 'pending' },
      { name: 'Report Generation', status: 'pending' }
    ])
    
    try {
      // Determine input type
      let inputType: 'image' | 'audio' | 'video' | 'screenshot' = 'image'
      if (file.type.startsWith('video/')) inputType = 'video'
      else if (file.type.startsWith('audio/')) inputType = 'audio'
      else if (file.name.toLowerCase().includes('screenshot') || file.name.toLowerCase().includes('chat')) {
        inputType = 'screenshot'
      }
      
      // Convert file to base64 with timeout
      const base64Data = await Promise.race([
        fileToBase64(file),
        new Promise((_, reject) => setTimeout(() => reject(new Error('File processing timeout')), 30000))
      ]) as string
      
      // Calculate file hash with timeout
      const fileHash = await Promise.race([
        calculateFileHash(file),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Hash calculation timeout')), 10000))
      ]) as string
      
      // Update progress
      setAnalysisSteps(prev => prev.map(step => 
        step.name === 'File Processing' ? { ...step, status: 'completed' } :
        step.name === 'Forensic Analysis' ? { ...step, status: 'current' } : step
      ))
      
      // Call analysis API with proper error handling
      const isPremium = profile?.plan === 'pro' || profile?.plan === 'enterprise'
      const { data: { session } } = await supabase.auth.getSession()
      
      const requestPayload = {
        inputType,
        base64Data,
        fileName: file.name,
        fileHash,
        language: 'en',
        options: {
          premium: isPremium,
          algorithms: ['all'],
          sensitivity: isPremium ? 'high' : 'medium'
        }
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(30000)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }))
        throw new Error(errorData.error || `Analysis failed with status ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed')
      }
      
      // Update progress
      setAnalysisSteps(prev => prev.map(step => 
        step.name === 'Forensic Analysis' ? { ...step, status: 'completed' } :
        step.name === 'Report Generation' ? { ...step, status: 'current' } : step
      ))
      
      // Generate report
      const report = {
        id: result.report_id || `analysis_${Date.now()}`,
        input_type: inputType,
        source_url: null,
        detection_summary: result.detection_summary,
        factcheck_summary: null,
        confidence: result.detection_summary.overall_confidence,
        processing_time: result.processing_time,
        file_name: file.name,
        file_size: file.size,
        created_at: new Date().toISOString(),
        language: 'en',
        user_plan: result.user_plan,
        algorithms_used: result.algorithms_used || []
      }
      
      // Final progress update
      setAnalysisSteps(prev => prev.map(step => ({ ...step, status: 'completed' })))
      
      setAnalysisResults(report)
      setIsAnalyzing(false)
      
      NotificationService.success(
        `Analysis completed with ${report.detection_summary.overall_confidence}% confidence`,
        { title: 'Analysis Complete' }
      )
      
    } catch (error) {
      console.error('Analysis failed:', error)
      
      setAnalysisSteps(prev => prev.map(step => 
        step.status === 'current' ? { ...step, status: 'error' } : step
      ))
      setIsAnalyzing(false)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      NotificationService.error(errorMessage, { title: 'Analysis Failed' })
    }
  }

  const handleUrlAnalysis = async (url: string) => {
    console.log('URL analysis started:', url)
    setSelectedUrl(url)
    setIsAnalyzing(true)
    
    // Check user limits
    if (profile && profile.plan === 'free' && profile.analysis_count >= 5) {
      NotificationService.error(
        'Daily analysis limit reached. Please upgrade to continue.',
        { title: 'Analysis Limit Reached' }
      )
      setIsAnalyzing(false)
      return
    }
    
    setAnalysisSteps([
      { name: 'URL Validation', status: 'completed' },
      { name: 'Content Fetching', status: 'current' },
      { name: 'Source Analysis', status: 'pending' },
      { name: 'Report Generation', status: 'pending' }
    ])
    
    try {
      // Update progress
      setAnalysisSteps(prev => prev.map(step => 
        step.name === 'Content Fetching' ? { ...step, status: 'completed' } :
        step.name === 'Source Analysis' ? { ...step, status: 'current' } : step
      ))
      
      const isPremium = profile?.plan === 'pro' || profile?.plan === 'enterprise'
      const { data: { session } } = await supabase.auth.getSession()
      
      const requestPayload = {
        inputType: 'url',
        sourceUrl: url,
        language: 'en',
        options: {
          premium: isPremium,
          algorithms: ['domain_reputation', 'content_analysis'],
          sensitivity: isPremium ? 'high' : 'medium'
        }
      }
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/analyze-content`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload),
        signal: AbortSignal.timeout(30000)
      })
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown server error' }))
        throw new Error(errorData.error || `URL analysis failed with status ${response.status}`)
      }
      
      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'URL analysis failed')
      }
      
      // Update progress
      setAnalysisSteps(prev => prev.map(step => 
        step.name === 'Source Analysis' ? { ...step, status: 'completed' } :
        step.name === 'Report Generation' ? { ...step, status: 'current' } : step
      ))
      
      const report = {
        id: result.report_id || `url_analysis_${Date.now()}`,
        input_type: 'url',
        source_url: url,
        detection_summary: result.detection_summary,
        factcheck_summary: null,
        confidence: result.detection_summary.overall_confidence,
        processing_time: result.processing_time,
        created_at: new Date().toISOString(),
        language: 'en',
        user_plan: result.user_plan,
        algorithms_used: result.algorithms_used || []
      }
      
      setAnalysisSteps(prev => prev.map(step => ({ ...step, status: 'completed' })))
      setAnalysisResults(report)
      setIsAnalyzing(false)
      
      NotificationService.success(
        `URL analysis completed with ${report.detection_summary.overall_confidence}% confidence`,
        { title: 'URL Analysis Complete' }
      )
      
    } catch (error) {
      console.error('URL analysis failed:', error)
      
      setAnalysisSteps(prev => prev.map(step => 
        step.status === 'current' ? { ...step, status: 'error' } : step
      ))
      setIsAnalyzing(false)
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      NotificationService.error(errorMessage, { title: 'URL Analysis Failed' })
    }
  }

  const handlePreviewFetch = async (url: string) => {
    try {
      const domain = new URL(url).hostname
      
      // Simulate preview data
      await new Promise(resolve => setTimeout(resolve, 500))
      
      return {
        title: `Content from ${domain}`,
        description: 'Web page content preview...',
        image: 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=400',
        domain,
        publishedAt: new Date().toISOString()
      }
    } catch (error) {
      console.error('Preview fetch failed:', error)
      return null
    }
  }

  if (analysisResults) {
    return (
      <div className="container mx-auto py-8 px-4">
        <ForensicReport 
          report={analysisResults}
          onStartNew={() => {
            setAnalysisResults(null)
            setSelectedFile(null)
            setSelectedUrl(null)
            setIsAnalyzing(false)
            setAnalysisSteps([])
          }}
        />
      </div>
    )
  }

  if (isAnalyzing) {
    return (
      <div className="container mx-auto py-8 px-4">
        <AnalysisProgress 
          fileName={selectedFile?.name || selectedUrl || 'Content'}
          steps={analysisSteps}
          onCancel={() => {
            setIsAnalyzing(false)
            setAnalysisSteps([])
          }}
        />
      </div>
    )
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Analyze Content</h1>
        <p className="text-muted-foreground">
          Upload or provide digital content for comprehensive forensic analysis
        </p>
      </div>

      <Tabs defaultValue="image" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="image" className="flex items-center gap-2">
            <FileImage className="h-4 w-4" />
            <span className="hidden sm:inline">Image</span>
          </TabsTrigger>
          <TabsTrigger value="video" className="flex items-center gap-2">
            <Video className="h-4 w-4" />
            <span className="hidden sm:inline">Video</span>
          </TabsTrigger>
          <TabsTrigger value="audio" className="flex items-center gap-2">
            <Music className="h-4 w-4" />
            <span className="hidden sm:inline">Audio</span>
          </TabsTrigger>
          <TabsTrigger value="url" className="flex items-center gap-2">
            <LinkIcon className="h-4 w-4" />
            <span className="hidden sm:inline">URL</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="image" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileImage className="h-5 w-5" />
                Image Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleFileUpload}
                accept={{
                  'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
                }}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium mb-2">Analysis includes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Digital manipulation detection</li>
                  <li>EXIF metadata analysis</li>
                  <li>Compression artifacts examination</li>
                  <li>Noise pattern analysis</li>
                  {(profile?.plan === 'pro' || profile?.plan === 'enterprise') && (
                    <>
                      <li>AI-generated content detection</li>
                      <li>Advanced geometric analysis</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="video" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Video className="h-5 w-5" />
                Video Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleFileUpload}
                accept={{
                  'video/*': ['.mp4', '.webm', '.mov', '.avi']
                }}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium mb-2">Analysis includes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Temporal consistency analysis</li>
                  <li>Motion vector examination</li>
                  <li>Compression artifact detection</li>
                  <li>Audio-visual synchronization</li>
                  {(profile?.plan === 'pro' || profile?.plan === 'enterprise') && (
                    <>
                      <li>Advanced deepfake detection</li>
                      <li>Color and lighting consistency</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="audio" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Music className="h-5 w-5" />
                Audio Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={handleFileUpload}
                accept={{
                  'audio/*': ['.mp3', '.wav', '.m4a', '.ogg']
                }}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium mb-2">Analysis includes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Spectral analysis</li>
                  <li>Temporal consistency verification</li>
                  <li>Amplitude and phase analysis</li>
                  <li>Compression artifact detection</li>
                  {(profile?.plan === 'pro' || profile?.plan === 'enterprise') && (
                    <>
                      <li>Voice cloning detection</li>
                      <li>Harmonic analysis</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="url" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LinkIcon className="h-5 w-5" />
                URL Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <URLAnalysis 
                onAnalyze={handleUrlAnalysis} 
                onPreviewFetch={handlePreviewFetch}
              />
              <div className="mt-4 text-sm text-muted-foreground">
                <p className="font-medium mb-2">Analysis includes:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Domain reputation assessment</li>
                  <li>SSL certificate verification</li>
                  <li>Content credibility analysis</li>
                  <li>Source authority evaluation</li>
                  {(profile?.plan === 'pro' || profile?.plan === 'enterprise') && (
                    <>
                      <li>Historical domain analysis</li>
                      <li>Cross-reference validation</li>
                    </>
                  )}
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Usage Information */}
      {profile && (
        <div className="mt-8 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Usage</p>
              <p className="text-sm text-muted-foreground">
                {profile.analysis_count} / {
                  profile.plan === 'free' ? '5' :
                  profile.plan === 'pro' ? '200' : '∞'
                } analyses used today
              </p>
            </div>
            <div className="text-right">
              <p className="font-medium">{profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} Plan</p>
              {profile.plan === 'free' && (
                <a href="/pricing" className="text-sm text-primary hover:underline">
                  Upgrade for more features →
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}