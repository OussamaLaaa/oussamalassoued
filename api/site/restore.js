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

function readBody(req) {
  if (!req.body) return null;
  if (typeof req.body === 'string') {
    try { return JSON.parse(req.body); }
    catch { return null; }
  }
  if (typeof req.body === 'object') return req.body;
  return null;
}

function createSupabaseClient() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  });
}

function parseDataUrl(dataUrl) {
  if (typeof dataUrl !== 'string') return null;
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;
  return { mimeType: match[1], base64: match[2].replace(/\s+/g, '') };
}

function generateUuid() {
  return crypto.randomUUID();
}

function getExtension(contentType) {
  const map = {
    'image/jpeg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/avif': 'avif',
    'image/svg+xml': 'svg',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
  };
  return map[contentType] || 'bin';
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
  if (!body) {
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }

  if (body.type !== 'oussama-site-backup') {
    return res.status(400).json({ success: false, error: 'Invalid backup: wrong type' });
  }

  if (body.backupVersion !== 1) {
    return res.status(400).json({ success: false, error: 'Invalid backup: unsupported version' });
  }

  if (!Array.isArray(body.siteContent)) {
    return res.status(400).json({ success: false, error: 'Invalid backup: siteContent must be an array' });
  }

  for (const item of body.siteContent) {
    if (!item.section || typeof item.section !== 'string') {
      return res.status(400).json({ success: false, error: `Invalid backup: siteContent item missing section` });
    }
    if (item.data === undefined || item.data === null || (typeof item.data !== 'object' && !Array.isArray(item.data))) {
      return res.status(400).json({ success: false, error: `Invalid backup: siteContent item "${item.section}" has invalid data` });
    }
  }

  const supabase = createSupabaseClient();
  if (!supabase) {
    return res.status(500).json({ success: false, error: 'Supabase not configured' });
  }

  const warnings = [];
  const restoredSections = [];
  let restoredMediaCount = 0;

  // 1. Restore site_content
  if (body.siteContent.length > 0) {
    const now = new Date().toISOString();
    const rows = body.siteContent.map((s) => ({
      section: s.section,
      data: s.data,
      is_public: s.isPublic !== false,
      updated_at: now,
    }));

    const { error: upsertError } = await supabase
      .from('site_content')
      .upsert(rows, { onConflict: 'section', ignoreDuplicates: false });

    if (upsertError) {
      return res.status(500).json({ success: false, error: 'Failed to restore site content' });
    }

    restoredSections.push(...rows.map((r) => r.section));
  }

  // 2. Restore media files if present
  if (Array.isArray(body.mediaFiles) && body.mediaFiles.length > 0) {
    const oldToNewUrl = new Map();
    const BUCKET_NAME = 'site-media';

    for (const mediaFile of body.mediaFiles) {
      if (!mediaFile.dataUrl) {
        warnings.push(`Skipped ${mediaFile.storagePath}: no data URL`);
        continue;
      }

      const parsed = parseDataUrl(mediaFile.dataUrl);
      if (!parsed) {
        warnings.push(`Skipped ${mediaFile.storagePath}: invalid data URL`);
        continue;
      }

      const buffer = Buffer.from(parsed.base64, 'base64');
      const ext = getExtension(parsed.mimeType);
      const storageFileName = `${generateUuid()}.${ext}`;

      const blob = new Blob([buffer], { type: parsed.mimeType });

      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storageFileName, blob, {
          contentType: parsed.mimeType,
          upsert: false,
          duplex: 'half',
        });

      if (uploadError) {
        warnings.push(`Failed to upload ${mediaFile.storagePath}: ${uploadError.message}`);
        continue;
      }

      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storageFileName);

      const publicUrl = publicUrlData?.publicUrl || '';

      const { error: insertError } = await supabase
        .from('site_media')
        .insert({
          file_name: mediaFile.fileName,
          storage_path: storageFileName,
          public_url: publicUrl,
          bucket: BUCKET_NAME,
          content_type: parsed.mimeType,
          size_bytes: buffer.length,
          section: mediaFile.section || null,
          linked_item_id: mediaFile.linkedItemId || null,
          alt_text: mediaFile.altText || null,
        });

      if (insertError) {
        warnings.push(`Media file restored but metadata insert failed for ${mediaFile.storagePath}: ${insertError.message}`);
      }

      oldToNewUrl.set(mediaFile.storagePath, publicUrl);
      restoredMediaCount++;
    }

    // 3. Remap old URLs in siteContent to new public URLs
    if (oldToNewUrl.size > 0 && body.siteContent.length > 0) {
      const now = new Date().toISOString();
      for (const section of body.siteContent) {
        const dataStr = JSON.stringify(section.data);
        let newDataStr = dataStr;

        for (const [oldStoragePath, newPublicUrl] of oldToNewUrl) {
          const escapedStoragePath = oldStoragePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          newDataStr = newDataStr.replace(new RegExp(escapedStoragePath, 'g'), newPublicUrl);
        }

        if (newDataStr !== dataStr) {
          try {
            const parsedData = JSON.parse(newDataStr);
            const { error: updateError } = await supabase
              .from('site_content')
              .update({ data: parsedData, updated_at: now })
              .eq('section', section.section);

            if (updateError) {
              warnings.push(`Failed to remap URLs in section ${section.section}`);
            }
          } catch {
            warnings.push(`URL remapping produced invalid JSON for section ${section.section}`);
          }
        }
      }
    }
  } else if (Array.isArray(body.siteMedia) && body.siteMedia.length > 0) {
    warnings.push('This backup references existing media URLs but does not include media files.');
  }

  return res.status(200).json({
    success: true,
    restoredSections,
    restoredMediaCount,
    warnings,
  });
}
