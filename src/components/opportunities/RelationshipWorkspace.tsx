import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
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
import DirectionalText from '../DirectionalText';
import OpportunityModal from './OpportunityModal';
import RelationshipForm from './RelationshipForm';
import RelationshipInteractionForm from './RelationshipInteractionForm';
import RelationshipContactMethodForm from './RelationshipContactMethodForm';
import RelationshipOpportunityForm from './RelationshipOpportunityForm';
import AIRelationshipAssistantPanel from './AIRelationshipAssistantPanel';

const WORKSPACE_TABS = [
 { id: 'overview', label: 'Overview' },
 { id: 'contact', label: 'Contact' },
 { id: 'timeline', label: 'Timeline' },
 { id: 'value', label: 'Value Exchange' },
 { id: 'problems', label: 'Problems' },
 { id: 'opportunities', label: 'Opportunities' },
 { id: 'follow-ups', label: 'Follow-ups' },
 { id: 'ai-assistant', label: 'AI Assistant' },
 { id: 'notes', label: 'Notes' },
] as const;

const badgeClass = (kind?: string) => {
  const { t, language } = usePersonalLanguage();

 const value = String(kind || '').toLowerCase();
 if (['strong', 'high', 'active', 'warm', 'open', 'in_progress'].includes(value)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
 if (['medium', 'unknown', 'paused'].includes(value)) return 'border-neutral-200 bg-neutral-50 text-neutral-600';
 if (['weak', 'low', 'cold'].includes(value)) return 'border-amber-200 bg-amber-50 text-amber-700';
 if (['avoid', 'archived', 'lost'].includes(value)) return 'border-red-200 bg-red-50 text-red-700';
 return 'border-neutral-200 bg-neutral-50 text-neutral-600';
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
 const { t } = usePersonalLanguage();
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
 <section className="rounded-xl border border-neutral-200 bg-white p-6">
 <div className="text-sm text-neutral-500">Select a relationship to open the workspace.</div>
 </section>
 );
 }

 const relationshipFacts = [
 { label: 'Category', value: selectedCategory?.name || selectedRelationship.domain || 'Uncategorized' },
 { label: 'Person', value: linkedPerson?.fullName || 'No linked person' },
 { label: 'Primary Contact', value: primaryContactMethod ? `${primaryContactMethod.label || primaryContactMethod.type || 'Method'} · ${primaryContactMethod.value || '—'}` : 'No contact methods yet' },
 { label: 'Next Action', value: selectedRelationship.nextAction || '—' },
 ];

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

 const renderTopCards = () => (
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Relationship Strength</div><div className="mt-2 text-xl font-semibold text-neutral-900">{selectedRelationship.relationshipStrength || '—'}</div></div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Trust Level</div><div className="mt-2 text-xl font-semibold text-neutral-900">{selectedRelationship.trustLevel || '—'}</div></div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Last Contact</div><div className="mt-2 text-xl font-semibold text-neutral-900">{formatDate(selectedRelationship.lastContactDate)}</div></div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Next Contact</div><div className="mt-2 text-xl font-semibold text-neutral-900">{formatDate(selectedRelationship.nextContactDate)}</div></div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Open Opportunities</div><div className="mt-2 text-xl font-semibold text-neutral-900">{openOpportunityCount}</div></div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Interaction Count</div><div className="mt-2 text-xl font-semibold text-neutral-900">{interactionCount}</div></div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Problems / Friction</div><div className="mt-2 text-xl font-semibold text-neutral-900">{frictionRecorded ? 'Yes' : 'No'}</div></div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Follow-up</div><div className="mt-2 text-xl font-semibold text-neutral-900">{followUpOverdue ? 'Overdue' : 'On track'}</div></div>
 </div>
 );

 const renderSidebar = () => (
 <aside className="space-y-4 xl:sticky xl:top-4 xl:h-fit">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <h3 className="text-sm font-semibold text-neutral-900">Relationship Facts</h3>
 <div className="mt-3 space-y-3">
 {relationshipFacts.map((item) => (
 <div key={item.label} className="rounded-md bg-neutral-50 p-3">
 <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">{item.label}</div>
  <DirectionalText text={item.value} as="div" className="mt-1 text-sm font-medium text-neutral-900" />
 </div>
 ))}
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <h3 className="text-sm font-semibold text-neutral-900">Follow-up Status</h3>
 <div className="mt-3 space-y-2 text-sm text-neutral-700">
 <div className="rounded-md bg-neutral-50 p-3">{followUpOverdue ? 'Follow-up overdue' : 'Follow-up on track'}</div>
  <DirectionalText text={`Next action: ${selectedRelationship.nextAction || '—'}`} as="div" className="rounded-md bg-neutral-50 p-3" />
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <h3 className="text-sm font-semibold text-neutral-900">Quick Actions</h3>
 <div className="mt-3 flex flex-wrap gap-2">
 <button type="button" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors" onClick={() => setShowInteractionForm(true)}>Add Event</button>
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => setShowContactMethodForm(true)}>Add Contact Method</button>
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => setShowOpportunityForm(true)}>Add Opportunity</button>
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => void handleMarkFollowedUpToday()}>Mark Followed Up</button>
 </div>
 </div>
 </aside>
 );

 const renderOverview = () => (
 <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <h3 className="text-sm font-semibold text-neutral-900">Overview</h3>
 <div className="mt-3 grid gap-3 md:grid-cols-2">
 <div className="rounded-md bg-neutral-50 p-3">
 <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">How We Met</div>
  <DirectionalText text={selectedRelationship.howWeMet || '—'} as="div" className="mt-1 text-sm text-neutral-900" />
 </div>
 <div className="rounded-md bg-neutral-50 p-3">
 <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Linked Person</div>
 <div className="mt-1 text-sm text-neutral-900">{linkedPerson?.fullName || 'No linked person'}</div>
 </div>
 <div className="rounded-md bg-neutral-50 p-3">
 <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Last Contact</div>
 <div className="mt-1 text-sm text-neutral-900">{formatDate(selectedRelationship.lastContactDate)}</div>
 </div>
 <div className="rounded-md bg-neutral-50 p-3">
 <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Next Contact</div>
 <div className="mt-1 text-sm text-neutral-900">{formatDate(selectedRelationship.nextContactDate)}</div>
 </div>
 <div className="rounded-md bg-neutral-50 p-3">
 <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Next Action</div>
 <div className="mt-1 text-sm text-neutral-900">{selectedRelationship.nextAction || '—'}</div>
 </div>
 <div className="rounded-md bg-neutral-50 p-3">
 <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Status Summary</div>
 <div className="mt-1 text-sm text-neutral-900">{selectedRelationship.status || '—'} · {selectedRelationship.relationshipStrength || '—'} · {selectedRelationship.trustLevel || '—'}</div>
 </div>
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <h3 className="text-sm font-semibold text-neutral-900">Relationship Health</h3>
 <div className="mt-3 space-y-2 text-sm">
 {followUpOverdue ? <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-amber-700">Follow-up overdue</div> : null}
 {!interactionCount ? <div className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-neutral-600">No interaction history yet</div> : null}
 {frictionRecorded ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-red-700">Friction recorded</div> : null}
 {strongTrusted ? <div className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">Strong trusted relationship</div> : null}
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h3 className="text-sm font-semibold text-neutral-900">Relationship Notes</h3>
 <p className="mt-1 text-sm text-neutral-500">Edit the base relationship fields in one place.</p>
 </div>
 <button type="button" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors" onClick={() => setShowRelationshipForm(true)}>Edit Relationship</button>
 </div>
 <div className="mt-3 grid gap-3 md:grid-cols-2 text-sm text-neutral-700">
  <div className="rounded-md bg-neutral-50 p-3"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">What They Need</div><DirectionalText text={selectedRelationship.whatTheyNeed || '—'} as="div" className="mt-1" /></div>
  <div className="rounded-md bg-neutral-50 p-3"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">How I Can Help</div><DirectionalText text={selectedRelationship.howICanHelp || '—'} as="div" className="mt-1" /></div>
  <div className="rounded-md bg-neutral-50 p-3"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">How They Can Help Me</div><DirectionalText text={selectedRelationship.howTheyCanHelpMe || '—'} as="div" className="mt-1" /></div>
  <div className="rounded-md bg-neutral-50 p-3"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Shared Interests</div><DirectionalText text={selectedRelationship.sharedInterests || '—'} as="div" className="mt-1" /></div>
 </div>
 </div>
 </div>
 {renderSidebar()}
 </div>
 );

 const renderContact = () => (
 <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h3 className="text-sm font-semibold text-neutral-900">Contact Methods</h3>
 <p className="mt-1 text-sm text-neutral-500">Add LinkedIn, phone, email, WhatsApp, or another channel.</p>
 </div>
 <button type="button" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors" onClick={() => setShowContactMethodForm(true)}>Add Contact Method</button>
 </div>
 <div className="mt-4 space-y-3">
 {contactMethodItems.length > 0 ? contactMethodItems.map((item) => (
 <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <div className="text-sm font-medium text-neutral-900">{item.label || item.type || 'Contact Method'}</div>
 <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
 <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-xs font-medium">{item.type || 'unspecified'}</span>
 {item.isPrimary ? <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass('strong')}`}>primary</span> : null}
 </div>
 </div>
 <div className="flex gap-2">
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => setEditingContactMethod(item)}>Edit</button>
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={async () => { await handleSetPrimary(item.id); }}>Set Primary</button>
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={async () => { await onDeleteRelationshipContactMethod(item.id); }}>Delete</button>
 </div>
 </div>
 <div className="mt-3 text-sm text-neutral-700">
 <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Value</div>
  <DirectionalText text={item.value || '—'} as="div" className="mt-1" />
  </div>
  {item.notes ? <div className="mt-3 text-sm text-neutral-700"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div><DirectionalText text={item.notes} as="div" className="mt-1" /></div> : null}
 </div>
 )) : <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">No contact methods yet. Add LinkedIn, phone, email, WhatsApp, or another channel.</div>}
 </div>
 </div>
 {renderSidebar()}
 </div>
 );

 const renderTimeline = () => (
 <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h3 className="text-sm font-semibold text-neutral-900">Events / Timeline</h3>
 <p className="mt-1 text-sm text-neutral-500">Newest events first.</p>
 </div>
 <button type="button" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors" onClick={() => setShowInteractionForm(true)}>Add Event</button>
 </div>
 <div className="mt-4 space-y-3">
 {timelineItems.length > 0 ? timelineItems.map((item) => (
 <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <div className="text-sm font-medium text-neutral-900">{formatDate(item.interactionDate)}</div>
 <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
 <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(item.channel)}`}>{item.channel || 'channel unknown'}</span>
 <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(item.type)}`}>{item.type || 'event'}</span>
 </div>
 </div>
 <div className="flex gap-2">
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => setEditingInteraction(item)}>Edit</button>
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => void onDeleteRelationshipInteraction(item.id)}>Delete</button>
 </div>
 </div>
 <div className="mt-3 grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
  <div><span className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Summary</span><DirectionalText text={item.summary || '—'} as="div" className="mt-1" /></div>
  <div><span className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Outcome</span><DirectionalText text={item.outcome || '—'} as="div" className="mt-1" /></div>
  </div>
  <div className="mt-3 text-sm text-neutral-700"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Next Action</span><DirectionalText text={item.nextAction || '—'} as="div" className="mt-1" /></div>
 </div>
 )) : <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">No interaction history yet.</div>}
 </div>
 </div>
 {renderSidebar()}
 </div>
 );

 const renderValue = () => (
 <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
 <div className="grid gap-4 lg:grid-cols-2">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <h3 className="text-sm font-semibold text-neutral-900">What They Need</h3>
 <p className="mt-3 text-sm text-neutral-500">What does this person need?</p>
  <DirectionalText text={selectedRelationship.whatTheyNeed || '—'} as="p" className="mt-2 whitespace-pre-wrap text-sm text-neutral-700" preserveWhitespace />
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <h3 className="text-sm font-semibold text-neutral-900">How I Can Help</h3>
  <p className="mt-3 text-sm text-neutral-500">How can I help them?</p>
  <DirectionalText text={selectedRelationship.howICanHelp || '—'} as="p" className="mt-2 whitespace-pre-wrap text-sm text-neutral-700" preserveWhitespace />
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <h3 className="text-sm font-semibold text-neutral-900">How They Can Help Me</h3>
  <p className="mt-3 text-sm text-neutral-500">How can they help me?</p>
  <DirectionalText text={selectedRelationship.howTheyCanHelpMe || '—'} as="p" className="mt-2 whitespace-pre-wrap text-sm text-neutral-700" preserveWhitespace />
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <h3 className="text-sm font-semibold text-neutral-900">Shared Interests</h3>
  <p className="mt-3 text-sm text-neutral-500">What do we share?</p>
  <DirectionalText text={selectedRelationship.sharedInterests || '—'} as="p" className="mt-2 whitespace-pre-wrap text-sm text-neutral-700" preserveWhitespace />
 </div>
 </div>
 {renderSidebar()}
 </div>
 );

 const renderProblems = () => (
 <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <h3 className="text-sm font-semibold text-neutral-900">Problems / Friction</h3>
  <DirectionalText text={selectedRelationship.problems || '—'} as="p" className="mt-3 whitespace-pre-wrap text-sm text-neutral-700" preserveWhitespace />
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <h3 className="text-sm font-semibold text-neutral-900">Risk Notes</h3>
  <DirectionalText text={selectedRelationship.riskNotes || '—'} as="p" className="mt-3 whitespace-pre-wrap text-sm text-neutral-700" preserveWhitespace />
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h3 className="text-sm font-semibold text-neutral-900">Problem Events</h3>
 <p className="mt-1 text-sm text-neutral-500">Interactions with type = problem.</p>
 </div>
 <button type="button" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors" onClick={() => setShowInteractionForm(true)}>Add Problem Event</button>
 </div>
 <div className="mt-4 space-y-3">
 {timelineItems.filter((item) => String(item.type || '').toLowerCase() === 'problem').length > 0 ? timelineItems.filter((item) => String(item.type || '').toLowerCase() === 'problem').map((item) => (
 <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
 <div className="flex items-start justify-between gap-3">
 <div>
 <div className="text-sm font-medium text-neutral-900">{formatDate(item.interactionDate)}</div>
 <div className="mt-1 text-xs text-neutral-500">{item.summary || 'Problem event'}</div>
 </div>
 <div className="flex gap-2">
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => setEditingInteraction(item)}>Edit</button>
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => void onDeleteRelationshipInteraction(item.id)}>Delete</button>
 </div>
 </div>
 </div>
 )) : <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">No friction recorded.</div>}
 </div>
 </div>
 </div>
 {renderSidebar()}
 </div>
 );

 const renderOpportunities = () => (
 <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h3 className="text-sm font-semibold text-neutral-900">Opportunities</h3>
 <p className="mt-1 text-sm text-neutral-500">Track collaboration, referrals, and deal momentum tied to this relationship.</p>
 </div>
 <button type="button" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors" onClick={() => setShowOpportunityForm(true)}>Add Relationship Opportunity</button>
 </div>
 <div className="mt-4 space-y-3">
 {opportunityItems.length > 0 ? opportunityItems.map((item) => (
 <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
  <DirectionalText text={item.title} as="div" className="text-sm font-medium text-neutral-900" />
 <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
 <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(item.type)}`}>{item.type || 'opportunity'}</span>
 <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(item.status)}`}>{item.status || 'open'}</span>
 <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(item.priority)}`}>{item.priority || 'medium'}</span>
 </div>
 </div>
 <div className="flex gap-2">
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => setEditingOpportunity(item)}>Edit</button>
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => void onDeleteRelationshipOpportunity(item.id)}>Delete</button>
 </div>
 </div>
 <div className="mt-3 grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
  <div><span className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Value</span><DirectionalText text={item.valueDescription || '—'} as="div" className="mt-1" /></div>
 <div><span className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Due</span><div className="mt-1">{formatDate(item.dueDate)}</div></div>
 <div><span className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Linked Project</span><div className="mt-1">{item.linkedProjectName || '—'}</div></div>
 <div><span className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Linked Company</span><div className="mt-1">{item.linkedCompanyName || '—'}</div></div>
 </div>
  <div className="mt-3 text-sm text-neutral-700"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Next Action</span><DirectionalText text={item.nextAction || '—'} as="div" className="mt-1" /></div>
  {item.notes ? <div className="mt-3 text-sm text-neutral-700"><span className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</span><DirectionalText text={item.notes} as="div" className="mt-1" /></div> : null}
 </div>
 )) : <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">No opportunities linked yet.</div>}
 </div>
 </div>
 {renderSidebar()}
 </div>
 );

 const renderFollowUps = () => (
 <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h3 className="text-sm font-semibold text-neutral-900">Follow-ups</h3>
 <p className="mt-1 text-sm text-neutral-500">Keep the next contact visible and easy to update.</p>
 </div>
 <div className="flex flex-wrap gap-2">
 <button type="button" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors" onClick={() => void handleMarkFollowedUpToday()}>Mark Followed Up Today</button>
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => setShowRelationshipForm(true)}>Set Next Follow-up</button>
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => onUpdateRelationship(selectedRelationship.id, { nextContactDate: null, nextAction: '' })}>Clear Follow-up</button>
 </div>
 </div>
 <div className="mt-4 grid gap-3 md:grid-cols-2">
 <div className="rounded-md bg-neutral-50 p-3">
 <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Next Contact Date</div>
 <div className="mt-1 text-sm text-neutral-900">{formatDate(selectedRelationship.nextContactDate)}</div>
 </div>
 <div className="rounded-md bg-neutral-50 p-3">
 <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Next Action</div>
 <div className="mt-1 text-sm text-neutral-900">{selectedRelationship.nextAction || '—'}</div>
 </div>
 <div className="rounded-md bg-neutral-50 p-3 md:col-span-2">
 <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Follow-up Status</div>
 <div className="mt-1 text-sm text-neutral-900">{followUpOverdue ? 'Follow-up overdue' : 'Follow-up on track'}</div>
 </div>
 </div>
 </div>
 {renderSidebar()}
 </div>
 );

 const renderNotes = () => (
 <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h3 className="text-sm font-semibold text-neutral-900">Notes</h3>
 <p className="mt-1 text-sm text-neutral-500">Editable notes for the relationship.</p>
 </div>
 <button type="button" className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors" onClick={() => setShowRelationshipForm(true)}>Edit Notes</button>
 </div>
  <DirectionalText text={selectedRelationship.notes || '—'} as="p" className="mt-3 whitespace-pre-wrap text-sm text-neutral-700" preserveWhitespace />
 </div>
 {renderSidebar()}
 </div>
 );

 return (
 <section className="space-y-7">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="flex flex-wrap items-start justify-between gap-4">
 <div>
 <div className="flex flex-wrap items-center gap-2">
 <button type="button" onClick={onBack} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Back</button>
  <DirectionalText text={selectedRelationship.displayName} as="h2" className="text-2xl font-semibold text-neutral-900" />
 </div>
 <div className="mt-2 flex flex-wrap gap-2 text-xs font-medium">
 {selectedRelationship.domain ? <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(selectedRelationship.domain)}`}>{selectedRelationship.domain.replace('_', ' ')}</span> : null}
 {selectedRelationship.relationshipType ? <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(selectedRelationship.relationshipType)}`}>{selectedRelationship.relationshipType}</span> : null}
 {selectedRelationship.relationshipStrength ? <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(selectedRelationship.relationshipStrength)}`}>{selectedRelationship.relationshipStrength}</span> : null}
 {selectedRelationship.trustLevel ? <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(selectedRelationship.trustLevel)}`}>{selectedRelationship.trustLevel}</span> : null}
 {selectedRelationship.status ? <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${badgeClass(selectedRelationship.status)}`}>{selectedRelationship.status}</span> : null}
 </div>
 <div className="mt-3 text-sm text-neutral-500">
 {linkedPerson ? `Linked person: ${linkedPerson.fullName}` : 'No linked person'}
 </div>
 </div>
 <div className="flex flex-wrap gap-2">
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => setShowRelationshipForm(true)}>Edit</button>
 <button type="button" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors" onClick={() => void onDeleteRelationship(selectedRelationship.id)}>Delete</button>
 </div>
 </div>
 </div>

 {renderTopCards()}

 <div className="border-b border-neutral-200">
 <div className="flex flex-wrap gap-1">
 {WORKSPACE_TABS.map((tab) => {
 const isActive = activeTab === tab.id;
 return (
 <button
 key={tab.id}
 type="button"
 onClick={() => setActiveTab(tab.id)}
 className={
 'relative px-3 pb-3 pt-2 text-sm transition-colors border-b-2 ' +
 (isActive
 ? 'border-neutral-900 text-neutral-900'
 : 'border-transparent text-neutral-500 hover:text-neutral-900')
 }
 >
 {tab.label}
 </button>
 );
 })}
 </div>
 </div>

 {activeTab === 'overview' && renderOverview()}
 {activeTab === 'contact' && renderContact()}
 {activeTab === 'timeline' && renderTimeline()}
 {activeTab === 'value' && renderValue()}
 {activeTab === 'problems' && renderProblems()}
 {activeTab === 'opportunities' && renderOpportunities()}
 {activeTab === 'follow-ups' && renderFollowUps()}
 {activeTab === 'ai-assistant' && (
 <AIRelationshipAssistantPanel
 relationship={selectedRelationship}
 categoryName={selectedCategory?.name || undefined}
 linkedPerson={linkedPerson}
 contactMethods={contactMethodItems}
 interactions={timelineItems}
 opportunities={opportunityItems}
 onAddRelationshipInteraction={onAddRelationshipInteraction}
 onUpdateRelationship={onUpdateRelationship}
 />
 )}
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
 <OpportunityModal title={t("common.addContactMethod", "common.addContactMethod", "Add Contact Method")} onClose={() => setShowContactMethodForm(false)}>
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
