import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // ── Auth: extract JWT ──────────────────────────────────────────────────────
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // ── Identify user ──────────────────────────────────────────────────────────
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Read optional target_date from body ────────────────────────────────────
    const body = await req.json().catch(() => ({}));
    const targetDate = body.target_date || new Date().toLocaleDateString("en-CA");

    // ── Fetch today's mission completions ──────────────────────────────────────
    const { data: completions, error: dbError } = await supabase
      .from("mission_completions")
      .select("status, points_earned, missions(title, category, base_reward_points, expected_duration_mins)")
      .eq("user_id", user.id)
      .eq("target_date", targetDate);

    if (dbError) throw dbError;

    if (!completions || completions.length === 0) {
      return new Response(
        JSON.stringify({ error: "No missions found for today. Run your Genesis Protocol first." }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // ── Aggregate stats ────────────────────────────────────────────────────────
    const total = completions.length;
    const completed = completions.filter((c: any) => c.status === "COMPLETED");
    const failed = completions.filter((c: any) => c.status === "FAILED");
    const pending = completions.filter((c: any) => c.status === "PENDING");
    const completionRate = Math.round((completed.length / total) * 100);
    const totalPointsEarned = completed.reduce((sum: number, c: any) => sum + (c.points_earned || 0), 0);
    const totalPointsPossible = completions.reduce(
      (sum: number, c: any) => sum + ((c.missions as any)?.base_reward_points || 0),
      0
    );

    // Per-category breakdown
    const categories = ["BODY", "MIND", "WORK"];
    const categoryStats = categories.map((cat) => {
      const catMissions = completions.filter((c: any) => (c.missions as any)?.category === cat);
      const catCompleted = catMissions.filter((c: any) => c.status === "COMPLETED").length;
      return { category: cat, total: catMissions.length, completed: catCompleted };
    });

    // Identify strongest and weakest domains
    const scored = categoryStats.filter((c) => c.total > 0).map((c) => ({
      ...c,
      rate: c.total > 0 ? (c.completed / c.total) : 0,
    }));
    const strongest = scored.sort((a, b) => b.rate - a.rate)[0];
    const weakest = scored.sort((a, b) => a.rate - b.rate)[0];

    const missionLog = completions.map((c: any) => ({
      title: (c.missions as any)?.title || "Unknown",
      category: (c.missions as any)?.category || "?",
      status: c.status,
      earned: c.points_earned || 0,
    }));

    // ── Build Gemini prompt ────────────────────────────────────────────────────
    const systemInstruction = `You are THE VANGUARD COMMANDER — a cold, surgical AI that delivers military-style After Action Reports.
You never encourage mediocrity. You are brutal when the operator fails, and brief when they succeed.
Your tone: clinical, precise, minimal. No fluff. No platitudes.
You speak in short sentences. Max 4-5 sentences. End with one tactical directive for tomorrow.
Format your output in plain text. NO markdown, NO lists, NO headers. Just tight, punchy paragraphs.`;

    const userPrompt = `AFTER ACTION REPORT — ${targetDate}

OPERATOR STATS:
- Operations Total: ${total}
- Completed: ${completed.length} | Failed: ${failed.length} | Pending: ${pending.length}
- Completion Rate: ${completionRate}%
- Points Secured: ${totalPointsEarned} / ${totalPointsPossible} possible
- Strongest Domain: ${strongest?.category || "NONE"} (${strongest ? Math.round(strongest.rate * 100) : 0}%)
- Weakest Domain: ${weakest?.category || "NONE"} (${weakest ? Math.round(weakest.rate * 100) : 0}%)

MISSION LOG:
${missionLog.map((m) => `[${m.status}] ${m.category} — ${m.title} (+${m.earned} pts)`).join("\n")}

Deliver the After Action Report. Be brutal if they failed. Be cold if they succeeded. End with one tactical directive for tomorrow.`;

    // ── Call Gemini 2.5 Flash ──────────────────────────────────────────────────
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) throw new Error("GEMINI_API_KEY not configured.");

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: "user", parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 400,
          },
        }),
      }
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      throw new Error(`Gemini API error: ${geminiRes.status} — ${errText}`);
    }

    const geminiData = await geminiRes.json();
    const debrief =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ||
      "Operator data insufficient for full analysis. Secure your operations log and resubmit.";

    // ── Return structured AAR ──────────────────────────────────────────────────
    return new Response(
      JSON.stringify({
        date: targetDate,
        stats: {
          total,
          completed: completed.length,
          failed: failed.length,
          pending: pending.length,
          completionRate,
          pointsEarned: totalPointsEarned,
          pointsPossible: totalPointsPossible,
          categoryBreakdown: categoryStats,
        },
        debrief,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("AAR Error:", err);
    return new Response(JSON.stringify({ error: err.message || "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
