import React from 'react';
import { ArrowLeft } from 'lucide-react';
import PersonalOSLogo from '../personal/PersonalOSLogo';

export interface SidebarItem {
  id: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  trailingAction?: React.ReactNode;
  isGroupLabel?: boolean;
}

interface AppDashboardShellProps {
  appName: string;
  appSubtitle?: string;
  sidebarItems: SidebarItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  onBackToDesktop: () => void;
  children: React.ReactNode;
}

const AppDashboardShell: React.FC<AppDashboardShellProps> = ({
  appName,
  sidebarItems,
  activeSection,
  onSectionChange,
  onBackToDesktop,
  children,
}) => {
  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left Sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-neutral-200 bg-white flex flex-col">
        {/* Brand header */}
        <div className="h-16 shrink-0 border-b border-neutral-200 bg-white flex items-center justify-between px-4">
          <div className="flex items-center gap-2.5">
            <PersonalOSLogo className="text-neutral-900" size={24} />
            <span className="text-sm font-semibold text-neutral-950">Personal OS</span>
          </div>
          <button
            type="button"
            onClick={onBackToDesktop}
            aria-label="Back to Desktop"
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            if (item.isGroupLabel) {
              return (
                <div
                  key={item.id}
                  className="px-3 pt-4 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400"
                >
                  {item.label}
                </div>
              );
            }
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <div
                key={item.id}
                className={'group flex items-center gap-1 rounded-lg text-sm transition-colors ' + (isActive ? 'bg-neutral-100 text-neutral-900 font-medium' : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900')}
              >
                <button
                  type="button"
                  onClick={() => onSectionChange(item.id)}
                  className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2 rounded-lg text-left"
                >
                  {Icon && <Icon className="h-4 w-4 shrink-0" />}
                  <span className="min-w-0 truncate">{item.label}</span>
                  {item.badge != null && (
                    <span className="ml-auto text-xs text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md tabular-nums">
                      {item.badge}
                    </span>
                  )}
                </button>
                {item.trailingAction ? <div className="pr-2">{item.trailingAction}</div> : null}
              </div>
            );
          })}
        </nav>
      </aside>

      {/* Right area: topbar + main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar — simple centered app name */}
        <header className="h-14 shrink-0 border-b border-neutral-200 bg-white flex items-center justify-center px-5">
          <span className="text-sm font-semibold text-neutral-900">{appName}</span>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppDashboardShell;
