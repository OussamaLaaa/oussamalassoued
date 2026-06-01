import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useState, useMemo, useEffect } from 'react';
import { Button, Badge } from '../ui';
import StatCard from '../ui/StatCard';
import PlanDetailWorkspace from './PlanDetailWorkspace';
import PlanForm from './PlanForm';
import type { Plan, PlanInput, PlanItem, PlanItemInput, StrategyGoal, Project, PlanType } from '../../types/opportunities';

type Props = {
  plans: Plan[];
  planItems: PlanItem[];
  projects: Project[];
  strategyGoals: StrategyGoal[];
  section?: PlanSection;
  onAddPlan: (input: PlanInput) => Promise<Plan>;
  onUpdatePlan: (id: string, input: Partial<PlanInput>) => Promise<Plan>;
  onDeletePlan: (id: string) => Promise<void>;
  onAddPlanItem: (input: PlanItemInput) => Promise<PlanItem>;
  onUpdatePlanItem: (id: string, input: Partial<PlanItemInput>) => Promise<PlanItem>;
  onDeletePlanItem: (id: string) => Promise<void>;
};

type PlanSection = 'dashboard' | 'plans' | 'plan_items' | 'timeline' | 'review';

const SECTIONS: Array<{ value: PlanSection; label: string }> = [
 { value: 'dashboard', label: 'Dashboard' },
 { value: 'plans', label: 'Plans' },
 { value: 'plan_items', label: 'Plan Items' },
 { value: 'timeline', label: 'Timeline' },
 { value: 'review', label: 'Review' },
];

const PLAN_TYPES: Array<{ value: PlanType; label: string }> = [
 { value: 'yearly', label: 'Year' },
 { value: 'six_months', label: '6 Months' },
 { value: 'quarterly', label: 'Quarter' },
 { value: 'monthly', label: 'Month' },
 { value: 'weekly', label: 'Week' },
 { value: 'daily', label: 'Daily' },
];

const formatDate = (value?: string) => {
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

const PlansPanel: React.FC<Props> = ({
  plans, planItems, projects, strategyGoals, section, onAddPlan, onUpdatePlan, onDeletePlan, onAddPlanItem, onUpdatePlanItem, onDeletePlanItem,
}) => {
  const { t } = usePersonalLanguage();
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<PlanSection>('dashboard');

  useEffect(() => {
  if (section) setActiveSection(section as PlanSection);
  }, [section]);
 const [activeType, setActiveType] = useState<PlanType>('weekly');
 const [showForm, setShowForm] = useState(false);
 const [planForm, setPlanForm] = useState<PlanInput>({ title: '', type: 'weekly' });

 const selectedPlan = useMemo(() => plans.find(p => p.id === selectedPlanId) ?? null, [plans, selectedPlanId]);
 const filteredPlans = useMemo(() => plans.filter(p => p.type === activeType), [plans, activeType]);

 const today = new Date().toISOString().slice(0, 10);

 const activePlans = plans.filter(p => p.status === 'active');
 const thisWeekItems = planItems.filter(i => i.dueDate && i.dueDate.slice(0, 10) >= today.slice(0, 10) && i.dueDate.slice(0, 10) <= today);
 const overdueItems = planItems.filter(i => i.dueDate && i.dueDate.slice(0, 10) < today && i.status !== 'done' && i.status !== 'cancelled');
 const doneItems = planItems.filter(i => i.status === 'done');
 const highPriorityItems = planItems.filter(i => i.priority === 'high');
 const upcomingItems = planItems.filter(i => i.dueDate && i.dueDate.slice(0, 10) >= today)
 .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
 .slice(0, 5);
 const itemCountTodo = planItems.filter(i => i.status === 'todo').length;
 const itemCountDoing = planItems.filter(i => i.status === 'doing').length;
 const itemCountBlocked = planItems.filter(i => i.status === 'blocked').length;
 const avgPlanProgress = useMemo(() => {
 const vals = plans.map(p => {
 const items = planItems.filter(i => i.planId === p.id);
 return items.length > 0 ? Math.round((items.filter(i => i.status === 'done').length / items.length) * 100) : 0;
 });
 return vals.length > 0 ? Math.round(vals.reduce((a, v) => a + v, 0) / vals.length) : 0;
 }, [plans, planItems]);

 const [planFilterStatus, setPlanFilterStatus] = useState('');
 const [planFilterPriority, setPlanFilterPriority] = useState('');
 const [itemFilterStatus, setItemFilterStatus] = useState('');
 const [itemFilterPriority, setItemFilterPriority] = useState('');

 const handleCreateStarter = async () => {
 const created = await Promise.all([
 onAddPlan({ title: 'Year Plan — Build Independent Income & Portfolio', type: 'yearly', status: 'active', priority: 'high', focus: 'Build sustainable income and a proof-driven portfolio', successCriteria: 'Monthly income from freelancing + completed portfolio with 4+ case studies' }),
 onAddPlan({ title: '6-Month Plan — First 3 Clients & Portfolio Launch', type: 'six_months', status: 'active', priority: 'high', focus: 'Win first 3 freelance clients and publish full portfolio', successCriteria: '3 paid projects delivered + portfolio live with case studies' }),
 onAddPlan({ title: 'Monthly Plan — Outreach & Portfolio Sprint', type: 'monthly', status: 'active', priority: 'high', focus: 'Daily outreach + weekly portfolio improvements', successCriteria: '100 outreach messages sent, 1 portfolio section finished', reviewNotes: '' }),
 onAddPlan({ title: 'Weekly Plan — Execute & Review', type: 'weekly', status: 'active', priority: 'high', focus: 'Execute weekly tactics and review progress', successCriteria: '5 outreach messages, 1 audit delivered, 1 portfolio update', reviewNotes: '' }),
 ]);
 setSelectedPlanId(created[3]?.id || null);
 };

 const openNewPlanForm = (type: PlanType) => {
 setPlanForm({ title: '', type, status: 'planned', priority: 'medium', focus: '', successCriteria: '', startDate: '', endDate: '' });
 setShowForm(true);
 };

 const handleSaveNewPlan = async () => {
 if (!planForm.title?.trim()) return;
 await onAddPlan(planForm);
 setShowForm(false);
 };

 if (selectedPlan) {
 const items = planItems.filter(i => i.planId === selectedPlan.id);
 return (
 <PlanDetailWorkspace
 plan={selectedPlan}
 planItems={items}
 projects={projects}
 strategyGoals={strategyGoals}
 onUpdatePlan={onUpdatePlan}
 onAddPlanItem={onAddPlanItem}
 onUpdatePlanItem={onUpdatePlanItem}
 onDeletePlanItem={onDeletePlanItem}
 onBack={() => setSelectedPlanId(null)}
 />
 );
 }

 const filteredItems = planItems.filter(i => {
 if (itemFilterStatus && i.status !== itemFilterStatus) return false;
 if (itemFilterPriority && i.priority !== itemFilterPriority) return false;
 return true;
 });

 return (
 <div className="space-y-6">
 {plans.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-6">
 <div className="flex flex-wrap items-center justify-between gap-4">
 <div>
 <h3 className="text-base font-semibold text-neutral-900">Create Starter Planning System</h3>
 <p className="mt-1 text-sm text-neutral-600">Bootstrap year, 6-month, monthly, and weekly plans with built-in focus and success criteria.</p>
 </div>
 <Button type="button" variant="primary" size="lg" onClick={handleCreateStarter}>
 Create Starter Plans
 </Button>
 </div>
 </div>
 ) : null}

  {activeSection === 'dashboard' && (
 <div className="space-y-6">
 <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
 <StatCard label="Total Plans" value={plans.length} hint="All time" />
 <StatCard label="Active Plans" value={activePlans.length} hint="Currently running" />
 <StatCard label="Total Items" value={planItems.length} hint="Across all plans" />
 <StatCard label={t("Completed", "Completed", "Completed")} value={doneItems.length} hint="Items marked done" />
 <StatCard label="High Priority" value={highPriorityItems.length} hint="Needs attention" />
 <StatCard label="Avg Progress" value={`${avgPlanProgress}%`} hint="Across plans" />
 </section>

 <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Active Plans</h3>
 <p className="mt-0.5 text-xs text-neutral-500">Plans currently in motion.</p>
 </div>
 </div>
 {activePlans.length === 0 ? (
 <div className="px-5 py-4 text-sm text-neutral-500">No active plans yet.</div>
 ) : (
 <ul className="divide-y divide-neutral-100">
 {activePlans.slice(0, 5).map(plan => {
 const items = planItems.filter(i => i.planId === plan.id);
 const done = items.filter(i => i.status === 'done').length;
 const total = items.length;
 const progress = total > 0 ? Math.round((done / total) * 100) : 0;
 return (
 <li key={plan.id} className="px-5 py-3 cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setSelectedPlanId(plan.id)}>
 <div className="flex items-center justify-between gap-2">
 <span className="text-sm text-neutral-900 truncate font-medium">{plan.title}</span>
 <Badge variant={getPriorityVariant(plan.priority)}>{plan.priority}</Badge>
 </div>
 <div className="mt-1 text-xs text-neutral-500">{plan.focus || plan.type}</div>
 <div className="mt-2 flex items-center gap-2">
 <div className="h-1.5 flex-1 rounded-full bg-neutral-100 overflow-hidden">
 <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${progress}%` }} />
 </div>
 <span className="text-xs tabular-nums text-neutral-500">{progress}%</span>
 </div>
 </li>
 );
 })}
 </ul>
 )}
 {activePlans.length > 5 ? (
 <div className="border-t border-neutral-100 px-5 py-2.5 text-xs text-neutral-500 text-center">+{activePlans.length - 5} more</div>
 ) : null}
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Upcoming Items</h3>
 <p className="mt-0.5 text-xs text-neutral-500">Next items due.</p>
 </div>
 </div>
 {upcomingItems.length === 0 ? (
 <div className="px-5 py-4 text-sm text-neutral-500">No upcoming items.</div>
 ) : (
 <ul className="divide-y divide-neutral-100">
 {upcomingItems.map(item => (
 <li key={item.id} className="px-5 py-3">
 <div className="flex items-center justify-between gap-2">
 <span className="text-sm text-neutral-900 truncate">{item.title}</span>
 <span className="text-xs text-neutral-500 shrink-0">{formatDate(item.dueDate)}</span>
 </div>
 <div className="mt-0.5 flex items-center gap-2">
 {item.linkedStrategyGoalTitle ? <span className="text-xs text-neutral-500 truncate">{item.linkedStrategyGoalTitle}</span> : null}
 </div>
 </li>
 ))}
 </ul>
 )}
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">High Priority</h3>
 <p className="mt-0.5 text-xs text-neutral-500">Items needing attention.</p>
 </div>
 </div>
 {highPriorityItems.length === 0 ? (
 <div className="px-5 py-4 text-sm text-neutral-500">No high priority planning items.</div>
 ) : (
 <ul className="divide-y divide-neutral-100">
 {highPriorityItems.slice(0, 5).map(item => (
 <li key={item.id} className="px-5 py-3">
 <div className="flex items-center justify-between gap-2">
 <span className="text-sm text-neutral-900 truncate">{item.title}</span>
 <Badge variant={getItemStatusVariant(item.status)}>{item.status}</Badge>
 </div>
 <div className="mt-0.5 text-xs text-neutral-500">{item.dueDate ? `Due: ${formatDate(item.dueDate)}` : ''}</div>
 </li>
 ))}
 </ul>
 )}
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Progress Snapshot</h3>
 <p className="mt-0.5 text-xs text-neutral-500">Items by status.</p>
 </div>
 </div>
 <ul className="divide-y divide-neutral-100">
 <li className="flex items-center justify-between px-5 py-3">
 <span className="text-sm text-neutral-700">Completed</span>
 <span className="text-sm tabular-nums text-neutral-900">{doneItems.length}</span>
 </li>
 <li className="flex items-center justify-between px-5 py-3">
 <span className="text-sm text-neutral-700">Active (Doing)</span>
 <span className="text-sm tabular-nums text-neutral-900">{itemCountDoing}</span>
 </li>
 <li className="flex items-center justify-between px-5 py-3">
 <span className="text-sm text-neutral-700">Todo</span>
 <span className="text-sm tabular-nums text-neutral-900">{itemCountTodo}</span>
 </li>
 <li className="flex items-center justify-between px-5 py-3">
 <span className="text-sm text-neutral-700">Blocked</span>
 <span className="text-sm tabular-nums text-neutral-900">{itemCountBlocked}</span>
 </li>
 <li className="flex items-center justify-between px-5 py-3">
 <span className="text-sm text-neutral-700">Overdue</span>
 <span className="text-sm tabular-nums text-neutral-900">{overdueItems.length}</span>
 </li>
 </ul>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Review Needed</h3>
 <p className="mt-0.5 text-xs text-neutral-500">Overdue and needs attention.</p>
 </div>
 </div>
 {overdueItems.length === 0 ? (
 <div className="px-5 py-4 text-sm text-neutral-500">No overdue items. All on track.</div>
 ) : (
 <ul className="divide-y divide-neutral-100">
 {overdueItems.slice(0, 5).map(item => (
 <li key={item.id} className="px-5 py-3">
 <div className="flex items-center justify-between gap-2">
 <span className="text-sm text-neutral-900 truncate">{item.title}</span>
 <Badge variant="danger">Overdue</Badge>
 </div>
 <div className="mt-0.5 text-xs text-neutral-500">Due: {formatDate(item.dueDate)}</div>
 </li>
 ))}
 </ul>
 )}
 {overdueItems.length > 5 ? (
 <div className="border-t border-neutral-100 px-5 py-2.5 text-xs text-neutral-500 text-center">+{overdueItems.length - 5} more overdue</div>
 ) : null}
 </div>
 </div>
 </div>
 )}

 {activeSection === 'plans' && (
 <div className="space-y-4">
 <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-2">
 {PLAN_TYPES.map(pt => (
 <button
 key={pt.value}
 type="button"
 onClick={() => setActiveType(pt.value)}
 className={`px-4 py-2 text-sm font-medium transition-all ${
 activeType === pt.value
 ? 'text-neutral-900 border-b-2 border-neutral-900'
 : 'text-neutral-500 hover:text-neutral-700 border-b-2 border-transparent'
 }`}
 >
 {pt.label}
 </button>
 ))}
 <div className="ml-auto flex gap-2">
 <Button type="button" variant="primary" size="sm" onClick={() => openNewPlanForm(activeType)}>
 + New {PLAN_TYPES.find(t => t.value === activeType)?.label} Plan
 </Button>
 </div>
 </div>

 {showForm && (
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900 mb-3">New {PLAN_TYPES.find(t => t.value === planForm.type)?.label} Plan</h4>
 <PlanForm form={planForm} onChange={setPlanForm} projects={projects} strategyGoals={strategyGoals} />
 <div className="mt-4 flex items-center gap-2">
 <Button type="button" variant="primary" size="sm" onClick={handleSaveNewPlan} disabled={!planForm.title?.trim()}>
 Save Plan
 </Button>
 <Button type="button" variant="secondary" size="sm" onClick={() => setShowForm(false)}>
 Cancel
 </Button>
 </div>
 </div>
 )}

  <div className="flex flex-wrap gap-2">
  <select value={planFilterStatus} onChange={(e) => setPlanFilterStatus(e.target.value)}
  className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
  <option value="">All statuses</option>
  {['planned', 'active', 'completed', 'archived'].map(v => <option key={v} value={v}>{v}</option>)}
  </select>
  <select value={planFilterPriority} onChange={(e) => setPlanFilterPriority(e.target.value)}
  className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
 <option value="">All priorities</option>
 {['high', 'medium', 'low'].map(v => <option key={v} value={v}>{v}</option>)}
 </select>
 </div>

 {filteredPlans.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
 <h3 className="text-base font-semibold text-neutral-900">No {activeType} plans yet.</h3>
 <p className="mt-2 text-sm text-neutral-500">Create one to start planning.</p>
 <div className="mt-5">
 <Button variant="primary" size="sm" onClick={() => openNewPlanForm(activeType)}>+ New {PLAN_TYPES.find(t => t.value === activeType)?.label} Plan</Button>
 </div>
 </div>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-3">
 {filteredPlans.filter(p => {
 if (planFilterStatus && p.status !== planFilterStatus) return false;
 if (planFilterPriority && p.priority !== planFilterPriority) return false;
 return true;
 }).map(plan => {
 const items = planItems.filter(i => i.planId === plan.id);
 const done = items.filter(i => i.status === 'done').length;
 const total = items.length;
 const progress = total > 0 ? Math.round((done / total) * 100) : 0;
 return (
 <div
 key={plan.id}
 onClick={() => setSelectedPlanId(plan.id)}
 className="rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 cursor-pointer transition-colors"
 >
 <div className="flex items-start justify-between gap-3 px-5 pt-4">
 <div className="min-w-0 flex-1">
 <h4 className="text-sm font-semibold text-neutral-900">{plan.title}</h4>
 {plan.focus ? <p className="mt-0.5 text-xs text-neutral-500">{plan.focus}</p> : null}
 </div>
 <div className="flex shrink-0 flex-wrap gap-1.5">
 <Badge variant="neutral">{plan.type}</Badge>
 <Badge variant={getStatusVariant(plan.status)}>{plan.status}</Badge>
 <Badge variant={getPriorityVariant(plan.priority)}>{plan.priority}</Badge>
 </div>
 </div>
 <div className="flex flex-wrap gap-x-4 gap-y-1 px-5 pb-2 pt-1 text-xs text-neutral-500">
 {plan.startDate ? <span>{formatDate(plan.startDate)} — {formatDate(plan.endDate)}</span> : null}
 {total > 0 ? <span>{done}/{total} done ({progress}%)</span> : null}
 {plan.linkedStrategyGoalTitle ? <span>Goal: {plan.linkedStrategyGoalTitle}</span> : null}
 {plan.linkedProjectName ? <span>Project: {plan.linkedProjectName}</span> : null}
 </div>
 {total > 0 ? (
 <div className="px-5 pb-4">
 <div className="flex items-center gap-2">
 <div className="h-1.5 flex-1 rounded-full bg-neutral-100 overflow-hidden">
 <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${progress}%` }} />
 </div>
 <span className="text-xs tabular-nums text-neutral-500">{progress}%</span>
 </div>
 </div>
 ) : null}
 <div className="flex items-center justify-end gap-1 border-t border-neutral-100 px-5 py-2">
 <button type="button" aria-label={t("Delete", "Delete", "Delete")} onClick={(e) => { e.stopPropagation(); onDeletePlan(plan.id); }}
 className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
 </button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 )}

 {activeSection === 'plan_items' && (
 <div className="space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
  <div className="flex flex-wrap gap-2">
  <select value={itemFilterStatus} onChange={(e) => setItemFilterStatus(e.target.value)}
  className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
  <option value="">All statuses</option>
  {['todo', 'doing', 'done', 'blocked', 'cancelled'].map(v => <option key={v} value={v}>{v}</option>)}
  </select>
  <select value={itemFilterPriority} onChange={(e) => setItemFilterPriority(e.target.value)}
  className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
 <option value="">All priorities</option>
 {['high', 'medium', 'low'].map(v => <option key={v} value={v}>{v}</option>)}
 </select>
 </div>
 </div>
 {filteredItems.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
 <h3 className="text-base font-semibold text-neutral-900">No plan items yet.</h3>
 <p className="mt-2 text-sm text-neutral-500">Add items to your plans to track execution.</p>
 </div>
 </div>
 ) : (
 <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
 <div className="overflow-x-auto">
 <table className="min-w-full border-collapse">
 <thead>
 <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Item</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Plan</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Priority</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Status</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Due date</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Links</th>
 </tr>
 </thead>
 <tbody>
 {filteredItems.map(item => {
 const relatedPlan = plans.find(p => p.id === item.planId);
 return (
 <tr key={item.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors">
 <td className="px-4 py-3 align-middle text-sm text-neutral-900 font-medium">{item.title}</td>
 <td className="px-4 py-3 align-middle text-sm text-neutral-700">{relatedPlan?.title || '—'}</td>
 <td className="px-4 py-3 align-middle"><Badge variant={getPriorityVariant(item.priority)}>{item.priority}</Badge></td>
 <td className="px-4 py-3 align-middle"><Badge variant={getItemStatusVariant(item.status)}>{item.status}</Badge></td>
 <td className={`px-4 py-3 align-middle text-sm ${item.dueDate && item.dueDate.slice(0, 10) < today && item.status !== 'done' && item.status !== 'cancelled' ? 'text-red-600 font-medium' : 'text-neutral-700'}`}>
 {formatDate(item.dueDate) || '—'}
 </td>
 <td className="px-4 py-3 align-middle text-xs text-neutral-500 max-w-[160px] truncate">
 {[item.linkedStrategyGoalTitle, item.linkedProjectName].filter(Boolean).join(', ') || '—'}
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 )}

 {activeSection === 'timeline' && (
 <div className="space-y-4">
 {plans.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
 <h3 className="text-base font-semibold text-neutral-900">No plans to show on timeline.</h3>
 <p className="mt-2 text-sm text-neutral-500">Create plans with date ranges to see them here.</p>
 </div>
 </div>
 ) : (
 PLAN_TYPES.map(pt => {
 const typePlans = plans.filter(p => p.type === pt.value);
 if (typePlans.length === 0) return null;
 return (
 <div key={pt.value} className="rounded-xl border border-neutral-200 bg-white">
 <div className="border-b border-neutral-200 px-5 py-3">
 <h3 className="text-sm font-semibold text-neutral-900">{pt.label} Plans</h3>
 </div>
 <ul className="divide-y divide-neutral-100">
 {typePlans.map(plan => {
 const items = planItems.filter(i => i.planId === plan.id);
 const done = items.filter(i => i.status === 'done').length;
 const total = items.length;
 const progress = total > 0 ? Math.round((done / total) * 100) : 0;
 return (
 <li key={plan.id} className="px-5 py-3 cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setSelectedPlanId(plan.id)}>
 <div className="flex items-center justify-between gap-2">
 <span className="text-sm text-neutral-900 font-medium">{plan.title}</span>
 <div className="flex items-center gap-2">
 <Badge variant={getStatusVariant(plan.status)}>{plan.status}</Badge>
 <span className="text-xs text-neutral-500">{formatDate(plan.startDate)} — {formatDate(plan.endDate)}</span>
 </div>
 </div>
 {total > 0 ? (
 <div className="mt-2 flex items-center gap-2">
 <div className="h-1.5 flex-1 rounded-full bg-neutral-100 overflow-hidden">
 <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${progress}%` }} />
 </div>
 <span className="text-xs tabular-nums text-neutral-500">{progress}%</span>
 </div>
 ) : null}
 </li>
 );
 })}
 </ul>
 </div>
 );
 })
 )}
 </div>
 )}

 {activeSection === 'review' && (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h3 className="text-sm font-semibold text-neutral-900">Plan Review</h3>
 <p className="mt-1 text-xs text-neutral-500">Use this section to review what worked, what failed, and what to focus on next.</p>
 </div>

 <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">Overdue Items</h4>
 <div className="mt-3 space-y-2">
 {overdueItems.length === 0 ? (
 <p className="text-sm text-neutral-500">No overdue items. All on track.</p>
 ) : (
 overdueItems.slice(0, 5).map(item => (
 <div key={item.id} className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
 <div className="font-medium">{item.title}</div>
 <div className="text-xs">Due: {formatDate(item.dueDate)}</div>
 </div>
 ))
 )}
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">Completed Items</h4>
 <div className="mt-3 space-y-2">
 {doneItems.length === 0 ? (
 <p className="text-sm text-neutral-500">No completed items yet.</p>
 ) : (
 doneItems.slice(0, 5).map(item => (
 <div key={item.id} className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 text-sm text-emerald-700">
 <div className="font-medium">{item.title}</div>
 {item.completedAt ? <div className="text-xs">Done: {formatDate(item.completedAt)}</div> : null}
 </div>
 ))
 )}
 {doneItems.length > 5 ? (
 <div className="text-xs text-neutral-500 text-center">+{doneItems.length - 5} more</div>
 ) : null}
 </div>
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">Plans with Review Notes</h4>
 <div className="mt-3 space-y-3">
 {plans.filter(p => p.reviewNotes).length === 0 ? (
 <p className="text-sm text-neutral-500">No review notes yet. Open a plan to add review notes.</p>
 ) : (
 plans.filter(p => p.reviewNotes).slice(0, 5).map(plan => (
 <div key={plan.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
 <div className="flex items-center justify-between">
 <span className="text-sm font-medium text-neutral-900">{plan.title}</span>
 <button type="button" onClick={() => setSelectedPlanId(plan.id)} className="text-xs text-neutral-500 hover:text-neutral-900">Open</button>
 </div>
 <p className="mt-1 text-xs text-neutral-600 line-clamp-2">{plan.reviewNotes}</p>
 </div>
 ))
 )}
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default PlansPanel;
