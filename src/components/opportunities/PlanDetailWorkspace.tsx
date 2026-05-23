import React, { useState, useMemo } from 'react';
import PlanItemForm from './PlanItemForm';
import type { Plan, PlanInput, PlanItem, PlanItemInput, PlanItemStatus, StrategyGoal, Project } from '../../types/opportunities';

type DetailTab = 'overview' | 'board' | 'items' | 'review';

const TABS: Array<{ value: DetailTab; label: string }> = [
  { value: 'overview', label: 'Overview' },
  { value: 'board', label: 'Board' },
  { value: 'items', label: 'Items' },
  { value: 'review', label: 'Review' },
];

const PRIORITY_OPTIONS = ['high', 'medium', 'low'] as const;
const STATUS_OPTIONS = ['planned', 'active', 'completed', 'archived'] as const;
const ITEM_STATUS_OPTIONS: PlanItemStatus[] = ['todo', 'doing', 'done', 'blocked', 'cancelled'];

const formatDate = (value?: string) => {
  if (!value) return '';
  return value.slice(0, 10);
};

type Props = {
  plan: Plan;
  planItems: PlanItem[];
  projects: Project[];
  strategyGoals: StrategyGoal[];
  onUpdatePlan: (id: string, input: Partial<PlanInput>) => Promise<Plan>;
  onAddPlanItem: (input: PlanItemInput) => Promise<PlanItem>;
  onUpdatePlanItem: (id: string, input: Partial<PlanItemInput>) => Promise<PlanItem>;
  onDeletePlanItem: (id: string) => Promise<void>;
  onBack: () => void;
};

const PlanDetailWorkspace: React.FC<Props> = ({
  plan, planItems, projects, strategyGoals, onUpdatePlan, onAddPlanItem, onUpdatePlanItem, onDeletePlanItem, onBack,
}) => {
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [saving, setSaving] = useState<string | null>(null);
  const [showNewItem, setShowNewItem] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [itemForm, setItemForm] = useState<PlanItemInput>({ planId: plan.id, title: '', status: 'todo', priority: 'medium' });
  const [editItemForm, setEditItemForm] = useState<PlanItemInput>({ planId: plan.id, title: '', status: 'todo', priority: 'medium' });
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [localReviewNotes, setLocalReviewNotes] = useState(plan.reviewNotes || '');

  const today = new Date().toISOString().slice(0, 10);

  const itemsByStatus = useMemo(() => ({
    todo: planItems.filter(i => i.status === 'todo'),
    doing: planItems.filter(i => i.status === 'doing'),
    done: planItems.filter(i => i.status === 'done'),
    blocked: planItems.filter(i => i.status === 'blocked'),
  }), [planItems]);

  const overdueItems = useMemo(() =>
    planItems.filter(i => i.dueDate && i.dueDate.slice(0, 10) < today && i.status !== 'done' && i.status !== 'cancelled'),
    [planItems, today],
  );

  const linkedGoal = useMemo(() =>
    strategyGoals.find(g => g.id === plan.linkedStrategyGoalId),
    [strategyGoals, plan.linkedStrategyGoalId],
  );

  const linkedProject = useMemo(() =>
    projects.find(p => p.id === plan.linkedProjectId),
    [projects, plan.linkedProjectId],
  );

  const handleInlineSave = async (field: string, value: unknown) => {
    setSaving(field);
    try { await onUpdatePlan(plan.id, { [field]: value } as Partial<PlanInput>); } catch { /* ignore */ }
    setSaving(null);
  };

  const handleChangeItemStatus = async (item: PlanItem, newStatus: PlanItemStatus) => {
    const update: Partial<PlanItemInput> = { status: newStatus };
    if (newStatus === 'done' && !item.completedAt) {
      update.completedAt = new Date().toISOString().slice(0, 10);
    }
    await onUpdatePlanItem(item.id, update);
  };

  const handleAddItem = async () => {
    if (!itemForm.title?.trim()) return;
    await onAddPlanItem({ ...itemForm, planId: plan.id });
    setItemForm({ planId: plan.id, title: '', status: 'todo', priority: 'medium' });
    setShowNewItem(false);
  };

  const handleEditItem = async () => {
    if (!editingItemId || !editItemForm.title?.trim()) return;
    await onUpdatePlanItem(editingItemId, editItemForm);
    setEditingItemId(null);
  };

  const handleSaveReviewNotes = async () => {
    setSaving('reviewNotes');
    try { await onUpdatePlan(plan.id, { reviewNotes: localReviewNotes }); } catch { /* ignore */ }
    setSaving(null);
  };

  const openEditForm = (item: PlanItem) => {
    setEditItemForm({
      planId: item.planId, title: item.title, description: item.description || '', category: item.category,
      status: item.status, priority: item.priority, dueDate: item.dueDate ? item.dueDate.slice(0, 10) : '',
      completedAt: item.completedAt ? item.completedAt.slice(0, 10) : '',
      linkedProjectId: item.linkedProjectId || '', linkedStrategyGoalId: item.linkedStrategyGoalId || '',
    });
    setEditingItemId(item.id);
  };

  const STATUS_CLASSES: Record<string, string> = {
    todo: 'border-[#e2e8f0] bg-[#f8fafc]',
    doing: 'border-[#2563eb] bg-[#eff6ff]',
    done: 'border-[#86efac] bg-[#f0fdf4]',
    blocked: 'border-[#fca5a5] bg-[#fff5f5]',
  };

  const countMap = { todo: itemsByStatus.todo.length, doing: itemsByStatus.doing.length, done: itemsByStatus.done.length, blocked: itemsByStatus.blocked.length };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-[#64748b] hover:text-[#2563eb] transition-colors">
              ← Back to Plans
            </button>
            <h2 className="text-lg font-semibold text-[#0f172a]">{plan.title}</h2>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            {saving ? <span className="text-xs text-[#64748b]">Saving...</span> : null}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
            plan.type === 'yearly' ? 'border-[#e2e8f0] bg-[#f1f5f9] text-[#334155]' :
            plan.type === 'six_months' ? 'border-[#e2e8f0] bg-[#f1f5f9] text-[#334155]' :
            plan.type === 'quarterly' ? 'border-[#e2e8f0] bg-[#f1f5f9] text-[#334155]' :
            plan.type === 'monthly' ? 'border-[#e2e8f0] bg-[#f1f5f9] text-[#334155]' :
            plan.type === 'weekly' ? 'border-[#2563eb]/20 bg-[#eff6ff] text-[#1d4ed8]' :
            'border-[#e2e8f0] bg-[#f1f5f9] text-[#334155]'
          }`}>{plan.type}</span>
          <select
            value={plan.status}
            onChange={(e) => handleInlineSave('status', e.target.value)}
            className={`rounded-lg border px-2 py-0.5 text-xs font-medium focus:outline-none ${
              plan.status === 'active' ? 'border-[#86efac] bg-[#f0fdf4] text-[#166534]' :
              plan.status === 'completed' ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]' :
              plan.status === 'archived' ? 'border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]' :
              'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]'
            }`}
          >
            {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <select
            value={plan.priority}
            onChange={(e) => handleInlineSave('priority', e.target.value)}
            className={`rounded-lg border px-2 py-0.5 text-xs font-medium focus:outline-none ${
              plan.priority === 'high' ? 'border-[#fecaca] bg-[#fee2e2] text-[#991b1b]' :
              plan.priority === 'medium' ? 'border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]' :
              'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]'
            }`}
          >
            {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          {plan.startDate ? <span className="text-xs text-[#64748b]">{formatDate(plan.startDate)} — {formatDate(plan.endDate)}</span> : null}
          {plan.focus ? <span className="text-xs text-[#64748b] ml-1">Focus: {plan.focus}</span> : null}
        </div>
      </div>

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <DashboardCard title="Total Items" value={planItems.length} />
        <DashboardCard title="Todo" value={countMap.todo} />
        <DashboardCard title="Doing" value={countMap.doing} accent="text-[#2563eb]" />
        <DashboardCard title="Done" value={countMap.done} accent="text-[#166534]" />
        <DashboardCard title="Blocked" value={countMap.blocked} accent="text-[#991b1b]" />
        <DashboardCard title="Overdue" value={overdueItems.length} accent="text-[#92400e]" />
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1 border-b border-[#e2e8f0] pb-2">
        {TABS.map(tab => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
              activeTab === tab.value
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'bg-[#f8fafc] text-[#475569] hover:bg-[#e2e8f0]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)] min-h-[300px]">
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'board' && renderBoard()}
        {activeTab === 'items' && renderItems()}
        {activeTab === 'review' && renderReview()}
      </div>
    </div>
  );

  function renderOverview() {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1.5">Focus</h4>
            <input
              value={plan.focus || ''}
              onChange={(e) => onUpdatePlan(plan.id, { focus: e.target.value || undefined })}
              className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm text-[#0f172a]"
              placeholder="What is the main focus of this plan?"
            />
          </div>
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1.5">Success Criteria</h4>
            <input
              value={plan.successCriteria || ''}
              onChange={(e) => onUpdatePlan(plan.id, { successCriteria: e.target.value || undefined })}
              className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm text-[#0f172a]"
              placeholder="How will you know this plan succeeded?"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1.5">Date Range</h4>
            <div className="flex items-center gap-2 text-sm text-[#334155]">
              <input type="date" value={formatDate(plan.startDate)} onChange={(e) => handleInlineSave('startDate', e.target.value || undefined)} className="rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm text-[#0f172a]" />
              <span className="text-[#64748b]">→</span>
              <input type="date" value={formatDate(plan.endDate)} onChange={(e) => handleInlineSave('endDate', e.target.value || undefined)} className="rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm text-[#0f172a]" />
            </div>
          </div>
          <div>
            <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1.5">Links</h4>
            <div className="flex flex-wrap gap-2 text-sm text-[#334155]">
              {linkedGoal ? <span className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1">Goal: {linkedGoal.title}</span> : <span className="text-[#94a3b8]">No linked goal</span>}
              {linkedProject ? <span className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-1">Project: {linkedProject.name}</span> : null}
            </div>
          </div>
        </div>

        <div>
          <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1.5">Status & Priority</h4>
          <div className="flex flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-[#334155]">
              <span className="text-[#64748b]">Status:</span>
              <select value={plan.status} onChange={(e) => handleInlineSave('status', e.target.value)} className="rounded-lg border border-[#cbd5e1] px-3 py-1.5 text-sm text-[#0f172a]">
                {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm text-[#334155]">
              <span className="text-[#64748b]">Priority:</span>
              <select value={plan.priority} onChange={(e) => handleInlineSave('priority', e.target.value)} className="rounded-lg border border-[#cbd5e1] px-3 py-1.5 text-sm text-[#0f172a]">
                {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </select>
            </label>
          </div>
        </div>
      </div>
    );
  }

  function renderBoard() {
    const columns: Array<{ key: PlanItemStatus; title: string; items: PlanItem[] }> = [
      { key: 'todo', title: 'Todo', items: itemsByStatus.todo },
      { key: 'doing', title: 'Doing', items: itemsByStatus.doing },
      { key: 'done', title: 'Done', items: itemsByStatus.done },
      { key: 'blocked', title: 'Blocked', items: itemsByStatus.blocked },
    ];

    return (
      <div className="space-y-4">
        <div className="flex justify-end">
          <button type="button" onClick={() => setShowNewItem(true)} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8]">+ Add Item</button>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map(col => (
            <div key={col.key} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#0f172a]">{col.title}</h4>
                <span className="rounded-full bg-[#e2e8f0] px-2 py-0.5 text-[11px] font-medium text-[#475569]">{col.items.length}</span>
              </div>
              <div className="space-y-2">
                {col.items.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-[#dbe3ef] bg-white p-4 text-center text-xs text-[#94a3b8]">Empty</div>
                ) : col.items.map(item => (
                  <div key={item.id} className={`rounded-xl border p-3 transition-all hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] ${STATUS_CLASSES[item.status] || 'border-[#dbe3ef] bg-white'}`}>
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-sm font-semibold text-[#0f172a]">{item.title}</h5>
                    </div>
                    {item.description ? <p className="mt-0.5 text-xs text-[#64748b]">{item.description}</p> : null}
                    <div className="mt-1.5 flex flex-wrap gap-1 text-xs text-[#64748b]">
                      {item.category ? <span className="rounded bg-[#f1f5f9] px-1.5 py-0.5">{item.category}</span> : null}
                      {item.priority === 'high' ? <span className="rounded bg-[#fee2e2] px-1.5 py-0.5 text-[#991b1b]">high</span> : null}
                      {item.dueDate ? <span className={item.dueDate.slice(0, 10) < today && item.status !== 'done' ? 'text-[#991b1b]' : ''}>{formatDate(item.dueDate)}</span> : null}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {['todo', 'doing', 'done', 'blocked'].map(s => (
                        s !== item.status ? (
                          <button key={s} type="button" onClick={() => handleChangeItemStatus(item, s as PlanItemStatus)} className="rounded border border-[#cbd5e1] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#475569] hover:border-[#2563eb] hover:text-[#2563eb]">{s}</button>
                        ) : null
                      ))}
                      <button type="button" onClick={() => openEditForm(item)} className="rounded border border-[#cbd5e1] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#475569] hover:border-[#2563eb] hover:text-[#2563eb]">edit</button>
                      <button type="button" onClick={() => onDeletePlanItem(item.id)} className="rounded border border-[#fecaca] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#991b1b] hover:bg-[#fef2f2]">del</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderItems() {
    const filtered = planItems.filter(i => {
      if (filterCategory && i.category !== filterCategory) return false;
      if (filterStatus && i.status !== filterStatus) return false;
      if (filterPriority && i.priority !== filterPriority) return false;
      return true;
    });

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
              <option value="">All categories</option>
              {['work', 'career', 'freelance', 'project', 'money', 'health', 'learning', 'family', 'admin'].map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
              <option value="">All statuses</option>
              {ITEM_STATUS_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
            <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
              <option value="">All priorities</option>
              {PRIORITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
            </select>
          </div>
          <button type="button" onClick={() => setShowNewItem(true)} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8]">+ Add Item</button>
        </div>

        {showNewItem && (
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
            <h5 className="text-sm font-semibold text-[#0f172a] mb-3">New Item</h5>
            <PlanItemForm form={itemForm} onChange={setItemForm} projects={projects} strategyGoals={strategyGoals} />
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleAddItem} disabled={!itemForm.title?.trim()} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] disabled:opacity-50">Add</button>
              <button type="button" onClick={() => setShowNewItem(false)} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#475569]">Cancel</button>
            </div>
          </div>
        )}

        {editingItemId && (
          <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
            <h5 className="text-sm font-semibold text-[#0f172a] mb-3">Edit Item</h5>
            <PlanItemForm form={editItemForm} onChange={setEditItemForm} projects={projects} strategyGoals={strategyGoals} />
            <div className="mt-3 flex gap-2">
              <button type="button" onClick={handleEditItem} disabled={!editItemForm.title?.trim()} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] disabled:opacity-50">Save</button>
              <button type="button" onClick={() => setEditingItemId(null)} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#475569]">Cancel</button>
            </div>
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="rounded-lg border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-8 text-center">
            <p className="text-sm text-[#64748b]">No items yet. Add your first item to start executing.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#e2e8f0] text-left text-xs font-mono uppercase tracking-[0.08em] text-[#64748b]">
                  <th className="pb-2 pr-3 font-medium">Title</th>
                  <th className="pb-2 pr-3 font-medium">Category</th>
                  <th className="pb-2 pr-3 font-medium">Status</th>
                  <th className="pb-2 pr-3 font-medium">Priority</th>
                  <th className="pb-2 pr-3 font-medium">Due</th>
                  <th className="pb-2 pr-3 font-medium">Links</th>
                  <th className="pb-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(item => (
                  <tr key={item.id} className="border-b border-[#f1f5f9] text-[#334155]">
                    <td className="py-2.5 pr-3 font-medium text-[#0f172a]">{item.title}</td>
                    <td className="py-2.5 pr-3 text-[#64748b]">{item.category || '—'}</td>
                    <td className="py-2.5 pr-3">
                      <select value={item.status} onChange={(e) => handleChangeItemStatus(item, e.target.value as PlanItemStatus)} className="rounded border border-[#cbd5e1] px-1.5 py-0.5 text-xs text-[#0f172a]">
                        {ITEM_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </td>
                    <td className="py-2.5 pr-3">
                      <span className={`rounded px-1.5 py-0.5 text-xs ${
                        item.priority === 'high' ? 'bg-[#fee2e2] text-[#991b1b]' :
                        item.priority === 'medium' ? 'bg-[#fff7ed] text-[#9a3412]' :
                        'bg-[#eff6ff] text-[#1d4ed8]'
                      }`}>{item.priority}</span>
                    </td>
                    <td className={`py-2.5 pr-3 text-xs ${item.dueDate && item.dueDate.slice(0, 10) < today && item.status !== 'done' ? 'text-[#991b1b] font-medium' : 'text-[#64748b]'}`}>{formatDate(item.dueDate) || '—'}</td>
                    <td className="py-2.5 pr-3 text-xs text-[#64748b]">
                      {item.linkedStrategyGoalTitle || item.linkedProjectName
                        ? [item.linkedStrategyGoalTitle, item.linkedProjectName].filter(Boolean).join(', ')
                        : '—'}
                    </td>
                    <td className="py-2.5">
                      <div className="flex gap-1">
                        <button type="button" onClick={() => openEditForm(item)} className="rounded border border-[#cbd5e1] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#475569] hover:border-[#2563eb]">Edit</button>
                        <button type="button" onClick={() => onDeletePlanItem(item.id)} className="rounded border border-[#fecaca] bg-white px-1.5 py-0.5 text-[10px] font-medium text-[#991b1b] hover:bg-[#fef2f2]">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  function renderReview() {
    return (
      <div className="space-y-5">
        <div className="rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-[#f8fafc] to-white p-4">
          <h4 className="text-sm font-semibold text-[#0f172a]">Plan Review</h4>
          <p className="mt-1 text-xs text-[#64748b]">Reflect on progress and adjust your approach.</p>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <ReviewCard title="What worked?" icon="✓" tone="success" />
          <ReviewCard title="What failed?" icon="✕" tone="danger" />
          <ReviewCard title="What should continue?" icon="→" tone="neutral" />
          <ReviewCard title="What should stop?" icon="⊘" tone="warning" />
        </div>

        <div>
          <h5 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-2">Review Notes</h5>
          <textarea
            value={localReviewNotes}
            onChange={(e) => setLocalReviewNotes(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-[#cbd5e1] px-3 py-2 text-sm text-[#0f172a]"
            placeholder="Document what you learned, what to adjust, and next steps..."
          />
          <div className="mt-2 flex justify-end">
            <button type="button" onClick={handleSaveReviewNotes} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8]">
              Save Review Notes
            </button>
          </div>
        </div>

        <div>
          <h5 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-2">Next Adjustment</h5>
          <p className="text-sm text-[#475569]">
            {overdueItems.length > 0
              ? `You have ${overdueItems.length} overdue item(s). Consider reviewing priorities or adjusting deadlines.`
              : planItems.length === 0
                ? 'Add items to this plan to start tracking execution.'
                : 'All items are on track. Keep executing and review again next cycle.'}
          </p>
        </div>
      </div>
    );
  }
};

const DashboardCard: React.FC<{ title: string; value: string | number; accent?: string }> = ({ title, value, accent = 'text-[#0f172a]' }) => (
  <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
    <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748b]">{title}</div>
    <div className={`mt-1.5 text-2xl font-semibold ${accent}`}>{value}</div>
  </div>
);

const ReviewCard: React.FC<{ title: string; icon: string; tone: string; children?: React.ReactNode }> = ({ title, icon, tone }) => {
  const borderMap: Record<string, string> = {
    success: 'border-[#bbf7d0] bg-[#f0fdf4]',
    danger: 'border-[#fecaca] bg-[#fef2f2]',
    warning: 'border-[#fde68a] bg-[#fffbeb]',
    neutral: 'border-[#e2e8f0] bg-[#f8fafc]',
  };
  const textMap: Record<string, string> = {
    success: 'text-[#166534]',
    danger: 'text-[#991b1b]',
    warning: 'text-[#92400e]',
    neutral: 'text-[#334155]',
  };

  return (
    <div className={`rounded-xl border p-4 ${borderMap[tone] || borderMap.neutral}`}>
      <h5 className={`text-sm font-semibold ${textMap[tone] || textMap.neutral}`}>
        {icon} {title}
      </h5>
      <p className="mt-1.5 text-xs text-[#64748b]">Reflect and document in the review notes below.</p>
    </div>
  );
};

export default PlanDetailWorkspace;
