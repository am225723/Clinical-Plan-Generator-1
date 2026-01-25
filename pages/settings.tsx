import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from './_app';
import { requireAuth } from '@/lib/auth';
import { Profile, DoctorDocumentSettings } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Save, Loader2, Upload, FileText, Settings as SettingsIcon, Plus, Trash2, Edit, Copy } from 'lucide-react';
import { TemplateList } from '@/components/templates/template-list';
import { TemplateEditor } from '@/components/templates/template-editor';
import { useToast } from '@/hooks/use-toast';

interface DocumentTemplate {
  id: string;
  name: string;
  template_type: string;
  ai_prompt: string;
  pdf_config: any;
  is_default: boolean;
  created_at: string;
}

const TEMPLATE_TYPES = [
  { value: 'treatment_plan', label: 'Treatment Plan' },
  { value: 'darp_note', label: 'DARP Note' },
  { value: 'psych_note', label: 'Psychiatric Note' },
  { value: 'progress_note', label: 'Progress Note' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'custom', label: 'Custom' },
];

const DEFAULT_PROMPTS: Record<string, string> = {
  treatment_plan: `Role: Expert Clinical Psychiatrist.
Task: Generate a structured mental health treatment plan JSON from the provided clinical inputs.

REQUIREMENTS:
- Use professional clinical language
- Diagnoses must include ICD-10 and DSM-5-TR codes
- Treatment goals must be SMART (Specific, Measurable, Achievable, Relevant, Time-bound)
- Include comprehensive risk assessment
- Document medical decision-making complexity`,

  darp_note: `Role: Clinical Mental Health Provider.
Task: Generate a DARP (Data, Assessment, Response, Plan) progress note.

REQUIREMENTS:
- Data: Objective observations and subjective statements
- Assessment: Clinical interpretation of data
- Response: Patient response to interventions
- Plan: Next steps and follow-up
- Use professional clinical language`,

  psych_note: `Role: Psychiatrist.
Task: Generate a comprehensive psychiatric evaluation note.

REQUIREMENTS:
- Include full mental status examination
- Document psychiatric history and current medications
- Provide differential diagnosis with ICD-10 codes
- Include risk assessment
- Document treatment recommendations`,

  progress_note: `Role: Mental Health Clinician.
Task: Generate a clinical progress note documenting the therapy session.

REQUIREMENTS:
- Document presenting concerns
- Interventions used
- Patient response and engagement
- Treatment progress toward goals
- Plan for next session`,

  discharge_summary: `Role: Clinical Provider.
Task: Generate a discharge summary for mental health treatment.

REQUIREMENTS:
- Reason for treatment and presenting problems
- Course of treatment summary
- Diagnosis at discharge
- Current medication list
- Discharge recommendations and aftercare plan
- Follow-up appointments`,

  custom: `Role: Clinical Provider.
Task: Generate clinical documentation based on the provided inputs.

REQUIREMENTS:
- Use professional clinical language
- Include relevant diagnostic codes
- Document clinical findings
- Provide treatment recommendations`,
};

interface SettingsPageProps {
  user: any;
  profile: Profile;
}

const DEFAULT_PROMPT = `Role: Expert Clinical Psychiatrist.
Task: Generate a structured mental health treatment plan JSON from the provided clinical inputs.

REQUIREMENTS:
- Strictly follow the JSON structure provided.
- Use professional clinical language.
- Infer missing data where reasonable based on context, or label as "Not documented".
- Diagnoses must include ICD-10 and DSM-5-TR codes.
- Treatment goals must be SMART.`;

export default function SettingsPage({ user, profile }: SettingsPageProps) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_PROMPT);
  const [doctorSettings, setDoctorSettings] = useState<Partial<DoctorDocumentSettings>>({
    logo_url: '',
    header_config: { text: '', alignment: 'center' },
    footer_config: { text: '', alignment: 'center' },
    first_page_header_config: { text: '', alignment: 'center' },
    first_page_footer_config: { text: '', alignment: 'center' },
    patient_field_layout: { order: ['patient_name', 'client_id', 'date_of_birth', 'date_of_service', 'provider_name'] },
    pdf_style: { font_size: 12, font_family: 'Arial' },
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<DocumentTemplate | null>(null);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    template_type: 'treatment_plan',
    ai_prompt: DEFAULT_PROMPTS.treatment_plan,
    is_default: false,
  });

  useEffect(() => {
    loadSettings();
    loadTemplates();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/settings/get');
      const data = await response.json();
      
      if (response.ok && data.appSettings?.treatment_plan_prompt) {
        setAiPrompt(data.appSettings.treatment_plan_prompt);
      }

      if (data.doctorSettings) {
        setDoctorSettings(data.doctorSettings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }

    setLoading(false);
  };

  const loadTemplates = async () => {
    setTemplatesLoading(true);
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
    setTemplatesLoading(false);
  };

  const handleTemplateTypeChange = (type: string) => {
    setTemplateForm({
      ...templateForm,
      template_type: type,
      ai_prompt: DEFAULT_PROMPTS[type] || DEFAULT_PROMPTS.custom,
    });
  };

  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) {
      toast({ title: 'Error', description: 'Template name is required', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const method = editingTemplate ? 'PUT' : 'POST';
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : '/api/templates';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(templateForm),
      });

      if (!response.ok) throw new Error('Failed to save template');

      toast({ title: 'Saved', description: 'Template saved successfully' });
      setTemplateDialogOpen(false);
      setEditingTemplate(null);
      setTemplateForm({
        name: '',
        template_type: 'treatment_plan',
        ai_prompt: DEFAULT_PROMPTS.treatment_plan,
        is_default: false,
      });
      loadTemplates();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleEditTemplate = (template: { id: string; name: string; template_type: string; ai_prompt: string; is_default: boolean }) => {
    const fullTemplate = templates.find(t => t.id === template.id);
    if (fullTemplate) {
      setEditingTemplate(fullTemplate);
      setTemplateForm({
        name: fullTemplate.name,
        template_type: fullTemplate.template_type,
        ai_prompt: fullTemplate.ai_prompt,
        is_default: fullTemplate.is_default,
      });
      setShowTemplateEditor(true);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const response = await fetch(`/api/templates/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      toast({ title: 'Deleted', description: 'Template deleted' });
      loadTemplates();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete template', variant: 'destructive' });
    }
  };

  const handleDuplicateTemplate = (template: { name: string; template_type: string; ai_prompt: string; is_default: boolean }) => {
    setEditingTemplate(null);
    setTemplateForm({
      name: `${template.name} (Copy)`,
      template_type: template.template_type,
      ai_prompt: template.ai_prompt,
      is_default: false,
    });
    setTemplateDialogOpen(true);
  };

  const openNewTemplateDialog = () => {
    const newTemplate: DocumentTemplate = {
      id: '',
      name: '',
      template_type: 'treatment_plan',
      ai_prompt: DEFAULT_PROMPTS.treatment_plan,
      is_default: false,
      pdf_config: {
        sections: [
          { id: 'hpi', name: 'History of Present Illness', required: true, order: 0 },
          { id: 'mse', name: 'Mental Status Examination', required: true, order: 1 },
          { id: 'assessment', name: 'Assessment & Plan', required: true, order: 2 },
        ],
        guardrails: [
          { id: 'suicide_risk', name: 'Suicide Risk Detection', enabled: true, description: 'Flag ideation markers aggressively' },
          { id: 'hipaa', name: 'HIPAA Compliance', enabled: true, description: 'Ensure PHI is properly handled' },
          { id: 'icd10', name: 'ICD-10 Validation', enabled: true, description: 'Validate diagnostic codes' },
        ],
      },
      created_at: new Date().toISOString(),
    };
    setEditingTemplate(newTemplate);
    setShowTemplateEditor(true);
  };

  const handleSetDefault = async (templateId: string) => {
    try {
      const template = templates.find(t => t.id === templateId);
      if (!template) return;
      
      const response = await fetch(`/api/templates/${templateId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...template, is_default: true }),
      });

      if (!response.ok) throw new Error('Failed to set default');
      toast({ title: 'Success', description: 'Default template updated' });
      loadTemplates();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to set default template', variant: 'destructive' });
    }
  };

  const handleSaveFromEditor = async (template: any) => {
    setSaving(true);
    try {
      const isNew = !template.id || template.id === '';
      const method = isNew ? 'POST' : 'PUT';
      const url = isNew ? '/api/templates' : `/api/templates/${template.id}`;

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: template.name,
          template_type: template.template_type,
          ai_prompt: template.ai_prompt,
          is_default: template.is_default,
          pdf_config: {
            sections: template.sections,
            guardrails: template.guardrails,
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to save template');

      toast({ title: 'Saved', description: 'Template saved successfully' });
      setShowTemplateEditor(false);
      setEditingTemplate(null);
      loadTemplates();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save template', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleSaveAiPrompt = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/settings/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'app', settings: { treatment_plan_prompt: aiPrompt } })
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      toast({ title: 'Saved', description: 'AI prompt updated successfully' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save AI prompt', variant: 'destructive' });
    }
    
    setSaving(false);
  };

  const handleSaveDoctorSettings = async () => {
    setSaving(true);
    
    try {
      const response = await fetch('/api/settings/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'doctor', settings: doctorSettings })
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      toast({ title: 'Saved', description: 'Document settings updated' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    }
    
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const uploadResponse = await fetch(data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      setDoctorSettings({ ...doctorSettings, logo_url: data.publicUrl });
      toast({ title: 'Uploaded', description: 'Logo uploaded successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }

    setUploading(false);
  };

  const updatePdfStyle = (field: string, value: any) => {
    setDoctorSettings({
      ...doctorSettings,
      pdf_style: { font_size: 12, ...doctorSettings.pdf_style, [field]: value }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Settings | GoldStandard Clinical</title>
      </Head>
      <div className="min-h-screen bg-background">
        <header className="glass-panel border-b px-4 py-4 flex items-center justify-between sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.back()}
              className="p-2 rounded-xl hover:bg-muted transition-colors"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="font-semibold text-lg flex items-center gap-2">
                <SettingsIcon className="h-5 w-5 text-primary" />
                Settings
              </h1>
              <p className="text-xs text-muted-foreground capitalize">{profile.role} Account</p>
            </div>
          </div>
        </header>

        <main className="container mx-auto py-6 px-4 max-w-4xl pb-24">
          <Tabs defaultValue="templates">
            <div className="relative mb-6">
              <TabsList className="w-full h-auto p-1 bg-muted/50 rounded-2xl grid grid-cols-3 gap-1">
                <TabsTrigger 
                  value="templates" 
                  disabled={profile.role !== 'doctor' && profile.role !== 'admin'}
                  className="rounded-xl py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" /> 
                  <span className="hidden sm:inline">Templates</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="ai"
                  className="rounded-xl py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <SettingsIcon className="h-4 w-4 mr-1 sm:mr-2" /> 
                  <span className="hidden sm:inline">AI Config</span>
                </TabsTrigger>
                <TabsTrigger 
                  value="document" 
                  disabled={profile.role !== 'doctor' && profile.role !== 'admin'}
                  className="rounded-xl py-2.5 data-[state=active]:bg-background data-[state=active]:shadow-sm"
                >
                  <FileText className="h-4 w-4 mr-1 sm:mr-2" /> 
                  <span className="hidden sm:inline">Documents</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="templates" className="mt-6">
              {showTemplateEditor && editingTemplate ? (
                <TemplateEditor
                  template={{
                    ...editingTemplate,
                    sections: editingTemplate.pdf_config?.sections || [
                      { id: 'hpi', name: 'History of Present Illness', required: true, order: 0 },
                      { id: 'mse', name: 'Mental Status Examination', required: true, order: 1 },
                      { id: 'assessment', name: 'Assessment & Plan', required: true, order: 2 },
                    ],
                    guardrails: editingTemplate.pdf_config?.guardrails || [
                      { id: 'suicide_risk', name: 'Suicide Risk Detection', enabled: true, description: 'Flag ideation markers aggressively' },
                      { id: 'hipaa', name: 'HIPAA Compliance', enabled: true, description: 'Ensure PHI is properly handled' },
                      { id: 'icd10', name: 'ICD-10 Validation', enabled: true, description: 'Validate diagnostic codes' },
                    ],
                  }}
                  onSave={handleSaveFromEditor}
                  onCancel={() => {
                    setShowTemplateEditor(false);
                    setEditingTemplate(null);
                  }}
                  onDuplicate={handleDuplicateTemplate}
                  isSaving={saving}
                />
              ) : (
              <div className="glass-panel rounded-3xl p-5 shadow-lg space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Document Templates
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Create templates with custom AI prompts
                    </p>
                  </div>
                  <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
                    <DialogTrigger asChild>
                      <button 
                        onClick={openNewTemplateDialog} 
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                        data-testid="button-new-template"
                      >
                        <Plus className="h-4 w-4" /> New Template
                      </button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{editingTemplate ? 'Edit Template' : 'Create New Template'}</DialogTitle>
                        <DialogDescription>
                          Configure a document template with a custom AI prompt
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label>Template Name</Label>
                            <Input
                              value={templateForm.name}
                              onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                              placeholder="e.g., Initial Psychiatric Evaluation"
                              data-testid="input-template-name"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Document Type</Label>
                            <Select
                              value={templateForm.template_type}
                              onValueChange={handleTemplateTypeChange}
                            >
                              <SelectTrigger data-testid="select-template-type">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {TEMPLATE_TYPES.map((type) => (
                                  <SelectItem key={type.value} value={type.value}>
                                    {type.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <Label>AI Prompt</Label>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setTemplateForm({
                                ...templateForm,
                                ai_prompt: DEFAULT_PROMPTS[templateForm.template_type] || DEFAULT_PROMPTS.custom
                              })}
                            >
                              Reset to Default
                            </Button>
                          </div>
                          <Textarea
                            value={templateForm.ai_prompt}
                            onChange={(e) => setTemplateForm({ ...templateForm, ai_prompt: e.target.value })}
                            rows={12}
                            className="font-mono text-sm"
                            placeholder="Enter the AI prompt for this template type..."
                            data-testid="textarea-template-prompt"
                          />
                          <p className="text-xs text-muted-foreground">
                            This prompt will be used by the AI when generating documents of this type.
                            Each template type can have its own specialized prompt.
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="is_default"
                            checked={templateForm.is_default}
                            onChange={(e) => setTemplateForm({ ...templateForm, is_default: e.target.checked })}
                            className="h-4 w-4"
                            data-testid="checkbox-default-template"
                          />
                          <Label htmlFor="is_default" className="cursor-pointer">
                            Set as default for this document type
                          </Label>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setTemplateDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleSaveTemplate} disabled={saving} data-testid="button-save-template">
                          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                          Save Template
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </div>
                <div>
                  {templatesLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  ) : (
                    <TemplateList
                      templates={templates}
                      onEdit={handleEditTemplate}
                      onDuplicate={handleDuplicateTemplate}
                      onDelete={handleDeleteTemplate}
                      onSetDefault={handleSetDefault}
                      onCreate={openNewTemplateDialog}
                    />
                  )}
                </div>
              </div>
              )}
            </TabsContent>

            <TabsContent value="ai" className="mt-6">
              <div className="glass-panel rounded-3xl p-5 shadow-lg space-y-5">
                <div>
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                    AI Treatment Plan Prompt
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Customize the system prompt for generating treatment plans
                  </p>
                </div>
                <div className="space-y-4">
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={12}
                    className="font-mono text-sm bg-muted/50 border-border/50 rounded-xl"
                    data-testid="textarea-ai-prompt"
                  />
                  <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
                    <button 
                      onClick={() => setAiPrompt(DEFAULT_PROMPT)}
                      className="px-4 py-2.5 rounded-xl border border-border text-muted-foreground hover:bg-muted transition-colors"
                      data-testid="button-reset-prompt"
                    >
                      Reset to Default
                    </button>
                    <button 
                      onClick={handleSaveAiPrompt} 
                      disabled={saving}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                      data-testid="button-save-prompt"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Prompt
                    </button>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="document" className="mt-6 space-y-5">
              <div className="glass-panel rounded-3xl p-5 shadow-lg space-y-6">
                <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <Upload className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Practice Logo</h3>
                    <p className="text-xs text-muted-foreground">Upload for PDF documents</p>
                  </div>
                </div>
                {doctorSettings.logo_url && (
                  <div className="border border-border/50 rounded-2xl p-4 flex items-center justify-center bg-card/50">
                    <img src={doctorSettings.logo_url} alt="Logo" className="max-h-20" />
                  </div>
                )}
                <div className="flex items-center gap-4">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploading}
                    className="rounded-xl"
                    data-testid="input-logo-upload"
                  />
                  {uploading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-5 shadow-lg space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Header & Footer</h3>
                    <p className="text-xs text-muted-foreground">Configure document headers and footers</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">Header Text</Label>
                    <Input
                      value={(doctorSettings.header_config as any)?.text || ''}
                      onChange={(e) => setDoctorSettings({
                        ...doctorSettings,
                        header_config: { ...(doctorSettings.header_config as any), text: e.target.value }
                      })}
                      placeholder="Practice Name / Header"
                      className="rounded-xl"
                      data-testid="input-header-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">Footer Text</Label>
                    <Input
                      value={(doctorSettings.footer_config as any)?.text || ''}
                      onChange={(e) => setDoctorSettings({
                        ...doctorSettings,
                        footer_config: { ...(doctorSettings.footer_config as any), text: e.target.value }
                      })}
                      placeholder="Page numbers, copyright, etc."
                      className="rounded-xl"
                      data-testid="input-footer-text"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">First Page Header</Label>
                    <Input
                      value={(doctorSettings.first_page_header_config as any)?.text || ''}
                      onChange={(e) => setDoctorSettings({
                        ...doctorSettings,
                        first_page_header_config: { ...(doctorSettings.first_page_header_config as any), text: e.target.value }
                      })}
                      placeholder="Different header for first page"
                      className="rounded-xl"
                      data-testid="input-first-header-text"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">First Page Footer</Label>
                    <Input
                      value={(doctorSettings.first_page_footer_config as any)?.text || ''}
                      onChange={(e) => setDoctorSettings({
                        ...doctorSettings,
                        first_page_footer_config: { ...(doctorSettings.first_page_footer_config as any), text: e.target.value }
                      })}
                      placeholder="Different footer for first page"
                      className="rounded-xl"
                      data-testid="input-first-footer-text"
                    />
                  </div>
                </div>
              </div>

              <div className="glass-panel rounded-3xl p-5 shadow-lg space-y-5">
                <div className="flex items-center gap-3 pb-4 border-b border-border/50">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <SettingsIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">PDF Styling</h3>
                    <p className="text-xs text-muted-foreground">Font and styling for generated PDFs</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">Font Size</Label>
                    <Select
                      value={String((doctorSettings.pdf_style as any)?.font_size || 12)}
                      onValueChange={(v) => updatePdfStyle('font_size', parseInt(v))}
                    >
                      <SelectTrigger data-testid="select-font-size" className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10pt</SelectItem>
                        <SelectItem value="11">11pt</SelectItem>
                        <SelectItem value="12">12pt</SelectItem>
                        <SelectItem value="14">14pt</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase text-muted-foreground">Font Family</Label>
                    <Select
                      value={(doctorSettings.pdf_style as any)?.font_family || 'Arial'}
                      onValueChange={(v) => updatePdfStyle('font_family', v)}
                    >
                      <SelectTrigger data-testid="select-font-family" className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                        <SelectItem value="Georgia">Georgia</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end pt-2">
                  <button 
                    onClick={handleSaveDoctorSettings} 
                    disabled={saving}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors disabled:opacity-50"
                    data-testid="button-save-doc-settings"
                  >
                    {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save Settings
                  </button>
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
  return requireAuth(ctx);
};
