import { API_BASE_URL } from '../config/runtimeConfig';

export interface UploadSiteMediaResult {
  success: boolean;
  publicUrl?: string;
  storagePath?: string;
  mediaId?: string;
  error?: string;
}

export interface UploadSiteMediaOptions {
  section?: string;
  linkedItemId?: string;
  altText?: string;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Invalid file payload.'));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read file.'));
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadSiteMediaFromFile(
  file: File,
  options: UploadSiteMediaOptions = {},
): Promise<UploadSiteMediaResult> {
  try {
    const dataUrl = await readFileAsDataUrl(file);

    const response = await fetch(`${API_BASE_URL}/site/media/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        fileName: file.name,
        contentType: file.type,
        dataUrl,
        section: options.section || 'general',
        linkedItemId: options.linkedItemId || null,
        altText: options.altText || null,
      }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Upload failed' };
    }

    return {
      success: true,
      publicUrl: result.publicUrl,
      storagePath: result.storagePath,
      mediaId: result.mediaId,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Upload failed',
    };
  }
}
