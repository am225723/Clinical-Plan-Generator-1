-- =====================================================
-- SUPABASE DATABASE SETUP FOR CLINICAL DOCUMENTATION APP
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. PROFILES TABLE (extends auth.users)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('admin', 'doctor')),
  full_name text,
  email text,
  disabled boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users can read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can update their own profile (limited fields)
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Admins can read all profiles
CREATE POLICY "Admins can read all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Service role can do everything (for edge functions)
CREATE POLICY "Service role full access" ON public.profiles
  FOR ALL USING (auth.role() = 'service_role');

-- 2. APP_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_plan_prompt text NOT NULL DEFAULT 'Role: Expert Clinical Psychiatrist.
Task: Generate a structured mental health treatment plan JSON from the provided clinical inputs.

REQUIREMENTS:
- Strictly follow the JSON structure provided.
- Use professional clinical language.
- Infer missing data where reasonable based on context, or label as "Not documented".
- Diagnoses must include ICD-10 and DSM-5-TR codes.
- Treatment goals must be SMART.',
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Admins and doctors can read settings
CREATE POLICY "Authenticated users can read settings" ON public.app_settings
  FOR SELECT USING (auth.role() = 'authenticated');

-- Only admins can update settings (enforced via edge function)
CREATE POLICY "Service role can update settings" ON public.app_settings
  FOR ALL USING (auth.role() = 'service_role');

-- Insert default settings if not exists
INSERT INTO public.app_settings (id) 
SELECT gen_random_uuid() 
WHERE NOT EXISTS (SELECT 1 FROM public.app_settings);

-- 3. DOCTOR_DOCUMENT_SETTINGS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.doctor_document_settings (
  doctor_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  logo_url text,
  header_config jsonb DEFAULT '{"text": "", "alignment": "center"}'::jsonb,
  footer_config jsonb DEFAULT '{"text": "", "alignment": "center"}'::jsonb,
  first_page_header_config jsonb DEFAULT '{"text": "", "alignment": "center"}'::jsonb,
  first_page_footer_config jsonb DEFAULT '{"text": "", "alignment": "center"}'::jsonb,
  patient_field_layout jsonb DEFAULT '{"order": ["patient_name", "client_id", "date_of_birth", "date_of_service", "provider_name"]}'::jsonb,
  pdf_style jsonb DEFAULT '{"font_size": 12, "font_family": "Arial"}'::jsonb,
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctor_document_settings ENABLE ROW LEVEL SECURITY;

-- Doctors can read/write only their own settings
CREATE POLICY "Doctors can read own settings" ON public.doctor_document_settings
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert own settings" ON public.doctor_document_settings
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own settings" ON public.doctor_document_settings
  FOR UPDATE USING (auth.uid() = doctor_id);

-- Service role can do everything
CREATE POLICY "Service role full access on doctor settings" ON public.doctor_document_settings
  FOR ALL USING (auth.role() = 'service_role');

-- 4. TREATMENT_PLANS TABLE (optional - for saving plans)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id text,
  client_id text,
  patient_data jsonb,
  inputs jsonb,
  generated_plan jsonb,
  date_of_service date,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

-- Users can only access their own plans
CREATE POLICY "Users can read own plans" ON public.treatment_plans
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own plans" ON public.treatment_plans
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own plans" ON public.treatment_plans
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own plans" ON public.treatment_plans
  FOR DELETE USING (auth.uid() = user_id);

-- 5. HELPER FUNCTION: Auto-create profile on signup
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'role', 'doctor'),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 6. STORAGE BUCKET FOR LOGOS
-- =====================================================
-- Run this in Storage settings or via SQL:
INSERT INTO storage.buckets (id, name, public)
VALUES ('logos', 'logos', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies
CREATE POLICY "Authenticated users can upload logos" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'logos' AND
    auth.role() = 'authenticated'
  );

CREATE POLICY "Public can view logos" ON storage.objects
  FOR SELECT USING (bucket_id = 'logos');

CREATE POLICY "Users can update own logos" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own logos" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'logos' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- 7. DOCUMENT_TEMPLATES TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('treatment_plan', 'darp_note', 'psych_note', 'progress_note', 'discharge_summary', 'custom')),
  ai_prompt text NOT NULL,
  pdf_config jsonb DEFAULT '{}'::jsonb,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

-- Doctors can read/write only their own templates
CREATE POLICY "Doctors can read own templates" ON public.document_templates
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert own templates" ON public.document_templates
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own templates" ON public.document_templates
  FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete own templates" ON public.document_templates
  FOR DELETE USING (auth.uid() = doctor_id);

-- Service role full access
CREATE POLICY "Service role full access on templates" ON public.document_templates
  FOR ALL USING (auth.role() = 'service_role');

-- 8. SAVED_DOCUMENTS TABLE (Document History)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.saved_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_id uuid REFERENCES public.document_templates(id) ON DELETE SET NULL,
  template_type text NOT NULL,
  patient_name text NOT NULL,
  client_id text,
  date_of_service date NOT NULL,
  patient_data jsonb NOT NULL,
  clinical_inputs jsonb,
  generated_content jsonb NOT NULL,
  pdf_html text,
  status text DEFAULT 'draft' CHECK (status IN ('draft', 'final', 'signed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.saved_documents ENABLE ROW LEVEL SECURITY;

-- Doctors can only access their own documents
CREATE POLICY "Doctors can read own documents" ON public.saved_documents
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert own documents" ON public.saved_documents
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own documents" ON public.saved_documents
  FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete own documents" ON public.saved_documents
  FOR DELETE USING (auth.uid() = doctor_id);

-- Service role full access
CREATE POLICY "Service role full access on documents" ON public.saved_documents
  FOR ALL USING (auth.role() = 'service_role');

-- Index for fast patient search
CREATE INDEX IF NOT EXISTS idx_saved_documents_patient_search 
  ON public.saved_documents USING gin (to_tsvector('english', patient_name));

CREATE INDEX IF NOT EXISTS idx_saved_documents_doctor_date 
  ON public.saved_documents (doctor_id, date_of_service DESC);

-- =====================================================
-- SEED DATA: Test Accounts
-- =====================================================
-- NOTE: Create these accounts via Supabase Auth dashboard or Edge Function
-- 
-- Admin Account:
--   Email: admin@goldstandard.local
--   Password: Admin123!
--   Role: admin
--
-- Doctor Account:
--   Email: doctor@goldstandard.local  
--   Password: Doctor123!
--   Role: doctor
--
-- After creating users in Auth, update their profiles:
-- UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@goldstandard.local';
