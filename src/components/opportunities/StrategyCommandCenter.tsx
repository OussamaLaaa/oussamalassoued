import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React from 'react';
import type { StrategyGoal, StrategyPlan, StrategyDecision } from '../../types/opportunities';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import StatCard from '../ui/StatCard';

const questions = [
 'What is the next concrete action?',
 'Does this support money, independence, or positioning?',
 'What proof will this create?',
 'What should be stopped?',
 'What is the fallback if Plan A fails?',
 'Is this aligned with ethical filters?',
];

const formatDate = (value?: string) => {
  const { t, language } = usePersonalLanguage();

 if (!value) return '';
 return value.slice(0, 10);
};

const getRiskFlag = (plan: StrategyPlan) => {
 const status = String(plan.status || '').toLowerCase();
 if (status === 'paused' || status === 'blocked') return true;
 if (!plan.targetDate) return false;
 const target = new Date(plan.targetDate).getTime();
 if (!Number.isFinite(target)) return false;
 const daysLeft = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
 const progress = Number(plan.progress ?? 0);
 return daysLeft <= 14 && progress < 45;
};

const CommandCenter: React.FC<{
 activeGoalsCount: number;
 activePlansCount: number;
 runningExperimentsCount: number;
 decisionsToReviewCount: number;
 highPriorityItemsCount: number;
 averageProgress: number;
 completedExperimentsCount: number;
 failedExperimentsCount: number;
 strategyGoals: StrategyGoal[];
 strategyPlans: StrategyPlan[];
 strategyDecisions: StrategyDecision[];
 quickActions: { label: string; onClick: () => void }[];
 onViewAllGoals?: () => void;
}> = ({
 activeGoalsCount, activePlansCount, runningExperimentsCount,
 decisionsToReviewCount, highPriorityItemsCount, averageProgress,
 completedExperimentsCount, failedExperimentsCount,
 strategyGoals, strategyPlans, strategyDecisions, quickActions, onViewAllGoals,
}) => {
 const topPriorityGoals = strategyGoals
 .filter((g) => g.priority === 'high')
 .slice()
 .sort((a, b) => Number(b.progress ?? 0) - Number(a.progress ?? 0))
 .slice(0, 3);

 const nearestReviews = strategyDecisions
 .filter((d) => Boolean(d.reviewDate))
 .slice()
 .sort((a, b) => (a.reviewDate || '').localeCompare(b.reviewDate || ''))
 .slice(0, 5);

 const plansAtRisk = strategyPlans.filter(getRiskFlag).slice(0, 5);

 const tacticsCount = strategyGoals.reduce((sum, g) => sum + (g as any)._count?.tactics || 0, 0);

 return (
 <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
 <div className="lg:col-span-2 space-y-6">
 <section className="grid grid-cols-2 gap-3 md:grid-cols-3">
 <StatCard label="Active Goals" value={activeGoalsCount} hint="Current total" />
 <StatCard label="Active Plans" value={activePlansCount} hint="Current total" />
 <StatCard label="Running Experiments" value={runningExperimentsCount} hint="Current total" />
 <StatCard label="Decisions to Review" value={decisionsToReviewCount} hint="Due now" />
 <StatCard label="High Priority Items" value={highPriorityItemsCount} hint="Across all tabs" />
 <StatCard label="Average Progress" value={`${averageProgress}%`} hint="Goals + Plans" />
 </section>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Goal Coverage</h3>
 <p className="mt-0.5 text-xs text-neutral-500">What's active across the strategy stack.</p>
 </div>
 </div>
 <div className="grid grid-cols-3 divide-x divide-neutral-100">
 <div className="px-5 py-5">
 <div className="text-xs text-neutral-500">Goals active</div>
 <div className="mt-1 text-neutral-900" style={{ fontSize: 24, lineHeight: '28px', fontWeight: 700 }}>{activeGoalsCount}</div>
 </div>
 <div className="px-5 py-5">
 <div className="text-xs text-neutral-500">Plans active</div>
 <div className="mt-1 text-neutral-900" style={{ fontSize: 24, lineHeight: '28px', fontWeight: 700 }}>{activePlansCount}</div>
 </div>
 <div className="px-5 py-5">
 <div className="text-xs text-neutral-500">Tactics active</div>
 <div className="mt-1 text-neutral-900" style={{ fontSize: 24, lineHeight: '28px', fontWeight: 700 }}>{tacticsCount > 0 ? tacticsCount : '—'}</div>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Experiment Engine</h3>
 <p className="mt-0.5 text-xs text-neutral-500">Learning velocity.</p>
 </div>
 </div>
 <ul className="divide-y divide-neutral-100">
 <li className="flex items-center justify-between px-5 py-3">
 <span className="text-sm text-neutral-700">Running</span>
 <div className="flex items-center gap-2">
 <span className="text-sm tabular-nums text-neutral-900">{runningExperimentsCount}</span>
 <Badge variant="blue">Running</Badge>
 </div>
 </li>
 <li className="flex items-center justify-between px-5 py-3">
 <span className="text-sm text-neutral-700">Completed</span>
 <div className="flex items-center gap-2">
 <span className="text-sm tabular-nums text-neutral-900">{completedExperimentsCount}</span>
 <Badge variant="success">Completed</Badge>
 </div>
 </li>
 <li className="flex items-center justify-between px-5 py-3">
 <span className="text-sm text-neutral-700">Failed</span>
 <div className="flex items-center gap-2">
 <span className="text-sm tabular-nums text-neutral-900">{failedExperimentsCount}</span>
 <Badge variant="danger">Failed</Badge>
 </div>
 </li>
 </ul>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Decision Quality</h3>
 <p className="mt-0.5 text-xs text-neutral-500">How well you're closing loops.</p>
 </div>
 </div>
 <ul className="divide-y divide-neutral-100">
 <li className="flex items-center justify-between px-5 py-3">
 <span className="text-sm text-neutral-700">Due reviews</span>
 <span className="text-sm tabular-nums text-neutral-900">{decisionsToReviewCount}</span>
 </li>
 <li className="flex items-center justify-between px-5 py-3">
 <span className="text-sm text-neutral-700">Average progress</span>
 <span className="text-sm tabular-nums text-neutral-900">{averageProgress}%</span>
 </li>
 </ul>
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Quick Actions</h3>
 <p className="mt-0.5 text-xs text-neutral-500">Add to your strategy stack.</p>
 </div>
 </div>
 <div className="flex flex-wrap gap-2 px-5 py-4">
 {quickActions.map((action) => {
 const isPrimary = action.label === '+ Goal';
 return (
 <Button key={action.label} variant={isPrimary ? 'primary' : 'secondary'} size="sm" onClick={action.onClick}>
 {action.label}
 </Button>
 );
 })}
 </div>
 </div>
 </div>

 <aside className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Strategic Questions</h3>
 <p className="mt-0.5 text-xs text-neutral-500">Use these to pressure-test work.</p>
 </div>
 </div>
 <ul className="divide-y divide-neutral-100">
 {questions.map((q) => (
 <li key={q} className="px-5 py-3 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">{q}</li>
 ))}
 </ul>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Top High Priority Goals</h3>
 </div>
 {onViewAllGoals ? (
 <button type="button" onClick={onViewAllGoals} className="inline-flex items-center gap-1 text-xs text-neutral-500 hover:text-neutral-900">
 View all
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
 </button>
 ) : null}
 </div>
 {topPriorityGoals.length === 0 ? (
 <div className="px-5 py-4 text-sm text-neutral-500">No high priority goals yet.</div>
 ) : (
 <ul className="divide-y divide-neutral-100">
 {topPriorityGoals.map((g) => {
 const progress = Math.round(Number(g.progress ?? 0));
 return (
 <li key={g.id} className="px-5 py-3">
 <div className="flex items-center justify-between gap-2">
 <span className="text-sm text-neutral-900 truncate">{g.title}</span>
 <span className="text-xs tabular-nums text-neutral-500">{progress}%</span>
 </div>
 <div className="mt-2 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
 <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${progress}%` }} />
 </div>
 </li>
 );
 })}
 </ul>
 )}
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Nearest Review Dates</h3>
 </div>
 </div>
 {nearestReviews.length === 0 ? (
 <div className="px-5 py-4 text-sm text-neutral-500">No review dates scheduled.</div>
 ) : (
 <ul className="divide-y divide-neutral-100">
 {nearestReviews.map((d) => (
 <li key={d.id} className="flex items-center justify-between px-5 py-3">
 <div className="flex items-center gap-2 min-w-0">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-neutral-400"><rect width="18" height="18" x="3" y="4" rx="2" ry="2" /><line x1="16" x2="16" y1="2" y2="6" /><line x1="8" x2="8" y1="2" y2="6" /><line x1="3" x2="21" y1="10" y2="10" /></svg>
 <span className="text-sm text-neutral-700 truncate">{d.title}</span>
 </div>
 <span className="text-xs text-neutral-500 shrink-0">{formatDate(d.reviewDate)}</span>
 </li>
 ))}
 </ul>
 )}
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-end justify-between gap-3 border-b border-neutral-200 px-5 py-4">
 <div className="min-w-0">
 <h3 className="text-sm font-semibold text-neutral-900">Plans at Risk</h3>
 </div>
 </div>
 {plansAtRisk.length === 0 ? (
 <div className="px-5 py-4 text-sm text-neutral-500">No plans at risk.</div>
 ) : (
 <ul className="divide-y divide-neutral-100">
 {plansAtRisk.map((p) => (
 <li key={p.id} className="px-5 py-3">
 <div className="flex items-center gap-2">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-amber-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" /><path d="M12 9v4" /><path d="M12 17h.01" /></svg>
 <span className="text-sm text-neutral-900 truncate">{p.name}</span>
 </div>
 <p className="mt-1 text-xs text-neutral-500">{Math.round(Number(p.progress ?? 0))}% · {formatDate(p.targetDate)}</p>
 </li>
 ))}
 </ul>
 )}
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="flex items-start gap-3">
 <div className="flex h-9 w-9 items-center justify-center rounded-md border border-neutral-200">
 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-neutral-700"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" /></svg>
 </div>
 <div className="min-w-0">
 <div className="text-sm font-semibold text-neutral-900">Ethical Filter Reminder</div>
 <p className="mt-1 text-xs text-neutral-500">Before adopting a tactic, confirm it passes your non-negotiables and client criteria.</p>
 </div>
 </div>
 </div>
 </aside>
 </div>
 );
};

export default CommandCenter;
