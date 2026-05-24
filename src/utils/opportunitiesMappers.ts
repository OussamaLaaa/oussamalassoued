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
  Invoice,
  InvoiceInput,
  InvoiceItem,
  InvoiceItemInput,
  GeneratedDocument,
  GeneratedDocumentInput,
  AIProviderKey,
  AIProviderKeyInput,
  AIUseCaseSetting,
  AIUseCaseSettingInput,
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

export const projectToDbUpdate = (input: Partial<ProjectInput>) => {
  const db: Record<string, unknown> = {};
  if (input.name !== undefined) db.name = input.name.trim();
  if (input.type !== undefined) db.type = input.type || null;
  if (input.status !== undefined) db.status = input.status;
  if (input.phase !== undefined) db.phase = input.phase;
  if (input.priority !== undefined) db.priority = input.priority;
  if (input.progress !== undefined) db.progress = Math.max(0, Math.min(100, Number(input.progress)));
  if (input.startDate !== undefined) db.start_date = toNullableDate(input.startDate);
  if (input.deadline !== undefined) db.deadline = toNullableDate(input.deadline);
  if (input.relatedCompanyId !== undefined) db.related_company_id = toNullableString(input.relatedCompanyId);
  if (input.relatedPersonId !== undefined) db.related_person_id = toNullableString(input.relatedPersonId);
  if (input.portfolioUrl !== undefined) db.portfolio_url = toNullableString(input.portfolioUrl);
  if (input.figmaUrl !== undefined) db.figma_url = toNullableString(input.figmaUrl);
  if (input.githubUrl !== undefined) db.github_url = toNullableString(input.githubUrl);
  if (input.notes !== undefined) db.notes = toNullableString(input.notes);
  if (input.nextAction !== undefined) db.next_action = toNullableString(input.nextAction);
  return db;
};

// ── ProjectTask mappers ──

export const projectTaskFromDb = (row: any): ProjectTask => ({
  id: safeString(row?.id),
  projectId: safeString(row?.project_id ?? row?.projectId),
  title: safeString(row?.title),
  description: row?.description ?? undefined,
  status: row?.status ?? 'todo',
  priority: row?.priority ?? 'medium',
  dueDate: toIso(row?.due_date ?? row?.dueDate),
  assignedToPersonId: row?.assigned_to_person_id ?? row?.assignedToPersonId ?? undefined,
  assignedToPersonName: undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const projectTaskToDb = (input: ProjectTaskInput) => ({
  project_id: input.projectId,
  title: input.title.trim(),
  description: toNullableString(input.description),
  status: input.status || 'todo',
  priority: input.priority || 'medium',
  due_date: toNullableDate(input.dueDate),
  assigned_to_person_id: toNullableString(input.assignedToPersonId),
});

export const projectTaskToDbUpdate = (input: Partial<ProjectTaskInput>) => {
  const db: Record<string, unknown> = {};
  if (input.projectId !== undefined) db.project_id = input.projectId;
  if (input.title !== undefined) db.title = input.title.trim();
  if (input.description !== undefined) db.description = toNullableString(input.description);
  if (input.status !== undefined) db.status = input.status;
  if (input.priority !== undefined) db.priority = input.priority;
  if (input.dueDate !== undefined) db.due_date = toNullableDate(input.dueDate);
  if (input.assignedToPersonId !== undefined) db.assigned_to_person_id = toNullableString(input.assignedToPersonId);
  return db;
};

// ── ProjectTimeLog mappers ──

export const projectTimeLogFromDb = (row: any): ProjectTimeLog => ({
  id: safeString(row?.id),
  projectId: safeString(row?.project_id ?? row?.projectId),
  title: safeString(row?.title),
  description: row?.description ?? undefined,
  hours: safeNumber(row?.hours) ?? 0,
  workDate: row?.work_date ?? row?.workDate ?? new Date().toISOString(),
  createdAt: toIso(row?.created_at ?? row?.createdAt),
});

export const projectTimeLogToDb = (input: ProjectTimeLogInput) => ({
  project_id: input.projectId,
  title: input.title.trim(),
  description: toNullableString(input.description),
  hours: input.hours,
  work_date: input.workDate,
});

// ── ProjectMeeting mappers ──

export const projectMeetingFromDb = (row: any): ProjectMeeting => ({
  id: safeString(row?.id),
  projectId: safeString(row?.project_id ?? row?.projectId),
  title: safeString(row?.title),
  meetingDate: row?.meeting_date ?? row?.meetingDate ?? new Date().toISOString(),
  attendees: row?.attendees ?? undefined,
  agenda: row?.agenda ?? undefined,
  notes: row?.notes ?? undefined,
  outcome: row?.outcome ?? undefined,
  nextAction: row?.next_action ?? row?.nextAction ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const projectMeetingToDb = (input: ProjectMeetingInput) => ({
  project_id: input.projectId,
  title: input.title.trim(),
  meeting_date: input.meetingDate,
  attendees: toNullableString(input.attendees),
  agenda: toNullableString(input.agenda),
  notes: toNullableString(input.notes),
  outcome: toNullableString(input.outcome),
  next_action: toNullableString(input.nextAction),
});

// ── ProjectDocument mappers ──

export const projectDocumentFromDb = (row: any): ProjectDocument => ({
  id: safeString(row?.id),
  projectId: safeString(row?.project_id ?? row?.projectId),
  name: safeString(row?.name),
  type: row?.type ?? 'document',
  status: row?.status ?? undefined,
  url: row?.url ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const projectDocumentToDb = (input: ProjectDocumentInput) => ({
  project_id: input.projectId,
  name: input.name.trim(),
  type: input.type || 'document',
  status: toNullableString(input.status),
  url: toNullableString(input.url),
  notes: toNullableString(input.notes),
});

// ── ProjectFinanceItem mappers ──

export const projectFinanceItemFromDb = (row: any): ProjectFinanceItem => ({
  id: safeString(row?.id),
  projectId: safeString(row?.project_id ?? row?.projectId),
  title: safeString(row?.title),
  type: row?.type ?? 'income',
  amount: safeNumber(row?.amount) ?? 0,
  currency: row?.currency ?? undefined,
  status: row?.status ?? 'planned',
  dueDate: toIso(row?.due_date ?? row?.dueDate),
  paidDate: toIso(row?.paid_date ?? row?.paidDate),
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const projectFinanceItemToDb = (input: ProjectFinanceItemInput) => ({
  project_id: input.projectId,
  title: input.title.trim(),
  type: input.type || 'income',
  amount: input.amount,
  currency: toNullableString(input.currency),
  status: input.status || 'planned',
  due_date: toNullableDate(input.dueDate),
  paid_date: toNullableDate(input.paidDate),
  notes: toNullableString(input.notes),
});

// ── Document mappers ──

export const documentFromDb = (row: any): DocumentItem => ({
  id: safeString(row?.id),
  name: safeString(row?.name),
  type: row?.type ?? 'document',
  status: row?.status ?? 'draft',
  relatedProjectId: row?.related_project_id ?? row?.relatedProjectId ?? undefined,
  relatedCompanyId: row?.related_company_id ?? row?.relatedCompanyId ?? undefined,
  relatedPersonId: row?.related_person_id ?? row?.relatedPersonId ?? undefined,
  relatedDealId: row?.related_deal_id ?? row?.relatedDealId ?? undefined,
  amount: safeNumber(row?.amount),
  currency: row?.currency ?? undefined,
  issueDate: toIso(row?.issue_date ?? row?.issueDate),
  dueDate: toIso(row?.due_date ?? row?.dueDate),
  paidDate: toIso(row?.paid_date ?? row?.paidDate),
  url: row?.url ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const documentToDb = (input: Partial<DocumentInput>, options: { forUpdate?: boolean } = {}) => {
  const payload: Record<string, unknown> = {};
  const forUpdate = options.forUpdate ?? false;

  if (!forUpdate || input.name !== undefined) payload.name = String(input.name || '').trim();
  if (!forUpdate || input.type !== undefined) payload.type = input.type || 'document';
  if (!forUpdate || input.status !== undefined) payload.status = input.status || 'draft';
  if (!forUpdate || input.relatedProjectId !== undefined) payload.related_project_id = toNullableString(input.relatedProjectId);
  if (!forUpdate || input.relatedCompanyId !== undefined) payload.related_company_id = toNullableString(input.relatedCompanyId);
  if (!forUpdate || input.relatedPersonId !== undefined) payload.related_person_id = toNullableString(input.relatedPersonId);
  if (!forUpdate || input.relatedDealId !== undefined) payload.related_deal_id = toNullableString(input.relatedDealId);
  if (!forUpdate || input.amount !== undefined) payload.amount = toNullableNumber(input.amount);
  if (!forUpdate || input.currency !== undefined) payload.currency = toNullableString(input.currency);
  if (!forUpdate || input.issueDate !== undefined) payload.issue_date = toNullableDate(input.issueDate);
  if (!forUpdate || input.dueDate !== undefined) payload.due_date = toNullableDate(input.dueDate);
  if (!forUpdate || input.paidDate !== undefined) payload.paid_date = toNullableDate(input.paidDate);
  if (!forUpdate || input.url !== undefined) payload.url = toNullableString(input.url);
  if (!forUpdate || input.notes !== undefined) payload.notes = toNullableString(input.notes);

  return payload;
};

// ── Document Studio mappers ──

export const documentTemplateFromDb = (row: any): DocumentTemplate => ({
  id: safeString(row?.id),
  name: safeString(row?.name),
  type: row?.type ?? 'document',
  language: row?.language ?? 'english',
  description: row?.description ?? undefined,
  content: safeString(row?.content),
  variables: row?.variables ?? undefined,
  isActive: row?.is_active == null ? true : Boolean(row?.is_active),
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const documentTemplateToDb = (input: Partial<DocumentTemplateInput>) => ({
  name: String(input.name || '').trim(),
  type: input.type || 'document',
  language: input.language || 'english',
  description: toNullableString(input.description),
  content: String(input.content || '').trim(),
  variables: toNullableString(input.variables),
  is_active: input.isActive == null ? true : Boolean(input.isActive),
});

export const documentBrandSettingsFromDb = (row: any): DocumentBrandSettings => ({
  id: safeString(row?.id),
  brandName: row?.brand_name ?? row?.brandName ?? undefined,
  ownerName: row?.owner_name ?? row?.ownerName ?? undefined,
  email: row?.email ?? undefined,
  phone: row?.phone ?? undefined,
  website: row?.website ?? undefined,
  address: row?.address ?? undefined,
  logoUrl: row?.logo_url ?? row?.logoUrl ?? undefined,
  signatureUrl: row?.signature_url ?? row?.signatureUrl ?? undefined,
  signatureName: row?.signature_name ?? row?.signatureName ?? undefined,
  defaultCurrency: row?.default_currency ?? row?.defaultCurrency ?? undefined,
  paymentNotes: row?.payment_notes ?? row?.paymentNotes ?? undefined,
  legalNotes: row?.legal_notes ?? row?.legalNotes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const documentBrandSettingsToDb = (input: Partial<DocumentBrandSettingsInput>) => ({
  brand_name: toNullableString(input.brandName),
  owner_name: toNullableString(input.ownerName),
  email: toNullableString(input.email),
  phone: toNullableString(input.phone),
  website: toNullableString(input.website),
  address: toNullableString(input.address),
  logo_url: toNullableString(input.logoUrl),
  signature_url: toNullableString(input.signatureUrl),
  signature_name: toNullableString(input.signatureName),
  default_currency: toNullableString(input.defaultCurrency),
  payment_notes: toNullableString(input.paymentNotes),
  legal_notes: toNullableString(input.legalNotes),
});

export const invoiceFromDb = (row: any): Invoice => ({
  id: safeString(row?.id),
  invoiceNumber: safeString(row?.invoice_number ?? row?.invoiceNumber),
  title: safeString(row?.title),
  status: row?.status ?? 'draft',
  language: row?.language ?? 'english',
  issueDate: toIso(row?.issue_date ?? row?.issueDate),
  dueDate: toIso(row?.due_date ?? row?.dueDate),
  currency: row?.currency ?? 'MYR',
  sellerName: row?.seller_name ?? row?.sellerName ?? undefined,
  sellerEmail: row?.seller_email ?? row?.sellerEmail ?? undefined,
  sellerPhone: row?.seller_phone ?? row?.sellerPhone ?? undefined,
  sellerAddress: row?.seller_address ?? row?.sellerAddress ?? undefined,
  sellerCity: row?.seller_city ?? row?.sellerCity ?? undefined,
  sellerState: row?.seller_state ?? row?.sellerState ?? undefined,
  sellerZip: row?.seller_zip ?? row?.sellerZip ?? undefined,
  sellerTaxId: row?.seller_tax_id ?? row?.sellerTaxId ?? undefined,
  sellerLogoUrl: row?.seller_logo_url ?? row?.sellerLogoUrl ?? undefined,
  clientName: row?.client_name ?? row?.clientName ?? undefined,
  clientEmail: row?.client_email ?? row?.clientEmail ?? undefined,
  clientPhone: row?.client_phone ?? row?.clientPhone ?? undefined,
  clientAddress: row?.client_address ?? row?.clientAddress ?? undefined,
  clientCity: row?.client_city ?? row?.clientCity ?? undefined,
  clientState: row?.client_state ?? row?.clientState ?? undefined,
  clientZip: row?.client_zip ?? row?.clientZip ?? undefined,
  subtotal: safeNumber(row?.subtotal),
  discountAmount: safeNumber(row?.discount_amount ?? row?.discountAmount),
  taxRate: safeNumber(row?.tax_rate ?? row?.taxRate),
  taxAmount: safeNumber(row?.tax_amount ?? row?.taxAmount),
  total: safeNumber(row?.total),
  terms: row?.terms ?? undefined,
  notes: row?.notes ?? undefined,
  relatedProjectId: row?.related_project_id ?? row?.relatedProjectId ?? undefined,
  relatedCompanyId: row?.related_company_id ?? row?.relatedCompanyId ?? undefined,
  relatedPersonId: row?.related_person_id ?? row?.relatedPersonId ?? undefined,
  relatedDealId: row?.related_deal_id ?? row?.relatedDealId ?? undefined,
  generatedDocumentId: row?.generated_document_id ?? row?.generatedDocumentId ?? undefined,
  pdfStoragePath: row?.pdf_storage_path ?? row?.pdfStoragePath ?? undefined,
  externalUrl: row?.external_url ?? row?.externalUrl ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const invoiceToDb = (input: Partial<InvoiceInput>, options: { forUpdate?: boolean } = {}) => {
  const forUpdate = options.forUpdate ?? false;
  const payload: Record<string, unknown> = {};

  if (!forUpdate || input.invoiceNumber !== undefined) payload.invoice_number = String(input.invoiceNumber || '').trim();
  if (!forUpdate || input.title !== undefined) payload.title = String(input.title || '').trim();
  if (!forUpdate || input.status !== undefined) payload.status = input.status || 'draft';
  if (!forUpdate || input.language !== undefined) payload.language = input.language || 'english';
  if (!forUpdate || input.issueDate !== undefined) payload.issue_date = toNullableDate(input.issueDate);
  if (!forUpdate || input.dueDate !== undefined) payload.due_date = toNullableDate(input.dueDate);
  if (!forUpdate || input.currency !== undefined) payload.currency = toNullableString(input.currency) || 'MYR';
  if (!forUpdate || input.sellerName !== undefined) payload.seller_name = toNullableString(input.sellerName);
  if (!forUpdate || input.sellerEmail !== undefined) payload.seller_email = toNullableString(input.sellerEmail);
  if (!forUpdate || input.sellerPhone !== undefined) payload.seller_phone = toNullableString(input.sellerPhone);
  if (!forUpdate || input.sellerAddress !== undefined) payload.seller_address = toNullableString(input.sellerAddress);
  if (!forUpdate || input.sellerCity !== undefined) payload.seller_city = toNullableString(input.sellerCity);
  if (!forUpdate || input.sellerState !== undefined) payload.seller_state = toNullableString(input.sellerState);
  if (!forUpdate || input.sellerZip !== undefined) payload.seller_zip = toNullableString(input.sellerZip);
  if (!forUpdate || input.sellerTaxId !== undefined) payload.seller_tax_id = toNullableString(input.sellerTaxId);
  if (!forUpdate || input.sellerLogoUrl !== undefined) payload.seller_logo_url = toNullableString(input.sellerLogoUrl);
  if (!forUpdate || input.clientName !== undefined) payload.client_name = toNullableString(input.clientName);
  if (!forUpdate || input.clientEmail !== undefined) payload.client_email = toNullableString(input.clientEmail);
  if (!forUpdate || input.clientPhone !== undefined) payload.client_phone = toNullableString(input.clientPhone);
  if (!forUpdate || input.clientAddress !== undefined) payload.client_address = toNullableString(input.clientAddress);
  if (!forUpdate || input.clientCity !== undefined) payload.client_city = toNullableString(input.clientCity);
  if (!forUpdate || input.clientState !== undefined) payload.client_state = toNullableString(input.clientState);
  if (!forUpdate || input.clientZip !== undefined) payload.client_zip = toNullableString(input.clientZip);
  if (!forUpdate || input.subtotal !== undefined) payload.subtotal = toNullableNumber(input.subtotal);
  if (!forUpdate || input.discountAmount !== undefined) payload.discount_amount = toNullableNumber(input.discountAmount);
  if (!forUpdate || input.taxRate !== undefined) payload.tax_rate = toNullableNumber(input.taxRate);
  if (!forUpdate || input.taxAmount !== undefined) payload.tax_amount = toNullableNumber(input.taxAmount);
  if (!forUpdate || input.total !== undefined) payload.total = toNullableNumber(input.total);
  if (!forUpdate || input.terms !== undefined) payload.terms = toNullableString(input.terms);
  if (!forUpdate || input.notes !== undefined) payload.notes = toNullableString(input.notes);
  if (!forUpdate || input.relatedProjectId !== undefined) payload.related_project_id = toNullableString(input.relatedProjectId);
  if (!forUpdate || input.relatedCompanyId !== undefined) payload.related_company_id = toNullableString(input.relatedCompanyId);
  if (!forUpdate || input.relatedPersonId !== undefined) payload.related_person_id = toNullableString(input.relatedPersonId);
  if (!forUpdate || input.relatedDealId !== undefined) payload.related_deal_id = toNullableString(input.relatedDealId);
  if (!forUpdate || input.generatedDocumentId !== undefined) payload.generated_document_id = toNullableString(input.generatedDocumentId);
  if (!forUpdate || input.pdfStoragePath !== undefined) payload.pdf_storage_path = toNullableString(input.pdfStoragePath);
  if (!forUpdate || input.externalUrl !== undefined) payload.external_url = toNullableString(input.externalUrl);

  return payload;
};

export const invoiceItemFromDb = (row: any): InvoiceItem => ({
  id: safeString(row?.id),
  invoiceId: safeString(row?.invoice_id ?? row?.invoiceId),
  description: safeString(row?.description),
  quantity: safeNumber(row?.quantity) ?? 0,
  rate: safeNumber(row?.rate) ?? 0,
  amount: safeNumber(row?.amount) ?? 0,
  sortOrder: safeNumber(row?.sort_order ?? row?.sortOrder),
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const invoiceItemToDb = (input: Partial<InvoiceItemInput>, options: { forUpdate?: boolean } = {}) => {
  const forUpdate = options.forUpdate ?? false;
  const payload: Record<string, unknown> = {};

  if (!forUpdate || input.invoiceId !== undefined) payload.invoice_id = toNullableString(input.invoiceId);
  if (!forUpdate || input.description !== undefined) payload.description = String(input.description || '').trim();
  if (!forUpdate || input.quantity !== undefined) payload.quantity = toNullableNumber(input.quantity);
  if (!forUpdate || input.rate !== undefined) payload.rate = toNullableNumber(input.rate);
  if (!forUpdate || input.amount !== undefined) payload.amount = toNullableNumber(input.amount);
  if (!forUpdate || input.sortOrder !== undefined) payload.sort_order = toNullableNumber(input.sortOrder);

  return payload;
};

export const generatedDocumentFromDb = (row: any): GeneratedDocument => ({
  id: safeString(row?.id),
  title: safeString(row?.title),
  type: row?.type ?? 'document',
  status: row?.status ?? 'draft',
  language: row?.language ?? 'english',
  templateId: row?.template_id ?? row?.templateId ?? undefined,
  relatedProjectId: row?.related_project_id ?? row?.relatedProjectId ?? undefined,
  relatedCompanyId: row?.related_company_id ?? row?.relatedCompanyId ?? undefined,
  relatedPersonId: row?.related_person_id ?? row?.relatedPersonId ?? undefined,
  relatedDealId: row?.related_deal_id ?? row?.relatedDealId ?? undefined,
  content: row?.content ?? undefined,
  variablesJson: row?.variables_json ?? row?.variablesJson ?? undefined,
  amount: safeNumber(row?.amount),
  currency: row?.currency ?? undefined,
  issueDate: toIso(row?.issue_date ?? row?.issueDate),
  dueDate: toIso(row?.due_date ?? row?.dueDate),
  signedDate: toIso(row?.signed_date ?? row?.signedDate),
  pdfUrl: row?.pdf_url ?? row?.pdfUrl ?? undefined,
  pdfStoragePath: row?.pdf_storage_path ?? row?.pdfStoragePath ?? undefined,
  externalUrl: row?.external_url ?? row?.externalUrl ?? undefined,
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const generatedDocumentToDb = (input: Partial<GeneratedDocumentInput>, options: { forUpdate?: boolean } = {}) => {
  const forUpdate = options.forUpdate ?? false;
  const payload: Record<string, unknown> = {};

  if (!forUpdate || input.title !== undefined) payload.title = String(input.title || '').trim();
  if (!forUpdate || input.type !== undefined) payload.type = input.type || 'document';
  if (!forUpdate || input.status !== undefined) payload.status = input.status || 'draft';
  if (!forUpdate || input.language !== undefined) payload.language = input.language || 'english';
  if (!forUpdate || input.templateId !== undefined) payload.template_id = toNullableString(input.templateId);
  if (!forUpdate || input.relatedProjectId !== undefined) payload.related_project_id = toNullableString(input.relatedProjectId);
  if (!forUpdate || input.relatedCompanyId !== undefined) payload.related_company_id = toNullableString(input.relatedCompanyId);
  if (!forUpdate || input.relatedPersonId !== undefined) payload.related_person_id = toNullableString(input.relatedPersonId);
  if (!forUpdate || input.relatedDealId !== undefined) payload.related_deal_id = toNullableString(input.relatedDealId);
  if (!forUpdate || input.content !== undefined) payload.content = toNullableString(input.content);
  if (!forUpdate || input.variablesJson !== undefined) payload.variables_json = toNullableString(input.variablesJson);
  if (!forUpdate || input.amount !== undefined) payload.amount = toNullableNumber(input.amount);
  if (!forUpdate || input.currency !== undefined) payload.currency = toNullableString(input.currency);
  if (!forUpdate || input.issueDate !== undefined) payload.issue_date = toNullableDate(input.issueDate);
  if (!forUpdate || input.dueDate !== undefined) payload.due_date = toNullableDate(input.dueDate);
  if (!forUpdate || input.signedDate !== undefined) payload.signed_date = toNullableDate(input.signedDate);
  if (!forUpdate || input.pdfUrl !== undefined) payload.pdf_url = toNullableString(input.pdfUrl);
  if (!forUpdate || input.pdfStoragePath !== undefined) payload.pdf_storage_path = toNullableString(input.pdfStoragePath);
  if (!forUpdate || input.externalUrl !== undefined) payload.external_url = toNullableString(input.externalUrl);
  if (!forUpdate || input.notes !== undefined) payload.notes = toNullableString(input.notes);

  return payload;
};

export const aiProviderKeyFromDb = (row: any): AIProviderKey => ({
  id: safeString(row?.id),
  label: safeString(row?.label),
  provider: row?.provider ?? 'gemini',
  apiKeyLast4: row?.api_key_last4 ?? row?.apiKeyLast4 ?? undefined,
  baseUrl: row?.base_url ?? row?.baseUrl ?? undefined,
  endpoint: row?.endpoint ?? undefined,
  deploymentName: row?.deployment_name ?? row?.deploymentName ?? undefined,
  apiVersion: row?.api_version ?? row?.apiVersion ?? undefined,
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const aiProviderKeyToDb = (input: Partial<AIProviderKeyInput>, options: { forUpdate?: boolean } = {}) => {
  const forUpdate = options.forUpdate ?? false;
  const payload: Record<string, unknown> = {};

  if (!forUpdate || input.label !== undefined) payload.label = String(input.label || '').trim();
  if (!forUpdate || input.provider !== undefined) payload.provider = input.provider || 'gemini';
  if (!forUpdate || input.baseUrl !== undefined) payload.base_url = toNullableString(input.baseUrl);
  if (!forUpdate || input.endpoint !== undefined) payload.endpoint = toNullableString(input.endpoint);
  if (!forUpdate || input.deploymentName !== undefined) payload.deployment_name = toNullableString(input.deploymentName);
  if (!forUpdate || input.apiVersion !== undefined) payload.api_version = toNullableString(input.apiVersion);
  if (!forUpdate || input.isActive !== undefined) payload.is_active = input.isActive == null ? true : Boolean(input.isActive);
  if (!forUpdate || input.notes !== undefined) payload.notes = toNullableString(input.notes);

  return payload;
};

export const aiUseCaseSettingFromDb = (row: any): AIUseCaseSetting => ({
  id: safeString(row?.id),
  useCase: row?.use_case ?? row?.useCase ?? 'message',
  providerKeyId: row?.provider_key_id ?? row?.providerKeyId ?? undefined,
  providerKeyLabel: row?.provider_key_label ?? row?.providerKeyLabel ?? undefined,
  provider: row?.provider ?? undefined,
  model: row?.model ?? undefined,
  temperature: row?.temperature == null ? undefined : Number(row.temperature),
  maxOutputTokens: row?.max_output_tokens == null ? undefined : Number(row.max_output_tokens),
  isEnabled: row?.is_enabled == null ? true : Boolean(row.is_enabled),
  notes: row?.notes ?? undefined,
  createdAt: toIso(row?.created_at ?? row?.createdAt),
  updatedAt: toIso(row?.updated_at ?? row?.updatedAt),
});

export const aiUseCaseSettingToDb = (input: Partial<AIUseCaseSettingInput>, options: { forUpdate?: boolean } = {}) => {
  const forUpdate = options.forUpdate ?? false;
  const payload: Record<string, unknown> = {};

  if (!forUpdate || input.useCase !== undefined) payload.use_case = input.useCase || 'message';
  if (!forUpdate || input.providerKeyId !== undefined) payload.provider_key_id = toNullableString(input.providerKeyId);
  if (!forUpdate || input.provider !== undefined) payload.provider = toNullableString(input.provider);
  if (!forUpdate || input.model !== undefined) payload.model = toNullableString(input.model);
  if (!forUpdate || input.temperature !== undefined) payload.temperature = toNullableNumber(input.temperature);
  if (!forUpdate || input.maxOutputTokens !== undefined) payload.max_output_tokens = toNullableNumber(input.maxOutputTokens);
  if (!forUpdate || input.isEnabled !== undefined) payload.is_enabled = input.isEnabled == null ? true : Boolean(input.isEnabled);
  if (!forUpdate || input.notes !== undefined) payload.notes = toNullableString(input.notes);

  return payload;
};
