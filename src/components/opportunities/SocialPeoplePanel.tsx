import React, { useMemo, useState } from 'react';
import type { SocialPerson, SocialPersonInput, SocialPersonPriority, SocialPersonStatus } from '../../types/opportunities';
import DirectionalText from '../ui/DirectionalText';
import { useLanguage } from '../../hooks/useLanguage';

const PRIORITY_STYLES: Record<SocialPersonPriority, string> = {
  strategic: 'border-violet-200 bg-violet-50 text-violet-700',
  high: 'border-amber-200 bg-amber-50 text-amber-700',
  medium: 'border-blue-200 bg-blue-50 text-blue-700',
  low: 'border-neutral-200 bg-neutral-50 text-neutral-500',
};

const PRIORITIES: SocialPersonPriority[] = ['high', 'medium', 'low', 'strategic'];
const STATUS_OPTIONS: SocialPersonStatus[] = ['active', 'paused', 'archived'];

function formatDate(date?: string) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return '';
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/^(javascript|data|file):/i.test(trimmed)) return '';
  return `https://${trimmed}`;
}

function isValidHttpUrl(url: string): boolean {
  if (!url) return true;
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

const PLATFORM_ICONS: Record<string, string> = {
  linkedin: 'in',
  instagram: 'ig',
  x: 'X',
  website: 'web',
};

interface SocialPeoplePanelProps {
  socialPeople: SocialPerson[];
  onAddSocialPerson: (input: SocialPersonInput) => Promise<SocialPerson>;
  onUpdateSocialPerson: (id: string, input: Partial<SocialPersonInput>) => Promise<SocialPerson>;
  onDeleteSocialPerson: (id: string) => Promise<void>;
}

const emptyForm = (): SocialPersonInput => ({
  name: '',
  linkedinUrl: '',
  instagramUrl: '',
  xUrl: '',
  websiteUrl: '',
  priority: 'medium',
  category: '',
  reason: '',
  interactionGoal: '',
  lastInteractionAt: '',
  nextInteractionAt: '',
  status: 'active',
  notes: '',
});

export default function SocialPeoplePanel(props: SocialPeoplePanelProps) {
  const { t } = useLanguage();
  const [search, setSearch] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<SocialPersonPriority | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<SocialPersonStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SocialPersonInput>(emptyForm());
  const [formErrors, setFormErrors] = useState<string | null>(null);

  const filtered = useMemo(() => {
    let result = props.socialPeople;
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        (p.category || '').toLowerCase().includes(q) ||
        (p.reason || '').toLowerCase().includes(q) ||
        (p.notes || '').toLowerCase().includes(q)
      );
    }
    if (priorityFilter !== 'all') {
      result = result.filter((p) => p.priority === priorityFilter);
    }
    if (statusFilter !== 'all') {
      result = result.filter((p) => p.status === statusFilter);
    }
    return result;
  }, [props.socialPeople, search, priorityFilter, statusFilter]);

  const metrics = useMemo(() => {
    const active = props.socialPeople.filter((p) => p.status === 'active').length;
    const strategic = props.socialPeople.filter((p) => p.priority === 'strategic').length;
    const high = props.socialPeople.filter((p) => p.priority === 'high').length;
    const needInteraction = props.socialPeople.filter((p) => {
      if (p.status !== 'active') return false;
      if (!p.nextInteractionAt) return true;
      return new Date(p.nextInteractionAt) <= new Date();
    }).length;
    return { total: props.socialPeople.length, active, strategic, high, needInteraction };
  }, [props.socialPeople]);

  function resetForm() {
    setForm(emptyForm());
    setEditingId(null);
    setFormErrors(null);
  }

  function openEdit(person: SocialPerson) {
    setEditingId(person.id);
    setForm({
      name: person.name,
      linkedinUrl: person.linkedinUrl || '',
      instagramUrl: person.instagramUrl || '',
      xUrl: person.xUrl || '',
      websiteUrl: person.websiteUrl || '',
      priority: person.priority,
      category: person.category || '',
      reason: person.reason || '',
      interactionGoal: person.interactionGoal || '',
      lastInteractionAt: person.lastInteractionAt || '',
      nextInteractionAt: person.nextInteractionAt || '',
      status: person.status,
      notes: person.notes || '',
    });
    setFormErrors(null);
    setShowForm(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormErrors(t('Name is required.', 'الاسم مطلوب.'));
      return;
    }
    const normalized: SocialPersonInput = {
      ...form,
      linkedinUrl: normalizeUrl(form.linkedinUrl || ''),
      instagramUrl: normalizeUrl(form.instagramUrl || ''),
      xUrl: normalizeUrl(form.xUrl || ''),
      websiteUrl: normalizeUrl(form.websiteUrl || ''),
    };
    for (const key of ['linkedinUrl', 'instagramUrl', 'xUrl', 'websiteUrl'] as const) {
      const val = normalized[key];
      if (val && !isValidHttpUrl(val)) {
        setFormErrors(t(`Invalid ${key.replace('Url', '')} URL.`, `رابط ${key.replace('Url', '')} غير صالح.`));
        return;
      }
    }
    try {
      if (editingId) {
        await props.onUpdateSocialPerson(editingId, normalized);
      } else {
        await props.onAddSocialPerson(normalized);
      }
      setShowForm(false);
      resetForm();
    } catch {
      setFormErrors(t('Failed to save. Please try again.', 'فشل الحفظ. حاول مرة أخرى.'));
    }
  }

  async function handleDelete(id: string) {
    await props.onDeleteSocialPerson(id);
  }

  async function handleMarkInteracted(id: string) {
    const now = new Date().toISOString();
    const next = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    await props.onUpdateSocialPerson(id, { lastInteractionAt: now, nextInteractionAt: next });
  }

  return (
    <section className="space-y-7">
      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-900">{t('People', 'الأشخاص')}</h2>
          <p className="mt-0.5 text-sm text-neutral-500">{t('Track social media relationships and interactions.', 'تتبع علاقات و تفاعلات وسائل التواصل الاجتماعي.')}</p>
        </div>
        <button type="button" onClick={() => { resetForm(); setShowForm(true); }} className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition-colors">{t('+ Add Person', '+ إضافة شخص')}</button>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-5">
        {[
          { label: t('Total', 'الإجمالي'), value: metrics.total },
          { label: t('Active', 'نشط'), value: metrics.active },
          { label: t('Strategic', 'استراتيجي'), value: metrics.strategic },
          { label: t('High Priority', 'أولوية عالية'), value: metrics.high },
          { label: t('Need Interaction', 'بحاجة تفاعل'), value: metrics.needInteraction },
        ].map((m) => (
          <div key={m.label} className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-2xl font-semibold text-neutral-900">{m.value}</div>
            <div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">{m.label}</div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t('Search people...', 'بحث عن أشخاص...')}
          className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder-neutral-400 outline-none focus:border-neutral-400 min-w-[200px]"
        />
        <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value as SocialPersonPriority | 'all')} className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
          <option value="all">{t('All Priorities', 'كل الأولويات')}</option>
          {PRIORITIES.map((p) => (
            <option key={p} value={p}>{t(p.charAt(0).toUpperCase() + p.slice(1), p === 'strategic' ? 'استراتيجي' : p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة')}</option>
          ))}
        </select>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as SocialPersonStatus | 'all')} className="h-9 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
          <option value="all">{t('All Statuses', 'كل الحالات')}</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{t(s.charAt(0).toUpperCase() + s.slice(1), s === 'active' ? 'نشط' : s === 'paused' ? 'متوقف' : 'مؤرشف')}</option>
          ))}
        </select>
      </div>

      {/* People List */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center text-sm text-neutral-500">
          {props.socialPeople.length === 0 ? t('No people yet. Add your first social media person!', 'لا يوجد أشخاص بعد. أضف أول شخص لوسائل التواصل!') : t('No people match your filters.', 'لا يوجد أشخاص تطابق فلترك.')}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((person) => (
            <div key={person.id} className="rounded-xl border border-neutral-200 bg-white p-5">
              {/* Card Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <DirectionalText text={person.name} className="text-sm font-semibold text-neutral-900 truncate block" />
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${PRIORITY_STYLES[person.priority]}`}>
                      {t(person.priority.charAt(0).toUpperCase() + person.priority.slice(1), person.priority === 'strategic' ? 'استراتيجي' : person.priority === 'high' ? 'عالية' : person.priority === 'medium' ? 'متوسطة' : 'منخفضة')}
                    </span>
                    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${person.status === 'active' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : person.status === 'paused' ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-neutral-200 bg-neutral-50 text-neutral-500'}`}>
                      {t(person.status.charAt(0).toUpperCase() + person.status.slice(1), person.status === 'active' ? 'نشط' : person.status === 'paused' ? 'متوقف' : 'مؤرشف')}
                    </span>
                  </div>
                </div>
              </div>

              {/* Links */}
              <div className="mt-3 flex flex-wrap gap-2">
                {person.linkedinUrl && (
                  <a href={person.linkedinUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                    LinkedIn
                  </a>
                )}
                {person.instagramUrl && (
                  <a href={person.instagramUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                    Instagram
                  </a>
                )}
                {person.xUrl && (
                  <a href={person.xUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                    X
                  </a>
                )}
                {person.websiteUrl && (
                  <a href={person.websiteUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs text-neutral-600 hover:bg-neutral-100 transition-colors">
                    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"/></svg>
                    Website
                  </a>
                )}
              </div>

              {/* Details */}
              <div className="mt-3 space-y-1.5 text-xs text-neutral-600">
                {person.category && <DirectionalText text={person.category} className="block" as="div" />}
                {person.reason && <DirectionalText text={person.reason} className="block" as="div" />}
                {person.interactionGoal && <DirectionalText text={person.interactionGoal} className="block" as="div" />}
                {person.lastInteractionAt && (
                  <span>{t('Last:', 'آخر تفاعل:')} {formatDate(person.lastInteractionAt)}</span>
                )}
                {person.nextInteractionAt && (
                  <span className={new Date(person.nextInteractionAt) <= new Date() && person.status === 'active' ? 'text-amber-600 font-medium' : ''}>
                    {t('Next:', 'التالي:')} {formatDate(person.nextInteractionAt)}
                  </span>
                )}
                {person.notes && <DirectionalText text={person.notes} className="block text-neutral-500" as="div" />}
              </div>

              {/* Actions */}
              <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-100 pt-3">
                <button type="button" onClick={() => openEdit(person)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">{t('Edit', 'تعديل')}</button>
                <button type="button" onClick={() => handleMarkInteracted(person.id)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">{t('Mark Interacted', 'تم التفاعل')}</button>
                <button type="button" onClick={() => handleDelete(person.id)} className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors">{t('Delete', 'حذف')}</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 p-4" onClick={(e) => { if (e.target === e.currentTarget) { setShowForm(false); resetForm(); } }}>
          <div className="w-full max-w-lg rounded-xl border border-neutral-200 bg-white p-6 shadow-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-semibold text-neutral-900">{editingId ? t('Edit Person', 'تعديل شخص') : t('Add Person', 'إضافة شخص')}</h3>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              {formErrors && <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-700">{formErrors}</div>}

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">{t('Name *', 'الاسم *')}</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">LinkedIn</label>
                  <input type="text" value={form.linkedinUrl} onChange={(e) => setForm({ ...form, linkedinUrl: e.target.value })} placeholder="linkedin.com/in/..." className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">Instagram</label>
                  <input type="text" value={form.instagramUrl} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} placeholder="instagram.com/..." className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">X</label>
                  <input type="text" value={form.xUrl} onChange={(e) => setForm({ ...form, xUrl: e.target.value })} placeholder="x.com/..." className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('Website', 'الموقع')}</label>
                  <input type="text" value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="example.com" className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('Priority', 'الأولوية')}</label>
                  <select value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value as SocialPersonPriority })} className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{t(p.charAt(0).toUpperCase() + p.slice(1), p === 'strategic' ? 'استراتيجي' : p === 'high' ? 'عالية' : p === 'medium' ? 'متوسطة' : 'منخفضة')}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('Status', 'الحالة')}</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as SocialPersonStatus })} className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{t(s.charAt(0).toUpperCase() + s.slice(1), s === 'active' ? 'نشط' : s === 'paused' ? 'متوقف' : 'مؤرشف')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">{t('Category', 'الفئة')}</label>
                <input type="text" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder={t('e.g. Influencer, Partner, Mentor', 'مثل: مؤثر، شريك، مرشد')} className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">{t('Reason', 'السبب')}</label>
                <input type="text" value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} placeholder={t('Why are you following this person?', 'لماذا تتابع هذا الشخص؟')} className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">{t('Interaction Goal', 'هدف التفاعل')}</label>
                <input type="text" value={form.interactionGoal} onChange={(e) => setForm({ ...form, interactionGoal: e.target.value })} placeholder={t('What do you want from this connection?', 'ماذا تريد من هذه العلاقة؟')} className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('Last Interaction', 'آخر تفاعل')}</label>
                  <input type="date" value={form.lastInteractionAt || ''} onChange={(e) => setForm({ ...form, lastInteractionAt: e.target.value })} className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">{t('Next Interaction', 'التفاعل التالي')}</label>
                  <input type="date" value={form.nextInteractionAt || ''} onChange={(e) => setForm({ ...form, nextInteractionAt: e.target.value })} className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">{t('Notes', 'ملاحظات')}</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={3} className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 resize-none" />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => { setShowForm(false); resetForm(); }} className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">{t('Cancel', 'إلغاء')}</button>
                <button type="submit" className="rounded-lg border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm text-white hover:bg-neutral-800 transition-colors">{editingId ? t('Update', 'تحديث') : t('Add', 'إضافة')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
