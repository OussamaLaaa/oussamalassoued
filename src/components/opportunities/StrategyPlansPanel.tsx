import React from 'react';
import LabelPill from './StrategyLabelPill';
import type { StrategyPlan, StrategyPlanInput, StrategyStatus } from '../../types/opportunities';

const STATUS_OPTIONS: StrategyStatus[] = ['active', 'planned', 'paused', 'completed', 'archived', 'failed'];

const todayKey = () => new Date().toISOString().slice(0, 10);

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

const parseProgress = (value: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

const LANE_LABELS: Record<string, string> = { A: 'Plan A', B: 'Plan B', C: 'Plan C', other: 'Other' };

type Props = {
  plans: StrategyPlan[];
  onAdd: (input: StrategyPlanInput) => Promise<StrategyPlan>;
  onUpdate: (id: string, input: Partial<StrategyPlanInput>) => Promise<StrategyPlan>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (plan: StrategyPlan) => void;
  onOpenNew: () => void;
  progressDraft: Record<string, number>;
  setProgressDraft: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  statusDraft: Record<string, StrategyStatus>;
  setStatusDraft: React.Dispatch<React.SetStateAction<Record<string, StrategyStatus>>>;
};

const PlanCard: React.FC<{ plan: StrategyPlan; progressDraft: Record<string, number>; statusDraft: Record<string, StrategyStatus>; setProgressDraft: Props['setProgressDraft']; setStatusDraft: Props['setStatusDraft']; onUpdate: Props['onUpdate']; onEdit: Props['onEdit']; onDelete: Props['onDelete'] }> = ({
  plan, progressDraft, statusDraft, setProgressDraft, setStatusDraft, onUpdate, onEdit, onDelete,
}) => {
  const progress = progressDraft[plan.id] ?? Number(plan.progress ?? 0);
  const status = statusDraft[plan.id] ?? plan.status;
  const isRisk = getRiskFlag({ ...plan, progress, status });

  const updateInline = async () => {
    const nextProgress = progressDraft[plan.id] ?? Number(plan.progress ?? 0);
    const nextStatus = statusDraft[plan.id] ?? plan.status;
    try { await onUpdate(plan.id, { progress: nextProgress, status: nextStatus }); } catch { /* ignore */ }
  };

  return (
    <div className={`rounded-xl border p-3 transition-all hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] ${isRisk ? 'border-[#fca5a5] bg-[#fff5f5]' : 'border-[#dbe3ef] bg-white'}`}>
      <div className="flex items-start justify-between gap-2">
        <h5 className="text-sm font-semibold text-[#0f172a]">{plan.name}</h5>
        {isRisk ? <LabelPill text="At Risk" tone="danger" /> : null}
      </div>
      {plan.description ? <p className="mt-0.5 text-xs text-[#64748b]">{plan.description}</p> : null}
      <div className="mt-2 space-y-0.5 text-xs text-[#475569]">
        <div><span className="font-medium text-[#64748b]">Assumptions:</span> {plan.assumptions || 'none'}</div>
        <div><span className="font-medium text-[#64748b]">Risks:</span> {plan.risks || 'none'}</div>
        <div><span className="font-medium text-[#64748b]">Trigger:</span> {plan.triggerToSwitch || 'none'}</div>
        <div><span className="font-medium text-[#64748b]">Next:</span> {plan.nextAction || 'none'}</div>
        <div><span className="font-medium text-[#64748b]">Goal:</span> {plan.linkedGoalTitle || 'none'}</div>
        <div><span className="font-medium text-[#64748b]">Project:</span> {plan.linkedProjectName || 'none'}</div>
      </div>
      <div className="mt-2">
        <label className="text-[10px] font-mono uppercase tracking-[0.08em] text-[#64748b]">Status</label>
        <select value={status} onChange={(e) => setStatusDraft((prev) => ({ ...prev, [plan.id]: e.target.value as StrategyStatus }))} className="mt-1 w-full rounded-lg border border-[#cbd5e1] bg-white px-2 py-1 text-xs text-[#0f172a]">
          {STATUS_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
      <div className="mt-2">
        <div className="mb-1 flex items-center justify-between text-[10px] text-[#64748b]">
          <span className="font-medium">Progress</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <input type="range" min={0} max={100} value={progress} onChange={(e) => setProgressDraft((prev) => ({ ...prev, [plan.id]: parseProgress(e.target.value) }))} className="w-full accent-[#2563eb]" />
      </div>
      <div className="mt-2 flex gap-1.5">
        <button type="button" onClick={updateInline} className="rounded-lg border border-[#cbd5e1] bg-white px-2 py-1 text-xs font-medium text-[#475569] transition-all hover:border-[#2563eb] hover:text-[#2563eb]">Save</button>
        <button type="button" onClick={() => onEdit(plan)} className="rounded-lg border border-[#cbd5e1] bg-white px-2 py-1 text-xs font-medium text-[#475569] transition-all hover:border-[#2563eb] hover:text-[#2563eb]">Edit</button>
        <button type="button" onClick={() => onDelete(plan.id)} className="rounded-lg border border-[#fecaca] bg-white px-2 py-1 text-xs font-medium text-[#991b1b] transition-all hover:bg-[#fef2f2]">Delete</button>
      </div>
    </div>
  );
};

const PlansPanel: React.FC<Props> = ({ plans, onAdd, onUpdate, onDelete, onEdit, onOpenNew, progressDraft, setProgressDraft, statusDraft, setStatusDraft }) => {
  const byLane = React.useMemo(() => ({
    A: plans.filter((p) => p.label === 'A'),
    B: plans.filter((p) => p.label === 'B'),
    C: plans.filter((p) => p.label === 'C'),
    other: plans.filter((p) => p.label !== 'A' && p.label !== 'B' && p.label !== 'C'),
  }), [plans]);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={onOpenNew} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] active:scale-[0.97]">
          Add Plan
        </button>
      </div>
      {plans.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-8 text-center">
          <div className="text-3xl">📋</div>
          <p className="mt-2 text-sm text-[#64748b]">No plans yet. Create Plan A, then define B and C as fallback paths.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {(Object.entries(byLane) as [string, StrategyPlan[]][]).map(([key, items]) => (
            <div key={key} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2563eb]/10 text-xs font-bold text-[#2563eb]">{key === 'other' ? '~' : key}</div>
                <h4 className="text-sm font-semibold text-[#0f172a]">{LANE_LABELS[key] || key}</h4>
              </div>
              <div className="space-y-2">
                {items.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-[#dbe3ef] bg-white p-4 text-center text-xs text-[#94a3b8]">Empty lane</div>
                ) : items.map((plan) => (
                  <PlanCard key={plan.id} plan={plan} progressDraft={progressDraft} statusDraft={statusDraft} setProgressDraft={setProgressDraft} setStatusDraft={setStatusDraft} onUpdate={onUpdate} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlansPanel;
