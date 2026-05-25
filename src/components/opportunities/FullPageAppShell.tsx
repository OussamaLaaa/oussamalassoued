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
    <div style={{ minHeight: '100vh' }}>
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
          <PageHeader
            title={title}
            description={subtitle}
            backButton={
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToDesktop}
                style={{ gap: '4px' }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                Desktop
              </Button>
            }
            actions={rightActions}
            style={{ marginBottom: '12px' }}
          />

          {tabs && tabs.length > 0 && activeTab !== undefined && onTabChange && (
            <Tabs
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={onTabChange}
              style={{ paddingBottom: '12px' }}
            />
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
