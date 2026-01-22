import { createPagesBrowserClient } from '@supabase/auth-helpers-nextjs';
import { createPagesServerClient } from '@supabase/auth-helpers-nextjs';
import type { GetServerSidePropsContext } from 'next';

export const createBrowserClient = () => {
  return createPagesBrowserClient();
};

export const createServerClient = (ctx: GetServerSidePropsContext) => {
  return createPagesServerClient(ctx);
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

export async function getUserProfile(supabase: ReturnType<typeof createBrowserClient>, userId: string): Promise<Profile | null> {
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

export async function getAppSettings(supabase: ReturnType<typeof createBrowserClient>): Promise<AppSettings | null> {
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

export async function getDoctorSettings(supabase: ReturnType<typeof createBrowserClient>, doctorId: string): Promise<DoctorDocumentSettings | null> {
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
