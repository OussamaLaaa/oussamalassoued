import React, { useMemo, useState, useEffect } from 'react';
import type { SocialPlatform, ContentPillar, ContentStrategy, ContentItem, WeeklyContentPlan, Project, SmartNote, Company, SocialPlatformInput, ContentPillarInput, ContentStrategyInput, ContentItemInput, WeeklyContentPlanInput, SocialWeeklySystem, SocialWeeklySystemInput, SocialWeeklyTask } from '../../types/opportunities';
import AISocialMediaAssistantPanel from './AISocialMediaAssistantPanel';
import DirectionalText from '../ui/DirectionalText';
import { detectTextDirection, getDirectionClass } from '../../utils/textDirection';

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
  section?: typeof SOCIAL_TABS[number]['id'];
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
  socialWeeklySystems: SocialWeeklySystem[];
  activeSocialWeeklySystem: SocialWeeklySystem | null;
  onAddSocialWeeklySystem: (input: SocialWeeklySystemInput) => Promise<SocialWeeklySystem>;
  onUpdateSocialWeeklySystem: (id: string, input: Partial<SocialWeeklySystemInput>) => Promise<SocialWeeklySystem>;
  onDeleteSocialWeeklySystem: (id: string) => Promise<void>;
  onEnsureDefaultSocialWeeklySystem: () => Promise<SocialWeeklySystem | null>;
}

export default function SocialMediaPanel(props: SocialMediaPanelProps) {
  const [activeTab, setActiveTab] = useState<typeof SOCIAL_TABS[number]['id']>('dashboard');
   const now = new Date();
  const currentWeek = WEEK_START(now);
  const todayStr = now.toISOString().slice(0, 10);

  useEffect(() => {
    if (props.section) setActiveTab(props.section as typeof SOCIAL_TABS[number]['id']);
  }, [props.section]);

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

  // ── Main Render ──

 return (
 <section className="space-y-7">
 {activeTab === 'dashboard' && <DashboardView {...props} thisWeekItems={thisWeekItems} publishedThisWeek={publishedThisWeek} ideasCount={ideasCount} inProduction={inProduction} readyToPublish={readyToPublish} scheduledItems={scheduledItems} totalLeads={totalLeads} totalViews={totalViews} plan={plan} activeStrategy={activeStrategy} recentIdeas={recentIdeas} readyScheduled={readyScheduled} currentWeek={currentWeek} onNavigate={setActiveTab} />}
 {activeTab === 'strategy' && <StrategyView contentStrategies={props.contentStrategies} onAddContentStrategy={props.onAddContentStrategy} onUpdateContentStrategy={props.onUpdateContentStrategy} onDeleteContentStrategy={props.onDeleteContentStrategy} />}
 {activeTab === 'platforms' && <PlatformsView socialPlatforms={props.socialPlatforms} onAddSocialPlatform={props.onAddSocialPlatform} onUpdateSocialPlatform={props.onUpdateSocialPlatform} onDeleteSocialPlatform={props.onDeleteSocialPlatform} />}
 {activeTab === 'pillars' && <PillarsView contentPillars={props.contentPillars} onAddContentPillar={props.onAddContentPillar} onUpdateContentPillar={props.onUpdateContentPillar} onDeleteContentPillar={props.onDeleteContentPillar} />}
 {activeTab === 'ideas' && <IdeasView contentItems={props.contentItems} socialPlatforms={props.socialPlatforms} contentPillars={props.contentPillars} projects={props.projects} smartNotes={props.smartNotes} companies={props.companies} onAddContentItem={props.onAddContentItem} onUpdateContentItem={props.onUpdateContentItem} onDeleteContentItem={props.onDeleteContentItem} />}
  {activeTab === 'weekly' && <WeeklyPlanView socialWeeklySystem={props.activeSocialWeeklySystem} onUpdateSocialWeeklySystem={props.onUpdateSocialWeeklySystem} onEnsureDefaultSocialWeeklySystem={props.onEnsureDefaultSocialWeeklySystem} />}
 {activeTab === 'production' && <ProductionBoardView contentItems={props.contentItems} socialPlatforms={props.socialPlatforms} contentPillars={props.contentPillars} projects={props.projects} smartNotes={props.smartNotes} companies={props.companies} onUpdateContentItem={props.onUpdateContentItem} onDeleteContentItem={props.onDeleteContentItem} />}
 {activeTab === 'calendar' && <CalendarView contentItems={props.contentItems} />}
 {activeTab === 'performance' && <PerformanceView contentItems={props.contentItems} onUpdateContentItem={props.onUpdateContentItem} totalLeads={totalLeads} />}
 {activeTab === 'ai-assistant' && (
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
 )}
 </section>
 );
}

// ── Sub-Views ──

interface DashboardViewProps {
 thisWeekItems: ContentItem[]; publishedThisWeek: ContentItem[]; ideasCount: number; inProduction: number;
 readyToPublish: number; scheduledItems: ContentItem[]; totalLeads: number; totalViews: number;
 plan: WeeklyContentPlan | undefined; activeStrategy: ContentStrategy | undefined;
 recentIdeas: ContentItem[]; readyScheduled: ContentItem[]; contentItems: ContentItem[];
 currentWeek: string; socialPlatforms: SocialPlatform[]; contentPillars: ContentPillar[];
 onNavigate: (tab: string) => void;
}

function DashboardView(props: DashboardViewProps) {
 const metricCards = [
 { label: 'Planned This Week', value: props.thisWeekItems.length },
 { label: 'Published This Week', value: props.publishedThisWeek.length },
 { label: 'Ideas Bank', value: props.ideasCount },
 { label: 'In Production', value: props.inProduction },
 { label: 'Ready to Publish', value: props.readyToPublish },
 { label: 'Scheduled', value: props.scheduledItems.length },
 { label: 'Leads Generated', value: props.totalLeads },
 { label: 'Total Views', value: props.totalViews.toLocaleString() },
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
 <p className="mt-0.5 text-xs text-neutral-500">Week of {formatDate(props.currentWeek)}</p>
 </div>
 <button type="button" onClick={() => props.onNavigate('weekly')} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">View Week</button>
 </div>
 {props.plan ? (
 <div className="mt-3 space-y-2 text-sm text-neutral-700">
 {props.plan.focus && <div className="rounded-md bg-neutral-50 p-3"><span className="font-medium text-neutral-900">Focus:</span> {props.plan.focus}</div>}
 <div className="flex flex-wrap gap-3 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
 <span>Posts: {props.plan.targetPosts ?? '—'}</span>
 <span>Videos: {props.plan.targetVideos ?? '—'}</span>
 <span>Carousels: {props.plan.targetCarousels ?? '—'}</span>
 <span>Other: {props.plan.targetOther ?? '—'}</span>
 </div>
 {props.plan.reviewNotes && <div className="rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">Review: {props.plan.reviewNotes}</div>}
 </div>
 ) : (
 <div className="mt-3 rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 text-center">No plan for this week yet.</div>
 )}
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h3 className="text-sm font-semibold text-neutral-900">Content Pipeline</h3>
 <p className="mt-0.5 text-xs text-neutral-500">{props.inProduction} items in production</p>
 <div className="mt-3 space-y-2">
 {props.inProduction === 0 ? (
 <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 text-center">No items in production.</div>
 ) : (
 props.contentItems.filter((item) => ['drafted', 'designing', 'recording', 'editing'].includes(item.status)).slice(0, 5).map((item) => (
 <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
  <DirectionalText text={item.title} className="text-sm font-medium text-neutral-900 truncate" />
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
 <p className="mt-0.5 text-xs text-neutral-500">{props.readyScheduled.length} items ready to go</p>
 <div className="mt-3 space-y-2">
 {props.readyScheduled.length === 0 ? (
 <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 text-center">No ready or scheduled items.</div>
 ) : (
 props.readyScheduled.map((item) => (
  <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between gap-2">
  <div className="min-w-0 flex-1">
  <DirectionalText text={item.title} className="text-sm font-medium text-neutral-900 truncate" />
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
 <p className="mt-0.5 text-xs text-neutral-500">{props.ideasCount} total ideas</p>
 </div>
 <button type="button" onClick={() => props.onNavigate('ideas')} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">View All</button>
 </div>
 <div className="mt-3 space-y-2">
 {props.recentIdeas.length === 0 ? (
 <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 text-center">No ideas yet.</div>
 ) : (
 props.recentIdeas.map((item) => (
  <div key={item.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-3 flex items-center justify-between gap-2">
  <div className="min-w-0 flex-1">
  <DirectionalText text={item.title} className="text-sm font-medium text-neutral-900 truncate" />
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
 <div className="text-lg font-semibold text-neutral-900">{props.totalViews.toLocaleString()}</div>
 <div className="text-xs text-neutral-500">Views</div>
 </div>
 <div className="rounded-md bg-neutral-50 p-3">
 <div className="text-lg font-semibold text-neutral-900">{props.totalLeads.toLocaleString()}</div>
 <div className="text-xs text-neutral-500">Leads</div>
 </div>
 </div>
 <button type="button" onClick={() => props.onNavigate('performance')} className="mt-3 rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">Full Performance</button>
 </div>
 </div>
 </div>

 <aside className="space-y-4 xl:sticky xl:top-4 xl:h-fit">
 {props.activeStrategy && (
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Active Strategy</h3>
  <div className="mt-2 space-y-2 text-sm">
  <DirectionalText text={props.activeStrategy.name} className="font-medium text-neutral-900" />
  {props.activeStrategy.positioning && <DirectionalText text={props.activeStrategy.positioning} className="text-xs text-neutral-500" />}
 {props.activeStrategy.weeklyPostTarget != null && <div className="rounded-md bg-neutral-50 p-2 text-xs text-neutral-600">Target: {props.activeStrategy.weeklyPostTarget} posts/week</div>}
 </div>
 </div>
 )}

 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Weekly Targets</h3>
 <div className="mt-2 space-y-2">
 {props.plan ? (
 <>
 <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Posts:</span> <span className="text-neutral-600">{props.plan.targetPosts ?? '—'}</span></div>
 <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Videos:</span> <span className="text-neutral-600">{props.plan.targetVideos ?? '—'}</span></div>
 <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Carousels:</span> <span className="text-neutral-600">{props.plan.targetCarousels ?? '—'}</span></div>
 <div className="rounded-md bg-neutral-50 p-2 text-xs"><span className="font-medium text-neutral-900">Other:</span> <span className="text-neutral-600">{props.plan.targetOther ?? '—'}</span></div>
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
}

// ── Strategy View ──

interface StrategyViewProps {
 contentStrategies: ContentStrategy[];
 onAddContentStrategy: (input: ContentStrategyInput) => Promise<ContentStrategy>;
 onUpdateContentStrategy: (id: string, input: Partial<ContentStrategyInput>) => Promise<ContentStrategy>;
 onDeleteContentStrategy: (id: string) => Promise<void>;
}

function StrategyView(props: StrategyViewProps) {
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
  <div className="space-y-4">
  {props.contentStrategies.map((strategy) => (
  <div key={strategy.id} className="rounded-2xl border border-neutral-200 bg-white p-6">
  {/* Top row: Title + Actions */}
  <div className="flex items-start justify-between gap-4">
  <div className="min-w-0 flex-1">
  <DirectionalText text={strategy.name} className="text-xl font-semibold text-neutral-900" as="div" />
  <div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-400">Content Strategy</div>
  </div>
  <div className="flex gap-2 shrink-0">
  <button type="button" onClick={() => setEditing({ id: strategy.id, data: strategy })} className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50 hover:text-neutral-900 transition-colors">Edit</button>
  <button type="button" onClick={() => { if (window.confirm('Delete this strategy?')) props.onDeleteContentStrategy(strategy.id); }} className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors">Delete</button>
  </div>
  </div>

  {/* Main information grid */}
  <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
  {/* Audience */}
  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Audience</div>
  {strategy.targetAudience ? (
  <DirectionalText text={strategy.targetAudience} className="mt-2 text-sm text-neutral-800 leading-relaxed" as="div" />
  ) : (
  <div className="mt-2 text-sm text-neutral-400 italic">Audience not defined yet.</div>
  )}
  </div>

  {/* Positioning */}
  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Positioning</div>
  {strategy.positioning ? (
  <DirectionalText text={strategy.positioning} className="mt-2 text-sm text-neutral-800 leading-relaxed" as="div" />
  ) : (
  <div className="mt-2 text-sm text-neutral-400 italic">Positioning not defined yet.</div>
  )}
  </div>

  {/* Weekly Targets */}
  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Weekly Targets</div>
  {(strategy.weeklyPostTarget != null || strategy.weeklyVideoTarget != null) ? (
  <div className="mt-2 space-y-1.5 text-sm text-neutral-800">
  {strategy.weeklyPostTarget != null && <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />{strategy.weeklyPostTarget} posts</div>}
  {strategy.weeklyVideoTarget != null && <div className="flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-neutral-400 shrink-0" />{strategy.weeklyVideoTarget} videos</div>}
  </div>
  ) : (
  <div className="mt-2 text-sm text-neutral-400 italic">Weekly targets not defined yet.</div>
  )}
  </div>
  </div>

  {/* Extra fields row (Promise, Tone, Languages, Platforms) */}
  {(strategy.mainPromise || strategy.tone || strategy.languages || strategy.activePlatforms) && (
  <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
  {strategy.mainPromise && (
  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Promise</div>
  <DirectionalText text={strategy.mainPromise} className="mt-1.5 text-sm text-neutral-700 leading-relaxed" as="div" />
  </div>
  )}
  {strategy.tone && (
  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Tone</div>
  <DirectionalText text={strategy.tone} className="mt-1.5 text-sm text-neutral-700 leading-relaxed" as="div" />
  </div>
  )}
  {strategy.languages && (
  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Languages</div>
  <DirectionalText text={strategy.languages} className="mt-1.5 text-sm text-neutral-700 leading-relaxed" as="div" />
  </div>
  )}
  {strategy.activePlatforms && (
  <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Platforms</div>
  <DirectionalText text={strategy.activePlatforms} className="mt-1.5 text-sm text-neutral-700 leading-relaxed" as="div" />
  </div>
  )}
  </div>
  )}

  {/* Notes footer */}
  {strategy.notes && (
  <div className="mt-4 border-t border-neutral-100 pt-4">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-400 mb-1.5">Notes</div>
  <DirectionalText text={strategy.notes} className="text-sm text-neutral-600 leading-relaxed" as="div" preserveWhitespace />
  </div>
  )}

  {/* Created date footer */}
  {strategy.createdAt && (
  <div className="mt-4 border-t border-neutral-100 pt-3">
  <span className="text-[11px] text-neutral-400">Created {formatDate(strategy.createdAt)}</span>
  </div>
  )}
  </div>
  ))}
  </div>
  )}
 </div>
 );
}

// ── Platforms View ──

interface PlatformsViewProps {
 socialPlatforms: SocialPlatform[];
 onAddSocialPlatform: (input: SocialPlatformInput) => Promise<SocialPlatform>;
 onUpdateSocialPlatform: (id: string, input: Partial<SocialPlatformInput>) => Promise<SocialPlatform>;
 onDeleteSocialPlatform: (id: string) => Promise<void>;
}

function PlatformsView(props: PlatformsViewProps) {
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
  <DirectionalText text={platform.name} className="text-sm font-semibold text-neutral-900" />
  <div className="text-xs text-neutral-500" dir="ltr">/{platform.slug}</div>
  {platform.url && <div className="text-xs text-neutral-500 truncate" dir="ltr">{platform.url}</div>}
  {platform.notes && <DirectionalText text={platform.notes} className="text-xs text-neutral-500 mt-1" as="div" />}
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
}

// ── Pillars View ──

interface PillarsViewProps {
 contentPillars: ContentPillar[];
 onAddContentPillar: (input: ContentPillarInput) => Promise<ContentPillar>;
 onUpdateContentPillar: (id: string, input: Partial<ContentPillarInput>) => Promise<ContentPillar>;
 onDeleteContentPillar: (id: string) => Promise<void>;
}

function PillarsView(props: PillarsViewProps) {
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
  <DirectionalText text={pillar.name} className="text-sm font-semibold text-neutral-900" />
  <div className="text-xs text-neutral-500" dir="ltr">/{pillar.slug}</div>
  {pillar.description && <DirectionalText text={pillar.description} className="text-xs text-neutral-500 mt-1" as="div" />}
  {pillar.targetAudience && <div className="text-xs text-neutral-500 mt-0.5"><DirectionalText text={`Audience: ${pillar.targetAudience}`} /></div>}
  {pillar.notes && <DirectionalText text={pillar.notes} className="text-xs text-neutral-500 mt-1" as="div" />}
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
}

// ── Ideas View ──

interface IdeasViewProps {
 contentItems: ContentItem[];
 socialPlatforms: SocialPlatform[];
 contentPillars: ContentPillar[];
 projects: Project[];
 smartNotes: SmartNote[];
 companies: Company[];
 onAddContentItem: (input: ContentItemInput) => Promise<ContentItem>;
 onUpdateContentItem: (id: string, input: Partial<ContentItemInput>) => Promise<ContentItem>;
 onDeleteContentItem: (id: string) => Promise<void>;
}

function IdeasView(props: IdeasViewProps) {
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

  <div className="flex flex-wrap items-center gap-3">
  <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 min-w-[220px] flex-1" placeholder="Search ideas..." />
  <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
  <option value="">All types</option>
  {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
  </select>
  <select value={platformFilter} onChange={(e) => setPlatformFilter(e.target.value)} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
  <option value="">All platforms</option>
  {props.socialPlatforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
  </select>
  <select value={pillarFilter} onChange={(e) => setPillarFilter(e.target.value)} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
  <option value="">All pillars</option>
  {props.contentPillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
  </select>
  <select value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)} className="h-10 rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
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
  <DirectionalText text={item.title} className="text-sm font-semibold text-neutral-900 truncate" />
  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium shrink-0 ${priorityBadge(item.priority)}`}>{item.priority}</span>
  </div>
  <div className="mt-1 flex flex-wrap gap-2 text-xs text-neutral-500">
  <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium">{item.type}</span>
  {item.platformName && <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium">{item.platformName}</span>}
  {item.pillarName && <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium">{item.pillarName}</span>}
  {item.hook && <DirectionalText text={`"${item.hook}"`} className="italic text-neutral-400 truncate max-w-[200px]" />}
  </div>
  {item.content && <DirectionalText text={item.content} className="mt-1 text-xs text-neutral-500 truncate" as="div" />}
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
}

// ── Weekly Plan View — Single Recurring Task Board ──

interface WeeklyPlanViewProps {
  socialWeeklySystem: SocialWeeklySystem | null;
  onUpdateSocialWeeklySystem: (id: string, input: Partial<SocialWeeklySystemInput>) => Promise<SocialWeeklySystem>;
  onEnsureDefaultSocialWeeklySystem: () => Promise<SocialWeeklySystem | null>;
}

let _idCounter = Date.now();
const uid = () => `w_${++_idCounter}`;

const TYPE_OPTIONS = ['post', 'video', 'carousel', 'reel', 'story', 'task', 'other'] as const;
const PRIORITY_OPTIONS = ['low', 'medium', 'high'] as const;

const TYPE_COLORS: Record<string, string> = {
  post: 'border-blue-200 bg-blue-50 text-blue-700',
  video: 'border-purple-200 bg-purple-50 text-purple-700',
  carousel: 'border-amber-200 bg-amber-50 text-amber-700',
  reel: 'border-rose-200 bg-rose-50 text-rose-700',
  story: 'border-teal-200 bg-teal-50 text-teal-700',
  task: 'border-neutral-200 bg-neutral-50 text-neutral-600',
  other: 'border-neutral-200 bg-neutral-50 text-neutral-500',
};

const PRIORITY_COLORS: Record<string, string> = {
  high: 'border-red-200 bg-red-50 text-red-700',
  medium: 'border-amber-200 bg-amber-50 text-amber-700',
  low: 'border-neutral-200 bg-neutral-50 text-neutral-500',
};

function WeeklyPlanView(props: WeeklyPlanViewProps) {
  const system = props.socialWeeklySystem;

  useEffect(() => {
    if (!system) {
      props.onEnsureDefaultSocialWeeklySystem();
    }
  }, [system, props.onEnsureDefaultSocialWeeklySystem]);

  const tasks = system?.weeklyTasks ?? [];

  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.done).length;
  const remainingCount = totalCount - doneCount;
  const activeCount = tasks.filter((t) => t.isActive).length;
  const highPriorityCount = tasks.filter((t) => t.priority === 'high').length;

  const [modalMode, setModalMode] = useState<'add' | 'edit' | null>(null);
  const [editingTask, setEditingTask] = useState<SocialWeeklyTask | null>(null);
  const [formTitle, setFormTitle] = useState('');
  const [formType, setFormType] = useState<SocialWeeklyTask['type']>('task');
  const [formTargetCount, setFormTargetCount] = useState('');
  const [formPriority, setFormPriority] = useState<'low' | 'medium' | 'high' | ''>('');
  const [formNotes, setFormNotes] = useState('');
  const [formIsActive, setFormIsActive] = useState(true);

  const openAdd = () => {
    setModalMode('add');
    setEditingTask(null);
    setFormTitle('');
    setFormType('task');
    setFormTargetCount('');
    setFormPriority('');
    setFormNotes('');
    setFormIsActive(true);
  };

  const openEdit = (task: SocialWeeklyTask) => {
    setModalMode('edit');
    setEditingTask(task);
    setFormTitle(task.title || task.label || '');
    setFormType(task.type || 'task');
    setFormTargetCount(task.targetCount != null ? String(task.targetCount) : '');
    setFormPriority(task.priority || '');
    setFormNotes(task.notes || '');
    setFormIsActive(task.isActive);
  };

  const closeModal = () => {
    setModalMode(null);
    setEditingTask(null);
  };

  const persistTasks = async (next: SocialWeeklyTask[]) => {
    if (system?.id) {
      await props.onUpdateSocialWeeklySystem(system.id, { weeklyTasks: next });
    }
  };

  const handleSave = async () => {
    if (!formTitle.trim()) return;
    if (!system?.id) return;
    const next = modalMode === 'add'
      ? [...tasks, {
          id: uid(),
          title: formTitle.trim(),
          type: formType,
          targetCount: formTargetCount ? Number(formTargetCount) : undefined,
          priority: formPriority || undefined,
          notes: formNotes || undefined,
          done: false,
          isActive: formIsActive,
        }]
      : tasks.map((t) => t.id === editingTask?.id
          ? { ...t, title: formTitle.trim(), type: formType, targetCount: formTargetCount ? Number(formTargetCount) : undefined, priority: formPriority || undefined, notes: formNotes || undefined, isActive: formIsActive }
          : t);
    await persistTasks(next);
    closeModal();
  };

  const toggleDone = async (task: SocialWeeklyTask) => {
    const next = tasks.map((t) => t.id === task.id ? { ...t, done: !t.done } : t);
    await persistTasks(next);
  };

  const handleDelete = async (task: SocialWeeklyTask) => {
    if (!window.confirm('Delete this weekly task?')) return;
    const next = tasks.filter((t) => t.id !== task.id);
    await persistTasks(next);
  };

  const handleResetCompleted = async () => {
    if (!window.confirm('Reset all completed tasks? All tasks will be marked as not done.')) return;
    const next = tasks.map((t) => ({ ...t, done: false }));
    await persistTasks(next);
  };

  const displayTitle = (task: SocialWeeklyTask) => task.title || task.label || '';

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-neutral-900">Weekly Social Media Board</h2>
          <p className="mt-0.5 text-xs text-neutral-500">Recurring social media tasks you repeat every week.</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button type="button" onClick={handleResetCompleted} className="rounded-lg border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-500 hover:bg-neutral-50 transition-colors">Reset Completed</button>
          <button type="button" onClick={openAdd} className="rounded-lg bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors">Add Task</button>
        </div>
      </div>

      {/* Summary cards */}
      {totalCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {[
            { label: 'Total', value: totalCount, color: 'text-neutral-900' },
            { label: 'Completed', value: doneCount, color: 'text-emerald-700' },
            { label: 'Remaining', value: remainingCount, color: 'text-amber-700' },
            { label: 'Active', value: activeCount, color: 'text-blue-700' },
            ...(highPriorityCount > 0 ? [{ label: 'High Priority', value: highPriorityCount, color: 'text-red-700' }] : []),
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white px-3 py-2 flex items-center gap-2">
              <span className="text-xs text-neutral-500">{stat.label}</span>
              <span className={`text-sm font-semibold ${stat.color}`}>{stat.value}</span>
            </div>
          ))}
        </div>
      )}

      {/* Task board */}
      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-8 text-center">
          <p className="text-sm text-neutral-500">No weekly tasks yet.</p>
          <p className="mt-1 text-xs text-neutral-400">Add the recurring social media tasks you want to repeat every week.</p>
          <button type="button" onClick={openAdd} className="mt-4 rounded-lg bg-neutral-900 px-4 py-2 text-xs font-medium text-white hover:bg-neutral-800 transition-colors">Add Task</button>
        </div>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((task) => {
            const title = displayTitle(task);
            return (
              <div key={task.id} className="rounded-xl border border-neutral-200 bg-white p-3 flex items-start gap-3">
                <input type="checkbox" checked={task.done} onChange={() => toggleDone(task)} className="mt-1 h-4 w-4 shrink-0 rounded border-neutral-300" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <DirectionalText text={title} className={`text-sm font-medium ${task.done ? 'text-neutral-400 line-through' : 'text-neutral-900'}`} />
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${TYPE_COLORS[task.type] || TYPE_COLORS.other}`}>{task.type}</span>
                    {task.targetCount != null && (
                      <span className="text-[10px] text-neutral-500">Target: {task.targetCount}</span>
                    )}
                    {task.priority && (
                      <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${PRIORITY_COLORS[task.priority]}`}>{task.priority}</span>
                    )}
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${task.done ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>{task.done ? 'done' : 'active'}</span>
                  </div>
                  {task.notes && (
                    <DirectionalText text={task.notes} className="mt-1 text-xs text-neutral-500 line-clamp-2" />
                  )}
                </div>
                <div className="flex gap-1 shrink-0">
                  <button type="button" onClick={() => openEdit(task)} className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] text-neutral-700 hover:bg-neutral-50 transition-colors">Edit</button>
                  <button type="button" onClick={() => handleDelete(task)} className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[10px] text-red-600 hover:bg-red-50 transition-colors">Delete</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit modal */}
      {modalMode && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20" onClick={closeModal}>
          <div className="w-full max-w-md rounded-2xl border border-neutral-200 bg-white p-5 shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">{modalMode === 'add' ? 'Add Task' : 'Edit Task'}</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-neutral-500 mb-1 block">Title *</label>
                <input value={formTitle} onChange={(e) => setFormTitle(e.target.value)} dir={detectTextDirection(formTitle)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(formTitle)}`} placeholder="اكتب 6 بوستات" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 mb-1 block">Type</label>
                  <select value={formType} onChange={(e) => setFormType(e.target.value as SocialWeeklyTask['type'])} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
                    {TYPE_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 mb-1 block">Target Count</label>
                  <input type="number" min="0" value={formTargetCount} onChange={(e) => setFormTargetCount(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" placeholder="6" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-neutral-500 mb-1 block">Priority</label>
                  <select value={formPriority} onChange={(e) => setFormPriority(e.target.value as typeof formPriority)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400">
                    <option value="">None</option>
                    {PRIORITY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-neutral-500 mb-1 block">Active</label>
                  <label className="flex items-center gap-2 h-9 px-3 rounded-md border border-neutral-200 bg-white cursor-pointer">
                    <input type="checkbox" checked={formIsActive} onChange={(e) => setFormIsActive(e.target.checked)} className="h-4 w-4 rounded border-neutral-300" />
                    <span className="text-sm text-neutral-900">{formIsActive ? 'Yes' : 'No'}</span>
                  </label>
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-neutral-500 mb-1 block">Notes</label>
                <textarea value={formNotes} onChange={(e) => setFormNotes(e.target.value)} dir={detectTextDirection(formNotes)} className={`w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 min-h-[60px] ${getDirectionClass(formNotes)}`} placeholder="Optional notes about this task..." />
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button type="button" onClick={handleSave} disabled={!formTitle.trim()} className="flex-1 rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-50">Save</button>
              <button type="button" onClick={closeModal} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Production Board View ──

interface ProductionBoardViewProps {
 contentItems: ContentItem[];
 socialPlatforms: SocialPlatform[];
 contentPillars: ContentPillar[];
 projects: Project[];
 smartNotes: SmartNote[];
 companies: Company[];
 onUpdateContentItem: (id: string, input: Partial<ContentItemInput>) => Promise<ContentItem>;
 onDeleteContentItem: (id: string) => Promise<void>;
}

function ProductionBoardView(props: ProductionBoardViewProps) {
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
  <DirectionalText text={item.title} className="text-sm font-medium text-neutral-900 break-words" as="div" />
  <div className="mt-1 flex flex-wrap gap-1">
  <span className="text-[10px] rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-neutral-600">{item.type}</span>
 {item.platformName && <span className="text-[10px] rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-neutral-600">{item.platformName}</span>}
 {item.pillarName && <span className="text-[10px] rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-neutral-600">{item.pillarName}</span>}
 </div>
 {item.publishDate && <div className="mt-1 text-[10px] text-neutral-500">Publish: {formatDate(item.publishDate)}</div>}
  {item.hook && <DirectionalText text={`"${item.hook}"`} className="mt-1 text-[10px] text-neutral-500 truncate" as="div" />}
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
}

// ── Calendar View ──

interface CalendarViewProps {
 contentItems: ContentItem[];
}

function CalendarView(props: CalendarViewProps) {
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
  <DirectionalText text={item.title} className="text-sm font-medium text-neutral-900 truncate" />
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
}

// ── Performance View ──

interface PerformanceViewProps {
 contentItems: ContentItem[];
 onUpdateContentItem: (id: string, input: Partial<ContentItemInput>) => Promise<ContentItem>;
 totalLeads: number;
}

function PerformanceView(props: PerformanceViewProps) {
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
 <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-2xl font-semibold text-neutral-900">{props.totalLeads.toLocaleString()}</div><div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Leads Generated</div></div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4"><div className="text-2xl font-semibold text-neutral-900">{published.length}</div><div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Published Items</div></div>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 {stats.byViews.length > 0 && (
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h3 className="text-sm font-semibold text-neutral-900">Best by Views</h3>
 <div className="mt-2 gap-2 text-sm">
 <div className="rounded-md bg-neutral-50 p-3">
  <DirectionalText text={stats.byViews[0].title} className="font-medium text-neutral-900" />
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
  <DirectionalText text={stats.byLeads[0].title} className="font-medium text-neutral-900" />
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
  <DirectionalText text={item.title} className="text-sm font-medium text-neutral-900" />
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
  <input value={name} onChange={(e) => setName(e.target.value)} required dir={detectTextDirection(name)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(name)}`} />
  </label>
  <label className="space-y-1.5">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Slug *</div>
  <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" dir="ltr" />
  </label>
  <label className="space-y-1.5">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">URL</div>
  <input value={url} onChange={(e) => setUrl(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" dir="ltr" />
  </label>
  <label className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 self-end">
  <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4" />
  <span className="text-sm text-neutral-900">Active</span>
  </label>
  <label className="space-y-1.5 md:col-span-2">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} dir={detectTextDirection(notes)} className={`w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(notes)}`} rows={2} />
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
  <input value={name} onChange={(e) => setName(e.target.value)} required dir={detectTextDirection(name)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(name)}`} />
  </label>
  <label className="space-y-1.5">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Slug *</div>
  <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" dir="ltr" />
  </label>
  <label className="space-y-1.5">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Description</div>
  <input value={description} onChange={(e) => setDescription(e.target.value)} dir={detectTextDirection(description)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(description)}`} />
  </label>
  <label className="space-y-1.5">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Target Audience</div>
  <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} dir={detectTextDirection(targetAudience)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(targetAudience)}`} />
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
  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} dir={detectTextDirection(notes)} className={`w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(notes)}`} rows={2} />
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
  <input value={name} onChange={(e) => setName(e.target.value)} required dir={detectTextDirection(name)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(name)}`} />
  </label>
  <label className="space-y-1.5">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Target Audience</div>
  <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} dir={detectTextDirection(targetAudience)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(targetAudience)}`} />
  </label>
  <label className="space-y-1.5">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Positioning</div>
  <input value={positioning} onChange={(e) => setPositioning(e.target.value)} dir={detectTextDirection(positioning)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(positioning)}`} />
  </label>
  <label className="space-y-1.5">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Main Promise</div>
  <input value={mainPromise} onChange={(e) => setMainPromise(e.target.value)} dir={detectTextDirection(mainPromise)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(mainPromise)}`} />
  </label>
  <label className="space-y-1.5">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Tone</div>
  <input value={tone} onChange={(e) => setTone(e.target.value)} dir={detectTextDirection(tone)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(tone)}`} />
  </label>
  <label className="space-y-1.5">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Languages</div>
  <input value={languages} onChange={(e) => setLanguages(e.target.value)} dir={detectTextDirection(languages)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(languages)}`} />
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
  <input value={activePlatforms} onChange={(e) => setActivePlatforms(e.target.value)} placeholder="e.g. LinkedIn, X, Instagram" dir={detectTextDirection(activePlatforms)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(activePlatforms)}`} />
  </label>
  <label className="space-y-1.5 md:col-span-2">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} dir={detectTextDirection(notes)} className={`w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(notes)}`} rows={2} />
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
  <input value={title} onChange={(e) => setTitle(e.target.value)} required dir={detectTextDirection(title)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(title)}`} />
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
  <input value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" dir="ltr" />
  </label>
  <label className="space-y-1.5">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Hook</div>
  <input value={hook} onChange={(e) => setHook(e.target.value)} dir={detectTextDirection(hook)} className={`h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(hook)}`} />
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
  <textarea value={content} onChange={(e) => setContent(e.target.value)} dir={detectTextDirection(content)} className={`w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(content)}`} rows={3} />
  </label>
  <label className="space-y-1.5 md:col-span-3">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Caption</div>
  <textarea value={caption} onChange={(e) => setCaption(e.target.value)} dir={detectTextDirection(caption)} className={`w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(caption)}`} rows={2} />
  </label>
  <label className="space-y-1.5 md:col-span-3">
  <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
  <textarea value={notes} onChange={(e) => setNotes(e.target.value)} dir={detectTextDirection(notes)} className={`w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400 ${getDirectionClass(notes)}`} rows={2} />
 </label>
 </div>
 <div className="flex gap-2 mt-4">
 <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-70">{saving ? 'Saving...' : 'Save'}</button>
 <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Cancel</button>
 </div>
 </form>
 );
}
