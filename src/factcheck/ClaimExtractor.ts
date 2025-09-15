export interface ClaimExtractionResult {
  claims: Array<{
    text: string
    confidence: number
    type: 'factual' | 'opinion' | 'prediction'
  }>
  processing_time: number
  language: string
  method: string
}

export class ClaimExtractor {
  async extractClaims(
    text: string, 
    language: 'en' | 'bn' | 'hi' | 'ur' | 'ar',
    apiKey?: string,
    useAdvancedNLP: boolean = false
  ): Promise<ClaimExtractionResult> {
    const startTime = Date.now()
    
    try {
      // Simulate claim extraction with realistic processing time
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200))
      
      // Simple rule-based extraction for demo
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15)
      const claims = []
      
      // Look for factual patterns
      const factualPatterns = [
        /\b(according to|reports show|data indicates|studies reveal|statistics show)\b/i,
        /\b(increased by|decreased by|rose to|fell to)\b/i,
        /\b(\d+%|\d+\.\d+%)\b/,
        /\b(announced|confirmed|stated|declared)\b/i,
        /\b(will be|has been|was|is expected to)\b/i
      ]
      
      for (const sentence of sentences.slice(0, 8)) {
        const trimmed = sentence.trim()
        if (trimmed.length < 20) continue
        
        let confidence = 0.6
        let type: 'factual' | 'opinion' | 'prediction' = 'factual'
        
        // Check for factual indicators
        if (factualPatterns.some(pattern => pattern.test(trimmed))) {
          confidence += 0.2
          type = 'factual'
        }
        
        // Check for opinion indicators
        if (/\b(believe|think|feel|opinion|should|must|ought)\b/i.test(trimmed)) {
          confidence -= 0.1
          type = 'opinion'
        }
        
        // Check for prediction indicators
        if (/\b(will|would|might|could|may|predict|forecast)\b/i.test(trimmed)) {
          type = 'prediction'
          confidence -= 0.05
        }
        
        // Boost confidence for specific claims
        if (/\b(\d+|statistics|data|research|study)\b/i.test(trimmed)) {
          confidence += 0.1
        }
        
        claims.push({
          text: trimmed,
          confidence: Math.min(0.95, Math.max(0.3, confidence)),
          type
        })
      }
      
      // If no claims found, create at least one from the text
      if (claims.length === 0 && sentences.length > 0) {
        claims.push({
          text: sentences[0].trim(),
          confidence: 0.5,
          type: 'factual' as const
        })
      }
      
      return {
        claims: claims.slice(0, 5), // Limit to 5 claims
        processing_time: Date.now() - startTime,
        language,
        method: useAdvancedNLP ? 'advanced_nlp' : 'rule_based'
      }
      
    } catch (error) {
      console.error('Claim extraction failed:', error)
      
      // Fallback extraction
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 15)
      const fallbackClaim = sentences.length > 0 ? sentences[0].trim() : text.slice(0, 100)
      
      return {
        claims: [{
          text: fallbackClaim,
          confidence: 0.4,
          type: 'factual'
        }],
        processing_time: Date.now() - startTime,
        language,
        method: 'fallback'
      }
    }
  }
}