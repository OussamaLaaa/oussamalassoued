import React from 'react';
import { detectTextDirection } from '../../utils/textDirection';
import type {
 StrategyGoalInput, StrategyPlanInput, StrategyTacticInput, StrategyExperimentInput, StrategyDecisionInput,
 StrategyGoal, StrategyPlan, StrategyTactic, StrategyExperiment, StrategyDecision,
 StrategyPriority, StrategySection, StrategyStatus, StrategyTimeHorizon,
} from '../../types/opportunities';

const CATEGORY_OPTIONS: StrategySection[] = ['career', 'freelance', 'portfolio', 'money', 'investment', 'learning', 'health', 'ethical_filter', 'positioning', 'operations'];
const PRIORITY_OPTIONS: StrategyPriority[] = ['high', 'medium', 'low'];
const STATUS_OPTIONS: StrategyStatus[] = ['active', 'planned', 'paused', 'completed', 'archived', 'failed'];
const TIME_HORIZON_OPTIONS: StrategyTimeHorizon[] = ['yearly', 'six_months', 'quarterly', 'monthly', 'weekly', 'daily'];

type ModalState =
 | { type: 'goal'; item?: StrategyGoal }
 | { type: 'plan'; item?: StrategyPlan }
 | { type: 'tactic'; item?: StrategyTactic }
 | { type: 'experiment'; item?: StrategyExperiment }
 | { type: 'decision'; item?: StrategyDecision }
 | null;

type Props = {
 modalState: ModalState;
 isBusy: boolean;
 formError: string | null;
 projects: Array<{ id: string; name: string }>;
 companies: Array<{ id: string; name: string }>;
 strategyGoals: StrategyGoal[];
 strategyPlans: StrategyPlan[];
 goalForm: StrategyGoalInput;
 planForm: StrategyPlanInput;
 tacticForm: StrategyTacticInput;
 experimentForm: StrategyExperimentInput;
 decisionForm: StrategyDecisionInput;
 setGoalForm: React.Dispatch<React.SetStateAction<StrategyGoalInput>>;
 setPlanForm: React.Dispatch<React.SetStateAction<StrategyPlanInput>>;
 setTacticForm: React.Dispatch<React.SetStateAction<StrategyTacticInput>>;
 setExperimentForm: React.Dispatch<React.SetStateAction<StrategyExperimentInput>>;
 setDecisionForm: React.Dispatch<React.SetStateAction<StrategyDecisionInput>>;
 onSave: (e: React.FormEvent<HTMLFormElement>) => Promise<void>;
 onDelete: () => Promise<void>;
 onClose: () => void;
};

const parseProgress = (value: string) => {
 const numeric = Number(value);
 if (!Number.isFinite(numeric)) return 0;
 return Math.max(0, Math.min(100, numeric));
};

const ItemModal: React.FC<Props> = ({
 modalState, isBusy, formError,
 projects, companies, strategyGoals, strategyPlans,
 goalForm, planForm, tacticForm, experimentForm, decisionForm,
 setGoalForm, setPlanForm, setTacticForm, setExperimentForm, setDecisionForm,
 onSave, onDelete, onClose,
}) => {
 if (!modalState) return null;

 const title = modalState.item
 ? `Edit ${modalState.type.charAt(0).toUpperCase() + modalState.type.slice(1)}`
 : `Add ${modalState.type.charAt(0).toUpperCase() + modalState.type.slice(1)}`;

 return (
 <div className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto bg-neutral-900/20 px-4 py-8">
 <div className="w-full max-w-[800px] rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-4">
 <h4 className="text-base font-semibold text-neutral-900">{title}</h4>
 <button type="button" onClick={onClose} disabled={isBusy} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-600 hover:bg-neutral-50 disabled:opacity-40">Close</button>
 </div>

 <form className="px-5 py-4 space-y-4" onSubmit={onSave}>
 {modalState.type === 'goal' && (
 <div className="space-y-4">
 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <Field label="Title" required>
  <input value={goalForm.title || ''} onChange={(e) => setGoalForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" dir={detectTextDirection(goalForm.title || '')} required />
 </Field>
 <Field label="Category">
 <select value={goalForm.category || 'career'} onChange={(e) => setGoalForm((f) => ({ ...f, category: e.target.value as StrategySection }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 {CATEGORY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Priority">
 <select value={goalForm.priority || 'medium'} onChange={(e) => setGoalForm((f) => ({ ...f, priority: e.target.value as StrategyPriority }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 {PRIORITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Status">
 <select value={goalForm.status || 'active'} onChange={(e) => setGoalForm((f) => ({ ...f, status: e.target.value as StrategyStatus }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Time Horizon">
 <select value={goalForm.timeHorizon || ''} onChange={(e) => setGoalForm((f) => ({ ...f, timeHorizon: e.target.value as StrategyTimeHorizon }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {TIME_HORIZON_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Target Date">
 <input type="date" value={goalForm.targetDate || ''} onChange={(e) => setGoalForm((f) => ({ ...f, targetDate: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Progress">
 <input type="number" min={0} max={100} value={Number(goalForm.progress ?? 0)} onChange={(e) => setGoalForm((f) => ({ ...f, progress: parseProgress(e.target.value) }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Success Metric">
 <input value={goalForm.successMetric || ''} onChange={(e) => setGoalForm((f) => ({ ...f, successMetric: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Linked Project">
 <select value={goalForm.linkedProjectId || ''} onChange={(e) => setGoalForm((f) => ({ ...f, linkedProjectId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </Field>
 <Field label="Linked Company">
 <select value={goalForm.linkedCompanyId || ''} onChange={(e) => setGoalForm((f) => ({ ...f, linkedCompanyId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 </Field>
 </div>
 <Field label="Description">
  <textarea value={goalForm.description || ''} onChange={(e) => setGoalForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" dir={detectTextDirection(goalForm.description || '')} />
 </Field>
 </div>
 )}

 {modalState.type === 'plan' && (
 <div className="space-y-4">
 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <Field label="Name" required>
 <input value={planForm.name || ''} onChange={(e) => setPlanForm((f) => ({ ...f, name: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" required />
 </Field>
 <Field label="Label">
 <select value={planForm.label || 'A'} onChange={(e) => setPlanForm((f) => ({ ...f, label: e.target.value as StrategyPlan['label'] }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
 </select>
 </Field>
 <Field label="Status">
 <select value={planForm.status || 'planned'} onChange={(e) => setPlanForm((f) => ({ ...f, status: e.target.value as StrategyStatus }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Priority">
 <select value={planForm.priority || 'medium'} onChange={(e) => setPlanForm((f) => ({ ...f, priority: e.target.value as StrategyPriority }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 {PRIORITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Progress">
 <input type="number" min={0} max={100} value={Number(planForm.progress ?? 0)} onChange={(e) => setPlanForm((f) => ({ ...f, progress: parseProgress(e.target.value) }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Target Date">
 <input type="date" value={planForm.targetDate || ''} onChange={(e) => setPlanForm((f) => ({ ...f, targetDate: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Linked Goal">
 <select value={planForm.linkedGoalId || ''} onChange={(e) => setPlanForm((f) => ({ ...f, linkedGoalId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {strategyGoals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
 </select>
 </Field>
 <Field label="Linked Project">
 <select value={planForm.linkedProjectId || ''} onChange={(e) => setPlanForm((f) => ({ ...f, linkedProjectId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </Field>
 </div>
 <Field label="Description">
 <textarea value={planForm.description || ''} onChange={(e) => setPlanForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Assumptions">
 <textarea value={planForm.assumptions || ''} onChange={(e) => setPlanForm((f) => ({ ...f, assumptions: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Risks">
 <textarea value={planForm.risks || ''} onChange={(e) => setPlanForm((f) => ({ ...f, risks: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Resources Needed">
 <input value={planForm.resourcesNeeded || ''} onChange={(e) => setPlanForm((f) => ({ ...f, resourcesNeeded: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Trigger to Switch">
 <input value={planForm.triggerToSwitch || ''} onChange={(e) => setPlanForm((f) => ({ ...f, triggerToSwitch: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Next Action">
 <input value={planForm.nextAction || ''} onChange={(e) => setPlanForm((f) => ({ ...f, nextAction: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 </div>
 )}

 {modalState.type === 'tactic' && (
 <div className="space-y-4">
 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <Field label="Title" required>
 <input value={tacticForm.title || ''} onChange={(e) => setTacticForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" required />
 </Field>
 <Field label="Category">
 <input value={tacticForm.category || ''} onChange={(e) => setTacticForm((f) => ({ ...f, category: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Status">
 <select value={tacticForm.status || 'active'} onChange={(e) => setTacticForm((f) => ({ ...f, status: e.target.value as StrategyStatus }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Priority">
 <select value={tacticForm.priority || 'medium'} onChange={(e) => setTacticForm((f) => ({ ...f, priority: e.target.value as StrategyPriority }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 {PRIORITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Frequency">
 <input value={tacticForm.frequency || ''} onChange={(e) => setTacticForm((f) => ({ ...f, frequency: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Metric">
 <input value={tacticForm.metric || ''} onChange={(e) => setTacticForm((f) => ({ ...f, metric: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Next Action">
 <input value={tacticForm.nextAction || ''} onChange={(e) => setTacticForm((f) => ({ ...f, nextAction: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Linked Goal">
 <select value={tacticForm.linkedGoalId || ''} onChange={(e) => setTacticForm((f) => ({ ...f, linkedGoalId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {strategyGoals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
 </select>
 </Field>
 <Field label="Linked Plan">
 <select value={tacticForm.linkedPlanId || ''} onChange={(e) => setTacticForm((f) => ({ ...f, linkedPlanId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {strategyPlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </Field>
 <Field label="Linked Project">
 <select value={tacticForm.linkedProjectId || ''} onChange={(e) => setTacticForm((f) => ({ ...f, linkedProjectId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </Field>
 </div>
 <Field label="Description">
 <textarea value={tacticForm.description || ''} onChange={(e) => setTacticForm((f) => ({ ...f, description: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 </div>
 )}

 {modalState.type === 'experiment' && (
 <div className="space-y-4">
 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <Field label="Title" required>
 <input value={experimentForm.title || ''} onChange={(e) => setExperimentForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" required />
 </Field>
 <Field label="Status">
 <select value={experimentForm.status || 'planned'} onChange={(e) => setExperimentForm((f) => ({ ...f, status: e.target.value as StrategyStatus }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Priority">
 <select value={experimentForm.priority || 'medium'} onChange={(e) => setExperimentForm((f) => ({ ...f, priority: e.target.value as StrategyPriority }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 {PRIORITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Metric">
 <input value={experimentForm.metric || ''} onChange={(e) => setExperimentForm((f) => ({ ...f, metric: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Start Date">
 <input type="date" value={experimentForm.startDate || ''} onChange={(e) => setExperimentForm((f) => ({ ...f, startDate: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="End Date">
 <input type="date" value={experimentForm.endDate || ''} onChange={(e) => setExperimentForm((f) => ({ ...f, endDate: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Linked Goal">
 <select value={experimentForm.linkedGoalId || ''} onChange={(e) => setExperimentForm((f) => ({ ...f, linkedGoalId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {strategyGoals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
 </select>
 </Field>
 <Field label="Linked Plan">
 <select value={experimentForm.linkedPlanId || ''} onChange={(e) => setExperimentForm((f) => ({ ...f, linkedPlanId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {strategyPlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </Field>
 <Field label="Linked Project" className="md:col-span-2">
 <select value={experimentForm.linkedProjectId || ''} onChange={(e) => setExperimentForm((f) => ({ ...f, linkedProjectId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </Field>
 </div>
 <Field label="Hypothesis">
 <textarea value={experimentForm.hypothesis || ''} onChange={(e) => setExperimentForm((f) => ({ ...f, hypothesis: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Method">
 <textarea value={experimentForm.method || ''} onChange={(e) => setExperimentForm((f) => ({ ...f, method: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Result">
 <textarea value={experimentForm.result || ''} onChange={(e) => setExperimentForm((f) => ({ ...f, result: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Learning">
 <textarea value={experimentForm.learning || ''} onChange={(e) => setExperimentForm((f) => ({ ...f, learning: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 </div>
 )}

 {modalState.type === 'decision' && (
 <div className="space-y-4">
 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <Field label="Title" required>
 <input value={decisionForm.title || ''} onChange={(e) => setDecisionForm((f) => ({ ...f, title: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" required />
 </Field>
 <Field label="Review Date">
 <input type="date" value={decisionForm.reviewDate || ''} onChange={(e) => setDecisionForm((f) => ({ ...f, reviewDate: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Status">
 <select value={decisionForm.status || 'planned'} onChange={(e) => setDecisionForm((f) => ({ ...f, status: e.target.value as StrategyStatus }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 {STATUS_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Priority">
 <select value={decisionForm.priority || 'medium'} onChange={(e) => setDecisionForm((f) => ({ ...f, priority: e.target.value as StrategyPriority }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 {PRIORITY_OPTIONS.map((v) => <option key={v} value={v}>{v}</option>)}
 </select>
 </Field>
 <Field label="Linked Goal">
 <select value={decisionForm.linkedGoalId || ''} onChange={(e) => setDecisionForm((f) => ({ ...f, linkedGoalId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {strategyGoals.map((g) => <option key={g.id} value={g.id}>{g.title}</option>)}
 </select>
 </Field>
 <Field label="Linked Plan">
 <select value={decisionForm.linkedPlanId || ''} onChange={(e) => setDecisionForm((f) => ({ ...f, linkedPlanId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {strategyPlans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </Field>
 <Field label="Linked Project" className="md:col-span-2">
 <select value={decisionForm.linkedProjectId || ''} onChange={(e) => setDecisionForm((f) => ({ ...f, linkedProjectId: e.target.value }))} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400">
 <option value="">None</option>
 {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 </Field>
 </div>
 <Field label="Context">
 <textarea value={decisionForm.context || ''} onChange={(e) => setDecisionForm((f) => ({ ...f, context: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Decision">
 <textarea value={decisionForm.decision || ''} onChange={(e) => setDecisionForm((f) => ({ ...f, decision: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Reason">
 <textarea value={decisionForm.reason || ''} onChange={(e) => setDecisionForm((f) => ({ ...f, reason: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 <Field label="Expected Result">
 <textarea value={decisionForm.expectedResult || ''} onChange={(e) => setDecisionForm((f) => ({ ...f, expectedResult: e.target.value }))} rows={2} className="mt-1 w-full rounded-md border border-neutral-200 px-3 py-2 text-sm bg-white outline-none focus:border-neutral-400" />
 </Field>
 </div>
 )}

 {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

 <div className="flex items-center justify-between border-t border-neutral-200 pt-4">
 <button type="button" disabled={!modalState.item || isBusy} onClick={onDelete} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-40">
 Delete
 </button>
 <button type="submit" disabled={isBusy} className="rounded-md bg-neutral-900 px-5 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
 {isBusy ? 'Saving...' : `Save ${modalState.type.charAt(0).toUpperCase() + modalState.type.slice(1)}`}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};

const Field: React.FC<{ label: string; required?: boolean; className?: string; children: React.ReactNode }> = ({ label, required, className, children }) => (
 <label className={`block text-sm text-neutral-700 ${className || ''}`}>
 {label}{required ? ' *' : ''}
 {children}
 </label>
);

export default ItemModal;
export type { ModalState };
