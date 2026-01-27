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

    if (req.method === 'GET') {
      const { data: imports, error } = await supabase
        .from('calendar_imports')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return new Response(JSON.stringify(imports || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST') {
      const events = await req.json()

      if (!Array.isArray(events)) {
        throw new Error('Expected array of events')
      }

      const toInsert = events.map((evt: any) => ({
        doctor_id: user.id,
        uid: evt.uid,
        summary: evt.summary,
        location: evt.location,
        start_time: evt.startTime,
        end_time: evt.endTime,
      }))

      const { data: inserted, error } = await supabase
        .from('appointments')
        .upsert(toInsert.map((e: any) => ({
          doctor_id: user.id,
          external_uid: e.uid,
          patient_name: e.summary || 'Imported Event',
          appointment_type: 'Imported',
          location: e.location || 'Unknown',
          start_time: e.start_time,
          end_time: e.end_time,
          status: 'pending'
        })), { onConflict: 'external_uid' })
        .select()

      if (error) throw error

      return new Response(JSON.stringify({ imported: inserted?.length || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
