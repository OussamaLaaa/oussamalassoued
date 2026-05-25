import { createClient } from '@supabase/supabase-js';
import { PERSONAL_AUTH_CONFIGURED, PERSONAL_SUPABASE_ANON_KEY, PERSONAL_SUPABASE_URL } from '../config/personalAuthConfig';

let personalSupabaseClient: ReturnType<typeof createClient> | null = null;
let personalApiFetchCleanup: (() => void) | null = null;

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

export const signInPersonalWithPassword = async (email: string, password: string) => {
  const supabase = getPersonalSupabaseClient();
  if (!supabase) {
    return {
      success: false,
      error: 'Personal sign-in is not configured for this environment.',
    };
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return {
      success: false,
      error: error.message || 'Login failed. Try again.',
      status: error.status,
      code: error.code,
    };
  }

  return { success: Boolean(data.session) };
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

export const verifyPersonalSecondFactor = async (password: string, rememberDevice = false) => {
  const response = await fetch('/api/personal-auth/verify-second-factor', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password, rememberDevice }),
  });

  return response.json();
};

const shouldAttachPersonalAuth = (pathname: string) => {
  return pathname === '/api/opportunities' || pathname.startsWith('/api/opportunities?') || pathname.startsWith('/api/opportunities/')
    || pathname === '/api/ai' || pathname.startsWith('/api/ai?') || pathname.startsWith('/api/ai/')
    || pathname === '/api/documents' || pathname.startsWith('/api/documents?') || pathname.startsWith('/api/documents/');
};

export const installPersonalApiAuthBridge = () => {
  if (typeof window === 'undefined') return () => {};
  if (personalApiFetchCleanup) return personalApiFetchCleanup;

  const originalFetch = window.fetch.bind(window);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    let requestUrl = '';

    try {
      requestUrl = typeof input === 'string' || input instanceof URL ? String(input) : input.url;
    } catch {
      requestUrl = '';
    }

    let pathname = '';
    try {
      pathname = requestUrl ? new URL(requestUrl, window.location.origin).pathname : '';
    } catch {
      pathname = '';
    }

    if (!shouldAttachPersonalAuth(pathname)) {
      return originalFetch(input as RequestInfo, init);
    }

    const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
    if (!headers.has('Authorization')) {
      const accessToken = await getPersonalAccessToken();
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
    }

    return originalFetch(input as RequestInfo, {
      ...init,
      credentials: init?.credentials ?? 'include',
      headers,
    });
  };

  personalApiFetchCleanup = () => {
    window.fetch = originalFetch;
    personalApiFetchCleanup = null;
  };

  return personalApiFetchCleanup;
};