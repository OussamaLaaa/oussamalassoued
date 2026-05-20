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
      // ─── GLOBAL ENTRANCE: headings and section titles ───
      gsap.fromTo(
        '.tracking-tight, .fw-reveal h1, .fw-reveal h2, h1.tracking-tight',
        { y: 30, opacity: 0, rotation: -1 },
        { y: 0, opacity: 1, rotation: 0, duration: 1.1, ease: 'power4.out', stagger: 0.04 },
      );

      // ─── GLOBAL ENTRANCE: paragraphs and small text ───
      gsap.fromTo(
        'section p, .CardContent p, .text-sm, .text-muted-foreground',
        { y: 12, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.02, delay: 0.1 },
      );

      // ─── ANTIGRAVITY: floating levitation for [data-motion] ───
      const floatTargets = Array.from(document.querySelectorAll<HTMLElement>('[data-motion]'));

      const entranceTimeline = gsap.timeline({ delay: 0.1 });

      floatTargets.forEach((el, i) => {
        const rect = el.getBoundingClientRect();
        const area = rect.width * rect.height;
        const areaFactor = Math.min(1, Math.max(0, area / (800 * 400)));

        const baseOffsetY = 50 + areaFactor * 60;
        const baseOffsetZ = 10 + areaFactor * 15;
        const baseRot = (i % 2 === 0 ? 1 : -1) * (3 + Math.round(areaFactor * 5));
        const baseDur = 0.9 + areaFactor * 1.1;

        entranceTimeline.fromTo(
          el,
          {
            y: baseOffsetY,
            z: baseOffsetZ,
            rotation: baseRot * 0.7,
            opacity: 0,
            transformPerspective: 900,
          },
          {
            y: 0,
            z: 0,
            rotation: 0,
            opacity: 1,
            duration: baseDur,
            ease: 'power4.out',
            force3D: true,
          },
          i * 0.07,
        );

        // ── Continuous antigravity drift (multi-axis) ──
        const ampY = 8 + (i % 5) * 2;
        const ampX = 4 + (i % 4) * 1.5;
        const rot = baseRot * 0.3;
        const dur = 3.5 + (i % 6) * 0.5;

        gsap.to(el, {
          y: `+=${ampY}`,
          x: `+=${ampX}`,
          rotation: rot,
          z: `+=${(i % 4) + 1}`,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          duration: dur,
          delay: baseDur + (i % 5) * 0.05,
          force3D: true,
        });

        // ── Subtle breathing scale ──
        gsap.to(el, {
          scale: 1.006 + areaFactor * 0.004,
          duration: dur * 2.2,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
          delay: baseDur + 0.15,
        });

        // ── Child text reveals inside element ──
        const texts = Array.from(el.querySelectorAll<HTMLElement>('h1,h2,h3,p,.text-sm,.text-muted-foreground'));
        if (texts.length > 0) {
          gsap.fromTo(
            texts,
            { y: 14, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', stagger: 0.04, delay: baseDur * 0.3 },
          );
        }
      });

      // ─── SCROLL-TRIGGERED ANTIGRAVITY REVEALS ───
      const revealTargets = Array.from(document.querySelectorAll<HTMLElement>(
        'section[data-motion], [data-motion].grid, [data-motion].flex-wrap, [data-motion].space-y-6, [data-motion].space-y-2',
      ));

      revealTargets.forEach((el) => {
        if (floatTargets.includes(el)) return;

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

      // ─── ANTIGRAVITY FLOATING PARTICLES (ambient background dots) ───
      const bgEl = document.querySelector('[data-surface="static-home"]');
      if (bgEl) {
        const particleContainer = document.createElement('div');
        particleContainer.style.cssText =
          'position:fixed;inset:0;pointer-events:none;z-index:0;overflow:hidden;opacity:0.35';
        particleContainer.id = 'antigravity-particles';
        bgEl.prepend(particleContainer);

        const count = 18;
        for (let i = 0; i < count; i++) {
          const dot = document.createElement('div');
          const size = 2 + Math.random() * 4;
          dot.style.cssText = `
            position:absolute;
            width:${size}px;height:${size}px;
            border-radius:50%;
            background:rgba(10,10,10,0.12);
            left:${Math.random() * 100}%;
            top:${Math.random() * 100}%;
          `;
          particleContainer.appendChild(dot);

          gsap.to(dot, {
            y: `-=${60 + Math.random() * 120}`,
            x: `+=${(Math.random() - 0.5) * 80}`,
            duration: 8 + Math.random() * 12,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: Math.random() * 6,
          });

          gsap.to(dot, {
            opacity: 0.1 + Math.random() * 0.35,
            duration: 3 + Math.random() * 5,
            repeat: -1,
            yoyo: true,
            ease: 'sine.inOut',
            delay: Math.random() * 4,
          });
        }
      }

      // ─── CARDS FLOATING ON HOVER ───
      document.querySelectorAll<HTMLElement>('[data-motion].rounded-2xl').forEach((card) => {
        card.addEventListener('mouseenter', () => {
          gsap.to(card, {
            y: -8,
            duration: 0.4,
            ease: 'power2.out',
            force3D: true,
          });
        });
        card.addEventListener('mouseleave', () => {
          gsap.to(card, {
            y: 0,
            duration: 0.6,
            ease: 'power3.out',
            force3D: true,
          });
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
