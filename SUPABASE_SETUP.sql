-- ============================================================
-- SUPABASE DATABASE SETUP FOR GOLD STANDARD CLINICAL
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to set up the database
-- Dashboard → SQL Editor → New Query → Paste this → Run

-- ============================================================
-- 1. PATIENTS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dob TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_client_id ON patients(client_id);

-- ============================================================
-- 2. TREATMENT PLANS TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS treatment_plans (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  patient_id TEXT,
  client_id TEXT,
  inputs JSONB,
  generated_plan JSONB,
  date_of_service TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_treatment_plans_user_id ON treatment_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_patient_id ON treatment_plans(patient_id);
CREATE INDEX IF NOT EXISTS idx_treatment_plans_date ON treatment_plans(date_of_service);

-- ============================================================
-- 3. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatment_plans ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. RLS POLICIES - Users can only access their own data
-- ============================================================

-- Patients policies
DROP POLICY IF EXISTS "Users can view own patients" ON patients;
CREATE POLICY "Users can view own patients" 
  ON patients FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own patients" ON patients;
CREATE POLICY "Users can insert own patients" 
  ON patients FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own patients" ON patients;
CREATE POLICY "Users can update own patients" 
  ON patients FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own patients" ON patients;
CREATE POLICY "Users can delete own patients" 
  ON patients FOR DELETE 
  USING (auth.uid() = user_id);

-- Treatment plans policies
DROP POLICY IF EXISTS "Users can view own plans" ON treatment_plans;
CREATE POLICY "Users can view own plans" 
  ON treatment_plans FOR SELECT 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own plans" ON treatment_plans;
CREATE POLICY "Users can insert own plans" 
  ON treatment_plans FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own plans" ON treatment_plans;
CREATE POLICY "Users can update own plans" 
  ON treatment_plans FOR UPDATE 
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own plans" ON treatment_plans;
CREATE POLICY "Users can delete own plans" 
  ON treatment_plans FOR DELETE 
  USING (auth.uid() = user_id);

-- ============================================================
-- 5. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_patients_updated_at ON patients;
CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_treatment_plans_updated_at ON treatment_plans;
CREATE TRIGGER update_treatment_plans_updated_at
  BEFORE UPDATE ON treatment_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- VERIFICATION: Check tables were created
-- ============================================================
SELECT 
  table_name,
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = t.table_name) as column_count
FROM information_schema.tables t
WHERE table_schema = 'public' 
  AND table_name IN ('patients', 'treatment_plans');
