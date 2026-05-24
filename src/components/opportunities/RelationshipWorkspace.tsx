import React, { useMemo, useState } from 'react';
import type {
  Company,
  Person,
  Project,
  RelationshipCategory,
  RelationshipContactMethod,
  RelationshipContactMethodInput,
  Relationship,
  RelationshipInteraction,
  RelationshipOpportunity,
  RelationshipInteractionInput,
  RelationshipOpportunityInput,
  RelationshipInput,
} from '../../types/opportunities';
import OpportunityModal from './OpportunityModal';
import RelationshipForm from './RelationshipForm';
import RelationshipInteractionForm from './RelationshipInteractionForm';
import RelationshipContactMethodForm from './RelationshipContactMethodForm';
import RelationshipOpportunityForm from './RelationshipOpportunityForm';

const WORKSPACE_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'contact', label: 'Contact' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'value', label: 'Value Exchange' },
  { id: 'problems', label: 'Problems' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'follow-ups', label: 'Follow-ups' },
  { id: 'notes', label: 'Notes' },
] as const;

const badgeClass = (kind?: string) => {
  const value = String(kind || '').toLowerCase();
  if (['strong', 'high', 'active', 'warm', 'open', 'in_progress'].includes(value)) return 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]';
  if (['medium', 'unknown', 'paused'].includes(value)) return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';
  if (['weak', 'low', 'cold'].includes(value)) return 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]';
  if (['avoid', 'archived', 'lost'].includes(value)) return 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]';
  return 'border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]';
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
};

const toDateInputValue = (value?: string) => (value ? value.slice(0, 10) : '');

const RelationshipWorkspace: React.FC<{
  relationships: Relationship[];
  relationshipInteractions: RelationshipInteraction[];
  relationshipOpportunities: RelationshipOpportunity[];
  relationshipCategories: RelationshipCategory[];
  relationshipContactMethods: RelationshipContactMethod[];
  people: Person[];
  projects: Project[];
  companies: Company[];
  selectedRelationshipId: string;
  onBack: () => void;
  onEditRelationship: (relationship: Relationship) => void;
  onUpdateRelationship: (id: string, input: Partial<RelationshipInput>) => Promise<any>;
  onDeleteRelationship: (id: string) => Promise<any>;
  onAddRelationshipInteraction: (input: RelationshipInteractionInput) => Promise<any>;
  onUpdateRelationshipInteraction: (id: string, input: Partial<RelationshipInteractionInput>) => Promise<any>;
  onDeleteRelationshipInteraction: (id: string) => Promise<any>;
  onAddRelationshipOpportunity: (input: RelationshipOpportunityInput) => Promise<any>;
  onUpdateRelationshipOpportunity: (id: string, input: Partial<RelationshipOpportunityInput>) => Promise<any>;
  onDeleteRelationshipOpportunity: (id: string) => Promise<any>;
  onAddRelationshipContactMethod: (input: RelationshipContactMethodInput) => Promise<any>;
  onUpdateRelationshipContactMethod: (id: string, input: Partial<RelationshipContactMethodInput>) => Promise<any>;
  onDeleteRelationshipContactMethod: (id: string) => Promise<any>;
}> = ({
  relationships,
  relationshipInteractions,
  relationshipOpportunities,
  relationshipCategories,
  relationshipContactMethods,
  people,
  projects,
  companies,
  selectedRelationshipId,
  onBack,
  onEditRelationship,
  onUpdateRelationship,
  onDeleteRelationship,
  onAddRelationshipInteraction,
  onUpdateRelationshipInteraction,
  onDeleteRelationshipInteraction,
  onAddRelationshipOpportunity,
  onUpdateRelationshipOpportunity,
  onDeleteRelationshipOpportunity,
  onAddRelationshipContactMethod,
  onUpdateRelationshipContactMethod,
  onDeleteRelationshipContactMethod,
}) => {
  const [activeTab, setActiveTab] = useState<typeof WORKSPACE_TABS[number]['id']>('overview');
  const [editingInteraction, setEditingInteraction] = useState<RelationshipInteraction | null>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<RelationshipOpportunity | null>(null);
  const [editingContactMethod, setEditingContactMethod] = useState<RelationshipContactMethod | null>(null);
  const [showInteractionForm, setShowInteractionForm] = useState(false);
  const [showOpportunityForm, setShowOpportunityForm] = useState(false);
  const [showContactMethodForm, setShowContactMethodForm] = useState(false);

  const selectedRelationship = useMemo(
    () => relationships.find((relationship) => relationship.id === selectedRelationshipId) || null,
    [relationships, selectedRelationshipId],
  );

  const linkedPerson = selectedRelationship?.personId
    ? people.find((person) => person.id === selectedRelationship.personId) || null
    : null;

  const linkedCategory = selectedRelationship?.categoryId
    ? relationshipCategories.find((category) => category.id === selectedRelationship.categoryId) || null
    : null;

  const timelineItems = useMemo(
    () => relationshipInteractions.filter((item) => item.relationshipId === selectedRelationshipId)
      .slice()
      .sort((left, right) => String(right.interactionDate).localeCompare(String(left.interactionDate))),
    [relationshipInteractions, selectedRelationshipId],
  );

  const opportunityItems = useMemo(
    () => relationshipOpportunities.filter((item) => item.relationshipId === selectedRelationshipId)
      .slice()
      .sort((left, right) => String(right.updatedAt || right.createdAt || '').localeCompare(String(left.updatedAt || left.createdAt || ''))),
    [relationshipOpportunities, selectedRelationshipId],
  );

  const contactMethodItems = useMemo(
    () => relationshipContactMethods.filter((item) => item.relationshipId === selectedRelationshipId)
      .slice()
      .sort((left, right) => Number(Boolean(right.isPrimary)) - Number(Boolean(left.isPrimary)) || String(left.type || '').localeCompare(String(right.type || ''))),
    [relationshipContactMethods, selectedRelationshipId],
  );

  if (!selectedRelationship) {
    return (
      <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="text-sm text-[#64748b]">Select a relationship to open the workspace.</div>
      </section>
    );
  }

  const handleQuickFollowUp = async () => {
    const defaultDate = selectedRelationship.nextContactDate ? toDateInputValue(selectedRelationship.nextContactDate) : '';
    const nextDate = window.prompt('Next follow-up date (YYYY-MM-DD). Leave blank to clear.', defaultDate);
    if (nextDate == null) return;

    const today = new Date().toISOString().slice(0, 10);
    await onAddRelationshipInteraction({
      relationshipId: selectedRelationship.id,
      interactionDate: today,
      type: 'follow_up',
      summary: selectedRelationship.nextAction || 'Followed up',
      outcome: '',
      nextAction: nextDate ? `Follow up on ${nextDate}` : '',
    });
    await onUpdateRelationship(selectedRelationship.id, {
      lastContactDate: today,
      nextContactDate: nextDate || null,
      nextAction: selectedRelationship.nextAction,
    });
  };

  const workspaceButton = 'rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#0f172a] hover:bg-[#f8fafc]';
  const primaryButton = 'rounded-md bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1d4ed8]';
  const sectionCard = 'rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]';

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={onBack} className={workspaceButton}>Back</button>
              <h2 className="text-2xl font-semibold text-[#0f172a]">{selectedRelationship.displayName}</h2>
            </div>
            <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
              {selectedRelationship.domain ? <span className={`rounded-full border px-2.5 py-1 ${badgeClass(selectedRelationship.domain)}`}>{selectedRelationship.domain.replace('_', ' ')}</span> : null}
              {selectedRelationship.relationshipType ? <span className={`rounded-full border px-2.5 py-1 ${badgeClass(selectedRelationship.relationshipType)}`}>{selectedRelationship.relationshipType}</span> : null}
              {selectedRelationship.relationshipStrength ? <span className={`rounded-full border px-2.5 py-1 ${badgeClass(selectedRelationship.relationshipStrength)}`}>{selectedRelationship.relationshipStrength}</span> : null}
              {selectedRelationship.trustLevel ? <span className={`rounded-full border px-2.5 py-1 ${badgeClass(selectedRelationship.trustLevel)}`}>{selectedRelationship.trustLevel}</span> : null}
              {selectedRelationship.status ? <span className={`rounded-full border px-2.5 py-1 ${badgeClass(selectedRelationship.status)}`}>{selectedRelationship.status}</span> : null}
            </div>
            <div className="mt-3 text-sm text-[#64748b]">
              {linkedPerson ? `Linked person: ${linkedPerson.fullName}` : 'No linked person'}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={workspaceButton} onClick={() => onEditRelationship(selectedRelationship)}>Edit</button>
            <button type="button" className={workspaceButton} onClick={() => void onDeleteRelationship(selectedRelationship.id)}>Delete</button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e5e7eb] pt-4">
          {WORKSPACE_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${activeTab === tab.id ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'bg-[#f8fafc] text-[#475569] hover:bg-[#eef2ff]'}`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_340px]">
          <div className="grid gap-4 lg:grid-cols-2">
            <div className={sectionCard}>
              <h3 className="text-sm font-semibold text-[#0f172a]">Overview</h3>
              <dl className="mt-3 grid gap-3 text-sm text-[#334155]">
                <div className="rounded-lg bg-[#f8fafc] p-3"><dt className="text-xs uppercase tracking-[0.14em] text-[#64748b]">How We Met</dt><dd className="mt-1">{selectedRelationship.howWeMet || '—'}</dd></div>
                <div className="rounded-lg bg-[#f8fafc] p-3"><dt className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Last Contact</dt><dd className="mt-1">{formatDate(selectedRelationship.lastContactDate)}</dd></div>
                <div className="rounded-lg bg-[#f8fafc] p-3"><dt className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Next Contact</dt><dd className="mt-1">{formatDate(selectedRelationship.nextContactDate)}</dd></div>
                <div className="rounded-lg bg-[#f8fafc] p-3"><dt className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Next Action</dt><dd className="mt-1">{selectedRelationship.nextAction || '—'}</dd></div>
              </dl>
            </div>
            <div className={sectionCard}>
              <h3 className="text-sm font-semibold text-[#0f172a]">Linked People</h3>
              <div className="mt-3 space-y-2 text-sm text-[#334155]">
                <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">{linkedPerson ? linkedPerson.fullName : 'No linked person'}</div>
                <button type="button" className={primaryButton} onClick={() => onEditRelationship(selectedRelationship)}>Edit Relationship</button>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className={sectionCard}>
              <h3 className="text-sm font-semibold text-[#0f172a]">Workspace Sidebar</h3>
              <div className="mt-3 space-y-3 text-sm text-[#334155]">
                <div className="rounded-lg bg-[#f8fafc] p-3">
                  <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Category</div>
                  <div className="mt-1 font-medium text-[#0f172a]">{linkedCategory?.name || 'Uncategorized'}</div>
                </div>
                <div className="rounded-lg bg-[#f8fafc] p-3">
                  <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Contact Methods</div>
                  <div className="mt-1 text-[#0f172a]">{contactMethodItems.length} recorded</div>
                </div>
                <div className="rounded-lg bg-[#f8fafc] p-3">
                  <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Health</div>
                  <div className="mt-1 text-[#0f172a]">{selectedRelationship.trustLevel || 'Unknown'} trust, {selectedRelationship.relationshipStrength || 'no strength set'}</div>
                </div>
              </div>
            </div>
            <div className={sectionCard}>
              <h3 className="text-sm font-semibold text-[#0f172a]">Quick Actions</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" className={primaryButton} onClick={() => setShowContactMethodForm(true)}>Add Contact Method</button>
                <button type="button" className={workspaceButton} onClick={() => void handleQuickFollowUp()}>Quick Follow-up</button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'contact' ? (
        <div className={sectionCard}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a]">Contact Methods</h3>
              <p className="mt-1 text-sm text-[#64748b]">Store every way to reach this person and mark the primary channel.</p>
            </div>
            <button type="button" className={primaryButton} onClick={() => setShowContactMethodForm(true)}>Add Contact Method</button>
          </div>
          <div className="mt-4 space-y-3">
            {contactMethodItems.length > 0 ? contactMethodItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#0f172a]">{item.label || item.type || 'Contact Method'}</div>
                    <div className="mt-1 text-xs text-[#64748b]">{item.type || 'unspecified'}{item.isPrimary ? ' · primary' : ''}</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={workspaceButton} onClick={() => setEditingContactMethod(item)}>Edit</button>
                    <button type="button" className={workspaceButton} onClick={() => void onDeleteRelationshipContactMethod(item.id)}>Delete</button>
                  </div>
                </div>
                <div className="mt-3 text-sm text-[#334155]">
                  <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Value</div>
                  <div className="mt-1">{item.value || '—'}</div>
                </div>
                {item.notes ? <div className="mt-3 text-sm text-[#334155]"><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Notes</div><div className="mt-1">{item.notes}</div></div> : null}
              </div>
            )) : <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">No contact methods recorded yet.</div>}
          </div>
        </div>
      ) : null}

      {activeTab === 'timeline' ? (
        <div className={sectionCard}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a]">Timeline</h3>
              <p className="mt-1 text-sm text-[#64748b]">Interactions, notes, follow-ups, and outcomes.</p>
            </div>
            <button type="button" className={primaryButton} onClick={() => setShowInteractionForm(true)}>Add Interaction</button>
          </div>
          <div className="mt-4 space-y-3">
            {timelineItems.length > 0 ? timelineItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#0f172a]">{formatDate(item.interactionDate)}</div>
                    <div className="mt-1 text-xs text-[#64748b]">{item.channel || 'channel unknown'} · {item.type || 'interaction'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={workspaceButton} onClick={() => setEditingInteraction(item)}>Edit</button>
                    <button type="button" className={workspaceButton} onClick={() => void onDeleteRelationshipInteraction(item.id)}>Delete</button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[#334155] md:grid-cols-2">
                  <div><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Summary</span><div className="mt-1">{item.summary || '—'}</div></div>
                  <div><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Outcome</span><div className="mt-1">{item.outcome || '—'}</div></div>
                </div>
                <div className="mt-3 text-sm text-[#334155]"><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Next Action</span><div className="mt-1">{item.nextAction || '—'}</div></div>
              </div>
            )) : <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">No interactions logged yet.</div>}
          </div>
        </div>
      ) : null}

      {activeTab === 'value' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={sectionCard}>
            <h3 className="text-sm font-semibold text-[#0f172a]">What They Need</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.whatTheyNeed || '—'}</p>
          </div>
          <div className={sectionCard}>
            <h3 className="text-sm font-semibold text-[#0f172a]">How I Can Help</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.howICanHelp || '—'}</p>
          </div>
          <div className={sectionCard}>
            <h3 className="text-sm font-semibold text-[#0f172a]">How They Can Help Me</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.howTheyCanHelpMe || '—'}</p>
          </div>
          <div className={sectionCard}>
            <h3 className="text-sm font-semibold text-[#0f172a]">Shared Interests</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.sharedInterests || '—'}</p>
          </div>
        </div>
      ) : null}

      {activeTab === 'problems' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={sectionCard}>
            <h3 className="text-sm font-semibold text-[#0f172a]">Problems</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.problems || '—'}</p>
          </div>
          <div className={sectionCard}>
            <h3 className="text-sm font-semibold text-[#0f172a]">Risk Notes</h3>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.riskNotes || '—'}</p>
          </div>
        </div>
      ) : null}

      {activeTab === 'opportunities' ? (
        <div className={sectionCard}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a]">Opportunities</h3>
              <p className="mt-1 text-sm text-[#64748b]">Track collaboration, referrals, and deal momentum tied to this relationship.</p>
            </div>
            <button type="button" className={primaryButton} onClick={() => setShowOpportunityForm(true)}>Add Opportunity</button>
          </div>
          <div className="mt-4 space-y-3">
            {opportunityItems.length > 0 ? opportunityItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#0f172a]">{item.title}</div>
                    <div className="mt-1 text-xs text-[#64748b]">{item.type || 'opportunity'} · {item.status || 'open'} · {item.priority || 'medium'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={workspaceButton} onClick={() => setEditingOpportunity(item)}>Edit</button>
                    <button type="button" className={workspaceButton} onClick={() => void onDeleteRelationshipOpportunity(item.id)}>Delete</button>
                  </div>
                </div>
                <div className="mt-3 grid gap-2 text-sm text-[#334155] md:grid-cols-2">
                  <div><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Value</span><div className="mt-1">{item.valueDescription || '—'}</div></div>
                  <div><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Due</span><div className="mt-1">{formatDate(item.dueDate)}</div></div>
                </div>
                <div className="mt-3 text-sm text-[#334155]"><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Next Action</span><div className="mt-1">{item.nextAction || '—'}</div></div>
              </div>
            )) : <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">No opportunities linked yet.</div>}
          </div>
        </div>
      ) : null}

      {activeTab === 'follow-ups' ? (
        <div className={sectionCard}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a]">Follow-ups</h3>
              <p className="mt-1 text-sm text-[#64748b]">Keep the next contact visible and easy to update.</p>
            </div>
            <button type="button" className={primaryButton} onClick={() => void handleQuickFollowUp()}>Mark Followed Up Today</button>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Next Contact Date</div>
              <div className="mt-1 text-sm text-[#0f172a]">{formatDate(selectedRelationship.nextContactDate)}</div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Next Action</div>
              <div className="mt-1 text-sm text-[#0f172a]">{selectedRelationship.nextAction || '—'}</div>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === 'notes' ? (
        <div className={sectionCard}>
          <h3 className="text-sm font-semibold text-[#0f172a]">Notes</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.notes || '—'}</p>
        </div>
      ) : null}

      {showInteractionForm ? (
        <OpportunityModal title="Add Interaction" onClose={() => setShowInteractionForm(false)}>
          <RelationshipInteractionForm
            relationshipId={selectedRelationship.id}
            onSubmit={async (input) => { await onAddRelationshipInteraction(input); setShowInteractionForm(false); }}
            onCancel={() => setShowInteractionForm(false)}
          />
        </OpportunityModal>
      ) : null}

      {editingInteraction ? (
        <OpportunityModal title="Edit Interaction" onClose={() => setEditingInteraction(null)}>
          <RelationshipInteractionForm
            relationshipId={selectedRelationship.id}
            initialData={editingInteraction}
            submitLabel="Update Interaction"
            onSubmit={async (input) => { await onUpdateRelationshipInteraction(editingInteraction.id, input); setEditingInteraction(null); }}
            onCancel={() => setEditingInteraction(null)}
          />
        </OpportunityModal>
      ) : null}

      {showOpportunityForm ? (
        <OpportunityModal title="Add Opportunity" onClose={() => setShowOpportunityForm(false)}>
          <RelationshipOpportunityForm
            relationshipId={selectedRelationship.id}
            projects={projects}
            companies={companies}
            onSubmit={async (input) => { await onAddRelationshipOpportunity(input); setShowOpportunityForm(false); }}
            onCancel={() => setShowOpportunityForm(false)}
          />
        </OpportunityModal>
      ) : null}

      {editingOpportunity ? (
        <OpportunityModal title="Edit Opportunity" onClose={() => setEditingOpportunity(null)}>
          <RelationshipOpportunityForm
            relationshipId={selectedRelationship.id}
            projects={projects}
            companies={companies}
            initialData={editingOpportunity}
            submitLabel="Update Opportunity"
            onSubmit={async (input) => { await onUpdateRelationshipOpportunity(editingOpportunity.id, input); setEditingOpportunity(null); }}
            onCancel={() => setEditingOpportunity(null)}
          />
        </OpportunityModal>
      ) : null}

      {showContactMethodForm ? (
        <OpportunityModal title="Add Contact Method" onClose={() => setShowContactMethodForm(false)}>
          <RelationshipContactMethodForm
            relationships={relationships}
            people={people}
            relationshipId={selectedRelationship.id}
            onSubmit={async (input) => { await onAddRelationshipContactMethod(input); setShowContactMethodForm(false); }}
            onCancel={() => setShowContactMethodForm(false)}
          />
        </OpportunityModal>
      ) : null}

      {editingContactMethod ? (
        <OpportunityModal title="Edit Contact Method" onClose={() => setEditingContactMethod(null)}>
          <RelationshipContactMethodForm
            relationships={relationships}
            people={people}
            relationshipId={selectedRelationship.id}
            initialData={editingContactMethod}
            submitLabel="Update Contact Method"
            onSubmit={async (input) => { await onUpdateRelationshipContactMethod(editingContactMethod.id, input); setEditingContactMethod(null); }}
            onCancel={() => setEditingContactMethod(null)}
          />
        </OpportunityModal>
      ) : null}
    </section>
  );
};

export default RelationshipWorkspace;
