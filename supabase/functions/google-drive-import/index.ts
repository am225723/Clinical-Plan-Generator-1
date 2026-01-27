import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const extractFileName = (headers: Headers, fallback: string): string => {
  const disposition = headers.get('content-disposition') || ''
  const utfMatch = disposition.match(/filename\*=UTF-8''([^;]+)/)
  if (utfMatch?.[1]) return decodeURIComponent(utfMatch[1])
  const match = disposition.match(/filename="?([^"]+)"?/)
  return match?.[1] || fallback
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

    const { fileId } = await req.json()

    if (!fileId) {
      throw new Error('fileId is required')
    }

    const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`

    const response = await fetch(downloadUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })

    if (!response.ok) {
      throw new Error('Unable to fetch Google Drive file. Ensure sharing is set to anyone with the link.')
    }

    const contentType = response.headers.get('content-type') || 'application/octet-stream'
    const fileName = extractFileName(response.headers, `google-drive-${fileId}`)

    const arrayBuffer = await response.arrayBuffer()
    const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)))

    return new Response(JSON.stringify({
      data: base64,
      fileName,
      contentType
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
