import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '@/lib/supabase-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
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

  const { id } = req.query;

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid transcription id.' });
  }

  const { data, error } = await supabase
    .from('transcription_jobs')
    .select('id, status, transcript, error_message')
    .eq('id', id)
    .single();

  if (error || !data) {
    return res.status(404).json({ error: 'Transcription job not found.' });
  }

  return res.status(200).json({
    jobId: data.id,
    status: data.status,
    transcript: data.transcript,
    error: data.error_message,
  });
}
