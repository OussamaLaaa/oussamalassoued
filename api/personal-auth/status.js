import {
  createPersonalGateCookie,
  isEmailAllowed,
  parseAllowedEmails,
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

  const allowedEmails = parseAllowedEmails();
  const access = await requirePersonalAccess(req);
  const googleAuthenticated = Boolean(access.googleAuthenticated);
  const allowedEmail = Boolean(access.email && isEmailAllowed(access.email, allowedEmails));
  const secondFactorPassed = Boolean(access.secondFactorPassed);

  if (googleAuthenticated && allowedEmail && access.email && !access.secondFactorPassed) {
    const ttlSeconds = access.googleGate ? Math.max(0, access.googleGate.expiresAt - access.googleGate.issuedAt) : (60 * 60 * 10);
    res.setHeader('Set-Cookie', createPersonalGateCookie(req, {
      email: access.email,
      purpose: 'personal_google',
      ttlSeconds,
    }));
  }

  return toSafeJson(res, 200, {
    success: true,
    googleAuthenticated,
    allowedEmail,
    secondFactorPassed,
    ...(access.email ? { email: access.email } : {}),
  });
}