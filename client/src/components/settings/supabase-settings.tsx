import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { getStoredSettings, saveSettings, AppSettings } from '@/lib/app-settings';
import { testConnection, isSupabaseConfigured } from '@/lib/supabase-client';
import { Loader2, CheckCircle, XCircle, Database, Upload, Shield, Key, Bot } from 'lucide-react';

interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSettingsChange?: () => void;
}

export function SettingsModal({ open, onOpenChange, onSettingsChange }: SettingsModalProps) {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AppSettings>(getStoredSettings());
  const [testing, setTesting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'untested' | 'success' | 'error'>('untested');
  const supabaseConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (open) {
      setSettings(getStoredSettings());
      setConnectionStatus('untested');
    }
  }, [open]);

  const handleTestConnection = async () => {
    setTesting(true);
    
    const { success, error } = await testConnection();
    setTesting(false);
    
    if (success) {
      setConnectionStatus('success');
      toast({ title: 'Connection Successful', description: 'Supabase is configured correctly.' });
    } else {
      setConnectionStatus('error');
      toast({ title: 'Connection Failed', description: error || 'Could not connect to Supabase', variant: 'destructive' });
    }
  };

  const handleSave = () => {
    saveSettings(settings);
    toast({ title: 'Settings Saved', description: 'Your configuration has been updated.' });
    onSettingsChange?.();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Application Settings</DialogTitle>
          <DialogDescription>Configure AI integrations for your clinical documentation.</DialogDescription>
        </DialogHeader>
        
        <Tabs defaultValue="supabase" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="supabase" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Supabase
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              AI Settings
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="supabase" className="space-y-6 mt-4">
            {supabaseConfigured ? (
              <>
                <div className="rounded-lg bg-green-50 border border-green-200 p-4 text-sm text-green-800">
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Supabase is configured via environment variables.
                </div>
                
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection} 
                  disabled={testing}
                  className="w-full"
                  data-testid="button-test-connection"
                >
                  {testing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {connectionStatus === 'success' && <CheckCircle className="mr-2 h-4 w-4 text-green-500" />}
                  {connectionStatus === 'error' && <XCircle className="mr-2 h-4 w-4 text-red-500" />}
                  Test Connection
                </Button>
                
                <div className="rounded-lg bg-muted p-4 space-y-3">
                  <h4 className="font-medium text-sm">Supabase Features</h4>
                  <div className="grid grid-cols-1 gap-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-blue-500" />
                      <span>Authentication (Sign in/Sign up)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Upload className="h-4 w-4 text-green-500" />
                      <span>File Storage (PDFs, Audio)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4 text-purple-500" />
                      <span>Database (Patients, Plans)</span>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <p className="font-medium mb-2">Supabase Not Configured</p>
                <p>Set the following environment variables to enable Supabase:</p>
                <ul className="mt-2 list-disc list-inside space-y-1">
                  <li><code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_URL</code></li>
                  <li><code className="bg-amber-100 px-1 rounded">VITE_SUPABASE_ANON_KEY</code></li>
                </ul>
                <p className="mt-2 text-xs">For Vercel deployment, add these in your Vercel project settings.</p>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="ai" className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Enable Custom AI Key</Label>
                <p className="text-sm text-muted-foreground">Use your own API key for AI features</p>
              </div>
              <Switch 
                checked={settings.ai.enabled}
                onCheckedChange={(checked) => setSettings(s => ({ 
                  ...s, 
                  ai: { ...s.ai, enabled: checked } 
                }))}
                data-testid="switch-ai-enabled"
              />
            </div>
            
            {settings.ai.enabled && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="ai-provider">Provider</Label>
                  <select 
                    id="ai-provider"
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                    value={settings.ai.provider}
                    onChange={(e) => setSettings(s => ({ 
                      ...s, 
                      ai: { ...s.ai, provider: e.target.value as 'openai' | 'perplexity' | 'disabled' } 
                    }))}
                    data-testid="select-ai-provider"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="perplexity">Perplexity</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ai-key">API Key</Label>
                  <Input 
                    id="ai-key"
                    type="password"
                    placeholder="sk-..."
                    value={settings.ai.apiKey}
                    onChange={(e) => setSettings(s => ({ 
                      ...s, 
                      ai: { ...s.ai, apiKey: e.target.value } 
                    }))}
                    data-testid="input-ai-key"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="ai-model">Model</Label>
                  <Input 
                    id="ai-model"
                    placeholder="gpt-4o"
                    value={settings.ai.model}
                    onChange={(e) => setSettings(s => ({ 
                      ...s, 
                      ai: { ...s.ai, model: e.target.value } 
                    }))}
                    data-testid="input-ai-model"
                  />
                </div>
                
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4 text-sm text-blue-800">
                  <Key className="h-4 w-4 inline mr-2" />
                  Your API key is stored locally in your browser and never sent to our servers.
                </div>
              </>
            )}
            
            <div className="rounded-lg bg-muted p-4 text-sm">
              <p className="font-medium mb-1">Note:</p>
              <p className="text-muted-foreground">
                If you don't configure your own API key, the app will use the built-in AI service when available, 
                or fall back to a deterministic local generator.
              </p>
            </div>
          </TabsContent>
        </Tabs>
        
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => onOpenChange(false)} data-testid="button-cancel-settings">
            Cancel
          </Button>
          <Button onClick={handleSave} data-testid="button-save-settings">
            Save Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
