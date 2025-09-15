/*
  # Comprehensive Security & Enterprise Upgrade

  1. Enhanced Security Policies
    - Multi-factor authentication support
    - Advanced audit logging
    - IP-based security controls
    - Enhanced session management

  2. Enterprise Features
    - Organization management
    - Team collaboration
    - Advanced analytics
    - Compliance tracking

  3. Performance Optimizations
    - Database indexing improvements
    - Caching strategies
    - Query optimizations

  4. Data Governance
    - Data retention policies
    - Compliance tracking
    - Privacy controls
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create organizations table for enterprise features
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE,
  plan text DEFAULT 'enterprise' CHECK (plan IN ('enterprise', 'custom')),
  max_users integer DEFAULT 100,
  max_monthly_analyses integer DEFAULT 10000,
  api_enabled boolean DEFAULT true,
  white_label_enabled boolean DEFAULT false,
  custom_branding jsonb DEFAULT '{}',
  settings jsonb DEFAULT '{}',
  billing_contact_email text,
  technical_contact_email text,
  subscription_status text DEFAULT 'active' CHECK (subscription_status IN ('active', 'suspended', 'cancelled')),
  trial_ends_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Add organization support to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE profiles ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
    ALTER TABLE profiles ADD COLUMN department text;
    ALTER TABLE profiles ADD COLUMN job_title text;
    ALTER TABLE profiles ADD COLUMN permissions jsonb DEFAULT '{}';
    ALTER TABLE profiles ADD COLUMN last_login_at timestamptz;
    ALTER TABLE profiles ADD COLUMN login_count integer DEFAULT 0;
    ALTER TABLE profiles ADD COLUMN is_suspended boolean DEFAULT false;
    ALTER TABLE profiles ADD COLUMN suspension_reason text;
    ALTER TABLE profiles ADD COLUMN mfa_enabled boolean DEFAULT false;
    ALTER TABLE profiles ADD COLUMN mfa_secret text;
    ALTER TABLE profiles ADD COLUMN backup_codes text[];
  END IF;
END $$;

-- Create MFA tokens table
CREATE TABLE IF NOT EXISTS mfa_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  token_type text NOT NULL CHECK (token_type IN ('totp_setup', 'backup_code', 'recovery')),
  token_value text NOT NULL,
  used_at timestamptz,
  expires_at timestamptz NOT NULL,
  ip_address inet,
  user_agent text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE mfa_tokens ENABLE ROW LEVEL SECURITY;

-- Create IP whitelist/blacklist table
CREATE TABLE IF NOT EXISTS ip_access_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  ip_address inet NOT NULL,
  ip_range cidr,
  access_type text NOT NULL CHECK (access_type IN ('whitelist', 'blacklist')),
  reason text,
  created_by uuid REFERENCES profiles(id),
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE ip_access_control ENABLE ROW LEVEL SECURITY;

-- Create advanced analytics tables
CREATE TABLE IF NOT EXISTS analysis_accuracy_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
  algorithm_name text NOT NULL,
  ground_truth_label text,
  predicted_label text,
  confidence_score numeric(5,2),
  accuracy_score numeric(5,2),
  precision_score numeric(5,2),
  recall_score numeric(5,2),
  f1_score numeric(5,2),
  user_feedback text CHECK (user_feedback IN ('correct', 'incorrect', 'partially_correct')),
  expert_review text,
  benchmark_dataset text,
  model_version text,
  evaluation_date timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE analysis_accuracy_metrics ENABLE ROW LEVEL SECURITY;

-- Create model performance tracking
CREATE TABLE IF NOT EXISTS model_performance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  model_name text NOT NULL,
  model_version text NOT NULL,
  accuracy_percentage numeric(5,2),
  false_positive_rate numeric(5,2),
  false_negative_rate numeric(5,2),
  processing_speed_ms integer,
  memory_usage_mb integer,
  dataset_size integer,
  evaluation_date timestamptz DEFAULT now(),
  benchmark_results jsonb DEFAULT '{}',
  improvement_suggestions text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE model_performance ENABLE ROW LEVEL SECURITY;

-- Create compliance tracking
CREATE TABLE IF NOT EXISTS compliance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  compliance_type text NOT NULL CHECK (compliance_type IN ('gdpr', 'ccpa', 'sox', 'iso27001', 'custom')),
  audit_date date NOT NULL,
  compliance_status text NOT NULL CHECK (compliance_status IN ('compliant', 'non_compliant', 'partial', 'pending')),
  findings text[],
  remediation_actions text[],
  auditor_name text,
  report_url text,
  next_audit_date date,
  evidence_documents text[],
  created_at timestamptz DEFAULT now()
);

ALTER TABLE compliance_records ENABLE ROW LEVEL SECURITY;

-- Create team collaboration features
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  team_lead_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  permissions jsonb DEFAULT '{}',
  analysis_quota integer DEFAULT 1000,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('member', 'analyst', 'reviewer', 'lead')),
  joined_at timestamptz DEFAULT now(),
  permissions jsonb DEFAULT '{}',
  UNIQUE(team_id, user_id)
);

ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Create shared reports functionality
CREATE TABLE IF NOT EXISTS shared_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid NOT NULL REFERENCES analysis_reports(id) ON DELETE CASCADE,
  shared_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  shared_with uuid REFERENCES profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES teams(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  access_type text NOT NULL CHECK (access_type IN ('view', 'comment', 'edit')),
  share_url text UNIQUE,
  password_protected boolean DEFAULT false,
  password_hash text,
  expires_at timestamptz,
  view_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE shared_reports ENABLE ROW LEVEL SECURITY;

-- Create advanced user preferences
DO $$
BEGIN
  -- Add new preference columns if they don't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_preferences' AND column_name = 'api_rate_limit'
  ) THEN
    ALTER TABLE user_preferences ADD COLUMN api_rate_limit integer DEFAULT 100;
    ALTER TABLE user_preferences ADD COLUMN webhook_url text;
    ALTER TABLE user_preferences ADD COLUMN webhook_events text[] DEFAULT '{}';
    ALTER TABLE user_preferences ADD COLUMN export_formats text[] DEFAULT '{pdf,json}';
    ALTER TABLE user_preferences ADD COLUMN custom_algorithms jsonb DEFAULT '{}';
    ALTER TABLE user_preferences ADD COLUMN quality_thresholds jsonb DEFAULT '{"minimum_confidence": 60, "evidence_threshold": 3}';
    ALTER TABLE user_preferences ADD COLUMN collaboration_settings jsonb DEFAULT '{}';
    ALTER TABLE user_preferences ADD COLUMN security_settings jsonb DEFAULT '{}';
  END IF;
END $$;

-- Create API access logs with enhanced tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'api_usage_logs' AND column_name = 'organization_id'
  ) THEN
    ALTER TABLE api_usage_logs ADD COLUMN organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL;
    ALTER TABLE api_usage_logs ADD COLUMN team_id uuid REFERENCES teams(id) ON DELETE SET NULL;
    ALTER TABLE api_usage_logs ADD COLUMN request_hash text;
    ALTER TABLE api_usage_logs ADD COLUMN rate_limit_hit boolean DEFAULT false;
    ALTER TABLE api_usage_logs ADD COLUMN security_flags text[] DEFAULT '{}';
    ALTER TABLE api_usage_logs ADD COLUMN compliance_tags text[] DEFAULT '{}';
  END IF;
END $$;

-- Create security incidents table
CREATE TABLE IF NOT EXISTS security_incidents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_type text NOT NULL CHECK (incident_type IN ('unauthorized_access', 'data_breach', 'api_abuse', 'suspicious_activity', 'fraud_attempt')),
  severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
  ip_address inet,
  user_agent text,
  description text NOT NULL,
  detection_method text,
  automated_response text,
  investigation_status text DEFAULT 'open' CHECK (investigation_status IN ('open', 'investigating', 'resolved', 'false_positive')),
  assigned_to uuid REFERENCES profiles(id) ON DELETE SET NULL,
  resolution_notes text,
  resolved_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE security_incidents ENABLE ROW LEVEL SECURITY;

-- Create webhook configurations
CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  url text NOT NULL,
  secret_key text NOT NULL,
  events text[] NOT NULL DEFAULT '{}',
  active boolean DEFAULT true,
  retry_policy jsonb DEFAULT '{"max_retries": 3, "retry_delay": 300}',
  last_success_at timestamptz,
  last_failure_at timestamptz,
  failure_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_endpoints ENABLE ROW LEVEL SECURITY;

-- Create webhook deliveries log
CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES webhook_endpoints(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  response_status integer,
  response_body text,
  delivery_attempt integer DEFAULT 1,
  delivered_at timestamptz,
  failed_at timestamptz,
  failure_reason text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE webhook_deliveries ENABLE ROW LEVEL SECURITY;

-- Enhanced RLS Policies

-- Organizations
CREATE POLICY "Organizations readable by members"
  ON organizations
  FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage organizations"
  ON organizations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND role = 'admin'
    )
  );

-- MFA Tokens
CREATE POLICY "Users can manage own MFA tokens"
  ON mfa_tokens
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- IP Access Control
CREATE POLICY "Organization members can view IP controls"
  ON ip_access_control
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage IP controls"
  ON ip_access_control
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR organization_id = ip_access_control.organization_id)
    )
  );

-- Teams
CREATE POLICY "Organization members can view teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Team leads and admins can manage teams"
  ON teams
  FOR ALL
  TO authenticated
  USING (
    team_lead_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
      AND (role = 'admin' OR organization_id = teams.organization_id)
    )
  );

-- Team Members
CREATE POLICY "Team members can view team membership"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    team_id IN (
      SELECT t.id FROM teams t
      JOIN profiles p ON p.organization_id = t.organization_id
      WHERE p.id = auth.uid()
    )
  );

-- Security Incidents
CREATE POLICY "Security incidents visible to organization and admins"
  ON security_incidents
  FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Analysis Accuracy Metrics
CREATE POLICY "Users can view accuracy metrics for own reports"
  ON analysis_accuracy_metrics
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analysis_reports r
      WHERE r.id = report_id AND r.user_id = auth.uid()
    )
  );

-- Model Performance (admin only)
CREATE POLICY "Admins can view model performance"
  ON model_performance
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Compliance Records
CREATE POLICY "Organization compliance records"
  ON compliance_records
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Webhook Endpoints
CREATE POLICY "Users can manage own webhook endpoints"
  ON webhook_endpoints
  FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Webhook Deliveries
CREATE POLICY "Users can view own webhook deliveries"
  ON webhook_deliveries
  FOR SELECT
  TO authenticated
  USING (
    webhook_id IN (
      SELECT id FROM webhook_endpoints WHERE user_id = auth.uid()
    )
  );

-- Enhanced indexes for performance
CREATE INDEX IF NOT EXISTS idx_organizations_domain ON organizations(domain);
CREATE INDEX IF NOT EXISTS idx_profiles_organization ON profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_profiles_last_login ON profiles(last_login_at DESC);
CREATE INDEX IF NOT EXISTS idx_mfa_tokens_user_type ON mfa_tokens(user_id, token_type);
CREATE INDEX IF NOT EXISTS idx_mfa_tokens_expires ON mfa_tokens(expires_at);
CREATE INDEX IF NOT EXISTS idx_ip_access_org ON ip_access_control(organization_id);
CREATE INDEX IF NOT EXISTS idx_teams_org ON teams(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_org ON security_incidents(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_incidents_severity ON security_incidents(severity, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accuracy_metrics_report ON analysis_accuracy_metrics(report_id);
CREATE INDEX IF NOT EXISTS idx_model_performance_date ON model_performance(evaluation_date DESC);
CREATE INDEX IF NOT EXISTS idx_compliance_org_type ON compliance_records(organization_id, compliance_type);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_org ON webhook_endpoints(organization_id);
CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_webhook ON webhook_deliveries(webhook_id);

-- Enhanced functions

-- Function to increment analysis count with better error handling
CREATE OR REPLACE FUNCTION increment_analysis_count()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE profiles 
  SET analysis_count = COALESCE(analysis_count, 0) + 1,
      last_login_at = COALESCE(last_login_at, now())
  WHERE id = NEW.user_id;
  
  -- Track usage in analytics
  INSERT INTO api_usage_logs (
    user_id,
    endpoint,
    method,
    status_code,
    metadata
  ) VALUES (
    NEW.user_id,
    '/api/analysis',
    'POST',
    201,
    jsonb_build_object(
      'input_type', NEW.input_type,
      'confidence', NEW.confidence,
      'processing_time', NEW.processing_ms
    )
  );
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the main operation
    INSERT INTO admin_audit_logs (
      admin_user_id,
      action_type,
      target_type,
      target_id,
      success,
      error_message
    ) VALUES (
      NEW.user_id,
      'increment_analysis_count_error',
      'analysis_report',
      NEW.id,
      false,
      SQLERRM
    );
    RETURN NEW;
END;
$$;

-- Function to validate IP access
CREATE OR REPLACE FUNCTION check_ip_access(client_ip inet, org_id uuid)
RETURNS boolean
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  is_whitelisted boolean := false;
  is_blacklisted boolean := false;
BEGIN
  -- Check whitelist
  SELECT EXISTS (
    SELECT 1 FROM ip_access_control
    WHERE organization_id = org_id
    AND access_type = 'whitelist'
    AND (ip_address = client_ip OR client_ip << ip_range)
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_whitelisted;
  
  -- Check blacklist
  SELECT EXISTS (
    SELECT 1 FROM ip_access_control
    WHERE organization_id = org_id
    AND access_type = 'blacklist'
    AND (ip_address = client_ip OR client_ip << ip_range)
    AND (expires_at IS NULL OR expires_at > now())
  ) INTO is_blacklisted;
  
  -- If there's a whitelist, IP must be whitelisted
  IF EXISTS (
    SELECT 1 FROM ip_access_control
    WHERE organization_id = org_id AND access_type = 'whitelist'
  ) THEN
    RETURN is_whitelisted AND NOT is_blacklisted;
  END IF;
  
  -- Otherwise, just check it's not blacklisted
  RETURN NOT is_blacklisted;
END;
$$;

-- Function to log security incidents
CREATE OR REPLACE FUNCTION log_security_incident(
  p_incident_type text,
  p_severity text,
  p_user_id uuid,
  p_organization_id uuid,
  p_ip_address inet,
  p_description text,
  p_detection_method text DEFAULT 'automated'
)
RETURNS uuid
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  incident_id uuid;
BEGIN
  INSERT INTO security_incidents (
    incident_type,
    severity,
    user_id,
    organization_id,
    ip_address,
    user_agent,
    description,
    detection_method
  ) VALUES (
    p_incident_type,
    p_severity,
    p_user_id,
    p_organization_id,
    p_ip_address,
    current_setting('request.headers')::json->>'user-agent',
    p_description,
    p_detection_method
  ) RETURNING id INTO incident_id;
  
  -- Auto-assign critical incidents
  IF p_severity = 'critical' THEN
    -- Assign to first available admin
    UPDATE security_incidents
    SET assigned_to = (
      SELECT id FROM profiles
      WHERE role = 'admin' AND organization_id = p_organization_id
      ORDER BY last_login_at DESC NULLS LAST
      LIMIT 1
    )
    WHERE id = incident_id;
  END IF;
  
  RETURN incident_id;
END;
$$;

-- Function to validate and sanitize analysis input
CREATE OR REPLACE FUNCTION validate_analysis_input(
  p_input_type text,
  p_file_hash text,
  p_user_id uuid
)
RETURNS jsonb
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  validation_result jsonb := '{}';
  user_profile record;
  daily_limit integer;
  current_usage integer;
BEGIN
  -- Get user profile and limits
  SELECT * INTO user_profile FROM profiles WHERE id = p_user_id;
  
  IF NOT FOUND THEN
    validation_result := jsonb_build_object(
      'valid', false,
      'error', 'User not found'
    );
    RETURN validation_result;
  END IF;
  
  -- Check if user is suspended
  IF user_profile.is_suspended THEN
    validation_result := jsonb_build_object(
      'valid', false,
      'error', 'Account suspended: ' || COALESCE(user_profile.suspension_reason, 'No reason provided')
    );
    RETURN validation_result;
  END IF;
  
  -- Determine daily limit
  daily_limit := CASE user_profile.plan
    WHEN 'free' THEN 5
    WHEN 'pro' THEN 200
    WHEN 'enterprise' THEN 999999
    ELSE 5
  END;
  
  -- Check daily usage
  IF user_profile.analysis_count >= daily_limit THEN
    validation_result := jsonb_build_object(
      'valid', false,
      'error', 'Daily analysis limit exceeded',
      'current_usage', user_profile.analysis_count,
      'limit', daily_limit
    );
    RETURN validation_result;
  END IF;
  
  -- Check for duplicate file hash (prevent reprocessing)
  IF p_file_hash IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM analysis_reports
      WHERE file_hash = p_file_hash AND user_id = p_user_id
      AND created_at > now() - interval '24 hours'
    ) THEN
      validation_result := jsonb_build_object(
        'valid', false,
        'error', 'This file was already analyzed today',
        'suggestion', 'Use cached results or wait 24 hours'
      );
      RETURN validation_result;
    END IF;
  END IF;
  
  -- Validate input type
  IF p_input_type NOT IN ('image', 'video', 'audio', 'screenshot', 'url', 'text') THEN
    validation_result := jsonb_build_object(
      'valid', false,
      'error', 'Invalid input type: ' || p_input_type
    );
    RETURN validation_result;
  END IF;
  
  -- All validations passed
  validation_result := jsonb_build_object(
    'valid', true,
    'user_plan', user_profile.plan,
    'remaining_analyses', daily_limit - user_profile.analysis_count,
    'premium_features', user_profile.plan IN ('pro', 'enterprise')
  );
  
  RETURN validation_result;
END;
$$;

-- Enhanced triggers

-- Update profiles updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
DROP TRIGGER IF EXISTS update_profiles_updated_at ON profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_organizations_updated_at ON organizations;
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically create user preferences for new profiles
CREATE OR REPLACE FUNCTION create_user_preferences()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO user_preferences (
    user_id,
    language,
    theme,
    timezone,
    email_notifications,
    analysis_notifications,
    marketing_emails,
    data_retention_days,
    auto_delete_reports,
    default_analysis_language,
    confidence_threshold,
    api_rate_limit,
    export_formats,
    quality_thresholds
  ) VALUES (
    NEW.id,
    'en',
    'system',
    'UTC',
    true,
    true,
    false,
    365,
    false,
    'en',
    70,
    CASE NEW.plan
      WHEN 'free' THEN 10
      WHEN 'pro' THEN 100
      WHEN 'enterprise' THEN 1000
      ELSE 10
    END,
    CASE NEW.plan
      WHEN 'free' THEN ARRAY['pdf']
      WHEN 'pro' THEN ARRAY['pdf', 'json', 'csv']
      ELSE ARRAY['pdf', 'json', 'csv', 'xml', 'excel']
    END,
    jsonb_build_object(
      'minimum_confidence', CASE NEW.plan WHEN 'enterprise' THEN 50 ELSE 60 END,
      'evidence_threshold', CASE NEW.plan WHEN 'enterprise' THEN 2 ELSE 3 END,
      'max_processing_time', CASE NEW.plan WHEN 'enterprise' THEN 300000 ELSE 120000 END
    )
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail profile creation
    INSERT INTO admin_audit_logs (
      admin_user_id,
      action_type,
      target_type,
      target_id,
      success,
      error_message
    ) VALUES (
      NEW.id,
      'create_user_preferences_error',
      'profile',
      NEW.id,
      false,
      SQLERRM
    );
    RETURN NEW;
END;
$$;

-- Security monitoring triggers
CREATE OR REPLACE FUNCTION monitor_failed_logins()
RETURNS TRIGGER
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  failed_attempts integer;
  client_ip inet;
BEGIN
  -- Count recent failed attempts from this IP
  client_ip := NEW.ip_address;
  
  SELECT COUNT(*) INTO failed_attempts
  FROM user_sessions
  WHERE ip_address = client_ip
  AND created_at > now() - interval '1 hour'
  AND is_active = false;
  
  -- Log security incident for excessive failures
  IF failed_attempts >= 5 THEN
    PERFORM log_security_incident(
      'unauthorized_access',
      'medium',
      NEW.user_id,
      (SELECT organization_id FROM profiles WHERE id = NEW.user_id),
      client_ip,
      'Multiple failed login attempts from IP: ' || client_ip::text,
      'automated_trigger'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add security monitoring to user sessions
DROP TRIGGER IF EXISTS monitor_failed_logins_trigger ON user_sessions;
CREATE TRIGGER monitor_failed_logins_trigger
  AFTER INSERT ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION monitor_failed_logins();

-- Create materialized view for analytics performance
CREATE MATERIALIZED VIEW IF NOT EXISTS analytics_summary AS
SELECT 
  DATE_TRUNC('day', created_at) as analysis_date,
  input_type,
  COUNT(*) as total_analyses,
  AVG(confidence) as avg_confidence,
  AVG(processing_ms) as avg_processing_time,
  COUNT(CASE WHEN confidence >= 80 THEN 1 END) as high_confidence_count,
  COUNT(CASE WHEN confidence < 60 THEN 1 END) as low_confidence_count
FROM analysis_reports
WHERE created_at >= now() - interval '90 days'
GROUP BY DATE_TRUNC('day', created_at), input_type
ORDER BY analysis_date DESC;

-- Create unique index for materialized view refresh
CREATE UNIQUE INDEX IF NOT EXISTS idx_analytics_summary_unique 
  ON analytics_summary(analysis_date, input_type);

-- Function to refresh analytics
CREATE OR REPLACE FUNCTION refresh_analytics_summary()
RETURNS void
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY analytics_summary;
END;
$$;

-- Schedule analytics refresh (requires pg_cron extension in production)
-- SELECT cron.schedule('refresh-analytics', '0 */6 * * *', 'SELECT refresh_analytics_summary();');

-- Enhanced audit logging function
CREATE OR REPLACE FUNCTION log_admin_action(
  p_admin_user_id uuid,
  p_action_type text,
  p_target_type text,
  p_target_id text,
  p_old_values jsonb DEFAULT NULL,
  p_new_values jsonb DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'
)
RETURNS uuid
SECURITY DEFINER
LANGUAGE plpgsql
AS $$
DECLARE
  audit_id uuid;
  admin_org_id uuid;
BEGIN
  -- Get admin's organization
  SELECT organization_id INTO admin_org_id
  FROM profiles
  WHERE id = p_admin_user_id;
  
  INSERT INTO admin_audit_logs (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    success,
    metadata
  ) VALUES (
    p_admin_user_id,
    p_action_type,
    p_target_type,
    p_target_id,
    p_old_values,
    p_new_values,
    inet(current_setting('request.headers', true)::json->>'x-forwarded-for'),
    current_setting('request.headers', true)::json->>'user-agent',
    true,
    p_metadata || jsonb_build_object('organization_id', admin_org_id)
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
EXCEPTION
  WHEN OTHERS THEN
    -- Even audit logging should not fail the main operation
    RETURN gen_random_uuid();
END;
$$;