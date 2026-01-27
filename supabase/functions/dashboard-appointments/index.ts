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

    const url = new URL(req.url)
    const date = url.searchParams.get('date') || new Date().toISOString().split('T')[0]

    const startOfDay = `${date}T00:00:00.000Z`
    const endOfDay = `${date}T23:59:59.999Z`

    const { data: appointments, error } = await supabase
      .from('appointments')
      .select(`
        id,
        start_time,
        end_time,
        patient_name,
        appointment_type,
        location,
        status,
        has_flag,
        attached_note,
        document_id
      `)
      .eq('doctor_id', user.id)
      .gte('start_time', startOfDay)
      .lte('start_time', endOfDay)
      .order('start_time', { ascending: true })

    if (error) throw error

    const formatted = (appointments || []).map((apt: any) => {
      const time = new Date(apt.start_time)
      const hours = time.getHours()
      const minutes = time.getMinutes().toString().padStart(2, '0')
      const period = hours >= 12 ? 'PM' : 'AM'
      const displayHour = hours % 12 || 12

      return {
        id: apt.id,
        time: `${displayHour}:${minutes}`,
        period,
        patientName: apt.patient_name || 'Unknown Patient',
        appointmentType: apt.appointment_type || 'General',
        location: apt.location || 'Office',
        status: apt.status || 'pending',
        hasFlag: apt.has_flag || false,
        attachedNote: apt.attached_note,
        documentId: apt.document_id
      }
    })

    return new Response(JSON.stringify(formatted), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
