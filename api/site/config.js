import { loadPublicSiteConfig } from '../../server/lib/siteContent.js';

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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
