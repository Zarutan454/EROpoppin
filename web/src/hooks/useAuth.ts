import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';
import { persist, createJSONStorage } from 'zustand/middleware';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface SignUpData {
  email: string;
  password: string;
  username: string;
  fullName: string;
  role: 'client' | 'provider';
}

interface AuthState {
  user: any | null;
  session: any | null;
  isLoading: boolean;
  signUp: (data: SignUpData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  verifyEmail: (token: string) => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (data: any) => Promise<void>;
  refreshSession: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      isLoading: true,

      signUp: async (data: SignUpData) => {
        const { error } = await supabase.auth.signUp({
          email: data.email,
          password: data.password,
          options: {
            data: {
              username: data.username,
              full_name: data.fullName,
              role: data.role,
            },
          },
        });

        if (error) throw error;
      },

      signIn: async (email: string, password: string) => {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;
        set({ user: data.user, session: data.session });
      },

      signOut: async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        set({ user: null, session: null });
      },

      verifyEmail: async (token: string) => {
        const { error } = await supabase.auth.verifyOtp({
          token_hash: token,
          type: 'email',
        });

        if (error) throw error;
      },

      resendVerificationEmail: async () => {
        const { error } = await supabase.auth.resend({
          type: 'signup',
          email: get().user?.email,
        });

        if (error) throw error;
      },

      resetPassword: async (email: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
      },

      updatePassword: async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (error) throw error;
      },

      updateProfile: async (data: any) => {
        const { error } = await supabase
          .from('profiles')
          .update(data)
          .eq('id', get().user?.id);

        if (error) throw error;

        set({
          user: {
            ...get().user,
            user_metadata: {
              ...get().user?.user_metadata,
              ...data,
            },
          },
        });
      },

      refreshSession: async () => {
        try {
          const { data } = await supabase.auth.getSession();
          set({
            user: data.session?.user ?? null,
            session: data.session,
            isLoading: false,
          });
        } catch (error) {
          set({ user: null, session: null, isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

// Set up auth state listener
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    useAuth.setState({
      user: session?.user ?? null,
      session,
      isLoading: false,
    });
  });
}

export default useAuth;