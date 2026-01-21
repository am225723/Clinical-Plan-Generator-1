import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AppSettings } from "@/lib/app-settings";
import { Database, Bot, Key } from "lucide-react";

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  settings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

export function SettingsDialog({ open, onOpenChange, settings, onSave }: SettingsDialogProps) {
  const [localSettings, setLocalSettings] = React.useState(settings);

  React.useEffect(() => {
    setLocalSettings(settings);
  }, [settings, open]);

  const handleSave = () => {
    onSave(localSettings);
    onOpenChange(false);
  };

  const updateSupabase = (field: keyof AppSettings['supabase'], value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      supabase: { ...prev.supabase, [field]: value }
    }));
  };

  const updateAI = (field: keyof AppSettings['ai'], value: any) => {
    setLocalSettings(prev => ({
      ...prev,
      ai: { ...prev.ai, [field]: value }
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
          <DialogDescription>
            Configure external services for OCR, Transcription, and AI generation.
          </DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="supabase" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supabase"><Database className="w-4 h-4 mr-2" /> Supabase (Storage)</TabsTrigger>
            <TabsTrigger value="ai"><Bot className="w-4 h-4 mr-2" /> AI Integration</TabsTrigger>
          </TabsList>

          <TabsContent value="supabase" className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-supabase">Enable Cloud Storage & OCR</Label>
                <p className="text-xs text-muted-foreground">Required for PDF OCR and Audio Transcription</p>
              </div>
              <Switch 
                id="enable-supabase" 
                checked={localSettings.supabase.enabled}
                onCheckedChange={(c) => updateSupabase('enabled', c)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sb-url">Project URL</Label>
              <Input 
                id="sb-url" 
                placeholder="https://xyz.supabase.co" 
                value={localSettings.supabase.url}
                onChange={(e) => updateSupabase('url', e.target.value)}
                disabled={!localSettings.supabase.enabled}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sb-key">Anon Public Key</Label>
              <Input 
                id="sb-key" 
                type="password"
                placeholder="eyJh..." 
                value={localSettings.supabase.anonKey}
                onChange={(e) => updateSupabase('anonKey', e.target.value)}
                disabled={!localSettings.supabase.enabled}
              />
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4 py-4">
             <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="enable-ai">Enable AI Enhancement</Label>
                <p className="text-xs text-muted-foreground">Use LLMs to improve clinical text generation</p>
              </div>
              <Switch 
                id="enable-ai" 
                checked={localSettings.ai.enabled}
                onCheckedChange={(c) => updateAI('enabled', c)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Provider</Label>
                 <Select 
                   value={localSettings.ai.provider} 
                   onValueChange={(v) => updateAI('provider', v)}
                   disabled={!localSettings.ai.enabled}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select Provider" />
                   </SelectTrigger>
                   <SelectContent>
                     <SelectItem value="openai">OpenAI</SelectItem>
                     <SelectItem value="perplexity">Perplexity AI</SelectItem>
                   </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Model</Label>
                 <Select 
                   value={localSettings.ai.model} 
                   onValueChange={(v) => updateAI('model', v)}
                   disabled={!localSettings.ai.enabled}
                 >
                   <SelectTrigger>
                     <SelectValue placeholder="Select Model" />
                   </SelectTrigger>
                   <SelectContent>
                     {localSettings.ai.provider === 'perplexity' ? (
                       <>
                         <SelectItem value="sonar-pro">Sonar Pro</SelectItem>
                         <SelectItem value="sonar">Sonar</SelectItem>
                       </>
                     ) : (
                       <>
                         <SelectItem value="gpt-4o">GPT-4o</SelectItem>
                         <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                         <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                       </>
                     )}
                   </SelectContent>
                 </Select>
               </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ai-key" className="flex items-center">
                <Key className="w-3 h-3 mr-1" /> API Key
              </Label>
              <Input 
                id="ai-key" 
                type="password"
                placeholder={`sk-... (${localSettings.ai.provider === 'perplexity' ? 'pplx-' : ''})`}
                value={localSettings.ai.apiKey}
                onChange={(e) => updateAI('apiKey', e.target.value)}
                disabled={!localSettings.ai.enabled}
              />
              <p className="text-[10px] text-muted-foreground text-right">
                Keys are stored locally in your browser only.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Settings</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
