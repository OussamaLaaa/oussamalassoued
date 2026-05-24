import React, { useEffect, useMemo, useState } from 'react';
import type { NoteAttachment, NoteAttachmentInput, NoteAttachmentType, SmartNote } from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15';
const baseLabel = 'text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]';

const createInitialState = (initialData?: Partial<NoteAttachment>): NoteAttachmentInput => ({
  noteId: initialData?.noteId ?? '',
  type: initialData?.type ?? 'link',
  title: initialData?.title ?? '',
  url: initialData?.url ?? '',
  notes: initialData?.notes ?? '',
});

const attachmentTypes: NoteAttachmentType[] = ['link', 'image', 'video', 'audio', 'pdf', 'file', 'other'];

const NoteAttachmentForm: React.FC<{
  initialData?: Partial<NoteAttachment>;
  notes: SmartNote[];
  onSubmit: (input: NoteAttachmentInput) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}> = ({ initialData, notes, onSubmit, onCancel, submitLabel = 'Save Attachment' }) => {
  const [form, setForm] = useState<NoteAttachmentInput>(() => createInitialState(initialData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(createInitialState(initialData));
    setError('');
  }, [initialData]);

  const sortedNotes = useMemo(() => notes.slice().sort((a, b) => a.title.localeCompare(b.title)), [notes]);

  const setField = <K extends keyof NoteAttachmentInput>(key: K, value: NoteAttachmentInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const noteId = String(form.noteId || '').trim();
    const url = String(form.url || '').trim();

    if (!noteId) {
      setError('Select a note first.');
      return;
    }

    if (!url) {
      setError('Attachment URL is required.');
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        ...form,
        noteId,
        type: form.type || 'link',
        title: form.title?.trim() || undefined,
        url,
        notes: form.notes?.trim() || undefined,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save attachment.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-[#0f172a]">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Note</div>
          <select value={form.noteId} onChange={(event) => setField('noteId', event.target.value)} className={baseInput}>
            <option value="">Select a note</option>
            {sortedNotes.map((note) => (
              <option key={note.id} value={note.id}>{note.title}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Type</div>
          <select value={form.type || 'link'} onChange={(event) => setField('type', event.target.value as NoteAttachmentType)} className={baseInput}>
            {attachmentTypes.map((type) => (
              <option key={type} value={type}>{type.toUpperCase()}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Title</div>
          <input value={form.title || ''} onChange={(event) => setField('title', event.target.value)} className={baseInput} placeholder="Optional label" />
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>URL</div>
          <input value={form.url} onChange={(event) => setField('url', event.target.value)} className={baseInput} placeholder="https://..." />
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Notes</div>
          <textarea value={form.notes || ''} onChange={(event) => setField('notes', event.target.value)} rows={3} className={baseInput} placeholder="Optional attachment context." />
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

export default NoteAttachmentForm;
