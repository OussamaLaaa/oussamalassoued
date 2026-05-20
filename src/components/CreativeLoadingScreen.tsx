import React, { useEffect, useRef, useState } from 'react';
import './CreativeLoadingScreen.css';

interface CreativeLoadingScreenProps {
  duration?: number;
  onFadeComplete?: () => void;
}

const TOP =
  'M18.88,99.49c9.07,7.88,22.44,11.54,35,12.53,21.27,1.85,48.73-1.05,71.78.95,59.26,4.48,99.66,32.41,128.71,82.47,21.44,34.31,36.73,72.77,72.03,93.47,24.42,13.99,57.22,19.81,80.5,1.95,32.36-25.88,28.56-82.45,29.4-121.98.06-32.26.9-66.71-1.14-98.36-2.25-31.12-7.52-60.55-41.74-66.18-36.59-5.5-76.79-2.56-118.85-3.68-47.78-.25-99.38-.46-148.14-.66-31,.36-63.3-1.56-89.96,10.3C1.09,26.14-11.44,72.73,18.85,99.46l.04.03h0Z';
const BOT =
  'M345.54,457.34c-53.31-1.14-97.68-12.26-133.11-54.82-21.15-24.53-34.41-55.92-47.21-84.95-9.85-21.41-20.75-44.33-40.73-57.83-29.13-20.08-72.64-11.32-95.67,15.33-18.76,20.66-24.03,48.16-26.45,75.84C.15,378.05.48,407.74.16,435.81c-.09,27.66-.62,50.76.93,76.32,3.13,51.19,17.52,62.87,68.28,64.44,85.09,1.6,191.46,1.93,277.64,2.22,15.17-.13,31.58-.73,45.09-3.92,49.14-9.33,57.49-77.13,18.14-103.61-19.61-12.52-40.14-12.35-64.63-13.91h-.08,0Z';

export const CreativeLoadingScreen: React.FC<CreativeLoadingScreenProps> = ({
  duration = 1200,
  onFadeComplete,
}) => {
  const [hidden, setHidden] = useState(false);
  const onFadeCompleteRef = useRef(onFadeComplete);

  useEffect(() => {
    onFadeCompleteRef.current = onFadeComplete;
  }, [onFadeComplete]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setHidden(true);
      onFadeCompleteRef.current?.();
    }, duration);

    return () => {
      window.clearTimeout(timer);
    };
  }, [duration]);

  if (hidden) return null;

  const sharedSvg: React.CSSProperties = {
    width: '100%',
    height: '100%',
    display: 'block',
  };
  const layer: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        animation: `fadeOut ${duration}ms ease-in-out forwards`,
      }}
    >
      <style>{`
        @keyframes logoFloat {
          0% {
            transform: translateY(0) scale(1);
          }
          25% {
            transform: translateY(-10px) scale(1.02) rotate(-1deg);
          }
          50% {
            transform: translateY(0) scale(1.04) rotate(0deg);
          }
          75% {
            transform: translateY(10px) scale(1.02) rotate(1deg);
          }
          100% {
            transform: translateY(0) scale(1);
          }
        }

        @keyframes logoGlow {
          0% {
            filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
            opacity: 0.92;
          }
          50% {
            filter: drop-shadow(0 0 26px rgba(0, 0, 0, 0.14));
            opacity: 1;
          }
          100% {
            filter: drop-shadow(0 0 0 rgba(0, 0, 0, 0));
            opacity: 0.92;
          }
        }

        @keyframes ringPulse {
          0% {
            transform: scale(0.98);
            opacity: 0.45;
          }
          50% {
            transform: scale(1.08);
            opacity: 0.1;
          }
          100% {
            transform: scale(0.98);
            opacity: 0.45;
          }
        }

        @keyframes fadeOut {
          0% {
            opacity: 1;
            background: #ffffff;
          }
          70% {
            opacity: 1;
            background: #ffffff;
          }
          100% {
            opacity: 0;
            background: #ffffff;
            pointer-events: none;
          }
        }
      `}</style>
      <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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
          src="/logo-black.png"
          alt="Site Logo"
          width={120}
          height={80}
          style={{
            display: 'block',
            objectFit: 'contain',
            transformOrigin: 'center center',
            animation: 'logoFloat 3.6s ease-in-out infinite, logoGlow 2.8s ease-in-out infinite',
          }}
          loading="eager"
        />
      </div>
    </div>
  );
};
