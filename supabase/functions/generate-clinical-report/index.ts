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

    const { intakeText } = await req.json()

    if (!intakeText || typeof intakeText !== 'string') {
      throw new Error('Intake text is required')
    }

    const systemPrompt = `You are an expert Clinical Documentation AI. Your task is to process patient intake text and generate a comprehensive clinical report.

You MUST respond with valid JSON in this exact structure:
{
  "clinical_summary": "A concise, professional summary paragraph of the patient's current status, presenting problems, and relevant history.",
  "follow_up_questions": [
    "Question 1 about client demographics (name, DOB)",
    "Question 2 about therapy modality needed",
    "Question 3 about presenting problem/triggering event",
    "Question 4 about underlying factors (anxiety, depression, etc.)",
    "Question 5 about DSM-V/ICD-10 diagnosis information",
    "Question 6 about specific symptoms",
    "Question 7 about client's goals",
    "Question 8 about actionable steps toward goals",
    "Question 9 about timeline/target dates",
    "Question 10 about preferred interventions"
  ],
  "extended_report": {
    "patient_summary": "Expanded version of the clinical summary suitable for medical records.",
    "history_of_presenting_illness": "Detailed narrative of the chief complaint and its development over time.",
    "symptom_categorization": {
      "physical": ["Physical symptom 1", "Physical symptom 2"],
      "emotional": ["Emotional symptom 1", "Emotional symptom 2"],
      "cognitive": ["Cognitive symptom 1", "Cognitive symptom 2"]
    },
    "recommended_clinical_follow_up": [
      "Recommended next step 1",
      "Recommended next step 2"
    ]
  }
}

Generate targeted follow-up questions to gather missing information required for a formal Treatment Plan covering:
- Client Demographics (Name, Date of Birth)
- Therapy Modality (individual, couple, group)
- Presenting Problem (specific triggering event/issue)
- Reason for Treatment (underlying factors)
- Diagnosis (DSM-V/ICD-10 coding support)
- Symptoms (physical/emotional manifestations)
- Goals (what client wants to achieve)
- Actionable Steps (specific steps toward goals)
- Timeline (target dates)
- Interventions (medication, CBT, mindfulness, etc.)`

    const perplexityResponse = await fetch(PERPLEXITY_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'llama-3.1-sonar-large-128k-online',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Patient Intake Text:\n\n${intakeText}` }
        ],
        temperature: 0.3,
      }),
    })

    if (!perplexityResponse.ok) {
      const error = await perplexityResponse.text()
      throw new Error(`Perplexity API error: ${error}`)
    }

    const perplexityData = await perplexityResponse.json()
    const content = perplexityData.choices?.[0]?.message?.content || ''

    let result
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('No JSON found in response')
      }
    } catch {
      result = {
        clinical_summary: content,
        follow_up_questions: ['Unable to parse structured questions. Please review the intake text manually.'],
        extended_report: {
          patient_summary: content,
          history_of_presenting_illness: 'Unable to extract HPI from intake text.',
          symptom_categorization: {
            physical: [],
            emotional: [],
            cognitive: []
          },
          recommended_clinical_follow_up: ['Manual review recommended']
        }
      }
    }

    if (!result.clinical_summary) result.clinical_summary = ''
    if (!Array.isArray(result.follow_up_questions)) result.follow_up_questions = []
    if (!result.extended_report) {
      result.extended_report = {
        patient_summary: '',
        history_of_presenting_illness: '',
        symptom_categorization: { physical: [], emotional: [], cognitive: [] },
        recommended_clinical_follow_up: []
      }
    }
    if (!result.extended_report.symptom_categorization) {
      result.extended_report.symptom_categorization = { physical: [], emotional: [], cognitive: [] }
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
