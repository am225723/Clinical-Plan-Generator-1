import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { parse, serialize } from 'cookie';

const getSupabaseUrl = () => 
  process.env.NEXT_PUBLIC_SUPABASE_URL || 
  process.env.VITE_SUPABASE_URL || 
  process.env.SUPABASE_URL || '';

const getSupabaseAnonKey = () => 
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 
  process.env.VITE_SUPABASE_ANON_KEY || 
  process.env.SUPABASE_ANON_KEY || '';

export function createApiClient(req: NextApiRequest, res: NextApiResponse) {
  return createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        const cookieHeader = req.headers.cookie || '';
        const parsed = parse(cookieHeader);
        return Object.entries(parsed).map(([name, value]) => ({ name, value: value || '' }));
      },
      setAll(cookiesToSet) {
        const existingCookies = res.getHeader('Set-Cookie') || [];
        const existingArray = Array.isArray(existingCookies) 
          ? existingCookies 
          : typeof existingCookies === 'string' 
            ? [existingCookies] 
            : [];
        const newCookies = cookiesToSet.map(({ name, value, options }) => 
          serialize(name, value, options as Parameters<typeof serialize>[2])
        );
        res.setHeader('Set-Cookie', [...existingArray, ...newCookies]);
      },
    },
  });
}
