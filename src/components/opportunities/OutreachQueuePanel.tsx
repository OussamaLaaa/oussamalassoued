import React, { useMemo, useState } from 'react';
import type { Company, OutreachMessage, Person } from '../../types/opportunities';
import StatCard from '../ui/StatCard';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import EmptyState from '../ui/EmptyState';

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
 <Card>
 <CardHeader>
 <div className="flex items-center justify-between gap-2">
 <CardTitle className="text-xs uppercase tracking-wide">{title}</CardTitle>
 <span className="text-xs text-neutral-500">{count}</span>
 </div>
 </CardHeader>
 <CardContent>
 <div className="flex flex-col gap-3">
 {items.length === 0 ? (
 <EmptyState title={emptyText} />
 ) : (
 items.map((item) => (
 <article key={item.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div>
 <div className="mb-1 flex flex-wrap items-center gap-2">
 <span className="font-semibold text-black">{item.person.fullName}</span>
 <Badge variant="neutral">{item.companyName}</Badge>
 {item.source === 'message' && <Badge variant="neutral">Message follow-up</Badge>}
 </div>
 <div className="text-sm text-neutral-600">{item.person.role || 'No role listed'}</div>
 <div className="mt-1 text-xs text-neutral-500">{renderScoreLine(item.person)}</div>
 </div>
 <div className="shrink-0 text-right text-xs text-neutral-500">
 <div>Relationship: {item.person.relationshipStatus || 'No Contact'}</div>
 <div>Contact: {item.person.contactChannel || '—'}</div>
 <div>Follow-up: {item.nextFollowUpDate ? item.nextFollowUpDate.slice(0, 10) : '—'}</div>
 </div>
 </div>

 <div className="mt-3 flex flex-wrap items-center gap-2">
 <Button variant="secondary" size="sm" onClick={() => onUseTemplate(item.person)}>Use Template</Button>
 <Button variant="primary" size="sm" onClick={() => onLogMessage(item.person)}>Log Message</Button>
 <Button variant="secondary" size="sm" onClick={() => void onMarkContacted(item.person)}>Mark Contacted</Button>
 {reschedulingId === item.id ? (
 <div className="flex items-center gap-2 rounded-lg border border-neutral-200 bg-white p-1">
 <input
 type="date"
 value={draftDate}
 onChange={(event) => setDraftDate(event.target.value)}
 className="rounded-md border border-neutral-200 p-1 text-xs text-black outline-none"
 />
 <Button variant="primary" size="sm" onClick={() => {
 if (!draftDate) return;
 void onReschedule(item.person, item.message, draftDate);
 setReschedulingId(null);
 setDraftDate('');
 }}>Save</Button>
 <Button variant="secondary" size="sm" onClick={() => { setReschedulingId(null); setDraftDate(''); }}>Cancel</Button>
 </div>
 ) : (
 <Button variant="secondary" size="sm" onClick={() => {
 setReschedulingId(item.id);
 setDraftDate(item.nextFollowUpDate?.slice(0, 10) || '');
 }}>Reschedule</Button>
 )}
 <Button variant="secondary" size="sm" onClick={() => onOpenLinkedIn(item.person)} disabled={!item.person.linkedin}>Open LinkedIn</Button>
 </div>

 {item.person.linkedin && (
 <div className="mt-2 break-all text-xs text-neutral-500">{item.person.linkedin}</div>
 )}
 </article>
 ))
 )}
 </div>
 </CardContent>
 </Card>
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
 <div className="flex flex-col gap-4">
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
 <StatCard label="Messages Sent Today" value={sentToday} />
 <StatCard label="Follow-ups Due Today" value={followUpsDueTodayCount} />
 <StatCard label="Overdue Follow-ups" value={overdueCount} />
 <StatCard label="High Priority Not Contacted" value={highPriority.length} />
 <Card>
 <CardContent>
 <div className="flex items-center justify-between text-xs text-neutral-500">
 <span>Daily Goal</span>
 <span>{sentToday}/{DAY_GOAL}</span>
 </div>
 <div className="mt-2 h-2 rounded-full bg-neutral-200">
 <div className="h-2 rounded-full bg-black" style={{ width: `${dailyGoalProgress}%` }} />
 </div>
 <div className="mt-2 text-xs text-neutral-500">{dailyGoalProgress}% complete</div>
 </CardContent>
 </Card>
 </div>

 <QueueSection title="Overdue Follow-ups" count={overdue.length} emptyText="No overdue follow-ups."
 items={overdue}
 onUseTemplate={onUseTemplate} onLogMessage={onLogMessage}
 onMarkContacted={onMarkContacted} onReschedule={onReschedule} onOpenLinkedIn={onOpenLinkedIn} />

 <QueueSection title="Follow-ups Due Today" count={followUpsDueTodayCount} emptyText="No follow-ups due today."
 items={dueToday}
 onUseTemplate={onUseTemplate} onLogMessage={onLogMessage}
 onMarkContacted={onMarkContacted} onReschedule={onReschedule} onOpenLinkedIn={onOpenLinkedIn} />

 <QueueSection title="High Priority Not Contacted" count={highPriority.length} emptyText="No high-priority contacts waiting."
 items={highPriority}
 onUseTemplate={onUseTemplate} onLogMessage={onLogMessage}
 onMarkContacted={onMarkContacted} onReschedule={onReschedule} onOpenLinkedIn={onOpenLinkedIn} />

 <QueueSection title="Recently Imported / New Contacts" count={newContacts.length} emptyText="No new contacts waiting."
 items={newContacts}
 onUseTemplate={onUseTemplate} onLogMessage={onLogMessage}
 onMarkContacted={onMarkContacted} onReschedule={onReschedule} onOpenLinkedIn={onOpenLinkedIn} />
 </div>
 );
};

export default OutreachQueuePanel;
