import type { NextApiRequest, NextApiResponse } from 'next';
import { createApiClient } from '@/lib/supabase-api';

interface CalendarImportPayload {
  uid: string;
  summary?: string;
  location?: string;
  startTime: string;
  endTime?: string | null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createApiClient(req, res);
  const {
    data: { session },
  } = await supabase.auth.getSession();

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

  if (req.method === 'GET') {
    try {
      const { data: events, error } = await supabase
        .from('calendar_imports')
        .select('id, uid, summary, location, start_time, end_time')
        .eq('doctor_id', session.user.id)
        .order('start_time', { ascending: true });

      if (error) throw error;

      return res.status(200).json({ events: events || [] });
    } catch (error: any) {
      console.error('Calendar import fetch error:', error);
      return res.status(500).json({ error: error.message || 'Failed to load calendar imports' });
    }
  }

  const { events } = req.body ?? {};
  if (!Array.isArray(events) || events.length === 0) {
    return res.status(400).json({ error: 'No events provided' });
  }

  const invalidEvent = events.find(
    (event: CalendarImportPayload) => !event?.uid || !event?.startTime
  );
  if (invalidEvent) {
    return res.status(400).json({ error: 'Each event requires a uid and startTime' });
  }

  const payload = events.map((event: CalendarImportPayload) => ({
    doctor_id: session.user.id,
    uid: event.uid,
    summary: event.summary ?? null,
    location: event.location ?? null,
    start_time: event.startTime,
    end_time: event.endTime ?? null,
  }));

  try {
    const { data, error } = await supabase
      .from('calendar_imports')
      .upsert(payload, { onConflict: 'doctor_id,uid,start_time', ignoreDuplicates: true })
      .select('id, uid, summary, location, start_time, end_time');

    if (error) throw error;

    return res.status(200).json({ events: data || [] });
  } catch (error: any) {
    console.error('Calendar import save error:', error);
    return res.status(500).json({ error: error.message || 'Failed to save calendar imports' });
  }
}
