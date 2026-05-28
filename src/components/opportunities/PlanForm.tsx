import React from 'react';
import type { PlanInput, Project, StrategyGoal, PlanType, PlanStatus } from '../../types/opportunities';

const PRIORITY_OPTIONS = ['high', 'medium', 'low'] as const;

type Props = {
 form: PlanInput;
 onChange: (f: PlanInput) => void;
 projects: Project[];
 strategyGoals: StrategyGoal[];
};

const PlanForm: React.FC<Props> = ({ form, onChange, projects, strategyGoals }) => (
 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <Field label="Title" required>
 <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" required />
 </Field>
 <Field label="Type">
 <select value={form.type} onChange={(e) => onChange({ ...form, type: e.target.value as PlanType })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400">
 <option value="yearly">Year</option>
 <option value="six_months">6 Months</option>
 <option value="quarterly">Quarter</option>
 <option value="monthly">Month</option>
 <option value="weekly">Week</option>
 <option value="daily">Daily</option>
 </select>
 </Field>
 <Field label="Status">
 <select value={form.status || 'planned'} onChange={(e) => onChange({ ...form, status: e.target.value as PlanStatus })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400">
 <option value="planned">Planned</option>
 <option value="active">Active</option>
 <option value="completed">Completed</option>
 <option value="archived">Archived</option>
 </select>
 </Field>
 <Field label="Priority">
 <select value={form.priority || 'medium'} onChange={(e) => onChange({ ...form, priority: e.target.value as typeof PRIORITY_OPTIONS[number] })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400">
 {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 </Field>
 <Field label="Start Date">
 <input type="date" value={form.startDate || ''} onChange={(e) => onChange({ ...form, startDate: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="End Date">
 <input type="date" value={form.endDate || ''} onChange={(e) => onChange({ ...form, endDate: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Linked Strategy Goal">
 <select value={form.linkedStrategyGoalId || ''} onChange={(e) => onChange({ ...form, linkedStrategyGoalId: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {strategyGoals.map(g => <option key={g.id} value={g.id}>{g.title}</option>)}
 </select>
 </Field>
 <Field label="Linked Project">
 <select value={form.linkedProjectId || ''} onChange={(e) => onChange({ ...form, linkedProjectId: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </Field>
 <Field label="Focus">
 <input value={form.focus || ''} onChange={(e) => onChange({ ...form, focus: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Success Criteria">
 <input value={form.successCriteria || ''} onChange={(e) => onChange({ ...form, successCriteria: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Review Notes" className="md:col-span-2">
 <textarea value={form.reviewNotes || ''} onChange={(e) => onChange({ ...form, reviewNotes: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" />
 </Field>
 </div>
);

const Field: React.FC<{ label: string; required?: boolean; className?: string; children: React.ReactNode }> = ({ label, required, className, children }) => (
 <label className={`block text-sm text-neutral-700 ${className || ''}`}>
 {label}{required ? ' *' : ''}
 {children}
 </label>
);

export default PlanForm;
