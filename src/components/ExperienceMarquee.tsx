import React, { useRef, useEffect } from 'react';
import gsap from 'gsap';
import { useSiteConfig } from '../context/SiteConfigContext';
import type { SiteExperienceMarqueeItem, SiteScene05LogoItem } from '../config/siteConfig';

interface ExperienceMarqueeProps {
  isActive?: boolean;
  title?: string;
  // allow passing scene05 company logos directly
  sceneLogos?: SiteScene05LogoItem[];
}

export const ExperienceMarquee: React.FC<ExperienceMarqueeProps> = ({ isActive = true, title, sceneLogos }) => {
  const { siteConfig } = useSiteConfig();

  // Prefer sceneLogos (companyLogos) if provided, otherwise fallback to legacy experienceMarquee
  const logoItems: SiteExperienceMarqueeItem[] = (sceneLogos && sceneLogos.length > 0)
    ? sceneLogos.filter((l) => l.visible).map((l) => ({ id: l.id, type: 'logo', value: l.logoSrc || l.name, visible: Boolean(l.visible) }))
    : siteConfig.experienceMarquee.filter((item) => item.visible);

  const items = logoItems;
  const marqueeRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive || !marqueeRef.current || !contentRef.current || items.length === 0) return;

    const ctx = gsap.context(() => {
      const content = contentRef.current!;

      const waitForLoad = () => {
        const images = content.querySelectorAll('img');
        let loadedCount = 0;

        if (images.length === 0) {
          startAnimation();
          return;
        }

        images.forEach((img) => {
          if ((img as HTMLImageElement).complete) {
            loadedCount++;
            if (loadedCount === images.length) startAnimation();
          } else {
            img.addEventListener('load', () => {
              loadedCount++;
              if (loadedCount === images.length) startAnimation();
            });
            img.addEventListener('error', () => {
              loadedCount++;
              if (loadedCount === images.length) startAnimation();
            });
          }
        });
      };

      const startAnimation = () => {
        // Duplicate content by 4 sets for smoothness
        const oneSetWidth = content.scrollWidth / 4 || content.scrollWidth;

        const tl = gsap.timeline({ repeat: -1 });
        tl.to(content, {
          x: -oneSetWidth,
          ease: 'none',
          duration: Math.max(12, oneSetWidth / 50),
          immediateRender: false,
        });
        tl.set(content, { x: 0 }, '+=0');
      };

      waitForLoad();
    }, marqueeRef);

    return () => ctx.revert();
  }, [isActive, items.length, JSON.stringify(items.map((i) => i.value))]);

  if (items.length === 0) return null;

  const displayItems = [...items, ...items, ...items, ...items];

  return (
    <div ref={marqueeRef} className="fw-reveal w-full mt-16 md:mt-24 py-16 overflow-hidden relative border-y border-[#0a0a0b]/12 bg-gradient-to-r from-[#f8f9fa] to-[#f4f5f7]">
      {title ? (
        <p className="text-center text-xs uppercase tracking-widest text-muted-foreground mb-6">{title}</p>
      ) : null}

      <div className="absolute left-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-r from-[#f8f9fa] to-transparent z-10 pointer-events-none" />
      <div className="absolute right-0 top-0 bottom-0 w-24 md:w-40 bg-gradient-to-l from-[#f8f9fa] to-transparent z-10 pointer-events-none" />

      <div ref={contentRef} className="marquee-content flex items-center whitespace-nowrap" style={{ width: 'fit-content' }}>
        {displayItems.map((item, i) => (
          <div key={`${item.id}-${i}`} className="flex items-center mx-10 md:mx-20 flex-shrink-0">
            {item.type === 'logo' ? (
              <img src={item.value} alt="Experience Logo" className="h-10 md:h-12 object-contain opacity-70 grayscale hover:grayscale-0 hover:opacity-100 transition-all duration-500" />
            ) : (
              <span className="font-mono text-[12px] md:text-sm uppercase tracking-[0.18em] text-[#0a0a0b]/80 font-medium">
                {item.value}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
