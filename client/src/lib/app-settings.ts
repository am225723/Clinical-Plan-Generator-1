// Application settings - both Supabase and AI are now hardcoded from environment variables
// This file is kept for backward compatibility and local storage management

export interface AppSettings {
  // Legacy settings - kept for backward compatibility
  supabase: {
    url: string;
    anonKey: string;
    enabled: boolean;
  };
  ai: {
    provider: 'openai';
    model: string;
    enabled: boolean;
  };
}

// Default settings - AI is always enabled via backend, Supabase via env vars
export const DEFAULT_SETTINGS: AppSettings = {
  supabase: {
    url: '',
    anonKey: '',
    enabled: true // Always enabled when env vars are present
  },
  ai: {
    provider: 'openai',
    model: 'gpt-4o',
    enabled: true // Always enabled via backend
  }
};

export const getStoredSettings = (): AppSettings => {
  // Return default settings - both services are hardcoded
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: AppSettings) => {
  // No-op - settings are now hardcoded from environment variables
  // This function is kept for backward compatibility
};
