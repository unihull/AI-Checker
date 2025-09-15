import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import { SecurityService } from '@/lib/security'

interface Profile {
  id: string
  name: string | null
  email: string | null
  plan: 'free' | 'pro' | 'enterprise'
  analysis_count: number
  role: 'user' | 'admin'
  created_at: string
  mfa_enabled?: boolean
  organization_id?: string | null
}

interface AuthState {
  user: User | null
  profile: Profile | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signUp: (email: string, password: string, name: string) => Promise<void>
  signOut: () => Promise<void>
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  loading: true,

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        throw error
      }
      
      if (data.user) {
        // Fetch profile after successful login
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single()
          
          set({ user: data.user, profile })
          
          // Create session in background (non-blocking)
          createUserSessionAsync(data.user.id).catch(error => {
            console.warn('Session creation failed:', error)
          })
          
        } catch (profileError) {
          console.warn('Profile fetch failed:', profileError)
          set({ user: data.user, profile: null })
        }
      }
    } catch (error) {
      console.error('Login error:', error)
      throw error
    }
  },

  signUp: async (email: string, password: string, name: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      })
      
      if (error) {
        throw error
      }
      
      if (data.user) {
        set({ user: data.user })
        
        // Wait for profile creation with retry
        if (data.user.email_confirmed_at) {
          const profile = await fetchProfileWithRetry(data.user.id, 5)
          if (profile) {
            set({ profile })
          }
        }
      }
    } catch (error) {
      console.error('Signup error:', error)
      throw error
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut()
      set({ user: null, profile: null })
    } catch (error) {
      console.error('Signout error:', error)
    }
  },

  initialize: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single()
          
          set({ user, profile })
        } catch (error) {
          console.warn('Profile fetch failed during initialization:', error)
          set({ user, profile: null })
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
    } finally {
      set({ loading: false })
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange(async (event, session) => {
      try {
        if (event === 'SIGNED_IN' && session?.user) {
          const profile = await fetchProfileWithRetry(session.user.id, 3)
          set({ user: session.user, profile })
        } else if (event === 'SIGNED_OUT') {
          set({ user: null, profile: null })
        }
      } catch (error) {
        console.error('Auth state change error:', error)
      }
    })
  }
}))

// Simplified session creation
async function createUserSessionAsync(userId: string) {
  try {
    const clientInfo = await SecurityService.getClientInfo()
    
    await supabase
      .from('user_sessions')
      .insert({
        user_id: userId,
        session_token: crypto.randomUUID(),
        ip_address: clientInfo.ip,
        user_agent: clientInfo.userAgent,
        country: clientInfo.country,
        city: clientInfo.city,
        device_type: clientInfo.deviceType,
        browser: clientInfo.browser,
        os: clientInfo.os
      })
  } catch (error) {
    console.warn('Session creation failed:', error)
  }
}

// Helper function to fetch profile with retry
async function fetchProfileWithRetry(userId: string, maxRetries: number = 3): Promise<Profile | null> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()
      
      if (profile) {
        return profile
      }
      
      if (error && attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
        continue
      }
      
      return null
    } catch (error) {
      console.warn(`Profile fetch attempt ${attempt} failed:`, error)
      
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, attempt * 1000))
      }
    }
  }
  
  return null
}

function getBrowserName(): string {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Chrome')) return 'Chrome'
  if (userAgent.includes('Firefox')) return 'Firefox'
  if (userAgent.includes('Safari')) return 'Safari'
  if (userAgent.includes('Edge')) return 'Edge'
  return 'Unknown'
}

function getOSName(): string {
  const userAgent = navigator.userAgent
  if (userAgent.includes('Windows')) return 'Windows'
  if (userAgent.includes('Mac')) return 'macOS'
  if (userAgent.includes('Linux')) return 'Linux'
  if (userAgent.includes('Android')) return 'Android'
  if (userAgent.includes('iOS')) return 'iOS'
  return 'Unknown'
}