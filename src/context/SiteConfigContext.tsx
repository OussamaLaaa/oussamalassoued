import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_SITE_CONFIG,
  hydrateSiteConfig,
  SITE_CONFIG_STORAGE_KEY,
  type SiteConfig,
  type SitePartner,
  type SitePersonalProject,
  type SiteSocialAccount,
  type SiteSocialPost,
  type SiteFinancialTransaction,
  type SiteInvestment,
  type SiteInvoice,
  type SiteEmail,
  type SiteNote,
  type SiteAITracking,
  type SiteAIReport,
} from '../config/siteConfig';

interface SiteConfigContextValue {
  siteConfig: SiteConfig;
  setSiteConfig: React.Dispatch<React.SetStateAction<SiteConfig>>;
  resetSiteConfig: () => void;
}

const SiteConfigContext = createContext<SiteConfigContextValue | null>(null);

const getInitialSiteConfig = (): SiteConfig => {
  if (typeof window === 'undefined') return DEFAULT_SITE_CONFIG;

  // Try to load saved config from localStorage
  try {
    const savedConfig = window.localStorage.getItem(SITE_CONFIG_STORAGE_KEY);
    if (savedConfig) {
      const parsed = JSON.parse(savedConfig);
      return hydrateSiteConfig(parsed);
    }
  } catch (error) {
    console.warn('Failed to load saved config:', error);
  }

  return DEFAULT_SITE_CONFIG;
};

const applyDesignSystemVariables = (siteConfig: SiteConfig) => {
  if (typeof document === 'undefined') return;

  const theme = siteConfig.designSystem.theme;
  const componentStyles = siteConfig.designSystem.componentStyles;
  const foundation = siteConfig.designSystem.foundation;
  const motion = siteConfig.animation.motion;
  const root = document.documentElement;
  const defaultTheme = DEFAULT_SITE_CONFIG.designSystem.theme;
  const defaultMotion = DEFAULT_SITE_CONFIG.animation.motion;
  const normalizeCssLiteral = (value: string) => value.trim().toLowerCase().replace(/\s+/g, '');
  const useTokenForLegacyLiteral = (value: string, legacyLiteral: string, tokenReference: string) => {
    return normalizeCssLiteral(value) === normalizeCssLiteral(legacyLiteral) ? tokenReference : value;
  };
  const clampNumber = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));
  const resolveRgbChannels = (value: string, fallback: string) => {
    if (!value?.trim()) return fallback;
    if (!document.body) return fallback;
    const probe = document.createElement('span');
    probe.style.color = value;
    probe.style.position = 'absolute';
    probe.style.left = '-9999px';
    probe.style.top = '-9999px';
    document.body.appendChild(probe);
    const computed = window.getComputedStyle(probe).color;
    probe.remove();
    const match = computed.match(/^rgba?\(([^)]+)\)$/i);
    if (!match?.[1]) return fallback;
    const [r, g, b] = match[1]
      .split(',')
      .slice(0, 3)
      .map((part) => Math.round(Number.parseFloat(part.trim())));
    if ([r, g, b].some((channel) => !Number.isFinite(channel))) return fallback;
    return `${r}, ${g}, ${b}`;
  };

  root.style.setProperty('--ds-color-primary', theme.primaryColor);
  root.style.setProperty('--ds-color-secondary', theme.secondaryColor);
  root.style.setProperty('--ds-color-on-primary', theme.onPrimaryColor);
  root.style.setProperty('--ds-color-on-secondary', theme.onSecondaryColor);
  root.style.setProperty('--ds-heading-scale', String(theme.headingScale));
  root.style.setProperty('--ds-display-size-rem', `${theme.displayTitleSizeRem}rem`);
  root.style.setProperty('--ds-section-size-rem', `${theme.sectionTitleSizeRem}rem`);
  root.style.setProperty('--ds-body-size-rem', `${theme.bodyTextSizeRem}rem`);
  root.style.setProperty('--ds-heading-weight', String(theme.headingWeight));
  root.style.setProperty('--ds-heading-letter-spacing-em', `${theme.headingLetterSpacingEm}em`);
  root.style.setProperty('--ds-body-line-height', String(theme.bodyLineHeight));
  root.style.setProperty('--ds-button-radius', `${theme.buttonRadius}px`);
  root.style.setProperty('--ds-button-border-width', `${theme.buttonBorderWidth}px`);
  root.style.setProperty('--ds-button-shadow-opacity', String(theme.buttonShadowOpacity));
  root.style.setProperty('--ds-card-radius', `${theme.cardRadius}px`);
  root.style.setProperty('--ds-card-border-width', `${theme.cardBorderWidth}px`);
  root.style.setProperty('--ds-card-blur-px', `${theme.cardBlurPx}px`);
  root.style.setProperty('--ds-card-shadow-opacity', String(theme.cardShadowOpacity));
  root.style.setProperty('--ds-glass-tint', theme.glassTintColor);
  root.style.setProperty('--ds-glass-border', theme.glassBorderColor);
  const glowRgb = resolveRgbChannels(
    theme.glowColor || defaultTheme.glowColor,
    resolveRgbChannels(defaultTheme.glowColor, '255, 220, 170'),
  );
  root.style.setProperty('--ds-glow-rgb', glowRgb);
  root.style.setProperty(
    '--ds-glow-intensity',
    String(clampNumber(theme.glowIntensity, 0, 1.2)),
  );
  const glowState = theme.glowEnabled ? 'on' : 'off';
  if (document.documentElement) {
    document.documentElement.dataset.glow = glowState;
  }
  if (document.body) {
    document.body.dataset.glow = glowState;
  }
  root.style.setProperty('--ds-space-section', `${foundation.spacing.sectionPaddingRem}rem`);
  root.style.setProperty('--ds-space-stack', `${foundation.spacing.stackGapRem}rem`);
  root.style.setProperty('--ds-space-grid', `${foundation.spacing.gridGapRem}rem`);
  root.style.setProperty('--ds-space-card', `${foundation.spacing.cardPaddingRem}rem`);
  root.style.setProperty('--ds-layout-max-width', `${foundation.layout.contentMaxWidthPx}px`);
  root.style.setProperty('--ds-layout-column-gap', `${foundation.layout.columnGapRem}rem`);
  root.style.setProperty('--ds-layout-max-columns', `${foundation.layout.maxGridColumns}`);
  root.style.setProperty('--ds-type-eyebrow-size', `${foundation.typography.eyebrowSizeRem}rem`);
  root.style.setProperty('--ds-type-eyebrow-tracking', `${foundation.typography.eyebrowLetterSpacingEm}em`);
  root.style.setProperty('--ds-type-eyebrow-weight', `${foundation.typography.eyebrowWeight}`);
  root.style.setProperty('--ds-motion-duration-fast', `${motion.durationFastMs}ms`);
  root.style.setProperty('--ds-motion-duration-base', `${motion.durationBaseMs}ms`);
  root.style.setProperty('--ds-motion-duration-slow', `${motion.durationSlowMs}ms`);
  root.style.setProperty('--ds-motion-ease', motion.ease || defaultMotion.ease);
  root.style.setProperty('--ds-motion-stagger', `${motion.staggerMs}ms`);
  root.style.setProperty('--ds-motion-hover-scale', `${motion.hoverScale}`);
  root.style.setProperty('--ds-motion-hover-lift', `${motion.hoverLiftPx}px`);

  const buttonVariants = ['button-1', 'button-2', 'button-3'] as const;
  for (const variant of buttonVariants) {
    const preset = componentStyles.buttons[variant];
    const token = variant.replace('-', '');
    const resolvedRadius = clampNumber(
      theme.buttonRadius + (preset.radiusPx - defaultTheme.buttonRadius),
      2,
      999,
    );
    const resolvedBorderWidth = clampNumber(
      theme.buttonBorderWidth + (preset.borderWidthPx - defaultTheme.buttonBorderWidth),
      0.5,
      6,
    );
    const darkBackground =
      variant === 'button-1'
        ? useTokenForLegacyLiteral(preset.darkBackground, '#111217', 'var(--ds-color-primary)')
        : preset.darkBackground;
    const darkText =
      variant === 'button-1'
        ? useTokenForLegacyLiteral(preset.darkText, '#ffffff', 'var(--ds-color-on-primary)')
        : preset.darkText;
    const lightBackground =
      variant === 'button-1'
        ? useTokenForLegacyLiteral(preset.lightBackground, '#111217', 'var(--ds-color-primary)')
        : preset.lightBackground;
    const lightText =
      variant === 'button-1'
        ? useTokenForLegacyLiteral(preset.lightText, '#ffffff', 'var(--ds-color-on-primary)')
        : preset.lightText;

    root.style.setProperty(`--ds-${token}-radius`, `${resolvedRadius}px`);
    root.style.setProperty(`--ds-${token}-border-width`, `${resolvedBorderWidth}px`);
    root.style.setProperty(`--ds-${token}-dark-bg`, darkBackground);
    root.style.setProperty(`--ds-${token}-dark-border`, preset.darkBorder);
    root.style.setProperty(`--ds-${token}-dark-text`, darkText);
    root.style.setProperty(`--ds-${token}-dark-hover-bg`, preset.darkHoverBackground);
    root.style.setProperty(`--ds-${token}-light-bg`, lightBackground);
    root.style.setProperty(`--ds-${token}-light-border`, preset.lightBorder);
    root.style.setProperty(`--ds-${token}-light-text`, lightText);
    root.style.setProperty(`--ds-${token}-light-hover-bg`, preset.lightHoverBackground);
  }

  const cardVariants = ['card-1', 'card-2', 'card-3'] as const;
  for (const variant of cardVariants) {
    const preset = componentStyles.cards[variant];
    const token = variant.replace('-', '');
    const resolvedRadius = clampNumber(
      theme.cardRadius + (preset.radiusPx - defaultTheme.cardRadius),
      4,
      80,
    );
    const resolvedBorderWidth = clampNumber(
      theme.cardBorderWidth + (preset.borderWidthPx - defaultTheme.cardBorderWidth),
      0.5,
      6,
    );
    const resolvedDarkShadowOpacity = clampNumber(
      theme.cardShadowOpacity + (preset.darkShadowOpacity - defaultTheme.cardShadowOpacity),
      0,
      0.95,
    );
    const resolvedLightShadowOpacity = clampNumber(
      theme.cardShadowOpacity + (preset.lightShadowOpacity - defaultTheme.cardShadowOpacity),
      0,
      0.95,
    );

    root.style.setProperty(`--ds-${token}-radius`, `${resolvedRadius}px`);
    root.style.setProperty(`--ds-${token}-border-width`, `${resolvedBorderWidth}px`);
    root.style.setProperty(`--ds-${token}-dark-bg`, preset.darkBackground);
    root.style.setProperty(`--ds-${token}-light-bg`, preset.lightBackground);
    root.style.setProperty(`--ds-${token}-dark-border`, preset.darkBorder);
    root.style.setProperty(`--ds-${token}-light-border`, preset.lightBorder);
    root.style.setProperty(`--ds-${token}-dark-shadow-opacity`, String(resolvedDarkShadowOpacity));
    root.style.setProperty(`--ds-${token}-light-shadow-opacity`, String(resolvedLightShadowOpacity));
  }
};

const applyBrowserMetadata = (siteConfig: SiteConfig) => {
  if (typeof document === 'undefined') return;

  const browserConfig = siteConfig.dashboard.browser;
  const fallback = DEFAULT_SITE_CONFIG.dashboard.browser;
  const nextTitle = (browserConfig.browserTabTitle || fallback.browserTabTitle).trim();
  const nextFavicon = (browserConfig.faviconUrl || fallback.faviconUrl).trim();

  if (nextTitle) {
    document.title = nextTitle;
  }

  if (!nextFavicon) return;

  const updateIconLink = (selector: string, relValue: string) => {
    let link = document.querySelector<HTMLLinkElement>(selector);
    if (!link) {
      link = document.createElement('link');
      link.rel = relValue;
      document.head.appendChild(link);
    }
    link.href = nextFavicon;
  };

  updateIconLink("link[rel='icon']", 'icon');
  updateIconLink("link[rel='shortcut icon']", 'shortcut icon');
};

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig>(() => getInitialSiteConfig());

  useEffect(() => {
    applyDesignSystemVariables(siteConfig);
  }, [siteConfig]);

  useEffect(() => {
    applyBrowserMetadata(siteConfig);
  }, [siteConfig]);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleStorage = (event: StorageEvent) => {
      if (event.key !== SITE_CONFIG_STORAGE_KEY) return;

      if (!event.newValue) {
        setSiteConfig(DEFAULT_SITE_CONFIG);
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue);
        setSiteConfig(hydrateSiteConfig(parsed));
      } catch {
        setSiteConfig(DEFAULT_SITE_CONFIG);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(SITE_CONFIG_STORAGE_KEY, JSON.stringify(siteConfig));
    } catch (error) {
      // Uploaded media can exceed browser storage quota; keep runtime state without crashing.
      console.warn('Unable to persist site config to localStorage.', error);
    }
  }, [siteConfig]);

  const value = useMemo<SiteConfigContextValue>(() => {
    return {
      siteConfig,
      setSiteConfig,
      resetSiteConfig: () => {
        setSiteConfig(DEFAULT_SITE_CONFIG);
        if (typeof window !== 'undefined') {
          window.localStorage.removeItem(SITE_CONFIG_STORAGE_KEY);
        }
      },
    };
  }, [siteConfig]);

  return <SiteConfigContext.Provider value={value}>{children}</SiteConfigContext.Provider>;
};

export const useSiteConfig = () => {
  const context = useContext(SiteConfigContext);
  if (!context) {
    throw new Error('useSiteConfig must be used within SiteConfigProvider');
  }
  return context;
};

// Helper functions for updating specific sections
export const updatePartners = (
  siteConfig: SiteConfig,
  updater: (partners: SiteConfig['partners']) => SiteConfig['partners']
): SiteConfig => {
  return {
    ...siteConfig,
    partners: updater(siteConfig.partners),
  };
};

export const updatePersonalProjects = (
  siteConfig: SiteConfig,
  updater: (projects: SiteConfig['personalProjects']) => SiteConfig['personalProjects']
): SiteConfig => {
  return {
    ...siteConfig,
    personalProjects: updater(siteConfig.personalProjects),
  };
};

export const updateSocialAccounts = (
  siteConfig: SiteConfig,
  updater: (accounts: SiteConfig['socialAccounts']) => SiteConfig['socialAccounts']
): SiteConfig => {
  return {
    ...siteConfig,
    socialAccounts: updater(siteConfig.socialAccounts),
  };
};

export const updateSocialPosts = (
  siteConfig: SiteConfig,
  updater: (posts: SiteConfig['socialPosts']) => SiteConfig['socialPosts']
): SiteConfig => {
  return {
    ...siteConfig,
    socialPosts: updater(siteConfig.socialPosts),
  };
};

export const updateFinancialTransactions = (
  siteConfig: SiteConfig,
  updater: (transactions: SiteConfig['financialTransactions']) => SiteConfig['financialTransactions']
): SiteConfig => {
  return {
    ...siteConfig,
    financialTransactions: updater(siteConfig.financialTransactions),
  };
};

export const updateInvestments = (
  siteConfig: SiteConfig,
  updater: (investments: SiteConfig['investments']) => SiteConfig['investments']
): SiteConfig => {
  return {
    ...siteConfig,
    investments: updater(siteConfig.investments),
  };
};

export const updateInvoices = (
  siteConfig: SiteConfig,
  updater: (invoices: SiteConfig['invoices']) => SiteConfig['invoices']
): SiteConfig => {
  return {
    ...siteConfig,
    invoices: updater(siteConfig.invoices),
  };
};

export const updateEmails = (
  siteConfig: SiteConfig,
  updater: (emails: SiteConfig['emails']) => SiteConfig['emails']
): SiteConfig => {
  return {
    ...siteConfig,
    emails: updater(siteConfig.emails),
  };
};

export const updateNotes = (
  siteConfig: SiteConfig,
  updater: (notes: SiteConfig['notes']) => SiteConfig['notes']
): SiteConfig => {
  return {
    ...siteConfig,
    notes: updater(siteConfig.notes),
  };
};

export const updateAITracking = (
  siteConfig: SiteConfig,
  updater: (tracking: SiteConfig['aiTracking']) => SiteConfig['aiTracking']
): SiteConfig => {
  return {
    ...siteConfig,
    aiTracking: updater(siteConfig.aiTracking),
  };
};

export const updateAIReports = (
  siteConfig: SiteConfig,
  updater: (reports: SiteConfig['aiReports']) => SiteConfig['aiReports']
): SiteConfig => {
  return {
    ...siteConfig,
    aiReports: updater(siteConfig.aiReports),
  };
};
