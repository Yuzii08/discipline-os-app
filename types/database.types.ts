export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          user_id: string
          username: string
          current_streak: number
          max_streak: number
          global_rank_tier: string
          discipline_score: number
          weekly_discipline_score: number
          expo_push_token: string | null
          rival_user_id: string | null
          squad_id: string | null
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          user_id?: string
          username: string
          current_streak?: number
          max_streak?: number
          global_rank_tier?: string
          discipline_score?: number
          weekly_discipline_score?: number
          expo_push_token?: string | null
          rival_user_id?: string | null
          squad_id?: string | null
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          user_id?: string
          username?: string
          current_streak?: number
          max_streak?: number
          global_rank_tier?: string
          discipline_score?: number
          weekly_discipline_score?: number
          expo_push_token?: string | null
          rival_user_id?: string | null
          squad_id?: string | null
          avatar_url?: string | null
          created_at?: string
        }
      }
      missions: {
        Row: {
          mission_id: string
          user_id: string
          category: 'BODY' | 'MIND' | 'WORK'
          difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ELITE'
          mission_type: 'TIME' | 'TASK'
          title: string
          expected_duration_mins: number | null
          task_goal: number | null
          base_reward_points: number
          is_recurring: boolean
          cron_schedule: string | null
        }
        Insert: {
          mission_id?: string
          user_id: string
          category: 'BODY' | 'MIND' | 'WORK'
          difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'ELITE'
          mission_type: 'TIME' | 'TASK'
          title: string
          expected_duration_mins?: number | null
          task_goal?: number | null
          base_reward_points: number
          is_recurring?: boolean
          cron_schedule?: string | null
        }
        Update: {
          mission_id?: string
          user_id?: string
          category?: 'BODY' | 'MIND' | 'WORK'
          difficulty?: 'EASY' | 'MEDIUM' | 'HARD' | 'ELITE'
          mission_type?: 'TIME' | 'TASK'
          title?: string
          expected_duration_mins?: number | null
          task_goal?: number | null
          base_reward_points?: number
          is_recurring?: boolean
          cron_schedule?: string | null
        }
      }
      mission_completions: {
        Row: {
          completion_id: string
          mission_id: string
          user_id: string
          target_date: string
          status: 'PENDING' | 'COMPLETED' | 'FAILED'
          completed_at: string | null
          points_earned: number
          started_at: string | null
          ended_at: string | null
          start_image_url: string | null
          end_image_url: string | null
          is_grace_period: boolean
        }
        Insert: {
          completion_id?: string
          mission_id: string
          user_id: string
          target_date: string
          status?: 'PENDING' | 'COMPLETED' | 'FAILED'
          completed_at?: string | null
          points_earned?: number
          started_at?: string | null
          ended_at?: string | null
          start_image_url?: string | null
          end_image_url?: string | null
          is_grace_period?: boolean
        }
        Update: {
          completion_id?: string
          mission_id?: string
          user_id?: string
          target_date?: string
          status?: 'PENDING' | 'COMPLETED' | 'FAILED'
          completed_at?: string | null
          points_earned?: number
          started_at?: string | null
          ended_at?: string | null
          start_image_url?: string | null
          end_image_url?: string | null
          is_grace_period?: boolean
        }
      }
      challenges: {
        Row: {
          challenge_id: string
          title: string
          description: string | null
          challenge_type: 'GLOBAL' | 'SQUAD' | 'PERSONAL'
          penalty_logic: 'NONE' | 'GAUNTLET'
          start_date: string
          end_date: string
          created_at: string
        }
        Insert: {
          challenge_id?: string
          title: string
          description?: string | null
          challenge_type?: 'GLOBAL' | 'SQUAD' | 'PERSONAL'
          penalty_logic?: 'NONE' | 'GAUNTLET'
          start_date: string
          end_date: string
          created_at?: string
        }
        Update: {
          challenge_id?: string
          title?: string
          description?: string | null
          challenge_type?: 'GLOBAL' | 'SQUAD' | 'PERSONAL'
          penalty_logic?: 'NONE' | 'GAUNTLET'
          start_date?: string
          end_date?: string
          created_at?: string
        }
      }
      user_challenges: {
        Row: {
          user_id: string
          challenge_id: string
          status: 'ACTIVE' | 'COMPLETED' | 'FAILED'
          enrolled_at: string
        }
        Insert: {
          user_id: string
          challenge_id: string
          status?: 'ACTIVE' | 'COMPLETED' | 'FAILED'
          enrolled_at?: string
        }
        Update: {
          user_id?: string
          challenge_id?: string
          status?: 'ACTIVE' | 'COMPLETED' | 'FAILED'
          enrolled_at?: string
        }
      }
      posts: {
        Row: {
          post_id: string
          user_id: string
          completion_id: string | null
          content: string | null
          image_url: string | null
          ai_roast: string | null
          created_at: string
          like_count: number
          zap_count: number
          comment_count: number
        }
        Insert: {
          post_id?: string
          user_id: string
          completion_id?: string | null
          content?: string | null
          image_url?: string | null
          ai_roast?: string | null
          created_at?: string
          like_count?: number
          zap_count?: number
          comment_count?: number
        }
        Update: {
          post_id?: string
          user_id?: string
          completion_id?: string | null
          content?: string | null
          image_url?: string | null
          ai_roast?: string | null
          created_at?: string
          like_count?: number
          zap_count?: number
          comment_count?: number
        }
      }
      social_interactions: {
        Row: {
          interaction_id: string
          post_id: string
          user_id: string
          interaction_type: 'LIKE' | 'ZAP'
          created_at: string
        }
        Insert: {
          interaction_id?: string
          post_id: string
          user_id: string
          interaction_type: 'LIKE' | 'ZAP'
          created_at?: string
        }
        Update: {
          interaction_id?: string
          post_id?: string
          user_id?: string
          interaction_type?: 'LIKE' | 'ZAP'
          created_at?: string
        }
      }
      comments: {
        Row: {
          comment_id: string
          post_id: string
          user_id: string
          content: string
          created_at: string
        }
        Insert: {
          comment_id?: string
          post_id: string
          user_id: string
          content: string
          created_at?: string
        }
        Update: {
          comment_id?: string
          post_id?: string
          user_id?: string
          content?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

export type UserProfile = Database['public']['Tables']['users']['Row']
export type Post = Database['public']['Tables']['posts']['Row'] & {
  users?: {
    username: string
    global_rank_tier: string
  }
}
export type Comment = Database['public']['Tables']['comments']['Row'] & {
  users?: {
    username: string
  }
}
export type Mission = Database['public']['Tables']['missions']['Row']
export type MissionCompletion = Database['public']['Tables']['mission_completions']['Row'] & {
  missions?: {
    title: string
    category: Mission['category']
    difficulty: Mission['difficulty']
    mission_type: Mission['mission_type']
    expected_duration_mins: number | null
    task_goal: number | null
    base_reward_points: number
  }
}
