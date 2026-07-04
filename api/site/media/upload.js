import { uploadSiteMedia } from '../../../server/lib/siteMedia.js';

const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';

function parseCookies(cookieHeader) {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};
  return cookieHeader.split(';').reduce((acc, part) => {
    const idx = part.indexOf('=');
    if (idx === -1) return acc;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) acc[key] = val;
    return acc;
  }, {});
}

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

  const cookies = parseCookies(req.headers?.cookie);
  if (cookies[COOKIE_NAME] !== COOKIE_VALUE) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const body = readBody(req);

  if (!body || !body.fileName || !body.contentType || !body.dataUrl) {
    return res.status(400).json({ success: false, error: 'Invalid upload payload' });
  }

  if (!body.contentType.startsWith('image/')) {
    return res.status(400).json({ success: false, error: 'Invalid upload payload' });
  }

  const dataUrlMatch = typeof body.dataUrl === 'string' && body.dataUrl.match(/^data:([^;]+);base64,/);
  if (!dataUrlMatch) {
    return res.status(400).json({ success: false, error: 'Invalid upload payload' });
  }

  try {
    const result = await uploadSiteMedia({
      fileName: body.fileName,
      contentType: body.contentType,
      dataUrl: body.dataUrl,
      section: body.section || 'projects',
      linkedItemId: body.linkedItemId || null,
      altText: body.altText || null,
    });

    return res.status(200).json({
      success: true,
      publicUrl: result.publicUrl,
      storagePath: result.storagePath,
      mediaId: result.mediaId,
    });
  } catch (error) {
    if (error.code === 'FILE_TOO_LARGE') {
      return res.status(413).json({ success: false, error: 'File too large' });
    }

    if (error.code === 'SUPABASE_MEDIA_NOT_CONFIGURED' || error.code === 'STORAGE_UPLOAD_FAILED') {
      return res.status(500).json({ success: false, error: 'Failed to upload media' });
    }

    return res.status(500).json({ success: false, error: 'Failed to upload media' });
  }
}
