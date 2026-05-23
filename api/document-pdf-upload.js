import { createClient } from '@supabase/supabase-js';

const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const BUCKET_NAME = 'generated-documents';
const MAX_BASE64_LENGTH = 15 * 1024 * 1024;
const MAX_PDF_BYTES = 12 * 1024 * 1024;

const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false },
  });
};

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

const isAuthenticated = (req) => {
  const cookies = parseCookies(req.headers?.cookie);
  return cookies[COOKIE_NAME] === COOKIE_VALUE;
};

const readBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') return req.body;
  return {};
};

const toSafeJson = (res, status, body) => res.status(status).json(body);

const safeFileName = (fileName) => {
  const normalized = String(fileName || 'document.pdf')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9.-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (!normalized) return 'document.pdf';
  if (normalized.endsWith('.pdf')) return normalized;
  return `${normalized}.pdf`;
};

const extractBase64 = (value) => {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const commaIndex = raw.indexOf(',');
  if (raw.startsWith('data:') && commaIndex !== -1) {
    return raw.slice(commaIndex + 1).replace(/\s+/g, '');
  }
  return raw.replace(/\s+/g, '');
};

const decodePdfBytes = (pdfBase64) => {
  const normalized = extractBase64(pdfBase64);
  if (!normalized) {
    return null;
  }

  if (normalized.length > MAX_BASE64_LENGTH) {
    return { tooLarge: true };
  }

  try {
    const buffer = Buffer.from(normalized, 'base64');
    if (!buffer.length || buffer.length > MAX_PDF_BYTES) {
      return { tooLarge: buffer.length > MAX_PDF_BYTES };
    }
    return { buffer };
  } catch {
    return null;
  }
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return toSafeJson(res, 500, { success: false, error: 'Storage configuration is unavailable.' });
  }

  if (!isAuthenticated(req)) {
    return toSafeJson(res, 401, { success: false, error: 'Unauthorized' });
  }

  if (req.method === 'GET') {
    const documentId = String(req.query?.documentId || '').trim();
    if (!documentId) {
      return toSafeJson(res, 400, { success: false, error: 'Missing documentId.' });
    }

    const { data: row, error: rowError } = await supabase
      .from('generated_documents')
      .select('pdf_storage_path')
      .eq('id', documentId)
      .maybeSingle();

    if (rowError) {
      console.error('[Document PDF] Failed to fetch generated document', { documentId, error: rowError });
      return toSafeJson(res, 500, { success: false, error: 'Unable to load stored PDF.' });
    }

    const storagePath = row?.pdf_storage_path;
    if (!storagePath) {
      return toSafeJson(res, 404, { success: false, error: 'No stored PDF found.' });
    }

    const { data: signedUrlData, error: signedUrlError } = await supabase
      .storage
      .from(BUCKET_NAME)
      .createSignedUrl(storagePath, 60 * 60);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[Document PDF] Failed to create signed URL', { documentId, storagePath, error: signedUrlError });
      return toSafeJson(res, 500, { success: false, error: 'Unable to create signed PDF link.' });
    }

    return toSafeJson(res, 200, { success: true, signedUrl: signedUrlData.signedUrl });
  }

  if (req.method === 'POST') {
    const body = readBody(req);
    const documentId = String(body?.documentId || '').trim();
    const fileName = String(body?.fileName || '').trim();
    const pdfBase64 = String(body?.pdfBase64 || '').trim();

    if (!documentId || !fileName || !pdfBase64) {
      return toSafeJson(res, 400, { success: false, error: 'Missing documentId, fileName, or pdfBase64.' });
    }

    if (!/\.pdf$/i.test(fileName)) {
      return toSafeJson(res, 400, { success: false, error: 'fileName must end with .pdf.' });
    }

    const decoded = decodePdfBytes(pdfBase64);
    if (!decoded) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid PDF payload.' });
    }

    if (decoded.tooLarge) {
      return toSafeJson(res, 413, { success: false, error: 'PDF payload is too large.' });
    }

    const timestamp = Date.now();
    const safeName = safeFileName(fileName);
    const storagePath = `${documentId}/${timestamp}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, decoded.buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Document PDF] Storage upload failed', { documentId, storagePath, error: uploadError });
      return toSafeJson(res, 500, { success: false, error: 'Unable to store PDF.' });
    }

    const { error: updateError } = await supabase
      .from('generated_documents')
      .update({ pdf_storage_path: storagePath, updated_at: new Date().toISOString() })
      .eq('id', documentId);

    if (updateError) {
      console.error('[Document PDF] Database update failed', { documentId, storagePath, error: updateError });
      return toSafeJson(res, 500, { success: false, error: 'PDF stored, but document record could not be updated.' });
    }

    return toSafeJson(res, 200, {
      success: true,
      storagePath,
      message: 'PDF stored successfully.',
    });
  }

  return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
}
