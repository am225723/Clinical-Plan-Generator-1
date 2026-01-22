import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    if (!profile) {
      return res.status(403).json({ error: 'Profile not found' });
    }

    const { type, settings } = req.body;

    if (type === 'app') {
      if (profile.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden - only admins can update app settings' });
      }
      const { error } = await supabase
        .from('app_settings')
        .upsert({
          id: settings.id || undefined,
          treatment_plan_prompt: settings.treatment_plan_prompt,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } else if (type === 'doctor' && (profile.role === 'doctor' || profile.role === 'admin')) {
      const { error } = await supabase
        .from('doctor_document_settings')
        .upsert({
          doctor_id: session.user.id,
          logo_url: settings.logo_url,
          header_config: settings.header_config,
          footer_config: settings.footer_config,
          first_page_header_config: settings.first_page_header_config,
          first_page_footer_config: settings.first_page_footer_config,
          patient_field_layout: settings.patient_field_layout,
          pdf_style: settings.pdf_style,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } else {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    return res.status(200).json({ message: 'Settings saved successfully' });
  } catch (error: any) {
    console.error('Set settings error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save settings' });
  }
}
