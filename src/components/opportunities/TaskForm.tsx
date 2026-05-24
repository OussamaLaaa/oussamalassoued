import React, { useState } from 'react';
import type { Task, TaskInput, TaskStatus, TaskPriority, TaskCategory, Project, Plan, StrategyGoal, Company, Person } from '../../types/opportunities';

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
  onSubmit: (input: TaskInput) => Promise<void>;
  onCancel: () => void;
}> = ({ initial, projects, plans, strategyGoals, companies, people, onSubmit, onCancel }) => {
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
        <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">{error}</div>
      )}

      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Title *</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" placeholder="Task title" />
      </div>

      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
            {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
            {PRIORITY_OPTIONS.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Category</label>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
            <option value="">None</option>
            {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Date</label>
          <input type="date" value={taskDate} onChange={(e) => setTaskDate(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Est. Minutes</label>
          <input type="number" min={0} value={estimatedMinutes} onChange={(e) => setEstimatedMinutes(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Actual Minutes</label>
          <input type="number" min={0} value={actualMinutes} onChange={(e) => setActualMinutes(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
        </div>
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
        <button type="submit" disabled={saving} className="px-4 py-2 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50">{saving ? 'Saving...' : initial?.id ? 'Update Task' : 'Add Task'}</button>
      </div>
    </form>
  );
};

export default TaskForm;
