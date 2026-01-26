import type { Express } from "express";
import { createServer, type Server } from "http";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Generate treatment plan using AI
  app.post("/api/generate-treatment-plan", async (req, res) => {
    try {
      const { inputs } = req.body;
      
      if (!inputs) {
        return res.status(400).json({ error: "Clinical inputs are required" });
      }

      const prompt = `
Role: Expert Clinical Psychiatrist.
Task: Generate a structured mental health treatment plan JSON from the following raw inputs.

INPUTS:
- Intake: ${inputs.intake_form_data || "Not provided"}
- Session Transcript: ${inputs.session_transcripts || "Not provided"}
- Scores: ${inputs.assessment_scores || "Not provided"}
- Notes: ${inputs.provider_notes || "Not provided"}

REQUIREMENTS:
- Strictly follow the JSON structure provided below.
- Use professional clinical language.
- Infer missing data where reasonable based on context, or label as "Not documented".
- Diagnoses must include ICD-10 and DSM-5-TR codes.
- Treatment goals must be SMART.

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
  "labs": "string",
  "missing_data": ["string"]
}
`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are a helpful assistant that outputs JSON." },
          { role: "user", content: prompt }
        ],
        response_format: { type: "json_object" }
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const parsed = JSON.parse(content);
      res.json(parsed);

    } catch (error) {
      console.error("Error generating treatment plan:", error);
      res.status(500).json({ 
        error: "Failed to generate treatment plan",
        details: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  app.post("/api/refine-note", async (req, res) => {
    try {
      const { messages, noteContent } = req.body as {
        messages?: { role: "assistant" | "user"; content: string }[];
        noteContent?: string;
      };

      if (!Array.isArray(messages) || messages.length === 0) {
        return res.status(400).json({ error: "Conversation messages are required" });
      }

      const promptMessages = [
        {
          role: "system" as const,
          content:
            "You are a clinical documentation assistant. Reply with JSON that contains an assistantMessage and optional updatedContent. If the user explicitly asks to change the note, return updatedContent with the full revised note; otherwise set updatedContent to null.",
        },
        {
          role: "user" as const,
          content: `Current note content:\n${noteContent || "No note content provided."}`,
        },
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ];

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: promptMessages,
        response_format: { type: "json_object" },
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        throw new Error("No response from AI");
      }

      const parsed = JSON.parse(content) as {
        assistantMessage?: string;
        updatedContent?: string | null;
      };

      res.json({
        assistantMessage: parsed.assistantMessage || "Let me know how you'd like to adjust the note.",
        updatedContent: parsed.updatedContent ?? null,
      });
    } catch (error) {
      console.error("Error refining note:", error);
      res.status(500).json({
        error: "Failed to refine note",
        details: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return httpServer;
}
