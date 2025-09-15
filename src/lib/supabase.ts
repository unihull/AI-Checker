import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  throw new Error('Supabase configuration is missing. Please check your environment variables.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
})

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          country: string | null
          plan: 'free' | 'pro' | 'enterprise'
          analysis_count: number
          role: 'user' | 'admin'
          created_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          country?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          analysis_count?: number
          role?: 'user' | 'admin'
          created_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          country?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          analysis_count?: number
          role?: 'user' | 'admin'
          created_at?: string
        }
      }
      analysis_reports: {
        Row: {
          id: string
          user_id: string | null
          input_type: 'image' | 'audio' | 'video' | 'screenshot' | 'url' | 'text'
          source_url: string | null
          file_hash: string | null
          language: string | null
          detection_summary: any
          factcheck_summary: any
          confidence: number | null
          processing_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          input_type: 'image' | 'audio' | 'video' | 'screenshot' | 'url' | 'text'
          source_url?: string | null
          file_hash?: string | null
          language?: string | null
          detection_summary?: any
          factcheck_summary?: any
          confidence?: number | null
          processing_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          input_type?: 'image' | 'audio' | 'video' | 'screenshot' | 'url' | 'text'
          source_url?: string | null
          file_hash?: string | null
          language?: string | null
          detection_summary?: any
          factcheck_summary?: any
          confidence?: number | null
          processing_ms?: number | null
          created_at?: string
        }
      }
    }
  }
}