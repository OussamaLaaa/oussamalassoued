import React, { useState } from 'react';
import type { RecurringTask, RecurringTaskInput, TaskPriority, TaskCategory, RecurringFrequency, Project, Plan, StrategyGoal, Company, Person } from '../../types/opportunities';

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
        <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">{error}</div>
      )}

      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Title *</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" placeholder="Recurring task title" />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Frequency</label>
          <select value={frequency} onChange={(e) => setFrequency(e.target.value as RecurringFrequency)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
            {FREQ_OPTIONS.map((f) => <option key={f} value={f}>{f}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Category</label>
        <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
          <option value="">None</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Days of Week</label>
        <div className="flex flex-wrap gap-1">
          {DAYS.map((day) => {
            const selected = daysOfWeek.split(',').map((d) => d.trim()).includes(day);
            return (
              <button key={day} type="button" onClick={() => handleToggleDay(day)}
                className={`px-2 py-1 text-xs rounded border ${selected ? 'bg-[#2563eb] text-white border-[#2563eb]' : 'bg-white text-[#0f172a] border-[#e5e7eb] hover:bg-[#f8fafc]'}`}
              >
                {day.slice(0, 3)}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Est. Minutes</label>
          <input type="number" min={0} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Start Date</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">End Date</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
        </div>
      </div>

      <div>
        <label className="flex items-center gap-2 text-xs font-medium text-[#475569]">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="rounded border-[#e5e7eb] text-[#2563eb]" />
          Active
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Project</label>
          <select value={linkedProjectId} onChange={(e) => setLinkedProjectId(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
            <option value="">None</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Plan</label>
          <select value={linkedPlanId} onChange={(e) => setLinkedPlanId(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
            <option value="">None</option>
            {plans.map((p) => <option key={p.id} value={p.id}>{p.title}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Strategy Goal</label>
          <select value={linkedStrategyGoalId} onChange={(e) => setLinkedStrategyGoalId(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
            <option value="">None</option>
            {strategyGoals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Company</label>
          <select value={linkedCompanyId} onChange={(e) => setLinkedCompanyId(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
            <option value="">None</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Person</label>
        <select value={linkedPersonId} onChange={(e) => setLinkedPersonId(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
          <option value="">None</option>
          {people.map((p) => <option key={p.id} value={p.id}>{p.fullName}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]">Cancel</button>
        <button type="submit" disabled={saving} className="px-4 py-2 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50">{saving ? 'Saving...' : initial?.id ? 'Update' : 'Add'}</button>
      </div>
    </form>
  );
};

export default RecurringTaskForm;
