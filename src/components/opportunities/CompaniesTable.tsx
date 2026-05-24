import React, { useMemo } from 'react';
import { normalizeDatabaseType } from '../../utils/opportunitiesMappers';
import type { Company } from '../../types/opportunities';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

export interface CompanyFilters {
  searchQuery: string;
  priority: string;
  status: string;
  databaseType: string;
  country: string;
}

const CompaniesTable: React.FC<{
  companies: Company[];
  onEdit?: (company: Company) => void;
  onDelete?: (id: string) => void;
  onAIScore?: (company: Company) => void;
  filters?: CompanyFilters;
  onFilterChange?: (filters: CompanyFilters) => void;
}> = ({ companies, onEdit, onDelete, onAIScore, filters, onFilterChange }) => {
  const filtered = useMemo(() => {
    if (!filters) return companies;
    return companies.filter((c) => {
      // Global search
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const name = (c.name || '').toLowerCase();
        const personName = ''; // not available on company
        const email = '';
        const linkedin = (c.linkedin || '').toLowerCase();
        if (!name.includes(q) && !linkedin.includes(q)) return false;
      }
      if (filters.priority && c.priority !== filters.priority) return false;
      if (filters.status && c.status !== filters.status) return false;
      if (filters.databaseType && normalizeDatabaseType(c.databaseType) !== filters.databaseType) return false;
      if (filters.country) {
        const q = filters.country.toLowerCase();
        if (!(c.country || '').toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [companies, filters]);

  const setFilter = (key: keyof CompanyFilters, value: string) => {
    if (!onFilterChange || !filters) return;
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    if (!onFilterChange || !filters) return;
    onFilterChange({
      searchQuery: '',
      priority: '',
      status: '',
      databaseType: '',
      country: '',
    });
  };

  const hasActiveFilters = filters && (
    filters.priority || filters.status || filters.databaseType || filters.country
  );

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-medium text-lg text-[#0f172a]">Companies</h3>
        <span className="text-xs text-[#64748b]">{filtered.length} / {companies.length}</span>
      </div>

      {/* Filters */}
      {filters && (
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-[#e5e7eb]">
          <select
            value={filters.priority}
            onChange={(e) => setFilter('priority', e.target.value)}
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          >
            <option value="">Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          <select
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          >
            <option value="">Status</option>
            <option value="prospect">Prospect</option>
            <option value="contacted">Contacted</option>
            <option value="qualified">Qualified</option>
            <option value="lost">Lost</option>
            <option value="customer">Customer</option>
          </select>
          <select
            value={filters.databaseType}
            onChange={(e) => setFilter('databaseType', e.target.value)}
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          >
            <option value="">Database Type</option>
            <option value="big_company">Big Company</option>
            <option value="sme">SME</option>
            <option value="freelance">Freelance</option>
          </select>
          <input
            type="text"
            value={filters.country}
            onChange={(e) => setFilter('country', e.target.value)}
            placeholder="Country..."
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] w-[120px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
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
              <th className="px-3 py-2">Industry</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Fit</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c) => (
              <tr key={c.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                <td className="px-3 py-3">
                  <div className="font-semibold text-[#0f172a]">{c.name}</div>
                  <div className="text-xs text-[#64748b]">{c.website || c.linkedin}</div>
                </td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{c.industry}</td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{c.city}, {c.country}</td>
                <td className="px-3 py-3"><PriorityBadge priority={c.priority} /></td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{c.fitScore ?? '—'}</td>
                <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(c)}
                        className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]"
                      >
                        Edit
                      </button>
                    )}
                    {onAIScore && (
                      <button
                        type="button"
                        onClick={() => onAIScore(c)}
                        className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#7c3aed] hover:bg-[#f5f3ff]"
                      >
                        AI Score
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(c.id)}
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
              <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-[#64748b]">No companies match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompaniesTable;