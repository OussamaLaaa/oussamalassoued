import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useMemo } from 'react';
import type { Deal } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import { toolbarSearch, toolbarSearchIcon, toolbarSearchInput, toolbarSelect, toolbarButton, toolbarCount } from './Toolbar';
import DirectionalText from '../DirectionalText';

export interface DealFilters {
  searchQuery: string;
  stage: string;
  probabilityMin: string;
  probabilityMax: string;
}

const badgeForStage = (stage?: string) => {
  const { t, language } = usePersonalLanguage();

  if (!stage) return null;
  const colorMap: Record<string, string> = {
    discovery: 'text-blue-700 bg-blue-50 border-blue-200',
    proposal_sent: 'text-amber-700 bg-amber-50 border-amber-200',
    negotiation: 'text-violet-700 bg-violet-50 border-violet-200',
    won: 'text-emerald-700 bg-emerald-50 border-emerald-200',
    lost: 'text-neutral-500 bg-neutral-100 border-neutral-200',
  };
  const base = 'inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border';
  const colorClass = colorMap[stage || ''] || 'text-neutral-700 bg-neutral-50 border-neutral-200';
  return <span className={`${base} ${colorClass}`}>{stage.replace(/_/g, ' ')}</span>;
};

const badgeForProbability = (probability?: number) => {
  if (probability == null) return null;
  const pct = Math.round(probability * 100);
  const colorClass = pct >= 70 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : pct >= 40 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : pct >= 20 ? 'text-violet-700 bg-violet-50 border-violet-200'
    : 'text-neutral-500 bg-neutral-100 border-neutral-200';
  return <span className={`inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border ${colorClass}`}>{pct}%</span>;
};

const stageOptions = [
  { value: '', label: 'Stage' },
  { value: 'discovery', label: 'Discovery' },
  { value: 'proposal_sent', label: 'Proposal Sent' },
  { value: 'negotiation', label: 'Negotiation' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
];

const DealsTable: React.FC<{
  deals: Deal[];
  onEdit?: (deal: Deal) => void;
  onDelete?: (id: string) => void;
  onDealClick?: (dealId: string) => void;
  filters?: DealFilters;
  onFilterChange?: (filters: DealFilters) => void;
}> = ({ deals, onEdit, onDelete, onDealClick, filters, onFilterChange }) => {
  const filtered = useMemo(() => {
    if (!filters) return deals;
    return deals.filter((d) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const companyName = (d.companyName || '').toLowerCase();
        const personName = (d.personName || '').toLowerCase();
        const pkg = (d.servicePackage || '').toLowerCase();
        if (!companyName.includes(q) && !personName.includes(q) && !pkg.includes(q)) return false;
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
    <div>
      {filters && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 mb-4">
          <div className={toolbarSearch}>
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className={toolbarSearchIcon}
            >
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={filters.searchQuery}
              onChange={(event) => setFilter('searchQuery', event.target.value)}
              placeholder="Search deals"
              className={toolbarSearchInput}
            />
          </div>
          <Select
            value={filters.stage}
            onChange={(e) => setFilter('stage', e.target.value)}
            options={stageOptions}
            className={`${toolbarSelect} min-w-[140px]`}
          />
          <input
            type="number" min="0" max="1" step="0.1"
            value={filters.probabilityMin}
            onChange={(e) => setFilter('probabilityMin', e.target.value)}
            placeholder="Prob. min"
            className="h-10 w-[110px] rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400"
          />
          <input
            type="number" min="0" max="1" step="0.1"
            value={filters.probabilityMax}
            onChange={(e) => setFilter('probabilityMax', e.target.value)}
            placeholder="Prob. max"
            className="h-10 w-[110px] rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400"
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className={`${toolbarButton} text-neutral-400 hover:text-neutral-900`} onClick={clearFilters}>
              Clear
            </Button>
          )}
          <span className={toolbarCount}>{filtered.length} deals</span>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-x-auto">
        <table className="min-w-[1120px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
              <th className="px-4 py-3 font-medium">Deal</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Person</th>
              <th className="px-4 py-3 font-medium">Stage</th>
              <th className="px-4 py-3 font-medium">Probability</th>
              <th className="px-4 py-3 text-right font-medium">Value</th>
              <th className="px-4 py-3 font-medium">Next action</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr
                key={d.id}
                className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 cursor-pointer"
                onClick={() => onDealClick?.(d.id)}
              >
                <td className="px-4 py-3.5 align-top">
                  <div className="min-w-0">
                    <div className="font-medium text-neutral-900">{d.servicePackage || 'Untitled Deal'}</div>
                    {(d.problem || d.proposedSolution) && (
                      <div className="mt-0.5 text-xs text-neutral-500 max-w-[200px] truncate"><DirectionalText text={d.problem || d.proposedSolution} /></div>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3.5 align-top text-sm text-neutral-700">
                  <div className="max-w-[160px] truncate">{d.companyName || <span className="text-neutral-300">—</span>}</div>
                </td>
                <td className="px-4 py-3.5 align-top text-sm text-neutral-700">{d.personName || <span className="text-neutral-300">—</span>}</td>
                <td className="px-4 py-3.5 align-top">{badgeForStage(d.stage)}</td>
                <td className="px-4 py-3.5 align-top">{badgeForProbability(d.probability)}</td>
                <td className="px-4 py-3.5 align-top text-right font-semibold text-neutral-900 tabular-nums">{d.value != null ? `${d.value} ${d.currency || ''}` : <span className="text-neutral-300">—</span>}</td>
                <td className="px-4 py-3.5 align-top text-sm text-neutral-700 max-w-[180px] truncate"><DirectionalText text={d.nextAction || '—'} className="text-sm text-neutral-700" /></td>
                <td className="px-4 py-3.5 align-top">
                  <div className="flex items-center justify-end gap-1">
                    {onEdit && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          onEdit(d);
                        }}
                        className="text-neutral-400 hover:text-neutral-900 px-1.5"
                        title={t("Edit", "Edit", "Edit")}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
                        </svg>
                      </Button>
                    )}
                    {onDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          onDelete(d.id);
                        }}
                        className="text-neutral-300 hover:text-red-500 px-1.5"
                        title={t("Delete", "Delete", "Delete")}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                        </svg>
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center">
                  <EmptyState
                    title="No deals match the current filters."
                    description="Clear the filters or add a deal to continue."
                    action={hasActiveFilters ? <Button variant="secondary" size="sm" onClick={clearFilters}>Clear filters</Button> : undefined}
                  />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealsTable;
