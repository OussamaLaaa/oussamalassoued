import React, { useMemo } from 'react';
import type { OutreachMessage } from '../../types/opportunities';

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
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-medium text-lg text-[#0f172a]">Outreach Messages</h3>
        <span className="text-xs text-[#64748b]">{filtered.length} / {messages.length}</span>
      </div>

      {/* Filters */}
      {filters && (
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-[#e5e7eb]">
          <select
            value={filters.replyStatus}
            onChange={(e) => setFilter('replyStatus', e.target.value)}
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          >
            <option value="">Reply Status</option>
            <option value="no_reply">No Reply</option>
            <option value="replied">Replied</option>
            <option value="waiting">Waiting</option>
            <option value="bounced">Bounced</option>
            <option value="none">None</option>
          </select>
          <select
            value={filters.followUp}
            onChange={(e) => setFilter('followUp', e.target.value)}
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          >
            <option value="">Follow-ups</option>
            <option value="overdue">Overdue</option>
            <option value="today">Today</option>
          </select>
          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2]"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="text-xs text-[#475569] bg-[#f8fafc]">
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
                <tr key={m.id} className={`border-t border-[#e5e7eb] hover:bg-[#f9fafb] ${overdue ? 'bg-[#fef2f2]' : followUpToday ? 'bg-[#fffbeb]' : ''}`}>
                  <td className="px-3 py-3 text-sm text-[#0f172a]">{new Date(m.sentDate || '').toLocaleDateString()}</td>
                  <td className="px-3 py-3 font-semibold text-[#0f172a]">{m.companyName}</td>
                  <td className="px-3 py-3 text-[#0f172a]">{m.personName}</td>
                  <td className="px-3 py-3 text-[#0f172a]">{m.channel}</td>
                  <td className="px-3 py-3 text-[#0f172a]">{m.messageType}</td>
                  <td className="px-3 py-3 text-sm text-[#0f172a]">{m.replyStatus}</td>
                  <td className="px-3 py-3 text-xs">
                    {overdue && <span className="text-[#dc2626] font-medium">Overdue</span>}
                    {followUpToday && <span className="text-[#d97706] font-medium">Today</span>}
                    {!overdue && !followUpToday && m.nextFollowUpDate && (
                      <span className="text-[#64748b]">{new Date(m.nextFollowUpDate).toLocaleDateString()}</span>
                    )}
                    {!m.nextFollowUpDate && <span className="text-[#94a3b8]">—</span>}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center gap-1">
                      {onEdit && (
                        <button
                          type="button"
                          onClick={() => onEdit(m)}
                          className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]"
                        >
                          Edit
                        </button>
                      )}
                      {onDelete && (
                        <button
                          type="button"
                          onClick={() => onDelete(m.id)}
                          className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2]"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr><td colSpan={8} className="px-3 py-8 text-center text-sm text-[#64748b]">No messages match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MessagesTable;