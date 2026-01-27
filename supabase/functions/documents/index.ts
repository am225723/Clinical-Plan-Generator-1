import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
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
    const documentId = url.searchParams.get('id')
    const search = url.searchParams.get('search')
    const limit = parseInt(url.searchParams.get('limit') || '50')
    const offset = parseInt(url.searchParams.get('offset') || '0')

    if (req.method === 'GET') {
      if (documentId) {
        const { data: doc, error } = await supabase
          .from('generated_documents')
          .select('*')
          .eq('id', documentId)
          .eq('doctor_id', user.id)
          .single()

        if (error) throw error
        return new Response(JSON.stringify(doc), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      let query = supabase
        .from('generated_documents')
        .select('*', { count: 'exact' })
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (search) {
        query = query.ilike('patient_name', `%${search}%`)
      }

      const { data: docs, count, error } = await query

      if (error) throw error
      return new Response(JSON.stringify({ documents: docs || [], total: count || 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST') {
      const body = await req.json()
      const { template_type, patient_name, client_id, date_of_service, generated_content, patient_data, clinical_inputs, status } = body

      const { data: doc, error } = await supabase
        .from('generated_documents')
        .insert({
          doctor_id: user.id,
          template_type,
          patient_name,
          client_id,
          date_of_service,
          generated_content,
          patient_data,
          clinical_inputs,
          status: status || 'draft',
        })
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(doc), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'PUT') {
      if (!documentId) throw new Error('Document ID required')

      const body = await req.json()

      const { data: doc, error } = await supabase
        .from('generated_documents')
        .update({
          ...body,
          updated_at: new Date().toISOString(),
        })
        .eq('id', documentId)
        .eq('doctor_id', user.id)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(doc), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'DELETE') {
      if (!documentId) throw new Error('Document ID required')

      const { error } = await supabase
        .from('generated_documents')
        .delete()
        .eq('id', documentId)
        .eq('doctor_id', user.id)

      if (error) throw error
      return new Response(JSON.stringify({ success: true }), {
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
