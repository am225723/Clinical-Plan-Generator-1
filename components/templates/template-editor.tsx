import { useState } from 'react';
import { Settings2, GripVertical, Plus, Trash2, Shield, Check, Copy, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

interface TemplateSection {
  id: string;
  name: string;
  required: boolean;
  order: number;
}

interface TemplateGuardrail {
  id: string;
  name: string;
  enabled: boolean;
  description: string;
}

interface Template {
  id: string;
  name: string;
  template_type: string;
  ai_prompt: string;
  is_default: boolean;
  sections?: TemplateSection[];
  guardrails?: TemplateGuardrail[];
}

interface TemplateEditorProps {
  template: Template;
  onSave: (template: Template) => void;
  onCancel: () => void;
  onDuplicate: (template: Template) => void;
  isSaving: boolean;
}

const TEMPLATE_TYPES = [
  { value: 'treatment_plan', label: 'Treatment Plan' },
  { value: 'darp_note', label: 'DARP Note' },
  { value: 'psych_note', label: 'Psychiatric Note' },
  { value: 'progress_note', label: 'Progress Note' },
  { value: 'discharge_summary', label: 'Discharge Summary' },
  { value: 'custom', label: 'Custom' },
];

const DEFAULT_GUARDRAILS: TemplateGuardrail[] = [
  { id: 'hipaa', name: 'HIPAA Compliance', enabled: true, description: 'Ensure PHI handling follows HIPAA guidelines' },
  { id: 'icd_codes', name: 'ICD-10 Validation', enabled: true, description: 'Validate diagnostic codes against ICD-10-CM' },
  { id: 'medical_necessity', name: 'Medical Necessity', enabled: true, description: 'Include medical necessity documentation' },
  { id: 'informed_consent', name: 'Informed Consent', enabled: false, description: 'Include consent documentation references' },
  { id: 'suicide_risk', name: 'Suicide Risk Assessment', enabled: true, description: 'Include safety planning when indicated' },
];

const DEFAULT_SECTIONS: TemplateSection[] = [
  { id: '1', name: 'Patient Demographics', required: true, order: 1 },
  { id: '2', name: 'Chief Complaint', required: true, order: 2 },
  { id: '3', name: 'History of Present Illness', required: true, order: 3 },
  { id: '4', name: 'Mental Status Exam', required: true, order: 4 },
  { id: '5', name: 'Assessment & Diagnosis', required: true, order: 5 },
  { id: '6', name: 'Treatment Plan', required: true, order: 6 },
];

export function TemplateEditor({
  template,
  onSave,
  onCancel,
  onDuplicate,
  isSaving,
}: TemplateEditorProps) {
  const [editedTemplate, setEditedTemplate] = useState<Template>({
    ...template,
    sections: template.sections || DEFAULT_SECTIONS,
    guardrails: template.guardrails || DEFAULT_GUARDRAILS,
  });
  const [draggedSection, setDraggedSection] = useState<string | null>(null);

  const updateField = (field: keyof Template, value: any) => {
    setEditedTemplate((prev) => ({ ...prev, [field]: value }));
  };

  const toggleGuardrail = (guardrailId: string) => {
    setEditedTemplate((prev) => ({
      ...prev,
      guardrails: prev.guardrails?.map((g) =>
        g.id === guardrailId ? { ...g, enabled: !g.enabled } : g
      ),
    }));
  };

  const addSection = () => {
    const newSection: TemplateSection = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Section',
      required: false,
      order: (editedTemplate.sections?.length || 0) + 1,
    };
    setEditedTemplate((prev) => ({
      ...prev,
      sections: [...(prev.sections || []), newSection],
    }));
  };

  const removeSection = (sectionId: string) => {
    const section = editedTemplate.sections?.find((s) => s.id === sectionId);
    if (section?.required) {
      return;
    }
    setEditedTemplate((prev) => ({
      ...prev,
      sections: prev.sections?.filter((s) => s.id !== sectionId).map((s, i) => ({
        ...s,
        order: i + 1,
      })),
    }));
  };

  const updateSection = (sectionId: string, field: keyof TemplateSection, value: any) => {
    setEditedTemplate((prev) => ({
      ...prev,
      sections: prev.sections?.map((s) =>
        s.id === sectionId ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleDragStart = (sectionId: string) => {
    setDraggedSection(sectionId);
  };

  const [dragOverId, setDragOverId] = useState<string | null>(null);

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetId) return;
    setDragOverId(targetId);
  };

  const handleDrop = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedSection || draggedSection === targetId) return;

    const sections = [...(editedTemplate.sections || [])];
    const draggedIndex = sections.findIndex((s) => s.id === draggedSection);
    const targetIndex = sections.findIndex((s) => s.id === targetId);

    if (draggedIndex !== -1 && targetIndex !== -1) {
      const [removed] = sections.splice(draggedIndex, 1);
      sections.splice(targetIndex, 0, removed);
      const reordered = sections.map((s, i) => ({ ...s, order: i + 1 }));
      setEditedTemplate((prev) => ({ ...prev, sections: reordered }));
    }
    setDraggedSection(null);
    setDragOverId(null);
  };

  const handleDragEnd = () => {
    setDraggedSection(null);
    setDragOverId(null);
  };

  const hasValidationErrors = () => {
    const hasEmptyNames = editedTemplate.sections?.some((s) => !s.name.trim());
    const hasEmptyTemplateName = !editedTemplate.name.trim();
    return hasEmptyNames || hasEmptyTemplateName;
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/30 dark:bg-card/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Settings2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Template Editor</h3>
            <p className="text-xs text-muted-foreground">Configure template settings and structure</p>
          </div>
        </div>
        {!template.id.startsWith('new') && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDuplicate(editedTemplate)}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            Duplicate
          </Button>
        )}
      </div>

      <div className="p-5 space-y-6 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Template Name
            </Label>
            <Input
              value={editedTemplate.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="bg-card/50 dark:bg-card/20 border-border rounded-xl"
              data-testid="input-template-name"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Document Type
            </Label>
            <Select
              value={editedTemplate.template_type}
              onValueChange={(v) => updateField('template_type', v)}
            >
              <SelectTrigger className="bg-card/50 dark:bg-card/20 border-border rounded-xl">
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
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            AI Prompt Instructions
          </Label>
          <Textarea
            value={editedTemplate.ai_prompt}
            onChange={(e) => updateField('ai_prompt', e.target.value)}
            placeholder="Enter custom AI instructions for generating this document type..."
            className="bg-card/50 dark:bg-card/20 border-border rounded-xl min-h-[100px] resize-none text-sm"
            data-testid="textarea-ai-prompt"
          />
        </div>

        <div className="flex items-center justify-between p-3 rounded-xl bg-card/50 dark:bg-card/20 border border-border">
          <div>
            <Label className="text-sm font-medium text-foreground">Set as Default</Label>
            <p className="text-xs text-muted-foreground">Use this template by default</p>
          </div>
          <Switch
            checked={editedTemplate.is_default}
            onCheckedChange={(v) => updateField('is_default', v)}
          />
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              Clinical Guardrails
            </Label>
          </div>
          <div className="space-y-2">
            {editedTemplate.guardrails?.map((guardrail) => (
              <div
                key={guardrail.id}
                className={`flex items-center justify-between p-3 rounded-xl border transition-colors ${
                  guardrail.enabled
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-muted/50 border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      guardrail.enabled ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                    }`}
                  >
                    {guardrail.enabled ? <Check className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{guardrail.name}</p>
                    <p className="text-xs text-muted-foreground">{guardrail.description}</p>
                  </div>
                </div>
                <Switch
                  checked={guardrail.enabled}
                  onCheckedChange={() => toggleGuardrail(guardrail.id)}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Document Sections
            </Label>
            <Button variant="outline" size="sm" onClick={addSection} className="gap-1">
              <Plus className="h-3 w-3" />
              Add Section
            </Button>
          </div>
          <div className="space-y-2">
            {editedTemplate.sections?.sort((a, b) => a.order - b.order).map((section) => (
              <div
                key={section.id}
                draggable
                onDragStart={() => handleDragStart(section.id)}
                onDragOver={(e) => handleDragOver(e, section.id)}
                onDrop={(e) => handleDrop(e, section.id)}
                onDragEnd={handleDragEnd}
                className={`flex items-center gap-3 p-3 rounded-xl bg-card/50 dark:bg-card/20 border transition-colors cursor-move ${
                  draggedSection === section.id ? 'opacity-50 border-border' : 
                  dragOverId === section.id ? 'border-primary bg-primary/5' : 'border-border'
                } ${!section.name.trim() ? 'border-destructive' : ''}`}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <Input
                  value={section.name}
                  onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                  className={`flex-1 bg-transparent border-none h-8 text-sm ${!section.name.trim() ? 'placeholder:text-destructive' : ''}`}
                  placeholder="Section name required"
                />
                <div className="flex items-center gap-2">
                  <Badge
                    variant={section.required ? 'default' : 'outline'}
                    className="cursor-pointer text-xs"
                    onClick={() => updateSection(section.id, 'required', !section.required)}
                  >
                    {section.required ? 'Required' : 'Optional'}
                  </Badge>
                  <button
                    onClick={() => removeSection(section.id)}
                    disabled={section.required}
                    className={`p-1.5 rounded-lg transition-colors ${
                      section.required 
                        ? 'text-muted-foreground/30 cursor-not-allowed' 
                        : 'hover:bg-destructive/10 text-muted-foreground hover:text-destructive'
                    }`}
                    title={section.required ? 'Cannot delete required sections' : 'Delete section'}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between p-4 border-t border-border bg-card/30 dark:bg-card/20">
        <Button variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          onClick={() => onSave(editedTemplate)}
          disabled={isSaving || hasValidationErrors()}
          className="btn-gradient text-white"
        >
          {isSaving ? 'Saving...' : 'Save Template'}
        </Button>
      </div>
    </div>
  );
}
