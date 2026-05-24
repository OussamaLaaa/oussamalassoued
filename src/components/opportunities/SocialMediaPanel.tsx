import React, { useMemo, useState } from 'react';
import type { SocialPlatform, ContentPillar, ContentStrategy, ContentItem, WeeklyContentPlan, Project, SmartNote, Company, SocialPlatformInput, ContentPillarInput, ContentStrategyInput, ContentItemInput, WeeklyContentPlanInput } from '../../types/opportunities';
import AISocialMediaAssistantPanel from './AISocialMediaAssistantPanel';

const SOCIAL_SECTION_KEYS = ['dashboard', 'strategy', 'platforms', 'pillars', 'ideas', 'weekly', 'production', 'calendar', 'performance', 'ai-assistant'] as const;
type SocialSection = typeof SOCIAL_SECTION_KEYS[number];

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

const statusColor = (status: string) => {
  const colors: Record<string, string> = {
    idea: 'bg-purple-100 text-purple-800',
    drafted: 'bg-gray-100 text-gray-800',
    designing: 'bg-blue-100 text-blue-800',
    recording: 'bg-orange-100 text-orange-800',
    editing: 'bg-yellow-100 text-yellow-800',
    ready: 'bg-green-100 text-green-800',
    scheduled: 'bg-indigo-100 text-indigo-800',
    published: 'bg-emerald-100 text-emerald-800',
    repurpose: 'bg-teal-100 text-teal-800',
    archived: 'bg-gray-100 text-gray-500',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
};

const priorityColor = (priority: string) => {
  const colors: Record<string, string> = {
    high: 'text-red-600 bg-red-50',
    medium: 'text-amber-600 bg-amber-50',
    low: 'text-slate-600 bg-slate-50',
  };
  return colors[priority] || 'text-slate-600 bg-slate-50';
};

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
  const [section, setSection] = useState<SocialSection>('dashboard');
  const [formMode, setFormMode] = useState<{ type: string; id?: string } | null>(null);

  const now = new Date();
  const [selectedWeek, setSelectedWeek] = useState(() => WEEK_START(now));

  const todayStr = now.toISOString().slice(0, 10);

  const sectionNav = (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {SOCIAL_SECTION_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => setSection(key)}
          className={`px-3 py-1.5 text-xs rounded-md font-medium transition-all ${section === key ? 'bg-[#0f172a] text-white' : 'bg-white text-[#475569] border border-[#e5e7eb] hover:bg-[#f8fafc]'}`}
        >
          {key === 'weekly' ? 'Weekly Plan' : key === 'ai-assistant' ? 'AI Assistant' : key.charAt(0).toUpperCase() + key.slice(1)}
        </button>
      ))}
    </div>
  );

  const loadingSpinner = <div className="text-xs text-[#64748b] py-10 text-center">Loading...</div>;

  if (section === 'dashboard') return <SocialDashboard {...props} sectionNav={sectionNav} onSetFormMode={setFormMode} formMode={formMode} />;
  if (section === 'strategy') return <StrategySection {...props} sectionNav={sectionNav} onSetFormMode={setFormMode} formMode={formMode} />;
  if (section === 'platforms') return <PlatformsSection {...props} sectionNav={sectionNav} onSetFormMode={setFormMode} formMode={formMode} />;
  if (section === 'pillars') return <PillarsSection {...props} sectionNav={sectionNav} onSetFormMode={setFormMode} formMode={formMode} />;
  if (section === 'ideas') return <IdeasSection {...props} sectionNav={sectionNav} onSetFormMode={setFormMode} formMode={formMode} />;
  if (section === 'weekly') return <WeeklyPlanSection {...props} sectionNav={sectionNav} onSetFormMode={setFormMode} formMode={formMode} selectedWeek={selectedWeek} onSetSelectedWeek={setSelectedWeek} />;
  if (section === 'production') return <ProductionBoard {...props} sectionNav={sectionNav} onSetFormMode={setFormMode} formMode={formMode} />;
  if (section === 'calendar') return <CalendarSection {...props} sectionNav={sectionNav} onSetFormMode={setFormMode} formMode={formMode} />;
  if (section === 'performance') return <PerformanceSection {...props} sectionNav={sectionNav} />;
  if (section === 'ai-assistant') return <AIAssistantSection {...props} sectionNav={sectionNav} />;
  return null;
}

interface SectionProps extends SocialMediaPanelProps {
  sectionNav: React.ReactNode;
  onSetFormMode?: (mode: { type: string; id?: string } | null) => void;
  formMode?: { type: string; id?: string } | null;
  selectedWeek?: string;
  onSetSelectedWeek?: (week: string) => void;
}

// ── Dashboard ──

function SocialDashboard({ contentItems, contentStrategies, weeklyContentPlans, sectionNav, onSetFormMode }: SectionProps) {
  const now = new Date();
  const currentWeek = WEEK_START(now);

  const thisWeekItems = useMemo(() => contentItems.filter((item) => item.weekStart === currentWeek), [contentItems, currentWeek]);
  const publishedThisWeek = useMemo(() => thisWeekItems.filter((item) => item.status === 'published'), [thisWeekItems]);
  const plannedPosts = useMemo(() => thisWeekItems.filter((item) => item.status === 'scheduled' || item.status === 'ready'), [thisWeekItems]);
  const ideasCount = useMemo(() => contentItems.filter((item) => item.status === 'idea').length, [contentItems]);
  const inProduction = useMemo(() => contentItems.filter((item) => ['drafted', 'designing', 'recording', 'editing'].includes(item.status)).length, [contentItems]);
  const readyToPublish = useMemo(() => contentItems.filter((item) => item.status === 'ready').length, [contentItems]);
  const totalLeads = useMemo(() => contentItems.reduce((sum, item) => sum + (item.leadsGenerated || 0), 0), [contentItems]);

  const plan = useMemo(() => weeklyContentPlans.find((p) => p.weekStart === currentWeek), [weeklyContentPlans, currentWeek]);
  const activeStrategy = contentStrategies[0];

  const cards = [
    { label: 'Content This Week', value: thisWeekItems.length, color: 'bg-[#0f172a]' },
    { label: 'Published This Week', value: publishedThisWeek.length, color: 'bg-emerald-600' },
    { label: 'Planned Posts', value: plannedPosts.length, color: 'bg-indigo-600' },
    { label: 'Planned Videos', value: plan?.targetVideos || 0, color: 'bg-violet-600' },
    { label: 'Ideas Bank', value: ideasCount, color: 'bg-purple-600' },
    { label: 'In Production', value: inProduction, color: 'bg-amber-600' },
    { label: 'Ready to Publish', value: readyToPublish, color: 'bg-green-600' },
    { label: 'Leads Generated', value: totalLeads, color: 'bg-blue-600' },
  ];

  return (
    <div>
      {sectionNav}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {cards.map((card) => (
          <div key={card.label} className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm">
            <div className={`w-8 h-1 rounded-full mb-2 ${card.color}`} />
            <div className="text-2xl font-bold text-[#0f172a]">{card.value}</div>
            <div className="text-xs text-[#64748b] mt-1">{card.label}</div>
          </div>
        ))}
      </div>
      {activeStrategy && (
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm mb-4">
          <div className="text-sm font-semibold text-[#0f172a] mb-1">{activeStrategy.name}</div>
          <div className="text-xs text-[#64748b]">{activeStrategy.positioning || 'No positioning set'}</div>
        </div>
      )}
      {!activeStrategy && (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-4 text-center">
          <div className="text-sm text-[#64748b]">No content strategy yet.</div>
          <button onClick={() => onSetFormMode?.({ type: 'strategy' })} className="mt-2 text-xs px-4 py-2 rounded-md bg-[#0f172a] text-white hover:bg-[#1e293b]">
            Create Strategy
          </button>
        </div>
      )}
    </div>
  );
}

// ── Strategy Section ──

function StrategySection({ contentStrategies, onAddContentStrategy, onUpdateContentStrategy, onDeleteContentStrategy, sectionNav, onSetFormMode, formMode }: SectionProps) {
  const [editing, setEditing] = useState<{ id?: string; data?: Partial<ContentStrategyInput> } | null>(null);

  const handleSave = async (input: ContentStrategyInput) => {
    if (editing?.id) {
      await onUpdateContentStrategy(editing.id, input);
    } else {
      await onAddContentStrategy(input);
    }
    setEditing(null);
  };

  if (editing) {
    return (
      <div>
        {sectionNav}
        <ContentStrategyForm
          initial={editing.data}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div>
      {sectionNav}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#0f172a]">Content Strategy</h3>
        {contentStrategies.length === 0 && (
          <button onClick={() => setEditing({})} className="text-xs px-3 py-1.5 rounded-md bg-[#0f172a] text-white">Add Strategy</button>
        )}
      </div>
      {contentStrategies.length === 0 && (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-6 text-center text-sm text-[#64748b]">
          No content strategy defined. Create one to guide your content efforts.
        </div>
      )}
      {contentStrategies.map((strategy) => (
        <div key={strategy.id} className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm mb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-[#0f172a]">{strategy.name}</div>
              {strategy.positioning && <div className="text-xs text-[#64748b] mt-1">Positioning: {strategy.positioning}</div>}
              {strategy.mainPromise && <div className="text-xs text-[#64748b] mt-0.5">Promise: {strategy.mainPromise}</div>}
              {strategy.tone && <div className="text-xs text-[#64748b] mt-0.5">Tone: {strategy.tone}</div>}
              {strategy.targetAudience && <div className="text-xs text-[#64748b] mt-0.5">Audience: {strategy.targetAudience}</div>}
              {strategy.languages && <div className="text-xs text-[#64748b] mt-0.5">Languages: {strategy.languages}</div>}
              {strategy.activePlatforms && <div className="text-xs text-[#64748b] mt-0.5">Platforms: {strategy.activePlatforms}</div>}
              <div className="flex gap-3 mt-2 text-xs text-[#64748b]">
                {strategy.weeklyPostTarget != null && <span>Posts/week: {strategy.weeklyPostTarget}</span>}
                {strategy.weeklyVideoTarget != null && <span>Videos/week: {strategy.weeklyVideoTarget}</span>}
              </div>
            </div>
            <div className="flex gap-1">
              <button onClick={() => setEditing({ id: strategy.id, data: strategy })} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] text-[#0f172a] hover:bg-[#f8fafc]">Edit</button>
              <button onClick={() => { if (window.confirm('Delete this strategy?')) onDeleteContentStrategy(strategy.id); }} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] text-red-600 hover:bg-red-50">Delete</button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Platforms Section ──

function PlatformsSection({ socialPlatforms, onAddSocialPlatform, onUpdateSocialPlatform, onDeleteSocialPlatform, sectionNav, onSetFormMode, formMode }: SectionProps) {
  const [editing, setEditing] = useState<{ id?: string; data?: Partial<SocialPlatformInput> } | null>(null);

  const createDefaults = async () => {
    for (const p of DEFAULT_PLATFORMS) {
      await onAddSocialPlatform({ name: p.name, slug: p.slug, isActive: true });
    }
  };

  const handleSave = async (input: SocialPlatformInput) => {
    if (editing?.id) {
      await onUpdateSocialPlatform(editing.id, input);
    } else {
      await onAddSocialPlatform(input);
    }
    setEditing(null);
  };

  if (editing) {
    return (
      <div>
        {sectionNav}
        <SocialPlatformForm
          initial={editing.data}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div>
      {sectionNav}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#0f172a]">Platforms</h3>
        <div className="flex gap-2">
          {socialPlatforms.length === 0 && (
            <button onClick={createDefaults} className="text-xs px-3 py-1.5 rounded-md bg-[#0f172a] text-white">Create Default Platforms</button>
          )}
          <button onClick={() => setEditing({})} className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] bg-white text-[#0f172a]">Add Platform</button>
        </div>
      </div>
      {socialPlatforms.length === 0 && (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-6 text-center text-sm text-[#64748b]">
          No platforms yet. Create default platforms or add your own.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {socialPlatforms.map((platform) => (
          <div key={platform.id} className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-[#0f172a]">{platform.name}</div>
              <div className="text-xs text-[#64748b]">/{platform.slug}</div>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-0.5 rounded-full ${platform.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{platform.isActive ? 'Active' : 'Inactive'}</span>
              <button onClick={() => setEditing({ id: platform.id, data: platform })} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] text-[#0f172a] hover:bg-[#f8fafc]">Edit</button>
              <button onClick={() => { if (window.confirm('Delete this platform?')) onDeleteSocialPlatform(platform.id); }} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] text-red-600 hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Pillars Section ──

function PillarsSection({ contentPillars, onAddContentPillar, onUpdateContentPillar, onDeleteContentPillar, sectionNav }: SectionProps) {
  const [editing, setEditing] = useState<{ id?: string; data?: Partial<ContentPillarInput> } | null>(null);

  const createStarterPillars = async () => {
    for (const p of STARTER_PILLARS) {
      const exists = contentPillars.some((cp) => cp.slug === p.slug);
      if (!exists) {
        await onAddContentPillar({ name: p.name, slug: p.slug, description: p.description, priority: 'medium', isActive: true });
      }
    }
  };

  const handleSave = async (input: ContentPillarInput) => {
    if (editing?.id) {
      await onUpdateContentPillar(editing.id, input);
    } else {
      await onAddContentPillar(input);
    }
    setEditing(null);
  };

  if (editing) {
    return (
      <div>
        {sectionNav}
        <ContentPillarForm
          initial={editing.data}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div>
      {sectionNav}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#0f172a]">Content Pillars</h3>
        <div className="flex gap-2">
          {contentPillars.length === 0 && (
            <button onClick={createStarterPillars} className="text-xs px-3 py-1.5 rounded-md bg-[#0f172a] text-white">Create Starter Content Pillars</button>
          )}
          <button onClick={() => setEditing({})} className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] bg-white text-[#0f172a]">Add Pillar</button>
        </div>
      </div>
      {contentPillars.length === 0 && (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-6 text-center text-sm text-[#64748b]">
          No pillars yet. Create starter pillars or add your own.
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {contentPillars.map((pillar) => (
          <div key={pillar.id} className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-[#0f172a]">{pillar.name}</div>
                <div className="text-xs text-[#64748b]">/{pillar.slug}</div>
                {pillar.description && <div className="text-xs text-[#64748b] mt-1">{pillar.description}</div>}
                {pillar.targetAudience && <div className="text-xs text-[#64748b] mt-0.5">Audience: {pillar.targetAudience}</div>}
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${priorityColor(pillar.priority)}`}>{pillar.priority}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${pillar.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{pillar.isActive ? 'Active' : 'Inactive'}</span>
              </div>
            </div>
            <div className="flex gap-1 mt-2">
              <button onClick={() => setEditing({ id: pillar.id, data: pillar })} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] text-[#0f172a] hover:bg-[#f8fafc]">Edit</button>
              <button onClick={() => { if (window.confirm('Delete this pillar?')) onDeleteContentPillar(pillar.id); }} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] text-red-600 hover:bg-red-50">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Ideas Section ──

function IdeasSection({ contentItems, socialPlatforms, contentPillars, projects, smartNotes, companies, onAddContentItem, onUpdateContentItem, onDeleteContentItem, sectionNav, onSetFormMode, formMode }: SectionProps) {
  const [editing, setEditing] = useState<{ id?: string; data?: Partial<ContentItemInput> } | null>(null);

  const ideas = useMemo(() => contentItems.filter((item) => item.status === 'idea'), [contentItems]);

  const handleSave = async (input: ContentItemInput) => {
    if (editing?.id) {
      await onUpdateContentItem(editing.id, { ...input, status: 'idea' });
    } else {
      await onAddContentItem({ ...input, status: 'idea' });
    }
    setEditing(null);
  };

  if (editing) {
    return (
      <div>
        {sectionNav}
        <ContentItemForm
          initial={editing.data}
          socialPlatforms={socialPlatforms}
          contentPillars={contentPillars}
          projects={projects}
          smartNotes={smartNotes}
          companies={companies}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div>
      {sectionNav}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-[#0f172a]">Ideas Bank</h3>
        <button onClick={() => setEditing({})} className="text-xs px-3 py-1.5 rounded-md bg-[#0f172a] text-white">Add Idea</button>
      </div>
      {ideas.length === 0 && (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-6 text-center text-sm text-[#64748b]">
          No ideas yet. Add your first content idea.
        </div>
      )}
      <div className="space-y-2">
        {ideas.map((item) => (
          <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-[#0f172a]">{item.title}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${priorityColor(item.priority)}`}>{item.priority}</span>
                </div>
                <div className="flex flex-wrap gap-2 mt-1 text-xs text-[#64748b]">
                  <span className="bg-gray-100 px-1.5 py-0.5 rounded">{item.type}</span>
                  {item.platformName && <span>{item.platformName}</span>}
                  {item.pillarName && <span>{item.pillarName}</span>}
                  {item.hook && <span className="italic">&ldquo;{item.hook.slice(0, 60)}&rdquo;</span>}
                </div>
              </div>
              <div className="flex gap-1 ml-2">
                <button onClick={() => setEditing({ id: item.id, data: item })} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] text-[#0f172a] hover:bg-[#f8fafc]">Edit</button>
                <button onClick={() => { if (window.confirm('Delete this idea?')) onDeleteContentItem(item.id); }} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] text-red-600 hover:bg-red-50">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Weekly Plan Section ──

function WeeklyPlanSection({ contentItems, weeklyContentPlans, socialPlatforms, contentPillars, projects, smartNotes, companies, onAddWeeklyContentPlan, onUpdateWeeklyContentPlan, onDeleteWeeklyContentPlan, onUpdateContentItem, sectionNav, selectedWeek = '', onSetSelectedWeek }: SectionProps) {
  const plan = useMemo(() => weeklyContentPlans.find((p) => p.weekStart === selectedWeek), [weeklyContentPlans, selectedWeek]);
  const weekItems = useMemo(() => contentItems.filter((item) => item.weekStart === selectedWeek), [contentItems, selectedWeek]);
  const unassignedItems = useMemo(() => contentItems.filter((item) => !item.weekStart || item.weekStart === ''), [contentItems]);

  const [editing, setEditing] = useState<boolean>(false);
  const [formData, setFormData] = useState<Partial<WeeklyContentPlanInput>>({});

  const handleSavePlan = async () => {
    if (plan) {
      await onUpdateWeeklyContentPlan(plan.id, { ...formData, weekStart: selectedWeek });
    } else {
      await onAddWeeklyContentPlan({ ...formData, weekStart: selectedWeek } as WeeklyContentPlanInput);
    }
    setEditing(false);
  };

  const assignToWeek = async (itemId: string) => {
    await onUpdateContentItem(itemId, { weekStart: selectedWeek });
  };

  return (
    <div>
      {sectionNav}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <button onClick={() => onSetSelectedWeek?.(addWeeks(selectedWeek, -1))} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] bg-white text-[#0f172a]">&larr; Prev</button>
          <span className="text-sm font-semibold text-[#0f172a]">Week of {formatDate(selectedWeek)}</span>
          <button onClick={() => onSetSelectedWeek?.(addWeeks(selectedWeek, 1))} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] bg-white text-[#0f172a]">Next &rarr;</button>
          <button onClick={() => onSetSelectedWeek?.(WEEK_START(new Date()))} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] bg-white text-[#0f172a]">This Week</button>
        </div>
        <button onClick={() => { setFormData(plan || { weekStart: selectedWeek }); setEditing(true); }} className="text-xs px-3 py-1.5 rounded-md bg-[#0f172a] text-white">
          {plan ? 'Edit Plan' : 'Create Plan'}
        </button>
      </div>

      {editing && (
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm mb-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Focus</label>
              <input value={formData.focus || ''} onChange={(e) => setFormData((prev) => ({ ...prev, focus: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Target Posts</label>
              <input type="number" min="0" value={formData.targetPosts ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, targetPosts: e.target.value ? Number(e.target.value) : undefined }))} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Target Videos</label>
              <input type="number" min="0" value={formData.targetVideos ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, targetVideos: e.target.value ? Number(e.target.value) : undefined }))} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Target Carousels</label>
              <input type="number" min="0" value={formData.targetCarousels ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, targetCarousels: e.target.value ? Number(e.target.value) : undefined }))} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Target Other</label>
              <input type="number" min="0" value={formData.targetOther ?? ''} onChange={(e) => setFormData((prev) => ({ ...prev, targetOther: e.target.value ? Number(e.target.value) : undefined }))} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
            </div>
            <div>
              <label className="text-xs text-[#64748b] block mb-1">Review Notes</label>
              <input value={formData.reviewNotes || ''} onChange={(e) => setFormData((prev) => ({ ...prev, reviewNotes: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleSavePlan} className="text-xs px-3 py-1.5 rounded-md bg-[#0f172a] text-white">Save</button>
            <button onClick={() => setEditing(false)} className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] text-[#0f172a]">Cancel</button>
          </div>
        </div>
      )}

      {plan && !editing && (
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm mb-4">
          <div className="text-xs text-[#64748b]">
            {plan.focus && <div>Focus: {plan.focus}</div>}
            <div className="flex gap-3 mt-1">
              <span>Posts: {plan.targetPosts ?? '-'}</span>
              <span>Videos: {plan.targetVideos ?? '-'}</span>
              <span>Carousels: {plan.targetCarousels ?? '-'}</span>
              <span>Other: {plan.targetOther ?? '-'}</span>
            </div>
            {plan.reviewNotes && <div className="mt-1">Review: {plan.reviewNotes}</div>}
          </div>
        </div>
      )}

      <div className="text-xs font-semibold text-[#0f172a] mb-2">Content Items This Week ({weekItems.length})</div>
      {weekItems.length === 0 && <div className="text-xs text-[#64748b] mb-3">No items assigned to this week.</div>}
      <div className="space-y-2 mb-4">
        {weekItems.map((item) => (
          <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-white p-2 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-1.5 py-0.5 rounded ${statusColor(item.status)}`}>{item.status}</span>
              <span className="text-xs font-medium text-[#0f172a]">{item.title}</span>
              <span className="text-xs text-[#64748b]">{item.type}</span>
            </div>
          </div>
        ))}
      </div>

      {unassignedItems.length > 0 && (
        <>
          <div className="text-xs font-semibold text-[#0f172a] mb-2">Unassigned Items</div>
          <div className="space-y-2">
            {unassignedItems.map((item) => (
              <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-2 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-1.5 py-0.5 rounded ${statusColor(item.status)}`}>{item.status}</span>
                  <span className="text-xs font-medium text-[#0f172a]">{item.title}</span>
                </div>
                <button onClick={() => assignToWeek(item.id)} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] bg-white text-[#0f172a]">Assign to Week</button>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Production Board ──

function ProductionBoard({ contentItems, socialPlatforms, contentPillars, projects, smartNotes, companies, onUpdateContentItem, onDeleteContentItem, sectionNav, onSetFormMode, formMode }: SectionProps) {
  const [editing, setEditing] = useState<{ id?: string; data?: Partial<ContentItemInput> } | null>(null);

  const groupedByStatus = useMemo(() => {
    const groups: Record<string, ContentItem[]> = {};
    for (const item of contentItems) {
      const key = item.status;
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    }
    return groups;
  }, [contentItems]);

  const handleSave = async (input: ContentItemInput) => {
    if (editing?.id) {
      await onUpdateContentItem(editing.id, input);
    }
    setEditing(null);
  };

  const moveStatus = async (itemId: string, status: string) => {
    await onUpdateContentItem(itemId, { status: status as any });
  };

  if (editing) {
    return (
      <div>
        {sectionNav}
        <ContentItemForm
          initial={editing.data}
          socialPlatforms={socialPlatforms}
          contentPillars={contentPillars}
          projects={projects}
          smartNotes={smartNotes}
          companies={companies}
          onSave={handleSave}
          onCancel={() => setEditing(null)}
        />
      </div>
    );
  }

  return (
    <div>
      {sectionNav}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {CONTENT_STATUSES.map((status) => {
          const items = groupedByStatus[status] || [];
          return (
            <div key={status} className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
              <div className={`px-3 py-2 border-b border-[#e5e7eb] flex items-center justify-between ${statusColor(status).split(' ')[0]} bg-opacity-30 rounded-t-lg`}>
                <span className="text-xs font-semibold text-[#0f172a] capitalize">{status}</span>
                <span className="text-xs text-[#64748b]">{items.length}</span>
              </div>
              <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                {items.length === 0 && <div className="text-xs text-[#64748b] text-center py-4">No items</div>}
                {items.map((item) => (
                  <div key={item.id} className="rounded border border-[#e5e7eb] p-2 bg-[#f8fafc]">
                    <div className="text-xs font-medium text-[#0f172a]">{item.title}</div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-[#64748b]">{item.type}</span>
                      {item.platformName && <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-[#64748b]">{item.platformName}</span>}
                      {item.pillarName && <span className="text-[10px] px-1 py-0.5 rounded bg-gray-100 text-[#64748b]">{item.pillarName}</span>}
                    </div>
                    {item.publishDate && <div className="text-[10px] text-[#64748b] mt-1">Publish: {formatDate(item.publishDate)}</div>}
                    <div className="flex gap-1 mt-1.5">
                      <button onClick={() => setEditing({ id: item.id, data: item })} className="text-[10px] px-1.5 py-0.5 rounded border border-[#e5e7eb] text-[#0f172a] hover:bg-white">Edit</button>
                      <select
                        value={item.status}
                        onChange={(e) => moveStatus(item.id, e.target.value)}
                        className="text-[10px] px-1 py-0.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a]"
                      >
                        {CONTENT_STATUSES.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                      <button onClick={() => { if (window.confirm('Delete?')) onDeleteContentItem(item.id); }} className="text-[10px] px-1.5 py-0.5 rounded border border-[#e5e7eb] text-red-600 hover:bg-red-50">Del</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Calendar Section ──

function CalendarSection({ contentItems, socialPlatforms, contentPillars, projects, smartNotes, companies, onUpdateContentItem, sectionNav }: SectionProps) {
  const itemsWithDate = useMemo(() => contentItems.filter((item) => item.publishDate).sort((a, b) => (a.publishDate || '').localeCompare(b.publishDate || '')), [contentItems]);

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
    <div>
      {sectionNav}
      <h3 className="text-sm font-semibold text-[#0f172a] mb-4">Content Calendar</h3>
      {Object.keys(groupedByDate).length === 0 && (
        <div className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-6 text-center text-sm text-[#64748b]">
          No scheduled content. Set a publish date on content items to see them here.
        </div>
      )}
      <div className="space-y-3">
        {Object.entries(groupedByDate).map(([date, items]) => (
          <div key={date} className="rounded-lg border border-[#e5e7eb] bg-white shadow-sm">
            <div className="px-3 py-2 border-b border-[#e5e7eb] bg-[#f8fafc]">
              <span className="text-xs font-semibold text-[#0f172a]">{formatDate(date)}</span>
            </div>
            <div className="p-2 space-y-1">
              {items.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 rounded bg-[#f8fafc]">
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-1.5 py-0.5 rounded ${statusColor(item.status)}`}>{item.status}</span>
                    <span className="text-xs font-medium text-[#0f172a]">{item.title}</span>
                    <span className="text-xs text-[#64748b]">{item.type}</span>
                    {item.platformName && <span className="text-xs text-[#64748b]">{item.platformName}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Performance Section ──

function PerformanceSection({ contentItems, sectionNav }: SectionProps) {
  const published = useMemo(() => contentItems.filter((item) => item.status === 'published'), [contentItems]);

  const stats = useMemo(() => {
    const totalViews = published.reduce((sum, item) => sum + (item.performanceViews || 0), 0);
    const totalLikes = published.reduce((sum, item) => sum + (item.performanceLikes || 0), 0);
    const totalLeads = published.reduce((sum, item) => sum + (item.leadsGenerated || 0), 0);
    const totalComments = published.reduce((sum, item) => sum + (item.performanceComments || 0), 0);
    const totalShares = published.reduce((sum, item) => sum + (item.performanceShares || 0), 0);
    const byViews = [...published].sort((a, b) => (b.performanceViews || 0) - (a.performanceViews || 0));
    const byLeads = [...published].sort((a, b) => (b.leadsGenerated || 0) - (a.leadsGenerated || 0));
    return { totalViews, totalLikes, totalLeads, totalComments, totalShares, byViews, byLeads };
  }, [published]);

  const [editPerf, setEditPerf] = useState<string | null>(null);
  const [perfData, setPerfData] = useState<Partial<ContentItemInput>>({});

  const handleSavePerf = async (item: ContentItem) => {
    if (editPerf) {
      await onUpdateContentItem(item.id, perfData);
      setEditPerf(null);
    }
  };

  return (
    <div>
      {sectionNav}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm">
          <div className="text-lg font-bold text-[#0f172a]">{stats.totalViews.toLocaleString()}</div>
          <div className="text-xs text-[#64748b]">Total Views</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm">
          <div className="text-lg font-bold text-[#0f172a]">{stats.totalLikes.toLocaleString()}</div>
          <div className="text-xs text-[#64748b]">Total Likes</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm">
          <div className="text-lg font-bold text-[#0f172a]">{stats.totalComments.toLocaleString()}</div>
          <div className="text-xs text-[#64748b]">Total Comments</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm">
          <div className="text-lg font-bold text-[#0f172a]">{stats.totalShares.toLocaleString()}</div>
          <div className="text-xs text-[#64748b]">Total Shares</div>
        </div>
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm">
          <div className="text-lg font-bold text-[#0f172a]">{stats.totalLeads.toLocaleString()}</div>
          <div className="text-xs text-[#64748b]">Total Leads</div>
        </div>
      </div>

      {stats.byViews.length > 0 && (
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm mb-3">
          <div className="text-xs font-semibold text-[#0f172a] mb-2">Best by Views</div>
          <div className="text-xs text-[#0f172a] font-medium">{stats.byViews[0].title}</div>
          <div className="text-xs text-[#64748b]">{stats.byViews[0].performanceViews?.toLocaleString()} views</div>
        </div>
      )}

      {stats.byLeads.length > 0 && (
        <div className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm mb-3">
          <div className="text-xs font-semibold text-[#0f172a] mb-2">Best by Leads</div>
          <div className="text-xs text-[#0f172a] font-medium">{stats.byLeads[0].title}</div>
          <div className="text-xs text-[#64748b]">{stats.byLeads[0].leadsGenerated} leads</div>
        </div>
      )}

      <div className="text-xs font-semibold text-[#0f172a] mb-2 mt-4">Published Content ({published.length})</div>
      <div className="space-y-2">
        {published.map((item) => (
          <div key={item.id} className="rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-sm font-medium text-[#0f172a]">{item.title}</div>
                <div className="text-xs text-[#64748b]">{item.type} | {item.platformName || 'No platform'}</div>
              </div>
              <button onClick={() => { setEditPerf(item.id); setPerfData(item); }} className="text-xs px-2 py-1 rounded border border-[#e5e7eb] text-[#0f172a]">Edit Perf</button>
            </div>
            {editPerf === item.id && (
              <div className="mt-3 grid grid-cols-3 md:grid-cols-4 gap-2 p-3 bg-[#f8fafc] rounded border border-[#e5e7eb]">
                {(['performanceViews', 'performanceLikes', 'performanceComments', 'performanceShares', 'performanceSaves', 'performanceClicks', 'leadsGenerated'] as const).map((field) => (
                  <div key={field}>
                    <label className="text-[10px] text-[#64748b] block">{field.replace('performance', '').toLowerCase()}</label>
                    <input
                      type="number" min="0"
                      value={(perfData as any)[field] ?? ''}
                      onChange={(e) => setPerfData((prev) => ({ ...prev, [field]: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full text-xs px-1.5 py-1 rounded border border-[#e5e7eb]"
                    />
                  </div>
                ))}
                <div className="col-span-full flex gap-2 mt-1">
                  <button onClick={() => handleSavePerf(item)} className="text-xs px-3 py-1.5 rounded-md bg-[#0f172a] text-white">Save</button>
                  <button onClick={() => setEditPerf(null)} className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] text-[#0f172a]">Cancel</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Forms ──

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
    <form onSubmit={handleSubmit} className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm mb-4">
      <h4 className="text-sm font-semibold text-[#0f172a] mb-3">{initial?.id ? 'Edit' : 'Add'} Platform</h4>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Slug *</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">URL</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div className="flex items-center gap-2 pt-4">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} id="sp-active" />
          <label htmlFor="sp-active" className="text-xs text-[#64748b]">Active</label>
        </div>
      </div>
      <div className="mb-3">
        <label className="text-xs text-[#64748b] block mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" rows={2} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="text-xs px-3 py-1.5 rounded-md bg-[#0f172a] text-white">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] text-[#0f172a]">Cancel</button>
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
    <form onSubmit={handleSubmit} className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm mb-4">
      <h4 className="text-sm font-semibold text-[#0f172a] mb-3">{initial?.id ? 'Edit' : 'Add'} Pillar</h4>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Slug *</label>
          <input value={slug} onChange={(e) => setSlug(e.target.value)} required className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Description</label>
          <input value={description} onChange={(e) => setDescription(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Target Audience</label>
          <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="flex items-center gap-2 pt-4">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} id="cp-active" />
          <label htmlFor="cp-active" className="text-xs text-[#64748b]">Active</label>
        </div>
      </div>
      <div className="mb-3">
        <label className="text-xs text-[#64748b] block mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" rows={2} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="text-xs px-3 py-1.5 rounded-md bg-[#0f172a] text-white">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] text-[#0f172a]">Cancel</button>
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
    <form onSubmit={handleSubmit} className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm mb-4">
      <h4 className="text-sm font-semibold text-[#0f172a] mb-3">{initial?.id ? 'Edit' : 'Add'} Strategy</h4>
      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="col-span-2">
          <label className="text-xs text-[#64748b] block mb-1">Name *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Target Audience</label>
          <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Positioning</label>
          <input value={positioning} onChange={(e) => setPositioning(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Main Promise</label>
          <input value={mainPromise} onChange={(e) => setMainPromise(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Tone</label>
          <input value={tone} onChange={(e) => setTone(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Languages</label>
          <input value={languages} onChange={(e) => setLanguages(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Weekly Post Target</label>
          <input type="number" min="0" value={weeklyPostTarget} onChange={(e) => setWeeklyPostTarget(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Weekly Video Target</label>
          <input type="number" min="0" value={weeklyVideoTarget} onChange={(e) => setWeeklyVideoTarget(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Active Platforms</label>
          <input value={activePlatforms} onChange={(e) => setActivePlatforms(e.target.value)} placeholder="e.g. LinkedIn, X, Instagram" className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
      </div>
      <div className="mb-3">
        <label className="text-xs text-[#64748b] block mb-1">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" rows={2} />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="text-xs px-3 py-1.5 rounded-md bg-[#0f172a] text-white">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] text-[#0f172a]">Cancel</button>
      </div>
    </form>
  );
}

function AIAssistantSection({ contentStrategies, socialPlatforms, contentPillars, contentItems, weeklyContentPlans, smartNotes, projects, onAddContentItem, onUpdateContentItem, onAddWeeklyContentPlan, sectionNav }: SectionProps) {
  return (
    <div>
      {sectionNav}
      <AISocialMediaAssistantPanel
        strategies={contentStrategies}
        platforms={socialPlatforms}
        pillars={contentPillars}
        contentItems={contentItems}
        weeklyContentPlans={weeklyContentPlans}
        smartNotes={smartNotes}
        projects={projects}
        onCreateContentItem={onAddContentItem}
        onUpdateContentItem={onUpdateContentItem}
        onCreateWeeklyPlan={onAddWeeklyContentPlan}
      />
    </div>
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
    <form onSubmit={handleSubmit} className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-sm mb-4">
      <h4 className="text-sm font-semibold text-[#0f172a] mb-3">{initial?.id ? 'Edit' : 'Add'} Content</h4>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-3">
        <div className="col-span-full">
          <label className="text-xs text-[#64748b] block mb-1">Title *</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Type</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]">
            {CONTENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Priority</label>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]">
            {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]">
            {CONTENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Platform</label>
          <select value={platformId} onChange={(e) => setPlatformId(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]">
            <option value="">None</option>
            {socialPlatforms.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Pillar</label>
          <select value={pillarId} onChange={(e) => setPillarId(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]">
            <option value="">None</option>
            {contentPillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Publish Date</label>
          <input type="date" value={publishDate} onChange={(e) => setPublishDate(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Week Start</label>
          <input type="date" value={weekStart} onChange={(e) => setWeekStart(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Asset URL</label>
          <input value={assetUrl} onChange={(e) => setAssetUrl(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Hook</label>
          <input value={hook} onChange={(e) => setHook(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" />
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Linked Project</label>
          <select value={linkedProjectId} onChange={(e) => setLinkedProjectId(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]">
            <option value="">None</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Linked Note</label>
          <select value={linkedNoteId} onChange={(e) => setLinkedNoteId(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]">
            <option value="">None</option>
            {smartNotes.map((n) => <option key={n.id} value={n.id}>{n.title}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs text-[#64748b] block mb-1">Linked Company</label>
          <select value={linkedCompanyId} onChange={(e) => setLinkedCompanyId(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]">
            <option value="">None</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>
        <div className="col-span-full">
          <label className="text-xs text-[#64748b] block mb-1">Content</label>
          <textarea value={content} onChange={(e) => setContent(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" rows={3} />
        </div>
        <div className="col-span-full">
          <label className="text-xs text-[#64748b] block mb-1">Caption</label>
          <textarea value={caption} onChange={(e) => setCaption(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" rows={2} />
        </div>
        <div className="col-span-full">
          <label className="text-xs text-[#64748b] block mb-1">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded border border-[#e5e7eb]" rows={2} />
        </div>
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="text-xs px-3 py-1.5 rounded-md bg-[#0f172a] text-white">{saving ? 'Saving...' : 'Save'}</button>
        <button type="button" onClick={onCancel} className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] text-[#0f172a]">Cancel</button>
      </div>
    </form>
  );
}
