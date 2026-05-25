const toSafeString = (value: unknown) => (value == null ? '' : String(value).trim());

export const PERSONAL_SUPABASE_URL = toSafeString(
  import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_PROJECT_URL,
);

export const PERSONAL_SUPABASE_ANON_KEY = toSafeString(
  import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
);

export const PERSONAL_AUTH_CONFIGURED = Boolean(PERSONAL_SUPABASE_URL && PERSONAL_SUPABASE_ANON_KEY);