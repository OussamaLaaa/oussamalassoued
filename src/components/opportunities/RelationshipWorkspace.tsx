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
  const [showRelationshipForm, setShowRelationshipForm] = useState(false);

  const selectedRelationship = useMemo(
    () => relationships.find((relationship) => relationship.id === selectedRelationshipId) || null,
    [relationships, selectedRelationshipId],
  );

  const categoryBySlug = useMemo(() => new Map(relationshipCategories.map((category) => [category.slug || category.name.toLowerCase(), category] as const)), [relationshipCategories]);
  const selectedCategory = selectedRelationship?.domain ? categoryBySlug.get(selectedRelationship.domain) || null : null;

  const linkedPerson = selectedRelationship?.personId
    ? people.find((person) => person.id === selectedRelationship.personId) || null
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
    () => relationshipContactMethods.filter((item) => item.relationshipId === selectedRelationshipId),
    [relationshipContactMethods, selectedRelationshipId],
  );

  const primaryContactMethod = contactMethodItems.find((item) => item.isPrimary) || contactMethodItems[0] || null;
  const openOpportunityCount = opportunityItems.filter((item) => !['archived', 'lost'].includes(String(item.status || '').toLowerCase())).length;
  const interactionCount = timelineItems.length;
  const problemsInteractionCount = timelineItems.filter((item) => String(item.type || '').toLowerCase() === 'problem').length;
  const frictionRecorded = Boolean(String(selectedRelationship?.problems || '').trim() || String(selectedRelationship?.riskNotes || '').trim() || problemsInteractionCount > 0);
  const followUpOverdue = Boolean(selectedRelationship?.nextContactDate && selectedRelationship.nextContactDate.slice(0, 10) < toDateInputValue(new Date().toISOString()) && !['avoid', 'archived'].includes(String(selectedRelationship?.status || '').toLowerCase()));
  const strongTrusted = selectedRelationship?.relationshipStrength === 'strong' && selectedRelationship?.trustLevel === 'high';

  if (!selectedRelationship) {
    return (
      <section className="rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
        <div className="text-sm text-[#64748b]">Select a relationship to open the workspace.</div>
      </section>
    );
  }

  const workspaceButton = 'rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#0f172a] hover:bg-[#f8fafc]';
  const primaryButton = 'rounded-md bg-[#2563eb] px-3 py-1.5 text-sm font-medium text-white hover:bg-[#1d4ed8]';
  const sectionCard = 'rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]';
  const statCard = 'rounded-xl border border-[#e5e7eb] bg-[#ffffff] p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]';

  const handleQuickFollowUp = async () => {
    const defaultDate = selectedRelationship.nextContactDate ? toDateInputValue(selectedRelationship.nextContactDate) : '';
    const nextDate = window.prompt('Next follow-up date (YYYY-MM-DD). Leave blank to clear.', defaultDate);
    if (nextDate == null) return;

    const nextAction = window.prompt('Next action for the follow-up. Leave blank to keep the existing one.', selectedRelationship.nextAction || '') || selectedRelationship.nextAction;
    const today = new Date().toISOString().slice(0, 10);

    await onAddRelationshipInteraction({
      relationshipId: selectedRelationship.id,
      interactionDate: today,
      channel: 'other',
      type: 'follow_up',
      summary: selectedRelationship.nextAction || 'Followed up',
      outcome: '',
      nextAction: nextDate ? `Follow up on ${nextDate}` : '',
    });
    await onUpdateRelationship(selectedRelationship.id, {
      lastContactDate: today,
      nextContactDate: nextDate || null,
      nextAction: nextAction?.trim() || undefined,
    });
  };

  const handleSetPrimary = async (contactMethodId: string) => {
    await Promise.all(contactMethodItems.map((item) => onUpdateRelationshipContactMethod(item.id, { isPrimary: item.id === contactMethodId })));
  };

  const handleMarkFollowedUpToday = async () => {
    const today = new Date().toISOString().slice(0, 10);
    await onAddRelationshipInteraction({
      relationshipId: selectedRelationship.id,
      interactionDate: today,
      channel: 'other',
      type: 'follow_up',
      summary: selectedRelationship.nextAction || 'Followed up',
      outcome: '',
      nextAction: selectedRelationship.nextAction || undefined,
    });
    await onUpdateRelationship(selectedRelationship.id, {
      lastContactDate: today,
    });
  };

  const relationshipFacts = [
    { label: 'Category', value: selectedCategory?.name || selectedRelationship.domain || 'Uncategorized' },
    { label: 'Person', value: linkedPerson?.fullName || 'No linked person' },
    { label: 'Primary Contact', value: primaryContactMethod ? `${primaryContactMethod.label || primaryContactMethod.type || 'Method'} · ${primaryContactMethod.value || '—'}` : 'No contact methods yet' },
    { label: 'Next Action', value: selectedRelationship.nextAction || '—' },
  ];

  const renderTopCards = () => (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <div className={statCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Relationship Strength</div><div className="mt-2 text-xl font-semibold text-[#0f172a]">{selectedRelationship.relationshipStrength || '—'}</div></div>
      <div className={statCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Trust Level</div><div className="mt-2 text-xl font-semibold text-[#0f172a]">{selectedRelationship.trustLevel || '—'}</div></div>
      <div className={statCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Last Contact</div><div className="mt-2 text-xl font-semibold text-[#0f172a]">{formatDate(selectedRelationship.lastContactDate)}</div></div>
      <div className={statCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Next Contact</div><div className="mt-2 text-xl font-semibold text-[#0f172a]">{formatDate(selectedRelationship.nextContactDate)}</div></div>
      <div className={statCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Open Opportunities</div><div className="mt-2 text-xl font-semibold text-[#0f172a]">{openOpportunityCount}</div></div>
      <div className={statCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Interaction Count</div><div className="mt-2 text-xl font-semibold text-[#0f172a]">{interactionCount}</div></div>
      <div className={statCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Problems / Friction</div><div className="mt-2 text-xl font-semibold text-[#0f172a]">{frictionRecorded ? 'Yes' : 'No'}</div></div>
      <div className={statCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Follow-up</div><div className="mt-2 text-xl font-semibold text-[#0f172a]">{followUpOverdue ? 'Overdue' : 'On track'}</div></div>
    </div>
  );

  const renderSidebar = () => (
    <aside className="space-y-4 xl:sticky xl:top-4 xl:h-fit">
      <div className={sectionCard}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Relationship Facts</h3>
        <div className="mt-3 space-y-3">
          {relationshipFacts.map((item) => (
            <div key={item.label} className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">{item.label}</div>
              <div className="mt-1 text-sm font-medium text-[#0f172a]">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div className={sectionCard}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Follow-up Status</h3>
        <div className="mt-3 space-y-2 text-sm text-[#334155]">
          <div className="rounded-lg bg-[#f8fafc] p-3">{followUpOverdue ? 'Follow-up overdue' : 'Follow-up on track'}</div>
          <div className="rounded-lg bg-[#f8fafc] p-3">Next action: {selectedRelationship.nextAction || '—'}</div>
        </div>
      </div>

      <div className={sectionCard}>
        <h3 className="text-sm font-semibold text-[#0f172a]">Quick Actions</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={primaryButton} onClick={() => setShowInteractionForm(true)}>Add Event</button>
          <button type="button" className={workspaceButton} onClick={() => setShowContactMethodForm(true)}>Add Contact Method</button>
          <button type="button" className={workspaceButton} onClick={() => setShowOpportunityForm(true)}>Add Opportunity</button>
          <button type="button" className={workspaceButton} onClick={() => void handleMarkFollowedUpToday()}>Mark Followed Up</button>
        </div>
      </div>
    </aside>
  );

  const renderOverview = () => (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className={sectionCard}>
          <h3 className="text-sm font-semibold text-[#0f172a]">Overview</h3>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">How We Met</div>
              <div className="mt-1 text-sm text-[#0f172a]">{selectedRelationship.howWeMet || '—'}</div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Linked Person</div>
              <div className="mt-1 text-sm text-[#0f172a]">{linkedPerson?.fullName || 'No linked person'}</div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Last Contact</div>
              <div className="mt-1 text-sm text-[#0f172a]">{formatDate(selectedRelationship.lastContactDate)}</div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Next Contact</div>
              <div className="mt-1 text-sm text-[#0f172a]">{formatDate(selectedRelationship.nextContactDate)}</div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Next Action</div>
              <div className="mt-1 text-sm text-[#0f172a]">{selectedRelationship.nextAction || '—'}</div>
            </div>
            <div className="rounded-lg bg-[#f8fafc] p-3">
              <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Status Summary</div>
              <div className="mt-1 text-sm text-[#0f172a]">{selectedRelationship.status || '—'} · {selectedRelationship.relationshipStrength || '—'} · {selectedRelationship.trustLevel || '—'}</div>
            </div>
          </div>
        </div>

        <div className={sectionCard}>
          <h3 className="text-sm font-semibold text-[#0f172a]">Relationship Health</h3>
          <div className="mt-3 space-y-2 text-sm">
            {followUpOverdue ? <div className="rounded-lg border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[#a16207]">Follow-up overdue</div> : null}
            {!interactionCount ? <div className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-2 text-[#475569]">No interaction history yet</div> : null}
            {frictionRecorded ? <div className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-[#b91c1c]">Friction recorded</div> : null}
            {strongTrusted ? <div className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-[#166534]">Strong trusted relationship</div> : null}
          </div>
        </div>

        <div className={sectionCard}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a]">Relationship Notes</h3>
              <p className="mt-1 text-sm text-[#64748b]">Edit the base relationship fields in one place.</p>
            </div>
            <button type="button" className={primaryButton} onClick={() => setShowRelationshipForm(true)}>Edit Relationship</button>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm text-[#334155]">
            <div className="rounded-lg bg-[#f8fafc] p-3"><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">What They Need</div><div className="mt-1">{selectedRelationship.whatTheyNeed || '—'}</div></div>
            <div className="rounded-lg bg-[#f8fafc] p-3"><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">How I Can Help</div><div className="mt-1">{selectedRelationship.howICanHelp || '—'}</div></div>
            <div className="rounded-lg bg-[#f8fafc] p-3"><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">How They Can Help Me</div><div className="mt-1">{selectedRelationship.howTheyCanHelpMe || '—'}</div></div>
            <div className="rounded-lg bg-[#f8fafc] p-3"><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Shared Interests</div><div className="mt-1">{selectedRelationship.sharedInterests || '—'}</div></div>
          </div>
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  const renderContact = () => (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className={sectionCard}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a]">Contact Methods</h3>
            <p className="mt-1 text-sm text-[#64748b]">Add LinkedIn, phone, email, WhatsApp, or another channel.</p>
          </div>
          <button type="button" className={primaryButton} onClick={() => setShowContactMethodForm(true)}>Add Contact Method</button>
        </div>
        <div className="mt-4 space-y-3">
          {contactMethodItems.length > 0 ? contactMethodItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#0f172a]">{item.label || item.type || 'Contact Method'}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#64748b]">
                    <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">{item.type || 'unspecified'}</span>
                    {item.isPrimary ? <span className={`rounded-full border px-2 py-1 ${badgeClass('strong')}`}>primary</span> : null}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={workspaceButton} onClick={() => setEditingContactMethod(item)}>Edit</button>
                  <button type="button" className={workspaceButton} onClick={async () => { await handleSetPrimary(item.id); }}>Set Primary</button>
                  <button type="button" className={workspaceButton} onClick={async () => { await onDeleteRelationshipContactMethod(item.id); }}>Delete</button>
                </div>
              </div>
              <div className="mt-3 text-sm text-[#334155]">
                <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Value</div>
                <div className="mt-1">{item.value || '—'}</div>
              </div>
              {item.notes ? <div className="mt-3 text-sm text-[#334155]"><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Notes</div><div className="mt-1">{item.notes}</div></div> : null}
            </div>
          )) : <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">No contact methods yet. Add LinkedIn, phone, email, WhatsApp, or another channel.</div>}
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  const renderTimeline = () => (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className={sectionCard}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a]">Events / Timeline</h3>
            <p className="mt-1 text-sm text-[#64748b]">Newest events first.</p>
          </div>
          <button type="button" className={primaryButton} onClick={() => setShowInteractionForm(true)}>Add Event</button>
        </div>
        <div className="mt-4 space-y-3">
          {timelineItems.length > 0 ? timelineItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#0f172a]">{formatDate(item.interactionDate)}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#64748b]">
                    <span className={`rounded-full border px-2 py-1 ${badgeClass(item.channel)}`}>{item.channel || 'channel unknown'}</span>
                    <span className={`rounded-full border px-2 py-1 ${badgeClass(item.type)}`}>{item.type || 'event'}</span>
                  </div>
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
          )) : <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">No interaction history yet.</div>}
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  const renderValue = () => (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="grid gap-4 lg:grid-cols-2">
        <div className={sectionCard}>
          <h3 className="text-sm font-semibold text-[#0f172a]">What They Need</h3>
          <p className="mt-3 text-sm text-[#64748b]">What does this person need?</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.whatTheyNeed || '—'}</p>
        </div>
        <div className={sectionCard}>
          <h3 className="text-sm font-semibold text-[#0f172a]">How I Can Help</h3>
          <p className="mt-3 text-sm text-[#64748b]">How can I help them?</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.howICanHelp || '—'}</p>
        </div>
        <div className={sectionCard}>
          <h3 className="text-sm font-semibold text-[#0f172a]">How They Can Help Me</h3>
          <p className="mt-3 text-sm text-[#64748b]">How can they help me?</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.howTheyCanHelpMe || '—'}</p>
        </div>
        <div className={sectionCard}>
          <h3 className="text-sm font-semibold text-[#0f172a]">Shared Interests</h3>
          <p className="mt-3 text-sm text-[#64748b]">What do we share?</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.sharedInterests || '—'}</p>
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  const renderProblems = () => (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className="space-y-4">
        <div className={sectionCard}>
          <h3 className="text-sm font-semibold text-[#0f172a]">Problems / Friction</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.problems || '—'}</p>
        </div>
        <div className={sectionCard}>
          <h3 className="text-sm font-semibold text-[#0f172a]">Risk Notes</h3>
          <p className="mt-3 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.riskNotes || '—'}</p>
        </div>
        <div className={sectionCard}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-[#0f172a]">Problem Events</h3>
              <p className="mt-1 text-sm text-[#64748b]">RelationshipInteractions with type = problem.</p>
            </div>
            <button type="button" className={primaryButton} onClick={() => setShowInteractionForm(true)}>Add Problem Event</button>
          </div>
          <div className="mt-4 space-y-3">
            {timelineItems.filter((item) => String(item.type || '').toLowerCase() === 'problem').length > 0 ? timelineItems.filter((item) => String(item.type || '').toLowerCase() === 'problem').map((item) => (
              <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#0f172a]">{formatDate(item.interactionDate)}</div>
                    <div className="mt-1 text-xs text-[#64748b]">{item.summary || 'Problem event'}</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" className={workspaceButton} onClick={() => setEditingInteraction(item)}>Edit</button>
                    <button type="button" className={workspaceButton} onClick={() => void onDeleteRelationshipInteraction(item.id)}>Delete</button>
                  </div>
                </div>
              </div>
            )) : <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">No friction recorded.</div>}
          </div>
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  const renderOpportunities = () => (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className={sectionCard}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a]">Opportunities</h3>
            <p className="mt-1 text-sm text-[#64748b]">Track collaboration, referrals, and deal momentum tied to this relationship.</p>
          </div>
          <button type="button" className={primaryButton} onClick={() => setShowOpportunityForm(true)}>Add Relationship Opportunity</button>
        </div>
        <div className="mt-4 space-y-3">
          {opportunityItems.length > 0 ? opportunityItems.map((item) => (
            <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-[#0f172a]">{item.title}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#64748b]">
                    <span className={`rounded-full border px-2 py-1 ${badgeClass(item.type)}`}>{item.type || 'opportunity'}</span>
                    <span className={`rounded-full border px-2 py-1 ${badgeClass(item.status)}`}>{item.status || 'open'}</span>
                    <span className={`rounded-full border px-2 py-1 ${badgeClass(item.priority)}`}>{item.priority || 'medium'}</span>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button type="button" className={workspaceButton} onClick={() => setEditingOpportunity(item)}>Edit</button>
                  <button type="button" className={workspaceButton} onClick={() => void onDeleteRelationshipOpportunity(item.id)}>Delete</button>
                </div>
              </div>
              <div className="mt-3 grid gap-2 text-sm text-[#334155] md:grid-cols-2">
                <div><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Value</span><div className="mt-1">{item.valueDescription || '—'}</div></div>
                <div><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Due</span><div className="mt-1">{formatDate(item.dueDate)}</div></div>
                <div><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Linked Project</span><div className="mt-1">{item.linkedProjectName || '—'}</div></div>
                <div><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Linked Company</span><div className="mt-1">{item.linkedCompanyName || '—'}</div></div>
              </div>
              <div className="mt-3 text-sm text-[#334155]"><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Next Action</span><div className="mt-1">{item.nextAction || '—'}</div></div>
              {item.notes ? <div className="mt-3 text-sm text-[#334155]"><span className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Notes</span><div className="mt-1">{item.notes}</div></div> : null}
            </div>
          )) : <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">No opportunities linked yet.</div>}
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  const renderFollowUps = () => (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className={sectionCard}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a]">Follow-ups</h3>
            <p className="mt-1 text-sm text-[#64748b]">Keep the next contact visible and easy to update.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryButton} onClick={() => void handleMarkFollowedUpToday()}>Mark Followed Up Today</button>
            <button type="button" className={workspaceButton} onClick={() => setShowRelationshipForm(true)}>Set Next Follow-up</button>
            <button type="button" className={workspaceButton} onClick={() => onUpdateRelationship(selectedRelationship.id, { nextContactDate: null, nextAction: '' })}>Clear Follow-up</button>
          </div>
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
          <div className="rounded-lg bg-[#f8fafc] p-3 md:col-span-2">
            <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Follow-up Status</div>
            <div className="mt-1 text-sm text-[#0f172a]">{followUpOverdue ? 'Follow-up overdue' : 'Follow-up on track'}</div>
          </div>
        </div>
      </div>
      {renderSidebar()}
    </div>
  );

  const renderNotes = () => (
    <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
      <div className={sectionCard}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-[#0f172a]">Notes</h3>
            <p className="mt-1 text-sm text-[#64748b]">Editable notes for the relationship.</p>
          </div>
          <button type="button" className={primaryButton} onClick={() => setShowRelationshipForm(true)}>Edit Notes</button>
        </div>
        <p className="mt-3 whitespace-pre-wrap text-sm text-[#334155]">{selectedRelationship.notes || '—'}</p>
      </div>
      {renderSidebar()}
    </div>
  );

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
            <button type="button" className={workspaceButton} onClick={() => setShowRelationshipForm(true)}>Edit</button>
            <button type="button" className={workspaceButton} onClick={() => void onDeleteRelationship(selectedRelationship.id)}>Delete</button>
          </div>
        </div>
      </div>

      {renderTopCards()}

      <div className="rounded-xl border border-[#e5e7eb] bg-white p-3 shadow-[0_8px_24px_rgba(15,23,42,0.05)]">
        <div className="flex flex-wrap gap-2">
          {WORKSPACE_TABS.map((tab) => (
            <button key={tab.id} type="button" onClick={() => setActiveTab(tab.id)} className={`rounded-full px-3 py-1.5 text-sm transition-colors ${activeTab === tab.id ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'bg-[#f8fafc] text-[#475569] hover:bg-[#eef2ff]'}`}>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'contact' && renderContact()}
      {activeTab === 'timeline' && renderTimeline()}
      {activeTab === 'value' && renderValue()}
      {activeTab === 'problems' && renderProblems()}
      {activeTab === 'opportunities' && renderOpportunities()}
      {activeTab === 'follow-ups' && renderFollowUps()}
      {activeTab === 'notes' && renderNotes()}

      {showRelationshipForm ? (
        <OpportunityModal title="Edit Relationship" onClose={() => setShowRelationshipForm(false)}>
          <RelationshipForm
            people={people}
            categories={relationshipCategories}
            initialData={selectedRelationship}
            submitLabel="Update Relationship"
            onSubmit={async (input) => { await onUpdateRelationship(selectedRelationship.id, input); setShowRelationshipForm(false); }}
            onCancel={() => setShowRelationshipForm(false)}
          />
        </OpportunityModal>
      ) : null}

      {showInteractionForm ? (
        <OpportunityModal title="Add Event" onClose={() => setShowInteractionForm(false)}>
          <RelationshipInteractionForm
            relationshipId={selectedRelationship.id}
            onSubmit={async (input) => { await onAddRelationshipInteraction(input); setShowInteractionForm(false); }}
            onCancel={() => setShowInteractionForm(false)}
          />
        </OpportunityModal>
      ) : null}

      {editingInteraction ? (
        <OpportunityModal title="Edit Event" onClose={() => setEditingInteraction(null)}>
          <RelationshipInteractionForm
            relationshipId={selectedRelationship.id}
            initialData={editingInteraction}
            submitLabel="Update Event"
            onSubmit={async (input) => { await onUpdateRelationshipInteraction(editingInteraction.id, input); setEditingInteraction(null); }}
            onCancel={() => setEditingInteraction(null)}
          />
        </OpportunityModal>
      ) : null}

      {showOpportunityForm ? (
        <OpportunityModal title="Add Relationship Opportunity" onClose={() => setShowOpportunityForm(false)}>
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
        <OpportunityModal title="Edit Relationship Opportunity" onClose={() => setEditingOpportunity(null)}>
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
