import React from 'react';
import type { Company, Person, OutreachMessage, Deal } from '../../types/opportunities';
import PriorityBadge from './PriorityBadge';
import StatusBadge from './StatusBadge';

const StatCard: React.FC<{ title: string; value: string | number }> = ({ title, value }) => {
  return (
    <div className="rounded-[12px] border border-[#e5e7eb] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className="text-xs font-mono uppercase text-[#64748b]">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-[#0f172a]">{value}</div>
    </div>
  );
};

const formatDate = (d?: string | null) => {
  if (!d) return '-';
  try {
    const dt = new Date(d);
    return dt.toLocaleDateString();
  } catch {
    return d;
  }
};

const OpportunitiesDashboard: React.FC<{ companies: Company[]; people: Person[]; messages: OutreachMessage[]; deals: Deal[] }> = ({ companies, people, messages, deals }) => {
  const totalCompanies = companies.length;
  const totalPeople = people.length;
  const messagesSent = messages.length;
  const followupsDue = messages.filter(m => m.nextFollowUpDate && new Date(m.nextFollowUpDate) <= new Date()).length;
  const openDeals = deals.length;
  const highPriorityCompanies = companies.filter(c => c.priority === 'high');

  const today = new Date();
  const followups = messages.filter((m) => {
    if (!m.nextFollowUpDate) return false;
    const d = new Date(m.nextFollowUpDate);
    // due today or overdue
    return d.setHours(0,0,0,0) <= new Date(today).setHours(0,0,0,0);
  });

  const recentMessages = [...messages]
    .sort((a, b) => {
      const da = a.sentDate ? new Date(a.sentDate).getTime() : 0;
      const db = b.sentDate ? new Date(b.sentDate).getTime() : 0;
      return db - da;
    })
    .slice(0, 6);

  return (
    <section className="space-y-6">
      {/* Header + Quick Actions */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold text-[#0f172a]">Dashboard</h2>
          <p className="text-sm text-[#64748b] mt-1">Pipeline health, follow-ups, and priority opportunities.</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button className="text-sm px-3 py-2 rounded-md bg-[#2563eb] text-white border border-[#2563eb] shadow-sm">Add Company</button>
          <button className="text-sm px-3 py-2 rounded-md bg-white text-[#0f172a] border border-[#e5e7eb] hover:bg-[#f8fafc]">Add Person</button>
          <button className="text-sm px-3 py-2 rounded-md bg-white text-[#0f172a] border border-[#e5e7eb] hover:bg-[#f8fafc]">Log Message</button>
          <button className="text-sm px-3 py-2 rounded-md bg-white text-[#0f172a] border border-[#e5e7eb] hover:bg-[#f8fafc]">Add Deal</button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Total Companies" value={totalCompanies} />
        <StatCard title="Total People" value={totalPeople} />
        <StatCard title="Messages Sent" value={messagesSent} />
        <StatCard title="Follow-ups Due" value={followupsDue} />
        <StatCard title="Open Deals" value={openDeals} />
        <StatCard title="High Priority Leads" value={highPriorityCompanies.length} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {/* High Priority Opportunities */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <div className="flex items-center justify-between">
              <h3 className="font-medium text-[#0f172a]">High Priority Opportunities</h3>
              <div className="text-xs text-[#64748b]">{highPriorityCompanies.length} items</div>
            </div>
            <div className="mt-3 space-y-2">
              {highPriorityCompanies.length === 0 ? (
                <div className="text-sm text-[#64748b]">No high priority opportunities.</div>
              ) : (
                highPriorityCompanies.map((c) => (
                  <div key={c.id} className="flex items-center justify-between p-3 rounded-md bg-[#f8fafc] border border-[#e5e7eb]">
                    <div>
                      <div className="font-semibold text-[#0f172a]">{c.name}</div>
                      <div className="text-xs text-[#64748b]">{c.databaseType || c.industry} • {c.city}</div>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap justify-end">
                      <div className="text-sm text-[#64748b]">{c.nextAction ?? '—'}</div>
                      <div className="text-sm text-[#64748b]">Fit: {c.fitScore ?? '—'}</div>
                      <PriorityBadge priority={c.priority} />
                      <StatusBadge status={c.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Recent Outreach */}
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <h3 className="font-medium text-[#0f172a]">Recent Outreach</h3>
            <div className="mt-3 divide-y divide-[#e5e7eb]">
              {recentMessages.length === 0 ? (
                <div className="p-3 text-sm text-[#64748b]">No outreach yet.</div>
              ) : (
                recentMessages.map((m) => (
                  <div key={m.id} className="p-3 flex items-start justify-between">
                    <div>
                      <div className="font-semibold text-[#0f172a]">{m.companyName} — {m.personName}</div>
                      <div className="text-xs text-[#64748b]">{m.channel} • {m.messageType}</div>
                      <div className="text-xs text-[#94a3b8] mt-1">Reply: {m.replyStatus} • Next: {formatDate(m.nextFollowUpDate)}</div>
                    </div>
                    <div className="text-xs text-[#64748b]">{formatDate(m.sentDate)}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right column: Follow-ups due */}
        <aside className="space-y-4">
          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <h4 className="font-medium text-[#0f172a]">Follow-ups Due</h4>
            <div className="mt-3 space-y-2">
              {followups.length === 0 ? (
                <div className="text-sm text-[#64748b]">No follow-ups due today.</div>
              ) : (
                followups.map((m) => (
                  <div key={m.id} className="p-2 rounded-md bg-[#f8fafc] border border-[#e5e7eb]">
                    <div className="font-semibold text-[#0f172a]">{m.personName} — {m.companyName}</div>
                    <div className="text-xs text-[#64748b]">{m.channel} • Reply: {m.replyStatus}</div>
                    <div className="text-xs text-[#94a3b8]">Due: {formatDate(m.nextFollowUpDate)}</div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <h4 className="font-medium text-[#0f172a]">Quick Stats</h4>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm text-[#64748b]">
              <div>Total Companies<span className="float-right">{totalCompanies}</span></div>
              <div>Total People<span className="float-right">{totalPeople}</span></div>
              <div>Open Deals<span className="float-right">{openDeals}</span></div>
              <div>Follow-ups Due<span className="float-right">{followupsDue}</span></div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

export default OpportunitiesDashboard;
