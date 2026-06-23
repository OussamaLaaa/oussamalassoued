import React, { useMemo, useState } from 'react';
import { normalizeDatabaseType } from '../../utils/opportunitiesMappers';
import type { Company } from '../../types/opportunities';
import PriorityBadge from './PriorityBadge';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import Badge from '../ui/Badge';
import { toolbarSearch, toolbarSearchIcon, toolbarSearchInput, toolbarSelect, toolbarButton, toolbarCount } from './Toolbar';
import { useLanguage } from '../../hooks/useLanguage';

export interface CompanyFilters {
 searchQuery: string;
 priority: string;
 targetNiche: string;
 outreachStatus: string;
 country: string;
 status: string;
}

const priorityOptions = [
 { value: '', label: 'Priority' },
 { value: 'high', label: 'High' },
 { value: 'medium', label: 'Medium' },
 { value: 'low', label: 'Low' },
];

const databaseTypeLabel = (value?: string) => {
 const normalized = normalizeDatabaseType(value);
 if (normalized === 'big_company') return 'Big Company';
 if (normalized === 'sme') return 'SME';
 if (normalized === 'freelance') return 'Freelance';
 return value || '—';
};

const locationLabel = (company: Company) => {
 const parts = [company.city, company.country].filter(Boolean);
 return parts.length > 0 ? parts.join(', ') : '—';
};

const nicheLabel = (value?: string | null) => {
 if (!value) return '—';
 return value.replace(/_/g, ' ').replace(/^([a-z])/i, (m) => m.toUpperCase());
};

const outreachLabel = (value?: string | null) => {
 if (!value) return 'Not contacted';
 const map: Record<string, string> = {
 not_contacted: 'Not contacted',
 contacted_accepted: 'Accepted',
 contacted_rejected: 'Rejected',
 contacted_no_reply: 'No reply',
 };
 return map[value] || 'Not contacted';
};

const outreachShortLabel = (value?: string | null, isAr = false): string => {
 if (!value) return isAr ? 'لم أتواصل' : 'Not';
 const map: Record<string, string> = {
 not_contacted: isAr ? 'لم أتواصل' : 'Not',
 contacted_accepted: isAr ? 'قبلت' : 'Accepted',
 contacted_rejected: isAr ? 'رفضت' : 'Rejected',
 contacted_no_reply: isAr ? 'لم تجب' : 'No reply',
 };
 return map[value] || (isAr ? 'لم أتواصل' : 'Not');
};

const outreachTitle = (value?: string | null): string => {
 if (!value || value === 'not_contacted') return 'Not contacted';
 if (value === 'contacted_accepted') return 'Accepted';
 if (value === 'contacted_rejected') return 'Rejected';
 if (value === 'contacted_no_reply') return 'No reply';
 return value;
};

const outreachActiveClass = (value?: string | null) => {
 const map: Record<string, string> = {
 not_contacted: 'border-neutral-400 bg-neutral-100 font-medium text-neutral-900',
 contacted_accepted: 'border-emerald-400 bg-emerald-100 font-medium text-emerald-900',
 contacted_rejected: 'border-red-400 bg-red-100 font-medium text-red-900',
 contacted_no_reply: 'border-amber-400 bg-amber-100 font-medium text-amber-900',
 };
 return map[value || 'not_contacted'];
};

const CompaniesTable: React.FC<{
 companies: Company[];
 onEdit?: (company: Company) => void;
 onDelete?: (id: string) => void;
 onAIScore?: (company: Company) => void;
 onCompanyClick?: (companyId: string) => void;
 onUpdateCompany?: (id: string, data: Partial<Company>) => Promise<void>;
 filters?: CompanyFilters;
 onFilterChange?: (filters: CompanyFilters) => void;
}> = ({ companies, onEdit, onDelete, onAIScore, onCompanyClick, onUpdateCompany, filters, onFilterChange }) => {
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
  if (filters.country) {
 const q = filters.country.toLowerCase();
 if (!(company.country || '').toLowerCase().includes(q)) return false;
 }
 if (filters.targetNiche && company.targetNiche !== filters.targetNiche) return false;
 if (filters.outreachStatus && company.outreachStatus !== filters.outreachStatus) return false;
 if (filters.status && filters.status !== 'all') {
   if (filters.status === 'archived' && company.status !== 'archived') return false;
   if (filters.status === 'active' && company.status === 'archived') return false;
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
   targetNiche: '',
   outreachStatus: '',
   country: '',
   status: '',
   });
  };

  const hasActiveFilters = Boolean(
  filters && (filters.priority || filters.targetNiche || filters.outreachStatus || filters.country),
  );

  const { isAr, t } = useLanguage();
  const [updatingOutreachCompanyId, setUpdatingOutreachCompanyId] = useState<string | null>(null);
  const [outreachUpdateError, setOutreachUpdateError] = useState<string | null>(null);

  const handleOutreachStatusChange = async (company: Company, status: string, event: React.SyntheticEvent) => {
  if (!onUpdateCompany) return;
  event.stopPropagation();
  event.preventDefault();
  setUpdatingOutreachCompanyId(company.id);
  setOutreachUpdateError(null);
  try {
  await onUpdateCompany(company.id, { outreachStatus: status as Company['outreachStatus'] });
  } catch (error) {
  const message = error instanceof Error && error.message ? error.message : 'Unable to update outreach status.';
  setOutreachUpdateError(message);
  } finally {
  setUpdatingOutreachCompanyId(null);
  }
  };

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
 value={filters.targetNiche}
 onChange={(event) => setFilter('targetNiche', event.target.value)}
 options={[
 { value: '', label: 'Target Niche' },
 { value: 'saas', label: 'SaaS' },
 { value: 'b2b_services', label: 'B2B Services' },
 { value: 'healthtech', label: 'HealthTech' },
 { value: 'edtech', label: 'EdTech' },
 { value: 'marketplace', label: 'Marketplace' },
 { value: 'ecommerce', label: 'E-commerce' },
 { value: 'startup', label: 'Startup' },
 { value: 'commercial', label: 'Commercial' },
 { value: 'agency', label: 'Agency' },
 { value: 'other', label: 'Other' },
 ]}
 className={`${toolbarSelect} min-w-[120px]`}
 />
  <Select
 value={filters.outreachStatus}
 onChange={(event) => setFilter('outreachStatus', event.target.value)}
 options={[
 { value: '', label: 'Outreach Status' },
 { value: 'not_contacted', label: 'Not contacted' },
 { value: 'contacted_accepted', label: 'Accepted' },
 { value: 'contacted_rejected', label: 'Rejected' },
 { value: 'contacted_no_reply', label: 'No reply' },
 ]}
 className={`${toolbarSelect} min-w-[140px]`}
 />
  <Select
 value={filters.status}
 onChange={(event) => setFilter('status', event.target.value)}
 options={[
 { value: '', label: 'Status' },
 { value: 'active', label: 'Active' },
 { value: 'archived', label: 'Archived' },
 { value: 'all', label: 'All' },
 ]}
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
  <table className="min-w-[960px] w-full border-collapse text-left">
  <thead>
  <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
  <th className="px-4 py-3 font-medium">Company</th>
  <th className="px-4 py-3 font-medium">Type</th>
  <th className="px-4 py-3 font-medium">Location</th>
  <th className="px-4 py-3 font-medium">Priority</th>
  <th className="px-4 py-3 font-medium">Niche</th>
  <th className="px-4 py-3 font-medium">Outreach</th>
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
  <div className="max-w-[140px] truncate">{locationLabel(company)}</div>
  </td>
  <td className="px-4 py-3.5 align-top">
  <PriorityBadge priority={company.priority} />
  </td>
  <td className="px-4 py-3.5 align-top text-sm text-neutral-700">
  {company.targetNiche ? (
  <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-md border border-neutral-200 bg-neutral-50 text-neutral-700">
  {nicheLabel(company.targetNiche)}
  </span>
  ) : (
  <span className="text-xs text-neutral-400">—</span>
  )}
  </td>
  <td className="px-4 py-3.5 align-top">
  <div className="flex flex-wrap gap-1 max-w-[260px]">
  {(['not_contacted', 'contacted_accepted', 'contacted_rejected', 'contacted_no_reply'] as const).map((status) => {
  const isActive = company.outreachStatus === status;
  const isUpdating = updatingOutreachCompanyId === company.id;
  const label = outreachShortLabel(status, isAr);
  const title = outreachTitle(status);
  return (
  <button
  key={status}
  type="button"
  disabled={isUpdating}
  onClick={(event) => handleOutreachStatusChange(company, status, event)}
  title={title}
  className={`h-7 rounded-md border px-2 text-xs whitespace-nowrap min-w-fit transition-colors ${
  isActive
  ? outreachActiveClass(status)
  : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
  } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
  {label}
  </button>
  );
  })}
  </div>
  {outreachUpdateError && (
  <div className="mt-1 text-xs text-red-600">{outreachUpdateError}</div>
  )}
  </td>
  <td className="px-4 py-3.5 align-top">
  <div className="inline-flex items-center justify-end gap-2">
  {onEdit && (
  <button
  type="button"
  onClick={(event) => {
  event.stopPropagation();
  event.preventDefault();
  onEdit(company);
  }}
  className="text-neutral-500 hover:text-blue-700"
  title="Edit company"
  aria-label="Edit company"
  >
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
  <path d="m15 5 4 4"/>
  </svg>
  </button>
  )}
  {onAIScore && (
  <button
  type="button"
  onClick={(event) => {
  event.stopPropagation();
  event.preventDefault();
  onAIScore(company);
  }}
  className="text-neutral-500 hover:text-violet-600"
  title="AI Score"
  aria-label="AI Score"
  >
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M12 2a4 4 0 0 1 4 4c0 2-2 4-2 6"/>
  <path d="M12 18v4"/>
  <path d="M16 22H8"/>
  </svg>
  </button>
  )}
  {onDelete && (
  <button
  type="button"
  onClick={(event) => {
  event.stopPropagation();
  event.preventDefault();
  onDelete(company.id);
  }}
  className="text-neutral-500 hover:text-red-600"
  title="Delete company"
  aria-label="Delete company"
  >
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <path d="M3 6h18"/>
  <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/>
  <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
  </svg>
  </button>
  )}
  </div>
  </td>
  </tr>
  ))}
  {filtered.length === 0 && (
  <tr>
  <td colSpan={7} className="px-4 py-8 text-center">
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