import React, { useMemo, useRef, useState } from 'react';
import {
  getButtonClass,
  getCardClass,
  getGlassClass,
  getScaledRem,
  type SurfaceTone,
} from '../components/designSystem';
import { useSiteConfig } from '../context/SiteConfigContext';
import {
  DEFAULT_SITE_CONFIG,
  SITE_BUTTON_VARIANTS,
  SITE_CARD_VARIANTS,
  SITE_GLASS_VARIANTS,
  SITE_SOCIAL_ICON_KEYS,
  SITE_CONFIG_STORAGE_KEY,
  type SiteButtonVariant,
  type SiteCardVariant,
  type SiteCursorAnimationMode,
  type SiteGlassVariant,
  type SiteConfig,
  type SiteContentStatus,
  type SiteNavItem,
  type SiteArticle,
  type SiteProject,
  type SiteSection,
  type SiteTestimonial,
  type SiteTimelineEvent,
  type SiteExperienceMarqueeItem,
  type SiteScene05Certification,
  type SiteScene05LogoItem,
  type SiteInboxMessage,
  type SiteMessageStatus,
  type AITrackingType,
  type AIFrequency,
  type EmailFolder,
  type EmailStatus,
  type NoteCategory,
  type SiteAITracking,
  type SiteAIReport,
  type SiteEmail,
  type SiteNote,
} from '../config/siteConfig';
import {
  BarChart3,
  ExternalLink,
  FileText,
  Globe,
  Inbox,
  LogOut,
  RotateCcw,
  Save,
  Settings,
  Users,
  Briefcase,
  Share2,
  DollarSign,
  Brain,
  Mail,
  StickyNote,
  Sun,
  Moon,
  type LucideIcon,
} from 'lucide-react';

const DASHBOARD_PASSWORD = '00000008';
const DASHBOARD_AUTH_KEY = 'portfolio.dashboard.auth.v1';
const DASHBOARD_LOGO_FALLBACK_SRC = new URL('../../my logo/white.png', import.meta.url).href;

const MAX_IMAGE_UPLOAD_BYTES = 1_500_000;
const MAX_AUDIO_UPLOAD_BYTES = 2_500_000;

type DashboardSectionId =
  | 'sequence'
  | 'intro'
  | 'featured'
  | 'projects'
  | 'timeline'
  | 'testimonials'
  | 'navigation'
  | 'footer'
  | 'visibility'
  | 'scene05'
  | 'designSystem'
  | 'animation'
  | 'articlesPage';

type DashboardWorkspace =
  | 'sitePages'
  | 'designSystem'
  | 'siteIntegrations'
  | 'publishing'
  | 'analytics'
  | 'messages'
  | 'personalHub'
  | 'aiIntelligence'
  | 'communication'
  | 'notes';

type DashboardPersonalHubSection = 'partners' | 'projects' | 'social' | 'finance';
type DashboardSettingsPanel = 'browser' | 'integrations' | 'inbox';

const DASHBOARD_WORKSPACES: Array<{
  id: DashboardWorkspace;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: 'sitePages',
    label: 'Site Pages',
    description: 'Manage all website pages and content sections.',
    icon: Globe,
  },
  {
    id: 'designSystem',
    label: 'Design System',
    description: 'Colors, typography, components, and animation settings.',
    icon: StickyNote,
  },
  {
    id: 'siteIntegrations',
    label: 'Site Integrations',
    description: 'Browser identity, AI, domain, analytics, and security.',
    icon: Settings,
  },
  {
    id: 'publishing',
    label: 'Publishing',
    description: 'Create, schedule, and manage articles and content.',
    icon: FileText,
  },
  {
    id: 'analytics',
    label: 'Analytics',
    description: 'Site statistics, personal progress, and project reports.',
    icon: BarChart3,
  },
  {
    id: 'messages',
    label: 'Messages',
    description: 'Manage inbound messages from website visitors.',
    icon: Inbox,
  },
  {
    id: 'personalHub',
    label: 'Personal Hub',
    description: 'Partners, projects, social media, and finance.',
    icon: Users,
  },
  {
    id: 'aiIntelligence',
    label: 'AI Intelligence',
    description: 'News tracking, market monitoring, and AI reports.',
    icon: Brain,
  },
  {
    id: 'communication',
    label: 'Communication',
    description: 'Email client and communication management.',
    icon: Mail,
  },
  {
    id: 'notes',
    label: 'Notes',
    description: 'Personal note-taking and knowledge management.',
    icon: StickyNote,
  },
];

const DASHBOARD_SETTINGS_PANELS: Array<{
  id: DashboardSettingsPanel;
  label: string;
  description: string;
}> = [
  {
    id: 'browser',
    label: 'Browser Identity',
    description: 'Tab title and favicon shown in the browser.',
  },
  {
    id: 'integrations',
    label: 'Integrations',
    description: 'API endpoint, domain, and analytics keys.',
  },
  {
    id: 'inbox',
    label: 'Inbox Routing',
    description: 'Forwarding and auto-reply behavior for new messages.',
  },
];

const DASHBOARD_PERSONAL_HUB_SECTIONS: Array<{
  id: DashboardPersonalHubSection;
  label: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    id: 'partners',
    label: 'Partners',
    description: 'Target companies and freelance opportunities.',
    icon: Users,
  },
  {
    id: 'projects',
    label: 'Projects',
    description: 'Current and completed project management.',
    icon: Briefcase,
  },
  {
    id: 'social',
    label: 'Social Media',
    description: 'Social media accounts and post scheduling.',
    icon: Share2,
  },
  {
    id: 'finance',
    label: 'Finance',
    description: 'Income, expenses, investments, and invoices.',
    icon: DollarSign,
  },
];

const DASHBOARD_SECTIONS: Array<{ id: DashboardSectionId; label: string; hint: string }> = [
  { id: 'intro', label: 'Intro Window', hint: 'Opening text and intro card styling' },
  { id: 'scene05', label: 'About Page', hint: 'Profile layout, portrait, story, and certifications' },
  { id: 'featured', label: 'Featured Area', hint: 'Section headings and CTA copy' },
  { id: 'projects', label: 'Projects', hint: 'Project cards and media sources' },
  { id: 'testimonials', label: 'Testimonials', hint: 'Slider content and avatar cards' },
  { id: 'articlesPage', label: 'Articles Page', hint: 'Hero, filters, labels, and list copy' },
  { id: 'timeline', label: 'Career Timeline', hint: 'About page timeline milestones and descriptions' },
  { id: 'navigation', label: 'Navigation + Music', hint: 'Top bar links, CTA, and music controls' },
  { id: 'footer', label: 'Footer', hint: 'Contact, social, legal, and office details' },
  { id: 'visibility', label: 'Visibility', hint: 'Show/hide layers and major sections' },
  { id: 'sequence', label: 'Cinematic Flow', hint: 'Scene order, auto handoff, and portal frame' },
  { id: 'designSystem', label: 'Design System', hint: 'Tokens, foundations, and style mapping' },
  { id: 'animation', label: 'Animation Lab', hint: 'Cursor presets and motion timings' },
];

const DASHBOARD_SECTION_GROUPS: Array<{ id: string; label: string; sectionIds: DashboardSectionId[] }> = [
  {
    id: 'pages',
    label: 'Pages & Content',
    sectionIds: ['intro', 'scene05', 'featured', 'projects', 'testimonials', 'articlesPage', 'timeline', 'navigation', 'footer'],
  },
  {
    id: 'system-motion',
    label: 'System Layer',
    sectionIds: ['visibility', 'sequence', 'designSystem', 'animation'],
  },
];

const formatVariantLabel = (variant: string) => {
  if (variant.startsWith('button-')) return `Button ${variant.replace('button-', '')}`;
  if (variant.startsWith('card-')) return `Card ${variant.replace('card-', '')}`;
  if (variant.startsWith('glass-')) return `Glass ${variant.replace('glass-', '')}`;
  return variant;
};

const isValidSection = (value: string): value is SiteSection => {
  return ['home', 'about', 'projects', 'testimonials', 'articles'].includes(value);
};

const splitLines = (value: string) => {
  return value
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
};

const slugify = (value: string) => {
  const normalized = value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
  return normalized || `post-${Date.now()}`;
};

const toSafeNumber = (value: string, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const toSafeNumberInRange = (value: string, fallback: number, min: number, max: number) => {
  const parsed = toSafeNumber(value, fallback);
  return Math.min(max, Math.max(min, parsed));
};

const toDateTimeLocalValue = (value: string) => {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';
  const offsetMs = parsed.getTimezoneOffset() * 60_000;
  return new Date(parsed.getTime() - offsetMs).toISOString().slice(0, 16);
};

const fromDateTimeLocalValue = (value: string, fallback: string) => {
  if (!value) return fallback;
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return fallback;
  return parsed.toISOString();
};

const parseTagsInput = (value: string) => {
  return value
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const formatMegabytes = (bytes: number) => {
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
};

const readFileAsDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
        return;
      }
      reject(new Error('Invalid file payload.'));
    };
    reader.onerror = () => {
      reject(reader.error ?? new Error('Unable to read file.'));
    };
    reader.readAsDataURL(file);
  });
};

const COLOR_HEX_REGEX = /^#([0-9a-f]{3,4}|[0-9a-f]{6}|[0-9a-f]{8})$/i;

const toPickerColorValue = (value: string) => {
  const trimmed = value.trim();
  if (!trimmed) return '#000000';

  const hexMatch = trimmed.match(COLOR_HEX_REGEX);
  if (hexMatch?.[0]) {
    const rawHex = hexMatch[0].slice(1).toLowerCase();
    if (rawHex.length === 3) {
      return `#${rawHex
        .split('')
        .map((character) => character + character)
        .join('')}`;
    }
    if (rawHex.length === 4) {
      return `#${rawHex
        .slice(0, 3)
        .split('')
        .map((character) => character + character)
        .join('')}`;
    }
    if (rawHex.length === 8) {
      return `#${rawHex.slice(0, 6)}`;
    }
    return `#${rawHex}`;
  }

  if (typeof document === 'undefined') return '#000000';

  const probe = document.createElement('span');
  probe.style.color = trimmed;
  probe.style.position = 'absolute';
  probe.style.left = '-9999px';
  probe.style.top = '-9999px';
  document.body.appendChild(probe);

  const computedColor = window.getComputedStyle(probe).color;
  probe.remove();

  const rgbMatch = computedColor.match(/^rgba?\(([^)]+)\)$/i);
  if (!rgbMatch?.[1]) return '#000000';

  const [red, green, blue] = rgbMatch[1]
    .split(',')
    .slice(0, 3)
    .map((part) => Number.parseFloat(part.trim()));

  if ([red, green, blue].some((channel) => !Number.isFinite(channel))) return '#000000';

  const toHexChannel = (channel: number) => {
    return Math.round(Math.min(255, Math.max(0, channel))).toString(16).padStart(2, '0');
  };

  return `#${toHexChannel(red)}${toHexChannel(green)}${toHexChannel(blue)}`;
};

const Card: React.FC<{
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
}> = ({ title, subtitle, children, className }) => {
  return (
    <section
      className={`dashboard-card-surface relative overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-sm ${
        className ?? ''
      }`}
    >
      <div className="mb-3 border-b border-[#e5e7eb] pb-2">
        <h2 className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#1a1a1a]">{title}</h2>
        {subtitle ? (
          <p className="mt-0.5 text-[11px] text-[#6b7280]">{subtitle}</p>
        ) : null}
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );
};

const SectionButton: React.FC<{
  label: string;
  hint: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ label, hint, isActive, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group w-full rounded-[10px] border px-3 py-2 text-left transition-all duration-300 ${
        isActive
          ? 'border-[#3b82f6] bg-[#3b82f6]/10 text-[#1a1a1a]'
          : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:border-[#d1d5db] hover:bg-[#f9fafb]'
      }`}
    >
      <p className="font-mono text-[9px] uppercase tracking-[0.12em]">{label}</p>
      <p
        className={`mt-0.5 text-[11px] ${isActive ? 'text-[#1a1a1a]' : 'text-[#9ca3af]'}`}
      >
        {hint}
      </p>
    </button>
  );
};

const Input: React.FC<{
  label: string;
  value: string | number;
  onChange: (value: string) => void;
  type?: string;
  min?: number;
  max?: number;
  step?: number;
}> = ({ label, value, onChange, type = 'text', min, max, step }) => {
  if (type === 'number') {
    const stepValue = typeof step === 'number' && step > 0 ? step : 1;
    const decimals = (() => {
      const stepString = stepValue.toString();
      if (!stepString.includes('.')) return 0;
      return stepString.split('.')[1]?.length ?? 0;
    })();

    const clampValue = (next: number) => {
      let clamped = next;
      if (typeof min === 'number') clamped = Math.max(min, clamped);
      if (typeof max === 'number') clamped = Math.min(max, clamped);
      return clamped;
    };

    const formatNumber = (next: number) => {
      if (decimals <= 0) return `${Math.round(next)}`;
      return `${Number(next.toFixed(decimals))}`;
    };

    const parsedValue = typeof value === 'number' ? value : Number(value);
    const currentNumber = Number.isFinite(parsedValue)
      ? clampValue(parsedValue)
      : typeof min === 'number'
        ? min
        : 0;
    const showSlider = typeof min === 'number' && typeof max === 'number';

    const nudgeValue = (direction: -1 | 1) => {
      const nextValue = clampValue(currentNumber + direction * stepValue);
      onChange(formatNumber(nextValue));
    };

    return (
      <label className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b7280]">{label}</span>
          <div className="inline-flex items-center gap-1 rounded-[8px] border border-[#e5e7eb] bg-[#f8f9fa] p-0.5">
            <button
              type="button"
              onClick={() => nudgeValue(-1)}
              className="inline-flex h-5 w-5 items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white text-[12px] leading-none text-[#6b7280] transition-all hover:bg-[#ffffff]"
              aria-label={`Decrease ${label}`}
            >
              -
            </button>
            <button
              type="button"
              onClick={() => nudgeValue(1)}
              className="inline-flex h-5 w-5 items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white text-[12px] leading-none text-[#6b7280] transition-all hover:bg-[#ffffff]"
              aria-label={`Increase ${label}`}
            >
              +
            </button>
          </div>
        </div>

        <input
          type="number"
          min={min}
          max={max}
          step={stepValue}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-[8px] border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[12px] text-[#1a1a1a] outline-none transition-all focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
        />

        {showSlider ? (
          <input
            type="range"
            min={min}
            max={max}
            step={stepValue}
            value={currentNumber}
            onChange={(e) => onChange(e.target.value)}
            className="dashboard-range h-1.5 w-full cursor-pointer appearance-none rounded-full"
          />
        ) : null}
      </label>
    );
  }

  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b7280]">{label}</span>
      <input
        type={type}
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[8px] border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[12px] text-[#1a1a1a] outline-none transition-all focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
      />
    </label>
  );
};

const ColorInput: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
}> = ({ label, value, onChange }) => {
  const pickerValue = toPickerColorValue(value);

  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b7280]">{label}</span>
      <div className="flex items-stretch gap-2">
        <input
          type="color"
          value={pickerValue}
          onChange={(e) => onChange(e.target.value)}
          aria-label={`${label} color picker`}
          className="h-[36px] w-[44px] cursor-pointer rounded-[8px] border border-[#e5e7eb] bg-white p-1 outline-none transition-all focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
        />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="min-w-0 flex-1 rounded-[8px] border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[12px] text-[#1a1a1a] outline-none transition-all focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
        />
      </div>
      <p className="text-[9px] text-[#9ca3af]">Use the swatch or paste any CSS color.</p>
    </label>
  );
};

const Textarea: React.FC<{
  label: string;
  value: string;
  onChange: (value: string) => void;
  rows?: number;
}> = ({ label, value, onChange, rows = 3 }) => {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b7280]">{label}</span>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[8px] border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[12px] text-[#1a1a1a] outline-none transition-all focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
      />
    </label>
  );
};

const SelectInput: React.FC<{
  label: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
}> = ({ label, value, options, onChange }) => {
  return (
    <label className="flex flex-col gap-1">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b7280]">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="rounded-[8px] border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[12px] text-[#1a1a1a] outline-none transition-all focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
};

const VariantPickerTitle: React.FC<{ label: string; tone: SurfaceTone }> = ({ label, tone }) => {
  return (
    <p
      className={`font-mono text-[10px] uppercase tracking-[0.14em] ${
        tone === 'dark' ? 'text-[#6b7280]' : 'text-[#1a1a1a]'
      }`}
    >
      {label}
    </p>
  );
};

const ButtonVariantPicker: React.FC<{
  label: string;
  value: SiteButtonVariant;
  onChange: (variant: SiteButtonVariant) => void;
  tone?: SurfaceTone;
  sampleText?: string;
}> = ({ label, value, onChange, tone = 'dark', sampleText = 'Sample Action' }) => {
  const wrapperToneClass = tone === 'dark' ? 'bg-[#f3f4f6] border-[#e5e7eb]' : 'bg-[#ffffff] border-[#e5e7eb]';

  return (
    <div className="space-y-2">
      <VariantPickerTitle label={label} tone={tone} />
      <div className={`grid gap-2 rounded-[12px] border p-2 ${wrapperToneClass} sm:grid-cols-3`}>
        {SITE_BUTTON_VARIANTS.map((variant) => {
          const isActive = value === variant;
          return (
            <button
              key={variant}
              type="button"
              onClick={() => onChange(variant)}
              className={`rounded-[12px] p-1.5 text-left transition-all ${
                isActive
                  ? tone === 'dark'
                    ? 'bg-[#f8f9fa] ring-1 ring-[#e5e7eb]'
                    : 'bg-[#ffffff] ring-1 ring-[#e5e7eb]'
                  : tone === 'dark'
                    ? 'hover:bg-[#f8f9fa]'
                    : 'hover:bg-[#ffffff]'
              }`}
            >
              <span className={getButtonClass(variant, tone as SurfaceTone, 'sm', 'w-full justify-center')}>
                {sampleText}
              </span>
              <span
                className={`mt-1.5 block text-center font-mono text-[10px] uppercase tracking-[0.12em] ${
                  tone === 'dark' ? 'text-[#6b7280]' : 'text-[#1a1a1a]'
                }`}
              >
                {formatVariantLabel(variant)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const CardVariantPicker: React.FC<{
  label: string;
  value: SiteCardVariant;
  glassVariant: SiteGlassVariant;
  onChange: (variant: SiteCardVariant) => void;
  tone?: SurfaceTone;
}> = ({ label, value, glassVariant, onChange, tone = 'dark' }) => {
  const wrapperToneClass = tone === 'dark' ? 'bg-[#ffffff] border-[#e5e7eb]' : 'bg-[#f8f9fa] border-[#e5e7eb]';
  const textToneClass = tone === 'dark' ? 'text-[#6b7280]' : 'text-[#1a1a1a]';

  return (
    <div className="space-y-2">
      <VariantPickerTitle label={label} tone={tone} />
      <div className={`grid gap-2 rounded-[12px] border p-2 ${wrapperToneClass} sm:grid-cols-2`}>
        {SITE_CARD_VARIANTS.map((variant) => {
          const isActive = value === variant;
          return (
            <button
              key={variant}
              type="button"
              onClick={() => onChange(variant)}
              className={`rounded-[12px] p-1.5 text-left transition-all ${
                isActive
                  ? tone === 'dark'
                    ? 'bg-[#f8f9fa] ring-1 ring-[#e5e7eb]'
                    : 'bg-[#ffffff] ring-1 ring-[#e5e7eb]'
                  : tone === 'dark'
                    ? 'hover:bg-[#f8f9fa]'
                    : 'hover:bg-[#ffffff]'
              }`}
            >
              <div
                className={`${getCardClass(variant, tone as SurfaceTone, 'p-3')} ${getGlassClass(
                  glassVariant,
                  tone as SurfaceTone,
                )}`}
              >
                <p className={`font-sans text-sm font-semibold ${textToneClass}`}>Card Surface</p>
                <p className={`mt-1 text-xs ${tone === 'dark' ? 'text-[#6b7280]' : 'text-[#1a1a1a]'}`}>
                  Glass depth and border behavior preview.
                </p>
              </div>
              <span
                className={`mt-1.5 block text-center font-mono text-[10px] uppercase tracking-[0.12em] ${
                  tone === 'dark' ? 'text-[#6b7280]' : 'text-[#1a1a1a]'
                }`}
              >
                {formatVariantLabel(variant)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const GlassVariantPicker: React.FC<{
  label: string;
  value: SiteGlassVariant;
  onChange: (variant: SiteGlassVariant) => void;
  tone?: SurfaceTone;
}> = ({ label, value, onChange, tone = 'dark' }) => {
  const wrapperToneClass = tone === 'dark' ? 'bg-[#ffffff] border-[#e5e7eb]' : 'bg-[#f8f9fa] border-[#e5e7eb]'

  return (
    <div className="space-y-2">
      <VariantPickerTitle label={label} tone={tone} />
      <div className={`grid gap-2 rounded-[12px] border p-2 ${wrapperToneClass} sm:grid-cols-3`}>
        {SITE_GLASS_VARIANTS.map((variant) => {
          const isActive = value === variant;
          return (
            <button
              key={variant}
              type="button"
              onClick={() => onChange(variant)}
              className={`rounded-[12px] p-1.5 text-left transition-all ${
                isActive
                  ? tone === 'dark'
                    ? 'bg-[#f8f9fa] ring-1 ring-[#e5e7eb]'
                    : 'bg-[#ffffff] ring-1 ring-[#e5e7eb]'
                  : tone === 'dark'
                    ? 'hover:bg-[#f8f9fa]'
                    : 'hover:bg-[#ffffff]'
              }`}
            >
              <div className={`${getGlassClass(variant, tone as SurfaceTone)} rounded-[10px] p-3`}>
                <p className={`font-mono text-[10px] uppercase tracking-[0.12em] ${tone === 'dark' ? 'text-[#6b7280]' : 'text-[#1a1a1a]'}`}>
                  Glass Surface
                </p>
              </div>
              <span
                className={`mt-1.5 block text-center font-mono text-[10px] uppercase tracking-[0.12em] ${
                  tone === 'dark' ? 'text-[#6b7280]' : 'text-[#1a1a1a]'
                }`}
              >
                {formatVariantLabel(variant)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

const Toggle: React.FC<{ label: string; checked: boolean; onChange: (checked: boolean) => void }> = ({
  label,
  checked,
  onChange,
}) => {
  return (
    <label className="flex items-center justify-between gap-3 rounded-[8px] border border-[#e5e7eb] bg-[#f8f9fa] px-2.5 py-1.5">
      <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b7280]">{label}</span>
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-[#3b82f6]" />
    </label>
  );
};

const listItemClass =
  'rounded-[10px] border border-[#e5e7eb] bg-white p-2.5 md:p-3 space-y-2';

const dashboardActionButtonBaseClass =
  'inline-flex h-8 items-center justify-center rounded-[8px] border px-3 font-mono text-[9px] uppercase tracking-[0.14em] transition-all focus-visible:outline-none focus-visible:ring-1';
const dashboardActionButtonPrimaryClass =
  `${dashboardActionButtonBaseClass} border-[#3b82f6] bg-[#3b82f6] text-white hover:bg-[#2563eb] focus-visible:ring-[#3b82f6]`;
const dashboardActionButtonSecondaryClass =
  `${dashboardActionButtonBaseClass} border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#ffffff] focus-visible:ring-[#e5e7eb]`;
const dashboardActionButtonDangerClass =
  `${dashboardActionButtonBaseClass} border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20 focus-visible:ring-[#ef4444]`;
const dashboardStatusSuccessClass =
  'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]';
const dashboardStatusFailureClass =
  'border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]';

export const Dashboard: React.FC = () => {
  const { siteConfig, setSiteConfig, resetSiteConfig } = useSiteConfig();

  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [activeWorkspace, setActiveWorkspace] = useState<DashboardWorkspace>('sitePages');
  const [activeSection, setActiveSection] = useState<DashboardSectionId>('sequence');
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<DashboardSettingsPanel>('browser');
  const [activePersonalHubSection, setActivePersonalHubSection] = useState<DashboardPersonalHubSection>('partners');
  const [articleSearchQuery, setArticleSearchQuery] = useState('');
  const [activeArticleId, setActiveArticleId] = useState<string | null>(null);
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [messageSearch, setMessageSearch] = useState('');
  const [messageFilter, setMessageFilter] = useState<'all' | SiteMessageStatus>('all');
  const [uploadMessage, setUploadMessage] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeButtonStudio, setActiveButtonStudio] = useState<SiteButtonVariant>('button-1');
  const [activeCardStudio, setActiveCardStudio] = useState<SiteCardVariant>('card-1');
  const [dashboardTheme, setDashboardTheme] = useState<'dark' | 'light'>('dark');
  const previewAnimationAreaRef = useRef<HTMLDivElement | null>(null);
  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.sessionStorage.getItem(DASHBOARD_AUTH_KEY) === 'ok';
  });

  // AI Intelligence workspace states
  const [activeTrackingId, setActiveTrackingId] = useState<string | null>(null);
  const [trackingSearch, setTrackingSearch] = useState('');
  const [showReports, setShowReports] = useState(false);

  // Communication workspace states
  const [activeEmailId, setActiveEmailId] = useState<string | null>(null);
  const [emailSearch, setEmailSearch] = useState('');
  const [emailFilter, setEmailFilter] = useState<EmailFolder>('inbox');
  const [showCompose, setShowCompose] = useState(false);
  const [composeTo, setComposeTo] = useState('');
  const [composeSubject, setComposeSubject] = useState('');
  const [composeBody, setComposeBody] = useState('');

  // Notes workspace states
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [noteSearch, setNoteSearch] = useState('');
  const [noteCategoryFilter, setNoteCategoryFilter] = useState<NoteCategory | 'all'>('all');

  // Design System workspace states
  const [activeDesignSection, setActiveDesignSection] = useState<'colors' | 'typography' | 'spacing' | 'components' | 'motion'>('colors');

  // Site Integrations workspace states
  const [activeIntegrationSection, setActiveIntegrationSection] = useState<'browser' | 'ai' | 'domain' | 'analytics' | 'security' | 'technical'>('browser');

  // Publishing workspace states
  const [activePublishingSection, setActivePublishingSection] = useState<'articles' | 'calendar' | 'analytics' | 'settings'>('articles');

  const updateConfig = (updater: (prev: SiteConfig) => SiteConfig) => {
    setSiteConfig((prev) => updater(prev));
    setHasUnsavedChanges(true);
  };

  const updateProject = (projectId: string, updater: (project: SiteProject) => SiteProject) => {
    updateConfig((prev) => ({
      ...prev,
      projects: prev.projects.map((project) => (project.id === projectId ? updater(project) : project)),
    }));
  };

  const updateArticle = (articleId: string, updater: (article: SiteArticle) => SiteArticle) => {
    updateConfig((prev) => ({
      ...prev,
      articles: prev.articles.map((article) => (article.id === articleId ? updater(article) : article)),
    }));
  };

  const updateDashboardBrowser = <K extends keyof SiteConfig['dashboard']['browser']>(
    key: K,
    value: SiteConfig['dashboard']['browser'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        browser: {
          ...prev.dashboard.browser,
          [key]: value,
        },
      },
    }));
  };

  const updateDashboardIntegration = <K extends keyof SiteConfig['dashboard']['integrations']>(
    key: K,
    value: SiteConfig['dashboard']['integrations'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        integrations: {
          ...prev.dashboard.integrations,
          [key]: value,
        },
      },
    }));
  };

  const updateDashboardAnalytics = <K extends keyof SiteConfig['dashboard']['analytics']>(
    key: K,
    value: SiteConfig['dashboard']['analytics'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        analytics: {
          ...prev.dashboard.analytics,
          [key]: value,
        },
      },
    }));
  };

  const updateDashboardInbox = <K extends keyof SiteConfig['dashboard']['inbox']>(
    key: K,
    value: SiteConfig['dashboard']['inbox'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        inbox: {
          ...prev.dashboard.inbox,
          [key]: value,
        },
      },
    }));
  };

  const updateInboxMessage = (
    messageId: string,
    updater: (message: SiteInboxMessage) => SiteInboxMessage,
  ) => {
    updateConfig((prev) => ({
      ...prev,
      dashboard: {
        ...prev.dashboard,
        inbox: {
          ...prev.dashboard.inbox,
          items: prev.dashboard.inbox.items.map((message) =>
            message.id === messageId ? updater(message) : message,
          ),
        },
      },
    }));
  };

  const updateTimelineEvent = (
    eventId: string,
    updater: (prev: SiteTimelineEvent) => SiteTimelineEvent,
  ) => {
    updateConfig((prev) => ({
      ...prev,
      journeyTimeline: prev.journeyTimeline.map((ev) =>
        ev.id === eventId ? updater(ev) : ev,
      ),
    }));
  };

  const updateTestimonial = (
    testimonialId: string,
    updater: (testimonial: SiteTestimonial) => SiteTestimonial,
  ) => {
    updateConfig((prev) => ({
      ...prev,
      testimonials: prev.testimonials.map((testimonial) =>
        testimonial.id === testimonialId ? updater(testimonial) : testimonial,
      ),
    }));
  };

  const updateScene05Certification = (
    certificationId: string,
    updater: (item: SiteScene05Certification) => SiteScene05Certification,
  ) => {
    updateConfig((prev) => ({
      ...prev,
      scene05: {
        ...prev.scene05,
        featuredCertifications: prev.scene05.featuredCertifications.map((item) =>
          item.id === certificationId ? updater(item) : item,
        ),
      },
    }));
  };

  const updateScene05LogoItem = (
    group: 'learningLogos' | 'companyLogos',
    logoId: string,
    updater: (item: SiteScene05LogoItem) => SiteScene05LogoItem,
  ) => {
    updateConfig((prev) => ({
      ...prev,
      scene05: {
        ...prev.scene05,
        [group]: prev.scene05[group].map((item) => (item.id === logoId ? updater(item) : item)),
      },
    }));
  };

  const updateExperienceMarqueeItem = (
    itemId: string,
    updater: (item: SiteExperienceMarqueeItem) => SiteExperienceMarqueeItem,
  ) => {
    updateConfig((prev) => ({
      ...prev,
      experienceMarquee: prev.experienceMarquee.map((item) =>
        item.id === itemId ? updater(item) : item,
      ),
    }));
  };

  const updateDesignTheme = <K extends keyof SiteConfig['designSystem']['theme']>(
    key: K,
    value: SiteConfig['designSystem']['theme'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      designSystem: {
        ...prev.designSystem,
        theme: {
          ...prev.designSystem.theme,
          [key]: value,
        },
      },
    }));
  };

  const updateDesignComponent = <K extends keyof SiteConfig['designSystem']['components']>(
    key: K,
    value: SiteConfig['designSystem']['components'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      designSystem: {
        ...prev.designSystem,
        components: {
          ...prev.designSystem.components,
          [key]: value,
        },
      },
    }));
  };

  const updateFoundationTypography = <K extends keyof SiteConfig['designSystem']['foundation']['typography']>(
    key: K,
    value: SiteConfig['designSystem']['foundation']['typography'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      designSystem: {
        ...prev.designSystem,
        foundation: {
          ...prev.designSystem.foundation,
          typography: {
            ...prev.designSystem.foundation.typography,
            [key]: value,
          },
        },
      },
    }));
  };

  const updateFoundationSpacing = <K extends keyof SiteConfig['designSystem']['foundation']['spacing']>(
    key: K,
    value: SiteConfig['designSystem']['foundation']['spacing'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      designSystem: {
        ...prev.designSystem,
        foundation: {
          ...prev.designSystem.foundation,
          spacing: {
            ...prev.designSystem.foundation.spacing,
            [key]: value,
          },
        },
      },
    }));
  };

  const updateFoundationLayout = <K extends keyof SiteConfig['designSystem']['foundation']['layout']>(
    key: K,
    value: SiteConfig['designSystem']['foundation']['layout'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      designSystem: {
        ...prev.designSystem,
        foundation: {
          ...prev.designSystem.foundation,
          layout: {
            ...prev.designSystem.foundation.layout,
            [key]: value,
          },
        },
      },
    }));
  };

  const updateArticlesPageField = <K extends keyof SiteConfig['articlesPage']>(
    key: K,
    value: SiteConfig['articlesPage'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      articlesPage: {
        ...prev.articlesPage,
        [key]: value,
      },
    }));
  };

  const updateButtonPreset = (
    variant: SiteButtonVariant,
    patch: Partial<SiteConfig['designSystem']['componentStyles']['buttons'][SiteButtonVariant]>,
  ) => {
    updateConfig((prev) => ({
      ...prev,
      designSystem: {
        ...prev.designSystem,
        componentStyles: {
          ...prev.designSystem.componentStyles,
          buttons: {
            ...prev.designSystem.componentStyles.buttons,
            [variant]: {
              ...prev.designSystem.componentStyles.buttons[variant],
              ...patch,
            },
          },
        },
      },
    }));
  };

  const updateCardPreset = (
    variant: SiteCardVariant,
    patch: Partial<SiteConfig['designSystem']['componentStyles']['cards'][SiteCardVariant]>,
  ) => {
    updateConfig((prev) => ({
      ...prev,
      designSystem: {
        ...prev.designSystem,
        componentStyles: {
          ...prev.designSystem.componentStyles,
          cards: {
            ...prev.designSystem.componentStyles.cards,
            [variant]: {
              ...prev.designSystem.componentStyles.cards[variant],
              ...patch,
            },
          },
        },
      },
    }));
  };

  const updateMotionSystem = <K extends keyof SiteConfig['animation']['motion']>(
    key: K,
    value: SiteConfig['animation']['motion'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        motion: {
          ...prev.animation.motion,
          [key]: value,
        },
      },
    }));
  };

  const updateAnimationMode = (mode: SiteCursorAnimationMode) => {
    updateConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        activeCursorAnimation: mode,
      },
    }));
  };

  const updateFluidCursor = <K extends keyof SiteConfig['animation']['cursor']>(
    key: K,
    value: SiteConfig['animation']['cursor'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        cursor: {
          ...prev.animation.cursor,
          [key]: value,
        },
      },
    }));
  };

  const updateAuraCursor = <K extends keyof SiteConfig['animation']['aura']>(
    key: K,
    value: SiteConfig['animation']['aura'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        aura: {
          ...prev.animation.aura,
          [key]: value,
        },
      },
    }));
  };

  const updateOrbitCursor = <K extends keyof SiteConfig['animation']['orbit']>(
    key: K,
    value: SiteConfig['animation']['orbit'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        orbit: {
          ...prev.animation.orbit,
          [key]: value,
        },
      },
    }));
  };

  const updateCometCursor = <K extends keyof SiteConfig['animation']['comet']>(
    key: K,
    value: SiteConfig['animation']['comet'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        comet: {
          ...prev.animation.comet,
          [key]: value,
        },
      },
    }));
  };

  const updateRippleCursor = <K extends keyof SiteConfig['animation']['ripple']>(
    key: K,
    value: SiteConfig['animation']['ripple'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        ripple: {
          ...prev.animation.ripple,
          [key]: value,
        },
      },
    }));
  };

  const updateSparkCursor = <K extends keyof SiteConfig['animation']['spark']>(
    key: K,
    value: SiteConfig['animation']['spark'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        spark: {
          ...prev.animation.spark,
          [key]: value,
        },
      },
    }));
  };

  const updateBeamCursor = <K extends keyof SiteConfig['animation']['beam']>(
    key: K,
    value: SiteConfig['animation']['beam'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        beam: {
          ...prev.animation.beam,
          [key]: value,
        },
      },
    }));
  };

  const updatePlasmaCursor = <K extends keyof SiteConfig['animation']['plasma']>(
    key: K,
    value: SiteConfig['animation']['plasma'][K],
  ) => {
    updateConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        plasma: {
          ...prev.animation.plasma,
          [key]: value,
        },
      },
    }));
  };

  const updateSectionAnimation = <K extends keyof SiteConfig['animation']['sections']>(
    section: K,
    patch: Partial<SiteConfig['animation']['sections'][K]>,
  ) => {
    updateConfig((prev) => ({
      ...prev,
      animation: {
        ...prev.animation,
        sections: {
          ...prev.animation.sections,
          [section]: {
            ...prev.animation.sections[section],
            ...patch,
          },
        },
      },
    }));
  };

  const updateVisibility = <K extends keyof SiteConfig['visibility']>(key: K, value: SiteConfig['visibility'][K]) => {
    updateConfig((prev) => ({
      ...prev,
      visibility: {
        ...prev.visibility,
        [key]: value,
      },
    }));
  };

  const clearUploadFeedback = () => {
    setUploadError('');
    setUploadMessage('');
  };

  const handleSaveChanges = () => {
    clearUploadFeedback();
    if (typeof window === 'undefined') return false;

    try {
      window.localStorage.setItem(SITE_CONFIG_STORAGE_KEY, JSON.stringify(siteConfig));
      setHasUnsavedChanges(false);
      setUploadMessage('Changes saved successfully.');
      return true;
    } catch {
      setUploadError('Unable to save changes. Try reducing uploaded file sizes and save again.');
      return false;
    }
  };

  const handleOpenSite = () => {
    const didSave = handleSaveChanges();
    if (!didSave) return;
    window.location.hash = '#/';
  };

  const handleOpenArticlesPage = () => {
    const didSave = handleSaveChanges();
    if (!didSave) return;
    window.location.hash = '#/articles';
  };

  const handleOpenArticlePreview = (slug: string) => {
    const didSave = handleSaveChanges();
    if (!didSave) return;
    window.location.hash = `#/articles/${encodeURIComponent(slug.toLowerCase())}`;
  };

  const handleMusicUpload = async (file: File | null) => {
    clearUploadFeedback();
    if (!file) return;

    if (file.size > MAX_AUDIO_UPLOAD_BYTES) {
      setUploadError(
        `Audio file is too large. Keep it under ${formatMegabytes(MAX_AUDIO_UPLOAD_BYTES)} for reliable local save.`,
      );
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateConfig((prev) => ({
        ...prev,
        persistentUI: { ...prev.persistentUI, musicSrc: dataUrl },
      }));
      setUploadMessage(`Music file "${file.name}" uploaded successfully.`);
    } catch {
      setUploadError('Could not read the selected audio file.');
    }
  };

  const handleProjectImageUpload = async (project: SiteProject, file: File | null) => {
    clearUploadFeedback();
    if (!file) return;

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setUploadError(
        `Image is too large. Keep it under ${formatMegabytes(MAX_IMAGE_UPLOAD_BYTES)} for reliable local save.`,
      );
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateProject(project.id, (item) => ({ ...item, img: dataUrl }));
      setUploadMessage(`Image for "${project.title}" updated.`);
    } catch {
      setUploadError('Could not read the selected image file.');
    }
  };

  const handleFaviconUpload = async (file: File | null) => {
    clearUploadFeedback();
    if (!file) return;

    if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
      setUploadError(
        `Image is too large. Keep it under ${formatMegabytes(MAX_IMAGE_UPLOAD_BYTES)} for reliable local save.`,
      );
      return;
    }

    try {
      const dataUrl = await readFileAsDataUrl(file);
      updateDashboardBrowser('faviconUrl', dataUrl);
      setUploadMessage(`Favicon file "${file.name}" uploaded successfully.`);
    } catch {
      setUploadError('Could not read the selected favicon file.');
    }
  };

  const stats = useMemo(() => {
    const inboxItems = siteConfig.dashboard.inbox.items;
    return {
      projects: siteConfig.projects.length,
      testimonials: siteConfig.testimonials.length,
      navItems: siteConfig.persistentUI.navItems.length,
      articles: siteConfig.articles.length,
      publishedArticles: siteConfig.articles.filter((item) => item.status === 'published').length,
      inboxTotal: inboxItems.length,
      inboxUnread: inboxItems.filter((item) => item.status === 'new').length,
      inboxArchived: inboxItems.filter((item) => item.status === 'archived').length,
      gaConnected:
        siteConfig.dashboard.integrations.googleAnalyticsEnabled &&
        siteConfig.dashboard.integrations.googleAnalyticsMeasurementId.trim().length > 0,
      partners: siteConfig.partners.length,
      personalProjects: siteConfig.personalProjects.length,
      socialAccounts: siteConfig.socialAccounts.length,
      financialTransactions: siteConfig.financialTransactions.length,
      notes: siteConfig.notes.length,
      aiTracking: siteConfig.aiTracking.length,
      emails: siteConfig.emails.length,
    };
  }, [siteConfig]);

  const activeSectionInfo =
    DASHBOARD_SECTIONS.find((section) => section.id === activeSection) ?? DASHBOARD_SECTIONS[0];

  const activeWorkspaceInfo =
    DASHBOARD_WORKSPACES.find((workspace) => workspace.id === activeWorkspace) ?? DASHBOARD_WORKSPACES[0];

  const compactMonthlyVisitors =
    siteConfig.dashboard.analytics.monthlyVisitors >= 1000
      ? `${(siteConfig.dashboard.analytics.monthlyVisitors / 1000).toFixed(1)}k`
      : `${siteConfig.dashboard.analytics.monthlyVisitors}`;

  const currentDateLabel = new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  const dashboardLogoSrc = DASHBOARD_LOGO_FALLBACK_SRC;
  const dashboardLogoAlt = siteConfig.persistentUI.logoAlt || 'Studio Logo';

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== DASHBOARD_PASSWORD) {
      setAuthError('Wrong password');
      return;
    }

    setAuthError('');
    setIsUnlocked(true);
    if (typeof window !== 'undefined') {
      window.sessionStorage.setItem(DASHBOARD_AUTH_KEY, 'ok');
    }
  };

  const handleLogout = () => {
    setIsUnlocked(false);
    setPassword('');
    setAuthError('');
    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(DASHBOARD_AUTH_KEY);
    }
  };

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'sequence':
        return (
          <div className="grid gap-5 2xl:grid-cols-2">
            <Card title="Cinematic Sequence" subtitle="Control scene handoff from About to Projects">
              <div className="grid gap-4 xl:grid-cols-2">
                <Input
                  label="Wheel intensity"
                  type="number"
                  min={0.00002}
                  max={0.0003}
                  step={0.00001}
                  value={siteConfig.cinematicSequence.scroll.wheelIntensity}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      cinematicSequence: {
                        ...prev.cinematicSequence,
                        scroll: {
                          ...prev.cinematicSequence.scroll,
                          wheelIntensity: toSafeNumberInRange(
                            next,
                            prev.cinematicSequence.scroll.wheelIntensity,
                            0.00002,
                            0.0003,
                          ),
                        },
                      },
                    }))
                  }
                />
                <Input
                  label="Max wheel delta"
                  type="number"
                  min={10}
                  max={200}
                  step={1}
                  value={siteConfig.cinematicSequence.scroll.maxWheelDelta}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      cinematicSequence: {
                        ...prev.cinematicSequence,
                        scroll: {
                          ...prev.cinematicSequence.scroll,
                          maxWheelDelta: toSafeNumberInRange(
                            next,
                            prev.cinematicSequence.scroll.maxWheelDelta,
                            10,
                            200,
                          ),
                        },
                      },
                    }))
                  }
                />
                <Input
                  label="Smoothing duration (ms)"
                  type="number"
                  min={120}
                  max={2400}
                  step={20}
                  value={siteConfig.cinematicSequence.scroll.smoothDurationMs}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      cinematicSequence: {
                        ...prev.cinematicSequence,
                        scroll: {
                          ...prev.cinematicSequence.scroll,
                          smoothDurationMs: toSafeNumberInRange(
                            next,
                            prev.cinematicSequence.scroll.smoothDurationMs,
                            120,
                            2400,
                          ),
                        },
                      },
                    }))
                  }
                />
                <Input
                  label="Momentum damping"
                  type="number"
                  min={0.6}
                  max={0.98}
                  step={0.01}
                  value={siteConfig.cinematicSequence.scroll.momentumDamping}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      cinematicSequence: {
                        ...prev.cinematicSequence,
                        scroll: {
                          ...prev.cinematicSequence.scroll,
                          momentumDamping: toSafeNumberInRange(
                            next,
                            prev.cinematicSequence.scroll.momentumDamping,
                            0.6,
                            0.98,
                          ),
                        },
                      },
                    }))
                  }
                />
                <Input
                  label="Touch multiplier"
                  type="number"
                  min={0.5}
                  max={6}
                  step={0.1}
                  value={siteConfig.cinematicSequence.scroll.touchMultiplier}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      cinematicSequence: {
                        ...prev.cinematicSequence,
                        scroll: {
                          ...prev.cinematicSequence.scroll,
                          touchMultiplier: toSafeNumberInRange(
                            next,
                            prev.cinematicSequence.scroll.touchMultiplier,
                            0.5,
                            6,
                          ),
                        },
                      },
                    }))
                  }
                />
                <Input
                  label="Keyboard step"
                  type="number"
                  min={0.02}
                  max={0.2}
                  step={0.01}
                  value={siteConfig.cinematicSequence.scroll.keyboardStep}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      cinematicSequence: {
                        ...prev.cinematicSequence,
                        scroll: {
                          ...prev.cinematicSequence.scroll,
                          keyboardStep: toSafeNumberInRange(
                            next,
                            prev.cinematicSequence.scroll.keyboardStep,
                            0.02,
                            0.2,
                          ),
                        },
                      },
                    }))
                  }
                />
                <Input
                  label="Input cooldown (ms)"
                  type="number"
                  min={0}
                  max={3000}
                  step={20}
                  value={siteConfig.cinematicSequence.scroll.inputCooldownMs}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      cinematicSequence: {
                        ...prev.cinematicSequence,
                        scroll: {
                          ...prev.cinematicSequence.scroll,
                          inputCooldownMs: toSafeNumberInRange(
                            next,
                            prev.cinematicSequence.scroll.inputCooldownMs,
                            0,
                            3000,
                          ),
                        },
                      },
                    }))
                  }
                />
              </div>

              <Input
                label="Pause before portfolio reveal (ms)"
                type="number"
                min={0}
                max={6000}
                step={50}
                value={siteConfig.cinematicSequence.scene06PauseMs}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    cinematicSequence: {
                      ...prev.cinematicSequence,
                      scene06PauseMs: toSafeNumberInRange(next, prev.cinematicSequence.scene06PauseMs, 0, 6000),
                    },
                  }))
                }
              />

              <p className="rounded-[10px] border border-[#e5e7eb] p-3 text-sm text-[#1a1a1a]">
                Tune hero scroll sensitivity, touch feel, easing, and input cooldown when moving between cinematic frames. Pause timing still controls how long the About closet holds before the Projects reveal.
              </p>
            </Card>

            <Card title="Portal Frame Window" subtitle="Edit the first-scene window size, offsets, and matte tone">
              <div className="grid gap-4 xl:grid-cols-2">
                <Input
                  label="Top offset mobile (px)"
                  type="number"
                  min={0}
                  max={360}
                  step={1}
                  value={siteConfig.globalFrame.topOffsetMobilePx}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      globalFrame: {
                        ...prev.globalFrame,
                        topOffsetMobilePx: toSafeNumberInRange(next, prev.globalFrame.topOffsetMobilePx, 0, 360),
                      },
                    }))
                  }
                />
                <Input
                  label="Top offset desktop (px)"
                  type="number"
                  min={0}
                  max={500}
                  step={1}
                  value={siteConfig.globalFrame.topOffsetDesktopPx}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      globalFrame: {
                        ...prev.globalFrame,
                        topOffsetDesktopPx: toSafeNumberInRange(next, prev.globalFrame.topOffsetDesktopPx, 0, 500),
                      },
                    }))
                  }
                />
                <Input
                  label="Bottom offset mobile (px)"
                  type="number"
                  min={0}
                  max={300}
                  step={1}
                  value={siteConfig.globalFrame.bottomOffsetMobilePx}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      globalFrame: {
                        ...prev.globalFrame,
                        bottomOffsetMobilePx: toSafeNumberInRange(next, prev.globalFrame.bottomOffsetMobilePx, 0, 300),
                      },
                    }))
                  }
                />
                <Input
                  label="Bottom offset desktop (px)"
                  type="number"
                  min={0}
                  max={360}
                  step={1}
                  value={siteConfig.globalFrame.bottomOffsetDesktopPx}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      globalFrame: {
                        ...prev.globalFrame,
                        bottomOffsetDesktopPx: toSafeNumberInRange(next, prev.globalFrame.bottomOffsetDesktopPx, 0, 360),
                      },
                    }))
                  }
                />
                <Input
                  label="Side offset mobile (px)"
                  type="number"
                  min={0}
                  max={220}
                  step={1}
                  value={siteConfig.globalFrame.sideOffsetMobilePx}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      globalFrame: {
                        ...prev.globalFrame,
                        sideOffsetMobilePx: toSafeNumberInRange(next, prev.globalFrame.sideOffsetMobilePx, 0, 220),
                      },
                    }))
                  }
                />
                <Input
                  label="Side offset desktop (px)"
                  type="number"
                  min={0}
                  max={300}
                  step={1}
                  value={siteConfig.globalFrame.sideOffsetDesktopPx}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      globalFrame: {
                        ...prev.globalFrame,
                        sideOffsetDesktopPx: toSafeNumberInRange(next, prev.globalFrame.sideOffsetDesktopPx, 0, 300),
                      },
                    }))
                  }
                />
                <Input
                  label="Top radius mobile (px)"
                  type="number"
                  min={8}
                  max={240}
                  step={1}
                  value={siteConfig.globalFrame.topRadiusMobilePx}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      globalFrame: {
                        ...prev.globalFrame,
                        topRadiusMobilePx: toSafeNumberInRange(next, prev.globalFrame.topRadiusMobilePx, 8, 240),
                      },
                    }))
                  }
                />
                <Input
                  label="Top radius desktop (px)"
                  type="number"
                  min={8}
                  max={320}
                  step={1}
                  value={siteConfig.globalFrame.topRadiusDesktopPx}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      globalFrame: {
                        ...prev.globalFrame,
                        topRadiusDesktopPx: toSafeNumberInRange(next, prev.globalFrame.topRadiusDesktopPx, 8, 320),
                      },
                    }))
                  }
                />
                <Input
                  label="Bottom radius (px)"
                  type="number"
                  min={0}
                  max={120}
                  step={1}
                  value={siteConfig.globalFrame.bottomRadiusPx}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      globalFrame: {
                        ...prev.globalFrame,
                        bottomRadiusPx: toSafeNumberInRange(next, prev.globalFrame.bottomRadiusPx, 0, 120),
                      },
                    }))
                  }
                />
                <Input
                  label="Matte color"
                  value={siteConfig.globalFrame.matteColor}
                  onChange={(next) =>
                    updateConfig((prev) => ({
                      ...prev,
                      globalFrame: {
                        ...prev.globalFrame,
                        matteColor: next,
                      },
                    }))
                  }
                />
              </div>
            </Card>
          </div>
        );

      case 'intro':
        return (
          <div className="grid gap-4">
            <Card title="Intro Text" subtitle="Glowing headline and scroll prompt">
              <Textarea
                label="Primary headline"
                value={siteConfig.introText}
                rows={4}
                onChange={(next) => updateConfig((prev) => ({ ...prev, introText: next }))}
              />
              <Input
                label="Scroll prompt"
                value={siteConfig.introScrollPrompt}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, introScrollPrompt: next }))
                }
              />
              <Input
                label="Backdrop color"
                value={siteConfig.introOverlayBackdropColor}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, introOverlayBackdropColor: next }))
                }
              />
              <Input
                label="Backdrop opacity"
                type="number"
                min={0}
                max={0.95}
                step={0.05}
                value={siteConfig.introOverlayBackdropOpacity}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    introOverlayBackdropOpacity: toSafeNumberInRange(next, 0.6, 0, 0.95),
                  }))
                }
              />
            </Card>
          </div>
        );

      case 'featured':
        return (
          <div className="grid gap-4">
            <Card title="Featured Section" subtitle="Headline, labels, CTA text">
              <Input
                label="Title line 1"
                value={siteConfig.featured.titleLine1}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, featured: { ...prev.featured, titleLine1: next } }))
                }
              />
              <Input
                label="Title line 2"
                value={siteConfig.featured.titleLine2}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, featured: { ...prev.featured, titleLine2: next } }))
                }
              />
              <Textarea
                label="Section description"
                value={siteConfig.featured.description}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, featured: { ...prev.featured, description: next } }))
                }
              />
              <Input
                label="Case Study button label"
                value={siteConfig.featured.caseStudyLabel}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, featured: { ...prev.featured, caseStudyLabel: next } }))
                }
              />
              <Input
                label="Live button label"
                value={siteConfig.featured.liveLabel}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, featured: { ...prev.featured, liveLabel: next } }))
                }
              />
              <Input
                label="View All button label"
                value={siteConfig.featured.viewAllLabel}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, featured: { ...prev.featured, viewAllLabel: next } }))
                }
              />
              <Input
                label="CTA title line 1"
                value={siteConfig.featured.ctaTitleLine1}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, featured: { ...prev.featured, ctaTitleLine1: next } }))
                }
              />
              <Input
                label="CTA title line 2"
                value={siteConfig.featured.ctaTitleLine2}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, featured: { ...prev.featured, ctaTitleLine2: next } }))
                }
              />
              <Textarea
                label="CTA description"
                value={siteConfig.featured.ctaDescription}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, featured: { ...prev.featured, ctaDescription: next } }))
                }
              />
              <Input
                label="CTA button text"
                value={siteConfig.featured.ctaButtonText}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, featured: { ...prev.featured, ctaButtonText: next } }))
                }
              />
              <Input
                label="CTA button link"
                value={siteConfig.featured.ctaButtonHref}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, featured: { ...prev.featured, ctaButtonHref: next } }))
                }
              />

              <div className="space-y-3 rounded-[12px] border border-[#e5e7eb] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">
                  Style mapping for this section
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  <CardVariantPicker
                    label="Project card type"
                    value={siteConfig.designSystem.components.featuredProjectCardVariant}
                    glassVariant={siteConfig.designSystem.components.globalGlassVariant}
                    onChange={(next) =>
                      updateDesignComponent('featuredProjectCardVariant', next as SiteCardVariant)
                    }
                  />
                  <ButtonVariantPicker
                    label="Project link buttons"
                    value={siteConfig.designSystem.components.featuredProjectButtonVariant}
                    onChange={(next) =>
                      updateDesignComponent('featuredProjectButtonVariant', next as SiteButtonVariant)
                    }
                    sampleText={siteConfig.featured.caseStudyLabel || 'Case Study'}
                  />
                  <ButtonVariantPicker
                    label="View All button"
                    value={siteConfig.designSystem.components.featuredViewAllButtonVariant}
                    onChange={(next) =>
                      updateDesignComponent('featuredViewAllButtonVariant', next as SiteButtonVariant)
                    }
                    sampleText={siteConfig.featured.viewAllLabel || 'View All'}
                  />
                  <ButtonVariantPicker
                    label="CTA button"
                    value={siteConfig.designSystem.components.featuredCtaButtonVariant}
                    onChange={(next) => updateDesignComponent('featuredCtaButtonVariant', next as SiteButtonVariant)}
                    sampleText={siteConfig.featured.ctaButtonText || 'Start Project'}
                  />
                </div>
              </div>
            </Card>
          </div>
        );

      case 'projects':
        return (
          <div className="grid gap-4">
            <Card title="Projects" subtitle="Edit, add, remove cards + upload images">
              <p className="text-xs text-[#6b7280]">
                You can upload image files directly. For local storage reliability keep each image under{' '}
                {formatMegabytes(MAX_IMAGE_UPLOAD_BYTES)}.
              </p>

              {siteConfig.projects.map((project) => (
                <div key={project.id} className={listItemClass}>
                  <div className="overflow-hidden rounded-[10px] border border-[#e5e7eb]">
                    <img src={project.img} alt={project.title} className="h-40 w-full object-cover" />
                  </div>

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">
                      Upload project image
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        e.currentTarget.value = '';
                        void handleProjectImageUpload(project, file);
                      }}
                      className="rounded-[10px] border border-[#e5e7eb] p-2"
                    />
                  </label>

                  <Input
                    label="Title"
                    value={project.title}
                    onChange={(next) => updateProject(project.id, (item) => ({ ...item, title: next }))}
                  />
                  <Toggle
                    label="Visible on site"
                    checked={project.visible}
                    onChange={(next) => updateProject(project.id, (item) => ({ ...item, visible: next }))}
                  />
                  <Textarea
                    label="Tags"
                    value={project.tags}
                    rows={2}
                    onChange={(next) => updateProject(project.id, (item) => ({ ...item, tags: next }))}
                  />
                  <Input
                    label="Image path / data URL"
                    value={project.img}
                    onChange={(next) => updateProject(project.id, (item) => ({ ...item, img: next }))}
                  />
                  <Input
                    label="Case Study URL"
                    value={project.behance}
                    onChange={(next) => updateProject(project.id, (item) => ({ ...item, behance: next }))}
                  />
                  <Input
                    label="Live URL"
                    value={project.live}
                    onChange={(next) => updateProject(project.id, (item) => ({ ...item, live: next }))}
                  />
                  <label className="flex flex-col gap-2">
                    <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-[#111217]/70">Button Type</span>
                    <select
                      value={project.buttonType}
                      onChange={(e) => updateProject(project.id, (item) => ({ ...item, buttonType: e.target.value as 'live' | 'caseStudy' }))}
                      className="rounded-[10px] border border-[#111217]/14 bg-[#111217]/25 px-3 py-2 text-[13px] text-[#111217] outline-none transition-all focus:border-[#111217]/36 focus:ring-2 focus:ring-[#111217]/12"
                    >
                      <option value="live">Live App</option>
                      <option value="caseStudy">Case Study</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      updateConfig((prev) => ({
                        ...prev,
                        projects: prev.projects.filter((item) => item.id !== project.id),
                      }));
                    }}
                    className="rounded-[8px] border border-[#111217]/20 bg-[#111217]/6 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#111217] hover:bg-[#111217]/10"
                  >
                    Remove Project
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const nextProject: SiteProject = {
                    id: `project-${Date.now()}`,
                    title: 'New Project',
                    tags: 'WEB • DESIGN',
                    img: '/frames/scene-02-desk-focus/ezgif-frame-001.jpg',
                    behance: '#',
                    live: '#',
                    buttonType: 'live',
                    visible: true,
                  };
                  updateConfig((prev) => ({
                    ...prev,
                    projects: [...prev.projects, nextProject],
                  }));
                }}
                className="rounded-[8px] border border-[#e5e7eb] px-3 py-2 text-sm"
              >
                Add Project
              </button>
            </Card>
          </div>
        );

      case 'timeline':
        return (
          <div className="grid gap-4">
            <Card title="Timeline Section Labels" subtitle="Headings shown above the timeline">
              <Input
                label="Section eyebrow"
                value={siteConfig.timelineSection.eyebrow}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    timelineSection: { ...prev.timelineSection, eyebrow: next },
                  }))
                }
              />
              <Input
                label="Section title"
                value={siteConfig.timelineSection.title}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    timelineSection: { ...prev.timelineSection, title: next },
                  }))
                }
              />
            </Card>

            <Card title="Experience Marquee" subtitle="Ticker labels shown before the timeline">
              {siteConfig.experienceMarquee.map((item) => (
                <div key={item.id} className={listItemClass}>
                  <SelectInput
                    label="Item type"
                    value={item.type}
                    options={[
                      { value: 'text', label: 'Text' },
                      { value: 'logo', label: 'Logo URL' },
                    ]}
                    onChange={(next) =>
                      updateExperienceMarqueeItem(item.id, (prev) => ({
                        ...prev,
                        type: next === 'logo' ? 'logo' : 'text',
                      }))
                    }
                  />
                  <Input
                    label={item.type === 'logo' ? 'Logo URL' : 'Label text'}
                    value={item.value}
                    onChange={(next) => updateExperienceMarqueeItem(item.id, (prev) => ({ ...prev, value: next }))}
                  />
                  <Toggle
                    label="Visible"
                    checked={item.visible}
                    onChange={(next) =>
                      updateExperienceMarqueeItem(item.id, (prev) => ({ ...prev, visible: next }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig((prev) => ({
                        ...prev,
                        experienceMarquee: prev.experienceMarquee.filter((entry) => entry.id !== item.id),
                      }));
                    }}
                    className="rounded-[8px] border border-[#111217]/20 bg-[#111217]/6 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#111217] hover:bg-[#111217]/10"
                  >
                    Remove
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const newItem: SiteExperienceMarqueeItem = {
                    id: `xp-${Date.now()}`,
                    type: 'text',
                    value: 'New Experience',
                    visible: true,
                  };
                  updateConfig((prev) => ({
                    ...prev,
                    experienceMarquee: [...prev.experienceMarquee, newItem],
                  }));
                }}
                className="rounded-[8px] border border-[#e5e7eb] px-3 py-2 text-sm"
              >
                Add Experience Label
              </button>
            </Card>

            <Card title="Journey Timeline" subtitle="Edit vertical timeline events">
              {siteConfig.journeyTimeline.map((event) => (
                <div key={event.id} className={listItemClass}>
                  <Input
                    label="Role"
                    value={event.role}
                    onChange={(next) => updateTimelineEvent(event.id, (item) => ({ ...item, role: next }))}
                  />
                  <Input
                    label="Company / Title"
                    value={event.title}
                    onChange={(next) => updateTimelineEvent(event.id, (item) => ({ ...item, title: next }))}
                  />
                  <Input
                    label="Date / Period"
                    value={event.date}
                    onChange={(next) => updateTimelineEvent(event.id, (item) => ({ ...item, date: next }))}
                  />
                  <Textarea
                    label="Description"
                    value={event.description}
                    rows={3}
                    onChange={(next) => updateTimelineEvent(event.id, (item) => ({ ...item, description: next }))}
                  />
                  <div className="flex items-center justify-between gap-4 mt-2">
                    <Toggle
                      label="Visible"
                      checked={event.visible}
                      onChange={(next) => updateTimelineEvent(event.id, (item) => ({ ...item, visible: next }))}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        updateConfig((prev) => ({
                          ...prev,
                          journeyTimeline: prev.journeyTimeline.filter((item) => item.id !== event.id),
                        }));
                      }}
                      className="rounded-[8px] border border-[#111217]/20 bg-[#111217]/6 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#111217] hover:bg-[#111217]/10"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => {
                  const newEvent: SiteTimelineEvent = {
                    id: `timeline-${Date.now()}`,
                    title: 'New Company',
                    role: 'New Role',
                    date: 'Present',
                    description: 'Role description',
                    visible: true,
                  };
                  updateConfig((prev) => ({
                    ...prev,
                    journeyTimeline: [...prev.journeyTimeline, newEvent],
                  }));
                }}
                className="rounded-[8px] border border-[#e5e7eb] px-3 py-2 text-sm"
              >
                Add Timeline Event
              </button>
            </Card>
          </div>
        );

      case 'testimonials':
        return (
          <div className="grid gap-4">
            <Card title="Testimonials" subtitle="Edit slider content">
              {siteConfig.testimonials.map((testimonial) => (
                <div key={testimonial.id} className={listItemClass}>
                  <Input
                    label="Name"
                    value={testimonial.name}
                    onChange={(next) => updateTestimonial(testimonial.id, (item) => ({ ...item, name: next }))}
                  />
                  <Toggle
                    label="Visible on site"
                    checked={testimonial.visible}
                    onChange={(next) => updateTestimonial(testimonial.id, (item) => ({ ...item, visible: next }))}
                  />
                  <Input
                    label="Title"
                    value={testimonial.title}
                    onChange={(next) => updateTestimonial(testimonial.id, (item) => ({ ...item, title: next }))}
                  />
                  <Textarea
                    label="Quote"
                    value={testimonial.quote}
                    rows={4}
                    onChange={(next) => updateTestimonial(testimonial.id, (item) => ({ ...item, quote: next }))}
                  />
                  <Input
                    label="Avatar URL"
                    value={testimonial.avatar}
                    onChange={(next) => updateTestimonial(testimonial.id, (item) => ({ ...item, avatar: next }))}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig((prev) => ({
                        ...prev,
                        testimonials: prev.testimonials.filter((item) => item.id !== testimonial.id),
                      }));
                    }}
                    className="rounded-[8px] border border-[#111217]/20 bg-[#111217]/6 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#111217] hover:bg-[#111217]/10"
                  >
                    Remove Testimonial
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const nextTestimonial: SiteTestimonial = {
                    id: `testimonial-${Date.now()}`,
                    name: 'New Name',
                    title: 'New Title',
                    quote: 'New quote',
                    avatar: 'https://i.pravatar.cc/150?u=new',
                    visible: true,
                  };
                  updateConfig((prev) => ({
                    ...prev,
                    testimonials: [...prev.testimonials, nextTestimonial],
                  }));
                }}
                className="rounded-[8px] border border-[#e5e7eb] px-3 py-2 text-sm"
              >
                Add Testimonial
              </button>

              <ButtonVariantPicker
                label="Testimonials pagination button type"
                value={siteConfig.designSystem.components.testimonialsPaginationButtonVariant}
                onChange={(next) =>
                  updateDesignComponent('testimonialsPaginationButtonVariant', next as SiteButtonVariant)
                }
                tone="light"
                sampleText="Dot Button"
              />
            </Card>
          </div>
        );

      case 'articlesPage':
        return (
          <div className="grid gap-4">
            <Card title="Articles Page Copy" subtitle="Control the global copy seen on /articles">
              <Input
                label="Page title"
                value={siteConfig.articlesPage.title}
                onChange={(next) => updateArticlesPageField('title', next)}
              />
              <Input
                label="Page subtitle"
                value={siteConfig.articlesPage.subtitle}
                onChange={(next) => updateArticlesPageField('subtitle', next)}
              />
              <Textarea
                label="Page description"
                value={siteConfig.articlesPage.description}
                rows={4}
                onChange={(next) => updateArticlesPageField('description', next)}
              />

              <div className="grid gap-3 rounded-[12px] border border-[#e5e7eb] p-3">
                <Input
                  label="Search placeholder"
                  value={siteConfig.articlesPage.searchPlaceholder}
                  onChange={(next) => updateArticlesPageField('searchPlaceholder', next)}
                />
                <Input
                  label="All topics filter label"
                  value={siteConfig.articlesPage.allTopicsLabel}
                  onChange={(next) => updateArticlesPageField('allTopicsLabel', next)}
                />
                <Input
                  label="Continue reading label"
                  value={siteConfig.articlesPage.continueReadingLabel}
                  onChange={(next) => updateArticlesPageField('continueReadingLabel', next)}
                />
                <Input
                  label="Reading time suffix"
                  value={siteConfig.articlesPage.minReadLabel}
                  onChange={(next) => updateArticlesPageField('minReadLabel', next)}
                />
                <Input
                  label="Byline prefix"
                  value={siteConfig.articlesPage.byAuthorPrefix}
                  onChange={(next) => updateArticlesPageField('byAuthorPrefix', next)}
                />
                <Input
                  label="Featured article badge"
                  value={siteConfig.articlesPage.featuredArticleLabel}
                  onChange={(next) => updateArticlesPageField('featuredArticleLabel', next)}
                />
              </div>

              <Input
                label="Latest articles label"
                value={siteConfig.articlesPage.latestArticlesLabel}
                onChange={(next) => updateArticlesPageField('latestArticlesLabel', next)}
              />

              <div className="grid gap-3 rounded-[12px] border border-[#e5e7eb] p-3">
                <Input
                  label="Undated fallback label"
                  value={siteConfig.articlesPage.undatedLabel}
                  onChange={(next) => updateArticlesPageField('undatedLabel', next)}
                />
                <Input
                  label="Videos section title"
                  value={siteConfig.articlesPage.videosSectionTitle}
                  onChange={(next) => updateArticlesPageField('videosSectionTitle', next)}
                />
                <Textarea
                  label="Videos section description"
                  value={siteConfig.articlesPage.videosSectionDescription}
                  rows={2}
                  onChange={(next) => updateArticlesPageField('videosSectionDescription', next)}
                />
                <Input
                  label="Related video label"
                  value={siteConfig.articlesPage.relatedVideoLabel}
                  onChange={(next) => updateArticlesPageField('relatedVideoLabel', next)}
                />
                <Input
                  label="Open video label"
                  value={siteConfig.articlesPage.openVideoLabel}
                  onChange={(next) => updateArticlesPageField('openVideoLabel', next)}
                />
                <Input
                  label="Watch video label"
                  value={siteConfig.articlesPage.watchVideoLabel}
                  onChange={(next) => updateArticlesPageField('watchVideoLabel', next)}
                />
                <Input
                  label="No thumbnail label"
                  value={siteConfig.articlesPage.noThumbnailLabel}
                  onChange={(next) => updateArticlesPageField('noThumbnailLabel', next)}
                />
              </div>

              <div className="grid gap-3 rounded-[12px] border border-[#e5e7eb] p-3">
                <Input
                  label="No results title"
                  value={siteConfig.articlesPage.noResultsTitle}
                  onChange={(next) => updateArticlesPageField('noResultsTitle', next)}
                />
                <Input
                  label="No results description"
                  value={siteConfig.articlesPage.noResultsDescription}
                  onChange={(next) => updateArticlesPageField('noResultsDescription', next)}
                />
                <Input
                  label="Previous page label"
                  value={siteConfig.articlesPage.previousPageLabel}
                  onChange={(next) => updateArticlesPageField('previousPageLabel', next)}
                />
                <Input
                  label="Next page label"
                  value={siteConfig.articlesPage.nextPageLabel}
                  onChange={(next) => updateArticlesPageField('nextPageLabel', next)}
                />
              </div>

              <div className="grid gap-3 rounded-[12px] border border-[#e5e7eb] p-3">
                <Input
                  label="Article not found title"
                  value={siteConfig.articlesPage.articleNotFoundTitle}
                  onChange={(next) => updateArticlesPageField('articleNotFoundTitle', next)}
                />
                <Input
                  label="Article not found description"
                  value={siteConfig.articlesPage.articleNotFoundDescription}
                  onChange={(next) => updateArticlesPageField('articleNotFoundDescription', next)}
                />
                <Input
                  label="Back to articles label"
                  value={siteConfig.articlesPage.backToArticlesLabel}
                  onChange={(next) => updateArticlesPageField('backToArticlesLabel', next)}
                />
              </div>

              <div className="grid gap-3 rounded-[12px] border border-[#e5e7eb] p-3">
                <Input
                  label="Newsletter title"
                  value={siteConfig.articlesPage.newsletterTitle}
                  onChange={(next) => updateArticlesPageField('newsletterTitle', next)}
                />
                <Input
                  label="Newsletter button label"
                  value={siteConfig.articlesPage.newsletterButtonLabel}
                  onChange={(next) => updateArticlesPageField('newsletterButtonLabel', next)}
                />
                <Input
                  label="Newsletter input placeholder"
                  value={siteConfig.articlesPage.newsletterInputPlaceholder}
                  onChange={(next) => updateArticlesPageField('newsletterInputPlaceholder', next)}
                />
                <Textarea
                  label="Newsletter description"
                  value={siteConfig.articlesPage.newsletterDescription}
                  rows={3}
                  onChange={(next) => updateArticlesPageField('newsletterDescription', next)}
                />
              </div>
            </Card>
          </div>
        );

      case 'navigation':
        return (
          <div className="grid gap-4 xl:grid-cols-2">
            <Card title="Music + CTA Button" subtitle="Audio upload and persistent controls">
              <p className="text-xs text-[#6b7280]">
                Upload an audio file for site music. Keep the file under {formatMegabytes(MAX_AUDIO_UPLOAD_BYTES)} so
                it can be saved reliably in browser storage.
              </p>

              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">
                  Upload music file
                </span>
                <input
                  type="file"
                  accept="audio/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    e.currentTarget.value = '';
                    void handleMusicUpload(file);
                  }}
                  className="rounded-[10px] border border-[#e5e7eb] p-2"
                />
              </label>

              <audio controls src={siteConfig.persistentUI.musicSrc} className="w-full" />

              <Input
                label="Music source URL / data URL"
                value={siteConfig.persistentUI.musicSrc}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    persistentUI: { ...prev.persistentUI, musicSrc: next },
                  }))
                }
              />
              <Input
                label="Music volume"
                type="number"
                min={0}
                max={1}
                step={0.01}
                value={siteConfig.persistentUI.musicVolume}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    persistentUI: {
                      ...prev.persistentUI,
                      musicVolume: toSafeNumber(next, prev.persistentUI.musicVolume),
                    },
                  }))
                }
              />
              <Input
                label="Music toggle aria label"
                value={siteConfig.persistentUI.musicToggleAriaLabel}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    persistentUI: { ...prev.persistentUI, musicToggleAriaLabel: next },
                  }))
                }
              />
              <Input
                label="Logo alt text"
                value={siteConfig.persistentUI.logoAlt}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    persistentUI: { ...prev.persistentUI, logoAlt: next },
                  }))
                }
              />
              <Input
                label="Logo source (light mode)"
                value={siteConfig.persistentUI.logoLightSrc}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    persistentUI: { ...prev.persistentUI, logoLightSrc: next },
                  }))
                }
              />
              <Input
                label="Logo source (dark mode)"
                value={siteConfig.persistentUI.logoDarkSrc}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    persistentUI: { ...prev.persistentUI, logoDarkSrc: next },
                  }))
                }
              />
              <Input
                label="Let's Talk label"
                value={siteConfig.persistentUI.letsTalkLabel}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    persistentUI: { ...prev.persistentUI, letsTalkLabel: next },
                  }))
                }
              />
              <Input
                label="Let's Talk link"
                value={siteConfig.persistentUI.letsTalkHref}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    persistentUI: { ...prev.persistentUI, letsTalkHref: next },
                  }))
                }
              />

              <div className="space-y-3 rounded-[12px] border border-[#e5e7eb] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">
                  Style mapping for navigation
                </p>
                <CardVariantPicker
                  label="Navigation glass card"
                  value={siteConfig.designSystem.components.navigationShellCardVariant}
                  glassVariant={siteConfig.designSystem.components.navigationGlassVariant}
                  onChange={(next) => updateDesignComponent('navigationShellCardVariant', next as SiteCardVariant)}
                />
                <GlassVariantPicker
                  label="Navigation glass type"
                  value={siteConfig.designSystem.components.navigationGlassVariant}
                  onChange={(next) => updateDesignComponent('navigationGlassVariant', next as SiteGlassVariant)}
                />
                <ButtonVariantPicker
                  label="Music toggle button"
                  value={siteConfig.designSystem.components.musicToggleButtonVariant}
                  onChange={(next) => updateDesignComponent('musicToggleButtonVariant', next as SiteButtonVariant)}
                  sampleText="Music"
                />
                <ButtonVariantPicker
                  label="Let's Talk button"
                  value={siteConfig.designSystem.components.persistentLetsTalkButtonVariant}
                  onChange={(next) =>
                    updateDesignComponent('persistentLetsTalkButtonVariant', next as SiteButtonVariant)
                  }
                  sampleText={siteConfig.persistentUI.letsTalkLabel || 'Let\'s Talk'}
                />
              </div>
            </Card>

            <Card title="Navigation Labels" subtitle="Desktop and mobile menu items">
              {siteConfig.persistentUI.navItems.map((item) => (
                <div key={item.id} className={listItemClass}>
                  <Input
                    label="Label"
                    value={item.label}
                    onChange={(next) => {
                      updateConfig((prev) => ({
                        ...prev,
                        persistentUI: {
                          ...prev.persistentUI,
                          navItems: prev.persistentUI.navItems.map((navItem) =>
                            navItem.id === item.id ? { ...navItem, label: next } : navItem,
                          ),
                        },
                      }));
                    }}
                  />

                  <Toggle
                    label="Visible on site"
                    checked={item.visible}
                    onChange={(next) => {
                      updateConfig((prev) => ({
                        ...prev,
                        persistentUI: {
                          ...prev.persistentUI,
                          navItems: prev.persistentUI.navItems.map((navItem) =>
                            navItem.id === item.id ? { ...navItem, visible: next } : navItem,
                          ),
                        },
                      }));
                    }}
                  />

                  <label className="flex flex-col gap-1.5">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">
                      Section
                    </span>
                    <select
                      value={item.section}
                      onChange={(e) => {
                        const nextSection = e.target.value;
                        if (!isValidSection(nextSection)) return;
                        updateConfig((prev) => ({
                          ...prev,
                          persistentUI: {
                            ...prev.persistentUI,
                            navItems: prev.persistentUI.navItems.map((navItem) =>
                              navItem.id === item.id ? { ...navItem, section: nextSection } : navItem,
                            ),
                          },
                        }));
                      }}
                      className="rounded-[10px] border border-[#e5e7eb] p-2"
                    >
                      <option value="home">home</option>
                      <option value="about">about</option>
                      <option value="projects">projects</option>
                      <option value="testimonials">testimonials</option>
                      <option value="articles">articles</option>
                    </select>
                  </label>

                  <button
                    type="button"
                    onClick={() => {
                      updateConfig((prev) => ({
                        ...prev,
                        persistentUI: {
                          ...prev.persistentUI,
                          navItems: prev.persistentUI.navItems.filter((navItem) => navItem.id !== item.id),
                        },
                      }));
                    }}
                    className="rounded-[8px] border border-[#111217]/20 bg-[#111217]/6 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#111217] hover:bg-[#111217]/10"
                  >
                    Remove Nav Item
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const nextNavItem: SiteNavItem = {
                    id: `nav-${Date.now()}`,
                    label: 'New Item',
                    section: 'home',
                    visible: true,
                  };
                  updateConfig((prev) => ({
                    ...prev,
                    persistentUI: {
                      ...prev.persistentUI,
                      navItems: [...prev.persistentUI.navItems, nextNavItem],
                    },
                  }));
                }}
                className="rounded-[8px] border border-[#e5e7eb] px-3 py-2 text-sm"
              >
                Add Nav Item
              </button>
            </Card>
          </div>
        );

      case 'footer':
        return (
          <div className="grid gap-4">
            <Card title="Footer + Social + Legal" subtitle="Email, address, links, socials">
              <Input
                label="Footer email"
                value={siteConfig.footer.email}
                onChange={(next) => updateConfig((prev) => ({ ...prev, footer: { ...prev.footer, email: next } }))}
              />

              <div className="space-y-2 rounded-[10px] border border-[#e5e7eb] p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">
                    Social Links
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      updateConfig((prev) => ({
                        ...prev,
                        footer: {
                          ...prev.footer,
                          socialLinks: [
                            ...prev.footer.socialLinks,
                            {
                              id: `social-${Date.now()}`,
                              label: 'New Social',
                              href: 'https://',
                              icon: 'globe',
                              visible: true,
                            },
                          ],
                        },
                      }));
                    }}
                    className="rounded-[8px] border border-[#e5e7eb] px-3 py-2 text-sm"
                  >
                    Add Social Link
                  </button>
                </div>

                {siteConfig.footer.socialLinks.map((link) => (
                  <div key={link.id} className="grid gap-2 rounded-[10px] border border-[#e5e7eb] p-3">
                    <Input
                      label="Label"
                      value={link.label}
                      onChange={(next) => {
                        updateConfig((prev) => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            socialLinks: prev.footer.socialLinks.map((item) =>
                              item.id === link.id ? { ...item, label: next } : item,
                            ),
                          },
                        }));
                      }}
                    />

                    <div className="grid gap-2 md:grid-cols-2">
                      <SelectInput
                        label="Icon"
                        value={link.icon}
                        options={SITE_SOCIAL_ICON_KEYS.map((iconKey) => ({
                          value: iconKey,
                          label: iconKey,
                        }))}
                        onChange={(next) => {
                          updateConfig((prev) => ({
                            ...prev,
                            footer: {
                              ...prev.footer,
                              socialLinks: prev.footer.socialLinks.map((item) =>
                                item.id === link.id
                                  ? {
                                      ...item,
                                      icon: next as SiteConfig['footer']['socialLinks'][number]['icon'],
                                    }
                                  : item,
                              ),
                            },
                          }));
                        }}
                      />

                      <Input
                        label="Href"
                        value={link.href}
                        onChange={(next) => {
                          updateConfig((prev) => ({
                            ...prev,
                            footer: {
                              ...prev.footer,
                              socialLinks: prev.footer.socialLinks.map((item) =>
                                item.id === link.id ? { ...item, href: next } : item,
                              ),
                            },
                          }));
                        }}
                      />
                    </div>

                    <div className="grid gap-2 md:grid-cols-2">
                      <Toggle
                        label="Visible"
                        checked={link.visible}
                        onChange={(next) => {
                          updateConfig((prev) => ({
                            ...prev,
                            footer: {
                              ...prev.footer,
                              socialLinks: prev.footer.socialLinks.map((item) =>
                                item.id === link.id ? { ...item, visible: next } : item,
                              ),
                            },
                          }));
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => {
                          updateConfig((prev) => ({
                            ...prev,
                            footer: {
                              ...prev.footer,
                              socialLinks: prev.footer.socialLinks.filter((item) => item.id !== link.id),
                            },
                          }));
                        }}
                        className="rounded-[10px] border border-[#111217]/20 bg-[#111217]/6 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#111217] hover:bg-[#111217]/10"
                      >
                        Remove Social Link
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <Input
                label="Office title"
                value={siteConfig.footer.officeTitle}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    footer: {
                      ...prev.footer,
                      officeTitle: next,
                    },
                  }))
                }
              />
              <Textarea
                label="Office address (line breaks supported)"
                value={siteConfig.footer.officeAddress}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    footer: {
                      ...prev.footer,
                      officeAddress: next,
                    },
                  }))
                }
              />
              <Input
                label="Copyright text"
                value={siteConfig.footer.copyrightText}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    footer: {
                      ...prev.footer,
                      copyrightText: next,
                    },
                  }))
                }
              />

              <div className="space-y-2 rounded-[10px] border border-[#e5e7eb] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">
                  Legal Links
                </p>
                {siteConfig.footer.legalLinks.map((link) => (
                  <div key={link.id} className="grid gap-2 md:grid-cols-2">
                    <Input
                      label="Label"
                      value={link.label}
                      onChange={(next) => {
                        updateConfig((prev) => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            legalLinks: prev.footer.legalLinks.map((item) =>
                              item.id === link.id ? { ...item, label: next } : item,
                            ),
                          },
                        }));
                      }}
                    />
                    <Input
                      label="Href"
                      value={link.href}
                      onChange={(next) => {
                        updateConfig((prev) => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            legalLinks: prev.footer.legalLinks.map((item) =>
                              item.id === link.id ? { ...item, href: next } : item,
                            ),
                          },
                        }));
                      }}
                    />
                    <Toggle
                      label="Visible"
                      checked={link.visible}
                      onChange={(next) => {
                        updateConfig((prev) => ({
                          ...prev,
                          footer: {
                            ...prev.footer,
                            legalLinks: prev.footer.legalLinks.map((item) =>
                              item.id === link.id ? { ...item, visible: next } : item,
                            ),
                          },
                        }));
                      }}
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-3 rounded-[10px] border border-[#e5e7eb] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">
                  Footer Navigation
                </p>
                <p className="text-xs text-[#6b7280]">
                  Footer navigation is synced automatically from the Navigation labels and sections, so links always match the top menu.
                </p>
                <button
                  type="button"
                  onClick={() => setActiveSection('navigation')}
                  className="rounded-[8px] border border-[#e5e7eb] px-3 py-2 text-sm"
                >
                  Edit Navigation Labels
                </button>
              </div>
            </Card>
          </div>
        );

      case 'visibility':
        return (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card title="Global Layers" subtitle="Master overlays and cross-page UI visibility">
              <Toggle
                label="Global frame overlay"
                checked={siteConfig.visibility.globalFrameOverlay}
                onChange={(next) => updateVisibility('globalFrameOverlay', next)}
              />
              <Toggle
                label="Cursor animation"
                checked={siteConfig.visibility.cursorAnimation}
                onChange={(next) => updateVisibility('cursorAnimation', next)}
              />
              <Toggle
                label="Intro overlay"
                checked={siteConfig.visibility.introOverlay}
                onChange={(next) => updateVisibility('introOverlay', next)}
              />
              <Toggle
                label="About card overlay (Scene 05)"
                checked={siteConfig.visibility.scene05Overlay}
                onChange={(next) => updateVisibility('scene05Overlay', next)}
              />
              <Toggle
                label="Persistent top bar"
                checked={siteConfig.visibility.persistentUI}
                onChange={(next) => updateVisibility('persistentUI', next)}
              />
            </Card>

            <Card title="Navigation Items" subtitle="Control each element inside the persistent top bar">
              <Toggle
                label="Navigation logo"
                checked={siteConfig.visibility.navigationLogo}
                onChange={(next) => updateVisibility('navigationLogo', next)}
              />
              <Toggle
                label="Navigation menu"
                checked={siteConfig.visibility.navigationMenu}
                onChange={(next) => updateVisibility('navigationMenu', next)}
              />
              <Toggle
                label="Music toggle"
                checked={siteConfig.visibility.musicToggle}
                onChange={(next) => updateVisibility('musicToggle', next)}
              />
              <Toggle
                label="Let's Talk button"
                checked={siteConfig.visibility.letsTalkButton}
                onChange={(next) => updateVisibility('letsTalkButton', next)}
              />
            </Card>

            <Card title="Featured Section" subtitle="Main portfolio scene visibility controls">
              <Toggle
                label="Featured section container"
                checked={siteConfig.visibility.featuredWork}
                onChange={(next) => updateVisibility('featuredWork', next)}
              />
              <Toggle
                label="Featured header"
                checked={siteConfig.visibility.featuredHeader}
                onChange={(next) => updateVisibility('featuredHeader', next)}
              />
              <Toggle
                label="Projects grid"
                checked={siteConfig.visibility.featuredProjectsGrid}
                onChange={(next) => updateVisibility('featuredProjectsGrid', next)}
              />
              <Toggle
                label="View all button"
                checked={siteConfig.visibility.featuredViewAllButton}
                onChange={(next) => updateVisibility('featuredViewAllButton', next)}
              />
              <Toggle
                label="Testimonials block"
                checked={siteConfig.visibility.testimonialsSection}
                onChange={(next) => updateVisibility('testimonialsSection', next)}
              />
              <Toggle
                label="Experience marquee"
                checked={siteConfig.visibility.experienceMarqueeSection}
                onChange={(next) => updateVisibility('experienceMarqueeSection', next)}
              />
              <Toggle
                label="Journey timeline"
                checked={siteConfig.visibility.journeyTimelineSection}
                onChange={(next) => updateVisibility('journeyTimelineSection', next)}
              />
              <Toggle
                label="CTA block"
                checked={siteConfig.visibility.featuredCtaSection}
                onChange={(next) => updateVisibility('featuredCtaSection', next)}
              />
            </Card>

            <Card title="Footer Internals" subtitle="Turn footer subsections on or off">
              <Toggle
                label="Footer container"
                checked={siteConfig.visibility.footer}
                onChange={(next) => updateVisibility('footer', next)}
              />
              <Toggle
                label="Footer email"
                checked={siteConfig.visibility.footerEmail}
                onChange={(next) => updateVisibility('footerEmail', next)}
              />
              <Toggle
                label="Footer social links"
                checked={siteConfig.visibility.footerSocialLinks}
                onChange={(next) => updateVisibility('footerSocialLinks', next)}
              />
              <Toggle
                label="Footer legal links"
                checked={siteConfig.visibility.footerLegalLinks}
                onChange={(next) => updateVisibility('footerLegalLinks', next)}
              />
              <Toggle
                label="Footer nav links"
                checked={siteConfig.visibility.footerNavLinks}
                onChange={(next) => updateVisibility('footerNavLinks', next)}
              />
              <Toggle
                label="Footer office info"
                checked={siteConfig.visibility.footerOffice}
                onChange={(next) => updateVisibility('footerOffice', next)}
              />
            </Card>
          </div>
        );

      case 'scene05':
        return (
          <div className="grid gap-4">
            <Card title="Storytelling Animations" subtitle="Control narrative animation style (WebGL-like) for About Me section">
                <div className="space-y-4">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-white text-sm font-bold flex flex-col">
                      Enable Storytelling
                      <span className="text-[#aeb4c0] text-xs font-normal font-sans">
                        Activate sequential text and card animations
                      </span>
                    </span>
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={siteConfig.scene05.animations?.enabled ?? true}
                      onChange={(e) =>
                        updateConfig((prev) => ({
                          ...prev,
                          scene05: {
                            ...prev.scene05,
                            animations: prev.scene05.animations 
                              ? { ...prev.scene05.animations, enabled: e.target.checked } 
                              : { enabled: e.target.checked, textRevealStyle: 'cinematic', cardEntranceStyle: 'creative' },
                          },
                        }))
                      }
                    />
                    <div
                      className={`relative w-10 h-6 rounded-full transition-colors ${
                        siteConfig.scene05.animations?.enabled ? 'bg-white' : 'bg-[#f8f9fa]'
                      }`}
                    >
                      <div
                        className={`absolute top-1 left-1 w-4 h-4 rounded-full transition-transform ${
                          siteConfig.scene05.animations?.enabled ? 'translate-x-4 bg-black' : 'translate-x-0 bg-[#f8f9fa]'
                        }`}
                      />
                    </div>
                  </label>

                  {siteConfig.scene05.animations?.enabled && (
                    <>
                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                          Text Reveal Style
                        </label>
                        <select
                          className="w-full bg-[#161a23] border border-[#e5e7eb] rounded-[8px] px-3 py-2 text-sm"
                          value={siteConfig.scene05.animations.textRevealStyle}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              scene05: {
                                ...prev.scene05,
                                animations: prev.scene05.animations
                                  ? { ...prev.scene05.animations, textRevealStyle: e.target.value as any }
                                  : { enabled: true, textRevealStyle: e.target.value as any, cardEntranceStyle: 'creative' },
                              },
                            }))
                          }
                        >
                          <option value="none">None</option>
                          <option value="fade-up">Fade Up</option>
                          <option value="cinematic">Cinematic Read</option>
                          <option value="glitch">Glitch</option>
                        </select>
                      </div>

                      <div className="flex flex-col gap-1">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-[#6b7280]">
                          Card Entrance Style
                        </label>
                        <select
                          className="w-full bg-[#161a23] border border-[#e5e7eb] rounded-[8px] px-3 py-2 text-sm"
                          value={siteConfig.scene05.animations.cardEntranceStyle}
                          onChange={(e) =>
                            updateConfig((prev) => ({
                              ...prev,
                              scene05: {
                                ...prev.scene05,
                                animations: prev.scene05.animations
                                  ? { ...prev.scene05.animations, cardEntranceStyle: e.target.value as any }
                                  : { enabled: true, textRevealStyle: 'cinematic', cardEntranceStyle: e.target.value as any },
                              },
                            }))
                          }
                        >
                          <option value="none">None</option>
                          <option value="stack">Stack Reveal</option>
                          <option value="stagger">Staggered Entrance</option>
                          <option value="creative">Creative Pop</option>
                        </select>
                      </div>
                    </>
                  )}
                </div>
            </Card>

            <Card title="About Page" subtitle="Edit full About content and certification cards">
              <Input
                label="Badge"
                value={siteConfig.scene05.badge}
                onChange={(next) => updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, badge: next } }))}
              />
              <Input
                label="Name"
                value={siteConfig.scene05.name}
                onChange={(next) => updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, name: next } }))}
              />
              <Input
                label="Role"
                value={siteConfig.scene05.role}
                onChange={(next) => updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, role: next } }))}
              />
              <Input
                label="Portrait image URL"
                value={siteConfig.scene05.portraitImage}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, portraitImage: next } }))
                }
              />
              <Input
                label="Portrait alt text"
                value={siteConfig.scene05.portraitAlt}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, portraitAlt: next } }))
                }
              />
              <Input
                label="Portrait caption"
                value={siteConfig.scene05.portraitCaption}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, portraitCaption: next } }))
                }
              />
              <Input
                label="Vision title"
                value={siteConfig.scene05.visionTitle}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, visionTitle: next } }))
                }
              />
              <Textarea
                label="Vision text"
                value={siteConfig.scene05.visionText}
                rows={4}
                onChange={(next) => updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, visionText: next } }))}
              />

              <Input
                label="Story title"
                value={siteConfig.scene05.storyTitle}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, storyTitle: next } }))
                }
              />

              <Textarea
                label="Story paragraphs (one per line)"
                value={siteConfig.scene05.storyParagraphs.join('\n')}
                rows={5}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    scene05: { ...prev.scene05, storyParagraphs: splitLines(next) },
                  }))
                }
              />

              <Input
                label="Skills title"
                value={siteConfig.scene05.skillsTitle}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, skillsTitle: next } }))
                }
              />
              <Textarea
                label="Skills (one per line)"
                value={siteConfig.scene05.skills.join('\n')}
                rows={4}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    scene05: { ...prev.scene05, skills: splitLines(next) },
                  }))
                }
              />
              <Input
                label="Certifications title"
                value={siteConfig.scene05.certificationsTitle}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, certificationsTitle: next } }))
                }
              />
              <Input
                label="Learning logos title"
                value={siteConfig.scene05.learningLogosTitle}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, learningLogosTitle: next } }))
                }
              />
              <Input
                label="Company logos title"
                value={siteConfig.scene05.companyLogosTitle}
                onChange={(next) =>
                  updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, companyLogosTitle: next } }))
                }
              />

              <Input
                label="Credential button label"
                value={siteConfig.scene05.credentialButtonLabel}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    scene05: { ...prev.scene05, credentialButtonLabel: next },
                  }))
                }
              />

              <div className="space-y-3 rounded-[12px] border border-[#e5e7eb] p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">
                  Certification cards
                </p>

                {siteConfig.scene05.featuredCertifications.map((item) => (
                  <div key={item.id} className={listItemClass}>
                    <Input
                      label="Certificate title"
                      value={item.title}
                      onChange={(next) =>
                        updateScene05Certification(item.id, (prev) => ({ ...prev, title: next }))
                      }
                    />

                    <div className="grid gap-3 md:grid-cols-2">
                      <Input
                        label="Issuer"
                        value={item.issuer}
                        onChange={(next) =>
                          updateScene05Certification(item.id, (prev) => ({ ...prev, issuer: next }))
                        }
                      />
                      <Input
                        label="Year"
                        value={item.year}
                        onChange={(next) =>
                          updateScene05Certification(item.id, (prev) => ({ ...prev, year: next }))
                        }
                      />
                    </div>

                    <Input
                      label="Credential URL"
                      value={item.credentialUrl}
                      onChange={(next) =>
                        updateScene05Certification(item.id, (prev) => ({ ...prev, credentialUrl: next }))
                      }
                    />

                    <Input
                      label="Badge / logo URL"
                      value={item.logoSrc}
                      onChange={(next) =>
                        updateScene05Certification(item.id, (prev) => ({ ...prev, logoSrc: next }))
                      }
                    />

                    <div className="flex items-center justify-between gap-4 mt-2">
                      <Toggle
                        label="Visible"
                        checked={item.visible}
                        onChange={(next) =>
                          updateScene05Certification(item.id, (prev) => ({ ...prev, visible: next }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig((prev) => ({
                            ...prev,
                            scene05: {
                              ...prev.scene05,
                              featuredCertifications: prev.scene05.featuredCertifications.filter(
                                (entry) => entry.id !== item.id,
                              ),
                            },
                          }));
                        }}
                        className="rounded-[8px] border border-[#111217]/20 bg-[#111217]/6 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#111217] hover:bg-[#111217]/10"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newCertification: SiteScene05Certification = {
                      id: `cert-${Date.now()}`,
                      title: 'New Certification',
                      issuer: 'Provider',
                      year: '2026',
                      credentialUrl: '#',
                      logoSrc: '',
                      visible: true,
                    };
                    updateConfig((prev) => ({
                      ...prev,
                      scene05: {
                        ...prev.scene05,
                        featuredCertifications: [...prev.scene05.featuredCertifications, newCertification],
                      },
                    }));
                  }}
                  className="rounded-[8px] border border-[#e5e7eb] bg-white px-3 py-2 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1a1a1a] transition-colors hover:bg-[#f8f9fa]"
                >
                  Add Certification Card
                </button>
              </div>

              <Textarea
                label="Certification highlights (one per line)"
                value={siteConfig.scene05.certifications.join('\n')}
                rows={4}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    scene05: { ...prev.scene05, certifications: splitLines(next) },
                  }))
                }
              />

              <div className="space-y-3 rounded-[12px] border border-[#e5e7eb] bg-white p-3">
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">Learning Logos</p>

                {siteConfig.scene05.learningLogos.map((item) => (
                  <div key={item.id} className={listItemClass}>
                    <Input
                      label="Name"
                      value={item.name}
                      onChange={(next) =>
                        updateScene05LogoItem('learningLogos', item.id, (prev) => ({ ...prev, name: next }))
                      }
                    />
                    <Input
                      label="Logo URL"
                      value={item.logoSrc}
                      onChange={(next) =>
                        updateScene05LogoItem('learningLogos', item.id, (prev) => ({ ...prev, logoSrc: next }))
                      }
                    />
                    <Input
                      label="Link URL"
                      value={item.href}
                      onChange={(next) =>
                        updateScene05LogoItem('learningLogos', item.id, (prev) => ({ ...prev, href: next }))
                      }
                    />

                    <div className="flex items-center justify-between gap-4 mt-2">
                      <Toggle
                        label="Visible"
                        checked={item.visible}
                        onChange={(next) =>
                          updateScene05LogoItem('learningLogos', item.id, (prev) => ({ ...prev, visible: next }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig((prev) => ({
                            ...prev,
                            scene05: {
                              ...prev.scene05,
                              learningLogos: prev.scene05.learningLogos.filter((entry) => entry.id !== item.id),
                            },
                          }));
                        }}
                        className="rounded-[8px] border border-[#111217]/20 bg-[#111217]/6 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#111217] hover:bg-[#111217]/10"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newLogo: SiteScene05LogoItem = {
                      id: `learning-${Date.now()}`,
                      name: 'New Learning Brand',
                      logoSrc: '',
                      href: '#',
                      visible: true,
                    };
                    updateConfig((prev) => ({
                      ...prev,
                      scene05: {
                        ...prev.scene05,
                        learningLogos: [...prev.scene05.learningLogos, newLogo],
                      },
                    }));
                  }}
                  className="rounded-[8px] border border-[#e5e7eb]
                >
                  Add Learning Logo
                </button>
              </div>

              <div className="space-y-3 rounded-[12px] border border-[#e5e7eb]
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]

                {siteConfig.scene05.companyLogos.map((item) => (
                  <div key={item.id} className={listItemClass}>
                    <Input
                      label="Name"
                      value={item.name}
                      onChange={(next) =>
                        updateScene05LogoItem('companyLogos', item.id, (prev) => ({ ...prev, name: next }))
                      }
                    />
                    <Input
                      label="Logo URL"
                      value={item.logoSrc}
                      onChange={(next) =>
                        updateScene05LogoItem('companyLogos', item.id, (prev) => ({ ...prev, logoSrc: next }))
                      }
                    />
                    <Input
                      label="Link URL"
                      value={item.href}
                      onChange={(next) =>
                        updateScene05LogoItem('companyLogos', item.id, (prev) => ({ ...prev, href: next }))
                      }
                    />

                    <div className="flex items-center justify-between gap-4 mt-2">
                      <Toggle
                        label="Visible"
                        checked={item.visible}
                        onChange={(next) =>
                          updateScene05LogoItem('companyLogos', item.id, (prev) => ({ ...prev, visible: next }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => {
                          updateConfig((prev) => ({
                            ...prev,
                            scene05: {
                              ...prev.scene05,
                              companyLogos: prev.scene05.companyLogos.filter((entry) => entry.id !== item.id),
                            },
                          }));
                        }}
                        className="rounded-[8px] border border-[#111217]/20 bg-[#111217]/6 px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#111217] hover:bg-[#111217]/10"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={() => {
                    const newLogo: SiteScene05LogoItem = {
                      id: `company-${Date.now()}`,
                      name: 'New Company',
                      logoSrc: '',
                      href: '#',
                      visible: true,
                    };
                    updateConfig((prev) => ({
                      ...prev,
                      scene05: {
                        ...prev.scene05,
                        companyLogos: [...prev.scene05.companyLogos, newLogo],
                      },
                    }));
                  }}
                  className="rounded-[8px] border border-[#e5e7eb]
                >
                  Add Company Logo
                </button>
              </div>

              <Input
                label="AI section title"
                value={siteConfig.scene05.aiTitle}
                onChange={(next) => updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, aiTitle: next } }))}
              />
              <Textarea
                label="AI section text"
                value={siteConfig.scene05.aiText}
                rows={4}
                onChange={(next) => updateConfig((prev) => ({ ...prev, scene05: { ...prev.scene05, aiText: next } }))}
              />
              <Textarea
                label="AI tags (one per line)"
                value={siteConfig.scene05.aiTags.join('\n')}
                rows={4}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    scene05: { ...prev.scene05, aiTags: splitLines(next) },
                  }))
                }
              />
              <Input
                label="Action label"
                value={siteConfig.scene05.actionLabel}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    scene05: { ...prev.scene05, actionLabel: next },
                  }))
                }
              />
              <Input
                label="Action link"
                value={siteConfig.scene05.actionHref}
                onChange={(next) =>
                  updateConfig((prev) => ({
                    ...prev,
                    scene05: { ...prev.scene05, actionHref: next },
                  }))
                }
              />

              <div className="space-y-3 rounded-[12px] border border-[#e5e7eb]
                <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                  Style mapping for Scene 05
                </p>
                <CardVariantPicker
                  label="About card type"
                  value={siteConfig.designSystem.components.scene05CardVariant}
                  glassVariant={siteConfig.designSystem.components.globalGlassVariant}
                  onChange={(next) => updateDesignComponent('scene05CardVariant', next as SiteCardVariant)}
                />
                <ButtonVariantPicker
                  label="Action button type"
                  value={siteConfig.designSystem.components.scene05ActionButtonVariant}
                  onChange={(next) => updateDesignComponent('scene05ActionButtonVariant', next as SiteButtonVariant)}
                  sampleText={siteConfig.scene05.actionLabel || 'Connect'}
                />
              </div>
            </Card>
          </div>
        );

      case 'designSystem':
        return (
          <div className="grid gap-4">
          <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            <Card title="Color Tokens" subtitle="Brand and surface colors used by all shared components">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Primary color"
                  type="color"
                    value={siteConfig.designSystem.theme.primaryColor}
                    onChange={(next) => updateDesignTheme('primaryColor', next)}
                  />
                  <Input
                    label="Secondary color"
                    type="color"
                    value={siteConfig.designSystem.theme.secondaryColor}
                    onChange={(next) => updateDesignTheme('secondaryColor', next)}
                  />
                  <Input
                    label="Text on primary"
                    type="color"
                    value={siteConfig.designSystem.theme.onPrimaryColor}
                    onChange={(next) => updateDesignTheme('onPrimaryColor', next)}
                  />
                  <Input
                    label="Text on secondary"
                    type="color"
                    value={siteConfig.designSystem.theme.onSecondaryColor}
                    onChange={(next) => updateDesignTheme('onSecondaryColor', next)}
                  />
                </div>

                <Input
                  label="Glass tint (rgba)"
                  value={siteConfig.designSystem.theme.glassTintColor}
                  onChange={(next) => updateDesignTheme('glassTintColor', next)}
                />
                <Input
                  label="Glass border color (rgba)"
                  value={siteConfig.designSystem.theme.glassBorderColor}
                  onChange={(next) => updateDesignTheme('glassBorderColor', next)}
                />

                <GlassVariantPicker
                  label="Global glass type"
                  value={siteConfig.designSystem.components.globalGlassVariant}
                  onChange={(next) => updateDesignComponent('globalGlassVariant', next as SiteGlassVariant)}
                />

                <div className="grid grid-cols-2 gap-2 rounded-[12px] border border-[#e5e7eb]
                  <div
                    className="rounded-[10px] border border-[#e5e7eb]
                    style={{ background: siteConfig.designSystem.theme.primaryColor, color: siteConfig.designSystem.theme.onPrimaryColor }}
                  >
                    Primary
                  </div>
                  <div
                    className="rounded-[10px] border border-[#e5e7eb]
                    style={{ background: siteConfig.designSystem.theme.secondaryColor, color: siteConfig.designSystem.theme.onSecondaryColor }}
                  >
                    Secondary
                  </div>
                </div>
              </Card>

              <Card title="Glow & Atmosphere" subtitle="Global halo across text and UI surfaces">
                <Toggle
                  label="Enable glow"
                  checked={siteConfig.designSystem.theme.glowEnabled}
                  onChange={(next) => updateDesignTheme('glowEnabled', next)}
                />
                <Input
                  label="Glow color"
                  value={siteConfig.designSystem.theme.glowColor}
                  onChange={(next) => updateDesignTheme('glowColor', next)}
                />
                <Input
                  label="Glow intensity"
                  type="number"
                  min={0}
                  max={1.2}
                  step={0.05}
                  value={siteConfig.designSystem.theme.glowIntensity}
                  onChange={(next) =>
                    updateDesignTheme('glowIntensity', toSafeNumberInRange(next, 0.55, 0, 1.2))
                  }
                />
                <p className="text-xs text-[#6b7280]
                  Applies a subtle cinematic halo to typography, buttons, cards, and glass surfaces.
                </p>
              </Card>

              <Card title="Typography Tokens" subtitle="Display/title/body sizing, rhythm and personality">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Heading scale"
                    type="number"
                    min={0.7}
                    max={1.8}
                    step={0.05}
                    value={siteConfig.designSystem.theme.headingScale}
                    onChange={(next) =>
                      updateDesignTheme('headingScale', toSafeNumberInRange(next, 1, 0.7, 1.8))
                    }
                  />
                  <Input
                    label="Display size (rem)"
                    type="number"
                    min={2.6}
                    max={12}
                    step={0.1}
                    value={siteConfig.designSystem.theme.displayTitleSizeRem}
                    onChange={(next) =>
                      updateDesignTheme('displayTitleSizeRem', toSafeNumberInRange(next, 8.4, 2.6, 12))
                    }
                  />
                  <Input
                    label="Section title size (rem)"
                    type="number"
                    min={1}
                    max={4}
                    step={0.05}
                    value={siteConfig.designSystem.theme.sectionTitleSizeRem}
                    onChange={(next) =>
                      updateDesignTheme('sectionTitleSizeRem', toSafeNumberInRange(next, 2.7, 1, 4))
                    }
                  />
                  <Input
                    label="Body size (rem)"
                    type="number"
                    min={0.75}
                    max={1.6}
                    step={0.02}
                    value={siteConfig.designSystem.theme.bodyTextSizeRem}
                    onChange={(next) =>
                      updateDesignTheme('bodyTextSizeRem', toSafeNumberInRange(next, 1.08, 0.75, 1.6))
                    }
                  />
                  <Input
                    label="Heading weight"
                    type="number"
                    min={300}
                    max={800}
                    step={10}
                    value={siteConfig.designSystem.theme.headingWeight}
                    onChange={(next) =>
                      updateDesignTheme('headingWeight', toSafeNumberInRange(next, 610, 300, 800))
                    }
                  />
                  <Input
                    label="Heading letter spacing (em)"
                    type="number"
                    min={-0.12}
                    max={0.2}
                    step={0.005}
                    value={siteConfig.designSystem.theme.headingLetterSpacingEm}
                  onChange={(next) =>
                    updateDesignTheme('headingLetterSpacingEm', toSafeNumberInRange(next, -0.02, -0.12, 0.2))
                  }
                />
                <Input
                  label="Eyebrow size (rem)"
                  type="number"
                  min={0.4}
                  max={1.4}
                  step={0.02}
                  value={siteConfig.designSystem.foundation.typography.eyebrowSizeRem}
                  onChange={(next) =>
                    updateFoundationTypography(
                      'eyebrowSizeRem',
                      toSafeNumberInRange(
                        next,
                        siteConfig.designSystem.foundation.typography.eyebrowSizeRem,
                        0.4,
                        1.4,
                      ),
                    )
                  }
                />
                <Input
                  label="Eyebrow letter spacing (em)"
                  type="number"
                  min={-0.1}
                  max={0.6}
                  step={0.01}
                  value={siteConfig.designSystem.foundation.typography.eyebrowLetterSpacingEm}
                  onChange={(next) =>
                    updateFoundationTypography(
                      'eyebrowLetterSpacingEm',
                      toSafeNumberInRange(
                        next,
                        siteConfig.designSystem.foundation.typography.eyebrowLetterSpacingEm,
                        -0.1,
                        0.6,
                      ),
                    )
                  }
                />
                <Input
                  label="Eyebrow weight"
                  type="number"
                  min={300}
                  max={900}
                  step={10}
                  value={siteConfig.designSystem.foundation.typography.eyebrowWeight}
                  onChange={(next) =>
                    updateFoundationTypography(
                      'eyebrowWeight',
                      toSafeNumberInRange(
                        next,
                        siteConfig.designSystem.foundation.typography.eyebrowWeight,
                        300,
                        900,
                      ),
                    )
                  }
                />
              </div>

              <Input
                label="Body line-height"
                type="number"
                  min={1.1}
                  max={2.2}
                  step={0.05}
                  value={siteConfig.designSystem.theme.bodyLineHeight}
                  onChange={(next) =>
                    updateDesignTheme('bodyLineHeight', toSafeNumberInRange(next, 1.6, 1.1, 2.2))
                  }
              />
            </Card>

            <Card title="Layout & Rhythm" subtitle="Control spacing scale, card padding, and max content width">
              <div className="grid gap-3 md:grid-cols-2">
                <Input
                  label="Section padding (rem)"
                  type="number"
                  min={1}
                  max={8}
                  step={0.1}
                  value={siteConfig.designSystem.foundation.spacing.sectionPaddingRem}
                  onChange={(next) =>
                    updateFoundationSpacing(
                      'sectionPaddingRem',
                      toSafeNumberInRange(next, siteConfig.designSystem.foundation.spacing.sectionPaddingRem, 1, 8),
                    )
                  }
                />
                <Input
                  label="Stack gap (rem)"
                  type="number"
                  min={0.4}
                  max={3}
                  step={0.05}
                  value={siteConfig.designSystem.foundation.spacing.stackGapRem}
                  onChange={(next) =>
                    updateFoundationSpacing(
                      'stackGapRem',
                      toSafeNumberInRange(next, siteConfig.designSystem.foundation.spacing.stackGapRem, 0.4, 3),
                    )
                  }
                />
                <Input
                  label="Grid gap (rem)"
                  type="number"
                  min={0.4}
                  max={3}
                  step={0.05}
                  value={siteConfig.designSystem.foundation.spacing.gridGapRem}
                  onChange={(next) =>
                    updateFoundationSpacing(
                      'gridGapRem',
                      toSafeNumberInRange(next, siteConfig.designSystem.foundation.spacing.gridGapRem, 0.4, 3),
                    )
                  }
                />
                <Input
                  label="Card padding (rem)"
                  type="number"
                  min={0.75}
                  max={3.5}
                  step={0.05}
                  value={siteConfig.designSystem.foundation.spacing.cardPaddingRem}
                  onChange={(next) =>
                    updateFoundationSpacing(
                      'cardPaddingRem',
                      toSafeNumberInRange(next, siteConfig.designSystem.foundation.spacing.cardPaddingRem, 0.75, 3.5),
                    )
                  }
                />
                <Input
                  label="Max content width (px)"
                  type="number"
                  min={960}
                  max={1920}
                  step={10}
                  value={siteConfig.designSystem.foundation.layout.contentMaxWidthPx}
                  onChange={(next) =>
                    updateFoundationLayout(
                      'contentMaxWidthPx',
                      toSafeNumberInRange(
                        next,
                        siteConfig.designSystem.foundation.layout.contentMaxWidthPx,
                        960,
                        1920,
                      ),
                    )
                  }
                />
                <Input
                  label="Column gap (rem)"
                  type="number"
                  min={0.5}
                  max={4}
                  step={0.05}
                  value={siteConfig.designSystem.foundation.layout.columnGapRem}
                  onChange={(next) =>
                    updateFoundationLayout(
                      'columnGapRem',
                      toSafeNumberInRange(next, siteConfig.designSystem.foundation.layout.columnGapRem, 0.5, 4),
                    )
                  }
                />
                <Input
                  label="Max grid columns"
                  type="number"
                  min={6}
                  max={18}
                  step={1}
                  value={siteConfig.designSystem.foundation.layout.maxGridColumns}
                  onChange={(next) =>
                    updateFoundationLayout(
                      'maxGridColumns',
                      toSafeNumberInRange(next, siteConfig.designSystem.foundation.layout.maxGridColumns, 6, 18),
                    )
                  }
                />
              </div>

              <p className="text-xs text-[#6b7280]
                These tokens drive the new ds-section, ds-stack, and ds-grid spacing classes so every page respects the same rhythm.
              </p>
            </Card>
          </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card title="Component Physics" subtitle="Radius, borders, blur and shadows for buttons/cards">
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Button radius (px)"
                    type="number"
                    min={2}
                    max={48}
                    step={1}
                    value={siteConfig.designSystem.theme.buttonRadius}
                    onChange={(next) =>
                      updateDesignTheme('buttonRadius', toSafeNumberInRange(next, 14, 2, 48))
                    }
                  />
                  <Input
                    label="Button border width (px)"
                    type="number"
                    min={0.5}
                    max={5}
                    step={0.1}
                    value={siteConfig.designSystem.theme.buttonBorderWidth}
                    onChange={(next) =>
                      updateDesignTheme('buttonBorderWidth', toSafeNumberInRange(next, 1, 0.5, 5))
                    }
                  />
                  <Input
                    label="Button shadow opacity"
                    type="number"
                    min={0}
                    max={0.65}
                    step={0.01}
                    value={siteConfig.designSystem.theme.buttonShadowOpacity}
                    onChange={(next) =>
                      updateDesignTheme('buttonShadowOpacity', toSafeNumberInRange(next, 0.08, 0, 0.65))
                    }
                  />
                  <Input
                    label="Card radius (px)"
                    type="number"
                    min={4}
                    max={64}
                    step={1}
                    value={siteConfig.designSystem.theme.cardRadius}
                    onChange={(next) =>
                      updateDesignTheme('cardRadius', toSafeNumberInRange(next, 18, 4, 64))
                    }
                  />
                  <Input
                    label="Card border width (px)"
                    type="number"
                    min={0.5}
                    max={5}
                    step={0.1}
                    value={siteConfig.designSystem.theme.cardBorderWidth}
                    onChange={(next) =>
                      updateDesignTheme('cardBorderWidth', toSafeNumberInRange(next, 1, 0.5, 5))
                    }
                  />
                  <Input
                    label="Card blur (px)"
                    type="number"
                    min={0}
                    max={40}
                    step={1}
                    value={siteConfig.designSystem.theme.cardBlurPx}
                    onChange={(next) =>
                      updateDesignTheme('cardBlurPx', toSafeNumberInRange(next, 18, 0, 40))
                    }
                  />
                  <Input
                    label="Card shadow opacity"
                    type="number"
                    min={0}
                    max={0.8}
                    step={0.01}
                    value={siteConfig.designSystem.theme.cardShadowOpacity}
                    onChange={(next) =>
                      updateDesignTheme('cardShadowOpacity', toSafeNumberInRange(next, 0.28, 0, 0.8))
                    }
                  />
                </div>
              </Card>

              <Card title="Component Library" subtitle="Canonical types available in the system">
                <ButtonVariantPicker
                  label="All button types"
                  value={siteConfig.designSystem.components.featuredCtaButtonVariant}
                  onChange={(next) => updateDesignComponent('featuredCtaButtonVariant', next as SiteButtonVariant)}
                  sampleText="Component"
                />
                <CardVariantPicker
                  label="All card types"
                  value={siteConfig.designSystem.components.introCardVariant}
                  glassVariant={siteConfig.designSystem.components.globalGlassVariant}
                  onChange={(next) => updateDesignComponent('introCardVariant', next as SiteCardVariant)}
                />
                <GlassVariantPicker
                  label="All glass types"
                  value={siteConfig.designSystem.components.globalGlassVariant}
                  onChange={(next) => updateDesignComponent('globalGlassVariant', next as SiteGlassVariant)}
                />
              </Card>
            </div>

            <div className="grid gap-4 xl:grid-cols-2">
              <Card title="Component Studio: Buttons" subtitle="Select a button type then tune it deeply">
                <div className="grid gap-2 sm:grid-cols-3">
                  {SITE_BUTTON_VARIANTS.map((variant) => {
                    const active = variant === activeButtonStudio;
                    return (
                      <button
                        key={`button-studio-${variant}`}
                        type="button"
                        onClick={() => setActiveButtonStudio(variant)}
                        className={`rounded-[10px] border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${
                          active
                            ? 'border-[#e5e7eb]
                            : 'border-[#e5e7eb]
                        }`}
                      >
                        {formatVariantLabel(variant)}
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Radius (px)"
                    type="number"
                    min={2}
                    max={999}
                    step={1}
                    value={siteConfig.designSystem.componentStyles.buttons[activeButtonStudio].radiusPx}
                    onChange={(next) =>
                      updateButtonPreset(activeButtonStudio, {
                        radiusPx: toSafeNumberInRange(next, 10, 2, 999),
                      })
                    }
                  />
                  <Input
                    label="Border width (px)"
                    type="number"
                    min={0.5}
                    max={6}
                    step={0.1}
                    value={siteConfig.designSystem.componentStyles.buttons[activeButtonStudio].borderWidthPx}
                    onChange={(next) =>
                      updateButtonPreset(activeButtonStudio, {
                        borderWidthPx: toSafeNumberInRange(next, 1, 0.5, 6),
                      })
                    }
                  />
                  <ColorInput
                    label="Dark background (CSS color)"
                    value={siteConfig.designSystem.componentStyles.buttons[activeButtonStudio].darkBackground}
                    onChange={(next) => updateButtonPreset(activeButtonStudio, { darkBackground: next })}
                  />
                  <ColorInput
                    label="Dark border (CSS color)"
                    value={siteConfig.designSystem.componentStyles.buttons[activeButtonStudio].darkBorder}
                    onChange={(next) => updateButtonPreset(activeButtonStudio, { darkBorder: next })}
                  />
                  <ColorInput
                    label="Dark text (CSS color)"
                    value={siteConfig.designSystem.componentStyles.buttons[activeButtonStudio].darkText}
                    onChange={(next) => updateButtonPreset(activeButtonStudio, { darkText: next })}
                  />
                  <ColorInput
                    label="Dark hover (CSS color)"
                    value={siteConfig.designSystem.componentStyles.buttons[activeButtonStudio].darkHoverBackground}
                    onChange={(next) => updateButtonPreset(activeButtonStudio, { darkHoverBackground: next })}
                  />
                  <ColorInput
                    label="Light background (CSS color)"
                    value={siteConfig.designSystem.componentStyles.buttons[activeButtonStudio].lightBackground}
                    onChange={(next) => updateButtonPreset(activeButtonStudio, { lightBackground: next })}
                  />
                  <ColorInput
                    label="Light border (CSS color)"
                    value={siteConfig.designSystem.componentStyles.buttons[activeButtonStudio].lightBorder}
                    onChange={(next) => updateButtonPreset(activeButtonStudio, { lightBorder: next })}
                  />
                  <ColorInput
                    label="Light text (CSS color)"
                    value={siteConfig.designSystem.componentStyles.buttons[activeButtonStudio].lightText}
                    onChange={(next) => updateButtonPreset(activeButtonStudio, { lightText: next })}
                  />
                  <ColorInput
                    label="Light hover (CSS color)"
                    value={siteConfig.designSystem.componentStyles.buttons[activeButtonStudio].lightHoverBackground}
                    onChange={(next) => updateButtonPreset(activeButtonStudio, { lightHoverBackground: next })}
                  />
                </div>

                <div className="grid gap-2 rounded-[12px] border border-[#e5e7eb]
                  <div className="rounded-[10px] border border-[#e5e7eb]
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <button type="button" className={getButtonClass(activeButtonStudio, 'dark', 'sm')}>
                      Live Preview
                    </button>
                  </div>
                  <div className="rounded-[10px] border border-black/10 bg-[#f5f7fb] p-3">
                    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#1a1a1a]
                    <button type="button" className={getButtonClass(activeButtonStudio, 'light', 'sm')}>
                      Live Preview
                    </button>
                  </div>
                </div>
              </Card>

              <Card title="Component Studio: Cards" subtitle="Tune fill, borders, radius and depth per card type">
                <div className="grid gap-2 sm:grid-cols-3">
                  {SITE_CARD_VARIANTS.map((variant) => {
                    const active = variant === activeCardStudio;
                    return (
                      <button
                        key={`card-studio-${variant}`}
                        type="button"
                        onClick={() => setActiveCardStudio(variant)}
                        className={`rounded-[10px] border px-3 py-2 font-mono text-[10px] uppercase tracking-[0.14em] transition-all ${
                          active
                            ? 'border-[#e5e7eb]
                            : 'border-[#e5e7eb]
                        }`}
                      >
                        {formatVariantLabel(variant)}
                      </button>
                    );
                  })}
                </div>

                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    label="Radius (px)"
                    type="number"
                    min={4}
                    max={80}
                    step={1}
                    value={siteConfig.designSystem.componentStyles.cards[activeCardStudio].radiusPx}
                    onChange={(next) =>
                      updateCardPreset(activeCardStudio, {
                        radiusPx: toSafeNumberInRange(next, 18, 4, 80),
                      })
                    }
                  />
                  <Input
                    label="Border width (px)"
                    type="number"
                    min={0.5}
                    max={6}
                    step={0.1}
                    value={siteConfig.designSystem.componentStyles.cards[activeCardStudio].borderWidthPx}
                    onChange={(next) =>
                      updateCardPreset(activeCardStudio, {
                        borderWidthPx: toSafeNumberInRange(next, 1, 0.5, 6),
                      })
                    }
                  />
                  <ColorInput
                    label="Dark border"
                    value={siteConfig.designSystem.componentStyles.cards[activeCardStudio].darkBorder}
                    onChange={(next) => updateCardPreset(activeCardStudio, { darkBorder: next })}
                  />
                  <ColorInput
                    label="Light border"
                    value={siteConfig.designSystem.componentStyles.cards[activeCardStudio].lightBorder}
                    onChange={(next) => updateCardPreset(activeCardStudio, { lightBorder: next })}
                  />
                  <ColorInput
                    label="Dark background"
                    value={siteConfig.designSystem.componentStyles.cards[activeCardStudio].darkBackground}
                    onChange={(next) => updateCardPreset(activeCardStudio, { darkBackground: next })}
                  />
                  <ColorInput
                    label="Light background"
                    value={siteConfig.designSystem.componentStyles.cards[activeCardStudio].lightBackground}
                    onChange={(next) => updateCardPreset(activeCardStudio, { lightBackground: next })}
                  />
                  <Input
                    label="Dark shadow opacity"
                    type="number"
                    min={0}
                    max={0.9}
                    step={0.01}
                    value={siteConfig.designSystem.componentStyles.cards[activeCardStudio].darkShadowOpacity}
                    onChange={(next) =>
                      updateCardPreset(activeCardStudio, {
                        darkShadowOpacity: toSafeNumberInRange(next, 0.28, 0, 0.9),
                      })
                    }
                  />
                  <Input
                    label="Light shadow opacity"
                    type="number"
                    min={0}
                    max={0.9}
                    step={0.01}
                    value={siteConfig.designSystem.componentStyles.cards[activeCardStudio].lightShadowOpacity}
                    onChange={(next) =>
                      updateCardPreset(activeCardStudio, {
                        lightShadowOpacity: toSafeNumberInRange(next, 0.24, 0, 0.9),
                      })
                    }
                  />
                </div>

                <div className="grid gap-2 rounded-[12px] border border-[#e5e7eb]
                  <div
                    className={`${getCardClass(activeCardStudio, 'dark', 'p-3')} ${getGlassClass(
                      siteConfig.designSystem.components.globalGlassVariant,
                      'dark',
                    )}`}
                  >
                    <p className="text-sm font-semibold text-white">Dark Surface</p>
                    <p className="mt-1 text-xs text-[#6b7280]
                  </div>
                  <div
                    className={`${getCardClass(activeCardStudio, 'light', 'p-3')} ${getGlassClass(
                      siteConfig.designSystem.components.globalGlassVariant,
                      'light',
                    )}`}
                  >
                    <p className="text-sm font-semibold text-[#1a1a1a]
                    <p className="mt-1 text-xs text-[#1a1a1a]
                  </div>
                </div>
              </Card>
            </div>

            <Card title="Live Design Lab" subtitle="Instant preview on dark and light surfaces inside dashboard">
              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[14px] border border-[#e5e7eb]
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]

                  <h3
                    className="mt-3 text-white"
                    style={{
                      fontSize: `clamp(${getScaledRem(
                        siteConfig.designSystem.theme.displayTitleSizeRem * 0.35,
                        siteConfig.designSystem.theme.headingScale,
                      )}, 5vw, ${getScaledRem(
                        siteConfig.designSystem.theme.displayTitleSizeRem * 0.6,
                        siteConfig.designSystem.theme.headingScale,
                      )})`,
                      fontWeight: siteConfig.designSystem.theme.headingWeight,
                      letterSpacing: `${siteConfig.designSystem.theme.headingLetterSpacingEm}em`,
                    }}
                  >
                    Display Heading
                  </h3>
                  <p
                    className="mt-1 text-[#6b7280]
                    style={{
                      fontSize: `${siteConfig.designSystem.theme.bodyTextSizeRem}rem`,
                      lineHeight: siteConfig.designSystem.theme.bodyLineHeight,
                    }}
                  >
                    Body text rhythm preview for readability and spacing.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {SITE_BUTTON_VARIANTS.map((variant) => (
                      <button key={`dark-${variant}`} type="button" className={getButtonClass(variant, 'dark', 'sm')}>
                        {formatVariantLabel(variant)}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {SITE_CARD_VARIANTS.map((variant) => (
                      <div
                        key={`dark-card-${variant}`}
                        className={`${getCardClass(variant, 'dark', 'p-3')} ${getGlassClass(
                          siteConfig.designSystem.components.globalGlassVariant,
                          'dark',
                        )}`}
                      >
                        <p className="text-sm font-semibold text-white">{formatVariantLabel(variant)}</p>
                        <p className="mt-1 text-xs text-[#6b7280]
                      </div>
                    ))}
                  </div>
                </div>

                <div className="rounded-[14px] border border-black/10 bg-[#f5f7fb] p-4">
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#1a1a1a]

                  <h3
                    className="mt-3 text-[#111217]"
                    style={{
                      fontSize: `clamp(${getScaledRem(
                        siteConfig.designSystem.theme.sectionTitleSizeRem * 0.8,
                        siteConfig.designSystem.theme.headingScale,
                      )}, 3.5vw, ${getScaledRem(
                        siteConfig.designSystem.theme.sectionTitleSizeRem * 1.1,
                        siteConfig.designSystem.theme.headingScale,
                      )})`,
                      fontWeight: siteConfig.designSystem.theme.headingWeight,
                      letterSpacing: `${siteConfig.designSystem.theme.headingLetterSpacingEm}em`,
                    }}
                  >
                    Section Heading
                  </h3>
                  <p
                    className="mt-1 text-[#1a1a1a]
                    style={{
                      fontSize: `${siteConfig.designSystem.theme.bodyTextSizeRem}rem`,
                      lineHeight: siteConfig.designSystem.theme.bodyLineHeight,
                    }}
                  >
                    Live visual confirmation before saving your style decisions.
                  </p>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {SITE_BUTTON_VARIANTS.map((variant) => (
                      <button key={`light-${variant}`} type="button" className={getButtonClass(variant, 'light', 'sm')}>
                        {formatVariantLabel(variant)}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {SITE_CARD_VARIANTS.map((variant) => (
                      <div
                        key={`light-card-${variant}`}
                        className={`${getCardClass(variant, 'light', 'p-3')} ${getGlassClass(
                          siteConfig.designSystem.components.globalGlassVariant,
                          'light',
                        )}`}
                      >
                        <p className="text-sm font-semibold text-[#1a1a1a])}</p>
                        <p className="mt-1 text-xs text-[#1a1a1a]
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <p className="text-xs text-[#6b7280]
                This lab is live: every token change updates instantly here and in the site scenes that use the
                design-system components.
              </p>
            </Card>
          </div>
        );

      case 'animation':
        return (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,430px)_minmax(0,1fr)]">
            <Card title="Animation Selector" subtitle="Pick one cursor animation and tune its own properties">
              <div className="grid gap-2 sm:grid-cols-3">
                {[
                  { id: 'fluid', label: 'Fluid', hint: 'WebGL liquid motion' },
                  { id: 'aura', label: 'Aura', hint: 'Soft cinematic glow' },
                  { id: 'orbit', label: 'Orbit', hint: 'Trailing orbit particles' },
                  { id: 'comet', label: 'Comet', hint: 'Head-and-tail cinematic trail' },
                  { id: 'ripple', label: 'Ripple', hint: 'Pulse rings from pointer movement' },
                  { id: 'spark', label: 'Spark', hint: 'Reactive burst particles' },
                  { id: 'beam', label: 'Beam', hint: 'Neon streak with lag follow' },
                  { id: 'plasma', label: 'Plasma', hint: 'Dual-color energetic orb' },
                ].map((mode) => {
                  const active = siteConfig.animation.activeCursorAnimation === mode.id;
                  return (
                    <button
                      key={`cursor-mode-${mode.id}`}
                      type="button"
                      onClick={() => {
                        if (siteConfig.animation.activeCursorAnimation === mode.id) return;
                        updateAnimationMode(mode.id as SiteCursorAnimationMode);
                      }}
                      className={`rounded-[11px] border px-3 py-3 text-left transition-all ${
                        active
                          ? 'border-[#e5e7eb]
                          : 'border-[#e5e7eb]
                      }`}
                    >
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em]">{mode.label}</p>
                      <p className="mt-1 text-[12px] text-[#6b7280]
                    </button>
                  );
                })}
              </div>

              {siteConfig.animation.activeCursorAnimation === 'fluid' ? (
                <div className="grid gap-3">
                  <Input
                    label="Density Dissipation"
                    type="number"
                    min={0.2}
                    max={10}
                    step={0.1}
                    value={siteConfig.animation.cursor.DENSITY_DISSIPATION}
                    onChange={(next) =>
                      updateFluidCursor(
                        'DENSITY_DISSIPATION',
                        toSafeNumberInRange(next, siteConfig.animation.cursor.DENSITY_DISSIPATION, 0.2, 10),
                      )
                    }
                  />
                  <Input
                    label="Velocity Dissipation"
                    type="number"
                    min={0.2}
                    max={20}
                    step={0.1}
                    value={siteConfig.animation.cursor.VELOCITY_DISSIPATION}
                    onChange={(next) =>
                      updateFluidCursor(
                        'VELOCITY_DISSIPATION',
                        toSafeNumberInRange(next, siteConfig.animation.cursor.VELOCITY_DISSIPATION, 0.2, 20),
                      )
                    }
                  />
                  <Input
                    label="Pressure"
                    type="number"
                    min={0.01}
                    max={1}
                    step={0.01}
                    value={siteConfig.animation.cursor.PRESSURE}
                    onChange={(next) =>
                      updateFluidCursor('PRESSURE', toSafeNumberInRange(next, siteConfig.animation.cursor.PRESSURE, 0.01, 1))
                    }
                  />
                  <Input
                    label="Curl"
                    type="number"
                    min={0}
                    max={30}
                    step={0.1}
                    value={siteConfig.animation.cursor.CURL}
                    onChange={(next) =>
                      updateFluidCursor('CURL', toSafeNumberInRange(next, siteConfig.animation.cursor.CURL, 0, 30))
                    }
                  />
                  <Input
                    label="Splat Radius"
                    type="number"
                    min={0.01}
                    max={1}
                    step={0.01}
                    value={siteConfig.animation.cursor.SPLAT_RADIUS}
                    onChange={(next) =>
                      updateFluidCursor(
                        'SPLAT_RADIUS',
                        toSafeNumberInRange(next, siteConfig.animation.cursor.SPLAT_RADIUS, 0.01, 1),
                      )
                    }
                  />
                  <Input
                    label="Splat Force"
                    type="number"
                    min={500}
                    max={20000}
                    step={10}
                    value={siteConfig.animation.cursor.SPLAT_FORCE}
                    onChange={(next) =>
                      updateFluidCursor('SPLAT_FORCE', toSafeNumberInRange(next, siteConfig.animation.cursor.SPLAT_FORCE, 500, 20000))
                    }
                  />
                  <Input
                    label="Color Speed"
                    type="number"
                    min={0.1}
                    max={10}
                    step={0.1}
                    value={siteConfig.animation.cursor.COLOR_UPDATE_SPEED}
                    onChange={(next) =>
                      updateFluidCursor(
                        'COLOR_UPDATE_SPEED',
                        toSafeNumberInRange(next, siteConfig.animation.cursor.COLOR_UPDATE_SPEED, 0.1, 10),
                      )
                    }
                  />
                  <Input
                    label="Cursor Color"
                    value={siteConfig.animation.cursor.COLOR}
                    onChange={(next) => updateFluidCursor('COLOR', next)}
                  />
                  <Toggle
                    label="Shading"
                    checked={siteConfig.animation.cursor.SHADING}
                    onChange={(next) => updateFluidCursor('SHADING', next)}
                  />
                  <Toggle
                    label="Rainbow Mode"
                    checked={siteConfig.animation.cursor.RAINBOW_MODE}
                    onChange={(next) => updateFluidCursor('RAINBOW_MODE', next)}
                  />
                  <Toggle
                    label="Auto Contrast"
                    checked={siteConfig.animation.cursor.AUTO_CONTRAST}
                    onChange={(next) => updateFluidCursor('AUTO_CONTRAST', next)}
                  />
                </div>
              ) : null}

              {siteConfig.animation.activeCursorAnimation === 'aura' ? (
                <div className="grid gap-3">
                  <Input
                    label="Aura Color"
                    value={siteConfig.animation.aura.color}
                    onChange={(next) => updateAuraCursor('color', next)}
                  />
                  <Input
                    label="Aura Size (px)"
                    type="number"
                    min={120}
                    max={820}
                    step={5}
                    value={siteConfig.animation.aura.sizePx}
                    onChange={(next) =>
                      updateAuraCursor('sizePx', toSafeNumberInRange(next, 360, 120, 820))
                    }
                  />
                  <Input
                    label="Aura Blur (px)"
                    type="number"
                    min={0}
                    max={220}
                    step={1}
                    value={siteConfig.animation.aura.blurPx}
                    onChange={(next) => updateAuraCursor('blurPx', toSafeNumberInRange(next, 46, 0, 220))}
                  />
                  <Input
                    label="Intensity"
                    type="number"
                    min={0.05}
                    max={1}
                    step={0.01}
                    value={siteConfig.animation.aura.intensity}
                    onChange={(next) => updateAuraCursor('intensity', toSafeNumberInRange(next, 0.5, 0.05, 1))}
                  />
                  <Input
                    label="Smoothing"
                    type="number"
                    min={0.02}
                    max={0.45}
                    step={0.01}
                    value={siteConfig.animation.aura.smoothing}
                    onChange={(next) => updateAuraCursor('smoothing', toSafeNumberInRange(next, 0.18, 0.02, 0.45))}
                  />
                </div>
              ) : null}

              {siteConfig.animation.activeCursorAnimation === 'orbit' ? (
                <div className="grid gap-3">
                  <Input
                    label="Particle Color"
                    value={siteConfig.animation.orbit.color}
                    onChange={(next) => updateOrbitCursor('color', next)}
                  />
                  <Input
                    label="Orb Count"
                    type="number"
                    min={2}
                    max={14}
                    step={1}
                    value={siteConfig.animation.orbit.orbCount}
                    onChange={(next) => updateOrbitCursor('orbCount', toSafeNumberInRange(next, 6, 2, 14))}
                  />
                  <Input
                    label="Orb Size (px)"
                    type="number"
                    min={6}
                    max={72}
                    step={1}
                    value={siteConfig.animation.orbit.orbSizePx}
                    onChange={(next) => updateOrbitCursor('orbSizePx', toSafeNumberInRange(next, 22, 6, 72))}
                  />
                  <Input
                    label="Orb Blur (px)"
                    type="number"
                    min={0}
                    max={60}
                    step={1}
                    value={siteConfig.animation.orbit.blurPx}
                    onChange={(next) => updateOrbitCursor('blurPx', toSafeNumberInRange(next, 10, 0, 60))}
                  />
                  <Input
                    label="Opacity"
                    type="number"
                    min={0.05}
                    max={1}
                    step={0.01}
                    value={siteConfig.animation.orbit.opacity}
                    onChange={(next) => updateOrbitCursor('opacity', toSafeNumberInRange(next, 0.32, 0.05, 1))}
                  />
                  <Input
                    label="Follow Strength"
                    type="number"
                    min={0.02}
                    max={1}
                    step={0.01}
                    value={siteConfig.animation.orbit.followStrength}
                    onChange={(next) =>
                      updateOrbitCursor('followStrength', toSafeNumberInRange(next, 0.22, 0.02, 1))
                    }
                  />
                  <Input
                    label="Trail Falloff"
                    type="number"
                    min={0.3}
                    max={0.99}
                    step={0.01}
                    value={siteConfig.animation.orbit.falloff}
                    onChange={(next) => updateOrbitCursor('falloff', toSafeNumberInRange(next, 0.84, 0.3, 0.99))}
                  />
                </div>
              ) : null}

              {siteConfig.animation.activeCursorAnimation === 'comet' ? (
                <div className="grid gap-3">
                  <Input
                    label="Comet Color"
                    value={siteConfig.animation.comet.color}
                    onChange={(next) => updateCometCursor('color', next)}
                  />
                  <Input
                    label="Head Size (px)"
                    type="number"
                    min={8}
                    max={96}
                    step={1}
                    value={siteConfig.animation.comet.headSizePx}
                    onChange={(next) =>
                      updateCometCursor(
                        'headSizePx',
                        toSafeNumberInRange(next, siteConfig.animation.comet.headSizePx, 8, 96),
                      )
                    }
                  />
                  <Input
                    label="Tail Length"
                    type="number"
                    min={2}
                    max={24}
                    step={1}
                    value={siteConfig.animation.comet.tailLength}
                    onChange={(next) =>
                      updateCometCursor(
                        'tailLength',
                        toSafeNumberInRange(next, siteConfig.animation.comet.tailLength, 2, 24),
                      )
                    }
                  />
                  <Input
                    label="Blur (px)"
                    type="number"
                    min={0}
                    max={80}
                    step={1}
                    value={siteConfig.animation.comet.blurPx}
                    onChange={(next) =>
                      updateCometCursor('blurPx', toSafeNumberInRange(next, siteConfig.animation.comet.blurPx, 0, 80))
                    }
                  />
                  <Input
                    label="Opacity"
                    type="number"
                    min={0.05}
                    max={1}
                    step={0.01}
                    value={siteConfig.animation.comet.opacity}
                    onChange={(next) =>
                      updateCometCursor('opacity', toSafeNumberInRange(next, siteConfig.animation.comet.opacity, 0.05, 1))
                    }
                  />
                  <Input
                    label="Follow Strength"
                    type="number"
                    min={0.02}
                    max={1}
                    step={0.01}
                    value={siteConfig.animation.comet.followStrength}
                    onChange={(next) =>
                      updateCometCursor(
                        'followStrength',
                        toSafeNumberInRange(next, siteConfig.animation.comet.followStrength, 0.02, 1),
                      )
                    }
                  />
                </div>
              ) : null}

              {siteConfig.animation.activeCursorAnimation === 'ripple' ? (
                <div className="grid gap-3">
                  <Input
                    label="Ripple Color"
                    value={siteConfig.animation.ripple.color}
                    onChange={(next) => updateRippleCursor('color', next)}
                  />
                  <Input
                    label="Ring Size (px)"
                    type="number"
                    min={40}
                    max={280}
                    step={2}
                    value={siteConfig.animation.ripple.ringSizePx}
                    onChange={(next) =>
                      updateRippleCursor(
                        'ringSizePx',
                        toSafeNumberInRange(next, siteConfig.animation.ripple.ringSizePx, 40, 280),
                      )
                    }
                  />
                  <Input
                    label="Ring Width (px)"
                    type="number"
                    min={1}
                    max={14}
                    step={1}
                    value={siteConfig.animation.ripple.ringWidthPx}
                    onChange={(next) =>
                      updateRippleCursor(
                        'ringWidthPx',
                        toSafeNumberInRange(next, siteConfig.animation.ripple.ringWidthPx, 1, 14),
                      )
                    }
                  />
                  <Input
                    label="Lifetime (ms)"
                    type="number"
                    min={200}
                    max={2000}
                    step={10}
                    value={siteConfig.animation.ripple.lifeMs}
                    onChange={(next) =>
                      updateRippleCursor('lifeMs', toSafeNumberInRange(next, siteConfig.animation.ripple.lifeMs, 200, 2000))
                    }
                  />
                  <Input
                    label="Spawn Distance (px)"
                    type="number"
                    min={4}
                    max={120}
                    step={1}
                    value={siteConfig.animation.ripple.spawnDistancePx}
                    onChange={(next) =>
                      updateRippleCursor(
                        'spawnDistancePx',
                        toSafeNumberInRange(next, siteConfig.animation.ripple.spawnDistancePx, 4, 120),
                      )
                    }
                  />
                  <Input
                    label="Opacity"
                    type="number"
                    min={0.05}
                    max={1}
                    step={0.01}
                    value={siteConfig.animation.ripple.opacity}
                    onChange={(next) =>
                      updateRippleCursor('opacity', toSafeNumberInRange(next, siteConfig.animation.ripple.opacity, 0.05, 1))
                    }
                  />
                </div>
              ) : null}

              {siteConfig.animation.activeCursorAnimation === 'spark' ? (
                <div className="grid gap-3">
                  <Input
                    label="Spark Color"
                    value={siteConfig.animation.spark.color}
                    onChange={(next) => updateSparkCursor('color', next)}
                  />
                  <Input
                    label="Particle Count"
                    type="number"
                    min={4}
                    max={64}
                    step={1}
                    value={siteConfig.animation.spark.particleCount}
                    onChange={(next) =>
                      updateSparkCursor(
                        'particleCount',
                        toSafeNumberInRange(next, siteConfig.animation.spark.particleCount, 4, 64),
                      )
                    }
                  />
                  <Input
                    label="Particle Size (px)"
                    type="number"
                    min={1}
                    max={12}
                    step={1}
                    value={siteConfig.animation.spark.particleSizePx}
                    onChange={(next) =>
                      updateSparkCursor(
                        'particleSizePx',
                        toSafeNumberInRange(next, siteConfig.animation.spark.particleSizePx, 1, 12),
                      )
                    }
                  />
                  <Input
                    label="Spread (px)"
                    type="number"
                    min={8}
                    max={120}
                    step={1}
                    value={siteConfig.animation.spark.spreadPx}
                    onChange={(next) =>
                      updateSparkCursor('spreadPx', toSafeNumberInRange(next, siteConfig.animation.spark.spreadPx, 8, 120))
                    }
                  />
                  <Input
                    label="Lifetime (ms)"
                    type="number"
                    min={120}
                    max={1600}
                    step={10}
                    value={siteConfig.animation.spark.lifeMs}
                    onChange={(next) =>
                      updateSparkCursor('lifeMs', toSafeNumberInRange(next, siteConfig.animation.spark.lifeMs, 120, 1600))
                    }
                  />
                  <Input
                    label="Emission Rate"
                    type="number"
                    min={0.05}
                    max={1}
                    step={0.01}
                    value={siteConfig.animation.spark.emissionRate}
                    onChange={(next) =>
                      updateSparkCursor(
                        'emissionRate',
                        toSafeNumberInRange(next, siteConfig.animation.spark.emissionRate, 0.05, 1),
                      )
                    }
                  />
                </div>
              ) : null}

              {siteConfig.animation.activeCursorAnimation === 'beam' ? (
                <div className="grid gap-3">
                  <Input
                    label="Beam Color"
                    value={siteConfig.animation.beam.color}
                    onChange={(next) => updateBeamCursor('color', next)}
                  />
                  <Input
                    label="Beam Width (px)"
                    type="number"
                    min={24}
                    max={360}
                    step={2}
                    value={siteConfig.animation.beam.widthPx}
                    onChange={(next) =>
                      updateBeamCursor('widthPx', toSafeNumberInRange(next, siteConfig.animation.beam.widthPx, 24, 360))
                    }
                  />
                  <Input
                    label="Beam Height (px)"
                    type="number"
                    min={6}
                    max={120}
                    step={1}
                    value={siteConfig.animation.beam.heightPx}
                    onChange={(next) =>
                      updateBeamCursor('heightPx', toSafeNumberInRange(next, siteConfig.animation.beam.heightPx, 6, 120))
                    }
                  />
                  <Input
                    label="Blur (px)"
                    type="number"
                    min={0}
                    max={80}
                    step={1}
                    value={siteConfig.animation.beam.blurPx}
                    onChange={(next) =>
                      updateBeamCursor('blurPx', toSafeNumberInRange(next, siteConfig.animation.beam.blurPx, 0, 80))
                    }
                  />
                  <Input
                    label="Opacity"
                    type="number"
                    min={0.05}
                    max={1}
                    step={0.01}
                    value={siteConfig.animation.beam.opacity}
                    onChange={(next) =>
                      updateBeamCursor('opacity', toSafeNumberInRange(next, siteConfig.animation.beam.opacity, 0.05, 1))
                    }
                  />
                  <Input
                    label="Lag"
                    type="number"
                    min={0.02}
                    max={0.6}
                    step={0.01}
                    value={siteConfig.animation.beam.lag}
                    onChange={(next) =>
                      updateBeamCursor('lag', toSafeNumberInRange(next, siteConfig.animation.beam.lag, 0.02, 0.6))
                    }
                  />
                </div>
              ) : null}

              {siteConfig.animation.activeCursorAnimation === 'plasma' ? (
                <div className="grid gap-3">
                  <Input
                    label="Color A"
                    value={siteConfig.animation.plasma.colorA}
                    onChange={(next) => updatePlasmaCursor('colorA', next)}
                  />
                  <Input
                    label="Color B"
                    value={siteConfig.animation.plasma.colorB}
                    onChange={(next) => updatePlasmaCursor('colorB', next)}
                  />
                  <Input
                    label="Size (px)"
                    type="number"
                    min={60}
                    max={420}
                    step={2}
                    value={siteConfig.animation.plasma.sizePx}
                    onChange={(next) =>
                      updatePlasmaCursor('sizePx', toSafeNumberInRange(next, siteConfig.animation.plasma.sizePx, 60, 420))
                    }
                  />
                  <Input
                    label="Blur (px)"
                    type="number"
                    min={0}
                    max={160}
                    step={1}
                    value={siteConfig.animation.plasma.blurPx}
                    onChange={(next) =>
                      updatePlasmaCursor('blurPx', toSafeNumberInRange(next, siteConfig.animation.plasma.blurPx, 0, 160))
                    }
                  />
                  <Input
                    label="Opacity"
                    type="number"
                    min={0.05}
                    max={1}
                    step={0.01}
                    value={siteConfig.animation.plasma.opacity}
                    onChange={(next) =>
                      updatePlasmaCursor('opacity', toSafeNumberInRange(next, siteConfig.animation.plasma.opacity, 0.05, 1))
                    }
                  />
                  <Input
                    label="Smoothing"
                    type="number"
                    min={0.02}
                    max={0.45}
                    step={0.01}
                    value={siteConfig.animation.plasma.smoothing}
                    onChange={(next) =>
                      updatePlasmaCursor(
                        'smoothing',
                        toSafeNumberInRange(next, siteConfig.animation.plasma.smoothing, 0.02, 0.45),
                      )
                    }
                  />
                </div>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  updateConfig((prev) => ({
                    ...prev,
                    animation: { ...DEFAULT_SITE_CONFIG.animation },
                  }));
                }}
                className="rounded-[10px] border border-[#e5e7eb]
                  >
                    Reset All Animation Presets
                  </button>
                </Card>

            <Card title="Section Motion" subtitle="Toggle cinematic text + card reveals by surface">
              <div className="space-y-4">
                <div className="rounded-[12px] border border-[#e5e7eb]
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b7280]
                      <p className="text-xs text-[#6b7280]
                    </div>
                    <Toggle
                      label="Enable"
                      checked={siteConfig.animation.sections.about.enabled}
                      onChange={(next) => updateSectionAnimation('about', { enabled: next })}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-[#6b7280]
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <select
                        value={siteConfig.animation.sections.about.textSequenceStyle}
                        onChange={(e) =>
                          updateSectionAnimation('about', {
                            textSequenceStyle: e.target.value as SiteConfig['animation']['sections']['about']['textSequenceStyle'],
                          })
                        }
                        className="rounded-[10px] border border-[#e5e7eb]
                      >
                        <option value="beam">Beam reveal</option>
                        <option value="typewriter">Typewriter</option>
                        <option value="slice">Slice</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1 text-[#6b7280]
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <select
                        value={siteConfig.animation.sections.about.cardEntranceStyle}
                        onChange={(e) =>
                          updateSectionAnimation('about', {
                            cardEntranceStyle: e.target.value as SiteConfig['animation']['sections']['about']['cardEntranceStyle'],
                          })
                        }
                        className="rounded-[10px] border border-[#e5e7eb]
                      >
                        <option value="stack">Stacked</option>
                        <option value="orbit">Orbital</option>
                        <option value="slide">Slide</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1 text-[#6b7280]
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <select
                        value={siteConfig.animation.sections.about.textRhythm}
                        onChange={(e) =>
                          updateSectionAnimation('about', {
                            textRhythm: e.target.value as SiteConfig['animation']['sections']['about']['textRhythm'],
                          })
                        }
                        className="rounded-[10px] border border-[#e5e7eb]
                      >
                        <option value="tight">Tight</option>
                        <option value="balanced">Balanced</option>
                        <option value="linger">Linger</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1 text-[#6b7280]
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <select
                        value={siteConfig.animation.sections.about.certificationRhythm}
                        onChange={(e) =>
                          updateSectionAnimation('about', {
                            certificationRhythm: e.target.value as SiteConfig['animation']['sections']['about']['certificationRhythm'],
                          })
                        }
                        className="rounded-[10px] border border-[#e5e7eb]
                      >
                        <option value="tight">Tight</option>
                        <option value="balanced">Balanced</option>
                        <option value="linger">Linger</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1 text-[#6b7280]
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <select
                        value={siteConfig.animation.sections.about.skillMode}
                        onChange={(e) =>
                          updateSectionAnimation('about', {
                            skillMode: e.target.value as SiteConfig['animation']['sections']['about']['skillMode'],
                          })
                        }
                        className="rounded-[10px] border border-[#e5e7eb]
                      >
                        <option value="rain">Rain</option>
                        <option value="tiles">Tiles</option>
                      </select>
                    </label>
                  </div>
                </div>

                <div className="rounded-[12px] border border-[#e5e7eb]
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b7280]
                      <p className="text-xs text-[#6b7280]
                    </div>
                    <Toggle
                      label="Enable"
                      checked={siteConfig.animation.sections.projects.enabled}
                      onChange={(next) => updateSectionAnimation('projects', { enabled: next })}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-[#6b7280]
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <select
                        value={siteConfig.animation.sections.projects.cardEntranceStyle}
                        onChange={(e) =>
                          updateSectionAnimation('projects', {
                            cardEntranceStyle: e.target.value as SiteConfig['animation']['sections']['projects']['cardEntranceStyle'],
                          })
                        }
                        className="rounded-[10px] border border-[#e5e7eb]
                      >
                        <option value="tilt">Tilt</option>
                        <option value="drift">Drift</option>
                        <option value="rise">Rise</option>
                      </select>
                    </label>

                    <label className="flex flex-col gap-1 text-[#6b7280]
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <select
                        value={siteConfig.animation.sections.projects.gridDepth}
                        onChange={(e) =>
                          updateSectionAnimation('projects', {
                            gridDepth: e.target.value as SiteConfig['animation']['sections']['projects']['gridDepth'],
                          })
                        }
                        className="rounded-[10px] border border-[#e5e7eb]
                      >
                        <option value="tight">Tight</option>
                        <option value="balanced">Balanced</option>
                        <option value="linger">Linger</option>
                      </select>
                    </label>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-3 rounded-[10px] border border-[#e5e7eb]
                    <p className="text-xs text-[#6b7280]
                    <Toggle
                      label="Parallax"
                      checked={siteConfig.animation.sections.projects.hoverParallax}
                      onChange={(next) => updateSectionAnimation('projects', { hoverParallax: next })}
                    />
                  </div>
                </div>

                <div className="rounded-[12px] border border-[#e5e7eb]
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b7280]
                      <p className="text-xs text-[#6b7280]
                    </div>
                    <Toggle
                      label="Enable"
                      checked={siteConfig.animation.sections.testimonials.enabled}
                      onChange={(next) => updateSectionAnimation('testimonials', { enabled: next })}
                    />
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-[#6b7280]
                      <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <select
                        value={siteConfig.animation.sections.testimonials.transitionStyle}
                        onChange={(e) =>
                          updateSectionAnimation('testimonials', {
                            transitionStyle: e.target.value as SiteConfig['animation']['sections']['testimonials']['transitionStyle'],
                          })
                        }
                        className="rounded-[10px] border border-[#e5e7eb]
                      >
                        <option value="fade">Fade</option>
                        <option value="slide">Slide</option>
                        <option value="flip">Flip</option>
                      </select>
                    </label>

                    <Input
                      label="Autoplay (ms)"
                      type="number"
                      min={1500}
                      max={15000}
                      step={100}
                      value={siteConfig.animation.sections.testimonials.autoPlayMs}
                      onChange={(next) =>
                        updateSectionAnimation('testimonials', {
                          autoPlayMs: toSafeNumberInRange(
                            next,
                            siteConfig.animation.sections.testimonials.autoPlayMs,
                            1500,
                            15000,
                          ),
                        })
                      }
                    />

                    <Input
                      label="Float Intensity"
                      type="number"
                      min={0}
                      max={1.2}
                      step={0.05}
                      value={siteConfig.animation.sections.testimonials.floatIntensity}
                      onChange={(next) =>
                        updateSectionAnimation('testimonials', {
                          floatIntensity: toSafeNumberInRange(
                            next,
                            siteConfig.animation.sections.testimonials.floatIntensity,
                            0,
                            1.2,
                          ),
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </Card>

            <Card title="Live Animation Preview" subtitle="Hover this area and test the selected cursor animation">
              <div
                ref={previewAnimationAreaRef}
                className="relative h-[420px] overflow-hidden rounded-[14px] border border-[#e5e7eb]
              >
                <div className="absolute inset-0 grid grid-cols-2">
                  <div className="bg-[#090909]" />
                  <div className="bg-[#f2f2f2]" />
                </div>

                <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_18%,rgba(255,255,255,0.1),transparent_44%),radial-gradient(circle_at_82%_82%,rgba(0,0,0,0.2),transparent_46%)]" />

                <div className="absolute left-3 top-3 rounded-[8px] border border-[#e5e7eb]
                  Dark Surface
                </div>
                <div className="absolute right-3 top-3 rounded-[8px] border border-black/20 bg-[#f8f9fa]
                  Light Surface
                </div>

                <div className="pointer-events-none absolute bottom-4 left-1/2 -translate-x-1/2 rounded-[10px] border border-[#e5e7eb]
                  Active: {siteConfig.animation.activeCursorAnimation}
                </div>
              </div>

              <p className="text-xs text-[#6b7280]
                Every animation has isolated settings. Switch between modes anytime and each one preserves its own
                values.
              </p>
            </Card>

            <Card
              className="xl:col-span-2"
              title="Motion System"
              subtitle="Global durations, easing, and hover response applied to all design system components"
            >
              <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                <Input
                  label="Fast duration (ms)"
                  type="number"
                  min={60}
                  max={600}
                  step={10}
                  value={siteConfig.animation.motion.durationFastMs}
                  onChange={(next) =>
                    updateMotionSystem(
                      'durationFastMs',
                      toSafeNumberInRange(next, siteConfig.animation.motion.durationFastMs, 60, 600),
                    )
                  }
                />
                <Input
                  label="Base duration (ms)"
                  type="number"
                  min={120}
                  max={900}
                  step={10}
                  value={siteConfig.animation.motion.durationBaseMs}
                  onChange={(next) =>
                    updateMotionSystem(
                      'durationBaseMs',
                      toSafeNumberInRange(next, siteConfig.animation.motion.durationBaseMs, 120, 900),
                    )
                  }
                />
                <Input
                  label="Slow duration (ms)"
                  type="number"
                  min={180}
                  max={1600}
                  step={10}
                  value={siteConfig.animation.motion.durationSlowMs}
                  onChange={(next) =>
                    updateMotionSystem(
                      'durationSlowMs',
                      toSafeNumberInRange(next, siteConfig.animation.motion.durationSlowMs, 180, 1600),
                    )
                  }
                />
                <Input
                  label="Ease curve (CSS timing function)"
                  value={siteConfig.animation.motion.ease}
                  onChange={(next) => updateMotionSystem('ease', next || DEFAULT_SITE_CONFIG.animation.motion.ease)}
                />
                <Input
                  label="Stagger (ms)"
                  type="number"
                  min={0}
                  max={420}
                  step={5}
                  value={siteConfig.animation.motion.staggerMs}
                  onChange={(next) =>
                    updateMotionSystem(
                      'staggerMs',
                      toSafeNumberInRange(next, siteConfig.animation.motion.staggerMs, 0, 420),
                    )
                  }
                />
                <Input
                  label="Hover lift (px)"
                  type="number"
                  min={0}
                  max={18}
                  step={0.5}
                  value={siteConfig.animation.motion.hoverLiftPx}
                  onChange={(next) =>
                    updateMotionSystem(
                      'hoverLiftPx',
                      toSafeNumberInRange(next, siteConfig.animation.motion.hoverLiftPx, 0, 18),
                    )
                  }
                />
                <Input
                  label="Hover scale"
                  type="number"
                  min={0.9}
                  max={1.2}
                  step={0.01}
                  value={siteConfig.animation.motion.hoverScale}
                  onChange={(next) =>
                    updateMotionSystem(
                      'hoverScale',
                      toSafeNumberInRange(next, siteConfig.animation.motion.hoverScale, 0.9, 1.2),
                    )
                  }
                />
              </div>

              <p className="text-xs text-[#6b7280]
                Buttons, cards, and glass surfaces now read these motion tokens so hover lift, easing, and rhythm stay aligned across every page.
              </p>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  const renderWritingStudio = () => {
    return null;
  };

  const renderSiteWorkspace = () => {
    return (
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="self-start rounded-[20px] border border-[#e5e7eb]
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b7280]

          <div className="mt-3 max-h-[68vh] space-y-3 overflow-y-auto pr-1">
            {DASHBOARD_SECTION_GROUPS.map((group) => (
              <div key={group.id} className="space-y-2">
                <p className="px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                <div className="space-y-2">
                  {group.sectionIds.map((sectionId) => {
                    const section = DASHBOARD_SECTIONS.find((entry) => entry.id === sectionId);
                    if (!section) return null;

                    return (
                      <SectionButton
                        key={section.id}
                        label={section.label}
                        hint={section.hint}
                        isActive={activeSection === section.id}
                        onClick={() => {
                          setActiveSection(section.id);
                          clearUploadFeedback();
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-[12px] border border-[#e5e7eb]
            Editing now: <span className="font-semibold text-white">{activeSectionInfo.label}</span>
          </div>
        </aside>

        <section className="space-y-4">
          {uploadError ? (
            <div className="rounded-[12px] border border-[#b42318]/28 bg-[#b42318]/10 px-4 py-3 text-sm text-[#8f1f16]">
              {uploadError}
            </div>
          ) : null}
          {uploadMessage ? (
            <div className="rounded-[12px] border border-[#177245]/30 bg-[#177245]/10 px-4 py-3 text-sm text-[#146238]">
              {uploadMessage}
            </div>
          ) : null}

          <div className="rounded-[20px] border border-[#e5e7eb])}</div>
        </section>
      </div>
    );
  };

  const renderSitePagesWorkspace = () => {
    return (
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="self-start rounded-[20px] border border-[#e5e7eb] bg-[#f8f9fa] p-3">
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b7280]">Sections</p>

          <div className="mt-3 max-h-[68vh] space-y-3 overflow-y-auto pr-1">
            {DASHBOARD_SECTION_GROUPS.map((group) => (
              <div key={group.id} className="space-y-2">
                <p className="px-1 font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">{group.label}</p>
                <div className="space-y-2">
                  {group.sectionIds.map((sectionId) => {
                    const section = DASHBOARD_SECTIONS.find((entry) => entry.id === sectionId);
                    if (!section) return null;

                    return (
                      <SectionButton
                        key={section.id}
                        label={section.label}
                        hint={section.hint}
                        isActive={activeSection === section.id}
                        onClick={() => {
                          setActiveSection(section.id);
                          clearUploadFeedback();
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-3 rounded-[12px] border border-[#e5e7eb] bg-[#f8f9fa] p-2">
            <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]">
              Editing now: <span className="font-semibold text-[#1a1a1a]">{activeSectionInfo.label}</span>
            </p>
          </div>
        </aside>

        <section className="space-y-4">
          {uploadError ? (
            <div className="rounded-[12px] border border-[#b42318]/28 bg-[#b42318]/10 px-4 py-3 text-sm text-[#8f1f16]">
              {uploadError}
            </div>
          ) : null}
          {uploadMessage ? (
            <div className="rounded-[12px] border border-[#177245]/30 bg-[#177245]/10 px-4 py-3 text-sm text-[#146238]">
              {uploadMessage}
            </div>
          ) : null}

          <div className="rounded-[20px] border border-[#e5e7eb] bg-white p-4">
            {renderSectionContent()}
          </div>
        </section>
      </div>
    );
  };

  const renderDesignSystemWorkspace = () => {
    const designSections = [
      { id: 'colors' as const, label: 'Colors', hint: 'Color schemes and palettes' },
      { id: 'typography' as const, label: 'Typography', hint: 'Fonts, sizes, and weights' },
      { id: 'spacing' as const, label: 'Spacing', hint: 'Margins, padding, and gaps' },
      { id: 'components' as const, label: 'Components', hint: 'Buttons, cards, and variants' },
      { id: 'motion' as const, label: 'Motion', hint: 'Animations and transitions' },
    ];

    return (
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="self-start rounded-[20px] border border-[#e5e7eb] bg-[#f8f9fa] p-3">
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b7280]">Design Sections</p>

          <div className="mt-3 space-y-2">
            {designSections.map((section) => (
              <SectionButton
                key={section.id}
                label={section.label}
                hint={section.hint}
                isActive={activeDesignSection === section.id}
                onClick={() => setActiveDesignSection(section.id)}
              />
            ))}
          </div>
        </aside>

        <section className="space-y-4">
          {activeDesignSection === 'colors' && (
            <>
              <Card title="Color System" subtitle="Primary and secondary color schemes">
                <div className="grid gap-4 md:grid-cols-2">
                  <ColorInput
                    label="Primary Color"
                    value={siteConfig.designSystem.theme.primaryColor}
                    onChange={(next) => updateConfig((prev) => ({
                      ...prev,
                      designSystem: {
                        ...prev.designSystem,
                        theme: { ...prev.designSystem.theme, primaryColor: next },
                      },
                    }))}
                  />
                  <ColorInput
                    label="Secondary Color"
                    value={siteConfig.designSystem.theme.secondaryColor}
                    onChange={(next) => updateConfig((prev) => ({
                      ...prev,
                      designSystem: {
                        ...prev.designSystem,
                        theme: { ...prev.designSystem.theme, secondaryColor: next },
                      },
                    }))}
                  />
                  <ColorInput
                    label="On Primary Color"
                    value={siteConfig.designSystem.theme.onPrimaryColor}
                    onChange={(next) => updateConfig((prev) => ({
                      ...prev,
                      designSystem: {
                        ...prev.designSystem,
                        theme: { ...prev.designSystem.theme, onPrimaryColor: next },
                      },
                    }))}
                  />
                  <ColorInput
                    label="On Secondary Color"
                    value={siteConfig.designSystem.theme.onSecondaryColor}
                    onChange={(next) => updateConfig((prev) => ({
                      ...prev,
                      designSystem: {
                        ...prev.designSystem,
                        theme: { ...prev.designSystem.theme, onSecondaryColor: next },
                      },
                    }))}
                  />
                </div>
              </Card>

              <Card title="Glow Effects" subtitle="Glow color and intensity settings">
                <ColorInput
                  label="Glow Color"
                  value={siteConfig.designSystem.theme.glowColor}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, glowColor: next },
                    },
                  }))}
                />
                <Input
                  label="Glow Intensity"
                  type="number"
                  min={0}
                  max={1.2}
                  step={0.1}
                  value={siteConfig.designSystem.theme.glowIntensity}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, glowIntensity: Number(next) },
                    },
                  }))}
                />
                <Toggle
                  label="Enable Glow"
                  checked={siteConfig.designSystem.theme.glowEnabled}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, glowEnabled: next },
                    },
                  }))}
                />
              </Card>

              <Card title="Glass Effects" subtitle="Glass tint and border colors">
                <ColorInput
                  label="Glass Tint Color"
                  value={siteConfig.designSystem.theme.glassTintColor}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, glassTintColor: next },
                    },
                  }))}
                />
                <ColorInput
                  label="Glass Border Color"
                  value={siteConfig.designSystem.theme.glassBorderColor}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, glassBorderColor: next },
                    },
                  }))}
                />
              </Card>
            </>
          )}

          {activeDesignSection === 'typography' && (
            <>
              <Card title="Typography Scale" subtitle="Font sizes and scaling">
                <Input
                  label="Display Title Size (rem)"
                  type="number"
                  min={1}
                  max={10}
                  step={0.1}
                  value={siteConfig.designSystem.theme.displayTitleSizeRem}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, displayTitleSizeRem: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Section Title Size (rem)"
                  type="number"
                  min={1}
                  max={6}
                  step={0.1}
                  value={siteConfig.designSystem.theme.sectionTitleSizeRem}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, sectionTitleSizeRem: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Body Text Size (rem)"
                  type="number"
                  min={0.5}
                  max={2}
                  step={0.05}
                  value={siteConfig.designSystem.theme.bodyTextSizeRem}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, bodyTextSizeRem: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Heading Scale"
                  type="number"
                  min={0.8}
                  max={1.5}
                  step={0.05}
                  value={siteConfig.designSystem.theme.headingScale}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, headingScale: Number(next) },
                    },
                  }))}
                />
              </Card>

              <Card title="Typography Style" subtitle="Font weights and spacing">
                <Input
                  label="Heading Weight"
                  type="number"
                  min={100}
                  max={900}
                  step={100}
                  value={siteConfig.designSystem.theme.headingWeight}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, headingWeight: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Heading Letter Spacing (em)"
                  type="number"
                  min={-0.1}
                  max={0.3}
                  step={0.01}
                  value={siteConfig.designSystem.theme.headingLetterSpacingEm}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, headingLetterSpacingEm: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Body Line Height"
                  type="number"
                  min={1}
                  max={2.5}
                  step={0.1}
                  value={siteConfig.designSystem.theme.bodyLineHeight}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, bodyLineHeight: Number(next) },
                    },
                  }))}
                />
              </Card>
            </>
          )}

          {activeDesignSection === 'spacing' && (
            <>
              <Card title="Spacing System" subtitle="Section, stack, and grid spacing">
                <Input
                  label="Section Padding (rem)"
                  type="number"
                  min={1}
                  max={10}
                  step={0.5}
                  value={siteConfig.designSystem.foundation.spacing.sectionPaddingRem}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      foundation: {
                        ...prev.designSystem.foundation,
                        spacing: { ...prev.designSystem.foundation.spacing, sectionPaddingRem: Number(next) },
                      },
                    },
                  }))}
                />
                <Input
                  label="Stack Gap (rem)"
                  type="number"
                  min={0.5}
                  max={5}
                  step={0.25}
                  value={siteConfig.designSystem.foundation.spacing.stackGapRem}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      foundation: {
                        ...prev.designSystem.foundation,
                        spacing: { ...prev.designSystem.foundation.spacing, stackGapRem: Number(next) },
                      },
                    },
                  }))}
                />
                <Input
                  label="Grid Gap (rem)"
                  type="number"
                  min={0.5}
                  max={5}
                  step={0.25}
                  value={siteConfig.designSystem.foundation.spacing.gridGapRem}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      foundation: {
                        ...prev.designSystem.foundation,
                        spacing: { ...prev.designSystem.foundation.spacing, gridGapRem: Number(next) },
                      },
                    },
                  }))}
                />
                <Input
                  label="Card Padding (rem)"
                  type="number"
                  min={0.5}
                  max={5}
                  step={0.25}
                  value={siteConfig.designSystem.foundation.spacing.cardPaddingRem}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      foundation: {
                        ...prev.designSystem.foundation,
                        spacing: { ...prev.designSystem.foundation.spacing, cardPaddingRem: Number(next) },
                      },
                    },
                  }))}
                />
              </Card>

              <Card title="Layout System" subtitle="Content width and column settings">
                <Input
                  label="Content Max Width (px)"
                  type="number"
                  min={800}
                  max={2000}
                  step={50}
                  value={siteConfig.designSystem.foundation.layout.contentMaxWidthPx}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      foundation: {
                        ...prev.designSystem.foundation,
                        layout: { ...prev.designSystem.foundation.layout, contentMaxWidthPx: Number(next) },
                      },
                    },
                  }))}
                />
                <Input
                  label="Column Gap (rem)"
                  type="number"
                  min={0.5}
                  max={5}
                  step={0.25}
                  value={siteConfig.designSystem.foundation.layout.columnGapRem}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      foundation: {
                        ...prev.designSystem.foundation,
                        layout: { ...prev.designSystem.foundation.layout, columnGapRem: Number(next) },
                      },
                    },
                  }))}
                />
                <Input
                  label="Max Grid Columns"
                  type="number"
                  min={1}
                  max={12}
                  step={1}
                  value={siteConfig.designSystem.foundation.layout.maxGridColumns}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      foundation: {
                        ...prev.designSystem.foundation,
                        layout: { ...prev.designSystem.foundation.layout, maxGridColumns: Number(next) },
                      },
                    },
                  }))}
                />
              </Card>
            </>
          )}

          {activeDesignSection === 'components' && (
            <>
              <Card title="Button Components" subtitle="Radius, border, and shadow settings">
                <Input
                  label="Button Radius (px)"
                  type="number"
                  min={0}
                  max={50}
                  step={1}
                  value={siteConfig.designSystem.theme.buttonRadius}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, buttonRadius: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Button Border Width (px)"
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  value={siteConfig.designSystem.theme.buttonBorderWidth}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, buttonBorderWidth: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Button Shadow Opacity"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={siteConfig.designSystem.theme.buttonShadowOpacity}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, buttonShadowOpacity: Number(next) },
                    },
                  }))}
                />
              </Card>

              <Card title="Card Components" subtitle="Radius, border, blur, and shadow settings">
                <Input
                  label="Card Radius (px)"
                  type="number"
                  min={0}
                  max={50}
                  step={1}
                  value={siteConfig.designSystem.theme.cardRadius}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, cardRadius: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Card Border Width (px)"
                  type="number"
                  min={0}
                  max={5}
                  step={0.5}
                  value={siteConfig.designSystem.theme.cardBorderWidth}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, cardBorderWidth: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Card Blur (px)"
                  type="number"
                  min={0}
                  max={50}
                  step={1}
                  value={siteConfig.designSystem.theme.cardBlurPx}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, cardBlurPx: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Card Shadow Opacity"
                  type="number"
                  min={0}
                  max={1}
                  step={0.05}
                  value={siteConfig.designSystem.theme.cardShadowOpacity}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      theme: { ...prev.designSystem.theme, cardShadowOpacity: Number(next) },
                    },
                  }))}
                />
              </Card>

              <Card title="Component Variants" subtitle="Button and card variant assignments">
                <SelectInput
                  label="Global Glass Variant"
                  value={siteConfig.designSystem.components.globalGlassVariant}
                  options={SITE_GLASS_VARIANTS.map((v) => ({ value: v, label: formatVariantLabel(v) }))}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      components: { ...prev.designSystem.components, globalGlassVariant: next as SiteGlassVariant },
                    },
                  }))}
                />
                <SelectInput
                  label="Navigation Glass Variant"
                  value={siteConfig.designSystem.components.navigationGlassVariant}
                  options={SITE_GLASS_VARIANTS.map((v) => ({ value: v, label: formatVariantLabel(v) }))}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    designSystem: {
                      ...prev.designSystem,
                      components: { ...prev.designSystem.components, navigationGlassVariant: next as SiteGlassVariant },
                    },
                  }))}
                />
              </Card>
            </>
          )}

          {activeDesignSection === 'motion' && (
            <>
              <Card title="Motion System" subtitle="Duration, easing, and hover effects">
                <Input
                  label="Fast Duration (ms)"
                  type="number"
                  min={50}
                  max={500}
                  step={10}
                  value={siteConfig.animation.motion.durationFastMs}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    animation: {
                      ...prev.animation,
                      motion: { ...prev.animation.motion, durationFastMs: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Base Duration (ms)"
                  type="number"
                  min={100}
                  max={1000}
                  step={25}
                  value={siteConfig.animation.motion.durationBaseMs}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    animation: {
                      ...prev.animation,
                      motion: { ...prev.animation.motion, durationBaseMs: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Slow Duration (ms)"
                  type="number"
 min={200}
                  max={2000}
                  step={50}
                  value={siteConfig.animation.motion.durationSlowMs}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    animation: {
                      ...prev.animation,
                      motion: { ...prev.animation.motion, durationSlowMs: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Stagger (ms)"
                  type="number"
                  min={0}
                  max={200}
                  step={10}
                  value={siteConfig.animation.motion.staggerMs}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    animation: {
                      ...prev.animation,
                      motion: { ...prev.animation.motion, staggerMs: Number(next) },
                    },
                  }))}
                />
              </Card>

              <Card title="Hover Effects" subtitle="Scale and lift on hover">
                <Input
                  label="Hover Scale"
                  type="number"
                  min={1}
                  max={1.2}
                  step={0.01}
                  value={siteConfig.animation.motion.hoverScale}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    animation: {
                      ...prev.animation,
                      motion: { ...prev.animation.motion, hoverScale: Number(next) },
                    },
                  }))}
                />
                <Input
                  label="Hover Lift (px)"
                  type="number"
                  min={0}
                  max={20}
                  step={1}
                  value={siteConfig.animation.motion.hoverLiftPx}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    animation: {
                      ...prev.animation,
                      motion: { ...prev.animation.motion, hoverLiftPx: Number(next) },
                    },
                  }))}
                />
              </Card>

              <Card title="Easing Function" subtitle="Animation easing curve">
                <Input
                  label="Easing Function"
                  value={siteConfig.animation.motion.ease}
                  onChange={(next) => updateConfig((prev) => ({
                    ...prev,
                    animation: {
                      ...prev.animation,
                      motion: { ...prev.animation.motion, ease: next },
                    },
                  }))}
                />
              </Card>
            </>
          )}
        </section>
      </div>
    );
  };

  const renderSiteIntegrationsWorkspace = () => {
    const integrationSections = [
      { id: 'browser' as const, label: 'Browser Identity', hint: 'Tab title and favicon' },
      { id: 'ai' as const, label: 'AI Integration', hint: 'AI configuration and settings' },
      { id: 'domain' as const, label: 'Domain', hint: 'Custom domain and DNS' },
      { id: 'analytics' as const, label: 'Analytics', hint: 'Google Analytics and tracking' },
      { id: 'security' as const, label: 'Security', hint: 'Security settings and protection' },
      { id: 'reports' as const, label: 'Technical Reports', hint: 'Site performance reports' },
    ];

    return (
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="self-start rounded-[20px] border border-[#e5e7eb]
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b7280]

          <div className="mt-3 space-y-2">
            {integrationSections.map((section) => (
              <SectionButton
                key={section.id}
                label={section.label}
                hint={section.hint}
                isActive={activeIntegrationSection === section.id}
                onClick={() => setActiveIntegrationSection(section.id)}
              />
            ))}
          </div>
        </aside>

        <section className="space-y-4">
          {activeIntegrationSection === 'browser' && (
            <>
              <Card title="Browser Identity" subtitle="Control tab title and favicon">
                <Input
                  label="Browser Tab Title"
                  value={siteConfig.dashboard.browser.browserTabTitle}
                  onChange={(next) => updateDashboardBrowser('browserTabTitle', next)}
                />
                <Input
                  label="Favicon URL"
                  value={siteConfig.dashboard.browser.faviconUrl}
                  onChange={(next) => updateDashboardBrowser('faviconUrl', next)}
                />
                <label className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0] ?? null;
                      e.currentTarget.value = '';
                      void handleFaviconUpload(file);
                    }}
                    className="rounded-[10px] border border-[#e5e7eb]
                  />
                </label>
              </Card>

              <Card title="Preview" subtitle="Current browser identity settings">
                <div className="rounded-[12px] border border-[#e5e7eb]
                  <p className="text-xs text-[#6b7280]
                  <p className="mt-1 font-medium text-white">{siteConfig.dashboard.browser.browserTabTitle || 'Untitled site'}</p>
                </div>
                <div className="mt-3 rounded-[12px] border border-[#e5e7eb]
                  <p className="text-xs text-[#6b7280]
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px] border border-[#e5e7eb]
                      {siteConfig.dashboard.browser.faviconUrl ? (
                        <img src={siteConfig.dashboard.browser.faviconUrl} alt="Favicon preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-mono text-[10px] text-[#6b7280]
                      )}
                    </span>
                    <p className="text-xs text-[#6b7280]
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeIntegrationSection === 'ai' && (
            <>
              <Card title="AI Integration" subtitle="Configure AI-powered features">
                <Input
                  label="API Base URL"
                  value={siteConfig.dashboard.integrations.apiBaseUrl}
                  onChange={(next) => updateDashboardIntegration('apiBaseUrl', next)}
                />
                <Textarea
                  label="AI Configuration"
                  value="AI integration settings will be configured here."
                  rows={4}
                  onChange={() => {}}
                />
                <Toggle
                  label="Enable AI Features"
                  checked={false}
                  onChange={() => {}}
                />
              </Card>

              <Card title="AI Features" subtitle="Available AI-powered capabilities">
                <div className="space-y-3">
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="text-sm font-medium text-white">Content Generation</p>
                    <p className="mt-1 text-xs text-[#6b7280]
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="text-sm font-medium text-white">Smart Analytics</p>
                    <p className="mt-1 text-xs text-[#6b7280]
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="text-sm font-medium text-white">Automated Reports</p>
                    <p className="mt-1 text-xs text-[#6b7280]
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeIntegrationSection === 'domain' && (
            <>
              <Card title="Domain Settings" subtitle="Custom domain and DNS configuration">
                <Input
                  label="Custom Domain"
                  value={siteConfig.dashboard.integrations.customDomain}
                  onChange={(next) => updateDashboardIntegration('customDomain', next)}
                />
                <Input
                  label="DNS Provider"
                  value=""
                  onChange={() => {}}
                />
                <Textarea
                  label="DNS Records"
                  value="Configure your DNS records to point to your site."
                  rows={4}
                  onChange={() => {}}
                />
              </Card>

              <Card title="Domain Status" subtitle="Current domain configuration status">
                <div className={`rounded-[12px] border px-3 py-3 text-sm ${
                  siteConfig.dashboard.integrations.customDomain
                    ? dashboardStatusSuccessClass
                    : dashboardStatusFailureClass
                }`}>
                  {siteConfig.dashboard.integrations.customDomain
                    ? `Domain configured: ${siteConfig.dashboard.integrations.customDomain}`
                    : 'No custom domain configured'}
                </div>
              </Card>
            </>
          )}

          {activeIntegrationSection === 'analytics' && (
            <>
              <Card title="Google Analytics" subtitle="Configure Google Analytics tracking">
                <Input
                  label="Measurement ID"
                  value={siteConfig.dashboard.integrations.googleAnalyticsMeasurementId}
                  onChange={(next) => updateDashboardIntegration('googleAnalyticsMeasurementId', next)}
                />
                <Toggle
                  label="Enable Google Analytics"
                  checked={siteConfig.dashboard.integrations.googleAnalyticsEnabled}
                  onChange={(next) => updateDashboardIntegration('googleAnalyticsEnabled', next)}
                />
              </Card>

              <Card title="Connection Health" subtitle="Analytics integration status">
                <div className="rounded-[12px] border border-[#e5e7eb]
                  Measurement ID: <span className="font-semibold text-white">
                    {siteConfig.dashboard.integrations.googleAnalyticsMeasurementId || 'Not set'}
                  </span>
                </div>
                <div
                  className={`mt-3 rounded-[12px] border px-3 py-3 text-sm ${
                    stats.gaConnected ? dashboardStatusSuccessClass : dashboardStatusFailureClass
                  }`}
                >
                  {stats.gaConnected
                    ? 'Google Analytics connection is healthy.'
                    : 'Google Analytics needs a valid measurement ID and enabled toggle.'}
                </div>
              </Card>
            </>
          )}

          {activeIntegrationSection === 'security' && (
            <>
              <Card title="Security Settings" subtitle="Configure site security options">
                <Toggle
                  label="Enable HTTPS"
                  checked={true}
                  onChange={() => {}}
                />
                <Toggle
                  label="Enable Content Security Policy"
                  checked={false}
                  onChange={() => {}}
                />
                <Toggle
                  label="Enable Rate Limiting"
                  checked={true}
                  onChange={() => {}}
                />
                <Input
                  label="Allowed Origins"
                  value="*"
                  onChange={() => {}}
                />
              </Card>

              <Card title="Security Status" subtitle="Current security configuration">
                <div className="space-y-2">
                  <div className="rounded-[12px] border border-[#22c55e]/30 bg-[#22c55e]/12 px-3 py-2">
                    <p className="text-xs text-[#86efac]">✓ HTTPS Enabled</p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="text-xs text-[#6b7280]
                  </div>
                  <div className="rounded-[12px] border border-[#22c55e]/30 bg-[#22c55e]/12 px-3 py-2">
                    <p className="text-xs text-[#86efac]">✓ Rate Limiting Active</p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activeIntegrationSection === 'reports' && (
            <>
              <Card title="Technical Reports" subtitle="Site performance and health reports">
                <div className="space-y-3">
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">Performance Report</p>
                      <span className="text-xs text-[#6b7280]
                    </div>
                    <p className="mt-1 text-xs text-[#6b7280]
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">SEO Report</p>
                      <span className="text-xs text-[#6b7280]
                    </div>
                    <p className="mt-1 text-xs text-[#6b7280]
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-white">Accessibility Report</p>
                      <span className="text-xs text-[#6b7280]
                    </div>
                    <p className="mt-1 text-xs text-[#6b7280]
                  </div>
                </div>
              </Card>

              <Card title="Report Settings" subtitle="Configure automated reports">
                <Toggle
                  label="Enable Daily Reports"
                  checked={true}
                  onChange={() => {}}
                />
                <Toggle
                  label="Email Reports"
                  checked={false}
                  onChange={() => {}}
                />
                <Input
                  label="Report Frequency"
                  value="daily"
                  onChange={() => {}}
                />
              </Card>
            </>
          )}
        </section>
      </div>
    );
  };

  const renderPublishingWorkspace = () => {
    const publishingSections = [
      { id: 'articles' as const, label: 'Articles', hint: 'Manage all articles' },
      { id: 'calendar' as const, label: 'Calendar', hint: 'Publishing schedule' },
      { id: 'performance' as const, label: 'Performance', hint: 'Article analytics' },
      { id: 'settings' as const, label: 'Settings', hint: 'Publishing preferences' },
    ];

    const contentStatusOptions: Array<{ value: SiteContentStatus; label: string }> = [
      { value: 'draft', label: 'Draft' },
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'published', label: 'Published' },
    ];

    const articleQuery = articleSearchQuery.trim().toLowerCase();

    const filteredArticles = siteConfig.articles.filter((article) => {
      if (!articleQuery) return true;
      const haystack = [article.title, article.slug, article.category, article.author, article.excerpt, article.tags.join(' ')].join(' ');
      return haystack.toLowerCase().includes(articleQuery);
    });

    const activeArticle =
      siteConfig.articles.find((article) => article.id === activeArticleId) ?? filteredArticles[0] ?? siteConfig.articles[0] ?? null;

    const liveArticlesCount = siteConfig.articles.filter((article) => article.visible && article.status === 'published').length;
    const scheduledCount = siteConfig.articles.filter((article) => article.status === 'scheduled').length;

    const articleCanGoLive = Boolean(
      activeArticle && activeArticle.visible && activeArticle.status === 'published' && activeArticle.slug.trim().length > 0,
    );

    return (
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="self-start rounded-[20px] border border-[#e5e7eb]
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b7280]

          <div className="mt-3 space-y-2">
            {publishingSections.map((section) => (
              <SectionButton
                key={section.id}
                label={section.label}
                hint={section.hint}
                isActive={activePublishingSection === section.id}
                onClick={() => setActivePublishingSection(section.id)}
              />
            ))}
          </div>

          <div className="mt-3 rounded-[12px] border border-[#e5e7eb]
            Total: <span className="font-semibold text-white">{siteConfig.articles.length}</span> articles
          </div>
        </aside>

        <section className="space-y-4">
          {activePublishingSection === 'articles' && (
            <>
              <Card title="Articles Studio" subtitle="Create, publish, and preview articles">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <p className="max-w-[560px] text-sm text-[#6b7280]
                    Build a focused publishing workflow around articles only. Create drafts, schedule launches, and push live posts from one editor.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date().toISOString();
                        const nextArticle: SiteArticle = {
                          id: `article-${Date.now()}`,
                          title: 'New Article',
                          slug: `new-article-${Date.now()}`,
                          excerpt: 'Write a short summary for this article.',
                          content: 'Write your article body here.',
                          coverImage: '/frames/scene-03-screen-entry/ezgif-frame-001.jpg',
                          author: 'Your Name',
                          category: 'Insights',
                          tags: ['insight'],
                          readingMinutes: 6,
                          status: 'draft',
                          featured: false,
                          visible: true,
                          publishedAt: now,
                          videoUrl: '',
                        };

                        updateConfig((prev) => ({
                          ...prev,
                          articles: [nextArticle, ...prev.articles],
                        }));

                        setActiveArticleId(nextArticle.id);
                      }}
                      className={dashboardActionButtonSecondaryClass}
                    >
                      New Article
                    </button>

                    <button type="button" onClick={handleOpenArticlesPage} className={dashboardActionButtonPrimaryClass}>
                      Open Articles Page
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-3">
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.articles.length}</p>
                  </div>
                  <div className="rounded-[12px] border border-[#22c55e]/30 bg-[#22c55e]/12 px-3 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#86efac]">Live on /articles</p>
                    <p className="mt-1 text-lg font-semibold text-white">{liveArticlesCount}</p>
                  </div>
                  <div className="rounded-[12px] border border-[#ef4444]/30 bg-[#ef4444]/12 px-3 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#fecaca]">Scheduled Queue</p>
                    <p className="mt-1 text-lg font-semibold text-white">{scheduledCount}</p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
                <Card title="Article Library" subtitle="Select one article card to focus the editor">
                  <Input label="Search articles" value={articleSearchQuery} onChange={setArticleSearchQuery} />

                  <div className="max-h-[66vh] space-y-2 overflow-y-auto pr-1">
                    {filteredArticles.length === 0 ? (
                      <div className="rounded-[12px] border border-[#e5e7eb]
                        No articles match this search.
                      </div>
                    ) : (
                      filteredArticles.map((article) => {
                        const isActive = activeArticle?.id === article.id;
                        const isLive = article.visible && article.status === 'published';
                        return (
                          <button
                            key={article.id}
                            type="button"
                            onClick={() => setActiveArticleId(article.id)}
                            className={`w-full rounded-[14px] border p-3 text-left transition-all ${
                              isActive
                                ? 'border-[#3b82f6]/45 bg-[#3b82f6]/14 text-white'
                                : 'border-[#e5e7eb]
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="line-clamp-1 text-sm font-semibold text-white">{article.title}</p>
                              <span
                                className={`rounded-[999px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
                                  isLive
                                    ? 'border-[#22c55e]/35 bg-[#22c55e]/14 text-[#86efac]'
                                    : 'border-[#ef4444]/30 bg-[#ef4444]/14 text-[#fecaca]'
                                }`}
                              >
                                {isLive ? 'Live' : article.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#6b7280]
                              {article.category} • {article.readingMinutes} min • {new Date(article.publishedAt).toLocaleDateString('en-US')}
                            </p>
                          </button>
                        );
                      })
                    )}
                  </div>
                </Card>

                {activeArticle ? (
                  <Card title="Article Editor" subtitle={`Editing: ${activeArticle.title}`}>
                    <div className={`rounded-[12px] border px-3 py-2 text-xs ${articleCanGoLive ? dashboardStatusSuccessClass : dashboardStatusFailureClass}`}>
                      {articleCanGoLive
                        ? 'This article is live and visible on /articles.'
                        : 'This article is not live. Use Published status, keep Visible enabled, and provide a slug.'}
                    </div>

                    <div className="space-y-4">
                      <Input
                        label="Title"
                        value={activeArticle.title}
                        onChange={(next) => updateArticle(activeArticle.id, (article) => ({ ...article, title: next }))}
                      />
                      <Input
                        label="Slug"
                        value={activeArticle.slug}
                        onChange={(next) => updateArticle(activeArticle.id, (article) => ({ ...article, slug: next }))}
                      />
                      <Input
                        label="Category"
                        value={activeArticle.category}
                        onChange={(next) => updateArticle(activeArticle.id, (article) => ({ ...article, category: next }))}
                      />
                      <Input
                        label="Author"
                        value={activeArticle.author}
                        onChange={(next) => updateArticle(activeArticle.id, (article) => ({ ...article, author: next }))}
                      />
                      <Textarea
                        label="Excerpt"
                        value={activeArticle.excerpt}
                        rows={3}
                        onChange={(next) => updateArticle(activeArticle.id, (article) => ({ ...article, excerpt: next }))}
                      />
                      <Textarea
                        label="Content"
                        value={activeArticle.content}
                        rows={8}
                        onChange={(next) => updateArticle(activeArticle.id, (article) => ({ ...article, content: next }))}
                      />
                      <Input
                        label="Cover Image URL"
                        value={activeArticle.coverImage}
                        onChange={(next) => updateArticle(activeArticle.id, (article) => ({ ...article, coverImage: next }))}
                      />
                      <Input
                        label="Reading Minutes"
                        type="number"
                        min={1}
                        max={60}
                        value={activeArticle.readingMinutes}
                        onChange={(next) => updateArticle(activeArticle.id, (article) => ({ ...article, readingMinutes: Number(next) }))}
                      />
                      <SelectInput
                        label="Status"
                        value={activeArticle.status}
                        options={contentStatusOptions}
                        onChange={(next) => updateArticle(activeArticle.id, (article) => ({ ...article, status: next as SiteContentStatus }))}
                      />
                      <Toggle
                        label="Visible"
                        checked={activeArticle.visible}
                        onChange={(next) => updateArticle(activeArticle.id, (article) => ({ ...article, visible: next }))}
                      />
                      <Toggle
                        label="Featured"
                        checked={activeArticle.featured}
                        onChange={(next) => updateArticle(activeArticle.id, (article) => ({ ...article, featured: next }))}
                      />
                    </div>
                  </Card>
                ) : (
                  <Card title="Article Editor" subtitle="No article selected">
                    <p className="text-sm text-[#6b7280]
                  </Card>
                )}
              </div>
            </>
          )}

          {activePublishingSection === 'calendar' && (
            <>
              <Card title="Publishing Calendar" subtitle="View and manage scheduled content">
                <div className="space-y-4">
                  <div className="grid gap-2 sm:grid-cols-7">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
                      <div key={day} className="rounded-[8px] border border-[#e5e7eb]
                        <p className="text-[10px] font-mono uppercase text-[#6b7280]
                      </div>
                    ))}
                  </div>
                  <div className="grid gap-2 sm:grid-cols-7">
                    {Array.from({ length: 35 }).map((_, i) => {
                      const day = i + 1;
                      const hasScheduled = siteConfig.articles.some(
                        (article) => article.status === 'scheduled' && new Date(article.publishedAt).getDate() === day
                      );
                      return (
                        <div
                          key={i}
                          className={`rounded-[8px] border px-2 py-2 text-center ${
                            hasScheduled
                              ? 'border-[#3b82f6]/30 bg-[#3b82f6]/10'
                              : 'border-[#e5e7eb]
                          }`}
                        >
                          <p className="text-sm text-white">{day}</p>
                          {hasScheduled && <div className="mt-1 h-1 w-1 rounded-full bg-[#3b82f6]" />}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </Card>

              <Card title="Upcoming Publications" subtitle="Articles scheduled for publication">
                <div className="space-y-2">
                  {siteConfig.articles
                    .filter((article) => article.status === 'scheduled')
                    .sort((a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime())
                    .slice(0, 5)
                    .map((article) => (
                      <div key={article.id} className="rounded-[12px] border border-[#e5e7eb]
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{article.title}</p>
                          <span className="text-xs text-[#6b7280]
                            {new Date(article.publishedAt).toLocaleDateString('en-US')}
                          </span>
                        </div>
                      </div>
                    ))}
                  {siteConfig.articles.filter((article) => article.status === 'scheduled').length === 0 && (
                    <p className="text-sm text-[#6b7280]
                  )}
                </div>
              </Card>
            </>
          )}

          {activePublishingSection === 'performance' && (
            <>
              <Card title="Article Performance" subtitle="View statistics for all articles">
                <div className="space-y-3">
                  {siteConfig.articles
                    .filter((article) => article.status === 'published')
                    .slice(0, 10)
                    .map((article) => (
                      <div key={article.id} className="rounded-[12px] border border-[#e5e7eb]
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-white">{article.title}</p>
                          <span className="text-xs text-[#6b7280]
                        </div>
                        <div className="mt-2 grid grid-cols-3 gap-2">
                          <div>
                            <p className="text-[10px] text-[#6b7280]
                            <p className="text-sm font-semibold text-white">{Math.floor(Math.random() * 1000) + 100}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#6b7280]
                            <p className="text-sm font-semibold text-white">{Math.floor(Math.random() * 500) + 50}</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-[#6b7280]
                            <p className="text-sm font-semibold text-white">{Math.floor(Math.random() * 50) + 5}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  {siteConfig.articles.filter((article) => article.status === 'published').length === 0 && (
                    <p className="text-sm text-[#6b7280]
                  )}
                </div>
              </Card>

              <Card title="Overall Statistics" subtitle="Publishing performance overview">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {siteConfig.articles
                        .filter((article) => article.status === 'published')
                        .reduce((sum, article) => sum + Math.floor(Math.random() * 1000) + 100, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {(
                        siteConfig.articles
                          .filter((article) => article.status === 'published')
                          .reduce((sum, article) => sum + article.readingMinutes, 0) /
                        Math.max(1, siteConfig.articles.filter((article) => article.status === 'published').length)
                      ).toFixed(1)}
                      min
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-2xl font-semibold text-white">
                      {siteConfig.articles
                        .filter((article) => article.status === 'published')
                        .reduce((sum, article) => sum + Math.floor(Math.random() * 50) + 5, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            </>
          )}

          {activePublishingSection === 'settings' && (
            <>
              <Card title="Publishing Settings" subtitle="Configure publishing preferences">
                <Toggle
                  label="Auto-publish scheduled articles"
                  checked={true}
                  onChange={() => {}}
                />
                <Toggle
                  label="Send notifications on publish"
                  checked={false}
                  onChange={() => {}}
                />
                <Toggle
                  label="Enable social sharing"
                  checked={true}
                  onChange={() => {}}
                />
                <Input
                  label="Default author name"
                  value="Your Name"
                  onChange={() => {}}
                />
                <Input
                  label="Default reading time (minutes)"
                  type="number"
                  min={1}
                  max={60}
                  value={5}
                  onChange={() => {}}
                />
              </Card>

              <Card title="Content Guidelines" subtitle="Publishing standards and requirements">
                <div className="space-y-2">
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="text-sm text-white">• Minimum word count: 300 words</p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="text-sm text-white">• Required: Cover image and excerpt</p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="text-sm text-white">• Maximum title length: 100 characters</p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="text-sm text-white">• Categories: Insights, Tutorial, Case Study</p>
                  </div>
                </div>
              </Card>
            </>
          )}
        </section>
      </div>
    );
  };

  const renderPersonalHubWorkspace = () => {
    return (
      <div className="grid gap-5 xl:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="self-start rounded-[20px] border border-[#e5e7eb]
          <p className="px-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b7280]

          <div className="mt-3 max-h-[68vh] space-y-3 overflow-y-auto pr-1">
            {DASHBOARD_PERSONAL_HUB_SECTIONS.map((section) => {
              const SectionIcon = section.icon;
              return (
                <button
                  key={section.id}
                  type="button"
                  onClick={() => setActivePersonalHubSection(section.id)}
                  className={`group w-full rounded-[14px] border px-3.5 py-3 text-left transition-all duration-300 ${
                    activePersonalHubSection === section.id
                      ? 'border-[#3b82f6]/50 bg-[#3b82f6]/12 text-white shadow-[0_16px_34px_-24px_rgba(182,244,91,0.6)]'
                      : 'border-[#e5e7eb]
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <SectionIcon size={16} strokeWidth={1.8} />
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.15em]">{section.label}</p>
                      <p className={`mt-1 text-[12px] ${activePersonalHubSection === section.id ? 'text-[#6b7280]
                        {section.description}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="space-y-4">
          {activePersonalHubSection === 'partners' && (
            <>
              <Card title="Partners Management" subtitle="Target companies and freelance opportunities">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <p className="max-w-[560px] text-sm text-[#6b7280]
                    Manage your target companies, freelance opportunities, and partnership planning. Track contacts, follow-ups, and opportunities.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date().toISOString();
                      const nextPartner: SitePartner = {
                        id: `partner-${Date.now()}`,
                        name: 'New Partner',
                        type: 'agency',
                        status: 'prospect',
                        website: '',
                        email: '',
                        phone: '',
                        logo: '',
                        description: '',
                        notes: '',
                        createdAt: now,
                        lastContacted: now,
                        nextFollowUp: '',
                        tags: [],
                        visible: true,
                      };

                      updateConfig((prev) => ({
                        ...prev,
                        partners: [nextPartner, ...prev.partners],
                      }));
                    }}
                    className={dashboardActionButtonSecondaryClass}
                  >
                    Add Partner
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-4">
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.partners.length}</p>
                  </div>
                  <div className="rounded-[12px] border border-[#22c55e]/30 bg-[#22c55e]/12 px-3 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#86efac]">Active</p>
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.partners.filter((p) => p.status === 'active').length}</p>
                  </div>
                  <div className="rounded-[12px] border border-[#ef4444]/30 bg-[#ef4444]/12 px-3 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#fecaca]">Prospects</p>
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.partners.filter((p) => p.status === 'prospect').length}</p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.partners.filter((p) => p.nextFollowUp && new Date(p.nextFollowUp) <= new Date()).length}</p>
                  </div>
                </div>
              </Card>

              <div className="rounded-[20px] border border-[#e5e7eb]
                <div className="space-y-3">
                  {siteConfig.partners.length === 0 ? (
                    <p className="text-sm text-[#6b7280]
                  ) : (
                    siteConfig.partners.map((partner) => (
                      <div key={partner.id} className="rounded-[12px] border border-[#e5e7eb]
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{partner.name}</p>
                              <span className={`rounded-[999px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
                                partner.status === 'active'
                                  ? 'border-[#22c55e]/35 bg-[#22c55e]/14 text-[#86efac]'
                                  : partner.status === 'prospect'
                                    ? 'border-[#f59e0b]/35 bg-[#f59e0b]/14 text-[#fcd34d]'
                                    : 'border-[#e5e7eb]
                              }`}>
                                {partner.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#6b7280]
                            {partner.email && <p className="mt-1 text-xs text-[#6b7280]
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded-[8px] border border-[#e5e7eb]
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-[8px] border border-[#ef4444]/38 bg-[#ef4444]/14 text-[#fecaca] px-2 py-1 text-xs hover:bg-[#ef4444]/24"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activePersonalHubSection === 'projects' && (
            <>
              <Card title="Projects Management" subtitle="Current and completed project management">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <p className="max-w-[560px] text-sm text-[#6b7280]
                    Track all your projects with detailed information including budget, timeline, status, and financial details.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date().toISOString();
                      const nextProject: SitePersonalProject = {
                        id: `project-${Date.now()}`,
                        title: 'New Project',
                        description: '',
                        status: 'planning',
                        priority: 'medium',
                        startDate: now,
                        endDate: '',
                        estimatedBudget: 0,
                        actualBudget: 0,
                        client: '',
                        category: '',
                        tags: [],
                        progress: 0,
                        notes: '',
                        visible: true,
                      };

                      updateConfig((prev) => ({
                        ...prev,
                        personalProjects: [nextProject, ...prev.personalProjects],
                      }));
                    }}
                    className={dashboardActionButtonSecondaryClass}
                  >
                    Add Project
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-4">
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.personalProjects.length}</p>
                  </div>
                  <div className="rounded-[12px] border border-[#22c55e]/30 bg-[#22c55e]/12 px-3 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#86efac]">In Progress</p>
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.personalProjects.filter((p) => p.status === 'in_progress').length}</p>
                  </div>
                  <div className="rounded-[12px] border border-[#ef4444]/30 bg-[#ef4444]/12 px-3 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#fecaca]">Completed</p>
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.personalProjects.filter((p) => p.status === 'completed').length}</p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-lg font-semibold text-white">
                      ${siteConfig.personalProjects.reduce((sum, p) => sum + p.estimatedBudget, 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="rounded-[20px] border border-[#e5e7eb]
                <div className="space-y-3">
                  {siteConfig.personalProjects.length === 0 ? (
                    <p className="text-sm text-[#6b7280]
                  ) : (
                    siteConfig.personalProjects.map((project) => (
                      <div key={project.id} className="rounded-[12px] border border-[#e5e7eb]
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold text-white">{project.title}</p>
                              <span className={`rounded-[999px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
                                project.status === 'completed'
                                  ? 'border-[#22c55e]/35 bg-[#22c55e]/14 text-[#86efac]'
                                  : project.status === 'in_progress'
                                    ? 'border-[#3b82f6]/35 bg-[#3b82f6]/14 text-[#93c5fd]'
                                    : project.status === 'on_hold'
                                      ? 'border-[#f59e0b]/35 bg-[#f59e0b]/14 text-[#fcd34d]'
                                      : 'border-[#e5e7eb]
                              }`}>
                                {project.status}
                              </span>
                            </div>
                            <p className="mt-1 text-xs text-[#6b7280]
                            <div className="mt-2 flex items-center gap-4">
                              <div className="flex-1">
                                <div className="h-2 rounded-full bg-[#f8f9fa]
                                  <div
                                    className="h-2 rounded-full bg-[#3b82f6]"
                                    style={{ width: `${project.progress}%` }}
                                  />
                                </div>
                                <p className="mt-1 text-xs text-[#6b7280]
                              </div>
                              <p className="text-xs text-[#6b7280])}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              className="rounded-[8px] border border-[#e5e7eb]
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="rounded-[8px] border border-[#ef4444]/38 bg-[#ef4444]/14 text-[#fecaca] px-2 py-1 text-xs hover:bg-[#ef4444]/24"
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activePersonalHubSection === 'social' && (
            <>
              <Card title="Social Media Management" subtitle="Accounts and post scheduling">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <p className="max-w-[560px] text-sm text-[#6b7280]
                    Manage your social media accounts, schedule posts, and track engagement across all platforms.
                  </p>

                  <button
                    type="button"
                    onClick={() => {
                      const now = new Date().toISOString();
                      const nextAccount: SiteSocialAccount = {
                        id: `social-${Date.now()}`,
                        platform: 'twitter',
                        username: '',
                        displayName: '',
                        profileUrl: '',
                        followerCount: 0,
                        connected: false,
                        lastSynced: now,
                        visible: true,
                      };

                      updateConfig((prev) => ({
                        ...prev,
                        socialAccounts: [nextAccount, ...prev.socialAccounts],
                      }));
                    }}
                    className={dashboardActionButtonSecondaryClass}
                  >
                    Add Account
                  </button>
                </div>

                <div className="grid gap-2 sm:grid-cols-4">
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.socialAccounts.filter((a) => a.connected).length}</p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-lg font-semibold text-white">
                      {siteConfig.socialAccounts.reduce((sum, a) => sum + a.followerCount, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.socialPosts.filter((p) => p.status === 'scheduled').length}</p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.socialPosts.filter((p) => p.status === 'published').length}</p>
                  </div>
                </div>
              </Card>

              <div className="rounded-[20px] border border-[#e5e7eb]
                <h3 className="mb-3 text-sm font-semibold text-white">Connected Accounts</h3>
                <div className="space-y-2">
                  {siteConfig.socialAccounts.length === 0 ? (
                    <p className="text-sm text-[#6b7280]
                  ) : (
                    siteConfig.socialAccounts.map((account) => (
                      <div key={account.id} className="rounded-[12px] border border-[#e5e7eb]
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white capitalize">{account.platform}</p>
                            <p className="mt-1 text-xs text-[#6b7280]
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-[#6b7280])} followers</span>
                            <span className={`rounded-[999px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
                              account.connected
                                ? 'border-[#22c55e]/35 bg-[#22c55e]/14 text-[#86efac]'
                                : 'border-[#e5e7eb]
                            }`}>
                              {account.connected ? 'Connected' : 'Disconnected'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}

          {activePersonalHubSection === 'finance' && (
            <>
              <Card title="Financial Management" subtitle="Income, expenses, investments, and invoices">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <p className="max-w-[560px] text-sm text-[#6b7280]
                    Track your income, expenses, investments, and invoices. Get a complete overview of your financial health.
                  </p>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date().toISOString();
                        const nextTransaction: SiteFinancialTransaction = {
                          id: `transaction-${Date.now()}`,
                          type: 'income',
                          category: 'freelance',
                          amount: 0,
                          currency: 'USD',
                          description: '',
                          date: now,
                          tags: [],
                          visible: true,
                        };

                        updateConfig((prev) => ({
                          ...prev,
                          financialTransactions: [nextTransaction, ...prev.financialTransactions],
                        }));
                      }}
                      className={dashboardActionButtonSecondaryClass}
                    >
                      Add Transaction
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date().toISOString();
                        const nextInvoice: SiteInvoice = {
                          id: `invoice-${Date.now()}`,
                          invoiceNumber: `INV-${Date.now()}`,
                          clientId: '',
                          amount: 0,
                          currency: 'USD',
                          status: 'draft',
                          dueDate: '',
                          paidDate: '',
                          items: [],
                          notes: '',
                          visible: true,
                        };

                        updateConfig((prev) => ({
                          ...prev,
                          invoices: [nextInvoice, ...prev.invoices],
                        }));
                      }}
                      className={dashboardActionButtonSecondaryClass}
                    >
                      Create Invoice
                    </button>
                  </div>
                </div>

                <div className="grid gap-2 sm:grid-cols-4">
                  <div className="rounded-[12px] border border-[#22c55e]/30 bg-[#22c55e]/12 px-3 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#86efac]">Total Income</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      ${siteConfig.financialTransactions
                        .filter((t) => t.type === 'income')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-[#ef4444]/30 bg-[#ef4444]/12 px-3 py-2.5">
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#fecaca]">Total Expenses</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      ${siteConfig.financialTransactions
                        .filter((t) => t.type === 'expense')
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-lg font-semibold text-white">
                      ${siteConfig.investments.reduce((sum, i) => sum + i.currentValue, 0).toLocaleString()}
                    </p>
                  </div>
                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <p className="mt-1 text-lg font-semibold text-white">{siteConfig.invoices.filter((i) => i.status === 'sent').length}</p>
                  </div>
                </div>
              </Card>

              <div className="grid gap-4 xl:grid-cols-2">
                <div className="rounded-[20px] border border-[#e5e7eb]
                  <h3 className="mb-3 text-sm font-semibold text-white">Recent Transactions</h3>
                  <div className="space-y-2">
                    {siteConfig.financialTransactions.slice(0, 5).map((transaction) => (
                      <div key={transaction.id} className="rounded-[12px] border border-[#e5e7eb]
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{transaction.description || 'No description'}</p>
                            <p className="mt-1 text-xs text-[#6b7280]).toLocaleDateString()}</p>
                          </div>
                          <span className={`text-sm font-semibold ${
                            transaction.type === 'income' ? 'text-[#86efac]' : 'text-[#fecaca]'
                          }`}>
                            {transaction.type === 'income' ? '+' : '-'}${transaction.amount.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {siteConfig.financialTransactions.length === 0 && (
                      <p className="text-sm text-[#6b7280]
                    )}
                  </div>
                </div>

                <div className="rounded-[20px] border border-[#e5e7eb]
                  <h3 className="mb-3 text-sm font-semibold text-white">Recent Invoices</h3>
                  <div className="space-y-2">
                    {siteConfig.invoices.slice(0, 5).map((invoice) => (
                      <div key={invoice.id} className="rounded-[12px] border border-[#e5e7eb]
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-white">{invoice.invoiceNumber}</p>
                            <p className="mt-1 text-xs text-[#6b7280])}</p>
                          </div>
                          <span className={`rounded-[999px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
                            invoice.status === 'paid'
                              ? 'border-[#22c55e]/35 bg-[#22c55e]/14 text-[#86efac]'
                              : invoice.status === 'sent'
                                ? 'border-[#f59e0b]/35 bg-[#f59e0b]/14 text-[#fcd34d]'
                                : 'border-[#e5e7eb]
                          }`}>
                            {invoice.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {siteConfig.invoices.length === 0 && (
                      <p className="text-sm text-[#6b7280]
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </section>
      </div>
    );
  };

  const renderAIIntelligenceWorkspace = () => {
    const trackingQuery = trackingSearch.trim().toLowerCase();
    const filteredTracking = siteConfig.aiTracking.filter((tracking) => {
      if (!trackingQuery) return true;
      const haystack = [tracking.name, tracking.keywords.join(' '), tracking.notes].join(' ');
      return haystack.toLowerCase().includes(trackingQuery);
    });

    const activeTracking =
      siteConfig.aiTracking.find((tracking) => tracking.id === activeTrackingId) ?? filteredTracking[0] ?? siteConfig.aiTracking[0] ?? null;

    const trackingReports = activeTracking
      ? siteConfig.aiReports.filter((report) => report.trackingId === activeTracking.id)
      : [];

    const trackingTypeOptions: Array<{ value: AITrackingType; label: string }> = [
      { value: 'news', label: 'News Tracking' },
      { value: 'market', label: 'Market Monitoring' },
      { value: 'influencer', label: 'Influencer Tracking' },
      { value: 'competitor', label: 'Competitor Analysis' },
      { value: 'trend', label: 'Trend Analysis' },
    ];

    const frequencyOptions: Array<{ value: AIFrequency; label: string }> = [
      { value: 'hourly', label: 'Hourly' },
      { value: 'daily', label: 'Daily' },
      { value: 'weekly', label: 'Weekly' },
      { value: 'monthly', label: 'Monthly' },
    ];

    const updateTracking = (trackingId: string, updater: (tracking: SiteAITracking) => SiteAITracking) => {
      updateConfig((prev) => ({
        ...prev,
        aiTracking: prev.aiTracking.map((tracking) =>
          tracking.id === trackingId ? updater(tracking) : tracking,
        ),
      }));
    };

    const addTracking = () => {
      const now = new Date().toISOString();
      const nextTracking: SiteAITracking = {
        id: `tracking-${Date.now()}`,
        name: 'New Tracking',
        type: 'news',
        keywords: [],
        sources: [],
        frequency: 'daily',
        enabled: true,
        lastReport: now,
        nextReport: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        notes: '',
        visible: true,
      };
      updateConfig((prev) => ({
        ...prev,
        aiTracking: [...prev.aiTracking, nextTracking],
      }));
      setActiveTrackingId(nextTracking.id);
    };

    const deleteTracking = (trackingId: string) => {
      updateConfig((prev) => ({
        ...prev,
        aiTracking: prev.aiTracking.filter((tracking) => tracking.id !== trackingId),
      }));
      if (activeTrackingId === trackingId) {
        setActiveTrackingId(null);
      }
    };

    const generateReport = (trackingId: string) => {
      const now = new Date().toISOString();
      const tracking = siteConfig.aiTracking.find((t) => t.id === trackingId);
      if (!tracking) return;

      const newReport: SiteAIReport = {
        id: `report-${Date.now()}`,
        trackingId,
        title: `${tracking.name} - ${new Date().toLocaleDateString()}`,
        summary: `AI-generated report for ${tracking.name} tracking configuration.`,
        content: `This is a placeholder for AI-generated content. In production, this would contain detailed analysis based on the tracking configuration.\n\nKeywords: ${tracking.keywords.join(', ')}\nSources: ${tracking.sources.join(', ')}`,
        insights: [
          'Key insight 1 from AI analysis',
          'Key insight 2 from AI analysis',
          'Key insight 3 from AI analysis',
        ],
        recommendations: [
          'Recommendation 1 based on analysis',
          'Recommendation 2 based on analysis',
        ],
        generatedAt: now,
        read: false,
        visible: true,
      };

      updateConfig((prev) => ({
        ...prev,
        aiReports: [newReport, ...prev.aiReports],
        aiTracking: prev.aiTracking.map((t) =>
          t.id === trackingId
            ? {
                ...t,
                lastReport: now,
                nextReport: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              }
            : t,
        ),
      }));
    };

    return (
      <div className="space-y-4">
        <Card title="AI Intelligence" subtitle="News tracking, market monitoring, and AI reports">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <p className="max-w-[560px] text-sm text-[#6b7280]
              Configure AI-powered tracking for news, markets, influencers, and generate daily reports for decision making.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addTracking}
                className={`${dashboardActionButtonPrimaryClass} h-9`}
              >
                + New Tracking
              </button>
              <button
                type="button"
                onClick={() => setShowReports(!showReports)}
                className={`${dashboardActionButtonSecondaryClass} h-9`}
              >
                {showReports ? 'View Tracking' : 'View Reports'}
              </button>
            </div>
          </div>
        </Card>

        {showReports ? (
          <div className="space-y-4">
            <div className="rounded-[20px] border border-[#e5e7eb]
              <h3 className="mb-4 font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b7280]
              <div className="space-y-3">
                {siteConfig.aiReports.length === 0 ? (
                  <p className="text-sm text-[#6b7280]
                ) : (
                  siteConfig.aiReports.map((report) => {
                    const tracking = siteConfig.aiTracking.find((t) => t.id === report.trackingId);
                    return (
                      <div
                        key={report.id}
                        className={`rounded-[12px] border border-[#e5e7eb]
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <h4 className="font-semibold text-[#6b7280]
                            <p className="mt-1 text-xs text-[#6b7280]
                              {tracking?.name || 'Unknown Tracking'} • {new Date(report.generatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!report.read && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-[#3b82f6]" />
                          )}
                        </div>
                        <p className="text-sm text-[#6b7280]
                        <div className="flex flex-wrap gap-2">
                          {report.insights.slice(0, 2).map((insight, idx) => (
                            <span key={idx} className="inline-flex rounded-[8px] border border-[#e5e7eb]
                              {insight}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="space-y-3">
              <div className="rounded-[20px] border border-[#e5e7eb]
                <input
                  type="text"
                  placeholder="Search tracking..."
                  value={trackingSearch}
                  onChange={(e) => setTrackingSearch(e.target.value)}
                  className="w-full rounded-[10px] border border-[#e5e7eb]
                />
              </div>
              <div className="space-y-2">
                {filteredTracking.map((tracking) => (
                  <button
                    key={tracking.id}
                    type="button"
                    onClick={() => setActiveTrackingId(tracking.id)}
                    className={`w-full rounded-[12px] border p-3 text-left transition-all ${
                      activeTrackingId === tracking.id
                        ? 'border-[#3b82f6]/50 bg-[#3b82f6]/12 text-white'
                        : 'border-[#e5e7eb]
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm">{tracking.name}</span>
                      {tracking.enabled ? (
                        <span className="inline-flex h-2 w-2 rounded-full bg-[#22c55e]" />
                      ) : (
                        <span className="inline-flex h-2 w-2 rounded-full bg-[#f8f9fa]
                      )}
                    </div>
                    <p className="mt-1 text-xs text-[#6b7280]
                  </button>
                ))}
                {filteredTracking.length === 0 && (
                  <p className="text-center text-sm text-[#6b7280]
                )}
              </div>
            </div>

            {activeTracking ? (
              <div className="space-y-4">
                <div className="rounded-[20px] border border-[#e5e7eb]
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b7280]
                      {activeTracking.name}
                    </h3>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => generateReport(activeTracking.id)}
                        className={`${dashboardActionButtonPrimaryClass} h-8`}
                      >
                        Generate Report
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteTracking(activeTracking.id)}
                        className={`${dashboardActionButtonDangerClass} h-8`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Input
                      label="Name"
                      value={activeTracking.name}
                      onChange={(value) => updateTracking(activeTracking.id, (prev) => ({ ...prev, name: value }))}
                    />

                    <SelectInput
                      label="Type"
                      value={activeTracking.type}
                      options={trackingTypeOptions}
                      onChange={(value) =>
                        updateTracking(activeTracking.id, (prev) => ({ ...prev, type: value as AITrackingType }))
                      }
                    />

                    <SelectInput
                      label="Frequency"
                      value={activeTracking.frequency}
                      options={frequencyOptions}
                      onChange={(value) =>
                        updateTracking(activeTracking.id, (prev) => ({ ...prev, frequency: value as AIFrequency }))
                      }
                    />

                    <Toggle
                      label="Enabled"
                      checked={activeTracking.enabled}
                      onChange={(checked) => updateTracking(activeTracking.id, (prev) => ({ ...prev, enabled: checked }))}
                    />

                    <Textarea
                      label="Keywords (comma-separated)"
                      value={activeTracking.keywords.join(', ')}
                      onChange={(value) =>
                        updateTracking(activeTracking.id, (prev) => ({
                          ...prev,
                          keywords: parseTagsInput(value),
                        }))
                      }
                      rows={2}
                    />

                    <Textarea
                      label="Sources (comma-separated)"
                      value={activeTracking.sources.join(', ')}
                      onChange={(value) =>
                        updateTracking(activeTracking.id, (prev) => ({
                          ...prev,
                          sources: parseTagsInput(value),
                        }))
                      }
                      rows={2}
                    />

                    <Textarea
                      label="Notes"
                      value={activeTracking.notes}
                      onChange={(value) => updateTracking(activeTracking.id, (prev) => ({ ...prev, notes: value }))}
                      rows={3}
                    />

                    <div className="rounded-[12px] border border-[#e5e7eb]
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <p className="text-xs text-[#6b7280]
                          <p className="text-sm text-[#6b7280]
                            {activeTracking.lastReport ? new Date(activeTracking.lastReport).toLocaleString() : 'Never'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-[#6b7280]
                          <p className="text-sm text-[#6b7280]
                            {activeTracking.nextReport ? new Date(activeTracking.nextReport).toLocaleString() : 'Not scheduled'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {trackingReports.length > 0 && (
                      <div className="space-y-2">
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                        {trackingReports.slice(0, 3).map((report) => (
                          <div
                            key={report.id}
                            className={`rounded-[12px] border border-[#e5e7eb]
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-sm font-semibold text-[#6b7280]
                              {!report.read && <span className="inline-flex h-2 w-2 rounded-full bg-[#3b82f6]" />}
                            </div>
                            <p className="text-xs text-[#6b7280]).toLocaleString()}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="rounded-[20px] border border-[#e5e7eb]
                <p className="text-sm text-[#6b7280]
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderCommunicationWorkspace = () => {
    const emailQuery = emailSearch.trim().toLowerCase();
    const filteredEmails = siteConfig.emails.filter((email) => {
      if (!email.visible) return false;
      if (emailFilter !== 'all' && email.folder !== emailFilter) return false;
      if (!emailQuery) return true;
      const haystack = [email.from, email.subject, email.body, email.labels.join(' ')].join(' ');
      return haystack.toLowerCase().includes(emailQuery);
    });

    const activeEmail =
      siteConfig.emails.find((email) => email.id === activeEmailId) ?? filteredEmails[0] ?? siteConfig.emails[0] ?? null;

    const folderOptions: Array<{ value: EmailFolder; label: string; icon: LucideIcon }> = [
      { value: 'inbox', label: 'Inbox', icon: Inbox },
      { value: 'sent', label: 'Sent', icon: Mail },
      { value: 'drafts', label: 'Drafts', icon: FileText },
      { value: 'archive', label: 'Archive', icon: FileText },
      { value: 'spam', label: 'Spam', icon: FileText },
    ];

    const statusOptions: Array<{ value: EmailStatus; label: string }> = [
      { value: 'unread', label: 'Unread' },
      { value: 'read', label: 'Read' },
      { value: 'replied', label: 'Replied' },
      { value: 'forwarded', label: 'Forwarded' },
    ];

    const updateEmail = (emailId: string, updater: (email: SiteEmail) => SiteEmail) => {
      updateConfig((prev) => ({
        ...prev,
        emails: prev.emails.map((email) => (email.id === emailId ? updater(email) : email)),
      }));
    };

    const sendEmail = () => {
      if (!composeTo.trim() || !composeSubject.trim()) return;

      const now = new Date().toISOString();
      const newEmail: SiteEmail = {
        id: `email-${Date.now()}`,
        from: 'me@example.com',
        to: [composeTo],
        subject: composeSubject,
        body: composeBody,
        attachments: [],
        folder: 'sent',
        status: 'read',
        receivedAt: now,
        sentAt: now,
        labels: [],
        visible: true,
      };

      updateConfig((prev) => ({
        ...prev,
        emails: [newEmail, ...prev.emails],
      }));

      setComposeTo('');
      setComposeSubject('');
      setComposeBody('');
      setShowCompose(false);
    };

    const deleteEmail = (emailId: string) => {
      updateConfig((prev) => ({
        ...prev,
        emails: prev.emails.map((email) =>
          email.id === emailId ? { ...email, visible: false } : email,
        ),
      }));
      if (activeEmailId === emailId) {
        setActiveEmailId(null);
      }
    };

    const markAsRead = (emailId: string) => {
      updateEmail(emailId, (prev) => ({ ...prev, status: 'read' }));
    };

    const unreadCount = siteConfig.emails.filter((email) => email.visible && email.folder === 'inbox' && email.status === 'unread').length;

    return (
      <div className="space-y-4">
        <Card title="Communication" subtitle="Email client and communication management">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <p className="max-w-[560px] text-sm text-[#6b7280]
              Full email client with inbox management, compose, reply, and folder organization.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setShowCompose(true)}
                className={`${dashboardActionButtonPrimaryClass} h-9`}
              >
                + Compose
              </button>
            </div>
          </div>
        </Card>

        {showCompose ? (
          <div className="rounded-[20px] border border-[#e5e7eb]
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b7280]
              <button
                type="button"
                onClick={() => setShowCompose(false)}
                className={`${dashboardActionButtonSecondaryClass} h-8`}
              >
                Cancel
              </button>
            </div>
            <div className="space-y-4">
              <Input
                label="To"
                value={composeTo}
                onChange={setComposeTo}
              />
              <Input
                label="Subject"
                value={composeSubject}
                onChange={setComposeSubject}
              />
              <Textarea
                label="Body"
                value={composeBody}
                onChange={setComposeBody}
                rows={8}
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={sendEmail}
                  className={`${dashboardActionButtonPrimaryClass} h-9`}
                >
                  Send
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const now = new Date().toISOString();
                    const draftEmail: SiteEmail = {
                      id: `email-${Date.now()}`,
                      from: 'me@example.com',
                      to: composeTo ? [composeTo] : [],
                      subject: composeSubject,
                      body: composeBody,
                      attachments: [],
                      folder: 'drafts',
                      status: 'read',
                      receivedAt: now,
                      sentAt: now,
                      labels: [],
                      visible: true,
                    };
                    updateConfig((prev) => ({
                      ...prev,
                      emails: [draftEmail, ...prev.emails],
                    }));
                    setComposeTo('');
                    setComposeSubject('');
                    setComposeBody('');
                    setShowCompose(false);
                  }}
                  className={`${dashboardActionButtonSecondaryClass} h-9`}
                >
                  Save Draft
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
            <div className="space-y-3">
              <div className="rounded-[20px] border border-[#e5e7eb]
                <input
                  type="text"
                  placeholder="Search emails..."
                  value={emailSearch}
                  onChange={(e) => setEmailSearch(e.target.value)}
                  className="w-full rounded-[10px] border border-[#e5e7eb]
                />
              </div>
              <div className="space-y-2">
                {folderOptions.map((folder) => {
                  const Icon = folder.icon;
                  const count = siteConfig.emails.filter((email) => email.visible && email.folder === folder.value).length;
                  const unreadInFolder = siteConfig.emails.filter(
                    (email) => email.visible && email.folder === folder.value && email.status === 'unread',
                  ).length;

                  return (
                    <button
                      key={folder.value}
                      type="button"
                      onClick={() => setEmailFilter(folder.value)}
                      className={`w-full rounded-[12px] border p-3 text-left transition-all ${
                        emailFilter === folder.value
                          ? 'border-[#3b82f6]/50 bg-[#3b82f6]/12 text-white'
                          : 'border-[#e5e7eb]
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4" />
                          <span className="font-semibold text-sm">{folder.label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {unreadInFolder > 0 && (
                            <span className="inline-flex h-2 w-2 rounded-full bg-[#3b82f6]" />
                          )}
                          <span className="text-xs text-[#6b7280]
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-[20px] border border-[#e5e7eb]
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b7280]
                    {folderOptions.find((f) => f.value === emailFilter)?.label || 'Emails'}
                    {unreadCount > 0 && emailFilter === 'inbox' && (
                      <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-[#3b82f6]" />
                    )}
                  </h3>
                  <span className="text-xs text-[#6b7280]
                </div>

                <div className="space-y-2">
                  {filteredEmails.length === 0 ? (
                    <p className="text-center text-sm text-[#6b7280]
                  ) : (
                    filteredEmails.map((email) => (
                      <button
                        key={email.id}
                        type="button"
                        onClick={() => {
                          setActiveEmailId(email.id);
                          if (email.status === 'unread') {
                            markAsRead(email.id);
                          }
                        }}
                        className={`w-full rounded-[12px] border p-4 text-left transition-all ${
                          activeEmailId === email.id
                            ? 'border-[#3b82f6]/50 bg-[#3b82f6]/12 text-white'
                            : 'border-[#e5e7eb]
                        } ${email.status === 'unread' ? 'border-l-4 border-l-[#3b82f6]' : ''}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-[#6b7280]
                              {email.status === 'unread' && (
                                <span className="inline-flex h-2 w-2 rounded-full bg-[#3b82f6]" />
                              )}
                            </div>
                            <p className="mt-1 truncate text-sm font-medium text-[#6b7280]
                            <p className="mt-1 line-clamp-2 text-xs text-[#6b7280]
                          </div>
                          <span className="whitespace-nowrap text-xs text-[#6b7280]
                            {new Date(email.receivedAt).toLocaleDateString()}
                          </span>
                        </div>
                        {email.labels.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {email.labels.map((label, idx) => (
                              <span
                                key={idx}
                                className="inline-flex rounded-[6px] border border-[#e5e7eb]
                              >
                                {label}
                              </span>
                            ))}
                          </div>
                        )}
                      </button>
                    ))
                  )}
                </div>
              </div>

              {activeEmail && (
                <div className="rounded-[20px] border border-[#e5e7eb]
                  <div className="mb-4 flex items-center justify-between">
                    <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b7280]
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setComposeTo(activeEmail.from);
                          setComposeSubject(`Re: ${activeEmail.subject}`);
                          setComposeBody(`\n\n--- Original Message ---\nFrom: ${activeEmail.from}\nSubject: ${activeEmail.subject}\n\n${activeEmail.body}`);
                          setShowCompose(true);
                        }}
                        className={`${dashboardActionButtonSecondaryClass} h-8`}
                      >
                        Reply
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteEmail(activeEmail.id)}
                        className={`${dashboardActionButtonDangerClass} h-8`}
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <p className="text-sm text-[#6b7280]
                    </div>

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <p className="text-sm text-[#6b7280])}</p>
                    </div>

                    {activeEmail.cc && activeEmail.cc.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                        <p className="text-sm text-[#6b7280])}</p>
                      </div>
                    )}

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <p className="text-sm font-semibold text-[#6b7280]
                    </div>

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <p className="text-sm text-[#6b7280]).toLocaleString()}</p>
                    </div>

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <SelectInput
                        value={activeEmail.status}
                        options={statusOptions}
                        onChange={(value) =>
                          updateEmail(activeEmail.id, (prev) => ({ ...prev, status: value as EmailStatus }))
                        }
                      />
                    </div>

                    <div>
                      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                      <div className="rounded-[10px] border border-[#e5e7eb]
                        <p className="whitespace-pre-wrap text-sm text-[#6b7280]
                      </div>
                    </div>

                    {activeEmail.attachments.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                        <div className="space-y-2">
                          {activeEmail.attachments.map((attachment, idx) => (
                            <div
                              key={idx}
                              className="flex items-center justify-between rounded-[8px] border border-[#e5e7eb]
                            >
                              <span className="text-sm text-[#6b7280]
                              <span className="text-xs text-[#6b7280])}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {activeEmail.labels.length > 0 && (
                      <div>
                        <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                        <div className="flex flex-wrap gap-2">
                          {activeEmail.labels.map((label, idx) => (
                            <span
                              key={idx}
                              className="inline-flex rounded-[8px] border border-[#e5e7eb]
                            >
                              {label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderNotesWorkspace = () => {
    const noteQuery = noteSearch.trim().toLowerCase();
    const filteredNotes = siteConfig.notes.filter((note) => {
      if (!note.visible) return false;
      if (noteCategoryFilter !== 'all' && note.category !== noteCategoryFilter) return false;
      if (!noteQuery) return true;
      const haystack = [note.title, note.content, note.tags.join(' ')].join(' ');
      return haystack.toLowerCase().includes(noteQuery);
    });

    const activeNote =
      siteConfig.notes.find((note) => note.id === activeNoteId) ?? filteredNotes[0] ?? siteConfig.notes[0] ?? null;

    const categoryOptions: Array<{ value: NoteCategory | 'all'; label: string }> = [
      { value: 'all', label: 'All Categories' },
      { value: 'work', label: 'Work' },
      { value: 'personal', label: 'Personal' },
      { value: 'ideas', label: 'Ideas' },
      { value: 'meeting', label: 'Meeting' },
      { value: 'reference', label: 'Reference' },
      { value: 'other', label: 'Other' },
    ];

    const colorOptions: Array<{ value: string; label: string; color: string }> = [
      { value: '#3b82f6', label: 'Green', color: 'bg-[#3b82f6]' },
      { value: '#60a5fa', label: 'Blue', color: 'bg-[#60a5fa]' },
      { value: '#f472b6', label: 'Pink', color: 'bg-[#f472b6]' },
      { value: '#fbbf24', label: 'Yellow', color: 'bg-[#fbbf24]' },
      { value: '#a78bfa', label: 'Purple', color: 'bg-[#a78bfa]' },
      { value: '#34d399', label: 'Teal', color: 'bg-[#34d399]' },
    ];

    const updateNote = (noteId: string, updater: (note: SiteNote) => SiteNote) => {
      updateConfig((prev) => ({
        ...prev,
        notes: prev.notes.map((note) => (note.id === noteId ? updater(note) : note)),
      }));
    };

    const addNote = () => {
      const now = new Date().toISOString();
      const nextNote: SiteNote = {
        id: `note-${Date.now()}`,
        title: 'New Note',
        content: '',
        category: 'other',
        tags: [],
        createdAt: now,
        updatedAt: now,
        pinned: false,
        color: '#3b82f6',
        visible: true,
      };
      updateConfig((prev) => ({
        ...prev,
        notes: [nextNote, ...prev.notes],
      }));
      setActiveNoteId(nextNote.id);
    };

    const deleteNote = (noteId: string) => {
      updateConfig((prev) => ({
        ...prev,
        notes: prev.notes.map((note) => (note.id === noteId ? { ...note, visible: false } : note)),
      }));
      if (activeNoteId === noteId) {
        setActiveNoteId(null);
      }
    };

    const togglePin = (noteId: string) => {
      updateNote(noteId, (prev) => ({ ...prev, pinned: !prev.pinned }));
    };

    const pinnedNotes = filteredNotes.filter((note) => note.pinned);
    const unpinnedNotes = filteredNotes.filter((note) => !note.pinned);

    return (
      <div className="space-y-4">
        <Card title="Notes" subtitle="Personal note-taking and knowledge management">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <p className="max-w-[560px] text-sm text-[#6b7280]
              Create and manage personal notes with categories, tags, and search functionality.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={addNote}
                className={`${dashboardActionButtonPrimaryClass} h-9`}
              >
                + New Note
              </button>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
          <div className="space-y-3">
            <div className="rounded-[20px] border border-[#e5e7eb]
              <input
                type="text"
                placeholder="Search notes..."
                value={noteSearch}
                onChange={(e) => setNoteSearch(e.target.value)}
                className="w-full rounded-[10px] border border-[#e5e7eb]
              />
              <select
                value={noteCategoryFilter}
                onChange={(e) => setNoteCategoryFilter(e.target.value as NoteCategory | 'all')}
                className="w-full rounded-[10px] border border-[#e5e7eb]
              >
                {categoryOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              {pinnedNotes.length > 0 && (
                <>
                  <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                  {pinnedNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => setActiveNoteId(note.id)}
                      className={`w-full rounded-[12px] border p-3 text-left transition-all ${
                        activeNoteId === note.id
                          ? 'border-[#3b82f6]/50 bg-[#3b82f6]/12 text-white'
                          : 'border-[#e5e7eb]
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: note.color }} />
                            <span className="font-semibold text-sm text-[#6b7280]
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-[#6b7280]
                        </div>
                        <span className="text-[#6b7280]
                          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828zM5 13H3v-2.828l7.586-7.586a2 2 0 012.828 0l1.414 1.414L7 10.172V13z" />
                          </svg>
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex rounded-[6px] border border-[#e5e7eb]
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {unpinnedNotes.length > 0 && (
                <>
                  {pinnedNotes.length > 0 && (
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                  )}
                  {unpinnedNotes.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => setActiveNoteId(note.id)}
                      className={`w-full rounded-[12px] border p-3 text-left transition-all ${
                        activeNoteId === note.id
                          ? 'border-[#3b82f6]/50 bg-[#3b82f6]/12 text-white'
                          : 'border-[#e5e7eb]
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: note.color }} />
                            <span className="font-semibold text-sm text-[#6b7280]
                          </div>
                          <p className="mt-1 line-clamp-2 text-xs text-[#6b7280]
                        </div>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {note.tags.slice(0, 2).map((tag, idx) => (
                          <span
                            key={idx}
                            className="inline-flex rounded-[6px] border border-[#e5e7eb]
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </>
              )}

              {filteredNotes.length === 0 && (
                <p className="text-center text-sm text-[#6b7280]
              )}
            </div>
          </div>

          {activeNote ? (
            <div className="space-y-4">
              <div className="rounded-[20px] border border-[#e5e7eb]
                <div className="mb-4 flex items-center justify-between">
                  <h3 className="font-mono text-[11px] uppercase tracking-[0.2em] text-[#6b7280]
                    {activeNote.title}
                  </h3>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => togglePin(activeNote.id)}
                      className={`${dashboardActionButtonSecondaryClass} h-8`}
                      title={activeNote.pinned ? 'Unpin' : 'Pin'}
                    >
                      {activeNote.pinned ? '📌 Unpin' : '📌 Pin'}
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteNote(activeNote.id)}
                      className={`${dashboardActionButtonDangerClass} h-8`}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Input
                    label="Title"
                    value={activeNote.title}
                    onChange={(value) =>
                      updateNote(activeNote.id, (prev) => ({ ...prev, title: value, updatedAt: new Date().toISOString() }))
                    }
                  />

                  <SelectInput
                    label="Category"
                    value={activeNote.category}
                    options={categoryOptions.filter((opt) => opt.value !== 'all')}
                    onChange={(value) =>
                      updateNote(activeNote.id, (prev) => ({ ...prev, category: value as NoteCategory, updatedAt: new Date().toISOString() }))
                    }
                  />

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() =>
                            updateNote(activeNote.id, (prev) => ({ ...prev, color: option.value, updatedAt: new Date().toISOString() }))
                          }
                          className={`h-8 w-8 rounded-full border-2 transition-all ${
                            activeNote.color === option.value
                              ? 'border-white scale-110'
                              : 'border-[#e5e7eb]
                          } ${option.color}`}
                          title={option.label}
                        />
                      ))}
                    </div>
                  </div>

                  <Textarea
                    label="Content"
                    value={activeNote.content}
                    onChange={(value) =>
                      updateNote(activeNote.id, (prev) => ({ ...prev, content: value, updatedAt: new Date().toISOString() }))
                    }
                    rows={12}
                  />

                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280])</p>
                    <input
                      type="text"
                      value={activeNote.tags.join(', ')}
                      onChange={(e) =>
                        updateNote(activeNote.id, (prev) => ({
                          ...prev,
                          tags: parseTagsInput(e.target.value),
                          updatedAt: new Date().toISOString(),
                        }))
                      }
                      className="w-full rounded-[10px] border border-[#e5e7eb]
                    />
                  </div>

                  <div className="rounded-[12px] border border-[#e5e7eb]
                    <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <p className="text-xs text-[#6b7280]
                        <p className="text-sm text-[#6b7280]).toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#6b7280]
                        <p className="text-sm text-[#6b7280]).toLocaleString()}</p>
                      </div>
                    </div>
                  </div>

                  <Toggle
                    label="Visible"
                    checked={activeNote.visible}
                    onChange={(checked) =>
                      updateNote(activeNote.id, (prev) => ({ ...prev, visible: checked, updatedAt: new Date().toISOString() }))
                    }
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-[20px] border border-[#e5e7eb]
              <p className="text-sm text-[#6b7280]
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderArticlesWorkspace = () => {
    const contentStatusOptions: Array<{ value: SiteContentStatus; label: string }> = [
      { value: 'draft', label: 'Draft' },
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'published', label: 'Published' },
    ];

    const articleQuery = articleSearchQuery.trim().toLowerCase();

    const filteredArticles = siteConfig.articles.filter((article) => {
      if (!articleQuery) return true;
      const haystack = [article.title, article.slug, article.category, article.author, article.excerpt, article.tags.join(' ')].join(' ');
      return haystack.toLowerCase().includes(articleQuery);
    });

    const activeArticle =
      siteConfig.articles.find((article) => article.id === activeArticleId) ?? filteredArticles[0] ?? siteConfig.articles[0] ?? null;

    const liveArticlesCount = siteConfig.articles.filter((article) => article.visible && article.status === 'published').length;
    const scheduledCount = siteConfig.articles.filter((article) => article.status === 'scheduled').length;

    const articleCanGoLive = Boolean(
      activeArticle && activeArticle.visible && activeArticle.status === 'published' && activeArticle.slug.trim().length > 0,
    );

    return (
      <div className="space-y-4">
        <Card title="Articles Studio" subtitle="Create, publish, and preview articles from one focused workspace">
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <p className="max-w-[560px] text-sm text-[#6b7280]
              Build a focused publishing workflow around articles only. Create drafts, schedule launches, and push live posts from one editor.
            </p>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  const now = new Date().toISOString();
                  const nextArticle: SiteArticle = {
                    id: `article-${Date.now()}`,
                    title: 'New Article',
                    slug: `new-article-${Date.now()}`,
                    excerpt: 'Write a short summary for this article.',
                    content: 'Write your article body here.',
                    coverImage: '/frames/scene-03-screen-entry/ezgif-frame-001.jpg',
                    author: 'Your Name',
                    category: 'Insights',
                    tags: ['insight'],
                    readingMinutes: 6,
                    status: 'draft',
                    featured: false,
                    visible: true,
                    publishedAt: now,
                    videoUrl: '',
                  };

                  updateConfig((prev) => ({
                    ...prev,
                    articles: [nextArticle, ...prev.articles],
                  }));

                  setActiveArticleId(nextArticle.id);
                }}
                className={dashboardActionButtonSecondaryClass}
              >
                New Article
              </button>

              <button type="button" onClick={handleOpenArticlesPage} className={dashboardActionButtonPrimaryClass}>
                Open Articles Page
              </button>
            </div>
          </div>

          <div className="grid gap-2 sm:grid-cols-3">
            <div className="rounded-[12px] border border-[#e5e7eb]
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
              <p className="mt-1 text-lg font-semibold text-white">{siteConfig.articles.length}</p>
            </div>
            <div className="rounded-[12px] border border-[#22c55e]/30 bg-[#22c55e]/12 px-3 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#86efac]">Live on /articles</p>
              <p className="mt-1 text-lg font-semibold text-white">{liveArticlesCount}</p>
            </div>
            <div className="rounded-[12px] border border-[#ef4444]/30 bg-[#ef4444]/12 px-3 py-2.5">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#fecaca]">Scheduled Queue</p>
              <p className="mt-1 text-lg font-semibold text-white">{scheduledCount}</p>
            </div>
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <Card title="Article Library" subtitle="Select one article card to focus the editor">
            <Input label="Search articles" value={articleSearchQuery} onChange={setArticleSearchQuery} />

            <div className="max-h-[66vh] space-y-2 overflow-y-auto pr-1">
              {filteredArticles.length === 0 ? (
                <div className="rounded-[12px] border border-[#e5e7eb]
                  No articles match this search.
                </div>
              ) : (
                filteredArticles.map((article) => {
                  const isActive = activeArticle?.id === article.id;
                  const isLive = article.visible && article.status === 'published';
                  return (
                    <button
                      key={article.id}
                      type="button"
                      onClick={() => setActiveArticleId(article.id)}
                      className={`w-full rounded-[14px] border p-3 text-left transition-all ${
                        isActive
                          ? 'border-[#3b82f6]/45 bg-[#3b82f6]/14 text-white'
                          : 'border-[#e5e7eb]
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="line-clamp-1 text-sm font-semibold text-white">{article.title}</p>
                        <span
                          className={`rounded-[999px] border px-2 py-0.5 font-mono text-[9px] uppercase tracking-[0.12em] ${
                            isLive
                              ? 'border-[#22c55e]/35 bg-[#22c55e]/14 text-[#86efac]'
                              : 'border-[#ef4444]/30 bg-[#ef4444]/14 text-[#fecaca]'
                          }`}
                        >
                          {isLive ? 'Live' : article.status}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[#6b7280]
                        {article.category} • {article.readingMinutes} min • {new Date(article.publishedAt).toLocaleDateString('en-US')}
                      </p>
                    </button>
                  );
                })
              )}
            </div>
          </Card>

          {activeArticle ? (
            <Card title="Article Editor" subtitle={`Editing: ${activeArticle.title}`}>
              <div className={`rounded-[12px] border px-3 py-2 text-xs ${articleCanGoLive ? dashboardStatusSuccessClass : dashboardStatusFailureClass}`}>
                {articleCanGoLive
                  ? 'This article is live and visible on /articles.'
                  : 'This article is not live. Use Published status, keep Visible enabled, and provide a slug.'}
              </div>

              <div className="grid gap-3 xl:grid-cols-2">
                <Input
                  label="Title"
                  value={activeArticle.title}
                  onChange={(next) => updateArticle(activeArticle.id, (item) => ({ ...item, title: next }))}
                />
                <Input
                  label="Slug"
                  value={activeArticle.slug}
                  onChange={(next) => updateArticle(activeArticle.id, (item) => ({ ...item, slug: slugify(next) }))}
                />
                <Input
                  label="Author"
                  value={activeArticle.author}
                  onChange={(next) => updateArticle(activeArticle.id, (item) => ({ ...item, author: next }))}
                />
                <Input
                  label="Category"
                  value={activeArticle.category}
                  onChange={(next) => updateArticle(activeArticle.id, (item) => ({ ...item, category: next }))}
                />
              </div>

              <div className="grid gap-3 xl:grid-cols-3">
                <SelectInput
                  label="Status"
                  value={activeArticle.status}
                  options={contentStatusOptions}
                  onChange={(next) => updateArticle(activeArticle.id, (item) => ({ ...item, status: next as SiteContentStatus }))}
                />
                <Input
                  label="Reading Minutes"
                  type="number"
                  min={1}
                  max={60}
                  step={1}
                  value={activeArticle.readingMinutes}
                  onChange={(next) =>
                    updateArticle(activeArticle.id, (item) => ({
                      ...item,
                      readingMinutes: toSafeNumberInRange(next, item.readingMinutes, 1, 60),
                    }))
                  }
                />
                <Input
                  label="Published At"
                  type="datetime-local"
                  value={toDateTimeLocalValue(activeArticle.publishedAt)}
                  onChange={(next) =>
                    updateArticle(activeArticle.id, (item) => ({
                      ...item,
                      publishedAt: fromDateTimeLocalValue(next, item.publishedAt),
                    }))
                  }
                />
              </div>

              <Input
                label="Cover Image URL"
                value={activeArticle.coverImage}
                onChange={(next) => updateArticle(activeArticle.id, (item) => ({ ...item, coverImage: next }))}
              />

              <Input
                label="Tags (comma separated)"
                value={activeArticle.tags.join(', ')}
                onChange={(next) => updateArticle(activeArticle.id, (item) => ({ ...item, tags: parseTagsInput(next) }))}
              />

              <Textarea
                label="Excerpt"
                value={activeArticle.excerpt}
                rows={4}
                onChange={(next) => updateArticle(activeArticle.id, (item) => ({ ...item, excerpt: next }))}
              />

              <Textarea
                label="Content"
                value={activeArticle.content}
                rows={14}
                onChange={(next) => updateArticle(activeArticle.id, (item) => ({ ...item, content: next }))}
              />

              <div className="grid gap-3 md:grid-cols-3">
                <Toggle
                  label="Visible"
                  checked={activeArticle.visible}
                  onChange={(next) => updateArticle(activeArticle.id, (item) => ({ ...item, visible: next }))}
                />
                <Toggle
                  label="Featured"
                  checked={activeArticle.featured}
                  onChange={(next) => updateArticle(activeArticle.id, (item) => ({ ...item, featured: next }))}
                />
                <button
                  type="button"
                  onClick={() => {
                    const remaining = siteConfig.articles.filter((item) => item.id !== activeArticle.id);
                    updateConfig((prev) => ({
                      ...prev,
                      articles: prev.articles.filter((item) => item.id !== activeArticle.id),
                    }));
                    setActiveArticleId(remaining[0]?.id ?? null);
                  }}
                  className={dashboardActionButtonDangerClass}
                >
                  Remove Article
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={handleOpenArticlesPage} className={dashboardActionButtonSecondaryClass}>
                  Open Articles Page
                </button>
                <button
                  type="button"
                  onClick={() => handleOpenArticlePreview(activeArticle.slug)}
                  disabled={!articleCanGoLive}
                  className={`${articleCanGoLive ? dashboardActionButtonPrimaryClass : `${dashboardActionButtonSecondaryClass} pointer-events-none opacity-55`}`}
                >
                  Preview Live Article
                </button>
              </div>
            </Card>
          ) : (
            <Card title="Article Editor" subtitle="No article selected">
              <p className="text-sm text-[#6b7280]
            </Card>
          )}
        </div>
      </div>
    );
  };

  const renderSettingsWorkspace = () => {
    return (
      <div className="space-y-4">
        <section className="rounded-[18px] border border-[#e5e7eb]
          <p className="px-2 pb-2 font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b7280]
          <div className="flex flex-wrap gap-2">
            {DASHBOARD_SETTINGS_PANELS.map((panel) => (
              <button
                key={panel.id}
                type="button"
                onClick={() => setActiveSettingsPanel(panel.id)}
                className={`rounded-[11px] border px-3 py-2 text-left transition-all ${
                  activeSettingsPanel === panel.id
                    ? 'border-[#3b82f6]/45 bg-[#3b82f6]/14 text-white'
                    : 'border-[#e5e7eb]
                }`}
              >
                <p className="font-mono text-[10px] uppercase tracking-[0.14em]">{panel.label}</p>
                <p className={`mt-1 text-[12px] ${activeSettingsPanel === panel.id ? 'text-[#6b7280]
                  {panel.description}
                </p>
              </button>
            ))}
          </div>
        </section>

        {activeSettingsPanel === 'browser' ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Card title="Browser Identity" subtitle="Control tab title and favicon from dashboard">
              <Input
                label="Browser tab title"
                value={siteConfig.dashboard.browser.browserTabTitle}
                onChange={(next) => updateDashboardBrowser('browserTabTitle', next)}
              />
              <Input
                label="Favicon URL"
                value={siteConfig.dashboard.browser.faviconUrl}
                onChange={(next) => updateDashboardBrowser('faviconUrl', next)}
              />
              <label className="flex flex-col gap-1.5">
                <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#111217]/66">Upload favicon</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    e.currentTarget.value = '';
                    void handleFaviconUpload(file);
                  }}
                  className="rounded-[10px] border border-[#e5e7eb]
                />
              </label>
            </Card>

            <aside className="rounded-[18px] border border-[#e5e7eb]
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#6b7280]
              <div className="mt-3 space-y-3">
                <div className="rounded-[12px] border border-[#e5e7eb]
                  <p className="text-xs text-[#6b7280]
                  <p className="mt-1 font-medium text-white">{siteConfig.dashboard.browser.browserTabTitle || 'Untitled site'}</p>
                </div>
                <div className="rounded-[12px] border border-[#e5e7eb]
                  <p className="text-xs text-[#6b7280]
                  <div className="mt-2 flex items-center gap-2">
                    <span className="inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-[10px] border border-[#e5e7eb]
                      {siteConfig.dashboard.browser.faviconUrl ? (
                        <img src={siteConfig.dashboard.browser.faviconUrl} alt="Favicon preview" className="h-full w-full object-cover" />
                      ) : (
                        <span className="font-mono text-[10px] text-[#6b7280]
                      )}
                    </span>
                    <p className="text-xs text-[#6b7280]
                  </div>
                </div>
              </div>
            </aside>
          </section>
        ) : null}

        {activeSettingsPanel === 'integrations' ? (
          <section className="grid gap-4 xl:grid-cols-2">
            <Card title="Integrations" subtitle="API, domain, and analytics connection settings">
              <Input
                label="API base URL"
                value={siteConfig.dashboard.integrations.apiBaseUrl}
                onChange={(next) => updateDashboardIntegration('apiBaseUrl', next)}
              />
              <Input
                label="Custom domain"
                value={siteConfig.dashboard.integrations.customDomain}
                onChange={(next) => updateDashboardIntegration('customDomain', next)}
              />
              <Input
                label="Google Analytics measurement ID"
                value={siteConfig.dashboard.integrations.googleAnalyticsMeasurementId}
                onChange={(next) => updateDashboardIntegration('googleAnalyticsMeasurementId', next)}
              />
              <Toggle
                label="Enable Google Analytics"
                checked={siteConfig.dashboard.integrations.googleAnalyticsEnabled}
                onChange={(next) => updateDashboardIntegration('googleAnalyticsEnabled', next)}
              />
            </Card>

            <Card title="Connection Health" subtitle="Current integration readiness and missing requirements">
              <div className="rounded-[12px] border border-[#e5e7eb]
                API base URL: <span className="font-semibold text-white">{siteConfig.dashboard.integrations.apiBaseUrl || 'Not set'}</span>
              </div>
              <div className="rounded-[12px] border border-[#e5e7eb]
                Domain: <span className="font-semibold text-white">{siteConfig.dashboard.integrations.customDomain || 'Not set'}</span>
              </div>
              <div
                className={`rounded-[12px] border px-3 py-3 text-sm ${
                  stats.gaConnected ? dashboardStatusSuccessClass : dashboardStatusFailureClass
                }`}
              >
                {stats.gaConnected ? 'Google Analytics connection is healthy.' : 'Google Analytics needs a valid measurement ID and enabled toggle.'}
              </div>
            </Card>
          </section>
        ) : null}

        {activeSettingsPanel === 'inbox' ? (
          <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <Card title="Inbox Routing" subtitle="Define where incoming messages are sent">
              <Input
                label="Forward incoming messages to"
                value={siteConfig.dashboard.inbox.forwardToEmail}
                onChange={(next) => updateDashboardInbox('forwardToEmail', next)}
              />
              <Toggle
                label="Enable auto-reply"
                checked={siteConfig.dashboard.inbox.autoReplyEnabled}
                onChange={(next) => updateDashboardInbox('autoReplyEnabled', next)}
              />
            </Card>

            <aside className="rounded-[18px] border border-[#e5e7eb]
              <p className="font-mono text-[10px] uppercase tracking-[0.15em] text-[#6b7280]
              <div className="mt-3 space-y-2">
                <div className="rounded-[12px] border border-[#e5e7eb]
                  <p className="text-xs text-[#6b7280]
                  <p className="mt-1 text-lg font-semibold text-white">{stats.inboxTotal}</p>
                </div>
                <div className="rounded-[12px] border border-[#e5e7eb]
                  <p className="text-xs text-[#6b7280]
                  <p className="mt-1 text-lg font-semibold text-white">{stats.inboxUnread}</p>
                </div>
                <div className="rounded-[12px] border border-[#e5e7eb]
                  <p className="text-xs text-[#6b7280]
                  <p className="mt-1 text-lg font-semibold text-white">{stats.inboxArchived}</p>
                </div>
              </div>
            </aside>
          </section>
        ) : null}
      </div>
    );
  };

  const renderAnalyticsWorkspace = () => {
    const channels = siteConfig.dashboard.analytics.topChannels;
    const maxSessions = Math.max(1, ...channels.map((item) => item.sessions));
    const trendSeries = Array.from({ length: 14 }, (_, index) => {
      const wave = Math.sin((index / 13) * Math.PI * 1.8) * 0.18;
      const growth = index * 0.012;
      const visitors = Math.max(80, Math.round((siteConfig.dashboard.analytics.monthlyVisitors / 28) * (0.72 + wave + growth)));
      return {
        label: `D${index + 1}`,
        visitors,
      };
    });
    const maxTrendVisitors = Math.max(...trendSeries.map((item) => item.visitors));
    const monthlyVisitors = siteConfig.dashboard.analytics.monthlyVisitors;
    const conversionRate = siteConfig.dashboard.analytics.conversionRate;
    const conversions = Math.round((monthlyVisitors * conversionRate) / 100);
    const engaged = Math.round(monthlyVisitors * 0.42);
    const qualifiedLeads = Math.max(conversions, Math.round(engaged * 0.24));
    const funnel = [
      { id: 'sessions', label: 'Sessions', value: monthlyVisitors },
      { id: 'engaged', label: 'Engaged Sessions', value: engaged },
      { id: 'leads', label: 'Qualified Leads', value: qualifiedLeads },
      { id: 'conversions', label: 'Conversions', value: conversions },
    ];
    const maxFunnelValue = Math.max(1, ...funnel.map((item) => item.value));

    return (
      <div className="grid gap-4">
        <Card title="KPI Snapshot" subtitle="Current website analytics metrics">
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-[12px] border border-[#e5e7eb]
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
              <p className="mt-1 text-2xl font-semibold text-white">{monthlyVisitors.toLocaleString()}</p>
              <p className="mt-1 text-xs text-[#6b7280]
            </div>
            <div className="rounded-[12px] border border-[#e5e7eb]
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
              <p className="mt-1 text-2xl font-semibold text-white">{conversionRate.toFixed(1)}%</p>
              <p className="mt-1 text-xs text-[#6b7280]
            </div>
            <div className="rounded-[12px] border border-[#e5e7eb]
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
              <p className="mt-1 text-2xl font-semibold text-white">
                {Math.max(0, Math.round(siteConfig.dashboard.analytics.avgSessionDurationSec / 60))}m
              </p>
              <p className="mt-1 text-xs text-[#6b7280]
            </div>
            <div className="rounded-[12px] border border-[#e5e7eb]
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#6b7280]
              <p className="mt-1 text-2xl font-semibold text-white">{conversions.toLocaleString()}</p>
              <p className="mt-1 text-xs text-[#6b7280]
            </div>
          </div>
        </Card>

        <Card title="Traffic Trend (14 Days)" subtitle="Session trend simulation based on current visitor profile">
          <div className="grid grid-cols-[repeat(14,minmax(0,1fr))] gap-2">
            {trendSeries.map((point) => (
              <div key={point.label} className="flex flex-col items-center gap-2">
                <div className="flex h-[140px] w-full items-end rounded-[8px] bg-[#f8f9fa]
                  <div
                    className="w-full rounded-[6px] bg-[#3b82f6]"
                    style={{ height: `${Math.max(8, (point.visitors / maxTrendVisitors) * 100)}%` }}
                  />
                </div>
                <span className="font-mono text-[9px] uppercase tracking-[0.08em] text-[#6b7280]
              </div>
            ))}
          </div>
        </Card>

        <div className="grid gap-4 xl:grid-cols-2">
          <Card title="Acquisition Mix" subtitle="Channel distribution and trend direction">
            <div className="space-y-3">
              {channels.map((channel) => (
                <div key={channel.id} className="rounded-[12px] border border-[#e5e7eb]
                  <div className="flex items-center justify-between gap-2 text-sm text-white">
                    <span className="font-semibold">{channel.label}</span>
                    <span>{channel.sessions.toLocaleString()} sessions</span>
                  </div>
                  <div className="mt-2 h-2 rounded-full bg-[#f8f9fa]
                    <div
                      className="h-2 rounded-full bg-[#3b82f6]"
                      style={{ width: `${Math.max(6, (channel.sessions / maxSessions) * 100)}%` }}
                    />
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs text-[#6b7280]
                    <span>Conv: {channel.conversionRate.toFixed(1)}%</span>
                    <span className={channel.trendPct >= 0 ? 'text-[#86efac]' : 'text-[#fecaca]'}>
                      Trend {channel.trendPct >= 0 ? '+' : ''}
                      {channel.trendPct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Conversion Funnel" subtitle="How traffic narrows down to completed conversions">
            <div className="space-y-3">
              {funnel.map((stage) => (
                <div key={stage.id} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 text-sm text-white">
                    <span>{stage.label}</span>
                    <span className="font-semibold">{stage.value.toLocaleString()}</span>
                  </div>
                  <div className="h-3 rounded-full bg-[#f8f9fa]
                    <div
                      className="h-3 rounded-full bg-[#f59e0b]"
                      style={{ width: `${Math.max(8, (stage.value / maxFunnelValue) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    );
  };

  const renderMessagesWorkspace = () => {
    const filteredMessages = siteConfig.dashboard.inbox.items
      .slice()
      .sort((a, b) => new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime())
      .filter((message) => (messageFilter === 'all' ? true : message.status === messageFilter))
      .filter((message) => {
        const query = messageSearch.trim().toLowerCase();
        if (!query) return true;
        const haystack = `${message.senderName} ${message.companyName} ${message.subject} ${message.email}`.toLowerCase();
        return haystack.includes(query);
      });

    const activeMessage =
      filteredMessages.find((message) => message.id === activeMessageId) ?? filteredMessages[0] ?? null;

    return (
      <div className="grid gap-4 xl:grid-cols-[380px_minmax(0,1fr)]">
        <aside className="rounded-[18px] border border-[#e5e7eb]
          <div className="space-y-2">
            <input
              type="text"
              value={messageSearch}
              onChange={(e) => setMessageSearch(e.target.value)}
              placeholder="Search messages"
              className="w-full rounded-[10px] border border-[#e5e7eb]
            />

            <div className="flex flex-wrap gap-2">
              {[
                { id: 'all', label: `All (${stats.inboxTotal})` },
                { id: 'new', label: `New (${stats.inboxUnread})` },
                { id: 'read', label: 'Read' },
                { id: 'archived', label: `Archived (${stats.inboxArchived})` },
              ].map((option) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setMessageFilter(option.id as 'all' | SiteMessageStatus)}
                  className={`rounded-[999px] border px-2.5 py-1 text-[11px] ${
                    messageFilter === option.id
                      ? 'border-[#3b82f6]/45 bg-[#3b82f6]/16 text-[#ffffff]'
                      : 'border-[#e5e7eb]
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => {
                const now = new Date().toISOString();
                const nextMessage: SiteInboxMessage = {
                  id: `inbox-${Date.now()}`,
                  senderName: 'New Contact',
                  companyName: 'Company',
                  email: 'contact@example.com',
                  subject: 'New inquiry',
                  message: 'Message content from website form.',
                  receivedAt: now,
                  status: 'new',
                  source: 'website',
                };

                updateDashboardInbox('items', [nextMessage, ...siteConfig.dashboard.inbox.items]);
                setActiveMessageId(nextMessage.id);
              }}
              className={dashboardActionButtonSecondaryClass}
            >
              Add Test Message
            </button>
          </div>

          <div className="mt-3 overflow-hidden rounded-[14px] border border-[#e5e7eb]
            {filteredMessages.length === 0 ? (
              <div className="px-3 py-5 text-sm text-[#6b7280]
            ) : (
              filteredMessages.map((message) => (
                <button
                  key={message.id}
                  type="button"
                  onClick={() => {
                    setActiveMessageId(message.id);
                    if (message.status === 'new') {
                      updateInboxMessage(message.id, (item) => ({ ...item, status: 'read' }));
                    }
                  }}
                  className={`w-full border-b border-[#e5e7eb]
                    activeMessage?.id === message.id ? 'bg-[#f8f9fa]
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-semibold text-white">{message.senderName}</p>
                    <span className="text-[11px] text-[#6b7280]
                      {new Date(message.receivedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-[#6b7280]
                  <p className="mt-1 truncate text-[11px] text-[#6b7280]
                </button>
              ))
            )}
          </div>
        </aside>

        <section className="min-w-0">
          {activeMessage ? (
            <div className="rounded-[18px] border border-[#e5e7eb]
              <div className="border-b border-[#e5e7eb]
                <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#6b7280]
                <h2 className="mt-1 text-xl font-semibold text-white">{activeMessage.subject}</h2>
                <p className="mt-1 text-sm text-[#6b7280]
                  From {activeMessage.senderName} at {activeMessage.companyName} • {activeMessage.email}
                </p>
              </div>

              <div className="mt-4 rounded-[12px] border border-[#e5e7eb]
                {activeMessage.message}
              </div>

              <div className="mt-4 grid gap-2 md:grid-cols-4">
                <button
                  type="button"
                  onClick={() => updateInboxMessage(activeMessage.id, (item) => ({ ...item, status: 'new' as SiteMessageStatus }))}
                  className={dashboardActionButtonSecondaryClass}
                >
                  Mark New
                </button>
                <button
                  type="button"
                  onClick={() => updateInboxMessage(activeMessage.id, (item) => ({ ...item, status: 'read' as SiteMessageStatus }))}
                  className={dashboardActionButtonSecondaryClass}
                >
                  Mark Read
                </button>
                <button
                  type="button"
                  onClick={() => updateInboxMessage(activeMessage.id, (item) => ({ ...item, status: 'archived' as SiteMessageStatus }))}
                  className={dashboardActionButtonSecondaryClass}
                >
                  Archive
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const remaining = siteConfig.dashboard.inbox.items.filter((item) => item.id !== activeMessage.id);
                    updateDashboardInbox('items', remaining);
                    setActiveMessageId(remaining[0]?.id ?? null);
                  }}
                  className={dashboardActionButtonDangerClass}
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <Card title="Inbox" subtitle="No message selected">
              <p className="text-sm text-[#111217]/62">Choose a message from the list to view details.</p>
            </Card>
          )}
        </section>
      </div>
    );
  };

  const renderWorkspaceContent = () => {
    switch (activeWorkspace) {
      case 'sitePages':
        return renderSitePagesWorkspace();
      case 'designSystem':
        return renderDesignSystemWorkspace();
      case 'siteIntegrations':
        return renderSiteIntegrationsWorkspace();
      case 'publishing':
        return renderPublishingWorkspace();
      case 'analytics':
        return renderAnalyticsWorkspace();
      case 'messages':
        return renderMessagesWorkspace();
      case 'personalHub':
        return renderPersonalHubWorkspace();
      case 'aiIntelligence':
        return renderAIIntelligenceWorkspace();
      case 'communication':
        return renderCommunicationWorkspace();
      case 'notes':
        return renderNotesWorkspace();
      default:
        return null;
    }
  };


  if (!isUnlocked) {
    return (
      <main className="dashboard-mono flex min-h-screen items-center justify-center bg-[#ffffff] px-4 text-[#111217]">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-[440px] rounded-[16px] border border-[#111217]/12 bg-white p-6 shadow-[0_22px_50px_-38px_rgba(17,18,23,0.45)]"
        >
          <h1 className="font-mono text-[12px] uppercase tracking-[0.28em] text-[#111217]/90">Dashboard Access</h1>
          <p className="mt-3 text-sm text-[#111217]/65">Hidden control panel. Enter password to continue.</p>

          <label className="mt-5 flex flex-col gap-2">
            <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-[#111217]/70">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-[10px] border border-[#111217]/14 bg-white px-3 py-2 text-[#111217] outline-none focus:border-[#111217]/30"
              autoFocus
            />
          </label>

          {authError ? <p className="mt-3 text-sm text-[#111217]/76">{authError}</p> : null}

          <button
            type="submit"
            className="mt-5 inline-flex items-center justify-center rounded-[10px] border border-[#111217]/15 bg-[#111217] px-4 py-2 font-mono text-[10px] uppercase tracking-[0.16em] text-white transition-colors hover:bg-black"
          >
            Unlock
          </button>

          <p className="mt-4 text-xs text-[#111217]/45">Open this page with the hidden route: #/dashboard</p>
        </form>
      </main>
    );
  }

  return (
    <main className="dashboard-mono min-h-screen p-2 md:p-4 bg-[#f8f9fa] text-[#1a1a1a]">
      <div className="dashboard-shell mx-auto w-full max-w-[1600px] rounded-[16px] border border-[#e5e7eb] bg-white p-2 md:p-3 shadow-sm">
        <div className="grid gap-3 lg:grid-cols-[60px_minmax(0,1fr)]">
          <aside className="dashboard-sidebar flex min-h-[600px] flex-col rounded-[12px] border border-[#e5e7eb] bg-[#f8f9fa] p-2">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-white p-1.5">
              <img src={dashboardLogoSrc} alt={dashboardLogoAlt} className="h-full w-full object-contain" />
            </span>

            <div className="mt-2 flex flex-col gap-1.5">
              {DASHBOARD_WORKSPACES.map((workspace) => {
                const active = workspace.id === activeWorkspace;
                const WorkspaceIcon = workspace.icon;
                return (
                  <button
                    key={`rail-${workspace.id}`}
                    type="button"
                    onClick={() => {
                      setActiveWorkspace(workspace.id);
                      clearUploadFeedback();
                    }}
                    className={`inline-flex h-9 w-9 items-center justify-center rounded-[8px] border font-mono text-[9px] uppercase tracking-[0.12em] transition-all ${
                      active
                        ? 'border-[#3b82f6] bg-[#3b82f6] text-white'
                        : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#ffffff] hover:text-[#1a1a1a]'
                    }`}
                    title={workspace.label}
                  >
                    <WorkspaceIcon size={14} strokeWidth={1.8} />
                  </button>
                );
              })}
            </div>

            <div className="mt-auto flex flex-col gap-1.5 pt-2">
              <button
                type="button"
                onClick={handleSaveChanges}
                title="Save changes"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#3b82f6] bg-[#3b82f6] text-white"
              >
                <Save size={14} strokeWidth={1.9} />
              </button>
              <button
                type="button"
                onClick={handleOpenSite}
                title="Open site"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#ffffff]"
              >
                <ExternalLink size={14} strokeWidth={1.9} />
              </button>
              <button
                type="button"
                onClick={() => {
                  resetSiteConfig();
                  clearUploadFeedback();
                  setHasUnsavedChanges(false);
                }}
                title="Reset defaults"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#ffffff]"
              >
                <RotateCcw size={14} strokeWidth={1.9} />
              </button>
              <button
                type="button"
                onClick={handleLogout}
                title="Logout"
                className="inline-flex h-9 w-9 items-center justify-center rounded-[8px] border border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444]/20"
              >
                <LogOut size={14} strokeWidth={1.9} />
              </button>
            </div>
          </aside>

          <section className="dashboard-main min-w-0 rounded-[12px] border border-[#e5e7eb] bg-white p-2 md:p-3">
            <div className="dashboard-toolbar flex flex-col gap-2 rounded-[10px] border border-[#e5e7eb] bg-[#f8f9fa] px-2 py-2 xl:flex-row xl:items-center xl:justify-between">
              <div className="flex flex-wrap items-center gap-1.5">
                {DASHBOARD_WORKSPACES.map((workspace) => {
                  const active = workspace.id === activeWorkspace;
                  const badge =
                    workspace.id === 'sitePages'
                      ? `${stats.projects + stats.articles}`
                      : workspace.id === 'designSystem'
                        ? 'System'
                        : workspace.id === 'siteIntegrations'
                          ? stats.gaConnected
                            ? 'Ready'
                            : 'Setup'
                          : workspace.id === 'publishing'
                            ? `${stats.articles}`
                          : workspace.id === 'analytics'
                            ? compactMonthlyVisitors
                          : workspace.id === 'messages'
                            ? `${stats.inboxUnread}`
                          : workspace.id === 'personalHub'
                            ? `${stats.partners + stats.personalProjects}`
                          : workspace.id === 'aiIntelligence'
                            ? `${stats.aiTracking}`
                          : workspace.id === 'communication'
                            ? `${stats.emails}`
                          : workspace.id === 'notes'
                            ? `${stats.notes}`
                          : '0';

                  return (
                    <button
                      key={workspace.id}
                      type="button"
                      onClick={() => {
                        setActiveWorkspace(workspace.id);
                        clearUploadFeedback();
                      }}
                      className={`dashboard-nav-item inline-flex items-center gap-1.5 rounded-[999px] border px-2 py-1 text-left transition-all ${
                        active
                          ? 'border-[#3b82f6] bg-[#3b82f6] text-white'
                          : 'border-[#e5e7eb] bg-white text-[#6b7280] hover:bg-[#ffffff]'
                      }`}
                    >
                      <span className="font-medium text-[11px]">{workspace.label}</span>
                      <span className={`rounded-[999px] border px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-[0.1em] ${
                        active
                          ? 'border-[#e5e7eb]
                          : 'border-[#e5e7eb] bg-[#f8f9fa] text-[#6b7280]'
                      }`}>
                        {badge}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="flex w-full flex-col gap-1.5 sm:w-auto sm:flex-row sm:items-center">
                <label className="w-full sm:w-[280px]">
                  <input
                    type="text"
                    placeholder="Search workspace"
                    className="w-full rounded-[999px] border border-[#e5e7eb] bg-white px-3 py-1.5 text-[12px] text-[#1a1a1a] outline-none placeholder:text-[#9ca3af] focus:border-[#3b82f6] focus:ring-1 focus:ring-[#3b82f6]"
                  />
                </label>
                <div className="inline-flex items-center gap-1.5 rounded-[999px] border border-[#e5e7eb] bg-white px-2 py-1">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#e5e7eb] bg-[#f8f9fa] p-1">
                    <img src={dashboardLogoSrc} alt={dashboardLogoAlt} className="h-full w-full object-contain" />
                  </span>
                  <div className="pr-1">
                    <p className="text-[11px] font-medium text-[#1a1a1a]">Web Studio</p>
                    <p className="text-[9px] text-[#6b7280]">@dashboard</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#6b7280]">Dashboard Control</p>
                <h1 className="mt-0.5 text-xl font-semibold leading-tight text-[#1a1a1a]">{activeWorkspaceInfo.label}</h1>
                <p className="mt-0.5 text-xs text-[#6b7280]">{activeWorkspaceInfo.description}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="rounded-[999px] border border-[#e5e7eb] bg-[#f8f9fa] px-2 py-0.5 text-[10px] text-[#6b7280]">Date: {currentDateLabel}</span>
                <span className={`rounded-[999px] border px-2 py-0.5 text-[10px] ${hasUnsavedChanges ? 'border-[#ef4444] bg-[#ef4444]/10 text-[#ef4444]' : 'border-[#22c55e] bg-[#22c55e]/10 text-[#22c55e]'}`}>
                  {hasUnsavedChanges ? 'Changes pending' : 'Synced'}
                </span>
              </div>
            </div>

            <section className="dashboard-kpis mt-3 grid gap-1.5 sm:grid-cols-2 xl:grid-cols-4">
              <div className="dashboard-kpi rounded-[10px] border border-[#e5e7eb] bg-[#f8f9fa] p-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b7280]">Content Units</p>
                <p className="mt-0.5 text-lg font-semibold text-[#1a1a1a]">{stats.projects + stats.articles}</p>
                <p className="mt-0.5 text-[10px] text-[#6b7280]">Projects and articles</p>
              </div>

              <div className="dashboard-kpi dashboard-kpi-primary rounded-[10px] border border-[#3b82f6] bg-[#3b82f6]/10 p-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#3b82f6]">Unread Messages</p>
                <p className="mt-0.5 text-lg font-semibold text-[#1a1a1a]">{stats.inboxUnread}</p>
                <p className="mt-0.5 text-[10px] text-[#6b7280]">Leads waiting for follow-up</p>
              </div>

              <div className="dashboard-kpi rounded-[10px] border border-[#e5e7eb] bg-[#f8f9fa] p-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b7280]">GA Integration</p>
                <p className="mt-0.5 text-base font-semibold text-[#1a1a1a]">{stats.gaConnected ? 'Connected' : 'Not Connected'}</p>
                <p className="mt-0.5 truncate text-[10px] text-[#6b7280]">
                  {siteConfig.dashboard.integrations.googleAnalyticsMeasurementId || 'No measurement ID'}
                </p>
              </div>

              <div className="dashboard-kpi rounded-[10px] border border-[#e5e7eb] bg-[#f8f9fa] p-2">
                <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-[#6b7280]">Monthly Visitors</p>
                <p className="mt-0.5 text-lg font-semibold text-[#1a1a1a]">{siteConfig.dashboard.analytics.monthlyVisitors.toLocaleString()}</p>
                <p className="mt-0.5 text-[10px] text-[#6b7280]">Conversion {siteConfig.dashboard.analytics.conversionRate.toFixed(1)}%</p>
              </div>
            </section>

            <div className="mt-3 flex flex-wrap gap-1.5">
              <button type="button" onClick={handleSaveChanges} className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#3b82f6] bg-[#3b82f6] px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-white transition-colors hover:bg-[#2563eb]">
                Save Changes
              </button>
              <button type="button" onClick={handleOpenSite} className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e7eb] bg-white px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1a1a1a] transition-colors hover:bg-[#ffffff]">
                Open Site
              </button>
              <button
                type="button"
                onClick={() => {
                  resetSiteConfig();
                  clearUploadFeedback();
                  setHasUnsavedChanges(false);
                }}
                className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#e5e7eb] bg-white px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#1a1a1a] transition-colors hover:bg-[#ffffff]"
              >
                Reset Defaults
              </button>
              <button type="button" onClick={handleLogout} className="inline-flex h-8 items-center justify-center rounded-[8px] border border-[#ef4444] bg-[#ef4444]/10 px-3 font-mono text-[9px] uppercase tracking-[0.14em] text-[#ef4444] transition-colors hover:bg-[#ef4444]/20">
                Logout
              </button>
            </div>

            <section className="mt-3 space-y-3">
              {activeWorkspace !== 'sitePages' && uploadError ? (
                <div className="rounded-[10px] border border-[#ef4444] bg-[#ef4444]/10 px-3 py-2 text-sm text-[#ef4444]">
                  {uploadError}
                </div>
              ) : null}
              {activeWorkspace !== 'sitePages' && uploadMessage ? (
                <div className="rounded-[10px] border border-[#22c55e] bg-[#22c55e]/10 px-3 py-2 text-sm text-[#22c55e]">
                  {uploadMessage}
                </div>
              ) : null}

              <div className="dashboard-workspace dashboard-workspace-surface rounded-[12px] border border-[#e5e7eb] bg-white p-3 md:p-4">
                {renderWorkspaceContent()}
              </div>
            </section>
          </section>
        </div>
      </div>
    </main>
  );
};

export default Dashboard;



