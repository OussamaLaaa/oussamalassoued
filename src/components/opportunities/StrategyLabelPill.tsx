import React from 'react';

const TONE_CLASSES: Record<string, string> = {
 high: 'border-[#fecaca] bg-[#fee2e2] text-[#991b1b]',
 medium: 'border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]',
 low: 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]',
 danger: 'border-[#fca5a5] bg-[#fef2f2] text-[#b91c1c]',
 success: 'border-[#86efac] bg-[#f0fdf4] text-[#166534]',
 neutral: 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]',
};

const LabelPill: React.FC<{ text: string; tone?: keyof typeof TONE_CLASSES }> = ({ text, tone = 'neutral' }) => (
 <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium leading-5 ${TONE_CLASSES[tone] || TONE_CLASSES.neutral}`}>
 {text}
 </span>
);

export default LabelPill;
