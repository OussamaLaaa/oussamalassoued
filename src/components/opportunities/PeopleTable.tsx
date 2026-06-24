import React, { useMemo } from 'react';
import type { Person, PersonContactMethod } from '../../types/opportunities';
import { ContactLink, isClickableContact } from './contactHelpers';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Checkbox from '../ui/Checkbox';
import Select from '../ui/Select';
import EmptyState from '../ui/EmptyState';
import { toolbarSearch, toolbarSearchIcon, toolbarSearchInput, toolbarSelect, toolbarButton, toolbarCount } from './Toolbar';

export interface PersonFilters {
  searchQuery: string;
  decisionPower: string;
  status: string;
}

const badgeForDecisionPower = (value?: number) => {
  if (value == null) return null;
  if (value >= 3) return <Badge variant="neutral">High</Badge>;
  if (value >= 2) return <Badge variant="neutral">Medium</Badge>;
  if (value >= 1) return <Badge variant="neutral">Low</Badge>;
  return <Badge variant="neutral">None</Badge>;
};

const badgeForRelationType = (value?: string | null) => {
  if (!value) return null;
  const map: Record<string, { label: string; variant: 'neutral' | 'default' | 'secondary' | 'outline' }> = {
    new: { label: 'New', variant: 'neutral' },
    weak: { label: 'Weak', variant: 'neutral' },
    medium: { label: 'Medium', variant: 'neutral' },
    strong: { label: 'Strong', variant: 'neutral' },
    strategic: { label: 'Strategic', variant: 'neutral' },
  };
  const entry = map[value] || { label: value, variant: 'neutral' };
  return <Badge variant={entry.variant}>{entry.label}</Badge>;
};

const decisionPowerOptions = [
  { value: '', label: 'Decision Power' },
  { value: '3', label: 'High' },
  { value: '2', label: 'Medium' },
  { value: '1', label: 'Low' },
  { value: '0', label: 'None' },
];

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'active', label: 'Active' },
  { value: 'archived', label: 'Archived' },
];

const PeopleTable: React.FC<{
  people: Person[];
  selectedPersonIds: Set<string>;
  onSelectAll: (ids: string[]) => void;
  onSelectOne: (id: string, selected: boolean) => void;
  onClearSelection: () => void;
  onBulkArchive: () => void;
  onBulkDelete: () => void;
  onEdit?: (person: Person) => void;
  onArchive?: (person: Person) => void;
  onDelete?: (id: string) => void;
  onUseTemplate?: (person: Person) => void;
  onPersonClick?: (personId: string) => void;
  personContactMethods?: PersonContactMethod[];
  filters?: PersonFilters;
  onFilterChange?: (filters: PersonFilters) => void;
}> = ({
  people,
  selectedPersonIds,
  onSelectAll,
  onSelectOne,
  onClearSelection,
  onBulkArchive,
  onBulkDelete,
  onEdit,
  onArchive,
  onDelete,
  onUseTemplate,
  onPersonClick,
  personContactMethods,
  filters,
  onFilterChange,
}) => {
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
      if (filters.status && (p.status || 'active') !== filters.status) return false;
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
      status: '',
    });
  };

  const hasActiveFilters = filters && (filters.decisionPower || filters.status);

  const getPrimaryContact = (person: Person): PersonContactMethod | null => {
    const methods = safePersonContactMethods.filter(
      (m) => String(m.personId) === String(person.id),
    );
    return methods.find((m) => m.isPrimary) || methods[0] || null;
  };

  const selectedCount = selectedPersonIds.size;
  const allVisibleSelected = filtered.length > 0 && selectedCount === filtered.length;
  const someVisibleSelected = selectedCount > 0 && !allVisibleSelected;

  return (
    <div>
      {filters && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3 mb-4">
          <div className={toolbarSearch}>
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={toolbarSearchIcon}
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
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
            value={filters.status}
            onChange={(e) => setFilter('status', e.target.value)}
            options={statusOptions}
            className={`${toolbarSelect} min-w-[140px]`}
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              className={`${toolbarButton} text-neutral-400 hover:text-neutral-900`}
              onClick={clearFilters}
            >
              Clear
            </Button>
          )}
          <span className={toolbarCount}>{filtered.length} people</span>
        </div>
      )}

      {(selectedCount > 0 || onBulkArchive) && (
        <div className="mb-3 flex items-center justify-between rounded-lg border border-neutral-200 bg-white px-3 py-2">
          <span className="text-sm text-neutral-700">
            {selectedCount} selected
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearSelection}
              disabled={selectedCount === 0}
              className="text-neutral-600 hover:text-neutral-900"
            >
              Clear
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkArchive}
              disabled={selectedCount === 0}
              className="text-neutral-700 hover:text-neutral-900"
            >
              Archive
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onBulkDelete}
              disabled={selectedCount === 0}
              className="text-red-600 hover:text-red-700"
            >
              Delete permanently
            </Button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white overflow-x-auto">
        <table className="min-w-[900px] w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
              <th className="px-4 py-3 font-medium w-10">
                <Checkbox
                  checked={allVisibleSelected ? true : someVisibleSelected ? 'indeterminate' : false}
                  onChange={(next) => {
                    if (next) {
                      onSelectAll(filtered.map((p) => p.id));
                    } else {
                      onClearSelection();
                    }
                  }}
                  ariaLabel="Select all people"
                />
              </th>
              <th className="px-4 py-3 font-medium">Person</th>
              <th className="px-4 py-3 font-medium">Company</th>
              <th className="px-4 py-3 font-medium">Role</th>
              <th className="px-4 py-3 font-medium">Decision Power</th>
              <th className="px-4 py-3 font-medium">Relation Type</th>
              <th className="px-4 py-3 font-medium">Contact</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const primaryContact = getPrimaryContact(p);
              const primaryContactType = primaryContact?.type || p.contactChannel || '';
              const primaryContactValue = primaryContact?.value || primaryContact?.label || '';
              const canClickContact = isClickableContact(primaryContactType, primaryContactValue || p.linkedin || p.emailPublic);
              const rowSelected = selectedPersonIds.has(p.id);

              return (
                <tr
                  key={p.id}
                  className="border-b border-neutral-100 transition-colors hover:bg-neutral-50"
                >
                  <td className="px-4 py-3.5 align-top">
                    <Checkbox
                      checked={rowSelected}
                      onChange={(next) => onSelectOne(p.id, next)}
                      ariaLabel={`Select ${p.fullName}`}
                    />
                  </td>
                  <td
                    className="px-4 py-3.5 align-top cursor-pointer"
                    onClick={() => onPersonClick?.(p.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') onPersonClick?.(p.id);
                    }}
                  >
                    <div className="min-w-0">
                      <div className="font-medium text-neutral-900">{p.fullName}</div>
                      <div className="mt-0.5 text-xs text-neutral-500 max-w-[180px] min-w-0 overflow-hidden truncate whitespace-nowrap">
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
                          <a
                            href={`mailto:${p.emailPublic}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-blue-600 hover:text-blue-700 hover:underline"
                            title={p.emailPublic}
                          >
                            {p.emailPublic.length < 25 ? p.emailPublic : 'Email'}
                          </a>
                        ) : primaryContact ? (
                          <ContactLink
                            type={primaryContact.type}
                            value={primaryContact.value}
                            displayValue={primaryContact.label || primaryContact.value}
                            compact
                            className="text-blue-600 hover:text-blue-700 hover:underline text-xs"
                          />
                        ) : (
                          <span className="text-neutral-300">—</span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td
                    className="px-4 py-3.5 align-top text-sm text-neutral-700 cursor-pointer"
                    onClick={() => onPersonClick?.(p.id)}
                  >
                    <div className="max-w-[160px] truncate">{p.companyName || <span className="text-neutral-300">—</span>}</div>
                  </td>
                  <td
                    className="px-4 py-3.5 align-top text-sm text-neutral-700 max-w-[180px] truncate cursor-pointer"
                    onClick={() => onPersonClick?.(p.id)}
                  >
                    {p.role || <span className="text-neutral-300">—</span>}
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    {badgeForDecisionPower(p.decisionPower)}
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    {badgeForRelationType(p.relationType)}
                  </td>
                  <td className="px-4 py-3.5 align-top max-w-[160px] min-w-0">
                    {primaryContact && canClickContact ? (
                      <ContactLink
                        type={primaryContactType}
                        value={primaryContactValue || p.linkedin || p.emailPublic}
                        displayValue={primaryContact.label || primaryContact.type}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        compact
                      />
                    ) : p.emailPublic || p.linkedin ? (
                      <ContactLink
                        type={p.emailPublic ? 'email' : 'linkedin'}
                        value={p.emailPublic || p.linkedin}
                        className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                        compact
                      />
                    ) : (
                      <span className="text-sm text-neutral-300">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 align-top">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(event) => {
                          event.stopPropagation();
                          event.preventDefault();
                          onPersonClick?.(p.id);
                        }}
                        className="text-neutral-600 hover:text-neutral-900 px-2"
                      >
                        Open
                      </Button>
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
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                            <path d="m15 5 4 4" />
                          </svg>
                        </Button>
                      )}
                      {onArchive && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={(event) => {
                            event.stopPropagation();
                            event.preventDefault();
                            onArchive(p);
                          }}
                          className="text-neutral-500 hover:text-neutral-900 px-1.5"
                          title="Archive"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect x="2" y="4" width="20" height="5" rx="1" />
                            <path d="M4 9v9a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9" />
                            <path d="M10 13h4" />
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
                          title="Delete permanently"
                        >
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
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
                <td colSpan={8} className="px-4 py-8 text-center">
                  <EmptyState
                    title="No people match the current filters."
                    description="Clear the filters or add a person to continue."
                    action={
                      hasActiveFilters ? (
                        <Button variant="secondary" size="sm" onClick={clearFilters}>
                          Clear filters
                        </Button>
                      ) : undefined
                    }
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