import React, { useMemo } from 'react';
import { AdvancedNavbar } from '../components/AdvancedNavbar';
import { Footer } from '../components/Footer';
import { getButtonClass } from '../components/designSystem';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useSeoMeta } from '../hooks/useSeoMeta';

type LegalDocumentKind = 'terms' | 'privacy';

interface StaticLegalDocumentPageProps {
  kind: LegalDocumentKind;
}

const splitParagraphs = (content: string) => {
  return content
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
};

const StaticLegalDocumentPage: React.FC<StaticLegalDocumentPageProps> = ({ kind }) => {
  const { siteConfig } = useSiteConfig();
  const { legalPages } = siteConfig;

  const isTerms = kind === 'terms';
  const title = isTerms ? legalPages.termsTitle : legalPages.privacyTitle;
  const lastUpdated = isTerms ? legalPages.termsLastUpdated : legalPages.privacyLastUpdated;
  const content = isTerms ? legalPages.termsContent : legalPages.privacyContent;
  const paragraphs = useMemo(() => splitParagraphs(content), [content]);
  const description = paragraphs[0] ?? title;

  useSeoMeta({
    title: `${title} | Oussama Lassoued`,
    description,
    canonicalUrl: `https://www.oussamalassoued.me/${isTerms ? 'terms-of-service' : 'privacy-policy'}`,
  });

  const cardShellClass = 'rounded-2xl border border-[#d0d0cb] bg-transparent shadow-none';
  const backButtonClass = getButtonClass('button-2', 'light', 'md', 'inline-flex items-center justify-center rounded-full');

  return (
    <div className="min-h-screen bg-white text-[#111217]" data-surface="static-home">
      <AdvancedNavbar isLightMode={true} />

      <main className="site-shell pb-12 pt-28 md:pb-16 md:pt-32">
        <section className={`${cardShellClass} mx-auto max-w-4xl px-6 py-8 md:px-8 md:py-10`}>
          <div className="max-w-3xl">
            <p className="text-sm uppercase tracking-[0.18em] text-muted-foreground">Legal</p>
            <h1 className="mt-3 tracking-tight text-[#111217]" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.8rem)', lineHeight: 1, fontWeight: 600, letterSpacing: '-0.04em' }}>
              {title}
            </h1>
            {lastUpdated ? (
              <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#111217]/60">
                {legalPages.lastUpdatedLabel}: {lastUpdated}
              </p>
            ) : null}
          </div>

          <div className="mt-8 space-y-5 text-[1rem] leading-8 text-[#111217]/78 md:text-[1.05rem] md:leading-9">
            {paragraphs.map((paragraph, index) => (
              <p key={`${kind}-paragraph-${index}`}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-8 flex flex-col gap-4 border-t border-[#d0d0cb] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <a href="#home" className={backButtonClass}>
              {legalPages.backToHomeLabel}
            </a>
            <p className="text-sm text-muted-foreground">
              {isTerms ? 'A concise static summary of the terms for this version of the site.' : 'A concise static summary of how the site handles your data.'}
            </p>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default StaticLegalDocumentPage;