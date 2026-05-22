import React, { useState } from 'react';
import type { OpportunitiesTab, OpportunitiesData, Company, Person, OutreachMessage, Deal, CompanyInput, PersonInput, MessageInput, DealInput } from '../../types/opportunities';
import OpportunitiesDashboard from './OpportunitiesDashboard';
import CompaniesTable from './CompaniesTable';
import PeopleTable from './PeopleTable';
import MessagesTable from './MessagesTable';
import DealsTable from './DealsTable';
import StrategyPanel from './StrategyPanel';
import OpportunityModal from './OpportunityModal';
import AddCompanyForm from './AddCompanyForm';
import AddPersonForm from './AddPersonForm';
import LogMessageForm from './LogMessageForm';
import AddDealForm from './AddDealForm';

const TABS: { id: OpportunitiesTab; label: string }[] = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'companies', label: 'Companies' },
  { id: 'people', label: 'People' },
  { id: 'messages', label: 'Messages' },
  { id: 'deals', label: 'Deals' },
  { id: 'strategy', label: 'Strategy' },
];

type OpportunitiesEntity = 'company' | 'person' | 'message' | 'deal';

type OpportunitiesModalState = {
  entity: OpportunitiesEntity;
  mode: 'add' | 'edit';
  id?: string;
} | null;

const OpportunitiesLayout: React.FC<{
  theme?: 'light' | 'dark';
  setTheme?: (t: 'light' | 'dark') => void;
  data: OpportunitiesData & {
    addCompany: (input: CompanyInput) => Promise<unknown>;
    addPerson: (input: PersonInput) => Promise<unknown>;
    addMessage: (input: MessageInput) => Promise<unknown>;
    addDeal: (input: DealInput) => Promise<unknown>;
    updateCompany: (id: string, input: CompanyInput) => Promise<unknown>;
    deleteCompany: (id: string) => Promise<unknown>;
    updatePerson: (id: string, input: PersonInput) => Promise<unknown>;
    deletePerson: (id: string) => Promise<unknown>;
    updateMessage: (id: string, input: MessageInput) => Promise<unknown>;
    deleteMessage: (id: string) => Promise<unknown>;
    updateDeal: (id: string, input: DealInput) => Promise<unknown>;
    deleteDeal: (id: string) => Promise<unknown>;
    resetToSeedData: () => void;
  };
}> = ({ theme = 'light', setTheme, data }) => {
  const [tab, setTab] = useState<OpportunitiesTab>('dashboard');
  const [activeModal, setActiveModal] = useState<OpportunitiesModalState>(null);

  const {
    companies,
    people,
    messages,
    deals,
    strategyNotes,
    addCompany,
    addPerson,
    addMessage,
    addDeal,
    updateCompany,
    deleteCompany,
    updatePerson,
    deletePerson,
    updateMessage,
    deleteMessage,
    updateDeal,
    deleteDeal,
    resetToSeedData,
  } = data;

  const openAddModal = (entity: OpportunitiesEntity) => setActiveModal({ entity, mode: 'add' });
  const openEditModal = (entity: OpportunitiesEntity, id: string) => setActiveModal({ entity, mode: 'edit', id });
  const closeModal = () => setActiveModal(null);

  const selectedCompany = activeModal?.entity === 'company' && activeModal.mode === 'edit'
    ? companies.find((company) => company.id === activeModal.id)
    : undefined;
  const selectedPerson = activeModal?.entity === 'person' && activeModal.mode === 'edit'
    ? people.find((person) => person.id === activeModal.id)
    : undefined;
  const selectedMessage = activeModal?.entity === 'message' && activeModal.mode === 'edit'
    ? messages.find((message) => message.id === activeModal.id)
    : undefined;
  const selectedDeal = activeModal?.entity === 'deal' && activeModal.mode === 'edit'
    ? deals.find((deal) => deal.id === activeModal.id)
    : undefined;

  const handleResetDemoData = () => {
    const confirmed = window.confirm('Reset Opportunities OS demo data to the original seed data?');
    if (!confirmed) return;
    resetToSeedData();
  };

  const handleDeleteCompany = async (company: Company) => {
    const confirmed = window.confirm('This may leave related people/messages/deals without a company. Continue?');
    if (!confirmed) return;
    await deleteCompany(company.id);
  };

  const handleDeletePerson = async (person: Person) => {
    const confirmed = window.confirm(`Delete ${person.fullName}?`);
    if (!confirmed) return;
    await deletePerson(person.id);
  };

  const handleDeleteMessage = async (message: OutreachMessage) => {
    const confirmed = window.confirm('Delete this message?');
    if (!confirmed) return;
    await deleteMessage(message.id);
  };

  const handleDeleteDeal = async (deal: Deal) => {
    const confirmed = window.confirm('Delete this deal?');
    if (!confirmed) return;
    await deleteDeal(deal.id);
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
                const count = t.id === 'companies' ? companies.length : t.id === 'people' ? people.length : t.id === 'messages' ? messages.length : t.id === 'deals' ? deals.length : 0;
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
                <li>Click rows to review details (future).</li>
              </ul>
            </div>
          </div>
        </aside>

        <main className="col-span-12 md:col-span-9">
          <div className="space-y-6">
            {tab === 'dashboard' && (
              <OpportunitiesDashboard
                companies={companies}
                people={people}
                messages={messages}
                deals={deals}
                onAddCompany={() => openAddModal('company')}
                onAddPerson={() => openAddModal('person')}
                onAddMessage={() => openAddModal('message')}
                onAddDeal={() => openAddModal('deal')}
                onResetDemoData={handleResetDemoData}
              />
            )}

            {tab === 'companies' && (
              <CompaniesTable
                companies={companies}
                onEdit={(company) => openEditModal('company', company.id)}
                onDelete={handleDeleteCompany}
              />
            )}

            {tab === 'people' && (
              <PeopleTable
                people={people}
                onEdit={(person) => openEditModal('person', person.id)}
                onDelete={handleDeletePerson}
              />
            )}

            {tab === 'messages' && (
              <MessagesTable
                messages={messages}
                onEdit={(message) => openEditModal('message', message.id)}
                onDelete={handleDeleteMessage}
              />
            )}

            {tab === 'deals' && (
              <DealsTable
                deals={deals}
                onEdit={(deal) => openEditModal('deal', deal.id)}
                onDelete={handleDeleteDeal}
              />
            )}

            {tab === 'strategy' && <StrategyPanel notes={strategyNotes} />}
          </div>
        </main>
      </div>

      {activeModal?.entity === 'company' ? (
        <OpportunityModal title={activeModal.mode === 'edit' ? 'Edit Company' : 'Add Company'} onClose={closeModal}>
          <AddCompanyForm
            initialData={selectedCompany}
            submitLabel={activeModal.mode === 'edit' ? 'Save Changes' : 'Save Company'}
            onSubmit={async (input) => {
              try {
                if (activeModal.mode === 'edit' && selectedCompany) {
                  await updateCompany(selectedCompany.id, input);
                } else {
                  await addCompany(input);
                }
                closeModal();
              } catch (error) {
                console.error('[Opportunities] Failed to add company.', error);
              }
            }}
            onCancel={closeModal}
          />
        </OpportunityModal>
      ) : null}

      {activeModal?.entity === 'person' ? (
        <OpportunityModal title={activeModal.mode === 'edit' ? 'Edit Person' : 'Add Person'} onClose={closeModal}>
          <AddPersonForm
            companies={companies}
            initialData={selectedPerson}
            submitLabel={activeModal.mode === 'edit' ? 'Save Changes' : 'Save Person'}
            onSubmit={async (input) => {
              try {
                if (activeModal.mode === 'edit' && selectedPerson) {
                  await updatePerson(selectedPerson.id, input);
                } else {
                  await addPerson(input);
                }
                closeModal();
              } catch (error) {
                console.error('[Opportunities] Failed to add person.', error);
              }
            }}
            onCancel={closeModal}
          />
        </OpportunityModal>
      ) : null}

      {activeModal?.entity === 'message' ? (
        <OpportunityModal title={activeModal.mode === 'edit' ? 'Edit Message' : 'Log Message'} onClose={closeModal}>
          <LogMessageForm
            companies={companies}
            people={people}
            initialData={selectedMessage}
            submitLabel={activeModal.mode === 'edit' ? 'Save Changes' : 'Save Message'}
            onSubmit={async (input) => {
              try {
                if (activeModal.mode === 'edit' && selectedMessage) {
                  await updateMessage(selectedMessage.id, input);
                } else {
                  await addMessage(input);
                }
                closeModal();
              } catch (error) {
                console.error('[Opportunities] Failed to add message.', error);
              }
            }}
            onCancel={closeModal}
          />
        </OpportunityModal>
      ) : null}

      {activeModal?.entity === 'deal' ? (
        <OpportunityModal title={activeModal.mode === 'edit' ? 'Edit Deal' : 'Add Deal'} onClose={closeModal}>
          <AddDealForm
            companies={companies}
            people={people}
            initialData={selectedDeal}
            submitLabel={activeModal.mode === 'edit' ? 'Save Changes' : 'Save Deal'}
            onSubmit={async (input) => {
              try {
                if (activeModal.mode === 'edit' && selectedDeal) {
                  await updateDeal(selectedDeal.id, input);
                } else {
                  await addDeal(input);
                }
                closeModal();
              } catch (error) {
                console.error('[Opportunities] Failed to add deal.', error);
              }
            }}
            onCancel={closeModal}
          />
        </OpportunityModal>
      ) : null}
    </div>
  );
};

export default OpportunitiesLayout;
