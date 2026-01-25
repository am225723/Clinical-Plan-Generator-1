import { useState } from 'react';
import { FileText, Printer, Download, Share2, Eye, EyeOff, Edit3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface DocumentPreviewProps {
  content: string;
  patientName: string;
  dateOfService: string;
  providerName: string;
  templateType: string;
  onPrint: () => void;
  onDownload: () => void;
  onEdit: () => void;
  onSave: () => void;
  isSaving: boolean;
}

const TEMPLATE_LABELS: Record<string, string> = {
  treatment_plan: 'Treatment Plan',
  darp_note: 'DARP Note',
  psych_note: 'Psychiatric Note',
  progress_note: 'Progress Note',
  discharge_summary: 'Discharge Summary',
  custom: 'Custom Document',
};

export function DocumentPreview({
  content,
  patientName,
  dateOfService,
  providerName,
  templateType,
  onPrint,
  onDownload,
  onEdit,
  onSave,
  isSaving,
}: DocumentPreviewProps) {
  const [showPreview, setShowPreview] = useState(true);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const escapeHtml = (text: string) => {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };

  const formatMarkdownToHtml = (text: string) => {
    const escaped = escapeHtml(text);
    return escaped
      .replace(/^### (.*)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2 text-foreground">$1</h3>')
      .replace(/^## (.*)$/gm, '<h2 class="text-xl font-bold mt-6 mb-3 text-foreground">$1</h2>')
      .replace(/^# (.*)$/gm, '<h1 class="text-2xl font-bold mt-6 mb-4 text-foreground">$1</h1>')
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/^- (.*)$/gm, '<li class="ml-4">$1</li>')
      .replace(/^(\d+)\. (.*)$/gm, '<li class="ml-4 list-decimal">$2</li>')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/\n/g, '<br/>');
  };

  return (
    <div className="glass-panel rounded-3xl overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/30 dark:bg-card/20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">Document Preview</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-xs">
                {TEMPLATE_LABELS[templateType] || templateType}
              </Badge>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPreview(!showPreview)}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
          >
            {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
          <button
            onClick={onEdit}
            className="p-2 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
          >
            <Edit3 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {showPreview && (
        <>
          <div className="p-6 bg-white dark:bg-card/50 border-b border-border">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-6 pb-4 border-b border-border">
                <h1 className="text-xl font-bold text-foreground mb-2">
                  {TEMPLATE_LABELS[templateType] || 'Clinical Document'}
                </h1>
                <div className="flex justify-center gap-6 text-sm text-muted-foreground">
                  <span><strong>Patient:</strong> {patientName || 'N/A'}</span>
                  <span><strong>Date:</strong> {formatDate(dateOfService)}</span>
                </div>
              </div>

              <div 
                className="prose prose-sm dark:prose-invert max-w-none text-foreground"
                dangerouslySetInnerHTML={{ __html: formatMarkdownToHtml(content) }}
              />

              <div className="mt-8 pt-4 border-t border-border text-sm text-muted-foreground">
                <p><strong>Provider:</strong> {providerName}</p>
                <p><strong>Generated:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-card/30 dark:bg-card/20">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={onPrint}
                className="gap-2"
              >
                <Printer className="h-4 w-4" />
                Print
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onDownload}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            </div>
            <Button
              onClick={onSave}
              disabled={isSaving}
              className="btn-gradient text-white"
            >
              {isSaving ? 'Saving...' : 'Save Document'}
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
