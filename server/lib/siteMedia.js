import { createClient } from '@supabase/supabase-js';

const BUCKET_NAME = 'site-media';
const MAX_DECODED_BYTES = 5 * 1024 * 1024;

const MIME_EXT_MAP = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/avif': 'avif',
  'image/svg+xml': 'svg',
};

function createSiteSupabaseClient() {
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

function getFileExtension(contentType, fileName) {
  if (MIME_EXT_MAP[contentType]) return MIME_EXT_MAP[contentType];
  const dotIndex = (fileName || '').lastIndexOf('.');
  if (dotIndex !== -1) return fileName.slice(dotIndex + 1).toLowerCase();
  return 'bin';
}

function generateUuid() {
  return crypto.randomUUID();
}

async function uploadSiteMedia({ fileName, contentType, dataUrl, section, linkedItemId, altText }) {
  const supabase = createSiteSupabaseClient();
  if (!supabase) {
    throw Object.assign(new Error('Supabase not configured'), { code: 'SUPABASE_MEDIA_NOT_CONFIGURED' });
  }

  const parsed = parseDataUrl(dataUrl);
  if (!parsed) {
    throw Object.assign(new Error('Invalid data URL'), { code: 'INVALID_DATA_URL' });
  }

  const buffer = Buffer.from(parsed.base64, 'base64');
  if (!buffer.length) {
    throw Object.assign(new Error('Empty file data'), { code: 'EMPTY_FILE' });
  }

  if (buffer.length > MAX_DECODED_BYTES) {
    throw Object.assign(new Error('File too large'), { code: 'FILE_TOO_LARGE' });
  }

  const ext = getFileExtension(contentType, fileName);
  const storageFileName = `${generateUuid()}.${ext}`;
  const storagePath = storageFileName;

  const blob = new Blob([buffer], { type: contentType });

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, blob, {
      contentType,
      upsert: false,
      duplex: 'half',
    });

  if (uploadError) {
    throw Object.assign(uploadError, { code: 'STORAGE_UPLOAD_FAILED' });
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(storagePath);

  const publicUrl = publicUrlData?.publicUrl || '';

  const { data: mediaRow, error: insertError } = await supabase
    .from('site_media')
    .insert({
      file_name: fileName,
      storage_path: storagePath,
      public_url: publicUrl,
      bucket: BUCKET_NAME,
      content_type: contentType,
      size_bytes: buffer.length,
      section: section || null,
      linked_item_id: linkedItemId || null,
      alt_text: altText || null,
    })
    .select('id')
    .single();

  if (insertError) {
    throw Object.assign(insertError, { code: 'MEDIA_META_INSERT_FAILED' });
  }

  return {
    publicUrl,
    storagePath,
    mediaId: mediaRow.id,
  };
}

export { createSiteSupabaseClient, parseDataUrl, getFileExtension, generateUuid, uploadSiteMedia, BUCKET_NAME, MAX_DECODED_BYTES };
