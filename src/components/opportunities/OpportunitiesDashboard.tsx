import React from 'react';
import type { Company, Person, OutreachMessage, Deal, PersonInput, MessageInput } from '../../types/opportunities';
import StatCard from '../ui/StatCard';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import EmptyState from '../ui/EmptyState';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="text-sm">{title}</CardTitle>
          <span className="text-xs text-neutral-500">{items.length} items</span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {items.length === 0 ? (
            <EmptyState title={emptyText} />
          ) : (
            items.map((item) => {
              const isEditing = rescheduleTarget?.kind === item.kind && rescheduleTarget?.id === item.id;
              return (
                <div
                  key={`${item.kind}-${item.id}`}
                  className={`rounded-lg border p-3 ${highlight ? 'border-red-200 bg-red-50/50' : 'border-neutral-200 bg-neutral-50'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-black">{item.companyName}</div>
                      <div className="text-sm text-neutral-600">{item.personName}</div>
                      <div className="mt-1 flex flex-wrap gap-2 items-center text-xs text-neutral-500">
                        {item.channel && <Badge variant="neutral">{item.channel}</Badge>}
                        <Badge variant="neutral">Status: {item.statusText}</Badge>
                      </div>
                    </div>
                    <div className="shrink-0 text-right text-xs text-neutral-500">
                      <div>{formatDate(item.nextFollowUpDate)}</div>
                      <div className="mt-1 font-medium text-black">Due</div>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {onUseTemplate && (
                      <Button variant="secondary" size="sm" onClick={() => {
                        const targetPerson = people.find((person) => person.id === item.personId);
                        if (targetPerson) onUseTemplate(targetPerson);
                      }}>
                        Use Template
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => void handleMarkDone(item)}>Mark Done</Button>
                    <Button variant="primary" size="sm" onClick={() => handleOpenReschedule(item)}>Reschedule</Button>
                  </div>

                  {isEditing && (
                    <div className="mt-3 flex flex-wrap gap-2 rounded-lg border border-blue-200 bg-white p-3">
                      <input
                        type="date"
                        value={rescheduleDate}
                        onChange={(event) => setRescheduleDate(event.target.value)}
                        className="rounded-md border border-neutral-200 px-2.5 py-1.5 text-xs text-black bg-white outline-none focus:border-neutral-400 focus:ring-2 focus:ring-neutral-200"
                      />
                      <Button variant="primary" size="sm" onClick={() => void handleSaveReschedule()}>Save</Button>
                      <Button variant="secondary" size="sm" onClick={clearReschedule}>Cancel</Button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="m-0 text-xl font-semibold text-black">Dashboard</h2>
          <p className="m-0 mt-1 text-sm text-neutral-500">Pipeline health, follow-ups, and priority opportunities.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" size="md" onClick={onAddCompany}>Add Company</Button>
          <Button variant="secondary" size="md" onClick={onAddPerson}>Add Person</Button>
          <Button variant="secondary" size="md" onClick={onAddMessage}>Log Message</Button>
          <Button variant="secondary" size="md" onClick={onAddDeal}>Add Deal</Button>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
        <StatCard label="Total Companies" value={totalCompanies} icon="🏢" />
        <StatCard label="Total People" value={totalPeople} icon="👥" />
        <StatCard label="Messages Sent" value={messagesSent} icon="✉️" />
        <StatCard label="Follow-ups Due" value={followupsDue} icon="📅" />
        <StatCard label="Open Deals" value={openDeals} icon="💰" />
        <StatCard label="High Priority Leads" value={highPriorityCompanies.length} icon="⭐" />
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="flex flex-col gap-4">
          {renderFollowUpSection('Follow-ups Today', followUpsToday, 'No follow-ups today')}
          {renderFollowUpSection('Overdue Follow-ups', overdueFollowUps, 'No overdue items', true)}
          {upcomingFollowUps.length > 0 && renderFollowUpSection('Upcoming Follow-ups', upcomingFollowUps, 'No upcoming follow-ups')}

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">High Priority Opportunities</CardTitle>
                <span className="text-xs text-neutral-500">{highPriorityCompanies.length} items</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                {highPriorityCompanies.length === 0 ? (
                  <EmptyState title="No high priority opportunities." />
                ) : (
                  highPriorityCompanies.map((company) => (
                    <div key={company.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                      <div>
                        <div className="font-semibold text-black">{company.name}</div>
                        <div className="text-xs text-neutral-500">{company.databaseType || company.industry} • {company.city}</div>
                      </div>
                      <div className="flex flex-wrap gap-3 items-center">
                        <span className="text-sm text-neutral-500">{company.nextAction ?? '—'}</span>
                        <span className="text-sm text-neutral-500">Fit: {company.fitScore ?? '—'}</span>
                        <PriorityBadge priority={company.priority} />
                        <StatusBadge status={company.status} />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Recent Outreach</CardTitle>
            </CardHeader>
            <CardContent>
              {recentMessages.length === 0 ? (
                <EmptyState title="No outreach yet." />
              ) : (
                <div className="flex flex-col">
                  {recentMessages.map((message) => (
                    <div key={message.id} className="flex items-start justify-between py-3 border-b border-neutral-200 last:border-b-0">
                      <div>
                        <div className="font-semibold text-black">{message.companyName} — {message.personName}</div>
                        <div className="text-xs text-neutral-500">{message.channel} • {message.messageType}</div>
                        <div className="mt-1 text-xs text-neutral-400">Reply: {message.replyStatus} • Next: {formatDate(message.nextFollowUpDate)}</div>
                      </div>
                      <div className="text-xs text-neutral-500 shrink-0">{formatDate(message.sentDate)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
        <Card>
          <CardContent>
            <CardTitle className="text-sm">Follow-up Snapshot</CardTitle>
            <div className="mt-3 flex flex-col gap-2 text-sm text-neutral-500">
              <div className="flex justify-between">Today <strong className="text-black">{followUpsToday.length}</strong></div>
              <div className="flex justify-between">Overdue <strong className="text-black">{overdueFollowUps.length}</strong></div>
              <div className="flex justify-between">Upcoming <strong className="text-black">{upcomingFollowUps.length}</strong></div>
            </div>
            <div className="mt-4 flex justify-end">
              <Button variant="secondary" size="sm" onClick={onResetDemoData}>Reset demo data</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <CardTitle className="text-sm">Quick Stats</CardTitle>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-neutral-500">
              <div className="flex justify-between">Total Companies <strong className="text-black">{totalCompanies}</strong></div>
              <div className="flex justify-between">Total People <strong className="text-black">{totalPeople}</strong></div>
              <div className="flex justify-between">Open Deals <strong className="text-black">{openDeals}</strong></div>
              <div className="flex justify-between">Follow-ups Due <strong className="text-black">{followupsDue}</strong></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpportunitiesDashboard;
