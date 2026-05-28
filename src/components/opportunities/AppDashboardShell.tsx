import React from 'react';
import { ArrowLeft, Search } from 'lucide-react';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
}

interface AppDashboardShellProps {
  appName: string;
  appSubtitle?: string;
  sidebarItems: SidebarItem[];
  activeSection: string;
  onSectionChange: (id: string) => void;
  topActions?: React.ReactNode;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  showSearch?: boolean;
  onBackToDesktop: () => void;
  children: React.ReactNode;
}

const AppDashboardShell: React.FC<AppDashboardShellProps> = ({
  appName,
  appSubtitle,
  sidebarItems,
  activeSection,
  onSectionChange,
  topActions,
  searchValue,
  onSearchChange,
  searchPlaceholder,
  showSearch,
  onBackToDesktop,
  children,
}) => {
  return (
    <div className="min-h-screen bg-neutral-50 flex">
      {/* Left Sidebar */}
      <aside className="w-[220px] shrink-0 border-r border-neutral-200 bg-white flex flex-col">
        {/* App identity */}
        <div className="px-4 pt-4 pb-3 border-b border-neutral-100">
          <span className="text-xs font-medium text-neutral-400">Personal OS</span>
          <p className="text-sm font-semibold text-neutral-900 mt-0.5">{appName}</p>
          {appSubtitle && <p className="text-xs text-neutral-500 mt-0.5 leading-tight">{appSubtitle}</p>}
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSectionChange(item.id)}
                className={
                  'flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors text-left ' +
                  (isActive
                    ? 'bg-neutral-100 text-neutral-900 font-medium'
                    : 'text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900')
                }
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge != null && (
                  <span className="ml-auto text-xs text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md tabular-nums">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Footer - Back to Desktop */}
        <div className="p-2 border-t border-neutral-100">
          <button
            type="button"
            onClick={onBackToDesktop}
            className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to Desktop
          </button>
        </div>
      </aside>

      {/* Right area: topbar + main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar */}
        <header className="h-14 shrink-0 border-b border-neutral-200 bg-white flex items-center gap-4 px-5">
          {showSearch ? (
            <div className="flex items-center gap-2 flex-1 max-w-sm">
              <Search className="h-4 w-4 text-neutral-400 shrink-0" />
              <input
                type="text"
                value={searchValue || ''}
                onChange={(e) => onSearchChange?.(e.target.value)}
                placeholder={searchPlaceholder || 'Search...'}
                className="flex-1 text-sm bg-transparent border-none outline-none text-neutral-900 placeholder-neutral-400"
              />
            </div>
          ) : (
            <div className="flex-1" />
          )}
          {topActions ? (
            <div className="flex items-center gap-2 shrink-0">
              {topActions}
            </div>
          ) : null}
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
