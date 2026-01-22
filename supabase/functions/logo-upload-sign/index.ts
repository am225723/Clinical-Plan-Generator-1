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
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      throw new Error('No authorization header')
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    })

    const { data: { user } } = await supabaseClient.auth.getUser()
    if (!user) {
      throw new Error('Not authenticated')
    }

    const { filename, contentType } = await req.json()

    if (!filename) {
      throw new Error('filename is required')
    }

    const timestamp = Date.now()
    const ext = filename.split('.').pop() || 'png'
    const path = `doctor/${user.id}/logo-${timestamp}.${ext}`

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    const { data: signedData, error: signError } = await supabaseAdmin.storage
      .from('logos')
      .createSignedUploadUrl(path)

    if (signError) {
      throw signError
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/logos/${path}`

    await supabaseAdmin
      .from('doctor_document_settings')
      .upsert({
        doctor_id: user.id,
        logo_url: publicUrl,
        updated_at: new Date().toISOString()
      })

    return new Response(
      JSON.stringify({
        signedUrl: signedData.signedUrl,
        path,
        publicUrl
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
