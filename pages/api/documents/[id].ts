import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Document ID is required' });
  }

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
      const { data: document, error } = await supabase
        .from('saved_documents')
        .select('*')
        .eq('id', id)
        .eq('doctor_id', session.user.id)
        .single();

      if (error || !document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      return res.status(200).json(document);
    }

    if (req.method === 'PUT') {
      const { 
        patient_name, 
        client_id,
        date_of_service, 
        patient_data, 
        clinical_inputs,
        generated_content, 
        pdf_html,
        status
      } = req.body;

      const updateData: any = { updated_at: new Date().toISOString() };
      if (patient_name !== undefined) updateData.patient_name = patient_name;
      if (client_id !== undefined) updateData.client_id = client_id;
      if (date_of_service !== undefined) updateData.date_of_service = date_of_service;
      if (patient_data !== undefined) updateData.patient_data = patient_data;
      if (clinical_inputs !== undefined) updateData.clinical_inputs = clinical_inputs;
      if (generated_content !== undefined) updateData.generated_content = generated_content;
      if (pdf_html !== undefined) updateData.pdf_html = pdf_html;
      if (status !== undefined) updateData.status = status;

      const { data: document, error } = await supabase
        .from('saved_documents')
        .update(updateData)
        .eq('id', id)
        .eq('doctor_id', session.user.id)
        .select()
        .single();

      if (error) throw error;
      if (!document) {
        return res.status(404).json({ error: 'Document not found' });
      }
      return res.status(200).json(document);
    }

    if (req.method === 'DELETE') {
      const { error } = await supabase
        .from('saved_documents')
        .delete()
        .eq('id', id)
        .eq('doctor_id', session.user.id);

      if (error) throw error;
      return res.status(200).json({ message: 'Document deleted' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error: any) {
    console.error('Document API error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
