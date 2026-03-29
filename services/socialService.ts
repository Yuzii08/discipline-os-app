import { supabase } from './supabase';
import { Post, Comment } from '../types/database.types';

export const fetchPosts = async () => {
  const { data, error } = await supabase
    .from('posts')
    .select(`
      *,
      users!posts_user_id_fkey ( username, global_rank_tier )
    `)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching posts:', error);
    throw error;
  }
  return data as Post[];
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
      users!comments_user_id_fkey ( username )
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
