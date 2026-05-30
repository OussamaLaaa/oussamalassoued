import { lazy, type ComponentType, type LazyExoticComponent } from 'react';

const CHUNK_RELOADED_KEY = 'personalOS.chunkReloaded';

function isChunkError(error: unknown): boolean {
  const msg =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : '';
  return (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('Importing a module script failed') ||
    msg.includes('Loading chunk') ||
    msg.includes('ChunkLoadError')
  );
}

export function clearChunkReloadedFlag(): void {
  try {
    sessionStorage.removeItem(CHUNK_RELOADED_KEY);
  } catch {}
}

export function lazyWithRetry<T extends ComponentType<unknown>>(
  importer: () => Promise<{ default: T }>,
): LazyExoticComponent<T> {
  const retryingImporter = async (): Promise<{ default: T }> => {
    try {
      clearChunkReloadedFlag();
      return await importer();
    } catch (error: unknown) {
      if (isChunkError(error)) {
        try {
          const alreadyReloaded = sessionStorage.getItem(CHUNK_RELOADED_KEY);
          if (!alreadyReloaded) {
            sessionStorage.setItem(CHUNK_RELOADED_KEY, '1');
            window.location.reload();
            await new Promise(() => {});
          }
        } catch {}
      }
      throw error;
    }
  };
  return lazy(retryingImporter);
}
