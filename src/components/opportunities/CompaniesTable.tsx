import React, { useMemo } from 'react';
import { normalizeDatabaseType } from '../../utils/opportunitiesMappers';
import type { Company } from '../../types/opportunities';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export interface CompanyFilters {
  searchQuery: string;
  priority: string;
  status: string;
  databaseType: string;
  country: string;
}

const priorityOptions = [
  { value: '', label: 'Priority' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const statusOptions = [
  { value: '', label: 'Status' },
  { value: 'prospect', label: 'Prospect' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'lost', label: 'Lost' },
  { value: 'customer', label: 'Customer' },
];

const databaseTypeOptions = [
  { value: '', label: 'Database Type' },
  { value: 'big_company', label: 'Big Company' },
  { value: 'sme', label: 'SME' },
  { value: 'freelance', label: 'Freelance' },
];

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
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>Companies</CardTitle>
          <span className="text-xs text-neutral-500">{filtered.length} / {companies.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        {filters && (
          <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-neutral-200">
            <Select
              value={filters.priority}
              onChange={(e) => setFilter('priority', e.target.value)}
              options={priorityOptions}
            />
            <Select
              value={filters.status}
              onChange={(e) => setFilter('status', e.target.value)}
              options={statusOptions}
            />
            <Select
              value={filters.databaseType}
              onChange={(e) => setFilter('databaseType', e.target.value)}
              options={databaseTypeOptions}
            />
            <Input
              type="text"
              value={filters.country}
              onChange={(e) => setFilter('country', e.target.value)}
              placeholder="Country..."
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-red-600 hover:text-red-700">
                Clear filters
              </Button>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-xs text-neutral-500 bg-neutral-50">
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
                <tr key={c.id} className="border-t border-neutral-200 hover:bg-neutral-50">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-neutral-900">{c.name}</div>
                    <div className="text-xs text-neutral-500 break-words">{c.website || c.linkedin}</div>
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-900">{c.industry}</td>
                  <td className="px-3 py-3 text-sm text-neutral-900">{c.city}, {c.country}</td>
                  <td className="px-3 py-3"><PriorityBadge priority={c.priority} /></td>
                  <td className="px-3 py-3 text-sm text-neutral-900">{c.fitScore ?? '—'}</td>
                  <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1">
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(c)} className="text-blue-600 hover:text-blue-700">Edit</Button>
                      )}
                      {onAIScore && (
                        <Button variant="ghost" size="sm" onClick={() => onAIScore(c)} className="text-purple-600 hover:text-purple-700">AI Score</Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(c.id)} className="text-red-600 hover:text-red-700">Delete</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center">
                    <EmptyState title="No companies match the current filters."
                      action={onEdit && <Button variant="secondary" size="sm">Clear filters</Button>}
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

export default CompaniesTable;
