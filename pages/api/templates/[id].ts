import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@supabase/ssr';
import { parse, serialize } from 'cookie';

const getSupabaseUrl = () => process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
const getSupabaseAnonKey = () => process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Template ID is required' });
  }

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
      const { data: template, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('id', id)
        .eq('doctor_id', session.user.id)
        .single();

      if (error || !template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      return res.status(200).json(template);
    }

    if (req.method === 'PUT') {
      const { name, template_type, ai_prompt, pdf_config, is_default } = req.body;

      if (is_default) {
        await supabase
          .from('document_templates')
          .update({ is_default: false })
          .eq('doctor_id', session.user.id)
          .eq('template_type', template_type);
      }

      const { data: template, error } = await supabase
        .from('document_templates')
        .update({
          name,
          template_type,
          ai_prompt,
          pdf_config: pdf_config || {},
          is_default: is_default || false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('doctor_id', session.user.id)
        .select()
        .single();

      if (error) throw error;
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }
      return res.status(200).json(template);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', id)
        .eq('doctor_id', session.user.id);

      if (error) throw error;
      return res.status(200).json({ message: 'Template deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Template API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
