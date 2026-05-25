import React, { useMemo, useState, useEffect } from 'react';
import type {
  LifeNutritionLog, LifeNutritionLogInput,
  LifeFitnessLog, LifeFitnessLogInput,
  LifeDeenLog, LifeDeenLogInput,
  LifeFamilyAction, LifeFamilyActionInput,
  LifeWeeklyReview, LifeWeeklyReviewInput,
  LifeMealType, LifeQualityRating, LifeEnergyLevel,
  LifeWorkoutType, LifeIntensity,
  LifePrayerStatus, LifeFamilyActionType, LifeFamilyActionStatus, LifePriority,
} from '../../types/opportunities';
import AISocialMediaAssistantPanel from './AISocialMediaAssistantPanel';

const LIFE_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'nutrition', label: 'Nutrition' },
  { id: 'fitness', label: 'Fitness' },
  { id: 'deen', label: 'Deen' },
  { id: 'family', label: 'Family' },
  { id: 'weekly-review', label: 'Weekly Review' },
] as const;

type LifeSection = typeof LIFE_TABS[number]['id'];

const MEAL_TYPES: LifeMealType[] = ['breakfast', 'lunch', 'dinner', 'snack', 'drink', 'meal', 'other'];
const QUALITY_RATINGS: LifeQualityRating[] = ['good', 'medium', 'poor'];
const ENERGY_LEVELS: LifeEnergyLevel[] = ['high', 'medium', 'low'];
const WORKOUT_TYPES: LifeWorkoutType[] = ['walking', 'strength', 'cardio', 'mobility', 'sport', 'recovery', 'general', 'other'];
const INTENSITIES: LifeIntensity[] = ['low', 'medium', 'high'];
const PRAYER_STATUSES: LifePrayerStatus[] = ['done', 'late', 'missed', 'not_tracked'];
const FAMILY_TYPES: LifeFamilyActionType[] = ['call', 'visit', 'support', 'task', 'important_date', 'gift', 'help', 'other'];
const FAMILY_STATUSES: LifeFamilyActionStatus[] = ['planned', 'done', 'postponed', 'cancelled'];
const PRIORITIES: LifePriority[] = ['high', 'medium', 'low'];

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

const formatWeekRange = (weekStart?: string) => {
  if (!weekStart) return '';
  const start = new Date(weekStart);
  const end = new Date(weekStart);
  end.setDate(end.getDate() + 6);
  return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`;
};

const todayStr = () => new Date().toISOString().slice(0, 10);

const qualityBadge = (rating?: string) => {
  if (rating === 'good') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (rating === 'poor') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-neutral-200 bg-neutral-50 text-neutral-600';
};

const energyBadge = (level?: string) => {
  if (level === 'high') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (level === 'low') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-neutral-200 bg-neutral-50 text-neutral-600';
};

const intensityBadge = (level?: string) => {
  if (level === 'high') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (level === 'low') return 'border-neutral-200 bg-neutral-50 text-neutral-500';
  return 'border-neutral-200 bg-neutral-50 text-neutral-600';
};

const prayerBadge = (status?: string) => {
  if (status === 'done') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'late') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'missed') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-neutral-200 bg-neutral-50 text-neutral-500';
};

const familyStatusBadge = (status: string) => {
  if (status === 'done') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (status === 'postponed') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (status === 'cancelled') return 'border-red-200 bg-red-50 text-red-700';
  return 'border-neutral-200 bg-neutral-50 text-neutral-600';
};

const familyTypeBadge = (type: string) => {
  return 'border-neutral-200 bg-neutral-50 text-neutral-600';
};

const priorityBadge = (p: string) => {
  if (p === 'high') return 'border-amber-200 bg-amber-50 text-amber-700';
  if (p === 'low') return 'border-neutral-200 bg-neutral-50 text-neutral-500';
  return 'border-neutral-200 bg-neutral-50 text-neutral-600';
};

interface LifeManagementPanelProps {
  lifeNutritionLogs: LifeNutritionLog[];
  lifeFitnessLogs: LifeFitnessLog[];
  lifeDeenLogs: LifeDeenLog[];
  lifeFamilyActions: LifeFamilyAction[];
  lifeWeeklyReviews: LifeWeeklyReview[];
  requestedTab?: LifeSection | null;
  onAddLifeNutritionLog: (input: LifeNutritionLogInput) => Promise<LifeNutritionLog>;
  onUpdateLifeNutritionLog: (id: string, input: Partial<LifeNutritionLogInput>) => Promise<LifeNutritionLog>;
  onDeleteLifeNutritionLog: (id: string) => Promise<void>;
  onAddLifeFitnessLog: (input: LifeFitnessLogInput) => Promise<LifeFitnessLog>;
  onUpdateLifeFitnessLog: (id: string, input: Partial<LifeFitnessLogInput>) => Promise<LifeFitnessLog>;
  onDeleteLifeFitnessLog: (id: string) => Promise<void>;
  onAddLifeDeenLog: (input: LifeDeenLogInput) => Promise<LifeDeenLog>;
  onUpdateLifeDeenLog: (id: string, input: Partial<LifeDeenLogInput>) => Promise<LifeDeenLog>;
  onDeleteLifeDeenLog: (id: string) => Promise<void>;
  onAddLifeFamilyAction: (input: LifeFamilyActionInput) => Promise<LifeFamilyAction>;
  onUpdateLifeFamilyAction: (id: string, input: Partial<LifeFamilyActionInput>) => Promise<LifeFamilyAction>;
  onDeleteLifeFamilyAction: (id: string) => Promise<void>;
  onAddLifeWeeklyReview: (input: LifeWeeklyReviewInput) => Promise<LifeWeeklyReview>;
  onUpdateLifeWeeklyReview: (id: string, input: Partial<LifeWeeklyReviewInput>) => Promise<LifeWeeklyReview>;
  onDeleteLifeWeeklyReview: (id: string) => Promise<void>;
}

export default function LifeManagementPanel(props: LifeManagementPanelProps) {
  const [activeTab, setActiveTab] = useState<LifeSection>('dashboard');
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => WEEK_START(new Date()));

  useEffect(() => {
    if (props.requestedTab) {
      setActiveTab(props.requestedTab);
    }
  }, [props.requestedTab]);

  const renderTabs = () => (
    <div className="border-b border-neutral-200">
      <div className="flex flex-wrap gap-1 overflow-x-auto">
        {LIFE_TABS.map((tab) => {
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

  return (
    <section className="space-y-7">
      {renderTabs()}
      {activeTab === 'dashboard' && (
        <DashboardView
          lifeNutritionLogs={props.lifeNutritionLogs}
          lifeFitnessLogs={props.lifeFitnessLogs}
          lifeDeenLogs={props.lifeDeenLogs}
          lifeFamilyActions={props.lifeFamilyActions}
          lifeWeeklyReviews={props.lifeWeeklyReviews}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
          selectedWeekStart={selectedWeekStart}
          onNavigate={setActiveTab}
        />
      )}
      {activeTab === 'nutrition' && (
        <NutritionView
          lifeNutritionLogs={props.lifeNutritionLogs}
          onAddLifeNutritionLog={props.onAddLifeNutritionLog}
          onUpdateLifeNutritionLog={props.onUpdateLifeNutritionLog}
          onDeleteLifeNutritionLog={props.onDeleteLifeNutritionLog}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
        />
      )}
      {activeTab === 'fitness' && (
        <FitnessView
          lifeFitnessLogs={props.lifeFitnessLogs}
          onAddLifeFitnessLog={props.onAddLifeFitnessLog}
          onUpdateLifeFitnessLog={props.onUpdateLifeFitnessLog}
          onDeleteLifeFitnessLog={props.onDeleteLifeFitnessLog}
          selectedWeekStart={selectedWeekStart}
          onSelectedWeekStartChange={setSelectedWeekStart}
        />
      )}
      {activeTab === 'deen' && (
        <DeenView
          lifeDeenLogs={props.lifeDeenLogs}
          onAddLifeDeenLog={props.onAddLifeDeenLog}
          onUpdateLifeDeenLog={props.onUpdateLifeDeenLog}
          onDeleteLifeDeenLog={props.onDeleteLifeDeenLog}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
        />
      )}
      {activeTab === 'family' && (
        <FamilyView
          lifeFamilyActions={props.lifeFamilyActions}
          onAddLifeFamilyAction={props.onAddLifeFamilyAction}
          onUpdateLifeFamilyAction={props.onUpdateLifeFamilyAction}
          onDeleteLifeFamilyAction={props.onDeleteLifeFamilyAction}
          selectedDate={selectedDate}
          onSelectedDateChange={setSelectedDate}
        />
      )}
      {activeTab === 'weekly-review' && (
        <WeeklyReviewView
          lifeWeeklyReviews={props.lifeWeeklyReviews}
          onAddLifeWeeklyReview={props.onAddLifeWeeklyReview}
          onUpdateLifeWeeklyReview={props.onUpdateLifeWeeklyReview}
          onDeleteLifeWeeklyReview={props.onDeleteLifeWeeklyReview}
          selectedWeekStart={selectedWeekStart}
          onSelectedWeekStartChange={setSelectedWeekStart}
        />
      )}
    </section>
  );
}

// ── Date/Week Nav ──

function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); onChange(d.toISOString().slice(0, 10)); }} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">&larr;</button>
      <span className="text-sm font-semibold text-neutral-900 min-w-[120px] text-center">{formatDate(date)}</span>
      <button type="button" onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); onChange(d.toISOString().slice(0, 10)); }} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">&rarr;</button>
      <button type="button" onClick={() => onChange(todayStr())} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">Today</button>
    </div>
  );
}

function WeekNav({ weekStart, onChange }: { weekStart: string; onChange: (w: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <button type="button" onClick={() => onChange(addWeeks(weekStart, -1))} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">&larr;</button>
      <span className="text-sm font-semibold text-neutral-900 min-w-[140px] text-center">Week of {formatDate(weekStart)}</span>
      <button type="button" onClick={() => onChange(addWeeks(weekStart, 1))} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">&rarr;</button>
      <button type="button" onClick={() => onChange(WEEK_START(new Date()))} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">This Week</button>
    </div>
  );
}

// ── Dashboard View ──

interface DashboardViewProps {
  lifeNutritionLogs: LifeNutritionLog[];
  lifeFitnessLogs: LifeFitnessLog[];
  lifeDeenLogs: LifeDeenLog[];
  lifeFamilyActions: LifeFamilyAction[];
  lifeWeeklyReviews: LifeWeeklyReview[];
  selectedDate: string;
  onSelectedDateChange: (d: string) => void;
  selectedWeekStart: string;
  onNavigate: (tab: LifeSection) => void;
}

function DashboardView(props: DashboardViewProps) {
  const todayNutrition = useMemo(() => props.lifeNutritionLogs.filter((l) => l.logDate === props.selectedDate), [props.lifeNutritionLogs, props.selectedDate]);
  const weekFitness = useMemo(() => props.lifeFitnessLogs.filter((l) => l.workoutDate >= props.selectedWeekStart && l.workoutDate < addWeeks(props.selectedWeekStart, 1)), [props.lifeFitnessLogs, props.selectedWeekStart]);
  const totalWeekMinutes = useMemo(() => weekFitness.reduce((s, l) => s + (l.durationMinutes || 0), 0), [weekFitness]);
  const todayDeen = useMemo(() => props.lifeDeenLogs.find((l) => l.logDate === props.selectedDate), [props.lifeDeenLogs, props.selectedDate]);
  const weekDeenQuran = useMemo(() => props.lifeDeenLogs.filter((l) => l.logDate >= props.selectedWeekStart && l.logDate < addWeeks(props.selectedWeekStart, 1)).reduce((s, l) => s + (l.quranMinutes || 0), 0), [props.lifeDeenLogs, props.selectedWeekStart]);
  const weekFamily = useMemo(() => props.lifeFamilyActions.filter((a) => a.actionDate >= props.selectedWeekStart && a.actionDate < addWeeks(props.selectedWeekStart, 1)), [props.lifeFamilyActions, props.selectedWeekStart]);
  const currentReview = useMemo(() => props.lifeWeeklyReviews.find((r) => r.weekStart === props.selectedWeekStart), [props.lifeWeeklyReviews, props.selectedWeekStart]);

  const prayerCount = todayDeen ? [todayDeen.fajr, todayDeen.dhuhr, todayDeen.asr, todayDeen.maghrib, todayDeen.isha].filter(Boolean).length : 0;

  const metricCards = [
    { label: 'Nutrition Logs Today', value: todayNutrition.length, subtitle: formatDate(props.selectedDate) },
    { label: 'Fitness Minutes This Week', value: totalWeekMinutes, subtitle: formatWeekRange(props.selectedWeekStart) },
    { label: 'Prayer Tracking Today', value: `${prayerCount}/5`, subtitle: formatDate(props.selectedDate) },
    { label: 'Quran Minutes This Week', value: weekDeenQuran, subtitle: formatWeekRange(props.selectedWeekStart) },
    { label: 'Family Actions This Week', value: weekFamily.length, subtitle: formatWeekRange(props.selectedWeekStart) },
    { label: 'Current Life Score', value: currentReview?.lifeScore ?? '—', subtitle: currentReview ? 'From weekly review' : 'No review yet' },
  ];

  const todayActions = useMemo(() => props.lifeFamilyActions.filter((a) => a.actionDate === props.selectedDate), [props.lifeFamilyActions, props.selectedDate]);

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
      <div className="space-y-7">
        <div className="grid gap-4 md:grid-cols-3">
          {metricCards.map((card) => (
            <div key={card.label} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="text-2xl font-semibold text-neutral-900">{card.value}</div>
              <div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">{card.label}</div>
              <div className="mt-1 text-xs text-neutral-400">{card.subtitle}</div>
            </div>
          ))}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <div className="flex items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-semibold text-neutral-900">Daily Overview</h3>
              <p className="mt-0.5 text-xs text-neutral-500">{formatDate(props.selectedDate)}</p>
            </div>
            <DateNav date={props.selectedDate} onChange={props.onSelectedDateChange} />
          </div>
          {todayNutrition.length === 0 && !todayDeen && todayActions.length === 0 ? (
            <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500 text-center">Nothing logged for this date yet.</div>
          ) : (
            <div className="space-y-3">
              {todayNutrition.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-2">Nutrition ({todayNutrition.length})</h4>
                  <div className="space-y-1.5">
                    {todayNutrition.map((log) => (
                      <div key={log.id} className="rounded-md bg-neutral-50 p-2.5 flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm text-neutral-900 capitalize">{log.mealType}</span>
                          {log.foodDescription && <span className="text-xs text-neutral-500 ml-2">{log.foodDescription}</span>}
                        </div>
                        <div className="flex gap-1.5 shrink-0">
                          {log.qualityRating && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${qualityBadge(log.qualityRating)}`}>{log.qualityRating}</span>}
                          {log.energyLevel && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${energyBadge(log.energyLevel)}`}>{log.energyLevel}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {todayDeen && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-2">Deen</h4>
                  <div className="rounded-md bg-neutral-50 p-2.5">
                    <div className="flex flex-wrap gap-1.5 mb-1.5">
                      {(['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'] as const).map((p) => (
                        <span key={p} className={`rounded-full border px-2 py-0.5 text-[10px] font-medium capitalize ${prayerBadge(todayDeen[p])}`}>{p}: {todayDeen[p] || '—'}</span>
                      ))}
                    </div>
                    {todayDeen.quranMinutes != null && <div className="text-xs text-neutral-600">Quran: {todayDeen.quranMinutes} min</div>}
                  </div>
                </div>
              )}
              {todayActions.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 mb-2">Family Actions ({todayActions.length})</h4>
                  <div className="space-y-1.5">
                    {todayActions.map((a) => (
                      <div key={a.id} className="rounded-md bg-neutral-50 p-2.5 flex items-center justify-between gap-2">
                        <span className="text-sm text-neutral-900 truncate">{a.title}</span>
                        <span className={`rounded-full border px-2 py-0.5 text-[10px] font-medium shrink-0 ${familyStatusBadge(a.status)}`}>{a.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-neutral-900 mb-3">Weekly Overview</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-md bg-neutral-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Fitness Minutes</div>
              <div className="text-lg font-semibold text-neutral-900 mt-1">{totalWeekMinutes}</div>
            </div>
            <div className="rounded-md bg-neutral-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Quran Minutes</div>
              <div className="text-lg font-semibold text-neutral-900 mt-1">{weekDeenQuran}</div>
            </div>
            <div className="rounded-md bg-neutral-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Family Actions</div>
              <div className="text-lg font-semibold text-neutral-900 mt-1">{weekFamily.length}</div>
            </div>
            <div className="rounded-md bg-neutral-50 p-3">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Nutrition Entries</div>
              <div className="text-lg font-semibold text-neutral-900 mt-1">{todayNutrition.length}</div>
            </div>
          </div>
          {currentReview && (
            <div className="mt-3 rounded-md bg-neutral-50 p-3 text-xs text-neutral-600">
              <span className="font-semibold text-neutral-900">Review:</span> {currentReview.summary || 'No summary'}
            </div>
          )}
        </div>

        {currentReview && (
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-neutral-900">Weekly Review</h3>
                <p className="mt-0.5 text-xs text-neutral-500">Week of {formatDate(props.selectedWeekStart)}</p>
              </div>
              <button type="button" onClick={() => props.onNavigate('weekly-review')} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">View</button>
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-md bg-neutral-50 p-2.5 text-center">
                <div className="text-lg font-semibold text-neutral-900">{currentReview.lifeScore ?? '—'}</div>
                <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-500">Life</div>
              </div>
              <div className="rounded-md bg-neutral-50 p-2.5 text-center">
                <div className="text-lg font-semibold text-neutral-900">{currentReview.healthScore ?? '—'}</div>
                <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-500">Health</div>
              </div>
              <div className="rounded-md bg-neutral-50 p-2.5 text-center">
                <div className="text-lg font-semibold text-neutral-900">{currentReview.deenScore ?? '—'}</div>
                <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-500">Deen</div>
              </div>
              <div className="rounded-md bg-neutral-50 p-2.5 text-center">
                <div className="text-lg font-semibold text-neutral-900">{currentReview.familyScore ?? '—'}</div>
                <div className="text-[10px] font-medium uppercase tracking-[0.1em] text-neutral-500">Family</div>
              </div>
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4 xl:sticky xl:top-4 xl:h-fit">
        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Weekly Scores</h3>
          <div className="mt-3 space-y-2">
            {currentReview ? (
              <>
                <div className="rounded-md bg-neutral-50 p-2.5 text-xs"><span className="font-medium text-neutral-900">Life:</span> <span className="text-neutral-600">{currentReview.lifeScore ?? '—'} /10</span></div>
                <div className="rounded-md bg-neutral-50 p-2.5 text-xs"><span className="font-medium text-neutral-900">Health:</span> <span className="text-neutral-600">{currentReview.healthScore ?? '—'} /10</span></div>
                <div className="rounded-md bg-neutral-50 p-2.5 text-xs"><span className="font-medium text-neutral-900">Deen:</span> <span className="text-neutral-600">{currentReview.deenScore ?? '—'} /10</span></div>
                <div className="rounded-md bg-neutral-50 p-2.5 text-xs"><span className="font-medium text-neutral-900">Family:</span> <span className="text-neutral-600">{currentReview.familyScore ?? '—'} /10</span></div>
              </>
            ) : (
              <div className="rounded-md bg-neutral-50 p-2.5 text-xs text-neutral-500">No review yet</div>
            )}
          </div>
        </div>

        {currentReview?.nextWeekFocus && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Next Week Focus</h3>
            <div className="mt-2 text-sm text-neutral-700">{currentReview.nextWeekFocus}</div>
          </div>
        )}

        {currentReview?.neglectedArea && (
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Neglected Area</h3>
            <div className="mt-2 text-sm text-neutral-700">{currentReview.neglectedArea}</div>
          </div>
        )}

        <div className="rounded-xl border border-neutral-200 bg-white p-4">
          <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Reminder</h3>
          <div className="mt-2 text-xs text-neutral-500 italic">Track honestly. Review weekly. Adjust gently.</div>
        </div>
      </aside>
    </div>
  );
}

// ── Nutrition View ──

interface NutritionViewProps {
  lifeNutritionLogs: LifeNutritionLog[];
  onAddLifeNutritionLog: (input: LifeNutritionLogInput) => Promise<LifeNutritionLog>;
  onUpdateLifeNutritionLog: (id: string, input: Partial<LifeNutritionLogInput>) => Promise<LifeNutritionLog>;
  onDeleteLifeNutritionLog: (id: string) => Promise<void>;
  selectedDate: string;
  onSelectedDateChange: (d: string) => void;
}

function NutritionView(props: NutritionViewProps) {
  const [form, setForm] = useState({ mealType: 'meal' as LifeMealType, foodDescription: '', qualityRating: '' as LifeQualityRating | '', energyLevel: '' as LifeEnergyLevel | '', notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const dayLogs = useMemo(() => props.lifeNutritionLogs.filter((l) => l.logDate === props.selectedDate), [props.lifeNutritionLogs, props.selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mealType) return;
    setSaving(true);
    try {
      const payload: LifeNutritionLogInput = {
        logDate: props.selectedDate,
        mealType: form.mealType,
        foodDescription: form.foodDescription || undefined,
        qualityRating: form.qualityRating || undefined,
        energyLevel: form.energyLevel || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) { await props.onUpdateLifeNutritionLog(editingId, payload); }
      else { await props.onAddLifeNutritionLog(payload); }
      setForm({ mealType: 'meal', foodDescription: '', qualityRating: '', energyLevel: '', notes: '' });
      setEditingId(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const startEdit = (log: LifeNutritionLog) => {
    setForm({ mealType: log.mealType, foodDescription: log.foodDescription || '', qualityRating: log.qualityRating || '', energyLevel: log.energyLevel || '', notes: log.notes || '' });
    setEditingId(log.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateNav date={props.selectedDate} onChange={props.onSelectedDateChange} />
        <button type="button" onClick={() => { setEditingId(null); setForm({ mealType: 'meal', foodDescription: '', qualityRating: '', energyLevel: '', notes: '' }); }} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">Add Meal</button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">{editingId ? 'Edit' : 'Add'} Meal Log</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Meal Type</div>
            <select value={form.mealType} onChange={(e) => setForm((p) => ({ ...p, mealType: e.target.value as LifeMealType }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Quality</div>
            <select value={form.qualityRating} onChange={(e) => setForm((p) => ({ ...p, qualityRating: e.target.value as LifeQualityRating }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              <option value="">—</option>
              {QUALITY_RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Energy Level</div>
            <select value={form.energyLevel} onChange={(e) => setForm((p) => ({ ...p, energyLevel: e.target.value as LifeEnergyLevel }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              <option value="">—</option>
              {ENERGY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className="space-y-1.5 md:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Food Description</div>
            <input value={form.foodDescription} onChange={(e) => setForm((p) => ({ ...p, foodDescription: e.target.value }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" placeholder="What did you eat?" />
          </label>
          <label className="space-y-1.5 md:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-70">{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</button>
            {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm({ mealType: 'meal', foodDescription: '', qualityRating: '', energyLevel: '', notes: '' }); }} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Cancel</button> : null}
          </div>
        </form>
      </div>

      <div className="space-y-2">
        {dayLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500 text-center">No nutrition logs for this date.</div>
        ) : (
          dayLogs.map((log) => (
            <div key={log.id} className="rounded-xl border border-neutral-200 bg-white p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900 capitalize">{log.mealType}</span>
                  {log.qualityRating ? <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${qualityBadge(log.qualityRating)}`}>{log.qualityRating}</span> : null}
                  {log.energyLevel ? <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${energyBadge(log.energyLevel)}`}>{log.energyLevel}</span> : null}
                </div>
                {log.foodDescription ? <div className="mt-1 text-sm text-neutral-700">{log.foodDescription}</div> : null}
                {log.notes ? <div className="mt-0.5 text-xs text-neutral-500">{log.notes}</div> : null}
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => startEdit(log)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">Edit</button>
                <button type="button" onClick={() => { if (window.confirm('Delete this log?')) props.onDeleteLifeNutritionLog(log.id); }} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors">Del</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Fitness View ──

interface FitnessViewProps {
  lifeFitnessLogs: LifeFitnessLog[];
  onAddLifeFitnessLog: (input: LifeFitnessLogInput) => Promise<LifeFitnessLog>;
  onUpdateLifeFitnessLog: (id: string, input: Partial<LifeFitnessLogInput>) => Promise<LifeFitnessLog>;
  onDeleteLifeFitnessLog: (id: string) => Promise<void>;
  selectedWeekStart: string;
  onSelectedWeekStartChange: (w: string) => void;
}

function FitnessView(props: FitnessViewProps) {
  const [form, setForm] = useState({ workoutType: 'general' as LifeWorkoutType, durationMinutes: '', intensity: '' as LifeIntensity | '', exercises: '', bodyNotes: '', recoveryNotes: '', notes: '', workoutDate: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const weekLogs = useMemo(() => props.lifeFitnessLogs.filter((l) => l.workoutDate >= props.selectedWeekStart && l.workoutDate < addWeeks(props.selectedWeekStart, 1)), [props.lifeFitnessLogs, props.selectedWeekStart]);
  const totalMinutes = useMemo(() => weekLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0), [weekLogs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.workoutType) return;
    setSaving(true);
    try {
      const payload: LifeFitnessLogInput = {
        workoutDate: form.workoutDate || props.selectedWeekStart,
        workoutType: form.workoutType,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        intensity: form.intensity || undefined,
        exercises: form.exercises || undefined,
        bodyNotes: form.bodyNotes || undefined,
        recoveryNotes: form.recoveryNotes || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) { await props.onUpdateLifeFitnessLog(editingId, payload); }
      else { await props.onAddLifeFitnessLog(payload); }
      setForm({ workoutType: 'general', durationMinutes: '', intensity: '', exercises: '', bodyNotes: '', recoveryNotes: '', notes: '', workoutDate: '' });
      setEditingId(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const startEdit = (log: LifeFitnessLog) => {
    setForm({ workoutType: log.workoutType, durationMinutes: String(log.durationMinutes || ''), intensity: log.intensity || '', exercises: log.exercises || '', bodyNotes: log.bodyNotes || '', recoveryNotes: log.recoveryNotes || '', notes: log.notes || '', workoutDate: log.workoutDate });
    setEditingId(log.id);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekNav weekStart={props.selectedWeekStart} onChange={props.onSelectedWeekStartChange} />
        <button type="button" onClick={() => { setEditingId(null); setForm({ workoutType: 'general', durationMinutes: '', intensity: '', exercises: '', bodyNotes: '', recoveryNotes: '', notes: '', workoutDate: '' }); }} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">Add Workout</button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 inline-flex items-center gap-2">
        <span className="text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Total This Week</span>
        <span className="text-lg font-semibold text-neutral-900">{totalMinutes} min</span>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">{editingId ? 'Edit' : 'Add'} Workout</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Workout Type</div>
            <select value={form.workoutType} onChange={(e) => setForm((p) => ({ ...p, workoutType: e.target.value as LifeWorkoutType }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Duration (min)</div>
            <input type="number" min="0" value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Intensity</div>
            <select value={form.intensity} onChange={(e) => setForm((p) => ({ ...p, intensity: e.target.value as LifeIntensity }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              <option value="">—</option>
              {INTENSITIES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Date</div>
            <input type="date" value={form.workoutDate || props.selectedWeekStart} onChange={(e) => setForm((p) => ({ ...p, workoutDate: e.target.value }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
          </label>
          <label className="space-y-1.5 md:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Exercises</div>
            <textarea value={form.exercises} onChange={(e) => setForm((p) => ({ ...p, exercises: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Body Notes</div>
            <textarea value={form.bodyNotes} onChange={(e) => setForm((p) => ({ ...p, bodyNotes: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Recovery Notes</div>
            <textarea value={form.recoveryNotes} onChange={(e) => setForm((p) => ({ ...p, recoveryNotes: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>
          <label className="space-y-1.5 md:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-70">{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</button>
            {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm({ workoutType: 'general', durationMinutes: '', intensity: '', exercises: '', bodyNotes: '', recoveryNotes: '', notes: '', workoutDate: '' }); }} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Cancel</button> : null}
          </div>
        </form>
      </div>

      <div className="space-y-2">
        {weekLogs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500 text-center">No workouts logged this week.</div>
        ) : (
          weekLogs.map((log) => (
            <div key={log.id} className="rounded-xl border border-neutral-200 bg-white p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-neutral-900 capitalize">{log.workoutType}</span>
                  {log.durationMinutes ? <span className="text-xs text-neutral-500">{log.durationMinutes} min</span> : null}
                  {log.intensity ? <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${intensityBadge(log.intensity)}`}>{log.intensity}</span> : null}
                </div>
                <div className="text-xs text-neutral-500 mt-0.5">{formatDate(log.workoutDate)}</div>
                {log.exercises ? <div className="mt-1 text-sm text-neutral-700">{log.exercises}</div> : null}
                {log.bodyNotes ? <div className="mt-0.5 text-xs text-neutral-500">{log.bodyNotes}</div> : null}
                {log.recoveryNotes ? <div className="mt-0.5 text-xs text-neutral-500">Recovery: {log.recoveryNotes}</div> : null}
              </div>
              <div className="flex gap-2 shrink-0">
                <button type="button" onClick={() => startEdit(log)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">Edit</button>
                <button type="button" onClick={() => { if (window.confirm('Delete this workout?')) props.onDeleteLifeFitnessLog(log.id); }} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors">Del</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Deen View ──

interface DeenViewProps {
  lifeDeenLogs: LifeDeenLog[];
  onAddLifeDeenLog: (input: LifeDeenLogInput) => Promise<LifeDeenLog>;
  onUpdateLifeDeenLog: (id: string, input: Partial<LifeDeenLogInput>) => Promise<LifeDeenLog>;
  onDeleteLifeDeenLog: (id: string) => Promise<void>;
  selectedDate: string;
  onSelectedDateChange: (d: string) => void;
}

function DeenView(props: DeenViewProps) {
  const existingLog = useMemo(() => props.lifeDeenLogs.find((l) => l.logDate === props.selectedDate), [props.lifeDeenLogs, props.selectedDate]);
  const [form, setForm] = useState<LifeDeenLogInput>({ logDate: '', fajr: undefined, dhuhr: undefined, asr: undefined, maghrib: undefined, isha: undefined, quranMinutes: undefined, dhikrDone: undefined, learningMinutes: undefined, charityNotes: '', reflection: '', notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingLog) {
      setForm({
        logDate: existingLog.logDate, fajr: existingLog.fajr, dhuhr: existingLog.dhuhr, asr: existingLog.asr, maghrib: existingLog.maghrib, isha: existingLog.isha,
        quranMinutes: existingLog.quranMinutes, dhikrDone: existingLog.dhikrDone, learningMinutes: existingLog.learningMinutes,
        charityNotes: existingLog.charityNotes || '', reflection: existingLog.reflection || '', notes: existingLog.notes || '',
      });
    } else {
      setForm({ logDate: props.selectedDate, fajr: undefined, dhuhr: undefined, asr: undefined, maghrib: undefined, isha: undefined, quranMinutes: undefined, dhikrDone: undefined, learningMinutes: undefined, charityNotes: '', reflection: '', notes: '' });
    }
  }, [existingLog, props.selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: LifeDeenLogInput = {
        logDate: props.selectedDate,
        fajr: form.fajr, dhuhr: form.dhuhr, asr: form.asr, maghrib: form.maghrib, isha: form.isha,
        quranMinutes: form.quranMinutes, dhikrDone: form.dhikrDone, learningMinutes: form.learningMinutes,
        charityNotes: form.charityNotes || undefined, reflection: form.reflection || undefined, notes: form.notes || undefined,
      };
      if (existingLog) { await props.onUpdateLifeDeenLog(existingLog.id, payload); }
      else { await props.onAddLifeDeenLog(payload); }
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const prayerFields: Array<{ key: keyof LifeDeenLogInput; label: string }> = [
    { key: 'fajr', label: 'Fajr' },
    { key: 'dhuhr', label: 'Dhuhr' },
    { key: 'asr', label: 'Asr' },
    { key: 'maghrib', label: 'Maghrib' },
    { key: 'isha', label: 'Isha' },
  ];

  return (
    <div className="space-y-4">
      <DateNav date={props.selectedDate} onChange={props.onSelectedDateChange} />

      {!existingLog && (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500 text-center">No deen log for this date yet.</div>
      )}

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-1">{existingLog ? 'Edit' : 'Record'} Deen Log</h3>
        <p className="text-xs text-neutral-500 mb-4">Track your daily worship and spiritual growth. This is for personal review only.</p>

        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-3 grid grid-cols-5 gap-3">
            {prayerFields.map((pf) => (
              <div key={pf.key}>
                <label className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 block mb-1.5">{pf.label}</label>
                <select value={form[pf.key] || ''} onChange={(e) => setForm((p) => ({ ...p, [pf.key]: e.target.value as LifePrayerStatus || undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  <option value="">—</option>
                  {PRAYER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
            ))}
          </div>

          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Quran (minutes)</div>
            <input type="number" min="0" value={form.quranMinutes ?? ''} onChange={(e) => setForm((p) => ({ ...p, quranMinutes: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Dhikr Done</div>
            <select value={form.dhikrDone ? 'yes' : form.dhikrDone === false ? 'no' : ''} onChange={(e) => setForm((p) => ({ ...p, dhikrDone: e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Learning (minutes)</div>
            <input type="number" min="0" value={form.learningMinutes ?? ''} onChange={(e) => setForm((p) => ({ ...p, learningMinutes: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
          </label>
          <label className="space-y-1.5 md:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Charity / Sadaqah Notes</div>
            <textarea value={form.charityNotes} onChange={(e) => setForm((p) => ({ ...p, charityNotes: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>
          <label className="space-y-1.5 md:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Reflection</div>
            <textarea value={form.reflection} onChange={(e) => setForm((p) => ({ ...p, reflection: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>
          <label className="space-y-1.5 md:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>

          <div className="md:col-span-3 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-70">{saving ? 'Saving...' : existingLog ? 'Update' : 'Save'}</button>
            {existingLog ? <button type="button" onClick={() => { if (window.confirm('Delete this deen log?')) props.onDeleteLifeDeenLog(existingLog.id); }} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Delete</button> : null}
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Family View ──

interface FamilyViewProps {
  lifeFamilyActions: LifeFamilyAction[];
  onAddLifeFamilyAction: (input: LifeFamilyActionInput) => Promise<LifeFamilyAction>;
  onUpdateLifeFamilyAction: (id: string, input: Partial<LifeFamilyActionInput>) => Promise<LifeFamilyAction>;
  onDeleteLifeFamilyAction: (id: string) => Promise<void>;
  selectedDate: string;
  onSelectedDateChange: (d: string) => void;
}

function FamilyView(props: FamilyViewProps) {
  const [form, setForm] = useState({ title: '', type: 'other' as LifeFamilyActionType, status: 'planned' as LifeFamilyActionStatus, priority: 'medium' as LifePriority, personName: '', description: '', outcome: '', nextAction: '', notes: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.type) return;
    setSaving(true);
    try {
      const payload: LifeFamilyActionInput = {
        actionDate: props.selectedDate, title: form.title.trim(), type: form.type,
        status: form.status, priority: form.priority, personName: form.personName || undefined,
        description: form.description || undefined, outcome: form.outcome || undefined,
        nextAction: form.nextAction || undefined, notes: form.notes || undefined,
      };
      if (editingId) { await props.onUpdateLifeFamilyAction(editingId, payload); }
      else { await props.onAddLifeFamilyAction(payload); }
      setForm({ title: '', type: 'other', status: 'planned', priority: 'medium', personName: '', description: '', outcome: '', nextAction: '', notes: '' });
      setEditingId(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const startEdit = (action: LifeFamilyAction) => {
    setForm({ title: action.title, type: action.type, status: action.status, priority: action.priority, personName: action.personName || '', description: action.description || '', outcome: action.outcome || '', nextAction: action.nextAction || '', notes: action.notes || '' });
    setEditingId(action.id);
  };

  const markDone = async (action: LifeFamilyAction) => { await props.onUpdateLifeFamilyAction(action.id, { status: 'done' }); };
  const markPostponed = async (action: LifeFamilyAction) => { await props.onUpdateLifeFamilyAction(action.id, { status: 'postponed' }); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DateNav date={props.selectedDate} onChange={props.onSelectedDateChange} />
        <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', type: 'other', status: 'planned', priority: 'medium', personName: '', description: '', outcome: '', nextAction: '', notes: '' }); }} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">Add Family Action</button>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-neutral-900 mb-4">{editingId ? 'Edit' : 'Add'} Family Action</h3>
        <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
          <label className="space-y-1.5 md:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Title *</div>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Type</div>
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as LifeFamilyActionType }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              {FAMILY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Status</div>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as LifeFamilyActionStatus }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              {FAMILY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Priority</div>
            <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as LifePriority }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Person Name</div>
            <input value={form.personName} onChange={(e) => setForm((p) => ({ ...p, personName: e.target.value }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
          </label>
          <label className="space-y-1.5 md:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Description</div>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Outcome</div>
            <textarea value={form.outcome} onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>
          <label className="space-y-1.5">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Next Action</div>
            <textarea value={form.nextAction} onChange={(e) => setForm((p) => ({ ...p, nextAction: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>
          <label className="space-y-1.5 md:col-span-3">
            <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
          </label>
          <div className="md:col-span-3 flex gap-2">
            <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-70">{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</button>
            {editingId ? <button type="button" onClick={() => { setEditingId(null); setForm({ title: '', type: 'other', status: 'planned', priority: 'medium', personName: '', description: '', outcome: '', nextAction: '', notes: '' }); }} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">Cancel</button> : null}
          </div>
        </form>
      </div>

      <div className="space-y-2">
        {props.lifeFamilyActions.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500 text-center">No family actions yet.</div>
        ) : (
          props.lifeFamilyActions.filter((a) => !props.selectedDate || a.actionDate === props.selectedDate).map((action) => (
            <div key={action.id} className="rounded-xl border border-neutral-200 bg-white p-4 flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-neutral-900">{action.title}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${familyTypeBadge(action.type)}`}>{action.type}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${familyStatusBadge(action.status)}`}>{action.status}</span>
                  <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityBadge(action.priority)}`}>{action.priority}</span>
                </div>
                {action.personName ? <div className="text-xs text-neutral-500 mt-1">{action.personName}</div> : null}
                {action.description ? <div className="text-sm text-neutral-700 mt-1">{action.description}</div> : null}
                {action.outcome ? <div className="text-xs text-neutral-500 mt-0.5">Outcome: {action.outcome}</div> : null}
                {action.nextAction ? <div className="text-xs text-neutral-500 mt-0.5">Next: {action.nextAction}</div> : null}
              </div>
              <div className="flex gap-2 shrink-0">
                {action.status !== 'done' ? <button type="button" onClick={() => markDone(action)} className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800 transition-colors">Done</button> : null}
                {action.status !== 'postponed' && action.status !== 'done' ? <button type="button" onClick={() => markPostponed(action)} className="rounded-md border border-amber-200 bg-white px-3 py-1.5 text-xs text-amber-700 hover:bg-amber-50 transition-colors">Postpone</button> : null}
                <button type="button" onClick={() => startEdit(action)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-900 hover:bg-neutral-50 transition-colors">Edit</button>
                <button type="button" onClick={() => { if (window.confirm('Delete this action?')) props.onDeleteLifeFamilyAction(action.id); }} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 transition-colors">Del</button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

// ── Weekly Review View ──

interface WeeklyReviewViewProps {
  lifeWeeklyReviews: LifeWeeklyReview[];
  onAddLifeWeeklyReview: (input: LifeWeeklyReviewInput) => Promise<LifeWeeklyReview>;
  onUpdateLifeWeeklyReview: (id: string, input: Partial<LifeWeeklyReviewInput>) => Promise<LifeWeeklyReview>;
  onDeleteLifeWeeklyReview: (id: string) => Promise<void>;
  selectedWeekStart: string;
  onSelectedWeekStartChange: (w: string) => void;
}

function WeeklyReviewView(props: WeeklyReviewViewProps) {
  const existingReview = useMemo(() => props.lifeWeeklyReviews.find((r) => r.weekStart === props.selectedWeekStart), [props.lifeWeeklyReviews, props.selectedWeekStart]);
  const [form, setForm] = useState<LifeWeeklyReviewInput>({ weekStart: '', summary: '', healthReview: '', nutritionReview: '', fitnessReview: '', deenReview: '', familyReview: '', whatWorked: '', whatFailed: '', neglectedArea: '', nextWeekFocus: '', lifeScore: undefined, healthScore: undefined, deenScore: undefined, familyScore: undefined, notes: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (existingReview) {
      setForm({
        weekStart: existingReview.weekStart, summary: existingReview.summary || '', healthReview: existingReview.healthReview || '',
        nutritionReview: existingReview.nutritionReview || '', fitnessReview: existingReview.fitnessReview || '',
        deenReview: existingReview.deenReview || '', familyReview: existingReview.familyReview || '',
        whatWorked: existingReview.whatWorked || '', whatFailed: existingReview.whatFailed || '',
        neglectedArea: existingReview.neglectedArea || '', nextWeekFocus: existingReview.nextWeekFocus || '',
        lifeScore: existingReview.lifeScore, healthScore: existingReview.healthScore,
        deenScore: existingReview.deenScore, familyScore: existingReview.familyScore, notes: existingReview.notes || '',
      });
    } else {
      setForm({ weekStart: props.selectedWeekStart, summary: '', healthReview: '', nutritionReview: '', fitnessReview: '', deenReview: '', familyReview: '', whatWorked: '', whatFailed: '', neglectedArea: '', nextWeekFocus: '', lifeScore: undefined, healthScore: undefined, deenScore: undefined, familyScore: undefined, notes: '' });
    }
  }, [existingReview, props.selectedWeekStart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: LifeWeeklyReviewInput = {
        weekStart: props.selectedWeekStart, summary: form.summary || undefined, healthReview: form.healthReview || undefined,
        nutritionReview: form.nutritionReview || undefined, fitnessReview: form.fitnessReview || undefined,
        deenReview: form.deenReview || undefined, familyReview: form.familyReview || undefined,
        whatWorked: form.whatWorked || undefined, whatFailed: form.whatFailed || undefined,
        neglectedArea: form.neglectedArea || undefined, nextWeekFocus: form.nextWeekFocus || undefined,
        lifeScore: form.lifeScore, healthScore: form.healthScore, deenScore: form.deenScore, familyScore: form.familyScore,
        notes: form.notes || undefined,
      };
      if (existingReview) { await props.onUpdateLifeWeeklyReview(existingReview.id, payload); }
      else { await props.onAddLifeWeeklyReview(payload); }
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <WeekNav weekStart={props.selectedWeekStart} onChange={props.onSelectedWeekStartChange} />
        {!existingReview && (
          <button type="button" onClick={() => setForm({ weekStart: props.selectedWeekStart, summary: '', healthReview: '', nutritionReview: '', fitnessReview: '', deenReview: '', familyReview: '', whatWorked: '', whatFailed: '', neglectedArea: '', nextWeekFocus: '', lifeScore: undefined, healthScore: undefined, deenScore: undefined, familyScore: undefined, notes: '' })} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors">Create Weekly Review</button>
        )}
      </div>

      {!existingReview ? (
        <div className="rounded-xl border border-dashed border-neutral-300 bg-white p-6 text-sm text-neutral-500 text-center">No weekly life review yet. Create one to reflect on your week.</div>
      ) : (
        <div className="space-y-6">
          {existingReview.lifeScore != null && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
                <div className="text-2xl font-semibold text-neutral-900">{existingReview.lifeScore ?? '—'}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Life</div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
                <div className="text-2xl font-semibold text-neutral-900">{existingReview.healthScore ?? '—'}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Health</div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
                <div className="text-2xl font-semibold text-neutral-900">{existingReview.deenScore ?? '—'}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Deen</div>
              </div>
              <div className="rounded-xl border border-neutral-200 bg-white p-4 text-center">
                <div className="text-2xl font-semibold text-neutral-900">{existingReview.familyScore ?? '—'}</div>
                <div className="mt-1 text-xs font-medium uppercase tracking-[0.1em] text-neutral-500">Family</div>
              </div>
            </div>
          )}

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-neutral-900 mb-1">Review Summary</h3>
            <p className="text-xs text-neutral-500 mb-4">Week of {formatDate(props.selectedWeekStart)}</p>
            <div className="grid gap-4 md:grid-cols-2">
              {existingReview.summary && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700 md:col-span-2"><span className="font-semibold text-neutral-900">Summary:</span> {existingReview.summary}</div>}
              {existingReview.healthReview && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700"><span className="font-semibold text-neutral-900">Health:</span> {existingReview.healthReview}</div>}
              {existingReview.nutritionReview && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700"><span className="font-semibold text-neutral-900">Nutrition:</span> {existingReview.nutritionReview}</div>}
              {existingReview.fitnessReview && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700"><span className="font-semibold text-neutral-900">Fitness:</span> {existingReview.fitnessReview}</div>}
              {existingReview.deenReview && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700"><span className="font-semibold text-neutral-900">Deen:</span> {existingReview.deenReview}</div>}
              {existingReview.familyReview && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700"><span className="font-semibold text-neutral-900">Family:</span> {existingReview.familyReview}</div>}
              {existingReview.whatWorked && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700"><span className="font-semibold text-neutral-900">What Worked:</span> {existingReview.whatWorked}</div>}
              {existingReview.whatFailed && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700"><span className="font-semibold text-neutral-900">What Failed:</span> {existingReview.whatFailed}</div>}
              {existingReview.neglectedArea && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700"><span className="font-semibold text-neutral-900">Neglected:</span> {existingReview.neglectedArea}</div>}
              {existingReview.nextWeekFocus && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700"><span className="font-semibold text-neutral-900">Next Focus:</span> {existingReview.nextWeekFocus}</div>}
              {existingReview.notes && <div className="rounded-md bg-neutral-50 p-3 text-sm text-neutral-700 md:col-span-2"><span className="font-semibold text-neutral-900">Notes:</span> {existingReview.notes}</div>}
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h3 className="text-sm font-semibold text-neutral-900 mb-4">Edit Weekly Review</h3>
            <form onSubmit={handleSubmit} className="grid gap-4 md:grid-cols-3">
              <label className="space-y-1.5 md:col-span-3">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Summary</div>
                <textarea value={form.summary || ''} onChange={(e) => setForm((p) => ({ ...p, summary: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Health Review</div>
                <textarea value={form.healthReview || ''} onChange={(e) => setForm((p) => ({ ...p, healthReview: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Nutrition Review</div>
                <textarea value={form.nutritionReview || ''} onChange={(e) => setForm((p) => ({ ...p, nutritionReview: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Fitness Review</div>
                <textarea value={form.fitnessReview || ''} onChange={(e) => setForm((p) => ({ ...p, fitnessReview: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Deen Review</div>
                <textarea value={form.deenReview || ''} onChange={(e) => setForm((p) => ({ ...p, deenReview: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Family Review</div>
                <textarea value={form.familyReview || ''} onChange={(e) => setForm((p) => ({ ...p, familyReview: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">What Worked</div>
                <textarea value={form.whatWorked || ''} onChange={(e) => setForm((p) => ({ ...p, whatWorked: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">What Failed / Challenges</div>
                <textarea value={form.whatFailed || ''} onChange={(e) => setForm((p) => ({ ...p, whatFailed: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Neglected Area</div>
                <textarea value={form.neglectedArea || ''} onChange={(e) => setForm((p) => ({ ...p, neglectedArea: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Next Week Focus</div>
                <textarea value={form.nextWeekFocus || ''} onChange={(e) => setForm((p) => ({ ...p, nextWeekFocus: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Life Score</div>
                <select value={form.lifeScore ?? ''} onChange={(e) => setForm((p) => ({ ...p, lifeScore: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  <option value="">—</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Health Score</div>
                <select value={form.healthScore ?? ''} onChange={(e) => setForm((p) => ({ ...p, healthScore: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  <option value="">—</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Deen Score</div>
                <select value={form.deenScore ?? ''} onChange={(e) => setForm((p) => ({ ...p, deenScore: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  <option value="">—</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="space-y-1.5">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Family Score</div>
                <select value={form.familyScore ?? ''} onChange={(e) => setForm((p) => ({ ...p, familyScore: e.target.value ? Number(e.target.value) : undefined }))} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  <option value="">—</option>
                  {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </label>
              <label className="space-y-1.5 md:col-span-3">
                <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Notes</div>
                <textarea value={form.notes || ''} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none focus:border-neutral-400" rows={2} />
              </label>
              <div className="md:col-span-3 flex gap-2">
                <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 transition-colors disabled:opacity-70">{saving ? 'Saving...' : 'Update'}</button>
                <button type="button" onClick={() => { if (window.confirm('Delete this review?')) props.onDeleteLifeWeeklyReview(existingReview.id); }} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors">Delete</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
