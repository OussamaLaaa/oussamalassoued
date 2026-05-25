import React, { useMemo } from 'react';
import type { OutreachMessage } from '../../types/opportunities';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Input from '../ui/Input';
import Select from '../ui/Select';
import StatCard from '../ui/StatCard';

export interface MessageFilters {
  searchQuery: string;
  replyStatus: string;
  followUp: string;
  channel: string;
  messageType: string;
  dateRange: string;
}

const replyStatusOptions = [
  { value: '', label: 'Reply Status' },
  { value: 'no_reply', label: 'No Reply' },
  { value: 'replied', label: 'Replied' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'bounced', label: 'Bounced' },
  { value: 'none', label: 'None' },
];

const followUpOptions = [
  { value: '', label: 'Follow-ups' },
  { value: 'overdue', label: 'Overdue' },
  { value: 'today', label: 'Today' },
];

const channelOptions = [
  { value: '', label: 'Channel' },
  { value: 'Email', label: 'Email' },
  { value: 'LinkedIn', label: 'LinkedIn' },
  { value: 'WhatsApp', label: 'WhatsApp' },
  { value: 'Phone', label: 'Phone' },
  { value: 'Other', label: 'Other' },
];

const typeOptions = [
  { value: '', label: 'Type' },
  { value: 'Cold', label: 'Cold' },
  { value: 'Proposal', label: 'Proposal' },
  { value: 'Check-in', label: 'Check-in' },
  { value: 'Follow-up', label: 'Follow-up' },
  { value: 'Reply', label: 'Reply' },
  { value: 'Other', label: 'Other' },
];

const dateRangeOptions = [
  { value: '', label: 'Date' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All time' },
];

const normalize = (value?: string | null) => (value || '').trim().toLowerCase();

const toDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const formatDate = (value?: string | null) => {
  const date = toDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const formatFollowUp = (value?: string | null) => {
  if (!value) return '—';
  const normalized = normalize(value);
  if (normalized.startsWith('overdue')) return value;
  if (normalized.startsWith('today')) return 'Today';
  return formatDate(value);
};

const getReplyVariant = (value?: string) => {
  switch (normalize(value)) {
    case 'replied':
      return 'success';
    case 'sent':
      return 'blue';
    case 'waiting':
      return 'purple';
    case 'no_reply':
      return 'warning';
    case 'bounced':
      return 'danger';
    default:
      return 'neutral';
  }
};

const getFollowUpVariant = (value?: string | null) => {
  const normalized = normalize(value);
  if (normalized.startsWith('overdue')) return 'danger';
  if (normalized.startsWith('today')) return 'warning';
  return 'neutral';
};

const toComparableDate = (value?: string | null) => {
  const date = toDate(value);
  if (!date) return null;
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const MessagesTable: React.FC<{
  messages: OutreachMessage[];
  onEdit?: (message: OutreachMessage) => void;
  onDelete?: (id: string) => void;
  filters?: MessageFilters;
  onFilterChange?: (filters: MessageFilters) => void;
  onLogMessage?: () => void;
}> = ({ messages, onEdit, onDelete, filters, onFilterChange, onLogMessage }) => {
  const filtered = useMemo(() => {
    if (!filters) return messages;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    return messages.filter((message) => {
      if (filters.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        const haystack = [
          message.companyName,
          message.personName,
          message.messageType,
          message.replySummary,
          message.messageText,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(query)) return false;
      }

      if (filters.replyStatus && message.replyStatus !== filters.replyStatus) return false;
      if (filters.followUp === 'overdue' && !normalize(message.nextFollowUpDate).startsWith('overdue') && !(toComparableDate(message.nextFollowUpDate) && toComparableDate(message.nextFollowUpDate)! < now)) return false;
      if (filters.followUp === 'today' && !normalize(message.nextFollowUpDate).startsWith('today') && !(toComparableDate(message.nextFollowUpDate) && toComparableDate(message.nextFollowUpDate)!.getTime() === now.getTime())) return false;
      if (filters.channel && normalize(message.channel) !== normalize(filters.channel)) return false;
      if (filters.messageType && normalize(message.messageType) !== normalize(filters.messageType)) return false;
      if (filters.dateRange && filters.dateRange !== 'all') {
        const sentDate = toComparableDate(message.sentDate || message.createdAt);
        if (!sentDate) return false;
        const diffDays = Math.floor((now.getTime() - sentDate.getTime()) / 86400000);
        if (filters.dateRange === '7' && diffDays > 7) return false;
        if (filters.dateRange === '30' && diffDays > 30) return false;
        if (filters.dateRange === '90' && diffDays > 90) return false;
      }

      return true;
    });
  }, [messages, filters]);

  const setFilter = (key: keyof MessageFilters, value: string) => {
    if (!filters || !onFilterChange) return;
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    if (!filters || !onFilterChange) return;
    onFilterChange({
      searchQuery: '',
      replyStatus: '',
      followUp: '',
      channel: '',
      messageType: '',
      dateRange: '',
    });
  };

  const hasActiveFilters = Boolean(
    filters?.searchQuery ||
      filters?.replyStatus ||
      filters?.followUp ||
      filters?.channel ||
      filters?.messageType ||
      filters?.dateRange,
  );

  const total = messages.length;
  const sent = messages.filter((message) => normalize(message.status) === 'sent' || normalize(message.replyStatus) !== 'none').length;
  const replies = messages.filter((message) => normalize(message.replyStatus) === 'replied').length;
  const followUpsDue = messages.filter((message) => {
    const next = toComparableDate(message.nextFollowUpDate);
    return Boolean(next && next.getTime() === new Date(new Date().setHours(0, 0, 0, 0)).getTime());
  }).length;
  const noReply = messages.filter((message) => normalize(message.replyStatus) === 'no_reply').length;
  const responseRate = sent ? Math.round((replies / sent) * 100) : 0;

  return (
    <div className="space-y-4">
      <section className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Messages" value={total} hint="Current total" />
        <StatCard label="Sent" value={sent} hint="Logged outreach" />
        <StatCard label="Replies" value={replies} hint="Positive responses" />
        <StatCard label="Follow-ups Due" value={followUpsDue} hint="Today" />
        <StatCard label="No Reply" value={noReply} hint="Needs nudge" />
        <StatCard label="Response Rate" value={`${responseRate}%`} hint="Replied / Sent" />
      </section>

      <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div className="border-b border-neutral-200 px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-neutral-900">Messages</h2>
              <p className="mt-1 text-xs text-neutral-500">Outreach messages, replies, and follow-ups.</p>
            </div>
            <div className="text-xs text-neutral-500">
              {filtered.length} / {messages.length}
            </div>
          </div>
        </div>

        <div className="space-y-4 p-5">
          {filters ? (
            <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
              <Input
                value={filters.searchQuery}
                onChange={(event) => setFilter('searchQuery', event.target.value)}
                placeholder="Search company, person, or summary..."
                className="min-w-[240px] flex-1"
              />
              <Select value={filters.replyStatus} onChange={(event) => setFilter('replyStatus', event.target.value)} options={replyStatusOptions} />
              <Select value={filters.followUp} onChange={(event) => setFilter('followUp', event.target.value)} options={followUpOptions} />
              <Select value={filters.channel} onChange={(event) => setFilter('channel', event.target.value)} options={channelOptions} />
              <Select value={filters.messageType} onChange={(event) => setFilter('messageType', event.target.value)} options={typeOptions} />
              <Select value={filters.dateRange} onChange={(event) => setFilter('dateRange', event.target.value)} options={dateRangeOptions} />
              {hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-neutral-700 hover:text-neutral-900">
                  Clear filters
                </Button>
              ) : null}
            </div>
          ) : null}

          {filtered.length ? (
            <div className="overflow-x-auto">
              <table className="min-w-[1280px] w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                    <th className="px-4 py-3 font-medium">Date</th>
                    <th className="px-4 py-3 font-medium">Company</th>
                    <th className="px-4 py-3 font-medium">Person</th>
                    <th className="px-4 py-3 font-medium">Channel</th>
                    <th className="px-4 py-3 font-medium">Type</th>
                    <th className="px-4 py-3 font-medium">Reply</th>
                    <th className="px-4 py-3 font-medium">Follow-up</th>
                    <th className="px-4 py-3 font-medium">Summary</th>
                    <th className="px-4 py-3 text-right font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((message) => (
                    <tr key={message.id} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50">
                      <td className="px-4 py-4 align-top whitespace-nowrap text-sm text-neutral-600">
                        {formatDate(message.sentDate || message.createdAt)}
                      </td>
                      <td className="px-4 py-4 align-top font-semibold text-neutral-900">{message.companyName || '—'}</td>
                      <td className="px-4 py-4 align-top text-neutral-700">{message.personName || '—'}</td>
                      <td className="px-4 py-4 align-top"><Badge variant="neutral">{message.channel || 'Other'}</Badge></td>
                      <td className="px-4 py-4 align-top"><Badge variant="neutral">{message.messageType || 'Other'}</Badge></td>
                      <td className="px-4 py-4 align-top"><Badge variant={getReplyVariant(message.replyStatus)}>{message.replyStatus || 'none'}</Badge></td>
                      <td className="px-4 py-4 align-top whitespace-nowrap text-sm text-neutral-700">
                        {message.nextFollowUpDate ? (
                          <Badge variant={getFollowUpVariant(message.nextFollowUpDate)}>{formatFollowUp(message.nextFollowUpDate)}</Badge>
                        ) : (
                          <span className="text-neutral-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-4 align-top text-neutral-600 max-w-[360px] truncate">
                        {message.replySummary || message.messageText || '—'}
                      </td>
                      <td className="px-4 py-4 align-top">
                        <div className="flex flex-wrap justify-end gap-1.5">
                          {onEdit ? (
                            <Button variant="ghost" size="sm" onClick={() => onEdit(message)} className="text-neutral-700 hover:text-neutral-900">
                              Edit
                            </Button>
                          ) : null}
                          {onDelete ? (
                            <Button variant="ghost" size="sm" onClick={() => onDelete(message.id)} className="text-neutral-700 hover:text-neutral-900">
                              Delete
                            </Button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No messages match the current filters."
              description="Try changing filters or log a new outreach message."
              action={onLogMessage ? <Button variant="primary" size="sm" onClick={onLogMessage}>Log Message</Button> : undefined}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MessagesTable;
