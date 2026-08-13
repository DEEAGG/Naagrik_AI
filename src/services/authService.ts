import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

/**
 * Maps raw Supabase auth errors to friendly user-facing messages
 */
export function mapAuthError(err: any): string {
  if (!err) return 'An unknown error occurred.';
  const msg = (typeof err === 'string' ? err : err.message || '').toLowerCase();
  const code = (err.code || '').toLowerCase();

  if (msg.includes('invalid login credentials') || msg.includes('invalid_credentials') || code.includes('invalid_credentials')) {
    return 'Email or password is incorrect.';
  }
  if (
    msg.includes('email rate limit exceeded') ||
    msg.includes('over_email_send_rate_limit') ||
    msg.includes('rate limit') ||
    code.includes('over_email_send_rate_limit')
  ) {
    return 'Too many signup emails were requested. Please wait a while before trying again.';
  }
  if (msg.includes('user already registered') || msg.includes('already exists') || msg.includes('user_already_exists')) {
    return 'An account with this email already exists. Please sign in.';
  }
  if (msg.includes('weak password') || msg.includes('should be at least') || msg.includes('password should be')) {
    return 'Please choose a stronger password (at least 6 characters).';
  }
  if (msg.includes('passwords do not match')) {
    return 'Passwords do not match.';
  }

  return err.message || 'Authentication error. Please try again.';
}

/**
 * Sign up new user with Email & Password
 */
export async function signUpWithEmail(
  email: string,
  pass: string,
  fullName?: string
): Promise<{ user: User | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { user: null, error: 'Supabase URL/Anon Key not configured.' };
  }
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        emailRedirectTo: `${window.location.origin}/issues`,
        data: fullName ? { full_name: fullName } : undefined,
      },
    });
    if (error) return { user: null, error: mapAuthError(error) };
    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: mapAuthError(err) };
  }
}

/**
 * Sign in existing user with Email & Password
 */
export async function signInWithEmail(email: string, pass: string): Promise<{ user: User | null; error: string | null }> {
  if (!isSupabaseConfigured) {
    return { user: null, error: 'Supabase URL/Anon Key not configured.' };
  }
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) return { user: null, error: mapAuthError(error) };
    return { user: data.user, error: null };
  } catch (err: any) {
    return { user: null, error: mapAuthError(err) };
  }
}

/**
 * Send password reset email via Supabase Auth
 */
export async function requestPasswordReset(email: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase URL/Anon Key not configured.' };
  }
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return { error: mapAuthError(error) };
    return { error: null };
  } catch (err: any) {
    return { error: mapAuthError(err) };
  }
}

/**
 * Update authenticated user's password after recovery link redirect
 */
export async function updateUserPassword(newPassword: string): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: 'Supabase URL/Anon Key not configured.' };
  }
  try {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { error: mapAuthError(error) };
    return { error: null };
  } catch (err: any) {
    return { error: mapAuthError(err) };
  }
}

/**
 * Sign out current user
 */
export async function signOutUser(): Promise<{ error: string | null }> {
  if (!isSupabaseConfigured) {
    return { error: null };
  }
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return { error: mapAuthError(error) };
    return { error: null };
  } catch (err: any) {
    return { error: mapAuthError(err) };
  }
}

/**
 * Get active Supabase session
 */
export async function getActiveSession(): Promise<Session | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const { data } = await supabase.auth.getSession();
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Listen to auth state changes across devices/tabs
 */
export function onAuthChange(callback: (user: User | null, session: Session | null) => void) {
  if (!isSupabaseConfigured) {
    callback(null, null);
    return () => {};
  }
  const { data } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
    callback(session?.user || null, session || null);
  });
  return () => {
    data.subscription.unsubscribe();
  };
}
