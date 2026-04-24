import { supabase } from './supabase';
import { useMissionStore } from '../store/useMissionStore';
import { useUserStore } from '../store/useUserStore';


/**
 * Fetch daily pending/completed missions for a user.
 */
export const fetchTodayMissions = async (userId: string, date: string) => {
  try {
    // ── Pre-generation: Ensure daily completions exist ────────────────────────
    await supabase.rpc('generate_daily_completions', { p_user_id: userId });

    // ── Try real Supabase data first ──────────────────────────────────────────
    const { data, error } = await supabase
      .from('mission_completions' as any)
      .select(`
        completion_id,
        status,
        started_at,
        ended_at,
        is_grace_period,
        missions!inner (
          mission_id,
          title,
          category,
          difficulty,
          mission_type,
          task_goal,
          expected_duration_mins,
          base_reward_points
        )
      `)
      .eq('user_id', userId)
      .eq('target_date', date);

    if (error) throw error;

    useMissionStore.getState().setTodayMissions(data as any[]);
    return data;
    
  } catch (e) {
    console.warn('Supabase mission fetch failed:', e);
    useMissionStore.getState().setTodayMissions([]);
    return [];
  }
};


/**
 * Securely handles completing a mission, triggering optimistic UI locally
 * while verifying the exact score gain via an Edge Function.
 */
export const handleMissionComplete = async (completionId: string, basePoints: number, difficulty: string = 'EASY') => {
  const markOptimistic = useMissionStore.getState().markMissionOptimistic;
  const updateScore = useUserStore.getState().updateScoreAndStreak;

  const diffMap: Record<string, number> = {
    'EASY': 1.0,
    'MEDIUM': 1.5,
    'HARD': 2.0,
    'ELITE': 3.0
  };
  const diffMult = diffMap[difficulty] || 1.0;

  // 1. Optimistic UI Update (Instant Feedback)
  markOptimistic(completionId);
  updateScore(basePoints, diffMult, false);

  try {
    // 2. Call secure Edge Function logic.
    // In actual deployment, ensure the edge function is handling the security.
    const { data, error } = await supabase.functions.invoke('calculate-discipline-score', {
      body: { completion_id: completionId }
    });

    if (error) throw error;

    // 3. Sync exact state from server
    if (data?.exactScoreDelta) {
      useUserStore.setState({ disciplineScore: data.newTotalScore });
    }

  } catch (err) {
    // Silent fail — optimistic UI already applied. Score will re-sync on next launch.
    console.error('Failed to verify mission completion remotely:', err);
  }
};

