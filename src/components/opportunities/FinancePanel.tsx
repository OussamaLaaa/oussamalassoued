import React, { useState, useMemo } from 'react';
import type { FinanceIncome, FinanceExpense, FinanceAllocationRule, FinancePurchaseGoal, FinanceInvestmentIdea, Project, Company } from '../../types/opportunities';

type FinanceTab = 'dashboard' | 'income' | 'expenses' | 'allocation' | 'purchase_goals' | 'investments' | 'review';

interface FinancePanelProps {
  financeIncome: FinanceIncome[];
  financeExpenses: FinanceExpense[];
  financeAllocationRules: FinanceAllocationRule[];
  financePurchaseGoals: FinancePurchaseGoal[];
  financeInvestmentIdeas: FinanceInvestmentIdea[];
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
}

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
const ALLOCATION_CATEGORIES = ['needs', 'savings', 'investment', 'family', 'learning', 'health', 'giving', 'other'];

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const toCurrency = (amount: number, currency = 'MYR') => `${currency} ${Number(amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const isCurrentMonth = (dateStr?: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
};

const s = {
  page: { minHeight: '100vh', background: '#f8fafc' },
  layout: { display: 'flex', gap: '24px', padding: '24px', maxWidth: '1280px', margin: '0 auto', alignItems: 'flex-start' as const },
  main: { flex: '1', minWidth: '0' },
  side: { width: '280px', flexShrink: '0' as const, position: 'sticky' as const, top: '24px' },
  nav: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' },
  navBtn: (active: boolean) => ({ padding: '8px 16px', fontSize: '14px', fontWeight: 500 as const, color: active ? '#2563eb' : '#64748b', background: active ? '#eff6ff' : 'transparent', border: active ? '1px solid #bfdbfe' : '1px solid transparent', borderRadius: '6px', cursor: 'pointer', transition: 'all 0.15s' }),
  card: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px' },
  cardTitle: { fontSize: '13px', color: '#64748b', marginBottom: '4px', fontWeight: 500 as const },
  cardValue: { fontSize: '22px', fontWeight: 700 as const, color: '#0f172a' },
  dashGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px', marginBottom: '24px' },
  badge: (color: string) => ({ display: 'inline-flex', padding: '2px 8px', fontSize: '11px', fontWeight: 600 as const, borderRadius: '999px', background: color === 'green' ? '#dcfce7' : color === 'red' ? '#fef2f2' : color === 'yellow' ? '#fef9c3' : color === 'blue' ? '#eff6ff' : color === 'purple' ? '#f3e8ff' : color === 'orange' ? '#fff7ed' : '#f1f5f9', color: color === 'green' ? '#166534' : color === 'red' ? '#991b1b' : color === 'yellow' ? '#854d0e' : color === 'blue' ? '#1d4ed8' : color === 'purple' ? '#6b21a8' : color === 'orange' ? '#c2410c' : '#475569' }),
  input: { width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#0f172a', background: '#ffffff', boxSizing: 'border-box' as const, outline: 'none' as const },
  select: { width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#0f172a', background: '#ffffff', boxSizing: 'border-box' as const, outline: 'none' as const },
  btn: (color: string) => ({ padding: '7px 16px', fontSize: '13px', fontWeight: 600 as const, border: 'none', borderRadius: '6px', cursor: 'pointer', background: color, color: '#ffffff', transition: 'opacity 0.15s' }),
  btnSml: (color: string) => ({ padding: '4px 10px', fontSize: '11px', fontWeight: 600 as const, border: 'none', borderRadius: '5px', cursor: 'pointer', background: color, color: '#ffffff', transition: 'opacity 0.15s' }),
  btnOut: { padding: '5px 10px', fontSize: '12px', fontWeight: 500 as const, border: '1px solid #e5e7eb', borderRadius: '5px', cursor: 'pointer', background: '#ffffff', color: '#64748b', transition: 'all 0.15s' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' },
  fullW: { gridColumn: '1 / -1' as const },
  modalOverlay: { position: 'fixed' as const, inset: '0', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, zIndex: 1000 },
  modal: { background: '#ffffff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '660px', maxHeight: '85vh', overflowY: 'auto' as const },
  modalActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' as const, marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #e5e7eb' },
  bar: (pct: number) => ({ height: '8px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' as const }),
  fill: (pct: number, color: string) => ({ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: '999px', transition: 'width 0.3s' }),
  iconBtn: { padding: '4px 8px', fontSize: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent', color: '#64748b' },
  empty: { textAlign: 'center' as const, padding: '48px 24px', color: '#64748b', fontSize: '14px' },
  insightCard: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '16px', marginBottom: '12px' },
  insightTitle: { fontSize: '13px', fontWeight: 600 as const, color: '#0f172a', marginBottom: '6px' },
  insightText: { fontSize: '12px', color: '#64748b', lineHeight: '1.5' as const },
  sectionHdr: { fontSize: '18px', fontWeight: 700 as const, color: '#0f172a', margin: 0 },
  sectionRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' as const, gap: '8px' },
  goalCard: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', overflow: 'hidden' as const },
  goalImg: { width: '100%', height: '160px', objectFit: 'cover' as const, display: 'block' as const, background: '#f1f5f9' },
  goalPlaceholder: { width: '100%', height: '160px', background: '#f1f5f9', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, color: '#94a3b8', fontSize: '13px', fontWeight: 500 as const },
  goalBody: { padding: '16px' },
  goalActions: { display: 'flex', gap: '6px', flexWrap: 'wrap' as const, marginTop: '12px', padding: '12px 16px', borderTop: '1px solid #e5e7eb' },
  flexEnd: { display: 'flex', justifyContent: 'flex-end' as const, gap: '4px' },
};

export default function FinancePanel({
  financeIncome, financeExpenses, financeAllocationRules, financePurchaseGoals, financeInvestmentIdeas,
  projects, companies,
  onAddFinanceIncome, onUpdateFinanceIncome, onDeleteFinanceIncome,
  onAddFinanceExpense, onUpdateFinanceExpense, onDeleteFinanceExpense,
  onAddFinanceAllocationRule, onUpdateFinanceAllocationRule, onDeleteFinanceAllocationRule,
  onAddFinancePurchaseGoal, onUpdateFinancePurchaseGoal, onDeleteFinancePurchaseGoal,
  onAddFinanceInvestmentIdea, onUpdateFinanceInvestmentIdea, onDeleteFinanceInvestmentIdea,
}: FinancePanelProps) {
  const [activeTab, setActiveTab] = useState<FinanceTab>('dashboard');
  const [modal, setModal] = useState<{ type: FinanceTab; editing?: any } | null>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [addSavedGoalId, setAddSavedGoalId] = useState<string | null>(null);
  const [addSavedAmount, setAddSavedAmount] = useState('');

  const activeAllocationRules = useMemo(() => financeAllocationRules.filter((r) => r.isActive), [financeAllocationRules]);
  const totalAllocationPct = useMemo(() => activeAllocationRules.reduce((s, r) => s + r.percentage, 0), [activeAllocationRules]);

  const monthlyIncome = useMemo(() => financeIncome.filter((i) => i.status === 'received' && isCurrentMonth(i.incomeDate)), [financeIncome]);
  const monthlyExpenses = useMemo(() => financeExpenses.filter((e) => e.status === 'paid' && isCurrentMonth(e.expenseDate)), [financeExpenses]);
  const totalIncome = useMemo(() => monthlyIncome.reduce((s, i) => s + i.amount, 0), [monthlyIncome]);
  const totalExpenses = useMemo(() => monthlyExpenses.reduce((s, e) => s + e.amount, 0), [monthlyExpenses]);
  const netThisMonth = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? (netThisMonth / totalIncome) * 100 : 0;
  const activeGoals = useMemo(() => financePurchaseGoals.filter((g) => g.status === 'saving' || g.status === 'planned'), [financePurchaseGoals]);
  const totalGoalTarget = useMemo(() => financePurchaseGoals.reduce((s, g) => s + g.targetAmount, 0), [financePurchaseGoals]);
  const totalGoalSaved = useMemo(() => financePurchaseGoals.reduce((s, g) => s + g.savedAmount, 0), [financePurchaseGoals]);
  const investmentUnderReview = useMemo(() => financeInvestmentIdeas.filter((i) => i.ethicalStatus === 'needs_review'), [financeInvestmentIdeas]);
  const ethicalWarnings = useMemo(() => financeInvestmentIdeas.filter((i) => i.ethicalStatus === 'needs_review' || i.ethicalStatus === 'avoid'), [financeInvestmentIdeas]);

  const openModal = (type: FinanceTab, editing?: any) => {
    setModal({ type, editing });
    if (editing) {
      setForm({ ...editing });
    } else {
      setForm({ currency: 'MYR', status: type === 'income' ? 'expected' : type === 'expenses' ? 'planned' : type === 'purchase_goals' ? 'planned' : type === 'investments' ? 'researching' : 'medium', isActive: true, priority: 0, decisionStatus: 'researching' });
    }
  };

  const closeModal = () => { setModal(null); setForm({}); };

  const handleSave = async () => {
    if (!modal) return;
    try {
      const { type, editing } = modal;
      const save = editing ? (type === 'income' ? onUpdateFinanceIncome(editing.id, form) : type === 'expenses' ? onUpdateFinanceExpense(editing.id, form) : type === 'allocation' ? onUpdateFinanceAllocationRule(editing.id, form) : type === 'purchase_goals' ? onUpdateFinancePurchaseGoal(editing.id, form) : onUpdateFinanceInvestmentIdea(editing.id, form)) : (type === 'income' ? onAddFinanceIncome(form) : type === 'expenses' ? onAddFinanceExpense(form) : type === 'allocation' ? onAddFinanceAllocationRule(form) : type === 'purchase_goals' ? onAddFinancePurchaseGoal(form) : onAddFinanceInvestmentIdea(form));
      await save;
      closeModal();
    } catch (err: any) { alert(err.message); }
  };

  const toggleAllocationActive = async (rule: FinanceAllocationRule) => {
    await onUpdateFinanceAllocationRule(rule.id, { ...rule, isActive: !rule.isActive });
  };

  const createStarterAllocation = async () => {
    const defaults = [
      { name: 'Needs', category: 'needs', percentage: 40, priority: 1, isActive: true, notes: 'Essential living expenses' },
      { name: 'Family', category: 'family', percentage: 10, priority: 2, isActive: true, notes: 'Family support and gifts' },
      { name: 'Savings', category: 'savings', percentage: 20, priority: 3, isActive: true, notes: 'Emergency fund and savings' },
      { name: 'Investment', category: 'investment', percentage: 15, priority: 4, isActive: true, notes: 'Long-term investments' },
      { name: 'Learning/Tools', category: 'learning', percentage: 5, priority: 5, isActive: true, notes: 'Books, courses, tools' },
      { name: 'Health', category: 'health', percentage: 5, priority: 6, isActive: true, notes: 'Medical and wellness' },
      { name: 'Giving/Zakat', category: 'giving', percentage: 5, priority: 7, isActive: true, notes: 'Charity and zakat' },
    ];
    for (const rule of defaults) await onAddFinanceAllocationRule(rule);
  };

  const handleAddSaved = async (goal: FinancePurchaseGoal) => {
    const amt = parseFloat(addSavedAmount);
    if (isNaN(amt) || amt <= 0) { alert('Enter a valid amount.'); return; }
    const newSaved = goal.savedAmount + amt;
    await onUpdateFinancePurchaseGoal(goal.id, { ...goal, savedAmount: newSaved });
    setAddSavedGoalId(null);
    setAddSavedAmount('');
  };

  const handleQuickAction = async (goal: FinancePurchaseGoal, updates: Partial<FinancePurchaseGoal>) => {
    await onUpdateFinancePurchaseGoal(goal.id, { ...goal, ...updates });
  };

  const renderInsightPanel = () => (
    <div style={s.side}>
      <div style={s.insightCard}>
        <div style={s.insightTitle}>What increased income this month?</div>
        <div style={s.insightText}>Reflect on new income sources, project payments, or freelance work received.</div>
      </div>
      <div style={s.insightCard}>
        <div style={s.insightTitle}>What can be reduced?</div>
        <div style={s.insightText}>Pick 1-2 expense categories to cut back on next month.</div>
      </div>
      <div style={s.insightCard}>
        <div style={s.insightTitle}>What purchase improves income or productivity?</div>
        <div style={s.insightText}>Focus spending on tools, learning, or assets that generate returns.</div>
      </div>
      <div style={s.insightCard}>
        <div style={s.insightTitle}>What should wait?</div>
        <div style={s.insightText}>Defer discretionary purchases until savings rate stabilises.</div>
      </div>
      <div style={s.insightCard}>
        <div style={s.insightTitle}>Aligned with Islamic principles?</div>
        <div style={s.insightText}>Review income sources, expenses, and investments for Shariah compliance.</div>
      </div>
      <div style={s.insightCard}>
        <div style={s.insightTitle}>Next financial action</div>
        <div style={s.insightText}>Define one concrete action this week to improve your financial position.</div>
      </div>
    </div>
  );

  const renderDashboardTab = () => (
    <div style={s.dashGrid}>
      <div style={s.card}>
        <div style={s.cardTitle}>Monthly Income</div>
        <div style={{ ...s.cardValue, color: '#166534' }}>{toCurrency(totalIncome)}</div>
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Monthly Expenses</div>
        <div style={{ ...s.cardValue, color: '#991b1b' }}>{toCurrency(totalExpenses)}</div>
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Net This Month</div>
        <div style={{ ...s.cardValue, color: netThisMonth >= 0 ? '#166534' : '#991b1b' }}>{toCurrency(netThisMonth)}</div>
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Savings Rate</div>
        <div style={{ ...s.cardValue, color: savingsRate >= 20 ? '#166534' : savingsRate > 0 ? '#854d0e' : '#991b1b' }}>{savingsRate.toFixed(1)}%</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{savingsRate >= 20 ? 'Healthy' : savingsRate > 0 ? 'Low' : 'Negative'}</div>
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Active Purchase Goals</div>
        <div style={s.cardValue}>{activeGoals.length}</div>
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Purchase Saved / Target</div>
        <div style={{ fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>{toCurrency(totalGoalSaved)} / {toCurrency(totalGoalTarget)}</div>
        {totalGoalTarget > 0 && (
          <div style={{ marginTop: '8px' }}>
            <div style={s.bar((totalGoalSaved / totalGoalTarget) * 100)}>
              <div style={s.fill((totalGoalSaved / totalGoalTarget) * 100, '#2563eb')} />
            </div>
          </div>
        )}
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Investments Under Review</div>
        <div style={{ ...s.cardValue, color: investmentUnderReview.length > 0 ? '#c2410c' : '#64748b' }}>{investmentUnderReview.length}</div>
      </div>
      <div style={s.card}>
        <div style={s.cardTitle}>Ethical Warnings</div>
        <div style={{ ...s.cardValue, color: ethicalWarnings.length > 0 ? '#991b1b' : '#166534' }}>{ethicalWarnings.length}</div>
        <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>needs_review or avoid</div>
      </div>
    </div>
  );

  const renderIncomeTab = () => (
    <div>
      <div style={s.sectionRow}>
        <h3 style={s.sectionHdr}>Income</h3>
        <button style={s.btn('#2563eb')} onClick={() => openModal('income')}>+ Add Income</button>
      </div>
      {financeIncome.length === 0 ? <div style={s.empty}>No income entries yet.</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Title', 'Source', 'Amount', 'Date', 'Status', ''].map((h) => <th key={h} style={{ textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', padding: '8px 12px', borderBottom: '2px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {financeIncome.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{item.title}</td>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{item.source}</td>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{toCurrency(item.amount, item.currency)}</td>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{item.incomeDate ? new Date(item.incomeDate).toLocaleDateString() : '-'}</td>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}><span style={s.badge(item.status === 'received' ? 'green' : item.status === 'delayed' ? 'yellow' : item.status === 'cancelled' ? 'red' : 'blue')}>{item.status}</span></td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>
                  <button style={s.iconBtn} onClick={() => openModal('income', item)}>Edit</button>
                  <button style={{ ...s.iconBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceIncome(item.id)}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderExpensesTab = () => (
    <div>
      <div style={s.sectionRow}>
        <h3 style={s.sectionHdr}>Expenses</h3>
        <button style={s.btn('#2563eb')} onClick={() => openModal('expenses')}>+ Add Expense</button>
      </div>
      {financeExpenses.length === 0 ? <div style={s.empty}>No expenses yet.</div> : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {['Title', 'Category', 'Amount', 'Date', 'Status', ''].map((h) => <th key={h} style={{ textAlign: 'left', fontSize: '12px', fontWeight: 600, color: '#64748b', padding: '8px 12px', borderBottom: '2px solid #e5e7eb', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {financeExpenses.map((item) => (
              <tr key={item.id}>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{item.title}</td>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}><span style={s.badge('gray')}>{item.category}</span></td>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{toCurrency(item.amount, item.currency)}</td>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}>{item.expenseDate ? new Date(item.expenseDate).toLocaleDateString() : '-'}</td>
                <td style={{ padding: '10px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' }}><span style={s.badge(item.status === 'paid' ? 'green' : item.status === 'unpaid' ? 'yellow' : item.status === 'cancelled' ? 'red' : 'blue')}>{item.status}</span></td>
                <td style={{ padding: '10px 12px', borderBottom: '1px solid #e5e7eb' }}>
                  <button style={s.iconBtn} onClick={() => openModal('expenses', item)}>Edit</button>
                  <button style={{ ...s.iconBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceExpense(item.id)}>Del</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  const renderAllocationTab = () => (
    <div>
      <div style={s.sectionRow}>
        <h3 style={s.sectionHdr}>Allocation Rules</h3>
        <button style={s.btn('#2563eb')} onClick={() => openModal('allocation')}>+ Add Rule</button>
      </div>
      {financeAllocationRules.length === 0 ? (
        <div style={s.empty}>
          <p style={{ marginBottom: '16px' }}>No allocation rules yet.</p>
          <button style={s.btn('#2563eb')} onClick={createStarterAllocation}>Create Starter Allocation System</button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: totalAllocationPct === 100 ? '#f0fdf4' : '#fef9c3', border: `1px solid ${totalAllocationPct === 100 ? '#bbf7d0' : '#fde68a'}`, borderRadius: '8px', fontSize: '14px', color: totalAllocationPct === 100 ? '#166534' : '#854d0e' }}>
            {totalAllocationPct === 100 ? 'Allocation total is 100%. Rules are balanced.' : `Allocation total is ${totalAllocationPct}%. Adjust rules to reach 100%.`}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {financeAllocationRules.map((rule) => (
              <div key={rule.id} style={{ ...s.card, opacity: rule.isActive ? 1 : 0.5 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{rule.name}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{rule.category} · Priority {rule.priority}</div>
                  </div>
                  <div style={{ fontSize: '24px', fontWeight: 700, color: '#2563eb' }}>{rule.percentage}%</div>
                </div>
                {rule.notes && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>{rule.notes}</div>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={rule.isActive} onChange={() => toggleAllocationActive(rule)} />
                    Active
                  </label>
                  <button style={s.iconBtn} onClick={() => openModal('allocation', rule)}>Edit</button>
                  <button style={{ ...s.iconBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceAllocationRule(rule.id)}>Del</button>
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
      <div style={s.sectionRow}>
        <div>
          <h3 style={s.sectionHdr}>Purchase Goals Pro</h3>
          <div style={{ fontSize: '13px', color: '#64748b', marginTop: '2px' }}>Product wishlist and acquisition planning</div>
        </div>
        <button style={s.btn('#2563eb')} onClick={() => openModal('purchase_goals')}>+ Add Goal</button>
      </div>
      {financePurchaseGoals.length === 0 ? <div style={s.empty}>No purchase goals yet. Add your first goal.</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '16px' }}>
          {financePurchaseGoals.map((goal) => {
            const pct = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
            return (
              <div key={goal.id} style={s.goalCard}>
                {goal.imageUrl ? (
                  <img src={goal.imageUrl} alt={goal.title} style={s.goalImg} onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                ) : (
                  <div style={s.goalPlaceholder}>
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="M21 15l-5-5L5 21"/></svg>
                  </div>
                )}
                <div style={s.goalBody}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '16px' }}>{goal.title}</div>
                      {goal.vendor && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{goal.vendor}</div>}
                      <div style={{ fontSize: '12px', color: '#64748b', marginTop: '1px' }}>{goal.category}</div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', alignItems: 'flex-end' }}>
                      <span style={s.badge(goal.priority === 'high' ? 'red' : goal.priority === 'medium' ? 'yellow' : 'gray')}>{goal.priority}</span>
                      <span style={s.badge(goal.status === 'bought' ? 'green' : goal.status === 'saving' ? 'blue' : goal.status === 'paused' ? 'yellow' : goal.status === 'cancelled' ? 'red' : 'gray')}>{goal.status}</span>
                      <span style={s.badge(goal.decisionStatus === 'bought' ? 'green' : goal.decisionStatus === 'approved' ? 'blue' : goal.decisionStatus === 'waiting' ? 'yellow' : goal.decisionStatus === 'rejected' ? 'red' : 'purple')}>{goal.decisionStatus}</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '12px' }}>
                    <div style={s.bar(pct)}><div style={s.fill(pct, '#2563eb')} /></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                      <span>Saved: {toCurrency(goal.savedAmount, goal.currency)}</span>
                      <span>Target: {toCurrency(goal.targetAmount, goal.currency)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px', fontSize: '12px', color: '#64748b' }}>
                    {goal.targetDate && <span>Target: {new Date(goal.targetDate).toLocaleDateString()}</span>}
                    {goal.productUrl && <a href={goal.productUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#2563eb', textDecoration: 'underline' }}>Open Product</a>}
                    {goal.linkedProjectName && <span>Project: {goal.linkedProjectName}</span>}
                  </div>
                  {goal.reason && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '6px' }}>Why: {goal.reason}</div>}
                  {goal.expectedUse && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Use: {goal.expectedUse}</div>}
                </div>
                <div style={s.goalActions}>
                  <button style={s.btnSml('#2563eb')} onClick={() => { setAddSavedGoalId(goal.id); setAddSavedAmount(''); }}>+ Saved</button>
                  <button style={s.btnSml('#166534')} onClick={() => handleQuickAction(goal, { status: 'bought', decisionStatus: 'bought' })}>Bought</button>
                  <button style={s.btnSml('#854d0e')} onClick={() => handleQuickAction(goal, { decisionStatus: 'waiting' })}>Waiting</button>
                  <button style={s.btnSml('#991b1b')} onClick={() => handleQuickAction(goal, { decisionStatus: 'rejected' })}>Reject</button>
                  <div style={s.flexEnd}>
                    <button style={s.iconBtn} onClick={() => openModal('purchase_goals', goal)}>Edit</button>
                    <button style={{ ...s.iconBtn, color: '#991b1b' }} onClick={() => onDeleteFinancePurchaseGoal(goal.id)}>Del</button>
                  </div>
                </div>
                {addSavedGoalId === goal.id && (
                  <div style={{ padding: '12px 16px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <input style={{ ...s.input, width: 'auto', flex: 1 }} type="number" step="0.01" placeholder="Amount" value={addSavedAmount} onChange={(e) => setAddSavedAmount(e.target.value)} autoFocus />
                    <button style={s.btnSml('#2563eb')} onClick={() => handleAddSaved(goal)}>Add</button>
                    <button style={s.btnOut} onClick={() => { setAddSavedGoalId(null); setAddSavedAmount(''); }}>Cancel</button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderInvestmentTab = () => (
    <div>
      <div style={s.sectionRow}>
        <div>
          <h3 style={s.sectionHdr}>Investment Ideas</h3>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>Not financial advice. Tracking and planning only.</div>
        </div>
        <button style={s.btn('#2563eb')} onClick={() => openModal('investments')}>+ Add Idea</button>
      </div>
      {financeInvestmentIdeas.length === 0 ? <div style={s.empty}>No investment ideas yet.</div> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {financeInvestmentIdeas.map((idea) => (
            <div key={idea.id} style={s.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{idea.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{idea.type}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span style={s.badge(idea.ethicalStatus === 'good' ? 'green' : idea.ethicalStatus === 'needs_review' ? 'yellow' : 'red')}>{idea.ethicalStatus}</span>
                  <span style={s.badge(idea.status === 'invested' ? 'green' : idea.status === 'researching' ? 'blue' : idea.status === 'rejected' ? 'red' : 'gray')}>{idea.status}</span>
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#0f172a' }}>Amount: {toCurrency(idea.plannedAmount, idea.currency)}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Risk: <span style={s.badge(idea.riskLevel === 'high' ? 'red' : idea.riskLevel === 'medium' ? 'yellow' : 'green')}>{idea.riskLevel}</span></div>
              {idea.expectedReason && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Reason: {idea.expectedReason}</div>}
              {idea.notes && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Notes: {idea.notes}</div>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button style={s.iconBtn} onClick={() => openModal('investments', idea)}>Edit</button>
                <button style={{ ...s.iconBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceInvestmentIdea(idea.id)}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReviewTab = () => (
    <div>
      <h3 style={s.sectionHdr}>Finance Review</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
        {['What increased income this month?', 'What expenses were unnecessary?', 'What should be reduced next month?', 'What should be invested only after research?', 'What is not aligned with Islamic principles?', 'What is the next financial action?'].map((q, i) => (
          <div key={i} style={s.card}>
            <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>{q}</div>
            <div style={{ fontSize: '13px', color: '#64748b' }}>Review and reflect on this question to improve your financial decisions.</div>
          </div>
        ))}
      </div>
    </div>
  );

  const renderModalForm = () => {
    if (!modal) return null;
    const isNew = !modal.editing;
    const titles: Record<string, string> = { income: isNew ? 'Add Income' : 'Edit Income', expenses: isNew ? 'Add Expense' : 'Edit Expense', allocation: isNew ? 'Add Allocation Rule' : 'Edit Allocation Rule', purchase_goals: isNew ? 'Add Purchase Goal' : 'Edit Purchase Goal', investments: isNew ? 'Add Investment Idea' : 'Edit Investment Idea' };

    const fields = () => {
      switch (modal.type) {
        case 'income': return (
          <div style={s.formGrid}>
            {[['Title *', 'title', 'text'], ['Amount *', 'amount', 'number'], ['Income Date', 'incomeDate', 'date'], ['Source', 'source', 'select', INCOME_SOURCES], ['Status', 'status', 'select', INCOME_STATUSES], ['Currency', 'currency', 'select', ['MYR', 'USD', 'EUR', 'SGD']]].map(([label, key, type, opts]: any) => (
              <div key={key}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{label}</label>
                {type === 'select' ? (
                  <select style={s.select} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}>
                    <option value="">Select</option>
                    {opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : (
                  <input style={s.input} type={type} step={type === 'number' ? '0.01' : undefined} placeholder={type === 'text' ? String(label).replace(' *', '') : ''} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value })} />
                )}
              </div>
            ))}
            <div><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Project</label><select style={s.select} value={form.linkedProjectId || ''} onChange={(e) => setForm({ ...form, linkedProjectId: e.target.value || undefined })}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Company</label><select style={s.select} value={form.linkedCompanyId || ''} onChange={(e) => setForm({ ...form, linkedCompanyId: e.target.value || undefined })}><option value="">None</option>{companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        );
        case 'expenses': return (
          <div style={s.formGrid}>
            {[['Title *', 'title', 'text'], ['Amount *', 'amount', 'number'], ['Expense Date', 'expenseDate', 'date'], ['Category', 'category', 'select', EXPENSE_CATEGORIES], ['Status', 'status', 'select', EXPENSE_STATUSES], ['Currency', 'currency', 'select', ['MYR', 'USD', 'EUR', 'SGD']]].map(([label, key, type, opts]: any) => (
              <div key={key}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{label}</label>
                {type === 'select' ? <select style={s.select} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}><option value="">Select</option>{opts.map((o: string) => <option key={o} value={o}>{o}</option>)}</select> : <input style={s.input} type={type} step={type === 'number' ? '0.01' : undefined} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value })} />}
              </div>
            ))}
            <div><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Project</label><select style={s.select} value={form.linkedProjectId || ''} onChange={(e) => setForm({ ...form, linkedProjectId: e.target.value || undefined })}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        );
        case 'allocation': return (
          <div style={s.formGrid}>
            {[['Name *', 'name', 'text'], ['Category', 'category', 'select', ALLOCATION_CATEGORIES], ['Percentage (0-100)', 'percentage', 'number'], ['Priority', 'priority', 'number']].map(([label, key, type, opts]: any) => (
              <div key={key}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{label}</label>
                {type === 'select' ? <select style={s.select} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}><option value="">Select</option>{opts.map((o: string) => <option key={o} value={o}>{o}</option>)}</select> : <input style={s.input} type={type} min="0" max="100" step={type === 'number' ? '1' : undefined} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: type === 'number' ? Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) : e.target.value })} />}
              </div>
            ))}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}><input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="alloc-active" /><label htmlFor="alloc-active" style={{ fontSize: '13px', color: '#0f172a' }}>Active</label></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        );
        case 'purchase_goals': return (
          <div style={s.formGrid}>
            {[['Title *', 'title', 'text'], ['Target Amount *', 'targetAmount', 'number'], ['Saved Amount', 'savedAmount', 'number'], ['Category', 'category', 'select', EXPENSE_CATEGORIES], ['Priority', 'priority', 'select', GOAL_PRIORITIES], ['Status', 'status', 'select', GOAL_STATUSES], ['Decision Status', 'decisionStatus', 'select', DECISION_STATUSES], ['Currency', 'currency', 'select', ['MYR', 'USD', 'EUR', 'SGD']], ['Target Date', 'targetDate', 'date'], ['Product URL', 'productUrl', 'url'], ['Image URL', 'imageUrl', 'url'], ['Vendor', 'vendor', 'text']].map(([label, key, type, opts]: any) => (
              <div key={key}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{label}</label>
                {type === 'select' ? <select style={s.select} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}><option value="">Select</option>{opts.map((o: string) => <option key={o} value={o}>{o}</option>)}</select> : <input style={s.input} type={type} step={type === 'number' ? '0.01' : undefined} placeholder={type === 'url' ? 'https://...' : ''} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: type === 'number' ? Math.max(0, parseFloat(e.target.value) || 0) : e.target.value })} />}
              </div>
            ))}
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Reason</label><textarea style={s.input} rows={2} value={form.reason || ''} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Expected Use</label><textarea style={s.input} rows={2} value={form.expectedUse || ''} onChange={(e) => setForm({ ...form, expectedUse: e.target.value })} /></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Alternatives</label><textarea style={s.input} rows={2} value={form.alternatives || ''} onChange={(e) => setForm({ ...form, alternatives: e.target.value })} /></div>
            <div><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Project</label><select style={s.select} value={form.linkedProjectId || ''} onChange={(e) => setForm({ ...form, linkedProjectId: e.target.value || undefined })}><option value="">None</option>{projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        );
        case 'investments': return (
          <div style={s.formGrid}>
            {[['Title *', 'title', 'text'], ['Planned Amount', 'plannedAmount', 'number'], ['Type', 'type', 'select', INVESTMENT_TYPES], ['Risk Level', 'riskLevel', 'select', RISK_LEVELS], ['Ethical Status', 'ethicalStatus', 'select', ETHICAL_STATUSES], ['Status', 'status', 'select', INVESTMENT_STATUSES], ['Currency', 'currency', 'select', ['MYR', 'USD', 'EUR', 'SGD']], ['Expected Reason', 'expectedReason', 'text']].map(([label, key, type, opts]: any) => (
              <div key={key}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>{label}</label>
                {type === 'select' ? <select style={s.select} value={form[key] || ''} onChange={(e) => setForm({ ...form, [key]: e.target.value })}><option value="">Select</option>{opts.map((o: string) => <option key={o} value={o}>{o}</option>)}</select> : <input style={s.input} type={type} step={type === 'number' ? '0.01' : undefined} value={form[key] ?? ''} onChange={(e) => setForm({ ...form, [key]: type === 'number' ? (parseFloat(e.target.value) || 0) : e.target.value })} />}
              </div>
            ))}
            <div style={s.fullW}><label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label><textarea style={s.input} rows={2} value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} /></div>
          </div>
        );
        default: return null;
      }
    };

    return (
      <div style={s.modalOverlay} onClick={closeModal}>
        <div style={s.modal} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>{titles[modal.type]}</h3>
          {fields()}
          <div style={s.modalActions}>
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
            {tabs.map((tab) => (
              <button key={tab} style={s.navBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>{tabLabels[tab]}</button>
            ))}
          </div>
          {activeTab === 'dashboard' && renderDashboardTab()}
          {activeTab === 'income' && renderIncomeTab()}
          {activeTab === 'expenses' && renderExpensesTab()}
          {activeTab === 'allocation' && renderAllocationTab()}
          {activeTab === 'purchase_goals' && renderPurchaseGoalsTab()}
          {activeTab === 'investments' && renderInvestmentTab()}
          {activeTab === 'review' && renderReviewTab()}
          {modal && renderModalForm()}
        </div>
        {renderInsightPanel()}
      </div>
    </div>
  );
}
