import React, { useEffect } from 'react';

interface GlobalMotionLayerProps {}

const prefersReduced = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

function splitToChars(el: HTMLElement) {
  const text = el.textContent || '';
  if (!text.trim() || el.children.length > 0) return;
  el.textContent = '';
  [...text].forEach((c) => {
    const s = document.createElement('span');
    s.textContent = c === ' ' ? '\u00A0' : c;
    s.style.display = 'inline-block';
    el.appendChild(s);
  });
}

function splitToWords(el: HTMLElement) {
  const text = el.textContent || '';
  if (!text.trim() || el.children.length > 0) return;
  el.textContent = '';
  text.split(/\s+/).forEach((w, i) => {
    if (i > 0) {
      const sp = document.createElement('span');
      sp.textContent = '\u00A0';
      sp.style.display = 'inline-block';
      el.appendChild(sp);
    }
    const s = document.createElement('span');
    s.textContent = w;
    s.style.display = 'inline-block';
    el.appendChild(s);
  });
}

const GlobalMotionLayer: React.FC<GlobalMotionLayerProps> = () => {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReduced()) return;

    const root = document.querySelector('[data-surface="static-home"]');
    if (!root) return;
    const isMobile = window.innerWidth < 768;

    // ══════════════════════════════════════
    // HERO — GSAP (works reliably)
    // ══════════════════════════════════════
    import('gsap').then(({ default: gsap }) => {
      const hero = document.getElementById('home');
      if (!hero) return;

      const h1 = hero.querySelector<HTMLElement>('h1');
      if (h1 && !isMobile) {
        splitToChars(h1);
        const h1Spans = Array.from(h1.querySelectorAll('span'));
        if (h1Spans.length > 0) {
          gsap.fromTo(
            h1Spans,
            { y: 70, opacity: 0, rotationX: -45, transformPerspective: 700 },
            { y: 0, opacity: 1, rotationX: 0, duration: 0.75, ease: 'back.out(1.3)', stagger: 0.022 },
          );
        } else {
          gsap.fromTo(h1, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' });
        }
      } else if (h1) {
        gsap.fromTo(h1, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out' });
      }

      const sub = hero.querySelector<HTMLElement>('p.text-lg, p.text-xl');
      if (sub) {
        splitToWords(sub);
        const subWords = Array.from(sub.querySelectorAll('span'));
        if (subWords.length > 0) {
          gsap.fromTo(
            subWords,
            { y: 25, opacity: 0, scale: 0.94 },
            { y: 0, opacity: 1, scale: 1, duration: 0.65, ease: 'power3.out', stagger: 0.035, delay: 0.45 },
          );
        } else {
          gsap.fromTo(sub, { y: 25, opacity: 0 }, { y: 0, opacity: 1, duration: 0.65, ease: 'power3.out', delay: 0.45 });
        }
      }

      const btns = hero.querySelectorAll<HTMLElement>('.mt-10 a');
      if (btns.length) {
        gsap.fromTo(btns, { y: 35, opacity: 0, scale: 0.93 }, { y: 0, opacity: 1, scale: 1, duration: 0.8, ease: 'power4.out', stagger: 0.1, delay: 0.75 });
      }
    });

    // ══════════════════════════════════════
    // NON-HERO SECTIONS — CSS animations
    // ══════════════════════════════════════

    // Get ALL [data-motion] elements and standalone headings/paragraphs
    const candidates = root.querySelectorAll<HTMLElement>(
      '[data-motion], h1, h2, h3, h4, p',
    );

    const animate: HTMLElement[] = [];

    candidates.forEach((el) => {
      // Skip hero
      if (el.closest('#home')) return;
      // Skip decor
      if (el.closest('.absolute')) return;
      // Skip empty paragraphs
      if (el.tagName === 'P' && !el.textContent?.trim()) return;

      // Skip elements INSIDE another animated parent
      // (they'll animate as part of the parent's entrance)
      const dataMotionParent = el.closest('[data-motion]');
      if (dataMotionParent && dataMotionParent !== el) {
        // Exception: structural children that should staggered individually
        const isLi = el.tagName === 'LI';
        if (!isLi) return;
      }

      el.classList.add('ag-m');
      animate.push(el);
    });

    if (animate.length === 0) return;

    // Assign delays based on element type within each section
    const sectionMap = new Map<Element, HTMLElement[]>();

    animate.forEach((el) => {
      const section = el.closest('section, footer') || root;
      if (!sectionMap.has(section)) sectionMap.set(section, []);
      sectionMap.get(section)!.push(el);
    });

    // Assign delays per section
    sectionMap.forEach((els, _section) => {
      els.forEach((el, i) => {
        let delay = 60 + i * 50;

        // Type-based delay offsets
        const tag = el.tagName.toLowerCase();
        if (tag === 'h2' || tag === 'h3') delay = 10 + i * 30;
        else if (el.matches('[data-motion]')) delay = 80 + i * 60;
        else if (tag === 'p') delay = 120 + i * 40;
        else if (tag === 'li') delay = 200 + i * 35;

        el.style.setProperty('--ag-delay', `${delay}ms`);
      });
    });

    // Double rAF: ensure initial hidden state paints before revealing
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const obs = new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const els = sectionMap.get(entry.target) || [];
              els.forEach((el) => el.classList.add('ag-v'));
              obs.unobserve(entry.target);
            });
          },
          { threshold: 0.05, rootMargin: '0px 0px -30px 0px' },
        );

        sectionMap.forEach((_, section) => obs.observe(section));
      });
    });
  }, []);

  return null;
};

export default GlobalMotionLayer;
