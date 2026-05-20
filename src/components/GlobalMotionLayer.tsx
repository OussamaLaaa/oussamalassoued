import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface GlobalMotionLayerProps {}

const prefersReduced = () => {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  } catch {
    return false;
  }
};

function splitTextToSpans(el: HTMLElement) {
  if (el.children.length > 0) return [];
  const text = el.textContent || '';
  if (!text.trim()) return [];
  el.textContent = '';
  const chars = text.split('');
  const spans: HTMLSpanElement[] = chars.map((char) => {
    const span = document.createElement('span');
    span.textContent = char === ' ' ? '\u00A0' : char;
    span.style.display = 'inline-block';
    span.style.whiteSpace = 'pre';
    el.appendChild(span);
    return span;
  });
  return spans;
}

function splitToWords(el: HTMLElement) {
  if (el.children.length > 0) return [];
  const text = el.textContent || '';
  if (!text.trim()) return [];
  el.textContent = '';
  const words = text.split(/\s+/);
  const spans: HTMLSpanElement[] = [];
  words.forEach((word, i) => {
    if (i > 0) {
      const space = document.createElement('span');
      space.textContent = '\u00A0';
      space.style.display = 'inline-block';
      el.appendChild(space);
    }
    const span = document.createElement('span');
    span.textContent = word;
    span.style.display = 'inline-block';
    el.appendChild(span);
    spans.push(span);
  });
  return spans;
}

const GlobalMotionLayer: React.FC<GlobalMotionLayerProps> = () => {
  const ctxRef = useRef<gsap.Context | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (prefersReduced()) return;

    const ctx = gsap.context(() => {
      try {
        const root = document.querySelector('[data-surface="static-home"]');
        if (!root) return;

        const hero = document.getElementById('home');
        const isMobile = window.innerWidth < 768;

        // ══════════════════════════════════════════════
        // HERO TITLE — character-by-character float-up
        // ══════════════════════════════════════════════
        const heroTitle = hero?.querySelector<HTMLElement>('h1');
        if (heroTitle && isMobile === false) {
          const chars = splitTextToSpans(heroTitle);
          gsap.fromTo(
            chars,
            { y: 60, opacity: 0, rotationX: -40, transformPerspective: 600 },
            {
              y: 0,
              opacity: 1,
              rotationX: 0,
              duration: 0.7,
              ease: 'back.out(1.4)',
              stagger: { each: 0.025, from: 'start' },
              delay: 0.15,
            },
          );
        } else if (heroTitle) {
          // Mobile: simpler entrance
          gsap.fromTo(
            heroTitle,
            { y: 40, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.1 },
          );
        }

        // ══════════════════════════════════════════════
        // HERO SUBTITLE — word-by-word reveal
        // ══════════════════════════════════════════════
        const heroSub = hero?.querySelector<HTMLElement>('p.text-lg, p.text-xl');
        if (heroSub) {
          const words = splitToWords(heroSub);
          gsap.fromTo(
            words,
            { y: 20, opacity: 0, scale: 0.95 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.6,
              ease: 'power3.out',
              stagger: { each: 0.04, from: 'start' },
              delay: 0.6,
            },
          );
        }

        // ══════════════════════════════════════════════
        // HERO BUTTONS — float up with bounce
        // ══════════════════════════════════════════════
        const heroBtns = hero?.querySelectorAll<HTMLElement>('.mt-10 a');
        if (heroBtns?.length) {
          gsap.fromTo(
            heroBtns,
            { y: 30, opacity: 0, scale: 0.95 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.8,
              ease: 'power4.out',
              stagger: 0.1,
              delay: 0.9,
            },
          );
        }

        // ══════════════════════════════════════════════
        // HERO AVATAR STRIP
        // ══════════════════════════════════════════════
        const avatarStrip = hero?.querySelector<HTMLElement>('.mt-14');
        if (avatarStrip) {
          gsap.fromTo(
            avatarStrip,
            { y: 25, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 1.1 },
          );
        }

        // ══════════════════════════════════════════════
        // TRUSTED BY MARQUEE
        // ══════════════════════════════════════════════
        const marquee = hero?.querySelector<HTMLElement>('[class*="Marquee"], [class*="experience"]');
        if (marquee) {
          gsap.fromTo(
            marquee,
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', delay: 1.3 },
          );
        }

        // ══════════════════════════════════════════════
        // SECTION ENTRANCE — gsap + ScrollTrigger
        // ══════════════════════════════════════════════
        const sections = [
          { id: 'values', delayBase: 0 },
          { id: 'about', delayBase: 0 },
          { id: 'projects', delayBase: 0 },
          { id: 'testimonials', delayBase: 0 },
          { id: 'contact', delayBase: 0 },
        ];

        sections.forEach(({ id, delayBase }) => {
          const section = document.getElementById(id);
          if (!section) return;

          ScrollTrigger.create({
            trigger: section,
            start: 'top 82%',
            once: true,
            onEnter: () => {
              // ── Section headings (h2, eyebrow) ──
              const headings = section.querySelectorAll<HTMLElement>('h2.tracking-tight, h3');
              gsap.fromTo(
                headings,
                { y: 50, opacity: 0, rotateX: -15, transformPerspective: 700 },
                {
                  y: 0,
                  opacity: 1,
                  rotateX: 0,
                  duration: 1,
                  ease: 'power4.out',
                  stagger: 0.06,
                  delay: delayBase + 0.05,
                },
              );

              // ── Section paragraphs ──
              const paragraphs = section.querySelectorAll<HTMLElement>(
                'p.text-muted-foreground, p.leading-relaxed',
              );
              gsap.fromTo(
                paragraphs,
                { y: 25, opacity: 0 },
                {
                  y: 0,
                  opacity: 1,
                  duration: 0.9,
                  ease: 'power3.out',
                  stagger: 0.04,
                  delay: delayBase + 0.15,
                },
              );

              // ── Eyebrow text ──
              const eyebrow = section.querySelectorAll<HTMLElement>('.text-sm.uppercase');
              gsap.fromTo(
                eyebrow,
                { y: 15, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7, ease: 'power2.out', delay: delayBase + 0.05 },
              );

              // ── Cards (3D entrance) ──
              const cards = section.querySelectorAll<HTMLElement>('[data-motion].rounded-2xl');
              if (cards.length > 0) {
                gsap.fromTo(
                  cards,
                  {
                    y: 80,
                    opacity: 0,
                    rotateX: isMobile ? 0 : 15,
                    rotateY: isMobile ? 0 : -5,
                    transformPerspective: 1000,
                  },
                  {
                    y: 0,
                    opacity: 1,
                    rotateX: 0,
                    rotateY: 0,
                    duration: 1.1,
                    ease: 'power4.out',
                    stagger: 0.1,
                    delay: delayBase + 0.2,
                  },
                );
              }

              // ── Skill chips (pop-in) ──
              const chips = section.querySelectorAll<HTMLElement>('.rounded-full');
              if (chips.length > 0 && id !== 'testimonials') {
                gsap.fromTo(
                  chips,
                  { scale: 0, opacity: 0, y: 20 },
                  {
                    scale: 1,
                    opacity: 1,
                    y: 0,
                    duration: 0.5,
                    ease: 'back.out(1.7)',
                    stagger: 0.03,
                    delay: delayBase + 0.35,
                  },
                );
              }

              // ── Certification items ──
              const certs = section.querySelectorAll<HTMLElement>('.rounded-xl.hover\\:bg-muted\\/50, [class*="rounded-xl"]');
              if (certs.length > 0 && id === 'about') {
                gsap.fromTo(
                  certs,
                  { x: -20, opacity: 0 },
                  {
                    x: 0,
                    opacity: 1,
                    duration: 0.6,
                    ease: 'power3.out',
                    stagger: 0.05,
                    delay: delayBase + 0.45,
                  },
                );
              }

              // ── Buttons inside section ──
              const btns = section.querySelectorAll<HTMLElement>('a[class*="rounded-full"]');
              if (btns.length > 0) {
                gsap.fromTo(
                  btns,
                  { y: 20, opacity: 0 },
                  {
                    y: 0,
                    opacity: 1,
                    duration: 0.7,
                    ease: 'power3.out',
                    stagger: 0.06,
                    delay: delayBase + 0.3,
                  },
                );
              }

              // ── List items (checkmarks) ──
              const listItems = section.querySelectorAll<HTMLElement>('ul.space-y-3 > li');
              if (listItems.length > 0) {
                gsap.fromTo(
                  listItems,
                  { x: -15, opacity: 0 },
                  {
                    x: 0,
                    opacity: 1,
                    duration: 0.5,
                    ease: 'power3.out',
                    stagger: 0.04,
                    delay: delayBase + 0.3,
                  },
                );
              }
            },
          });
        });

        // ══════════════════════════════════════════════
        // FOOTER entrance
        // ══════════════════════════════════════════════
        const footer = document.querySelector('footer');
        if (footer) {
          ScrollTrigger.create({
            trigger: footer,
            start: 'top 85%',
            once: true,
            onEnter: () => {
              const footGroups = footer.querySelectorAll<HTMLElement>('.md\\:col-span-4, .md\\:col-span-2, .md\\:col-span-3');
              gsap.fromTo(
                footGroups,
                { y: 30, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.8, ease: 'power3.out', stagger: 0.08 },
              );

              const copyBar = footer.querySelector<HTMLElement>('.border-t > div');
              if (copyBar) {
                gsap.fromTo(
                  copyBar,
                  { y: 15, opacity: 0 },
                  { y: 0, opacity: 1, duration: 0.6, ease: 'power2.out', delay: 0.3 },
                );
              }
            },
          });
        }

        // ══════════════════════════════════════════════
        // Refresh ScrollTrigger after layout settles
        // ══════════════════════════════════════════════
        requestAnimationFrame(() => ScrollTrigger.refresh());

      } catch (err) {
        // ignore
      }
    });

    ctxRef.current = ctx;

    return () => {
      try {
        ScrollTrigger.getAll().forEach((st) => st.kill());
        ctxRef.current?.revert();
      } catch (e) {}
    };
  }, []);

  return null;
};

export default GlobalMotionLayer;
