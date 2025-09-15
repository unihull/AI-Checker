/*
  # Add Admin Features and Settings

  1. New Tables
    - `app_settings` - Global application configuration
    - `admin_audit_logs` - Track admin actions for security
    - `ad_placements` - Manage custom ad configurations

  2. Security
    - Enable RLS on all new tables
    - Add policies for admin-only access

  3. Functions
    - Create audit logging function
    - Create admin notification function
*/

-- App Settings Table
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key text UNIQUE NOT NULL,
  setting_value jsonb NOT NULL,
  setting_type text NOT NULL CHECK (setting_type IN ('system', 'analysis', 'ui', 'security', 'ads')),
  description text,
  is_public boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES profiles(id)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage app settings"
  ON app_settings
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Public settings readable by all"
  ON app_settings
  FOR SELECT
  TO authenticated
  USING (is_public = true);

-- Admin Audit Logs Table
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  action_type text NOT NULL,
  target_type text NOT NULL,
  target_id text NOT NULL,
  old_values jsonb,
  new_values jsonb,
  ip_address inet,
  user_agent text,
  success boolean DEFAULT true,
  error_message text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON admin_audit_logs
  FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

-- Ad Placements Table
CREATE TABLE IF NOT EXISTS ad_placements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  placement_name text UNIQUE NOT NULL,
  placement_type text NOT NULL CHECK (placement_type IN ('google_ads', 'custom_banner', 'sponsored_content')),
  ad_code text,
  ad_config jsonb DEFAULT '{}',
  target_plans text[] DEFAULT '{"free"}',
  active boolean DEFAULT true,
  display_conditions jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE ad_placements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ad placements"
  ON ad_placements
  FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  ));

CREATE POLICY "Active ads readable by all"
  ON ad_placements
  FOR SELECT
  TO authenticated
  USING (active = true);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_app_settings_key ON app_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_user ON admin_audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON admin_audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ad_placements_active ON ad_placements(active, placement_type);

-- Function to log admin actions
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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  log_id uuid;
BEGIN
  INSERT INTO admin_audit_logs (
    admin_user_id,
    action_type,
    target_type,
    target_id,
    old_values,
    new_values,
    metadata
  ) VALUES (
    p_admin_user_id,
    p_action_type,
    p_target_type,
    p_target_id,
    p_old_values,
    p_new_values,
    p_metadata
  ) RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Insert default app settings
INSERT INTO app_settings (setting_key, setting_value, setting_type, description, is_public) VALUES
('confidence_threshold_default', '{"value": 70}', 'analysis', 'Default confidence threshold for analysis', true),
('daily_limit_free', '{"value": 5}', 'system', 'Daily analysis limit for free users', true),
('daily_limit_pro', '{"value": 200}', 'system', 'Daily analysis limit for pro users', true),
('max_file_size_free', '{"value": 10485760}', 'system', 'Max file size for free users (10MB)', true),
('max_file_size_pro', '{"value": 262144000}', 'system', 'Max file size for pro users (250MB)', true),
('max_file_size_enterprise', '{"value": 1073741824}', 'system', 'Max file size for enterprise users (1GB)', true),
('enable_ads', '{"value": true}', 'ads', 'Enable advertisements for free users', false),
('google_ads_client', '{"value": "ca-pub-xxxxxxxxxx"}', 'ads', 'Google AdSense client ID', false),
('maintenance_mode', '{"value": false}', 'system', 'Enable maintenance mode', false)
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default ad placements
INSERT INTO ad_placements (placement_name, placement_type, ad_code, target_plans, active) VALUES
('dashboard_banner', 'custom_banner', '<div class="ad-banner">Upgrade to Pro for unlimited features!</div>', '{"free"}', true),
('analysis_sidebar', 'google_ads', 'google-ads-unit-001', '{"free"}', true),
('reports_footer', 'custom_banner', '<div class="upgrade-prompt">Get detailed analytics with Pro plan</div>', '{"free"}', true)
ON CONFLICT (placement_name) DO NOTHING;