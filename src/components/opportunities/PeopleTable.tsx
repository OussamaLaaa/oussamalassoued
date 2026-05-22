import React from 'react';
import type { Person } from '../../types/opportunities';

const actionButtonClass = 'rounded-md border border-[#dbe2ea] bg-white px-2.5 py-1 text-[11px] font-medium text-[#0f172a] hover:bg-[#f8fafc]';

const PeopleTable: React.FC<{
  people: Person[];
  onEdit: (person: Person) => void;
  onDelete: (person: Person) => void;
}> = ({ people, onEdit, onDelete }) => {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <h3 className="font-medium text-lg text-[#0f172a]">People</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="text-xs text-[#475569] bg-[#f8fafc]">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Role</th>
              <th className="px-3 py-2">Seniority</th>
              <th className="px-3 py-2">Contact</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {people.map((p) => (
              <tr key={p.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                <td className="px-3 py-3">
                  <div className="font-semibold text-[#0f172a]">{p.fullName}</div>
                  <div className="text-xs text-[#64748b]">{p.linkedin || p.emailPublic}</div>
                </td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{p.companyName}</td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{p.role}</td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{p.seniority}</td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{p.contactChannel}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" className={actionButtonClass} onClick={() => onEdit(p)}>Edit</button>
                    <button type="button" className={actionButtonClass} onClick={() => onDelete(p)}>Delete</button>
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

export default PeopleTable;
