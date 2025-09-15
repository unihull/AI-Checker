import { ImageAnalysis } from './algorithms/ImageAnalysis'
import { AudioAnalysis } from './algorithms/AudioAnalysis'
import { VideoAnalysis } from './algorithms/VideoAnalysis'
import { ChatDetection } from './algorithms/ChatDetection'

export interface DetectionResult {
  overall_confidence: number
  algorithms: Array<{
    name: string
    score: number
    status: 'authentic' | 'suspicious' | 'manipulated'
    details?: Record<string, any>
  }>
  metadata?: Record<string, any>
  processing_time: number
}

export interface DetectionOptions {
  premium?: boolean
  algorithms?: string[]
  sensitivity?: 'low' | 'medium' | 'high'
}

export class DetectionEngine {
  private imageAnalysis: ImageAnalysis
  private audioAnalysis: AudioAnalysis
  private videoAnalysis: VideoAnalysis
  private chatDetection: ChatDetection

  constructor() {
    this.imageAnalysis = new ImageAnalysis()
    this.audioAnalysis = new AudioAnalysis()
    this.videoAnalysis = new VideoAnalysis()
    this.chatDetection = new ChatDetection()
  }

  async analyzeContent(
    inputType: 'image' | 'audio' | 'video' | 'screenshot' | 'url' | 'text',
    data: File | string,
    fileName?: string,
    options: DetectionOptions = {}
  ): Promise<DetectionResult> {
    const startTime = Date.now()

    try {
      let result: DetectionResult

      switch (inputType) {
        case 'image':
          result = await this.imageAnalysis.analyze(data, options)
          break
        case 'audio':
          result = await this.audioAnalysis.analyze(data, options)
          break
        case 'video':
          result = await this.videoAnalysis.analyze(data, options)
          break
        case 'screenshot':
          result = await this.chatDetection.analyze(data, options)
          break
        case 'url':
          result = await this.analyzeUrl(data as string, options)
          break
        case 'text':
          result = await this.analyzeText(data as string, options)
          break
        default:
          throw new Error(`Unsupported input type: ${inputType}`)
      }

      result.processing_time = Date.now() - startTime
      return result

    } catch (error) {
      console.error('Detection analysis failed:', error)
      return {
        overall_confidence: 0,
        algorithms: [{
          name: 'Error Handler',
          score: 0,
          status: 'suspicious',
          details: { error: error instanceof Error ? error.message : 'Unknown error' }
        }],
        processing_time: Date.now() - startTime
      }
    }
  }

  private async analyzeUrl(url: string, options: DetectionOptions): Promise<DetectionResult> {
    // URL credibility analysis
    const algorithms = []
    
    // Domain reputation check
    const domainScore = this.analyzeDomain(url)
    algorithms.push({
      name: 'Domain Reputation',
      score: domainScore,
      status: domainScore > 70 ? 'authentic' : domainScore > 40 ? 'suspicious' : 'manipulated' as const
    })

    // SSL/HTTPS check
    const httpsScore = url.startsWith('https://') ? 95 : 20
    algorithms.push({
      name: 'Security Protocol',
      score: httpsScore,
      status: httpsScore > 80 ? 'authentic' : 'suspicious' as const
    })

    if (options.premium) {
      // Content freshness analysis
      algorithms.push({
        name: 'Content Freshness',
        score: Math.random() * 40 + 60, // Mock score
        status: 'authentic' as const
      })

      // Source verification
      algorithms.push({
        name: 'Source Verification',
        score: Math.random() * 30 + 50, // Mock score
        status: 'suspicious' as const
      })
    }

    const overall_confidence = algorithms.reduce((sum, alg) => sum + alg.score, 0) / algorithms.length

    return {
      overall_confidence: Math.round(overall_confidence),
      algorithms,
      metadata: {
        url,
        domain: new URL(url).hostname,
        protocol: new URL(url).protocol
      }
    } as DetectionResult
  }

  private async analyzeText(text: string, options: DetectionOptions): Promise<DetectionResult> {
    // Text authenticity analysis
    const algorithms = []
    
    // Language consistency
    const langScore = this.analyzeLanguageConsistency(text)
    algorithms.push({
      name: 'Language Consistency',
      score: langScore,
      status: langScore > 80 ? 'authentic' : 'suspicious' as const
    })

    // Sentiment analysis
    const sentimentScore = Math.random() * 40 + 60 // Mock score
    algorithms.push({
      name: 'Sentiment Analysis',
      score: sentimentScore,
      status: 'authentic' as const
    })

    if (options.premium) {
      // AI-generated text detection
      algorithms.push({
        name: 'AI Generation Detection',
        score: Math.random() * 50 + 40, // Mock score
        status: 'suspicious' as const
      })

      // Factual consistency
      algorithms.push({
        name: 'Factual Consistency',
        score: Math.random() * 30 + 60, // Mock score
        status: 'authentic' as const
      })
    }

    const overall_confidence = algorithms.reduce((sum, alg) => sum + alg.score, 0) / algorithms.length

    return {
      overall_confidence: Math.round(overall_confidence),
      algorithms,
      metadata: {
        text_length: text.length,
        word_count: text.split(/\s+/).length
      }
    } as DetectionResult
  }

  private analyzeDomain(url: string): number {
    try {
      const domain = new URL(url).hostname.toLowerCase()
      
      // Known trusted domains
      const trustedDomains = [
        'bbc.com', 'cnn.com', 'reuters.com', 'ap.org', 'npr.org',
        'prothomalo.com', 'thedailystar.net', 'dhakatribune.com',
        'bdnews24.com', 'newagebd.net'
      ]

      // Known suspicious patterns
      const suspiciousPatterns = [
        /\d{4,}/, // Many numbers
        /[.-]{2,}/, // Multiple dots/dashes
        /^[a-z]{1,3}\.[a-z]{1,3}$/, // Very short domains
      ]

      if (trustedDomains.some(trusted => domain.includes(trusted))) {
        return 95
      }

      if (suspiciousPatterns.some(pattern => pattern.test(domain))) {
        return 25
      }

      // Default scoring based on domain characteristics
      let score = 60
      
      if (domain.includes('.gov') || domain.includes('.edu')) score += 20
      if (domain.includes('.org')) score += 10
      if (domain.length > 20) score -= 10
      if (domain.split('.').length > 3) score -= 15

      return Math.max(0, Math.min(100, score))
    } catch {
      return 10 // Invalid URL
    }
  }

  private analyzeLanguageConsistency(text: string): number {
    // Simple language consistency check
    const bengaliChars = (text.match(/[\u0980-\u09FF]/g) || []).length
    const englishChars = (text.match(/[a-zA-Z]/g) || []).length
    const totalChars = bengaliChars + englishChars

    if (totalChars === 0) return 50

    // Check for mixed scripts (could indicate inconsistency)
    const bengaliRatio = bengaliChars / totalChars
    const englishRatio = englishChars / totalChars

    // Pure language is more consistent
    if (bengaliRatio > 0.9 || englishRatio > 0.9) return 90
    
    // Mixed but balanced is okay
    if (bengaliRatio > 0.3 && englishRatio > 0.3) return 75
    
    // Heavily mixed might be suspicious
    return 60
  }
}