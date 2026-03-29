// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS headers for client requests
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { completion_id } = await req.json();
    
    // Initialize admin client to bypass RLS for secure, internal calculations
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Fetch mission metadata and the user's current streak
    const { data: completion, error: fetchErr } = await supabase
      .from('mission_completions')
      .select('*, users!inner(current_streak, user_id), missions!inner(difficulty, base_reward_points)')
      .eq('completion_id', completion_id)
      .single();

    if (fetchErr || !completion) throw new Error("Mission completion not found");

    const userId = completion.users.user_id;

    // 2. Calculate Scaled Score
    let streakMultiplier = 1.0;
    const streak = completion.users.current_streak;
    if (streak >= 7 && streak < 30) streakMultiplier = 1.1;
    if (streak >= 30 && streak < 90) streakMultiplier = 1.25;
    if (streak >= 90) streakMultiplier = 1.5;

    let diffMultiplier = 1.0;
    const diff = completion.missions.difficulty;
    if (diff === 'MEDIUM') diffMultiplier = 1.5;
    if (diff === 'HARD') diffMultiplier = 2.0;
    if (diff === 'ELITE') diffMultiplier = 3.0;

    const basePoints = completion.missions.base_reward_points;
    const finalScoreEarned = Math.round(basePoints * diffMultiplier * streakMultiplier);

    // 3. Update the Mission Completion Record
    await supabase.from('mission_completions')
      .update({ 
        status: 'COMPLETED', 
        points_earned: finalScoreEarned, 
        completed_at: new Date().toISOString() 
      })
      .eq('completion_id', completion_id);

    // 4. Increment the User's Total Score using an RPC (Postgres Function)
    const { data: newScore, error: rpcErr } = await supabase.rpc('increment_discipline_score', {
      user_id_param: userId,
      score_delta: finalScoreEarned
    });

    if (rpcErr) throw rpcErr;

    // 5. Fire and Forget: Trigger the AI Feedback Engine asynchronously
    // This allows the mobile client to get its response immediately without waiting for the LLM
    supabase.functions.invoke('trigger-ai-feedback', { body: { user_id: userId } });

    return new Response(
      JSON.stringify({ 
        success: true, 
        exactScoreDelta: finalScoreEarned, 
        newTotalScore: newScore 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
