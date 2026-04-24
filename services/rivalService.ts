import { supabase } from './supabase';

export interface RivalDetails {
  rival_id: string;
  username: string;
  tier: string;
  score: number;
}

export const rivalService = {
  /**
   * Finds and assigns a rival for the user based on score proximity.
   */
  async findAndAssignRival(userId: string): Promise<RivalDetails | null> {
    const { data, error } = await supabase.rpc('find_and_assign_rival', {
      p_user_id: userId
    });

    if (error) {
      console.error('Error assigning rival:', error);
      return null;
    }

    return data as RivalDetails;
  },

  /**
   * Fetches the current rival's profile details.
   */
  async getRivalProfile(rivalId: string): Promise<RivalDetails | null> {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, username, global_rank_tier, discipline_score')
      .eq('user_id', rivalId)
      .single();

    if (error || !data) return null;

    return {
      rival_id: data.user_id,
      username: data.username,
      tier: data.global_rank_tier,
      score: data.discipline_score
    };
  }
};
