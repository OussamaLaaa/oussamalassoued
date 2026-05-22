import React from 'react';
import type { StrategyNote } from '../../types/opportunities';

const StrategyPanel: React.FC<{ notes: StrategyNote[] }> = ({ notes }) => {
  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <h3 className="font-medium text-lg text-[#0f172a]">Strategy Notes</h3>
      <div className="mt-4 space-y-3">
        {notes.map((n) => (
          <article key={n.id} className="p-3 rounded-md bg-[#f8fafc] border border-[#e5e7eb]">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-[#0f172a]">{n.title}</h4>
              <span className="text-xs text-[#64748b]">{n.priority}</span>
            </div>
            <p className="mt-2 text-sm text-[#64748b]">{n.content}</p>
          </article>
        ))}
      </div>
    </div>
  );
};

export default StrategyPanel;
