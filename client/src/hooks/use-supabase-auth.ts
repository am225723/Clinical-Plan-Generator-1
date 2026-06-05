import { useState, useEffect, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { 
  getSupabaseClient, 
  isSupabaseConfigured,
  signIn as supabaseSignIn, 
  signUp as supabaseSignUp, 
  signOut as supabaseSignOut,
  getCurrentSession,
  onAuthStateChange
} from '@/lib/supabase-client';

interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isConfigured: boolean;
  connectionVerified: boolean;
  error: string | null;
}

export function useSupabaseAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    isConfigured: false,
    connectionVerified: false,
    error: null
  });

  useEffect(() => {
    const configured = isSupabaseConfigured();
    
    if (!configured) {
      setAuthState({ 
        user: null, 
        session: null, 
        loading: false, 
        isConfigured: false, 
        connectionVerified: false, 
        error: null 
      });
      return;
    }

    // Initialize client
    const client = getSupabaseClient();
    if (!client) {
      setAuthState({ 
        user: null, 
        session: null, 
        loading: false, 
        isConfigured: false, 
        connectionVerified: false, 
        error: 'Failed to initialize Supabase client' 
      });
      return;
    }
    
    // Get initial session
    const initAuth = async () => {
      try {
        const session = await getCurrentSession();
        setAuthState(prev => ({ 
          ...prev, 
          user: session?.user || null, 
          session,
          loading: false, 
          isConfigured: true,
          connectionVerified: true,
          error: null
        }));
      } catch (err: any) {
        if (import.meta.env.DEV) {
          console.warn('Auth/profile connection check failed', { message: err?.message || 'Unknown auth error' });
        }

        setAuthState(prev => ({ 
          ...prev, 
          loading: false, 
          isConfigured: true,
          connectionVerified: false,
          error: err.message || 'Failed to verify connection'
        }));
      }
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
