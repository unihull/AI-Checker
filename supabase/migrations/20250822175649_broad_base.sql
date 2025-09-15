/*
  # Add detailed analysis and user management tables

  1. New Tables
    - `algorithm_results` - Store individual algorithm results for each analysis
    - `claim_analysis_metadata` - Store detailed metadata for fact-check analyses  
    - `user_sessions` - Track user sessions and activity
    - `api_usage_logs` - Log API usage for monitoring and billing
    - `user_preferences` - Store user preferences and settings
    - `password_reset_tokens` - Handle password reset functionality
    - `subscription_events` - Track subscription changes and billing events

  2. Security
    - Enable RLS on all new tables
    - Add appropriate policies for user data access
    - Add policies for admin access to logs and usage data

  3. Indexes
    - Add performance indexes for common queries
    - Add composite indexes for complex filtering
*/

-- Algorithm results table for detailed forensic analysis storage
CREATE TABLE IF NOT EXISTS algorithm_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES analysis_reports(id) ON DELETE CASCADE,
  algorithm_name text NOT NULL,
  score numeric NOT NULL CHECK (score >= 0 AND score <= 100),
  status text NOT NULL CHECK (status IN ('authentic', 'suspicious', 'manipulated')),
  details jsonb DEFAULT '{}',
  processing_order integer DEFAULT 0,
  processing_time_ms integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE algorithm_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read algorithm results of own reports"
  ON algorithm_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analysis_reports r 
      WHERE r.id = algorithm_results.report_id 
      AND r.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can read all algorithm results"
  ON algorithm_results
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Claim analysis metadata for detailed fact-check storage
CREATE TABLE IF NOT EXISTS claim_analysis_metadata (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  methodology text[] DEFAULT '{}',
  limitations text[] DEFAULT '{}',
  confidence_factors jsonb DEFAULT '{}',
  search_queries text[] DEFAULT '{}',
  processing_stats jsonb DEFAULT '{}',
  uncertainty_analysis jsonb DEFAULT '{}',
  bias_assessment jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE claim_analysis_metadata ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read metadata of own claims"
  ON claim_analysis_metadata
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM claims c 
      JOIN analysis_reports r ON r.id = c.report_id
      WHERE c.id = claim_analysis_metadata.claim_id 
      AND r.user_id = auth.uid()
    )
  );

-- User sessions for activity tracking
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  ip_address inet,
  user_agent text,
  country text,
  city text,
  device_type text,
  browser text,
  os text,
  is_active boolean DEFAULT true,
  last_activity timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '30 days')
);

ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own sessions"
  ON user_sessions
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own sessions"
  ON user_sessions
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- API usage logs for monitoring
CREATE TABLE IF NOT EXISTS api_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  endpoint text NOT NULL,
  method text NOT NULL,
  status_code integer NOT NULL,
  response_time_ms integer,
  request_size_bytes integer,
  response_size_bytes integer,
  ip_address inet,
  user_agent text,
  api_key_used text,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE api_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read all API logs"
  ON api_usage_logs
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

CREATE POLICY "Users can read own API logs"
  ON api_usage_logs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  language text DEFAULT 'en' CHECK (language IN ('en', 'bn', 'hi', 'ur', 'ar')),
  theme text DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'system')),
  timezone text DEFAULT 'UTC',
  email_notifications boolean DEFAULT true,
  analysis_notifications boolean DEFAULT true,
  marketing_emails boolean DEFAULT false,
  data_retention_days integer DEFAULT 365 CHECK (data_retention_days >= 30),
  auto_delete_reports boolean DEFAULT false,
  default_analysis_language text DEFAULT 'en',
  preferred_evidence_sources text[] DEFAULT '{}',
  confidence_threshold integer DEFAULT 70 CHECK (confidence_threshold >= 0 AND confidence_threshold <= 100),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own preferences"
  ON user_preferences
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Password reset tokens
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reset tokens"
  ON password_reset_tokens
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Subscription events for billing tracking
CREATE TABLE IF NOT EXISTS subscription_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN ('subscription_created', 'subscription_updated', 'subscription_cancelled', 'payment_succeeded', 'payment_failed', 'trial_started', 'trial_ended')),
  previous_plan text,
  new_plan text,
  amount_cents integer,
  currency text DEFAULT 'USD',
  stripe_event_id text,
  stripe_subscription_id text,
  metadata jsonb DEFAULT '{}',
  processed_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own subscription events"
  ON subscription_events
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can read all subscription events"
  ON subscription_events
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() 
      AND p.role = 'admin'
    )
  );

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_algorithm_results_report_id ON algorithm_results(report_id);
CREATE INDEX IF NOT EXISTS idx_algorithm_results_algorithm_name ON algorithm_results(algorithm_name);
CREATE INDEX IF NOT EXISTS idx_algorithm_results_score ON algorithm_results(score DESC);

CREATE INDEX IF NOT EXISTS idx_claim_metadata_claim_id ON claim_analysis_metadata(claim_id);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_active ON user_sessions(is_active, last_activity DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

CREATE INDEX IF NOT EXISTS idx_api_logs_user_id ON api_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_api_logs_endpoint ON api_usage_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_api_logs_created_at ON api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_logs_status ON api_usage_logs(status_code);

CREATE INDEX IF NOT EXISTS idx_subscription_events_user_id ON subscription_events(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_events_type ON subscription_events(event_type);
CREATE INDEX IF NOT EXISTS idx_subscription_events_created_at ON subscription_events(created_at DESC);

-- Function to automatically create user preferences
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create preferences when profile is created
DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION create_user_preferences();

-- Function to clean up expired sessions
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS void AS $$
BEGIN
  UPDATE user_sessions 
  SET is_active = false 
  WHERE expires_at < now() AND is_active = true;
  
  DELETE FROM user_sessions 
  WHERE expires_at < now() - interval '7 days';
END;
$$ LANGUAGE plpgsql;

-- Function to clean up expired reset tokens
CREATE OR REPLACE FUNCTION cleanup_expired_reset_tokens()
RETURNS void AS $$
BEGIN
  DELETE FROM password_reset_tokens 
  WHERE expires_at < now();
END;
$$ LANGUAGE plpgsql;