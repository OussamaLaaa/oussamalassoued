import React, { useMemo, useState } from 'react';
import type { Task, TaskInput, TaskStatus, RecurringTask, RecurringTaskInput, Project, Plan, StrategyGoal, Company, Person } from '../../types/opportunities';
import TaskForm from './TaskForm';
import RecurringTaskForm from './RecurringTaskForm';

type TasksView = 'today' | 'week' | 'board' | 'recurring' | 'backlog' | 'review';

const VIEWS: { id: TasksView; label: string }[] = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This Week' },
  { id: 'board', label: 'Board' },
  { id: 'recurring', label: 'Recurring' },
  { id: 'backlog', label: 'Backlog' },
  { id: 'review', label: 'Review' },
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

// ── Date helpers ──
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

const getWeekDates = (start: Date): string[] => {
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    dates.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
  }
  return dates;
};

const formatDate = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
};

const dayName = (iso: string): string => {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
};

// ── Task card ──
const TaskCard: React.FC<{
  task: Task;
  onToggleStatus: (id: string, status: TaskStatus) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}> = ({ task, onToggleStatus, onEdit, onDelete }) => {
  const nextStatus: Record<TaskStatus, TaskStatus | null> = {
    todo: 'doing',
    doing: 'done',
    done: 'todo',
    blocked: 'todo',
    cancelled: 'todo',
  };

  return (
    <div className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm hover:shadow-sm transition-shadow">
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                const next = nextStatus[task.status];
                if (next) onToggleStatus(task.id, next);
              }}
              className="text-xs cursor-pointer shrink-0"
              title={`Toggle to ${nextStatus[task.status] || ''}`}
            >
              {task.status === 'done' ? '✅' : task.status === 'doing' ? '🔄' : task.status === 'blocked' ? '🚫' : task.status === 'cancelled' ? '❌' : '⬜'}
            </button>
            <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_BADGE[task.status]}`}>{task.status}</span>
            {task.priority && <span className="text-xs">{PRIORITY_ICON[task.priority]}</span>}
            {task.category && <span className="text-xs px-1.5 py-0.5 rounded bg-[#f8fafc] text-[#64748b] border border-[#e5e7eb]">{task.category}</span>}
            {task.estimatedMinutes != null && (
              <span className="text-xs text-[#64748b]">{task.estimatedMinutes}m</span>
            )}
          </div>
          <div className="mt-1 font-medium text-[#0f172a]">{task.title}</div>
          {task.description && <div className="mt-0.5 text-xs text-[#64748b] line-clamp-2">{task.description}</div>}
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
          {task.notes && <div className="mt-1 text-xs text-[#94a3b8] italic line-clamp-1">{task.notes}</div>}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button type="button" onClick={() => onEdit(task)} className="text-xs px-2 py-1 rounded text-[#2563eb] hover:bg-[#eff6ff]">Edit</button>
          <button type="button" onClick={() => onDelete(task.id)} className="text-xs px-2 py-1 rounded text-[#dc2626] hover:bg-[#fef2f2]">Del</button>
        </div>
      </div>
    </div>
  );
};

// ── Main Panel ──
const TasksPanel: React.FC<{
  tasks: Task[];
  recurringTasks: RecurringTask[];
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
}> = ({
  tasks, recurringTasks, projects, plans, strategyGoals, companies, people, generatedDocuments,
  onAddTask, onUpdateTask, onDeleteTask,
  onAddRecurringTask, onUpdateRecurringTask, onDeleteRecurringTask,
}) => {
  const [view, setView] = useState<TasksView>('today');
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringTask | null>(null);
  const [generatingWeek, setGeneratingWeek] = useState(false);

  const today = todayStr();
  const weekStart = getWeekStart();
  const weekDates = getWeekDates(weekStart);

  // ── Derived data ──
  const tasksDueToday = useMemo(
    () => tasks.filter((t) => t.taskDate === today && t.status !== 'done' && t.status !== 'cancelled'),
    [tasks, today],
  );
  const overdue = useMemo(
    () => tasks.filter((t) => t.taskDate && t.taskDate < today && t.status !== 'done' && t.status !== 'cancelled').sort((a, b) => (a.taskDate || '').localeCompare(b.taskDate || '')),
    [tasks, today],
  );
  const noDate = useMemo(
    () => tasks.filter((t) => !t.taskDate && t.status !== 'done' && t.status !== 'cancelled'),
    [tasks],
  );
  const doneToday = useMemo(
    () => tasks.filter((t) => t.completedAt?.startsWith(today)),
    [tasks, today],
  );
  const thisWeekTasks = useMemo(
    () => tasks.filter((t) => {
      if (!t.taskDate || t.status === 'cancelled') return false;
      return weekDates.includes(t.taskDate) || (t.taskDate >= weekDates[0] && t.taskDate <= weekDates[6]);
    }),
    [tasks, weekDates],
  );
  const backlogTasks = useMemo(
    () => tasks.filter((t) => !t.taskDate && t.status !== 'done' && t.status !== 'cancelled'),
    [tasks],
  );
  const reviewTasks = useMemo(
    () => tasks.filter((t) => t.status === 'done' || t.status === 'cancelled').sort((a, b) => ((b.completedAt || b.createdAt || '') > (a.completedAt || a.createdAt || '') ? 1 : -1)),
    [tasks],
  );

  const stats = useMemo(() => ({
    total: tasks.length,
    doneToday: doneToday.length,
    overdue: overdue.length,
    totalEstimated: tasks.reduce((s, t) => s + (t.estimatedMinutes || 0), 0),
    doing: tasks.filter((t) => t.status === 'doing').length,
    blocked: tasks.filter((t) => t.status === 'blocked').length,
  }), [tasks, doneToday, overdue]);

  // ── Handlers ──
  const handleToggleStatus = async (id: string, status: TaskStatus) => {
    const payload: Partial<TaskInput> = { status };
    if (status === 'done') payload.completedAt = new Date().toISOString();
    else if (status !== 'done') payload.completedAt = undefined;
    await onUpdateTask(id, payload);
  };

  const handleGenerateWeek = async () => {
    setGeneratingWeek(true);
    try {
      const active = recurringTasks.filter((r) => r.isActive);
      const existingKeys = new Set(tasks.filter((t) => t.recurringRuleId).map((t) => `${t.recurringRuleId}|${t.taskDate}`));

      for (const rule of active) {
        const days = rule.daysOfWeek ? rule.daysOfWeek.split(',').map((d) => d.trim().toLowerCase()) : [];
        for (const dateStr of weekDates) {
          if (days.length > 0) {
            const d = new Date(dateStr + 'T00:00:00');
            const dayNameLower = d.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
            if (!days.includes(dayNameLower)) continue;
          }

          const key = `${rule.id}|${dateStr}`;
          if (existingKeys.has(key)) continue;

          await onAddTask({
            title: rule.title,
            description: rule.description,
            priority: rule.priority,
            category: rule.category,
            taskDate: dateStr,
            estimatedMinutes: rule.estimatedMinutes,
            linkedProjectId: rule.linkedProjectId,
            linkedPlanId: rule.linkedPlanId,
            linkedStrategyGoalId: rule.linkedStrategyGoalId,
            linkedCompanyId: rule.linkedCompanyId,
            linkedPersonId: rule.linkedPersonId,
            notes: rule.notes,
            isRecurringInstance: true,
            recurringRuleId: rule.id,
          });
        }
      }
    } finally {
      setGeneratingWeek(false);
    }
  };

  // ── Render sections ──
  const renderTaskList = (items: Task[], emptyMsg: string) => {
    if (items.length === 0) return <div className="text-xs text-[#94a3b8] py-4 text-center">{emptyMsg}</div>;
    return (
      <div className="space-y-2">
        {items.map((task) => (
          <TaskCard key={task.id} task={task} onToggleStatus={handleToggleStatus} onEdit={setEditingTask} onDelete={onDeleteTask} />
        ))}
      </div>
    );
  };

  const renderToday = () => (
    <div className="space-y-4">
      {overdue.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-[#dc2626] mb-2">Overdue ({overdue.length})</h4>
          {renderTaskList(overdue, '')}
        </div>
      )}
      <div>
        <h4 className="text-xs font-medium text-[#0f172a] mb-2">Today ({tasksDueToday.length})</h4>
        {renderTaskList(tasksDueToday, 'No tasks for today.')}
      </div>
      <div>
        <h4 className="text-xs font-medium text-[#64748b] mb-2">No Date ({noDate.length})</h4>
        {renderTaskList(noDate, 'All tasks have dates.')}
      </div>
    </div>
  );

  const renderWeek = () => {
    const grouped = weekDates.map((dateStr) => ({
      dateStr,
      label: formatDate(dateStr),
      tasks: thisWeekTasks.filter((t) => t.taskDate === dateStr),
    }));

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs text-[#64748b]">{formatDate(weekDates[0])} – {formatDate(weekDates[6])}</span>
        </div>
        {grouped.map(({ dateStr, label, tasks: dayTasks }) => (
          <div key={dateStr}>
            <h4 className="text-xs font-medium text-[#0f172a] mb-1 flex items-center gap-2">
              {label}
              {dateStr === today && <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#2563eb] text-white">Today</span>}
              <span className="text-[10px] text-[#64748b] font-normal">{dayTasks.length}</span>
            </h4>
            {renderTaskList(dayTasks, 'No tasks.')}
          </div>
        ))}
      </div>
    );
  };

  const renderBoard = () => {
    const columns = weekDates.map((dateStr) => ({
      dateStr,
      label: dayName(dateStr).slice(0, 3),
      tasks: thisWeekTasks.filter((t) => t.taskDate === dateStr),
    }));

    return (
      <div className="grid grid-cols-7 gap-2">
        {columns.map(({ dateStr, label, tasks: colTasks }) => (
          <div key={dateStr} className={`rounded-md border ${dateStr === today ? 'border-[#2563eb]' : 'border-[#e5e7eb]'} bg-white p-2`}>
            <div className={`text-xs font-medium text-center pb-2 border-b border-[#e5e7eb] ${dateStr === today ? 'text-[#2563eb]' : 'text-[#0f172a]'}`}>
              {label}<br />
              <span className="text-[10px] text-[#64748b]">{dateStr.slice(8)}</span>
            </div>
            <div className="mt-2 space-y-1">
              {colTasks.length === 0 ? (
                <div className="text-[10px] text-[#94a3b8] text-center py-2">—</div>
              ) : (
                colTasks.map((task) => (
                  <div key={task.id} className="text-[10px] px-1.5 py-1 rounded bg-[#f8fafc] border border-[#e5e7eb]">
                    <div className="flex items-center gap-1">
                      <button type="button" onClick={() => handleToggleStatus(task.id, task.status === 'done' ? 'todo' : 'done')} className="cursor-pointer">
                        {task.status === 'done' ? '✅' : '⬜'}
                      </button>
                      <span className="truncate flex-1">{task.title}</span>
                    </div>
                    {task.priority && <span className="text-[10px]">{PRIORITY_ICON[task.priority]}</span>}
                  </div>
                ))
              )}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderRecurring = () => (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h4 className="text-xs font-medium text-[#0f172a]">Recurring Task Rules ({recurringTasks.length})</h4>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleGenerateWeek}
            disabled={generatingWeek}
            className="text-xs px-3 py-1.5 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50"
          >
            {generatingWeek ? 'Generating...' : 'Generate This Week'}
          </button>
          <button
            type="button"
            onClick={() => setShowRecurringForm(true)}
            className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
          >
            + Add Rule
          </button>
        </div>
      </div>
      {recurringTasks.length === 0 ? (
        <div className="text-xs text-[#94a3b8] py-4 text-center">No recurring task rules yet.</div>
      ) : (
        <div className="space-y-2">
          {recurringTasks.map((rule) => (
            <div key={rule.id} className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block w-2 h-2 rounded-full ${rule.isActive ? 'bg-[#16a34a]' : 'bg-[#94a3b8]'}`} />
                    <span className="font-medium text-[#0f172a]">{rule.title}</span>
                    <span className="text-xs text-[#64748b]">{rule.frequency}</span>
                    {rule.daysOfWeek && <span className="text-xs text-[#64748b]">({rule.daysOfWeek})</span>}
                    {rule.priority && <span className="text-xs">{PRIORITY_ICON[rule.priority]}</span>}
                    {rule.estimatedMinutes != null && <span className="text-xs text-[#64748b]">{rule.estimatedMinutes}m</span>}
                  </div>
                  {rule.description && <div className="mt-0.5 text-xs text-[#64748b]">{rule.description}</div>}
                  {rule.startDate && <div className="mt-0.5 text-xs text-[#94a3b8]">From: {rule.startDate}{rule.endDate ? ` to ${rule.endDate}` : ''}</div>}
                  {(rule.linkedProjectName || rule.linkedCompanyName || rule.linkedPersonName) && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {rule.linkedProjectName && <span className="text-xs px-1.5 py-0.5 rounded bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]">📁 {rule.linkedProjectName}</span>}
                      {rule.linkedCompanyName && <span className="text-xs px-1.5 py-0.5 rounded bg-[#e0f2fe] text-[#0284c7] border border-[#bae6fd]">🏢 {rule.linkedCompanyName}</span>}
                      {rule.linkedPersonName && <span className="text-xs px-1.5 py-0.5 rounded bg-[#fce7f3] text-[#db2777] border border-[#fbcfe8]">👤 {rule.linkedPersonName}</span>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button type="button" onClick={() => setEditingRecurring(rule)} className="text-xs px-2 py-1 rounded text-[#2563eb] hover:bg-[#eff6ff]">Edit</button>
                  <button type="button" onClick={() => onDeleteRecurringTask(rule.id)} className="text-xs px-2 py-1 rounded text-[#dc2626] hover:bg-[#fef2f2]">Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBacklog = () => (
    <div>
      <h4 className="text-xs font-medium text-[#0f172a] mb-2">Backlog ({backlogTasks.length})</h4>
      {renderTaskList(backlogTasks, 'No backlog tasks.')}
    </div>
  );

  const renderReview = () => (
    <div>
      <h4 className="text-xs font-medium text-[#0f172a] mb-2">Review ({reviewTasks.length})</h4>
      {renderTaskList(reviewTasks, 'No completed or cancelled tasks.')}
    </div>
  );

  const renderView = () => {
    switch (view) {
      case 'today': return renderToday();
      case 'week': return renderWeek();
      case 'board': return renderBoard();
      case 'recurring': return renderRecurring();
      case 'backlog': return renderBacklog();
      case 'review': return renderReview();
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-4 gap-3">
        <div className="rounded-md border border-[#e5e7eb] bg-white p-3">
          <div className="text-xs text-[#64748b]">Total Tasks</div>
          <div className="mt-1 text-lg font-bold text-[#0f172a]">{stats.total}</div>
        </div>
        <div className="rounded-md border border-[#e5e7eb] bg-white p-3">
          <div className="text-xs text-[#64748b]">Done Today</div>
          <div className="mt-1 text-lg font-bold text-[#16a34a]">{stats.doneToday}</div>
        </div>
        <div className="rounded-md border border-[#e5e7eb] bg-white p-3">
          <div className="text-xs text-[#64748b]">Overdue</div>
          <div className="mt-1 text-lg font-bold text-[#dc2626]">{stats.overdue}</div>
        </div>
        <div className="rounded-md border border-[#e5e7eb] bg-white p-3">
          <div className="text-xs text-[#64748b]">Est. Time</div>
          <div className="mt-1 text-lg font-bold text-[#0f172a]">{stats.totalEstimated}m</div>
        </div>
      </div>

      {/* View tabs */}
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
        <button
          type="button"
          onClick={() => setShowTaskForm(true)}
          className="text-xs px-3 py-1.5 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
        >
          + Add Task
        </button>
      </div>

      {/* View content */}
      {renderView()}

      {/* Task Form Modal */}
      {(showTaskForm || editingTask) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-lg">
            <TaskForm
              initial={editingTask || undefined}
              projects={projects}
              plans={plans}
              strategyGoals={strategyGoals}
              companies={companies}
              people={people}
              onSubmit={async (input) => {
                if (editingTask) {
                  await onUpdateTask(editingTask.id, input);
                } else {
                  await onAddTask(input);
                }
                setShowTaskForm(false);
                setEditingTask(null);
              }}
              onCancel={() => {
                setShowTaskForm(false);
                setEditingTask(null);
              }}
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
              projects={projects}
              plans={plans}
              strategyGoals={strategyGoals}
              companies={companies}
              people={people}
              onSubmit={async (input) => {
                if (editingRecurring) {
                  await onUpdateRecurringTask(editingRecurring.id, input);
                } else {
                  await onAddRecurringTask(input);
                }
                setShowRecurringForm(false);
                setEditingRecurring(null);
              }}
              onCancel={() => {
                setShowRecurringForm(false);
                setEditingRecurring(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default TasksPanel;
