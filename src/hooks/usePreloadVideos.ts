import { useEffect, useMemo, useState } from 'react';

const VIDEO_MAX_WAIT_MS = 5000;

interface VideoSource {
  src: string;
  type: string;
}

interface VideoPreloadState {
  progress: number;
  videos: Record<string, HTMLVideoElement | null>;
  durations: Record<string, number>;
  isComplete: boolean;
  isReady: boolean;
  isFullyLoaded: boolean;
  hasVideoSupport: boolean;
  shouldFallback: boolean;
}

const getVideoSourcesForScene = (sceneName: string): VideoSource[] => {
  return [
    { src: `/videos/${sceneName}.webm`, type: 'video/webm' },
    { src: `/videos/${sceneName}.mp4`, type: 'video/mp4' },
  ];
};

const canUseVideo = (): boolean => {
  if (typeof document === 'undefined') return false;
  const video = document.createElement('video');
  return typeof video.canPlayType === 'function';
};

export function usePreloadVideos(scenes: string[]): VideoPreloadState {
  const [state, setState] = useState<VideoPreloadState>(() => ({
    progress: 0,
    videos: {},
    durations: {},
    isComplete: false,
    isReady: false,
    isFullyLoaded: false,
    hasVideoSupport: canUseVideo(),
    shouldFallback: false,
  }));

  const scenesKey = useMemo(() => scenes.join(','), [scenes]);

  useEffect(() => {
    if (!state.hasVideoSupport) {
      setState((prev) => ({
        ...prev,
        shouldFallback: true,
      }));
      return;
    }

    let mounted = true;
    const totalScenes = scenes.length;
    const videos: Record<string, HTMLVideoElement | null> = {};
    const durations: Record<string, number> = {};
    const metadataLoaded = new Set<string>();
    const dataLoaded = new Set<string>();
    const errorScenes = new Set<string>();

    const firstScene = scenes[0];
    let firstSceneReady = false;

    const updateState = () => {
      if (!mounted) return;
      const progress = totalScenes === 0 ? 100 : Math.floor((dataLoaded.size / totalScenes) * 100);
      const isReady = metadataLoaded.size === totalScenes && totalScenes > 0;
      const isFullyLoaded = dataLoaded.size === totalScenes && totalScenes > 0;
      const shouldFallback = errorScenes.size > 0;

      setState((prev) => ({
        ...prev,
        progress,
        videos: { ...videos },
        durations: { ...durations },
        isComplete: firstSceneReady,
        isReady,
        isFullyLoaded,
        shouldFallback,
      }));
    };

    const buildVideo = (scene: string) => {
      const video = document.createElement('video');
      video.preload = scene === firstScene ? 'auto' : 'metadata';
      video.muted = true;
      video.playsInline = true;
      video.loop = false;
      video.controls = false;

      const candidates = getVideoSourcesForScene(scene).filter((source) => {
        return video.canPlayType(source.type) !== '';
      });

      if (candidates.length === 0) {
        errorScenes.add(scene);
        updateState();
        return null;
      }

      let candidateIndex = 0;
      let metadataSeen = false;
      let dataSeen = false;

      const trySource = () => {
        if (candidateIndex >= candidates.length) {
          errorScenes.add(scene);
          updateState();
          return;
        }
        const candidate = candidates[candidateIndex];
        candidateIndex += 1;
        video.src = candidate.src;
        video.load();
      };

      const handleMetadata = () => {
        if (metadataSeen) return;
        metadataSeen = true;
        durations[scene] = Number.isFinite(video.duration) ? video.duration : 0;
        metadataLoaded.add(scene);
        updateState();
      };

      const handleData = () => {
        if (dataSeen) return;
        dataSeen = true;
        dataLoaded.add(scene);
        if (scene === firstScene) {
          firstSceneReady = true;
        }
        updateState();
      };

      const handleError = () => {
        if (!mounted) return;
        trySource();
      };

      video.addEventListener('loadedmetadata', handleMetadata);
      video.addEventListener('loadeddata', handleData);
      video.addEventListener('error', handleError);

      trySource();

      return video;
    };

    scenes.forEach((scene) => {
      videos[scene] = buildVideo(scene);
    });

    updateState();

    const fallbackTimer = window.setTimeout(() => {
      if (!mounted || firstSceneReady) return;
      errorScenes.add(firstScene || '');
      updateState();
    }, VIDEO_MAX_WAIT_MS);

    return () => {
      mounted = false;
      window.clearTimeout(fallbackTimer);
      Object.values(videos).forEach((video) => {
        if (!video) return;
        video.pause();
        video.removeAttribute('src');
        video.load();
      });
    };
  }, [scenesKey, scenes, state.hasVideoSupport]);

  return state;
}
