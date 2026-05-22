import React, { useMemo, useState } from 'react';
import type { Company, OutreachMessage, Person } from '../../types/opportunities';

type QueueGroupKey = 'overdue' | 'dueToday' | 'highPriority' | 'newContacts';

type QueueItem = {
  id: string;
  group: QueueGroupKey;
  source: 'person' | 'message';
  person: Person;
  message?: OutreachMessage;
  companyName: string;
  nextFollowUpDate?: string;
  createdAt?: string;
};

const DAY_GOAL = 10;

const baseButton = 'rounded-md border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-xs text-[#0f172a] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50';
const primaryButton = 'rounded-md bg-[#2563eb] px-2.5 py-1.5 text-xs text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50';

const toDayKey = (value: string | undefined | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayKey = toDayKey(new Date().toISOString()) || '';

const isNoContact = (value?: string) => !value || value.trim() === '' || value.trim().toLowerCase() === 'no contact';

const isHighPriorityPerson = (person: Person) => {
  const numericThreshold = 8;
  return [person.relevance, person.decisionPower, person.influencePower].some((value) => typeof value === 'number' && value >= numericThreshold);
};

const formatScore = (value: number | undefined) => (typeof value === 'number' ? value : '—');

const toQueueItems = (
  people: Person[],
  messages: OutreachMessage[],
  companies: Company[]
): {
  highPriority: QueueItem[];
  dueToday: QueueItem[];
  overdue: QueueItem[];
  newContacts: QueueItem[];
  sentToday: number;
} => {
  const companyById = new Map(companies.map((company) => [company.id, company] as const));
  const personById = new Map(people.map((person) => [person.id, person] as const));

  const highPriority = people
    .filter((person) => isHighPriorityPerson(person) && isNoContact(person.relationshipStatus))
    .map((person) => ({
      id: `person-high-${person.id}`,
      group: 'highPriority' as const,
      source: 'person' as const,
      person,
      companyName: person.companyName || companyById.get(person.companyId || '')?.name || 'Unknown company',
      nextFollowUpDate: person.nextFollowUpDate,
      createdAt: person.createdAt,
    }))
    .sort((a, b) => {
      const scoreA = Math.max(a.person.relevance || 0, a.person.decisionPower || 0, a.person.influencePower || 0);
      const scoreB = Math.max(b.person.relevance || 0, b.person.decisionPower || 0, b.person.influencePower || 0);
      if (scoreB !== scoreA) return scoreB - scoreA;
      return (toDayKey(b.createdAt) || '').localeCompare(toDayKey(a.createdAt) || '');
    });

  const followUpCandidates: QueueItem[] = [];

  people.forEach((person) => {
    const dayKey = toDayKey(person.nextFollowUpDate);
    if (!dayKey) return;
    if (dayKey !== todayKey && dayKey > todayKey) return;

    followUpCandidates.push({
      id: `person-follow-${person.id}`,
      group: dayKey === todayKey ? 'dueToday' : 'overdue',
      source: 'person',
      person,
      companyName: person.companyName || companyById.get(person.companyId || '')?.name || 'Unknown company',
      nextFollowUpDate: person.nextFollowUpDate,
      createdAt: person.createdAt,
    });
  });

  messages.forEach((message) => {
    const person = message.personId ? personById.get(message.personId) : undefined;
    if (!person) return;

    const dayKey = toDayKey(message.nextFollowUpDate);
    if (!dayKey) return;
    if (dayKey !== todayKey && dayKey > todayKey) return;

    followUpCandidates.push({
      id: `message-follow-${message.id}`,
      group: dayKey === todayKey ? 'dueToday' : 'overdue',
      source: 'message',
      person,
      message,
      companyName: message.companyName || person.companyName || companyById.get(message.companyId || person.companyId || '')?.name || 'Unknown company',
      nextFollowUpDate: message.nextFollowUpDate,
      createdAt: message.createdAt || message.sentDate,
    });
  });

  const dueToday = followUpCandidates
    .filter((item) => item.group === 'dueToday')
    .sort((a, b) => (a.source === b.source ? (a.person.fullName || '').localeCompare(b.person.fullName || '') : a.source === 'person' ? -1 : 1));

  const overdue = followUpCandidates
    .filter((item) => item.group === 'overdue')
    .sort((a, b) => (toDayKey(a.nextFollowUpDate) || '').localeCompare(toDayKey(b.nextFollowUpDate) || '') || (a.person.fullName || '').localeCompare(b.person.fullName || ''));

  const newContacts = people
    .filter((person) => isNoContact(person.relationshipStatus))
    .map((person) => ({
      id: `person-new-${person.id}`,
      group: 'newContacts' as const,
      source: 'person' as const,
      person,
      companyName: person.companyName || companyById.get(person.companyId || '')?.name || 'Unknown company',
      nextFollowUpDate: person.nextFollowUpDate,
      createdAt: person.createdAt,
    }))
    .sort((a, b) => (toDayKey(b.createdAt) || '').localeCompare(toDayKey(a.createdAt) || '') || (a.person.fullName || '').localeCompare(b.person.fullName || ''));

  const sentToday = messages.filter((message) => toDayKey(message.sentDate) === todayKey).length;

  return { highPriority, dueToday, overdue, newContacts, sentToday };
};

const renderScoreLine = (person: Person) => {
  const values = [
    `R ${formatScore(person.relevance)}`,
    `D ${formatScore(person.decisionPower)}`,
    `I ${formatScore(person.influencePower)}`,
  ];
  return values.join(' · ');
};

const QueueSection: React.FC<{
  title: string;
  count: number;
  emptyText: string;
  items: QueueItem[];
  onUseTemplate: (person: Person) => void;
  onLogMessage: (person: Person) => void;
  onMarkContacted: (person: Person) => Promise<void> | void;
  onReschedule: (person: Person, message: OutreachMessage | undefined, nextFollowUpDate: string) => Promise<void> | void;
  onOpenLinkedIn: (person: Person) => void;
}> = ({ title, count, emptyText, items, onUseTemplate, onLogMessage, onMarkContacted, onReschedule, onOpenLinkedIn }) => {
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState('');

  return (
    <section className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-sm font-mono uppercase text-[#0f172a]">{title}</h3>
        <span className="text-xs text-[#64748b]">{count}</span>
      </div>

      <div className="mt-3 space-y-3">
        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#e5e7eb] bg-[#f8fafc] px-3 py-4 text-sm text-[#64748b]">
            {emptyText}
          </div>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-md border border-[#e5e7eb] bg-[#f8fafc] p-3">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="font-semibold text-[#0f172a]">{item.person.fullName}</div>
                    <span className="rounded-full bg-white px-2 py-0.5 text-[11px] text-[#475569] border border-[#e5e7eb]">{item.companyName}</span>
                    {item.source === 'message' && <span className="rounded-full bg-[#eff6ff] px-2 py-0.5 text-[11px] text-[#1d4ed8] border border-[#bfdbfe]">Message follow-up</span>}
                  </div>
                  <div className="mt-1 text-sm text-[#475569]">{item.person.role || 'No role listed'}</div>
                  <div className="mt-1 text-xs text-[#64748b]">{renderScoreLine(item.person)}</div>
                </div>
                <div className="text-right text-xs text-[#64748b]">
                  <div>Relationship: {item.person.relationshipStatus || 'No Contact'}</div>
                  <div>Contact: {item.person.contactChannel || '—'}</div>
                  <div>Follow-up: {item.nextFollowUpDate ? item.nextFollowUpDate.slice(0, 10) : '—'}</div>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button type="button" onClick={() => onUseTemplate(item.person)} className={baseButton}>Use Template</button>
                <button type="button" onClick={() => onLogMessage(item.person)} className={primaryButton}>Log Message</button>
                <button type="button" onClick={() => void onMarkContacted(item.person)} className={baseButton}>Mark Contacted</button>
                {reschedulingId === item.id ? (
                  <div className="flex items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-2 py-1">
                    <input
                      type="date"
                      value={draftDate}
                      onChange={(event) => setDraftDate(event.target.value)}
                      className="rounded border border-[#e5e7eb] px-2 py-1 text-xs text-[#0f172a]"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (!draftDate) return;
                        void onReschedule(item.person, item.message, draftDate);
                        setReschedulingId(null);
                        setDraftDate('');
                      }}
                      className={primaryButton}
                    >
                      Save
                    </button>
                    <button type="button" onClick={() => { setReschedulingId(null); setDraftDate(''); }} className={baseButton}>Cancel</button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      const nextValue = window.prompt('Reschedule follow-up to (YYYY-MM-DD)', item.nextFollowUpDate?.slice(0, 10) || todayKey);
                      if (!nextValue) return;
                      void onReschedule(item.person, item.message, nextValue);
                    }}
                    className={baseButton}
                  >
                    Reschedule
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenLinkedIn(item.person)}
                  disabled={!item.person.linkedin}
                  className={baseButton}
                >
                  Open LinkedIn
                </button>
              </div>

              {item.person.linkedin && (
                <div className="mt-2 text-xs text-[#64748b] break-all">{item.person.linkedin}</div>
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
};

const OutreachQueuePanel: React.FC<{
  companies: Company[];
  people: Person[];
  messages: OutreachMessage[];
  onUseTemplate: (person: Person) => void;
  onLogMessage: (person: Person) => void;
  onMarkContacted: (person: Person) => Promise<void> | void;
  onReschedule: (person: Person, message: OutreachMessage | undefined, nextFollowUpDate: string) => Promise<void> | void;
  onOpenLinkedIn: (person: Person) => void;
}> = ({ companies, people, messages, onUseTemplate, onLogMessage, onMarkContacted, onReschedule, onOpenLinkedIn }) => {
  const { highPriority, dueToday, overdue, newContacts, sentToday } = useMemo(
    () => toQueueItems(people, messages, companies),
    [people, messages, companies]
  );

  const dailyGoalProgress = Math.min(100, Math.round((sentToday / DAY_GOAL) * 100));
  const followUpsDueTodayCount = dueToday.length;
  const overdueCount = overdue.length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="text-xs text-[#64748b]">Messages Sent Today</div>
          <div className="mt-2 text-2xl font-semibold text-[#0f172a]">{sentToday}</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="text-xs text-[#64748b]">Follow-ups Due Today</div>
          <div className="mt-2 text-2xl font-semibold text-[#0f172a]">{followUpsDueTodayCount}</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="text-xs text-[#64748b]">Overdue Follow-ups</div>
          <div className="mt-2 text-2xl font-semibold text-[#0f172a]">{overdueCount}</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="text-xs text-[#64748b]">High Priority Not Contacted</div>
          <div className="mt-2 text-2xl font-semibold text-[#0f172a]">{highPriority.length}</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="flex items-center justify-between text-xs text-[#64748b]">
            <span>Daily Goal Progress</span>
            <span>{sentToday}/{DAY_GOAL}</span>
          </div>
          <div className="mt-3 h-2 rounded-full bg-[#e5e7eb]">
            <div className="h-2 rounded-full bg-[#2563eb]" style={{ width: `${dailyGoalProgress}%` }} />
          </div>
          <div className="mt-2 text-xs text-[#64748b]">{dailyGoalProgress}% complete</div>
        </div>
      </div>

      <QueueSection
        title="Overdue Follow-ups"
        count={overdue.length}
        emptyText="No overdue follow-ups."
        items={overdue}
        onUseTemplate={onUseTemplate}
        onLogMessage={onLogMessage}
        onMarkContacted={onMarkContacted}
        onReschedule={onReschedule}
        onOpenLinkedIn={onOpenLinkedIn}
      />

      <QueueSection
        title="Follow-ups Due Today"
        count={followUpsDueTodayCount}
        emptyText="No follow-ups due today."
        items={dueToday}
        onUseTemplate={onUseTemplate}
        onLogMessage={onLogMessage}
        onMarkContacted={onMarkContacted}
        onReschedule={onReschedule}
        onOpenLinkedIn={onOpenLinkedIn}
      />

      <QueueSection
        title="High Priority Not Contacted"
        count={highPriority.length}
        emptyText="No high-priority contacts waiting."
        items={highPriority}
        onUseTemplate={onUseTemplate}
        onLogMessage={onLogMessage}
        onMarkContacted={onMarkContacted}
        onReschedule={onReschedule}
        onOpenLinkedIn={onOpenLinkedIn}
      />

      <QueueSection
        title="Recently Imported / New Contacts"
        count={newContacts.length}
        emptyText="No new contacts waiting."
        items={newContacts}
        onUseTemplate={onUseTemplate}
        onLogMessage={onLogMessage}
        onMarkContacted={onMarkContacted}
        onReschedule={onReschedule}
        onOpenLinkedIn={onOpenLinkedIn}
      />
    </div>
  );
};

export default OutreachQueuePanel;
