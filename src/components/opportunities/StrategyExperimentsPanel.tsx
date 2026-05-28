import React from 'react';
import type { StrategyExperiment, StrategyExperimentInput } from '../../types/opportunities';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

const STATUS_OPTIONS = ['running', 'planned', 'completed', 'failed', 'archived'];

const getStatusVariant = (s: string) => {
 if (s === 'running') return 'success';
 if (s === 'planned') return 'blue';
 if (s === 'completed') return 'success';
 if (s === 'failed') return 'danger';
 if (s === 'archived') return 'warning';
 return 'neutral';
};

const formatDate = (value?: string) => {
 if (!value) return '—';
 return value.slice(0, 10);
};

type Props = {
 experiments: StrategyExperiment[];
 experimentForm: StrategyExperimentInput;
 setExperimentForm: React.Dispatch<React.SetStateAction<StrategyExperimentInput>>;
 onAdd: (input: StrategyExperimentInput) => Promise<StrategyExperiment>;
 onUpdate: (id: string, input: Partial<StrategyExperimentInput>) => Promise<StrategyExperiment>;
 onDelete: (id: string) => Promise<void>;
 onEdit: (experiment: StrategyExperiment) => void;
 onOpenNew: () => void;
 experimentsFilterStatus: string;
 setExperimentsFilterStatus: (v: string) => void;
};

const ExperimentsPanel: React.FC<Props> = ({
 experiments, onEdit, onDelete, onOpenNew,
 experimentsFilterStatus: filterStatus, setExperimentsFilterStatus: setFilterStatus,
}) => {
 const filtered = experiments.filter((e) => {
 if (filterStatus && e.status !== filterStatus) return false;
 return true;
 });

 return (
 <div className="space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex flex-wrap gap-2">
 <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
 className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none hover:border-neutral-300">
 <option value="">All statuses</option>
 {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </div>
 <Button variant="primary" size="sm" onClick={onOpenNew}>Add Experiment</Button>
 </div>

 {filtered.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white">
 <EmptyState title="No experiments yet." description="Scientific method applied to strategic bets." action={<Button variant="primary" size="sm" onClick={onOpenNew}>Add Experiment</Button>} />
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
 {filtered.map((exp) => {
 const progress = Math.round(Number(exp.progress ?? 0));
 return (
 <div key={exp.id} className="rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-colors">
 <div className="flex items-start justify-between gap-2 px-4 pt-4">
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 <Badge variant={getStatusVariant(exp.status)}>{exp.status}</Badge>
 </div>
 <h4 className="mt-1.5 text-sm font-semibold text-neutral-900 truncate">{exp.name}</h4>
 {exp.description && (
 <p className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{exp.description}</p>
 )}
 </div>
 <div className="flex shrink-0 gap-1">
 <button type="button" aria-label="Edit" onClick={() => onEdit(exp)}
 className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-200 hover:bg-neutral-50 transition-colors">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
 </button>
 <button type="button" aria-label="Delete" onClick={() => onDelete(exp.id)}
 className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
 </button>
 </div>
 </div>
 <div className="px-4 pb-2">
 <div className="flex items-center gap-2 text-xs text-neutral-500">
 {exp.hypothesis && <span className="truncate">H: {exp.hypothesis}</span>}
 </div>
 </div>
 <div className="px-4 pb-4">
 <div className="flex items-center gap-2">
 <div className="h-1.5 flex-1 rounded-full bg-neutral-100 overflow-hidden">
 <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${progress}%` }} />
 </div>
 <span className="text-sm tabular-nums text-neutral-500">{progress}%</span>
 </div>
 </div>
 <div className="grid grid-cols-2 border-t border-neutral-100 text-xs">
 <div className="border-r border-neutral-100 px-4 py-2.5">
 <span className="text-neutral-500">Start</span>
 <div className="mt-0.5 text-neutral-900">{formatDate(exp.startDate)}</div>
 </div>
 <div className="px-4 py-2.5">
 <span className="text-neutral-500">End</span>
 <div className="mt-0.5 text-neutral-900">{formatDate(exp.endDate)}</div>
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

export default ExperimentsPanel;
