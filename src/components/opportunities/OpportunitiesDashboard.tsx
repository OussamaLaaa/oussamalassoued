import React from 'react';
import type { Company, Person, OutreachMessage, Deal, PersonInput, MessageInput } from '../../types/opportunities';
import StatCard from '../ui/StatCard';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <CardTitle style={{ fontSize: '14px' }}>{title}</CardTitle>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{items.length} items</span>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {items.length === 0 ? (
            <EmptyState title={emptyText} />
          ) : (
            items.map((item) => {
              const isEditing = rescheduleTarget?.kind === item.kind && rescheduleTarget?.id === item.id;

              return (
                <div key={`${item.kind}-${item.id}`} style={{
                  borderRadius: '8px', border: `1px solid ${highlight ? '#fecaca' : '#e5e7eb'}`,
                  background: highlight ? '#fff5f5' : '#f8fafc',
                  padding: '12px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 600, color: '#0f172a' }}>{item.companyName}</div>
                      <div style={{ fontSize: '13px', color: '#475569' }}>{item.personName}</div>
                      <div style={{ marginTop: '4px', display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#64748b' }}>
                        {item.channel && <Badge variant="neutral">{item.channel}</Badge>}
                        <Badge variant="neutral">Status: {item.statusText}</Badge>
                      </div>
                    </div>
                    <div style={{ flexShrink: 0, textAlign: 'right', fontSize: '12px', color: '#64748b' }}>
                      <div>{formatDate(item.nextFollowUpDate)}</div>
                      <div style={{ marginTop: '4px', fontWeight: 500, color: '#0f172a' }}>Due</div>
                    </div>
                  </div>

                  <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {onUseTemplate && (
                      <Button
                        variant="secondary" size="sm"
                        onClick={() => {
                          const targetPerson = people.find((person) => person.id === item.personId);
                          if (targetPerson) onUseTemplate(targetPerson);
                        }}
                      >
                        Use Template
                      </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={() => void handleMarkDone(item)}>Mark Done</Button>
                    <Button variant="primary" size="sm" onClick={() => handleOpenReschedule(item)}>Reschedule</Button>
                  </div>

                  {isEditing && (
                    <div style={{ marginTop: '12px', display: 'flex', flexWrap: 'wrap', gap: '8px', borderRadius: '8px', border: '1px solid #bfdbfe', background: '#ffffff', padding: '12px' }}>
                      <input
                        type="date"
                        value={rescheduleDate}
                        onChange={(event) => setRescheduleDate(event.target.value)}
                        style={{
                          borderRadius: '6px', border: '1px solid #e5e7eb', padding: '6px 10px',
                          fontSize: '12px', color: '#0f172a', background: '#ffffff',
                          outline: 'none',
                        }}
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '22px', fontWeight: 600, color: '#0f172a' }}>Dashboard</h2>
          <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>Pipeline health, follow-ups, and priority opportunities.</p>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          <Button variant="primary" size="md" onClick={onAddCompany}>Add Company</Button>
          <Button variant="secondary" size="md" onClick={onAddPerson}>Add Person</Button>
          <Button variant="secondary" size="md" onClick={onAddMessage}>Log Message</Button>
          <Button variant="secondary" size="md" onClick={onAddDeal}>Add Deal</Button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
        <StatCard label="Total Companies" value={totalCompanies} icon="🏢" />
        <StatCard label="Total People" value={totalPeople} icon="👥" />
        <StatCard label="Messages Sent" value={messagesSent} icon="✉️" />
        <StatCard label="Follow-ups Due" value={followupsDue} icon="📅" />
        <StatCard label="Open Deals" value={openDeals} icon="💰" />
        <StatCard label="High Priority Leads" value={highPriorityCompanies.length} icon="⭐" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {renderFollowUpSection('Follow-ups Today', followUpsToday, 'No follow-ups today')}
          {renderFollowUpSection('Overdue Follow-ups', overdueFollowUps, 'No overdue items', true)}
          {upcomingFollowUps.length > 0 && renderFollowUpSection('Upcoming Follow-ups', upcomingFollowUps, 'No upcoming follow-ups')}

          <Card>
            <CardHeader>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <CardTitle style={{ fontSize: '14px' }}>High Priority Opportunities</CardTitle>
                <span style={{ fontSize: '12px', color: '#64748b' }}>{highPriorityCompanies.length} items</span>
              </div>
            </CardHeader>
            <CardContent>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {highPriorityCompanies.length === 0 ? (
                  <EmptyState title="No high priority opportunities." />
                ) : (
                  highPriorityCompanies.map((company) => (
                    <div key={company.id} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      borderRadius: '8px', border: '1px solid #e5e7eb',
                      background: '#f8fafc', padding: '12px',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{company.name}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{company.databaseType || company.industry} • {company.city}</div>
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center' }}>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>{company.nextAction ?? '—'}</span>
                        <span style={{ fontSize: '13px', color: '#64748b' }}>Fit: {company.fitScore ?? '—'}</span>
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
              <CardTitle style={{ fontSize: '14px' }}>Recent Outreach</CardTitle>
            </CardHeader>
            <CardContent>
              {recentMessages.length === 0 ? (
                <EmptyState title="No outreach yet." />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {recentMessages.map((message) => (
                    <div key={message.id} style={{
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      padding: '12px 0', borderBottom: '1px solid #e5e7eb',
                    }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#0f172a' }}>{message.companyName} — {message.personName}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>{message.channel} • {message.messageType}</div>
                        <div style={{ marginTop: '4px', fontSize: '12px', color: '#94a3b8' }}>Reply: {message.replyStatus} • Next: {formatDate(message.nextFollowUpDate)}</div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#64748b', flexShrink: 0 }}>{formatDate(message.sentDate)}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        <Card>
          <CardContent>
            <CardTitle style={{ fontSize: '14px' }}>Follow-up Snapshot</CardTitle>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>Today <strong>{followUpsToday.length}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>Overdue <strong>{overdueFollowUps.length}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>Upcoming <strong>{upcomingFollowUps.length}</strong></div>
            </div>
            <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <Button variant="secondary" size="sm" onClick={onResetDemoData}>Reset demo data</Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <CardTitle style={{ fontSize: '14px' }}>Quick Stats</CardTitle>
            <div style={{ marginTop: '12px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '13px', color: '#64748b' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>Total Companies <strong>{totalCompanies}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>Total People <strong>{totalPeople}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>Open Deals <strong>{openDeals}</strong></div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>Follow-ups Due <strong>{followupsDue}</strong></div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OpportunitiesDashboard;
