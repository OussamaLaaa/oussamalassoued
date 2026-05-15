import React from 'react';
import { getButtonClass } from './designSystem';
import { getSocialIconComponent, MailIcon } from './icons';
import { useSiteConfig } from '../context/SiteConfigContext';
import { type SiteSection } from '../config/siteConfig';

const isPlaceholderHref = (href: string) => href.trim() === '#';
const PENDING_NAV_SECTION_KEY = 'portfolio.pending-nav-section.v1';

const SITE_SECTIONS: SiteSection[] = ['home', 'about', 'projects', 'testimonials', 'articles', 'contact'];

export const Footer: React.FC = () => {
  const { siteConfig } = useSiteConfig();
  const { footer, persistentUI, visibility, designSystem } = siteConfig;

  if (!visibility.footer) return null;

  const visibleSocialLinks = footer.socialLinks.filter((link) => link.visible);
  const visibleLegalLinks = footer.legalLinks.filter((link) => link.visible);
  const syncedNavLinks = persistentUI.navItems
    .filter((item) => item.visible)
    .map((item) => ({
      id: `footer-sync-${item.id}`,
      label: item.label,
      section: item.section,
      href: item.section === 'articles' ? '#/articles' : `#${item.section}`,
    }));

  const handlePlaceholderLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (isPlaceholderHref(href)) {
      e.preventDefault();
    }
  };

  const getCurrentRouteSection = () => {
    if (typeof window === 'undefined') return 'home';

    const hash = window.location.hash.replace(/^#/, '');
    const path = window.location.pathname;
    const source = hash && hash !== '/' ? hash : path;

    return (
      source
        .replace(/^\/+/, '')
        .split('/')
        .filter(Boolean)[0]
        ?.toLowerCase() ?? 'home'
    );
  };

  const isStandaloneRoute = () => {
    const section = getCurrentRouteSection();
    return section === 'articles' || section === 'dashboard';
  };

  const handleSectionNav = (e: React.MouseEvent<HTMLAnchorElement>, section: SiteSection) => {
    e.preventDefault();

    if (section === 'articles') {
      window.location.hash = '/articles';
      return;
    }

    if (isStandaloneRoute()) {
      if (typeof window !== 'undefined') {
        try {
          window.sessionStorage?.setItem(PENDING_NAV_SECTION_KEY, section);
        } catch {
          console.warn('Unable to set session storage');
        }
      }

      window.location.hash = '/';
      const dispatchNavigation = () => {
        window.dispatchEvent(new CustomEvent('nav-to-section', { detail: { section } }));
      };

      window.setTimeout(dispatchNavigation, 140);
      window.setTimeout(dispatchNavigation, 420);
      return;
    }

    window.dispatchEvent(new CustomEvent('nav-to-section', { detail: { section } }));
  };

  const getSectionFromHref = (href: string): SiteSection | null => {
    const cleanHref = href.trim().toLowerCase();
    if (!cleanHref.startsWith('#')) return null;

    const normalized = cleanHref.replace(/^#\/?/, '');
    if (SITE_SECTIONS.includes(normalized as SiteSection)) {
      return normalized as SiteSection;
    }

    return null;
  };

  const buttonClass = getButtonClass(
    designSystem.components.featuredCtaButtonVariant,
    'light',
    'md',
    'min-w-[190px] justify-center gap-2',
  );

  const ctaSection = getSectionFromHref(footer.ctaButtonHref);

  return (
    <footer className="relative z-10 w-full border-t border-[#0a0a0b]/10 bg-[#f2f4f6] text-[#111217] selection:bg-[#111217]/10">
      <div className="site-shell pb-8 pt-14 md:pb-10 md:pt-16">
        <div className="grid gap-10 md:grid-cols-2 xl:grid-cols-[1.15fr_1fr_1fr_1.15fr]">
          <div className="space-y-4">
            <p className="text-[2rem] font-semibold leading-none tracking-tight text-[#111217]">{footer.brandTitle}</p>
            <p className="max-w-[34ch] text-base leading-8 text-[#111217]/70">{footer.brandDescription}</p>
            {visibility.footerEmail ? (
              <a
                href={`mailto:${footer.email}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-[#111217]/80 transition-colors hover:text-[#111217]"
              >
                <MailIcon size={16} strokeWidth={1.8} />
                {footer.email}
              </a>
            ) : null}
          </div>

          {visibility.footerNavLinks && syncedNavLinks.length > 0 ? (
            <div className="space-y-4">
              <p className="font-sans text-[2rem] font-semibold leading-none tracking-tight text-[#111217] md:text-[1.9rem]">
                {footer.quickLinksTitle}
              </p>
              <ul className="space-y-3">
                {syncedNavLinks.map((item) => (
                  <li key={item.id}>
                    <a
                      href={item.href}
                      onClick={(e) => handleSectionNav(e, item.section)}
                      className="text-[1.02rem] text-[#111217]/68 transition-colors hover:text-[#111217]"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {visibility.footerSocialLinks && visibleSocialLinks.length > 0 ? (
            <div className="space-y-4">
              <p className="font-sans text-[2rem] font-semibold leading-none tracking-tight text-[#111217] md:text-[1.9rem]">
                {footer.followTitle}
              </p>
              <div className="flex flex-wrap items-center gap-3">
                {visibleSocialLinks.map((social) => {
                  const SocialIcon = getSocialIconComponent(social.icon);
                  return (
                    <a
                      key={social.id}
                      href={social.href}
                      onClick={(e) => handlePlaceholderLinkClick(e, social.href)}
                      target={isPlaceholderHref(social.href) ? undefined : '_blank'}
                      rel={isPlaceholderHref(social.href) ? undefined : 'noopener noreferrer'}
                      aria-label={social.label}
                      title={social.label}
                      className="inline-flex h-12 w-12 items-center justify-center rounded-full border border-[#111217]/15 bg-white/65 text-[#111217]/75 transition-all duration-200 hover:-translate-y-0.5 hover:border-[#111217]/30 hover:text-[#111217]"
                    >
                      <SocialIcon size={21} strokeWidth={1.8} />
                    </a>
                  );
                })}
              </div>
            </div>
          ) : null}

          <div className="space-y-4">
            <p className="max-w-[19ch] text-[1.9rem] font-semibold leading-tight tracking-tight text-[#111217]">{footer.ctaTitle}</p>
            <p className="max-w-[32ch] text-base leading-8 text-[#111217]/70">{footer.ctaDescription}</p>
            {ctaSection ? (
              <a href={footer.ctaButtonHref} onClick={(e) => handleSectionNav(e, ctaSection)} className={buttonClass}>
                <MailIcon size={17} strokeWidth={1.9} />
                <span>{footer.ctaButtonLabel}</span>
              </a>
            ) : (
              <a
                href={footer.ctaButtonHref}
                onClick={(e) => handlePlaceholderLinkClick(e, footer.ctaButtonHref)}
                target={
                  isPlaceholderHref(footer.ctaButtonHref) || footer.ctaButtonHref.startsWith('mailto:') ? undefined : '_blank'
                }
                rel={
                  isPlaceholderHref(footer.ctaButtonHref) || footer.ctaButtonHref.startsWith('mailto:')
                    ? undefined
                    : 'noopener noreferrer'
                }
                className={buttonClass}
              >
                <MailIcon size={17} strokeWidth={1.9} />
                <span>{footer.ctaButtonLabel}</span>
              </a>
            )}

            {visibility.footerOffice ? (
              <div className="pt-1 text-sm leading-6 text-[#111217]/62">
                <p className="font-medium text-[#111217]/80">{footer.officeTitle}</p>
                <p className="whitespace-pre-line">{footer.officeAddress}</p>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-[#111217]/10 pt-5 text-[0.94rem] text-[#111217]/60 md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} {footer.copyrightText}</p>
          {visibility.footerLegalLinks && visibleLegalLinks.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-[#111217]/55">
              {visibleLegalLinks.map((link, index) => (
                <React.Fragment key={link.id}>
                  <a
                    href={link.href}
                    onClick={(e) => handlePlaceholderLinkClick(e, link.href)}
                    className="transition-colors hover:text-[#111217]"
                  >
                    {link.label}
                  </a>
                  {index < visibleLegalLinks.length - 1 ? <span className="text-[#111217]/25">•</span> : null}
                </React.Fragment>
              ))}
            </div>
          ) : null}
          <p>{footer.bottomNote}</p>
        </div>
      </div>
    </footer>
  );
};
