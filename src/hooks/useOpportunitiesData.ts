import { useCallback, useEffect, useState } from 'react';
import seedData from '../data/opportunitiesSeed';
import { messageTemplates as staticMessageTemplates } from '../data/messageTemplates';
import {
  toNullableString, normalizeDatabaseType,
  companyFromDb as mapCompanyRow, companyToDb as toCompanyDb,
  personFromDb as mapPersonRow, personToDb as toPersonDb,
  messageFromDb as mapMessageRow, messageToDb as toMessageDb,
  dealFromDb as mapDealRow, dealToDb as toDealDb,
  projectFromDb as mapProjectRow, projectToDb as toProjectDb, projectToDbUpdate as toProjectDbUpdate,
  templateFromDb as mapTemplateRow, templateToDb as toTemplateDb,
  projectTaskFromDb as mapProjectTaskRow, projectTaskToDb as toProjectTaskDb, projectTaskToDbUpdate as toProjectTaskDbUpdate,
  projectTimeLogFromDb as mapProjectTimeLogRow, projectTimeLogToDb as toProjectTimeLogDb,
  projectMeetingFromDb as mapProjectMeetingRow, projectMeetingToDb as toProjectMeetingDb,
  projectDocumentFromDb as mapProjectDocumentRow, projectDocumentToDb as toProjectDocumentDb,
  projectFinanceItemFromDb as mapProjectFinanceItemRow, projectFinanceItemToDb as toProjectFinanceItemDb,
} from '../utils/opportunitiesMappers';
import type {
  OpportunitiesData,
  CompanyInput,
  PersonInput,
  MessageInput,
  DealInput,
  Project,
  ProjectInput,
  ProjectTask,
  ProjectTaskInput,
  ProjectTimeLog,
  ProjectTimeLogInput,
  ProjectMeeting,
  ProjectMeetingInput,
  ProjectDocument,
  ProjectDocumentInput,
  ProjectFinanceItem,
  ProjectFinanceItemInput,
  MessageTemplateInput,
  Company,
  Person,
  OutreachMessage,
  Deal,
  MessageTemplate,
  StrategyItem,
  StrategyItemInput,
  StrategyGoal,
  StrategyGoalInput,
  StrategyPlan,
  StrategyPlanInput,
  StrategyTactic,
  StrategyTacticInput,
  StrategyExperiment,
  StrategyExperimentInput,
  StrategyDecision,
  StrategyDecisionInput,
  Plan,
  PlanInput,
  PlanItem,
  PlanItemInput,
  FinanceIncome,
  FinanceExpense,
  FinanceAllocationRule,
  FinancePurchaseGoal,
  FinanceInvestmentIdea,
  FinanceInvestmentRule,
  FinanceInvestmentAllocation,
} from '../types/opportunities';

const API_ENDPOINT = '/api/opportunities';

const cloneSeedData = (): OpportunitiesData => ({
  companies: seedData.companies.map((item) => ({ ...item })),
  people: seedData.people.map((item) => ({ ...item })),
  messages: seedData.messages.map((item) => ({ ...item })),
  deals: seedData.deals.map((item) => ({ ...item })),
  projects: [],
  projectTasks: [],
  projectTimeLogs: [],
  projectMeetings: [],
  projectDocuments: [],
  projectFinanceItems: [],
  templates: staticMessageTemplates.map((item) => ({ ...item, isActive: true })),
  strategyItems: [],
  strategyGoals: [],
  strategyPlans: [],
  strategyTactics: [],
  strategyExperiments: [],
  strategyDecisions: [],
  strategyNotes: seedData.strategyNotes.map((item) => ({ ...item })),
  plans: [],
  planItems: [],
  financeIncome: [],
  financeExpenses: [],
  financeAllocationRules: [],
  financePurchaseGoals: [],
  financeInvestmentIdeas: [],
  financeInvestmentRules: [],
  financeInvestmentAllocations: [],
});



type OpportunitiesApiResponse = {
  success?: boolean;
  error?: string;
  errorCode?: string | null;
  entity?: string;
  action?: string;
  row?: any;
  rows?: any[];
  companies?: any[];
  people?: any[];
  messages?: any[];
  deals?: any[];
  projects?: any[];
  project_tasks?: any[];
  project_time_logs?: any[];
  project_meetings?: any[];
  project_documents?: any[];
  project_finance_items?: any[];
  message_templates?: any[];
  strategy_items?: any[];
  strategy_goals?: any[];
  strategy_plans?: any[];
  strategy_tactics?: any[];
  strategy_experiments?: any[];
  strategy_decisions?: any[];
  plans?: any[];
  plan_items?: any[];
  finance_income?: any[];
  finance_expenses?: any[];
  finance_allocation_rules?: any[];
  finance_purchase_goals?: any[];
  finance_investment_ideas?: any[];
  finance_investment_rules?: any[];
  finance_investment_allocations?: any[];
  strategyNotes?: any[];
};

type ApiError = Error & {
  status?: number;
  entity?: string;
  action?: string;
  errorCode?: string | null;
};

const getRowRefId = (row: any, snakeKey: string, camelKey: string) => row?.[snakeKey] ?? row?.[camelKey];

const getDerivedCollections = (companies: Company[], people: Person[], messages: OutreachMessage[], deals: Deal[]) => {
  const companyById = new Map(companies.map((company) => [company.id, company] as const));
  const personById = new Map(people.map((person) => [person.id, person] as const));

  return {
    people: people.map((person) => ({
      ...person,
      companyName: person.companyName || companyById.get(person.companyId || '')?.name,
    })),
    messages: messages.map((message) => ({
      ...message,
      companyName: message.companyName || companyById.get(message.companyId || '')?.name,
      personName: message.personName || personById.get(message.personId || '')?.fullName,
    })),
    deals: deals.map((deal) => ({
      ...deal,
      companyName: deal.companyName || companyById.get(deal.companyId || '')?.name,
      personName: deal.personName || personById.get(deal.personId || '')?.fullName,
    })),
  };
};

const strategyItemFromDb = (row: any): StrategyItem => ({
  id: String(row?.id ?? ''),
  section: row?.section,
  title: String(row?.title ?? ''),
  content: row?.content ?? undefined,
  priority: row?.priority ?? 'medium',
  status: row?.status ?? 'active',
  timeHorizon: row?.time_horizon ?? row?.timeHorizon ?? undefined,
  reviewDate: row?.review_date ?? row?.reviewDate ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  linkedCompanyId: row?.linked_company_id ?? row?.linkedCompanyId ?? undefined,
  linkedPersonId: row?.linked_person_id ?? row?.linkedPersonId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const strategyItemToDb = (input: Partial<StrategyItemInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.section !== undefined) payload.section = input.section;
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.content !== undefined) payload.content = toNullableString(input.content);
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.status !== undefined) payload.status = input.status;
  if (input.timeHorizon !== undefined) payload.time_horizon = toNullableString(input.timeHorizon);
  if (input.reviewDate !== undefined) payload.review_date = toNullableString(input.reviewDate);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  if (input.linkedCompanyId !== undefined) payload.linked_company_id = toNullableString(input.linkedCompanyId);
  if (input.linkedPersonId !== undefined) payload.linked_person_id = toNullableString(input.linkedPersonId);
  return payload;
};

const attachStrategyLinkNames = (
  items: StrategyItem[],
  projects: Project[],
  companies: Company[],
  people: Person[],
) => {
  const projectById = new Map(projects.map((project) => [project.id, project.name] as const));
  const companyById = new Map(companies.map((company) => [company.id, company.name] as const));
  const personById = new Map(people.map((person) => [person.id, person.fullName] as const));

  return items.map((item) => ({
    ...item,
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
    linkedCompanyName: item.linkedCompanyName || companyById.get(item.linkedCompanyId || ''),
    linkedPersonName: item.linkedPersonName || personById.get(item.linkedPersonId || ''),
  }));
};

const toClampedProgress = (value: any) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return undefined;
  return Math.max(0, Math.min(100, parsed));
};

const strategyGoalFromDb = (row: any): StrategyGoal => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  description: row?.description ?? undefined,
  category: row?.category,
  priority: row?.priority ?? 'medium',
  status: row?.status ?? 'active',
  timeHorizon: row?.time_horizon ?? row?.timeHorizon ?? undefined,
  progress: toClampedProgress(row?.progress),
  targetDate: row?.target_date ?? row?.targetDate ?? undefined,
  successMetric: row?.success_metric ?? row?.successMetric ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  linkedCompanyId: row?.linked_company_id ?? row?.linkedCompanyId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const strategyPlanFromDb = (row: any): StrategyPlan => ({
  id: String(row?.id ?? ''),
  name: String(row?.name ?? ''),
  label: row?.label ?? 'A',
  description: row?.description ?? undefined,
  status: row?.status ?? 'planned',
  priority: row?.priority ?? 'medium',
  assumptions: row?.assumptions ?? undefined,
  risks: row?.risks ?? undefined,
  resourcesNeeded: row?.resources_needed ?? row?.resourcesNeeded ?? undefined,
  triggerToSwitch: row?.trigger_to_switch ?? row?.triggerToSwitch ?? undefined,
  nextAction: row?.next_action ?? row?.nextAction ?? undefined,
  targetDate: row?.target_date ?? row?.targetDate ?? undefined,
  progress: toClampedProgress(row?.progress),
  linkedGoalId: row?.linked_goal_id ?? row?.linkedGoalId ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const strategyTacticFromDb = (row: any): StrategyTactic => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  description: row?.description ?? undefined,
  category: row?.category ?? undefined,
  status: row?.status ?? 'active',
  priority: row?.priority ?? 'medium',
  frequency: row?.frequency ?? undefined,
  metric: row?.metric ?? undefined,
  nextAction: row?.next_action ?? row?.nextAction ?? undefined,
  linkedGoalId: row?.linked_goal_id ?? row?.linkedGoalId ?? undefined,
  linkedPlanId: row?.linked_plan_id ?? row?.linkedPlanId ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const strategyExperimentFromDb = (row: any): StrategyExperiment => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  hypothesis: row?.hypothesis ?? undefined,
  method: row?.method ?? undefined,
  metric: row?.metric ?? undefined,
  result: row?.result ?? undefined,
  learning: row?.learning ?? undefined,
  status: row?.status ?? 'planned',
  priority: row?.priority ?? 'medium',
  startDate: row?.start_date ?? row?.startDate ?? undefined,
  endDate: row?.end_date ?? row?.endDate ?? undefined,
  linkedGoalId: row?.linked_goal_id ?? row?.linkedGoalId ?? undefined,
  linkedPlanId: row?.linked_plan_id ?? row?.linkedPlanId ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const strategyDecisionFromDb = (row: any): StrategyDecision => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  context: row?.context ?? undefined,
  decision: row?.decision ?? undefined,
  reason: row?.reason ?? undefined,
  expectedResult: row?.expected_result ?? row?.expectedResult ?? undefined,
  reviewDate: row?.review_date ?? row?.reviewDate ?? undefined,
  status: row?.status ?? 'planned',
  priority: row?.priority ?? 'medium',
  linkedGoalId: row?.linked_goal_id ?? row?.linkedGoalId ?? undefined,
  linkedPlanId: row?.linked_plan_id ?? row?.linkedPlanId ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const strategyGoalToDb = (input: Partial<StrategyGoalInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.description !== undefined) payload.description = toNullableString(input.description);
  if (input.category !== undefined) payload.category = input.category;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.status !== undefined) payload.status = input.status;
  if (input.timeHorizon !== undefined) payload.time_horizon = toNullableString(input.timeHorizon);
  if (input.progress !== undefined) payload.progress = toClampedProgress(input.progress);
  if (input.targetDate !== undefined) payload.target_date = toNullableString(input.targetDate);
  if (input.successMetric !== undefined) payload.success_metric = toNullableString(input.successMetric);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  if (input.linkedCompanyId !== undefined) payload.linked_company_id = toNullableString(input.linkedCompanyId);
  return payload;
};

const strategyPlanToDb = (input: Partial<StrategyPlanInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = String(input.name || '').trim();
  if (input.label !== undefined) payload.label = input.label;
  if (input.description !== undefined) payload.description = toNullableString(input.description);
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.assumptions !== undefined) payload.assumptions = toNullableString(input.assumptions);
  if (input.risks !== undefined) payload.risks = toNullableString(input.risks);
  if (input.resourcesNeeded !== undefined) payload.resources_needed = toNullableString(input.resourcesNeeded);
  if (input.triggerToSwitch !== undefined) payload.trigger_to_switch = toNullableString(input.triggerToSwitch);
  if (input.nextAction !== undefined) payload.next_action = toNullableString(input.nextAction);
  if (input.targetDate !== undefined) payload.target_date = toNullableString(input.targetDate);
  if (input.progress !== undefined) payload.progress = toClampedProgress(input.progress);
  if (input.linkedGoalId !== undefined) payload.linked_goal_id = toNullableString(input.linkedGoalId);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  return payload;
};

const strategyTacticToDb = (input: Partial<StrategyTacticInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.description !== undefined) payload.description = toNullableString(input.description);
  if (input.category !== undefined) payload.category = toNullableString(input.category);
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.frequency !== undefined) payload.frequency = toNullableString(input.frequency);
  if (input.metric !== undefined) payload.metric = toNullableString(input.metric);
  if (input.nextAction !== undefined) payload.next_action = toNullableString(input.nextAction);
  if (input.linkedGoalId !== undefined) payload.linked_goal_id = toNullableString(input.linkedGoalId);
  if (input.linkedPlanId !== undefined) payload.linked_plan_id = toNullableString(input.linkedPlanId);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  return payload;
};

const strategyExperimentToDb = (input: Partial<StrategyExperimentInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.hypothesis !== undefined) payload.hypothesis = toNullableString(input.hypothesis);
  if (input.method !== undefined) payload.method = toNullableString(input.method);
  if (input.metric !== undefined) payload.metric = toNullableString(input.metric);
  if (input.result !== undefined) payload.result = toNullableString(input.result);
  if (input.learning !== undefined) payload.learning = toNullableString(input.learning);
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.startDate !== undefined) payload.start_date = toNullableString(input.startDate);
  if (input.endDate !== undefined) payload.end_date = toNullableString(input.endDate);
  if (input.linkedGoalId !== undefined) payload.linked_goal_id = toNullableString(input.linkedGoalId);
  if (input.linkedPlanId !== undefined) payload.linked_plan_id = toNullableString(input.linkedPlanId);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  return payload;
};

const planFromDb = (row: any): Plan => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  type: row?.type,
  status: row?.status ?? 'planned',
  priority: row?.priority ?? 'medium',
  startDate: row?.start_date ?? row?.startDate ?? undefined,
  endDate: row?.end_date ?? row?.endDate ?? undefined,
  focus: row?.focus ?? undefined,
  successCriteria: row?.success_criteria ?? row?.successCriteria ?? undefined,
  reviewNotes: row?.review_notes ?? row?.reviewNotes ?? undefined,
  linkedStrategyGoalId: row?.linked_strategy_goal_id ?? row?.linkedStrategyGoalId ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const planToDb = (input: Partial<PlanInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.type !== undefined) payload.type = input.type;
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.startDate !== undefined) payload.start_date = toNullableString(input.startDate);
  if (input.endDate !== undefined) payload.end_date = toNullableString(input.endDate);
  if (input.focus !== undefined) payload.focus = toNullableString(input.focus);
  if (input.successCriteria !== undefined) payload.success_criteria = toNullableString(input.successCriteria);
  if (input.reviewNotes !== undefined) payload.review_notes = toNullableString(input.reviewNotes);
  if (input.linkedStrategyGoalId !== undefined) payload.linked_strategy_goal_id = toNullableString(input.linkedStrategyGoalId);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  return payload;
};

const planItemFromDb = (row: any): PlanItem => ({
  id: String(row?.id ?? ''),
  planId: String(row?.plan_id ?? row?.planId ?? ''),
  title: String(row?.title ?? ''),
  description: row?.description ?? undefined,
  category: row?.category ?? undefined,
  status: row?.status ?? 'todo',
  priority: row?.priority ?? 'medium',
  dueDate: row?.due_date ?? row?.dueDate ?? undefined,
  completedAt: row?.completed_at ?? row?.completedAt ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  linkedStrategyGoalId: row?.linked_strategy_goal_id ?? row?.linkedStrategyGoalId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const planItemToDb = (input: Partial<PlanItemInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.planId !== undefined) payload.plan_id = input.planId;
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.description !== undefined) payload.description = toNullableString(input.description);
  if (input.category !== undefined) payload.category = toNullableString(input.category);
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.dueDate !== undefined) payload.due_date = toNullableString(input.dueDate);
  if (input.completedAt !== undefined) payload.completed_at = toNullableString(input.completedAt);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  if (input.linkedStrategyGoalId !== undefined) payload.linked_strategy_goal_id = toNullableString(input.linkedStrategyGoalId);
  return payload;
};

const financeIncomeFromDb = (row: any): FinanceIncome => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  source: String(row?.source ?? ''),
  amount: Number(row?.amount ?? 0),
  currency: String(row?.currency ?? 'MYR'),
  incomeDate: row?.income_date ?? row?.incomeDate ?? undefined,
  status: row?.status ?? 'expected',
  notes: row?.notes ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  linkedCompanyId: row?.linked_company_id ?? row?.linkedCompanyId ?? undefined,
  incomeType: row?.income_type ?? row?.incomeType ?? undefined,
  expectedAmount: row?.expected_amount != null ? Number(row.expected_amount) : (row?.expectedAmount != null ? Number(row.expectedAmount) : undefined),
  receivedAmount: row?.received_amount != null ? Number(row.received_amount) : (row?.receivedAmount != null ? Number(row.receivedAmount) : undefined),
  expectedDate: row?.expected_date ?? row?.expectedDate ?? undefined,
  receivedDate: row?.received_date ?? row?.receivedDate ?? undefined,
  isRecurring: row?.is_recurring ?? row?.isRecurring ?? undefined,
  recurrence: row?.recurrence ?? undefined,
  confidence: row?.confidence ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const financeIncomeToDb = (input: Partial<FinanceIncome>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.source !== undefined) payload.source = input.source;
  if (input.amount !== undefined) payload.amount = Number(input.amount);
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.incomeDate !== undefined) payload.income_date = toNullableString(input.incomeDate);
  if (input.status !== undefined) payload.status = input.status;
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  if (input.linkedCompanyId !== undefined) payload.linked_company_id = toNullableString(input.linkedCompanyId);
  if (input.incomeType !== undefined) payload.income_type = toNullableString(input.incomeType);
  if (input.expectedAmount !== undefined) payload.expected_amount = input.expectedAmount != null ? Number(input.expectedAmount) : null;
  if (input.receivedAmount !== undefined) payload.received_amount = input.receivedAmount != null ? Number(input.receivedAmount) : null;
  if (input.expectedDate !== undefined) payload.expected_date = toNullableString(input.expectedDate);
  if (input.receivedDate !== undefined) payload.received_date = toNullableString(input.receivedDate);
  if (input.isRecurring !== undefined) payload.is_recurring = input.isRecurring;
  if (input.recurrence !== undefined) payload.recurrence = toNullableString(input.recurrence);
  if (input.confidence !== undefined) payload.confidence = toNullableString(input.confidence);
  return payload;
};

const financeExpenseFromDb = (row: any): FinanceExpense => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  category: String(row?.category ?? ''),
  amount: Number(row?.amount ?? 0),
  currency: String(row?.currency ?? 'MYR'),
  expenseDate: row?.expense_date ?? row?.expenseDate ?? undefined,
  status: row?.status ?? 'planned',
  notes: row?.notes ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const financeExpenseToDb = (input: Partial<FinanceExpense>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.category !== undefined) payload.category = input.category;
  if (input.amount !== undefined) payload.amount = Number(input.amount);
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.expenseDate !== undefined) payload.expense_date = toNullableString(input.expenseDate);
  if (input.status !== undefined) payload.status = input.status;
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  return payload;
};

const financeAllocationRuleFromDb = (row: any): FinanceAllocationRule => ({
  id: String(row?.id ?? ''),
  name: String(row?.name ?? ''),
  category: String(row?.category ?? ''),
  percentage: Number(row?.percentage ?? 0),
  priority: Number(row?.priority ?? 0),
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const financeAllocationRuleToDb = (input: Partial<FinanceAllocationRule>) => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = String(input.name || '').trim();
  if (input.category !== undefined) payload.category = input.category;
  if (input.percentage !== undefined) payload.percentage = Number(input.percentage);
  if (input.priority !== undefined) payload.priority = Number(input.priority);
  if (input.isActive !== undefined) payload.is_active = Boolean(input.isActive);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const financePurchaseGoalFromDb = (row: any): FinancePurchaseGoal => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  category: String(row?.category ?? ''),
  targetAmount: Number(row?.target_amount ?? row?.targetAmount ?? 0),
  savedAmount: Number(row?.saved_amount ?? row?.savedAmount ?? 0),
  currency: String(row?.currency ?? 'MYR'),
  priority: row?.priority ?? 'medium',
  status: row?.status ?? 'planned',
  decisionStatus: row?.decision_status ?? row?.decisionStatus ?? 'researching',
  targetDate: row?.target_date ?? row?.targetDate ?? undefined,
  productUrl: row?.product_url ?? row?.productUrl ?? undefined,
  imageUrl: row?.image_url ?? row?.imageUrl ?? undefined,
  vendor: row?.vendor ?? undefined,
  reason: row?.reason ?? undefined,
  expectedUse: row?.expected_use ?? row?.expectedUse ?? undefined,
  alternatives: row?.alternatives ?? undefined,
  allocationCategory: row?.allocation_category ?? row?.allocationCategory ?? undefined,
  monthlyContribution: row?.monthly_contribution != null ? Number(row.monthly_contribution) : (row?.monthlyContribution != null ? Number(row.monthlyContribution) : undefined),
  notes: row?.notes ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const financePurchaseGoalToDb = (input: Partial<FinancePurchaseGoal>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.category !== undefined) payload.category = input.category;
  if (input.targetAmount !== undefined) payload.target_amount = Number(input.targetAmount);
  if (input.savedAmount !== undefined) payload.saved_amount = Number(input.savedAmount);
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.status !== undefined) payload.status = input.status;
  if (input.decisionStatus !== undefined) payload.decision_status = input.decisionStatus;
  if (input.targetDate !== undefined) payload.target_date = toNullableString(input.targetDate);
  if (input.productUrl !== undefined) payload.product_url = toNullableString(input.productUrl);
  if (input.imageUrl !== undefined) payload.image_url = toNullableString(input.imageUrl);
  if (input.vendor !== undefined) payload.vendor = toNullableString(input.vendor);
  if (input.reason !== undefined) payload.reason = toNullableString(input.reason);
  if (input.expectedUse !== undefined) payload.expected_use = toNullableString(input.expectedUse);
  if (input.alternatives !== undefined) payload.alternatives = toNullableString(input.alternatives);
  if (input.allocationCategory !== undefined) payload.allocation_category = toNullableString(input.allocationCategory);
  if (input.monthlyContribution !== undefined) payload.monthly_contribution = input.monthlyContribution != null ? Number(input.monthlyContribution) : null;
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  return payload;
};

const financeInvestmentIdeaFromDb = (row: any): FinanceInvestmentIdea => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  type: String(row?.type ?? ''),
  plannedAmount: Number(row?.planned_amount ?? row?.plannedAmount ?? 0),
  currency: String(row?.currency ?? 'MYR'),
  riskLevel: row?.risk_level ?? row?.riskLevel ?? 'medium',
  ethicalStatus: row?.ethical_status ?? row?.ethicalStatus ?? 'needs_review',
  status: row?.status ?? 'researching',
  decisionStatus: row?.decision_status ?? row?.decisionStatus ?? 'researching',
  expectedHorizon: row?.expected_horizon ?? row?.expectedHorizon ?? undefined,
  reviewDate: row?.review_date ?? row?.reviewDate ?? undefined,
  maxAllocation: row?.max_allocation ?? row?.maxAllocation ?? undefined,
  expectedReason: row?.expected_reason ?? row?.expectedReason ?? undefined,
  pros: row?.pros ?? undefined,
  cons: row?.cons ?? undefined,
  risks: row?.risks ?? undefined,
  redFlags: row?.red_flags ?? row?.redFlags ?? undefined,
  researchLinks: row?.research_links ?? row?.researchLinks ?? undefined,
  lowScenario: row?.low_scenario ?? row?.lowScenario ?? undefined,
  baseScenario: row?.base_scenario ?? row?.baseScenario ?? undefined,
  highScenario: row?.high_scenario ?? row?.highScenario ?? undefined,
  allocationCategory: row?.allocation_category ?? row?.allocationCategory ?? undefined,
  recommendedMonthlyContribution: row?.recommended_monthly_contribution != null ? Number(row.recommended_monthly_contribution) : (row?.recommendedMonthlyContribution != null ? Number(row.recommendedMonthlyContribution) : undefined),
  fundingStatus: row?.funding_status ?? row?.fundingStatus ?? undefined,
  notes: row?.notes ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const financeInvestmentIdeaToDb = (input: Partial<FinanceInvestmentIdea>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.type !== undefined) payload.type = input.type;
  if (input.plannedAmount !== undefined) payload.planned_amount = Number(input.plannedAmount);
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.riskLevel !== undefined) payload.risk_level = input.riskLevel;
  if (input.ethicalStatus !== undefined) payload.ethical_status = input.ethicalStatus;
  if (input.status !== undefined) payload.status = input.status;
  if (input.decisionStatus !== undefined) payload.decision_status = input.decisionStatus;
  if (input.expectedHorizon !== undefined) payload.expected_horizon = toNullableString(input.expectedHorizon);
  if (input.reviewDate !== undefined) payload.review_date = toNullableString(input.reviewDate);
  if (input.maxAllocation !== undefined) payload.max_allocation = toNullableNumber(input.maxAllocation);
  if (input.expectedReason !== undefined) payload.expected_reason = toNullableString(input.expectedReason);
  if (input.pros !== undefined) payload.pros = toNullableString(input.pros);
  if (input.cons !== undefined) payload.cons = toNullableString(input.cons);
  if (input.risks !== undefined) payload.risks = toNullableString(input.risks);
  if (input.redFlags !== undefined) payload.red_flags = toNullableString(input.redFlags);
  if (input.researchLinks !== undefined) payload.research_links = toNullableString(input.researchLinks);
  if (input.lowScenario !== undefined) payload.low_scenario = toNullableString(input.lowScenario);
  if (input.baseScenario !== undefined) payload.base_scenario = toNullableString(input.baseScenario);
  if (input.highScenario !== undefined) payload.high_scenario = toNullableString(input.highScenario);
  if (input.allocationCategory !== undefined) payload.allocation_category = toNullableString(input.allocationCategory);
  if (input.recommendedMonthlyContribution !== undefined) payload.recommended_monthly_contribution = input.recommendedMonthlyContribution != null ? Number(input.recommendedMonthlyContribution) : null;
  if (input.fundingStatus !== undefined) payload.funding_status = toNullableString(input.fundingStatus);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  return payload;
};

const financeInvestmentRuleFromDb = (row: any): FinanceInvestmentRule => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  category: String(row?.category ?? ''),
  description: row?.description ?? undefined,
  priority: Number(row?.priority ?? 0),
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const financeInvestmentRuleToDb = (input: Partial<FinanceInvestmentRule>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.category !== undefined) payload.category = input.category;
  if (input.description !== undefined) payload.description = toNullableString(input.description);
  if (input.priority !== undefined) payload.priority = Number(input.priority);
  if (input.isActive !== undefined) payload.is_active = Boolean(input.isActive);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const financeInvestmentAllocationFromDb = (row: any): FinanceInvestmentAllocation => ({
  id: String(row?.id ?? ''),
  name: String(row?.name ?? ''),
  category: String(row?.category ?? ''),
  percentage: Number(row?.percentage ?? 0),
  riskLevel: row?.risk_level ?? row?.riskLevel ?? 'medium',
  ethicalStatus: row?.ethical_status ?? row?.ethicalStatus ?? 'needs_review',
  priority: Number(row?.priority ?? 0),
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const financeInvestmentAllocationToDb = (input: Partial<FinanceInvestmentAllocation>) => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = String(input.name || '').trim();
  if (input.category !== undefined) payload.category = input.category;
  if (input.percentage !== undefined) payload.percentage = Number(input.percentage);
  if (input.riskLevel !== undefined) payload.risk_level = input.riskLevel;
  if (input.ethicalStatus !== undefined) payload.ethical_status = input.ethicalStatus;
  if (input.priority !== undefined) payload.priority = Number(input.priority);
  if (input.isActive !== undefined) payload.is_active = Boolean(input.isActive);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const attachFinanceIncomeLinkNames = (items: FinanceIncome[], projects: Project[], companies: Company[]) => {
  const projectById = new Map(projects.map((p) => [p.id, p.name] as const));
  const companyById = new Map(companies.map((c) => [c.id, c.name] as const));
  return items.map((item) => ({
    ...item,
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
    linkedCompanyName: item.linkedCompanyName || companyById.get(item.linkedCompanyId || ''),
  }));
};

const attachFinanceExpenseLinkNames = (items: FinanceExpense[], projects: Project[]) => {
  const projectById = new Map(projects.map((p) => [p.id, p.name] as const));
  return items.map((item) => ({
    ...item,
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
  }));
};

const attachFinancePurchaseGoalLinkNames = (items: FinancePurchaseGoal[], projects: Project[]) => {
  const projectById = new Map(projects.map((p) => [p.id, p.name] as const));
  return items.map((item) => ({
    ...item,
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
  }));
};

const attachOsPlanLinkNames = (items: Plan[], projects: Project[], strategyGoals: StrategyGoal[]) => {
  const projectById = new Map(projects.map((p) => [p.id, p.name] as const));
  const goalById = new Map(strategyGoals.map((g) => [g.id, g.title] as const));
  return items.map((item) => ({
    ...item,
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
    linkedStrategyGoalTitle: item.linkedStrategyGoalTitle || goalById.get(item.linkedStrategyGoalId || ''),
  }));
};

const attachPlanItemLinkNames = (items: PlanItem[], projects: Project[], strategyGoals: StrategyGoal[]) => {
  const projectById = new Map(projects.map((p) => [p.id, p.name] as const));
  const goalById = new Map(strategyGoals.map((g) => [g.id, g.title] as const));
  return items.map((item) => ({
    ...item,
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
    linkedStrategyGoalTitle: item.linkedStrategyGoalTitle || goalById.get(item.linkedStrategyGoalId || ''),
  }));
};

const strategyDecisionToDb = (input: Partial<StrategyDecisionInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.context !== undefined) payload.context = toNullableString(input.context);
  if (input.decision !== undefined) payload.decision = toNullableString(input.decision);
  if (input.reason !== undefined) payload.reason = toNullableString(input.reason);
  if (input.expectedResult !== undefined) payload.expected_result = toNullableString(input.expectedResult);
  if (input.reviewDate !== undefined) payload.review_date = toNullableString(input.reviewDate);
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.linkedGoalId !== undefined) payload.linked_goal_id = toNullableString(input.linkedGoalId);
  if (input.linkedPlanId !== undefined) payload.linked_plan_id = toNullableString(input.linkedPlanId);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  return payload;
};

const attachGoalLinkNames = (items: StrategyGoal[], projects: Project[], companies: Company[]) => {
  const projectById = new Map(projects.map((project) => [project.id, project.name] as const));
  const companyById = new Map(companies.map((company) => [company.id, company.name] as const));
  return items.map((item) => ({
    ...item,
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
    linkedCompanyName: item.linkedCompanyName || companyById.get(item.linkedCompanyId || ''),
  }));
};

const attachPlanLinkNames = (items: StrategyPlan[], goals: StrategyGoal[], projects: Project[]) => {
  const goalById = new Map(goals.map((goal) => [goal.id, goal.title] as const));
  const projectById = new Map(projects.map((project) => [project.id, project.name] as const));
  return items.map((item) => ({
    ...item,
    linkedGoalTitle: item.linkedGoalTitle || goalById.get(item.linkedGoalId || ''),
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
  }));
};

const attachTacticLinkNames = (items: StrategyTactic[], goals: StrategyGoal[], plans: StrategyPlan[], projects: Project[]) => {
  const goalById = new Map(goals.map((goal) => [goal.id, goal.title] as const));
  const planById = new Map(plans.map((plan) => [plan.id, plan.name] as const));
  const projectById = new Map(projects.map((project) => [project.id, project.name] as const));
  return items.map((item) => ({
    ...item,
    linkedGoalTitle: item.linkedGoalTitle || goalById.get(item.linkedGoalId || ''),
    linkedPlanName: item.linkedPlanName || planById.get(item.linkedPlanId || ''),
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
  }));
};

const attachExperimentLinkNames = (items: StrategyExperiment[], goals: StrategyGoal[], plans: StrategyPlan[], projects: Project[]) => {
  const goalById = new Map(goals.map((goal) => [goal.id, goal.title] as const));
  const planById = new Map(plans.map((plan) => [plan.id, plan.name] as const));
  const projectById = new Map(projects.map((project) => [project.id, project.name] as const));
  return items.map((item) => ({
    ...item,
    linkedGoalTitle: item.linkedGoalTitle || goalById.get(item.linkedGoalId || ''),
    linkedPlanName: item.linkedPlanName || planById.get(item.linkedPlanId || ''),
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
  }));
};

const attachDecisionLinkNames = (items: StrategyDecision[], goals: StrategyGoal[], plans: StrategyPlan[], projects: Project[]) => {
  const goalById = new Map(goals.map((goal) => [goal.id, goal.title] as const));
  const planById = new Map(plans.map((plan) => [plan.id, plan.name] as const));
  const projectById = new Map(projects.map((project) => [project.id, project.name] as const));
  return items.map((item) => ({
    ...item,
    linkedGoalTitle: item.linkedGoalTitle || goalById.get(item.linkedGoalId || ''),
    linkedPlanName: item.linkedPlanName || planById.get(item.linkedPlanId || ''),
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
  }));
};

const shouldReplaceCollection = (current: any[], next: any[], keys: string[]) => {
  if (current.length !== next.length) return true;
  for (let index = 0; index < current.length; index += 1) {
    for (const key of keys) {
      if (current[index]?.[key] !== next[index]?.[key]) {
        return true;
      }
    }
  }
  return false;
};

const logDevError = (context: string, details: Record<string, unknown>) => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    console.error(`[Opportunities] ${context}`, details);
  }
};

const parseApiError = (result: OpportunitiesApiResponse, status: number): ApiError => {
  const message = status === 401
    ? 'Authentication required. Please log in again.'
    : result?.error || 'Failed to save Opportunities data.';

  const error = new Error(message) as ApiError;
  error.status = status;
  error.entity = result?.entity;
  error.action = result?.action;
  error.errorCode = result?.errorCode ?? null;
  return error;
};

const requestOpportunities = async (init: RequestInit): Promise<OpportunitiesApiResponse> => {
  const response = await fetch(API_ENDPOINT, {
    ...init,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw parseApiError(result, response.status);
  }

  return result;
};

export const useOpportunitiesData = (enabled = true) => {
  const [companies, setCompanies] = useState<Company[]>(() => cloneSeedData().companies);
  const [people, setPeople] = useState<Person[]>(() => cloneSeedData().people);
  const [messages, setMessages] = useState<OutreachMessage[]>(() => cloneSeedData().messages);
  const [deals, setDeals] = useState<Deal[]>(() => cloneSeedData().deals);
  const [projects, setProjects] = useState<Project[]>(() => cloneSeedData().projects);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [projectTimeLogs, setProjectTimeLogs] = useState<ProjectTimeLog[]>([]);
  const [projectMeetings, setProjectMeetings] = useState<ProjectMeeting[]>([]);
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);
  const [projectFinanceItems, setProjectFinanceItems] = useState<ProjectFinanceItem[]>([]);
  const [templates, setTemplates] = useState<MessageTemplate[]>(() => cloneSeedData().templates);
  const [strategyItems, setStrategyItems] = useState<StrategyItem[]>([]);
  const [strategyGoals, setStrategyGoals] = useState<StrategyGoal[]>([]);
  const [strategyPlans, setStrategyPlans] = useState<StrategyPlan[]>([]);
  const [strategyTactics, setStrategyTactics] = useState<StrategyTactic[]>([]);
  const [strategyExperiments, setStrategyExperiments] = useState<StrategyExperiment[]>([]);
  const [strategyDecisions, setStrategyDecisions] = useState<StrategyDecision[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planItems, setPlanItems] = useState<PlanItem[]>([]);
  const [financeIncome, setFinanceIncome] = useState<FinanceIncome[]>([]);
  const [financeExpenses, setFinanceExpenses] = useState<FinanceExpense[]>([]);
  const [financeAllocationRules, setFinanceAllocationRules] = useState<FinanceAllocationRule[]>([]);
  const [financePurchaseGoals, setFinancePurchaseGoals] = useState<FinancePurchaseGoal[]>([]);
  const [financeInvestmentIdeas, setFinanceInvestmentIdeas] = useState<FinanceInvestmentIdea[]>([]);
  const [financeInvestmentRules, setFinanceInvestmentRules] = useState<FinanceInvestmentRule[]>([]);
  const [financeInvestmentAllocations, setFinanceInvestmentAllocations] = useState<FinanceInvestmentAllocation[]>([]);
  const [strategyNotes] = useState(() => cloneSeedData().strategyNotes);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const applyPayload = useCallback((payload: any) => {
    const nextCompanies = Array.isArray(payload?.companies) ? payload.companies.map(mapCompanyRow) : [];
    const nextPeopleRaw = Array.isArray(payload?.people) ? payload.people : [];
    const nextMessagesRaw = Array.isArray(payload?.messages) ? payload.messages : [];
    const nextDealsRaw = Array.isArray(payload?.deals) ? payload.deals : [];
    const nextProjectsRaw = Array.isArray(payload?.projects) ? payload.projects : [];
    const nextProjectTasksRaw = Array.isArray(payload?.project_tasks) ? payload.project_tasks : [];
    const nextProjectTimeLogsRaw = Array.isArray(payload?.project_time_logs) ? payload.project_time_logs : [];
    const nextProjectMeetingsRaw = Array.isArray(payload?.project_meetings) ? payload.project_meetings : [];
    const nextProjectDocumentsRaw = Array.isArray(payload?.project_documents) ? payload.project_documents : [];
    const nextProjectFinanceItemsRaw = Array.isArray(payload?.project_finance_items) ? payload.project_finance_items : [];
    const nextTemplatesRaw = Array.isArray(payload?.message_templates) ? payload.message_templates : [];
    const nextPlansRaw = Array.isArray(payload?.plans) ? payload.plans : [];
    const nextPlanItemsRaw = Array.isArray(payload?.plan_items) ? payload.plan_items : [];
    const nextFinanceIncomeRaw = Array.isArray(payload?.finance_income) ? payload.finance_income : [];
    const nextFinanceExpensesRaw = Array.isArray(payload?.finance_expenses) ? payload.finance_expenses : [];
    const nextFinanceAllocationRulesRaw = Array.isArray(payload?.finance_allocation_rules) ? payload.finance_allocation_rules : [];
    const nextFinancePurchaseGoalsRaw = Array.isArray(payload?.finance_purchase_goals) ? payload.finance_purchase_goals : [];
    const nextFinanceInvestmentIdeasRaw = Array.isArray(payload?.finance_investment_ideas) ? payload.finance_investment_ideas : [];
    const nextFinanceInvestmentRulesRaw = Array.isArray(payload?.finance_investment_rules) ? payload.finance_investment_rules : [];
    const nextFinanceInvestmentAllocationsRaw = Array.isArray(payload?.finance_investment_allocations) ? payload.finance_investment_allocations : [];
    const nextStrategyItemsRaw = Array.isArray(payload?.strategy_items) ? payload.strategy_items : [];
    const nextStrategyGoalsRaw = Array.isArray(payload?.strategy_goals) ? payload.strategy_goals : [];
    const nextStrategyPlansRaw = Array.isArray(payload?.strategy_plans) ? payload.strategy_plans : [];
    const nextStrategyTacticsRaw = Array.isArray(payload?.strategy_tactics) ? payload.strategy_tactics : [];
    const nextStrategyExperimentsRaw = Array.isArray(payload?.strategy_experiments) ? payload.strategy_experiments : [];
    const nextStrategyDecisionsRaw = Array.isArray(payload?.strategy_decisions) ? payload.strategy_decisions : [];

    const companyById = new Map(nextCompanies.map((company) => [company.id, company] as const));
    const personById = new Map<string, Person>();

    const nextPeople = nextPeopleRaw.map((row: any) => {
      const mapped = mapPersonRow(row, undefined);
      mapped.companyName = mapped.companyName || companyById.get(mapped.companyId || '')?.name;
      personById.set(mapped.id, mapped);
      return mapped;
    });

    const nextMessages = nextMessagesRaw.map((row: any) => {
      const mapped = mapMessageRow(row);
      mapped.companyName = mapped.companyName || companyById.get(mapped.companyId || '')?.name;
      mapped.personName = mapped.personName || personById.get(mapped.personId || '')?.fullName;
      return mapped;
    });

    const nextDeals = nextDealsRaw.map((row: any) => {
      const mapped = mapDealRow(row);
      mapped.companyName = mapped.companyName || companyById.get(mapped.companyId || '')?.name;
      mapped.personName = mapped.personName || personById.get(mapped.personId || '')?.fullName;
      return mapped;
    });

    const nextProjects = nextProjectsRaw.map((row: any) => {
      const mapped = mapProjectRow(row);
      mapped.relatedCompanyName = mapped.relatedCompanyName || companyById.get(mapped.relatedCompanyId || '')?.name;
      mapped.relatedPersonName = mapped.relatedPersonName || personById.get(mapped.relatedPersonId || '')?.fullName;
      return mapped;
    });

    const nextProjectTasks = nextProjectTasksRaw.map((row: any) => mapProjectTaskRow(row));
    const nextProjectTimeLogs = nextProjectTimeLogsRaw.map((row: any) => mapProjectTimeLogRow(row));
    const nextProjectMeetings = nextProjectMeetingsRaw.map((row: any) => mapProjectMeetingRow(row));
    const nextProjectDocuments = nextProjectDocumentsRaw.map((row: any) => mapProjectDocumentRow(row));
    const nextProjectFinanceItems = nextProjectFinanceItemsRaw.map((row: any) => mapProjectFinanceItemRow(row));

    const derived = getDerivedCollections(nextCompanies, nextPeople, nextMessages, nextDeals);
    const nextTemplates = nextTemplatesRaw.map((row: any) => mapTemplateRow(row));
    const nextStrategyGoals = attachGoalLinkNames(nextStrategyGoalsRaw.map((row: any) => strategyGoalFromDb(row)), nextProjects, nextCompanies);
    const nextStrategyPlans = attachPlanLinkNames(nextStrategyPlansRaw.map((row: any) => strategyPlanFromDb(row)), nextStrategyGoals, nextProjects);
    const nextStrategyTactics = attachTacticLinkNames(nextStrategyTacticsRaw.map((row: any) => strategyTacticFromDb(row)), nextStrategyGoals, nextStrategyPlans, nextProjects);
    const nextStrategyExperiments = attachExperimentLinkNames(nextStrategyExperimentsRaw.map((row: any) => strategyExperimentFromDb(row)), nextStrategyGoals, nextStrategyPlans, nextProjects);
    const nextStrategyDecisions = attachDecisionLinkNames(nextStrategyDecisionsRaw.map((row: any) => strategyDecisionFromDb(row)), nextStrategyGoals, nextStrategyPlans, nextProjects);
    const nextPlans = attachOsPlanLinkNames(nextPlansRaw.map((row: any) => planFromDb(row)), nextProjects, nextStrategyGoals);
    const nextPlanItems = attachPlanItemLinkNames(nextPlanItemsRaw.map((row: any) => planItemFromDb(row)), nextProjects, nextStrategyGoals);
    const nextFinanceIncome = attachFinanceIncomeLinkNames(nextFinanceIncomeRaw.map((row: any) => financeIncomeFromDb(row)), nextProjects, nextCompanies);
    const nextFinanceExpenses = attachFinanceExpenseLinkNames(nextFinanceExpensesRaw.map((row: any) => financeExpenseFromDb(row)), nextProjects);
    const nextFinanceAllocationRules = nextFinanceAllocationRulesRaw.map((row: any) => financeAllocationRuleFromDb(row));
    const nextFinancePurchaseGoals = attachFinancePurchaseGoalLinkNames(nextFinancePurchaseGoalsRaw.map((row: any) => financePurchaseGoalFromDb(row)), nextProjects);
    const nextFinanceInvestmentIdeas = nextFinanceInvestmentIdeasRaw.map((row: any) => financeInvestmentIdeaFromDb(row));
    const nextFinanceInvestmentRules = nextFinanceInvestmentRulesRaw.map((row: any) => financeInvestmentRuleFromDb(row));
    const nextFinanceInvestmentAllocations = nextFinanceInvestmentAllocationsRaw.map((row: any) => financeInvestmentAllocationFromDb(row));
    const nextStrategyItems = attachStrategyLinkNames(
      nextStrategyItemsRaw.map((row: any) => strategyItemFromDb(row)),
      nextProjects,
      nextCompanies,
      nextPeople,
    );

    if (import.meta.env.DEV) {
      console.log('[Opportunities Debug] Loaded companies database types:', nextCompanies.map((c) => ({
        name: c.name,
        databaseType: c.databaseType,
      })));
    }

    setCompanies(nextCompanies);
    setPeople(derived.people);
    setMessages(derived.messages);
    setDeals(derived.deals);
    setProjects(nextProjects);
    setProjectTasks(nextProjectTasks);
    setProjectTimeLogs(nextProjectTimeLogs);
    setProjectMeetings(nextProjectMeetings);
    setProjectDocuments(nextProjectDocuments);
    setProjectFinanceItems(nextProjectFinanceItems);
    setTemplates(nextTemplates);
    setStrategyGoals(nextStrategyGoals);
    setStrategyPlans(nextStrategyPlans);
    setStrategyTactics(nextStrategyTactics);
    setStrategyExperiments(nextStrategyExperiments);
    setStrategyDecisions(nextStrategyDecisions);
    setPlans(nextPlans);
    setPlanItems(nextPlanItems);
    setFinanceIncome(nextFinanceIncome);
    setFinanceExpenses(nextFinanceExpenses);
    setFinanceAllocationRules(nextFinanceAllocationRules);
    setFinancePurchaseGoals(nextFinancePurchaseGoals);
    setFinanceInvestmentIdeas(nextFinanceInvestmentIdeas);
    setFinanceInvestmentRules(nextFinanceInvestmentRules);
    setFinanceInvestmentAllocations(nextFinanceInvestmentAllocations);
    setStrategyItems(nextStrategyItems);
  }, []);

  useEffect(() => {
    if (!enabled) {
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await requestOpportunities({ method: 'GET' });
        if (!mounted) return;
        applyPayload(payload);
      } catch (apiError) {
        if (!mounted) return;
        if ((apiError as ApiError)?.status === 401) {
          console.error('[Opportunities] Authentication required to load data.', apiError);
          setError('Authentication required. Please log in again.');
          setCompanies([]);
          setPeople([]);
          setMessages([]);
          setDeals([]);
          setTemplates([]);
          setStrategyGoals([]);
          setStrategyPlans([]);
          setStrategyTactics([]);
          setStrategyExperiments([]);
          setStrategyDecisions([]);
          setPlans([]);
          setPlanItems([]);
          setFinanceIncome([]);
          setFinanceExpenses([]);
          setFinanceAllocationRules([]);
          setFinancePurchaseGoals([]);
          setFinanceInvestmentIdeas([]);
          setFinanceInvestmentRules([]);
          setFinanceInvestmentAllocations([]);
          setStrategyItems([]);
          return;
        }

        console.error('[Opportunities] Failed to load from /api/opportunities, falling back to seed data.', apiError);
        const fallback = cloneSeedData();
        setCompanies(fallback.companies);
        setPeople(fallback.people);
        setMessages(fallback.messages);
        setDeals(fallback.deals);
        setTemplates(fallback.templates);
        setStrategyGoals(fallback.strategyGoals);
        setStrategyPlans(fallback.strategyPlans);
        setStrategyTactics(fallback.strategyTactics);
        setStrategyExperiments(fallback.strategyExperiments);
        setStrategyDecisions(fallback.strategyDecisions);
        setPlans(fallback.plans);
        setPlanItems(fallback.planItems);
        setFinanceIncome(fallback.financeIncome);
        setFinanceExpenses(fallback.financeExpenses);
        setFinanceAllocationRules(fallback.financeAllocationRules);
        setFinancePurchaseGoals(fallback.financePurchaseGoals);
        setFinanceInvestmentIdeas(fallback.financeInvestmentIdeas);
        setFinanceInvestmentRules(fallback.financeInvestmentRules);
        setFinanceInvestmentAllocations(fallback.financeInvestmentAllocations);
        setStrategyItems(fallback.strategyItems);
        setError('Using seed data fallback.');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    run();

    return () => {
      mounted = false;
    };
  }, [applyPayload, enabled]);

  const syncInsert = async (entity: string, data: Record<string, unknown> | Record<string, unknown>[]) => {
    const result = await requestOpportunities({
      method: 'POST',
      body: JSON.stringify({ entity, action: 'insert', data }),
    }).catch((error: ApiError) => {
      logDevError('syncInsert failed', { entity, errorMessage: error.message, errorCode: error.errorCode });
      if (error.status === 401) setError('Authentication required. Please log in again.');
      throw error;
    });

    if (result?.success === false) {
      logDevError('syncInsert result error', { entity, error: result?.error });
      throw new Error(result?.error || 'Failed to save Opportunities data.');
    }

    return Array.isArray(data) ? (result?.rows || []) : result?.row;
  };

  const importCompaniesBatch = async (
    rows: Array<{ name: string; country?: string; industry?: string; website?: string; databaseType?: string }>,
    defaultDatabaseType?: string,
  ) => {
    const dbRows = rows.map((row) => ({
      name: row.name.trim(),
      country: row.country || null,
      industry: row.industry || null,
      website: row.website || null,
      priority: 'medium',
      status: 'prospect',
      database_type: normalizeDatabaseType(row.databaseType) || normalizeDatabaseType(defaultDatabaseType) || 'sme',
    }));

    const result = await requestOpportunities({
      method: 'POST',
      body: JSON.stringify({ entity: 'companies', action: 'insert', data: dbRows }),
    }).catch((error: ApiError) => {
      if (error.status === 401) setError('Authentication required. Please log in again.');
      throw error;
    });

    if (result?.success === false) {
      throw new Error(result?.error || 'Failed to import companies.');
    }

    const inserted = Array.isArray(result?.rows) ? result.rows.map(mapCompanyRow) : [];
    if (inserted.length > 0) {
      setCompanies((current) => [...inserted, ...current]);
    }

    return inserted;
  };

  const addCompany = async (input: CompanyInput) => {
    const row = await syncInsert('companies', toCompanyDb(input));
    const next = mapCompanyRow(row);
    setCompanies((current) => [next, ...current]);
    return next;
  };

  const addPerson = async (input: PersonInput) => {
    if (!String(input.companyId || '').trim()) {
      throw new Error('Please select a company before adding a person.');
    }

    if (!String(input.fullName || '').trim()) {
      throw new Error('Please enter a full name before adding a person.');
    }

    const row = await syncInsert('people', toPersonDb(input));
    const companyId = getRowRefId(row, 'company_id', 'companyId');
    const companyName = companies.find((company) => company.id === companyId)?.name;
    const next = mapPersonRow(row, companyName);
    setPeople((current) => [next, ...current]);
    return next;
  };

  const addMessage = async (input: MessageInput) => {
    if (!String(input.companyId || '').trim()) {
      throw new Error('Please select a company before adding a message.');
    }

    const row = await syncInsert('messages', toMessageDb(input));
    const companyId = getRowRefId(row, 'company_id', 'companyId');
    const personId = getRowRefId(row, 'person_id', 'personId');
    const companyName = companies.find((company) => company.id === companyId)?.name;
    const personName = people.find((person) => person.id === personId)?.fullName;
    const next = mapMessageRow(row, companyName, personName);
    setMessages((current) => [next, ...current]);
    return next;
  };

  const addDeal = async (input: DealInput) => {
    if (!String(input.companyId || '').trim()) {
      throw new Error('Please select a company before adding a deal.');
    }

    const row = await syncInsert('deals', toDealDb(input));
    const companyId = getRowRefId(row, 'company_id', 'companyId');
    const personId = getRowRefId(row, 'person_id', 'personId');
    const companyName = companies.find((company) => company.id === companyId)?.name;
    const personName = people.find((person) => person.id === personId)?.fullName;
    const next = mapDealRow(row, companyName, personName);
    setDeals((current) => [next, ...current]);
    return next;
  };

  const importPeople = async (peopleInput: PersonInput[]) => {
    if (!Array.isArray(peopleInput) || peopleInput.length === 0) {
      return [];
    }

    const result = await requestOpportunities({
      method: 'POST',
      body: JSON.stringify({
        entity: 'people',
        action: 'bulk_insert',
        data: peopleInput.map((input) => toPersonDb(input)),
      }),
    }).catch((error: ApiError) => {
      if (error.status === 401) setError('Authentication required. Please log in again.');
      throw error;
    });

    if (result?.success === false) {
      throw new Error(result?.error || 'Failed to import people.');
    }

    const inserted = Array.isArray(result?.rows) ? result.rows : [];
    const mapped = inserted.map((row) => {
      const companyId = getRowRefId(row, 'company_id', 'companyId');
      const companyName = companies.find((company) => company.id === companyId)?.name;
      return mapPersonRow(row, companyName);
    });

    if (mapped.length > 0) {
      setPeople((current) => [...mapped, ...current]);
    }

    return mapped;
  };

  const syncUpdate = async (entity: string, id: string, data: Record<string, unknown>) => {
    const result = await requestOpportunities({
      method: 'PUT',
      body: JSON.stringify({ entity, action: 'update', id, data }),
    }).catch((error: ApiError) => {
      logDevError('syncUpdate failed', { entity, id, errorMessage: error.message, errorCode: error.errorCode });
      if (error.status === 401) setError('Authentication required. Please log in again.');
      throw error;
    });

    if (result?.success === false) {
      logDevError('syncUpdate result error', { entity, id, error: result?.error });
      throw new Error(result?.error || 'Failed to update Opportunities data.');
    }

    return result?.row;
  };

  const syncDelete = async (entity: 'companies' | 'people' | 'messages' | 'deals' | 'projects' | 'message_templates' | 'project_tasks' | 'project_time_logs' | 'project_meetings' | 'project_documents' | 'project_finance_items' | 'strategy_items' | 'strategy_goals' | 'strategy_plans' | 'strategy_tactics' | 'strategy_experiments' | 'strategy_decisions' | 'plans' | 'plan_items' | 'finance_income' | 'finance_expenses' | 'finance_allocation_rules' | 'finance_purchase_goals' | 'finance_investment_ideas' | 'finance_investment_rules' | 'finance_investment_allocations', id: string) => {
    const result = await requestOpportunities({
      method: 'DELETE',
      body: JSON.stringify({ entity, action: 'delete', id }),
    }).catch((error: ApiError) => {
      if (error.status === 401) setError('Authentication required. Please log in again.');
      throw error;
    });

    if (result?.success === false) {
      throw new Error(result?.error || 'Failed to delete Opportunities data.');
    }

    return result?.success;
  };

  const updateCompany = async (id: string, input: CompanyInput) => {
    const row = await syncUpdate('companies', id, toCompanyDb(input));
    const next = mapCompanyRow(row);
    setCompanies((current) => current.map((c) => (c.id === id ? next : c)));
    return next;
  };

  const deleteCompany = async (id: string) => {
    const confirmed = window.confirm('This may leave related people/messages/deals without a company. Continue?');
    if (!confirmed) return;
    await syncDelete('companies', id);
    setCompanies((current) => current.filter((c) => c.id !== id));
  };

  const updatePerson = async (id: string, input: PersonInput) => {
    const row = await syncUpdate('people', id, toPersonDb(input));
    const companyId = getRowRefId(row, 'company_id', 'companyId');
    const companyName = companies.find((company) => company.id === companyId)?.name;
    const next = mapPersonRow(row, companyName);
    setPeople((current) => current.map((p) => (p.id === id ? next : p)));
    return next;
  };

  const deletePerson = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this person?');
    if (!confirmed) return;
    await syncDelete('people', id);
    setPeople((current) => current.filter((p) => p.id !== id));
  };

  const updateMessage = async (id: string, input: MessageInput) => {
    const row = await syncUpdate('messages', id, toMessageDb(input));
    const companyId = getRowRefId(row, 'company_id', 'companyId');
    const personId = getRowRefId(row, 'person_id', 'personId');
    const companyName = companies.find((company) => company.id === companyId)?.name;
    const personName = people.find((person) => person.id === personId)?.fullName;
    const next = mapMessageRow(row, companyName, personName);
    setMessages((current) => current.map((m) => (m.id === id ? next : m)));
    return next;
  };

  const deleteMessage = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this message?');
    if (!confirmed) return;
    await syncDelete('messages', id);
    setMessages((current) => current.filter((m) => m.id !== id));
  };

  const updateDeal = async (id: string, input: DealInput) => {
    const row = await syncUpdate('deals', id, toDealDb(input));
    const companyId = getRowRefId(row, 'company_id', 'companyId');
    const personId = getRowRefId(row, 'person_id', 'personId');
    const companyName = companies.find((company) => company.id === companyId)?.name;
    const personName = people.find((person) => person.id === personId)?.fullName;
    const next = mapDealRow(row, companyName, personName);
    setDeals((current) => current.map((d) => (d.id === id ? next : d)));
    return next;
  };

  const deleteDeal = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this deal?');
    if (!confirmed) return;
    await syncDelete('deals', id);
    setDeals((current) => current.filter((d) => d.id !== id));
  };

  const addProject = async (input: ProjectInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Project name is required.');
    }

    const row = await syncInsert('projects', toProjectDb(input));
    const next = mapProjectRow(row);
    next.relatedCompanyName = companies.find((c) => c.id === next.relatedCompanyId)?.name;
    next.relatedPersonName = people.find((p) => p.id === next.relatedPersonId)?.fullName;
    setProjects((current) => [next, ...current]);
    return next;
  };

  const updateProject = async (id: string, input: Partial<ProjectInput>) => {
    if (input.name !== undefined && !String(input.name || '').trim()) {
      throw new Error('Project name is required.');
    }

    const row = await syncUpdate('projects', id, toProjectDbUpdate(input));
    const next = mapProjectRow(row);
    next.relatedCompanyName = companies.find((c) => c.id === next.relatedCompanyId)?.name;
    next.relatedPersonName = people.find((p) => p.id === next.relatedPersonId)?.fullName;
    setProjects((current) => current.map((p) => (p.id === id ? next : p)));
    return next;
  };

  const deleteProject = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this project?');
    if (!confirmed) return;
    await syncDelete('projects', id);
    setProjects((current) => current.filter((p) => p.id !== id));
  };

  // ── ProjectTasks CRUD ──

  const addProjectTask = async (input: ProjectTaskInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Task title is required.');
    }

    const row = await syncInsert('project_tasks', toProjectTaskDb(input));
    const next = mapProjectTaskRow(row);
    next.assignedToPersonName = people.find((p) => p.id === next.assignedToPersonId)?.fullName;
    setProjectTasks((current) => [next, ...current]);
    return next;
  };

  const updateProjectTask = async (id: string, input: Partial<ProjectTaskInput>) => {
    const row = await syncUpdate('project_tasks', id, toProjectTaskDbUpdate(input));
    const next = mapProjectTaskRow(row);
    next.assignedToPersonName = people.find((p) => p.id === next.assignedToPersonId)?.fullName;
    setProjectTasks((current) => current.map((t) => (t.id === id ? next : t)));
    return next;
  };

  const deleteProjectTask = async (id: string) => {
    const confirmed = window.confirm('Delete this task?');
    if (!confirmed) return;
    await syncDelete('project_tasks', id);
    setProjectTasks((current) => current.filter((t) => t.id !== id));
  };

  // ── ProjectTimeLogs CRUD ──

  const addProjectTimeLog = async (input: ProjectTimeLogInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Time log title is required.');
    }

    const row = await syncInsert('project_time_logs', toProjectTimeLogDb(input));
    const next = mapProjectTimeLogRow(row);
    setProjectTimeLogs((current) => [next, ...current]);
    return next;
  };

  const deleteProjectTimeLog = async (id: string) => {
    const confirmed = window.confirm('Delete this time log?');
    if (!confirmed) return;
    await syncDelete('project_time_logs', id);
    setProjectTimeLogs((current) => current.filter((t) => t.id !== id));
  };

  // ── ProjectMeetings CRUD ──

  const addProjectMeeting = async (input: ProjectMeetingInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Meeting title is required.');
    }

    const row = await syncInsert('project_meetings', toProjectMeetingDb(input));
    const next = mapProjectMeetingRow(row);
    setProjectMeetings((current) => [next, ...current]);
    return next;
  };

  const deleteProjectMeeting = async (id: string) => {
    const confirmed = window.confirm('Delete this meeting?');
    if (!confirmed) return;
    await syncDelete('project_meetings', id);
    setProjectMeetings((current) => current.filter((m) => m.id !== id));
  };

  // ── ProjectDocuments CRUD ──

  const addProjectDocument = async (input: ProjectDocumentInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Document name is required.');
    }

    const row = await syncInsert('project_documents', toProjectDocumentDb(input));
    const next = mapProjectDocumentRow(row);
    setProjectDocuments((current) => [next, ...current]);
    return next;
  };

  const deleteProjectDocument = async (id: string) => {
    const confirmed = window.confirm('Delete this document?');
    if (!confirmed) return;
    await syncDelete('project_documents', id);
    setProjectDocuments((current) => current.filter((d) => d.id !== id));
  };

  // ── ProjectFinanceItems CRUD ──

  const addProjectFinanceItem = async (input: ProjectFinanceItemInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Finance item title is required.');
    }

    const row = await syncInsert('project_finance_items', toProjectFinanceItemDb(input));
    const next = mapProjectFinanceItemRow(row);
    setProjectFinanceItems((current) => [next, ...current]);
    return next;
  };

  const deleteProjectFinanceItem = async (id: string) => {
    const confirmed = window.confirm('Delete this finance item?');
    if (!confirmed) return;
    await syncDelete('project_finance_items', id);
    setProjectFinanceItems((current) => current.filter((f) => f.id !== id));
  };

  const addStrategyItem = async (input: StrategyItemInput) => {
    if (!String(input.section || '').trim()) {
      throw new Error('Strategy section is required.');
    }

    if (!String(input.title || '').trim()) {
      throw new Error('Strategy title is required.');
    }

    const row = await syncInsert('strategy_items', strategyItemToDb(input));
    const next = attachStrategyLinkNames([strategyItemFromDb(row)], projects, companies, people)[0];
    setStrategyItems((current) => [next, ...current]);
    return next;
  };

  const updateStrategyItem = async (id: string, input: Partial<StrategyItemInput>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Strategy title is required.');
    }

    if (input.section !== undefined && !String(input.section || '').trim()) {
      throw new Error('Strategy section is required.');
    }

    const row = await syncUpdate('strategy_items', id, strategyItemToDb(input));
    const next = attachStrategyLinkNames([strategyItemFromDb(row)], projects, companies, people)[0];
    setStrategyItems((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteStrategyItem = async (id: string) => {
    const confirmed = window.confirm('Delete this strategy item?');
    if (!confirmed) return;
    await syncDelete('strategy_items', id);
    setStrategyItems((current) => current.filter((item) => item.id !== id));
  };

  const addStrategyGoal = async (input: StrategyGoalInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Goal title is required.');
    }
    const row = await syncInsert('strategy_goals', strategyGoalToDb(input));
    const next = attachGoalLinkNames([strategyGoalFromDb(row)], projects, companies)[0];
    setStrategyGoals((current) => [next, ...current]);
    return next;
  };

  const updateStrategyGoal = async (id: string, input: Partial<StrategyGoalInput>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Goal title is required.');
    }
    const row = await syncUpdate('strategy_goals', id, strategyGoalToDb(input));
    const next = attachGoalLinkNames([strategyGoalFromDb(row)], projects, companies)[0];
    setStrategyGoals((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteStrategyGoal = async (id: string) => {
    const confirmed = window.confirm('Delete this strategy goal?');
    if (!confirmed) return;
    await syncDelete('strategy_goals', id);
    setStrategyGoals((current) => current.filter((item) => item.id !== id));
  };

  const addStrategyPlan = async (input: StrategyPlanInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Plan name is required.');
    }
    const row = await syncInsert('strategy_plans', strategyPlanToDb(input));
    const next = attachPlanLinkNames([strategyPlanFromDb(row)], strategyGoals, projects)[0];
    setStrategyPlans((current) => [next, ...current]);
    return next;
  };

  const updateStrategyPlan = async (id: string, input: Partial<StrategyPlanInput>) => {
    if (input.name !== undefined && !String(input.name || '').trim()) {
      throw new Error('Plan name is required.');
    }
    const row = await syncUpdate('strategy_plans', id, strategyPlanToDb(input));
    const next = attachPlanLinkNames([strategyPlanFromDb(row)], strategyGoals, projects)[0];
    setStrategyPlans((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteStrategyPlan = async (id: string) => {
    const confirmed = window.confirm('Delete this strategy plan?');
    if (!confirmed) return;
    await syncDelete('strategy_plans', id);
    setStrategyPlans((current) => current.filter((item) => item.id !== id));
  };

  const addStrategyTactic = async (input: StrategyTacticInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Tactic title is required.');
    }
    const row = await syncInsert('strategy_tactics', strategyTacticToDb(input));
    const next = attachTacticLinkNames([strategyTacticFromDb(row)], strategyGoals, strategyPlans, projects)[0];
    setStrategyTactics((current) => [next, ...current]);
    return next;
  };

  const updateStrategyTactic = async (id: string, input: Partial<StrategyTacticInput>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Tactic title is required.');
    }
    const row = await syncUpdate('strategy_tactics', id, strategyTacticToDb(input));
    const next = attachTacticLinkNames([strategyTacticFromDb(row)], strategyGoals, strategyPlans, projects)[0];
    setStrategyTactics((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteStrategyTactic = async (id: string) => {
    const confirmed = window.confirm('Delete this strategy tactic?');
    if (!confirmed) return;
    await syncDelete('strategy_tactics', id);
    setStrategyTactics((current) => current.filter((item) => item.id !== id));
  };

  const addStrategyExperiment = async (input: StrategyExperimentInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Experiment title is required.');
    }
    const row = await syncInsert('strategy_experiments', strategyExperimentToDb(input));
    const next = attachExperimentLinkNames([strategyExperimentFromDb(row)], strategyGoals, strategyPlans, projects)[0];
    setStrategyExperiments((current) => [next, ...current]);
    return next;
  };

  const updateStrategyExperiment = async (id: string, input: Partial<StrategyExperimentInput>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Experiment title is required.');
    }
    const row = await syncUpdate('strategy_experiments', id, strategyExperimentToDb(input));
    const next = attachExperimentLinkNames([strategyExperimentFromDb(row)], strategyGoals, strategyPlans, projects)[0];
    setStrategyExperiments((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteStrategyExperiment = async (id: string) => {
    const confirmed = window.confirm('Delete this strategy experiment?');
    if (!confirmed) return;
    await syncDelete('strategy_experiments', id);
    setStrategyExperiments((current) => current.filter((item) => item.id !== id));
  };

  const addStrategyDecision = async (input: StrategyDecisionInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Decision title is required.');
    }
    const row = await syncInsert('strategy_decisions', strategyDecisionToDb(input));
    const next = attachDecisionLinkNames([strategyDecisionFromDb(row)], strategyGoals, strategyPlans, projects)[0];
    setStrategyDecisions((current) => [next, ...current]);
    return next;
  };

  const updateStrategyDecision = async (id: string, input: Partial<StrategyDecisionInput>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Decision title is required.');
    }
    const row = await syncUpdate('strategy_decisions', id, strategyDecisionToDb(input));
    const next = attachDecisionLinkNames([strategyDecisionFromDb(row)], strategyGoals, strategyPlans, projects)[0];
    setStrategyDecisions((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteStrategyDecision = async (id: string) => {
    const confirmed = window.confirm('Delete this strategy decision?');
    if (!confirmed) return;
    await syncDelete('strategy_decisions', id);
    setStrategyDecisions((current) => current.filter((item) => item.id !== id));
  };

  const addPlan = async (input: PlanInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Plan title is required.');
    }
    const row = await syncInsert('plans', planToDb(input));
    const next = attachOsPlanLinkNames([planFromDb(row)], projects, strategyGoals)[0];
    setPlans((current) => [next, ...current]);
    return next;
  };

  const updatePlan = async (id: string, input: Partial<PlanInput>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Plan title is required.');
    }
    const row = await syncUpdate('plans', id, planToDb(input));
    const next = attachOsPlanLinkNames([planFromDb(row)], projects, strategyGoals)[0];
    setPlans((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deletePlan = async (id: string) => {
    const confirmed = window.confirm('Delete this plan and all its items?');
    if (!confirmed) return;
    await syncDelete('plans', id);
    setPlans((current) => current.filter((item) => item.id !== id));
    setPlanItems((current) => current.filter((item) => item.planId !== id));
  };

  const addPlanItem = async (input: PlanItemInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Plan item title is required.');
    }
    if (!String(input.planId || '').trim()) {
      throw new Error('Plan ID is required.');
    }
    const row = await syncInsert('plan_items', planItemToDb(input));
    const next = attachPlanItemLinkNames([planItemFromDb(row)], projects, strategyGoals)[0];
    setPlanItems((current) => [next, ...current]);
    return next;
  };

  const updatePlanItem = async (id: string, input: Partial<PlanItemInput>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Plan item title is required.');
    }
    const row = await syncUpdate('plan_items', id, planItemToDb(input));
    const next = attachPlanItemLinkNames([planItemFromDb(row)], projects, strategyGoals)[0];
    setPlanItems((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deletePlanItem = async (id: string) => {
    const confirmed = window.confirm('Delete this plan item?');
    if (!confirmed) return;
    await syncDelete('plan_items', id);
    setPlanItems((current) => current.filter((item) => item.id !== id));
  };

  // ── Finance Income CRUD ──

  const addFinanceIncome = async (input: Partial<FinanceIncome>) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Income title is required.');
    }
    const row = await syncInsert('finance_income', financeIncomeToDb(input));
    const next = attachFinanceIncomeLinkNames([financeIncomeFromDb(row)], projects, companies)[0];
    setFinanceIncome((current) => [next, ...current]);
    return next;
  };

  const updateFinanceIncome = async (id: string, input: Partial<FinanceIncome>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Income title is required.');
    }
    const row = await syncUpdate('finance_income', id, financeIncomeToDb(input));
    const next = attachFinanceIncomeLinkNames([financeIncomeFromDb(row)], projects, companies)[0];
    setFinanceIncome((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteFinanceIncome = async (id: string) => {
    const confirmed = window.confirm('Delete this income entry?');
    if (!confirmed) return;
    await syncDelete('finance_income', id);
    setFinanceIncome((current) => current.filter((item) => item.id !== id));
  };

  // ── Finance Expenses CRUD ──

  const addFinanceExpense = async (input: Partial<FinanceExpense>) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Expense title is required.');
    }
    const row = await syncInsert('finance_expenses', financeExpenseToDb(input));
    const next = attachFinanceExpenseLinkNames([financeExpenseFromDb(row)], projects)[0];
    setFinanceExpenses((current) => [next, ...current]);
    return next;
  };

  const updateFinanceExpense = async (id: string, input: Partial<FinanceExpense>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Expense title is required.');
    }
    const row = await syncUpdate('finance_expenses', id, financeExpenseToDb(input));
    const next = attachFinanceExpenseLinkNames([financeExpenseFromDb(row)], projects)[0];
    setFinanceExpenses((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteFinanceExpense = async (id: string) => {
    const confirmed = window.confirm('Delete this expense entry?');
    if (!confirmed) return;
    await syncDelete('finance_expenses', id);
    setFinanceExpenses((current) => current.filter((item) => item.id !== id));
  };

  // ── Finance Allocation Rules CRUD ──

  const addFinanceAllocationRule = async (input: Partial<FinanceAllocationRule>) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Allocation rule name is required.');
    }
    const row = await syncInsert('finance_allocation_rules', financeAllocationRuleToDb(input));
    const next = financeAllocationRuleFromDb(row);
    setFinanceAllocationRules((current) => [next, ...current]);
    return next;
  };

  const updateFinanceAllocationRule = async (id: string, input: Partial<FinanceAllocationRule>) => {
    if (input.name !== undefined && !String(input.name || '').trim()) {
      throw new Error('Allocation rule name is required.');
    }
    const row = await syncUpdate('finance_allocation_rules', id, financeAllocationRuleToDb(input));
    const next = financeAllocationRuleFromDb(row);
    setFinanceAllocationRules((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteFinanceAllocationRule = async (id: string) => {
    const confirmed = window.confirm('Delete this allocation rule?');
    if (!confirmed) return;
    await syncDelete('finance_allocation_rules', id);
    setFinanceAllocationRules((current) => current.filter((item) => item.id !== id));
  };

  // ── Finance Purchase Goals CRUD ──

  const addFinancePurchaseGoal = async (input: Partial<FinancePurchaseGoal>) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Purchase goal title is required.');
    }
    const row = await syncInsert('finance_purchase_goals', financePurchaseGoalToDb(input));
    const next = attachFinancePurchaseGoalLinkNames([financePurchaseGoalFromDb(row)], projects)[0];
    setFinancePurchaseGoals((current) => [next, ...current]);
    return next;
  };

  const updateFinancePurchaseGoal = async (id: string, input: Partial<FinancePurchaseGoal>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Purchase goal title is required.');
    }
    const row = await syncUpdate('finance_purchase_goals', id, financePurchaseGoalToDb(input));
    const next = attachFinancePurchaseGoalLinkNames([financePurchaseGoalFromDb(row)], projects)[0];
    setFinancePurchaseGoals((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteFinancePurchaseGoal = async (id: string) => {
    const confirmed = window.confirm('Delete this purchase goal?');
    if (!confirmed) return;
    await syncDelete('finance_purchase_goals', id);
    setFinancePurchaseGoals((current) => current.filter((item) => item.id !== id));
  };

  // ── Finance Investment Ideas CRUD ──

  const addFinanceInvestmentIdea = async (input: Partial<FinanceInvestmentIdea>) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Investment idea title is required.');
    }
    const row = await syncInsert('finance_investment_ideas', financeInvestmentIdeaToDb(input));
    const next = financeInvestmentIdeaFromDb(row);
    setFinanceInvestmentIdeas((current) => [next, ...current]);
    return next;
  };

  const updateFinanceInvestmentIdea = async (id: string, input: Partial<FinanceInvestmentIdea>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Investment idea title is required.');
    }
    const row = await syncUpdate('finance_investment_ideas', id, financeInvestmentIdeaToDb(input));
    const next = financeInvestmentIdeaFromDb(row);
    setFinanceInvestmentIdeas((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteFinanceInvestmentIdea = async (id: string) => {
    const confirmed = window.confirm('Delete this investment idea?');
    if (!confirmed) return;
    await syncDelete('finance_investment_ideas', id);
    setFinanceInvestmentIdeas((current) => current.filter((item) => item.id !== id));
  };

  // ── Finance Investment Rules CRUD ──

  const addFinanceInvestmentRule = async (input: Partial<FinanceInvestmentRule>) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Investment rule title is required.');
    }
    const row = await syncInsert('finance_investment_rules', financeInvestmentRuleToDb(input));
    const next = financeInvestmentRuleFromDb(row);
    setFinanceInvestmentRules((current) => [next, ...current]);
    return next;
  };

  const updateFinanceInvestmentRule = async (id: string, input: Partial<FinanceInvestmentRule>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Investment rule title is required.');
    }
    const row = await syncUpdate('finance_investment_rules', id, financeInvestmentRuleToDb(input));
    const next = financeInvestmentRuleFromDb(row);
    setFinanceInvestmentRules((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteFinanceInvestmentRule = async (id: string) => {
    const confirmed = window.confirm('Delete this investment rule?');
    if (!confirmed) return;
    await syncDelete('finance_investment_rules', id);
    setFinanceInvestmentRules((current) => current.filter((item) => item.id !== id));
  };

  // ── Finance Investment Allocations CRUD ──

  const addFinanceInvestmentAllocation = async (input: Partial<FinanceInvestmentAllocation>) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Investment allocation name is required.');
    }
    const row = await syncInsert('finance_investment_allocations', financeInvestmentAllocationToDb(input));
    const next = financeInvestmentAllocationFromDb(row);
    setFinanceInvestmentAllocations((current) => [next, ...current]);
    return next;
  };

  const updateFinanceInvestmentAllocation = async (id: string, input: Partial<FinanceInvestmentAllocation>) => {
    if (input.name !== undefined && !String(input.name || '').trim()) {
      throw new Error('Investment allocation name is required.');
    }
    const row = await syncUpdate('finance_investment_allocations', id, financeInvestmentAllocationToDb(input));
    const next = financeInvestmentAllocationFromDb(row);
    setFinanceInvestmentAllocations((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteFinanceInvestmentAllocation = async (id: string) => {
    const confirmed = window.confirm('Delete this investment allocation?');
    if (!confirmed) return;
    await syncDelete('finance_investment_allocations', id);
    setFinanceInvestmentAllocations((current) => current.filter((item) => item.id !== id));
  };

  const addTemplate = async (input: MessageTemplateInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Template name is required.');
    }
    if (!String(input.body || '').trim()) {
      throw new Error('Template body is required.');
    }

    const row = await syncInsert('message_templates', toTemplateDb(input));
    const next = mapTemplateRow(row);
    setTemplates((current) => [next, ...current]);
    return next;
  };

  const updateTemplate = async (id: string, input: MessageTemplateInput) => {
    const row = await syncUpdate('message_templates', id, toTemplateDb(input));
    const next = mapTemplateRow(row);
    setTemplates((current) => current.map((template) => (template.id === id ? next : template)));
    return next;
  };

  const deleteTemplate = async (id: string) => {
    const confirmed = window.confirm('Deactivate this template? It will be hidden from active outreach usage.');
    if (!confirmed) return;
    await syncDelete('message_templates', id);
    setTemplates((current) => current.map((template) => (template.id === id ? { ...template, isActive: false } : template)));
  };

  const seedDefaultTemplates = async () => {
    if (templates.length > 0) return [];
    const result = await syncInsert('message_templates', staticMessageTemplates.map((template) => ({
      name: template.name,
      audience: template.audience,
      goal: template.goal,
      language: template.language,
      subject: toNullableString(template.subject),
      body: template.body,
      is_active: true,
    })));

    const rows = Array.isArray(result) ? result : [];
    const mapped = rows.map((row) => mapTemplateRow(row));
    if (mapped.length > 0) {
      setTemplates(mapped);
    }
    return mapped;
  };

  useEffect(() => {
    setStrategyItems((current) => {
      const next = attachStrategyLinkNames(current, projects, companies, people);
      return shouldReplaceCollection(current, next, ['linkedProjectName', 'linkedCompanyName', 'linkedPersonName']) ? next : current;
    });
  }, [projects, companies, people]);

  useEffect(() => {
    setStrategyGoals((current) => {
      const next = attachGoalLinkNames(current, projects, companies);
      return shouldReplaceCollection(current, next, ['linkedProjectName', 'linkedCompanyName']) ? next : current;
    });
  }, [projects, companies]);

  useEffect(() => {
    setStrategyPlans((current) => {
      const next = attachPlanLinkNames(current, strategyGoals, projects);
      return shouldReplaceCollection(current, next, ['linkedGoalTitle', 'linkedProjectName']) ? next : current;
    });
  }, [projects, strategyGoals]);

  useEffect(() => {
    setStrategyTactics((current) => {
      const next = attachTacticLinkNames(current, strategyGoals, strategyPlans, projects);
      return shouldReplaceCollection(current, next, ['linkedGoalTitle', 'linkedPlanName', 'linkedProjectName']) ? next : current;
    });

    setStrategyExperiments((current) => {
      const next = attachExperimentLinkNames(current, strategyGoals, strategyPlans, projects);
      return shouldReplaceCollection(current, next, ['linkedGoalTitle', 'linkedPlanName', 'linkedProjectName']) ? next : current;
    });

    setStrategyDecisions((current) => {
      const next = attachDecisionLinkNames(current, strategyGoals, strategyPlans, projects);
      return shouldReplaceCollection(current, next, ['linkedGoalTitle', 'linkedPlanName', 'linkedProjectName']) ? next : current;
    });
  }, [projects, strategyGoals, strategyPlans]);

  useEffect(() => {
    setFinanceIncome((current) => {
      const next = attachFinanceIncomeLinkNames(current, projects, companies);
      return shouldReplaceCollection(current, next, ['linkedProjectName', 'linkedCompanyName']) ? next : current;
    });
    setFinanceExpenses((current) => {
      const next = attachFinanceExpenseLinkNames(current, projects);
      return shouldReplaceCollection(current, next, ['linkedProjectName']) ? next : current;
    });
    setFinancePurchaseGoals((current) => {
      const next = attachFinancePurchaseGoalLinkNames(current, projects);
      return shouldReplaceCollection(current, next, ['linkedProjectName']) ? next : current;
    });
  }, [projects, companies]);

  useEffect(() => {
    setPlans((current) => {
      const next = attachOsPlanLinkNames(current, projects, strategyGoals);
      return shouldReplaceCollection(current, next, ['linkedProjectName', 'linkedStrategyGoalTitle']) ? next : current;
    });
    setPlanItems((current) => {
      const next = attachPlanItemLinkNames(current, projects, strategyGoals);
      return shouldReplaceCollection(current, next, ['linkedProjectName', 'linkedStrategyGoalTitle']) ? next : current;
    });
  }, [projects, strategyGoals]);

  const resetToSeedData = () => {
    console.warn('Database reset is not implemented yet.');
    const fallback = cloneSeedData();
    setCompanies(fallback.companies);
    setPeople(fallback.people);
    setMessages(fallback.messages);
    setDeals(fallback.deals);
    setTemplates(fallback.templates);
    setStrategyGoals(fallback.strategyGoals);
    setStrategyPlans(fallback.strategyPlans);
    setStrategyTactics(fallback.strategyTactics);
    setStrategyExperiments(fallback.strategyExperiments);
    setStrategyDecisions(fallback.strategyDecisions);
    setPlans(fallback.plans);
    setPlanItems(fallback.planItems);
    setFinanceIncome(fallback.financeIncome);
    setFinanceExpenses(fallback.financeExpenses);
    setFinanceAllocationRules(fallback.financeAllocationRules);
    setFinancePurchaseGoals(fallback.financePurchaseGoals);
    setFinanceInvestmentIdeas(fallback.financeInvestmentIdeas);
    setFinanceInvestmentRules(fallback.financeInvestmentRules);
    setFinanceInvestmentAllocations(fallback.financeInvestmentAllocations);
    setStrategyItems(fallback.strategyItems);
  };

  return {
    companies,
    people,
    messages,
    deals,
    projects,
    projectTasks,
    projectTimeLogs,
    projectMeetings,
    projectDocuments,
    projectFinanceItems,
    templates,
    strategyItems,
    strategyGoals,
    strategyPlans,
    strategyTactics,
    strategyExperiments,
    strategyDecisions,
    strategyNotes,
    plans,
    planItems,
    financeIncome,
    financeExpenses,
    financeAllocationRules,
    financePurchaseGoals,
    financeInvestmentIdeas,
    addFinanceIncome,
    updateFinanceIncome,
    deleteFinanceIncome,
    addFinanceExpense,
    updateFinanceExpense,
    deleteFinanceExpense,
    addFinanceAllocationRule,
    updateFinanceAllocationRule,
    deleteFinanceAllocationRule,
    addFinancePurchaseGoal,
    updateFinancePurchaseGoal,
    deleteFinancePurchaseGoal,
    addFinanceInvestmentIdea,
    updateFinanceInvestmentIdea,
    deleteFinanceInvestmentIdea,
    financeInvestmentRules,
    financeInvestmentAllocations,
    addFinanceInvestmentRule,
    updateFinanceInvestmentRule,
    deleteFinanceInvestmentRule,
    addFinanceInvestmentAllocation,
    updateFinanceInvestmentAllocation,
    deleteFinanceInvestmentAllocation,
    addPlan,
    updatePlan,
    deletePlan,
    addPlanItem,
    updatePlanItem,
    deletePlanItem,
    importCompaniesBatch,
    addCompany,
    addPerson,
    addMessage,
    addDeal,
    addProject,
    addStrategyItem,
    addStrategyGoal,
    addStrategyPlan,
    addStrategyTactic,
    addStrategyExperiment,
    addStrategyDecision,
    addTemplate,
    importPeople,
    updateCompany,
    deleteCompany,
    updatePerson,
    deletePerson,
    updateMessage,
    deleteMessage,
    updateDeal,
    deleteDeal,
    updateProject,
    deleteProject,
    updateStrategyItem,
    deleteStrategyItem,
    updateStrategyGoal,
    deleteStrategyGoal,
    updateStrategyPlan,
    deleteStrategyPlan,
    updateStrategyTactic,
    deleteStrategyTactic,
    updateStrategyExperiment,
    deleteStrategyExperiment,
    updateStrategyDecision,
    deleteStrategyDecision,
    addProjectTask,
    updateProjectTask,
    deleteProjectTask,
    addProjectTimeLog,
    deleteProjectTimeLog,
    addProjectMeeting,
    deleteProjectMeeting,
    addProjectDocument,
    deleteProjectDocument,
    addProjectFinanceItem,
    deleteProjectFinanceItem,
    updateTemplate,
    deleteTemplate,
    seedDefaultTemplates,
    resetToSeedData,
    loading,
    error,
  };
};

export default useOpportunitiesData;