import React, { useState } from 'react';
import type {
  Company, Person, Project,
  StrategyDecision, StrategyDecisionInput,
  StrategyExperiment, StrategyExperimentInput,
  StrategyGoal, StrategyGoalInput,
  StrategyItem, StrategyItemInput,
  StrategyPlan, StrategyPlanInput,
  StrategyStatus,
  StrategyTactic, StrategyTacticInput,
} from '../../types/opportunities';
import CommandCenter from './StrategyCommandCenter';
import GoalsPanel from './StrategyGoalsPanel';
import PlansPanel from './StrategyPlansPanel';
import TacticsPanel from './StrategyTacticsPanel';
import ExperimentsPanel from './StrategyExperimentsPanel';
import DecisionsPanel from './StrategyDecisionsPanel';
import InsightSidebar from './StrategyInsightSidebar';
import GoalDetailView from './StrategyGoalDetailView';
import ItemModal, { type ModalState } from './StrategyItemModal';

type StrategyPanelProps = {
  strategyItems: StrategyItem[];
  strategyGoals: StrategyGoal[];
  strategyPlans: StrategyPlan[];
  strategyTactics: StrategyTactic[];
  strategyExperiments: StrategyExperiment[];
  strategyDecisions: StrategyDecision[];
  projects: Project[];
  companies: Company[];
  people: Person[];
  onAddStrategyItem: (input: StrategyItemInput) => Promise<StrategyItem>;
  onUpdateStrategyItem: (id: string, input: Partial<StrategyItemInput>) => Promise<StrategyItem>;
  onDeleteStrategyItem: (id: string) => Promise<void>;
  onAddStrategyGoal: (input: StrategyGoalInput) => Promise<StrategyGoal>;
  onUpdateStrategyGoal: (id: string, input: Partial<StrategyGoalInput>) => Promise<StrategyGoal>;
  onDeleteStrategyGoal: (id: string) => Promise<void>;
  onAddStrategyPlan: (input: StrategyPlanInput) => Promise<StrategyPlan>;
  onUpdateStrategyPlan: (id: string, input: Partial<StrategyPlanInput>) => Promise<StrategyPlan>;
  onDeleteStrategyPlan: (id: string) => Promise<void>;
  onAddStrategyTactic: (input: StrategyTacticInput) => Promise<StrategyTactic>;
  onUpdateStrategyTactic: (id: string, input: Partial<StrategyTacticInput>) => Promise<StrategyTactic>;
  onDeleteStrategyTactic: (id: string) => Promise<void>;
  onAddStrategyExperiment: (input: StrategyExperimentInput) => Promise<StrategyExperiment>;
  onUpdateStrategyExperiment: (id: string, input: Partial<StrategyExperimentInput>) => Promise<StrategyExperiment>;
  onDeleteStrategyExperiment: (id: string) => Promise<void>;
  onAddStrategyDecision: (input: StrategyDecisionInput) => Promise<StrategyDecision>;
  onUpdateStrategyDecision: (id: string, input: Partial<StrategyDecisionInput>) => Promise<StrategyDecision>;
  onDeleteStrategyDecision: (id: string) => Promise<void>;
};

type Section = 'command_center' | 'goals' | 'plans' | 'tactics' | 'experiments' | 'decisions' | 'ethical_filter' | 'review';

const SECTIONS: Array<{ value: Section; label: string }> = [
  { value: 'command_center', label: 'Command Center' },
  { value: 'goals', label: 'Goals' },
  { value: 'plans', label: 'Plans A/B/C' },
  { value: 'tactics', label: 'Tactics' },
  { value: 'experiments', label: 'Experiments' },
  { value: 'decisions', label: 'Decisions' },
  { value: 'ethical_filter', label: 'Ethical Filter' },
  { value: 'review', label: 'Review' },
];

const emptyGoalForm = (): StrategyGoalInput => ({ title: '', description: '', category: 'career', priority: 'medium', status: 'active', timeHorizon: 'quarterly', progress: 0, targetDate: '', successMetric: '', linkedProjectId: '', linkedCompanyId: '' });
const emptyPlanForm = (): StrategyPlanInput => ({ name: '', label: 'A', description: '', status: 'planned', priority: 'medium', assumptions: '', risks: '', resourcesNeeded: '', triggerToSwitch: '', nextAction: '', targetDate: '', progress: 0, linkedGoalId: '', linkedProjectId: '' });
const emptyTacticForm = (): StrategyTacticInput => ({ title: '', description: '', category: '', status: 'active', priority: 'medium', frequency: '', metric: '', nextAction: '', linkedGoalId: '', linkedPlanId: '', linkedProjectId: '' });
const emptyExperimentForm = (): StrategyExperimentInput => ({ title: '', hypothesis: '', method: '', metric: '', result: '', learning: '', status: 'planned', priority: 'medium', startDate: '', endDate: '', linkedGoalId: '', linkedPlanId: '', linkedProjectId: '' });
const emptyDecisionForm = (): StrategyDecisionInput => ({ title: '', context: '', decision: '', reason: '', expectedResult: '', reviewDate: '', status: 'planned', priority: 'medium', linkedGoalId: '', linkedPlanId: '', linkedProjectId: '' });

const todayKey = () => new Date().toISOString().slice(0, 10);

const StrategyPanel: React.FC<StrategyPanelProps> = ({
  strategyItems, strategyGoals, strategyPlans, strategyTactics, strategyExperiments, strategyDecisions,
  projects, companies, people,
  onAddStrategyItem, onDeleteStrategyItem,
  onAddStrategyGoal, onUpdateStrategyGoal, onDeleteStrategyGoal,
  onAddStrategyPlan, onUpdateStrategyPlan, onDeleteStrategyPlan,
  onAddStrategyTactic, onUpdateStrategyTactic, onDeleteStrategyTactic,
  onAddStrategyExperiment, onUpdateStrategyExperiment, onDeleteStrategyExperiment,
  onAddStrategyDecision, onUpdateStrategyDecision, onDeleteStrategyDecision,
}) => {
  const [activeSection, setActiveSection] = useState<Section>('command_center');
  const [modalState, setModalState] = useState<ModalState>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [goalFilterCategory, setGoalFilterCategory] = useState('');
  const [goalFilterStatus, setGoalFilterStatus] = useState('');
  const [goalFilterPriority, setGoalFilterPriority] = useState('');
  const [goalProgressDraft, setGoalProgressDraft] = useState<Record<string, number>>({});
  const [planProgressDraft, setPlanProgressDraft] = useState<Record<string, number>>({});
  const [planStatusDraft, setPlanStatusDraft] = useState<Record<string, StrategyStatus>>({});

  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const selectedGoal = selectedGoalId ? strategyGoals.find(g => g.id === selectedGoalId) ?? null : null;

  const [goalForm, setGoalForm] = useState<StrategyGoalInput>(emptyGoalForm());
  const [planForm, setPlanForm] = useState<StrategyPlanInput>(emptyPlanForm());
  const [tacticForm, setTacticForm] = useState<StrategyTacticInput>(emptyTacticForm());
  const [experimentForm, setExperimentForm] = useState<StrategyExperimentInput>(emptyExperimentForm());
  const [decisionForm, setDecisionForm] = useState<StrategyDecisionInput>(emptyDecisionForm());

  const today = todayKey();

  const starterVisible = strategyGoals.length === 0 && strategyPlans.length === 0;

  const activeGoalsCount = strategyGoals.filter((g) => g.status === 'active').length;
  const activePlansCount = strategyPlans.filter((p) => p.status === 'active' || p.status === 'planned').length;
  const runningExperimentsCount = strategyExperiments.filter((e) => e.status === 'active').length;
  const decisionsToReviewCount = strategyDecisions.filter((d) => d.reviewDate && d.reviewDate.slice(0, 10) <= today).length;
  const highPriorityItemsCount =
    strategyGoals.filter((g) => g.priority === 'high').length +
    strategyPlans.filter((p) => p.priority === 'high').length +
    strategyTactics.filter((t) => t.priority === 'high').length +
    strategyExperiments.filter((e) => e.priority === 'high').length +
    strategyDecisions.filter((d) => d.priority === 'high').length;
  const averageProgress = React.useMemo(() => {
    const values = [...strategyGoals, ...strategyPlans]
      .map((item) => Number(item.progress ?? 0))
      .filter((v) => Number.isFinite(v));
    return values.length === 0 ? 0 : Math.round(values.reduce((a, v) => a + v, 0) / values.length);
  }, [strategyGoals, strategyPlans]);
  const completedExperimentsCount = strategyExperiments.filter((e) => e.status === 'completed').length;
  const failedExperimentsCount = strategyExperiments.filter((e) => e.status === 'failed').length;

  const openModal = (state: ModalState) => {
    setFormError(null);
    setModalState(state);
    if (!state) return;
    if (state.type === 'goal') {
      setGoalForm(state.item ? {
        title: state.item.title,
        description: state.item.description || '',
        category: state.item.category,
        priority: state.item.priority,
        status: state.item.status,
        timeHorizon: state.item.timeHorizon,
        progress: state.item.progress ?? 0,
        targetDate: state.item.targetDate ? state.item.targetDate.slice(0, 10) : '',
        successMetric: state.item.successMetric || '',
        linkedProjectId: state.item.linkedProjectId || '',
        linkedCompanyId: state.item.linkedCompanyId || '',
      } : emptyGoalForm());
    }
    if (state.type === 'plan') {
      setPlanForm(state.item ? {
        name: state.item.name,
        label: state.item.label,
        description: state.item.description || '',
        status: state.item.status,
        priority: state.item.priority,
        assumptions: state.item.assumptions || '',
        risks: state.item.risks || '',
        resourcesNeeded: state.item.resourcesNeeded || '',
        triggerToSwitch: state.item.triggerToSwitch || '',
        nextAction: state.item.nextAction || '',
        targetDate: state.item.targetDate ? state.item.targetDate.slice(0, 10) : '',
        progress: state.item.progress ?? 0,
        linkedGoalId: state.item.linkedGoalId || '',
        linkedProjectId: state.item.linkedProjectId || '',
      } : emptyPlanForm());
    }
    if (state.type === 'tactic') {
      setTacticForm(state.item ? {
        title: state.item.title,
        description: state.item.description || '',
        category: state.item.category || '',
        status: state.item.status,
        priority: state.item.priority,
        frequency: state.item.frequency || '',
        metric: state.item.metric || '',
        nextAction: state.item.nextAction || '',
        linkedGoalId: state.item.linkedGoalId || '',
        linkedPlanId: state.item.linkedPlanId || '',
        linkedProjectId: state.item.linkedProjectId || '',
      } : emptyTacticForm());
    }
    if (state.type === 'experiment') {
      setExperimentForm(state.item ? {
        title: state.item.title,
        hypothesis: state.item.hypothesis || '',
        method: state.item.method || '',
        metric: state.item.metric || '',
        result: state.item.result || '',
        learning: state.item.learning || '',
        status: state.item.status,
        priority: state.item.priority,
        startDate: state.item.startDate ? state.item.startDate.slice(0, 10) : '',
        endDate: state.item.endDate ? state.item.endDate.slice(0, 10) : '',
        linkedGoalId: state.item.linkedGoalId || '',
        linkedPlanId: state.item.linkedPlanId || '',
        linkedProjectId: state.item.linkedProjectId || '',
      } : emptyExperimentForm());
    }
    if (state.type === 'decision') {
      setDecisionForm(state.item ? {
        title: state.item.title,
        context: state.item.context || '',
        decision: state.item.decision || '',
        reason: state.item.reason || '',
        expectedResult: state.item.expectedResult || '',
        reviewDate: state.item.reviewDate ? state.item.reviewDate.slice(0, 10) : '',
        status: state.item.status,
        priority: state.item.priority,
        linkedGoalId: state.item.linkedGoalId || '',
        linkedPlanId: state.item.linkedPlanId || '',
        linkedProjectId: state.item.linkedProjectId || '',
      } : emptyDecisionForm());
    }
  };

  const closeModal = () => {
    if (isBusy) return;
    setModalState(null);
    setFormError(null);
  };

  const handleSaveGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!goalForm.title?.trim()) { setFormError('Goal title is required.'); return; }
    setIsBusy(true); setFormError(null);
    try {
      const payload: StrategyGoalInput = { ...goalForm, title: goalForm.title.trim() };
      if (modalState?.type === 'goal' && modalState.item) await onUpdateStrategyGoal(modalState.item.id, payload);
      else await onAddStrategyGoal(payload);
      closeModal();
    } catch (error) { setFormError((error as Error)?.message || 'Unable to save goal.'); }
    finally { setIsBusy(false); }
  };

  const handleSavePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!planForm.name?.trim()) { setFormError('Plan name is required.'); return; }
    setIsBusy(true); setFormError(null);
    try {
      const payload: StrategyPlanInput = { ...planForm, name: planForm.name.trim() };
      if (modalState?.type === 'plan' && modalState.item) await onUpdateStrategyPlan(modalState.item.id, payload);
      else await onAddStrategyPlan(payload);
      closeModal();
    } catch (error) { setFormError((error as Error)?.message || 'Unable to save plan.'); }
    finally { setIsBusy(false); }
  };

  const handleSaveTactic = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tacticForm.title?.trim()) { setFormError('Tactic title is required.'); return; }
    setIsBusy(true); setFormError(null);
    try {
      const payload: StrategyTacticInput = { ...tacticForm, title: tacticForm.title.trim() };
      if (modalState?.type === 'tactic' && modalState.item) await onUpdateStrategyTactic(modalState.item.id, payload);
      else await onAddStrategyTactic(payload);
      closeModal();
    } catch (error) { setFormError((error as Error)?.message || 'Unable to save tactic.'); }
    finally { setIsBusy(false); }
  };

  const handleSaveExperiment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!experimentForm.title?.trim()) { setFormError('Experiment title is required.'); return; }
    setIsBusy(true); setFormError(null);
    try {
      const payload: StrategyExperimentInput = { ...experimentForm, title: experimentForm.title.trim() };
      if (modalState?.type === 'experiment' && modalState.item) await onUpdateStrategyExperiment(modalState.item.id, payload);
      else await onAddStrategyExperiment(payload);
      closeModal();
    } catch (error) { setFormError((error as Error)?.message || 'Unable to save experiment.'); }
    finally { setIsBusy(false); }
  };

  const handleSaveDecision = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!decisionForm.title?.trim()) { setFormError('Decision title is required.'); return; }
    setIsBusy(true); setFormError(null);
    try {
      const payload: StrategyDecisionInput = { ...decisionForm, title: decisionForm.title.trim() };
      if (modalState?.type === 'decision' && modalState.item) await onUpdateStrategyDecision(modalState.item.id, payload);
      else await onAddStrategyDecision(payload);
      closeModal();
    } catch (error) { setFormError((error as Error)?.message || 'Unable to save decision.'); }
    finally { setIsBusy(false); }
  };

  const handleDelete = async () => {
    if (!modalState || !modalState.item) return;
    setIsBusy(true); setFormError(null);
    try {
      if (modalState.type === 'goal') await onDeleteStrategyGoal(modalState.item.id);
      if (modalState.type === 'plan') await onDeleteStrategyPlan(modalState.item.id);
      if (modalState.type === 'tactic') await onDeleteStrategyTactic(modalState.item.id);
      if (modalState.type === 'experiment') await onDeleteStrategyExperiment(modalState.item.id);
      if (modalState.type === 'decision') await onDeleteStrategyDecision(modalState.item.id);
      closeModal();
    } catch (error) { setFormError((error as Error)?.message || 'Unable to delete.'); }
    finally { setIsBusy(false); }
  };

  const openQuickAction = (type: 'plan' | 'tactic' | 'experiment' | 'decision') => {
    setFormError(null);
    const goalId = selectedGoalId || '';
    if (type === 'plan') { setPlanForm({ ...emptyPlanForm(), linkedGoalId: goalId }); setModalState({ type: 'plan' }); }
    else if (type === 'tactic') { setTacticForm({ ...emptyTacticForm(), linkedGoalId: goalId }); setModalState({ type: 'tactic' }); }
    else if (type === 'experiment') { setExperimentForm({ ...emptyExperimentForm(), linkedGoalId: goalId }); setModalState({ type: 'experiment' }); }
    else if (type === 'decision') { setDecisionForm({ ...emptyDecisionForm(), linkedGoalId: goalId }); setModalState({ type: 'decision' }); }
  };

  const handleCreateStarterSystem = async () => {
    setIsBusy(true); setFormError(null);
    try {
      const createdGoals = await Promise.all([
        onAddStrategyGoal({ title: 'Build independent income', description: 'Create stable monthly income not dependent on one employer.', category: 'money', priority: 'high', status: 'active', timeHorizon: 'yearly', progress: 0, successMetric: 'Consistent monthly revenue target reached for 3 months' }),
        onAddStrategyGoal({ title: 'Build strong UX/UI portfolio', description: 'Turn portfolio into proof-driven conversion asset.', category: 'portfolio', priority: 'high', status: 'active', timeHorizon: 'six_months', progress: 0, successMetric: 'At least 4 evidence-rich case studies published' }),
        onAddStrategyGoal({ title: 'Get first 3 freelance clients', description: 'Win first wave of real client outcomes and testimonials.', category: 'freelance', priority: 'high', status: 'active', timeHorizon: 'quarterly', progress: 0, successMetric: '3 paid clients delivered with positive feedback' }),
        onAddStrategyGoal({ title: 'Improve health and discipline', description: 'Build sustainable rhythm that supports long-term execution.', category: 'health', priority: 'medium', status: 'active', timeHorizon: 'quarterly', progress: 0, successMetric: 'Weekly consistency on sleep, training, and focus blocks' }),
      ]);

      const primaryGoalId = createdGoals[2]?.id || '';

      await Promise.all([
        onAddStrategyPlan({ name: 'Plan A: UX/UI job or internship', label: 'A', description: 'Use role pathway to accelerate mentorship and portfolio quality.', status: 'planned', priority: 'high', progress: 10, linkedGoalId: primaryGoalId }),
        onAddStrategyPlan({ name: 'Plan B: Freelance UX audits', label: 'B', description: 'Offer audit-first entry service to founders and SMEs.', status: 'active', priority: 'high', progress: 15, linkedGoalId: primaryGoalId }),
        onAddStrategyPlan({ name: 'Plan C: Build productized UX service', label: 'C', description: 'Turn recurring deliverables into standardized service product.', status: 'planned', priority: 'medium', progress: 5, linkedGoalId: primaryGoalId }),
      ]);

      await Promise.all([
        onAddStrategyTactic({ title: '5 outreach messages per day', frequency: 'daily', metric: 'Messages sent and response rate', status: 'active', priority: 'high', linkedGoalId: primaryGoalId }),
        onAddStrategyTactic({ title: '1 UX audit per week', frequency: 'weekly', metric: 'Audits delivered per week', status: 'active', priority: 'high', linkedGoalId: primaryGoalId }),
        onAddStrategyTactic({ title: '1 portfolio improvement per week', frequency: 'weekly', metric: 'Portfolio updates shipped', status: 'active', priority: 'medium' }),
      ]);

      await Promise.all([
        onAddStrategyExperiment({ title: 'Test founder outreach in UAE SaaS', hypothesis: 'Founder-led SaaS teams will respond better to audit-first outreach.', method: 'Send targeted outreach and track reply quality.', metric: 'Qualified reply rate', status: 'active', priority: 'high', linkedGoalId: primaryGoalId }),
        onAddStrategyExperiment({ title: 'Test portfolio feedback outreach to senior designers', hypothesis: 'Targeted feedback requests improve portfolio quality and network effects.', method: 'Share specific case sections and request structured critique.', metric: 'Actionable feedback count', status: 'planned', priority: 'medium' }),
      ]);

      await onAddStrategyDecision({ title: 'Focus on proof-building before scaling outreach', context: 'Need stronger evidence to increase conversion from outreach.', decision: 'Prioritize portfolio proof and case studies before higher outreach volume.', reason: 'Proof improves trust, reply rate, and perceived pricing confidence.', expectedResult: 'Higher lead quality and better close rate.', reviewDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10), status: 'active', priority: 'high' });
    } catch (error) {
      setFormError((error as Error)?.message || 'Unable to create starter strategy system.');
    } finally {
      setIsBusy(false);
    }
  };

  const renderMainSection = () => {
    switch (activeSection) {
      case 'command_center':
        return (
          <CommandCenter
            strategyGoalsCount={strategyGoals.length}
            strategyPlansCount={strategyPlans.length}
            strategyTacticsCount={strategyTactics.length}
            strategyExperimentsCount={strategyExperiments.length}
            strategyDecisionsCount={strategyDecisions.length}
            activeGoalsCount={activeGoalsCount}
            activePlansCount={activePlansCount}
            runningExperimentsCount={runningExperimentsCount}
            decisionsToReviewCount={decisionsToReviewCount}
            highPriorityItemsCount={highPriorityItemsCount}
            averageProgress={averageProgress}
            completedExperimentsCount={completedExperimentsCount}
            failedExperimentsCount={failedExperimentsCount}
            quickActions={[
              { label: '+ Goal', onClick: () => openModal({ type: 'goal' }) },
              { label: '+ Plan', onClick: () => openModal({ type: 'plan' }) },
              { label: '+ Tactic', onClick: () => openModal({ type: 'tactic' }) },
              { label: '+ Experiment', onClick: () => openModal({ type: 'experiment' }) },
              { label: '+ Decision', onClick: () => openModal({ type: 'decision' }) },
            ]}
          />
        );
      case 'goals':
        return (
          <GoalsPanel
            goals={strategyGoals}
            goalForm={goalForm}
            setGoalForm={setGoalForm}
            onAdd={onAddStrategyGoal}
            onUpdate={onUpdateStrategyGoal}
            onDelete={onDeleteStrategyGoal}
            onEdit={(goal) => openModal({ type: 'goal', item: goal })}
            onSelect={(goal) => setSelectedGoalId(goal.id)}
            onOpenNew={() => openModal({ type: 'goal' })}
            filterCategory={goalFilterCategory}
            setFilterCategory={setGoalFilterCategory}
            filterStatus={goalFilterStatus}
            setFilterStatus={setGoalFilterStatus}
            filterPriority={goalFilterPriority}
            setFilterPriority={setGoalFilterPriority}
            progressDraft={goalProgressDraft}
            setProgressDraft={setGoalProgressDraft}
          />
        );
      case 'plans':
        return (
          <PlansPanel
            plans={strategyPlans}
            onAdd={onAddStrategyPlan}
            onUpdate={onUpdateStrategyPlan}
            onDelete={onDeleteStrategyPlan}
            onEdit={(plan) => openModal({ type: 'plan', item: plan })}
            onOpenNew={() => openModal({ type: 'plan' })}
            progressDraft={planProgressDraft}
            setProgressDraft={setPlanProgressDraft}
            statusDraft={planStatusDraft}
            setStatusDraft={setPlanStatusDraft}
          />
        );
      case 'tactics':
        return (
          <TacticsPanel
            tactics={strategyTactics}
            onAdd={onAddStrategyTactic}
            onUpdate={onUpdateStrategyTactic}
            onDelete={onDeleteStrategyTactic}
            onEdit={(tactic) => openModal({ type: 'tactic', item: tactic })}
            onOpenNew={() => openModal({ type: 'tactic' })}
          />
        );
      case 'experiments':
        return (
          <ExperimentsPanel
            experiments={strategyExperiments}
            onAdd={onAddStrategyExperiment}
            onUpdate={onUpdateStrategyExperiment}
            onDelete={onDeleteStrategyExperiment}
            onEdit={(exp) => openModal({ type: 'experiment', item: exp })}
            onOpenNew={() => openModal({ type: 'experiment' })}
          />
        );
      case 'decisions':
        return (
          <DecisionsPanel
            decisions={strategyDecisions}
            onUpdate={onUpdateStrategyDecision}
            onDelete={onDeleteStrategyDecision}
            onEdit={(decision) => openModal({ type: 'decision', item: decision })}
            onOpenNew={() => openModal({ type: 'decision' })}
          />
        );
      case 'ethical_filter':
        return renderEthicalFilter();
      case 'review':
        return renderReview();
      default:
        return null;
    }
  };

  const renderEthicalFilter = () => {
    const ethicalItems = strategyItems.filter((item) => item.section === 'ethical_filter');
    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[#e2e8f0] bg-gradient-to-br from-[#f8fafc] to-white p-4">
          <h4 className="text-sm font-semibold text-[#0f172a]">Ethical Principles</h4>
          <div className="mt-3 flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-xs font-medium text-[#991b1b]">
              <span className="text-[#b91c1c]">✕</span> avoid gambling
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-xs font-medium text-[#991b1b]">
              <span className="text-[#b91c1c]">✕</span> avoid adult content
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-xs font-medium text-[#991b1b]">
              <span className="text-[#b91c1c]">✕</span> avoid interest-based loans
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#fed7aa] bg-[#fff7ed] px-3 py-1.5 text-xs font-medium text-[#9a3412]">
              <span className="text-[#d97706]">⚠</span> review fintech/insurance/speculative crypto
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-lg border border-[#86efac] bg-[#f0fdf4] px-3 py-1.5 text-xs font-medium text-[#166534]">
              <span className="text-[#16a34a]">✓</span> prefer education, health, productivity, ethical commerce
            </span>
          </div>
        </div>
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => onAddStrategyItem({ section: 'ethical_filter', title: 'New ethical filter rule', content: 'Define a concrete filter condition.', priority: 'medium', status: 'active' })}
            className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#475569] transition-all hover:border-[#2563eb] hover:text-[#2563eb]"
          >
            Add Ethical Item
          </button>
        </div>
        {ethicalItems.length === 0 ? (
          <div className="rounded-xl border-2 border-dashed border-[#dbe3ef] bg-[#fafcff] p-6 text-center text-sm text-[#64748b]">No ethical filter items yet.</div>
        ) : (
          <div className="space-y-2">
            {ethicalItems.map((item) => (
              <div key={item.id} className="rounded-xl border border-[#e2e8f0] bg-white p-3">
                <div className="flex items-start justify-between gap-2">
                  <h5 className="text-sm font-semibold text-[#0f172a]">{item.title}</h5>
                  <button type="button" onClick={() => onDeleteStrategyItem(item.id)} className="rounded-lg border border-[#fecaca] bg-white px-2 py-1 text-xs font-medium text-[#991b1b] transition-all hover:bg-[#fef2f2]">Delete</button>
                </div>
                <p className="mt-1 text-sm text-[#64748b]">{item.content || 'No content'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderReview = () => {
    const dueGoals = strategyGoals.filter((g) => g.targetDate && g.targetDate.slice(0, 10) <= today && g.status !== 'completed');
    const dueDecisions = strategyDecisions.filter((d) => d.reviewDate && d.reviewDate.slice(0, 10) <= today);
    const dueExperiments = strategyExperiments.filter((e) => e.endDate && e.endDate.slice(0, 10) <= today && e.status !== 'completed' && e.status !== 'failed');

    return (
      <div className="space-y-4">
        <div className="rounded-xl border border-[#e2e8f0] bg-gradient-to-br from-[#f8fafc] to-white p-4">
          <h4 className="text-sm font-semibold text-[#0f172a]">Strategic Review</h4>
          <p className="mt-1 text-xs text-[#64748b]">Keep strategic loops tight: review what is due, decide what to continue, stop, or switch.</p>
        </div>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <h5 className="text-sm font-semibold text-[#0f172a]">Overdue Goals</h5>
            <div className="mt-2 space-y-2">
              {dueGoals.length === 0
                ? <p className="text-sm text-[#64748b]">No overdue goals.</p>
                : dueGoals.map((g) => (
                  <div key={g.id} className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] p-2.5 text-sm text-[#334155]">
                    <div className="font-medium">{g.title}</div>
                    <div className="text-xs text-[#64748b]">Target: {g.targetDate?.slice(0, 10)}</div>
                  </div>
                ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <h5 className="text-sm font-semibold text-[#0f172a]">Decisions to Review</h5>
            <div className="mt-2 space-y-2">
              {dueDecisions.length === 0
                ? <p className="text-sm text-[#64748b]">No due decisions.</p>
                : dueDecisions.map((d) => (
                  <div key={d.id} className="rounded-lg border border-[#fecaca] bg-[#fff5f5] p-2.5 text-sm text-[#7f1d1d]">
                    <div className="font-medium">{d.title}</div>
                    <div className="text-xs">Review: {d.reviewDate?.slice(0, 10)}</div>
                  </div>
                ))}
            </div>
          </div>
          <div className="rounded-xl border border-[#e2e8f0] bg-white p-4">
            <h5 className="text-sm font-semibold text-[#0f172a]">Experiments Past End</h5>
            <div className="mt-2 space-y-2">
              {dueExperiments.length === 0
                ? <p className="text-sm text-[#64748b]">No experiments past end date.</p>
                : dueExperiments.map((e) => (
                  <div key={e.id} className="rounded-lg border border-[#fed7aa] bg-[#fff7ed] p-2.5 text-sm text-[#9a3412]">
                    <div className="font-medium">{e.title}</div>
                    <div className="text-xs">Ended: {e.endDate?.slice(0, 10)}</div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {selectedGoal ? (
        <GoalDetailView
          goal={selectedGoal}
          allGoals={strategyGoals}
          strategyPlans={strategyPlans}
          strategyTactics={strategyTactics}
          strategyExperiments={strategyExperiments}
          strategyDecisions={strategyDecisions}
          projects={projects}
          companies={companies}
          onUpdateGoal={onUpdateStrategyGoal}
          onAddPlan={onAddStrategyPlan}
          onUpdatePlan={onUpdateStrategyPlan}
          onDeletePlan={onDeleteStrategyPlan}
          onAddTactic={onAddStrategyTactic}
          onUpdateTactic={onUpdateStrategyTactic}
          onDeleteTactic={onDeleteStrategyTactic}
          onAddExperiment={onAddStrategyExperiment}
          onUpdateExperiment={onUpdateStrategyExperiment}
          onDeleteExperiment={onDeleteStrategyExperiment}
          onAddDecision={onAddStrategyDecision}
          onUpdateDecision={onUpdateStrategyDecision}
          onDeleteDecision={onDeleteStrategyDecision}
          onEditGoal={() => openModal({ type: 'goal', item: selectedGoal })}
          onQuickAction={openQuickAction}
          onBack={() => setSelectedGoalId(null)}
        />
      ) : (
        <>
          {starterVisible ? (
            <div className="rounded-xl border-2 border-dashed border-[#2563eb]/30 bg-gradient-to-br from-[#eff6ff] to-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold text-[#0f172a]">Create Starter Strategy System</h3>
                  <p className="mt-1 text-sm text-[#475569]">Bootstrap goals, plans A/B/C, tactics, experiments, and one initial decision in one click.</p>
                </div>
                <button
                  type="button"
                  onClick={handleCreateStarterSystem}
                  disabled={isBusy}
                  className="rounded-lg bg-[#2563eb] px-5 py-2.5 text-sm font-medium text-white transition-all hover:bg-[#1d4ed8] active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isBusy ? 'Creating...' : 'Create Starter Strategy'}
                </button>
              </div>
              {formError ? <p className="mt-3 text-sm text-[#b91c1c]">{formError}</p> : null}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-1.5 border-b border-[#e2e8f0] pb-2">
            {SECTIONS.map((section) => (
              <button
                key={section.value}
                type="button"
                onClick={() => setActiveSection(section.value)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  activeSection === section.value
                    ? 'bg-[#2563eb] text-white shadow-sm'
                    : 'bg-[#f8fafc] text-[#475569] hover:bg-[#e2e8f0]'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
            <div className="xl:col-span-9 rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              {renderMainSection()}
            </div>
            <div className="xl:col-span-3 rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <InsightSidebar goals={strategyGoals} plans={strategyPlans} decisions={strategyDecisions} />
            </div>
          </div>
        </>
      )}

      <ItemModal
        modalState={modalState}
        isBusy={isBusy}
        formError={formError}
        projects={projects}
        companies={companies}
        strategyGoals={strategyGoals}
        strategyPlans={strategyPlans}
        goalForm={goalForm}
        planForm={planForm}
        tacticForm={tacticForm}
        experimentForm={experimentForm}
        decisionForm={decisionForm}
        setGoalForm={setGoalForm}
        setPlanForm={setPlanForm}
        setTacticForm={setTacticForm}
        setExperimentForm={setExperimentForm}
        setDecisionForm={setDecisionForm}
        onSave={async (e) => {
          if (modalState?.type === 'goal') await handleSaveGoal(e);
          else if (modalState?.type === 'plan') await handleSavePlan(e);
          else if (modalState?.type === 'tactic') await handleSaveTactic(e);
          else if (modalState?.type === 'experiment') await handleSaveExperiment(e);
          else if (modalState?.type === 'decision') await handleSaveDecision(e);
        }}
        onDelete={handleDelete}
        onClose={closeModal}
      />
    </div>
  );
};

export default StrategyPanel;
