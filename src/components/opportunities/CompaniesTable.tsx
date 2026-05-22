import React from 'react';
import type { Company } from '../../types/opportunities';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

const CompaniesTable: React.FC<{ companies: Company[] }> = ({ companies }) => {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <h3 className="font-medium text-lg text-[#0f172a]">Companies</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="text-xs text-[#475569] bg-[#f8fafc]">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Industry</th>
              <th className="px-3 py-2">Location</th>
              <th className="px-3 py-2">Priority</th>
              <th className="px-3 py-2">Fit</th>
              <th className="px-3 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {companies.map((c) => (
              <tr key={c.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                <td className="px-3 py-3">
                  <div className="font-semibold text-[#0f172a]">{c.name}</div>
                  <div className="text-xs text-[#64748b]">{c.website || c.linkedin}</div>
                </td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{c.industry}</td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{c.city}, {c.country}</td>
                <td className="px-3 py-3"><PriorityBadge priority={c.priority} /></td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{c.fitScore ?? '—'}</td>
                <td className="px-3 py-3"><StatusBadge status={c.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CompaniesTable;
