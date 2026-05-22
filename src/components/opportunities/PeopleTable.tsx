import React from 'react';
import type { Person } from '../../types/opportunities';

const PeopleTable: React.FC<{
  people: Person[];
  onEdit?: (person: Person) => void;
  onDelete?: (id: string) => void;
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
                  <div className="flex items-center gap-1">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(p)}
                        className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]"
                      >
                        Edit
                      </button>
                    )}
                    {onDelete && (
                      <button
                        type="button"
                        onClick={() => onDelete(p.id)}
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

export default PeopleTable;
