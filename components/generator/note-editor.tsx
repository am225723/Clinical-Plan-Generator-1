import { useMemo, useState } from 'react';
import { Sparkles, RefreshCcw, Copy, Check, Maximize2, Minimize2, Bold, Italic, MessageSquare } from 'lucide-react';
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
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [sectionDetailLevels, setSectionDetailLevels] = useState<Record<string, number>>({});
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'assistant' | 'user'; content: string }>>([
    { role: 'assistant', content: 'How would you like to refine this note?' },
  ]);

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

  const sections = useMemo(() => {
    const parts = content.split(/\n##\s+/).filter(Boolean);
    if (parts.length === 0) return [{ title: 'Document', body: content }];
    const parsed = parts.map((part, index) => {
      if (index === 0 && !content.startsWith('## ')) {
        return { title: 'Document', body: part };
      }
      const [titleLine, ...rest] = part.split('\n');
      return { title: titleLine.trim(), body: rest.join('\n').trim() };
    });
    return parsed;
  }, [content]);

  const rebuildContent = (updatedSections: { title: string; body: string }[]) => {
    const rebuilt = updatedSections
      .map((section, index) => {
        if (index === 0 && section.title === 'Document') {
          return section.body;
        }
        return `## ${section.title}\n\n${section.body}`;
      })
      .join('\n\n');
    onContentChange(rebuilt.trim());
  };

  const handleSectionChange = (index: number, value: string) => {
    const updated = sections.map((section, i) => (i === index ? { ...section, body: value } : section));
    rebuildContent(updated);
  };

  const handleAddFormatting = (token: '**' | '_') => {
    const section = sections[activeSectionIndex];
    if (!section) return;
    const wrapped = `${section.body}\n${token}text${token}`.trim();
    handleSectionChange(activeSectionIndex, wrapped);
  };

  const handleSectionRefine = (title: string) => {
    const level = sectionDetailLevels[title] ?? detailLevel;
    onRefine(`Refine the "${title}" section with detail level ${level}.`, level);
  };

  const handleChatSend = () => {
    if (!chatInput.trim()) return;
    const nextMessages = [...chatMessages, { role: 'user', content: chatInput.trim() }];
    setChatMessages(nextMessages);
    setChatInput('');
    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Noted. Use the refine buttons to apply changes.' },
      ]);
    }, 300);
  };

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

      <div className="flex-1 p-4 overflow-auto space-y-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleAddFormatting('**')}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            title="Bold"
          >
            <Bold className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleAddFormatting('_')}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
            title="Italic"
          >
            <Italic className="h-4 w-4" />
          </button>
          <span className="text-xs text-muted-foreground">Use markdown formatting</span>
        </div>

        {sections.map((section, index) => (
          <div key={`${section.title}-${index}`} className="rounded-2xl border border-border/70 p-4 bg-card/30">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-semibold">{section.title}</h4>
              <button
                onClick={() => setActiveSectionIndex(index)}
                className={`text-xs px-2 py-1 rounded-full ${activeSectionIndex === index ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}
              >
                {activeSectionIndex === index ? 'Active' : 'Edit'}
              </button>
            </div>
            <Textarea
              value={section.body}
              onChange={(e) => handleSectionChange(index, e.target.value)}
              className="w-full min-h-[140px] bg-transparent border-border/50 resize-none text-sm"
              data-testid={`textarea-section-${index}`}
            />
            <div className="mt-3">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Section Detail Level
              </Label>
              <Slider
                value={[sectionDetailLevels[section.title] ?? detailLevel]}
                onValueChange={(v) =>
                  setSectionDetailLevels((prev) => ({ ...prev, [section.title]: v[0] }))
                }
                min={0}
                max={100}
                step={25}
                className="py-2"
              />
              <Button
                size="sm"
                variant="outline"
                className="mt-2"
                onClick={() => handleSectionRefine(section.title)}
                disabled={isGenerating}
              >
                Refine Section
              </Button>
            </div>
          </div>
        ))}
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

        <div className="rounded-2xl border border-border/70 p-4 bg-background/70">
          <div className="flex items-center gap-2 mb-3 text-sm font-semibold">
            <MessageSquare className="h-4 w-4 text-primary" />
            AI Chat
          </div>
          <div className="space-y-2 max-h-40 overflow-y-auto text-sm">
            {chatMessages.map((message, index) => (
              <div
                key={`${message.role}-${index}`}
                className={`rounded-xl px-3 py-2 ${
                  message.role === 'assistant'
                    ? 'bg-muted text-muted-foreground'
                    : 'bg-primary/10 text-primary'
                }`}
              >
                {message.content}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Textarea
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask the AI about edits..."
              className="flex-1 min-h-[60px]"
            />
            <Button
              size="sm"
              className="btn-gradient text-white"
              onClick={handleChatSend}
              disabled={!chatInput.trim()}
            >
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
