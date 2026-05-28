import React, { useState, useEffect } from 'react';
import { Button, Badge } from '../ui';
import type {
 Company, Person, Project,
 StrategyDecision, StrategyDecisionInput,
 StrategyExperiment, StrategyExperimentInput,
 StrategyGoal, StrategyGoalInput,
 StrategyItem, StrategyItemInput,
 StrategyNote,
 StrategyPlan, StrategyPlanInput,
 StrategyStatus,
 StrategyTactic, StrategyTacticInput,
} from '../../types/opportunities';
import CommandCenter from './StrategyCommandCenter';
import GoalsPanel from './StrategyGoalsPanel';
import GoalWorkspace from './GoalWorkspace';
import PlansPanel from './StrategyPlansPanel';
import TacticsPanel from './StrategyTacticsPanel';
import ExperimentsPanel from './StrategyExperimentsPanel';
import DecisionsPanel from './StrategyDecisionsPanel';
import ItemModal, { type ModalState } from './StrategyItemModal';

type StrategyPanelProps = {
 section?: Section;
 strategyItems: StrategyItem[];
 strategyNotes: StrategyNote[];
 strategyGoals: StrategyGoal[];
 strategyPlans: StrategyPlan[];
 strategyTactics: StrategyTactic[];
 strategyExperiments: StrategyExperiment[];
 strategyDecisions: StrategyDecision[];
 projects: Project[];
 companies: Company[];
 people: Person[];
 onBackToDesktop?: () => void;
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
 section,
 strategyItems, strategyNotes, strategyGoals, strategyPlans, strategyTactics, strategyExperiments, strategyDecisions,
 projects, companies, people,
 onBackToDesktop,
 onAddStrategyItem, onDeleteStrategyItem,
 onAddStrategyGoal, onUpdateStrategyGoal, onDeleteStrategyGoal,
 onAddStrategyPlan, onUpdateStrategyPlan, onDeleteStrategyPlan,
 onAddStrategyTactic, onUpdateStrategyTactic, onDeleteStrategyTactic,
 onAddStrategyExperiment, onUpdateStrategyExperiment, onDeleteStrategyExperiment,
 onAddStrategyDecision, onUpdateStrategyDecision, onDeleteStrategyDecision,
}) => {
 const [activeSection, setActiveSection] = useState<Section>('command_center');

 useEffect(() => {
 if (section) setActiveSection(section);
 }, [section]);

 const [modalState, setModalState] = useState<ModalState>(null);
 const [isBusy, setIsBusy] = useState(false);
 const [formError, setFormError] = useState<string | null>(null);
 const [goalFilterCategory, setGoalFilterCategory] = useState('');
 const [goalFilterStatus, setGoalFilterStatus] = useState('');
 const [goalFilterPriority, setGoalFilterPriority] = useState('');
 const [goalProgressDraft, setGoalProgressDraft] = useState<Record<string, number>>({});
 const [planProgressDraft, setPlanProgressDraft] = useState<Record<string, number>>({});
 const [planStatusDraft, setPlanStatusDraft] = useState<Record<string, StrategyStatus>>({});

 const safeStrategyItems = strategyItems ?? [];
 const safeStrategyGoals = strategyGoals ?? [];
 const safeStrategyPlans = strategyPlans ?? [];
 const safeStrategyTactics = strategyTactics ?? [];
 const safeStrategyExperiments = strategyExperiments ?? [];
 const safeStrategyDecisions = strategyDecisions ?? [];

 const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
 const selectedGoal = selectedGoalId ? safeStrategyGoals.find(g => g.id === selectedGoalId) ?? null : null;

 const [goalForm, setGoalForm] = useState<StrategyGoalInput>(emptyGoalForm());
 const [planForm, setPlanForm] = useState<StrategyPlanInput>(emptyPlanForm());
 const [tacticForm, setTacticForm] = useState<StrategyTacticInput>(emptyTacticForm());
 const [experimentForm, setExperimentForm] = useState<StrategyExperimentInput>(emptyExperimentForm());
 const [decisionForm, setDecisionForm] = useState<StrategyDecisionInput>(emptyDecisionForm());

 const [planFilterVariant, setPlanFilterVariant] = useState('');
 const [planFilterStatus, setPlanFilterStatus] = useState('');
 const [planFilterPriority, setPlanFilterPriority] = useState('');
 const [tacticFilterStatus, setTacticFilterStatus] = useState('');
 const [experimentFilterStatus, setExperimentFilterStatus] = useState('');
 const [decisionFilterStatus, setDecisionFilterStatus] = useState('');

 const today = todayKey();

 const starterVisible = safeStrategyGoals.length === 0 && safeStrategyPlans.length === 0;

 const activeGoalsCount = safeStrategyGoals.filter((g) => g.status === 'active').length;
 const activePlansCount = safeStrategyPlans.filter((p) => p.status === 'active' || p.status === 'planned').length;
 const runningExperimentsCount = safeStrategyExperiments.filter((e) => e.status === 'active').length;
 const decisionsToReviewCount = safeStrategyDecisions.filter((d) => d.reviewDate && d.reviewDate.slice(0, 10) <= today).length;
 const highPriorityItemsCount =
 safeStrategyGoals.filter((g) => g.priority === 'high').length +
 safeStrategyPlans.filter((p) => p.priority === 'high').length +
 safeStrategyTactics.filter((t) => t.priority === 'high').length +
 safeStrategyExperiments.filter((e) => e.priority === 'high').length +
 safeStrategyDecisions.filter((d) => d.priority === 'high').length;
 const averageProgress = React.useMemo(() => {
 const values = [...safeStrategyGoals, ...safeStrategyPlans]
 .map((item) => Number(item.progress ?? 0))
 .filter((v) => Number.isFinite(v));
 return values.length === 0 ? 0 : Math.round(values.reduce((a, v) => a + v, 0) / values.length);
 }, [safeStrategyGoals, safeStrategyPlans]);
 const completedExperimentsCount = safeStrategyExperiments.filter((e) => e.status === 'completed').length;
 const failedExperimentsCount = safeStrategyExperiments.filter((e) => e.status === 'failed').length;

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
 activeGoalsCount={activeGoalsCount}
 activePlansCount={activePlansCount}
 runningExperimentsCount={runningExperimentsCount}
 decisionsToReviewCount={decisionsToReviewCount}
 highPriorityItemsCount={highPriorityItemsCount}
 averageProgress={averageProgress}
 completedExperimentsCount={completedExperimentsCount}
 failedExperimentsCount={failedExperimentsCount}
 strategyGoals={strategyGoals}
 strategyPlans={strategyPlans}
 strategyDecisions={strategyDecisions}
 quickActions={[
 { label: '+ Goal', onClick: () => openModal({ type: 'goal' }) },
 { label: '+ Plan', onClick: () => openModal({ type: 'plan' }) },
 { label: '+ Tactic', onClick: () => openModal({ type: 'tactic' }) },
 { label: '+ Experiment', onClick: () => openModal({ type: 'experiment' }) },
 { label: '+ Decision', onClick: () => openModal({ type: 'decision' }) },
 ]}
 onViewAllGoals={() => setActiveSection('goals')}
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
 filterVariant={planFilterVariant}
 setFilterVariant={setPlanFilterVariant}
 filterStatus={planFilterStatus}
 setFilterStatus={setPlanFilterStatus}
 filterPriority={planFilterPriority}
 setFilterPriority={setPlanFilterPriority}
 onEdit={(plan) => openModal({ type: 'plan', item: plan })}
 onDelete={onDeleteStrategyPlan}
 onOpenNew={() => openModal({ type: 'plan' })}
 />
 );
 case 'tactics':
 return (
 <TacticsPanel
 tactics={strategyTactics}
 tacticForm={tacticForm}
 setTacticForm={setTacticForm}
 onAdd={onAddStrategyTactic}
 onUpdate={onUpdateStrategyTactic}
 onDelete={onDeleteStrategyTactic}
 onEdit={(tactic) => openModal({ type: 'tactic', item: tactic })}
 onOpenNew={() => openModal({ type: 'tactic' })}
 filterStatus={tacticFilterStatus}
 setFilterStatus={setTacticFilterStatus}
 />
 );
 case 'experiments':
 return (
 <ExperimentsPanel
 experiments={strategyExperiments}
 experimentForm={experimentForm}
 setExperimentForm={setExperimentForm}
 onAdd={onAddStrategyExperiment}
 onUpdate={onUpdateStrategyExperiment}
 onDelete={onDeleteStrategyExperiment}
 onEdit={(exp) => openModal({ type: 'experiment', item: exp })}
 onOpenNew={() => openModal({ type: 'experiment' })}
 experimentsFilterStatus={experimentFilterStatus}
 setExperimentsFilterStatus={setExperimentFilterStatus}
 />
 );
 case 'decisions':
 return (
 <DecisionsPanel
 decisions={strategyDecisions}
 decisionForm={decisionForm}
 setDecisionForm={setDecisionForm}
 onAdd={onAddStrategyDecision}
 onUpdate={onUpdateStrategyDecision}
 onDelete={onDeleteStrategyDecision}
 onEdit={(decision) => openModal({ type: 'decision', item: decision })}
 onOpenNew={() => openModal({ type: 'decision' })}
 filterStatus={decisionFilterStatus}
 setFilterStatus={setDecisionFilterStatus}
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
 const ethicalItems = safeStrategyItems.filter((item) => item.section === 'ethical_filter');
 return (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">Ethical Principles</h4>
 <div className="mt-3 flex flex-wrap gap-2">
 <Badge variant="danger">avoid gambling</Badge>
 <Badge variant="danger">avoid adult content</Badge>
 <Badge variant="danger">avoid interest-based loans</Badge>
 <Badge variant="warning">review fintech/insurance/speculative crypto</Badge>
 <Badge variant="success">prefer education, health, productivity, ethical commerce</Badge>
 </div>
 </div>
 <div className="flex justify-end">
 <Button
 type="button"
 variant="secondary"
 size="sm"
 onClick={() => onAddStrategyItem({ section: 'ethical_filter', title: 'New ethical filter rule', content: 'Define a concrete filter condition.', priority: 'medium', status: 'active' })}
 >
 Add Ethical Item
 </Button>
 </div>
 {ethicalItems.length === 0 ? (
 <div className="rounded-xl border-2 border-dashed border-neutral-200 bg-neutral-50 p-6 text-center text-sm text-neutral-500">No ethical filter items yet.</div>
 ) : (
 <div className="space-y-2">
 {ethicalItems.map((item) => (
 <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex items-start justify-between gap-2">
 <div className="min-w-0">
 <h5 className="text-sm font-semibold text-neutral-900">{item.title}</h5>
 <p className="mt-1 text-sm text-neutral-500">{item.content || 'No content'}</p>
 </div>
 <Button type="button" variant="danger" size="sm" onClick={() => onDeleteStrategyItem(item.id)}>Delete</Button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 };

 const renderReview = () => {
 const dueGoals = safeStrategyGoals.filter((g) => g.targetDate && g.targetDate.slice(0, 10) <= today && g.status !== 'completed');
 const dueDecisions = safeStrategyDecisions.filter((d) => d.reviewDate && d.reviewDate.slice(0, 10) <= today);
 const dueExperiments = safeStrategyExperiments.filter((e) => e.endDate && e.endDate.slice(0, 10) <= today && e.status !== 'completed' && e.status !== 'failed');

 return (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">Strategic Review</h4>
 <p className="mt-1 text-xs text-neutral-500">Keep strategic loops tight: review what is due, decide what to continue, stop, or switch.</p>
 </div>
 <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h5 className="text-sm font-semibold text-neutral-900">Overdue Goals</h5>
 <div className="mt-3 space-y-2">
 {dueGoals.length === 0
 ? <p className="text-sm text-neutral-500">No overdue goals.</p>
 : dueGoals.map((g) => (
 <div key={g.id} className="rounded-lg border border-neutral-200 bg-neutral-50 p-2.5 text-sm text-neutral-700">
 <div className="font-medium">{g.title}</div>
 <div className="text-xs text-neutral-500">Target: {g.targetDate?.slice(0, 10)}</div>
 </div>
 ))}
 </div>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h5 className="text-sm font-semibold text-neutral-900">Decisions to Review</h5>
 <div className="mt-3 space-y-2">
 {dueDecisions.length === 0
 ? <p className="text-sm text-neutral-500">No due decisions.</p>
 : dueDecisions.map((d) => (
 <div key={d.id} className="rounded-lg border border-red-200 bg-red-50 p-2.5 text-sm text-red-700">
 <div className="font-medium">{d.title}</div>
 <div className="text-xs">Review: {d.reviewDate?.slice(0, 10)}</div>
 </div>
 ))}
 </div>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h5 className="text-sm font-semibold text-neutral-900">Experiments Past End</h5>
 <div className="mt-3 space-y-2">
 {dueExperiments.length === 0
 ? <p className="text-sm text-neutral-500">No experiments past end date.</p>
 : dueExperiments.map((e) => (
 <div key={e.id} className="rounded-lg border border-amber-200 bg-amber-50 p-2.5 text-sm text-amber-700">
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
 <GoalWorkspace
 goal={selectedGoal}
 strategyGoals={strategyGoals}
 strategyPlans={strategyPlans}
 strategyTactics={strategyTactics}
 strategyExperiments={strategyExperiments}
 strategyDecisions={strategyDecisions}
 strategyItems={strategyItems}
 projects={projects}
 companies={companies}
 onBack={() => setSelectedGoalId(null)}
 onEditGoal={(goal) => openModal({ type: 'goal', item: goal })}
 onDeleteGoal={onDeleteStrategyGoal}
 onAddStrategyPlan={onAddStrategyPlan}
 onUpdateStrategyPlan={onUpdateStrategyPlan}
 onDeleteStrategyPlan={onDeleteStrategyPlan}
 onAddStrategyTactic={onAddStrategyTactic}
 onUpdateStrategyTactic={onUpdateStrategyTactic}
 onDeleteStrategyTactic={onDeleteStrategyTactic}
 onAddStrategyExperiment={onAddStrategyExperiment}
 onUpdateStrategyExperiment={onUpdateStrategyExperiment}
 onDeleteStrategyExperiment={onDeleteStrategyExperiment}
 onAddStrategyDecision={onAddStrategyDecision}
 onUpdateStrategyDecision={onUpdateStrategyDecision}
 onDeleteStrategyDecision={onDeleteStrategyDecision}
 />
 ) : (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white px-5 py-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="min-w-0">
 <button type="button" onClick={onBackToDesktop} className="text-xs font-medium text-neutral-500 hover:text-neutral-900">
 ← Back to Desktop
 </button>
 <h2 className="mt-2 text-xl font-semibold text-neutral-900">Strategy</h2>
 <p className="mt-1 text-sm text-neutral-600">Goals, plans, tactics, experiments, and decisions organized by goal.</p>
 </div>
 <Button type="button" variant="primary" size="md" onClick={() => openModal({ type: 'goal' })}>
 Add Goal
 </Button>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-xs uppercase tracking-[0.08em] text-neutral-500">Active goals</div>
 <div className="mt-2 text-2xl font-semibold text-neutral-900">{activeGoalsCount}</div>
 <div className="mt-1 text-xs text-neutral-500">Currently active</div>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-xs uppercase tracking-[0.08em] text-neutral-500">High priority</div>
 <div className="mt-2 text-2xl font-semibold text-neutral-900">{safeStrategyGoals.filter((goal) => goal.priority === 'high').length}</div>
 <div className="mt-1 text-xs text-neutral-500">Goals only</div>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-xs uppercase tracking-[0.08em] text-neutral-500">With linked work</div>
 <div className="mt-2 text-2xl font-semibold text-neutral-900">{safeStrategyGoals.filter((goal) => Boolean(goal.linkedProjectId || goal.linkedCompanyId)).length}</div>
 <div className="mt-1 text-xs text-neutral-500">Project or company</div>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-xs uppercase tracking-[0.08em] text-neutral-500">Average progress</div>
 <div className="mt-2 text-2xl font-semibold text-neutral-900">{averageProgress}%</div>
 <div className="mt-1 text-xs text-neutral-500">Across goals</div>
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h3 className="text-sm font-semibold text-neutral-900">Goals Dashboard</h3>
 <p className="mt-0.5 text-xs text-neutral-500">Open one goal to enter the full workspace.</p>
 </div>
 <Badge variant="neutral">Top level only</Badge>
 </div>
 </div>

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
 showCreateButton={false}
 />
 </div>
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
