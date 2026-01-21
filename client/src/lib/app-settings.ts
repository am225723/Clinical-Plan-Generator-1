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
  
  if (stored) return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
  
  if (oldSupabase) {
    return {
      ...DEFAULT_SETTINGS,
      supabase: JSON.parse(oldSupabase)
    };
  }
  
  return DEFAULT_SETTINGS;
};

export const saveSettings = (settings: AppSettings) => {
  localStorage.setItem('app-settings', JSON.stringify(settings));
  // Keep legacy sync for now just in case
  localStorage.setItem('supabase-config', JSON.stringify(settings.supabase));
};
