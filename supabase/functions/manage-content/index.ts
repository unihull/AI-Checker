import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS'
}

interface ContentManagementRequest {
  action: 'delete_report' | 'override_verdict' | 'delete_claim' | 'delete_evidence' | 'moderate_content'
  target_id: string
  data?: any
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    // Verify admin user
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    )

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check admin role
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || profile.role !== 'admin') {
      return new Response(
        JSON.stringify({ error: 'Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { action, target_id, data }: ContentManagementRequest = await req.json()

    let result: any = {}

    switch (action) {
      case 'delete_report':
        result = await deleteAnalysisReport(supabaseClient, user.id, target_id)
        break
      case 'override_verdict':
        result = await overrideClaimVerdict(supabaseClient, user.id, target_id, data)
        break
      case 'delete_claim':
        result = await deleteClaim(supabaseClient, user.id, target_id)
        break
      case 'delete_evidence':
        result = await deleteEvidence(supabaseClient, user.id, target_id)
        break
      case 'moderate_content':
        result = await moderateContent(supabaseClient, user.id, target_id, data)
        break
      default:
        throw new Error(`Unsupported action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Content management error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Content management failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function deleteAnalysisReport(supabaseClient: any, adminId: string, reportId: string) {
  // Get report data before deletion
  const { data: report } = await supabaseClient
    .from('analysis_reports')
    .select('*')
    .eq('id', reportId)
    .single()

  // Delete report (cascading deletes will handle related records)
  const { error } = await supabaseClient
    .from('analysis_reports')
    .delete()
    .eq('id', reportId)

  if (error) throw error

  // Log admin action
  await supabaseClient.rpc('log_admin_action', {
    p_admin_user_id: adminId,
    p_action_type: 'delete_report',
    p_target_type: 'analysis_report',
    p_target_id: reportId,
    p_old_values: report,
    p_new_values: null
  })

  return { deleted_report_id: reportId }
}

async function overrideClaimVerdict(supabaseClient: any, adminId: string, claimId: string, verdictData: any) {
  // Get old verdict
  const { data: oldVerdict } = await supabaseClient
    .from('claim_verdicts')
    .select('*')
    .eq('claim_id', claimId)
    .single()

  // Update or insert verdict
  const { data: newVerdict, error } = await supabaseClient
    .from('claim_verdicts')
    .upsert({
      claim_id: claimId,
      verdict: verdictData.verdict,
      confidence: verdictData.confidence,
      rationale: verdictData.rationale,
      freshness_date: new Date().toISOString().split('T')[0]
    })
    .select()
    .single()

  if (error) throw error

  // Log admin action
  await supabaseClient.rpc('log_admin_action', {
    p_admin_user_id: adminId,
    p_action_type: 'override_verdict',
    p_target_type: 'claim_verdict',
    p_target_id: claimId,
    p_old_values: oldVerdict,
    p_new_values: newVerdict,
    p_metadata: { reason: verdictData.reason || 'Manual override' }
  })

  return { verdict: newVerdict }
}

async function deleteClaim(supabaseClient: any, adminId: string, claimId: string) {
  const { data: claim } = await supabaseClient
    .from('claims')
    .select('*')
    .eq('id', claimId)
    .single()

  const { error } = await supabaseClient
    .from('claims')
    .delete()
    .eq('id', claimId)

  if (error) throw error

  // Log admin action
  await supabaseClient.rpc('log_admin_action', {
    p_admin_user_id: adminId,
    p_action_type: 'delete_claim',
    p_target_type: 'claim',
    p_target_id: claimId,
    p_old_values: claim,
    p_new_values: null
  })

  return { deleted_claim_id: claimId }
}

async function deleteEvidence(supabaseClient: any, adminId: string, evidenceId: string) {
  const { data: evidence } = await supabaseClient
    .from('evidence')
    .select('*')
    .eq('id', evidenceId)
    .single()

  const { error } = await supabaseClient
    .from('evidence')
    .delete()
    .eq('id', evidenceId)

  if (error) throw error

  // Log admin action
  await supabaseClient.rpc('log_admin_action', {
    p_admin_user_id: adminId,
    p_action_type: 'delete_evidence',
    p_target_type: 'evidence',
    p_target_id: evidenceId,
    p_old_values: evidence,
    p_new_values: null
  })

  return { deleted_evidence_id: evidenceId }
}

async function moderateContent(supabaseClient: any, adminId: string, targetId: string, moderationData: any) {
  const { target_type, action, reason } = moderationData

  let result: any = {}

  switch (action) {
    case 'flag':
      // Add flagging logic here
      result = { flagged: true, reason }
      break
    case 'approve':
      // Add approval logic here
      result = { approved: true, reason }
      break
    case 'hide':
      // Add hiding logic here
      result = { hidden: true, reason }
      break
  }

  // Log admin action
  await supabaseClient.rpc('log_admin_action', {
    p_admin_user_id: adminId,
    p_action_type: `moderate_${action}`,
    p_target_type: target_type,
    p_target_id: targetId,
    p_metadata: { reason, action }
  })

  return result
}