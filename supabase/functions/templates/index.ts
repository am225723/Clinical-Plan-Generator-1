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
    const templateId = url.searchParams.get('id')

    if (req.method === 'GET') {
      if (templateId) {
        const { data: template, error } = await supabase
          .from('document_templates')
          .select('*')
          .eq('id', templateId)
          .eq('doctor_id', user.id)
          .single()

        if (error) throw error
        return new Response(JSON.stringify(template), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        })
      }

      const { data: templates, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('doctor_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      return new Response(JSON.stringify(templates || []), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'POST') {
      const { name, template_type, ai_prompt, pdf_config, is_default } = await req.json()

      if (!name || !template_type || !ai_prompt) {
        throw new Error('Name, template_type, and ai_prompt are required')
      }

      if (is_default) {
        await supabase
          .from('document_templates')
          .update({ is_default: false })
          .eq('doctor_id', user.id)
          .eq('template_type', template_type)
      }

      const { data: template, error } = await supabase
        .from('document_templates')
        .insert({
          doctor_id: user.id,
          name,
          template_type,
          ai_prompt,
          pdf_config: pdf_config || {},
          is_default: is_default || false,
        })
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(template), {
        status: 201,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'PUT') {
      if (!templateId) throw new Error('Template ID required')

      const { name, template_type, ai_prompt, pdf_config, is_default } = await req.json()

      if (is_default) {
        await supabase
          .from('document_templates')
          .update({ is_default: false })
          .eq('doctor_id', user.id)
          .eq('template_type', template_type)
      }

      const { data: template, error } = await supabase
        .from('document_templates')
        .update({
          name,
          template_type,
          ai_prompt,
          pdf_config: pdf_config || {},
          is_default: is_default || false,
          updated_at: new Date().toISOString(),
        })
        .eq('id', templateId)
        .eq('doctor_id', user.id)
        .select()
        .single()

      if (error) throw error
      return new Response(JSON.stringify(template), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    if (req.method === 'DELETE') {
      if (!templateId) throw new Error('Template ID required')

      const { error } = await supabase
        .from('document_templates')
        .delete()
        .eq('id', templateId)
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
