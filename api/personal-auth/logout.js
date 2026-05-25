import {
  clearPersonalGateCookies,
  extractBearerToken,
} from '../../server/lib/personalAuth.js';

const toSafeJson = (res, status, body) => res.status(status).json(body);

const getSupabaseLogoutUrl = () => {
  const supabaseUrl = String(process.env.SUPABASE_URL || '').trim();
  return supabaseUrl ? `${supabaseUrl.replace(/\/$/, '')}/auth/v1/logout` : '';
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
  }

  const supabaseUrl = getSupabaseLogoutUrl();
  const apiKey = String(process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();
  const accessToken = extractBearerToken(req);

  if (supabaseUrl && apiKey && accessToken) {
    try {
      await fetch(supabaseUrl, {
        method: 'POST',
        headers: {
          apikey: apiKey,
          Authorization: `Bearer ${accessToken}`,
        },
      });
    } catch {
      // Logout should still clear the local gate even if upstream sign-out fails.
    }
  }

  res.setHeader('Set-Cookie', clearPersonalGateCookies(req));
  return toSafeJson(res, 200, { success: true });
}