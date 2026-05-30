import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, Download, RotateCcw } from 'lucide-react';
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
} as const;

const LEGACY_STORAGE_KEYS = {
  done: ['lrp_done'],
  counts: ['lrp_counts'],
  notes: ['lrp_notes'],
  selectedNiche: ['lrp_selectedNiche'],
  currentStep: ['lrp_currentStep', 'lrp_step'],
} as const;

const isRecord = (value: unknown): value is Record<string, unknown> => Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

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

  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.localStorage.setItem(STORAGE_KEYS.done, JSON.stringify(done));
    window.localStorage.setItem(STORAGE_KEYS.counts, JSON.stringify(counts));
    window.localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
    window.localStorage.setItem(STORAGE_KEYS.selectedNiche, selectedNiche);
    window.localStorage.setItem(STORAGE_KEYS.currentStep, String(currentStep));
  }, [counts, currentStep, done, notes, selectedNiche]);

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
    const confirmed = typeof window === 'undefined' ? true : window.confirm('Reset progress for the current niche?');
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
    <section dir="rtl" className="space-y-4 text-right">
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">CRM section</p>
            <h1 className="text-2xl font-semibold tracking-tight text-neutral-950 md:text-3xl">Lead Research Playbook</h1>
            <p className="max-w-3xl text-sm leading-6 text-neutral-600">Step-by-step system for finding and qualifying UX/UI leads.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 md:justify-end">
            <Button variant="outline" size="sm" onClick={handleResetCurrentNiche}>
              <RotateCcw className="h-4 w-4" />
              Reset current niche
            </Button>
            <Button variant="primary" size="sm" onClick={handleExportProgress}>
              <Download className="h-4 w-4" />
              Export progress
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500" htmlFor="lead-research-niche">النيش الحالي</label>
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
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Progress</div>
                <div className="mt-1 text-2xl font-semibold text-neutral-950">{progressPercent}%</div>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-right">
                <div className="text-xs text-neutral-500">Completed</div>
                <div className="text-sm font-semibold text-neutral-900">{completedCount} / {selectedNicheStages.length}</div>
              </div>
            </div>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-neutral-200">
              <div
                className={`h-full rounded-full ${progressPercent === 100 ? 'bg-emerald-600' : 'bg-neutral-900'}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="mt-2 text-xs text-neutral-500">{completedCount} من {selectedNicheStages.length} مراحل مكتملة</div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-neutral-900">المراحل</h2>
              <span className="text-xs text-neutral-500">{currentStep + 1} / {selectedNicheStages.length}</span>
            </div>
            <div className="space-y-2">
              {selectedNicheStages.map((stage, index) => {
                const stageKey = `${selectedNiche}-${index}`;
                const isActive = index === currentStep;
                const isDone = Boolean(done[stageKey]);

                return (
                  <button
                    key={`${stage.title}-${index}`}
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
                    <span className="min-w-0 flex-1 text-sm font-medium leading-5">{stage.title}</span>
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
                <div className="text-xs font-semibold uppercase tracking-[0.12em] text-neutral-500">Stage details</div>
                <h2 className="mt-1 text-xl font-semibold tracking-tight text-neutral-950">{currentStage.title}</h2>
                <p className="mt-2 max-w-3xl text-sm leading-6 text-neutral-600">{currentStage.goal}</p>
              </div>
              <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-right">
                <div className="text-xs text-neutral-500">الهدف العددي</div>
                <div className="text-sm font-semibold text-neutral-900">{currentStage.target}</div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-900">أماكن البحث</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                {currentStage.places.map((place) => (
                  <span key={place} className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-2 text-xs font-medium text-neutral-700">
                    {place}
                  </span>
                ))}
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="text-sm font-semibold text-neutral-900">Tricks / rules</h3>
              <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
                {currentStage.tricks.map((trick) => (
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
                <h3 className="text-sm font-semibold text-neutral-900">Ready-to-copy queries</h3>
                <p className="mt-1 text-xs text-neutral-500">Search syntax stays LTR inside the query cards.</p>
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
                        {copiedQueryKey === queryKey ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <label className="block text-sm font-semibold text-neutral-900" htmlFor="lead-research-count">عدد الـ leads في هذه المرحلة</label>
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
              <label className="block text-sm font-semibold text-neutral-900" htmlFor="lead-research-notes">ملاحظاتك لهذه المرحلة</label>
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
                placeholder="اكتب هنا: عدد الشركات، جودة النتائج، queries التي نجحت، مشاكل واجهتها..."
                className="mt-2 min-h-32 w-full resize-y rounded-lg border border-neutral-200 bg-white px-3 py-2.5 text-sm leading-6 text-neutral-900 outline-none transition-colors focus:border-neutral-400"
              />
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-neutral-900">قواعد التأهيل السريع</h3>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-neutral-700">
              {LEAD_RESEARCH_QUALIFICATION_RULES.map((rule) => (
                <li key={rule} className="flex gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral-900" />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-700">
              <div className="font-semibold text-neutral-900">Score /10</div>
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
                Current stage is <span className="font-semibold text-neutral-900">{currentStage.title}</span>{' '}
                {isCurrentCompleted ? <span className="text-emerald-600">completed</span> : <span className="text-neutral-500">not completed yet</span>}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={handlePrevious} disabled={currentStep === 0}>
                  <span className="inline-flex items-center gap-1">
                    <span>Previous</span>
                    <RotateCcw className="h-4 w-4 rotate-90" />
                  </span>
                </Button>
                <Button variant="outline" size="sm" onClick={handleToggleDone}>
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    {isCurrentCompleted ? 'Undo Completed' : 'Mark Completed'}
                  </span>
                </Button>
                <Button variant="primary" size="sm" onClick={handleCompletedNext}>
                  <span className="inline-flex items-center gap-1">
                    <Check className="h-4 w-4" />
                    Completed, Next
                  </span>
                </Button>
              </div>
            </div>
          </div>
        </main>
      </div>
    </section>
  );
};

export default LeadResearchPlaybook;