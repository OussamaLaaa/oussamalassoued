import React, { useMemo, useState } from 'react';
import type { Task, TaskInput, TaskStatus, TaskWorkLog, TaskWorkLogInput, Project, Plan, StrategyGoal, Company, Person } from '../../types/opportunities';
import TaskForm from './TaskForm';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';

const STATUS_BADGE_VARIANT: Record<string, 'neutral' | 'blue' | 'success' | 'danger'> = {
  todo: 'neutral',
  doing: 'blue',
  done: 'success',
  blocked: 'danger',
  cancelled: 'neutral',
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
      <div className="w-full max-w-xl bg-white border-l border-neutral-200 shadow-lg overflow-y-auto">
        <div className="p-5">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Badge variant={STATUS_BADGE_VARIANT[task.status] || 'neutral'}>{task.status}</Badge>
                {task.priority && <span className="text-xs">{PRIORITY_ICON[task.priority]}</span>}
                {task.category && <Badge variant="neutral">{task.category}</Badge>}
              </div>
              <h2 className="text-base font-semibold text-black">{task.title}</h2>
            </div>
            <Button type="button" variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-1 border-b border-neutral-200 mb-4">
            {(['overview', 'worklogs', 'links', 'notes'] as DetailTab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`text-xs px-3 py-2 border-b-2 transition-all ${
                  tab === t ? 'border-black text-black font-medium' : 'border-transparent text-neutral-500 hover:text-black'
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
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Description</label>
                  <div className="text-sm text-black">{task.description}</div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Estimated</label>
                  <div className="text-black">{formatHours(task.estimatedMinutes)}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Actual (logged)</label>
                  <div className="text-black">{formatHours(totalMinutesLogged)}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Completed</label>
                  <div className="text-black">{task.completedAt ? dayName(task.completedAt) : '—'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Completed At</label>
                  <div className="text-black">{task.completedAt ? formatDate(task.completedAt) : '—'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Week</label>
                  <div className="text-black">{task.weekStart || '—'}</div>
                </div>
                <div>
                  <label className="text-xs font-medium text-neutral-600 mb-1 block">Linked Entities</label>
                  <div className="text-black">
                    {task.linkedProjectName || task.linkedPlanTitle || task.linkedCompanyName || task.linkedPersonName || task.linkedDocumentTitle ? 'Yes' : 'None'}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-200">
                {task.status !== 'todo' && <Button variant="outline" size="sm" onClick={() => handleStatusChange('todo')}>Todo</Button>}
                {task.status !== 'doing' && (
                  <button type="button" onClick={() => handleStatusChange('doing')} className="text-xs px-3 py-1.5 rounded-lg border border-blue-600 bg-blue-50 text-blue-700 hover:bg-blue-100">Doing</button>
                )}
                {task.status !== 'done' && <Button variant="success" size="sm" onClick={() => handleStatusChange('done')}>Mark Done</Button>}
                {task.status !== 'blocked' && <Button variant="danger" size="sm" onClick={() => handleStatusChange('blocked')}>Block</Button>}
                <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => { if (window.confirm('Delete this task?')) onDeleteTask(task.id); }}>Delete</Button>
                <Button variant="primary" size="sm" onClick={() => setShowAddLog(true)}>+ Log Time</Button>
              </div>
            </div>
          )}

          {tab === 'worklogs' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm font-medium text-black">Work Logs</span>
                  <span className="text-xs text-neutral-500 ml-2">Total: {formatHours(totalMinutesLogged)}</span>
                </div>
                <Button variant="primary" size="sm" onClick={() => setShowAddLog(true)}>+ Add Log</Button>
              </div>

              {logsForTask.length === 0 ? (
                <div className="text-xs text-neutral-400 py-4 text-center">No work logs yet.</div>
              ) : (
                <div className="space-y-2">
                  {logsForTask.map((log) => (
                    <div key={log.id} className="rounded-lg border border-neutral-200 bg-white p-3 text-sm">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium text-black">{formatDate(log.workDate)}</span>
                            <Badge variant="blue">{formatHours(log.minutesSpent)}</Badge>
                          </div>
                          {log.summary && <div className="mt-0.5 text-xs text-black">{log.summary}</div>}
                          {log.notes && <div className="mt-0.5 text-xs text-neutral-500 italic">{log.notes}</div>}
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          <Button variant="ghost" size="sm" onClick={() => startEditLog(log)}>Edit</Button>
                          <Button variant="danger" size="sm" onClick={() => handleDeleteLog(log.id)}>Del</Button>
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
                  {task.linkedProjectName && <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm w-full"><span className="text-xs text-neutral-500">Project:</span> <span className="text-black">{task.linkedProjectName}</span></div>}
                  {task.linkedPlanTitle && <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm w-full"><span className="text-xs text-neutral-500">Plan:</span> <span className="text-black">{task.linkedPlanTitle}</span></div>}
                  {task.linkedStrategyGoalTitle && <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm w-full"><span className="text-xs text-neutral-500">Strategy Goal:</span> <span className="text-black">{task.linkedStrategyGoalTitle}</span></div>}
                  {task.linkedCompanyName && <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm w-full"><span className="text-xs text-neutral-500">Company:</span> <span className="text-black">{task.linkedCompanyName}</span></div>}
                  {task.linkedPersonName && <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm w-full"><span className="text-xs text-neutral-500">Person:</span> <span className="text-black">{task.linkedPersonName}</span></div>}
                  {task.linkedDocumentTitle && <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm w-full"><span className="text-xs text-neutral-500">Document:</span> <span className="text-black">{task.linkedDocumentTitle}</span></div>}
                </div>
              ) : (
                <div className="text-xs text-neutral-400 py-4 text-center">No linked entities.</div>
              )}
            </div>
          )}

          {tab === 'notes' && (
            <div>
              {task.notes ? (
                <div className="rounded-lg border border-neutral-200 bg-white p-3 text-sm text-black whitespace-pre-wrap">{task.notes}</div>
              ) : (
                <div className="text-xs text-neutral-400 py-4 text-center">No notes.</div>
              )}
            </div>
          )}

          {/* Add / Edit Work Log Form */}
          {(showAddLog || editingLog) && !editing && (
            <div className="mt-4 pt-4 border-t border-neutral-200 space-y-3">
              <h4 className="text-sm font-medium text-black">{editingLog ? 'Edit Work Log' : 'Add Work Log'}</h4>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Date" type="date" value={logDate} onChange={(e) => setLogDate(e.target.value)} />
                <Input label="Minutes" type="number" min={1} value={logMinutes} onChange={(e) => setLogMinutes(e.target.value)} />
              </div>
              <Input label="Summary" type="text" value={logSummary} onChange={(e) => setLogSummary(e.target.value)} />
              <Textarea label="Notes" value={logNotes} onChange={(e) => setLogNotes(e.target.value)} rows={2} />
              <div className="flex items-center justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => { setShowAddLog(false); setEditingLog(null); }}>Cancel</Button>
                <Button type="button" variant="primary" onClick={editingLog ? handleUpdateLog : handleSubmitLog}>
                  {editingLog ? 'Update' : 'Add'}
                </Button>
              </div>
            </div>
          )}

          {/* Edit Task Form */}
          {editing && (
            <div className="mt-4 pt-4 border-t border-neutral-200">
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
              <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5 shadow-lg">
                <h3 className="text-sm font-medium text-black mb-3">Complete Task</h3>
                <p className="text-xs text-neutral-500 mb-4">{task.title}</p>
                <div className="space-y-3">
                  <Input label="Completion Date" type="date" value={completionDate} onChange={(e) => setCompletionDate(e.target.value)} />
                  <Input label="Hours Spent" type="number" min={0} step={0.5} value={completionHours} onChange={(e) => setCompletionHours(e.target.value)} placeholder="e.g. 2.5" />
                  <Input label="Summary" type="text" value={completionSummary} onChange={(e) => setCompletionSummary(e.target.value)} />
                  <Textarea label="Notes" value={completionNotes} onChange={(e) => setCompletionNotes(e.target.value)} rows={2} />
                </div>
                <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-neutral-200">
                  <Button type="button" variant="secondary" onClick={() => setCompleting(false)}>Cancel</Button>
                  <Button type="button" variant="success" onClick={handleComplete}>Mark Done</Button>
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
