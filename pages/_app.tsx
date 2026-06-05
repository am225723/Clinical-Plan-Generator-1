import type { AppProps } from 'next/app';
import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/router';
import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient, Session } from '@supabase/supabase-js';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/lib/theme';
import { RouteErrorBoundary } from '@/components/route-error-boundary';
import '@/styles/globals.css';

type SupabaseContext = {
  supabase: SupabaseClient;
  session: Session | null;
};

const SupabaseContext = createContext<SupabaseContext | undefined>(undefined);

export function useSupabase() {
  const context = useContext(SupabaseContext);
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider');
  }
  return context;
}

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

export default function App({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const [supabase] = useState(() =>
    createBrowserClient(
      getSupabaseUrl(),
      getSupabaseAnonKey()
    )
  );
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  return (
    <ThemeProvider>
      <SupabaseContext.Provider value={{ supabase, session }}>
        <RouteErrorBoundary key={router.asPath}>
          <Component {...pageProps} />
        </RouteErrorBoundary>
        <Toaster />
      </SupabaseContext.Provider>
    </ThemeProvider>
  );
}
