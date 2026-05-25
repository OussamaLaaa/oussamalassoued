import React, { useMemo, useState } from 'react';
import type { Task, TaskInput, TaskStatus, TaskWorkLog, TaskWorkLogInput, WeeklyTaskReview, WeeklyTaskReviewInput, RecurringTask, RecurringTaskInput, RecurringTaskLog, RecurringTaskLogInput, Project, Plan, StrategyGoal, Company, Person } from '../../types/opportunities';
import TaskForm from './TaskForm';
import RecurringTaskForm from './RecurringTaskForm';
import TaskDetailWorkspace from './TaskDetailWorkspace';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { Card } from '../ui/Card';

type TasksView = 'weekly' | 'daily' | 'backlog' | 'review';

const VIEWS: { id: TasksView; label: string }[] = [
  { id: 'weekly', label: 'This Week Tasks' },
  { id: 'daily', label: 'Daily Recurring' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'review', label: 'Weekly Review' },
];

const STATUS_BADGE_VARIANT: Record<TaskStatus, 'neutral' | 'blue' | 'success' | 'danger'> = {
  todo: 'neutral',
  doing: 'blue',
  done: 'success',
  blocked: 'danger',
  cancelled: 'neutral',
};

const LINK_BADGE_VARIANT: Record<string, 'success' | 'warning' | 'purple' | 'blue' | 'neutral'> = {
  project: 'success',
  plan: 'warning',
  strategyGoal: 'purple',
  company: 'blue',
  person: 'purple',
  document: 'neutral',
};

const PRIORITY_ICON: Record<string, string> = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
};

const COLUMNS: { status: TaskStatus; label: string; color: string }[] = [
  { status: 'todo', label: 'Todo', color: 'border-t-neutral-400' },
  { status: 'doing', label: 'Doing', color: 'border-t-blue-600' },
  { status: 'done', label: 'Done', color: 'border-t-green-600' },
  { status: 'blocked', label: 'Blocked', color: 'border-t-red-600' },
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
    <Card className="p-3 text-sm hover:shadow-sm transition-shadow relative cursor-pointer" onClick={() => onClick(task)}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant={STATUS_BADGE_VARIANT[task.status]}>{task.status}</Badge>
            {task.priority && <span className="text-xs">{PRIORITY_ICON[task.priority]}</span>}
            {task.category && <Badge variant="neutral">{task.category}</Badge>}
          </div>
          <div className="mt-1 font-medium text-black">{task.title}</div>
          {task.description && <div className="mt-0.5 text-xs text-neutral-500 line-clamp-2">{task.description}</div>}
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-neutral-500">
            {task.estimatedMinutes != null && <span>Est: {formatHours(task.estimatedMinutes)}</span>}
            {task.actualMinutes != null && <span>Actual: {formatHours(task.actualMinutes)}</span>}
            {task.completedAt && <span>Completed: {dayName(task.completedAt.slice(0, 10))}</span>}
          </div>
          {(task.linkedProjectName || task.linkedPlanTitle || task.linkedCompanyName || task.linkedPersonName || task.linkedStrategyGoalTitle || task.linkedDocumentTitle) && (
            <div className="mt-1 flex flex-wrap gap-1">
              {task.linkedProjectName && <Badge variant={LINK_BADGE_VARIANT.project}>📁 {task.linkedProjectName}</Badge>}
              {task.linkedPlanTitle && <Badge variant={LINK_BADGE_VARIANT.plan}>📋 {task.linkedPlanTitle}</Badge>}
              {task.linkedStrategyGoalTitle && <Badge variant={LINK_BADGE_VARIANT.strategyGoal}>🎯 {task.linkedStrategyGoalTitle}</Badge>}
              {task.linkedCompanyName && <Badge variant={LINK_BADGE_VARIANT.company}>🏢 {task.linkedCompanyName}</Badge>}
              {task.linkedPersonName && <Badge variant={LINK_BADGE_VARIANT.person}>👤 {task.linkedPersonName}</Badge>}
              {task.linkedDocumentTitle && <Badge variant={LINK_BADGE_VARIANT.document}>📄 {task.linkedDocumentTitle}</Badge>}
            </div>
          )}
        </div>
        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <Button type="button" variant="ghost" size="sm" onClick={() => setMenuOpen(!menuOpen)}>•••</Button>
          {menuOpen && (
            <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-neutral-200 bg-white shadow-lg">
              {actions.map((a) => (
                <Button
                  key={a.to}
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => { setMenuOpen(false); onStatusChange(task.id, a.to); }}
                  className="block w-full text-left"
                >
                  {a.label}
                </Button>
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => { setMenuOpen(false); onEdit(task); }}
                className="block w-full text-left"
              >
                Edit
              </Button>
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => { setMenuOpen(false); onDelete(task.id); }}
                className="block w-full text-left"
              >
                Delete
              </Button>
            </div>
          )}
        </div>
      </div>
    </Card>
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
      <div className="flex items-center justify-between rounded-lg border border-neutral-200 bg-white p-3">
        <Button type="button" variant="outline" size="sm" onClick={() => handleWeekNav('prev')}>&lt; Prev</Button>
        <div className="text-center">
          <div className="text-sm font-medium text-black">Week of {formatDate(selectedWeekStart)}</div>
          <div className="text-xs text-neutral-500">{formatWeekRange(selectedWeekStart)}</div>
        </div>
        <div className="flex items-center gap-2">
          {selectedWeekStart !== weekStartStr() && (
            <Button type="button" variant="outline" size="sm" onClick={handleThisWeek}>This Week</Button>
          )}
          <Button type="button" variant="outline" size="sm" onClick={() => handleWeekNav('next')}>Next &gt;</Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-8 gap-2">
        <div className="rounded-lg border border-neutral-200 bg-white p-2 text-center"><div className="text-xs text-neutral-500">Total</div><div className="text-lg font-bold text-black">{weekStats.total}</div></div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2 text-center"><div className="text-xs text-neutral-500">Todo</div><div className="text-lg font-bold text-neutral-600">{weekStats.todo}</div></div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2 text-center"><div className="text-xs text-neutral-500">Doing</div><div className="text-lg font-bold text-blue-600">{weekStats.doing}</div></div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2 text-center"><div className="text-xs text-neutral-500">Done</div><div className="text-lg font-bold text-green-600">{weekStats.done}</div></div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2 text-center"><div className="text-xs text-neutral-500">Blocked</div><div className="text-lg font-bold text-red-600">{weekStats.blocked}</div></div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2 text-center"><div className="text-xs text-neutral-500">Est</div><div className="text-lg font-bold text-black">{formatHours(weekStats.estimated)}</div></div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2 text-center"><div className="text-xs text-neutral-500">Logged</div><div className="text-lg font-bold text-black">{formatHours(weekStats.actual)}</div></div>
        <div className="rounded-lg border border-neutral-200 bg-white p-2 text-center"><div className="text-xs text-neutral-500">Rate</div><div className="text-lg font-bold text-black">{weekStats.rate}%</div></div>
      </div>

      {/* Status columns */}
      <div className="grid grid-cols-4 gap-3">
        {COLUMNS.map((col) => (
          <div key={col.status} className={`rounded-lg border border-neutral-200 bg-white border-t-2 ${col.color}`}>
            <div className="px-3 py-2 border-b border-neutral-200">
              <div className="text-xs font-medium text-black">{col.label}</div>
              <div className="text-xs text-neutral-500">{tasksByStatus[col.status].length}</div>
            </div>
            <div className="p-2 space-y-2 min-h-[120px]">
              {tasksByStatus[col.status].length === 0 ? (
                <div className="text-xs text-neutral-400 text-center py-4">—</div>
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
          <h3 className="text-sm font-medium text-black">Daily Recurring Tasks</h3>
          <p className="text-xs text-neutral-500">Track daily routines. These are separate from weekly tasks.</p>
        </div>
        <Button type="button" variant="primary" size="sm" onClick={() => setShowRecurringForm(true)}>+ Add</Button>
      </div>
      {activeRecurring.length === 0 ? (
        <div className="text-xs text-neutral-400 py-4 text-center">No daily recurring tasks.</div>
      ) : (
        <div className="space-y-2">
          {activeRecurring.map((rule) => {
            const log = todayLogsByRuleId[rule.id];
            const doneToday = log?.status === 'done';
            const skippedToday = log?.status === 'skipped';
            return (
              <div key={rule.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2 h-2 rounded-full ${doneToday ? 'bg-green-600' : skippedToday ? 'bg-amber-500' : 'bg-neutral-400'}`} />
                      <span className="font-medium text-black">{rule.title}</span>
                      {rule.priority && <span className="text-xs">{PRIORITY_ICON[rule.priority]}</span>}
                      {rule.estimatedMinutes != null && <span className="text-xs text-neutral-500">{formatHours(rule.estimatedMinutes)}</span>}
                    </div>
                    <div className="mt-0.5 text-xs text-neutral-500">{rule.frequency}{rule.daysOfWeek ? ` (${rule.daysOfWeek})` : ''}</div>
                    {doneToday && <div className="mt-0.5 text-xs text-green-600">✓ Done today</div>}
                    {skippedToday && <div className="mt-0.5 text-xs text-amber-500">○ Skipped today</div>}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {!doneToday && !skippedToday && (
                      <>
                        <Button type="button" variant="success" size="sm" onClick={() => handleMarkRecurringDone(rule.id)}>Done</Button>
                        <button type="button" onClick={() => handleMarkRecurringSkipped(rule.id)} className="text-xs px-2 py-1 rounded-lg border border-amber-500 text-amber-500 hover:bg-amber-50">Skip</button>
                      </>
                    )}
                    {doneToday && <Button type="button" variant="ghost" size="sm" onClick={() => log && onDeleteRecurringTaskLog(log.id)}>Undo</Button>}
                    {skippedToday && <Button type="button" variant="ghost" size="sm" onClick={() => log && onDeleteRecurringTaskLog(log.id)}>Undo</Button>}
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingRecurring(rule)}>Edit</Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => onDeleteRecurringTask(rule.id)}>Del</Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      {recurringTasks.filter((r) => !r.isActive).length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-neutral-500 mb-2">Inactive</h4>
          <div className="space-y-2">
            {recurringTasks.filter((r) => !r.isActive).map((rule) => (
              <div key={rule.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm opacity-60">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-black">{rule.title}</span>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => setEditingRecurring(rule)}>Edit</Button>
                    <Button type="button" variant="danger" size="sm" onClick={() => onDeleteRecurringTask(rule.id)}>Del</Button>
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
      <h3 className="text-sm font-medium text-black">Backlog</h3>
      <p className="text-xs text-neutral-500">Tasks without a week assignment. Move them to the current week to plan them.</p>
      {backlogTasks.length === 0 ? (
        <div className="text-xs text-neutral-400 py-4 text-center">No backlog tasks.</div>
      ) : (
        <div className="space-y-2">
          {backlogTasks.map((task) => (
            <div key={task.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm cursor-pointer" onClick={() => setSelectedTask(task)}>
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant={STATUS_BADGE_VARIANT[task.status]}>{task.status}</Badge>
                    {task.priority && <span className="text-xs">{PRIORITY_ICON[task.priority]}</span>}
                    {task.category && <Badge variant="neutral">{task.category}</Badge>}
                  </div>
                  <div className="mt-1 font-medium text-black">{task.title}</div>
                  {task.description && <div className="mt-0.5 text-xs text-neutral-500">{task.description}</div>}
                </div>
                <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                  {task.status !== 'done' && (
                    <Button type="button" variant="outline" size="sm" onClick={() => handleMoveToWeek(task.id)}>Move to This Week</Button>
                  )}
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingTask(task)}>Edit</Button>
                  <Button type="button" variant="danger" size="sm" onClick={() => onDeleteTask(task.id)}>Del</Button>
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
          <h2 className="text-base font-semibold text-black">This Week Tasks</h2>
          <p className="text-xs text-neutral-500">Plan tasks for the week. Record the day and time spent when you complete them.</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          {VIEWS.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => setView(v.id)}
              className={`text-xs px-3 py-1.5 rounded-lg transition-all ${
                view === v.id
                  ? 'bg-neutral-100 text-neutral-900 border border-neutral-200'
                  : 'text-neutral-500 hover:bg-neutral-50 border border-transparent'
              }`}
            >
              {v.label}
            </button>
          ))}
        </div>
        {view === 'weekly' && (
          <Button type="button" variant="primary" size="sm" onClick={() => setShowTaskForm(true)}>+ Add Task</Button>
        )}
      </div>

      {renderView()}

      {/* Task Form Modal */}
      {(showTaskForm || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-lg">
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
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6 shadow-lg">
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
          <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-lg">
            <h3 className="text-sm font-medium text-black mb-3">Complete Task</h3>
            <p className="text-xs text-neutral-500 mb-4">{completingTask.title}</p>
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
      <Input label="Completion Date" type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
      <Input label="Hours Spent" type="number" min={0} step={0.5} value={actualHours} onChange={(e) => setActualHours(e.target.value)} placeholder="e.g. 2.5" />
      <Textarea label="Notes (optional)" value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Completion notes..." />
      <div className="flex items-center justify-end gap-2 pt-2">
        <Button type="button" variant="secondary" size="sm" onClick={onCancel}>Cancel</Button>
        <Button type="button" variant="success" size="sm" onClick={handleConfirm}>Mark Done</Button>
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
          <h3 className="text-sm font-medium text-black">Weekly Review</h3>
          <p className="text-xs text-neutral-500">Week of {formatDate(selectedWeekStart)}</p>
        </div>
        <Button
          type="button"
          variant="primary"
          size="sm"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? 'Saving...' : weekReview ? 'Update Review' : 'Save Review'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4 space-y-3">
          <h4 className="text-xs font-medium text-black">Execution</h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
            <div><span className="font-medium text-black">Done:</span> {weekStats.done}/{weekStats.total}</div>
            <div><span className="font-medium text-black">Rate:</span> {weekStats.rate}%</div>
            <div><span className="font-medium text-black">Est:</span> {formatHours(weekStats.estimated)}</div>
            <div><span className="font-medium text-black">Logged:</span> {formatHours(weekStats.actual)}</div>
          </div>
        </Card>
        <Input label="Score (0-10)" type="number" min={0} max={10} value={score} onChange={(e) => setScore(e.target.value)} />
      </div>

      <Textarea label="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} />
      <div className="grid grid-cols-2 gap-4">
        <Textarea label="What Worked" value={whatWorked} onChange={(e) => setWhatWorked(e.target.value)} rows={3} />
        <Textarea label="What Failed" value={whatFailed} onChange={(e) => setWhatFailed(e.target.value)} rows={3} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Textarea label="Blockers" value={blockers} onChange={(e) => setBlockers(e.target.value)} rows={3} />
        <Textarea label="Lessons" value={lessons} onChange={(e) => setLessons(e.target.value)} rows={3} />
      </div>
      <Textarea label="Next Week Focus" value={nextFocus} onChange={(e) => setNextFocus(e.target.value)} rows={3} />
    </div>
  );
};

export default TasksPanel;
