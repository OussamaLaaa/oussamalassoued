import React, { useEffect, useState } from 'react';
import type { Company, Project, RelationshipOpportunityInput } from '../../types/opportunities';

const TYPE_OPTIONS = [
  { value: '', label: 'Unspecified' },
  { value: 'intro', label: 'Intro' },
  { value: 'referral', label: 'Referral' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'deal', label: 'Deal' },
  { value: 'support', label: 'Support' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'Unspecified' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Unspecified' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
];

const baseInput = 'w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15';
const baseLabel = 'text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]';

const toInputValue = (value?: string | null) => value ?? '';

const createInitialState = (relationshipId: string, initialData?: Partial<RelationshipOpportunityInput>): RelationshipOpportunityInput => ({
  relationshipId,
  title: initialData?.title ?? '',
  type: initialData?.type,
  status: initialData?.status,
  priority: initialData?.priority,
  valueDescription: initialData?.valueDescription,
  nextAction: initialData?.nextAction,
  dueDate: initialData?.dueDate ?? null,
  linkedProjectId: initialData?.linkedProjectId ?? null,
  linkedCompanyId: initialData?.linkedCompanyId ?? null,
  notes: initialData?.notes,
});

const RelationshipOpportunityForm: React.FC<{
  relationshipId: string;
  projects?: Project[];
  companies?: Company[];
  initialData?: Partial<RelationshipOpportunityInput>;
  onSubmit: (input: RelationshipOpportunityInput) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}> = ({ relationshipId, projects = [], companies = [], initialData, onSubmit, onCancel, submitLabel = 'Save Opportunity' }) => {
  const [form, setForm] = useState<RelationshipOpportunityInput>(() => createInitialState(relationshipId, initialData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(createInitialState(relationshipId, initialData));
    setError('');
  }, [relationshipId, initialData]);

  const setField = <K extends keyof RelationshipOpportunityInput>(key: K, value: RelationshipOpportunityInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const title = String(form.title || '').trim();
    if (!title) {
      setError('Title is required.');
      return;
    }

    const payload: RelationshipOpportunityInput = {
      relationshipId,
      title,
      type: form.type || undefined,
      status: form.status || undefined,
      priority: form.priority || undefined,
      valueDescription: form.valueDescription?.trim() || undefined,
      nextAction: form.nextAction?.trim() || undefined,
      dueDate: form.dueDate ? String(form.dueDate).trim() : null,
      linkedProjectId: form.linkedProjectId ? String(form.linkedProjectId).trim() : null,
      linkedCompanyId: form.linkedCompanyId ? String(form.linkedCompanyId).trim() : null,
      notes: form.notes?.trim() || undefined,
    };

    try {
      setSaving(true);
      await onSubmit(payload);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save opportunity.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-[#0f172a]">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Title</div>
          <input
            value={form.title}
            onChange={(event) => setField('title', event.target.value)}
            className={baseInput}
            placeholder="Referral intro for product team"
          />
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Type</div>
          <select
            value={toInputValue(form.type)}
            onChange={(event) => setField('type', event.target.value)}
            className={baseInput}
          >
            {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Status</div>
          <select
            value={toInputValue(form.status)}
            onChange={(event) => setField('status', event.target.value)}
            className={baseInput}
          >
            {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Priority</div>
          <select
            value={toInputValue(form.priority)}
            onChange={(event) => setField('priority', event.target.value)}
            className={baseInput}
          >
            {PRIORITY_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Due Date</div>
          <input
            type="date"
            value={toInputValue(form.dueDate)}
            onChange={(event) => setField('dueDate', event.target.value || null)}
            className={baseInput}
          />
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Value Description</div>
          <textarea
            value={form.valueDescription || ''}
            onChange={(event) => setField('valueDescription', event.target.value)}
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

        <label className="space-y-2">
          <div className={baseLabel}>Linked Project</div>
          <select
            value={toInputValue(form.linkedProjectId)}
            onChange={(event) => setField('linkedProjectId', event.target.value || null)}
            className={baseInput}
          >
            <option value="">No project</option>
            {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Linked Company</div>
          <select
            value={toInputValue(form.linkedCompanyId)}
            onChange={(event) => setField('linkedCompanyId', event.target.value || null)}
            className={baseInput}
          >
            <option value="">No company</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Notes</div>
          <textarea
            value={form.notes || ''}
            onChange={(event) => setField('notes', event.target.value)}
            rows={4}
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

export default RelationshipOpportunityForm;
