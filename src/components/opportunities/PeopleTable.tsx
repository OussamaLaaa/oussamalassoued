import React, { useMemo } from 'react';
import type { Person } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Select from '../ui/Select';
import Input from '../ui/Input';
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
 <CardTitle className="text-sm">People</CardTitle>
 <span className="text-xs text-neutral-500">{filtered.length} / {people.length}</span>
 </div>
 </CardHeader>
 <CardContent className="space-y-4">
 {filters && (
 <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
 <Input
 type="text"
 value={filters.searchQuery}
 onChange={(event) => setFilter('searchQuery', event.target.value)}
 placeholder="Search people"
 className="min-w-[220px] flex-1"
 />
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
 <Button variant="ghost" size="sm" onClick={clearFilters} className="text-neutral-700 hover:text-neutral-900">Clear filters</Button>
 )}
 </div>
 )}

 <div className="overflow-x-auto">
 <table className="min-w-[1140px] w-full border-collapse text-left">
 <thead>
 <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
 <th className="px-4 py-3 font-medium">Name</th>
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
 {filtered.map((p) => (
 <tr key={p.id} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50">
 <td className="px-4 py-4 align-top">
 <div className="font-semibold text-neutral-900">{p.fullName}</div>
 <div className="mt-1 text-xs text-neutral-500 break-words">{p.linkedin || p.emailPublic || '—'}</div>
 </td>
 <td className="px-4 py-4 align-top text-sm text-neutral-700">{p.companyName || '—'}</td>
 <td className="px-4 py-4 align-top text-sm text-neutral-700 max-w-[220px] truncate">{p.role || '—'}</td>
 <td className="px-4 py-4 align-top">
 <Badge variant="neutral">{p.seniority || '—'}</Badge>
 </td>
 <td className="px-4 py-4 align-top">{badgeForRelevance(p.relevance)}</td>
 <td className="px-4 py-4 align-top">{badgeForDecisionPower(p.decisionPower)}</td>
 <td className="px-4 py-4 align-top">{badgeForRelationshipStatus(p.relationshipStatus)}</td>
 <td className="px-4 py-4 align-top text-sm text-neutral-700">{p.contactChannel || '—'}</td>
 <td className="px-4 py-4 align-top text-sm text-neutral-700">{p.nextFollowUpDate ? p.nextFollowUpDate.slice(0, 10) : '—'}</td>
 <td className="px-4 py-4 align-top">
 <div className="flex flex-wrap justify-end gap-1.5">
 {onUseTemplate && (
 <Button variant="ghost" size="sm" onClick={() => onUseTemplate(p)} className="text-neutral-700 hover:text-neutral-900">Template</Button>
 )}
 {onEdit && (
 <Button variant="ghost" size="sm" onClick={() => onEdit(p)} className="text-neutral-700 hover:text-neutral-900">Edit</Button>
 )}
 {onDelete && (
 <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)} className="text-neutral-700 hover:text-neutral-900">Delete</Button>
 )}
 </div>
 </td>
 </tr>
 ))}
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
 </CardContent>
 </Card>
 );
};

export default PeopleTable;
