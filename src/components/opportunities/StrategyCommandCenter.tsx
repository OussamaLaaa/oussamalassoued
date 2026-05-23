import React from 'react';

const PanelCard: React.FC<{ title: string; value: string | number; accent?: string }> = ({ title, value, accent = 'text-[#0f172a]' }) => (
  <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
    <div className="text-[11px] font-mono uppercase tracking-[0.1em] text-[#64748b]">{title}</div>
    <div className={`mt-1.5 text-2xl font-semibold ${accent}`}>{value}</div>
  </div>
);

type QuickAction = {
  label: string;
  onClick: () => void;
};

const CommandCenter: React.FC<{
  strategyGoalsCount: number;
  strategyPlansCount: number;
  strategyTacticsCount: number;
  strategyExperimentsCount: number;
  strategyDecisionsCount: number;
  activeGoalsCount: number;
  activePlansCount: number;
  runningExperimentsCount: number;
  decisionsToReviewCount: number;
  highPriorityItemsCount: number;
  averageProgress: number;
  completedExperimentsCount: number;
  failedExperimentsCount: number;
  quickActions: QuickAction[];
}> = ({
  activeGoalsCount,
  activePlansCount,
  runningExperimentsCount,
  decisionsToReviewCount,
  highPriorityItemsCount,
  averageProgress,
  completedExperimentsCount,
  failedExperimentsCount,
  quickActions,
}) => (
  <div className="space-y-4">
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
      <PanelCard title="Active Goals" value={activeGoalsCount} />
      <PanelCard title="Active Plans" value={activePlansCount} />
      <PanelCard title="Running Experiments" value={runningExperimentsCount} />
      <PanelCard title="Decisions to Review" value={decisionsToReviewCount} accent="text-[#9a3412]" />
      <PanelCard title="High Priority Items" value={highPriorityItemsCount} accent="text-[#991b1b]" />
      <PanelCard title="Average Progress" value={`${averageProgress}%`} accent="text-[#1e3a8a]" />
    </div>

    <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
      <div className="rounded-xl border border-[#e2e8f0] bg-gradient-to-br from-[#f8fafc] to-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#2563eb]/10 text-xs text-[#2563eb]">G</span>
          Goal Coverage
        </div>
        <div className="mt-2 space-y-1 text-sm text-[#475569]">
          <div className="flex justify-between"><span>Goals</span><span className="font-medium text-[#0f172a]">{activeGoalsCount} active</span></div>
          <div className="flex justify-between"><span>Plans</span><span className="font-medium text-[#0f172a]">{activePlansCount} active</span></div>
          <div className="flex justify-between"><span>Tactics</span><span className="font-medium text-[#0f172a]">{runningExperimentsCount > 0 ? 'active' : 'set up'}</span></div>
        </div>
      </div>
      <div className="rounded-xl border border-[#e2e8f0] bg-gradient-to-br from-[#f8fafc] to-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#7c3aed]/10 text-xs text-[#7c3aed]">E</span>
          Experiment Engine
        </div>
        <div className="mt-2 space-y-1 text-sm text-[#475569]">
          <div className="flex justify-between"><span>Running</span><span className="font-medium text-[#0f172a]">{runningExperimentsCount}</span></div>
          <div className="flex justify-between"><span>Completed</span><span className="font-medium text-[#0f172a]">{completedExperimentsCount}</span></div>
          <div className="flex justify-between"><span>Failed</span><span className="font-medium text-[#0f172a]">{failedExperimentsCount}</span></div>
        </div>
      </div>
      <div className="rounded-xl border border-[#e2e8f0] bg-gradient-to-br from-[#f8fafc] to-white p-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#0f172a]">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#059669]/10 text-xs text-[#059669]">D</span>
          Decision Quality
        </div>
        <div className="mt-2 space-y-1 text-sm text-[#475569]">
          <div className="flex justify-between"><span>Due Reviews</span><span className="font-medium text-[#0f172a]">{decisionsToReviewCount}</span></div>
          <div className="flex justify-between"><span>Average Progress</span><span className="font-medium text-[#0f172a]">{averageProgress}%</span></div>
        </div>
      </div>
    </div>

    <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
      <h5 className="text-sm font-semibold text-[#0f172a]">Quick Actions</h5>
      <div className="mt-3 flex flex-wrap gap-2">
        {quickActions.map((action) => (
          <button
            key={action.label}
            type="button"
            onClick={action.onClick}
            className="rounded-lg border border-[#cbd5e1] bg-white px-3.5 py-2 text-sm font-medium text-[#334155] transition-all hover:border-[#2563eb] hover:text-[#2563eb] hover:shadow-sm active:scale-[0.97]"
          >
            {action.label}
          </button>
        ))}
      </div>
    </div>
  </div>
);

export default CommandCenter;
