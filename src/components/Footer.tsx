import React from 'react';
import { getSocialIconComponent } from './icons';
import { useSiteConfig } from '../context/SiteConfigContext';
import { type SiteSection } from '../config/siteConfig';

const isPlaceholderHref = (href: string) => href.trim() === '#';
const PENDING_NAV_SECTION_KEY = 'portfolio.pending-nav-section.v1';

export const Footer: React.FC = () => {
  const { siteConfig } = useSiteConfig();
  const { footer, persistentUI, visibility } = siteConfig;

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

  return (
    <footer className="w-full bg-white text-[#0a0a0b] border-t border-[#0a0a0b]/10 relative z-10 selection:bg-[#0a0a0b]/10 font-mono uppercase text-[10px] sm:text-[11px] tracking-[0.15em] leading-relaxed">
      <div className="site-shell py-12 md:py-16">
        <div className="grid gap-8 lg:grid-cols-3 items-start">
          <div className="flex flex-col gap-8">
            {visibility.footerEmail ? (
              <a
                href={`mailto:${footer.email}`}
                className="group/link flex flex-col gap-[6px] hover:opacity-70 transition-opacity w-max"
              >
                <span className="text-[#0a0a0b] text-[11px] sm:text-[13px] tracking-[0.25em] font-bold uppercase">
                  {footer.email}
                </span>
                <span className="w-full h-[1px] bg-[#0a0a0b]/30"></span>
              </a>
            ) : null}

            {visibility.footerSocialLinks && visibleSocialLinks.length > 0 ? (
              <div className="flex flex-wrap items-center gap-4 text-[#0a0a0b]">
                {visibleSocialLinks.map((social, index) => {
                  const SocialIcon = getSocialIconComponent(social.icon);
                  return (
                    <React.Fragment key={social.id}>
                      <a
                        href={social.href}
                        onClick={(e) => handlePlaceholderLinkClick(e, social.href)}
                        target={isPlaceholderHref(social.href) ? undefined : '_blank'}
                        rel={isPlaceholderHref(social.href) ? undefined : 'noopener noreferrer'}
                        aria-label={social.label}
                        title={social.label}
                        className="hover:opacity-60 transition-opacity duration-300 flex items-center justify-center"
                      >
                        <SocialIcon size={22} strokeWidth={1.5} />
                      </a>
                      {index < visibleSocialLinks.length - 1 ? (
                        <span className="w-[1px] h-[18px] bg-[#0a0a0b]/30"></span>
                      ) : null}
                    </React.Fragment>
                  );
                })}
              </div>
            ) : null}
          </div>

          {visibility.footerNavLinks && syncedNavLinks.length > 0 ? (
            <ul className="flex flex-col gap-4">
              {syncedNavLinks.map((item) => (
                <li key={item.id}>
                  <a
                    href={item.href}
                    onClick={(e) => handleSectionNav(e, item.section)}
                    className="text-[#0a0a0b]/60 hover:text-[#0a0a0b] font-semibold transition-colors relative group/link text-[11px] sm:text-[12px] tracking-[0.2em]"
                  >
                    {item.label}
                    <span className="absolute -bottom-1.5 left-0 w-0 h-[1px] bg-[#0a0a0b] transition-all duration-300 group-hover/link:w-full"></span>
                  </a>
                </li>
              ))}
            </ul>
          ) : null}

          {visibility.footerOffice ? (
            <div className="flex flex-col gap-4">
              <p className="text-[#0a0a0b] font-bold tracking-[0.2em]">{footer.officeTitle}</p>
              <p className="text-[#0a0a0b]/60 leading-loose font-medium">
                {footer.officeAddress.split('\n').map((line, idx) => (
                  <React.Fragment key={`${line}-${idx}`}>
                    {line}
                    <br />
                  </React.Fragment>
                ))}
              </p>
            </div>
          ) : null}
        </div>

        <div className="mt-10 flex flex-col gap-4 border-t border-[#0a0a0b]/10 pt-6 md:flex-row md:items-center md:justify-between">
          <p className="text-[#0a0a0b]/60">© {new Date().getFullYear()} {footer.copyrightText}</p>
          {visibility.footerLegalLinks && visibleLegalLinks.length > 0 ? (
            <div className="flex flex-wrap items-center gap-2 text-[#0a0a0b]/45">
              {visibleLegalLinks.map((link, index) => (
                <React.Fragment key={link.id}>
                  <a
                    href={link.href}
                    onClick={(e) => handlePlaceholderLinkClick(e, link.href)}
                    className="hover:text-[#0a0a0b] transition-colors relative group/link"
                  >
                    {link.label}
                    <span className="absolute -bottom-1 left-0 w-0 h-[1px] bg-[#0a0a0b] transition-all duration-300 group-hover/link:w-full"></span>
                  </a>
                  {index < visibleLegalLinks.length - 1 ? <span className="text-[#0a0a0b]/30">|</span> : null}
                </React.Fragment>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </footer>
  );
};
