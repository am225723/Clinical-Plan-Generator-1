import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from '../_app';
import { requireDoctor } from '@/lib/auth';
import { Profile, getAppSettings, getDoctorSettings, DoctorDocumentSettings } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { LogOut, Settings, FileText, Loader2, AlertCircle, Download, Eye, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DoctorPageProps {
  user: any;
  profile: Profile;
}

interface ValidationErrors {
  patient_name?: string;
  client_id?: string;
  date_of_birth?: string;
  appointment_type?: string;
  date_of_service?: string;
  provider_name?: string;
}

interface PatientData {
  patient_name: string;
  client_id: string;
  date_of_birth: string;
  appointment_type: string;
  date_of_service: string;
  provider_name: string;
}

export default function DoctorDashboard({ user, profile }: DoctorPageProps) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [patientData, setPatientData] = useState<PatientData>({
    patient_name: '',
    client_id: '',
    date_of_birth: '',
    appointment_type: '',
    date_of_service: new Date().toISOString().split('T')[0],
    provider_name: profile.full_name || '',
  });
  
  const [clinicalInputs, setClinicalInputs] = useState({
    intake_form_data: '',
    session_transcripts: '',
    assessment_scores: '',
    provider_notes: '',
  });
  
  const [generatedPlan, setGeneratedPlan] = useState<any>(null);
  const [detailLevel, setDetailLevel] = useState<'brief' | 'standard' | 'detailed'>('standard');
  const [aiAdjustment, setAiAdjustment] = useState('');
  const [appendMode, setAppendMode] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [doctorSettings, setDoctorSettings] = useState<DoctorDocumentSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const settings = await getDoctorSettings(supabase, user.id);
    setDoctorSettings(settings);
  };

  const validatePatientData = (): boolean => {
    const errors: ValidationErrors = {};
    
    if (!patientData.patient_name.trim()) errors.patient_name = 'Required';
    if (!patientData.client_id.trim()) errors.client_id = 'Required';
    if (!patientData.date_of_birth) errors.date_of_birth = 'Required';
    if (!patientData.appointment_type.trim()) errors.appointment_type = 'Required';
    if (!patientData.date_of_service) errors.date_of_service = 'Required';
    if (!patientData.provider_name.trim()) errors.provider_name = 'Required';
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleGenerate = async () => {
    setIsGenerating(true);

    try {
      const appSettings = await getAppSettings(supabase);
      
      const response = await fetch('/api/generate-treatment-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputs: clinicalInputs,
          patientData,
          detailLevel,
          aiAdjustment,
          appendMode,
          existingPlan: appendMode ? generatedPlan : null,
          customPrompt: appSettings?.treatment_plan_prompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate treatment plan');
      }

      const plan = await response.json();
      
      if (appendMode && generatedPlan) {
        setGeneratedPlan({ ...generatedPlan, ...plan });
      } else {
        setGeneratedPlan(plan);
      }

      toast({ title: 'Success', description: 'Treatment plan generated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!validatePatientData()) {
      toast({ 
        title: 'Missing Required Fields', 
        description: 'Please fill in all required patient information before downloading', 
        variant: 'destructive' 
      });
      return;
    }

    setIsDownloading(true);

    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientData,
          treatmentPlan: generatedPlan,
          doctorSettings,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.missing_fields) {
          toast({ 
            title: 'Missing Fields', 
            description: `Please fill in: ${data.missing_fields.join(', ')}`, 
            variant: 'destructive' 
          });
          return;
        }
        throw new Error(data.error);
      }

      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(data.html);
        printWindow.document.close();
        setTimeout(() => {
          printWindow.print();
        }, 500);
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const missingFields = Object.entries(validationErrors).filter(([_, v]) => v);

  return (
    <>
      <Head>
        <title>Doctor Dashboard | GoldStandard Clinical</title>
      </Head>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between print:hidden">
          <h1 className="font-serif font-bold text-xl text-slate-800">
            GoldStandard<span className="text-blue-600">Clinical</span>
            <Badge variant="outline" className="ml-3">Doctor</Badge>
          </h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{profile.full_name || user.email}</span>
            <Button variant="ghost" size="sm" onClick={() => router.push('/settings')} data-testid="button-settings">
              <Settings className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={handleSignOut} data-testid="button-signout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        <main className="container mx-auto py-6 px-4">
          <div className="grid lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                  <CardDescription>Required fields for documentation</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="patient_name">Patient Name *</Label>
                      <Input
                        id="patient_name"
                        value={patientData.patient_name}
                        onChange={(e) => setPatientData({ ...patientData, patient_name: e.target.value })}
                        className={validationErrors.patient_name ? 'border-red-500' : ''}
                        data-testid="input-patient-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="client_id">Client ID *</Label>
                      <Input
                        id="client_id"
                        value={patientData.client_id}
                        onChange={(e) => setPatientData({ ...patientData, client_id: e.target.value })}
                        className={validationErrors.client_id ? 'border-red-500' : ''}
                        data-testid="input-client-id"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_birth">Date of Birth *</Label>
                      <Input
                        id="date_of_birth"
                        type="date"
                        value={patientData.date_of_birth}
                        onChange={(e) => setPatientData({ ...patientData, date_of_birth: e.target.value })}
                        className={validationErrors.date_of_birth ? 'border-red-500' : ''}
                        data-testid="input-dob"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="appointment_type">Appointment Type *</Label>
                      <Input
                        id="appointment_type"
                        value={patientData.appointment_type}
                        onChange={(e) => setPatientData({ ...patientData, appointment_type: e.target.value })}
                        placeholder="e.g., Initial Evaluation"
                        className={validationErrors.appointment_type ? 'border-red-500' : ''}
                        data-testid="input-appointment-type"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="date_of_service">Date of Service *</Label>
                      <Input
                        id="date_of_service"
                        type="date"
                        value={patientData.date_of_service}
                        onChange={(e) => setPatientData({ ...patientData, date_of_service: e.target.value })}
                        className={validationErrors.date_of_service ? 'border-red-500' : ''}
                        data-testid="input-dos"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="provider_name">Provider Name *</Label>
                      <Input
                        id="provider_name"
                        value={patientData.provider_name}
                        onChange={(e) => setPatientData({ ...patientData, provider_name: e.target.value })}
                        className={validationErrors.provider_name ? 'border-red-500' : ''}
                        data-testid="input-provider-name"
                      />
                    </div>
                  </div>

                  {missingFields.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Missing Required Fields</AlertTitle>
                      <AlertDescription>
                        Please fill in: {missingFields.map(([key]) => key.replace('_', ' ')).join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Clinical Inputs</CardTitle>
                  <CardDescription>Enter clinical documentation to generate treatment plan</CardDescription>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="intake">
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="intake">Intake</TabsTrigger>
                      <TabsTrigger value="session">Session</TabsTrigger>
                      <TabsTrigger value="scores">Scores</TabsTrigger>
                      <TabsTrigger value="notes">Notes</TabsTrigger>
                    </TabsList>
                    <TabsContent value="intake" className="mt-4">
                      <Textarea
                        placeholder="Paste intake form data..."
                        value={clinicalInputs.intake_form_data}
                        onChange={(e) => setClinicalInputs({ ...clinicalInputs, intake_form_data: e.target.value })}
                        rows={8}
                        data-testid="textarea-intake"
                      />
                    </TabsContent>
                    <TabsContent value="session" className="mt-4">
                      <Textarea
                        placeholder="Paste session transcripts..."
                        value={clinicalInputs.session_transcripts}
                        onChange={(e) => setClinicalInputs({ ...clinicalInputs, session_transcripts: e.target.value })}
                        rows={8}
                        data-testid="textarea-session"
                      />
                    </TabsContent>
                    <TabsContent value="scores" className="mt-4">
                      <Textarea
                        placeholder="Enter assessment scores..."
                        value={clinicalInputs.assessment_scores}
                        onChange={(e) => setClinicalInputs({ ...clinicalInputs, assessment_scores: e.target.value })}
                        rows={8}
                        data-testid="textarea-scores"
                      />
                    </TabsContent>
                    <TabsContent value="notes" className="mt-4">
                      <Textarea
                        placeholder="Provider notes..."
                        value={clinicalInputs.provider_notes}
                        onChange={(e) => setClinicalInputs({ ...clinicalInputs, provider_notes: e.target.value })}
                        rows={8}
                        data-testid="textarea-notes"
                      />
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5" /> AI Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Detail Level</Label>
                    <Select value={detailLevel} onValueChange={(v: any) => setDetailLevel(v)}>
                      <SelectTrigger data-testid="select-detail-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brief">Brief</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>AI Adjustment Instructions</Label>
                    <Textarea
                      placeholder="Add specific instructions for AI refinement..."
                      value={aiAdjustment}
                      onChange={(e) => setAiAdjustment(e.target.value)}
                      rows={3}
                      data-testid="textarea-ai-adjustment"
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="append-mode">Append to existing plan</Label>
                    <Switch
                      id="append-mode"
                      checked={appendMode}
                      onCheckedChange={setAppendMode}
                      disabled={!generatedPlan}
                      data-testid="switch-append-mode"
                    />
                  </div>
                  
                  <Button
                    onClick={handleGenerate}
                    disabled={isGenerating}
                    className="w-full"
                    data-testid="button-generate"
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" />
                        Generate Treatment Plan
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="min-h-[600px]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" /> Treatment Plan
                    </CardTitle>
                    <CardDescription>Generated clinical documentation</CardDescription>
                  </div>
                  {generatedPlan && (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" data-testid="button-preview">
                        <Eye className="h-4 w-4 mr-1" /> Preview
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        data-testid="button-download-pdf"
                      >
                        {isDownloading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-1" /> PDF
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardHeader>
                <CardContent>
                  {generatedPlan ? (
                    <div className="prose prose-sm max-w-none">
                      <div className="space-y-4 text-sm">
                        {generatedPlan.chief_complaint && (
                          <div>
                            <h4 className="font-semibold">Chief Complaint</h4>
                            <p>{generatedPlan.chief_complaint}</p>
                          </div>
                        )}
                        {generatedPlan.hpi && (
                          <div>
                            <h4 className="font-semibold">History of Present Illness</h4>
                            <p>{generatedPlan.hpi}</p>
                          </div>
                        )}
                        {generatedPlan.diagnosis && (
                          <div>
                            <h4 className="font-semibold">Diagnosis</h4>
                            <ul className="list-disc pl-5">
                              {generatedPlan.diagnosis.map((d: any, i: number) => (
                                <li key={i}>{d.code} - {d.name}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                        {generatedPlan.treatment_goals && (
                          <div>
                            <h4 className="font-semibold">Treatment Goals</h4>
                            {generatedPlan.treatment_goals.map((g: any, i: number) => (
                              <div key={i} className="mb-2">
                                <p className="font-medium">{g.goal}</p>
                                <ul className="list-disc pl-5">
                                  {g.objectives?.map((o: string, j: number) => (
                                    <li key={j}>{o}</li>
                                  ))}
                                </ul>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-50" />
                      <p>No treatment plan generated yet</p>
                      <p className="text-sm">Enter clinical inputs and click Generate</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requireDoctor(ctx);
};
