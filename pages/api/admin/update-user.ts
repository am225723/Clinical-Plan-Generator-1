import type { NextApiRequest, NextApiResponse } from 'next';
import { createClient } from '@supabase/supabase-js';
import { createApiClient } from '@/lib/supabase-api';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

    if (!profile || profile.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden - admin access required' });
    }
  } catch (authError) {
    return res.status(401).json({ error: 'Authentication failed' });
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return res.status(500).json({ error: 'Server configuration error' });
  }

  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const { user_id, full_name, disabled } = req.body;

  if (!user_id) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .update({ 
        full_name,
        disabled: disabled ?? false
      })
      .eq('id', user_id);

    if (profileError) {
      throw profileError;
    }

    if (disabled !== undefined) {
      const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(user_id, {
        ban_duration: disabled ? '876000h' : 'none'
      });

      if (authError) {
        console.error('Auth update error:', authError);
      }
    }

    return res.status(200).json({ message: 'User updated successfully' });
  } catch (error: any) {
    console.error('Update user error:', error);
    return res.status(400).json({ error: error.message || 'Failed to update user' });
  }
}
