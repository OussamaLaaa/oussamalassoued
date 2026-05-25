import React, { useMemo } from 'react';
import type { OutreachMessage } from '../../types/opportunities';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
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
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total Messages" value={total} hint="Current total" />
        <StatCard label="Sent" value={sent} hint="Last 30 days" />
        <StatCard label="Replies" value={replies} hint="Last 30 days" />
        <StatCard label="Follow-ups Due" value={followUpsDue} hint="Today" />
        <StatCard label="No Reply" value={noReply} hint="Needs nudge" />
        <StatCard label="Response Rate" value={`${responseRate}%`} hint="Replied / Sent" />
      </section>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2">
        <div className="relative min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="text"
            value={filters?.searchQuery || ''}
            onChange={(event) => setFilter('searchQuery', event.target.value)}
            placeholder="Search company, person, or summary..."
            className="h-9 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400"
          />
        </div>
        <select
          value={filters?.replyStatus || ''}
          onChange={(event) => setFilter('replyStatus', event.target.value)}
          className={`h-9 rounded-md border bg-white px-3 text-sm outline-none transition-colors ${filters?.replyStatus ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}
        >
          {replyStatusOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filters?.followUp || ''}
          onChange={(event) => setFilter('followUp', event.target.value)}
          className={`h-9 rounded-md border bg-white px-3 text-sm outline-none transition-colors ${filters?.followUp ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}
        >
          {followUpOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filters?.channel || ''}
          onChange={(event) => setFilter('channel', event.target.value)}
          className={`h-9 rounded-md border bg-white px-3 text-sm outline-none transition-colors ${filters?.channel ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}
        >
          {channelOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filters?.messageType || ''}
          onChange={(event) => setFilter('messageType', event.target.value)}
          className={`h-9 rounded-md border bg-white px-3 text-sm outline-none transition-colors ${filters?.messageType ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}
        >
          {typeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <select
          value={filters?.dateRange || ''}
          onChange={(event) => setFilter('dateRange', event.target.value)}
          className={`h-9 rounded-md border bg-white px-3 text-sm outline-none transition-colors ${filters?.dateRange ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}
        >
          {dateRangeOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        {hasActiveFilters ? (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            Clear
          </Button>
        ) : null}
      </div>

      {filtered.length ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Date</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Company</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Person</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Channel</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Type</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Reply</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Follow-up</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap">Summary</th>
                  <th className="px-4 py-2.5 font-medium whitespace-nowrap text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((message) => (
                  <tr key={message.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors">
                    <td className="px-4 py-3 align-middle whitespace-nowrap text-sm text-neutral-500">
                      {formatDate(message.sentDate || message.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-neutral-900 max-w-[180px] truncate font-medium">
                      {message.companyName || '—'}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-neutral-700 max-w-[160px] truncate">
                      {message.personName || '—'}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge variant="neutral">{message.channel || 'Other'}</Badge>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge variant="neutral">{message.messageType || 'Other'}</Badge>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <Badge variant={getReplyVariant(message.replyStatus)}>
                        {message.replyStatus?.replace('_', ' ') || 'none'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 align-middle">
                      {message.nextFollowUpDate ? (
                        <Badge variant={getFollowUpVariant(message.nextFollowUpDate)}>
                          {formatFollowUp(message.nextFollowUpDate)}
                        </Badge>
                      ) : (
                        <span className="text-neutral-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 align-middle text-sm text-neutral-600 max-w-[240px] truncate">
                      {message.replySummary || message.messageText || '—'}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <div className="flex items-center justify-end gap-1">
                        {onEdit ? (
                          <button
                            type="button"
                            aria-label="Edit"
                            onClick={() => onEdit(message)}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-200 hover:bg-neutral-50 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            </svg>
                          </button>
                        ) : null}
                        {onDelete ? (
                          <button
                            type="button"
                            aria-label="Delete"
                            onClick={() => onDelete(message.id)}
                            className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                            </svg>
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-white">
          <div className="px-5 py-8 text-center">
            <div className="mx-auto max-w-sm">
              <h4 className="text-sm font-semibold text-neutral-900">No messages match the current filters.</h4>
              <p className="mt-1 text-sm text-neutral-500">Try changing filters or log a new outreach message.</p>
              {onLogMessage ? (
                <div className="mt-4 inline-flex">
                  <Button variant="primary" size="sm" onClick={onLogMessage}>Log Message</Button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessagesTable;
