import React from 'react';
import type { OutreachMessage } from '../../types/opportunities';

const actionButtonClass = 'rounded-md border border-[#dbe2ea] bg-white px-2.5 py-1 text-[11px] font-medium text-[#0f172a] hover:bg-[#f8fafc]';

const MessagesTable: React.FC<{
  messages: OutreachMessage[];
  onEdit: (message: OutreachMessage) => void;
  onDelete: (message: OutreachMessage) => void;
}> = ({ messages, onEdit, onDelete }) => {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <h3 className="font-medium text-lg text-[#0f172a]">Outreach Messages</h3>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="text-xs text-[#475569] bg-[#f8fafc]">
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Company</th>
              <th className="px-3 py-2">Person</th>
              <th className="px-3 py-2">Channel</th>
              <th className="px-3 py-2">Type</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {messages.map((m) => (
              <tr key={m.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                <td className="px-3 py-3 text-sm text-[#0f172a]">{new Date(m.sentDate || '').toLocaleDateString()}</td>
                <td className="px-3 py-3 font-semibold text-[#0f172a]">{m.companyName}</td>
                <td className="px-3 py-3 text-[#0f172a]">{m.personName}</td>
                <td className="px-3 py-3 text-[#0f172a]">{m.channel}</td>
                <td className="px-3 py-3 text-[#0f172a]">{m.messageType}</td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{m.replyStatus}</td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2">
                    <button type="button" className={actionButtonClass} onClick={() => onEdit(m)}>Edit</button>
                    <button type="button" className={actionButtonClass} onClick={() => onDelete(m)}>Delete</button>
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

export default MessagesTable;
