import type { NextApiRequest, NextApiResponse } from 'next';
import { createServerClient } from '@/lib/supabase';

const extractFileName = (response: Response, fallback: string) => {
  const disposition = response.headers.get('content-disposition') || '';
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/);
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1]);
  const match = disposition.match(/filename="?([^"]+)"?/);
  return match?.[1] || fallback;
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createServerClient({ req, res } as any);
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single();

  if (!profile || (profile.role !== 'doctor' && profile.role !== 'admin')) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const { fileId } = req.body as { fileId?: string };

  if (!fileId) {
    return res.status(400).json({ error: 'fileId is required' });
  }

  try {
    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
    const response = await fetch(downloadUrl);
    if (!response.ok) {
      throw new Error('Unable to fetch Google Drive file. Ensure sharing is set to anyone with the link.');
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream';
    const fileName = extractFileName(response, `google-drive-${fileId}`);
    const arrayBuffer = await response.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    return res.status(200).json({
      fileName,
      contentType,
      data: base64,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Unable to import Google Drive file' });
  }
}
