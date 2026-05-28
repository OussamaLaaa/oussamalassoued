import React from 'react';
import type { StrategyPlan, StrategyPlanInput, StrategyPlanVariant } from '../../types/opportunities';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

const PRIORITY_OPTIONS = ['high', 'medium', 'low'];
const STATUS_OPTIONS = ['active', 'planned', 'paused', 'completed', 'archived', 'failed'];

const getPriorityVariant = (p: string) => {
 if (p === 'high') return 'warning';
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

const formatDate = (value?: string) => {
 if (!value) return '—';
 return value.slice(0, 10);
};

const variantLabelMap: Record<string, string> = { a: 'Plan A', b: 'Plan B', c: 'Plan C' };

const getVariantBadge = (v: string) => {
 const label = variantLabelMap[v] || v;
 let variant: 'success' | 'warning' | 'danger' | 'neutral' | 'blue' = 'neutral';
 if (v === 'a') variant = 'success';
 else if (v === 'b') variant = 'warning';
 else if (v === 'c') variant = 'danger';
 return <Badge variant={variant}>{label}</Badge>;
};

type Props = {
 plans: StrategyPlan[];
 filterVariant: string;
 setFilterVariant: (v: string) => void;
 filterStatus: string;
 setFilterStatus: (v: string) => void;
 filterPriority: string;
 setFilterPriority: (v: string) => void;
 onOpenNew: () => void;
 onEdit: (plan: StrategyPlan) => void;
 onDelete: (id: string) => Promise<void>;
};

const PlansPanel: React.FC<Props> = ({
 plans, filterVariant, setFilterVariant, filterStatus, setFilterStatus, filterPriority, setFilterPriority, onOpenNew, onEdit, onDelete,
}) => {
 const filtered = plans.filter((p) => {
 if (filterVariant && p.variant !== filterVariant) return false;
 if (filterStatus && p.status !== filterStatus) return false;
 if (filterPriority && p.priority !== filterPriority) return false;
 return true;
 });

 return (
 <div className="space-y-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div className="flex flex-wrap gap-2">
 <select value={filterVariant} onChange={(e) => setFilterVariant(e.target.value)}
 className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none hover:border-neutral-300">
 <option value="">All variants</option>
 {['a', 'b', 'c'].map((v) => <option key={v} value={v}>Plan {v.toUpperCase()}</option>)}
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
 <Button variant="primary" size="sm" onClick={onOpenNew}>Add Plan</Button>
 </div>

 {filtered.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white">
 <EmptyState title="No plans yet." description="Create Plan A, B, or C to parallel your bets." action={<Button variant="primary" size="sm" onClick={onOpenNew}>Add Plan</Button>} />
 </div>
 ) : (
 <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
 {filtered.map((plan) => {
 const progress = Math.round(Number(plan.progress ?? 0));
 return (
 <div key={plan.id} className="rounded-xl border border-neutral-200 bg-white hover:border-neutral-300 transition-colors">
 <div className="flex items-start justify-between gap-2 px-4 pt-4">
 <div className="min-w-0">
 <div className="flex items-center gap-2">
 {getVariantBadge(plan.variant)}
 <Badge variant={getPriorityVariant(plan.priority)}>{plan.priority}</Badge>
 </div>
 <h4 className="mt-1.5 text-sm font-semibold text-neutral-900 truncate">{plan.name}</h4>
 </div>
 <div className="flex shrink-0 gap-1">
 <button type="button" aria-label="Edit" onClick={() => onEdit(plan)}
 className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-200 hover:bg-neutral-50 transition-colors">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /></svg>
 </button>
 <button type="button" aria-label="Delete" onClick={() => onDelete(plan.id)}
 className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" /></svg>
 </button>
 </div>
 </div>
 <div className="px-4 pb-2">
 <Badge variant={getStatusVariant(plan.status)}>{plan.status}</Badge>
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
 <span className="text-neutral-500">Target</span>
 <div className="mt-0.5 text-neutral-900">{formatDate(plan.targetDate)}</div>
 </div>
 <div className="px-4 py-2.5">
 <span className="text-neutral-500">Reviewed</span>
 <div className="mt-0.5 text-neutral-900">{plan.reviewed ? 'Yes' : 'No'}</div>
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

export default PlansPanel;
