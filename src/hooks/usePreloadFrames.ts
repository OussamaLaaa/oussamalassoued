import { useState, useEffect } from 'react';

// Injected by vite.config.ts to dynamically read actual folder sizes
declare const __FRAME_COUNTS__: Record<string, number>;
declare const __FRAME_MANIFEST__: Record<string, string[]> | undefined;

const getFrameCountForScene = (sceneName: string): number => {
  const count = __FRAME_COUNTS__[sceneName] ?? 0;
  return count;
};

// Helper to check if AVIF is supported
const supportsAvif = typeof document !== 'undefined' 
  ? (() => {
      const canvas = document.createElement('canvas');
      return canvas.toDataURL('image/avif').startsWith('data:image/avif');
    })()
  : false;
const preferredExt = '.avif';

export const getFramesForScene = (sceneName: string): string[] => {
  const manifestFrames = __FRAME_MANIFEST__?.[sceneName] ?? [];
  if (manifestFrames.length > 0) {
    return manifestFrames.map((frame) => `/frames/${sceneName}/${frame}`);
  }

  const count = getFrameCountForScene(sceneName);
  const generatedFrames = Array.from({ length: count }, (_, index) => {
    const paddedIndex = (index + 1).toString().padStart(3, '0');
    return `/frames/${sceneName}/ezgif-frame-${paddedIndex}${preferredExt}`;
  });

  if (generatedFrames.length === 0) {
    console.warn(`[Frames] No AVIF frames detected for scene "${sceneName}".`);
  }

  return generatedFrames;
};

interface PreloadState {
  progress: number;
  images: Record<string, HTMLImageElement[]>;
  isComplete: boolean;
  isFullyLoaded: boolean;
}

const preloadStateCache = new Map<string, PreloadState>();

const DEFAULT_CRITICAL_FIRST_SCENE_FRAMES = 8;
const CRITICAL_MAX_WAIT_MS = 4000;
const CRITICAL_CHUNK_SIZE = 4;
const BACKGROUND_CHUNK_SIZE = 24;
const BACKGROUND_START_DELAY_MS = 500;

const getConnectionProfile = () => {
  if (typeof navigator === 'undefined') {
    return { effectiveType: '4g', downlink: 10, saveData: false };
  }
  const connection = (navigator as Navigator & { connection?: { effectiveType?: string; downlink?: number; saveData?: boolean } }).connection;
  return {
    effectiveType: connection?.effectiveType ?? '4g',
    downlink: typeof connection?.downlink === 'number' ? connection.downlink : 10,
    saveData: !!connection?.saveData,
  };
};

const getFrameStep = () => {
  const { effectiveType, downlink, saveData } = getConnectionProfile();
  if (saveData) return 4;
  if (effectiveType === '2g' || downlink < 1) return 4;
  if (effectiveType === '3g' || downlink < 3) return 2;
  return 1;
};

export function usePreloadFrames(scenes: string[]) {
  const [frameStep] = useState(() => getFrameStep());
  const scenesKey = `${scenes.join(',')}|step:${frameStep}`;
  const [state, setState] = useState<PreloadState>(() => {
    return (
      preloadStateCache.get(scenesKey) ?? {
        progress: 0,
        images: {},
        isComplete: false,
        isFullyLoaded: false,
      }
    );
  });

  useEffect(() => {
    const cachedState = preloadStateCache.get(scenesKey);
    if (cachedState) {
      setState(cachedState);
      if (cachedState.isFullyLoaded) {
        return;
      }
    }

    if (!supportsAvif) {
      console.warn('[Frames] AVIF is not supported by this browser. Frame images may not render.');
    }

    let mounted = true;
    
    // Get URLs grouped by scene
    const totalScenesUrls: { scene: string; urls: string[] }[] = scenes.map(scene => {
      const rawUrls = getFramesForScene(scene);
      if (frameStep <= 1) {
        return { scene, urls: rawUrls };
      }
      let filteredUrls = rawUrls.filter((_, index) => index % frameStep === 0);
      if (filteredUrls.length === 0 && rawUrls.length > 0) {
        filteredUrls = [rawUrls[0]];
      }
      return { scene, urls: filteredUrls };
    });

    const totalFrames = totalScenesUrls.reduce((acc, curr) => acc + curr.urls.length, 0);
    
    if (totalFrames === 0) {
      console.warn("No frames found to preload. Check your folder structures and Vite glob configuration.");
      const nextState = {
        progress: 100,
        images: {},
        isComplete: true,
        isFullyLoaded: true,
      };
      preloadStateCache.set(scenesKey, nextState);
      setState(nextState);
      return;
    }

    const loadedImagesRecord: Record<string, HTMLImageElement[]> = {};
    scenes.forEach(scene => {
      const sceneLength = totalScenesUrls.find(s => s.scene === scene)?.urls.length || 0;
      const cachedImages = cachedState?.images?.[scene];
      if (cachedImages && cachedImages.length === sceneLength) {
        loadedImagesRecord[scene] = cachedImages.slice();
      } else {
        const nextImages = new Array(sceneLength).fill(null);
        if (cachedImages && cachedImages.length > 0) {
          for (let i = 0; i < Math.min(sceneLength, cachedImages.length); i += 1) {
            nextImages[i] = cachedImages[i] ?? null;
          }
        }
        loadedImagesRecord[scene] = nextImages;
      }
    });

    // تحديد المشهد الأول ونصف عدد إطاراته
    const firstScene = scenes[0];
    const firstSceneUrls = totalScenesUrls.find(s => s.scene === firstScene)?.urls || [];
    const firstSceneFrameCount = firstSceneUrls.length;
    const baseCriticalTarget = frameStep >= 4 ? 2 : frameStep >= 2 ? 4 : DEFAULT_CRITICAL_FIRST_SCENE_FRAMES;
    const criticalFrameTarget = Math.min(firstSceneFrameCount, baseCriticalTarget);

    const isLoadedImage = (image?: HTMLImageElement | null) => {
      return !!image && image.complete && image.naturalWidth > 0;
    };

    let loadedCount = 0;
    scenes.forEach(scene => {
      loadedImagesRecord[scene].forEach((image) => {
        if (isLoadedImage(image)) {
          loadedCount += 1;
        }
      });
    });

    let criticalLoadedCount = 0;
    if (criticalFrameTarget > 0) {
      for (let i = 0; i < criticalFrameTarget; i += 1) {
        if (isLoadedImage(loadedImagesRecord[firstScene]?.[i])) {
          criticalLoadedCount += 1;
        }
      }
    }

    let forceComplete = false;

    const updateProgress = () => {
      if (!mounted) return;
      const currentProgress = Math.floor((loadedCount / totalFrames) * 100);
      const criticalReady = criticalFrameTarget === 0 || criticalLoadedCount >= criticalFrameTarget;
      const fullyLoaded = loadedCount >= totalFrames;

      const nextState: PreloadState = {
        progress: currentProgress,
        images: loadedImagesRecord,
        isComplete: criticalReady || forceComplete || fullyLoaded,
        isFullyLoaded: fullyLoaded,
      };

      if (criticalReady || fullyLoaded) {
        forceComplete = false;
      }

      preloadStateCache.set(scenesKey, nextState);
      setState(nextState);
    };

    const maxWaitTimeout = window.setTimeout(() => {
      forceComplete = true;
      updateProgress();
    }, CRITICAL_MAX_WAIT_MS);

    let backgroundTimer: number | null = null;

    // Sequential batched chunk loading to prevent UI freeze and memory spiking
    const loadImagesInChunks = async () => {
      const criticalLoaders: Array<() => Promise<void>> = [];
      const backgroundLoaders: Array<() => Promise<void>> = [];
      const queued = new Set<string>();
      const createLoader = (scene: string, url: string, frameIndex: number, isCritical: boolean) => {
        return () => new Promise<void>((resolve) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            if (!mounted) return resolve();
            loadedImagesRecord[scene][frameIndex] = img;
            loadedCount += 1;
            if (isCritical) {
              criticalLoadedCount += 1;
            }
            updateProgress();
            resolve();
          };
          img.onerror = () => {
            console.error(`Failed to load image: ${url}`);
            if (!mounted) return resolve();
            loadedCount += 1;
            updateProgress();
            resolve();
          };
          img.src = url;
        });
      };

      const queueLoader = (
        scene: string,
        url: string | undefined,
        frameIndex: number,
        isCritical: boolean,
        bucket: Array<() => Promise<void>>,
      ) => {
        if (!url) return;
        if (loadedImagesRecord[scene][frameIndex]) return;
        const key = `${scene}:${frameIndex}`;
        if (queued.has(key)) return;
        queued.add(key);
        bucket.push(createLoader(scene, url, frameIndex, isCritical));
      };

      const runLoaders = async (loaders: Array<() => Promise<void>>, chunkSize: number) => {
        for (let i = 0; i < loaders.length; i += chunkSize) {
          if (!mounted) break;
          const chunk = loaders.slice(i, i + chunkSize);
          await Promise.all(chunk.map(loader => loader()));
          await new Promise(r => requestAnimationFrame(r));
        }
      };

      const maxFrames = totalScenesUrls.reduce((max, entry) => Math.max(max, entry.urls.length), 0);

      // Stage 1: critical frames for the first scene
      for (let frameIndex = 0; frameIndex < criticalFrameTarget; frameIndex += 1) {
        queueLoader(firstScene, firstSceneUrls[frameIndex], frameIndex, true, criticalLoaders);
      }

      // Stage 2: background frames (rest of first scene + other scenes, interleaved)
      totalScenesUrls.forEach(({ scene, urls }) => {
        queueLoader(scene, urls[0], 0, false, backgroundLoaders);
      });

      for (let frameIndex = 1; frameIndex < maxFrames; frameIndex += 1) {
        for (const { scene, urls } of totalScenesUrls) {
          queueLoader(scene, urls[frameIndex], frameIndex, false, backgroundLoaders);
        }
      }

      const startBackgroundLoad = () => {
        void runLoaders(backgroundLoaders, BACKGROUND_CHUNK_SIZE);
      };

      backgroundTimer = window.setTimeout(() => {
        if (!mounted) return;
        if ('requestIdleCallback' in window) {
          (window as Window & { requestIdleCallback?: (cb: () => void) => number }).requestIdleCallback?.(startBackgroundLoad);
        } else {
          startBackgroundLoad();
        }
      }, BACKGROUND_START_DELAY_MS);

      await runLoaders(criticalLoaders, CRITICAL_CHUNK_SIZE);
    };

    updateProgress();
    loadImagesInChunks();

    return () => {
      mounted = false;
      window.clearTimeout(maxWaitTimeout);
      if (backgroundTimer) {
        window.clearTimeout(backgroundTimer);
      }
    };
  }, [scenes, scenesKey, frameStep]);

  return state;
}
