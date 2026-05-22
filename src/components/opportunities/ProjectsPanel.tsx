import React, { useMemo, useState } from 'react';
import type { Company, Deal, OutreachMessage, Person, Project } from '../../types/opportunities';
import ProjectDetailView from './ProjectDetailView';

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

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
    <div className="text-xs font-mono uppercase text-[#64748b]">{title}</div>
    <div className="mt-1 text-2xl font-semibold text-[#0f172a]">{value}</div>
  </div>
);

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full bg-[#e5e7eb] rounded-full h-2 overflow-hidden">
    <div
      className="h-full rounded-full bg-[#2563eb] transition-all duration-300"
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
  onAddProject: () => void;
  onEdit: (project: Project) => void;
  onDelete: (id: string) => void;
}> = ({ projects, companies, people, messages, deals, onAddProject, onEdit, onDelete }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        companies={companies}
        people={people}
        messages={messages}
        deals={deals}
        onBack={() => setSelectedProject(null)}
        onEditProject={() => {
          onEdit(selectedProject);
          setSelectedProject(null);
        }}
      />
    );
  }

  const stats = useMemo(() => ({
    total: projects.length,
    active: projects.filter((p) => p.status === 'active').length,
    portfolio: projects.filter((p) => p.type === 'portfolio').length,
    client: projects.filter((p) => p.type === 'client').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    blocked: projects.filter((p) => p.status === 'blocked').length,
  }), [projects]);

  const companyById = useMemo(() => new Map(companies.map((c) => [c.id, c])), [companies]);
  const personById = useMemo(() => new Map(people.map((p) => [p.id, p])), [people]);

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
          <h2 className="text-2xl font-semibold text-[#0f172a]">Projects</h2>
          <p className="mt-1 text-sm text-[#64748b]">Track all your work — portfolio, client, case studies, and experiments.</p>
        </div>
        <button
          type="button"
          onClick={onAddProject}
          className="text-xs px-3 py-1.5 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
        >
          Add Project
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard title="Total" value={stats.total} />
        <StatCard title="Active" value={stats.active} />
        <StatCard title="Portfolio" value={stats.portfolio} />
        <StatCard title="Client" value={stats.client} />
        <StatCard title="Completed" value={stats.completed} />
        <StatCard title="Blocked" value={stats.blocked} />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-lg text-[#0f172a]">All Projects</h3>
          <span className="text-xs text-[#64748b]">{projects.length} project{projects.length !== 1 ? 's' : ''}</span>
        </div>

        {projects.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#e5e7eb] bg-white p-8 text-center">
            <div className="text-sm text-[#64748b]">No projects yet. Add your first project.</div>
            <div className="mt-2 text-xs text-[#94a3b8]">Click "Add Project" to track portfolio work, client projects, or case studies.</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left table-auto">
              <thead>
                <tr className="text-xs text-[#475569] bg-[#f8fafc]">
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
                  <tr key={p.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb] cursor-pointer" onClick={() => setSelectedProject(p)}>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-[#2563eb] hover:underline">{p.name}</div>
                      {p.notes && <div className="text-xs text-[#64748b] truncate max-w-[200px]">{p.notes}</div>}
                    </td>
                    <td className="px-3 py-3 text-sm text-[#0f172a]">{typeLabel(p.type)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${stageColors[p.status || ''] || 'bg-[#f1f5f9] text-[#475569]'}`}>
                        {p.status || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm text-[#0f172a]">{phaseLabel(p.phase)}</td>
                    <td className="px-3 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${priorityColors[p.priority || ''] || 'bg-[#f1f5f9] text-[#475569]'}`}>
                        {p.priority || '—'}
                      </span>
                    </td>
                    <td className="px-3 py-3 min-w-[100px]">
                      <div className="flex items-center gap-2">
                        <ProgressBar value={p.progress ?? 0} />
                        <span className="text-xs text-[#64748b]">{p.progress ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm text-[#0f172a]">{formatDate(p.deadline)}</td>
                    <td className="px-3 py-3 text-sm text-[#0f172a]">{p.relatedCompanyName || companyById.get(p.relatedCompanyId || '')?.name || '—'}</td>
                    <td className="px-3 py-3 text-xs text-[#64748b] max-w-[120px] truncate">{p.nextAction || '—'}</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => onEdit(p)}
                          className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete project "${p.name}"?`)) onDelete(p.id);
                          }}
                          className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2]"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};

export default ProjectsPanel;
