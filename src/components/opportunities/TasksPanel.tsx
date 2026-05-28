import React, { useMemo, useState, useEffect } from 'react';
import type { Task, TaskInput, TaskStatus, TaskWorkLog, TaskWorkLogInput, WeeklyTaskReview, WeeklyTaskReviewInput, RecurringTask, RecurringTaskInput, RecurringTaskLog, RecurringTaskLogInput, Project, Plan, StrategyGoal, Company, Person } from '../../types/opportunities';
import TaskForm from './TaskForm';
import RecurringTaskForm from './RecurringTaskForm';
import TaskDetailWorkspace from './TaskDetailWorkspace';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { Card } from '../ui/Card';

type TasksView = 'weekly' | 'daily' | 'worklogs' | 'backlog' | 'review';

const VIEWS: { id: TasksView; label: string }[] = [
 { id: 'weekly', label: 'This Week Tasks' },
 { id: 'daily', label: 'Daily Recurring' },
 { id: 'worklogs', label: 'Work Logs' },
 { id: 'backlog', label: 'Backlog' },
 { id: 'review', label: 'Weekly Review' },
];

const STATUS_BADGE_VARIANT: Record<TaskStatus, 'neutral' | 'success' | 'danger'> = {
 todo: 'neutral',
 doing: 'neutral',
 done: 'success',
 blocked: 'danger',
 cancelled: 'neutral',
};

const LINK_BADGE_VARIANT: Record<string, 'neutral'> = {
 project: 'neutral',
 plan: 'neutral',
 strategyGoal: 'neutral',
 company: 'neutral',
 person: 'neutral',
 document: 'neutral',
};

const PRIORITY_BADGE_VARIANT: Record<string, 'danger' | 'warning' | 'neutral'> = {
 high: 'danger',
 medium: 'warning',
 low: 'neutral',
};

const COLUMNS: { status: TaskStatus; label: string }[] = [
 { status: 'todo', label: 'Todo' },
 { status: 'doing', label: 'Doing' },
 { status: 'done', label: 'Done' },
 { status: 'blocked', label: 'Blocked' },
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
 <div className="rounded-lg border border-neutral-200 bg-white p-2.5 text-sm cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => onClick(task)}>
 <div className="flex items-start justify-between gap-2">
 <div className="flex-1 min-w-0 overflow-hidden">
 <div className="flex items-center gap-1.5 flex-wrap">
 <Badge variant={STATUS_BADGE_VARIANT[task.status]}>{task.status}</Badge>
 {task.priority && <Badge variant={PRIORITY_BADGE_VARIANT[task.priority] || 'neutral'}>{task.priority}</Badge>}
 {task.category && <Badge variant="neutral">{task.category}</Badge>}
 </div>
 <div className="mt-1 font-medium text-black truncate">{task.title}</div>
 {task.description && <div className="mt-0.5 text-xs text-neutral-500 line-clamp-1 truncate">{task.description}</div>}
 <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-neutral-500">
 {task.estimatedMinutes != null && <span>Est {formatHours(task.estimatedMinutes)}</span>}
 {task.actualMinutes != null && <span>Act {formatHours(task.actualMinutes)}</span>}
 {task.completedAt && <span>{dayName(task.completedAt.slice(0, 10))}</span>}
 </div>
 {(task.linkedProjectName || task.linkedPlanTitle || task.linkedCompanyName || task.linkedPersonName || task.linkedStrategyGoalTitle || task.linkedDocumentTitle) && (
 <div className="mt-1 flex flex-wrap gap-1">
 {task.linkedProjectName && <Badge variant="neutral">{task.linkedProjectName}</Badge>}
 {task.linkedPlanTitle && <Badge variant="neutral">{task.linkedPlanTitle}</Badge>}
 {task.linkedStrategyGoalTitle && <Badge variant="neutral">{task.linkedStrategyGoalTitle}</Badge>}
 {task.linkedCompanyName && <Badge variant="neutral">{task.linkedCompanyName}</Badge>}
 {task.linkedPersonName && <Badge variant="neutral">{task.linkedPersonName}</Badge>}
 {task.linkedDocumentTitle && <Badge variant="neutral">{task.linkedDocumentTitle}</Badge>}
 </div>
 )}
 </div>
 <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
 <Button type="button" variant="ghost" size="sm" onClick={() => setMenuOpen(!menuOpen)}>•••</Button>
 {menuOpen && (
 <div className="absolute right-0 top-8 z-10 w-36 rounded-lg border border-neutral-200 bg-white">
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
 </div>
 );
};

// ── Stat box ──
const StatBox: React.FC<{ label: string; value: string | number; subtitle?: string }> = ({ label, value, subtitle }) => (
 <div className="rounded-xl border border-neutral-200 bg-white p-3 min-w-0">
 <div className="text-xs text-neutral-500 font-medium truncate">{label}</div>
 <div className="mt-0.5 text-xl font-bold text-black leading-tight">{value}</div>
 {subtitle && <div className="mt-0.5 text-xs text-neutral-400 truncate">{subtitle}</div>}
 </div>
);

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
  section?: TasksView;
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
  section,
  onAddTask, onUpdateTask, onDeleteTask,
  onAddRecurringTask, onUpdateRecurringTask, onDeleteRecurringTask,
  onAddRecurringTaskLog, onUpdateRecurringTaskLog, onDeleteRecurringTaskLog,
  onAddTaskWorkLog, onUpdateTaskWorkLog, onDeleteTaskWorkLog,
  onAddWeeklyTaskReview, onUpdateWeeklyTaskReview, onDeleteWeeklyTaskReview,
}) => {
  const [view, setView] = useState<TasksView>('weekly');

  useEffect(() => {
  if (section) setView(section);
  }, [section]);
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

 const recurringDoneToday = useMemo(
 () => Object.values(todayLogsByRuleId).filter((l) => l.status === 'done').length,
 [todayLogsByRuleId],
 );

 // ── Work logs data ──
 const thisWeekStart = useMemo(() => weekStartStr(), []);
 const thisWeekEnd = useMemo(() => {
 const d = new Date(thisWeekStart + 'T00:00:00');
 d.setDate(d.getDate() + 7);
 return d.toISOString().slice(0, 10);
 }, [thisWeekStart]);

 const workLogsThisWeek = useMemo(
 () => taskWorkLogs.filter((l) => l.workDate >= thisWeekStart && l.workDate < thisWeekEnd),
 [taskWorkLogs, thisWeekStart, thisWeekEnd],
 );

 const workLogMetrics = useMemo(() => {
 const totalMinutes = workLogsThisWeek.reduce((s, l) => s + l.minutesSpent, 0);
 const totalLogs = workLogsThisWeek.length;
 const avgSession = totalLogs > 0 ? Math.round(totalMinutes / totalLogs) : 0;
 const taskMinutes: Record<string, number> = {};
 for (const log of workLogsThisWeek) {
 taskMinutes[log.taskId] = (taskMinutes[log.taskId] || 0) + log.minutesSpent;
 }
 let mostWorkedTaskId = '';
 let mostWorkedMinutes = 0;
 for (const [tid, mins] of Object.entries(taskMinutes)) {
 if (mins > mostWorkedMinutes) {
 mostWorkedMinutes = mins;
 mostWorkedTaskId = tid;
 }
 }
 const mostWorkedTask = mostWorkedTaskId ? tasks.find((t) => t.id === mostWorkedTaskId) : null;
 return { totalMinutes, totalLogs, avgSession, mostWorkedTaskTitle: mostWorkedTask?.title || '' };
 }, [workLogsThisWeek, tasks]);

 const taskMap = useMemo(() => {
 const map: Record<string, Task> = {};
 for (const t of tasks) map[t.id] = t;
 return map;
 }, [tasks]);

 const sortedWorkLogs = useMemo(
 () => [...taskWorkLogs].sort((a, b) => b.workDate.localeCompare(a.workDate)),
 [taskWorkLogs],
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
 {/* Week navigation */}
 <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
 <Button type="button" variant="outline" size="sm" onClick={() => handleWeekNav('prev')}>
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
 Prev
 </Button>
 <div className="text-center min-w-0 px-2">
 <div className="text-sm font-medium text-black">Week of {formatDate(selectedWeekStart)}</div>
 <div className="text-xs text-neutral-500">{formatWeekRange(selectedWeekStart)}</div>
 </div>
 <div className="flex items-center gap-2">
 {selectedWeekStart !== weekStartStr() && (
 <Button type="button" variant="outline" size="sm" onClick={handleThisWeek}>This Week</Button>
 )}
 <Button type="button" variant="outline" size="sm" onClick={() => handleWeekNav('next')}>
 Next
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
 </Button>
 </div>
 </div>

 {/* Metrics */}
 <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
 <StatBox label="Total Tasks" value={weekStats.total} />
 <StatBox label="Todo" value={weekStats.todo} />
 <StatBox label="Doing" value={weekStats.doing} />
 <StatBox label="Done" value={weekStats.done} />
 <StatBox label="Blocked" value={weekStats.blocked} />
 <StatBox label="Estimated" value={formatHours(weekStats.estimated)} />
 <StatBox label="Logged" value={formatHours(weekStats.actual)} />
 <StatBox label="Completion" value={weekStats.rate ? `${weekStats.rate}%` : '—'} subtitle={weekStats.total > 0 ? `${weekStats.done}/${weekStats.total}` : undefined} />
 </div>

 {/* Status columns */}
 <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
 {COLUMNS.map((col) => {
 const tasks = tasksByStatus[col.status];
 return (
 <div key={col.status} className="rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-center justify-between px-3 py-2.5 border-b border-neutral-200">
 <span className="text-xs font-semibold text-black">{col.label}</span>
 <span className="text-xs text-neutral-500">{tasks.length}</span>
 </div>
 <div className="p-2 space-y-2 min-h-[100px]">
 {tasks.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-6 text-xs text-neutral-400">
 <span className="font-medium">No {col.label.toLowerCase()} tasks</span>
 <span className="mt-0.5">Add a task to get started</span>
 </div>
 ) : (
 tasks.map((task) => (
 <TaskCard key={task.id} task={task} onStatusChange={handleStatusChange} onEdit={setEditingTask} onDelete={onDeleteTask} onClick={setSelectedTask} />
 ))
 )}
 </div>
 </div>
 );
 })}
 </div>
 </div>
 );

 // ── Render daily recurring ──
 const renderDailyRecurring = () => (
 <div className="space-y-4">
 {/* Metrics */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 <StatBox label="Active Daily Tasks" value={activeRecurring.length} />
 <StatBox label="Done Today" value={recurringDoneToday} subtitle={today} />
 <StatBox label="Remaining Today" value={Math.max(0, activeRecurring.length - recurringDoneToday)} />
 <StatBox label="Total Recurring" value={recurringTasks.length} subtitle={recurringTasks.length - activeRecurring.length > 0 ? `${recurringTasks.length - activeRecurring.length} inactive` : undefined} />
 </div>

 {/* Add button + header */}
 <div className="flex items-center justify-between">
 <div>
 <h3 className="text-sm font-semibold text-black">Daily Routines</h3>
 <p className="text-xs text-neutral-500">Track daily recurring tasks separately from weekly work.</p>
 </div>
 <Button type="button" variant="primary" size="sm" onClick={() => setShowRecurringForm(true)}>+ Add Routine</Button>
 </div>

 {/* Active recurring tasks */}
 {activeRecurring.length === 0 ? (
 <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white py-8 text-xs text-neutral-400">
 <span className="font-medium text-neutral-500">No daily recurring tasks</span>
 <span className="mt-1">Add a daily routine to track consistency.</span>
 <Button type="button" variant="primary" size="sm" className="mt-3" onClick={() => setShowRecurringForm(true)}>+ Add Routine</Button>
 </div>
 ) : (
 <div className="space-y-2">
 {activeRecurring.map((rule) => {
 const log = todayLogsByRuleId[rule.id];
 const doneToday = log?.status === 'done';
 const skippedToday = log?.status === 'skipped';
 return (
 <div key={rule.id} className="rounded-xl border border-neutral-200 bg-white p-3 text-sm">
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-2">
 <span className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${doneToday ? 'bg-emerald-500' : skippedToday ? 'bg-neutral-300' : 'bg-neutral-400'}`} />
 <span className="font-medium text-black truncate">{rule.title}</span>
 {rule.priority && <Badge variant={PRIORITY_BADGE_VARIANT[rule.priority] || 'neutral'}>{rule.priority}</Badge>}
 {rule.category && <Badge variant="neutral">{rule.category}</Badge>}
 </div>
 <div className="mt-1 flex items-center gap-2 text-xs text-neutral-500">
 <span className="capitalize">{rule.frequency}</span>
 {rule.daysOfWeek && <span>({rule.daysOfWeek})</span>}
 {rule.estimatedMinutes != null && <span>{formatHours(rule.estimatedMinutes)}</span>}
 </div>
 {doneToday && <div className="mt-1 text-xs text-emerald-600 font-medium">✓ Done today</div>}
 {skippedToday && <div className="mt-1 text-xs text-neutral-400">○ Skipped today</div>}
 </div>
 <div className="flex items-center gap-1 shrink-0">
 {!doneToday && !skippedToday && (
 <>
 <Button type="button" variant="primary" size="sm" onClick={() => handleMarkRecurringDone(rule.id)}>Done Today</Button>
 <Button type="button" variant="outline" size="sm" onClick={() => handleMarkRecurringSkipped(rule.id)}>Skip</Button>
 </>
 )}
 {doneToday && <Button type="button" variant="outline" size="sm" onClick={() => log && onDeleteRecurringTaskLog(log.id)}>Undo</Button>}
 {skippedToday && <Button type="button" variant="outline" size="sm" onClick={() => log && onDeleteRecurringTaskLog(log.id)}>Undo</Button>}
 <Button type="button" variant="ghost" size="sm" onClick={() => setEditingRecurring(rule)}>Edit</Button>
 <Button type="button" variant="danger" size="sm" onClick={() => onDeleteRecurringTask(rule.id)}>Del</Button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}

 {/* Inactive */}
 {recurringTasks.filter((r) => !r.isActive).length > 0 && (
 <div>
 <h4 className="text-xs font-medium text-neutral-500 mb-2">Inactive Routines</h4>
 <div className="space-y-2">
 {recurringTasks.filter((r) => !r.isActive).map((rule) => (
 <div key={rule.id} className="rounded-xl border border-neutral-200 bg-white p-3 text-sm opacity-60">
 <div className="flex items-center justify-between gap-2">
 <span className="font-medium text-black truncate">{rule.title}</span>
 <div className="flex items-center gap-1 shrink-0">
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

 // ── Render work logs ──
 const renderWorkLogs = () => (
 <div className="space-y-4">
 {/* Metrics */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 <StatBox label="Total Logged This Week" value={formatHours(workLogMetrics.totalMinutes)} />
 <StatBox label="Number of Logs" value={workLogMetrics.totalLogs} subtitle="this week" />
 <StatBox label="Average Session" value={formatHours(workLogMetrics.avgSession)} />
 <StatBox label="Most Worked" value={workLogMetrics.mostWorkedTaskTitle || '—'} />
 </div>

 {/* All work logs */}
 <div>
 <h3 className="text-sm font-semibold text-black mb-1">Work Logs</h3>
 <p className="text-xs text-neutral-500 mb-3">Time logged across all tasks.</p>
 {sortedWorkLogs.length === 0 ? (
 <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white py-8 text-xs text-neutral-400">
 <span className="font-medium text-neutral-500">No work logs</span>
 <span className="mt-1">Open a task and log time to track your work.</span>
 </div>
 ) : (
 <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-neutral-200 bg-neutral-50">
 <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Date</th>
 <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Task</th>
 <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Time</th>
 <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Summary</th>
 <th className="text-left px-3 py-2 text-xs font-medium text-neutral-500">Notes</th>
 <th className="text-right px-3 py-2 text-xs font-medium text-neutral-500">Actions</th>
 </tr>
 </thead>
 <tbody>
 {sortedWorkLogs.map((log) => {
 const task = taskMap[log.taskId];
 return (
 <tr key={log.id} className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50">
 <td className="px-3 py-2 text-xs text-black whitespace-nowrap">{formatDate(log.workDate)}</td>
 <td className="px-3 py-2 text-xs text-black max-w-[200px] truncate">{task?.title || 'Unknown task'}</td>
 <td className="px-3 py-2 text-xs"><Badge variant="neutral">{formatHours(log.minutesSpent)}</Badge></td>
 <td className="px-3 py-2 text-xs text-neutral-700 max-w-[200px] truncate">{log.summary || '—'}</td>
 <td className="px-3 py-2 text-xs text-neutral-400 max-w-[150px] truncate">{log.notes || '—'}</td>
 <td className="px-3 py-2 text-xs text-right whitespace-nowrap">
 <div className="flex items-center justify-end gap-1">
 {task && <Button variant="ghost" size="sm" onClick={() => setSelectedTask(task)}>View</Button>}
 </div>
 </td>
 </tr>
 );
 })}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );

 // ── Render backlog ──
 const renderBacklog = () => (
 <div className="space-y-3">
 <div>
 <h3 className="text-sm font-semibold text-black">Backlog</h3>
 <p className="text-xs text-neutral-500">Tasks without a week assignment. Move them to the current week to plan them.</p>
 </div>
 {backlogTasks.length === 0 ? (
 <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white py-8 text-xs text-neutral-400">
 <span className="font-medium text-neutral-500">No backlog tasks</span>
 <span className="mt-1">Tasks without a week will appear here.</span>
 </div>
 ) : (
 <div className="space-y-2">
 {backlogTasks.map((task) => (
 <div key={task.id} className="rounded-xl border border-neutral-200 bg-white p-3 text-sm cursor-pointer hover:bg-neutral-50 transition-colors" onClick={() => setSelectedTask(task)}>
 <div className="flex items-start justify-between gap-3">
 <div className="flex-1 min-w-0 overflow-hidden">
 <div className="flex items-center gap-1.5 flex-wrap">
 <Badge variant={STATUS_BADGE_VARIANT[task.status]}>{task.status}</Badge>
 {task.priority && <Badge variant={PRIORITY_BADGE_VARIANT[task.priority] || 'neutral'}>{task.priority}</Badge>}
 {task.category && <Badge variant="neutral">{task.category}</Badge>}
 </div>
 <div className="mt-1 font-medium text-black truncate">{task.title}</div>
 {task.description && <div className="mt-0.5 text-xs text-neutral-500 line-clamp-1 truncate">{task.description}</div>}
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
 case 'worklogs': return renderWorkLogs();
 case 'backlog': return renderBacklog();
 case 'review': return (
 <WeeklyReviewSection
 weekReview={weekReview}
 selectedWeekStart={selectedWeekStart}
 weekStats={weekStats}
 onSave={handleSaveReview}
 onWeekNav={handleWeekNav}
 onThisWeek={handleThisWeek}
 formatDate={formatDate}
 formatWeekRange={formatWeekRange}
 />
 );
 }
 };

  return (
  <div className="space-y-4">
  {renderView()}

 {/* Task Form Modal */}
 {(showTaskForm || editingTask) && (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
 <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6">
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
 <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-xl border border-neutral-200 bg-white p-6">
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
 <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5">
 <h3 className="text-sm font-medium text-black mb-3">Complete Task</h3>
 <p className="text-xs text-neutral-500 mb-4 break-words">{completingTask.title}</p>
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

// ── Completion Modal Form ──
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
 <Button type="button" variant="primary" size="sm" onClick={handleConfirm}>Mark Done</Button>
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
 onWeekNav: (direction: 'prev' | 'next') => void;
 onThisWeek: () => void;
 formatDate: (iso: string) => string;
 formatWeekRange: (startStr: string) => string;
}> = ({ weekReview, selectedWeekStart, weekStats, onSave, onWeekNav, onThisWeek, formatDate, formatWeekRange }) => {
 const [summary, setSummary] = useState(weekReview?.summary || '');
 const [whatWorked, setWhatWorked] = useState(weekReview?.whatWorked || '');
 const [whatFailed, setWhatFailed] = useState(weekReview?.whatFailed || '');
 const [blockers, setBlockers] = useState(weekReview?.blockers || '');
 const [lessons, setLessons] = useState(weekReview?.lessons || '');
 const [nextFocus, setNextFocus] = useState(weekReview?.nextWeekFocus || '');
 const [score, setScore] = useState(weekReview?.score != null ? String(weekReview.score) : '');
 const [saving, setSaving] = useState(false);
 const [editing, setEditing] = useState(!weekReview);

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
 setEditing(false);
 } finally {
 setSaving(false);
 }
 };

 const handleEdit = () => setEditing(true);

 if (!weekReview && !editing) {
 return (
 <div className="space-y-4">
 {/* Week nav */}
 <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
 <Button variant="outline" size="sm" onClick={() => onWeekNav('prev')}>
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
 Prev
 </Button>
 <div className="text-center min-w-0 px-2">
 <div className="text-sm font-medium text-black">Week of {formatDate(selectedWeekStart)}</div>
 <div className="text-xs text-neutral-500">{formatWeekRange(selectedWeekStart)}</div>
 </div>
 <div className="flex items-center gap-2">
 {selectedWeekStart !== weekStartStr() && (
 <Button variant="outline" size="sm" onClick={onThisWeek}>This Week</Button>
 )}
 <Button variant="outline" size="sm" onClick={() => onWeekNav('next')}>
 Next
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
 </Button>
 </div>
 </div>

 {/* Empty state */}
 <div className="flex flex-col items-center justify-center rounded-xl border border-neutral-200 bg-white py-10 text-xs text-neutral-400">
 <span className="font-medium text-neutral-500 text-sm">No weekly review yet</span>
 <span className="mt-2 text-center max-w-sm">Review this week to understand what worked, what failed, and what to focus on next.</span>
 <Button type="button" variant="primary" size="sm" className="mt-4" onClick={() => setEditing(true)}>Create Weekly Review</Button>
 </div>

 {/* Execution stats */}
 <Card className="p-4">
 <h4 className="text-xs font-semibold text-black mb-2">This Week</h4>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-neutral-500">
 <div><span className="font-medium text-black">Done:</span> {weekStats.done}/{weekStats.total}</div>
 <div><span className="font-medium text-black">Rate:</span> {weekStats.rate}%</div>
 <div><span className="font-medium text-black">Est:</span> {formatHours(weekStats.estimated)}</div>
 <div><span className="font-medium text-black">Logged:</span> {formatHours(weekStats.actual)}</div>
 </div>
 </Card>
 </div>
 );
 }

 return (
 <div className="space-y-4">
 {/* Week nav + status */}
 <div className="flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-4 py-3">
 <Button variant="outline" size="sm" onClick={() => onWeekNav('prev')}>
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6"/></svg>
 Prev
 </Button>
 <div className="text-center min-w-0 px-2">
 <div className="text-sm font-medium text-black">Week of {formatDate(selectedWeekStart)}</div>
 <div className="text-xs text-neutral-500">{weekReview ? 'Review saved' : 'Draft'}</div>
 </div>
 <div className="flex items-center gap-2">
 {selectedWeekStart !== weekStartStr() && (
 <Button variant="outline" size="sm" onClick={onThisWeek}>This Week</Button>
 )}
 <Button variant="outline" size="sm" onClick={() => onWeekNav('next')}>
 Next
 <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m9 18 6-6-6-6"/></svg>
 </Button>
 </div>
 </div>

 {/* Execution stats */}
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
 <StatBox label="Done" value={`${weekStats.done}/${weekStats.total}`} subtitle={`${weekStats.rate}% rate`} />
 <StatBox label="Estimated" value={formatHours(weekStats.estimated)} />
 <StatBox label="Logged" value={formatHours(weekStats.actual)} />
 <StatBox label="Score" value={score || '—'} subtitle={score ? '/10' : undefined} />
 </div>

 {!editing ? (
 /* Read-only review */
 <div className="space-y-3">
 {weekReview?.summary && (
 <Card className="p-4">
 <h4 className="text-xs font-semibold text-black mb-2">Summary</h4>
 <p className="text-sm text-black whitespace-pre-wrap">{weekReview.summary}</p>
 </Card>
 )}
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {weekReview?.whatWorked && (
 <Card className="p-4">
 <h4 className="text-xs font-semibold text-black mb-2">What Worked</h4>
 <p className="text-sm text-black whitespace-pre-wrap">{weekReview.whatWorked}</p>
 </Card>
 )}
 {weekReview?.whatFailed && (
 <Card className="p-4">
 <h4 className="text-xs font-semibold text-black mb-2">What Failed</h4>
 <p className="text-sm text-black whitespace-pre-wrap">{weekReview.whatFailed}</p>
 </Card>
 )}
 </div>
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {weekReview?.blockers && (
 <Card className="p-4">
 <h4 className="text-xs font-semibold text-black mb-2">Blockers</h4>
 <p className="text-sm text-black whitespace-pre-wrap">{weekReview.blockers}</p>
 </Card>
 )}
 {weekReview?.lessons && (
 <Card className="p-4">
 <h4 className="text-xs font-semibold text-black mb-2">Lessons</h4>
 <p className="text-sm text-black whitespace-pre-wrap">{weekReview.lessons}</p>
 </Card>
 )}
 </div>
 {weekReview?.nextWeekFocus && (
 <Card className="p-4">
 <h4 className="text-xs font-semibold text-black mb-2">Next Week Focus</h4>
 <p className="text-sm text-black whitespace-pre-wrap">{weekReview.nextWeekFocus}</p>
 </Card>
 )}
 <div className="flex justify-end">
 <Button type="button" variant="primary" size="sm" onClick={handleEdit}>Edit Review</Button>
 </div>
 </div>
 ) : (
 /* Edit/create form */
 <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
 <h4 className="text-sm font-semibold text-black">{weekReview ? 'Edit Review' : 'New Weekly Review'}</h4>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Input label="Score (0-10)" type="number" min={0} max={10} value={score} onChange={(e) => setScore(e.target.value)} />
 </div>

 <Textarea label="Summary" value={summary} onChange={(e) => setSummary(e.target.value)} rows={3} placeholder="How did the week go overall?" />

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Textarea label="What Worked" value={whatWorked} onChange={(e) => setWhatWorked(e.target.value)} rows={3} placeholder="What went well this week?" />
 <Textarea label="What Failed" value={whatFailed} onChange={(e) => setWhatFailed(e.target.value)} rows={3} placeholder="What didn't go well?" />
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
 <Textarea label="Blockers" value={blockers} onChange={(e) => setBlockers(e.target.value)} rows={3} placeholder="What blocked your progress?" />
 <Textarea label="Lessons" value={lessons} onChange={(e) => setLessons(e.target.value)} rows={3} placeholder="What did you learn?" />
 </div>

 <Textarea label="Next Week Focus" value={nextFocus} onChange={(e) => setNextFocus(e.target.value)} rows={3} placeholder="What are your priorities for next week?" />

 <div className="flex items-center justify-end gap-2 pt-2">
 <Button type="button" variant="secondary" size="sm" onClick={() => { if (weekReview) setEditing(false); else { setSummary(''); setWhatWorked(''); setWhatFailed(''); setBlockers(''); setLessons(''); setNextFocus(''); setScore(''); setEditing(false); } }}>Cancel</Button>
 <Button type="button" variant="primary" size="sm" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : weekReview ? 'Update Review' : 'Save Review'}</Button>
 </div>
 </div>
 )}
 </div>
 );
};

export default TasksPanel;
