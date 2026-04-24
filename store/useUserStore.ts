import { create } from 'zustand';
import { UserProfile } from '../types/database.types';

interface UserState {
  profile: UserProfile | null;
  isInitializing: boolean;  // true until auth state is first resolved
  disciplineScore: number;
  weeklyDisciplineScore: number;
  currentStreak: number;
  toastMessage: string | null;
  rivalId: string | null;
  rivalProfile: {
    username: string;
    tier: string;
    score: number;
  } | null;
  rankUpDetected: boolean;
  setRankUpDetected: (val: boolean) => void;
  setProfile: (profile: UserProfile & { avatar_url?: string | null }) => void;
  setInitializing: (val: boolean) => void;
  updateScoreAndStreak: (basePoints: number, difficultyMultiplier: number, streakUp: boolean) => void;
  showToast: (msg: string) => void;
  discoverRival: () => Promise<void>;
  setSquadMultiplier: (mult: number) => void;
  setActiveChallenge: (payload: Partial<UserState['activeChallenge']>) => void;
  resetStreak: () => void;
  deductPoints: (amount: number) => void;
}

import { rivalService } from '../services/rivalService';

export const useUserStore = create<UserState>((set, get) => ({
  profile: null,
  isInitializing: true,
  disciplineScore: 0,
  weeklyDisciplineScore: 0,
  currentStreak: 0,
  rivalId: null,
  rivalProfile: null,
  squadMultiplier: 1.0,
  activeChallenge: {
    challengeName: null,
    currentDay: 0,
    totalDays: 0,
    participantsRemain: 0,
    riskLevel: 'LOW',
  },
  rankUpDetected: false,
  toastMessage: null,
  
  setRankUpDetected: (val) => set({ rankUpDetected: val }),

  setInitializing: (val) => set({ isInitializing: val }),

  setProfile: (profile) => set({
    profile,
    disciplineScore: profile.discipline_score,
    weeklyDisciplineScore: profile.weekly_discipline_score ?? 0,
    currentStreak: profile.current_streak,
  }),

  updateScoreAndStreak: (basePoints, difficultyMultiplier, streakUp) => set((state) => {
    const streakBonus = Math.min(1.0 + (state.currentStreak * 0.05), 1.5);
    const scoreDelta = Math.round(basePoints * difficultyMultiplier * streakBonus * state.squadMultiplier);
    const oldScore = state.disciplineScore;
    const newScore = oldScore + scoreDelta;

    // Local tier check
    const getTier = (s: number) => {
      if (s >= 50000) return 'Archon';
      if (s >= 15000) return 'Oracle';
      if (s >= 5000) return 'Vanguard';
      if (s >= 1000) return 'Acolyte';
      return 'Novice';
    };

    const oldTier = getTier(oldScore);
    const newTier = getTier(newScore);

    return {
      disciplineScore: newScore,
      weeklyDisciplineScore: state.weeklyDisciplineScore + scoreDelta,
      currentStreak: streakUp ? state.currentStreak + 1 : state.currentStreak,
      globalRankTier: newTier,
      rankUpDetected: newTier !== oldTier ? true : state.rankUpDetected
    };
  }),

  setRivalInfo: (name, rank, diff) => set({ rivalName: name, rivalRank: rank, rivalDiff: diff }),
  setSquadMultiplier: (mult) => set({ squadMultiplier: mult }),
  setActiveChallenge: (payload) => set((state) => ({
    activeChallenge: { ...state.activeChallenge, ...payload },
  })),

  discoverRival: async () => {
    const { profile, rivalProfile } = get();
    if (!profile?.user_id) return;

    // Use current rival if already assigned but not loaded
    if (profile.rival_user_id && !rivalProfile) {
      const data = await rivalService.getRivalProfile(profile.rival_user_id);
      if (data) set({ 
        rivalId: data.rival_id, 
        rivalProfile: { username: data.username, tier: data.tier, score: data.score } 
      });
      return;
    }

    // Otherwise find a new one
    if (!profile.rival_user_id) {
      const data = await rivalService.findAndAssignRival(profile.user_id);
      if (data) {
        set({ 
          rivalId: data.rival_id,
          rivalProfile: { username: data.username, tier: data.tier, score: data.score },
          profile: { ...profile, rival_user_id: data.rival_id }
        });
      }
    }
  },
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => set({ toastMessage: null }), 4000);
  },
  resetStreak: () => set({ currentStreak: 0 }),
  deductPoints: (amount: number) => set((state) => ({
    disciplineScore: Math.max(0, state.disciplineScore - amount)
  })),
}));
