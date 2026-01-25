import { useState } from 'react';
import { Sparkles, RefreshCcw, Volume2, Copy, Check, Download, Maximize2, Minimize2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface NoteEditorProps {
  content: string;
  onContentChange: (content: string) => void;
  isGenerating: boolean;
  onRefine: (instruction: string, detailLevel: number) => void;
  onRegenerate: (detailLevel: number) => void;
  detailLevel?: number;
  onDetailLevelChange?: (level: number) => void;
  templateType?: string;
}

const DETAIL_PRESETS = [
  { label: 'Brief', value: 25, description: 'Essential points only' },
  { label: 'Standard', value: 50, description: 'Balanced detail level' },
  { label: 'Detailed', value: 75, description: 'Comprehensive documentation' },
  { label: 'Expert', value: 100, description: 'Maximum clinical detail' },
];

export function NoteEditor({
  content,
  onContentChange,
  isGenerating,
  onRefine,
  onRegenerate,
  detailLevel: propDetailLevel = 50,
  onDetailLevelChange,
}: NoteEditorProps) {
  const [localDetailLevel, setLocalDetailLevel] = useState(propDetailLevel);
  const detailLevel = propDetailLevel;
  
  const handleDetailLevelChange = (value: number) => {
    setLocalDetailLevel(value);
    onDetailLevelChange?.(value);
  };
  const [refinementInstruction, setRefinementInstruction] = useState('');
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefine = () => {
    if (refinementInstruction.trim()) {
      onRefine(refinementInstruction, detailLevel);
      setRefinementInstruction('');
    }
  };

  const currentPreset = DETAIL_PRESETS.reduce((prev, curr) => 
    Math.abs(curr.value - detailLevel) < Math.abs(prev.value - detailLevel) ? curr : prev
  );

  const quickRefinements = [
    { label: 'Add more detail', instruction: 'Expand on the clinical details and add more specific observations.' },
    { label: 'Simplify language', instruction: 'Use simpler, more accessible language while maintaining clinical accuracy.' },
    { label: 'Add ICD codes', instruction: 'Include relevant ICD-10 diagnostic codes throughout the document.' },
    { label: 'Add interventions', instruction: 'Expand the treatment interventions section with more specific recommendations.' },
  ];

  return (
    <div className={`glass-panel rounded-3xl overflow-hidden flex flex-col ${isFullscreen ? 'fixed inset-4 z-50' : ''}`}>
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/30 dark:bg-card/20">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Generated Document</h3>
            <p className="text-xs text-muted-foreground">Edit or refine with AI assistance</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCopy}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            title="Copy to clipboard"
          >
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="flex-1 p-4 overflow-auto">
        <Textarea
          value={content}
          onChange={(e) => onContentChange(e.target.value)}
          placeholder="Generated document will appear here..."
          className="w-full min-h-[300px] bg-transparent border-none resize-none text-sm font-mono focus:ring-0 focus-visible:ring-0"
          data-testid="textarea-generated-content"
        />
      </div>

      <div className="border-t border-border p-4 space-y-4 bg-card/30 dark:bg-card/20">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Detail Level
            </Label>
            <span className="text-xs font-semibold text-primary">{currentPreset.label}</span>
          </div>
          <Slider
            value={[detailLevel]}
            onValueChange={(v) => handleDetailLevelChange(v[0])}
            min={0}
            max={100}
            step={25}
            className="py-2"
          />
          <p className="text-xs text-muted-foreground">{currentPreset.description}</p>
        </div>

        <div className="flex flex-wrap gap-2">
          {quickRefinements.map((ref) => (
            <button
              key={ref.label}
              onClick={() => onRefine(ref.instruction, detailLevel)}
              disabled={isGenerating || !content}
              className="px-3 py-1.5 text-xs font-medium rounded-full bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors disabled:opacity-50"
            >
              {ref.label}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <Textarea
            value={refinementInstruction}
            onChange={(e) => setRefinementInstruction(e.target.value)}
            placeholder="Add custom refinement instructions..."
            className="flex-1 bg-card/50 dark:bg-card/20 border-border rounded-xl min-h-[60px] resize-none text-sm"
          />
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleRefine}
              disabled={isGenerating || !refinementInstruction.trim() || !content}
              size="sm"
              className="btn-gradient text-white"
            >
              <Sparkles className="h-4 w-4 mr-1" />
              Refine
            </Button>
            <Button
              onClick={() => onRegenerate(detailLevel)}
              disabled={isGenerating}
              variant="outline"
              size="sm"
            >
              <RefreshCcw className="h-4 w-4 mr-1" />
              Regenerate
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
