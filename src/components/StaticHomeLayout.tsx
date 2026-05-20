import React, { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { getButtonClass } from './designSystem';
import { getSocialIconComponent } from './icons';
import {
  ArrowRight,
  ArrowUpRight,
  Sparkles,
  Layers,
  MousePointerClick,
  Lightbulb,
  CheckCircle2,
  Award,
  Quote,
} from 'lucide-react';
import { ExperienceMarquee } from './ExperienceMarquee';

const SECTION_IDS = ['home', 'about', 'projects', 'testimonials', 'contact'] as const;

const isPlaceholderHref = (href: string) => href.trim() === '#';

const joinClasses = (...parts: Array<string | false | null | undefined>) => parts.filter(Boolean).join(' ');

type BadgeVariant = 'default' | 'secondary' | 'outline';

const BADGE_VARIANT_CLASSES: Record<BadgeVariant, string> = {
  default: 'border-transparent bg-primary text-primary-foreground',
  secondary: 'border-transparent bg-secondary text-secondary-foreground',
  outline: 'text-foreground',
};

const Badge: React.FC<{ className?: string; children: ReactNode; variant?: BadgeVariant }> = ({
  className,
  children,
  variant = 'default',
}) => (
  <span
    className={joinClasses(
      'inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 overflow-hidden',
      BADGE_VARIANT_CLASSES[variant],
      className,
    )}
  >
    {children}
  </span>
);

const Card: React.FC<{ className?: string; children: ReactNode }> = ({ className, children }) => (
  <div data-motion className={joinClasses('bg-card text-card-foreground flex flex-col gap-6 rounded-xl border', className)}>
    {children}
  </div>
);

const CardHeader: React.FC<{ className?: string; children: ReactNode }> = ({ className, children }) => (
  <div
    className={joinClasses(
      '@container/card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 pt-6',
      className,
    )}
  >
    {children}
  </div>
);

const CardTitle: React.FC<{ className?: string; children: ReactNode }> = ({ className, children }) => (
  <h4 className={joinClasses('leading-none', className)}>{children}</h4>
);

const CardContent: React.FC<{ className?: string; children: ReactNode }> = ({ className, children }) => (
  <div className={joinClasses('px-6 [&:last-child]:pb-6', className)}>{children}</div>
);

const Avatar: React.FC<{ className?: string; children: ReactNode }> = ({ className, children }) => (
  <div className={joinClasses('relative flex size-10 shrink-0 overflow-hidden rounded-full', className)}>{children}</div>
);

const AvatarImage: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({ className, ...props }) => (
  <img className={joinClasses('aspect-square size-full', className)} {...props} />
);

const AvatarFallback: React.FC<{ className?: string; children: ReactNode }> = ({ className, children }) => (
  <div className={joinClasses('bg-muted flex size-full items-center justify-center rounded-full', className)}>
    {children}
  </div>
);

const Separator: React.FC<{ className?: string }> = ({ className }) => (
  <div className={joinClasses('bg-border h-px w-full', className)} />
);

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg==';

const ImageWithFallback: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = ({
  src,
  alt,
  className,
  style,
  ...rest
}) => {
  const [didError, setDidError] = useState(false);

  if (didError) {
    return (
      <div className={joinClasses('inline-block bg-gray-100 text-center align-middle', className)} style={style}>
        <div className="flex h-full w-full items-center justify-center">
          <img src={ERROR_IMG_SRC} alt="Error loading image" data-original-url={src} {...rest} />
        </div>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={() => setDidError(true)}
    />
  );
};

const SectionEyebrow: React.FC<{ className?: string; children: ReactNode }> = ({ className, children }) => (
  <p className={joinClasses('text-sm text-muted-foreground uppercase tracking-widest', className)}>{children}</p>
);

const getInitials = (value: string) => {
  const parts = value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '');

  return parts.length > 0 ? parts.join('') : 'NA';
};

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

  const companyNames = useMemo(() => {
    const names = visibleLogos.map((logo) => logo.name).filter(Boolean);
    return names.length > 0 ? names : [];
  }, [visibleLogos]);

  const heroTestimonials = useMemo(() => {
    const source = visibleTestimonials.length > 0 ? visibleTestimonials : siteConfig.testimonials;
    return source.filter((item) => item.avatar).slice(0, 3);
  }, [siteConfig.testimonials, visibleTestimonials]);

  const certificationItems = useMemo(() => {
    if (featuredCertifications.length > 0) {
      return featuredCertifications.map((item) => ({
        logoSrc: item.logoSrc,
        title: item.title,
        org: [item.issuer, item.year].filter(Boolean).join(' - '),
      }));
    }

    return (scene05.certifications ?? []).map((title) => ({ title, org: '', logoSrc: '' }));
  }, [featuredCertifications, scene05.certifications]);

  const projects = useMemo(() => {
    return visibleProjects.map((project) => ({
      ...project,
      summary: project.summary?.trim() || project.tags,
    }));
  }, [visibleProjects]);

  const testimonials = visibleTestimonials;
  const footerSocialLinks = footer.socialLinks.filter((link) => link.visible);
  const footerLegalLinks = footer.legalLinks.filter((link) => link.visible);
  const footerNavLinks = footer.navLinks.filter((link) => link.visible);

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
    'rounded-full h-12 px-6 bg-background/60 backdrop-blur-sm',
  );
  const viewAllClass = getButtonClass(
    designSystem.components.featuredViewAllButtonVariant,
    'light',
    'sm',
    'rounded-full',
  );
  const footerCtaClass = getButtonClass(
    designSystem.components.featuredCtaButtonVariant,
    'light',
    'md',
    'rounded-full',
  );
  const footerSocialClass = getButtonClass(
    designSystem.components.featuredViewAllButtonVariant,
    'light',
    'icon',
    'rounded-full bg-transparent border-0 h-11 w-11',
  );

  const handlePlaceholderLinkClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isPlaceholderHref(href)) {
      event.preventDefault();
    }
  };

  const valueIcons = [Layers, Sparkles, MousePointerClick, Lightbulb];

  return (
    <main
      className="min-h-screen bg-background text-foreground"
      style={{
        ['--background' as any]: '#ffffff',
        ['--foreground' as any]: '#0a0a0a',
        ['--card' as any]: '#ffffff',
        ['--card-foreground' as any]: '#0a0a0a',
        ['--popover' as any]: '#ffffff',
        ['--popover-foreground' as any]: '#0a0a0a',
        ['--primary' as any]: '#030213',
        ['--primary-foreground' as any]: '#ffffff',
        ['--secondary' as any]: '#ececf0',
        ['--secondary-foreground' as any]: '#030213',
        ['--muted' as any]: '#ececf0',
        ['--muted-foreground' as any]: '#717182',
        ['--accent' as any]: '#e9ebef',
        ['--accent-foreground' as any]: '#030213',
        ['--border' as any]: 'rgba(0, 0, 0, 0.1)',
      }}
      data-surface="static-home"
    >
      {/* ===================== HERO SECTION ===================== */}
      <section id="home" className="relative overflow-hidden">
        {/* Decorative grid background */}
        <div
          className="absolute inset-0 -z-10 opacity-[0.4]"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(10, 10, 10, 0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(10, 10, 10, 0.06) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
            maskImage: 'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 80% 60% at 50% 30%, black 40%, transparent 80%)',
          }}
        />
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-foreground/[0.04] blur-3xl -z-10" />
        <div className="absolute top-20 -right-32 h-96 w-96 rounded-full bg-foreground/[0.04] blur-3xl -z-10" />

        <div className="mx-auto max-w-5xl px-6 pt-28 md:pt-36 pb-20 text-center">
          <h1 data-motion
            className="tracking-tight mx-auto max-w-4xl"
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
                    'linear-gradient(110deg, var(--foreground) 0%, rgba(10, 10, 10, 0.45) 100%)',
                }}
              >
                {scene05.heroTitleLine2}
              </span>
              <svg
                viewBox="0 0 300 12"
                className="absolute -bottom-2 left-0 w-full h-3 text-foreground/30"
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

          <p data-motion className="mx-auto max-w-2xl mt-8 text-lg md:text-xl text-muted-foreground leading-relaxed">
            {scene05.heroSubtitle}
          </p>

          <div data-motion className="mt-10 flex flex-wrap justify-center items-center gap-3">
            <a
              href={primaryHeroHref}
              onClick={(event) => handlePlaceholderLinkClick(event, primaryHeroHref)}
              target={isPlaceholderHref(primaryHeroHref) ? undefined : '_blank'}
              rel={isPlaceholderHref(primaryHeroHref) ? undefined : 'noopener noreferrer'}
              className={primaryCtaClass}
            >
              {featured.ctaButtonText} <ArrowRight className="ml-2 h-4 w-4" />
            </a>
            <a href="#projects" className={secondaryCtaClass}>
              {featured.heroSecondaryLabel || featured.viewAllLabel} <ArrowUpRight className="ml-2 h-4 w-4" />
            </a>
          </div>

          {/* Avatar + meta strip */}
          <div className="mt-14 flex items-center justify-center gap-4 flex-wrap">
            <div className="flex -space-x-3">
              {heroTestimonials.map((item) => (
                <Avatar key={item.id} className="h-10 w-10 ring-2 ring-background">
                  <AvatarImage src={item.avatar} alt={item.name} />
                  <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                </Avatar>
              ))}
            </div>
            <div className="text-left">
              <div className="flex items-center gap-1 text-foreground">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg key={i} viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
                    <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
                  </svg>
                ))}
              </div>
              <p className="text-sm text-muted-foreground">
                {scene05.portraitCaption}
              </p>
            </div>
          </div>
        </div>

        {/* Trusted by companies marquee */}
        {companyNames.length > 0 ? (
          <ExperienceMarquee title={scene05.companyLogosTitle} sceneLogos={visibleCompanyLogos} />
        ) : null}
      </section>

      {/* ===================== VALUES SECTION ===================== */}
      <section id="values" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12">
          <SectionEyebrow>{scene05.valuesEyebrow}</SectionEyebrow>
          <h2 className="tracking-tight max-w-2xl" style={{ fontSize: '2.25rem', fontWeight: 600, lineHeight: 1.15 }}>
            {scene05.visionTitle}
          </h2>
          <p className="text-muted-foreground mt-3 max-w-2xl">
            {scene05.visionText}
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {valueCards.map((card, index) => {
            const Icon = valueIcons[index % valueIcons.length];
            return (
                <Card key={card.id} className="rounded-2xl border border-[#d7d7d7] bg-white shadow-[0_8px_24px_-18px_rgba(0,0,0,0.16)] hover:border-black hover:shadow-[0_12px_28px_-18px_rgba(0,0,0,0.22)] transition-all duration-300 cursor-pointer">
                <CardHeader>
                    <div className="h-12 w-12 rounded-xl bg-[#f7f7f4] flex items-center justify-center text-[#111827] border border-[#d7d7d7]">
                    <Icon className="h-6 w-6" />
                  </div>
                    <CardTitle className="mt-4 text-[#111827]">{card.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-[#5b616b] leading-relaxed">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* ===================== ABOUT SECTION ===================== */}
      <section id="about" className="mx-auto max-w-6xl px-6 py-20">
        <div className="grid lg:grid-cols-2 gap-10">
          <Card className="rounded-2xl bg-muted/30">
            <CardContent className="p-8 md:p-10 space-y-6">
              <h2 className="tracking-tight" style={{ fontSize: '2rem', fontWeight: 600, lineHeight: 1.15 }}>
                {scene05.storyTitle}
              </h2>
              {scene05.storyParagraphs.length > 0 ? (
                <p className="text-muted-foreground leading-relaxed">{scene05.storyParagraphs[0]}</p>
              ) : null}
              <ul className="space-y-3">
                {scene05.aboutHighlights.map((line) => (
                  <li key={line} className="flex gap-3 text-sm">
                    <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <div>
              <SectionEyebrow>{scene05.skillsEyebrow}</SectionEyebrow>
              <h3 className="tracking-tight" style={{ fontSize: '1.5rem', fontWeight: 600 }}>
                {scene05.skillsTitle}
              </h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {visibleSkills.map((skill) => {
                return (
                  <Badge
                    key={skill}
                    variant="default"
                    className="rounded-full border border-[#d6d3cb] bg-white px-4 py-1.5 text-sm font-normal text-[#111827] shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
                  >
                    {skill}
                  </Badge>
                );
              })}
            </div>
            <Separator />
            <div>
              <SectionEyebrow>{scene05.certificationsTitle}</SectionEyebrow>
              <div className="space-y-2">
                {certificationItems.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors"
                  >
                    <div className="h-9 w-9 rounded-lg bg-background border border-border flex items-center justify-center flex-shrink-0 overflow-hidden">
                      {item.logoSrc ? (
                        <ImageWithFallback src={item.logoSrc} alt={item.org || item.title} className="h-5 w-5 object-contain" />
                      ) : (
                        <Award className="h-4 w-4 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="text-sm">{item.title}</div>
                      {item.org ? <div className="text-xs text-muted-foreground">{item.org}</div> : null}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== PROJECTS SECTION ===================== */}
      <section id="projects" className="mx-auto max-w-6xl px-6 py-20">
        <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
          <div>
            <SectionEyebrow>{featured.titleLine1}</SectionEyebrow>
            <h2 className="tracking-tight" style={{ fontSize: '2.25rem', fontWeight: 600, lineHeight: 1.15 }}>
              {featured.titleLine2}
            </h2>
            <p className="text-muted-foreground mt-3 max-w-xl">
              {featured.description}
            </p>
          </div>
          <a href="#projects" className={viewAllClass}>
            {featured.viewAllLabel} <ArrowRight className="ml-1 h-4 w-4" />
          </a>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {projects.map((project) => {
            const projectHref = project.buttonType === 'caseStudy' ? project.behance : project.live;
            const isPlaceholder = !projectHref || projectHref.trim() === '#';
            
            return (
              <a
                key={project.id}
                href={projectHref}
                onClick={(e) => isPlaceholder && e.preventDefault()}
                target={isPlaceholder ? undefined : '_blank'}
                rel={isPlaceholder ? undefined : 'noopener noreferrer'}
                className="group"
              >
                <Card
                  className="rounded-2xl overflow-hidden cursor-pointer hover:shadow-lg transition-all p-0 gap-0 h-full"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <ImageWithFallback
                      src={project.img}
                      alt={project.title}
                      className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <CardContent className="p-6">
                    <h3 className="tracking-tight" style={{ fontSize: '1.25rem', fontWeight: 600 }}>{project.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{project.summary}</p>
                    <div className="mt-5 inline-flex items-center text-sm text-foreground gap-1 group-hover:gap-2 transition-all">
                      {project.buttonType === 'caseStudy' ? featured.caseStudyLabel : featured.liveLabel}{' '}
                      <ArrowUpRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </a>
            );
          })}
        </div>
      </section>

      {/* ===================== TESTIMONIALS SECTION ===================== */}
      {visibility.testimonialsSection ? (
        <section id="testimonials" className="mx-auto max-w-6xl px-6 py-20">
          <div className="mb-12">
            <SectionEyebrow>{featured.testimonialsEyebrow}</SectionEyebrow>
            <h2 className="tracking-tight" style={{ fontSize: '2.25rem', fontWeight: 600, lineHeight: 1.15 }}>
              {featured.testimonialsTitle}
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item) => (
              <Card key={item.id} className="rounded-2xl">
                <CardContent className="p-6 space-y-5">
                  <Quote className="h-6 w-6 text-primary/40" />
                  <p className="text-sm leading-relaxed">{item.quote}</p>
                  <div className="flex items-center gap-3 pt-2">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={item.avatar} alt={item.name} />
                      <AvatarFallback>{getInitials(item.name)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="text-sm">{item.name}</div>
                      <div className="text-xs text-muted-foreground">{item.title}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      ) : null}

      {/* ===================== CTA SECTION ===================== */}
      <section id="contact" className="mx-auto max-w-5xl px-6 py-32 text-center">
        <h2
          className="tracking-tight mx-auto max-w-4xl"
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
        <p className="mx-auto max-w-xl mt-8 text-muted-foreground leading-relaxed">
          {featured.ctaDescription}
        </p>
        <a href={featured.ctaButtonHref || contactHref} className={joinClasses(footerCtaClass, 'mt-10')}>
          {featured.ctaButtonText} <ArrowRight className="ml-2 h-4 w-4" />
        </a>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="border-t mt-12">
        <div className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-12 gap-10">
          <div className="md:col-span-4 space-y-4">
            <div className="font-semibold tracking-tight text-lg">{footer.brandTitle}</div>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{footer.brandDescription}</p>
          </div>
          <div className="md:col-span-2 md:col-start-6">
            <div className="text-sm font-medium mb-4 text-foreground">{footer.quickLinksTitle}</div>
            <ul className="space-y-3 text-sm text-muted-foreground">
              {footerNavLinks.map((link) => (
                <li key={link.id}>
                  <a
                    href={link.href}
                    onClick={(event) => handlePlaceholderLinkClick(event, link.href)}
                    className="hover:text-foreground transition-colors"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
          <div className="md:col-span-2">
            <div className="text-sm font-medium mb-4 text-foreground">{footer.followTitle}</div>
            <div className="flex gap-3">
              {footerSocialLinks.map((link) => {
                const SocialIcon = getSocialIconComponent(link.icon);
                return (
                  <a
                    key={link.id}
                    href={link.href}
                    onClick={(event) => handlePlaceholderLinkClick(event, link.href)}
                    target={isPlaceholderHref(link.href) ? undefined : '_blank'}
                    rel={isPlaceholderHref(link.href) ? undefined : 'noopener noreferrer'}
                    className={footerSocialClass}
                    aria-label={link.label}
                  >
                    <SocialIcon className="h-5 w-5" />
                  </a>
                );
              })}
            </div>
          </div>
          <div className="md:col-span-3 md:col-start-10">
            <div className="text-sm font-medium mb-4 text-foreground">{footer.ctaTitle}</div>
            <a
              href={footer.ctaButtonHref || contactHref}
              onClick={(event) => handlePlaceholderLinkClick(event, footer.ctaButtonHref || contactHref)}
              className={footerCtaClass}
            >
              {footer.ctaButtonLabel} <ArrowRight className="ml-2 h-4 w-4" />
            </a>
          </div>
        </div>
        <div className="border-t">
          <div className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
            <span>© {new Date().getFullYear()} {footer.copyrightText}</span>
            <div className="flex gap-6">
              {footerLegalLinks.map((link) => (
                <a
                  key={link.id}
                  href={link.href}
                  onClick={(event) => handlePlaceholderLinkClick(event, link.href)}
                  className="hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
};

export default StaticHomeLayout;