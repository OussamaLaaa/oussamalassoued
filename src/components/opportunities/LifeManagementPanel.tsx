import React, { useMemo } from 'react';
import { Button } from '../ui';
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

const LIFE_SECTION_KEYS = ['dashboard', 'nutrition', 'fitness', 'deen', 'family', 'weekly-review'] as const;
type LifeSection = typeof LIFE_SECTION_KEYS[number];

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

const todayStr = () => new Date().toISOString().slice(0, 10);

interface LifeManagementPanelProps {
  lifeNutritionLogs: LifeNutritionLog[];
  lifeFitnessLogs: LifeFitnessLog[];
  lifeDeenLogs: LifeDeenLog[];
  lifeFamilyActions: LifeFamilyAction[];
  lifeWeeklyReviews: LifeWeeklyReview[];
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
  const [section, setSection] = React.useState<LifeSection>('dashboard');
  const [selectedDate, setSelectedDate] = React.useState(todayStr);
  const [selectedWeekStart, setSelectedWeekStart] = React.useState(() => WEEK_START(new Date()));

  const sectionNav = (
    <div className="flex flex-wrap gap-1.5 mb-4">
      {LIFE_SECTION_KEYS.map((key) => (
        <button
          key={key}
          onClick={() => setSection(key)}
          className={`px-3 py-1.5 text-xs rounded-lg font-medium transition-all ${section === key ? 'bg-black text-white' : 'bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50'}`}
        >
          {key === 'weekly-review' ? 'Weekly Review' : key.charAt(0).toUpperCase() + key.slice(1)}
        </button>
      ))}
    </div>
  );

  if (section === 'dashboard') return <LifeDashboard {...props} sectionNav={sectionNav} selectedDate={selectedDate} selectedWeekStart={selectedWeekStart} />;
  if (section === 'nutrition') return <NutritionSection {...props} sectionNav={sectionNav} selectedDate={selectedDate} onSetSelectedDate={setSelectedDate} />;
  if (section === 'fitness') return <FitnessSection {...props} sectionNav={sectionNav} selectedWeekStart={selectedWeekStart} onSetSelectedWeekStart={setSelectedWeekStart} />;
  if (section === 'deen') return <DeenSection {...props} sectionNav={sectionNav} selectedDate={selectedDate} onSetSelectedDate={setSelectedDate} />;
  if (section === 'family') return <FamilySection {...props} sectionNav={sectionNav} selectedDate={selectedDate} onSetSelectedDate={setSelectedDate} />;
  if (section === 'weekly-review') return <WeeklyReviewSection {...props} sectionNav={sectionNav} selectedWeekStart={selectedWeekStart} onSetSelectedWeekStart={setSelectedWeekStart} />;
  return null;
}

function DateNav({ date, onChange }: { date: string; onChange: (d: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); onChange(d.toISOString().slice(0, 10)); }} className="text-xs px-2 py-1 rounded-lg border border-neutral-200 text-black">←</button>
      <span className="text-xs font-medium text-black min-w-[120px] text-center">{formatDate(date)}</span>
      <button onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); onChange(d.toISOString().slice(0, 10)); }} className="text-xs px-2 py-1 rounded-lg border border-neutral-200 text-black">→</button>
      <button onClick={() => onChange(todayStr())} className="text-xs px-2 py-1 rounded-lg bg-black text-white">Today</button>
    </div>
  );
}

function WeekNav({ weekStart, onChange }: { weekStart: string; onChange: (w: string) => void }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <button onClick={() => onChange(addWeeks(weekStart, -1))} className="text-xs px-2 py-1 rounded-lg border border-neutral-200 text-black">←</button>
      <span className="text-xs font-medium text-black min-w-[140px] text-center">Week of {formatDate(weekStart)}</span>
      <button onClick={() => onChange(addWeeks(weekStart, 1))} className="text-xs px-2 py-1 rounded-lg border border-neutral-200 text-black">→</button>
      <button onClick={() => onChange(WEEK_START(new Date()))} className="text-xs px-2 py-1 rounded-lg bg-black text-white">This Week</button>
    </div>
  );
}

type SectionProps = LifeManagementPanelProps & {
  sectionNav: React.ReactNode;
  selectedDate?: string;
  selectedWeekStart?: string;
  onSetSelectedDate?: (d: string) => void;
  onSetSelectedWeekStart?: (w: string) => void;
};

function LifeDashboard({ lifeNutritionLogs, lifeFitnessLogs, lifeDeenLogs, lifeFamilyActions, lifeWeeklyReviews, sectionNav, selectedDate, selectedWeekStart }: SectionProps) {
  const todayNutrition = useMemo(() => lifeNutritionLogs.filter((l) => l.logDate === selectedDate), [lifeNutritionLogs, selectedDate]);
  const weekFitness = useMemo(() => lifeFitnessLogs.filter((l) => l.workoutDate >= (selectedWeekStart || '') && l.workoutDate < addWeeks(selectedWeekStart || '', 1)), [lifeFitnessLogs, selectedWeekStart]);
  const totalWeekMinutes = useMemo(() => weekFitness.reduce((s, l) => s + (l.durationMinutes || 0), 0), [weekFitness]);
  const todayDeen = useMemo(() => lifeDeenLogs.find((l) => l.logDate === selectedDate), [lifeDeenLogs, selectedDate]);
  const weekDeenQuran = useMemo(() => lifeDeenLogs.filter((l) => l.logDate >= (selectedWeekStart || '') && l.logDate < addWeeks(selectedWeekStart || '', 1)).reduce((s, l) => s + (l.quranMinutes || 0), 0), [lifeDeenLogs, selectedWeekStart]);
  const weekFamily = useMemo(() => lifeFamilyActions.filter((a) => a.actionDate >= (selectedWeekStart || '') && a.actionDate < addWeeks(selectedWeekStart || '', 1)), [lifeFamilyActions, selectedWeekStart]);
  const currentReview = useMemo(() => lifeWeeklyReviews.find((r) => r.weekStart === selectedWeekStart), [lifeWeeklyReviews, selectedWeekStart]);

  const cards = [
    { label: 'Meals Today', value: todayNutrition.length, color: 'bg-emerald-600' },
    { label: 'Fitness Minutes This Week', value: totalWeekMinutes, color: 'bg-blue-600' },
    { label: 'Prayers Tracked Today', value: todayDeen ? [todayDeen.fajr, todayDeen.dhuhr, todayDeen.asr, todayDeen.maghrib, todayDeen.isha].filter(Boolean).length : 0, color: 'bg-violet-600' },
    { label: 'Quran Minutes This Week', value: weekDeenQuran, color: 'bg-amber-600' },
    { label: 'Family Actions This Week', value: weekFamily.length, color: 'bg-rose-600' },
    { label: 'Life Score', value: currentReview?.lifeScore ?? '—', color: 'bg-black' },
  ];

  return (
    <div>
      {sectionNav}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        {cards.map((card) => (
          <div key={card.label} className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
            <div className={`w-8 h-1 rounded-full mb-2 ${card.color}`} />
            <div className="text-2xl font-bold text-black">{card.value}</div>
            <div className="text-xs text-neutral-500 mt-1">{card.label}</div>
          </div>
        ))}
      </div>
      {currentReview ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-semibold text-black mb-1">Weekly Review for {formatDate(selectedWeekStart)}</div>
          <div className="text-xs text-neutral-500">{currentReview.summary || 'No summary'}</div>
          <div className="flex gap-3 mt-2 text-xs text-neutral-500">
            {currentReview.healthScore != null ? <span>Health: {currentReview.healthScore}/10</span> : null}
            {currentReview.deenScore != null ? <span>Deen: {currentReview.deenScore}/10</span> : null}
            {currentReview.familyScore != null ? <span>Family: {currentReview.familyScore}/10</span> : null}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-center">
          <div className="text-xs text-neutral-500">No weekly review for this week. Switch to Weekly Review tab to create one.</div>
        </div>
      )}
    </div>
  );
}

function NutritionSection({ lifeNutritionLogs, onAddLifeNutritionLog, onUpdateLifeNutritionLog, onDeleteLifeNutritionLog, sectionNav, selectedDate, onSetSelectedDate }: SectionProps) {
  const [form, setForm] = React.useState({ mealType: 'meal' as LifeMealType, foodDescription: '', qualityRating: '' as LifeQualityRating | '', energyLevel: '' as LifeEnergyLevel | '', notes: '' });
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const dayLogs = useMemo(() => lifeNutritionLogs.filter((l) => l.logDate === selectedDate), [lifeNutritionLogs, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.mealType) return;
    setSaving(true);
    try {
      const payload: LifeNutritionLogInput = {
        logDate: selectedDate!,
        mealType: form.mealType,
        foodDescription: form.foodDescription || undefined,
        qualityRating: form.qualityRating || undefined,
        energyLevel: form.energyLevel || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) {
        await onUpdateLifeNutritionLog(editingId, payload);
      } else {
        await onAddLifeNutritionLog(payload);
      }
      setForm({ mealType: 'meal', foodDescription: '', qualityRating: '', energyLevel: '', notes: '' });
      setEditingId(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const startEdit = (log: LifeNutritionLog) => {
    setForm({ mealType: log.mealType, foodDescription: log.foodDescription || '', qualityRating: log.qualityRating || '', energyLevel: log.energyLevel || '', notes: log.notes || '' });
    setEditingId(log.id);
  };

  return (
    <div>
      {sectionNav}
      {onSetSelectedDate ? <DateNav date={selectedDate!} onChange={onSetSelectedDate} /> : null}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-black mb-3">{editingId ? 'Edit' : 'Add'} Meal Log</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Meal Type</label>
            <select value={form.mealType} onChange={(e) => setForm((p) => ({ ...p, mealType: e.target.value as LifeMealType }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white">
              {MEAL_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Quality</label>
            <select value={form.qualityRating} onChange={(e) => setForm((p) => ({ ...p, qualityRating: e.target.value as LifeQualityRating }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white">
              <option value="">—</option>
              {QUALITY_RATINGS.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Energy Level</label>
            <select value={form.energyLevel} onChange={(e) => setForm((p) => ({ ...p, energyLevel: e.target.value as LifeEnergyLevel }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white">
              <option value="">—</option>
              {ENERGY_LEVELS.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div className="col-span-full">
            <label className="text-xs text-neutral-500 block mb-1">Food Description</label>
            <input value={form.foodDescription} onChange={(e) => setForm((p) => ({ ...p, foodDescription: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" placeholder="What did you eat?" />
          </div>
          <div className="col-span-full">
            <label className="text-xs text-neutral-500 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div className="col-span-full flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</Button>
            {editingId ? <Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(null); setForm({ mealType: 'meal', foodDescription: '', qualityRating: '', energyLevel: '', notes: '' }); }}>Cancel</Button> : null}
          </div>
        </form>
      </div>
      <div className="space-y-2">
        {dayLogs.length === 0 ? <div className="text-xs text-neutral-500 py-4 text-center">No meals logged for this date.</div> : null}
        {dayLogs.map((log) => (
          <div key={log.id} className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-black capitalize">{log.mealType}</span>
                {log.qualityRating ? <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${log.qualityRating === 'good' ? 'bg-emerald-50 text-emerald-700' : log.qualityRating === 'poor' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{log.qualityRating}</span> : null}
                {log.energyLevel ? <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-100 text-neutral-600">{log.energyLevel}</span> : null}
              </div>
              {log.foodDescription ? <div className="text-xs text-black">{log.foodDescription}</div> : null}
              {log.notes ? <div className="text-xs text-neutral-500 mt-0.5">{log.notes}</div> : null}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button type="button" variant="outline" size="sm" onClick={() => startEdit(log)}>Edit</Button>
              <Button type="button" variant="danger" size="sm" onClick={() => onDeleteLifeNutritionLog(log.id)}>Del</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function FitnessSection({ lifeFitnessLogs, onAddLifeFitnessLog, onUpdateLifeFitnessLog, onDeleteLifeFitnessLog, sectionNav, selectedWeekStart, onSetSelectedWeekStart }: SectionProps) {
  const [form, setForm] = React.useState({ workoutType: 'general' as LifeWorkoutType, durationMinutes: '', intensity: '' as LifeIntensity | '', exercises: '', bodyNotes: '', recoveryNotes: '', notes: '', workoutDate: '' });
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const weekLogs = useMemo(() => lifeFitnessLogs.filter((l) => l.workoutDate >= (selectedWeekStart || '') && l.workoutDate < addWeeks(selectedWeekStart || '', 1)), [lifeFitnessLogs, selectedWeekStart]);
  const totalMinutes = useMemo(() => weekLogs.reduce((s, l) => s + (l.durationMinutes || 0), 0), [weekLogs]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.workoutType) return;
    setSaving(true);
    try {
      const payload: LifeFitnessLogInput = {
        workoutDate: form.workoutDate || selectedWeekStart!,
        workoutType: form.workoutType,
        durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : undefined,
        intensity: form.intensity || undefined,
        exercises: form.exercises || undefined,
        bodyNotes: form.bodyNotes || undefined,
        recoveryNotes: form.recoveryNotes || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) {
        await onUpdateLifeFitnessLog(editingId, payload);
      } else {
        await onAddLifeFitnessLog(payload);
      }
      setForm({ workoutType: 'general', durationMinutes: '', intensity: '', exercises: '', bodyNotes: '', recoveryNotes: '', notes: '', workoutDate: '' });
      setEditingId(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const startEdit = (log: LifeFitnessLog) => {
    setForm({ workoutType: log.workoutType, durationMinutes: String(log.durationMinutes || ''), intensity: log.intensity || '', exercises: log.exercises || '', bodyNotes: log.bodyNotes || '', recoveryNotes: log.recoveryNotes || '', notes: log.notes || '', workoutDate: log.workoutDate });
    setEditingId(log.id);
  };

  return (
    <div>
      {sectionNav}
      {onSetSelectedWeekStart ? <WeekNav weekStart={selectedWeekStart!} onChange={onSetSelectedWeekStart} /> : null}
      <div className="text-xs text-neutral-500 mb-3">Total this week: <strong className="text-black">{totalMinutes} minutes</strong></div>
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-black mb-3">{editingId ? 'Edit' : 'Add'} Workout</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Workout Type</label>
            <select value={form.workoutType} onChange={(e) => setForm((p) => ({ ...p, workoutType: e.target.value as LifeWorkoutType }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white">
              {WORKOUT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Duration (min)</label>
            <input type="number" min="0" value={form.durationMinutes} onChange={(e) => setForm((p) => ({ ...p, durationMinutes: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Intensity</label>
            <select value={form.intensity} onChange={(e) => setForm((p) => ({ ...p, intensity: e.target.value as LifeIntensity }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white">
              <option value="">—</option>
              {INTENSITIES.map((l) => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Date</label>
            <input type="date" value={form.workoutDate || selectedWeekStart} onChange={(e) => setForm((p) => ({ ...p, workoutDate: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" />
          </div>
          <div className="col-span-full">
            <label className="text-xs text-neutral-500 block mb-1">Exercises</label>
            <textarea value={form.exercises} onChange={(e) => setForm((p) => ({ ...p, exercises: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Body Notes</label>
            <textarea value={form.bodyNotes} onChange={(e) => setForm((p) => ({ ...p, bodyNotes: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Recovery Notes</label>
            <textarea value={form.recoveryNotes} onChange={(e) => setForm((p) => ({ ...p, recoveryNotes: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div className="col-span-full">
            <label className="text-xs text-neutral-500 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div className="col-span-full flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</Button>
            {editingId ? <Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(null); setForm({ workoutType: 'general', durationMinutes: '', intensity: '', exercises: '', bodyNotes: '', recoveryNotes: '', notes: '', workoutDate: '' }); }}>Cancel</Button> : null}
          </div>
        </form>
      </div>
      <div className="space-y-2">
        {weekLogs.length === 0 ? <div className="text-xs text-neutral-500 py-4 text-center">No workouts logged this week.</div> : null}
        {weekLogs.map((log) => (
          <div key={log.id} className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold text-black capitalize">{log.workoutType}</span>
                {log.durationMinutes ? <span className="text-[10px] text-neutral-500">{log.durationMinutes} min</span> : null}
                {log.intensity ? <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${log.intensity === 'high' ? 'bg-red-50 text-red-700' : log.intensity === 'medium' ? 'bg-amber-50 text-amber-700' : 'bg-neutral-100 text-neutral-600'}`}>{log.intensity}</span> : null}
              </div>
              <div className="text-[10px] text-neutral-500">{formatDate(log.workoutDate)}</div>
              {log.exercises ? <div className="text-xs text-black mt-1">{log.exercises}</div> : null}
              {log.bodyNotes ? <div className="text-xs text-neutral-500 mt-0.5">{log.bodyNotes}</div> : null}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button type="button" variant="outline" size="sm" onClick={() => startEdit(log)}>Edit</Button>
              <Button type="button" variant="danger" size="sm" onClick={() => onDeleteLifeFitnessLog(log.id)}>Del</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeenSection({ lifeDeenLogs, onAddLifeDeenLog, onUpdateLifeDeenLog, onDeleteLifeDeenLog, sectionNav, selectedDate, onSetSelectedDate }: SectionProps) {
  const existingLog = useMemo(() => lifeDeenLogs.find((l) => l.logDate === selectedDate), [lifeDeenLogs, selectedDate]);
  const [form, setForm] = React.useState<LifeDeenLogInput>({ logDate: '', fajr: undefined, dhuhr: undefined, asr: undefined, maghrib: undefined, isha: undefined, quranMinutes: undefined, dhikrDone: undefined, learningMinutes: undefined, charityNotes: '', reflection: '', notes: '' });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (existingLog) {
      setForm({
        logDate: existingLog.logDate,
        fajr: existingLog.fajr,
        dhuhr: existingLog.dhuhr,
        asr: existingLog.asr,
        maghrib: existingLog.maghrib,
        isha: existingLog.isha,
        quranMinutes: existingLog.quranMinutes,
        dhikrDone: existingLog.dhikrDone,
        learningMinutes: existingLog.learningMinutes,
        charityNotes: existingLog.charityNotes || '',
        reflection: existingLog.reflection || '',
        notes: existingLog.notes || '',
      });
    } else {
      setForm({ logDate: selectedDate!, fajr: undefined, dhuhr: undefined, asr: undefined, maghrib: undefined, isha: undefined, quranMinutes: undefined, dhikrDone: undefined, learningMinutes: undefined, charityNotes: '', reflection: '', notes: '' });
    }
  }, [existingLog, selectedDate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: LifeDeenLogInput = {
        logDate: selectedDate!,
        fajr: form.fajr,
        dhuhr: form.dhuhr,
        asr: form.asr,
        maghrib: form.maghrib,
        isha: form.isha,
        quranMinutes: form.quranMinutes,
        dhikrDone: form.dhikrDone,
        learningMinutes: form.learningMinutes,
        charityNotes: form.charityNotes || undefined,
        reflection: form.reflection || undefined,
        notes: form.notes || undefined,
      };
      if (existingLog) {
        await onUpdateLifeDeenLog(existingLog.id, payload);
      } else {
        await onAddLifeDeenLog(payload);
      }
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
    <div>
      {sectionNav}
      {onSetSelectedDate ? <DateNav date={selectedDate!} onChange={onSetSelectedDate} /> : null}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-black mb-1">{existingLog ? 'Edit' : 'Record'} Deen Log</h3>
        <p className="text-[10px] text-neutral-500 mb-3">Track your daily worship and spiritual growth. This is for personal review only.</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {prayerFields.map((pf) => (
            <div key={pf.key}>
              <label className="text-xs text-neutral-500 block mb-1">{pf.label}</label>
              <select value={form[pf.key] || ''} onChange={(e) => setForm((p) => ({ ...p, [pf.key]: e.target.value as LifePrayerStatus || undefined }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white">
                <option value="">—</option>
                {PRAYER_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          ))}
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Quran (minutes)</label>
            <input type="number" min="0" value={form.quranMinutes ?? ''} onChange={(e) => setForm((p) => ({ ...p, quranMinutes: e.target.value ? Number(e.target.value) : undefined }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Dhikr Done</label>
            <select value={form.dhikrDone ? 'yes' : form.dhikrDone === false ? 'no' : ''} onChange={(e) => setForm((p) => ({ ...p, dhikrDone: e.target.value === 'yes' ? true : e.target.value === 'no' ? false : undefined }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white">
              <option value="">—</option>
              <option value="yes">Yes</option>
              <option value="no">No</option>
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Learning (minutes)</label>
            <input type="number" min="0" value={form.learningMinutes ?? ''} onChange={(e) => setForm((p) => ({ ...p, learningMinutes: e.target.value ? Number(e.target.value) : undefined }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" />
          </div>
          <div className="col-span-full">
            <label className="text-xs text-neutral-500 block mb-1">Charity / Sadaqah Notes</label>
            <textarea value={form.charityNotes} onChange={(e) => setForm((p) => ({ ...p, charityNotes: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div className="col-span-full">
            <label className="text-xs text-neutral-500 block mb-1">Reflection</label>
            <textarea value={form.reflection} onChange={(e) => setForm((p) => ({ ...p, reflection: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div className="col-span-full">
            <label className="text-xs text-neutral-500 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div className="col-span-full flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Saving...' : existingLog ? 'Update' : 'Save'}</Button>
            {existingLog ? <Button type="button" variant="danger" size="sm" onClick={() => onDeleteLifeDeenLog(existingLog.id)}>Delete</Button> : null}
          </div>
        </form>
      </div>
    </div>
  );
}

function FamilySection({ lifeFamilyActions, onAddLifeFamilyAction, onUpdateLifeFamilyAction, onDeleteLifeFamilyAction, sectionNav, selectedDate, onSetSelectedDate }: SectionProps) {
  const [form, setForm] = React.useState({ title: '', type: 'other' as LifeFamilyActionType, status: 'planned' as LifeFamilyActionStatus, priority: 'medium' as LifePriority, personName: '', description: '', outcome: '', nextAction: '', notes: '' });
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.type) return;
    setSaving(true);
    try {
      const payload: LifeFamilyActionInput = {
        actionDate: selectedDate!,
        title: form.title.trim(),
        type: form.type,
        status: form.status,
        priority: form.priority,
        personName: form.personName || undefined,
        description: form.description || undefined,
        outcome: form.outcome || undefined,
        nextAction: form.nextAction || undefined,
        notes: form.notes || undefined,
      };
      if (editingId) {
        await onUpdateLifeFamilyAction(editingId, payload);
      } else {
        await onAddLifeFamilyAction(payload);
      }
      setForm({ title: '', type: 'other', status: 'planned', priority: 'medium', personName: '', description: '', outcome: '', nextAction: '', notes: '' });
      setEditingId(null);
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const startEdit = (action: LifeFamilyAction) => {
    setForm({ title: action.title, type: action.type, status: action.status, priority: action.priority, personName: action.personName || '', description: action.description || '', outcome: action.outcome || '', nextAction: action.nextAction || '', notes: action.notes || '' });
    setEditingId(action.id);
  };

  const markDone = async (action: LifeFamilyAction) => {
    await onUpdateLifeFamilyAction(action.id, { status: 'done' });
  };

  const markPostponed = async (action: LifeFamilyAction) => {
    await onUpdateLifeFamilyAction(action.id, { status: 'postponed' });
  };

  return (
    <div>
      {sectionNav}
      {onSetSelectedDate ? <DateNav date={selectedDate!} onChange={onSetSelectedDate} /> : null}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm mb-4">
        <h3 className="text-sm font-semibold text-black mb-3">{editingId ? 'Edit' : 'Add'} Family Action</h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="col-span-full">
            <label className="text-xs text-neutral-500 block mb-1">Title *</label>
            <input value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} required className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Type</label>
            <select value={form.type} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value as LifeFamilyActionType }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white">
              {FAMILY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Status</label>
            <select value={form.status} onChange={(e) => setForm((p) => ({ ...p, status: e.target.value as LifeFamilyActionStatus }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white">
              {FAMILY_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Priority</label>
            <select value={form.priority} onChange={(e) => setForm((p) => ({ ...p, priority: e.target.value as LifePriority }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white">
              {PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Person Name</label>
            <input value={form.personName} onChange={(e) => setForm((p) => ({ ...p, personName: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" />
          </div>
          <div className="col-span-full">
            <label className="text-xs text-neutral-500 block mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Outcome</label>
            <textarea value={form.outcome} onChange={(e) => setForm((p) => ({ ...p, outcome: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div>
            <label className="text-xs text-neutral-500 block mb-1">Next Action</label>
            <textarea value={form.nextAction} onChange={(e) => setForm((p) => ({ ...p, nextAction: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div className="col-span-full">
            <label className="text-xs text-neutral-500 block mb-1">Notes</label>
            <textarea value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={2} />
          </div>
          <div className="col-span-full flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Saving...' : editingId ? 'Update' : 'Add'}</Button>
            {editingId ? <Button type="button" variant="outline" size="sm" onClick={() => { setEditingId(null); setForm({ title: '', type: 'other', status: 'planned', priority: 'medium', personName: '', description: '', outcome: '', nextAction: '', notes: '' }); }}>Cancel</Button> : null}
          </div>
        </form>
      </div>
      <div className="space-y-2">
        {lifeFamilyActions.length === 0 ? <div className="text-xs text-neutral-500 py-4 text-center">No family actions yet.</div> : null}
        {lifeFamilyActions.filter((a) => !selectedDate || a.actionDate === selectedDate).map((action) => (
          <div key={action.id} className="rounded-xl border border-neutral-200 bg-white p-3 shadow-sm flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-xs font-semibold text-black">{action.title}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${action.type === 'call' ? 'bg-blue-50 text-blue-700' : action.type === 'visit' ? 'bg-green-50 text-green-700' : action.type === 'support' ? 'bg-purple-50 text-purple-700' : 'bg-neutral-100 text-neutral-600'}`}>{action.type}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${action.status === 'done' ? 'bg-emerald-50 text-emerald-700' : action.status === 'postponed' ? 'bg-amber-50 text-amber-700' : action.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-neutral-100 text-neutral-600'}`}>{action.status}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${action.priority === 'high' ? 'bg-red-50 text-red-700' : action.priority === 'low' ? 'bg-neutral-50 text-neutral-500' : 'bg-amber-50 text-amber-700'}`}>{action.priority}</span>
              </div>
              {action.personName ? <div className="text-[10px] text-neutral-500">{action.personName}</div> : null}
              {action.description ? <div className="text-xs text-black mt-1">{action.description}</div> : null}
              {action.outcome ? <div className="text-xs text-neutral-500 mt-0.5">Outcome: {action.outcome}</div> : null}
            </div>
            <div className="flex gap-1 shrink-0">
              {action.status !== 'done' ? <Button type="button" variant="success" size="sm" onClick={() => markDone(action)}>Done</Button> : null}
              {action.status !== 'postponed' && action.status !== 'done' ? <button type="button" onClick={() => markPostponed(action)} className="text-xs px-2 py-1 rounded-lg border border-amber-200 text-amber-700 bg-white hover:bg-amber-50">Postpone</button> : null}
              <Button type="button" variant="outline" size="sm" onClick={() => startEdit(action)}>Edit</Button>
              <Button type="button" variant="danger" size="sm" onClick={() => onDeleteLifeFamilyAction(action.id)}>Del</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WeeklyReviewSection({ lifeWeeklyReviews, onAddLifeWeeklyReview, onUpdateLifeWeeklyReview, onDeleteLifeWeeklyReview, sectionNav, selectedWeekStart, onSetSelectedWeekStart }: SectionProps) {
  const existingReview = useMemo(() => lifeWeeklyReviews.find((r) => r.weekStart === selectedWeekStart), [lifeWeeklyReviews, selectedWeekStart]);
  const [form, setForm] = React.useState<LifeWeeklyReviewInput>({ weekStart: '', summary: '', healthReview: '', nutritionReview: '', fitnessReview: '', deenReview: '', familyReview: '', whatWorked: '', whatFailed: '', neglectedArea: '', nextWeekFocus: '', lifeScore: undefined, healthScore: undefined, deenScore: undefined, familyScore: undefined, notes: '' });
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (existingReview) {
      setForm({
        weekStart: existingReview.weekStart,
        summary: existingReview.summary || '',
        healthReview: existingReview.healthReview || '',
        nutritionReview: existingReview.nutritionReview || '',
        fitnessReview: existingReview.fitnessReview || '',
        deenReview: existingReview.deenReview || '',
        familyReview: existingReview.familyReview || '',
        whatWorked: existingReview.whatWorked || '',
        whatFailed: existingReview.whatFailed || '',
        neglectedArea: existingReview.neglectedArea || '',
        nextWeekFocus: existingReview.nextWeekFocus || '',
        lifeScore: existingReview.lifeScore,
        healthScore: existingReview.healthScore,
        deenScore: existingReview.deenScore,
        familyScore: existingReview.familyScore,
        notes: existingReview.notes || '',
      });
    } else {
      setForm({ weekStart: selectedWeekStart!, summary: '', healthReview: '', nutritionReview: '', fitnessReview: '', deenReview: '', familyReview: '', whatWorked: '', whatFailed: '', neglectedArea: '', nextWeekFocus: '', lifeScore: undefined, healthScore: undefined, deenScore: undefined, familyScore: undefined, notes: '' });
    }
  }, [existingReview, selectedWeekStart]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: LifeWeeklyReviewInput = {
        weekStart: selectedWeekStart!,
        summary: form.summary || undefined,
        healthReview: form.healthReview || undefined,
        nutritionReview: form.nutritionReview || undefined,
        fitnessReview: form.fitnessReview || undefined,
        deenReview: form.deenReview || undefined,
        familyReview: form.familyReview || undefined,
        whatWorked: form.whatWorked || undefined,
        whatFailed: form.whatFailed || undefined,
        neglectedArea: form.neglectedArea || undefined,
        nextWeekFocus: form.nextWeekFocus || undefined,
        lifeScore: form.lifeScore,
        healthScore: form.healthScore,
        deenScore: form.deenScore,
        familyScore: form.familyScore,
        notes: form.notes || undefined,
      };
      if (existingReview) {
        await onUpdateLifeWeeklyReview(existingReview.id, payload);
      } else {
        await onAddLifeWeeklyReview(payload);
      }
    } catch { /* ignore */ } finally { setSaving(false); }
  };

  const inputRow = (label: string, value: string, onChange: (v: string) => void, options?: { rows?: number; placeholder?: string }) => (
    <div className="col-span-full">
      <label className="text-xs text-neutral-500 block mb-1">{label}</label>
      <textarea value={value} onChange={(e) => onChange(e.target.value)} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white" rows={options?.rows || 2} placeholder={options?.placeholder} />
    </div>
  );

  const scoreInput = (label: string, value: number | undefined, onChange: (v: number | undefined) => void) => (
    <div>
      <label className="text-xs text-neutral-500 block mb-1">{label}</label>
      <select value={value ?? ''} onChange={(e) => onChange(e.target.value ? Number(e.target.value) : undefined)} className="w-full text-xs px-2 py-1.5 rounded-lg border border-neutral-200 bg-white">
        <option value="">—</option>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => <option key={n} value={n}>{n}</option>)}
      </select>
    </div>
  );

  return (
    <div>
      {sectionNav}
      {onSetSelectedWeekStart ? <WeekNav weekStart={selectedWeekStart!} onChange={onSetSelectedWeekStart} /> : null}
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <h3 className="text-sm font-semibold text-black mb-1">{existingReview ? 'Edit' : 'Create'} Weekly Review</h3>
        <p className="text-[10px] text-neutral-500 mb-3">Review your week across health, nutrition, fitness, deen, and family.</p>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {inputRow('Summary', form.summary || '', (v) => setForm((p) => ({ ...p, summary: v })))}
          {inputRow('Health Review', form.healthReview || '', (v) => setForm((p) => ({ ...p, healthReview: v })))}
          {inputRow('Nutrition Review', form.nutritionReview || '', (v) => setForm((p) => ({ ...p, nutritionReview: v })))}
          {inputRow('Fitness Review', form.fitnessReview || '', (v) => setForm((p) => ({ ...p, fitnessReview: v })))}
          {inputRow('Deen Review', form.deenReview || '', (v) => setForm((p) => ({ ...p, deenReview: v })))}
          {inputRow('Family Review', form.familyReview || '', (v) => setForm((p) => ({ ...p, familyReview: v })))}
          {inputRow('What Worked', form.whatWorked || '', (v) => setForm((p) => ({ ...p, whatWorked: v })))}
          {inputRow('What Failed / Challenges', form.whatFailed || '', (v) => setForm((p) => ({ ...p, whatFailed: v })))}
          {inputRow('Neglected Area', form.neglectedArea || '', (v) => setForm((p) => ({ ...p, neglectedArea: v })))}
          {inputRow('Next Week Focus', form.nextWeekFocus || '', (v) => setForm((p) => ({ ...p, nextWeekFocus: v })))}
          {scoreInput('Life Score', form.lifeScore, (v) => setForm((p) => ({ ...p, lifeScore: v })))}
          {scoreInput('Health Score', form.healthScore, (v) => setForm((p) => ({ ...p, healthScore: v })))}
          {scoreInput('Deen Score', form.deenScore, (v) => setForm((p) => ({ ...p, deenScore: v })))}
          {scoreInput('Family Score', form.familyScore, (v) => setForm((p) => ({ ...p, familyScore: v })))}
          {inputRow('Notes', form.notes || '', (v) => setForm((p) => ({ ...p, notes: v })))}
          <div className="col-span-full flex gap-2">
            <Button type="submit" variant="primary" size="sm" disabled={saving}>{saving ? 'Saving...' : existingReview ? 'Update' : 'Save'}</Button>
            {existingReview ? <Button type="button" variant="danger" size="sm" onClick={() => onDeleteLifeWeeklyReview(existingReview.id)}>Delete</Button> : null}
          </div>
        </form>
      </div>
    </div>
  );
}
