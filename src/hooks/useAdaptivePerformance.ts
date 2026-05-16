import { useEffect, useMemo, useRef, useState } from 'react';
import type { SitePerformanceConfig, SitePerformanceQualityTier } from '../config/siteConfig';

const QUALITY_ORDER: SitePerformanceQualityTier[] = ['low', 'medium', 'high'];

const clampTierByBounds = (
  tier: SitePerformanceQualityTier,
  minTier: SitePerformanceQualityTier,
  maxTier: SitePerformanceQualityTier,
) => {
  const minIndex = QUALITY_ORDER.indexOf(minTier);
  const maxIndex = QUALITY_ORDER.indexOf(maxTier);
  const normalizedMin = Math.max(0, Math.min(minIndex, maxIndex));
  const normalizedMax = Math.min(QUALITY_ORDER.length - 1, Math.max(minIndex, maxIndex));
  const index = QUALITY_ORDER.indexOf(tier);
  return QUALITY_ORDER[Math.min(normalizedMax, Math.max(normalizedMin, index))];
};

const degradeTier = (
  tier: SitePerformanceQualityTier,
  minTier: SitePerformanceQualityTier,
): SitePerformanceQualityTier => {
  const index = QUALITY_ORDER.indexOf(tier);
  if (index <= 0) return tier;
  return clampTierByBounds(QUALITY_ORDER[index - 1], minTier, 'high');
};

const upgradeTier = (
  tier: SitePerformanceQualityTier,
  maxTier: SitePerformanceQualityTier,
): SitePerformanceQualityTier => {
  const index = QUALITY_ORDER.indexOf(tier);
  if (index >= QUALITY_ORDER.length - 1) return tier;
  return clampTierByBounds(QUALITY_ORDER[index + 1], 'low', maxTier);
};

export const useAdaptivePerformance = (
  config: SitePerformanceConfig,
  enabled = true,
) => {
  const resolvedDefaultTier = useMemo(
    () => clampTierByBounds(config.defaultQualityTier, config.minQualityTier, config.maxQualityTier),
    [config.defaultQualityTier, config.maxQualityTier, config.minQualityTier],
  );
  const [qualityTier, setQualityTier] = useState<SitePerformanceQualityTier>(resolvedDefaultTier);
  const [fps, setFps] = useState(60);
  const longTaskCountRef = useRef(0);

  useEffect(() => {
    setQualityTier(resolvedDefaultTier);
  }, [resolvedDefaultTier]);

  useEffect(() => {
    if (!enabled || !config.adaptiveEnabled || typeof window === 'undefined') return;

    let frameCount = 0;
    let rafId = 0;
    let lastWindowAt = performance.now();
    let observer: PerformanceObserver | null = null;

    try {
      if (typeof PerformanceObserver !== 'undefined') {
        observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          for (const entry of entries) {
            if (entry.duration >= config.longTaskThresholdMs) {
              longTaskCountRef.current += 1;
            }
          }
        });
        observer.observe({ entryTypes: ['longtask'] });
      }
    } catch {
      observer = null;
    }

    const tick = (now: number) => {
      frameCount += 1;
      const elapsedWindow = now - lastWindowAt;

      if (elapsedWindow >= config.sampleWindowMs) {
        const nextFps = (frameCount * 1000) / Math.max(1, elapsedWindow);
        setFps(nextFps);

        const longTasks = longTaskCountRef.current;
        longTaskCountRef.current = 0;
        frameCount = 0;
        lastWindowAt = now;

        setQualityTier((current) => {
          const boundedCurrent = clampTierByBounds(
            current,
            config.minQualityTier,
            config.maxQualityTier,
          );
          const shouldDegrade =
            nextFps < config.lowFpsThreshold || longTasks > config.maxLongTasksPerWindow;
          if (shouldDegrade) {
            return degradeTier(boundedCurrent, config.minQualityTier);
          }

          const shouldUpgrade = nextFps >= config.recoverFpsThreshold && longTasks === 0;
          if (shouldUpgrade) {
            return upgradeTier(boundedCurrent, config.maxQualityTier);
          }

          return boundedCurrent;
        });
      }

      rafId = window.requestAnimationFrame(tick);
    };

    rafId = window.requestAnimationFrame(tick);

    return () => {
      window.cancelAnimationFrame(rafId);
      observer?.disconnect();
      longTaskCountRef.current = 0;
    };
  }, [
    config.adaptiveEnabled,
    config.longTaskThresholdMs,
    config.lowFpsThreshold,
    config.maxLongTasksPerWindow,
    config.maxQualityTier,
    config.minQualityTier,
    config.recoverFpsThreshold,
    config.sampleWindowMs,
    enabled,
  ]);

  return {
    qualityTier,
    fps,
  };
};
