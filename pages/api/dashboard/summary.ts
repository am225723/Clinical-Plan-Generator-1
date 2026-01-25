import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@/lib/supabase';

interface IcdCodeSummary {
  code: string;
  description: string;
  count: number;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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
    const { data: documents, error } = await supabase
      .from('saved_documents')
      .select('created_at, status, generated_content')
      .eq('doctor_id', session.user.id);

    if (error) throw error;

    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const icdMap = new Map<string, IcdCodeSummary>();

    let documentsThisWeek = 0;
    let documentsThisMonth = 0;
    let pendingNotesCount = 0;

    (documents || []).forEach((doc: any) => {
      const createdAt = new Date(doc.created_at);
      if (createdAt >= startOfWeek) documentsThisWeek += 1;
      if (createdAt >= startOfMonth) documentsThisMonth += 1;
      if (doc.status !== 'final') pendingNotesCount += 1;

      const diagnosis = doc.generated_content?.diagnosis || [];
      diagnosis.forEach((item: { code?: string; name?: string }) => {
        if (!item.code) return;
        const existing = icdMap.get(item.code);
        if (existing) {
          existing.count += 1;
        } else {
          icdMap.set(item.code, {
            code: item.code,
            description: item.name || 'Unknown diagnosis',
            count: 1,
          });
        }
      });
    });

    const topIcdCodes = Array.from(icdMap.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return res.status(200).json({
      pendingNotesCount,
      documentsThisWeek,
      documentsThisMonth,
      topIcdCodes,
    });
  } catch (error: any) {
    console.error('Dashboard summary error:', error);
    return res.status(500).json({ error: error.message || 'Failed to load dashboard summary' });
  }
}
