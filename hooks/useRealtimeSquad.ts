import { useEffect } from 'react';
import { supabase } from '../services/supabase';
import { Alert } from 'react-native';

export const useRealtimeSquadActivity = (squadId: string) => {
  useEffect(() => {
    if (!squadId) return;

    // Listen to changes in mission_completions filtered by this user's squad
    const channel = supabase
      .channel(`squad_${squadId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'mission_completions',
          // Note: RLS must allow seeing squad mates' completions, 
          // or a denormalized squad_id column must exist on mission_completions
          filter: `squad_id=eq.${squadId}` 
        },
        (payload) => {
          if (payload.new.status === 'COMPLETED') {
            console.log('Teammate completed a mission!', payload.new);
            // In a real app we'd dispatch to Zustand here to show a toast
            Alert.alert("Squad Update", "A teammate just crushed a mission!");
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [squadId]);
};
