import React from 'react';
import type { Company, Person, OutreachMessage, Deal, PersonInput, MessageInput } from '../../types/opportunities';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
    <div className="text-xs font-mono uppercase text-[#64748b]">{title}</div>
    <div className="mt-1 text-2xl font-semibold text-[#0f172a]">{value}</div>
  </div>
);

const formatDate = (d?: string | null) => {
  if (!d) return '-';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch {
    return d;
  }
};

const normalizeDate = (value?: string | null) => {
  if (!value) return null;

  const dateOnlyMatch = /^\d{4}-\d{2}-\d{2}$/.test(value);
  const date = dateOnlyMatch
    ? (() => {
        const [year, month, day] = value.split('-').map(Number);
        return new Date(year, month - 1, day);
      })()
    : new Date(value);

  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

const toDateInputValue = (value?: string | null) => {
  const date = normalizeDate(value);
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toPersonInput = (person: Person): PersonInput => ({
  companyId: person.companyId,
  fullName: person.fullName,
  role: person.role,
  department: person.department,
  seniority: person.seniority,
  decisionPower: person.decisionPower !== undefined ? String(person.decisionPower) as PersonInput['decisionPower'] : undefined,
  influencePower: person.influencePower !== undefined ? String(person.influencePower) as PersonInput['influencePower'] : undefined,
  relevance: person.relevance !== undefined ? String(person.relevance) as PersonInput['relevance'] : undefined,
  linkedin: person.linkedin,
  emailPublic: person.emailPublic,
  contactChannel: person.contactChannel,
  relationshipStatus: person.relationshipStatus,
  nextFollowUpDate: person.nextFollowUpDate,
  notes: person.notes,
});

const toMessageInput = (message: OutreachMessage): MessageInput => ({
  companyId: message.companyId,
  personId: message.personId,
  channel: message.channel as MessageInput['channel'],
  language: message.language as MessageInput['language'],
  messageType: message.messageType,
  messageText: message.messageText,
  sentDate: message.sentDate,
  replyStatus: message.replyStatus,
  replySummary: message.replySummary,
  nextFollowUpDate: message.nextFollowUpDate,
  status: message.status,
});

type FollowUpItem = {
  kind: 'person' | 'message';
  id: string;
  personId?: string;
  companyName: string;
  personName: string;
  channel?: string;
  statusText: string;
  nextFollowUpDate: string;
  sortDate: Date;
  source: Person | OutreachMessage;
};

const OpportunitiesDashboard: React.FC<{
  companies: Company[];
  people: Person[];
  messages: OutreachMessage[];
  deals: Deal[];
  updatePerson: (id: string, input: PersonInput) => Promise<unknown>;
  updateMessage: (id: string, input: MessageInput) => Promise<unknown>;
  onAddCompany: () => void;
  onAddPerson: () => void;
  onAddMessage: () => void;
  onAddDeal: () => void;
  onUseTemplate?: (person: Person) => void;
  onResetDemoData: () => void;
}> = ({ companies, people, messages, deals, updatePerson, updateMessage, onAddCompany, onAddPerson, onAddMessage, onAddDeal, onUseTemplate, onResetDemoData }) => {
  const totalCompanies = companies.length;
  const totalPeople = people.length;
  const messagesSent = messages.length;
  const openDeals = deals.length;
  const highPriorityCompanies = companies.filter((company) => company.priority === 'high');

  const [rescheduleTarget, setRescheduleTarget] = React.useState<FollowUpItem | null>(null);
  const [rescheduleDate, setRescheduleDate] = React.useState('');

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const followUpItems = React.useMemo<FollowUpItem[]>(() => {
    const peopleFollowUps = people.flatMap((person) => {
      const sortDate = normalizeDate(person.nextFollowUpDate);
      if (!sortDate) return [];

      return [{
        kind: 'person' as const,
        id: person.id,
        personId: person.id,
        companyName: person.companyName || 'Unknown company',
        personName: person.fullName,
        statusText: person.relationshipStatus || '—',
        nextFollowUpDate: person.nextFollowUpDate || '',
        sortDate,
        source: person,
      }];
    });

    const messageFollowUps = messages.flatMap((message) => {
      const sortDate = normalizeDate(message.nextFollowUpDate);
      if (!sortDate) return [];

      return [{
        kind: 'message' as const,
        id: message.id,
        personId: message.personId,
        companyName: message.companyName || 'Unknown company',
        personName: message.personName || 'Unknown person',
        channel: message.channel,
        statusText: message.status || message.replyStatus || '—',
        nextFollowUpDate: message.nextFollowUpDate || '',
        sortDate,
        source: message,
      }];
    });

    return [...peopleFollowUps, ...messageFollowUps].sort((a, b) => (
      a.sortDate.getTime() - b.sortDate.getTime()
      || a.companyName.localeCompare(b.companyName)
      || a.personName.localeCompare(b.personName)
    ));
  }, [messages, people]);

  const followUpsToday = followUpItems.filter((item) => item.sortDate.getTime() === today.getTime());
  const overdueFollowUps = followUpItems.filter((item) => item.sortDate.getTime() < today.getTime());
  const upcomingFollowUps = followUpItems.filter((item) => item.sortDate.getTime() > today.getTime());
  const followupsDue = followUpsToday.length + overdueFollowUps.length;

  const recentMessages = [...messages]
    .sort((a, b) => {
      const da = a.sentDate ? new Date(a.sentDate).getTime() : 0;
      const db = b.sentDate ? new Date(b.sentDate).getTime() : 0;
      return db - da;
    })
    .slice(0, 6);

  const clearReschedule = () => {
    setRescheduleTarget(null);
    setRescheduleDate('');
  };

  const handleMarkDone = async (item: FollowUpItem) => {
    try {
      if (item.kind === 'person') {
        await updatePerson(item.id, { ...toPersonInput(item.source as Person), nextFollowUpDate: null as unknown as string });
        return;
      }

      await updateMessage(item.id, { ...toMessageInput(item.source as OutreachMessage), nextFollowUpDate: null as unknown as string });
    } catch (error) {
      console.error('[Opportunities] Failed to mark follow-up done.', error);
    }
  };

  const handleOpenReschedule = (item: FollowUpItem) => {
    setRescheduleTarget(item);
    setRescheduleDate(toDateInputValue(item.nextFollowUpDate));
  };

  const handleSaveReschedule = async () => {
    if (!rescheduleTarget || !rescheduleDate) return;

    try {
      if (rescheduleTarget.kind === 'person') {
        await updatePerson(rescheduleTarget.id, { ...toPersonInput(rescheduleTarget.source as Person), nextFollowUpDate: rescheduleDate });
      } else {
        await updateMessage(rescheduleTarget.id, { ...toMessageInput(rescheduleTarget.source as OutreachMessage), nextFollowUpDate: rescheduleDate });
      }

      clearReschedule();
    } catch (error) {
      console.error('[Opportunities] Failed to reschedule follow-up.', error);
    }
  };

  const renderFollowUpSection = (title: string, items: FollowUpItem[], emptyText: string, highlight = false) => (
    <div className={`rounded-lg border bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] ${highlight ? 'border-[#fecaca] bg-[#fffafa]' : 'border-[#e5e7eb]'}`}>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-medium text-[#0f172a]">{title}</h3>
        <div className="text-xs text-[#64748b]">{items.length} items</div>
      </div>

      <div className="mt-3 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#e5e7eb] bg-[#f8fafc] px-3 py-4 text-sm text-[#64748b]">{emptyText}</div>
        ) : (
          items.map((item) => {
            const isEditing = rescheduleTarget?.kind === item.kind && rescheduleTarget?.id === item.id;

            return (
              <div key={`${item.kind}-${item.id}`} className={`rounded-md border p-3 ${highlight ? 'border-[#fecaca] bg-[#fff5f5]' : 'border-[#e5e7eb] bg-[#f8fafc]'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-semibold text-[#0f172a]">{item.companyName}</div>
                    <div className="text-sm text-[#475569]">{item.personName}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#64748b]">
                      {item.channel && <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-0.5">{item.channel}</span>}
                      <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-0.5">Status: {item.statusText}</span>
                    </div>
                  </div>
                  <div className="shrink-0 text-right text-xs text-[#64748b]">
                    <div>{formatDate(item.nextFollowUpDate)}</div>
                    <div className="mt-1 font-medium text-[#0f172a]">Due</div>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {onUseTemplate && (
                    <button
                      type="button"
                      onClick={() => {
                        const targetPerson = people.find((person) => person.id === item.personId);
                        if (targetPerson) onUseTemplate(targetPerson);
                      }}
                      className="rounded-md border border-[#dbe2ea] bg-white px-3 py-1.5 text-xs text-[#0f172a] hover:bg-[#f8fafc]"
                    >
                      Use Template
                    </button>
                  )}
                  <button type="button" onClick={() => void handleMarkDone(item)} className="rounded-md border border-[#dbe2ea] bg-white px-3 py-1.5 text-xs text-[#0f172a] hover:bg-[#f8fafc]">
                    Mark Done
                  </button>
                  <button type="button" onClick={() => handleOpenReschedule(item)} className="rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs text-[#1d4ed8] hover:bg-[#dbeafe]">
                    Reschedule
                  </button>
                </div>

                {isEditing && (
                  <div className="mt-3 flex flex-wrap items-center gap-2 rounded-md border border-[#bfdbfe] bg-white p-3">
                    <input
                      type="date"
                      value={rescheduleDate}
                      onChange={(event) => setRescheduleDate(event.target.value)}
                      className="rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15"
                    />
                    <button type="button" onClick={() => void handleSaveReschedule()} className="rounded-md bg-[#2563eb] px-3 py-2 text-xs text-white hover:bg-[#1d4ed8]">
                      Save
                    </button>
                    <button type="button" onClick={clearReschedule} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-xs text-[#0f172a] hover:bg-[#f8fafc]">
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );

  return (
    <section className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#0f172a]">Dashboard</h2>
          <p className="mt-1 text-sm text-[#64748b]">Pipeline health, follow-ups, and priority opportunities.</p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onAddCompany} className="rounded-md border border-[#2563eb] bg-[#2563eb] px-3 py-2 text-sm text-white shadow-sm">Add Company</button>
          <button type="button" onClick={onAddPerson} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">Add Person</button>
          <button type="button" onClick={onAddMessage} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">Log Message</button>
          <button type="button" onClick={onAddDeal} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">Add Deal</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard title="Total Companies" value={totalCompanies} />
        <StatCard title="Total People" value={totalPeople} />
        <StatCard title="Messages Sent" value={messagesSent} />
        <StatCard title="Follow-ups Due" value={followupsDue} />
        <StatCard title="Open Deals" value={openDeals} />
        <StatCard title="High Priority Leads" value={highPriorityCompanies.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {renderFollowUpSection('Follow-ups Today', followUpsToday, 'No follow-ups today')}
          {renderFollowUpSection('Overdue Follow-ups', overdueFollowUps, 'No overdue items', true)}
          {upcomingFollowUps.length > 0 && renderFollowUpSection('Upcoming Follow-ups', upcomingFollowUps, 'No upcoming follow-ups')}

          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[#0f172a]">High Priority Opportunities</h3>
              <div className="text-xs text-[#64748b]">{highPriorityCompanies.length} items</div>
            </div>
            <div className="mt-3 space-y-2">
              {highPriorityCompanies.length === 0 ? (
                <div className="text-sm text-[#64748b]">No high priority opportunities.</div>
              ) : (
                highPriorityCompanies.map((company) => (
                  <div key={company.id} className="flex items-center justify-between rounded-md border border-[#e5e7eb] bg-[#f8fafc] p-3">
                    <div>
                      <div className="font-semibold text-[#0f172a]">{company.name}</div>
                      <div className="text-xs text-[#64748b]">{company.databaseType || company.industry} • {company.city}</div>
                    </div>
                    <div className="flex flex-wrap items-center justify-end gap-3">
                      <div className="text-sm text-[#64748b]">{company.nextAction ?? '—'}</div>
                      <div className="text-sm text-[#64748b]">Fit: {company.fitScore ?? '—'}</div>
                      <PriorityBadge priority={company.priority} />
                      <StatusBadge status={company.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <h3 className="font-medium text-[#0f172a]">Recent Outreach</h3>
            <div className="mt-3 divide-y divide-[#e5e7eb]">
              {recentMessages.length === 0 ? (
                <div className="p-3 text-sm text-[#64748b]">No outreach yet.</div>
              ) : (
                recentMessages.map((message) => (
                  <div key={message.id} className="flex items-start justify-between p-3">
                    <div>
                      <div className="font-semibold text-[#0f172a]">{message.companyName} — {message.personName}</div>
                      <div className="text-xs text-[#64748b]">{message.channel} • {message.messageType}</div>
                      <div className="mt-1 text-xs text-[#94a3b8]">Reply: {message.replyStatus} • Next: {formatDate(message.nextFollowUpDate)}</div>
                    </div>
                    <div className="text-xs text-[#64748b]">{formatDate(message.sentDate)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <aside className="space-y-4">
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <h4 className="font-medium text-[#0f172a]">Follow-up Snapshot</h4>
            <div className="mt-3 grid grid-cols-1 gap-2 text-sm text-[#64748b]">
              <div>Today<span className="float-right">{followUpsToday.length}</span></div>
              <div>Overdue<span className="float-right">{overdueFollowUps.length}</span></div>
              <div>Upcoming<span className="float-right">{upcomingFollowUps.length}</span></div>
            </div>
            <div className="mt-4 flex justify-end">
              <button type="button" onClick={onResetDemoData} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">
                Reset demo data
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <h4 className="font-medium text-[#0f172a]">Quick Stats</h4>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#64748b]">
              <div>Total Companies<span className="float-right">{totalCompanies}</span></div>
              <div>Total People<span className="float-right">{totalPeople}</span></div>
              <div>Open Deals<span className="float-right">{openDeals}</span></div>
              <div>Follow-ups Due<span className="float-right">{followupsDue}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default OpportunitiesDashboard;
