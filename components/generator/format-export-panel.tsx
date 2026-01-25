import { X, Printer, Share2, FileText } from 'lucide-react';
import { Slider } from '@/components/ui/slider';

interface FormatExportPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onExportPdf: () => void;
  onPrint: () => void;
  onShare?: () => void;
  textSize: number;
  lineHeight: 'compact' | 'normal';
  fontWeight: 'normal' | 'bold';
  onTextSizeChange: (value: number) => void;
  onLineHeightChange: (value: 'compact' | 'normal') => void;
  onFontWeightChange: (value: 'normal' | 'bold') => void;
}

export function FormatExportPanel({
  isOpen,
  onClose,
  onExportPdf,
  onPrint,
  onShare,
  textSize,
  lineHeight,
  fontWeight,
  onTextSizeChange,
  onLineHeightChange,
  onFontWeightChange,
}: FormatExportPanelProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed top-[110px] right-4 z-50 w-[280px] sm:w-[300px] animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-panel overflow-hidden rounded-2xl p-5 shadow-2xl ring-1 ring-border/50 dark:ring-white/10 bg-card/95 dark:bg-[#162e2b]/90 backdrop-blur-xl">
        <div className="mb-4 flex items-center justify-between border-b border-border/50 dark:border-white/10 pb-3">
          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            Format & Export
          </h3>
          <button 
            onClick={onClose}
            className="rounded-full p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="mb-5 space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              <span>Text Size</span>
              <span className="text-primary">{textSize}pt</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">A-</span>
              <Slider 
                value={[textSize]}
                onValueChange={([v]) => onTextSizeChange(v)}
                min={10}
                max={16}
                step={1}
                className="flex-1"
              />
              <span className="text-lg font-medium">A+</span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Line Height</span>
              <div className="flex rounded-lg bg-muted/50 p-1 ring-1 ring-border/50">
                <button 
                  onClick={() => onLineHeightChange('compact')}
                  className={`flex-1 rounded py-1.5 text-center transition-all ${
                    lineHeight === 'compact' 
                      ? 'bg-background shadow-sm ring-1 ring-border/50 text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-xs">Compact</span>
                </button>
                <button 
                  onClick={() => onLineHeightChange('normal')}
                  className={`flex-1 rounded py-1.5 text-center transition-all ${
                    lineHeight === 'normal' 
                      ? 'bg-background shadow-sm ring-1 ring-border/50 text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <span className="text-xs">Normal</span>
                </button>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Weight</span>
              <div className="flex rounded-lg bg-muted/50 p-1 ring-1 ring-border/50">
                <button 
                  onClick={() => onFontWeightChange('normal')}
                  className={`flex-1 rounded py-1.5 text-center font-serif transition-all ${
                    fontWeight === 'normal' 
                      ? 'bg-background shadow-sm ring-1 ring-border/50 text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Aa
                </button>
                <button 
                  onClick={() => onFontWeightChange('bold')}
                  className={`flex-1 rounded py-1.5 text-center font-serif font-bold transition-all ${
                    fontWeight === 'bold' 
                      ? 'bg-background shadow-sm ring-1 ring-border/50 text-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Aa
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="pt-2 border-t border-border/50 dark:border-white/5 mt-2">
          <button 
            onClick={onExportPdf}
            className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#13ecc8] to-[#0ebcb0] py-3 text-sm font-bold text-[#102220] shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/40 active:scale-[0.98]"
          >
            <FileText className="h-5 w-5" />
            Export to PDF
          </button>
          <div className="mt-3 flex justify-center gap-4">
            <button 
              onClick={onPrint}
              className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
            >
              <Printer className="h-3.5 w-3.5" /> Print
            </button>
            {onShare && (
              <button 
                onClick={onShare}
                className="text-xs font-medium text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <Share2 className="h-3.5 w-3.5" /> Share
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
