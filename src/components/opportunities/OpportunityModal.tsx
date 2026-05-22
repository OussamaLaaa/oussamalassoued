import React, { useEffect } from 'react';

const OpportunityModal: React.FC<{
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}> = ({ title, onClose, children }) => {
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close modal overlay"
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div className="relative w-full max-w-2xl rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_24px_60px_rgba(15,23,42,0.18)]">
        <div className="flex items-center justify-between border-b border-[#e5e7eb] px-5 py-4">
          <h3 className="text-lg font-semibold text-[#0f172a]">{title}</h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-[#e5e7eb] px-3 py-1.5 text-sm text-[#0f172a] hover:bg-[#f8fafc]"
          >
            Close
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  );
};

export default OpportunityModal;