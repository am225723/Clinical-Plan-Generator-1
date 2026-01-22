// Supabase Edge Function for Document Processing (OCR/Transcription)
// Deploy with: supabase functions deploy process-document
//
// This edge function handles:
// 1. OCR for PDF/image documents
// 2. Audio transcription
//
// You'll need to set up OpenAI API key in your Supabase secrets:
// supabase secrets set OPENAI_API_KEY=sk-your-key

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { path, type } = await req.json();

    if (!path || !type) {
      return new Response(
        JSON.stringify({ error: "Missing path or type parameter" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from("clinical_documents")
      .download(path);

    if (downloadError) {
      return new Response(
        JSON.stringify({ error: `Failed to download file: ${downloadError.message}` }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openaiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let resultText = "";

    if (type === "transcribe") {
      // Audio transcription using Whisper
      const formData = new FormData();
      formData.append("file", fileData, path.split("/").pop() || "audio.webm");
      formData.append("model", "whisper-1");
      formData.append("response_format", "text");

      const whisperResponse = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
        },
        body: formData,
      });

      if (!whisperResponse.ok) {
        const errorText = await whisperResponse.text();
        throw new Error(`Whisper API error: ${errorText}`);
      }

      resultText = await whisperResponse.text();

    } else if (type === "ocr") {
      // For PDF/image OCR, convert to base64 and use GPT-4 Vision
      const arrayBuffer = await fileData.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
      
      // Determine mime type from file extension
      const extension = path.split(".").pop()?.toLowerCase();
      let mimeType = "application/pdf";
      if (extension === "png") mimeType = "image/png";
      else if (extension === "jpg" || extension === "jpeg") mimeType = "image/jpeg";
      else if (extension === "gif") mimeType = "image/gif";
      else if (extension === "webp") mimeType = "image/webp";

      const visionResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${openaiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Please extract and transcribe all text from this document. Preserve the structure and formatting as much as possible. If this is a clinical document, pay special attention to patient information, dates, diagnoses, and treatment notes.",
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:${mimeType};base64,${base64}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 4096,
        }),
      });

      if (!visionResponse.ok) {
        const errorText = await visionResponse.text();
        throw new Error(`Vision API error: ${errorText}`);
      }

      const visionData = await visionResponse.json();
      resultText = visionData.choices[0]?.message?.content || "No text extracted";
    }

    return new Response(
      JSON.stringify({ text: resultText, path }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error processing document:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
