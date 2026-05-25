import React from 'react';

type AppId = 'desktop' | 'crm' | 'messages' | 'strategy' | 'plans' | 'tasks' | 'projects' | 'finance' | 'documents' | 'social' | 'relationships' | 'life' | 'notes' | 'ai_control';

const APPS: { id: AppId; icon: string; label: string }[] = [
  { id: 'crm', icon: '🤝', label: 'CRM' },
  { id: 'messages', icon: '💬', label: 'Messages' },
  { id: 'strategy', icon: '🎯', label: 'Strategy' },
  { id: 'plans', icon: '🗓️', label: 'Plans' },
  { id: 'tasks', icon: '✅', label: 'Tasks' },
  { id: 'projects', icon: '🧩', label: 'Projects' },
  { id: 'finance', icon: '💰', label: 'Finance' },
  { id: 'documents', icon: '📄', label: 'Documents' },
  { id: 'social', icon: '📣', label: 'Social Media' },
  { id: 'relationships', icon: '👥', label: 'Relationships' },
  { id: 'life', icon: '🌱', label: 'Life' },
  { id: 'notes', icon: '📝', label: 'Notes' },
  { id: 'ai_control', icon: '🧠', label: 'AI Control' },
];

const DesktopLauncher: React.FC<{ onLaunchApp: (appId: AppId) => void }> = ({ onLaunchApp }) => {
  return (
    <div className="h-screen bg-white relative overflow-hidden flex flex-col">
      <style>{`
        @media (max-width: 540px) {
          .desktop-grid { grid-template-columns: repeat(3, 92px) !important; gap: 34px 40px !important; }
        }
        @media (min-width: 541px) and (max-width: 820px) {
          .desktop-grid { grid-template-columns: repeat(4, 92px) !important; gap: 34px 48px !important; }
        }
        @media (min-width: 821px) {
          .desktop-grid { grid-template-columns: repeat(6, 92px) !important; gap: 40px 64px !important; }
        }
      `}</style>

      {/* Top bar */}
      <div className="relative z-10 h-10 flex items-center justify-between px-5 border-b border-neutral-100">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 flex items-center justify-center rounded-md border-none cursor-default text-neutral-500 hover:bg-neutral-100 transition-colors duration-150">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="12"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </div>
          <span className="text-xs font-semibold text-neutral-600">Personal OS</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 flex items-center justify-center rounded-md border-none cursor-default text-neutral-500 hover:bg-neutral-100 transition-colors duration-150">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <div className="relative">
            <div className="w-7 h-7 flex items-center justify-center rounded-md border-none cursor-default text-neutral-500 hover:bg-neutral-100 transition-colors duration-150">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div className="absolute top-1 right-1 w-1.5 h-1.5 bg-red-500 rounded-full pointer-events-none" />
          </div>
          <div className="w-7 h-7 flex items-center justify-center rounded-md border-none cursor-default text-neutral-500 hover:bg-neutral-100 transition-colors duration-150">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="w-7 h-7 flex items-center justify-center rounded-md border-none cursor-default text-neutral-500 hover:bg-neutral-100 transition-colors duration-150">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <div className="flex items-center gap-1.5 cursor-default text-xs font-medium text-black">
            <div className="w-5 h-5 rounded bg-black flex items-center justify-center text-white text-[9px] font-bold">
              OU
            </div>
            <span>Oussama</span>
          </div>
        </div>
      </div>

      {/* Desktop icon area */}
      <div className="relative z-10 flex-1 flex flex-col items-center pt-28 overflow-y-auto overflow-x-hidden">
        <div className="desktop-grid grid justify-center max-w-[900px] box-border"
          style={{ gridTemplateColumns: 'repeat(6, 92px)', gap: '40px 64px' }}>
          {APPS.map((app) => (
            <button
              key={app.id}
              onClick={() => onLaunchApp(app.id)}
              className="flex flex-col items-center cursor-pointer bg-transparent border-none p-0 min-w-0 group"
            >
              <div className="w-16 h-16 bg-white border border-neutral-200 rounded-xl flex items-center justify-center text-[28px] transition-all duration-150 group-hover:border-neutral-300 group-hover:shadow-sm">
                {app.icon}
              </div>
              <span className="mt-2.5 text-xs font-medium text-neutral-700 text-center leading-tight transition-colors duration-150 group-hover:text-black">
                {app.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DesktopLauncher;
export type { AppId };
