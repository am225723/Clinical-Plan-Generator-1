-- =====================================================
-- ENHANCED DATABASE SCHEMA FOR CLINICAL DOCUMENTATION APP
-- Version 2.0 - Extended Schema
-- Run this in your Supabase SQL Editor after NEXTJS_SUPABASE_SETUP.sql
-- =====================================================

-- 1. APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_name text NOT NULL,
  patient_id text,
  appointment_type text NOT NULL,
  location text,
  scheduled_time timestamp with time zone NOT NULL,
  duration_minutes integer DEFAULT 30,
  status text DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'no_show')),
  has_flag boolean DEFAULT false,
  flag_reason text,
  notes_pending boolean DEFAULT true,
  attached_note text,
  document_id uuid REFERENCES public.saved_documents(id) ON DELETE SET NULL,
  external_calendar_id text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can read own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert own appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete own appointments" ON public.appointments
  FOR DELETE USING (auth.uid() = doctor_id);

CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date 
  ON public.appointments (doctor_id, scheduled_time DESC);

CREATE INDEX IF NOT EXISTS idx_appointments_pending_notes 
  ON public.appointments (doctor_id, notes_pending) WHERE notes_pending = true;

-- 1b. TRANSCRIPTION JOBS TABLE (Audio/Video Processing)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.transcription_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  storage_path text NOT NULL,
  file_name text NOT NULL,
  file_type text NOT NULL CHECK (file_type IN ('audio', 'video')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  transcript text,
  error_message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.transcription_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can read own transcription jobs" ON public.transcription_jobs
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert own transcription jobs" ON public.transcription_jobs
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE POLICY "Doctors can update own transcription jobs" ON public.transcription_jobs
  FOR UPDATE USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can delete own transcription jobs" ON public.transcription_jobs
  FOR DELETE USING (auth.uid() = doctor_id);

CREATE INDEX IF NOT EXISTS idx_transcription_jobs_doctor_status 
  ON public.transcription_jobs (doctor_id, status, created_at DESC);

-- 2. ICD_CODE_USAGE TABLE (Track ICD-10 codes used in documents)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.icd_code_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.saved_documents(id) ON DELETE CASCADE,
  icd_code text NOT NULL,
  icd_description text,
  dsm5_code text,
  diagnosis_category text,
  is_primary boolean DEFAULT false,
  used_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.icd_code_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can read own icd usage" ON public.icd_code_usage
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert own icd usage" ON public.icd_code_usage
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE INDEX IF NOT EXISTS idx_icd_code_usage_doctor 
  ON public.icd_code_usage (doctor_id, icd_code);

CREATE INDEX IF NOT EXISTS idx_icd_code_usage_frequency 
  ON public.icd_code_usage (doctor_id, used_at DESC);

-- 3. DOCUMENT_SECTIONS TABLE (Template sections configuration)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.document_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.document_templates(id) ON DELETE CASCADE NOT NULL,
  section_key text NOT NULL,
  section_name text NOT NULL,
  section_order integer NOT NULL DEFAULT 0,
  is_required boolean DEFAULT false,
  is_protected boolean DEFAULT false,
  default_content text,
  ai_prompt_hint text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.document_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read sections via template" ON public.document_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.document_templates 
      WHERE id = template_id AND doctor_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert sections for own templates" ON public.document_sections
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.document_templates 
      WHERE id = template_id AND doctor_id = auth.uid()
    )
  );

CREATE POLICY "Users can update sections for own templates" ON public.document_sections
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.document_templates 
      WHERE id = template_id AND doctor_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete sections for own templates" ON public.document_sections
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.document_templates 
      WHERE id = template_id AND doctor_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_document_sections_template 
  ON public.document_sections (template_id, section_order);

-- 4. CLINICAL_GUARDRAILS TABLE
-- =====================================================
CREATE TABLE IF NOT EXISTS public.clinical_guardrails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES public.document_templates(id) ON DELETE CASCADE NOT NULL,
  guardrail_key text NOT NULL,
  guardrail_name text NOT NULL,
  description text,
  is_enabled boolean DEFAULT true,
  severity text DEFAULT 'warning' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.clinical_guardrails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage guardrails via template" ON public.clinical_guardrails
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.document_templates 
      WHERE id = template_id AND doctor_id = auth.uid()
    )
  );

-- 5. HEADER_FOOTER_TEMPLATES TABLE (Advanced header/footer)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.header_footer_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  template_name text NOT NULL,
  template_type text NOT NULL CHECK (template_type IN ('header', 'footer', 'first_page_header', 'first_page_footer')),
  content_html text,
  content_json jsonb,
  include_logo boolean DEFAULT true,
  include_page_numbers boolean DEFAULT false,
  include_date boolean DEFAULT false,
  include_patient_name boolean DEFAULT false,
  alignment text DEFAULT 'center' CHECK (alignment IN ('left', 'center', 'right')),
  font_size integer DEFAULT 10,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.header_footer_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can manage own header/footer templates" ON public.header_footer_templates
  FOR ALL USING (auth.uid() = doctor_id);

-- 6. DOCUMENT_ANALYTICS TABLE (Track usage stats)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.document_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  document_id uuid REFERENCES public.saved_documents(id) ON DELETE CASCADE,
  action_type text NOT NULL CHECK (action_type IN ('generated', 'refined', 'exported', 'signed', 'printed')),
  generation_time_ms integer,
  word_count integer,
  metadata jsonb,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.document_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors can read own analytics" ON public.document_analytics
  FOR SELECT USING (auth.uid() = doctor_id);

CREATE POLICY "Doctors can insert own analytics" ON public.document_analytics
  FOR INSERT WITH CHECK (auth.uid() = doctor_id);

CREATE INDEX IF NOT EXISTS idx_document_analytics_doctor_date 
  ON public.document_analytics (doctor_id, created_at DESC);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function: Get top ICD-10 codes for a doctor
CREATE OR REPLACE FUNCTION public.get_top_icd_codes(
  p_doctor_id uuid,
  p_limit integer DEFAULT 5
)
RETURNS TABLE (
  icd_code text,
  icd_description text,
  usage_count bigint
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    icu.icd_code,
    MAX(icu.icd_description) as icd_description,
    COUNT(*) as usage_count
  FROM public.icd_code_usage icu
  WHERE icu.doctor_id = p_doctor_id
  GROUP BY icu.icd_code
  ORDER BY usage_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Get pending notes count
CREATE OR REPLACE FUNCTION public.get_pending_notes_count(p_doctor_id uuid)
RETURNS integer AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)::integer
    FROM public.appointments
    WHERE doctor_id = p_doctor_id
      AND notes_pending = true
      AND status IN ('completed', 'in_progress')
      AND scheduled_time <= now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function: Auto-create document sections when template is created
CREATE OR REPLACE FUNCTION public.create_default_sections()
RETURNS trigger AS $$
DECLARE
  sections jsonb;
  section jsonb;
  section_order integer := 0;
BEGIN
  -- Get sections from pdf_config if exists
  sections := NEW.pdf_config->'sections';
  
  IF sections IS NOT NULL AND jsonb_array_length(sections) > 0 THEN
    FOR section IN SELECT * FROM jsonb_array_elements(sections)
    LOOP
      INSERT INTO public.document_sections (
        template_id,
        section_key,
        section_name,
        section_order,
        is_required,
        is_protected
      ) VALUES (
        NEW.id,
        section->>'id',
        section->>'name',
        section_order,
        COALESCE((section->>'required')::boolean, false),
        COALESCE((section->>'protected')::boolean, false)
      );
      section_order := section_order + 1;
    END LOOP;
  ELSE
    -- Create default sections based on template type
    CASE NEW.template_type
      WHEN 'treatment_plan' THEN
        INSERT INTO public.document_sections (template_id, section_key, section_name, section_order, is_required) VALUES
          (NEW.id, 'presenting_problem', 'Presenting Problem', 0, true),
          (NEW.id, 'psychiatric_history', 'Psychiatric History', 1, true),
          (NEW.id, 'mental_status_exam', 'Mental Status Examination', 2, true),
          (NEW.id, 'diagnosis', 'Diagnosis & ICD-10 Codes', 3, true),
          (NEW.id, 'treatment_goals', 'Treatment Goals (SMART)', 4, true),
          (NEW.id, 'interventions', 'Interventions', 5, true),
          (NEW.id, 'risk_assessment', 'Risk Assessment', 6, true),
          (NEW.id, 'medical_decision', 'Medical Decision Making', 7, false);
      WHEN 'darp_note' THEN
        INSERT INTO public.document_sections (template_id, section_key, section_name, section_order, is_required) VALUES
          (NEW.id, 'data', 'Data', 0, true),
          (NEW.id, 'assessment', 'Assessment', 1, true),
          (NEW.id, 'response', 'Response', 2, true),
          (NEW.id, 'plan', 'Plan', 3, true);
      WHEN 'psych_note' THEN
        INSERT INTO public.document_sections (template_id, section_key, section_name, section_order, is_required) VALUES
          (NEW.id, 'chief_complaint', 'Chief Complaint', 0, true),
          (NEW.id, 'hpi', 'History of Present Illness', 1, true),
          (NEW.id, 'psychiatric_history', 'Psychiatric History', 2, true),
          (NEW.id, 'medications', 'Current Medications', 3, true),
          (NEW.id, 'mse', 'Mental Status Examination', 4, true),
          (NEW.id, 'assessment', 'Assessment', 5, true),
          (NEW.id, 'plan', 'Plan', 6, true);
      WHEN 'progress_note' THEN
        INSERT INTO public.document_sections (template_id, section_key, section_name, section_order, is_required) VALUES
          (NEW.id, 'subjective', 'Subjective', 0, true),
          (NEW.id, 'objective', 'Objective', 1, true),
          (NEW.id, 'assessment', 'Assessment', 2, true),
          (NEW.id, 'plan', 'Plan', 3, true);
      WHEN 'discharge_summary' THEN
        INSERT INTO public.document_sections (template_id, section_key, section_name, section_order, is_required) VALUES
          (NEW.id, 'admission_reason', 'Reason for Admission', 0, true),
          (NEW.id, 'course_of_treatment', 'Course of Treatment', 1, true),
          (NEW.id, 'discharge_diagnosis', 'Discharge Diagnosis', 2, true),
          (NEW.id, 'medications', 'Discharge Medications', 3, true),
          (NEW.id, 'follow_up', 'Follow-up Plan', 4, true),
          (NEW.id, 'aftercare', 'Aftercare Recommendations', 5, true);
      ELSE
        INSERT INTO public.document_sections (template_id, section_key, section_name, section_order, is_required) VALUES
          (NEW.id, 'content', 'Content', 0, true);
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for auto-creating sections
DROP TRIGGER IF EXISTS on_template_created ON public.document_templates;
CREATE TRIGGER on_template_created
  AFTER INSERT ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.create_default_sections();

-- Function: Sync sections when template is updated
CREATE OR REPLACE FUNCTION public.sync_template_sections()
RETURNS trigger AS $$
DECLARE
  sections jsonb;
  section jsonb;
  section_order integer := 0;
BEGIN
  sections := NEW.pdf_config->'sections';
  
  IF sections IS NOT NULL AND sections IS DISTINCT FROM (OLD.pdf_config->'sections') THEN
    -- Delete existing sections
    DELETE FROM public.document_sections WHERE template_id = NEW.id;
    
    -- Insert new sections
    FOR section IN SELECT * FROM jsonb_array_elements(sections)
    LOOP
      INSERT INTO public.document_sections (
        template_id,
        section_key,
        section_name,
        section_order,
        is_required,
        is_protected
      ) VALUES (
        NEW.id,
        section->>'id',
        section->>'name',
        section_order,
        COALESCE((section->>'required')::boolean, false),
        COALESCE((section->>'protected')::boolean, false)
      );
      section_order := section_order + 1;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for syncing sections on update
DROP TRIGGER IF EXISTS on_template_updated ON public.document_templates;
CREATE TRIGGER on_template_updated
  AFTER UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.sync_template_sections();

-- =====================================================
-- VIEWS FOR DASHBOARD
-- =====================================================

-- View: Doctor dashboard stats
CREATE OR REPLACE VIEW public.doctor_dashboard_stats AS
SELECT 
  p.id as doctor_id,
  (SELECT COUNT(*) FROM public.appointments a WHERE a.doctor_id = p.id AND a.notes_pending = true AND a.status IN ('completed', 'in_progress')) as pending_notes_count,
  (SELECT COUNT(*) FROM public.saved_documents sd WHERE sd.doctor_id = p.id AND sd.created_at > now() - interval '7 days') as documents_this_week,
  (SELECT COUNT(*) FROM public.saved_documents sd WHERE sd.doctor_id = p.id AND sd.created_at > now() - interval '30 days') as documents_this_month,
  (SELECT COUNT(DISTINCT patient_name) FROM public.saved_documents sd WHERE sd.doctor_id = p.id) as total_patients
FROM public.profiles p
WHERE p.role = 'doctor';

-- =====================================================
-- SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample ICD codes reference (common psychiatric codes)
CREATE TABLE IF NOT EXISTS public.icd_codes_reference (
  code text PRIMARY KEY,
  description text NOT NULL,
  category text,
  dsm5_equivalent text
);

INSERT INTO public.icd_codes_reference (code, description, category, dsm5_equivalent) VALUES
  ('F32.1', 'Major depressive disorder, single episode, moderate', 'Mood Disorders', '296.22'),
  ('F32.2', 'Major depressive disorder, single episode, severe without psychotic features', 'Mood Disorders', '296.23'),
  ('F33.1', 'Major depressive disorder, recurrent, moderate', 'Mood Disorders', '296.32'),
  ('F41.1', 'Generalized anxiety disorder', 'Anxiety Disorders', '300.02'),
  ('F41.0', 'Panic disorder', 'Anxiety Disorders', '300.01'),
  ('F43.10', 'Post-traumatic stress disorder, unspecified', 'Trauma Disorders', '309.81'),
  ('F31.9', 'Bipolar disorder, unspecified', 'Mood Disorders', '296.80'),
  ('F20.9', 'Schizophrenia, unspecified', 'Psychotic Disorders', '295.90'),
  ('F90.9', 'Attention-deficit hyperactivity disorder, unspecified type', 'Neurodevelopmental', '314.01'),
  ('F42.9', 'Obsessive-compulsive disorder, unspecified', 'OCD Spectrum', '300.3'),
  ('F50.00', 'Anorexia nervosa, unspecified', 'Eating Disorders', '307.1'),
  ('F50.2', 'Bulimia nervosa', 'Eating Disorders', '307.51'),
  ('F10.20', 'Alcohol dependence, uncomplicated', 'Substance Use', '303.90'),
  ('F60.3', 'Borderline personality disorder', 'Personality Disorders', '301.83'),
  ('F84.0', 'Autistic disorder', 'Neurodevelopmental', '299.00')
ON CONFLICT (code) DO NOTHING;
