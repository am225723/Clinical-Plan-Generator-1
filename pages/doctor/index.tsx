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
import { LogOut, Settings, FileText, Loader2, AlertCircle, Download, Eye, Sparkles, History, Search, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DocumentTemplate {
  id: string;
  name: string;
  template_type: string;
  ai_prompt: string;
  is_default: boolean;
}

interface SavedDocument {
  id: string;
  template_type: string;
  patient_name: string;
  client_id: string;
  date_of_service: string;
  generated_content: any;
  patient_data: any;
  clinical_inputs: any;
  status: string;
  created_at: string;
}

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

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  treatment_plan: 'Treatment Plan',
  darp_note: 'DARP Note',
  psych_note: 'Psychiatric Note',
  progress_note: 'Progress Note',
  discharge_summary: 'Discharge Summary',
  custom: 'Custom',
};

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
  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [doctorSettings, setDoctorSettings] = useState<DoctorDocumentSettings | null>(null);
  
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('generate');
  
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentsTotal, setDocumentsTotal] = useState(0);

  useEffect(() => {
    loadSettings();
    loadTemplates();
  }, []);

  const loadSettings = async () => {
    const settings = await getDoctorSettings(supabase, user.id);
    setDoctorSettings(settings);
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
        const defaultTemplate = data.find((t: DocumentTemplate) => t.is_default);
        if (defaultTemplate) setSelectedTemplate(defaultTemplate);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadDocuments = async (search?: string) => {
    setDocumentsLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      params.set('limit', '20');
      
      const response = await fetch(`/api/documents?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSavedDocuments(data.documents);
        setDocumentsTotal(data.total);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    }
    setDocumentsLoading(false);
  };

  const handleSearch = () => {
    loadDocuments(searchQuery);
  };

  const handleSaveDocument = async () => {
    if (!validatePatientData()) {
      toast({ title: 'Missing Fields', description: 'Please fill required patient fields', variant: 'destructive' });
      return;
    }

    setIsSaving(true);
    try {
      const response = await fetch('/api/documents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          template_id: selectedTemplate?.id,
          template_type: selectedTemplate?.template_type || 'treatment_plan',
          patient_name: patientData.patient_name,
          client_id: patientData.client_id,
          date_of_service: patientData.date_of_service,
          patient_data: patientData,
          clinical_inputs: clinicalInputs,
          generated_content: generatedPlan,
          status: 'draft',
        }),
      });

      if (!response.ok) throw new Error('Failed to save document');
      
      toast({ title: 'Saved', description: 'Document saved to history' });
      loadDocuments();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save document', variant: 'destructive' });
    }
    setIsSaving(false);
  };

  const handleLoadDocument = (doc: SavedDocument) => {
    setPatientData(doc.patient_data);
    setClinicalInputs(doc.clinical_inputs || {
      intake_form_data: '',
      session_transcripts: '',
      assessment_scores: '',
      provider_notes: '',
    });
    setGeneratedPlan(doc.generated_content);
    setActiveTab('generate');
    toast({ title: 'Loaded', description: 'Document loaded successfully' });
  };

  const handleDeleteDocument = async (id: string) => {
    if (!confirm('Are you sure you want to delete this document?')) return;
    
    try {
      const response = await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast({ title: 'Deleted', description: 'Document deleted' });
      loadDocuments(searchQuery);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete document', variant: 'destructive' });
    }
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
      
      const customPrompt = selectedTemplate?.ai_prompt || appSettings?.treatment_plan_prompt;
      
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
          customPrompt,
          templateType: selectedTemplate?.template_type || 'treatment_plan',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate document');
      }

      const plan = await response.json();
      
      if (appendMode && generatedPlan) {
        setGeneratedPlan({ ...generatedPlan, ...plan });
      } else {
        setGeneratedPlan(plan);
      }

      toast({ title: 'Success', description: 'Document generated successfully' });
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
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === 'history') loadDocuments(); }}>
            <TabsList className="mb-6">
              <TabsTrigger value="generate" data-testid="tab-generate">
                <Sparkles className="h-4 w-4 mr-2" /> Generate
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">
                <History className="h-4 w-4 mr-2" /> History
              </TabsTrigger>
            </TabsList>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="h-5 w-5" /> Document History
                  </CardTitle>
                  <CardDescription>Search and view previously generated documents</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Search by patient name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      data-testid="input-search-documents"
                    />
                    <Button onClick={handleSearch} variant="outline" data-testid="button-search">
                      <Search className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {documentsLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : savedDocuments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No documents found</p>
                      <p className="text-sm">Generate and save a document to see it here</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {savedDocuments.map((doc) => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-slate-50"
                          data-testid={`document-item-${doc.id}`}
                        >
                          <div className="flex-1 cursor-pointer" onClick={() => handleLoadDocument(doc)}>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{doc.patient_name}</span>
                              <Badge variant="outline" className="text-xs">
                                {TEMPLATE_TYPE_LABELS[doc.template_type] || doc.template_type}
                              </Badge>
                              <Badge variant={doc.status === 'final' ? 'default' : 'secondary'} className="text-xs">
                                {doc.status}
                              </Badge>
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {doc.client_id && `ID: ${doc.client_id} • `}
                              {new Date(doc.date_of_service).toLocaleDateString()}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleLoadDocument(doc)}
                              data-testid={`button-load-${doc.id}`}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-red-600 hover:text-red-700"
                              data-testid={`button-delete-doc-${doc.id}`}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {documentsTotal > savedDocuments.length && (
                        <p className="text-center text-sm text-muted-foreground pt-2">
                          Showing {savedDocuments.length} of {documentsTotal} documents
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="generate">
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
                  {templates.length > 0 && (
                    <div className="space-y-2">
                      <Label>Document Template</Label>
                      <Select
                        value={selectedTemplate?.id || ''}
                        onValueChange={(v) => {
                          const template = templates.find(t => t.id === v);
                          setSelectedTemplate(template || null);
                        }}
                      >
                        <SelectTrigger data-testid="select-template">
                          <SelectValue placeholder="Select a template..." />
                        </SelectTrigger>
                        <SelectContent>
                          {templates.map((template) => (
                            <SelectItem key={template.id} value={template.id}>
                              {template.name}
                              {template.is_default && ' (Default)'}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {selectedTemplate && (
                        <p className="text-xs text-muted-foreground">
                          Type: {TEMPLATE_TYPE_LABELS[selectedTemplate.template_type] || selectedTemplate.template_type}
                        </p>
                      )}
                    </div>
                  )}
                  
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
                        Generate Document
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
                      <FileText className="h-5 w-5" /> {selectedTemplate ? TEMPLATE_TYPE_LABELS[selectedTemplate.template_type] || 'Document' : 'Document'}
                    </CardTitle>
                    <CardDescription>Generated clinical documentation</CardDescription>
                  </div>
                  {generatedPlan && (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSaveDocument}
                        disabled={isSaving}
                        data-testid="button-save-document"
                      >
                        {isSaving ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <Save className="h-4 w-4 mr-1" /> Save
                          </>
                        )}
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
                        {Object.entries(generatedPlan).map(([key, value]) => {
                          if (!value) return null;
                          const title = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
                          
                          if (Array.isArray(value)) {
                            return (
                              <div key={key}>
                                <h4 className="font-semibold">{title}</h4>
                                <ul className="list-disc pl-5">
                                  {value.map((item: any, i: number) => (
                                    <li key={i}>
                                      {typeof item === 'object' 
                                        ? item.code && item.name 
                                          ? `${item.code} - ${item.name}`
                                          : item.goal 
                                            ? <><span className="font-medium">{item.goal}</span>{item.objectives && <ul className="list-disc pl-5 mt-1">{item.objectives.map((o: string, j: number) => <li key={j}>{o}</li>)}</ul>}</>
                                            : JSON.stringify(item)
                                        : String(item)
                                      }
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            );
                          }
                          
                          if (typeof value === 'object') {
                            return (
                              <div key={key}>
                                <h4 className="font-semibold">{title}</h4>
                                <div className="pl-4 border-l-2 border-slate-200">
                                  {Object.entries(value as Record<string, any>).map(([k, v]) => (
                                    <p key={k}><span className="font-medium">{k.replace(/_/g, ' ')}:</span> {String(v)}</p>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                          
                          return (
                            <div key={key}>
                              <h4 className="font-semibold">{title}</h4>
                              <p>{String(value)}</p>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-50" />
                      <p>No document generated yet</p>
                      <p className="text-sm">Enter clinical inputs and click Generate</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx: any) => {
  return requireDoctor(ctx);
};
