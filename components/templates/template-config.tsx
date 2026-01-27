import { useMemo, useState, useEffect } from 'react';
import { Sparkles, Shield, GripVertical, Plus, Play, Upload, ChevronLeft, Info, PenLine, FileSignature, Loader2, AlignLeft, AlignCenter, AlignRight, Type } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { useToast } from '@/hooks/use-toast';

interface TemplateSection {
  id: string;
  name: string;
  required: boolean;
  order: number;
}

interface DocumentTemplate {
  id: string;
  name: string;
  template_type: string;
  ai_prompt: string;
  pdf_config: {
    sections?: TemplateSection[];
    guardrails?: { id: string; name: string; enabled: boolean; description: string }[];
    headerTitle?: string;
    providerSignature?: string;
    includeClientSignature?: boolean;
  };
  is_default: boolean;
}

interface HeaderFooterConfig {
  text: string;
  alignment: 'left' | 'center' | 'right';
}

interface TemplateConfigProps {
  templates: DocumentTemplate[];
  onSave: (template: DocumentTemplate) => Promise<void>;
  onBack: () => void;
  logoUrl?: string;
  onLogoUpload?: (file: File) => void;
  headerConfig?: HeaderFooterConfig;
  footerConfig?: HeaderFooterConfig;
  onSaveHeaderFooter?: (configs: { header: HeaderFooterConfig; footer: HeaderFooterConfig }) => Promise<void>;
}

const DEFAULT_SECTIONS: Record<string, TemplateSection[]> = {
  treatment_plan: [
    { id: 'hpi', name: 'History of Present Illness (HPI)', required: true, order: 0 },
    { id: 'mse', name: 'Mental Status Exam (MSE)', required: true, order: 1 },
    { id: 'assessment', name: 'Assessment & Plan', required: true, order: 2 },
  ],
  initial_eval: [
    { id: 'chief_complaint', name: 'Chief Complaint', required: true, order: 0 },
    { id: 'hpi', name: 'History of Present Illness', required: true, order: 1 },
    { id: 'psychiatric_history', name: 'Psychiatric History', required: true, order: 2 },
    { id: 'mse', name: 'Mental Status Exam', required: true, order: 3 },
    { id: 'assessment', name: 'Assessment & Plan', required: true, order: 4 },
  ],
  soap_note: [
    { id: 'subjective', name: 'Subjective', required: true, order: 0 },
    { id: 'objective', name: 'Objective', required: true, order: 1 },
    { id: 'assessment', name: 'Assessment', required: true, order: 2 },
    { id: 'plan', name: 'Plan', required: true, order: 3 },
  ],
  darp_note: [
    { id: 'data', name: 'Data', required: true, order: 0 },
    { id: 'assessment', name: 'Assessment', required: true, order: 1 },
    { id: 'response', name: 'Response', required: true, order: 2 },
    { id: 'plan', name: 'Plan', required: true, order: 3 },
  ],
  progress_note: [
    { id: 'subjective', name: 'Subjective', required: true, order: 0 },
    { id: 'objective', name: 'Objective', required: true, order: 1 },
    { id: 'assessment', name: 'Assessment', required: true, order: 2 },
    { id: 'plan', name: 'Plan', required: true, order: 3 },
  ],
  psych_note: [
    { id: 'chief_complaint', name: 'Chief Complaint', required: true, order: 0 },
    { id: 'hpi', name: 'History of Present Illness', required: true, order: 1 },
    { id: 'mse', name: 'Mental Status Exam', required: true, order: 2 },
    { id: 'diagnosis', name: 'Diagnosis', required: true, order: 3 },
    { id: 'assessment_plan', name: 'Assessment & Plan', required: true, order: 4 },
  ],
  discharge_summary: [
    { id: 'admission', name: 'Admission Summary', required: true, order: 0 },
    { id: 'course', name: 'Hospital Course', required: true, order: 1 },
    { id: 'discharge', name: 'Discharge Diagnosis', required: true, order: 2 },
    { id: 'medications', name: 'Discharge Medications', required: true, order: 3 },
    { id: 'followup', name: 'Follow-up Plan', required: true, order: 4 },
  ],
};

const DEFAULT_PROMPTS: Record<string, string> = {
  initial_eval: `You are a Senior Clinical Psychiatrist performing an Initial Evaluation.
Your goal is to synthesize patient intake data into a structured clinical narrative.
Focus Areas:
1. Presenting Problem & History of Present Illness
2. Psychiatric and Medical History
3. Mental Status Examination
4. Risk Assessment
5. Diagnostic Formulation with ICD-10 codes
6. Treatment Recommendations`,
  soap_note: `You are a Clinical Mental Health Provider documenting a SOAP note.
Structure the note with:
- Subjective: Patient's reported symptoms and concerns
- Objective: Observable findings and mental status
- Assessment: Clinical interpretation and diagnosis
- Plan: Treatment interventions and follow-up`,
  progress_note: `You are a Clinical Mental Health Provider documenting a progress note.
Summarize:
- Subjective updates since last visit
- Objective observations and mental status
- Assessment of current status and diagnosis
- Plan for next steps and follow-up`,
  psych_note: `You are a Clinical Psychiatrist documenting a psychiatric note.
Include:
- Chief complaint and presenting concerns
- History of present illness
- Mental status examination
- Diagnostic assessment with ICD-10 codes
- Treatment plan and recommendations`,
  discharge_summary: `You are a Clinical Provider creating a Discharge Summary.
Include:
- Reason for admission and presenting problems
- Course of treatment during hospitalization
- Discharge diagnosis with ICD-10 codes
- Medications at discharge
- Aftercare plan and follow-up appointments`,
  treatment_plan: `You are an Expert Clinical Psychiatrist.
Generate a comprehensive treatment plan including:
- SMART treatment goals
- Evidence-based interventions
- Risk assessment and safety planning
- Medical decision-making documentation`,
};

const SAMPLE_OUTPUT = `**HISTORY OF PRESENT ILLNESS**
The patient is a 34-year-old Male who presents for an initial psychiatric evaluation with chief complaints of...

**MENTAL STATUS EXAM**
Appearance: Well-groomed. Behavior: Cooperative but guarded. Affect: Constricted.

**ASSESSMENT & PLAN**
1. Initiate Sertraline 50mg PO daily.
2. Refer for CBT weekly.
3. Follow up in 4 weeks.

_____________________________
Provider Signature

_____________________________
Client Signature          Date`;

const DEFAULT_TEMPLATES = [
  { id: 'initial_eval', name: 'Initial Evaluation', type: 'initial_eval' },
  { id: 'progress_note', name: 'Progress Note', type: 'progress_note' },
  { id: 'treatment_plan', name: 'Treatment Plan', type: 'treatment_plan' },
  { id: 'psych_note', name: 'Psychiatric Note', type: 'psych_note' },
  { id: 'discharge_summary', name: 'Discharge Summary', type: 'discharge_summary' },
];

export function TemplateConfig({
  templates,
  onSave,
  onBack,
  logoUrl,
  onLogoUpload,
  headerConfig,
  footerConfig,
  onSaveHeaderFooter,
}: TemplateConfigProps) {
  const { toast } = useToast();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('initial_eval');
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [templateHeader, setTemplateHeader] = useState('');
  const [guardrailsEnabled, setGuardrailsEnabled] = useState(true);
  const [suicideRiskEnabled, setSuicideRiskEnabled] = useState(true);
  const [providerSignature, setProviderSignature] = useState('Douglas Zelisko, M.D.\nBoard Certified Psychiatrist');
  const [includeClientSignature, setIncludeClientSignature] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingHeaderFooter, setSavingHeaderFooter] = useState(false);
  const [testing, setTesting] = useState(false);
  const [generatingSections, setGeneratingSections] = useState(false);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [headerText, setHeaderText] = useState('');
  const [headerAlignment, setHeaderAlignment] = useState<HeaderFooterConfig['alignment']>('center');
  const [footerText, setFooterText] = useState('');
  const [footerAlignment, setFooterAlignment] = useState<HeaderFooterConfig['alignment']>('center');

  const displayedTemplates: DocumentTemplate[] = useMemo(() => {
    const templateMap = new Map(templates.map((template) => [template.template_type, template]));
    const baseTemplates = DEFAULT_TEMPLATES.map((t) => {
      const storedTemplate = templateMap.get(t.type);
      if (storedTemplate) return storedTemplate;
      return {
        id: t.id,
        name: t.name,
        template_type: t.type,
        ai_prompt: DEFAULT_PROMPTS[t.type] || '',
        pdf_config: { 
          sections: DEFAULT_SECTIONS[t.type] || [],
          headerTitle: t.name,
          providerSignature: '',
          includeClientSignature: true,
          guardrails: [
            { id: 'hipaa', name: 'Clinical Guardrails', enabled: true, description: 'HIPAA compliance' },
            { id: 'suicide_risk', name: 'Suicide Risk Detection', enabled: true, description: 'Flag risk markers' },
          ],
        },
        is_default: t.id === 'initial_eval',
      } as DocumentTemplate;
    });
    const customTemplates = templates.filter(
      (template) => !DEFAULT_TEMPLATES.some((defaultTemplate) => defaultTemplate.type === template.template_type),
    );
    return [...baseTemplates, ...customTemplates];
  }, [templates]);

  useEffect(() => {
    const template = displayedTemplates.find((t) => t.id === selectedTemplateId);
    if (template) {
      setAiPrompt(template.ai_prompt || DEFAULT_PROMPTS[template.template_type] || '');
      setSections(template.pdf_config?.sections || DEFAULT_SECTIONS[template.template_type] || []);
      setTemplateHeader(template.pdf_config?.headerTitle || template.name);
      setProviderSignature(template.pdf_config?.providerSignature || '');
      setIncludeClientSignature(template.pdf_config?.includeClientSignature ?? true);
      const guardrails = template.pdf_config?.guardrails || [];
      const hipaaGuardrail = guardrails.find((g: { id: string; enabled: boolean }) => g.id === 'hipaa');
      const riskGuardrail = guardrails.find((g: { id: string; enabled: boolean }) => g.id === 'suicide_risk');
      setGuardrailsEnabled(hipaaGuardrail?.enabled ?? true);
      setSuicideRiskEnabled(riskGuardrail?.enabled ?? true);
    }
  }, [displayedTemplates, selectedTemplateId]);

  useEffect(() => {
    if (displayedTemplates.length === 0) return;
    if (!displayedTemplates.some((template) => template.id === selectedTemplateId)) {
      setSelectedTemplateId(displayedTemplates[0].id);
    }
  }, [displayedTemplates, selectedTemplateId]);

  useEffect(() => {
    setHeaderText(headerConfig?.text || '');
    setHeaderAlignment(headerConfig?.alignment || 'center');
    setFooterText(footerConfig?.text || '');
    setFooterAlignment(footerConfig?.alignment || 'center');
  }, [footerConfig, headerConfig]);

  const handleGenerateSectionsFromAI = async () => {
    setGeneratingSections(true);
    await new Promise((r) => setTimeout(r, 1500));
    
    const promptLower = aiPrompt.toLowerCase();
    const generatedSections: TemplateSection[] = [];
    let order = 0;

    if (promptLower.includes('chief complaint')) {
      generatedSections.push({ id: 'chief_complaint', name: 'Chief Complaint', required: true, order: order++ });
    }
    if (promptLower.includes('history of present illness') || promptLower.includes('hpi')) {
      generatedSections.push({ id: 'hpi', name: 'History of Present Illness', required: true, order: order++ });
    }
    if (promptLower.includes('psychiatric history')) {
      generatedSections.push({ id: 'psychiatric_history', name: 'Psychiatric History', required: true, order: order++ });
    }
    if (promptLower.includes('mental status') || promptLower.includes('mse')) {
      generatedSections.push({ id: 'mse', name: 'Mental Status Examination', required: true, order: order++ });
    }
    if (promptLower.includes('risk assessment') || promptLower.includes('safety')) {
      generatedSections.push({ id: 'risk_assessment', name: 'Risk Assessment', required: true, order: order++ });
    }
    if (promptLower.includes('diagnosis') || promptLower.includes('icd-10')) {
      generatedSections.push({ id: 'diagnosis', name: 'Diagnosis & ICD-10 Codes', required: true, order: order++ });
    }
    if (promptLower.includes('assessment') || promptLower.includes('plan') || promptLower.includes('treatment')) {
      generatedSections.push({ id: 'assessment_plan', name: 'Assessment & Plan', required: true, order: order++ });
    }
    if (promptLower.includes('subjective')) {
      generatedSections.push({ id: 'subjective', name: 'Subjective', required: true, order: order++ });
    }
    if (promptLower.includes('objective')) {
      generatedSections.push({ id: 'objective', name: 'Objective', required: true, order: order++ });
    }

    if (generatedSections.length === 0) {
      generatedSections.push({ id: 'content', name: 'Clinical Content', required: true, order: 0 });
    }

    setSections(generatedSections);
    setGeneratingSections(false);
    toast({ title: 'Sections Generated', description: `Created ${generatedSections.length} sections from AI logic` });
  };

  const handleDragStart = (sectionId: string) => setDraggedSection(sectionId);
  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetId) return;
    setDragOverId(targetId);
  };
  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetId) return;
    const newSections = [...sections];
    const draggedIndex = newSections.findIndex((s) => s.id === draggedSection);
    const targetIndex = newSections.findIndex((s) => s.id === targetId);
    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = newSections.splice(draggedIndex, 1);
      newSections.splice(targetIndex, 0, removed);
      setSections(newSections.map((s, i) => ({ ...s, order: i })));
    }
    setDraggedSection(null);
    setDragOverId(null);
  };
  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverId(null);
  };

  const addSection = () => {
    setSections([...sections, {
      id: `section_${Date.now()}`,
      name: 'New Section',
      required: false,
      order: sections.length,
    }]);
  };

  const updateSectionName = (id: string, name: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleSave = async () => {
    const template = displayedTemplates.find((t) => t.id === selectedTemplateId);
    if (!template) return;
    setSaving(true);
    try {
      const updatedTemplate: DocumentTemplate = {
        ...template,
        ai_prompt: aiPrompt,
        pdf_config: {
          ...template.pdf_config,
          sections,
          headerTitle: templateHeader,
          providerSignature,
          includeClientSignature,
          guardrails: [
            { id: 'hipaa', name: 'Clinical Guardrails', enabled: guardrailsEnabled, description: 'HIPAA compliance' },
            { id: 'suicide_risk', name: 'Suicide Risk Detection', enabled: suicideRiskEnabled, description: 'Flag risk markers' },
          ],
        },
      };
      await onSave(updatedTemplate);
      toast({ title: 'Saved', description: 'Template configuration saved' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save configuration', variant: 'destructive' });
    }
    setSaving(false);
  };

  const handleTestLogic = () => {
    setTesting(true);
    setTimeout(() => setTesting(false), 1500);
  };

  const handleSaveHeaderFooter = async () => {
    if (!onSaveHeaderFooter) return;
    setSavingHeaderFooter(true);
    try {
      await onSaveHeaderFooter({
        header: { text: headerText, alignment: headerAlignment },
        footer: { text: footerText, alignment: footerAlignment },
      });
      toast({ title: 'Saved', description: 'Header and footer saved' });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save header and footer', variant: 'destructive' });
    }
    setSavingHeaderFooter(false);
  };

  const alignmentClass = (alignment: HeaderFooterConfig['alignment']) => {
    switch (alignment) {
      case 'left':
        return 'text-left';
      case 'right':
        return 'text-right';
      default:
        return 'text-center';
    }
  };

  const selectedTemplate = displayedTemplates.find((t) => t.id === selectedTemplateId);

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-50 glass-panel border-b border-border/50 px-4 py-3 flex items-center gap-3">
        <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div>
          <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Settings</p>
          <h1 className="text-lg font-bold">Template Config</h1>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div>
          <p className="text-xs text-muted-foreground mb-3">Template Selection</p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {displayedTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => setSelectedTemplateId(template.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedTemplateId === template.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
                }`}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">AI Logic for {selectedTemplate?.name}</h2>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Template Header
              </p>
              <Input
                value={templateHeader}
                onChange={(e) => setTemplateHeader(e.target.value)}
                placeholder="e.g., Initial Psychiatric Evaluation"
                className="bg-card/50 dark:bg-card/30 border-border rounded-xl"
              />
            </div>

            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                System Prompt
              </p>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Enter AI system prompt..."
                className="min-h-[140px] bg-card/50 dark:bg-card/30 border-border rounded-xl text-sm resize-none"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">v3.0 (GPT-4o)</p>
            </div>

            <div className="space-y-3 pt-2 border-t border-border">
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <span className="text-sm font-medium">Clinical Guardrails</span>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                      <Info className="h-3 w-3" />
                      HIPAA compliance, PHI protection, documentation standards
                    </p>
                  </div>
                </div>
                <Switch checked={guardrailsEnabled} onCheckedChange={setGuardrailsEnabled} />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="h-4 w-4 text-rose-500" />
                    <span className="text-sm font-medium">Suicide Risk Detection</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground ml-6 flex items-center gap-1">
                    <Info className="h-3 w-3" />
                    Flags suicidal ideation, self-harm mentions, crisis indicators
                  </p>
                </div>
                <Switch checked={suicideRiskEnabled} onCheckedChange={setSuicideRiskEnabled} />
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Note Structure</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleGenerateSectionsFromAI}
              disabled={generatingSections}
              className="gap-1.5 text-xs"
            >
              {generatingSections ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Auto-Generate
            </Button>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Drag sections to reorder. Click "Auto-Generate" to create sections from your AI prompt.
            </p>

            <div className="space-y-2">
              {sections.sort((a, b) => a.order - b.order).map((section) => (
                <div
                  key={section.id}
                  draggable
                  onDragStart={() => handleDragStart(section.id)}
                  onDragOver={(e) => handleDragOver(e, section.id)}
                  onDrop={(e) => handleDrop(e, section.id)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-3 p-3 rounded-xl bg-card/50 dark:bg-card/30 border cursor-move transition-all ${
                    draggedSection === section.id ? 'opacity-50' :
                    dragOverId === section.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <Input
                    value={section.name}
                    onChange={(e) => updateSectionName(section.id, e.target.value)}
                    className="flex-1 bg-transparent border-none h-8 text-sm p-0 focus-visible:ring-0"
                  />
                </div>
              ))}
            </div>

            <button
              onClick={addSection}
              className="flex items-center gap-2 w-full justify-center py-2.5 rounded-xl border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Section
            </button>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Note Preview</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestLogic}
              disabled={testing}
              className="gap-1.5 rounded-xl border-primary/50 text-primary hover:bg-primary/10"
            >
              <Play className="h-3.5 w-3.5" />
              {testing ? 'Testing...' : 'Test Logic'}
            </Button>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] text-rose-500 font-medium">LIVE SAMPLE</span>
            </div>
            <div className="bg-card/50 dark:bg-card/30 rounded-xl p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-muted-foreground max-h-[200px] overflow-y-auto">
              {SAMPLE_OUTPUT}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Type className="h-4 w-4 text-primary" />
              <h2 className="text-sm font-semibold">Document Header & Footer</h2>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSaveHeaderFooter}
              disabled={savingHeaderFooter || !onSaveHeaderFooter}
              className="gap-1.5 rounded-xl border-primary/50 text-primary hover:bg-primary/10"
            >
              {savingHeaderFooter ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
              Save Layout
            </Button>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-4">
            <div className="grid gap-4">
              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Header Text</p>
                <Textarea
                  value={headerText}
                  onChange={(e) => setHeaderText(e.target.value)}
                  placeholder="Add practice name, address, or credentials"
                  className="min-h-[70px] bg-card/50 dark:bg-card/30 border-border rounded-xl text-sm resize-none"
                />
                <ToggleGroup
                  type="single"
                  value={headerAlignment}
                  onValueChange={(value) => value && setHeaderAlignment(value as HeaderFooterConfig['alignment'])}
                  className="justify-start"
                >
                  <ToggleGroupItem value="left" aria-label="Align left">
                    <AlignLeft className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="center" aria-label="Align center">
                    <AlignCenter className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Align right">
                    <AlignRight className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>

              <div className="space-y-2">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Footer Text</p>
                <Textarea
                  value={footerText}
                  onChange={(e) => setFooterText(e.target.value)}
                  placeholder="Add disclaimers, contact info, or page footer text"
                  className="min-h-[70px] bg-card/50 dark:bg-card/30 border-border rounded-xl text-sm resize-none"
                />
                <ToggleGroup
                  type="single"
                  value={footerAlignment}
                  onValueChange={(value) => value && setFooterAlignment(value as HeaderFooterConfig['alignment'])}
                  className="justify-start"
                >
                  <ToggleGroupItem value="left" aria-label="Align left">
                    <AlignLeft className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="center" aria-label="Align center">
                    <AlignCenter className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="right" aria-label="Align right">
                    <AlignRight className="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>

            <div className="rounded-2xl border border-dashed border-border bg-card/40 dark:bg-card/20 p-4 text-xs text-muted-foreground space-y-4">
              <div className={`font-semibold text-foreground ${alignmentClass(headerAlignment)}`}>
                {headerText || 'Header preview text'}
              </div>
              <div className="border-t border-border/70 pt-4">
                <div className={`text-muted-foreground ${alignmentClass(footerAlignment)}`}>
                  {footerText || 'Footer preview text'}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <FileSignature className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Signatures</h2>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Provider Signature
              </p>
              <div className="bg-card/50 dark:bg-card/30 rounded-xl p-4 border border-border">
                <img 
                  src="/provider-signature.png" 
                  alt="Provider Signature" 
                  className="h-12 object-contain mx-auto invert dark:invert-0"
                />
                <div className="border-t border-border mt-3 pt-2 text-center">
                  <Textarea
                    value={providerSignature}
                    onChange={(e) => setProviderSignature(e.target.value)}
                    placeholder="Douglas Zelisko, M.D.
Board Certified Psychiatrist"
                    className="bg-transparent border-none text-center text-sm focus-visible:ring-0 resize-none min-h-[50px]"
                    rows={2}
                  />
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1 text-center">
                Your signature will appear on all generated documents
              </p>
            </div>

            <div className="flex items-center justify-between py-2 border-t border-border">
              <div className="flex items-center gap-2">
                <PenLine className="h-4 w-4 text-muted-foreground" />
                <div>
                  <span className="text-sm font-medium">Include Client Signature</span>
                  <p className="text-[10px] text-muted-foreground">Add signature line for patient/client</p>
                </div>
              </div>
              <Switch checked={includeClientSignature} onCheckedChange={setIncludeClientSignature} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">PDF Branding</h2>
          </div>

          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">Logo</p>
                <label className="text-sm text-primary hover:underline cursor-pointer">
                  Upload Logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && onLogoUpload) onLogoUpload(file);
                    }}
                  />
                </label>
              </div>
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-20 left-0 right-0 p-4 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 btn-gradient text-white font-semibold rounded-xl shadow-glow"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
}
