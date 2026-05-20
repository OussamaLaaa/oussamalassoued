import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useSiteConfig } from '../context/SiteConfigContext';
import { useSeoMeta } from '../hooks/useSeoMeta';
import { getButtonClass } from '../components/designSystem';
import { AdvancedNavbar } from '../components/AdvancedNavbar';
import { sendMessage, type MessageData } from '../utils/apiClient';
import { validateMessage, sanitizeMessageData } from '../utils/messageValidator';
import { ArrowRight, ArrowUpRight, Phone, Mail, MapPin, Clock, Copy, Loader2, MessageSquare } from 'lucide-react';

const iconSize = 24;

const iconMap: Record<string, React.ReactNode> = {
  linkedin: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  ),
  twitter: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  ),
  instagram: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  ),
  behance: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M7.5 11C9.43 11 11 9.43 11 7.5S9.43 4 7.5 4H2v8h5.5zM2 20h6c2.21 0 4-1.79 4-4s-1.79-4-4-4H2v8zm16.5-8.5c-1.93 0-3.5 1.57-3.5 3.5s1.57 3.5 3.5 3.5c1.53 0 2.84-.97 3.34-2.34l-1.73-1.01c-.32.55-.93.85-1.61.85-.99 0-1.79-.78-1.79-1.75s.8-1.75 1.79-1.75c.57 0 1.08.26 1.41.67l1.71-1.05C20.06 9.7 18.5 8.5 16.5 8.5c-2.21 0-4 1.79-4 4s1.79 4 4 4c1.35 0 2.54-.67 3.26-1.68l-1.71-1.01c-.35.33-.84.52-1.35.52-1.02 0-1.85-.83-1.85-1.85s.83-1.85 1.85-1.85c.66 0 1.24.35 1.57.87l1.71-1.05C20.06 9.7 18.5 8.5 16.5 8.5zM22 20h-5v-1.5h5V20z" />
    </svg>
  ),
  facebook: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  ),
  dribbble: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 24C5.385 24 0 18.615 0 12S5.385 0 12 0s12 5.385 12 12-5.385 12-12 12zm10.12-10.358c-.35-.11-3.17-.953-6.384-.438 1.34 3.684 1.887 6.684 1.992 7.308 2.3-1.555 3.936-4.02 4.395-6.87zm-6.115 7.808c-.153-.9-.75-4.032-2.19-7.77l-.066.02c-5.79 2.015-7.86 6.025-8.04 6.4 1.73 1.358 3.92 2.166 6.29 2.166 1.42 0 2.77-.29 4-.814zm-11.62-2.58c.232-.4 3.045-5.055 8.332-6.765.135-.045.27-.084.405-.12-.26-.585-.54-1.167-.832-1.74C7.17 11.775 2.206 11.71 1.756 11.7l-.004.312c0 2.633.998 5.037 2.634 6.855zm-2.42-8.955c.46.008 4.683.026 9.477-1.248-1.698-3.018-3.53-5.558-3.8-5.928-2.868 1.35-5.01 3.99-5.676 7.17zM9.6 2.052c.282.38 2.145 2.914 3.822 6 3.645-1.365 5.19-3.44 5.373-3.702-1.81-1.61-4.19-2.586-6.795-2.586-.825 0-1.63.1-2.4.285zm10.335 3.483c-.218.29-1.935 2.493-5.724 4.04.24.49.47.985.68 1.486.08.18.15.36.22.53 3.41-.43 6.8.26 7.14.33-.02-2.42-.88-4.64-2.31-6.38z" />
    </svg>
  ),
  youtube: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  email: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  ),
  phone: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.0 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  ),
  location: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  globe: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
  ),
  github: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  ),
  figma: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C8.13 2 5 5.13 5 9c0 2.38 1.19 4.47 3 5.74V17c0 .55.45 1 1 1h6c.55 0 1-.45 1-1v-2.26c1.81-1.27 3-3.36 3-5.74 0-3.87-3.13-7-7-7zm-3 7c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm6 0c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/>
    </svg>
  ),
  mail: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
    </svg>
  ),
  cv: (
    <svg width={iconSize} height={iconSize} viewBox="0 0 24 24" fill="currentColor">
      <path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" />
    </svg>
  ),
};

const Contact: React.FC = () => {
  const { siteConfig } = useSiteConfig();
  const { persistentUI, contactPage } = siteConfig;

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    company: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [submitMessage, setSubmitMessage] = useState('');

  const containerRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  useSeoMeta({
    title: `${contactPage.heroTitleLine1} ${contactPage.heroTitleLine2} | Oussama Lassoued`,
    description: contactPage.heroSubtitle,
    canonicalUrl: 'https://www.oussamalassoued.me/contact',
  });

  const contactCards = useMemo(() => {
    return contactPage.contactCards
      .filter(card => card.visible)
      .map(card => ({
        id: card.id,
        title: card.title,
        subtitle: card.subtitle,
        icon: iconMap[card.icon] || iconMap.mail,
        href: card.href,
        action: card.action,
        color: card.color,
        hoverColor: card.hoverColor,
      }));
  }, [contactPage.contactCards]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateMessage(formData);
    if (!validation.isValid) {
      setSubmitStatus('error');
      setSubmitMessage(Object.values(validation.errors).join('\n'));
      return;
    }

    const sanitizedData = sanitizeMessageData(formData);

    setIsSubmitting(true);
    setSubmitStatus('idle');
    setSubmitMessage('');

    try {
      const response = await sendMessage(sanitizedData);

      if (response.success) {
        setSubmitStatus('success');
        setSubmitMessage('Message sent successfully! I\'ll get back to you soon.');
        setFormData({ name: '', email: '', subject: '', message: '', company: '' });
        setTimeout(() => {
          setSubmitStatus('idle');
          setSubmitMessage('');
        }, 5000);
      } else {
        setSubmitStatus('error');
        setSubmitMessage(response.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      setSubmitStatus('error');
      setSubmitMessage('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!persistentUI) return null;

  const heroTitleStyle: React.CSSProperties = {
    fontSize: 'clamp(3rem, 8vw, 6rem)',
    lineHeight: 1,
    fontWeight: 600,
    letterSpacing: '-0.04em',
  };
  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
    lineHeight: 1.1,
    fontWeight: 600,
    letterSpacing: '-0.03em',
  };
  const sectionEyebrowClass = 'text-sm text-muted-foreground uppercase tracking-widest mb-4';
  const cardShellClass = 'rounded-2xl border border-[#d0d0cb] bg-[#fbfbf8] shadow-none transition-colors duration-300';
  const cardIconClass = 'h-11 w-11 rounded-xl border border-[#d0d0cb] bg-[#f3f2ee] flex items-center justify-center text-[#111827] transition-colors';
  const cardMetaClass = 'text-xs font-medium uppercase tracking-widest text-muted-foreground';
  const cardBodyClass = 'text-sm leading-relaxed text-[#111827]';
  const labelClass = 'block text-xs font-medium uppercase tracking-widest text-muted-foreground';
  const inputClass = 'w-full rounded-xl border border-[#d0d0cb] bg-white px-3.5 py-2.5 text-sm text-[#111827] placeholder:text-[#8b8b8b] transition-colors focus:border-[#111111] focus:outline-none';
  const primaryButtonClass = getButtonClass('button-1', 'light', 'md', 'inline-flex items-center gap-2 rounded-full');
  const secondaryButtonClass = getButtonClass('button-2', 'light', 'icon', 'inline-flex h-9 w-9 items-center justify-center rounded-full');

  return (
    <div
      ref={containerRef}
      className="min-h-screen"
      data-surface="static-home"
      style={{
        ['--background' as any]: '#ffffff',
        ['--foreground' as any]: '#0a0a0a',
        ['--card' as any]: '#ffffff',
        ['--card-foreground' as any]: '#0a0a0a',
        ['--primary' as any]: '#030213',
        ['--primary-foreground' as any]: '#ffffff',
        ['--muted' as any]: '#ececf0',
        ['--muted-foreground' as any]: '#717182',
        ['--border' as any]: 'rgba(0, 0, 0, 0.1)',
      }}
    >
      <AdvancedNavbar isLightMode={true} />

      <main className="min-h-screen bg-background text-foreground">
        <section className="mx-auto max-w-6xl px-6 pt-28 md:pt-36 pb-20">
          {/* Hero */}
          <div data-motion className="max-w-3xl">
            <p className={sectionEyebrowClass}>
              {contactPage.heroEyebrow || 'Contact'}
            </p>
            <h1
              ref={titleRef}
              className="tracking-tight"
              style={heroTitleStyle}
            >
              {contactPage.heroTitleLine1}{' '}
              <span className="relative inline-block">
                <span
                  className="bg-clip-text text-transparent"
                  style={{
                    backgroundImage: 'linear-gradient(110deg, var(--foreground) 0%, rgba(10, 10, 10, 0.45) 100%)',
                  }}
                >
                  {contactPage.heroTitleLine2}
                </span>
                <svg viewBox="0 0 300 12" className="absolute -bottom-2 left-0 w-full h-3 text-foreground/30" preserveAspectRatio="none" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M2 8 Q 75 2, 150 6 T 298 4" />
                </svg>
              </span>
            </h1>
            <p
              ref={subtitleRef}
              className="mt-6 max-w-2xl text-lg md:text-xl text-muted-foreground leading-relaxed"
            >
              {contactPage.heroSubtitle}
            </p>
          </div>

          {/* Decorative divider */}
          <div data-motion className="my-16 h-px w-full bg-gradient-to-r from-transparent via-[#d0d0cb] to-transparent" />

          {/* Contact Info + Form Grid */}
          <div className="grid lg:grid-cols-12 gap-8 mb-20">
            {/* Sidebar */}
            <div data-motion className="lg:col-span-4 space-y-6">
              {/* Direct Contact Card */}
              <div className={`${cardShellClass} p-6`}>
                <div className="flex items-center gap-3 mb-6">
                  <div className={cardIconClass}>
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <span className={cardMetaClass}>
                    {contactPage.directContactTitle}
                  </span>
                </div>

                <div className="space-y-5">
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="mb-0.5 text-xs uppercase tracking-widest text-muted-foreground">{contactPage.phoneLabel}</p>
                      <p className={cardBodyClass}>{contactPage.phoneNumber}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="mb-0.5 text-xs uppercase tracking-widest text-muted-foreground">{contactPage.emailLabel}</p>
                      <div className="flex items-center gap-2">
                        <a href={`mailto:${contactPage.emailAddress}`} className="text-sm font-medium text-[#111827] hover:underline">
                          {contactPage.emailAddress}
                        </a>
                        <button
                          onClick={() => navigator.clipboard.writeText(contactPage.emailAddress)}
                          className={secondaryButtonClass}
                          aria-label={`Copy ${contactPage.emailAddress}`}
                        >
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-muted-foreground" />
                    <div>
                      <p className="mb-0.5 text-xs uppercase tracking-widest text-muted-foreground">{contactPage.officeLabel}</p>
                      <p className={cardBodyClass}>{contactPage.officeAddress}</p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 border-t border-[#d0d0cb] pt-6">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[#111827]" />
                    <p className="text-sm text-muted-foreground">{contactPage.availabilityText}</p>
                  </div>
                </div>
              </div>

              {/* Response Time Card */}
              <div className={`${cardShellClass} p-6 hidden lg:block`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={cardIconClass}>
                    <Clock className="h-5 w-5" />
                  </div>
                  <span className={cardMetaClass}>{contactPage.responseTimeLabel}</span>
                </div>
                <p className="mb-2 text-lg font-semibold text-[#111827]">{contactPage.responseTimeValue}</p>
                <p className="text-sm leading-relaxed text-muted-foreground">{contactPage.responseTimeDescription}</p>
              </div>
            </div>

            {/* Form */}
            <div ref={formRef} data-motion className="lg:col-span-8">
              <div className={`${cardShellClass} p-6 md:p-8`}>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h2 className="tracking-tight text-2xl font-semibold text-[#111827]">{contactPage.formTitle}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{contactPage.formSubtitle}</p>
                  </div>
                  <span className={cardMetaClass}>01 / Form</span>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <label className={labelClass}>{contactPage.formNameLabel}</label>
                      <input type="text" name="name" value={formData.name} onChange={handleInputChange} placeholder={contactPage.formNamePlaceholder} className={inputClass} required />
                    </div>
                    <div className="space-y-1.5">
                      <label className={labelClass}>{contactPage.formEmailLabel}</label>
                      <input type="email" name="email" value={formData.email} onChange={handleInputChange} placeholder={contactPage.formEmailPlaceholder} className={inputClass} required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>{contactPage.formSubjectLabel}</label>
                    <input type="text" name="subject" value={formData.subject} onChange={handleInputChange} placeholder={contactPage.formSubjectPlaceholder} className={inputClass} required />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>{contactPage.formCompanyLabel || 'Company'}</label>
                    <input type="text" name="company" value={formData.company} onChange={handleInputChange} placeholder={contactPage.formCompanyPlaceholder || ''} className={inputClass} />
                  </div>
                  <div className="space-y-1.5">
                    <label className={labelClass}>{contactPage.formMessageLabel}</label>
                    <textarea name="message" value={formData.message} onChange={handleInputChange} placeholder={contactPage.formMessagePlaceholder} rows={5} className={`${inputClass} resize-none`} required />
                  </div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-2">
                    <p className="text-xs text-muted-foreground">
                      By sending, you agree to our{' '}
                      <a href={contactPage.formPrivacyLink} className="underline text-[#111827] hover:text-foreground">
                        {contactPage.formPrivacyText}
                      </a>.
                    </p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={primaryButtonClass}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          {contactPage.formSubmitButton}
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </div>

                  {submitStatus !== 'idle' && (
                    <div className={`p-4 rounded-xl text-sm ${
                      submitStatus === 'success'
                        ? 'bg-green-50 text-green-800 border border-green-200'
                        : 'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {submitMessage}
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>

          {/* Social Channels */}
          <div data-motion className="space-y-8">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <div>
                <p className={sectionEyebrowClass}>
                  {contactPage.socialSectionLabel}
                </p>
                <h2 className="tracking-tight" style={sectionTitleStyle}>
                  {contactPage.socialSectionTitle}
                </h2>
              </div>
              <p className="text-sm text-muted-foreground max-w-sm leading-relaxed">
                {contactPage.socialSectionDescription}
              </p>
            </div>

            <div ref={cardsRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {contactCards.map((card) => (
                <a
                  key={card.id}
                  href={card.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`${cardShellClass} group cursor-pointer p-5 transition-colors duration-300 hover:border-[#111111]`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-medium uppercase tracking-widest text-muted-foreground transition-colors group-hover:text-[#111827]">
                      {card.action}
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full border border-[#d0d0cb] bg-[#f3f2ee] transition-colors group-hover:bg-[#111827]">
                      <ArrowUpRight className="h-4 w-4 text-muted-foreground group-hover:text-white transition-colors" />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d0d0cb] bg-[#f3f2ee] transition-colors group-hover:border-[#111111]" style={{ color: card.color }}>
                      {card.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="truncate text-sm font-semibold text-[#111827]">{card.title}</h3>
                      <p className="truncate text-xs text-muted-foreground">{card.subtitle}</p>
                    </div>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Contact;

