import React, { useMemo, useState } from 'react';
import { normalizeDatabaseType } from '../../utils/opportunitiesMappers';
import type { Company, Person, OutreachMessage, Deal } from '../../types/opportunities';
import type { CompanyFilters } from './CompaniesTable';
import type { SegmentType } from '../../types/opportunities';
import CompaniesTable from './CompaniesTable';
import CsvImportModal from './CsvImportModal';

const isSegmentMatch = (company: Company, segment: SegmentType): boolean => {
  return normalizeDatabaseType(company.databaseType) === segment;
};

// ── Stat Card ──
const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => (
  <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
    <div className="text-xs font-mono uppercase text-[#64748b]">{title}</div>
    <div className="mt-1 text-2xl font-semibold text-[#0f172a]">{value}</div>
  </div>
);

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
        <h2 className="text-2xl font-semibold text-[#0f172a]">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-[#64748b]">{subtitle}</p>}
      </div>

      {/* Strategy Card */}
      <div className="rounded-lg border border-[#e5e7eb] bg-gradient-to-r from-[#f0f9ff] to-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex items-start gap-3">
          <div className="shrink-0 mt-0.5">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[#2563eb]">
              <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
            </svg>
          </div>
          <div>
            <div className="font-semibold text-[#0f172a] text-sm">{strategy.goal}</div>
            <div className="mt-1 text-xs text-[#64748b]">{strategy.hint}</div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        <StatCard title="Total" value={stats.totalCompanies} />
        <StatCard title="People Connected" value={stats.totalPeople} />
        <StatCard title="Messages Sent" value={stats.messagesSent} />
        <StatCard title="Follow-ups Due" value={stats.followUpsDue} />
        <StatCard title="Avg Fit Score" value={stats.avgFitScore} />
        <StatCard title="High Priority" value={stats.highPriority} />
        <StatCard title="Needs Review" value={stats.needsReviewEthical} />
        {segmentType === 'big_company' && stats.extra.map((e, i) => (
          <StatCard key={i} title={e.title} value={e.value} />
        ))}
        {segmentType === 'sme' && stats.extra.map((e, i) => (
          <StatCard key={i} title={e.title} value={e.value} />
        ))}
        {segmentType === 'freelance' && (
          <>
            <StatCard title="Open Deals" value={stats.openDeals} />
            <StatCard title="Proposals Sent" value={stats.proposalsSent} />
          </>
        )}
      </div>

      {/* Companies Table */}
      <div>
        <div className="flex items-center justify-end gap-2 mb-2">
          {onAddCompany && (
            <button
              type="button"
              onClick={onAddCompany}
              className="text-xs px-3 py-1.5 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8]"
            >
              Add Company
            </button>
          )}
          {onImportCompaniesBatch && (
            <button
              type="button"
              onClick={() => setShowCsvImport(true)}
              className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
            >
              Import CSV
            </button>
          )}
        </div>
        {segmentCompanies.length === 0 ? (
          <div className="rounded-lg border border-dashed border-[#e5e7eb] bg-white p-8 text-center shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <div className="text-sm text-[#64748b]">{emptyMessage}</div>
            <div className="mt-2 text-xs text-[#94a3b8]">
              Create a new company with the appropriate type, or change an existing company's type.
            </div>
          </div>
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