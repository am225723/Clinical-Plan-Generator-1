import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !['doctor', 'admin'].includes(profile.role)) {
      throw new Error('Access denied')
    }

    const [statsResult, icdResult] = await Promise.all([
      supabase
        .from('doctor_dashboard_stats')
        .select('pending_notes_count, documents_this_week, documents_this_month')
        .eq('doctor_id', user.id)
        .maybeSingle(),
      supabase.rpc('get_top_icd_codes', {
        p_doctor_id: user.id,
        p_limit: 5
      })
    ])

    const stats = statsResult.data || { pending_notes_count: 0, documents_this_week: 0, documents_this_month: 0 }
    const topIcdCodes = (icdResult.data || []).map((row: any) => ({
      code: row.icd_code,
      description: row.description || row.icd_code,
      count: row.usage_count
    }))

    return new Response(JSON.stringify({
      pending_notes_count: stats.pending_notes_count || 0,
      documents_this_week: stats.documents_this_week || 0,
      documents_this_month: stats.documents_this_month || 0,
      top_icd_codes: topIcdCodes
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
