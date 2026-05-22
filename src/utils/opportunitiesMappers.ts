import type {
  Company,
  CompanyInput,
  Person,
  PersonInput,
  OutreachMessage,
  MessageInput,
  Deal,
  DealInput,
  Project,
  ProjectInput,
  MessageTemplate,
  MessageTemplateInput,
} from '../types/opportunities';

// ── Helpers ──

export const safeString = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));
export const safeNumber = (value: unknown) => (typeof value === 'number' ? value : Number.isFinite(Number(value)) ? Number(value) : undefined);
export const isBlank = (value: unknown) => value == null || (typeof value === 'string' && value.trim() === '');
export const toNullableString = (value: unknown) => (isBlank(value) ? null : String(value).trim());

export const toNullableNumber = (value: unknown) => {
  if (isBlank(value)) return null;
  const parsed = typeof value === 'number' ? value : Number(String(value).trim());
  return Number.isFinite(parsed) ? parsed : null;
};

export const toNullableDate = (value: unknown) => {
  if (isBlank(value)) return null;
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
    return value.trim();
  }
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
};

export const toIso = (value: unknown) => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

// ── databaseType normalizer ──

export const normalizeDatabaseType = (value: string | undefined | null): string => {
  if (!value) return 'sme';
  const v = value.trim().toLowerCase().replace(/\s+/g, '_');

  // big_company matches
  if (v === 'big_company' || v === 'bigcompany' || v === 'big_companies' || v === 'big companies' || v === 'big company' || v === 'enterprise') {
    return 'big_company';
  }

  // sme matches
  if (v === 'sme' || v === 'small' || v === 'small business' || v === 'sme_companies' || v === 'sme companies') {
    return 'sme';
  }

  // freelance matches
  if (v === 'freelance' || v === 'freelance_lead' || v === 'freelance leads' || v === 'freelance_leads' || v === 'solo' || v === 'freelancer') {
    return 'freelance';
  }

  return 'sme';
};

// ── Company mappers ──

export const companyFromDb = (row: any): Company => ({
  id: safeString(row?.id),
  name: safeString(row?.name),
  databaseType: row?.database_type ?? row?.databaseType,
  category: row?.category ?? undefined,
  industry: row?.industry ?? undefined,
  country: row?.country ?? undefined,
  city: row?.city ?? undefined,
  website: row?.website ?? undefined,
  linkedin: row?.linkedin ?? undefined,
  priority: row?.priority ?? undefined,
  fitScore: safeNumber(row?.fit_score ?? row?.fitScore),
  ethicalFit: row?.ethical_fit ?? row?.ethicalFit ?? undefined,
  status: row?.status ?? undefined,
  nextAction: row?.next_action ?? row?.nextAction ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
});

export const companyToDb = (input: CompanyInput) => ({
  name: input.name.trim(),
  database_type: normalizeDatabaseType(input.databaseType),
  category: input.category,
  industry: input.industry,
  country: input.country,
  city: input.city,
  website: input.website,
  linkedin: input.linkedin,
  priority: input.priority,
  fit_score: toNullableNumber(input.fitScore),
  ethical_fit: input.ethicalFit,
  status: input.status,
  next_action: input.nextAction,
  notes: input.notes,
});

// ── Person mappers ──

export const personFromDb = (row: any, companyName?: string): Person => ({
  id: safeString(row?.id),
  companyId: row?.company_id ?? row?.companyId ?? undefined,
  companyName,
  fullName: safeString(row?.full_name ?? row?.fullName),
  role: row?.role ?? undefined,
  department: row?.department ?? undefined,
  seniority: row?.seniority ?? undefined,
  decisionPower: safeNumber(row?.decision_power ?? row?.decisionPower),
  influencePower: safeNumber(row?.influence_power ?? row?.influencePower),
  relevance: safeNumber(row?.relevance),
  linkedin: row?.linkedin ?? undefined,
  emailPublic: row?.email_public ?? row?.emailPublic ?? undefined,
  contactChannel: row?.contact_channel ?? row?.contactChannel ?? undefined,
  relationshipStatus: row?.relationship_status ?? row?.relationshipStatus ?? undefined,
  nextFollowUpDate: toIso(row?.next_followup_date ?? row?.nextFollowUpDate),
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
});

export const personToDb = (input: PersonInput) => ({
  company_id: toNullableString(input.companyId),
  full_name: input.fullName.trim(),
  role: input.role,
  department: input.department,
  seniority: input.seniority,
  decision_power: input.decisionPower,
  influence_power: input.influencePower,
  relevance: input.relevance,
  linkedin: input.linkedin,
  email_public: input.emailPublic,
  contact_channel: input.contactChannel,
  relationship_status: input.relationshipStatus,
  next_followup_date: toNullableDate(input.nextFollowUpDate),
  notes: input.notes,
});

// ── Message mappers ──

export const messageFromDb = (row: any, companyName?: string, personName?: string): OutreachMessage => ({
  id: safeString(row?.id),
  companyId: row?.company_id ?? row?.companyId ?? undefined,
  companyName,
  personId: row?.person_id ?? row?.personId ?? undefined,
  personName,
  channel: row?.channel ?? undefined,
  language: row?.language ?? undefined,
  messageType: row?.message_type ?? row?.messageType ?? undefined,
  messageText: row?.message_text ?? row?.messageText ?? undefined,
  sentDate: toIso(row?.sent_date ?? row?.sentDate),
  replyStatus: row?.reply_status ?? row?.replyStatus ?? undefined,
  replySummary: row?.reply_summary ?? row?.replySummary ?? undefined,
  nextFollowUpDate: toIso(row?.next_followup_date ?? row?.nextFollowUpDate),
  status: row?.status ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
});

export const messageToDb = (input: MessageInput) => ({
  company_id: toNullableString(input.companyId),
  person_id: toNullableString(input.personId),
  channel: input.channel,
  language: input.language,
  message_type: input.messageType,
  message_text: input.messageText,
  sent_date: toNullableDate(input.sentDate),
  reply_status: input.replyStatus,
  reply_summary: input.replySummary,
  next_followup_date: toNullableDate(input.nextFollowUpDate),
  status: input.status,
});

// ── Deal mappers ──

export const dealFromDb = (row: any, companyName?: string, personName?: string): Deal => ({
  id: safeString(row?.id),
  companyId: row?.company_id ?? row?.companyId ?? undefined,
  companyName,
  personId: row?.person_id ?? row?.personId ?? undefined,
  personName,
  servicePackage: row?.service_package ?? row?.servicePackage ?? undefined,
  problem: row?.problem ?? undefined,
  proposedSolution: row?.proposed_solution ?? row?.proposedSolution ?? undefined,
  value: safeNumber(row?.value),
  currency: row?.currency ?? undefined,
  stage: row?.stage ?? undefined,
  probability: typeof row?.probability === 'number' ? row.probability : safeNumber(row?.probability),
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
});

export const dealToDb = (input: DealInput) => ({
  company_id: toNullableString(input.companyId),
  person_id: toNullableString(input.personId),
  service_package: input.servicePackage,
  problem: input.problem,
  proposed_solution: input.proposedSolution,
  value: toNullableNumber(input.value),
  currency: input.currency,
  stage: input.stage,
  probability: toNullableNumber(input.probability) == null ? null : toNullableNumber(input.probability)! / 100,
  notes: input.notes,
});

// ── MessageTemplate mappers ──

export const templateFromDb = (row: any): MessageTemplate => ({
  id: safeString(row?.id),
  name: safeString(row?.name),
  audience: safeString(row?.audience),
  goal: safeString(row?.goal),
  language: safeString(row?.language),
  subject: row?.subject ?? undefined,
  body: safeString(row?.body),
  isActive: row?.is_active ?? row?.isActive ?? true,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const templateToDb = (input: MessageTemplateInput) => ({
  name: input.name.trim(),
  audience: toNullableString(input.audience),
  goal: toNullableString(input.goal),
  language: toNullableString(input.language),
  subject: toNullableString(input.subject),
  body: input.body,
  is_active: input.isActive ?? true,
});

// ── Project mappers ──

export const projectFromDb = (row: any, relatedCompanyName?: string, relatedPersonName?: string): Project => ({
  id: safeString(row?.id),
  name: safeString(row?.name),
  type: row?.type ?? undefined,
  status: row?.status ?? undefined,
  phase: row?.phase ?? undefined,
  priority: row?.priority ?? undefined,
  progress: safeNumber(row?.progress),
  startDate: toIso(row?.start_date ?? row?.startDate),
  deadline: toIso(row?.deadline ?? row?.deadline),
  relatedCompanyId: row?.related_company_id ?? row?.relatedCompanyId ?? undefined,
  relatedCompanyName,
  relatedPersonId: row?.related_person_id ?? row?.relatedPersonId ?? undefined,
  relatedPersonName,
  portfolioUrl: row?.portfolio_url ?? row?.portfolioUrl ?? undefined,
  figmaUrl: row?.figma_url ?? row?.figmaUrl ?? undefined,
  githubUrl: row?.github_url ?? row?.githubUrl ?? undefined,
  notes: row?.notes ?? undefined,
  nextAction: row?.next_action ?? row?.nextAction ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const projectToDb = (input: ProjectInput) => ({
  name: input.name.trim(),
  type: input.type || null,
  status: input.status || 'planned',
  phase: input.phase || 'idea',
  priority: input.priority || 'medium',
  progress: input.progress != null ? Math.max(0, Math.min(100, Number(input.progress))) : 0,
  start_date: toNullableDate(input.startDate),
  deadline: toNullableDate(input.deadline),
  related_company_id: toNullableString(input.relatedCompanyId),
  related_person_id: toNullableString(input.relatedPersonId),
  portfolio_url: toNullableString(input.portfolioUrl),
  figma_url: toNullableString(input.figmaUrl),
  github_url: toNullableString(input.githubUrl),
  notes: toNullableString(input.notes),
  next_action: toNullableString(input.nextAction),
});
