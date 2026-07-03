import { loadPublicSiteConfig, splitSiteConfigIntoSections, saveSiteConfigSections } from '../../server/lib/siteContent.js';

const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';

const parseCookies = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) acc[key] = val;
    return acc;
  }, {});
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  // GET — public, no auth
  if (req.method === 'GET') {
    const debug = req.query?.debug === '1';

    try {
      const result = await loadPublicSiteConfig({ debug });

      const response = {
        success: true,
        config: result.config,
        source: 'supabase',
        updatedAt: result.updatedAt,
      };

      if (debug && result.debugInfo) {
        response.debug = result.debugInfo;
      }

      return res.status(200).json(response);
    } catch (error) {
      const code = error.code || 'SUPABASE_SITE_CONFIG_READ_FAILED';

      if (code === 'SUPABASE_SITE_CONFIG_NOT_CONFIGURED') {
        return res.status(500).json({
          success: false,
          code: 'SUPABASE_SITE_CONFIG_NOT_CONFIGURED',
          error: 'Supabase site config is not configured.',
        });
      }

      return res.status(500).json({
        success: false,
        code: 'SUPABASE_SITE_CONFIG_READ_FAILED',
        error: 'Failed to load site config.',
      });
    }
  }

  // PUT — authenticated, writes full site config to Supabase
  if (req.method === 'PUT') {
    const cookies = parseCookies(req.headers?.cookie);
    if (cookies[COOKIE_NAME] !== COOKIE_VALUE) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    let payload = null;
    try {
      if (req.body && typeof req.body === 'object') {
        payload = req.body;
      } else if (req.body && typeof req.body === 'string') {
        payload = JSON.parse(req.body);
      }
    } catch (e) {
      return res.status(400).json({ success: false, error: 'Invalid JSON body' });
    }

    if (!payload) {
      return res.status(400).json({ success: false, error: 'Request body is required' });
    }

    const config = payload.config || payload;

    if (!config || typeof config !== 'object' || Array.isArray(config)) {
      return res.status(400).json({ success: false, error: 'Invalid config payload' });
    }

    try {
      const sections = splitSiteConfigIntoSections(config);
      if (sections.length === 0) {
        return res.status(400).json({ success: false, error: 'No recognizable config sections to save' });
      }

      const savedSections = await saveSiteConfigSections(sections);

      return res.status(200).json({
        success: true,
        message: 'Site config saved successfully.',
        savedSections,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        code: error.code || 'SITE_CONFIG_SAVE_FAILED',
        error: error.message || 'Failed to save site config.',
      });
    }
  }

  // OPTIONS
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,PUT,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  return res.status(405).json({ success: false, error: 'Method not allowed' });
}
