import React from 'react';

interface TabDef {
  id: string;
  label: string;
}

interface FullPageAppShellProps {
  title: string;
  subtitle: string;
  onBackToDesktop: () => void;
  children: React.ReactNode;
  tabs?: TabDef[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
  rightActions?: React.ReactNode;
}

const FullPageAppShell: React.FC<FullPageAppShellProps> = ({
  title,
  subtitle,
  onBackToDesktop,
  children,
  tabs,
  activeTab,
  onTabChange,
  rightActions,
}) => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc' }}>
      <div style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
      }}>
        <div style={{
          maxWidth: '1400px', margin: '0 auto',
          padding: '16px 24px 0',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <button
                onClick={onBackToDesktop}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  padding: '6px 12px',
                  fontSize: '13px', fontWeight: 500,
                  color: '#64748b',
                  background: 'transparent',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#f8fafc';
                  e.currentTarget.style.color = '#0f172a';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#64748b';
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Desktop
              </button>
              <div>
                <h1 style={{
                  fontSize: '18px', fontWeight: 600, color: '#0f172a', margin: 0,
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  {title}
                </h1>
                <p style={{
                  fontSize: '12px', color: '#64748b', margin: '2px 0 0',
                  fontFamily: 'system-ui, -apple-system, sans-serif'
                }}>
                  {subtitle}
                </p>
              </div>
            </div>
            {rightActions && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {rightActions}
              </div>
            )}
          </div>

          {tabs && tabs.length > 0 && (
            <div style={{
              display: 'flex', gap: '4px',
              overflowX: 'auto',
              paddingBottom: '12px',
            }}>
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange?.(tab.id)}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px', fontWeight: 500,
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    background: activeTab === tab.id ? '#eff6ff' : 'transparent',
                    color: activeTab === tab.id ? '#1d4ed8' : '#64748b',
                    border: activeTab === tab.id ? '1px solid #bfdbfe' : '1px solid transparent',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = '#f8fafc';
                      e.currentTarget.style.color = '#0f172a';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== tab.id) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.color = '#64748b';
                    }
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div style={{
        maxWidth: '1400px', margin: '0 auto',
        padding: '24px',
      }}>
        {children}
      </div>
    </div>
  );
};

export default FullPageAppShell;
