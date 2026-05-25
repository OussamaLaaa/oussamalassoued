import React from 'react';

interface TabDef {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  style?: React.CSSProperties;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, style }) => (
  <div style={{
    display: 'flex', gap: '4px',
    overflowX: 'auto',
    ...style,
  }}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
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
);

export default Tabs;
export type { TabDef };
