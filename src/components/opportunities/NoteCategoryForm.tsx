import React, { useEffect, useState } from 'react';
import type { NoteCategory, NoteCategoryInput } from '../../types/opportunities';

const inputClass = 'h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400';
const labelClass = 'text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500';

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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <span className={labelClass}>Name</span>
          <input value={form.name} onChange={(event) => setField('name', event.target.value)} className={inputClass} placeholder="Knowledge Base" />
        </label>

        <label className="space-y-1.5">
          <span className={labelClass}>Slug</span>
          <input value={form.slug} onChange={(event) => setField('slug', event.target.value)} className={inputClass} placeholder="knowledge-base" />
        </label>

        <label className="space-y-1.5">
          <span className={labelClass}>Color</span>
          <input type="color" value={form.color || '#000000'} onChange={(event) => setField('color', event.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white p-1" />
        </label>

        <label className="space-y-1.5 md:col-span-2">
          <span className={labelClass}>Description</span>
          <textarea value={form.description || ''} onChange={(event) => setField('description', event.target.value)} rows={3} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400 resize-y" />
        </label>

        <label className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2.5 md:col-span-2">
          <input type="checkbox" checked={form.isActive ?? true} onChange={(event) => setField('isActive', event.target.checked)} className="rounded border-neutral-300" />
          <span className="text-sm text-neutral-900">Active</span>
        </label>
      </div>

      {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default NoteCategoryForm;
