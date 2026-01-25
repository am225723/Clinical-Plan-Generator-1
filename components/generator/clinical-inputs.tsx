import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Clipboard, FileText, Brain, NotebookText } from 'lucide-react';
import { FileUpload, UploadedFile } from './file-upload';

interface ClinicalInputs {
  intake_form_data: string;
  session_transcripts: string;
  assessment_scores: string;
  provider_notes: string;
}

interface ClinicalInputsProps {
  clinicalInputs: ClinicalInputs;
  onClinicalInputsChange: (inputs: ClinicalInputs) => void;
  files: UploadedFile[];
  onFilesChange: (files: UploadedFile[]) => void;
}

type InputTab = 'intake' | 'session' | 'scores';

export function ClinicalInputsCard({
  clinicalInputs,
  onClinicalInputsChange,
  files,
  onFilesChange,
}: ClinicalInputsProps) {
  const [activeInputTab, setActiveInputTab] = useState<InputTab>('intake');

  const tabs: { id: InputTab; label: string }[] = [
    { id: 'intake', label: 'Intake' },
    { id: 'session', label: 'Session' },
    { id: 'scores', label: 'Scores' },
  ];

  const updateField = (field: keyof ClinicalInputs, value: string) => {
    onClinicalInputsChange({ ...clinicalInputs, [field]: value });
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      switch (activeInputTab) {
        case 'intake':
          updateField('intake_form_data', clinicalInputs.intake_form_data + text);
          break;
        case 'session':
          updateField('session_transcripts', clinicalInputs.session_transcripts + text);
          break;
        case 'scores':
          updateField('assessment_scores', clinicalInputs.assessment_scores + text);
          break;
      }
    } catch (err) {
      console.error('Failed to paste:', err);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-end px-1">
        <h3 className="text-base font-semibold text-foreground">Clinical Context</h3>
        <span className="text-xs text-muted-foreground">Step 2 of 4</span>
      </div>
      
      <div className="bg-card dark:bg-card/50 border border-border p-1 rounded-xl flex relative">
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            onClick={() => setActiveInputTab(tab.id)}
            className={`flex-1 relative z-10 py-2.5 text-sm font-medium text-center transition-colors rounded-lg ${
              activeInputTab === tab.id
                ? 'text-foreground bg-muted'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid={`tab-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="glass-panel rounded-3xl p-5 shadow-lg border-t border-border">
        <FileUpload files={files} onFilesChange={onFilesChange} />
        
        <div className="relative mt-5">
          <Textarea
            value={
              activeInputTab === 'intake'
                ? clinicalInputs.intake_form_data
                : activeInputTab === 'session'
                ? clinicalInputs.session_transcripts
                : clinicalInputs.assessment_scores
            }
            onChange={(e) => {
              const field =
                activeInputTab === 'intake'
                  ? 'intake_form_data'
                  : activeInputTab === 'session'
                  ? 'session_transcripts'
                  : 'assessment_scores';
              updateField(field, e.target.value);
            }}
            placeholder={
              activeInputTab === 'intake'
                ? 'Paste intake form data or clinical notes...'
                : activeInputTab === 'session'
                ? 'Paste session transcripts...'
                : 'Enter assessment scores (PHQ-9, GAD-7, etc.)...'
            }
            className="w-full bg-card/50 dark:bg-card/20 border-border rounded-2xl p-4 text-sm min-h-[120px] resize-none"
            data-testid={`textarea-${activeInputTab}`}
          />
          <div className="absolute bottom-2 right-2">
            <button
              onClick={handlePaste}
              className="p-1.5 rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
              title="Paste from clipboard"
            >
              <Clipboard className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        <div className="mt-4">
          <label className="block text-xs font-medium text-muted-foreground mb-1.5 ml-1">
            Provider Notes
          </label>
          <Textarea
            value={clinicalInputs.provider_notes}
            onChange={(e) => updateField('provider_notes', e.target.value)}
            placeholder="Additional clinical observations..."
            className="w-full bg-card/50 dark:bg-card/20 border-border rounded-2xl p-4 text-sm min-h-[80px] resize-none"
            data-testid="textarea-notes"
          />
        </div>
      </div>
    </div>
  );
}
