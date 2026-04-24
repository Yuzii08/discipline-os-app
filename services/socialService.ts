import { supabase } from './supabase';
import { Post, Comment } from '../types/database.types';

export const fetchPosts = async () => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      users!posts_user_id_fkey ( username, global_rank_tier, avatar_url ),
      mission_completions!posts_completion_id_fkey ( start_image_url, end_image_url )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
  return data as Post[];
};

/**
 * Returns the set of post_ids that the given user has "ZAP"-reacted to.
 * Used to seed the initial firedByMe state on the community feed.
 */
export const fetchUserZaps = async (userId: string): Promise<Set<string>> => {
  const { data } = await supabase
    .from('social_interactions' as any)
    .select('post_id')
    .eq('user_id', userId)
    .eq('interaction_type', 'ZAP');
  return new Set((data ?? []).map((r: any) => r.post_id));
};



export const createPost = async (userId: string, content: string, imageUrl?: string, completionId?: string) => {
  const { data, error } = await supabase
    .from('posts' as any)
    .insert({
      user_id: userId,
      content,
      image_url: imageUrl,
      completion_id: completionId,
    } as any)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const toggleLike = async (postId: string, userId: string, currentlyLiked: boolean) => {
  if (currentlyLiked) {
    // Remove like
    await supabase.from('social_interactions' as any)
      .delete()
      .match({ post_id: postId, user_id: userId, interaction_type: 'LIKE' });
      
    // Decrement counter
    await supabase.rpc('decrement_post_like' as any, { p_id: postId } as any);
  } else {
    // Add like
    await supabase.from('social_interactions' as any)
      .insert({ post_id: postId, user_id: userId, interaction_type: 'LIKE' } as any);
      
    // Increment counter
    await supabase.rpc('increment_post_like' as any, { p_id: postId } as any);
  }
};

export const fetchComments = async (postId: string) => {
  const { data, error } = await supabase
    .from('comments')
    .select(`
      *,
      users!comments_user_id_fkey ( username, avatar_url )
    `)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });

  if (error) throw error;
  return data as Comment[];
};

export const addComment = async (postId: string, userId: string, content: string) => {
  const { error } = await supabase
    .from('comments' as any)
    .insert({ post_id: postId, user_id: userId, content } as any);
    
  if (error) throw error;
  
  // Increment comment counter
  await supabase.rpc('increment_post_comment' as any, { p_id: postId } as any);
};

export const toggleZap = async (postId: string, userId: string, currentlyZapped: boolean) => {
  if (currentlyZapped) {
    await supabase.from('social_interactions' as any)
      .delete()
      .match({ post_id: postId, user_id: userId, interaction_type: 'ZAP' });
    await supabase.rpc('decrement_post_zap' as any, { p_id: postId } as any);
  } else {
    await supabase.from('social_interactions' as any)
      .insert({ post_id: postId, user_id: userId, interaction_type: 'ZAP' } as any);
    await supabase.rpc('increment_post_zap' as any, { p_id: postId } as any);
  }
};

/**
 * Subscribes to changes in the community feed (posts, comments, interactions).
 */
export const subscribeToCommunityFeed = (onUpdate: (payload: any) => void) => {
  const channel = supabase.channel('community_feed')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'posts' }, onUpdate)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'social_interactions' }, onUpdate)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'comments' }, onUpdate)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

