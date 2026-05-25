import {
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

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
  }

  const gateSecret = String(process.env.PERSONAL_GATE_SECRET || '').trim();
  if (!gateSecret) {
    return toSafeJson(res, 500, { success: false, error: 'Authentication is not configured.' });
  }

  const body = readBody(req);
  const email = String(body?.email || '').trim().toLowerCase();
  const password = String(body?.password || '');

  if (!email || !password) {
    return toSafeJson(res, 401, { success: false, error: 'Invalid email or password.' });
  }

  const { createClient } = await import('@vercel/postgres');
  const client = createClient();
  await client.connect();

  try {
    const { rows } = await client.query(
      'SELECT id, email, password_hash, locked_until, failed_attempts FROM personal_auth_users WHERE email = $1 LIMIT 1',
      [email],
    );

    const user = rows?.[0];
    if (!user) {
      return toSafeJson(res, 401, { success: false, error: 'Invalid email or password.' });
    }

    if (user.locked_until) {
      const lockedUntil = new Date(user.locked_until);
      if (lockedUntil > new Date()) {
        return toSafeJson(res, 401, { success: false, error: 'Account is temporarily locked. Try again later.' });
      }
    }

    const passwordMatches = await verifyScryptPassword(password, user.password_hash);
    if (!passwordMatches) {
      const newAttempts = (user.failed_attempts || 0) + 1;
      if (newAttempts >= 5) {
        await client.query(
          `UPDATE personal_auth_users SET failed_attempts = $1, locked_until = NOW() + INTERVAL '15 minutes' WHERE id = $2`,
          [newAttempts, user.id],
        );
      } else {
        await client.query(
          'UPDATE personal_auth_users SET failed_attempts = $1 WHERE id = $2',
          [newAttempts, user.id],
        );
      }
      return toSafeJson(res, 401, { success: false, error: 'Invalid email or password.' });
    }

    await client.query(
      'UPDATE personal_auth_users SET failed_attempts = 0, locked_until = NULL WHERE id = $1',
      [user.id],
    );

    const setCookie = createMainCookie(req, { email: user.email, userId: user.id });
    res.setHeader('Set-Cookie', setCookie);

    return toSafeJson(res, 200, { success: true, email: user.email });
  } finally {
    await client.end();
  }
}
