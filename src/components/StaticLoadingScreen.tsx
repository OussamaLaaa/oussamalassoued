import React, { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import './StaticLoadingScreen.css';

interface StaticLoadingScreenProps {
  progress: number;
  isComplete: boolean;
  onFadeComplete: () => void;
}

export const StaticLoadingScreen: React.FC<StaticLoadingScreenProps> = ({
  progress,
  isComplete,
  onFadeComplete,
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const onFadeCompleteRef = useRef(onFadeComplete);
  const startedAtRef = useRef<number>(Date.now());
  const exitStartedRef = useRef(false);
  const hardExitTimerRef = useRef<number | null>(null);
  const [logoReady, setLogoReady] = useState(false);

  const MIN_VISIBLE_MS = 2400;
  const HARD_EXIT_MS = 6200;

  const runExit = () => {
    if (exitStartedRef.current) return;
    exitStartedRef.current = true;

    if (hardExitTimerRef.current !== null) {
      window.clearTimeout(hardExitTimerRef.current);
      hardExitTimerRef.current = null;
    }

    const rootEl = rootRef.current;
    if (!rootEl) {
      onFadeCompleteRef.current();
      return;
    }

    gsap.to(rootEl, {
      autoAlpha: 0,
      scale: 1.03,
      duration: 0.62,
      ease: 'power2.inOut',
      onComplete: () => onFadeCompleteRef.current(),
    });
  };

  useEffect(() => {
    onFadeCompleteRef.current = onFadeComplete;
  }, [onFadeComplete]);

  useEffect(() => {
    const rootEl = rootRef.current;
    if (!rootEl) return;

    const logoShell = rootEl.querySelector('.sls-logo-shell');
    const sweep = rootEl.querySelector('.sls-sweep');
    const rings = Array.from(rootEl.querySelectorAll('.sls-ring'));
    const auroraA = rootEl.querySelector('.sls-aurora--a');
    const auroraB = rootEl.querySelector('.sls-aurora--b');
    const auroraC = rootEl.querySelector('.sls-aurora--c');

    const ctx = gsap.context(() => {
      gsap.set(rootEl, { autoAlpha: 1 });

      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
      tl.fromTo(
        logoShell,
        { autoAlpha: 0, scale: 0.68, rotate: -10, filter: 'blur(12px)' },
        { autoAlpha: 1, scale: 1, rotate: 0, filter: 'blur(0px)', duration: 1.1, ease: 'power4.out' },
        0.08,
      );
      tl.fromTo(
        rings,
        { autoAlpha: 0, scale: 0.42 },
        { autoAlpha: 1, scale: 1, duration: 0.92, stagger: 0.12, ease: 'expo.out' },
        0.1,
      );
      tl.fromTo(
        sweep,
        { xPercent: -135, autoAlpha: 0 },
        { xPercent: 145, autoAlpha: 1, duration: 1.08, ease: 'power2.inOut' },
        0.48,
      );

      gsap.to('.sls-ring--outer', {
        rotate: 360,
        duration: 10,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      });
      gsap.to('.sls-ring--middle', {
        rotate: -360,
        duration: 7.6,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      });
      gsap.to('.sls-ring--inner', {
        rotate: 360,
        duration: 5.4,
        repeat: -1,
        ease: 'none',
        transformOrigin: '50% 50%',
      });

      gsap.to(sweep, {
        xPercent: 155,
        duration: 1.35,
        delay: 1.45,
        repeat: -1,
        repeatDelay: 0.35,
        ease: 'power2.inOut',
        yoyo: false,
        onRepeat: () => gsap.set(sweep, { xPercent: -135, autoAlpha: 0.86 }),
      });

      gsap.to(auroraA, {
        xPercent: 16,
        yPercent: -8,
        scale: 1.18,
        duration: 7.2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to(auroraB, {
        xPercent: -14,
        yPercent: 10,
        scale: 1.22,
        duration: 8.5,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
      gsap.to(auroraC, {
        xPercent: 12,
        yPercent: 6,
        scale: 1.12,
        duration: 6.8,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    }, rootEl);

    hardExitTimerRef.current = window.setTimeout(() => runExit(), HARD_EXIT_MS);

    return () => {
      if (hardExitTimerRef.current !== null) {
        window.clearTimeout(hardExitTimerRef.current);
        hardExitTimerRef.current = null;
      }
      ctx.revert();
    };
  }, []);

  useEffect(() => {
    if (exitStartedRef.current) return;

    const elapsed = Date.now() - startedAtRef.current;
    const minDurationMet = elapsed >= MIN_VISIBLE_MS;
    const preloadReady = isComplete || progress >= 99;

    if (minDurationMet && preloadReady && logoReady) {
      runExit();
    }
  }, [isComplete, logoReady, progress]);

  return (
    <div ref={rootRef} className="sls-root" aria-hidden="true">
      <div className="sls-aurora sls-aurora--a" />
      <div className="sls-aurora sls-aurora--b" />
      <div className="sls-aurora sls-aurora--c" />

      <div className="sls-centerpiece">
        <div className="sls-ring sls-ring--outer" />
        <div className="sls-ring sls-ring--middle" />
        <div className="sls-ring sls-ring--inner" />

        <div className="sls-logo-shell">
          <div className="sls-sweep" />
          <img
            src={`${import.meta.env.BASE_URL}brand-logo.svg`}
            alt="Brand logo"
            className="sls-logo"
            onLoad={() => setLogoReady(true)}
            onError={() => setLogoReady(true)}
          />
        </div>
      </div>

      <div className="sls-noise" />
    </div>
  );
};
