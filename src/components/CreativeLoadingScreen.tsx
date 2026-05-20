import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './CreativeLoadingScreen.css';

interface CreativeLoadingScreenProps {
  duration?: number;
  onFadeComplete?: () => void;
}

const TOP =
  'M18.88,99.49c9.07,7.88,22.44,11.54,35,12.53,21.27,1.85,48.73-1.05,71.78.95,59.26,4.48,99.66,32.41,128.71,82.47,21.44,34.31,36.73,72.77,72.03,93.47,24.42,13.99,57.22,19.81,80.5,1.95,32.36-25.88,28.56-82.45,29.4-121.98.06-32.26.9-66.71-1.14-98.36-2.25-31.12-7.52-60.55-41.74-66.18-36.59-5.5-76.79-2.56-118.85-3.68-47.78-.25-99.38-.46-148.14-.66-31,.36-63.3-1.56-89.96,10.3C1.09,26.14-11.44,72.73,18.85,99.46l.04.03h0Z';
const BOT =
  'M345.54,457.34c-53.31-1.14-97.68-12.26-133.11-54.82-21.15-24.53-34.41-55.92-47.21-84.95-9.85-21.41-20.75-44.33-40.73-57.83-29.13-20.08-72.64-11.32-95.67,15.33-18.76,20.66-24.03,48.16-26.45,75.84C.15,378.05.48,407.74.16,435.81c-.09,27.66-.62,50.76.93,76.32,3.13,51.19,17.52,62.87,68.28,64.44,85.09,1.6,191.46,1.93,277.64,2.22,15.17-.13,31.58-.73,45.09-3.92,49.14-9.33,57.49-77.13,18.14-103.61-19.61-12.52-40.14-12.35-64.63-13.91h-.08,0Z';

const CSS = `
  @keyframes ls-revTop {
    from { clip-path: inset(0 0 100% 0); transform: translateY(-10px); }
    to   { clip-path: inset(0 0 0%   0); transform: translateY(0);     }
  }
  @keyframes ls-revBot {
    from { clip-path: inset(100% 0 0 0); transform: translateY(10px); }
    to   { clip-path: inset(0%   0 0 0); transform: translateY(0);    }
  }
  .ls-draw-top {
    animation: ls-revTop 1600ms cubic-bezier(0.16,1,0.3,1) 300ms both;
  }
  .ls-draw-bot {
    animation: ls-revBot 1600ms cubic-bezier(0.16,1,0.3,1) 650ms both;
  }
`;

export const CreativeLoadingScreen: React.FC<CreativeLoadingScreenProps> = ({
  duration = 5700,
  onFadeComplete,
}) => {
  const [hidden, setHidden] = useState(false);
  const screenRef = useRef<HTMLDivElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const fp1Ref = useRef<SVGPathElement>(null);
  const fp2Ref = useRef<SVGPathElement>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  function at(fn: () => void, ms: number) {
    const t = setTimeout(fn, ms);
    timers.current.push(t);
  }

  useEffect(() => {
    const sc = screenRef.current!;
    const lw = wrapRef.current!;
    const p1 = fp1Ref.current!;
    const p2 = fp2Ref.current!;

    at(() => {
      sc.style.transition = 'background 650ms ease';
      sc.style.background = '#0a0a0a';
      p1.style.transition = 'fill 650ms ease';
      p2.style.transition = 'fill 650ms ease';
      p1.setAttribute('fill', '#dfdfdf');
      p2.setAttribute('fill', '#dfdfdf');
    }, 2500);

    at(() => {
      lw.style.transition = 'filter 700ms ease';
      lw.style.filter =
        'drop-shadow(0 0 10px rgba(255,255,255,.55)) drop-shadow(0 0 30px rgba(255,255,255,.3)) drop-shadow(0 0 65px rgba(255,255,255,.15))';
    }, 3250);

    at(() => {
      lw.style.transition = 'filter 550ms ease';
      lw.style.filter = 'drop-shadow(0 0 3px rgba(255,255,255,.2))';
    }, 4050);

    at(() => {
      lw.style.transition = 'filter 650ms ease';
      lw.style.filter =
        'drop-shadow(0 0 16px rgba(255,255,255,.9)) drop-shadow(0 0 45px rgba(255,255,255,.55)) drop-shadow(0 0 90px rgba(255,255,255,.28)) drop-shadow(0 0 150px rgba(255,255,255,.12))';
    }, 4700);

    at(() => {
      lw.style.transition = 'transform 850ms cubic-bezier(0.55,0,1,0.45), opacity 850ms ease, filter 850ms ease';
      lw.style.transform = 'scale(2.4)';
      lw.style.opacity = '0';
      lw.style.filter = 'drop-shadow(0 0 70px rgba(255,255,255,1)) drop-shadow(0 0 140px rgba(255,255,255,.6))';
    }, duration);

    at(() => {
      sc.style.transition = 'background 550ms ease';
      sc.style.background = '#fff';
    }, duration + 400);

    at(() => {
      setHidden(true);
      onFadeComplete?.();
    }, duration + 1000);

    return () => timers.current.forEach(clearTimeout);
  }, [duration, onFadeComplete]);

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
    <>
      <style>{CSS}</style>
      <div
        ref={screenRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9999,
          background: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden',
        }}
      >
        <div ref={wrapRef} style={{ position: 'relative', width: 114, height: 151 }}>
          <div className="ls-draw-top" style={layer}>
            <svg viewBox="0 0 436.52 578.79" xmlns="http://www.w3.org/2000/svg" style={sharedSvg}>
              <path ref={fp1Ref} fill="#161616" d={TOP} />
            </svg>
          </div>

          <div className="ls-draw-bot" style={layer}>
            <svg viewBox="0 0 436.52 578.79" xmlns="http://www.w3.org/2000/svg" style={sharedSvg}>
              <path ref={fp2Ref} fill="#161616" d={BOT} />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
};
