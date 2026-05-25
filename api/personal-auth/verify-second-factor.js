import {
  createPersonalGateCookie,
  PERSONAL_GATE_TTLS,
  requirePersonalAccess,
  verifyScryptPassword,
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
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
  }

  const gateSecret = String(process.env.PERSONAL_GATE_SECRET || '').trim();
  const secondFactorHash = String(process.env.PERSONAL_SECOND_PASSWORD_HASH || '').trim();
  const access = await requirePersonalAccess(req);
  const body = readBody(req);
  const password = String(body?.password || '').trim();
  const rememberDevice = Boolean(body?.rememberDevice);

  if (!gateSecret || !secondFactorHash) {
    return toSafeJson(res, 500, { success: false, error: 'Authentication is not configured.' });
  }

  if (!access.emailAuthenticated || !access.allowedEmail || !access.email) {
    return toSafeJson(res, 401, { success: false, error: 'Unauthorized.' });
  }

  if (!password) {
    return toSafeJson(res, 401, { success: false, error: 'Invalid password.' });
  }

  const passwordMatches = await verifyScryptPassword(password, secondFactorHash);
  if (!passwordMatches) {
    return toSafeJson(res, 401, { success: false, error: 'Invalid password.' });
  }

  res.setHeader('Set-Cookie', [
    createPersonalGateCookie(req, {
      email: access.email,
      ttlSeconds: rememberDevice ? PERSONAL_GATE_TTLS.rememberDeviceSeconds : PERSONAL_GATE_TTLS.defaultSeconds,
    }),
  ]);

  return toSafeJson(res, 200, { success: true });
}