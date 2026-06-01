import React, { useMemo, useState } from 'react';
import type { Company, Deal, OutreachMessage, Person, PersonInput, MessageInput } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';

const parseDate = (value?: string | null) => {
 if (!value) return null;
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return null;
 return date;
};

const startOfDay = (date: Date) => {
 const copy = new Date(date);
 copy.setHours(0, 0, 0, 0);
 return copy;
};

const dayKey = (value?: string | null) => {
 const date = parseDate(value);
 if (!date) return null;
 return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
};

const formatDate = (value?: string | null) => {
 const date = parseDate(value);
 if (!date) return '—';
 return date.toLocaleDateString(undefined, { month: 'numeric', day: 'numeric', year: 'numeric' });
};

const formatShortDate = (value?: string | null) => {
 const date = parseDate(value);
 if (!date) return '—';
 return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatRelative = (value?: string | null) => {
 const date = parseDate(value);
 if (!date) return '—';

 const now = new Date();
 const diffMs = date.getTime() - now.getTime();
 const absMinutes = Math.round(Math.abs(diffMs) / 60000);
 const absHours = Math.round(absMinutes / 60);
 const absDays = Math.round(absHours / 24);

 if (absMinutes < 60) {
 return diffMs < 0 ? `${absMinutes}m ago` : `in ${absMinutes}m`;
 }

 if (absHours < 24) {
 return diffMs < 0 ? `${absHours}h ago` : `in ${absHours}h`;
 }

 if (absDays === 1) {
 return diffMs < 0 ? 'Yesterday' : 'Tomorrow';
 }

 if (absDays < 7) {
 return diffMs < 0 ? `${absDays} days ago` : `in ${absDays} days`;
 }

 return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const normalizeText = (value?: string | null) => (value || '').trim().toLowerCase();

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

type SectionCardProps = {
 title: string;
 subtitle: string;
 count?: number;
 action?: React.ReactNode;
 children: React.ReactNode;
};

const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, count, action, children }) => (
 <Card className="overflow-hidden">
 <CardHeader className="border-b border-neutral-200 px-5 py-4">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0">
 <CardTitle className="text-sm">{title}</CardTitle>
 <CardDescription className="mt-1 text-xs">{subtitle}</CardDescription>
 </div>
 <div className="flex items-center gap-2 shrink-0">
 {typeof count === 'number' ? <span className="text-xs text-neutral-500">{count} items</span> : null}
 {action}
 </div>
 </div>
 </CardHeader>
 <CardContent className="p-0">{children}</CardContent>
 </Card>
);

const CompactEmptyState: React.FC<{ title: string; description: string; action?: React.ReactNode }> = ({ title, description, action }) => (
 <div className="px-5 py-6 text-center">
 <div className="mx-auto max-w-sm rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5">
 <h4 className="m-0 text-sm font-semibold text-black">{title}</h4>
 <p className="mt-1 text-xs leading-relaxed text-neutral-500">{description}</p>
 {action ? <div className="mt-4 inline-flex">{action}</div> : null}
 </div>
 </div>
);

const rowShell = 'flex items-start justify-between gap-3 px-5 py-3 transition-colors hover:bg-neutral-50';

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
 onUseTemplate?: (person: Person) => void;
 onResetDemoData: () => void;
 onOpenCompaniesTab?: () => void;
}> = ({ companies, people, messages, deals, updatePerson, updateMessage, onAddCompany, onAddPerson, onAddMessage, onUseTemplate, onResetDemoData, onOpenCompaniesTab }) => {
 const [rescheduleTarget, setRescheduleTarget] = useState<FollowUpItem | null>(null);
 const [rescheduleDate, setRescheduleDate] = useState('');

 const today = startOfDay(new Date());
 const todayKey = dayKey(today.toISOString()) || '';

 const followUpItems = useMemo<FollowUpItem[]>(() => {
 const peopleItems = people.flatMap((person) => {
 const sortDate = parseDate(person.nextFollowUpDate);
 if (!sortDate) return [];
 return [{
 kind: 'person' as const,
 id: person.id,
 personId: person.id,
 companyName: person.companyName || 'Unknown company',
 personName: person.fullName,
 statusText: person.relationshipStatus || 'No Contact',
 channel: person.contactChannel,
 nextFollowUpDate: person.nextFollowUpDate || '',
 sortDate,
 source: person,
 }];
 });

 const messageItems = messages.flatMap((message) => {
 const sortDate = parseDate(message.nextFollowUpDate);
 if (!sortDate) return [];
 return [{
 kind: 'message' as const,
 id: message.id,
 personId: message.personId,
 companyName: message.companyName || 'Unknown company',
 personName: message.personName || 'Unknown person',
 channel: message.channel,
 statusText: message.replyStatus || message.status || 'none',
 nextFollowUpDate: message.nextFollowUpDate || '',
 sortDate,
 source: message,
 }];
 });

 return [...peopleItems, ...messageItems].sort((a, b) => {
 const delta = a.sortDate.getTime() - b.sortDate.getTime();
 if (delta !== 0) return delta;
 return a.companyName.localeCompare(b.companyName) || a.personName.localeCompare(b.personName);
 });
 }, [messages, people]);

 const followUpsToday = followUpItems.filter((item) => dayKey(item.nextFollowUpDate) === todayKey);
 const overdueFollowUps = followUpItems.filter((item) => {
 const key = dayKey(item.nextFollowUpDate);
 return Boolean(key && key < todayKey);
 });

 const highPriorityCompanies = useMemo(() => {
 return [...companies]
 .filter((company) => company.priority === 'high' || (typeof company.fitScore === 'number' && company.fitScore >= 80) || company.ethicalFit === 'good')
 .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0) || a.name.localeCompare(b.name))
 .slice(0, 3);
 }, [companies]);

 const recentOutreach = useMemo(() => {
 return [...messages]
 .sort((a, b) => (parseDate(b.sentDate)?.getTime() || parseDate(b.createdAt)?.getTime() || 0) - (parseDate(a.sentDate)?.getTime() || parseDate(a.createdAt)?.getTime() || 0))
 .slice(0, 3);
 }, [messages]);

 const next7Days = useMemo(() => {
 return Array.from({ length: 7 }, (_, index) => {
 const date = new Date(today);
 date.setDate(today.getDate() + index);
 const key = dayKey(date.toISOString()) || '';
 const count = followUpItems.filter((item) => dayKey(item.nextFollowUpDate) === key).length;
 return { date, key, count };
 });
 }, [followUpItems, today]);
 const snapshotTotal = next7Days.reduce((sum, entry) => sum + entry.count, 0);

 const sentMessages = messages.filter((message) => parseDate(message.sentDate) !== null);
 const sentInLast30Days = sentMessages.filter((message) => {
 const date = parseDate(message.sentDate)!;
 const diffDays = Math.floor((today.getTime() - startOfDay(date).getTime()) / 86400000);
 return diffDays >= 0 && diffDays <= 30;
 }).length;
 const repliesCount = messages.filter((message) => normalizeText(message.replyStatus) === 'replied').length;
 const meetingsCount = deals.filter((deal) => normalizeText(deal.stage) === 'negotiation').length;
 const closedCount = deals.filter((deal) => normalizeText(deal.stage) === 'won').length;
 const newLeadsCount = people.filter((person) => {
 const date = parseDate(person.createdAt);
 if (!date) return false;
 const diffDays = Math.floor((today.getTime() - startOfDay(date).getTime()) / 86400000);
 return diffDays >= 0 && diffDays <= 30;
 }).length;

 const totalCompanies = companies.length;
 const totalPeople = people.length;
 const openDeals = deals.filter((deal) => !['won', 'lost'].includes(normalizeText(deal.stage))).length;
 const highPriorityLeadCount = companies.filter((company) => company.priority === 'high' || (typeof company.fitScore === 'number' && company.fitScore >= 80)).length;
 const followUpsDueToday = followUpsToday.length;

 const handleMarkDone = async (item: FollowUpItem) => {
 try {
 if (item.kind === 'person') {
 await updatePerson(item.id, { ...toPersonInput(item.source as Person), nextFollowUpDate: null as unknown as string });
 } else {
 await updateMessage(item.id, { ...toMessageInput(item.source as OutreachMessage), nextFollowUpDate: null as unknown as string });
 }
 } catch (error) {
 console.error('[Opportunities] Failed to mark follow-up done.', error);
 }
 };

 const handleOpenReschedule = (item: FollowUpItem) => {
 setRescheduleTarget(item);
 setRescheduleDate(item.nextFollowUpDate.slice(0, 10));
 };

 const handleSaveReschedule = async () => {
 if (!rescheduleTarget || !rescheduleDate) return;

 try {
 if (rescheduleTarget.kind === 'person') {
 await updatePerson(rescheduleTarget.id, { ...toPersonInput(rescheduleTarget.source as Person), nextFollowUpDate: rescheduleDate });
 } else {
 await updateMessage(rescheduleTarget.id, { ...toMessageInput(rescheduleTarget.source as OutreachMessage), nextFollowUpDate: rescheduleDate });
 }
 setRescheduleTarget(null);
 setRescheduleDate('');
 } catch (error) {
 console.error('[Opportunities] Failed to reschedule follow-up.', error);
 }
 };

 const renderFollowUpRow = (item: FollowUpItem) => {
 const isEditing = rescheduleTarget?.kind === item.kind && rescheduleTarget?.id === item.id;
 return (
 <div key={`${item.kind}-${item.id}`} className={rowShell}>
 <div className="min-w-0 flex-1">
 <div className="truncate text-sm font-semibold text-black">{item.companyName}</div>
 <div className="mt-0.5 truncate text-sm text-neutral-600">{item.personName}</div>
 <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
 {item.channel ? <Badge variant="neutral">{item.channel}</Badge> : null}
 <Badge variant="neutral">Status: {item.statusText}</Badge>
 </div>
 </div>
 <div className="shrink-0 text-right text-xs text-neutral-500">
 <div>{formatShortDate(item.nextFollowUpDate)}</div>
 <div className="mt-1 font-medium text-black">Due</div>
 </div>
 <div className="flex shrink-0 flex-wrap justify-end gap-1.5 self-center">
 {onUseTemplate ? (
 <Button
 variant="ghost"
 size="sm"
 onClick={() => {
 const targetPerson = people.find((person) => person.id === item.personId);
 if (targetPerson) onUseTemplate(targetPerson);
 }}
 className="text-neutral-700 hover:text-neutral-900"
 >
 Template
 </Button>
 ) : null}
 <Button variant="ghost" size="sm" onClick={() => void handleMarkDone(item)} className="text-neutral-700 hover:text-neutral-900">Done</Button>
 <Button variant="secondary" size="sm" onClick={() => handleOpenReschedule(item)}>Reschedule</Button>
 </div>
 {isEditing ? (
 <div className="mt-3 flex w-full flex-wrap items-center gap-2 rounded-lg border border-neutral-200 bg-white p-3">
 <input
 type="date"
 value={rescheduleDate}
 onChange={(event) => setRescheduleDate(event.target.value)}
 className="rounded-md border border-neutral-200 bg-white px-2.5 py-1.5 text-xs text-black outline-none focus:border-neutral-400"
 />
 <Button variant="primary" size="sm" onClick={() => void handleSaveReschedule()}>Save</Button>
 <Button variant="secondary" size="sm" onClick={() => { setRescheduleTarget(null); setRescheduleDate(''); }}>Cancel</Button>
 </div>
 ) : null}
 </div>
 );
 };

 const renderMessageRow = (message: OutreachMessage) => {
 const sentLabel = formatRelative(message.sentDate || message.createdAt || null);
 const replyLabel = message.replyStatus === 'replied' ? 'Replied' : message.replyStatus === 'waiting' ? 'Waiting' : message.replyStatus === 'bounced' ? 'Bounced' : message.replyStatus === 'none' ? 'None' : 'No reply';

 return (
 <li key={message.id} className={rowShell}>
 <div className="min-w-0 flex-1">
 <div className="truncate text-sm font-semibold text-black">{message.companyName || 'Unknown company'} — {message.personName || 'Unknown person'}</div>
 <div className="mt-0.5 truncate text-sm text-neutral-600">{message.channel || 'Message'} • {message.messageType || 'outreach'}</div>
 <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-neutral-500">
 <Badge variant="neutral">{replyLabel}</Badge>
 {message.nextFollowUpDate ? <Badge variant="neutral">Next: {formatShortDate(message.nextFollowUpDate)}</Badge> : null}
 </div>
 </div>
 <div className="shrink-0 text-right text-xs text-neutral-500">{sentLabel}</div>
 </li>
 );
 };

 const renderPriorityRow = (company: Company) => (
 <div key={company.id} className={rowShell}>
 <div className="min-w-0 flex-1">
 <div className="truncate text-sm font-semibold text-black">{company.name}</div>
 <div className="mt-0.5 truncate text-sm text-neutral-600">
 {(company.status || 'prospect').replace(/_/g, ' ')} • {company.industry || company.category || company.city || 'Current lead'}
 </div>
 </div>
 <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 text-xs text-neutral-500">
 <Badge variant="neutral">Fit {typeof company.fitScore === 'number' ? company.fitScore : '—'}</Badge>
 <Badge variant="neutral">{company.priority || 'medium'}</Badge>
 <span className="max-w-[220px] truncate text-right">{company.nextAction || 'No next action set'}</span>
 </div>
 </div>
 );

 const renderSnapshotDay = (keyId: string, label: string, count: number) => (
 <div className="rounded-md border border-neutral-200 px-2 py-3 text-center" key={keyId}>
 <div className="text-xs text-neutral-500">{label}</div>
 <div className="mt-1 text-sm font-semibold text-black tabular-nums">{count}</div>
 </div>
 );

  return (
  <div className="space-y-5">
  <section>
  <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">Total Companies</p>
  <p className="mt-1.5 text-2xl font-bold text-neutral-900 tabular-nums">{totalCompanies}</p>
  <p className="mt-1 text-xs text-neutral-400">Current total</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">Total People</p>
  <p className="mt-1.5 text-2xl font-bold text-neutral-900 tabular-nums">{totalPeople}</p>
  <p className="mt-1 text-xs text-neutral-400">Current total</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">Messages Sent</p>
  <p className="mt-1.5 text-2xl font-bold text-indigo-600 tabular-nums">{sentInLast30Days}</p>
  <p className="mt-1 text-xs text-neutral-400">Last 30 days</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">Follow-ups Due</p>
  <p className="mt-1.5 text-2xl font-bold text-amber-600 tabular-nums">{followUpsDueToday}</p>
  <p className="mt-1 text-xs text-neutral-400">Today</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">Open Deals</p>
  <p className="mt-1.5 text-2xl font-bold text-emerald-600 tabular-nums">{openDeals}</p>
  <p className="mt-1 text-xs text-neutral-400">Current total</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">High Priority Leads</p>
  <p className="mt-1.5 text-2xl font-bold text-amber-600 tabular-nums">{highPriorityLeadCount}</p>
  <p className="mt-1 text-xs text-neutral-400">Score ≥ 80</p>
  </div>
  </div>
  </section>

 <section className="grid gap-4 lg:grid-cols-2">
 <SectionCard
 title="Follow-ups Today"
 subtitle="Stay on top of today's touchpoints."
 count={followUpsToday.length}
 action={<Button variant="secondary" size="sm" onClick={onAddMessage}>Add</Button>}
 >
 {followUpsToday.length ? (
 <div className="divide-y divide-neutral-100">
 {followUpsToday.slice(0, 3).map(renderFollowUpRow)}
 </div>
 ) : (
 <CompactEmptyState
 title="No follow-ups scheduled for today."
 description="Add a contact touchpoint or reschedule an existing one."
 action={<Button variant="secondary" size="sm" onClick={onAddMessage}>Log Message</Button>}
 />
 )}
 </SectionCard>

 <SectionCard
 title="Overdue Follow-ups"
 subtitle="These need your attention."
 count={overdueFollowUps.length}
 >
 {overdueFollowUps.length ? (
 <div className="divide-y divide-neutral-100">
 {overdueFollowUps.slice(0, 3).map(renderFollowUpRow)}
 </div>
 ) : (
 <CompactEmptyState
 title="No overdue follow-ups."
 description="Everything is currently on schedule."
 />
 )}
 </SectionCard>
 </section>

 <section className="grid gap-4 lg:grid-cols-2">
 <SectionCard
 title="High Priority Opportunities"
 subtitle="Top-scoring leads worth a push."
 count={highPriorityCompanies.length}
 action={onOpenCompaniesTab ? <Button variant="ghost" size="sm" onClick={onOpenCompaniesTab} className="text-neutral-700 hover:text-neutral-900">View all</Button> : undefined}
 >
 {highPriorityCompanies.length ? (
 <div className="divide-y divide-neutral-100">
 {highPriorityCompanies.map(renderPriorityRow)}
 </div>
 ) : (
 <CompactEmptyState
 title="No high priority opportunities."
 description="Run AI scoring on your companies to surface the best ones."
 action={<Button variant="secondary" size="sm" onClick={onAddCompany}>Add Company</Button>}
 />
 )}
 </SectionCard>

  <SectionCard title="Quick Stats" subtitle="This period">
  <div className="grid grid-cols-2 divide-x divide-y divide-neutral-100">
  <div className="px-4 py-4">
  <p className="text-xs text-blue-600">New leads</p>
  <p className="mt-1.5 text-lg font-bold text-neutral-900 tabular-nums">{newLeadsCount}</p>
  </div>
  <div className="px-4 py-4">
  <p className="text-xs text-emerald-600">Replies</p>
  <p className="mt-1.5 text-lg font-bold text-neutral-900 tabular-nums">{repliesCount}</p>
  </div>
  <div className="px-4 py-4">
  <p className="text-xs text-amber-600">Meetings</p>
  <p className="mt-1.5 text-lg font-bold text-neutral-900 tabular-nums">{meetingsCount}</p>
  </div>
  <div className="px-4 py-4">
  <p className="text-xs text-violet-600">Closed</p>
  <p className="mt-1.5 text-lg font-bold text-neutral-900 tabular-nums">{closedCount}</p>
  </div>
  </div>
  </SectionCard>
 </section>

 <section className="grid gap-4 lg:grid-cols-2">
 <SectionCard title="Recent Outreach" subtitle="The latest messages you've logged." count={recentOutreach.length}>
 {recentOutreach.length ? (
 <ul className="divide-y divide-neutral-100">
 {recentOutreach.map(renderMessageRow)}
 </ul>
 ) : (
 <CompactEmptyState
 title="No outreach yet."
 description="Log your first message to track conversations."
 action={<Button variant="secondary" size="sm" onClick={onAddMessage}>Log Message</Button>}
 />
 )}
 </SectionCard>

 <SectionCard title="Follow-up Snapshot" subtitle="Next 7 days" count={snapshotTotal} action={<Button variant="secondary" size="sm" onClick={onResetDemoData}>Reset demo data</Button>}>
 {followUpItems.length ? (
 <div className="px-5 py-5">
 <div className="grid grid-cols-7 gap-2 overflow-x-auto">
 {next7Days.map((entry) => renderSnapshotDay(entry.key, entry.date.toLocaleDateString(undefined, { weekday: 'narrow' }), entry.count))}
 </div>
 <p className="mt-3 text-sm text-neutral-500">{snapshotTotal} follow-ups scheduled in the next 7 days. Tap a day to see details.</p>
 </div>
 ) : (
 <CompactEmptyState
 title="No follow-ups scheduled in the next 7 days."
 description="Set a next follow-up date on a person or message to populate the snapshot."
 action={<Button variant="secondary" size="sm" onClick={onAddPerson}>Add Person</Button>}
 />
 )}
 </SectionCard>
 </section>
 </div>
 );
};

export default OpportunitiesDashboard;
