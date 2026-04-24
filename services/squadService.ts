import { supabase } from './supabase';

export interface Squad {
  squad_id: string;
  name: string;
  leader_id: string;
  motto?: string;
  description?: string;
  avatar_url?: string;
  total_squad_score: number;
  active_strikes: number;
  is_private: boolean;
  member_count?: number;
}

export interface JoinRequest {
  id: string;
  squad_id: string;
  user_id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  user?: {
    username: string;
    avatar_url: string;
    discipline_score: number;
  };
}

export const fetchSquads = async (query?: string) => {
  let sQuery = supabase
    .from('squads')
    .select(`
      *,
      member_count:squad_members(count)
    `);

  if (query) {
    sQuery = sQuery.ilike('name', `%${query}%`);
  }

  const { data, error } = await sQuery;
  if (error) throw error;
  
  return (data || []).map(s => ({
    ...s,
    member_count: (s as any).member_count[0]?.count || 0
  })) as Squad[];
};

export const getSquadDetails = async (squadId: string) => {
  const { data, error } = await supabase
    .from('squads')
    .select(`
      *,
      leader:users!squads_leader_id_fkey ( username, avatar_url ),
      members:squad_members ( 
        role, 
        user:users!squad_members_user_id_fkey ( username, avatar_url, global_rank_tier ) 
      )
    `)
    .eq('squad_id', squadId)
    .single();

  if (error) throw error;
  return data;
};

export const requestToJoin = async (squadId: string, userId: string) => {
  const { error } = await supabase
    .from('squad_join_requests')
    .insert({ squad_id: squadId, user_id: userId, status: 'PENDING' });

  if (error) throw error;
};

export const fetchMyJoinRequests = async (userId: string) => {
  const { data, error } = await supabase
    .from('squad_join_requests')
    .select('*, squad:squads(name, avatar_url)')
    .eq('user_id', userId);

  if (error) throw error;
  return data;
};

export const fetchPendingSquadRequests = async (leaderId: string) => {
  // First, find squads led by this user
  const { data: leadSquads } = await supabase
    .from('squads')
    .select('squad_id')
    .eq('leader_id', leaderId);

  if (!leadSquads || leadSquads.length === 0) return [];

  const squadIds = leadSquads.map(s => s.squad_id);

  const { data, error } = await supabase
    .from('squad_join_requests')
    .select(`
      *,
      user:users!squad_join_requests_user_id_fkey ( username, avatar_url, discipline_score )
    `)
    .in('squad_id', squadIds)
    .eq('status', 'PENDING');

  if (error) throw error;
  return data as JoinRequest[];
};

export const resolveRequest = async (requestId: string, approve: boolean) => {
  const { error } = await supabase.rpc('handle_squad_request', {
    p_request_id: requestId,
    p_status: approve ? 'APPROVED' : 'REJECTED'
  });

  if (error) throw error;
};
