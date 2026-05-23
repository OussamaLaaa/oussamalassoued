import React from 'react';
import LabelPill from './StrategyLabelPill';
import type { StrategyDecision, StrategyDecisionInput } from '../../types/opportunities';

const formatDate = (value?: string) => {
  if (!value) return 'none';
  return value.slice(0, 10);
};

type Props = {
  decisions: StrategyDecision[];
  onUpdate: (id: string, input: Partial<StrategyDecisionInput>) => Promise<StrategyDecision>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (decision: StrategyDecision) => void;
  onOpenNew: () => void;
};

const DecisionsPanel: React.FC<Props> = ({ decisions, onUpdate, onDelete, onEdit, onOpenNew }) => {
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={onOpenNew} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] active:scale-[0.97]">
          Add Decision
        </button>
      </div>
      {decisions.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-8 text-center">
          <div className="text-3xl">📝</div>
          <p className="mt-2 text-sm text-[#64748b]">No decisions logged yet. Record important choices and review them later.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {decisions.map((item) => {
            const needsReview = Boolean(item.reviewDate && item.reviewDate.slice(0, 10) <= today);
            return (
              <div key={item.id} className={`rounded-xl border p-4 transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)] ${needsReview ? 'border-[#fca5a5] bg-[#fff5f5]' : 'border-[#e2e8f0] bg-white'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-semibold text-[#0f172a]">{item.title}</h4>
                      {needsReview ? <LabelPill text="Review Due" tone="danger" /> : null}
                    </div>
                    {item.context ? <p className="mt-0.5 text-sm text-[#64748b]">{item.context}</p> : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <button type="button" onClick={() => onEdit(item)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs font-medium text-[#475569] transition-all hover:border-[#2563eb] hover:text-[#2563eb]">Edit</button>
                    <button type="button" onClick={() => onDelete(item.id)} className="rounded-lg border border-[#fecaca] bg-white px-3 py-1.5 text-xs font-medium text-[#991b1b] transition-all hover:bg-[#fef2f2]">Delete</button>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-1 gap-x-6 gap-y-1.5 text-sm text-[#334155] md:grid-cols-2">
                  <div><span className="font-medium text-[#64748b]">Decision:</span> {item.decision || 'none'}</div>
                  <div><span className="font-medium text-[#64748b]">Reason:</span> {item.reason || 'none'}</div>
                  <div><span className="font-medium text-[#64748b]">Expected:</span> {item.expectedResult || 'none'}</div>
                  <div><span className="font-medium text-[#64748b]">Review:</span> {formatDate(item.reviewDate)}</div>
                  <div><span className="font-medium text-[#64748b]">Status:</span> {item.status}</div>
                  <div><span className="font-medium text-[#64748b]">Links:</span> {item.linkedGoalTitle || '—'} / {item.linkedPlanName || '—'} / {item.linkedProjectName || '—'}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DecisionsPanel;
