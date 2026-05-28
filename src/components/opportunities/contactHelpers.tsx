import React from 'react';

const UNSAFE_SCHEMES = /^(javascript|data|file|vbscript):/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d\s.-]{6,}$/;
const LINKEDIN_RE = /linkedin/i;

const normalizeUrlValue = (value: string) => {
 const trimmed = value.trim();
 if (!trimmed) return null;
 if (UNSAFE_SCHEMES.test(trimmed)) return null;

 try {
 if (/^https?:\/\//i.test(trimmed)) {
 const parsed = new URL(trimmed);
 if (!/^https?:$/i.test(parsed.protocol)) return null;
 return parsed.toString();
 }

 if (/^\/\//.test(trimmed)) {
 const parsed = new URL(`https:${trimmed}`);
 return parsed.toString();
 }

 const parsed = new URL(`https://${trimmed.replace(/^https?:\/\//i, '')}`);
 if (!/^https?:$/i.test(parsed.protocol)) return null;
 return parsed.toString();
 } catch {
 return null;
 }
};

const normalizePhoneValue = (value: string) => value.replace(/[^\d+]/g, '');

export const normalizeExternalUrl = (value?: string | null) => {
 if (!value) return null;
 return normalizeUrlValue(value);
};

export const getContactHref = (type: string | undefined, value?: string | null) => {
 const rawValue = String(value || '').trim();
 if (!rawValue) return null;

 const normalizedType = String(type || '').trim().toLowerCase();
 if (normalizedType === 'email') {
 return EMAIL_RE.test(rawValue) ? `mailto:${rawValue}` : null;
 }

 if (normalizedType === 'phone') {
 const phone = normalizePhoneValue(rawValue);
 return phone ? `tel:${phone}` : null;
 }

 if (normalizedType === 'whatsapp') {
 if (/^https?:\/\//i.test(rawValue) || /^\/\//.test(rawValue)) {
 return normalizeExternalUrl(rawValue);
 }
 const phone = normalizePhoneValue(rawValue);
 return phone ? `https://wa.me/${phone.replace(/^\+/, '')}` : null;
 }

 if (normalizedType === 'telegram') {
 if (/^https?:\/\//i.test(rawValue) || /^\/\//.test(rawValue)) {
 return normalizeExternalUrl(rawValue);
 }
 const handle = rawValue.replace(/^@/, '').trim();
 return handle ? `https://t.me/${encodeURIComponent(handle)}` : null;
 }

 if (normalizedType === 'website' || normalizedType === 'linkedin' || normalizedType === 'instagram' || normalizedType === 'facebook' || normalizedType === 'x' || normalizedType === 'other') {
 return normalizeExternalUrl(rawValue);
 }

 if (EMAIL_RE.test(rawValue)) {
 return `mailto:${rawValue}`;
 }

 if (PHONE_RE.test(rawValue)) {
 const phone = normalizePhoneValue(rawValue);
 return phone ? `tel:${phone}` : null;
 }

 return normalizeExternalUrl(rawValue);
};

export const isClickableContact = (type: string | undefined, value?: string | null) => Boolean(getContactHref(type, value));

export const getCompactContactLabel = (type?: string | null, value?: string | null): string => {
  const t = String(type || '').trim().toLowerCase();
  const v = String(value || '').trim();

  if (!v && !t) return 'Contact';

  if (t === 'linkedin' || LINKEDIN_RE.test(v)) return 'LinkedIn';
  if (t === 'email') return v.length < 25 ? v : 'Email';
  if (t === 'phone') return 'Phone';
  if (t === 'whatsapp') return 'WhatsApp';

  if (t === 'website' || t === 'instagram' || t === 'facebook' || t === 'x' || t === 'telegram' || t === 'other') {
    try {
      return new URL(v.includes('://') ? v : `https://${v}`).hostname.replace(/^www\./, '');
    } catch {
      return t.charAt(0).toUpperCase() + t.slice(1);
    }
  }

  if (EMAIL_RE.test(v)) return v.length < 25 ? v : 'Email';
  if (PHONE_RE.test(v)) return 'Phone';
  if (v.includes('://') || v.includes('.')) {
    try {
      return new URL(v.includes('://') ? v : `https://${v}`).hostname.replace(/^www\./, '');
    } catch {
      return 'Contact';
    }
  }
  return 'Contact';
};

const copyToClipboard = async (text: string) => {
 try {
 await navigator.clipboard.writeText(text);
 return true;
 } catch {
 return false;
 }
};

export interface ContactLinkProps {
  type?: string;
  value?: string | null;
  displayValue?: string;
  className?: string;
  copyLabel?: string;
  compact?: boolean;
}

export const ContactLink: React.FC<ContactLinkProps> = ({ type, value, displayValue, className, copyLabel = 'Copy', compact }) => {
  const text = String(displayValue || value || '').trim();
  const originalValue = String(value || '').trim();
  const href = getContactHref(type, value);

  if (!text) {
    return <span className={className || 'text-sm text-neutral-500'}>—</span>;
  }

  const displayText = compact ? getCompactContactLabel(type, value) : text;
  const tooltipText = compact ? originalValue || text : undefined;

  const linkClasses = className || 'text-sm font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700';

  if (href) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        title={tooltipText}
        className={compact ? `max-w-[140px] min-w-0 overflow-hidden truncate whitespace-nowrap block ${linkClasses}` : linkClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {displayText}
      </a>
    );
  }

  return (
    <button
      type="button"
      title={tooltipText}
      className={compact ? `max-w-[140px] min-w-0 overflow-hidden truncate whitespace-nowrap block text-left ${linkClasses}` : `text-left ${linkClasses}`}
      onClick={async (e) => { e.stopPropagation(); await copyToClipboard(text); }}
    >
      {displayText} <span className="font-normal text-neutral-500">{copyLabel}</span>
    </button>
  );
};
