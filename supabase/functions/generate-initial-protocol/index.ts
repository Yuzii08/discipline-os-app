// @ts-nocheck
// ══════════════════════════════════════════════════════════════
//  PROJECT GENESIS — Protocol Architect v2  (gemini-2.5-flash)
//  Edge Function: generate-initial-protocol
// ══════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── JSON Enforcement (Regex Trap) ──
function extractJsonArray(raw: string): any[] | null {
  const match = raw.match(/\[[\s\S]*\]/); // Robust regex trap for JSON array
  if (!match) return null;
  try {
    const parsed = JSON.parse(match[0]);
    if (!Array.isArray(parsed)) return null;
    return parsed;
  } catch {
    return null;
  }
}

// ── HARDCODED VANGUARD PROTOCOL ──
const HARDCODED_VANGUARD_PROTOCOL = [
  { order: 1, category: "BODY", title: "60-min Vanguard Workout — Run & Condition", duration: 60, logic: "Vanguard Protocol activated. Physical reset." },
  { order: 2, category: "MIND", title: "120-min Vanguard Deep Work", duration: 120, logic: "Vanguard Protocol activated. Deep cognitive focus." },
  { order: 3, category: "WORK", title: "120-min Vanguard Execution Block", duration: 120, logic: "Vanguard Protocol activated. Pure output." },
  { order: 4, category: "MIND", title: "Counter-Strike: Eliminate Distractions", duration: 0, logic: "Vanguard Protocol activated. Threat mitigated." }
];

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const {
    primaryObjective,
    userAims,
    disciplineLevel,
    biggestEnemy,
    allocation,
  } = await req.json().catch(() => ({}));

  // ── SECURITY: API key from environment only — never hardcoded ──
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    console.error("Critical: GEMINI_API_KEY not set in environment.");
    return new Response(
      JSON.stringify({ missions: HARDCODED_VANGUARD_PROTOCOL, _fallback: true, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  }

  // ── Allocation Math ──
  const mindPct = allocation?.mind ?? 40;
  const bodyPct = allocation?.body ?? 20;
  const workPct = allocation?.work ?? 40;
  const mindMins = Math.round((mindPct / 100) * 300);
  const bodyMins = Math.round((bodyPct / 100) * 300);
  const workMins = 300 - mindMins - bodyMins;

  // ── OPTIMIZED PROMPT FOR SPEED ──
  const prompt = `System: Performance Coach.
Task: Create a 4-5 mission daily schedule.
Goal: ${primaryObjective || "Elite Performance"}. Aims: ${userAims || "General"}. Challenge: ${biggestEnemy || "Distraction"}.
Budget: Exactly 300 minutes. 
Splits: BODY: ${bodyMins}m, MIND: ${mindMins}m, WORK: ${workMins}m.

Rules STRICTLY ENFORCED:
1. Practical titles ("Solve 15 Physics PYQs", "40-min run" - contextual to Goal/Aims).
2. Exactly 300 total mins (Body=${bodyMins}, Mind=${mindMins}, Work=${workMins}).
3. Order: Body -> Mind -> Work.
4. Add 1 final mission "Counter-Strike: [Tactic against Challenge]" (Category: MIND, duration: 0).
5. Math: Sum of durations MUST EQUAL EXACTLY 300. Body+Mind+Work = 300.

Output ONLY valid JSON array. Schema:
[{"order":1,"category":"BODY","title":"...","duration":60,"logic":"..."}]`;

  // ── API Call with Timeout ──
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 28000);

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 1000,
            responseMimeType: "application/json",
          },
        }),
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);

    if (!geminiRes.ok) {
      const errText = await geminiRes.text().catch(() => "unreadable");
      console.error("Gemini HTTP error:", geminiRes.status, errText);
      throw new Error("HTTP Error");
    }

    const geminiData = await geminiRes.json();
    const rawText = geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

    let missions = extractJsonArray(rawText);

    if (!missions || missions.length === 0) {
      throw new Error("JSON Array Extraction Failed");
    }

    // ── MATH GUARD STRICT VALIDATION ──
    let totalDuration = 0;
    for (const m of missions) {
      // Counter-Strike should be 0; all other tasks must be > 0.
      if (m.duration <= 0 && !m.title.toLowerCase().includes("counter-strike")) {
        throw new Error(`Math Guard Failure: Duration <= 0 for ${m.title}`);
      }
      totalDuration += (m.duration || 0);
    }
    
    if (totalDuration !== 300) {
      throw new Error(`Math Guard Failure: Total duration ${totalDuration} != 300`);
    }

    // Assign fallback valid order explicitly
    missions = missions
      .sort((a: any, b: any) => (a.order ?? 99) - (b.order ?? 99))
      .map((m: any, i: number) => ({ ...m, order: m.order ?? i + 1 }));

    // Success response
    return new Response(JSON.stringify({ missions, timestamp: new Date().toISOString() }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.warn("Protocol generation anomaly — Vanguard fallback engaged:", msg);
    
    // ── VANGUARD FALLBACK ──
    return new Response(
      JSON.stringify({ missions: HARDCODED_VANGUARD_PROTOCOL, _fallback: true, timestamp: new Date().toISOString() }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  }
});
