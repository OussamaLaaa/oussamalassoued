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
import { Card, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import StatCard from '../ui/StatCard';

const stageBadgeVariant: Record<string, 'success' | 'blue' | 'warning' | 'danger' | 'neutral'> = {
  active: 'success',
  planned: 'blue',
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
    <div
      className="h-full rounded-full bg-black transition-all duration-300"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
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
    portfolio: projects.filter((p) => p.type === 'portfolio').length,
    client: projects.filter((p) => p.type === 'client').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    blocked: projects.filter((p) => p.status === 'blocked').length,
  }), [projects]);

  const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);
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

  const typeLabel = (type?: string) => {
    const labels: Record<string, string> = {
      portfolio: 'Portfolio',
      client: 'Client',
      personal_product: 'Personal',
      case_study: 'Case Study',
      learning: 'Learning',
      experiment: 'Experiment',
    };
    return labels[type || ''] || type || '—';
  };

  const phaseLabel = (phase?: string) => {
    const labels: Record<string, string> = {
      idea: 'Idea',
      research: 'Research',
      ux_audit: 'UX Audit',
      wireframes: 'Wireframes',
      ui_design: 'UI Design',
      prototype: 'Prototype',
      case_study: 'Case Study',
      published: 'Published',
      archived: 'Archived',
    };
    return labels[phase || ''] || phase || '—';
  };

  const formatDate = (date?: string) => {
    if (!date) return '—';
    try {
      return new Date(date).toLocaleDateString();
    } catch {
      return '—';
    }
  };

  return (
    <section className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-black">Projects</h2>
          <p className="mt-1 text-sm text-neutral-500">Track all your work — portfolio, client, case studies, and experiments.</p>
        </div>
        <Button variant="primary" size="sm" onClick={onAddProject}>Add Project</Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="Active" value={stats.active} />
        <StatCard label="Portfolio" value={stats.portfolio} />
        <StatCard label="Client" value={stats.client} />
        <StatCard label="Completed" value={stats.completed} />
        <StatCard label="Blocked" value={stats.blocked} />
      </div>

      {/* Table */}
      <Card>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-medium text-lg text-black">All Projects</h3>
            <span className="text-xs text-neutral-500">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
          </div>

          {projects.length === 0 ? (
            <div className="rounded-lg border border-dashed border-neutral-200 bg-white p-8 text-center">
              <div className="text-sm text-neutral-500">No projects yet. Add your first project.</div>
              <div className="mt-2 text-xs text-neutral-400">Click "Add Project" to track portfolio work, client projects, or case studies.</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left table-auto">
                <thead>
                  <tr className="text-xs text-neutral-600 bg-neutral-50">
                    <th className="px-3 py-2">Name</th>
                    <th className="px-3 py-2">Type</th>
                    <th className="px-3 py-2">Status</th>
                    <th className="px-3 py-2">Phase</th>
                    <th className="px-3 py-2">Priority</th>
                    <th className="px-3 py-2">Progress</th>
                    <th className="px-3 py-2">Deadline</th>
                    <th className="px-3 py-2">Company</th>
                    <th className="px-3 py-2">Next Action</th>
                    <th className="px-3 py-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p) => (
                    <tr key={p.id} className="border-t border-neutral-200 hover:bg-neutral-50 cursor-pointer" onClick={() => setSelectedProjectId(p.id)}>
                      <td className="px-3 py-3">
                        <div className="font-semibold text-black hover:underline">{p.name}</div>
                        {p.notes && <div className="text-xs text-neutral-500 truncate max-w-[200px]">{p.notes}</div>}
                      </td>
                      <td className="px-3 py-3 text-sm text-black">{typeLabel(p.type)}</td>
                      <td className="px-3 py-3">
                        <Badge variant={stageBadgeVariant[p.status || ''] || 'neutral'}>{p.status || '—'}</Badge>
                      </td>
                      <td className="px-3 py-3 text-sm text-black">{phaseLabel(p.phase)}</td>
                      <td className="px-3 py-3">
                        <Badge variant={priorityBadgeVariant[p.priority || ''] || 'neutral'}>{p.priority || '—'}</Badge>
                      </td>
                      <td className="px-3 py-3 min-w-[100px]">
                        <div className="flex items-center gap-2">
                          <ProgressBar value={clampProgress(p.progress)} />
                          <span className="text-xs text-neutral-500">{clampProgress(p.progress)}%</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 text-sm text-black">{formatDate(p.deadline)}</td>
                      <td className="px-3 py-3 text-sm text-black">{p.relatedCompanyName || companyById.get(p.relatedCompanyId || '')?.name || '—'}</td>
                      <td className="px-3 py-3 text-xs text-neutral-500 max-w-[120px] truncate">{p.nextAction || '—'}</td>
                      <td className="px-3 py-3">
                        <div className="flex items-center gap-1">
                          <Button type="button" variant="outline" size="sm" onClick={() => onEdit(p)}>Edit</Button>
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`Delete project "${p.name}"?`)) onDelete(p.id);
                            }}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </Card>
    </section>
  );
};

export default ProjectsPanel;
