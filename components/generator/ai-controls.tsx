import { Sparkles, Wand2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface DocumentTemplate {
  id: string;
  name: string;
  template_type: string;
  is_default: boolean;
}

interface AIControlsProps {
  templates: DocumentTemplate[];
  selectedTemplate: DocumentTemplate | null;
  onTemplateChange: (template: DocumentTemplate | null) => void;
  detailLevel: 'brief' | 'standard' | 'detailed';
  onDetailLevelChange: (level: 'brief' | 'standard' | 'detailed') => void;
  aiAdjustment: string;
  onAiAdjustmentChange: (value: string) => void;
  appendMode: boolean;
  onAppendModeChange: (value: boolean) => void;
  hasExistingPlan: boolean;
  isGenerating: boolean;
  onGenerate: () => void;
}

const TEMPLATE_TYPE_LABELS: Record<string, string> = {
  treatment_plan: 'Treatment Plan',
  darp_note: 'DARP Note',
  psych_note: 'Psychiatric Note',
  progress_note: 'Progress Note',
  discharge_summary: 'Discharge Summary',
  custom: 'Custom',
};

export function AIControls({
  templates,
  selectedTemplate,
  onTemplateChange,
  detailLevel,
  onDetailLevelChange,
  aiAdjustment,
  onAiAdjustmentChange,
  appendMode,
  onAppendModeChange,
  hasExistingPlan,
  isGenerating,
  onGenerate,
}: AIControlsProps) {
  return (
    <div className="glass-panel rounded-3xl p-5 shadow-lg space-y-5">
      <div className="flex items-center gap-2 border-b border-border pb-3">
        <div className="p-2 rounded-xl bg-primary/10 text-primary">
          <Sparkles className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">AI Controls</h3>
      </div>

      {templates.length > 0 && (
        <div className="space-y-2">
          <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Document Template
          </Label>
          <div className="flex flex-wrap gap-2">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => onTemplateChange(template)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  selectedTemplate?.id === template.id
                    ? 'bg-primary/10 border border-primary text-primary shadow-glow'
                    : 'bg-card dark:bg-card/50 border border-border text-muted-foreground hover:bg-muted hover:text-foreground'
                }`}
                data-testid={`template-chip-${template.id}`}
              >
                {template.name}
                {template.is_default && (
                  <span className="ml-1 text-xs opacity-70">★</span>
                )}
              </button>
            ))}
          </div>
          {selectedTemplate && (
            <p className="text-xs text-muted-foreground">
              Type: {TEMPLATE_TYPE_LABELS[selectedTemplate.template_type] || selectedTemplate.template_type}
            </p>
          )}
        </div>
      )}

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Detail Level
        </Label>
        <div className="bg-card dark:bg-card/50 border border-border p-1 rounded-xl flex">
          {(['brief', 'standard', 'detailed'] as const).map((level) => (
            <button
              key={level}
              onClick={() => onDetailLevelChange(level)}
              className={`flex-1 py-2 text-sm font-medium text-center transition-colors rounded-lg capitalize ${
                detailLevel === level
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid={`detail-${level}`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          AI Instructions
        </Label>
        <Textarea
          placeholder="Add specific instructions for AI refinement..."
          value={aiAdjustment}
          onChange={(e) => onAiAdjustmentChange(e.target.value)}
          className="bg-card/50 dark:bg-card/20 border-border rounded-xl min-h-[60px] resize-none text-sm"
          data-testid="textarea-ai-adjustment"
        />
      </div>

      <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-card/50 dark:bg-card/20 border border-border">
        <div>
          <Label htmlFor="append-mode" className="text-sm font-medium text-foreground">
            Append Mode
          </Label>
          <p className="text-xs text-muted-foreground">Enhance existing document</p>
        </div>
        <Switch
          id="append-mode"
          checked={appendMode}
          onCheckedChange={onAppendModeChange}
          disabled={!hasExistingPlan}
          data-testid="switch-append-mode"
        />
      </div>

      <Button
        onClick={onGenerate}
        disabled={isGenerating}
        className="w-full h-12 btn-gradient text-white font-semibold rounded-xl shadow-glow hover:shadow-lg transition-all"
        data-testid="button-generate"
      >
        {isGenerating ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-5 w-5" />
            Generate Document
          </>
        )}
      </Button>
    </div>
  );
}
