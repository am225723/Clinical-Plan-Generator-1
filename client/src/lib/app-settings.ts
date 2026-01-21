export interface AppSettings {
  supabase: {
    url: string;
    anonKey: string;
    enabled: boolean;
  };
  ai: {
    provider: 'openai' | 'perplexity' | 'disabled';
    apiKey: string;
    model: string; // e.g., 'gpt-4o' or 'sonar-pro'
    enabled: boolean;
  };
}

export const DEFAULT_SETTINGS: AppSettings = {
  supabase: {
    url: '',
    anonKey: '',
    enabled: false
  },
  ai: {
    provider: 'disabled',
    apiKey: '',
    model: 'gpt-4o',
    enabled: false
  }
};

export const getStoredSettings = (): AppSettings => {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  const stored = localStorage.getItem('app-settings');
  // Backwards compatibility check
  const oldSupabase = localStorage.getItem('supabase-config');
  
  // Try to load env var if present (User requested EXPO_OPENAI_API_KEY support)
  // In Vite we use import.meta.env.VITE_*
  // We'll check for a VITE_OPENAI_API_KEY that might have been mapped from the user's setup
  const envApiKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.VITE_EXPO_OPENAI_API_KEY || '';

  let settings = DEFAULT_SETTINGS;

  if (stored) {
    settings = { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  } else if (oldSupabase) {
    settings = {
      ...DEFAULT_SETTINGS,
      supabase: JSON.parse(oldSupabase)
    };
  }

  // Pre-populate API key if available and not already set
  if (envApiKey && !settings.ai.apiKey) {
    settings.ai.apiKey = envApiKey;
    settings.ai.provider = 'openai';
    settings.ai.enabled = true;
  }

  return settings;
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem('app-settings', JSON.stringify(settings));
  // Keep legacy sync for now just in case
  localStorage.setItem('supabase-config', JSON.stringify(settings.supabase));
};
