import React, { useState, useMemo } from 'react';
import type { FinanceIncome, FinanceExpense, FinanceAllocationRule, FinancePurchaseGoal, FinanceInvestmentIdea, FinanceInvestmentRule, FinanceInvestmentAllocation, Project, Company } from '../../types/opportunities';

type FinanceTab = 'dashboard' | 'income' | 'expenses' | 'allocation' | 'purchase_goals' | 'investments' | 'review';
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

const INCOME_SOURCES = ['salary', 'freelance', 'project', 'bonus', 'other'];
const INCOME_STATUSES = ['expected', 'received', 'delayed', 'cancelled'];
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
const INV_RULE_CATS = ['risk', 'ethics', 'strategy', 'process', 'other'];
const INV_ALLOC_CATS = ['equity', 'sukuk', 'real_estate', 'gold', 'cash', 'crypto', 'other'];
const INV_HORIZONS = ['short_term', 'medium_term', 'long_term'];

export default function FinancePanel({
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
}: FinancePanelProps) {
  const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');
  const [iTab, setITab] = useState<InvestTab>('overview');
  const [modal, setModal] = useState<{ type: string; editing?: any } | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [addSavedGoalId, setAddSavedGoalId] = useState<string | null>(null);
  const [addSavedAmount, setAddSavedAmount] = useState('');

  const activeAlloc = useMemo(() => financeAllocationRules.filter((r) => r.isActive), [financeAllocationRules]);
  const totalAllocPct = useMemo(() => activeAlloc.reduce((s, r) => s + r.percentage, 0), [activeAlloc]);
  const mIncome = useMemo(() => financeIncome.filter((i) => i.status === 'received' && isCM(i.incomeDate)), [financeIncome]);
  const mExpenses = useMemo(() => financeExpenses.filter((e) => e.status === 'paid' && isCM(e.expenseDate)), [financeExpenses]);
  const tIncome = useMemo(() => mIncome.reduce((s, i) => s + i.amount, 0), [mIncome]);
  const tExpenses = useMemo(() => mExpenses.reduce((s, e) => s + e.amount, 0), [mExpenses]);
  const net = tIncome - tExpenses;
  const sRate = tIncome > 0 ? (net / tIncome) * 100 : 0;
  const aGoals = useMemo(() => financePurchaseGoals.filter((g) => g.status === 'saving' || g.status === 'planned'), [financePurchaseGoals]);
  const tGT = useMemo(() => financePurchaseGoals.reduce((s, g) => s + g.targetAmount, 0), [financePurchaseGoals]);
  const tGS = useMemo(() => financePurchaseGoals.reduce((s, g) => s + g.savedAmount, 0), [financePurchaseGoals]);
  const iUR = useMemo(() => financeInvestmentIdeas.filter((i) => i.ethicalStatus === 'needs_review'), [financeInvestmentIdeas]);
  const eWarn = useMemo(() => financeInvestmentIdeas.filter((i) => i.ethicalStatus === 'needs_review' || i.ethicalStatus === 'avoid'), [financeInvestmentIdeas]);
  const iResearching = useMemo(() => financeInvestmentIdeas.filter((i) => i.status === 'researching'), [financeInvestmentIdeas]);
  const iPlanned = useMemo(() => financeInvestmentIdeas.filter((i) => i.status === 'planned'), [financeInvestmentIdeas]);
  const iInvested = useMemo(() => financeInvestmentIdeas.filter((i) => i.status === 'invested'), [financeInvestmentIdeas]);
  const iHighRisk = useMemo(() => financeInvestmentIdeas.filter((i) => i.riskLevel === 'high'), [financeInvestmentIdeas]);
  const tPlannedAmount = useMemo(() => financeInvestmentIdeas.reduce((s, i) => s + i.plannedAmount, 0), [financeInvestmentIdeas]);
  const maxAllocSum = useMemo(() => financeInvestmentIdeas.reduce((s, i) => s + (i.maxAllocation || 0), 0), [financeInvestmentIdeas]);
  const activeIAlloc = useMemo(() => financeInvestmentAllocations.filter((a) => a.isActive), [financeInvestmentAllocations]);
  const totalIAllocPct = useMemo(() => activeIAlloc.reduce((s, a) => s + a.percentage, 0), [activeIAlloc]);
  const ethicalIssues = useMemo(() => financeInvestmentIdeas.filter((i) => i.ethicalStatus === 'needs_review' || i.ethicalStatus === 'avoid'), [financeInvestmentIdeas]);
  const redFlagIdeas = useMemo(() => financeInvestmentIdeas.filter((i) => i.redFlags), [financeInvestmentIdeas]);
  const noResearch = useMemo(() => financeInvestmentIdeas.filter((i) => !i.researchLinks && i.status !== 'invested'), [financeInvestmentIdeas]);

  const openModal = (type: string, editing?: any) => {
    setModal({ type, editing });
    if (editing) setForm({ ...editing });
    else setForm({ currency: 'MYR', status: 'researching', decisionStatus: 'researching', riskLevel: 'medium', ethicalStatus: 'needs_review', isActive: true, priority: 0, percentage: 0 });
  };
  const closeModal = () => { setModal(null); setForm({}); };

  const handleSave = async () => {
    if (!modal) return;
    try {
      const { type, editing } = modal;
      const h = editing ? type === 'income' ? onUpdateFinanceIncome(editing.id, form) : type === 'expenses' ? onUpdateFinanceExpense(editing.id, form) : type === 'allocation' ? onUpdateFinanceAllocationRule(editing.id, form) : type === 'purchase_goals' ? onUpdateFinancePurchaseGoal(editing.id, form) : type === 'invest_ideas' ? onUpdateFinanceInvestmentIdea(editing.id, form) : type === 'invest_rules' ? onUpdateFinanceInvestmentRule(editing.id, form) : onUpdateFinanceInvestmentAllocation(editing.id, form) : type === 'income' ? onAddFinanceIncome(form) : type === 'expenses' ? onAddFinanceExpense(form) : type === 'allocation' ? onAddFinanceAllocationRule(form) : type === 'purchase_goals' ? onAddFinancePurchaseGoal(form) : type === 'invest_ideas' ? onAddFinanceInvestmentIdea(form) : type === 'invest_rules' ? onAddFinanceInvestmentRule(form) : onAddFinanceInvestmentAllocation(form);
      await h;
      closeModal();
    } catch (err: any) { alert(err.message); }
  };

  const toggleActive = (item: any, onToggle: (id: string, d: any) => Promise<any>) => onToggle(item.id, { ...item, isActive: !item.isActive });

  const createStarterAllocation = async () => {
    const d = [
      { name: 'Needs', category: 'needs', percentage: 40, priority: 1, isActive: true, notes: 'Essential living expenses' },
      { name: 'Family', category: 'family', percentage: 10, priority: 2, isActive: true, notes: 'Family support' },
      { name: 'Savings', category: 'savings', percentage: 20, priority: 3, isActive: true, notes: 'Emergency fund' },
      { name: 'Investment', category: 'investment', percentage: 15, priority: 4, isActive: true, notes: 'Long-term' },
      { name: 'Learning/Tools', category: 'learning', percentage: 5, priority: 5, isActive: true, notes: 'Books, courses' },
      { name: 'Health', category: 'health', percentage: 5, priority: 6, isActive: true, notes: 'Wellness' },
      { name: 'Giving/Zakat', category: 'giving', percentage: 5, priority: 7, isActive: true, notes: 'Charity' },
    ];
    for (const r of d) await onAddFinanceAllocationRule(r);
  };

  const createStarterRules = async () => {
    const d = [
      { title: 'Avoid interest-based products', category: 'ethics', description: 'Do not invest in anything involving riba/interest.', priority: 1, isActive: true },
      { title: 'Do not invest emergency fund', category: 'risk', description: 'Keep 3-6 months of expenses as cash, not invested.', priority: 2, isActive: true },
      { title: 'Max allocation per idea', category: 'strategy', description: 'No single idea should exceed the defined max allocation.', priority: 3, isActive: true },
      { title: 'Research before investing', category: 'process', description: 'Document pros, cons, risks, and scenarios before committing.', priority: 4, isActive: true },
      { title: 'Avoid unclear high-risk schemes', category: 'risk', description: 'If the revenue model or risk is unclear, do not invest.', priority: 5, isActive: true },
      { title: 'Review ethical status before action', category: 'ethics', description: 'Ensure Shariah compliance review before any investment.', priority: 6, isActive: true },
    ];
    for (const r of d) await onAddFinanceInvestmentRule(r);
  };

  const handleAddSaved = async (goal: FinancePurchaseGoal) => {
    const amt = parseFloat(addSavedAmount);
    if (isNaN(amt) || amt <= 0) { alert('Enter a valid amount.'); return; }
    await onUpdateFinancePurchaseGoal(goal.id, { ...goal, savedAmount: goal.savedAmount + amt });
    setAddSavedGoalId(null);
    setAddSavedAmount('');
  };

  const quickAction = async (item: FinanceInvestmentIdea, u: Partial<FinanceInvestmentIdea>) => onUpdateFinanceInvestmentIdea(item.id, { ...item, ...u });

  const renderInsight = () => (
    <div style={s.side}>
      {[
        ['What increased income this month?', 'Reflect on new income sources, project payments, or freelance work.'],
        ['What can be reduced?', 'Pick 1-2 expense categories to cut back next month.'],
        ['What purchase improves income or productivity?', 'Focus on tools, learning, or assets that generate returns.'],
        ['What should wait?', 'Defer discretionary purchases until savings rate stabilises.'],
        ['Aligned with Islamic principles?', 'Review income, expenses, and investments for Shariah compliance.'],
        ['Next financial action', 'Define one concrete action this week to improve your finances.'],
      ].map(([t, x]) => (
        <div key={String(t)} style={s.insCard}>
          <div style={s.insT}>{t}</div>
          <div style={s.insX}>{x}</div>
        </div>
      ))}
    </div>
  );

  const renderDash = () => (
    <div style={s.dashGrid}>
      {[
        ['Monthly Income', toCur(tIncome), '#166534'],
        ['Monthly Expenses', toCur(tExpenses), '#991b1b'],
        ['Net This Month', toCur(net), net >= 0 ? '#166534' : '#991b1b'],
        ['Savings Rate', `${sRate.toFixed(1)}%`, sRate >= 20 ? '#166534' : sRate > 0 ? '#854d0e' : '#991b1b'],
        ['Active Purchase Goals', String(aGoals.length), '#0f172a'],
        ['Investments Under Review', String(iUR.length), iUR.length > 0 ? '#c2410c' : '#64748b'],
        ['Ethical Warnings', String(eWarn.length), eWarn.length > 0 ? '#991b1b' : '#166534'],
      ].map(([l, v, c]) => (
        <div key={String(l)} style={s.card}>
          <div style={s.cardT}>{l}</div>
          <div style={{ ...s.cardV, color: c }}>{v}</div>
        </div>
      ))}
      <div style={s.card}>
        <div style={s.cardT}>Purchase Saved / Target</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{toCur(tGS)} / {toCur(tGT)}</div>
        {tGT > 0 && <div style={{ marginTop: '8px' }}><div style={s.bar((tGS / tGT) * 100)}><div style={s.fill((tGS / tGT) * 100, '#2563eb')} /></div></div>}
      </div>
    </div>
  );

  const renderIncomeTab = () => (
    <div>
      <div style={s.row}><h3 style={s.hdr}>Income</h3><button style={s.btn('#2563eb')} onClick={() => openModal('income')}>+ Add Income</button></div>
      {financeIncome.length === 0 ? <div style={s.empty}>No income entries yet.</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Title', 'Source', 'Amount', 'Date', 'Status', ''].map((h) => <th key={h} style={{ textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', padding: '8px 12px', borderBottom: '2px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}</tr></thead>
          <tbody>{financeIncome.map((i) => (
            <tr key={i.id}>
              <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{i.title}</td>
              <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{i.source}</td>
              <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{toCur(i.amount, i.currency)}</td>
              <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{i.incomeDate ? new Date(i.incomeDate).toLocaleDateString() : '-'}</td>
              <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}><span style={s.badge(i.status === 'received' ? 'green' : i.status === 'delayed' ? 'yellow' : i.status === 'cancelled' ? 'red' : 'blue')}>{i.status}</span></td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}><button style={s.iBtn} onClick={() => openModal('income', i)}>Edit</button><button style={{ ...s.iBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceIncome(i.id)}>Del</button></td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );

  const renderExpensesTab = () => (
    <div>
      <div style={s.row}><h3 style={s.hdr}>Expenses</h3><button style={s.btn('#2563eb')} onClick={() => openModal('expenses')}>+ Add Expense</button></div>
      {financeExpenses.length === 0 ? <div style={s.empty}>No expenses yet.</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead><tr>{['Title', 'Category', 'Amount', 'Date', 'Status', ''].map((h) => <th key={h} style={{ textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', padding: '8px 12px', borderBottom: '2px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}</tr></thead>
          <tbody>{financeExpenses.map((i) => (
            <tr key={i.id}>
              <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{i.title}</td>
              <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}><span style={s.badge('gray')}>{i.category}</span></td>
              <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{toCur(i.amount, i.currency)}</td>
              <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{i.expenseDate ? new Date(i.expenseDate).toLocaleDateString() : '-'}</td>
              <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}><span style={s.badge(i.status === 'paid' ? 'green' : i.status === 'unpaid' ? 'yellow' : i.status === 'cancelled' ? 'red' : 'blue')}>{i.status}</span></td>
              <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}><button style={s.iBtn} onClick={() => openModal('expenses', i)}>Edit</button><button style={{ ...s.iBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceExpense(i.id)}>Del</button></td>
            </tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );

  const renderAllocTab = () => (
    <div>
      <div style={s.row}><h3 style={s.hdr}>Allocation Rules</h3><button style={s.btn('#2563eb')} onClick={() => openModal('allocation')}>+ Add Rule</button></div>
      {financeAllocationRules.length === 0 ? <div style={s.empty}><p style={{ marginBottom: '16px' }}>No allocation rules yet.</p><button style={s.btn('#2563eb')} onClick={createStarterAllocation}>Create Starter Allocation System</button></div> : (
        <>
          <div style={{ ...s.warn, background: totalAllocPct === 100 ? '#f0fdf4' : '#fef9c3', border: `1px solid ${totalAllocPct === 100 ? '#bbf7d0' : '#fde68a'}`, color: totalAllocPct === 100 ? '#166534' : '#854d0e' }}>
            {totalAllocPct === 100 ? 'Allocation total is 100%. Rules are balanced.' : `Allocation total is ${totalAllocPct}%. Adjust rules to reach 100%.`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {financeAllocationRules.map((r) => (
              <div key={r.id} style={{ ...s.sCard, opacity: r.isActive ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div><div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{r.name}</div><div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{r.category} · Priority {r.priority}</div></div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>{r.percentage}%</div>
                </div>
                {r.notes && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>{r.notes}</div>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}><input type="checkbox" checked={r.isActive} onChange={() => toggleActive(r, onUpdateFinanceAllocationRule)} />Active</label>
                  <button style={s.iBtn} onClick={() => openModal('allocation', r)}>Edit</button>
                  <button style={{ ...s.iBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceAllocationRule(r.id)}>Del</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderPurchaseGoalsTab = () => (
    <div>
      <div style={s.row}><div><h3 style={s.hdr}>Purchase Goals Pro</h3><div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Product wishlist and acquisition planning</div></div><button style={s.btn('#2563eb')} onClick={() => openModal('purchase_goals')}>+ Add Goal</button></div>
      {financePurchaseGoals.length === 0 ? <div style={s.empty}>No purchase goals yet.</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {financePurchaseGoals.map((g) => {
            const pct = g.targetAmount > 0 ? (g.savedAmount / g.targetAmount) * 100 : 0;
            return (
              <div key={g.id} style={{ background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' }}>
                {g.imageUrl ? <img src={g.imageUrl} alt={g.title} style={{ width: '100%', height: '160px', objectFit: 'cover', display: 'block', background: '#f1f5f9' }} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} /> : <div style={{ width: '100%', height: '160px', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '13px' }}><svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg></div>}
                <div style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1 }}><div style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px' }}>{g.title}</div>{g.vendor && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{g.vendor}</div>}<div style={{ fontSize: '12px', color: '#64748b' }}>{g.category}</div></div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                      <span style={s.badge(g.priority === 'high' ? 'red' : g.priority === 'medium' ? 'yellow' : 'gray')}>{g.priority}</span>
                      <span style={s.badge(g.status === 'bought' ? 'green' : g.status === 'saving' ? 'blue' : g.status === 'paused' ? 'yellow' : g.status === 'cancelled' ? 'red' : 'gray')}>{g.status}</span>
                      <span style={s.badge(g.decisionStatus === 'bought' ? 'green' : g.decisionStatus === 'approved' ? 'blue' : g.decisionStatus === 'waiting' ? 'yellow' : g.decisionStatus === 'rejected' ? 'red' : 'purple')}>{g.decisionStatus}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}><div style={s.bar(pct)}><div style={s.fill(pct, '#2563eb')} /></div><div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#64748b' }}><span>Saved: {toCur(g.savedAmount, g.currency)}</span><span>Target: {toCur(g.targetAmount, g.currency)}</span></div></div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                    {g.targetDate && <span>Target: {new Date(g.targetDate).toLocaleDateString()}</span>}
                    {g.productUrl && <a href={g.productUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Open Product</a>}
                    {g.linkedProjectName && <span>Project: {g.linkedProjectName}</span>}
                  </div>
                  {g.reason && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Why: {g.reason}</div>}
                  {g.expectedUse && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Use: {g.expectedUse}</div>}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '12px 16px', borderTop: '1px solid #e5e7eb' }}>
                  <button style={s.btnS('#2563eb')} onClick={() => { setAddSavedGoalId(g.id); setAddSavedAmount(''); }}>+ Saved</button>
                  <button style={s.btnS('#166534')} onClick={() => onUpdateFinancePurchaseGoal(g.id, { ...g, status: 'bought', decisionStatus: 'bought' })}>Bought</button>
                  <button style={s.btnS('#854d0e')} onClick={() => onUpdateFinancePurchaseGoal(g.id, { ...g, decisionStatus: 'waiting' })}>Waiting</button>
                  <button style={s.btnS('#991b1b')} onClick={() => onUpdateFinancePurchaseGoal(g.id, { ...g, decisionStatus: 'rejected' })}>Reject</button>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', flex: 1 }}>
                    <button style={s.iBtn} onClick={() => openModal('purchase_goals', g)}>Edit</button>
                    <button style={{ ...s.iBtn, color: '#991b1b' }} onClick={() => onDeleteFinancePurchaseGoal(g.id)}>Del</button>
                  </div>
                </div>
                {addSavedGoalId === g.id && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input style={{ ...s.input, width: 'auto', flex: 1 }} type="number" step="0.01" placeholder="Amount" value={addSavedAmount} onChange={(e) => setAddSavedAmount(e.target.value)} autoFocus />
                    <button style={s.btnS('#2563eb')} onClick={() => handleAddSaved(g)}>Add</button>
                    <button style={s.btnO} onClick={() => { setAddSavedGoalId(null); setAddSavedAmount(''); }}>Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  // ── Investment Workspace ──

  const renderInvestmentOverview = () => (
    <div>
      <div style={{ ...s.warn, background: '#f0f9ff', border: '1px solid #bae6fd', color: '#1e40af', marginBottom: '20px' }}>
        This is tracking and scenario planning only, not financial advice.
      </div>
      <div style={s.dashGrid}>
        <div style={s.card}><div style={s.cardT}>Total Ideas</div><div style={s.cardV}>{financeInvestmentIdeas.length}</div></div>
        <div style={s.card}><div style={s.cardT}>Researching</div><div style={s.cardV}>{iResearching.length}</div></div>
        <div style={s.card}><div style={s.cardT}>Planned</div><div style={s.cardV}>{iPlanned.length}</div></div>
        <div style={s.card}><div style={s.cardT}>Invested</div><div style={s.cardV}>{iInvested.length}</div></div>
        <div style={s.card}><div style={s.cardT}>High Risk</div><div style={{ ...s.cardV, color: iHighRisk.length > 0 ? '#991b1b' : '#0f172a' }}>{iHighRisk.length}</div></div>
        <div style={s.card}><div style={s.cardT}>Ethical Warnings</div><div style={{ ...s.cardV, color: eWarn.length > 0 ? '#991b1b' : '#166534' }}>{eWarn.length}</div></div>
        <div style={s.card}><div style={s.cardT}>Total Planned Amount</div><div style={s.cardV}>{toCur(tPlannedAmount)}</div></div>
        <div style={s.card}><div style={s.cardT}>Max Allocation Sum</div><div style={s.cardV}>{toCur(maxAllocSum)}</div></div>
      </div>
    </div>
  );

  const renderInvestmentIdeas = () => (
    <div>
      <div style={s.row}><h3 style={s.hdr}>Investment Ideas</h3><button style={s.btn('#2563eb')} onClick={() => openModal('invest_ideas')}>+ Add Idea</button></div>
      {financeInvestmentIdeas.length === 0 ? <div style={s.empty}>No investment ideas yet.</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: '14px' }}>
          {financeInvestmentIdeas.map((idea) => (
            <div key={idea.id} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px' }}>{idea.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{idea.type} · {idea.expectedHorizon ? idea.expectedHorizon.replace('_', ' ') : 'no horizon'}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                  <span style={s.badge(idea.riskLevel === 'high' ? 'red' : idea.riskLevel === 'medium' ? 'yellow' : 'green')}>{idea.riskLevel}</span>
                  <span style={s.badge(idea.ethicalStatus === 'good' ? 'green' : idea.ethicalStatus === 'needs_review' ? 'yellow' : 'red')}>{idea.ethicalStatus}</span>
                  <span style={s.badge(idea.status === 'invested' ? 'green' : idea.status === 'researching' ? 'blue' : idea.status === 'rejected' ? 'red' : 'gray')}>{idea.status}</span>
                  <span style={s.badge(idea.decisionStatus === 'invested' ? 'green' : idea.decisionStatus === 'approved' ? 'blue' : idea.decisionStatus === 'waiting' ? 'yellow' : idea.decisionStatus === 'rejected' ? 'red' : 'purple')}>{idea.decisionStatus}</span>
                </div>
              </div>
              <div style={{ marginTop: '8px', display: 'flex', gap: '16px', fontSize: '13px', color: '#0f172a' }}>
                <span>Amount: {toCur(idea.plannedAmount, idea.currency)}</span>
                {idea.maxAllocation != null && <span>Max: {toCur(idea.maxAllocation, idea.currency)}</span>}
              </div>
              {idea.reviewDate && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Review: {new Date(idea.reviewDate).toLocaleDateString()}</div>}
              {idea.pros && <div style={{ fontSize: '12px', color: '#166534', marginTop: '6px' }}>Pros: {idea.pros}</div>}
              {idea.cons && <div style={{ fontSize: '12px', color: '#991b1b', marginTop: '2px' }}>Cons: {idea.cons}</div>}
              {idea.risks && <div style={{ fontSize: '12px', color: '#c2410c', marginTop: '2px' }}>Risks: {idea.risks}</div>}
              {idea.redFlags && <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600, marginTop: '2px' }}>Red Flag: {idea.redFlags}</div>}
              {idea.baseScenario && (
                <div style={{ marginTop: '8px', padding: '8px', background: '#f8fafc', borderRadius: '6px', fontSize: '12px', color: '#64748b' }}>
                  <div>Low: {idea.lowScenario || '-'}</div>
                  <div>Base: {idea.baseScenario}</div>
                  <div>High: {idea.highScenario || '-'}</div>
                </div>
              )}
              {idea.researchLinks && <div style={{ fontSize: '12px', color: '#2563eb', marginTop: '4px' }}>Research: {idea.researchLinks}</div>}
              {idea.expectedReason && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Why: {idea.expectedReason}</div>}
              {idea.notes && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Notes: {idea.notes}</div>}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #e5e7eb' }}>
                <button style={s.btnS('#2563eb')} onClick={() => quickAction(idea, { status: 'researching' })}>Researching</button>
                <button style={s.btnS('#854d0e')} onClick={() => quickAction(idea, { status: 'planned', decisionStatus: 'approved' })}>Plan</button>
                <button style={s.btnS('#166534')} onClick={() => quickAction(idea, { status: 'invested', decisionStatus: 'invested' })}>Invested</button>
                <button style={s.btnS('#991b1b')} onClick={() => quickAction(idea, { decisionStatus: 'rejected', status: 'rejected' })}>Reject</button>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '4px', flex: 1 }}>
                  <button style={s.iBtn} onClick={() => openModal('invest_ideas', idea)}>Edit</button>
                  <button style={{ ...s.iBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceInvestmentIdea(idea.id)}>Del</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderInvestmentAllocation = () => (
    <div>
      <div style={s.row}><h3 style={s.hdr}>Investment Allocations</h3><button style={s.btn('#2563eb')} onClick={() => openModal('invest_allocations')}>+ Add Allocation</button></div>
      {financeInvestmentAllocations.length === 0 ? <div style={s.empty}>No investment allocations yet.</div> : (
        <>
          <div style={{ ...s.warn, background: totalIAllocPct === 100 ? '#f0fdf4' : '#fef9c3', border: `1px solid ${totalIAllocPct === 100 ? '#bbf7d0' : '#fde68a'}`, color: totalIAllocPct === 100 ? '#166534' : '#854d0e' }}>
            {totalIAllocPct === 100 ? 'Allocation total is 100%.' : `Allocation total is ${totalIAllocPct}%. Adjust to reach 100%.`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {financeInvestmentAllocations.map((a) => (
              <div key={a.id} style={{ ...s.sCard, opacity: a.isActive ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div><div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{a.name}</div><div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{a.category} · Priority {a.priority}</div></div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>{a.percentage}%</div>
                </div>
                <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                  Risk: <span style={s.badge(a.riskLevel === 'high' ? 'red' : a.riskLevel === 'medium' ? 'yellow' : 'green')}>{a.riskLevel}</span>
                  Ethical: <span style={s.badge(a.ethicalStatus === 'good' ? 'green' : a.ethicalStatus === 'needs_review' ? 'yellow' : 'red')}>{a.ethicalStatus}</span>
                </div>
                {a.notes && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>{a.notes}</div>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}><input type="checkbox" checked={a.isActive} onChange={() => toggleActive(a, onUpdateFinanceInvestmentAllocation)} />Active</label>
                  <button style={s.iBtn} onClick={() => openModal('invest_allocations', a)}>Edit</button>
                  <button style={{ ...s.iBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceInvestmentAllocation(a.id)}>Del</button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );

  const renderInvestmentRules = () => (
    <div>
      <div style={s.row}><h3 style={s.hdr}>Investment Rules</h3><button style={s.btn('#2563eb')} onClick={() => openModal('invest_rules')}>+ Add Rule</button></div>
      {financeInvestmentRules.length === 0 ? <div style={s.empty}><p style={{ marginBottom: '16px' }}>No investment rules yet.</p><button style={s.btn('#2563eb')} onClick={createStarterRules}>Create Starter Investment Rules</button></div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {financeInvestmentRules.map((r) => (
            <div key={r.id} style={{ ...s.sCard, opacity: r.isActive ? 1 : 0.5 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{r.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{r.category} · Priority {r.priority}</div>
                </div>
                <span style={r.isActive ? s.badge('green') : s.badge('gray')}>{r.isActive ? 'Active' : 'Inactive'}</span>
              </div>
              {r.description && <div style={{ fontSize: '13px', color: '#475569', marginTop: '8px' }}>{r.description}</div>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}><input type="checkbox" checked={r.isActive} onChange={() => toggleActive(r, onUpdateFinanceInvestmentRule)} />Active</label>
                <button style={s.iBtn} onClick={() => openModal('invest_rules', r)}>Edit</button>
                <button style={{ ...s.iBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceInvestmentRule(r.id)}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderRiskReview = () => (
    <div>
      <h3 style={{ ...s.hdr, marginBottom: '16px' }}>Risk Review</h3>
      {iHighRisk.length === 0 && redFlagIdeas.length === 0 && noResearch.length === 0 ? (
        <div style={s.empty}>No risks identified. All ideas look clean.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {iHighRisk.length > 0 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>High Risk Ideas ({iHighRisk.length})</div>
              {iHighRisk.map((idea) => (
                <div key={idea.id} style={{ ...s.sCard, marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{idea.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Plan: {toCur(idea.plannedAmount, idea.currency)} · {idea.type}</div>
                  {idea.risks && <div style={{ fontSize: '12px', color: '#c2410c', marginTop: '4px' }}>Risks: {idea.risks}</div>}
                </div>
              ))}
            </div>
          )}
          {redFlagIdeas.length > 0 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#991b1b', marginBottom: '8px' }}>Ideas with Red Flags ({redFlagIdeas.length})</div>
              {redFlagIdeas.map((idea) => (
                <div key={idea.id} style={{ ...s.sCard, marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{idea.title}</div>
                  <div style={{ fontSize: '12px', color: '#991b1b', fontWeight: 600, marginTop: '4px' }}>{idea.redFlags}</div>
                </div>
              ))}
            </div>
          )}
          {noResearch.length > 0 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#854d0e', marginBottom: '8px' }}>Needs More Research ({noResearch.length})</div>
              {noResearch.map((idea) => (
                <div key={idea.id} style={{ ...s.sCard, marginBottom: '8px' }}>
                  <div style={{ fontWeight: 600 }}>{idea.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Status: {idea.status}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderEthicalReview = () => (
    <div>
      <h3 style={{ ...s.hdr, marginBottom: '16px' }}>Ethical Review</h3>
      {ethicalIssues.length === 0 ? (
        <div style={s.empty}>No ethical concerns found.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ ...s.warn, background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' }}>
            {ethicalIssues.length} investment idea(s) flagged for ethical review.
          </div>
          {ethicalIssues.map((idea) => (
            <div key={idea.id} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ fontWeight: 700, color: '#0f172a' }}>{idea.title}</div>
                <span style={s.badge(idea.ethicalStatus === 'avoid' ? 'red' : 'yellow')}>{idea.ethicalStatus}</span>
              </div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>{idea.type} · {toCur(idea.plannedAmount, idea.currency)}</div>
            </div>
          ))}
          <div style={{ marginTop: '16px' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0f172a', marginBottom: '12px' }}>Review Prompts</div>
            {['Is the business model halal?', 'Is there interest/riba involvement?', 'Is there gambling/speculation?', 'Is the product harmful?', 'Is the revenue source clear?'].map((q) => (
              <div key={q} style={s.card}>
                <div style={{ fontWeight: 600, color: '#0f172a' }}>{q}</div>
                <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>Evaluate this question for all flagged ideas before proceeding.</div>
              </div>
            ))}
          </div>
          {financeInvestmentAllocations.filter((a) => a.ethicalStatus === 'needs_review' || a.ethicalStatus === 'avoid').length > 0 && (
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#991b1b', marginBottom: '8px', marginTop: '8px' }}>Flagged Allocations</div>
              {financeInvestmentAllocations.filter((a) => a.ethicalStatus === 'needs_review' || a.ethicalStatus === 'avoid').map((a) => (
                <div key={a.id} style={s.sCard}>
                  <div style={{ fontWeight: 600 }}>{a.name}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{a.percentage}% · Ethic: <span style={s.badge(a.ethicalStatus === 'avoid' ? 'red' : 'yellow')}>{a.ethicalStatus}</span></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderInvestmentWorkspace = () => (
    <div>
      <div style={s.iNav}>
        {(['overview', 'ideas', 'allocation', 'rules', 'risk_review', 'ethical_review'] as InvestTab[]).map((t) => (
          <button key={t} style={s.iNavBtn(iTab === t)} onClick={() => setITab(t)}>
            {t === 'overview' ? 'Overview' : t === 'ideas' ? 'Ideas' : t === 'allocation' ? 'Allocation' : t === 'rules' ? 'Rules' : t === 'risk_review' ? 'Risk Review' : 'Ethical Review'}
          </button>
        ))}
      </div>
      {iTab === 'overview' && renderInvestmentOverview()}
      {iTab === 'ideas' && renderInvestmentIdeas()}
      {iTab === 'allocation' && renderInvestmentAllocation()}
      {iTab === 'rules' && renderInvestmentRules()}
      {iTab === 'risk_review' && renderRiskReview()}
      {iTab === 'ethical_review' && renderEthicalReview()}
    </div>
  );

  // ── Investment Form ──

  const renderInvestIdeaForm = () => (
    <div style={s.formGrid}>
      {[['Title *', 'title', 'text'], ['Planned Amount', 'plannedAmount', 'number'], ['Max Allocation', 'maxAllocation', 'number'], ['Type', 'type', 'select', INVESTMENT_TYPES], ['Risk Level', 'riskLevel', 'select', RISK_LEVELS], ['Ethical Status', 'ethicalStatus', 'select', ETHICAL_STATUSES], ['Status', 'status', 'select', INVESTMENT_STATUSES], ['Decision Status', 'decisionStatus', 'select', INVEST_DECISION_STATUSES], ['Expected Horizon', 'expectedHorizon', 'select', INV_HORIZONS], ['Currency', 'currency', 'select', ['MYR', 'USD', 'EUR', 'SGD']], ['Review Date', 'reviewDate', 'date'], ['Expected Reason', 'expectedReason', 'text']].map(([l, k, t, o]: any) => (
        <div key={k}>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{l}</label>
          {t === 'select' ? <select style={s.select} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}><option value="">Select</option>{o.map((v: string) => <option key={v} value={v}>{v}</option>)}</select> : <input style={s.input} type={t} step={t === 'number' ? '0.01' : undefined} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: t === 'number' ? Math.max(0, parseFloat(e.target.value) || 0) : e.target.value })} />}
        </div>
      ))}
      <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Pros</label><textarea style={s.input} rows={2} value={form.pros || ''} onChange={(e) => setForm({ ...form, pros: e.target.value })} /></div>
      <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Cons</label><textarea style={s.input} rows={2} value={form.cons || ''} onChange={(e) => setForm({ ...form, cons: e.target.value })} /></div>
      <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Risks</label><textarea style={s.input} rows={2} value={form.risks || ''} onChange={(e) => setForm({ ...form, risks: e.target.value })} /></div>
      <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Red Flags</label><textarea style={s.input} rows={2} value={form.redFlags || ''} onChange={(e) => setForm({ ...form, redFlags: e.target.value })} /></div>
      <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Research Links</label><textarea style={s.input} rows={2} value={form.researchLinks || ''} onChange={(e) => setForm({ ...form, researchLinks: e.target.value })} /></div>
      <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Low Scenario</label><textarea style={s.input} rows={1} value={form.lowScenario || ''} onChange={(e) => setForm({ ...form, lowScenario: e.target.value })} /></div>
      <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Base Scenario</label><textarea style={s.input} rows={1} value={form.baseScenario || ''} onChange={(e) => setForm({ ...form, baseScenario: e.target.value })} /></div>
      <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>High Scenario</label><textarea style={s.input} rows={1} value={form.highScenario || ''} onChange={(e) => setForm({ ...form, highScenario: e.target.value })} /></div>
      <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
    </div>
  );

  // ── Modal ──

  const renderForm = () => {
    if (!modal) return null;
    const isNew = !modal.editing;
    const titles: Record<string, string> = { income: isNew ? 'Add Income' : 'Edit Income', expenses: isNew ? 'Add Expense' : 'Edit Expense', allocation: isNew ? 'Add Allocation Rule' : 'Edit Allocation Rule', purchase_goals: isNew ? 'Add Purchase Goal' : 'Edit Purchase Goal', invest_ideas: isNew ? 'Add Investment Idea' : 'Edit Investment Idea', invest_rules: isNew ? 'Add Investment Rule' : 'Edit Investment Rule', invest_allocations: isNew ? 'Add Investment Allocation' : 'Edit Investment Allocation' };

    const body = () => {
      switch (modal.type) {
        case 'income': return (
          <div style={s.formGrid}>
            {[['Title *', 'title', 'text'], ['Amount *', 'amount', 'number'], ['Income Date', 'incomeDate', 'date'], ['Source', 'source', 'select', INCOME_SOURCES], ['Status', 'status', 'select', INCOME_STATUSES], ['Currency', 'currency', 'select', ['MYR', 'USD', 'EUR', 'SGD']]].map(([l, k, t, o]: any) => (
              <div key={k}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{l}</label>{t === 'select' ? <select style={s.select} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}><option value="">Select</option>{o.map((v: string) => <option key={v} value={v}>{v}</option>)}</select> : <input style={s.input} type={t} step={t === 'number' ? '0.01' : undefined} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: t === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value })} />}</div>
            ))}
            <div><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Project</label><select style={s.select} value={form.linkedProjectId || ''} onChange={(e) => setForm({ ...form, linkedProjectId: e.target.value || undefined })}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Company</label><select style={s.select} value={form.linkedCompanyId || ''} onChange={(e) => setForm({ ...form, linkedCompanyId: e.target.value || undefined })}><option value="">None</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        );
        case 'expenses': return (
          <div style={s.formGrid}>
            {[['Title *', 'title', 'text'], ['Amount *', 'amount', 'number'], ['Expense Date', 'expenseDate', 'date'], ['Category', 'category', 'select', EXPENSE_CATEGORIES], ['Status', 'status', 'select', EXPENSE_STATUSES], ['Currency', 'currency', 'select', ['MYR', 'USD', 'EUR', 'SGD']]].map(([l, k, t, o]: any) => (
              <div key={k}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{l}</label>{t === 'select' ? <select style={s.select} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}><option value="">Select</option>{o.map((v: string) => <option key={v} value={v}>{v}</option>)}</select> : <input style={s.input} type={t} step={t === 'number' ? '0.01' : undefined} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: t === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value })} />}</div>
            ))}
            <div><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Project</label><select style={s.select} value={form.linkedProjectId || ''} onChange={(e) => setForm({ ...form, linkedProjectId: e.target.value || undefined })}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        );
        case 'allocation': return (
          <div style={s.formGrid}>
            {[['Name *', 'name', 'text'], ['Category', 'category', 'select', ALLOC_CATS], ['Percentage (0-100)', 'percentage', 'number'], ['Priority', 'priority', 'number']].map(([l, k, t, o]: any) => (
              <div key={k}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{l}</label>{t === 'select' ? <select style={s.select} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}><option value="">Select</option>{o.map((v: string) => <option key={v} value={v}>{v}</option>)}</select> : <input style={s.input} type={t} min="0" max="100" value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: t === 'number' ? Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) : e.target.value })} />}</div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}><input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="a1" /><label htmlFor="a1" style={{ fontSize: '13px', color: '#0f172a' }}>Active</label></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        );
        case 'purchase_goals': return (
          <div style={s.formGrid}>
            {[['Title *', 'title', 'text'], ['Target Amount *', 'targetAmount', 'number'], ['Saved Amount', 'savedAmount', 'number'], ['Category', 'category', 'select', EXPENSE_CATEGORIES], ['Priority', 'priority', 'select', GOAL_PRIORITIES], ['Status', 'status', 'select', GOAL_STATUSES], ['Decision Status', 'decisionStatus', 'select', DECISION_STATUSES], ['Currency', 'currency', 'select', ['MYR', 'USD', 'EUR', 'SGD']], ['Target Date', 'targetDate', 'date'], ['Product URL', 'productUrl', 'url'], ['Image URL', 'imageUrl', 'url'], ['Vendor', 'vendor', 'text']].map(([l, k, t, o]: any) => (
              <div key={k}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{l}</label>{t === 'select' ? <select style={s.select} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}><option value="">Select</option>{o.map((v: string) => <option key={v} value={v}>{v}</option>)}</select> : <input style={s.input} type={t} step={t === 'number' ? '0.01' : undefined} placeholder={t === 'url' ? 'https://...' : ''} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: t === 'number' ? Math.max(0, parseFloat(e.target.value) || 0) : e.target.value })} />}</div>
            ))}
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Reason</label><textarea style={s.input} rows={2} value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Expected Use</label><textarea style={s.input} rows={2} value={form.expectedUse || ''} onChange={(e) => setForm({ ...form, expectedUse: e.target.value })} /></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Alternatives</label><textarea style={s.input} rows={2} value={form.alternatives || ''} onChange={(e) => setForm({ ...form, alternatives: e.target.value })} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Project</label><select style={s.select} value={form.linkedProjectId || ''} onChange={(e) => setForm({ ...form, linkedProjectId: e.target.value || undefined })}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        );
        case 'invest_ideas': return renderInvestIdeaForm();
        case 'invest_rules': return (
          <div style={s.formGrid}>
            {[['Title *', 'title', 'text'], ['Category', 'category', 'select', INV_RULE_CATS], ['Priority', 'priority', 'number']].map(([l, k, t, o]: any) => (
              <div key={k}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{l}</label>{t === 'select' ? <select style={s.select} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}><option value="">Select</option>{o.map((v: string) => <option key={v} value={v}>{v}</option>)}</select> : <input style={s.input} type={t} value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: t === 'number' ? (parseInt(e.target.value) || 0) : e.target.value })} />}</div>
            ))}
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Description</label><textarea style={s.input} rows={2} value={form.description || ''} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="ar1" /><label htmlFor="ar1" style={{ fontSize: '13px', color: '#0f172a' }}>Active</label></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        );
        case 'invest_allocations': return (
          <div style={s.formGrid}>
            {[['Name *', 'name', 'text'], ['Category', 'category', 'select', INV_ALLOC_CATS], ['Percentage', 'percentage', 'number'], ['Risk Level', 'riskLevel', 'select', RISK_LEVELS], ['Ethical Status', 'ethicalStatus', 'select', ETHICAL_STATUSES], ['Priority', 'priority', 'number']].map(([l, k, t, o]: any) => (
              <div key={k}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{l}</label>{t === 'select' ? <select style={s.select} value={form[k] || ''} onChange={(e) => setForm({ ...form, [k]: e.target.value })}><option value="">Select</option>{o.map((v: string) => <option key={v} value={v}>{v}</option>)}</select> : <input style={s.input} type={t} min="0" max="100" value={form[k] ?? ''} onChange={(e) => setForm({ ...form, [k]: t === 'number' ? Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) : e.target.value })} />}</div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="aa1" /><label htmlFor="aa1" style={{ fontSize: '13px', color: '#0f172a' }}>Active</label></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        );
        default: return null;
      }
    };

    return (
      <div style={s.overlay} onClick={closeModal}>
        <div style={s.modal} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>{titles[modal.type]}</h3>
          {body()}
          <div style={s.act}>
            <button style={{ ...s.btn('#64748b') }} onClick={closeModal}>Cancel</button>
            <button style={s.btn('#2563eb')} onClick={handleSave}>{isNew ? 'Create' : 'Save'}</button>
          </div>
        </div>
      </div>
    );
  };

  const tabs: FinanceTab[] = ['dashboard', 'income', 'expenses', 'allocation', 'purchase_goals', 'investments', 'review'];
  const tabLabels: Record<FinanceTab, string> = { dashboard: 'Dashboard', income: 'Income', expenses: 'Expenses', allocation: 'Allocation', purchase_goals: 'Purchase Goals', investments: 'Investments', review: 'Review' };

  return (
    <div style={s.page}>
      <div style={s.layout}>
        <div style={s.main}>
          <div style={s.nav}>
            {tabs.map((tab) => <button key={tab} style={s.navBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>{tabLabels[tab]}</button>)}
          </div>
          {activeTab === 'dashboard' && renderDash()}
          {activeTab === 'income' && renderIncomeTab()}
          {activeTab === 'expenses' && renderExpensesTab()}
          {activeTab === 'allocation' && renderAllocTab()}
          {activeTab === 'purchase_goals' && renderPurchaseGoalsTab()}
          {activeTab === 'investments' && renderInvestmentWorkspace()}
          {activeTab === 'review' && (
            <div>
              <h3 style={s.hdr}>Finance Review</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                {['What increased income this month?', 'What expenses were unnecessary?', 'What should be reduced next month?', 'What should be invested only after research?', 'What is not aligned with Islamic principles?', 'What is the next financial action?'].map((q, i) => (
                  <div key={i} style={s.card}><div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{q}</div><div style={{ fontSize: '13px', color: '#64748b' }}>Review and reflect on this question.</div></div>
                ))}
              </div>
            </div>
          )}
          {modal && renderForm()}
        </div>
        {renderInsight()}
      </div>
    </div>
  );
}
