import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@/lib/supabase';

interface Appointment {
  id: string;
  time: string;
  period: 'AM' | 'PM';
  patientName: string;
  appointmentType: string;
  location: string;
  status: 'completed' | 'pending' | 'in_progress';
  hasFlag?: boolean;
  attachedNote?: string;
  documentId?: string;
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
      .select('id, patient_name, patient_data, date_of_service, status')
      .eq('doctor_id', session.user.id)
      .order('date_of_service', { ascending: true })
      .limit(25);

    if (error) throw error;

    const appointments: Appointment[] = (documents || []).map((doc: any, index: number) => {
      const date = new Date(doc.date_of_service);
      const hours = date.getHours() || 9 + (index % 6) * 1.5;
      const time = `${Math.floor(hours)}`.padStart(2, '0') + ':' + (hours % 1 ? '30' : '00');
      const period = hours >= 12 ? 'PM' : 'AM';
      return {
        id: doc.id,
        time,
        period,
        patientName: doc.patient_name || doc.patient_data?.patient_name || 'Unknown',
        appointmentType: doc.patient_data?.appointment_type || 'Appointment',
        location: doc.patient_data?.location || 'Virtual',
        status: doc.status === 'final' ? 'completed' : 'pending',
        hasFlag: doc.status !== 'final',
        attachedNote: doc.patient_data?.provider_notes || '',
        documentId: doc.id,
      };
    });

    return res.status(200).json({ appointments });
  } catch (error: any) {
    console.error('Appointments error:', error);
    return res.status(500).json({ error: error.message || 'Failed to load appointments' });
  }
}
