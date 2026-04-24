import { supabase } from './supabase';
import { useUserStore } from '../store/useUserStore';

export const AuthService = {
  // 1. Retrieve Current User Session on Mount
  initializeAuth: async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await AuthService.fetchProfile(session.user.id);
      }
    } catch (e) {
      console.warn('Auth init failed:', e);
    } finally {
      // Mark initializing done regardless of outcome so AuthGuard can navigate
      useUserStore.getState().setInitializing(false);
    }

    // Listen for subsequent auth state changes
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session?.user) {
        try {
          await AuthService.fetchProfile(session.user.id);
        } catch (e) {
          // If the session exists but user has no profile, clear local state.
          useUserStore.setState({ profile: null, disciplineScore: 0, currentStreak: 0 });
        }
      } else {
        useUserStore.setState({ profile: null, disciplineScore: 0, currentStreak: 0 });
      }
    });
  },

  // 2. Fetch User Profile from 'users' table
  fetchProfile: async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile', error);
      throw error;
    }
    useUserStore.getState().setProfile(data);
  },

  // 3. Email Login — throws so the screen can show the inline error
  login: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    
    // Ensure we have a profile before declaring login successful
    if (data.user) {
      try {
        await AuthService.fetchProfile(data.user.id);
      } catch (profileErr: any) {
        // If profile fetch fails, they shouldn't be logged in because the app will crash/loop.
        await supabase.auth.signOut();
        throw new Error('Profile not found. Please register or contact support.');
      }
    }
  },

  // 4. Email Signup — returns whether email confirmation is needed
  signup: async (email: string, password: string, username: string): Promise<{ needsConfirmation: boolean }> => {
    // Pass username in user_metadata so the Supabase Postgres trigger (handle_new_user) can read it
    const { data, error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: 'winterarcapp://confirm',
        data: {
          username: username
        }
      }
    });
    
    if (error) throw error;

    // If identities is empty, email confirmation is required before session is active
    const needsConfirmation = !data.session;

    if (data.user && !needsConfirmation) {
      // The Postgres trigger automatically creates the user record on auth.users insert.
      // We can just fetch the profile to update local state.
      await AuthService.fetchProfile(data.user.id);
    }

    return { needsConfirmation };
  },

  // 5. Sign Out
  signOut: async () => {
    await supabase.auth.signOut();
  },
};
