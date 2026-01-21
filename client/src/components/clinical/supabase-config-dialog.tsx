import React from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { SupabaseConfig } from "@/lib/supabase-client";

interface SupabaseConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  config: SupabaseConfig;
  onSave: (config: SupabaseConfig) => void;
}

export function SupabaseConfigDialog({ open, onOpenChange, config, onSave }: SupabaseConfigDialogProps) {
  const [localConfig, setLocalConfig] = React.useState(config);

  React.useEffect(() => {
    setLocalConfig(config);
  }, [config, open]);

  const handleSave = () => {
    onSave(localConfig);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Supabase Configuration</DialogTitle>
          <DialogDescription>
            Enable cloud features for OCR and Transcription. Keys are stored locally in your browser.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="enable-supabase">Enable Cloud Features</Label>
            <Switch 
              id="enable-supabase" 
              checked={localConfig.enabled}
              onCheckedChange={(c) => setLocalConfig(prev => ({ ...prev, enabled: c }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Project URL</Label>
            <Input 
              id="url" 
              placeholder="https://xyz.supabase.co" 
              value={localConfig.url}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, url: e.target.value }))}
              disabled={!localConfig.enabled}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="key">Anon Public Key</Label>
            <Input 
              id="key" 
              type="password"
              placeholder="eyJh..." 
              value={localConfig.anonKey}
              onChange={(e) => setLocalConfig(prev => ({ ...prev, anonKey: e.target.value }))}
              disabled={!localConfig.enabled}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave}>Save Configuration</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
