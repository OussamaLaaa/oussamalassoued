import React, { useMemo, useState } from 'react';
import type {
  Company, Deal, OutreachMessage, Person, Project, ProjectInput,
  ProjectTask, ProjectTaskInput,
  ProjectTimeLog, ProjectTimeLogInput,
  ProjectMeeting, ProjectMeetingInput,
  ProjectDocument, ProjectDocumentInput,
  ProjectFinanceItem, ProjectFinanceItemInput,
} from '../../types/opportunities';

type InternalTab = 'overview' | 'tasks' | 'milestones' | 'time' | 'meetings' | 'finance' | 'documents' | 'messages' | 'notes' | 'activity';

const INTERNAL_TABS: { id: InternalTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'time', label: 'Time' },
  { id: 'meetings', label: 'Meetings' },
  { id: 'finance', label: 'Finance' },
  { id: 'documents', label: 'Documents' },
  { id: 'messages', label: 'Messages' },
  { id: 'notes', label: 'Notes' },
  { id: 'activity', label: 'Activity' },
];

const stageColors: Record<string, string> = {
  active: 'bg-[#dcfce7] text-[#166534]',
  planned: 'bg-[#f0f9ff] text-[#1e40af]',
  paused: 'bg-[#fefce8] text-[#854d0e]',
  blocked: 'bg-[#fef2f2] text-[#991b1b]',
  completed: 'bg-[#e0f2fe] text-[#075985]',
  archived: 'bg-[#f1f5f9] text-[#475569]',
};

const priorityColors: Record<string, string> = {
  high: 'bg-[#fef2f2] text-[#dc2626]',
  medium: 'bg-[#fefce8] text-[#d97706]',
  low: 'bg-[#f0fdf4] text-[#16a34a]',
};

const typeColors: Record<string, string> = {
  portfolio: 'bg-[#e0f2fe] text-[#075985]',
  client: 'bg-[#dbeafe] text-[#1d4ed8]',
  personal_product: 'bg-[#f0f9ff] text-[#1e40af]',
  case_study: 'bg-[#f0fdf4] text-[#166534]',
  learning: 'bg-[#fefce8] text-[#854d0e]',
  experiment: 'bg-[#f3e8ff] text-[#7c3aed]',
};

const phaseColors: Record<string, string> = {
  idea: 'bg-[#f1f5f9] text-[#475569]',
  research: 'bg-[#f0f9ff] text-[#1e40af]',
  ux_audit: 'bg-[#dbeafe] text-[#1d4ed8]',
  wireframes: 'bg-[#e0f2fe] text-[#075985]',
  ui_design: 'bg-[#f0fdf4] text-[#166534]',
  prototype: 'bg-[#fefce8] text-[#854d0e]',
  case_study: 'bg-[#f3e8ff] text-[#7c3aed]',
  published: 'bg-[#dcfce7] text-[#166534]',
  archived: 'bg-[#f1f5f9] text-[#475569]',
};

const taskStatusColors: Record<string, string> = {
  todo: 'bg-[#f1f5f9] text-[#475569] border border-[#e2e8f0]',
  doing: 'bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]',
  done: 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]',
  blocked: 'bg-[#fef2f2] text-[#dc2626] border border-[#fecaca]',
};

const taskStatusBg: Record<string, string> = {
  todo: 'bg-[#f8fafc]',
  doing: 'bg-[#eff6ff]',
  done: 'bg-[#f0fdf4]',
  blocked: 'bg-[#fef2f2]',
};

const financeTypeColors: Record<string, string> = {
  income: 'bg-[#dcfce7] text-[#166534]',
  expense: 'bg-[#fef2f2] text-[#dc2626]',
  invoice: 'bg-[#dbeafe] text-[#1d4ed8]',
  payment: 'bg-[#f0f9ff] text-[#1e40af]',
  investment: 'bg-[#f3e8ff] text-[#7c3aed]',
};

const financeStatusColors: Record<string, string> = {
  planned: 'bg-[#f1f5f9] text-[#475569]',
  sent: 'bg-[#dbeafe] text-[#1d4ed8]',
  paid: 'bg-[#dcfce7] text-[#166534]',
  unpaid: 'bg-[#fefce8] text-[#854d0e]',
  overdue: 'bg-[#fef2f2] text-[#dc2626]',
  cancelled: 'bg-[#f1f5f9] text-[#64748b]',
};

const docTypeLabels: Record<string, string> = {
  contract: 'Contract', invoice: 'Invoice', agreement: 'Agreement',
  brief: 'Brief', receipt: 'Receipt', link: 'Link', document: 'Document', other: 'Other',
};

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full bg-[#e5e7eb] rounded-full h-1.5 overflow-hidden">
    <div className="h-full rounded-full bg-[#2563eb] transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

const StatCard: React.FC<{ title: string; value: string | number; className?: string }> = ({ title, value, className }) => (
  <div className={`rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm hover:shadow-md transition-shadow ${className || ''}`}>
    <div className="text-xs font-mono uppercase tracking-wider text-[#64748b]">{title}</div>
    <div className="mt-1 text-2xl font-semibold text-[#0f172a]">{value}</div>
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
    <div className="bg-white rounded-xl border border-[#e5e7eb] shadow-xl w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#e5e7eb]">
        <h3 className="font-semibold text-[#0f172a]">{title}</h3>
        <button type="button" onClick={onClose} className="text-[#94a3b8] hover:text-[#0f172a] text-xl leading-none p-1 rounded hover:bg-[#f1f5f9]">&times;</button>
      </div>
      <div className="p-5">{children}</div>
    </div>
  </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-3.5">
    <label className="block text-xs font-medium text-[#475569] mb-1">{label}</label>
    {children}
  </div>
);

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm text-[#0f172a] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe] transition-all" />
);

const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm text-[#0f172a] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe] resize-none transition-all" />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }> = ({ options, ...props }) => (
  <select {...props} className="w-full rounded-lg border border-[#e5e7eb] px-3 py-2 text-sm text-[#0f172a] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#bfdbfe] transition-all">
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' | 'ghost' }> = ({ variant = 'secondary', ...props }) => {
  const base = 'text-xs px-3 py-1.5 rounded-lg font-medium transition-all duration-150';
  const variants: Record<string, string> = {
    primary: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] border border-[#2563eb] shadow-sm',
    secondary: 'border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc] hover:border-[#cbd5e1] shadow-sm',
    danger: 'border border-[#fecaca] bg-white text-[#dc2626] hover:bg-[#fef2f2]',
    ghost: 'border-transparent text-[#64748b] hover:text-[#0f172a] hover:bg-[#f1f5f9]',
  };
  return <button {...props} className={`${base} ${variants[variant]} ${props.className || ''}`} />;
};

// ── Task Kanban Card ──

const priorityLabel = (p?: string) => {
  const labels: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' };
  return labels[p || ''] || p || '—';
};

const formatDate = (date?: string) => {
  if (!date) return '—';
  try { return new Date(date).toLocaleDateString(); } catch { return '—'; }
};

const formatDateTime = (date?: string) => {
  if (!date) return '';
  try {
    const d = new Date(date);
    return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch { return ''; }
};

type Activity = {
  id: string;
  type: string;
  title: string;
  date: string;
  source: string;
};

const EmptyStateDisplay: React.FC<{ message: string; hint: string; actionLabel?: string; onAction?: () => void }> = ({ message, hint, actionLabel, onAction }) => (
  <div className="py-10 text-center">
    <div className="text-sm font-medium text-[#64748b]">{message}</div>
    <div className="mt-1 text-xs text-[#94a3b8]">{hint}</div>
    {actionLabel && onAction && (
      <Button variant="primary" onClick={onAction} className="mt-3">{actionLabel}</Button>
    )}
  </div>
);

// ── Task Drawer ──

const TaskDrawer: React.FC<{
  task: ProjectTask;
  people: Person[];
  onClose: () => void;
  onUpdateStatus: (id: string, status: string) => void;
  onEdit: () => void;
  onDelete: (id: string) => void;
}> = ({ task, people, onClose, onUpdateStatus, onEdit, onDelete }) => {
  const assigneeName = task.assignedToPersonName || people.find((p) => p.id === task.assignedToPersonId)?.fullName || 'Unassigned';

  return (
    <div className="fixed inset-0 z-40 flex justify-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/20" />
      <div className="relative w-full max-w-md bg-white border-l border-[#e5e7eb] shadow-xl overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#e5e7eb]">
          <h3 className="font-semibold text-[#0f172a]">Task Details</h3>
          <button type="button" onClick={onClose} className="text-[#94a3b8] hover:text-[#0f172a] text-xl leading-none p-1 rounded hover:bg-[#f1f5f9]">&times;</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <h4 className="text-lg font-semibold text-[#0f172a]">{task.title}</h4>
            {task.description && <p className="mt-1 text-sm text-[#64748b]">{task.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">Status</div>
              <select value={task.status} onChange={(e) => onUpdateStatus(task.id, e.target.value)}
                className="mt-1 w-full rounded-lg border border-[#e5e7eb] px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-[#2563eb]"
              >
                <option value="todo">Todo</option>
                <option value="doing">Doing</option>
                <option value="done">Done</option>
                <option value="blocked">Blocked</option>
              </select>
            </div>
            <div>
              <div className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">Priority</div>
              <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority] || ''}`}>{priorityLabel(task.priority)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <div className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">Due Date</div>
              <div className="mt-1 text-[#0f172a]">{formatDate(task.dueDate)}</div>
            </div>
            <div>
              <div className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">Assignee</div>
              <div className="mt-1 text-[#0f172a]">{assigneeName}</div>
            </div>
          </div>

          {task.createdAt && (
            <div>
              <div className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">Created</div>
              <div className="mt-1 text-sm text-[#64748b]">{formatDateTime(task.createdAt)}</div>
            </div>
          )}
          {task.updatedAt && (
            <div>
              <div className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">Updated</div>
              <div className="mt-1 text-sm text-[#64748b]">{formatDateTime(task.updatedAt)}</div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t border-[#e5e7eb]">
            <Button variant="primary" onClick={onEdit}>Edit Task</Button>
            <Button variant="danger" onClick={() => { onDelete(task.id); onClose(); }}>Delete</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Form sub-components ──

const TaskForm: React.FC<{
  initial?: ProjectTask;
  people: Person[];
  projectId: string;
  onSave: (data: ProjectTaskInput) => void;
  onCancel: () => void;
}> = ({ initial, people, projectId, onSave, onCancel }) => {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [status, setStatus] = useState(initial?.status || 'todo');
  const [priority, setPriority] = useState(initial?.priority || 'medium');
  const [dueDate, setDueDate] = useState(initial?.dueDate ? initial.dueDate.slice(0, 10) : '');
  const [assignedToPersonId, setAssignedToPersonId] = useState(initial?.assignedToPersonId || '');

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      status: status as ProjectTaskInput['status'],
      priority: priority as ProjectTaskInput['priority'],
      dueDate: dueDate || undefined,
      assignedToPersonId: assignedToPersonId || undefined,
    });
  };

  return (
    <div>
      <FormField label="Title *"><FormInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" /></FormField>
      <FormField label="Description"><FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Status"><FormSelect value={status} onChange={(e) => setStatus(e.target.value)} options={[
          { value: 'todo', label: 'Todo' }, { value: 'doing', label: 'Doing' },
          { value: 'done', label: 'Done' }, { value: 'blocked', label: 'Blocked' },
        ]} /></FormField>
        <FormField label="Priority"><FormSelect value={priority} onChange={(e) => setPriority(e.target.value)} options={[
          { value: 'low', label: 'Low' }, { value: 'medium', label: 'Medium' }, { value: 'high', label: 'High' },
        ]} /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Due Date"><FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></FormField>
        <FormField label="Assign To"><FormSelect value={assignedToPersonId} onChange={(e) => setAssignedToPersonId(e.target.value)} options={[
          { value: '', label: 'Unassigned' },
          ...people.map((p) => ({ value: p.id, label: p.fullName })),
        ]} /></FormField>
      </div>
      <div className="flex gap-2 justify-end mt-5">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!title.trim()}>{initial ? 'Update' : 'Add'} Task</Button>
      </div>
    </div>
  );
};

const TimeLogForm: React.FC<{
  projectId: string;
  onSave: (data: ProjectTimeLogInput) => void;
  onCancel: () => void;
}> = ({ projectId, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [hours, setHours] = useState('');
  const [workDate, setWorkDate] = useState(new Date().toISOString().slice(0, 10));
  const handleSave = () => {
    if (!title.trim() || !hours) return;
    onSave({ projectId, title: title.trim(), description: description.trim() || undefined, hours: parseFloat(hours), workDate });
  };
  return (
    <div>
      <FormField label="Title *"><FormInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Time log title" /></FormField>
      <FormField label="Description"><FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Hours *"><FormInput type="number" step="0.5" min="0" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 2.5" /></FormField>
        <FormField label="Date"><FormInput type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} /></FormField>
      </div>
      <div className="flex gap-2 justify-end mt-5">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!title.trim() || !hours}>Log Time</Button>
      </div>
    </div>
  );
};

const MeetingForm: React.FC<{
  projectId: string;
  onSave: (data: ProjectMeetingInput) => void;
  onCancel: () => void;
}> = ({ projectId, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [meetingDate, setMeetingDate] = useState(new Date().toISOString().slice(0, 10));
  const [attendees, setAttendees] = useState('');
  const [agenda, setAgenda] = useState('');
  const [notes, setNotes] = useState('');
  const [outcome, setOutcome] = useState('');
  const [nextAction, setNextAction] = useState('');
  const handleSave = () => {
    if (!title.trim()) return;
    onSave({ projectId, title: title.trim(), meetingDate, attendees: attendees.trim() || undefined, agenda: agenda.trim() || undefined, notes: notes.trim() || undefined, outcome: outcome.trim() || undefined, nextAction: nextAction.trim() || undefined });
  };
  return (
    <div>
      <FormField label="Title *"><FormInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Meeting title" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Date"><FormInput type="date" value={meetingDate} onChange={(e) => setMeetingDate(e.target.value)} /></FormField>
        <FormField label="Attendees"><FormInput value={attendees} onChange={(e) => setAttendees(e.target.value)} placeholder="Comma-separated names" /></FormField>
      </div>
      <FormField label="Agenda"><FormTextarea value={agenda} onChange={(e) => setAgenda(e.target.value)} placeholder="Meeting agenda" rows={2} /></FormField>
      <FormField label="Notes"><FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Meeting notes" rows={2} /></FormField>
      <FormField label="Outcome"><FormTextarea value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="Key outcomes" rows={2} /></FormField>
      <FormField label="Next Action"><FormInput value={nextAction} onChange={(e) => setNextAction(e.target.value)} placeholder="Next steps" /></FormField>
      <div className="flex gap-2 justify-end mt-5">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!title.trim()}>Add Meeting</Button>
      </div>
    </div>
  );
};

const DocumentForm: React.FC<{
  projectId: string;
  onSave: (data: ProjectDocumentInput) => void;
  onCancel: () => void;
}> = ({ projectId, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [type, setType] = useState('document');
  const [status, setStatus] = useState('');
  const [url, setUrl] = useState('');
  const [notes, setNotes] = useState('');
  const handleSave = () => {
    if (!name.trim()) return;
    onSave({ projectId, name: name.trim(), type: type as ProjectDocumentInput['type'], status: status.trim() || undefined, url: url.trim() || undefined, notes: notes.trim() || undefined });
  };
  return (
    <div>
      <FormField label="Name *"><FormInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type"><FormSelect value={type} onChange={(e) => setType(e.target.value)} options={[
          { value: 'contract', label: 'Contract' }, { value: 'invoice', label: 'Invoice' },
          { value: 'agreement', label: 'Agreement' }, { value: 'brief', label: 'Brief' },
          { value: 'receipt', label: 'Receipt' }, { value: 'link', label: 'Link' },
          { value: 'document', label: 'Document' }, { value: 'other', label: 'Other' },
        ]} /></FormField>
        <FormField label="Status"><FormInput value={status} onChange={(e) => setStatus(e.target.value)} placeholder="e.g. draft, signed" /></FormField>
      </div>
      <FormField label="URL"><FormInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></FormField>
      <FormField label="Notes"><FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} /></FormField>
      <div className="flex gap-2 justify-end mt-5">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!name.trim()}>Add Document</Button>
      </div>
    </div>
  );
};

const FinanceItemForm: React.FC<{
  projectId: string;
  onSave: (data: ProjectFinanceItemInput) => void;
  onCancel: () => void;
}> = ({ projectId, onSave, onCancel }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('income');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('TND');
  const [status, setStatus] = useState('planned');
  const [dueDate, setDueDate] = useState('');
  const [paidDate, setPaidDate] = useState('');
  const [notes, setNotes] = useState('');
  const handleSave = () => {
    if (!title.trim() || !amount) return;
    onSave({ projectId, title: title.trim(), type: type as ProjectFinanceItemInput['type'], amount: parseFloat(amount), currency: currency || undefined, status: status as ProjectFinanceItemInput['status'], dueDate: dueDate || undefined, paidDate: paidDate || undefined, notes: notes.trim() || undefined });
  };
  return (
    <div>
      <FormField label="Title *"><FormInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Finance item title" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type"><FormSelect value={type} onChange={(e) => setType(e.target.value)} options={[
          { value: 'income', label: 'Income' }, { value: 'expense', label: 'Expense' },
          { value: 'invoice', label: 'Invoice' }, { value: 'payment', label: 'Payment' },
          { value: 'investment', label: 'Investment' },
        ]} /></FormField>
        <FormField label="Status"><FormSelect value={status} onChange={(e) => setStatus(e.target.value)} options={[
          { value: 'planned', label: 'Planned' }, { value: 'sent', label: 'Sent' },
          { value: 'paid', label: 'Paid' }, { value: 'unpaid', label: 'Unpaid' },
          { value: 'overdue', label: 'Overdue' }, { value: 'cancelled', label: 'Cancelled' },
        ]} /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Amount *"><FormInput type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></FormField>
        <FormField label="Currency"><FormSelect value={currency} onChange={(e) => setCurrency(e.target.value)} options={[
          { value: 'TND', label: 'TND' }, { value: 'USD', label: 'USD' },
          { value: 'EUR', label: 'EUR' }, { value: 'AED', label: 'AED' },
        ]} /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Due Date"><FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></FormField>
        <FormField label="Paid Date"><FormInput type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} /></FormField>
      </div>
      <FormField label="Notes"><FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} /></FormField>
      <div className="flex gap-2 justify-end mt-5">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSave} disabled={!title.trim() || !amount}>Add Finance Item</Button>
      </div>
    </div>
  );
};

// ── Main component ──

const ProjectDetailView: React.FC<{
  project: Project;
  companies: Company[];
  people: Person[];
  messages: OutreachMessage[];
  deals: Deal[];
  projectTasks: ProjectTask[];
  projectTimeLogs: ProjectTimeLog[];
  projectMeetings: ProjectMeeting[];
  projectDocuments: ProjectDocument[];
  projectFinanceItems: ProjectFinanceItem[];
  onBack: () => void;
  onEditProject: () => void;
  onUpdateProject: (id: string, input: ProjectInput) => Promise<any>;
  onAddTask: (input: ProjectTaskInput) => Promise<any>;
  onUpdateTask: (id: string, input: Partial<ProjectTaskInput>) => Promise<any>;
  onDeleteTask: (id: string) => Promise<void>;
  onAddTimeLog: (input: ProjectTimeLogInput) => Promise<any>;
  onDeleteTimeLog: (id: string) => Promise<void>;
  onAddMeeting: (input: ProjectMeetingInput) => Promise<any>;
  onDeleteMeeting: (id: string) => Promise<void>;
  onAddDocument: (input: ProjectDocumentInput) => Promise<any>;
  onDeleteDocument: (id: string) => Promise<void>;
  onAddFinanceItem: (input: ProjectFinanceItemInput) => Promise<any>;
  onDeleteFinanceItem: (id: string) => Promise<void>;
}> = ({
  project, companies, people, messages, deals,
  projectTasks, projectTimeLogs, projectMeetings, projectDocuments, projectFinanceItems,
  onBack, onEditProject, onUpdateProject,
  onAddTask, onUpdateTask, onDeleteTask,
  onAddTimeLog, onDeleteTimeLog,
  onAddMeeting, onDeleteMeeting,
  onAddDocument, onDeleteDocument,
  onAddFinanceItem, onDeleteFinanceItem,
}) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('overview');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);
  const [selectedTask, setSelectedTask] = useState<ProjectTask | null>(null);
  const [inlineSaving, setInlineSaving] = useState<Record<string, boolean>>({});
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [noteText, setNoteText] = useState('');

  const safeCompanies = Array.isArray(companies) ? companies : [];
  const safePeople = Array.isArray(people) ? people : [];
  const safeMessages = Array.isArray(messages) ? messages : [];
  const safeDeals = Array.isArray(deals) ? deals : [];
  const safeProjectTasks = Array.isArray(projectTasks) ? projectTasks : [];
  const safeProjectTimeLogs = Array.isArray(projectTimeLogs) ? projectTimeLogs : [];
  const safeProjectMeetings = Array.isArray(projectMeetings) ? projectMeetings : [];
  const safeProjectDocuments = Array.isArray(projectDocuments) ? projectDocuments : [];
  const safeProjectFinanceItems = Array.isArray(projectFinanceItems) ? projectFinanceItems : [];

  const relatedMessages = useMemo(
    () => safeMessages.filter((m) => m.companyId === project.relatedCompanyId || m.personId === project.relatedPersonId),
    [safeMessages, project.relatedCompanyId, project.relatedPersonId],
  );
  const relatedDeals = useMemo(
    () => safeDeals.filter((d) => d.companyId === project.relatedCompanyId || d.personId === project.relatedPersonId),
    [safeDeals, project.relatedCompanyId, project.relatedPersonId],
  );
  const projectTaskList = useMemo(() => safeProjectTasks.filter((t) => t.projectId === project.id), [safeProjectTasks, project.id]);
  const projectTimeLogList = useMemo(() => safeProjectTimeLogs.filter((t) => t.projectId === project.id), [safeProjectTimeLogs, project.id]);
  const projectMeetingList = useMemo(() => safeProjectMeetings.filter((m) => m.projectId === project.id), [safeProjectMeetings, project.id]);
  const projectDocumentList = useMemo(() => safeProjectDocuments.filter((d) => d.projectId === project.id), [safeProjectDocuments, project.id]);
  const projectFinanceList = useMemo(() => safeProjectFinanceItems.filter((f) => f.projectId === project.id), [safeProjectFinanceItems, project.id]);

  const daysRemaining = useMemo(() => {
    if (!project.deadline) return null;
    const now = new Date(); now.setHours(0, 0, 0, 0);
    const deadline = new Date(project.deadline); deadline.setHours(0, 0, 0, 0);
    return Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }, [project.deadline]);

  const taskStats = useMemo(() => ({
    open: projectTaskList.filter((t) => t.status === 'todo' || t.status === 'doing').length,
    completed: projectTaskList.filter((t) => t.status === 'done').length,
    blocked: projectTaskList.filter((t) => t.status === 'blocked').length,
  }), [projectTaskList]);

  const totalHours = useMemo(() => projectTimeLogList.reduce((sum, t) => sum + (t.hours || 0), 0), [projectTimeLogList]);

  const financeStats = useMemo(() => ({
    income: projectFinanceList.filter((f) => f.type === 'income' || f.type === 'invoice' || f.type === 'payment').reduce((sum, f) => sum + (f.amount || 0), 0),
    expenses: projectFinanceList.filter((f) => f.type === 'expense').reduce((sum, f) => sum + (f.amount || 0), 0),
    unpaid: projectFinanceList.filter((f) => f.status === 'unpaid' || f.status === 'overdue').reduce((sum, f) => sum + (f.amount || 0), 0),
    paid: projectFinanceList.filter((f) => f.status === 'paid').reduce((sum, f) => sum + (f.amount || 0), 0),
  }), [projectFinanceList]);

  const company = useMemo(() => safeCompanies.find((c) => c.id === project.relatedCompanyId), [safeCompanies, project.relatedCompanyId]);
  const person1 = useMemo(() => safePeople.find((p) => p.id === project.relatedPersonId), [safePeople, project.relatedPersonId]);

  const activityFeed = useMemo(() => {
    const items: Activity[] = [];
    projectTaskList.forEach((t) => {
      if (t.createdAt) items.push({ id: `task-${t.id}`, type: 'task', title: `Task added: ${t.title}`, date: t.createdAt, source: 'Tasks' });
    });
    projectTimeLogList.forEach((tl) => {
      if (tl.createdAt) items.push({ id: `time-${tl.id}`, type: 'time', title: `Time logged: ${tl.hours}h — ${tl.title}`, date: tl.createdAt, source: 'Time' });
    });
    projectMeetingList.forEach((m) => {
      if (m.createdAt) items.push({ id: `meeting-${m.id}`, type: 'meeting', title: `Meeting added: ${m.title}`, date: m.createdAt, source: 'Meetings' });
    });
    projectDocumentList.forEach((d) => {
      if (d.createdAt) items.push({ id: `doc-${d.id}`, type: 'document', title: `Document added: ${d.name}`, date: d.createdAt, source: 'Documents' });
    });
    projectFinanceList.forEach((f) => {
      if (f.createdAt) items.push({ id: `finance-${f.id}`, type: 'finance', title: `Finance item added: ${f.title} (${f.type})`, date: f.createdAt, source: 'Finance' });
    });
    relatedMessages.forEach((m) => {
      const date = m.createdAt || m.sentDate;
      if (date) items.push({ id: `msg-${m.id}`, type: 'message', title: `Message ${m.personName ? `to ${m.personName}` : ''} via ${m.channel || 'unknown channel'}`, date, source: 'Messages' });
    });
    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [projectTaskList, projectTimeLogList, projectMeetingList, projectDocumentList, projectFinanceList, relatedMessages]);

  const handleInlineUpdate = async (field: string, value: any) => {
    setInlineSaving((prev) => ({ ...prev, [field]: true }));
    try {
      await onUpdateProject(project.id, { name: project.name, [field]: value } as any);
    } catch (e) {
      console.error(`Failed to update ${field}`, e);
    } finally {
      setInlineSaving((prev) => ({ ...prev, [field]: false }));
    }
  };

  const handleQuickNoteSave = async () => {
    if (!noteText.trim()) return;
    try {
      await onUpdateProject(project.id, { name: project.name, notes: noteText.trim() });
      setShowNoteInput(false);
      setNoteText('');
    } catch (e) {
      console.error('Failed to save note', e);
    }
  };

  const typeLabel = (type?: string) => {
    const labels: Record<string, string> = { portfolio: 'Portfolio', client: 'Client', personal_product: 'Personal', case_study: 'Case Study', learning: 'Learning', experiment: 'Experiment' };
    return labels[type || ''] || type || '—';
  };
  const phaseLabel = (phase?: string) => {
    const labels: Record<string, string> = { idea: 'Idea', research: 'Research', ux_audit: 'UX Audit', wireframes: 'Wireframes', ui_design: 'UI Design', prototype: 'Prototype', case_study: 'Case Study', published: 'Published', archived: 'Archived' };
    return labels[phase || ''] || phase || '—';
  };

  // ── Kanban columns ──
  const kanbanCols = useMemo(() => ({
    todo: projectTaskList.filter((t) => t.status === 'todo'),
    doing: projectTaskList.filter((t) => t.status === 'doing'),
    done: projectTaskList.filter((t) => t.status === 'done'),
    blocked: projectTaskList.filter((t) => t.status === 'blocked'),
  }), [projectTaskList]);

  const kanbanStatuses: { key: string; label: string; color: string }[] = [
    { key: 'todo', label: 'Todo', color: 'bg-[#f1f5f9]' },
    { key: 'doing', label: 'Doing', color: 'bg-[#eff6ff]' },
    { key: 'done', label: 'Done', color: 'bg-[#f0fdf4]' },
    { key: 'blocked', label: 'Blocked', color: 'bg-[#fef2f2]' },
  ];

  const allModals = ['task', 'time', 'meeting', 'document', 'finance'] as const;

  return (
    <div className="relative min-h-screen bg-[#f8fafc]">
      {/* ── Sticky Header ── */}
      <div className="sticky top-0 z-30 bg-[#f8fafc] border-b border-[#e5e7eb] shadow-sm">
        <div className="max-w-full px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <button type="button" onClick={onBack} className="text-xs px-2.5 py-1 rounded-md border border-[#e5e7eb] bg-white text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc] flex items-center gap-1 transition-all">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              Back
            </button>
            <Button variant="secondary" onClick={onEditProject}>Edit Project</Button>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-[#0f172a]">{project.name}</h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${typeColors[project.type || ''] || 'bg-[#f1f5f9] text-[#475569]'}`}>{typeLabel(project.type)}</span>
            </div>
          </div>

          {/* Inline editable fields */}
          <div className="flex flex-wrap items-center gap-3 mt-2">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Status</span>
              <select value={project.status || 'planned'} onChange={(e) => handleInlineUpdate('status', e.target.value)}
                className="text-xs rounded-md border border-[#e5e7eb] px-2 py-1 bg-white text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#bfdbfe]"
              >
                <option value="planned">Planned</option><option value="active">Active</option><option value="paused">Paused</option>
                <option value="blocked">Blocked</option><option value="completed">Completed</option><option value="archived">Archived</option>
              </select>
              {inlineSaving['status'] && <span className="text-[10px] text-[#94a3b8]">saving...</span>}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Phase</span>
              <select value={project.phase || 'idea'} onChange={(e) => handleInlineUpdate('phase', e.target.value)}
                className="text-xs rounded-md border border-[#e5e7eb] px-2 py-1 bg-white text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#bfdbfe]"
              >
                <option value="idea">Idea</option><option value="research">Research</option><option value="ux_audit">UX Audit</option>
                <option value="wireframes">Wireframes</option><option value="ui_design">UI Design</option><option value="prototype">Prototype</option>
                <option value="case_study">Case Study</option><option value="published">Published</option><option value="archived">Archived</option>
              </select>
              {inlineSaving['phase'] && <span className="text-[10px] text-[#94a3b8]">saving...</span>}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Priority</span>
              <select value={project.priority || 'medium'} onChange={(e) => handleInlineUpdate('priority', e.target.value)}
                className="text-xs rounded-md border border-[#e5e7eb] px-2 py-1 bg-white text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#bfdbfe]"
              >
                <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
              </select>
              {inlineSaving['priority'] && <span className="text-[10px] text-[#94a3b8]">saving...</span>}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Deadline</span>
              <input type="date" value={project.deadline ? project.deadline.slice(0, 10) : ''} onChange={(e) => handleInlineUpdate('deadline', e.target.value || null)}
                className="text-xs rounded-md border border-[#e5e7eb] px-2 py-1 bg-white text-[#0f172a] focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#bfdbfe]"
              />
              {inlineSaving['deadline'] && <span className="text-[10px] text-[#94a3b8]">saving...</span>}
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-[#64748b] uppercase tracking-wider">Progress</span>
              <div className="flex items-center gap-1">
                <input type="range" min="0" max="100" value={project.progress ?? 0} onChange={(e) => handleInlineUpdate('progress', parseInt(e.target.value))}
                  className="w-20 h-1.5 accent-[#2563eb] cursor-pointer"
                />
                <span className="text-xs font-medium text-[#0f172a] w-8">{project.progress ?? 0}%</span>
              </div>
              {inlineSaving['progress'] && <span className="text-[10px] text-[#94a3b8]">saving...</span>}
            </div>
          </div>

          <div className="mt-2 max-w-md">
            <ProgressBar value={project.progress ?? 0} />
          </div>

          {project.deadline && daysRemaining !== null && (
            <div className={`mt-1 text-xs ${daysRemaining < 0 ? 'text-[#dc2626] font-medium' : 'text-[#64748b]'}`}>
              {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
            </div>
          )}
        </div>

        {/* Quick Action Bar */}
        <div className="px-4 pb-3 flex flex-wrap gap-1.5">
          <Button variant="primary" onClick={() => { setEditingTask(null); setShowModal('task'); }}>+ Add Task</Button>
          <Button variant="secondary" onClick={() => setShowModal('time')}>+ Log Time</Button>
          <Button variant="secondary" onClick={() => setShowModal('meeting')}>+ Add Meeting</Button>
          <Button variant="secondary" onClick={() => setShowModal('document')}>+ Add Document</Button>
          <Button variant="secondary" onClick={() => setShowModal('finance')}>+ Add Finance Item</Button>
          <Button variant="ghost" onClick={() => { setNoteText(project.notes || ''); setShowNoteInput(true); }}>+ Add Note</Button>
        </div>

        {/* Tab navigation */}
        <div className="px-4 overflow-x-auto">
          <div className="flex gap-0 min-w-max">
            {INTERNAL_TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all ${
                  activeTab === t.id
                    ? 'text-[#1d4ed8] border-[#1d4ed8]'
                    : 'text-[#64748b] border-transparent hover:text-[#0f172a] hover:border-[#cbd5e1]'
                }`}
              >{t.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-full px-4 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_320px] gap-6">

          {/* ── Left Column: Tab Content ── */}
          <div className="space-y-4">

        {activeTab === 'overview' && (
          <div className="space-y-4">
            <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Project Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div><div className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">Current Phase</div><div className="mt-1 text-sm text-[#0f172a]">{phaseLabel(project.phase)}</div></div>
                <div><div className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">Status</div><div className="mt-1 text-sm text-[#0f172a] capitalize">{project.status || '—'}</div></div>
                <div><div className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">Next Action</div><div className="mt-1 text-sm text-[#0f172a]">{project.nextAction || '—'}</div></div>
                <div><div className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium">Deadline</div><div className="mt-1 text-sm text-[#0f172a]">{formatDate(project.deadline)}</div></div>
              </div>
              {project.notes && (
                <div className="mt-4"><div className="text-xs text-[#94a3b8] uppercase tracking-wider font-medium mb-1">Notes</div><p className="text-sm text-[#64748b]">{project.notes}</p></div>
              )}
            </div>

            {/* Activity Feed in Overview */}
            <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
              <h3 className="text-sm font-semibold text-[#0f172a] mb-3 flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Activity
              </h3>
              {activityFeed.length === 0 ? (
                <div className="text-center py-6"><div className="text-sm text-[#64748b]">No activity yet.</div><div className="text-xs text-[#94a3b8] mt-1">Project activity will appear here as you work.</div></div>
              ) : (
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {activityFeed.slice(0, 50).map((item) => (
                    <div key={item.id} className="flex items-start gap-2 text-xs py-1.5 border-b border-[#f1f5f9] last:border-0">
                      <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${
                        item.type === 'task' ? 'bg-[#2563eb]' : item.type === 'time' ? 'bg-[#f59e0b]' : item.type === 'meeting' ? 'bg-[#8b5cf6]' : item.type === 'document' ? 'bg-[#10b981]' : item.type === 'finance' ? 'bg-[#ef4444]' : 'bg-[#94a3b8]'
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[#0f172a] truncate">{item.title}</div>
                        <div className="text-[#94a3b8] mt-0.5">{formatDateTime(item.date)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Tasks Tab / Kanban ── */}
        {activeTab === 'tasks' && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0f172a]">Tasks ({projectTaskList.length})</h3>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => { setEditingTask(null); setShowModal('task'); }}>+ Add Task</Button>
              </div>
            </div>

            {projectTaskList.length === 0 ? (
              <EmptyStateDisplay message="No tasks yet." hint="Add the next concrete action for this project." actionLabel="Add Task" onAction={() => { setEditingTask(null); setShowModal('task'); }} />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {kanbanStatuses.map((col) => {
                  const tasks = kanbanCols[col.key as keyof typeof kanbanCols] || [];
                  return (
                    <div key={col.key} className={`rounded-lg border border-[#e5e7eb] bg-white shadow-sm`}>
                      <div className={`px-3 py-2 border-b border-[#e5e7eb] ${col.color} rounded-t-lg`}>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-[#0f172a]">{col.label}</span>
                          <span className="text-[11px] text-[#64748b] bg-white rounded-full px-1.5 py-0.5 border border-[#e5e7eb]">{tasks.length}</span>
                        </div>
                      </div>
                      <div className="p-2 space-y-2 min-h-[100px]">
                        {tasks.length === 0 ? (
                          <div className="text-[11px] text-[#94a3b8] text-center py-4">No tasks</div>
                        ) : (
                          tasks.map((task) => (
                            <div key={task.id} className="rounded-lg border border-[#e5e7eb] bg-white p-2.5 shadow-sm hover:shadow-md cursor-pointer transition-all hover:border-[#cbd5e1]"
                              onClick={() => setSelectedTask(task)}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <div className="text-xs font-medium text-[#0f172a] flex-1 min-w-0 leading-snug">{task.title}</div>
                                <span className={`shrink-0 inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-medium ${priorityColors[task.priority] || ''}`}>{priorityLabel(task.priority)}</span>
                              </div>
                              {task.description && (
                                <div className="text-[11px] text-[#64748b] mt-1 line-clamp-2">{task.description}</div>
                              )}
                              <div className="flex items-center justify-between mt-1.5">
                                <div className="text-[10px] text-[#94a3b8]">
                                  {task.dueDate ? formatDate(task.dueDate) : ''}
                                  {task.assignedToPersonName || task.assignedToPersonId ? ' · ' : ''}
                                  {task.assignedToPersonName || safePeople.find((p) => p.id === task.assignedToPersonId)?.fullName || ''}
                                </div>
                                <div className="flex gap-0.5">
                                  {col.key !== 'todo' && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); onUpdateTask(task.id, { status: 'todo' as any }); }}
                                      className="px-1.5 py-0.5 text-[10px] rounded border border-[#e5e7eb] text-[#64748b] hover:bg-[#f1f5f9] transition-all"
                                    >← Todo</button>
                                  )}
                                  {col.key !== 'doing' && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); onUpdateTask(task.id, { status: 'doing' as any }); }}
                                      className="px-1.5 py-0.5 text-[10px] rounded border border-[#bfdbfe] text-[#1d4ed8] hover:bg-[#eff6ff] transition-all"
                                    >Doing</button>
                                  )}
                                  {col.key !== 'done' && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); onUpdateTask(task.id, { status: 'done' as any }); }}
                                      className="px-1.5 py-0.5 text-[10px] rounded border border-[#bbf7d0] text-[#166534] hover:bg-[#f0fdf4] transition-all"
                                    >Done</button>
                                  )}
                                  {col.key !== 'blocked' && (
                                    <button type="button" onClick={(e) => { e.stopPropagation(); onUpdateTask(task.id, { status: 'blocked' as any }); }}
                                      className="px-1.5 py-0.5 text-[10px] rounded border border-[#fecaca] text-[#dc2626] hover:bg-[#fef2f2] transition-all"
                                    >Blocked</button>
                                  )}
                                </div>
                              </div>
                              <div className="flex gap-1 mt-1.5 pt-1.5 border-t border-[#f1f5f9]">
                                <button type="button" onClick={(e) => { e.stopPropagation(); setEditingTask(task); setShowModal('task'); }}
                                  className="px-1.5 py-0.5 text-[10px] rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff] transition-all"
                                >Edit</button>
                                <button type="button" onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }}
                                  className="px-1.5 py-0.5 text-[10px] rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2] transition-all"
                                >Del</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── Time Tab ── */}
        {activeTab === 'time' && (
          <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0f172a]">Time Logs <span className="text-[#64748b] font-normal">({totalHours.toFixed(1)}h total)</span></h3>
              <Button variant="primary" onClick={() => setShowModal('time')}>+ Log Time</Button>
            </div>
            {projectTimeLogList.length === 0 ? (
              <EmptyStateDisplay message="No time logged yet." hint="Track work sessions to understand project cost." actionLabel="Log Time" onAction={() => setShowModal('time')} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                  <thead>
                    <tr className="text-xs text-[#475569] bg-[#f8fafc]">
                      <th className="px-3 py-2 rounded-l-lg">Title</th>
                      <th className="px-3 py-2">Hours</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2 rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectTimeLogList.map((log) => (
                      <tr key={log.id} className="border-t border-[#e5e7eb] hover:bg-[#f8fafc] transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="text-sm text-[#0f172a]">{log.title}</div>
                          {log.description && <div className="text-xs text-[#64748b]">{log.description}</div>}
                        </td>
                        <td className="px-3 py-2.5 text-sm font-medium text-[#0f172a]">{log.hours}h</td>
                        <td className="px-3 py-2.5 text-sm text-[#64748b]">{formatDate(log.workDate)}</td>
                        <td className="px-3 py-2.5">
                          <Button variant="danger" onClick={() => onDeleteTimeLog(log.id)}>Delete</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Meetings Tab ── */}
        {activeTab === 'meetings' && (
          <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0f172a]">Meetings ({projectMeetingList.length})</h3>
              <Button variant="primary" onClick={() => setShowModal('meeting')}>+ Add Meeting</Button>
            </div>
            {projectMeetingList.length === 0 ? (
              <EmptyStateDisplay message="No meetings yet." hint="Add kickoff, review, or client call notes." actionLabel="Add Meeting" onAction={() => setShowModal('meeting')} />
            ) : (
              <div className="space-y-3">
                {projectMeetingList.map((meeting) => (
                  <div key={meeting.id} className="rounded-lg border border-[#e5e7eb] p-3.5 hover:shadow-sm transition-shadow">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="text-sm font-medium text-[#0f172a]">{meeting.title}</div>
                        <div className="text-xs text-[#64748b] mt-0.5">{formatDate(meeting.meetingDate)}{meeting.attendees ? ` — ${meeting.attendees}` : ''}</div>
                      </div>
                      <Button variant="danger" onClick={() => onDeleteMeeting(meeting.id)}>Delete</Button>
                    </div>
                    {meeting.agenda && <div className="mt-2 text-xs text-[#64748b]"><span className="font-medium text-[#475569]">Agenda:</span> {meeting.agenda}</div>}
                    {meeting.notes && <div className="mt-1 text-xs text-[#64748b]"><span className="font-medium text-[#475569]">Notes:</span> {meeting.notes}</div>}
                    {meeting.outcome && <div className="mt-1 text-xs text-[#64748b]"><span className="font-medium text-[#475569]">Outcome:</span> {meeting.outcome}</div>}
                    {meeting.nextAction && <div className="mt-1 text-xs text-[#64748b]"><span className="font-medium text-[#475569]">Next:</span> {meeting.nextAction}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Finance Tab ── */}
        {activeTab === 'finance' && (
          <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
              <StatCard title="Income" value={`${financeStats.income.toLocaleString()}`} />
              <StatCard title="Expenses" value={`${financeStats.expenses.toLocaleString()}`} />
              <StatCard title="Unpaid" value={`${financeStats.unpaid.toLocaleString()}`} className={financeStats.unpaid > 0 ? 'bg-[#fef2f2]' : ''} />
              <StatCard title="Paid" value={`${financeStats.paid.toLocaleString()}`} />
            </div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0f172a]">Items ({projectFinanceList.length})</h3>
              <Button variant="primary" onClick={() => setShowModal('finance')}>+ Add Finance Item</Button>
            </div>
            {projectFinanceList.length === 0 ? (
              <EmptyStateDisplay message="No finance items yet." hint="Track invoices, payments, and expenses." actionLabel="Add Finance Item" onAction={() => setShowModal('finance')} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                  <thead>
                    <tr className="text-xs text-[#475569] bg-[#f8fafc]">
                      <th className="px-3 py-2 rounded-l-lg">Title</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Amount</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Due</th>
                      <th className="px-3 py-2">Paid</th>
                      <th className="px-3 py-2 rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectFinanceList.map((item) => (
                      <tr key={item.id} className="border-t border-[#e5e7eb] hover:bg-[#f8fafc] transition-colors">
                        <td className="px-3 py-2.5 text-sm text-[#0f172a] font-medium">{item.title}</td>
                        <td className="px-3 py-2.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${financeTypeColors[item.type] || 'bg-[#f1f5f9] text-[#475569]'}`}>{item.type}</span></td>
                        <td className="px-3 py-2.5 text-sm font-medium text-[#0f172a]">{item.amount.toLocaleString()} {item.currency || ''}</td>
                        <td className="px-3 py-2.5"><span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${financeStatusColors[item.status] || 'bg-[#f1f5f9] text-[#475569]'}`}>{item.status}</span></td>
                        <td className="px-3 py-2.5 text-sm text-[#64748b]">{formatDate(item.dueDate)}</td>
                        <td className="px-3 py-2.5 text-sm text-[#64748b]">{formatDate(item.paidDate)}</td>
                        <td className="px-3 py-2.5"><Button variant="danger" onClick={() => onDeleteFinanceItem(item.id)}>Delete</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Documents Tab ── */}
        {activeTab === 'documents' && (
          <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0f172a]">Documents ({projectDocumentList.length})</h3>
              <Button variant="primary" onClick={() => setShowModal('document')}>+ Add Document</Button>
            </div>
            {projectDocumentList.length === 0 ? (
              <EmptyStateDisplay message="No documents yet." hint="Add contracts, briefs, invoices, or useful links." actionLabel="Add Document" onAction={() => setShowModal('document')} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                  <thead>
                    <tr className="text-xs text-[#475569] bg-[#f8fafc]">
                      <th className="px-3 py-2 rounded-l-lg">Name</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">URL</th>
                      <th className="px-3 py-2 rounded-r-lg">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectDocumentList.map((doc) => (
                      <tr key={doc.id} className="border-t border-[#e5e7eb] hover:bg-[#f8fafc] transition-colors">
                        <td className="px-3 py-2.5">
                          <div className="text-sm font-medium text-[#0f172a]">{doc.name}</div>
                          {doc.notes && <div className="text-xs text-[#64748b]">{doc.notes}</div>}
                        </td>
                        <td className="px-3 py-2.5 text-sm text-[#64748b]">{docTypeLabels[doc.type] || doc.type}</td>
                        <td className="px-3 py-2.5 text-sm text-[#64748b]">{doc.status || '—'}</td>
                        <td className="px-3 py-2.5">{doc.url ? <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2563eb] hover:underline">Open ↗</a> : <span className="text-xs text-[#94a3b8]">—</span>}</td>
                        <td className="px-3 py-2.5"><Button variant="danger" onClick={() => onDeleteDocument(doc.id)}>Delete</Button></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Messages Tab ── */}
        {activeTab === 'messages' && (
          <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Related Messages ({relatedMessages.length})</h3>
            {relatedMessages.length === 0 ? (
              <EmptyStateDisplay message="No related messages yet." hint="Messages linked to this project's company or person will appear here." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left table-auto">
                  <thead>
                    <tr className="text-xs text-[#475569] bg-[#f8fafc]">
                      <th className="px-3 py-2 rounded-l-lg">Person</th>
                      <th className="px-3 py-2">Company</th>
                      <th className="px-3 py-2">Channel</th>
                      <th className="px-3 py-2">Type</th>
                      <th className="px-3 py-2">Date</th>
                      <th className="px-3 py-2 rounded-r-lg">Reply</th>
                    </tr>
                  </thead>
                  <tbody>
                    {relatedMessages.map((m) => (
                      <tr key={m.id} className="border-t border-[#e5e7eb] hover:bg-[#f8fafc] transition-colors">
                        <td className="px-3 py-2.5 text-sm text-[#0f172a]">{m.personName || '—'}</td>
                        <td className="px-3 py-2.5 text-sm text-[#0f172a]">{m.companyName || '—'}</td>
                        <td className="px-3 py-2.5 text-sm text-[#0f172a]">{m.channel || '—'}</td>
                        <td className="px-3 py-2.5 text-sm text-[#0f172a]">{m.messageType || '—'}</td>
                        <td className="px-3 py-2.5 text-sm text-[#0f172a]">{m.sentDate ? formatDate(m.sentDate) : '—'}</td>
                        <td className="px-3 py-2.5 text-sm text-[#0f172a]">{m.replyStatus || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Notes Tab ── */}
        {activeTab === 'notes' && (
          <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0f172a]">Project Notes</h3>
              <Button variant="secondary" onClick={() => { setNoteText(project.notes || ''); setShowNoteInput(!showNoteInput); }}>
                {showNoteInput ? 'Cancel' : project.notes ? 'Edit' : 'Add Note'}
              </Button>
            </div>

            {showNoteInput ? (
              <div className="space-y-3">
                <FormTextarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Write your notes here..." rows={4} />
                <div className="flex gap-2">
                  <Button variant="primary" onClick={handleQuickNoteSave} disabled={!noteText.trim()}>Save Note</Button>
                  <Button variant="secondary" onClick={() => setShowNoteInput(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-[#64748b] whitespace-pre-wrap">{project.notes || 'No notes yet.'}</p>
            )}

            <div className="mt-6 pt-4 border-t border-[#e5e7eb]">
              <h4 className="text-sm font-semibold text-[#0f172a] mb-2">Next Action</h4>
              <p className="text-sm text-[#64748b]">{project.nextAction || 'No next action set.'}</p>
            </div>
          </div>
        )}

        {/* ── Activity Tab ── */}
        {activeTab === 'activity' && (
          <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
            <h3 className="text-sm font-semibold text-[#0f172a] mb-3">Activity Timeline</h3>
            {activityFeed.length === 0 ? (
              <EmptyStateDisplay message="No activity yet." hint="Project activity will appear here as you work." />
            ) : (
              <div className="space-y-2">
                {activityFeed.map((item) => (
                  <div key={item.id} className="flex items-start gap-3 py-2 border-b border-[#f1f5f9] last:border-0">
                    <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                      item.type === 'task' ? 'bg-[#2563eb]' : item.type === 'time' ? 'bg-[#f59e0b]' : item.type === 'meeting' ? 'bg-[#8b5cf6]' : item.type === 'document' ? 'bg-[#10b981]' : item.type === 'finance' ? 'bg-[#ef4444]' : 'bg-[#94a3b8]'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm text-[#0f172a]">{item.title}</div>
                      <div className="text-xs text-[#94a3b8] mt-0.5 flex items-center gap-2">
                        <span>{item.source}</span>
                        <span>·</span>
                        <span>{formatDateTime(item.date)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div> {/* end left column */}

      {/* ── Right Sidebar ── */}
      <div className="space-y-4">
        <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
          <h3 className="text-xs font-semibold text-[#0f172a] uppercase tracking-wider mb-3">Project Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#64748b]">Status</span><span className="font-medium text-[#0f172a] capitalize">{project.status || '—'}</span></div>
            <div className="flex justify-between"><span className="text-[#64748b]">Phase</span><span className="font-medium text-[#0f172a]">{phaseLabel(project.phase)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748b]">Priority</span><span className={`font-medium ${priorityColors[project.priority || ''] || ''}`}>{priorityLabel(project.priority)}</span></div>
            <div className="flex justify-between"><span className="text-[#64748b]">Progress</span><span className="font-medium text-[#0f172a]">{project.progress ?? 0}%</span></div>
          </div>
          <div className="mt-3"><ProgressBar value={project.progress ?? 0} /></div>
        </div>

        <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
          <h3 className="text-xs font-semibold text-[#0f172a] uppercase tracking-wider mb-3">Quick Stats</h3>
          <div className="grid grid-cols-2 gap-2">
            <StatCard title="Tasks" value={taskStats.open} />
            <StatCard title="Done" value={taskStats.completed} />
            <StatCard title="Hours" value={totalHours.toFixed(1)} />
            <StatCard title="Meetings" value={projectMeetingList.length} />
          </div>
        </div>

        <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
          <h3 className="text-xs font-semibold text-[#0f172a] uppercase tracking-wider mb-3">Finance</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-[#64748b]">Income</span><span className="font-medium text-[#0f172a]">{(financeStats.income || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[#64748b]">Expenses</span><span className="font-medium text-[#0f172a]">{(financeStats.expenses || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[#64748b]">Unpaid</span><span className={`font-medium ${financeStats.unpaid > 0 ? 'text-[#dc2626]' : 'text-[#0f172a]'}`}>{(financeStats.unpaid || 0).toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-[#64748b]">Paid</span><span className="font-medium text-[#0f172a]">{(financeStats.paid || 0).toLocaleString()}</span></div>
          </div>
        </div>

        <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
          <h3 className="text-xs font-semibold text-[#0f172a] uppercase tracking-wider mb-3">Linked</h3>
          <div className="space-y-2 text-sm">
            {company ? (
              <div>
                <div className="text-xs text-[#94a3b8] uppercase">Company</div>
                <div className="font-medium text-[#0f172a]">{company.name}</div>
                {company.industry && <div className="text-[#64748b] text-xs">{company.industry}</div>}
              </div>
            ) : (
              <div><div className="text-xs text-[#94a3b8] uppercase">Company</div><div className="text-[#64748b]">No company linked</div></div>
            )}
            {person1 ? (
              <div className="mt-2">
                <div className="text-xs text-[#94a3b8] uppercase">Person</div>
                <div className="font-medium text-[#0f172a]">{person1.fullName}</div>
                {person1.role && <div className="text-[#64748b] text-xs">{person1.role}</div>}
              </div>
            ) : (
              <div className="mt-2"><div className="text-xs text-[#94a3b8] uppercase">Person</div><div className="text-[#64748b]">No person linked</div></div>
            )}
          </div>
        </div>

        {project.nextAction && (
          <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
            <h3 className="text-xs font-semibold text-[#0f172a] uppercase tracking-wider mb-1">Next Action</h3>
            <p className="text-sm text-[#64748b]">{project.nextAction}</p>
          </div>
        )}

        {(project.portfolioUrl || project.figmaUrl || project.githubUrl) && (
          <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm p-4">
            <h3 className="text-xs font-semibold text-[#0f172a] uppercase tracking-wider mb-2">Links</h3>
            <div className="flex flex-wrap gap-2">
              {project.portfolioUrl && <a href={project.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1 rounded-md border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff] transition-all">Portfolio ↗</a>}
              {project.figmaUrl && <a href={project.figmaUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1 rounded-md border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff] transition-all">Figma ↗</a>}
              {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-2.5 py-1 rounded-md border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff] transition-all">GitHub ↗</a>}
            </div>
          </div>
        )}
      </div> {/* end right sidebar */}

      </div> {/* end grid */}
      </div> {/* end main content */}

      {/* ── Task Detail Drawer ── */}
      {selectedTask && (
        <TaskDrawer
          task={selectedTask}
          people={safePeople}
          onClose={() => setSelectedTask(null)}
          onUpdateStatus={(id, status) => onUpdateTask(id, { status: status as any })}
          onEdit={() => { setEditingTask(selectedTask); setShowModal('task'); setSelectedTask(null); }}
          onDelete={onDeleteTask}
        />
      )}

      {/* ── Modals ── */}
      {showModal === 'task' && (
        <Modal title={editingTask ? 'Edit Task' : 'Add Task'} onClose={() => { setShowModal(null); setEditingTask(null); }}>
          <TaskForm initial={editingTask || undefined} people={safePeople} projectId={project.id}
            onSave={async (data) => {
              try {
                if (editingTask) await onUpdateTask(editingTask.id, data);
                else await onAddTask(data);
                setShowModal(null); setEditingTask(null);
              } catch (e) { console.error('Failed to save task', e); }
            }}
            onCancel={() => { setShowModal(null); setEditingTask(null); }}
          />
        </Modal>
      )}

      {showModal === 'time' && (
        <Modal title="Log Time" onClose={() => setShowModal(null)}>
          <TimeLogForm projectId={project.id} onSave={async (data) => { try { await onAddTimeLog(data); setShowModal(null); } catch (e) { console.error(e); } }} onCancel={() => setShowModal(null)} />
        </Modal>
      )}

      {showModal === 'meeting' && (
        <Modal title="Add Meeting" onClose={() => setShowModal(null)}>
          <MeetingForm projectId={project.id} onSave={async (data) => { try { await onAddMeeting(data); setShowModal(null); } catch (e) { console.error(e); } }} onCancel={() => setShowModal(null)} />
        </Modal>
      )}

      {showModal === 'document' && (
        <Modal title="Add Document" onClose={() => setShowModal(null)}>
          <DocumentForm projectId={project.id} onSave={async (data) => { try { await onAddDocument(data); setShowModal(null); } catch (e) { console.error(e); } }} onCancel={() => setShowModal(null)} />
        </Modal>
      )}

      {showModal === 'finance' && (
        <Modal title="Add Finance Item" onClose={() => setShowModal(null)}>
          <FinanceItemForm projectId={project.id} onSave={async (data) => { try { await onAddFinanceItem(data); setShowModal(null); } catch (e) { console.error(e); } }} onCancel={() => setShowModal(null)} />
        </Modal>
      )}
    </div>
  );
};

export default ProjectDetailView;
