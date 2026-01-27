import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '@/lib/supabase-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Template ID is required' });
  }

  const supabase = createApiClient(req, res);
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
