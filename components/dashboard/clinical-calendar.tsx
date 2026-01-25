import { useState } from 'react';
import { CalendarPlus, CheckCircle, FileText, Sparkles, X, Clock, MapPin } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

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

interface ClinicalCalendarProps {
  onGenerateForAppointment?: (appointment: Appointment) => void;
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
    attachedNote: 'Initial psychiatric evaluation completed. Patient presents with symptoms of generalized anxiety disorder.',
    documentId: 'doc-1',
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

export function ClinicalCalendar({ onGenerateForAppointment }: ClinicalCalendarProps) {
  const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleAppointmentClick = (apt: Appointment) => {
    setSelectedAppointment(apt);
    setNoteText(apt.attachedNote || '');
    setIsDialogOpen(true);
  };

  const handleSaveNote = () => {
    if (!selectedAppointment) return;
    
    setAppointments(prev => prev.map(apt => 
      apt.id === selectedAppointment.id 
        ? { ...apt, attachedNote: noteText }
        : apt
    ));
    setIsDialogOpen(false);
  };

  const handleGenerateNote = () => {
    if (!selectedAppointment) return;
    
    if (onGenerateForAppointment) {
      onGenerateForAppointment(selectedAppointment);
    }
    setIsDialogOpen(false);
  };

  return (
    <>
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
            <button
              key={apt.id}
              onClick={() => handleAppointmentClick(apt)}
              className={`glass-panel p-4 rounded-2xl flex items-center gap-5 hover:bg-card/90 dark:hover:bg-card/50 transition-colors cursor-pointer border border-border relative overflow-hidden text-left w-full ${
                apt.hasFlag ? 'border-l-4 border-l-rose-500' : ''
              } ${apt.attachedNote ? 'ring-1 ring-primary/20' : ''}`}
              data-testid={`appointment-${apt.id}`}
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
                {apt.attachedNote && (
                  <div className="flex items-center gap-1 mt-1.5">
                    <FileText className="h-3 w-3 text-primary" />
                    <span className="text-[10px] text-primary font-medium">Note attached</span>
                  </div>
                )}
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
            </button>
          ))}
        </div>
      </section>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md glass-panel border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Appointment Details
            </DialogTitle>
          </DialogHeader>
          
          {selectedAppointment && (
            <div className="space-y-4">
              <div className="glass-panel rounded-xl p-4 space-y-3 border border-border/50">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-lg">{selectedAppointment.patientName}</h3>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    selectedAppointment.status === 'completed' 
                      ? 'bg-teal-50 dark:bg-teal-500/10 text-teal-600 dark:text-teal-400'
                      : selectedAppointment.status === 'in_progress'
                      ? 'bg-primary/10 text-primary'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {selectedAppointment.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {selectedAppointment.time} {selectedAppointment.period}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedAppointment.location}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{selectedAppointment.appointmentType}</p>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs uppercase text-muted-foreground font-medium">Clinical Notes</Label>
                <Textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Add clinical notes for this appointment..."
                  className="min-h-[120px] bg-muted/50 border-border/50 rounded-xl resize-none"
                  data-testid="textarea-appointment-note"
                />
              </div>
              
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handleSaveNote}
                >
                  Save Note
                </Button>
                <Button
                  className="flex-1 btn-gradient text-white"
                  onClick={handleGenerateNote}
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
