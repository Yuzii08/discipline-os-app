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
    const { goals, allocation, userContext } = await req.json();

    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

    const systemInstruction = `You are the Lead Protocol Architect. You are designing a life-operating system for a high-performing student.

User Context:
- Name: ${userContext?.name || 'User'}
- Age: ${userContext?.age || 'Unknown'}
- Interests: ${userContext?.interests || 'General'}

Task: Based on the user's goals, generate 3 daily 'Unbreakable Missions' (BODY, MIND, WORK).
Current Energy Allocation: BODY: ${allocation?.body || 33}%, MIND: ${allocation?.mind || 33}%, WORK: ${allocation?.work || 34}%
User's Stated Goals: "${goals || 'General elite performance'}"

Rules:
1. BODY: Must be achievable but challenging (e.g., '30m Mobility' or '100 Pushups').
2. MIND: Must focus on their primary study/learning goals.
3. WORK: High-impact execution related to their personal projects or core work.

Tone: Stoic, clinical, but encouraging.

Output ONLY a valid JSON array with NO markdown, exactly:
[
  {"category": "BODY", "title": "...", "duration": 30},
  {"category": "MIND", "title": "...", "duration": 60},
  {"category": "WORK", "title": "...", "duration": 45}
]`;

    const geminiPayload = {
      system_instruction: { parts: [{ text: systemInstruction }] },
      contents: [{ parts: [{ text: "Generate my initial protocol now. Output ONLY the JSON array, no markdown." }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 512 }
    };

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(geminiPayload),
      }
    );

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      throw new Error(`Gemini API returned ${geminiRes.status}: ${errBody}`);
    }

    const geminiData = await geminiRes.json();
    let rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? '[]';
    
    // First strip markdown
    let cleanText = rawText.replace(/```json/gi, '').replace(/```/g, '').trim();
    
    // Safety fallback: if Gemini puts explanatory text around the JSON array
    const jsonMatch = cleanText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
       cleanText = jsonMatch[0];
    }

    let missions = [];
    try {
      missions = JSON.parse(cleanText);
    } catch (e) {
      console.warn("Failed to parse Gemini output:", cleanText);
      // Fallback baseline protocol
      missions = [
        { "category": "BODY", "title": "100 Pushups", "duration": 30 },
        { "category": "MIND", "title": "Read 10 Pages", "duration": 30 },
        { "category": "WORK", "title": "Deep Work Block", "duration": 120 }
      ];
    }

    return new Response(
      JSON.stringify({ missions }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('Error generating protocol:', msg);
    return new Response(
      JSON.stringify({ error: msg }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
