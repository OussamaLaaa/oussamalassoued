import React from 'react';
import LabelPill from './StrategyLabelPill';
import type { StrategyExperiment, StrategyExperimentInput } from '../../types/opportunities';

const formatDate = (value?: string) => {
  if (!value) return 'none';
  return value.slice(0, 10);
};

type Props = {
  experiments: StrategyExperiment[];
  onAdd: (input: StrategyExperimentInput) => Promise<StrategyExperiment>;
  onUpdate: (id: string, input: Partial<StrategyExperimentInput>) => Promise<StrategyExperiment>;
  onDelete: (id: string) => Promise<void>;
  onEdit: (exp: StrategyExperiment) => void;
  onOpenNew: () => void;
};

const ExperimentsPanel: React.FC<Props> = ({ experiments, onAdd, onUpdate, onDelete, onEdit, onOpenNew }) => {
  const byStatus = React.useMemo(() => ({
    planned: experiments.filter((e) => e.status === 'planned'),
    running: experiments.filter((e) => e.status === 'active'),
    completed: experiments.filter((e) => e.status === 'completed'),
    failed: experiments.filter((e) => e.status === 'failed'),
  }), [experiments]);

  const columns: Array<{ key: keyof typeof byStatus; title: string; items: StrategyExperiment[] }> = [
    { key: 'planned', title: 'Planned', items: byStatus.planned },
    { key: 'running', title: 'Running', items: byStatus.running },
    { key: 'completed', title: 'Completed', items: byStatus.completed },
    { key: 'failed', title: 'Failed', items: byStatus.failed },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button type="button" onClick={onOpenNew} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] active:scale-[0.97]">
          Add Experiment
        </button>
      </div>
      {experiments.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-8 text-center">
          <div className="text-3xl">🧪</div>
          <p className="mt-2 text-sm text-[#64748b]">No experiments yet. Test assumptions instead of overthinking.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          {columns.map((col) => (
            <div key={col.key} className="rounded-xl border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <div className="mb-2 flex items-center justify-between">
                <h4 className="text-sm font-semibold text-[#0f172a]">{col.title}</h4>
                <span className="rounded-full bg-[#e2e8f0] px-2 py-0.5 text-[11px] font-medium text-[#475569]">{col.items.length}</span>
              </div>
              <div className="space-y-2">
                {col.items.length === 0 ? (
                  <div className="rounded-lg border-2 border-dashed border-[#dbe3ef] bg-white p-4 text-center text-xs text-[#94a3b8]">Empty</div>
                ) : col.items.map((item) => (
                  <div key={item.id} className="rounded-xl border border-[#dbe3ef] bg-white p-3 transition-shadow hover:shadow-[0_4px_12px_rgba(15,23,42,0.06)]">
                    <div className="flex items-start justify-between gap-2">
                      <h5 className="text-sm font-semibold text-[#0f172a]">{item.title}</h5>
                      <LabelPill text={item.priority} tone={item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low'} />
                    </div>
                    <div className="mt-1.5 space-y-0.5 text-xs text-[#475569]">
                      {item.hypothesis ? <div><span className="font-medium text-[#64748b]">H:</span> {item.hypothesis}</div> : null}
                      {item.method ? <div><span className="font-medium text-[#64748b]">Method:</span> {item.method}</div> : null}
                      {item.metric ? <div><span className="font-medium text-[#64748b]">Metric:</span> {item.metric}</div> : null}
                      {item.result ? <div><span className="font-medium text-[#64748b]">Result:</span> {item.result}</div> : null}
                      {item.learning ? <div><span className="font-medium text-[#64748b]">Learning:</span> {item.learning}</div> : null}
                      <div><span className="font-medium text-[#64748b]">Dates:</span> {formatDate(item.startDate)} → {formatDate(item.endDate)}</div>
                      {item.linkedGoalTitle ? <div><span className="font-medium text-[#64748b]">Goal:</span> {item.linkedGoalTitle}</div> : null}
                      {item.linkedPlanName ? <div><span className="font-medium text-[#64748b]">Plan:</span> {item.linkedPlanName}</div> : null}
                      {item.linkedProjectName ? <div><span className="font-medium text-[#64748b]">Project:</span> {item.linkedProjectName}</div> : null}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <button type="button" onClick={() => onEdit(item)} className="rounded-lg border border-[#cbd5e1] bg-white px-2 py-1 text-xs font-medium text-[#475569] transition-all hover:border-[#2563eb] hover:text-[#2563eb]">Edit</button>
                      <button type="button" onClick={() => onDelete(item.id)} className="rounded-lg border border-[#fecaca] bg-white px-2 py-1 text-xs font-medium text-[#991b1b] transition-all hover:bg-[#fef2f2]">Delete</button>
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
};

export default ExperimentsPanel;
