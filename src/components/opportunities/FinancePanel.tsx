import React, { useState, useMemo } from 'react';
import type { FinanceIncome, FinanceExpense, FinanceAllocationRule, FinancePurchaseGoal, FinanceInvestmentIdea, FinanceInvestmentRule, FinanceInvestmentAllocation, FinancePeriod, FinanceRecurringRule, Project, Company } from '../../types/opportunities';

type FinanceTab = 'dashboard' | 'income' | 'expenses' | 'allocation' | 'purchase_goals' | 'investments' | 'recurring' | 'review' | 'ai_assistant';
type AiMode = 'monthly_review' | 'allocation_review' | 'purchase_review' | 'investment_review' | 'recurring_income_review' | 'next_actions';
type InvestTab = 'overview' | 'ideas' | 'allocation' | 'rules' | 'risk_review' | 'ethical_review';

interface FinancePanelProps {
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

function FinancePanel({
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
  const [aiMode, setAiMode] = useState<AiMode>('monthly_review');
  const [modal, setModal] = useState<{type: FinanceTab; id?: string} | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<any>(null);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>('');
  const [horizonView, setHorizonView] = useState<HorizonView>('monthly');
  const [generateResult, setGenerateResult] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

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

  function matchesPeriod(periodId: string): boolean {
    return selectedPeriodId === periodId;
  }

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
    setFormData({});
    setModal({ type, id });
  }

  function closeModal() {
    setModal(null);
    setFormData({});
  }

  async function handleSave() {
    if (!modal) return;
    const { type, id } = modal;
    try {
      if (type === 'income') {
        if (id) await onUpdateFinanceIncome(id, formData);
        else await onAddFinanceIncome({ ...defaultIncome, ...formData });
      } else if (type === 'expenses') {
        if (id) await onUpdateFinanceExpense(id, formData);
        else await onAddFinanceExpense({ ...defaultExpense, ...formData });
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
      }
      closeModal();
    } catch (e) {
      console.error('Save failed', e);
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
    } catch (e) {
      console.error('Delete failed', e);
    }
  }

  function handleModalChange(field: string, value: any) {
    setFormData(prev => ({ ...prev, [field]: value }));
  }

  function getEditItem(type: FinanceTab): any {
    if (!modal?.id) return null;
    const id = modal.id;
    if (type === 'income') return allIncome.find(i => i.id === id);
    if (type === 'expenses') return allExpenses.find(i => i.id === id);
    if (type === 'allocation') return allRules.find(i => i.id === id);
    if (type === 'purchase_goals') return allGoals.find(i => i.id === id);
    if (type === 'investments') return allIdeas.find(i => i.id === id);
    if (type === 'recurring') return allRecurring.find(i => i.id === id);
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

  function renderIncomeForm(e?: FinanceIncome) {
    const d = e || defaultIncome;
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-2">
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Title</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).title||''} placeholder="Income title" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Type</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.incomeType||'other'} onChange={e=>handleModalChange('incomeType',e.target.value)}>{INCOME_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Source</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.source||'other'} onChange={e=>handleModalChange('source',e.target.value)}>{INCOME_SOURCES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Status</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.status||'expected'} onChange={e=>handleModalChange('status',e.target.value)}>{INCOME_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Amount (MYR)</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="number" defaultValue={d.amount||0} onChange={e=>handleModalChange('amount',Number(e.target.value))} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Currency</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.currency||'MYR'} onChange={e=>handleModalChange('currency',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Recurrence</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.recurrence||'once'} onChange={e=>handleModalChange('recurrence',e.target.value)}>{RECURRENCE_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Income Date</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="date" defaultValue={d.incomeDate||''} onChange={e=>handleModalChange('incomeDate',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Expected Date</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="date" defaultValue={d.expectedDate||''} onChange={e=>handleModalChange('expectedDate',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Received Date</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="date" defaultValue={(d as any).receivedDate||''} onChange={e=>handleModalChange('receivedDate',e.target.value)} /></div>
      <div className="col-span-full"><label className="text-xs text-neutral-500 mb-1 font-medium">Notes</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
      <div className="col-span-full"><label className="text-xs text-neutral-500 mb-1 font-medium">Finance Period</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.financePeriodId||selectedPeriodId||''} onChange={e=>handleModalChange('financePeriodId',e.target.value)}><option value="">-- None --</option>{allPeriods.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
    </div>;
  }

  function renderExpenseForm(e?: FinanceExpense) {
    const d = e || defaultExpense;
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-2">
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Title</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).title||''} placeholder="Expense title" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Category</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.category||'other'} onChange={e=>handleModalChange('category',e.target.value)}>{EXPENSE_CATEGORIES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Status</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.status||'planned'} onChange={e=>handleModalChange('status',e.target.value)}>{EXPENSE_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Amount (MYR)</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="number" defaultValue={d.amount||0} onChange={e=>handleModalChange('amount',Number(e.target.value))} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Currency</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.currency||'MYR'} onChange={e=>handleModalChange('currency',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Expense Date</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="date" defaultValue={d.expenseDate||''} onChange={e=>handleModalChange('expenseDate',e.target.value)} /></div>
      <div className="col-span-full"><label className="text-xs text-neutral-500 mb-1 font-medium">Notes</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
      <div className="col-span-full"><label className="text-xs text-neutral-500 mb-1 font-medium">Finance Period</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.financePeriodId||selectedPeriodId||''} onChange={e=>handleModalChange('financePeriodId',e.target.value)}><option value="">-- None --</option>{allPeriods.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
    </div>;
  }

  function renderAllocationForm(e?: FinanceAllocationRule) {
    const d = e || defaultRule;
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-2">
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Name</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).name||''} onChange={e=>handleModalChange('name',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Category</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.category||'needs'} onChange={e=>handleModalChange('category',e.target.value)}>{ALLOC_CATS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Percentage (%)</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="number" defaultValue={d.percentage||0} onChange={e=>handleModalChange('percentage',Number(e.target.value))} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Priority</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="number" defaultValue={d.priority||0} onChange={e=>handleModalChange('priority',Number(e.target.value))} /></div>
      <div className="col-span-full"><label className="text-xs text-neutral-500 mb-1 font-medium">Notes</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
    </div>;
  }

  function renderGoalForm(e?: FinancePurchaseGoal) {
    const d = e || defaultGoal;
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-2">
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Title</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).title||''} placeholder="What to buy" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Status</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.status||'planned'} onChange={e=>handleModalChange('status',e.target.value)}>{GOAL_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Priority</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.priority||'medium'} onChange={e=>handleModalChange('priority',e.target.value)}>{GOAL_PRIORITIES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Target Amount (MYR)</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="number" defaultValue={d.targetAmount||0} onChange={e=>handleModalChange('targetAmount',Number(e.target.value))} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Saved Amount (MYR)</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="number" defaultValue={d.savedAmount||0} onChange={e=>handleModalChange('savedAmount',Number(e.target.value))} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Currency</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.currency||'MYR'} onChange={e=>handleModalChange('currency',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Target Date</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="date" defaultValue={(d as any).targetDate||''} onChange={e=>handleModalChange('targetDate',e.target.value)} /></div>
      <div className="col-span-full"><label className="text-xs text-neutral-500 mb-1 font-medium">Notes</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
    </div>;
  }

  function renderIdeaForm(e?: FinanceInvestmentIdea) {
    const d = e || defaultIdea;
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-2">
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Title</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).title||''} placeholder="Investment idea" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Type</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.type||'stocks'} onChange={e=>handleModalChange('type',e.target.value)}>{INVESTMENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Risk Level</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.riskLevel||'medium'} onChange={e=>handleModalChange('riskLevel',e.target.value)}>{RISK_LEVELS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Ethical Status</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.ethicalStatus||'good'} onChange={e=>handleModalChange('ethicalStatus',e.target.value)}>{ETHICAL_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Status</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.status||'researching'} onChange={e=>handleModalChange('status',e.target.value)}>{INVESTMENT_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Planned Amount (MYR)</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="number" defaultValue={d.plannedAmount||0} onChange={e=>handleModalChange('plannedAmount',Number(e.target.value))} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Currency</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.currency||'MYR'} onChange={e=>handleModalChange('currency',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Decision</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).decision||'researching'} onChange={e=>handleModalChange('decision',e.target.value)}>{INVEST_DECISION_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div className="col-span-full"><label className="text-xs text-neutral-500 mb-1 font-medium">Notes</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
    </div>;
  }

  function renderAllocForm(e?: FinanceInvestmentAllocation) {
    const d = e || defaultInvAlloc;
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-2">
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Name</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).name||''} onChange={e=>handleModalChange('name',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Category</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.category||'crypto'} onChange={e=>handleModalChange('category',e.target.value)}>{INV_ALLOC_CATS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Percentage (%)</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="number" defaultValue={d.percentage||0} onChange={e=>handleModalChange('percentage',Number(e.target.value))} /></div>
    </div>;
  }

  function renderInvRuleForm(e?: FinanceInvestmentRule) {
    const d = e || defaultInvRule;
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-2">
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Title</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).title||''} placeholder="e.g. No gambling stocks" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Category</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.category||'risk'} onChange={e=>handleModalChange('category',e.target.value)}>{INV_RULE_CATS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
    </div>;
  }

  function renderRecurringForm(e?: FinanceRecurringRule) {
    const d = e || defaultRecurring;
    return <div className="grid grid-cols-[repeat(auto-fill,minmax(200px,1fr))] gap-3 mb-2">
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Title</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).title||''} placeholder="e.g. Salary" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Kind</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.kind||'income'} onChange={e=>handleModalChange('kind',e.target.value)}>{RECURRING_KINDS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Amount (MYR)</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="number" defaultValue={d.amount||0} onChange={e=>handleModalChange('amount',Number(e.target.value))} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Currency</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.currency||'MYR'} onChange={e=>handleModalChange('currency',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Frequency</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.frequency||'monthly'} onChange={e=>handleModalChange('frequency',e.target.value)}>{RECURRING_FREQUENCIES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Confidence</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={d.confidence||'medium'} onChange={e=>handleModalChange('confidence',e.target.value)}>{CONFIDENCE_LEVELS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Start Date</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="date" defaultValue={(d as any).startDate||''} onChange={e=>handleModalChange('startDate',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">End Date</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" type="date" defaultValue={(d as any).endDate||''} onChange={e=>handleModalChange('endDate',e.target.value)} /></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Source</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).source||'other'} onChange={e=>handleModalChange('source',e.target.value)}>{INCOME_SOURCES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label className="text-xs text-neutral-500 mb-1 font-medium">Category</label><select className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).category||'other'} onChange={e=>handleModalChange('category',e.target.value)}>{EXPENSE_CATEGORIES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div className="col-span-full"><label className="text-xs text-neutral-500 mb-1 font-medium">Notes</label><input className="w-full px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
    </div>;
  }

  function renderModal() {
    if (!modal) return null;
    const item = getEditItem(modal.type);
    const title = modal.id ? 'Edit' : 'New';
    return <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[1000]" onClick={closeModal}>
      <div className="bg-white rounded-xl p-6 w-[90%] max-w-[680px] max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
        <h3 className="text-lg font-bold text-black m-0 mb-4">{title} {modal.type.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</h3>
        {modal.type === 'income' && renderIncomeForm(item)}
        {modal.type === 'expenses' && renderExpenseForm(item)}
        {modal.type === 'allocation' && renderAllocationForm(item)}
        {modal.type === 'purchase_goals' && renderGoalForm(item)}
        {modal.type === 'investments' && renderIdeaForm(item)}
        {modal.type === 'recurring' && renderRecurringForm(item)}
        <div className="flex gap-2 justify-end mt-4 pt-3 border-t border-neutral-200">
          <button className="px-2.5 py-1 text-xs font-medium rounded-[5px] border border-neutral-200 bg-white text-neutral-500 cursor-pointer" onClick={closeModal}>Cancel</button>
          <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-blue-600 hover:bg-blue-700" onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>;
  }

  function renderPeriodSelector() {
    return <div className="flex gap-2 items-center flex-wrap">
      <select className="w-auto min-w-[180px] px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" value={selectedPeriodId} onChange={e=>setSelectedPeriodId(e.target.value)}>
        <option value="">-- Select Period --</option>
        {sortedPeriods.map(p => <option key={p.id} value={p.id}>{p.title} ({new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()})</option>)}
      </select>
      <button className="px-2.5 py-1 text-xs font-medium rounded-[5px] border border-neutral-200 bg-white text-neutral-500 cursor-pointer" onClick={() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        onAddFinancePeriod({ title: `${MONTHS[now.getMonth()]} ${y}`, type: 'manual', startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${new Date(y, now.getMonth() + 1, 0).getDate()}`, status: 'open' });
      }}>+ Current Month</button>
      <select className="w-auto min-w-[110px] px-3 py-2 text-sm border border-neutral-200 rounded-md text-black bg-white outline-none" value={horizonView} onChange={e=>setHorizonView(e.target.value as HorizonView)}>
        <option value="monthly">Monthly</option>
        <option value="six_months">6 Months</option>
        <option value="yearly">Yearly</option>
        <option value="five_years">5 Years</option>
        <option value="ten_years">10 Years</option>
      </select>
    </div>;
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
    const netProjected = expectedIncome - totalExpenses;
    const needsTotal = dashboardExpenses.filter(e => e.category === 'needs' || e.category === 'family').reduce((s,e) => s + e.amount, 0);

    return <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-black m-0">Dashboard</h2>
        <div className="text-xs text-neutral-500">{selectedPeriod?.name || 'No period selected — showing all records'}</div>
      </div>
      {selectedPeriodId && <div className="px-4 py-3 rounded-lg text-sm mb-4 bg-blue-50 border border-sky-200 text-sky-700 text-xs">
        Monthly view shows only records linked to this period or dated inside this month. Incomes/expenses from other months are hidden.
      </div>}
      {!selectedPeriodId && <div className="px-4 py-3 rounded-lg text-sm mb-4 bg-amber-50 border border-amber-300 text-amber-800 text-xs">
        Select a period above to focus on a specific month.
      </div>}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3.5 mb-6">
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Expected Income</div><div className="text-2xl font-bold text-black">{toCur(expectedIncome)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Received Income</div><div className="text-2xl font-bold text-black">{toCur(receivedIncome)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Total Expenses</div><div className="text-2xl font-bold text-red-600">{toCur(totalExpenses)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Paid</div><div className="text-2xl font-bold text-emerald-600">{toCur(paidExpenses)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Unpaid / Planned</div><div className="text-2xl font-bold text-orange-600">{toCur(unpaidExpenses + plannedExpenses)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Net Cash (Received - Paid)</div><div className={`text-2xl font-bold ${netCash >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{toCur(netCash)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Net Projected (Expected - All)</div><div className={`text-2xl font-bold ${netProjected >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{toCur(netProjected)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Needs Ratio</div><div className="text-2xl font-bold text-black">{totalExpenses > 0 ? `${Math.round(needsTotal/totalExpenses*100)}%` : '0%'}</div></div>
      </div>
      <div className="mb-4 p-3 bg-orange-50 rounded-lg border border-orange-200 text-xs text-orange-700">
        Variable income (expected/delayed) is estimated; actual net cash may differ.
      </div>
    </div>;
  }

  function renderIncomeTab() {
    const list = filteredFinanceIncome;
    const received = list.filter(i => i.status === 'received').reduce((s,i) => s + i.amount, 0);
    const expected = list.filter(i => i.status === 'expected' || i.status === 'delayed').reduce((s,i) => s + i.amount, 0);
    const badgeColor = (status: string) => status === 'received' ? 'bg-emerald-100 text-emerald-700' : status === 'delayed' ? 'bg-amber-100 text-amber-700' : status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700';
    return <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-black m-0">Income</h2>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-neutral-500">Received: {toCur(received)} | Expected: {toCur(expected)}</span>
          <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-blue-600 hover:bg-blue-700" onClick={()=>openModal('income')}>+ Add</button>
        </div>
      </div>
      {selectedPeriodId && <div className="px-4 py-3 rounded-lg text-sm mb-4 bg-blue-50 border border-sky-200 text-sky-700 text-xs">
        Showing income linked to this period or dated within this month.
      </div>}
      {list.length === 0 ? <div className="text-center py-12 px-6 text-neutral-500 text-sm">No income records for this period.</div> :
        list.map(i => <div key={i.id} className="bg-white border border-neutral-200 rounded-xl p-3.5 mb-2.5">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-semibold text-black mb-1.5">{i.title || i.incomeType} {i.isRecurring && <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">Recurring</span>}</div>
              <div className="text-xs text-neutral-500 leading-relaxed">
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColor(i.status)}`}>{i.status}</span>
                {' '}{i.source} — {i.recurrence}
                {i.incomeDate && <> — Date: {new Date(i.incomeDate).toLocaleDateString()}</>}
                {i.expectedDate && <> — Expected: {new Date(i.expectedDate).toLocaleDateString()}</>}
                {i.receivedDate && <> — Received: {new Date(i.receivedDate).toLocaleDateString()}</>}
                {i.financePeriodId && <> — Period: {allPeriods.find(p=>p.id===i.financePeriodId)?.title || i.financePeriodId}</>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-emerald-600">{toCur(i.amount, i.currency)}</div>
              <div>
                <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>openModal('income', i.id)}>Edit</button>
                <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>handleDelete('income', i.id)}>Del</button>
              </div>
            </div>
          </div>
          {(i as any).notes && <div className="text-xs text-neutral-500 leading-relaxed mt-1.5 pt-1.5 border-t border-neutral-100">{(i as any).notes}</div>}
        </div>)
      }
    </div>;
  }

  function renderExpensesTab() {
    const list = filteredFinanceExpenses;
    const total = list.reduce((s,e) => s + e.amount, 0);
    const badgeColor = (status: string) => status === 'paid' ? 'bg-emerald-100 text-emerald-700' : status === 'unpaid' ? 'bg-red-100 text-red-700' : status === 'cancelled' ? 'bg-orange-100 text-orange-700' : 'bg-amber-100 text-amber-700';
    return <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-black m-0">Expenses</h2>
        <div className="flex gap-2 items-center">
          <span className="text-xs text-neutral-500">Total: {toCur(total)}</span>
          <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-blue-600 hover:bg-blue-700" onClick={()=>openModal('expenses')}>+ Add</button>
        </div>
      </div>
      {selectedPeriodId && <div className="px-4 py-3 rounded-lg text-sm mb-4 bg-blue-50 border border-sky-200 text-sky-700 text-xs">
        Showing expenses linked to this period or dated within this month.
      </div>}
      {list.length === 0 ? <div className="text-center py-12 px-6 text-neutral-500 text-sm">No expenses for this period.</div> :
        list.map(e => <div key={e.id} className="bg-white border border-neutral-200 rounded-xl p-3.5 mb-2.5">
          <div className="flex justify-between items-start">
            <div>
              <div className="text-xs font-semibold text-black mb-1.5">{e.title || e.category}</div>
              <div className="text-xs text-neutral-500 leading-relaxed">
                <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColor(e.status)}`}>{e.status}</span>
                {' '}{e.category}
                {e.expenseDate && <> — Date: {new Date(e.expenseDate).toLocaleDateString()}</>}
                {e.financePeriodId && <> — Period: {allPeriods.find(p=>p.id===e.financePeriodId)?.title || e.financePeriodId}</>}
              </div>
            </div>
            <div className="text-right">
              <div className="text-base font-bold text-red-600">{toCur(e.amount, e.currency)}</div>
              <div>
                <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>openModal('expenses', e.id)}>Edit</button>
                <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>handleDelete('expenses', e.id)}>Del</button>
              </div>
            </div>
          </div>
          {(e as any).notes && <div className="text-xs text-neutral-500 leading-relaxed mt-1.5 pt-1.5 border-t border-neutral-100">{(e as any).notes}</div>}
        </div>)
      }
    </div>;
  }

  function renderAllocationTab() {
    const list = allRules;
    const totalPct = list.reduce((s,r) => s + r.percentage, 0);
    return <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-black m-0">Allocation Rules</h2>
        <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-blue-600 hover:bg-blue-700" onClick={()=>openModal('allocation')}>+ Add</button>
      </div>
      {list.length === 0 ? <div className="text-center py-12 px-6 text-neutral-500 text-sm">No allocation rules. Add rules to distribute income across categories.</div> :
        <div className="grid gap-2.5">
          {list.map(r => <div key={r.id} className="bg-white border border-neutral-200 rounded-xl p-3.5 mb-2.5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-semibold text-black mb-1.5">{r.name || r.category} <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${r.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>{r.isActive ? 'Active' : 'Inactive'}</span></div>
                <div className="text-xs text-neutral-500 leading-relaxed">{r.category} — {r.percentage}% — Priority: {r.priority}</div>
              </div>
              <div>
                <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>openModal('allocation', r.id)}>Edit</button>
                <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>handleDelete('allocation', r.id)}>Del</button>
              </div>
            </div>
          </div>)}
        </div>
      }
      {totalPct > 0 && <div className="mt-3 p-2.5 bg-blue-50 rounded-lg border border-sky-200 text-xs text-sky-700">
        Total allocated: {totalPct}% {totalPct !== 100 && <>({100 - totalPct}% unallocated — will be treated as remainder)</>}
      </div>}
    </div>;
  }

  function renderPurchaseGoalsTab() {
    const list = allGoals;
    const badgeColor = (status: string) => status === 'bought' ? 'bg-emerald-100 text-emerald-700' : status === 'saving' ? 'bg-blue-100 text-blue-700' : status === 'paused' ? 'bg-amber-100 text-amber-700' : status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700';
    const priorityColor = (p: string) => p === 'high' ? 'bg-red-100 text-red-700' : p === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700';
    return <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-black m-0">Purchase Goals</h2>
        <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-blue-600 hover:bg-blue-700" onClick={()=>openModal('purchase_goals')}>+ Add</button>
      </div>
      {list.length === 0 ? <div className="text-center py-12 px-6 text-neutral-500 text-sm">No purchase goals. Track big purchases here.</div> :
        <div className="grid gap-2.5">
          {list.map(g => {
            const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
            const barColor = pct >= 100 ? '#16a34a' : pct >= 50 ? '#2563eb' : pct >= 25 ? '#f59e0b' : '#ef4444';
            return <div key={g.id} className="bg-white border border-neutral-200 rounded-xl p-3.5 mb-2.5">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-xs font-semibold text-black mb-1.5">{g.title || 'Unnamed'} <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${badgeColor(g.status)}`}>{g.status}</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${priorityColor(g.priority)}`}>{g.priority}</span></div>
                  <div className="text-xs text-neutral-500 leading-relaxed">Target: {toCur(g.targetAmount, g.currency)} — Saved: {toCur(g.savedAmount, g.currency)} — {pct}%</div>
                </div>
                <div>
                  <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>openModal('purchase_goals', g.id)}>Edit</button>
                  <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>handleDelete('purchase_goals', g.id)}>Del</button>
                </div>
              </div>
              <div className="h-2 bg-neutral-200 rounded-full overflow-hidden mt-2"><div className="h-full rounded-full transition-all duration-300" style={{width:`${Math.min(100, Math.max(0, pct))}%`, background:barColor}} /></div>
            </div>;
          })}
        </div>
      }
    </div>;
  }

  function renderRecurringRulesTab() {
    return <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <h2 className="text-lg font-bold text-black m-0">Recurring Rules</h2>
        <div className="flex gap-2">
          {selectedPeriodId && <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50" disabled={generating || !selectedPeriodId} onClick={generateRecurringItemsForPeriod}>
            {generating ? 'Generating...' : 'Generate recurring items for this month'}
          </button>}
          <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-blue-600 hover:bg-blue-700" onClick={()=>openModal('recurring')}>+ Add Rule</button>
        </div>
      </div>
      {generateResult && <div className="px-4 py-3 rounded-lg text-sm mb-3 bg-emerald-50 border border-emerald-200 text-emerald-800">{generateResult}</div>}
      {!selectedPeriodId && <div className="px-4 py-3 rounded-lg text-sm bg-amber-50 border border-amber-300 text-amber-800 text-xs">
        Select a Finance Period before generating recurring items.
      </div>}
      {allRecurring.length === 0 ? <div className="text-center py-12 px-6 text-neutral-500 text-sm">No recurring rules. Add rules for regular income/expenses (salary, rent, subscriptions).</div> :
        <div className="grid gap-2.5">
          {allRecurring.map(r => <div key={r.id} className="bg-white border border-neutral-200 rounded-xl p-3.5 mb-2.5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-semibold text-black mb-1.5">
                  {r.title}
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${r.kind === 'income' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>{r.kind}</span>
                  <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${r.isActive ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{r.isActive ? 'Active' : 'Inactive'}</span>
                  <span className="inline-flex px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-700">{r.frequency}</span>
                </div>
                <div className="text-xs text-neutral-500 leading-relaxed">
                  {toCur(r.amount, r.currency)} — Confidence: {r.confidence}
                  {r.startDate && <> — Start: {new Date(r.startDate).toLocaleDateString()}</>}
                  {r.endDate && <> — End: {new Date(r.endDate).toLocaleDateString()}</>}
                  {r.source && <> — Source: {r.source}</>}
                </div>
              </div>
              <div className="text-right">
                <div className={`text-base font-bold ${r.kind === 'income' ? 'text-emerald-600' : 'text-red-600'}`}>{toCur(r.amount, r.currency)}</div>
                <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>openModal('recurring', r.id)}>Edit</button>
                <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>handleDelete('recurring', r.id)}>Del</button>
              </div>
            </div>
            {r.notes && <div className="text-xs text-neutral-500 leading-relaxed mt-1.5 pt-1.5 border-t border-neutral-100">{r.notes}</div>}
          </div>)}
        </div>
      }
    </div>;
  }

  function renderInvestmentsTab() {
    const badgeColor = (c: string) => {
      const map: Record<string,string> = {green:'bg-emerald-100 text-emerald-700',red:'bg-red-100 text-red-700',yellow:'bg-amber-100 text-amber-700',blue:'bg-blue-100 text-blue-700',purple:'bg-purple-100 text-purple-700',orange:'bg-orange-100 text-orange-700'};
      return map[c] || 'bg-neutral-100 text-neutral-700';
    };
    return <div>
      <div className="flex gap-1.5 flex-wrap mb-5 pb-2.5 border-b border-neutral-200">
        {(['overview','ideas','allocation','rules','risk_review','ethical_review'] as InvestTab[]).map(t => <button key={t} className={`px-3.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${investTab === t ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-transparent text-neutral-500 border border-transparent hover:bg-neutral-50'}`} onClick={()=>setInvestTab(t)}>{t.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</button>)}
      </div>
      {investTab === 'overview' && <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h2 className="text-lg font-bold text-black m-0">Investment Overview</h2><button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-blue-600 hover:bg-blue-700" onClick={()=>openModal('investments')}>+ Add Idea</button></div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3.5 mb-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Ideas</div><div className="text-2xl font-bold text-black">{allIdeas.length}</div></div>
          <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Rules</div><div className="text-2xl font-bold text-black">{allInvRules.length}</div></div>
          <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Allocations</div><div className="text-2xl font-bold text-black">{allInvAllocs.length}</div></div>
          <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Invested</div><div className="text-2xl font-bold text-black">{allIdeas.filter(i=>i.status==='invested').length}</div></div>
        </div>
      </div>}
      {investTab === 'ideas' && <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h2 className="text-lg font-bold text-black m-0">Investment Ideas</h2><button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-blue-600 hover:bg-blue-700" onClick={()=>openModal('investments')}>+ Add</button></div>
        {allIdeas.length === 0 ? <div className="text-center py-12 px-6 text-neutral-500 text-sm">No investment ideas.</div> :
          allIdeas.map(i => <div key={i.id} className="bg-white border border-neutral-200 rounded-xl p-3.5 mb-2.5">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xs font-semibold text-black mb-1.5">{i.title || 'Unnamed'} <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${i.type === 'sukuk' ? badgeColor('green') : i.type === 'gold' ? badgeColor('yellow') : i.type === 'real_estate' ? badgeColor('blue') : i.type === 'stocks' ? badgeColor('purple') : i.type === 'business' ? badgeColor('orange') : i.type === 'crypto' ? badgeColor('red') : badgeColor('slate')}`}>{i.type}</span></div>
                <div className="text-xs text-neutral-500 leading-relaxed">
                  Risk: <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${i.riskLevel === 'low' ? badgeColor('green') : i.riskLevel === 'medium' ? badgeColor('yellow') : badgeColor('red')}`}>{i.riskLevel}</span>
                  Ethics: <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${i.ethicalStatus === 'good' ? badgeColor('green') : i.ethicalStatus === 'needs_review' ? badgeColor('yellow') : badgeColor('red')}`}>{i.ethicalStatus}</span>
                  Status: <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${i.status === 'invested' ? badgeColor('green') : i.status === 'planned' ? badgeColor('blue') : i.status === 'waiting' ? badgeColor('yellow') : badgeColor('orange')}`}>{i.status}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-base font-bold text-black">{toCur(i.plannedAmount, i.currency)}</div>
                <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>openModal('investments', i.id)}>Edit</button>
                <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>handleDelete('investments', i.id)}>Del</button>
              </div>
            </div>
          </div>)
        }
      </div>}
      {investTab === 'allocation' && <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h2 className="text-lg font-bold text-black m-0">Investment Allocation</h2><button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-blue-600 hover:bg-blue-700" onClick={()=>openModal('investments')}>+ Add</button></div>
        {allInvAllocs.length === 0 ? <div className="text-center py-12 px-6 text-neutral-500 text-sm">No allocation targets.</div> :
          <div className="grid gap-2.5">
            {allInvAllocs.map(a => <div key={a.id} className="bg-white border border-neutral-200 rounded-xl p-3.5 mb-2.5">
              <div className="flex justify-between">
                <div><div className="text-xs font-semibold text-black mb-1.5">{a.name || a.category}</div><div className="text-xs text-neutral-500 leading-relaxed">Target: {a.percentage}% | Category: {a.category}</div></div>
                <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>handleDelete('investments', a.id)}>Del</button>
              </div>
            </div>)}
          </div>
        }
      </div>}
      {investTab === 'rules' && <div>
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2"><h2 className="text-lg font-bold text-black m-0">Investment Rules</h2><button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-blue-600 hover:bg-blue-700" onClick={()=>openModal('investments')}>+ Add</button></div>
        {allInvRules.length === 0 ? <div className="text-center py-12 px-6 text-neutral-500 text-sm">No investment rules.</div> :
          allInvRules.map(r => <div key={r.id} className="bg-white border border-neutral-200 rounded-xl p-3.5 mb-2.5">
            <div className="text-xs font-semibold text-black mb-1.5">{r.title} <span className={`inline-flex px-2 py-0.5 text-xs font-semibold rounded-full ${r.category === 'risk' ? badgeColor('red') : r.category === 'ethics' ? badgeColor('purple') : r.category === 'strategy' ? badgeColor('blue') : r.category === 'process' ? badgeColor('orange') : badgeColor('slate')}`}>{r.category}</span></div>
            <button className="p-1 text-xs border-none rounded cursor-pointer bg-transparent text-neutral-500" onClick={()=>handleDelete('investments', r.id)}>Del</button>
          </div>)
        }
      </div>}
      {investTab === 'risk_review' && <div>
        <h2 className="text-lg font-bold text-black m-0">Risk Review</h2>
        <div className="text-center py-12 px-6 text-neutral-500 text-sm">Review your investment risk profile here. Coming soon.</div>
      </div>}
      {investTab === 'ethical_review' && <div>
        <h2 className="text-lg font-bold text-black m-0">Ethical Review</h2>
        <div className="text-center py-12 px-6 text-neutral-500 text-sm">Review your investments against ethical rules. Coming soon.</div>
      </div>}
    </div>;
  }

  function renderHorizonSummary() {
    if (horizonView === 'monthly' && selectedPeriodId) {
      const inc = filteredFinanceIncome.reduce((s,i) => s + i.amount, 0);
      const exp = filteredFinanceExpenses.reduce((s,e) => s + e.amount, 0);
      const net = inc - exp;
      return <div className="bg-white border border-neutral-200 rounded-xl p-3.5 mb-4">
        <div className="text-xs text-neutral-500 mb-1 font-medium">Current Period Summary</div>
        <div className={`text-2xl font-bold mt-1 ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{toCur(net)}</div>
        <div className="text-xs text-neutral-500 mt-1">Income: {toCur(inc)} | Expenses: {toCur(exp)} | Items: {filteredFinanceIncome.length + filteredFinanceExpenses.length}</div>
      </div>;
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

    const now = new Date();
    let horizonMonths: number;
    if (horizonView === 'six_months') horizonMonths = 6;
    else if (horizonView === 'yearly') horizonMonths = 12;
    else if (horizonView === 'five_years') horizonMonths = 60;
    else if (horizonView === 'ten_years') horizonMonths = 120;
    else horizonMonths = 1;

    const cutoff = new Date(now.getFullYear(), now.getMonth() - horizonMonths + 1, 1);
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

    return <div>
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 mb-5">
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Total Income</div><div className="text-2xl font-bold text-black">{toCur(totalInc)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Total Expenses</div><div className="text-2xl font-bold text-red-600">{toCur(totalExp)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Avg Monthly Income</div><div className="text-2xl font-bold text-black">{toCur(avgMonthlyInc)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Avg Monthly Expenses</div><div className="text-2xl font-bold text-red-600">{toCur(avgMonthlyExp)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Avg Net/Month</div><div className={`text-2xl font-bold ${avgMonthlyInc - avgMonthlyExp >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{toCur(avgMonthlyInc - avgMonthlyExp)}</div></div>
        <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Months</div><div className="text-2xl font-bold text-black">{filteredMonths.length}</div></div>
      </div>

      {filteredMonths.length > 0 && <div>
        <h3 className="text-lg font-bold text-black m-0 text-[15px] mb-3">Monthly Breakdown</h3>
        <div className="grid gap-1.5">
          {filteredMonths.map(m => {
            const net = m.income - m.expenses;
            return <div key={m.key} className="flex justify-between items-center px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg">
              <div className="text-xs font-semibold text-black min-w-[70px]">{m.key}</div>
              <div className="flex gap-5 text-xs">
                <span className="text-emerald-600">+{toCur(m.income)}</span>
                <span className="text-red-600">-{toCur(m.expenses)}</span>
                <span className={`font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{net >= 0 ? '+' : ''}{toCur(net)}</span>
              </div>
              <div className="text-[11px] text-neutral-400">{m.count} items</div>
            </div>;
          })}
        </div>
      </div>}

      {(horizonView === 'five_years' || horizonView === 'ten_years') && <div className="mt-6">
        <h3 className="text-lg font-bold text-black m-0 text-[15px] mb-3">Yearly Rollup</h3>
        <div className="grid gap-1.5">
          {Object.entries(yearGroups).sort(([a],[b]) => a.localeCompare(b)).map(([year, data]) => {
            const net = data.income - data.expenses;
            return <div key={year} className="flex justify-between items-center px-3.5 py-2.5 bg-white border border-neutral-200 rounded-lg">
              <div className="text-xs font-semibold text-black">{year}</div>
              <div className="flex gap-5 text-xs">
                <span className="text-emerald-600">+{toCur(data.income)}</span>
                <span className="text-red-600">-{toCur(data.expenses)}</span>
                <span className={`font-semibold ${net >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>{net >= 0 ? '+' : ''}{toCur(net)}</span>
              </div>
              <div className="text-[11px] text-neutral-400">{data.months} months</div>
            </div>;
          })}
        </div>
      </div>}

      {horizonView === 'ten_years' && filteredMonths.length === 0 && <div className="text-center py-12 px-6 text-neutral-500 text-sm">
        Not enough data for 10-year projection. Add more income/expense records.
      </div>}
    </div>;
  }

  function renderReviewTab() {
    const needsTotal = allExpenses.filter(e => e.category === 'needs').reduce((s,e) => s + e.amount, 0);
    const familyTotal = allExpenses.filter(e => e.category === 'family').reduce((s,e) => s + e.amount, 0);
    const totalAllExp = allExpenses.reduce((s,e) => s + e.amount, 0);
    const needsPct = totalAllExp > 0 ? Math.round((needsTotal + familyTotal) / totalAllExp * 100) : 0;
    const highPriorityGoals = allGoals.filter(g => g.priority === 'high' && g.status !== 'bought' && g.status !== 'cancelled');
    const gaps: string[] = [];
    if (needsPct > 50) gaps.push(`Needs/family spending is ${needsPct}% of total expenses — consider reducing.`);
    if (highPriorityGoals.length > 0) gaps.push(`You have ${highPriorityGoals.length} high-priority purchase goals not yet completed.`);
    if (allInvRules.length === 0) gaps.push('No investment rules defined — set ethical and risk guidelines.');
    if (allRules.length === 0) gaps.push('No allocation rules — consider setting up income allocation.');
    const activeRecurring = allRecurring.filter(r => r.isActive);
    if (activeRecurring.length === 0) gaps.push('No active recurring rules — add regular income/expenses for better forecasting.');

    return <div>
      <h2 className="text-lg font-bold text-black m-0">Review & Gaps</h2>
      <div className="mt-4">
        <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3.5 mb-6">
          <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Needs Ratio</div><div className="text-2xl font-bold text-black">{needsPct}%</div></div>
          <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Allocation Rules</div><div className="text-2xl font-bold text-black">{allRules.length}</div></div>
          <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Active Recurring</div><div className="text-2xl font-bold text-black">{activeRecurring.length}</div></div>
          <div className="bg-white border border-neutral-200 rounded-xl p-3.5"><div className="text-xs text-neutral-500 mb-1 font-medium">Open Goals</div><div className="text-2xl font-bold text-black">{allGoals.filter(g => g.status !== 'bought' && g.status !== 'cancelled').length}</div></div>
        </div>
        {gaps.length > 0 && <div className="mt-4">
          <h3 className="text-lg font-bold text-black m-0 text-[15px] mb-2">Identified Gaps</h3>
          {gaps.map((g,i) => <div key={i} className="px-3.5 py-2.5 mb-1.5 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800">{g}</div>)}
        </div>}
        {gaps.length === 0 && <div className="p-6 text-center text-neutral-500 text-sm">No major gaps detected.</div>}
      </div>
    </div>;
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

  function renderAiAssistant() {
    const aiModes: AiMode[] = ['monthly_review', 'allocation_review', 'purchase_review', 'investment_review', 'recurring_income_review', 'next_actions'];
    const hasData = dashboardIncome.length > 0 || dashboardExpenses.length > 0;

    return <div>
      <h2 className="text-lg font-bold text-black m-0">AI Finance Assistant</h2>
      <div className="px-4 py-3 rounded-lg text-sm mb-4 bg-blue-50 border border-sky-200 text-sky-700 text-xs">
        AI Finance Assistant provides organization, risk review, and scenario analysis only. It is not financial, legal, tax, or investment advice. Always review AI output manually before acting.
      </div>
      <div className="mt-3 flex gap-2 flex-wrap mb-4">
        {aiModes.map(m => <button key={m} className={`px-3.5 py-1.5 text-xs font-medium rounded-md cursor-pointer ${aiMode === m ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-transparent text-neutral-500 border border-transparent hover:bg-neutral-50'}`} onClick={()=>{setAiMode(m); setAiResult(null); setAiError(null);}}>{m.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</button>)}
      </div>
      <button className="px-4 py-1.5 text-xs font-semibold rounded-md text-white border-none cursor-pointer bg-blue-600 hover:bg-blue-700 disabled:opacity-50" disabled={aiLoading || !hasData} onClick={callAiAnalysis}>
        {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
      </button>
      {!hasData && <div className="px-4 py-3 rounded-lg text-sm bg-amber-50 border border-amber-300 text-amber-800 mt-3 text-xs">
        Add income or expenses before using the AI Assistant.
      </div>}
      {aiError && <div className="px-4 py-3 rounded-lg text-sm bg-red-50 border border-red-200 text-red-800 mt-4">{aiError}</div>}
      {aiLoading && <div className="text-center py-12 px-6 text-neutral-500 text-sm">Generating analysis...</div>}
      {aiResult && <div className="mt-5 flex flex-col gap-3.5">
        {aiResult.summary && <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-xs text-neutral-500 mb-1 font-medium">Summary</div>
          <div className="text-sm text-black mt-1 leading-relaxed">{aiResult.summary}</div>
        </div>}
        {aiResult.incomeAnalysis?.length > 0 && <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-xs text-neutral-500 mb-1 font-medium">Income Analysis</div>
          {aiResult.incomeAnalysis.map((item: string, i: number) => <div key={i} className={`py-1.5 text-xs text-black leading-relaxed ${i<aiResult.incomeAnalysis.length-1?'border-b border-neutral-100':''}`}>{item}</div>)}
        </div>}
        {aiResult.expenseAnalysis?.length > 0 && <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-xs text-neutral-500 mb-1 font-medium">Expense Analysis</div>
          {aiResult.expenseAnalysis.map((item: string, i: number) => <div key={i} className={`py-1.5 text-xs text-black leading-relaxed ${i<aiResult.expenseAnalysis.length-1?'border-b border-neutral-100':''}`}>{item}</div>)}
        </div>}
        {aiResult.allocationReview?.length > 0 && <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-xs text-neutral-500 mb-1 font-medium">Allocation Review</div>
          {aiResult.allocationReview.map((item: string, i: number) => <div key={i} className={`py-1.5 text-xs text-black leading-relaxed ${i<aiResult.allocationReview.length-1?'border-b border-neutral-100':''}`}>{item}</div>)}
        </div>}
        {aiResult.purchaseGoalReview?.length > 0 && <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-xs text-neutral-500 mb-1 font-medium">Purchase Goals</div>
          {aiResult.purchaseGoalReview.map((item: string, i: number) => <div key={i} className={`py-1.5 text-xs text-black leading-relaxed ${i<aiResult.purchaseGoalReview.length-1?'border-b border-neutral-100':''}`}>{item}</div>)}
        </div>}
        {aiResult.investmentRiskReview?.length > 0 && <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-xs text-neutral-500 mb-1 font-medium">Investment Risks</div>
          {aiResult.investmentRiskReview.map((item: string, i: number) => <div key={i} className={`py-1.5 text-xs text-black leading-relaxed ${i<aiResult.investmentRiskReview.length-1?'border-b border-neutral-100':''}`}>{item}</div>)}
        </div>}
        {aiResult.recurringIncomeReview?.length > 0 && <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-xs text-neutral-500 mb-1 font-medium">Recurring Income Review</div>
          {aiResult.recurringIncomeReview.map((item: string, i: number) => <div key={i} className={`py-1.5 text-xs text-black leading-relaxed ${i<aiResult.recurringIncomeReview.length-1?'border-b border-neutral-100':''}`}>{item}</div>)}
        </div>}
        {aiResult.ethicalReviewQuestions?.length > 0 && <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-xs text-neutral-500 mb-1 font-medium">Ethical Review Questions</div>
          {aiResult.ethicalReviewQuestions.map((item: string, i: number) => <div key={i} className={`py-1.5 text-xs text-black leading-relaxed ${i<aiResult.ethicalReviewQuestions.length-1?'border-b border-neutral-100':''}`}>{item}</div>)}
        </div>}
        {aiResult.warnings?.length > 0 && <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-xs text-neutral-500 mb-1 font-medium">Warnings</div>
          {aiResult.warnings.map((item: string, i: number) => <div key={i} className={`py-1.5 text-xs text-red-700 leading-relaxed ${i<aiResult.warnings.length-1?'border-b border-neutral-100':''}`}>{item}</div>)}
        </div>}
        {aiResult.nextActions?.length > 0 && <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
          <div className="text-xs text-neutral-500 mb-1 font-medium">Next Actions</div>
          {aiResult.nextActions.map((item: string, i: number) => <div key={i} className={`py-1.5 text-xs text-black leading-relaxed ${i<aiResult.nextActions.length-1?'border-b border-neutral-100':''}`}>{item}</div>)}
        </div>}
      </div>}
    </div>;
  }

  function renderSidebar() {
    const totalInc = allIncome.reduce((s,i) => s + i.amount, 0);
    const totalExp = allExpenses.reduce((s,e) => s + e.amount, 0);
    const netAll = totalInc - totalExp;
    return <div className="flex flex-col gap-3">
      <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
        <div className="text-xs text-neutral-500 mb-1 font-medium">All-time Totals</div>
        <div className="text-xs mt-1">
          <div className="flex justify-between py-0.5"><span>Income</span><span className="text-emerald-600 font-semibold">{toCur(totalInc)}</span></div>
          <div className="flex justify-between py-0.5"><span>Expenses</span><span className="text-red-600 font-semibold">{toCur(totalExp)}</span></div>
          <div className={`flex justify-between py-0.5 border-t border-neutral-200 mt-1 pt-1 font-bold ${netAll >= 0 ? 'text-emerald-600' : 'text-red-600'}`}><span>Net</span><span>{toCur(netAll)}</span></div>
        </div>
      </div>
      <div className="bg-white border border-neutral-200 rounded-xl p-3.5">
        <div className="text-xs text-neutral-500 mb-1 font-medium">Quick Stats</div>
        <div className="text-xs text-neutral-500 mt-1.5 flex flex-col gap-1">
          <div>{allIncome.length} income records</div>
          <div>{allExpenses.length} expense records</div>
          <div>{allPeriods.length} periods</div>
          <div>{allRecurring.length} recurring rules</div>
          <div>{allGoals.length} purchase goals</div>
          <div>{allIdeas.length} investment ideas</div>
          <div>{allRules.length} allocation rules</div>
        </div>
      </div>
    </div>;
  }

  const tabs: {key: FinanceTab; label: string}[] = [
    {key:'dashboard', label:'Dashboard'},
    {key:'income', label:'Income'},
    {key:'expenses', label:'Expenses'},
    {key:'allocation', label:'Allocation'},
    {key:'purchase_goals', label:'Goals'},
    {key:'investments', label:'Investments'},
    {key:'recurring', label:'Recurring'},
    {key:'review', label:'Review'},
    {key:'ai_assistant', label:'AI'},
  ];

  return <div className="min-h-screen bg-neutral-50">
    <div className="flex gap-6 p-6 max-w-7xl mx-auto items-start">
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex gap-2 items-center flex-wrap">
            {tabs.map(t => <button key={t.key} className={`px-4 py-2 text-sm font-medium rounded-md cursor-pointer ${tab === t.key ? 'bg-blue-50 text-blue-600 border border-blue-200' : 'bg-transparent text-neutral-500 border border-transparent hover:bg-neutral-50'}`} onClick={()=>setTab(t.key)}>{t.label}</button>)}
            <button className="px-2.5 py-1 text-xs font-medium rounded-[5px] border border-neutral-200 bg-white text-neutral-500 cursor-pointer ml-2" onClick={() => { setTab('dashboard'); setSelectedPeriodId(''); }}>Clear Period</button>
          </div>
        </div>
        <div className="mb-4">{renderPeriodSelector()}</div>
        {tab !== 'monthly' && tab !== 'six_months' && tab !== 'yearly' && <div className="mb-4">
          {tab === 'dashboard' && renderDashboard()}
          {tab === 'income' && renderIncomeTab()}
          {tab === 'expenses' && renderExpensesTab()}
          {tab === 'allocation' && renderAllocationTab()}
          {tab === 'purchase_goals' && renderPurchaseGoalsTab()}
          {tab === 'investments' && renderInvestmentsTab()}
          {tab === 'recurring' && renderRecurringRulesTab()}
          {tab === 'review' && renderReviewTab()}
          {tab === 'ai_assistant' && renderAiAssistant()}
        </div>}
        <div className="mt-6">
          <h3 className="text-lg font-bold text-black m-0 text-[15px] mb-3">Horizon View —{' '}
            {horizonView === 'monthly' ? 'Current Month' : horizonView === 'six_months' ? 'Last 6 Months' : horizonView === 'yearly' ? 'Last 12 Months' : horizonView === 'five_years' ? 'Last 5 Years' : 'Last 10 Years'}
          </h3>
          {renderHorizonSummary()}
        </div>
      </div>
      <div className="w-[260px] shrink-0 sticky top-6">
        {renderSidebar()}
      </div>
    </div>
    {renderModal()}
  </div>;
}

export default FinancePanel;
