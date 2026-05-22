import React, { useMemo } from 'react';
import type { Deal } from '../../types/opportunities';

export interface DealFilters {
  searchQuery: string;
  stage: string;
  probabilityMin: string;
  probabilityMax: string;
}

const DealsTable: React.FC<{
  deals: Deal[];
  onEdit?: (deal: Deal) => void;
  onDelete?: (id: string) => void;
  filters?: DealFilters;
  onFilterChange?: (filters: DealFilters) => void;
}> = ({ deals, onEdit, onDelete, filters, onFilterChange }) => {
  const filtered = useMemo(() => {
    if (!filters) return deals;
    return deals.filter((d) => {
      // Global search
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const companyName = (d.companyName || '').toLowerCase();
        const personName = (d.personName || '').toLowerCase();
        const email = '';
        const linkedin = '';
        if (!companyName.includes(q) && !personName.includes(q)) return false;
      }
      if (filters.stage && d.stage !== filters.stage) return false;
      if (filters.probabilityMin || filters.probabilityMax) {
        const prob = d.probability ?? 0;
        if (filters.probabilityMin && prob < parseFloat(filters.probabilityMin)) return false;
        if (filters.probabilityMax && prob > parseFloat(filters.probabilityMax)) return false;
      }
      return true;
    });
  }, [deals, filters]);

  const setFilter = (key: keyof DealFilters, value: string) => {
    if (!onFilterChange || !filters) return;
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    if (!onFilterChange || !filters) return;
    onFilterChange({
      searchQuery: '',
      stage: '',
      probabilityMin: '',
      probabilityMax: '',
    });
  };

  const hasActiveFilters = filters && (
    filters.stage || filters.probabilityMin || filters.probabilityMax
  );

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h3 className="font-medium text-lg text-[#0f172a]">Deals</h3>
        <span className="text-xs text-[#64748b]">{filtered.length} / {deals.length}</span>
      </div>

      {/* Filters */}
      {filters && (
        <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-[#e5e7eb]">
          <select
            value={filters.stage}
            onChange={(e) => setFilter('stage', e.target.value)}
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          >
            <option value="">Stage</option>
            <option value="discovery">Discovery</option>
            <option value="proposal_sent">Proposal Sent</option>
            <option value="negotiation">Negotiation</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={filters.probabilityMin}
            onChange={(e) => setFilter('probabilityMin', e.target.value)}
            placeholder="Prob. min (0-1)"
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] w-[110px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
          />
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={filters.probabilityMax}
            onChange={(e) => setFilter('probabilityMax', e.target.value)}
            placeholder="Prob. max (0-1)"
            className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] w-[110px] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
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
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2">Value</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Probability</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                <td className="px-3 py-3 font-semibold text-[#0f172a]">{d.companyName}</td>
                <td className="px-3 py-3 text-[#0f172a]">{d.personName}</td>
                <td className="px-3 py-3 text-[#0f172a]">{d.servicePackage}</td>
                <td className="px-3 py-3 text-[#0f172a]">{d.value ? `${d.value} ${d.currency || ''}` : '—'}</td>
                <td className="px-3 py-3 text-[#0f172a]">{d.stage}</td>
                <td className="px-3 py-3 text-[#0f172a]">{Math.round((d.probability || 0) * 100)}%</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(d)}
                        className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(d.id)}
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
              <tr><td colSpan={7} className="px-3 py-8 text-center text-sm text-[#64748b]">No deals match the current filters.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealsTable;