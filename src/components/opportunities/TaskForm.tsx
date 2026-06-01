import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useState } from 'react';
import type { Task, TaskInput, TaskStatus, TaskPriority, TaskCategory, Project, Plan, StrategyGoal, Company, Person } from '../../types/opportunities';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

const STATUS_OPTIONS: TaskStatus[] = ['todo', 'doing', 'done', 'blocked', 'cancelled'];
const PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low'];
const CATEGORY_OPTIONS: TaskCategory[] = ['work', 'career', 'freelance', 'project', 'money', 'health', 'learning', 'family', 'admin', 'relationship', 'home', 'other'];

const TaskForm: React.FC<{
 initial?: Partial<Task>;
 projects: Project[];
 plans: Plan[];
 strategyGoals: StrategyGoal[];
 companies: Company[];
 people: Person[];
 defaultWeekStart?: string;
 onSubmit: (input: TaskInput) => Promise<void>;
 onCancel: () => void;
}> = ({ initial, projects, plans, strategyGoals, companies, people, onSubmit, onCancel }) => {
 const { t } = usePersonalLanguage();
 const [title, setTitle] = useState(initial?.title || '');
 const [description, setDescription] = useState(initial?.description || '');
 const [status, setStatus] = useState<TaskStatus>(initial?.status || 'todo');
 const [priority, setPriority] = useState<TaskPriority>(initial?.priority || 'medium');
 const [category, setCategory] = useState(initial?.category || '');
 const [taskDate, setTaskDate] = useState(initial?.taskDate || '');
 const [estimatedMinutes, setEstimatedMinutes] = useState(initial?.estimatedMinutes != null ? String(initial.estimatedMinutes) : '');
 const [actualMinutes, setActualMinutes] = useState(initial?.actualMinutes != null ? String(initial.actualMinutes) : '');
 const [linkedProjectId, setLinkedProjectId] = useState(initial?.linkedProjectId || '');
 const [linkedPlanId, setLinkedPlanId] = useState(initial?.linkedPlanId || '');
 const [linkedStrategyGoalId, setLinkedStrategyGoalId] = useState(initial?.linkedStrategyGoalId || '');
 const [linkedCompanyId, setLinkedCompanyId] = useState(initial?.linkedCompanyId || '');
 const [linkedPersonId, setLinkedPersonId] = useState(initial?.linkedPersonId || '');
 const [notes, setNotes] = useState(initial?.notes || '');
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title.trim()) { setError('Title is required.'); return; }
 setSaving(true);
 setError(null);
 try {
 await onSubmit({
 title: title.trim(),
 description: description || undefined,
 status,
 priority,
 category: (category || undefined) as TaskCategory | undefined,
 taskDate: taskDate || undefined,
 estimatedMinutes: estimatedMinutes ? Math.max(0, Number(estimatedMinutes)) : undefined,
 actualMinutes: actualMinutes ? Math.max(0, Number(actualMinutes)) : undefined,
 linkedProjectId: linkedProjectId || undefined,
 linkedPlanId: linkedPlanId || undefined,
 linkedStrategyGoalId: linkedStrategyGoalId || undefined,
 linkedCompanyId: linkedCompanyId || undefined,
 linkedPersonId: linkedPersonId || undefined,
 notes: notes || undefined,
 });
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to save.');
 } finally {
 setSaving(false);
 }
 };

 return (
 <form onSubmit={handleSubmit} className="space-y-4 text-sm">
 {error && (
 <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>
 )}

 <Input label="Title *" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />

 <Textarea label={t("Description", "Description", "Description")} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />

 <div className="grid grid-cols-3 gap-3">
 <Select label={t("Status", "Status", "Status")} options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))} value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} />
 <Select label={t("Priority", "Priority", "Priority")} options={PRIORITY_OPTIONS.map(p => ({ value: p, label: p }))} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} />
 <Select label={t("Category", "Category", "Category")} options={[{ value: '', label: 'None' }, ...CATEGORY_OPTIONS.map(c => ({ value: c, label: c }))]} value={category} onChange={(e) => setCategory(e.target.value)} />
 </div>

 <div className="grid grid-cols-3 gap-3">
 <Input label={t("Date", "Date", "Date")} type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} />
 <Input label="Est. Minutes" type="number" min={0} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} />
 <Input label="Actual Minutes" type="number" min={0} value={actualMinutes} onChange={(e) => setActualMinutes(e.target.value)} />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <Select label="Project" options={[{ value: '', label: 'None' }, ...projects.map(p => ({ value: p.id, label: p.name }))]} value={linkedProjectId} onChange={(e) => setLinkedProjectId(e.target.value)} />
 <Select label="Plan" options={[{ value: '', label: 'None' }, ...plans.map(p => ({ value: p.id, label: p.title }))]} value={linkedPlanId} onChange={(e) => setLinkedPlanId(e.target.value)} />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <Select label="Strategy Goal" options={[{ value: '', label: 'None' }, ...strategyGoals.map(g => ({ value: g.id, label: g.title }))]} value={linkedStrategyGoalId} onChange={(e) => setLinkedStrategyGoalId(e.target.value)} />
 <Select label={t("Company", "Company", "Company")} options={[{ value: '', label: 'None' }, ...companies.map(c => ({ value: c.id, label: c.name }))]} value={linkedCompanyId} onChange={(e) => setLinkedCompanyId(e.target.value)} />
 </div>

 <Select label={t("Person", "Person", "Person")} options={[{ value: '', label: 'None' }, ...people.map(p => ({ value: p.id, label: p.fullName }))]} value={linkedPersonId} onChange={(e) => setLinkedPersonId(e.target.value)} />

 <Textarea label={t("Notes", "Notes", "Notes")} value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />

 <div className="flex items-center justify-end gap-2 pt-2">
 <Button type="button" variant="secondary" onClick={onCancel}>Cancel</Button>
 <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : initial?.id ? 'Update Task' : 'Add Task'}</Button>
 </div>
 </form>
 );
};

export default TaskForm;
