import React, { useMemo } from 'react';
import type { Person, PersonContactMethod } from '../../types/opportunities';
import { ContactLink, isClickableContact } from './contactHelpers';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import { toolbarSearch, toolbarSearchIcon, toolbarSearchInput, toolbarSelect, toolbarButton, toolbarCount } from './Toolbar';

export interface PersonFilters {
  searchQuery: string;
  decisionPower: string;
  relevance: string;
  relationshipStatus: string;
}

const badgeForRelevance = (value?: number) => {
  if (value == null) return null;
  if (value >= 3) return <Badge variant="neutral">High</Badge>;
  if (value >= 2) return <Badge variant="neutral">Medium</Badge>;
  return <Badge variant="neutral">Low</Badge>;
};

const badgeForDecisionPower = (value?: number) => {
  if (value == null) return null;
  if (value >= 3) return <Badge variant="neutral">High</Badge>;
  if (value >= 2) return <Badge variant="neutral">Medium</Badge>;
  if (value >= 1) return <Badge variant="neutral">Low</Badge>;
  return <Badge variant="neutral">None</Badge>;
};

const badgeForRelationshipStatus = (status?: string) => {
  if (!status || status === 'No Contact') return <Badge variant="neutral">No Contact</Badge>;
  return <Badge variant="neutral">{status}</Badge>;
};

const decisionPowerOptions = [
  { value: '', label: 'Decision Power' },
  { value: '3', label: 'High' },
  { value: '2', label: 'Medium' },
  { value: '1', label: 'Low' },
  { value: '0', label: 'None' },
];

const relevanceOptions = [
  { value: '', label: 'Relevance' },
  { value: '3', label: 'High' },
  { value: '2', label: 'Medium' },
  { value: '1', label: 'Low' },
];

const PeopleTable: React.FC<{
  people: Person[];
  onEdit?: (person: Person) => void;
  onDelete?: (id: string) => void;
  onUseTemplate?: (person: Person) => void;
  onPersonClick?: (personId: string) => void;
  personContactMethods?: PersonContactMethod[];
  filters?: PersonFilters;
  onFilterChange?: (filters: PersonFilters) => void;
}> = ({ people, onEdit, onDelete, onUseTemplate, onPersonClick, personContactMethods, filters, onFilterChange }) => {
  const safePersonContactMethods = personContactMethods ?? [];

  const filtered = useMemo(() => {
    if (!filters) return people;
    return people.filter((p) => {
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

  const statusSet = new Set<string>();
  people.forEach(p => { if (p.relationshipStatus) statusSet.add(p.relationshipStatus); });
  const statusOptions = Array.from(statusSet).sort().map((s) => ({ value: s, label: s }));

  const getPrimaryContact = (person: Person): PersonContactMethod | null => {
    const methods = safePersonContactMethods.filter(
      (m) => String(m.personId) === String(person.id),
    );
    return methods.find((m) => m.isPrimary) || methods[0] || null;
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
              placeholder="Search people"
              className={toolbarSearchInput}
            />
          </div>
          <Select
            value={filters.decisionPower}
            onChange={(e) => setFilter('decisionPower', e.target.value)}
            options={decisionPowerOptions}
            className={`${toolbarSelect} min-w-[140px]`}
          />
          <Select
            value={filters.relevance}
            onChange={(e) => setFilter('relevance', e.target.value)}
            options={relevanceOptions}
            className={`${toolbarSelect} min-w-[120px]`}
          />
          <Select
            value={filters.relationshipStatus}
            onChange={(e) => setFilter('relationshipStatus', e.target.value)}
            options={[{ value: '', label: 'Relationship Status' }, ...statusOptions]}
            className={`${toolbarSelect} min-w-[160px]`}
          />
          {hasActiveFilters && (
            <Button variant="ghost" size="sm" className={`${toolbarButton} text-neutral-400 hover:text-neutral-900`} onClick={clearFilters}>
              Clear
            </Button>
          )}
          <span className={toolbarCount}>{filtered.length} people</span>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-x-auto">
        <table className="min-w-[1140px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
              <th className="px-4 py-3 font-medium">Person</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Seniority</th>
              <th className="px-4 py-3 font-medium">Relevance</th>
              <th className="px-4 py-3 font-medium">Decision Power</th>
              <th className="px-4 py-3 font-medium">Relationship</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 font-medium">Next follow-up</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const primaryContact = getPrimaryContact(p);
              const primaryContactType = primaryContact?.type || p.contactChannel || '';
              const primaryContactValue = primaryContact?.value || primaryContact?.label || '';
              const canClickContact = isClickableContact(primaryContactType, primaryContactValue || p.linkedin || p.emailPublic);

              return (
                <tr
                  key={p.id}
                  className="border-b border-neutral-100 transition-colors hover:bg-neutral-50 cursor-pointer"
                  onClick={() => onPersonClick?.(p.id)}
                >
                  <td className="px-4 py-3.5 align-top">
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900">{p.fullName}</div>
                      <div className="mt-0.5 text-xs text-neutral-500 break-words">
                        {p.linkedin ? (
                          <a
                            href={p.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-700 hover:underline"
                          >
                            LinkedIn
                          </a>
                        ) : p.emailPublic ? (
                          <span>{p.emailPublic}</span>
                        ) : primaryContact ? (
                          primaryContact.label || primaryContact.value
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3.5 align-top text-sm text-neutral-700">
                    <div className="max-w-[160px] truncate">{p.companyName || <span className="text-neutral-300">—</span>}</div>
                  </td>
                  <td className="px-4 py-3.5 align-top text-sm text-neutral-700 max-w-[180px] truncate">{p.role || <span className="text-neutral-300">—</span>}</td>
                  <td className="px-4 py-3.5 align-top">
                    <Badge variant="neutral" className="text-neutral-600 bg-neutral-50 border-neutral-200">{p.seniority || '—'}</Badge>
                  </td>
                  <td className="px-4 py-3.5 align-top">{badgeForRelevance(p.relevance)}</td>
                  <td className="px-4 py-3.5 align-top">{badgeForDecisionPower(p.decisionPower)}</td>
                  <td className="px-4 py-3.5 align-top">{badgeForRelationshipStatus(p.relationshipStatus)}</td>
                  <td className="px-4 py-3.5 align-top">
                    {primaryContact && canClickContact ? (
                      <ContactLink
                        type={primaryContactType}
                        value={primaryContactValue || p.linkedin || p.emailPublic}
                        displayValue={primaryContact.label || primaryContact.type}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      />
                    ) : p.emailPublic || p.linkedin ? (
                      <ContactLink
                        type={p.emailPublic ? 'email' : 'linkedin'}
                        value={p.emailPublic || p.linkedin}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                      />
                    ) : (
                      <span className="text-sm text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 align-top text-sm text-neutral-700 tabular-nums">
                    {p.nextFollowUpDate ? p.nextFollowUpDate.slice(0, 10) : <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <div className="flex items-center justify-end gap-1">
                      {onPersonClick && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                            onPersonClick(p.id);
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
                            onEdit(p);
                          }}
                          className="text-neutral-400 hover:text-neutral-900 px-1.5"
                          title="Edit"
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
                            onDelete(p.id);
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
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-8 text-center">
                  <EmptyState
                    title="No people match the current filters."
                    description="Clear the filters or add a person to continue."
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

export default PeopleTable;
