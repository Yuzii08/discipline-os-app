import { supabase } from './supabase';

export interface Notification {
  id: string;
  user_id: string;
  type: 'LIKE' | 'ZAP' | 'COMMENT' | 'SQUAD_JOIN' | 'SQUAD_ACCEPT';
  sender_id: string;
  post_id?: string;
  data?: any;
  is_read: boolean;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string;
  };
}

export const fetchNotifications = async (userId: string): Promise<Notification[]> => {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      sender:users!notifications_sender_id_fkey ( username, avatar_url )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }
  return data as Notification[];
};

export const fetchUnreadCount = async (userId: string): Promise<number> => {
  const { count, error } = await supabase
    .from('notifications')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
  return count || 0;
};

export const markAsRead = async (notificationId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', notificationId);

  if (error) throw error;
};

export const markAllAsRead = async (userId: string) => {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', userId)
    .eq('is_read', false);

  if (error) throw error;
};

export const subscribeToNotifications = (userId: string, onUpdate: () => void) => {
  const channel = supabase.channel(`notifications_${userId}`)
    .on('postgres_changes', { 
      event: '*', 
      schema: 'public', 
      table: 'notifications',
      filter: `user_id=eq.${userId}`
    }, onUpdate)
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
