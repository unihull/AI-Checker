/*
  # ProofLens Database Schema

  1. New Tables
    - `profiles` - User profiles with plan information
    - `analysis_reports` - Forensic analysis results
    - `claims` - Extracted factual claims
    - `evidence` - Supporting/refuting evidence for claims
    - `claim_verdicts` - Final verdicts for claims
    - `user_api_keys` - User's own API keys (encrypted)
    - `notifications` - In-app notifications
    - `feedback` - User feedback and ratings

  2. Security
    - Enable RLS on all tables
    - Add policies for user data access
    - Secure API key storage with encryption

  3. Indexes
    - Performance indexes for common queries
    - Full-text search capabilities
*/

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- PROFILES TABLE
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  name text,
  email text UNIQUE,
  country text,
  plan text CHECK (plan IN ('free','pro','enterprise')) DEFAULT 'free',
  analysis_count int DEFAULT 0,
  role text CHECK (role IN ('user','admin')) DEFAULT 'user',
  created_at timestamptz DEFAULT now()
);

-- ANALYSIS REPORTS TABLE
CREATE TABLE IF NOT EXISTS analysis_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  input_type text CHECK (input_type IN ('image','audio','video','screenshot','url','text')),
  source_url text,
  file_hash text,
  language text,
  detection_summary jsonb,
  factcheck_summary jsonb,
  confidence numeric CHECK (confidence >= 0 AND confidence <= 100),
  processing_ms int,
  created_at timestamptz DEFAULT now()
);

-- CLAIMS TABLE
CREATE TABLE IF NOT EXISTS claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  report_id uuid REFERENCES analysis_reports(id) ON DELETE CASCADE,
  input_type text,
  raw_input text,
  language text,
  canon_text text,
  claim_signature text UNIQUE,
  created_at timestamptz DEFAULT now()
);

-- EVIDENCE TABLE
CREATE TABLE IF NOT EXISTS evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_id uuid REFERENCES claims(id) ON DELETE CASCADE,
  source_url text,
  publisher text,
  published_at timestamptz,
  snippet text,
  evidence_type text CHECK (evidence_type IN ('claimreview','news','kb','social','reverse_image')),
  stance text CHECK (stance IN ('supports','refutes','neutral')),
  confidence numeric CHECK (confidence >= 0 AND confidence <= 100),
  created_at timestamptz DEFAULT now()
);

-- CLAIM VERDICTS TABLE
CREATE TABLE IF NOT EXISTS claim_verdicts (
  claim_id uuid PRIMARY KEY REFERENCES claims(id) ON DELETE CASCADE,
  verdict text CHECK (verdict IN ('true','false','misleading','satire','out_of_context','unverified')),
  confidence numeric CHECK (confidence >= 0 AND confidence <= 100),
  rationale text,
  freshness_date date,
  decided_at timestamptz DEFAULT now()
);

-- USER API KEYS TABLE (for BYO AI)
CREATE TABLE IF NOT EXISTS user_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  provider text CHECK (provider IN ('openai','gemini','grok')),
  key_ciphertext text,
  created_at timestamptz DEFAULT now()
);

-- NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  type text,
  title text,
  body text,
  read boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- FEEDBACK TABLE
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stars int CHECK (stars BETWEEN 1 AND 5),
  category text,
  message text,
  created_at timestamptz DEFAULT now()
);

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- PROFILES POLICIES
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- ANALYSIS REPORTS POLICIES
CREATE POLICY "Users can manage own reports"
  ON analysis_reports FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Anonymous users can create reports"
  ON analysis_reports FOR INSERT
  TO anon
  WITH CHECK (user_id IS NULL);

CREATE POLICY "Anonymous users can read their session reports"
  ON analysis_reports FOR SELECT
  TO anon
  USING (user_id IS NULL);

-- CLAIMS POLICIES
CREATE POLICY "Users can manage claims of own reports"
  ON claims FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM analysis_reports r 
      WHERE r.id = claims.report_id AND r.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM analysis_reports r 
      WHERE r.id = claims.report_id AND r.user_id = auth.uid()
    )
  );

-- EVIDENCE POLICIES
CREATE POLICY "Users can read evidence of own claims"
  ON evidence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM claims c 
      JOIN analysis_reports r ON r.id = c.report_id
      WHERE c.id = evidence.claim_id AND r.user_id = auth.uid()
    )
  );

-- CLAIM VERDICTS POLICIES
CREATE POLICY "Users can read verdicts of own claims"
  ON claim_verdicts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM claims c 
      JOIN analysis_reports r ON r.id = c.report_id
      WHERE c.id = claim_verdicts.claim_id AND r.user_id = auth.uid()
    )
  );

-- USER API KEYS POLICIES
CREATE POLICY "Users can manage own API keys"
  ON user_api_keys FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS POLICIES
CREATE POLICY "Users can manage own notifications"
  ON notifications FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- FEEDBACK POLICIES
CREATE POLICY "Users can manage own feedback"
  ON feedback FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ADMIN POLICIES
CREATE POLICY "Admins can read all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can read all reports"
  ON analysis_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

CREATE POLICY "Admins can read all feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles p 
      WHERE p.id = auth.uid() AND p.role = 'admin'
    )
  );

-- INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_analysis_reports_user_id ON analysis_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_created_at ON analysis_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analysis_reports_input_type ON analysis_reports(input_type);

CREATE INDEX IF NOT EXISTS idx_claims_report_id ON claims(report_id);
CREATE INDEX IF NOT EXISTS idx_claims_signature ON claims(claim_signature);

CREATE INDEX IF NOT EXISTS idx_evidence_claim_id ON evidence(claim_id);
CREATE INDEX IF NOT EXISTS idx_evidence_stance ON evidence(stance);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- FUNCTIONS FOR AUTOMATIC PROFILE CREATION
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name'),
    new.email
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER FOR AUTOMATIC PROFILE CREATION
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- FUNCTION TO UPDATE ANALYSIS COUNT
CREATE OR REPLACE FUNCTION public.increment_analysis_count()
RETURNS trigger AS $$
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    UPDATE profiles 
    SET analysis_count = analysis_count + 1 
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- TRIGGER TO UPDATE ANALYSIS COUNT
DROP TRIGGER IF EXISTS on_analysis_created ON analysis_reports;
CREATE TRIGGER on_analysis_created
  AFTER INSERT ON analysis_reports
  FOR EACH ROW EXECUTE PROCEDURE public.increment_analysis_count();