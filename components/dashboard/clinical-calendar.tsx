import { useState, useEffect, useRef } from 'react';
import { CalendarPlus, CheckCircle, FileText, Clock, MapPin, Sparkles, X } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSupabase } from '@/pages/_app';
import { edgeFunctions } from '@/lib/edge-functions';

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
  externalUid?: string;
  startTime?: string;
}

interface ClinicalCalendarProps {
  onGenerateForAppointment?: (appointment: Appointment) => void;
}

interface CalendarImportEvent {
  uid: string;
  summary: string;
  location: string;
  startTime: string;
  endTime?: string | null;
}

interface CalendarImportRecord {
  id: string;
  uid: string;
  summary: string | null;
  location: string | null;
  start_time: string;
  end_time: string | null;
}

export function ClinicalCalendar({ onGenerateForAppointment }: ClinicalCalendarProps) {
  const { supabase } = useSupabase();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [importedAppointments, setImportedAppointments] = useState<Appointment[]>([]);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [noteText, setNoteText] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchImportedAppointments = async () => {
      try {
        const data = await edgeFunctions.dashboard.calendarImports(supabase);
        const mapped = (data || []).map(mapImportRecordToAppointment);
        setImportedAppointments(mapped);
      } catch (error) {
        console.error('Failed to fetch imported events:', error);
      }
    };

    void fetchImportedAppointments();
  }, [supabase]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const data = await edgeFunctions.dashboard.appointments(supabase);
        setAppointments(data || []);
      } catch (error) {
        console.error('Failed to fetch appointments:', error);
      }
    };

    void fetchAppointments();
  }, [supabase]);

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
    
    const updatedAppointment = {
      ...selectedAppointment,
      attachedNote: noteText,
    };
    
    setAppointments(prev => prev.map(apt => 
      apt.id === selectedAppointment.id 
        ? updatedAppointment
        : apt
    ));
    
    if (onGenerateForAppointment) {
      onGenerateForAppointment(updatedAppointment);
    }
    setIsDialogOpen(false);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const events = parseIcal(text);
      const deduped = dedupeCalendarEvents(events, importedAppointments);
      if (deduped.length === 0) return;

      const data = await edgeFunctions.dashboard.importCalendar(supabase, deduped);
      const mapped = (data.events || []).map(mapImportRecordToAppointment);
      setImportedAppointments((prev) => mergeAppointments(prev, mapped));
    } catch (error) {
      console.error('Failed to import iCal:', error);
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const combinedAppointments = [...appointments, ...importedAppointments];

  return (
    <>
      <section className="px-6 py-2">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-foreground text-lg font-bold tracking-tight">Clinical Calendar</h3>
          <button
            onClick={handleImportClick}
            className="glass-panel flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-card transition-colors group border-border shadow-sm"
            data-testid="button-import-ical"
          >
            <CalendarPlus className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
            <span className="text-xs font-semibold text-muted-foreground group-hover:text-foreground">
              Import iCal
            </span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".ics"
            onChange={handleImportChange}
            className="hidden"
          />
        </div>
        
        <div className="flex flex-col gap-3">
          {combinedAppointments.map((apt) => (
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
                  data-testid="button-save-appointment-note"
                >
                  Save Note
                </Button>
                <Button
                  className="flex-1 btn-gradient text-white"
                  onClick={handleGenerateNote}
                  data-testid="button-generate-from-appointment"
                >
                  <Sparkles className="h-4 w-4 mr-2" />
                  Generate Document
                </Button>
              </div>
              <button
                onClick={() => setIsDialogOpen(false)}
                className="absolute top-4 right-4 p-1.5 rounded-lg hover:bg-muted transition-colors"
                aria-label="Close dialog"
                data-testid="button-close-appointment-dialog"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function parseIcal(icsText: string): CalendarImportEvent[] {
  const events = icsText.split('BEGIN:VEVENT').slice(1);
  return events.map((eventText, index) => {
    const summary = matchIcalField(eventText, 'SUMMARY') || 'Imported Appointment';
    const location = matchIcalField(eventText, 'LOCATION') || 'Virtual';
    const dtStart = matchIcalField(eventText, 'DTSTART') || '';
    const dtEnd = matchIcalField(eventText, 'DTEND');
    const startDate = parseIcalDate(dtStart) ?? new Date();
    const endDate = dtEnd ? parseIcalDate(dtEnd) : null;
    const uid = matchIcalField(eventText, 'UID') || `${summary}-${startDate.getTime()}-${index}`;

    return {
      uid,
      summary,
      location,
      startTime: startDate.toISOString(),
      endTime: endDate ? endDate.toISOString() : null,
    };
  });
}

function matchIcalField(text: string, field: string): string | null {
  const match = text.match(new RegExp(`${field}:([^\\r\\n]*)`));
  return match ? match[1].trim() : null;
}

function parseIcalDate(value: string): Date | null {
  if (!value) return null;
  const dateOnly = /^\d{8}$/.test(value);
  if (dateOnly) {
    const formatted = `${value.slice(0, 4)}-${value.slice(4, 6)}-${value.slice(6, 8)}T09:00:00`;
    const date = new Date(formatted);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const dateTimeWithSeconds = /^\d{8}T\d{6}/.test(value);
  const dateTimeWithMinutes = /^\d{8}T\d{4}/.test(value);

  if (dateTimeWithSeconds || dateTimeWithMinutes) {
    const year = value.slice(0, 4);
    const month = value.slice(4, 6);
    const day = value.slice(6, 8);
    const hour = value.slice(9, 11);
    const minute = value.slice(11, 13);
    const second = dateTimeWithSeconds ? value.slice(13, 15) : '00';
    const formatted = `${year}-${month}-${day}T${hour}:${minute}:${second}`;
    const date = new Date(formatted);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function mapImportRecordToAppointment(record: CalendarImportRecord): Appointment {
  const date = new Date(record.start_time);
  const hours = date.getHours() || 9;
  const minutes = date.getMinutes();
  const time = `${String(hours % 12 || 12).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  const period = hours >= 12 ? 'PM' : 'AM';
  return {
    id: `calendar-${record.id}`,
    time,
    period,
    patientName: record.summary || 'Imported Appointment',
    appointmentType: 'Imported',
    location: record.location || 'Virtual',
    status: 'pending',
    externalUid: record.uid,
    startTime: record.start_time,
  };
}

function buildCalendarKey(uid: string, startTime: string) {
  return `${uid}-${startTime}`;
}

function dedupeCalendarEvents(events: CalendarImportEvent[], existing: Appointment[]) {
  const existingKeys = new Set(
    existing
      .map((apt) => (apt.externalUid && apt.startTime ? buildCalendarKey(apt.externalUid, apt.startTime) : null))
      .filter(Boolean) as string[]
  );

  return events.filter((event) => {
    const key = buildCalendarKey(event.uid, event.startTime);
    if (existingKeys.has(key)) return false;
    existingKeys.add(key);
    return true;
  });
}

function mergeAppointments(existing: Appointment[], incoming: Appointment[]) {
  const merged = new Map<string, Appointment>();
  existing.forEach((apt) => {
    const key = apt.externalUid && apt.startTime ? buildCalendarKey(apt.externalUid, apt.startTime) : apt.id;
    merged.set(key, apt);
  });
  incoming.forEach((apt) => {
    const key = apt.externalUid && apt.startTime ? buildCalendarKey(apt.externalUid, apt.startTime) : apt.id;
    merged.set(key, apt);
  });
  return Array.from(merged.values()).sort((a, b) => a.time.localeCompare(b.time));
}
