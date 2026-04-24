import { supabase } from './supabase';

export interface Habit {
  habit_id: string;
  user_id: string;
  title: string;
  category: 'BODY' | 'MIND' | 'WORK' | 'ROUTINE';
  icon: string;
  color: string;
  reward_points: number;
  schedule_time: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
}

export interface HabitCompletion {
  id: string;
  habit_id: string;
  user_id: string;
  target_date: string;
  completed_at: string | null;
  status: 'PENDING' | 'DONE' | 'SKIPPED';
  habits?: Habit;
}

/**
 * Call on app open — ensures today's habit_completions rows exist for all active habits.
 */
export const ensureTodayHabits = async (userId: string): Promise<void> => {
  await supabase.rpc('ensure_today_habit_completions', { p_user_id: userId });
};

/**
 * Fetch today's habit completions with joined habit data.
 */
export const fetchTodayHabits = async (
  userId: string,
  date: string
): Promise<HabitCompletion[]> => {
  try {
    await ensureTodayHabits(userId);

    const { data, error } = await supabase
      .from('habit_completions')
      .select(`
        id,
        habit_id,
        user_id,
        target_date,
        completed_at,
        status,
        habits!inner (
          habit_id,
          title,
          category,
          icon,
          color,
          reward_points,
          schedule_time,
          sort_order
        )
      `)
      .eq('user_id', userId)
      .eq('target_date', date)
      .order('habits(sort_order)', { ascending: true });

    if (error) throw error;
    return (data as HabitCompletion[]) || [];
  } catch (e) {
    console.warn('fetchTodayHabits failed:', e);
    return [];
  }
};

/**
 * Toggle a habit between DONE and PENDING.
 * Returns the new status.
 */
export const toggleHabitDone = async (
  userId: string,
  completionId: string,
  currentStatus: 'PENDING' | 'DONE' | 'SKIPPED',
  points: number
): Promise<{ status: 'PENDING' | 'DONE'; deltaApplied: number }> => {
  // 1. Fetch current status to prevent spam-click exploits
  const { data: currentData, error: fetchErr } = await supabase
    .from('habit_completions')
    .select('status')
    .eq('id', completionId)
    .single();

  if (fetchErr || !currentData) throw new Error('Could not verify habit state.');

  const dbStatus = currentData.status;
  const newStatus = dbStatus === 'DONE' ? 'PENDING' : 'DONE';
  const delta = newStatus === 'DONE' ? points : -points;

  // 2. Update only if the status hasn't changed (Optimistic Concurrency)
  const { data: updated, error: updateErr } = await supabase
    .from('habit_completions')
    .update({
      status: newStatus,
      completed_at: newStatus === 'DONE' ? new Date().toISOString() : null,
    })
    .eq('id', completionId)
    .eq('status', dbStatus)
    .select()
    .single();

  // If updateErr is PGRST116 (0 rows returned), it means a race condition happened
  if (updateErr || !updated) {
    console.warn("Multi-click detected, preventing point exploit.");
    return { status: dbStatus as 'PENDING' | 'DONE', deltaApplied: 0 };
  }

  // 3. Only increment score if the status ACTUALLY changed in the DB
  await supabase.rpc('increment_discipline_score', {
    user_id_param: userId,
    score_delta: delta,
  });

  return { status: newStatus, deltaApplied: delta };
};

/**
 * Create a new habit (recurring daily).
 */
export const createHabit = async (
  userId: string,
  params: {
    title: string;
    category: 'BODY' | 'MIND' | 'WORK' | 'ROUTINE';
    icon: string;
    color: string;
    reward_points: number;
    schedule_time?: string | null;
  }
): Promise<Habit | null> => {
  // Get current max sort_order
  const { data: existing } = await supabase
    .from('habits')
    .select('sort_order')
    .eq('user_id', userId)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single();

  const nextOrder = existing ? (existing as any).sort_order + 1 : 0;

  const { data, error } = await supabase
    .from('habits')
    .insert({
      user_id: userId,
      ...params,
      sort_order: nextOrder,
      is_active: true,
    })
    .select()
    .single();

  if (error) throw error;
  return data as Habit;
};

/**
 * Delete a habit and all its completions (cascade handles completions).
 */
export const deleteHabit = async (habitId: string): Promise<void> => {
  const { error } = await supabase
    .from('habits')
    .delete()
    .eq('habit_id', habitId);
  if (error) throw error;
};

/**
 * Toggle active/inactive for a habit.
 */
export const toggleHabitActive = async (
  habitId: string,
  isActive: boolean
): Promise<void> => {
  const { error } = await supabase
    .from('habits')
    .update({ is_active: !isActive })
    .eq('habit_id', habitId);
  if (error) throw error;
};

/**
 * Fetch all habits (for the manager screen).
 */
export const fetchAllHabits = async (userId: string): Promise<Habit[]> => {
  const { data, error } = await supabase
    .from('habits')
    .select('*')
    .eq('user_id', userId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return (data as Habit[]) || [];
};
