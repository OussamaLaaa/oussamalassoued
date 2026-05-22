import React, { useMemo, useState } from 'react';
import type { Company, Deal, OutreachMessage, Person, Project } from '../../types/opportunities';

type InternalTab = 'overview' | 'tasks' | 'milestones' | 'time' | 'meetings' | 'finance' | 'documents' | 'messages' | 'notes';

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
];

const ProgressBar: React.FC<{ value: number }> = ({ value }) => (
  <div className="w-full bg-[#e5e7eb] rounded-full h-2 overflow-hidden">
    <div
      className="h-full rounded-full bg-[#2563eb] transition-all duration-300"
      style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
    />
  </div>
);

const OverviewCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
    <div className="text-xs font-mono uppercase text-[#64748b] mb-2">{title}</div>
    {children}
  </div>
);

const ProjectDetailView: React.FC<{
  project: Project;
  companies: Company[];
  people: Person[];
  messages: OutreachMessage[];
  deals: Deal[];
  onBack: () => void;
  onEditProject: () => void;
}> = ({ project, companies, people, messages, deals, onBack, onEditProject }) => {
  const [activeTab, setActiveTab] = useState<InternalTab>('overview');

  const company = useMemo(
    () => companies.find((c) => c.id === project.relatedCompanyId),
    [companies, project.relatedCompanyId],
  );

  const person = useMemo(
    () => people.find((p) => p.id === project.relatedPersonId),
    [people, project.relatedPersonId],
  );

  const relatedMessages = useMemo(
    () => messages.filter((m) => m.companyId === project.relatedCompanyId || m.personId === project.relatedPersonId),
    [messages, project.relatedCompanyId, project.relatedPersonId],
  );

  const relatedDeals = useMemo(
    () => deals.filter((d) => d.companyId === project.relatedCompanyId || d.personId === project.relatedPersonId),
    [deals, project.relatedCompanyId, project.relatedPersonId],
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
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc] flex items-center gap-1"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        Back to Projects
      </button>

      {/* Header */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-3 flex-1 min-w-0">
            <h2 className="text-2xl font-semibold text-[#0f172a]">{project.name}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${typeColors[project.type || ''] || 'bg-[#f1f5f9] text-[#475569]'}`}>
                {typeLabel(project.type)}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stageColors[project.status || ''] || 'bg-[#f1f5f9] text-[#475569]'}`}>
                {project.status || '—'}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${phaseColors[project.phase || ''] || 'bg-[#f1f5f9] text-[#475569]'}`}>
                {phaseLabel(project.phase)}
              </span>
              <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${priorityColors[project.priority || ''] || 'bg-[#f1f5f9] text-[#475569]'}`}>
                {project.priority || '—'}
              </span>
            </div>
            <div className="max-w-md">
              <div className="flex items-center gap-2 text-sm text-[#64748b] mb-1">
                <span>Progress</span>
                <span className="font-medium text-[#0f172a]">{project.progress ?? 0}%</span>
              </div>
              <ProgressBar value={project.progress ?? 0} />
            </div>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#64748b]">
              {project.deadline && (
                <span>
                  Deadline: <span className="font-medium text-[#0f172a]">{formatDate(project.deadline)}</span>
                  {daysRemaining !== null && (
                    <span className={`ml-1 ${daysRemaining < 0 ? 'text-[#dc2626] font-medium' : ''}`}>
                      ({daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d remaining`})
                    </span>
                  )}
                </span>
              )}
              {project.nextAction && (
                <span>
                  Next: <span className="font-medium text-[#0f172a]">{project.nextAction}</span>
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onEditProject}
            className="text-xs px-3 py-1.5 rounded border border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#dbeafe] shrink-0"
          >
            Edit Project
          </button>
        </div>
      </div>

      {/* Overview cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <OverviewCard title="Progress">
          <div className="text-3xl font-semibold text-[#0f172a]">{project.progress ?? 0}%</div>
        </OverviewCard>
        <OverviewCard title="Deadline">
          <div className="text-sm font-medium text-[#0f172a]">{formatDate(project.deadline)}</div>
          {daysRemaining !== null && (
            <div className={`text-xs mt-1 ${daysRemaining < 0 ? 'text-[#dc2626]' : 'text-[#64748b]'}`}>
              {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days remaining`}
            </div>
          )}
        </OverviewCard>
        <OverviewCard title="Linked Company">
          <div className="text-sm font-medium text-[#0f172a]">{company?.name || 'No company linked'}</div>
          {company?.industry && <div className="text-xs text-[#64748b] mt-1">{company.industry}</div>}
        </OverviewCard>
        <OverviewCard title="Linked Person">
          <div className="text-sm font-medium text-[#0f172a]">{person?.fullName || 'No person linked'}</div>
          {person?.role && <div className="text-xs text-[#64748b] mt-1">{person.role}</div>}
        </OverviewCard>
        <OverviewCard title="Related Messages">
          <div className="text-3xl font-semibold text-[#0f172a]">{relatedMessages.length}</div>
        </OverviewCard>
        <OverviewCard title="Related Deals">
          <div className="text-3xl font-semibold text-[#0f172a]">{relatedDeals.length}</div>
        </OverviewCard>
      </div>

      {/* Internal tabs */}
      <div className="rounded-lg border border-[#e5e7eb] bg-white shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="border-b border-[#e5e7eb] px-4 pt-2 overflow-x-auto">
          <div className="flex gap-1 min-w-max">
            {INTERNAL_TABS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTab(t.id)}
                className={`px-3 py-2 text-xs font-medium rounded-t-md transition-all ${
                  activeTab === t.id
                    ? 'bg-[#eff6ff] text-[#1d4ed8] border border-b-0 border-[#bfdbfe]'
                    : 'text-[#64748b] hover:text-[#0f172a] hover:bg-[#f8fafc]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="p-4">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="text-sm font-medium text-[#0f172a] mb-1">Current Phase</h4>
                  <p className="text-sm text-[#64748b]">{phaseLabel(project.phase)}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#0f172a] mb-1">Status</h4>
                  <p className="text-sm text-[#64748b] capitalize">{project.status || '—'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#0f172a] mb-1">Next Action</h4>
                  <p className="text-sm text-[#64748b]">{project.nextAction || '—'}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-[#0f172a] mb-1">Deadline</h4>
                  <p className="text-sm text-[#64748b]">{formatDate(project.deadline)}</p>
                </div>
              </div>

              {project.notes && (
                <div>
                  <h4 className="text-sm font-medium text-[#0f172a] mb-1">Project Notes</h4>
                  <p className="text-sm text-[#64748b] whitespace-pre-wrap">{project.notes}</p>
                </div>
              )}

              {(project.portfolioUrl || project.figmaUrl || project.githubUrl) && (
                <div>
                  <h4 className="text-sm font-medium text-[#0f172a] mb-2">Links</h4>
                  <div className="flex flex-wrap gap-2">
                    {project.portfolioUrl && (
                      <a href={project.portfolioUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]">
                        Portfolio ↗
                      </a>
                    )}
                    {project.figmaUrl && (
                      <a href={project.figmaUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]">
                        Figma ↗
                      </a>
                    )}
                    {project.githubUrl && (
                      <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]">
                        GitHub ↗
                      </a>
                    )}
                  </div>
                </div>
              )}

              {company && (
                <div>
                  <h4 className="text-sm font-medium text-[#0f172a] mb-1">Linked Company</h4>
                  <div className="rounded-md border border-[#e5e7eb] bg-[#f8fafc] p-3 text-sm text-[#64748b]">
                    <div className="font-medium text-[#0f172a]">{company.name}</div>
                    {company.industry && <div>Industry: {company.industry}</div>}
                    {company.country && <div>Location: {company.city ? `${company.city}, ` : ''}{company.country}</div>}
                    {company.website && <div>Website: {company.website}</div>}
                  </div>
                </div>
              )}

              {person && (
                <div>
                  <h4 className="text-sm font-medium text-[#0f172a] mb-1">Linked Person</h4>
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

          {/* Tasks Tab */}
          {activeTab === 'tasks' && (
            <div className="py-8 text-center">
              <div className="text-sm text-[#64748b]">This section will track project tasks.</div>
              <div className="mt-1 text-xs text-[#94a3b8]">Break down the project into actionable tasks with assignees and deadlines.</div>
            </div>
          )}

          {/* Milestones Tab */}
          {activeTab === 'milestones' && (
            <div className="py-8 text-center">
              <div className="text-sm text-[#64748b]">This section will track project milestones.</div>
              <div className="mt-1 text-xs text-[#94a3b8]">Define key milestones and track progress toward each one.</div>
            </div>
          )}

          {/* Time Tab */}
          {activeTab === 'time' && (
            <div className="py-8 text-center">
              <div className="text-sm text-[#64748b]">This section will track time spent on the project.</div>
              <div className="mt-1 text-xs text-[#94a3b8]">Log hours by phase or task to understand effort distribution.</div>
            </div>
          )}

          {/* Meetings Tab */}
          {activeTab === 'meetings' && (
            <div className="py-8 text-center">
              <div className="text-sm text-[#64748b]">This section will track meeting notes and schedules.</div>
              <div className="mt-1 text-xs text-[#94a3b8]">Keep a record of calls, client meetings, and sync sessions.</div>
            </div>
          )}

          {/* Finance Tab */}
          {activeTab === 'finance' && (
            <div>
              <h4 className="text-sm font-medium text-[#0f172a] mb-3">Related Deals</h4>
              {relatedDeals.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#64748b]">No related deals yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="text-xs text-[#475569] bg-[#f8fafc]">
                        <th className="px-3 py-2">Service</th>
                        <th className="px-3 py-2">Value</th>
                        <th className="px-3 py-2">Stage</th>
                        <th className="px-3 py-2">Probability</th>
                      </tr>
                    </thead>
                    <tbody>
                      {relatedDeals.map((d) => (
                        <tr key={d.id} className="border-t border-[#e5e7eb]">
                          <td className="px-3 py-2 text-sm text-[#0f172a]">{d.servicePackage}</td>
                          <td className="px-3 py-2 text-sm text-[#0f172a]">{d.value ? `${d.value} ${d.currency || ''}` : '—'}</td>
                          <td className="px-3 py-2 text-sm text-[#0f172a]">{d.stage}</td>
                          <td className="px-3 py-2 text-sm text-[#0f172a]">{Math.round((d.probability || 0) * 100)}%</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="py-8 text-center">
              <div className="text-sm text-[#64748b]">This section will store project documents and files.</div>
              <div className="mt-1 text-xs text-[#94a3b8]">Upload briefs, contracts, deliverables, and reference materials.</div>
            </div>
          )}

          {/* Messages Tab */}
          {activeTab === 'messages' && (
            <div>
              <h4 className="text-sm font-medium text-[#0f172a] mb-3">Related Messages</h4>
              {relatedMessages.length === 0 ? (
                <div className="py-8 text-center text-sm text-[#64748b]">No related messages yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left table-auto">
                    <thead>
                      <tr className="text-xs text-[#475569] bg-[#f8fafc]">
                        <th className="px-3 py-2">Person</th>
                        <th className="px-3 py-2">Company</th>
                        <th className="px-3 py-2">Channel</th>
                        <th className="px-3 py-2">Type</th>
                        <th className="px-3 py-2">Date</th>
                        <th className="px-3 py-2">Reply</th>
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

          {/* Notes Tab */}
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
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ProjectDetailView;
