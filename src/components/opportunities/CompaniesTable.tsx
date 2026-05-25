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
import Badge from '../ui/Badge';

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

const databaseTypeLabel = (value?: string) => {
  const normalized = normalizeDatabaseType(value);
  if (normalized === 'big_company') return 'Big Company';
  if (normalized === 'sme') return 'SME';
  if (normalized === 'freelance') return 'Freelance';
  return value || '—';
};

const ethicalLabel = (value?: Company['ethicalFit']) => {
  if (!value) return '—';
  if (value === 'needs_review') return 'Needs review';
  return String(value).replace(/_/g, ' ');
};

const locationLabel = (company: Company) => {
  const parts = [company.city, company.country].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : '—';
};

const categoryLabel = (company: Company) => company.category || company.industry || '—';

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
    return companies.filter((company) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const haystack = [company.name, company.category, company.industry, company.website, company.linkedin, company.country, company.city]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filters.priority && company.priority !== filters.priority) return false;
      if (filters.status && company.status !== filters.status) return false;
      if (filters.databaseType && normalizeDatabaseType(company.databaseType) !== filters.databaseType) return false;
      if (filters.country) {
        const q = filters.country.toLowerCase();
        if (!(company.country || '').toLowerCase().includes(q)) return false;
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

  const hasActiveFilters = Boolean(
    filters && (filters.priority || filters.status || filters.databaseType || filters.country),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-sm">Companies</CardTitle>
          <span className="text-xs text-neutral-500">{filtered.length} / {companies.length}</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {filters && (
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
            <Input
              type="text"
              value={filters.searchQuery}
              onChange={(event) => setFilter('searchQuery', event.target.value)}
              placeholder="Search companies"
              className="min-w-[220px] flex-1"
            />
            <Select
              value={filters.priority}
              onChange={(event) => setFilter('priority', event.target.value)}
              options={priorityOptions}
            />
            <Select
              value={filters.status}
              onChange={(event) => setFilter('status', event.target.value)}
              options={statusOptions}
            />
            <Select
              value={filters.databaseType}
              onChange={(event) => setFilter('databaseType', event.target.value)}
              options={databaseTypeOptions}
            />
            <Input
              type="text"
              value={filters.country}
              onChange={(event) => setFilter('country', event.target.value)}
              placeholder="Country"
              className="min-w-[160px]"
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="text-neutral-700 hover:text-neutral-900">
                Clear filters
              </Button>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="min-w-[1160px] w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-medium">Company</th>
                <th className="px-4 py-3 font-medium">Type</th>
                <th className="px-4 py-3 font-medium">Category / Industry</th>
                <th className="px-4 py-3 font-medium">Location</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                <th className="px-4 py-3 font-medium">Fit</th>
                <th className="px-4 py-3 font-medium">Ethical</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Next action</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((company) => (
                <tr key={company.id} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50">
                  <td className="px-4 py-4 align-top">
                    <div className="min-w-0">
                      <div className="font-semibold text-neutral-900">{company.name}</div>
                      <div className="mt-1 text-xs text-neutral-500 break-words">
                        {company.website || company.linkedin || '—'}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge variant="neutral">{databaseTypeLabel(company.databaseType)}</Badge>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-neutral-700">
                    <div className="max-w-[180px] truncate">{categoryLabel(company)}</div>
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-neutral-700">
                    <div className="max-w-[160px] truncate">{locationLabel(company)}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <PriorityBadge priority={company.priority} />
                  </td>
                  <td className="px-4 py-4 align-top text-sm font-medium text-neutral-900 tabular-nums">
                    {typeof company.fitScore === 'number' ? company.fitScore : '—'}
                  </td>
                  <td className="px-4 py-4 align-top">
                    <Badge variant="neutral">{ethicalLabel(company.ethicalFit)}</Badge>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <StatusBadge status={company.status} />
                  </td>
                  <td className="px-4 py-4 align-top text-sm text-neutral-700">
                    <div className="max-w-[200px] truncate">{company.nextAction || '—'}</div>
                  </td>
                  <td className="px-4 py-4 align-top">
                    <div className="flex flex-wrap justify-end gap-1.5">
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(company)} className="text-neutral-700 hover:text-neutral-900">
                          Edit
                        </Button>
                      )}
                      {onAIScore && (
                        <Button variant="ghost" size="sm" onClick={() => onAIScore(company)} className="text-neutral-700 hover:text-neutral-900">
                          AI Score
                        </Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(company.id)} className="text-neutral-700 hover:text-neutral-900">
                          Delete
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-8 text-center">
                    <EmptyState
                      title="No companies match the current filters."
                      description="Clear the filters or add a company to continue."
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

export default CompaniesTable;
