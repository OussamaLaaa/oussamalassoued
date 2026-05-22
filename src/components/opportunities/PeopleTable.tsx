import React, { useMemo } from 'react';
import type { Person } from '../../types/opportunities';

export interface PersonFilters {
  searchQuery: string;
  decisionPower: string;
  relevance: string;
  relationshipStatus: string;
}

const PeopleTable: React.FC<{
  people: Person[];
  onEdit?: (person: Person) => void;
  onDelete?: (id: string) => void;
  filters?: PersonFilters;
  onFilterChange?: (filters: PersonFilters) => void;
}> = ({ people, onEdit, onDelete, filters, onFilterChange }) => {
  const filtered = useMemo(() => {
    if (!filters) return people;
    return people.filter((p) => {
      // Global search
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const fullName = (p.fullName || '').toLowerCase();
        const companyName = (p.companyName || '').toLowerCase();
        const email = (p.emailPublic || '').toLowerCase();
        const linkedin = (p.linkedin || '').toLowerCase();
        if (!fullName.includes(q) && !companyName.includes(q) && !email.includes(q) && !linkedin.includes(q)) return false;
      }
      if (filters.decisionPower && String(p.decisionPower ?? '') !== filters.decisionPower) return false;
      if (filters.relevance && String(p.relevance ?? '') !== filters.relevance) return false;
      if (filters.relationshipStatus && (p.relationshipStatus || '') !== filters.relationshipStatus) return false;
      return true;
    });
  }, [people, filters]);

  const setFilter = (key: keyof PersonFilters, value: string) => {
    if (!onFilterChange || !filters) return;
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    if (!onFilterChange || !filters) return;
    onFilterChange({
      searchQuery: '',
      decisionPower: '',
      relevance: '',
      relationshipStatus: '',
    });
  };

  const hasActiveFilters = filters && (
    filters.decisionPower || filters.relevance || filters.relationshipStatus
  );

  // Collect unique statuses for dropdown
  const statusSet = new Set<string>();
  people.forEach(p => { if (p.relationshipStatus) statusSet.add(p.relationshipStatus); });
  const statusOptions = Array.from(statusSet).sort();

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-medium text-lg text-[#0f172a]">People</h3>
        <span className="text-xs text-[#64748b]">{filtered.length} / {people.length}</span>
      </div>

      {/* Filters */}
      {filters && (
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-[#e5e7eb]">
          <select
            value={filters.decisionPower}
            onChange={(e) => setFilter('decisionPower', e.target.value)}
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          >
            <option value="">Decision Power</option>
            <option value="3">High</option>
            <option value="2">Medium</option>
            <option value="1">Low</option>
            <option value="0">None</option>
          </select>
          <select
            value={filters.relevance}
            onChange={(e) => setFilter('relevance', e.target.value)}
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          >
            <option value="">Relevance</option>
            <option value="3">High</option>
            <option value="2">Medium</option>
            <option value="1">Low</option>
          </select>
          <select
            value={filters.relationshipStatus}
            onChange={(e) => setFilter('relationshipStatus', e.target.value)}
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          >
            <option value="">Relationship Status</option>
            {statusOptions.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
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
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Seniority</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                <td className="px-3 py-3">
                  <div className="font-semibold text-[#0f172a]">{p.fullName}</div>
                  <div className="text-xs text-[#64748b]">{p.linkedin || p.emailPublic}</div>
                </td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{p.companyName}</td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{p.role}</td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{p.seniority}</td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{p.contactChannel}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
                        className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2]"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-[#64748b]">No people match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PeopleTable;