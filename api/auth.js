const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const getCookieDomain = (req) => {
  const host = String(req.headers?.host || '').split(':')[0].toLowerCase();
  if (host === 'oussamalassoued.me' || host === 'www.oussamalassoued.me') {
    return 'Domain=.oussamalassoued.me; ';
  }

  return '';
};

const buildCookieAttributes = (req) => `${getCookieDomain(req)}Path=/; HttpOnly; SameSite=Strict${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`;

const parseCookies = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};

  return cookieHeader.split(';').reduce((accumulator, part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) return accumulator;

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (key) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
};

export default (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  
  // GET - Check auth
  if (req.method === 'GET') {
    const cookies = parseCookies(req.headers?.cookie);
    const authenticated = cookies[COOKIE_NAME] === COOKIE_VALUE;
    return res.status(200).json({ success: true, authenticated });
  }
  
  // POST - Login
  if (req.method === 'POST') {
    let body = {};
    try {
      if (req.body && typeof req.body === 'string') {
        body = JSON.parse(req.body);
      } else if (req.body && typeof req.body === 'object') {
        body = req.body;
      }
    } catch (e) {
      // ignore
    }
    
    const password = String(body?.password || '').trim();
    const correct = process.env.DASHBOARD_PASSWORD || '00000008';
    
    if (password === correct) {
      res.setHeader('Set-Cookie', `${COOKIE_NAME}=${COOKIE_VALUE}; ${buildCookieAttributes(req)}; Max-Age=43200`);
      return res.status(200).json({ success: true, authenticated: true });
    }
    
    return res.status(401).json({ success: false, authenticated: false, error: 'Invalid password' });
  }
  
  // DELETE - Logout
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', `${COOKIE_NAME}=; ${buildCookieAttributes(req)}; Max-Age=0`);
    return res.status(200).json({ success: true, authenticated: false });
  }
  
  // OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};
