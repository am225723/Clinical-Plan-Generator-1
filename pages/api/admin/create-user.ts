import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { email, password, full_name } = req.body;

  if (!email || !full_name) {
    return res.status(400).json({ error: 'Email and full name are required' });
  }

  try {
    const generatedPassword = password || Math.random().toString(36).slice(-12) + 'Aa1!';

    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: generatedPassword,
      email_confirm: true,
      user_metadata: { full_name, role: 'doctor' }
    });

    if (createError) {
      throw createError;
    }

    return res.status(200).json({ 
      user: userData.user,
      message: 'User created successfully'
    });
  } catch (error: any) {
    console.error('Create user error:', error);
    return res.status(400).json({ error: error.message || 'Failed to create user' });
  }
}
