import React, { useEffect } from 'react';

interface GlobalMotionLayerProps {}

const prefersReduced = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

const GlobalMotionLayer: React.FC<GlobalMotionLayerProps> = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReduced()) return;

    const root = document.querySelector('[data-surface="static-home"]');
    if (!root) return;

    // ─── Collect all direct animate targets (skip children of [data-motion]) ───
    const allElements = root.querySelectorAll<HTMLElement>(
      'h1, h2, h3, h4, p, [data-motion]',
    );
    const toAnimate: HTMLElement[] = [];
    const seen = new Set<Element>();

    allElements.forEach((el) => {
      if (seen.has(el)) return;

      // Skip if inside another [data-motion] parent (avoids N+1 animation)
      if (el.closest('[data-motion]') && el.closest('[data-motion]') !== el) return;
      // Skip background/decorative
      if (el.closest('.absolute')) return;
      if (el.tagName === 'P' && !el.textContent?.trim()) return;

      el.classList.add('ag-motion');
      toAnimate.push(el);
    });

    if (toAnimate.length === 0) return;

    // ─── HERO: animate immediately ───
    const heroElements = toAnimate.filter((el) => el.closest('#home'));

    heroElements.forEach((el, i) => {
      const delay = 150 + i * 90;
      el.style.setProperty('transition-delay', `${delay}ms`);
    });

    // Use double rAF to ensure initial state paints before adding visible class
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        heroElements.forEach((el) => el.classList.add('ag-visible'));
      });
    });

    // ─── NON-HERO: scroll-triggered ───
    const nonHeroElements = toAnimate.filter((el) => !el.closest('#home'));

    if (nonHeroElements.length === 0) return;

    // Group by parent section
    const sections = new Map<Element, HTMLElement[]>();
    nonHeroElements.forEach((el) => {
      const section = el.closest('section, footer');
      if (!section) return;
      if (!sections.has(section)) sections.set(section, []);
      sections.get(section)!.push(el);
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const els = sections.get(entry.target) || [];
          els.forEach((el, i) => {
            el.style.setProperty('transition-delay', `${80 + i * 70}ms`);
            el.classList.add('ag-visible');
          });
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );

    sections.forEach((_, section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  return null;
};

export default GlobalMotionLayer;
