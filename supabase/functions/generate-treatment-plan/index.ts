import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions'

const DETAIL_LEVEL_INSTRUCTIONS: Record<string, string> = {
  brief: 'Keep the response concise and focus only on essential elements.',
  standard: 'Provide a balanced, comprehensive treatment plan with appropriate detail.',
  detailed: 'Provide an extensive, highly detailed treatment plan with thorough explanations.',
}

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

    const { 
      inputs, 
      patientData, 
      detailLevel = 'standard', 
      customPrompt,
      appendMode,
      existingPlan,
      aiAdjustment 
    } = await req.json()

    const { data: appSettings } = await supabase
      .from('app_settings')
      .select('treatment_plan_prompt')
      .limit(1)
      .single()

    const basePrompt = customPrompt || appSettings?.treatment_plan_prompt || `You are a clinical documentation assistant helping a psychiatrist create a comprehensive treatment plan.

Based on the provided clinical information, generate a structured mental health treatment plan that includes:
1. Chief Complaint
2. History of Present Illness (HPI)
3. Mental Status Exam (MSE)
4. Risk Assessment with level and justification
5. Diagnosis with ICD-10 codes
6. Treatment Goals (SMART format)
7. Prescription Plan (if applicable)
8. Recommendations
9. Medical Decision Making documentation

Return the response as a valid JSON object with the following structure:
{
  "chief_complaint": "string",
  "hpi": "string",
  "mse": ["array of MSE findings"],
  "risk_assessment": { "level": "Low|Moderate|High", "justification": "string" },
  "diagnosis": [{ "code": "ICD-10 code", "name": "diagnosis name", "type": "Primary|Secondary" }],
  "treatment_goals": [{ "goal": "string", "objectives": ["array of objectives"] }],
  "prescription_plan": "string or null",
  "recommendations": "string",
  "medical_decision_making": "string"
}`

    const detailInstruction = DETAIL_LEVEL_INSTRUCTIONS[detailLevel] || DETAIL_LEVEL_INSTRUCTIONS.standard

    let clinicalContext = `Patient: ${patientData?.patient_name || 'Unknown'}
Date of Birth: ${patientData?.date_of_birth || 'Unknown'}
Date of Service: ${patientData?.date_of_service || new Date().toISOString().split('T')[0]}
Provider: ${patientData?.provider_name || 'Unknown'}
Appointment Type: ${patientData?.appointment_type || 'Follow-up'}

Clinical Information:
${inputs?.intake_form_data ? `Intake Data: ${inputs.intake_form_data}` : ''}
${inputs?.session_transcripts ? `Session Notes: ${inputs.session_transcripts}` : ''}
${inputs?.assessment_scores ? `Assessment Scores: ${inputs.assessment_scores}` : ''}
${inputs?.provider_notes ? `Provider Notes: ${inputs.provider_notes}` : ''}`

    if (appendMode && existingPlan) {
      clinicalContext += `\n\nExisting Treatment Plan to enhance:\n${JSON.stringify(existingPlan, null, 2)}`
    }

    if (aiAdjustment) {
      clinicalContext += `\n\nAdditional Instructions: ${aiAdjustment}`
    }

    const response = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { 
            role: 'system', 
            content: `${basePrompt}\n\n${detailInstruction}\n\nIMPORTANT: Return ONLY valid JSON. Do not include any text before or after the JSON object.` 
          },
          { 
            role: 'user', 
            content: clinicalContext 
          }
        ],
        temperature: 0.2,
        max_tokens: 4000,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Perplexity API error: ${errorText}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    let treatmentPlan
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        treatmentPlan = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      treatmentPlan = { raw_content: content, parse_error: parseError.message }
    }

    return new Response(JSON.stringify({
      success: true,
      treatment_plan: treatmentPlan,
      model: data.model,
      usage: data.usage
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
