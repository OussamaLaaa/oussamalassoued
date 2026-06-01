import React, { useMemo, useState } from 'react';
import type {
 Company, Deal, OutreachMessage, Person, Project, ProjectInput,
 ProjectTask, ProjectTaskInput,
 ProjectTimeLog, ProjectTimeLogInput,
 ProjectMeeting, ProjectMeetingInput,
 ProjectDocument, ProjectDocumentInput,
 ProjectFinanceItem, ProjectFinanceItemInput,
} from '../../types/opportunities';
import ProjectDetailView from './ProjectDetailView';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

const stageBadgeVariant: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
 active: 'success',
 planned: 'neutral',
 paused: 'warning',
 blocked: 'danger',
 completed: 'success',
 archived: 'neutral',
};

const priorityBadgeVariant: Record<string, 'danger' | 'warning' | 'neutral'> = {
 high: 'danger',
 medium: 'warning',
 low: 'neutral',
};

const clampProgress = (value: unknown) => {
 const parsed = Number(value);
 if (!Number.isFinite(parsed)) return 0;
 return Math.max(0, Math.min(100, parsed));
};

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
 <div className="w-full bg-neutral-200 rounded-full h-2 overflow-hidden">
 <div className="h-full rounded-full bg-black transition-all duration-300" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
 </div>
);

const StatBox: React.FC<{ label: string; value: string | number; subtitle?: string }> = ({ label, value, subtitle }) => (
 <div className="rounded-xl border border-neutral-200 bg-white p-3 min-w-0">
 <div className="text-xs text-neutral-500 font-medium truncate">{label}</div>
 <div className="mt-0.5 text-xl font-bold text-black leading-tight">{value}</div>
 {subtitle && <div className="mt-0.5 text-xs text-neutral-400 truncate">{subtitle}</div>}
 </div>
);

const ProjectsPanel: React.FC<{
 projects: Project[];
 companies: Company[];
 people: Person[];
 messages: OutreachMessage[];
 deals: Deal[];
 projectTasks: ProjectTask[];
 projectTimeLogs: ProjectTimeLog[];
 projectMeetings: ProjectMeeting[];
 projectDocuments: ProjectDocument[];
 projectFinanceItems: ProjectFinanceItem[];
 onAddProject: () => void;
 onEdit: (project: Project) => void;
 onUpdateProject: (id: string, input: Partial<ProjectInput>) => Promise<any>;
 onDelete: (id: string) => void;
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
}> = ({ projects, companies, people, messages, deals, projectTasks, projectTimeLogs, projectMeetings, projectDocuments, projectFinanceItems, onAddProject, onEdit, onUpdateProject, onDelete, onAddTask, onUpdateTask, onDeleteTask, onAddTimeLog, onDeleteTimeLog, onAddMeeting, onDeleteMeeting, onAddDocument, onDeleteDocument, onAddFinanceItem, onDeleteFinanceItem }) => {
 const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
 const selectedProject = useMemo(
 () => (selectedProjectId ? projects.find((project) => project.id === selectedProjectId) || null : null),
 [projects, selectedProjectId],
 );

 const stats = useMemo(() => ({
 total: projects.length,
 active: projects.filter((p) => p.status === 'active').length,
 planned: projects.filter((p) => p.status === 'planned').length,
 completed: projects.filter((p) => p.status === 'completed').length,
 highPriority: projects.filter((p) => p.priority === 'high').length,
 avgProgress: projects.length > 0 ? Math.round(projects.reduce((s, p) => s + clampProgress(p.progress), 0) / projects.length) : 0,
 }), [projects]);

 const totalHoursLogged = useMemo(
 () => projectTimeLogs.reduce((s, l) => s + (l.hours || 0), 0),
 [projectTimeLogs],
 );

 const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);

 const typeLabel = (type?: string) => {
 const labels: Record<string, string> = {
 portfolio: 'Portfolio', client: 'Client', personal_product: 'Personal',
 case_study: 'Case Study', learning: 'Learning', experiment: 'Experiment',
 };
 return labels[type || ''] || type || '—';
 };

 const phaseLabel = (phase?: string) => {
 const labels: Record<string, string> = {
 idea: 'Idea', research: 'Research', ux_audit: 'UX Audit', wireframes: 'Wireframes',
 ui_design: 'UI Design', prototype: 'Prototype', case_study: 'Case Study',
 published: 'Published', archived: 'Archived',
 };
 return labels[phase || ''] || phase || '—';
 };

 const formatDate = (date?: string) => {
 if (!date) return '—';
 try { return new Date(date).toLocaleDateString(); } catch { return '—'; }
 };

 if (selectedProject) {
 return (
 <ProjectDetailView
 project={selectedProject}
 companies={companies}
 people={people}
 messages={messages}
 deals={deals}
 projectTasks={projectTasks}
 projectTimeLogs={projectTimeLogs}
 projectMeetings={projectMeetings}
 projectDocuments={projectDocuments}
 projectFinanceItems={projectFinanceItems}
 onBack={() => setSelectedProjectId(null)}
 onEditProject={() => {
 onEdit(selectedProject);
 setSelectedProjectId(null);
 }}
 onUpdateProject={onUpdateProject}
 onAddTask={onAddTask}
 onUpdateTask={onUpdateTask}
 onDeleteTask={onDeleteTask}
 onAddTimeLog={onAddTimeLog}
 onDeleteTimeLog={onDeleteTimeLog}
 onAddMeeting={onAddMeeting}
 onDeleteMeeting={onDeleteMeeting}
 onAddDocument={onAddDocument}
 onDeleteDocument={onDeleteDocument}
 onAddFinanceItem={onAddFinanceItem}
 onDeleteFinanceItem={onDeleteFinanceItem}
 />
 );
 }

 return (
 <div className="space-y-6">
 {/* Stats */}
 <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
 <StatBox label="Total Projects" value={stats.total} subtitle="Current total" />
 <StatBox label="Active" value={stats.active} />
 <StatBox label="Planned" value={stats.planned} />
 <StatBox label="Completed" value={stats.completed} />
 <StatBox label="High Priority" value={stats.highPriority} />
 <StatBox label="Avg Progress" value={stats.avgProgress ? `${stats.avgProgress}%` : '—'} />
 </div>

 {/* All Projects */}
 <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
 <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
 <div>
 <h3 className="text-sm font-semibold text-black">All Projects</h3>
 <p className="text-xs text-neutral-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</p>
 </div>
 <Button variant="primary" size="sm" onClick={onAddProject}>+ Add Project</Button>
 </div>

 {projects.length === 0 ? (
 <div className="flex flex-col items-center justify-center py-10 text-xs text-neutral-400">
 <span className="font-medium text-neutral-500">No projects yet</span>
 <span className="mt-1">Add your first project to get started.</span>
 <Button variant="primary" size="sm" className="mt-3" onClick={onAddProject}>+ Add Project</Button>
 </div>
 ) : (
 <div className="overflow-x-auto">
 <table className="w-full text-left">
 <thead>
 <tr className="border-b border-neutral-200 bg-neutral-50">
 <th className="px-3 py-2 text-xs font-medium text-neutral-500">Name</th>
 <th className="px-3 py-2 text-xs font-medium text-neutral-500">Type</th>
 <th className="px-3 py-2 text-xs font-medium text-neutral-500">Status</th>
 <th className="px-3 py-2 text-xs font-medium text-neutral-500">Phase</th>
 <th className="px-3 py-2 text-xs font-medium text-neutral-500">Priority</th>
 <th className="px-3 py-2 text-xs font-medium text-neutral-500">Progress</th>
 <th className="px-3 py-2 text-xs font-medium text-neutral-500">Deadline</th>
 <th className="px-3 py-2 text-xs font-medium text-neutral-500">Company</th>
 <th className="px-3 py-2 text-xs font-medium text-neutral-500">Next Action</th>
 <th className="px-3 py-2 text-xs font-medium text-neutral-500">Actions</th>
 </tr>
 </thead>
 <tbody>
 {projects.map((p) => (
 <tr key={p.id} className="border-t border-neutral-200 hover:bg-neutral-50 cursor-pointer" onClick={() => setSelectedProjectId(p.id)}>
 <td className="px-3 py-3">
 <div className="font-medium text-black text-sm hover:underline truncate max-w-[180px]">{p.name}</div>
 {p.notes && <div className="text-xs text-neutral-500 truncate max-w-[180px]">{p.notes}</div>}
 </td>
 <td className="px-3 py-3 text-xs text-black">{typeLabel(p.type)}</td>
 <td className="px-3 py-3">
 <Badge variant={stageBadgeVariant[p.status || ''] || 'neutral'}>{p.status || '—'}</Badge>
 </td>
 <td className="px-3 py-3 text-xs text-black">{phaseLabel(p.phase)}</td>
 <td className="px-3 py-3">
 {p.priority ? <Badge variant={priorityBadgeVariant[p.priority] || 'neutral'}>{p.priority}</Badge> : <span className="text-xs text-neutral-400">—</span>}
 </td>
 <td className="px-3 py-3 min-w-[100px]">
 <div className="flex items-center gap-2">
 <div className="flex-1"><ProgressBar value={clampProgress(p.progress)} /></div>
 <span className="text-xs text-neutral-500">{clampProgress(p.progress)}%</span>
 </div>
 </td>
 <td className="px-3 py-3 text-xs text-black whitespace-nowrap">{formatDate(p.deadline)}</td>
 <td className="px-3 py-3 text-xs text-black truncate max-w-[120px]">{p.relatedCompanyName || companyById.get(p.relatedCompanyId || '')?.name || '—'}</td>
 <td className="px-3 py-3 text-xs text-neutral-500 truncate max-w-[120px]">{p.nextAction || '—'}</td>
 <td className="px-3 py-3">
 <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
 <Button type="button" variant="outline" size="sm" onClick={() => onEdit(p)}>Edit</Button>
 <Button type="button" variant="danger" size="sm" onClick={() => { if (window.confirm(`Delete project "${p.name}"?`)) onDelete(p.id); }}>Delete</Button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 )}
 </div>
 </div>
 );
};

export default ProjectsPanel;
