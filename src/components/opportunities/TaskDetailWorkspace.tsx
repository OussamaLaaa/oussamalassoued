import React, { useMemo, useState } from 'react';
import type { Task, TaskInput, TaskStatus, TaskWorkLog, TaskWorkLogInput, Project, Plan, StrategyGoal, Company, Person } from '../../types/opportunities';
import TaskForm from './TaskForm';

const STATUS_BADGE: Record<string, string> = {
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

const formatHours = (minutes?: number | null): string => {
  if (minutes == null) return '0h';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

const formatDate = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso.slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const dayName = (iso?: string): string => {
  if (!iso) return '';
  const d = new Date(iso.slice(0, 10) + 'T00:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'long' });
};

type DetailTab = 'overview' | 'worklogs' | 'links' | 'notes';

const TaskDetailWorkspace: React.FC<{
  task: Task;
  taskWorkLogs: TaskWorkLog[];
  projects: Project[];
  plans: Plan[];
  strategyGoals: StrategyGoal[];
  companies: Company[];
  people: Person[];
  generatedDocuments: { id: string; title: string }[];
  onUpdateTask: (id: string, input: Partial<TaskInput>) => Promise<any>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddWorkLog: (input: TaskWorkLogInput) => Promise<TaskWorkLog>;
  onUpdateWorkLog: (id: string, input: Partial<TaskWorkLogInput>) => Promise<TaskWorkLog>;
  onDeleteWorkLog: (id: string) => Promise<void>;
  onComplete: (id: string, date: string, hours: number, notes: string) => void;
  onClose: () => void;
}> = ({
  task, taskWorkLogs, projects, plans, strategyGoals, companies, people, generatedDocuments,
  onUpdateTask, onDeleteTask, onAddWorkLog, onUpdateWorkLog, onDeleteWorkLog, onComplete, onClose,
}) => {
  const [tab, setTab] = useState<DetailTab>('overview');
  const [editing, setEditing] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [showAddLog, setShowAddLog] = useState(false);
  const [editingLog, setEditingLog] = useState<TaskWorkLog | null>(null);
  const [completionDate, setCompletionDate] = useState(new Date().toISOString().slice(0, 10));
  const [completionHours, setCompletionHours] = useState('');
  const [completionSummary, setCompletionSummary] = useState('');
  const [completionNotes, setCompletionNotes] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const logsForTask = useMemo(
    () => taskWorkLogs.filter((l) => l.taskId === task.id).sort((a, b) => b.workDate.localeCompare(a.workDate)),
    [taskWorkLogs, task.id],
  );

  const totalMinutesLogged = useMemo(
    () => logsForTask.reduce((s, l) => s + l.minutesSpent, 0),
    [logsForTask],
  );

  const handleStatusChange = async (status: TaskStatus) => {
    if (status === 'done') {
      setCompleting(true);
      return;
    }
    const payload: Partial<TaskInput> = { status };
    if (status !== 'done') payload.completedAt = undefined;
    await onUpdateTask(task.id, payload);
  };

  const handleComplete = () => {
    const hours = parseFloat(completionHours) || 0;
    const minutes = Math.round(hours * 60);
    onComplete(task.id, completionDate, hours, completionNotes);
    if (minutes > 0 || completionSummary) {
      onAddWorkLog({
        taskId: task.id,
        workDate: completionDate,
        minutesSpent: minutes || 0,
        summary: completionSummary || `Completed task`,
        notes: completionNotes || undefined,
      });
    }
    setCompleting(false);
  };

  const handleAddLog = async () => {
    if (!editingLog) return;
    await onAddWorkLog({
      taskId: task.id,
      workDate: editingLog.workDate,
      minutesSpent: editingLog.minutesSpent,
      summary: editingLog.summary,
      notes: editingLog.notes,
    });
    setShowAddLog(false);
    setEditingLog(null);
  };

  // Work log form state
  const [logDate, setLogDate] = useState(today);
  const [logMinutes, setLogMinutes] = useState('');
  const [logSummary, setLogSummary] = useState('');
  const [logNotes, setLogNotes] = useState('');

  const handleSubmitLog = async () => {
    const minutes = parseInt(logMinutes) || 0;
    if (minutes <= 0) return;
    await onAddWorkLog({
      taskId: task.id,
      workDate: logDate,
      minutesSpent: minutes,
      summary: logSummary || undefined,
      notes: logNotes || undefined,
    });
    setLogDate(today);
    setLogMinutes('');
    setLogSummary('');
    setLogNotes('');
    setShowAddLog(false);
  };

  const handleUpdateLog = async () => {
    if (!editingLog) return;
    const minutes = parseInt(logMinutes) || 0;
    if (minutes <= 0) return;
    await onUpdateWorkLog(editingLog.id, {
      workDate: logDate,
      minutesSpent: minutes,
      summary: logSummary || undefined,
      notes: logNotes || undefined,
    });
    setEditingLog(null);
    setLogDate(today);
    setLogMinutes('');
    setLogSummary('');
    setLogNotes('');
  };

  const startEditLog = (log: TaskWorkLog) => {
    setEditingLog(log);
    setLogDate(log.workDate);
    setLogMinutes(String(log.minutesSpent));
    setLogSummary(log.summary || '');
    setLogNotes(log.notes || '');
  };

  const handleDeleteLog = async (id: string) => {
    if (!window.confirm('Delete this work log?')) return;
    await onDeleteWorkLog(id);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/20">
      <div className="w-full max-w-xl bg-white border-l border-[#e5e7eb] shadow-lg overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-xs px-1.5 py-0.5 rounded border ${STATUS_BADGE[task.status]}`}>{task.status}</span>
                {task.priority && <span className="text-xs">{PRIORITY_ICON[task.priority]}</span>}
                {task.category && <span className="text-xs px-1.5 py-0.5 rounded bg-[#f8fafc] text-[#64748b] border border-[#e5e7eb]">{task.category}</span>}
              </div>
              <h2 className="text-base font-semibold text-[#0f172a]">{task.title}</h2>
            </div>
            <button type="button" onClick={onClose} className="text-xs px-2 py-1 rounded text-[#64748b] hover:bg-[#f8fafc]">✕</button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-[#e5e7eb] mb-4">
            {(['overview', 'worklogs', 'links', 'notes'] as DetailTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`text-xs px-3 py-2 border-b-2 transition-all ${
                  tab === t ? 'border-[#2563eb] text-[#2563eb] font-medium' : 'border-transparent text-[#64748b] hover:text-[#0f172a]'
                }`}
              >
                {t === 'overview' ? 'Overview' : t === 'worklogs' ? `Work Logs (${logsForTask.length})` : t === 'links' ? 'Links' : 'Notes'}
              </button>
            ))}
          </div>

          {/* Tab content */}
          {tab === 'overview' && (
            <div className="space-y-4">
              {task.description && (
                <div>
                  <label className="text-xs font-medium text-[#475569] mb-1 block">Description</label>
                  <div className="text-sm text-[#0f172a]">{task.description}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-[#475569] mb-1 block">Estimated</label>
                  <div className="text-[#0f172a]">{formatHours(task.estimatedMinutes)}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475569] mb-1 block">Actual (logged)</label>
                  <div className="text-[#0f172a]">{formatHours(totalMinutesLogged)}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475569] mb-1 block">Completed</label>
                  <div className="text-[#0f172a]">{task.completedAt ? dayName(task.completedAt) : '—'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475569] mb-1 block">Completed At</label>
                  <div className="text-[#0f172a]">{task.completedAt ? formatDate(task.completedAt) : '—'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475569] mb-1 block">Week</label>
                  <div className="text-[#0f172a]">{task.weekStart || '—'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#475569] mb-1 block">Linked Entities</label>
                  <div className="text-[#0f172a]">
                    {task.linkedProjectName || task.linkedPlanTitle || task.linkedCompanyName || task.linkedPersonName || task.linkedDocumentTitle ? 'Yes' : 'None'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#e5e7eb]">
                {task.status !== 'todo' && <button type="button" onClick={() => handleStatusChange('todo')} className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]">Todo</button>}
                {task.status !== 'doing' && <button type="button" onClick={() => handleStatusChange('doing')} className="text-xs px-3 py-1.5 rounded border border-[#2563eb] bg-[#eff6ff] text-[#2563eb] hover:bg-[#dbeafe]">Doing</button>}
                {task.status !== 'done' && <button type="button" onClick={() => handleStatusChange('done')} className="text-xs px-3 py-1.5 rounded border border-[#16a34a] bg-[#f0fdf4] text-[#16a34a] hover:bg-[#dcfce7]">Mark Done</button>}
                {task.status !== 'blocked' && <button type="button" onClick={() => handleStatusChange('blocked')} className="text-xs px-3 py-1.5 rounded border border-[#dc2626] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]">Block</button>}
                <button type="button" onClick={() => setEditing(true)} className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#2563eb] hover:bg-[#eff6ff]">Edit</button>
                <button type="button" onClick={() => { if (window.confirm('Delete this task?')) onDeleteTask(task.id); }} className="text-xs px-3 py-1.5 rounded border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2]">Delete</button>
                <button type="button" onClick={() => setShowAddLog(true)} className="text-xs px-3 py-1.5 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]">+ Log Time</button>
              </div>
            </div>
          )}

          {tab === 'worklogs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-[#0f172a]">Work Logs</span>
                  <span className="text-xs text-[#64748b] ml-2">Total: {formatHours(totalMinutesLogged)}</span>
                </div>
                <button type="button" onClick={() => setShowAddLog(true)} className="text-xs px-3 py-1.5 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]">+ Add Log</button>
              </div>

              {logsForTask.length === 0 ? (
                <div className="text-xs text-[#94a3b8] py-4 text-center">No work logs yet.</div>
              ) : (
                <div className="space-y-2">
                  {logsForTask.map((log) => (
                    <div key={log.id} className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-[#0f172a]">{formatDate(log.workDate)}</span>
                            <span className="text-xs px-1.5 py-0.5 rounded bg-[#eff6ff] text-[#2563eb]">{formatHours(log.minutesSpent)}</span>
                          </div>
                          {log.summary && <div className="mt-0.5 text-xs text-[#0f172a]">{log.summary}</div>}
                          {log.notes && <div className="mt-0.5 text-xs text-[#64748b] italic">{log.notes}</div>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <button type="button" onClick={() => startEditLog(log)} className="text-xs px-2 py-1 rounded text-[#2563eb] hover:bg-[#eff6ff]">Edit</button>
                          <button type="button" onClick={() => handleDeleteLog(log.id)} className="text-xs px-2 py-1 rounded text-[#dc2626] hover:bg-[#fef2f2]">Del</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {tab === 'links' && (
            <div className="space-y-2">
              {(task.linkedProjectName || task.linkedPlanTitle || task.linkedStrategyGoalTitle || task.linkedCompanyName || task.linkedPersonName || task.linkedDocumentTitle) ? (
                <div className="flex flex-wrap gap-2">
                  {task.linkedProjectName && <div className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm w-full"><span className="text-xs text-[#64748b]">Project:</span> <span className="text-[#0f172a]">{task.linkedProjectName}</span></div>}
                  {task.linkedPlanTitle && <div className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm w-full"><span className="text-xs text-[#64748b]">Plan:</span> <span className="text-[#0f172a]">{task.linkedPlanTitle}</span></div>}
                  {task.linkedStrategyGoalTitle && <div className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm w-full"><span className="text-xs text-[#64748b]">Strategy Goal:</span> <span className="text-[#0f172a]">{task.linkedStrategyGoalTitle}</span></div>}
                  {task.linkedCompanyName && <div className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm w-full"><span className="text-xs text-[#64748b]">Company:</span> <span className="text-[#0f172a]">{task.linkedCompanyName}</span></div>}
                  {task.linkedPersonName && <div className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm w-full"><span className="text-xs text-[#64748b]">Person:</span> <span className="text-[#0f172a]">{task.linkedPersonName}</span></div>}
                  {task.linkedDocumentTitle && <div className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm w-full"><span className="text-xs text-[#64748b]">Document:</span> <span className="text-[#0f172a]">{task.linkedDocumentTitle}</span></div>}
                </div>
              ) : (
                <div className="text-xs text-[#94a3b8] py-4 text-center">No linked entities.</div>
              )}
            </div>
          )}

          {tab === 'notes' && (
            <div>
              {task.notes ? (
                <div className="rounded-md border border-[#e5e7eb] bg-white p-3 text-sm text-[#0f172a] whitespace-pre-wrap">{task.notes}</div>
              ) : (
                <div className="text-xs text-[#94a3b8] py-4 text-center">No notes.</div>
              )}
            </div>
          )}

          {/* Add / Edit Work Log Form */}
          {(showAddLog || editingLog) && !editing && (
            <div className="mt-4 pt-4 border-t border-[#e5e7eb] space-y-3">
              <h4 className="text-sm font-medium text-[#0f172a]">{editingLog ? 'Edit Work Log' : 'Add Work Log'}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">Date</label>
                  <input type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#475569] mb-1">Minutes</label>
                  <input type="number" min={1} value={logMinutes} onChange={(e) => setLogMinutes(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Summary</label>
                <input type="text" value={logSummary} onChange={(e) => setLogSummary(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
              </div>
              <div>
                <label className="block text-xs font-medium text-[#475569] mb-1">Notes</label>
                <textarea value={logNotes} onChange={(e) => setLogNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
              </div>
              <div className="flex items-center justify-end gap-2">
                <button type="button" onClick={() => { setShowAddLog(false); setEditingLog(null); }} className="px-4 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc] text-sm">Cancel</button>
                <button type="button" onClick={editingLog ? handleUpdateLog : handleSubmitLog} className="px-4 py-2 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8] text-sm">
                  {editingLog ? 'Update' : 'Add'}
                </button>
              </div>
            </div>
          )}

          {/* Edit Task Form */}
          {editing && (
            <div className="mt-4 pt-4 border-t border-[#e5e7eb]">
              <TaskForm
                initial={task}
                projects={projects}
                plans={plans}
                strategyGoals={strategyGoals}
                companies={companies}
                people={people}
                defaultWeekStart={task.weekStart}
                onSubmit={async (input) => {
                  await onUpdateTask(task.id, input);
                  setEditing(false);
                }}
                onCancel={() => setEditing(false)}
              />
            </div>
          )}

          {/* Completion Modal */}
          {completing && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30">
              <div className="w-full max-w-sm rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-lg">
                <h3 className="text-sm font-medium text-[#0f172a] mb-3">Complete Task</h3>
                <p className="text-xs text-[#64748b] mb-4">{task.title}</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-[#475569] mb-1">Completion Date</label>
                    <input type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#475569] mb-1">Hours Spent</label>
                    <input type="number" min={0} step={0.5} value={completionHours} onChange={(e) => setCompletionHours(e.target.value)} placeholder="e.g. 2.5" className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#475569] mb-1">Summary</label>
                    <input type="text" value={completionSummary} onChange={(e) => setCompletionSummary(e.target.value)} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#475569] mb-1">Notes</label>
                    <textarea value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} rows={2} className="w-full px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]" />
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[#e5e7eb]">
                  <button type="button" onClick={() => setCompleting(false)} className="px-4 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc] text-sm">Cancel</button>
                  <button type="button" onClick={handleComplete} className="px-4 py-2 rounded border border-[#16a34a] bg-[#16a34a] text-white hover:bg-[#15803d] text-sm">Mark Done</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TaskDetailWorkspace;
