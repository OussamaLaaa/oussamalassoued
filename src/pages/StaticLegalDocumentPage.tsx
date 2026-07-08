import React, { useMemo } from 'react';
import { AdvancedNavbar } from '../components/AdvancedNavbar';
import { Footer } from '../components/Footer';
import { useSeoMeta } from '../hooks/useSeoMeta';

type LegalDocumentKind = 'terms' | 'privacy';

interface StaticLegalDocumentPageProps {
  kind: LegalDocumentKind;
}

interface ContentBlock {
  type: 'heading' | 'paragraph' | 'list';
  text?: string;
  items?: string[];
}

const TERMS_CONTENT: ContentBlock[] = [
  { type: 'paragraph', text: 'By accessing and using this website, you agree to comply with these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you should not use this website.' },
  { type: 'heading', text: 'Use of Website' },
  { type: 'paragraph', text: 'This website is intended for informational and portfolio purposes only. You agree to use it in a lawful and respectful manner and not to engage in any activity that could harm, disrupt, or misuse the website or its content.' },
  { type: 'heading', text: 'Intellectual Property' },
  { type: 'paragraph', text: 'All content on this website, including but not limited to text, visuals, designs, case studies, and code, is the property of Oussama Lassoued unless otherwise stated. Unauthorized use, reproduction, distribution, or modification of any content without prior written permission is strictly prohibited.' },
  { type: 'heading', text: 'No Warranties' },
  { type: 'paragraph', text: 'The website and its content are provided \u201cas is\u201d without any warranties, express or implied. While efforts are made to ensure accuracy and quality, there is no guarantee that the information is always complete, accurate, or up to date.' },
  { type: 'heading', text: 'Limitation of Liability' },
  { type: 'paragraph', text: 'Under no circumstances shall Oussama Lassoued be held liable for any direct, indirect, or incidental damages resulting from the use or inability to use this website.' },
  { type: 'heading', text: 'External Links' },
  { type: 'paragraph', text: 'This website may contain links to external websites. These links are provided for convenience, and no responsibility is assumed for the content or practices of third-party websites.' },
  { type: 'heading', text: 'Changes to Terms' },
  { type: 'paragraph', text: 'These Terms of Service may be updated from time to time. Continued use of the website after changes are made constitutes acceptance of the updated terms.' },
  { type: 'heading', text: 'Contact' },
  { type: 'paragraph', text: 'For any questions regarding these Terms, you may contact via the available contact channels on this website.' },
];

const PRIVACY_CONTENT: ContentBlock[] = [
  { type: 'paragraph', text: 'This Privacy Policy explains how information is collected, used, and protected when you visit this website.' },
  { type: 'heading', text: 'Information Collection' },
  { type: 'paragraph', text: 'This website only collects personal information that you voluntarily provide, such as your name, email address, or message when submitting a contact form.' },
  { type: 'heading', text: 'Use of Information' },
  { type: 'paragraph', text: 'The information collected is used solely to:' },
  { type: 'list', items: ['Respond to inquiries', 'Communicate with users', 'Improve the overall experience of the website'] },
  { type: 'paragraph', text: 'No personal data is sold, rented, or shared with third parties for marketing purposes.' },
  { type: 'heading', text: 'Data Protection' },
  { type: 'paragraph', text: 'Reasonable measures are taken to protect your information from unauthorized access, misuse, or disclosure. However, no method of transmission over the internet is completely secure.' },
  { type: 'heading', text: 'Cookies and Tracking' },
  { type: 'paragraph', text: 'This website may use basic technologies such as cookies or analytics tools to understand user behavior and improve performance. These do not personally identify users.' },
  { type: 'heading', text: 'Third-Party Services' },
  { type: 'paragraph', text: 'If third-party tools or services are used, such as analytics or hosting, they may collect limited technical data according to their own privacy policies.' },
  { type: 'heading', text: 'User Rights' },
  { type: 'paragraph', text: 'You may request to access, update, or delete your personal information at any time by contacting through the available channels.' },
  { type: 'heading', text: 'Changes to This Policy' },
  { type: 'paragraph', text: 'This Privacy Policy may be updated periodically. Continued use of the website after updates indicates acceptance of the revised policy.' },
  { type: 'heading', text: 'Contact' },
  { type: 'paragraph', text: 'If you have any questions regarding this Privacy Policy or your data, you may contact through the available contact channels on this website.' },
];

const StaticLegalDocumentPage: React.FC<StaticLegalDocumentPageProps> = ({ kind }) => {
  const isTerms = kind === 'terms';

  const title = isTerms ? 'Terms of Service' : 'Privacy Policy';
  const lastUpdated = 'May 15, 2026';
  const introParagraph = isTerms
    ? 'By accessing and using this website, you agree to comply with these Terms of Service and all applicable laws and regulations. If you do not agree with any part of these terms, you should not use this website.'
    : 'This Privacy Policy explains how information is collected, used, and protected when you visit this website.';

  const content = useMemo(() => (isTerms ? TERMS_CONTENT : PRIVACY_CONTENT), [isTerms]);

  useSeoMeta({
    title: `${title} | Oussama Lassoued`,
    description: isTerms
      ? 'Terms of Service for Oussama Lassoued\u2019s portfolio website.'
      : 'Privacy Policy explaining how information is collected, used, and protected on Oussama Lassoued\u2019s portfolio website.',
    canonicalUrl: `https://www.oussamalassoued.me/${isTerms ? 'terms-of-service' : 'privacy-policy'}`,
  });

  return (
    <div className="min-h-screen bg-white text-[#111217]" data-surface="static-home">
      <AdvancedNavbar isLightMode={true} />

      <main className="site-shell pb-12 pt-28 md:pb-16 md:pt-32">
        <section className="mx-auto max-w-[860px] rounded-2xl border border-[#d0d0cb] bg-transparent px-6 py-8 md:px-8 md:py-10">
          <div>
            <p className="text-sm uppercase tracking-[0.18em] text-[#111217]/50">Legal</p>
            <h1 className="mt-3 tracking-tight text-[#111217]" style={{ fontSize: 'clamp(2.6rem, 6vw, 4.8rem)', lineHeight: 1, fontWeight: 600, letterSpacing: '-0.04em' }}>
              {title}
            </h1>
            <p className="mt-4 text-xs uppercase tracking-[0.16em] text-[#111217]/50">
              Last updated: {lastUpdated}
            </p>
          </div>

          <div className="mt-10 space-y-6 text-[1rem] leading-8 text-[#111217]/78 md:text-[1.05rem] md:leading-9">
            {content.map((block, index) => {
              if (block.type === 'heading') {
                return (
                  <h2 key={`${kind}-h-${index}`} className="pt-2 text-[1.3rem] font-semibold tracking-tight text-[#111217] md:text-[1.4rem]">
                    {block.text}
                  </h2>
                );
              }
              if (block.type === 'list') {
                return (
                  <ul key={`${kind}-ul-${index}`} className="list-disc space-y-1 pl-6 text-[#111217]/78">
                    {block.items!.map((item, i) => (
                      <li key={`${kind}-li-${index}-${i}`}>{item}</li>
                    ))}
                  </ul>
                );
              }
              return (
                <p key={`${kind}-p-${index}`} className="text-[#111217]/78">
                  {block.text}
                </p>
              );
            })}
          </div>

          <div className="mt-10 flex flex-col gap-4 border-t border-[#d0d0cb] pt-6 sm:flex-row sm:items-center sm:justify-between">
            <a
              href="/"
              className="inline-flex items-center justify-center rounded-full border border-[#111217]/20 bg-white px-5 py-2.5 text-sm font-medium text-[#111217] transition-colors hover:bg-[#111217]/5"
            >
              Back to Home
            </a>
            <p className="text-sm text-[#111217]/50">
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
