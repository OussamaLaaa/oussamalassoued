import React from 'react';
import PageHeader from '../ui/PageHeader';
import Button from '../ui/Button';
import Tabs from '../ui/Tabs';
import type { TabDef } from '../ui/Tabs';

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
    <div className="min-h-screen bg-[var(--opp-bg,#f8fafc)]">
      <div className="sticky top-0 z-50 bg-white border-b border-neutral-200">
        <div className="max-w-[1400px] mx-auto px-6 pt-4">
          <PageHeader
            title={title}
            description={subtitle}
            backButton={
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToDesktop}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Desktop
              </Button>
            }
            actions={rightActions}
            className="mb-3"
          />

          {tabs && tabs.length > 0 && activeTab !== undefined && onTabChange && (
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              className="pb-3"
            />
          )}
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto p-6">
        {children}
      </div>
    </div>
  );
};

export default FullPageAppShell;
