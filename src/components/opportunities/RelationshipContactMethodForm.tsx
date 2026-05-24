import React, { useEffect, useState } from 'react';
import type { Person, Relationship, RelationshipContactMethod, RelationshipContactMethodInput } from '../../types/opportunities';

const CONTACT_METHOD_TYPES = [
  { value: '', label: 'Unspecified' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'telegram', label: 'Telegram' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'website', label: 'Website' },
  { value: 'location', label: 'Location' },
  { value: 'other', label: 'Other' },
];

const baseInput = 'w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15';
const baseLabel = 'text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]';

const createInitialState = (initialData?: Partial<RelationshipContactMethod>): RelationshipContactMethodInput => ({
  relationshipId: initialData?.relationshipId ?? '',
  type: initialData?.type,
  label: initialData?.label,
  value: initialData?.value,
  isPrimary: initialData?.isPrimary ?? false,
  notes: initialData?.notes,
});

const toInputValue = (value?: string | null) => value ?? '';

const RelationshipContactMethodForm: React.FC<{
  relationships: Relationship[];
  people?: Person[];
  relationshipId?: string;
  initialData?: Partial<RelationshipContactMethod>;
  onSubmit: (input: RelationshipContactMethodInput) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}> = ({ relationships, people = [], relationshipId, initialData, onSubmit, onCancel, submitLabel = 'Save Contact Method' }) => {
  const [form, setForm] = useState<RelationshipContactMethodInput>(() => ({ ...createInitialState(initialData), relationshipId: relationshipId || initialData?.relationshipId || '' }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm({ ...createInitialState(initialData), relationshipId: relationshipId || initialData?.relationshipId || '' });
    setError('');
  }, [initialData, relationshipId]);

  const setField = <K extends keyof RelationshipContactMethodInput>(key: K, value: RelationshipContactMethodInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const nextRelationshipId = String(form.relationshipId || '').trim();
    if (!nextRelationshipId) {
      setError('Select a relationship.');
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        ...form,
        relationshipId: nextRelationshipId,
        label: form.label?.trim() || undefined,
        value: form.value?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
        isPrimary: Boolean(form.isPrimary),
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save contact method.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-[#0f172a]">
      <div className="grid gap-4 md:grid-cols-2">
        {!relationshipId ? (
          <label className="space-y-2 md:col-span-2">
            <div className={baseLabel}>Relationship</div>
            <select value={toInputValue(form.relationshipId)} onChange={(event) => setField('relationshipId', event.target.value)} className={baseInput}>
              <option value="">Select a relationship</option>
              {relationships.map((relationship) => {
                const personName = relationship.personName || people.find((person) => person.id === relationship.personId)?.fullName;
                return (
                  <option key={relationship.id} value={relationship.id}>
                    {relationship.displayName}{personName ? ` · ${personName}` : ''}
                  </option>
                );
              })}
            </select>
          </label>
        ) : null}

        <label className="space-y-2">
          <div className={baseLabel}>Type</div>
          <select value={toInputValue(form.type)} onChange={(event) => setField('type', event.target.value as RelationshipContactMethodInput['type'])} className={baseInput}>
            {CONTACT_METHOD_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Label</div>
          <input value={form.label || ''} onChange={(event) => setField('label', event.target.value)} className={baseInput} placeholder="Primary email" />
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Value</div>
          <input value={form.value || ''} onChange={(event) => setField('value', event.target.value)} className={baseInput} placeholder="maya@example.com" />
        </label>

        <label className="flex items-center gap-3 rounded-lg border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 md:col-span-2">
          <input type="checkbox" checked={form.isPrimary ?? false} onChange={(event) => setField('isPrimary', event.target.checked)} />
          <span className="text-sm text-[#0f172a]">Primary contact method</span>
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Notes</div>
          <textarea value={form.notes || ''} onChange={(event) => setField('notes', event.target.value)} rows={3} className={baseInput} />
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

export default RelationshipContactMethodForm;
