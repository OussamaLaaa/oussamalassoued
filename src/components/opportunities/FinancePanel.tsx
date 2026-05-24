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

const s = {
  page: { minHeight: '100vh', background: '#f8fafc' },
  layout: { display: 'flex', gap: '24px', padding: '24px', maxWidth: '1280px', margin: '0 auto', alignItems: 'flex-start' as const },
  main: { flex: '1', minWidth: '0' },
  side: { width: '260px', flexShrink: '0' as const, position: 'sticky' as const, top: '24px' },
  nav: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' },
  navBtn: (active: boolean) => ({ padding: '8px 16px', fontSize: '14px', fontWeight: 500 as const, color: active ? '#2563eb' : '#64748b', background: active ? '#eff6ff' : 'transparent', border: active ? '1px solid #bfdbfe' : '1px solid transparent', borderRadius: '6px', cursor: 'pointer' }),
  card: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' },
  sCard: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px' },
  cardT: { fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: 500 as const },
  cardV: { fontSize: '22px', fontWeight: 700 as const, color: '#0f172a' },
  dashGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px', marginBottom: '24px' },
  badge: (c: string) => ({ display: 'inline-flex', padding: '2px 8px', fontSize: '11px', fontWeight: 600 as const, borderRadius: '999px', background: c === 'green' ? '#dcfce7' : c === 'red' ? '#fef2f2' : c === 'yellow' ? '#fef9c3' : c === 'blue' ? '#eff6ff' : c === 'purple' ? '#f3e8ff' : c === 'orange' ? '#fff7ed' : '#f1f5f9', color: c === 'green' ? '#166534' : c === 'red' ? '#991b1b' : c === 'yellow' ? '#854d0e' : c === 'blue' ? '#1d4ed8' : c === 'purple' ? '#6b21a8' : c === 'orange' ? '#c2410c' : '#475569' }),
  input: { width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#0f172a', background: '#ffffff', boxSizing: 'border-box' as const, outline: 'none' as const },
  select: { width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#0f172a', background: '#ffffff', boxSizing: 'border-box' as const, outline: 'none' as const },
  btn: (c: string) => ({ padding: '7px 16px', fontSize: '13px', fontWeight: 600 as const, border: 'none', borderRadius: '6px', cursor: 'pointer', background: c, color: '#ffffff' }),
  btnS: (c: string) => ({ padding: '4px 10px', fontSize: '11px', fontWeight: 600 as const, border: 'none', borderRadius: '5px', cursor: 'pointer', background: c, color: '#ffffff' }),
  btnO: { padding: '5px 10px', fontSize: '12px', fontWeight: 500 as const, border: '1px solid #e5e7eb', borderRadius: '5px', cursor: 'pointer', background: '#ffffff', color: '#64748b' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '8px' },
  fullW: { gridColumn: '1 / -1' as const },
  overlay: { position: 'fixed' as const, inset: '0', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, zIndex: 1000 },
  modal: { background: '#ffffff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '680px', maxHeight: '85vh', overflowY: 'auto' as const },
  act: { display: 'flex', gap: '8px', justifyContent: 'flex-end' as const, marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' },
  bar: (p: number) => ({ height: '8px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' as const }),
  fill: (p: number, c: string) => ({ height: '100%', width: `${Math.min(100, Math.max(0, p))}%`, background: c, borderRadius: '999px', transition: 'width 0.3s' }),
  iBtn: { padding: '4px 8px', fontSize: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent', color: '#64748b' },
  empty: { textAlign: 'center' as const, padding: '48px 24px', color: '#64748b', fontSize: '14px' },
  insCard: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '14px', marginBottom: '10px' },
  insT: { fontSize: '13px', fontWeight: 600 as const, color: '#0f172a', marginBottom: '6px' },
  insX: { fontSize: '12px', color: '#64748b', lineHeight: '1.5' as const },
  hdr: { fontSize: '18px', fontWeight: 700 as const, color: '#0f172a', margin: 0 },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '8px' },
  iNav: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginBottom: '20px', paddingBottom: '10px', borderBottom: '1px solid #e5e7eb' },
  iNavBtn: (a: boolean) => ({ padding: '6px 14px', fontSize: '13px', fontWeight: 500 as const, color: a ? '#2563eb' : '#64748b', background: a ? '#eff6ff' : 'transparent', border: a ? '1px solid #bfdbfe' : '1px solid transparent', borderRadius: '6px', cursor: 'pointer' }),
  warn: { padding: '12px 16px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px' },
};

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
    return <div style={s.formGrid as React.CSSProperties}>
      <div><label style={s.cardT}>Title</label><input style={s.input} defaultValue={(d as any).title||''} placeholder="Income title" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label style={s.cardT}>Type</label><select style={s.select} defaultValue={d.incomeType||'other'} onChange={e=>handleModalChange('incomeType',e.target.value)}>{INCOME_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Source</label><select style={s.select} defaultValue={d.source||'other'} onChange={e=>handleModalChange('source',e.target.value)}>{INCOME_SOURCES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Status</label><select style={s.select} defaultValue={d.status||'expected'} onChange={e=>handleModalChange('status',e.target.value)}>{INCOME_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Amount (MYR)</label><input style={s.input} type="number" defaultValue={d.amount||0} onChange={e=>handleModalChange('amount',Number(e.target.value))} /></div>
      <div><label style={s.cardT}>Currency</label><input style={s.input} defaultValue={d.currency||'MYR'} onChange={e=>handleModalChange('currency',e.target.value)} /></div>
      <div><label style={s.cardT}>Recurrence</label><select style={s.select} defaultValue={d.recurrence||'once'} onChange={e=>handleModalChange('recurrence',e.target.value)}>{RECURRENCE_OPTIONS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Income Date</label><input style={s.input} type="date" defaultValue={d.incomeDate||''} onChange={e=>handleModalChange('incomeDate',e.target.value)} /></div>
      <div><label style={s.cardT}>Expected Date</label><input style={s.input} type="date" defaultValue={d.expectedDate||''} onChange={e=>handleModalChange('expectedDate',e.target.value)} /></div>
      <div><label style={s.cardT}>Received Date</label><input style={s.input} type="date" defaultValue={(d as any).receivedDate||''} onChange={e=>handleModalChange('receivedDate',e.target.value)} /></div>
      <div style={s.fullW as React.CSSProperties}><label style={s.cardT}>Notes</label><input style={s.input} defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
      <div style={s.fullW as React.CSSProperties}><label style={s.cardT}>Finance Period</label><select style={s.select} defaultValue={d.financePeriodId||selectedPeriodId||''} onChange={e=>handleModalChange('financePeriodId',e.target.value)}><option value="">-- None --</option>{allPeriods.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
    </div>;
  }

  function renderExpenseForm(e?: FinanceExpense) {
    const d = e || defaultExpense;
    return <div style={s.formGrid as React.CSSProperties}>
      <div><label style={s.cardT}>Title</label><input style={s.input} defaultValue={(d as any).title||''} placeholder="Expense title" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label style={s.cardT}>Category</label><select style={s.select} defaultValue={d.category||'other'} onChange={e=>handleModalChange('category',e.target.value)}>{EXPENSE_CATEGORIES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Status</label><select style={s.select} defaultValue={d.status||'planned'} onChange={e=>handleModalChange('status',e.target.value)}>{EXPENSE_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Amount (MYR)</label><input style={s.input} type="number" defaultValue={d.amount||0} onChange={e=>handleModalChange('amount',Number(e.target.value))} /></div>
      <div><label style={s.cardT}>Currency</label><input style={s.input} defaultValue={d.currency||'MYR'} onChange={e=>handleModalChange('currency',e.target.value)} /></div>
      <div><label style={s.cardT}>Expense Date</label><input style={s.input} type="date" defaultValue={d.expenseDate||''} onChange={e=>handleModalChange('expenseDate',e.target.value)} /></div>
      <div style={s.fullW as React.CSSProperties}><label style={s.cardT}>Notes</label><input style={s.input} defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
      <div style={s.fullW as React.CSSProperties}><label style={s.cardT}>Finance Period</label><select style={s.select} defaultValue={d.financePeriodId||selectedPeriodId||''} onChange={e=>handleModalChange('financePeriodId',e.target.value)}><option value="">-- None --</option>{allPeriods.map(p=><option key={p.id} value={p.id}>{p.title}</option>)}</select></div>
    </div>;
  }

  function renderAllocationForm(e?: FinanceAllocationRule) {
    const d = e || defaultRule;
    return <div style={s.formGrid as React.CSSProperties}>
      <div><label style={s.cardT}>Name</label><input style={s.input} defaultValue={(d as any).name||''} onChange={e=>handleModalChange('name',e.target.value)} /></div>
      <div><label style={s.cardT}>Category</label><select style={s.select} defaultValue={d.category||'needs'} onChange={e=>handleModalChange('category',e.target.value)}>{ALLOC_CATS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Percentage (%)</label><input style={s.input} type="number" defaultValue={d.percentage||0} onChange={e=>handleModalChange('percentage',Number(e.target.value))} /></div>
      <div><label style={s.cardT}>Priority</label><input style={s.input} type="number" defaultValue={d.priority||0} onChange={e=>handleModalChange('priority',Number(e.target.value))} /></div>
      <div style={s.fullW as React.CSSProperties}><label style={s.cardT}>Notes</label><input style={s.input} defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
    </div>;
  }

  function renderGoalForm(e?: FinancePurchaseGoal) {
    const d = e || defaultGoal;
    return <div style={s.formGrid as React.CSSProperties}>
      <div><label style={s.cardT}>Title</label><input style={s.input} defaultValue={(d as any).title||''} placeholder="What to buy" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label style={s.cardT}>Status</label><select style={s.select} defaultValue={d.status||'planned'} onChange={e=>handleModalChange('status',e.target.value)}>{GOAL_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Priority</label><select style={s.select} defaultValue={d.priority||'medium'} onChange={e=>handleModalChange('priority',e.target.value)}>{GOAL_PRIORITIES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Target Amount (MYR)</label><input style={s.input} type="number" defaultValue={d.targetAmount||0} onChange={e=>handleModalChange('targetAmount',Number(e.target.value))} /></div>
      <div><label style={s.cardT}>Saved Amount (MYR)</label><input style={s.input} type="number" defaultValue={d.savedAmount||0} onChange={e=>handleModalChange('savedAmount',Number(e.target.value))} /></div>
      <div><label style={s.cardT}>Currency</label><input style={s.input} defaultValue={d.currency||'MYR'} onChange={e=>handleModalChange('currency',e.target.value)} /></div>
      <div><label style={s.cardT}>Target Date</label><input style={s.input} type="date" defaultValue={(d as any).targetDate||''} onChange={e=>handleModalChange('targetDate',e.target.value)} /></div>
      <div style={s.fullW as React.CSSProperties}><label style={s.cardT}>Notes</label><input style={s.input} defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
    </div>;
  }

  function renderIdeaForm(e?: FinanceInvestmentIdea) {
    const d = e || defaultIdea;
    return <div style={s.formGrid as React.CSSProperties}>
      <div><label style={s.cardT}>Title</label><input style={s.input} defaultValue={(d as any).title||''} placeholder="Investment idea" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label style={s.cardT}>Type</label><select style={s.select} defaultValue={d.type||'stocks'} onChange={e=>handleModalChange('type',e.target.value)}>{INVESTMENT_TYPES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Risk Level</label><select style={s.select} defaultValue={d.riskLevel||'medium'} onChange={e=>handleModalChange('riskLevel',e.target.value)}>{RISK_LEVELS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Ethical Status</label><select style={s.select} defaultValue={d.ethicalStatus||'good'} onChange={e=>handleModalChange('ethicalStatus',e.target.value)}>{ETHICAL_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Status</label><select style={s.select} defaultValue={d.status||'researching'} onChange={e=>handleModalChange('status',e.target.value)}>{INVESTMENT_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Planned Amount (MYR)</label><input style={s.input} type="number" defaultValue={d.plannedAmount||0} onChange={e=>handleModalChange('plannedAmount',Number(e.target.value))} /></div>
      <div><label style={s.cardT}>Currency</label><input style={s.input} defaultValue={d.currency||'MYR'} onChange={e=>handleModalChange('currency',e.target.value)} /></div>
      <div><label style={s.cardT}>Decision</label><select style={s.select} defaultValue={(d as any).decision||'researching'} onChange={e=>handleModalChange('decision',e.target.value)}>{INVEST_DECISION_STATUSES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div style={s.fullW as React.CSSProperties}><label style={s.cardT}>Notes</label><input style={s.input} defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
    </div>;
  }

  function renderAllocForm(e?: FinanceInvestmentAllocation) {
    const d = e || defaultInvAlloc;
    return <div style={s.formGrid as React.CSSProperties}>
      <div><label style={s.cardT}>Name</label><input style={s.input} defaultValue={(d as any).name||''} onChange={e=>handleModalChange('name',e.target.value)} /></div>
      <div><label style={s.cardT}>Category</label><select style={s.select} defaultValue={d.category||'crypto'} onChange={e=>handleModalChange('category',e.target.value)}>{INV_ALLOC_CATS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Percentage (%)</label><input style={s.input} type="number" defaultValue={d.percentage||0} onChange={e=>handleModalChange('percentage',Number(e.target.value))} /></div>
    </div>;
  }

  function renderInvRuleForm(e?: FinanceInvestmentRule) {
    const d = e || defaultInvRule;
    return <div style={s.formGrid as React.CSSProperties}>
      <div><label style={s.cardT}>Title</label><input style={s.input} defaultValue={(d as any).title||''} placeholder="e.g. No gambling stocks" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label style={s.cardT}>Category</label><select style={s.select} defaultValue={d.category||'risk'} onChange={e=>handleModalChange('category',e.target.value)}>{INV_RULE_CATS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
    </div>;
  }

  function renderRecurringForm(e?: FinanceRecurringRule) {
    const d = e || defaultRecurring;
    return <div style={s.formGrid as React.CSSProperties}>
      <div><label style={s.cardT}>Title</label><input style={s.input} defaultValue={(d as any).title||''} placeholder="e.g. Salary" onChange={e=>handleModalChange('title',e.target.value)} /></div>
      <div><label style={s.cardT}>Kind</label><select style={s.select} defaultValue={d.kind||'income'} onChange={e=>handleModalChange('kind',e.target.value)}>{RECURRING_KINDS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Amount (MYR)</label><input style={s.input} type="number" defaultValue={d.amount||0} onChange={e=>handleModalChange('amount',Number(e.target.value))} /></div>
      <div><label style={s.cardT}>Currency</label><input style={s.input} defaultValue={d.currency||'MYR'} onChange={e=>handleModalChange('currency',e.target.value)} /></div>
      <div><label style={s.cardT}>Frequency</label><select style={s.select} defaultValue={d.frequency||'monthly'} onChange={e=>handleModalChange('frequency',e.target.value)}>{RECURRING_FREQUENCIES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Confidence</label><select style={s.select} defaultValue={d.confidence||'medium'} onChange={e=>handleModalChange('confidence',e.target.value)}>{CONFIDENCE_LEVELS.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Start Date</label><input style={s.input} type="date" defaultValue={(d as any).startDate||''} onChange={e=>handleModalChange('startDate',e.target.value)} /></div>
      <div><label style={s.cardT}>End Date</label><input style={s.input} type="date" defaultValue={(d as any).endDate||''} onChange={e=>handleModalChange('endDate',e.target.value)} /></div>
      <div><label style={s.cardT}>Source</label><select style={s.select} defaultValue={(d as any).source||'other'} onChange={e=>handleModalChange('source',e.target.value)}>{INCOME_SOURCES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div><label style={s.cardT}>Category</label><select style={s.select} defaultValue={(d as any).category||'other'} onChange={e=>handleModalChange('category',e.target.value)}>{EXPENSE_CATEGORIES.map(t=><option key={t} value={t}>{t}</option>)}</select></div>
      <div style={s.fullW as React.CSSProperties}><label style={s.cardT}>Notes</label><input style={s.input} defaultValue={(d as any).notes||''} onChange={e=>handleModalChange('notes',e.target.value)} /></div>
    </div>;
  }

  function renderModal() {
    if (!modal) return null;
    const item = getEditItem(modal.type);
    const title = modal.id ? 'Edit' : 'New';
    return <div style={s.overlay as React.CSSProperties} onClick={closeModal}>
      <div style={s.modal as React.CSSProperties} onClick={e=>e.stopPropagation()}>
        <h3 style={{...s.hdr, marginBottom:'16px'}}>{title} {modal.type.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</h3>
        {modal.type === 'income' && renderIncomeForm(item)}
        {modal.type === 'expenses' && renderExpenseForm(item)}
        {modal.type === 'allocation' && renderAllocationForm(item)}
        {modal.type === 'purchase_goals' && renderGoalForm(item)}
        {modal.type === 'investments' && renderIdeaForm(item)}
        {modal.type === 'recurring' && renderRecurringForm(item)}
        <div style={s.act as React.CSSProperties}>
          <button style={s.btnO} onClick={closeModal}>Cancel</button>
          <button style={s.btn('#2563eb')} onClick={handleSave}>Save</button>
        </div>
      </div>
    </div>;
  }

  function renderPeriodSelector() {
    return <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
      <select style={{...s.select, width:'auto', minWidth:'180px'}} value={selectedPeriodId} onChange={e=>setSelectedPeriodId(e.target.value)}>
        <option value="">-- Select Period --</option>
        {sortedPeriods.map(p => <option key={p.id} value={p.id}>{p.title} ({new Date(p.startDate).toLocaleDateString()} - {new Date(p.endDate).toLocaleDateString()})</option>)}
      </select>
      <button style={s.btnO} onClick={() => {
        const now = new Date();
        const y = now.getFullYear();
        const m = String(now.getMonth() + 1).padStart(2, '0');
        onAddFinancePeriod({ title: `${MONTHS[now.getMonth()]} ${y}`, type: 'manual', startDate: `${y}-${m}-01`, endDate: `${y}-${m}-${new Date(y, now.getMonth() + 1, 0).getDate()}`, status: 'open' });
      }}>+ Current Month</button>
      <select style={{...s.select, width:'auto', minWidth:'110px'}} value={horizonView} onChange={e=>setHorizonView(e.target.value as HorizonView)}>
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
      <div style={s.row as React.CSSProperties}>
        <h2 style={s.hdr}>Dashboard</h2>
        <div style={{fontSize:'12px', color:'#64748b'}}>{selectedPeriod?.name || 'No period selected — showing all records'}</div>
      </div>
      {selectedPeriodId && <div style={{...s.warn, background:'#f0f9ff', border:'1px solid #bae6fd', color:'#0369a1', marginBottom:'16px', fontSize:'13px'}}>
        Monthly view shows only records linked to this period or dated inside this month. Incomes/expenses from other months are hidden.
      </div>}
      {!selectedPeriodId && <div style={{...s.warn, background:'#fef9c3', border:'1px solid #fde047', color:'#854d0e', marginBottom:'16px', fontSize:'13px'}}>
        Select a period above to focus on a specific month.
      </div>}
      <div style={s.dashGrid as React.CSSProperties}>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Expected Income</div><div style={s.cardV}>{toCur(expectedIncome)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Received Income</div><div style={s.cardV}>{toCur(receivedIncome)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Total Expenses</div><div style={{...s.cardV, color:'#dc2626'}}>{toCur(totalExpenses)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Paid</div><div style={{...s.cardV, color:'#16a34a'}}>{toCur(paidExpenses)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Unpaid / Planned</div><div style={{...s.cardV, color:'#ea580c'}}>{toCur(unpaidExpenses + plannedExpenses)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Net Cash (Received - Paid)</div><div style={{...s.cardV, color: netCash >= 0 ? '#16a34a' : '#dc2626'}}>{toCur(netCash)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Net Projected (Expected - All)</div><div style={{...s.cardV, color: netProjected >= 0 ? '#16a34a' : '#dc2626'}}>{toCur(netProjected)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Needs Ratio</div><div style={s.cardV}>{totalExpenses > 0 ? `${Math.round(needsTotal/totalExpenses*100)}%` : '0%'}</div></div>
      </div>
      <div style={{marginBottom:'16px', padding:'12px', background:'#fff7ed', borderRadius:'8px', border:'1px solid #fed7aa', fontSize:'13px', color:'#c2410c'}}>
        Variable income (expected/delayed) is estimated; actual net cash may differ.
      </div>
    </div>;
  }

  function renderIncomeTab() {
    const list = filteredFinanceIncome;
    const received = list.filter(i => i.status === 'received').reduce((s,i) => s + i.amount, 0);
    const expected = list.filter(i => i.status === 'expected' || i.status === 'delayed').reduce((s,i) => s + i.amount, 0);
    return <div>
      <div style={s.row as React.CSSProperties}>
        <h2 style={s.hdr}>Income</h2>
        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
          <span style={{fontSize:'13px', color:'#64748b'}}>Received: {toCur(received)} | Expected: {toCur(expected)}</span>
          <button style={s.btn('#2563eb')} onClick={()=>openModal('income')}>+ Add</button>
        </div>
      </div>
      {selectedPeriodId && <div style={{...s.warn, background:'#f0f9ff', border:'1px solid #bae6fd', color:'#0369a1', marginBottom:'16px', fontSize:'13px'}}>
        Showing income linked to this period or dated within this month.
      </div>}
      {list.length === 0 ? <div style={s.empty as React.CSSProperties}>No income records for this period.</div> :
        list.map(i => <div key={i.id} style={s.insCard as React.CSSProperties}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
            <div>
              <div style={s.insT}>{i.title || i.incomeType} {i.isRecurring && <span style={s.badge('purple')}>Recurring</span>}</div>
              <div style={s.insX}>
                <span style={s.badge(i.status === 'received' ? 'green' : i.status === 'delayed' ? 'yellow' : i.status === 'cancelled' ? 'red' : 'blue')}>{i.status}</span>
                {' '}{i.source} — {i.recurrence}
                {i.incomeDate && <> — Date: {new Date(i.incomeDate).toLocaleDateString()}</>}
                {i.expectedDate && <> — Expected: {new Date(i.expectedDate).toLocaleDateString()}</>}
                {i.receivedDate && <> — Received: {new Date(i.receivedDate).toLocaleDateString()}</>}
                {i.financePeriodId && <> — Period: {allPeriods.find(p=>p.id===i.financePeriodId)?.title || i.financePeriodId}</>}
              </div>
            </div>
            <div style={{textAlign:'right' as const}}>
              <div style={{fontSize:'16px', fontWeight:700, color:'#16a34a'}}>{toCur(i.amount, i.currency)}</div>
              <div>
                <button style={s.iBtn} onClick={()=>openModal('income', i.id)}>Edit</button>
                <button style={s.iBtn} onClick={()=>handleDelete('income', i.id)}>Del</button>
              </div>
            </div>
          </div>
          {(i as any).notes && <div style={{...s.insX, marginTop:'6px', paddingTop:'6px', borderTop:'1px solid #f1f5f9'}}>{(i as any).notes}</div>}
        </div>)
      }
    </div>;
  }

  function renderExpensesTab() {
    const list = filteredFinanceExpenses;
    const total = list.reduce((s,e) => s + e.amount, 0);
    return <div>
      <div style={s.row as React.CSSProperties}>
        <h2 style={s.hdr}>Expenses</h2>
        <div style={{display:'flex', gap:'8px', alignItems:'center'}}>
          <span style={{fontSize:'13px', color:'#64748b'}}>Total: {toCur(total)}</span>
          <button style={s.btn('#2563eb')} onClick={()=>openModal('expenses')}>+ Add</button>
        </div>
      </div>
      {selectedPeriodId && <div style={{...s.warn, background:'#f0f9ff', border:'1px solid #bae6fd', color:'#0369a1', marginBottom:'16px', fontSize:'13px'}}>
        Showing expenses linked to this period or dated within this month.
      </div>}
      {list.length === 0 ? <div style={s.empty as React.CSSProperties}>No expenses for this period.</div> :
        list.map(e => <div key={e.id} style={s.insCard as React.CSSProperties}>
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
            <div>
              <div style={s.insT}>{e.title || e.category}</div>
              <div style={s.insX}>
                <span style={s.badge(e.status === 'paid' ? 'green' : e.status === 'unpaid' ? 'red' : e.status === 'cancelled' ? 'orange' : 'yellow')}>{e.status}</span>
                {' '}{e.category}
                {e.expenseDate && <> — Date: {new Date(e.expenseDate).toLocaleDateString()}</>}
                {e.financePeriodId && <> — Period: {allPeriods.find(p=>p.id===e.financePeriodId)?.title || e.financePeriodId}</>}
              </div>
            </div>
            <div style={{textAlign:'right' as const}}>
              <div style={{fontSize:'16px', fontWeight:700, color:'#dc2626'}}>{toCur(e.amount, e.currency)}</div>
              <div>
                <button style={s.iBtn} onClick={()=>openModal('expenses', e.id)}>Edit</button>
                <button style={s.iBtn} onClick={()=>handleDelete('expenses', e.id)}>Del</button>
              </div>
            </div>
          </div>
          {(e as any).notes && <div style={{...s.insX, marginTop:'6px', paddingTop:'6px', borderTop:'1px solid #f1f5f9'}}>{(e as any).notes}</div>}
        </div>)
      }
    </div>;
  }

  function renderAllocationTab() {
    const list = allRules;
    const totalPct = list.reduce((s,r) => s + r.percentage, 0);
    return <div>
      <div style={s.row as React.CSSProperties}>
        <h2 style={s.hdr}>Allocation Rules</h2>
        <button style={s.btn('#2563eb')} onClick={()=>openModal('allocation')}>+ Add</button>
      </div>
      {list.length === 0 ? <div style={s.empty as React.CSSProperties}>No allocation rules. Add rules to distribute income across categories.</div> :
        <div style={{display:'grid', gap:'10px'}}>
          {list.map(r => <div key={r.id} style={s.insCard as React.CSSProperties}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div>
                <div style={s.insT}>{r.name || r.category} <span style={s.badge(r.isActive ? 'green' : 'orange')}>{r.isActive ? 'Active' : 'Inactive'}</span></div>
                <div style={s.insX}>{r.category} — {r.percentage}% — Priority: {r.priority}</div>
              </div>
              <div>
                <button style={s.iBtn} onClick={()=>openModal('allocation', r.id)}>Edit</button>
                <button style={s.iBtn} onClick={()=>handleDelete('allocation', r.id)}>Del</button>
              </div>
            </div>
          </div>)}
        </div>
      }
      {totalPct > 0 && <div style={{marginTop:'12px', padding:'10px', background:'#f0f9ff', borderRadius:'8px', border:'1px solid #bae6fd', fontSize:'13px', color:'#0369a1'}}>
        Total allocated: {totalPct}% {totalPct !== 100 && <>({100 - totalPct}% unallocated — will be treated as remainder)</>}
      </div>}
    </div>;
  }

  function renderPurchaseGoalsTab() {
    const list = allGoals;
    return <div>
      <div style={s.row as React.CSSProperties}>
        <h2 style={s.hdr}>Purchase Goals</h2>
        <button style={s.btn('#2563eb')} onClick={()=>openModal('purchase_goals')}>+ Add</button>
      </div>
      {list.length === 0 ? <div style={s.empty as React.CSSProperties}>No purchase goals. Track big purchases here.</div> :
        <div style={{display:'grid', gap:'10px'}}>
          {list.map(g => {
            const pct = g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0;
            const barColor = pct >= 100 ? '#16a34a' : pct >= 50 ? '#2563eb' : pct >= 25 ? '#f59e0b' : '#ef4444';
            return <div key={g.id} style={s.insCard as React.CSSProperties}>
              <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
                <div>
                  <div style={s.insT}>{g.title || 'Unnamed'} <span style={s.badge(g.status === 'bought' ? 'green' : g.status === 'saving' ? 'blue' : g.status === 'paused' ? 'yellow' : g.status === 'cancelled' ? 'red' : 'orange')}>{g.status}</span>
                  <span style={s.badge(g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'yellow' : 'blue')}>{g.priority}</span></div>
                  <div style={s.insX}>Target: {toCur(g.targetAmount, g.currency)} — Saved: {toCur(g.savedAmount, g.currency)} — {pct}%</div>
                </div>
                <div>
                  <button style={s.iBtn} onClick={()=>openModal('purchase_goals', g.id)}>Edit</button>
                  <button style={s.iBtn} onClick={()=>handleDelete('purchase_goals', g.id)}>Del</button>
                </div>
              </div>
              <div style={{...s.bar(0), marginTop:'8px'}}><div style={s.fill(pct, barColor)} /></div>
            </div>;
          })}
        </div>
      }
    </div>;
  }

  function renderRecurringRulesTab() {
    return <div>
      <div style={s.row as React.CSSProperties}>
        <h2 style={s.hdr}>Recurring Rules</h2>
        <div style={{display:'flex', gap:'8px'}}>
          {selectedPeriodId && <button style={s.btn('#059669')} disabled={generating || !selectedPeriodId} onClick={generateRecurringItemsForPeriod}>
            {generating ? 'Generating...' : 'Generate recurring items for this month'}
          </button>}
          <button style={s.btn('#2563eb')} onClick={()=>openModal('recurring')}>+ Add Rule</button>
        </div>
      </div>
      {generateResult && <div style={{...s.warn, background:'#f0fdf4', border:'1px solid #bbf7d0', color:'#166534', marginBottom:'12px'}}>{generateResult}</div>}
      {!selectedPeriodId && <div style={{...s.warn, background:'#fef9c3', border:'1px solid #fde047', color:'#854d0e', fontSize:'13px'}}>
        Select a Finance Period before generating recurring items.
      </div>}
      {allRecurring.length === 0 ? <div style={s.empty as React.CSSProperties}>No recurring rules. Add rules for regular income/expenses (salary, rent, subscriptions).</div> :
        <div style={{display:'grid', gap:'10px'}}>
          {allRecurring.map(r => <div key={r.id} style={s.insCard as React.CSSProperties}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div>
                <div style={s.insT}>
                  {r.title}
                  <span style={s.badge(r.kind === 'income' ? 'green' : 'red')}>{r.kind}</span>
                  <span style={s.badge(r.isActive ? 'blue' : 'orange')}>{r.isActive ? 'Active' : 'Inactive'}</span>
                  <span style={s.badge('purple')}>{r.frequency}</span>
                </div>
                <div style={s.insX}>
                  {toCur(r.amount, r.currency)} — Confidence: {r.confidence}
                  {r.startDate && <> — Start: {new Date(r.startDate).toLocaleDateString()}</>}
                  {r.endDate && <> — End: {new Date(r.endDate).toLocaleDateString()}</>}
                  {r.source && <> — Source: {r.source}</>}
                </div>
              </div>
              <div style={{textAlign:'right' as const}}>
                <div style={{fontSize:'16px', fontWeight:700, color: r.kind === 'income' ? '#16a34a' : '#dc2626'}}>{toCur(r.amount, r.currency)}</div>
                <button style={s.iBtn} onClick={()=>openModal('recurring', r.id)}>Edit</button>
                <button style={s.iBtn} onClick={()=>handleDelete('recurring', r.id)}>Del</button>
              </div>
            </div>
            {r.notes && <div style={{...s.insX, marginTop:'6px', paddingTop:'6px', borderTop:'1px solid #f1f5f9'}}>{r.notes}</div>}
          </div>)}
        </div>
      }
    </div>;
  }

  function renderInvestmentsTab() {
    return <div>
      <div style={s.iNav as React.CSSProperties}>
        {(['overview','ideas','allocation','rules','risk_review','ethical_review'] as InvestTab[]).map(t => <button key={t} style={s.iNavBtn(investTab === t)} onClick={()=>setInvestTab(t)}>{t.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}</button>)}
      </div>
      {investTab === 'overview' && <div>
        <div style={s.row as React.CSSProperties}><h2 style={s.hdr}>Investment Overview</h2><button style={s.btn('#2563eb')} onClick={()=>openModal('investments')}>+ Add Idea</button></div>
        <div style={s.dashGrid as React.CSSProperties}>
          <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Ideas</div><div style={s.cardV}>{allIdeas.length}</div></div>
          <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Rules</div><div style={s.cardV}>{allInvRules.length}</div></div>
          <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Allocations</div><div style={s.cardV}>{allInvAllocs.length}</div></div>
          <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Invested</div><div style={s.cardV}>{allIdeas.filter(i=>i.status==='invested').length}</div></div>
        </div>
      </div>}
      {investTab === 'ideas' && <div>
        <div style={s.row as React.CSSProperties}><h2 style={s.hdr}>Investment Ideas</h2><button style={s.btn('#2563eb')} onClick={()=>openModal('investments')}>+ Add</button></div>
        {allIdeas.length === 0 ? <div style={s.empty as React.CSSProperties}>No investment ideas.</div> :
          allIdeas.map(i => <div key={i.id} style={s.insCard as React.CSSProperties}>
            <div style={{display:'flex', justifyContent:'space-between', alignItems:'flex-start'}}>
              <div>
                <div style={s.insT}>{i.title || 'Unnamed'} <span style={s.badge(i.type === 'sukuk' ? 'green' : i.type === 'gold' ? 'yellow' : i.type === 'real_estate' ? 'blue' : i.type === 'stocks' ? 'purple' : i.type === 'business' ? 'orange' : i.type === 'crypto' ? 'red' : 'slate')}>{i.type}</span></div>
                <div style={s.insX}>
                  Risk: <span style={s.badge(i.riskLevel === 'low' ? 'green' : i.riskLevel === 'medium' ? 'yellow' : 'red')}>{i.riskLevel}</span>
                  Ethics: <span style={s.badge(i.ethicalStatus === 'good' ? 'green' : i.ethicalStatus === 'needs_review' ? 'yellow' : 'red')}>{i.ethicalStatus}</span>
                  Status: <span style={s.badge(i.status === 'invested' ? 'green' : i.status === 'planned' ? 'blue' : i.status === 'waiting' ? 'yellow' : 'orange')}>{i.status}</span>
                </div>
              </div>
              <div style={{textAlign:'right' as const}}>
                <div style={{fontSize:'16px', fontWeight:700}}>{toCur(i.plannedAmount, i.currency)}</div>
                <button style={s.iBtn} onClick={()=>openModal('investments', i.id)}>Edit</button>
                <button style={s.iBtn} onClick={()=>handleDelete('investments', i.id)}>Del</button>
              </div>
            </div>
          </div>)
        }
      </div>}
      {investTab === 'allocation' && <div>
        <div style={s.row as React.CSSProperties}><h2 style={s.hdr}>Investment Allocation</h2><button style={s.btn('#2563eb')} onClick={()=>openModal('investments')}>+ Add</button></div>
        {allInvAllocs.length === 0 ? <div style={s.empty as React.CSSProperties}>No allocation targets.</div> :
          <div style={{display:'grid', gap:'10px'}}>
            {allInvAllocs.map(a => <div key={a.id} style={s.insCard as React.CSSProperties}>
              <div style={{display:'flex', justifyContent:'space-between'}}>
                <div><div style={s.insT}>{a.name || a.category}</div><div style={s.insX}>Target: {a.percentage}% | Category: {a.category}</div></div>
                <button style={s.iBtn} onClick={()=>handleDelete('investments', a.id)}>Del</button>
              </div>
            </div>)}
          </div>
        }
      </div>}
      {investTab === 'rules' && <div>
        <div style={s.row as React.CSSProperties}><h2 style={s.hdr}>Investment Rules</h2><button style={s.btn('#2563eb')} onClick={()=>openModal('investments')}>+ Add</button></div>
        {allInvRules.length === 0 ? <div style={s.empty as React.CSSProperties}>No investment rules.</div> :
          allInvRules.map(r => <div key={r.id} style={s.insCard as React.CSSProperties}>
            <div style={s.insT}>{r.title} <span style={s.badge(r.category === 'risk' ? 'red' : r.category === 'ethics' ? 'purple' : r.category === 'strategy' ? 'blue' : r.category === 'process' ? 'orange' : 'slate')}>{r.category}</span></div>
            <button style={s.iBtn} onClick={()=>handleDelete('investments', r.id)}>Del</button>
          </div>)
        }
      </div>}
      {investTab === 'risk_review' && <div>
        <h2 style={s.hdr}>Risk Review</h2>
        <div style={s.empty as React.CSSProperties}>Review your investment risk profile here. Coming soon.</div>
      </div>}
      {investTab === 'ethical_review' && <div>
        <h2 style={s.hdr}>Ethical Review</h2>
        <div style={s.empty as React.CSSProperties}>Review your investments against ethical rules. Coming soon.</div>
      </div>}
    </div>;
  }

  function renderHorizonSummary() {
    if (horizonView === 'monthly' && selectedPeriodId) {
      const inc = filteredFinanceIncome.reduce((s,i) => s + i.amount, 0);
      const exp = filteredFinanceExpenses.reduce((s,e) => s + e.amount, 0);
      const net = inc - exp;
      return <div style={{...s.sCard, marginBottom:'16px'}}>
        <div style={s.cardT}>Current Period Summary</div>
        <div style={{fontSize:'24px', fontWeight:700, color: net >= 0 ? '#16a34a' : '#dc2626', marginTop:'4px'}}>{toCur(net)}</div>
        <div style={{fontSize:'12px', color:'#64748b', marginTop:'4px'}}>Income: {toCur(inc)} | Expenses: {toCur(exp)} | Items: {filteredFinanceIncome.length + filteredFinanceExpenses.length}</div>
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
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(150px, 1fr))', gap:'12px', marginBottom:'20px'}}>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Total Income</div><div style={s.cardV}>{toCur(totalInc)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Total Expenses</div><div style={{...s.cardV, color:'#dc2626'}}>{toCur(totalExp)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Avg Monthly Income</div><div style={s.cardV}>{toCur(avgMonthlyInc)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Avg Monthly Expenses</div><div style={{...s.cardV, color:'#dc2626'}}>{toCur(avgMonthlyExp)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Avg Net/Month</div><div style={{...s.cardV, color: avgMonthlyInc - avgMonthlyExp >= 0 ? '#16a34a' : '#dc2626'}}>{toCur(avgMonthlyInc - avgMonthlyExp)}</div></div>
        <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Months</div><div style={s.cardV}>{filteredMonths.length}</div></div>
      </div>

      {filteredMonths.length > 0 && <div>
        <h3 style={{...s.hdr, fontSize:'15px', marginBottom:'12px'}}>Monthly Breakdown</h3>
        <div style={{display:'grid', gap:'6px'}}>
          {filteredMonths.map(m => {
            const net = m.income - m.expenses;
            return <div key={m.key} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'8px'}}>
              <div style={{fontSize:'13px', fontWeight:600, color:'#0f172a', minWidth:'70px'}}>{m.key}</div>
              <div style={{display:'flex', gap:'20px', fontSize:'13px'}}>
                <span style={{color:'#16a34a'}}>+{toCur(m.income)}</span>
                <span style={{color:'#dc2626'}}>-{toCur(m.expenses)}</span>
                <span style={{fontWeight:600, color: net >= 0 ? '#16a34a' : '#dc2626'}}>{net >= 0 ? '+' : ''}{toCur(net)}</span>
              </div>
              <div style={{fontSize:'11px', color:'#94a3b8'}}>{m.count} items</div>
            </div>;
          })}
        </div>
      </div>}

      {(horizonView === 'five_years' || horizonView === 'ten_years') && <div style={{marginTop:'24px'}}>
        <h3 style={{...s.hdr, fontSize:'15px', marginBottom:'12px'}}>Yearly Rollup</h3>
        <div style={{display:'grid', gap:'6px'}}>
          {Object.entries(yearGroups).sort(([a],[b]) => a.localeCompare(b)).map(([year, data]) => {
            const net = data.income - data.expenses;
            return <div key={year} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', background:'#ffffff', border:'1px solid #e5e7eb', borderRadius:'8px'}}>
              <div style={{fontSize:'13px', fontWeight:600, color:'#0f172a'}}>{year}</div>
              <div style={{display:'flex', gap:'20px', fontSize:'13px'}}>
                <span style={{color:'#16a34a'}}>+{toCur(data.income)}</span>
                <span style={{color:'#dc2626'}}>-{toCur(data.expenses)}</span>
                <span style={{fontWeight:600, color: net >= 0 ? '#16a34a' : '#dc2626'}}>{net >= 0 ? '+' : ''}{toCur(net)}</span>
              </div>
              <div style={{fontSize:'11px', color:'#94a3b8'}}>{data.months} months</div>
            </div>;
          })}
        </div>
      </div>}

      {horizonView === 'ten_years' && filteredMonths.length === 0 && <div style={s.empty as React.CSSProperties}>
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
      <h2 style={s.hdr}>Review & Gaps</h2>
      <div style={{marginTop:'16px'}}>
        <div style={s.dashGrid as React.CSSProperties}>
          <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Needs Ratio</div><div style={s.cardV}>{needsPct}%</div></div>
          <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Allocation Rules</div><div style={s.cardV}>{allRules.length}</div></div>
          <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Active Recurring</div><div style={s.cardV}>{activeRecurring.length}</div></div>
          <div style={s.sCard as React.CSSProperties}><div style={s.cardT}>Open Goals</div><div style={s.cardV}>{allGoals.filter(g => g.status !== 'bought' && g.status !== 'cancelled').length}</div></div>
        </div>
        {gaps.length > 0 && <div style={{marginTop:'16px'}}>
          <h3 style={{...s.hdr, fontSize:'15px', marginBottom:'8px'}}>Identified Gaps</h3>
          {gaps.map((g,i) => <div key={i} style={{padding:'10px 14px', marginBottom:'6px', background:'#fef9c3', border:'1px solid #fde047', borderRadius:'8px', fontSize:'13px', color:'#854d0e'}}>{g}</div>)}
        </div>}
        {gaps.length === 0 && <div style={{padding:'24px', textAlign:'center', color:'#64748b', fontSize:'14px'}}>No major gaps detected.</div>}
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
      <h2 style={s.hdr}>AI Finance Assistant</h2>
      <div style={{...s.warn, background:'#f0f9ff', border:'1px solid #bae6fd', color:'#0369a1', marginBottom:'16px', fontSize:'12px'}}>
        AI Finance Assistant provides organization, risk review, and scenario analysis only. It is not financial, legal, tax, or investment advice. Always review AI output manually before acting.
      </div>
      <div style={{marginTop:'12px', display:'flex', gap:'8px', flexWrap:'wrap', marginBottom:'16px'}}>
        {aiModes.map(m => <button key={m} style={s.iNavBtn(aiMode === m)} onClick={()=>{setAiMode(m); setAiResult(null); setAiError(null);}}>{m.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</button>)}
      </div>
      <button style={s.btn('#2563eb')} disabled={aiLoading || !hasData} onClick={callAiAnalysis}>
        {aiLoading ? 'Analyzing...' : 'Analyze with AI'}
      </button>
      {!hasData && <div style={{...s.warn, background:'#fef9c3', border:'1px solid #fde047', color:'#854d0e', marginTop:'12px', fontSize:'13px'}}>
        Add income or expenses before using the AI Assistant.
      </div>}
      {aiError && <div style={{...s.warn, background:'#fef2f2', border:'1px solid #fecaca', color:'#991b1b', marginTop:'16px'}}>{aiError}</div>}
      {aiLoading && <div style={s.empty as React.CSSProperties}>Generating analysis...</div>}
      {aiResult && <div style={{marginTop:'20px', display:'flex', flexDirection:'column', gap:'14px'}}>
        {aiResult.summary && <div style={s.sCard as React.CSSProperties}>
          <div style={s.cardT}>Summary</div>
          <div style={{fontSize:'14px', color:'#0f172a', marginTop:'4px', lineHeight:'1.5'}}>{aiResult.summary}</div>
        </div>}
        {aiResult.incomeAnalysis?.length > 0 && <div style={s.sCard as React.CSSProperties}>
          <div style={s.cardT}>Income Analysis</div>
          {aiResult.incomeAnalysis.map((item: string, i: number) => <div key={i} style={{padding:'6px 0', fontSize:'13px', color:'#0f172a', borderBottom:i<aiResult.incomeAnalysis.length-1?'1px solid #f1f5f9':'none', lineHeight:'1.4'}}>{item}</div>)}
        </div>}
        {aiResult.expenseAnalysis?.length > 0 && <div style={s.sCard as React.CSSProperties}>
          <div style={s.cardT}>Expense Analysis</div>
          {aiResult.expenseAnalysis.map((item: string, i: number) => <div key={i} style={{padding:'6px 0', fontSize:'13px', color:'#0f172a', borderBottom:i<aiResult.expenseAnalysis.length-1?'1px solid #f1f5f9':'none', lineHeight:'1.4'}}>{item}</div>)}
        </div>}
        {aiResult.allocationReview?.length > 0 && <div style={s.sCard as React.CSSProperties}>
          <div style={s.cardT}>Allocation Review</div>
          {aiResult.allocationReview.map((item: string, i: number) => <div key={i} style={{padding:'6px 0', fontSize:'13px', color:'#0f172a', borderBottom:i<aiResult.allocationReview.length-1?'1px solid #f1f5f9':'none', lineHeight:'1.4'}}>{item}</div>)}
        </div>}
        {aiResult.purchaseGoalReview?.length > 0 && <div style={s.sCard as React.CSSProperties}>
          <div style={s.cardT}>Purchase Goals</div>
          {aiResult.purchaseGoalReview.map((item: string, i: number) => <div key={i} style={{padding:'6px 0', fontSize:'13px', color:'#0f172a', borderBottom:i<aiResult.purchaseGoalReview.length-1?'1px solid #f1f5f9':'none', lineHeight:'1.4'}}>{item}</div>)}
        </div>}
        {aiResult.investmentRiskReview?.length > 0 && <div style={s.sCard as React.CSSProperties}>
          <div style={s.cardT}>Investment Risks</div>
          {aiResult.investmentRiskReview.map((item: string, i: number) => <div key={i} style={{padding:'6px 0', fontSize:'13px', color:'#0f172a', borderBottom:i<aiResult.investmentRiskReview.length-1?'1px solid #f1f5f9':'none', lineHeight:'1.4'}}>{item}</div>)}
        </div>}
        {aiResult.recurringIncomeReview?.length > 0 && <div style={s.sCard as React.CSSProperties}>
          <div style={s.cardT}>Recurring Income Review</div>
          {aiResult.recurringIncomeReview.map((item: string, i: number) => <div key={i} style={{padding:'6px 0', fontSize:'13px', color:'#0f172a', borderBottom:i<aiResult.recurringIncomeReview.length-1?'1px solid #f1f5f9':'none', lineHeight:'1.4'}}>{item}</div>)}
        </div>}
        {aiResult.ethicalReviewQuestions?.length > 0 && <div style={s.sCard as React.CSSProperties}>
          <div style={s.cardT}>Ethical Review Questions</div>
          {aiResult.ethicalReviewQuestions.map((item: string, i: number) => <div key={i} style={{padding:'6px 0', fontSize:'13px', color:'#0f172a', borderBottom:i<aiResult.ethicalReviewQuestions.length-1?'1px solid #f1f5f9':'none', lineHeight:'1.4'}}>{item}</div>)}
        </div>}
        {aiResult.warnings?.length > 0 && <div style={s.sCard as React.CSSProperties}>
          <div style={s.cardT}>Warnings</div>
          {aiResult.warnings.map((item: string, i: number) => <div key={i} style={{padding:'6px 0', fontSize:'13px', color:'#991b1b', borderBottom:i<aiResult.warnings.length-1?'1px solid #f1f5f9':'none', lineHeight:'1.4'}}>{item}</div>)}
        </div>}
        {aiResult.nextActions?.length > 0 && <div style={s.sCard as React.CSSProperties}>
          <div style={s.cardT}>Next Actions</div>
          {aiResult.nextActions.map((item: string, i: number) => <div key={i} style={{padding:'6px 0', fontSize:'13px', color:'#0f172a', borderBottom:i<aiResult.nextActions.length-1?'1px solid #f1f5f9':'none', lineHeight:'1.4'}}>{item}</div>)}
        </div>}
      </div>}
    </div>;
  }

  function renderSidebar() {
    const totalInc = allIncome.reduce((s,i) => s + i.amount, 0);
    const totalExp = allExpenses.reduce((s,e) => s + e.amount, 0);
    const netAll = totalInc - totalExp;
    return <div style={{display:'flex', flexDirection:'column', gap:'12px'}}>
      <div style={s.sCard as React.CSSProperties}>
        <div style={s.cardT}>All-time Totals</div>
        <div style={{fontSize:'13px', marginTop:'4px'}}>
          <div style={{display:'flex', justifyContent:'space-between', padding:'2px 0'}}><span>Income</span><span style={{color:'#16a34a', fontWeight:600}}>{toCur(totalInc)}</span></div>
          <div style={{display:'flex', justifyContent:'space-between', padding:'2px 0'}}><span>Expenses</span><span style={{color:'#dc2626', fontWeight:600}}>{toCur(totalExp)}</span></div>
          <div style={{display:'flex', justifyContent:'space-between', padding:'2px 0', borderTop:'1px solid #e5e7eb', marginTop:'4px', paddingTop:'4px', fontWeight:700, color: netAll >= 0 ? '#16a34a' : '#dc2626'}}><span>Net</span><span>{toCur(netAll)}</span></div>
        </div>
      </div>
      <div style={s.sCard as React.CSSProperties}>
        <div style={s.cardT}>Quick Stats</div>
        <div style={{fontSize:'12px', color:'#64748b', marginTop:'6px', display:'flex', flexDirection:'column', gap:'4px'}}>
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

  return <div style={s.page as React.CSSProperties}>
    <div style={s.layout as React.CSSProperties}>
      <div style={s.main as React.CSSProperties}>
        <div style={s.row as React.CSSProperties}>
          <div style={{display:'flex', gap:'8px', alignItems:'center', flexWrap:'wrap'}}>
            {tabs.map(t => <button key={t.key} style={s.navBtn(tab === t.key)} onClick={()=>setTab(t.key)}>{t.label}</button>)}
            <button style={{...s.btnO, marginLeft:'8px'}} onClick={() => { setTab('dashboard'); setSelectedPeriodId(''); }}>Clear Period</button>
          </div>
        </div>
        <div style={{marginBottom:'16px'}}>{renderPeriodSelector()}</div>
        {tab !== 'monthly' && tab !== 'six_months' && tab !== 'yearly' && <div style={{marginBottom:'16px'}}>
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
        <div style={{marginTop:'24px'}}>
          <h3 style={{...s.hdr, fontSize:'15px', marginBottom:'12px'}}>Horizon View —{' '}
            {horizonView === 'monthly' ? 'Current Month' : horizonView === 'six_months' ? 'Last 6 Months' : horizonView === 'yearly' ? 'Last 12 Months' : horizonView === 'five_years' ? 'Last 5 Years' : 'Last 10 Years'}
          </h3>
          {renderHorizonSummary()}
        </div>
      </div>
      <div style={s.side as React.CSSProperties}>
        {renderSidebar()}
      </div>
    </div>
    {renderModal()}
  </div>;
}

export default FinancePanel;
