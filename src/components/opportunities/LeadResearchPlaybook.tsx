import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, Languages, RotateCcw } from 'lucide-react';
import Button from '../ui/Button';
import {
  LEAD_RESEARCH_NICHES,
  LEAD_RESEARCH_QUALIFICATION_RULES,
  LEAD_RESEARCH_SCORE_GUIDE,
  LEAD_RESEARCH_STAGES,
  type LeadResearchNiche,
} from './leadResearchPlaybookData';

const STORAGE_KEYS = {
  done: 'crmLeadResearch.done',
  counts: 'crmLeadResearch.counts',
  notes: 'crmLeadResearch.notes',
  selectedNiche: 'crmLeadResearch.selectedNiche',
  currentStep: 'crmLeadResearch.currentStep',
  language: 'crmLeadResearch.language',
} as const;

const LEGACY_STORAGE_KEYS = {
  done: ['lrp_done'],
  counts: ['lrp_counts'],
  notes: ['lrp_notes'],
  selectedNiche: ['lrp_selectedNiche'],
  currentStep: ['lrp_currentStep', 'lrp_step'],
} as const;

type LeadResearchLanguage = 'ar' | 'en';

const copyLabel = {
  en: 'Copy',
  ar: 'نسخ',
} as const;

const t = {
  en: {
    sectionLabel: 'CRM section',
    title: 'Lead Research Playbook',
    subtitle: 'Step-by-step system for finding and qualifying UX/UI leads.',
    currentNiche: 'Current niche',
    progress: 'Progress',
    completedStages: 'completed stages',
    operatingRule: 'Operating rule',
    operatingRuleText: 'One niche → one platform → then next',
    stages: 'Stages',
    reset: 'Reset current niche',
    export: 'Export progress',
    qualificationRules: 'Quick qualification rules',
    placesToSearch: 'Where to search',
    tricks: 'Tricks / rules',
    readyQueries: 'Ready-to-copy queries',
    readyQueriesHelp: 'Search syntax stays LTR inside the query cards.',
    leadCount: 'Leads found in this stage',
    notes: 'Notes for this stage',
    notesPlaceholder: 'Write here: number of companies, result quality, queries that worked, issues you faced...',
    previous: 'Previous',
    markComplete: 'Mark complete',
    undoComplete: 'Undo completion',
    completeNext: 'Completed, next',
    currentStageLabel: 'Current stage',
    completed: 'completed',
    notCompletedYet: 'not completed yet',
    targetCount: 'Target count',
    scoreGuide: 'Score /10',
    finalCleanup: 'After completing all platforms in this niche',
    finalCleanupText: 'Remove duplicates, remove weak leads, choose Top 20, then run mini UX audits.',
    templateTitle: 'Sheet registration template',
    languageEnglish: 'English',
    languageArabic: 'العربية',
    resetConfirm: 'Reset progress for the current niche?',
    copied: 'Copied',
    stageCompleted: 'completed',
    stageIncomplete: 'not completed yet',
  },
  ar: {
    sectionLabel: 'قسم CRM',
    title: 'خطة البحث التفاعلية عن Leads',
    subtitle: 'نظام خطوة بخطوة للبحث عن Leads وتأهيلها لخدمات UX/UI.',
    currentNiche: 'النيش الحالي',
    progress: 'التقدم',
    completedStages: 'مراحل مكتملة',
    operatingRule: 'قاعدة التشغيل',
    operatingRuleText: 'نيش واحد → منصة واحدة → ثم التالي',
    stages: 'المراحل',
    reset: 'إعادة',
    export: 'تصدير التقدم',
    qualificationRules: 'قواعد التأهيل السريع',
    placesToSearch: 'أين تبحث؟',
    tricks: 'Tricks / قواعد خاصة',
    readyQueries: 'Queries جاهزة لهذا النيش',
    readyQueriesHelp: 'Search syntax stays LTR inside the query cards.',
    leadCount: 'Leads التي وجدتها في هذه المرحلة',
    notes: 'ملاحظاتك لهذه المرحلة',
    notesPlaceholder: 'اكتب هنا: عدد الشركات، جودة النتائج، queries التي نجحت، مشاكل واجهتها...',
    previous: 'المرحلة السابقة',
    markComplete: 'علّمها كمكتملة',
    undoComplete: 'إلغاء الإكمال',
    completeNext: 'أنهيت المرحلة، التالي',
    currentStageLabel: 'المرحلة الحالية',
    completed: 'مكتملة',
    notCompletedYet: 'غير مكتملة بعد',
    targetCount: 'الهدف العددي',
    scoreGuide: 'Score /10',
    finalCleanup: 'بعد إكمال كل المنصات في النيش',
    finalCleanupText: 'احذف duplicates، احذف C leads، اختر Top 20، واعمل mini UX audit.',
    templateTitle: 'Template التسجيل في الشيت',
    languageEnglish: 'English',
    languageArabic: 'العربية',
    resetConfirm: 'Reset progress for the current niche?',
    copied: 'تم النسخ',
    stageCompleted: 'مكتملة',
    stageIncomplete: 'غير مكتملة بعد',
  },
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const pickText = (value: { en: string; ar: string }, language: LeadResearchLanguage) => value[language];

const pickList = (value: { en: string[]; ar: string[] }, language: LeadResearchLanguage) => value[language];

const safeParse = (raw: string | null): unknown => {
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

const readFirstAvailable = (keys: readonly string[]): unknown => {
  if (typeof window === 'undefined') return null;

  for (const key of keys) {
    const parsed = safeParse(window.localStorage.getItem(key));
    if (parsed !== null) return parsed;
  }

  return null;
};

const readString = (primaryKey: string, legacyKeys: readonly string[], fallback: string): string => {
  if (typeof window === 'undefined') return fallback;

  const rawPrimary = window.localStorage.getItem(primaryKey);
  if (rawPrimary) return rawPrimary;

  for (const key of legacyKeys) {
    const raw = window.localStorage.getItem(key);
    if (raw) return raw;
  }

  return fallback;
};

const readNumber = (primaryKey: string, legacyKeys: readonly string[], fallback: number): number => {
  const next = Number(readString(primaryKey, legacyKeys, String(fallback)));
  return Number.isFinite(next) ? next : fallback;
};

const readBooleanMap = (primaryKey: string, legacyKeys: readonly string[]): Record<string, boolean> => {
  const parsed = readFirstAvailable([primaryKey, ...legacyKeys]);
  if (!isRecord(parsed)) return {};

  return Object.entries(parsed).reduce<Record<string, boolean>>((accumulator, [key, value]) => {
    accumulator[key] = Boolean(value);
    return accumulator;
  }, {});
};

const readStringMap = (primaryKey: string, legacyKeys: readonly string[]): Record<string, string> => {
  const parsed = readFirstAvailable([primaryKey, ...legacyKeys]);
  if (!isRecord(parsed)) return {};

  return Object.entries(parsed).reduce<Record<string, string>>((accumulator, [key, value]) => {
    accumulator[key] = value == null ? '' : String(value);
    return accumulator;
  }, {});
};

const readLanguage = (): LeadResearchLanguage => {
  if (typeof window === 'undefined') return 'en';

  const raw = window.localStorage.getItem(STORAGE_KEYS.language);
  return raw === 'ar' || raw === 'en' ? raw : 'en';
};

const copyText = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.opacity = '0';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      return true;
    } catch {
      return false;
    }
  }
};

const LeadResearchPlaybook: React.FC = () => {
  const [language, setLanguage] = useState<LeadResearchLanguage>(() => readLanguage());
  const [selectedNiche, setSelectedNiche] = useState<LeadResearchNiche>(() => {
    const initial = readString(STORAGE_KEYS.selectedNiche, LEGACY_STORAGE_KEYS.selectedNiche, LEAD_RESEARCH_NICHES[0]);
    return (LEAD_RESEARCH_NICHES as readonly string[]).includes(initial) ? (initial as LeadResearchNiche) : LEAD_RESEARCH_NICHES[0];
  });
  const [currentStep, setCurrentStep] = useState(() => clamp(readNumber(STORAGE_KEYS.currentStep, LEGACY_STORAGE_KEYS.currentStep, 0), 0, LEAD_RESEARCH_STAGES.length - 1));
  const [done, setDone] = useState<Record<string, boolean>>(() => readBooleanMap(STORAGE_KEYS.done, LEGACY_STORAGE_KEYS.done));
  const [counts, setCounts] = useState<Record<string, string>>(() => readStringMap(STORAGE_KEYS.counts, LEGACY_STORAGE_KEYS.counts));
  const [notes, setNotes] = useState<Record<string, string>>(() => readStringMap(STORAGE_KEYS.notes, LEGACY_STORAGE_KEYS.notes));
  const [copiedQueryKey, setCopiedQueryKey] = useState<string | null>(null);
  const copyTimerRef = useRef<number | null>(null);

  const currentStage = LEAD_RESEARCH_STAGES[clamp(currentStep, 0, LEAD_RESEARCH_STAGES.length - 1)] ?? LEAD_RESEARCH_STAGES[0];
  const currentStageKey = `${selectedNiche}-${currentStep}`;
  const selectedNicheStages = LEAD_RESEARCH_STAGES;
  const completedCount = selectedNicheStages.reduce((total, _stage, index) => total + (done[`${selectedNiche}-${index}`] ? 1 : 0), 0);
  const progressPercent = Math.round((completedCount / selectedNicheStages.length) * 100);
  const stageQueries = currentStage.queries[selectedNiche] || [];
  const stageCount = counts[currentStageKey] ?? '';
  const stageNotes = notes[currentStageKey] ?? '';
  const isCurrentCompleted = Boolean(done[currentStageKey]);
  const copyTextLabel = copyLabel[language];
  const languageCopy = t[language];

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(STORAGE_KEYS.done, JSON.stringify(done));
    window.localStorage.setItem(STORAGE_KEYS.counts, JSON.stringify(counts));
    window.localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
    window.localStorage.setItem(STORAGE_KEYS.selectedNiche, selectedNiche);
    window.localStorage.setItem(STORAGE_KEYS.currentStep, String(currentStep));
  }, [counts, currentStep, done, notes, selectedNiche]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(STORAGE_KEYS.language, language);
  }, [language]);

  useEffect(() => () => {
    if (copyTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(copyTimerRef.current);
    }
  }, []);

  const handleNicheChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const nextNiche = event.target.value as LeadResearchNiche;
    setSelectedNiche(nextNiche);
    setCurrentStep(0);
  };

  const handleCopyQuery = async (query: string, queryKey: string) => {
    const copied = await copyText(query);
    if (!copied) return;

    setCopiedQueryKey(queryKey);
    if (copyTimerRef.current !== null && typeof window !== 'undefined') {
      window.clearTimeout(copyTimerRef.current);
    }
    if (typeof window !== 'undefined') {
      copyTimerRef.current = window.setTimeout(() => setCopiedQueryKey(null), 1500);
    }
  };

  const handleResetCurrentNiche = () => {
    const confirmed = typeof window === 'undefined' ? true : window.confirm(languageCopy.resetConfirm);
    if (!confirmed) return;

    const nextDone = { ...done };
    const nextCounts = { ...counts };
    const nextNotes = { ...notes };

    LEAD_RESEARCH_STAGES.forEach((_stage, index) => {
      const key = `${selectedNiche}-${index}`;
      delete nextDone[key];
      delete nextCounts[key];
      delete nextNotes[key];
    });

    setDone(nextDone);
    setCounts(nextCounts);
    setNotes(nextNotes);
    setCurrentStep(0);
  };

  const handleLanguageChange = (nextLanguage: LeadResearchLanguage) => {
    setLanguage(nextLanguage);
  };

  const activeStageTitle = pickText(currentStage.title, language);
  const activeStageGoal = pickText(currentStage.goal, language);
  const activeStageTarget = pickText(currentStage.target, language);
  const activeStagePlaces = pickList(currentStage.places, language);
  const activeStageTricks = pickList(currentStage.tricks, language);

  const sheetTemplate = language === 'en'
    ? `Company:
Niche:
Category:
Website:
LinkedIn / Social:
Source:
Source Query:
What they sell:
Decision Maker:
Evidence of Budget:
UX Problem Observed:
Potential Offer:
Lead Score /10:
Priority: A / B / C
Status: New
Duplicate? Yes/No
Notes:`
    : `Company:
Niche:
Category:
Website:
LinkedIn / Social:
Source:
Source Query:
What they sell:
Decision Maker:
Evidence of Budget:
UX Problem Observed:
Potential Offer:
Lead Score /10:
Priority: A / B / C
Status: New
Duplicate? Yes/No
Notes:`;

  const handleExportProgress = () => {
    if (typeof window === 'undefined') return;

    const payload = {
      selectedNiche,
      currentStep,
      done,
      counts,
      notes,
      exportedAt: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `lead-research-progress-${selectedNiche.replace(/\s+/g, '-').toLowerCase()}.json`;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    window.setTimeout(() => window.URL.revokeObjectURL(url), 0);
  };

  const handleToggleDone = () => {
    setDone((previous) => ({
      ...previous,
      [currentStageKey]: !previous[currentStageKey],
    }));
  };

  const handleCompletedNext = () => {
    setDone((previous) => ({
      ...previous,
      [currentStageKey]: true,
    }));

    setCurrentStep((previous) => Math.min(previous + 1, LEAD_RESEARCH_STAGES.length - 1));
  };

  const handlePrevious = () => {
    setCurrentStep((previous) => Math.max(previous - 1, 0));
  };

  return (
    <section dir={language === 'ar' ? 'rtl' : 'ltr'} className={`space-y-4 ${language === 'ar' ? 'text-right' : 'text-left'}`}>
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">{languageCopy.sectionLabel}</p>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 md:text-3xl">{languageCopy.title}</h1>
            <p className="max-w-3xl text-sm leading-6 text-neutral-600">{languageCopy.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button variant="outline" size="sm" onClick={handleResetCurrentNiche}>
              <RotateCcw className="h-4 w-4" />
              {languageCopy.reset}
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportProgress}>
              <Download className="h-4 w-4" />
              {languageCopy.export}
            </Button>
            <div className="inline-flex h-10 overflow-hidden rounded-lg border border-neutral-200 bg-white">
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`h-full px-3 text-sm font-medium transition-colors ${language === 'en' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
              >
                {languageCopy.languageEnglish}
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('ar')}
                className={`h-full px-3 text-sm font-medium transition-colors ${language === 'ar' ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-700 hover:bg-neutral-50'}`}
              >
                {languageCopy.languageArabic}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500" htmlFor="lead-research-niche">{languageCopy.currentNiche}</label>
            <select
              id="lead-research-niche"
              value={selectedNiche}
              onChange={handleNicheChange}
              className="mt-2 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400"
            >
              {LEAD_RESEARCH_NICHES.map((niche) => (
                <option key={niche} value={niche}>
                  {niche}
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">{languageCopy.progress}</div>
                <div className="mt-1 text-2xl font-semibold text-neutral-950">{progressPercent}%</div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-right">
                <div className="text-xs text-neutral-500">{languageCopy.completedStages}</div>
                <div className="text-sm font-semibold text-neutral-900">{completedCount} / {selectedNicheStages.length}</div>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className={`h-full rounded-full ${progressPercent === 100 ? 'bg-emerald-600' : 'bg-neutral-900'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-neutral-500">{completedCount} / {selectedNicheStages.length} {languageCopy.completedStages}</div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">{languageCopy.operatingRule}</div>
            <div className="mt-2 text-sm font-semibold text-neutral-900">{languageCopy.operatingRuleText}</div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-neutral-900">{languageCopy.stages}</h2>
              <span className="text-xs text-neutral-500">{currentStep + 1} / {selectedNicheStages.length}</span>
            </div>
            <div className="space-y-2">
              {selectedNicheStages.map((stage, index) => {
                const stageKey = `${selectedNiche}-${index}`;
                const isActive = index === currentStep;
                const isDone = Boolean(done[stageKey]);
                const stageTitle = pickText(stage.title, language);

                return (
                  <button
                    key={`${stageTitle}-${index}`}
                    type="button"
                    onClick={() => setCurrentStep(index)}
                    className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-right transition-colors ${
                      isActive
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : isDone
                          ? 'border-emerald-200 bg-emerald-50 text-neutral-900 hover:border-emerald-300'
                          : 'border-neutral-200 bg-white text-neutral-900 hover:border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    <span className={`flex h-6 w-6 items-center justify-center rounded-full border text-[11px] font-semibold ${isActive ? 'border-white text-white' : isDone ? 'border-emerald-600 text-emerald-600' : 'border-neutral-300 text-neutral-500'}`}>
                      {isDone ? <Check className="h-3.5 w-3.5" /> : index + 1}
                    </span>
                    <span className="min-w-0 flex-1 text-sm font-medium leading-5">{stageTitle}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <main className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">{languageCopy.currentStageLabel}</div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950">{activeStageTitle}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">{activeStageGoal}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-right">
                <div className="text-xs text-neutral-500">{languageCopy.targetCount}</div>
                <div className="text-sm font-semibold text-neutral-900">{activeStageTarget}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-900">{languageCopy.placesToSearch}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {activeStagePlaces.map((place) => (
                  <span key={place} className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700">
                    {place}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-900">{languageCopy.tricks}</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
                {activeStageTricks.map((trick) => (
                  <li key={trick} className="flex gap-2">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />
                    <span>{trick}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">{languageCopy.readyQueries}</h3>
                <p className="mt-1 text-xs text-neutral-500">{languageCopy.readyQueriesHelp}</p>
              </div>
              <div className="text-xs text-neutral-500">{stageQueries.length} queries</div>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              {stageQueries.map((query, index) => {
                const queryKey = `${selectedNiche}-${currentStep}-${index}`;

                return (
                  <div key={queryKey} dir="ltr" className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
                    <div className="flex items-start gap-3">
                      <code className="min-w-0 flex-1 whitespace-pre-wrap break-words text-left font-mono text-[13px] leading-5 text-neutral-900">
                        {query}
                      </code>
                      <button
                        type="button"
                        onClick={() => void handleCopyQuery(query, queryKey)}
                        className="inline-flex h-9 shrink-0 items-center gap-1 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        {copiedQueryKey === queryKey ? languageCopy.copied : copyTextLabel}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <label className="block text-sm font-semibold text-neutral-900" htmlFor="lead-research-count">{languageCopy.leadCount}</label>
              <input
                id="lead-research-count"
                type="number"
                min={0}
                inputMode="numeric"
                value={stageCount}
                onChange={(event) => {
                  const value = event.target.value;
                  setCounts((previous) => ({
                    ...previous,
                    [currentStageKey]: value,
                  }));
                }}
                className="mt-2 h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400"
              />
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <label className="block text-sm font-semibold text-neutral-900" htmlFor="lead-research-notes">{languageCopy.notes}</label>
              <textarea
                id="lead-research-notes"
                value={stageNotes}
                onChange={(event) => {
                  const value = event.target.value;
                  setNotes((previous) => ({
                    ...previous,
                    [currentStageKey]: value,
                  }));
                }}
                  placeholder={languageCopy.notesPlaceholder}
                className="mt-2 min-h-32 w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 outline-none transition-colors focus:border-neutral-400"
              />
            </div>
          </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-900">{languageCopy.templateTitle}</h3>
              <pre dir="ltr" className="mt-3 overflow-auto rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-left text-xs leading-6 text-neutral-700 whitespace-pre-wrap">{sheetTemplate}</pre>
            </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-900">{languageCopy.qualificationRules}</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
                {LEAD_RESEARCH_QUALIFICATION_RULES[language].map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
                <div className="font-semibold text-neutral-900">{languageCopy.scoreGuide}</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {LEAD_RESEARCH_SCORE_GUIDE.map((item) => (
                  <span key={item} className="rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-neutral-600">
                {languageCopy.currentStageLabel} <span className="font-semibold text-neutral-900">{activeStageTitle}</span>{' '}
                {isCurrentCompleted ? <span className="text-emerald-600">{languageCopy.completed}</span> : <span className="text-neutral-500">{languageCopy.notCompletedYet}</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentStep === 0}>
                  <span className="inline-flex items-center gap-1">
                    <span>{languageCopy.previous}</span>
                    <RotateCcw className="h-4 w-4 rotate-90" />
                  </span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleToggleDone}>
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    {isCurrentCompleted ? languageCopy.undoComplete : languageCopy.markComplete}
                  </span>
                </Button>
                <Button variant="primary" size="sm" onClick={handleCompletedNext}>
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    {languageCopy.completeNext}
                  </span>
                </Button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-neutral-900">{languageCopy.finalCleanup}</h3>
            <p className="mt-2 text-sm leading-6 text-neutral-600">{languageCopy.finalCleanupText}</p>
          </div>
        </main>
      </div>
    </section>
  );
};

export default LeadResearchPlaybook;