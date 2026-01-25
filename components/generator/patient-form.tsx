import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { User, Lock, Stethoscope } from 'lucide-react';

interface PatientData {
  patient_name: string;
  client_id: string;
  date_of_birth: string;
  appointment_type: string;
  date_of_service: string;
  provider_name: string;
}

interface ValidationErrors {
  patient_name?: string;
  client_id?: string;
  date_of_birth?: string;
  appointment_type?: string;
  date_of_service?: string;
  provider_name?: string;
}

interface PatientFormProps {
  patientData: PatientData;
  onPatientDataChange: (data: PatientData) => void;
  validationErrors: ValidationErrors;
  providerName: string;
}

const APPOINTMENT_TYPES = [
  'Initial Evaluation',
  'Follow-up',
  'Medication Management',
  'Psychotherapy',
  'Crisis Intervention',
];

export function PatientForm({
  patientData,
  onPatientDataChange,
  validationErrors,
  providerName,
}: PatientFormProps) {
  const updateField = (field: keyof PatientData, value: string) => {
    onPatientDataChange({ ...patientData, [field]: value });
  };

  return (
    <div className="glass-panel rounded-3xl p-5 shadow-lg relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
      
      <div className="flex justify-between items-center mb-5 border-b border-border pb-3">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Patient Information
        </h2>
      </div>
      
      <div className="grid grid-cols-2 gap-x-4 gap-y-5">
        <div className="col-span-1">
          <Label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
            Client ID *
          </Label>
          <Input
            value={patientData.client_id}
            onChange={(e) => updateField('client_id', e.target.value)}
            placeholder="Enter ID"
            className={`bg-card/60 dark:bg-card/30 border-border rounded-xl font-mono tracking-wide ${
              validationErrors.client_id ? 'border-destructive' : ''
            }`}
            data-testid="input-client-id"
          />
        </div>
        
        <div className="col-span-1">
          <Label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
            Patient Name *
          </Label>
          <Input
            value={patientData.patient_name}
            onChange={(e) => updateField('patient_name', e.target.value)}
            placeholder="Enter name"
            className={`bg-card/60 dark:bg-card/30 border-border rounded-xl ${
              validationErrors.patient_name ? 'border-destructive' : ''
            }`}
            data-testid="input-patient-name"
          />
        </div>
        
        <div className="col-span-1">
          <Label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
            Date of Service *
          </Label>
          <Input
            type="date"
            value={patientData.date_of_service}
            onChange={(e) => updateField('date_of_service', e.target.value)}
            className={`bg-card/60 dark:bg-card/30 border-border rounded-xl ${
              validationErrors.date_of_service ? 'border-destructive' : ''
            }`}
            data-testid="input-dos"
          />
        </div>
        
        <div className="col-span-1">
          <Label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
            Date of Birth *
          </Label>
          <Input
            type="date"
            value={patientData.date_of_birth}
            onChange={(e) => updateField('date_of_birth', e.target.value)}
            className={`bg-card/60 dark:bg-card/30 border-border rounded-xl ${
              validationErrors.date_of_birth ? 'border-destructive' : ''
            }`}
            data-testid="input-dob"
          />
        </div>
        
        <div className="col-span-2">
          <Label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
            Appointment Type *
          </Label>
          <Select
            value={patientData.appointment_type}
            onValueChange={(v) => updateField('appointment_type', v)}
          >
            <SelectTrigger
              className={`bg-card/60 dark:bg-card/30 border-border rounded-xl ${
                validationErrors.appointment_type ? 'border-destructive' : ''
              }`}
              data-testid="select-appointment-type"
            >
              <SelectValue placeholder="Select type..." />
            </SelectTrigger>
            <SelectContent>
              {APPOINTMENT_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div className="col-span-2 mt-1">
          <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-card/60 dark:from-card/30 to-transparent border border-border">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center mr-3 border border-primary/20 shadow-glow">
                <Stethoscope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-bold">
                  Provider
                </p>
                <p className="text-sm font-semibold text-foreground">{providerName}</p>
              </div>
            </div>
            <Badge variant="outline" className="text-primary border-primary/20">
              <Lock className="h-3 w-3 mr-1" />
              Verified
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
