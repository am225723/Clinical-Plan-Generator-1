import Head from 'next/head';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useSupabase } from './_app';
import { requireAuth } from '@/lib/auth';
import { Profile, DoctorDocumentSettings } from '@/lib/supabase';
import { edgeFunctions } from '@/lib/edge-functions';
import { Loader2 } from 'lucide-react';
import { TemplateConfig } from '@/components/templates/template-config';
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

  useEffect(() => {
    loadSettings();
    loadTemplates();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    
    try {
      const data = await edgeFunctions.settings.get(supabase);
      if (data.doctorSettings) {
        setDoctorSettings(data.doctorSettings);
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    }

    setLoading(false);
  };

  const loadTemplates = async () => {
    try {
      const data = await edgeFunctions.templates.list(supabase);
      setTemplates(data);
    } catch (err) {
      console.error('Failed to load templates:', err);
    }
  };

  const handleSaveTemplate = async (template: DocumentTemplate) => {
    const isNew = !template.id || template.id === '' || template.id.startsWith('initial') || template.id.startsWith('soap') || template.id.startsWith('discharge');
    const templateData = {
      name: template.name,
      template_type: template.template_type,
      ai_prompt: template.ai_prompt,
      is_default: template.is_default,
      pdf_config: template.pdf_config,
    };

    if (isNew) {
      await edgeFunctions.templates.create(supabase, templateData);
    } else {
      await edgeFunctions.templates.update(supabase, template.id, templateData);
    }
    loadTemplates();
  };

  const handleLogoUpload = async (file: File) => {
    try {
      const data = await edgeFunctions.uploadLogo(supabase, { filename: file.name, contentType: file.type });

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
  };

  const handleSaveHeaderFooter = async (configs: {
    header: { text: string; alignment: 'left' | 'center' | 'right' };
    footer: { text: string; alignment: 'left' | 'center' | 'right' };
  }) => {
    const updatedSettings = {
      ...doctorSettings,
      header_config: configs.header,
      footer_config: configs.footer,
    };
    setDoctorSettings(updatedSettings);

    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      await supabase.from('doctor_document_settings').upsert({
        doctor_id: session.user.id,
        header_config: configs.header,
        footer_config: configs.footer,
        updated_at: new Date().toISOString(),
      });
    }
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
        headerConfig={(doctorSettings.header_config as { text: string; alignment: 'left' | 'center' | 'right' }) || { text: '', alignment: 'center' }}
        footerConfig={(doctorSettings.footer_config as { text: string; alignment: 'left' | 'center' | 'right' }) || { text: '', alignment: 'center' }}
        onSaveHeaderFooter={handleSaveHeaderFooter}
      />
    </>
  );
}

export const getServerSideProps = requireAuth;
