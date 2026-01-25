import { useState } from 'react';
import { AlignLeft, AlignCenter, AlignRight, Image, Hash, Calendar, User, Type } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';

interface HeaderFooterConfig {
  text: string;
  alignment: 'left' | 'center' | 'right';
  includeLogo: boolean;
  includePageNumbers: boolean;
  includeDate: boolean;
  includePatientName: boolean;
  fontSize: number;
  customHtml?: string;
}

interface HeaderFooterEditorProps {
  type: 'header' | 'footer' | 'first_page_header' | 'first_page_footer';
  config: HeaderFooterConfig;
  onChange: (config: HeaderFooterConfig) => void;
  logoUrl?: string;
}

export function HeaderFooterEditor({ type, config, onChange, logoUrl }: HeaderFooterEditorProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateConfig = (field: keyof HeaderFooterConfig, value: any) => {
    onChange({ ...config, [field]: value });
  };

  const typeLabels = {
    header: 'Header',
    footer: 'Footer',
    first_page_header: 'First Page Header',
    first_page_footer: 'First Page Footer',
  };

  const alignmentOptions = [
    { value: 'left', icon: AlignLeft },
    { value: 'center', icon: AlignCenter },
    { value: 'right', icon: AlignRight },
  ];

  const insertTokens = [
    { token: '{{page}}', label: 'Page Number', icon: Hash },
    { token: '{{date}}', label: 'Current Date', icon: Calendar },
    { token: '{{patient}}', label: 'Patient Name', icon: User },
  ];

  const handleInsertToken = (token: string) => {
    updateConfig('text', config.text + ' ' + token);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium text-sm flex items-center gap-2">
          <Type className="h-4 w-4 text-primary" />
          {typeLabels[type]}
        </h4>
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-xs text-primary hover:underline"
        >
          {showAdvanced ? 'Simple Mode' : 'Advanced'}
        </button>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-xs text-muted-foreground">Text Content</Label>
          <Input
            value={config.text}
            onChange={(e) => updateConfig('text', e.target.value)}
            placeholder={`Enter ${type} text...`}
            className="rounded-xl"
          />
        </div>

        <div className="flex items-center gap-2">
          <Label className="text-xs text-muted-foreground mr-2">Alignment</Label>
          <div className="flex bg-muted/50 rounded-lg p-1">
            {alignmentOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  onClick={() => updateConfig('alignment', opt.value as 'left' | 'center' | 'right')}
                  className={`p-2 rounded-md transition-colors ${
                    config.alignment === opt.value
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Label className="text-xs text-muted-foreground w-full mb-1">Insert Variable</Label>
          {insertTokens.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.token}
                onClick={() => handleInsertToken(item.token)}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-muted/50 hover:bg-muted rounded-lg transition-colors"
              >
                <Icon className="h-3 w-3 text-primary" />
                {item.label}
              </button>
            );
          })}
        </div>

        {showAdvanced && (
          <>
            <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Image className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">Include Logo</span>
                </div>
                <Switch
                  checked={config.includeLogo}
                  onCheckedChange={(v) => updateConfig('includeLogo', v)}
                  disabled={type.includes('footer')}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">Page Numbers</span>
                </div>
                <Switch
                  checked={config.includePageNumbers}
                  onCheckedChange={(v) => updateConfig('includePageNumbers', v)}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">Current Date</span>
                </div>
                <Switch
                  checked={config.includeDate}
                  onCheckedChange={(v) => updateConfig('includeDate', v)}
                />
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-muted/30">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs">Patient Name</span>
                </div>
                <Switch
                  checked={config.includePatientName}
                  onCheckedChange={(v) => updateConfig('includePatientName', v)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Font Size</Label>
                <span className="text-xs font-medium">{config.fontSize}pt</span>
              </div>
              <Slider
                value={[config.fontSize]}
                onValueChange={([v]) => updateConfig('fontSize', v)}
                min={8}
                max={14}
                step={1}
                className="py-2"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Custom HTML (Optional)</Label>
              <Textarea
                value={config.customHtml || ''}
                onChange={(e) => updateConfig('customHtml', e.target.value)}
                placeholder="<div style='...'>Custom HTML content</div>"
                className="font-mono text-xs min-h-[60px] rounded-xl"
              />
            </div>
          </>
        )}
      </div>

      {logoUrl && config.includeLogo && type.includes('header') && (
        <div className="p-2 border border-dashed border-border rounded-xl bg-muted/20">
          <p className="text-[10px] text-muted-foreground mb-2">Logo Preview:</p>
          <img src={logoUrl} alt="Logo" className="max-h-8 mx-auto" />
        </div>
      )}
    </div>
  );
}
