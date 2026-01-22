import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerClient({ req, res } as any);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { data: appSettings, error: appError } = await supabase
      .from('app_settings')
      .select('*')
      .limit(1)
      .single();

    if (appError && appError.code !== 'PGRST116') {
      throw appError;
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', session.user.id)
      .single();

    let doctorSettings = null;
    if (profile?.role === 'doctor') {
      const { data } = await supabase
        .from('doctor_document_settings')
        .select('*')
        .eq('doctor_id', session.user.id)
        .single();
      doctorSettings = data;
    }

    return res.status(200).json({
      appSettings: appSettings || { treatment_plan_prompt: '' },
      doctorSettings,
      role: profile?.role
    });
  } catch (error: any) {
    console.error('Get settings error:', error);
    return res.status(500).json({ error: error.message || 'Failed to get settings' });
  }
}
