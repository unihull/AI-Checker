import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useForm } from 'react-hook-form'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FileUpload } from '@/components/FileUpload'
import { URLAnalysis } from '@/components/URLAnalysis'
import { Progress } from '@/components/ui/progress'
import { Play, Plus, X, Globe, Languages } from 'lucide-react'
import TextareaAutosize from 'react-textarea-autosize'

interface FactCheckerProps {
  inputType: string
  onAnalyze: (data: any) => void
  isAnalyzing: boolean
  onPreviewFetch?: (url: string) => Promise<{
    title: string
    description: string
    image: string
    domain: string
    publishedAt: string
  } | null>
}

export function FactChecker({ inputType, onAnalyze, isAnalyzing, onPreviewFetch }: FactCheckerProps) {
  const { t, i18n } = useTranslation('common')
  const [claims, setClaims] = useState<string[]>([''])
  const [selectedLanguage, setSelectedLanguage] = useState(i18n.language)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [selectedUrl, setSelectedUrl] = useState<string>('')
  const [extractingClaims, setExtractingClaims] = useState(false)
  
  const addClaim = () => {
    setClaims([...claims, ''])
  }

  const removeClaim = (index: number) => {
    setClaims(claims.filter((_, i) => i !== index))
  }

  const updateClaim = (index: number, value: string) => {
    const newClaims = [...claims]
    newClaims[index] = value
    setClaims(newClaims)
  }

  const extractClaimsFromText = async (text: string) => {
    setExtractingClaims(true)
    
    try {
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1500))
      
      // Enhanced claim extraction logic
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15)
      const factualClaims = []
      
      // Look for factual patterns
      const factualPatterns = [
        /\b(according to|reports show|data indicates|studies reveal|statistics show)\b/i,
        /\b(increased by|decreased by|rose to|fell to)\b/i,
        /\b(\d+%|\d+\.\d+%)\b/,
        /\b(announced|confirmed|stated|declared)\b/i,
        /\b(will be|has been|was|is expected to)\b/i
      ]
      
      for (const sentence of sentences) {
        const trimmed = sentence.trim()
        if (trimmed.length < 20) continue
        
        // Check if sentence contains factual indicators
        if (factualPatterns.some(pattern => pattern.test(trimmed))) {
          factualClaims.push(trimmed)
        } else if (/\b(\d+|statistics|data|research|study)\b/i.test(trimmed)) {
          factualClaims.push(trimmed)
        }
      }
      
      // If no factual claims found, use first few sentences
      if (factualClaims.length === 0) {
        factualClaims.push(...sentences.slice(0, 3))
      }
      
      setClaims(factualClaims.slice(0, 5))
      
      setExtractingClaims(false)
    } catch (error) {
      console.error('Claim extraction failed:', error)
      setExtractingClaims(false)
      
      // Fallback to simple extraction
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10)
      setClaims(sentences.slice(0, 3))
    }
  }

  const handleAnalyze = () => {
    const validClaims = claims.filter(claim => claim.trim() !== '')
    
    if (validClaims.length === 0) {
      alert('Please enter at least one claim to fact-check')
      return
    }

    onAnalyze({
      inputType,
      claims: validClaims,
      language: selectedLanguage as 'en' | 'bn' | 'hi' | 'ur' | 'ar',
      file: uploadedFile,
      url: selectedUrl
    })
  }

  const renderTextInput = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Text Claims</h3>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedLanguage(selectedLanguage === 'en' ? 'bn' : 'en')}
          >
            <Languages className="h-4 w-4 mr-1" />
            {selectedLanguage === 'en' ? 'EN' : 'BN'}
          </Button>
        </div>
      </div>

      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium mb-2">Quick Extract</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Paste text and let AI extract factual claims automatically
        </p>
        <div className="flex space-x-2">
          <TextareaAutosize
            placeholder="Paste article text, social media post, or any content to extract claims from..."
            className="flex-1 min-h-[60px] p-2 border rounded-md resize-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && e.ctrlKey) {
                const text = e.currentTarget.value
                if (text.trim()) {
                  extractClaimsFromText(text)
                }
              }
            }}
          />
          <Button
            onClick={(e) => {
              const textarea = (e.currentTarget.parentElement?.querySelector('textarea') as HTMLTextAreaElement)
              const text = textarea?.value || ''
              if (text.trim()) {
                extractClaimsFromText(text)
              }
            }}
            disabled={extractingClaims}
          >
            {extractingClaims ? 'Extracting...' : 'Extract Claims'}
          </Button>
        </div>
        {extractingClaims && (
          <div className="mt-3">
            <Progress value={60} className="h-2" />
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-medium">Individual Claims</h4>
          <Button variant="outline" size="sm" onClick={addClaim}>
            <Plus className="h-4 w-4 mr-1" />
            Add Claim
          </Button>
        </div>

        {claims.map((claim, index) => (
          <div key={index} className="flex space-x-2">
            <TextareaAutosize
              value={claim}
              onChange={(e) => updateClaim(index, e.target.value)}
              placeholder={`Enter claim ${index + 1}...`}
              className="flex-1 min-h-[60px] p-3 border rounded-md resize-none"
              minRows={2}
            />
            {claims.length > 1 && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => removeClaim(index)}
                className="mt-1"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        ))}
      </div>
    </div>
  )

  const renderUrlInput = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">URL/Article Analysis</h3>
      <URLAnalysis 
        onAnalyze={(url) => setSelectedUrl(url)} 
        onPreviewFetch={onPreviewFetch || handlePreviewFetch}
      />
      
      <div className="p-4 bg-muted/30 rounded-lg">
        <h4 className="font-medium mb-2">What we'll analyze:</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Extract factual claims from the article content</li>
          <li>• Verify publication date and author information</li>
          <li>• Cross-reference with reliable sources</li>
          <li>• Assess source credibility and bias</li>
        </ul>
      </div>
    </div>
  )

  const handlePreviewFetch = async (url: string): Promise<{ title: string; description: string; image: string; domain: string; publishedAt: string } | null> => {
    try {
      const domain = new URL(url).hostname
      
      // Simulate realistic preview fetching
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 800))
      
      // Generate contextual preview based on domain
      const isFactChecker = /snopes|factcheck|politifact|rumorscanner/.test(domain.toLowerCase())
      const isNews = /news|bbc|cnn|reuters|prothomalo|dailystar/.test(domain.toLowerCase())
      const isGov = domain.includes('.gov')
      const isSocial = /facebook|twitter|instagram|linkedin|tiktok|youtube/.test(domain.toLowerCase())
      
      let title = 'Web Page Title'
      let description = 'Web page description and content preview...'
      let image = 'https://images.pexels.com/photos/518543/pexels-photo-518543.jpeg?auto=compress&cs=tinysrgb&w=400'
      
      if (isFactChecker) {
        title = 'Fact Check: Verification Report'
        description = 'Professional fact-checking analysis with evidence-based conclusions and source verification.'
        image = 'https://images.pexels.com/photos/5428836/pexels-photo-5428836.jpeg?auto=compress&cs=tinysrgb&w=400'
      } else if (isSocial) {
        title = 'Social Media Post - Viral Content Alert'
        description = 'User-generated content from social media platform. This post has gained significant traction and may require verification for accuracy and context.'
        image = 'https://images.pexels.com/photos/267350/pexels-photo-267350.jpeg?auto=compress&cs=tinysrgb&w=400'
      } else if (isNews) {
        title = 'News Article: Current Events Coverage'
        description = 'Breaking news coverage with verified information from reliable journalistic sources.'
        image = 'https://images.pexels.com/photos/1591056/pexels-photo-1591056.jpeg?auto=compress&cs=tinysrgb&w=400'
      } else if (isGov) {
        title = 'Official Government Publication'
        description = 'Authoritative government information, statistics, and official announcements.'
        image = 'https://images.pexels.com/photos/1550337/pexels-photo-1550337.jpeg?auto=compress&cs=tinysrgb&w=400'
      }
      
      return {
        title,
        description,
        image,
        domain,
        publishedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString()
      }
      
    } catch (error) {
      console.error('Preview fetch failed:', error)
      return null
    }
  }

  const renderFileInput = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">
        {inputType === 'image' && 'Image + Claims Analysis'}
        {inputType === 'video' && 'Video + Claims Analysis'}
        {inputType === 'audio' && 'Audio + Claims Analysis'}
        {inputType === 'screenshot' && 'Chat/Social Media Analysis'}
      </h3>

      <FileUpload
        onFileSelect={(file) => setUploadedFile(file)}
        accept={
          inputType === 'image' || inputType === 'screenshot'
            ? { 'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'] }
            : inputType === 'video'
            ? { 'video/*': ['.mp4', '.webm', '.mov', '.avi'] }
            : { 'audio/*': ['.mp3', '.wav', '.m4a', '.ogg'] }
        }
      />

      {uploadedFile && (
        <div className="p-4 bg-muted/30 rounded-lg">
          <h4 className="font-medium mb-2">Analysis will include:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            {inputType === 'image' && (
              <>
                <li>• OCR text extraction for claim identification</li>
                <li>• Image authenticity verification</li>
                <li>• Reverse image search for context</li>
              </>
            )}
            {inputType === 'video' && (
              <>
                <li>• Audio transcription for claim extraction</li>
                <li>• Video authenticity analysis</li>
                <li>• Frame-by-frame content verification</li>
              </>
            )}
            {inputType === 'audio' && (
              <>
                <li>• Speech-to-text for claim extraction</li>
                <li>• Audio authenticity verification</li>
                <li>• Speaker identification if applicable</li>
              </>
            )}
            {inputType === 'screenshot' && (
              <>
                <li>• Text extraction from chat/social media</li>
                <li>• Platform-specific authenticity checks</li>
                <li>• UI consistency verification</li>
              </>
            )}
          </ul>
        </div>
      )}
    </div>
  )

  return (
    <div className="space-y-6">
      {inputType === 'text' && renderTextInput()}
      {inputType === 'url' && renderUrlInput()}
      {['image', 'video', 'audio', 'screenshot'].includes(inputType) && renderFileInput()}

      {/* Language & Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Analysis Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Language</p>
              <p className="text-sm text-muted-foreground">
                Analysis and evidence retrieval language
              </p>
            </div>
            <div className="flex space-x-2">
              <Badge 
                variant={selectedLanguage === 'en' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedLanguage('en')}
              >
                English
              </Badge>
              <Badge 
                variant={selectedLanguage === 'bn' ? 'default' : 'outline'}
                className="cursor-pointer"
                onClick={() => setSelectedLanguage('bn')}
              >
                বাংলা
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Evidence Sources</p>
              <p className="text-sm text-muted-foreground">
                Include local Bangladeshi fact-checkers
              </p>
            </div>
            <Badge variant="outline">
              <Globe className="h-3 w-3 mr-1" />
              BD + Global
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Action Button */}
      <div className="flex justify-center pt-4">
        <Button 
          size="lg" 
          onClick={handleAnalyze}
          disabled={isAnalyzing || (
            inputType === 'text' && claims.filter(c => c.trim()).length === 0
          ) || (
            inputType === 'url' && !selectedUrl
          ) || (
            ['image', 'video', 'audio', 'screenshot'].includes(inputType) && !uploadedFile
          )}
          className="px-8"
        >
          {isAnalyzing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Fact-Checking...
            </>
          ) : (
            <>
              <Play className="h-4 w-4 mr-2" />
              Run Fact-Check
            </>
          )}
        </Button>
      </div>
    </div>
  )
}