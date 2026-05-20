import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GlobalMotionLayerProps {
  // optional tuning params can be added later
}

const prefersReduced = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch (e) {
    return false;
  }
};

const GlobalMotionLayer: React.FC<GlobalMotionLayerProps> = () => {
  const initialized = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReduced()) return;
    if (initialized.current) return;

    initialized.current = true;

    try {
      // ─── HERO ENTANCE ───
      gsap.fromTo(
        '.tracking-tight, .fw-reveal h1, .fw-reveal h2, h1.tracking-tight',
        { y: 30, opacity: 0, rotation: -1 },
        { y: 0, opacity: 1, rotation: 0, duration: 1.2, ease: 'power4.out', stagger: 0.04 },
      );

      gsap.fromTo(
        'section p, .CardContent p, .text-sm, .text-muted-foreground',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.85, ease: 'power3.out', stagger: 0.02, delay: 0.12 },
      );

      // ─── ELEMENTS WITH data-motion: ANTIGRAVITY ENTRANCE ───
      const entranceTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-motion]'));

      const entranceTimeline = gsap.timeline({ delay: 0.15 });

      entranceTargets.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;
        const areaFactor = Math.min(1, Math.max(0, area / (800 * 400)));

        const offsetY = 50 + areaFactor * 60;
        const offsetZ = 10 + areaFactor * 15;
        const rot = (i % 2 === 0 ? 1 : -1) * (3 + Math.round(areaFactor * 5));
        const dur = 0.9 + areaFactor * 1.1;

        entranceTimeline.fromTo(
          el,
          {
            y: offsetY,
            z: offsetZ,
            rotation: rot * 0.7,
            opacity: 0,
            transformPerspective: 900,
          },
          {
            y: 0,
            z: 0,
            rotation: 0,
            opacity: 1,
            duration: dur,
            ease: 'power4.out',
            force3D: true,
          },
          i * 0.07,
        );

        // child text reveals inside element
        const texts = Array.from(el.querySelectorAll<HTMLElement>('h1,h2,h3,p,.text-sm,.text-muted-foreground'));
        if (texts.length > 0) {
          gsap.fromTo(
            texts,
            { y: 14, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.04, delay: dur * 0.3 },
          );
        }
      });

      // ─── SCROLL-TRIGGERED ANTIGRAVITY REVEALS ───
      const revealTargets = Array.from(document.querySelectorAll<HTMLElement>(
        'section[data-motion], [data-motion].grid, [data-motion].flex-wrap, [data-motion].space-y-6, [data-motion].space-y-2',
      ));

      revealTargets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;
        const areaFactor = Math.min(1, Math.max(0, area / (800 * 400)));
        const offsetY = 40 + areaFactor * 50;

        gsap.set(el, { y: offsetY, opacity: 0, transformPerspective: 800 });

        ScrollTrigger.create({
          trigger: el,
          start: 'top 88%',
          onEnter: () => {
            gsap.to(el, {
              y: 0,
              opacity: 1,
              duration: 0.9 + areaFactor * 0.4,
              ease: 'power4.out',
              force3D: true,
            });
          },
          once: true,
        });
      });

    } catch (err) {
      // ignore
    }

    return () => {
      try {
        ScrollTrigger.getAll().forEach((st) => st.kill());
        gsap.globalTimeline.clear();
      } catch (e) {}
    };
  }, []);

  return null;
};

export default GlobalMotionLayer;
