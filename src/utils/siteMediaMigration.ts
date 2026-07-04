import { API_BASE_URL } from '../config/runtimeConfig';

interface EmbeddedMediaItem {
  path: string;
  dataUrl: string;
  contentType: string;
  fileName: string;
  section: string;
  linkedItemId?: string;
}

export interface MigrationResult {
  config: Record<string, unknown>;
  migratedCount: number;
  migratedPaths: string[];
  skippedCount: number;
  skippedPaths: string[];
  payloadSizeBefore: number;
  payloadSizeAfter: number;
}

interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

function inferContentType(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(',');
  if (commaIndex === -1) return 'image/png';
  const header = dataUrl.substring(0, commaIndex);
  const contentType = header.replace('data:', '').replace(';base64', '');
  return contentType || 'image/png';
}

function inferExtension(contentType: string): string {
  const map: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
    'image/webp': 'webp',
    'image/svg+xml': 'svg',
    'audio/mpeg': 'mp3',
    'audio/mp3': 'mp3',
    'audio/ogg': 'ogg',
    'audio/wav': 'wav',
    'audio/webm': 'webm',
  };
  return map[contentType] || 'bin';
}

function inferSectionFromPath(path: string): string {
  const first = path.split(/[.[\]/]/)[0];
  const sectionMap: Record<string, string> = {
    projects: 'projects',
    testimonials: 'testimonials',
    articles: 'articles',
    videos: 'videos',
    scene05: 'about',
    persistentUI: 'persistent_ui',
    dashboard: 'browser_identity',
    partners: 'partners',
    socialPosts: 'social_posts',
    financialTransactions: 'financial',
    emails: 'emails',
  };
  return sectionMap[first] || first || 'general';
}

function inferFileName(path: string, extension: string): string {
  const sanitized = path.replace(/[\[\]\.]/g, '-').replace(/--+/g, '-').replace(/^-|-$/g, '');
  return `${sanitized}.${extension}`;
}

function findEmbeddedMediaInConfig(config: unknown, path = ''): EmbeddedMediaItem[] {
  const items: EmbeddedMediaItem[] = [];

  if (typeof config === 'string') {
    if (config.startsWith('data:image/') || config.startsWith('data:audio/')) {
      const contentType = inferContentType(config);
      const extension = inferExtension(contentType);
      const fileName = inferFileName(path, extension);
      const section = inferSectionFromPath(path);
      items.push({
        path,
        dataUrl: config,
        contentType,
        fileName,
        section,
      });
    }
    return items;
  }

  if (Array.isArray(config)) {
    config.forEach((item, index) => {
      const childMedia = findEmbeddedMediaInConfig(item, `${path}[${index}]`);
      if (item && typeof item === 'object' && 'id' in item && item.id != null) {
        for (const media of childMedia) {
          media.linkedItemId = String((item as Record<string, unknown>).id);
        }
      }
      items.push(...childMedia);
    });
    return items;
  }

  if (config && typeof config === 'object') {
    for (const [key, value] of Object.entries(config as Record<string, unknown>)) {
      items.push(...findEmbeddedMediaInConfig(value, path ? `${path}.${key}` : key));
    }
  }

  return items;
}

function setValueAtPath(obj: Record<string, unknown>, path: string, value: string): void {
  const segments = path.match(/[^.[\]]+/g);
  if (!segments || segments.length === 0) return;

  let current: unknown = obj;
  for (let i = 0; i < segments.length - 1; i++) {
    const key = segments[i];
    const next = (current as Record<string, unknown>)[key];
    if (next === undefined || next === null) return;
    current = next;
  }
  const lastKey = segments[segments.length - 1];
  (current as Record<string, unknown>)[lastKey] = value;
}

async function uploadDataUrl(
  dataUrl: string,
  fileName: string,
  contentType: string,
  section: string,
  linkedItemId?: string,
): Promise<UploadResult> {
  try {
    const response = await fetch(`${API_BASE_URL}/site/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fileName,
        contentType,
        dataUrl,
        section: section || 'general',
        linkedItemId: linkedItemId || null,
        altText: null,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Upload failed' };
    }

    return { success: true, publicUrl: result.publicUrl };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}

export async function replaceEmbeddedMediaWithStorageUrls(
  config: Record<string, unknown>,
): Promise<MigrationResult> {
  const rawJson = JSON.stringify(config);
  const payloadSizeBefore = new TextEncoder().encode(rawJson).length;

  const clonedConfig: Record<string, unknown> = JSON.parse(rawJson);

  const embeddedItems = findEmbeddedMediaInConfig(clonedConfig);

  if (embeddedItems.length === 0) {
    console.log(`[Media Cleanup] No embedded media found. Payload: ${payloadSizeBefore} bytes`);
    return {
      config: clonedConfig,
      migratedCount: 0,
      migratedPaths: [],
      skippedCount: 0,
      skippedPaths: [],
      payloadSizeBefore,
      payloadSizeAfter: payloadSizeBefore,
    };
  }

  const svgItems = embeddedItems.filter(i => i.contentType === 'image/svg+xml');
  const uploadItems = embeddedItems.filter(i => i.contentType !== 'image/svg+xml');

  for (const svg of svgItems) {
    console.log(`[Media Cleanup] Skipped SVG data URL at path: ${svg.path}`);
  }

  console.log(`[Media Cleanup] Found ${uploadItems.length} item(s) to upload, ${svgItems.length} SVG(s) skipped.`);
  const migratedPaths: string[] = [];
  const skippedPaths: string[] = svgItems.map(i => i.path);

  for (const item of uploadItems) {
    console.log(`[Media Cleanup] Uploading ${item.path} (${item.contentType})`);
    const result = await uploadDataUrl(
      item.dataUrl,
      item.fileName,
      item.contentType,
      item.section,
      item.linkedItemId,
    );

    if (!result.success || !result.publicUrl) {
      throw new Error(
        `Could not upload embedded media at "${item.path}": ${result.error || 'Upload failed'}. Save was stopped to avoid timeout.`,
      );
    }

    setValueAtPath(clonedConfig, item.path, result.publicUrl);
    migratedPaths.push(item.path);
  }

  const payloadSizeAfter = new TextEncoder().encode(JSON.stringify(clonedConfig)).length;

  console.log(`[Media Cleanup] Migrated ${migratedPaths.length} item(s).`);
  console.log(`[Media Cleanup] Payload before: ${payloadSizeBefore} bytes`);
  console.log(`[Media Cleanup] Payload after: ${payloadSizeAfter} bytes`);

  return {
    config: clonedConfig,
    migratedCount: migratedPaths.length,
    migratedPaths,
    skippedCount: skippedPaths.length,
    skippedPaths,
    payloadSizeBefore,
    payloadSizeAfter,
  };
}
