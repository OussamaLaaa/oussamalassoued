import React, { useMemo, useState } from 'react';
import type {
  Company, Deal, OutreachMessage, Person, Project,
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
  { id: 'milestones', label: 'Milestones' },
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
  todo: 'bg-[#f1f5f9] text-[#475569]',
  doing: 'bg-[#dbeafe] text-[#1d4ed8]',
  done: 'bg-[#dcfce7] text-[#166534]',
  blocked: 'bg-[#fef2f2] text-[#991b1b]',
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
  contract: 'Contract',
  invoice: 'Invoice',
  agreement: 'Agreement',
  brief: 'Brief',
  receipt: 'Receipt',
  link: 'Link',
  document: 'Document',
  other: 'Other',
};

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full bg-[#e5e7eb] rounded-full h-2 overflow-hidden">
    <div className="h-full rounded-full bg-[#2563eb] transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

const StatCard: React.FC<{ title: string; value: string | number; className?: string }> = ({ title, value, className }) => (
  <div className={`rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm ${className || ''}`}>
    <div className="text-xs font-mono uppercase text-[#64748b]">{title}</div>
    <div className="mt-1 text-2xl font-semibold text-[#0f172a]">{value}</div>
  </div>
);

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={onClose}>
    <div className="bg-white rounded-lg border border-[#e5e7eb] shadow-lg w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#e5e7eb]">
        <h3 className="font-medium text-[#0f172a]">{title}</h3>
        <button type="button" onClick={onClose} className="text-[#64748b] hover:text-[#0f172a] text-lg leading-none">&times;</button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  </div>
);

const FormField: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="mb-3">
    <label className="block text-xs font-medium text-[#475569] mb-1">{label}</label>
    {children}
  </div>
);

const FormInput: React.FC<React.InputHTMLAttributes<HTMLInputElement>> = (props) => (
  <input {...props} className="w-full rounded border border-[#e5e7eb] px-2.5 py-1.5 text-sm text-[#0f172a] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#bfdbfe]" />
);

const FormTextarea: React.FC<React.TextareaHTMLAttributes<HTMLTextAreaElement>> = (props) => (
  <textarea {...props} className="w-full rounded border border-[#e5e7eb] px-2.5 py-1.5 text-sm text-[#0f172a] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#bfdbfe] resize-none" />
);

const FormSelect: React.FC<React.SelectHTMLAttributes<HTMLSelectElement> & { options: { value: string; label: string }[] }> = ({ options, ...props }) => (
  <select {...props} className="w-full rounded border border-[#e5e7eb] px-2.5 py-1.5 text-sm text-[#0f172a] bg-white focus:outline-none focus:border-[#2563eb] focus:ring-1 focus:ring-[#bfdbfe]">
    {options.map((opt) => (
      <option key={opt.value} value={opt.value}>{opt.label}</option>
    ))}
  </select>
);

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'danger' }> = ({ variant = 'secondary', ...props }) => {
  const base = 'text-xs px-3 py-1.5 rounded font-medium';
  const variants: Record<string, string> = {
    primary: 'bg-[#2563eb] text-white hover:bg-[#1d4ed8] border border-[#2563eb]',
    secondary: 'border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]',
    danger: 'border border-[#fecaca] bg-white text-[#dc2626] hover:bg-[#fef2f2]',
  };
  return <button {...props} className={`${base} ${variants[variant]} ${props.className || ''}`} />;
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
          { value: 'todo', label: 'Todo' },
          { value: 'doing', label: 'Doing' },
          { value: 'done', label: 'Done' },
          { value: 'blocked', label: 'Blocked' },
        ]} /></FormField>
        <FormField label="Priority"><FormSelect value={priority} onChange={(e) => setPriority(e.target.value)} options={[
          { value: 'low', label: 'Low' },
          { value: 'medium', label: 'Medium' },
          { value: 'high', label: 'High' },
        ]} /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Due Date"><FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></FormField>
        <FormField label="Assign To"><FormSelect value={assignedToPersonId} onChange={(e) => setAssignedToPersonId(e.target.value)} options={[
          { value: '', label: 'Unassigned' },
          ...people.map((p) => ({ value: p.id, label: p.fullName })),
        ]} /></FormField>
      </div>
      <div className="flex gap-2 justify-end mt-4">
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
    onSave({
      projectId,
      title: title.trim(),
      description: description.trim() || undefined,
      hours: parseFloat(hours),
      workDate,
    });
  };

  return (
    <div>
      <FormField label="Title *"><FormInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Time log title" /></FormField>
      <FormField label="Description"><FormTextarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional description" rows={2} /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Hours *"><FormInput type="number" step="0.5" min="0" value={hours} onChange={(e) => setHours(e.target.value)} placeholder="e.g. 2.5" /></FormField>
        <FormField label="Date"><FormInput type="date" value={workDate} onChange={(e) => setWorkDate(e.target.value)} /></FormField>
      </div>
      <div className="flex gap-2 justify-end mt-4">
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
    onSave({
      projectId,
      title: title.trim(),
      meetingDate,
      attendees: attendees.trim() || undefined,
      agenda: agenda.trim() || undefined,
      notes: notes.trim() || undefined,
      outcome: outcome.trim() || undefined,
      nextAction: nextAction.trim() || undefined,
    });
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
      <div className="flex gap-2 justify-end mt-4">
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
    onSave({
      projectId,
      name: name.trim(),
      type: type as ProjectDocumentInput['type'],
      status: status.trim() || undefined,
      url: url.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div>
      <FormField label="Name *"><FormInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Document name" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type"><FormSelect value={type} onChange={(e) => setType(e.target.value)} options={[
          { value: 'contract', label: 'Contract' },
          { value: 'invoice', label: 'Invoice' },
          { value: 'agreement', label: 'Agreement' },
          { value: 'brief', label: 'Brief' },
          { value: 'receipt', label: 'Receipt' },
          { value: 'link', label: 'Link' },
          { value: 'document', label: 'Document' },
          { value: 'other', label: 'Other' },
        ]} /></FormField>
        <FormField label="Status"><FormInput value={status} onChange={(e) => setStatus(e.target.value)} placeholder="e.g. draft, signed" /></FormField>
      </div>
      <FormField label="URL"><FormInput value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></FormField>
      <FormField label="Notes"><FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} /></FormField>
      <div className="flex gap-2 justify-end mt-4">
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
    onSave({
      projectId,
      title: title.trim(),
      type: type as ProjectFinanceItemInput['type'],
      amount: parseFloat(amount),
      currency: currency || undefined,
      status: status as ProjectFinanceItemInput['status'],
      dueDate: dueDate || undefined,
      paidDate: paidDate || undefined,
      notes: notes.trim() || undefined,
    });
  };

  return (
    <div>
      <FormField label="Title *"><FormInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Finance item title" /></FormField>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Type"><FormSelect value={type} onChange={(e) => setType(e.target.value)} options={[
          { value: 'income', label: 'Income' },
          { value: 'expense', label: 'Expense' },
          { value: 'invoice', label: 'Invoice' },
          { value: 'payment', label: 'Payment' },
          { value: 'investment', label: 'Investment' },
        ]} /></FormField>
        <FormField label="Status"><FormSelect value={status} onChange={(e) => setStatus(e.target.value)} options={[
          { value: 'planned', label: 'Planned' },
          { value: 'sent', label: 'Sent' },
          { value: 'paid', label: 'Paid' },
          { value: 'unpaid', label: 'Unpaid' },
          { value: 'overdue', label: 'Overdue' },
          { value: 'cancelled', label: 'Cancelled' },
        ]} /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Amount *"><FormInput type="number" step="0.01" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" /></FormField>
        <FormField label="Currency"><FormSelect value={currency} onChange={(e) => setCurrency(e.target.value)} options={[
          { value: 'TND', label: 'TND' },
          { value: 'USD', label: 'USD' },
          { value: 'EUR', label: 'EUR' },
          { value: 'AED', label: 'AED' },
        ]} /></FormField>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <FormField label="Due Date"><FormInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></FormField>
        <FormField label="Paid Date"><FormInput type="date" value={paidDate} onChange={(e) => setPaidDate(e.target.value)} /></FormField>
      </div>
      <FormField label="Notes"><FormTextarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" rows={2} /></FormField>
      <div className="flex gap-2 justify-end mt-4">
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
  onBack, onEditProject,
  onAddTask, onUpdateTask, onDeleteTask,
  onAddTimeLog, onDeleteTimeLog,
  onAddMeeting, onDeleteMeeting,
  onAddDocument, onDeleteDocument,
  onAddFinanceItem, onDeleteFinanceItem,
}) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('overview');
  const [showModal, setShowModal] = useState<string | null>(null);
  const [editingTask, setEditingTask] = useState<ProjectTask | null>(null);

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

  const projectTaskList = useMemo(
    () => safeProjectTasks.filter((t) => t.projectId === project.id),
    [safeProjectTasks, project.id],
  );

  const projectTimeLogList = useMemo(
    () => safeProjectTimeLogs.filter((t) => t.projectId === project.id),
    [safeProjectTimeLogs, project.id],
  );

  const projectMeetingList = useMemo(
    () => safeProjectMeetings.filter((m) => m.projectId === project.id),
    [safeProjectMeetings, project.id],
  );

  const projectDocumentList = useMemo(
    () => safeProjectDocuments.filter((d) => d.projectId === project.id),
    [safeProjectDocuments, project.id],
  );

  const projectFinanceList = useMemo(
    () => safeProjectFinanceItems.filter((f) => f.projectId === project.id),
    [safeProjectFinanceItems, project.id],
  );

  const daysRemaining = useMemo(() => {
    if (!project.deadline) return null;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const deadline = new Date(project.deadline);
    deadline.setHours(0, 0, 0, 0);
    const diff = Math.round((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  }, [project.deadline]);

  const taskStats = useMemo(() => ({
    open: projectTaskList.filter((t) => t.status === 'todo' || t.status === 'doing').length,
    completed: projectTaskList.filter((t) => t.status === 'done').length,
    blocked: projectTaskList.filter((t) => t.status === 'blocked').length,
  }), [projectTaskList]);

  const totalHours = useMemo(() =>
    projectTimeLogList.reduce((sum, t) => sum + (t.hours || 0), 0),
  [projectTimeLogList]);

  const financeStats = useMemo(() => ({
    income: projectFinanceList.filter((f) => f.type === 'income' || f.type === 'invoice' || f.type === 'payment').reduce((sum, f) => sum + (f.amount || 0), 0),
    expenses: projectFinanceList.filter((f) => f.type === 'expense').reduce((sum, f) => sum + (f.amount || 0), 0),
    unpaid: projectFinanceList.filter((f) => f.status === 'unpaid' || f.status === 'overdue').reduce((sum, f) => sum + (f.amount || 0), 0),
    paid: projectFinanceList.filter((f) => f.status === 'paid').reduce((sum, f) => sum + (f.amount || 0), 0),
  }), [projectFinanceList]);

  const company = useMemo(() => safeCompanies.find((c) => c.id === project.relatedCompanyId), [safeCompanies, project.relatedCompanyId]);
  const person = useMemo(() => safePeople.find((p) => p.id === project.relatedPersonId), [safePeople, project.relatedPersonId]);

  const typeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      portfolio: 'Portfolio', client: 'Client', personal_product: 'Personal',
      case_study: 'Case Study', learning: 'Learning', experiment: 'Experiment',
    };
    return labels[type || ''] || type || '—';
  };

  const phaseLabel = (phase?: string) => {
    const labels: Record<string, string> = {
      idea: 'Idea', research: 'Research', ux_audit: 'UX Audit',
      wireframes: 'Wireframes', ui_design: 'UI Design', prototype: 'Prototype',
      case_study: 'Case Study', published: 'Published', archived: 'Archived',
    };
    return labels[phase || ''] || phase || '—';
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';
    try { return new Date(date).toLocaleDateString(); } catch { return '—'; }
  };

  const priorityLabel = (p?: string) => {
    const labels: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' };
    return labels[p || ''] || p || '—';
  };

  return (
    <section className="space-y-4">
      {/* Back button */}
      <button type="button" onClick={onBack} className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc] flex items-center gap-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Projects
      </button>

      {/* Header */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-2 flex-1 min-w-0">
            <h2 className="text-xl font-semibold text-[#0f172a]">{project.name}</h2>
            <div className="flex flex-wrap items-center gap-1.5">
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${typeColors[project.type || ''] || 'bg-[#f1f5f9] text-[#475569]'}`}>{typeLabel(project.type)}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${stageColors[project.status || ''] || 'bg-[#f1f5f9] text-[#475569]'}`}>{project.status || '—'}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${phaseColors[project.phase || ''] || 'bg-[#f1f5f9] text-[#475569]'}`}>{phaseLabel(project.phase)}</span>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[project.priority || ''] || 'bg-[#f1f5f9] text-[#475569]'}`}>{priorityLabel(project.priority)}</span>
            </div>
            <div className="max-w-sm">
              <div className="flex items-center gap-2 text-xs text-[#64748b] mb-0.5">
                <span>Progress</span><span className="font-medium text-[#0f172a]">{project.progress ?? 0}%</span>
              </div>
              <ProgressBar value={project.progress ?? 0} />
            </div>
            {project.deadline && (
              <div className="text-xs text-[#64748b]">
                Deadline: <span className="font-medium text-[#0f172a]">{formatDate(project.deadline)}</span>
                {daysRemaining !== null && (
                  <span className={`ml-1 ${daysRemaining < 0 ? 'text-[#dc2626] font-medium' : ''}`}>
                    ({daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d remaining`})
                  </span>
                )}
              </div>
            )}
          </div>
          <Button variant="secondary" onClick={onEditProject}>Edit Project</Button>
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <Button variant="primary" onClick={() => setShowModal('task')}>+ Add Task</Button>
        <Button variant="secondary" onClick={() => setShowModal('time')}>+ Log Time</Button>
        <Button variant="secondary" onClick={() => setShowModal('meeting')}>+ Add Meeting</Button>
        <Button variant="secondary" onClick={() => setShowModal('document')}>+ Add Document</Button>
        <Button variant="secondary" onClick={() => setShowModal('finance')}>+ Add Finance Item</Button>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
        <StatCard title="Open Tasks" value={taskStats.open} />
        <StatCard title="Completed" value={taskStats.completed} />
        <StatCard title="Hours Logged" value={totalHours.toFixed(1)} />
        <StatCard title="Meetings" value={projectMeetingList.length} />
        <StatCard title="Documents" value={projectDocumentList.length} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatCard title="Income" value={`${financeStats.income.toLocaleString()} ${projectFinanceList[0]?.currency || ''}`} />
        <StatCard title="Expenses" value={`${financeStats.expenses.toLocaleString()} ${projectFinanceList[0]?.currency || ''}`} />
        <StatCard title="Unpaid" value={`${financeStats.unpaid.toLocaleString()} ${projectFinanceList[0]?.currency || ''}`} className={financeStats.unpaid > 0 ? 'bg-[#fef2f2]' : ''} />
        <StatCard title="Deadline" value={daysRemaining !== null ? (daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d`) : '—'} className={daysRemaining !== null && daysRemaining < 0 ? 'bg-[#fef2f2]' : ''} />
      </div>

      {/* Internal tabs */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
        <div className="border-b border-[#e5e7eb] px-3 pt-1.5 overflow-x-auto">
          <div className="flex gap-0.5 min-w-max">
            {INTERNAL_TABS.map((t) => (
              <button key={t.id} type="button" onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 text-xs font-medium rounded-t-md transition-all ${
                  activeTab === t.id
                    ? 'bg-[#eff6ff] text-[#1d4ed8] border border-b-0 border-[#bfdbfe]'
                    : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'
                }`}
              >{t.label}</button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {/* ── Overview Tab ── */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><h4 className="text-sm font-medium text-[#0f172a] mb-1">Current Phase</h4><p className="text-sm text-[#64748b]">{phaseLabel(project.phase)}</p></div>
                <div><h4 className="text-sm font-medium text-[#0f172a] mb-1">Status</h4><p className="text-sm text-[#64748b] capitalize">{project.status || '—'}</p></div>
                <div><h4 className="text-sm font-medium text-[#0f172a] mb-1">Next Action</h4><p className="text-sm text-[#64748b]">{project.nextAction || '—'}</p></div>
                <div><h4 className="text-sm font-medium text-[#0f172a] mb-1">Deadline</h4><p className="text-sm text-[#64748b]">{formatDate(project.deadline)}</p></div>
              </div>

              {project.notes && (
                <div><h4 className="text-sm font-medium text-[#0f172a] mb-1">Project Notes</h4><p className="text-sm text-[#64748b] whitespace-pre-wrap">{project.notes}</p></div>
              )}

              {(project.portfolioUrl || project.figmaUrl || project.githubUrl) && (
                <div><h4 className="text-sm font-medium text-[#0f172a] mb-2">Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.portfolioUrl && <a href={project.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]">Portfolio ↗</a>}
                    {project.figmaUrl && <a href={project.figmaUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]">Figma ↗</a>}
                    {project.githubUrl && <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]">GitHub ↗</a>}
                  </div>
                </div>
              )}

              {company && (
                <div><h4 className="text-sm font-medium text-[#0f172a] mb-1">Linked Company</h4>
                  <div className="rounded-md border border-[#e5e7eb] bg-[#f8fafc] p-3 text-sm text-[#64748b]">
                    <div className="font-medium text-[#0f172a]">{company.name}</div>
                    {company.industry && <div>Industry: {company.industry}</div>}
                    {company.country && <div>Location: {company.city ? `${company.city}, ` : ''}{company.country}</div>}
                    {company.website && <div>Website: {company.website}</div>}
                  </div>
                </div>
              )}

              {person && (
                <div><h4 className="text-sm font-medium text-[#0f172a] mb-1">Linked Person</h4>
                  <div className="rounded-md border border-[#e5e7eb] bg-[#f8fafc] p-3 text-sm text-[#64748b]">
                    <div className="font-medium text-[#0f172a]">{person.fullName}</div>
                    {person.role && <div>Role: {person.role}</div>}
                    {person.emailPublic && <div>Email: {person.emailPublic}</div>}
                    {person.linkedin && <div>LinkedIn: {person.linkedin}</div>}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Tasks Tab ── */}
          {activeTab === 'tasks' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-[#0f172a]">Tasks ({projectTaskList.length})</h4>
                <Button variant="primary" onClick={() => setShowModal('task')}>+ Add Task</Button>
              </div>
              {projectTaskList.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#64748b]">No tasks yet. Add your first task.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="text-xs text-[#475569] bg-[#f8fafc]">
                        <th className="px-3 py-2">Title</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Priority</th>
                        <th className="px-3 py-2">Assignee</th>
                        <th className="px-3 py-2">Due</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectTaskList.map((task) => (
                        <tr key={task.id} className="border-t border-[#e5e7eb]">
                          <td className="px-3 py-2">
                            <div className="text-sm font-medium text-[#0f172a]">{task.title}</div>
                            {task.description && <div className="text-xs text-[#64748b] truncate max-w-[200px]">{task.description}</div>}
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${taskStatusColors[task.status] || 'bg-[#f1f5f9] text-[#475569]'}`}>{task.status}</span>
                          </td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[task.priority] || 'bg-[#f1f5f9] text-[#475569]'}`}>{priorityLabel(task.priority)}</span>
                          </td>
                          <td className="px-3 py-2 text-sm text-[#64748b]">{task.assignedToPersonName || safePeople.find((p) => p.id === task.assignedToPersonId)?.fullName || '—'}</td>
                          <td className="px-3 py-2 text-sm text-[#64748b]">{formatDate(task.dueDate)}</td>
                          <td className="px-3 py-2">
                            <div className="flex items-center gap-1">
                              <select value={task.status} onChange={(e) => onUpdateTask(task.id, { status: e.target.value as any })}
                                className="text-xs rounded border border-[#e5e7eb] px-1.5 py-1 bg-white text-[#0f172a]"
                              >
                                <option value="todo">Todo</option>
                                <option value="doing">Doing</option>
                                <option value="done">Done</option>
                                <option value="blocked">Blocked</option>
                              </select>
                              <button type="button" onClick={() => { setEditingTask(task); setShowModal('task'); }}
                                className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]"
                              >Edit</button>
                              <button type="button" onClick={() => onDeleteTask(task.id)}
                                className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2]"
                              >Del</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── Milestones Tab ── */}
          {activeTab === 'milestones' && (
            <div className="py-8 text-center">
              <div className="text-sm text-[#64748b]">This section will track project milestones.</div>
              <div className="mt-1 text-xs text-[#94a3b8]">Define key milestones and track progress toward each one.</div>
            </div>
          )}

          {/* ── Time Tab ── */}
          {activeTab === 'time' && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-[#0f172a]">Time Logs ({totalHours.toFixed(1)}h total)</h4>
                <Button variant="primary" onClick={() => setShowModal('time')}>+ Log Time</Button>
              </div>
              {projectTimeLogList.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#64748b]">No time logged yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="text-xs text-[#475569] bg-[#f8fafc]">
                        <th className="px-3 py-2">Title</th>
                        <th className="px-3 py-2">Hours</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectTimeLogList.map((log) => (
                        <tr key={log.id} className="border-t border-[#e5e7eb]">
                          <td className="px-3 py-2">
                            <div className="text-sm text-[#0f172a]">{log.title}</div>
                            {log.description && <div className="text-xs text-[#64748b]">{log.description}</div>}
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-[#0f172a]">{log.hours}h</td>
                          <td className="px-3 py-2 text-sm text-[#64748b]">{formatDate(log.workDate)}</td>
                          <td className="px-3 py-2">
                            <button type="button" onClick={() => onDeleteTimeLog(log.id)}
                              className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2]"
                            >Delete</button>
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
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-[#0f172a]">Meetings ({projectMeetingList.length})</h4>
                <Button variant="primary" onClick={() => setShowModal('meeting')}>+ Add Meeting</Button>
              </div>
              {projectMeetingList.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#64748b]">No meetings yet.</div>
              ) : (
                <div className="space-y-3">
                  {projectMeetingList.map((meeting) => (
                    <div key={meeting.id} className="rounded-md border border-[#e5e7eb] p-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-medium text-[#0f172a]">{meeting.title}</div>
                          <div className="text-xs text-[#64748b] mt-0.5">{formatDate(meeting.meetingDate)}{meeting.attendees ? ` — ${meeting.attendees}` : ''}</div>
                        </div>
                        <button type="button" onClick={() => onDeleteMeeting(meeting.id)}
                          className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2]"
                        >Delete</button>
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
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                <StatCard title="Income" value={`${financeStats.income.toLocaleString()}`} />
                <StatCard title="Expenses" value={`${financeStats.expenses.toLocaleString()}`} />
                <StatCard title="Unpaid" value={`${financeStats.unpaid.toLocaleString()}`} className={financeStats.unpaid > 0 ? 'bg-[#fef2f2]' : ''} />
                <StatCard title="Paid" value={`${financeStats.paid.toLocaleString()}`} />
              </div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-[#0f172a]">Items ({projectFinanceList.length})</h4>
                <Button variant="primary" onClick={() => setShowModal('finance')}>+ Add Finance Item</Button>
              </div>
              {projectFinanceList.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#64748b]">No finance items yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="text-xs text-[#475569] bg-[#f8fafc]">
                        <th className="px-3 py-2">Title</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Amount</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Due</th>
                        <th className="px-3 py-2">Paid</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectFinanceList.map((item) => (
                        <tr key={item.id} className="border-t border-[#e5e7eb]">
                          <td className="px-3 py-2 text-sm text-[#0f172a]">{item.title}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${financeTypeColors[item.type] || 'bg-[#f1f5f9] text-[#475569]'}`}>{item.type}</span>
                          </td>
                          <td className="px-3 py-2 text-sm font-medium text-[#0f172a]">{item.amount.toLocaleString()} {item.currency || ''}</td>
                          <td className="px-3 py-2">
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${financeStatusColors[item.status] || 'bg-[#f1f5f9] text-[#475569]'}`}>{item.status}</span>
                          </td>
                          <td className="px-3 py-2 text-sm text-[#64748b]">{formatDate(item.dueDate)}</td>
                          <td className="px-3 py-2 text-sm text-[#64748b]">{formatDate(item.paidDate)}</td>
                          <td className="px-3 py-2">
                            <button type="button" onClick={() => onDeleteFinanceItem(item.id)}
                              className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2]"
                            >Delete</button>
                          </td>
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
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-medium text-[#0f172a]">Documents ({projectDocumentList.length})</h4>
                <Button variant="primary" onClick={() => setShowModal('document')}>+ Add Document</Button>
              </div>
              {projectDocumentList.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#64748b]">No documents yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="text-xs text-[#475569] bg-[#f8fafc]">
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">URL</th>
                        <th className="px-3 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {projectDocumentList.map((doc) => (
                        <tr key={doc.id} className="border-t border-[#e5e7eb]">
                          <td className="px-3 py-2">
                            <div className="text-sm font-medium text-[#0f172a]">{doc.name}</div>
                            {doc.notes && <div className="text-xs text-[#64748b]">{doc.notes}</div>}
                          </td>
                          <td className="px-3 py-2 text-sm text-[#64748b]">{docTypeLabels[doc.type] || doc.type}</td>
                          <td className="px-3 py-2 text-sm text-[#64748b]">{doc.status || '—'}</td>
                          <td className="px-3 py-2">
                            {doc.url ? (
                              <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-xs text-[#2563eb] hover:underline">Open ↗</a>
                            ) : <span className="text-xs text-[#94a3b8]">—</span>}
                          </td>
                          <td className="px-3 py-2">
                            <button type="button" onClick={() => onDeleteDocument(doc.id)}
                              className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2]"
                            >Delete</button>
                          </td>
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
            <div>
              <h4 className="text-sm font-medium text-[#0f172a] mb-3">Related Messages ({relatedMessages.length})</h4>
              {relatedMessages.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#64748b]">No related messages yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="text-xs text-[#475569] bg-[#f8fafc]">
                        <th className="px-3 py-2">Person</th><th className="px-3 py-2">Company</th>
                        <th className="px-3 py-2">Channel</th><th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Date</th><th className="px-3 py-2">Reply</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedMessages.map((m) => (
                        <tr key={m.id} className="border-t border-[#e5e7eb]">
                          <td className="px-3 py-2 text-sm text-[#0f172a]">{m.personName || '—'}</td>
                          <td className="px-3 py-2 text-sm text-[#0f172a]">{m.companyName || '—'}</td>
                          <td className="px-3 py-2 text-sm text-[#0f172a]">{m.channel || '—'}</td>
                          <td className="px-3 py-2 text-sm text-[#0f172a]">{m.messageType || '—'}</td>
                          <td className="px-3 py-2 text-sm text-[#0f172a]">{m.sentDate ? formatDate(m.sentDate) : '—'}</td>
                          <td className="px-3 py-2 text-sm text-[#0f172a]">{m.replyStatus || '—'}</td>
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
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-[#0f172a] mb-1">Project Notes</h4>
                <p className="text-sm text-[#64748b] whitespace-pre-wrap">{project.notes || 'No notes yet.'}</p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-[#0f172a] mb-1">Next Action</h4>
                <p className="text-sm text-[#64748b]">{project.nextAction || 'No next action set.'}</p>
              </div>
              <div className="pt-2">
                <Button variant="secondary" onClick={onEditProject}>Edit Project to update notes</Button>
              </div>
            </div>
          )}

          {/* ── Activity Tab ── */}
          {activeTab === 'activity' && (
            <div className="py-8 text-center">
              <div className="text-sm text-[#64748b]">This section will show project activity timeline.</div>
              <div className="mt-1 text-xs text-[#94a3b8]">Track changes, updates, and key events in chronological order.</div>
            </div>
          )}
        </div>
      </div>

      {/* ── Modals ── */}
      {showModal === 'task' && (
        <Modal title={editingTask ? 'Edit Task' : 'Add Task'} onClose={() => { setShowModal(null); setEditingTask(null); }}>
          <TaskForm
            initial={editingTask || undefined}
            people={safePeople}
            projectId={project.id}
            onSave={async (data) => {
              try {
                if (editingTask) {
                  await onUpdateTask(editingTask.id, data);
                } else {
                  await onAddTask(data);
                }
                setShowModal(null);
                setEditingTask(null);
              } catch (e) {
                console.error('Failed to save task', e);
              }
            }}
            onCancel={() => { setShowModal(null); setEditingTask(null); }}
          />
        </Modal>
      )}

      {showModal === 'time' && (
        <Modal title="Log Time" onClose={() => setShowModal(null)}>
          <TimeLogForm
            projectId={project.id}
            onSave={async (data) => {
              try {
                await onAddTimeLog(data);
                setShowModal(null);
              } catch (e) { console.error('Failed to log time', e); }
            }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}

      {showModal === 'meeting' && (
        <Modal title="Add Meeting" onClose={() => setShowModal(null)}>
          <MeetingForm
            projectId={project.id}
            onSave={async (data) => {
              try {
                await onAddMeeting(data);
                setShowModal(null);
              } catch (e) { console.error('Failed to add meeting', e); }
            }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}

      {showModal === 'document' && (
        <Modal title="Add Document" onClose={() => setShowModal(null)}>
          <DocumentForm
            projectId={project.id}
            onSave={async (data) => {
              try {
                await onAddDocument(data);
                setShowModal(null);
              } catch (e) { console.error('Failed to add document', e); }
            }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}

      {showModal === 'finance' && (
        <Modal title="Add Finance Item" onClose={() => setShowModal(null)}>
          <FinanceItemForm
            projectId={project.id}
            onSave={async (data) => {
              try {
                await onAddFinanceItem(data);
                setShowModal(null);
              } catch (e) { console.error('Failed to add finance item', e); }
            }}
            onCancel={() => setShowModal(null)}
          />
        </Modal>
      )}
    </section>
  );
};

export default ProjectDetailView;
