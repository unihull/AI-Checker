import { DetectionEngine } from '../../../src/engine/DetectionEngine.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface AnalyzeRequest {
  inputType: 'image' | 'audio' | 'video' | 'screenshot' | 'url' | 'text'
  sourceUrl?: string
  base64Data?: string
  fileName?: string
  fileHash?: string
  language?: string
  options?: {
    premium?: boolean
    algorithms?: string[]
    sensitivity?: 'low' | 'medium' | 'high'
  }
}

Deno.serve(async (req) => {
  console.log('=== ANALYZE CONTENT FUNCTION STARTED ===')
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
    )

    const requestBody = await req.json().catch(error => {
      console.error('Request body parsing failed:', error)
      throw new Error('Invalid request format')
    })

    const { 
      inputType, 
      sourceUrl, 
      base64Data, 
      fileName, 
      fileHash,
      language = 'en',
      options = {} 
    }: AnalyzeRequest = requestBody

    console.log('Request received:', {
      inputType,
      hasBase64Data: !!base64Data,
      fileName,
      language
    })

    // Simple user validation
    const authHeader = req.headers.get('Authorization')
    let userId = null
    let userPlan = 'free'
    
    if (authHeader) {
      try {
        const { data: { user } } = await supabaseClient.auth.getUser(
          authHeader.replace('Bearer ', '')
        )
        
        if (user) {
          userId = user.id
          
          const { data: profile } = await supabaseClient
            .from('profiles')
            .select('plan, analysis_count')
            .eq('id', user.id)
            .single()

          if (profile) {
            userPlan = profile.plan
            
            const dailyLimit = profile.plan === 'free' ? 5 : profile.plan === 'pro' ? 200 : 999999
            
            if (profile.analysis_count >= dailyLimit) {
              return new Response(
                JSON.stringify({ 
                  error: 'Daily analysis limit exceeded',
                  current_usage: profile.analysis_count,
                  limit: dailyLimit
                }),
                { 
                  status: 429, 
                  headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
                }
              )
            }
          }
        }
      } catch (error) {
        console.warn('User validation failed:', error)
      }
    }

    // Initialize detection engine and perform analysis
    const startTime = Date.now()
    const detectionEngine = new DetectionEngine()
    
    // Prepare data for analysis
    let analysisData: File | string
    if (base64Data) {
      analysisData = base64Data
    } else if (sourceUrl) {
      analysisData = sourceUrl
    } else {
      throw new Error('No data provided for analysis')
    }
    
    // Enhanced options with user plan
    const enhancedOptions = {
      ...options,
      premium: userPlan === 'pro' || userPlan === 'enterprise'
    }
    
    const detectionResult = await detectionEngine.analyzeContent(
      inputType,
      analysisData,
      fileName,
      enhancedOptions
    )

    const processingTime = Date.now() - startTime
    detectionResult.processing_time = processingTime

    // Store analysis report
    try {
      if (userId) {
        const { data: report } = await supabaseClient
          .from('analysis_reports')
          .insert({
            user_id: userId,
            input_type: inputType,
            source_url: sourceUrl,
            file_hash: fileHash,
            language: language,
            detection_summary: detectionResult,
            confidence: detectionResult.overall_confidence,
            processing_ms: processingTime
          })
          .select()
          .single()

        // Increment user analysis count
        if (report) {
          await supabaseClient
            .from('profiles')
            .update({ 
              analysis_count: supabaseClient.rpc('increment', { x: 1, row_id: userId })
            })
            .eq('id', userId)
        }
      }
    } catch (error) {
      console.warn('Database storage failed:', error)
    }

    const responseData = {
      success: true,
      detection_summary: detectionResult,
      processing_time: processingTime,
      user_plan: userPlan
    }

    console.log('=== ANALYZE CONTENT FUNCTION COMPLETED ===')

    return new Response(
      JSON.stringify(responseData),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('=== ANALYZE CONTENT FUNCTION ERROR ===', error)
    
    return new Response(
      JSON.stringify({
        error: 'Analysis failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

// Import after function definitions
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'