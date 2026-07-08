import React, { useEffect, useState, lazy, Suspense } from 'react';

const GLB_PATH = '/assets/3d/lens.glb';

function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return true;
    try {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handler = (e: MediaQueryListEvent) => setReduced(e.matches);
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } catch {
      return undefined;
    }
  }, []);

  return reduced;
}

function useMobile(): boolean {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth < 768;
  });

  useEffect(() => {
    const onResize = () => setMobile(window.innerWidth < 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return mobile;
}

function useGlbExists(): boolean | null {
  const [exists, setExists] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(GLB_PATH, { method: 'HEAD' })
      .then((res) => {
        if (!cancelled) setExists(res.ok);
      })
      .catch(() => {
        if (!cancelled) setExists(false);
      });
    return () => { cancelled = true; };
  }, []);

  return exists;
}

const FluidGlass = lazy(() => import('./FluidGlass'));

function FluidGlassFallback() {
  return null;
}

interface HeroFluidGlassProps {
  className?: string;
}

export default function HeroFluidGlass({ className = '' }: HeroFluidGlassProps) {
  const reducedMotion = useReducedMotion();
  const isMobile = useMobile();
  const glbExists = useGlbExists();

  if (reducedMotion) return null;
  if (isMobile) return null;
  if (glbExists === null) return null;
  if (glbExists === false) {
    console.warn('FluidGlass disabled: /assets/3d/lens.glb not found.');
    return null;
  }

  return (
    <div
      className={`absolute inset-0 pointer-events-none z-0 overflow-hidden ${className}`}
      aria-hidden="true"
    >
      <Suspense fallback={<FluidGlassFallback />}>
        <FluidGlass
          lensProps={{
            scale: 0.22,
            ior: 1.15,
            thickness: 2,
            transmission: 1,
            roughness: 0,
            chromaticAberration: 0.04,
            anisotropy: 0.01,
          }}
        />
      </Suspense>
    </div>
  );
}
