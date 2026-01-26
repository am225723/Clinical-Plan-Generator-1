import { useState, useEffect } from 'react';
import { Sparkles, Shield, GripVertical, Plus, Play, Upload, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
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
  };
  is_default: boolean;
}

interface TemplateConfigProps {
  templates: DocumentTemplate[];
  onSave: (template: DocumentTemplate) => Promise<void>;
  onBack: () => void;
  logoUrl?: string;
  headerTitle?: string;
  onLogoUpload?: (file: File) => void;
  onHeaderTitleChange?: (title: string) => void;
}

const DEFAULT_SECTIONS: Record<string, TemplateSection[]> = {
  treatment_plan: [
    { id: 'hpi', name: 'History of Present Illness (HPI)', required: true, order: 0 },
    { id: 'mse', name: 'Mental Status Exam (MSE)', required: true, order: 1 },
    { id: 'assessment', name: 'Assessment & Plan', required: true, order: 2 },
  ],
  darp_note: [
    { id: 'data', name: 'Data', required: true, order: 0 },
    { id: 'assessment', name: 'Assessment', required: true, order: 1 },
    { id: 'response', name: 'Response', required: true, order: 2 },
    { id: 'plan', name: 'Plan', required: true, order: 3 },
  ],
  psych_note: [
    { id: 'chief_complaint', name: 'Chief Complaint', required: true, order: 0 },
    { id: 'hpi', name: 'History of Present Illness', required: true, order: 1 },
    { id: 'mse', name: 'Mental Status Exam', required: true, order: 2 },
    { id: 'assessment', name: 'Assessment & Plan', required: true, order: 3 },
  ],
  progress_note: [
    { id: 'subjective', name: 'Subjective', required: true, order: 0 },
    { id: 'objective', name: 'Objective', required: true, order: 1 },
    { id: 'assessment', name: 'Assessment', required: true, order: 2 },
    { id: 'plan', name: 'Plan', required: true, order: 3 },
  ],
  discharge_summary: [
    { id: 'admission', name: 'Admission Summary', required: true, order: 0 },
    { id: 'course', name: 'Hospital Course', required: true, order: 1 },
    { id: 'discharge', name: 'Discharge Plan', required: true, order: 2 },
  ],
};

const SAMPLE_OUTPUT = `**HISTORY OF PRESENT ILLNESS**
The patient is a 34-year-old Male who presents for an initial psychiatric evaluation with chief complaints of...

**MENTAL STATUS EXAM**
Appearance: Well-groomed. Behavior: Cooperative but guarded. Affect: Constricted.

**ASSESSMENT & PLAN**
1. Initiate Sertraline 50mg PO daily.
2. Refer for CBT weekly.
3. Follow up in 4 weeks.`;

export function TemplateConfig({
  templates,
  onSave,
  onBack,
  logoUrl,
  headerTitle = '',
  onLogoUpload,
  onHeaderTitleChange,
}: TemplateConfigProps) {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [sections, setSections] = useState<TemplateSection[]>([]);
  const [aiPrompt, setAiPrompt] = useState('');
  const [guardrailsEnabled, setGuardrailsEnabled] = useState(true);
  const [suicideRiskEnabled, setSuicideRiskEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [localHeaderTitle, setLocalHeaderTitle] = useState(headerTitle);
  const [draggedSection, setDraggedSection] = useState<string | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  useEffect(() => {
    if (templates.length > 0 && !selectedTemplate) {
      selectTemplate(templates[0]);
    }
  }, [templates]);

  const selectTemplate = (template: DocumentTemplate) => {
    setSelectedTemplate(template);
    setAiPrompt(template.ai_prompt);
    setSections(
      template.pdf_config?.sections ||
        DEFAULT_SECTIONS[template.template_type] ||
        DEFAULT_SECTIONS.treatment_plan
    );
    const guardrails = template.pdf_config?.guardrails || [];
    setGuardrailsEnabled(guardrails.some((g) => g.id === 'hipaa' && g.enabled) ?? true);
    setSuicideRiskEnabled(guardrails.some((g) => g.id === 'suicide_risk' && g.enabled) ?? true);
  };

  const handleDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

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
      const reordered = newSections.map((s, i) => ({ ...s, order: i }));
      setSections(reordered);
    }
    setDraggedSection(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverId(null);
  };

  const addSection = () => {
    const newSection: TemplateSection = {
      id: `section_${Date.now()}`,
      name: 'New Section',
      required: false,
      order: sections.length,
    };
    setSections([...sections, newSection]);
  };

  const updateSectionName = (id: string, name: string) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const handleSave = async () => {
    if (!selectedTemplate) return;
    setSaving(true);
    try {
      const updatedTemplate: DocumentTemplate = {
        ...selectedTemplate,
        ai_prompt: aiPrompt,
        pdf_config: {
          ...selectedTemplate.pdf_config,
          sections,
          guardrails: [
            { id: 'hipaa', name: 'Clinical Guardrails', enabled: guardrailsEnabled, description: 'HIPAA compliance checks' },
            { id: 'suicide_risk', name: 'Suicide Risk Detection', enabled: suicideRiskEnabled, description: 'Flag ideation markers aggressively' },
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

  const templatePills = [
    { id: 'initial_eval', name: 'Initial Eval', type: 'treatment_plan' },
    { id: 'soap_note', name: 'SOAP Note', type: 'progress_note' },
    { id: 'discharge_sum', name: 'Discharge Sum', type: 'discharge_summary' },
  ];

  const displayedTemplates = templates.length > 0 ? templates : templatePills.map((p, i) => ({
    id: p.id,
    name: p.name,
    template_type: p.type,
    ai_prompt: '',
    pdf_config: { sections: DEFAULT_SECTIONS[p.type] },
    is_default: i === 0,
  }));

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-50 glass-panel border-b border-border/50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors">
            <ChevronLeft className="h-5 w-5" />
          </button>
          <div>
            <p className="text-[10px] font-semibold text-primary uppercase tracking-wider">Settings</p>
            <h1 className="text-lg font-bold">Template Config</h1>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        <div>
          <p className="text-xs text-muted-foreground mb-3">Template Selection</p>
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {displayedTemplates.map((template) => (
              <button
                key={template.id}
                onClick={() => selectTemplate(template as DocumentTemplate)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted border border-border'
                }`}
                data-testid={`template-pill-${template.id}`}
              >
                {template.name}
              </button>
            ))}
          </div>
        </div>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">AI Logic for {selectedTemplate?.name || 'Template'}</h2>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-4">
            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                System Prompt
              </p>
              <Textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="Enter AI system prompt..."
                className="min-h-[140px] bg-card/50 dark:bg-card/30 border-border rounded-xl text-sm resize-none"
                data-testid="textarea-ai-prompt"
              />
              <p className="text-[10px] text-muted-foreground mt-1 text-right">v3.0 (GPT-4o)</p>
            </div>

            <div className="flex items-center justify-between py-3 border-t border-border">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Clinical Guardrails</span>
              </div>
              <Switch checked={guardrailsEnabled} onCheckedChange={setGuardrailsEnabled} />
            </div>

            <div className="flex items-center justify-between py-3 border-t border-border">
              <div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Suicide Risk Detection</span>
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5 ml-6">
                  Aggressively flag ideation markers
                </p>
              </div>
              <Switch checked={suicideRiskEnabled} onCheckedChange={setSuicideRiskEnabled} />
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Note Structure</h2>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-3">
            <p className="text-xs text-muted-foreground">
              Drag sections to reorder how the final clinical note is generated. This defines the output flow.
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
                    draggedSection === section.id ? 'opacity-50 border-border' :
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

          <div className="glass-panel rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-rose-500 font-medium">LIVE SAMPLE</span>
            </div>
            <div className="bg-card/50 dark:bg-card/30 rounded-xl p-4 text-xs font-mono leading-relaxed whitespace-pre-wrap text-muted-foreground max-h-[200px] overflow-y-auto">
              {SAMPLE_OUTPUT}
            </div>
          </div>
        </section>

        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Upload className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">PDF Branding</h2>
          </div>

          <div className="glass-panel rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-muted/50 border border-border flex items-center justify-center overflow-hidden">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <Upload className="h-6 w-6 text-muted-foreground" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1">
                  Logo
                </p>
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

            <div>
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Header Title
              </p>
              <Input
                value={localHeaderTitle}
                onChange={(e) => {
                  setLocalHeaderTitle(e.target.value);
                  onHeaderTitleChange?.(e.target.value);
                }}
                placeholder="Dr. Douglas Zelisko, M.D."
                className="bg-card/50 dark:bg-card/30 border-border rounded-xl"
              />
            </div>
          </div>
        </section>
      </main>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-20 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-lg mx-auto">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full h-12 btn-gradient text-white font-semibold rounded-xl shadow-glow"
            data-testid="button-save-config"
          >
            {saving ? 'Saving...' : 'Save Configuration'}
          </Button>
        </div>
      </div>
    </div>
  );
}
