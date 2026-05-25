import { createClient } from '@supabase/supabase-js';
import {
  PERSONAL_AUTH_TTLS,
  verifyScryptPassword,
  createMainCookie,
} from '../../server/lib/personalAuth.js';

const toSafeJson = (res, status, body) => res.status(status).json(body);

const readBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') return req.body;
  return {};
};

const getSupabaseUrl = () => {
  return String(
    process.env.SUPABASE_URL
    || process.env.VITE_SUPABASE_URL
    || process.env.NEXT_PUBLIC_SUPABASE_URL
    || '',
  ).trim();
};

const getSupabaseServiceKey = () => {
  return String(
    process.env.SUPABASE_SERVICE_ROLE_KEY
    || process.env.SUPABASE_SERVICE_KEY
    || process.env.SUPABASE_SECRET_KEY
    || '',
  ).trim();
};

export default async function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();
    }

    if (req.method !== 'POST') {
      return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
    }

    const debug = String(req.query?.debug || '') === '1';

    const supabaseUrl = getSupabaseUrl();
    const supabaseKey = getSupabaseServiceKey();
    const gateSecret = String(process.env.PERSONAL_GATE_SECRET || '').trim();

    if (!supabaseUrl || !supabaseKey || !gateSecret) {
      return toSafeJson(res, 500, { success: false, error: 'Personal auth server is not configured.' });
    }

    const body = readBody(req);
    const email = String(body?.email || '').trim().toLowerCase();
    const password = String(body?.password || '');
    const rememberDevice = Boolean(body?.rememberDevice);

    if (!email || !password) {
      return toSafeJson(res, 400, { success: false, error: 'Email and password are required.' });
    }

    const supabase = createClient(supabaseUrl, supabaseKey, {
      auth: { persistSession: false },
    });

    let queryResult;
    try {
      queryResult = await supabase
        .from('personal_auth_users')
        .select('id, email, password_hash, display_name, is_active, failed_attempts, locked_until')
        .eq('email', email)
        .limit(1);
    } catch (queryError) {
      if (debug) {
        return toSafeJson(res, 500, {
          success: false,
          error: 'Login service failed.',
          debug: {
            table: 'personal_auth_users',
            supabaseCode: queryError?.code || null,
            supabaseMessage: queryError?.message || null,
          },
        });
      }
      return toSafeJson(res, 500, { success: false, error: 'Login service failed.' });
    }

    if (queryResult.error) {
      if (debug) {
        return toSafeJson(res, 500, {
          success: false,
          error: 'Login service failed.',
          debug: {
            table: 'personal_auth_users',
            supabaseCode: queryResult.error.code || null,
            supabaseMessage: queryResult.error.message || null,
          },
        });
      }
      return toSafeJson(res, 500, { success: false, error: 'Login service failed.' });
    }

    const user = queryResult.data?.[0];

    if (debug) {
      const debugInfo = {
        hasSupabaseUrl: Boolean(supabaseUrl),
        hasSupabaseServiceRoleKey: Boolean(supabaseKey),
        hasPersonalGateSecret: Boolean(gateSecret),
        tableQueried: true,
        emailNormalizedExists: Boolean(user),
        hashFormatValid: null,
      };
      if (user?.password_hash) {
        const parts = String(user.password_hash).split(':');
        debugInfo.hashFormatValid = parts.length >= 3 && parts[0] === 'scrypt' && Boolean(parts[1]) && Boolean(parts.slice(2).join(':'));
      }
      return toSafeJson(res, 200, { success: true, debug: debugInfo });
    }

    if (!user) {
      return toSafeJson(res, 401, { success: false, error: 'Invalid email or password.' });
    }

    if (user.is_active === false) {
      return toSafeJson(res, 403, { success: false, error: 'Access denied.' });
    }

    if (user.locked_until) {
      try {
        const lockedUntil = new Date(user.locked_until);
        if (lockedUntil > new Date()) {
          return toSafeJson(res, 429, { success: false, error: 'Too many failed attempts. Try again later.' });
        }
      } catch {
        // invalid date in locked_until, continue
      }
    }

    const storedHash = String(user.password_hash || '');
    const hashParts = storedHash.split(':');
    const hashFormatValid = hashParts.length >= 3 && hashParts[0] === 'scrypt' && Boolean(hashParts[1]) && Boolean(hashParts.slice(2).join(':'));

    if (!hashFormatValid) {
      return toSafeJson(res, 500, { success: false, error: 'Login service is misconfigured.' });
    }

    let passwordMatches = false;
    try {
      passwordMatches = await verifyScryptPassword(password, storedHash);
    } catch {
      return toSafeJson(res, 500, { success: false, error: 'Login service failed.' });
    }

    if (!passwordMatches) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      const updateData = { failed_attempts: newAttempts };

      if (newAttempts >= 5) {
        try {
          updateData.locked_until = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        } catch {
          // skip lockout date on error
        }
      }

      try {
        await supabase
          .from('personal_auth_users')
          .update(updateData)
          .eq('id', user.id);
      } catch {
        // failed to update, still return generic error
      }

      return toSafeJson(res, 401, { success: false, error: 'Invalid email or password.' });
    }

    try {
      await supabase
        .from('personal_auth_users')
        .update({
          failed_attempts: 0,
          locked_until: null,
          last_login_at: new Date().toISOString(),
        })
        .eq('id', user.id);
    } catch {
      // non-critical update failure, allow login
    }

    const setCookie = createMainCookie(req, {
      email: user.email,
      userId: user.id,
      displayName: user.display_name || undefined,
      ttlSeconds: rememberDevice ? PERSONAL_AUTH_TTLS.mainRememberSeconds : undefined,
    });
    res.setHeader('Set-Cookie', setCookie);

    return toSafeJson(res, 200, {
      success: true,
      email: user.email,
      displayName: user.display_name || undefined,
    });
  } catch (error) {
    const isDev = process.env.NODE_ENV === 'development';
    return toSafeJson(res, 500, {
      success: false,
      error: 'Login service failed.',
      ...(isDev ? { debug: { message: error.message, name: error.name } } : {}),
    });
  }
}
