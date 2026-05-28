import React, { useMemo } from 'react';
import { normalizeDatabaseType } from '../../utils/opportunitiesMappers';
import type { Company } from '../../types/opportunities';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import Button from '../ui/Button';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { toolbarSearch, toolbarSearchIcon, toolbarSearchInput, toolbarSelect, toolbarButton } from './Toolbar';

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
 onCompanyClick?: (companyId: string) => void;
 filters?: CompanyFilters;
 onFilterChange?: (filters: CompanyFilters) => void;
}> = ({ companies, onEdit, onDelete, onAIScore, onCompanyClick, filters, onFilterChange }) => {
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
              placeholder="Search companies"
              className={toolbarSearchInput}
            />
          </div>
          <Select
            value={filters.priority}
            onChange={(event) => setFilter('priority', event.target.value)}
            options={priorityOptions}
            className={`${toolbarSelect} min-w-[110px]`}
          />
          <Select
            value={filters.status}
            onChange={(event) => setFilter('status', event.target.value)}
            options={statusOptions}
            className={`${toolbarSelect} min-w-[110px]`}
          />
          <Select
            value={filters.databaseType}
            onChange={(event) => setFilter('databaseType', event.target.value)}
            options={databaseTypeOptions}
            className={`${toolbarSelect} min-w-[120px]`}
          />
          <input
            type="text"
            value={filters.country}
            onChange={(event) => setFilter('country', event.target.value)}
            placeholder="Country"
            className="h-10 min-w-[110px] rounded-lg border border-neutral-200 bg-white px-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400"
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className={`${toolbarButton} text-neutral-400 hover:text-neutral-900`} onClick={clearFilters}>
              Clear
            </Button>
          )}
          <span className={toolbarCount}>{filtered.length} companies</span>
        </div>
  )}

  <div className="rounded-xl border border-neutral-200 bg-white overflow-x-auto">
  <table className="min-w-[1160px] w-full border-collapse text-left">
  <thead>
  <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
  <th className="px-4 py-3 font-medium">Company</th>
  <th className="px-4 py-3 font-medium">Type</th>
  <th className="px-4 py-3 font-medium">Category</th>
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
  <tr
  key={company.id}
  className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 cursor-pointer"
  onClick={() => onCompanyClick?.(company.id)}
  >
  <td className="px-4 py-3.5 align-top">
  <div className="min-w-0">
  <div className="font-medium text-neutral-900">{company.name}</div>
  {(company.website || company.linkedin) ? (
  <a
  href={company.website || company.linkedin}
  target="_blank"
  rel="noopener noreferrer"
  onClick={(e) => e.stopPropagation()}
  className="mt-0.5 block max-w-[200px] truncate text-xs text-blue-600 hover:text-blue-700 hover:underline"
  >
  {company.website || 'LinkedIn'}
  </a>
  ) : (
  <div className="mt-0.5 text-xs text-neutral-300">—</div>
  )}
  </div>
  </td>
  <td className="px-4 py-3.5 align-top">
  <Badge variant="neutral" className="text-neutral-600 bg-neutral-50 border-neutral-200">{databaseTypeLabel(company.databaseType)}</Badge>
  </td>
  <td className="px-4 py-3.5 align-top text-sm text-neutral-700">
  <div className="max-w-[160px] truncate">{categoryLabel(company)}</div>
  </td>
  <td className="px-4 py-3.5 align-top text-sm text-neutral-700">
  <div className="max-w-[140px] truncate">{locationLabel(company)}</div>
  </td>
  <td className="px-4 py-3.5 align-top">
  <PriorityBadge priority={company.priority} />
  </td>
  <td className="px-4 py-3.5 align-top text-sm font-semibold text-neutral-900 tabular-nums">
  {typeof company.fitScore === 'number' ? company.fitScore : '—'}
  </td>
  <td className="px-4 py-3.5 align-top">
  {!company.ethicalFit || company.ethicalFit === 'good' ? (
  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border border-emerald-200 text-emerald-700 bg-emerald-50">
  {ethicalLabel(company.ethicalFit)}
  </span>
  ) : company.ethicalFit === 'needs_review' ? (
  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border border-amber-200 text-amber-700 bg-amber-50">
  {ethicalLabel(company.ethicalFit)}
  </span>
  ) : company.ethicalFit === 'avoid' ? (
  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border border-red-200 text-red-700 bg-red-50">
  {ethicalLabel(company.ethicalFit)}
  </span>
  ) : (
  <Badge variant="neutral">{ethicalLabel(company.ethicalFit)}</Badge>
  )}
  </td>
  <td className="px-4 py-3.5 align-top">
  <StatusBadge status={company.status} />
  </td>
  <td className="px-4 py-3.5 align-top text-sm text-neutral-700">
  <div className="max-w-[180px] truncate">{company.nextAction || '—'}</div>
  </td>
  <td className="px-4 py-3.5 align-top">
  <div className="flex items-center justify-end gap-1">
  {onCompanyClick && (
  <Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={(event) => {
  event.stopPropagation();
  event.preventDefault();
  onCompanyClick(company.id);
  }}
  className="text-neutral-600 hover:text-neutral-900 px-2"
  >
  Open
  </Button>
  )}
  {onEdit && (
  <Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={(event) => {
  event.stopPropagation();
  event.preventDefault();
  onEdit(company);
  }}
  className="text-neutral-400 hover:text-neutral-900 px-1.5"
  title="Edit"
  >
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>
  </svg>
  </Button>
  )}
  {onAIScore && (
  <Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={(event) => {
  event.stopPropagation();
  event.preventDefault();
  onAIScore(company);
  }}
  className="text-indigo-500 hover:text-indigo-700 px-1.5"
  title="AI Score"
  >
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-2 6"/><path d="M12 18v4"/><path d="M16 22H8"/>
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
  onDelete(company.id);
  }}
  className="text-neutral-300 hover:text-red-500 px-1.5"
  title="Delete"
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
  </div>
  );
};

export default CompaniesTable;
