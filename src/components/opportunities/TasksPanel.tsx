import React, { useMemo, useState } from 'react';
import type { Task, TaskInput, TaskStatus, TaskWorkLog, TaskWorkLogInput, WeeklyTaskReview, WeeklyTaskReviewInput, RecurringTask, RecurringTaskInput, RecurringTaskLog, RecurringTaskLogInput, Project, Plan, StrategyGoal, Company, Person } from '../../types/opportunities';
import TaskForm from './TaskForm';
import RecurringTaskForm from './RecurringTaskForm';
import TaskDetailWorkspace from './TaskDetailWorkspace';

type TasksView = 'weekly' | 'daily' | 'backlog' | 'review';

const VIEWS: { id: TasksView; label: string }[] = [
  { id: 'weekly', label: 'This Week Tasks' },
  { id: 'daily', label: 'Daily Recurring' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'review', label: 'Weekly Review' },
];

const STATUS_BADGE: Record<TaskStatus, string> = {
  todo: 'bg-[#f1f5f9] text-[#475569] border-[#e5e7eb]',
  doing: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
  done: 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]',
  blocked: 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]',
  cancelled: 'bg-[#f8fafc] text-[#94a3b8] border-[#e5e7eb]',
};

const PRIORITY_ICON: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'Todo', color: 'border-t-[#94a3b8]' },
  { status: 'doing', label: 'Doing', color: 'border-t-[#2563eb]' },
  { status: 'done', label: 'Done', color: 'border-t-[#16a34a]' },
  { status: 'blocked', label: 'Blocked', color: 'border-t-[#dc2626]' },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const getWeekStart = (date: Date = new Date()): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

const weekStartStr = (date: Date = new Date()): string => {
  const d = getWeekStart(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const formatWeekRange = (startStr: string): string => {
  const start = new Date(startStr + 'T00:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  return `${start.toLocaleDateString('en-US', opts)} – ${end.toLocaleDateString('en-US', opts)}`;
};

const dayName = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
};

const formatHours = (minutes?: number | null): string => {
  if (minutes == null) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const STATUS_ACTIONS: { from: TaskStatus[]; to: TaskStatus; label: string }[] = [
  { from: ['todo', 'doing', 'done', 'blocked', 'cancelled'], to: 'todo', label: 'Todo' },
  { from: ['todo', 'done', 'blocked', 'cancelled'], to: 'doing', label: 'Doing' },
  { from: ['doing', 'blocked', 'cancelled'], to: 'done', label: 'Done' },
  { from: ['todo', 'doing', 'done', 'cancelled'], to: 'blocked', label: 'Block' },
];

const getActionsForStatus = (current: TaskStatus) =>
  STATUS_ACTIONS.filter((a) => a.from.includes(current) && a.to !== current);

// ── Task card ──
const TaskCard: React.FC<{
  task: Task;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onClick: (task: Task) => void;
}> = ({ task, onStatusChange, onEdit, onDelete, onClick }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const actions = getActionsForStatus(task.status);

  return (
    <div className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm hover:shadow-sm transition-shadow relative cursor-pointer" onClick={() => onClick(task)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_BADGE[task.status]}`}>{task.status}</span>
            {task.priority && <span className="text-xs">{PRIORITY_ICON[task.priority]}</span>}
            {task.category && <span className="text-xs px-1.5 py-0.5 rounded bg-[#f8fafc] text-[#64748b] border border-[#e5e7eb]">{task.category}</span>}
          </div>
          <div className="mt-1 font-medium text-[#0f172a]">{task.title}</div>
          {task.description && <div className="mt-0.5 text-xs text-[#64748b] line-clamp-2">{task.description}</div>}
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-[#64748b]">
            {task.estimatedMinutes != null && <span>Est: {formatHours(task.estimatedMinutes)}</span>}
            {task.actualMinutes != null && <span>Actual: {formatHours(task.actualMinutes)}</span>}
            {task.completedAt && <span>Completed: {dayName(task.completedAt.slice(0, 10))}</span>}
          </div>
          {(task.linkedProjectName || task.linkedPlanTitle || task.linkedCompanyName || task.linkedPersonName || task.linkedStrategyGoalTitle || task.linkedDocumentTitle) && (
            <div className="mt-1 flex flex-wrap gap-1">
              {task.linkedProjectName && <span className="text-xs px-1.5 py-0.5 rounded bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">📁 {task.linkedProjectName}</span>}
              {task.linkedPlanTitle && <span className="text-xs px-1.5 py-0.5 rounded bg-[#fef3c7] text-[#d97706] border border-[#fde68a]">📋 {task.linkedPlanTitle}</span>}
              {task.linkedStrategyGoalTitle && <span className="text-xs px-1.5 py-0.5 rounded bg-[#ede9fe] text-[#7c3aed] border border-[#ddd6fe]">🎯 {task.linkedStrategyGoalTitle}</span>}
              {task.linkedCompanyName && <span className="text-xs px-1.5 py-0.5 rounded bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">🏢 {task.linkedCompanyName}</span>}
              {task.linkedPersonName && <span className="text-xs px-1.5 py-0.5 rounded bg-[#fce7f3] text-[#db2777] border border-[#fbcfe8]">👤 {task.linkedPersonName}</span>}
              {task.linkedDocumentTitle && <span className="text-xs px-1.5 py-0.5 rounded bg-[#f1f5f9] text-[#475569] border border-[#e5e7eb]">📄 {task.linkedDocumentTitle}</span>}
            </div>
          )}
        </div>
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button type="button" onClick={() => setMenuOpen(!menuOpen)} className="text-xs px-2 py-1 rounded text-[#64748b] hover:bg-[#f8fafc]">•••</button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-36 rounded-md border border-[#e5e7eb] bg-white shadow-lg">
              {actions.map((a) => (
                <button
                  key={a.to}
                  type="button"
                  onClick={() => { setMenuOpen(false); onStatusChange(task.id, a.to); }}
                  className="block w-full text-left px-3 py-2 text-xs text-[#0f172a] hover:bg-[#f8fafc]"
                >
                  {a.label}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onEdit(task); }}
                className="block w-full text-left px-3 py-2 text-xs text-[#2563eb] hover:bg-[#eff6ff]"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={() => { setMenuOpen(false); onDelete(task.id); }}
                className="block w-full text-left px-3 py-2 text-xs text-[#dc2626] hover:bg-[#fef2f2]"
              >
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Main Panel ──
const TasksPanel: React.FC<{
  tasks: Task[];
  recurringTasks: RecurringTask[];
  recurringTaskLogs: RecurringTaskLog[];
  taskWorkLogs: TaskWorkLog[];
  weeklyTaskReviews: WeeklyTaskReview[];
  projects: Project[];
  plans: Plan[];
  strategyGoals: StrategyGoal[];
  companies: Company[];
  people: Person[];
  generatedDocuments: { id: string; title: string }[];
  onAddTask: (input: TaskInput) => Promise<any>;
  onUpdateTask: (id: string, input: Partial<TaskInput>) => Promise<any>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddRecurringTask: (input: RecurringTaskInput) => Promise<any>;
  onUpdateRecurringTask: (id: string, input: Partial<RecurringTaskInput>) => Promise<any>;
  onDeleteRecurringTask: (id: string) => Promise<void>;
  onAddRecurringTaskLog: (input: RecurringTaskLogInput) => Promise<RecurringTaskLog>;
  onUpdateRecurringTaskLog: (id: string, input: Partial<RecurringTaskLogInput>) => Promise<RecurringTaskLog>;
  onDeleteRecurringTaskLog: (id: string) => Promise<void>;
  onAddTaskWorkLog: (input: TaskWorkLogInput) => Promise<TaskWorkLog>;
  onUpdateTaskWorkLog: (id: string, input: Partial<TaskWorkLogInput>) => Promise<TaskWorkLog>;
  onDeleteTaskWorkLog: (id: string) => Promise<void>;
  onAddWeeklyTaskReview: (input: WeeklyTaskReviewInput) => Promise<WeeklyTaskReview>;
  onUpdateWeeklyTaskReview: (id: string, input: Partial<WeeklyTaskReviewInput>) => Promise<WeeklyTaskReview>;
  onDeleteWeeklyTaskReview: (id: string) => Promise<void>;
}> = ({
  tasks, recurringTasks, recurringTaskLogs, taskWorkLogs, weeklyTaskReviews,
  projects, plans, strategyGoals, companies, people, generatedDocuments,
  onAddTask, onUpdateTask, onDeleteTask,
  onAddRecurringTask, onUpdateRecurringTask, onDeleteRecurringTask,
  onAddRecurringTaskLog, onUpdateRecurringTaskLog, onDeleteRecurringTaskLog,
  onAddTaskWorkLog, onUpdateTaskWorkLog, onDeleteTaskWorkLog,
  onAddWeeklyTaskReview, onUpdateWeeklyTaskReview, onDeleteWeeklyTaskReview,
}) => {
  const [view, setView] = useState<TasksView>('weekly');
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => weekStartStr());
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [completingTask, setCompletingTask] = useState<Task | null>(null);

  const today = todayStr();

  // ── Weekly data ──
  const weeklyTasks = useMemo(
    () => tasks.filter((t) => t.weekStart === selectedWeekStart && t.status !== 'cancelled'),
    [tasks, selectedWeekStart],
  );

  const tasksByStatus = useMemo(() => {
    const map: Record<string, Task[]> = { todo: [], doing: [], done: [], blocked: [] };
    for (const t of weeklyTasks) {
      if (map[t.status]) map[t.status].push(t);
    }
    return map;
  }, [weeklyTasks]);

  const weeklyTaskIds = useMemo(() => new Set(weeklyTasks.map((t) => t.id)), [weeklyTasks]);

  const weekStats = useMemo(() => {
    const total = weeklyTasks.length;
    const todo = tasksByStatus.todo.length;
    const doing = tasksByStatus.doing.length;
    const done = tasksByStatus.done.length;
    const blocked = tasksByStatus.blocked.length;
    const estimated = weeklyTasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0);
    const actualFromLogs = taskWorkLogs
      .filter((l) => weeklyTaskIds.has(l.taskId))
      .reduce((s, l) => s + l.minutesSpent, 0);
    const rate = total > 0 ? Math.round((done / total) * 100) : 0;
    return { total, todo, doing, done, blocked, estimated, actual: actualFromLogs, rate };
  }, [weeklyTasks, tasksByStatus, taskWorkLogs, weeklyTaskIds]);

  // ── Daily recurring data ──
  const todayLogsByRuleId = useMemo(() => {
    const map: Record<string, RecurringTaskLog> = {};
    for (const log of recurringTaskLogs) {
      if (log.logDate === today) {
        map[log.recurringTaskId] = log;
      }
    }
    return map;
  }, [recurringTaskLogs, today]);

  const activeRecurring = useMemo(
    () => recurringTasks.filter((r) => r.isActive),
    [recurringTasks],
  );

  // ── Backlog ──
  const backlogTasks = useMemo(
    () => tasks.filter((t) => !t.weekStart && t.status !== 'cancelled'),
    [tasks],
  );

  // ── Weekly Review ──
  const weekReview = useMemo(
    () => weeklyTaskReviews.find((r) => r.weekStart === selectedWeekStart),
    [weeklyTaskReviews, selectedWeekStart],
  );

  // ── Handlers ──
  const handleStatusChange = async (id: string, status: TaskStatus) => {
    if (status === 'done') {
      const task = tasks.find((t) => t.id === id);
      if (task) { setCompletingTask(task); return; }
    }
    const payload: Partial<TaskInput> = { status };
    if (status !== 'done') payload.completedAt = undefined;
    await onUpdateTask(id, payload);
  };

  const handleComplete = async (id: string, date: string, hours: number, notes: string) => {
    const completedAt = `${date}T00:00:00`;
    const actualMinutes = Math.round(hours * 60);
    const task = tasks.find((t) => t.id === id);
    const updatedNotes = notes
      ? (task?.notes ? `${task.notes}\n[Completed ${date}] ${notes}` : `[Completed ${date}] ${notes}`)
      : task?.notes;
    await onUpdateTask(id, {
      status: 'done',
      completedAt,
      actualMinutes: actualMinutes || undefined,
      notes: updatedNotes,
    });
    if (actualMinutes > 0) {
      await onAddTaskWorkLog({
        taskId: id,
        workDate: date,
        minutesSpent: actualMinutes,
        summary: `Completed task`,
        notes: notes || undefined,
      });
    }
    setCompletingTask(null);
    setSelectedTask(null);
  };

  const handleMoveToWeek = async (id: string) => {
    await onUpdateTask(id, { weekStart: selectedWeekStart });
  };

  const handleMarkRecurringDone = async (ruleId: string) => {
    const existing = todayLogsByRuleId[ruleId];
    if (existing) {
      await onUpdateRecurringTaskLog(existing.id, { status: 'done' });
    } else {
      await onAddRecurringTaskLog({ recurringTaskId: ruleId, logDate: today, status: 'done' });
    }
  };

  const handleMarkRecurringSkipped = async (ruleId: string) => {
    const existing = todayLogsByRuleId[ruleId];
    if (existing) {
      await onUpdateRecurringTaskLog(existing.id, { status: 'skipped' });
    } else {
      await onAddRecurringTaskLog({ recurringTaskId: ruleId, logDate: today, status: 'skipped' });
    }
  };

  const handleWeekNav = (direction: 'prev' | 'next') => {
    const current = new Date(selectedWeekStart + 'T00:00:00');
    if (direction === 'prev') current.setDate(current.getDate() - 7);
    else current.setDate(current.getDate() + 7);
    setSelectedWeekStart(weekStartStr(current));
  };

  const handleThisWeek = () => setSelectedWeekStart(weekStartStr());

  const handleSaveReview = async (input: WeeklyTaskReviewInput) => {
    if (weekReview) {
      await onUpdateWeeklyTaskReview(weekReview.id, input);
    } else {
      await onAddWeeklyTaskReview(input);
    }
  };

  // ── Render weekly tasks ──
  const renderWeekly = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between rounded-md border border-[#e5e7eb] bg-white p-3">
        <button type="button" onClick={() => handleWeekNav('prev')} className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]">&lt; Prev</button>
        <div className="text-center">
          <div className="text-sm font-medium text-[#0f172a]">Week of {formatDate(selectedWeekStart)}</div>
          <div className="text-xs text-[#64748b]">{formatWeekRange(selectedWeekStart)}</div>
        </div>
        <div className="flex items-center gap-2">
          {selectedWeekStart !== weekStartStr() && (
            <button type="button" onClick={handleThisWeek} className="text-xs px-3 py-1.5 rounded border border-[#2563eb] text-[#2563eb] hover:bg-[#eff6ff]">This Week</button>
          )}
          <button type="button" onClick={() => handleWeekNav('next')} className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]">Next &gt;</button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-8 gap-2">
        <div className="rounded-md border border-[#e5e7eb] bg-white p-2 text-center"><div className="text-xs text-[#64748b]">Total</div><div className="text-lg font-bold text-[#0f172a]">{weekStats.total}</div></div>
        <div className="rounded-md border border-[#e5e7eb] bg-white p-2 text-center"><div className="text-xs text-[#64748b]">Todo</div><div className="text-lg font-bold text-[#475569]">{weekStats.todo}</div></div>
        <div className="rounded-md border border-[#e5e7eb] bg-white p-2 text-center"><div className="text-xs text-[#64748b]">Doing</div><div className="text-lg font-bold text-[#2563eb]">{weekStats.doing}</div></div>
        <div className="rounded-md border border-[#e5e7eb] bg-white p-2 text-center"><div className="text-xs text-[#64748b]">Done</div><div className="text-lg font-bold text-[#16a34a]">{weekStats.done}</div></div>
        <div className="rounded-md border border-[#e5e7eb] bg-white p-2 text-center"><div className="text-xs text-[#64748b]">Blocked</div><div className="text-lg font-bold text-[#dc2626]">{weekStats.blocked}</div></div>
        <div className="rounded-md border border-[#e5e7eb] bg-white p-2 text-center"><div className="text-xs text-[#64748b]">Est</div><div className="text-lg font-bold text-[#0f172a]">{formatHours(weekStats.estimated)}</div></div>
        <div className="rounded-md border border-[#e5e7eb] bg-white p-2 text-center"><div className="text-xs text-[#64748b]">Logged</div><div className="text-lg font-bold text-[#0f172a]">{formatHours(weekStats.actual)}</div></div>
        <div className="rounded-md border border-[#e5e7eb] bg-white p-2 text-center"><div className="text-xs text-[#64748b]">Rate</div><div className="text-lg font-bold text-[#0f172a]">{weekStats.rate}%</div></div>
      </div>

      {/* Status columns */}
      <div className="grid grid-cols-4 gap-3">
        {COLUMNS.map((col) => (
          <div key={col.status} className={`rounded-md border border-[#e5e7eb] bg-white border-t-2 ${col.color}`}>
            <div className="px-3 py-2 border-b border-[#e5e7eb]">
              <div className="text-xs font-medium text-[#0f172a]">{col.label}</div>
              <div className="text-xs text-[#64748b]">{tasksByStatus[col.status].length}</div>
            </div>
            <div className="p-2 space-y-2 min-h-[120px]">
              {tasksByStatus[col.status].length === 0 ? (
                <div className="text-xs text-[#94a3b8] text-center py-4">—</div>
              ) : (
                tasksByStatus[col.status].map((task) => (
                  <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onEdit={setEditingTask} onDelete={onDeleteTask} onClick={setSelectedTask} />
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  // ── Render daily recurring ──
  const renderDailyRecurring = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#0f172a]">Daily Recurring Tasks</h3>
          <p className="text-xs text-[#64748b]">Track daily routines. These are separate from weekly tasks.</p>
        </div>
        <button type="button" onClick={() => setShowRecurringForm(true)} className="text-xs px-3 py-1.5 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]">+ Add</button>
      </div>
      {activeRecurring.length === 0 ? (
        <div className="text-xs text-[#94a3b8] py-4 text-center">No daily recurring tasks.</div>
      ) : (
        <div className="space-y-2">
          {activeRecurring.map((rule) => {
            const log = todayLogsByRuleId[rule.id];
            const doneToday = log?.status === 'done';
            const skippedToday = log?.status === 'skipped';
            return (
              <div key={rule.id} className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${doneToday ? 'bg-[#16a34a]' : skippedToday ? 'bg-[#f59e0b]' : 'bg-[#94a3b8]'}`} />
                      <span className="font-medium text-[#0f172a]">{rule.title}</span>
                      {rule.priority && <span className="text-xs">{PRIORITY_ICON[rule.priority]}</span>}
                      {rule.estimatedMinutes != null && <span className="text-xs text-[#64748b]">{formatHours(rule.estimatedMinutes)}</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-[#64748b]">{rule.frequency}{rule.daysOfWeek ? ` (${rule.daysOfWeek})` : ''}</div>
                    {doneToday && <div className="mt-0.5 text-xs text-[#16a34a]">✓ Done today</div>}
                    {skippedToday && <div className="mt-0.5 text-xs text-[#f59e0b]">○ Skipped today</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!doneToday && !skippedToday && (
                      <>
                        <button type="button" onClick={() => handleMarkRecurringDone(rule.id)} className="text-xs px-2 py-1 rounded border border-[#16a34a] text-[#16a34a] hover:bg-[#f0fdf4]">Done</button>
                        <button type="button" onClick={() => handleMarkRecurringSkipped(rule.id)} className="text-xs px-2 py-1 rounded border border-[#f59e0b] text-[#f59e0b] hover:bg-[#fffbeb]">Skip</button>
                      </>
                    )}
                    {doneToday && <button type="button" onClick={() => log && onDeleteRecurringTaskLog(log.id)} className="text-xs px-2 py-1 rounded text-[#64748b] hover:bg-[#f8fafc]">Undo</button>}
                    {skippedToday && <button type="button" onClick={() => log && onDeleteRecurringTaskLog(log.id)} className="text-xs px-2 py-1 rounded text-[#64748b] hover:bg-[#f8fafc]">Undo</button>}
                    <button type="button" onClick={() => setEditingRecurring(rule)} className="text-xs px-2 py-1 rounded text-[#2563eb] hover:bg-[#eff6ff]">Edit</button>
                    <button type="button" onClick={() => onDeleteRecurringTask(rule.id)} className="text-xs px-2 py-1 rounded text-[#dc2626] hover:bg-[#fef2f2]">Del</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {recurringTasks.filter((r) => !r.isActive).length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-[#64748b] mb-2">Inactive</h4>
          <div className="space-y-2">
            {recurringTasks.filter((r) => !r.isActive).map((rule) => (
              <div key={rule.id} className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm opacity-60">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-[#0f172a]">{rule.title}</span>
                  <div className="flex items-center gap-1">
                    <button type="button" onClick={() => setEditingRecurring(rule)} className="text-xs px-2 py-1 rounded text-[#2563eb] hover:bg-[#eff6ff]">Edit</button>
                    <button type="button" onClick={() => onDeleteRecurringTask(rule.id)} className="text-xs px-2 py-1 rounded text-[#dc2626] hover:bg-[#fef2f2]">Del</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  // ── Render backlog ──
  const renderBacklog = () => (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-[#0f172a]">Backlog</h3>
      <p className="text-xs text-[#64748b]">Tasks without a week assignment. Move them to the current week to plan them.</p>
      {backlogTasks.length === 0 ? (
        <div className="text-xs text-[#94a3b8] py-4 text-center">No backlog tasks.</div>
      ) : (
        <div className="space-y-2">
          {backlogTasks.map((task) => (
            <div key={task.id} className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm cursor-pointer" onClick={() => setSelectedTask(task)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_BADGE[task.status]}`}>{task.status}</span>
                    {task.priority && <span className="text-xs">{PRIORITY_ICON[task.priority]}</span>}
                    {task.category && <span className="text-xs px-1.5 py-0.5 rounded bg-[#f8fafc] text-[#64748b] border border-[#e5e7eb]">{task.category}</span>}
                  </div>
                  <div className="mt-1 font-medium text-[#0f172a]">{task.title}</div>
                  {task.description && <div className="mt-0.5 text-xs text-[#64748b]">{task.description}</div>}
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {task.status !== 'done' && (
                    <button type="button" onClick={() => handleMoveToWeek(task.id)} className="text-xs px-2 py-1 rounded border border-[#2563eb] text-[#2563eb] hover:bg-[#eff6ff]">Move to This Week</button>
                  )}
                  <button type="button" onClick={() => setEditingTask(task)} className="text-xs px-2 py-1 rounded text-[#2563eb] hover:bg-[#eff6ff]">Edit</button>
                  <button type="button" onClick={() => onDeleteTask(task.id)} className="text-xs px-2 py-1 rounded text-[#dc2626] hover:bg-[#fef2f2]">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderView = () => {
    switch (view) {
      case 'weekly': return renderWeekly();
      case 'daily': return renderDailyRecurring();
      case 'backlog': return renderBacklog();
      case 'review': return (
        <WeeklyReviewSection
          weekReview={weekReview}
          selectedWeekStart={selectedWeekStart}
          weekStats={weekStats}
          onSave={handleSaveReview}
        />
      );
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold text-[#0f172a]">This Week Tasks</h2>
          <p className="text-xs text-[#64748b]">Plan tasks for the week. Record the day and time spent when you complete them.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`text-xs px-3 py-1.5 rounded-md transition-all ${
                view === v.id
                  ? 'bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]'
                  : 'text-[#475569] hover:bg-[#f8fafc] border border-transparent'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {view === 'weekly' && (
          <button type="button" onClick={() => setShowTaskForm(true)} className="text-xs px-3 py-1.5 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]">+ Add Task</button>
        )}
      </div>

      {renderView()}

      {/* Task Form Modal */}
      {(showTaskForm || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-lg">
            <TaskForm
              initial={editingTask ? { ...editingTask, weekStart: editingTask.weekStart || selectedWeekStart } : undefined}
              projects={projects} plans={plans} strategyGoals={strategyGoals} companies={companies} people={people}
              defaultWeekStart={selectedWeekStart}
              onSubmit={async (input) => {
                if (editingTask) { await onUpdateTask(editingTask.id, input); }
                else { await onAddTask({ ...input, weekStart: selectedWeekStart }); }
                setShowTaskForm(false); setEditingTask(null);
              }}
              onCancel={() => { setShowTaskForm(false); setEditingTask(null); }}
            />
          </div>
        </div>
      )}

      {/* Recurring Task Form Modal */}
      {(showRecurringForm || editingRecurring) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-lg">
            <RecurringTaskForm
              initial={editingRecurring || undefined}
              projects={projects} plans={plans} strategyGoals={strategyGoals} companies={companies} people={people}
              onSubmit={async (input) => {
                if (editingRecurring) { await onUpdateRecurringTask(editingRecurring.id, input); }
                else { await onAddRecurringTask(input); }
                setShowRecurringForm(false); setEditingRecurring(null);
              }}
              onCancel={() => { setShowRecurringForm(false); setEditingRecurring(null); }}
            />
          </div>
        </div>
      )}

      {/* Completion Modal */}
      {completingTask && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-sm rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-lg">
            <h3 className="text-sm font-medium text-[#0f172a] mb-3">Complete Task</h3>
            <p className="text-xs text-[#64748b] mb-4">{completingTask.title}</p>
            <CompletionModalForm task={completingTask} onConfirm={handleComplete} onCancel={() => setCompletingTask(null)} />
          </div>
        </div>
      )}

      {/* Task Detail Workspace */}
      {selectedTask && (
        <TaskDetailWorkspace
          task={selectedTask}
          taskWorkLogs={taskWorkLogs}
          projects={projects}
          plans={plans}
          strategyGoals={strategyGoals}
          companies={companies}
          people={people}
          generatedDocuments={generatedDocuments}
          onUpdateTask={onUpdateTask}
          onDeleteTask={async (id) => { await onDeleteTask(id); setSelectedTask(null); }}
          onAddWorkLog={onAddTaskWorkLog}
          onUpdateWorkLog={onUpdateTaskWorkLog}
          onDeleteWorkLog={onDeleteTaskWorkLog}
          onComplete={handleComplete}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
};

// ── Completion Modal Form (to avoid mutating state while open) ──
const CompletionModalForm: React.FC<{
  task: Task;
  onConfirm: (id: string, date: string, hours: number, notes: string) => void;
  onCancel: () => void;
}> = ({ task, onConfirm, onCancel }) => {
  const [completionDate, setCompletionDate] = useState(task.completedAt?.slice(0, 10) || todayStr());
  const [actualHours, setActualHours] = useState(task.actualMinutes ? String(Math.round(task.actualMinutes / 60)) : '');
  const [notes, setNotes] = useState('');
  const handleConfirm = () => { const hours = parseFloat(actualHours) || 0; onConfirm(task.id, completionDate, hours, notes); };
  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Completion Date</label>
        <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Hours Spent</label>
        <input type="number" min={0} step={0.5} value={actualHours} onChange={(e) => setActualHours(e.target.value)} placeholder="e.g. 2.5" className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
      </div>
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Notes (optional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" placeholder="Completion notes..." />
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc] text-sm">Cancel</button>
        <button type="button" onClick={handleConfirm} className="px-4 py-2 rounded border border-[#16a34a] bg-[#16a34a] text-white hover:bg-[#15803d] text-sm">Mark Done</button>
      </div>
    </div>
  );
};

// ── Weekly Review Section ──
const WeeklyReviewSection: React.FC<{
  weekReview: WeeklyTaskReview | undefined;
  selectedWeekStart: string;
  weekStats: { done: number; total: number; rate: number; estimated: number; actual: number };
  onSave: (input: WeeklyTaskReviewInput) => Promise<void>;
}> = ({ weekReview, selectedWeekStart, weekStats, onSave }) => {
  const [summary, setSummary] = useState(weekReview?.summary || '');
  const [whatWorked, setWhatWorked] = useState(weekReview?.whatWorked || '');
  const [whatFailed, setWhatFailed] = useState(weekReview?.whatFailed || '');
  const [blockers, setBlockers] = useState(weekReview?.blockers || '');
  const [lessons, setLessons] = useState(weekReview?.lessons || '');
  const [nextFocus, setNextFocus] = useState(weekReview?.nextWeekFocus || '');
  const [score, setScore] = useState(weekReview?.score != null ? String(weekReview.score) : '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave({
        weekStart: selectedWeekStart,
        summary: summary || undefined,
        whatWorked: whatWorked || undefined,
        whatFailed: whatFailed || undefined,
        blockers: blockers || undefined,
        lessons: lessons || undefined,
        nextWeekFocus: nextFocus || undefined,
        score: score ? Math.min(10, Math.max(0, parseInt(score) || 0)) : undefined,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium text-[#0f172a]">Weekly Review</h3>
          <p className="text-xs text-[#64748b]">Week of {formatDate(selectedWeekStart)}</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="text-xs px-3 py-1.5 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50"
        >
          {saving ? 'Saving...' : weekReview ? 'Update Review' : 'Save Review'}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-md border border-[#e5e7eb] bg-white p-4 space-y-3">
          <h4 className="text-xs font-medium text-[#0f172a]">Execution</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-[#64748b]">
            <div><span className="font-medium text-[#0f172a]">Done:</span> {weekStats.done}/{weekStats.total}</div>
            <div><span className="font-medium text-[#0f172a]">Rate:</span> {weekStats.rate}%</div>
            <div><span className="font-medium text-[#0f172a]">Est:</span> {formatHours(weekStats.estimated)}</div>
            <div><span className="font-medium text-[#0f172a]">Logged:</span> {formatHours(weekStats.actual)}</div>
          </div>
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Score (0-10)</label>
          <input
            type="number"
            min={0}
            max={10}
            value={score}
            onChange={(e) => setScore(e.target.value)}
            className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Summary</label>
        <textarea value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">What Worked</label>
          <textarea value={whatWorked} onChange={(e) => setWhatWorked(e.target.value)} rows={3} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">What Failed</label>
          <textarea value={whatFailed} onChange={(e) => setWhatFailed(e.target.value)} rows={3} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Blockers</label>
          <textarea value={blockers} onChange={(e) => setBlockers(e.target.value)} rows={3} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#475569] mb-1">Lessons</label>
          <textarea value={lessons} onChange={(e) => setLessons(e.target.value)} rows={3} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium text-[#475569] mb-1">Next Week Focus</label>
        <textarea value={nextFocus} onChange={(e) => setNextFocus(e.target.value)} rows={3} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
      </div>
    </div>
  );
};

export default TasksPanel;
