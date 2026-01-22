import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
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

export const getSupabaseClient = (config?: SupabaseConfig): SupabaseClient | null => {
  // If explicit config provided, create/update client
  if (config) {
    if (!config.enabled || !config.url || !config.anonKey) {
      supabaseInstance = null;
      return null;
    }
    supabaseInstance = createClient(config.url, config.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
    return supabaseInstance;
  }
  
  // Return existing instance or try to create from stored config
  if (supabaseInstance) return supabaseInstance;
  
  const stored = localStorage.getItem('app-settings');
  if (stored) {
    const settings = JSON.parse(stored);
    if (settings.supabase?.enabled && settings.supabase?.url && settings.supabase?.anonKey) {
      supabaseInstance = createClient(settings.supabase.url, settings.supabase.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      return supabaseInstance;
    }
  }
  
  return null;
};

// Legacy compatibility
export const createSupabaseClient = (config: SupabaseConfig) => getSupabaseClient(config);

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
    .createSignedUrl(path, 3600); // 1 hour expiry
  
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

// Process file with Supabase (Upload + Edge Function Call for OCR/Transcription)
export const processWithSupabase = async (
  file: File, 
  type: 'ocr' | 'transcribe', 
  config: SupabaseConfig
): Promise<string> => {
  if (!config.enabled) throw new Error("Supabase is not enabled");

  const supabase = getSupabaseClient(config);
  if (!supabase) throw new Error("Invalid Supabase configuration");

  // 1. Upload to Storage
  const { path, error: uploadError } = await uploadDocument(file);
  
  if (uploadError) {
    console.error("Supabase Upload Error:", uploadError);
    // For demo, continue with simulated response
  }

  // 2. Try to call Edge Function if configured
  try {
    const { data, error } = await supabase.functions.invoke('process-document', { 
      body: { path, type } 
    });
    
    if (!error && data?.text) {
      return data.text;
    }
  } catch (e) {
    console.log("Edge function not available, using simulated response");
  }
  
  // Fallback: Simulate processing
  await new Promise(resolve => setTimeout(resolve, 1500));

  if (type === 'ocr') {
    return `[OCR Result for ${file.name}]\nStored at: ${BUCKET_NAME}/${path || 'pending'}\n\n(Note: Configure Supabase Edge Function for actual OCR processing)`;
  } else {
    return `[Transcription Result for ${file.name}]\nStored at: ${BUCKET_NAME}/${path || 'pending'}\n\n[00:00:00] (Configure Supabase Edge Function for actual audio transcription)`;
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
    .update({ ...updates, updated_at: new Date().toISOString() })
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
    // Try a simple auth check
    const { data, error } = await supabase.auth.getSession();
    if (error) throw error;
    return { success: true, error: null };
  } catch (e: any) {
    return { success: false, error: e.message };
  }
};
