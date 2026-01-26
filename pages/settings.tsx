import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from './_app';
import { requireAuth } from '@/lib/auth';
import { Profile, DoctorDocumentSettings } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { TemplateConfig } from '@/components/templates/template-config';
import { BottomNav } from '@/components/ui/bottom-nav';
import { useToast } from '@/hooks/use-toast';

interface DocumentTemplate {
  id: string;
  name: string;
  template_type: string;
  ai_prompt: string;
  pdf_config: any;
  is_default: boolean;
}

interface SettingsPageProps {
  user: any;
  profile: Profile;
}

export default function SettingsPage({ user, profile }: SettingsPageProps) {
  const { supabase } = useSupabase();
  const router = useRouter();
  const { toast } = useToast();
  
  const [doctorSettings, setDoctorSettings] = useState<Partial<DoctorDocumentSettings>>({
    logo_url: '',
    header_config: { text: '', alignment: 'center' },
    footer_config: { text: '', alignment: 'center' },
    patient_field_layout: { order: ['patient_name', 'client_id', 'date_of_birth', 'date_of_service', 'provider_name'] },
    pdf_style: { font_size: 12, font_family: 'Arial' },
  });
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [headerTitle, setHeaderTitle] = useState('');

  useEffect(() => {
    loadSettings();
    loadTemplates();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/settings/get');
      const data = await response.json();

      if (data.doctorSettings) {
        setDoctorSettings(data.doctorSettings);
        setHeaderTitle(data.doctorSettings.header_config?.text || '');
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }

    setLoading(false);
  };

  const loadTemplates = async () => {
    try {
      const response = await fetch('/api/templates');
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleSaveTemplate = async (template: DocumentTemplate) => {
    const isNew = !template.id || template.id === '' || template.id.startsWith('initial') || template.id.startsWith('soap') || template.id.startsWith('discharge');
    const method = isNew ? 'POST' : 'PUT';
    const url = isNew ? '/api/templates' : `/api/templates/${template.id}`;

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: template.name,
        template_type: template.template_type,
        ai_prompt: template.ai_prompt,
        is_default: template.is_default,
        pdf_config: template.pdf_config,
      }),
    });

    if (!response.ok) throw new Error('Failed to save template');
    loadTemplates();
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const response = await fetch('/api/upload-logo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: file.name, contentType: file.type })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get upload URL');
      }

      const uploadResponse = await fetch(data.signedUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file,
      });

      if (!uploadResponse.ok) throw new Error('Upload failed');

      setDoctorSettings({ ...doctorSettings, logo_url: data.publicUrl });
      
      await fetch('/api/settings/set', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: 'doctor', 
          settings: { ...doctorSettings, logo_url: data.publicUrl } 
        })
      });

      toast({ title: 'Uploaded', description: 'Logo uploaded successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  };

  const handleHeaderTitleChange = async (title: string) => {
    setHeaderTitle(title);
    const updatedSettings = {
      ...doctorSettings,
      header_config: { ...doctorSettings.header_config, text: title }
    };
    setDoctorSettings(updatedSettings);
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
        <title>Template Config | GoldStandard Clinical</title>
      </Head>
      <TemplateConfig
        templates={templates}
        onSave={handleSaveTemplate}
        onBack={() => router.push('/doctor')}
        logoUrl={doctorSettings.logo_url || undefined}
        onLogoUpload={handleLogoUpload}
      />
    </>
  );
}

export const getServerSideProps = requireAuth;
