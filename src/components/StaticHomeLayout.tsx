import React, { useEffect, useMemo } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { getButtonClass, getCardClass, getGlassClass, getScaledRem } from './designSystem';
import { Footer } from './Footer';
import { getSocialIconComponent } from './icons';

const SECTION_IDS = ['home', 'about', 'projects', 'testimonials'] as const;

const isPlaceholderHref = (href: string) => href.trim() === '#';

export const StaticHomeLayout: React.FC = () => {
  const { siteConfig } = useSiteConfig();
  const { scene05, featured, visibility, designSystem } = siteConfig;

  const visibleProjects = useMemo(() => siteConfig.projects.filter((project) => project.visible), [siteConfig.projects]);
  const visibleTestimonials = useMemo(
    () => siteConfig.testimonials.filter((testimonial) => testimonial.visible),
    [siteConfig.testimonials],
  );
  const visibleSkills = useMemo(() => scene05.skills.map((skill) => skill.trim()).filter(Boolean), [scene05.skills]);
  const visibleAiTags = useMemo(() => scene05.aiTags.map((tag) => tag.trim()).filter(Boolean), [scene05.aiTags]);
  const visibleSocialLinks = useMemo(() => scene05.socialLinks.filter((link) => link.visible), [scene05.socialLinks]);
  const featuredCertifications = useMemo(
    () => scene05.featuredCertifications.filter((item) => item.visible),
    [scene05.featuredCertifications],
  );

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
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length === 0) return;

        const nextSection = visibleEntries.reduce((best, entry) => {
          if (!best) return entry;
          return entry.intersectionRatio > best.intersectionRatio ? entry : best;
        }).target.id;

        dispatchSection(nextSection);
      },
      {
        threshold: [0.2, 0.35, 0.5, 0.7],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => observer.disconnect();
  }, []);

  const heroButtonClass = getButtonClass(designSystem.components.scene05ActionButtonVariant, 'dark', 'lg');
  const secondaryButtonClass = getButtonClass(designSystem.components.featuredViewAllButtonVariant, 'dark', 'lg');
  const projectButtonClass = getButtonClass(designSystem.components.featuredProjectButtonVariant, 'dark', 'sm');

  const storyParagraphs = scene05.storyParagraphs.map((item) => item.trim()).filter(Boolean);
  const aboutParagraphs = storyParagraphs.length > 0 ? storyParagraphs : [scene05.visionText];
  const heroStats = [
    { label: scene05.skillsTitle, value: String(visibleSkills.length) },
    { label: scene05.certificationsTitle, value: String(featuredCertifications.length || scene05.certifications.length) },
    { label: scene05.companyLogosTitle, value: String(scene05.companyLogos.filter((item) => item.visible).length) },
  ];

  const handlePlaceholderLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isPlaceholderHref(href)) {
      event.preventDefault();
    }
  };

  return (
    <main className="relative overflow-hidden bg-[#09090b] text-white" data-surface="static-home">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-10%] h-[28rem] w-[28rem] rounded-full bg-white/[0.04] blur-3xl" />
        <div className="absolute right-[-8%] top-[12%] h-[24rem] w-[24rem] rounded-full bg-[#d8b27a]/[0.12] blur-3xl" />
        <div className="absolute bottom-[18%] left-[22%] h-[18rem] w-[18rem] rounded-full bg-[#84a7ff]/[0.08] blur-3xl" />
      </div>

      <section id="home" className="relative border-b border-white/8">
        <div className="site-shell grid gap-10 py-24 md:py-28 lg:grid-cols-[1.15fr_0.85fr] lg:items-center">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/6 px-4 py-2 text-[0.72rem] font-medium uppercase tracking-[0.24em] text-white/70 backdrop-blur-xl">
              <span className="h-1.5 w-1.5 rounded-full bg-[#d8b27a]" />
              {scene05.badge}
            </div>

            <div className="space-y-5">
              <p className="max-w-[24ch] font-mono text-[0.72rem] uppercase tracking-[0.28em] text-white/45">
                {scene05.role}
              </p>
              <h1
                className="max-w-[11ch] text-balance font-sans text-white"
                style={{ fontSize: getScaledRem(72), lineHeight: 0.94, letterSpacing: '-0.05em' }}
              >
                {scene05.name}
              </h1>
              <p className="max-w-[42rem] text-balance text-[1rem] leading-7 text-white/72 md:text-[1.08rem]">
                {scene05.visionText}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <a
                href={scene05.actionHref}
                onClick={(event) => handlePlaceholderLinkClick(event, scene05.actionHref)}
                target={isPlaceholderHref(scene05.actionHref) ? undefined : '_blank'}
                rel={isPlaceholderHref(scene05.actionHref) ? undefined : 'noopener noreferrer'}
                className={heroButtonClass}
              >
                {scene05.actionLabel}
              </a>
              <a href="#projects" className={secondaryButtonClass}>
                {featured.viewAllLabel}
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {heroStats.map((stat) => (
                <div
                  key={stat.label}
                  className={getCardClass(
                    designSystem.components.scene05CardVariant,
                    'dark',
                    'border-white/10 bg-white/[0.05] p-4 backdrop-blur-xl',
                  )}
                >
                  <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-white/45">{stat.label}</p>
                  <p className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <div className={getGlassClass(designSystem.components.globalGlassVariant, 'dark', 'overflow-hidden p-4')}>
              <div className="relative overflow-hidden rounded-[20px] border border-white/10 bg-black/35">
                <img
                  src={scene05.portraitImage}
                  alt={scene05.portraitAlt}
                  className="h-[28rem] w-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/18 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5">
                  <p className="max-w-[22ch] text-sm leading-6 text-white/82">{scene05.portraitCaption}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={getCardClass(designSystem.components.scene05CardVariant, 'dark', 'p-5')}>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-white/45">{scene05.skillsTitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {visibleSkills.slice(0, 5).map((skill) => (
                    <span key={skill} className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs text-white/72">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className={getCardClass(designSystem.components.scene05CardVariant, 'dark', 'p-5')}>
                <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-white/45">{scene05.aiTitle}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {visibleAiTags.slice(0, 5).map((tag) => (
                    <span key={tag} className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs text-white/72">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="about" className="relative border-b border-white/8 py-20 md:py-28">
        <div className="site-shell grid gap-8 lg:grid-cols-[0.86fr_1.14fr] lg:items-start">
          <div className={getCardClass(designSystem.components.scene05CardVariant, 'dark', 'p-6 md:p-8')}>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
              {scene05.storyTitle}
            </h2>
            <div className="mt-6 space-y-4 text-[0.98rem] leading-7 text-white/70">
              {aboutParagraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              {visibleSocialLinks.map((link) => {
                const SocialIcon = getSocialIconComponent(link.icon);
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(event) => handlePlaceholderLinkClick(event, link.href)}
                    target={isPlaceholderHref(link.href) ? undefined : '_blank'}
                    rel={isPlaceholderHref(link.href) ? undefined : 'noopener noreferrer'}
                    className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[0.05] px-4 py-2 text-sm text-white/72 transition-colors hover:bg-white/[0.09] hover:text-white"
                  >
                    <SocialIcon size={16} strokeWidth={1.8} />
                    {link.label}
                  </a>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className={getCardClass(designSystem.components.scene05CardVariant, 'dark', 'p-5')}>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-white/45">{scene05.certificationsTitle}</p>
              <div className="mt-4 space-y-3">
                {featuredCertifications.slice(0, 3).map((cert) => (
                  <div key={cert.id} className="rounded-[16px] border border-white/10 bg-white/[0.04] p-4">
                    <p className="text-sm font-medium text-white">{cert.title}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.18em] text-white/45">{cert.issuer}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={getCardClass(designSystem.components.scene05CardVariant, 'dark', 'p-5')}>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-white/45">{scene05.companyLogosTitle}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {scene05.companyLogos
                  .filter((item) => item.visible)
                  .slice(0, 8)
                  .map((logo) => (
                    <span key={logo.id} className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs text-white/70">
                      {logo.name}
                    </span>
                  ))}
              </div>
            </div>

            <div className={getCardClass(designSystem.components.scene05CardVariant, 'dark', 'p-5 md:col-span-2')}>
              <p className="font-mono text-[0.68rem] uppercase tracking-[0.24em] text-white/45">{scene05.skillsTitle}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {visibleSkills.map((skill) => (
                  <span key={`about-${skill}`} className="rounded-full border border-white/12 bg-white/[0.05] px-3 py-1.5 text-xs text-white/72">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {visibility.featuredWork ? (
        <section id="projects" className="relative border-b border-white/8 py-20 md:py-28">
          <div className="site-shell space-y-8">
            <div className="max-w-[52rem] space-y-4">
              <p className="font-mono text-[0.72rem] uppercase tracking-[0.28em] text-white/45">
                {featured.titleLine1} {featured.titleLine2}
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
                {featured.description}
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleProjects.map((project) => {
                const targetHref = project.buttonType === 'caseStudy' ? project.behance : project.live;

                return (
                  <article
                    key={project.id}
                    className={getCardClass(designSystem.components.featuredProjectCardVariant, 'dark', 'overflow-hidden')}
                  >
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <img
                        src={project.img}
                        alt={project.title}
                        className="h-full w-full object-cover transition-transform duration-500 hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/14 to-transparent" />
                    </div>
                    <div className="space-y-4 p-5">
                      <div className="space-y-1">
                        <h3 className="text-xl font-semibold tracking-[-0.03em] text-white">{project.title}</h3>
                        <p className="text-xs uppercase tracking-[0.18em] text-white/45">{project.tags}</p>
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <a
                          href={targetHref}
                          onClick={(event) => handlePlaceholderLinkClick(event, targetHref)}
                          target={isPlaceholderHref(targetHref) ? undefined : '_blank'}
                          rel={isPlaceholderHref(targetHref) ? undefined : 'noopener noreferrer'}
                          className={projectButtonClass}
                        >
                          {project.buttonType === 'caseStudy' ? featured.caseStudyLabel : featured.liveLabel}
                        </a>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}

      {visibility.testimonialsSection ? (
        <section id="testimonials" className="relative py-20 md:py-28">
          <div className="site-shell space-y-8">
            <div className="max-w-[52rem] space-y-4">
              <h2 className="text-3xl font-semibold tracking-[-0.04em] text-white md:text-4xl">
                {siteConfig.featured.titleLine1} {siteConfig.featured.titleLine2}
              </h2>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              {visibleTestimonials.map((testimonial) => (
                <article key={testimonial.id} className={getCardClass(designSystem.components.scene05CardVariant, 'dark', 'p-5')}>
                  <div className="flex items-center gap-4">
                    <img src={testimonial.avatar} alt={testimonial.name} className="h-14 w-14 rounded-2xl object-cover" />
                    <div>
                      <p className="text-base font-medium text-white">{testimonial.name}</p>
                      <p className="text-xs uppercase tracking-[0.18em] text-white/45">{testimonial.title}</p>
                    </div>
                  </div>
                  <p className="mt-5 text-[0.96rem] leading-7 text-white/72">{testimonial.quote}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Footer />
    </main>
  );
};

export default StaticHomeLayout;