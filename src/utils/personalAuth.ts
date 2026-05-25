import { createClient } from '@supabase/supabase-js';
import { PERSONAL_AUTH_CONFIGURED, PERSONAL_SUPABASE_ANON_KEY, PERSONAL_SUPABASE_URL } from '../config/personalAuthConfig';

let personalSupabaseClient: ReturnType<typeof createClient> | null = null;

export const getPersonalSupabaseClient = () => {
  if (!PERSONAL_AUTH_CONFIGURED) return null;
  if (!personalSupabaseClient) {
    personalSupabaseClient = createClient(PERSONAL_SUPABASE_URL, PERSONAL_SUPABASE_ANON_KEY, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }

  return personalSupabaseClient;
};

export const getPersonalAccessToken = async () => {
  const supabase = getPersonalSupabaseClient();
  if (!supabase) return '';

  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || '';
};

export const startGooglePersonalLogin = async () => {
  const supabase = getPersonalSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      error: 'Google sign-in is not configured for this environment.',
    };
  }

  const redirectTo = `${window.location.origin}/personal`;
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
    },
  });

  if (error) {
    return {
      success: false,
      error: error.message || 'Unable to start Google sign-in.',
    };
  }

  if (data?.url) {
    window.location.assign(data.url);
    return { success: true };
  }

  return {
    success: false,
    error: 'Google sign-in returned no authorization URL.',
  };
};

export const personalLogout = async () => {
  const supabase = getPersonalSupabaseClient();

  await fetch('/api/personal-auth/logout', {
    method: 'POST',
    credentials: 'include',
  });

  if (supabase) {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignore client sign-out errors; the server gate has already been cleared.
    }
  }
};

export const fetchPersonalAuthStatus = async () => {
  const accessToken = await getPersonalAccessToken();

  const response = await fetch('/api/personal-auth/status', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
  });

  return response.json();
};

export const verifyPersonalSecondFactor = async (password: string) => {
  const response = await fetch('/api/personal-auth/verify-second-factor', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password }),
  });

  return response.json();
};