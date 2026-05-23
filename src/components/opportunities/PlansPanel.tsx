import React, { useState, useMemo } from 'react';
import PlanDetailWorkspace from './PlanDetailWorkspace';
import PlanForm from './PlanForm';
import type { Plan, PlanInput, PlanItem, PlanItemInput, StrategyGoal, Project, PlanType } from '../../types/opportunities';

type Props = {
  plans: Plan[];
  planItems: PlanItem[];
  projects: Project[];
  strategyGoals: StrategyGoal[];
  onAddPlan: (input: PlanInput) => Promise<Plan>;
  onUpdatePlan: (id: string, input: Partial<PlanInput>) => Promise<Plan>;
  onDeletePlan: (id: string) => Promise<void>;
  onAddPlanItem: (input: PlanItemInput) => Promise<PlanItem>;
  onUpdatePlanItem: (id: string, input: Partial<PlanItemInput>) => Promise<PlanItem>;
  onDeletePlanItem: (id: string) => Promise<void>;
};

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

const PlansPanel: React.FC<Props> = ({
  plans, planItems, projects, strategyGoals, onAddPlan, onUpdatePlan, onDeletePlan, onAddPlanItem, onUpdatePlanItem, onDeletePlanItem,
}) => {
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
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

  return (
    <div className="space-y-4">
      {plans.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#2563eb]/30 bg-gradient-to-br from-[#eff6ff] to-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-semibold text-[#0f172a]">Create Starter Planning System</h3>
              <p className="mt-1 text-sm text-[#475569]">Bootstrap year, 6-month, monthly, and weekly plans with built-in focus and success criteria.</p>
            </div>
            <button type="button" onClick={handleCreateStarter} className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] active:scale-[0.97]">
              Create Starter Plans
            </button>
          </div>
        </div>
      ) : null}

      {/* Dashboard cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
        <DashboardCard title="Active Plans" value={activePlans.length} />
        <DashboardCard title="This Week" value={thisWeekItems.length} />
        <DashboardCard title="Overdue" value={overdueItems.length} accent="text-[#991b1b]" />
        <DashboardCard title="Completed" value={doneItems.length} accent="text-[#166534]" />
        <DashboardCard title="High Priority" value={highPriorityItems.length} accent="text-[#92400e]" />
      </div>

      <div className="flex flex-wrap gap-1.5 border-b border-[#e2e8f0] pb-2">
        {PLAN_TYPES.map(pt => (
          <button
            key={pt.value}
            type="button"
            onClick={() => setActiveType(pt.value)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
              activeType === pt.value
                ? 'bg-[#2563eb] text-white shadow-sm'
                : 'bg-[#f8fafc] text-[#475569] hover:bg-[#e2e8f0]'
            }`}
          >
            {pt.label}
          </button>
        ))}
        <button type="button" onClick={() => openNewPlanForm(activeType)} className="ml-auto rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm font-medium text-[#334155] transition-all hover:border-[#2563eb] hover:text-[#2563eb]">
          + New {PLAN_TYPES.find(t => t.value === activeType)?.label} Plan
        </button>
      </div>

      {/* Plan list */}
      {filteredPlans.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-8 text-center">
          <p className="text-sm text-[#64748b]">No {activeType} plans yet. Create one to start planning.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlans.map(plan => {
            const items = planItems.filter(i => i.planId === plan.id);
            const done = items.filter(i => i.status === 'done').length;
            const total = items.length;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className="rounded-xl border border-[#e5e7eb] bg-white p-4 transition-all hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] cursor-pointer"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold text-[#0f172a]">{plan.title}</h4>
                    {plan.focus ? <p className="mt-0.5 text-sm text-[#64748b]">{plan.focus}</p> : null}
                  </div>
                  <div className="flex shrink-0 flex-wrap gap-1.5">
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      plan.status === 'active' ? 'border-[#86efac] bg-[#f0fdf4] text-[#166534]' :
                      plan.status === 'completed' ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]' :
                      plan.status === 'archived' ? 'border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]' :
                      'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]'
                    }`}>{plan.status}</span>
                    <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                      plan.priority === 'high' ? 'border-[#fecaca] bg-[#fee2e2] text-[#991b1b]' :
                      plan.priority === 'medium' ? 'border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]' :
                      'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]'
                    }`}>{plan.priority}</span>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-[#64748b]">
                  {plan.startDate ? <span>{formatDate(plan.startDate)} — {formatDate(plan.endDate)}</span> : null}
                  {total > 0 ? <span>{done}/{total} done ({progress}%)</span> : null}
                  {plan.linkedStrategyGoalTitle ? <span>Goal: {plan.linkedStrategyGoalTitle}</span> : null}
                  {plan.linkedProjectName ? <span>Project: {plan.linkedProjectName}</span> : null}
                </div>
                {total > 0 ? (
                  <div className="mt-2 h-1.5 w-full rounded-full bg-[#e2e8f0]">
                    <div className="h-1.5 rounded-full bg-[#2563eb] transition-all" style={{ width: `${progress}%` }} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      {/* Quick add form */}
      {showForm ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-5">
          <h4 className="text-sm font-semibold text-[#0f172a] mb-3">New {PLAN_TYPES.find(t => t.value === planForm.type)?.label} Plan</h4>
          <PlanForm form={planForm} onChange={setPlanForm} projects={projects} strategyGoals={strategyGoals} />
          <div className="mt-4 flex items-center gap-2">
            <button type="button" onClick={handleSaveNewPlan} disabled={!planForm.title?.trim()} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] disabled:opacity-50">
              Save Plan
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#475569] transition-all hover:border-[#64748b]">
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
};

const DashboardCard: React.FC<{ title: string; value: string | number; accent?: string }> = ({ title, value, accent = 'text-[#0f172a]' }) => (
  <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
    <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748b]">{title}</div>
    <div className={`mt-1.5 text-2xl font-semibold ${accent}`}>{value}</div>
  </div>
);

export default PlansPanel;
