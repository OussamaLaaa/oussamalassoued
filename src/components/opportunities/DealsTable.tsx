import React, { useMemo } from 'react';
import type { Deal } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export interface DealFilters {
  searchQuery: string;
  stage: string;
  probabilityMin: string;
  probabilityMax: string;
}

const badgeForStage = (stage?: string) => {
  if (!stage) return null;
  return <Badge variant="neutral">{stage.replace(/_/g, ' ')}</Badge>;
};

const badgeForProbability = (probability?: number) => {
  if (probability == null) return null;
  const pct = Math.round(probability * 100);
  if (pct >= 70) return <Badge variant="neutral">{pct}%</Badge>;
  if (pct >= 40) return <Badge variant="neutral">{pct}%</Badge>;
  if (pct >= 20) return <Badge variant="neutral">{pct}%</Badge>;
  return <Badge variant="neutral">{pct}%</Badge>;
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
  filters?: DealFilters;
  onFilterChange?: (filters: DealFilters) => void;
}> = ({ deals, onEdit, onDelete, filters, onFilterChange }) => {
  const filtered = useMemo(() => {
    if (!filters) return deals;
    return deals.filter((d) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const companyName = (d.companyName || '').toLowerCase();
        const personName = (d.personName || '').toLowerCase();
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
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">Deals</CardTitle>
          <span className="text-xs text-neutral-500">{filtered.length} / {deals.length}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filters && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <Input
              type="text"
              value={filters.searchQuery}
              onChange={(event) => setFilter('searchQuery', event.target.value)}
              placeholder="Search deals"
              className="min-w-[220px] flex-1"
            />
            <Select
              value={filters.stage}
              onChange={(e) => setFilter('stage', e.target.value)}
              options={stageOptions}
            />
            <Input
              type="number" min="0" max="1" step="0.1"
              value={filters.probabilityMin}
              onChange={(e) => setFilter('probabilityMin', e.target.value)}
              placeholder="Prob. min (0-1)"
            />
            <Input
              type="number" min="0" max="1" step="0.1"
              value={filters.probabilityMax}
              onChange={(e) => setFilter('probabilityMax', e.target.value)}
              placeholder="Prob. max (0-1)"
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-neutral-700 hover:text-neutral-900">Clear filters</Button>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-[1040px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Service package</th>
                <th className="px-4 py-3 font-medium">Stage</th>
                <th className="px-4 py-3 font-medium">Probability</th>
                <th className="px-4 py-3 font-medium text-right">Value</th>
                <th className="px-4 py-3 font-medium">Next action</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-4 align-top font-semibold text-neutral-900">{d.companyName || '—'}</td>
                  <td className="px-4 py-4 align-top text-neutral-700">{d.personName || '—'}</td>
                  <td className="px-4 py-4 align-top text-neutral-700 max-w-[240px] truncate">{d.servicePackage || '—'}</td>
                  <td className="px-4 py-4 align-top">{badgeForStage(d.stage)}</td>
                  <td className="px-4 py-4 align-top">{badgeForProbability(d.probability)}</td>
                  <td className="px-4 py-4 align-top text-right text-neutral-900 tabular-nums">{d.value ? `${d.value} ${d.currency || ''}` : '—'}</td>
                  <td className="px-4 py-4 align-top text-neutral-700 max-w-[220px] truncate">{d.nextAction || '—'}</td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(d)} className="text-neutral-700 hover:text-neutral-900">Edit</Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(d.id)} className="text-neutral-700 hover:text-neutral-900">Delete</Button>
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
      </CardContent>
    </Card>
  );
};

export default DealsTable;
