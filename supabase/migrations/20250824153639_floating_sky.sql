/*
  # Fix User Creation Database Error

  1. Database Functions
    - Drop and recreate the user creation trigger function with proper error handling
    - Ensure SECURITY DEFINER permissions for bypassing RLS
    - Add comprehensive error logging

  2. Triggers
    - Recreate trigger on auth.users table
    - Ensure trigger fires after INSERT operations

  3. Security Policies
    - Fix RLS policies that might block profile creation
    - Add service role policies for automatic operations

  4. Error Prevention
    - Add safeguards against duplicate profile creation
    - Handle edge cases in user metadata
*/

-- Drop existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_and_preferences();

-- Create improved function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user_and_preferences()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_name text;
  user_email text;
BEGIN
  -- Extract name from metadata, fallback to email prefix
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  -- Use confirmed email or email from metadata
  user_email := COALESCE(NEW.email, NEW.raw_user_meta_data->>'email');
  
  -- Insert profile with error handling
  BEGIN
    INSERT INTO public.profiles (
      id,
      name,
      email,
      plan,
      analysis_count,
      role,
      created_at
    ) VALUES (
      NEW.id,
      user_name,
      user_email,
      'free',
      0,
      'user',
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Profile already exists, skip
      RAISE NOTICE 'Profile already exists for user %', NEW.id;
    WHEN OTHERS THEN
      -- Log error but don't fail the auth operation
      RAISE WARNING 'Failed to create profile for user %: %', NEW.id, SQLERRM;
  END;
  
  -- Insert user preferences with error handling
  BEGIN
    INSERT INTO public.user_preferences (
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
      preferred_evidence_sources,
      confidence_threshold,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      'en',
      'light',
      'UTC',
      true,
      true,
      false,
      365,
      false,
      'en',
      ARRAY[]::text[],
      70,
      NOW(),
      NOW()
    );
  EXCEPTION
    WHEN unique_violation THEN
      -- Preferences already exist, skip
      RAISE NOTICE 'User preferences already exist for user %', NEW.id;
    WHEN OTHERS THEN
      -- Log error but don't fail the auth operation
      RAISE WARNING 'Failed to create user preferences for user %: %', NEW.id, SQLERRM;
  END;
  
  RETURN NEW;
END;
$$;

-- Create trigger on auth.users table
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_and_preferences();

-- Ensure RLS policies allow profile creation during signup
DROP POLICY IF EXISTS "Service role can manage profiles" ON public.profiles;
CREATE POLICY "Service role can manage profiles"
  ON public.profiles
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage preferences" ON public.user_preferences;
CREATE POLICY "Service role can manage preferences"
  ON public.user_preferences
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Ensure anon users can't directly manipulate profiles
DROP POLICY IF EXISTS "Anon users cannot access profiles" ON public.profiles;
CREATE POLICY "Anon users cannot access profiles"
  ON public.profiles
  FOR ALL
  TO anon
  USING (false)
  WITH CHECK (false);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.user_preferences TO service_role;