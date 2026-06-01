import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useMemo, useState } from 'react';
import { normalizeDatabaseType } from '../../utils/opportunitiesMappers';
import type { Company, Person, OutreachMessage, Deal } from '../../types/opportunities';
import type { CompanyFilters } from './CompaniesTable';
import type { SegmentType } from '../../types/opportunities';
import CompaniesTable from './CompaniesTable';
import CsvImportModal from './CsvImportModal';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';

const isSegmentMatch = (company: Company, segment: SegmentType): boolean => {
  const { t, language } = usePersonalLanguage();

  return normalizeDatabaseType(company.databaseType) === segment;
};

// ── Insight panel content ──
const segmentInsight: Record<SegmentType, { title: string; description: string }> = {
  big_company: {
  title: 'Enterprise pipeline focus',
  description: 'Prioritize HR departments, career pages, and LinkedIn recruiters. Target companies with structured internship programs.',
  },
  sme: {
  title: 'SMB partnership focus',
  description: 'Decision-makers are often the founder or CTO. Move fast — SMEs value direct, personal outreach.',
  },
  freelance: {
  title: 'Freelance pipeline focus',
  description: 'Prioritize high-fit leads, clear outreach angles, and recurring service opportunities.',
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
 onCompanyClick?: (companyId: string) => void;
 onImportCompaniesBatch?: (rows: Array<{ name: string; country?: string; industry?: string; website?: string }>, segmentType?: SegmentType) => Promise<any>;
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
 onCompanyClick,
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

  const scoredCompanies = segmentCompanies.filter((c) => c.fitScore != null || c.ethicalFit != null);
  const avgFitScore = scoredCompanies.length > 0
  ? (scoredCompanies.reduce((sum, c) => sum + (c.fitScore || 0), 0) / scoredCompanies.length).toFixed(1)
  : '—';
  const needsReviewEthical = segmentCompanies.filter((c) => c.ethicalFit === 'needs_review' || c.ethicalFit === 'avoid').length;
  const qualifiedCount = segmentCompanies.filter((c) => c.status === 'qualified' || c.status === 'customer').length;
  const partnershipLeads = segmentCompanies.filter((c) => c.category === 'partnership' || c.nextAction?.toLowerCase().includes('partner')).length;

  return { totalCompanies, totalPeople, messagesSent, followUpsDue, openDeals, highPriority, proposalsSent, avgFitScore, needsReviewEthical, qualifiedCount, partnershipLeads };
  }, [segmentCompanies, segmentPeople, segmentMessages, segmentDeals, segmentType]);

  const insight = segmentInsight[segmentType];
  const emptyMessage =
  segmentType === 'big_company'
  ? 'No Big Companies yet.'
  : segmentType === 'sme'
  ? 'No SME Companies yet.'
  : 'No Freelance Leads yet.';

  const primaryStats: { label: string; value: string | number; color: string }[] = (() => {
  const items: { label: string; value: string | number; color: string }[] = [
  { label: 'Total', value: stats.totalCompanies, color: '' },
  { label: 'Avg Fit Score', value: stats.avgFitScore, color: 'text-blue-600' },
  { label: 'High Priority', value: stats.highPriority, color: 'text-amber-600' },
  { label: 'People Connected', value: stats.totalPeople, color: '' },
  ];
  if (segmentType === 'freelance') {
  items.push({ label: 'Open Deals', value: stats.openDeals, color: 'text-emerald-600' });
  items.push({ label: 'Messages Sent', value: stats.messagesSent, color: 'text-indigo-500' });
  } else {
  items.push({ label: 'Messages Sent', value: stats.messagesSent, color: 'text-indigo-500' });
  if (segmentType === 'big_company') {
  items.push({ label: 'Qualified', value: stats.qualifiedCount, color: 'text-emerald-600' });
  } else {
  items.push({ label: 'Partnership Leads', value: stats.partnershipLeads, color: 'text-emerald-600' });
  }
  }
  return items;
  })();

  const secondaryStats: { label: string; value: string | number }[] = [
  { label: 'Follow-ups Due', value: stats.followUpsDue },
  { label: 'Needs Review', value: stats.needsReviewEthical },
  { label: 'Proposals Sent', value: stats.proposalsSent },
  ].filter((s) => s.value !== 0 && s.value !== '—');

  return (
  <section className="space-y-5">
  {/* Header */}
  <div>
  <h2 className="text-xl font-semibold text-neutral-900">{title}</h2>
  {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
  </div>

  {/* Insight Panel */}
  <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-blue-50/40 p-3.5">
  <div className="mt-0.5 shrink-0 text-blue-600">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  </svg>
  </div>
  <div className="min-w-0">
  <div className="text-sm font-semibold text-neutral-900">{insight.title}</div>
  <div className="mt-0.5 text-xs leading-relaxed text-neutral-500">{insight.description}</div>
  </div>
  </div>

  {/* Primary Stats */}
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
  {primaryStats.map((stat) => (
  <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">{stat.label}</p>
  <p className={`mt-1.5 text-xl font-bold tabular-nums ${stat.color || 'text-neutral-900'}`}>{stat.value}</p>
  </div>
  ))}
  </div>

  {/* Secondary stats */}
  {secondaryStats.length > 0 && (
  <details className="group">
  <summary className="cursor-pointer text-xs text-neutral-400 hover:text-neutral-600 select-none list-none">
  <span className="group-open:hidden">Show more stats</span>
  <span className="hidden group-open:inline">Hide more stats</span>
  </summary>
  <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
  {secondaryStats.map((stat) => (
  <div key={stat.label} className="rounded-xl border border-neutral-100 bg-white p-3">
  <p className="text-xs text-neutral-400">{stat.label}</p>
  <p className="mt-1 text-sm font-semibold text-neutral-700 tabular-nums">{stat.value}</p>
  </div>
  ))}
  </div>
  </details>
  )}

 {/* Companies Table */}
 <div>
 <div className="mb-3 flex flex-wrap justify-end gap-2">
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
 onCompanyClick={onCompanyClick}
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
