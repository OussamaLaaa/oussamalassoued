import React from 'react';
import { ArrowRight } from 'lucide-react';
import { getButtonClass } from './designSystem';
import { getSocialIconComponent } from './icons';
import { useSiteConfig } from '../context/SiteConfigContext';

const isPlaceholderHref = (href: string) => href.trim() === '#';

export const StaticFooter: React.FC = () => {
  const { siteConfig } = useSiteConfig();
  const { footer, persistentUI, visibility, designSystem } = siteConfig;

  if (!visibility.footer) return null;

  const visibleSocialLinks = footer.socialLinks.filter((link) => link.visible);
  const visibleLegalLinks = footer.legalLinks.filter((link) => link.visible);
  const footerNavLinks = footer.navLinks.filter((link) => link.visible);

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

  return (
    <footer className="border-t mt-12 bg-white" data-surface="static-home">
      <div data-motion className="mx-auto max-w-6xl px-6 py-16 grid md:grid-cols-12 gap-10">
        <div className="md:col-span-4 space-y-4">
          <div className="font-semibold tracking-tight text-lg">{footer.brandTitle}</div>
          <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">{footer.brandDescription}</p>
        </div>
        <div className="md:col-span-2 md:col-start-6">
          <div className="text-sm font-medium mb-4 text-foreground">{footer.quickLinksTitle}</div>
          <ul className="space-y-3 text-sm text-muted-foreground">
            {footerNavLinks.map((link) => (
              <li key={link.id}>
                <a href={link.href} onClick={(event) => handlePlaceholderLinkClick(event, link.href)} className="hover:text-foreground transition-colors">
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="md:col-span-2">
          <div className="text-sm font-medium mb-4 text-foreground">{footer.followTitle}</div>
          <div className="flex gap-3">
            {visibleSocialLinks.map((link) => {
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
            href={footer.ctaButtonHref || persistentUI.letsTalkHref}
            onClick={(event) => handlePlaceholderLinkClick(event, footer.ctaButtonHref || persistentUI.letsTalkHref)}
            className={footerCtaClass}
          >
            {footer.ctaButtonLabel} <ArrowRight className="ml-2 h-4 w-4" />
          </a>
        </div>
      </div>
      <div className="border-t">
        <div data-motion className="mx-auto max-w-6xl px-6 py-6 flex items-center justify-between text-xs text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {footer.copyrightText}
          </span>
          <div className="flex gap-6">
            {visibleLegalLinks.map((link) => (
              <a key={link.id} href={link.href} onClick={(event) => handlePlaceholderLinkClick(event, link.href)} className="hover:text-foreground transition-colors">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default StaticFooter;