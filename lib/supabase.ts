import { createBrowserClient as createBrowserSupabaseClient, createServerClient as createServerSupabaseClient } from '@supabase/ssr';
import { serialize, parse } from 'cookie';
import type { GetServerSidePropsContext } from 'next';
import type { SupabaseClient } from '@supabase/supabase-js';

const getSupabaseUrl = () => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL 
    || process.env.VITE_SUPABASE_URL 
    || process.env.SUPABASE_URL;
  
  if (!url) {
    if (typeof window === 'undefined') {
      throw new Error('SUPABASE_URL is required but not found in environment variables. Set VITE_SUPABASE_URL or SUPABASE_URL.');
    }
    console.error('SUPABASE_URL not found - authentication will fail');
    return '';
  }
  return url;
};

const getSupabaseAnonKey = () => {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY 
    || process.env.VITE_SUPABASE_ANON_KEY 
    || process.env.SUPABASE_ANON_KEY;
  
  if (!key) {
    if (typeof window === 'undefined') {
      throw new Error('SUPABASE_ANON_KEY is required but not found in environment variables. Set VITE_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY.');
    }
    console.error('SUPABASE_ANON_KEY not found - authentication will fail');
    return '';
  }
  return key;
};

export const createBrowserClient = () => {
  return createBrowserSupabaseClient(
    getSupabaseUrl(),
    getSupabaseAnonKey()
  );
};

export const createServerClient = (ctx: GetServerSidePropsContext) => {
  return createServerSupabaseClient(
    getSupabaseUrl(),
    getSupabaseAnonKey(),
    {
      cookies: {
        getAll() {
          const cookies: { name: string; value: string }[] = [];
          
          if (ctx.req.cookies && typeof ctx.req.cookies === 'object') {
            Object.entries(ctx.req.cookies).forEach(([name, value]) => {
              cookies.push({ name, value: value || '' });
            });
          } else {
            const cookieHeader = ctx.req.headers.cookie || '';
            const parsed = parse(cookieHeader);
            Object.entries(parsed).forEach(([name, value]) => {
              cookies.push({ name, value: value || '' });
            });
          }
          
          return cookies;
        },
        setAll(cookiesToSet) {
          const existingCookies = ctx.res.getHeader('Set-Cookie') || [];
          const existingArray = Array.isArray(existingCookies) 
            ? existingCookies 
            : typeof existingCookies === 'string' 
              ? [existingCookies] 
              : [];
          
          const newCookies = cookiesToSet.map(({ name, value, options }) => {
            return serialize(name, value, options as Parameters<typeof serialize>[2]);
          });
          
          ctx.res.setHeader('Set-Cookie', [...existingArray, ...newCookies]);
        },
      },
    }
  );
};

export type UserRole = 'admin' | 'doctor';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string | null;
  disabled: boolean;
  created_at: string;
}

export interface AppSettings {
  id: string;
  treatment_plan_prompt: string;
  updated_at: string;
}

export interface DoctorDocumentSettings {
  doctor_id: string;
  logo_url: string | null;
  header_config: Record<string, any> | null;
  footer_config: Record<string, any> | null;
  first_page_header_config: Record<string, any> | null;
  first_page_footer_config: Record<string, any> | null;
  patient_field_layout: Record<string, any> | null;
  pdf_style: {
    font_size: number;
    font_family?: string;
    [key: string]: any;
  } | null;
  updated_at: string;
}

export async function getUserProfile(supabase: SupabaseClient, userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return data;
}

export async function getAppSettings(supabase: SupabaseClient): Promise<AppSettings | null> {
  const { data, error } = await supabase
    .from('app_settings')
    .select('*')
    .limit(1)
    .single();

  if (error) {
    console.error('Error fetching app settings:', error);
    return null;
  }

  return data;
}

export async function getDoctorSettings(supabase: SupabaseClient, doctorId: string): Promise<DoctorDocumentSettings | null> {
  const { data, error } = await supabase
    .from('doctor_document_settings')
    .select('*')
    .eq('doctor_id', doctorId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching doctor settings:', error);
    return null;
  }

  return data;
}
