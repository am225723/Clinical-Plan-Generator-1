import type { NextApiRequest, NextApiResponse } from 'next';
import { requireDoctor } from '@/lib/auth';
import { createApiClient } from '@/lib/supabase-api';

interface IcdCodeSummary {
  code: string;
  description: string;
  count: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = await requireDoctor({ req, res } as any);
  if ('redirect' in authResult || 'notFound' in authResult) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { user } = (authResult as { props: { user: { id: string } } }).props;
  const supabase = createApiClient(req, res);

  try {
    const [{ data: stats, error: statsError }, { data: topIcdCodesRaw, error: icdError }] =
      await Promise.all([
        supabase
          .from('doctor_dashboard_stats')
          .select('pending_notes_count, documents_this_week, documents_this_month')
          .eq('doctor_id', user.id)
          .maybeSingle(),
        supabase.rpc('get_top_icd_codes', {
          p_doctor_id: user.id,
          p_limit: 5,
        }),
      ]);

    if (statsError) throw statsError;
    if (icdError) throw icdError;

    const topIcdCodes: IcdCodeSummary[] = (topIcdCodesRaw || []).map((item: any) => ({
      code: item.icd_code,
      description: item.icd_description,
      count: Number(item.usage_count ?? 0),
    }));

    return res.status(200).json({
      pendingNotesCount: stats?.pending_notes_count ?? 0,
      documentsThisWeek: stats?.documents_this_week ?? 0,
      documentsThisMonth: stats?.documents_this_month ?? 0,
      topIcdCodes,
    });
  } catch (error: any) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: error.message || 'Failed to load dashboard summary' });
  }
}
