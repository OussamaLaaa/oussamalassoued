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
const INVESTMENT_TYPES = ['stocks', 'real_estate', 'business', 'crypto', 'gold', 'sukuk', 'other'];
const RISK_LEVELS = ['low', 'medium', 'high'];
const ETHICAL_STATUSES = ['good', 'needs_review', 'avoid'];
const INVESTMENT_STATUSES = ['researching', 'waiting', 'planned', 'invested', 'rejected'];
const ALLOCATION_CATEGORIES = ['needs', 'savings', 'investment', 'family', 'learning', 'health', 'giving', 'other'];

const STYLE = {
  page: { padding: '24px', maxWidth: '1200px', margin: '0 auto' },
  nav: { display: 'flex', gap: '8px', flexWrap: 'wrap' as const, marginBottom: '24px', borderBottom: '1px solid #e5e7eb', paddingBottom: '12px' },
  navBtn: (active: boolean) => ({ padding: '8px 16px', fontSize: '14px', fontWeight: 500 as const, color: active ? '#2563eb' : '#64748b', background: active ? '#eff6ff' : 'transparent', border: active ? '1px solid #bfdbfe' : '1px solid transparent', borderRadius: '6px', cursor: 'pointer' }),
  card: { background: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px' },
  cardTitle: { fontSize: '14px', color: '#64748b', marginBottom: '4px' },
  cardValue: { fontSize: '24px', fontWeight: 700 as const, color: '#0f172a' },
  dashboardGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  sectionHeader: { fontSize: '18px', fontWeight: 700 as const, color: '#0f172a', marginBottom: '16px' },
  table: { width: '100%', borderCollapse: 'collapse' as const },
  th: { textAlign: 'left' as const, fontSize: '12px', fontWeight: 600 as const, color: '#64748b', padding: '8px 12px', borderBottom: '2px solid #e5e7eb', textTransform: 'uppercase' as const, letterSpacing: '0.05em' },
  td: { padding: '8px 12px', fontSize: '14px', color: '#0f172a', borderBottom: '1px solid #e5e7eb' },
  badge: (color: string) => ({ display: 'inline-block', padding: '2px 8px', fontSize: '11px', fontWeight: 600 as const, borderRadius: '999px', background: color === 'green' ? '#dcfce7' : color === 'red' ? '#fef2f2' : color === 'yellow' ? '#fef9c3' : color === 'blue' ? '#eff6ff' : color === 'gray' ? '#f1f5f9' : '#f1f5f9', color: color === 'green' ? '#166534' : color === 'red' ? '#991b1b' : color === 'yellow' ? '#854d0e' : color === 'blue' ? '#1d4ed8' : '#475569' }),
  input: { width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#0f172a', background: '#ffffff', boxSizing: 'border-box' as const },
  select: { width: '100%', padding: '8px 12px', fontSize: '14px', border: '1px solid #e5e7eb', borderRadius: '6px', color: '#0f172a', background: '#ffffff', boxSizing: 'border-box' as const },
  btn: (color: string) => ({ padding: '6px 14px', fontSize: '13px', fontWeight: 600 as const, border: 'none', borderRadius: '6px', cursor: 'pointer', background: color, color: '#ffffff' }),
  btnOutline: { padding: '4px 10px', fontSize: '12px', fontWeight: 500 as const, border: '1px solid #e5e7eb', borderRadius: '4px', cursor: 'pointer', background: '#ffffff', color: '#64748b' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px', marginBottom: '12px' },
  modalOverlay: { position: 'fixed' as const, inset: '0', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center' as const, justifyContent: 'center' as const, zIndex: 1000 },
  modalContent: { background: '#ffffff', borderRadius: '12px', padding: '24px', width: '90%', maxWidth: '600px', maxHeight: '80vh', overflowY: 'auto' as const },
  formActions: { display: 'flex', gap: '8px', justifyContent: 'flex-end' as const, marginTop: '16px' },
  progressBar: (pct: number) => ({ height: '8px', background: '#e5e7eb', borderRadius: '999px', overflow: 'hidden' as const }),
  progressFill: (pct: number, color: string) => ({ height: '100%', width: `${Math.min(100, Math.max(0, pct))}%`, background: color, borderRadius: '999px', transition: 'width 0.3s' }),
  iconBtn: { padding: '4px 8px', fontSize: '12px', border: 'none', borderRadius: '4px', cursor: 'pointer', background: 'transparent', color: '#64748b' },
  emptyState: { textAlign: 'center' as const, padding: '40px', color: '#64748b', fontSize: '14px' },
};

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();

const toCurrency = (amount: number, currency = 'MYR') => `${currency} ${Number(amount).toLocaleString('en', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const isCurrentMonth = (dateStr?: string) => {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
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

  const activeAllocationRules = useMemo(() => financeAllocationRules.filter((r) => r.isActive), [financeAllocationRules]);
  const totalAllocationPct = useMemo(() => activeAllocationRules.reduce((s, r) => s + r.percentage, 0), [activeAllocationRules]);

  const monthlyIncome = useMemo(() => financeIncome.filter((i) => i.status === 'received' && isCurrentMonth(i.incomeDate)), [financeIncome]);
  const monthlyExpenses = useMemo(() => financeExpenses.filter((e) => e.status === 'paid' && isCurrentMonth(e.expenseDate)), [financeExpenses]);
  const totalIncome = useMemo(() => monthlyIncome.reduce((s, i) => s + i.amount, 0), [monthlyIncome]);
  const totalExpenses = useMemo(() => monthlyExpenses.reduce((s, e) => s + e.amount, 0), [monthlyExpenses]);
  const netThisMonth = totalIncome - totalExpenses;
  const savingsPotential = netThisMonth > 0 ? netThisMonth : 0;
  const activeGoals = useMemo(() => financePurchaseGoals.filter((g) => g.status === 'saving' || g.status === 'planned'), [financePurchaseGoals]);
  const totalGoalTarget = useMemo(() => activeGoals.reduce((s, g) => s + g.targetAmount, 0), [activeGoals]);
  const totalGoalSaved = useMemo(() => activeGoals.reduce((s, g) => s + g.savedAmount, 0), [activeGoals]);
  const investmentUnderReview = useMemo(() => financeInvestmentIdeas.filter((i) => i.ethicalStatus === 'needs_review'), [financeInvestmentIdeas]);

  const openModal = (type: FinanceTab, editing?: any) => {
    setModal({ type, editing });
    if (editing) {
      setForm({ ...editing });
    } else {
      setForm({ currency: 'MYR', status: type === 'income' ? 'expected' : type === 'expenses' ? 'planned' : type === 'purchase_goals' ? 'planned' : type === 'investments' ? 'researching' : 'medium', isActive: true, priority: 0 });
    }
  };

  const closeModal = () => {
    setModal(null);
    setForm({});
  };

  const handleSave = async () => {
    if (!modal) return;
    try {
      if (modal.type === 'income') {
        if (modal.editing) {
          await onUpdateFinanceIncome(modal.editing.id, form);
        } else {
          await onAddFinanceIncome(form);
        }
      } else if (modal.type === 'expenses') {
        if (modal.editing) {
          await onUpdateFinanceExpense(modal.editing.id, form);
        } else {
          await onAddFinanceExpense(form);
        }
      } else if (modal.type === 'allocation') {
        if (modal.editing) {
          await onUpdateFinanceAllocationRule(modal.editing.id, form);
        } else {
          await onAddFinanceAllocationRule(form);
        }
      } else if (modal.type === 'purchase_goals') {
        if (modal.editing) {
          await onUpdateFinancePurchaseGoal(modal.editing.id, form);
        } else {
          await onAddFinancePurchaseGoal(form);
        }
      } else if (modal.type === 'investments') {
        if (modal.editing) {
          await onUpdateFinanceInvestmentIdea(modal.editing.id, form);
        } else {
          await onAddFinanceInvestmentIdea(form);
        }
      }
      closeModal();
    } catch (err: any) {
      alert(err.message);
    }
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
    for (const rule of defaults) {
      await onAddFinanceAllocationRule(rule);
    }
  };

  const renderDashboardTab = () => (
    <>
      <div style={STYLE.dashboardGrid}>
        <div style={STYLE.card}>
          <div style={STYLE.cardTitle}>Total Income This Month</div>
          <div style={{ ...STYLE.cardValue, color: '#166534' }}>{toCurrency(totalIncome)}</div>
        </div>
        <div style={STYLE.card}>
          <div style={STYLE.cardTitle}>Total Expenses This Month</div>
          <div style={{ ...STYLE.cardValue, color: '#991b1b' }}>{toCurrency(totalExpenses)}</div>
        </div>
        <div style={STYLE.card}>
          <div style={STYLE.cardTitle}>Net This Month</div>
          <div style={{ ...STYLE.cardValue, color: netThisMonth >= 0 ? '#166534' : '#991b1b' }}>{toCurrency(netThisMonth)}</div>
        </div>
        <div style={STYLE.card}>
          <div style={STYLE.cardTitle}>Savings Potential</div>
          <div style={{ ...STYLE.cardValue, color: '#2563eb' }}>{toCurrency(savingsPotential)}</div>
        </div>
        <div style={STYLE.card}>
          <div style={STYLE.cardTitle}>Active Purchase Goals</div>
          <div style={STYLE.cardValue}>{activeGoals.length}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Target: {toCurrency(totalGoalTarget)}</div>
          <div style={{ fontSize: '12px', color: '#64748b' }}>Saved: {toCurrency(totalGoalSaved)}</div>
        </div>
        <div style={STYLE.card}>
          <div style={STYLE.cardTitle}>Investments Under Review</div>
          <div style={{ ...STYLE.cardValue, color: investmentUnderReview.length > 0 ? '##f59e0b' : '#64748b' }}>{investmentUnderReview.length}</div>
          <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Ethical review needed</div>
        </div>
      </div>
    </>
  );

  const renderIncomeForm = (editing?: any) => (
    <div style={STYLE.formGrid}>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Title *</label>
        <input style={STYLE.input} placeholder="Income title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </div>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Source</label>
        <select style={STYLE.select} value={form.source || ''} onChange={(e) => setForm({ ...form, source: e.target.value })}>
          <option value="">Select source</option>
          {INCOME_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Amount *</label>
        <input style={STYLE.input} type="number" step="0.01" placeholder="0.00" value={form.amount ?? ''} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
      </div>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Currency</label>
        <select style={STYLE.select} value={form.currency || 'MYR'} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
          <option value="MYR">MYR</option>
          <option value="USD">USD</option>
          <option value="EUR">EUR</option>
          <option value="SGD">SGD</option>
        </select>
      </div>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Income Date</label>
        <input style={STYLE.input} type="date" value={form.incomeDate || ''} onChange={(e) => setForm({ ...form, incomeDate: e.target.value })} />
      </div>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Status</label>
        <select style={STYLE.select} value={form.status || 'expected'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
          {INCOME_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Project</label>
        <select style={STYLE.select} value={form.linkedProjectId || ''} onChange={(e) => setForm({ ...form, linkedProjectId: e.target.value || undefined })}>
          <option value="">None</option>
          {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Company</label>
        <select style={STYLE.select} value={form.linkedCompanyId || ''} onChange={(e) => setForm({ ...form, linkedCompanyId: e.target.value || undefined })}>
          <option value="">None</option>
          {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label>
        <textarea style={STYLE.input} rows={2} placeholder="Optional notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
      </div>
    </div>
  );

  const renderIncomeTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Income</h3>
        <button style={STYLE.btn('#2563eb')} onClick={() => openModal('income')}>+ Add Income</button>
      </div>
      {financeIncome.length === 0 ? (
        <div style={STYLE.emptyState}>No income entries yet. Add your first income entry.</div>
      ) : (
        <table style={STYLE.table}>
          <thead>
            <tr>
              <th style={STYLE.th}>Title</th>
              <th style={STYLE.th}>Source</th>
              <th style={STYLE.th}>Amount</th>
              <th style={STYLE.th}>Date</th>
              <th style={STYLE.th}>Status</th>
              <th style={STYLE.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {financeIncome.map((item) => (
              <tr key={item.id}>
                <td style={STYLE.td}>{item.title}</td>
                <td style={STYLE.td}>{item.source}</td>
                <td style={STYLE.td}>{toCurrency(item.amount, item.currency)}</td>
                <td style={STYLE.td}>{item.incomeDate ? new Date(item.incomeDate).toLocaleDateString() : '-'}</td>
                <td style={STYLE.td}><span style={STYLE.badge(item.status === 'received' ? 'green' : item.status === 'delayed' ? 'yellow' : item.status === 'cancelled' ? 'red' : 'blue')}>{item.status}</span></td>
                <td style={STYLE.td}>
                  <button style={STYLE.iconBtn} onClick={() => openModal('income', item)}>Edit</button>
                  <button style={{ ...STYLE.iconBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceIncome(item.id)}>Del</button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Expenses</h3>
        <button style={STYLE.btn('#2563eb')} onClick={() => openModal('expenses')}>+ Add Expense</button>
      </div>
      {financeExpenses.length === 0 ? (
        <div style={STYLE.emptyState}>No expenses yet. Add your first expense entry.</div>
      ) : (
        <table style={STYLE.table}>
          <thead>
            <tr>
              <th style={STYLE.th}>Title</th>
              <th style={STYLE.th}>Category</th>
              <th style={STYLE.th}>Amount</th>
              <th style={STYLE.th}>Date</th>
              <th style={STYLE.th}>Status</th>
              <th style={STYLE.th}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {financeExpenses.map((item) => (
              <tr key={item.id}>
                <td style={STYLE.td}>{item.title}</td>
                <td style={STYLE.td}><span style={STYLE.badge('gray')}>{item.category}</span></td>
                <td style={STYLE.td}>{toCurrency(item.amount, item.currency)}</td>
                <td style={STYLE.td}>{item.expenseDate ? new Date(item.expenseDate).toLocaleDateString() : '-'}</td>
                <td style={STYLE.td}><span style={STYLE.badge(item.status === 'paid' ? 'green' : item.status === 'unpaid' ? 'yellow' : item.status === 'cancelled' ? 'red' : 'blue')}>{item.status}</span></td>
                <td style={STYLE.td}>
                  <button style={STYLE.iconBtn} onClick={() => openModal('expenses', item)}>Edit</button>
                  <button style={{ ...STYLE.iconBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceExpense(item.id)}>Del</button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Allocation Rules</h3>
        <button style={STYLE.btn('#2563eb')} onClick={() => openModal('allocation')}>+ Add Rule</button>
      </div>
      {financeAllocationRules.length === 0 ? (
        <div style={STYLE.emptyState}>
          <p style={{ marginBottom: '16px' }}>No allocation rules yet. Create a starter allocation system or add rules manually.</p>
          <button style={STYLE.btn('#2563eb')} onClick={createStarterAllocation}>Create Starter Allocation System</button>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: totalAllocationPct === 100 ? '#f0fdf4' : '#fef9c3', border: `1px solid ${totalAllocationPct === 100 ? '#bbf7d0' : '#fde68a'}`, borderRadius: '8px', fontSize: '14px', color: totalAllocationPct === 100 ? '#166534' : '#854d0e' }}>
            {totalAllocationPct === 100
              ? 'Allocation total is 100%. Rules are balanced.'
              : `Allocation total is ${totalAllocationPct}%. Adjust rules to reach 100%.`
            }
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '12px' }}>
            {financeAllocationRules.map((rule) => (
              <div key={rule.id} style={{ ...STYLE.card, opacity: rule.isActive ? 1 : 0.5 }}>
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
                  <button style={STYLE.iconBtn} onClick={() => openModal('allocation', rule)}>Edit</button>
                  <button style={{ ...STYLE.iconBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceAllocationRule(rule.id)}>Del</button>
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
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Purchase Goals</h3>
        <button style={STYLE.btn('#2563eb')} onClick={() => openModal('purchase_goals')}>+ Add Goal</button>
      </div>
      {financePurchaseGoals.length === 0 ? (
        <div style={STYLE.emptyState}>No purchase goals yet. Add your first purchase goal.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {financePurchaseGoals.map((goal) => {
            const pct = goal.targetAmount > 0 ? (goal.savedAmount / goal.targetAmount) * 100 : 0;
            return (
              <div key={goal.id} style={STYLE.card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{goal.title}</div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{goal.category} · <span style={STYLE.badge(goal.priority === 'high' ? 'red' : goal.priority === 'medium' ? 'yellow' : 'gray')}>{goal.priority}</span></div>
                  </div>
                  <span style={STYLE.badge(goal.status === 'bought' ? 'green' : goal.status === 'saving' ? 'blue' : goal.status === 'paused' ? 'yellow' : goal.status === 'cancelled' ? 'red' : 'gray')}>{goal.status}</span>
                </div>
                <div style={{ marginTop: '12px' }}>
                  <div style={STYLE.progressBar(pct)}>
                    <div style={STYLE.progressFill(pct, '#2563eb')} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px', fontSize: '12px', color: '#64748b' }}>
                    <span>Saved: {toCurrency(goal.savedAmount, goal.currency)}</span>
                    <span>Target: {toCurrency(goal.targetAmount, goal.currency)}</span>
                  </div>
                </div>
                {goal.targetDate && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '8px' }}>Target date: {new Date(goal.targetDate).toLocaleDateString()}</div>}
                {goal.linkedProjectName && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Project: {goal.linkedProjectName}</div>}
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <button style={STYLE.iconBtn} onClick={() => openModal('purchase_goals', goal)}>Edit</button>
                  <button style={{ ...STYLE.iconBtn, color: '#991b1b' }} onClick={() => onDeleteFinancePurchaseGoal(goal.id)}>Del</button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderInvestmentTab = () => (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Investment Ideas</h3>
        <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>Not financial advice. Tracking and planning only.</p>
        <button style={STYLE.btn('#2563eb')} onClick={() => openModal('investments')}>+ Add Idea</button>
      </div>
      {financeInvestmentIdeas.length === 0 ? (
        <div style={STYLE.emptyState}>No investment ideas yet. Track your ideas here for research and planning.</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px' }}>
          {financeInvestmentIdeas.map((idea) => (
            <div key={idea.id} style={STYLE.card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontWeight: 700, color: '#0f172a', fontSize: '15px' }}>{idea.title}</div>
                  <div style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>{idea.type}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                  <span style={STYLE.badge(idea.ethicalStatus === 'good' ? 'green' : idea.ethicalStatus === 'needs_review' ? 'yellow' : 'red')}>{idea.ethicalStatus}</span>
                  <span style={STYLE.badge(idea.status === 'invested' ? 'green' : idea.status === 'researching' ? 'blue' : idea.status === 'rejected' ? 'red' : 'gray')}>{idea.status}</span>
                </div>
              </div>
              <div style={{ marginTop: '8px', fontSize: '13px', color: '#0f172a' }}>Amount: {toCurrency(idea.plannedAmount, idea.currency)}</div>
              <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>
                Risk: <span style={STYLE.badge(idea.riskLevel === 'high' ? 'red' : idea.riskLevel === 'medium' ? 'yellow' : 'green')}>{idea.riskLevel}</span>
              </div>
              {idea.expectedReason && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Reason: {idea.expectedReason}</div>}
              {idea.notes && <div style={{ fontSize: '12px', color: '#64748b', marginTop: '4px' }}>Notes: {idea.notes}</div>}
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button style={STYLE.iconBtn} onClick={() => openModal('investments', idea)}>Edit</button>
                <button style={{ ...STYLE.iconBtn, color: '#991b1b' }} onClick={() => onDeleteFinanceInvestmentIdea(idea.id)}>Del</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderReviewTab = () => (
    <div>
      <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>Finance Review</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div style={STYLE.card}>
          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>What increased income this month?</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Reflect on any new income sources, project payments, or freelance work that came in this month.</div>
        </div>
        <div style={STYLE.card}>
          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>What expenses were unnecessary?</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Identify any spending that didn't align with your goals or could have been avoided.</div>
        </div>
        <div style={STYLE.card}>
          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>What should be reduced next month?</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Pick 1-2 expense categories to cut back on for the coming month.</div>
        </div>
        <div style={STYLE.card}>
          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>What should be invested only after research?</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Review your investment ideas and ensure proper due diligence before committing funds.</div>
        </div>
        <div style={STYLE.card}>
          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>What is not aligned with Islamic principles?</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Review income sources, expenses, and investments for any that may conflict with Islamic finance principles.</div>
        </div>
        <div style={STYLE.card}>
          <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>What is the next financial action?</div>
          <div style={{ fontSize: '13px', color: '#64748b' }}>Define one concrete action to take this week to improve your financial situation.</div>
        </div>
      </div>
    </div>
  );

  const renderModalForm = () => {
    if (!modal) return null;
    const isNew = !modal.editing;
    const titles: Record<string, string> = {
      income: isNew ? 'Add Income' : 'Edit Income',
      expenses: isNew ? 'Add Expense' : 'Edit Expense',
      allocation: isNew ? 'Add Allocation Rule' : 'Edit Allocation Rule',
      purchase_goals: isNew ? 'Add Purchase Goal' : 'Edit Purchase Goal',
      investments: isNew ? 'Add Investment Idea' : 'Edit Investment Idea',
    };

    const formFields = () => {
      switch (modal.type) {
        case 'income': return renderIncomeForm(modal.editing);
        case 'expenses': return (
          <div style={STYLE.formGrid}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Title *</label>
              <input style={STYLE.input} placeholder="Expense title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Category</label>
              <select style={STYLE.select} value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Amount *</label>
              <input style={STYLE.input} type="number" step="0.01" placeholder="0.00" value={form.amount ?? ''} onChange={(e) => setForm({ ...form, amount: parseFloat(e.target.value) || 0 })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Currency</label>
              <select style={STYLE.select} value={form.currency || 'MYR'} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="MYR">MYR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="SGD">SGD</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Expense Date</label>
              <input style={STYLE.input} type="date" value={form.expenseDate || ''} onChange={(e) => setForm({ ...form, expenseDate: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Status</label>
              <select style={STYLE.select} value={form.status || 'planned'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {EXPENSE_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Project</label>
              <select style={STYLE.select} value={form.linkedProjectId || ''} onChange={(e) => setForm({ ...form, linkedProjectId: e.target.value || undefined })}>
                <option value="">None</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label>
              <textarea style={STYLE.input} rows={2} placeholder="Optional notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        );
        case 'allocation': return (
          <div style={STYLE.formGrid}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Name *</label>
              <input style={STYLE.input} placeholder="Rule name" value={form.name || ''} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Category</label>
              <select style={STYLE.select} value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {ALLOCATION_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Percentage (0-100)</label>
              <input style={STYLE.input} type="number" min="0" max="100" value={form.percentage ?? ''} onChange={(e) => setForm({ ...form, percentage: Math.min(100, Math.max(0, parseFloat(e.target.value) || 0)) })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Priority</label>
              <input style={STYLE.input} type="number" min="0" value={form.priority ?? 0} onChange={(e) => setForm({ ...form, priority: parseInt(e.target.value) || 0 })} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '24px' }}>
              <input type="checkbox" checked={form.isActive !== false} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="allocation-active" />
              <label htmlFor="allocation-active" style={{ fontSize: '13px', color: '#0f172a' }}>Active</label>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label>
              <textarea style={STYLE.input} rows={2} placeholder="Optional notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        );
        case 'purchase_goals': return (
          <div style={STYLE.formGrid}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Title *</label>
              <input style={STYLE.input} placeholder="Goal title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Category</label>
              <select style={STYLE.select} value={form.category || ''} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="">Select category</option>
                {EXPENSE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Target Amount *</label>
              <input style={STYLE.input} type="number" step="0.01" placeholder="0.00" value={form.targetAmount ?? ''} onChange={(e) => setForm({ ...form, targetAmount: Math.max(0, parseFloat(e.target.value) || 0) })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Saved Amount</label>
              <input style={STYLE.input} type="number" step="0.01" placeholder="0.00" value={form.savedAmount ?? ''} onChange={(e) => setForm({ ...form, savedAmount: Math.max(0, parseFloat(e.target.value) || 0) })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Currency</label>
              <select style={STYLE.select} value={form.currency || 'MYR'} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="MYR">MYR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="SGD">SGD</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Priority</label>
              <select style={STYLE.select} value={form.priority || 'medium'} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                {GOAL_PRIORITIES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Status</label>
              <select style={STYLE.select} value={form.status || 'planned'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {GOAL_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Target Date</label>
              <input style={STYLE.input} type="date" value={form.targetDate || ''} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Linked Project</label>
              <select style={STYLE.select} value={form.linkedProjectId || ''} onChange={(e) => setForm({ ...form, linkedProjectId: e.target.value || undefined })}>
                <option value="">None</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label>
              <textarea style={STYLE.input} rows={2} placeholder="Optional notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        );
        case 'investments': return (
          <div style={STYLE.formGrid}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Title *</label>
              <input style={STYLE.input} placeholder="Idea title" value={form.title || ''} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Type</label>
              <select style={STYLE.select} value={form.type || ''} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                <option value="">Select type</option>
                {INVESTMENT_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Planned Amount</label>
              <input style={STYLE.input} type="number" step="0.01" placeholder="0.00" value={form.plannedAmount ?? ''} onChange={(e) => setForm({ ...form, plannedAmount: Math.max(0, parseFloat(e.target.value) || 0) })} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Currency</label>
              <select style={STYLE.select} value={form.currency || 'MYR'} onChange={(e) => setForm({ ...form, currency: e.target.value })}>
                <option value="MYR">MYR</option><option value="USD">USD</option><option value="EUR">EUR</option><option value="SGD">SGD</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Risk Level</label>
              <select style={STYLE.select} value={form.riskLevel || 'medium'} onChange={(e) => setForm({ ...form, riskLevel: e.target.value })}>
                {RISK_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Ethical Status</label>
              <select style={STYLE.select} value={form.ethicalStatus || 'needs_review'} onChange={(e) => setForm({ ...form, ethicalStatus: e.target.value })}>
                {ETHICAL_STATUSES.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Status</label>
              <select style={STYLE.select} value={form.status || 'researching'} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                {INVESTMENT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Expected Reason</label>
              <input style={STYLE.input} placeholder="Why this investment?" value={form.expectedReason || ''} onChange={(e) => setForm({ ...form, expectedReason: e.target.value })} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Notes</label>
              <textarea style={STYLE.input} rows={2} placeholder="Optional notes" value={form.notes || ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
          </div>
        );
        default: return null;
      }
    };

    return (
      <div style={STYLE.modalOverlay} onClick={closeModal}>
        <div style={STYLE.modalContent} onClick={(e) => e.stopPropagation()}>
          <h3 style={{ fontSize: '18px', fontWeight: 700, color: '#0f172a', marginBottom: '16px' }}>{titles[modal.type]}</h3>
          {formFields()}
          <div style={STYLE.formActions}>
            <button style={{ ...STYLE.btn('#64748b') }} onClick={closeModal}>Cancel</button>
            <button style={STYLE.btn('#2563eb')} onClick={handleSave}>{isNew ? 'Create' : 'Save'}</button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div style={STYLE.page}>
      <div style={STYLE.nav}>
        {(['dashboard', 'income', 'expenses', 'allocation', 'purchase_goals', 'investments', 'review'] as FinanceTab[]).map((tab) => (
          <button key={tab} style={STYLE.navBtn(activeTab === tab)} onClick={() => setActiveTab(tab)}>
            {tab === 'dashboard' ? 'Dashboard' : tab === 'income' ? 'Income' : tab === 'expenses' ? 'Expenses' : tab === 'allocation' ? 'Allocation' : tab === 'purchase_goals' ? 'Purchase Goals' : tab === 'investments' ? 'Investments' : 'Review'}
          </button>
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
  );
}
