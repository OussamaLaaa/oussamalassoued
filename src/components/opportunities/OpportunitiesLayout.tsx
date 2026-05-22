import React, { useState } from 'react';
import type { OpportunitiesTab, OpportunitiesData, CompanyInput, PersonInput, MessageInput, DealInput, MessageTemplateInput, Company, Person, OutreachMessage, Deal } from '../../types/opportunities';
import OpportunitiesDashboard from './OpportunitiesDashboard';
import CompaniesTable, { type CompanyFilters } from './CompaniesTable';
import PeopleTable, { type PersonFilters } from './PeopleTable';
import MessagesTable, { type MessageFilters } from './MessagesTable';
import DealsTable, { type DealFilters } from './DealsTable';
import StrategyPanel from './StrategyPanel';
import OutreachQueuePanel from './OutreachQueuePanel';
import OpportunityModal from './OpportunityModal';
import AddCompanyForm from './AddCompanyForm';
import AddPersonForm from './AddPersonForm';
import LogMessageForm from './LogMessageForm';
import AddDealForm from './AddDealForm';
import CsvImportModal from './CsvImportModal';
import ImportPeopleModal from './ImportPeopleModal';
import OutreachTemplateModal from './OutreachTemplateModal';
import TemplatesPanel from './TemplatesPanel';
import CompanySegmentView from './CompanySegmentView';

const TABS: { id: OpportunitiesTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'big_companies', label: 'Big Companies' },
  { id: 'sme_companies', label: 'SME Companies' },
  { id: 'freelance_leads', label: 'Freelance Leads' },
  { id: 'companies', label: 'All Companies' },
  { id: 'people', label: 'People' },
  { id: 'messages', label: 'Messages' },
  { id: 'deals', label: 'Deals' },
  { id: 'queue', label: 'Outreach Queue' },
  { id: 'templates', label: 'Templates' },
  { id: 'strategy', label: 'Strategy' },
];

const toCompanyInput = (c: Company): CompanyInput => ({
  name: c.name,
  databaseType: c.databaseType as CompanyInput['databaseType'],
  category: c.category,
  industry: c.industry,
  country: c.country,
  city: c.city,
  website: c.website,
  linkedin: c.linkedin,
  priority: c.priority,
  fitScore: c.fitScore,
  ethicalFit: c.ethicalFit as CompanyInput['ethicalFit'],
  status: c.status as CompanyInput['status'],
  nextAction: c.nextAction,
  notes: c.notes,
});

const toPersonInput = (p: Person): PersonInput => ({
  companyId: p.companyId,
  fullName: p.fullName,
  role: p.role,
  department: p.department,
  seniority: p.seniority,
  decisionPower: p.decisionPower !== undefined ? String(p.decisionPower) as PersonInput['decisionPower'] : undefined,
  influencePower: p.influencePower !== undefined ? String(p.influencePower) as PersonInput['influencePower'] : undefined,
  relevance: p.relevance !== undefined ? String(p.relevance) as PersonInput['relevance'] : undefined,
  linkedin: p.linkedin,
  emailPublic: p.emailPublic,
  contactChannel: p.contactChannel,
  relationshipStatus: p.relationshipStatus,
  nextFollowUpDate: p.nextFollowUpDate,
  notes: p.notes,
});

const toMessageInput = (m: OutreachMessage): MessageInput => ({
  companyId: m.companyId,
  personId: m.personId,
  channel: m.channel as MessageInput['channel'],
  language: m.language as MessageInput['language'],
  messageType: m.messageType,
  messageText: m.messageText,
  sentDate: m.sentDate,
  replyStatus: m.replyStatus,
  replySummary: m.replySummary,
  nextFollowUpDate: m.nextFollowUpDate,
  status: m.status as MessageInput['status'],
});

const toDealInput = (d: Deal): DealInput => ({
  companyId: d.companyId,
  personId: d.personId,
  servicePackage: d.servicePackage,
  problem: d.problem,
  proposedSolution: d.proposedSolution,
  value: d.value,
  currency: d.currency as DealInput['currency'],
  stage: d.stage as DealInput['stage'],
  probability: d.probability !== undefined ? Math.round(d.probability * 100) : undefined,
  notes: d.notes,
});

const defaultCompanyFilters: CompanyFilters = {
  searchQuery: '',
  priority: '',
  status: '',
  databaseType: '',
  country: '',
};

const defaultPersonFilters: PersonFilters = {
  searchQuery: '',
  decisionPower: '',
  relevance: '',
  relationshipStatus: '',
};

const defaultMessageFilters: MessageFilters = {
  searchQuery: '',
  replyStatus: '',
  followUp: '',
};

const defaultDealFilters: DealFilters = {
  searchQuery: '',
  stage: '',
  probabilityMin: '',
  probabilityMax: '',
};

const toDayKey = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isNoContact = (value?: string) => !value || value.trim() === '' || value.trim().toLowerCase() === 'no contact';

const isHighPriorityPerson = (person: Person) => [person.relevance, person.decisionPower, person.influencePower].some((value) => typeof value === 'number' && value >= 8);

const getQueueTabCount = (people: Person[], messages: OutreachMessage[]) => {
  const today = toDayKey(new Date().toISOString()) || '';
  const highPriority = people.filter((person) => isHighPriorityPerson(person) && isNoContact(person.relationshipStatus)).length;
  const dueToday = people.filter((person) => toDayKey(person.nextFollowUpDate) === today).length + messages.filter((message) => toDayKey(message.nextFollowUpDate) === today).length;
  const overdue = people.filter((person) => {
    const next = toDayKey(person.nextFollowUpDate);
    return Boolean(next && next < today);
  }).length + messages.filter((message) => {
    const next = toDayKey(message.nextFollowUpDate);
    return Boolean(next && next < today);
  }).length;
  const newContacts = people.filter((person) => isNoContact(person.relationshipStatus)).length;

  return highPriority + dueToday + overdue + newContacts;
};

const OpportunitiesLayout: React.FC<{
  theme?: 'light' | 'dark';
  setTheme?: (t: 'light' | 'dark') => void;
  data: OpportunitiesData & {
    addCompany: (input: any) => void;
    addPerson: (input: any) => void;
    addMessage: (input: any) => void;
    addDeal: (input: any) => void;
    addTemplate: (input: MessageTemplateInput) => Promise<any>;
    updateCompany: (id: string, input: CompanyInput) => void;
    deleteCompany: (id: string) => void;
    updatePerson: (id: string, input: PersonInput) => void;
    deletePerson: (id: string) => void;
    updateMessage: (id: string, input: MessageInput) => void;
    deleteMessage: (id: string) => void;
    updateDeal: (id: string, input: DealInput) => void;
    deleteDeal: (id: string) => void;
    updateTemplate: (id: string, input: MessageTemplateInput) => Promise<any>;
    deleteTemplate: (id: string) => Promise<any>;
    seedDefaultTemplates?: () => Promise<any>;
    resetToSeedData: () => void;
    importCompaniesBatch?: (rows: Array<{ name: string; country?: string; industry?: string; website?: string }>) => Promise<any>;
    importPeople?: (rows: PersonInput[]) => Promise<any>;
  };
}> = ({ theme = 'light', setTheme, data }) => {
  const [tab, setTab] = useState<OpportunitiesTab>('dashboard');
  const [activeModal, setActiveModal] = useState<'company' | 'person' | 'message' | 'deal' | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editingMessage, setEditingMessage] = useState<OutreachMessage | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showPeopleImport, setShowPeopleImport] = useState(false);
  const [templatePerson, setTemplatePerson] = useState<Person | null>(null);
  const [messageDraft, setMessageDraft] = useState<MessageInput | null>(null);

  // Global search state
  const [globalSearch, setGlobalSearch] = useState('');

  // Per-table filter states
  const [companyFilters, setCompanyFilters] = useState<CompanyFilters>(defaultCompanyFilters);
  const [personFilters, setPersonFilters] = useState<PersonFilters>(defaultPersonFilters);
  const [messageFilters, setMessageFilters] = useState<MessageFilters>(defaultMessageFilters);
  const [dealFilters, setDealFilters] = useState<DealFilters>(defaultDealFilters);

  // Sync global search to all table filters
  const handleGlobalSearchChange = (value: string) => {
    setGlobalSearch(value);
    setCompanyFilters((prev) => ({ ...prev, searchQuery: value }));
    setPersonFilters((prev) => ({ ...prev, searchQuery: value }));
    setMessageFilters((prev) => ({ ...prev, searchQuery: value }));
    setDealFilters((prev) => ({ ...prev, searchQuery: value }));
  };

  const {
    companies, people, messages, deals, templates, strategyNotes,
    addCompany, addPerson, addMessage, addDeal, addTemplate,
    updateCompany, deleteCompany,
    updatePerson, deletePerson,
    updateMessage, deleteMessage,
    updateDeal, deleteDeal, updateTemplate, deleteTemplate, seedDefaultTemplates,
    resetToSeedData,
    importCompaniesBatch,
    importPeople,
  } = data;

  const handleResetDemoData = () => {
    const confirmed = window.confirm('Reset Opportunities OS demo data to the original seed data?');
    if (!confirmed) return;
    resetToSeedData();
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
  };

  const handleDeleteCompany = (id: string) => {
    deleteCompany(id);
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
  };

  const handleDeletePerson = (id: string) => {
    deletePerson(id);
  };

  const handleEditMessage = (message: OutreachMessage) => {
    setEditingMessage(message);
  };

  const handleDeleteMessage = (id: string) => {
    deleteMessage(id);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
  };

  const handleDeleteDeal = (id: string) => {
    deleteDeal(id);
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-[#0f172a] dashboard-shell px-4 py-6">
      <div className="max-w-[1400px] mx-auto grid grid-cols-12 gap-4">
        <aside className="col-span-12 md:col-span-3">
          <div className="sticky top-4 space-y-3">
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <h3 className="text-sm font-mono uppercase text-[#0f172a]">Opportunities OS</h3>
              <p className="mt-2 text-xs text-[#64748b]">Private CRM & outreach dashboard</p>
            </div>

            <div className="rounded-lg border border-[#e5e7eb] bg-white p-2 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              {TABS.map((t) => {
                const count = t.id === 'companies'
                  ? companies.length
                  : t.id === 'people'
                    ? people.length
                    : t.id === 'messages'
                      ? messages.length
                      : t.id === 'deals'
                        ? deals.length
                        : t.id === 'queue'
                          ? getQueueTabCount(people, messages)
                        : t.id === 'templates'
                          ? templates.length
                          : 0;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className={`w-full flex items-center justify-between gap-2 text-left px-3 py-2 rounded-md transition-all ${
                      active ? 'bg-[#eff6ff] border border-[#bfdbfe] text-[#1d4ed8] scale-100 shadow-[0_4px_12px_rgba(37,99,235,0.08)]' : 'text-[#475569] hover:bg-[#f8fafc]'
                    }`}
                  >
                    <div className={`font-medium ${active ? 'text-[#1d4ed8]' : 'text-[#475569]'}`}>{t.label}</div>
                    <div className="text-xs font-mono text-[#64748b]">{count}</div>
                  </button>
                );
              })}
            </div>

            {/* Theme toggle */}
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <div className="flex items-center justify-between">
                <div className="text-xs text-[#64748b]">Theme</div>
                <div>
                  <button
                    onClick={() => setTheme && setTheme(theme === 'light' ? 'dark' : 'light')}
                    className="text-sm px-3 py-1 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
                  >
                    {theme === 'light' ? 'Light' : 'Dark'}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 text-sm text-[#64748b] shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <div className="font-mono text-[11px] uppercase text-[#0f172a]">Quick Tips</div>
              <ul className="mt-2 list-disc list-inside text-xs text-[#64748b]">
                <li>Use the cards to monitor pipeline health.</li>
                <li>Click Edit or Delete to manage records.</li>
                <li>Use the search bar to find companies, people, emails, and LinkedIn profiles.</li>
                <li>Combine filters for precise results.</li>
              </ul>
            </div>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="space-y-4">
            {/* Global Search Bar */}
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#64748b] shrink-0">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => handleGlobalSearchChange(e.target.value)}
                  placeholder="Search across companies, people, emails, LinkedIn..."
                  className="w-full text-sm bg-transparent border-none outline-none text-[#0f172a] placeholder-[#94a3b8]"
                />
                {globalSearch && (
                  <button
                    type="button"
                    onClick={() => handleGlobalSearchChange('')}
                    className="text-xs px-2 py-1 rounded text-[#64748b] hover:text-[#dc2626] hover:bg-[#fef2f2]"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {tab === 'dashboard' && (
              <OpportunitiesDashboard
                companies={companies}
                people={people}
                messages={messages}
                deals={deals}
                updatePerson={updatePerson}
                updateMessage={updateMessage}
                onUseTemplate={(person) => setTemplatePerson(person)}
                onAddCompany={() => setActiveModal('company')}
                onAddPerson={() => setActiveModal('person')}
                onAddMessage={() => setActiveModal('message')}
                onAddDeal={() => setActiveModal('deal')}
                onResetDemoData={handleResetDemoData}
              />
            )}

            {tab === 'big_companies' && (
              <CompanySegmentView
                segmentType="big_company"
                title="Big Companies"
                subtitle="Enterprise-level targets — internships, junior roles, recruiter relationships."
                companies={companies}
                people={people}
                messages={messages}
                deals={deals}
                onAddCompany={() => setActiveModal('company')}
                onEdit={handleEditCompany}
                onDelete={handleDeleteCompany}
                onImportCompaniesBatch={importCompaniesBatch}
              />
            )}

            {tab === 'sme_companies' && (
              <CompanySegmentView
                segmentType="sme"
                title="SME Companies"
                subtitle="Small & medium businesses — faster decisions, partnership potential, agency work."
                companies={companies}
                people={people}
                messages={messages}
                deals={deals}
                onAddCompany={() => setActiveModal('company')}
                onEdit={handleEditCompany}
                onDelete={handleDeleteCompany}
                onImportCompaniesBatch={importCompaniesBatch}
              />
            )}

            {tab === 'freelance_leads' && (
              <CompanySegmentView
                segmentType="freelance"
                title="Freelance Leads"
                subtitle="Independent professionals — paid UX/UI work, audits, recurring clients."
                companies={companies}
                people={people}
                messages={messages}
                deals={deals}
                onAddCompany={() => setActiveModal('company')}
                onEdit={handleEditCompany}
                onDelete={handleDeleteCompany}
                onImportCompaniesBatch={importCompaniesBatch}
              />
            )}

            {tab === 'queue' && (
              <OutreachQueuePanel
                companies={companies}
                people={people}
                messages={messages}
                onUseTemplate={(person) => setTemplatePerson(person)}
                onLogMessage={(person) => {
                  setMessageDraft({
                    companyId: person.companyId,
                    personId: person.id,
                    channel: person.contactChannel === 'email' ? 'Email' : person.contactChannel === 'linkedin' ? 'LinkedIn' : person.contactChannel || 'LinkedIn',
                    language: 'English',
                    messageType: 'outreach',
                    messageText: '',
                    sentDate: new Date().toISOString().slice(0, 16),
                    replyStatus: 'no_reply',
                    replySummary: '',
                    nextFollowUpDate: '',
                    status: 'sent',
                  });
                  setActiveModal('message');
                }}
                onMarkContacted={async (person) => {
                  await updatePerson(person.id, {
                    ...toPersonInput(person),
                    relationshipStatus: 'Message Sent',
                    nextFollowUpDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
                  });
                }}
                onReschedule={async (person, message, nextFollowUpDate) => {
                  if (message) {
                    await updateMessage(message.id, {
                      ...toMessageInput(message),
                      nextFollowUpDate,
                    });
                    return;
                  }

                  await updatePerson(person.id, {
                    ...toPersonInput(person),
                    nextFollowUpDate,
                  });
                }}
                onOpenLinkedIn={(person) => {
                  if (!person.linkedin) return;
                  window.open(person.linkedin, '_blank', 'noopener,noreferrer');
                }}
              />
            )}

            {tab === 'companies' && (
              <>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCsvImport(true)}
                    className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
                  >
                    Import CSV
                  </button>
                </div>
                <CompaniesTable
                  companies={companies}
                  onEdit={handleEditCompany}
                  onDelete={handleDeleteCompany}
                  filters={companyFilters}
                  onFilterChange={setCompanyFilters}
                />
              </>
            )}

            {tab === 'people' && (
              <>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPeopleImport(true)}
                    className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
                  >
                    Import CSV
                  </button>
                </div>
                <PeopleTable
                  people={people}
                  onEdit={handleEditPerson}
                  onDelete={handleDeletePerson}
                  onUseTemplate={(person) => setTemplatePerson(person)}
                  filters={personFilters}
                  onFilterChange={setPersonFilters}
                />
              </>
            )}

            {tab === 'messages' && (
              <MessagesTable
                messages={messages}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                filters={messageFilters}
                onFilterChange={setMessageFilters}
              />
            )}

            {tab === 'deals' && (
              <DealsTable
                deals={deals}
                onEdit={handleEditDeal}
                onDelete={handleDeleteDeal}
                filters={dealFilters}
                onFilterChange={setDealFilters}
              />
            )}

            {tab === 'templates' && (
              <TemplatesPanel
                templates={templates}
                onAddTemplate={addTemplate}
                onUpdateTemplate={updateTemplate}
                onDeleteTemplate={deleteTemplate}
                onSeedDefaults={seedDefaultTemplates}
              />
            )}

            {tab === 'strategy' && <StrategyPanel notes={strategyNotes} />}
          </div>
        </main>
      </div>

      {/* Add Company Modal */}
      {activeModal === 'company' ? (
        <OpportunityModal title="Add Company" onClose={() => setActiveModal(null)}>
          <AddCompanyForm
            onSubmit={async (input) => {
              try {
                await addCompany(input);
                setActiveModal(null);
              } catch (error) {
                console.error('[Opportunities] Failed to add company.', error);
              }
            }}
            onCancel={() => setActiveModal(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Edit Company Modal */}
      {editingCompany ? (
        <OpportunityModal title="Edit Company" onClose={() => setEditingCompany(null)}>
          <AddCompanyForm
            initialData={toCompanyInput(editingCompany)}
            onSubmit={async (input) => {
              try {
                await updateCompany(editingCompany.id, input);
                setEditingCompany(null);
              } catch (error) {
                console.error('[Opportunities] Failed to update company.', error);
              }
            }}
            onCancel={() => setEditingCompany(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Add Person Modal */}
      {activeModal === 'person' ? (
        <OpportunityModal title="Add Person" onClose={() => setActiveModal(null)}>
          <AddPersonForm
            companies={companies}
            onSubmit={async (input) => {
              try {
                await addPerson(input);
                setActiveModal(null);
              } catch (error) {
                console.error('[Opportunities] Failed to add person.', error);
              }
            }}
            onCancel={() => setActiveModal(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Edit Person Modal */}
      {editingPerson ? (
        <OpportunityModal title="Edit Person" onClose={() => setEditingPerson(null)}>
          <AddPersonForm
            companies={companies}
            initialData={toPersonInput(editingPerson)}
            onSubmit={async (input) => {
              try {
                await updatePerson(editingPerson.id, input);
                setEditingPerson(null);
              } catch (error) {
                console.error('[Opportunities] Failed to update person.', error);
              }
            }}
            onCancel={() => setEditingPerson(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Add Message Modal */}
      {activeModal === 'message' ? (
        <OpportunityModal title="Log Message" onClose={() => { setActiveModal(null); setMessageDraft(null); }}>
          <LogMessageForm
            companies={companies}
            people={people}
            onSubmit={async (input) => {
              try {
                await addMessage(input);
                setActiveModal(null);
                setMessageDraft(null);
              } catch (error) {
                console.error('[Opportunities] Failed to add message.', error);
              }
            }}
            initialData={messageDraft || undefined}
            onCancel={() => {
              setActiveModal(null);
              setMessageDraft(null);
            }}
          />
        </OpportunityModal>
      ) : null}

      {/* Edit Message Modal */}
      {editingMessage ? (
        <OpportunityModal title="Edit Message" onClose={() => setEditingMessage(null)}>
          <LogMessageForm
            companies={companies}
            people={people}
            initialData={toMessageInput(editingMessage)}
            onSubmit={async (input) => {
              try {
                await updateMessage(editingMessage.id, input);
                setEditingMessage(null);
              } catch (error) {
                console.error('[Opportunities] Failed to update message.', error);
              }
            }}
            onCancel={() => setEditingMessage(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Add Deal Modal */}
      {activeModal === 'deal' ? (
        <OpportunityModal title="Add Deal" onClose={() => setActiveModal(null)}>
          <AddDealForm
            companies={companies}
            people={people}
            onSubmit={async (input) => {
              try {
                await addDeal(input);
                setActiveModal(null);
              } catch (error) {
                console.error('[Opportunities] Failed to add deal.', error);
              }
            }}
            onCancel={() => setActiveModal(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Edit Deal Modal */}
      {editingDeal ? (
        <OpportunityModal title="Edit Deal" onClose={() => setEditingDeal(null)}>
          <AddDealForm
            companies={companies}
            people={people}
            initialData={toDealInput(editingDeal)}
            onSubmit={async (input) => {
              try {
                await updateDeal(editingDeal.id, input);
                setEditingDeal(null);
              } catch (error) {
                console.error('[Opportunities] Failed to update deal.', error);
              }
            }}
            onCancel={() => setEditingDeal(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* CSV Import Modal */}
      {showCsvImport && (
        <CsvImportModal
          onClose={() => setShowCsvImport(false)}
          onImport={async (rows) => {
            if (!importCompaniesBatch) {
              return { success: false, error: 'Import function not available.' };
            }
            try {
              const inserted = await importCompaniesBatch(rows);
              return { success: true, count: inserted.length };
            } catch (err) {
              return { success: false, error: err instanceof Error ? err.message : 'Import failed.' };
            }
          }}
        />
      )}

      {showPeopleImport && (
        <ImportPeopleModal
          companies={companies}
          onClose={() => setShowPeopleImport(false)}
          onImport={async (rows) => {
            if (!importPeople) {
              throw new Error('Import function not available.');
            }

            try {
              const inserted = await importPeople(rows);
              return inserted;
            } catch (err) {
              throw err instanceof Error ? err : new Error('Import failed.');
            }
          }}
        />
      )}

      {templatePerson ? (
        <OutreachTemplateModal
          isOpen
          person={templatePerson}
          company={companies.find((company) => company.id === templatePerson.companyId) || null}
          templates={templates}
          onClose={() => setTemplatePerson(null)}
          onLogMessage={async (messageInput) => {
            await addMessage(messageInput);
          }}
          onUpdatePerson={async (id, input) => {
            await updatePerson(id, input);
          }}
        />
      ) : null}
    </div>
  );
};

export default OpportunitiesLayout;