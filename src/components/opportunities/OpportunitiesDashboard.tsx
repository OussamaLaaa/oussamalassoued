import React, { useMemo } from 'react';
import type { Company, Person } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/Card';

const parseDate = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date;
};

const startOfDay = (date: Date) => {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
};

const formatShortDate = (value?: string | null) => {
  const date = parseDate(value);
  if (!date) return '—';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

const normalizeText = (value?: string | null) => (value || '').trim().toLowerCase();

type SectionCardProps = {
  title: string;
  subtitle: string;
  count?: number;
  action?: React.ReactNode;
  children: React.ReactNode;
};

const SectionCard: React.FC<SectionCardProps> = ({ title, subtitle, count, action, children }) => (
  <Card className="overflow-hidden">
    <CardHeader className="border-b border-neutral-200 px-5 py-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-sm">{title}</CardTitle>
          <CardDescription className="mt-1 text-xs">{subtitle}</CardDescription>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {typeof count === 'number' ? <span className="text-xs text-neutral-500">{count} items</span> : null}
          {action}
        </div>
      </div>
    </CardHeader>
    <CardContent className="p-0">{children}</CardContent>
  </Card>
);

const CompactEmptyState: React.FC<{ title: string; description: string; action?: React.ReactNode }> = ({ title, description, action }) => (
  <div className="px-5 py-6 text-center">
    <div className="mx-auto max-w-sm rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-4 py-5">
      <h4 className="m-0 text-sm font-semibold text-black">{title}</h4>
      <p className="mt-1 text-xs leading-relaxed text-neutral-500">{description}</p>
      {action ? <div className="mt-4 inline-flex">{action}</div> : null}
    </div>
  </div>
);

const rowShell = 'flex items-start justify-between gap-3 px-5 py-3 transition-colors hover:bg-neutral-50';

const OpportunitiesDashboard: React.FC<{
  companies: Company[];
  people: Person[];
  templateCount: number;
  onAddCompany: () => void;
  onAddPerson: () => void;
  onOpenCompaniesTab?: () => void;
}> = ({ companies, people, templateCount, onAddCompany, onAddPerson, onOpenCompaniesTab }) => {
  const today = startOfDay(new Date());

  const totalCompanies = companies.length;
  const totalPeople = people.length;

  const highPriorityLeadCount = companies.filter(
    (company) => company.priority === 'high' || (typeof company.fitScore === 'number' && company.fitScore >= 80)
  ).length;

  const companiesWithoutContact = companies.filter((c) => !c.email && !c.phone && !c.linkedin && !c.website).length;

  const recentCompanies = useMemo(() => {
    return [...companies]
      .filter((c) => c.createdAt)
      .sort((a, b) => {
        const aDate = parseDate(a.createdAt)?.getTime() || 0;
        const bDate = parseDate(b.createdAt)?.getTime() || 0;
        return bDate - aDate;
      })
      .slice(0, 3);
  }, [companies]);

  const newPeopleCount = people.filter((person) => {
    const date = parseDate(person.createdAt);
    if (!date) return false;
    const diffDays = Math.floor((today.getTime() - startOfDay(date).getTime()) / 86400000);
    return diffDays >= 0 && diffDays <= 30;
  }).length;

  const highPriorityCompanies = useMemo(() => {
    return [...companies]
      .filter(
        (company) =>
          company.priority === 'high' ||
          (typeof company.fitScore === 'number' && company.fitScore >= 80) ||
          company.ethicalFit === 'good'
      )
      .sort((a, b) => (b.fitScore || 0) - (a.fitScore || 0) || a.name.localeCompare(b.name))
      .slice(0, 3);
  }, [companies]);

  const renderPriorityRow = (company: Company) => (
    <div key={company.id} className={rowShell}>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold text-black">{company.name}</div>
        <div className="mt-0.5 truncate text-sm text-neutral-600">
          {(company.status || 'prospect').replace(/_/g, ' ')} • {company.industry || company.category || company.city || 'Current lead'}
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 text-xs text-neutral-500">
        <Badge variant="neutral">Fit {typeof company.fitScore === 'number' ? company.fitScore : '—'}</Badge>
        <Badge variant="neutral">{company.priority || 'medium'}</Badge>
        <span className="max-w-[220px] truncate text-right">{company.nextAction || 'No next action set'}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-5">
      <section>
        <div className="grid gap-3 md:grid-cols-3 lg:grid-cols-6">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Total Companies</p>
            <p className="mt-1.5 text-2xl font-bold text-neutral-900 tabular-nums">{totalCompanies}</p>
            <p className="mt-1 text-xs text-neutral-400">Current total</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Total People</p>
            <p className="mt-1.5 text-2xl font-bold text-neutral-900 tabular-nums">{totalPeople}</p>
            <p className="mt-1 text-xs text-neutral-400">Current total</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">High Priority Leads</p>
            <p className="mt-1.5 text-2xl font-bold text-amber-600 tabular-nums">{highPriorityLeadCount}</p>
            <p className="mt-1 text-xs text-neutral-400">Score ≥ 80 or High</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">Message Examples</p>
            <p className="mt-1.5 text-2xl font-bold text-violet-600 tabular-nums">{templateCount}</p>
            <p className="mt-1 text-xs text-neutral-400">In your library</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">New People</p>
            <p className="mt-1.5 text-2xl font-bold text-blue-600 tabular-nums">{newPeopleCount}</p>
            <p className="mt-1 text-xs text-neutral-400">Last 30 days</p>
          </div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <p className="text-xs text-neutral-500">No Contact Info</p>
            <p className="mt-1.5 text-2xl font-bold text-neutral-900 tabular-nums">{companiesWithoutContact}</p>
            <p className="mt-1 text-xs text-neutral-400">Companies missing contact</p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <SectionCard
          title="High Priority Opportunities"
          subtitle="Top-scoring leads worth a push."
          count={highPriorityCompanies.length}
          action={onOpenCompaniesTab ? <Button variant="ghost" size="sm" onClick={onOpenCompaniesTab} className="text-neutral-700 hover:text-neutral-900">View all</Button> : undefined}
        >
          {highPriorityCompanies.length ? (
            <div className="divide-y divide-neutral-100">
              {highPriorityCompanies.map(renderPriorityRow)}
            </div>
          ) : (
            <CompactEmptyState
              title="No high priority opportunities."
              description="Run AI scoring on your companies to surface the best ones."
              action={<Button variant="secondary" size="sm" onClick={onAddCompany}>Add Company</Button>}
            />
          )}
        </SectionCard>

        <SectionCard title="Recent Companies" subtitle="Latest additions" count={recentCompanies.length}>
          {recentCompanies.length ? (
            <div className="divide-y divide-neutral-100">
              {recentCompanies.map((company) => (
                <div key={company.id} className={rowShell}>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold text-black">{company.name}</div>
                    <div className="mt-0.5 truncate text-sm text-neutral-600">
                      {company.city || company.country || company.industry || '—'} • {formatShortDate(company.createdAt)}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-2 text-xs text-neutral-500">
                    <Badge variant="neutral">{company.databaseType?.replace(/_/g, ' ') || 'lead'}</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <CompactEmptyState
              title="No companies yet."
              description="Add your first company to start building your CRM pipeline."
              action={<Button variant="secondary" size="sm" onClick={onAddCompany}>Add Company</Button>}
            />
          )}
        </SectionCard>
      </section>
    </div>
  );
};

export default OpportunitiesDashboard;
