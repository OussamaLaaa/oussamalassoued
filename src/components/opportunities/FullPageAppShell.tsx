import React from 'react';
import { ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';
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
 searchValue?: string;
 onSearchChange?: (value: string) => void;
 searchPlaceholder?: string;
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
 searchValue,
 onSearchChange,
 searchPlaceholder,
}) => {
  if (title === 'CRM') {
  return (
  <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
  <header className="border-b border-neutral-200 bg-white">
  <div className="mx-auto max-w-[1400px] px-6">
  {/* Layer 1 — Utility row */}
  <div className="flex items-center justify-between py-3">
  <Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={onBackToDesktop}
  className="h-7 px-1.5 text-xs text-neutral-400 hover:text-neutral-900"
  >
  <ArrowLeft className="h-3 w-3" />
  Desktop
  </Button>
  </div>

  {/* Layer 2 — Title + Primary Actions */}
  <div className="flex flex-col gap-4 pb-5 md:flex-row md:items-start md:justify-between md:gap-6">
  <div className="min-w-0">
  <h1 className="text-xl font-semibold tracking-tight text-neutral-900 md:text-2xl">CRM</h1>
  <p className="mt-0.5 text-sm text-neutral-500">Companies, people, deals, and outreach pipeline.</p>
  </div>
  {rightActions ? (
  <div className="flex flex-wrap items-center gap-2">
  {rightActions}
  </div>
  ) : null}
  </div>

  {/* Layer 3 — Section Navigation / Tabs */}
  {tabs && tabs.length > 0 && activeTab !== undefined && onTabChange ? (
  <div className="overflow-x-auto -mx-6 px-6">
  <nav className="flex min-w-max items-end gap-5 border-b border-neutral-200">
  {tabs.map((tab) => {
  const isActive = activeTab === tab.id;
  return (
  <button
  key={tab.id}
  type="button"
  onClick={() => onTabChange(tab.id)}
  className={
  'relative flex-shrink-0 pb-2.5 text-sm transition-colors ' +
  (isActive
  ? 'text-neutral-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-neutral-900'
  : 'text-neutral-500 hover:text-neutral-900')
  }
  >
  {tab.label}
  </button>
  );
  })}
  </nav>
  </div>
  ) : null}

  </div>
  </header>

  <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
  </div>
  );
  }

  // ── Standardized 3-layer app shell for all non-CRM apps ──
  const appShellConfig: Record<string, { title: string; subtitle: string }> = {
  Messages: { title: 'Messages', subtitle: 'Messages, templates, and outreach communication.' },
  Strategy: { title: 'Strategy', subtitle: 'Goals, tactics, experiments, and strategic decisions.' },
  Plans: { title: 'Plans', subtitle: 'Yearly, monthly, weekly planning and execution structure.' },
  Projects: { title: 'Projects', subtitle: 'Projects, workspaces, meetings, documents, and time logs.' },
  Tasks: { title: 'Tasks', subtitle: 'Weekly tasks, daily recurring routines, and work logs.' },
  Finance: { title: 'Finance', subtitle: 'Income, expenses, allocation, investments, and financial review.' },
  Notes: { title: 'Notes', subtitle: 'Smart notes, categories, blocks, attachments, and linked memory.' },
  Relationships: { title: 'Relationships', subtitle: 'People, categories, follow-ups, and relationship management.' },
  'Social Media': { title: 'Social Media', subtitle: 'Content strategy, ideas, weekly plan, calendar, and performance.' },
  Life: { title: 'Life', subtitle: 'Nutrition, fitness, deen, family, and weekly life review.' },
  Documents: { title: 'Documents', subtitle: 'Invoices, contracts, cahier de charges, PDFs, and archive.' },
  };

  const shellConfig = appShellConfig[title];
  if (shellConfig) {
  return (
  <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
  <header className="border-b border-neutral-200 bg-white">
  <div className="mx-auto max-w-[1400px] px-6">
  {/* Layer 1 — Utility row */}
  <div className="flex items-center justify-between py-3">
  <Button
  type="button"
  variant="ghost"
  size="sm"
  onClick={onBackToDesktop}
  className="h-7 px-1.5 text-xs text-neutral-400 hover:text-neutral-900"
  >
  <ArrowLeft className="h-3 w-3" />
  Desktop
  </Button>
  </div>

  {/* Layer 2 — Title + Primary Actions */}
  <div className="flex flex-col gap-4 pb-5 md:flex-row md:items-start md:justify-between md:gap-6">
  <div className="min-w-0">
  <h1 className="text-xl font-semibold tracking-tight text-neutral-900 md:text-2xl">{shellConfig.title}</h1>
  <p className="mt-0.5 text-sm text-neutral-500">{shellConfig.subtitle}</p>
  </div>
  {rightActions ? (
  <div className="flex flex-wrap items-center gap-2">{rightActions}</div>
  ) : null}
  </div>

  {/* Layer 3 — Section Navigation / Tabs */}
  {tabs && tabs.length > 0 && activeTab !== undefined && onTabChange ? (
  <div className="overflow-x-auto -mx-6 px-6">
  <nav className="flex min-w-max items-end gap-5 border-b border-neutral-200">
  {tabs.map((tab) => {
  const isActive = activeTab === tab.id;
  return (
  <button
  key={tab.id}
  type="button"
  onClick={() => onTabChange(tab.id)}
  className={
  'relative flex-shrink-0 pb-2.5 text-sm transition-colors ' +
  (isActive
  ? 'text-neutral-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-neutral-900'
  : 'text-neutral-500 hover:text-neutral-900')
  }
  >
  {tab.label}
  </button>
  );
  })}
  </nav>
  </div>
  ) : null}
  </div>
  </header>

  <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
  </div>
  );
  }



 return (
  <div className="min-h-screen bg-neutral-50 text-neutral-900">
  <header className="border-b border-neutral-200 bg-white">
  <div className="mx-auto max-w-[1400px] px-6">
  <div className="flex items-center justify-between py-3">
  <Button variant="ghost" size="sm" onClick={onBackToDesktop} className="h-7 px-1.5 text-xs text-neutral-400 hover:text-neutral-900">
  <ArrowLeft className="h-3 w-3" />
  Desktop
  </Button>
  </div>
  <div className="flex flex-col gap-4 pb-5 md:flex-row md:items-start md:justify-between md:gap-6">
  <div className="min-w-0">
  <h1 className="text-xl font-semibold tracking-tight text-neutral-900 md:text-2xl">{title}</h1>
  {subtitle && <p className="mt-0.5 text-sm text-neutral-500">{subtitle}</p>}
  </div>
  {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
  </div>
  {tabs && tabs.length > 0 && activeTab !== undefined && onTabChange ? (
  <div className="overflow-x-auto -mx-6 px-6">
  <nav className="flex min-w-max items-end gap-5 border-b border-neutral-200">
  {tabs.map((tab) => {
  const isActive = activeTab === tab.id;
  return (
  <button
  key={tab.id}
  type="button"
  onClick={() => onTabChange(tab.id)}
  className={
  'relative flex-shrink-0 pb-2.5 text-sm transition-colors ' +
  (isActive
  ? 'text-neutral-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-[1.5px] after:bg-neutral-900'
  : 'text-neutral-500 hover:text-neutral-900')
  }
  >
  {tab.label}
  </button>
  );
  })}
  </nav>
  </div>
  ) : null}
  </div>
  </header>
  <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
  </div>
  );
};

export default FullPageAppShell;
