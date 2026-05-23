import React from 'react';
import LabelPill from './StrategyLabelPill';
import type { StrategyGoal, StrategyGoalInput, StrategyPriority, StrategySection, StrategyStatus, StrategyTimeHorizon } from '../../types/opportunities';

const CATEGORY_OPTIONS: StrategySection[] = ['career', 'freelance', 'portfolio', 'money', 'investment', 'learning', 'health', 'ethical_filter', 'positioning', 'operations'];
const PRIORITY_OPTIONS: StrategyPriority[] = ['high', 'medium', 'low'];
const STATUS_OPTIONS: StrategyStatus[] = ['active', 'planned', 'paused', 'completed', 'archived', 'failed'];
const TIME_HORIZON_OPTIONS: StrategyTimeHorizon[] = ['yearly', 'six_months', 'quarterly', 'monthly', 'weekly', 'daily'];

const formatDate = (value?: string) => {
  if (!value) return 'none';
  return value.slice(0, 10);
};

const parseProgress = (value: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

type Props = {
  goals: StrategyGoal[];
  goalForm: StrategyGoalInput;
  setGoalForm: React.Dispatch<React.SetStateAction<StrategyGoalInput>>;
  onAdd: (input: StrategyGoalInput) => Promise<StrategyGoal>;
  onUpdate: (id: string, input: Partial<StrategyGoalInput>) => Promise<StrategyGoal>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (goal: StrategyGoal) => void;
  onSelect: (goal: StrategyGoal) => void;
  onOpenNew: () => void;
  filterCategory: string;
  setFilterCategory: (v: string) => void;
  filterStatus: string;
  setFilterStatus: (v: string) => void;
  filterPriority: string;
  setFilterPriority: (v: string) => void;
  progressDraft: Record<string, number>;
  setProgressDraft: React.Dispatch<React.SetStateAction<Record<string, number>>>;
};

const GoalsPanel: React.FC<Props> = ({
  goals, goalForm, setGoalForm, onAdd, onUpdate, onDelete, onEdit, onSelect, onOpenNew,
  filterCategory, setFilterCategory, filterStatus, setFilterStatus, filterPriority, setFilterPriority,
  progressDraft, setProgressDraft,
}) => {
  const filtered = goals.filter((g) => {
    if (filterCategory && g.category !== filterCategory) return false;
    if (filterStatus && g.status !== filterStatus) return false;
    if (filterPriority && g.priority !== filterPriority) return false;
    return true;
  });

  const updateProgressInline = async (goal: StrategyGoal) => {
    const nextValue = progressDraft[goal.id] ?? Number(goal.progress ?? 0);
    try { await onUpdate(goal.id, { progress: nextValue }); } catch { /* ignore */ }
  };

  const handleSave = async () => {
    if (!goalForm.title?.trim()) return;
    await onAdd(goalForm);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        <button type="button" onClick={onOpenNew} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] active:scale-[0.97]">
          Add Goal
        </button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-8 text-center">
          <div className="text-3xl">🎯</div>
          <p className="mt-2 text-sm text-[#64748b]">No strategic goals yet. Start with one outcome that matters.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((goal) => {
            const progress = progressDraft[goal.id] ?? Number(goal.progress ?? 0);
            return (
              <div key={goal.id} className="rounded-xl border border-[#e2e8f0] bg-white p-4 transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-base font-semibold text-[#0f172a]">{goal.title}</h4>
                    {goal.description ? <p className="mt-0.5 text-sm text-[#64748b]">{goal.description}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => onSelect(goal)} className="rounded-lg bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-[#1d4ed8]">Open</button>
                    <button type="button" onClick={() => onEdit(goal)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs font-medium text-[#475569] transition-all hover:border-[#2563eb] hover:text-[#2563eb]">Edit</button>
                    <button type="button" onClick={() => onDelete(goal.id)} className="rounded-lg border border-[#fecaca] bg-white px-3 py-1.5 text-xs font-medium text-[#991b1b] transition-all hover:bg-[#fef2f2]">Delete</button>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <LabelPill text={goal.category} tone="neutral" />
                  <LabelPill text={goal.priority} tone={goal.priority === 'high' ? 'high' : goal.priority === 'medium' ? 'medium' : 'low'} />
                  <LabelPill text={goal.status} tone={goal.status === 'completed' ? 'success' : goal.status === 'failed' ? 'danger' : 'neutral'} />
                  <LabelPill text={`Target: ${formatDate(goal.targetDate)}`} />
                  {goal.successMetric ? <LabelPill text={`Metric: ${goal.successMetric}`} /> : null}
                  {goal.linkedProjectName ? <LabelPill text={`Project: ${goal.linkedProjectName}`} /> : null}
                  {goal.linkedCompanyName ? <LabelPill text={`Company: ${goal.linkedCompanyName}`} /> : null}
                  {goal.timeHorizon ? <LabelPill text={goal.timeHorizon} /> : null}
                </div>
                <div className="mt-3 rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-3">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-[#64748b]">
                    <span className="font-medium">Progress</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <input
                    type="range" min={0} max={100} value={progress}
                    onChange={(e) => setProgressDraft((prev) => ({ ...prev, [goal.id]: parseProgress(e.target.value) }))}
                    className="w-full accent-[#2563eb]"
                  />
                  <div className="mt-2 flex justify-end">
                    <button type="button" onClick={() => updateProgressInline(goal)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-1 text-xs font-medium text-[#475569] transition-all hover:border-[#2563eb] hover:text-[#2563eb]">
                      Save Progress
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default GoalsPanel;
