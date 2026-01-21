import { createClient } from '@supabase/supabase-js';

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  enabled: boolean;
}

export const getStoredSupabaseConfig = (): SupabaseConfig => {
  const stored = localStorage.getItem('supabase-config');
  return stored ? JSON.parse(stored) : { url: '', anonKey: '', enabled: false };
};

export const saveSupabaseConfig = (config: SupabaseConfig) => {
  localStorage.setItem('supabase-config', JSON.stringify(config));
};

export const createSupabaseClient = (config: SupabaseConfig) => {
  if (!config.enabled || !config.url || !config.anonKey) return null;
  return createClient(config.url, config.anonKey);
};

// Mock function to simulate Edge Function calls since we don't have a real backend
// In a real implementation, this would call supabase.functions.invoke('ocr-pdf', ...)
export const processWithSupabase = async (
  file: File, 
  type: 'ocr' | 'transcribe', 
  config: SupabaseConfig
): Promise<string> => {
  if (!config.enabled) throw new Error("Supabase is not enabled");

  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 2000));

  if (type === 'ocr') {
    return `[Supabase OCR Result for ${file.name}]\n\n(Simulated) The content of this scanned document would appear here after being processed by the OCR engine.`;
  } else {
    return `[Supabase Transcription Result for ${file.name}]\n\n(Simulated) [00:00:00] Provider: Hello, how are you today?\n[00:00:05] Client: I've been feeling a bit better, thanks.`;
  }
};
