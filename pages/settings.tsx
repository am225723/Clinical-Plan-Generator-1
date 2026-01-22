import { GetServerSideProps } from 'next';
import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from './_app';
import { requireAdmin } from '@/lib/auth';
import { Profile, DoctorDocumentSettings } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Save, Loader2, Upload, FileText, Settings as SettingsIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SettingsPageProps {
  user: any;
  profile: Profile;
}

const DEFAULT_PROMPT = `Role: Expert Clinical Psychiatrist.
Task: Generate a structured mental health treatment plan JSON from the provided clinical inputs.

REQUIREMENTS:
- Strictly follow the JSON structure provided.
- Use professional clinical language.
- Infer missing data where reasonable based on context, or label as "Not documented".
- Diagnoses must include ICD-10 and DSM-5-TR codes.
- Treatment goals must be SMART.`;

export default function SettingsPage({ user, profile }: SettingsPageProps) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [aiPrompt, setAiPrompt] = useState(DEFAULT_PROMPT);
  const [doctorSettings, setDoctorSettings] = useState<Partial<DoctorDocumentSettings>>({
    logo_url: '',
    header_config: { text: '', alignment: 'center' },
    footer_config: { text: '', alignment: 'center' },
    first_page_header_config: { text: '', alignment: 'center' },
    first_page_footer_config: { text: '', alignment: 'center' },
    patient_field_layout: { order: ['patient_name', 'client_id', 'date_of_birth', 'date_of_service', 'provider_name'] },
    pdf_style: { font_size: 12, font_family: 'Arial' },
  });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    
    const { data: appData, error: appError } = await supabase.functions.invoke('settings-get');
    
    if (!appError && appData?.treatment_plan_prompt) {
      setAiPrompt(appData.treatment_plan_prompt);
    }

    if (profile.role === 'doctor') {
      const { data: docData, error: docError } = await supabase
        .from('doctor_document_settings')
        .select('*')
        .eq('doctor_id', user.id)
        .single();

      if (!docError && docData) {
        setDoctorSettings(docData);
      }
    }

    setLoading(false);
  };

  const handleSaveAiPrompt = async () => {
    setSaving(true);
    
    const { error } = await supabase.functions.invoke('settings-set', {
      body: { treatment_plan_prompt: aiPrompt }
    });

    if (error) {
      toast({ title: 'Error', description: 'Failed to save AI prompt', variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'AI prompt updated successfully' });
    }
    
    setSaving(false);
  };

  const handleSaveDoctorSettings = async () => {
    setSaving(true);
    
    const { error } = await supabase
      .from('doctor_document_settings')
      .upsert({
        doctor_id: user.id,
        ...doctorSettings,
        updated_at: new Date().toISOString(),
      });

    if (error) {
      toast({ title: 'Error', description: 'Failed to save settings', variant: 'destructive' });
    } else {
      toast({ title: 'Saved', description: 'Document settings updated' });
    }
    
    setSaving(false);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      const { data, error } = await supabase.functions.invoke('logo-upload-sign', {
        body: { filename: file.name, contentType: file.type }
      });

      if (error) throw error;

      const uploadResponse = await fetch(data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      setDoctorSettings({ ...doctorSettings, logo_url: data.publicUrl });
      toast({ title: 'Uploaded', description: 'Logo uploaded successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }

    setUploading(false);
  };

  const updatePdfStyle = (field: string, value: any) => {
    setDoctorSettings({
      ...doctorSettings,
      pdf_style: { ...doctorSettings.pdf_style, [field]: value }
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <Head>
        <title>Settings | GoldStandard Clinical</title>
      </Head>
      <div className="min-h-screen bg-slate-50">
        <header className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="font-serif font-bold text-xl text-slate-800">
              Settings
              <Badge variant="secondary" className="ml-3">{profile.role}</Badge>
            </h1>
          </div>
        </header>

        <main className="container mx-auto py-8 px-4 max-w-4xl">
          <Tabs defaultValue="ai">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="ai">
                <SettingsIcon className="h-4 w-4 mr-2" /> AI Configuration
              </TabsTrigger>
              <TabsTrigger value="document" disabled={profile.role !== 'doctor' && profile.role !== 'admin'}>
                <FileText className="h-4 w-4 mr-2" /> Document Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="ai" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>AI Treatment Plan Prompt</CardTitle>
                  <CardDescription>
                    Customize the system prompt used for generating treatment plans. 
                    This affects all doctors in the system.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    rows={12}
                    className="font-mono text-sm"
                    data-testid="textarea-ai-prompt"
                  />
                  <div className="flex justify-between items-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setAiPrompt(DEFAULT_PROMPT)}
                      data-testid="button-reset-prompt"
                    >
                      Reset to Default
                    </Button>
                    <Button 
                      onClick={handleSaveAiPrompt} 
                      disabled={saving}
                      data-testid="button-save-prompt"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Prompt
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="document" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Logo</CardTitle>
                  <CardDescription>Upload your practice logo for PDF documents</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {doctorSettings.logo_url && (
                    <div className="border rounded p-4 flex items-center justify-center bg-white">
                      <img src={doctorSettings.logo_url} alt="Logo" className="max-h-20" />
                    </div>
                  )}
                  <div className="flex items-center gap-4">
                    <Input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploading}
                      data-testid="input-logo-upload"
                    />
                    {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Header & Footer</CardTitle>
                  <CardDescription>Configure document headers and footers</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Header Text</Label>
                      <Input
                        value={(doctorSettings.header_config as any)?.text || ''}
                        onChange={(e) => setDoctorSettings({
                          ...doctorSettings,
                          header_config: { ...(doctorSettings.header_config as any), text: e.target.value }
                        })}
                        placeholder="Practice Name / Header"
                        data-testid="input-header-text"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Footer Text</Label>
                      <Input
                        value={(doctorSettings.footer_config as any)?.text || ''}
                        onChange={(e) => setDoctorSettings({
                          ...doctorSettings,
                          footer_config: { ...(doctorSettings.footer_config as any), text: e.target.value }
                        })}
                        placeholder="Page numbers, copyright, etc."
                        data-testid="input-footer-text"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>First Page Header</Label>
                      <Input
                        value={(doctorSettings.first_page_header_config as any)?.text || ''}
                        onChange={(e) => setDoctorSettings({
                          ...doctorSettings,
                          first_page_header_config: { ...(doctorSettings.first_page_header_config as any), text: e.target.value }
                        })}
                        placeholder="Different header for first page"
                        data-testid="input-first-header-text"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>First Page Footer</Label>
                      <Input
                        value={(doctorSettings.first_page_footer_config as any)?.text || ''}
                        onChange={(e) => setDoctorSettings({
                          ...doctorSettings,
                          first_page_footer_config: { ...(doctorSettings.first_page_footer_config as any), text: e.target.value }
                        })}
                        placeholder="Different footer for first page"
                        data-testid="input-first-footer-text"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>PDF Styling</CardTitle>
                  <CardDescription>Configure font and styling for generated PDFs</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Font Size</Label>
                      <Select
                        value={String((doctorSettings.pdf_style as any)?.font_size || 12)}
                        onValueChange={(v) => updatePdfStyle('font_size', parseInt(v))}
                      >
                        <SelectTrigger data-testid="select-font-size">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="10">10pt</SelectItem>
                          <SelectItem value="11">11pt</SelectItem>
                          <SelectItem value="12">12pt</SelectItem>
                          <SelectItem value="14">14pt</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Font Family (optional)</Label>
                      <Select
                        value={(doctorSettings.pdf_style as any)?.font_family || 'Arial'}
                        onValueChange={(v) => updatePdfStyle('font_family', v)}
                      >
                        <SelectTrigger data-testid="select-font-family">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Arial">Arial</SelectItem>
                          <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Georgia">Georgia</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      onClick={handleSaveDoctorSettings} 
                      disabled={saving}
                      data-testid="button-save-doc-settings"
                    >
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                      Save Settings
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </>
  );
}

export const getServerSideProps: GetServerSideProps = async (ctx) => {
  return requireAdmin(ctx);
};
