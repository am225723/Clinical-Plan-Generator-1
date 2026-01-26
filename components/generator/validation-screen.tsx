import { useState } from 'react';
import { ClipboardCheck, Pill, Brain, Sparkles, CheckCircle, ArrowRight, Mic, FileText, ClipboardList, StickyNote, MessageSquare, Plus, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

interface ValidationItem {
  id: string;
  title: string;
  severity: 'missing' | 'incomplete';
  icon: React.ReactNode;
  description: string;
  placeholder: string;
}

interface ValidationScreenProps {
  templateName?: string;
  missingFields: string[];
  incompleteFields?: { field: string; hint: string }[];
  onProceed: (fieldValues: Record<string, string>) => void;
  onSkip: () => void;
  onFieldComplete: (field: string, value: string) => void;
  onBack?: () => void;
}

const FIELD_CONFIG: Record<string, { icon: React.ReactNode; description: string; placeholder: string }> = {
  'Intake Form': {
    icon: <ClipboardList className="h-5 w-5" />,
    description: 'Patient intake information and history',
    placeholder: 'Enter patient intake details, demographics, chief complaint...',
  },
  'Session Transcript': {
    icon: <MessageSquare className="h-5 w-5" />,
    description: 'Session notes or transcript text',
    placeholder: 'Paste session transcript or summary notes...',
  },
  'Assessment Scores': {
    icon: <FileText className="h-5 w-5" />,
    description: 'Clinical assessment scores and measures',
    placeholder: 'E.g., PHQ-9: 14, GAD-7: 11, Columbia score: 2...',
  },
  'Provider Notes': {
    icon: <StickyNote className="h-5 w-5" />,
    description: 'Additional provider observations',
    placeholder: 'Enter clinical observations, treatment notes...',
  },
  'Medication History': {
    icon: <Pill className="h-5 w-5" />,
    description: 'Input current medications to improve interactions check',
    placeholder: 'E.g., Sertraline 50mg QD, Clonazepam 0.5mg PRN...',
  },
  'Mental Status Exam': {
    icon: <Brain className="h-5 w-5" />,
    description: 'Detailed thought process description is missing',
    placeholder: 'Add Details',
  },
  'Mental Status': {
    icon: <Brain className="h-5 w-5" />,
    description: 'Detailed thought process description',
    placeholder: 'Describe current mental status observations...',
  },
};

export function ValidationScreen({
  templateName = 'Treatment Plan',
  missingFields,
  incompleteFields = [],
  onProceed,
  onSkip,
  onFieldComplete,
  onBack,
}: ValidationScreenProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});
  const [expandedField, setExpandedField] = useState<string | null>(null);

  const missingItems: ValidationItem[] = missingFields.map((field) => {
    const config = FIELD_CONFIG[field] || {
      icon: <FileText className="h-5 w-5" />,
      description: 'Required clinical information',
      placeholder: `Enter ${field.toLowerCase()}...`,
    };
    return {
      id: field,
      title: field,
      severity: 'missing' as const,
      ...config,
    };
  });

  const incompleteItems: ValidationItem[] = incompleteFields.map(({ field, hint }) => {
    const config = FIELD_CONFIG[field] || {
      icon: <FileText className="h-5 w-5" />,
      description: hint || 'Additional information needed',
      placeholder: 'Add Details',
    };
    return {
      id: field,
      title: field,
      severity: 'incomplete' as const,
      ...config,
      description: hint || config.description,
    };
  });

  const validationItems = [...missingItems, ...incompleteItems];
  const totalItems = validationItems.length;

  const handleFieldChange = (fieldId: string, value: string) => {
    setFieldValues((prev) => ({ ...prev, [fieldId]: value }));
    onFieldComplete(fieldId, value);
  };

  const handleProceed = () => {
    onProceed(fieldValues);
  };

  if (validationItems.length === 0) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 px-4 py-6 pb-32 overflow-y-auto">
        <div className="max-w-lg mx-auto space-y-6">
          <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
              <ClipboardCheck className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground mb-1">Clinical Readiness Check</h1>
            <p className="text-sm text-muted-foreground">
              Review missing details for the{' '}
              <span className="text-primary font-medium">{templateName}</span> template.
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                Missing or Incomplete Info
              </h3>
              <span className="text-[10px] font-medium text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full border border-border">
                {totalItems} Items
              </span>
            </div>

            {validationItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-2xl overflow-hidden border transition-all ${
                  item.severity === 'missing'
                    ? 'border-l-4 border-l-amber-500 border-t-border/50 border-r-border/50 border-b-border/50 bg-amber-500/5'
                    : 'border-l-4 border-l-amber-600 border-t-border/50 border-r-border/50 border-b-border/50 bg-amber-600/5'
                }`}
              >
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        item.severity === 'missing'
                          ? 'bg-amber-500/20 text-amber-500'
                          : 'bg-amber-600/20 text-amber-600'
                      }`}
                    >
                      {item.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                      </div>
                      <p
                        className={`text-[10px] font-bold tracking-wide mt-0.5 uppercase ${
                          item.severity === 'missing' ? 'text-amber-500' : 'text-amber-600'
                        }`}
                      >
                        {item.severity === 'missing' ? 'Missing Required Field' : 'Incomplete Data'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3">
                    <p className="text-xs text-muted-foreground mb-2">{item.description}:</p>
                    {expandedField === item.id ? (
                      <Textarea
                        value={fieldValues[item.id] || ''}
                        onChange={(e) => handleFieldChange(item.id, e.target.value)}
                        placeholder={item.placeholder}
                        className="bg-card/50 dark:bg-card/30 border-border rounded-xl min-h-[80px] resize-none text-sm"
                        autoFocus
                        onBlur={() => {
                          if (!fieldValues[item.id]?.trim()) {
                            setExpandedField(null);
                          }
                        }}
                      />
                    ) : (
                      <div
                        onClick={() => setExpandedField(item.id)}
                        className="flex items-center gap-2 p-3 bg-card/50 dark:bg-card/30 rounded-xl border border-border cursor-pointer hover:bg-card/70 transition-colors group"
                      >
                        <span className="flex-1 text-sm text-muted-foreground">
                          {fieldValues[item.id] || item.placeholder}
                        </span>
                        <div className="flex items-center gap-1">
                          {item.severity === 'incomplete' ? (
                            <button className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors">
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                          ) : (
                            <button className="p-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors">
                              <Plus className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button className="p-1.5 rounded-lg bg-muted/50 hover:bg-muted text-muted-foreground transition-colors">
                            <Mic className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-start gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/20">
            <div className="p-1.5 rounded-lg bg-primary/20 flex-shrink-0">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-primary">AI Optimization Tip</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Providing this data now will improve the clinical accuracy of the generated
                treatment plan by approximately{' '}
                <span className="text-foreground font-semibold">40%</span>.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 pb-20 bg-gradient-to-t from-background via-background to-transparent">
        <div className="max-w-lg mx-auto space-y-3">
          <Button
            onClick={handleProceed}
            className="w-full h-12 btn-gradient text-white font-semibold rounded-xl shadow-glow"
            data-testid="button-proceed-generation"
          >
            <CheckCircle className="mr-2 h-5 w-5" />
            Proceed to Generation
          </Button>
          <button
            onClick={onSkip}
            className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
            data-testid="button-skip-generation"
          >
            Skip and Generate Anyway
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
