import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@/lib/supabase';
import { requireDoctor } from '@/lib/auth';

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

  const authResult = await requireDoctor({ req, res } as any);
  if ('redirect' in authResult || 'notFound' in authResult) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { user } = (authResult as { props: { user: { id: string } } }).props;
  const supabase = createServerClient({ req, res } as any);

  try {
    const nowIso = new Date().toISOString();
    const { data: appointmentsData, error } = await supabase
      .from('appointments')
      .select(
        'id, patient_name, appointment_type, location, scheduled_time, status, has_flag, notes_pending, attached_note, document_id, external_calendar_id'
      )
      .eq('doctor_id', user.id)
      .gte('scheduled_time', nowIso)
      .order('scheduled_time', { ascending: true })
      .limit(25);

    if (error) throw error;

    const appointments: Appointment[] = (appointmentsData || []).map((appointment: any) => {
      const scheduledTime = new Date(appointment.scheduled_time);
      const hours = scheduledTime.getHours();
      const minutes = scheduledTime.getMinutes();
      const time = `${String(hours % 12 || 12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
      const period = hours >= 12 ? 'PM' : 'AM';
      const status: Appointment['status'] =
        appointment.status === 'completed'
          ? 'completed'
          : appointment.status === 'in_progress'
          ? 'in_progress'
          : 'pending';
      return {
        id: appointment.id,
        time,
        period,
        patientName: appointment.patient_name || 'Unknown',
        appointmentType: appointment.appointment_type || 'Appointment',
        location: appointment.location || 'Virtual',
        status,
        hasFlag: Boolean(appointment.has_flag || appointment.notes_pending),
        attachedNote: appointment.attached_note || '',
        documentId: appointment.document_id || undefined,
      };
    });

    return res.status(200).json({ appointments });
  } catch (error: any) {
    console.error('Appointments error:', error);
    return res.status(500).json({ error: error.message || 'Failed to load appointments' });
  }
}
