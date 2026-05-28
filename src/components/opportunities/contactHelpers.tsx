import React from 'react';

const UNSAFE_SCHEMES = /^(javascript|data|file|vbscript):/i;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^[+()\d\s.-]{6,}$/;

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
}

export const ContactLink: React.FC<ContactLinkProps> = ({ type, value, displayValue, className, copyLabel = 'Copy' }) => {
 const text = String(displayValue || value || '').trim();
 const href = getContactHref(type, value);

 if (!text) {
 return <span className={className || 'text-sm text-neutral-500'}>—</span>;
 }

 if (href) {
 return (
 <a
 href={href}
 target="_blank"
 rel="noopener noreferrer"
 className={className || 'text-sm font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700'}
 >
 {text}
 </a>
 );
 }

 return (
 <button
 type="button"
 className={className || 'text-left text-sm font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700'}
 onClick={async () => { await copyToClipboard(text); }}
 >
 {text} <span className="font-normal text-neutral-500">{copyLabel}</span>
 </button>
 );
};
