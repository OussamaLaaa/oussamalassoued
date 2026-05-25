import React, { useMemo } from 'react';
import type { Person } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Select from '../ui/Select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export interface PersonFilters {
  searchQuery: string;
  decisionPower: string;
  relevance: string;
  relationshipStatus: string;
}

const badgeForRelevance = (value?: number) => {
  if (value == null) return null;
  if (value >= 3) return <Badge variant="success">High</Badge>;
  if (value >= 2) return <Badge variant="blue">Medium</Badge>;
  return <Badge variant="neutral">Low</Badge>;
};

const badgeForDecisionPower = (value?: number) => {
  if (value == null) return null;
  if (value >= 3) return <Badge variant="success">High</Badge>;
  if (value >= 2) return <Badge variant="blue">Medium</Badge>;
  if (value >= 1) return <Badge variant="warning">Low</Badge>;
  return <Badge variant="neutral">None</Badge>;
};

const badgeForRelationshipStatus = (status?: string) => {
  if (!status || status === 'No Contact') return <Badge variant="neutral">No Contact</Badge>;
  const s = status.toLowerCase();
  if (s.includes('active') || s.includes('connected')) return <Badge variant="success">{status}</Badge>;
  if (s.includes('pending') || s.includes('follow')) return <Badge variant="warning">{status}</Badge>;
  if (s.includes('cold') || s.includes('old')) return <Badge variant="neutral">{status}</Badge>;
  return <Badge variant="blue">{status}</Badge>;
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
  filters?: PersonFilters;
  onFilterChange?: (filters: PersonFilters) => void;
}> = ({ people, onEdit, onDelete, onUseTemplate, filters, onFilterChange }) => {
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

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle>People</CardTitle>
          <span className="text-xs text-neutral-500">{filtered.length} / {people.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        {filters && (
          <div className="flex flex-wrap items-center gap-2 mb-3 pb-3 border-b border-neutral-200">
            <Select
              value={filters.decisionPower}
              onChange={(e) => setFilter('decisionPower', e.target.value)}
              options={decisionPowerOptions}
            />
            <Select
              value={filters.relevance}
              onChange={(e) => setFilter('relevance', e.target.value)}
              options={relevanceOptions}
            />
            <Select
              value={filters.relationshipStatus}
              onChange={(e) => setFilter('relationshipStatus', e.target.value)}
              options={[{ value: '', label: 'Relationship Status' }, ...statusOptions]}
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
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">Company</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Seniority</th>
                <th className="px-3 py-2">Relevance</th>
                <th className="px-3 py-2">Decision Power</th>
                <th className="px-3 py-2">Relationship</th>
                <th className="px-3 py-2">Contact</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} className="border-t border-neutral-200 hover:bg-neutral-50">
                  <td className="px-3 py-3">
                    <div className="font-semibold text-neutral-900">{p.fullName}</div>
                    <div className="text-xs text-neutral-500">{p.linkedin || p.emailPublic}</div>
                  </td>
                  <td className="px-3 py-3 text-sm text-neutral-900">{p.companyName}</td>
                  <td className="px-3 py-3 text-sm text-neutral-900">{p.role}</td>
                  <td className="px-3 py-3 text-sm text-neutral-900">{p.seniority}</td>
                  <td className="px-3 py-3">{badgeForRelevance(p.relevance)}</td>
                  <td className="px-3 py-3">{badgeForDecisionPower(p.decisionPower)}</td>
                  <td className="px-3 py-3">{badgeForRelationshipStatus(p.relationshipStatus)}</td>
                  <td className="px-3 py-3 text-sm text-neutral-900">{p.contactChannel}</td>
                  <td className="px-3 py-3">
                    <div className="flex gap-1 flex-wrap">
                      {onUseTemplate && (
                        <Button variant="ghost" size="sm" onClick={() => onUseTemplate(p)} className="text-neutral-900">Template</Button>
                      )}
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(p)} className="text-blue-600 hover:text-blue-700">Edit</Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)} className="text-red-600 hover:text-red-700">Delete</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-3 py-8 text-center">
                    <EmptyState title="No people match the current filters." />
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

export default PeopleTable;
