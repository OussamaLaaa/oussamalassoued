import React, { useEffect, useMemo, useState } from 'react';
import type {
  Company,
  NoteCategory,
  SmartNote,
  SmartNoteInput,
  Person,
  Plan,
  Project,
  Relationship,
  StrategyGoal,
  Task,
} from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15';
const baseLabel = 'text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]';

const createInitialState = (initialData?: Partial<SmartNote>): SmartNoteInput => ({
  title: initialData?.title ?? '',
  content: initialData?.content ?? '',
  categoryId: initialData?.categoryId ?? '',
  categorySlug: initialData?.categorySlug ?? '',
  status: initialData?.status ?? 'active',
  priority: initialData?.priority ?? 'medium',
  tags: initialData?.tags ?? '',
  linkedProjectId: initialData?.linkedProjectId ?? '',
  linkedCompanyId: initialData?.linkedCompanyId ?? '',
  linkedPersonId: initialData?.linkedPersonId ?? '',
  linkedRelationshipId: initialData?.linkedRelationshipId ?? '',
  linkedTaskId: initialData?.linkedTaskId ?? '',
  linkedStrategyGoalId: initialData?.linkedStrategyGoalId ?? '',
  linkedPlanId: initialData?.linkedPlanId ?? '',
  source: initialData?.source ?? '',
  notes: initialData?.notes ?? '',
});

const optionLabel = (label: string, suffix?: string) => (suffix ? `${label} • ${suffix}` : label);

const SmartNoteForm: React.FC<{
  initialData?: Partial<SmartNote>;
  categories: NoteCategory[];
  projects: Project[];
  companies: Company[];
  people: Person[];
  relationships: Relationship[];
  tasks: Task[];
  strategyGoals: StrategyGoal[];
  plans: Plan[];
  onSubmit: (input: SmartNoteInput) => Promise<void> | void;
  onCancel: () => void;
  submitLabel?: string;
}> = ({
  initialData,
  categories,
  projects,
  companies,
  people,
  relationships,
  tasks,
  strategyGoals,
  plans,
  onSubmit,
  onCancel,
  submitLabel = 'Save Note',
}) => {
  const [form, setForm] = useState<SmartNoteInput>(() => createInitialState(initialData));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setForm(createInitialState(initialData));
    setError('');
  }, [initialData]);

  const setField = <K extends keyof SmartNoteInput>(key: K, value: SmartNoteInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const categoryOptions = useMemo(() => categories.slice().sort((a, b) => a.name.localeCompare(b.name)), [categories]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    const title = String(form.title || '').trim();
    if (!title) {
      setError('Note title is required.');
      return;
    }

    try {
      setSaving(true);
      await onSubmit({
        ...form,
        title,
        content: form.content?.trim() || undefined,
        categoryId: form.categoryId?.trim() || undefined,
        categorySlug: form.categorySlug?.trim() || undefined,
        tags: form.tags?.trim() || undefined,
        linkedProjectId: form.linkedProjectId?.trim() || undefined,
        linkedCompanyId: form.linkedCompanyId?.trim() || undefined,
        linkedPersonId: form.linkedPersonId?.trim() || undefined,
        linkedRelationshipId: form.linkedRelationshipId?.trim() || undefined,
        linkedTaskId: form.linkedTaskId?.trim() || undefined,
        linkedStrategyGoalId: form.linkedStrategyGoalId?.trim() || undefined,
        linkedPlanId: form.linkedPlanId?.trim() || undefined,
        source: form.source?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      });
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-[#0f172a]">
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Title</div>
          <input value={form.title} onChange={(event) => setField('title', event.target.value)} className={baseInput} placeholder="Capture the insight" />
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Content</div>
          <textarea value={form.content || ''} onChange={(event) => setField('content', event.target.value)} rows={6} className={baseInput} placeholder="Write the core note here." />
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Category</div>
          <select value={form.categoryId || ''} onChange={(event) => {
            const selected = categoryOptions.find((category) => category.id === event.target.value);
            setField('categoryId', event.target.value);
            setField('categorySlug', selected?.slug || '');
          }} className={baseInput}>
            <option value="">Uncategorized</option>
            {categoryOptions.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Status</div>
          <select value={form.status || 'active'} onChange={(event) => setField('status', event.target.value as SmartNoteInput['status'])} className={baseInput}>
            <option value="active">Active</option>
            <option value="pinned">Pinned</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Priority</div>
          <select value={form.priority || 'medium'} onChange={(event) => setField('priority', event.target.value as SmartNoteInput['priority'])} className={baseInput}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Tags</div>
          <input value={form.tags || ''} onChange={(event) => setField('tags', event.target.value)} className={baseInput} placeholder="strategy, research, follow-up" />
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Project</div>
          <select value={form.linkedProjectId || ''} onChange={(event) => setField('linkedProjectId', event.target.value)} className={baseInput}>
            <option value="">None</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{optionLabel(project.name, project.type)}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Company</div>
          <select value={form.linkedCompanyId || ''} onChange={(event) => setField('linkedCompanyId', event.target.value)} className={baseInput}>
            <option value="">None</option>
            {companies.map((company) => (
              <option key={company.id} value={company.id}>{company.name}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Person</div>
          <select value={form.linkedPersonId || ''} onChange={(event) => setField('linkedPersonId', event.target.value)} className={baseInput}>
            <option value="">None</option>
            {people.map((person) => (
              <option key={person.id} value={person.id}>{optionLabel(person.fullName, person.role)}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Relationship</div>
          <select value={form.linkedRelationshipId || ''} onChange={(event) => setField('linkedRelationshipId', event.target.value)} className={baseInput}>
            <option value="">None</option>
            {relationships.map((relationship) => (
              <option key={relationship.id} value={relationship.id}>{optionLabel(relationship.displayName, relationship.relationshipType)}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Task</div>
          <select value={form.linkedTaskId || ''} onChange={(event) => setField('linkedTaskId', event.target.value)} className={baseInput}>
            <option value="">None</option>
            {tasks.map((task) => (
              <option key={task.id} value={task.id}>{optionLabel(task.title, task.status)}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Strategy Goal</div>
          <select value={form.linkedStrategyGoalId || ''} onChange={(event) => setField('linkedStrategyGoalId', event.target.value)} className={baseInput}>
            <option value="">None</option>
            {strategyGoals.map((goal) => (
              <option key={goal.id} value={goal.id}>{optionLabel(goal.title, goal.status)}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <div className={baseLabel}>Plan</div>
          <select value={form.linkedPlanId || ''} onChange={(event) => setField('linkedPlanId', event.target.value)} className={baseInput}>
            <option value="">None</option>
            {plans.map((plan) => (
              <option key={plan.id} value={plan.id}>{optionLabel(plan.title, plan.status)}</option>
            ))}
          </select>
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Source</div>
          <input value={form.source || ''} onChange={(event) => setField('source', event.target.value)} className={baseInput} placeholder="Link, meeting, document, or call" />
        </label>

        <label className="space-y-2 md:col-span-2">
          <div className={baseLabel}>Notes</div>
          <textarea value={form.notes || ''} onChange={(event) => setField('notes', event.target.value)} rows={3} className={baseInput} placeholder="Optional internal notes." />
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

export default SmartNoteForm;
