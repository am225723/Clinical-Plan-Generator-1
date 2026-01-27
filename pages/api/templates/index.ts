import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { parse, serialize } from 'cookie';

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient(getSupabaseUrl(), getSupabaseAnonKey(), {
    cookies: {
      getAll() {
        const cookieHeader = req.headers.cookie || '';
        const parsed = parse(cookieHeader);
        return Object.entries(parsed).map(([name, value]) => ({ name, value: value || '' }));
      },
      setAll(cookiesToSet) {
        const existingCookies = res.getHeader('Set-Cookie') || [];
        const existingArray = Array.isArray(existingCookies) ? existingCookies : typeof existingCookies === 'string' ? [existingCookies] : [];
        const newCookies = cookiesToSet.map(({ name, value, options }) => serialize(name, value, options as Parameters<typeof serialize>[2]));
        res.setHeader('Set-Cookie', [...existingArray, ...newCookies]);
      },
    },
  });
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || (profile.role !== 'doctor' && profile.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  try {
    if (req.method === 'GET') {
      const { data: templates, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('doctor_id', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return res.status(200).json(templates || []);
    }

    if (req.method === 'POST') {
      const { name, template_type, ai_prompt, pdf_config, is_default } = req.body;

      if (!name || !template_type || !ai_prompt) {
        return res.status(400).json({ error: 'Name, template_type, and ai_prompt are required' });
      }

      if (is_default) {
        await supabase
          .from('document_templates')
          .update({ is_default: false })
          .eq('doctor_id', session.user.id)
          .eq('template_type', template_type);
      }

      const { data: template, error } = await supabase
        .from('document_templates')
        .insert({
          doctor_id: session.user.id,
          name,
          template_type,
          ai_prompt,
          pdf_config: pdf_config || {},
          is_default: is_default || false,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(template);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Templates API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
