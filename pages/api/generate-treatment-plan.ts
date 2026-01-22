import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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
`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: 'You are a helpful assistant that outputs JSON.' },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' }
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);
    res.json(parsed);

  } catch (error) {
    console.error('Error generating treatment plan:', error);
    res.status(500).json({ 
      error: 'Failed to generate treatment plan',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}
