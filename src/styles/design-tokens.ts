export const colors = {
  page: '#f8fafc',
  card: '#ffffff',
  border: '#e5e7eb',
  primary: '#0f172a',
  secondary: '#64748b',
  muted: '#94a3b8',
  accent: '#2563eb',
  accentBg: '#eff6ff',
  danger: '#dc2626',
  dangerBg: '#fee2e2',
  dangerText: '#991b1b',
  warning: '#d97706',
  warningBg: '#fef3c7',
  warningText: '#92400e',
  success: '#16a34a',
  successBg: '#dcfce7',
  successText: '#166534',
  neutralBg: '#f1f5f9',
  neutralText: '#334155',
  neutralBorder: '#cbd5e1',
  white: '#ffffff',
} as const;

export const spacing = {
  pagePadding: '24px',
  cardPadding: '20px',
  cardPaddingLg: '24px',
  gapSm: '8px',
  gapMd: '12px',
  gapLg: '16px',
  gapXl: '24px',
} as const;

export const radius = {
  sm: '6px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(15,23,42,0.04)',
  md: '0 2px 6px rgba(15,23,42,0.06)',
  lg: '0 4px 12px rgba(15,23,42,0.08)',
  xl: '0 8px 24px rgba(15,23,42,0.1)',
} as const;

export const fontSize = {
  xs: '11px',
  sm: '12px',
  base: '13px',
  md: '14px',
  lg: '16px',
  xl: '18px',
  '2xl': '22px',
} as const;

export const fontWeight = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
} as const;

export const tokens = {
  colors,
  spacing,
  radius,
  shadow,
  fontSize,
  fontWeight,
};
