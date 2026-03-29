import { create } from 'zustand';
import { MissionCompletion } from '../types/database.types';

interface MissionState {
  todayMissions: MissionCompletion[];
  setTodayMissions: (missions: MissionCompletion[]) => void;
  markMissionOptimistic: (completionId: string) => void;
  isStreakAtRisk: (dailyScoreEarned: number) => boolean;
}

export const useMissionStore = create<MissionState>((set, get) => ({
  todayMissions: [],
  setTodayMissions: (missions) => set({ todayMissions: missions }),
  markMissionOptimistic: (completionId) => set((state) => ({
    todayMissions: state.todayMissions.map(m => 
      m.completion_id === completionId ? { ...m, status: 'COMPLETED' } : m
    )
  })),
  isStreakAtRisk: (dailyScoreEarned: number) => {
    // Streak is maintained if completed all 3 categories OR daily score >= 60
    const m = get().todayMissions;
    const completed = m.filter(x => x.status === 'COMPLETED');
    const hasBody = completed.some(x => x.missions?.category === 'BODY');
    const hasMind = completed.some(x => x.missions?.category === 'MIND');
    const hasWork = completed.some(x => x.missions?.category === 'WORK');
    
    // If threshold met, streak is not at risk
    if (dailyScoreEarned >= 60) return false;
    
    // If all categories completed, streak is not at risk
    if (hasBody && hasMind && hasWork) return false;

    // Otherwise, and there are still incomplete missions, it is at risk
    return m.some(x => x.status === 'PENDING');
  }
}));
