import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useState } from 'react';
import type { RecurringTask, RecurringTaskInput, TaskPriority, TaskCategory, RecurringFrequency, Project, Plan, StrategyGoal, Company, Person } from '../../types/opportunities';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

const FREQ_OPTIONS: RecurringFrequency[] = ['daily', 'weekly', 'monthly', 'custom'];
const PRIORITY_OPTIONS: TaskPriority[] = ['high', 'medium', 'low'];
const CATEGORY_OPTIONS: TaskCategory[] = ['work', 'career', 'freelance', 'project', 'money', 'health', 'learning', 'family', 'admin', 'relationship', 'home', 'other'];
const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const RecurringTaskForm: React.FC<{
 initial?: Partial<RecurringTask>;
 projects: Project[];
 plans: Plan[];
 strategyGoals: StrategyGoal[];
 companies: Company[];
 people: Person[];
 onSubmit: (input: RecurringTaskInput) => Promise<void>;
 onCancel: () => void;
}> = ({ initial, projects, plans, strategyGoals, companies, people, onSubmit, onCancel }) => {
 const [title, setTitle] = useState(initial?.title || '');
 const [description, setDescription] = useState(initial?.description || '');
 const [frequency, setFrequency] = useState<RecurringFrequency>(initial?.frequency || 'weekly');
 const [daysOfWeek, setDaysOfWeek] = useState(initial?.daysOfWeek || '');
 const [priority, setPriority] = useState<TaskPriority>(initial?.priority || 'medium');
 const [category, setCategory] = useState(initial?.category || '');
 const [estimatedMinutes, setEstimatedMinutes] = useState(initial?.estimatedMinutes != null ? String(initial.estimatedMinutes) : '');
 const [startDate, setStartDate] = useState(initial?.startDate || '');
 const [endDate, setEndDate] = useState(initial?.endDate || '');
 const [isActive, setIsActive] = useState(initial?.isActive !== false);
 const [linkedProjectId, setLinkedProjectId] = useState(initial?.linkedProjectId || '');
 const [linkedPlanId, setLinkedPlanId] = useState(initial?.linkedPlanId || '');
 const [linkedStrategyGoalId, setLinkedStrategyGoalId] = useState(initial?.linkedStrategyGoalId || '');
 const [linkedCompanyId, setLinkedCompanyId] = useState(initial?.linkedCompanyId || '');
 const [linkedPersonId, setLinkedPersonId] = useState(initial?.linkedPersonId || '');
 const [notes, setNotes] = useState(initial?.notes || '');
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const handleToggleDay = (day: string) => {
  const { t, language } = usePersonalLanguage();

 const current = daysOfWeek ? daysOfWeek.split(',').map((d) => d.trim()).filter(Boolean) : [];
 const idx = current.indexOf(day);
 if (idx >= 0) { current.splice(idx, 1); } else { current.push(day); }
 setDaysOfWeek(current.join(','));
 };

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 if (!title.trim()) { setError('Title is required.'); return; }
 setSaving(true);
 setError(null);
 try {
 await onSubmit({
 title: title.trim(),
 description: description || undefined,
 frequency,
 daysOfWeek: daysOfWeek || undefined,
 priority,
 category: (category || undefined) as TaskCategory | undefined,
 estimatedMinutes: estimatedMinutes ? Math.max(0, Number(estimatedMinutes)) : undefined,
 startDate: startDate || undefined,
 endDate: endDate || undefined,
 isActive,
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

 <Input label="Title *" type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Recurring task title" />

 <Textarea label={t("Description", "Description", "Description")} value={description} onChange={(e) => setDescription(e.target.value)} rows={2} />

 <div className="grid grid-cols-2 gap-3">
 <Select label="Frequency" options={FREQ_OPTIONS.map(f => ({ value: f, label: f }))} value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)} />
 <Select label={t("Priority", "Priority", "Priority")} options={PRIORITY_OPTIONS.map(p => ({ value: p, label: p }))} value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} />
 </div>

 <Select label={t("Category", "Category", "Category")} options={[{ value: '', label: 'None' }, ...CATEGORY_OPTIONS.map(c => ({ value: c, label: c }))]} value={category} onChange={(e) => setCategory(e.target.value)} />

 <div>
 <label className="block text-xs font-semibold text-black mb-1">Days of Week</label>
 <div className="flex flex-wrap gap-1">
 {DAYS.map((day) => {
 const selected = daysOfWeek.split(',').map((d) => d.trim()).includes(day);
 return (
 <button key={day} type="button" onClick={() => handleToggleDay(day)}
 className={`px-2 py-1 text-xs rounded-md border transition-colors ${selected ? 'bg-neutral-900 text-white border-neutral-900' : 'bg-white text-black border-neutral-300 hover:bg-neutral-50'}`}
 >
 {day.slice(0, 3)}
 </button>
 );
 })}
 </div>
 </div>

 <div className="grid grid-cols-3 gap-3">
 <Input label="Est. Minutes" type="number" min={0} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} />
 <Input label="Start Date" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
 <Input label="End Date" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
 </div>

 <label className="flex items-center gap-2 text-sm">
 <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-neutral-300 text-neutral-900" />
 <span className="text-xs font-semibold text-black">Active</span>
 </label>

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
 <Button type="submit" variant="primary" disabled={saving}>{saving ? 'Saving...' : initial?.id ? 'Update' : 'Add'}</Button>
 </div>
 </form>
 );
};

export default RecurringTaskForm;
