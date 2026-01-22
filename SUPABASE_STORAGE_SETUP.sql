-- ============================================================
-- SUPABASE STORAGE SETUP FOR GOLD STANDARD CLINICAL
-- ============================================================
-- Run this SQL in your Supabase SQL Editor to set up storage
-- OR create the bucket manually in Dashboard → Storage → New Bucket

-- ============================================================
-- 1. CREATE STORAGE BUCKET
-- ============================================================
-- Note: You may need to create this manually in the Supabase Dashboard
-- Go to: Storage → New Bucket → Name: "clinical_documents" → Create

INSERT INTO storage.buckets (id, name, public)
VALUES ('clinical_documents', 'clinical_documents', false)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. STORAGE POLICIES - Authenticated users only
-- ============================================================

-- Policy: Users can upload to their own folder
DROP POLICY IF EXISTS "Users can upload own documents" ON storage.objects;
CREATE POLICY "Users can upload own documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'clinical_documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can view their own documents
DROP POLICY IF EXISTS "Users can view own documents" ON storage.objects;
CREATE POLICY "Users can view own documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'clinical_documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can update their own documents
DROP POLICY IF EXISTS "Users can update own documents" ON storage.objects;
CREATE POLICY "Users can update own documents"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'clinical_documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Policy: Users can delete their own documents
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;
CREATE POLICY "Users can delete own documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'clinical_documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================================
-- VERIFICATION: Check bucket was created
-- ============================================================
SELECT id, name, public, created_at 
FROM storage.buckets 
WHERE id = 'clinical_documents';
