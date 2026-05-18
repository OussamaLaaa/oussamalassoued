import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { Footer } from './Footer';
import { getButtonClass, getCardClass, getGlassClass } from './designSystem';
import { BriefcaseIcon, FileTextIcon, MessageSquareIcon, SlidersHorizontalIcon } from './icons';

const SECTION_IDS = ['home', 'about', 'projects', 'testimonials', 'contact'] as const;

const isPlaceholderHref = (href: string) => href.trim() === '#';

const Reveal: React.FC<{
  children: ReactNode;
  className?: string;
  delayMs?: number;
}> = ({ children, className = '', delayMs = 0 }) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.18, rootMargin: '0px 0px -8% 0px' },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] will-change-transform ${
        isVisible ? 'translate-y-0 opacity-100 blur-0' : 'translate-y-6 opacity-0 blur-[6px]'
      } ${className}`}
      style={{ transitionDelay: `${delayMs}ms` }}
    >
      {children}
    </div>
  );
};

const SectionEyebrow: React.FC<{ children: ReactNode; className?: string }> = ({ children, className = '' }) => (
  <p className={`font-mono text-[0.7rem] uppercase tracking-[0.3em] ${className}`}>{children}</p>
);

const VALUE_ICONS = [MessageSquareIcon, SlidersHorizontalIcon, FileTextIcon, BriefcaseIcon];

export const StaticHomeLayout: React.FC = () => {
  const { siteConfig } = useSiteConfig();
  const { scene05, featured, visibility, persistentUI, footer, designSystem } = siteConfig;

  const visibleProjects = useMemo(() => siteConfig.projects.filter((project) => project.visible), [siteConfig.projects]);
  const visibleTestimonials = useMemo(
    () => siteConfig.testimonials.filter((testimonial) => testimonial.visible),
    [siteConfig.testimonials],
  );
  const visibleSkills = useMemo(() => scene05.skills.map((skill) => skill.trim()).filter(Boolean), [scene05.skills]);
  const featuredCertifications = useMemo(
    () => scene05.featuredCertifications.filter((item) => item.visible),
    [scene05.featuredCertifications],
  );
  const visibleCompanyLogos = useMemo(
    () => scene05.companyLogos.filter((item) => item.visible),
    [scene05.companyLogos],
  );
  const visibleValueCards = useMemo(
    () => scene05.valueCards.filter((item) => item.visible),
    [scene05.valueCards],
  );

  const visibleLogos = visibleCompanyLogos.length > 0 ? visibleCompanyLogos : scene05.companyLogos;
  const visibleCertificates = featuredCertifications.length > 0 ? featuredCertifications : scene05.certifications;
  const valueCards = visibleValueCards.length > 0 ? visibleValueCards : scene05.valueCards;

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.dispatchEvent(new CustomEvent('toggle-navbar', { detail: { show: true } }));

    const sections = SECTION_IDS.map((id) => document.getElementById(id)).filter(
      (section): section is HTMLElement => !!section,
    );

    if (sections.length === 0) return;

    const dispatchSection = (sectionId: string) => {
      window.dispatchEvent(new CustomEvent('nav-active-section', { detail: { section: sectionId } }));
    };

    dispatchSection('home');

    const observer = new IntersectionObserver(
      (entries) => {
        const active = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (active?.target instanceof HTMLElement) {
          dispatchSection(active.target.id);
        }
      },
      { threshold: [0.16, 0.3, 0.45, 0.6] },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  const navLabel = (section: string, fallback: string) =>
    persistentUI.navItems.find((item) => item.section === section)?.label || fallback;

  const testimonialsLabel = navLabel('testimonials', featured.titleLine2);

  const storyParagraphs = useMemo(
    () => scene05.storyParagraphs.map((item) => item.trim()).filter(Boolean),
    [scene05.storyParagraphs],
  );
  const aboutParagraphs = storyParagraphs.length > 0 ? storyParagraphs : [scene05.visionText];
  const aboutHighlights = useMemo(() => {
    const highlights = scene05.aboutHighlights.map((item) => item.trim()).filter(Boolean);
    if (highlights.length > 0) return highlights;
    return storyParagraphs.length > 0 ? storyParagraphs : [scene05.visionText];
  }, [scene05.aboutHighlights, scene05.visionText, storyParagraphs]);

  const heroTestimonials = useMemo(() => {
    const source = visibleTestimonials.length > 0 ? visibleTestimonials : siteConfig.testimonials;
    return source.filter((item) => item.avatar).slice(0, 3);
  }, [siteConfig.testimonials, visibleTestimonials]);

  const companyNames = useMemo(() => {
    const names = visibleLogos.map((logo) => logo.name).filter(Boolean);
    return names.length > 0 ? names : [];
  }, [visibleLogos]);

  const contactHref = persistentUI.letsTalkHref || footer.ctaButtonHref || scene05.actionHref;
  const primaryHeroHref = featured.ctaButtonHref || contactHref;
  const primaryCtaClass = getButtonClass(
    designSystem.components.featuredCtaButtonVariant,
    'light',
    'lg',
    'rounded-full h-12 px-6 shadow-lg',
  );
  const secondaryCtaClass = getButtonClass(
    designSystem.components.featuredViewAllButtonVariant,
    'light',
    'lg',
    'rounded-full h-12 px-6 bg-white/60 backdrop-blur-sm border border-[#111217]/12 text-[#111217]',
  );
  const valueCardClass = `${getCardClass(
    designSystem.components.scene05CardVariant,
    'light',
    'rounded-2xl p-6 transition-shadow hover:shadow-md',
  )} ${getGlassClass(designSystem.components.globalGlassVariant, 'light')}`;
  const aboutCardClass = `${getCardClass(
    designSystem.components.scene05CardVariant,
    'light',
    'rounded-2xl bg-white/70 p-8 md:p-10',
  )} ${getGlassClass(designSystem.components.globalGlassVariant, 'light')}`;
  const projectCardClass = getCardClass(
    designSystem.components.featuredProjectCardVariant,
    'light',
    'rounded-2xl overflow-hidden group cursor-pointer hover:shadow-lg transition-all p-0 gap-0',
  );

  const handlePlaceholderLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isPlaceholderHref(href)) {
      event.preventDefault();
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f7f5] text-[#111217]" data-surface="static-home">
      <section id="home" className="relative overflow-hidden border-b border-[#111217]/8">
        <div className="absolute inset-0 -z-10">
          <div
            className="absolute inset-0 opacity-[0.4]"
            style={{
              backgroundImage:
                'linear-gradient(to right, rgba(17,18,23,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(17,18,23,0.06) 1px, transparent 1px)',
              backgroundSize: '56px 56px',
              maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)',
              WebkitMaskImage:
                'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)',
            }}
          />
          <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-[#111217]/5 blur-3xl" />
          <div className="absolute top-20 -right-32 h-96 w-96 rounded-full bg-[#111217]/5 blur-3xl" />
        </div>

        <div className="site-shell max-w-5xl px-6 pt-28 pb-20 text-center md:pt-36">
          <Reveal>
            <div className="inline-flex items-center gap-2 rounded-full border border-[#111217]/12 bg-white/80 px-4 py-2 text-[0.72rem] font-medium uppercase tracking-[0.24em] text-[#111217]/65 shadow-[0_10px_26px_rgba(17,18,23,0.06)]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#111217]/70 opacity-60 animate-ping" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#111217]" />
              </span>
              <span className="text-xs">{scene05.badge}</span>
            </div>
          </Reveal>

          <Reveal delayMs={100}>
            <h1
              className="mx-auto mt-8 max-w-4xl tracking-tight"
              style={{
                fontSize: 'clamp(2.75rem, 7vw, 5.5rem)',
                lineHeight: 1.02,
                fontWeight: 600,
                letterSpacing: '-0.04em',
              }}
            >
              {scene05.heroTitleLine1}{' '}
              <span className="relative inline-block">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage:
                      'linear-gradient(110deg, #111217 0%, rgba(17,18,23,0.45) 100%)',
                  }}
                >
                  {scene05.heroTitleLine2}
                </span>
                <svg
                  viewBox="0 0 300 12"
                  className="absolute -bottom-2 left-0 h-3 w-full text-[#111217]/30"
                  preserveAspectRatio="none"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                >
                  <path d="M2 8 Q 75 2, 150 6 T 298 4" />
                </svg>
              </span>
            </h1>
          </Reveal>

          <Reveal delayMs={160}>
            <p className="mx-auto mt-8 max-w-2xl text-lg leading-relaxed text-[#111217]/68 md:text-xl">
              {scene05.heroSubtitle}
            </p>
          </Reveal>

          <Reveal delayMs={220}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <a
                href={primaryHeroHref}
                onClick={(event) => handlePlaceholderLinkClick(event, primaryHeroHref)}
                target={isPlaceholderHref(primaryHeroHref) ? undefined : '_blank'}
                rel={isPlaceholderHref(primaryHeroHref) ? undefined : 'noopener noreferrer'}
                className={primaryCtaClass}
              >
                {featured.ctaButtonText}
                <span aria-hidden="true">-&gt;</span>
              </a>
              <a href="#projects" className={secondaryCtaClass}>
                {featured.viewAllLabel}
                <span aria-hidden="true">-&gt;</span>
              </a>
            </div>
          </Reveal>

          {heroTestimonials.length > 0 || scene05.portraitCaption ? (
            <Reveal delayMs={280}>
              <div className="mt-14 flex flex-wrap items-center justify-center gap-4">
                {heroTestimonials.length > 0 ? (
                  <div className="flex -space-x-3">
                    {heroTestimonials.map((item) => (
                      <img
                        key={item.id}
                        src={item.avatar}
                        alt={item.name}
                        className="h-10 w-10 rounded-full border-2 border-[#f7f7f5] object-cover"
                      />
                    ))}
                  </div>
                ) : null}
                <div className="text-left">
                  <div className="flex items-center gap-1 text-[#111217]">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                      </svg>
                    ))}
                  </div>
                  {scene05.portraitCaption ? (
                    <p className="text-sm text-[#111217]/62">{scene05.portraitCaption}</p>
                  ) : null}
                </div>
              </div>
            </Reveal>
          ) : null}
        </div>

        {companyNames.length > 0 ? (
          <div className="site-shell max-w-6xl px-6 pb-20">
            <p className="mb-6 text-center text-xs uppercase tracking-widest text-[#111217]/55">
              {scene05.companyLogosTitle}
            </p>
            <div
              className="relative overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
                WebkitMaskImage:
                  'linear-gradient(to right, transparent, black 12%, black 88%, transparent)',
              }}
            >
              <div className="flex w-max gap-14 whitespace-nowrap animate-[marquee_30s_linear_infinite]">
                {[...companyNames, ...companyNames].map((name, i) => (
                  <span
                    key={`${name}-${i}`}
                    className="text-2xl tracking-tight text-[#111217]/55 transition-colors hover:text-[#111217]"
                    style={{ fontWeight: 600 }}
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
            <style>{`
              @keyframes marquee {
                from { transform: translateX(0); }
                to { transform: translateX(-50%); }
              }
            `}</style>
          </div>
        ) : null}
      </section>

      <section id="values" className="site-shell max-w-6xl px-6 py-20">
        <div className="mb-12">
          <SectionEyebrow className="text-[#111217]/55">{scene05.valuesEyebrow}</SectionEyebrow>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
            {scene05.visionTitle}
          </h2>
          <p className="mt-3 max-w-2xl text-[#111217]/65">{scene05.visionText}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {valueCards.map((card, index) => {
            const Icon = VALUE_ICONS[index % VALUE_ICONS.length];
            return (
              <Reveal key={card.id} delayMs={index * 70}>
                <article className={valueCardClass}>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#111217]/10 text-[#111217]">
                    <Icon size={18} strokeWidth={1.6} />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold">{card.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-[#111217]/65">{card.description}</p>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="about" className="site-shell max-w-6xl px-6 py-20">
        <div className="grid gap-10 lg:grid-cols-2">
          <Reveal>
            <div className={aboutCardClass}>
              <h2 className="text-2xl font-semibold tracking-[-0.02em] md:text-[2rem]">
                {scene05.storyTitle}
              </h2>
              <div className="mt-6 space-y-4 text-[#111217]/68">
                {aboutParagraphs.map((paragraph) => (
                  <p key={paragraph} className="leading-relaxed">
                    {paragraph}
                  </p>
                ))}
              </div>
              {aboutHighlights.length > 0 ? (
                <ul className="mt-6 space-y-3">
                  {aboutHighlights.map((line) => (
                    <li key={line} className="flex items-start gap-3 text-sm">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="mt-0.5 h-5 w-5 text-[#111217]"
                      >
                        <path d="M20 6L9 17l-5-5" />
                      </svg>
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </Reveal>

          <div className="space-y-6">
            <div>
              <SectionEyebrow className="text-[#111217]/55">{scene05.skillsEyebrow}</SectionEyebrow>
              <h3 className="mt-3 text-xl font-semibold tracking-tight">{scene05.skillsTitle}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleSkills.map((skill) => (
                <span
                  key={skill}
                  className="rounded-full border border-[#111217]/10 bg-white px-4 py-1.5 text-sm text-[#111217]/75"
                >
                  {skill}
                </span>
              ))}
            </div>
            <div className="h-px bg-[#111217]/10" />
            <div>
              <SectionEyebrow className="text-[#111217]/55">{scene05.certificationsTitle}</SectionEyebrow>
              <div className="mt-4 space-y-2">
                {visibleCertificates.map((item, index) => {
                  const title = typeof item === 'string' ? item : item.title;
                  const issuer = typeof item === 'string' ? '' : item.issuer;
                  return (
                    <div key={`${title}-${index}`} className="rounded-xl border border-[#111217]/10 bg-white/80 p-3">
                      <div className="text-sm font-medium text-[#111217]">{title}</div>
                      {issuer ? (
                        <div className="text-xs uppercase tracking-[0.2em] text-[#111217]/45">{issuer}</div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {visibility.featuredWork ? (
        <section id="projects" className="site-shell max-w-6xl px-6 py-20">
          <div className="mb-12 flex flex-wrap items-end justify-between gap-4">
            <div>
              <SectionEyebrow className="text-[#111217]/55">{featured.titleLine1}</SectionEyebrow>
              <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
                {featured.titleLine2}
              </h2>
              <p className="mt-3 max-w-xl text-[#111217]/65">{featured.description}</p>
            </div>
            <a href="#projects" className={secondaryCtaClass}>
              {featured.viewAllLabel}
            </a>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {visibleProjects.map((project, index) => {
              const targetHref = project.buttonType === 'caseStudy' ? project.behance : project.live;
              const buttonLabel = project.buttonType === 'caseStudy' ? featured.caseStudyLabel : featured.liveLabel;
              return (
                <Reveal key={project.id} delayMs={index * 80}>
                  <article className={projectCardClass}>
                    <div className="aspect-[4/3] overflow-hidden bg-[#f1f1f1]">
                      <img
                        src={project.img}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <div className="p-6">
                      <span className="inline-flex rounded-full border border-[#111217]/10 bg-white px-3 py-1 text-xs uppercase tracking-[0.14em] text-[#111217]/60">
                        {project.tags}
                      </span>
                      <h3 className="mt-3 text-lg font-semibold tracking-tight">{project.title}</h3>
                      <div className="mt-5 inline-flex items-center text-sm text-[#111217]">
                        <a
                          href={targetHref}
                          onClick={(event) => handlePlaceholderLinkClick(event, targetHref)}
                          target={isPlaceholderHref(targetHref) ? undefined : '_blank'}
                          rel={isPlaceholderHref(targetHref) ? undefined : 'noopener noreferrer'}
                          className="inline-flex items-center gap-2"
                        >
                          {buttonLabel}
                          <span aria-hidden="true">-&gt;</span>
                        </a>
                      </div>
                    </div>
                  </article>
                </Reveal>
              );
            })}
          </div>
        </section>
      ) : null}

      {visibility.testimonialsSection ? (
        <section id="testimonials" className="site-shell max-w-6xl px-6 py-20">
          <div className="mb-12">
            <SectionEyebrow className="text-[#111217]/55">{featured.testimonialsEyebrow}</SectionEyebrow>
            <h2 className="mt-3 text-3xl font-semibold tracking-[-0.03em] md:text-4xl">
              {testimonialsLabel}
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {visibleTestimonials.map((testimonial, index) => (
              <Reveal key={testimonial.id} delayMs={index * 80}>
                <article className={valueCardClass}>
                  <p className="text-sm leading-relaxed text-[#111217]/75">{testimonial.quote}</p>
                  <div className="mt-5 flex items-center gap-3">
                    <img src={testimonial.avatar} alt={testimonial.name} className="h-10 w-10 rounded-full object-cover" />
                    <div>
                      <div className="text-sm font-medium">{testimonial.name}</div>
                      <div className="text-xs uppercase tracking-[0.16em] text-[#111217]/50">{testimonial.title}</div>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </section>
      ) : null}

      <section id="contact" className="site-shell max-w-5xl px-6 py-28 text-center">
        <h2
          className="mx-auto max-w-4xl tracking-tight"
          style={{
            fontSize: 'clamp(3rem, 8vw, 6rem)',
            lineHeight: 1,
            fontWeight: 600,
            letterSpacing: '-0.04em',
          }}
        >
          {featured.ctaTitleLine1}
          <br />
          {featured.ctaTitleLine2}
        </h2>
        <p className="mx-auto mt-8 max-w-xl text-[#111217]/65">{featured.ctaDescription}</p>
        <a
          href={featured.ctaButtonHref || contactHref}
          onClick={(event) => handlePlaceholderLinkClick(event, featured.ctaButtonHref || contactHref)}
          target={isPlaceholderHref(featured.ctaButtonHref || contactHref) ? undefined : '_blank'}
          rel={isPlaceholderHref(featured.ctaButtonHref || contactHref) ? undefined : 'noopener noreferrer'}
          className={`${primaryCtaClass} mt-10 inline-flex`}
        >
          {featured.ctaButtonText}
          <span aria-hidden="true">-&gt;</span>
        </a>
      </section>

      <Footer />
    </main>
  );
};

export default StaticHomeLayout;
