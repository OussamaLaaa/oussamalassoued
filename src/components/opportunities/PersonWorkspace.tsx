import React, { useEffect, useMemo, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { Company, Deal, DealInput, MessageInput, OutreachMessage, Person, PersonContactMethod, PersonContactMethodInput, PersonInput } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import OpportunityModal from './OpportunityModal';
import PersonContactMethodForm from './PersonContactMethodForm';
import { ContactLink, getContactHref } from './contactHelpers';

const tabs = ['overview', 'contact_methods'] as const;
type PersonWorkspaceTab = (typeof tabs)[number];

const cardClass = 'rounded-xl border border-neutral-200 bg-white p-4';
const sectionLabelClass = 'text-xs font-medium uppercase tracking-wide text-neutral-500';
const valueClass = 'text-sm text-neutral-900 break-words';

const composePersonInput = (person: Person, overrides: Partial<PersonInput> = {}): PersonInput => ({
  companyId: overrides.companyId !== undefined ? overrides.companyId : person.companyId,
  fullName: overrides.fullName ?? person.fullName,
  role: overrides.role !== undefined ? overrides.role : person.role,
  department: overrides.department !== undefined ? overrides.department : person.department,
  seniority: overrides.seniority !== undefined ? overrides.seniority : person.seniority,
  decisionPower: overrides.decisionPower !== undefined ? overrides.decisionPower : (person.decisionPower ? (String(person.decisionPower) as PersonInput['decisionPower']) : undefined),
  influencePower: overrides.influencePower !== undefined ? overrides.influencePower : (person.influencePower ? (String(person.influencePower) as PersonInput['influencePower']) : undefined),
  relevance: overrides.relevance !== undefined ? overrides.relevance : (person.relevance ? (String(person.relevance) as PersonInput['relevance']) : undefined),
  linkedin: overrides.linkedin !== undefined ? overrides.linkedin : person.linkedin,
  emailPublic: overrides.emailPublic !== undefined ? overrides.emailPublic : person.emailPublic,
  contactChannel: overrides.contactChannel !== undefined ? overrides.contactChannel : person.contactChannel,
  relationshipStatus: overrides.relationshipStatus !== undefined ? overrides.relationshipStatus : person.relationshipStatus,
  nextFollowUpDate: overrides.nextFollowUpDate !== undefined ? overrides.nextFollowUpDate : person.nextFollowUpDate,
  notes: overrides.notes !== undefined ? overrides.notes : person.notes,
  phone: overrides.phone !== undefined ? overrides.phone : (person.phone ?? null),
  relationType: overrides.relationType !== undefined ? overrides.relationType : (person.relationType ?? null),
  status: overrides.status !== undefined ? overrides.status : (person.status ?? 'active'),
  archivedAt: overrides.archivedAt !== undefined ? overrides.archivedAt : (person.archivedAt ?? null),
});

const formatDate = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

interface Props {
  company?: Company;
  companies?: Company[];
  person: Person;
  people: Person[];
  messages: OutreachMessage[];
  deals: Deal[];
  personContactMethods?: PersonContactMethod[];
  autoOpenAddContactMethod?: boolean;
  onBack: () => void;
  onEditPerson: (person: Person) => void;
  onAddMessage: (personId?: string) => void;
  onAddDeal: (personId?: string) => void;
  addPersonContactMethod: (input: PersonContactMethodInput) => Promise<PersonContactMethod>;
  updatePersonContactMethod: (id: string, input: Partial<PersonContactMethodInput>) => Promise<PersonContactMethod>;
  deletePersonContactMethod: (id: string) => Promise<void>;
  updatePerson: (id: string, input: PersonInput) => Promise<Person>;
  addMessage: (input: MessageInput) => Promise<OutreachMessage>;
  updateMessage: (id: string, input: Partial<MessageInput>) => Promise<OutreachMessage>;
  deleteMessage: (id: string) => Promise<void>;
  addDeal: (input: DealInput) => Promise<Deal>;
  updateDeal: (id: string, input: Partial<DealInput>) => Promise<Deal>;
  deleteDeal: (id: string) => Promise<void>;
}

const PersonWorkspace: React.FC<Props> = ({
  company: directCompany,
  companies,
  person,
  people,
  messages,
  deals,
  personContactMethods,
  autoOpenAddContactMethod,
  onBack,
  onEditPerson,
  onAddMessage,
  onAddDeal,
  addPersonContactMethod,
  updatePersonContactMethod,
  deletePersonContactMethod,
  updatePerson,
  addMessage,
  updateMessage,
  deleteMessage,
  addDeal,
  updateDeal,
  deleteDeal,
}) => {
  const [tab, setTab] = useState<PersonWorkspaceTab>('overview');
  const [notesDraft, setNotesDraft] = useState(person.notes || '');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesError, setNotesError] = useState('');
  const [showContactMethodForm, setShowContactMethodForm] = useState(false);
  const [editingContactMethod, setEditingContactMethod] = useState<PersonContactMethod | null>(null);
  const [contactMethodError, setContactMethodError] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  const safePeople = people ?? [];
  const safeMessages = messages ?? [];
  const safeDeals = deals ?? [];
  const safePersonContactMethods = personContactMethods ?? [];
  const safeCompanies = companies ?? [];
  const company = directCompany ?? safeCompanies.find((c) => c.id === person.companyId) ?? null;

  useEffect(() => {
    setTab('overview');
    setNotesDraft(person.notes || '');
    setNotesError('');
    setContactMethodError('');
    setEditingContactMethod(null);
    setShowContactMethodForm(false);
  }, [person.id]);

  useEffect(() => {
    if (autoOpenAddContactMethod) {
      openAddContactMethod();
    }
  }, [autoOpenAddContactMethod]);

  const personMethods = useMemo(
    () => safePersonContactMethods.filter((method) => String(method.personId) === String(person.id)),
    [person.id, safePersonContactMethods],
  );

  const primaryMethod = useMemo(
    () => personMethods.find((method) => method.isPrimary) || personMethods[0] || null,
    [personMethods],
  );

  const setPrimaryContactMethod = async (method: PersonContactMethod) => {
    await updatePersonContactMethod(method.id, { personId: person.id, isPrimary: true });
    const otherPrimaryMethods = personMethods.filter((item) => item.id !== method.id && item.isPrimary);
    for (const other of otherPrimaryMethods) {
      await updatePersonContactMethod(other.id, { personId: person.id, isPrimary: false });
    }
  };

  const handleSaveNotes = async () => {
    setNotesSaving(true);
    setNotesError('');
    try {
      await updatePerson(person.id, composePersonInput(person, { notes: notesDraft }));
    } catch {
      setNotesError('Unable to save notes.');
    } finally {
      setNotesSaving(false);
    }
  };

  const openAddContactMethod = () => {
    setEditingContactMethod(null);
    setContactMethodError('');
    setShowContactMethodForm(true);
  };

  const openEditContactMethod = (method: PersonContactMethod) => {
    setEditingContactMethod(method);
    setContactMethodError('');
    setShowContactMethodForm(true);
  };

  const handleSaveContactMethod = async (data: PersonContactMethodInput) => {
    try {
      if (editingContactMethod) {
        const next = await updatePersonContactMethod(editingContactMethod.id, data);
        if (data.isPrimary) {
          await setPrimaryContactMethod(next);
        }
      } else {
        const created = await addPersonContactMethod(data);
        if (data.isPrimary) {
          await setPrimaryContactMethod(created);
        }
      }
      setShowContactMethodForm(false);
      setEditingContactMethod(null);
    } catch {
      setContactMethodError('Unable to save contact method.');
      throw new Error('Unable to save contact method.');
    }
  };

  const handleDeleteContactMethod = async (id: string) => {
    const ok = window.confirm('Delete this contact method?');
    if (!ok) return;
    await deletePersonContactMethod(id);
  };

  const handleOpenContactMethod = (method: PersonContactMethod) => {
    const href = getContactHref(method.type, method.value);
    if (href) {
      window.open(href, '_blank', 'noopener,noreferrer');
      return;
    }
    void navigator.clipboard.writeText(method.value).catch(() => undefined);
  };

  const handleCopy = (key: string, value: string) => {
    navigator.clipboard.writeText(value).catch(() => undefined);
    setCopyFeedback(key);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const InfoTile: React.FC<{ label: string; value?: string | null }> = ({ label, value }) => (
    <div>
      <div className={sectionLabelClass}>{label}</div>
      <div className={`mt-1 ${valueClass}`}>{value || 'Not added yet'}</div>
    </div>
  );

  const renderSnapshotRow = (label: string, value: string | null | undefined, type: string) => {
    if (!value) return null;
    const href = getContactHref(type, value);
    return (
      <div className="flex items-center justify-between rounded-lg border px-3.5 py-2.5 bg-neutral-50/60 border-neutral-100">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 shrink-0">{label}</span>
          <span className="text-sm text-neutral-900 truncate max-w-[240px]">{value}</span>
        </div>
        <div className="flex shrink-0 gap-1 ml-2">
          {href ? (
            <button type="button" onClick={() => window.open(href, '_blank', 'noopener,noreferrer')} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-1.5 py-0.5">Open</button>
          ) : null}
          <button type="button" onClick={() => handleCopy(label, value)} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-1.5 py-0.5">{copyFeedback === label ? 'Copied!' : 'Copy'}</button>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="-ml-1.5 h-7 px-1.5 text-xs text-neutral-400 hover:text-neutral-900">
            <ArrowLeft className="h-3 w-3" />
            {directCompany ? 'Back to Company' : 'Back to People'}
          </Button>
        </div>
        <h2 className="text-xl font-semibold text-neutral-900 text-center">{person.fullName}</h2>
        <div className="flex flex-wrap justify-center gap-2">
          <Button type="button" variant="primary" size="sm" onClick={() => onEditPerson(person)}>Edit Person</Button>
          <Button type="button" variant="outline" size="sm" onClick={openAddContactMethod}>+ Contact</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Company</div>
          <div className={`mt-2 ${valueClass} text-neutral-900 font-medium`}>{company ? company.name : (person.companyName || 'Not added yet')}</div>
        </div>
        <div className={cardClass}>
          <div className={sectionLabelClass}>Primary Contact</div>
          <div className={`mt-2 ${valueClass} text-blue-600`}>{primaryMethod ? <ContactLink type={primaryMethod.type} value={primaryMethod.value} displayValue={primaryMethod.label || primaryMethod.value} /> : 'Not added yet'}</div>
        </div>
        <div className={cardClass}>
          <div className={sectionLabelClass}>Relation Type</div>
          <div className={`mt-2 ${valueClass}`}>{person.relationType ? <Badge variant="neutral">{String(person.relationType)}</Badge> : 'Not added yet'}</div>
        </div>
        <div className={cardClass}>
          <div className={sectionLabelClass}>Phone</div>
          <div className={`mt-2 ${valueClass}`}>{person.phone || 'Not added yet'}</div>
        </div>
        <div className={cardClass}>
          <div className={sectionLabelClass}>Decision Power</div>
          <div className={`mt-2 ${valueClass}`}>{person.decisionPower ?? 'Not added yet'}</div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="flex min-w-max gap-0 border-b border-neutral-200">
          {tabs.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setTab(item)}
              className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${tab === item ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-700'}`}
            >
              {item.replace('_', ' ')}
            </button>
          ))}
        </div>
      </div>

      {tab === 'overview' ? (
        <div className="space-y-6">
          {/* Person Identity Card */}
          <div className={cardClass}>
            <div className="mb-5 flex flex-col gap-3">
              <div className="text-base font-semibold text-neutral-900">{person.fullName}</div>
              <div className="flex flex-wrap gap-1.5">
                {person.relationType ? <Badge variant="neutral">{String(person.relationType)}</Badge> : null}
                {person.decisionPower ? <Badge variant="neutral">Decision: {String(person.decisionPower)}</Badge> : null}
                {person.influencePower ? <Badge variant="neutral">Influence: {String(person.influencePower)}</Badge> : null}
                {person.relevance ? <Badge variant="neutral">Relevance: {String(person.relevance)}</Badge> : null}
                {primaryMethod ? <Badge variant="blue">Primary Contact</Badge> : null}
              </div>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <InfoTile label="Role" value={person.role} />
              <InfoTile label="Company" value={company?.name || person.companyName} />
              <InfoTile label="Department" value={person.department} />
              <InfoTile label="Seniority" value={person.seniority} />
              <InfoTile label="Next Follow-up" value={formatDate(person.nextFollowUpDate)} />
              <InfoTile label="Preferred Channel" value={person.contactChannel} />
            </div>
          </div>

          {/* Contact Snapshot */}
          <div className={cardClass}>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Contact Snapshot</h3>
            <div className="space-y-2">
              {renderSnapshotRow('Phone', person.phone, 'phone')}
              {renderSnapshotRow('Email', person.emailPublic || (primaryMethod?.type === 'email' ? primaryMethod.value : null), 'email')}
              {renderSnapshotRow('LinkedIn', person.linkedin, 'linkedin')}
              {personMethods.filter((m) => !['email', 'linkedin'].includes(m.type) && m.id !== primaryMethod?.id).slice(0, 3).map((method) => (
                <div key={method.id} className="flex items-center justify-between rounded-lg border px-3.5 py-2.5 bg-neutral-50/60 border-neutral-100">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 shrink-0">{method.type}</span>
                    <span className="text-sm text-neutral-900 truncate max-w-[240px]">{method.value}</span>
                  </div>
                  <div className="flex shrink-0 gap-1 ml-2">
                    {getContactHref(method.type, method.value) ? (
                      <button type="button" onClick={() => window.open(getContactHref(method.type, method.value)!, '_blank', 'noopener,noreferrer')} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-1.5 py-0.5">Open</button>
                    ) : null}
                    <button type="button" onClick={() => handleCopy(method.id, method.value)} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-1.5 py-0.5">{copyFeedback === method.id ? 'Copied!' : 'Copy'}</button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Methods Preview */}
          {personMethods.length > 0 ? (
            <div className={cardClass}>
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Contact Methods</h3>
              <div className="space-y-2">
                {personMethods.map((method) => (
                  <div key={method.id} className="flex items-center justify-between py-1.5 border-b border-neutral-100 last:border-b-0">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-xs font-medium uppercase tracking-wide text-neutral-500 shrink-0">{method.type}</span>
                      <span className="text-sm text-neutral-900 truncate max-w-[240px]">{method.label || method.value}</span>
                      {method.isPrimary ? <Badge variant="blue">Primary</Badge> : null}
                    </div>
                    <button type="button" onClick={() => handleCopy(method.id, method.value)} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-1.5 py-0.5 shrink-0 ml-2">{copyFeedback === method.id ? 'Copied!' : 'Copy'}</button>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {/* Quick Notes */}
          <div className={cardClass}>
            <h3 className="mb-3 text-sm font-semibold text-neutral-900">Quick Notes</h3>
            {notesError ? <div className="mb-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">{notesError}</div> : null}
            <textarea
              className="min-h-[120px] w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              placeholder="Write notes about this person..."
            />
            <div className="mt-3 flex items-center justify-end">
              <Button type="button" variant="primary" size="sm" onClick={handleSaveNotes} disabled={notesSaving}>
                {notesSaving ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'contact_methods' ? (
        <div className="space-y-4">
          {personMethods.length === 0 ? (
            <EmptyState title="No contact methods yet." description="Add email, phone, LinkedIn, WhatsApp, website, or another method." />
          ) : (
            <div className="space-y-2">
              {personMethods.map((method) => (
                <div key={method.id} className="flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-3 md:flex-row md:items-center md:justify-between">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-neutral-900">{method.label || method.type}</span>
                      <Badge variant="neutral">{String(method.type)}</Badge>
                      {method.isPrimary ? <Badge variant="neutral">Primary</Badge> : null}
                    </div>
                    <div className="text-sm text-neutral-700 break-words">{method.value}</div>
                    {method.notes ? <div className="text-xs text-neutral-500">{method.notes}</div> : null}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={() => handleOpenContactMethod(method)} className="text-neutral-600">Open</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={async () => { await navigator.clipboard.writeText(method.value).catch(() => undefined); }} className="text-neutral-600">Copy</Button>
                    {!method.isPrimary ? <Button type="button" variant="ghost" size="sm" onClick={() => void setPrimaryContactMethod(method)} className="text-neutral-600">Set Primary</Button> : null}
                    <Button type="button" variant="ghost" size="sm" onClick={() => openEditContactMethod(method)} className="text-neutral-600">Edit</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={() => void handleDeleteContactMethod(method.id)} className="text-neutral-600">Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {showContactMethodForm ? (
        <OpportunityModal title={editingContactMethod ? 'Edit Contact Method' : 'Add Contact Method'} onClose={() => { setShowContactMethodForm(false); setEditingContactMethod(null); setContactMethodError(''); }}>
          <PersonContactMethodForm
            personId={person.id}
            initialData={editingContactMethod ? {
              personId: editingContactMethod.personId,
              type: editingContactMethod.type,
              label: editingContactMethod.label,
              value: editingContactMethod.value,
              isPrimary: editingContactMethod.isPrimary,
              notes: editingContactMethod.notes,
            } : { personId: person.id }}
            onSubmit={handleSaveContactMethod}
            onCancel={() => { setShowContactMethodForm(false); setEditingContactMethod(null); setContactMethodError(''); }}
          />
          {contactMethodError ? <div className="mt-3 rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">{contactMethodError}</div> : null}
        </OpportunityModal>
      ) : null}
    </div>
  );
};

export default PersonWorkspace;
