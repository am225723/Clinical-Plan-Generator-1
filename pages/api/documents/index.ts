import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createServerClient({ req, res } as any);
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
      const { search, limit = '50', offset = '0' } = req.query;
      
      let query = supabase
        .from('saved_documents')
        .select('*', { count: 'exact' })
        .eq('doctor_id', session.user.id)
        .order('created_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (search && typeof search === 'string' && search.trim()) {
        query = query.ilike('patient_name', `%${search.trim()}%`);
      }

      const { data: documents, error, count } = await query;

      if (error) throw error;
      return res.status(200).json({ documents: documents || [], total: count || 0 });
    }

    if (req.method === 'POST') {
      const { 
        template_id, 
        template_type, 
        patient_name, 
        client_id,
        date_of_service, 
        patient_data, 
        clinical_inputs,
        generated_content, 
        pdf_html,
        status = 'draft'
      } = req.body;

      if (!template_type || !patient_name || !date_of_service || !patient_data || !generated_content) {
        return res.status(400).json({ error: 'Missing required fields' });
      }

      const { data: document, error } = await supabase
        .from('saved_documents')
        .insert({
          doctor_id: session.user.id,
          template_id: template_id || null,
          template_type,
          patient_name,
          client_id: client_id || null,
          date_of_service,
          patient_data,
          clinical_inputs: clinical_inputs || null,
          generated_content,
          pdf_html: pdf_html || null,
          status,
        })
        .select()
        .single();

      if (error) throw error;
      return res.status(201).json(document);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Documents API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
