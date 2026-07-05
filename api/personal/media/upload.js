import { uploadSiteMedia, isAllowedContentType } from '../../../server/lib/siteMedia.js';
import { requirePersonalAccess } from '../../../server/lib/personalAuth.js';

function readBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); }
    catch { return {}; }
  }
  if (typeof req.body === 'object') return req.body;
  return {};
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const access = await requirePersonalAccess(req);
  if (!access.emailAuthenticated || !access.allowedEmail || !access.secondFactorPassed) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const body = readBody(req);

  if (!body || !body.fileName || !body.contentType || !body.dataUrl) {
    return res.status(400).json({ success: false, error: 'Invalid upload payload' });
  }

  if (!isAllowedContentType(body.contentType)) {
    return res.status(400).json({ success: false, error: 'File type not allowed' });
  }

  try {
    const result = await uploadSiteMedia({
      fileName: body.fileName,
      contentType: body.contentType,
      dataUrl: body.dataUrl,
      section: body.section || 'personal_finance',
      linkedItemId: body.linkedItemId || null,
      altText: body.altText || null,
    });

    return res.status(200).json({
      success: true,
      publicUrl: result.publicUrl,
      storagePath: result.storagePath,
      mediaId: result.mediaId,
    });
  } catch (err) {
    console.error('[Personal Media Upload] Failed:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Upload failed',
      code: err?.code || 'UNKNOWN',
    });
  }
}
