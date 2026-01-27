import type { NextApiRequest, NextApiResponse } from 'next';
import { randomUUID } from 'crypto';
import { createApiClient } from '@/lib/supabase-api';

const MAX_UPLOAD_BYTES = 25 * 1024 * 1024;

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '30mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createApiClient(req, res);
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

  const { data, fileName, fileType, contentType } = req.body || {};

  if (!data || !fileName || !fileType) {
    return res.status(400).json({ error: 'Missing transcription payload.' });
  }

  if (fileType !== 'audio' && fileType !== 'video') {
    return res.status(400).json({ error: 'Unsupported file type.' });
  }

  const buffer = Buffer.from(data, 'base64');
  if (buffer.length > MAX_UPLOAD_BYTES) {
    return res.status(413).json({ error: 'File exceeds maximum size.' });
  }

  const openaiKey = process.env.OPENAI_API_KEY;
  if (!openaiKey) {
    return res.status(500).json({ error: 'OPENAI_API_KEY not configured.' });
  }

  const jobId = randomUUID();
  const storagePath = `${session.user.id}/${jobId}/${fileName}`;

  const { error: insertError } = await supabase
    .from('transcription_jobs')
    .insert({
      id: jobId,
      doctor_id: session.user.id,
      storage_path: storagePath,
      file_name: fileName,
      file_type: fileType,
      status: 'processing',
    });

  if (insertError) {
    return res.status(500).json({ error: insertError.message });
  }

  const { error: uploadError } = await supabase.storage
    .from('clinical_documents')
    .upload(storagePath, buffer, {
      contentType: contentType || 'application/octet-stream',
      upsert: true,
    });

  if (uploadError) {
    await supabase
      .from('transcription_jobs')
      .update({ status: 'failed', error_message: uploadError.message })
      .eq('id', jobId);
    return res.status(500).json({ error: 'Unable to upload file.' });
  }

  try {
    const formData = new FormData();
    formData.append(
      'file',
      new Blob([buffer], { type: contentType || 'application/octet-stream' }),
      fileName
    );
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'text');

    const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${openaiKey}`,
      },
      body: formData,
    });

    if (!whisperResponse.ok) {
      const errorText = await whisperResponse.text();
      throw new Error(errorText || 'Whisper API error.');
    }

    const transcript = (await whisperResponse.text()).trim();

    const { error: updateError } = await supabase
      .from('transcription_jobs')
      .update({ status: 'completed', transcript })
      .eq('id', jobId);

    if (updateError) {
      return res.status(500).json({ error: updateError.message });
    }

    return res.status(200).json({ jobId, status: 'completed', transcript });
  } catch (error: any) {
    await supabase
      .from('transcription_jobs')
      .update({ status: 'failed', error_message: error.message || 'Transcription failed.' })
      .eq('id', jobId);
    return res.status(500).json({ jobId, status: 'failed', error: error.message || 'Transcription failed.' });
  }
}
