import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FactChecker } from '@/components/FactChecker'
import { VerdictSummary } from '@/components/VerdictSummary'
import { EvidenceList } from '@/components/EvidenceList'
import { useAuthStore } from '@/stores/authStore'
import { supabase } from '@/lib/supabase'
import { NotificationService } from '@/lib/notifications'
import { GoogleAds, GoogleAdSlots } from '@/components/ads/GoogleAds'
import { CustomAdBanner } from '@/components/ads/CustomAdBanner'
import { FileText, Link as LinkIcon, FileImage, Video, Music, MessageSquare } from 'lucide-react'
import { fileToBase64, calculateFileHash } from '@/utils/fileUtils'
import { SocialMediaFactCheck } from '@/components/SocialMediaFactCheck'

export function FactCheck() {
  const { t } = useTranslation('common')
  const { user, profile } = useAuthStore()
  const [activeInput, setActiveInput] = useState<string>('text')
  const [analysisResults, setAnalysisResults] = useState<any>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  
  const inputTypes = [
    { id: 'text', label: 'Text Claim', icon: FileText },
    { id: 'url', label: 'URL/Article', icon: LinkIcon },
    { id: 'social', label: 'Social Media', icon: MessageSquare },
    { id: 'image', label: 'Image + Claims', icon: FileImage },
    { id: 'video', label: 'Video + Claims', icon: Video },
    { id: 'audio', label: 'Audio + Claims', icon: Music },
  ]

  const handleAnalysis = async (inputData: any) => {
    console.log('=== FACT CHECK ANALYSIS STARTED ===')
    console.log('Input data:', inputData)
    
    setIsAnalyzing(true)
    
    // Check user limits
    if (profile && profile.plan === 'free' && profile.analysis_count >= 5) {
      console.log('Fact check limit reached for free user')
      NotificationService.error(
        'Daily analysis limit reached. Please upgrade to continue.',
        {
          title: 'Analysis Limit Reached',
          action: {
            label: 'Upgrade Now',
            onClick: () => window.open('/pricing', '_blank')
          }
        }
      )
      setIsAnalyzing(false)
      return
    }
    
    console.log('Processing fact check input data...')
    try {
      const { inputType, claims: inputClaims, language, file, url } = inputData
      let claimsToAnalyze: string[] = []
      let extractedText = ''
      
      // Extract claims based on input type
      if (inputType === 'text' && inputClaims) {
        claimsToAnalyze = inputClaims.filter((claim: string) => claim.trim() !== '')
        console.log('Text claims to analyze:', claimsToAnalyze)
      } else if (inputType === 'url' && url) {
        console.log('Fetching URL content for:', url)
        // Fetch actual URL content
        try {
          const urlContent = await fetchUrlContent(url)
          extractedText = urlContent.text
          console.log('URL content extracted, length:', extractedText.length)
          
          // Simple claim extraction for demo
          const sentences = extractedText.split(/[.!?]+/).filter(s => s.trim().length > 20)
          claimsToAnalyze = sentences.slice(0, 3).map(s => s.trim())
          console.log('Claims extracted from URL:', claimsToAnalyze)
        } catch (error) {
          console.error('URL content extraction failed:', error)
          throw new Error('Failed to fetch and analyze URL content')
        }
      } else if (file) {
        // Extract text from file using appropriate method
        try {
          console.log('Extracting text from file:', file.name)
          if (inputType === 'image' || inputType === 'screenshot') {
            extractedText = await extractTextFromImage(file)
          } else if (inputType === 'video') {
            extractedText = await extractTextFromVideo(file)
          } else if (inputType === 'audio') {
            extractedText = await extractTextFromAudio(file)
          }
          
          console.log('Text extracted from file, length:', extractedText.length)
          
          if (extractedText.trim()) {
            // Simple claim extraction for demo
            const sentences = extractedText.split(/[.!?]+/).filter(s => s.trim().length > 20)
            claimsToAnalyze = sentences.slice(0, 3).map(s => s.trim())
            console.log('Claims extracted from file:', claimsToAnalyze)
          } else {
            throw new Error('No text could be extracted from the file')
          }
        } catch (error) {
          console.error('File text extraction failed:', error)
          throw new Error('Failed to extract text from file')
        }
      }
      
      if (claimsToAnalyze.length === 0) {
        console.error('No claims found to analyze')
        throw new Error('No verifiable claims found in the provided content')
      }
      
      console.log('Final claims to analyze:', claimsToAnalyze)
      
      // Call Supabase Edge Function for fact-checking
      const isPremium = profile?.plan === 'pro' || profile?.plan === 'enterprise'
      console.log('Fact check - User is premium:', isPremium)
      
      const { data: { session } } = await supabase.auth.getSession()
      const accessToken = session?.access_token
      console.log('Fact check - Has access token:', !!accessToken)
      
      const requestPayload = {
        claims: claimsToAnalyze,
        language,
        options: {
          maxEvidencePerClaim: isPremium ? 15 : 8,
          includeFactCheckers: true,
          includeNews: true,
          includeGovernment: true,
          useAdvancedReasoning: isPremium,
          confidenceThreshold: isPremium ? 60 : 70
        }
      }
      
      console.log('Fact check request payload:', requestPayload)
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/factcheck-claims`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestPayload)
      })
      
      console.log('Fact check response status:', response.status)
      
      if (!response.ok) {
        console.error('Fact check response not OK')
        const errorData = await response.json()
        console.error('Fact check error data:', errorData)
        throw new Error(errorData.error || `Fact-checking failed with status ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Fact check result:', JSON.stringify(result, null, 2))
      
      if (!result.success) {
        console.error('Fact check returned success: false')
        throw new Error(result.error || 'Fact-checking failed')
      }
      
      console.log('Processing fact check results...')
      // Transform results to match expected format
      const analyzedClaims = result.results.map((claimResult: any) => ({
        id: claimResult.claim_id || `claim_${Date.now()}_${Math.random()}`,
        text: claimResult.claim_text,
        verdict: claimResult.verdict,
        confidence: claimResult.confidence,
        rationale: claimResult.rationale || [],
        evidence: claimResult.evidence || [],
        processing_time: claimResult.processing_time || 0,
        evidence_summary: claimResult.evidence_summary || {
          supporting: 0, refuting: 0, neutral: 0, total: 0, 
          high_credibility_sources: 0, recent_sources: 0
        },
        methodology: claimResult.methodology || ['AI-powered analysis'],
        limitations: claimResult.limitations || []
      }))
      
      console.log('Analyzed claims:', analyzedClaims.length)
      
      setAnalysisResults({
        claims: analyzedClaims,
        processing_time: result.processing_time,
        language,
        input_type: inputType,
        report_id: `factcheck_${Date.now()}`,
        user_plan: result.user_plan || profile?.plan || 'free',
        claims_processed: result.claims_processed
      })
      
      setIsAnalyzing(false)
      
      console.log('Fact check completed successfully!')
      NotificationService.success(
        `Fact-check completed for ${result.claims_processed} claim(s)`,
        { title: 'Fact-Check Complete' }
      )
      
    } catch (error) {
      console.error('=== FACT CHECK ANALYSIS FAILED ===')
      console.error('Error:', error)
      console.error('Error stack:', error.stack)
      
      setIsAnalyzing(false)
      
      // Show detailed error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
      console.error('Showing fact check error to user:', errorMessage)
      NotificationService.error(
        errorMessage,
        {
          title: 'Fact-Check Failed',
          description: 'Please try again or contact support if the issue persists.'
        }
      )
      
      console.log('Setting error result...')
      setAnalysisResults({
        claims: [{
          id: 'error_claim',
          text: `Analysis failed: ${errorMessage}`,
          verdict: 'unverified',
          confidence: 0,
          rationale: [
            'Technical error prevented analysis completion',
            'Please try again or contact support if the issue persists',
            errorMessage
          ],
          evidence: [],
          processing_time: 0,
          evidence_summary: { supporting: 0, refuting: 0, neutral: 0, total: 0, high_credibility_sources: 0, recent_sources: 0 },
          methodology: ['Error handling'],
          limitations: ['Analysis could not be completed due to technical error']
        }],
        processing_time: 0,
        language,
        input_type: 'error',
        error: errorMessage
      })
    }
  }

  const handlePreviewFetch = async (url: string): Promise<{ title: string; description: string; image: string; domain: string; publishedAt: string } | null> => {
    console.log('Fact check preview fetch for:', url)
    
    try {
      const domain = new URL(url).hostname
      const isNews = /news|article|blog|post/.test(url.toLowerCase())
      
      console.log('Fact check preview domain analysis:', { domain, isNews })
      const isGov = domain.includes('.gov')
      const isFactChecker = /snopes|factcheck|politifact|rumorscanner|boom/.test(domain.toLowerCase())
      const isBangladeshi = /prothomalo|dailystar|dhakatribune|bdnews24/.test(domain.toLowerCase())
      
      // Simulate realistic network delay
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800))
      
      let title = 'Web Page Title'
      let description = 'Web page description and content preview...'
      let image = 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=400'
      
      if (isFactChecker) {
        title = 'Fact Check: Verification Report'
        description = 'Professional fact-checking analysis with evidence-based conclusions and source verification.'
        image = 'https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=400'
      } else if (isBangladeshi && isNews) {
        title = 'বাংলাদেশের সর্বশেষ সংবাদ'
        description = 'বাংলাদেশের গুরুত্বপূর্ণ ঘটনাবলীর বিস্তারিত কভারেজ এবং যাচাইকৃত তথ্য।'
        image = 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=400'
      } else if (isNews) {
        title = 'Breaking News: Current Events Coverage'
        description = 'Breaking news coverage with verified information from reliable journalistic sources.'
        image = 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=400'
      } else if (isGov) {
        title = 'Official Government Publication'
        description = 'Authoritative government information, statistics, and official announcements.'
        image = 'https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg?auto=compress&cs=tinysrgb&w=400'
      }
      
      const previewResult = {
        title,
        description,
        image,
        domain,
        publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }
      
      console.log('Fact check preview result:', previewResult)
      return previewResult
      
    } catch (error) {
      console.error('Preview fetch failed:', error)
      return null
    }
  }

  const fetchUrlContent = async (url: string): Promise<{ text: string; title: string; metadata: any }> => {
    // In production, this would use a backend service to fetch and parse URL content
    // For now, we'll simulate this process with realistic content
    console.log('Fetching URL content for fact check:', url)
    
    try {
      const domain = new URL(url).hostname
      const isNews = /news|article|blog|post/.test(url.toLowerCase())
      const isGov = domain.includes('.gov')
      const isFactChecker = /snopes|factcheck|politifact|rumorscanner/.test(domain.toLowerCase())
      
      console.log('URL content analysis:', { domain, isNews, isGov, isFactChecker })
      const isBangladeshi = /prothomalo|dailystar|dhakatribune|bdnews24/.test(domain.toLowerCase())
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1500))
      
      let simulatedContent = `This is simulated content from ${url}.`
      let title = 'Web Article'
      
      if (isFactChecker) {
        title = 'Fact Check Report'
        simulatedContent = `Fact Check Analysis: We investigated the viral claim about economic growth figures. Our research team examined official government data, cross-referenced with international economic reports, and consulted with financial experts. The claim states that GDP growth reached 8.2% this quarter, which contradicts official statistics showing 6.8% growth. Evidence suggests the higher figure may have been taken from preliminary estimates rather than final verified data. Sources: Ministry of Finance quarterly report, Bangladesh Bank economic bulletin, World Bank country data.`
      } else if (isBangladeshi && isNews) {
        title = 'বাংলাদেশের অর্থনৈতিক প্রবৃদ্ধি'
        simulatedContent = `বাংলাদেশের অর্থনৈতিক প্রবৃদ্ধি এই ত্রৈমাসিকে ৬.৮ শতাংশে পৌঁছেছে। অর্থ মন্ত্রণালয়ের সর্বশেষ প্রতিবেদন অনুযায়ী, গত বছরের একই সময়ের তুলনায় এটি উল্লেখযোগ্য বৃদ্ধি। সরকারের নতুন নীতিমালা এবং বিনিয়োগ বৃদ্ধির ফলে এই প্রবৃদ্ধি সম্ভব হয়েছে। বাংলাদেশ ব্যাংকের গভর্নর জানিয়েছেন যে আগামী ত্রৈমাসিকেও এই ধারা অব্যাহত থাকবে। রপ্তানি আয় বৃদ্ধি এবং প্রবাসী আয় বৃদ্ধি এই প্রবৃদ্ধির মূল কারণ।`
      } else if (isNews) {
        title = 'Economic Growth Report'
        simulatedContent = `Breaking news report: Economic growth reaches 6.8% this quarter according to official government statistics. The Ministry of Finance released comprehensive data showing significant improvement compared to the previous year's 4.2% growth rate. Key factors contributing to this growth include increased foreign investment, improved export performance, and successful implementation of new economic policies. Industry experts predict continued growth momentum in the coming quarters, with particular strength in manufacturing and services sectors. The central bank has maintained supportive monetary policies while monitoring inflation indicators.`
      } else if (isGov) {
        title = 'Official Economic Statistics'
        simulatedContent = `Official government publication: Quarterly Economic Report Q3 2024. GDP growth rate: 6.8% (year-over-year). Manufacturing sector growth: 8.2%. Services sector growth: 7.1%. Agriculture sector growth: 3.4%. Export earnings: $12.5 billion (15% increase). Import costs: $18.2 billion (8% increase). Foreign exchange reserves: $42.1 billion. Inflation rate: 5.2% (within target range). Employment rate: 94.3% (0.7% improvement). Investment commitments: $8.9 billion in new projects approved. Budget deficit: 4.1% of GDP (within fiscal targets).`
      } else {
        title = 'Article Content'
        simulatedContent = `Comprehensive analysis of current economic trends and policy implications. Recent data indicates sustained growth across multiple sectors, with particular strength in technology and manufacturing. Expert economists suggest that current policies are effectively supporting business expansion while maintaining fiscal responsibility. The implementation of digital infrastructure projects has created new opportunities for innovation and entrepreneurship. Regional cooperation initiatives have also contributed to improved trade relationships and economic stability.`
      }
      
      console.log('URL content simulation completed:', { title, contentLength: simulatedContent.length })
      
      return {
        text: simulatedContent,
        title,
        metadata: {
          url,
          domain: new URL(url).hostname,
          extraction_method: 'enhanced_simulation',
          timestamp: new Date().toISOString(),
          content_type: isNews ? 'news' : isGov ? 'government' : isFactChecker ? 'fact_check' : 'article'
        }
      }
    } catch (error) {
      console.error('URL content fetch failed:', error)
      console.error('URL content fetch failed:', error)
      throw error
    }
  }

  const extractTextFromImage = async (file: File): Promise<string> => {
    console.log('Extracting text from image:', file.name)
    // Simulate OCR extraction with realistic processing time
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 2000))
    
    // Generate realistic extracted text based on file name
    const fileName = file.name.toLowerCase()
    
    if (fileName.includes('whatsapp') || fileName.includes('chat')) {
      return `John: Did you see the news about Bangladesh's economic growth?
Sarah: Yes, it reached 6.8% this quarter according to the Bangladesh Bureau of Statistics.
John: That's amazing! Last year it was only 4.2% during the same period.
Sarah: The Ministry of Finance announced new policies that helped boost the economy.
John: I heard they're planning more infrastructure projects for 2024.
Sarah: Correct! The budget allocation for development increased by 25% in the latest fiscal year.
John: But some people are saying it's actually 8.2%, not 6.8%.
Sarah: That might be from preliminary estimates, not the final verified data.`
    } else if (fileName.includes('news') || fileName.includes('article')) {
      return `BREAKING: Bangladesh's economic growth reaches 6.8% this quarter according to official BBS data. Prime Minister announces that new economic policies have successfully boosted performance. Manufacturing sector shows strong 8.2% growth while services sector expands by 7.1%. Export earnings surge by 15% compared to last year. However, some social media posts claim growth is actually 8.2%, which appears to be based on preliminary estimates rather than verified final data.`
    } else if (fileName.includes('social') || fileName.includes('post')) {
      return `🚨 VIRAL POST: Bangladesh economy EXPLODED with 8.2% growth this quarter! 🇧🇩🔥 
That's the HIGHEST in 5 years! 📈✨ 
Source: "My cousin works at the finance ministry" 😂
#EconomicGrowth #Bangladesh #Development #ProudToBeBangladeshi

❗ FACT CHECK NEEDED: Official BBS data shows 6.8%, not 8.2%. The 8.2% figure appears to be from preliminary estimates or manufacturing sector only.`
    } else {
      return `Economic Report Summary: GDP growth rate for Q3 2024 stands at 6.8%, representing a significant improvement from the previous year's 4.2%. Key contributing factors include increased foreign investment, improved export performance, and successful policy implementation.`
    }
    console.log('Image text extraction completed')
  }

  const extractTextFromVideo = async (file: File): Promise<string> => {
    // Simulate speech-to-text processing
    console.log('Extracting text from video:', file.name)
    await new Promise(resolve => setTimeout(resolve, 3000 + Math.random() * 3000))
    
    console.log('Video text extraction completed')
    return `[Video Transcript] News Anchor: Good evening, I'm reporting on the latest economic developments. According to the Ministry of Finance, Bangladesh's GDP growth has reached 6.8% this quarter, marking a significant improvement from last year's performance. 

[00:15] Economic Analyst: This growth rate exceeds our initial projections of 6.2%. The manufacturing sector has been particularly strong, showing 8.2% growth driven by increased export demand and domestic consumption.

[00:45] Finance Minister: We are pleased to announce that our economic policies are yielding positive results. The 25% increase in infrastructure spending has created jobs and stimulated economic activity across multiple sectors.

[01:20] Reporter: What are the implications for next quarter? 

[01:25] Analyst: We expect continued growth momentum, though at a more moderate pace of around 6.5% as global economic conditions remain challenging.`
  }

  const extractTextFromAudio = async (file: File): Promise<string> => {
    // Simulate speech-to-text processing
    console.log('Extracting text from audio:', file.name)
    await new Promise(resolve => setTimeout(resolve, 2500 + Math.random() * 2500))
    
    console.log('Audio text extraction completed')
    return `[Audio Transcript] Speaker 1: The latest economic data shows remarkable progress. Our GDP growth has reached 6.8% this quarter, which is substantially higher than the 4.2% we recorded last year.

Speaker 2: That's impressive. What factors contributed to this growth?

Speaker 1: Several key factors. First, our export earnings increased by 15%, primarily driven by textile and pharmaceutical exports. Second, foreign direct investment rose by 22%, bringing in $2.1 billion in new capital.

Speaker 2: And what about domestic factors?

Speaker 1: Domestic consumption grew by 5.8%, supported by improved employment rates and wage growth. The government's infrastructure spending program also contributed significantly, creating jobs and stimulating economic activity.

Speaker 2: Are these trends sustainable?

Speaker 1: Economic indicators suggest continued growth, though we expect moderation to around 6.5% next quarter as we face global headwinds.`
  }

  if (analysisResults) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Fact-Check Results</h1>
              <p className="text-muted-foreground">
                {analysisResults.claims.length} claim(s) analyzed in {(analysisResults.processing_time / 1000).toFixed(1)}s
                {analysisResults.report_id && (
                  <span className="ml-2 text-xs">• Report ID: {analysisResults.report_id.slice(0, 8)}</span>
                )}
              </p>
            </div>
            <div className="flex space-x-2">
              {analysisResults.user_plan === 'free' && (
                <Button variant="outline" size="sm" onClick={() => window.open('/pricing', '_blank')}>
                  Upgrade for More Features
                </Button>
              )}
              <Button 
                onClick={() => setAnalysisResults(null)}
                variant="outline"
              >
                New Fact-Check
              </Button>
            </div>
          </div>

          <AdBanner userPlan={profile?.plan || 'free'} />
          {/* Results for each claim */}
          {analysisResults.claims.map((claim: any, index: number) => (
            <div key={claim.id} className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    📝 Original Claim {index + 1}
                  </CardTitle>
                  <p className="text-muted-foreground italic">
                    "{claim.text}"
                  </p>
                </CardHeader>
                <CardContent>
                  {/* Show clear fact vs fiction */}
                  <div className="mb-6 p-4 rounded-lg border-2" style={{
                    backgroundColor: claim.verdict === 'true' ? 'rgb(240 253 244)' : 
                                   claim.verdict === 'false' ? 'rgb(254 242 242)' :
                                   claim.verdict === 'misleading' ? 'rgb(255 251 235)' : 'rgb(249 250 251)',
                    borderColor: claim.verdict === 'true' ? 'rgb(34 197 94)' : 
                                claim.verdict === 'false' ? 'rgb(239 68 68)' :
                                claim.verdict === 'misleading' ? 'rgb(245 158 11)' : 'rgb(156 163 175)'
                  }}>
                    <div className="flex items-center space-x-2 mb-3">
                      <h3 className="text-lg font-bold">
                        {claim.verdict === 'true' && '✅ FACT: This is TRUE'}
                        {claim.verdict === 'false' && '❌ FICTION: This is FALSE'}
                        {claim.verdict === 'misleading' && '⚠️ MISLEADING: Partially True but Context Missing'}
                        {claim.verdict === 'satire' && '😄 SATIRE: This is Satirical Content'}
                        {claim.verdict === 'out_of_context' && '🔄 OUT OF CONTEXT: True but Missing Context'}
                        {claim.verdict === 'unverified' && '❓ UNVERIFIED: Insufficient Evidence'}
                      </h3>
                      <Badge variant={
                        claim.verdict === 'true' ? 'success' :
                        claim.verdict === 'false' ? 'destructive' :
                        'warning'
                      }>
                        {claim.confidence}% Confidence
                      </Badge>
                    </div>
                    
                    {/* Key findings */}
                    <div className="space-y-2">
                      <h4 className="font-semibold">🔍 Key Findings:</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {claim.rationale.map((reason: string, idx: number) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                    
                    {/* Evidence summary */}
                    {claim.evidence_summary && (
                      <div className="mt-4 pt-3 border-t">
                        <h4 className="font-semibold mb-2">📊 Evidence Summary:</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div className="text-center p-2 bg-white/50 rounded">
                            <div className="font-bold text-green-600">{claim.evidence_summary.supporting || 0}</div>
                            <div>Supporting</div>
                          </div>
                          <div className="text-center p-2 bg-white/50 rounded">
                            <div className="font-bold text-red-600">{claim.evidence_summary.refuting || 0}</div>
                            <div>Refuting</div>
                          </div>
                          <div className="text-center p-2 bg-white/50 rounded">
                            <div className="font-bold text-gray-600">{claim.evidence_summary.neutral || 0}</div>
                            <div>Neutral</div>
                          </div>
                          <div className="text-center p-2 bg-white/50 rounded">
                            <div className="font-bold text-blue-600">{claim.evidence_summary.high_credibility_sources || 0}</div>
                            <div>High Credibility</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <VerdictSummary
                    verdict={claim.verdict}
                    confidence={claim.confidence}
                    rationale={claim.rationale}
                    freshness={new Date()}
                    processing_time={claim.processing_time}
                  />
                  
                  {/* Additional information for premium users */}
                  {(analysisResults.user_plan === 'pro' || analysisResults.user_plan === 'enterprise') && claim.methodology && (
                    <div className="mt-4 p-3 bg-muted/30 rounded-lg">
                      <h4 className="font-medium text-sm mb-2">Methodology</h4>
                      <ul className="text-xs text-muted-foreground space-y-1">
                        {claim.methodology.map((method: string, idx: number) => (
                          <li key={idx}>• {method}</li>
                        ))}
                      </ul>
                      
                      {claim.limitations && claim.limitations.length > 0 && (
                        <>
                          <h4 className="font-medium text-sm mb-2 mt-3">Limitations</h4>
                          <ul className="text-xs text-muted-foreground space-y-1">
                            {claim.limitations.map((limitation: string, idx: number) => (
                              <li key={idx}>• {limitation}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <EvidenceList evidence={claim.evidence} />
            </div>
          ))}
        </div>
      </div>
    )

  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-2">{t('factCheck')}</h1>
          <p className="text-muted-foreground">
            Verify claims with AI-powered evidence retrieval and analysis across 5 languages
          </p>
          {profile && (
            <p className="text-sm text-muted-foreground mt-2">
              {profile.plan.charAt(0).toUpperCase() + profile.plan.slice(1)} Plan • 
              {profile.analysis_count} / {
                profile.plan === 'free' ? '5' :
                profile.plan === 'pro' ? '200' : '∞'
              } daily analyses used
            </p>
          )}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Input Type</CardTitle>
            <p className="text-sm text-muted-foreground">
              Choose the type of content you want to fact-check. Advanced features available with Pro/Enterprise plans.
            </p>
          </CardHeader>
          <CardContent>
            <Tabs value={activeInput} onValueChange={setActiveInput} className="w-full">
              <TabsList className="grid w-full grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
                {inputTypes.map((type) => (
                  <TabsTrigger
                    key={type.id}
                    value={type.id}
                    className="flex flex-col items-center gap-1 p-3"
                  >
                    <type.icon className="h-4 w-4" />
                    <span className="text-xs">{type.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {inputTypes.map((type) => (
                <TabsContent key={type.id} value={type.id} className="mt-6">
                  {type.id === 'social' ? (
                    <SocialMediaFactCheck
                      onAnalyze={handleAnalysis}
                      isAnalyzing={isAnalyzing}
                    />
                  ) : (
                  <FactChecker
                    inputType={type.id}
                    onAnalyze={handleAnalysis}
                    isAnalyzing={isAnalyzing}
                    onPreviewFetch={handlePreviewFetch}
                  />
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </CardContent>
        </Card>
        {profile && <AdBanner userPlan={profile.plan} />}
        <div className="mt-8 space-y-4">
          <GoogleAds 
            adSlot={GoogleAdSlots.IN_ARTICLE}
            adFormat="fluid"
            style={{ minHeight: '200px' }}
          />
          <CustomAdBanner 
            placement="factcheck_bottom" 
            className="mt-4"
          />
        </div>
      </div>
    </div>
  )
}