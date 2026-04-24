import { supabase } from './supabase';

export interface LeaderboardUser {
  user_id: string;
  username: string;
  discipline_score: number;
  global_rank_tier: string;
  current_streak: number;
  avatar_url: string | null;
}

export interface LeaderboardSquad {
  squad_id: string;
  name: string;
  motto: string | null;
  avatar_url: string | null;
  total_score: number;
  member_count: number;
}

export type TierTier = 'Novice' | 'Acolyte' | 'Vanguard' | 'Oracle' | 'Archon';

export const RANK_TIERS: { name: TierTier; min: number; color: string }[] = [
  { name: 'Archon', min: 50000, color: '#FFD700' }, // Gold
  { name: 'Oracle', min: 15000, color: '#E5E4E2' }, // Platinum/White
  { name: 'Vanguard', min: 5000, color: '#A8C69F' }, // Sage Green/Elite
  { name: 'Acolyte', min: 1000, color: '#F4A261' }, // Bronze/Orange
  { name: 'Novice', min: 0, color: '#8D99AE' },   // Slate/Grey
];

export const fetchGlobalTop = async (limit = 100): Promise<LeaderboardUser[]> => {
  const { data, error } = await supabase
    .from('users')
    .select('user_id, username, discipline_score, global_rank_tier, current_streak, avatar_url')
    .order('discipline_score', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data || [];
};

export const fetchSquadTop = async (limit = 50): Promise<LeaderboardSquad[]> => {
  const { data, error } = await supabase.rpc('get_squad_leaderboard');
  if (error) throw error;
  return (data || []).slice(0, limit);
};

export const getTierInfo = (score: number) => {
  const currentTier = RANK_TIERS.find(t => score >= t.min) || RANK_TIERS[RANK_TIERS.length - 1];
  const nextTierIdx = RANK_TIERS.findIndex(t => score >= t.min) - 1;
  const nextTier = nextTierIdx >= 0 ? RANK_TIERS[nextTierIdx] : null;

  let progress = 1;
  let remaining = 0;
  if (nextTier) {
    const range = nextTier.min - currentTier.min;
    const currentPos = score - currentTier.min;
    progress = Math.min(Math.max(currentPos / range, 0), 1);
    remaining = nextTier.min - score;
  }

  return { currentTier, nextTier, progress, remaining };
};
