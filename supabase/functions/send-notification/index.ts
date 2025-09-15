import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

interface NotificationRequest {
  user_id: string
  type: 'analysis_complete' | 'fact_check_complete' | 'system_alert' | 'plan_upgrade' | 'security_alert'
  title: string
  body: string
  metadata?: any
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

    const { user_id, type, title, body, metadata = {} }: NotificationRequest = await req.json()

    // Store notification in database
    const { data: notification, error } = await supabaseClient
      .from('notifications')
      .insert({
        user_id,
        type,
        title,
        body,
        read: false
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to store notification: ${error.message}`)
    }

    // Get user preferences for notification delivery
    const { data: preferences } = await supabaseClient
      .from('user_preferences')
      .select('email_notifications, analysis_notifications')
      .eq('user_id', user_id)
      .single()

    // Send email notification if enabled
    if (preferences?.email_notifications && 
        (type === 'analysis_complete' ? preferences.analysis_notifications : true)) {
      
      const { data: profile } = await supabaseClient
        .from('profiles')
        .select('email, name')
        .eq('id', user_id)
        .single()

      if (profile?.email) {
        await sendEmailNotification(profile.email, profile.name, title, body, type)
      }
    }

    // Send push notification if supported
    if (metadata.push_token) {
      await sendPushNotification(metadata.push_token, title, body)
    }

    return new Response(
      JSON.stringify({
        success: true,
        notification_id: notification.id,
        delivered_via: ['database', 'email', 'push'].filter(Boolean)
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Notification error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Notification failed', 
        details: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})

async function sendEmailNotification(email: string, name: string, title: string, body: string, type: string) {
  try {
    // Use Resend API for email sending
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    
    if (resendApiKey) {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'ProofLens <noreply@prooflens.com>',
          to: [email],
          subject: title,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #1f2937;">${title}</h2>
              <p>Hello ${name || 'User'},</p>
              <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
                ${body}
              </div>
              <p style="color: #6b7280; font-size: 14px;">
                This is an automated notification from ProofLens. 
                You can manage your notification preferences in your account settings.
              </p>
            </div>
          `
        })
      })
      
      if (response.ok) {
        console.log(`Email sent successfully to ${email}`)
        return true
      } else {
        console.error('Email sending failed:', await response.text())
      }
    }
  } catch (error) {
    console.error('Email notification error:', error)
  }
  
  // Fallback: log the notification
  console.log(`Email notification logged for ${email}: ${title}`)
  return false
}

async function sendPushNotification(pushToken: string, title: string, body: string) {
  try {
    // Use Firebase Cloud Messaging for push notifications
    const fcmServerKey = Deno.env.get('FCM_SERVER_KEY')
    
    if (fcmServerKey) {
      const response = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Authorization': `key=${fcmServerKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          to: pushToken,
          notification: {
            title,
            body,
            icon: '/favicon.ico',
            click_action: 'https://prooflens.com'
          },
          data: {
            timestamp: new Date().toISOString(),
            type: 'prooflens_notification'
          }
        })
      })
      
      if (response.ok) {
        console.log(`Push notification sent successfully`)
        return true
      } else {
        console.error('Push notification failed:', await response.text())
      }
    }
  } catch (error) {
    console.error('Push notification error:', error)
  }
  
  // Fallback: log the notification
  console.log(`Push notification logged: ${title}`)
  return false
}