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
          <div className="mx-auto max-w-[1400px] px-4 py-5 md:px-8 md:py-6">
            <div className="flex flex-col gap-5">
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onBackToDesktop}
                  className="h-9 px-2 text-neutral-500 hover:text-neutral-900"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back to Desktop
                </Button>
              </div>

              <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 md:text-[28px]">CRM</h1>
                  <p className="mt-1.5 text-sm leading-6 text-neutral-500">Companies, people, deals, and outreach pipeline.</p>
                </div>

                {rightActions ? (
                  <div className="flex flex-wrap items-center gap-2 md:justify-end md:self-start">
                    {rightActions}
                  </div>
                ) : null}
              </div>

              {tabs && tabs.length > 0 && activeTab !== undefined && onTabChange ? (
                <div className="overflow-x-auto -mx-4 px-4 md:-mx-8 md:px-8">
                  <nav className="flex min-w-max items-end gap-7 border-b border-neutral-200">
                    {tabs.map((tab) => {
                      const isActive = activeTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => onTabChange(tab.id)}
                          className={
                            'relative flex-shrink-0 border-b-2 px-0 pb-3.5 pt-0 text-sm transition-colors ' +
                            (isActive
                              ? 'border-neutral-900 text-neutral-900'
                              : 'border-transparent text-neutral-500 hover:text-neutral-900')
                          }
                        >
                          {tab.label}
                        </button>
                      );
                    })}
                  </nav>
                </div>
              ) : null}

              <div className="pt-1">
                <div className="relative w-full max-w-xl">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
                    aria-hidden="true"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    type="text"
                    value={searchValue ?? ''}
                    onChange={(event) => onSearchChange?.(event.target.value)}
                    placeholder={searchPlaceholder ?? 'Search companies, people, deals...'}
                    className="h-10 w-full rounded-lg border border-neutral-200 bg-white pl-9 pr-10 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400"
                  />
                  {searchValue ? (
                    <button
                      type="button"
                      onClick={() => onSearchChange?.('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-xs text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                    >
                      Clear
                    </button>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

  if (title === 'Messages') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onBackToDesktop}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Desktop
            </button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Messages</h1>
                <p className="mt-1 text-sm text-neutral-500">Messages, templates, and outreach communication.</p>
              </div>

              {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
            </div>

            {tabs && tabs.length > 0 && activeTab !== undefined && onTabChange ? (
              <nav className="flex flex-wrap gap-1 -mb-px">
                {tabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onTabChange(tab.id)}
                      className={
                        'relative px-3 py-2.5 border-b-2 text-sm transition-colors ' +
                        (isActive
                          ? 'border-neutral-900 text-neutral-900'
                          : 'border-transparent text-neutral-500 hover:text-neutral-900')
                      }
                    >
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            ) : null}
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

  if (title === 'Strategy') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onBackToDesktop}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Desktop
            </button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Strategy</h1>
                <p className="mt-1 text-sm text-neutral-500">Goals, tactics, experiments, and strategic decisions.</p>
              </div>

              {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

  if (title === 'Plans') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onBackToDesktop}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Desktop
            </button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Plans</h1>
                <p className="mt-1 text-sm text-neutral-500">Yearly, monthly, weekly planning and execution structure.</p>
              </div>

              {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

  if (title === 'Projects') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onBackToDesktop}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Desktop
            </button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Projects</h1>
                <p className="mt-1 text-sm text-neutral-500">Projects, workspaces, meetings, documents, and time logs.</p>
              </div>

              {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

  if (title === 'Tasks') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onBackToDesktop}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Desktop
            </button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Tasks</h1>
                <p className="mt-1 text-sm text-neutral-500">Weekly tasks, daily recurring routines, and work logs.</p>
              </div>

              {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

  if (title === 'Finance') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onBackToDesktop}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Desktop
            </button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Finance</h1>
                <p className="mt-1 text-sm text-neutral-500">Income, expenses, allocation, investments, and financial review.</p>
              </div>

              {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

  if (title === 'Notes') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onBackToDesktop}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Desktop
            </button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Notes</h1>
                <p className="mt-1 text-sm text-neutral-500">Smart notes, categories, blocks, attachments, and linked memory.</p>
              </div>

              {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

  if (title === 'Relationships') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onBackToDesktop}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Desktop
            </button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Relationships</h1>
                <p className="mt-1 text-sm text-neutral-500">People, categories, follow-ups, and relationship management.</p>
              </div>

              {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

  if (title === 'Social Media') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onBackToDesktop}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Desktop
            </button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Social Media</h1>
                <p className="mt-1 text-sm text-neutral-500">Content strategy, ideas, weekly plan, calendar, and performance.</p>
              </div>

              {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

  if (title === 'Life') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onBackToDesktop}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Desktop
            </button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Life</h1>
                <p className="mt-1 text-sm text-neutral-500">Nutrition, fitness, deen, family, and weekly life review.</p>
              </div>

              {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

  if (title === 'Documents') {
    return (
      <div className="min-h-screen w-full overflow-x-hidden bg-neutral-50 text-neutral-900">
        <header className="border-b border-neutral-200 bg-white">
          <div className="mx-auto max-w-[1400px] px-6 pt-5 pb-4">
            <button
              type="button"
              onClick={onBackToDesktop}
              className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Back to Desktop
            </button>

            <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">Documents</h1>
                <p className="mt-1 text-sm text-neutral-500">Invoices, contracts, cahier de charges, PDFs, and archive.</p>
              </div>

              {rightActions ? <div className="flex flex-wrap items-center gap-2">{rightActions}</div> : null}
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1400px] px-6 py-6">{children}</main>
      </div>
    );
  }

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
