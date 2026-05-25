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
  const s = stage.toLowerCase();
  if (s === 'won') return <Badge variant="success">Won</Badge>;
  if (s === 'lost') return <Badge variant="danger">Lost</Badge>;
  if (s === 'negotiation') return <Badge variant="warning">Negotiation</Badge>;
  if (s === 'proposal_sent') return <Badge variant="blue">Proposal Sent</Badge>;
  return <Badge variant="neutral">{stage}</Badge>;
};

const badgeForProbability = (probability?: number) => {
  if (probability == null) return null;
  const pct = Math.round(probability * 100);
  if (pct >= 70) return <Badge variant="success">{pct}%</Badge>;
  if (pct >= 40) return <Badge variant="blue">{pct}%</Badge>;
  if (pct >= 20) return <Badge variant="warning">{pct}%</Badge>;
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
          <CardTitle>Deals</CardTitle>
          <span className="text-xs text-neutral-500">{filtered.length} / {deals.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        {filters && (
          <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-neutral-200">
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
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 hover:text-red-700">Clear filters</Button>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-xs text-neutral-500 bg-neutral-50">
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
                <tr key={d.id} className="border-t border-neutral-200 hover:bg-neutral-50">
                  <td className="px-3 py-3 font-semibold text-neutral-900">{d.companyName}</td>
                  <td className="px-3 py-3 text-neutral-900">{d.personName}</td>
                  <td className="px-3 py-3 text-neutral-900">{d.servicePackage}</td>
                  <td className="px-3 py-3 text-neutral-900">{d.value ? `${d.value} ${d.currency || ''}` : '—'}</td>
                  <td className="px-3 py-3">{badgeForStage(d.stage)}</td>
                  <td className="px-3 py-3">{badgeForProbability(d.probability)}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(d)} className="text-blue-600 hover:text-blue-700">Edit</Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(d.id)} className="text-red-600 hover:text-red-700">Delete</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center">
                    <EmptyState title="No deals match the current filters." />
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
