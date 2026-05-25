import React, { useMemo } from 'react';
import { normalizeDatabaseType } from '../../utils/opportunitiesMappers';
import type { Company } from '../../types/opportunities';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import Button from '../ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export interface CompanyFilters {
  searchQuery: string;
  priority: string;
  status: string;
  databaseType: string;
  country: string;
}

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
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <CardTitle style={{ fontSize: '14px' }}>Companies</CardTitle>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{filtered.length} / {companies.length}</span>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filters */}
        {filters && (
          <div style={{
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px',
            marginBottom: '12px', paddingBottom: '12px',
            borderBottom: '1px solid #e5e7eb',
          }}>
            <select
              value={filters.priority}
              onChange={(e) => setFilter('priority', e.target.value)}
              style={{
                fontSize: '12px', padding: '4px 8px', borderRadius: '6px',
                border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a',
                outline: 'none',
              }}
            >
              <option value="">Priority</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilter('status', e.target.value)}
              style={{
                fontSize: '12px', padding: '4px 8px', borderRadius: '6px',
                border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a',
                outline: 'none',
              }}
            >
              <option value="">Status</option>
              <option value="prospect">Prospect</option>
              <option value="contacted">Contacted</option>
              <option value="qualified">Qualified</option>
              <option value="lost">Lost</option>
              <option value="customer">Customer</option>
            </select>
            <select
              value={filters.databaseType}
              onChange={(e) => setFilter('databaseType', e.target.value)}
              style={{
                fontSize: '12px', padding: '4px 8px', borderRadius: '6px',
                border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a',
                outline: 'none',
              }}
            >
              <option value="">Database Type</option>
              <option value="big_company">Big Company</option>
              <option value="sme">SME</option>
              <option value="freelance">Freelance</option>
            </select>
            <input
              type="text"
              value={filters.country}
              onChange={(e) => setFilter('country', e.target.value)}
              placeholder="Country..."
              style={{
                fontSize: '12px', padding: '4px 8px', borderRadius: '6px',
                border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a',
                width: '100px', outline: 'none',
              }}
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} style={{ color: '#dc2626' }}>
                Clear filters
              </Button>
            )}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ fontSize: '12px', color: '#475569', background: '#f8fafc' }}>
                <th style={{ padding: '8px 12px' }}>Name</th>
                <th style={{ padding: '8px 12px' }}>Industry</th>
                <th style={{ padding: '8px 12px' }}>Location</th>
                <th style={{ padding: '8px 12px' }}>Priority</th>
                <th style={{ padding: '8px 12px' }}>Fit</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
                <th style={{ padding: '8px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} style={{ borderTop: '1px solid #e5e7eb' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{c.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', wordBreak: 'break-word' }}>{c.website || c.linkedin}</div>
                  </td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#0f172a' }}>{c.industry}</td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#0f172a' }}>{c.city}, {c.country}</td>
                  <td style={{ padding: '12px' }}><PriorityBadge priority={c.priority} /></td>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#0f172a' }}>{c.fitScore ?? '—'}</td>
                  <td style={{ padding: '12px' }}><StatusBadge status={c.status} /></td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(c)} style={{ color: '#2563eb' }}>Edit</Button>
                      )}
                      {onAIScore && (
                        <Button variant="ghost" size="sm" onClick={() => onAIScore(c)} style={{ color: '#7c3aed' }}>AI Score</Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(c.id)} style={{ color: '#dc2626' }}>Delete</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 12px', textAlign: 'center' }}>
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
