import React, { useState, useMemo } from 'react';
import LabelPill from './StrategyLabelPill';
import type {
 Company, Project,
 StrategyGoal, StrategyGoalInput,
 StrategyPlan, StrategyPlanInput,
 StrategyTactic, StrategyTacticInput,
 StrategyExperiment, StrategyExperimentInput,
 StrategyDecision, StrategyDecisionInput,
 StrategyPriority, StrategyStatus, StrategyTimeHorizon,
} from '../../types/opportunities';

type DetailTab = 'overview' | 'plans' | 'tactics' | 'experiments' | 'decisions' | 'review';

const TABS: Array<{ value: DetailTab; label: string }> = [
 { value: 'overview', label: 'Overview' },
 { value: 'plans', label: 'Plans A/B/C' },
 { value: 'tactics', label: 'Tactics' },
 { value: 'experiments', label: 'Experiments' },
 { value: 'decisions', label: 'Decisions' },
 { value: 'review', label: 'Review' },
];

const STATUS_OPTIONS: StrategyStatus[] = ['active', 'planned', 'paused', 'completed', 'archived', 'failed'];
const PRIORITY_OPTIONS: StrategyPriority[] = ['high', 'medium', 'low'];
const TIME_HORIZON_OPTIONS: StrategyTimeHorizon[] = ['yearly', 'six_months', 'quarterly', 'monthly', 'weekly', 'daily'];
const CATEGORY_OPTIONS = ['career', 'freelance', 'portfolio', 'money', 'investment', 'learning', 'health', 'ethical_filter', 'positioning', 'operations'];

const formatDate = (value?: string) => {
 if (!value) return '';
 return value.slice(0, 10);
};

type Props = {
 goal: StrategyGoal;
 allGoals: StrategyGoal[];
 strategyPlans: StrategyPlan[];
 strategyTactics: StrategyTactic[];
 strategyExperiments: StrategyExperiment[];
 strategyDecisions: StrategyDecision[];
 projects: Project[];
 companies: Company[];
 onUpdateGoal: (id: string, input: Partial<StrategyGoalInput>) => Promise<StrategyGoal>;
 onAddPlan: (input: StrategyPlanInput) => Promise<StrategyPlan>;
 onUpdatePlan: (id: string, input: Partial<StrategyPlanInput>) => Promise<StrategyPlan>;
 onDeletePlan: (id: string) => Promise<void>;
 onAddTactic: (input: StrategyTacticInput) => Promise<StrategyTactic>;
 onUpdateTactic: (id: string, input: Partial<StrategyTacticInput>) => Promise<StrategyTactic>;
 onDeleteTactic: (id: string) => Promise<void>;
 onAddExperiment: (input: StrategyExperimentInput) => Promise<StrategyExperiment>;
 onUpdateExperiment: (id: string, input: Partial<StrategyExperimentInput>) => Promise<StrategyExperiment>;
 onDeleteExperiment: (id: string) => Promise<void>;
 onAddDecision: (input: StrategyDecisionInput) => Promise<StrategyDecision>;
 onUpdateDecision: (id: string, input: Partial<StrategyDecisionInput>) => Promise<StrategyDecision>;
 onDeleteDecision: (id: string) => Promise<void>;
 onEditGoal: () => void;
 onQuickAction: (type: 'plan' | 'tactic' | 'experiment' | 'decision') => void;
 onBack: () => void;
};

const parseProgress = (value: string) => {
 const numeric = Number(value);
 if (!Number.isFinite(numeric)) return 0;
 return Math.max(0, Math.min(100, numeric));
};

const GoalDetailView: React.FC<Props> = ({
 goal,
 allGoals,
 strategyPlans,
 strategyTactics,
 strategyExperiments,
 strategyDecisions,
 projects,
 companies,
 onUpdateGoal,
 onAddPlan,
 onUpdatePlan,
 onDeletePlan,
 onAddTactic,
 onUpdateTactic,
 onDeleteTactic,
 onAddExperiment,
 onUpdateExperiment,
 onDeleteExperiment,
 onAddDecision,
 onUpdateDecision,
 onDeleteDecision,
 onEditGoal,
 onQuickAction,
 onBack,
}) => {
 const [activeTab, setActiveTab] = useState<DetailTab>('overview');
 const [saving, setSaving] = useState<string | null>(null);
 const [planDraft, setPlanDraft] = useState<Record<string, { progress: number; status: StrategyStatus }>>({});
 const [localProgress, setLocalProgress] = useState<number>(goal.progress ?? 0);

 const today = new Date().toISOString().slice(0, 10);

 const filteredPlans = useMemo(() =>
 strategyPlans.filter(p => p.linkedGoalId === goal.id),
 [strategyPlans, goal.id],
 );

 const filteredTactics = useMemo(() =>
 strategyTactics.filter(t => t.linkedGoalId === goal.id),
 [strategyTactics, goal.id],
 );

 const filteredExperiments = useMemo(() =>
 strategyExperiments.filter(e => e.linkedGoalId === goal.id),
 [strategyExperiments, goal.id],
 );

 const filteredDecisions = useMemo(() =>
 strategyDecisions.filter(d => d.linkedGoalId === goal.id),
 [strategyDecisions, goal.id],
 );

 const plansByLane = useMemo(() => ({
 A: filteredPlans.filter(p => p.label === 'A'),
 B: filteredPlans.filter(p => p.label === 'B'),
 C: filteredPlans.filter(p => p.label === 'C'),
 other: filteredPlans.filter(p => p.label !== 'A' && p.label !== 'B' && p.label !== 'C'),
 }), [filteredPlans]);

 const experimentsByStatus = useMemo(() => ({
 planned: filteredExperiments.filter(e => e.status === 'planned'),
 running: filteredExperiments.filter(e => e.status === 'active'),
 completed: filteredExperiments.filter(e => e.status === 'completed'),
 failed: filteredExperiments.filter(e => e.status === 'failed'),
 }), [filteredExperiments]);

 const decisionsNeedingReview = useMemo(() =>
 filteredDecisions.filter(d => d.reviewDate && d.reviewDate.slice(0, 10) <= today),
 [filteredDecisions, today],
 );

 const linkedProject = useMemo(() =>
 projects.find(p => p.id === goal.linkedProjectId),
 [projects, goal.linkedProjectId],
 );

 const linkedCompany = useMemo(() =>
 companies.find(c => c.id === goal.linkedCompanyId),
 [companies, goal.linkedCompanyId],
 );

 const highPriorityRelated = useMemo(() => {
 const items: Array<{ type: string; title: string }> = [];
 for (const p of filteredPlans) { if (p.priority === 'high') items.push({ type: 'Plan', title: p.name }); }
 for (const t of filteredTactics) { if (t.priority === 'high') items.push({ type: 'Tactic', title: t.title }); }
 for (const e of filteredExperiments) { if (e.priority === 'high') items.push({ type: 'Experiment', title: e.title }); }
 for (const d of filteredDecisions) { if (d.priority === 'high') items.push({ type: 'Decision', title: d.title }); }
 return items.slice(0, 5);
 }, [filteredPlans, filteredTactics, filteredExperiments, filteredDecisions]);

 const handleInlineSave = async (field: string, value: unknown) => {
 setSaving(field);
 try {
 await onUpdateGoal(goal.id, { [field]: value } as Partial<StrategyGoalInput>);
 } catch { /* ignore */ }
 setSaving(null);
 };

 const saveProgress = async (val: number) => {
 setSaving('progress');
 try {
 await onUpdateGoal(goal.id, { progress: val });
 } catch { /* ignore */ }
 setSaving(null);
 };

 const savePlanInline = async (planId: string, draft: { progress: number; status: StrategyStatus }) => {
 try {
 await onUpdatePlan(planId, { progress: draft.progress, status: draft.status });
 setPlanDraft(prev => { const n = { ...prev }; delete n[planId]; return n; });
 } catch { /* ignore */ }
 };

 const LANE_LABELS: Record<string, string> = { A: 'Plan A', B: 'Plan B', C: 'Plan C', other: 'Other' };

 return (
 <div className="space-y-4">
 {/* ── Header ── */}
 <div className="rounded-xl border border-[#e5e7eb] bg-white p-5">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="min-w-0 flex-1">
 <button type="button" onClick={onBack} className="mb-2 inline-flex items-center gap-1 text-xs font-medium text-[#64748b] hover:text-[#2563eb] transition-colors">
 ← Back to Strategy
 </button>
 <h2 className="text-lg font-semibold text-[#0f172a]">{goal.title}</h2>
 {goal.description ? (
 <p className="mt-0.5 text-sm text-[#64748b]">{goal.description}</p>
 ) : null}
 </div>
 <div className="flex shrink-0 gap-2">
 {saving === 'progress' ? (
 <span className="rounded-lg bg-[#f1f5f9] px-3 py-1.5 text-xs font-medium text-[#64748b]">Saving...</span>
 ) : null}
 <button type="button" onClick={onEditGoal} className="rounded-lg border border-[#cbd5e1] bg-white px-3.5 py-1.5 text-sm font-medium text-[#334155] transition-all hover:border-[#2563eb] hover:text-[#2563eb]">
 Edit Goal
 </button>
 </div>
 </div>

 {/* Badge row */}
 <div className="mt-3 flex flex-wrap items-center gap-1.5">
 <LabelPill text={goal.category} tone="neutral" />
 <select
 value={goal.status}
 onChange={(e) => handleInlineSave('status', e.target.value)}
 className="rounded-lg border border-[#cbd5e1] bg-white px-2 py-0.5 text-xs font-medium text-[#0f172a] focus:border-[#2563eb] focus:outline-none"
 >
 {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 <select
 value={goal.priority}
 onChange={(e) => handleInlineSave('priority', e.target.value)}
 className={`rounded-lg border px-2 py-0.5 text-xs font-medium focus:outline-none ${
 goal.priority === 'high' ? 'border-[#fecaca] bg-[#fee2e2] text-[#991b1b]' :
 goal.priority === 'medium' ? 'border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]' :
 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]'
 }`}
 >
 {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 <select
 value={goal.timeHorizon || ''}
 onChange={(e) => handleInlineSave('timeHorizon', e.target.value || undefined)}
 className="rounded-lg border border-[#cbd5e1] bg-white px-2 py-0.5 text-xs font-medium text-[#0f172a] focus:border-[#2563eb] focus:outline-none"
 >
 <option value="">No horizon</option>
 {TIME_HORIZON_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 <input
 type="date"
 value={formatDate(goal.targetDate)}
 onChange={(e) => handleInlineSave('targetDate', e.target.value || undefined)}
 className="rounded-lg border border-[#cbd5e1] bg-white px-2 py-0.5 text-xs text-[#0f172a] focus:border-[#2563eb] focus:outline-none"
 />
 {goal.successMetric ? (
 <LabelPill text={`Metric: ${goal.successMetric}`} tone="success" />
 ) : null}
 </div>

 {/* Progress bar */}
 <div className="mt-4">
 <div className="flex items-center justify-between text-xs text-[#64748b] mb-1">
 <span className="font-medium">Progress</span>
 <span>{Math.round(localProgress)}%</span>
 </div>
 <input
 type="range" min={0} max={100} value={localProgress}
 onChange={(e) => setLocalProgress(parseProgress(e.target.value))}
 onMouseUp={() => saveProgress(localProgress)}
 onTouchEnd={() => saveProgress(localProgress)}
 className="w-full accent-[#2563eb] cursor-pointer"
 />
 </div>
 </div>

 {/* ── Quick Action Bar ── */}
 <div className="flex flex-wrap gap-2">
 <button type="button" onClick={() => onQuickAction('plan')} className="rounded-lg border border-[#cbd5e1] bg-white px-3.5 py-2 text-sm font-medium text-[#334155] transition-all hover:border-[#2563eb] hover:text-[#2563eb] active:scale-[0.97]">
 + Plan
 </button>
 <button type="button" onClick={() => onQuickAction('tactic')} className="rounded-lg border border-[#cbd5e1] bg-white px-3.5 py-2 text-sm font-medium text-[#334155] transition-all hover:border-[#2563eb] hover:text-[#2563eb] active:scale-[0.97]">
 + Tactic
 </button>
 <button type="button" onClick={() => onQuickAction('experiment')} className="rounded-lg border border-[#cbd5e1] bg-white px-3.5 py-2 text-sm font-medium text-[#334155] transition-all hover:border-[#2563eb] hover:text-[#2563eb] active:scale-[0.97]">
 + Experiment
 </button>
 <button type="button" onClick={() => onQuickAction('decision')} className="rounded-lg border border-[#cbd5e1] bg-white px-3.5 py-2 text-sm font-medium text-[#334155] transition-all hover:border-[#2563eb] hover:text-[#2563eb] active:scale-[0.97]">
 + Decision
 </button>
 </div>

 {/* ── Tabs ── */}
 <div className="flex flex-wrap gap-1 border-b border-[#e2e8f0] pb-2">
 {TABS.map(tab => (
 <button
 key={tab.value}
 type="button"
 onClick={() => setActiveTab(tab.value)}
 className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-all ${
 activeTab === tab.value
 ? 'bg-[#2563eb] text-white'
 : 'bg-[#f8fafc] text-[#475569] hover:bg-[#e2e8f0]'
 }`}
 >
 {tab.label}
 </button>
 ))}
 </div>

 {/* ── Body Grid ── */}
 <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
 {/* Main content */}
 <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 min-h-[300px]">
 {activeTab === 'overview' && renderOverview()}
 {activeTab === 'plans' && renderPlans()}
 {activeTab === 'tactics' && renderTactics()}
 {activeTab === 'experiments' && renderExperiments()}
 {activeTab === 'decisions' && renderDecisions()}
 {activeTab === 'review' && renderReview()}
 </div>

 {/* Right sidebar */}
 <div className="space-y-4">
 <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
 <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#475569]">Goal Summary</h4>
 <div className="mt-3 space-y-2 text-sm text-[#334155]">
 {goal.category ? <div><span className="font-medium text-[#64748b]">Category:</span> {goal.category}</div> : null}
 {goal.timeHorizon ? <div><span className="font-medium text-[#64748b]">Horizon:</span> {goal.timeHorizon}</div> : null}
 {goal.progress !== undefined ? <div><span className="font-medium text-[#64748b]">Progress:</span> {Math.round(goal.progress)}%</div> : null}
 {formatDate(goal.targetDate) ? <div><span className="font-medium text-[#64748b]">Target:</span> {formatDate(goal.targetDate)}</div> : null}
 </div>
 </div>

 {goal.successMetric ? (
 <div className="rounded-xl border border-[#bbf7d0] bg-[#f0fdf4] p-4">
 <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#166534]">Success Metric</h4>
 <p className="mt-1.5 text-sm text-[#166534]">{goal.successMetric}</p>
 </div>
 ) : null}

 {linkedProject || linkedCompany ? (
 <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
 <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#475569]">Linked</h4>
 <div className="mt-2 space-y-1 text-sm text-[#334155]">
 {linkedProject ? <div><span className="font-medium text-[#64748b]">Project:</span> {linkedProject.name}</div> : null}
 {linkedCompany ? <div><span className="font-medium text-[#64748b]">Company:</span> {linkedCompany.name}</div> : null}
 </div>
 </div>
 ) : null}

 {decisionsNeedingReview.length > 0 ? (
 <div className="rounded-xl border border-[#fca5a5] bg-[#fff5f5] p-4">
 <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#b91c1c]">Decisions Due</h4>
 <div className="mt-2 space-y-1.5">
 {decisionsNeedingReview.slice(0, 3).map(d => (
 <div key={d.id} className="text-xs text-[#7f1d1d]">
 <span className="font-medium">{d.title}</span>
 <span className="ml-1 text-[#b91c1c]">({formatDate(d.reviewDate)})</span>
 </div>
 ))}
 </div>
 </div>
 ) : null}

 {highPriorityRelated.length > 0 ? (
 <div className="rounded-xl border border-[#e5e7eb] bg-white p-4">
 <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#475569]">High Priority</h4>
 <div className="mt-2 space-y-1.5">
 {highPriorityRelated.map((item, i) => (
 <div key={i} className="text-xs text-[#334155]">
 <span className="font-medium text-[#991b1b]">{item.type}:</span> {item.title}
 </div>
 ))}
 </div>
 </div>
 ) : null}

 <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
 <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#475569]">Strategic Questions</h4>
 <div className="mt-2 space-y-1.5">
 {[
 'What is the next concrete action?',
 'Does this support your north star?',
 'What proof will this create?',
 'What should be stopped?',
 'What is the fallback?',
 ].map((q) => (
 <p key={q} className="rounded-lg border border-[#e2e8f0] bg-white px-3 py-1.5 text-xs text-[#475569]">{q}</p>
 ))}
 </div>
 </div>
 </div>
 </div>
 </div>
 );

 function renderOverview() {
 return (
 <div className="space-y-5">
 {goal.description ? (
 <div>
 <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1.5">Description</h4>
 <p className="text-sm text-[#334155]">{goal.description}</p>
 </div>
 ) : null}
 {goal.successMetric ? (
 <div>
 <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1.5">Success Metric</h4>
 <p className="text-sm text-[#166534]">{goal.successMetric}</p>
 </div>
 ) : null}
 {linkedProject || linkedCompany ? (
 <div>
 <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1.5">Linked To</h4>
 <div className="flex flex-wrap gap-2 text-sm text-[#334155]">
 {linkedProject ? <LabelPill text={`Project: ${linkedProject.name}`} /> : null}
 {linkedCompany ? <LabelPill text={`Company: ${linkedCompany.name}`} /> : null}
 </div>
 </div>
 ) : null}
 <div>
 <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1.5">Current Focus</h4>
 <p className="text-sm text-[#475569]">{filteredPlans.filter(p => p.status === 'active').length > 0
 ? `${filteredPlans.filter(p => p.status === 'active').length} active plan(s) — ${filteredTactics.filter(t => t.status === 'active').length} active tactic(s) — ${filteredExperiments.filter(e => e.status === 'active').length} running experiment(s)`
 : 'No active work items yet. Add plans or tactics to get started.'}</p>
 </div>
 <div>
 <h4 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#64748b] mb-1.5">Next Strategic Question</h4>
 <p className="text-sm italic text-[#64748b]">
 {filteredDecisions.length > 0
 ? `"${filteredDecisions[filteredDecisions.length - 1].title}" — review due: ${formatDate(filteredDecisions[filteredDecisions.length - 1].reviewDate) || 'not set'}`
 : 'What is the most important assumption to test right now?'}
 </p>
 </div>
 {filteredPlans.length === 0 && filteredTactics.length === 0 && filteredExperiments.length === 0 && filteredDecisions.length === 0 ? (
 <div className="rounded-lg border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-6 text-center">
 <p className="text-sm text-[#64748b]">This goal has no plans, tactics, experiments, or decisions yet. Use the quick actions above to start building.</p>
 </div>
 ) : null}
 </div>
 );
 }

 function renderPlans() {
 return (
 <div className="space-y-4">
 {filteredPlans.length === 0 ? (
 <div className="rounded-lg border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-8 text-center">
 <p className="text-sm text-[#64748b]">No plans linked to this goal. Add Plan A to define your primary path.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
 {(Object.entries(plansByLane) as [string, StrategyPlan[]][]).map(([key, items]) => (
 <div key={key} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
 <div className="mb-2 flex items-center gap-2">
 <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2563eb]/10 text-xs font-bold text-[#2563eb]">{key === 'other' ? '~' : key}</div>
 <h4 className="text-sm font-semibold text-[#0f172a]">{LANE_LABELS[key] || key}</h4>
 </div>
 <div className="space-y-2">
 {items.length === 0 ? (
 <div className="rounded-lg border-2 border-dashed border-[#dbe3ef] bg-white p-3 text-center text-xs text-[#94a3b8]">Empty</div>
 ) : items.map(plan => (
 <PlanCard
 key={plan.id}
 plan={plan}
 onUpdate={onUpdatePlan}
 onDelete={onDeletePlan}
 />
 ))}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 }

 function renderTactics() {
 return (
 <div className="space-y-3">
 {filteredTactics.length === 0 ? (
 <div className="rounded-lg border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-8 text-center">
 <p className="text-sm text-[#64748b]">No tactics linked to this goal. Add repeatable actions to move forward.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 {filteredTactics.map(item => (
 <div key={item.id} className="rounded-xl border border-[#e2e8f0] bg-white p-4">
 <div className="flex flex-wrap items-start justify-between gap-2">
 <div className="min-w-0 flex-1">
 <h4 className="text-sm font-semibold text-[#0f172a]">{item.title}</h4>
 {item.description ? <p className="mt-0.5 text-xs text-[#64748b]">{item.description}</p> : null}
 </div>
 <div className="flex shrink-0 gap-1.5">
 <button type="button" onClick={() => onDeleteTactic(item.id)} className="rounded-lg border border-[#fecaca] bg-white px-2 py-1 text-xs font-medium text-[#991b1b] transition-all hover:bg-[#fef2f2]">Delete</button>
 </div>
 </div>
 <div className="mt-2.5 flex flex-wrap gap-1.5">
 <LabelPill text={`Freq: ${item.frequency || '—'}`} />
 <LabelPill text={`Metric: ${item.metric || '—'}`} />
 <LabelPill text={`Next: ${item.nextAction || '—'}`} />
 <select
 value={item.status}
 onChange={(e) => onUpdateTactic(item.id, { status: e.target.value as StrategyStatus })}
 className="rounded-lg border border-[#cbd5e1] bg-white px-2 py-0.5 text-xs text-[#0f172a]"
 >
 {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 }

 function renderExperiments() {
 const cols: Array<{ key: keyof typeof experimentsByStatus; title: string; items: StrategyExperiment[] }> = [
 { key: 'planned', title: 'Planned', items: experimentsByStatus.planned },
 { key: 'running', title: 'Running', items: experimentsByStatus.running },
 { key: 'completed', title: 'Completed', items: experimentsByStatus.completed },
 { key: 'failed', title: 'Failed', items: experimentsByStatus.failed },
 ];

 return (
 <div className="space-y-3">
 {filteredExperiments.length === 0 ? (
 <div className="rounded-lg border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-8 text-center">
 <p className="text-sm text-[#64748b]">No experiments linked to this goal. Test assumptions systematically.</p>
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
 {cols.map(col => (
 <div key={col.key} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
 <div className="mb-2 flex items-center justify-between">
 <h4 className="text-sm font-semibold text-[#0f172a]">{col.title}</h4>
 <span className="rounded-full bg-[#e2e8f0] px-2 py-0.5 text-[11px] font-medium text-[#475569]">{col.items.length}</span>
 </div>
 <div className="space-y-2">
 {col.items.length === 0 ? (
 <div className="rounded-lg border-2 border-dashed border-[#dbe3ef] bg-white p-3 text-center text-xs text-[#94a3b8]">Empty</div>
 ) : col.items.map(item => (
 <div key={item.id} className={`rounded-xl border p-3 ${item.status === 'active' ? 'border-[#2563eb] bg-[#eff6ff]' : 'border-[#dbe3ef] bg-white'}`}>
 <div className="flex items-start justify-between gap-2">
 <h5 className="text-sm font-semibold text-[#0f172a]">{item.title}</h5>
 </div>
 <div className="mt-1.5 space-y-0.5 text-xs text-[#475569]">
 {item.hypothesis ? <div><span className="font-medium text-[#64748b]">H:</span> {item.hypothesis}</div> : null}
 {item.method ? <div><span className="font-medium text-[#64748b]">Method:</span> {item.method}</div> : null}
 {item.metric ? <div><span className="font-medium text-[#64748b]">Metric:</span> {item.metric}</div> : null}
 {item.result ? <div><span className="font-medium text-[#64748b]">Result:</span> {item.result}</div> : null}
 {item.learning ? <div><span className="font-medium text-[#64748b]">Learning:</span> {item.learning}</div> : null}
 </div>
 <div className="mt-2 flex gap-1.5">
 <select
 value={item.status}
 onChange={(e) => onUpdateExperiment(item.id, { status: e.target.value as StrategyStatus })}
 className="rounded-lg border border-[#cbd5e1] bg-white px-2 py-0.5 text-xs text-[#0f172a]"
 >
 {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 <button type="button" onClick={() => onDeleteExperiment(item.id)} className="rounded-lg border border-[#fecaca] bg-white px-2 py-0.5 text-xs font-medium text-[#991b1b] transition-all hover:bg-[#fef2f2]">Delete</button>
 </div>
 </div>
 ))}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 }

 function renderDecisions() {
 return (
 <div className="space-y-3">
 {filteredDecisions.length === 0 ? (
 <div className="rounded-lg border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-8 text-center">
 <p className="text-sm text-[#64748b]">No decisions logged for this goal. Record key choices to track strategic clarity.</p>
 </div>
 ) : (
 <div className="space-y-3">
 {filteredDecisions.map(item => {
 const needsReview = Boolean(item.reviewDate && item.reviewDate.slice(0, 10) <= today);
 return (
 <div key={item.id} className={`rounded-xl border p-4 ${needsReview ? 'border-[#fca5a5] bg-[#fff5f5]' : 'border-[#e2e8f0] bg-white'}`}>
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <h4 className="text-sm font-semibold text-[#0f172a]">{item.title}</h4>
 {needsReview ? <LabelPill text="Review Due" tone="danger" /> : null}
 </div>
 {item.context ? <p className="mt-0.5 text-xs text-[#64748b]">{item.context}</p> : null}
 </div>
 <div className="flex shrink-0 gap-1.5">
 <select
 value={item.status}
 onChange={(e) => onUpdateDecision(item.id, { status: e.target.value as StrategyStatus })}
 className="rounded-lg border border-[#cbd5e1] bg-white px-2 py-1 text-xs text-[#0f172a]"
 >
 {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 <button type="button" onClick={() => onDeleteDecision(item.id)} className="rounded-lg border border-[#fecaca] bg-white px-2 py-1 text-xs font-medium text-[#991b1b] transition-all hover:bg-[#fef2f2]">Delete</button>
 </div>
 </div>
 <div className="mt-2 grid grid-cols-1 gap-x-6 gap-y-1 text-xs text-[#334155] md:grid-cols-2">
 <div><span className="font-medium text-[#64748b]">Decision:</span> {item.decision || '—'}</div>
 <div><span className="font-medium text-[#64748b]">Reason:</span> {item.reason || '—'}</div>
 <div><span className="font-medium text-[#64748b]">Expected:</span> {item.expectedResult || '—'}</div>
 <div><span className="font-medium text-[#64748b]">Review:</span> {formatDate(item.reviewDate) || '—'}</div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
 }

 function renderReview() {
 return (
 <div className="space-y-5">
 <div className="rounded-xl border border-[#e5e7eb] bg-gradient-to-br from-[#f8fafc] to-white p-4">
 <h4 className="text-sm font-semibold text-[#0f172a]">Strategic Review</h4>
 <p className="mt-1 text-xs text-[#64748b]">Use these prompts to reflect on progress and adjust direction.</p>
 </div>

 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <ReviewSection title="What is working?" icon="✓" tone="success">
 {filteredPlans.filter(p => p.status === 'active' || p.status === 'completed').length > 0
 ? filteredPlans.filter(p => p.status === 'active' || p.status === 'completed').slice(0, 3).map(p => (
 <p key={p.id} className="text-sm text-[#166534]">{p.name} — {Math.round(p.progress ?? 0)}%</p>
 ))
 : <p className="text-sm text-[#64748b]">Identify what is producing results.</p>}
 </ReviewSection>

 <ReviewSection title="What is not working?" icon="✕" tone="danger">
 {filteredPlans.filter(p => p.status === 'paused' || p.status === 'failed').length > 0
 ? filteredPlans.filter(p => p.status === 'paused' || p.status === 'failed').slice(0, 3).map(p => (
 <p key={p.id} className="text-sm text-[#991b1b]">{p.name} — {p.status}</p>
 ))
 : <p className="text-sm text-[#64748b]">Consider what is draining time or energy.</p>}
 </ReviewSection>

 <ReviewSection title="What should be stopped?" icon="⊘" tone="warning">
 {filteredTactics.filter(t => t.status === 'active' && !t.metric).length > 0
 ? filteredTactics.filter(t => t.status === 'active' && !t.metric).slice(0, 3).map(t => (
 <p key={t.id} className="text-sm text-[#92400e]">{t.title} — no metric tracked</p>
 ))
 : <p className="text-sm text-[#64748b]">Look for low-impact activities to cut.</p>}
 </ReviewSection>

 <ReviewSection title="Next concrete action" icon="→" tone="neutral">
 {filteredPlans.filter(p => p.nextAction).length > 0
 ? filteredPlans.filter(p => p.nextAction).slice(0, 3).map(p => (
 <p key={p.id} className="text-sm text-[#334155]">{p.name}: {p.nextAction}</p>
 ))
 : <p className="text-sm text-[#64748b]">Define the single most important next step.</p>}
 </ReviewSection>
 </div>

 <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
 <h5 className="text-xs font-mono font-semibold uppercase tracking-[0.08em] text-[#475569]">Review Prompts</h5>
 <div className="mt-2 space-y-1.5 text-xs text-[#475569]">
 {[
 'Have you made progress on the top priority this week?',
 'Are you still confident in Plan A assumptions?',
 'What experiment result would change your approach?',
 'Is this goal still aligned with your north star?',
 'What would make this goal twice as likely to succeed?',
 ].map((q, i) => (
 <p key={i} className="flex items-start gap-2">
 <span className="mt-0.5 text-[#2563eb]">?</span>
 <span>{q}</span>
 </p>
 ))}
 </div>
 </div>
 </div>
 );
 }
};

const ReviewSection: React.FC<{ title: string; icon: string; tone: string; children: React.ReactNode }> = ({ title, icon, tone, children }) => {
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
 <div className="mt-2 space-y-1">{children}</div>
 </div>
 );
};

const PlanCard: React.FC<{ plan: StrategyPlan; onUpdate: Props['onUpdatePlan']; onDelete: Props['onDeletePlan'] }> = ({ plan, onUpdate, onDelete }) => {
 const getRiskFlag = (p: StrategyPlan) => {
 const status = String(p.status || '').toLowerCase();
 if (status === 'paused' || status === 'blocked') return true;
 if (!p.targetDate) return false;
 const target = new Date(p.targetDate).getTime();
 if (!Number.isFinite(target)) return false;
 const daysLeft = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
 const progress = Number(p.progress ?? 0);
 return daysLeft <= 14 && progress < 45;
 };

 const isRisk = getRiskFlag(plan);
 const [localProgress, setLocalProgress] = useState(plan.progress ?? 0);

 return (
 <div className={`rounded-xl border p-3 transition-all ${isRisk ? 'border-[#fca5a5] bg-[#fff5f5]' : 'border-[#dbe3ef] bg-white'}`}>
 <div className="flex items-start justify-between gap-2">
 <h5 className="text-sm font-semibold text-[#0f172a]">{plan.name}</h5>
 {isRisk ? <LabelPill text="At Risk" tone="danger" /> : null}
 </div>
 {plan.description ? <p className="mt-0.5 text-xs text-[#64748b]">{plan.description}</p> : null}
 <div className="mt-2 space-y-0.5 text-xs text-[#475569]">
 <div><span className="font-medium text-[#64748b]">Assumptions:</span> {plan.assumptions || '—'}</div>
 <div><span className="font-medium text-[#64748b]">Risks:</span> {plan.risks || '—'}</div>
 <div><span className="font-medium text-[#64748b]">Trigger:</span> {plan.triggerToSwitch || '—'}</div>
 <div><span className="font-medium text-[#64748b]">Next:</span> {plan.nextAction || '—'}</div>
 </div>
 <div className="mt-2">
 <select
 value={plan.status}
 onChange={(e) => onUpdate(plan.id, { status: e.target.value as StrategyStatus })}
 className="w-full rounded-lg border border-[#cbd5e1] bg-white px-2 py-1 text-xs text-[#0f172a]"
 >
 {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 </div>
 <div className="mt-2">
 <div className="mb-1 flex items-center justify-between text-[10px] text-[#64748b]">
 <span>Progress</span>
 <span>{Math.round(localProgress)}%</span>
 </div>
 <input
 type="range" min={0} max={100} value={localProgress}
 onChange={(e) => setLocalProgress(parseProgress(e.target.value))}
 onMouseUp={() => onUpdate(plan.id, { progress: localProgress })}
 onTouchEnd={() => onUpdate(plan.id, { progress: localProgress })}
 className="w-full accent-[#2563eb]"
 />
 </div>
 <div className="mt-2 flex gap-1.5">
 <button type="button" onClick={() => onDelete(plan.id)} className="rounded-lg border border-[#fecaca] bg-white px-2 py-1 text-xs font-medium text-[#991b1b] transition-all hover:bg-[#fef2f2]">Delete</button>
 </div>
 </div>
 );
};

export default GoalDetailView;
