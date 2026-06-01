import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React from 'react';
import type { PlanItemInput, Project, StrategyGoal, PlanItemStatus, PlanItemCategory } from '../../types/opportunities';

const STATUS_OPTIONS: PlanItemStatus[] = ['todo', 'doing', 'done', 'blocked', 'cancelled'];
const CATEGORY_OPTIONS: PlanItemCategory[] = ['work', 'career', 'freelance', 'project', 'money', 'health', 'learning', 'family', 'admin'];
const PRIORITY_OPTIONS = ['high', 'medium', 'low'] as const;

type Props = {
 form: PlanItemInput;
 onChange: (f: PlanItemInput) => void;
 projects: Project[];
 strategyGoals: StrategyGoal[];
};

const PlanItemForm: React.FC<Props> = ({ form, onChange, projects, strategyGoals }) => {
  const { t } = usePersonalLanguage();
  return (
  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <Field label={t("Title", "Title", "Title")} required>
 <input value={form.title} onChange={(e) => onChange({ ...form, title: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" required />
 </Field>
 <Field label={t("Category", "Category", "Category")}>
 <select value={form.category || ''} onChange={(e) => onChange({ ...form, category: e.target.value as PlanItemCategory })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {CATEGORY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 </Field>
 <Field label={t("Status", "Status", "Status")}>
 <select value={form.status || 'todo'} onChange={(e) => onChange({ ...form, status: e.target.value as PlanItemStatus })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400">
 {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 </Field>
 <Field label={t("Priority", "Priority", "Priority")}>
 <select value={form.priority || 'medium'} onChange={(e) => onChange({ ...form, priority: e.target.value as typeof PRIORITY_OPTIONS[number] })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400">
 {PRIORITY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
 </select>
 </Field>
 <Field label="Due Date">
 <input type="date" value={form.dueDate || ''} onChange={(e) => onChange({ ...form, dueDate: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Completed At">
 <input type="date" value={form.completedAt || ''} onChange={(e) => onChange({ ...form, completedAt: e.target.value })} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" />
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
 <Field label={t("Description", "Description", "Description")} className="md:col-span-2">
 <textarea value={form.description || ''} onChange={(e) => onChange({ ...form, description: e.target.value })} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm text-neutral-900 bg-white outline-none focus:border-neutral-400" />
 </Field>
  </div>
  );
};

const Field: React.FC<{ label: string; required?: boolean; className?: string; children: React.ReactNode }> = ({ label, required, className, children }) => (
 <label className={`block text-sm text-neutral-700 ${className || ''}`}>
 {label}{required ? ' *' : ''}
 {children}
 </label>
);

export default PlanItemForm;
