import React, { useMemo } from 'react';
import type { OutreachMessage } from '../../types/opportunities';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export interface MessageFilters {
  searchQuery: string;
  replyStatus: string;
  followUp: string;
}

const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

function isOverdue(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  return dateStr <= today();
}

function isToday(dateStr: string | undefined): boolean {
  if (!dateStr) return false;
  return dateStr === today();
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

const MessagesTable: React.FC<{
  messages: OutreachMessage[];
  onEdit?: (message: OutreachMessage) => void;
  onDelete?: (id: string) => void;
  filters?: MessageFilters;
  onFilterChange?: (filters: MessageFilters) => void;
}> = ({ messages, onEdit, onDelete, filters, onFilterChange }) => {
  const filtered = useMemo(() => {
    if (!filters) return messages;
    return messages.filter((m) => {
      // Global search
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const companyName = (m.companyName || '').toLowerCase();
        const personName = (m.personName || '').toLowerCase();
        const email = '';
        const linkedin = '';
        if (!companyName.includes(q) && !personName.includes(q)) return false;
      }
      if (filters.replyStatus && m.replyStatus !== filters.replyStatus) return false;
      if (filters.followUp === 'overdue' && !isOverdue(m.nextFollowUpDate)) return false;
      if (filters.followUp === 'today' && !isToday(m.nextFollowUpDate)) return false;
      return true;
    });
  }, [messages, filters]);

  const setFilter = (key: keyof MessageFilters, value: string) => {
    if (!onFilterChange || !filters) return;
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    if (!onFilterChange || !filters) return;
    onFilterChange({
      searchQuery: '',
      replyStatus: '',
      followUp: '',
    });
  };

  const hasActiveFilters = filters && (
    filters.replyStatus || filters.followUp
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Outreach Messages</CardTitle>
          <span className="text-xs text-neutral-500">{filtered.length} / {messages.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        {filters && (
          <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-neutral-200">
            <Select
              value={filters.replyStatus}
              onChange={(e) => setFilter('replyStatus', e.target.value)}
              options={replyStatusOptions}
            />
            <Select
              value={filters.followUp}
              onChange={(e) => setFilter('followUp', e.target.value)}
              options={followUpOptions}
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 hover:text-red-700">
                Clear filters
              </Button>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-left table-auto">
            <thead>
              <tr className="text-xs text-neutral-500 bg-neutral-50">
                <th className="px-3 py-2">Date</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Person</th>
                <th className="px-3 py-2">Channel</th>
                <th className="px-3 py-2">Type</th>
                <th className="px-3 py-2">Reply Status</th>
                <th className="px-3 py-2">Follow-up</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => {
                const overdue = isOverdue(m.nextFollowUpDate);
                const followUpToday = isToday(m.nextFollowUpDate);
                return (
                  <tr key={m.id} className={`border-t border-neutral-200 hover:bg-neutral-50 ${overdue ? 'bg-red-50' : followUpToday ? 'bg-amber-50' : ''}`}>
                    <td className="px-3 py-3 text-sm text-neutral-900">{new Date(m.sentDate || '').toLocaleDateString()}</td>
                    <td className="px-3 py-3 font-semibold text-neutral-900">{m.companyName}</td>
                    <td className="px-3 py-3 text-neutral-900">{m.personName}</td>
                    <td className="px-3 py-3 text-neutral-900">{m.channel}</td>
                    <td className="px-3 py-3 text-neutral-900">{m.messageType}</td>
                    <td className="px-3 py-3 text-sm text-neutral-900">{m.replyStatus}</td>
                    <td className="px-3 py-3 text-xs">
                      {overdue && <span className="text-red-600 font-medium">Overdue</span>}
                      {followUpToday && <span className="text-amber-600 font-medium">Today</span>}
                      {!overdue && !followUpToday && m.nextFollowUpDate && (
                        <span className="text-neutral-500">{new Date(m.nextFollowUpDate).toLocaleDateString()}</span>
                      )}
                      {!m.nextFollowUpDate && <span className="text-neutral-400">—</span>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1">
                        {onEdit && (
                          <Button variant="ghost" size="sm" onClick={() => onEdit(m)} className="text-blue-600 hover:text-blue-700">Edit</Button>
                        )}
                        {onDelete && (
                          <Button variant="ghost" size="sm" onClick={() => onDelete(m.id)} className="text-red-600 hover:text-red-700">Delete</Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-3 py-8 text-center text-sm text-neutral-500">No messages match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default MessagesTable;
