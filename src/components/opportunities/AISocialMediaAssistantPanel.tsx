import React, { useState } from 'react';

export type SocialMediaAIMode =
  | 'generate_ideas'
  | 'improve_hook'
  | 'rewrite_post'
  | 'note_to_post'
  | 'project_to_case_study'
  | 'weekly_plan'
  | 'repurpose_content'
  | 'analyze_performance'
  | 'next_week_focus';

export type SocialMediaAILanguage = 'arabic' | 'english' | 'french' | 'auto';

export type SocialMediaAIResult = {
  summary: string;
  ideas: string[];
  hooks: string[];
  contentDraft: string;
  weeklyPlan: string;
  repurposedContent: string;
  performanceInsights: string[];
  questionsToReview: string[];
  nextActions: string[];
};

const MODE_OPTIONS: Array<{ value: SocialMediaAIMode; label: string; description: string }> = [
  { value: 'generate_ideas', label: 'Generate Ideas', description: 'Content ideas from strategy and pillars.' },
  { value: 'improve_hook', label: 'Improve Hook', description: 'Stronger hooks for your content.' },
  { value: 'rewrite_post', label: 'Rewrite Post', description: 'Clarity, structure, platform fit.' },
  { value: 'note_to_post', label: 'Note to Post', description: 'Turn a note into a post.' },
  { value: 'project_to_case_study', label: 'Project to Case Study', description: 'Turn a project into a case study post.' },
  { value: 'weekly_plan', label: 'Weekly Plan', description: 'Suggest weekly content mix.' },
  { value: 'repurpose_content', label: 'Repurpose Content', description: 'One piece into multiple formats.' },
  { value: 'analyze_performance', label: 'Analyze Performance', description: 'Review metrics and suggest improvements.' },
  { value: 'next_week_focus', label: 'Next Week Focus', description: 'Focus for the coming week.' },
];

const LANGUAGE_OPTIONS: Array<{ value: SocialMediaAILanguage; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
];

const MODES_REQUIRING_CONTENT = ['improve_hook', 'rewrite_post', 'repurpose_content', 'analyze_performance'];
const MODES_REQUIRING_NOTE = ['note_to_post'];
const MODES_REQUIRING_PROJECT = ['project_to_case_study'];
const MODES_USING_STRATEGY = ['generate_ideas', 'weekly_plan', 'next_week_focus'];

const copyToClipboard = async (value: string) => {
  if (!value) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

interface AISocialMediaAssistantPanelProps {
  strategies: any[];
  platforms: any[];
  pillars: any[];
  contentItems: any[];
  weeklyContentPlans: any[];
  smartNotes: any[];
  projects: any[];
  onCreateContentItem: (input: any) => Promise<any>;
  onUpdateContentItem: (id: string, input: any) => Promise<any>;
  onCreateWeeklyPlan?: (input: any) => Promise<any>;
}

export default function AISocialMediaAssistantPanel({
  strategies,
  platforms,
  pillars,
  contentItems,
  weeklyContentPlans,
  smartNotes,
  projects,
  onCreateContentItem,
  onUpdateContentItem,
  onCreateWeeklyPlan,
}: AISocialMediaAssistantPanelProps) {
  const [mode, setMode] = useState<SocialMediaAIMode>('generate_ideas');
  const [language, setLanguage] = useState<SocialMediaAILanguage>('auto');
  const [selectedStrategyId, setSelectedStrategyId] = useState('');
  const [selectedPillarId, setSelectedPillarId] = useState('');
  const [selectedPlatformId, setSelectedPlatformId] = useState('');
  const [selectedContentItemId, setSelectedContentItemId] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedWeeklyPlanId, setSelectedWeeklyPlanId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SocialMediaAIResult | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const activeStrategy = strategies.find((s) => s.id === selectedStrategyId) || strategies[0];
  const selectedPlatform = platforms.find((p) => p.id === selectedPlatformId);
  const selectedPillar = pillars.find((p) => p.id === selectedPillarId);
  const selectedContentItem = contentItems.find((c) => c.id === selectedContentItemId);
  const selectedNote = smartNotes.find((n) => n.id === selectedNoteId);
  const selectedProject = projects.find((p) => p.id === selectedProjectId);
  const selectedWeeklyPlan = weeklyContentPlans.find((p) => p.id === selectedWeeklyPlanId);

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setStatusMessage(null);

    const strategyPayload = activeStrategy ? {
      targetAudience: activeStrategy.targetAudience,
      positioning: activeStrategy.positioning,
      mainPromise: activeStrategy.mainPromise,
      tone: activeStrategy.tone,
      languages: activeStrategy.languages,
      weeklyPostTarget: activeStrategy.weeklyPostTarget,
      weeklyVideoTarget: activeStrategy.weeklyVideoTarget,
      activePlatforms: activeStrategy.activePlatforms,
    } : null;

    const platformsPayload = platforms.length > 0 ? platforms.map((p) => ({
      name: p.name,
      slug: p.slug,
      url: p.url,
    })) : null;

    const pillarsPayload = pillars.length > 0 ? pillars.map((p) => ({
      name: p.name,
      slug: p.slug,
      description: p.description,
      targetAudience: p.targetAudience,
      priority: p.priority,
    })) : null;

    const contentItemPayload = selectedContentItem ? {
      title: selectedContentItem.title,
      type: selectedContentItem.type,
      status: selectedContentItem.status,
      platformName: selectedContentItem.platformName,
      pillarName: selectedContentItem.pillarName,
      hook: selectedContentItem.hook,
      content: selectedContentItem.content,
      caption: selectedContentItem.caption,
      assetUrl: selectedContentItem.assetUrl,
      publishDate: selectedContentItem.publishDate,
      performanceViews: selectedContentItem.performanceViews,
      performanceLikes: selectedContentItem.performanceLikes,
      performanceComments: selectedContentItem.performanceComments,
      performanceShares: selectedContentItem.performanceShares,
      performanceSaves: selectedContentItem.performanceSaves,
      performanceClicks: selectedContentItem.performanceClicks,
      leadsGenerated: selectedContentItem.leadsGenerated,
      notes: selectedContentItem.notes,
    } : null;

    const notePayload = selectedNote ? {
      title: selectedNote.title,
      content: selectedNote.content,
      categorySlug: selectedNote.categorySlug,
      tags: selectedNote.tags,
    } : null;

    const projectPayload = selectedProject ? {
      name: selectedProject.name,
      type: selectedProject.type,
      status: selectedProject.status,
      phase: selectedProject.phase,
      progress: selectedProject.progress,
      notes: selectedProject.notes,
      nextAction: selectedProject.nextAction,
    } : null;

    const weeklyPlanPayload = selectedWeeklyPlan ? {
      weekStart: selectedWeeklyPlan.weekStart,
      focus: selectedWeeklyPlan.focus,
      targetPosts: selectedWeeklyPlan.targetPosts,
      targetVideos: selectedWeeklyPlan.targetVideos,
      targetCarousels: selectedWeeklyPlan.targetCarousels,
      targetOther: selectedWeeklyPlan.targetOther,
      reviewNotes: selectedWeeklyPlan.reviewNotes,
    } : null;

    const recentContentPayload = contentItems.length > 0
      ? contentItems.filter((c) => c.status === 'published').slice(0, 10).map((c) => ({
          title: c.title,
          type: c.type,
          performanceViews: c.performanceViews,
          performanceLikes: c.performanceLikes,
          performanceComments: c.performanceComments,
          performanceShares: c.performanceShares,
        }))
      : null;

    const body: Record<string, any> = {
      mode,
      language,
      strategy: strategyPayload,
      platforms: platformsPayload,
      pillars: pillarsPayload,
      contentItem: contentItemPayload,
      note: notePayload,
      project: projectPayload,
      weeklyPlan: weeklyPlanPayload,
      recentContent: recentContentPayload,
    };

    if (instructions.trim()) body.instructions = instructions.trim();

    try {
      const response = await fetch('/api/ai?action=social-media', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'AI could not generate social media help. Review manually.');
        return;
      }

      setResult(data.result);
    } catch {
      setError('AI could not generate social media help. Review manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateContentItem = async (overrides: Record<string, any> = {}) => {
    if (!result?.contentDraft && !result?.ideas?.length && !result?.hooks?.length) return;
    try {
      await onCreateContentItem({
        title: overrides.title || result?.contentDraft?.slice(0, 80) || 'AI Generated Draft',
        type: 'text_post',
        status: 'idea',
        content: overrides.content || result?.contentDraft || undefined,
        hook: overrides.hook || result?.hooks?.[0] || undefined,
        platformId: selectedPlatformId || undefined,
        pillarId: selectedPillarId || undefined,
        ...overrides,
      });
      setStatusMessage('Content item created.');
    } catch {
      setError('Failed to create content item.');
    }
  };

  const handleCreateIdea = async (ideaText: string) => {
    try {
      await onCreateContentItem({
        title: ideaText.slice(0, 80),
        type: 'text_post',
        status: 'idea',
        notes: ideaText,
        platformId: selectedPlatformId || undefined,
        pillarId: selectedPillarId || undefined,
      });
      setStatusMessage('Content idea created.');
    } catch {
      setError('Failed to create content idea.');
    }
  };

  const handleApplyHook = async () => {
    if (!selectedContentItem || !result?.hooks?.length) return;
    const confirmed = window.confirm(`Replace hook of "${selectedContentItem.title}" with "${result.hooks[0]}"?`);
    if (!confirmed) return;
    try {
      await onUpdateContentItem(selectedContentItem.id, { hook: result.hooks[0] });
      setStatusMessage('Hook applied to content item.');
    } catch {
      setError('Failed to apply hook.');
    }
  };

  const handleReplaceDraft = async () => {
    if (!selectedContentItem || !result?.contentDraft) return;
    const confirmed = window.confirm(`Replace content of "${selectedContentItem.title}" with the AI draft?`);
    if (!confirmed) return;
    try {
      await onUpdateContentItem(selectedContentItem.id, { content: result.contentDraft });
      setStatusMessage('Draft replaced.');
    } catch {
      setError('Failed to replace draft.');
    }
  };

  const handleCreateWeeklyPlan = async () => {
    if (!result?.weeklyPlan) return;
    if (!onCreateWeeklyPlan) return;
    try {
      const weekStart = new Date();
      const day = weekStart.getDay();
      const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
      weekStart.setDate(diff);
      const weekStartStr = weekStart.toISOString().slice(0, 10);
      await onCreateWeeklyPlan({
        weekStart: weekStartStr,
        focus: result.weeklyPlan.slice(0, 200),
        reviewNotes: result.weeklyPlan,
      });
      setStatusMessage('Weekly plan created with review notes.');
    } catch {
      setError('Failed to create weekly plan.');
    }
  };

  const sectionHeader = (label: string) => (
    <div className="text-xs font-semibold uppercase tracking-[0.2em] text-[#64748b] mb-2">{label}</div>
  );

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        AI Social Media Assistant helps draft and plan content. Review before publishing.
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          {sectionHeader('Mode')}
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value as SocialMediaAIMode)}
            className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb]"
          >
            {MODE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <p className="mt-1 text-xs text-[#64748b]">{MODE_OPTIONS.find((o) => o.value === mode)?.description}</p>
        </div>

        <div>
          {sectionHeader('Language')}
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as SocialMediaAILanguage)}
            className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb]"
          >
            {LANGUAGE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          {sectionHeader('Strategy')}
          <select
            value={selectedStrategyId}
            onChange={(e) => setSelectedStrategyId(e.target.value)}
            className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb]"
          >
            <option value="">{strategies.length > 0 ? 'Select strategy' : 'No strategies'}</option>
            {strategies.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {MODES_USING_STRATEGY.includes(mode) || MODES_REQUIRING_CONTENT.includes(mode) ? (
          <div>
            {sectionHeader('Pillar')}
            <select
              value={selectedPillarId}
              onChange={(e) => setSelectedPillarId(e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb]"
            >
              <option value="">Any pillar</option>
              {pillars.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        ) : null}

        {MODES_USING_STRATEGY.includes(mode) || MODES_REQUIRING_CONTENT.includes(mode) ? (
          <div>
            {sectionHeader('Platform')}
            <select
              value={selectedPlatformId}
              onChange={(e) => setSelectedPlatformId(e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb]"
            >
              <option value="">Any platform</option>
              {platforms.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        ) : null}

        {MODES_REQUIRING_CONTENT.includes(mode) ? (
          <div>
            {sectionHeader('Content Item')}
            <select
              value={selectedContentItemId}
              onChange={(e) => setSelectedContentItemId(e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb]"
            >
              <option value="">Select content item</option>
              {contentItems.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        ) : null}

        {mode === 'note_to_post' ? (
          <div>
            {sectionHeader('Note')}
            <select
              value={selectedNoteId}
              onChange={(e) => setSelectedNoteId(e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb]"
            >
              <option value="">Select note</option>
              {smartNotes.map((n) => (
                <option key={n.id} value={n.id}>{n.title}</option>
              ))}
            </select>
          </div>
        ) : null}

        {mode === 'project_to_case_study' ? (
          <div>
            {sectionHeader('Project')}
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb]"
            >
              <option value="">Select project</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>
        ) : null}

        {mode === 'weekly_plan' ? (
          <div>
            {sectionHeader('Existing Weekly Plan')}
            <select
              value={selectedWeeklyPlanId}
              onChange={(e) => setSelectedWeeklyPlanId(e.target.value)}
              className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb]"
            >
              <option value="">No plan selected</option>
              {weeklyContentPlans.map((p) => (
                <option key={p.id} value={p.id}>{p.weekStart}</option>
              ))}
            </select>
          </div>
        ) : null}
      </div>

      <div>
        {sectionHeader('Instructions (optional)')}
        <textarea
          value={instructions}
          onChange={(e) => setInstructions(e.target.value)}
          className="w-full rounded-xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb] min-h-[60px]"
          placeholder="Any specific instructions for the AI..."
        />
      </div>

      <button
        type="button"
        onClick={handleGenerate}
        disabled={loading}
        className="rounded-xl bg-[#2563eb] px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Generating...' : 'Generate'}
      </button>

      {error ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {error}
        </div>
      ) : null}

      {statusMessage ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {statusMessage}
        </div>
      ) : null}

      {result ? (
        <div className="space-y-4">
          {result.summary ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              {sectionHeader('Summary')}
              <p className="text-sm text-[#0f172a] whitespace-pre-wrap">{result.summary}</p>
            </div>
          ) : null}

          {result.ideas?.length > 0 ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              {sectionHeader('Ideas')}
              <ul className="space-y-2 text-sm text-[#0f172a]">
                {result.ideas.map((idea, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2563eb]">•</span>
                    <span className="flex-1">{idea}</span>
                    <button
                      type="button"
                      onClick={() => handleCreateIdea(idea)}
                      className="shrink-0 text-xs text-[#2563eb] hover:underline"
                    >
                      Create
                    </button>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={async () => { await copyToClipboard(result.ideas!.join('\n')); setStatusMessage('Ideas copied.'); }}
                  className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] text-[#0f172a]"
                >
                  Copy Ideas
                </button>
              </div>
            </div>
          ) : null}

          {result.hooks?.length > 0 ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              {sectionHeader('Hooks')}
              <ul className="space-y-2 text-sm text-[#0f172a]">
                {result.hooks.map((hook, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2563eb]">•</span>
                    <span className="flex-1">{hook}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={async () => { await copyToClipboard(result.hooks!.join('\n')); setStatusMessage('Hooks copied.'); }}
                  className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] text-[#0f172a]"
                >
                  Copy Hooks
                </button>
                {selectedContentItem ? (
                  <button
                    type="button"
                    onClick={handleApplyHook}
                    className="text-xs px-3 py-1.5 rounded-md bg-[#2563eb] text-white"
                  >
                    Apply Hook to Selected
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {result.contentDraft ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              {sectionHeader('Content Draft')}
              <div className="text-sm text-[#0f172a] whitespace-pre-wrap mb-3">{result.contentDraft}</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => { await copyToClipboard(result.contentDraft!); setStatusMessage('Draft copied.'); }}
                  className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] text-[#0f172a]"
                >
                  Copy Draft
                </button>
                <button
                  type="button"
                  onClick={() => handleCreateContentItem()}
                  className="text-xs px-3 py-1.5 rounded-md bg-[#2563eb] text-white"
                >
                  Save as New Content Item
                </button>
                {selectedContentItem ? (
                  <button
                    type="button"
                    onClick={handleReplaceDraft}
                    className="text-xs px-3 py-1.5 rounded-md border border-amber-300 text-amber-800 hover:bg-amber-50"
                  >
                    Replace Selected Draft
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {result.weeklyPlan ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              {sectionHeader('Weekly Plan')}
              <div className="text-sm text-[#0f172a] whitespace-pre-wrap mb-3">{result.weeklyPlan}</div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={async () => { await copyToClipboard(result.weeklyPlan!); setStatusMessage('Plan copied.'); }}
                  className="text-xs px-3 py-1.5 rounded-md border border-[#e5e7eb] text-[#0f172a]"
                >
                  Copy Weekly Plan
                </button>
                {onCreateWeeklyPlan ? (
                  <button
                    type="button"
                    onClick={handleCreateWeeklyPlan}
                    className="text-xs px-3 py-1.5 rounded-md bg-[#2563eb] text-white"
                  >
                    Save as Weekly Plan
                  </button>
                ) : null}
              </div>
            </div>
          ) : null}

          {result.repurposedContent ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              {sectionHeader('Repurposed Content')}
              <div className="text-sm text-[#0f172a] whitespace-pre-wrap">{result.repurposedContent}</div>
            </div>
          ) : null}

          {result.performanceInsights?.length > 0 ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              {sectionHeader('Performance Insights')}
              <ul className="space-y-1 text-sm text-[#0f172a]">
                {result.performanceInsights.map((insight, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2563eb]">•</span>
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.questionsToReview?.length > 0 ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              {sectionHeader('Questions to Review')}
              <ul className="space-y-1 text-sm text-[#0f172a]">
                {result.questionsToReview.map((q, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2563eb]">•</span>
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {result.nextActions?.length > 0 ? (
            <div className="rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-sm">
              {sectionHeader('Next Actions')}
              <ul className="space-y-1 text-sm text-[#0f172a]">
                {result.nextActions.map((action, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-0.5 text-[#2563eb]">•</span>
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
