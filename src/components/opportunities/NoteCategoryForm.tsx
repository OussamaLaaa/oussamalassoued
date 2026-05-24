import React, { useEffect, useState } from 'react';
import type { NoteCategory, NoteCategoryInput } from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15';
const baseLabel = 'text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]';

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const createInitialState = (initialData?: Partial<NoteCategory>): NoteCategoryInput => ({
  name: initialData?.name ?? '',
  slug: initialData?.slug ?? '',
  description: initialData?.description,
  color: initialData?.color ?? '#2563eb',
  isActive: initialData?.isActive ?? true,
});

const NoteCategoryForm: React.FC<{
  initialData?: Partial<NoteCategory>;
  onSubmit: (input: NoteCategoryInput) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}> = ({ initialData, onSubmit, onCancel, submitLabel = 'Save Category' }) => {
  const [form, setForm] = useState<NoteCategoryInput>(() => createInitialState(initialData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(createInitialState(initialData));
    setError('');
  }, [initialData]);

  const setField = <K extends keyof NoteCategoryInput>(key: K, value: NoteCategoryInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const name = String(form.name || '').trim();
    const slug = String(form.slug || '').trim() || slugify(name);

    if (!name) {
      setError('Category name is required.');
      return;
    }

    if (!slug) {
      setError('Category slug is required.');
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        ...form,
        name,
        slug,
        description: form.description?.trim() || undefined,
        color: form.color?.trim() || undefined,
        isActive: form.isActive ?? true,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save category.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-[#0f172a]">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Name</div>
          <input value={form.name} onChange={(event) => setField('name', event.target.value)} className={baseInput} placeholder="Knowledge Base" />
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Slug</div>
          <input value={form.slug} onChange={(event) => setField('slug', event.target.value)} className={baseInput} placeholder="knowledge-base" />
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Color</div>
          <input type="color" value={form.color || '#2563eb'} onChange={(event) => setField('color', event.target.value)} className="h-10 w-full rounded-md border border-[#cbd5e1] bg-white p-1" />
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Description</div>
          <textarea value={form.description || ''} onChange={(event) => setField('description', event.target.value)} rows={3} className={baseInput} />
        </label>

        <label className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 md:col-span-2">
          <input type="checkbox" checked={form.isActive ?? true} onChange={(event) => setField('isActive', event.target.checked)} />
          <span className="text-sm text-[#0f172a]">Active</span>
        </label>
      </div>

      {error ? <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div> : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70">
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default NoteCategoryForm;
