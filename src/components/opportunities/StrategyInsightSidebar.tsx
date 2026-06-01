import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React from 'react';
import type { StrategyDecision, StrategyGoal, StrategyPlan } from '../../types/opportunities';

const formatDate = (value?: string) => {
 if (!value) return 'none';
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

type Props = {
 goals: StrategyGoal[];
 plans: StrategyPlan[];
 decisions: StrategyDecision[];
};

const InsightSidebar: React.FC<Props> = ({ goals, plans, decisions }) => {
  const { t, language } = usePersonalLanguage();

 const topPriorityGoals = goals
 .filter((g) => g.priority === 'high')
 .slice()
 .sort((a, b) => Number(b.progress ?? 0) - Number(a.progress ?? 0))
 .slice(0, 3);

 const nearestReviews = decisions
 .filter((d) => Boolean(d.reviewDate))
 .slice()
 .sort((a, b) => (a.reviewDate || '').localeCompare(b.reviewDate || ''))
 .slice(0, 5);

 const plansAtRisk = plans.filter(getRiskFlag).slice(0, 5);

 return (
 <div className="space-y-4">
 <div>
 <h3 className="text-xs font-mono uppercase tracking-[0.12em] text-[#64748b]">Strategic Questions</h3>
 <div className="mt-2 space-y-1.5">
 {[
 'What is the next concrete action?',
 'Does this support money, independence, or positioning?',
 'What proof will this create?',
 'What should be stopped?',
 'What is the fallback if Plan A fails?',
 'Is this aligned with ethical filters?',
 ].map((q) => (
 <p key={q} className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-xs text-[#475569]">{q}</p>
 ))}
 </div>
 </div>

 <div className="rounded-xl border border-[#e2e8f0] bg-white p-3">
 <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#475569]">Top 3 High Priority Goals</h4>
 <div className="mt-2 space-y-1.5">
 {topPriorityGoals.length === 0
 ? <div className="text-xs text-[#94a3b8]">No high-priority goals.</div>
 : topPriorityGoals.map((g) => (
 <div key={g.id} className="rounded-lg border border-[#dbe3ef] bg-[#f8fafc] px-3 py-2 text-xs text-[#0f172a]">
 <div className="font-medium">{g.title}</div>
 <div className="mt-0.5 text-[#64748b]">{Math.round(Number(g.progress ?? 0))}% complete</div>
 </div>
 ))}
 </div>
 </div>

 <div className="rounded-xl border border-[#e2e8f0] bg-white p-3">
 <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#475569]">Nearest Review Dates</h4>
 <div className="mt-2 space-y-1.5">
 {nearestReviews.length === 0
 ? <div className="text-xs text-[#94a3b8]">No review dates set.</div>
 : nearestReviews.map((d) => (
 <div key={d.id} className="rounded-lg border border-[#dbe3ef] bg-[#f8fafc] px-3 py-2 text-xs text-[#0f172a]">
 <div className="font-medium">{d.title}</div>
 <div className="mt-0.5 text-[#64748b]">{formatDate(d.reviewDate)}</div>
 </div>
 ))}
 </div>
 </div>

 <div className="rounded-xl border border-[#e2e8f0] bg-white p-3">
 <h4 className="text-[11px] font-mono font-semibold uppercase tracking-[0.08em] text-[#475569]">Plans At Risk</h4>
 <div className="mt-2 space-y-1.5">
 {plansAtRisk.length === 0
 ? <div className="text-xs text-[#94a3b8]">No plans at risk.</div>
 : plansAtRisk.map((p) => (
 <div key={p.id} className="rounded-lg border border-[#fecaca] bg-[#fff5f5] px-3 py-2 text-xs text-[#7f1d1d]">
 <div className="font-medium">{p.name}</div>
 <div className="mt-0.5">{Math.round(Number(p.progress ?? 0))}% • {formatDate(p.targetDate)}</div>
 </div>
 ))}
 </div>
 </div>
 </div>
 );
};

export default InsightSidebar;
