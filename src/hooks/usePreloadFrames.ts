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
}

const preloadStateCache = new Map<string, PreloadState>();

export function usePreloadFrames(scenes: string[]) {
  const scenesKey = scenes.join(',');
  const [state, setState] = useState<PreloadState>(() => {
    return (
      preloadStateCache.get(scenesKey) ?? {
        progress: 0,
        images: {},
        isComplete: false,
      }
    );
  });

  useEffect(() => {
    const cachedState = preloadStateCache.get(scenesKey);
    if (cachedState?.isComplete) {
      setState(cachedState);
      return;
    }

    if (!supportsAvif) {
      console.warn('[Frames] AVIF is not supported by this browser. Frame images may not render.');
    }

    let mounted = true;
    let loadedCount = 0;
    
    // Get URLs grouped by scene
    const totalScenesUrls: { scene: string; urls: string[] }[] = scenes.map(scene => ({
      scene,
      urls: getFramesForScene(scene)
    }));

    const totalFrames = totalScenesUrls.reduce((acc, curr) => acc + curr.urls.length, 0);
    
    if (totalFrames === 0) {
      console.warn("No frames found to preload. Check your folder structures and Vite glob configuration.");
      const nextState = {
        progress: 100,
        images: {},
        isComplete: true,
      };
      preloadStateCache.set(scenesKey, nextState);
      setState(nextState);
      return;
    }

    const loadedImagesRecord: Record<string, HTMLImageElement[]> = {};
    scenes.forEach(scene => {
      loadedImagesRecord[scene] = new Array(totalScenesUrls.find(s => s.scene === scene)?.urls.length || 0).fill(null);
    });

    // تحديد المشهد الأول ونصف عدد إطاراته
    const firstScene = scenes[0];
    const firstSceneUrls = totalScenesUrls.find(s => s.scene === firstScene)?.urls || [];
    const firstSceneFrameCount = firstSceneUrls.length;
    const halfFirstSceneFrames = Math.ceil(firstSceneFrameCount / 2);

    const updateProgress = () => {
      if (!mounted) return;
      loadedCount++;
      const currentProgress = Math.floor((loadedCount / totalFrames) * 100);

      // حساب عدد الإطارات المحملة للمشهد الأول
      const firstSceneLoadedCount = loadedImagesRecord[firstScene]?.filter(img => img !== null).length || 0;

      const nextState: PreloadState = {
        progress: currentProgress,
        images: loadedImagesRecord,
        // إخفاء التحميل عند تحميل نصف إطارات المشهد الأول أو اكتمال كل الإطارات
        isComplete: firstSceneLoadedCount >= halfFirstSceneFrames || loadedCount === totalFrames
      };

      preloadStateCache.set(scenesKey, nextState);
      setState(nextState);
    };

    // Sequential batched chunk loading to prevent UI freeze and memory spiking
    const loadImagesInChunks = async () => {
      const chunkSize = 20;
      const allLoaders: Array<() => Promise<void>> = [];

      const maxFrames = totalScenesUrls.reduce((max, entry) => Math.max(max, entry.urls.length), 0);

      // Priority pass: load the first frame of every scene early so each sequence becomes visible quickly.
      totalScenesUrls.forEach(({ scene, urls }) => {
        const url = urls[0];
        if (!url) return;
        allLoaders.push(() => new Promise((resolve) => {
          const img = new Image();
          img.decoding = 'async';
          img.onload = () => {
            if (!mounted) return resolve();
            loadedImagesRecord[scene][0] = img;
            updateProgress();
            resolve();
          };
          img.onerror = () => {
            console.error(`Failed to load image: ${url}`);
            updateProgress();
            resolve();
          };
          img.src = url;
        }));
      });

      // Interleave the rest of the frames across scenes to avoid one scene starving the others.
      for (let frameIndex = 1; frameIndex < maxFrames; frameIndex += 1) {
        for (const { scene, urls } of totalScenesUrls) {
          const url = urls[frameIndex];
          if (!url) continue;
          allLoaders.push(() => new Promise((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => {
              if (!mounted) return resolve();
              loadedImagesRecord[scene][frameIndex] = img;
              updateProgress();
              resolve();
            };
            img.onerror = () => {
              console.error(`Failed to load image: ${url}`);
              updateProgress();
              resolve();
            };
            img.src = url;
          }));
        }
      }

      for (let i = 0; i < allLoaders.length; i += chunkSize) {
        if (!mounted) break;
        const chunk = allLoaders.slice(i, i + chunkSize);
        await Promise.all(chunk.map(loader => loader()));
        // Yield to main thread for a frame
        await new Promise(r => requestAnimationFrame(r));
      }
    };

    loadImagesInChunks();

    return () => {
      mounted = false;
    };
  }, [scenes, scenesKey]);

  return state;
}
