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
    <div style={{
      height: '100vh',
      background: 'linear-gradient(135deg, #f3f2fa 0%, #e8e6f2 45%, #dedbea 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
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

      {/* Diagonal decorative shapes */}
      <div style={{
        position: 'absolute', top: '-10%', right: '-5%',
        width: '50%', height: '70%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.3) 0%, rgba(200,195,220,0.1) 100%)',
        transform: 'rotate(-15deg)', borderRadius: '60px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-8%', left: '-3%',
        width: '35%', height: '50%',
        background: 'linear-gradient(135deg, rgba(200,195,220,0.08) 0%, rgba(255,255,255,0.2) 100%)',
        transform: 'rotate(20deg)', borderRadius: '50px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '40%', left: '20%',
        width: '20%', height: '20%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top bar */}
      <div style={{
        position: 'relative', zIndex: 10,
        height: '40px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={topIconBtn} title="Menu">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </div>
          <span style={{ fontSize: '12px', fontWeight: 600, color: '#475569' }}>Personal OS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={topIconBtn} title="Status">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>
            </svg>
          </div>
          <div style={{ position: 'relative' }}>
            <div style={topIconBtn} title="Notifications">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
            </div>
            <div style={{
              position: 'absolute', top: '2px', right: '2px',
              width: '7px', height: '7px',
              background: '#ef4444', borderRadius: '50%',
              pointerEvents: 'none',
            }} />
          </div>
          <div style={topIconBtn} title="History">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div style={topIconBtn} title="Settings">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            cursor: 'default',
            fontSize: '12px', fontWeight: 500, color: '#0f172a',
          }}>
            <div style={{
              width: '22px', height: '22px', borderRadius: '4px',
              background: '#0f172a',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: '#fff', fontSize: '9px', fontWeight: 700,
            }}>
              OU
            </div>
            <span>Oussama</span>
          </div>
        </div>
      </div>

      {/* Desktop icon area */}
      <div style={{
        position: 'relative', zIndex: 10,
        flex: 1,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '110px',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}>
        <div className="desktop-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 92px)',
          gap: '40px 64px',
          justifyContent: 'center',
          maxWidth: '900px',
          boxSizing: 'border-box',
        }}>
          {APPS.map((app) => (
            <button
              key={app.id}
              onClick={() => onLaunchApp(app.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: '64px', height: '64px',
                  background: '#ffffff',
                  borderRadius: '8px',
                  boxShadow: '0 2px 6px rgba(15,23,42,0.16)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,23,42,0.2)';
                  const label = e.currentTarget.parentElement?.querySelector('.app-label') as HTMLElement;
                  if (label) label.style.color = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(15,23,42,0.16)';
                  const label = e.currentTarget.parentElement?.querySelector('.app-label') as HTMLElement;
                  if (label) label.style.color = '#0f172a';
                }}
              >
                {app.icon}
              </div>
              <span className="app-label" style={{
                marginTop: '10px',
                fontSize: '13px', fontWeight: 500,
                color: '#0f172a', textAlign: 'center',
                lineHeight: '1.3',
                transition: 'color 0.15s ease',
              }}>
                {app.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

const topIconBtn: React.CSSProperties = {
  width: '28px', height: '28px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '6px',
  border: 'none',
  cursor: 'default',
  color: '#334155',
  transition: 'background 0.15s ease',
};

export default DesktopLauncher;
export type { AppId };
