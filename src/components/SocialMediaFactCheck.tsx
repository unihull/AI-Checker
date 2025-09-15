import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUpload } from '@/components/FileUpload'
import { VerdictSummary } from '@/components/VerdictSummary'
import { EvidenceList } from '@/components/EvidenceList'
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin,
  MessageSquare,
  Camera,
  Link as LinkIcon,
  AlertTriangle,
  CheckCircle,
  Search,
  Zap
} from 'lucide-react'

interface SocialMediaFactCheckProps {
  onAnalyze: (data: any) => void
  isAnalyzing: boolean
}

export function SocialMediaFactCheck({ onAnalyze, isAnalyzing }: SocialMediaFactCheckProps) {
  const { t } = useTranslation('common')
  const [activeTab, setActiveTab] = useState('screenshot')
  const [socialUrl, setSocialUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [extractedClaims, setExtractedClaims] = useState<string[]>([])
  const [analysisResults, setAnalysisResults] = useState<any>(null)

  const platforms = [
    { id: 'facebook', name: 'Facebook', icon: Facebook, color: 'text-blue-600' },
    { id: 'twitter', name: 'Twitter/X', icon: Twitter, color: 'text-sky-500' },
    { id: 'instagram', name: 'Instagram', icon: Instagram, color: 'text-pink-500' },
    { id: 'linkedin', name: 'LinkedIn', icon: Linkedin, color: 'text-blue-700' },
    { id: 'tiktok', name: 'TikTok', icon: MessageSquare, color: 'text-black' },
    { id: 'youtube', name: 'YouTube', icon: MessageSquare, color: 'text-red-600' }
  ]

  const handleScreenshotAnalysis = async (file: File) => {
    console.log('Social media screenshot analysis started')
    
    // Extract text from screenshot
    const extractedText = await extractSocialMediaText(file)
    console.log('Extracted social media text:', extractedText)
    
    // Extract claims from the social media content
    const claims = await extractClaimsFromSocialMedia(extractedText)
    setExtractedClaims(claims)
    
    // Trigger analysis with enhanced social media context
    onAnalyze({
      inputType: 'screenshot',
      file,
      claims,
      socialMediaContext: {
        platform: detectSocialPlatform(extractedText),
        contentType: detectContentType(extractedText),
        engagementMetrics: extractEngagementMetrics(extractedText),
        accountInfo: extractAccountInfo(extractedText)
      }
    })
  }

  const handleUrlAnalysis = async () => {
    if (!socialUrl.trim()) return
    
    console.log('Social media URL analysis started for:', socialUrl)
    
    // Detect platform from URL
    const platform = detectPlatformFromUrl(socialUrl)
    
    // Extract content from URL (simulated)
    const content = await extractContentFromSocialUrl(socialUrl, platform)
    
    onAnalyze({
      inputType: 'url',
      url: socialUrl,
      claims: content.claims,
      socialMediaContext: {
        platform,
        contentType: content.type,
        postMetadata: content.metadata
      }
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Social Media Fact Check</span>
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Verify claims from social media posts across major platforms
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="screenshot" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Screenshot Upload
              </TabsTrigger>
              <TabsTrigger value="url" className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Social Media URL
              </TabsTrigger>
            </TabsList>

            <TabsContent value="screenshot" className="space-y-4">
              <div>
                <h3 className="font-medium mb-3">Upload Social Media Screenshot</h3>
                <FileUpload
                  onFileSelect={handleScreenshotAnalysis}
                  accept={{ 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }}
                />
                
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-3">
                  {platforms.map((platform) => (
                    <div key={platform.id} className="flex items-center space-x-2 p-2 border rounded-md">
                      <platform.icon className={`h-4 w-4 ${platform.color}`} />
                      <span className="text-sm">{platform.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="url" className="space-y-4">
              <div>
                <h3 className="font-medium mb-3">Social Media Post URL</h3>
                <div className="flex space-x-2">
                  <Input
                    placeholder="https://facebook.com/post/123... or https://twitter.com/user/status/123..."
                    value={socialUrl}
                    onChange={(e) => setSocialUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleUrlAnalysis}
                    disabled={!socialUrl.trim() || isAnalyzing}
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Analyze
                  </Button>
                </div>
                
                <div className="mt-3 text-sm text-muted-foreground">
                  <p>Supported platforms: Facebook, Twitter/X, Instagram, LinkedIn, TikTok, YouTube</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Extracted Claims Display */}
      {extractedClaims.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📝 Claims Extracted from Social Media</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {extractedClaims.map((claim, index) => (
                <div key={index} className="p-3 bg-muted/30 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium">Claim {index + 1}</h4>
                      <p className="text-sm text-muted-foreground italic mt-1">"{claim}"</p>
                    </div>
                    <Badge variant="outline">Extracted</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>🛡️ Social Media Verification Process</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>What We Verify</span>
              </h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Factual claims and statements</li>
                <li>• Statistical information and data</li>
                <li>• News and current events</li>
                <li>• Public figure quotes</li>
                <li>• Image authenticity and context</li>
                <li>• Viral misinformation patterns</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium mb-2 flex items-center space-x-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span>Common Issues We Detect</span>
              </h4>
              <ul className="space-y-1 text-muted-foreground">
                <li>• Fabricated screenshots</li>
                <li>• Out-of-context information</li>
                <li>• Misleading statistics</li>
                <li>• Fake news and rumors</li>
                <li>• Manipulated engagement metrics</li>
                <li>• Impersonation accounts</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Helper functions for social media analysis
async function extractSocialMediaText(file: File): Promise<string> {
  // Simulate OCR extraction with social media specific patterns
  console.log('Extracting text from social media screenshot:', file.name)
  await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500))
  
  const mockSocialTexts = [
    `🚨 BREAKING: Bangladesh economy grew by 8.2% this quarter! 🇧🇩📈
    
That's the HIGHEST in 5 years! My cousin works at the finance ministry 😉

👍 2,847 likes  💬 156 comments  🔄 89 shares

Top comment:
Sarah Ahmed: Is this verified? I heard it was 6.8% from BBS
John Rahman: No way! This is fake news, official data shows 6.8%
Ahmed Khan: Actually both are wrong, it's 7.1% according to my source

#EconomicGrowth #Bangladesh #Development`,

    `VIRAL POST ALERT 🚨
    
"Did you know Bangladesh's GDP growth hit 8.2% this quarter? That's incredible progress! 🚀"

Posted by: Economic Updates BD (@economicupdatesbd)
Followers: 12.5K | Following: 245
Verified: ❌ (Not verified account)

📊 Engagement:
• 1,234 likes in 2 hours
• 89 shares
• 156 comments (mixed reactions)

⚠️ FACT CHECK NEEDED: Official BBS data shows 6.8%, not 8.2%`,

    `WhatsApp Forward - URGENT ⚠️

*BREAKING NEWS*
Bangladesh economy EXPLODED 🚀
8.2% growth this quarter!!!

My friend at Ministry of Finance confirmed this 💯
Share with everyone! 📤

✅ Forward this to 10 people for good luck
❌ Ignore if you don't care about Bangladesh

Last forwarded: 2 minutes ago
Originally sent by: +880-XXXX-XXXX`
  ]
  
  return mockSocialTexts[Math.floor(Math.random() * mockSocialTexts.length)]
}

async function extractClaimsFromSocialMedia(text: string): Promise<string[]> {
  console.log('Extracting claims from social media text')
  
  // Enhanced claim extraction for social media
  const claims: string[] = []
  
  // Look for statistical claims
  const statClaims = text.match(/\d+(?:\.\d+)?%[^.!?]*[.!?]/g) || []
  claims.push(...statClaims.map(claim => claim.trim()))
  
  // Look for breaking news claims
  const breakingClaims = text.match(/(?:breaking|urgent|confirmed)[^.!?]*[.!?]/gi) || []
  claims.push(...breakingClaims.map(claim => claim.trim()))
  
  // Look for quoted statements
  const quotes = text.match(/"[^"]+"/g) || []
  claims.push(...quotes.map(quote => quote.replace(/"/g, '').trim()))
  
  // Extract sentences with factual indicators
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15)
  const factualSentences = sentences.filter(sentence => 
    /\b(data|statistics|report|confirmed|announced|according to)\b/i.test(sentence)
  )
  claims.push(...factualSentences.map(s => s.trim()).slice(0, 2))
  
  // Remove duplicates and filter out very short claims
  const uniqueClaims = [...new Set(claims)]
    .filter(claim => claim.length > 10 && claim.length < 500)
    .slice(0, 5)
  
  console.log('Extracted social media claims:', uniqueClaims)
  return uniqueClaims.length > 0 ? uniqueClaims : [text.substring(0, 200)]
}

function detectSocialPlatform(text: string): string {
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('like') && lowerText.includes('comment') && lowerText.includes('share')) {
    return 'facebook'
  }
  if (lowerText.includes('retweet') || lowerText.includes('tweet')) {
    return 'twitter'
  }
  if (lowerText.includes('story') || lowerText.includes('reel')) {
    return 'instagram'
  }
  if (lowerText.includes('whatsapp') || lowerText.includes('forward')) {
    return 'whatsapp'
  }
  if (lowerText.includes('telegram')) {
    return 'telegram'
  }
  if (lowerText.includes('tiktok') || lowerText.includes('for you')) {
    return 'tiktok'
  }
  
  return 'unknown'
}

function detectContentType(text: string): string {
  const lowerText = text.toLowerCase()
  
  if (lowerText.includes('breaking') || lowerText.includes('urgent')) {
    return 'breaking_news'
  }
  if (lowerText.includes('opinion') || lowerText.includes('think')) {
    return 'opinion'
  }
  if (lowerText.includes('data') || lowerText.includes('statistics')) {
    return 'data_claim'
  }
  if (lowerText.includes('rumor') || lowerText.includes('heard')) {
    return 'rumor'
  }
  
  return 'general_post'
}

function extractEngagementMetrics(text: string): any {
  const likes = text.match(/(\d+(?:,\d{3})*)\s*(?:like|likes|👍)/gi)
  const shares = text.match(/(\d+(?:,\d{3})*)\s*(?:share|shares|retweet)/gi)
  const comments = text.match(/(\d+(?:,\d{3})*)\s*(?:comment|comments|replies)/gi)
  
  return {
    likes: likes ? parseInt(likes[0].replace(/[^\d]/g, '')) : 0,
    shares: shares ? parseInt(shares[0].replace(/[^\d]/g, '')) : 0,
    comments: comments ? parseInt(comments[0].replace(/[^\d]/g, '')) : 0,
    suspicious_patterns: detectSuspiciousEngagement(text)
  }
}

function extractAccountInfo(text: string): any {
  const followers = text.match(/(\d+(?:,\d{3})*(?:\.\d+)?[KM]?)\s*(?:follower|followers)/gi)
  const verified = text.includes('✓') || text.includes('verified')
  
  return {
    followers: followers ? followers[0] : null,
    verified: verified,
    account_type: verified ? 'verified' : 'unverified'
  }
}

function detectPlatformFromUrl(url: string): string {
  const domain = new URL(url).hostname.toLowerCase()
  
  if (domain.includes('facebook')) return 'facebook'
  if (domain.includes('twitter') || domain.includes('x.com')) return 'twitter'
  if (domain.includes('instagram')) return 'instagram'
  if (domain.includes('linkedin')) return 'linkedin'
  if (domain.includes('tiktok')) return 'tiktok'
  if (domain.includes('youtube')) return 'youtube'
  
  return 'unknown'
}

async function extractContentFromSocialUrl(url: string, platform: string): Promise<any> {
  console.log('Extracting content from social URL:', url, 'Platform:', platform)
  
  // Simulate API call to extract social media content
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
  
  const mockContent = {
    type: 'post',
    claims: [
      'Bangladesh economy grew by 8.2% this quarter',
      'This is the highest growth in 5 years',
      'Source: Ministry of Finance insider information'
    ],
    metadata: {
      author: 'EconomicUpdates_BD',
      posted_at: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000).toISOString(),
      engagement: {
        likes: Math.floor(Math.random() * 5000) + 100,
        shares: Math.floor(Math.random() * 500) + 10,
        comments: Math.floor(Math.random() * 200) + 5
      },
      verified: Math.random() > 0.7
    }
  }
  
  return mockContent
}

function detectSuspiciousEngagement(text: string): string[] {
  const suspicious: string[] = []
  
  const numbers = (text.match(/\d+(?:,\d{3})*/g) || []).map(n => parseInt(n.replace(/,/g, '')))
  const maxEngagement = Math.max(...numbers, 0)
  
  if (maxEngagement > 100000) {
    suspicious.push('unusually_high_engagement')
  }
  
  // Check for bot-like patterns
  if (text.includes('forward to 10 people') || text.includes('share or bad luck')) {
    suspicious.push('chain_message_pattern')
  }
  
  if (text.includes('my cousin') || text.includes('my friend at')) {
    suspicious.push('unverifiable_source_claim')
  }
  
  return suspicious
}