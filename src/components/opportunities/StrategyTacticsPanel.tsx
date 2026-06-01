import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React from 'react';
import type { StrategyTactic, StrategyTacticInput } from '../../types/opportunities';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

const STATUS_OPTIONS = ['active', 'planned', 'paused', 'completed', 'archived', 'failed'];

const getStatusVariant = (s: string) => {
  const { t, language } = usePersonalLanguage();

 if (s === 'active') return 'success';
 if (s === 'planned') return 'blue';
 if (s === 'paused' || s === 'archived') return 'warning';
 if (s === 'completed') return 'success';
 if (s === 'failed') return 'danger';
 return 'neutral';
};

const formatDate = (value?: string) => {
 if (!value) return '—';
 return value.slice(0, 10);
};

type Props = {
 tactics: StrategyTactic[];
 tacticForm: StrategyTacticInput;
 setTacticForm: React.Dispatch<React.SetStateAction<StrategyTacticInput>>;
 onAdd: (input: StrategyTacticInput) => Promise<StrategyTactic>;
 onUpdate: (id: string, input: Partial<StrategyTacticInput>) => Promise<StrategyTactic>;
 onDelete: (id: string) => Promise<void>;
 onEdit: (tactic: StrategyTactic) => void;
 onOpenNew: () => void;
 filterStatus: string;
 setFilterStatus: (v: string) => void;
};

const TacticsPanel: React.FC<Props> = ({
 tactics, onEdit, onDelete, onOpenNew,
 filterStatus, setFilterStatus,
}) => {
 const filtered = tactics.filter((t) => {
 if (filterStatus && t.status !== filterStatus) return false;
 return true;
 });

 return (
 <div className="space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
  <div className="flex flex-wrap gap-2">
  <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
  className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
 <option value="">All statuses</option>
 {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </div>
 <Button variant="primary" size="sm" onClick={onOpenNew}>Add Tactic</Button>
 </div>

 {filtered.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white">
 <EmptyState title="No tactics yet." description="Tactics are concrete actions feeding into plans and goals." action={<Button variant="primary" size="sm" onClick={onOpenNew}>Add Tactic</Button>} />
 </div>
 ) : (
 <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
 <div className="overflow-x-auto">
 <table className="min-w-full border-collapse">
 <thead>
 <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Tactic</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Goal</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Plan</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Status</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Progress</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Due date</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Actions</th>
 </tr>
 </thead>
 <tbody>
 {filtered.map((tactic) => {
 const progress = Math.round(Number(tactic.progress ?? 0));
 return (
 <tr key={tactic.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors">
 <td className="px-4 py-3 align-middle">
 <div>
 <div className="text-sm text-neutral-900 font-medium">{tactic.name}</div>
 {tactic.description && (
 <div className="mt-0.5 text-xs text-neutral-500 max-w-[200px] truncate">{tactic.description}</div>
 )}
 </div>
 </td>
 <td className="px-4 py-3 align-middle text-sm text-neutral-700">{tactic.goalName || '—'}</td>
 <td className="px-4 py-3 align-middle text-sm text-neutral-700">{tactic.planName || '—'}</td>
 <td className="px-4 py-3 align-middle"><Badge variant={getStatusVariant(tactic.status)}>{tactic.status}</Badge></td>
 <td className="px-4 py-3 align-middle">
 <div className="flex items-center gap-2 min-w-[100px]">
 <div className="h-1.5 w-16 rounded-full bg-neutral-100 overflow-hidden">
 <div className="h-full bg-neutral-900 rounded-full" style={{ width: `${progress}%` }} />
 </div>
 <span className="text-sm tabular-nums text-neutral-700">{progress}%</span>
 </div>
 </td>
 <td className="px-4 py-3 align-middle text-sm text-neutral-700">{formatDate(tactic.dueDate)}</td>
 <td className="px-4 py-3 align-middle">
 <div className="flex items-center gap-1">
 <button type="button" aria-label={t("Edit", "Edit", "Edit")} onClick={() => onEdit(tactic)}
 className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-200 hover:bg-neutral-50 transition-colors">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
 </button>
 <button type="button" aria-label={t("Delete", "Delete", "Delete")} onClick={() => onDelete(tactic.id)}
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

export default TacticsPanel;
