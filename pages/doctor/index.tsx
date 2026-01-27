import Head from 'next/head';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from '../_app';
import { requireDoctor } from '@/lib/auth';
import { Profile, getAppSettings, getDoctorSettings, DoctorDocumentSettings } from '@/lib/supabase';
import { edgeFunctions } from '@/lib/edge-functions';
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
import { LogOut, Settings, FileText, Loader2, AlertCircle, Download, Eye, Sparkles, History, Search, Save, Trash2, LayoutDashboard } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { DashboardHeader } from '@/components/dashboard/header';
import { PracticeStats } from '@/components/dashboard/practice-stats';
import { ClinicalCalendar } from '@/components/dashboard/clinical-calendar';
import { BottomNav } from '@/components/ui/bottom-nav';
import { FileUpload, UploadedFile } from '@/components/generator/file-upload';
import { NoteEditor } from '@/components/generator/note-editor';
import { DocumentPreview } from '@/components/generator/document-preview';
import { ValidationScreen } from '@/components/generator/validation-screen';
import { FormatExportPanel } from '@/components/generator/format-export-panel';
import { ClinicalContextTabs } from '@/components/generator/clinical-context-tabs';
import { SlidersHorizontal, Check } from 'lucide-react';

interface DocumentTemplate {
  id: string;
  name: string;
  template_type: string;
  ai_prompt: string;
  is_default: boolean;
  pdf_config?: {
    sections?: Array<{ id: string; name: string; required: boolean; order: number }>;
    guardrails?: Array<{ id: string; name: string; enabled: boolean; description: string }>;
  };
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
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const [savedDocuments, setSavedDocuments] = useState<SavedDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [documentsTotal, setDocumentsTotal] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [editableContent, setEditableContent] = useState('');
  const [editorDetailLevel, setEditorDetailLevel] = useState(50);
  const [showPreview, setShowPreview] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [missingFields, setMissingFields] = useState<string[]>([]);
  const [showFormatPanel, setShowFormatPanel] = useState(false);
  const [formatSettings, setFormatSettings] = useState({
    fontSize: 12,
    lineHeight: 'normal' as 'compact' | 'normal',
    fontWeight: 'normal' as 'normal' | 'bold',
  });
  const processedFileIds = useRef<Set<string>>(new Set());
  const transcriptionPollers = useRef<Record<string, NodeJS.Timeout>>({});

  useEffect(() => {
    loadSettings();
    loadTemplates();
  }, []);

  useEffect(() => {
    return () => {
      Object.values(transcriptionPollers.current).forEach((interval) => clearInterval(interval));
      transcriptionPollers.current = {};
    };
  }, []);

  useEffect(() => {
    const pendingFiles = uploadedFiles.filter((file) => !processedFileIds.current.has(file.id));
    if (pendingFiles.length === 0) return;

    const processFiles = async () => {
      for (const file of pendingFiles) {
        let summary = `Attached ${file.type.toUpperCase()} file: ${file.name} (${Math.round(file.size / 1024)} KB)`;
        if (file.type === 'text') {
          try {
            const text = await file.file.text();
            summary += `\n${text}`;
          } catch (error) {
            summary += '\n[Unable to read text file contents]';
          }
        }
        if (file.type === 'pdf') {
          try {
            const pdfText = await extractPdfText(file.file);
            summary += `\n${pdfText}`;
          } catch (error) {
            summary += '\n[Unable to extract PDF text content]';
          }
        }
        if (file.type === 'audio' || file.type === 'video') {
          summary += '\n[Transcription submitted. Transcript will be added automatically when ready.]';
          try {
            const base64 = await fileToBase64(file.file);
            const data = await edgeFunctions.transcriptions.create(supabase, {
              fileName: file.name,
              fileType: file.type,
              contentType: file.file.type || undefined,
              data: base64,
            });
            if (data.status === 'completed' && data.transcript) {
              appendTranscript(file.name, data.transcript);
            } else if (data.status === 'failed') {
              toast({
                title: 'Transcription failed',
                description: data.error || `Unable to transcribe ${file.name}.`,
                variant: 'destructive',
              });
            } else {
              startPollingTranscription(data.jobId, file.name);
            }
          } catch (error: any) {
            toast({
              title: 'Transcription error',
              description: error?.message || `Unable to transcribe ${file.name}.`,
              variant: 'destructive',
            });
          }
        }
        setClinicalInputs((prev) => ({
          ...prev,
          provider_notes: `${prev.provider_notes || ''}\n\n${summary}`.trim(),
        }));
        processedFileIds.current.add(file.id);
      }
    };

    void processFiles();
  }, [uploadedFiles]);

  const extractPdfText = async (file: File): Promise<string> => {
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const buffer = await file.arrayBuffer();
    const pdf = await pdfjs.getDocument({ data: buffer }).promise;
    const maxPages = Math.min(pdf.numPages, 5);
    let text = '';
    for (let pageNum = 1; pageNum <= maxPages; pageNum += 1) {
      const page = await pdf.getPage(pageNum);
      const content = await page.getTextContent();
      const pageText = content.items.map((item: any) => item.str).join(' ');
      text += `${pageText}\n`;
    }
    return text.trim();
  };

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });

  const appendTranscript = (fileName: string, transcript: string) => {
    setClinicalInputs((prev) => ({
      ...prev,
      session_transcripts: [
        prev.session_transcripts,
        `Transcript (${fileName}):\n${transcript}`.trim(),
      ]
        .filter(Boolean)
        .join('\n\n')
        .trim(),
    }));
  };

  const pollTranscriptionJob = async (jobId: string, fileName: string) => {
    try {
      const data = await edgeFunctions.transcriptions.get(supabase, jobId);
      if (data.status === 'completed' && data.transcript) {
        appendTranscript(fileName, data.transcript);
        toast({ title: 'Transcription ready', description: `${fileName} transcript added.` });
        if (transcriptionPollers.current[jobId]) {
          clearInterval(transcriptionPollers.current[jobId]);
          delete transcriptionPollers.current[jobId];
        }
      }
      if (data.status === 'failed') {
        toast({
          title: 'Transcription failed',
          description: data.error || `Unable to transcribe ${fileName}.`,
          variant: 'destructive',
        });
        if (transcriptionPollers.current[jobId]) {
          clearInterval(transcriptionPollers.current[jobId]);
          delete transcriptionPollers.current[jobId];
        }
      }
      return data;
    } catch (error) {
      throw new Error('Unable to fetch transcription status.');
    }
  };

  const startPollingTranscription = (jobId: string, fileName: string) => {
    if (transcriptionPollers.current[jobId]) return;
    transcriptionPollers.current[jobId] = setInterval(() => {
      void pollTranscriptionJob(jobId, fileName);
    }, 5000);
    void pollTranscriptionJob(jobId, fileName);
  };

  const buildPrompt = (basePrompt?: string | null, template?: DocumentTemplate | null) => {
    let prompt = basePrompt || '';
    const sections = template?.pdf_config?.sections || [];
    const guardrails = template?.pdf_config?.guardrails || [];

    if (sections.length > 0) {
      const ordered = [...sections].sort((a, b) => a.order - b.order);
      const sectionLines = ordered.map((section) => `- ${section.name}${section.required ? ' (required)' : ''}`).join('\n');
      prompt += `\n\nSECTION ORDERING:\n${sectionLines}\n`;
    }

    const enabledGuardrails = guardrails.filter((guardrail) => guardrail.enabled);
    if (enabledGuardrails.length > 0) {
      const guardrailLines = enabledGuardrails
        .map((guardrail) => `- ${guardrail.name}: ${guardrail.description}`)
        .join('\n');
      prompt += `\nGUARDRAILS:\n${guardrailLines}\n`;
    }

    return prompt.trim();
  };

  const getSectionOrder = (template?: DocumentTemplate | null) => {
    if (!template?.pdf_config?.sections) return null;
    return [...template.pdf_config.sections]
      .sort((a, b) => a.order - b.order)
      .map((section) => section.name);
  };

  useEffect(() => {
    const tab = router.query.tab as string;
    if (tab && ['dashboard', 'generate', 'history'].includes(tab)) {
      setActiveTab(tab);
      if (tab === 'history') {
        loadDocuments();
      }
    }
  }, [router.query.tab]);

  const loadSettings = async () => {
    const settings = await getDoctorSettings(supabase, user.id);
    setDoctorSettings(settings);
  };

  const loadTemplates = async () => {
    try {
      const data = await edgeFunctions.templates.list(supabase);
      setTemplates(data);
      const defaultTemplate = data.find((t: DocumentTemplate) => t.is_default);
      if (defaultTemplate) setSelectedTemplate(defaultTemplate);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const loadDocuments = async (search?: string) => {
    setDocumentsLoading(true);
    try {
      const data = await edgeFunctions.documents.list(supabase, { search, limit: 20 });
      setSavedDocuments(data.documents);
      setDocumentsTotal(data.total);
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
      await edgeFunctions.documents.create(supabase, {
        template_id: selectedTemplate?.id,
        template_type: selectedTemplate?.template_type || 'treatment_plan',
        patient_name: patientData.patient_name,
        client_id: patientData.client_id,
        date_of_service: patientData.date_of_service,
        patient_data: patientData,
        clinical_inputs: clinicalInputs,
        generated_content: generatedPlan,
        status: 'draft',
      });
      
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
      await edgeFunctions.documents.delete(supabase, id);
      toast({ title: 'Deleted', description: 'Document deleted' });
      loadDocuments(searchQuery);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete document', variant: 'destructive' });
    }
  };

  const planToMarkdown = (plan: any): string => {
    if (!plan) return '';
    const sectionOrder = getSectionOrder(selectedTemplate);
    const normalizedMap: Record<string, string> = {
      'patient demographics': 'patient_demographics',
      'chief complaint': 'chief_complaint',
      'history of present illness': 'hpi',
      'mental status exam': 'mse',
      'assessment & diagnosis': 'diagnosis',
      'assessment and diagnosis': 'diagnosis',
      'treatment plan': 'treatment_goals',
      'recommendations': 'recommendations',
      'medical decision making': 'medical_decision_making',
      'risk assessment': 'risk_assessment',
    };
    const entries = Object.entries(plan);
    const orderedEntries: [string, any][] = [];
    const usedKeys = new Set<string>();

    if (sectionOrder) {
      sectionOrder.forEach((section) => {
        const key = normalizedMap[section.toLowerCase()];
        if (!key) return;
        const entry = entries.find(([entryKey]) => entryKey === key);
        if (entry) {
          orderedEntries.push(entry);
          usedKeys.add(entry[0]);
        }
      });
    }

    entries.forEach((entry) => {
      if (!usedKeys.has(entry[0])) orderedEntries.push(entry);
    });

    let md = '';
    orderedEntries.forEach(([key, value]) => {
      if (!value) return;
      const title = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      md += `## ${title}\n\n`;
      if (Array.isArray(value)) {
        value.forEach((item: any) => {
          if (typeof item === 'object') {
            if (item.code && item.name) {
              md += `- ${item.code} - ${item.name}\n`;
            } else if (item.goal) {
              md += `- **${item.goal}**\n`;
              if (item.objectives) {
                item.objectives.forEach((o: string) => md += `  - ${o}\n`);
              }
            } else {
              md += `- ${JSON.stringify(item)}\n`;
            }
          } else {
            md += `- ${String(item)}\n`;
          }
        });
      } else if (typeof value === 'object') {
        Object.entries(value as Record<string, any>).forEach(([k, v]) => {
          md += `**${k.replace(/_/g, ' ')}:** ${String(v)}\n`;
        });
      } else {
        md += `${String(value)}\n`;
      }
      md += '\n';
    });
    return md;
  };

  const handleRefine = async (instruction: string, detailLevel: number) => {
    if (!editableContent) return;
    setIsGenerating(true);
    try {
      const customPrompt = buildPrompt(selectedTemplate?.ai_prompt, selectedTemplate);
      const result = await edgeFunctions.generate.treatmentPlan(supabase, {
        inputs: { ...clinicalInputs, existing_content: editableContent },
        patientData,
        detailLevel: detailLevel <= 25 ? 'brief' : detailLevel <= 75 ? 'standard' : 'detailed',
        aiAdjustment: instruction,
        appendMode: true,
        existingPlan: generatedPlan,
        customPrompt,
        templateType: selectedTemplate?.template_type || 'treatment_plan',
      });
      const plan = result.treatment_plan || result;
      setGeneratedPlan(plan);
      setEditableContent(planToMarkdown(plan));
      toast({ title: 'Success', description: 'Document refined successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerate = async (detailLevel: number) => {
    setIsGenerating(true);
    try {
      const appSettings = await getAppSettings(supabase);
      const customPrompt = buildPrompt(
        selectedTemplate?.ai_prompt || appSettings?.treatment_plan_prompt,
        selectedTemplate
      );
      const result = await edgeFunctions.generate.treatmentPlan(supabase, {
        inputs: clinicalInputs,
        patientData,
        detailLevel: detailLevel <= 25 ? 'brief' : detailLevel <= 75 ? 'standard' : 'detailed',
        aiAdjustment,
        appendMode: false,
        existingPlan: null,
        customPrompt,
        templateType: selectedTemplate?.template_type || 'treatment_plan',
      });
      const plan = result.treatment_plan || result;
      setGeneratedPlan(plan);
      setEditableContent(planToMarkdown(plan));
      toast({ title: 'Success', description: 'Document regenerated successfully' });
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsGenerating(false);
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

  const checkMissingFields = (): string[] => {
    const missing: string[] = [];
    if (!clinicalInputs.intake_form_data.trim()) missing.push('Intake Form');
    if (!clinicalInputs.session_transcripts.trim()) missing.push('Session Transcript');
    if (!clinicalInputs.assessment_scores.trim()) missing.push('Assessment Scores');
    if (!clinicalInputs.provider_notes.trim()) missing.push('Provider Notes');
    return missing;
  };

  const handleValidateAndGenerate = () => {
    const missing = checkMissingFields();
    if (missing.length > 0) {
      setMissingFields(missing);
      setShowValidation(true);
    } else {
      handleGenerate();
    }
  };

  const handleValidationComplete = (field: string, value: string) => {
    const fieldMap: Record<string, keyof typeof clinicalInputs> = {
      'Intake Form': 'intake_form_data',
      'Session Transcript': 'session_transcripts',
      'Assessment Scores': 'assessment_scores',
      'Provider Notes': 'provider_notes',
    };
    const key = fieldMap[field];
    if (key) {
      setClinicalInputs({ ...clinicalInputs, [key]: value });
      setMissingFields(missingFields.filter(f => f !== field));
    }
  };

  const handleGenerate = async () => {
    setShowValidation(false);
    setIsGenerating(true);

    try {
      const appSettings = await getAppSettings(supabase);
      
      const customPrompt = buildPrompt(
        selectedTemplate?.ai_prompt || appSettings?.treatment_plan_prompt,
        selectedTemplate
      );
      
      const result = await edgeFunctions.generate.treatmentPlan(supabase, {
        inputs: clinicalInputs,
        patientData,
        detailLevel,
        aiAdjustment,
        appendMode,
        existingPlan: appendMode ? generatedPlan : null,
        customPrompt,
        templateType: selectedTemplate?.template_type || 'treatment_plan',
      });

      const plan = result.treatment_plan || result;
      
      if (appendMode && generatedPlan) {
        const merged = { ...generatedPlan, ...plan };
        setGeneratedPlan(merged);
        setEditableContent(planToMarkdown(merged));
      } else {
        setGeneratedPlan(plan);
        setEditableContent(planToMarkdown(plan));
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
      const lineHeightValue = formatSettings.lineHeight === 'compact' ? 1.2 : 1.5;
      const sectionOrder = getSectionOrder(selectedTemplate);
      const guardrails = selectedTemplate?.pdf_config?.guardrails || [];
      const data = await edgeFunctions.generate.pdf(supabase, {
        patientData,
        treatmentPlan: generatedPlan,
        doctorSettings,
        formatOverrides: {
          font_size: formatSettings.fontSize,
          line_height: lineHeightValue,
          font_weight: formatSettings.fontWeight,
        },
        sectionOrder,
        guardrails,
      });

      if (data.missing_fields) {
        toast({ 
          title: 'Missing Fields', 
          description: `Please fill in: ${data.missing_fields.join(', ')}`, 
          variant: 'destructive' 
        });
        return;
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

  const handleViewPdf = async () => {
    if (!validatePatientData()) {
      toast({
        title: 'Missing Required Fields',
        description: 'Please fill in all required patient information before viewing',
        variant: 'destructive',
      });
      return;
    }

    try {
      const lineHeightValue = formatSettings.lineHeight === 'compact' ? 1.2 : 1.5;
      const sectionOrder = getSectionOrder(selectedTemplate);
      const guardrails = selectedTemplate?.pdf_config?.guardrails || [];
      const data = await edgeFunctions.generate.pdf(supabase, {
        patientData,
        treatmentPlan: generatedPlan,
        doctorSettings,
        formatOverrides: {
          font_size: formatSettings.fontSize,
          line_height: lineHeightValue,
          font_weight: formatSettings.fontWeight,
        },
        sectionOrder,
        guardrails,
      });

      const previewWindow = window.open('', '_blank');
      if (previewWindow) {
        previewWindow.document.write(data.html);
        previewWindow.document.close();
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: 'Clinical Document',
          text: editableContent || 'Clinical document generated.',
        });
      } else {
        await navigator.clipboard.writeText(editableContent || '');
        toast({ title: 'Copied', description: 'Document content copied to clipboard.' });
      }
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Unable to share document', variant: 'destructive' });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const patientFormErrors = Object.entries(validationErrors).filter(([_, v]) => v);

  return (
    <>
      <Head>
        <title>Doctor Dashboard | GoldStandard Clinical</title>
      </Head>
      <div className="min-h-screen bg-background pb-28">
        <DashboardHeader profile={profile} onSignOut={handleSignOut} />

        <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); if (v === 'history') loadDocuments(); }} className="print:hidden">
          <div className="sticky top-[73px] z-20 bg-background/90 backdrop-blur-xl border-b border-border px-4 py-2">
            <TabsList className="w-full grid grid-cols-3 max-w-md mx-auto">
              <TabsTrigger value="dashboard" data-testid="tab-dashboard">
                <LayoutDashboard className="h-4 w-4 mr-2" /> Dashboard
              </TabsTrigger>
              <TabsTrigger value="generate" data-testid="tab-generate">
                <Sparkles className="h-4 w-4 mr-2" /> Generate
              </TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">
                <History className="h-4 w-4 mr-2" /> History
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="dashboard" className="mt-0">
            <PracticeStats />
            <ClinicalCalendar 
              onGenerateForAppointment={(apt) => {
                setPatientData({
                  ...patientData,
                  patient_name: apt.patientName,
                  date_of_service: new Date().toISOString().split('T')[0],
                });
                setClinicalInputs({
                  ...clinicalInputs,
                  provider_notes: apt.attachedNote || `${apt.appointmentType} - ${apt.location}\n\n`,
                });
                setActiveTab('generate');
              }}
            />
          </TabsContent>

          <main className="container mx-auto py-6 px-4">

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
          <div className="max-w-md mx-auto lg:max-w-none lg:grid lg:grid-cols-2 gap-6">
            <div className="space-y-5">
              {!selectedTemplate && (
                <div className="glass-panel rounded-3xl p-6 shadow-lg">
                  <div className="text-center mb-6">
                    <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                      <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold">Select Note Type</h2>
                    <p className="text-sm text-muted-foreground mt-1">Choose the type of clinical note to create</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3">
                    {[
                      { type: 'initial_eval', name: 'Initial Evaluation', desc: 'Comprehensive psychiatric intake assessment' },
                      { type: 'progress_note', name: 'Progress Note', desc: 'SOAP format session documentation' },
                      { type: 'treatment_plan', name: 'Treatment Plan', desc: 'SMART goals and interventions' },
                      { type: 'psych_note', name: 'Psychiatric Note', desc: 'Mental status exam and assessment' },
                      { type: 'discharge_summary', name: 'Discharge Summary', desc: 'Treatment course and aftercare' },
                    ].map((noteType) => (
                      <button
                        key={noteType.type}
                        onClick={() => {
                          const template = templates.find(t => t.template_type === noteType.type) || {
                            id: noteType.type,
                            name: noteType.name,
                            template_type: noteType.type,
                            ai_prompt: '',
                            is_default: false,
                          };
                          setSelectedTemplate(template);
                        }}
                        className="flex items-center gap-4 p-4 rounded-2xl border border-border bg-card/50 hover:bg-primary/5 hover:border-primary/30 transition-all text-left group"
                        data-testid={`note-type-${noteType.type}`}
                      >
                        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-sm">{noteType.name}</h3>
                          <p className="text-xs text-muted-foreground">{noteType.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTemplate && generatedPlan && (
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold">{patientData.patient_name || 'Patient'}</h2>
                        {patientData.client_id && (
                          <span className="text-[10px] font-bold tracking-wider text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border">
                            ID: {patientData.client_id}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-primary" />
                        <p className="text-xs text-muted-foreground font-medium">{patientData.provider_name}</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowFormatPanel(true)}
                    className="flex items-center justify-center rounded-full w-10 h-10 text-primary bg-primary/10 border border-primary/20 transition-all shadow-[0_0_10px_rgba(19,236,200,0.2)] hover:bg-primary/20"
                    title="Format & Export Settings"
                    data-testid="button-format-panel"
                  >
                    <SlidersHorizontal className="h-5 w-5" />
                  </button>
                </div>
              )}
              
              {selectedTemplate && (
              <div className="glass-panel rounded-3xl p-5 shadow-lg relative overflow-hidden">
                <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl pointer-events-none" />
                <div className="flex justify-between items-center mb-5 border-b border-border/50 pb-3 relative z-10">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedTemplate(null)}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                        data-testid="button-back-to-notes"
                      >
                        ←
                      </button>
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        {selectedTemplate?.name || 'Patient Information'}
                      </h2>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 ml-6">Enter patient details for this {selectedTemplate?.template_type?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
                <div className="space-y-4 relative z-10">
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

                  {patientFormErrors.length > 0 && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Missing Required Fields</AlertTitle>
                      <AlertDescription>
                        Please fill in: {patientFormErrors.map(([key]) => key.replace('_', ' ')).join(', ')}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              </div>
              )}

              {selectedTemplate && (
              <div className="glass-panel rounded-3xl p-5 shadow-lg space-y-5">
                <FileUpload files={uploadedFiles} onFilesChange={setUploadedFiles} />
                
                <ClinicalContextTabs
                  intakeData={clinicalInputs.intake_form_data}
                  onIntakeChange={(v) => setClinicalInputs({ ...clinicalInputs, intake_form_data: v })}
                  sessionData={clinicalInputs.session_transcripts}
                  onSessionChange={(v) => setClinicalInputs({ ...clinicalInputs, session_transcripts: v })}
                  scoresData={clinicalInputs.assessment_scores}
                  onScoresChange={(v) => setClinicalInputs({ ...clinicalInputs, assessment_scores: v })}
                  providerNotes={clinicalInputs.provider_notes}
                  onProviderNotesChange={(v) => setClinicalInputs({ ...clinicalInputs, provider_notes: v })}
                />
              </div>
              )}

              {selectedTemplate && (
              <div className="space-y-4">
                
                <div className="glass-panel rounded-2xl p-4 flex justify-between items-center border border-border/50">
                  <div className="flex items-center gap-3">
                    <div className="relative w-5 h-5 flex items-center justify-center">
                      {isGenerating && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-30" />}
                      <span className={`relative inline-flex rounded-full h-2 w-2 ${isGenerating ? 'bg-primary' : 'bg-muted-foreground'}`} />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Processing Queue</p>
                      <p className="text-xs text-muted-foreground">
                        {isGenerating ? 'Generating document...' : 'Ready to generate'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="glass-panel rounded-2xl p-4 space-y-4 border border-border/50">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      AI Generation Settings
                    </Label>
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wider">
                      {detailLevel}
                    </Badge>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="detail_level">Detail Level</Label>
                      <Select
                        value={detailLevel}
                        onValueChange={(value) => setDetailLevel(value as 'brief' | 'standard' | 'detailed')}
                      >
                        <SelectTrigger id="detail_level">
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
                      <Label htmlFor="append_mode">Append Mode</Label>
                      <div className="flex items-center gap-3">
                        <Switch
                          id="append_mode"
                          checked={appendMode}
                          onCheckedChange={setAppendMode}
                        />
                        <span className="text-xs text-muted-foreground">
                          Enhance existing plan instead of overwriting
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai_adjustment">AI Adjustment Prompt</Label>
                    <Textarea
                      id="ai_adjustment"
                      value={aiAdjustment}
                      onChange={(e) => setAiAdjustment(e.target.value)}
                      placeholder="Add extra instructions to guide the AI output..."
                      className="min-h-[90px] bg-card/50 dark:bg-card/20 border-border rounded-xl"
                    />
                  </div>
                </div>
                
                <button
                  onClick={handleValidateAndGenerate}
                  disabled={isGenerating}
                  className="w-full relative group overflow-hidden rounded-xl p-[1px] shadow-[0_0_20px_rgba(19,236,200,0.3)] active:scale-[0.98] transition-all duration-200 disabled:opacity-50"
                  data-testid="button-generate"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#13ecc8] via-[#0ebcb0] to-[#13ecc8] bg-[length:200%_200%] animate-pulse opacity-80 group-hover:opacity-100 transition-opacity" />
                  <div className="relative bg-background/90 dark:bg-[#0f1923] rounded-xl px-6 py-4 flex items-center justify-center gap-2 group-hover:bg-background/70 transition-colors">
                    {isGenerating ? (
                      <>
                        <Loader2 className="h-5 w-5 text-primary animate-spin" />
                        <span className="font-semibold">Generating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-5 w-5 text-primary" />
                        <span className="font-semibold">Generate Treatment Plan</span>
                      </>
                    )}
                  </div>
                </button>
              </div>
              )}

              {showValidation && (
                <ValidationScreen
                  missingFields={missingFields}
                  onProceed={handleGenerate}
                  onSkip={handleGenerate}
                  onFieldComplete={handleValidationComplete}
                />
              )}
            </div>

            <div className="space-y-6">
              {generatedPlan ? (
                showPreview ? (
                  <DocumentPreview
                    content={editableContent}
                    patientName={patientData.patient_name}
                    dateOfService={patientData.date_of_service || new Date().toISOString()}
                    providerName={patientData.provider_name}
                    templateType={selectedTemplate?.template_type || 'treatment_plan'}
                    formatSettings={{
                      fontSize: formatSettings.fontSize,
                      lineHeight: formatSettings.lineHeight === 'compact' ? 1.2 : 1.5,
                      fontWeight: formatSettings.fontWeight,
                    }}
                    onPrint={() => handleDownloadPdf()}
                    onViewPdf={handleViewPdf}
                    onDownload={handleDownloadPdf}
                    onEdit={() => setShowPreview(false)}
                    onSave={handleSaveDocument}
                    isSaving={isSaving}
                  />
                ) : (
                  <NoteEditor
                    content={editableContent}
                    onContentChange={setEditableContent}
                    detailLevel={editorDetailLevel}
                    onDetailLevelChange={setEditorDetailLevel}
                    onRefine={handleRefine}
                    onRegenerate={handleRegenerate}
                    isGenerating={isGenerating}
                    templateType={selectedTemplate?.template_type || 'treatment_plan'}
                  />
                )
              ) : (
                <Card className="min-h-[600px]">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" /> {selectedTemplate ? TEMPLATE_TYPE_LABELS[selectedTemplate.template_type] || 'Document' : 'Document'}
                    </CardTitle>
                    <CardDescription>Generated clinical documentation</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                      <FileText className="h-12 w-12 mb-4 opacity-50" />
                      <p>No document generated yet</p>
                      <p className="text-sm">Enter clinical inputs and click Generate</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
            </TabsContent>
          </main>
          </Tabs>

        <FormatExportPanel
          isOpen={showFormatPanel}
          onClose={() => setShowFormatPanel(false)}
          onExportPdf={handleDownloadPdf}
          onPrint={() => window.print()}
          onShare={handleShare}
          textSize={formatSettings.fontSize}
          lineHeight={formatSettings.lineHeight}
          fontWeight={formatSettings.fontWeight}
          onTextSizeChange={(value) => setFormatSettings((prev) => ({ ...prev, fontSize: value }))}
          onLineHeightChange={(value) => setFormatSettings((prev) => ({ ...prev, lineHeight: value }))}
          onFontWeightChange={(value) => setFormatSettings((prev) => ({ ...prev, fontWeight: value }))}
        />

        <BottomNav />
      </div>
    </>
  );
}

export const getServerSideProps = async (ctx: any) => {
  return requireDoctor(ctx);
};
