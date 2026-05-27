import React, { useEffect, useMemo, useState } from 'react';
import type { Company, Deal, DealInput, MessageInput, OutreachMessage, Person, PersonContactMethod, PersonContactMethodInput, PersonInput } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import StatusBadge from './StatusBadge';
import OpportunityModal from './OpportunityModal';
import PersonContactMethodForm from './PersonContactMethodForm';
import { ContactLink, getContactHref } from './contactHelpers';

const tabs = ['overview', 'contact_methods', 'messages', 'deals', 'notes'] as const;
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
});

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
};

interface Props {
  company: Company;
  person: Person;
  people: Person[];
  messages: OutreachMessage[];
  deals: Deal[];
  personContactMethods: PersonContactMethod[];
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
  company,
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
    () => personContactMethods.filter((method) => String(method.personId) === String(person.id)),
    [person.id, personContactMethods],
  );

  const primaryMethod = useMemo(
    () => personMethods.find((method) => method.isPrimary) || personMethods[0] || null,
    [personMethods],
  );

  const personMessages = useMemo(
    () => messages.filter((message) => String(message.personId) === String(person.id)),
    [messages, person.id],
  );

  const personDeals = useMemo(
    () => deals.filter((deal) => String(deal.personId) === String(person.id)),
    [deals, person.id],
  );

  const latestMessage = useMemo(
    () => [...personMessages].sort((a, b) => String(b.sentDate || b.createdAt || '').localeCompare(String(a.sentDate || a.createdAt || '')))[0] || null,
    [personMessages],
  );

  const nextActionDate = person.nextFollowUpDate || latestMessage?.nextFollowUpDate || '—';

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

  const companyMessages = personMessages.filter((message) => String(message.companyId || '') === String(company.id) || !message.companyId);
  const companyDeals = personDeals.filter((deal) => String(deal.companyId || '') === String(company.id) || !deal.companyId);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2 text-neutral-600">← Back to Company</Button>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-2xl font-semibold text-neutral-900">{person.fullName}</h2>
            {person.role ? <Badge variant="neutral">{person.role}</Badge> : null}
            {person.seniority ? <Badge variant="neutral">{person.seniority}</Badge> : null}
            {person.decisionPower ? <Badge variant="neutral">Decision {person.decisionPower}</Badge> : null}
            {person.relevance ? <Badge variant="neutral">Relevance {person.relevance}</Badge> : null}
            {person.relationshipStatus ? <Badge variant="neutral">{person.relationshipStatus}</Badge> : null}
          </div>
          <p className="mt-2 text-sm text-neutral-600">{company.name}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => onEditPerson(person)}>Edit Person</Button>
          <Button type="button" variant="secondary" size="sm" onClick={openAddContactMethod}>Add Contact Method</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onAddMessage(person.id)}>Log Message</Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => onAddDeal(person.id)}>Add Deal</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <div className={cardClass}>
          <div className={sectionLabelClass}>Company</div>
          <div className={`mt-2 ${valueClass}`}>{company.name}</div>
        </div>
        <div className={cardClass}>
          <div className={sectionLabelClass}>Primary Contact</div>
          <div className={`mt-2 ${valueClass}`}>{primaryMethod ? <ContactLink type={primaryMethod.type} value={primaryMethod.value} displayValue={primaryMethod.label || primaryMethod.value} /> : '—'}</div>
        </div>
        <div className={cardClass}>
          <div className={sectionLabelClass}>Last Message</div>
          <div className={`mt-2 ${valueClass}`}>{latestMessage ? formatDate(latestMessage.sentDate || latestMessage.createdAt) : '—'}</div>
        </div>
        <div className={cardClass}>
          <div className={sectionLabelClass}>Next Follow-up</div>
          <div className={`mt-2 ${valueClass}`}>{nextActionDate === '—' ? '—' : formatDate(nextActionDate)}</div>
        </div>
        <div className={cardClass}>
          <div className={sectionLabelClass}>Relevance</div>
          <div className={`mt-2 ${valueClass}`}>{person.relevance ?? '—'}</div>
        </div>
        <div className={cardClass}>
          <div className={sectionLabelClass}>Decision Power</div>
          <div className={`mt-2 ${valueClass}`}>{person.decisionPower ?? '—'}</div>
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
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <div className={cardClass}>
            <div className={sectionLabelClass}>Profile</div>
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <div className={sectionLabelClass}>Full Name</div>
                <div className={`mt-1 ${valueClass}`}>{person.fullName}</div>
              </div>
              <div>
                <div className={sectionLabelClass}>Company</div>
                <div className={`mt-1 ${valueClass}`}>{company.name}</div>
              </div>
              <div>
                <div className={sectionLabelClass}>Role</div>
                <div className={`mt-1 ${valueClass}`}>{person.role || '—'}</div>
              </div>
              <div>
                <div className={sectionLabelClass}>Department</div>
                <div className={`mt-1 ${valueClass}`}>{person.department || '—'}</div>
              </div>
              <div>
                <div className={sectionLabelClass}>Seniority</div>
                <div className={`mt-1 ${valueClass}`}>{person.seniority || '—'}</div>
              </div>
              <div>
                <div className={sectionLabelClass}>Contact Channel</div>
                <div className={`mt-1 ${valueClass}`}>{person.contactChannel || '—'}</div>
              </div>
              <div>
                <div className={sectionLabelClass}>Relationship Status</div>
                <div className={`mt-1 ${valueClass}`}>{person.relationshipStatus || '—'}</div>
              </div>
              <div>
                <div className={sectionLabelClass}>Next Follow-up</div>
                <div className={`mt-1 ${valueClass}`}>{formatDate(person.nextFollowUpDate)}</div>
              </div>
            </div>
          </div>
          <div className={cardClass}>
            <div className={sectionLabelClass}>Summary</div>
            <div className="mt-4 space-y-3 text-sm text-neutral-700">
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-2">
                <span className="text-neutral-500">Company</span>
                <span className="font-medium text-neutral-900">{company.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-2">
                <span className="text-neutral-500">Primary Contact</span>
                <span className="font-medium text-neutral-900">{primaryMethod ? primaryMethod.label || primaryMethod.value : '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-2">
                <span className="text-neutral-500">Last Message</span>
                <span className="font-medium text-neutral-900">{latestMessage ? formatDate(latestMessage.sentDate || latestMessage.createdAt) : '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-2">
                <span className="text-neutral-500">Next Follow-up</span>
                <span className="font-medium text-neutral-900">{formatDate(nextActionDate)}</span>
              </div>
              <div className="flex items-center justify-between gap-3 border-b border-neutral-200 pb-2">
                <span className="text-neutral-500">Relevance</span>
                <span className="font-medium text-neutral-900">{person.relevance ?? '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-neutral-500">Decision Power</span>
                <span className="font-medium text-neutral-900">{person.decisionPower ?? '—'}</span>
              </div>
            </div>
          </div>
          <div className={cardClass}>
            <div className={sectionLabelClass}>Contact Links</div>
            <div className="mt-4 space-y-2 text-sm">
              {person.linkedin ? <ContactLink type="linkedin" value={person.linkedin} /> : null}
              {person.emailPublic ? <ContactLink type="email" value={person.emailPublic} /> : null}
              {!person.linkedin && !person.emailPublic && personMethods.length === 0 ? <div className="text-neutral-500">No contact links yet.</div> : null}
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

      {tab === 'messages' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="primary" size="sm" onClick={() => onAddMessage(person.id)}>Log Message</Button>
          </div>
          {companyMessages.length === 0 ? (
            <EmptyState title="No messages logged for this person yet." description="Log the first message to track the conversation." />
          ) : (
            <div className="space-y-2">
              {companyMessages.map((message) => (
                <div key={message.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-neutral-900">{formatDate(message.sentDate || message.createdAt)}</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="neutral">{message.channel || '—'}</Badge>
                        <Badge variant="neutral">{message.messageType || '—'}</Badge>
                        <StatusBadge status={message.replyStatus} />
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => void deleteMessage(message.id)} className="text-neutral-600">Delete</Button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className={sectionLabelClass}>Summary</div>
                      <div className="mt-1 text-sm text-neutral-700 break-words">{message.messageText || message.replySummary || '—'}</div>
                    </div>
                    <div>
                      <div className={sectionLabelClass}>Follow-up</div>
                      <div className="mt-1 text-sm text-neutral-700">{formatDate(message.nextFollowUpDate)}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'deals' ? (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button type="button" variant="primary" size="sm" onClick={() => onAddDeal(person.id)}>Add Deal</Button>
          </div>
          {companyDeals.length === 0 ? (
            <EmptyState title="No deals linked to this person yet." description="Add a deal to track this relationship." />
          ) : (
            <div className="space-y-2">
              {companyDeals.map((deal) => (
                <div key={deal.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-2">
                      <div className="text-sm font-medium text-neutral-900">{deal.servicePackage || 'Untitled Deal'}</div>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="neutral">{deal.stage || '—'}</Badge>
                        <Badge variant="neutral">{typeof deal.probability === 'number' ? `${deal.probability}%` : '—'}</Badge>
                        <Badge variant="neutral">{deal.value != null ? `${deal.currency || '$'}${deal.value}` : '—'}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => void deleteDeal(deal.id)} className="text-neutral-600">Delete</Button>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div>
                      <div className={sectionLabelClass}>Problem</div>
                      <div className="mt-1 text-sm text-neutral-700 break-words">{deal.problem || '—'}</div>
                    </div>
                    <div>
                      <div className={sectionLabelClass}>Next Action</div>
                      <div className="mt-1 text-sm text-neutral-700 break-words">{deal.nextAction || '—'}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : null}

      {tab === 'notes' ? (
        <div className="space-y-4">
          {notesError ? <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">{notesError}</div> : null}
          <div className={cardClass}>
            <textarea
              className="min-h-[220px] w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
              value={notesDraft}
              onChange={(event) => setNotesDraft(event.target.value)}
              placeholder="Write notes about this person..."
            />
            <div className="mt-3 flex items-center justify-end gap-3">
              <Button type="button" variant="primary" size="sm" onClick={handleSaveNotes} disabled={notesSaving}>
                {notesSaving ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>
          </div>
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
