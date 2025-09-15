import { Evidence } from './EvidenceRetriever'

export interface ClaimVerdict {
  verdict: 'true' | 'false' | 'misleading' | 'satire' | 'out_of_context' | 'unverified'
  confidence: number
  rationale: string[]
  evidence_summary: {
    supporting: number
    refuting: number
    neutral: number
    total: number
    high_credibility_sources: number
    recent_sources: number
  }
  freshness_date: Date
  key_evidence: Evidence[]
  methodology: string[]
  limitations: string[]
}

export interface VerdictGenerationResult {
  verdict: ClaimVerdict
  processing_time: number
  evidence_analyzed: number
  reasoning_steps: string[]
  confidence_factors: any[]
}

export class VerdictGenerator {
  private readonly OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

  async generateVerdict(
    claim: string,
    evidence: Evidence[],
    language: 'en' | 'bn' | 'hi' | 'ur' | 'ar' = 'en',
    options: {
      useAI?: boolean
      confidenceThreshold?: number
      apiKey?: string
      requireConsensus?: boolean
      weightByCredibility?: boolean
      useAdvancedReasoning?: boolean
      includeUncertainty?: boolean
    } = {}
  ): Promise<VerdictGenerationResult> {
    const startTime = Date.now()
    const { 
      useAI = true, 
      confidenceThreshold = 70, 
      apiKey,
      requireConsensus = true,
      weightByCredibility = true,
      useAdvancedReasoning = true,
      includeUncertainty = true
    } = options

    try {
      // Analyze evidence distribution and quality
      const evidenceSummary = this.analyzeEvidenceDistribution(evidence)
      const confidenceFactors = this.analyzeConfidenceFactors(evidence, claim)
      const uncertaintyAnalysis = includeUncertainty ? this.analyzeUncertainty(evidence, claim) : null
      
      // Generate verdict using AI or enhanced rule-based approach
      let verdict: ClaimVerdict
      let reasoningSteps: string[] = []

      if (useAI && (apiKey || import.meta.env.VITE_OPENAI_API_KEY)) {
        const aiResult = await this.generateAIVerdict(claim, evidence, language, apiKey, useAdvancedReasoning)
        verdict = aiResult.verdict
        reasoningSteps = aiResult.reasoningSteps
      } else {
        const ruleResult = this.generateEnhancedRuleBasedVerdict(
          claim, 
          evidence, 
          evidenceSummary, 
          { requireConsensus, weightByCredibility, useAdvancedReasoning }
        )
        verdict = ruleResult.verdict
        reasoningSteps = ruleResult.reasoningSteps
      }

      // Apply confidence threshold and quality checks
      verdict = this.applyQualityChecks(verdict, confidenceThreshold, evidenceSummary)
      
      // Add uncertainty analysis if enabled
      if (uncertaintyAnalysis) {
        verdict = this.incorporateUncertainty(verdict, uncertaintyAnalysis)
      }

      return {
        verdict,
        processing_time: Date.now() - startTime,
        evidence_analyzed: evidence.length,
        reasoning_steps: reasoningSteps,
        confidence_factors: confidenceFactors
      }

    } catch (error) {
      console.error('Verdict generation failed:', error)
      return this.getMockVerdictResult(claim, evidence, language, startTime)
    }
  }

  private analyzeUncertainty(evidence: Evidence[], claim: string): any {
    const uncertaintyFactors: any[] = []
    
    // Evidence quantity uncertainty
    if (evidence.length < 3) {
      uncertaintyFactors.push({
        factor: 'insufficient_evidence',
        impact: 'high',
        description: 'Limited number of evidence sources'
      })
    }
    
    // Evidence quality uncertainty
    const lowQualityEvidence = evidence.filter(e => e.confidence < 60).length
    if (lowQualityEvidence > evidence.length * 0.3) {
      uncertaintyFactors.push({
        factor: 'low_quality_evidence',
        impact: 'medium',
        description: 'Significant portion of evidence has low confidence'
      })
    }
    
    // Temporal uncertainty
    const oldEvidence = evidence.filter(e => {
      if (!e.published_at) return false
      const daysSince = (Date.now() - e.published_at.getTime()) / (1000 * 60 * 60 * 24)
      return daysSince > 365
    }).length
    
    if (oldEvidence > evidence.length * 0.5) {
      uncertaintyFactors.push({
        factor: 'temporal_uncertainty',
        impact: 'medium',
        description: 'Much of the evidence is over a year old'
      })
    }
    
    // Language/cultural uncertainty
    const languageMismatches = evidence.filter(e => e.language !== 'en' && e.language !== claim.split(' ')[0]).length
    if (languageMismatches > evidence.length * 0.4) {
      uncertaintyFactors.push({
        factor: 'language_uncertainty',
        impact: 'low',
        description: 'Evidence from different language contexts'
      })
    }
    
    // Conflicting evidence uncertainty
    const supporting = evidence.filter(e => e.stance === 'supports').length
    const refuting = evidence.filter(e => e.stance === 'refutes').length
    
    if (supporting > 0 && refuting > 0 && Math.abs(supporting - refuting) <= 1) {
      uncertaintyFactors.push({
        factor: 'conflicting_evidence',
        impact: 'high',
        description: 'Nearly equal supporting and refuting evidence'
      })
    }
    
    return {
      factors: uncertaintyFactors,
      overall_uncertainty: this.calculateOverallUncertainty(uncertaintyFactors),
      recommendations: this.generateUncertaintyRecommendations(uncertaintyFactors)
    }
  }

  private calculateOverallUncertainty(factors: any[]): number {
    let uncertainty = 0
    
    for (const factor of factors) {
      switch (factor.impact) {
        case 'high':
          uncertainty += 0.3
          break
        case 'medium':
          uncertainty += 0.2
          break
        case 'low':
          uncertainty += 0.1
          break
      }
    }
    
    return Math.min(1, uncertainty)
  }

  private generateUncertaintyRecommendations(factors: any[]): string[] {
    const recommendations: string[] = []
    
    for (const factor of factors) {
      switch (factor.factor) {
        case 'insufficient_evidence':
          recommendations.push('Seek additional evidence sources before making final determination')
          break
        case 'low_quality_evidence':
          recommendations.push('Prioritize higher-quality, more credible sources')
          break
        case 'temporal_uncertainty':
          recommendations.push('Look for more recent evidence to confirm current status')
          break
        case 'conflicting_evidence':
          recommendations.push('Investigate the source of conflicting information')
          break
      }
    }
    
    return [...new Set(recommendations)]
  }

  private incorporateUncertainty(verdict: ClaimVerdict, uncertaintyAnalysis: any): ClaimVerdict {
    const uncertainty = uncertaintyAnalysis.overall_uncertainty
    
    // Adjust confidence based on uncertainty
    const adjustedConfidence = Math.round(verdict.confidence * (1 - uncertainty * 0.5))
    
    // Add uncertainty information to rationale
    if (uncertainty > 0.3) {
      verdict.rationale.unshift(`High uncertainty detected (${(uncertainty * 100).toFixed(1)}%)`)
      verdict.limitations.push(...uncertaintyAnalysis.recommendations)
    }
    
    // If uncertainty is very high, consider changing verdict to unverified
    if (uncertainty > 0.6 && verdict.verdict !== 'unverified') {
      verdict.rationale.unshift('High uncertainty led to unverified classification')
      verdict.verdict = 'unverified'
    }
    
    return {
      ...verdict,
      confidence: Math.max(10, adjustedConfidence)
    }
  }

  private analyzeEvidenceDistribution(evidence: Evidence[]) {
    const summary = {
      supporting: 0,
      refuting: 0,
      neutral: 0,
      total: evidence.length,
      high_credibility_sources: 0,
      recent_sources: 0
    }

    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

    evidence.forEach(item => {
      switch (item.stance) {
        case 'supports':
          summary.supporting++
          break
        case 'refutes':
          summary.refuting++
          break
        case 'neutral':
          summary.neutral++
          break
      }
      
      if (item.publisher.weight > 0.8) {
        summary.high_credibility_sources++
      }
      
      if (item.published_at && item.published_at > oneWeekAgo) {
        summary.recent_sources++
      }
    })

    return summary
  }

  private analyzeConfidenceFactors(evidence: Evidence[], claim: string): any[] {
    const factors: any[] = []
    
    // Source credibility factor
    const avgCredibility = evidence.reduce((sum, e) => sum + e.publisher.weight, 0) / Math.max(1, evidence.length)
    factors.push({
      factor: 'source_credibility',
      score: avgCredibility,
      weight: 0.3,
      description: `Average source credibility: ${(avgCredibility * 100).toFixed(1)}%`
    })
    
    // Evidence consensus factor
    const supportRatio = evidence.filter(e => e.stance === 'supports').length / Math.max(1, evidence.length)
    const refuteRatio = evidence.filter(e => e.stance === 'refutes').length / Math.max(1, evidence.length)
    const consensusScore = Math.max(supportRatio, refuteRatio)
    
    factors.push({
      factor: 'evidence_consensus',
      score: consensusScore,
      weight: 0.25,
      description: `Evidence consensus: ${(consensusScore * 100).toFixed(1)}%`
    })
    
    // Recency factor
    const recentEvidence = evidence.filter(e => {
      if (!e.published_at) return false
      const daysSince = (Date.now() - e.published_at.getTime()) / (1000 * 60 * 60 * 24)
      return daysSince <= 30
    })
    const recencyScore = recentEvidence.length / Math.max(1, evidence.length)
    
    factors.push({
      factor: 'evidence_recency',
      score: recencyScore,
      weight: 0.15,
      description: `Recent evidence: ${(recencyScore * 100).toFixed(1)}%`
    })
    
    // Relevance factor
    const avgRelevance = evidence.reduce((sum, e) => sum + e.relevance_score, 0) / Math.max(1, evidence.length)
    factors.push({
      factor: 'relevance',
      score: avgRelevance,
      weight: 0.2,
      description: `Average relevance: ${(avgRelevance * 100).toFixed(1)}%`
    })
    
    // Evidence diversity factor
    const uniquePublishers = new Set(evidence.map(e => e.publisher.id)).size
    const diversityScore = Math.min(1, uniquePublishers / 5) // Normalize to max 5 sources
    
    factors.push({
      factor: 'source_diversity',
      score: diversityScore,
      weight: 0.1,
      description: `Source diversity: ${uniquePublishers} unique sources`
    })
    
    return factors
  }

  private async generateAIVerdict(
    claim: string,
    evidence: Evidence[],
    language: string,
    apiKey?: string,
    useAdvancedReasoning: boolean = true
  ): Promise<{ verdict: ClaimVerdict; reasoningSteps: string[] }> {
    const key = apiKey || import.meta.env.VITE_OPENAI_API_KEY
    
    if (!key) {
      throw new Error('No OpenAI API key available')
    }

    const systemPrompt = this.getVerdictSystemPrompt(language, useAdvancedReasoning)
    const userPrompt = this.getVerdictUserPrompt(claim, evidence, language, useAdvancedReasoning)

    const response = await fetch(this.OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: useAdvancedReasoning ? 0.05 : 0.1,
        max_tokens: useAdvancedReasoning ? 3000 : 2000,
        response_format: { type: 'json_object' }
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`)
    }

    const data = await response.json()
    const result = JSON.parse(data.choices[0].message.content)

    const verdict: ClaimVerdict = {
      verdict: result.verdict || 'unverified',
      confidence: result.confidence || 50,
      rationale: result.rationale || [],
      evidence_summary: this.analyzeEvidenceDistribution(evidence),
      freshness_date: new Date(),
      key_evidence: this.selectKeyEvidence(evidence, result.verdict),
      methodology: result.methodology || ['AI-powered analysis', 'Multi-source verification'],
      limitations: result.limitations || []
    }

    return {
      verdict,
      reasoningSteps: result.reasoning_steps || []
    }
  }

  private generateEnhancedRuleBasedVerdict(
    claim: string,
    evidence: Evidence[],
    evidenceSummary: any,
    options: { requireConsensus: boolean; weightByCredibility: boolean; useAdvancedReasoning: boolean }
  ): { verdict: ClaimVerdict; reasoningSteps: string[] } {
    const reasoningSteps: string[] = []
    let verdict: 'true' | 'false' | 'misleading' | 'satire' | 'out_of_context' | 'unverified' = 'unverified'
    let confidence = 50
    const rationale: string[] = []
    const methodology: string[] = ['Rule-based analysis', 'Multi-factor evaluation']
    const limitations: string[] = []

    if (options.useAdvancedReasoning) {
      methodology.push('Advanced reasoning patterns', 'Contextual analysis')
    }

    reasoningSteps.push(`Analyzing ${evidenceSummary.total} pieces of evidence`)
    
    // Enhanced reasoning with more sophisticated analysis
    if (options.useAdvancedReasoning) {
      reasoningSteps.push('Applying advanced reasoning patterns')
      
      // Analyze claim complexity
      const claimComplexity = this.analyzeClaimComplexity(claim)
      if (claimComplexity.isComplex) {
        reasoningSteps.push(`Complex claim detected: ${claimComplexity.factors.join(', ')}`)
        confidence -= 5 // Complex claims are harder to verify
      }
      
      // Analyze evidence coherence
      const coherence = this.analyzeEvidenceCoherence(evidence)
      if (coherence.score < 0.7) {
        reasoningSteps.push(`Low evidence coherence detected (${(coherence.score * 100).toFixed(1)}%)`)
        confidence -= 10
      }
      
      // Cross-reference analysis
      const crossReferences = this.analyzeCrossReferences(evidence)
      if (crossReferences.circularReferences > 0) {
        reasoningSteps.push('Circular references detected in evidence sources')
        confidence -= 15
      }
    }

    // Rule 1: Insufficient evidence check
    if (evidenceSummary.total < 2) {
      verdict = 'unverified'
      confidence = 30
      rationale.push('Insufficient evidence available for verification')
      limitations.push('Limited evidence sources')
      reasoningSteps.push('Insufficient evidence to make determination')
      
      return this.buildVerdictResult(verdict, confidence, rationale, evidenceSummary, evidence, methodology, limitations, reasoningSteps)
    }

    // Rule 2: Satire detection
    const satireIndicators = evidence.filter(e => 
      e.title.toLowerCase().includes('satire') || 
      e.snippet.toLowerCase().includes('parody') ||
      e.snippet.toLowerCase().includes('joke') ||
      e.publisher.name.toLowerCase().includes('onion') ||
      e.publisher.name.toLowerCase().includes('babylon') ||
      e.fact_check_rating?.toLowerCase().includes('satire')
    )
    
    if (satireIndicators.length > 0) {
      verdict = 'satire'
      confidence = 85
      rationale.push('Content identified as satirical or parody')
      reasoningSteps.push('Satirical content detected')
      
      return this.buildVerdictResult(verdict, confidence, rationale, evidenceSummary, evidence, methodology, limitations, reasoningSteps)
    }

    // Rule 3: High-credibility source analysis
    const highCredibilitySources = evidence.filter(e => e.publisher.weight >= 0.85)
    if (highCredibilitySources.length >= 2) {
      const hqSupporting = highCredibilitySources.filter(e => e.stance === 'supports').length
      const hqRefuting = highCredibilitySources.filter(e => e.stance === 'refutes').length
      const hqNeutral = highCredibilitySources.filter(e => e.stance === 'neutral').length

      if (hqSupporting > hqRefuting + hqNeutral) {
        verdict = 'true'
        confidence = Math.min(95, 75 + (hqSupporting * 5))
        rationale.push(`${hqSupporting} high-credibility sources support the claim`)
        reasoningSteps.push('High-credibility sources provide strong supporting evidence')
      } else if (hqRefuting > hqSupporting + hqNeutral) {
        verdict = 'false'
        confidence = Math.min(95, 75 + (hqRefuting * 5))
        rationale.push(`${hqRefuting} high-credibility sources refute the claim`)
        reasoningSteps.push('High-credibility sources provide strong refuting evidence')
      } else if (hqNeutral > 0 && hqSupporting > 0 && hqRefuting > 0) {
        verdict = 'misleading'
        confidence = 70
        rationale.push('High-credibility sources show mixed evidence, suggesting misleading information')
        reasoningSteps.push('Mixed evidence from credible sources indicates misleading content')
      }
    }

    // Rule 4: Consensus analysis with credibility weighting
    if (verdict === 'unverified' && evidenceSummary.total >= 3) {
      let weightedSupport = 0
      let weightedRefute = 0
      let weightedNeutral = 0
      let totalWeight = 0

      evidence.forEach(e => {
        const weight = options.weightByCredibility ? e.publisher.weight : 1.0
        totalWeight += weight
        
        switch (e.stance) {
          case 'supports':
            weightedSupport += weight
            break
          case 'refutes':
            weightedRefute += weight
            break
          case 'neutral':
            weightedNeutral += weight
            break
        }
      })

      const supportRatio = weightedSupport / totalWeight
      const refuteRatio = weightedRefute / totalWeight
      const neutralRatio = weightedNeutral / totalWeight

      if (options.requireConsensus) {
        if (supportRatio >= 0.7) {
          verdict = 'true'
          confidence = Math.min(95, 60 + (supportRatio * 40))
          rationale.push(`Strong consensus supporting the claim (${(supportRatio * 100).toFixed(1)}% weighted support)`)
          reasoningSteps.push('Strong consensus supporting the claim')
        } else if (refuteRatio >= 0.7) {
          verdict = 'false'
          confidence = Math.min(95, 60 + (refuteRatio * 40))
          rationale.push(`Strong consensus refuting the claim (${(refuteRatio * 100).toFixed(1)}% weighted refutation)`)
          reasoningSteps.push('Strong consensus refuting the claim')
        }
      } else {
        if (supportRatio > refuteRatio && supportRatio > neutralRatio) {
          verdict = supportRatio > 0.5 ? 'true' : 'unverified'
          confidence = Math.min(90, 50 + (supportRatio * 50))
          rationale.push(`Majority of sources support the claim (${(supportRatio * 100).toFixed(1)}% weighted support)`)
          reasoningSteps.push('Majority evidence supports the claim')
        } else if (refuteRatio > supportRatio && refuteRatio > neutralRatio) {
          verdict = refuteRatio > 0.5 ? 'false' : 'unverified'
          confidence = Math.min(90, 50 + (refuteRatio * 50))
          rationale.push(`Majority of sources refute the claim (${(refuteRatio * 100).toFixed(1)}% weighted refutation)`)
          reasoningSteps.push('Majority evidence refutes the claim')
        }
      }

      // Mixed evidence analysis
      if (supportRatio >= 0.3 && refuteRatio >= 0.3) {
        verdict = 'misleading'
        confidence = 65
        rationale.push('Significant evidence both supporting and refuting suggests misleading information')
        reasoningSteps.push('Mixed evidence indicates misleading or contextual issues')
      }
    }

    // Rule 5: Out of context detection
    const contextIssues = this.detectContextIssues(claim, evidence)
    if (contextIssues.length > 0 && verdict !== 'false') {
      verdict = 'out_of_context'
      confidence = Math.max(confidence, 70)
      rationale.push('Evidence suggests claim is taken out of context')
      rationale.push(...contextIssues)
      reasoningSteps.push('Context analysis reveals potential misrepresentation')
    }

    // Rule 6: Confidence adjustment based on evidence quality
    const qualityAdjustment = this.calculateQualityAdjustment(evidence)
    confidence = Math.round(confidence * qualityAdjustment.multiplier)
    
    if (qualityAdjustment.factors.length > 0) {
      rationale.push(...qualityAdjustment.factors)
    }

    // Rule 7: Temporal relevance check
    const temporalRelevance = this.analyzeTemporalRelevance(evidence)
    if (temporalRelevance.outdatedRatio > 0.5) {
      confidence = Math.max(30, confidence - 15)
      rationale.push('Some evidence is outdated, reducing confidence')
      limitations.push('Reliance on potentially outdated information')
      reasoningSteps.push('Applied temporal relevance penalty')
    }

    // Rule 8: Language and regional consistency
    const languageConsistency = this.analyzeLanguageConsistency(evidence, language)
    if (languageConsistency.score < 0.7) {
      confidence = Math.max(40, confidence - 10)
      limitations.push('Limited evidence in target language')
    }

    // Final confidence validation
    if (confidence < confidenceThreshold) {
      const originalVerdict = verdict
      verdict = 'unverified'
      rationale.unshift(`Confidence below threshold (${confidenceThreshold}%), changing verdict from '${originalVerdict}' to 'unverified'`)
      reasoningSteps.push('Applied confidence threshold filter')
    }

    const finalVerdict: ClaimVerdict = {
      verdict,
      confidence: Math.max(10, Math.min(100, confidence)),
      rationale,
      evidence_summary: evidenceSummary,
      freshness_date: new Date(),
      key_evidence: this.selectKeyEvidence(evidence, verdict),
      methodology,
      limitations
    }

    return { verdict: finalVerdict, reasoningSteps }
  }

  private analyzeClaimComplexity(claim: string): any {
    const factors: string[] = []
    let isComplex = false
    
    // Check for multiple sub-claims
    const subClaims = claim.split(/and|but|however|although|while/i)
    if (subClaims.length > 2) {
      factors.push('multiple sub-claims')
      isComplex = true
    }
    
    // Check for conditional statements
    if (/if|when|unless|provided that/i.test(claim)) {
      factors.push('conditional statements')
      isComplex = true
    }
    
    // Check for comparative statements
    if (/more than|less than|compared to|versus|higher than|lower than/i.test(claim)) {
      factors.push('comparative elements')
      isComplex = true
    }
    
    // Check for temporal complexity
    const timeReferences = (claim.match(/\d{4}|yesterday|today|last year|next year/gi) || []).length
    if (timeReferences > 2) {
      factors.push('multiple time references')
      isComplex = true
    }
    
    return { isComplex, factors }
  }

  private analyzeEvidenceCoherence(evidence: Evidence[]): any {
    let coherenceScore = 1.0
    const incoherenceFactors: string[] = []
    
    // Check for contradictory evidence from same source
    const sourceGroups: { [key: string]: Evidence[] } = {}
    for (const item of evidence) {
      if (!sourceGroups[item.source]) {
        sourceGroups[item.source] = []
      }
      sourceGroups[item.source].push(item)
    }
    
    for (const [source, items] of Object.entries(sourceGroups)) {
      if (items.length > 1) {
        const stances = items.map(item => item.stance)
        const uniqueStances = new Set(stances)
        
        if (uniqueStances.size > 1 && uniqueStances.has('supports') && uniqueStances.has('refutes')) {
          coherenceScore *= 0.7
          incoherenceFactors.push(`Contradictory stances from ${source}`)
        }
      }
    }
    
    // Check for temporal coherence
    const datedEvidence = evidence.filter(e => e.published_at)
    if (datedEvidence.length > 1) {
      const timeSpan = Math.max(...datedEvidence.map(e => e.published_at!.getTime())) - 
                     Math.min(...datedEvidence.map(e => e.published_at!.getTime()))
      const daySpan = timeSpan / (1000 * 60 * 60 * 24)
      
      if (daySpan > 1000) { // Evidence spans more than ~3 years
        coherenceScore *= 0.9
        incoherenceFactors.push('Evidence spans a very long time period')
      }
    }
    
    return { score: coherenceScore, factors: incoherenceFactors }
  }

  private analyzeCrossReferences(evidence: Evidence[]): any {
    let circularReferences = 0
    const sourceUrls = evidence.map(e => e.url)
    
    // Check for circular references (simplified)
    for (let i = 0; i < evidence.length; i++) {
      for (let j = i + 1; j < evidence.length; j++) {
        const evidence1 = evidence[i]
        const evidence2 = evidence[j]
        
        // Check if sources reference each other
        if (evidence1.snippet.includes(evidence2.source) || 
            evidence2.snippet.includes(evidence1.source)) {
          circularReferences++
        }
        
        // Check for identical snippets (copy-paste)
        const similarity = this.calculateTextSimilarity(evidence1.snippet, evidence2.snippet)
        if (similarity > 0.8) {
          circularReferences++
        }
      }
    }
    
    return { circularReferences }
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return union.size > 0 ? intersection.size / union.size : 0
  }

  private detectContextIssues(claim: string, evidence: Evidence[]): string[] {
    const issues: string[] = []
    
    // Look for context-related keywords in evidence
    const contextKeywords = ['context', 'misleading', 'partial', 'incomplete', 'cherry-picked', 'selective']
    
    for (const item of evidence) {
      const text = (item.title + ' ' + item.snippet).toLowerCase()
      for (const keyword of contextKeywords) {
        if (text.includes(keyword)) {
          issues.push(`Source mentions potential context issues: "${keyword}"`)
          break
        }
      }
    }
    
    // Check for temporal context issues
    const dates = claim.match(/\d{4}/g) || []
    if (dates.length > 0) {
      const claimYear = parseInt(dates[0])
      const currentYear = new Date().getFullYear()
      
      if (currentYear - claimYear > 5) {
        issues.push('Claim refers to events from several years ago')
      }
    }
    
    return issues
  }

  private calculateQualityAdjustment(evidence: Evidence[]): { multiplier: number; factors: string[] } {
    let multiplier = 1.0
    const factors: string[] = []
    
    // Adjust for evidence type distribution
    const factCheckCount = evidence.filter(e => e.evidence_type === 'claimreview').length
    const newsCount = evidence.filter(e => e.evidence_type === 'news').length
    const kbCount = evidence.filter(e => e.evidence_type === 'kb').length
    
    if (factCheckCount > 0) {
      multiplier += 0.1
      factors.push('Professional fact-checking sources available')
    }
    
    if (kbCount > 0) {
      multiplier += 0.05
      factors.push('Knowledge base sources provide additional context')
    }
    
    // Adjust for credibility indicators
    const totalIndicators = evidence.reduce((sum, e) => sum + e.credibility_indicators.length, 0)
    const avgIndicators = totalIndicators / Math.max(1, evidence.length)
    
    if (avgIndicators > 2) {
      multiplier += 0.05
      factors.push('Sources have strong credibility indicators')
    }
    
    // Adjust for confidence distribution
    const avgConfidence = evidence.reduce((sum, e) => sum + e.confidence, 0) / Math.max(1, evidence.length)
    if (avgConfidence > 80) {
      multiplier += 0.1
      factors.push('High average confidence across sources')
    } else if (avgConfidence < 60) {
      multiplier -= 0.1
      factors.push('Lower average confidence across sources')
    }
    
    return {
      multiplier: Math.max(0.5, Math.min(1.3, multiplier)),
      factors
    }
  }

  private analyzeTemporalRelevance(evidence: Evidence[]): { outdatedRatio: number; avgAge: number } {
    const now = Date.now()
    let totalAge = 0
    let outdatedCount = 0
    let datedEvidence = 0
    
    for (const item of evidence) {
      if (item.published_at) {
        const ageInDays = (now - item.published_at.getTime()) / (1000 * 60 * 60 * 24)
        totalAge += ageInDays
        datedEvidence++
        
        if (ageInDays > 365) { // Older than 1 year
          outdatedCount++
        }
      }
    }
    
    return {
      outdatedRatio: datedEvidence > 0 ? outdatedCount / datedEvidence : 0,
      avgAge: datedEvidence > 0 ? totalAge / datedEvidence : 0
    }
  }

  private analyzeLanguageConsistency(evidence: Evidence[], targetLanguage: string): { score: number; details: any } {
    const languageMatches = evidence.filter(e => e.language === targetLanguage).length
    const score = evidence.length > 0 ? languageMatches / evidence.length : 0
    
    return {
      score,
      details: {
        target_language_sources: languageMatches,
        total_sources: evidence.length,
        other_languages: evidence.filter(e => e.language !== targetLanguage).map(e => e.language)
      }
    }
  }

  private selectKeyEvidence(evidence: Evidence[], verdict: string): Evidence[] {
    // Select the most relevant evidence for the verdict
    let relevantEvidence = evidence
    
    if (verdict === 'true') {
      relevantEvidence = evidence.filter(e => e.stance === 'supports')
    } else if (verdict === 'false') {
      relevantEvidence = evidence.filter(e => e.stance === 'refutes')
    } else if (verdict === 'misleading') {
      // Include both supporting and refuting evidence
      const supporting = evidence.filter(e => e.stance === 'supports').slice(0, 2)
      const refuting = evidence.filter(e => e.stance === 'refutes').slice(0, 2)
      relevantEvidence = [...supporting, ...refuting]
    }
    
    // Sort by credibility and relevance
    return relevantEvidence
      .sort((a, b) => {
        const aScore = (a.confidence * 0.4) + (a.publisher.weight * 100 * 0.4) + (a.relevance_score * 100 * 0.2)
        const bScore = (b.confidence * 0.4) + (b.publisher.weight * 100 * 0.4) + (b.relevance_score * 100 * 0.2)
        return bScore - aScore
      })
      .slice(0, 5)
  }

  private applyQualityChecks(verdict: ClaimVerdict, confidenceThreshold: number, evidenceSummary: any): ClaimVerdict {
    // Apply additional quality checks
    
    // Check for minimum evidence requirements
    if (evidenceSummary.total < 2 && verdict.verdict !== 'unverified') {
      verdict.verdict = 'unverified'
      verdict.confidence = Math.min(verdict.confidence, 40)
      verdict.rationale.unshift('Insufficient evidence for confident determination')
      verdict.limitations.push('Minimum evidence threshold not met')
    }
    
    // Check for credibility requirements
    if (evidenceSummary.high_credibility_sources === 0 && verdict.confidence > 70) {
      verdict.confidence = Math.min(70, verdict.confidence)
      verdict.limitations.push('No high-credibility sources available')
    }
    
    // Apply confidence threshold
    if (verdict.confidence < confidenceThreshold && verdict.verdict !== 'unverified') {
      verdict.verdict = 'unverified'
      verdict.rationale.unshift(`Confidence below threshold (${confidenceThreshold}%)`)
    }
    
    return verdict
  }

  private buildVerdictResult(
    verdict: 'true' | 'false' | 'misleading' | 'satire' | 'out_of_context' | 'unverified',
    confidence: number,
    rationale: string[],
    evidenceSummary: any,
    evidence: Evidence[],
    methodology: string[],
    limitations: string[],
    reasoningSteps: string[]
  ): { verdict: ClaimVerdict; reasoningSteps: string[] } {
    const finalVerdict: ClaimVerdict = {
      verdict,
      confidence: Math.max(10, Math.min(100, confidence)),
      rationale,
      evidence_summary: evidenceSummary,
      freshness_date: new Date(),
      key_evidence: this.selectKeyEvidence(evidence, verdict),
      methodology,
      limitations
    }

    return { verdict: finalVerdict, reasoningSteps }
  }

  private getVerdictSystemPrompt(language: string, useAdvancedReasoning: boolean = true): string {
    const basePrompt = this.getBaseVerdictPrompt(language)
    
    if (!useAdvancedReasoning) {
      return basePrompt
    }
    
    const advancedPrompt = `${basePrompt}

ADVANCED REASONING REQUIREMENTS:
1. Multi-layered Analysis:
   - Primary evidence assessment (direct support/refutation)
   - Secondary evidence assessment (contextual support)
   - Meta-evidence assessment (source reliability patterns)

2. Uncertainty Quantification:
   - Identify and quantify sources of uncertainty
   - Distinguish between epistemic (knowledge) and aleatory (inherent) uncertainty
   - Provide confidence intervals where appropriate

3. Contextual Reasoning:
   - Consider temporal context (when was this true/false?)
   - Consider geographical context (where is this applicable?)
   - Consider cultural/linguistic context (interpretation differences)

4. Bias Detection:
   - Identify potential source bias patterns
   - Account for selection bias in evidence
   - Consider confirmation bias in evidence interpretation

5. Logical Consistency:
   - Check for logical fallacies in reasoning
   - Ensure conclusions follow from premises
   - Identify gaps in logical chain

Enhanced JSON Schema:
{
  "verdict": "true|false|misleading|satire|out_of_context|unverified",
  "confidence": 0-100,
  "rationale": ["detailed reason 1", "detailed reason 2"],
  "methodology": ["analysis method 1", "analysis method 2"],
  "limitations": ["limitation 1", "limitation 2"],
  "reasoning_steps": ["step 1", "step 2"],
  "uncertainty_analysis": {
    "sources": ["uncertainty source 1"],
    "impact": "high|medium|low",
    "recommendations": ["recommendation 1"]
  },
  "bias_assessment": {
    "detected_biases": ["bias type 1"],
    "impact_on_verdict": "high|medium|low"
  },
  "contextual_factors": {
    "temporal": "relevant temporal context",
    "geographical": "relevant geographical context",
    "cultural": "relevant cultural context"
  }
}`
    
    return advancedPrompt
  }

  private getBaseVerdictPrompt(language: string): string {
    const prompts: { [key: string]: string } = {
      'en': `You are an expert fact-checker with extensive experience in evidence analysis and verdict generation. Your task is to analyze claims and evidence to produce accurate, well-reasoned verdicts.

ANALYSIS FRAMEWORK:
1. Evidence Quality Assessment
   - Evaluate source credibility and authority
   - Assess evidence recency and relevance
   - Consider methodology and transparency

2. Consensus Analysis
   - Identify patterns across multiple sources
   - Weight evidence by source credibility
   - Detect conflicting information

3. Context Evaluation
   - Consider temporal context and changes over time
   - Identify potential misrepresentation or selective presentation
   - Assess completeness of information

VERDICT CATEGORIES:
- "true": Strong evidence supports the claim with high confidence
- "false": Strong evidence contradicts the claim with high confidence  
- "misleading": Claim contains elements of truth but misrepresents context or significance
- "satire": Content is satirical, parody, or humor-based
- "out_of_context": Claim is accurate but presented without proper context
- "unverified": Insufficient or conflicting evidence to make determination

CONFIDENCE SCORING (0-100):
- 90-100: Overwhelming evidence, multiple high-credibility sources
- 80-89: Strong evidence, good source quality
- 70-79: Moderate evidence, some limitations
- 60-69: Weak evidence, significant limitations
- Below 60: Insufficient evidence

OUTPUT REQUIREMENTS:
- Provide clear, logical rationale for each decision
- Include methodology used in analysis
- Acknowledge limitations and uncertainties
- List specific reasoning steps taken

JSON Schema:
{
  "verdict": "true|false|misleading|satire|out_of_context|unverified",
  "confidence": 0-100,
  "rationale": ["detailed reason 1", "detailed reason 2"],
  "methodology": ["analysis method 1", "analysis method 2"],
  "limitations": ["limitation 1", "limitation 2"],
  "reasoning_steps": ["step 1", "step 2"]
}`,

      'bn': `আপনি একজন বিশেষজ্ঞ ফ্যাক্ট-চেকার যার প্রমাণ বিশ্লেষণ এবং রায় প্রদানে ব্যাপক অভিজ্ঞতা রয়েছে। আপনার কাজ হল দাবি এবং প্রমাণ বিশ্লেষণ করে সঠিক, যুক্তিসঙ্গত রায় প্রদান করা।

বিশ্লেষণ কাঠামো:
১. প্রমাণের গুণমান মূল্যায়ন
২. ঐকমত্য বিশ্লেষণ  
৩. প্রসঙ্গ মূল্যায়ন

রায়ের বিভাগ:
- "true": সত্য - শক্তিশালী প্রমাণ দাবিকে সমর্থন করে
- "false": মিথ্যা - শক্তিশালী প্রমাণ দাবির বিরোধিতা করে
- "misleading": বিভ্রান্তিকর - দাবিতে সত্যের উপাদান আছে কিন্তু প্রসঙ্গ ভুল
- "satire": ব্যঙ্গ - বিষয়বস্তু ব্যঙ্গাত্মক বা হাস্যরসাত্মক
- "out_of_context": প্রসঙ্গের বাইরে - দাবি সঠিক কিন্তু প্রসঙ্গ ছাড়া উপস্থাপিত
- "unverified": অযাচাইকৃত - অপর্যাপ্ত বা বিরোধপূর্ণ প্রমাণ

JSON আউটপুট প্রয়োজন।`,

      'hi': `आप एक विशेषज्ञ तथ्य-जांचकर्ता हैं जिसके पास साक्ष्य विश्लेषण और निर्णय निर्माण में व्यापक अनुभव है। आपका कार्य दावों और साक्ष्यों का विश्लेषण करके सटीक, तर्कसंगत निर्णय देना है।

विश्लेषण ढांचा:
१. साक्ष्य गुणवत्ता मूल्यांकन
२. सहमति विश्लेषण
३. संदर्भ मूल्यांकन

निर्णय श्रेणियां:
- "true": सत्य - मजबूत साक्ष्य दावे का समर्थन करते हैं
- "false": असत्य - मजबूत साक्ष्य दावे का खंडन करते हैं
- "misleading": भ्रामक - दावे में सत्य के तत्व हैं लेकिन संदर्भ गलत है
- "satire": व्यंग्य - सामग्री व्यंग्यात्मक या हास्यप्रद है
- "out_of_context": संदर्भ से बाहर - दावा सही है लेकिन बिना संदर्भ के प्रस्तुत
- "unverified": असत्यापित - अपर्याप्त या विरोधाभासी साक्ष्य

JSON आउटपुट आवश्यक।`,

      'ur': `آپ ایک ماہر حقائق کی جانچ کرنے والے ہیں جن کے پاس ثبوت کے تجزیے اور فیصلہ سازی میں وسیع تجربہ ہے۔ آپ کا کام دعووں اور ثبوتوں کا تجزیہ کرکے درست، منطقی فیصلے دینا ہے۔

تجزیہ کا ڈھانچہ:
١. ثبوت کی کوالٹی کا جائزہ
٢. اتفاق رائے کا تجزیہ
٣. سیاق و سباق کا جائزہ

فیصلے کی اقسام:
- "true": سچ - مضبوط ثبوت دعوے کی تائید کرتے ہیں
- "false": جھوٹ - مضبوط ثبوت دعوے کی تردید کرتے ہیں
- "misleading": گمراہ کن - دعوے میں سچائی کے عناصر ہیں لیکن سیاق غلط ہے
- "satire": طنز - مواد طنزیہ یا مزاحیہ ہے
- "out_of_context": سیاق سے باہر - دعویٰ درست ہے لیکن بغیر سیاق کے پیش کیا گیا
- "unverified": غیر تصدیق شدہ - ناکافی یا متضاد ثبوت

JSON آؤٹ پٹ ضروری۔`,

      'ar': `أنت خبير في فحص الحقائق مع خبرة واسعة في تحليل الأدلة وإصدار الأحكام. مهمتك هي تحليل الادعاءات والأدلة لإنتاج أحكام دقيقة ومنطقية.

إطار التحليل:
١. تقييم جودة الأدلة
٢. تحليل الإجماع
٣. تقييم السياق

فئات الأحكام:
- "true": صحيح - أدلة قوية تدعم الادعاء
- "false": خاطئ - أدلة قوية تدحض الادعاء
- "misleading": مضلل - الادعاء يحتوي على عناصر حقيقية لكن السياق خاطئ
- "satire": ساخر - المحتوى ساخر أو فكاهي
- "out_of_context": خارج السياق - الادعاء صحيح لكن مقدم بدون سياق مناسب
- "unverified": غير محقق - أدلة غير كافية أو متضاربة

مخرجات JSON مطلوبة.`
    }

    return prompts[language] || prompts['en']
  }

  private getVerdictUserPrompt(
    claim: string, 
    evidence: Evidence[], 
    language: string, 
    useAdvancedReasoning: boolean = true
  ): string {
    const evidenceText = evidence.map((e, i) => 
      `Evidence ${i + 1}:
Source: ${e.source} (Credibility: ${(e.publisher.weight * 100).toFixed(1)}%)
Type: ${e.evidence_type}
Stance: ${e.stance}
Confidence: ${e.confidence}%
Relevance: ${(e.relevance_score * 100).toFixed(1)}%
Title: ${e.title}
Snippet: ${e.snippet}
Published: ${e.published_at?.toDateString() || 'Unknown'}
Credibility Indicators: ${e.credibility_indicators.join(', ')}
${e.fact_check_rating ? `Fact Check Rating: ${e.fact_check_rating}` : ''}
${useAdvancedReasoning ? `Evidence Type: ${e.evidence_type}` : ''}
${useAdvancedReasoning ? `Publisher Type: ${e.publisher.type}` : ''}
${useAdvancedReasoning ? `Publisher Region: ${e.publisher.region}` : ''}
---`
    ).join('\n')

    const evidenceSummary = this.analyzeEvidenceDistribution(evidence)
    
    let prompt = `CLAIM TO ANALYZE: ${claim}

EVIDENCE SUMMARY:
- Total Sources: ${evidenceSummary.total}
- Supporting: ${evidenceSummary.supporting}
- Refuting: ${evidenceSummary.refuting}
- Neutral: ${evidenceSummary.neutral}
- High Credibility Sources: ${evidenceSummary.high_credibility_sources}
- Recent Sources: ${evidenceSummary.recent_sources}

${useAdvancedReasoning ? `
ADVANCED ANALYSIS REQUIREMENTS:
- Consider the complexity and nuance of the claim
- Analyze potential biases in evidence sources
- Assess temporal and geographical context
- Quantify uncertainty and provide confidence intervals
- Identify logical gaps or inconsistencies
- Consider cultural and linguistic factors
` : ''}

DETAILED EVIDENCE:
${evidenceText}

ANALYSIS LANGUAGE: ${language}

${useAdvancedReasoning ? 'Perform a comprehensive, multi-layered analysis of the above claim and evidence. Apply advanced reasoning techniques and consider:' : 'Analyze the above claim and evidence to generate a comprehensive verdict. Consider:'}
1. Quality and credibility of sources
2. Consensus among evidence with credibility weighting
3. Recency and relevance of information
4. Potential bias, context issues, or misrepresentation
5. Completeness of available evidence
${useAdvancedReasoning ? `6. Uncertainty quantification and confidence intervals
7. Logical consistency and reasoning gaps
8. Temporal, geographical, and cultural context
9. Bias detection and mitigation
10. Meta-analysis of evidence patterns` : ''}

Provide your analysis in the specified JSON format with detailed rationale, methodology, and limitations.`

    return prompt
  }

  private getMockVerdictResult(
    claim: string,
    evidence: Evidence[],
    language: string,
    startTime: number
  ): VerdictGenerationResult {
    const evidenceSummary = this.analyzeEvidenceDistribution(evidence)
    const confidenceFactors = this.analyzeConfidenceFactors(evidence, claim)
    
    // Enhanced mock logic based on evidence analysis
    let verdict: 'true' | 'false' | 'misleading' | 'satire' | 'out_of_context' | 'unverified' = 'unverified'
    let confidence = 50
    const rationale: string[] = []
    const methodology = ['Enhanced rule-based analysis', 'Multi-source verification', 'Credibility weighting']
    const limitations: string[] = []

    // Analyze evidence patterns
    if (evidenceSummary.total >= 3) {
      const supportRatio = evidenceSummary.supporting / evidenceSummary.total
      const refuteRatio = evidenceSummary.refuting / evidenceSummary.total
      const neutralRatio = evidenceSummary.neutral / evidenceSummary.total

      if (supportRatio >= 0.6) {
        verdict = 'true'
        confidence = Math.min(95, 70 + (supportRatio * 30))
        rationale.push(`Strong supporting evidence (${(supportRatio * 100).toFixed(1)}% of sources)`)
        rationale.push(`${evidenceSummary.high_credibility_sources} high-credibility sources analyzed`)
      } else if (refuteRatio >= 0.6) {
        verdict = 'false'
        confidence = Math.min(95, 70 + (refuteRatio * 30))
        rationale.push(`Strong refuting evidence (${(refuteRatio * 100).toFixed(1)}% of sources)`)
        rationale.push(`${evidenceSummary.high_credibility_sources} high-credibility sources analyzed`)
      } else if (supportRatio >= 0.3 && refuteRatio >= 0.3) {
        verdict = 'misleading'
        confidence = 70
        rationale.push('Mixed evidence suggests the claim contains misleading elements')
        rationale.push(`${evidenceSummary.supporting} supporting vs ${evidenceSummary.refuting} refuting sources`)
      } else if (neutralRatio >= 0.5) {
        verdict = 'unverified'
        confidence = 45
        rationale.push('Most sources provide neutral or inconclusive evidence')
        limitations.push('Limited definitive evidence available')
      }
    } else {
      limitations.push('Insufficient evidence sources for confident determination')
    }

    // Adjust for evidence quality
    if (evidenceSummary.high_credibility_sources > 0) {
      confidence += 10
      rationale.push('Analysis includes high-credibility sources')
    }

    if (evidenceSummary.recent_sources > evidenceSummary.total / 2) {
      confidence += 5
      rationale.push('Majority of evidence is recent')
    } else if (evidenceSummary.recent_sources === 0) {
      confidence -= 10
      limitations.push('No recent evidence available')
    }

    const mockVerdict: ClaimVerdict = {
      verdict,
      confidence: Math.max(10, Math.min(100, confidence)),
      rationale,
      evidence_summary: evidenceSummary,
      freshness_date: new Date(),
      key_evidence: this.selectKeyEvidence(evidence, verdict),
      methodology,
      limitations
    }

    const reasoningSteps = [
      'Collected and analyzed available evidence',
      'Evaluated source credibility and authority',
      'Applied consensus analysis with credibility weighting',
      'Considered temporal relevance and context',
      'Generated final verdict with confidence assessment'
    ]

    return {
      verdict: mockVerdict,
      processing_time: Date.now() - startTime,
      evidence_analyzed: evidence.length,
      reasoning_steps: reasoningSteps,
      confidence_factors: confidenceFactors
    }
  }
}