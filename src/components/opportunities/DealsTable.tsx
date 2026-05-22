import React from 'react';
import type { Deal } from '../../types/opportunities';

const actionButtonClass = 'rounded-md border border-[#dbe2ea] bg-white px-2.5 py-1 text-[11px] font-medium text-[#0f172a] hover:bg-[#f8fafc]';

const DealsTable: React.FC<{
  deals: Deal[];
  onEdit: (deal: Deal) => void;
  onDelete: (deal: Deal) => void;
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
                  <div className="flex items-center gap-2">
                    <button type="button" className={actionButtonClass} onClick={() => onEdit(d)}>Edit</button>
                    <button type="button" className={actionButtonClass} onClick={() => onDelete(d)}>Delete</button>
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
