import { useCallback, useEffect, useMemo, useState } from 'react';
import seedData from '../data/opportunitiesSeed';
import { messageTemplates as staticMessageTemplates } from '../data/messageTemplates';
import { isValidUuid } from '../utils/securityUtils';
import {
  toNullableString, toNullableNumber, normalizeDatabaseType,
  toIso,
  companyFromDb as mapCompanyRow, companyToDb as toCompanyDb, companyUpdateToDb as toCompanyUpdateDb,
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
  documentFromDb as mapDocumentRow, documentToDb as toDocumentDb,
  documentTemplateFromDb as mapDocumentTemplateRow, documentTemplateToDb as toDocumentTemplateDb,
  documentBrandSettingsFromDb as mapDocumentBrandSettingsRow, documentBrandSettingsToDb as toDocumentBrandSettingsDb,
  invoiceFromDb as mapInvoiceRow, invoiceToDb as toInvoiceDb,
  invoiceItemFromDb as mapInvoiceItemRow, invoiceItemToDb as toInvoiceItemDb,
  generatedDocumentFromDb as mapGeneratedDocumentRow, generatedDocumentToDb as toGeneratedDocumentDb,
  aiProviderKeyFromDb as mapAIProviderKeyRow,
  aiUseCaseSettingFromDb as mapAIUseCaseSettingRow,
  relationshipFromDb as mapRelationshipRow,
  relationshipToDb as toRelationshipDb,
  relationshipInteractionFromDb as mapRelationshipInteractionRow,
  relationshipInteractionToDb as toRelationshipInteractionDb,
  relationshipCategoryFromDb as mapRelationshipCategoryRow,
  relationshipCategoryToDb as toRelationshipCategoryDb,
  relationshipContactMethodFromDb as mapRelationshipContactMethodRow,
  relationshipContactMethodToDb as toRelationshipContactMethodDb,
  personContactMethodFromDb,
  personContactMethodToDb as toPersonContactMethodDb,
  relationshipOpportunityFromDb as mapRelationshipOpportunityRow,
  relationshipOpportunityToDb as toRelationshipOpportunityDb,
  noteCategoryFromDb as mapNoteCategoryRow,
  noteCategoryToDb as toNoteCategoryDb,
  smartNoteFromDb as mapSmartNoteRow,
  smartNoteToDb as toSmartNoteDb,
  noteAttachmentFromDb as mapNoteAttachmentRow,
  noteAttachmentToDb as toNoteAttachmentDb,
  noteBlockFromDb as mapNoteBlockRow,
  noteBlockToDb as toNoteBlockDb,
} from '../utils/opportunitiesMappers';
import type {
  OpportunitiesData,
  CompanyContactMethod,
  CompanyContactMethodInput,
  PersonContactMethod,
  PersonContactMethodInput,
  CompanyProblemProfile,
  CompanyProblemProfileInput,
  CompanyOutreachScript,
  CompanyOutreachScriptInput,
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
  DocumentItem,
  DocumentInput,
  DocumentTemplate,
  DocumentTemplateInput,
  DocumentBrandSettings,
  DocumentBrandSettingsInput,
  GeneratedDocument,
  GeneratedDocumentInput,
  Invoice,
  InvoiceInput,
  InvoiceItem,
  InvoiceItemInput,
  Relationship,
  RelationshipInput,
  RelationshipInteraction,
  RelationshipInteractionInput,
  RelationshipCategory,
  RelationshipCategoryInput,
  RelationshipContactMethod,
  RelationshipContactMethodInput,
  RelationshipOpportunity,
  RelationshipOpportunityInput,
  NoteCategory,
  NoteCategoryInput,
  SmartNote,
  SmartNoteInput,
  NoteAttachment,
  NoteAttachmentInput,
  NoteBlock,
  NoteBlockInput,
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
  FinancePeriod,
  FinanceRecurringRule,
  AIProviderKey,
  AIProviderKeyInput,
  AIUseCaseSetting,
  AIUseCaseSettingInput,
  Task,
  TaskInput,
  RecurringTask,
  RecurringTaskInput,
  SocialPlatform,
  SocialPlatformInput,
  SocialPerson,
  SocialPersonInput,
  ContentPillar,
  ContentPillarInput,
  ContentStrategy,
  ContentStrategyInput,
  ContentItem,
  ContentItemInput,
  WeeklyContentPlan,
  WeeklyContentPlanInput,
  SocialWeeklySystem,
  SocialWeeklySystemInput,
  SocialWeeklyTask,
  SocialWeeklyTaskInput,
  LifeNutritionLog,
  LifeNutritionLogInput,
  LifeFitnessLog,
  LifeFitnessLogInput,
  LifeDeenLog,
  LifeDeenLogInput,
  LifeFamilyAction,
  LifeFamilyActionInput,
  LifeWeeklyReview,
  LifeWeeklyReviewInput,
  DesktopShortcut,
  DesktopShortcutInput,
  DesktopGroup,
  DesktopGroupInput,
  DesktopSettings,
  DesktopSettingsInput,
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
  documents: [],
  documentTemplates: [],
  documentBrandSettings: [],
  aiProviderKeys: [],
  aiUseCaseSettings: [],
  generatedDocuments: [],
  invoices: [],
  invoiceItems: [],
  relationships: [],
  relationshipInteractions: [],
  relationshipOpportunities: [],
  relationshipCategories: [],
  relationshipContactMethods: [],
  noteCategories: [],
  smartNotes: [],
  noteAttachments: [],
  noteBlocks: [],
  templates: staticMessageTemplates.map((item) => ({ ...item, isActive: true })),
  strategyItems: [],
  strategyGoals: [],
  strategyPlans: [],
  strategyTactics: [],
  strategyExperiments: [],
  plans: [],
  planItems: [],
  financeIncome: [],
  financeExpenses: [],
  financeAllocationRules: [],
  financePurchaseGoals: [],
  financeInvestmentIdeas: [],
  financeInvestmentRules: [],
  financeInvestmentAllocations: [],
  financePeriods: [],
  financeRecurringRules: [],
  tasks: [],
  recurringTasks: [],
  socialPlatforms: [],
  socialPeople: [],
  contentPillars: [],
  contentStrategies: [],
  contentItems: [],
  weeklyContentPlans: [],
  socialWeeklySystems: [],
  socialWeeklyTasks: [],
  lifeNutritionLogs: [],
  lifeFitnessLogs: [],
  lifeDeenLogs: [],
  lifeFamilyActions: [],
  lifeWeeklyReviews: [],
  companyContactMethods: [],
  companyProblemProfiles: [],
  companyOutreachScripts: [],
  desktopShortcuts: [],
  desktopSettings: null,
  desktopGroups: [],
  personContactMethods: [],
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
  documents?: any[];
  document_templates?: any[];
  document_brand_settings?: any[];
  generated_documents?: any[];
  invoices?: any[];
  invoice_items?: any[];
  relationships?: any[];
  relationship_interactions?: any[];
  relationship_opportunities?: any[];
  note_categories?: any[];
  smart_notes?: any[];
  note_attachments?: any[];
  note_blocks?: any[];
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
  finance_periods?: any[];
  finance_recurring_rules?: any[];
  tasks?: any[];
  recurring_tasks?: any[];
  strategyNotes?: any[];
  social_platforms?: any[];
  content_pillars?: any[];
  content_strategy?: any[];
  content_items?: any[];
  weekly_content_plans?: any[];
  company_contact_methods?: any[];
  company_problem_profiles?: any[];
  company_outreach_scripts?: any[];
  desktop_shortcuts?: any[];
  desktop_settings?: any;
  person_contact_methods?: any[];
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

const attachDocumentLinkNames = (
  items: DocumentItem[],
  projects: Project[],
  companies: Company[],
  people: Person[],
  deals: Deal[],
) => {
  const projectById = new Map(projects.map((project) => [project.id, project.name] as const));
  const companyById = new Map(companies.map((company) => [company.id, company.name] as const));
  const personById = new Map(people.map((person) => [person.id, person.fullName] as const));
  const dealById = new Map(deals.map((deal) => [deal.id, deal.servicePackage || deal.id] as const));

  return items.map((item) => ({
    ...item,
    relatedProjectName: item.relatedProjectName || projectById.get(item.relatedProjectId || ''),
    relatedCompanyName: item.relatedCompanyName || companyById.get(item.relatedCompanyId || ''),
    relatedPersonName: item.relatedPersonName || personById.get(item.relatedPersonId || ''),
    relatedDealName: item.relatedDealName || dealById.get(item.relatedDealId || ''),
  }));
};

const attachGeneratedDocumentLinkNames = (
  items: GeneratedDocument[],
  documentTemplates: DocumentTemplate[],
  projects: Project[],
  companies: Company[],
  people: Person[],
  deals: Deal[],
) => {
  const templateById = new Map(documentTemplates.map((template) => [template.id, template.name] as const));
  const projectById = new Map(projects.map((project) => [project.id, project.name] as const));
  const companyById = new Map(companies.map((company) => [company.id, company.name] as const));
  const personById = new Map(people.map((person) => [person.id, person.fullName] as const));
  const dealById = new Map(deals.map((deal) => [deal.id, deal.servicePackage || deal.id] as const));

  return items.map((item) => ({
    ...item,
    templateName: item.templateName || templateById.get(item.templateId || ''),
    relatedProjectName: item.relatedProjectName || projectById.get(item.relatedProjectId || ''),
    relatedCompanyName: item.relatedCompanyName || companyById.get(item.relatedCompanyId || ''),
    relatedPersonName: item.relatedPersonName || personById.get(item.relatedPersonId || ''),
    relatedDealName: item.relatedDealName || dealById.get(item.relatedDealId || ''),
  }));
};

const attachInvoiceLinkNames = (
  items: Invoice[],
  projects: Project[],
  companies: Company[],
  people: Person[],
  deals: Deal[],
) => {
  const projectById = new Map(projects.map((project) => [project.id, project.name] as const));
  const companyById = new Map(companies.map((company) => [company.id, company.name] as const));
  const personById = new Map(people.map((person) => [person.id, person.fullName] as const));
  const dealById = new Map(deals.map((deal) => [deal.id, deal.servicePackage || deal.id] as const));

  return items.map((item) => ({
    ...item,
    relatedProjectName: item.relatedProjectName || projectById.get(item.relatedProjectId || ''),
    relatedCompanyName: item.relatedCompanyName || companyById.get(item.relatedCompanyId || ''),
    relatedPersonName: item.relatedPersonName || personById.get(item.relatedPersonId || ''),
    relatedDealName: item.relatedDealName || dealById.get(item.relatedDealId || ''),
  }));
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

const attachSmartNoteLinkNames = (
  items: SmartNote[],
  noteCategories: NoteCategory[],
  projects: Project[],
  companies: Company[],
  people: Person[],
  relationships: Relationship[],
  tasks: Task[],
  strategyGoals: StrategyGoal[],
  plans: Plan[],
) => {
  const categoryById = new Map(noteCategories.map((category) => [category.id, category] as const));
  const categoryBySlug = new Map(noteCategories.map((category) => [category.slug, category] as const));
  const projectById = new Map(projects.map((project) => [project.id, project.name] as const));
  const companyById = new Map(companies.map((company) => [company.id, company.name] as const));
  const personById = new Map(people.map((person) => [person.id, person.fullName] as const));
  const relationshipById = new Map(relationships.map((relationship) => [relationship.id, relationship.displayName] as const));
  const taskById = new Map(tasks.map((task) => [task.id, task.title] as const));
  const strategyGoalById = new Map(strategyGoals.map((goal) => [goal.id, goal.title] as const));
  const planById = new Map(plans.map((plan) => [plan.id, plan.title] as const));

  return items.map((item) => {
    const category = item.categoryId ? categoryById.get(item.categoryId) : item.categorySlug ? categoryBySlug.get(item.categorySlug) : undefined;

    return {
      ...item,
      categoryName: item.categoryName || category?.name,
      categorySlug: item.categorySlug || category?.slug,
      categoryColor: item.categoryColor || category?.color,
      linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
      linkedCompanyName: item.linkedCompanyName || companyById.get(item.linkedCompanyId || ''),
      linkedPersonName: item.linkedPersonName || personById.get(item.linkedPersonId || ''),
      linkedRelationshipName: item.linkedRelationshipName || relationshipById.get(item.linkedRelationshipId || ''),
      linkedTaskTitle: item.linkedTaskTitle || taskById.get(item.linkedTaskId || ''),
      linkedStrategyGoalTitle: item.linkedStrategyGoalTitle || strategyGoalById.get(item.linkedStrategyGoalId || ''),
      linkedPlanTitle: item.linkedPlanTitle || planById.get(item.linkedPlanId || ''),
    };
  });
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
  financePeriodId: row?.finance_period_id ?? row?.financePeriodId ?? undefined,
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
  if (input.financePeriodId !== undefined) payload.finance_period_id = toNullableString(input.financePeriodId);
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
  financePeriodId: row?.finance_period_id ?? row?.financePeriodId ?? undefined,
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
  if (input.financePeriodId !== undefined) payload.finance_period_id = toNullableString(input.financePeriodId);
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
  financePeriodId: row?.finance_period_id ?? row?.financePeriodId ?? undefined,
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
  if (input.financePeriodId !== undefined) payload.finance_period_id = toNullableString(input.financePeriodId);
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
  financePeriodId: row?.finance_period_id ?? row?.financePeriodId ?? undefined,
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
  if (input.financePeriodId !== undefined) payload.finance_period_id = toNullableString(input.financePeriodId);
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

const financePeriodFromDb = (row: any): FinancePeriod => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  type: String(row?.type ?? 'monthly'),
  startDate: row?.start_date ?? row?.startDate ?? undefined,
  endDate: row?.end_date ?? row?.endDate ?? undefined,
  status: row?.status ?? 'active',
  focus: row?.focus ?? undefined,
  targetIncome: row?.target_income != null ? Number(row.target_income) : (row?.targetIncome != null ? Number(row.targetIncome) : undefined),
  targetExpenses: row?.target_expenses != null ? Number(row.target_expenses) : (row?.targetExpenses != null ? Number(row.targetExpenses) : undefined),
  targetSavings: row?.target_savings != null ? Number(row.target_savings) : (row?.targetSavings != null ? Number(row.targetSavings) : undefined),
  targetInvestment: row?.target_investment != null ? Number(row.target_investment) : (row?.targetInvestment != null ? Number(row.targetInvestment) : undefined),
  reviewNotes: row?.review_notes ?? row?.reviewNotes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const financeRecurringRuleFromDb = (row: any): FinanceRecurringRule => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  kind: row?.kind ?? 'income',
  category: row?.category ?? undefined,
  amount: Number(row?.amount ?? 0),
  currency: String(row?.currency ?? 'MYR'),
  frequency: row?.frequency ?? 'monthly',
  startDate: row?.start_date ?? row?.startDate ?? undefined,
  endDate: row?.end_date ?? row?.endDate ?? undefined,
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  confidence: row?.confidence ?? 'medium',
  source: row?.source ?? undefined,
  notes: row?.notes ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  linkedCompanyId: row?.linked_company_id ?? row?.linkedCompanyId ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const financeRecurringRuleToDb = (input: Partial<FinanceRecurringRule>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.kind !== undefined) payload.kind = input.kind;
  if (input.category !== undefined) payload.category = toNullableString(input.category);
  if (input.amount !== undefined) payload.amount = Number(input.amount);
  if (input.currency !== undefined) payload.currency = input.currency;
  if (input.frequency !== undefined) payload.frequency = input.frequency;
  if (input.startDate !== undefined) payload.start_date = toNullableString(input.startDate);
  if (input.endDate !== undefined) payload.end_date = toNullableString(input.endDate);
  if (input.isActive !== undefined) payload.is_active = Boolean(input.isActive);
  if (input.confidence !== undefined) payload.confidence = input.confidence;
  if (input.source !== undefined) payload.source = toNullableString(input.source);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  if (input.linkedCompanyId !== undefined) payload.linked_company_id = toNullableString(input.linkedCompanyId);
  return payload;
};

const attachFinanceRecurringRuleLinkNames = (items: FinanceRecurringRule[], projects: Project[], companies: Company[]) => {
  const projectById = new Map(projects.map((p) => [p.id, p.name] as const));
  const companyById = new Map(companies.map((c) => [c.id, c.name] as const));
  return items.map((item) => ({
    ...item,
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
    linkedCompanyName: item.linkedCompanyName || companyById.get(item.linkedCompanyId || ''),
  }));
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

const attachFinancePeriodTitles = <T extends { financePeriodId?: string; financePeriodTitle?: string }>(
  items: T[], periods: FinancePeriod[],
): T[] => {
  const periodById = new Map(periods.map((p) => [p.id, p.title] as const));
  return items.map((item) => ({
    ...item,
    financePeriodTitle: item.financePeriodTitle || periodById.get(item.financePeriodId || '') || undefined,
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

const taskFromDb = (row: any): Task => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  description: row?.description ?? undefined,
  status: row?.status ?? 'todo',
  priority: row?.priority ?? 'medium',
  category: row?.category ?? undefined,
  taskDate: row?.task_date ?? row?.taskDate ?? undefined,
  weekStart: row?.week_start ?? row?.weekStart ?? undefined,
  estimatedMinutes: row?.estimated_minutes != null ? Number(row.estimated_minutes) : (row?.estimatedMinutes != null ? Number(row.estimatedMinutes) : undefined),
  actualMinutes: row?.actual_minutes != null ? Number(row.actual_minutes) : (row?.actualMinutes != null ? Number(row.actualMinutes) : undefined),
  completedAt: row?.completed_at ?? row?.completedAt ?? undefined,
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  linkedPlanId: row?.linked_plan_id ?? row?.linkedPlanId ?? undefined,
  linkedStrategyGoalId: row?.linked_strategy_goal_id ?? row?.linkedStrategyGoalId ?? undefined,
  linkedCompanyId: row?.linked_company_id ?? row?.linkedCompanyId ?? undefined,
  linkedPersonId: row?.linked_person_id ?? row?.linkedPersonId ?? undefined,
  linkedDocumentId: row?.linked_document_id ?? row?.linkedDocumentId ?? undefined,
  isRecurringInstance: row?.is_recurring_instance ?? row?.isRecurringInstance ?? undefined,
  recurringRuleId: row?.recurring_rule_id ?? row?.recurringRuleId ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const taskToDb = (input: Partial<TaskInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.description !== undefined) payload.description = toNullableString(input.description);
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.category !== undefined) payload.category = toNullableString(input.category);
  if (input.taskDate !== undefined) payload.task_date = toNullableString(input.taskDate);
  if (input.weekStart !== undefined) payload.week_start = toNullableString(input.weekStart);
  if (input.estimatedMinutes !== undefined) payload.estimated_minutes = toNullableNumber(input.estimatedMinutes);
  if (input.actualMinutes !== undefined) payload.actual_minutes = toNullableNumber(input.actualMinutes);
  if (input.completedAt !== undefined) payload.completed_at = toNullableString(input.completedAt);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  if (input.linkedPlanId !== undefined) payload.linked_plan_id = toNullableString(input.linkedPlanId);
  if (input.linkedStrategyGoalId !== undefined) payload.linked_strategy_goal_id = toNullableString(input.linkedStrategyGoalId);
  if (input.linkedCompanyId !== undefined) payload.linked_company_id = toNullableString(input.linkedCompanyId);
  if (input.linkedPersonId !== undefined) payload.linked_person_id = toNullableString(input.linkedPersonId);
  if (input.linkedDocumentId !== undefined) payload.linked_document_id = toNullableString(input.linkedDocumentId);
  if (input.isRecurringInstance !== undefined) payload.is_recurring_instance = Boolean(input.isRecurringInstance);
  if (input.recurringRuleId !== undefined) payload.recurring_rule_id = toNullableString(input.recurringRuleId);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const recurringTaskFromDb = (row: any): RecurringTask => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  description: row?.description ?? undefined,
  frequency: row?.frequency ?? 'weekly',
  daysOfWeek: row?.days_of_week ?? row?.daysOfWeek ?? undefined,
  priority: row?.priority ?? 'medium',
  category: row?.category ?? undefined,
  estimatedMinutes: row?.estimated_minutes != null ? Number(row.estimated_minutes) : (row?.estimatedMinutes != null ? Number(row.estimatedMinutes) : undefined),
  startDate: row?.start_date ?? row?.startDate ?? undefined,
  endDate: row?.end_date ?? row?.endDate ?? undefined,
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  linkedPlanId: row?.linked_plan_id ?? row?.linkedPlanId ?? undefined,
  linkedStrategyGoalId: row?.linked_strategy_goal_id ?? row?.linkedStrategyGoalId ?? undefined,
  linkedCompanyId: row?.linked_company_id ?? row?.linkedCompanyId ?? undefined,
  linkedPersonId: row?.linked_person_id ?? row?.linkedPersonId ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const recurringTaskToDb = (input: Partial<RecurringTaskInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.description !== undefined) payload.description = toNullableString(input.description);
  if (input.frequency !== undefined) payload.frequency = input.frequency;
  if (input.daysOfWeek !== undefined) payload.days_of_week = toNullableString(input.daysOfWeek);
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.category !== undefined) payload.category = toNullableString(input.category);
  if (input.estimatedMinutes !== undefined) payload.estimated_minutes = toNullableNumber(input.estimatedMinutes);
  if (input.startDate !== undefined) payload.start_date = toNullableString(input.startDate);
  if (input.endDate !== undefined) payload.end_date = toNullableString(input.endDate);
  if (input.isActive !== undefined) payload.is_active = Boolean(input.isActive);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  if (input.linkedPlanId !== undefined) payload.linked_plan_id = toNullableString(input.linkedPlanId);
  if (input.linkedStrategyGoalId !== undefined) payload.linked_strategy_goal_id = toNullableString(input.linkedStrategyGoalId);
  if (input.linkedCompanyId !== undefined) payload.linked_company_id = toNullableString(input.linkedCompanyId);
  if (input.linkedPersonId !== undefined) payload.linked_person_id = toNullableString(input.linkedPersonId);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const attachTaskLinkNames = (
  items: Task[],
  projects: Project[],
  plans: Plan[],
  strategyGoals: StrategyGoal[],
  companies: Company[],
  people: Person[],
  generatedDocuments: GeneratedDocument[],
) => {
  const projectById = new Map(projects.map((p) => [p.id, p.name] as const));
  const planById = new Map(plans.map((p) => [p.id, p.title] as const));
  const goalById = new Map(strategyGoals.map((g) => [g.id, g.title] as const));
  const companyById = new Map(companies.map((c) => [c.id, c.name] as const));
  const personById = new Map(people.map((p) => [p.id, p.fullName] as const));
  const docById = new Map(generatedDocuments.map((d) => [d.id, d.title] as const));
  return items.map((item) => ({
    ...item,
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
    linkedPlanTitle: item.linkedPlanTitle || planById.get(item.linkedPlanId || ''),
    linkedStrategyGoalTitle: item.linkedStrategyGoalTitle || goalById.get(item.linkedStrategyGoalId || ''),
    linkedCompanyName: item.linkedCompanyName || companyById.get(item.linkedCompanyId || ''),
    linkedPersonName: item.linkedPersonName || personById.get(item.linkedPersonId || ''),
    linkedDocumentTitle: item.linkedDocumentTitle || docById.get(item.linkedDocumentId || ''),
  }));
};

const recurringTaskLogFromDb = (row: any): RecurringTaskLog => ({
  id: String(row?.id ?? ''),
  recurringTaskId: row?.recurring_task_id ?? row?.recurringTaskId ?? '',
  logDate: row?.log_date ?? row?.logDate ?? '',
  status: row?.status ?? 'done',
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
});

const recurringTaskLogToDb = (input: Partial<RecurringTaskLogInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.recurringTaskId !== undefined) payload.recurring_task_id = input.recurringTaskId;
  if (input.logDate !== undefined) payload.log_date = input.logDate;
  if (input.status !== undefined) payload.status = input.status;
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const taskWorkLogFromDb = (row: any): TaskWorkLog => ({
  id: String(row?.id ?? ''),
  taskId: row?.task_id ?? row?.taskId ?? '',
  workDate: row?.work_date ?? row?.workDate ?? '',
  minutesSpent: Number(row?.minutes_spent ?? row?.minutesSpent ?? 0),
  summary: row?.summary ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const taskWorkLogToDb = (input: Partial<TaskWorkLogInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.taskId !== undefined) payload.task_id = input.taskId;
  if (input.workDate !== undefined) payload.work_date = input.workDate;
  if (input.minutesSpent !== undefined) payload.minutes_spent = Number(input.minutesSpent);
  if (input.summary !== undefined) payload.summary = toNullableString(input.summary);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const weeklyTaskReviewFromDb = (row: any): WeeklyTaskReview => ({
  id: String(row?.id ?? ''),
  weekStart: row?.week_start ?? row?.weekStart ?? '',
  summary: row?.summary ?? undefined,
  whatWorked: row?.what_worked ?? row?.whatWorked ?? undefined,
  whatFailed: row?.what_failed ?? row?.whatFailed ?? undefined,
  blockers: row?.blockers ?? undefined,
  lessons: row?.lessons ?? undefined,
  nextWeekFocus: row?.next_week_focus ?? row?.nextWeekFocus ?? undefined,
  score: row?.score != null ? Number(row.score) : undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const weeklyTaskReviewToDb = (input: Partial<WeeklyTaskReviewInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.weekStart !== undefined) payload.week_start = input.weekStart;
  if (input.summary !== undefined) payload.summary = toNullableString(input.summary);
  if (input.whatWorked !== undefined) payload.what_worked = toNullableString(input.whatWorked);
  if (input.whatFailed !== undefined) payload.what_failed = toNullableString(input.whatFailed);
  if (input.blockers !== undefined) payload.blockers = toNullableString(input.blockers);
  if (input.lessons !== undefined) payload.lessons = toNullableString(input.lessons);
  if (input.nextWeekFocus !== undefined) payload.next_week_focus = toNullableString(input.nextWeekFocus);
  if (input.score !== undefined) payload.score = Math.min(10, Math.max(0, Number(input.score)));
  return payload;
};

const lifeNutritionLogFromDb = (row: any): LifeNutritionLog => ({
  id: String(row?.id ?? ''),
  logDate: row?.log_date ?? row?.logDate ?? '',
  mealType: row?.meal_type ?? row?.mealType ?? 'meal',
  foodDescription: row?.food_description ?? row?.foodDescription ?? undefined,
  qualityRating: row?.quality_rating ?? row?.qualityRating ?? undefined,
  energyLevel: row?.energy_level ?? row?.energyLevel ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const lifeNutritionLogToDb = (input: Partial<LifeNutritionLogInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.logDate !== undefined) payload.log_date = input.logDate;
  if (input.mealType !== undefined) payload.meal_type = input.mealType;
  if (input.foodDescription !== undefined) payload.food_description = toNullableString(input.foodDescription);
  if (input.qualityRating !== undefined) payload.quality_rating = input.qualityRating;
  if (input.energyLevel !== undefined) payload.energy_level = input.energyLevel;
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const lifeFitnessLogFromDb = (row: any): LifeFitnessLog => ({
  id: String(row?.id ?? ''),
  workoutDate: row?.workout_date ?? row?.workoutDate ?? '',
  workoutType: row?.workout_type ?? row?.workoutType ?? 'general',
  durationMinutes: row?.duration_minutes ?? row?.durationMinutes ?? undefined,
  intensity: row?.intensity ?? undefined,
  exercises: row?.exercises ?? undefined,
  bodyNotes: row?.body_notes ?? row?.bodyNotes ?? undefined,
  recoveryNotes: row?.recovery_notes ?? row?.recoveryNotes ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const lifeFitnessLogToDb = (input: Partial<LifeFitnessLogInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.workoutDate !== undefined) payload.workout_date = input.workoutDate;
  if (input.workoutType !== undefined) payload.workout_type = input.workoutType;
  if (input.durationMinutes !== undefined) payload.duration_minutes = Number(input.durationMinutes) || null;
  if (input.intensity !== undefined) payload.intensity = input.intensity;
  if (input.exercises !== undefined) payload.exercises = toNullableString(input.exercises);
  if (input.bodyNotes !== undefined) payload.body_notes = toNullableString(input.bodyNotes);
  if (input.recoveryNotes !== undefined) payload.recovery_notes = toNullableString(input.recoveryNotes);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const lifeDeenLogFromDb = (row: any): LifeDeenLog => ({
  id: String(row?.id ?? ''),
  logDate: row?.log_date ?? row?.logDate ?? '',
  fajr: row?.fajr ?? undefined,
  dhuhr: row?.dhuhr ?? undefined,
  asr: row?.asr ?? undefined,
  maghrib: row?.maghrib ?? undefined,
  isha: row?.isha ?? undefined,
  quranMinutes: row?.quran_minutes ?? row?.quranMinutes ?? undefined,
  dhikrDone: row?.dhikr_done ?? row?.dhikrDone ?? undefined,
  learningMinutes: row?.learning_minutes ?? row?.learningMinutes ?? undefined,
  charityNotes: row?.charity_notes ?? row?.charityNotes ?? undefined,
  reflection: row?.reflection ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const lifeDeenLogToDb = (input: Partial<LifeDeenLogInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.logDate !== undefined) payload.log_date = input.logDate;
  if (input.fajr !== undefined) payload.fajr = input.fajr;
  if (input.dhuhr !== undefined) payload.dhuhr = input.dhuhr;
  if (input.asr !== undefined) payload.asr = input.asr;
  if (input.maghrib !== undefined) payload.maghrib = input.maghrib;
  if (input.isha !== undefined) payload.isha = input.isha;
  if (input.quranMinutes !== undefined) payload.quran_minutes = Number(input.quranMinutes) || null;
  if (input.dhikrDone !== undefined) payload.dhikr_done = Boolean(input.dhikrDone);
  if (input.learningMinutes !== undefined) payload.learning_minutes = Number(input.learningMinutes) || null;
  if (input.charityNotes !== undefined) payload.charity_notes = toNullableString(input.charityNotes);
  if (input.reflection !== undefined) payload.reflection = toNullableString(input.reflection);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const lifeFamilyActionFromDb = (row: any): LifeFamilyAction => ({
  id: String(row?.id ?? ''),
  actionDate: row?.action_date ?? row?.actionDate ?? '',
  title: String(row?.title ?? ''),
  type: row?.type ?? 'other',
  status: row?.status ?? 'planned',
  priority: row?.priority ?? 'medium',
  personName: row?.person_name ?? row?.personName ?? undefined,
  description: row?.description ?? undefined,
  outcome: row?.outcome ?? undefined,
  nextAction: row?.next_action ?? row?.nextAction ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const lifeFamilyActionToDb = (input: Partial<LifeFamilyActionInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.actionDate !== undefined) payload.action_date = input.actionDate;
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.type !== undefined) payload.type = input.type;
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.personName !== undefined) payload.person_name = toNullableString(input.personName);
  if (input.description !== undefined) payload.description = toNullableString(input.description);
  if (input.outcome !== undefined) payload.outcome = toNullableString(input.outcome);
  if (input.nextAction !== undefined) payload.next_action = toNullableString(input.nextAction);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const lifeWeeklyReviewFromDb = (row: any): LifeWeeklyReview => ({
  id: String(row?.id ?? ''),
  weekStart: row?.week_start ?? row?.weekStart ?? '',
  summary: row?.summary ?? undefined,
  healthReview: row?.health_review ?? row?.healthReview ?? undefined,
  nutritionReview: row?.nutrition_review ?? row?.nutritionReview ?? undefined,
  fitnessReview: row?.fitness_review ?? row?.fitnessReview ?? undefined,
  deenReview: row?.deen_review ?? row?.deenReview ?? undefined,
  familyReview: row?.family_review ?? row?.familyReview ?? undefined,
  whatWorked: row?.what_worked ?? row?.whatWorked ?? undefined,
  whatFailed: row?.what_failed ?? row?.whatFailed ?? undefined,
  neglectedArea: row?.neglected_area ?? row?.neglectedArea ?? undefined,
  nextWeekFocus: row?.next_week_focus ?? row?.nextWeekFocus ?? undefined,
  lifeScore: row?.life_score ?? row?.lifeScore ?? undefined,
  healthScore: row?.health_score ?? row?.healthScore ?? undefined,
  deenScore: row?.deen_score ?? row?.deenScore ?? undefined,
  familyScore: row?.family_score ?? row?.familyScore ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const lifeWeeklyReviewToDb = (input: Partial<LifeWeeklyReviewInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.weekStart !== undefined) payload.week_start = input.weekStart;
  if (input.summary !== undefined) payload.summary = toNullableString(input.summary);
  if (input.healthReview !== undefined) payload.health_review = toNullableString(input.healthReview);
  if (input.nutritionReview !== undefined) payload.nutrition_review = toNullableString(input.nutritionReview);
  if (input.fitnessReview !== undefined) payload.fitness_review = toNullableString(input.fitnessReview);
  if (input.deenReview !== undefined) payload.deen_review = toNullableString(input.deenReview);
  if (input.familyReview !== undefined) payload.family_review = toNullableString(input.familyReview);
  if (input.whatWorked !== undefined) payload.what_worked = toNullableString(input.whatWorked);
  if (input.whatFailed !== undefined) payload.what_failed = toNullableString(input.whatFailed);
  if (input.neglectedArea !== undefined) payload.neglected_area = toNullableString(input.neglectedArea);
  if (input.nextWeekFocus !== undefined) payload.next_week_focus = toNullableString(input.nextWeekFocus);
  if (input.lifeScore !== undefined) payload.life_score = Math.min(10, Math.max(0, Number(input.lifeScore)));
  if (input.healthScore !== undefined) payload.health_score = Math.min(10, Math.max(0, Number(input.healthScore)));
  if (input.deenScore !== undefined) payload.deen_score = Math.min(10, Math.max(0, Number(input.deenScore)));
  if (input.familyScore !== undefined) payload.family_score = Math.min(10, Math.max(0, Number(input.familyScore)));
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

// ── Company Contact Methods ──

const companyContactMethodFromDb = (row: any): CompanyContactMethod => ({
  id: String(row?.id ?? ''),
  companyId: row?.company_id ?? row?.companyId ?? undefined,
  type: row?.type ?? 'other',
  label: row?.label ?? undefined,
  value: row?.value ?? undefined,
  isPrimary: row?.is_primary == null ? false : Boolean(row.is_primary),
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

const companyContactMethodToDb = (input: Partial<CompanyContactMethodInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.companyId !== undefined) payload.company_id = String(input.companyId);
  if (input.type !== undefined) payload.type = String(input.type || 'other');
  if (input.label !== undefined) payload.label = toNullableString(input.label);
  if (input.value !== undefined) payload.value = toNullableString(input.value);
  if (input.isPrimary !== undefined) payload.is_primary = Boolean(input.isPrimary);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

// ── Company Problem Profiles ──

const companyProblemProfileFromDb = (row: any): CompanyProblemProfile => ({
  id: String(row?.id ?? ''),
  companyId: row?.company_id ?? row?.companyId ?? undefined,
  problemTitle: row?.problem_title ?? row?.problemTitle ?? undefined,
  problemDescription: row?.problem_description ?? row?.problemDescription ?? undefined,
  currentSituation: row?.current_situation ?? row?.currentSituation ?? undefined,
  businessImpact: row?.business_impact ?? row?.businessImpact ?? undefined,
  proposedSolution: row?.proposed_solution ?? row?.proposedSolution ?? undefined,
  serviceAngle: row?.service_angle ?? row?.serviceAngle ?? undefined,
  valueProposition: row?.value_proposition ?? row?.valueProposition ?? undefined,
  urgency: row?.urgency ?? 'medium',
  confidence: row?.confidence ?? 'medium',
  status: row?.status ?? 'draft',
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

const companyProblemProfileToDb = (input: Partial<CompanyProblemProfileInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.companyId !== undefined) payload.company_id = String(input.companyId);
  if (input.problemTitle !== undefined) payload.problem_title = toNullableString(input.problemTitle);
  if (input.problemDescription !== undefined) payload.problem_description = toNullableString(input.problemDescription);
  if (input.currentSituation !== undefined) payload.current_situation = toNullableString(input.currentSituation);
  if (input.businessImpact !== undefined) payload.business_impact = toNullableString(input.businessImpact);
  if (input.proposedSolution !== undefined) payload.proposed_solution = toNullableString(input.proposedSolution);
  if (input.serviceAngle !== undefined) payload.service_angle = toNullableString(input.serviceAngle);
  if (input.valueProposition !== undefined) payload.value_proposition = toNullableString(input.valueProposition);
  if (input.urgency !== undefined) payload.urgency = String(input.urgency || 'medium');
  if (input.confidence !== undefined) payload.confidence = String(input.confidence || 'medium');
  if (input.status !== undefined) payload.status = String(input.status || 'draft');
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

// ── Company Outreach Scripts ──

const companyOutreachScriptFromDb = (row: any): CompanyOutreachScript => ({
  id: String(row?.id ?? ''),
  companyId: row?.company_id ?? row?.companyId ?? undefined,
  name: row?.name ?? 'Outreach Script',
  channel: row?.channel ?? 'email',
  language: row?.language ?? 'english',
  audience: row?.audience ?? undefined,
  goal: row?.goal ?? undefined,
  hook: row?.hook ?? undefined,
  messageBody: row?.message_body ?? row?.messageBody ?? undefined,
  callScript: row?.call_script ?? row?.callScript ?? undefined,
  objectionHandling: row?.objection_handling ?? row?.objectionHandling ?? undefined,
  followUpMessage: row?.follow_up_message ?? row?.followUpMessage ?? undefined,
  status: row?.status ?? 'draft',
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

const companyOutreachScriptToDb = (input: Partial<CompanyOutreachScriptInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.companyId !== undefined) payload.company_id = String(input.companyId);
  if (input.name !== undefined) payload.name = String(input.name || 'Outreach Script');
  if (input.channel !== undefined) payload.channel = String(input.channel || 'email');
  if (input.language !== undefined) payload.language = String(input.language || 'english');
  if (input.audience !== undefined) payload.audience = toNullableString(input.audience);
  if (input.goal !== undefined) payload.goal = toNullableString(input.goal);
  if (input.hook !== undefined) payload.hook = toNullableString(input.hook);
  if (input.messageBody !== undefined) payload.message_body = toNullableString(input.messageBody);
  if (input.callScript !== undefined) payload.call_script = toNullableString(input.callScript);
  if (input.objectionHandling !== undefined) payload.objection_handling = toNullableString(input.objectionHandling);
  if (input.followUpMessage !== undefined) payload.follow_up_message = toNullableString(input.followUpMessage);
  if (input.status !== undefined) payload.status = String(input.status || 'draft');
  if (input.isActive !== undefined) payload.is_active = Boolean(input.isActive);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

// ── Desktop ──

const desktopShortcutFromDb = (row: any): DesktopShortcut => ({
  id: String(row?.id ?? ''),
  kind: row?.kind ?? 'website',
  appId: row?.app_id ?? row?.appId ?? undefined,
  name: String(row?.name ?? ''),
  url: String(row?.url ?? ''),
  iconUrl: row?.icon_url ?? row?.iconUrl ?? undefined,
  faviconSource: row?.favicon_source ?? row?.faviconSource ?? undefined,
  groupId: row?.group_id ?? row?.groupId ?? undefined,
  sortOrder: row?.sort_order ?? row?.sortOrder ?? 0,
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const desktopShortcutToDb = (input: DesktopShortcutInput) => ({
  kind: input.kind,
  name: input.name,
  url: input.url,
  icon_url: toNullableString(input.iconUrl),
  favicon_source: toNullableString(input.faviconSource),
  notes: toNullableString(input.notes),
  group_id: input.groupId !== undefined ? toNullableString(input.groupId) : undefined,
  sort_order: input.sortOrder !== undefined ? Number(input.sortOrder) : undefined,
});

const desktopSettingsFromDb = (row: any): DesktopSettings => ({
  id: String(row?.id ?? ''),
  backgroundType: row?.background_type ?? row?.backgroundType ?? 'solid',
  backgroundValue: row?.background_value ?? row?.backgroundValue ?? undefined,
  backgroundImageUrl: row?.background_image_url ?? row?.backgroundImageUrl ?? undefined,
  iconSize: row?.icon_size ?? row?.iconSize ?? 'medium',
  layoutDensity: row?.layout_density ?? row?.layoutDensity ?? 'comfortable',
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const desktopSettingsToDb = (input: DesktopSettingsInput) => ({
  background_type: input.backgroundType,
  background_value: toNullableString(input.backgroundValue),
  background_image_url: toNullableString(input.backgroundImageUrl),
  icon_size: input.iconSize,
  layout_density: input.layoutDensity,
});

const desktopGroupFromDb = (row: any): DesktopGroup => ({
  id: String(row?.id ?? ''),
  name: String(row?.name ?? ''),
  color: row?.color ?? undefined,
  sortOrder: row?.sort_order ?? row?.sortOrder ?? 0,
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const desktopGroupToDb = (input: DesktopGroupInput) => ({
  name: input.name,
  color: toNullableString(input.color),
  sort_order: input.sortOrder,
  notes: toNullableString(input.notes),
});

const socialPlatformFromDb = (row: any): SocialPlatform => ({
  id: String(row?.id ?? ''),
  name: String(row?.name ?? ''),
  slug: String(row?.slug ?? ''),
  url: row?.url ?? undefined,
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const socialPlatformToDb = (input: Partial<SocialPlatformInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = String(input.name || '').trim();
  if (input.slug !== undefined) payload.slug = String(input.slug || '').trim();
  if (input.url !== undefined) payload.url = toNullableString(input.url);
  if (input.isActive !== undefined) payload.is_active = Boolean(input.isActive);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const socialPersonFromDb = (row: any): SocialPerson => ({
  id: String(row?.id ?? ''),
  name: String(row?.name ?? ''),
  linkedinUrl: row?.linkedin_url ?? row?.linkedinUrl ?? undefined,
  instagramUrl: row?.instagram_url ?? row?.instagramUrl ?? undefined,
  xUrl: row?.x_url ?? row?.xUrl ?? undefined,
  websiteUrl: row?.website_url ?? row?.websiteUrl ?? undefined,
  priority: row?.priority ?? 'medium',
  category: row?.category ?? undefined,
  reason: row?.reason ?? undefined,
  interactionGoal: row?.interaction_goal ?? row?.interactionGoal ?? undefined,
  lastInteractionAt: row?.last_interaction_at ?? row?.lastInteractionAt ?? undefined,
  nextInteractionAt: row?.next_interaction_at ?? row?.nextInteractionAt ?? undefined,
  status: row?.status ?? 'active',
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const socialPersonToDb = (input: Partial<SocialPersonInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = String(input.name || '').trim();
  if (input.linkedinUrl !== undefined) payload.linkedin_url = toNullableString(input.linkedinUrl);
  if (input.instagramUrl !== undefined) payload.instagram_url = toNullableString(input.instagramUrl);
  if (input.xUrl !== undefined) payload.x_url = toNullableString(input.xUrl);
  if (input.websiteUrl !== undefined) payload.website_url = toNullableString(input.websiteUrl);
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.category !== undefined) payload.category = toNullableString(input.category);
  if (input.reason !== undefined) payload.reason = toNullableString(input.reason);
  if (input.interactionGoal !== undefined) payload.interaction_goal = toNullableString(input.interactionGoal);
  if (input.lastInteractionAt !== undefined) payload.last_interaction_at = toNullableString(input.lastInteractionAt);
  if (input.nextInteractionAt !== undefined) payload.next_interaction_at = toNullableString(input.nextInteractionAt);
  if (input.status !== undefined) payload.status = input.status;
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const contentPillarFromDb = (row: any): ContentPillar => ({
  id: String(row?.id ?? ''),
  name: String(row?.name ?? ''),
  slug: String(row?.slug ?? ''),
  description: row?.description ?? undefined,
  targetAudience: row?.target_audience ?? row?.targetAudience ?? undefined,
  priority: row?.priority ?? 'medium',
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const contentPillarToDb = (input: Partial<ContentPillarInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = String(input.name || '').trim();
  if (input.slug !== undefined) payload.slug = String(input.slug || '').trim();
  if (input.description !== undefined) payload.description = toNullableString(input.description);
  if (input.targetAudience !== undefined) payload.target_audience = toNullableString(input.targetAudience);
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.isActive !== undefined) payload.is_active = Boolean(input.isActive);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const contentStrategyFromDb = (row: any): ContentStrategy => ({
  id: String(row?.id ?? ''),
  name: String(row?.name ?? ''),
  targetAudience: row?.target_audience ?? row?.targetAudience ?? undefined,
  positioning: row?.positioning ?? undefined,
  mainPromise: row?.main_promise ?? row?.mainPromise ?? undefined,
  tone: row?.tone ?? undefined,
  languages: row?.languages ?? undefined,
  weeklyPostTarget: row?.weekly_post_target != null ? Number(row.weekly_post_target) : (row?.weeklyPostTarget != null ? Number(row.weeklyPostTarget) : undefined),
  weeklyVideoTarget: row?.weekly_video_target != null ? Number(row.weekly_video_target) : (row?.weeklyVideoTarget != null ? Number(row.weeklyVideoTarget) : undefined),
  activePlatforms: row?.active_platforms ?? row?.activePlatforms ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const contentStrategyToDb = (input: Partial<ContentStrategyInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = String(input.name || '').trim();
  if (input.targetAudience !== undefined) payload.target_audience = toNullableString(input.targetAudience);
  if (input.positioning !== undefined) payload.positioning = toNullableString(input.positioning);
  if (input.mainPromise !== undefined) payload.main_promise = toNullableString(input.mainPromise);
  if (input.tone !== undefined) payload.tone = toNullableString(input.tone);
  if (input.languages !== undefined) payload.languages = toNullableString(input.languages);
  if (input.weeklyPostTarget !== undefined) payload.weekly_post_target = toNullableNumber(input.weeklyPostTarget);
  if (input.weeklyVideoTarget !== undefined) payload.weekly_video_target = toNullableNumber(input.weeklyVideoTarget);
  if (input.activePlatforms !== undefined) payload.active_platforms = toNullableString(input.activePlatforms);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const contentItemFromDb = (row: any): ContentItem => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  type: row?.type ?? 'text_post',
  status: row?.status ?? 'idea',
  priority: row?.priority ?? 'medium',
  platformId: row?.platform_id ?? row?.platformId ?? undefined,
  pillarId: row?.pillar_id ?? row?.pillarId ?? undefined,
  hook: row?.hook ?? undefined,
  content: row?.content ?? undefined,
  caption: row?.caption ?? undefined,
  assetUrl: row?.asset_url ?? row?.assetUrl ?? undefined,
  publishDate: row?.publish_date ?? row?.publishDate ?? undefined,
  weekStart: row?.week_start ?? row?.weekStart ?? undefined,
  performanceViews: row?.performance_views != null ? Number(row.performance_views) : (row?.performanceViews != null ? Number(row.performanceViews) : undefined),
  performanceLikes: row?.performance_likes != null ? Number(row.performance_likes) : (row?.performanceLikes != null ? Number(row.performanceLikes) : undefined),
  performanceComments: row?.performance_comments != null ? Number(row.performance_comments) : (row?.performanceComments != null ? Number(row.performanceComments) : undefined),
  performanceShares: row?.performance_shares != null ? Number(row.performance_shares) : (row?.performanceShares != null ? Number(row.performanceShares) : undefined),
  performanceSaves: row?.performance_saves != null ? Number(row.performance_saves) : (row?.performanceSaves != null ? Number(row.performanceSaves) : undefined),
  performanceClicks: row?.performance_clicks != null ? Number(row.performance_clicks) : (row?.performanceClicks != null ? Number(row.performanceClicks) : undefined),
  leadsGenerated: row?.leads_generated != null ? Number(row.leads_generated) : (row?.leadsGenerated != null ? Number(row.leadsGenerated) : undefined),
  linkedProjectId: row?.linked_project_id ?? row?.linkedProjectId ?? undefined,
  linkedNoteId: row?.linked_note_id ?? row?.linkedNoteId ?? undefined,
  linkedCompanyId: row?.linked_company_id ?? row?.linkedCompanyId ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const contentItemToDb = (input: Partial<ContentItemInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.type !== undefined) payload.type = input.type;
  if (input.status !== undefined) payload.status = input.status;
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.platformId !== undefined) payload.platform_id = toNullableString(input.platformId);
  if (input.pillarId !== undefined) payload.pillar_id = toNullableString(input.pillarId);
  if (input.hook !== undefined) payload.hook = toNullableString(input.hook);
  if (input.content !== undefined) payload.content = toNullableString(input.content);
  if (input.caption !== undefined) payload.caption = toNullableString(input.caption);
  if (input.assetUrl !== undefined) payload.asset_url = toNullableString(input.assetUrl);
  if (input.publishDate !== undefined) payload.publish_date = toNullableString(input.publishDate);
  if (input.weekStart !== undefined) payload.week_start = toNullableString(input.weekStart);
  if (input.performanceViews !== undefined) payload.performance_views = toNullableNumber(input.performanceViews);
  if (input.performanceLikes !== undefined) payload.performance_likes = toNullableNumber(input.performanceLikes);
  if (input.performanceComments !== undefined) payload.performance_comments = toNullableNumber(input.performanceComments);
  if (input.performanceShares !== undefined) payload.performance_shares = toNullableNumber(input.performanceShares);
  if (input.performanceSaves !== undefined) payload.performance_saves = toNullableNumber(input.performanceSaves);
  if (input.performanceClicks !== undefined) payload.performance_clicks = toNullableNumber(input.performanceClicks);
  if (input.leadsGenerated !== undefined) payload.leads_generated = toNullableNumber(input.leadsGenerated);
  if (input.linkedProjectId !== undefined) payload.linked_project_id = toNullableString(input.linkedProjectId);
  if (input.linkedNoteId !== undefined) payload.linked_note_id = toNullableString(input.linkedNoteId);
  if (input.linkedCompanyId !== undefined) payload.linked_company_id = toNullableString(input.linkedCompanyId);
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  return payload;
};

const weeklyContentPlanFromDb = (row: any): WeeklyContentPlan => ({
  id: String(row?.id ?? ''),
  weekStart: row?.week_start ?? row?.weekStart ?? '',
  focus: row?.focus ?? undefined,
  targetPosts: row?.target_posts != null ? Number(row.target_posts) : (row?.targetPosts != null ? Number(row.targetPosts) : undefined),
  targetVideos: row?.target_videos != null ? Number(row.target_videos) : (row?.targetVideos != null ? Number(row.targetVideos) : undefined),
  targetCarousels: row?.target_carousels != null ? Number(row.target_carousels) : (row?.targetCarousels != null ? Number(row.targetCarousels) : undefined),
  targetOther: row?.target_other != null ? Number(row.target_other) : (row?.targetOther != null ? Number(row.targetOther) : undefined),
  reviewNotes: row?.review_notes ?? row?.reviewNotes ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const weeklyContentPlanToDb = (input: Partial<WeeklyContentPlanInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.weekStart !== undefined) payload.week_start = input.weekStart;
  if (input.focus !== undefined) payload.focus = toNullableString(input.focus);
  if (input.targetPosts !== undefined) payload.target_posts = toNullableNumber(input.targetPosts);
  if (input.targetVideos !== undefined) payload.target_videos = toNullableNumber(input.targetVideos);
  if (input.targetCarousels !== undefined) payload.target_carousels = toNullableNumber(input.targetCarousels);
  if (input.targetOther !== undefined) payload.target_other = toNullableNumber(input.targetOther);
  if (input.reviewNotes !== undefined) payload.review_notes = toNullableString(input.reviewNotes);
  return payload;
};

const normalizeWeeklyTask = (t: any): SocialWeeklyTask => ({
  id: String(t?.id ?? ''),
  title: t?.title ?? t?.label ?? '',
  label: t?.label ?? undefined,
  type: t?.type ?? 'task',
  targetCount: t?.targetCount ?? t?.target_count ?? undefined,
  notes: t?.notes ?? undefined,
  done: t?.done == null ? false : Boolean(t.done),
  priority: t?.priority ?? undefined,
  isActive: t?.isActive ?? t?.is_active ?? true,
});

const socialWeeklySystemFromDb = (row: any): SocialWeeklySystem => ({
  id: String(row?.id ?? ''),
  name: row?.name ?? undefined,
  targets: row?.targets ?? { posts: 0, videos: 0, carousels: 0, reels: 0, stories: 0, other: 0 },
  fridayChecklist: row?.friday_checklist ?? row?.fridayChecklist ?? [],
  weeklyTasks: (row?.weekly_tasks ?? row?.weeklyTasks ?? []).map(normalizeWeeklyTask),
  contentTypePlan: row?.content_type_plan ?? row?.contentTypePlan ?? [],
  notes: row?.notes ?? undefined,
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const socialWeeklySystemToDb = (input: Partial<SocialWeeklySystemInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.name !== undefined) payload.name = String(input.name || 'Weekly Social Media System');
  if (input.targets !== undefined) payload.targets = input.targets;
  if (input.fridayChecklist !== undefined) payload.friday_checklist = input.fridayChecklist;
  if (input.weeklyTasks !== undefined) payload.weekly_tasks = input.weeklyTasks;
  if (input.contentTypePlan !== undefined) payload.content_type_plan = input.contentTypePlan;
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  if (input.isActive !== undefined) payload.is_active = Boolean(input.isActive);
  return payload;
};

const socialWeeklyTaskFromDb = (row: any): SocialWeeklyTask => ({
  id: String(row?.id ?? ''),
  title: String(row?.title ?? ''),
  type: row?.type ?? 'task',
  targetCount: row?.target_count ?? row?.targetCount ?? undefined,
  notes: row?.notes ?? undefined,
  done: row?.done == null ? false : Boolean(row.done),
  priority: row?.priority ?? 'medium',
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  sortOrder: row?.sort_order ?? row?.sortOrder ?? undefined,
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const socialWeeklyTaskToDb = (input: Partial<SocialWeeklyTaskInput>) => {
  const payload: Record<string, unknown> = {};
  if (input.title !== undefined) payload.title = String(input.title || '').trim();
  if (input.type !== undefined) payload.type = input.type;
  if (input.targetCount !== undefined) payload.target_count = input.targetCount != null ? Number(input.targetCount) : null;
  if (input.notes !== undefined) payload.notes = toNullableString(input.notes);
  if (input.done !== undefined) payload.done = Boolean(input.done);
  if (input.priority !== undefined) payload.priority = input.priority;
  if (input.isActive !== undefined) payload.is_active = Boolean(input.isActive);
  return payload;
};

const attachContentItemLinkNames = (
  items: ContentItem[],
  socialPlatforms: SocialPlatform[],
  contentPillars: ContentPillar[],
  projects: Project[],
  smartNotes: SmartNote[],
  companies: Company[],
) => {
  const platformById = new Map(socialPlatforms.map((p) => [p.id, p.name] as const));
  const pillarById = new Map(contentPillars.map((p) => [p.id, p.name] as const));
  const projectById = new Map(projects.map((p) => [p.id, p.name] as const));
  const noteById = new Map(smartNotes.map((n) => [n.id, n.title] as const));
  const companyById = new Map(companies.map((c) => [c.id, c.name] as const));
  return items.map((item) => ({
    ...item,
    platformName: item.platformName || platformById.get(item.platformId || ''),
    pillarName: item.pillarName || pillarById.get(item.pillarId || ''),
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
    linkedNoteTitle: item.linkedNoteTitle || noteById.get(item.linkedNoteId || ''),
    linkedCompanyName: item.linkedCompanyName || companyById.get(item.linkedCompanyId || ''),
  }));
};

const attachRecurringTaskLinkNames = (
  items: RecurringTask[],
  projects: Project[],
  plans: Plan[],
  strategyGoals: StrategyGoal[],
  companies: Company[],
  people: Person[],
) => {
  const projectById = new Map(projects.map((p) => [p.id, p.name] as const));
  const planById = new Map(plans.map((p) => [p.id, p.title] as const));
  const goalById = new Map(strategyGoals.map((g) => [g.id, g.title] as const));
  const companyById = new Map(companies.map((c) => [c.id, c.name] as const));
  const personById = new Map(people.map((p) => [p.id, p.fullName] as const));
  return items.map((item) => ({
    ...item,
    linkedProjectName: item.linkedProjectName || projectById.get(item.linkedProjectId || ''),
    linkedPlanTitle: item.linkedPlanTitle || planById.get(item.linkedPlanId || ''),
    linkedStrategyGoalTitle: item.linkedStrategyGoalTitle || goalById.get(item.linkedStrategyGoalId || ''),
    linkedCompanyName: item.linkedCompanyName || companyById.get(item.linkedCompanyId || ''),
    linkedPersonName: item.linkedPersonName || personById.get(item.linkedPersonId || ''),
  }));
};

const attachRelationshipLinkNames = (
  items: Relationship[],
  people: Person[],
) => {
  const personById = new Map(people.map((person) => [person.id, person.fullName] as const));
  return items.map((item) => ({
    ...item,
    personName: item.personName || (item.personId ? personById.get(item.personId) : undefined),
  }));
};

const attachRelationshipCategoryNames = (
  items: Relationship[],
  categories: RelationshipCategory[],
) => {
  const categoryById = new Map(categories.map((cat) => [cat.id, cat] as const));
  const categoryBySlug = new Map(categories.map((cat) => [cat.slug, cat] as const));
  return items.map((item) => {
    const cat = item.categoryId ? categoryById.get(item.categoryId) : undefined;
    const fallbackCat = !cat && item.domain ? categoryBySlug.get(item.domain) : undefined;
    const resolved = cat || fallbackCat;
    return {
      ...item,
      categoryName: item.categoryName || resolved?.name,
      categorySlug: item.categorySlug || resolved?.slug,
      categoryColor: item.categoryColor || resolved?.color,
    };
  });
};

const attachRelationshipOpportunityLinkNames = (
  items: RelationshipOpportunity[],
  projects: Project[],
  companies: Company[],
) => {
  const projectById = new Map(projects.map((project) => [project.id, project.name] as const));
  const companyById = new Map(companies.map((company) => [company.id, company.name] as const));
  return items.map((item) => ({
    ...item,
    linkedProjectName: item.linkedProjectName || (item.linkedProjectId ? projectById.get(item.linkedProjectId) : undefined),
    linkedCompanyName: item.linkedCompanyName || (item.linkedCompanyId ? companyById.get(item.linkedCompanyId) : undefined),
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

const requestAIProviderKeys = async (init: RequestInit): Promise<any> => {
  const response = await fetch('/api/ai?action=provider-key', {
    ...init,
    credentials: 'same-origin',
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });

  const result = await response.json().catch(() => ({}));

  if (!response.ok) {
    const error = new Error(result?.error || 'Failed to save AI provider key.') as ApiError;
    error.status = response.status;
    throw error;
  }

  return result;
};

export const useOpportunitiesData = (enabled = true) => {
  const [companies, setCompanies] = useState<Company[]>(() => cloneSeedData().companies);
  const [people, setPeople] = useState<Person[]>(() => cloneSeedData().people);
  const [messages, setMessages] = useState<OutreachMessage[]>(() => cloneSeedData().messages);
  const [deals, setDeals] = useState<Deal[]>(() => cloneSeedData().deals);
  const [relationships, setRelationships] = useState<Relationship[]>(() => cloneSeedData().relationships);
  const [relationshipInteractions, setRelationshipInteractions] = useState<RelationshipInteraction[]>(() => cloneSeedData().relationshipInteractions);
  const [relationshipOpportunities, setRelationshipOpportunities] = useState<RelationshipOpportunity[]>(() => cloneSeedData().relationshipOpportunities);
  const [relationshipCategories, setRelationshipCategories] = useState<RelationshipCategory[]>(() => cloneSeedData().relationshipCategories);
  const [relationshipContactMethods, setRelationshipContactMethods] = useState<RelationshipContactMethod[]>(() => cloneSeedData().relationshipContactMethods);
  const [noteCategories, setNoteCategories] = useState<NoteCategory[]>(() => cloneSeedData().noteCategories);
  const [smartNotes, setSmartNotes] = useState<SmartNote[]>(() => cloneSeedData().smartNotes);
  const [noteAttachments, setNoteAttachments] = useState<NoteAttachment[]>(() => cloneSeedData().noteAttachments);
  const [noteBlocks, setNoteBlocks] = useState<NoteBlock[]>(() => cloneSeedData().noteBlocks);
  const [projects, setProjects] = useState<Project[]>(() => cloneSeedData().projects);
  const [projectTasks, setProjectTasks] = useState<ProjectTask[]>([]);
  const [projectTimeLogs, setProjectTimeLogs] = useState<ProjectTimeLog[]>([]);
  const [projectMeetings, setProjectMeetings] = useState<ProjectMeeting[]>([]);
  const [projectDocuments, setProjectDocuments] = useState<ProjectDocument[]>([]);
  const [projectFinanceItems, setProjectFinanceItems] = useState<ProjectFinanceItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [documentTemplates, setDocumentTemplates] = useState<DocumentTemplate[]>([]);
  const [documentBrandSettings, setDocumentBrandSettings] = useState<DocumentBrandSettings[]>([]);
  const [aiProviderKeys, setAIProviderKeys] = useState<AIProviderKey[]>([]);
  const [aiUseCaseSettings, setAIUseCaseSettings] = useState<AIUseCaseSetting[]>([]);
  const [generatedDocuments, setGeneratedDocuments] = useState<GeneratedDocument[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
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
  const [financePeriods, setFinancePeriods] = useState<FinancePeriod[]>([]);
  const [financeRecurringRules, setFinanceRecurringRules] = useState<FinanceRecurringRule[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [recurringTasks, setRecurringTasks] = useState<RecurringTask[]>([]);
  const [recurringTaskLogs, setRecurringTaskLogs] = useState<RecurringTaskLog[]>([]);
  const [taskWorkLogs, setTaskWorkLogs] = useState<TaskWorkLog[]>([]);
  const [weeklyTaskReviews, setWeeklyTaskReviews] = useState<WeeklyTaskReview[]>([]);
  const [strategyNotes] = useState(() => cloneSeedData().strategyNotes);
  const [socialPlatforms, setSocialPlatforms] = useState<SocialPlatform[]>([]);
  const [socialPeople, setSocialPeople] = useState<SocialPerson[]>([]);
  const [contentPillars, setContentPillars] = useState<ContentPillar[]>([]);
  const [contentStrategies, setContentStrategies] = useState<ContentStrategy[]>([]);
  const [contentItems, setContentItems] = useState<ContentItem[]>([]);
  const [weeklyContentPlans, setWeeklyContentPlans] = useState<WeeklyContentPlan[]>([]);
  const [socialWeeklySystems, setSocialWeeklySystems] = useState<SocialWeeklySystem[]>([]);
  const [socialWeeklyTasks, setSocialWeeklyTasks] = useState<SocialWeeklyTask[]>([]);
  const [lifeNutritionLogs, setLifeNutritionLogs] = useState<LifeNutritionLog[]>([]);
  const [lifeFitnessLogs, setLifeFitnessLogs] = useState<LifeFitnessLog[]>([]);
  const [lifeDeenLogs, setLifeDeenLogs] = useState<LifeDeenLog[]>([]);
  const [lifeFamilyActions, setLifeFamilyActions] = useState<LifeFamilyAction[]>([]);
  const [lifeWeeklyReviews, setLifeWeeklyReviews] = useState<LifeWeeklyReview[]>([]);
  const [companyContactMethods, setCompanyContactMethods] = useState<CompanyContactMethod[]>([]);
  const [personContactMethods, setPersonContactMethods] = useState<PersonContactMethod[]>([]);
  const [companyProblemProfiles, setCompanyProblemProfiles] = useState<CompanyProblemProfile[]>([]);
  const [companyOutreachScripts, setCompanyOutreachScripts] = useState<CompanyOutreachScript[]>([]);
  const [desktopShortcuts, setDesktopShortcuts] = useState<DesktopShortcut[]>([]);
  const [desktopSettings, setDesktopSettings] = useState<DesktopSettings | null>(null);
  const [desktopGroups, setDesktopGroups] = useState<DesktopGroup[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [loadedScopes, setLoadedScopes] = useState<Record<string, boolean>>({});

  const applyPayload = useCallback((payload: any) => {
    if (!payload) return;

    // Helper: only extract if key is present in payload
    const raw = (key: string) =>
      key in payload && Array.isArray(payload[key]) ? payload[key] : null;

    const has = (key: string) => key in payload;
    const companiesRaw = raw('companies');
    const peopleRaw = raw('people');
    const messagesRaw = raw('messages');
    const dealsRaw = raw('deals');
    const projectsRaw = raw('projects');
    const relationshipsRaw = raw('relationships');
    const relationshipInteractionsRaw = raw('relationship_interactions');
    const relationshipOpportunitiesRaw = raw('relationship_opportunities');
    const relationshipCategoriesRaw = raw('relationship_categories');
    const relationshipContactMethodsRaw = raw('relationship_contact_methods');
    const noteCategoriesRaw = raw('note_categories');
    const smartNotesRaw = raw('smart_notes');
    const noteAttachmentsRaw = raw('note_attachments');
    const noteBlocksRaw = raw('note_blocks');

    // Compute derived collections only when core data is present
    let derived: { people: Person[]; messages: OutreachMessage[]; deals: Deal[] } | null = null;
    let companyById: Map<string, Company> = new Map();
    let personById = new Map<string, Person>();
    let nextCompanies: Company[] = [];

    if (companiesRaw) {
      nextCompanies = companiesRaw.map(mapCompanyRow);
      companyById = new Map(nextCompanies.map((c) => [c.id, c] as const));

      if (peopleRaw) {
        const nextPeople = peopleRaw.map((row: any) => {
          const mapped = mapPersonRow(row, undefined);
          mapped.companyName = mapped.companyName || companyById.get(mapped.companyId || '')?.name;
          personById.set(mapped.id, mapped);
          return mapped;
        });

        const nextMessages = messagesRaw
          ? messagesRaw.map((row: any) => {
              const mapped = mapMessageRow(row);
              mapped.companyName = mapped.companyName || companyById.get(mapped.companyId || '')?.name;
              mapped.personName = mapped.personName || personById.get(mapped.personId || '')?.fullName;
              return mapped;
            })
          : [];

        const nextDeals = dealsRaw
          ? dealsRaw.map((row: any) => {
              const mapped = mapDealRow(row);
              mapped.companyName = mapped.companyName || companyById.get(mapped.companyId || '')?.name;
              mapped.personName = mapped.personName || personById.get(mapped.personId || '')?.fullName;
              return mapped;
            })
          : [];

        derived = getDerivedCollections(nextCompanies, nextPeople, nextMessages, nextDeals);

        // Only set derived state when core is complete
        setPeople(derived.people);
        setMessages(derived.messages);
        setDeals(derived.deals);
      }

      setCompanies(nextCompanies);
    }

    // ── Projects ──
    if (projectsRaw) {
      const nextProjects = projectsRaw.map((row: any) => {
        const mapped = mapProjectRow(row);
        mapped.relatedCompanyName = mapped.relatedCompanyName || companyById.get(mapped.relatedCompanyId || '')?.name;
        mapped.relatedPersonName = mapped.relatedPersonName || personById.get(mapped.relatedPersonId || '')?.fullName;
        return mapped;
      });
      setProjects(nextProjects);
    }

    // ── Project extensions ──
    if (has('project_tasks')) setProjectTasks((raw('project_tasks') || []).map((row: any) => mapProjectTaskRow(row)));
    if (has('project_time_logs')) setProjectTimeLogs((raw('project_time_logs') || []).map((row: any) => mapProjectTimeLogRow(row)));
    if (has('project_meetings')) setProjectMeetings((raw('project_meetings') || []).map((row: any) => mapProjectMeetingRow(row)));
    if (has('project_documents')) setProjectDocuments((raw('project_documents') || []).map((row: any) => mapProjectDocumentRow(row)));
    if (has('project_finance_items')) setProjectFinanceItems((raw('project_finance_items') || []).map((row: any) => mapProjectFinanceItemRow(row)));

    // ── Relationships ──
    if (has('relationships')) setRelationships((relationshipsRaw || []).map((row: any) => mapRelationshipRow(row)));
    if (has('relationship_interactions')) setRelationshipInteractions((relationshipInteractionsRaw || []).map((row: any) => mapRelationshipInteractionRow(row)));
    if (has('relationship_opportunities')) setRelationshipOpportunities((relationshipOpportunitiesRaw || []).map((row: any) => mapRelationshipOpportunityRow(row)));
    if (has('relationship_categories')) setRelationshipCategories((relationshipCategoriesRaw || []).map((row: any) => mapRelationshipCategoryRow(row)));
    if (has('relationship_contact_methods')) setRelationshipContactMethods((relationshipContactMethodsRaw || []).map((row: any) => mapRelationshipContactMethodRow(row)));

    // ── Notes ──
    if (has('note_categories')) setNoteCategories((noteCategoriesRaw || []).map((row: any) => mapNoteCategoryRow(row)));
    if (has('smart_notes')) setSmartNotes((smartNotesRaw || []).map((row: any) => mapSmartNoteRow(row)));
    if (has('note_attachments')) setNoteAttachments((noteAttachmentsRaw || []).map((row: any) => mapNoteAttachmentRow(row)));
    if (has('note_blocks')) setNoteBlocks((noteBlocksRaw || []).map((row: any) => mapNoteBlockRow(row)));

    // ── Documents ──
    if (has('documents')) {
      const projects = projectsRaw ? projectsRaw.map(mapProjectRow) : [];
      setDocuments(attachDocumentLinkNames(
        (raw('documents') || []).map((row: any) => mapDocumentRow(row)),
        projects, nextCompanies, derived?.people || [], derived?.deals || [],
      ));
    }
    if (has('document_templates')) setDocumentTemplates((raw('document_templates') || []).map((row: any) => mapDocumentTemplateRow(row)));
    if (has('document_brand_settings')) setDocumentBrandSettings((raw('document_brand_settings') || []).map((row: any) => mapDocumentBrandSettingsRow(row)));
    if (has('generated_documents')) {
      const projects = projectsRaw ? projectsRaw.map(mapProjectRow) : [];
      setGeneratedDocuments(attachGeneratedDocumentLinkNames(
        (raw('generated_documents') || []).map((row: any) => mapGeneratedDocumentRow(row)),
        (raw('document_templates') || []).map((row: any) => mapDocumentTemplateRow(row)),
        projects, nextCompanies, derived?.people || [], derived?.deals || [],
      ));
    }

    // ── Invoices ──
    if (has('invoices')) {
      const projects = projectsRaw ? projectsRaw.map(mapProjectRow) : [];
      setInvoices(attachInvoiceLinkNames(
        (raw('invoices') || []).map((row: any) => mapInvoiceRow(row)),
        projects, nextCompanies, derived?.people || [], derived?.deals || [],
      ));
    }
    if (has('invoice_items')) setInvoiceItems((raw('invoice_items') || []).map((row: any) => mapInvoiceItemRow(row)));

    // ── Templates ──
    if (has('message_templates')) setTemplates((raw('message_templates') || []).map((row: any) => mapTemplateRow(row)));

    // ── AI ──
    if (has('ai_provider_keys')) {
      const nextAIProviderKeys = (raw('ai_provider_keys') || []).map((row: any) => mapAIProviderKeyRow(row));
      setAIProviderKeys(nextAIProviderKeys);
      const labelById = new Map(nextAIProviderKeys.map((item) => [item.id, item.label] as const));
      if (has('ai_use_case_settings')) {
        setAIUseCaseSettings((raw('ai_use_case_settings') || []).map((row: any) => {
          const mapped = mapAIUseCaseSettingRow(row);
          if (!mapped.providerKeyLabel && mapped.providerKeyId) {
            mapped.providerKeyLabel = labelById.get(mapped.providerKeyId) || undefined;
          }
          return mapped;
        }));
      }
    }

    // ── Strategy ──
    const projects = projectsRaw ? projectsRaw.map(mapProjectRow) : [];
    if (has('strategy_goals')) setStrategyGoals(attachGoalLinkNames(
      (raw('strategy_goals') || []).map((row: any) => strategyGoalFromDb(row)), projects, nextCompanies,
    ));
    if (has('strategy_plans')) {
      const goals = (raw('strategy_goals') || []).map((row: any) => strategyGoalFromDb(row));
      setStrategyPlans(attachPlanLinkNames(
        (raw('strategy_plans') || []).map((row: any) => strategyPlanFromDb(row)), goals, projects,
      ));
    }
    if (has('strategy_tactics')) {
      const goals = (raw('strategy_goals') || []).map((row: any) => strategyGoalFromDb(row));
      const plans = (raw('strategy_plans') || []).map((row: any) => strategyPlanFromDb(row));
      setStrategyTactics(attachTacticLinkNames(
        (raw('strategy_tactics') || []).map((row: any) => strategyTacticFromDb(row)), goals, plans, projects,
      ));
    }
    if (has('strategy_experiments')) {
      const goals = (raw('strategy_goals') || []).map((row: any) => strategyGoalFromDb(row));
      const plans = (raw('strategy_plans') || []).map((row: any) => strategyPlanFromDb(row));
      setStrategyExperiments(attachExperimentLinkNames(
        (raw('strategy_experiments') || []).map((row: any) => strategyExperimentFromDb(row)), goals, plans, projects,
      ));
    }
    if (has('strategy_decisions')) {
      const goals = (raw('strategy_goals') || []).map((row: any) => strategyGoalFromDb(row));
      const plans = (raw('strategy_plans') || []).map((row: any) => strategyPlanFromDb(row));
      setStrategyDecisions(attachDecisionLinkNames(
        (raw('strategy_decisions') || []).map((row: any) => strategyDecisionFromDb(row)), goals, plans, projects,
      ));
    }

    // ── Strategy items (shared across views) ──
    if (has('strategy_items')) setStrategyItems(attachStrategyLinkNames(
      (raw('strategy_items') || []).map((row: any) => strategyItemFromDb(row)),
      projects, nextCompanies, derived?.people || [],
    ));

    // ── Plans ──
    if (has('plans')) setPlans(attachOsPlanLinkNames(
      (raw('plans') || []).map((row: any) => planFromDb(row)), projects, (raw('strategy_goals') || []).map((row: any) => strategyGoalFromDb(row)),
    ));
    if (has('plan_items')) setPlanItems(attachPlanItemLinkNames(
      (raw('plan_items') || []).map((row: any) => planItemFromDb(row)), projects, (raw('strategy_goals') || []).map((row: any) => strategyGoalFromDb(row)),
    ));

    // ── Finance ──
    if (has('finance_periods')) setFinancePeriods((raw('finance_periods') || []).map((row: any) => financePeriodFromDb(row)));
    if (has('finance_recurring_rules')) setFinanceRecurringRules(attachFinanceRecurringRuleLinkNames(
      (raw('finance_recurring_rules') || []).map((row: any) => financeRecurringRuleFromDb(row)), projects, nextCompanies,
    ));
    if (has('finance_income')) {
      const periods = (raw('finance_periods') || []).map((row: any) => financePeriodFromDb(row));
      setFinanceIncome(attachFinancePeriodTitles(
        attachFinanceIncomeLinkNames(
          (raw('finance_income') || []).map((row: any) => financeIncomeFromDb(row)), projects, nextCompanies,
        ), periods,
      ));
    }
    if (has('finance_expenses')) {
      const periods = (raw('finance_periods') || []).map((row: any) => financePeriodFromDb(row));
      setFinanceExpenses(attachFinancePeriodTitles(
        attachFinanceExpenseLinkNames((raw('finance_expenses') || []).map((row: any) => financeExpenseFromDb(row)), projects), periods,
      ));
    }
    if (has('finance_allocation_rules')) setFinanceAllocationRules((raw('finance_allocation_rules') || []).map((row: any) => financeAllocationRuleFromDb(row)));
    if (has('finance_purchase_goals')) {
      const periods = (raw('finance_periods') || []).map((row: any) => financePeriodFromDb(row));
      setFinancePurchaseGoals(attachFinancePeriodTitles(
        attachFinancePurchaseGoalLinkNames((raw('finance_purchase_goals') || []).map((row: any) => financePurchaseGoalFromDb(row)), projects), periods,
      ));
    }
    if (has('finance_investment_ideas')) {
      const periods = (raw('finance_periods') || []).map((row: any) => financePeriodFromDb(row));
      setFinanceInvestmentIdeas(attachFinancePeriodTitles(
        (raw('finance_investment_ideas') || []).map((row: any) => financeInvestmentIdeaFromDb(row)), periods,
      ));
    }
    if (has('finance_investment_rules')) setFinanceInvestmentRules((raw('finance_investment_rules') || []).map((row: any) => financeInvestmentRuleFromDb(row)));
    if (has('finance_investment_allocations')) setFinanceInvestmentAllocations((raw('finance_investment_allocations') || []).map((row: any) => financeInvestmentAllocationFromDb(row)));

    // ── Tasks ──
    const plans = (raw('plans') || []).map((row: any) => planFromDb(row));
    const strategyGoals = (raw('strategy_goals') || []).map((row: any) => strategyGoalFromDb(row));
    const generatedDocs = (raw('generated_documents') || []).map((row: any) => mapGeneratedDocumentRow(row));
    if (has('tasks')) setTasks(attachTaskLinkNames(
      (raw('tasks') || []).map((row: any) => taskFromDb(row)),
      projects, plans, strategyGoals, nextCompanies, derived?.people || [], generatedDocs,
    ));
    if (has('recurring_tasks')) setRecurringTasks(attachRecurringTaskLinkNames(
      (raw('recurring_tasks') || []).map((row: any) => recurringTaskFromDb(row)),
      projects, plans, strategyGoals, nextCompanies, derived?.people || [],
    ));
    if (has('recurring_task_logs')) setRecurringTaskLogs((raw('recurring_task_logs') || []).map((row: any) => recurringTaskLogFromDb(row)));
    if (has('task_work_logs')) setTaskWorkLogs((raw('task_work_logs') || []).map((row: any) => taskWorkLogFromDb(row)));
    if (has('weekly_task_reviews')) setWeeklyTaskReviews((raw('weekly_task_reviews') || []).map((row: any) => weeklyTaskReviewFromDb(row)));

    // ── Social ──
    if (has('social_platforms')) setSocialPlatforms((raw('social_platforms') || []).map((row: any) => socialPlatformFromDb(row)));
    if (has('social_people')) setSocialPeople((raw('social_people') || []).map((row: any) => socialPersonFromDb(row)));
    if (has('content_pillars')) setContentPillars((raw('content_pillars') || []).map((row: any) => contentPillarFromDb(row)));
    if (has('content_strategy')) setContentStrategies((raw('content_strategy') || []).map((row: any) => contentStrategyFromDb(row)));
    if (has('weekly_content_plans')) setWeeklyContentPlans((raw('weekly_content_plans') || []).map((row: any) => weeklyContentPlanFromDb(row)));
    if (has('social_weekly_system')) setSocialWeeklySystems((raw('social_weekly_system') || []).map((row: any) => socialWeeklySystemFromDb(row)));
    if (has('social_weekly_tasks')) setSocialWeeklyTasks((raw('social_weekly_tasks') || []).map((row: any) => socialWeeklyTaskFromDb(row)));
    // ── Life ──
    if (has('life_nutrition_logs')) setLifeNutritionLogs((raw('life_nutrition_logs') || []).map((row: any) => lifeNutritionLogFromDb(row)));
    if (has('life_fitness_logs')) setLifeFitnessLogs((raw('life_fitness_logs') || []).map((row: any) => lifeFitnessLogFromDb(row)));
    if (has('life_deen_logs')) setLifeDeenLogs((raw('life_deen_logs') || []).map((row: any) => lifeDeenLogFromDb(row)));
    if (has('life_family_actions')) setLifeFamilyActions((raw('life_family_actions') || []).map((row: any) => lifeFamilyActionFromDb(row)));
    if (has('life_weekly_reviews')) setLifeWeeklyReviews((raw('life_weekly_reviews') || []).map((row: any) => lifeWeeklyReviewFromDb(row)));
    // ── Company CRM ──
    if (has('company_contact_methods')) setCompanyContactMethods((raw('company_contact_methods') || []).map((row: any) => companyContactMethodFromDb(row)));
    if (has('person_contact_methods')) setPersonContactMethods((raw('person_contact_methods') || []).map((row: any) => personContactMethodFromDb(row)));
    if (has('company_problem_profiles')) setCompanyProblemProfiles((raw('company_problem_profiles') || []).map((row: any) => companyProblemProfileFromDb(row)));
    if (has('company_outreach_scripts')) setCompanyOutreachScripts((raw('company_outreach_scripts') || []).map((row: any) => companyOutreachScriptFromDb(row)));

    // ── Desktop ──
    if (has('desktop_shortcuts')) setDesktopShortcuts((raw('desktop_shortcuts') || []).map((row: any) => desktopShortcutFromDb(row)));
    if (has('desktop_settings')) {
      const rawArr = raw('desktop_settings');
      if (rawArr && rawArr.length > 0) {
        setDesktopSettings(desktopSettingsFromDb(rawArr[0]));
      } else if (has('desktop_settings')) {
        setDesktopSettings(null);
      }
    }
    if (has('desktop_groups')) setDesktopGroups((raw('desktop_groups') || []).map((row: any) => desktopGroupFromDb(row)));

    if (has('content_items')) {
      setContentItems(attachContentItemLinkNames(
        (raw('content_items') || []).map((row: any) => contentItemFromDb(row)),
        (raw('social_platforms') || []).map((row: any) => socialPlatformFromDb(row)),
        (raw('content_pillars') || []).map((row: any) => contentPillarFromDb(row)),
        projectsRaw ? projectsRaw.map(mapProjectRow) : [],
        smartNotesRaw ? smartNotesRaw.map(mapSmartNoteRow) : [],
        nextCompanies,
      ));
    }

    if (import.meta.env.DEV) {
      const keys = Object.keys(payload).filter((k) => k !== '_debug');
      console.log(`[Opportunities] applied payload: ${keys.length} keys`, { keys });
    }
  }, []);

  // ── Scoped fetchers ──
  const fetchScope = async (scope: string) => {
    const response = await fetch(`${API_ENDPOINT}?scope=${scope}`, {
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) {
      const result = await response.json().catch(() => ({}));
      throw parseApiError(result, response.status);
    }
    return response.json();
  };

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
        // Stage 1: Load core data first
        const crmPayload = await fetchScope('crm');
        if (!mounted) return;
        applyPayload(crmPayload);

        // Stage 2: Load secondary scopes in parallel, process each as it resolves
        const secondaryScopes = ['tasks', 'finance', 'documents', 'strategy', 'relationships', 'notes', 'ai', 'social', 'life', 'desktop'];
        const secondaryPromises = secondaryScopes.map(async (scope) => {
          try {
            const payload = await fetchScope(scope);
            if (!mounted) return;
            applyPayload(payload);
            setLoadedScopes((prev) => ({ ...prev, [scope]: true }));
          } catch (err) {
            if (!mounted) return;
            if (import.meta.env.DEV) {
              console.warn(`[Opportunities] Scope ${scope} failed (non-critical, continuing):`, err);
            }
          }
        });
        await Promise.allSettled(secondaryPromises);
      } catch (apiError) {
        if (!mounted) return;

        if (import.meta.env.DEV) {
          console.error('[Opportunities] API load failed. Response details:', apiError);
        }

        if ((apiError as ApiError)?.status === 401) {
          console.error('[Opportunities] Authentication required to load data.', apiError);
          setError('Authentication required. Please log in again.');
          setCompanies([]);
          setPeople([]);
          setMessages([]);
          setDeals([]);
          setRelationships([]);
          setRelationshipInteractions([]);
          setRelationshipOpportunities([]);
          setNoteCategories([]);
          setSmartNotes([]);
          setNoteAttachments([]);
          setNoteBlocks([]);
          setTemplates([]);
          setInvoices([]);
          setInvoiceItems([]);
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
          setFinancePeriods([]);
          setFinanceRecurringRules([]);
          setStrategyItems([]);
          setCompanyContactMethods([]);
          setPersonContactMethods([]);
          setCompanyProblemProfiles([]);
          setCompanyOutreachScripts([]);
          setSocialWeeklySystems([]);
          return;
        }

        console.error('[Opportunities] Failed to load from /api/opportunities, falling back to seed data.', apiError);
        const fallback = cloneSeedData();
        setCompanies(fallback.companies);
        setPeople(fallback.people);
        setMessages(fallback.messages);
        setDeals(fallback.deals);
        setRelationships(fallback.relationships);
        setRelationshipInteractions(fallback.relationshipInteractions);
        setRelationshipOpportunities(fallback.relationshipOpportunities);
        setNoteCategories(fallback.noteCategories);
        setSmartNotes(fallback.smartNotes);
        setNoteAttachments(fallback.noteAttachments);
        setNoteBlocks(fallback.noteBlocks);
        setTemplates(fallback.templates);
        setInvoices(fallback.invoices);
        setInvoiceItems(fallback.invoiceItems);
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
        setFinancePeriods([]);
        setFinanceRecurringRules([]);
        setStrategyItems(fallback.strategyItems);
        setCompanyContactMethods(fallback.companyContactMethods);
        setPersonContactMethods(fallback.personContactMethods || []);
        setCompanyProblemProfiles(fallback.companyProblemProfiles);
        setCompanyOutreachScripts(fallback.companyOutreachScripts);
        setSocialPeople(fallback.socialPeople);
        setSocialWeeklySystems(fallback.socialWeeklySystems);
        setSocialWeeklyTasks(fallback.socialWeeklyTasks);
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

  useEffect(() => {
    setRelationships((current) => {
      const withPerson = attachRelationshipLinkNames(current, people);
      const withCategory = attachRelationshipCategoryNames(withPerson, relationshipCategories);
      return shouldReplaceCollection(current, withCategory, ['personName', 'categoryName', 'categorySlug', 'categoryColor']) ? withCategory : current;
    });

    setRelationshipOpportunities((current) => {
      const next = attachRelationshipOpportunityLinkNames(current, projects, companies);
      return shouldReplaceCollection(current, next, ['linkedProjectName', 'linkedCompanyName']) ? next : current;
    });
  }, [companies, people, projects, relationshipCategories]);

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

    const row = result?.row || result?.data;
    return Array.isArray(data) ? (result?.rows || []) : row;
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

    return result?.row || result?.data;
  };

  const syncDelete = async (entity: 'companies' | 'people' | 'messages' | 'deals' | 'relationships' | 'relationship_interactions' | 'relationship_opportunities' | 'relationship_categories' | 'relationship_contact_methods' | 'projects' | 'message_templates' | 'project_tasks' | 'project_time_logs' | 'project_meetings' | 'project_documents' | 'project_finance_items' | 'documents' | 'document_templates' | 'document_brand_settings' | 'generated_documents' | 'invoices' | 'invoice_items' | 'strategy_items' | 'strategy_goals' | 'strategy_plans' | 'strategy_tactics' | 'strategy_experiments' | 'strategy_decisions' | 'plans' | 'plan_items' | 'note_categories' | 'smart_notes' | 'note_attachments' | 'note_blocks' | 'finance_income' | 'finance_expenses' | 'finance_allocation_rules' | 'finance_purchase_goals' | 'finance_investment_ideas' | 'finance_investment_rules' | 'finance_investment_allocations' | 'finance_periods' | 'finance_recurring_rules' | 'ai_use_case_settings' | 'tasks' | 'recurring_tasks' | 'recurring_task_logs' | 'task_work_logs' | 'weekly_task_reviews' | 'social_platforms' | 'content_pillars' | 'content_strategy' | 'content_items' | 'weekly_content_plans' | 'life_nutrition_logs' | 'life_fitness_logs' | 'life_deen_logs' | 'life_family_actions' | 'life_weekly_reviews' | 'company_contact_methods' | 'person_contact_methods' | 'company_problem_profiles' | 'company_outreach_scripts', id: string) => {
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

  const addAIProviderKey = async (input: AIProviderKeyInput) => {
    const result = await requestAIProviderKeys({
      method: 'POST',
      body: JSON.stringify({ ...input }),
    }).catch((error: ApiError) => {
      if (error.status === 401) setError('Authentication required. Please log in again.');
      throw error;
    });

    if (result?.success === false) {
      throw new Error(result?.error || 'Failed to create AI provider key.');
    }

    const next = mapAIProviderKeyRow(result?.row);
    setAIProviderKeys((current) => [next, ...current]);
    return next;
  };

  const updateAIProviderKey = async (id: string, input: Partial<AIProviderKeyInput>) => {
    const result = await requestAIProviderKeys({
      method: 'PUT',
      body: JSON.stringify({ id, ...input }),
    }).catch((error: ApiError) => {
      if (error.status === 401) setError('Authentication required. Please log in again.');
      throw error;
    });

    if (result?.success === false) {
      throw new Error(result?.error || 'Failed to update AI provider key.');
    }

    const next = mapAIProviderKeyRow(result?.row);
    setAIProviderKeys((current) => current.map((item) => (item.id === id ? next : item)));
    setAIUseCaseSettings((current) => current.map((item) => (item.providerKeyId === id ? { ...item, providerKeyLabel: next.label, provider: next.provider } : item)));
    return next;
  };

  const deleteAIProviderKey = async (id: string) => {
    const confirmed = window.confirm('Delete this provider key? Use-case routing that references it will need to be reconfigured.');
    if (!confirmed) return;

    const result = await requestAIProviderKeys({
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }).catch((error: ApiError) => {
      if (error.status === 401) setError('Authentication required. Please log in again.');
      throw error;
    });

    if (result?.success === false) {
      throw new Error(result?.error || 'Failed to delete AI provider key.');
    }

    setAIProviderKeys((current) => current.filter((item) => item.id !== id));
    setAIUseCaseSettings((current) => current.map((item) => (item.providerKeyId === id ? { ...item, providerKeyId: undefined, providerKeyLabel: undefined } : item)));
  };

  const testAIProviderKey = async (input: { id?: string; provider: string; apiKey?: string; model?: string; baseUrl?: string; endpoint?: string; deploymentName?: string; apiVersion?: string }) => {
    const result = await requestAIProviderKeys({
      method: 'POST',
      body: JSON.stringify({ action: 'test', ...input }),
    }).catch((error: ApiError) => {
      if (error.status === 401) setError('Authentication required. Please log in again.');
      throw error;
    });

    if (result?.success === false) {
      throw new Error(result?.error || 'Provider test failed.');
    }

    return result?.message || 'Connection succeeded.';
  };

  const addAIUseCaseSetting = async (input: AIUseCaseSettingInput) => {
    const model = String(input.model || '').trim();
    if (!model) {
      throw new Error('AI use case model is required.');
    }

    const row = await syncInsert('ai_use_case_settings', {
      use_case: input.useCase,
      provider_key_id: input.providerKeyId || null,
      provider: input.provider || null,
      model,
      temperature: input.temperature ?? null,
      max_output_tokens: input.maxOutputTokens ?? null,
      is_enabled: input.isEnabled ?? true,
      notes: input.notes || null,
    });

    const next = mapAIUseCaseSettingRow(row);
    if (next.providerKeyId) {
      next.providerKeyLabel = aiProviderKeys.find((item) => item.id === next.providerKeyId)?.label;
    }
    setAIUseCaseSettings((current) => [next, ...current.filter((item) => item.useCase !== next.useCase)]);
    return next;
  };

  const updateAIUseCaseSetting = async (id: string, input: Partial<AIUseCaseSettingInput>) => {
    if (input.model !== undefined) {
      const model = String(input.model || '').trim();
      if (!model) {
        throw new Error('AI use case model is required.');
      }
    }

    const row = await syncUpdate('ai_use_case_settings', id, {
      ...(input.useCase !== undefined ? { use_case: input.useCase } : {}),
      ...(input.providerKeyId !== undefined ? { provider_key_id: input.providerKeyId } : {}),
      ...(input.provider !== undefined ? { provider: input.provider } : {}),
      ...(input.model !== undefined ? { model: String(input.model).trim() } : {}),
      ...(input.temperature !== undefined ? { temperature: input.temperature } : {}),
      ...(input.maxOutputTokens !== undefined ? { max_output_tokens: input.maxOutputTokens } : {}),
      ...(input.isEnabled !== undefined ? { is_enabled: input.isEnabled } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    });

    const next = mapAIUseCaseSettingRow(row);
    if (next.providerKeyId) {
      next.providerKeyLabel = aiProviderKeys.find((item) => item.id === next.providerKeyId)?.label;
    }
    setAIUseCaseSettings((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteAIUseCaseSetting = async (id: string) => {
    await syncDelete('ai_use_case_settings', id);
    setAIUseCaseSettings((current) => current.filter((item) => item.id !== id));
  };

  const updateCompany = async (id: string, input: Partial<CompanyInput>) => {
    console.log("updateCompany id:", id);
    if (!id || typeof id !== "string") {
      console.error("Invalid company id", { id, input });
      throw new Error("Invalid company id");
    }
    const row = await syncUpdate('companies', id, toCompanyUpdateDb(input));
    const next = mapCompanyRow(row);
    setCompanies((current) => current.map((c) => (c.id === id ? next : c)));
    return next;
  };

  const deleteCompany = async (id: string, options?: { preserveRelated?: boolean }) => {
    await requestOpportunities({
      method: 'DELETE',
      body: JSON.stringify({
        entity: 'companies',
        action: 'OPPORTUNITIES_DELETE_COMPANY',
        id,
        preserveRelated: options?.preserveRelated ?? false,
      }),
    });
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
    setPersonContactMethods((current) => current.filter((item) => item.personId !== id));
  };

  const addPersonContactMethod = async (input: PersonContactMethodInput) => {
    if (!String(input.personId || '').trim()) {
      throw new Error('Please select a person before adding a contact method.');
    }

    if (!String(input.value || '').trim()) {
      throw new Error('Please enter a contact value before saving.');
    }

    const row = await syncInsert('person_contact_methods', toPersonContactMethodDb(input));
    const next = personContactMethodFromDb(row);
    setPersonContactMethods((current) => [next, ...current]);
    return next;
  };

  const updatePersonContactMethod = async (id: string, input: Partial<PersonContactMethodInput>) => {
    const row = await syncUpdate('person_contact_methods', id, toPersonContactMethodDb(input, { forUpdate: true }));
    const next = personContactMethodFromDb(row);
    setPersonContactMethods((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deletePersonContactMethod = async (id: string) => {
    const confirmed = window.confirm('Delete this contact method?');
    if (!confirmed) return;
    await syncDelete('person_contact_methods', id);
    setPersonContactMethods((current) => current.filter((item) => item.id !== id));
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

  const addRelationship = async (input: RelationshipInput) => {
    if (!String(input.displayName || '').trim()) {
      throw new Error('Display name is required.');
    }

    const row = await syncInsert('relationships', toRelationshipDb(input));
    const personId = getRowRefId(row, 'person_id', 'personId');
    const personName = people.find((person) => person.id === personId)?.fullName;
    let next = mapRelationshipRow(row, personName);
    next = attachRelationshipCategoryNames([next], relationshipCategories)[0];
    setRelationships((current) => [next, ...current]);
    return next;
  };

  const updateRelationship = async (id: string, input: Partial<RelationshipInput>) => {
    const row = await syncUpdate('relationships', id, toRelationshipDb(input, { forUpdate: true }));
    const personId = getRowRefId(row, 'person_id', 'personId');
    const personName = people.find((person) => person.id === personId)?.fullName;
    let next = mapRelationshipRow(row, personName);
    next = attachRelationshipCategoryNames([next], relationshipCategories)[0];
    setRelationships((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteRelationship = async (id: string) => {
    const confirmed = window.confirm('Are you sure you want to delete this relationship?');
    if (!confirmed) return;
    await syncDelete('relationships', id);
    setRelationships((current) => current.filter((item) => item.id !== id));
    setRelationshipInteractions((current) => current.filter((item) => item.relationshipId !== id));
    setRelationshipOpportunities((current) => current.filter((item) => item.relationshipId !== id));
    setRelationshipContactMethods((current) => current.filter((item) => item.relationshipId !== id));
  };

  const addRelationshipInteraction = async (input: RelationshipInteractionInput) => {
    if (!String(input.relationshipId || '').trim()) {
      throw new Error('Select a relationship before adding an interaction.');
    }

    const row = await syncInsert('relationship_interactions', toRelationshipInteractionDb(input));
    const next = mapRelationshipInteractionRow(row);
    setRelationshipInteractions((current) => [next, ...current]);
    return next;
  };

  const updateRelationshipInteraction = async (id: string, input: Partial<RelationshipInteractionInput>) => {
    const row = await syncUpdate('relationship_interactions', id, toRelationshipInteractionDb(input, { forUpdate: true }));
    const next = mapRelationshipInteractionRow(row);
    setRelationshipInteractions((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteRelationshipInteraction = async (id: string) => {
    const confirmed = window.confirm('Delete this interaction?');
    if (!confirmed) return;
    await syncDelete('relationship_interactions', id);
    setRelationshipInteractions((current) => current.filter((item) => item.id !== id));
  };

  const addRelationshipOpportunity = async (input: RelationshipOpportunityInput) => {
    if (!String(input.relationshipId || '').trim()) {
      throw new Error('Select a relationship before adding an opportunity.');
    }

    const row = await syncInsert('relationship_opportunities', toRelationshipOpportunityDb(input));
    const next = mapRelationshipOpportunityRow(row);
    setRelationshipOpportunities((current) => [next, ...current]);
    return next;
  };

  const updateRelationshipOpportunity = async (id: string, input: Partial<RelationshipOpportunityInput>) => {
    const row = await syncUpdate('relationship_opportunities', id, toRelationshipOpportunityDb(input, { forUpdate: true }));
    const next = mapRelationshipOpportunityRow(row);
    setRelationshipOpportunities((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteRelationshipOpportunity = async (id: string) => {
    const confirmed = window.confirm('Delete this opportunity?');
    if (!confirmed) return;
    await syncDelete('relationship_opportunities', id);
    setRelationshipOpportunities((current) => current.filter((item) => item.id !== id));
  };

  const addRelationshipCategory = async (input: RelationshipCategoryInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Category name is required.');
    }

    const row = await syncInsert('relationship_categories', toRelationshipCategoryDb(input));
    const next = mapRelationshipCategoryRow(row);
    setRelationshipCategories((current) => [next, ...current]);
    return next;
  };

  const updateRelationshipCategory = async (id: string, input: Partial<RelationshipCategoryInput>) => {
    const row = await syncUpdate('relationship_categories', id, toRelationshipCategoryDb(input, { forUpdate: true }));
    const next = mapRelationshipCategoryRow(row);
    setRelationshipCategories((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteRelationshipCategory = async (id: string) => {
    const confirmed = window.confirm('Delete this category?');
    if (!confirmed) return;
    await syncDelete('relationship_categories', id);
    setRelationshipCategories((current) => current.filter((item) => item.id !== id));
  };

  const addRelationshipContactMethod = async (input: RelationshipContactMethodInput) => {
    if (!String(input.relationshipId || '').trim()) {
      throw new Error('Select a relationship before adding a contact method.');
    }

    const row = await syncInsert('relationship_contact_methods', toRelationshipContactMethodDb(input));
    const next = mapRelationshipContactMethodRow(row);
    setRelationshipContactMethods((current) => [next, ...current]);
    return next;
  };

  const updateRelationshipContactMethod = async (id: string, input: Partial<RelationshipContactMethodInput>) => {
    const row = await syncUpdate('relationship_contact_methods', id, toRelationshipContactMethodDb(input, { forUpdate: true }));
    const next = mapRelationshipContactMethodRow(row);
    setRelationshipContactMethods((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteRelationshipContactMethod = async (id: string) => {
    const confirmed = window.confirm('Delete this contact method?');
    if (!confirmed) return;
    await syncDelete('relationship_contact_methods', id);
    setRelationshipContactMethods((current) => current.filter((item) => item.id !== id));
  };

  const addNoteCategory = async (input: NoteCategoryInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Category name is required.');
    }

    const row = await syncInsert('note_categories', toNoteCategoryDb(input));
    const next = mapNoteCategoryRow(row);
    setNoteCategories((current) => [next, ...current]);
    return next;
  };

  const updateNoteCategory = async (id: string, input: Partial<NoteCategoryInput>) => {
    const row = await syncUpdate('note_categories', id, toNoteCategoryDb(input, { forUpdate: true }));
    const next = mapNoteCategoryRow(row);
    setNoteCategories((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteNoteCategory = async (id: string) => {
    await syncDelete('note_categories', id);
    setNoteCategories((current) => current.filter((item) => item.id !== id));
  };

  const addSmartNote = async (input: SmartNoteInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Note title is required.');
    }

    const row = await syncInsert('smart_notes', toSmartNoteDb(input));
    const next = attachSmartNoteLinkNames([mapSmartNoteRow(row)], noteCategories, projects, companies, people, relationships, tasks, strategyGoals, plans)[0];
    setSmartNotes((current) => [next, ...current]);
    return next;
  };

  const updateSmartNote = async (id: string, input: Partial<SmartNoteInput>) => {
    const row = await syncUpdate('smart_notes', id, toSmartNoteDb(input, { forUpdate: true }));
    const next = attachSmartNoteLinkNames([mapSmartNoteRow(row)], noteCategories, projects, companies, people, relationships, tasks, strategyGoals, plans)[0];
    setSmartNotes((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteSmartNote = async (id: string) => {
    const confirmed = window.confirm('Delete this note?');
    if (!confirmed) return;
    await syncDelete('smart_notes', id);
    setSmartNotes((current) => current.filter((item) => item.id !== id));
    setNoteAttachments((current) => current.filter((attachment) => attachment.noteId !== id));
    setNoteBlocks((current) => current.filter((block) => block.noteId !== id));
  };

  const addNoteAttachment = async (input: NoteAttachmentInput) => {
    if (!String(input.noteId || '').trim()) {
      throw new Error('Select a note before adding an attachment.');
    }
    if (!String(input.url || '').trim()) {
      throw new Error('Attachment URL is required.');
    }

    const row = await syncInsert('note_attachments', toNoteAttachmentDb(input));
    const next = mapNoteAttachmentRow(row);
    setNoteAttachments((current) => [next, ...current]);
    return next;
  };

  const updateNoteAttachment = async (id: string, input: Partial<NoteAttachmentInput>) => {
    const row = await syncUpdate('note_attachments', id, toNoteAttachmentDb(input, { forUpdate: true }));
    const next = mapNoteAttachmentRow(row);
    setNoteAttachments((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteNoteAttachment = async (id: string) => {
    const confirmed = window.confirm('Delete this attachment?');
    if (!confirmed) return;
    await syncDelete('note_attachments', id);
    setNoteAttachments((current) => current.filter((item) => item.id !== id));
  };

  const addNoteBlock = async (input: NoteBlockInput) => {
    if (!String(input.noteId || '').trim()) {
      throw new Error('Select a note before adding a block.');
    }

    const row = await syncInsert('note_blocks', toNoteBlockDb(input));
    const next = mapNoteBlockRow(row);
    setNoteBlocks((current) => [...current, next].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    return next;
  };

  const updateNoteBlock = async (id: string, input: Partial<NoteBlockInput>) => {
    const row = await syncUpdate('note_blocks', id, toNoteBlockDb(input, { forUpdate: true }));
    const next = mapNoteBlockRow(row);
    setNoteBlocks((current) => current.map((item) => (item.id === id ? next : item)).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));
    return next;
  };

  const deleteNoteBlock = async (id: string) => {
    const confirmed = window.confirm('Delete this block?');
    if (!confirmed) return;
    await syncDelete('note_blocks', id);
    setNoteBlocks((current) => current.filter((item) => item.id !== id));
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

  // ── Documents CRUD ──

  const addDocument = async (input: DocumentInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Document name is required.');
    }

    const row = await syncInsert('documents', toDocumentDb(input));
    const next = attachDocumentLinkNames([mapDocumentRow(row)], projects, companies, people, deals)[0];
    setDocuments((current) => [next, ...current]);
    return next;
  };

  const updateDocument = async (id: string, input: Partial<DocumentInput>) => {
    if (input.name !== undefined && !String(input.name || '').trim()) {
      throw new Error('Document name is required.');
    }

    const row = await syncUpdate('documents', id, toDocumentDb(input, { forUpdate: true }));
    const next = attachDocumentLinkNames([mapDocumentRow(row)], projects, companies, people, deals)[0];
    setDocuments((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteDocument = async (id: string) => {
    const confirmed = window.confirm('Delete this document?');
    if (!confirmed) return;
    await syncDelete('documents', id);
    setDocuments((current) => current.filter((item) => item.id !== id));
  };

  const addDocumentTemplate = async (input: DocumentTemplateInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Template name is required.');
    }

    if (!String(input.content || '').trim()) {
      throw new Error('Template content is required.');
    }

    const row = await syncInsert('document_templates', toDocumentTemplateDb(input));
    const next = mapDocumentTemplateRow(row);
    setDocumentTemplates((current) => [next, ...current]);
    return next;
  };

  const updateDocumentTemplate = async (id: string, input: Partial<DocumentTemplateInput>) => {
    const payload: Record<string, unknown> = {};
    if (input.name !== undefined) payload.name = String(input.name || '').trim();
    if (input.type !== undefined) payload.type = input.type;
    if (input.language !== undefined) payload.language = input.language;
    if (input.description !== undefined) payload.description = toNullableString(input.description);
    if (input.content !== undefined) payload.content = String(input.content || '').trim();
    if (input.variables !== undefined) payload.variables = toNullableString(input.variables);
    if (input.isActive !== undefined) payload.is_active = Boolean(input.isActive);

    const row = await syncUpdate('document_templates', id, payload);
    const next = mapDocumentTemplateRow(row);
    setDocumentTemplates((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteDocumentTemplate = async (id: string) => {
    const confirmed = window.confirm('Delete this template?');
    if (!confirmed) return;
    await syncDelete('document_templates', id);
    setDocumentTemplates((current) => current.filter((item) => item.id !== id));
  };

  const addDocumentBrandSettings = async (input: DocumentBrandSettingsInput) => {
    const row = await syncInsert('document_brand_settings', toDocumentBrandSettingsDb(input));
    const next = mapDocumentBrandSettingsRow(row);
    setDocumentBrandSettings([next]);
    return next;
  };

  const updateDocumentBrandSettings = async (id: string, input: Partial<DocumentBrandSettingsInput>) => {
    const payload: Record<string, unknown> = {};
    if (input.brandName !== undefined) payload.brand_name = toNullableString(input.brandName);
    if (input.ownerName !== undefined) payload.owner_name = toNullableString(input.ownerName);
    if (input.email !== undefined) payload.email = toNullableString(input.email);
    if (input.phone !== undefined) payload.phone = toNullableString(input.phone);
    if (input.website !== undefined) payload.website = toNullableString(input.website);
    if (input.address !== undefined) payload.address = toNullableString(input.address);
    if (input.logoUrl !== undefined) payload.logo_url = toNullableString(input.logoUrl);
    if (input.signatureUrl !== undefined) payload.signature_url = toNullableString(input.signatureUrl);
    if (input.signatureName !== undefined) payload.signature_name = toNullableString(input.signatureName);
    if (input.defaultCurrency !== undefined) payload.default_currency = toNullableString(input.defaultCurrency);
    if (input.paymentNotes !== undefined) payload.payment_notes = toNullableString(input.paymentNotes);
    if (input.legalNotes !== undefined) payload.legal_notes = toNullableString(input.legalNotes);

    const row = await syncUpdate('document_brand_settings', id, payload);
    const next = mapDocumentBrandSettingsRow(row);
    setDocumentBrandSettings([next]);
    return next;
  };

  const deleteDocumentBrandSettings = async (id: string) => {
    const confirmed = window.confirm('Delete this brand settings profile?');
    if (!confirmed) return;
    await syncDelete('document_brand_settings', id);
    setDocumentBrandSettings((current) => current.filter((item) => item.id !== id));
  };

  const addGeneratedDocument = async (input: GeneratedDocumentInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Document title is required.');
    }

    const row = await syncInsert('generated_documents', toGeneratedDocumentDb(input));
    const next = attachGeneratedDocumentLinkNames([mapGeneratedDocumentRow(row)], documentTemplates, projects, companies, people, deals)[0];
    setGeneratedDocuments((current) => [next, ...current]);
    return next;
  };

  const updateGeneratedDocument = async (id: string, input: Partial<GeneratedDocumentInput>) => {
    const payload: Record<string, unknown> = {};
    if (input.title !== undefined) payload.title = String(input.title || '').trim();
    if (input.type !== undefined) payload.type = input.type;
    if (input.status !== undefined) payload.status = input.status;
    if (input.language !== undefined) payload.language = input.language;
    if (input.templateId !== undefined) payload.template_id = toNullableString(input.templateId);
    if (input.relatedProjectId !== undefined) payload.related_project_id = toNullableString(input.relatedProjectId);
    if (input.relatedCompanyId !== undefined) payload.related_company_id = toNullableString(input.relatedCompanyId);
    if (input.relatedPersonId !== undefined) payload.related_person_id = toNullableString(input.relatedPersonId);
    if (input.relatedDealId !== undefined) payload.related_deal_id = toNullableString(input.relatedDealId);
    if (input.content !== undefined) payload.content = toNullableString(input.content);
    if (input.variablesJson !== undefined) payload.variables_json = toNullableString(input.variablesJson);
    if (input.amount !== undefined) payload.amount = toNullableNumber(input.amount);
    if (input.currency !== undefined) payload.currency = toNullableString(input.currency);
    if (input.issueDate !== undefined) payload.issue_date = toNullableString(input.issueDate);
    if (input.dueDate !== undefined) payload.due_date = toNullableString(input.dueDate);
    if (input.signedDate !== undefined) payload.signed_date = toNullableString(input.signedDate);
    if (input.pdfUrl !== undefined) payload.pdf_url = toNullableString(input.pdfUrl);
    if (input.pdfStoragePath !== undefined) payload.pdf_storage_path = toNullableString(input.pdfStoragePath);
    if (input.externalUrl !== undefined) payload.external_url = toNullableString(input.externalUrl);
    if (input.notes !== undefined) payload.notes = toNullableString(input.notes);

    const row = await syncUpdate('generated_documents', id, payload);
    const next = attachGeneratedDocumentLinkNames([mapGeneratedDocumentRow(row)], documentTemplates, projects, companies, people, deals)[0];
    setGeneratedDocuments((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteGeneratedDocument = async (id: string) => {
    const confirmed = window.confirm('Delete this generated document?');
    if (!confirmed) return;
    await syncDelete('generated_documents', id);
    setGeneratedDocuments((current) => current.filter((item) => item.id !== id));
  };

  const addInvoice = async (input: InvoiceInput) => {
    if (!String(input.invoiceNumber || '').trim()) {
      throw new Error('Invoice number is required.');
    }

    if (!String(input.title || '').trim()) {
      throw new Error('Invoice title is required.');
    }

    const row = await syncInsert('invoices', toInvoiceDb(input));
    if (!row) {
      throw new Error('Invoice save did not return saved row.');
    }
    const next = attachInvoiceLinkNames([mapInvoiceRow(row)], projects, companies, people, deals)[0];
    setInvoices((current) => [next, ...current]);
    return next;
  };

  const updateInvoice = async (id: string, input: Partial<InvoiceInput>) => {
    if (input.invoiceNumber !== undefined && !String(input.invoiceNumber || '').trim()) {
      throw new Error('Invoice number is required.');
    }

    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Invoice title is required.');
    }

    if (isValidUuid(id)) {
      const row = await syncUpdate('invoices', id, toInvoiceDb(input, { forUpdate: true }));
      const next = attachInvoiceLinkNames([mapInvoiceRow(row)], projects, companies, people, deals)[0];
      setInvoices((current) => current.map((item) => (item.id === id ? next : item)));
      return next;
    }
    throw new Error('Cannot update invoice without a valid id.');
  };

  const deleteInvoice = async (id: string) => {
    const confirmed = window.confirm('Delete this invoice and its line items?');
    if (!confirmed) return;

    const relatedItems = invoiceItems.filter((item) => item.invoiceId === id);
    if (relatedItems.length > 0) {
      for (const item of relatedItems) {
        await syncDelete('invoice_items', item.id);
      }
    }

    await syncDelete('invoices', id);
    setInvoices((current) => current.filter((item) => item.id !== id));
    setInvoiceItems((current) => current.filter((item) => item.invoiceId !== id));
  };

  const addInvoiceItem = async (input: InvoiceItemInput) => {
    if (!String(input.invoiceId || '').trim()) {
      throw new Error('Select an invoice before adding line items.');
    }

    if (!String(input.description || '').trim()) {
      throw new Error('Line item description is required.');
    }

    const row = await syncInsert('invoice_items', toInvoiceItemDb(input));
    const next = mapInvoiceItemRow(row);
    setInvoiceItems((current) => [next, ...current.filter((item) => item.id !== next.id)]);
    return next;
  };

  const updateInvoiceItem = async (id: string, input: Partial<InvoiceItemInput>) => {
    if (input.description !== undefined && !String(input.description || '').trim()) {
      throw new Error('Line item description is required.');
    }

    if (isValidUuid(id)) {
      const row = await syncUpdate('invoice_items', id, toInvoiceItemDb(input, { forUpdate: true }));
      const next = mapInvoiceItemRow(row);
      setInvoiceItems((current) => current.map((item) => (item.id === id ? next : item)));
      return next;
    }
    throw new Error('Cannot update invoice item without a valid id.');
  };

  const deleteInvoiceItem = async (id: string, skipConfirm = false) => {
    const confirmed = skipConfirm || window.confirm('Delete this line item?');
    if (!confirmed) return;
    if (!isValidUuid(id)) return;
    await syncDelete('invoice_items', id);
    setInvoiceItems((current) => current.filter((item) => item.id !== id));
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

  // ── Finance Periods CRUD ──

  const addFinancePeriod = async (input: Partial<FinancePeriod>) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Period title is required.');
    }
    const row = await syncInsert('finance_periods', {
      title: String(input.title || '').trim(),
      type: input.type || 'monthly',
      start_date: toNullableString(input.startDate),
      end_date: toNullableString(input.endDate),
      status: input.status || 'active',
      focus: toNullableString(input.focus),
      target_income: toNullableNumber(input.targetIncome),
      target_expenses: toNullableNumber(input.targetExpenses),
      target_savings: toNullableNumber(input.targetSavings),
      target_investment: toNullableNumber(input.targetInvestment),
      review_notes: toNullableString(input.reviewNotes),
    });
    const next: FinancePeriod = {
      id: String(row?.id ?? ''),
      title: String(row?.title ?? ''),
      type: String(row?.type ?? 'monthly'),
      startDate: row?.start_date ?? row?.startDate ?? undefined,
      endDate: row?.end_date ?? row?.endDate ?? undefined,
      status: row?.status ?? 'active',
      focus: row?.focus ?? undefined,
      targetIncome: row?.target_income != null ? Number(row.target_income) : (row?.targetIncome != null ? Number(row.targetIncome) : undefined),
      targetExpenses: row?.target_expenses != null ? Number(row.target_expenses) : (row?.targetExpenses != null ? Number(row.targetExpenses) : undefined),
      targetSavings: row?.target_savings != null ? Number(row.target_savings) : (row?.targetSavings != null ? Number(row.targetSavings) : undefined),
      targetInvestment: row?.target_investment != null ? Number(row.target_investment) : (row?.targetInvestment != null ? Number(row.targetInvestment) : undefined),
      reviewNotes: row?.review_notes ?? row?.reviewNotes ?? undefined,
      createdAt: row?.created_at ?? row?.createdAt ?? undefined,
      updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
    };
    setFinancePeriods((current) => [next, ...current]);
    return next;
  };

  const updateFinancePeriod = async (id: string, input: Partial<FinancePeriod>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Period title is required.');
    }
    const payload: Record<string, unknown> = {};
    if (input.title !== undefined) payload.title = String(input.title || '').trim();
    if (input.type !== undefined) payload.type = input.type;
    if (input.startDate !== undefined) payload.start_date = toNullableString(input.startDate);
    if (input.endDate !== undefined) payload.end_date = toNullableString(input.endDate);
    if (input.status !== undefined) payload.status = input.status;
    if (input.focus !== undefined) payload.focus = toNullableString(input.focus);
    if (input.targetIncome !== undefined) payload.target_income = toNullableNumber(input.targetIncome);
    if (input.targetExpenses !== undefined) payload.target_expenses = toNullableNumber(input.targetExpenses);
    if (input.targetSavings !== undefined) payload.target_savings = toNullableNumber(input.targetSavings);
    if (input.targetInvestment !== undefined) payload.target_investment = toNullableNumber(input.targetInvestment);
    if (input.reviewNotes !== undefined) payload.review_notes = toNullableString(input.reviewNotes);
    const row = await syncUpdate('finance_periods', id, payload);
    const next: FinancePeriod = {
      id: String(row?.id ?? ''),
      title: String(row?.title ?? ''),
      type: String(row?.type ?? 'monthly'),
      startDate: row?.start_date ?? row?.startDate ?? undefined,
      endDate: row?.end_date ?? row?.endDate ?? undefined,
      status: row?.status ?? 'active',
      focus: row?.focus ?? undefined,
      targetIncome: row?.target_income != null ? Number(row.target_income) : (row?.targetIncome != null ? Number(row.targetIncome) : undefined),
      targetExpenses: row?.target_expenses != null ? Number(row.target_expenses) : (row?.targetExpenses != null ? Number(row.targetExpenses) : undefined),
      targetSavings: row?.target_savings != null ? Number(row.target_savings) : (row?.targetSavings != null ? Number(row.targetSavings) : undefined),
      targetInvestment: row?.target_investment != null ? Number(row.target_investment) : (row?.targetInvestment != null ? Number(row.targetInvestment) : undefined),
      reviewNotes: row?.review_notes ?? row?.reviewNotes ?? undefined,
      createdAt: row?.created_at ?? row?.createdAt ?? undefined,
      updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
    };
    setFinancePeriods((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteFinancePeriod = async (id: string) => {
    const confirmed = window.confirm('Delete this financial period?');
    if (!confirmed) return;
    await syncDelete('finance_periods', id);
    setFinancePeriods((current) => current.filter((item) => item.id !== id));
  };

  // ── Finance Recurring Rules CRUD ──

  const addFinanceRecurringRule = async (input: Partial<FinanceRecurringRule>) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Recurring rule title is required.');
    }
    const row = await syncInsert('finance_recurring_rules', financeRecurringRuleToDb(input));
    const next = attachFinanceRecurringRuleLinkNames([financeRecurringRuleFromDb(row)], projects, companies)[0];
    setFinanceRecurringRules((current) => [next, ...current]);
    return next;
  };

  const updateFinanceRecurringRule = async (id: string, input: Partial<FinanceRecurringRule>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Recurring rule title is required.');
    }
    const row = await syncUpdate('finance_recurring_rules', id, financeRecurringRuleToDb(input));
    const next = attachFinanceRecurringRuleLinkNames([financeRecurringRuleFromDb(row)], projects, companies)[0];
    setFinanceRecurringRules((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteFinanceRecurringRule = async (id: string) => {
    const confirmed = window.confirm('Delete this recurring rule?');
    if (!confirmed) return;
    await syncDelete('finance_recurring_rules', id);
    setFinanceRecurringRules((current) => current.filter((item) => item.id !== id));
  };

  // ── Tasks CRUD ──

  const addTask = async (input: TaskInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Task title is required.');
    }
    const row = await syncInsert('tasks', taskToDb(input));
    const next = attachTaskLinkNames([taskFromDb(row)], projects, plans, strategyGoals, companies, people, generatedDocuments)[0];
    setTasks((current) => [next, ...current]);
    return next;
  };

  const updateTask = async (id: string, input: Partial<TaskInput>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Task title is required.');
    }
    const row = await syncUpdate('tasks', id, taskToDb(input));
    const next = attachTaskLinkNames([taskFromDb(row)], projects, plans, strategyGoals, companies, people, generatedDocuments)[0];
    setTasks((current) => current.map((t) => (t.id === id ? next : t)));
    return next;
  };

  const deleteTask = async (id: string) => {
    const confirmed = window.confirm('Delete this task?');
    if (!confirmed) return;
    await syncDelete('tasks' as any, id);
    setTasks((current) => current.filter((t) => t.id !== id));
  };

  // ── Recurring Tasks CRUD ──

  const addRecurringTask = async (input: RecurringTaskInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Recurring task title is required.');
    }
    const row = await syncInsert('recurring_tasks', recurringTaskToDb(input));
    const next = attachRecurringTaskLinkNames([recurringTaskFromDb(row)], projects, plans, strategyGoals, companies, people)[0];
    setRecurringTasks((current) => [next, ...current]);
    return next;
  };

  const updateRecurringTask = async (id: string, input: Partial<RecurringTaskInput>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Recurring task title is required.');
    }
    const row = await syncUpdate('recurring_tasks', id, recurringTaskToDb(input));
    const next = attachRecurringTaskLinkNames([recurringTaskFromDb(row)], projects, plans, strategyGoals, companies, people)[0];
    setRecurringTasks((current) => current.map((t) => (t.id === id ? next : t)));
    return next;
  };

  const deleteRecurringTask = async (id: string) => {
    const confirmed = window.confirm('Delete this recurring task rule?');
    if (!confirmed) return;
    await syncDelete('recurring_tasks' as any, id);
    setRecurringTasks((current) => current.filter((t) => t.id !== id));
  };

  // ── Recurring Task Logs CRUD ──

  const addRecurringTaskLog = async (input: RecurringTaskLogInput) => {
    const row = await syncInsert('recurring_task_logs', recurringTaskLogToDb(input));
    const next = recurringTaskLogFromDb(row);
    setRecurringTaskLogs((current) => [...current, next]);
    return next;
  };

  const updateRecurringTaskLog = async (id: string, input: Partial<RecurringTaskLogInput>) => {
    const row = await syncUpdate('recurring_task_logs', id, recurringTaskLogToDb(input));
    const next = recurringTaskLogFromDb(row);
    setRecurringTaskLogs((current) => current.map((l) => (l.id === id ? next : l)));
    return next;
  };

  const deleteRecurringTaskLog = async (id: string) => {
    await syncDelete('recurring_task_logs' as any, id);
    setRecurringTaskLogs((current) => current.filter((l) => l.id !== id));
  };

  // ── Task Work Logs CRUD ──

  const addTaskWorkLog = async (input: TaskWorkLogInput) => {
    const row = await syncInsert('task_work_logs', taskWorkLogToDb(input));
    const next = taskWorkLogFromDb(row);
    setTaskWorkLogs((current) => [...current, next]);
    return next;
  };

  const updateTaskWorkLog = async (id: string, input: Partial<TaskWorkLogInput>) => {
    const row = await syncUpdate('task_work_logs', id, taskWorkLogToDb(input));
    const next = taskWorkLogFromDb(row);
    setTaskWorkLogs((current) => current.map((l) => (l.id === id ? next : l)));
    return next;
  };

  const deleteTaskWorkLog = async (id: string) => {
    await syncDelete('task_work_logs' as any, id);
    setTaskWorkLogs((current) => current.filter((l) => l.id !== id));
  };

  // ── Weekly Task Reviews CRUD ──

  const addWeeklyTaskReview = async (input: WeeklyTaskReviewInput) => {
    const row = await syncInsert('weekly_task_reviews', weeklyTaskReviewToDb(input));
    const next = weeklyTaskReviewFromDb(row);
    setWeeklyTaskReviews((current) => [...current, next]);
    return next;
  };

  const updateWeeklyTaskReview = async (id: string, input: Partial<WeeklyTaskReviewInput>) => {
    const row = await syncUpdate('weekly_task_reviews', id, weeklyTaskReviewToDb(input));
    const next = weeklyTaskReviewFromDb(row);
    setWeeklyTaskReviews((current) => current.map((r) => (r.id === id ? next : r)));
    return next;
  };

  const deleteWeeklyTaskReview = async (id: string) => {
    await syncDelete('weekly_task_reviews' as any, id);
    setWeeklyTaskReviews((current) => current.filter((r) => r.id !== id));
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
    await syncDelete('message_templates', id);
    setTemplates((current) => current.filter((template) => template.id !== id));
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
    setTasks((current) => {
      const next = attachTaskLinkNames(current, projects, plans, strategyGoals, companies, people, generatedDocuments);
      return shouldReplaceCollection(current, next, ['linkedProjectName', 'linkedPlanTitle', 'linkedStrategyGoalTitle', 'linkedCompanyName', 'linkedPersonName', 'linkedDocumentTitle']) ? next : current;
    });
    setRecurringTasks((current) => {
      const next = attachRecurringTaskLinkNames(current, projects, plans, strategyGoals, companies, people);
      return shouldReplaceCollection(current, next, ['linkedProjectName', 'linkedPlanTitle', 'linkedStrategyGoalTitle', 'linkedCompanyName', 'linkedPersonName']) ? next : current;
    });
  }, [projects, plans, strategyGoals, companies, people, generatedDocuments]);

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
    setFinanceRecurringRules((current) => {
      const next = attachFinanceRecurringRuleLinkNames(current, projects, companies);
      return shouldReplaceCollection(current, next, ['linkedProjectName', 'linkedCompanyName']) ? next : current;
    });
  }, [projects, companies]);

  useEffect(() => {
    setDocuments((current) => {
      const next = attachDocumentLinkNames(current, projects, companies, people, deals);
      return shouldReplaceCollection(current, next, ['relatedProjectName', 'relatedCompanyName', 'relatedPersonName', 'relatedDealName']) ? next : current;
    });
  }, [projects, companies, people, deals]);

  useEffect(() => {
    setGeneratedDocuments((current) => {
      const next = attachGeneratedDocumentLinkNames(current, documentTemplates, projects, companies, people, deals);
      return shouldReplaceCollection(current, next, ['templateName', 'relatedProjectName', 'relatedCompanyName', 'relatedPersonName', 'relatedDealName']) ? next : current;
    });
  }, [documentTemplates, projects, companies, people, deals]);

  useEffect(() => {
    setInvoices((current) => {
      const next = attachInvoiceLinkNames(current, projects, companies, people, deals);
      return shouldReplaceCollection(current, next, ['relatedProjectName', 'relatedCompanyName', 'relatedPersonName', 'relatedDealName']) ? next : current;
    });
  }, [projects, companies, people, deals]);

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

  useEffect(() => {
    setSmartNotes((current) => {
      const next = attachSmartNoteLinkNames(current, noteCategories, projects, companies, people, relationships, tasks, strategyGoals, plans);
      return shouldReplaceCollection(current, next, ['categoryName', 'categorySlug', 'categoryColor', 'linkedProjectName', 'linkedCompanyName', 'linkedPersonName', 'linkedRelationshipName', 'linkedTaskTitle', 'linkedStrategyGoalTitle', 'linkedPlanTitle']) ? next : current;
    });
  }, [noteCategories, projects, companies, people, relationships, tasks, strategyGoals, plans]);

  useEffect(() => {
    setContentItems((current) => {
      const next = attachContentItemLinkNames(current, socialPlatforms, contentPillars, projects, smartNotes, companies);
      return shouldReplaceCollection(current, next, ['platformName', 'pillarName', 'linkedProjectName', 'linkedNoteTitle', 'linkedCompanyName']) ? next : current;
    });
  }, [socialPlatforms, contentPillars, projects, smartNotes, companies]);

  // ── Social Media CRUD ──

  const addSocialPlatform = async (input: SocialPlatformInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Platform name is required.');
    }
    if (!String(input.slug || '').trim()) {
      throw new Error('Platform slug is required.');
    }
    const row = await syncInsert('social_platforms', socialPlatformToDb(input));
    const next = socialPlatformFromDb(row);
    setSocialPlatforms((current) => [next, ...current]);
    return next;
  };

  const updateSocialPlatform = async (id: string, input: Partial<SocialPlatformInput>) => {
    if (input.name !== undefined && !String(input.name || '').trim()) {
      throw new Error('Platform name is required.');
    }
    const row = await syncUpdate('social_platforms', id, socialPlatformToDb(input));
    const next = socialPlatformFromDb(row);
    setSocialPlatforms((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteSocialPlatform = async (id: string) => {
    const confirmed = window.confirm('Delete this platform?');
    if (!confirmed) return;
    await syncDelete('social_platforms' as any, id);
    setSocialPlatforms((current) => current.filter((item) => item.id !== id));
  };

  const addSocialPerson = async (input: SocialPersonInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Person name is required.');
    }
    const row = await syncInsert('social_people', socialPersonToDb(input));
    const next = socialPersonFromDb(row);
    setSocialPeople((current) => [next, ...current]);
    return next;
  };

  const updateSocialPerson = async (id: string, input: Partial<SocialPersonInput>) => {
    if (input.name !== undefined && !String(input.name || '').trim()) {
      throw new Error('Person name is required.');
    }
    const row = await syncUpdate('social_people', id, socialPersonToDb(input));
    const next = socialPersonFromDb(row);
    setSocialPeople((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteSocialPerson = async (id: string) => {
    const confirmed = window.confirm('Delete this social media person?');
    if (!confirmed) return;
    await syncDelete('social_people' as any, id);
    setSocialPeople((current) => current.filter((item) => item.id !== id));
  };

  const addSocialWeeklyTask = async (input: SocialWeeklyTaskInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Task title is required.');
    }
    const row = await syncInsert('social_weekly_tasks', socialWeeklyTaskToDb(input));
    const next = socialWeeklyTaskFromDb(row);
    setSocialWeeklyTasks((current) => [...current, next]);
    return next;
  };

  const updateSocialWeeklyTask = async (id: string, input: Partial<SocialWeeklyTaskInput>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Task title is required.');
    }
    const row = await syncUpdate('social_weekly_tasks', id, socialWeeklyTaskToDb(input));
    const next = socialWeeklyTaskFromDb(row);
    setSocialWeeklyTasks((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteSocialWeeklyTask = async (id: string) => {
    await syncDelete('social_weekly_tasks' as any, id);
    setSocialWeeklyTasks((current) => current.filter((item) => item.id !== id));
  };

  const addContentPillar = async (input: ContentPillarInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Pillar name is required.');
    }
    if (!String(input.slug || '').trim()) {
      throw new Error('Pillar slug is required.');
    }
    const row = await syncInsert('content_pillars', contentPillarToDb(input));
    const next = contentPillarFromDb(row);
    setContentPillars((current) => [next, ...current]);
    return next;
  };

  const updateContentPillar = async (id: string, input: Partial<ContentPillarInput>) => {
    if (input.name !== undefined && !String(input.name || '').trim()) {
      throw new Error('Pillar name is required.');
    }
    const row = await syncUpdate('content_pillars', id, contentPillarToDb(input));
    const next = contentPillarFromDb(row);
    setContentPillars((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteContentPillar = async (id: string) => {
    const confirmed = window.confirm('Delete this pillar?');
    if (!confirmed) return;
    await syncDelete('content_pillars' as any, id);
    setContentPillars((current) => current.filter((item) => item.id !== id));
  };

  const addContentStrategy = async (input: ContentStrategyInput) => {
    if (!String(input.name || '').trim()) {
      throw new Error('Strategy name is required.');
    }
    const row = await syncInsert('content_strategy', contentStrategyToDb(input));
    const next = contentStrategyFromDb(row);
    setContentStrategies((current) => [next, ...current]);
    return next;
  };

  const updateContentStrategy = async (id: string, input: Partial<ContentStrategyInput>) => {
    if (input.name !== undefined && !String(input.name || '').trim()) {
      throw new Error('Strategy name is required.');
    }
    const row = await syncUpdate('content_strategy', id, contentStrategyToDb(input));
    const next = contentStrategyFromDb(row);
    setContentStrategies((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteContentStrategy = async (id: string) => {
    const confirmed = window.confirm('Delete this strategy?');
    if (!confirmed) return;
    await syncDelete('content_strategy' as any, id);
    setContentStrategies((current) => current.filter((item) => item.id !== id));
  };

  const DEFAULT_WEEKLY_SYSTEM = {
    name: 'Weekly Social Media System',
    targets: { posts: 0, videos: 0, carousels: 0, reels: 0, stories: 0, other: 0 },
    fridayChecklist: [],
    weeklyTasks: [],
    contentTypePlan: [],
    isActive: true,
  };

  const ensureDefaultSocialWeeklySystem = useCallback(async () => {
    const active = socialWeeklySystems.find((s) => s.isActive);
    if (active) return active;
    try {
      const row = await syncInsert('social_weekly_system', DEFAULT_WEEKLY_SYSTEM);
      const next = socialWeeklySystemFromDb(row);
      setSocialWeeklySystems((current) => [next, ...current.filter((s) => s.id !== next.id)]);
      return next;
    } catch {
      return null;
    }
  }, [socialWeeklySystems]);

  const activeSocialWeeklySystem = useMemo(() => socialWeeklySystems.find((s) => s.isActive) || null, [socialWeeklySystems]);

  const addSocialWeeklySystem = async (input: SocialWeeklySystemInput) => {
    const row = await syncInsert('social_weekly_system', socialWeeklySystemToDb(input));
    const next = socialWeeklySystemFromDb(row);
    setSocialWeeklySystems((current) => [next, ...current]);
    return next;
  };

  const updateSocialWeeklySystem = async (id: string, input: Partial<SocialWeeklySystemInput>) => {
    const row = await syncUpdate('social_weekly_system', id, socialWeeklySystemToDb(input));
    if (!row) throw new Error('Empty response from server. Please refresh and try again.');
    const next = socialWeeklySystemFromDb(row);
    setSocialWeeklySystems((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteSocialWeeklySystem = async (id: string) => {
    await syncDelete('social_weekly_system' as any, id);
    setSocialWeeklySystems((current) => current.filter((item) => item.id !== id));
  };

  useEffect(() => {
    if (!loading) {
      ensureDefaultSocialWeeklySystem();
    }
  }, [loading, ensureDefaultSocialWeeklySystem]);

  const addContentItem = async (input: ContentItemInput) => {
    if (!String(input.title || '').trim()) {
      throw new Error('Content title is required.');
    }
    const row = await syncInsert('content_items', contentItemToDb(input));
    let next = contentItemFromDb(row);
    next = attachContentItemLinkNames([next], socialPlatforms, contentPillars, projects, smartNotes, companies)[0];
    setContentItems((current) => [next, ...current]);
    return next;
  };

  const updateContentItem = async (id: string, input: Partial<ContentItemInput>) => {
    if (input.title !== undefined && !String(input.title || '').trim()) {
      throw new Error('Content title is required.');
    }
    const row = await syncUpdate('content_items', id, contentItemToDb(input));
    let next = contentItemFromDb(row);
    next = attachContentItemLinkNames([next], socialPlatforms, contentPillars, projects, smartNotes, companies)[0];
    setContentItems((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteContentItem = async (id: string) => {
    const confirmed = window.confirm('Delete this content item?');
    if (!confirmed) return;
    await syncDelete('content_items' as any, id);
    setContentItems((current) => current.filter((item) => item.id !== id));
  };

  const addWeeklyContentPlan = async (input: WeeklyContentPlanInput) => {
    if (!String(input.weekStart || '').trim()) {
      throw new Error('Week start is required.');
    }
    const row = await syncInsert('weekly_content_plans', weeklyContentPlanToDb(input));
    const next = weeklyContentPlanFromDb(row);
    setWeeklyContentPlans((current) => [next, ...current]);
    return next;
  };

  const updateWeeklyContentPlan = async (id: string, input: Partial<WeeklyContentPlanInput>) => {
    const row = await syncUpdate('weekly_content_plans', id, weeklyContentPlanToDb(input));
    const next = weeklyContentPlanFromDb(row);
    setWeeklyContentPlans((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteWeeklyContentPlan = async (id: string) => {
    const confirmed = window.confirm('Delete this weekly plan?');
    if (!confirmed) return;
    await syncDelete('weekly_content_plans' as any, id);
    setWeeklyContentPlans((current) => current.filter((item) => item.id !== id));
  };

  const addLifeNutritionLog = async (input: LifeNutritionLogInput) => {
    if (!String(input.logDate || '').trim()) throw new Error('Log date is required.');
    if (!String(input.mealType || '').trim()) throw new Error('Meal type is required.');
    const row = await syncInsert('life_nutrition_logs', lifeNutritionLogToDb(input));
    const next = lifeNutritionLogFromDb(row);
    setLifeNutritionLogs((current) => [next, ...current]);
    return next;
  };

  const updateLifeNutritionLog = async (id: string, input: Partial<LifeNutritionLogInput>) => {
    const row = await syncUpdate('life_nutrition_logs', id, lifeNutritionLogToDb(input));
    const next = lifeNutritionLogFromDb(row);
    setLifeNutritionLogs((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteLifeNutritionLog = async (id: string) => {
    const confirmed = window.confirm('Delete this nutrition log?');
    if (!confirmed) return;
    await syncDelete('life_nutrition_logs' as any, id);
    setLifeNutritionLogs((current) => current.filter((item) => item.id !== id));
  };

  const addLifeFitnessLog = async (input: LifeFitnessLogInput) => {
    if (!String(input.workoutDate || '').trim()) throw new Error('Workout date is required.');
    if (!String(input.workoutType || '').trim()) throw new Error('Workout type is required.');
    const row = await syncInsert('life_fitness_logs', lifeFitnessLogToDb(input));
    const next = lifeFitnessLogFromDb(row);
    setLifeFitnessLogs((current) => [next, ...current]);
    return next;
  };

  const updateLifeFitnessLog = async (id: string, input: Partial<LifeFitnessLogInput>) => {
    const row = await syncUpdate('life_fitness_logs', id, lifeFitnessLogToDb(input));
    const next = lifeFitnessLogFromDb(row);
    setLifeFitnessLogs((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteLifeFitnessLog = async (id: string) => {
    const confirmed = window.confirm('Delete this fitness log?');
    if (!confirmed) return;
    await syncDelete('life_fitness_logs' as any, id);
    setLifeFitnessLogs((current) => current.filter((item) => item.id !== id));
  };

  const addLifeDeenLog = async (input: LifeDeenLogInput) => {
    if (!String(input.logDate || '').trim()) throw new Error('Log date is required.');
    const row = await syncInsert('life_deen_logs', lifeDeenLogToDb(input));
    const next = lifeDeenLogFromDb(row);
    setLifeDeenLogs((current) => [...current, next]);
    return next;
  };

  const updateLifeDeenLog = async (id: string, input: Partial<LifeDeenLogInput>) => {
    const row = await syncUpdate('life_deen_logs', id, lifeDeenLogToDb(input));
    const next = lifeDeenLogFromDb(row);
    setLifeDeenLogs((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteLifeDeenLog = async (id: string) => {
    const confirmed = window.confirm('Delete this deen log?');
    if (!confirmed) return;
    await syncDelete('life_deen_logs' as any, id);
    setLifeDeenLogs((current) => current.filter((item) => item.id !== id));
  };

  const addLifeFamilyAction = async (input: LifeFamilyActionInput) => {
    if (!String(input.actionDate || '').trim()) throw new Error('Action date is required.');
    if (!String(input.title || '').trim()) throw new Error('Title is required.');
    if (!String(input.type || '').trim()) throw new Error('Type is required.');
    const row = await syncInsert('life_family_actions', lifeFamilyActionToDb(input));
    const next = lifeFamilyActionFromDb(row);
    setLifeFamilyActions((current) => [next, ...current]);
    return next;
  };

  const updateLifeFamilyAction = async (id: string, input: Partial<LifeFamilyActionInput>) => {
    const row = await syncUpdate('life_family_actions', id, lifeFamilyActionToDb(input));
    const next = lifeFamilyActionFromDb(row);
    setLifeFamilyActions((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteLifeFamilyAction = async (id: string) => {
    const confirmed = window.confirm('Delete this family action?');
    if (!confirmed) return;
    await syncDelete('life_family_actions' as any, id);
    setLifeFamilyActions((current) => current.filter((item) => item.id !== id));
  };

  const addLifeWeeklyReview = async (input: LifeWeeklyReviewInput) => {
    if (!String(input.weekStart || '').trim()) throw new Error('Week start is required.');
    const row = await syncInsert('life_weekly_reviews', lifeWeeklyReviewToDb(input));
    const next = lifeWeeklyReviewFromDb(row);
    setLifeWeeklyReviews((current) => [next, ...current]);
    return next;
  };

  const updateLifeWeeklyReview = async (id: string, input: Partial<LifeWeeklyReviewInput>) => {
    const row = await syncUpdate('life_weekly_reviews', id, lifeWeeklyReviewToDb(input));
    const next = lifeWeeklyReviewFromDb(row);
    setLifeWeeklyReviews((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteLifeWeeklyReview = async (id: string) => {
    const confirmed = window.confirm('Delete this weekly review?');
    if (!confirmed) return;
    await syncDelete('life_weekly_reviews' as any, id);
    setLifeWeeklyReviews((current) => current.filter((item) => item.id !== id));
  };

  // ── Company Contact Methods CRUD ──

  const addCompanyContactMethod = async (input: CompanyContactMethodInput) => {
    if (!input.companyId) throw new Error('Company is required.');
    if (!input.value?.trim()) throw new Error('Value is required.');
    const row = await syncInsert('company_contact_methods', companyContactMethodToDb(input));
    const next = companyContactMethodFromDb(row);
    setCompanyContactMethods((current) => [next, ...current]);
    return next;
  };

  const updateCompanyContactMethod = async (id: string, input: Partial<CompanyContactMethodInput>) => {
    const row = await syncUpdate('company_contact_methods', id, companyContactMethodToDb(input));
    const next = companyContactMethodFromDb(row);
    setCompanyContactMethods((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteCompanyContactMethod = async (id: string) => {
    await syncDelete('company_contact_methods' as any, id);
    setCompanyContactMethods((current) => current.filter((item) => item.id !== id));
  };

  // ── Company Problem Profiles CRUD ──

  const addCompanyProblemProfile = async (input: CompanyProblemProfileInput) => {
    if (!input.companyId) throw new Error('Company is required.');
    if (!input.problemTitle?.trim()) throw new Error('Problem title is required.');
    const row = await syncInsert('company_problem_profiles', companyProblemProfileToDb(input));
    const next = companyProblemProfileFromDb(row);
    setCompanyProblemProfiles((current) => [next, ...current]);
    return next;
  };

  const updateCompanyProblemProfile = async (id: string, input: Partial<CompanyProblemProfileInput>) => {
    const row = await syncUpdate('company_problem_profiles', id, companyProblemProfileToDb(input));
    const next = companyProblemProfileFromDb(row);
    setCompanyProblemProfiles((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteCompanyProblemProfile = async (id: string) => {
    await syncDelete('company_problem_profiles' as any, id);
    setCompanyProblemProfiles((current) => current.filter((item) => item.id !== id));
  };

  // ── Company Outreach Scripts CRUD ──

  const addCompanyOutreachScript = async (input: CompanyOutreachScriptInput) => {
    if (!input.companyId) throw new Error('Company is required.');
    if (!input.name?.trim()) throw new Error('Name is required.');
    const row = await syncInsert('company_outreach_scripts', companyOutreachScriptToDb(input));
    const next = companyOutreachScriptFromDb(row);
    setCompanyOutreachScripts((current) => [next, ...current]);
    return next;
  };

  const updateCompanyOutreachScript = async (id: string, input: Partial<CompanyOutreachScriptInput>) => {
    const row = await syncUpdate('company_outreach_scripts', id, companyOutreachScriptToDb(input));
    const next = companyOutreachScriptFromDb(row);
    setCompanyOutreachScripts((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteCompanyOutreachScript = async (id: string) => {
    await syncDelete('company_outreach_scripts' as any, id);
    setCompanyOutreachScripts((current) => current.filter((item) => item.id !== id));
  };

  // ── Desktop ──

  const addDesktopShortcut = async (input: DesktopShortcutInput) => {
    const row = await syncInsert('desktop_shortcuts', desktopShortcutToDb(input));
    const next = desktopShortcutFromDb(row);
    setDesktopShortcuts((current) => [next, ...current]);
    return next;
  };

  const updateDesktopShortcut = async (id: string, input: Partial<DesktopShortcutInput>) => {
    const row = await syncUpdate('desktop_shortcuts', id, desktopShortcutToDb(input as DesktopShortcutInput));
    const next = desktopShortcutFromDb(row);
    setDesktopShortcuts((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteDesktopShortcut = async (id: string) => {
    await syncDelete('desktop_shortcuts' as any, id);
    setDesktopShortcuts((current) => current.filter((item) => item.id !== id));
  };

  const updateDesktopSettings = async (input: DesktopSettingsInput) => {
    const existing = desktopSettings;
    if (existing?.id) {
      const row = await syncUpdate('desktop_settings', existing.id, desktopSettingsToDb(input));
      const next = desktopSettingsFromDb(row);
      setDesktopSettings(next);
      return next;
    }
    const row = await syncInsert('desktop_settings', desktopSettingsToDb(input));
    const next = desktopSettingsFromDb(row);
    setDesktopSettings(next);
    return next;
  };

  const addDesktopGroup = async (input: DesktopGroupInput) => {
    const row = await syncInsert('desktop_groups', desktopGroupToDb(input));
    const next = desktopGroupFromDb(row);
    setDesktopGroups((current) => [next, ...current]);
    return next;
  };

  const updateDesktopGroup = async (id: string, input: Partial<DesktopGroupInput>) => {
    const row = await syncUpdate('desktop_groups', id, desktopGroupToDb(input as DesktopGroupInput));
    const next = desktopGroupFromDb(row);
    setDesktopGroups((current) => current.map((item) => (item.id === id ? next : item)));
    return next;
  };

  const deleteDesktopGroup = async (id: string) => {
    await syncDelete('desktop_groups' as any, id);
    setDesktopGroups((current) => current.filter((item) => item.id !== id));
  };

  const resetToSeedData = () => {
    console.warn('Database reset is not implemented yet.');
    const fallback = cloneSeedData();
    setCompanies(fallback.companies);
    setPeople(fallback.people);
    setMessages(fallback.messages);
    setDeals(fallback.deals);
    setRelationships(fallback.relationships);
    setRelationshipInteractions(fallback.relationshipInteractions);
    setRelationshipOpportunities(fallback.relationshipOpportunities);
    setRelationshipCategories(fallback.relationshipCategories);
    setRelationshipContactMethods(fallback.relationshipContactMethods);
    setNoteCategories(fallback.noteCategories);
    setSmartNotes(fallback.smartNotes);
    setNoteAttachments(fallback.noteAttachments);
    setNoteBlocks(fallback.noteBlocks);
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
    setFinanceRecurringRules(fallback.financeRecurringRules);
    setStrategyItems(fallback.strategyItems);
    setDocuments(fallback.documents);
    setDocumentTemplates(fallback.documentTemplates);
    setDocumentBrandSettings(fallback.documentBrandSettings);
    setGeneratedDocuments(fallback.generatedDocuments);
    setInvoices(fallback.invoices);
    setInvoiceItems(fallback.invoiceItems);
    setLifeNutritionLogs(fallback.lifeNutritionLogs);
    setLifeFitnessLogs(fallback.lifeFitnessLogs);
    setLifeDeenLogs(fallback.lifeDeenLogs);
    setLifeFamilyActions(fallback.lifeFamilyActions);
    setLifeWeeklyReviews(fallback.lifeWeeklyReviews);
    setCompanyContactMethods(fallback.companyContactMethods);
    setCompanyProblemProfiles(fallback.companyProblemProfiles);
    setCompanyOutreachScripts(fallback.companyOutreachScripts);
  };

  return {
    companies,
    people,
    messages,
    deals,
    relationships,
    relationshipInteractions,
    relationshipOpportunities,
    relationshipCategories,
    relationshipContactMethods,
    noteCategories,
    smartNotes,
    noteAttachments,
    noteBlocks,
    projects,
    projectTasks,
    projectTimeLogs,
    projectMeetings,
    projectDocuments,
    projectFinanceItems,
    documents,
    documentTemplates,
    documentBrandSettings,
    aiProviderKeys,
    aiUseCaseSettings,
    generatedDocuments,
    invoices,
    invoiceItems,
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
    financePeriods,
    financeRecurringRules,
    tasks,
    recurringTasks,
    addTask,
    updateTask,
    deleteTask,
    addRecurringTask,
    updateRecurringTask,
    deleteRecurringTask,
    recurringTaskLogs,
    addRecurringTaskLog,
    updateRecurringTaskLog,
    deleteRecurringTaskLog,
    taskWorkLogs,
    weeklyTaskReviews,
    addTaskWorkLog,
    updateTaskWorkLog,
    deleteTaskWorkLog,
    addWeeklyTaskReview,
    updateWeeklyTaskReview,
    deleteWeeklyTaskReview,
    addFinanceRecurringRule,
    updateFinanceRecurringRule,
    deleteFinanceRecurringRule,
    addFinancePeriod,
    updateFinancePeriod,
    deleteFinancePeriod,
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
    addRelationship,
    updateRelationship,
    deleteRelationship,
    addRelationshipInteraction,
    updateRelationshipInteraction,
    deleteRelationshipInteraction,
    addRelationshipOpportunity,
    updateRelationshipOpportunity,
    deleteRelationshipOpportunity,
    addRelationshipCategory,
    updateRelationshipCategory,
    deleteRelationshipCategory,
    addRelationshipContactMethod,
    updateRelationshipContactMethod,
    deleteRelationshipContactMethod,
    addNoteCategory,
    updateNoteCategory,
    deleteNoteCategory,
    addSmartNote,
    updateSmartNote,
    deleteSmartNote,
    addNoteAttachment,
    updateNoteAttachment,
    deleteNoteAttachment,
    addNoteBlock,
    updateNoteBlock,
    deleteNoteBlock,
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
    addDocument,
    updateDocument,
    deleteDocument,
    addDocumentTemplate,
    updateDocumentTemplate,
    deleteDocumentTemplate,
    addDocumentBrandSettings,
    updateDocumentBrandSettings,
    deleteDocumentBrandSettings,
    addAIProviderKey,
    updateAIProviderKey,
    deleteAIProviderKey,
    testAIProviderKey,
    addAIUseCaseSetting,
    updateAIUseCaseSetting,
    deleteAIUseCaseSetting,
    addGeneratedDocument,
    updateGeneratedDocument,
    deleteGeneratedDocument,
    addInvoice,
    updateInvoice,
    deleteInvoice,
    addInvoiceItem,
    updateInvoiceItem,
    deleteInvoiceItem,
    updateTemplate,
    deleteTemplate,
    seedDefaultTemplates,
    resetToSeedData,
    loading,
    error,
    loadedScopes,
    socialPlatforms,
    socialPeople,
    contentPillars,
    contentStrategies,
    contentItems,
    weeklyContentPlans,
    socialWeeklySystems,
    socialWeeklyTasks,
    addSocialWeeklyTask,
    updateSocialWeeklyTask,
    deleteSocialWeeklyTask,
    activeSocialWeeklySystem,
    addSocialWeeklySystem,
    updateSocialWeeklySystem,
    deleteSocialWeeklySystem,
    ensureDefaultSocialWeeklySystem,
    addSocialPlatform,
    updateSocialPlatform,
    deleteSocialPlatform,
    addSocialPerson,
    updateSocialPerson,
    deleteSocialPerson,
    addContentPillar,
    updateContentPillar,
    deleteContentPillar,
    addContentStrategy,
    updateContentStrategy,
    deleteContentStrategy,
    addContentItem,
    updateContentItem,
    deleteContentItem,
    addWeeklyContentPlan,
    updateWeeklyContentPlan,
    deleteWeeklyContentPlan,
    lifeNutritionLogs,
    lifeFitnessLogs,
    lifeDeenLogs,
    lifeFamilyActions,
    lifeWeeklyReviews,
    addLifeNutritionLog,
    updateLifeNutritionLog,
    deleteLifeNutritionLog,
    addLifeFitnessLog,
    updateLifeFitnessLog,
    deleteLifeFitnessLog,
    addLifeDeenLog,
    updateLifeDeenLog,
    deleteLifeDeenLog,
    addLifeFamilyAction,
    updateLifeFamilyAction,
    deleteLifeFamilyAction,
    addLifeWeeklyReview,
    updateLifeWeeklyReview,
    deleteLifeWeeklyReview,
    companyContactMethods,
    addCompanyContactMethod,
    updateCompanyContactMethod,
    deleteCompanyContactMethod,
    personContactMethods,
    addPersonContactMethod,
    updatePersonContactMethod,
    deletePersonContactMethod,
    companyProblemProfiles,
    addCompanyProblemProfile,
    updateCompanyProblemProfile,
    deleteCompanyProblemProfile,
    companyOutreachScripts,
    addCompanyOutreachScript,
    updateCompanyOutreachScript,
    deleteCompanyOutreachScript,
    desktopShortcuts,
    desktopSettings,
    desktopGroups,
    addDesktopShortcut,
    updateDesktopShortcut,
    deleteDesktopShortcut,
    updateDesktopSettings,
    addDesktopGroup,
    updateDesktopGroup,
    deleteDesktopGroup,
  };
};

export default useOpportunitiesData;