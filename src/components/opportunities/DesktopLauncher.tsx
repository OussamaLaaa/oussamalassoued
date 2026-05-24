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
      background: 'linear-gradient(135deg, #f4f3fb 0%, #e8e6f2 45%, #dedbea 100%)',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    }}>
      <style>{`
        @media (max-width: 500px) {
          .desktop-grid { grid-template-columns: repeat(3, 96px) !important; }
        }
        @media (min-width: 501px) and (max-width: 768px) {
          .desktop-grid { grid-template-columns: repeat(4, 96px) !important; }
        }
        @media (min-width: 769px) {
          .desktop-grid { grid-template-columns: repeat(6, 96px) !important; }
        }
      `}</style>

      {/* Diagonal decorative shapes */}
      <div style={{
        position: 'absolute', top: '-15%', right: '-8%',
        width: '55%', height: '75%',
        background: 'linear-gradient(135deg, rgba(255,255,255,0.35) 0%, rgba(200,195,220,0.12) 100%)',
        transform: 'rotate(-18deg)', borderRadius: '50px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '-10%', left: '-5%',
        width: '40%', height: '55%',
        background: 'linear-gradient(135deg, rgba(200,195,220,0.1) 0%, rgba(255,255,255,0.25) 100%)',
        transform: 'rotate(22deg)', borderRadius: '40px',
        pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', top: '35%', left: '25%',
        width: '25%', height: '25%',
        background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      {/* Top bar */}
      <div style={{
        position: 'relative', zIndex: 10,
        height: '44px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px',
        background: 'rgba(255,255,255,0.5)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        borderBottom: '1px solid rgba(255,255,255,0.6)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
            <rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#0f172a' }}>Personal OS</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            style={topIconBtn}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
            </svg>
          </button>
          <button
            style={topIconBtn}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(0,0,0,0.05)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3"/>
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>
            </svg>
          </button>
          <div style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '4px 8px', borderRadius: '6px',
            background: 'rgba(255,255,255,0.7)',
            border: '1px solid rgba(255,255,255,0.9)',
            cursor: 'default',
            fontSize: '12px', fontWeight: 500, color: '#0f172a',
          }}>
            <div style={{
              width: '20px', height: '20px', borderRadius: '4px',
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
        alignItems: 'center', justifyContent: 'center',
        padding: '40px 20px',
      }}>
        <div className="desktop-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(6, 96px)',
          gap: '28px 16px',
          justifyContent: 'center',
        }}>
          {APPS.map((app) => (
            <button
              key={app.id}
              onClick={() => onLaunchApp(app.id)}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                cursor: 'pointer', background: 'none', border: 'none', padding: 0,
              }}
            >
              <div
                style={{
                  width: '64px', height: '64px',
                  background: '#ffffff',
                  borderRadius: '10px',
                  boxShadow: '0 2px 6px rgba(15,23,42,0.06)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '28px',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.1)';
                  const label = e.currentTarget.parentElement?.querySelector('.app-label') as HTMLElement;
                  if (label) label.style.color = '#2563eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 2px 6px rgba(15,23,42,0.06)';
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

      {/* Bottom status */}
      <div style={{
        position: 'relative', zIndex: 10,
        padding: '0 20px 16px',
        display: 'flex', justifyContent: 'center',
      }}>
        <span style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>
          Personal OS Desktop
        </span>
      </div>
    </div>
  );
};

const topIconBtn: React.CSSProperties = {
  width: '28px', height: '28px',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  borderRadius: '6px', background: 'transparent',
  border: 'none', cursor: 'pointer',
  transition: 'background 0.15s ease',
};

export default DesktopLauncher;
export type { AppId };
