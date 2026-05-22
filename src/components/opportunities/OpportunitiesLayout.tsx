import React, { useState } from 'react';
import type { OpportunitiesTab, OpportunitiesData } from '../../types/opportunities';
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

const OpportunitiesLayout: React.FC<{
  theme?: 'light' | 'dark';
  setTheme?: (t: 'light' | 'dark') => void;
  data: OpportunitiesData & {
    addCompany: (input: any) => void;
    addPerson: (input: any) => void;
    addMessage: (input: any) => void;
    addDeal: (input: any) => void;
    resetToSeedData: () => void;
  };
}> = ({ theme = 'light', setTheme, data }) => {
  const [tab, setTab] = useState<OpportunitiesTab>('dashboard');
  const [activeModal, setActiveModal] = useState<'company' | 'person' | 'message' | 'deal' | null>(null);

  const { companies, people, messages, deals, strategyNotes, addCompany, addPerson, addMessage, addDeal, resetToSeedData } = data;

  const handleResetDemoData = () => {
    const confirmed = window.confirm('Reset Opportunities OS demo data to the original seed data?');
    if (!confirmed) return;
    resetToSeedData();
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
                onAddCompany={() => setActiveModal('company')}
                onAddPerson={() => setActiveModal('person')}
                onAddMessage={() => setActiveModal('message')}
                onAddDeal={() => setActiveModal('deal')}
                onResetDemoData={handleResetDemoData}
              />
            )}

            {tab === 'companies' && <CompaniesTable companies={companies} />}

            {tab === 'people' && <PeopleTable people={people} />}

            {tab === 'messages' && <MessagesTable messages={messages} />}

            {tab === 'deals' && <DealsTable deals={deals} />}

            {tab === 'strategy' && <StrategyPanel notes={strategyNotes} />}
          </div>
        </main>
      </div>

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

      {activeModal === 'message' ? (
        <OpportunityModal title="Log Message" onClose={() => setActiveModal(null)}>
          <LogMessageForm
            companies={companies}
            people={people}
            onSubmit={async (input) => {
              try {
                await addMessage(input);
                setActiveModal(null);
              } catch (error) {
                console.error('[Opportunities] Failed to add message.', error);
              }
            }}
            onCancel={() => setActiveModal(null)}
          />
        </OpportunityModal>
      ) : null}

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
    </div>
  );
};

export default OpportunitiesLayout;
