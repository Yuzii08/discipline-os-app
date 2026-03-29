import { create } from 'zustand';
import { UserProfile } from '../types/database.types';

interface UserState {
  profile: UserProfile | null;
  isInitializing: boolean;  // true until auth state is first resolved
  disciplineScore: number;
  weeklyDisciplineScore: number;
  currentStreak: number;
  rivalName: string | null;
  rivalRank: string | null;
  rivalDiff: number;
  squadMultiplier: number;
  activeChallenge: {
    challengeName: string | null;
    currentDay: number;
    totalDays: number;
    participantsRemain: number;
    riskLevel: 'LOW' | 'HIGH' | 'CRITICAL';
  };
  toastMessage: string | null;
  setProfile: (profile: UserProfile) => void;
  setInitializing: (val: boolean) => void;
  updateScoreAndStreak: (basePoints: number, difficultyMultiplier: number, streakUp: boolean) => void;
  showToast: (msg: string) => void;
  setRivalInfo: (name: string, rank: string, diff: number) => void;
  setSquadMultiplier: (mult: number) => void;
  setActiveChallenge: (payload: Partial<UserState['activeChallenge']>) => void;
  resetStreak: () => void;
  deductPoints: (amount: number) => void;
}

export const useUserStore = create<UserState>((set) => ({
  profile: null,
  isInitializing: true,
  disciplineScore: 0,
  weeklyDisciplineScore: 0,
  currentStreak: 0,
  rivalName: null,
  rivalRank: null,
  rivalDiff: 0,
  squadMultiplier: 1.0,
  activeChallenge: {
    challengeName: null,
    currentDay: 0,
    totalDays: 0,
    participantsRemain: 0,
    riskLevel: 'LOW',
  },
  toastMessage: null,

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
    return {
      disciplineScore: state.disciplineScore + scoreDelta,
      weeklyDisciplineScore: state.weeklyDisciplineScore + scoreDelta,
      currentStreak: streakUp ? state.currentStreak + 1 : state.currentStreak,
    };
  }),

  setRivalInfo: (name, rank, diff) => set({ rivalName: name, rivalRank: rank, rivalDiff: diff }),
  setSquadMultiplier: (mult) => set({ squadMultiplier: mult }),
  setActiveChallenge: (payload) => set((state) => ({
    activeChallenge: { ...state.activeChallenge, ...payload },
  })),
  showToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => set({ toastMessage: null }), 4000);
  },
  resetStreak: () => set({ currentStreak: 0 }),
  deductPoints: (amount: number) => set((state) => ({
    disciplineScore: Math.max(0, state.disciplineScore - amount)
  })),
}));
