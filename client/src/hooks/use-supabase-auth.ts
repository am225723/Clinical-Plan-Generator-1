import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { 
  getSupabaseClient, 
  signIn as supabaseSignIn, 
  signUp as supabaseSignUp, 
  signOut as supabaseSignOut,
  getCurrentUser,
  onAuthStateChange
} from '@/lib/supabase-client';
import { getStoredSettings } from '@/lib/app-settings';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isConfigured: false
  });

  useEffect(() => {
    const settings = getStoredSettings();
    const isConfigured = settings.supabase.enabled && !!settings.supabase.url && !!settings.supabase.anonKey;
    
    if (!isConfigured) {
      setAuthState({ user: null, session: null, loading: false, isConfigured: false });
      return;
    }

    // Initialize client
    getSupabaseClient(settings.supabase);
    
    // Get initial session
    const initAuth = async () => {
      const user = await getCurrentUser();
      setAuthState(prev => ({ ...prev, user, loading: false, isConfigured: true }));
    };
    
    initAuth();
    
    // Listen for auth changes
    const { data: { subscription } } = onAuthStateChange((event, session) => {
      setAuthState(prev => ({ 
        ...prev, 
        user: session?.user || null, 
        session,
        loading: false 
      }));
    });
    
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    const result = await supabaseSignIn(email, password);
    setAuthState(prev => ({ 
      ...prev, 
      user: result.user, 
      session: result.session, 
      loading: false 
    }));
    return result;
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    setAuthState(prev => ({ ...prev, loading: true }));
    const result = await supabaseSignUp(email, password);
    setAuthState(prev => ({ ...prev, user: result.user, loading: false }));
    return result;
  }, []);

  const signOut = useCallback(async () => {
    setAuthState(prev => ({ ...prev, loading: true }));
    const result = await supabaseSignOut();
    setAuthState(prev => ({ ...prev, user: null, session: null, loading: false }));
    return result;
  }, []);

  return {
    ...authState,
    signIn,
    signUp,
    signOut
  };
}
