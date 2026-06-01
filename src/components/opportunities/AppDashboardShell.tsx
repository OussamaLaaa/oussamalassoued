import React from 'react';
import { ArrowLeft } from 'lucide-react';
import PersonalOSLogo from '../personal/PersonalOSLogo';
import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';

export interface SidebarItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  trailingAction?: React.ReactNode;
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
  const { language, setLanguage, t } = usePersonalLanguage();

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
            aria-label={t("Back to Desktop")}
            title={t("Back to Desktop")}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-50 hover:text-neutral-900 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation items */}
        <nav className="flex-1 p-2 space-y-0.5 overflow-y-auto">
          {sidebarItems.map((item) => {
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
                  dir={language === 'ar' ? 'rtl' : 'ltr'}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="min-w-0 truncate text-start">{t(item.label)}</span>
                  {item.badge != null && (
                    <span className="ml-auto text-xs text-neutral-500 bg-neutral-100 px-1.5 py-0.5 rounded-md tabular-nums" dir="ltr">
                      {item.badge}
                    </span>
                  )}
                </button>
                {item.trailingAction ? <div className="pr-2">{item.trailingAction}</div> : null}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer with Language Switcher */}
        <div className="p-4 border-t border-neutral-200 bg-white">
          <div className="flex bg-white rounded-lg p-0.5 gap-1 border border-neutral-200">
            <button
              onClick={() => setLanguage('en')}
              className={`flex-1 flex items-center justify-center h-8 text-xs font-medium rounded-md transition-colors ${language === 'en' ? 'bg-black text-white' : 'bg-transparent text-neutral-600 hover:text-neutral-900'}`}
            >
              EN
            </button>
            <button
              onClick={() => setLanguage('ar')}
              className={`flex-1 flex items-center justify-center h-8 text-xs font-medium rounded-md transition-colors ${language === 'ar' ? 'bg-black text-white' : 'bg-transparent text-neutral-600 hover:text-neutral-900'}`}
            >
              AR
            </button>
          </div>
        </div>
      </aside>

      {/* Right area: topbar + main content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Topbar — simple centered app name */}
        <header className="h-14 shrink-0 border-b border-neutral-200 bg-white flex items-center justify-center px-5">
          <span className="text-sm font-semibold text-neutral-900">{t(appName)}</span>
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
