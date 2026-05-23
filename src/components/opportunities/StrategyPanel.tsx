import React, { useMemo, useState } from 'react';
import type { Company, Person, Project, StrategyItem, StrategyItemInput, StrategySection } from '../../types/opportunities';

type StrategyPanelProps = {
  strategyItems: StrategyItem[];
  projects: Project[];
  companies: Company[];
  people: Person[];
  onAddStrategyItem: (input: StrategyItemInput) => Promise<StrategyItem>;
  onUpdateStrategyItem: (id: string, input: Partial<StrategyItemInput>) => Promise<StrategyItem>;
  onDeleteStrategyItem: (id: string) => Promise<void>;
};

const SECTION_OPTIONS: Array<{ value: StrategySection; label: string }> = [
  { value: 'career', label: 'Career' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'portfolio', label: 'Portfolio' },
  { value: 'money', label: 'Money' },
  { value: 'investment', label: 'Investment' },
  { value: 'learning', label: 'Learning' },
  { value: 'health', label: 'Health' },
  { value: 'ethical_filter', label: 'Ethical Filter' },
  { value: 'positioning', label: 'Positioning' },
  { value: 'operations', label: 'Operations' },
];

const PRIORITY_OPTIONS: Array<StrategyItem['priority']> = ['high', 'medium', 'low'];
const STATUS_OPTIONS: Array<StrategyItem['status']> = ['active', 'paused', 'completed', 'archived'];
const TIME_HORIZON_OPTIONS: Array<NonNullable<StrategyItem['timeHorizon']>> = ['yearly', 'six_months', 'quarterly', 'monthly', 'weekly', 'daily'];

type StrategyFormState = {
  section: StrategySection;
  title: string;
  content: string;
  priority: StrategyItem['priority'];
  status: StrategyItem['status'];
  timeHorizon: string;
  reviewDate: string;
  linkedProjectId: string;
  linkedCompanyId: string;
  linkedPersonId: string;
};

const createDefaultForm = (): StrategyFormState => ({
  section: 'career',
  title: '',
  content: '',
  priority: 'medium',
  status: 'active',
  timeHorizon: '',
  reviewDate: '',
  linkedProjectId: '',
  linkedCompanyId: '',
  linkedPersonId: '',
});

const toFormState = (item: StrategyItem): StrategyFormState => ({
  section: item.section,
  title: item.title || '',
  content: item.content || '',
  priority: item.priority || 'medium',
  status: item.status || 'active',
  timeHorizon: item.timeHorizon || '',
  reviewDate: item.reviewDate ? item.reviewDate.slice(0, 10) : '',
  linkedProjectId: item.linkedProjectId || '',
  linkedCompanyId: item.linkedCompanyId || '',
  linkedPersonId: item.linkedPersonId || '',
});

const toPayload = (form: StrategyFormState): StrategyItemInput => ({
  section: form.section,
  title: form.title,
  content: form.content,
  priority: form.priority,
  status: form.status,
  timeHorizon: (form.timeHorizon || undefined) as StrategyItemInput['timeHorizon'],
  reviewDate: form.reviewDate,
  linkedProjectId: form.linkedProjectId,
  linkedCompanyId: form.linkedCompanyId,
  linkedPersonId: form.linkedPersonId,
});

const getBadgeTone = (value?: string) => {
  if (value === 'high' || value === 'active') return 'bg-[#fee2e2] text-[#991b1b] border-[#fecaca]';
  if (value === 'medium' || value === 'paused') return 'bg-[#fff7ed] text-[#9a3412] border-[#fed7aa]';
  if (value === 'low' || value === 'completed') return 'bg-[#ecfeff] text-[#155e75] border-[#a5f3fc]';
  return 'bg-[#f1f5f9] text-[#475569] border-[#e2e8f0]';
};

const StrategyPanel: React.FC<StrategyPanelProps> = ({
  strategyItems,
  projects,
  companies,
  people,
  onAddStrategyItem,
  onUpdateStrategyItem,
  onDeleteStrategyItem,
}) => {
  const [selectedSection, setSelectedSection] = useState<StrategySection>('career');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StrategyItem | null>(null);
  const [form, setForm] = useState<StrategyFormState>(createDefaultForm());
  const [formError, setFormError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const sectionItems = useMemo(
    () => strategyItems.filter((item) => item.section === selectedSection),
    [strategyItems, selectedSection],
  );

  const stats = useMemo(() => ({
    active: strategyItems.filter((item) => item.status === 'active').length,
    highPriority: strategyItems.filter((item) => item.priority === 'high').length,
    dueReview: strategyItems.filter((item) => {
      if (!item.reviewDate) return false;
      const dateKey = item.reviewDate.slice(0, 10);
      return dateKey <= today && item.status !== 'completed' && item.status !== 'archived';
    }).length,
    completed: strategyItems.filter((item) => item.status === 'completed').length,
    linkedToProjects: strategyItems.filter((item) => Boolean(item.linkedProjectId)).length,
  }), [strategyItems, today]);

  const openCreateModal = () => {
    setEditingItem(null);
    setForm(createDefaultForm());
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (item: StrategyItem) => {
    setEditingItem(item);
    setForm(toFormState(item));
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
    setEditingItem(null);
    setForm(createDefaultForm());
    setFormError(null);
  };

  const submitForm = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!form.section) {
      setFormError('Section is required.');
      return;
    }

    if (!form.title.trim()) {
      setFormError('Title is required.');
      return;
    }

    setFormError(null);
    setIsSaving(true);

    try {
      const payload = toPayload({ ...form, title: form.title.trim() });
      if (editingItem) {
        await onUpdateStrategyItem(editingItem.id, payload);
      } else {
        await onAddStrategyItem(payload);
      }
      closeModal();
    } catch (error) {
      setFormError((error as Error)?.message || 'Unable to save strategy item.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await onDeleteStrategyItem(id);
    } catch (error) {
      console.error('[StrategyPanel] Failed to delete strategy item.', error);
    }
  };

  const createStarterStrategy = async () => {
    setIsSeeding(true);
    setFormError(null);

    const starters: StrategyItemInput[] = [
      {
        section: 'career',
        title: 'Career positioning',
        content: 'Clarify your niche and communicate one clear value promise this quarter.',
        priority: 'high',
        status: 'active',
        timeHorizon: 'quarterly',
      },
      {
        section: 'freelance',
        title: 'Freelance offer',
        content: 'Define one flagship service offer with clear outcomes and delivery scope.',
        priority: 'high',
        status: 'active',
        timeHorizon: 'monthly',
      },
      {
        section: 'portfolio',
        title: 'Portfolio proof',
        content: 'Ship one high-quality case study that demonstrates measurable impact.',
        priority: 'medium',
        status: 'active',
        timeHorizon: 'monthly',
      },
      {
        section: 'money',
        title: 'Money allocation',
        content: 'Set allocation percentages for operating cash, skill growth, and runway.',
        priority: 'high',
        status: 'active',
        timeHorizon: 'monthly',
      },
      {
        section: 'ethical_filter',
        title: 'Ethical filter',
        content: 'Write non-negotiable client and project criteria to protect long-term trust.',
        priority: 'medium',
        status: 'active',
        timeHorizon: 'yearly',
      },
      {
        section: 'operations',
        title: 'Weekly outreach rhythm',
        content: 'Set a weekly pipeline cadence for outreach, follow-up, and relationship building.',
        priority: 'medium',
        status: 'active',
        timeHorizon: 'weekly',
      },
    ];

    try {
      for (const item of starters) {
        await onAddStrategyItem(item);
      }
    } catch (error) {
      setFormError((error as Error)?.message || 'Unable to create starter strategy.');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Active Strategy Items</div>
          <div className="mt-2 text-2xl font-semibold text-[#0f172a]">{stats.active}</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="text-xs uppercase tracking-[0.08em] text-[#64748b]">High Priority</div>
          <div className="mt-2 text-2xl font-semibold text-[#991b1b]">{stats.highPriority}</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Due for Review</div>
          <div className="mt-2 text-2xl font-semibold text-[#9a3412]">{stats.dueReview}</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Completed</div>
          <div className="mt-2 text-2xl font-semibold text-[#155e75]">{stats.completed}</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="text-xs uppercase tracking-[0.08em] text-[#64748b]">Linked to Projects</div>
          <div className="mt-2 text-2xl font-semibold text-[#1e3a8a]">{stats.linkedToProjects}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <aside className="xl:col-span-2 rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Sections</div>
          <div className="mt-3 flex flex-wrap gap-2 xl:flex-col">
            {SECTION_OPTIONS.map((section) => (
              <button
                key={section.value}
                type="button"
                onClick={() => setSelectedSection(section.value)}
                className={`rounded-md border px-3 py-2 text-left text-sm transition-colors ${
                  selectedSection === section.value
                    ? 'border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]'
                    : 'border-[#e2e8f0] bg-[#f8fafc] text-[#334155] hover:border-[#cbd5e1]'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="xl:col-span-7 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] pb-3">
            <div>
              <h3 className="text-lg font-semibold text-[#0f172a]">Strategy Board</h3>
              <p className="text-sm text-[#64748b]">{SECTION_OPTIONS.find((item) => item.value === selectedSection)?.label} focus</p>
            </div>
            <button
              type="button"
              onClick={openCreateModal}
              className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
            >
              Add Strategy Item
            </button>
          </div>

          {strategyItems.length === 0 ? (
            <div className="mt-4 rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-5 text-center">
              <p className="text-sm text-[#475569]">No strategy items yet. Start with a practical baseline.</p>
              <button
                type="button"
                onClick={createStarterStrategy}
                disabled={isSeeding}
                className="mt-3 rounded-md border border-[#94a3b8] bg-white px-4 py-2 text-sm font-medium text-[#0f172a] hover:bg-[#f1f5f9] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSeeding ? 'Creating starter strategy...' : 'Create starter strategy'}
              </button>
            </div>
          ) : sectionItems.length === 0 ? (
            <div className="mt-4 rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
              No items in this section yet.
            </div>
          ) : (
            <div className="mt-4 space-y-3">
              {sectionItems.map((item) => (
                <article key={item.id} className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h4 className="text-base font-semibold text-[#0f172a]">{item.title}</h4>
                      {item.content ? <p className="mt-2 text-sm text-[#475569]">{item.content}</p> : null}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => openEditModal(item)}
                        className="rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs text-[#0f172a] hover:bg-[#f1f5f9]"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(item.id)}
                        className="rounded-md border border-[#fecaca] bg-white px-3 py-1.5 text-xs text-[#991b1b] hover:bg-[#fef2f2]"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2 text-xs">
                    <span className={`rounded-full border px-2 py-1 ${getBadgeTone(item.priority)}`}>Priority: {item.priority}</span>
                    <span className={`rounded-full border px-2 py-1 ${getBadgeTone(item.status)}`}>Status: {item.status}</span>
                    <span className="rounded-full border border-[#e2e8f0] bg-white px-2 py-1 text-[#334155]">Horizon: {item.timeHorizon || 'none'}</span>
                    <span className="rounded-full border border-[#e2e8f0] bg-white px-2 py-1 text-[#334155]">Review: {item.reviewDate ? item.reviewDate.slice(0, 10) : 'none'}</span>
                    <span className="rounded-full border border-[#e2e8f0] bg-white px-2 py-1 text-[#334155]">Project: {item.linkedProjectName || 'none'}</span>
                    <span className="rounded-full border border-[#e2e8f0] bg-white px-2 py-1 text-[#334155]">Company: {item.linkedCompanyName || 'none'}</span>
                    <span className="rounded-full border border-[#e2e8f0] bg-white px-2 py-1 text-[#334155]">Person: {item.linkedPersonName || 'none'}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>

        <aside className="xl:col-span-3 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-mono uppercase tracking-[0.14em] text-[#64748b]">Insight Prompts</h3>
          <div className="mt-3 space-y-2 text-sm text-[#334155]">
            <p className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">What is the next action?</p>
            <p className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">Does this support income, independence, or positioning?</p>
            <p className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">Is this aligned with ethical filters?</p>
            <p className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">What proof will this create?</p>
          </div>
        </aside>
      </div>

      {isModalOpen ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/45 px-4 py-6">
          <div className="w-full max-w-[680px] rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <h4 className="text-base font-semibold text-[#0f172a]">{editingItem ? 'Edit Strategy Item' : 'Add Strategy Item'}</h4>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-md border border-[#cbd5e1] px-2 py-1 text-sm text-[#334155] hover:bg-[#f8fafc]"
              >
                Close
              </button>
            </div>

            <form className="mt-4 space-y-3" onSubmit={submitForm}>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-[#334155]">
                  Section
                  <select
                    value={form.section}
                    onChange={(event) => setForm((current) => ({ ...current, section: event.target.value as StrategySection }))}
                    className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                    required
                  >
                    {SECTION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-[#334155]">
                  Title
                  <input
                    value={form.title}
                    onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                    placeholder="Strategic objective"
                    required
                  />
                </label>
              </div>

              <label className="text-sm text-[#334155] block">
                Content
                <textarea
                  value={form.content}
                  onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
                  rows={4}
                  className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                  placeholder="Context, rationale, and expected outcomes"
                />
              </label>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <label className="text-sm text-[#334155]">
                  Priority
                  <select
                    value={form.priority}
                    onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value as StrategyItem['priority'] }))}
                    className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                  >
                    {PRIORITY_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-[#334155]">
                  Status
                  <select
                    value={form.status}
                    onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as StrategyItem['status'] }))}
                    className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                  >
                    {STATUS_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-[#334155]">
                  Time Horizon
                  <select
                    value={form.timeHorizon}
                    onChange={(event) => setForm((current) => ({ ...current, timeHorizon: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                  >
                    <option value="">None</option>
                    {TIME_HORIZON_OPTIONS.map((option) => (
                      <option key={option} value={option}>{option}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <label className="text-sm text-[#334155]">
                  Review Date
                  <input
                    type="date"
                    value={form.reviewDate}
                    onChange={(event) => setForm((current) => ({ ...current, reviewDate: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                  />
                </label>

                <label className="text-sm text-[#334155]">
                  Linked Project
                  <select
                    value={form.linkedProjectId}
                    onChange={(event) => setForm((current) => ({ ...current, linkedProjectId: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                  >
                    <option value="">None</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-[#334155]">
                  Linked Company
                  <select
                    value={form.linkedCompanyId}
                    onChange={(event) => setForm((current) => ({ ...current, linkedCompanyId: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                  >
                    <option value="">None</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>{company.name}</option>
                    ))}
                  </select>
                </label>

                <label className="text-sm text-[#334155]">
                  Linked Person
                  <select
                    value={form.linkedPersonId}
                    onChange={(event) => setForm((current) => ({ ...current, linkedPersonId: event.target.value }))}
                    className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                  >
                    <option value="">None</option>
                    {people.map((person) => (
                      <option key={person.id} value={person.id}>{person.fullName}</option>
                    ))}
                  </select>
                </label>
              </div>

              {formError ? <p className="text-sm text-[#b91c1c]">{formError}</p> : null}

              <div className="flex justify-end gap-2 border-t border-[#e5e7eb] pt-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#334155] hover:bg-[#f8fafc]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSaving ? 'Saving...' : editingItem ? 'Save Changes' : 'Create Strategy Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StrategyPanel;
