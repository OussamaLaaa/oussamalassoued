import React, { useEffect, useState } from 'react';
import type { RelationshipInteractionInput } from '../../types/opportunities';

const CHANNEL_OPTIONS = [
  { value: '', label: 'Unspecified' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'email', label: 'Email' },
  { value: 'phone', label: 'Phone' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'in_person', label: 'In Person' },
  { value: 'other', label: 'Other' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'Unspecified' },
  { value: 'first_contact', label: 'First Contact' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'help_given', label: 'Help Given' },
  { value: 'help_received', label: 'Help Received' },
  { value: 'problem', label: 'Problem' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'note', label: 'Note' },
];

const baseInput = 'w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15';
const baseLabel = 'text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]';

const toInputValue = (value?: string | null) => value ?? '';

const createInitialState = (relationshipId: string, initialData?: Partial<RelationshipInteractionInput>): RelationshipInteractionInput => ({
  relationshipId,
  interactionDate: initialData?.interactionDate || new Date().toISOString().slice(0, 10),
  channel: initialData?.channel,
  type: initialData?.type,
  summary: initialData?.summary,
  outcome: initialData?.outcome,
  nextAction: initialData?.nextAction,
});

const RelationshipInteractionForm: React.FC<{
  relationshipId: string;
  initialData?: Partial<RelationshipInteractionInput>;
  onSubmit: (input: RelationshipInteractionInput) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}> = ({ relationshipId, initialData, onSubmit, onCancel, submitLabel = 'Save Interaction' }) => {
  const [form, setForm] = useState<RelationshipInteractionInput>(() => createInitialState(relationshipId, initialData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(createInitialState(relationshipId, initialData));
    setError('');
  }, [relationshipId, initialData]);

  const setField = <K extends keyof RelationshipInteractionInput>(key: K, value: RelationshipInteractionInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (!String(form.interactionDate || '').trim()) {
      setError('Interaction date is required.');
      return;
    }

    const payload: RelationshipInteractionInput = {
      relationshipId,
      interactionDate: String(form.interactionDate).trim(),
      channel: form.channel || undefined,
      type: form.type || undefined,
      summary: form.summary?.trim() || undefined,
      outcome: form.outcome?.trim() || undefined,
      nextAction: form.nextAction?.trim() || undefined,
    };

    try {
      setSaving(true);
      await onSubmit(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save interaction.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-[#0f172a]">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2">
          <div className={baseLabel}>Interaction Date</div>
          <input
            type="date"
            value={toInputValue(form.interactionDate)}
            onChange={(event) => setField('interactionDate', event.target.value)}
            className={baseInput}
          />
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Channel</div>
          <select
            value={toInputValue(form.channel)}
            onChange={(event) => setField('channel', event.target.value as RelationshipInteractionInput['channel'])}
            className={baseInput}
          >
            {CHANNEL_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Type</div>
          <select
            value={toInputValue(form.type)}
            onChange={(event) => setField('type', event.target.value as RelationshipInteractionInput['type'])}
            className={baseInput}
          >
            {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Summary</div>
          <textarea
            value={form.summary || ''}
            onChange={(event) => setField('summary', event.target.value)}
            rows={4}
            className={baseInput}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Outcome</div>
          <textarea
            value={form.outcome || ''}
            onChange={(event) => setField('outcome', event.target.value)}
            rows={3}
            className={baseInput}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Next Action</div>
          <textarea
            value={form.nextAction || ''}
            onChange={(event) => setField('nextAction', event.target.value)}
            rows={3}
            className={baseInput}
          />
        </label>
      </div>

      {error ? <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div> : null}

      <div className="flex items-center justify-end gap-3 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Saving...' : submitLabel}
        </button>
      </div>
    </form>
  );
};

export default RelationshipInteractionForm;
