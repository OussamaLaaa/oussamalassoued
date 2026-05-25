import React, { useMemo, useState } from 'react';
import type { SocialPlatform, ContentPillar, ContentStrategy, ContentItem, WeeklyContentPlan, Project, SmartNote, Company, SocialPlatformInput, ContentPillarInput, ContentStrategyInput, ContentItemInput, WeeklyContentPlanInput } from '../../types/opportunities';
import AISocialMediaAssistantPanel from './AISocialMediaAssistantPanel';

const SOCIAL_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'strategy', label: 'Strategy' },
  { id: 'platforms', label: 'Platforms' },
  { id: 'pillars', label: 'Pillars' },
  { id: 'ideas', label: 'Ideas' },
  { id: 'weekly', label: 'Weekly Plan' },
  { id: 'production', label: 'Production Board' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'performance', label: 'Performance' },
  { id: 'ai-assistant', label: 'AI Assistant' },
] as const;

const CONTENT_TYPES = ['text_post', 'video', 'short_video', 'carousel', 'thread', 'story', 'reel', 'case_study', 'newsletter', 'image_post', 'poll', 'live', 'other'] as const;
const CONTENT_STATUSES = ['idea', 'drafted', 'designing', 'recording', 'editing', 'ready', 'scheduled', 'published', 'repurpose', 'archived'] as const;
const PRIORITIES = ['high', 'medium', 'low'] as const;

const DEFAULT_PLATFORMS: Array<{ name: string; slug: string }> = [
  { name: 'LinkedIn', slug: 'linkedin' },
  { name: 'X', slug: 'x' },
  { name: 'Instagram', slug: 'instagram' },
  { name: 'TikTok', slug: 'tiktok' },
  { name: 'YouTube', slug: 'youtube' },
  { name: 'Facebook', slug: 'facebook' },
  { name: 'Newsletter', slug: 'newsletter' },
  { name: 'Blog', slug: 'blog' },
  { name: 'Other', slug: 'other' },
];

const STARTER_PILLARS: Array<{ name: string; slug: string; description: string }> = [
  { name: 'UX Education', slug: 'ux-education', description: 'Teach UX principles and best practices' },
  { name: 'Case Studies', slug: 'case-studies', description: 'Detailed project breakdowns' },
  { name: 'Personal Building Journey', slug: 'personal-building-journey', description: 'Building in public' },
  { name: 'Freelance Lessons', slug: 'freelance-lessons', description: 'Tips and lessons from freelancing' },
  { name: 'Design Teardowns', slug: 'design-teardowns', description: 'Critique and analyze designs' },
  { name: 'Tools / Process', slug: 'tools-process', description: 'Tools, workflows and processes' },
  { name: 'Ethical Work Principles', slug: 'ethical-work-principles', description: 'Ethics in design and business' },
];

const WEEK_START = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d.toISOString().slice(0, 10);
};

const addWeeks = (date: string, weeks: number) => {
  const d = new Date(date);
  d.setDate(d.getDate() + weeks * 7);
  return d.toISOString().slice(0, 10);
};

const formatDate = (date?: string) => {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const statusBadge = (status: string) => {
  const value = status.toLowerCase();
  if (['published', 'ready'].includes(value)) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (['scheduled'].includes(value)) return 'border-neutral-200 bg-neutral-50 text-neutral-600';
  if (['editing'].includes(value)) return 'border-amber-200 bg-amber-50 text-amber-700';
  if (['archived'].includes(value)) return 'border-red-200 bg-red-50 text-red-700';
  return 'border-neutral-200 bg-neutral-50 text-neutral-600';
};

const priorityBadge = (priority: string) => {
  const value = priority.toLowerCase();
  if (value === 'high') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (value === 'medium') return 'border-neutral-200 bg-neutral-50 text-neutral-600';
  return 'border-neutral-200 bg-neutral-50 text-neutral-500';
};

const isActiveBadge = (isActive: boolean) =>
  isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-neutral-200 bg-neutral-50 text-neutral-500';

interface SocialMediaPanelProps {
  socialPlatforms: SocialPlatform[];
  contentPillars: ContentPillar[];
  contentStrategies: ContentStrategy[];
  contentItems: ContentItem[];
  weeklyContentPlans: WeeklyContentPlan[];
  projects: Project[];
  smartNotes: SmartNote[];
  companies: Company[];
  onAddSocialPlatform: (input: SocialPlatformInput) => Promise<SocialPlatform>;
  onUpdateSocialPlatform: (id: string, input: Partial<SocialPlatformInput>) => Promise<SocialPlatform>;
  onDeleteSocialPlatform: (id: string) => Promise<void>;
  onAddContentPillar: (input: ContentPillarInput) => Promise<ContentPillar>;
  onUpdateContentPillar: (id: string, input: Partial<ContentPillarInput>) => Promise<ContentPillar>;
  onDeleteContentPillar: (id: string) => Promise<void>;
  onAddContentStrategy: (input: ContentStrategyInput) => Promise<ContentStrategy>;
  onUpdateContentStrategy: (id: string, input: Partial<ContentStrategyInput>) => Promise<ContentStrategy>;
  onDeleteContentStrategy: (id: string) => Promise<void>;
  onAddContentItem: (input: ContentItemInput) => Promise<ContentItem>;
  onUpdateContentItem: (id: string, input: Partial<ContentItemInput>) => Promise<ContentItem>;
  onDeleteContentItem: (id: string) => Promise<void>;
  onAddWeeklyContentPlan: (input: WeeklyContentPlanInput) => Promise<WeeklyContentPlan>;
  onUpdateWeeklyContentPlan: (id: string, input: Partial<WeeklyContentPlanInput>) => Promise<WeeklyContentPlan>;
  onDeleteWeeklyContentPlan: (id: string) => Promise<void>;
}

export default function SocialMediaPanel(props: SocialMediaPanelProps) {
  const [activeTab, setActiveTab] = useState<typeof SOCIAL_TABS[number]['id']>('dashboard');
  const [selectedWeek, setSelectedWeek] = useState(() => WEEK_START(new Date()));
  const now = new Date();
  const currentWeek = WEEK_START(now);
  const todayStr = now.toISOString().slice(0, 10);

  // ── Dashboard ──

  const thisWeekItems = useMemo(() => props.contentItems.filter((item) => item.weekStart === currentWeek), [props.contentItems, currentWeek]);
  const publishedThisWeek = useMemo(() => thisWeekItems.filter((item) => item.status === 'published'), [thisWeekItems]);
  const scheduledItems = useMemo(() => props.contentItems.filter((item) => item.status === 'scheduled'), [props.contentItems]);
  const ideasCount = useMemo(() => props.contentItems.filter((item) => item.status === 'idea').length, [props.contentItems]);
  const inProduction = useMemo(() => props.contentItems.filter((item) => ['drafted', 'designing', 'recording', 'editing'].includes(item.status)).length, [props.contentItems]);
  const readyToPublish = useMemo(() => props.contentItems.filter((item) => item.status === 'ready').length, [props.contentItems]);
  const totalLeads = useMemo(() => props.contentItems.reduce((sum, item) => sum + (item.leadsGenerated || 0), 0), [props.contentItems]);
  const totalViews = useMemo(() => props.contentItems.reduce((sum, item) => sum + (item.performanceViews || 0), 0), [props.contentItems]);
  const plan = useMemo(() => props.weeklyContentPlans.find((p) => p.weekStart === currentWeek), [props.weeklyContentPlans, currentWeek]);
  const activeStrategy = props.contentStrategies[0];
  const recentIdeas = useMemo(() => props.contentItems.filter((item) => item.status === 'idea').slice(0, 5), [props.contentItems]);
  const readyScheduled = useMemo(() => props.contentItems.filter((item) => item.status === 'ready' || item.status === 'scheduled').slice(0, 5), [props.contentItems]);

  const renderTabs = () => (
    <div className="border-b border-neutral-200">
      <div className="flex flex-wrap gap-1 overflow-x-auto">
        {SOCIAL_TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={
                'relative px-3 pb-3 pt-2 text-sm whitespace-nowrap transition-colors border-b-2 ' +
                (isActive
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-900')
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderDashboard = () => {
    const metricCards = [
      { label: 'Planned This Week', value: thisWeekItems.length },
      { label: 'Published This Week', value: publishedThisWeek.length },
      { label: 'Ideas Bank', value: ideasCount },
      { label: 'In Production', value: inProduction },
      { label: 'Ready to Publish', value: readyToPublish },
      { label: 'Scheduled', value: scheduledItems.length },
      { label: 'Leads Generated', value: totalLeads },
      { label: 'Total Views', value: totalViews.toLocaleString() },
    ];

    return (
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-7">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {metricCards.map((card) => (
              <div key={card.label} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="text-2xl font-semibold text-neutral-900">{card.value}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">{card.label}</div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">This Week Plan</h3>
                <p className="mt-0.5 text-xs text-neutral-500">Week of {formatDate(currentWeek)}</p>
              </div>
              <button type="button" onClick={() => setActiveTab('weekly')} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">View Week</button>
            </div>
            {plan ? (
              <div className="mt-3 space-y-2 text-sm text-neutral-700">
                {plan.focus && <div className="rounded-md bg-neutral-50 p-3"><span className="font-medium text-neutral-900">Focus:</span> {plan.focus}</div>}
                <div className="flex flex-wrap gap-3 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
                  <span>Posts: {plan.targetPosts ?? '—'}</span>
                  <span>Videos: {plan.targetVideos ?? '—'}</span>
                  <span>Carousels: {plan.targetCarousels ?? '—'}</span>
                  <span>Other: {plan.targetOther ?? '—'}</span>
                </div>
                {plan.reviewNotes && <div className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">Review: {plan.reviewNotes}</div>}
              </div>
            ) : (
              <div className="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 text-center">No plan for this week yet.</div>
            )}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-neutral-900">Content Pipeline</h3>
              <p className="mt-0.5 text-xs text-neutral-500">{inProduction} items in production</p>
              <div className="mt-3 space-y-2">
                {inProduction === 0 ? (
                  <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 text-center">No items in production.</div>
                ) : (
                  props.contentItems.filter((item) => ['drafted', 'designing', 'recording', 'editing'].includes(item.status)).slice(0, 5).map((item) => (
                    <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-neutral-900 truncate">{item.title}</div>
                        <div className="text-xs text-neutral-500">{item.status} · {item.type}</div>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${statusBadge(item.status)}`}>{item.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-neutral-900">Ready / Scheduled</h3>
              <p className="mt-0.5 text-xs text-neutral-500">{readyScheduled.length} items ready to go</p>
              <div className="mt-3 space-y-2">
                {readyScheduled.length === 0 ? (
                  <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 text-center">No ready or scheduled items.</div>
                ) : (
                  readyScheduled.map((item) => (
                    <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-neutral-900 truncate">{item.title}</div>
                        <div className="text-xs text-neutral-500">{item.platformName || 'No platform'} · {item.publishDate ? formatDate(item.publishDate) : 'No date'}</div>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${statusBadge(item.status)}`}>{item.status}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900">Recent Ideas</h3>
                  <p className="mt-0.5 text-xs text-neutral-500">{ideasCount} total ideas</p>
                </div>
                <button type="button" onClick={() => setActiveTab('ideas')} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">View All</button>
              </div>
              <div className="mt-3 space-y-2">
                {recentIdeas.length === 0 ? (
                  <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 text-center">No ideas yet.</div>
                ) : (
                  recentIdeas.map((item) => (
                    <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium text-neutral-900 truncate">{item.title}</div>
                        <div className="text-xs text-neutral-500">{item.type}{item.pillarName ? ` · ${item.pillarName}` : ''}</div>
                      </div>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${priorityBadge(item.priority)}`}>{item.priority}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-neutral-900">Performance Snapshot</h3>
              <p className="mt-0.5 text-xs text-neutral-500">Lifetime aggregate metrics</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-md bg-neutral-50 p-3">
                  <div className="text-lg font-semibold text-neutral-900">{totalViews.toLocaleString()}</div>
                  <div className="text-xs text-neutral-500">Views</div>
                </div>
                <div className="rounded-md bg-neutral-50 p-3">
                  <div className="text-lg font-semibold text-neutral-900">{totalLeads.toLocaleString()}</div>
                  <div className="text-xs text-neutral-500">Leads</div>
                </div>
              </div>
              <button type="button" onClick={() => setActiveTab('performance')} className="mt-3 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">Full Performance</button>
            </div>
          </div>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-4 xl:h-fit">
          {activeStrategy && (
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Active Strategy</h3>
              <div className="mt-2 space-y-2 text-sm">
                <div className="font-medium text-neutral-900">{activeStrategy.name}</div>
                {activeStrategy.positioning && <div className="text-xs text-neutral-500">{activeStrategy.positioning}</div>}
                {activeStrategy.weeklyPostTarget != null && <div className="rounded-md bg-neutral-50 p-2 text-xs text-neutral-600">Target: {activeStrategy.weeklyPostTarget} posts/week</div>}
              </div>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Weekly Targets</h3>
            <div className="mt-2 space-y-2">
              {plan ? (
                <>
                  <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Posts:</span> <span className="text-neutral-600">{plan.targetPosts ?? '—'}</span></div>
                  <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Videos:</span> <span className="text-neutral-600">{plan.targetVideos ?? '—'}</span></div>
                  <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Carousels:</span> <span className="text-neutral-600">{plan.targetCarousels ?? '—'}</span></div>
                  <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Other:</span> <span className="text-neutral-600">{plan.targetOther ?? '—'}</span></div>
                </>
              ) : (
                <div className="rounded-md bg-neutral-50 p-2 text-xs text-neutral-500">No targets set</div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Quick Stats</h3>
            <div className="mt-2 space-y-2">
              <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Platforms:</span> <span className="text-neutral-600">{props.socialPlatforms.length}</span></div>
              <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Pillars:</span> <span className="text-neutral-600">{props.contentPillars.length}</span></div>
              <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Total Content:</span> <span className="text-neutral-600">{props.contentItems.length}</span></div>
              <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Published:</span> <span className="text-neutral-600">{props.contentItems.filter((i) => i.status === 'published').length}</span></div>
            </div>
          </div>
        </aside>
      </div>
    );
  };

  // ── Strategy Section ──

  const renderStrategy = () => {
    const [editing, setEditing] = useState<{ id?: string; data?: Partial<ContentStrategyInput> } | null>(null);
    const handleSave = async (input: ContentStrategyInput) => {
      if (editing?.id) { await props.onUpdateContentStrategy(editing.id, input); }
      else { await props.onAddContentStrategy(input); }
      setEditing(null);
    };
    if (editing) {
      return <ContentStrategyForm initial={editing.data} onSave={handleSave} onCancel={() => setEditing(null)} />;
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Content Strategy</h3>
            <p className="mt-0.5 text-xs text-neutral-500">Define your audience, positioning, and weekly targets.</p>
          </div>
          {props.contentStrategies.length === 0 && (
            <button type="button" onClick={() => setEditing({})} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">Add Strategy</button>
          )}
        </div>
        {props.contentStrategies.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500 text-center">No content strategy yet. Define your audience, positioning, and weekly targets.</div>
        ) : (
          <div className="space-y-3">
            {props.contentStrategies.map((strategy) => (
              <div key={strategy.id} className="rounded-xl border border-neutral-200 bg-white p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-lg font-semibold text-neutral-900">{strategy.name}</div>
                    <div className="mt-2 grid gap-2 text-sm text-neutral-700 md:grid-cols-2">
                      {strategy.targetAudience && <div className="rounded-md bg-neutral-50 p-3"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Audience</div><div className="mt-1">{strategy.targetAudience}</div></div>}
                      {strategy.positioning && <div className="rounded-md bg-neutral-50 p-3"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Positioning</div><div className="mt-1">{strategy.positioning}</div></div>}
                      {strategy.mainPromise && <div className="rounded-md bg-neutral-50 p-3"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Promise</div><div className="mt-1">{strategy.mainPromise}</div></div>}
                      {strategy.tone && <div className="rounded-md bg-neutral-50 p-3"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Tone</div><div className="mt-1">{strategy.tone}</div></div>}
                      {strategy.languages && <div className="rounded-md bg-neutral-50 p-3"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Languages</div><div className="mt-1">{strategy.languages}</div></div>}
                      {strategy.activePlatforms && <div className="rounded-md bg-neutral-50 p-3"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Platforms</div><div className="mt-1">{strategy.activePlatforms}</div></div>}
                      <div className="rounded-md bg-neutral-50 p-3"><div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Weekly Targets</div><div className="mt-1">{strategy.weeklyPostTarget != null ? `${strategy.weeklyPostTarget} posts` : '—'}{strategy.weeklyVideoTarget != null ? ` · ${strategy.weeklyVideoTarget} videos` : ''}</div></div>
                    </div>
                    {strategy.notes && <div className="mt-2 text-sm text-neutral-500">{strategy.notes}</div>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={() => setEditing({ id: strategy.id, data: strategy })} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">Edit</button>
                    <button type="button" onClick={() => { if (window.confirm('Delete this strategy?')) props.onDeleteContentStrategy(strategy.id); }} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Platforms Section ──

  const renderPlatforms = () => {
    const [editing, setEditing] = useState<{ id?: string; data?: Partial<SocialPlatformInput> } | null>(null);
    const createDefaults = async () => {
      for (const p of DEFAULT_PLATFORMS) { await props.onAddSocialPlatform({ name: p.name, slug: p.slug, isActive: true }); }
    };
    const handleSave = async (input: SocialPlatformInput) => {
      if (editing?.id) { await props.onUpdateSocialPlatform(editing.id, input); }
      else { await props.onAddSocialPlatform(input); }
      setEditing(null);
    };
    if (editing) {
      return <SocialPlatformForm initial={editing.data} onSave={handleSave} onCancel={() => setEditing(null)} />;
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Platforms</h3>
            <p className="mt-0.5 text-xs text-neutral-500">Social media platforms where content is published.</p>
          </div>
          <div className="flex gap-2">
            {props.socialPlatforms.length === 0 && (
              <button type="button" onClick={createDefaults} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">Create Default Platforms</button>
            )}
            <button type="button" onClick={() => setEditing({})} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Add Platform</button>
          </div>
        </div>
        {props.socialPlatforms.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500 text-center">No platforms yet. Create default platforms or add your own.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {props.socialPlatforms.map((platform) => (
              <div key={platform.id} className="rounded-xl border border-neutral-200 bg-white p-4 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold text-neutral-900">{platform.name}</div>
                  <div className="text-xs text-neutral-500">/{platform.slug}</div>
                  {platform.url && <div className="text-xs text-neutral-500 truncate">{platform.url}</div>}
                  {platform.notes && <div className="text-xs text-neutral-500 mt-1">{platform.notes}</div>}
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${isActiveBadge(platform.isActive)}`}>{platform.isActive ? 'Active' : 'Inactive'}</span>
                  <button type="button" onClick={() => setEditing({ id: platform.id, data: platform })} className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">Edit</button>
                  <button type="button" onClick={() => { if (window.confirm('Delete this platform?')) props.onDeleteSocialPlatform(platform.id); }} className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Pillars Section ──

  const renderPillars = () => {
    const [editing, setEditing] = useState<{ id?: string; data?: Partial<ContentPillarInput> } | null>(null);
    const createStarterPillars = async () => {
      for (const p of STARTER_PILLARS) {
        const exists = props.contentPillars.some((cp) => cp.slug === p.slug);
        if (!exists) { await props.onAddContentPillar({ name: p.name, slug: p.slug, description: p.description, priority: 'medium', isActive: true }); }
      }
    };
    const handleSave = async (input: ContentPillarInput) => {
      if (editing?.id) { await props.onUpdateContentPillar(editing.id, input); }
      else { await props.onAddContentPillar(input); }
      setEditing(null);
    };
    if (editing) {
      return <ContentPillarForm initial={editing.data} onSave={handleSave} onCancel={() => setEditing(null)} />;
    }
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Content Pillars</h3>
            <p className="mt-0.5 text-xs text-neutral-500">Themes that define your content categories.</p>
          </div>
          <div className="flex gap-2">
            {props.contentPillars.length === 0 && (
              <button type="button" onClick={createStarterPillars} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">Create Starter Pillars</button>
            )}
            <button type="button" onClick={() => setEditing({})} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Add Pillar</button>
          </div>
        </div>
        {props.contentPillars.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500 text-center">No pillars yet. Create starter pillars or add your own.</div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {props.contentPillars.map((pillar) => (
              <div key={pillar.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-neutral-900">{pillar.name}</div>
                    <div className="text-xs text-neutral-500">/{pillar.slug}</div>
                    {pillar.description && <div className="text-xs text-neutral-500 mt-1">{pillar.description}</div>}
                    {pillar.targetAudience && <div className="text-xs text-neutral-500 mt-0.5">Audience: {pillar.targetAudience}</div>}
                    {pillar.notes && <div className="text-xs text-neutral-500 mt-1">{pillar.notes}</div>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityBadge(pillar.priority)}`}>{pillar.priority}</span>
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${isActiveBadge(pillar.isActive)}`}>{pillar.isActive ? 'Active' : 'Inactive'}</span>
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <button type="button" onClick={() => setEditing({ id: pillar.id, data: pillar })} className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">Edit</button>
                  <button type="button" onClick={() => { if (window.confirm('Delete this pillar?')) props.onDeleteContentPillar(pillar.id); }} className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Ideas Section ──

  const renderIdeas = () => {
    const ideas = useMemo(() => props.contentItems.filter((item) => item.status === 'idea'), [props.contentItems]);
    const [editing, setEditing] = useState<{ id?: string; data?: Partial<ContentItemInput> } | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState('');
    const [platformFilter, setPlatformFilter] = useState('');
    const [pillarFilter, setPillarFilter] = useState('');
    const [priorityFilter, setPriorityFilter] = useState('');

    const filteredIdeas = useMemo(() => {
      return ideas.filter((item) => {
        const searchMatch = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase());
        const typeMatch = !typeFilter || item.type === typeFilter;
        const platformMatch = !platformFilter || item.platformId === platformFilter;
        const pillarMatch = !pillarFilter || item.pillarId === pillarFilter;
        const priorityMatch = !priorityFilter || item.priority === priorityFilter;
        return searchMatch && typeMatch && platformMatch && pillarMatch && priorityMatch;
      });
    }, [ideas, searchQuery, typeFilter, platformFilter, pillarFilter, priorityFilter]);

    const handleSave = async (input: ContentItemInput) => {
      if (editing?.id) { await props.onUpdateContentItem(editing.id, { ...input, status: 'idea' }); }
      else { await props.onAddContentItem({ ...input, status: 'idea' }); }
      setEditing(null);
    };

    if (editing) {
      return (
        <ContentItemForm
          initial={editing.data}
          socialPlatforms={props.socialPlatforms}
          contentPillars={props.contentPillars}
          projects={props.projects}
          smartNotes={props.smartNotes}
          companies={props.companies}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      );
    }

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-neutral-900">Ideas Bank</h3>
            <p className="mt-0.5 text-xs text-neutral-500">{ideas.length} content ideas waiting to be developed.</p>
          </div>
          <button type="button" onClick={() => setEditing({})} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">Add Idea</button>
        </div>

        <div className="flex flex-wrap gap-3">
          <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 min-w-[200px]" placeholder="Search ideas..." />
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            <option value="">All types</option>
            {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            <option value="">All platforms</option>
            {props.socialPlatforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)} className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            <option value="">All pillars</option>
            {props.contentPillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            <option value="">All priorities</option>
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>

        {filteredIdeas.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500 text-center">No ideas found.</div>
        ) : (
          <div className="space-y-2">
            {filteredIdeas.map((item) => (
              <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900 truncate">{item.title}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${priorityBadge(item.priority)}`}>{item.priority}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
                      <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium">{item.type}</span>
                      {item.platformName && <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium">{item.platformName}</span>}
                      {item.pillarName && <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium">{item.pillarName}</span>}
                      {item.hook && <span className="italic text-neutral-400 truncate max-w-[200px]">"{item.hook}"</span>}
                    </div>
                    {item.content && <div className="mt-1 text-xs text-neutral-500 truncate">{item.content}</div>}
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button type="button" onClick={async () => { await props.onUpdateContentItem(item.id, { status: 'drafted' }); }} className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">Draft</button>
                    <button type="button" onClick={() => setEditing({ id: item.id, data: item })} className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">Edit</button>
                    <button type="button" onClick={() => { if (window.confirm('Delete this idea?')) props.onDeleteContentItem(item.id); }} className="rounded-md border border-neutral-200 bg-white px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Weekly Plan Section ──

  const renderWeeklyPlan = () => {
    const plan = useMemo(() => props.weeklyContentPlans.find((p) => p.weekStart === selectedWeek), [props.weeklyContentPlans, selectedWeek]);
    const weekItems = useMemo(() => props.contentItems.filter((item) => item.weekStart === selectedWeek), [props.contentItems, selectedWeek]);
    const unassignedItems = useMemo(() => props.contentItems.filter((item) => !item.weekStart || item.weekStart === ''), [props.contentItems]);
    const [editing, setEditing] = useState<boolean>(false);
    const [formData, setFormData] = useState<Partial<WeeklyContentPlanInput>>({});

    const handleSavePlan = async () => {
      if (plan) { await props.onUpdateWeeklyContentPlan(plan.id, { ...formData, weekStart: selectedWeek }); }
      else { await props.onAddWeeklyContentPlan({ ...formData, weekStart: selectedWeek } as WeeklyContentPlanInput); }
      setEditing(false);
    };

    const assignToWeek = async (itemId: string) => {
      await props.onUpdateContentItem(itemId, { weekStart: selectedWeek });
    };

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setSelectedWeek(addWeeks(selectedWeek, -1))} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">&larr; Prev</button>
            <span className="text-sm font-semibold text-neutral-900">Week of {formatDate(selectedWeek)}</span>
            <button type="button" onClick={() => setSelectedWeek(addWeeks(selectedWeek, 1))} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Next &rarr;</button>
            <button type="button" onClick={() => setSelectedWeek(WEEK_START(new Date()))} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">This Week</button>
          </div>
          <button type="button" onClick={() => { setFormData(plan || { weekStart: selectedWeek }); setEditing(true); }} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">
            {plan ? 'Edit Plan' : 'Create Plan'}
          </button>
        </div>

        {editing && (
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Focus</div>
                <input value={formData.focus || ''} onChange={(e) => setFormData((prev) => ({ ...prev, focus: e.target.value }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Target Posts</div>
                <input type="number" min="0" value={formData.targetPosts ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, targetPosts: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Target Videos</div>
                <input type="number" min="0" value={formData.targetVideos ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, targetVideos: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Target Carousels</div>
                <input type="number" min="0" value={formData.targetCarousels ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, targetCarousels: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Target Other</div>
                <input type="number" min="0" value={formData.targetOther ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, targetOther: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Review Notes</div>
                <input value={formData.reviewNotes || ''} onChange={(e) => setFormData((prev) => ({ ...prev, reviewNotes: e.target.value }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button type="button" onClick={handleSavePlan} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">Save</button>
              <button type="button" onClick={() => setEditing(false)} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Cancel</button>
            </div>
          </div>
        )}

        {plan && !editing && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="space-y-2 text-sm text-neutral-700">
              {plan.focus && <div className="rounded-md bg-neutral-50 p-3"><span className="font-medium text-neutral-900">Focus:</span> {plan.focus}</div>}
              <div className="flex flex-wrap gap-3 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
                <span>Posts: {plan.targetPosts ?? '—'}</span>
                <span>Videos: {plan.targetVideos ?? '—'}</span>
                <span>Carousels: {plan.targetCarousels ?? '—'}</span>
                <span>Other: {plan.targetOther ?? '—'}</span>
              </div>
              {plan.reviewNotes && <div className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">Review: {plan.reviewNotes}</div>}
            </div>
          </div>
        )}

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-900">Content Items This Week ({weekItems.length})</h3>
          {weekItems.length === 0 ? (
            <div className="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 text-center">No items assigned to this week.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {weekItems.map((item) => (
                <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${statusBadge(item.status)}`}>{item.status}</span>
                    <span className="text-sm font-medium text-neutral-900 truncate">{item.title}</span>
                    <span className="text-xs text-neutral-500 shrink-0">{item.type}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {unassignedItems.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-semibold text-neutral-900 mb-2">Unassigned Items ({unassignedItems.length})</h4>
              <div className="space-y-2">
                {unassignedItems.map((item) => (
                  <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${statusBadge(item.status)}`}>{item.status}</span>
                      <span className="text-sm font-medium text-neutral-900 truncate">{item.title}</span>
                    </div>
                    <button type="button" onClick={() => assignToWeek(item.id)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors shrink-0">Assign to Week</button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Production Board ──

  const renderProductionBoard = () => {
    const [editing, setEditing] = useState<{ id?: string; data?: Partial<ContentItemInput> } | null>(null);
    const groupedByStatus = useMemo(() => {
      const groups: Record<string, ContentItem[]> = {};
      for (const item of props.contentItems) {
        const key = item.status;
        if (!groups[key]) groups[key] = [];
        groups[key].push(item);
      }
      return groups;
    }, [props.contentItems]);

    const handleSave = async (input: ContentItemInput) => {
      if (editing?.id) { await props.onUpdateContentItem(editing.id, input); }
      setEditing(null);
    };

    const moveStatus = async (itemId: string, status: string) => {
      await props.onUpdateContentItem(itemId, { status: status as any });
    };

    if (editing) {
      return (
        <ContentItemForm
          initial={editing.data}
          socialPlatforms={props.socialPlatforms}
          contentPillars={props.contentPillars}
          projects={props.projects}
          smartNotes={props.smartNotes}
          companies={props.companies}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      );
    }

    return (
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-[1200px] pb-2">
          {CONTENT_STATUSES.map((status) => {
            const items = groupedByStatus[status] || [];
            return (
              <div key={status} className="w-56 shrink-0">
                <div className="rounded-xl border border-neutral-200 bg-white">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-neutral-200">
                    <span className="text-sm font-semibold text-neutral-900 capitalize">{status}</span>
                    <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-600">{items.length}</span>
                  </div>
                  <div className="p-3 space-y-3 max-h-[65vh] overflow-y-auto">
                    {items.length === 0 && (
                      <div className="rounded-md border border-dashed border-neutral-200 bg-neutral-50 p-4 text-xs text-neutral-500 text-center">No items</div>
                    )}
                    {items.map((item) => (
                      <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                        <div className="text-sm font-medium text-neutral-900 break-words">{item.title}</div>
                        <div className="mt-1 flex flex-wrap gap-1">
                          <span className="text-[10px] rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-neutral-600">{item.type}</span>
                          {item.platformName && <span className="text-[10px] rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-neutral-600">{item.platformName}</span>}
                          {item.pillarName && <span className="text-[10px] rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-neutral-600">{item.pillarName}</span>}
                        </div>
                        {item.publishDate && <div className="mt-1 text-[10px] text-neutral-500">Publish: {formatDate(item.publishDate)}</div>}
                        {item.hook && <div className="mt-1 text-[10px] text-neutral-500 truncate">"{item.hook}"</div>}
                        <div className="mt-2 flex gap-1">
                          <button type="button" onClick={() => setEditing({ id: item.id, data: item })} className="text-[10px] rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-900 hover:bg-neutral-50 transition-colors">Edit</button>
                          <select
                            value={item.status}
                            onChange={(e) => moveStatus(item.id, e.target.value)}
                            className="text-[10px] rounded-md border border-neutral-200 bg-white px-2 py-1 text-neutral-900 outline-none"
                          >
                            {CONTENT_STATUSES.map((s) => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button type="button" onClick={() => { if (window.confirm('Delete?')) props.onDeleteContentItem(item.id); }} className="text-[10px] rounded-md border border-neutral-200 bg-white px-2 py-1 text-red-600 hover:bg-red-50 transition-colors">Del</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ── Calendar Section ──

  const renderCalendar = () => {
    const itemsWithDate = useMemo(() => props.contentItems.filter((item) => item.publishDate).sort((a, b) => (a.publishDate || '').localeCompare(b.publishDate || '')), [props.contentItems]);
    const groupedByDate = useMemo(() => {
      const groups: Record<string, ContentItem[]> = {};
      for (const item of itemsWithDate) {
        const date = item.publishDate?.slice(0, 10) || '';
        if (!groups[date]) groups[date] = [];
        groups[date].push(item);
      }
      return groups;
    }, [itemsWithDate]);

    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-neutral-900">Content Calendar</h3>
        {Object.keys(groupedByDate).length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500 text-center">No scheduled content. Set a publish date on content items to see them here.</div>
        ) : (
          <div className="space-y-3">
            {Object.entries(groupedByDate).map(([date, items]) => (
              <div key={date} className="rounded-xl border border-neutral-200 bg-white">
                <div className="px-4 py-3 border-b border-neutral-200 bg-neutral-50">
                  <span className="text-sm font-semibold text-neutral-900">{formatDate(date)}</span>
                </div>
                <div className="p-3 space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${statusBadge(item.status)}`}>{item.status}</span>
                        <span className="text-sm font-medium text-neutral-900 truncate">{item.title}</span>
                        <span className="text-xs text-neutral-500 shrink-0">{item.type}</span>
                        {item.platformName && <span className="text-xs text-neutral-500 shrink-0">{item.platformName}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ── Performance Section ──

  const renderPerformance = () => {
    const published = useMemo(() => props.contentItems.filter((item) => item.status === 'published'), [props.contentItems]);
    const stats = useMemo(() => {
      const totalViews = published.reduce((sum, item) => sum + (item.performanceViews || 0), 0);
      const totalLikes = published.reduce((sum, item) => sum + (item.performanceLikes || 0), 0);
      const totalLeads = published.reduce((sum, item) => sum + (item.leadsGenerated || 0), 0);
      const totalComments = published.reduce((sum, item) => sum + (item.performanceComments || 0), 0);
      const totalShares = published.reduce((sum, item) => sum + (item.performanceShares || 0), 0);
      const totalSaves = published.reduce((sum, item) => sum + (item.performanceSaves || 0), 0);
      const totalClicks = published.reduce((sum, item) => sum + (item.performanceClicks || 0), 0);
      const byViews = [...published].sort((a, b) => (b.performanceViews || 0) - (a.performanceViews || 0));
      const byLeads = [...published].sort((a, b) => (b.leadsGenerated || 0) - (a.leadsGenerated || 0));
      return { totalViews, totalLikes, totalLeads, totalComments, totalShares, totalSaves, totalClicks, byViews, byLeads };
    }, [published]);

    const [editPerf, setEditPerf] = useState<string | null>(null);
    const [perfData, setPerfData] = useState<Partial<ContentItemInput>>({});
    const handleSavePerf = async (item: ContentItem) => {
      if (editPerf) { await props.onUpdateContentItem(item.id, perfData); setEditPerf(null); }
    };

    return (
      <div className="space-y-7">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-2xl font-semibold text-neutral-900">{stats.totalViews.toLocaleString()}</div><div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Total Views</div></div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-2xl font-semibold text-neutral-900">{stats.totalLikes.toLocaleString()}</div><div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Total Likes</div></div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-2xl font-semibold text-neutral-900">{stats.totalComments.toLocaleString()}</div><div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Total Comments</div></div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-2xl font-semibold text-neutral-900">{stats.totalShares.toLocaleString()}</div><div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Total Shares</div></div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-2xl font-semibold text-neutral-900">{stats.totalSaves.toLocaleString()}</div><div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Total Saves</div></div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-2xl font-semibold text-neutral-900">{stats.totalClicks.toLocaleString()}</div><div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Total Clicks</div></div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-2xl font-semibold text-neutral-900">{totalLeads.toLocaleString()}</div><div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Leads Generated</div></div>
          <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-2xl font-semibold text-neutral-900">{published.length}</div><div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Published Items</div></div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {stats.byViews.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-neutral-900">Best by Views</h3>
              <div className="mt-2 gap-2 text-sm">
                <div className="rounded-md bg-neutral-50 p-3">
                  <div className="font-medium text-neutral-900">{stats.byViews[0].title}</div>
                  <div className="text-xs text-neutral-500 mt-1">{stats.byViews[0].performanceViews?.toLocaleString()} views</div>
                </div>
              </div>
            </div>
          )}
          {stats.byLeads.length > 0 && (
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h3 className="text-sm font-semibold text-neutral-900">Best by Leads</h3>
              <div className="mt-2 gap-2 text-sm">
                <div className="rounded-md bg-neutral-50 p-3">
                  <div className="font-medium text-neutral-900">{stats.byLeads[0].title}</div>
                  <div className="text-xs text-neutral-500 mt-1">{stats.byLeads[0].leadsGenerated} leads</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-900">Published Content ({published.length})</h3>
          {published.length === 0 ? (
            <div className="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 text-center">No published content yet.</div>
          ) : (
            <div className="mt-3 space-y-2">
              {published.map((item) => (
                <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-neutral-900">{item.title}</div>
                      <div className="text-xs text-neutral-500 mt-0.5">{item.type} | {item.platformName || 'No platform'} | {item.publishDate ? formatDate(item.publishDate) : 'No date'}</div>
                    </div>
                    <button type="button" onClick={() => { setEditPerf(item.id); setPerfData(item); }} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors shrink-0">Edit Perf</button>
                  </div>
                  {editPerf === item.id && (
                    <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-3 p-3 bg-white rounded-md border border-neutral-200">
                      {(['performanceViews', 'performanceLikes', 'performanceComments', 'performanceShares', 'performanceSaves', 'performanceClicks', 'leadsGenerated'] as const).map((field) => (
                        <div key={field}>
                          <label className="text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-500 block">{field.replace('performance', '').toLowerCase()}</label>
                          <input
                            type="number" min="0"
                            value={(perfData as any)[field] ?? ''}
                            onChange={(e) => setPerfData((prev) => ({ ...prev, [field]: e.target.value ? Number(e.target.value) : undefined }))}
                            className="h-8 w-full rounded-md border border-neutral-200 bg-white px-2 text-xs text-neutral-900 outline-none transition-colors focus:border-neutral-400 mt-1"
                          />
                        </div>
                      ))}
                      <div className="col-span-full flex gap-2 mt-2">
                        <button type="button" onClick={() => handleSavePerf(item)} className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors">Save</button>
                        <button type="button" onClick={() => setEditPerf(null)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">Cancel</button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── AI Assistant Section ──

  const renderAIAssistant = () => (
    <AISocialMediaAssistantPanel
      strategies={props.contentStrategies}
      platforms={props.socialPlatforms}
      pillars={props.contentPillars}
      contentItems={props.contentItems}
      weeklyContentPlans={props.weeklyContentPlans}
      smartNotes={props.smartNotes}
      projects={props.projects}
      onCreateContentItem={props.onAddContentItem}
      onUpdateContentItem={props.onUpdateContentItem}
      onCreateWeeklyPlan={props.onAddWeeklyContentPlan}
    />
  );

  // ── Main Render ──

  return (
    <section className="space-y-7">
      {renderTabs()}
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'strategy' && renderStrategy()}
      {activeTab === 'platforms' && renderPlatforms()}
      {activeTab === 'pillars' && renderPillars()}
      {activeTab === 'ideas' && renderIdeas()}
      {activeTab === 'weekly' && renderWeeklyPlan()}
      {activeTab === 'production' && renderProductionBoard()}
      {activeTab === 'calendar' && renderCalendar()}
      {activeTab === 'performance' && renderPerformance()}
      {activeTab === 'ai-assistant' && renderAIAssistant()}
    </section>
  );
}

// ── Standalone Forms ──

function SocialPlatformForm({ initial, onSave, onCancel }: { initial?: Partial<SocialPlatformInput>; onSave: (input: SocialPlatformInput) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [url, setUrl] = useState(initial?.url || '');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    try { await onSave({ name: name.trim(), slug: slug.trim(), url: url.trim() || undefined, isActive, notes: notes.trim() || undefined }); } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-5">
      <h4 className="text-sm font-semibold text-neutral-900 mb-4">{initial?.id ? 'Edit' : 'Add'} Platform</h4>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Name *</div>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Slug *</div>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">URL</div>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 self-end">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
          <span className="text-sm text-neutral-900">Active</span>
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" rows={2} />
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function ContentPillarForm({ initial, onSave, onCancel }: { initial?: Partial<ContentPillarInput>; onSave: (input: ContentPillarInput) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [slug, setSlug] = useState(initial?.slug || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [targetAudience, setTargetAudience] = useState(initial?.targetAudience || '');
  const [priority, setPriority] = useState<string>(initial?.priority || 'medium');
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(), slug: slug.trim(), description: description.trim() || undefined,
        targetAudience: targetAudience.trim() || undefined, priority: priority as any, isActive,
        notes: notes.trim() || undefined,
      });
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-5">
      <h4 className="text-sm font-semibold text-neutral-900 mb-4">{initial?.id ? 'Edit' : 'Add'} Pillar</h4>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Name *</div>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Slug *</div>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Description</div>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Target Audience</div>
          <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Priority</div>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 self-end">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
          <span className="text-sm text-neutral-900">Active</span>
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" rows={2} />
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function ContentStrategyForm({ initial, onSave, onCancel }: { initial?: Partial<ContentStrategyInput>; onSave: (input: ContentStrategyInput) => Promise<void>; onCancel: () => void }) {
  const [name, setName] = useState(initial?.name || '');
  const [targetAudience, setTargetAudience] = useState(initial?.targetAudience || '');
  const [positioning, setPositioning] = useState(initial?.positioning || '');
  const [mainPromise, setMainPromise] = useState(initial?.mainPromise || '');
  const [tone, setTone] = useState(initial?.tone || '');
  const [languages, setLanguages] = useState(initial?.languages || '');
  const [weeklyPostTarget, setWeeklyPostTarget] = useState(initial?.weeklyPostTarget ?? '');
  const [weeklyVideoTarget, setWeeklyVideoTarget] = useState(initial?.weeklyVideoTarget ?? '');
  const [activePlatforms, setActivePlatforms] = useState(initial?.activePlatforms || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: name.trim(), targetAudience: targetAudience.trim() || undefined,
        positioning: positioning.trim() || undefined, mainPromise: mainPromise.trim() || undefined,
        tone: tone.trim() || undefined, languages: languages.trim() || undefined,
        weeklyPostTarget: weeklyPostTarget !== '' ? Number(weeklyPostTarget) : undefined,
        weeklyVideoTarget: weeklyVideoTarget !== '' ? Number(weeklyVideoTarget) : undefined,
        activePlatforms: activePlatforms.trim() || undefined, notes: notes.trim() || undefined,
      });
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-5">
      <h4 className="text-sm font-semibold text-neutral-900 mb-4">{initial?.id ? 'Edit' : 'Add'} Strategy</h4>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="space-y-1.5 md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Name *</div>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Target Audience</div>
          <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Positioning</div>
          <input value={positioning} onChange={(e) => setPositioning(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Main Promise</div>
          <input value={mainPromise} onChange={(e) => setMainPromise(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Tone</div>
          <input value={tone} onChange={(e) => setTone(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Languages</div>
          <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Weekly Post Target</div>
          <input type="number" min="0" value={weeklyPostTarget} onChange={(e) => setWeeklyPostTarget(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Weekly Video Target</div>
          <input type="number" min="0" value={weeklyVideoTarget} onChange={(e) => setWeeklyVideoTarget(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Active Platforms</div>
          <input value={activePlatforms} onChange={(e) => setActivePlatforms(e.target.value)} placeholder="e.g. LinkedIn, X, Instagram" className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5 md:col-span-2">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" rows={2} />
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Cancel</button>
      </div>
    </form>
  );
}

function ContentItemForm({ initial, socialPlatforms, contentPillars, projects, smartNotes, companies, onSave, onCancel }: {
  initial?: Partial<ContentItemInput>;
  socialPlatforms: SocialPlatform[];
  contentPillars: ContentPillar[];
  projects: Project[];
  smartNotes: SmartNote[];
  companies: Company[];
  onSave: (input: ContentItemInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [type, setType] = useState(initial?.type || 'text_post');
  const [priority, setPriority] = useState(initial?.priority || 'medium');
  const [status, setStatus] = useState(initial?.status || 'idea');
  const [platformId, setPlatformId] = useState(initial?.platformId || '');
  const [pillarId, setPillarId] = useState(initial?.pillarId || '');
  const [hook, setHook] = useState(initial?.hook || '');
  const [content, setContent] = useState(initial?.content || '');
  const [caption, setCaption] = useState(initial?.caption || '');
  const [assetUrl, setAssetUrl] = useState(initial?.assetUrl || '');
  const [publishDate, setPublishDate] = useState(initial?.publishDate?.slice(0, 10) || '');
  const [weekStart, setWeekStart] = useState(initial?.weekStart?.slice(0, 10) || '');
  const [linkedProjectId, setLinkedProjectId] = useState(initial?.linkedProjectId || '');
  const [linkedNoteId, setLinkedNoteId] = useState(initial?.linkedNoteId || '');
  const [linkedCompanyId, setLinkedCompanyId] = useState(initial?.linkedCompanyId || '');
  const [notes, setNotes] = useState(initial?.notes || '');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSave({
        title: title.trim(), type: type as any, priority: priority as any, status: status as any,
        platformId: platformId || undefined, pillarId: pillarId || undefined,
        hook: hook.trim() || undefined, content: content.trim() || undefined,
        caption: caption.trim() || undefined, assetUrl: assetUrl.trim() || undefined,
        publishDate: publishDate || undefined, weekStart: weekStart || undefined,
        linkedProjectId: linkedProjectId || undefined, linkedNoteId: linkedNoteId || undefined,
        linkedCompanyId: linkedCompanyId || undefined, notes: notes.trim() || undefined,
      });
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-neutral-200 bg-white p-5">
      <h4 className="text-sm font-semibold text-neutral-900 mb-4">{initial?.id ? 'Edit' : 'Add'} Content</h4>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="space-y-1.5 md:col-span-3">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Title *</div>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Type</div>
          <select value={type} onChange={(e) => setType(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Priority</div>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Status</div>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            {CONTENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Platform</div>
          <select value={platformId} onChange={(e) => setPlatformId(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            <option value="">None</option>
            {socialPlatforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Pillar</div>
          <select value={pillarId} onChange={(e) => setPillarId(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            <option value="">None</option>
            {contentPillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Publish Date</div>
          <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Week Start</div>
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Asset URL</div>
          <input value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Hook</div>
          <input value={hook} onChange={(e) => setHook(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Linked Project</div>
          <select value={linkedProjectId} onChange={(e) => setLinkedProjectId(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            <option value="">None</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Linked Note</div>
          <select value={linkedNoteId} onChange={(e) => setLinkedNoteId(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            <option value="">None</option>
            {smartNotes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>
        </label>
        <label className="space-y-1.5">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Linked Company</div>
          <select value={linkedCompanyId} onChange={(e) => setLinkedCompanyId(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
            <option value="">None</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="space-y-1.5 md:col-span-3">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Content</div>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" rows={3} />
        </label>
        <label className="space-y-1.5 md:col-span-3">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Caption</div>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" rows={2} />
        </label>
        <label className="space-y-1.5 md:col-span-3">
          <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" rows={2} />
        </label>
      </div>
      <div className="flex gap-2 mt-4">
        <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Cancel</button>
      </div>
    </form>
  );
}
