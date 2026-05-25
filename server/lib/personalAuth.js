import crypto from 'crypto';

const PERSONAL_OS_MAIN_COOKIE = 'personal_os_main';
const PERSONAL_OS_GATE_COOKIE = 'personal_os_gate';
const LEGACY_PERSONAL_COOKIE = 'personal_google_gate';

const MAIN_TTL_SECONDS = 60 * 60 * 12;
const GATE_DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 7;
const GATE_REMEMBER_TTL_SECONDS = 60 * 60 * 24 * 30;

const toSafeString = (value) => (value == null ? '' : String(value).trim());

export const parseCookies = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};

  return cookieHeader.split(';').reduce((accumulator, part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) return accumulator;

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (key) accumulator[key] = value;
    return accumulator;
  }, {});
};

const base64UrlEncode = (buffer) => Buffer.from(buffer)
  .toString('base64')
  .replace(/=/g, '')
  .replace(/\+/g, '-')
  .replace(/\//g, '_');

const base64UrlDecode = (value) => {
  const normalized = String(value || '').replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  return Buffer.from(normalized + padding, 'base64');
};

const getCookieDomainPrefix = (req) => {
  const host = String(req.headers?.host || '').split(':')[0].toLowerCase();
  if (host === 'oussamalassoued.me' || host === 'www.oussamalassoued.me') {
    return 'Domain=.oussamalassoued.me; ';
  }

  return '';
};

const buildCookieAttributes = (req, maxAgeSeconds) => {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${getCookieDomainPrefix(req)}Path=/; HttpOnly; SameSite=Strict${secureFlag}; Max-Age=${maxAgeSeconds}`;
};

const buildClearedCookieAttributes = (req) => {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${getCookieDomainPrefix(req)}Path=/; HttpOnly; SameSite=Strict${secureFlag}; Max-Age=0`;
};

const signToken = ({ email, secret = process.env.PERSONAL_GATE_SECRET, ttlSeconds, purpose, ...extra }) => {
  const normalizedSecret = toSafeString(secret);
  if (!normalizedSecret) {
    throw new Error('Missing PERSONAL_GATE_SECRET');
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + ttlSeconds;
  const payload = { email: toSafeString(email).toLowerCase(), issuedAt, expiresAt, purpose, ...extra };
  const payloadJson = JSON.stringify(payload);
  const payloadPart = base64UrlEncode(Buffer.from(payloadJson, 'utf8'));
  const signature = crypto.createHmac('sha256', normalizedSecret).update(payloadPart).digest();
  const signaturePart = base64UrlEncode(signature);
  return `${payloadPart}.${signaturePart}`;
};

const verifyToken = (token, { secret = process.env.PERSONAL_GATE_SECRET, purpose, now = Math.floor(Date.now() / 1000) } = {}) => {
  const normalizedSecret = toSafeString(secret);
  if (!normalizedSecret || !token || typeof token !== 'string') return null;

  const [payloadPart, signaturePart] = token.split('.');
  if (!payloadPart || !signaturePart) return null;

  let payloadBuffer;
  try {
    payloadBuffer = base64UrlDecode(payloadPart);
  } catch {
    return null;
  }

  let payload;
  try {
    payload = JSON.parse(payloadBuffer.toString('utf8'));
  } catch {
    return null;
  }

  const expectedSignature = crypto.createHmac('sha256', normalizedSecret).update(payloadPart).digest();
  let providedSignature;
  try {
    providedSignature = base64UrlDecode(signaturePart);
  } catch {
    return null;
  }

  if (providedSignature.length !== expectedSignature.length) return null;
  if (!crypto.timingSafeEqual(providedSignature, expectedSignature)) return null;

  if (purpose && payload.purpose !== purpose) return null;
  if (!payload.email || typeof payload.email !== 'string') return null;
  if (!Number.isFinite(payload.issuedAt) || !Number.isFinite(payload.expiresAt)) return null;
  if (payload.expiresAt <= now) return null;

  return payload;
};

export const parseScryptHash = (value) => {
  const raw = toSafeString(value);
  const parts = raw.split(':');
  if (parts.length < 3 || parts[0] !== 'scrypt') return null;

  const salt = parts[1];
  const hash = parts.slice(2).join(':');
  if (!salt || !hash) return null;

  let hashBuffer = null;
  if (/^[0-9a-f]+$/i.test(hash) && hash.length % 2 === 0) {
    hashBuffer = Buffer.from(hash, 'hex');
  } else {
    try {
      hashBuffer = base64UrlDecode(hash);
    } catch {
      try {
        hashBuffer = Buffer.from(hash, 'base64');
      } catch {
        return null;
      }
    }
  }

  if (!hashBuffer?.length) return null;
  return { salt, hashBuffer };
};

export const verifyScryptPassword = async (password, storedHash) => {
  const parsed = parseScryptHash(storedHash);
  if (!parsed) return false;

  const derived = await new Promise((resolve, reject) => {
    crypto.scrypt(password, parsed.salt, parsed.hashBuffer.length, (error, key) => {
      if (error) reject(error);
      else resolve(key);
    });
  });

  if (!Buffer.isBuffer(derived) || derived.length !== parsed.hashBuffer.length) return false;
  return crypto.timingSafeEqual(derived, parsed.hashBuffer);
};

export const signMainToken = ({ email, userId, secret, ttlSeconds = MAIN_TTL_SECONDS }) => {
  return signToken({ email, secret, ttlSeconds, purpose: 'personal_os_main', userId });
};

export const signGateToken = ({ email, secret, ttlSeconds = GATE_DEFAULT_TTL_SECONDS, purpose = 'personal_os' }) => {
  return signToken({ email, secret, ttlSeconds, purpose });
};

export const verifyMainToken = (token, { secret, now } = {}) => {
  return verifyToken(token, { secret, purpose: 'personal_os_main', now });
};

export const verifyGateToken = (token, { secret, purpose = 'personal_os', now } = {}) => {
  return verifyToken(token, { secret, purpose, now });
};

export const getPersonalGateCookies = (req) => {
  const cookies = parseCookies(req.headers?.cookie);
  const mainToken = verifyMainToken(cookies[PERSONAL_OS_MAIN_COOKIE]);
  const gateToken = verifyGateToken(cookies[PERSONAL_OS_GATE_COOKIE]);

  return {
    mainToken,
    gateToken,
    cookies,
  };
};

export const requirePersonalAccess = async (req) => {
  const cookies = parseCookies(req.headers?.cookie);

  const mainToken = verifyMainToken(cookies[PERSONAL_OS_MAIN_COOKIE]);
  const gateToken = verifyGateToken(cookies[PERSONAL_OS_GATE_COOKIE]);

  const email = mainToken?.email || '';
  const emailAuthenticated = Boolean(mainToken?.email);
  const allowedEmail = emailAuthenticated;
  const secondFactorPassed = Boolean(gateToken?.email && gateToken.email === email);

  return {
    allowedEmail,
    emailAuthenticated,
    secondFactorPassed,
    email: email || undefined,
    userId: mainToken?.userId || undefined,
    mainToken,
    osGate: gateToken,
  };
};

export const createMainCookie = (req, { email, userId, displayName, ttlSeconds = MAIN_TTL_SECONDS }) => {
  const token = signMainToken({ email, userId, displayName, ttlSeconds });
  return `${PERSONAL_OS_MAIN_COOKIE}=${token}; ${buildCookieAttributes(req, ttlSeconds)}`;
};

export const createPersonalGateCookie = (req, { email, ttlSeconds = GATE_DEFAULT_TTL_SECONDS }) => {
  const token = signGateToken({ email, ttlSeconds });
  return `${PERSONAL_OS_GATE_COOKIE}=${token}; ${buildCookieAttributes(req, ttlSeconds)}`;
};

export const clearPersonalAuthCookies = (req) => [
  `${LEGACY_PERSONAL_COOKIE}=; ${buildClearedCookieAttributes(req)}`,
  `${PERSONAL_OS_MAIN_COOKIE}=; ${buildClearedCookieAttributes(req)}`,
  `${PERSONAL_OS_GATE_COOKIE}=; ${buildClearedCookieAttributes(req)}`,
];

export const PERSONAL_COOKIE_NAMES = {
  main: PERSONAL_OS_MAIN_COOKIE,
  gate: PERSONAL_OS_GATE_COOKIE,
};

export const PERSONAL_AUTH_TTLS = {
  mainSeconds: MAIN_TTL_SECONDS,
  gateDefaultSeconds: GATE_DEFAULT_TTL_SECONDS,
  gateRememberSeconds: GATE_REMEMBER_TTL_SECONDS,
};
