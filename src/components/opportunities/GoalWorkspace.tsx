import React, { useMemo, useState } from 'react';
import DirectionalText from '../DirectionalText';
import { detectTextDirection } from '../../utils/textDirection';
import type {
 Company,
 Project,
 StrategyDecision,
 StrategyDecisionInput,
 StrategyExperiment,
 StrategyExperimentInput,
 StrategyGoal,
 StrategyGoalInput,
 StrategyItem,
 StrategyPlan,
 StrategyPlanInput,
 StrategyStatus,
 StrategyTactic,
 StrategyTacticInput,
} from '../../types/opportunities';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import ItemModal, { type ModalState } from './StrategyItemModal';

type TabId = 'overview' | 'plans' | 'tactics' | 'experiments' | 'decisions' | 'review' | 'ethical_filter' | 'notes';

const TABS: Array<{ id: TabId; label: string }> = [
 { id: 'overview', label: 'Overview' },
 { id: 'plans', label: 'Plans' },
 { id: 'tactics', label: 'Tactics' },
 { id: 'experiments', label: 'Experiments' },
 { id: 'decisions', label: 'Decisions' },
 { id: 'review', label: 'Review' },
 { id: 'ethical_filter', label: 'Ethical Filter' },
 { id: 'notes', label: 'Notes' },
];

const STATUS_OPTIONS: StrategyStatus[] = ['active', 'planned', 'paused', 'completed', 'archived', 'failed'];

const emptyPlanForm = (): StrategyPlanInput => ({
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

const emptyTacticForm = (): StrategyTacticInput => ({
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

const emptyExperimentForm = (): StrategyExperimentInput => ({
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

const emptyDecisionForm = (): StrategyDecisionInput => ({
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

const formatDate = (value?: string) => (value ? value.slice(0, 10) : '—');

const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'neutral' | 'blue' => {
 if (status === 'active' || status === 'completed') return 'success';
 if (status === 'planned') return 'blue';
 if (status === 'paused' || status === 'archived') return 'warning';
 if (status === 'failed') return 'danger';
 return 'neutral';
};

type Props = {
 goal: StrategyGoal | null | undefined;
 strategyGoals: StrategyGoal[];
 strategyPlans: StrategyPlan[];
 strategyTactics: StrategyTactic[];
 strategyExperiments: StrategyExperiment[];
 strategyDecisions: StrategyDecision[];
 strategyItems: StrategyItem[];
 projects: Project[];
 companies: Company[];
 onBack: () => void;
 onEditGoal: (goal: StrategyGoal) => void;
 onDeleteGoal: (id: string) => Promise<void>;
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

const GoalWorkspace: React.FC<Props> = ({
 goal,
 strategyGoals,
 strategyPlans,
 strategyTactics,
 strategyExperiments,
 strategyDecisions,
 strategyItems,
 projects,
 companies,
 onBack,
 onEditGoal,
 onDeleteGoal,
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
 const [activeTab, setActiveTab] = useState<TabId>('overview');
 const [modalState, setModalState] = useState<ModalState>(null);
 const [isBusy, setIsBusy] = useState(false);
 const [formError, setFormError] = useState<string | null>(null);
 const [planForm, setPlanForm] = useState<StrategyPlanInput>(emptyPlanForm());
 const [tacticForm, setTacticForm] = useState<StrategyTacticInput>(emptyTacticForm());
 const [experimentForm, setExperimentForm] = useState<StrategyExperimentInput>(emptyExperimentForm());
 const [decisionForm, setDecisionForm] = useState<StrategyDecisionInput>(emptyDecisionForm());

 const selectedGoal = goal ?? null;
 const selectedGoalId = selectedGoal?.id ?? '';
 const safePlans = strategyPlans ?? [];
 const safeTactics = strategyTactics ?? [];
 const safeExperiments = strategyExperiments ?? [];
 const safeDecisions = strategyDecisions ?? [];
 const safeItems = strategyItems ?? [];

 const today = new Date().toISOString().slice(0, 10);

 const filteredPlans = useMemo(() => safePlans.filter((plan) => plan.linkedGoalId === selectedGoalId), [safePlans, selectedGoalId]);
 const filteredTactics = useMemo(() => safeTactics.filter((tactic) => tactic.linkedGoalId === selectedGoalId), [safeTactics, selectedGoalId]);
 const filteredExperiments = useMemo(() => safeExperiments.filter((experiment) => experiment.linkedGoalId === selectedGoalId), [safeExperiments, selectedGoalId]);
 const filteredDecisions = useMemo(() => safeDecisions.filter((decision) => decision.linkedGoalId === selectedGoalId), [safeDecisions, selectedGoalId]);
 const ethicalItems = useMemo(() => safeItems.filter((item) => item.section === 'ethical_filter'), [safeItems]);

 const linkedProject = projects.find((project) => project.id === selectedGoal?.linkedProjectId);
 const linkedCompany = companies.find((company) => company.id === selectedGoal?.linkedCompanyId);

 if (!selectedGoal) {
 return <EmptyState title="Goal not found" description="Select a goal from Strategy to open its workspace." />;
 }

 const decisionsDue = filteredDecisions.filter((decision) => decision.reviewDate && decision.reviewDate.slice(0, 10) <= today);
 const plansByLabel = {
 A: filteredPlans.filter((plan) => plan.label === 'A'),
 B: filteredPlans.filter((plan) => plan.label === 'B'),
 C: filteredPlans.filter((plan) => plan.label === 'C'),
 other: filteredPlans.filter((plan) => plan.label !== 'A' && plan.label !== 'B' && plan.label !== 'C'),
 };

 const openModal = (type: 'plan' | 'tactic' | 'experiment' | 'decision', item?: StrategyPlan | StrategyTactic | StrategyExperiment | StrategyDecision) => {
 setFormError(null);
 if (type === 'plan') {
 const plan = item as StrategyPlan | undefined;
 setPlanForm(plan ? {
 name: plan.name,
 label: plan.label,
 description: plan.description || '',
 status: plan.status,
 priority: plan.priority,
 assumptions: plan.assumptions || '',
 risks: plan.risks || '',
 resourcesNeeded: plan.resourcesNeeded || '',
 triggerToSwitch: plan.triggerToSwitch || '',
 nextAction: plan.nextAction || '',
 targetDate: plan.targetDate ? plan.targetDate.slice(0, 10) : '',
 progress: plan.progress ?? 0,
 linkedGoalId: plan.linkedGoalId || selectedGoal.id,
 linkedProjectId: plan.linkedProjectId || '',
 } : { ...emptyPlanForm(), linkedGoalId: selectedGoal.id });
 setModalState(plan ? { type: 'plan', item: plan } : { type: 'plan' });
 return;
 }

 if (type === 'tactic') {
 const tactic = item as StrategyTactic | undefined;
 setTacticForm(tactic ? {
 title: tactic.title,
 description: tactic.description || '',
 category: tactic.category || '',
 status: tactic.status,
 priority: tactic.priority,
 frequency: tactic.frequency || '',
 metric: tactic.metric || '',
 nextAction: tactic.nextAction || '',
 linkedGoalId: tactic.linkedGoalId || selectedGoal.id,
 linkedPlanId: tactic.linkedPlanId || '',
 linkedProjectId: tactic.linkedProjectId || '',
 } : { ...emptyTacticForm(), linkedGoalId: selectedGoal.id });
 setModalState(tactic ? { type: 'tactic', item: tactic } : { type: 'tactic' });
 return;
 }

 if (type === 'experiment') {
 const experiment = item as StrategyExperiment | undefined;
 setExperimentForm(experiment ? {
 title: experiment.title,
 hypothesis: experiment.hypothesis || '',
 method: experiment.method || '',
 metric: experiment.metric || '',
 result: experiment.result || '',
 learning: experiment.learning || '',
 status: experiment.status,
 priority: experiment.priority,
 startDate: experiment.startDate ? experiment.startDate.slice(0, 10) : '',
 endDate: experiment.endDate ? experiment.endDate.slice(0, 10) : '',
 linkedGoalId: experiment.linkedGoalId || selectedGoal.id,
 linkedPlanId: experiment.linkedPlanId || '',
 linkedProjectId: experiment.linkedProjectId || '',
 } : { ...emptyExperimentForm(), linkedGoalId: selectedGoal.id });
 setModalState(experiment ? { type: 'experiment', item: experiment } : { type: 'experiment' });
 return;
 }

 const decision = item as StrategyDecision | undefined;
 setDecisionForm(decision ? {
 title: decision.title,
 context: decision.context || '',
 decision: decision.decision || '',
 reason: decision.reason || '',
 expectedResult: decision.expectedResult || '',
 reviewDate: decision.reviewDate ? decision.reviewDate.slice(0, 10) : '',
 status: decision.status,
 priority: decision.priority,
 linkedGoalId: decision.linkedGoalId || selectedGoal.id,
 linkedPlanId: decision.linkedPlanId || '',
 linkedProjectId: decision.linkedProjectId || '',
 } : { ...emptyDecisionForm(), linkedGoalId: selectedGoal.id });
 setModalState(decision ? { type: 'decision', item: decision } : { type: 'decision' });
 };

 const closeModal = () => {
 if (isBusy) return;
 setModalState(null);
 setFormError(null);
 };

 const handleSavePlan = async (event: React.FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 if (!planForm.name.trim()) {
 setFormError('Plan name is required.');
 return;
 }

 setIsBusy(true);
 setFormError(null);
 try {
 const payload = { ...planForm, name: planForm.name.trim(), linkedGoalId: planForm.linkedGoalId || selectedGoal.id };
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
 if (!tacticForm.title.trim()) {
 setFormError('Tactic title is required.');
 return;
 }

 setIsBusy(true);
 setFormError(null);
 try {
 const payload = { ...tacticForm, title: tacticForm.title.trim(), linkedGoalId: tacticForm.linkedGoalId || selectedGoal.id };
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
 if (!experimentForm.title.trim()) {
 setFormError('Experiment title is required.');
 return;
 }

 setIsBusy(true);
 setFormError(null);
 try {
 const payload = { ...experimentForm, title: experimentForm.title.trim(), linkedGoalId: experimentForm.linkedGoalId || selectedGoal.id };
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
 if (!decisionForm.title.trim()) {
 setFormError('Decision title is required.');
 return;
 }

 setIsBusy(true);
 setFormError(null);
 try {
 const payload = { ...decisionForm, title: decisionForm.title.trim(), linkedGoalId: decisionForm.linkedGoalId || selectedGoal.id };
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

 const handleDeleteModalItem = async () => {
 if (!modalState?.item) return;

 setIsBusy(true);
 setFormError(null);
 try {
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

 const renderOverview = () => (
 <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
 <div className="space-y-4 lg:col-span-2">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="min-w-0">
 <div className="flex flex-wrap items-center gap-2">
 <Badge variant="neutral">{goal.category}</Badge>
 <Badge variant={getStatusVariant(goal.status)}>{goal.status}</Badge>
 <Badge variant={goal.priority === 'high' ? 'warning' : 'neutral'}>{goal.priority}</Badge>
 </div>
 <DirectionalText text={goal.title} as="h3" className="mt-3 text-lg font-semibold text-neutral-900" />
 {goal.description ? <DirectionalText text={goal.description} as="p" className="mt-1 text-sm text-neutral-600" /> : null}
 </div>
 <div className="flex shrink-0 gap-2">
 <Button type="button" variant="secondary" size="sm" onClick={() => onEditGoal(goal)}>Edit Goal</Button>
 <Button type="button" variant="danger" size="sm" onClick={() => onDeleteGoal(goal.id)}>Delete Goal</Button>
 </div>
 </div>
 <div className="mt-4">
 <div className="flex items-center justify-between text-xs text-neutral-500">
 <span>Progress</span>
 <span>{Math.round(Number(goal.progress ?? 0))}%</span>
 </div>
 <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-neutral-100">
 <div className="h-full rounded-full bg-neutral-900" style={{ width: `${Math.round(Number(goal.progress ?? 0))}%` }} />
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
 <MetricCard label="Plans" value={filteredPlans.length} hint="Linked to this goal" />
 <MetricCard label="Tactics" value={filteredTactics.length} hint="Execution layer" />
 <MetricCard label="Experiments" value={filteredExperiments.length} hint="Learning layer" />
 <MetricCard label="Decisions due" value={decisionsDue.length} hint="Review required" />
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="border-b border-neutral-200 px-5 py-4">
 <h4 className="text-sm font-semibold text-neutral-900">Goal Details</h4>
 </div>
 <div className="grid grid-cols-1 divide-y divide-neutral-100 md:grid-cols-2 md:divide-x md:divide-y-0">
 <DetailRow label="Target date" value={formatDate(goal.targetDate)} />
 <DetailRow label="Success metric" value={goal.successMetric || '—'} />
 <DetailRow label="Linked project" value={linkedProject?.name || '—'} />
 <DetailRow label="Linked company" value={linkedCompany?.name || '—'} />
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="border-b border-neutral-200 px-5 py-4">
 <h4 className="text-sm font-semibold text-neutral-900">Related Work</h4>
 </div>
 <div className="grid grid-cols-1 gap-4 p-5 md:grid-cols-2">
 <MiniList title="Plans A/B/C" items={[
 ...plansByLabel.A.slice(0, 2).map((plan) => plan.name),
 ...plansByLabel.B.slice(0, 2).map((plan) => plan.name),
 ...plansByLabel.C.slice(0, 2).map((plan) => plan.name),
 ]} emptyLabel="No plans linked yet." />
 <MiniList title="Active decisions" items={filteredDecisions.slice(0, 4).map((decision) => decision.title)} emptyLabel="No decisions linked yet." />
 </div>
 </div>
 </div>

 <aside className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">Goal Workspace</h4>
 <p className="mt-1 text-sm text-neutral-600">Use this as the single working surface for one goal. Plans, tactics, experiments, decisions, review, ethical filter, and notes stay inside the goal boundary.</p>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="border-b border-neutral-200 px-5 py-4">
 <h4 className="text-sm font-semibold text-neutral-900">Next Review</h4>
 </div>
 {decisionsDue.length === 0 ? (
 <div className="px-5 py-4 text-sm text-neutral-500">No review date is due.</div>
 ) : (
 <ul className="divide-y divide-neutral-100">
 {decisionsDue.slice(0, 4).map((decision) => (
 <li key={decision.id} className="px-5 py-3">
 <div className="text-sm text-neutral-900">{decision.title}</div>
 <div className="mt-1 text-xs text-neutral-500">Review {formatDate(decision.reviewDate)}</div>
 </li>
 ))}
 </ul>
 )}
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">Goal Snapshot</h4>
 <div className="mt-3 space-y-2 text-sm text-neutral-600">
 <p><span className="text-neutral-400">Category:</span> {goal.category}</p>
 <p><span className="text-neutral-400">Horizon:</span> {goal.timeHorizon?.replace('_', ' ') || '—'}</p>
 <p><span className="text-neutral-400">Priority:</span> {goal.priority}</p>
 </div>
 </div>
 </aside>
 </div>
 );

 const renderPlans = () => (
 <div className="space-y-4">
 <div className="flex items-center justify-between gap-3">
 <div>
 <h4 className="text-sm font-semibold text-neutral-900">Plans A/B/C</h4>
 <p className="mt-0.5 text-xs text-neutral-500">Keep the strategic path inside the goal.</p>
 </div>
 <Button type="button" size="sm" onClick={() => openModal('plan')}>Add Plan</Button>
 </div>

 {filteredPlans.length === 0 ? (
 <div className="rounded-xl border border-dashed border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">No plans are linked to this goal yet.</div>
 ) : (
 <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
 {(['A', 'B', 'C', 'other'] as const).map((lane) => (
 <div key={lane} className="rounded-xl border border-neutral-200 bg-white">
 <div className="border-b border-neutral-200 px-4 py-3">
 <h5 className="text-xs font-semibold uppercase tracking-[0.08em] text-neutral-500">{lane === 'other' ? 'Other' : `Plan ${lane}`}</h5>
 </div>
 <div className="space-y-3 p-4">
 {plansByLabel[lane].length === 0 ? (
 <div className="rounded-lg border border-dashed border-neutral-200 p-4 text-sm text-neutral-500">Empty lane.</div>
 ) : plansByLabel[lane].map((plan) => (
 <PlanCard
 key={plan.id}
 plan={plan}
 onEdit={() => openModal('plan', plan)}
 onDelete={onDeleteStrategyPlan}
 onStatusChange={onUpdateStrategyPlan}
 />
 ))}
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );

 const renderTactics = () => (
 <div className="space-y-4">
 <div className="flex items-center justify-between gap-3">
 <div>
 <h4 className="text-sm font-semibold text-neutral-900">Tactics</h4>
 <p className="mt-0.5 text-xs text-neutral-500">Concrete execution steps attached to this goal.</p>
 </div>
 <Button type="button" size="sm" onClick={() => openModal('tactic')}>Add Tactic</Button>
 </div>
 {filteredTactics.length === 0 ? (
 <EmptyState title="No tactics yet." description="Add a weekly or daily execution step." action={<Button type="button" size="sm" onClick={() => openModal('tactic')}>Add Tactic</Button>} />
 ) : (
 <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
 <div className="overflow-x-auto">
 <table className="min-w-full border-collapse">
 <thead>
 <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Tactic</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Status</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Metric</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Next action</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Actions</th>
 </tr>
 </thead>
 <tbody>
  {filteredTactics.map((tactic) => (
  <tr key={tactic.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50">
  <td className="px-4 py-3 align-middle">
  <DirectionalText text={tactic.title} as="div" className="text-sm font-medium text-neutral-900" />
  {tactic.description ? <DirectionalText text={tactic.description} as="div" className="mt-0.5 max-w-[320px] truncate text-xs text-neutral-500" /> : null}
  </td>
  <td className="px-4 py-3 align-middle"><Badge variant={getStatusVariant(tactic.status)}>{tactic.status}</Badge></td>
  <td className="px-4 py-3 align-middle text-sm text-neutral-700">{tactic.metric || '—'}</td>
  <td className="px-4 py-3 align-middle text-sm text-neutral-700"><DirectionalText text={tactic.nextAction || '—'} as="span" /></td>
 <td className="px-4 py-3 align-middle">
 <div className="flex items-center gap-2">
 <Button type="button" variant="secondary" size="sm" onClick={() => openModal('tactic', tactic)}>Edit</Button>
 <Button type="button" variant="danger" size="sm" onClick={() => onDeleteStrategyTactic(tactic.id)}>Delete</Button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 )}
 </div>
 );

 const renderExperiments = () => (
 <div className="space-y-4">
 <div className="flex items-center justify-between gap-3">
 <div>
 <h4 className="text-sm font-semibold text-neutral-900">Experiments</h4>
 <p className="mt-0.5 text-xs text-neutral-500">Track what you are learning inside the goal boundary.</p>
 </div>
 <Button type="button" size="sm" onClick={() => openModal('experiment')}>Add Experiment</Button>
 </div>
 {filteredExperiments.length === 0 ? (
 <EmptyState title="No experiments yet." description="Create one test with a clear hypothesis and metric." action={<Button type="button" size="sm" onClick={() => openModal('experiment')}>Add Experiment</Button>} />
 ) : (
 <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
  {filteredExperiments.map((experiment) => (
  <div key={experiment.id} className="rounded-xl border border-neutral-200 bg-white p-4">
  <div className="flex items-start justify-between gap-2">
  <div>
  <DirectionalText text={experiment.title} as="div" className="text-sm font-semibold text-neutral-900" />
 {experiment.hypothesis ? <p className="mt-1 text-xs text-neutral-500">{experiment.hypothesis}</p> : null}
 </div>
 <Badge variant={getStatusVariant(experiment.status)}>{experiment.status}</Badge>
 </div>
 <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-neutral-600 sm:grid-cols-2">
 <div><span className="text-neutral-400">Metric:</span> {experiment.metric || '—'}</div>
 <div><span className="text-neutral-400">Window:</span> {formatDate(experiment.startDate)} - {formatDate(experiment.endDate)}</div>
 <div><span className="text-neutral-400">Method:</span> {experiment.method || '—'}</div>
 <div><span className="text-neutral-400">Learning:</span> {experiment.learning || '—'}</div>
 </div>
 <div className="mt-3 flex gap-2">
 <Button type="button" variant="secondary" size="sm" onClick={() => openModal('experiment', experiment)}>Edit</Button>
 <Button type="button" variant="danger" size="sm" onClick={() => onDeleteStrategyExperiment(experiment.id)}>Delete</Button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );

 const renderDecisions = () => (
 <div className="space-y-4">
 <div className="flex items-center justify-between gap-3">
 <div>
 <h4 className="text-sm font-semibold text-neutral-900">Decisions</h4>
 <p className="mt-0.5 text-xs text-neutral-500">Record what was decided and when to revisit it.</p>
 </div>
 <Button type="button" size="sm" onClick={() => openModal('decision')}>Add Decision</Button>
 </div>
 {filteredDecisions.length === 0 ? (
 <EmptyState title="No decisions yet." description="Add decisions to close loops and mark review dates." action={<Button type="button" size="sm" onClick={() => openModal('decision')}>Add Decision</Button>} />
 ) : (
 <div className="space-y-3">
 {filteredDecisions.map((decision) => {
 const due = Boolean(decision.reviewDate && decision.reviewDate.slice(0, 10) <= today);
 return (
 <div key={decision.id} className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="min-w-0">
  <div className="flex flex-wrap items-center gap-2">
  <DirectionalText text={decision.title} as="div" className="text-sm font-semibold text-neutral-900" />
  {due ? <Badge variant="warning">Review due</Badge> : null}
 </div>
 {decision.context ? <p className="mt-1 text-xs text-neutral-500">{decision.context}</p> : null}
 </div>
 <Badge variant={getStatusVariant(decision.status)}>{decision.status}</Badge>
 </div>
 <div className="mt-3 grid grid-cols-1 gap-2 text-xs text-neutral-600 md:grid-cols-2">
 <div><span className="text-neutral-400">Decision:</span> {decision.decision || '—'}</div>
 <div><span className="text-neutral-400">Reason:</span> {decision.reason || '—'}</div>
 <div><span className="text-neutral-400">Expected result:</span> {decision.expectedResult || '—'}</div>
 <div><span className="text-neutral-400">Review date:</span> {formatDate(decision.reviewDate)}</div>
 </div>
 <div className="mt-3 flex gap-2">
 <Button type="button" variant="secondary" size="sm" onClick={() => openModal('decision', decision)}>Edit</Button>
 <Button type="button" variant="danger" size="sm" onClick={() => onDeleteStrategyDecision(decision.id)}>Delete</Button>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );

 const renderReview = () => {
 const plansAtRisk = filteredPlans.filter((plan) => {
 const status = String(plan.status || '').toLowerCase();
 if (status === 'paused' || status === 'failed') return true;
 if (!plan.targetDate) return false;
 const target = new Date(plan.targetDate).getTime();
 if (!Number.isFinite(target)) return false;
 const daysLeft = Math.ceil((target - Date.now()) / (1000 * 60 * 60 * 24));
 return daysLeft <= 14 && Number(plan.progress ?? 0) < 45;
 });

 return (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">Review prompts</h4>
 <div className="mt-3 space-y-2 text-sm text-neutral-600">
 <p>What is the next concrete action?</p>
 <p>What should be stopped or changed?</p>
 <p>Is the goal still aligned with the larger strategy?</p>
 <p>What evidence would change the direction?</p>
 </div>
 </div>

 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <ReviewCard title="What is working?" items={filteredPlans.filter((plan) => plan.status === 'active' || plan.status === 'completed').slice(0, 3).map((plan) => `${plan.name} · ${Math.round(Number(plan.progress ?? 0))}%`)} emptyLabel="No working patterns captured yet." />
 <ReviewCard title="What is not working?" items={filteredPlans.filter((plan) => plan.status === 'paused' || plan.status === 'failed').slice(0, 3).map((plan) => `${plan.name} · ${plan.status}`)} emptyLabel="No stalled plans right now." />
 <ReviewCard title="Plans at risk" items={plansAtRisk.slice(0, 3).map((plan) => `${plan.name} · ${formatDate(plan.targetDate)}`)} emptyLabel="No plans look at risk." />
 <ReviewCard title="Decisions to revisit" items={decisionsDue.slice(0, 3).map((decision) => `${decision.title} · ${formatDate(decision.reviewDate)}`)} emptyLabel="No decisions due now." />
 </div>
 </div>
 );
 };

 const renderEthicalFilter = () => (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">Ethical Filter</h4>
 <p className="mt-1 text-sm text-neutral-600">Use this to keep the goal inside your non-negotiables. The filter stays visible here so the workspace does not drift into things that do not belong.</p>
 </div>
 {ethicalItems.length === 0 ? (
 <EmptyState title="No ethical filter items yet." description="Add rules in the strategy stack when you need them." />
 ) : (
 <div className="space-y-3">
 {ethicalItems.map((item) => (
 <div key={item.id} className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-sm font-semibold text-neutral-900">{item.title}</div>
 <p className="mt-1 text-sm text-neutral-600">{item.content}</p>
 </div>
 ))}
 </div>
 )}
 </div>
 );

 const renderNotes = () => (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">Working Notes</h4>
 <div className="mt-3 space-y-2 text-sm text-neutral-600">
 <p><span className="text-neutral-400">Current focus:</span> {selectedGoal.title}</p>
 <p><span className="text-neutral-400">Success metric:</span> {selectedGoal.successMetric || '—'}</p>
 <p><span className="text-neutral-400">Linked work:</span> {linkedProject?.name || linkedCompany?.name || '—'}</p>
 </div>
 </div>

 <EmptyState title="No notes field is available for this goal." description="The current strategy model does not expose a notes field here, so this tab stays read-only and safe." />
 </div>
 );

 const tabContent: Record<TabId, React.ReactNode> = {
 overview: renderOverview(),
 plans: renderPlans(),
 tactics: renderTactics(),
 experiments: renderExperiments(),
 decisions: renderDecisions(),
 review: renderReview(),
 ethical_filter: renderEthicalFilter(),
 notes: renderNotes(),
 };

 return (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white px-5 py-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="min-w-0">
 <button type="button" onClick={onBack} className="text-xs font-medium text-neutral-500 hover:text-neutral-900">
 ← Back to Goals
 </button>
 <div className="mt-2 flex flex-wrap items-center gap-2">
 <DirectionalText text={goal.title} as="h2" className="text-xl font-semibold text-neutral-900" />
 <Badge variant="neutral">Goal Workspace</Badge>
 </div>
 <p className="mt-1 text-sm text-neutral-600">All strategy work for this goal lives here.</p>
 </div>
 <div className="flex shrink-0 gap-2">
 <Button type="button" variant="secondary" size="sm" onClick={() => onEditGoal(goal)}>Edit Goal</Button>
 <Button type="button" variant="danger" size="sm" onClick={() => onDeleteGoal(goal.id)}>Delete Goal</Button>
 </div>
 </div>
 <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-neutral-100">
 <div className="h-full rounded-full bg-neutral-900" style={{ width: `${Math.round(Number(goal.progress ?? 0))}%` }} />
 </div>
 </div>

 <div className="flex flex-wrap gap-2">
 {TABS.map((tab) => (
 <button
 key={tab.id}
 type="button"
 onClick={() => setActiveTab(tab.id)}
 className={`rounded-md border px-3 py-1.5 text-sm transition-colors ${activeTab === tab.id ? 'border-neutral-900 bg-neutral-900 text-white' : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:text-neutral-900'}`}
 >
 {tab.label}
 </button>
 ))}
 </div>

 {tabContent[activeTab]}

 {modalState ? (
 <ItemModal
 modalState={modalState}
 isBusy={isBusy}
 formError={formError}
 projects={projects}
 companies={companies}
 strategyGoals={strategyGoals}
 strategyPlans={strategyPlans}
 goalForm={{
 title: '',
 description: '',
 category: goal.category,
 priority: goal.priority,
 status: goal.status,
 timeHorizon: goal.timeHorizon,
 progress: goal.progress ?? 0,
 targetDate: goal.targetDate || '',
 successMetric: goal.successMetric || '',
 linkedProjectId: goal.linkedProjectId || '',
 linkedCompanyId: goal.linkedCompanyId || '',
 }}
 planForm={planForm}
 tacticForm={tacticForm}
 experimentForm={experimentForm}
 decisionForm={decisionForm}
 setGoalForm={(() => undefined) as React.Dispatch<React.SetStateAction<StrategyGoalInput>>}
 setPlanForm={setPlanForm}
 setTacticForm={setTacticForm}
 setExperimentForm={setExperimentForm}
 setDecisionForm={setDecisionForm}
 onSave={modalState.type === 'plan' ? handleSavePlan : modalState.type === 'tactic' ? handleSaveTactic : modalState.type === 'experiment' ? handleSaveExperiment : handleSaveDecision}
 onDelete={handleDeleteModalItem}
 onClose={closeModal}
 />
 ) : null}
 </div>
 );
};

const MetricCard: React.FC<{ label: string; value: number; hint: string }> = ({ label, value, hint }) => (
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-xs uppercase tracking-[0.08em] text-neutral-500">{label}</div>
 <div className="mt-2 text-2xl font-semibold text-neutral-900">{value}</div>
 <div className="mt-1 text-xs text-neutral-500">{hint}</div>
 </div>
);

const DetailRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
 <div className="px-5 py-4">
 <div className="text-xs uppercase tracking-[0.08em] text-neutral-500">{label}</div>
 <div className="mt-1 text-sm text-neutral-900">{value}</div>
 </div>
);

const MiniList: React.FC<{ title: string; items: string[]; emptyLabel: string }> = ({ title, items, emptyLabel }) => (
 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="border-b border-neutral-200 px-4 py-3">
 <h5 className="text-sm font-semibold text-neutral-900">{title}</h5>
 </div>
 {items.length === 0 ? (
 <div className="px-4 py-4 text-sm text-neutral-500">{emptyLabel}</div>
 ) : (
 <ul className="divide-y divide-neutral-100">
 {items.map((item) => (
 <li key={item} className="px-4 py-3 text-sm text-neutral-700">{item}</li>
 ))}
 </ul>
 )}
 </div>
);

const ReviewCard: React.FC<{ title: string; items: string[]; emptyLabel: string }> = ({ title, items, emptyLabel }) => (
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <h5 className="text-sm font-semibold text-neutral-900">{title}</h5>
 {items.length === 0 ? <p className="mt-2 text-sm text-neutral-500">{emptyLabel}</p> : <div className="mt-2 space-y-1 text-sm text-neutral-700">{items.map((item) => <p key={item}>{item}</p>)}</div>}
 </div>
);

const PlanCard: React.FC<{
 plan: StrategyPlan;
 onEdit: () => void;
 onDelete: (id: string) => Promise<void>;
 onStatusChange: (id: string, input: Partial<StrategyPlanInput>) => Promise<StrategyPlan>;
}> = ({ plan, onEdit, onDelete, onStatusChange }) => {
 const progress = Math.round(Number(plan.progress ?? 0));

 return (
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex items-start justify-between gap-2">
 <div>
 <div className="text-sm font-semibold text-neutral-900">{plan.name}</div>
  {plan.description ? <DirectionalText text={plan.description} as="p" className="mt-1 text-xs text-neutral-500" /> : null}
 </div>
 <Badge variant={getStatusVariant(plan.status)}>{plan.status}</Badge>
 </div>
 <div className="mt-3 flex items-center gap-2 text-xs text-neutral-500">
 <span>Label {plan.label}</span>
 <span>•</span>
 <span>{progress}%</span>
 </div>
 <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-neutral-100">
 <div className="h-full rounded-full bg-neutral-900" style={{ width: `${progress}%` }} />
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 <Button type="button" variant="secondary" size="sm" onClick={onEdit}>Edit</Button>
 <Button type="button" variant="danger" size="sm" onClick={() => onDelete(plan.id)}>Delete</Button>
 </div>
 <div className="mt-3 flex gap-2">
 <select
 value={plan.status}
 onChange={(e) => onStatusChange(plan.id, { status: e.target.value as StrategyStatus })}
 className="h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-700 outline-none hover:border-neutral-300"
 >
 {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
 </select>
 </div>
 </div>
 );
};

export default GoalWorkspace;
