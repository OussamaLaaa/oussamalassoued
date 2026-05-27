import React from 'react';
import type { StrategyGoal, StrategyGoalInput } from '../../types/opportunities';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

const CATEGORY_OPTIONS = ['career', 'freelance', 'portfolio', 'money', 'investment', 'learning', 'health', 'ethical_filter', 'positioning', 'operations'];
const PRIORITY_OPTIONS = ['high', 'medium', 'low'];
const STATUS_OPTIONS = ['active', 'planned', 'paused', 'completed', 'archived', 'failed'];
const TIME_HORIZON_OPTIONS = ['yearly', 'six_months', 'quarterly', 'monthly', 'weekly', 'daily'];

const formatDate = (value?: string) => {
  if (!value) return '—';
  return value.slice(0, 10);
};

const parseProgress = (value: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

const getPriorityVariant = (p: string) => {
  if (p === 'high') return 'warning';
  if (p === 'medium') return 'neutral';
  return 'neutral';
};

const getStatusVariant = (s: string) => {
  if (s === 'active') return 'success';
  if (s === 'planned') return 'blue';
  if (s === 'paused' || s === 'archived') return 'warning';
  if (s === 'completed') return 'success';
  if (s === 'failed') return 'danger';
  return 'neutral';
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
  showCreateButton?: boolean;
};

const GoalsPanel: React.FC<Props> = ({
  goals, onEdit, onDelete, onSelect, onOpenNew,
  filterCategory, setFilterCategory, filterStatus, setFilterStatus, filterPriority, setFilterPriority,
  showCreateButton = true,
}) => {
  const filtered = goals.filter((g) => {
    if (filterCategory && g.category !== filterCategory) return false;
    if (filterStatus && g.status !== filterStatus) return false;
    if (filterPriority && g.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}
            className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none hover:border-neutral-300">
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
            className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none hover:border-neutral-300">
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}
            className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none hover:border-neutral-300">
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>
        {showCreateButton ? <Button variant="primary" size="sm" onClick={onOpenNew}>Add Goal</Button> : null}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <EmptyState
            title="No strategic goals yet."
            description="Start with one outcome that matters."
            action={showCreateButton ? <Button variant="primary" size="sm" onClick={onOpenNew}>Add Goal</Button> : undefined}
          />
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Goal</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Category</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Priority</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Status</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Horizon</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Progress</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Target date</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Success metric</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Linked</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((goal) => {
                  const progress = Math.round(Number(goal.progress ?? 0));
                  return (
                    <tr key={goal.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors cursor-pointer" onClick={() => onSelect(goal)}>
                      <td className="px-4 py-3 align-middle text-sm text-neutral-900 max-w-[240px] truncate font-medium">{goal.title}</td>
                      <td className="px-4 py-3 align-middle"><Badge variant="neutral">{goal.category}</Badge></td>
                      <td className="px-4 py-3 align-middle"><Badge variant={getPriorityVariant(goal.priority)}>{goal.priority}</Badge></td>
                      <td className="px-4 py-3 align-middle"><Badge variant={getStatusVariant(goal.status)}>{goal.status}</Badge></td>
                      <td className="px-4 py-3 align-middle text-sm text-neutral-700">{goal.timeHorizon?.replace('_', ' ') || '—'}</td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center gap-2 min-w-[120px]">
                          <div className="h-1.5 w-20 rounded-full bg-neutral-100 overflow-hidden">
                            <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-sm tabular-nums text-neutral-700">{progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 align-middle text-sm text-neutral-700">{formatDate(goal.targetDate)}</td>
                      <td className="px-4 py-3 align-middle text-sm text-neutral-700 max-w-[180px] truncate">{goal.successMetric || '—'}</td>
                      <td className="px-4 py-3 align-middle text-sm text-neutral-500 max-w-[160px] truncate">{goal.linkedProjectName || goal.linkedCompanyName || '—'}</td>
                      <td className="px-4 py-3 align-middle">
                        <div className="flex items-center justify-end gap-1">
                          <button type="button" aria-label="Edit" onClick={() => onEdit(goal)}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-200 hover:bg-neutral-50 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
                          </button>
                          <button type="button" aria-label="Delete" onClick={() => onDelete(goal.id)}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
                          </button>
                        </div>
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
  );
};

export default GoalsPanel;
