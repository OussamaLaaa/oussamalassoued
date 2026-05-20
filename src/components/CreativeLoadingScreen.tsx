import React, { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import './CreativeLoadingScreen.css';

interface CreativeLoadingScreenProps {
  onFadeComplete: () => void;
}

export const CreativeLoadingScreen: React.FC<CreativeLoadingScreenProps> = ({ onFadeComplete }) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);
  const glowRef = useRef<HTMLDivElement | null>(null);
  const pathsRef = useRef<SVGPathElement[]>([]);
  const [isAnimating, setIsAnimating] = useState(true);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    const svg = svgRef.current;
    const container = containerRef.current;
    const glowEl = glowRef.current;
    const paths = Array.from(svg.querySelectorAll('path')) as SVGPathElement[];
    pathsRef.current = paths;

    // Ensure overlay is fully opaque immediately to prevent flash of content
    container.style.backgroundColor = 'white';
    container.style.opacity = '1';
    container.style.pointerEvents = 'auto';

    // Prepare paths using gsap.set to avoid layout flicker
    const strokeLengths = paths.map((p) => p.getTotalLength());
    // Ensure svg uses center transform origin and block layout to avoid shift
    gsap.set(svg, { transformOrigin: '50% 50%', force3D: true });
    svg.style.display = 'block';
    svg.style.margin = '0 auto';
    gsap.set(paths, {
      stroke: 'black',
      fill: 'none',
      strokeLinecap: 'round',
      strokeLinejoin: 'round',
      strokeWidth: 4,
      opacity: 1,
      vectorEffect: 'non-scaling-stroke',
    });

    paths.forEach((path, i) => {
      gsap.set(path, {
        strokeDasharray: strokeLengths[i],
        strokeDashoffset: strokeLengths[i],
      });
    });

    if (glowEl) {
      gsap.set(glowEl, { opacity: 0, filter: 'blur(40px)' });
    }

    const tl = gsap.timeline({ defaults: { clearProps: 'all' } });

    // Entrance: slight pop and settle
    tl.to(svg, { scale: 0.9, duration: 0, force3D: true });
    tl.to(svg, { scale: 1, duration: 0.45, ease: 'expo.out' });

    // Draw all paths continuously with a stagger to avoid start/stop pauses
    tl.to(paths, {
      strokeDashoffset: 0,
      duration: 1.6,
      ease: 'power2.inOut',
      stagger: 0.18,
    }, 0);

    // Gentle glow build-up overlapping the draw
    if (glowEl) tl.to(glowEl, { opacity: 0.45, duration: 0.5, ease: 'sine.inOut' }, 0.45);

    // Slight stroke strengthening as draw finishes
    tl.to(paths, { strokeWidth: 6.5, duration: 0.4, ease: 'sine.inOut' }, '-=0.4');

    // Short hold so the logo doesn't linger too long
    tl.to({}, { duration: 0.18 });

    // Fill in smoothly (faster)
    tl.to(paths, { fill: 'black', fillOpacity: 1, strokeOpacity: 0, duration: 0.6, ease: 'power2.inOut', stagger: 0.04 });

    // Final moment then exit: upward float and fade
    tl.to(svg, { y: -38, scale: 1.08, opacity: 0, duration: 0.95, ease: 'power3.in' });
    if (glowEl) tl.to(glowEl, { opacity: 0, duration: 0.8, ease: 'power2.in' }, '-=0.8');

    // Only fade the container after svg fully faded to avoid showing page early
    tl.to(container, {
      backgroundColor: 'rgba(255,255,255,0)',
      duration: 0.9,
      ease: 'power2.inOut',
      onComplete: () => {
        // fully hide the overlay before revealing the app
        try {
          if (container) {
            container.style.pointerEvents = 'none';
            container.style.display = 'none';
          }
        } catch (e) {}
        setIsAnimating(false);
        // now let the app start
        onFadeComplete();
      },
    });

    return () => {
      tl.kill();
      gsap.set(paths, { clearProps: 'all' });
      if (glowEl) gsap.set(glowEl, { clearProps: 'all' });
      if (container) {
        container.style.pointerEvents = 'none';
      }
    };
  }, [onFadeComplete]);

  return (
    <div
      ref={containerRef}
      className="creative-loading-screen"
    >
      <svg
        ref={svgRef}
        id="Layer_2"
        data-name="Layer 2"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 436.52 578.79"
        className="loading-logo"
      >
        <defs>
          <style>
            {`.cls-1 { fill: black; }`}
          </style>
        </defs>
        <g id="Layer_2-2" data-name="Layer 2">
          <g id="Layer_1-2" data-name="Layer 1-2">
            <path
              className="cls-1"
              d="M18.88,99.49c9.07,7.88,22.44,11.54,35,12.53,21.27,1.85,48.73-1.05,71.78.95,59.26,4.48,99.66,32.41,128.71,82.47,21.44,34.31,36.73,72.77,72.03,93.47,24.42,13.99,57.22,19.81,80.5,1.95,32.36-25.88,28.56-82.45,29.4-121.98.06-32.26.9-66.71-1.14-98.36-2.25-31.12-7.52-60.55-41.74-66.18-36.59-5.5-76.79-2.56-118.85-3.68-47.78-.25-99.38-.46-148.14-.66-31,.36-63.3-1.56-89.96,10.3C1.09,26.14-11.44,72.73,18.85,99.46l.04.03h0Z"
            />
            <path
              className="cls-1"
              d="M345.54,457.34c-53.31-1.14-97.68-12.26-133.11-54.82-21.15-24.53-34.41-55.92-47.21-84.95-9.85-21.41-20.75-44.33-40.73-57.83-29.13-20.08-72.64-11.32-95.67,15.33-18.76,20.66-24.03,48.16-26.45,75.84C.15,378.05.48,407.74.16,435.81c-.09,27.66-.62,50.76.93,76.32,3.13,51.19,17.52,62.87,68.28,64.44,85.09,1.6,191.46,1.93,277.64,2.22,15.17-.13,31.58-.73,45.09-3.92,49.14-9.33,57.49-77.13,18.14-103.61-19.61-12.52-40.14-12.35-64.63-13.91h-.08,0Z"
            />
          </g>
        </g>
      </svg>
      <div ref={glowRef} className="loading-glow" />
    </div>
  );
};
