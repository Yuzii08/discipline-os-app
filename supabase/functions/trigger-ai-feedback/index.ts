// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper to reliably convert a URL/Base64 to a base64 string for Gemini
async function getBase64Image(dbString: string | null): Promise<string | null> {
  if (!dbString) return null;
  if (!dbString.startsWith('http')) {
    return dbString;
  }
  try {
    const resp = await fetch(dbString);
    if (!resp.ok) throw new Error("Failed to fetch image from Storage");
    const arrayBuffer = await resp.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  } catch (e) {
    console.error("Image grab failed:", e);
    return null;
  }
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { completionId, missionName, image_1, image_2 } = await req.json();

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    let start_raw = image_1;
    let end_raw = image_2;
    let timeContext = "";

    if (completionId) {
      const { data, error } = await supabase
        .from('mission_completions')
        .select('start_image_url, end_image_url, started_at')
        .eq('completion_id', completionId)
        .single();

      if (!error && data) {
        start_raw = data.start_image_url;
        end_raw = data.end_image_url;
        if (data.started_at) {
          const d = new Date(data.started_at);
          const timeString = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }) + ' UTC';
          timeContext = `The server recorded this mission starting at exactly ${timeString}. If the mission title implies a specific time constraint (e.g., 'Wake up at 5 AM' or '5 AM Routine'), YOU MUST verify if the visual evidence in the photo (like lighting, digital/analog clocks, or outdoor sky) supports this timestamp. If it is clearly bright daylight at a time it shouldn't be, or the evidence contradicts a morning wake-up, REJECT IT.`;
        }
      }
    }

    const b64_1 = await getBase64Image(start_raw);
    const b64_2 = await getBase64Image(end_raw);

    if (!b64_1) {
      return new Response(
        JSON.stringify({ verified: false, message: "CRITICAL BREACH: No Start Image registered. AI audit aborted.", score_multiplier: 0.0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    // ── SECURITY: API key from environment only — never hardcoded ──
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY not set — Judge bypassed');
      return new Response(
        JSON.stringify({ verified: true, message: "Judge offline. Protocol logged by bypass.", score_multiplier: 1.0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let prompt = "";
    let parts: any[] = [];

    if (b64_2) {
      prompt = `You are an elite, merciless Forensic Auditor called The Cold Judge. Your job is to rigorously verify if a user has completed their stated mission based on photographic evidence.

Mission Title: "${missionName || 'Unknown Mission'}"

You are provided with two images:
1. START Image (Phase 1)
2. FINISH Image (Phase 2)

STRICT EVALUATION RULES:
1. RELEVANCE: The images MUST clearly depict the subject matter of the mission. If the mission is "Read 20 Pages of Philosophy", the images MUST show a book, pages, or reading material. If the user uploads irrelevant photos (like a computer screen, a keyboard, a wall, a selfie, a room) that do not logically match the mission title, YOU MUST REJECT THEM instantly.
2. PROGRESS: There MUST be clear visual evidence of progress, effort, or a time delta between the START and FINISH images. If the images are identical, obviously taken seconds apart without work, or show no meaningful change related to the task, YOU MUST REJECT THEM.
3. CONTEXT: Be highly critical. Do not give the benefit of the doubt. If the evidence is weak or irrelevant to the mission title, reject it.

${timeContext}

Your single goal is to stop cheating, laziness, and fake uploads.

Tone: Clinical, harsh, and stoic. 

Respond ONLY with this exact JSON format (no markdown):
{"verified": true/false, "message": "Your short, ruthless verdict explaining why it passed or failed.", "score_multiplier": 1.0}`;
      parts = [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: b64_1 } },
        { text: "Above is START image. Below is FINISH image:" },
        { inlineData: { mimeType: "image/jpeg", data: b64_2 } }
      ];
    } else {
      prompt = `You are an elite, merciless Forensic Auditor called The Cold Judge. The user FAILED to provide a finish photo in time for their mission: "${missionName || 'Unknown Mission'}". 
They are undergoing a Lapsed Audit. You are evaluating ONLY their START photo to see if they at least began legitimately.

STRICT EVALUATION RULES:
1. RELEVANCE: Does this start photo clearly and undeniably depict the subject matter of the mission?
2. If the photo is irrelevant, fake, blank, or low effort, YOU MUST REJECT IT instantly.

${timeContext}

Let no fake photos pass.
Tone: Clinical, harsh, and stoic.

Respond ONLY with this exact JSON format (no markdown):
{"verified": true/false, "message": "Your short ruthless verdict. Timer lapsed.", "score_multiplier": 0.5}`;

      parts = [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: b64_1 } }
      ];
    }

    const geminiPayload = {
      contents: [{ parts }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 128 }
    };

    // ── Increased timeout: 25s (image analysis needs more time than text) ──
    const abortController = new AbortController();
    const timeout = setTimeout(() => abortController.abort(), 25000);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
        signal: abortController.signal
      }
    );

    clearTimeout(timeout);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => 'unreadable');
      console.error("Gemini API error:", geminiRes.status, errText);
      return new Response(
        JSON.stringify({ verified: true, message: "Judge offline. Protocol logged by bypass.", score_multiplier: 1.0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiRes.json();
    let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';

    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawText;

    let result: { verified: boolean; message: string; score_multiplier?: number };
    try {
      result = JSON.parse(jsonStr);
    } catch {
      result = { verified: true, message: "Effort registered by structural default.", score_multiplier: 1.0 };
    }

    if (result.score_multiplier === undefined) {
      result.score_multiplier = result.verified ? (b64_2 ? 1.0 : 0.5) : 0.0;
    }

    // Save the verdict permanently to the DB
    if (completionId) {
      await supabase
        .from('mission_completions')
        .update({ aar_verdict: result.message })
        .eq('completion_id', completionId);
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Judge Error:", msg);
    return new Response(
      JSON.stringify({ verified: false, message: "Judge systems overloaded: " + msg, score_multiplier: 0.0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
