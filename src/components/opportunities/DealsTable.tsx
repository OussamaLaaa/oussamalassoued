import React from 'react';
import type { Deal } from '../../types/opportunities';

const DealsTable: React.FC<{
  deals: Deal[];
  onEdit?: (deal: Deal) => void;
  onDelete?: (id: string) => void;
}> = ({ deals, onEdit, onDelete }) => {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <h3 className="font-medium text-lg text-[#0f172a]">Deals</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="text-xs text-[#475569] bg-[#f8fafc]">
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Service</th>
              <th className="px-3 py-2">Value</th>
              <th className="px-3 py-2">Stage</th>
              <th className="px-3 py-2">Probability</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr key={d.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                <td className="px-3 py-3 font-semibold text-[#0f172a]">{d.companyName}</td>
                <td className="px-3 py-3 text-[#0f172a]">{d.personName}</td>
                <td className="px-3 py-3 text-[#0f172a]">{d.servicePackage}</td>
                <td className="px-3 py-3 text-[#0f172a]">{d.value ? `${d.value} ${d.currency || ''}` : '—'}</td>
                <td className="px-3 py-3 text-[#0f172a]">{d.stage}</td>
                <td className="px-3 py-3 text-[#0f172a]">{Math.round((d.probability || 0) * 100)}%</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(d)}
                        className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(d.id)}
                        className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2]"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DealsTable;
