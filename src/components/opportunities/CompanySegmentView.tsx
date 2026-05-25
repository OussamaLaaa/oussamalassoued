import React, { useMemo, useState } from 'react';
import { normalizeDatabaseType } from '../../utils/opportunitiesMappers';
import type { Company, Person, OutreachMessage, Deal } from '../../types/opportunities';
import type { CompanyFilters } from './CompaniesTable';
import type { SegmentType } from '../../types/opportunities';
import CompaniesTable from './CompaniesTable';
import CsvImportModal from './CsvImportModal';
import StatCard from '../ui/StatCard';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

const isSegmentMatch = (company: Company, segment: SegmentType): boolean => {
  return normalizeDatabaseType(company.databaseType) === segment;
};

// ── Strategy Card ──
const segmentStrategy: Record<SegmentType, { title: string; goal: string; hint: string }> = {
  big_company: {
    title: 'Big Companies',
    goal: 'Goal: internships, junior roles, portfolio feedback, recruiter relationships.',
    hint: 'Focus on HR departments, career pages, and LinkedIn recruiters. Target companies with structured internship programs.',
  },
  sme: {
    title: 'SME Companies',
    goal: 'Goal: faster work opportunities, partnerships, agency collaboration, practical experience.',
    hint: 'Decision-makers are often the founder or CTO. Move fast — SMEs value direct, personal outreach.',
  },
  freelance: {
    title: 'Freelance Leads',
    goal: 'Goal: paid UX/UI work, audits, proposals, recurring clients.',
    hint: 'Highlight portfolio, offer free audits, emphasize turnaround time. Build recurring relationships.',
  },
};

// ── Helpers for stats ──
const getFollowUpsDue = (people: Person[], messages: OutreachMessage[]): number => {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  let count = 0;
  for (const p of people) {
    if (!p.nextFollowUpDate) continue;
    const d = new Date(p.nextFollowUpDate);
    d.setHours(0, 0, 0, 0);
    if (d <= now) count++;
  }
  for (const m of messages) {
    if (!m.nextFollowUpDate) continue;
    const d = new Date(m.nextFollowUpDate);
    d.setHours(0, 0, 0, 0);
    if (d <= now) count++;
  }
  return count;
};

// ── Segment View Component ──
const CompanySegmentView: React.FC<{
  segmentType: SegmentType;
  title: string;
  subtitle?: string;
  companies: Company[];
  people: Person[];
  messages: OutreachMessage[];
  deals: Deal[];
  onAddCompany?: () => void;
  onEdit: (company: Company) => void;
  onDelete: (id: string) => void;
  onAIScore?: (company: Company) => void;
  onImportCompaniesBatch?: (rows: Array<{ name: string; country?: string; industry?: string; website?: string }>) => Promise<any>;
}> = ({
  segmentType,
  title,
  subtitle,
  companies,
  people,
  messages,
  deals,
  onAddCompany,
  onEdit,
  onDelete,
  onAIScore,
  onImportCompaniesBatch,
}) => {
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [segmentFilters, setSegmentFilters] = useState<CompanyFilters>({
    searchQuery: '',
    priority: '',
    status: '',
    databaseType: '',
    country: '',
  });

  // Filter to only this segment's companies
  const segmentCompanies = useMemo(
    () => companies.filter((c) => isSegmentMatch(c, segmentType)),
    [companies, segmentType],
  );

  // Related people/messages/deals (by companyId)
  const segmentCompanyIds = useMemo(() => new Set(segmentCompanies.map((c) => c.id)), [segmentCompanies]);

  const segmentPeople = useMemo(
    () => people.filter((p) => p.companyId && segmentCompanyIds.has(p.companyId)),
    [people, segmentCompanyIds],
  );

  const segmentMessages = useMemo(
    () => messages.filter((m) => m.companyId && segmentCompanyIds.has(m.companyId)),
    [messages, segmentCompanyIds],
  );

  const segmentDeals = useMemo(
    () => deals.filter((d) => d.companyId && segmentCompanyIds.has(d.companyId)),
    [deals, segmentCompanyIds],
  );

  // ── Stats ──
  const stats = useMemo(() => {
    const totalCompanies = segmentCompanies.length;
    const totalPeople = segmentPeople.length;
    const messagesSent = segmentMessages.length;
    const followUpsDue = getFollowUpsDue(segmentPeople, segmentMessages);
    const openDeals = segmentDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost').length;
    const highPriority = segmentCompanies.filter((c) => c.priority === 'high').length;
    const proposalsSent = segmentDeals.filter((d) => d.stage === 'proposal_sent' || d.stage === 'negotiation').length;

    // AI Lead Scoring stats
    const scoredCompanies = segmentCompanies.filter((c) => c.fitScore != null || c.ethicalFit != null);
    const avgFitScore = scoredCompanies.length > 0
      ? (scoredCompanies.reduce((sum, c) => sum + (c.fitScore || 0), 0) / scoredCompanies.length).toFixed(1)
      : '—';
    const needsReviewEthical = segmentCompanies.filter((c) => c.ethicalFit === 'needs_review' || c.ethicalFit === 'avoid').length;

    // Shared stats
    const base = { totalCompanies, totalPeople, messagesSent, followUpsDue, openDeals, highPriority, proposalsSent, avgFitScore, needsReviewEthical };

    if (segmentType === 'big_company') {
      return {
        ...base,
        extra: [
          { title: 'Applications / Qualified', value: segmentCompanies.filter((c) => c.status === 'qualified' || c.status === 'customer').length },
        ],
      };
    }

    if (segmentType === 'sme') {
      return {
        ...base,
        extra: [
          { title: 'Partnership Leads', value: segmentCompanies.filter((c) => c.category === 'partnership' || c.nextAction?.toLowerCase().includes('partner')).length },
        ],
      };
    }

    // freelance
    return {
      ...base,
      extra: [],
    };
  }, [segmentCompanies, segmentPeople, segmentMessages, segmentDeals, segmentType]);

  const strategy = segmentStrategy[segmentType];
  const emptyMessage =
    segmentType === 'big_company'
      ? 'No Big Companies yet.'
      : segmentType === 'sme'
        ? 'No SME Companies yet.'
        : 'No Freelance Leads yet.';

  return (
    <section className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-semibold text-black">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
      </div>

      {/* Strategy Card */}
      <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-gradient-to-r from-blue-50 to-white p-4 shadow-sm">
        <div className="mt-0.5 shrink-0">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600">
            <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold text-black">{strategy.goal}</div>
          <div className="mt-1 text-xs text-neutral-500">{strategy.hint}</div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.totalCompanies} />
        <StatCard label="People Connected" value={stats.totalPeople} />
        <StatCard label="Messages Sent" value={stats.messagesSent} />
        <StatCard label="Follow-ups Due" value={stats.followUpsDue} />
        <StatCard label="Avg Fit Score" value={stats.avgFitScore} />
        <StatCard label="High Priority" value={stats.highPriority} />
        <StatCard label="Needs Review" value={stats.needsReviewEthical} />
        {segmentType === 'big_company' && stats.extra.map((e, i) => (
          <StatCard key={i} label={e.title} value={e.value} />
        ))}
        {segmentType === 'sme' && stats.extra.map((e, i) => (
          <StatCard key={i} label={e.title} value={e.value} />
        ))}
        {segmentType === 'freelance' && (
          <>
            <StatCard label="Open Deals" value={stats.openDeals} />
            <StatCard label="Proposals Sent" value={stats.proposalsSent} />
          </>
        )}
      </div>

      {/* Companies Table */}
      <div>
        <div className="mb-2 flex justify-end gap-2">
          {onAddCompany && (
            <Button variant="primary" size="sm" onClick={onAddCompany}>Add Company</Button>
          )}
          {onImportCompaniesBatch && (
            <Button variant="secondary" size="sm" onClick={() => setShowCsvImport(true)}>Import CSV</Button>
          )}
        </div>
        {segmentCompanies.length === 0 ? (
          <EmptyState
            title={emptyMessage}
            description="Create a new company with the appropriate type, or change an existing company's type."
            action={onAddCompany && <Button variant="primary" size="sm" onClick={onAddCompany}>Add Company</Button>}
          />
        ) : (
          <CompaniesTable
            companies={segmentCompanies}
            onEdit={onEdit}
            onDelete={onDelete}
            onAIScore={onAIScore}
            filters={segmentFilters}
            onFilterChange={setSegmentFilters}
          />
        )}
      </div>

      {/* CSV Import Modal */}
      {showCsvImport && onImportCompaniesBatch && (
        <CsvImportModal
          onClose={() => setShowCsvImport(false)}
          onImport={async (rows) => {
            try {
              const inserted = await onImportCompaniesBatch!(rows, segmentType);
              return { success: true, count: inserted.length };
            } catch (err) {
              return { success: false, error: err instanceof Error ? err.message : 'Import failed.' };
            }
          }}
        />
      )}
    </section>
  );
};

export default CompanySegmentView;
