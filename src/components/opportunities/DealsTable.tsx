import React, { useMemo } from 'react';
import type { Deal } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import EmptyState from '../ui/EmptyState';

export interface DealFilters {
  searchQuery: string;
  stage: string;
  probabilityMin: string;
  probabilityMax: string;
}

const badgeForStage = (stage?: string) => {
  if (!stage) return null;
  const s = stage.toLowerCase();
  if (s === 'won') return <Badge variant="success">Won</Badge>;
  if (s === 'lost') return <Badge variant="danger">Lost</Badge>;
  if (s === 'negotiation') return <Badge variant="warning">Negotiation</Badge>;
  if (s === 'proposal_sent') return <Badge variant="blue">Proposal Sent</Badge>;
  return <Badge variant="neutral">{stage}</Badge>;
};

const badgeForProbability = (probability?: number) => {
  if (probability == null) return null;
  const pct = Math.round(probability * 100);
  if (pct >= 70) return <Badge variant="success">{pct}%</Badge>;
  if (pct >= 40) return <Badge variant="blue">{pct}%</Badge>;
  if (pct >= 20) return <Badge variant="warning">{pct}%</Badge>;
  return <Badge variant="neutral">{pct}%</Badge>;
};

const DealsTable: React.FC<{
  deals: Deal[];
  onEdit?: (deal: Deal) => void;
  onDelete?: (id: string) => void;
  filters?: DealFilters;
  onFilterChange?: (filters: DealFilters) => void;
}> = ({ deals, onEdit, onDelete, filters, onFilterChange }) => {
  const filtered = useMemo(() => {
    if (!filters) return deals;
    return deals.filter((d) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        const companyName = (d.companyName || '').toLowerCase();
        const personName = (d.personName || '').toLowerCase();
        if (!companyName.includes(q) && !personName.includes(q)) return false;
      }
      if (filters.stage && d.stage !== filters.stage) return false;
      if (filters.probabilityMin || filters.probabilityMax) {
        const prob = d.probability ?? 0;
        if (filters.probabilityMin && prob < parseFloat(filters.probabilityMin)) return false;
        if (filters.probabilityMax && prob > parseFloat(filters.probabilityMax)) return false;
      }
      return true;
    });
  }, [deals, filters]);

  const setFilter = (key: keyof DealFilters, value: string) => {
    if (!onFilterChange || !filters) return;
    onFilterChange({ ...filters, [key]: value });
  };

  const clearFilters = () => {
    if (!onFilterChange || !filters) return;
    onFilterChange({
      searchQuery: '',
      stage: '',
      probabilityMin: '',
      probabilityMax: '',
    });
  };

  const hasActiveFilters = filters && (
    filters.stage || filters.probabilityMin || filters.probabilityMax
  );

  return (
    <Card>
      <CardHeader>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <CardTitle style={{ fontSize: '14px' }}>Deals</CardTitle>
          <span style={{ fontSize: '12px', color: '#64748b' }}>{filtered.length} / {deals.length}</span>
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
              value={filters.stage}
              onChange={(e) => setFilter('stage', e.target.value)}
              style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a', outline: 'none' }}
            >
              <option value="">Stage</option>
              <option value="discovery">Discovery</option>
              <option value="proposal_sent">Proposal Sent</option>
              <option value="negotiation">Negotiation</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
            </select>
            <input
              type="number" min="0" max="1" step="0.1"
              value={filters.probabilityMin}
              onChange={(e) => setFilter('probabilityMin', e.target.value)}
              placeholder="Prob. min (0-1)"
              style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a', width: '110px', outline: 'none' }}
            />
            <input
              type="number" min="0" max="1" step="0.1"
              value={filters.probabilityMax}
              onChange={(e) => setFilter('probabilityMax', e.target.value)}
              placeholder="Prob. max (0-1)"
              style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '6px', border: '1px solid #e5e7eb', background: '#ffffff', color: '#0f172a', width: '110px', outline: 'none' }}
            />
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} style={{ color: '#dc2626' }}>Clear filters</Button>
            )}
          </div>
        )}

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ fontSize: '12px', color: '#475569', background: '#f8fafc' }}>
                <th style={{ padding: '8px 12px' }}>Company</th>
                <th style={{ padding: '8px 12px' }}>Contact</th>
                <th style={{ padding: '8px 12px' }}>Service</th>
                <th style={{ padding: '8px 12px' }}>Value</th>
                <th style={{ padding: '8px 12px' }}>Stage</th>
                <th style={{ padding: '8px 12px' }}>Probability</th>
                <th style={{ padding: '8px 12px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr key={d.id} style={{ borderTop: '1px solid #e5e7eb' }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#f9fafb'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <td style={{ padding: '12px', fontWeight: 600, color: '#0f172a' }}>{d.companyName}</td>
                  <td style={{ padding: '12px', color: '#0f172a' }}>{d.personName}</td>
                  <td style={{ padding: '12px', color: '#0f172a' }}>{d.servicePackage}</td>
                  <td style={{ padding: '12px', color: '#0f172a' }}>{d.value ? `${d.value} ${d.currency || ''}` : '—'}</td>
                  <td style={{ padding: '12px' }}>{badgeForStage(d.stage)}</td>
                  <td style={{ padding: '12px' }}>{badgeForProbability(d.probability)}</td>
                  <td style={{ padding: '12px' }}>
                    <div style={{ display: 'flex', gap: '4px' }}>
                      {onEdit && (
                        <Button variant="ghost" size="sm" onClick={() => onEdit(d)} style={{ color: '#2563eb' }}>Edit</Button>
                      )}
                      {onDelete && (
                        <Button variant="ghost" size="sm" onClick={() => onDelete(d.id)} style={{ color: '#dc2626' }}>Delete</Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ padding: '32px 12px', textAlign: 'center' }}>
                    <EmptyState title="No deals match the current filters." />
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

export default DealsTable;
