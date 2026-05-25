import {
  requirePersonalAccess,
} from '../../server/lib/personalAuth.js';

const toSafeJson = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
  }

  const access = await requirePersonalAccess(req);
  const emailAuthenticated = Boolean(access.emailAuthenticated);
  const allowedEmail = Boolean(access.allowedEmail);
  const secondFactorPassed = Boolean(access.secondFactorPassed);

  return toSafeJson(res, 200, {
    success: true,
    emailAuthenticated,
    allowedEmail,
    secondFactorPassed,
    ...(access.email ? { email: access.email } : {}),
  });
}