import React from 'react';

interface TabDef {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  className?: string;
}

const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onTabChange, className = '' }) => (
  <div className={`flex gap-1 overflow-x-auto ${className}`}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-all duration-150
          ${
            activeTab === tab.id
              ? 'bg-neutral-100 text-black border border-neutral-200'
              : 'bg-transparent text-neutral-500 border border-transparent hover:bg-neutral-50 hover:text-black'
          }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default Tabs;
export type { TabDef };
