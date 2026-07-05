import React, { useState, useMemo, useEffect } from 'react';
import type { FinanceIncome, FinanceExpense, FinanceAllocationRule, FinancePurchaseGoal, FinanceInvestmentIdea, FinanceInvestmentRule, FinanceInvestmentAllocation, FinancePeriod, FinanceRecurringRule, Project, Company } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';

type FinanceTab = 'dashboard' | 'periods' | 'income' | 'expenses' | 'allocation' | 'purchase_goals' | 'investments' | 'recurring' | 'ai_assistant';
type AiMode = 'monthly_review' | 'allocation_review' | 'purchase_review' | 'investment_review' | 'recurring_income_review' | 'next_actions';
type InvestTab = 'overview' | 'ideas' | 'allocation' | 'rules' | 'risk_review' | 'ethical_review';

const now = new Date();
const cMonth = now.getMonth();
const cYear = now.getFullYear();
const toCur = (a: number, c = 'MYR') => `${c} ${Number(a).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const isCM = (d?: string) => d ? new Date(d).getMonth() === cMonth && new Date(d).getFullYear() === cYear : false;

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const INCOME_TYPES = ['salary', 'freelance', 'project', 'bonus', 'other'];
const INCOME_SOURCES = ['salary', 'freelance', 'project', 'bonus', 'other'];
const INCOME_STATUSES = ['expected', 'received', 'delayed', 'cancelled'];
const RECURRENCE_OPTIONS = ['monthly', 'weekly', 'once', 'irregular'];
const CONFIDENCE_LEVELS = ['high', 'medium', 'low'];
const EXPENSE_CATEGORIES = ['needs', 'family', 'tools', 'learning', 'health', 'transport', 'food', 'admin', 'other'];
const EXPENSE_STATUSES = ['planned', 'paid', 'unpaid', 'cancelled'];
const GOAL_STATUSES = ['planned', 'saving', 'bought', 'paused', 'cancelled'];
const GOAL_PRIORITIES = ['low', 'medium', 'high'];
const DECISION_STATUSES = ['researching', 'approved', 'waiting', 'bought', 'rejected'];
const INVESTMENT_TYPES = ['stocks', 'real_estate', 'business', 'crypto', 'gold', 'sukuk', 'other'];
const RISK_LEVELS = ['low', 'medium', 'high'];
const ETHICAL_STATUSES = ['good', 'needs_review', 'avoid'];
const INVESTMENT_STATUSES = ['researching', 'waiting', 'planned', 'invested', 'rejected'];
const INVEST_DECISION_STATUSES = ['researching', 'approved', 'waiting', 'invested', 'rejected'];
const ALLOC_CATS = ['needs', 'savings', 'investment', 'family', 'learning', 'health', 'giving', 'other'];
const FUNDING_STATUSES = ['not_started', 'accumulating', 'ready', 'invested', 'paused'];
const INV_RULE_CATS = ['risk', 'ethics', 'strategy', 'process', 'other'];
const INV_ALLOC_CATS = ['equity', 'sukuk', 'real_estate', 'gold', 'cash', 'crypto', 'other'];
const INV_HORIZONS = ['short_term', 'medium_term', 'long_term'];
const RECURRING_KINDS = ['income', 'expense'];
const RECURRING_FREQUENCIES = ['monthly', 'weekly', 'yearly', 'irregular'];

function getMonthsBetween(start: Date, end: Date): Date[] {
 const months: Date[] = [];
 const current = new Date(start.getFullYear(), start.getMonth(), 1);
 while (current <= end) {
 months.push(new Date(current));
 current.setMonth(current.getMonth() + 1);
 }
 return months;
}

function formatMonthKey(d: Date): string {
 return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function isDateBetween(date: string, start: string, end: string): boolean {
 const d = new Date(date);
 return d >= new Date(start) && d <= new Date(end);
}

function incomeInPeriod(inc: FinanceIncome, periodId: string, period?: FinancePeriod): boolean {
 if (inc.financePeriodId === periodId) return true;
 if (inc.financePeriodId && inc.financePeriodId !== periodId) return false;
 if (period) {
 const date = inc.receivedDate || inc.expectedDate || inc.incomeDate;
 if (date) return isDateBetween(date, period.startDate, period.endDate);
 }
 return false;
}

function expenseInPeriod(exp: FinanceExpense, periodId: string, period?: FinancePeriod): boolean {
 if (exp.financePeriodId === periodId) return true;
 if (exp.financePeriodId && exp.financePeriodId !== periodId) return false;
 if (period) {
 const date = exp.expenseDate || exp.createdAt || '';
 if (date) return isDateBetween(date, period.startDate, period.endDate);
 }
 return false;
}

type HorizonView = 'monthly' | 'six_months' | 'yearly' | 'five_years' | 'ten_years';

const statusBadge: Record<string, 'success' | 'warning' | 'danger' | 'neutral'> = {
 received: 'success',
 paid: 'success',
 bought: 'success',
 invested: 'success',
 expected: 'neutral',
 planned: 'neutral',
 saving: 'neutral',
 researching: 'neutral',
 delayed: 'warning',
 paused: 'warning',
 waiting: 'warning',
 needs_review: 'warning',
 cancelled: 'danger',
 rejected: 'danger',
 unpaid: 'danger',
 blocked: 'danger',
 overdue: 'danger',
 avoid: 'danger',
};

const priorityBadge: Record<string, 'danger' | 'warning' | 'neutral'> = {
 high: 'danger',
 medium: 'warning',
 low: 'neutral',
};

const riskBadge: Record<string, 'danger' | 'warning' | 'neutral'> = {
 high: 'danger',
 medium: 'warning',
 low: 'neutral',
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
 return (
 <div className="flex flex-col gap-1 min-w-0">
 <label className="text-xs font-medium text-neutral-600">{label}</label>
 {children}
 </div>
 );
}

interface FinancePanelProps {
  onBackToDesktop?: () => void;
  section?: FinanceTab;
 financeIncome: FinanceIncome[];
 financeExpenses: FinanceExpense[];
 financeAllocationRules: FinanceAllocationRule[];
 financePurchaseGoals: FinancePurchaseGoal[];
 financeInvestmentIdeas: FinanceInvestmentIdea[];
 financeInvestmentRules: FinanceInvestmentRule[];
 financeInvestmentAllocations: FinanceInvestmentAllocation[];
 projects: Project[];
 companies: Company[];
 onAddFinanceIncome: (input: Partial<FinanceIncome>) => Promise<FinanceIncome>;
 onUpdateFinanceIncome: (id: string, input: Partial<FinanceIncome>) => Promise<FinanceIncome>;
 onDeleteFinanceIncome: (id: string) => Promise<void>;
 onAddFinanceExpense: (input: Partial<FinanceExpense>) => Promise<FinanceExpense>;
 onUpdateFinanceExpense: (id: string, input: Partial<FinanceExpense>) => Promise<FinanceExpense>;
 onDeleteFinanceExpense: (id: string) => Promise<void>;
 onAddFinanceAllocationRule: (input: Partial<FinanceAllocationRule>) => Promise<FinanceAllocationRule>;
 onUpdateFinanceAllocationRule: (id: string, input: Partial<FinanceAllocationRule>) => Promise<FinanceAllocationRule>;
 onDeleteFinanceAllocationRule: (id: string) => Promise<void>;
 onAddFinancePurchaseGoal: (input: Partial<FinancePurchaseGoal>) => Promise<FinancePurchaseGoal>;
 onUpdateFinancePurchaseGoal: (id: string, input: Partial<FinancePurchaseGoal>) => Promise<FinancePurchaseGoal>;
 onDeleteFinancePurchaseGoal: (id: string) => Promise<void>;
 onAddFinanceInvestmentIdea: (input: Partial<FinanceInvestmentIdea>) => Promise<FinanceInvestmentIdea>;
 onUpdateFinanceInvestmentIdea: (id: string, input: Partial<FinanceInvestmentIdea>) => Promise<FinanceInvestmentIdea>;
 onDeleteFinanceInvestmentIdea: (id: string) => Promise<void>;
 onAddFinanceInvestmentRule: (input: Partial<FinanceInvestmentRule>) => Promise<FinanceInvestmentRule>;
 onUpdateFinanceInvestmentRule: (id: string, input: Partial<FinanceInvestmentRule>) => Promise<FinanceInvestmentRule>;
 onDeleteFinanceInvestmentRule: (id: string) => Promise<void>;
 onAddFinanceInvestmentAllocation: (input: Partial<FinanceInvestmentAllocation>) => Promise<FinanceInvestmentAllocation>;
 onUpdateFinanceInvestmentAllocation: (id: string, input: Partial<FinanceInvestmentAllocation>) => Promise<FinanceInvestmentAllocation>;
 onDeleteFinanceInvestmentAllocation: (id: string) => Promise<void>;
 financePeriods: FinancePeriod[];
 onAddFinancePeriod: (input: Partial<FinancePeriod>) => Promise<FinancePeriod>;
 onUpdateFinancePeriod: (id: string, input: Partial<FinancePeriod>) => Promise<FinancePeriod>;
 onDeleteFinancePeriod: (id: string) => Promise<void>;
 financeRecurringRules: FinanceRecurringRule[];
 onAddFinanceRecurringRule: (input: Partial<FinanceRecurringRule>) => Promise<FinanceRecurringRule>;
 onUpdateFinanceRecurringRule: (id: string, input: Partial<FinanceRecurringRule>) => Promise<FinanceRecurringRule>;
 onDeleteFinanceRecurringRule: (id: string) => Promise<void>;
}

function FinancePanel({
  onBackToDesktop,
  section,
  financeIncome, financeExpenses, financeAllocationRules, financePurchaseGoals,
 financeInvestmentIdeas, financeInvestmentRules, financeInvestmentAllocations,
 projects, companies,
 onAddFinanceIncome, onUpdateFinanceIncome, onDeleteFinanceIncome,
 onAddFinanceExpense, onUpdateFinanceExpense, onDeleteFinanceExpense,
 onAddFinanceAllocationRule, onUpdateFinanceAllocationRule, onDeleteFinanceAllocationRule,
 onAddFinancePurchaseGoal, onUpdateFinancePurchaseGoal, onDeleteFinancePurchaseGoal,
 onAddFinanceInvestmentIdea, onUpdateFinanceInvestmentIdea, onDeleteFinanceInvestmentIdea,
 onAddFinanceInvestmentRule, onUpdateFinanceInvestmentRule, onDeleteFinanceInvestmentRule,
 onAddFinanceInvestmentAllocation, onUpdateFinanceInvestmentAllocation, onDeleteFinanceInvestmentAllocation,
 financePeriods,
 onAddFinancePeriod, onUpdateFinancePeriod, onDeleteFinancePeriod,
 financeRecurringRules,
 onAddFinanceRecurringRule, onUpdateFinanceRecurringRule, onDeleteFinanceRecurringRule,
}: FinancePanelProps) {
  const [tab, setTab] = useState<FinanceTab>('dashboard');
  const [investTab, setInvestTab] = useState<InvestTab>('overview');

  useEffect(() => {
  if (section) setTab(section);
  }, [section]);

  const [aiMode, setAiMode] = useState<AiMode>('monthly_review');
 const [modal, setModal] = useState<{type: FinanceTab; id?: string} | null>(null);
 const [aiLoading, setAiLoading] = useState(false);
 const [aiError, setAiError] = useState<string | null>(null);
 const [aiResult, setAiResult] = useState<any>(null);
 const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
 const [horizonView, setHorizonView] = useState<HorizonView>('monthly');
  const [generateResult, setGenerateResult] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [calendarYear, setCalendarYear] = useState(cYear);

 const allIncome = financeIncome || [];
 const allExpenses = financeExpenses || [];
 const allRules = financeAllocationRules || [];
 const allGoals = financePurchaseGoals || [];
 const allIdeas = financeInvestmentIdeas || [];
 const allInvRules = financeInvestmentRules || [];
 const allInvAllocs = financeInvestmentAllocations || [];
 const allPeriods = financePeriods || [];
 const allRecurring = financeRecurringRules || [];

 const sortedPeriods = useMemo(() =>
 [...allPeriods].sort((a, b) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime()),
 [allPeriods]
 );

 const selectedPeriod = useMemo(() =>
 allPeriods.find(p => p.id === selectedPeriodId),
 [allPeriods, selectedPeriodId]
 );

 const linkedPeriodId = selectedPeriodId;

 const dashboardIncome = useMemo(() => {
 if (!selectedPeriodId) return allIncome;
 return allIncome.filter(i => incomeInPeriod(i, selectedPeriodId, selectedPeriod));
 }, [allIncome, selectedPeriodId, selectedPeriod]);

 const dashboardExpenses = useMemo(() => {
 if (!selectedPeriodId) return allExpenses;
 return allExpenses.filter(e => expenseInPeriod(e, selectedPeriodId, selectedPeriod));
 }, [allExpenses, selectedPeriodId, selectedPeriod]);

 const filteredFinanceIncome = dashboardIncome;
 const filteredFinanceExpenses = dashboardExpenses;

 const defaultIncome: Partial<FinanceIncome> = { incomeType: 'other', source: 'other', status: 'expected', currency: 'MYR', recurrence: 'once', amount: 0, isRecurring: false, financePeriodId: selectedPeriodId || undefined, incomeDate: selectedPeriod?.startDate || undefined, expectedDate: selectedPeriod?.startDate || undefined };
 const defaultExpense: Partial<FinanceExpense> = { category: 'other', status: 'planned', currency: 'MYR', amount: 0, financePeriodId: selectedPeriodId || undefined, expenseDate: selectedPeriod?.startDate || undefined };
 const defaultRule: Partial<FinanceAllocationRule> = { name: 'New Rule', category: 'needs', percentage: 0, priority: 0, isActive: true };
 const defaultGoal: Partial<FinancePurchaseGoal> = { title: 'New Goal', category: 'other', status: 'planned', priority: 'medium', currency: 'MYR', targetAmount: 0, savedAmount: 0, decisionStatus: 'researching' };
 const defaultIdea: Partial<FinanceInvestmentIdea> = { title: 'New Idea', type: 'stocks', riskLevel: 'medium', ethicalStatus: 'good', status: 'researching', decisionStatus: 'researching', currency: 'MYR', plannedAmount: 0 };
 const defaultInvRule: Partial<FinanceInvestmentRule> = { title: 'New Rule', category: 'risk', priority: 0, isActive: true };
 const defaultInvAlloc: Partial<FinanceInvestmentAllocation> = { name: 'New Allocation', category: 'crypto', percentage: 0, riskLevel: 'medium', ethicalStatus: 'good', priority: 0, isActive: true };
 const defaultPeriod: Partial<FinancePeriod> = { title: '', type: 'manual', startDate: '', endDate: '', status: 'open' };
 const defaultRecurring: Partial<FinanceRecurringRule> = { kind: 'income', frequency: 'monthly', title: '', amount: 0, currency: 'MYR', isActive: true, confidence: 'medium' };

 const [formData, setFormData] = useState<Record<string, any>>({});

  function openModal(type: FinanceTab, id?: string) {
  setSaveError(null);
  if (id) {
  const item = getEditItem(type, id);
  setFormData(item ? { ...item } : {});
  } else {
  setFormData({});
  }
  setModal({ type, id });
  }

 function closeModal() {
 setModal(null);
 setFormData({});
 }

  async function handleSave() {
  if (!modal || saving) return;
  setSaving(true);
  const { type, id } = modal;
  try {
  if (type === 'income') {
  if (id) await onUpdateFinanceIncome(id, formData);
  else {
  const merged = { ...defaultIncome, ...formData };
  if (!merged.amount || merged.amount <= 0) throw new Error('Please enter an income amount greater than 0.');
  await onAddFinanceIncome(merged);
  }
  } else if (type === 'expenses') {
  if (id) await onUpdateFinanceExpense(id, formData);
  else {
  const merged = { ...defaultExpense, ...formData };
  if (!merged.amount || merged.amount <= 0) throw new Error('Please enter an expense amount greater than 0.');
  await onAddFinanceExpense(merged);
  }
  } else if (type === 'allocation') {
 if (id) await onUpdateFinanceAllocationRule(id, formData);
 else await onAddFinanceAllocationRule({ ...defaultRule, ...formData });
 } else if (type === 'purchase_goals') {
 if (id) await onUpdateFinancePurchaseGoal(id, formData);
 else await onAddFinancePurchaseGoal({ ...defaultGoal, ...formData });
 } else if (type === 'investments') {
 if (id) await onUpdateFinanceInvestmentIdea(id, formData);
 else await onAddFinanceInvestmentIdea({ ...defaultIdea, ...formData });
 } else if (type === 'recurring') {
 if (id) await onUpdateFinanceRecurringRule(id, formData);
 else await onAddFinanceRecurringRule({ ...defaultRecurring, ...formData });
 } else if (type === 'periods') {
 if (id) await onUpdateFinancePeriod(id, formData);
 else await onAddFinancePeriod({ ...defaultPeriod, ...formData });
 }
 closeModal();
  } catch (e) {
  if (!saveError) setSaveError(String(e instanceof Error ? e.message : 'Save failed'));
  console.error('Save failed', e);
  } finally {
  setSaving(false);
  }
  }

 async function handleDelete(type: FinanceTab, id: string) {
 try {
 if (type === 'income') await onDeleteFinanceIncome(id);
 else if (type === 'expenses') await onDeleteFinanceExpense(id);
 else if (type === 'allocation') await onDeleteFinanceAllocationRule(id);
 else if (type === 'purchase_goals') await onDeleteFinancePurchaseGoal(id);
 else if (type === 'investments') await onDeleteFinanceInvestmentIdea(id);
 else if (type === 'recurring') await onDeleteFinanceRecurringRule(id);
 else if (type === 'periods') await onDeleteFinancePeriod(id);
 } catch (e) {
 console.error('Delete failed', e);
 }
 }

 function handleModalChange(field: string, value: any) {
 setFormData(prev => ({ ...prev, [field]: value }));
 }

  function getEditItem(type: FinanceTab, overrideId?: string): any {
  const id = overrideId || modal?.id;
  if (!id) return null;
 if (type === 'income') return allIncome.find(i => i.id === id);
 if (type === 'expenses') return allExpenses.find(i => i.id === id);
 if (type === 'allocation') return allRules.find(i => i.id === id);
 if (type === 'purchase_goals') return allGoals.find(i => i.id === id);
 if (type === 'investments') return allIdeas.find(i => i.id === id);
 if (type === 'recurring') return allRecurring.find(i => i.id === id);
 if (type === 'periods') return allPeriods.find(i => i.id === id);
 return null;
 }

 async function generateRecurringItemsForPeriod() {
 if (!selectedPeriod || !selectedPeriodId) return;
 setGenerating(true);
 setGenerateResult(null);
 let created = 0;
 let skipped = 0;
 const activeRules = allRecurring.filter(r => r.isActive);
 const periodStart = new Date(selectedPeriod.startDate);
 const periodEnd = new Date(selectedPeriod.endDate);

 for (const rule of activeRules) {
 if (rule.startDate && new Date(rule.startDate) > periodEnd) { skipped++; continue; }
 if (rule.endDate && new Date(rule.endDate) < periodStart) { skipped++; continue; }
 if (rule.frequency === 'monthly') {
 } else if (rule.frequency === 'weekly') {
 if (periodEnd.getTime() - periodStart.getTime() > 45 * 86400000) { skipped++; continue; }
 } else if (rule.frequency === 'yearly') {
 const pStart = new Date(periodStart.getFullYear(), periodStart.getMonth(), 1);
 const rStart = rule.startDate ? new Date(rule.startDate) : null;
 if (!rStart) { skipped++; continue; }
 if (pStart.getMonth() !== rStart.getMonth() || pStart.getFullYear() !== rStart.getFullYear()) { skipped++; continue; }
 } else {
 skipped++; continue;
 }

 if (rule.kind === 'income') {
 const dup = allIncome.some(i => i.title === rule.title && i.financePeriodId === selectedPeriodId && i.amount === rule.amount && i.isRecurring);
 if (dup) { skipped++; continue; }
 try {
 await onAddFinanceIncome({
 title: rule.title,
 amount: rule.amount,
 currency: rule.currency || 'MYR',
 source: rule.source || 'other',
 status: 'expected',
 financePeriodId: selectedPeriodId,
 isRecurring: true,
 recurrence: rule.frequency,
 incomeDate: selectedPeriod.startDate,
 expectedDate: selectedPeriod.startDate,
 notes: rule.notes ? `[Recurring] ${rule.notes}` : '[Recurring]',
 linkedProjectId: rule.linkedProjectId || undefined,
 linkedCompanyId: rule.linkedCompanyId || undefined,
 });
 created++;
 } catch { skipped++; }
 } else if (rule.kind === 'expense') {
 const dup = allExpenses.some(e => e.title === rule.title && e.financePeriodId === selectedPeriodId && e.amount === rule.amount);
 if (dup) { skipped++; continue; }
 try {
 await onAddFinanceExpense({
 title: rule.title,
 amount: rule.amount,
 currency: rule.currency || 'MYR',
 category: rule.category || 'other',
 status: 'planned',
 financePeriodId: selectedPeriodId,
 expenseDate: selectedPeriod.startDate,
 notes: rule.notes ? `[Recurring] ${rule.notes}` : '[Recurring]',
 linkedProjectId: rule.linkedProjectId || undefined,
 });
 created++;
 } catch { skipped++; }
 }
 }
 setGenerateResult(`Created ${created} item(s), skipped ${skipped} (duplicates/inactive/mismatch)`);
 setGenerating(false);
 }

 function renderFormFields(
 fields: { label: string; key: string; type: 'input' | 'number' | 'select' | 'date'; options?: { value: string; label: string }[] }[]
 ) {
 return (
 <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
 {fields.map(f => (
 <div key={f.key} className={f.key === 'notes' ? 'sm:col-span-2' : ''}>
 <FormField label={f.label}>
 {f.type === 'select' && f.options ? (
 <select
 value={formData[f.key] ?? ''}
 onChange={e => handleModalChange(f.key, e.target.value)}
 className="h-9 px-3 text-sm rounded-md border border-neutral-200 bg-white text-neutral-900 outline-none transition-colors focus:border-neutral-400 w-full cursor-pointer"
 >
 {f.options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
 </select>
 ) : (
 <input
 type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
 value={formData[f.key] ?? ''}
  onChange={e => handleModalChange(f.key, f.type === 'number' ? (e.target.value === '' ? undefined : Number(e.target.value)) : e.target.value)}
 placeholder={f.label}
 className="h-9 px-3 text-sm rounded-md border border-neutral-200 bg-white text-neutral-900 placeholder-neutral-400 outline-none transition-colors focus:border-neutral-400 w-full"
 />
 )}
 </FormField>
 </div>
 ))}
 </div>
 );
 }

 function renderIncomeForm(e?: FinanceIncome) {
 const d = e || defaultIncome;
 return renderFormFields([
 { label: 'Title', key: 'title', type: 'input' },
 { label: 'Income Type', key: 'incomeType', type: 'select', options: INCOME_TYPES.map(t => ({ value: t, label: t })) },
 { label: 'Source', key: 'source', type: 'select', options: INCOME_SOURCES.map(t => ({ value: t, label: t })) },
 { label: 'Status', key: 'status', type: 'select', options: INCOME_STATUSES.map(t => ({ value: t, label: t })) },
 { label: 'Amount', key: 'amount', type: 'number' },
 { label: 'Currency', key: 'currency', type: 'input' },
 { label: 'Recurrence', key: 'recurrence', type: 'select', options: RECURRENCE_OPTIONS.map(t => ({ value: t, label: t })) },
 { label: 'Income Date', key: 'incomeDate', type: 'date' },
 { label: 'Expected Date', key: 'expectedDate', type: 'date' },
 { label: 'Received Date', key: 'receivedDate', type: 'date' },
 { label: 'Notes', key: 'notes', type: 'input' },
 ]);
 }

 function renderExpenseForm(e?: FinanceExpense) {
 const d = e || defaultExpense;
 return renderFormFields([
 { label: 'Title', key: 'title', type: 'input' },
 { label: 'Category', key: 'category', type: 'select', options: EXPENSE_CATEGORIES.map(t => ({ value: t, label: t })) },
 { label: 'Status', key: 'status', type: 'select', options: EXPENSE_STATUSES.map(t => ({ value: t, label: t })) },
 { label: 'Amount', key: 'amount', type: 'number' },
 { label: 'Currency', key: 'currency', type: 'input' },
 { label: 'Expense Date', key: 'expenseDate', type: 'date' },
 { label: 'Notes', key: 'notes', type: 'input' },
 ]);
 }

 function renderAllocationForm(e?: FinanceAllocationRule) {
 const d = e || defaultRule;
 return renderFormFields([
 { label: 'Name', key: 'name', type: 'input' },
 { label: 'Category', key: 'category', type: 'select', options: ALLOC_CATS.map(t => ({ value: t, label: t })) },
 { label: 'Percentage (%)', key: 'percentage', type: 'number' },
 { label: 'Priority', key: 'priority', type: 'number' },
 { label: 'Notes', key: 'notes', type: 'input' },
 ]);
 }

 function renderGoalForm(e?: FinancePurchaseGoal) {
 const d = e || defaultGoal;
 return renderFormFields([
 { label: 'Title', key: 'title', type: 'input' },
 { label: 'Status', key: 'status', type: 'select', options: GOAL_STATUSES.map(t => ({ value: t, label: t })) },
 { label: 'Priority', key: 'priority', type: 'select', options: GOAL_PRIORITIES.map(t => ({ value: t, label: t })) },
 { label: 'Target Amount', key: 'targetAmount', type: 'number' },
 { label: 'Saved Amount', key: 'savedAmount', type: 'number' },
 { label: 'Currency', key: 'currency', type: 'input' },
 { label: 'Target Date', key: 'targetDate', type: 'date' },
 { label: 'Notes', key: 'notes', type: 'input' },
 ]);
 }

 function renderIdeaForm(e?: FinanceInvestmentIdea) {
 const d = e || defaultIdea;
 return renderFormFields([
 { label: 'Title', key: 'title', type: 'input' },
 { label: 'Type', key: 'type', type: 'select', options: INVESTMENT_TYPES.map(t => ({ value: t, label: t })) },
 { label: 'Risk Level', key: 'riskLevel', type: 'select', options: RISK_LEVELS.map(t => ({ value: t, label: t })) },
 { label: 'Ethical Status', key: 'ethicalStatus', type: 'select', options: ETHICAL_STATUSES.map(t => ({ value: t, label: t })) },
 { label: 'Status', key: 'status', type: 'select', options: INVESTMENT_STATUSES.map(t => ({ value: t, label: t })) },
 { label: 'Planned Amount', key: 'plannedAmount', type: 'number' },
 { label: 'Currency', key: 'currency', type: 'input' },
 { label: 'Decision Status', key: 'decisionStatus', type: 'select', options: INVEST_DECISION_STATUSES.map(t => ({ value: t, label: t })) },
 { label: 'Notes', key: 'notes', type: 'input' },
 ]);
 }

 function renderAllocForm(e?: FinanceInvestmentAllocation) {
 const d = e || defaultInvAlloc;
 return renderFormFields([
 { label: 'Name', key: 'name', type: 'input' },
 { label: 'Category', key: 'category', type: 'select', options: INV_ALLOC_CATS.map(t => ({ value: t, label: t })) },
 { label: 'Percentage (%)', key: 'percentage', type: 'number' },
 ]);
 }

 function renderInvRuleForm(e?: FinanceInvestmentRule) {
 const d = e || defaultInvRule;
 return renderFormFields([
 { label: 'Title', key: 'title', type: 'input' },
 { label: 'Category', key: 'category', type: 'select', options: INV_RULE_CATS.map(t => ({ value: t, label: t })) },
 ]);
 }

 function renderRecurringForm(e?: FinanceRecurringRule) {
 const d = e || defaultRecurring;
 return renderFormFields([
 { label: 'Title', key: 'title', type: 'input' },
 { label: 'Kind', key: 'kind', type: 'select', options: RECURRING_KINDS.map(t => ({ value: t, label: t })) },
 { label: 'Amount', key: 'amount', type: 'number' },
 { label: 'Currency', key: 'currency', type: 'input' },
 { label: 'Frequency', key: 'frequency', type: 'select', options: RECURRING_FREQUENCIES.map(t => ({ value: t, label: t })) },
 { label: 'Confidence', key: 'confidence', type: 'select', options: CONFIDENCE_LEVELS.map(t => ({ value: t, label: t })) },
 { label: 'Start Date', key: 'startDate', type: 'date' },
 { label: 'End Date', key: 'endDate', type: 'date' },
 { label: 'Source', key: 'source', type: 'select', options: INCOME_SOURCES.map(t => ({ value: t, label: t })) },
 { label: 'Category', key: 'category', type: 'select', options: EXPENSE_CATEGORIES.map(t => ({ value: t, label: t })) },
 { label: 'Notes', key: 'notes', type: 'input' },
 ]);
 }

 function renderPeriodForm(e?: FinancePeriod) {
 const d = e || defaultPeriod;
 return renderFormFields([
 { label: 'Title', key: 'title', type: 'input' },
 { label: 'Start Date', key: 'startDate', type: 'date' },
 { label: 'End Date', key: 'endDate', type: 'date' },
 ]);
 }

 function renderModal() {
 if (!modal) return null;
 const item = getEditItem(modal.type);
 const titleLabel = modal.id ? 'Edit' : 'New';
 const typeLabel = modal.type.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase());
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center bg-neutral-900/30" onClick={closeModal}>
 <div className="bg-white rounded-2xl border border-neutral-200 w-full max-w-lg max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
 <div className="flex items-center justify-between px-5 py-4 border-b border-neutral-200">
 <h3 className="text-sm font-semibold text-black">{titleLabel} {typeLabel}</h3>
 <button type="button" onClick={closeModal} className="text-neutral-400 hover:text-black text-xl leading-none p-1 rounded hover:bg-neutral-100">&times;</button>
 </div>
 <div className="p-5">
 {modal.type === 'income' && renderIncomeForm(item)}
 {modal.type === 'expenses' && renderExpenseForm(item)}
 {modal.type === 'allocation' && renderAllocationForm(item)}
 {modal.type === 'purchase_goals' && renderGoalForm(item)}
 {modal.type === 'investments' && renderIdeaForm(item)}
 {modal.type === 'recurring' && renderRecurringForm(item)}
 {modal.type === 'periods' && renderPeriodForm(item)}
  </div>
  {saveError && (
  <div className="px-5 py-3 border-t border-red-100 bg-red-50">
    <p className="text-xs text-red-700">{saveError}</p>
  </div>
  )}
  <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-neutral-200 bg-neutral-50/50 rounded-b-2xl">
  <Button variant="outline" size="sm" onClick={closeModal}>Cancel</Button>
   <Button variant="primary" size="sm" disabled={saving} onClick={handleSave}>{saving ? 'Saving...' : 'Save'}</Button>
  </div>
 </div>
 </div>
 );
 }

  function renderPeriodSelector() {
  const contextLabel = selectedPeriod ? selectedPeriod.title : 'All Records';
  return (
  <div className="flex flex-wrap items-center gap-2">
  <span className="text-xs font-medium text-neutral-500 mr-1 whitespace-nowrap">Viewing:</span>
  <span className="text-xs font-semibold text-neutral-800 bg-neutral-100 rounded-md px-2.5 py-1.5 whitespace-nowrap">{contextLabel}</span>
  <select
  value={selectedPeriodId}
  onChange={e => setSelectedPeriodId(e.target.value)}
  className="h-9 px-3 text-sm rounded-lg border border-neutral-200 bg-white text-neutral-900 outline-none transition-colors focus:border-neutral-400 min-w-[200px] cursor-pointer"
  >
  <option value="">All Records</option>
  {sortedPeriods.map(p => (
  <option key={p.id} value={p.id}>{p.title} ({new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()})</option>
  ))}
  </select>
  <Button variant="outline" size="sm" className="h-9 rounded-lg border-neutral-200" onClick={() => {
  const n = new Date();
  const y = n.getFullYear();
  const m = String(n.getMonth() + 1).padStart(2, '0');
  onAddFinancePeriod({ title: `${MONTHS[n.getMonth()]} ${y}`, type: 'manual', startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${new Date(y, n.getMonth() + 1, 0).getDate()}`, status: 'open' });
  }}>+ Current Month</Button>
  {selectedPeriodId && (
  <Button variant="outline" size="sm" className="h-9 rounded-lg border-neutral-200" onClick={() => { setSelectedPeriodId(''); }}>Clear</Button>
  )}
  </div>
  );
  }

 function MetricCard({ label, value, className }: { label: string; value: string; className?: string }) {
 return (
 <div className={`rounded-xl border border-neutral-200 bg-white p-4 ${className || ''}`}>
 <div className="text-xs text-neutral-500 mb-1 font-medium truncate">{label}</div>
 <div className="text-xl font-bold text-black truncate">{value}</div>
 </div>
 );
 }

  function renderDashboard() {
  const expectedIncome = dashboardIncome.filter(i => i.status === 'expected' || i.status === 'delayed').reduce((s,i) => s + i.amount, 0);
  const receivedIncome = dashboardIncome.filter(i => i.status === 'received').reduce((s,i) => s + i.amount, 0);
  const totalExpenses = dashboardExpenses.reduce((s,e) => s + e.amount, 0);
  const paidExpenses = dashboardExpenses.filter(e => e.status === 'paid').reduce((s,e) => s + e.amount, 0);
  const unpaidExpenses = dashboardExpenses.filter(e => e.status === 'unpaid').reduce((s,e) => s + e.amount, 0);
  const plannedExpenses = dashboardExpenses.filter(e => e.status === 'planned').reduce((s,e) => s + e.amount, 0);
  const totalIncome = dashboardIncome.reduce((s,i) => s + i.amount, 0);
  const netCash = receivedIncome - paidExpenses;
  const netProjected = totalIncome - totalExpenses;
  const recentIncomeActivity = dashboardIncome.map(i => ({ ...i, _type: 'income' as const, _date: i.incomeDate || i.expectedDate || '' }));
  const recentExpenseActivity = dashboardExpenses.map(e => ({ ...e, _type: 'expense' as const, _date: e.expenseDate || '' }));
  const recentActivity = [...recentIncomeActivity, ...recentExpenseActivity].sort((a, b) => new Date(b._date).getTime() - new Date(a._date).getTime()).slice(0, 5);
  const activeRules = allRules.filter(r => r.isActive);
  const totalPct = allRules.reduce((s,r) => s + r.percentage, 0);

  const paidPct = totalExpenses > 0 ? Math.round(paidExpenses / totalExpenses * 100) : 0;
  const unpaidPct = 100 - paidPct;

  function renderStatusText() {
    if (totalIncome === 0 && totalExpenses === 0) return 'No income or expenses recorded yet for this period.';
    if (receivedIncome === 0 && expectedIncome > 0) return 'Income is expected but not yet received. Focus on confirming expected payments.';
    if (netProjected < 0) return 'Net is negative — planned expenses exceed total income. Consider reducing expenses or increasing income.';
    if (totalExpenses > totalIncome && receivedIncome > 0) return 'Expenses exceed income — review spending and prioritize essential costs.';
    if (totalIncome > 0 && totalExpenses === 0) return 'Income recorded with no expenses — allocate funds toward goals and savings.';
    if (totalIncome > 0 && totalExpenses > 0 && netProjected > 0 && Math.abs(totalPct - 100) < 1) return 'Good shape — income covers expenses and allocation is balanced.';
    if (totalIncome > 0 && totalExpenses > 0 && netProjected > 0) return 'Positive net — review allocation rules to ensure funds are distributed effectively.';
    return 'Review your income and expenses to get a complete financial picture.';
  }

  return (
  <div className="space-y-6">

  {/* Financial Snapshot — 4 hero cards */}
  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <MetricCard label="Total Income" value={toCur(receivedIncome)} className={receivedIncome > 0 ? '' : ''} />
      <MetricCard label="Total Expenses" value={toCur(totalExpenses)} className={totalExpenses > 0 ? '' : ''} />
      <MetricCard
        label="Net Position"
        value={toCur(netProjected)}
        className={netProjected > 0 ? 'border-emerald-200 bg-emerald-50/30' : netProjected < 0 ? 'border-red-200 bg-red-50/30' : ''}
      />
      <MetricCard
        label="Available Cash"
        value={toCur(netCash > 0 ? netCash : 0)}
        className={netCash > 0 ? 'border-blue-200 bg-blue-50/30' : ''}
      />
    </div>

  {/* Smart Financial Status */}
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
    <div className="text-xs font-semibold text-neutral-600 mb-1">Financial Status</div>
    <p className="text-sm text-neutral-700 leading-relaxed">{renderStatusText()}</p>
    {totalPct > 0 && Math.abs(totalPct - 100) >= 1 && (
      <p className="mt-2 text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
        Allocation total is {totalPct}% — {totalPct > 100 ? 'over-allocated by' : 'under-allocated by'} {Math.abs(100 - totalPct)}%.
      </p>
    )}
  </div>

  {/* Expense Status + Allocation Health grid */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

    {/* Expense Status */}
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-xs font-semibold text-neutral-600 mb-3">Expense Status</h3>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-neutral-500">Paid</span>
          <span className="font-semibold text-emerald-700">{toCur(paidExpenses)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-500">Planned / Unpaid</span>
          <span className="font-semibold text-amber-700">{toCur(plannedExpenses + unpaidExpenses)}</span>
        </div>
        <div className="flex justify-between pt-2 border-t border-neutral-200">
          <span className="font-semibold text-neutral-900">Total</span>
          <span className="font-semibold text-neutral-900">{toCur(totalExpenses)}</span>
        </div>
      </div>
      {totalExpenses > 0 && (
        <div className="mt-3 h-2 w-full rounded-full bg-neutral-200 overflow-hidden flex">
          <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${paidPct}%` }} />
          <div className="h-full rounded-full bg-amber-400 transition-all" style={{ width: `${unpaidPct}%` }} />
        </div>
      )}
      {totalExpenses === 0 && (
        <p className="mt-2 text-xs text-neutral-400">No expenses recorded yet.</p>
      )}
    </div>

    {/* Allocation Health */}
    <div className="rounded-xl border border-neutral-200 bg-white p-4">
      <h3 className="text-xs font-semibold text-neutral-600 mb-3">Allocation Health</h3>
      {activeRules.length > 0 ? (
        <>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-500">Total allocated</span>
            <span className={`text-sm font-semibold ${Math.abs(totalPct - 100) < 1 ? 'text-emerald-700' : 'text-amber-700'}`}>
              {totalPct}%
              {Math.abs(totalPct - 100) < 1 ? ' — Balanced' : totalPct > 100 ? ' — Over' : ' — Under'}
            </span>
          </div>
          <div className="space-y-2">
            {activeRules.slice(0, 5).map(r => (
              <div key={r.id}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-neutral-700 font-medium truncate">{r.name || r.category}</span>
                  <span className="text-neutral-500">{r.percentage}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
                  <div className="h-full rounded-full bg-neutral-800 transition-all" style={{ width: `${Math.min(100, Math.max(0, r.percentage))}%` }} />
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <p className="text-xs text-neutral-400">No allocation rules yet. Add rules to plan your money.</p>
      )}
    </div>
  </div>

  {/* Recent Activity */}
  <div className="rounded-xl border border-neutral-200 bg-white overflow-hidden">
    <div className="px-4 py-2.5 text-xs font-semibold text-neutral-600 border-b border-neutral-100">Recent Activity</div>
    {recentActivity.length > 0 ? (
      <div className="divide-y divide-neutral-100">
        {recentActivity.map(item => (
          <div key={item.id} className="px-4 py-2.5 flex items-center justify-between text-xs">
            <div className="min-w-0 flex-1 truncate pr-2 flex items-center gap-2">
              <span className={`shrink-0 w-1.5 h-1.5 rounded-full ${item._type === 'income' ? 'bg-emerald-500' : 'bg-rose-400'}`} />
              <span className="text-neutral-900 font-medium truncate">{item.title || item._type === 'income' ? item.incomeType : item.category}</span>
              <Badge variant={statusBadge[item.status] || 'neutral'}>{item.status}</Badge>
            </div>
            <span className="font-semibold text-neutral-900 shrink-0">{toCur(item.amount, item.currency)}</span>
          </div>
        ))}
      </div>
    ) : (
      <div className="px-4 py-6 text-center text-xs text-neutral-400">No recent activity yet.</div>
    )}
  </div>

  {/* Recurring generate — only when period selected */}
  {selectedPeriodId && allRecurring.some(r => r.isActive) && (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 flex items-center justify-between gap-3">
      <span className="text-xs text-neutral-500">{allRecurring.filter(r => r.isActive).length} active recurring rules</span>
      <Button variant="outline" size="sm" disabled={generating} onClick={generateRecurringItemsForPeriod}>
        {generating ? 'Generating...' : 'Generate Recurring'}
      </Button>
      {generateResult && (
        <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-1">{generateResult}</span>
      )}
    </div>
  )}

  </div>
  );
  }

  function renderPeriodsTab() {
  const yearPeriods = allPeriods.filter(p => {
  const d = new Date(p.startDate);
  return d.getFullYear() === calendarYear;
  });
  const yearIncome = allIncome.filter(i => {
  const d = new Date(i.incomeDate || i.expectedDate || i.receivedDate || '');
  return !isNaN(d.getTime()) && d.getFullYear() === calendarYear;
  });
  const yearExpenses = allExpenses.filter(e => {
  const d = new Date(e.expenseDate || e.createdAt || '');
  return !isNaN(d.getTime()) && d.getFullYear() === calendarYear;
  });
  const yearIncomeTotal = yearIncome.reduce((s,i) => s + i.amount, 0);
  const yearExpenseTotal = yearExpenses.reduce((s,e) => s + e.amount, 0);
  const yearNet = yearIncomeTotal - yearExpenseTotal;
  const openCount = yearPeriods.filter(p => p.status === 'open').length;

  const monthPeriodMap = new Map<string, FinancePeriod>();
  yearPeriods.forEach(p => {
  const d = new Date(p.startDate);
  const key = formatMonthKey(d);
  monthPeriodMap.set(key, p);
  });

  function getMonthFinancials(m: number) {
  const key = formatMonthKey(new Date(calendarYear, m, 1));
  const period = monthPeriodMap.get(key);
  if (period) {
  const inc = allIncome.filter(i => incomeInPeriod(i, period.id, period)).reduce((s,i) => s + i.amount, 0);
  const exp = allExpenses.filter(e => expenseInPeriod(e, period.id, period)).reduce((s,e) => s + e.amount, 0);
  return { income: inc, expenses: exp, net: inc - exp };
  }
  const start = `${calendarYear}-${String(m + 1).padStart(2, '0')}-01`;
  const end = `${calendarYear}-${String(m + 1).padStart(2, '0')}-${new Date(calendarYear, m + 1, 0).getDate()}`;
  const inc = allIncome.filter(i => {
  const d = i.incomeDate || i.expectedDate || i.receivedDate || '';
  return d && isDateBetween(d, start, end);
  }).reduce((s,i) => s + i.amount, 0);
  const exp = allExpenses.filter(e => {
  const d = e.expenseDate || e.createdAt || '';
  return d && isDateBetween(d, start, end);
  }).reduce((s,e) => s + e.amount, 0);
  return { income: inc, expenses: exp, net: inc - exp };
  }

  return (
  <div className="space-y-5">

  {/* Page heading */}
  <div>
    <h2 className="text-lg font-bold text-black">Finance Calendar</h2>
    <p className="text-xs text-neutral-500 mt-1">Manage monthly financial periods and track each month's status.</p>
  </div>

  {/* Year navigation & Current Month */}
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" className="h-9 rounded-lg border-neutral-200" onClick={() => setCalendarYear(calendarYear - 1)}>&larr;</Button>
      <span className="text-base font-semibold text-black min-w-[80px] text-center">{calendarYear}</span>
      <Button variant="outline" size="sm" className="h-9 rounded-lg border-neutral-200" onClick={() => setCalendarYear(calendarYear + 1)}>&rarr;</Button>
    </div>
    <Button variant="outline" size="sm" className="h-9 rounded-lg border-neutral-200" onClick={() => {
      setCalendarYear(cYear);
      const n = new Date();
      const y = n.getFullYear();
      const m = String(n.getMonth() + 1).padStart(2, '0');
      onAddFinancePeriod({ title: `${MONTHS[n.getMonth()]} ${y}`, type: 'manual', startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${new Date(y, n.getMonth() + 1, 0).getDate()}`, status: 'open' });
    }}>+ Current Month</Button>
  </div>

  {/* Yearly summary strip */}
  <div className="rounded-xl border border-neutral-200 bg-white px-4 py-3">
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
      <div className="text-neutral-500">
        <span className="block font-medium text-neutral-900">{yearPeriods.length}</span>
        Total periods
      </div>
      <div className="text-neutral-500">
        <span className="block font-medium text-emerald-700">{openCount}</span>
        Open periods
      </div>
      <div className="text-neutral-500">
        <span className="block font-medium text-neutral-900">{toCur(yearIncomeTotal)}</span>
        Income
      </div>
      <div className="text-neutral-500">
        <span className="block font-medium text-neutral-900">{toCur(yearExpenseTotal)}</span>
        Expenses
      </div>
      <div className="text-neutral-500">
        <span className={`block font-medium ${yearNet >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
          {yearNet >= 0 ? '+' : ''}{toCur(Math.abs(yearNet))}
        </span>
        Net
      </div>
    </div>
  </div>

  {/* Calendar grid */}
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
    {Array.from({ length: 12 }, (_, i) => {
    const key = formatMonthKey(new Date(calendarYear, i, 1));
    const period = monthPeriodMap.get(key);
    const fin = getMonthFinancials(i);
    const isCurrent = calendarYear === cYear && i === cMonth;
    const isSelected = period && selectedPeriodId === period.id;
    const isMissing = !period;

    return (
    <div
    key={key}
    className={`rounded-xl border bg-white p-4 transition-colors ${isSelected ? 'border-neutral-800 ring-1 ring-neutral-800' : 'border-neutral-200'} ${isCurrent && !isSelected ? 'border-blue-300' : ''}`}
    >
    {/* Header row */}
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm font-semibold text-black">{MONTHS[i]} {calendarYear}</span>
      {isCurrent && <span className="text-[10px] font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-full px-2 py-0.5">Current</span>}
    </div>

    {/* Status badge */}
    <div className="mb-3">
      {period ? (
      <Badge variant={period.status === 'open' ? 'success' : 'neutral'}>{period.status}</Badge>
      ) : (
      <Badge variant="neutral">No period</Badge>
      )}
      {isSelected && <Badge variant="success" className="ml-1">Selected</Badge>}
    </div>

    {/* Date range */}
    {period ? (
      <div className="text-[11px] text-neutral-500 mb-3">
      {new Date(period.startDate).toLocaleDateString()} &ndash; {new Date(period.endDate).toLocaleDateString()}
      </div>
    ) : (
      <div className="text-[11px] text-neutral-400 mb-3">
      {new Date(calendarYear, i, 1).toLocaleDateString()} &ndash; {new Date(calendarYear, i + 1, 0).toLocaleDateString()}
      </div>
    )}

    {/* Financials */}
    <div className="space-y-0.5 text-[11px] mb-3">
      <div className="flex justify-between"><span className="text-neutral-400">Income</span><span className="font-medium text-neutral-700">{toCur(fin.income)}</span></div>
      <div className="flex justify-between"><span className="text-neutral-400">Expenses</span><span className="font-medium text-neutral-700">{toCur(fin.expenses)}</span></div>
      <div className="flex justify-between pt-0.5 border-t border-neutral-100">
      <span className="text-neutral-500">Net</span>
      <span className={`font-semibold ${fin.net > 0 ? 'text-emerald-700' : fin.net < 0 ? 'text-red-700' : 'text-neutral-600'}`}>
        {fin.net >= 0 ? '+' : ''}{toCur(Math.abs(fin.net))}
      </span>
      </div>
    </div>

    {/* Actions */}
    <div className="flex flex-wrap gap-1.5">
      {period ? (
      <>
      <Button variant={isSelected ? 'primary' : 'outline'} size="sm" className="h-7 text-[11px] px-2" onClick={() => setSelectedPeriodId(period.id)}>
      {isSelected ? 'Selected' : 'Select'}
      </Button>
      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => openModal('periods', period.id)}>Edit</Button>
      <Button variant="danger" size="sm" className="h-7 text-[11px] px-2" onClick={() => handleDelete('periods', period.id)}>Del</Button>
      </>
      ) : (
      <Button variant="outline" size="sm" className="h-7 text-[11px] px-2" onClick={() => {
      const m = String(i + 1).padStart(2, '0');
      const days = new Date(calendarYear, i + 1, 0).getDate();
      onAddFinancePeriod({ title: `${MONTHS[i]} ${calendarYear}`, type: 'manual', startDate: `${calendarYear}-${m}-01`, endDate: `${calendarYear}-${m}-${days}`, status: 'open' });
      }}>+ Create Period</Button>
      )}
    </div>
    </div>
    );
    })}
  </div>
  </div>
  );
  }

 function renderIncomeTab() {
 const list = filteredFinanceIncome;
 const received = list.filter(i => i.status === 'received').reduce((s,i) => s + i.amount, 0);
 const expected = list.filter(i => i.status === 'expected' || i.status === 'delayed').reduce((s,i) => s + i.amount, 0);
 return (
 <div className="space-y-3">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <div className="flex items-center gap-3">
 <h3 className="text-sm font-semibold text-black">Income ({list.length})</h3>
 <span className="text-xs text-neutral-500">Received: {toCur(received)}</span>
 <span className="text-xs text-neutral-500">Expected: {toCur(expected)}</span>
 </div>
 <Button variant="primary" size="sm" onClick={() => openModal('income')}>+ Add Income</Button>
 </div>
 {list.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">No income records yet.</div>
 ) : (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 {list.map(i => (
 <div key={i.id} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-sm font-medium text-black">{i.title || i.incomeType}</span>
 <Badge variant={statusBadge[i.status] || 'neutral'}>{i.status}</Badge>
 {i.isRecurring && <Badge variant="neutral">Recurring</Badge>}
 </div>
 <div className="mt-0.5 text-xs text-neutral-500">
 {i.source} &middot; {i.recurrence}
 {i.incomeDate && <> &middot; {new Date(i.incomeDate).toLocaleDateString()}</>}
 {i.expectedDate && <> &middot; Expected: {new Date(i.expectedDate).toLocaleDateString()}</>}
 {i.receivedDate && <> &middot; Received: {new Date(i.receivedDate).toLocaleDateString()}</>}
 </div>
 {(i as any).notes && <div className="mt-1 text-xs text-neutral-400">{(i as any).notes}</div>}
 </div>
 <div className="text-right shrink-0">
 <div className="text-sm font-semibold text-black">{toCur(i.amount, i.currency)}</div>
 <div className="mt-0.5 flex gap-1">
 <Button variant="outline" size="sm" onClick={() => openModal('income', i.id)}>Edit</Button>
 <Button variant="danger" size="sm" onClick={() => handleDelete('income', i.id)}>Del</Button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 }

 function renderExpensesTab() {
 const list = filteredFinanceExpenses;
 const total = list.reduce((s,e) => s + e.amount, 0);
 return (
 <div className="space-y-3">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <div className="flex items-center gap-3">
 <h3 className="text-sm font-semibold text-black">Expenses ({list.length})</h3>
 <span className="text-xs text-neutral-500">Total: {toCur(total)}</span>
 </div>
 <Button variant="primary" size="sm" onClick={() => openModal('expenses')}>+ Add Expense</Button>
 </div>
 {list.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">No expenses yet.</div>
 ) : (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 {list.map(e => (
 <div key={e.id} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-sm font-medium text-black">{e.title || e.category}</span>
 <Badge variant={statusBadge[e.status] || 'neutral'}>{e.status}</Badge>
 <Badge variant="neutral">{e.category}</Badge>
 </div>
 <div className="mt-0.5 text-xs text-neutral-500">
 {e.expenseDate && <>{new Date(e.expenseDate).toLocaleDateString()}</>}
 {e.financePeriodId && <> &middot; Period: {allPeriods.find(p=>p.id===e.financePeriodId)?.title || e.financePeriodId}</>}
 </div>
 {(e as any).notes && <div className="mt-1 text-xs text-neutral-400">{(e as any).notes}</div>}
 </div>
 <div className="text-right shrink-0">
 <div className="text-sm font-semibold text-black">{toCur(e.amount, e.currency)}</div>
 <div className="mt-0.5 flex gap-1">
 <Button variant="outline" size="sm" onClick={() => openModal('expenses', e.id)}>Edit</Button>
 <Button variant="danger" size="sm" onClick={() => handleDelete('expenses', e.id)}>Del</Button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 }

 function renderAllocationTab() {
 const list = allRules;
 const totalPct = list.reduce((s,r) => s + r.percentage, 0);
 return (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-black">Allocation Rules ({list.length})</h3>
 <Button variant="primary" size="sm" onClick={() => openModal('allocation')}>+ Add Rule</Button>
 </div>
 {list.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">No allocation rules yet.</div>
 ) : (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 {list.map(r => (
 <div key={r.id} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-sm font-medium text-black">{r.name || r.category}</span>
 <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
 <span className="text-xs text-neutral-500">{r.category} &middot; {r.percentage}% &middot; Priority {r.priority}</span>
 </div>
 {(r as any).notes && <div className="mt-1 text-xs text-neutral-400">{(r as any).notes}</div>}
 </div>
 <div className="flex gap-1 shrink-0">
 <Button variant="outline" size="sm" onClick={() => openModal('allocation', r.id)}>Edit</Button>
 <Button variant="danger" size="sm" onClick={() => handleDelete('allocation', r.id)}>Del</Button>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 {totalPct > 0 && (
 <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-600">
 Total allocated: {totalPct}% {totalPct !== 100 && <>({100 - totalPct}% unallocated — treated as remainder)</>}
 </div>
 )}
 </div>
 );
 }

 function renderPurchaseGoalsTab() {
 const list = allGoals;
 return (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-black">Purchase Goals ({list.length})</h3>
 <Button variant="primary" size="sm" onClick={() => openModal('purchase_goals')}>+ Add Goal</Button>
 </div>
 {list.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">No purchase goals yet.</div>
 ) : (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 {list.map(g => {
 const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
 return (
 <div key={g.id} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-sm font-medium text-black">{g.title || 'Unnamed'}</span>
 <Badge variant={statusBadge[g.status] || 'neutral'}>{g.status}</Badge>
 <Badge variant={priorityBadge[g.priority] || 'neutral'}>{g.priority}</Badge>
 </div>
 <div className="mt-1 text-xs text-neutral-500">
 Target: {toCur(g.targetAmount, g.currency)} &middot; Saved: {toCur(g.savedAmount, g.currency)} &middot; {pct}%
 </div>
 <div className="mt-1.5 h-1.5 w-full rounded-full bg-neutral-200 overflow-hidden">
 <div className="h-full rounded-full bg-black transition-all duration-300" style={{width:`${Math.min(100, Math.max(0, pct))}%`}} />
 </div>
 </div>
 <div className="flex gap-1 shrink-0">
 <Button variant="outline" size="sm" onClick={() => openModal('purchase_goals', g.id)}>Edit</Button>
 <Button variant="danger" size="sm" onClick={() => handleDelete('purchase_goals', g.id)}>Del</Button>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
 }

 function renderRecurringRulesTab() {
 return (
 <div className="space-y-3">
 <div className="flex items-center justify-between flex-wrap gap-2">
 <h3 className="text-sm font-semibold text-black">Recurring Rules ({allRecurring.length})</h3>
 <div className="flex gap-2">
 {selectedPeriodId && (
 <Button variant="outline" size="sm" disabled={generating || !selectedPeriodId} onClick={generateRecurringItemsForPeriod}>
 {generating ? 'Generating...' : 'Generate for this month'}
 </Button>
 )}
 <Button variant="primary" size="sm" onClick={() => openModal('recurring')}>+ Add Rule</Button>
 </div>
 </div>
 {generateResult && (
 <div className="p-3 rounded-lg border border-emerald-200 bg-emerald-50 text-xs text-emerald-800">{generateResult}</div>
 )}
 {!selectedPeriodId && (
 <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
 Select a Finance Period before generating recurring items.
 </div>
 )}
 {allRecurring.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">No recurring rules yet.</div>
 ) : (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 {allRecurring.map(r => (
 <div key={r.id} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-sm font-medium text-black">{r.title}</span>
 <Badge variant={r.kind === 'income' ? 'success' : 'danger'}>{r.kind}</Badge>
 <Badge variant={r.isActive ? 'success' : 'neutral'}>{r.isActive ? 'Active' : 'Inactive'}</Badge>
 <Badge variant="neutral">{r.frequency}</Badge>
 </div>
 <div className="mt-0.5 text-xs text-neutral-500">
 Confidence: {r.confidence}
 {r.startDate && <> &middot; Start: {new Date(r.startDate).toLocaleDateString()}</>}
 {r.endDate && <> &middot; End: {new Date(r.endDate).toLocaleDateString()}</>}
 {r.source && <> &middot; Source: {r.source}</>}
 </div>
 {r.notes && <div className="mt-1 text-xs text-neutral-400">{r.notes}</div>}
 </div>
 <div className="text-right shrink-0">
 <div className="text-sm font-semibold text-black">{toCur(r.amount, r.currency)}</div>
 <div className="mt-0.5 flex gap-1">
 <Button variant="outline" size="sm" onClick={() => openModal('recurring', r.id)}>Edit</Button>
 <Button variant="danger" size="sm" onClick={() => handleDelete('recurring', r.id)}>Del</Button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 }

 function renderInvestmentsTab() {
 const subTabs: {key: InvestTab; label: string}[] = [
 {key:'overview', label:'Overview'},
 {key:'ideas', label:'Ideas'},
 {key:'allocation', label:'Allocation'},
 {key:'rules', label:'Rules'},
 {key:'risk_review', label:'Risk'},
 {key:'ethical_review', label:'Ethics'},
 ];
 return (
 <div className="space-y-4">
 <div className="flex gap-0 min-w-max border-b border-neutral-200">
 {subTabs.map(t => (
 <button key={t.key} onClick={() => setInvestTab(t.key)}
 className={`px-3.5 py-2 text-xs font-medium border-b-2 transition-all whitespace-nowrap ${
 investTab === t.key
 ? 'text-black border-black'
 : 'text-neutral-500 border-transparent hover:text-black hover:border-neutral-300'
 }`}
 >{t.label}</button>
 ))}
 </div>

 {investTab === 'overview' && (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-black">Investment Overview</h3>
 <Button variant="primary" size="sm" onClick={() => openModal('investments')}>+ Add Idea</Button>
 </div>
 <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
 <MetricCard label="Ideas" value={String(allIdeas.length)} />
 <MetricCard label="Rules" value={String(allInvRules.length)} />
 <MetricCard label="Allocations" value={String(allInvAllocs.length)} />
 <MetricCard label="Invested" value={String(allIdeas.filter(i=>i.status==='invested').length)} />
 </div>
 </div>
 )}

 {investTab === 'ideas' && (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-black">Investment Ideas ({allIdeas.length})</h3>
 <Button variant="primary" size="sm" onClick={() => openModal('investments')}>+ Add</Button>
 </div>
 {allIdeas.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">No investment ideas yet.</div>
 ) : (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 {allIdeas.map(i => (
 <div key={i.id} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-1.5 flex-wrap">
 <span className="text-sm font-medium text-black">{i.title || 'Unnamed'}</span>
 <Badge variant="neutral">{i.type}</Badge>
 <Badge variant={riskBadge[i.riskLevel] || 'neutral'}>{i.riskLevel}</Badge>
 <Badge variant={statusBadge[i.ethicalStatus] || 'neutral'}>{i.ethicalStatus}</Badge>
 <Badge variant={statusBadge[i.status] || 'neutral'}>{i.status}</Badge>
 </div>
 <div className="mt-0.5 text-xs text-neutral-500">
 {i.decisionStatus && <>Decision: {i.decisionStatus}</>}
 {i.fundingStatus && <> &middot; Funding: {i.fundingStatus}</>}
 {i.reviewDate && <> &middot; Review: {new Date(i.reviewDate).toLocaleDateString()}</>}
 {i.maxAllocation && <> &middot; Max: {i.maxAllocation}%</>}
 </div>
 {(i as any).notes && <div className="mt-1 text-xs text-neutral-400">{(i as any).notes}</div>}
 </div>
 <div className="text-right shrink-0">
 <div className="text-sm font-semibold text-black">{toCur(i.plannedAmount, i.currency)}</div>
 <div className="mt-0.5 flex gap-1">
 <Button variant="outline" size="sm" onClick={() => openModal('investments', i.id)}>Edit</Button>
 <Button variant="danger" size="sm" onClick={() => handleDelete('investments', i.id)}>Del</Button>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {investTab === 'allocation' && (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-black">Investment Allocation ({allInvAllocs.length})</h3>
 </div>
 {allInvAllocs.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">No allocation targets.</div>
 ) : (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 {allInvAllocs.map(a => (
 <div key={a.id} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0 flex-1">
 <span className="text-sm font-medium text-black">{a.name || a.category}</span>
 <span className="ml-2 text-xs text-neutral-500">{a.category} &middot; {a.percentage}%</span>
 </div>
 <Button variant="danger" size="sm" onClick={() => handleDelete('investments', a.id)}>Del</Button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {investTab === 'rules' && (
 <div className="space-y-3">
 <div className="flex items-center justify-between">
 <h3 className="text-sm font-semibold text-black">Investment Rules ({allInvRules.length})</h3>
 </div>
 {allInvRules.length === 0 ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">No investment rules.</div>
 ) : (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 {allInvRules.map(r => (
 <div key={r.id} className="px-4 py-3 hover:bg-neutral-50 transition-colors">
 <div className="flex items-center gap-2">
 <span className="text-sm font-medium text-black">{r.title}</span>
 <Badge variant="neutral">{r.category}</Badge>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 )}

 {investTab === 'risk_review' && (
 <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">Risk review coming soon.</div>
 )}

 {investTab === 'ethical_review' && (
 <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-400">Ethical review coming soon.</div>
 )}
 </div>
 );
 }

 function renderAiAssistant() {
 const aiModes: AiMode[] = ['monthly_review', 'allocation_review', 'purchase_review', 'investment_review', 'recurring_income_review', 'next_actions'];
 const hasData = dashboardIncome.length > 0 || dashboardExpenses.length > 0;

 return (
 <div className="space-y-4">
 <h3 className="text-sm font-semibold text-black">AI Finance Assistant</h3>
 <div className="p-3 rounded-lg border border-neutral-200 bg-neutral-50 text-xs text-neutral-500">
 AI Finance Assistant provides organization, risk review, and scenario analysis only. It is not financial, legal, tax, or investment advice. Always review AI output manually before acting.
 </div>
 <div className="flex gap-1.5 flex-wrap">
 {aiModes.map(m => (
 <button key={m}
 onClick={() => { setAiMode(m); setAiResult(null); setAiError(null); }}
 className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
 aiMode === m
 ? 'border-neutral-900 bg-neutral-900 text-white'
 : 'border-neutral-200 bg-white text-neutral-600 hover:bg-neutral-50'
 }`}
 >{m.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</button>
 ))}
 </div>
 <div className="flex items-center gap-2">
 <Button variant="primary" size="sm" disabled={aiLoading || !hasData} onClick={callAiAnalysis}>
 {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
 </Button>
 {!hasData && <span className="text-xs text-neutral-400">Add income or expenses first.</span>}
 </div>
 {aiError && <div className="p-3 rounded-lg border border-red-200 bg-red-50 text-xs text-red-700">{aiError}</div>}
 {aiLoading && <div className="p-8 text-center text-sm text-neutral-400">Generating analysis...</div>}
 {aiResult && (
 <div className="space-y-3">
 {aiResult.summary && (
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-xs text-neutral-500 mb-1 font-medium">Summary</div>
 <div className="text-sm text-black mt-1 leading-relaxed">{aiResult.summary}</div>
 </div>
 )}
 {aiResult.incomeAnalysis?.length > 0 && (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 <div className="px-4 py-2 text-xs font-medium text-neutral-500">Income Analysis</div>
 {aiResult.incomeAnalysis.map((item: string, i: number) => (
 <div key={i} className="px-4 py-2 text-xs text-black leading-relaxed">{item}</div>
 ))}
 </div>
 )}
 {aiResult.expenseAnalysis?.length > 0 && (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 <div className="px-4 py-2 text-xs font-medium text-neutral-500">Expense Analysis</div>
 {aiResult.expenseAnalysis.map((item: string, i: number) => (
 <div key={i} className="px-4 py-2 text-xs text-black leading-relaxed">{item}</div>
 ))}
 </div>
 )}
 {aiResult.allocationReview?.length > 0 && (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 <div className="px-4 py-2 text-xs font-medium text-neutral-500">Allocation Review</div>
 {aiResult.allocationReview.map((item: string, i: number) => (
 <div key={i} className="px-4 py-2 text-xs text-black leading-relaxed">{item}</div>
 ))}
 </div>
 )}
 {aiResult.purchaseGoalReview?.length > 0 && (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 <div className="px-4 py-2 text-xs font-medium text-neutral-500">Purchase Goals</div>
 {aiResult.purchaseGoalReview.map((item: string, i: number) => (
 <div key={i} className="px-4 py-2 text-xs text-black leading-relaxed">{item}</div>
 ))}
 </div>
 )}
 {aiResult.investmentRiskReview?.length > 0 && (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 <div className="px-4 py-2 text-xs font-medium text-neutral-500">Investment Risks</div>
 {aiResult.investmentRiskReview.map((item: string, i: number) => (
 <div key={i} className="px-4 py-2 text-xs text-black leading-relaxed">{item}</div>
 ))}
 </div>
 )}
 {aiResult.recurringIncomeReview?.length > 0 && (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 <div className="px-4 py-2 text-xs font-medium text-neutral-500">Recurring Income Review</div>
 {aiResult.recurringIncomeReview.map((item: string, i: number) => (
 <div key={i} className="px-4 py-2 text-xs text-black leading-relaxed">{item}</div>
 ))}
 </div>
 )}
 {aiResult.ethicalReviewQuestions?.length > 0 && (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 <div className="px-4 py-2 text-xs font-medium text-neutral-500">Ethical Review Questions</div>
 {aiResult.ethicalReviewQuestions.map((item: string, i: number) => (
 <div key={i} className="px-4 py-2 text-xs text-black leading-relaxed">{item}</div>
 ))}
 </div>
 )}
 {aiResult.warnings?.length > 0 && (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 <div className="px-4 py-2 text-xs font-medium text-neutral-500">Warnings</div>
 {aiResult.warnings.map((item: string, i: number) => (
 <div key={i} className="px-4 py-2 text-xs text-red-700 leading-relaxed">{item}</div>
 ))}
 </div>
 )}
 {aiResult.nextActions?.length > 0 && (
 <div className="rounded-xl border border-neutral-200 bg-white divide-y divide-neutral-100 overflow-hidden">
 <div className="px-4 py-2 text-xs font-medium text-neutral-500">Next Actions</div>
 {aiResult.nextActions.map((item: string, i: number) => (
 <div key={i} className="px-4 py-2 text-xs text-black leading-relaxed">{item}</div>
 ))}
 </div>
 )}
 </div>
 )}
 </div>
 );
 }

 function renderCompactHorizonView() {
 if (horizonView === 'monthly' && selectedPeriodId) {
 const inc = filteredFinanceIncome.reduce((s,i) => s + i.amount, 0);
 const exp = filteredFinanceExpenses.reduce((s,e) => s + e.amount, 0);
 const net = inc - exp;
 return (
 <div className="space-y-2">
 <div className="text-xs text-neutral-500 font-medium">Current Period</div>
 <div className="text-base font-bold text-black">{toCur(net)}</div>
 <div className="space-y-0.5 text-xs text-neutral-500">
 <div className="flex justify-between"><span>Income</span><span className="text-black font-medium">{toCur(inc)}</span></div>
 <div className="flex justify-between"><span>Expenses</span><span className="text-black font-medium">{toCur(exp)}</span></div>
 </div>
 </div>
 );
 }

 const allPeriodIncomeMap: Record<string, {income: number; expenses: number; count: number}> = {};
 allPeriods.forEach(p => {
 const key = p.id;
 const inc = allIncome.filter(i => incomeInPeriod(i, p.id, p)).reduce((s,i) => s + i.amount, 0);
 const exp = allExpenses.filter(e => expenseInPeriod(e, p.id, p)).reduce((s,e) => s + e.amount, 0);
 allPeriodIncomeMap[key] = { income: inc, expenses: exp, count: allIncome.filter(i => incomeInPeriod(i, p.id, p)).length + allExpenses.filter(e => expenseInPeriod(e, p.id, p)).length };
 });

 const months: {key: string; income: number; expenses: number; count: number}[] = [];
 [...allIncome, ...allExpenses].forEach((item: any) => {
 const dateStr = 'incomeDate' in item ? (item as any).incomeDate || (item as any).expectedDate : (item as any).expenseDate;
 if (!dateStr) return;
 const key = formatMonthKey(new Date(dateStr));
 let m = months.find(m => m.key === key);
 if (!m) { m = {key, income: 0, expenses: 0, count: 0}; months.push(m); }
 if ('incomeDate' in item || 'expectedDate' in item) m.income += (item as any).amount || 0;
 else m.expenses += (item as any).amount || 0;
 m.count++;
 });
 months.sort((a,b) => a.key.localeCompare(b.key));

 const n = new Date();
 let horizonMonths: number;
 if (horizonView === 'six_months') horizonMonths = 6;
 else if (horizonView === 'yearly') horizonMonths = 12;
 else if (horizonView === 'five_years') horizonMonths = 60;
 else if (horizonView === 'ten_years') horizonMonths = 120;
 else horizonMonths = 1;

 const cutoff = new Date(n.getFullYear(), n.getMonth() - horizonMonths + 1, 1);
 const filteredMonths = months.filter(m => {
 const [y,mo] = m.key.split('-').map(Number);
 const d = new Date(y, mo-1);
 return d >= cutoff;
 });

 const totalInc = filteredMonths.reduce((s,m) => s + m.income, 0);
 const totalExp = filteredMonths.reduce((s,m) => s + m.expenses, 0);
 const avgMonthlyInc = filteredMonths.length > 0 ? totalInc / filteredMonths.length : 0;
 const avgMonthlyExp = filteredMonths.length > 0 ? totalExp / filteredMonths.length : 0;

 const yearGroups: Record<string, {income: number; expenses: number; months: number}> = {};
 filteredMonths.forEach(m => {
 const year = m.key.substring(0, 4);
 if (!yearGroups[year]) yearGroups[year] = {income: 0, expenses: 0, months: 0};
 yearGroups[year].income += m.income;
 yearGroups[year].expenses += m.expenses;
 yearGroups[year].months++;
 });

 return (
 <div className="space-y-2">
 <div className="text-xs text-neutral-500 font-medium">
 {horizonView === 'monthly' ? 'Current Month' : horizonView === 'six_months' ? 'Last 6 Months' : horizonView === 'yearly' ? 'Last 12 Months' : horizonView === 'five_years' ? 'Last 5 Years' : 'Last 10 Years'}
 </div>
 <div className="space-y-1 text-xs">
 <div className="flex justify-between"><span>Total Income</span><span className="text-black font-medium">{toCur(totalInc)}</span></div>
 <div className="flex justify-between"><span>Total Expenses</span><span className="text-black font-medium">{toCur(totalExp)}</span></div>
 <div className="flex justify-between pt-1 mt-1 border-t border-neutral-200 font-semibold text-black"><span>Avg Net</span><span>{toCur(avgMonthlyInc - avgMonthlyExp)}</span></div>
 </div>
 {filteredMonths.length > 0 && (
 <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
 {filteredMonths.slice(-6).map(m => {
 const net = m.income - m.expenses;
 return (
 <div key={m.key} className="flex items-center justify-between text-xs">
 <span className="text-neutral-500">{m.key}</span>
 <span className={net >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>{net >= 0 ? '+' : ''}{toCur(net)}</span>
 </div>
 );
 })}
 </div>
 )}
 {(horizonView === 'five_years' || horizonView === 'ten_years') && (
 <div className="space-y-0.5">
 {Object.entries(yearGroups).sort(([a],[b]) => a.localeCompare(b)).slice(-3).map(([year, data]) => {
 const net = data.income - data.expenses;
 return (
 <div key={year} className="flex items-center justify-between text-xs">
 <span className="text-neutral-500">{year}</span>
 <span className={net >= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}>{net >= 0 ? '+' : ''}{toCur(net)}</span>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
 }

   function renderSidebar() {
  const totalInc = allIncome.reduce((s,i) => s + i.amount, 0);
  const totalExp = allExpenses.reduce((s,e) => s + e.amount, 0);
  const netAll = totalInc - totalExp;

  return (
  <div className="flex flex-col gap-5">

  {/* Horizon View */}
  <div className="rounded-[18px] border border-black/10 bg-white p-5">
  <div className="flex items-center justify-between mb-3">
  <span className="text-xs font-semibold text-black">Horizon View</span>
  <select
  value={horizonView}
  onChange={e => setHorizonView(e.target.value as HorizonView)}
  className="h-7 text-xs rounded-md border border-neutral-200 bg-white text-neutral-900 outline-none focus:border-neutral-400 cursor-pointer px-2"
  >
  <option value="monthly">Monthly</option>
  <option value="six_months">6 Months</option>
  <option value="yearly">Yearly</option>
  <option value="five_years">5 Years</option>
  <option value="ten_years">10 Years</option>
  </select>
  </div>
  {renderCompactHorizonView()}
  </div>

  {/* All-time Summary */}
  <div className="rounded-[18px] border border-black/10 bg-white p-5">
  <div className="text-xs font-semibold text-neutral-600 mb-3">All-time Summary</div>
  <div className="space-y-2 text-xs">
  <div className="flex justify-between"><span className="text-neutral-500">Income</span><span className="font-semibold text-neutral-900">{toCur(totalInc)}</span></div>
  <div className="flex justify-between"><span className="text-neutral-500">Expenses</span><span className="font-semibold text-neutral-900">{toCur(totalExp)}</span></div>
  <div className="flex justify-between pt-2 border-t border-neutral-200"><span className="font-semibold text-neutral-900">Net</span><span className={`font-semibold ${netAll >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>{toCur(netAll)}</span></div>
  </div>
  </div>

  {/* Quick Counts */}
  <div className="rounded-[18px] border border-black/10 bg-white p-5">
  <div className="text-xs font-semibold text-neutral-600 mb-3">Quick Counts</div>
  <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs text-neutral-500">
    <div className="flex justify-between"><span>Income</span><span className="text-neutral-900 font-medium">{allIncome.length}</span></div>
    <div className="flex justify-between"><span>Expenses</span><span className="text-neutral-900 font-medium">{allExpenses.length}</span></div>
    <div className="flex justify-between"><span>Goals</span><span className="text-neutral-900 font-medium">{allGoals.length}</span></div>
    <div className="flex justify-between"><span>Investments</span><span className="text-neutral-900 font-medium">{allIdeas.length}</span></div>
    <div className="flex justify-between"><span>Allocations</span><span className="text-neutral-900 font-medium">{allRules.length}</span></div>
    <div className="flex justify-between"><span>Recurring</span><span className="text-neutral-900 font-medium">{allRecurring.length}</span></div>
  </div>
  </div>
  </div>
  );
  }

 function buildFinanceSummary() {
 const expectedIncome = dashboardIncome.filter(i => i.status === 'expected' || i.status === 'delayed').reduce((s,i) => s + i.amount, 0);
 const receivedIncome = dashboardIncome.filter(i => i.status === 'received').reduce((s,i) => s + i.amount, 0);
 const pendingIncome = dashboardIncome.filter(i => i.status === 'expected').reduce((s,i) => s + i.amount, 0);
 const delayedIncome = dashboardIncome.filter(i => i.status === 'delayed').reduce((s,i) => s + i.amount, 0);
 const paidExpenses = dashboardExpenses.filter(e => e.status === 'paid').reduce((s,e) => s + e.amount, 0);
 const plannedExpenses = dashboardExpenses.filter(e => e.status === 'planned').reduce((s,e) => s + e.amount, 0);
 const totalExp = dashboardExpenses.reduce((s,e) => s + e.amount, 0);
 const netReceived = receivedIncome - paidExpenses;
 const expectedNet = expectedIncome - totalExp;
 const availableToAllocate = netReceived > 0 ? netReceived : 0;
 const savingsRate = receivedIncome > 0 ? Math.round((netReceived / receivedIncome) * 100) : 0;
 const allocationTotalPercentage = allRules.reduce((s,r) => s + r.percentage, 0);

 return {
 selectedPeriodTitle: selectedPeriod?.title || 'All Time',
 selectedPeriodType: selectedPeriod?.type || 'all',
 expectedIncome,
 receivedIncome,
 pendingIncome,
 delayedIncome,
 paidExpenses,
 plannedExpenses,
 netReceived,
 expectedNet,
 availableToAllocate,
 savingsRate,
 allocationTotalPercentage,
 };
 }

 function buildSafeArrays() {
 return {
 incomeItems: dashboardIncome.map(i => ({
 title: i.title,
 incomeType: i.incomeType,
 source: i.source,
 expectedAmount: i.amount,
 receivedAmount: i.receivedAmount || 0,
 status: i.status,
 confidence: i.confidence,
 isRecurring: i.isRecurring,
 recurrence: i.recurrence,
 financePeriodTitle: i.financePeriodTitle,
 })),
 expenseItems: dashboardExpenses.map(e => ({
 title: e.title,
 category: e.category,
 amount: e.amount,
 status: e.status,
 financePeriodTitle: e.financePeriodTitle,
 })),
 purchaseGoals: allGoals.map(g => ({
 title: g.title,
 category: g.category,
 targetAmount: g.targetAmount,
 savedAmount: g.savedAmount,
 monthlyContribution: g.monthlyContribution,
 allocationCategory: g.allocationCategory,
 priority: g.priority,
 status: g.status,
 decisionStatus: g.decisionStatus,
 })),
 investmentIdeas: allIdeas.map(i => ({
 title: i.title,
 type: i.type,
 plannedAmount: i.plannedAmount,
 maxAllocation: i.maxAllocation,
 riskLevel: i.riskLevel,
 ethicalStatus: i.ethicalStatus,
 fundingStatus: i.fundingStatus,
 allocationCategory: i.allocationCategory,
 recommendedMonthlyContribution: i.recommendedMonthlyContribution,
 status: i.status,
 })),
 allocationRules: allRules.map(r => ({
 name: r.name,
 category: r.category,
 percentage: r.percentage,
 priority: r.priority,
 isActive: r.isActive,
 })),
 recurringRules: allRecurring.map(r => ({
 title: r.title,
 kind: r.kind,
 category: r.category,
 amount: r.amount,
 frequency: r.frequency,
 isActive: r.isActive,
 confidence: r.confidence,
 })),
 };
 }

 async function callAiAnalysis() {
 setAiLoading(true);
 setAiError(null);
 setAiResult(null);

 const financeSummary = buildFinanceSummary();
 const safeData = buildSafeArrays();

 const payload: Record<string, any> = {
 mode: aiMode,
 financeSummary,
 ...safeData,
 };

 try {
 const res = await fetch('/api/ai?action=finance', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({ action: 'finance', ...payload }),
 });

 const json = await res.json();

 if (!res.ok) {
 if (res.status === 401) {
 setAiError('Authentication required. Please log in again.');
 } else if (json?.code === 'AI_QUOTA_EXCEEDED') {
 setAiError('AI quota exceeded. Try again later or change Gemini model.');
 } else {
 setAiError(json?.error || 'AI Finance Assistant could not generate a review.');
 }
 return;
 }

 if (!json.success || !json.analysis) {
 setAiError('AI Finance Assistant could not generate a review. Try again or review manually.');
 return;
 }

 setAiResult(json.analysis);
 } catch {
 setAiError('AI Finance Assistant could not generate a review. Try again or review manually.');
 } finally {
 setAiLoading(false);
 }
 }

   const showSidebar = tab === 'dashboard';

  return (
  <div>
  <div className="mt-6">
  {tab === 'dashboard' && <div className="mb-6">{renderPeriodSelector()}</div>}

  {tab === 'dashboard' ? (
  <div>
    <h3 className="text-xs font-semibold text-neutral-600 mb-4">Financial Snapshot</h3>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_300px]">
    <div className="space-y-6">
    {renderDashboard()}
    </div>
    {showSidebar && (
    <aside className="space-y-5 self-start hidden xl:block">
    {renderSidebar()}
    </aside>
    )}
    </div>
  </div>
  ) : (
  <div className="space-y-6">
  {tab === 'periods' && renderPeriodsTab()}
  {tab === 'income' && renderIncomeTab()}
  {tab === 'expenses' && renderExpensesTab()}
  {tab === 'allocation' && renderAllocationTab()}
  {tab === 'purchase_goals' && renderPurchaseGoalsTab()}
  {tab === 'investments' && renderInvestmentsTab()}
  {tab === 'recurring' && renderRecurringRulesTab()}
  {tab === 'ai_assistant' && renderAiAssistant()}
  </div>
  )}
  </div>

  {renderModal()}
  </div>
  );
}

export default FinancePanel;
