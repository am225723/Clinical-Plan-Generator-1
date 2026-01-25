import { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Clipboard } from 'lucide-react';

interface ClinicalContextTabsProps {
  intakeData: string;
  onIntakeChange: (value: string) => void;
  sessionData: string;
  onSessionChange: (value: string) => void;
  scoresData: string;
  onScoresChange: (value: string) => void;
  providerNotes: string;
  onProviderNotesChange: (value: string) => void;
}

export function ClinicalContextTabs({
  intakeData,
  onIntakeChange,
  sessionData,
  onSessionChange,
  scoresData,
  onScoresChange,
  providerNotes,
  onProviderNotesChange,
}: ClinicalContextTabsProps) {
  const [activeTab, setActiveTab] = useState<'intake' | 'session' | 'scores' | 'notes'>('intake');

  const tabs = [
    { id: 'intake' as const, label: 'Intake' },
    { id: 'session' as const, label: 'Session' },
    { id: 'scores' as const, label: 'Scores' },
    { id: 'notes' as const, label: 'Notes' },
  ];

  const getTabContent = () => {
    switch (activeTab) {
      case 'intake':
        return {
          value: intakeData,
          onChange: onIntakeChange,
          placeholder: 'Paste intake form data or clinical notes...',
        };
      case 'session':
        return {
          value: sessionData,
          onChange: onSessionChange,
          placeholder: 'Paste session transcript or dictation...',
        };
      case 'scores':
        return {
          value: scoresData,
          onChange: onScoresChange,
          placeholder: 'Enter assessment scores (PHQ-9, GAD-7, etc.)...',
        };
      case 'notes':
        return {
          value: providerNotes,
          onChange: onProviderNotesChange,
          placeholder: 'Add provider observations and notes...',
        };
    }
  };

  const content = getTabContent();
  const activeIndex = tabs.findIndex(t => t.id === activeTab);

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      content.onChange(text);
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
      
      <div className="bg-muted/50 dark:bg-card/50 border border-border/50 p-1 rounded-xl flex relative">
        <div 
          className="absolute left-1 top-1 bottom-1 bg-background dark:bg-muted rounded-lg shadow-sm transition-all duration-300 ease-out z-0"
          style={{
            width: `calc(${100 / tabs.length}% - 0.5rem)`,
            transform: `translateX(calc(${activeIndex * 100}% + ${activeIndex * 0.25}rem))`,
          }}
        />
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 relative z-10 py-2.5 text-sm font-medium text-center transition-colors ${
              activeTab === tab.id 
                ? 'text-foreground' 
                : 'text-muted-foreground hover:text-foreground'
            }`}
            data-testid={`tab-clinical-${tab.id}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      <div className="glass-panel rounded-2xl p-4 border border-border/50 dark:border-white/5">
        <div className="relative">
          <Textarea
            value={content.value}
            onChange={(e) => content.onChange(e.target.value)}
            placeholder={content.placeholder}
            className="min-h-[120px] bg-muted/30 dark:bg-background/50 border-border/50 rounded-xl resize-none text-sm leading-relaxed"
            data-testid={`input-clinical-${activeTab}`}
          />
          <div className="absolute bottom-3 right-3">
            <button 
              onClick={handlePaste}
              className="p-1.5 rounded-lg bg-muted/80 text-muted-foreground hover:text-foreground transition-colors"
              title="Paste from clipboard"
            >
              <Clipboard className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
