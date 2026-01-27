import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

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
    const jobId = url.searchParams.get('id')

    if (req.method === 'GET' && jobId) {
      const { data: job, error } = await supabase
        .from('transcription_jobs')
        .select('*')
        .eq('id', jobId)
        .eq('doctor_id', user.id)
        .single()

      if (error) throw error
      return new Response(JSON.stringify(job), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST') {
      const { fileName, fileType, contentType, data } = await req.json()

      if (!data || !fileName) {
        throw new Error('fileName and data are required')
      }

      const jobId = crypto.randomUUID()
      const adminClient = createClient(supabaseUrl, supabaseServiceKey)

      await adminClient
        .from('transcription_jobs')
        .insert({
          id: jobId,
          doctor_id: user.id,
          file_name: fileName,
          file_type: fileType,
          status: 'pending'
        })

      const openaiKey = Deno.env.get('OPENAI_API_KEY')
      if (!openaiKey) {
        await adminClient
          .from('transcription_jobs')
          .update({ status: 'failed', error: 'OPENAI_API_KEY not configured' })
          .eq('id', jobId)

        throw new Error('OPENAI_API_KEY not configured')
      }

      try {
        const binaryData = Uint8Array.from(atob(data), c => c.charCodeAt(0))
        const blob = new Blob([binaryData], { type: contentType || 'audio/webm' })

        const formData = new FormData()
        formData.append('file', blob, fileName)
        formData.append('model', 'whisper-1')
        formData.append('response_format', 'text')

        const whisperResponse = await fetch('https://api.openai.com/v1/audio/transcriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${openaiKey}`,
          },
          body: formData,
        })

        if (!whisperResponse.ok) {
          const errorText = await whisperResponse.text()
          throw new Error(`Whisper API error: ${errorText}`)
        }

        const transcript = await whisperResponse.text()

        await adminClient
          .from('transcription_jobs')
          .update({ status: 'completed', transcript })
          .eq('id', jobId)

        return new Response(JSON.stringify({ jobId, status: 'completed', transcript }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      } catch (transcribeError) {
        await adminClient
          .from('transcription_jobs')
          .update({ status: 'failed', error: transcribeError.message })
          .eq('id', jobId)

        return new Response(JSON.stringify({ jobId, status: 'failed', error: transcribeError.message }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }
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
