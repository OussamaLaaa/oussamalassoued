import { createClient } from '@supabase/supabase-js';

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

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');

  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

  const cookies = parseCookies(req.headers?.cookie);
  if (cookies[COOKIE_NAME] !== COOKIE_VALUE) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }

  const includeMedia = req.query?.includeMedia === 'true';

  const supabase = createSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase not configured' });
  }

  try {
    const { data: siteContentRows, error: contentError } = await supabase
      .from('site_content')
      .select('section, data, is_public, updated_at')
      .order('section');

    if (contentError) {
      return res.status(500).json({ success: false, error: 'Failed to read site content' });
    }

    const { data: siteMediaRows, error: mediaError } = await supabase
      .from('site_media')
      .select('*')
      .order('created_at', { ascending: false });

    if (mediaError) {
      return res.status(500).json({ success: false, error: 'Failed to read site media' });
    }

    const mediaFiles = [];
    if (includeMedia && siteMediaRows && siteMediaRows.length > 0) {
      const BUCKET_NAME = 'site-media';

      for (const media of siteMediaRows) {
        try {
          const { data: fileData, error: downloadError } = await supabase.storage
            .from(BUCKET_NAME)
            .download(media.storage_path);

          if (downloadError || !fileData) {
            console.warn(`[Backup] Could not download ${media.storage_path}: ${downloadError?.message || 'Unknown error'}`);
            mediaFiles.push({
              storagePath: media.storage_path,
              fileName: media.file_name,
              contentType: media.content_type,
              section: media.section,
              linkedItemId: media.linked_item_id,
              altText: media.alt_text,
              error: downloadError?.message || 'Download failed',
            });
            continue;
          }

          const buffer = Buffer.from(await fileData.arrayBuffer());
          const base64 = buffer.toString('base64');
          const dataUrl = `data:${media.content_type};base64,${base64}`;

          mediaFiles.push({
            storagePath: media.storage_path,
            fileName: media.file_name,
            contentType: media.content_type,
            section: media.section,
            linkedItemId: media.linked_item_id,
            altText: media.alt_text,
            dataUrl,
          });
        } catch (err) {
          console.warn(`[Backup] Error downloading ${media.storage_path}:`, err.message);
          mediaFiles.push({
            storagePath: media.storage_path,
            fileName: media.file_name,
            contentType: media.content_type,
            section: media.section,
            linkedItemId: media.linked_item_id,
            altText: media.alt_text,
            error: err.message || 'Download failed',
          });
        }
      }
    }

    const backup = {
      backupVersion: 1,
      type: 'oussama-site-backup',
      exportedAt: new Date().toISOString(),
      source: 'dashboard',
      siteContent: (siteContentRows || []).map((row) => ({
        section: row.section,
        data: row.data,
        isPublic: row.is_public,
        updatedAt: row.updated_at,
      })),
      siteMedia: (siteMediaRows || []).map((row) => ({
        id: row.id,
        fileName: row.file_name,
        bucket: row.bucket || 'site-media',
        storagePath: row.storage_path,
        publicUrl: row.public_url,
        contentType: row.content_type,
        sizeBytes: row.size_bytes,
        section: row.section,
        linkedItemId: row.linked_item_id,
        altText: row.alt_text,
      })),
      mediaFiles,
    };

    const json = JSON.stringify(backup, null, 2);
    const dateStr = new Date().toISOString().split('T')[0];

    res.setHeader('Content-Disposition', `attachment; filename="site-backup-${dateStr}.json"`);
    return res.status(200).send(json);
  } catch (error) {
    return res.status(500).json({ success: false, error: error.message || 'Backup failed' });
  }
}
