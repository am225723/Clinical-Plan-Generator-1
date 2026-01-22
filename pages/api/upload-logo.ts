import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@/lib/supabase';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createServerClient({ req, res } as any);
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { filename, contentType } = req.body;

    if (!filename || !contentType) {
      return res.status(400).json({ error: 'Filename and content type are required' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const filePath = `${session.user.id}/${Date.now()}_${filename}`;

    const { data: signedData, error: signedError } = await supabaseAdmin.storage
      .from('logos')
      .createSignedUploadUrl(filePath);

    if (signedError) {
      throw signedError;
    }

    const { data: publicData } = supabaseAdmin.storage
      .from('logos')
      .getPublicUrl(filePath);

    return res.status(200).json({
      signedUrl: signedData.signedUrl,
      publicUrl: publicData.publicUrl,
      path: filePath
    });
  } catch (error: any) {
    console.error('Logo upload error:', error);
    return res.status(500).json({ error: error.message || 'Failed to generate upload URL' });
  }
}
