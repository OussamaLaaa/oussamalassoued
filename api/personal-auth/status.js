import {
  requirePersonalAccess,
} from '../../server/lib/personalAuth.js';

const toSafeJson = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  try {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Cache-Control', 'no-store');

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      return res.status(200).end();
    }

    if (req.method !== 'GET') {
      return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
    }

    const access = await requirePersonalAccess(req);

    return toSafeJson(res, 200, {
      success: true,
      mainPasswordPassed: Boolean(access.emailAuthenticated),
      secondFactorPassed: Boolean(access.secondFactorPassed),
      email: access.email || undefined,
      displayName: access.mainToken?.displayName || undefined,
    });
  } catch {
    return toSafeJson(res, 500, { success: false, error: 'Status check failed.' });
  }
}
