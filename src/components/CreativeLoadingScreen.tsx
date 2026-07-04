import React, { useEffect, useRef } from 'react';

const LOADING_DURATION_MS = 3000;
const LOGO_UPDATE_INTERVAL_MS = 350;

interface CreativeLoadingScreenProps {
  onFadeComplete?: () => void;
}

const randomTransform = () => ({
  x: (Math.random() - 0.5) * 16,
  y: (Math.random() - 0.5) * 16,
  rotate: (Math.random() - 0.5) * 8,
  scale: 0.96 + Math.random() * 0.08,
});

export const CreativeLoadingScreen: React.FC<CreativeLoadingScreenProps> = ({
  onFadeComplete,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLImageElement>(null);
  const counterRef = useRef<HTMLDivElement>(null);
  const onFadeCompleteRef = useRef(onFadeComplete);
  const startTimeRef = useRef(0);

  useEffect(() => {
    onFadeCompleteRef.current = onFadeComplete;
  }, [onFadeComplete]);

  useEffect(() => {
    const reducedMotion = typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    startTimeRef.current = Date.now();

    // Random logo movement
    let interval: ReturnType<typeof setInterval> | null = null;
    if (!reducedMotion && logoRef.current) {
      interval = setInterval(() => {
        if (logoRef.current) {
          const t = randomTransform();
          logoRef.current.style.transform =
            `translate(${t.x}px, ${t.y}px) rotate(${t.rotate}deg) scale(${t.scale})`;
        }
      }, LOGO_UPDATE_INTERVAL_MS);
    }

    // Progress counter + completion
    const raf = () => {
      const now = Date.now();
      const elapsed = now - startTimeRef.current;

      if (counterRef.current) {
        const progress = Math.min(100, Math.round((elapsed / LOADING_DURATION_MS) * 100));
        counterRef.current.textContent = `Loading ${progress}%`;
      }

      if (elapsed >= LOADING_DURATION_MS) {
        if (interval) clearInterval(interval);
        onFadeCompleteRef.current?.();
        return;
      }

      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        animation: `loadingFadeOut ${LOADING_DURATION_MS}ms ease-out forwards`,
      }}
    >
      <style>{`
        @keyframes loadingFadeOut {
          0%   { opacity: 1; }
          83%  { opacity: 1; }
          100% { opacity: 0; pointer-events: none; }
        }
        @keyframes ringPulse {
          0%   { transform: scale(0.98); opacity: 0.45; }
          50%  { transform: scale(1.08); opacity: 0.1; }
          100% { transform: scale(0.98); opacity: 0.45; }
        }
        @keyframes counterFadeIn {
          0%   { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>

      <div style={{
        position: 'relative',
        width: 140,
        height: 140,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            width: 120,
            height: 120,
            borderRadius: '999px',
            border: '1px solid rgba(0, 0, 0, 0.07)',
            animation: 'ringPulse 2.8s ease-in-out infinite',
          }}
        />
        <img
          ref={logoRef}
          src="/logo-black.png"
          alt="Site Logo"
          width={120}
          height={80}
          style={{
            display: 'block',
            objectFit: 'contain',
            transformOrigin: 'center center',
            transform: 'translate(0px, 0px) rotate(0deg) scale(1)',
            transition: 'transform 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
          loading="eager"
        />
      </div>

      <div
        ref={counterRef}
        style={{
          position: 'fixed',
          bottom: 24,
          left: 24,
          fontFamily: '"Inter", ui-sans-serif, system-ui, sans-serif',
          fontSize: 12,
          fontWeight: 500,
          color: '#111111',
          letterSpacing: '0.06em',
          animation: 'counterFadeIn 0.6s ease-out 0.15s forwards',
          opacity: 0,
        }}
      >
        Loading 0%
      </div>
    </div>
  );
};
