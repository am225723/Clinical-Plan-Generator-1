import { createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export const createSupabaseClient = (config: SupabaseConfig) => {
  if (!config.enabled || !config.url || !config.anonKey) return null;
  return createClient(config.url, config.anonKey);
};

// Process file with Supabase (Upload + Mock Edge Function Call)
export const processWithSupabase = async (
  file: File, 
  type: 'ocr' | 'transcribe', 
  config: SupabaseConfig
): Promise<string> => {
  if (!config.enabled) throw new Error("Supabase is not enabled");

  const supabase = createSupabaseClient(config);
  if (!supabase) throw new Error("Invalid Supabase configuration");

  // 1. Upload to Storage
  const fileName = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, '')}`;
  const bucketName = 'clinical_documents';

  const { data: uploadData, error: uploadError } = await supabase
    .storage
    .from(bucketName)
    .upload(fileName, file);

  if (uploadError) {
    console.error("Supabase Upload Error:", uploadError);
    // Continue with mock if bucket doesn't exist yet for the prototype
    // throw new Error(`Upload failed: ${uploadError.message}`);
  }

  // 2. Call Edge Function (Mocked for now as we can't deploy edge functions from here)
  // In a real app:
  // const { data, error } = await supabase.functions.invoke('process-document', { 
  //   body: { path: fileName, type } 
  // });
  
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (type === 'ocr') {
    return `[Supabase OCR Result for ${file.name}]\n(Stored at: ${bucketName}/${fileName})\n\n(Simulated) The content of this scanned document would appear here after being processed by the OCR engine.`;
  } else {
    return `[Supabase Transcription Result for ${file.name}]\n(Stored at: ${bucketName}/${fileName})\n\n(Simulated) [00:00:00] Provider: Hello, how are you today?\n[00:00:05] Client: I've been feeling a bit better, thanks.`;
  }
};
