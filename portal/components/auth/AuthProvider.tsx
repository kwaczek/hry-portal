'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  isGuest: boolean;
  anonSignInFailed: boolean;
  retryAnonSignIn: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signUpWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  upgradeWithGoogle: () => Promise<void>;
  upgradeWithEmail: (email: string, password: string) => Promise<{ error: string | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function generateGuestUsername(): string {
  const id = Math.random().toString(36).substring(2, 8);
  return `host_${id}`;
}

async function ensureGuestProfile(
  supabase: ReturnType<typeof createClient>,
  userId: string
) {
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  if (!data) {
    const username = generateGuestUsername();
    await supabase.from('profiles').insert({
      id: userId,
      username,
      display_name: 'Host',
      is_guest: true,
    });
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [anonSignInFailed, setAnonSignInFailed] = useState(false);
  const anonSignInAttempted = useRef(false);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);

        // Create guest profile on initial anonymous sign-in
        if (event === 'SIGNED_IN' && session?.user.is_anonymous) {
          await ensureGuestProfile(supabase, session.user.id);
        }
      }
    );

    // Get initial session — if none, sign in anonymously
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        setSession(session);
        setUser(session.user);
        setLoading(false);
      } else if (!anonSignInAttempted.current) {
        anonSignInAttempted.current = true;
        const { error } = await supabase.auth.signInAnonymously();
        if (error) {
          // Anonymous sign-in may be disabled in Supabase dashboard.
          console.warn('Anonymous sign-in failed:', error.message);
          setAnonSignInFailed(true);
          setLoading(false);
        }
        // On success, state will be updated via onAuthStateChange
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const isGuest = user?.is_anonymous ?? false;

  const retryAnonSignIn = async () => {
    setLoading(true);
    setAnonSignInFailed(false);
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn('Anonymous sign-in retry failed:', error.message);
      setAnonSignInFailed(true);
      setLoading(false);
    }
    // On success, onAuthStateChange will update state
  };

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  const signInWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUpWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  // Guest → permanent upgrade: links Google identity to anonymous user
  const upgradeWithGoogle = async () => {
    await supabase.auth.linkIdentity({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  };

  // Guest → permanent upgrade: links email identity to anonymous user
  const upgradeWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.updateUser({ email, password });
    if (!error) {
      // Update profile to no longer be a guest
      await supabase
        .from('profiles')
        .update({ is_guest: false })
        .eq('id', user!.id);
    }
    return { error: error?.message ?? null };
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        isGuest,
        anonSignInFailed,
        retryAnonSignIn,
        signInWithGoogle,
        signInWithEmail,
        signUpWithEmail,
        signOut,
        upgradeWithGoogle,
        upgradeWithEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
