import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { useUserStore } from '../store/useUserStore';

/**
 * Hook to keep the user's score and streak perfectly in sync
 * utilizing Supabase Realtime across the 'users' table.
 */
export const useRealtimeScore = (userId: string | undefined) => {
  useEffect(() => {
    if (!userId) return;

    // Listen to changes in the 'users' table restricted to this specific userId
    const channel = supabase
      .channel('public:users')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'users',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newScore = payload.new.discipline_score;
          const newStreak = payload.new.current_streak;
          
          // Silently sync exact server score to local Zustand state.
          // Because the UI is hooked to Zustand, this forces a re-render
          // with the perfectly accurate new totals calculated by the Edge Function
          useUserStore.setState({ 
            disciplineScore: newScore,
            currentStreak: newStreak
          });
        }
      )
      .subscribe();

    return () => { 
      supabase.removeChannel(channel); 
    };
  }, [userId]);
};
