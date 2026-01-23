import type { NextApiRequest, NextApiResponse } from 'next';

const PERPLEXITY_API_URL = 'https://api.perplexity.ai/chat/completions';

const DETAIL_LEVEL_INSTRUCTIONS = {
  brief: 'Keep the response concise and focus only on essential elements.',
  standard: 'Provide a balanced, comprehensive treatment plan with appropriate detail.',
  detailed: 'Provide an extensive, highly detailed treatment plan with thorough explanations.',
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { 
      inputs, 
      patientData, 
      detailLevel = 'standard', 
      aiAdjustment = '', 
      appendMode = false,
      existingPlan = null,
      customPrompt = null 
    } = req.body;

    if (!inputs) {
      return res.status(400).json({ error: 'Clinical inputs are required' });
    }

    const basePrompt = customPrompt || `
Role: Expert Clinical Psychiatrist.
Task: Generate a structured mental health treatment plan JSON from the following raw inputs.

REQUIREMENTS:
- Strictly follow the JSON structure provided below.
- Use professional clinical language.
- Infer missing data where reasonable based on context, or label as "Not documented".
- Diagnoses must include ICD-10 and DSM-5-TR codes.
- Treatment goals must be SMART.
`;

    const detailInstruction = DETAIL_LEVEL_INSTRUCTIONS[detailLevel as keyof typeof DETAIL_LEVEL_INSTRUCTIONS] || DETAIL_LEVEL_INSTRUCTIONS.standard;

    let prompt = `${basePrompt}

DETAIL LEVEL: ${detailInstruction}

INPUTS:
- Intake: ${inputs.intake_form_data || 'Not provided'}
- Session Transcript: ${inputs.session_transcripts || 'Not provided'}
- Scores: ${inputs.assessment_scores || 'Not provided'}
- Notes: ${inputs.provider_notes || 'Not provided'}
`;

    if (aiAdjustment) {
      prompt += `
ADDITIONAL INSTRUCTIONS FROM PROVIDER:
${aiAdjustment}
`;
    }

    if (appendMode && existingPlan) {
      prompt += `
EXISTING PLAN TO APPEND TO:
${JSON.stringify(existingPlan, null, 2)}

Please enhance or add to the existing plan based on the new inputs.
`;
    }

    prompt += `
OUTPUT JSON FORMAT:
{
  "chief_complaint": "string",
  "hpi": "string (comprehensive narrative)",
  "psych_ros": ["string", "string"],
  "substance_use": ["string"],
  "psych_medical_history": "string",
  "current_meds": ["string"],
  "mse": ["string (Appearance: ...)", "string (Behavior: ...)"],
  "risk_assessment": { "level": "string", "justification": "string" },
  "diagnosis": [{ "code": "string", "name": "string", "type": "ICD-10" | "DSM-5-TR" }],
  "treatment_goals": [{ "goal": "string", "objectives": ["string"] }],
  "mdm": { "complexity": "string", "code": "string", "rationale": "string" },
  "psychotherapy_addon": "string",
  "prescription_plan": "string",
  "informed_consent": "string",
  "labs": "string"
}

IMPORTANT: Return ONLY valid JSON, no markdown code blocks or extra text.
`;

    const perplexityApiKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityApiKey) {
      return res.status(500).json({ error: 'Perplexity API key not configured' });
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
          { role: 'system', content: 'You are an expert clinical psychiatrist. Always output valid JSON only, with no markdown formatting or code blocks.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 4096,
        stream: false,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    let jsonContent = content.trim();
    if (jsonContent.startsWith('```json')) {
      jsonContent = jsonContent.slice(7);
    } else if (jsonContent.startsWith('```')) {
      jsonContent = jsonContent.slice(3);
    }
    if (jsonContent.endsWith('```')) {
      jsonContent = jsonContent.slice(0, -3);
    }
    jsonContent = jsonContent.trim();

    const parsed = JSON.parse(jsonContent);
    res.json(parsed);

  } catch (error) {
    console.error('Error generating treatment plan:', error);
    res.status(500).json({ 
      error: 'Failed to generate treatment plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
