import React, { useMemo, useState } from 'react';
import type {
  Company,
  Person,
  Project,
  Relationship,
  RelationshipInteraction,
  RelationshipInteractionInput,
  RelationshipOpportunity,
  RelationshipOpportunityInput,
  RelationshipInput,
} from '../../types/opportunities';
import OpportunityModal from './OpportunityModal';
import RelationshipForm from './RelationshipForm';
import RelationshipWorkspace from './RelationshipWorkspace';

const SECTION_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'all', label: 'All Relationships' },
  { id: 'domains', label: 'Domains' },
  { id: 'follow-ups', label: 'Follow-ups' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'review', label: 'Review' },
] as const;

const DOMAIN_OPTIONS = [
  { value: '', label: 'All Domains' },
  { value: 'ux_ui', label: 'UX / UI' },
  { value: 'founders', label: 'Founders' },
  { value: 'recruiters', label: 'Recruiters' },
  { value: 'designers', label: 'Designers' },
  { value: 'developers', label: 'Developers' },
  { value: 'clients', label: 'Clients' },
  { value: 'mentors', label: 'Mentors' },
  { value: 'investors', label: 'Investors' },
  { value: 'local_business', label: 'Local Business' },
  { value: 'family', label: 'Family' },
  { value: 'friends', label: 'Friends' },
  { value: 'other', label: 'Other' },
] as const;

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'professional', label: 'Professional' },
  { value: 'client', label: 'Client' },
  { value: 'mentor', label: 'Mentor' },
  { value: 'peer', label: 'Peer' },
  { value: 'recruiter', label: 'Recruiter' },
  { value: 'founder', label: 'Founder' },
  { value: 'family', label: 'Family' },
  { value: 'friend', label: 'Friend' },
  { value: 'community', label: 'Community' },
  { value: 'other', label: 'Other' },
] as const;

const STRENGTH_OPTIONS = [
  { value: '', label: 'All Strengths' },
  { value: 'weak', label: 'Weak' },
  { value: 'medium', label: 'Medium' },
  { value: 'strong', label: 'Strong' },
] as const;

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'active', label: 'Active' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
  { value: 'paused', label: 'Paused' },
  { value: 'avoid', label: 'Avoid' },
  { value: 'archived', label: 'Archived' },
] as const;

const badgeClass = (kind?: string) => {
  const value = String(kind || '').toLowerCase();
  if (['strong', 'high', 'active', 'warm'].includes(value)) return 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]';
  if (['medium', 'unknown', 'paused'].includes(value)) return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';
  if (['weak', 'low', 'cold'].includes(value)) return 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]';
  if (['avoid', 'archived'].includes(value)) return 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]';
  return 'border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]';
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const toDateKey = (value?: string) => (value ? value.slice(0, 10) : '');

const RelationshipsPanel: React.FC<{
  relationships: Relationship[];
  relationshipInteractions: RelationshipInteraction[];
  relationshipOpportunities: RelationshipOpportunity[];
  people: Person[];
  companies: Company[];
  projects: Project[];
  onAddRelationship: (input: RelationshipInput) => Promise<any>;
  onUpdateRelationship: (id: string, input: Partial<RelationshipInput>) => Promise<any>;
  onDeleteRelationship: (id: string) => Promise<any>;
  onAddRelationshipInteraction: (input: RelationshipInteractionInput) => Promise<any>;
  onUpdateRelationshipInteraction: (id: string, input: Partial<RelationshipInteractionInput>) => Promise<any>;
  onDeleteRelationshipInteraction: (id: string) => Promise<any>;
  onAddRelationshipOpportunity: (input: RelationshipOpportunityInput) => Promise<any>;
  onUpdateRelationshipOpportunity: (id: string, input: Partial<RelationshipOpportunityInput>) => Promise<any>;
  onDeleteRelationshipOpportunity: (id: string) => Promise<any>;
}> = ({
  relationships,
  relationshipInteractions,
  relationshipOpportunities,
  people,
  companies,
  projects,
  onAddRelationship,
  onUpdateRelationship,
  onDeleteRelationship,
  onAddRelationshipInteraction,
  onUpdateRelationshipInteraction,
  onDeleteRelationshipInteraction,
  onAddRelationshipOpportunity,
  onUpdateRelationshipOpportunity,
  onDeleteRelationshipOpportunity,
}) => {
  const [activeSection, setActiveSection] = useState<typeof SECTION_TABS[number]['id']>('dashboard');
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(relationships[0]?.id || null);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [domainFilter, setDomainFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [strengthFilter, setStrengthFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [followUpFilter, setFollowUpFilter] = useState('');

  const peopleById = useMemo(() => new Map(people.map((person) => [person.id, person] as const)), [people]);
  const companyById = useMemo(() => new Map(companies.map((company) => [company.id, company] as const)), [companies]);
  const projectById = useMemo(() => new Map(projects.map((project) => [project.id, project] as const)), [projects]);
  const relationshipById = useMemo(() => new Map(relationships.map((relationship) => [relationship.id, relationship] as const)), [relationships]);

  const filteredRelationships = useMemo(() => {
    return relationships.filter((relationship) => {
      if (domainFilter && relationship.domain !== domainFilter) return false;
      if (typeFilter && relationship.relationshipType !== typeFilter) return false;
      if (strengthFilter && relationship.relationshipStrength !== strengthFilter) return false;
      if (statusFilter && relationship.status !== statusFilter) return false;
      if (followUpFilter === 'due') {
        const nextContact = toDateKey(relationship.nextContactDate);
        if (!nextContact || nextContact > todayKey()) return false;
        if (['avoid', 'archived'].includes(String(relationship.status || ''))) return false;
      }
      return true;
    });
  }, [relationships, domainFilter, typeFilter, strengthFilter, statusFilter, followUpFilter]);

  const dueRelationships = useMemo(() => relationships.filter((relationship) => {
    const nextContact = toDateKey(relationship.nextContactDate);
    return Boolean(nextContact && nextContact <= todayKey() && !['avoid', 'archived'].includes(String(relationship.status || '')));
  }), [relationships]);

  const openOpportunities = useMemo(() => relationshipOpportunities.filter((item) => !['archived', 'lost'].includes(String(item.status || '').toLowerCase())), [relationshipOpportunities]);
  const frictionRelationships = useMemo(() => relationships.filter((relationship) => Boolean(String(relationship.problems || '').trim() || String(relationship.riskNotes || '').trim())), [relationships]);

  const strongRelationships = relationships.filter((relationship) => relationship.relationshipStrength === 'strong').length;
  const warmRelationships = relationships.filter((relationship) => relationship.status === 'warm').length;
  const problemsCount = relationships.filter((relationship) => Boolean(String(relationship.problems || '').trim() || String(relationship.riskNotes || '').trim())).length;

  const countsByDomain = useMemo(() => {
    const counts = new Map<string, number>();
    relationships.forEach((relationship) => {
      const key = relationship.domain || 'other';
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    return counts;
  }, [relationships]);

  const handleOpenWorkspace = (relationshipId: string) => {
    setSelectedRelationshipId(relationshipId);
    setActiveSection('dashboard');
  };

  const handleEditRelationship = (relationship: Relationship) => {
    setEditingRelationship(relationship);
    setIsAddingRelationship(false);
  };

  const handleDeleteRelationship = async (relationshipId: string) => {
    const deleted = await onDeleteRelationship(relationshipId);
    if (deleted) {
      setSelectedRelationshipId((current) => (current === relationshipId ? null : current));
    }
  };

  const handleQuickFollowUp = async (relationship: Relationship) => {
    const defaultDate = relationship.nextContactDate ? toDateKey(relationship.nextContactDate) : '';
    const nextDate = window.prompt('Next follow-up date (YYYY-MM-DD). Leave blank to clear.', defaultDate);
    if (nextDate == null) return;

    const today = todayKey();
    await onAddRelationshipInteraction({
      relationshipId: relationship.id,
      interactionDate: today,
      type: 'follow_up',
      summary: relationship.nextAction || 'Followed up',
      outcome: '',
      nextAction: nextDate ? `Follow up on ${nextDate}` : '',
    });
    await onUpdateRelationship(relationship.id, {
      lastContactDate: today,
      nextContactDate: nextDate || null,
    });
  };

  const handleSubmitRelationship = async (input: RelationshipInput) => {
    if (editingRelationship) {
      await onUpdateRelationship(editingRelationship.id, input);
    } else {
      await onAddRelationship(input);
    }
    setEditingRelationship(null);
    setIsAddingRelationship(false);
  };

  const dashboardCard = 'rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]';
  const pillButton = 'rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#0f172a] hover:bg-[#f8fafc]';
  const primaryButton = 'rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]';
  const tableButton = 'rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#0f172a] hover:bg-[#f8fafc]';

  const sectionOpportunities = openOpportunities.map((opportunity) => ({
    ...opportunity,
    relationshipName: relationshipById.get(opportunity.relationshipId)?.displayName || 'Unlinked relationship',
    companyName: opportunity.linkedCompanyName || (opportunity.linkedCompanyId ? companyById.get(opportunity.linkedCompanyId)?.name : undefined),
    projectName: opportunity.linkedProjectName || (opportunity.linkedProjectId ? projectById.get(opportunity.linkedProjectId)?.name : undefined),
  }));

  const reviewRelationships = relationships.filter((relationship) => String(relationship.status || '').toLowerCase() !== 'archived' && (String(relationship.riskNotes || '').trim() || String(relationship.problems || '').trim() || relationship.trustLevel === 'low' || relationship.trustLevel === 'unknown'));

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#0f172a]">Relationships OS</h2>
            <p className="mt-1 text-sm text-[#64748b]">Track people, trust, exchanges, friction, and follow-ups in one workspace.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryButton} onClick={() => { setEditingRelationship(null); setIsAddingRelationship(true); }}>Add Relationship</button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e5e7eb] pt-4">
          {SECTION_TABS.map((section) => (
            <button
              key={section.id}
              type="button"
              onClick={() => setActiveSection(section.id)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${activeSection === section.id ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'bg-[#f8fafc] text-[#475569] hover:bg-[#eef2ff]'}`}
            >
              {section.label}
            </button>
          ))}
        </div>
      </div>

      {activeSection === 'dashboard' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Total Relationships</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{relationships.length}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Strong Relationships</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{strongRelationships}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Warm Relationships</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{warmRelationships}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Follow-ups Due</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{dueRelationships.length}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Open Opportunities</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{openOpportunities.length}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Problems / Friction</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{problemsCount}</div></div>
        </div>
      ) : null}

      {activeSection === 'all' ? (
        <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
          <div className="grid gap-3 md:grid-cols-5">
            <select value={domainFilter} onChange={(event) => setDomainFilter(event.target.value)} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
              {DOMAIN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
              {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={strengthFilter} onChange={(event) => setStrengthFilter(event.target.value)} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
              {STRENGTH_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
              {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={followUpFilter} onChange={(event) => setFollowUpFilter(event.target.value)} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
              <option value="">All follow-up states</option>
              <option value="due">Follow-up due</option>
            </select>
          </div>

          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-[0.12em] text-[#64748b]">
                <tr>
                  <th className="py-3 pr-4">Name</th>
                  <th className="py-3 pr-4">Domain</th>
                  <th className="py-3 pr-4">Type</th>
                  <th className="py-3 pr-4">Strength</th>
                  <th className="py-3 pr-4">Trust</th>
                  <th className="py-3 pr-4">Status</th>
                  <th className="py-3 pr-4">Last Contact</th>
                  <th className="py-3 pr-4">Next Contact</th>
                  <th className="py-3 pr-4">Next Action</th>
                  <th className="py-3 pr-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRelationships.map((relationship) => (
                  <tr key={relationship.id} className="border-t border-[#e5e7eb] align-top">
                    <td className="py-3 pr-4">
                      <button type="button" className="font-medium text-[#0f172a] hover:text-[#2563eb]" onClick={() => handleOpenWorkspace(relationship.id)}>{relationship.displayName}</button>
                      <div className="mt-1 text-xs text-[#64748b]">{relationship.personName || (relationship.personId ? peopleById.get(relationship.personId)?.fullName : null) || 'No linked person'}</div>
                    </td>
                    <td className="py-3 pr-4"><span className={`rounded-full border px-2 py-1 text-xs ${badgeClass(relationship.domain)}`}>{relationship.domain || '—'}</span></td>
                    <td className="py-3 pr-4"><span className={`rounded-full border px-2 py-1 text-xs ${badgeClass(relationship.relationshipType)}`}>{relationship.relationshipType || '—'}</span></td>
                    <td className="py-3 pr-4"><span className={`rounded-full border px-2 py-1 text-xs ${badgeClass(relationship.relationshipStrength)}`}>{relationship.relationshipStrength || '—'}</span></td>
                    <td className="py-3 pr-4"><span className={`rounded-full border px-2 py-1 text-xs ${badgeClass(relationship.trustLevel)}`}>{relationship.trustLevel || '—'}</span></td>
                    <td className="py-3 pr-4"><span className={`rounded-full border px-2 py-1 text-xs ${badgeClass(relationship.status)}`}>{relationship.status || '—'}</span></td>
                    <td className="py-3 pr-4 text-[#334155]">{formatDate(relationship.lastContactDate)}</td>
                    <td className="py-3 pr-4 text-[#334155]">{formatDate(relationship.nextContactDate)}</td>
                    <td className="py-3 pr-4 text-[#334155]">{relationship.nextAction || '—'}</td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button type="button" className={tableButton} onClick={() => handleOpenWorkspace(relationship.id)}>Open Workspace</button>
                        <button type="button" className={tableButton} onClick={() => handleEditRelationship(relationship)}>Edit</button>
                        <button type="button" className={tableButton} onClick={() => void handleDeleteRelationship(relationship.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredRelationships.length === 0 ? (
                  <tr><td colSpan={10} className="py-8 text-center text-sm text-[#64748b]">No relationships match the current filters.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      {activeSection === 'domains' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {DOMAIN_OPTIONS.filter((option) => option.value).map((option) => (
            <div key={option.value} className={dashboardCard}>
              <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">{option.label}</div>
              <div className="mt-2 text-3xl font-semibold text-[#0f172a]">{countsByDomain.get(option.value) || 0}</div>
            </div>
          ))}
        </div>
      ) : null}

      {activeSection === 'follow-ups' ? (
        <div className="space-y-3">
          {dueRelationships.length > 0 ? dueRelationships.map((relationship) => (
            <div key={relationship.id} className={dashboardCard}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#0f172a]">{relationship.displayName}</div>
                  <div className="mt-1 text-xs text-[#64748b]">Due {formatDate(relationship.nextContactDate)} · {relationship.nextAction || 'No next action'}</div>
                </div>
                <button type="button" className={primaryButton} onClick={() => void handleQuickFollowUp(relationship)}>Mark Followed Up Today</button>
              </div>
            </div>
          )) : <div className={dashboardCard}><div className="text-sm text-[#64748b]">No follow-ups are due right now.</div></div>}
        </div>
      ) : null}

      {activeSection === 'opportunities' ? (
        <div className="space-y-3">
          {sectionOpportunities.length > 0 ? sectionOpportunities.map((opportunity) => (
            <div key={opportunity.id} className={dashboardCard}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#0f172a]">{opportunity.title}</div>
                  <div className="mt-1 text-xs text-[#64748b]">{opportunity.relationshipName} · {opportunity.status || 'open'} · {opportunity.priority || 'medium'}</div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={tableButton} onClick={() => setSelectedRelationshipId(opportunity.relationshipId)}>Open Relationship</button>
                  <button type="button" className={tableButton} onClick={() => setSelectedRelationshipId(opportunity.relationshipId)}>Workspace</button>
                </div>
              </div>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Value</div><div className="mt-1 text-sm text-[#334155]">{opportunity.valueDescription || '—'}</div></div>
                <div><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Due</div><div className="mt-1 text-sm text-[#334155]">{formatDate(opportunity.dueDate)}</div></div>
                <div><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Project</div><div className="mt-1 text-sm text-[#334155]">{opportunity.projectName || '—'}</div></div>
                <div><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Company</div><div className="mt-1 text-sm text-[#334155]">{opportunity.companyName || '—'}</div></div>
              </div>
            </div>
          )) : <div className={dashboardCard}><div className="text-sm text-[#64748b]">No open relationship opportunities yet.</div></div>}
        </div>
      ) : null}

      {activeSection === 'review' ? (
        <div className="space-y-3">
          {reviewRelationships.length > 0 ? reviewRelationships.map((relationship) => (
            <div key={relationship.id} className={dashboardCard}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#0f172a]">{relationship.displayName}</div>
                  <div className="mt-1 text-xs text-[#64748b]">{relationship.riskNotes || relationship.problems || 'Needs review'}</div>
                </div>
                <button type="button" className={tableButton} onClick={() => handleOpenWorkspace(relationship.id)}>Open Workspace</button>
              </div>
            </div>
          )) : <div className={dashboardCard}><div className="text-sm text-[#64748b]">Nothing needs review.</div></div>}
        </div>
      ) : null}

      {selectedRelationshipId ? (
        <RelationshipWorkspace
          relationships={relationships}
          relationshipInteractions={relationshipInteractions}
          relationshipOpportunities={relationshipOpportunities}
          people={people}
          projects={projects}
          companies={companies}
          selectedRelationshipId={selectedRelationshipId}
          onBack={() => setSelectedRelationshipId(null)}
          onEditRelationship={(relationship) => handleEditRelationship(relationship)}
          onUpdateRelationship={onUpdateRelationship}
          onDeleteRelationship={handleDeleteRelationship}
          onAddRelationshipInteraction={onAddRelationshipInteraction}
          onUpdateRelationshipInteraction={onUpdateRelationshipInteraction}
          onDeleteRelationshipInteraction={onDeleteRelationshipInteraction}
          onAddRelationshipOpportunity={onAddRelationshipOpportunity}
          onUpdateRelationshipOpportunity={onUpdateRelationshipOpportunity}
          onDeleteRelationshipOpportunity={onDeleteRelationshipOpportunity}
        />
      ) : null}

      {isAddingRelationship || editingRelationship ? (
        <OpportunityModal title={editingRelationship ? 'Edit Relationship' : 'Add Relationship'} onClose={() => { setEditingRelationship(null); setIsAddingRelationship(false); }}>
          <RelationshipForm
            people={people}
            initialData={editingRelationship || undefined}
            submitLabel={editingRelationship ? 'Update Relationship' : 'Save Relationship'}
            onSubmit={handleSubmitRelationship}
            onCancel={() => { setEditingRelationship(null); setIsAddingRelationship(false); }}
          />
        </OpportunityModal>
      ) : null}
    </section>
  );
};

export default RelationshipsPanel;
