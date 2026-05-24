import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const allowedEntities = new Set([
  'companies',
  'people',
  'messages',
  'deals',
  'projects',
  'message_templates',
  'project_tasks',
  'project_time_logs',
  'project_meetings',
  'project_documents',
  'project_finance_items',
  'documents',
  'document_templates',
  'document_brand_settings',
  'generated_documents',
  'invoices',
  'invoice_items',
  'strategy_items',
  'strategy_goals',
  'strategy_plans',
  'strategy_tactics',
  'strategy_experiments',
  'strategy_decisions',
  'relationships',
  'relationship_interactions',
  'relationship_opportunities',
  'relationship_categories',
  'relationship_contact_methods',
  'plans',
  'plan_items',
  'finance_income',
  'finance_expenses',
  'finance_allocation_rules',
  'finance_purchase_goals',
  'finance_investment_ideas',
  'finance_investment_rules',
  'finance_investment_allocations',
  'finance_periods',
  'finance_recurring_rules',
  'ai_use_case_settings',
  'tasks',
  'recurring_tasks',
  'recurring_task_logs',
  'task_work_logs',
  'weekly_task_reviews',
]);
const tablesAttempted = [
  'companies',
  'people',
  'messages',
  'deals',
  'projects',
  'message_templates',
  'project_tasks',
  'project_time_logs',
  'project_meetings',
  'project_documents',
  'project_finance_items',
  'documents',
  'document_templates',
  'document_brand_settings',
  'generated_documents',
  'invoices',
  'invoice_items',
  'strategy_items',
  'strategy_goals',
  'strategy_plans',
  'strategy_tactics',
  'strategy_experiments',
  'strategy_decisions',
  'relationships',
  'relationship_interactions',
  'relationship_opportunities',
  'relationship_categories',
  'relationship_contact_methods',
  'plans',
  'plan_items',
  'finance_income',
  'finance_expenses',
  'finance_allocation_rules',
  'finance_purchase_goals',
  'finance_investment_ideas',
  'finance_investment_rules',
  'finance_investment_allocations',
  'finance_periods',
  'finance_recurring_rules',
  'ai_provider_keys',
  'ai_use_case_settings',
  'tasks',
  'recurring_tasks',
  'recurring_task_logs',
  'task_work_logs',
  'weekly_task_reviews',
];
const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false },
  });
};

const getEnvPresence = () => ({
  SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
  SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY),
});

const isDebugEnabled = (req) => req?.query?.debug === '1' || req?.query?.debug === 1;

const buildMutationFailurePayload = ({ entity, action, error }) => ({
  success: false,
  error: action === 'update' ? 'Unable to update Opportunities data.' : action === 'delete' ? 'Unable to delete Opportunities data.' : 'Unable to save Opportunities data.',
  entity,
  action,
  errorCode: error?.code ?? null,
});

const buildFailurePayload = ({ debug, failedTable, error, envPresent, entityErrors, phase }) => ({
  success: false,
  ...(debug
    ? {
        envPresent,
        tablesAttempted,
        failedTable,
        errorCode: error?.code ?? null,
        errorMessage: error?.message ?? 'Unable to query Opportunities data.',
        errorDetails: error?.details ?? null,
        ...(phase ? { phase } : {}),
        ...(entityErrors ? { entityErrors } : {}),
      }
    : {
        failedTable,
        error: 'Unable to load Opportunities data from Supabase.',
      }),
});

const readBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') return req.body;
  return {};
};

const toSafeJson = (res, status, body) => res.status(status).json(body);

const toNullableString = (value) => {
  if (value == null) return null;
  const parsed = String(value).trim();
  return parsed.length > 0 ? parsed : null;
};

const toRequiredString = (value, fallback = '') => {
  const parsed = toNullableString(value);
  return parsed ?? fallback;
};

const normalizeTemplateRow = (row, { forUpdate = false } = {}) => {
  const base = {
    name: toRequiredString(row?.name),
    audience: toRequiredString(row?.audience),
    goal: toRequiredString(row?.goal),
    language: toRequiredString(row?.language),
    subject: toNullableString(row?.subject),
    body: toRequiredString(row?.body),
    is_active: row?.is_active == null ? true : Boolean(row.is_active),
    updated_at: new Date().toISOString(),
  };

  if (forUpdate) {
    return base;
  }

  return {
    id: row?.id ?? randomUUID(),
    ...base,
    created_at: row?.created_at ?? new Date().toISOString(),
  };
};

const normalizeStrategyRow = (row) => ({
  section: toRequiredString(row?.section),
  title: toRequiredString(row?.title),
  content: toNullableString(row?.content),
  priority: toNullableString(row?.priority) || 'medium',
  status: toNullableString(row?.status) || 'active',
  time_horizon: toNullableString(row?.time_horizon ?? row?.timeHorizon),
  review_date: toNullableString(row?.review_date ?? row?.reviewDate),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
  linked_company_id: toNullableString(row?.linked_company_id ?? row?.linkedCompanyId),
  linked_person_id: toNullableString(row?.linked_person_id ?? row?.linkedPersonId),
});

const toNullableNumber = (value) => {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeStrategyGoalRow = (row) => ({
  title: toRequiredString(row?.title),
  description: toNullableString(row?.description),
  category: toRequiredString(row?.category),
  priority: toNullableString(row?.priority) || 'medium',
  status: toNullableString(row?.status) || 'active',
  time_horizon: toNullableString(row?.time_horizon ?? row?.timeHorizon),
  progress: toNullableNumber(row?.progress),
  target_date: toNullableString(row?.target_date ?? row?.targetDate),
  success_metric: toNullableString(row?.success_metric ?? row?.successMetric),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
  linked_company_id: toNullableString(row?.linked_company_id ?? row?.linkedCompanyId),
});

const normalizeStrategyPlanRow = (row) => ({
  name: toRequiredString(row?.name),
  label: toNullableString(row?.label) || 'A',
  description: toNullableString(row?.description),
  status: toNullableString(row?.status) || 'planned',
  priority: toNullableString(row?.priority) || 'medium',
  assumptions: toNullableString(row?.assumptions),
  risks: toNullableString(row?.risks),
  resources_needed: toNullableString(row?.resources_needed ?? row?.resourcesNeeded),
  trigger_to_switch: toNullableString(row?.trigger_to_switch ?? row?.triggerToSwitch),
  next_action: toNullableString(row?.next_action ?? row?.nextAction),
  target_date: toNullableString(row?.target_date ?? row?.targetDate),
  progress: toNullableNumber(row?.progress),
  linked_goal_id: toNullableString(row?.linked_goal_id ?? row?.linkedGoalId),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
});

const normalizeStrategyTacticRow = (row) => ({
  title: toRequiredString(row?.title),
  description: toNullableString(row?.description),
  category: toNullableString(row?.category),
  status: toNullableString(row?.status) || 'active',
  priority: toNullableString(row?.priority) || 'medium',
  frequency: toNullableString(row?.frequency),
  metric: toNullableString(row?.metric),
  next_action: toNullableString(row?.next_action ?? row?.nextAction),
  linked_goal_id: toNullableString(row?.linked_goal_id ?? row?.linkedGoalId),
  linked_plan_id: toNullableString(row?.linked_plan_id ?? row?.linkedPlanId),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
});

const normalizeStrategyExperimentRow = (row) => ({
  title: toRequiredString(row?.title),
  hypothesis: toNullableString(row?.hypothesis),
  method: toNullableString(row?.method),
  metric: toNullableString(row?.metric),
  result: toNullableString(row?.result),
  learning: toNullableString(row?.learning),
  status: toNullableString(row?.status) || 'planned',
  priority: toNullableString(row?.priority) || 'medium',
  start_date: toNullableString(row?.start_date ?? row?.startDate),
  end_date: toNullableString(row?.end_date ?? row?.endDate),
  linked_goal_id: toNullableString(row?.linked_goal_id ?? row?.linkedGoalId),
  linked_plan_id: toNullableString(row?.linked_plan_id ?? row?.linkedPlanId),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
});

const normalizeStrategyDecisionRow = (row) => ({
  title: toRequiredString(row?.title),
  context: toNullableString(row?.context),
  decision: toNullableString(row?.decision),
  reason: toNullableString(row?.reason),
  expected_result: toNullableString(row?.expected_result ?? row?.expectedResult),
  review_date: toNullableString(row?.review_date ?? row?.reviewDate),
  status: toNullableString(row?.status) || 'planned',
  priority: toNullableString(row?.priority) || 'medium',
  linked_goal_id: toNullableString(row?.linked_goal_id ?? row?.linkedGoalId),
  linked_plan_id: toNullableString(row?.linked_plan_id ?? row?.linkedPlanId),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
});

const normalizeRelationshipRow = (row, { forUpdate = false } = {}) => {
  const payload = {};

  if (!forUpdate || row?.personId !== undefined || row?.person_id !== undefined) payload.person_id = toNullableString(row?.person_id ?? row?.personId);
  if (!forUpdate || row?.categoryId !== undefined || row?.category_id !== undefined) payload.category_id = toNullableString(row?.category_id ?? row?.categoryId);
  if (!forUpdate || row?.displayName !== undefined || row?.display_name !== undefined) payload.display_name = toRequiredString(row?.display_name ?? row?.displayName);
  if (!forUpdate || row?.domain !== undefined) payload.domain = toNullableString(row?.domain);
  if (!forUpdate || row?.relationshipType !== undefined || row?.relationship_type !== undefined) payload.relationship_type = toNullableString(row?.relationship_type ?? row?.relationshipType);
  if (!forUpdate || row?.relationshipStrength !== undefined || row?.relationship_strength !== undefined) payload.relationship_strength = toNullableString(row?.relationship_strength ?? row?.relationshipStrength);
  if (!forUpdate || row?.trustLevel !== undefined || row?.trust_level !== undefined) payload.trust_level = toNullableString(row?.trust_level ?? row?.trustLevel);
  if (!forUpdate || row?.status !== undefined) payload.status = toNullableString(row?.status);
  if (!forUpdate || row?.howWeMet !== undefined || row?.how_we_met !== undefined) payload.how_we_met = toNullableString(row?.how_we_met ?? row?.howWeMet);
  if (!forUpdate || row?.whatTheyNeed !== undefined || row?.what_they_need !== undefined) payload.what_they_need = toNullableString(row?.what_they_need ?? row?.whatTheyNeed);
  if (!forUpdate || row?.howICanHelp !== undefined || row?.how_i_can_help !== undefined) payload.how_i_can_help = toNullableString(row?.how_i_can_help ?? row?.howICanHelp);
  if (!forUpdate || row?.howTheyCanHelpMe !== undefined || row?.how_they_can_help_me !== undefined) payload.how_they_can_help_me = toNullableString(row?.how_they_can_help_me ?? row?.howTheyCanHelpMe);
  if (!forUpdate || row?.sharedInterests !== undefined || row?.shared_interests !== undefined) payload.shared_interests = toNullableString(row?.shared_interests ?? row?.sharedInterests);
  if (!forUpdate || row?.lastContactDate !== undefined || row?.last_contact_date !== undefined) payload.last_contact_date = toNullableString(row?.last_contact_date ?? row?.lastContactDate);
  if (!forUpdate || row?.nextContactDate !== undefined || row?.next_contact_date !== undefined) payload.next_contact_date = toNullableString(row?.next_contact_date ?? row?.nextContactDate);
  if (!forUpdate || row?.nextAction !== undefined || row?.next_action !== undefined) payload.next_action = toNullableString(row?.next_action ?? row?.nextAction);
  if (!forUpdate || row?.problems !== undefined) payload.problems = toNullableString(row?.problems);
  if (!forUpdate || row?.riskNotes !== undefined || row?.risk_notes !== undefined) payload.risk_notes = toNullableString(row?.risk_notes ?? row?.riskNotes);
  if (!forUpdate || row?.notes !== undefined) payload.notes = toNullableString(row?.notes);

  return payload;
};

const normalizeRelationshipInteractionRow = (row, { forUpdate = false } = {}) => {
  const payload = {};

  if (!forUpdate || row?.relationshipId !== undefined || row?.relationship_id !== undefined) payload.relationship_id = toRequiredString(row?.relationship_id ?? row?.relationshipId);
  if (!forUpdate || row?.interactionDate !== undefined || row?.interaction_date !== undefined) payload.interaction_date = toRequiredString(row?.interaction_date ?? row?.interactionDate);
  if (!forUpdate || row?.channel !== undefined) payload.channel = toNullableString(row?.channel);
  if (!forUpdate || row?.type !== undefined) payload.type = toNullableString(row?.type);
  if (!forUpdate || row?.summary !== undefined) payload.summary = toNullableString(row?.summary);
  if (!forUpdate || row?.outcome !== undefined) payload.outcome = toNullableString(row?.outcome);
  if (!forUpdate || row?.nextAction !== undefined || row?.next_action !== undefined) payload.next_action = toNullableString(row?.next_action ?? row?.nextAction);

  return payload;
};

const normalizeRelationshipOpportunityRow = (row, { forUpdate = false } = {}) => {
  const payload = {};

  if (!forUpdate || row?.relationshipId !== undefined || row?.relationship_id !== undefined) payload.relationship_id = toRequiredString(row?.relationship_id ?? row?.relationshipId);
  if (!forUpdate || row?.title !== undefined) payload.title = toRequiredString(row?.title);
  if (!forUpdate || row?.type !== undefined) payload.type = toNullableString(row?.type);
  if (!forUpdate || row?.status !== undefined) payload.status = toNullableString(row?.status);
  if (!forUpdate || row?.priority !== undefined) payload.priority = toNullableString(row?.priority);
  if (!forUpdate || row?.valueDescription !== undefined || row?.value_description !== undefined) payload.value_description = toNullableString(row?.value_description ?? row?.valueDescription);
  if (!forUpdate || row?.nextAction !== undefined || row?.next_action !== undefined) payload.next_action = toNullableString(row?.next_action ?? row?.nextAction);
  if (!forUpdate || row?.dueDate !== undefined || row?.due_date !== undefined) payload.due_date = toNullableString(row?.due_date ?? row?.dueDate);
  if (!forUpdate || row?.linkedProjectId !== undefined || row?.linked_project_id !== undefined) payload.linked_project_id = toNullableString(row?.linked_project_id ?? row?.linkedProjectId);
  if (!forUpdate || row?.linkedCompanyId !== undefined || row?.linked_company_id !== undefined) payload.linked_company_id = toNullableString(row?.linked_company_id ?? row?.linkedCompanyId);
  if (!forUpdate || row?.notes !== undefined) payload.notes = toNullableString(row?.notes);

  return payload;
};

const normalizeRelationshipCategoryRow = (row, { forUpdate = false } = {}) => {
  const payload = {};

  if (!forUpdate || row?.name !== undefined) payload.name = toRequiredString(row?.name);
  if (!forUpdate || row?.slug !== undefined) payload.slug = toRequiredString(row?.slug);
  if (!forUpdate || row?.description !== undefined) payload.description = toNullableString(row?.description);
  if (!forUpdate || row?.color !== undefined) payload.color = toNullableString(row?.color);
  if (!forUpdate || row?.isActive !== undefined || row?.is_active !== undefined) payload.is_active = row?.is_active == null ? Boolean(row?.isActive ?? true) : Boolean(row.is_active);

  return payload;
};

const normalizeRelationshipContactMethodRow = (row, { forUpdate = false } = {}) => {
  const payload = {};

  if (!forUpdate || row?.relationshipId !== undefined || row?.relationship_id !== undefined) payload.relationship_id = toRequiredString(row?.relationship_id ?? row?.relationshipId);
  if (!forUpdate || row?.type !== undefined) payload.type = toNullableString(row?.type);
  if (!forUpdate || row?.label !== undefined) payload.label = toNullableString(row?.label);
  if (!forUpdate || row?.value !== undefined) payload.value = toNullableString(row?.value);
  if (!forUpdate || row?.isPrimary !== undefined || row?.is_primary !== undefined) payload.is_primary = row?.is_primary == null ? Boolean(row?.isPrimary ?? false) : Boolean(row.is_primary);
  if (!forUpdate || row?.notes !== undefined) payload.notes = toNullableString(row?.notes);

  return payload;
};

const normalizePlanRow = (row) => ({
  title: toRequiredString(row?.title),
  type: toRequiredString(row?.type),
  status: toNullableString(row?.status) || 'planned',
  priority: toNullableString(row?.priority) || 'medium',
  start_date: toNullableString(row?.start_date ?? row?.startDate),
  end_date: toNullableString(row?.end_date ?? row?.endDate),
  focus: toNullableString(row?.focus),
  success_criteria: toNullableString(row?.success_criteria ?? row?.successCriteria),
  review_notes: toNullableString(row?.review_notes ?? row?.reviewNotes),
  linked_strategy_goal_id: toNullableString(row?.linked_strategy_goal_id ?? row?.linkedStrategyGoalId),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
});

const normalizeDocumentRow = (row, { forUpdate = false } = {}) => {
  const payload = {};

  if (!forUpdate || row?.name !== undefined) payload.name = toRequiredString(row?.name);
  if (!forUpdate || row?.type !== undefined) payload.type = toNullableString(row?.type) || 'document';
  if (!forUpdate || row?.status !== undefined) payload.status = toNullableString(row?.status) || 'draft';
  if (!forUpdate || row?.relatedProjectId !== undefined || row?.related_project_id !== undefined) payload.related_project_id = toNullableString(row?.related_project_id ?? row?.relatedProjectId);
  if (!forUpdate || row?.relatedCompanyId !== undefined || row?.related_company_id !== undefined) payload.related_company_id = toNullableString(row?.related_company_id ?? row?.relatedCompanyId);
  if (!forUpdate || row?.relatedPersonId !== undefined || row?.related_person_id !== undefined) payload.related_person_id = toNullableString(row?.related_person_id ?? row?.relatedPersonId);
  if (!forUpdate || row?.relatedDealId !== undefined || row?.related_deal_id !== undefined) payload.related_deal_id = toNullableString(row?.related_deal_id ?? row?.relatedDealId);
  if (!forUpdate || row?.amount !== undefined) payload.amount = toNullableNumber(row?.amount);
  if (!forUpdate || row?.currency !== undefined) payload.currency = toNullableString(row?.currency);
  if (!forUpdate || row?.issueDate !== undefined || row?.issue_date !== undefined) payload.issue_date = toNullableString(row?.issue_date ?? row?.issueDate);
  if (!forUpdate || row?.dueDate !== undefined || row?.due_date !== undefined) payload.due_date = toNullableString(row?.due_date ?? row?.dueDate);
  if (!forUpdate || row?.paidDate !== undefined || row?.paid_date !== undefined) payload.paid_date = toNullableString(row?.paid_date ?? row?.paidDate);
  if (!forUpdate || row?.url !== undefined) payload.url = toNullableString(row?.url);
  if (!forUpdate || row?.notes !== undefined) payload.notes = toNullableString(row?.notes);

  return payload;
};

const normalizeDocumentTemplateRow = (row, { forUpdate = false } = {}) => {
  const payload = {};

  if (!forUpdate || row?.name !== undefined) payload.name = toRequiredString(row?.name);
  if (!forUpdate || row?.type !== undefined) payload.type = toNullableString(row?.type) || 'document';
  if (!forUpdate || row?.language !== undefined) payload.language = toNullableString(row?.language) || 'english';
  if (!forUpdate || row?.description !== undefined) payload.description = toNullableString(row?.description);
  if (!forUpdate || row?.content !== undefined) payload.content = toRequiredString(row?.content);
  if (!forUpdate || row?.variables !== undefined) payload.variables = toNullableString(row?.variables);
  if (!forUpdate || row?.isActive !== undefined || row?.is_active !== undefined) payload.is_active = row?.is_active == null ? Boolean(row?.isActive ?? true) : Boolean(row.is_active);

  return payload;
};

const normalizeDocumentBrandSettingsRow = (row, { forUpdate = false } = {}) => {
  const payload = {};

  if (!forUpdate || row?.brandName !== undefined || row?.brand_name !== undefined) payload.brand_name = toNullableString(row?.brand_name ?? row?.brandName);
  if (!forUpdate || row?.ownerName !== undefined || row?.owner_name !== undefined) payload.owner_name = toNullableString(row?.owner_name ?? row?.ownerName);
  if (!forUpdate || row?.email !== undefined) payload.email = toNullableString(row?.email);
  if (!forUpdate || row?.phone !== undefined) payload.phone = toNullableString(row?.phone);
  if (!forUpdate || row?.website !== undefined) payload.website = toNullableString(row?.website);
  if (!forUpdate || row?.address !== undefined) payload.address = toNullableString(row?.address);
  if (!forUpdate || row?.logoUrl !== undefined || row?.logo_url !== undefined) payload.logo_url = toNullableString(row?.logo_url ?? row?.logoUrl);
  if (!forUpdate || row?.signatureUrl !== undefined || row?.signature_url !== undefined) payload.signature_url = toNullableString(row?.signature_url ?? row?.signatureUrl);
  if (!forUpdate || row?.signatureName !== undefined || row?.signature_name !== undefined) payload.signature_name = toNullableString(row?.signature_name ?? row?.signatureName);
  if (!forUpdate || row?.defaultCurrency !== undefined || row?.default_currency !== undefined) payload.default_currency = toNullableString(row?.default_currency ?? row?.defaultCurrency);
  if (!forUpdate || row?.paymentNotes !== undefined || row?.payment_notes !== undefined) payload.payment_notes = toNullableString(row?.payment_notes ?? row?.paymentNotes);
  if (!forUpdate || row?.legalNotes !== undefined || row?.legal_notes !== undefined) payload.legal_notes = toNullableString(row?.legal_notes ?? row?.legalNotes);

  return payload;
};

const normalizeAIProviderKeyRow = (row) => ({
  id: row?.id ?? randomUUID(),
  label: toRequiredString(row?.label),
  provider: toRequiredString(row?.provider),
  apiKeyLast4: toNullableString(row?.api_key_last4 ?? row?.apiKeyLast4) || undefined,
  baseUrl: toNullableString(row?.base_url ?? row?.baseUrl),
  endpoint: toNullableString(row?.endpoint),
  deploymentName: toNullableString(row?.deployment_name ?? row?.deploymentName),
  apiVersion: toNullableString(row?.api_version ?? row?.apiVersion),
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  notes: toNullableString(row?.notes),
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const normalizeAIUseCaseSettingRow = (row, providerKeyLabel) => ({
  id: row?.id ?? randomUUID(),
  useCase: toRequiredString(row?.use_case ?? row?.useCase),
  providerKeyId: toNullableString(row?.provider_key_id ?? row?.providerKeyId),
  providerKeyLabel: providerKeyLabel || toNullableString(row?.provider_key_label ?? row?.providerKeyLabel),
  provider: toNullableString(row?.provider ?? row?.providerName),
  model: toNullableString(row?.model),
  temperature: row?.temperature != null ? Number(row.temperature) : undefined,
  maxOutputTokens: row?.max_output_tokens != null ? Number(row.max_output_tokens) : undefined,
  isEnabled: row?.is_enabled == null ? true : Boolean(row.is_enabled),
  notes: toNullableString(row?.notes),
  createdAt: row?.created_at ?? row?.createdAt ?? undefined,
  updatedAt: row?.updated_at ?? row?.updatedAt ?? undefined,
});

const normalizeInvoiceRow = (row, { forUpdate = false } = {}) => {
  const payload = {};

  if (!forUpdate || row?.invoiceNumber !== undefined || row?.invoice_number !== undefined) payload.invoice_number = toRequiredString(row?.invoice_number ?? row?.invoiceNumber);
  if (!forUpdate || row?.title !== undefined) payload.title = toRequiredString(row?.title);
  if (!forUpdate || row?.status !== undefined) payload.status = toNullableString(row?.status) || 'draft';
  if (!forUpdate || row?.language !== undefined) payload.language = toNullableString(row?.language) || 'english';
  if (!forUpdate || row?.issueDate !== undefined || row?.issue_date !== undefined) payload.issue_date = toNullableString(row?.issue_date ?? row?.issueDate);
  if (!forUpdate || row?.dueDate !== undefined || row?.due_date !== undefined) payload.due_date = toNullableString(row?.due_date ?? row?.dueDate);
  if (!forUpdate || row?.currency !== undefined) payload.currency = toNullableString(row?.currency) || 'MYR';
  if (!forUpdate || row?.sellerName !== undefined || row?.seller_name !== undefined) payload.seller_name = toNullableString(row?.seller_name ?? row?.sellerName);
  if (!forUpdate || row?.sellerEmail !== undefined || row?.seller_email !== undefined) payload.seller_email = toNullableString(row?.seller_email ?? row?.sellerEmail);
  if (!forUpdate || row?.sellerPhone !== undefined || row?.seller_phone !== undefined) payload.seller_phone = toNullableString(row?.seller_phone ?? row?.sellerPhone);
  if (!forUpdate || row?.sellerAddress !== undefined || row?.seller_address !== undefined) payload.seller_address = toNullableString(row?.seller_address ?? row?.sellerAddress);
  if (!forUpdate || row?.sellerCity !== undefined || row?.seller_city !== undefined) payload.seller_city = toNullableString(row?.seller_city ?? row?.sellerCity);
  if (!forUpdate || row?.sellerState !== undefined || row?.seller_state !== undefined) payload.seller_state = toNullableString(row?.seller_state ?? row?.sellerState);
  if (!forUpdate || row?.sellerZip !== undefined || row?.seller_zip !== undefined) payload.seller_zip = toNullableString(row?.seller_zip ?? row?.sellerZip);
  if (!forUpdate || row?.sellerTaxId !== undefined || row?.seller_tax_id !== undefined) payload.seller_tax_id = toNullableString(row?.seller_tax_id ?? row?.sellerTaxId);
  if (!forUpdate || row?.sellerLogoUrl !== undefined || row?.seller_logo_url !== undefined) payload.seller_logo_url = toNullableString(row?.seller_logo_url ?? row?.sellerLogoUrl);
  if (!forUpdate || row?.clientName !== undefined || row?.client_name !== undefined) payload.client_name = toNullableString(row?.client_name ?? row?.clientName);
  if (!forUpdate || row?.clientEmail !== undefined || row?.client_email !== undefined) payload.client_email = toNullableString(row?.client_email ?? row?.clientEmail);
  if (!forUpdate || row?.clientPhone !== undefined || row?.client_phone !== undefined) payload.client_phone = toNullableString(row?.client_phone ?? row?.clientPhone);
  if (!forUpdate || row?.clientAddress !== undefined || row?.client_address !== undefined) payload.client_address = toNullableString(row?.client_address ?? row?.clientAddress);
  if (!forUpdate || row?.clientCity !== undefined || row?.client_city !== undefined) payload.client_city = toNullableString(row?.client_city ?? row?.clientCity);
  if (!forUpdate || row?.clientState !== undefined || row?.client_state !== undefined) payload.client_state = toNullableString(row?.client_state ?? row?.clientState);
  if (!forUpdate || row?.clientZip !== undefined || row?.client_zip !== undefined) payload.client_zip = toNullableString(row?.client_zip ?? row?.clientZip);
  if (!forUpdate || row?.subtotal !== undefined) payload.subtotal = toNullableNumber(row?.subtotal);
  if (!forUpdate || row?.discountAmount !== undefined || row?.discount_amount !== undefined) payload.discount_amount = toNullableNumber(row?.discount_amount ?? row?.discountAmount);
  if (!forUpdate || row?.taxRate !== undefined || row?.tax_rate !== undefined) payload.tax_rate = toNullableNumber(row?.tax_rate ?? row?.taxRate);
  if (!forUpdate || row?.taxAmount !== undefined || row?.tax_amount !== undefined) payload.tax_amount = toNullableNumber(row?.tax_amount ?? row?.taxAmount);
  if (!forUpdate || row?.total !== undefined) payload.total = toNullableNumber(row?.total);
  if (!forUpdate || row?.terms !== undefined) payload.terms = toNullableString(row?.terms);
  if (!forUpdate || row?.notes !== undefined) payload.notes = toNullableString(row?.notes);
  if (!forUpdate || row?.relatedProjectId !== undefined || row?.related_project_id !== undefined) payload.related_project_id = toNullableString(row?.related_project_id ?? row?.relatedProjectId);
  if (!forUpdate || row?.relatedCompanyId !== undefined || row?.related_company_id !== undefined) payload.related_company_id = toNullableString(row?.related_company_id ?? row?.relatedCompanyId);
  if (!forUpdate || row?.relatedPersonId !== undefined || row?.related_person_id !== undefined) payload.related_person_id = toNullableString(row?.related_person_id ?? row?.relatedPersonId);
  if (!forUpdate || row?.relatedDealId !== undefined || row?.related_deal_id !== undefined) payload.related_deal_id = toNullableString(row?.related_deal_id ?? row?.relatedDealId);
  if (!forUpdate || row?.generatedDocumentId !== undefined || row?.generated_document_id !== undefined) payload.generated_document_id = toNullableString(row?.generated_document_id ?? row?.generatedDocumentId);
  if (!forUpdate || row?.pdfStoragePath !== undefined || row?.pdf_storage_path !== undefined) payload.pdf_storage_path = toNullableString(row?.pdf_storage_path ?? row?.pdfStoragePath);
  if (!forUpdate || row?.externalUrl !== undefined || row?.external_url !== undefined) payload.external_url = toNullableString(row?.external_url ?? row?.externalUrl);

  return payload;
};

const normalizeInvoiceItemRow = (row, { forUpdate = false } = {}) => {
  const payload = {};

  if (!forUpdate || row?.invoiceId !== undefined || row?.invoice_id !== undefined) payload.invoice_id = toRequiredString(row?.invoice_id ?? row?.invoiceId);
  if (!forUpdate || row?.description !== undefined) payload.description = toRequiredString(row?.description);
  if (!forUpdate || row?.quantity !== undefined) payload.quantity = toNullableNumber(row?.quantity);
  if (!forUpdate || row?.rate !== undefined) payload.rate = toNullableNumber(row?.rate);
  if (!forUpdate || row?.amount !== undefined) payload.amount = toNullableNumber(row?.amount);
  if (!forUpdate || row?.sortOrder !== undefined || row?.sort_order !== undefined) payload.sort_order = toNullableNumber(row?.sort_order ?? row?.sortOrder);

  return payload;
};

const normalizeGeneratedDocumentRow = (row, { forUpdate = false } = {}) => {
  const payload = {};

  if (!forUpdate || row?.title !== undefined) payload.title = toRequiredString(row?.title);
  if (!forUpdate || row?.type !== undefined) payload.type = toNullableString(row?.type) || 'document';
  if (!forUpdate || row?.status !== undefined) payload.status = toNullableString(row?.status) || 'draft';
  if (!forUpdate || row?.language !== undefined) payload.language = toNullableString(row?.language) || 'english';
  if (!forUpdate || row?.templateId !== undefined || row?.template_id !== undefined) payload.template_id = toNullableString(row?.template_id ?? row?.templateId);
  if (!forUpdate || row?.relatedProjectId !== undefined || row?.related_project_id !== undefined) payload.related_project_id = toNullableString(row?.related_project_id ?? row?.relatedProjectId);
  if (!forUpdate || row?.relatedCompanyId !== undefined || row?.related_company_id !== undefined) payload.related_company_id = toNullableString(row?.related_company_id ?? row?.relatedCompanyId);
  if (!forUpdate || row?.relatedPersonId !== undefined || row?.related_person_id !== undefined) payload.related_person_id = toNullableString(row?.related_person_id ?? row?.relatedPersonId);
  if (!forUpdate || row?.relatedDealId !== undefined || row?.related_deal_id !== undefined) payload.related_deal_id = toNullableString(row?.related_deal_id ?? row?.relatedDealId);
  if (!forUpdate || row?.content !== undefined) payload.content = toNullableString(row?.content);
  if (!forUpdate || row?.variablesJson !== undefined || row?.variables_json !== undefined) payload.variables_json = toNullableString(row?.variables_json ?? row?.variablesJson);
  if (!forUpdate || row?.amount !== undefined) payload.amount = toNullableNumber(row?.amount);
  if (!forUpdate || row?.currency !== undefined) payload.currency = toNullableString(row?.currency);
  if (!forUpdate || row?.issueDate !== undefined || row?.issue_date !== undefined) payload.issue_date = toNullableString(row?.issue_date ?? row?.issueDate);
  if (!forUpdate || row?.dueDate !== undefined || row?.due_date !== undefined) payload.due_date = toNullableString(row?.due_date ?? row?.dueDate);
  if (!forUpdate || row?.signedDate !== undefined || row?.signed_date !== undefined) payload.signed_date = toNullableString(row?.signed_date ?? row?.signedDate);
  if (!forUpdate || row?.pdfUrl !== undefined || row?.pdf_url !== undefined) payload.pdf_url = toNullableString(row?.pdf_url ?? row?.pdfUrl);
  if (!forUpdate || row?.pdfStoragePath !== undefined || row?.pdf_storage_path !== undefined) payload.pdf_storage_path = toNullableString(row?.pdf_storage_path ?? row?.pdfStoragePath);
  if (!forUpdate || row?.externalUrl !== undefined || row?.external_url !== undefined) payload.external_url = toNullableString(row?.external_url ?? row?.externalUrl);
  if (!forUpdate || row?.notes !== undefined) payload.notes = toNullableString(row?.notes);

  return payload;
};

const normalizePlanItemRow = (row) => ({
  plan_id: toRequiredString(row?.plan_id ?? row?.planId),
  title: toRequiredString(row?.title),
  description: toNullableString(row?.description),
  category: toNullableString(row?.category),
  status: toNullableString(row?.status) || 'todo',
  priority: toNullableString(row?.priority) || 'medium',
  due_date: toNullableString(row?.due_date ?? row?.dueDate),
  completed_at: toNullableString(row?.completed_at ?? row?.completedAt),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
  linked_strategy_goal_id: toNullableString(row?.linked_strategy_goal_id ?? row?.linkedStrategyGoalId),
});

const normalizeFinanceIncomeRow = (row) => ({
  title: toRequiredString(row?.title),
  source: toRequiredString(row?.source),
  amount: toNullableNumber(row?.amount) ?? 0,
  currency: toRequiredString(row?.currency) || 'MYR',
  income_date: toNullableString(row?.income_date ?? row?.incomeDate),
  status: toNullableString(row?.status) || 'expected',
  notes: toNullableString(row?.notes),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
  linked_company_id: toNullableString(row?.linked_company_id ?? row?.linkedCompanyId),
  income_type: toNullableString(row?.income_type ?? row?.incomeType),
  expected_amount: toNullableNumber(row?.expected_amount ?? row?.expectedAmount),
  received_amount: toNullableNumber(row?.received_amount ?? row?.receivedAmount),
  expected_date: toNullableString(row?.expected_date ?? row?.expectedDate),
  received_date: toNullableString(row?.received_date ?? row?.receivedDate),
  is_recurring: row?.is_recurring ?? row?.isRecurring ?? null,
  recurrence: toNullableString(row?.recurrence),
  confidence: toNullableString(row?.confidence),
  finance_period_id: toNullableString(row?.finance_period_id ?? row?.financePeriodId),
});

const normalizeFinanceExpenseRow = (row) => ({
  title: toRequiredString(row?.title),
  category: toRequiredString(row?.category),
  amount: toNullableNumber(row?.amount) ?? 0,
  currency: toRequiredString(row?.currency) || 'MYR',
  expense_date: toNullableString(row?.expense_date ?? row?.expenseDate),
  status: toNullableString(row?.status) || 'planned',
  notes: toNullableString(row?.notes),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
  finance_period_id: toNullableString(row?.finance_period_id ?? row?.financePeriodId),
});

const normalizeFinanceAllocationRuleRow = (row) => ({
  name: toRequiredString(row?.name),
  category: toRequiredString(row?.category),
  percentage: toNullableNumber(row?.percentage) ?? 0,
  priority: toNullableNumber(row?.priority) ?? 0,
  is_active: row?.is_active == null ? true : Boolean(row.is_active),
  notes: toNullableString(row?.notes),
});

const normalizeFinancePurchaseGoalRow = (row) => ({
  title: toRequiredString(row?.title),
  category: toRequiredString(row?.category),
  target_amount: toNullableNumber(row?.target_amount ?? row?.targetAmount) ?? 0,
  saved_amount: toNullableNumber(row?.saved_amount ?? row?.savedAmount) ?? 0,
  currency: toRequiredString(row?.currency) || 'MYR',
  priority: toNullableString(row?.priority) || 'medium',
  status: toNullableString(row?.status) || 'planned',
  decision_status: toNullableString(row?.decision_status ?? row?.decisionStatus) || 'researching',
  target_date: toNullableString(row?.target_date ?? row?.targetDate),
  product_url: toNullableString(row?.product_url ?? row?.productUrl),
  image_url: toNullableString(row?.image_url ?? row?.imageUrl),
  vendor: toNullableString(row?.vendor),
  reason: toNullableString(row?.reason),
  expected_use: toNullableString(row?.expected_use ?? row?.expectedUse),
  alternatives: toNullableString(row?.alternatives),
  allocation_category: toNullableString(row?.allocation_category ?? row?.allocationCategory),
  monthly_contribution: toNullableNumber(row?.monthly_contribution ?? row?.monthlyContribution),
  notes: toNullableString(row?.notes),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
  finance_period_id: toNullableString(row?.finance_period_id ?? row?.financePeriodId),
});

const normalizeFinanceInvestmentIdeaRow = (row) => ({
  title: toRequiredString(row?.title),
  type: toRequiredString(row?.type),
  planned_amount: toNullableNumber(row?.planned_amount ?? row?.plannedAmount) ?? 0,
  currency: toRequiredString(row?.currency) || 'MYR',
  risk_level: toNullableString(row?.risk_level ?? row?.riskLevel) || 'medium',
  ethical_status: toNullableString(row?.ethical_status ?? row?.ethicalStatus) || 'needs_review',
  status: toNullableString(row?.status) || 'researching',
  decision_status: toNullableString(row?.decision_status ?? row?.decisionStatus) || 'researching',
  expected_horizon: toNullableString(row?.expected_horizon ?? row?.expectedHorizon),
  review_date: toNullableString(row?.review_date ?? row?.reviewDate),
  max_allocation: toNullableNumber(row?.max_allocation ?? row?.maxAllocation),
  expected_reason: toNullableString(row?.expected_reason ?? row?.expectedReason),
  pros: toNullableString(row?.pros),
  cons: toNullableString(row?.cons),
  risks: toNullableString(row?.risks),
  red_flags: toNullableString(row?.red_flags ?? row?.redFlags),
  research_links: toNullableString(row?.research_links ?? row?.researchLinks),
  low_scenario: toNullableString(row?.low_scenario ?? row?.lowScenario),
  base_scenario: toNullableString(row?.base_scenario ?? row?.baseScenario),
  high_scenario: toNullableString(row?.high_scenario ?? row?.highScenario),
  allocation_category: toNullableString(row?.allocation_category ?? row?.allocationCategory),
  recommended_monthly_contribution: toNullableNumber(row?.recommended_monthly_contribution ?? row?.recommendedMonthlyContribution),
  funding_status: toNullableString(row?.funding_status ?? row?.fundingStatus),
  notes: toNullableString(row?.notes),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
  finance_period_id: toNullableString(row?.finance_period_id ?? row?.financePeriodId),
});

const normalizeFinanceInvestmentRuleRow = (row) => ({
  title: toRequiredString(row?.title),
  category: toRequiredString(row?.category),
  description: toNullableString(row?.description),
  priority: toNullableNumber(row?.priority) ?? 0,
  is_active: row?.is_active == null ? true : Boolean(row.is_active),
  notes: toNullableString(row?.notes),
});

const normalizeFinanceInvestmentAllocationRow = (row) => ({
  name: toRequiredString(row?.name),
  category: toRequiredString(row?.category),
  percentage: toNullableNumber(row?.percentage) ?? 0,
  risk_level: toNullableString(row?.risk_level ?? row?.riskLevel) || 'medium',
  ethical_status: toNullableString(row?.ethical_status ?? row?.ethicalStatus) || 'needs_review',
  priority: toNullableNumber(row?.priority) ?? 0,
  is_active: row?.is_active == null ? true : Boolean(row.is_active),
  notes: toNullableString(row?.notes),
});

const normalizeFinancePeriodRow = (row) => ({
  title: toRequiredString(row?.title),
  type: toRequiredString(row?.type),
  start_date: toRequiredString(row?.start_date ?? row?.startDate),
  end_date: toRequiredString(row?.end_date ?? row?.endDate),
  status: toNullableString(row?.status) || 'planned',
  focus: toNullableString(row?.focus),
  target_income: toNullableNumber(row?.target_income ?? row?.targetIncome),
  target_expenses: toNullableNumber(row?.target_expenses ?? row?.targetExpenses),
  target_savings: toNullableNumber(row?.target_savings ?? row?.targetSavings),
  target_investment: toNullableNumber(row?.target_investment ?? row?.targetInvestment),
  review_notes: toNullableString(row?.review_notes ?? row?.reviewNotes),
});

const normalizeFinanceRecurringRuleRow = (row) => ({
  title: toRequiredString(row?.title),
  kind: toRequiredString(row?.kind),
  category: toNullableString(row?.category),
  amount: toNullableNumber(row?.amount) ?? 0,
  currency: toRequiredString(row?.currency) || 'MYR',
  frequency: toNullableString(row?.frequency) || 'monthly',
  start_date: toNullableString(row?.start_date ?? row?.startDate),
  end_date: toNullableString(row?.end_date ?? row?.endDate),
  is_active: row?.is_active == null ? true : Boolean(row.is_active),
  confidence: toNullableString(row?.confidence) || 'medium',
  source: toNullableString(row?.source),
  notes: toNullableString(row?.notes),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
  linked_company_id: toNullableString(row?.linked_company_id ?? row?.linkedCompanyId),
});

const normalizeFinanceEntityRow = (entity, row) => {
  if (entity === 'finance_income') return normalizeFinanceIncomeRow(row);
  if (entity === 'finance_expenses') return normalizeFinanceExpenseRow(row);
  if (entity === 'finance_allocation_rules') return normalizeFinanceAllocationRuleRow(row);
  if (entity === 'finance_purchase_goals') return normalizeFinancePurchaseGoalRow(row);
  if (entity === 'finance_investment_ideas') return normalizeFinanceInvestmentIdeaRow(row);
  if (entity === 'finance_investment_rules') return normalizeFinanceInvestmentRuleRow(row);
  if (entity === 'finance_investment_allocations') return normalizeFinanceInvestmentAllocationRow(row);
  if (entity === 'finance_periods') return normalizeFinancePeriodRow(row);
  if (entity === 'finance_recurring_rules') return normalizeFinanceRecurringRuleRow(row);
  return row;
};

const normalizeStrategyEntityRow = (entity, row) => {
  if (entity === 'strategy_items') return normalizeStrategyRow(row);
  if (entity === 'strategy_goals') return normalizeStrategyGoalRow(row);
  if (entity === 'strategy_plans') return normalizeStrategyPlanRow(row);
  if (entity === 'strategy_tactics') return normalizeStrategyTacticRow(row);
  if (entity === 'strategy_experiments') return normalizeStrategyExperimentRow(row);
  if (entity === 'strategy_decisions') return normalizeStrategyDecisionRow(row);
  return row;
};

const normalizeTaskWorkLogRow = (row) => ({
  task_id: toRequiredString(row?.task_id ?? row?.taskId),
  work_date: toNullableString(row?.work_date ?? row?.workDate),
  minutes_spent: toNullableNumber(row?.minutes_spent ?? row?.minutesSpent) || 0,
  summary: toNullableString(row?.summary),
  notes: toNullableString(row?.notes),
});

const normalizeWeeklyTaskReviewRow = (row) => ({
  week_start: toRequiredString(row?.week_start ?? row?.weekStart),
  summary: toNullableString(row?.summary),
  what_worked: toNullableString(row?.what_worked ?? row?.whatWorked),
  what_failed: toNullableString(row?.what_failed ?? row?.whatFailed),
  blockers: toNullableString(row?.blockers),
  lessons: toNullableString(row?.lessons),
  next_week_focus: toNullableString(row?.next_week_focus ?? row?.nextWeekFocus),
  score: row?.score != null ? Math.min(10, Math.max(0, Number(row.score))) : null,
});

const normalizeTaskRow = (row) => ({
  title: toRequiredString(row?.title),
  description: toNullableString(row?.description),
  status: toNullableString(row?.status) || 'todo',
  priority: toNullableString(row?.priority) || 'medium',
  category: toNullableString(row?.category),
  task_date: toNullableString(row?.task_date ?? row?.taskDate),
  week_start: toNullableString(row?.week_start ?? row?.weekStart),
  estimated_minutes: toNullableNumber(row?.estimated_minutes ?? row?.estimatedMinutes),
  actual_minutes: toNullableNumber(row?.actual_minutes ?? row?.actualMinutes),
  completed_at: toNullableString(row?.completed_at ?? row?.completedAt),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
  linked_plan_id: toNullableString(row?.linked_plan_id ?? row?.linkedPlanId),
  linked_strategy_goal_id: toNullableString(row?.linked_strategy_goal_id ?? row?.linkedStrategyGoalId),
  linked_company_id: toNullableString(row?.linked_company_id ?? row?.linkedCompanyId),
  linked_person_id: toNullableString(row?.linked_person_id ?? row?.linkedPersonId),
  linked_document_id: toNullableString(row?.linked_document_id ?? row?.linkedDocumentId),
  is_recurring_instance: row?.is_recurring_instance ?? row?.isRecurringInstance ?? null,
  recurring_rule_id: toNullableString(row?.recurring_rule_id ?? row?.recurringRuleId),
  notes: toNullableString(row?.notes),
});

const normalizeRecurringTaskRow = (row) => ({
  title: toRequiredString(row?.title),
  description: toNullableString(row?.description),
  frequency: toNullableString(row?.frequency) || 'weekly',
  days_of_week: toNullableString(row?.days_of_week ?? row?.daysOfWeek),
  priority: toNullableString(row?.priority) || 'medium',
  category: toNullableString(row?.category),
  estimated_minutes: toNullableNumber(row?.estimated_minutes ?? row?.estimatedMinutes),
  start_date: toNullableString(row?.start_date ?? row?.startDate),
  end_date: toNullableString(row?.end_date ?? row?.endDate),
  is_active: row?.is_active == null ? true : Boolean(row.is_active),
  linked_project_id: toNullableString(row?.linked_project_id ?? row?.linkedProjectId),
  linked_plan_id: toNullableString(row?.linked_plan_id ?? row?.linkedPlanId),
  linked_strategy_goal_id: toNullableString(row?.linked_strategy_goal_id ?? row?.linkedStrategyGoalId),
  linked_company_id: toNullableString(row?.linked_company_id ?? row?.linkedCompanyId),
  linked_person_id: toNullableString(row?.linked_person_id ?? row?.linkedPersonId),
  notes: toNullableString(row?.notes),
});

const normalizeEntityRow = (entity, row) => {
  if (entity === 'message_templates') return normalizeTemplateRow(row, { forUpdate: false });
  if (entity === 'documents') return normalizeDocumentRow(row, { forUpdate: false });
  if (entity === 'document_templates') return normalizeDocumentTemplateRow(row, { forUpdate: false });
  if (entity === 'document_brand_settings') return normalizeDocumentBrandSettingsRow(row, { forUpdate: false });
  if (entity === 'generated_documents') return normalizeGeneratedDocumentRow(row, { forUpdate: false });
  if (entity === 'invoices') return normalizeInvoiceRow(row, { forUpdate: false });
  if (entity === 'invoice_items') return normalizeInvoiceItemRow(row, { forUpdate: false });
  if (entity === 'relationships') return normalizeRelationshipRow(row);
  if (entity === 'relationship_interactions') return normalizeRelationshipInteractionRow(row);
  if (entity === 'relationship_opportunities') return normalizeRelationshipOpportunityRow(row);
  if (entity === 'relationship_categories') return normalizeRelationshipCategoryRow(row);
  if (entity === 'relationship_contact_methods') return normalizeRelationshipContactMethodRow(row);
  if (entity.startsWith('strategy_')) return normalizeStrategyEntityRow(entity, row);
  if (entity === 'plans') return normalizePlanRow(row);
  if (entity === 'plan_items') return normalizePlanItemRow(row);
  if (entity.startsWith('finance_')) return normalizeFinanceEntityRow(entity, row);
  if (entity === 'ai_use_case_settings') {
    return {
      use_case: toRequiredString(row?.use_case ?? row?.useCase),
      provider_key_id: toNullableString(row?.provider_key_id ?? row?.providerKeyId),
      provider: toNullableString(row?.provider),
      model: toNullableString(row?.model),
      temperature: row?.temperature != null ? Number(row.temperature) : null,
      max_output_tokens: row?.max_output_tokens != null ? Number(row.max_output_tokens) : null,
      is_enabled: row?.is_enabled == null ? true : Boolean(row.is_enabled),
      notes: toNullableString(row?.notes),
    };
  }
  if (entity === 'task_work_logs') return normalizeTaskWorkLogRow(row);
  if (entity === 'weekly_task_reviews') return normalizeWeeklyTaskReviewRow(row);
  return row;
};

const parseCookies = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};
  return cookieHeader.split(';').reduce((accumulator, part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) return accumulator;
    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (key) accumulator[key] = value;
    return accumulator;
  }, {});
};

const isAuthenticated = (req) => {
  const cookies = parseCookies(req.headers?.cookie);
  return cookies[COOKIE_NAME] === COOKIE_VALUE;
};

// ── Table classification ──
const CRITICAL_TABLES = new Set([
  'companies',
  'people',
  'messages',
  'deals',
  'projects',
  'message_templates',
]);

const OPTIONAL_TABLES = new Set([
  'project_tasks',
  'project_time_logs',
  'project_meetings',
  'project_documents',
  'project_finance_items',
  'documents',
  'document_templates',
  'document_brand_settings',
  'generated_documents',
  'invoices',
  'invoice_items',
  'strategy_items',
  'strategy_goals',
  'strategy_plans',
  'strategy_tactics',
  'strategy_experiments',
  'strategy_decisions',
  'plans',
  'plan_items',
  'finance_income',
  'finance_expenses',
  'finance_allocation_rules',
  'finance_purchase_goals',
  'finance_investment_ideas',
  'finance_investment_rules',
  'finance_investment_allocations',
  'finance_periods',
  'finance_recurring_rules',
  'ai_provider_keys',
  'ai_use_case_settings',
  'tasks',
  'recurring_tasks',
  'recurring_task_logs',
  'task_work_logs',
  'weekly_task_reviews',
]);

const SCOPES = {
  core: ['companies', 'people', 'messages', 'deals', 'projects', 'message_templates'],
  relationships: ['relationships', 'relationship_interactions', 'relationship_opportunities', 'relationship_categories', 'relationship_contact_methods'],
  tasks: ['tasks', 'recurring_tasks', 'recurring_task_logs', 'task_work_logs', 'weekly_task_reviews'],
  finance: ['finance_income', 'finance_expenses', 'finance_allocation_rules', 'finance_purchase_goals', 'finance_investment_ideas', 'finance_investment_rules', 'finance_investment_allocations', 'finance_periods', 'finance_recurring_rules'],
  documents: ['documents', 'document_templates', 'document_brand_settings', 'generated_documents', 'invoices', 'invoice_items'],
  strategy: ['strategy_items', 'strategy_goals', 'strategy_plans', 'strategy_tactics', 'strategy_experiments', 'strategy_decisions', 'plans', 'plan_items'],
  projects: ['project_tasks', 'project_time_logs', 'project_meetings', 'project_documents', 'project_finance_items'],
  ai: ['ai_provider_keys', 'ai_use_case_settings'],
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET' && (req?.query?.health === '1' || req?.query?.health === 1)) {
    return toSafeJson(res, 200, {
      success: true,
      route: 'api/opportunities.js',
      message: 'Opportunities API is reachable',
    });
  }

  const debug = isDebugEnabled(req);
  const envPresent = getEnvPresence();
  const supabase = getSupabaseClient();
  if (!supabase) {
    return toSafeJson(res, 500, {
      success: false,
      ...(debug
        ? {
            error: 'Missing Supabase environment variables',
            envPresent,
            tablesAttempted,
            failedTable: null,
            errorCode: null,
            errorMessage: 'Missing Supabase environment variables',
          }
        : {
            error: 'Missing Supabase environment variables',
            failedTable: null,
          }),
    });
  }

  if (req.method === 'GET') {
    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Authentication required.' });
    }

    const scope = req?.query?.scope || 'all';
    const entityTimingsMs = {};

    // Determine which tables to load based on scope
    let tablesToLoad;
    if (scope === 'all') {
      tablesToLoad = tablesAttempted;
    } else if (SCOPES[scope]) {
      tablesToLoad = SCOPES[scope];
    } else {
      return toSafeJson(res, 400, { success: false, error: `Unknown scope: ${scope}` });
    }

    try {
      // Load all tables in parallel with Promise.allSettled
      const loadPromises = tablesToLoad.map(async (table) => {
        const start = Date.now();
        try {
          const { data, error } = await supabase.from(table).select('*');
          const elapsed = Date.now() - start;
          entityTimingsMs[table] = elapsed;

          if (error) {
            return { table, status: 'error', data: [], error: { message: error.message, code: error.code, details: error.details } };
          }

          return { table, status: 'fulfilled', data: data || [] };
        } catch (err) {
          const elapsed = Date.now() - start;
          entityTimingsMs[table] = elapsed;
          return { table, status: 'error', data: [], error: { message: err.message, code: err.code || 'UNKNOWN', details: err.details || null } };
        }
      });

      const settled = await Promise.allSettled(loadPromises);

      const results = {};
      const entityErrors = [];
      let templatesWarning = null;

      for (const outcome of settled) {
        // Promise.allSettled never rejects with individual .catch handlers, but handle the wrapper
        const item = outcome.status === 'fulfilled' ? outcome.value : null;
        if (!item) continue;

        if (item.status === 'error') {
          const isCritical = CRITICAL_TABLES.has(item.table);
          entityErrors.push({
            table: item.table,
            critical: isCritical,
            message: item.error?.message || 'Unknown error',
            code: item.error?.code || null,
            details: item.error?.details || null,
          });

          if (isCritical) {
            console.error(`[Opportunities] Critical table query failed: ${item.table}`, item.error);
            return toSafeJson(
              res,
              500,
              buildFailurePayload({
                debug,
                failedTable: item.table,
                error: item.error,
                envPresent,
                entityErrors,
                phase: 'load_critical',
              })
            );
          }

          // Optional table failure — log and continue with empty array
          if (item.table === 'message_templates') {
            templatesWarning = 'Templates are temporarily unavailable.';
          }
          console.warn(`[Opportunities] Optional table query failed: ${item.table}`, item.error);
          results[item.table] = [];
          continue;
        }

        results[item.table] = item.data;
      }

      const aiProviderKeys = (results.ai_provider_keys || []).map(normalizeAIProviderKeyRow);
      const providerKeyLabelsById = new Map(aiProviderKeys.map((row) => [row.id, row.label]));
      const aiUseCaseSettings = (results.ai_use_case_settings || []).map((row) => normalizeAIUseCaseSettingRow(row, providerKeyLabelsById.get(row?.provider_key_id ?? row?.providerKeyId)));

      // Build response with only the keys relevant to the current scope
      const scopeKeys = {
        core: ['companies', 'people', 'messages', 'deals', 'projects', 'message_templates'],
        relationships: ['relationships', 'relationship_interactions', 'relationship_opportunities', 'relationship_categories', 'relationship_contact_methods'],
        tasks: ['tasks', 'recurring_tasks', 'recurring_task_logs', 'task_work_logs', 'weekly_task_reviews'],
        finance: ['finance_income', 'finance_expenses', 'finance_allocation_rules', 'finance_purchase_goals', 'finance_investment_ideas', 'finance_investment_rules', 'finance_investment_allocations', 'finance_periods', 'finance_recurring_rules'],
        documents: ['documents', 'document_templates', 'document_brand_settings', 'generated_documents', 'invoices', 'invoice_items'],
        strategy: ['strategy_items', 'strategy_goals', 'strategy_plans', 'strategy_tactics', 'strategy_experiments', 'strategy_decisions'],
        plans: ['plans', 'plan_items'],
        projects: ['project_tasks', 'project_time_logs', 'project_meetings', 'project_documents', 'project_finance_items'],
        ai: ['ai_provider_keys', 'ai_use_case_settings'],
      };

      let responseKeys;
      if (scope === 'all') {
        responseKeys = [
          'companies', 'people', 'messages', 'deals', 'projects', 'message_templates',
          'project_tasks', 'project_time_logs', 'project_meetings', 'project_documents', 'project_finance_items',
          'documents', 'document_templates', 'document_brand_settings', 'generated_documents',
          'invoices', 'invoice_items',
          'strategy_items', 'strategy_goals', 'strategy_plans', 'strategy_tactics', 'strategy_experiments', 'strategy_decisions',
          'relationships', 'relationship_interactions', 'relationship_opportunities', 'relationship_categories', 'relationship_contact_methods',
          'plans', 'plan_items',
          'finance_income', 'finance_expenses', 'finance_allocation_rules', 'finance_purchase_goals',
          'finance_investment_ideas', 'finance_investment_rules', 'finance_investment_allocations',
          'finance_periods', 'finance_recurring_rules',
          'tasks', 'recurring_tasks', 'recurring_task_logs', 'task_work_logs', 'weekly_task_reviews',
        ];
      } else if (scopeKeys[scope]) {
        responseKeys = scopeKeys[scope];
      } else {
        responseKeys = [];
      }

      const response = {};

      for (const key of responseKeys) {
        response[key] = results[key] || [];
      }

      // Always include ai_provider_keys and ai_use_case_settings with their normalizations (only if scope=ai or scope=all)
      if (scope === 'all' || scope === 'ai') {
        response.ai_provider_keys = aiProviderKeys;
        response.ai_use_case_settings = aiUseCaseSettings;
      }

      if (scope === 'all' || scope === 'core') {
        response.templatesWarning = templatesWarning;
        response.strategyNotes = [];
      }

      if (debug) {
        response._debug = {
          scope,
          entityTimingsMs,
          entityErrors: entityErrors.length > 0 ? entityErrors : undefined,
          loadedTables: tablesToLoad.filter((t) => results[t] !== undefined),
          totalTimeMs: Object.values(entityTimingsMs).reduce((a, b) => a + b, 0),
        };
      }

      return toSafeJson(res, 200, response);
    } catch (error) {
      console.error('[Opportunities] Unexpected GET failure', error);
      return toSafeJson(res, 500, {
        ...buildFailurePayload({
          debug,
          failedTable: null,
          error,
          envPresent,
          entityErrors: [],
          phase: 'unexpected',
        }),
      });
    }
  }

  if (req.method === 'POST') {
    const body = readBody(req);
    const { entity, action, data } = body || {};

    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Authentication required.' });
    }

    if (action !== 'insert' && action !== 'bulk_insert') {
      return toSafeJson(res, 400, { success: false, error: 'Unsupported action.' });
    }

    if (!allowedEntities.has(entity)) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid entity.' });
    }

    if (!data || typeof data !== 'object') {
      return toSafeJson(res, 400, { success: false, error: 'Missing data payload.' });
    }

    const isBatch = Array.isArray(data) || action === 'bulk_insert';

    if (isBatch && (!Array.isArray(data) || data.length === 0)) {
      return toSafeJson(res, 400, { success: false, error: 'Empty batch payload.' });
    }

    try {
        const payload = Array.isArray(data)
          ? data.map((row) => normalizeEntityRow(entity, row))
          : normalizeEntityRow(entity, data);

      if (isBatch) {
        const { data: insertedRows, error } = await supabase
          .from(entity)
          .insert(payload)
          .select();

        if (error) {
          console.error('[Opportunities] Supabase batch insert failed', { entity, action, error });
          return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
        }

        return toSafeJson(res, 200, { success: true, rows: insertedRows || [] });
      }

      // Single insert
      const { data: insertedRow, error } = await supabase
        .from(entity)
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('[Opportunities] Supabase insert failed', { entity, action, error });
        return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
      }

      return toSafeJson(res, 200, { success: true, row: insertedRow });
    } catch (error) {
      console.error('[Opportunities] Unexpected insert failure', { entity, action, error });
      return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
    }
  }

  if (req.method === 'PUT') {
    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Authentication required.' });
    }

    const body = readBody(req);
    const { entity, action, id, data } = body || {};

    if (action !== 'update') {
      return toSafeJson(res, 400, { success: false, error: 'Unsupported action.' });
    }

    if (!allowedEntities.has(entity)) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid entity.' });
    }

    if (!id) {
      return toSafeJson(res, 400, { success: false, error: 'Missing id.' });
    }

    if (!data || typeof data !== 'object') {
      return toSafeJson(res, 400, { success: false, error: 'Missing data payload.' });
    }

    try {
      const payload = entity === 'message_templates'
        ? normalizeTemplateRow(data, { forUpdate: true })
        : entity === 'documents'
          ? normalizeDocumentRow(data, { forUpdate: true })
          : entity === 'document_templates'
            ? normalizeDocumentTemplateRow(data, { forUpdate: true })
            : entity === 'document_brand_settings'
              ? normalizeDocumentBrandSettingsRow(data, { forUpdate: true })
              : entity === 'generated_documents'
                ? normalizeGeneratedDocumentRow(data, { forUpdate: true })
                : entity === 'relationships'
                  ? normalizeRelationshipRow(data, { forUpdate: true })
                  : entity === 'relationship_interactions'
                    ? normalizeRelationshipInteractionRow(data, { forUpdate: true })
                    : entity === 'relationship_opportunities'
                      ? normalizeRelationshipOpportunityRow(data, { forUpdate: true })
                      : entity === 'relationship_categories'
                        ? normalizeRelationshipCategoryRow(data, { forUpdate: true })
                        : entity === 'relationship_contact_methods'
                          ? normalizeRelationshipContactMethodRow(data, { forUpdate: true })
        : normalizeEntityRow(entity, data);

      const { data: updatedRow, error } = await supabase
        .from(entity)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Opportunities] Supabase update failed', { entity, action, id, error });
        return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
      }

      if (!updatedRow) {
        return toSafeJson(res, 404, { success: false, error: 'Record not found.' });
      }

      return toSafeJson(res, 200, {
        success: true,
        row: entity === 'ai_use_case_settings'
          ? normalizeAIUseCaseSettingRow(updatedRow)
          : entity === 'relationships' || entity === 'relationship_interactions' || entity === 'relationship_opportunities' || entity === 'relationship_categories' || entity === 'relationship_contact_methods'
            ? updatedRow
          : normalizeEntityRow(entity, updatedRow),
      });
    } catch (error) {
      console.error('[Opportunities] Unexpected update failure', { entity, action, id, error });
      return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
    }
  }

  if (req.method === 'DELETE') {
    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Authentication required.' });
    }

    const body = readBody(req);
    const { entity, action, id } = body || {};

    if (action !== 'delete') {
      return toSafeJson(res, 400, { success: false, error: 'Unsupported action.' });
    }

    if (!allowedEntities.has(entity)) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid entity.' });
    }

    if (!id) {
      return toSafeJson(res, 400, { success: false, error: 'Missing id.' });
    }

    try {
      const query = entity === 'message_templates'
        ? supabase
            .from(entity)
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('id')
            .single()
        : supabase
            .from(entity)
            .delete()
            .eq('id', id);

      const { error } = await query;

      if (error) {
        console.error('[Opportunities] Supabase delete failed', { entity, action, id, error });
        return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
      }

      return toSafeJson(res, 200, { success: true });
    } catch (error) {
      console.error('[Opportunities] Unexpected delete failure', { entity, action, id, error });
      return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
    }
  }

  return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
}