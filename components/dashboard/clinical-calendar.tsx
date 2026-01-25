import { useState } from 'react';
import { CalendarPlus, CheckCircle } from 'lucide-react';

interface Appointment {
  id: string;
  time: string;
  period: 'AM' | 'PM';
  patientName: string;
  appointmentType: string;
  location: string;
  status: 'completed' | 'pending' | 'in_progress';
  hasFlag?: boolean;
}

const mockAppointments: Appointment[] = [
  {
    id: '1',
    time: '09:00',
    period: 'AM',
    patientName: 'Sarah Jenkins',
    appointmentType: 'Initial Evaluation',
    location: 'Room 204',
    status: 'completed',
  },
  {
    id: '2',
    time: '10:30',
    period: 'AM',
    patientName: 'Michael Barnes',
    appointmentType: 'Medication Mgmt',
    location: 'Virtual',
    status: 'pending',
    hasFlag: true,
  },
  {
    id: '3',
    time: '01:00',
    period: 'PM',
    patientName: 'Emma Roberts',
    appointmentType: 'Therapy Session',
    location: 'Room 204',
    status: 'in_progress',
  },
  {
    id: '4',
    time: '02:30',
    period: 'PM',
    patientName: 'James Wilson',
    appointmentType: 'Follow-up',
    location: 'Virtual',
    status: 'pending',
  },
];

export function ClinicalCalendar() {
  const [appointments] = useState<Appointment[]>(mockAppointments);

  return (
    <section className="px-6 py-2">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-foreground text-lg font-bold tracking-tight">Clinical Calendar</h3>
        <button className="glass-panel flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-card transition-colors group border-border shadow-sm">
          <CalendarPlus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
            Import iCal
          </span>
        </button>
      </div>
      
      <div className="flex flex-col gap-3">
        {appointments.map((apt) => (
          <div
            key={apt.id}
            className={`glass-panel p-4 rounded-2xl flex items-center gap-5 hover:bg-card/90 dark:hover:bg-card/50 transition-colors cursor-pointer border border-border relative overflow-hidden ${
              apt.hasFlag ? 'border-l-4 border-l-rose-500' : ''
            }`}
          >
            <div className="flex flex-col items-center justify-center min-w-[3.5rem] pr-5 border-r border-border">
              <span className="text-foreground font-bold text-lg">{apt.time}</span>
              <span className="text-muted-foreground text-[10px] uppercase font-bold tracking-wider">
                {apt.period}
              </span>
            </div>
            
            <div className="flex-1 flex flex-col justify-center">
              <h4 className="text-foreground font-bold text-sm">{apt.patientName}</h4>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-muted-foreground text-xs font-medium">
                  {apt.appointmentType}
                </span>
                <span className="size-1 rounded-full bg-muted-foreground/30" />
                <span className="text-muted-foreground text-xs">{apt.location}</span>
              </div>
            </div>
            
            {apt.status === 'completed' && (
              <div className="flex items-center justify-center size-8 rounded-full bg-teal-50 dark:bg-teal-500/10 text-teal-500 dark:text-teal-400">
                <CheckCircle className="h-5 w-5" />
              </div>
            )}
            
            {apt.status === 'pending' && apt.hasFlag && (
              <div className="flex items-center justify-center px-2.5 py-1 rounded-lg bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400">
                  Note Pending
                </span>
              </div>
            )}
            
            {apt.status === 'in_progress' && (
              <div className="flex items-center justify-center px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20">
                <span className="text-[10px] font-bold uppercase tracking-wider text-primary">
                  In Progress
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
