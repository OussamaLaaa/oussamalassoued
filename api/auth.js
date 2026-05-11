const crypto = require('crypto');

const AUTH_COOKIE_NAME = 'dashboard_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function getDashboardPassword() {
  return process.env.DASHBOARD_PASSWORD || '00000008';
}

function getSessionSecret() {
  return process.env.DASHBOARD_SESSION_SECRET || getDashboardPassword();
}

function isSecureRequest(req) {
  const forwardedProto = String(req.headers['x-forwarded-proto'] || '').toLowerCase();
  return process.env.NODE_ENV === 'production' || forwardedProto === 'https';
}

function parseCookies(cookieHeader) {
  return String(cookieHeader || '')
    .split(';')
    .map((part) => part.trim())
    .filter(Boolean)
    .reduce((accumulator, part) => {
      const separatorIndex = part.indexOf('=');
      if (separatorIndex === -1) return accumulator;
      const key = part.slice(0, separatorIndex).trim();
      const value = part.slice(separatorIndex + 1).trim();
      accumulator[key] = decodeURIComponent(value);
      return accumulator;
    }, {});
}

function createSessionToken() {
  const issuedAt = Date.now().toString();
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(issuedAt)
    .digest('hex');

  return `${issuedAt}.${signature}`;
}

function verifySessionToken(token) {
  if (!token || typeof token !== 'string') return false;

  const [issuedAt, signature] = token.split('.');
  if (!issuedAt || !signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(issuedAt)
    .digest('hex');

  const signatureBuffer = Buffer.from(signature, 'hex');
  const expectedBuffer = Buffer.from(expectedSignature, 'hex');

  if (signatureBuffer.length !== expectedBuffer.length) return false;

  const isSignatureValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer);
  if (!isSignatureValid) return false;

  const issuedAtNumber = Number.parseInt(issuedAt, 10);
  if (!Number.isFinite(issuedAtNumber)) return false;

  return Date.now() - issuedAtNumber <= SESSION_MAX_AGE_SECONDS * 1000;
}

function buildCookieOptions(req, maxAgeSeconds) {
  const secure = isSecureRequest(req) ? '; Secure' : '';
  return `Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

function readSessionToken(req) {
  const cookies = parseCookies(req.headers.cookie);
  return cookies[AUTH_COOKIE_NAME] || '';
}

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', process.env.APP_ORIGIN || req.headers.origin || '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST,DELETE');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Accept, Authorization, X-Requested-With'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    const sessionToken = readSessionToken(req);
    const authenticated = verifySessionToken(sessionToken);
    res.status(200).json({ success: true, authenticated });
    return;
  }

  if (req.method === 'POST') {
    try {
      const body = req.body;
      const password = String(body?.password || '');

      if (password !== getDashboardPassword()) {
        res.status(401).json({ success: false, authenticated: false, error: 'Invalid password' });
        return;
      }

      const token = createSessionToken();
      res.setHeader('Set-Cookie', `dashboard_session=${encodeURIComponent(token)}; ${buildCookieOptions(req, SESSION_MAX_AGE_SECONDS)}`);
      res.status(200).json({ success: true, authenticated: true });
      return;
    } catch (error) {
      console.error('Failed to create dashboard session:', error);
      res.status(500).json({ success: false, authenticated: false, error: 'Failed to authenticate' });
      return;
    }
  }

  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', `dashboard_session=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0` + (isSecureRequest(req) ? '; Secure' : ''));
    res.status(200).json({ success: true, authenticated: false });
    return;
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
};
