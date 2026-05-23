import React from 'react';
import LabelPill from './StrategyLabelPill';
import type { StrategyTactic, StrategyTacticInput } from '../../types/opportunities';

type Props = {
  tactics: StrategyTactic[];
  onAdd: (input: StrategyTacticInput) => Promise<StrategyTactic>;
  onUpdate: (id: string, input: Partial<StrategyTacticInput>) => Promise<StrategyTactic>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (tactic: StrategyTactic) => void;
  onOpenNew: () => void;
};

const TacticsPanel: React.FC<Props> = ({ tactics, onAdd, onUpdate, onDelete, onEdit, onOpenNew }) => (
  <div className="space-y-4">
    <div className="flex justify-end">
      <button type="button" onClick={onOpenNew} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] active:scale-[0.97]">
        Add Tactic
      </button>
    </div>
    {tactics.length === 0 ? (
      <div className="rounded-xl border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-8 text-center">
        <div className="text-3xl">⚡</div>
        <p className="mt-2 text-sm text-[#64748b]">No tactics yet. Add repeatable methods that move goals forward.</p>
      </div>
    ) : (
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {tactics.map((item) => (
          <div key={item.id} className="rounded-xl border border-[#e2e8f0] bg-white p-4 transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-semibold text-[#0f172a]">{item.title}</h4>
                {item.description ? <p className="mt-0.5 text-xs text-[#64748b]">{item.description}</p> : null}
              </div>
              <div className="flex shrink-0 gap-1.5">
                <button type="button" onClick={() => onEdit(item)} className="rounded-lg border border-[#cbd5e1] bg-white px-2.5 py-1 text-xs font-medium text-[#475569] transition-all hover:border-[#2563eb] hover:text-[#2563eb]">Edit</button>
                <button type="button" onClick={() => onDelete(item.id)} className="rounded-lg border border-[#fecaca] bg-white px-2.5 py-1 text-xs font-medium text-[#991b1b] transition-all hover:bg-[#fef2f2]">Delete</button>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <LabelPill text={`Frequency: ${item.frequency || 'none'}`} />
              <LabelPill text={`Metric: ${item.metric || 'none'}`} />
              <LabelPill text={`Next: ${item.nextAction || 'none'}`} />
              <LabelPill text={`Goal: ${item.linkedGoalTitle || 'none'}`} />
              <LabelPill text={`Plan: ${item.linkedPlanName || 'none'}`} />
              <LabelPill text={`Project: ${item.linkedProjectName || 'none'}`} />
              <LabelPill text={item.status} tone={item.status === 'failed' ? 'danger' : item.status === 'completed' ? 'success' : 'neutral'} />
              <LabelPill text={item.priority} tone={item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low'} />
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default TacticsPanel;
