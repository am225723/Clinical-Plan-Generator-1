import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!
    const perplexityApiKey = Deno.env.get('PERPLEXITY_API_KEY')

    if (!perplexityApiKey) {
      throw new Error('PERPLEXITY_API_KEY not configured')
    }

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

    const { messages, noteContent } = await req.json()

    const systemPrompt = `You are a helpful clinical documentation assistant. You are helping a psychiatrist refine a clinical note.

The current note content is:
---
${noteContent}
---

Based on the conversation, provide helpful suggestions and if appropriate, provide an updated version of the note.

Respond in JSON format:
{
  "assistantMessage": "Your response to the user's request",
  "updatedContent": "The updated note content if you made changes, or null if no changes were made"
}`

    const perplexityMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.map((m: { role: string; content: string }) => ({
        role: m.role,
        content: m.content
      }))
    ]

    const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: perplexityMessages,
        temperature: 0.3,
      }),
    })

    if (!perplexityResponse.ok) {
      const error = await perplexityResponse.text()
      throw new Error(`Perplexity API error: ${error}`)
    }

    const perplexityData = await perplexityResponse.json()
    const content = perplexityData.choices?.[0]?.message?.content || ''

    let result = { assistantMessage: content, updatedContent: null }
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      }
    } catch {
      result = { assistantMessage: content, updatedContent: null }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
