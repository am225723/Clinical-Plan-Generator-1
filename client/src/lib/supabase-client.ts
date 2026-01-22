import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

// Supabase configuration from environment variables
// For Vercel: Use VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY
// The values are set at build time
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Debug: Log configuration status (remove in production)
if (typeof window !== 'undefined' && !SUPABASE_URL) {
  console.log('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.');
}

// Database types
export interface PatientRecord {
  id: string;
  user_id: string;
  client_id: string;
  name: string;
  dob: string;
  created_at: string;
  updated_at: string;
}

export interface TreatmentPlanRecord {
  id: string;
  user_id: string;
  patient_id: string;
  client_id: string;
  inputs: object;
  generated_plan: object;
  date_of_service: string;
  created_at: string;
  updated_at: string;
}

export interface UploadedDocument {
  id: string;
  user_id: string;
  patient_id?: string;
  file_name: string;
  file_path: string;
  file_type: 'pdf' | 'audio' | 'image' | 'other';
  extracted_text?: string;
  created_at: string;
}

// Singleton instance
let supabaseInstance: SupabaseClient | null = null;

export const isSupabaseConfigured = (): boolean => {
  return !!(SUPABASE_URL && SUPABASE_ANON_KEY);
};

export const getSupabaseClient = (): SupabaseClient | null => {
  if (!isSupabaseConfigured()) {
    return null;
  }
  
  if (supabaseInstance) return supabaseInstance;
  
  supabaseInstance = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  });
  
  return supabaseInstance;
};

// ==================== AUTHENTICATION ====================

export const signUp = async (email: string, password: string): Promise<{ user: User | null; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, error: new Error('Supabase not configured') };
  
  const { data, error } = await supabase.auth.signUp({ email, password });
  return { user: data.user, error: error as Error | null };
};

export const signIn = async (email: string, password: string): Promise<{ user: User | null; session: Session | null; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { user: null, session: null, error: new Error('Supabase not configured') };
  
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  return { user: data.user, session: data.session, error: error as Error | null };
};

export const signOut = async (): Promise<{ error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error('Supabase not configured') };
  
  const { error } = await supabase.auth.signOut();
  return { error: error as Error | null };
};

export const getCurrentUser = async (): Promise<User | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

export const onAuthStateChange = (callback: (event: string, session: Session | null) => void) => {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  
  return supabase.auth.onAuthStateChange(callback);
};

// ==================== FILE STORAGE ====================

const BUCKET_NAME = 'clinical_documents';

export const uploadDocument = async (
  file: File,
  patientId?: string
): Promise<{ path: string; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { path: '', error: new Error('Supabase not configured') };
  
  const user = await getCurrentUser();
  if (!user) return { path: '', error: new Error('Not authenticated') };
  
  const timestamp = Date.now();
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
  const filePath = patientId 
    ? `${user.id}/${patientId}/${timestamp}_${sanitizedName}`
    : `${user.id}/general/${timestamp}_${sanitizedName}`;
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false
    });
  
  if (error) return { path: '', error: error as Error };
  return { path: data.path, error: null };
};

export const getDocumentUrl = async (path: string): Promise<string | null> => {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  
  const { data } = await supabase.storage
    .from(BUCKET_NAME)
    .createSignedUrl(path, 3600);
  
  return data?.signedUrl || null;
};

export const deleteDocument = async (path: string): Promise<{ error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error('Supabase not configured') };
  
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path]);
  
  return { error: error as Error | null };
};

export const listDocuments = async (patientId?: string): Promise<{ files: any[]; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { files: [], error: new Error('Supabase not configured') };
  
  const user = await getCurrentUser();
  if (!user) return { files: [], error: new Error('Not authenticated') };
  
  const folderPath = patientId ? `${user.id}/${patientId}` : `${user.id}`;
  
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .list(folderPath, { sortBy: { column: 'created_at', order: 'desc' } });
  
  return { files: data || [], error: error as Error | null };
};

// Process file using Supabase Edge Function
export const processWithSupabase = async (
  file: File, 
  type: 'ocr' | 'transcribe',
  patientId?: string
): Promise<string> => {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error("Supabase not configured");

  // 1. Upload to Storage
  const { path, error: uploadError } = await uploadDocument(file, patientId);
  
  if (uploadError) {
    throw new Error(`File upload failed: ${uploadError.message}. Please check that the '${BUCKET_NAME}' storage bucket exists in your Supabase project.`);
  }

  if (!path) {
    throw new Error("Upload succeeded but no path was returned");
  }

  // 2. Call Edge Function for processing
  try {
    const { data, error } = await supabase.functions.invoke('process-document', { 
      body: { path, type } 
    });
    
    if (error) {
      console.error("Edge function error:", error);
      throw new Error(`Edge function error: ${error.message}`);
    }
    
    if (data?.text) {
      return data.text;
    }
    
    throw new Error("Edge function returned no text");
  } catch (e: any) {
    // Provide helpful message about edge function setup
    if (e.message?.includes('FunctionNotFound') || e.message?.includes('404')) {
      throw new Error(`Edge function 'process-document' not found. Please deploy the edge function to your Supabase project.`);
    }
    throw e;
  }
};

// ==================== DATABASE OPERATIONS ====================

// Patients
export const createPatient = async (patient: Omit<PatientRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ data: PatientRecord | null; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  const user = await getCurrentUser();
  if (!user) return { data: null, error: new Error('Not authenticated') };
  
  const { data, error } = await supabase
    .from('patients')
    .insert({ ...patient, user_id: user.id })
    .select()
    .single();
  
  return { data, error: error as Error | null };
};

export const getPatients = async (): Promise<{ data: PatientRecord[]; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: new Error('Supabase not configured') };
  
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .order('created_at', { ascending: false });
  
  return { data: data || [], error: error as Error | null };
};

export const getPatient = async (id: string): Promise<{ data: PatientRecord | null; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single();
  
  return { data, error: error as Error | null };
};

export const updatePatient = async (id: string, updates: Partial<PatientRecord>): Promise<{ error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error('Supabase not configured') };
  
  const { error } = await supabase
    .from('patients')
    .update(updates)
    .eq('id', id);
  
  return { error: error as Error | null };
};

export const deletePatient = async (id: string): Promise<{ error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error('Supabase not configured') };
  
  const { error } = await supabase
    .from('patients')
    .delete()
    .eq('id', id);
  
  return { error: error as Error | null };
};

// Treatment Plans
export const saveTreatmentPlan = async (plan: Omit<TreatmentPlanRecord, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<{ data: TreatmentPlanRecord | null; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  const user = await getCurrentUser();
  if (!user) return { data: null, error: new Error('Not authenticated') };
  
  const { data, error } = await supabase
    .from('treatment_plans')
    .insert({ ...plan, user_id: user.id })
    .select()
    .single();
  
  return { data, error: error as Error | null };
};

export const getTreatmentPlans = async (patientId?: string): Promise<{ data: TreatmentPlanRecord[]; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: [], error: new Error('Supabase not configured') };
  
  let query = supabase
    .from('treatment_plans')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (patientId) {
    query = query.eq('patient_id', patientId);
  }
  
  const { data, error } = await query;
  
  return { data: data || [], error: error as Error | null };
};

export const getTreatmentPlan = async (id: string): Promise<{ data: TreatmentPlanRecord | null; error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { data: null, error: new Error('Supabase not configured') };
  
  const { data, error } = await supabase
    .from('treatment_plans')
    .select('*')
    .eq('id', id)
    .single();
  
  return { data, error: error as Error | null };
};

export const deleteTreatmentPlan = async (id: string): Promise<{ error: Error | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { error: new Error('Supabase not configured') };
  
  const { error } = await supabase
    .from('treatment_plans')
    .delete()
    .eq('id', id);
  
  return { error: error as Error | null };
};

// ==================== UTILITY ====================

export const testConnection = async (): Promise<{ success: boolean; error: string | null }> => {
  const supabase = getSupabaseClient();
  if (!supabase) return { success: false, error: 'Supabase not configured' };
  
  try {
    const { error } = await supabase.auth.getSession();
    if (error) throw error;
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};
