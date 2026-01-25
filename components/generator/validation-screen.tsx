import { useState } from 'react';
import { AlertCircle, Pill, Brain, Sparkles, ChevronRight, SkipForward, Mic } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

interface ValidationItem {
  id: string;
  title: string;
  severity: 'missing' | 'incomplete';
  icon: React.ReactNode;
  description: string;
  placeholder: string;
}

interface ValidationScreenProps {
  missingFields: string[];
  onProceed: () => void;
  onSkip: () => void;
  onFieldComplete: (field: string, value: string) => void;
}

export function ValidationScreen({
  missingFields,
  onProceed,
  onSkip,
  onFieldComplete,
}: ValidationScreenProps) {
  const [fieldValues, setFieldValues] = useState<Record<string, string>>({});

  const validationItems: ValidationItem[] = [
    {
      id: 'medication_history',
      title: 'Medication History',
      severity: 'missing',
      icon: <Pill className="h-5 w-5" />,
      description: 'Current medications improve interactions check',
      placeholder: 'E.g., Sertraline 50mg QD, Clonazepam 0.5mg PRN...',
    },
    {
      id: 'mental_status',
      title: 'Mental Status Exam',
      severity: 'incomplete',
      icon: <Brain className="h-5 w-5" />,
      description: 'Detailed thought process description',
      placeholder: 'Describe current mental status observations...',
    },
  ];

  const activeItems = validationItems.filter((item) =>
    missingFields.some((f) => f.toLowerCase().includes(item.id.replace('_', ' ')))
  );

  const completedCount = missingFields.length - activeItems.length;
  const totalCount = missingFields.length || 2;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  if (missingFields.length === 0) {
    return null;
  }

  return (
    <div className="glass-panel rounded-3xl p-6 space-y-6">
      <div className="text-center">
        <div className="relative w-20 h-20 mx-auto mb-4">
          <svg className="w-20 h-20 -rotate-90">
            <circle
              className="text-muted"
              cx="40"
              cy="40"
              fill="none"
              r="36"
              stroke="currentColor"
              strokeWidth="4"
            />
            <circle
              className="text-amber-500"
              cx="40"
              cy="40"
              fill="none"
              r="36"
              stroke="currentColor"
              strokeDasharray="226"
              strokeDashoffset={226 - (226 * progressPercent) / 100}
              strokeLinecap="round"
              strokeWidth="4"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-amber-500" />
          </div>
        </div>
        <h2 className="text-xl font-bold text-foreground mb-1">Clinical Readiness Check</h2>
        <p className="text-muted-foreground text-sm">
          Review missing details for better documentation quality
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          Missing or Incomplete Info
          <span className="bg-muted text-muted-foreground text-[10px] px-1.5 py-0.5 rounded-full border border-border">
            {activeItems.length} Items
          </span>
        </h3>

        {activeItems.length > 0 ? (
          activeItems.map((item) => (
            <div
              key={item.id}
              className={`rounded-2xl overflow-hidden border-l-4 shadow-lg ${
                item.severity === 'missing'
                  ? 'border-rose-500 bg-rose-500/5'
                  : 'border-amber-500 bg-amber-500/5'
              }`}
            >
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                      item.severity === 'missing'
                        ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                        : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                    }`}
                  >
                    {item.icon}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                    <p
                      className={`text-[10px] font-bold tracking-wide mt-0.5 ${
                        item.severity === 'missing' ? 'text-rose-500' : 'text-amber-500'
                      }`}
                    >
                      {item.severity === 'missing' ? 'MISSING REQUIRED FIELD' : 'INCOMPLETE DATA'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 bg-card/40 dark:bg-card/20">
                <label className="block text-xs text-muted-foreground mb-2">
                  {item.description}:
                </label>
                <div className="relative">
                  <Textarea
                    value={fieldValues[item.id] || ''}
                    onChange={(e) => {
                      setFieldValues({ ...fieldValues, [item.id]: e.target.value });
                    }}
                    placeholder={item.placeholder}
                    className="bg-card/50 dark:bg-card/20 border-border rounded-xl min-h-[80px] resize-none text-sm pr-12"
                  />
                  <button className="absolute bottom-3 right-3 p-1.5 bg-muted hover:bg-muted/80 text-muted-foreground rounded-lg transition-colors">
                    <Mic className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>All required fields are complete!</p>
          </div>
        )}

        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
          <div className="p-1 rounded bg-primary/20">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-semibold text-primary">AI Optimization Tip</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              Providing this data now will improve the clinical accuracy of the generated
              treatment plan by approximately <span className="text-foreground font-medium">40%</span>.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 pt-4">
          <Button
            onClick={onProceed}
            className="w-full h-12 btn-gradient text-white font-semibold rounded-xl shadow-glow"
          >
            <ChevronRight className="mr-2 h-5 w-5" />
            Proceed to Generation
          </Button>
          <button
            onClick={onSkip}
            className="w-full py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center justify-center gap-1"
          >
            <SkipForward className="h-4 w-4" />
            Skip and Generate Anyway
          </button>
        </div>
      </div>
    </div>
  );
}
