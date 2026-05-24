import React from 'react';

type AppId = 'desktop' | 'crm' | 'messages' | 'strategy' | 'plans' | 'tasks' | 'projects' | 'finance' | 'documents' | 'social' | 'relationships' | 'life' | 'notes' | 'ai_control';

interface AppDefinition {
  id: AppId;
  icon: string;
  title: string;
  description: string;
}

const APPS: AppDefinition[] = [
  { id: 'crm', icon: '🏢', title: 'CRM', description: 'Companies, people, deals, and outreach pipeline.' },
  { id: 'messages', icon: '💬', title: 'Messages', description: 'Messages, templates, and outreach communication.' },
  { id: 'strategy', icon: '🎯', title: 'Strategy', description: 'Goals, tactics, experiments, and strategic decisions.' },
  { id: 'plans', icon: '📋', title: 'Plans', description: 'Yearly, monthly, weekly planning and execution structure.' },
  { id: 'tasks', icon: '✅', title: 'Tasks', description: 'Weekly tasks, daily recurring routines, and work logs.' },
  { id: 'projects', icon: '📂', title: 'Projects', description: 'Projects, workspaces, meetings, documents, and time logs.' },
  { id: 'finance', icon: '💰', title: 'Finance', description: 'Income, expenses, allocation, investments, and financial review.' },
  { id: 'documents', icon: '📄', title: 'Documents', description: 'Invoices, contracts, cahier de charges, PDFs, and archive.' },
  { id: 'social', icon: '📱', title: 'Social Media', description: 'Content strategy, ideas, weekly plan, calendar, and performance.' },
  { id: 'relationships', icon: '🤝', title: 'Relationships', description: 'Relationship categories, people dashboards, contact methods, and follow-ups.' },
  { id: 'life', icon: '🌿', title: 'Life', description: 'Nutrition, fitness, deen, family, and life review.' },
  { id: 'notes', icon: '📝', title: 'Notes', description: 'Smart notes, categories, blocks, attachments, and linked memory.' },
  { id: 'ai_control', icon: '🤖', title: 'AI Control', description: 'Providers, encrypted keys, use-case routing, and AI tests.' },
];

const DesktopLauncher: React.FC<{ onLaunchApp: (appId: AppId) => void }> = ({ onLaunchApp }) => {
  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '48px 24px' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '48px' }}>
          <h1 style={{
            fontSize: '28px', fontWeight: 700, color: '#0f172a',
            fontFamily: 'ui-monospace, SFMono-Regular, monospace', letterSpacing: '-0.02em', margin: 0
          }}>
            Personal OS
          </h1>
          <p style={{
            fontSize: '14px', color: '#64748b', marginTop: '8px',
            fontFamily: 'system-ui, -apple-system, sans-serif'
          }}>
            Choose an app to manage your work, money, content, relationships, and life.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
          gap: '16px',
        }}>
          {APPS.map((app) => (
            <button
              key={app.id}
              onClick={() => onLaunchApp(app.id)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: '10px',
                padding: '20px',
                background: '#ffffff',
                border: '1px solid #e5e7eb',
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                textAlign: 'left',
                boxShadow: '0 1px 3px rgba(15,23,42,0.04)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = '0 4px 14px rgba(15,23,42,0.08)';
                e.currentTarget.style.borderColor = '#2563eb';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = '0 1px 3px rgba(15,23,42,0.04)';
                e.currentTarget.style.borderColor = '#e5e7eb';
                e.currentTarget.style.transform = 'translateY(0)';
              }}
            >
              <span style={{ fontSize: '28px', lineHeight: 1 }}>{app.icon}</span>
              <span style={{
                fontSize: '15px', fontWeight: 600, color: '#0f172a',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {app.title}
              </span>
              <span style={{
                fontSize: '12px', color: '#64748b', lineHeight: '1.4',
                fontFamily: 'system-ui, -apple-system, sans-serif'
              }}>
                {app.description}
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
