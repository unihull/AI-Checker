import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, PUT, DELETE, OPTIONS'
}

interface UserManagementRequest {
  action: 'update_user' | 'delete_user' | 'reset_analysis_count' | 'change_plan' | 'toggle_user_status'
  user_id: string
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

    const { action, user_id, data }: UserManagementRequest = await req.json()

    let result: any = {}

    switch (action) {
      case 'update_user':
        result = await updateUser(supabaseClient, user.id, user_id, data)
        break
      case 'delete_user':
        result = await deleteUser(supabaseClient, user.id, user_id)
        break
      case 'reset_analysis_count':
        result = await resetAnalysisCount(supabaseClient, user.id, user_id)
        break
      case 'change_plan':
        result = await changePlan(supabaseClient, user.id, user_id, data.plan)
        break
      case 'toggle_user_status':
        result = await toggleUserStatus(supabaseClient, user.id, user_id, data.active)
        break
      default:
        throw new Error(`Unsupported action: ${action}`)
    }

    return new Response(
      JSON.stringify({ success: true, ...result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('User management error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'User management failed', 
        details: error.message 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function updateUser(supabaseClient: any, adminId: string, userId: string, updateData: any) {
  // Get old values for audit log
  const { data: oldUser } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Update user profile
  const { data: updatedUser, error } = await supabaseClient
    .from('profiles')
    .update({
      name: updateData.name,
      email: updateData.email,
      country: updateData.country,
      plan: updateData.plan,
      role: updateData.role
    })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error

  // Log admin action
  await supabaseClient.rpc('log_admin_action', {
    p_admin_user_id: adminId,
    p_action_type: 'update_user',
    p_target_type: 'profile',
    p_target_id: userId,
    p_old_values: oldUser,
    p_new_values: updatedUser
  })

  return { user: updatedUser }
}

async function deleteUser(supabaseClient: any, adminId: string, userId: string) {
  // Get user data before deletion for audit log
  const { data: userToDelete } = await supabaseClient
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Delete user (cascading deletes will handle related records)
  const { error } = await supabaseClient
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (error) throw error

  // Delete from auth.users
  const { error: authError } = await supabaseClient.auth.admin.deleteUser(userId)
  if (authError) console.error('Auth user deletion failed:', authError)

  // Log admin action
  await supabaseClient.rpc('log_admin_action', {
    p_admin_user_id: adminId,
    p_action_type: 'delete_user',
    p_target_type: 'profile',
    p_target_id: userId,
    p_old_values: userToDelete,
    p_new_values: null
  })

  return { deleted_user_id: userId }
}

async function resetAnalysisCount(supabaseClient: any, adminId: string, userId: string) {
  const { data: oldUser } = await supabaseClient
    .from('profiles')
    .select('analysis_count')
    .eq('id', userId)
    .single()

  const { data: updatedUser, error } = await supabaseClient
    .from('profiles')
    .update({ analysis_count: 0 })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error

  // Log admin action
  await supabaseClient.rpc('log_admin_action', {
    p_admin_user_id: adminId,
    p_action_type: 'reset_analysis_count',
    p_target_type: 'profile',
    p_target_id: userId,
    p_old_values: { analysis_count: oldUser.analysis_count },
    p_new_values: { analysis_count: 0 }
  })

  return { user: updatedUser }
}

async function changePlan(supabaseClient: any, adminId: string, userId: string, newPlan: string) {
  const { data: oldUser } = await supabaseClient
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single()

  const { data: updatedUser, error } = await supabaseClient
    .from('profiles')
    .update({ plan: newPlan })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error

  // Create subscription event
  await supabaseClient
    .from('subscription_events')
    .insert({
      user_id: userId,
      event_type: 'subscription_updated',
      previous_plan: oldUser.plan,
      new_plan: newPlan,
      metadata: { changed_by_admin: adminId }
    })

  // Log admin action
  await supabaseClient.rpc('log_admin_action', {
    p_admin_user_id: adminId,
    p_action_type: 'change_plan',
    p_target_type: 'profile',
    p_target_id: userId,
    p_old_values: { plan: oldUser.plan },
    p_new_values: { plan: newPlan }
  })

  return { user: updatedUser }
}

async function toggleUserStatus(supabaseClient: any, adminId: string, userId: string, active: boolean) {
  // For now, we'll manage this through analysis_count (set to -1 for disabled)
  const { data: oldUser } = await supabaseClient
    .from('profiles')
    .select('analysis_count')
    .eq('id', userId)
    .single()

  const newCount = active ? 0 : -1

  const { data: updatedUser, error } = await supabaseClient
    .from('profiles')
    .update({ analysis_count: newCount })
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error

  // Log admin action
  await supabaseClient.rpc('log_admin_action', {
    p_admin_user_id: adminId,
    p_action_type: active ? 'enable_user' : 'disable_user',
    p_target_type: 'profile',
    p_target_id: userId,
    p_old_values: { status: active ? 'disabled' : 'active' },
    p_new_values: { status: active ? 'active' : 'disabled' }
  })

  return { user: updatedUser, status: active ? 'active' : 'disabled' }
}