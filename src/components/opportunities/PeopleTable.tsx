import React, { useMemo } from 'react';
import type { Person } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
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
  const statusOptions = Array.from(statusSet).sort();

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <CardTitle style={{ fontSize: '14px' }}>People</CardTitle>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{filtered.length} / {people.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        {filters && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px',
            marginBottom: '12px', paddingBottom: '12px',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <select
              value={filters.decisionPower}
              onChange={(e) => setFilter('decisionPower', e.target.value)}
              style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a', outline: 'none' }}
            >
              <option value="">Decision Power</option>
              <option value="3">High</option>
              <option value="2">Medium</option>
              <option value="1">Low</option>
              <option value="0">None</option>
            </select>
            <select
              value={filters.relevance}
              onChange={(e) => setFilter('relevance', e.target.value)}
              style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a', outline: 'none' }}
            >
              <option value="">Relevance</option>
              <option value="3">High</option>
              <option value="2">Medium</option>
              <option value="1">Low</option>
            </select>
            <select
              value={filters.relationshipStatus}
              onChange={(e) => setFilter('relationshipStatus', e.target.value)}
              style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a', outline: 'none' }}
            >
              <option value="">Relationship Status</option>
              {statusOptions.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} style={{ color: '#dc2626' }}>Clear filters</Button>
            )}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ fontSize: '12px', color: '#475569', background: '#f8fafc' }}>
                <th style={{ padding: '8px 12px' }}>Name</th>
                <th style={{ padding: '8px 12px' }}>Company</th>
                <th style={{ padding: '8px 12px' }}>Role</th>
                <th style={{ padding: '8px 12px' }}>Seniority</th>
                <th style={{ padding: '8px 12px' }}>Relevance</th>
                <th style={{ padding: '8px 12px' }}>Decision Power</th>
                <th style={{ padding: '8px 12px' }}>Relationship</th>
                <th style={{ padding: '8px 12px' }}>Contact</th>
                <th style={{ padding: '8px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} style={{ borderTop: '1px solid #e5e7eb' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.fullName}</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>{p.linkedin || p.emailPublic}</div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#0f172a' }}>{p.companyName}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#0f172a' }}>{p.role}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#0f172a' }}>{p.seniority}</td>
                  <td style={{ padding: '12px' }}>{badgeForRelevance(p.relevance)}</td>
                  <td style={{ padding: '12px' }}>{badgeForDecisionPower(p.decisionPower)}</td>
                  <td style={{ padding: '12px' }}>{badgeForRelationshipStatus(p.relationshipStatus)}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#0f172a' }}>{p.contactChannel}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                      {onUseTemplate && (
                        <Button variant="ghost" size="sm" onClick={() => onUseTemplate(p)} style={{ color: '#0f172a' }}>Template</Button>
                      )}
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(p)} style={{ color: '#2563eb' }}>Edit</Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(p.id)} style={{ color: '#dc2626' }}>Delete</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ padding: '32px 12px', textAlign: 'center' }}>
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
