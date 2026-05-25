import crypto from 'crypto';

const PERSONAL_OS_COOKIE = 'personal_os_gate';
const LEGACY_PERSONAL_COOKIE = 'personal_google_gate';
const DEFAULT_GATE_TTL_SECONDS = 60 * 60 * 24 * 7;
const REMEMBER_DEVICE_TTL_SECONDS = 60 * 60 * 24 * 30;

const toSafeString = (value) => (value == null ? '' : String(value).trim());

export const parseAllowedEmails = (value = process.env.PERSONAL_ALLOWED_EMAILS || '') => {
  const emails = new Set();
  for (const entry of String(value).split(/[\s,;]+/)) {
    const email = entry.trim().toLowerCase();
    if (email) emails.add(email);
  }
  return emails;
};

export const isEmailAllowed = (email, allowedEmails = parseAllowedEmails()) => {
  const normalized = toSafeString(email).toLowerCase();
  return Boolean(normalized) && allowedEmails.has(normalized);
};

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

export const buildGateCookieAttributes = (req, maxAgeSeconds = DEFAULT_GATE_TTL_SECONDS) => {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${getCookieDomainPrefix(req)}Path=/; HttpOnly; SameSite=Strict${secureFlag}; Max-Age=${maxAgeSeconds}`;
};

export const buildClearedGateCookieAttributes = (req) => {
  const secureFlag = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${getCookieDomainPrefix(req)}Path=/; HttpOnly; SameSite=Strict${secureFlag}; Max-Age=0`;
};

export const signGateToken = ({ email, secret = process.env.PERSONAL_GATE_SECRET, ttlSeconds = DEFAULT_GATE_TTL_SECONDS, purpose = 'personal_os' }) => {
  const normalizedSecret = toSafeString(secret);
  if (!normalizedSecret) {
    throw new Error('Missing PERSONAL_GATE_SECRET');
  }

  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + ttlSeconds;
  const payload = { email: toSafeString(email).toLowerCase(), issuedAt, expiresAt, purpose };
  const payloadJson = JSON.stringify(payload);
  const payloadPart = base64UrlEncode(Buffer.from(payloadJson, 'utf8'));
  const signature = crypto.createHmac('sha256', normalizedSecret).update(payloadPart).digest();
  const signaturePart = base64UrlEncode(signature);
  return `${payloadPart}.${signaturePart}`;
};

export const verifyGateToken = (token, { secret = process.env.PERSONAL_GATE_SECRET, purpose, now = Math.floor(Date.now() / 1000) } = {}) => {
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

  return {
    email: toSafeString(payload.email).toLowerCase(),
    issuedAt: Number(payload.issuedAt),
    expiresAt: Number(payload.expiresAt),
    purpose: toSafeString(payload.purpose),
  };
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

export const getPersonalGateCookies = (req) => {
  const cookies = parseCookies(req.headers?.cookie);
  const osGate = verifyGateToken(cookies[PERSONAL_OS_COOKIE]);

  return {
    osGate,
    cookies,
  };
};

const getSupabaseUrl = () => toSafeString(process.env.SUPABASE_URL);

const getSupabaseApiKey = () => toSafeString(
  process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY,
);

export const verifySupabaseAccessToken = async (accessToken) => {
  const supabaseUrl = getSupabaseUrl();
  const apiKey = getSupabaseApiKey();
  const token = toSafeString(accessToken);

  if (!supabaseUrl || !apiKey || !token) return null;

  const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
    method: 'GET',
    headers: {
      apikey: apiKey,
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) return null;

  try {
    return await response.json();
  } catch {
    return null;
  }
};

export const extractBearerToken = (req) => {
  const header = String(req.headers?.authorization || req.headers?.Authorization || '').trim();
  if (!header.toLowerCase().startsWith('bearer ')) return '';
  return header.slice(7).trim();
};

export const requirePersonalAccess = async (req) => {
  const allowedEmails = parseAllowedEmails();
  const cookies = parseCookies(req.headers?.cookie);
  const accessToken = extractBearerToken(req);

  let supabaseUser = null;
  if (accessToken) {
    supabaseUser = await verifySupabaseAccessToken(accessToken);
  }

  const email = toSafeString(
    supabaseUser?.email,
  ).toLowerCase();
  const allowedEmail = isEmailAllowed(email, allowedEmails);
  const secondFactorPassed = Boolean(osGate && osGate.email === email);
  const emailAuthenticated = Boolean(supabaseUser);

  return {
    allowedEmail,
    emailAuthenticated,
    secondFactorPassed,
    email: email || undefined,
    supabaseUser,
    osGate,
  };
};

export const createPersonalGateCookie = (req, { email, ttlSeconds = DEFAULT_GATE_TTL_SECONDS }) => {
  const token = signGateToken({ email, ttlSeconds });
  return `${PERSONAL_OS_COOKIE}=${token}; ${buildGateCookieAttributes(req, ttlSeconds)}`;
};

export const clearPersonalGateCookies = (req) => [
  `${LEGACY_PERSONAL_COOKIE}=; ${buildClearedGateCookieAttributes(req)}`,
  `${PERSONAL_OS_COOKIE}=; ${buildClearedGateCookieAttributes(req)}`,
];

export const PERSONAL_COOKIE_NAMES = {
  os: PERSONAL_OS_COOKIE,
};

export const PERSONAL_GATE_TTLS = {
  defaultSeconds: DEFAULT_GATE_TTL_SECONDS,
  rememberDeviceSeconds: REMEMBER_DEVICE_TTL_SECONDS,
};