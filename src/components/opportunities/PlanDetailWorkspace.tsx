import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useState, useMemo } from 'react';
import { Button, Badge } from '../ui';
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
const CATEGORY_OPTIONS = ['work', 'career', 'freelance', 'project', 'money', 'health', 'learning', 'family', 'admin'];

const formatDate = (value?: string) => {
  const { t, language } = usePersonalLanguage();

 if (!value) return '';
 return value.slice(0, 10);
};

const getStatusVariant = (s: string) => {
 if (s === 'active') return 'success';
 if (s === 'completed') return 'success';
 if (s === 'archived') return 'neutral';
 return 'neutral';
};

const getPriorityVariant = (p: string) => {
 if (p === 'high') return 'warning';
 if (p === 'medium') return 'neutral';
 return 'neutral';
};

const getItemStatusVariant = (s: string) => {
 if (s === 'done') return 'success';
 if (s === 'doing') return 'blue';
 if (s === 'blocked') return 'danger';
 if (s === 'cancelled') return 'neutral';
 return 'neutral';
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

 const countMap = { todo: itemsByStatus.todo.length, doing: itemsByStatus.doing.length, done: itemsByStatus.done.length, blocked: itemsByStatus.blocked.length };

 return (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="px-5 pt-4">
 <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
 Back to Plans
 </button>
 <div className="flex flex-wrap items-start justify-between gap-3 mt-2">
 <div className="min-w-0 flex-1">
 <h2 className="text-lg font-semibold text-neutral-900">{plan.title}</h2>
 </div>
 <div className="flex shrink-0 items-center gap-2">
 {saving ? <span className="text-xs text-neutral-500">Saving...</span> : null}
 </div>
 </div>
 <div className="mt-3 flex flex-wrap items-center gap-1.5 pb-4">
 <Badge variant="neutral">{plan.type}</Badge>
 <select
 value={plan.status}
 onChange={(e) => handleInlineSave('status', e.target.value)}
 className="h-7 rounded-md border border-neutral-200 bg-white px-2 text-xs text-neutral-700 outline-none hover:border-neutral-300"
 >
 {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 <select
 value={plan.priority}
 onChange={(e) => handleInlineSave('priority', e.target.value)}
 className="h-7 rounded-md border border-neutral-200 bg-white px-2 text-xs text-neutral-700 outline-none hover:border-neutral-300"
 >
 {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 {plan.startDate ? <span className="text-xs text-neutral-500">{formatDate(plan.startDate)} — {formatDate(plan.endDate)}</span> : null}
 {plan.focus ? <span className="text-xs text-neutral-500">Focus: {plan.focus}</span> : null}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
 <StatCardDetail title="Total Items" value={planItems.length} />
 <StatCardDetail title="Todo" value={countMap.todo} />
 <StatCardDetail title="Doing" value={countMap.doing} />
 <StatCardDetail title={t("Done", "Done", "Done")} value={countMap.done} />
 <StatCardDetail title={t("Blocked", "Blocked", "Blocked")} value={countMap.blocked} />
 <StatCardDetail title={t("Overdue", "Overdue", "Overdue")} value={overdueItems.length} />
 </div>

 <div className="flex flex-wrap gap-1.5 border-b border-neutral-200 pb-2">
 {TABS.map(tab => (
 <button
 key={tab.value}
 type="button"
 onClick={() => setActiveTab(tab.value)}
 className={`px-4 py-2 text-sm font-medium transition-all ${
 activeTab === tab.value
 ? 'text-neutral-900 border-b-2 border-neutral-900'
 : 'text-neutral-500 hover:text-neutral-700 border-b-2 border-transparent'
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>

 <div className="min-h-[200px]">
 {activeTab === 'overview' && renderOverview()}
 {activeTab === 'board' && renderBoard()}
 {activeTab === 'items' && renderItems()}
 {activeTab === 'review' && renderReview()}
 </div>
 </div>
 );

 function renderOverview() {
 return (
 <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-5">
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">Focus</h4>
 <input
 value={plan.focus || ''}
 onChange={(e) => handleInlineSave('focus', e.target.value || undefined)}
 className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400"
 placeholder="What is the main focus of this plan?"
 />
 </div>
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">Success Criteria</h4>
 <input
 value={plan.successCriteria || ''}
 onChange={(e) => handleInlineSave('successCriteria', e.target.value || undefined)}
 className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400"
 placeholder="How will you know this plan succeeded?"
 />
 </div>
 </div>

 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">Date Range</h4>
 <div className="flex items-center gap-2 text-sm text-neutral-700">
 <input type="date" value={formatDate(plan.startDate)} onChange={(e) => handleInlineSave('startDate', e.target.value || undefined)} className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" />
 <span className="text-neutral-400">→</span>
 <input type="date" value={formatDate(plan.endDate)} onChange={(e) => handleInlineSave('endDate', e.target.value || undefined)} className="rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" />
 </div>
 </div>
 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">Links</h4>
 <div className="flex flex-wrap gap-2 text-sm text-neutral-700">
 {linkedGoal ? <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs">Goal: {linkedGoal.title}</span> : <span className="text-xs text-neutral-400">No linked goal</span>}
 {linkedProject ? <span className="rounded-md border border-neutral-200 bg-neutral-50 px-2.5 py-1 text-xs">Project: {linkedProject.name}</span> : null}
 </div>
 </div>
 </div>

 <div>
 <h4 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-1.5">Status & Priority</h4>
 <div className="flex flex-wrap gap-3">
 <label className="flex items-center gap-2 text-sm text-neutral-700">
 <span className="text-neutral-500">Status:</span>
 <select value={plan.status} onChange={(e) => handleInlineSave('status', e.target.value)} className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400">
 {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 </label>
 <label className="flex items-center gap-2 text-sm text-neutral-700">
 <span className="text-neutral-500">Priority:</span>
 <select value={plan.priority} onChange={(e) => handleInlineSave('priority', e.target.value)} className="rounded-md border border-neutral-200 px-3 py-1.5 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400">
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
 <Button type="button" variant="primary" size="sm" onClick={() => setShowNewItem(true)}>+ Add Item</Button>
 </div>
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
 {columns.map(col => (
 <div key={col.key} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
 <div className="mb-2 flex items-center justify-between">
 <h4 className="text-sm font-semibold text-neutral-900">{col.title}</h4>
 <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-xs font-medium text-neutral-600">{col.items.length}</span>
 </div>
 <div className="space-y-2">
 {col.items.length === 0 ? (
 <div className="rounded-lg border-2 border-dashed border-neutral-200 bg-white p-4 text-center text-xs text-neutral-400">Empty</div>
 ) : col.items.map(item => (
 <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-3">
 <div className="flex items-start justify-between gap-2">
 <h5 className="text-sm font-semibold text-neutral-900">{item.title}</h5>
 </div>
 {item.description ? <p className="mt-0.5 text-xs text-neutral-500">{item.description}</p> : null}
 <div className="mt-1.5 flex flex-wrap gap-1 text-xs text-neutral-500">
 {item.category ? <Badge variant="neutral">{item.category}</Badge> : null}
 {item.priority === 'high' ? <Badge variant="warning">high</Badge> : null}
 {item.dueDate ? <span className={item.dueDate.slice(0, 10) < today && item.status !== 'done' ? 'text-red-600' : 'text-neutral-500'}>{formatDate(item.dueDate)}</span> : null}
 </div>
 <div className="mt-2 flex flex-wrap gap-1">
 {['todo', 'doing', 'done', 'blocked'].map(s => (
 s !== item.status ? (
 <button key={s} type="button" onClick={() => handleChangeItemStatus(item, s as PlanItemStatus)}
 className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-xs font-medium text-neutral-600 hover:border-neutral-300 hover:text-neutral-900">{s}</button>
 ) : null
 ))}
 <button type="button" onClick={() => openEditForm(item)}
 className="rounded border border-neutral-200 bg-white px-1.5 py-0.5 text-xs font-medium text-neutral-600 hover:border-neutral-300 hover:text-neutral-900">edit</button>
 <button type="button" onClick={() => onDeletePlanItem(item.id)}
 className="rounded border border-red-200 bg-white px-1.5 py-0.5 text-xs font-medium text-red-600 hover:bg-red-50">del</button>
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
  <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
  className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
  <option value="">All categories</option>
  {CATEGORY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
  </select>
  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
  className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
  <option value="">All statuses</option>
  {ITEM_STATUS_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
  </select>
  <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
  className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
 <option value="">All priorities</option>
 {PRIORITY_OPTIONS.map(v => <option key={v} value={v}>{v}</option>)}
 </select>
 </div>
 <Button type="button" variant="primary" size="sm" onClick={() => setShowNewItem(true)}>+ Add Item</Button>
 </div>

 {showNewItem && (
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h5 className="text-sm font-semibold text-neutral-900 mb-3">New Item</h5>
 <PlanItemForm form={itemForm} onChange={setItemForm} projects={projects} strategyGoals={strategyGoals} />
 <div className="mt-3 flex gap-2">
 <Button type="button" variant="primary" size="sm" onClick={handleAddItem} disabled={!itemForm.title?.trim()}>Add</Button>
 <Button type="button" variant="secondary" size="sm" onClick={() => setShowNewItem(false)}>Cancel</Button>
 </div>
 </div>
 )}

 {editingItemId && (
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h5 className="text-sm font-semibold text-neutral-900 mb-3">Edit Item</h5>
 <PlanItemForm form={editItemForm} onChange={setEditItemForm} projects={projects} strategyGoals={strategyGoals} />
 <div className="mt-3 flex gap-2">
 <Button type="button" variant="primary" size="sm" onClick={handleEditItem} disabled={!editItemForm.title?.trim()}>Save</Button>
 <Button type="button" variant="secondary" size="sm" onClick={() => setEditingItemId(null)}>Cancel</Button>
 </div>
 </div>
 )}

 {filtered.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
 <h3 className="text-base font-semibold text-neutral-900">No items yet.</h3>
 <p className="mt-2 text-sm text-neutral-500">Add your first item to start executing.</p>
 <div className="mt-5">
 <Button variant="primary" size="sm" onClick={() => setShowNewItem(true)}>+ Add Item</Button>
 </div>
 </div>
 </div>
 ) : (
 <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
 <div className="overflow-x-auto">
 <table className="min-w-full border-collapse">
 <thead>
 <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Title</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Category</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Status</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Priority</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Due</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Links</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Actions</th>
 </tr>
 </thead>
 <tbody>
 {filtered.map(item => (
 <tr key={item.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors">
 <td className="px-4 py-3 align-middle text-sm text-neutral-900 font-medium">{item.title}</td>
 <td className="px-4 py-3 align-middle text-sm text-neutral-700">{item.category || '—'}</td>
 <td className="px-4 py-3 align-middle">
 <select value={item.status} onChange={(e) => handleChangeItemStatus(item, e.target.value as PlanItemStatus)}
 className="rounded-md border border-neutral-200 px-1.5 py-1 text-xs text-neutral-700 bg-white outline-none hover:border-neutral-300">
 {ITEM_STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 </td>
 <td className="px-4 py-3 align-middle"><Badge variant={getPriorityVariant(item.priority)}>{item.priority}</Badge></td>
 <td className={`px-4 py-3 align-middle text-sm ${item.dueDate && item.dueDate.slice(0, 10) < today && item.status !== 'done' ? 'text-red-600 font-medium' : 'text-neutral-700'}`}>
 {formatDate(item.dueDate) || '—'}
 </td>
 <td className="px-4 py-3 align-middle text-xs text-neutral-500 max-w-[160px] truncate">
 {[item.linkedStrategyGoalTitle, item.linkedProjectName].filter(Boolean).join(', ') || '—'}
 </td>
 <td className="px-4 py-3 align-middle">
 <div className="flex items-center gap-1">
 <button type="button" onClick={() => openEditForm(item)}
 className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-200 hover:bg-neutral-50 transition-colors">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
 </button>
 <button type="button" onClick={() => onDeletePlanItem(item.id)}
 className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 );
 }

 function renderReview() {
 return (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">Plan Review</h4>
 <p className="mt-1 text-xs text-neutral-500">Reflect on progress and adjust your approach.</p>
 </div>

 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
 <h5 className="text-sm font-semibold text-emerald-800">✓ What worked?</h5>
 <p className="mt-1.5 text-xs text-emerald-600">Reflect and document in the review notes below.</p>
 </div>
 <div className="rounded-xl border border-red-200 bg-red-50 p-4">
 <h5 className="text-sm font-semibold text-red-800">✕ What failed?</h5>
 <p className="mt-1.5 text-xs text-red-600">Reflect and document in the review notes below.</p>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
 <h5 className="text-sm font-semibold text-neutral-800">→ What should continue?</h5>
 <p className="mt-1.5 text-xs text-neutral-600">Reflect and document in the review notes below.</p>
 </div>
 <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
 <h5 className="text-sm font-semibold text-amber-800">⊘ What should stop?</h5>
 <p className="mt-1.5 text-xs text-amber-600">Reflect and document in the review notes below.</p>
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h5 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">Review Notes</h5>
 <textarea
 value={localReviewNotes}
 onChange={(e) => setLocalReviewNotes(e.target.value)}
 rows={4}
 className="w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400"
 placeholder="Document what you learned, what to adjust, and next steps..."
 />
 <div className="mt-2 flex justify-end">
 <Button type="button" variant="primary" size="sm" onClick={handleSaveReviewNotes}>
 Save Review Notes
 </Button>
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h5 className="text-xs font-semibold uppercase tracking-wide text-neutral-500 mb-2">Next Adjustment</h5>
 <p className="text-sm text-neutral-700">
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

const StatCardDetail: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-xs text-neutral-500 font-medium">{title}</div>
 <div className="mt-1.5 text-2xl font-bold text-neutral-900">{value}</div>
 </div>
);

export default PlanDetailWorkspace;
