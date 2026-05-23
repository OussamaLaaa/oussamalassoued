import React, { useMemo, useState } from 'react';
import type {
  Company,
  Person,
  Project,
  StrategyDecision,
  StrategyDecisionInput,
  StrategyExperiment,
  StrategyExperimentInput,
  StrategyGoal,
  StrategyGoalInput,
  StrategyItem,
  StrategyItemInput,
  StrategyPlan,
  StrategyPlanInput,
  StrategyPriority,
  StrategySection,
  StrategyStatus,
  StrategyTactic,
  StrategyTacticInput,
  StrategyTimeHorizon,
} from '../../types/opportunities';

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

type StrategyWorkspaceSection =
  | 'command_center'
  | 'goals'
  | 'plans'
  | 'tactics'
  | 'experiments'
  | 'decisions'
  | 'ethical_filter'
  | 'review';

type ModalState =
  | { type: 'goal'; item?: StrategyGoal }
  | { type: 'plan'; item?: StrategyPlan }
  | { type: 'tactic'; item?: StrategyTactic }
  | { type: 'experiment'; item?: StrategyExperiment }
  | { type: 'decision'; item?: StrategyDecision }
  | null;

const SECTION_OPTIONS: Array<{ value: StrategyWorkspaceSection; label: string }> = [
  { value: 'command_center', label: 'Command Center' },
  { value: 'goals', label: 'Goals' },
  { value: 'plans', label: 'Plans A/B/C' },
  { value: 'tactics', label: 'Tactics' },
  { value: 'experiments', label: 'Experiments' },
  { value: 'decisions', label: 'Decisions' },
  { value: 'ethical_filter', label: 'Ethical Filter' },
  { value: 'review', label: 'Review' },
];

const CATEGORY_OPTIONS: StrategySection[] = [
  'career',
  'freelance',
  'portfolio',
  'money',
  'investment',
  'learning',
  'health',
  'ethical_filter',
  'positioning',
  'operations',
];

const PRIORITY_OPTIONS: StrategyPriority[] = ['high', 'medium', 'low'];
const STATUS_OPTIONS: StrategyStatus[] = ['active', 'planned', 'paused', 'completed', 'archived', 'failed'];
const TIME_HORIZON_OPTIONS: StrategyTimeHorizon[] = ['yearly', 'six_months', 'quarterly', 'monthly', 'weekly', 'daily'];

const todayKey = () => new Date().toISOString().slice(0, 10);

const formatDate = (value?: string) => {
  if (!value) return 'none';
  return value.slice(0, 10);
};

const getRiskFlag = (plan: StrategyPlan) => {
  const status = String(plan.status || '').toLowerCase();
  if (status === 'paused' || status === 'blocked') return true;
  if (!plan.targetDate) return false;

  const target = new Date(plan.targetDate).getTime();
  if (!Number.isFinite(target)) return false;

  const daysLeft = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
  const progress = Number(plan.progress ?? 0);
  return daysLeft <= 14 && progress < 45;
};

const parseProgress = (value: string) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return Math.max(0, Math.min(100, numeric));
};

const LabelPill: React.FC<{ text: string; tone?: 'neutral' | 'high' | 'medium' | 'low' | 'danger' | 'success' }> = ({ text, tone = 'neutral' }) => {
  const toneClass = tone === 'high'
    ? 'border-[#fecaca] bg-[#fee2e2] text-[#991b1b]'
    : tone === 'medium'
      ? 'border-[#fed7aa] bg-[#fff7ed] text-[#9a3412]'
      : tone === 'low'
        ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]'
        : tone === 'danger'
          ? 'border-[#fca5a5] bg-[#fef2f2] text-[#b91c1c]'
          : tone === 'success'
            ? 'border-[#86efac] bg-[#f0fdf4] text-[#166534]'
            : 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';

  return <span className={`rounded-full border px-2 py-1 text-xs ${toneClass}`}>{text}</span>;
};

const PanelCard: React.FC<{ title: string; value: string | number; accent?: string }> = ({ title, value, accent = 'text-[#0f172a]' }) => (
  <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
    <div className="text-xs uppercase tracking-[0.08em] text-[#64748b]">{title}</div>
    <div className={`mt-2 text-2xl font-semibold ${accent}`}>{value}</div>
  </div>
);

const StrategyPanel: React.FC<StrategyPanelProps> = ({
  strategyItems,
  strategyGoals,
  strategyPlans,
  strategyTactics,
  strategyExperiments,
  strategyDecisions,
  projects,
  companies,
  people,
  onAddStrategyItem,
  onDeleteStrategyItem,
  onAddStrategyGoal,
  onUpdateStrategyGoal,
  onDeleteStrategyGoal,
  onAddStrategyPlan,
  onUpdateStrategyPlan,
  onDeleteStrategyPlan,
  onAddStrategyTactic,
  onUpdateStrategyTactic,
  onDeleteStrategyTactic,
  onAddStrategyExperiment,
  onUpdateStrategyExperiment,
  onDeleteStrategyExperiment,
  onAddStrategyDecision,
  onUpdateStrategyDecision,
  onDeleteStrategyDecision,
}) => {
  const [activeSection, setActiveSection] = useState<StrategyWorkspaceSection>('command_center');
  const [modalState, setModalState] = useState<ModalState>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [goalFilterCategory, setGoalFilterCategory] = useState<string>('');
  const [goalFilterStatus, setGoalFilterStatus] = useState<string>('');
  const [goalFilterPriority, setGoalFilterPriority] = useState<string>('');
  const [goalProgressDraft, setGoalProgressDraft] = useState<Record<string, number>>({});
  const [planProgressDraft, setPlanProgressDraft] = useState<Record<string, number>>({});
  const [planStatusDraft, setPlanStatusDraft] = useState<Record<string, StrategyStatus>>({});

  const [goalForm, setGoalForm] = useState<StrategyGoalInput>({
    title: '',
    description: '',
    category: 'career',
    priority: 'medium',
    status: 'active',
    timeHorizon: 'quarterly',
    progress: 0,
    targetDate: '',
    successMetric: '',
    linkedProjectId: '',
    linkedCompanyId: '',
  });

  const [planForm, setPlanForm] = useState<StrategyPlanInput>({
    name: '',
    label: 'A',
    description: '',
    status: 'planned',
    priority: 'medium',
    assumptions: '',
    risks: '',
    resourcesNeeded: '',
    triggerToSwitch: '',
    nextAction: '',
    targetDate: '',
    progress: 0,
    linkedGoalId: '',
    linkedProjectId: '',
  });

  const [tacticForm, setTacticForm] = useState<StrategyTacticInput>({
    title: '',
    description: '',
    category: '',
    status: 'active',
    priority: 'medium',
    frequency: '',
    metric: '',
    nextAction: '',
    linkedGoalId: '',
    linkedPlanId: '',
    linkedProjectId: '',
  });

  const [experimentForm, setExperimentForm] = useState<StrategyExperimentInput>({
    title: '',
    hypothesis: '',
    method: '',
    metric: '',
    result: '',
    learning: '',
    status: 'planned',
    priority: 'medium',
    startDate: '',
    endDate: '',
    linkedGoalId: '',
    linkedPlanId: '',
    linkedProjectId: '',
  });

  const [decisionForm, setDecisionForm] = useState<StrategyDecisionInput>({
    title: '',
    context: '',
    decision: '',
    reason: '',
    expectedResult: '',
    reviewDate: '',
    status: 'planned',
    priority: 'medium',
    linkedGoalId: '',
    linkedPlanId: '',
    linkedProjectId: '',
  });

  const today = todayKey();

  const starterVisible = strategyGoals.length === 0 && strategyPlans.length === 0;

  const activeGoalsCount = strategyGoals.filter((item) => item.status === 'active').length;
  const activePlansCount = strategyPlans.filter((item) => item.status === 'active' || item.status === 'planned').length;
  const runningExperimentsCount = strategyExperiments.filter((item) => item.status === 'active').length;
  const decisionsToReviewCount = strategyDecisions.filter((item) => item.reviewDate && item.reviewDate.slice(0, 10) <= today).length;

  const highPriorityItemsCount =
    strategyGoals.filter((item) => item.priority === 'high').length
+ strategyPlans.filter((item) => item.priority === 'high').length
+ strategyTactics.filter((item) => item.priority === 'high').length
+ strategyExperiments.filter((item) => item.priority === 'high').length
+ strategyDecisions.filter((item) => item.priority === 'high').length;

  const averageProgress = useMemo(() => {
    const values = [
      ...strategyGoals.map((item) => Number(item.progress ?? 0)),
      ...strategyPlans.map((item) => Number(item.progress ?? 0)),
    ].filter((value) => Number.isFinite(value));

    if (values.length === 0) return 0;
    return Math.round(values.reduce((accumulator, value) => accumulator + value, 0) / values.length);
  }, [strategyGoals, strategyPlans]);

  const filteredGoals = strategyGoals.filter((goal) => {
    if (goalFilterCategory && goal.category !== goalFilterCategory) return false;
    if (goalFilterStatus && goal.status !== goalFilterStatus) return false;
    if (goalFilterPriority && goal.priority !== goalFilterPriority) return false;
    return true;
  });

  const plansByLane = useMemo(() => ({
    A: strategyPlans.filter((item) => item.label === 'A'),
    B: strategyPlans.filter((item) => item.label === 'B'),
    C: strategyPlans.filter((item) => item.label === 'C'),
    other: strategyPlans.filter((item) => item.label !== 'A' && item.label !== 'B' && item.label !== 'C'),
  }), [strategyPlans]);

  const experimentsByStatus = useMemo(() => ({
    planned: strategyExperiments.filter((item) => item.status === 'planned'),
    running: strategyExperiments.filter((item) => item.status === 'active'),
    completed: strategyExperiments.filter((item) => item.status === 'completed'),
    failed: strategyExperiments.filter((item) => item.status === 'failed'),
  }), [strategyExperiments]);

  const ethicalItems = strategyItems.filter((item) => item.section === 'ethical_filter');

  const topPriorityGoals = strategyGoals
    .filter((item) => item.priority === 'high')
    .slice()
    .sort((a, b) => Number(b.progress ?? 0) - Number(a.progress ?? 0))
    .slice(0, 3);

  const nearestReviews = strategyDecisions
    .filter((item) => Boolean(item.reviewDate))
    .slice()
    .sort((a, b) => (a.reviewDate || '').localeCompare(b.reviewDate || ''))
    .slice(0, 5);

  const plansAtRisk = strategyPlans.filter(getRiskFlag).slice(0, 5);

  const openModal = (state: ModalState) => {
    setFormError(null);
    setModalState(state);

    if (!state) return;

    if (state.type === 'goal' && state.item) {
      setGoalForm({
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
      });
    }

    if (state.type === 'plan' && state.item) {
      setPlanForm({
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
      });
    }

    if (state.type === 'tactic' && state.item) {
      setTacticForm({
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
      });
    }

    if (state.type === 'experiment' && state.item) {
      setExperimentForm({
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
      });
    }

    if (state.type === 'decision' && state.item) {
      setDecisionForm({
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
      });
    }
  };

  const closeModal = () => {
    if (isBusy) return;
    setModalState(null);
    setFormError(null);
  };

  const handleCreateStarterSystem = async () => {
    setIsBusy(true);
    setFormError(null);

    try {
      const createdGoals = await Promise.all([
        onAddStrategyGoal({
          title: 'Build independent income',
          description: 'Create stable monthly income not dependent on one employer.',
          category: 'money',
          priority: 'high',
          status: 'active',
          timeHorizon: 'yearly',
          progress: 0,
          successMetric: 'Consistent monthly revenue target reached for 3 months',
        }),
        onAddStrategyGoal({
          title: 'Build strong UX/UI portfolio',
          description: 'Turn portfolio into proof-driven conversion asset.',
          category: 'portfolio',
          priority: 'high',
          status: 'active',
          timeHorizon: 'six_months',
          progress: 0,
          successMetric: 'At least 4 evidence-rich case studies published',
        }),
        onAddStrategyGoal({
          title: 'Get first 3 freelance clients',
          description: 'Win first wave of real client outcomes and testimonials.',
          category: 'freelance',
          priority: 'high',
          status: 'active',
          timeHorizon: 'quarterly',
          progress: 0,
          successMetric: '3 paid clients delivered with positive feedback',
        }),
        onAddStrategyGoal({
          title: 'Improve health and discipline',
          description: 'Build sustainable rhythm that supports long-term execution.',
          category: 'health',
          priority: 'medium',
          status: 'active',
          timeHorizon: 'quarterly',
          progress: 0,
          successMetric: 'Weekly consistency on sleep, training, and focus blocks',
        }),
      ]);

      const primaryGoalId = createdGoals[2]?.id || '';

      const createdPlans = await Promise.all([
        onAddStrategyPlan({
          name: 'Plan A: UX/UI job or internship',
          label: 'A',
          description: 'Use role pathway to accelerate mentorship and portfolio quality.',
          status: 'planned',
          priority: 'high',
          progress: 10,
          linkedGoalId: primaryGoalId,
        }),
        onAddStrategyPlan({
          name: 'Plan B: Freelance UX audits',
          label: 'B',
          description: 'Offer audit-first entry service to founders and SMEs.',
          status: 'active',
          priority: 'high',
          progress: 15,
          linkedGoalId: primaryGoalId,
        }),
        onAddStrategyPlan({
          name: 'Plan C: Build productized UX service',
          label: 'C',
          description: 'Turn recurring deliverables into standardized service product.',
          status: 'planned',
          priority: 'medium',
          progress: 5,
          linkedGoalId: primaryGoalId,
        }),
      ]);

      const planBId = createdPlans[1]?.id || '';

      await Promise.all([
        onAddStrategyTactic({
          title: '5 outreach messages per day',
          frequency: 'daily',
          metric: 'Messages sent and response rate',
          status: 'active',
          priority: 'high',
          linkedGoalId: primaryGoalId,
          linkedPlanId: planBId,
        }),
        onAddStrategyTactic({
          title: '1 UX audit per week',
          frequency: 'weekly',
          metric: 'Audits delivered per week',
          status: 'active',
          priority: 'high',
          linkedGoalId: primaryGoalId,
          linkedPlanId: planBId,
        }),
        onAddStrategyTactic({
          title: '1 portfolio improvement per week',
          frequency: 'weekly',
          metric: 'Portfolio updates shipped',
          status: 'active',
          priority: 'medium',
        }),
      ]);

      await Promise.all([
        onAddStrategyExperiment({
          title: 'Test founder outreach in UAE SaaS',
          hypothesis: 'Founder-led SaaS teams will respond better to audit-first outreach.',
          method: 'Send targeted outreach and track reply quality.',
          metric: 'Qualified reply rate',
          status: 'active',
          priority: 'high',
          linkedGoalId: primaryGoalId,
          linkedPlanId: planBId,
        }),
        onAddStrategyExperiment({
          title: 'Test portfolio feedback outreach to senior designers',
          hypothesis: 'Targeted feedback requests improve portfolio quality and network effects.',
          method: 'Share specific case sections and request structured critique.',
          metric: 'Actionable feedback count',
          status: 'planned',
          priority: 'medium',
        }),
      ]);

      await onAddStrategyDecision({
        title: 'Focus on proof-building before scaling outreach',
        context: 'Need stronger evidence to increase conversion from outreach.',
        decision: 'Prioritize portfolio proof and case studies before higher outreach volume.',
        reason: 'Proof improves trust, reply rate, and perceived pricing confidence.',
        expectedResult: 'Higher lead quality and better close rate.',
        reviewDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
        status: 'active',
        priority: 'high',
      });
    } catch (error) {
      setFormError((error as Error)?.message || 'Unable to create starter strategy system.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveGoal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!goalForm.title?.trim()) {
      setFormError('Goal title is required.');
      return;
    }

    setIsBusy(true);
    setFormError(null);

    try {
      const payload: StrategyGoalInput = {
        ...goalForm,
        title: goalForm.title.trim(),
        targetDate: goalForm.targetDate || undefined,
        linkedProjectId: goalForm.linkedProjectId || undefined,
        linkedCompanyId: goalForm.linkedCompanyId || undefined,
      };

      if (modalState?.type === 'goal' && modalState.item) {
        await onUpdateStrategyGoal(modalState.item.id, payload);
      } else {
        await onAddStrategyGoal(payload);
      }

      closeModal();
    } catch (error) {
      setFormError((error as Error)?.message || 'Unable to save goal.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSavePlan = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!planForm.name?.trim()) {
      setFormError('Plan name is required.');
      return;
    }

    setIsBusy(true);
    setFormError(null);

    try {
      const payload: StrategyPlanInput = {
        ...planForm,
        name: planForm.name.trim(),
        linkedGoalId: planForm.linkedGoalId || undefined,
        linkedProjectId: planForm.linkedProjectId || undefined,
        targetDate: planForm.targetDate || undefined,
      };

      if (modalState?.type === 'plan' && modalState.item) {
        await onUpdateStrategyPlan(modalState.item.id, payload);
      } else {
        await onAddStrategyPlan(payload);
      }

      closeModal();
    } catch (error) {
      setFormError((error as Error)?.message || 'Unable to save plan.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveTactic = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!tacticForm.title?.trim()) {
      setFormError('Tactic title is required.');
      return;
    }

    setIsBusy(true);
    setFormError(null);

    try {
      const payload: StrategyTacticInput = {
        ...tacticForm,
        title: tacticForm.title.trim(),
        linkedGoalId: tacticForm.linkedGoalId || undefined,
        linkedPlanId: tacticForm.linkedPlanId || undefined,
        linkedProjectId: tacticForm.linkedProjectId || undefined,
      };

      if (modalState?.type === 'tactic' && modalState.item) {
        await onUpdateStrategyTactic(modalState.item.id, payload);
      } else {
        await onAddStrategyTactic(payload);
      }

      closeModal();
    } catch (error) {
      setFormError((error as Error)?.message || 'Unable to save tactic.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveExperiment = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!experimentForm.title?.trim()) {
      setFormError('Experiment title is required.');
      return;
    }

    setIsBusy(true);
    setFormError(null);

    try {
      const payload: StrategyExperimentInput = {
        ...experimentForm,
        title: experimentForm.title.trim(),
        startDate: experimentForm.startDate || undefined,
        endDate: experimentForm.endDate || undefined,
        linkedGoalId: experimentForm.linkedGoalId || undefined,
        linkedPlanId: experimentForm.linkedPlanId || undefined,
        linkedProjectId: experimentForm.linkedProjectId || undefined,
      };

      if (modalState?.type === 'experiment' && modalState.item) {
        await onUpdateStrategyExperiment(modalState.item.id, payload);
      } else {
        await onAddStrategyExperiment(payload);
      }

      closeModal();
    } catch (error) {
      setFormError((error as Error)?.message || 'Unable to save experiment.');
    } finally {
      setIsBusy(false);
    }
  };

  const handleSaveDecision = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!decisionForm.title?.trim()) {
      setFormError('Decision title is required.');
      return;
    }

    setIsBusy(true);
    setFormError(null);

    try {
      const payload: StrategyDecisionInput = {
        ...decisionForm,
        title: decisionForm.title.trim(),
        reviewDate: decisionForm.reviewDate || undefined,
        linkedGoalId: decisionForm.linkedGoalId || undefined,
        linkedPlanId: decisionForm.linkedPlanId || undefined,
        linkedProjectId: decisionForm.linkedProjectId || undefined,
      };

      if (modalState?.type === 'decision' && modalState.item) {
        await onUpdateStrategyDecision(modalState.item.id, payload);
      } else {
        await onAddStrategyDecision(payload);
      }

      closeModal();
    } catch (error) {
      setFormError((error as Error)?.message || 'Unable to save decision.');
    } finally {
      setIsBusy(false);
    }
  };

  const deleteByModalType = async () => {
    if (!modalState || !modalState.item) return;
    setIsBusy(true);
    setFormError(null);

    try {
      if (modalState.type === 'goal') await onDeleteStrategyGoal(modalState.item.id);
      if (modalState.type === 'plan') await onDeleteStrategyPlan(modalState.item.id);
      if (modalState.type === 'tactic') await onDeleteStrategyTactic(modalState.item.id);
      if (modalState.type === 'experiment') await onDeleteStrategyExperiment(modalState.item.id);
      if (modalState.type === 'decision') await onDeleteStrategyDecision(modalState.item.id);
      closeModal();
    } catch (error) {
      setFormError((error as Error)?.message || 'Unable to delete item.');
    } finally {
      setIsBusy(false);
    }
  };

  const updateGoalProgressInline = async (goal: StrategyGoal) => {
    const nextValue = goalProgressDraft[goal.id] ?? Number(goal.progress ?? 0);
    try {
      await onUpdateStrategyGoal(goal.id, { progress: nextValue });
    } catch (error) {
      console.error('[Strategy] Failed to update goal progress.', error);
    }
  };

  const updatePlanInline = async (plan: StrategyPlan) => {
    const nextProgress = planProgressDraft[plan.id] ?? Number(plan.progress ?? 0);
    const nextStatus = planStatusDraft[plan.id] ?? plan.status;

    try {
      await onUpdateStrategyPlan(plan.id, {
        progress: nextProgress,
        status: nextStatus,
      });
    } catch (error) {
      console.error('[Strategy] Failed to update plan inline fields.', error);
    }
  };

  const renderGoalsSection = () => (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select
            value={goalFilterCategory}
            onChange={(event) => setGoalFilterCategory(event.target.value)}
            className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]"
          >
            <option value="">All categories</option>
            {CATEGORY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>

          <select
            value={goalFilterStatus}
            onChange={(event) => setGoalFilterStatus(event.target.value)}
            className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]"
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>

          <select
            value={goalFilterPriority}
            onChange={(event) => setGoalFilterPriority(event.target.value)}
            className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]"
          >
            <option value="">All priorities</option>
            {PRIORITY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
          </select>
        </div>

        <button
          type="button"
          onClick={() => {
            setGoalForm({
              title: '',
              description: '',
              category: 'career',
              priority: 'medium',
              status: 'active',
              timeHorizon: 'quarterly',
              progress: 0,
              targetDate: '',
              successMetric: '',
              linkedProjectId: '',
              linkedCompanyId: '',
            });
            openModal({ type: 'goal' });
          }}
          className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
        >
          Add Goal
        </button>
      </div>

      {filteredGoals.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
          No strategic goals yet. Start with one outcome that matters.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredGoals.map((goal) => {
            const progress = goalProgressDraft[goal.id] ?? Number(goal.progress ?? 0);
            return (
              <article key={goal.id} className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-[#0f172a]">{goal.title}</h4>
                    {goal.description ? <p className="mt-1 text-sm text-[#475569]">{goal.description}</p> : null}
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => openModal({ type: 'goal', item: goal })} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs text-[#0f172a]">Edit</button>
                    <button type="button" onClick={() => onDeleteStrategyGoal(goal.id)} className="rounded-md border border-[#fecaca] bg-white px-3 py-1.5 text-xs text-[#991b1b]">Delete</button>
                  </div>
                </div>

                <div className="mt-2 flex flex-wrap gap-2">
                  <LabelPill text={`Category: ${goal.category}`} tone="neutral" />
                  <LabelPill text={`Priority: ${goal.priority}`} tone={goal.priority === 'high' ? 'high' : goal.priority === 'medium' ? 'medium' : 'low'} />
                  <LabelPill text={`Status: ${goal.status}`} tone={goal.status === 'completed' ? 'success' : goal.status === 'failed' ? 'danger' : 'neutral'} />
                  <LabelPill text={`Target: ${formatDate(goal.targetDate)}`} tone="neutral" />
                  <LabelPill text={`Metric: ${goal.successMetric || 'none'}`} tone="neutral" />
                  <LabelPill text={`Project: ${goal.linkedProjectName || 'none'}`} tone="neutral" />
                  <LabelPill text={`Company: ${goal.linkedCompanyName || 'none'}`} tone="neutral" />
                </div>

                <div className="mt-3 rounded-md border border-[#e2e8f0] bg-white p-3">
                  <div className="mb-2 flex items-center justify-between text-xs text-[#64748b]">
                    <span>Progress</span>
                    <span>{progress}%</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={progress}
                    onChange={(event) => setGoalProgressDraft((current) => ({ ...current, [goal.id]: parseProgress(event.target.value) }))}
                    className="w-full"
                  />
                  <div className="mt-2 flex justify-end">
                    <button type="button" onClick={() => updateGoalProgressInline(goal)} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-1 text-xs text-[#0f172a]">Save Progress</button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderPlansSection = () => {
    const lanes: Array<{ key: 'A' | 'B' | 'C' | 'other'; title: string; items: StrategyPlan[] }> = [
      { key: 'A', title: 'Plan A', items: plansByLane.A },
      { key: 'B', title: 'Plan B', items: plansByLane.B },
      { key: 'C', title: 'Plan C', items: plansByLane.C },
      { key: 'other', title: 'Other', items: plansByLane.other },
    ];

    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setPlanForm({
                name: '',
                label: 'A',
                description: '',
                status: 'planned',
                priority: 'medium',
                assumptions: '',
                risks: '',
                resourcesNeeded: '',
                triggerToSwitch: '',
                nextAction: '',
                targetDate: '',
                progress: 0,
                linkedGoalId: '',
                linkedProjectId: '',
              });
              openModal({ type: 'plan' });
            }}
            className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
          >
            Add Plan
          </button>
        </div>

        {strategyPlans.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
            No plans yet. Create Plan A, then define B and C as fallback paths.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
            {lanes.map((lane) => (
              <section key={lane.key} className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <h4 className="text-sm font-semibold text-[#0f172a]">{lane.title}</h4>
                <div className="mt-2 space-y-2">
                  {lane.items.length === 0 ? (
                    <div className="rounded-md border border-dashed border-[#cbd5e1] bg-white p-3 text-xs text-[#64748b]">No items.</div>
                  ) : (
                    lane.items.map((plan) => {
                      const progress = planProgressDraft[plan.id] ?? Number(plan.progress ?? 0);
                      const status = planStatusDraft[plan.id] ?? plan.status;
                      const isRisk = getRiskFlag({ ...plan, progress, status });

                      return (
                        <article key={plan.id} className="rounded-md border border-[#dbe3ef] bg-white p-3">
                          <div className="flex items-start justify-between gap-2">
                            <h5 className="text-sm font-semibold text-[#0f172a]">{plan.name}</h5>
                            {isRisk ? <LabelPill text="At Risk" tone="danger" /> : null}
                          </div>
                          {plan.description ? <p className="mt-1 text-xs text-[#64748b]">{plan.description}</p> : null}
                          <div className="mt-2 space-y-1 text-xs text-[#475569]">
                            <div>Assumptions: {plan.assumptions || 'none'}</div>
                            <div>Risks: {plan.risks || 'none'}</div>
                            <div>Trigger to switch: {plan.triggerToSwitch || 'none'}</div>
                            <div>Next action: {plan.nextAction || 'none'}</div>
                            <div>Linked goal: {plan.linkedGoalTitle || 'none'}</div>
                            <div>Linked project: {plan.linkedProjectName || 'none'}</div>
                          </div>

                          <div className="mt-2">
                            <label className="text-[11px] uppercase tracking-[0.06em] text-[#64748b]">Status</label>
                            <select
                              value={status}
                              onChange={(event) => setPlanStatusDraft((current) => ({ ...current, [plan.id]: event.target.value as StrategyStatus }))}
                              className="mt-1 w-full rounded-md border border-[#cbd5e1] bg-white px-2 py-1 text-xs text-[#0f172a]"
                            >
                              {STATUS_OPTIONS.map((option) => <option key={option} value={option}>{option}</option>)}
                            </select>
                          </div>

                          <div className="mt-2">
                            <div className="mb-1 flex items-center justify-between text-[11px] text-[#64748b]">
                              <span>Progress</span>
                              <span>{progress}%</span>
                            </div>
                            <input
                              type="range"
                              min={0}
                              max={100}
                              value={progress}
                              onChange={(event) => setPlanProgressDraft((current) => ({ ...current, [plan.id]: parseProgress(event.target.value) }))}
                              className="w-full"
                            />
                          </div>

                          <div className="mt-2 flex gap-2">
                            <button type="button" onClick={() => updatePlanInline(plan)} className="rounded-md border border-[#cbd5e1] bg-white px-2 py-1 text-xs text-[#0f172a]">Save</button>
                            <button type="button" onClick={() => openModal({ type: 'plan', item: plan })} className="rounded-md border border-[#cbd5e1] bg-white px-2 py-1 text-xs text-[#0f172a]">Edit</button>
                            <button type="button" onClick={() => onDeleteStrategyPlan(plan.id)} className="rounded-md border border-[#fecaca] bg-white px-2 py-1 text-xs text-[#991b1b]">Delete</button>
                          </div>
                        </article>
                      );
                    })
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderTacticsSection = () => (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setTacticForm({
              title: '',
              description: '',
              category: '',
              status: 'active',
              priority: 'medium',
              frequency: '',
              metric: '',
              nextAction: '',
              linkedGoalId: '',
              linkedPlanId: '',
              linkedProjectId: '',
            });
            openModal({ type: 'tactic' });
          }}
          className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
        >
          Add Tactic
        </button>
      </div>

      {strategyTactics.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
          No tactics yet. Add repeatable methods that move goals forward.
        </div>
      ) : (
        <div className="space-y-2">
          {strategyTactics.map((item) => (
            <article key={item.id} className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h4 className="text-base font-semibold text-[#0f172a]">{item.title}</h4>
                  <p className="text-sm text-[#64748b]">{item.description || 'No description'}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => openModal({ type: 'tactic', item })} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs text-[#0f172a]">Edit</button>
                  <button type="button" onClick={() => onDeleteStrategyTactic(item.id)} className="rounded-md border border-[#fecaca] bg-white px-3 py-1.5 text-xs text-[#991b1b]">Delete</button>
                </div>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <LabelPill text={`Frequency: ${item.frequency || 'none'}`} tone="neutral" />
                <LabelPill text={`Metric: ${item.metric || 'none'}`} tone="neutral" />
                <LabelPill text={`Next Action: ${item.nextAction || 'none'}`} tone="neutral" />
                <LabelPill text={`Goal: ${item.linkedGoalTitle || 'none'}`} tone="neutral" />
                <LabelPill text={`Plan: ${item.linkedPlanName || 'none'}`} tone="neutral" />
                <LabelPill text={`Status: ${item.status}`} tone={item.status === 'failed' ? 'danger' : 'neutral'} />
                <LabelPill text={`Priority: ${item.priority}`} tone={item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low'} />
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderExperimentsSection = () => {
    const columns: Array<{ key: keyof typeof experimentsByStatus; title: string; items: StrategyExperiment[] }> = [
      { key: 'planned', title: 'Planned', items: experimentsByStatus.planned },
      { key: 'running', title: 'Running', items: experimentsByStatus.running },
      { key: 'completed', title: 'Completed', items: experimentsByStatus.completed },
      { key: 'failed', title: 'Failed', items: experimentsByStatus.failed },
    ];

    return (
      <div className="space-y-3">
        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setExperimentForm({
                title: '',
                hypothesis: '',
                method: '',
                metric: '',
                result: '',
                learning: '',
                status: 'planned',
                priority: 'medium',
                startDate: '',
                endDate: '',
                linkedGoalId: '',
                linkedPlanId: '',
                linkedProjectId: '',
              });
              openModal({ type: 'experiment' });
            }}
            className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
          >
            Add Experiment
          </button>
        </div>

        {strategyExperiments.length === 0 ? (
          <div className="rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
            No experiments yet. Test assumptions instead of overthinking.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-4">
            {columns.map((column) => (
              <section key={column.key} className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">
                <h4 className="text-sm font-semibold text-[#0f172a]">{column.title}</h4>
                <div className="mt-2 space-y-2">
                  {column.items.length === 0 ? (
                    <div className="rounded-md border border-dashed border-[#cbd5e1] bg-white p-3 text-xs text-[#64748b]">No items.</div>
                  ) : (
                    column.items.map((item) => (
                      <article key={item.id} className="rounded-md border border-[#dbe3ef] bg-white p-3">
                        <div className="flex items-start justify-between gap-2">
                          <h5 className="text-sm font-semibold text-[#0f172a]">{item.title}</h5>
                          <LabelPill text={item.priority} tone={item.priority === 'high' ? 'high' : item.priority === 'medium' ? 'medium' : 'low'} />
                        </div>
                        <div className="mt-1 space-y-1 text-xs text-[#475569]">
                          <div>Hypothesis: {item.hypothesis || 'none'}</div>
                          <div>Method: {item.method || 'none'}</div>
                          <div>Metric: {item.metric || 'none'}</div>
                          <div>Result: {item.result || 'none'}</div>
                          <div>Learning: {item.learning || 'none'}</div>
                          <div>Dates: {formatDate(item.startDate)} → {formatDate(item.endDate)}</div>
                          <div>Goal: {item.linkedGoalTitle || 'none'}</div>
                          <div>Plan: {item.linkedPlanName || 'none'}</div>
                          <div>Project: {item.linkedProjectName || 'none'}</div>
                        </div>
                        <div className="mt-2 flex gap-2">
                          <button type="button" onClick={() => openModal({ type: 'experiment', item })} className="rounded-md border border-[#cbd5e1] bg-white px-2 py-1 text-xs text-[#0f172a]">Edit</button>
                          <button type="button" onClick={() => onDeleteStrategyExperiment(item.id)} className="rounded-md border border-[#fecaca] bg-white px-2 py-1 text-xs text-[#991b1b]">Delete</button>
                        </div>
                      </article>
                    ))
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderDecisionsSection = () => (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            setDecisionForm({
              title: '',
              context: '',
              decision: '',
              reason: '',
              expectedResult: '',
              reviewDate: '',
              status: 'planned',
              priority: 'medium',
              linkedGoalId: '',
              linkedPlanId: '',
              linkedProjectId: '',
            });
            openModal({ type: 'decision' });
          }}
          className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]"
        >
          Add Decision
        </button>
      </div>

      {strategyDecisions.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#cbd5e1] bg-[#f8fafc] p-4 text-sm text-[#64748b]">
          No decisions logged yet. Record important choices and review them later.
        </div>
      ) : (
        <div className="space-y-2">
          {strategyDecisions.map((item) => {
            const needsReview = Boolean(item.reviewDate && item.reviewDate.slice(0, 10) <= today);
            return (
              <article key={item.id} className={`rounded-md border p-4 ${needsReview ? 'border-[#fca5a5] bg-[#fff1f2]' : 'border-[#e2e8f0] bg-[#f8fafc]'}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-[#0f172a]">{item.title}</h4>
                    <p className="mt-1 text-sm text-[#475569]">{item.context || 'No context provided'}</p>
                  </div>
                  <div className="flex gap-2">
                    {needsReview ? <LabelPill text="Needs Review" tone="danger" /> : null}
                    <button type="button" onClick={() => openModal({ type: 'decision', item })} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs text-[#0f172a]">Edit</button>
                    <button type="button" onClick={() => onDeleteStrategyDecision(item.id)} className="rounded-md border border-[#fecaca] bg-white px-3 py-1.5 text-xs text-[#991b1b]">Delete</button>
                  </div>
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 text-sm text-[#334155] md:grid-cols-2">
                  <div><strong>Decision:</strong> {item.decision || 'none'}</div>
                  <div><strong>Reason:</strong> {item.reason || 'none'}</div>
                  <div><strong>Expected result:</strong> {item.expectedResult || 'none'}</div>
                  <div><strong>Review date:</strong> {formatDate(item.reviewDate)}</div>
                  <div><strong>Status:</strong> {item.status}</div>
                  <div><strong>Goal / Plan / Project:</strong> {item.linkedGoalTitle || 'none'} / {item.linkedPlanName || 'none'} / {item.linkedProjectName || 'none'}</div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderEthicalFilterSection = () => (
    <div className="space-y-3">
      <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-4">
        <h4 className="text-sm font-semibold text-[#0f172a]">Principles</h4>
        <div className="mt-2 flex flex-wrap gap-2">
          <LabelPill text="avoid gambling" tone="danger" />
          <LabelPill text="avoid adult content" tone="danger" />
          <LabelPill text="avoid interest-based loans" tone="danger" />
          <LabelPill text="review fintech/insurance/speculative crypto" tone="medium" />
          <LabelPill text="prefer education, health, productivity, ethical commerce" tone="success" />
        </div>
      </div>

      <div className="flex justify-end">
        <button
          type="button"
          onClick={() => {
            void onAddStrategyItem({
              section: 'ethical_filter',
              title: 'New ethical filter rule',
              content: 'Define a concrete filter condition.',
              priority: 'medium',
              status: 'active',
            });
          }}
          className="rounded-md border border-[#cbd5e1] bg-white px-4 py-2 text-sm text-[#0f172a]"
        >
          Add Ethical Strategy Item
        </button>
      </div>

      {ethicalItems.length === 0 ? (
        <div className="rounded-md border border-dashed border-[#cbd5e1] bg-white p-4 text-sm text-[#64748b]">No ethical filter items yet.</div>
      ) : (
        <div className="space-y-2">
          {ethicalItems.map((item) => (
            <article key={item.id} className="rounded-md border border-[#e2e8f0] bg-white p-3">
              <div className="flex items-start justify-between gap-2">
                <h5 className="text-sm font-semibold text-[#0f172a]">{item.title}</h5>
                <button type="button" onClick={() => onDeleteStrategyItem(item.id)} className="rounded-md border border-[#fecaca] bg-white px-2 py-1 text-xs text-[#991b1b]">Delete</button>
              </div>
              <p className="mt-1 text-sm text-[#64748b]">{item.content || 'No content'}</p>
            </article>
          ))}
        </div>
      )}
    </div>
  );

  const renderReviewSection = () => {
    const dueGoals = strategyGoals.filter((goal) => goal.targetDate && goal.targetDate.slice(0, 10) <= today && goal.status !== 'completed');
    const dueDecisions = strategyDecisions.filter((item) => item.reviewDate && item.reviewDate.slice(0, 10) <= today);

    return (
      <div className="space-y-3">
        <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-4">
          <h4 className="text-sm font-semibold text-[#0f172a]">Due for Review</h4>
          <p className="mt-1 text-xs text-[#64748b]">Keep strategic loops tight: review what is due, decide what to continue, stop, or switch.</p>
        </div>

        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          <section className="rounded-md border border-[#e2e8f0] bg-white p-3">
            <h5 className="text-sm font-semibold text-[#0f172a]">Goals with passed target date</h5>
            <div className="mt-2 space-y-2">
              {dueGoals.length === 0 ? <div className="text-sm text-[#64748b]">No overdue goals.</div> : dueGoals.map((goal) => (
                <div key={goal.id} className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-2 text-sm text-[#334155]">
                  {goal.title} ({formatDate(goal.targetDate)})
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-md border border-[#e2e8f0] bg-white p-3">
            <h5 className="text-sm font-semibold text-[#0f172a]">Decisions to review now</h5>
            <div className="mt-2 space-y-2">
              {dueDecisions.length === 0 ? <div className="text-sm text-[#64748b]">No due decisions.</div> : dueDecisions.map((item) => (
                <div key={item.id} className="rounded-md border border-[#fecaca] bg-[#fff1f2] p-2 text-sm text-[#7f1d1d]">
                  {item.title} ({formatDate(item.reviewDate)})
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    );
  };

  const renderCommandCenterSection = () => (
    <div className="space-y-3">
      <div className="rounded-md border border-[#e2e8f0] bg-white p-4">
        <h4 className="text-base font-semibold text-[#0f172a]">Strategic Command Center</h4>
        <p className="mt-1 text-sm text-[#64748b]">Use this workspace to align goals, plans, tactics, experiments, and decisions in one system.</p>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#334155]">
          <div className="font-semibold text-[#0f172a]">Goal Coverage</div>
          <div className="mt-1">{strategyGoals.length} goals | {strategyPlans.length} plans | {strategyTactics.length} tactics</div>
        </div>
        <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#334155]">
          <div className="font-semibold text-[#0f172a]">Experiment Engine</div>
          <div className="mt-1">{runningExperimentsCount} running | {experimentsByStatus.completed.length} completed | {experimentsByStatus.failed.length} failed</div>
        </div>
        <div className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-4 text-sm text-[#334155]">
          <div className="font-semibold text-[#0f172a]">Decision Quality</div>
          <div className="mt-1">{decisionsToReviewCount} due reviews | {strategyDecisions.length} logged decisions</div>
        </div>
      </div>

      <div className="rounded-md border border-[#e2e8f0] bg-white p-4">
        <h5 className="text-sm font-semibold text-[#0f172a]">Quick Actions</h5>
        <div className="mt-2 flex flex-wrap gap-2">
          <button type="button" onClick={() => openModal({ type: 'goal' })} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs text-[#0f172a]">Add Goal</button>
          <button type="button" onClick={() => openModal({ type: 'plan' })} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs text-[#0f172a]">Add Plan</button>
          <button type="button" onClick={() => openModal({ type: 'tactic' })} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs text-[#0f172a]">Add Tactic</button>
          <button type="button" onClick={() => openModal({ type: 'experiment' })} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs text-[#0f172a]">Add Experiment</button>
          <button type="button" onClick={() => openModal({ type: 'decision' })} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs text-[#0f172a]">Add Decision</button>
        </div>
      </div>
    </div>
  );

  const renderMainSection = () => {
    if (activeSection === 'command_center') return renderCommandCenterSection();
    if (activeSection === 'goals') return renderGoalsSection();
    if (activeSection === 'plans') return renderPlansSection();
    if (activeSection === 'tactics') return renderTacticsSection();
    if (activeSection === 'experiments') return renderExperimentsSection();
    if (activeSection === 'decisions') return renderDecisionsSection();
    if (activeSection === 'ethical_filter') return renderEthicalFilterSection();
    return renderReviewSection();
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
        <PanelCard title="Active Goals" value={activeGoalsCount} />
        <PanelCard title="Active Plans" value={activePlansCount} />
        <PanelCard title="Running Experiments" value={runningExperimentsCount} />
        <PanelCard title="Decisions to Review" value={decisionsToReviewCount} accent="text-[#9a3412]" />
        <PanelCard title="High Priority Items" value={highPriorityItemsCount} accent="text-[#991b1b]" />
        <PanelCard title="Average Progress" value={`${averageProgress}%`} accent="text-[#1e3a8a]" />
      </div>

      {starterVisible ? (
        <div className="rounded-lg border border-dashed border-[#cbd5e1] bg-white p-5">
          <h3 className="text-base font-semibold text-[#0f172a]">Create starter strategy system</h3>
          <p className="mt-1 text-sm text-[#64748b]">Bootstrap goals, plans A/B/C, tactics, experiments, and one initial decision in one click.</p>
          <div className="mt-3">
            <button
              type="button"
              onClick={handleCreateStarterSystem}
              disabled={isBusy}
              className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBusy ? 'Creating starter strategy system...' : 'Create starter strategy system'}
            </button>
          </div>
          {formError ? <p className="mt-2 text-sm text-[#b91c1c]">{formError}</p> : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-12">
        <aside className="xl:col-span-2 rounded-lg border border-[#e5e7eb] bg-white p-3 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <div className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Strategy</div>
          <div className="mt-3 flex flex-wrap gap-2 xl:flex-col">
            {SECTION_OPTIONS.map((section) => (
              <button
                key={section.value}
                type="button"
                onClick={() => setActiveSection(section.value)}
                className={`rounded-md border px-3 py-2 text-left text-sm ${
                  activeSection === section.value
                    ? 'border-[#1d4ed8] bg-[#eff6ff] text-[#1d4ed8]'
                    : 'border-[#e2e8f0] bg-[#f8fafc] text-[#334155] hover:border-[#cbd5e1]'
                }`}
              >
                {section.label}
              </button>
            ))}
          </div>
        </aside>

        <main className="xl:col-span-7 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          {renderMainSection()}
        </main>

        <aside className="xl:col-span-3 rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <h3 className="text-sm font-mono uppercase tracking-[0.14em] text-[#64748b]">Insight Sidebar</h3>

          <div className="mt-3 space-y-2 text-sm text-[#334155]">
            <p className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">What is the next concrete action?</p>
            <p className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">Does this support money, independence, or positioning?</p>
            <p className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">What proof will this create?</p>
            <p className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">What should be stopped?</p>
            <p className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">What is the fallback if Plan A fails?</p>
            <p className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">Is this aligned with Islamic/ethical filters?</p>
          </div>

          <div className="mt-4 space-y-3">
            <section className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#475569]">Top 3 High Priority Goals</h4>
              <div className="mt-2 space-y-2">
                {topPriorityGoals.length === 0 ? <div className="text-xs text-[#64748b]">No high-priority goals.</div> : topPriorityGoals.map((item) => (
                  <div key={item.id} className="rounded border border-[#dbe3ef] bg-white p-2 text-xs text-[#0f172a]">
                    {item.title} ({Math.round(Number(item.progress ?? 0))}%)
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#475569]">Nearest Review Dates</h4>
              <div className="mt-2 space-y-2">
                {nearestReviews.length === 0 ? <div className="text-xs text-[#64748b]">No review dates set.</div> : nearestReviews.map((item) => (
                  <div key={item.id} className="rounded border border-[#dbe3ef] bg-white p-2 text-xs text-[#0f172a]">
                    {item.title} - {formatDate(item.reviewDate)}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-md border border-[#e2e8f0] bg-[#f8fafc] p-3">
              <h4 className="text-xs font-semibold uppercase tracking-[0.08em] text-[#475569]">Plans At Risk</h4>
              <div className="mt-2 space-y-2">
                {plansAtRisk.length === 0 ? <div className="text-xs text-[#64748b]">No plans at risk.</div> : plansAtRisk.map((item) => (
                  <div key={item.id} className="rounded border border-[#fecaca] bg-[#fff1f2] p-2 text-xs text-[#7f1d1d]">
                    {item.name} ({Math.round(Number(item.progress ?? 0))}%)
                  </div>
                ))}
              </div>
            </section>
          </div>
        </aside>
      </div>

      {modalState ? (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-[#0f172a]/40 px-4 py-6">
          <div className="w-full max-w-[760px] rounded-xl border border-[#e2e8f0] bg-white p-5 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.45)]">
            <div className="flex items-center justify-between border-b border-[#e5e7eb] pb-3">
              <h4 className="text-base font-semibold text-[#0f172a]">
                {modalState.type === 'goal' ? (modalState.item ? 'Edit Goal' : 'Add Goal') : null}
                {modalState.type === 'plan' ? (modalState.item ? 'Edit Plan' : 'Add Plan') : null}
                {modalState.type === 'tactic' ? (modalState.item ? 'Edit Tactic' : 'Add Tactic') : null}
                {modalState.type === 'experiment' ? (modalState.item ? 'Edit Experiment' : 'Add Experiment') : null}
                {modalState.type === 'decision' ? (modalState.item ? 'Edit Decision' : 'Add Decision') : null}
              </h4>
              <button type="button" onClick={closeModal} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-1 text-sm text-[#334155]">Close</button>
            </div>

            {modalState.type === 'goal' ? (
              <form className="mt-4 space-y-3" onSubmit={handleSaveGoal}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="text-sm text-[#334155]">Title
                    <input value={goalForm.title || ''} onChange={(event) => setGoalForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" required />
                  </label>
                  <label className="text-sm text-[#334155]">Category
                    <select value={goalForm.category || 'career'} onChange={(event) => setGoalForm((current) => ({ ...current, category: event.target.value as StrategySection }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      {CATEGORY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Priority
                    <select value={goalForm.priority || 'medium'} onChange={(event) => setGoalForm((current) => ({ ...current, priority: event.target.value as StrategyPriority }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      {PRIORITY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Status
                    <select value={goalForm.status || 'active'} onChange={(event) => setGoalForm((current) => ({ ...current, status: event.target.value as StrategyStatus }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Time Horizon
                    <select value={goalForm.timeHorizon || ''} onChange={(event) => setGoalForm((current) => ({ ...current, timeHorizon: event.target.value as StrategyTimeHorizon }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {TIME_HORIZON_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Target Date
                    <input type="date" value={goalForm.targetDate || ''} onChange={(event) => setGoalForm((current) => ({ ...current, targetDate: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Progress
                    <input type="number" min={0} max={100} value={Number(goalForm.progress ?? 0)} onChange={(event) => setGoalForm((current) => ({ ...current, progress: parseProgress(event.target.value) }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Success Metric
                    <input value={goalForm.successMetric || ''} onChange={(event) => setGoalForm((current) => ({ ...current, successMetric: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Linked Project
                    <select value={goalForm.linkedProjectId || ''} onChange={(event) => setGoalForm((current) => ({ ...current, linkedProjectId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Linked Company
                    <select value={goalForm.linkedCompanyId || ''} onChange={(event) => setGoalForm((current) => ({ ...current, linkedCompanyId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block text-sm text-[#334155]">Description
                  <textarea value={goalForm.description || ''} onChange={(event) => setGoalForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <div className="flex justify-between border-t border-[#e5e7eb] pt-3">
                  <button type="button" disabled={!modalState.item} onClick={deleteByModalType} className="rounded-md border border-[#fecaca] bg-white px-3 py-2 text-sm text-[#991b1b] disabled:opacity-40">Delete</button>
                  <button type="submit" disabled={isBusy} className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white">{isBusy ? 'Saving...' : 'Save Goal'}</button>
                </div>
              </form>
            ) : null}

            {modalState.type === 'plan' ? (
              <form className="mt-4 space-y-3" onSubmit={handleSavePlan}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="text-sm text-[#334155]">Name
                    <input value={planForm.name || ''} onChange={(event) => setPlanForm((current) => ({ ...current, name: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" required />
                  </label>
                  <label className="text-sm text-[#334155]">Label
                    <select value={planForm.label || 'A'} onChange={(event) => setPlanForm((current) => ({ ...current, label: event.target.value as StrategyPlan['label'] }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="A">A</option>
                      <option value="B">B</option>
                      <option value="C">C</option>
                      <option value="D">D</option>
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Status
                    <select value={planForm.status || 'planned'} onChange={(event) => setPlanForm((current) => ({ ...current, status: event.target.value as StrategyStatus }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Priority
                    <select value={planForm.priority || 'medium'} onChange={(event) => setPlanForm((current) => ({ ...current, priority: event.target.value as StrategyPriority }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      {PRIORITY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Progress
                    <input type="number" min={0} max={100} value={Number(planForm.progress ?? 0)} onChange={(event) => setPlanForm((current) => ({ ...current, progress: parseProgress(event.target.value) }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Target Date
                    <input type="date" value={planForm.targetDate || ''} onChange={(event) => setPlanForm((current) => ({ ...current, targetDate: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Linked Goal
                    <select value={planForm.linkedGoalId || ''} onChange={(event) => setPlanForm((current) => ({ ...current, linkedGoalId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {strategyGoals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Linked Project
                    <select value={planForm.linkedProjectId || ''} onChange={(event) => setPlanForm((current) => ({ ...current, linkedProjectId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block text-sm text-[#334155]">Description
                  <textarea value={planForm.description || ''} onChange={(event) => setPlanForm((current) => ({ ...current, description: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-[#334155]">Assumptions
                  <textarea value={planForm.assumptions || ''} onChange={(event) => setPlanForm((current) => ({ ...current, assumptions: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-[#334155]">Risks
                  <textarea value={planForm.risks || ''} onChange={(event) => setPlanForm((current) => ({ ...current, risks: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-[#334155]">Resources Needed
                  <input value={planForm.resourcesNeeded || ''} onChange={(event) => setPlanForm((current) => ({ ...current, resourcesNeeded: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-[#334155]">Trigger to Switch
                  <input value={planForm.triggerToSwitch || ''} onChange={(event) => setPlanForm((current) => ({ ...current, triggerToSwitch: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-[#334155]">Next Action
                  <input value={planForm.nextAction || ''} onChange={(event) => setPlanForm((current) => ({ ...current, nextAction: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <div className="flex justify-between border-t border-[#e5e7eb] pt-3">
                  <button type="button" disabled={!modalState.item} onClick={deleteByModalType} className="rounded-md border border-[#fecaca] bg-white px-3 py-2 text-sm text-[#991b1b] disabled:opacity-40">Delete</button>
                  <button type="submit" disabled={isBusy} className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white">{isBusy ? 'Saving...' : 'Save Plan'}</button>
                </div>
              </form>
            ) : null}

            {modalState.type === 'tactic' ? (
              <form className="mt-4 space-y-3" onSubmit={handleSaveTactic}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="text-sm text-[#334155]">Title
                    <input value={tacticForm.title || ''} onChange={(event) => setTacticForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" required />
                  </label>
                  <label className="text-sm text-[#334155]">Category
                    <input value={tacticForm.category || ''} onChange={(event) => setTacticForm((current) => ({ ...current, category: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Status
                    <select value={tacticForm.status || 'active'} onChange={(event) => setTacticForm((current) => ({ ...current, status: event.target.value as StrategyStatus }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Priority
                    <select value={tacticForm.priority || 'medium'} onChange={(event) => setTacticForm((current) => ({ ...current, priority: event.target.value as StrategyPriority }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      {PRIORITY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Frequency
                    <input value={tacticForm.frequency || ''} onChange={(event) => setTacticForm((current) => ({ ...current, frequency: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Metric
                    <input value={tacticForm.metric || ''} onChange={(event) => setTacticForm((current) => ({ ...current, metric: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Next Action
                    <input value={tacticForm.nextAction || ''} onChange={(event) => setTacticForm((current) => ({ ...current, nextAction: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Linked Goal
                    <select value={tacticForm.linkedGoalId || ''} onChange={(event) => setTacticForm((current) => ({ ...current, linkedGoalId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {strategyGoals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Linked Plan
                    <select value={tacticForm.linkedPlanId || ''} onChange={(event) => setTacticForm((current) => ({ ...current, linkedPlanId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {strategyPlans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Linked Project
                    <select value={tacticForm.linkedProjectId || ''} onChange={(event) => setTacticForm((current) => ({ ...current, linkedProjectId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block text-sm text-[#334155]">Description
                  <textarea value={tacticForm.description || ''} onChange={(event) => setTacticForm((current) => ({ ...current, description: event.target.value }))} rows={3} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <div className="flex justify-between border-t border-[#e5e7eb] pt-3">
                  <button type="button" disabled={!modalState.item} onClick={deleteByModalType} className="rounded-md border border-[#fecaca] bg-white px-3 py-2 text-sm text-[#991b1b] disabled:opacity-40">Delete</button>
                  <button type="submit" disabled={isBusy} className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white">{isBusy ? 'Saving...' : 'Save Tactic'}</button>
                </div>
              </form>
            ) : null}

            {modalState.type === 'experiment' ? (
              <form className="mt-4 space-y-3" onSubmit={handleSaveExperiment}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="text-sm text-[#334155]">Title
                    <input value={experimentForm.title || ''} onChange={(event) => setExperimentForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" required />
                  </label>
                  <label className="text-sm text-[#334155]">Status
                    <select value={experimentForm.status || 'planned'} onChange={(event) => setExperimentForm((current) => ({ ...current, status: event.target.value as StrategyStatus }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Priority
                    <select value={experimentForm.priority || 'medium'} onChange={(event) => setExperimentForm((current) => ({ ...current, priority: event.target.value as StrategyPriority }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      {PRIORITY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Metric
                    <input value={experimentForm.metric || ''} onChange={(event) => setExperimentForm((current) => ({ ...current, metric: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Start Date
                    <input type="date" value={experimentForm.startDate || ''} onChange={(event) => setExperimentForm((current) => ({ ...current, startDate: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">End Date
                    <input type="date" value={experimentForm.endDate || ''} onChange={(event) => setExperimentForm((current) => ({ ...current, endDate: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Linked Goal
                    <select value={experimentForm.linkedGoalId || ''} onChange={(event) => setExperimentForm((current) => ({ ...current, linkedGoalId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {strategyGoals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Linked Plan
                    <select value={experimentForm.linkedPlanId || ''} onChange={(event) => setExperimentForm((current) => ({ ...current, linkedPlanId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {strategyPlans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Linked Project
                    <select value={experimentForm.linkedProjectId || ''} onChange={(event) => setExperimentForm((current) => ({ ...current, linkedProjectId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block text-sm text-[#334155]">Hypothesis
                  <textarea value={experimentForm.hypothesis || ''} onChange={(event) => setExperimentForm((current) => ({ ...current, hypothesis: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-[#334155]">Method
                  <textarea value={experimentForm.method || ''} onChange={(event) => setExperimentForm((current) => ({ ...current, method: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-[#334155]">Result
                  <textarea value={experimentForm.result || ''} onChange={(event) => setExperimentForm((current) => ({ ...current, result: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-[#334155]">Learning
                  <textarea value={experimentForm.learning || ''} onChange={(event) => setExperimentForm((current) => ({ ...current, learning: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <div className="flex justify-between border-t border-[#e5e7eb] pt-3">
                  <button type="button" disabled={!modalState.item} onClick={deleteByModalType} className="rounded-md border border-[#fecaca] bg-white px-3 py-2 text-sm text-[#991b1b] disabled:opacity-40">Delete</button>
                  <button type="submit" disabled={isBusy} className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white">{isBusy ? 'Saving...' : 'Save Experiment'}</button>
                </div>
              </form>
            ) : null}

            {modalState.type === 'decision' ? (
              <form className="mt-4 space-y-3" onSubmit={handleSaveDecision}>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <label className="text-sm text-[#334155]">Title
                    <input value={decisionForm.title || ''} onChange={(event) => setDecisionForm((current) => ({ ...current, title: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" required />
                  </label>
                  <label className="text-sm text-[#334155]">Review Date
                    <input type="date" value={decisionForm.reviewDate || ''} onChange={(event) => setDecisionForm((current) => ({ ...current, reviewDate: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                  </label>
                  <label className="text-sm text-[#334155]">Status
                    <select value={decisionForm.status || 'planned'} onChange={(event) => setDecisionForm((current) => ({ ...current, status: event.target.value as StrategyStatus }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      {STATUS_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Priority
                    <select value={decisionForm.priority || 'medium'} onChange={(event) => setDecisionForm((current) => ({ ...current, priority: event.target.value as StrategyPriority }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      {PRIORITY_OPTIONS.map((value) => <option key={value} value={value}>{value}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Linked Goal
                    <select value={decisionForm.linkedGoalId || ''} onChange={(event) => setDecisionForm((current) => ({ ...current, linkedGoalId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {strategyGoals.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Linked Plan
                    <select value={decisionForm.linkedPlanId || ''} onChange={(event) => setDecisionForm((current) => ({ ...current, linkedPlanId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {strategyPlans.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                  <label className="text-sm text-[#334155]">Linked Project
                    <select value={decisionForm.linkedProjectId || ''} onChange={(event) => setDecisionForm((current) => ({ ...current, linkedProjectId: event.target.value }))} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm">
                      <option value="">None</option>
                      {projects.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block text-sm text-[#334155]">Context
                  <textarea value={decisionForm.context || ''} onChange={(event) => setDecisionForm((current) => ({ ...current, context: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-[#334155]">Decision
                  <textarea value={decisionForm.decision || ''} onChange={(event) => setDecisionForm((current) => ({ ...current, decision: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-[#334155]">Reason
                  <textarea value={decisionForm.reason || ''} onChange={(event) => setDecisionForm((current) => ({ ...current, reason: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <label className="block text-sm text-[#334155]">Expected Result
                  <textarea value={decisionForm.expectedResult || ''} onChange={(event) => setDecisionForm((current) => ({ ...current, expectedResult: event.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-[#cbd5e1] px-3 py-2 text-sm" />
                </label>
                <div className="flex justify-between border-t border-[#e5e7eb] pt-3">
                  <button type="button" disabled={!modalState.item} onClick={deleteByModalType} className="rounded-md border border-[#fecaca] bg-white px-3 py-2 text-sm text-[#991b1b] disabled:opacity-40">Delete</button>
                  <button type="submit" disabled={isBusy} className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white">{isBusy ? 'Saving...' : 'Save Decision'}</button>
                </div>
              </form>
            ) : null}

            {formError ? <p className="mt-3 text-sm text-[#b91c1c]">{formError}</p> : null}
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default StrategyPanel;
