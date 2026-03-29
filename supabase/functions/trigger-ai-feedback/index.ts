// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { image_1, image_2, missionName } = await req.json();

    if (!image_1) {
      return new Response(
        JSON.stringify({ verified: false, message: "CRITICAL BREACH: No Start Image registered. AI audit aborted.", score_multiplier: 0.0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured");

    let prompt = "";
    let parts: any[] = [];

    if (image_2) {
      // TWO IMAGES (Standard Exit Phase)
      prompt = `You are an elite, merciless Forensic Auditor called The Cold Judge. Your job is to rigorously verify if a user has completed their stated mission based on photographic evidence.

Mission Title: "${missionName || 'Unknown Mission'}"

You are provided with two images:
1. START Image (Phase 1)
2. FINISH Image (Phase 2)

STRICT EVALUATION RULES:
1. RELEVANCE: The images MUST clearly depict the subject matter of the mission. If the mission is "Read 20 Pages of Philosophy", the images MUST show a book, pages, or reading material. If the user uploads irrelevant photos (like a computer screen, a keyboard, a wall, a generic selfie, a room) that do not logically match the mission title, YOU MUST REJECT THEM instantly.
2. PROGRESS: There MUST be clear visual evidence of progress, effort, or a time delta between the START and FINISH images. If the images are identical, obviously taken seconds apart without work, or show no meaningful change related to the task, YOU MUST REJECT THEM.
3. CONTEXT: Be highly critical. Do not give the benefit of the doubt. If the evidence is weak or irrelevant to the mission title, reject it.

Your single goal is to stop cheating, laziness, and fake uploads.

Tone: Clinical, harsh, and stoic. 

Respond ONLY with this exact JSON format (no markdown):
{"verified": true/false, "message": "Your short, ruthless verdict explaining why it passed or failed.", "score_multiplier": 1.0}`;
      parts = [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: image_1 } },
        { text: "Above is START image. Below is FINISH image:" },
        { inlineData: { mimeType: "image/jpeg", data: image_2 } }
      ];
    } else {
      // ONE IMAGE (Grace Timer Expired / Lapsed Audit)
      prompt = `You are an elite, merciless Forensic Auditor called The Cold Judge. The user FAILED to provide a finish photo in time for their mission: "${missionName || 'Unknown Mission'}". 
They are undergoing a Lapsed Audit. You are evaluating ONLY their START photo to see if they at least began legitimately.

STRICT EVALUATION RULES:
1. RELEVANCE: Does this start photo clearly and undeniably depict the subject matter of the mission? Example: If the mission is "Read", this photo MUST be a book or reading material. If it is a picture of a PC, a random room, a wall, or a face, it is completely irrelevant.
2. If the photo is irrelevant, fake, blank, or low effort, YOU MUST REJECT IT instantly.

Your goal is to stop cheating. Let no fake photos pass.
Tone: Clinical, harsh, and stoic.

Respond ONLY with this exact JSON format (no markdown):
{"verified": true/false, "message": "Your short ruthless verdict. Timer lapsed.", "score_multiplier": 0.5}`;
      
      parts = [
        { text: prompt },
        { inlineData: { mimeType: "image/jpeg", data: image_1 } }
      ];
    }

    const geminiPayload = {
      contents: [{ parts }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 128 }
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(geminiPayload),
      }
    );

    if (!geminiRes.ok) {
      console.error("Gemini API error:", geminiRes.status, await geminiRes.text());
      return new Response(
        JSON.stringify({ verified: true, message: "Judge offline. Protocol logged.", score_multiplier: 1.0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiRes.json();
    let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '';
    
    // Extract JSON
    rawText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    const jsonMatch = rawText.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawText;

    let result: { verified: boolean; message: string; score_multiplier?: number };
    try {
      result = JSON.parse(jsonStr);
    } catch {
      result = { verified: true, message: "Effort registered by default.", score_multiplier: 1.0 };
    }

    // Default missing multiplier
    if (result.score_multiplier === undefined) {
       result.score_multiplier = result.verified ? (image_2 ? 1.0 : 0.5) : 0.0;
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("Judge Error:", msg);
    return new Response(
      JSON.stringify({ verified: false, message: "System error: " + msg, score_multiplier: 0.0 }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  }
});
