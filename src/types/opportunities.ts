export interface Company {
  id: string;
  name: string;
  databaseType?: string;
  category?: string;
  industry?: string;
  country?: string;
  city?: string;
  website?: string;
  linkedin?: string;
  priority?: 'low' | 'medium' | 'high';
  fitScore?: number;
  ethicalFit?: 'low' | 'medium' | 'high' | 'good' | 'needs_review' | 'avoid';
  status?: 'prospect' | 'contacted' | 'qualified' | 'lost' | 'customer';
  nextAction?: string;
  notes?: string;
  createdAt?: string;
}

export interface Person {
  id: string;
  companyId?: string;
  companyName?: string;
  fullName: string;
  role?: string;
  department?: string;
  seniority?: string;
  decisionPower?: number;
  influencePower?: number;
  relevance?: number;
  linkedin?: string;
  emailPublic?: string;
  contactChannel?: string;
  relationshipStatus?: string;
  nextFollowUpDate?: string;
  notes?: string;
  createdAt?: string;
}

export interface OutreachMessage {
  id: string;
  companyId?: string;
  companyName?: string;
  personId?: string;
  personName?: string;
  channel?: string;
  language?: string;
  messageType?: string;
  messageText?: string;
  sentDate?: string;
  replyStatus?: 'no_reply' | 'replied' | 'waiting' | 'bounced' | 'none';
  replySummary?: string;
  nextFollowUpDate?: string;
  status?: 'sent' | 'scheduled' | 'failed' | 'draft';
  createdAt?: string;
}

export interface Deal {
  id: string;
  companyId?: string;
  companyName?: string;
  personId?: string;
  personName?: string;
  servicePackage?: string;
  problem?: string;
  proposedSolution?: string;
  value?: number;
  currency?: string;
  stage?: 'discovery' | 'proposal_sent' | 'negotiation' | 'won' | 'lost' | string;
  probability?: number;
  notes?: string;
  createdAt?: string;
}

export interface MessageTemplate {
  id: string;
  name: string;
  audience: string;
  goal: string;
  language: string;
  subject?: string;
  body: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CompanyInput {
  name: string;
  databaseType?: 'big_company' | 'sme' | 'freelance';
  category?: string;
  industry?: string;
  country?: string;
  city?: string;
  website?: string;
  linkedin?: string;
  priority?: 'low' | 'medium' | 'high';
  fitScore?: number;
  ethicalFit?: 'good' | 'needs_review' | 'avoid';
  status?: Company['status'];
  nextAction?: string;
  notes?: string;
}

export interface PersonInput {
  companyId?: string;
  fullName: string;
  role?: string;
  department?: string;
  seniority?: string;
  decisionPower?: 'high' | 'medium' | 'low' | 'unknown';
  influencePower?: 'high' | 'medium' | 'low' | 'unknown';
  relevance?: 'high' | 'medium' | 'low';
  linkedin?: string;
  emailPublic?: string;
  contactChannel?: string;
  relationshipStatus?: string;
  nextFollowUpDate?: string;
  notes?: string;
}

export interface MessageInput {
  companyId?: string;
  personId?: string;
  channel?: 'LinkedIn' | 'Email' | 'Website Form' | 'Instagram' | 'Other' | string;
  language?: 'Arabic' | 'French' | 'English' | string;
  messageType?: string;
  messageText?: string;
  sentDate?: string;
  replyStatus?: 'no_reply' | 'replied' | 'waiting' | 'bounced' | 'none';
  replySummary?: string;
  nextFollowUpDate?: string;
  status?: 'sent' | 'scheduled' | 'failed' | 'draft';
}

export interface DealInput {
  companyId?: string;
  personId?: string;
  servicePackage?: string;
  problem?: string;
  proposedSolution?: string;
  value?: number;
  currency?: 'TND' | 'USD' | 'EUR' | 'AED' | string;
  stage?: 'discovery' | 'proposal_sent' | 'negotiation' | 'won' | 'lost' | string;
  probability?: number;
  notes?: string;
}

export interface Project {
  id: string;
  name: string;
  type?: 'portfolio' | 'client' | 'personal_product' | 'case_study' | 'learning' | 'experiment';
  status?: 'planned' | 'active' | 'paused' | 'blocked' | 'completed' | 'archived';
  phase?: 'idea' | 'research' | 'ux_audit' | 'wireframes' | 'ui_design' | 'prototype' | 'case_study' | 'published' | 'archived';
  priority?: 'high' | 'medium' | 'low';
  progress?: number;
  startDate?: string;
  deadline?: string;
  relatedCompanyId?: string;
  relatedCompanyName?: string;
  relatedPersonId?: string;
  relatedPersonName?: string;
  portfolioUrl?: string;
  figmaUrl?: string;
  githubUrl?: string;
  notes?: string;
  nextAction?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectTask {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: 'todo' | 'doing' | 'done' | 'blocked';
  priority: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedToPersonId?: string;
  assignedToPersonName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectTaskInput {
  projectId: string;
  title: string;
  description?: string;
  status?: 'todo' | 'doing' | 'done' | 'blocked';
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignedToPersonId?: string;
}

export interface ProjectTimeLog {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  hours: number;
  workDate: string;
  createdAt?: string;
}

export interface ProjectTimeLogInput {
  projectId: string;
  title: string;
  description?: string;
  hours: number;
  workDate: string;
}

export interface ProjectMeeting {
  id: string;
  projectId: string;
  title: string;
  meetingDate: string;
  attendees?: string;
  agenda?: string;
  notes?: string;
  outcome?: string;
  nextAction?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectMeetingInput {
  projectId: string;
  title: string;
  meetingDate: string;
  attendees?: string;
  agenda?: string;
  notes?: string;
  outcome?: string;
  nextAction?: string;
}

export interface ProjectDocument {
  id: string;
  projectId: string;
  name: string;
  type: 'contract' | 'invoice' | 'agreement' | 'brief' | 'receipt' | 'link' | 'document' | 'other';
  status?: string;
  url?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectDocumentInput {
  projectId: string;
  name: string;
  type: ProjectDocument['type'];
  status?: string;
  url?: string;
  notes?: string;
}

export interface ProjectFinanceItem {
  id: string;
  projectId: string;
  title: string;
  type: 'income' | 'expense' | 'invoice' | 'payment' | 'investment';
  amount: number;
  currency?: string;
  status: 'planned' | 'sent' | 'paid' | 'unpaid' | 'overdue' | 'cancelled';
  dueDate?: string;
  paidDate?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ProjectFinanceItemInput {
  projectId: string;
  title: string;
  type: ProjectFinanceItem['type'];
  amount: number;
  currency?: string;
  status?: ProjectFinanceItem['status'];
  dueDate?: string;
  paidDate?: string;
  notes?: string;
}

export type DocumentType = 'invoice' | 'contract' | 'cahier_de_charges' | 'proposal' | 'agreement' | 'receipt' | 'ux_audit_report' | 'project_brief' | 'document' | 'other' | 'legal' | 'admin';
export type DocumentStatus = 'draft' | 'ready' | 'sent' | 'signed' | 'paid' | 'unpaid' | 'archived' | 'cancelled' | 'overdue';
export type DocumentLanguage = 'english' | 'french' | 'arabic';

export type InvoiceStatus = 'draft' | 'ready' | 'sent' | 'paid' | 'unpaid' | 'overdue' | 'cancelled' | 'archived';
export type InvoiceLanguage = 'english' | 'french' | 'arabic';

export interface DocumentItem {
  id: string;
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  relatedProjectId?: string;
  relatedProjectName?: string;
  relatedCompanyId?: string;
  relatedCompanyName?: string;
  relatedPersonId?: string;
  relatedPersonName?: string;
  relatedDealId?: string;
  relatedDealName?: string;
  amount?: number;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  paidDate?: string;
  url?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentInput {
  name: string;
  type: DocumentType;
  status: DocumentStatus;
  relatedProjectId?: string;
  relatedCompanyId?: string;
  relatedPersonId?: string;
  relatedDealId?: string;
  amount?: number;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  paidDate?: string;
  url?: string;
  notes?: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  title: string;
  status: InvoiceStatus;
  language: InvoiceLanguage;
  issueDate?: string;
  dueDate?: string;
  currency: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerAddress?: string;
  sellerCity?: string;
  sellerState?: string;
  sellerZip?: string;
  sellerTaxId?: string;
  sellerLogoUrl?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientZip?: string;
  subtotal?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  terms?: string;
  notes?: string;
  relatedProjectId?: string;
  relatedProjectName?: string;
  relatedCompanyId?: string;
  relatedCompanyName?: string;
  relatedPersonId?: string;
  relatedPersonName?: string;
  relatedDealId?: string;
  relatedDealName?: string;
  generatedDocumentId?: string;
  pdfStoragePath?: string;
  externalUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceInput {
  invoiceNumber: string;
  title: string;
  status: InvoiceStatus;
  language: InvoiceLanguage;
  issueDate?: string;
  dueDate?: string;
  currency: string;
  sellerName?: string;
  sellerEmail?: string;
  sellerPhone?: string;
  sellerAddress?: string;
  sellerCity?: string;
  sellerState?: string;
  sellerZip?: string;
  sellerTaxId?: string;
  sellerLogoUrl?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientAddress?: string;
  clientCity?: string;
  clientState?: string;
  clientZip?: string;
  subtotal?: number;
  discountAmount?: number;
  taxRate?: number;
  taxAmount?: number;
  total?: number;
  terms?: string;
  notes?: string;
  relatedProjectId?: string;
  relatedCompanyId?: string;
  relatedPersonId?: string;
  relatedDealId?: string;
  generatedDocumentId?: string;
  pdfStoragePath?: string;
  externalUrl?: string;
}

export interface InvoiceItem {
  id: string;
  invoiceId: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  sortOrder?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface InvoiceItemInput {
  invoiceId: string;
  description: string;
  quantity: number;
  rate: number;
  amount: number;
  sortOrder?: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  type: DocumentType;
  language: DocumentLanguage;
  description?: string;
  content: string;
  variables?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentTemplateInput {
  name: string;
  type: DocumentType;
  language: DocumentLanguage;
  description?: string;
  content: string;
  variables?: string;
  isActive?: boolean;
}

export interface DocumentBrandSettings {
  id: string;
  brandName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  logoUrl?: string;
  signatureUrl?: string;
  signatureName?: string;
  defaultCurrency?: string;
  paymentNotes?: string;
  legalNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface DocumentBrandSettingsInput {
  brandName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  logoUrl?: string;
  signatureUrl?: string;
  signatureName?: string;
  defaultCurrency?: string;
  paymentNotes?: string;
  legalNotes?: string;
}

export type AIProvider = 'gemini' | 'openai' | 'anthropic' | 'openrouter' | 'nvidia' | 'azure_openai' | 'ollama';
export type AIUseCase = 'message' | 'finance' | 'document' | 'lead_scoring' | 'research' | 'cleanup' | 'strategy';

export interface AIProviderKey {
  id: string;
  label: string;
  provider: AIProvider;
  apiKeyLast4?: string;
  baseUrl?: string;
  endpoint?: string;
  deploymentName?: string;
  apiVersion?: string;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIProviderKeyInput {
  label: string;
  provider: AIProvider;
  apiKey?: string;
  baseUrl?: string;
  endpoint?: string;
  deploymentName?: string;
  apiVersion?: string;
  isActive?: boolean;
  notes?: string;
}

export interface AIUseCaseSetting {
  id: string;
  useCase: AIUseCase;
  providerKeyId?: string;
  providerKeyLabel?: string;
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  isEnabled: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AIUseCaseSettingInput {
  useCase: AIUseCase;
  providerKeyId?: string;
  providerKeyLabel?: string;
  provider?: AIProvider;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  isEnabled?: boolean;
  notes?: string;
}

export interface GeneratedDocument {
  id: string;
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  language: DocumentLanguage;
  templateId?: string;
  templateName?: string;
  relatedProjectId?: string;
  relatedProjectName?: string;
  relatedCompanyId?: string;
  relatedCompanyName?: string;
  relatedPersonId?: string;
  relatedPersonName?: string;
  relatedDealId?: string;
  relatedDealName?: string;
  content?: string;
  variablesJson?: string;
  amount?: number;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  signedDate?: string;
  pdfUrl?: string;
  pdfStoragePath?: string;
  externalUrl?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GeneratedDocumentInput {
  title: string;
  type: DocumentType;
  status: DocumentStatus;
  language: DocumentLanguage;
  templateId?: string;
  relatedProjectId?: string;
  relatedCompanyId?: string;
  relatedPersonId?: string;
  relatedDealId?: string;
  content?: string;
  variablesJson?: string;
  amount?: number;
  currency?: string;
  issueDate?: string;
  dueDate?: string;
  signedDate?: string;
  pdfUrl?: string;
  pdfStoragePath?: string;
  externalUrl?: string;
  notes?: string;
}

export interface ProjectInput {
  name: string;
  type?: Project['type'];
  status?: Project['status'];
  phase?: Project['phase'];
  priority?: Project['priority'];
  progress?: number;
  startDate?: string;
  deadline?: string;
  relatedCompanyId?: string;
  relatedPersonId?: string;
  portfolioUrl?: string;
  figmaUrl?: string;
  githubUrl?: string;
  notes?: string;
  nextAction?: string;
}

export interface MessageTemplateInput {
  name: string;
  audience: string;
  goal: string;
  language: string;
  subject?: string;
  body: string;
  isActive?: boolean;
}

export type RelationshipDomain = 'ux_ui' | 'founders' | 'recruiters' | 'designers' | 'developers' | 'clients' | 'mentors' | 'investors' | 'local_business' | 'family' | 'friends' | 'other';
export type RelationshipType = 'professional' | 'client' | 'mentor' | 'peer' | 'recruiter' | 'founder' | 'family' | 'friend' | 'community' | 'other';
export type RelationshipStrength = 'weak' | 'medium' | 'strong';
export type TrustLevel = 'unknown' | 'low' | 'medium' | 'high';
export type RelationshipStatus = 'active' | 'warm' | 'cold' | 'paused' | 'avoid' | 'archived';
export type RelationshipInteractionChannel = 'linkedin' | 'email' | 'phone' | 'meeting' | 'whatsapp' | 'in_person' | 'other';
export type RelationshipInteractionType = 'first_contact' | 'follow_up' | 'meeting' | 'help_given' | 'help_received' | 'problem' | 'opportunity' | 'note';
export type RelationshipContactMethodType = 'email' | 'phone' | 'linkedin' | 'whatsapp' | 'telegram' | 'instagram' | 'facebook' | 'website' | 'location' | 'other';

export interface RelationshipCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelationshipCategoryInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
  isActive?: boolean;
}

export interface Relationship {
  id: string;
  personId?: string;
  personName?: string;
  categoryId?: string;
  categoryName?: string;
  categorySlug?: string;
  categoryColor?: string;
  displayName: string;
  domain?: RelationshipDomain;
  relationshipType?: RelationshipType;
  relationshipStrength?: RelationshipStrength;
  trustLevel?: TrustLevel;
  status?: RelationshipStatus;
  howWeMet?: string;
  whatTheyNeed?: string;
  howICanHelp?: string;
  howTheyCanHelpMe?: string;
  sharedInterests?: string;
  lastContactDate?: string;
  nextContactDate?: string;
  nextAction?: string;
  problems?: string;
  riskNotes?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelationshipInput {
  personId?: string | null;
  categoryId?: string | null;
  displayName: string;
  domain?: RelationshipDomain;
  relationshipType?: RelationshipType;
  relationshipStrength?: RelationshipStrength;
  trustLevel?: TrustLevel;
  status?: RelationshipStatus;
  howWeMet?: string;
  whatTheyNeed?: string;
  howICanHelp?: string;
  howTheyCanHelpMe?: string;
  sharedInterests?: string;
  lastContactDate?: string | null;
  nextContactDate?: string | null;
  nextAction?: string;
  problems?: string;
  riskNotes?: string;
  notes?: string;
}

export interface RelationshipInteraction {
  id: string;
  relationshipId: string;
  interactionDate: string;
  channel?: RelationshipInteractionChannel;
  type?: RelationshipInteractionType;
  summary?: string;
  outcome?: string;
  nextAction?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelationshipInteractionInput {
  relationshipId: string;
  interactionDate: string;
  channel?: RelationshipInteractionChannel;
  type?: RelationshipInteractionType;
  summary?: string;
  outcome?: string;
  nextAction?: string;
}

export interface RelationshipOpportunity {
  id: string;
  relationshipId: string;
  title: string;
  type?: string;
  status?: string;
  priority?: string;
  valueDescription?: string;
  nextAction?: string;
  dueDate?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelationshipOpportunityInput {
  relationshipId: string;
  title: string;
  type?: string;
  status?: string;
  priority?: string;
  valueDescription?: string;
  nextAction?: string;
  dueDate?: string | null;
  linkedProjectId?: string | null;
  linkedCompanyId?: string | null;
  notes?: string;
}

export interface RelationshipContactMethod {
  id: string;
  relationshipId: string;
  type?: RelationshipContactMethodType;
  label?: string;
  value?: string;
  isPrimary?: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RelationshipContactMethodInput {
  relationshipId: string;
  type?: RelationshipContactMethodType;
  label?: string;
  value?: string;
  isPrimary?: boolean;
  notes?: string;
}

export interface OpportunitiesData {
  companies: Company[];
  people: Person[];
  messages: OutreachMessage[];
  deals: Deal[];
  relationships: Relationship[];
  relationshipInteractions: RelationshipInteraction[];
  relationshipOpportunities: RelationshipOpportunity[];
  relationshipCategories: RelationshipCategory[];
  relationshipContactMethods: RelationshipContactMethod[];
  projects: Project[];
  projectTasks: ProjectTask[];
  projectTimeLogs: ProjectTimeLog[];
  projectMeetings: ProjectMeeting[];
  projectDocuments: ProjectDocument[];
  projectFinanceItems: ProjectFinanceItem[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  documents: DocumentItem[];
  documentTemplates: DocumentTemplate[];
  documentBrandSettings: DocumentBrandSettings[];
  aiProviderKeys: AIProviderKey[];
  aiUseCaseSettings: AIUseCaseSetting[];
  generatedDocuments: GeneratedDocument[];
  templates: MessageTemplate[];
  strategyItems: StrategyItem[];
  strategyGoals: StrategyGoal[];
  strategyPlans: StrategyPlan[];
  strategyTactics: StrategyTactic[];
  strategyExperiments: StrategyExperiment[];
  strategyDecisions: StrategyDecision[];
  strategyNotes: StrategyNote[];
  plans: Plan[];
  planItems: PlanItem[];
  financeIncome: FinanceIncome[];
  financeExpenses: FinanceExpense[];
  financeAllocationRules: FinanceAllocationRule[];
  financePurchaseGoals: FinancePurchaseGoal[];
  financeInvestmentIdeas: FinanceInvestmentIdea[];
  financeInvestmentRules: FinanceInvestmentRule[];
  financeInvestmentAllocations: FinanceInvestmentAllocation[];
  financePeriods: FinancePeriod[];
  financeRecurringRules: FinanceRecurringRule[];
  tasks: Task[];
  recurringTasks: RecurringTask[];
  recurringTaskLogs: RecurringTaskLog[];
  taskWorkLogs: TaskWorkLog[];
  weeklyTaskReviews: WeeklyTaskReview[];
}

export type StrategySection =
  | 'career'
  | 'freelance'
  | 'portfolio'
  | 'money'
  | 'investment'
  | 'learning'
  | 'health'
  | 'ethical_filter'
  | 'positioning'
  | 'operations';

export type StrategyPriority = 'high' | 'medium' | 'low';
export type StrategyStatus = 'active' | 'planned' | 'paused' | 'completed' | 'archived' | 'failed';
export type StrategyTimeHorizon = 'yearly' | 'six_months' | 'quarterly' | 'monthly' | 'weekly' | 'daily';
export type StrategyPlanLabel = 'A' | 'B' | 'C' | 'D';

export interface StrategyItem {
  id: string;
  section: StrategySection;
  title: string;
  content?: string;
  priority: StrategyPriority;
  status: StrategyStatus;
  timeHorizon?: StrategyTimeHorizon;
  reviewDate?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  linkedPersonId?: string;
  linkedPersonName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StrategyItemInput {
  section: StrategySection;
  title: string;
  content?: string;
  priority?: StrategyPriority;
  status?: StrategyStatus;
  timeHorizon?: StrategyTimeHorizon;
  reviewDate?: string;
  linkedProjectId?: string;
  linkedCompanyId?: string;
  linkedPersonId?: string;
}

export interface StrategyGoal {
  id: string;
  title: string;
  description?: string;
  category: StrategySection;
  priority: StrategyPriority;
  status: StrategyStatus;
  timeHorizon?: StrategyTimeHorizon;
  progress?: number;
  targetDate?: string;
  successMetric?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StrategyPlan {
  id: string;
  name: string;
  label: StrategyPlanLabel;
  description?: string;
  status: StrategyStatus;
  priority: StrategyPriority;
  assumptions?: string;
  risks?: string;
  resourcesNeeded?: string;
  triggerToSwitch?: string;
  nextAction?: string;
  targetDate?: string;
  progress?: number;
  linkedGoalId?: string;
  linkedGoalTitle?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StrategyTactic {
  id: string;
  title: string;
  description?: string;
  category?: string;
  status: StrategyStatus;
  priority: StrategyPriority;
  frequency?: string;
  metric?: string;
  nextAction?: string;
  linkedGoalId?: string;
  linkedGoalTitle?: string;
  linkedPlanId?: string;
  linkedPlanName?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StrategyExperiment {
  id: string;
  title: string;
  hypothesis?: string;
  method?: string;
  metric?: string;
  result?: string;
  learning?: string;
  status: StrategyStatus;
  priority: StrategyPriority;
  startDate?: string;
  endDate?: string;
  linkedGoalId?: string;
  linkedGoalTitle?: string;
  linkedPlanId?: string;
  linkedPlanName?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StrategyDecision {
  id: string;
  title: string;
  context?: string;
  decision?: string;
  reason?: string;
  expectedResult?: string;
  reviewDate?: string;
  status: StrategyStatus;
  priority: StrategyPriority;
  linkedGoalId?: string;
  linkedGoalTitle?: string;
  linkedPlanId?: string;
  linkedPlanName?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface StrategyGoalInput {
  title: string;
  description?: string;
  category: StrategySection;
  priority?: StrategyPriority;
  status?: StrategyStatus;
  timeHorizon?: StrategyTimeHorizon;
  progress?: number;
  targetDate?: string;
  successMetric?: string;
  linkedProjectId?: string;
  linkedCompanyId?: string;
}

export interface StrategyPlanInput {
  name: string;
  label?: StrategyPlanLabel;
  description?: string;
  status?: StrategyStatus;
  priority?: StrategyPriority;
  assumptions?: string;
  risks?: string;
  resourcesNeeded?: string;
  triggerToSwitch?: string;
  nextAction?: string;
  targetDate?: string;
  progress?: number;
  linkedGoalId?: string;
  linkedProjectId?: string;
}

export interface StrategyTacticInput {
  title: string;
  description?: string;
  category?: string;
  status?: StrategyStatus;
  priority?: StrategyPriority;
  frequency?: string;
  metric?: string;
  nextAction?: string;
  linkedGoalId?: string;
  linkedPlanId?: string;
  linkedProjectId?: string;
}

export interface StrategyExperimentInput {
  title: string;
  hypothesis?: string;
  method?: string;
  metric?: string;
  result?: string;
  learning?: string;
  status?: StrategyStatus;
  priority?: StrategyPriority;
  startDate?: string;
  endDate?: string;
  linkedGoalId?: string;
  linkedPlanId?: string;
  linkedProjectId?: string;
}

export interface StrategyDecisionInput {
  title: string;
  context?: string;
  decision?: string;
  reason?: string;
  expectedResult?: string;
  reviewDate?: string;
  status?: StrategyStatus;
  priority?: StrategyPriority;
  linkedGoalId?: string;
  linkedPlanId?: string;
  linkedProjectId?: string;
}

export interface StrategyNote {
  id: string;
  section: string;
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
}

export type PlanType = 'yearly' | 'six_months' | 'quarterly' | 'monthly' | 'weekly' | 'daily';
export type PlanStatus = 'planned' | 'active' | 'completed' | 'archived';
export type PlanItemStatus = 'todo' | 'doing' | 'done' | 'blocked' | 'cancelled';
export type PlanItemCategory = 'work' | 'career' | 'freelance' | 'project' | 'money' | 'health' | 'learning' | 'family' | 'admin';

export interface Plan {
  id: string;
  title: string;
  type: PlanType;
  status: PlanStatus;
  priority: StrategyPriority;
  startDate?: string;
  endDate?: string;
  focus?: string;
  successCriteria?: string;
  reviewNotes?: string;
  linkedStrategyGoalId?: string;
  linkedStrategyGoalTitle?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanInput {
  title: string;
  type: PlanType;
  status?: PlanStatus;
  priority?: StrategyPriority;
  startDate?: string;
  endDate?: string;
  focus?: string;
  successCriteria?: string;
  reviewNotes?: string;
  linkedStrategyGoalId?: string;
  linkedProjectId?: string;
}

export interface PlanItem {
  id: string;
  planId: string;
  title: string;
  description?: string;
  category?: PlanItemCategory;
  status: PlanItemStatus;
  priority: StrategyPriority;
  dueDate?: string;
  completedAt?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  linkedStrategyGoalId?: string;
  linkedStrategyGoalTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PlanItemInput {
  planId: string;
  title: string;
  description?: string;
  category?: PlanItemCategory;
  status?: PlanItemStatus;
  priority?: StrategyPriority;
  dueDate?: string;
  completedAt?: string;
  linkedProjectId?: string;
  linkedStrategyGoalId?: string;
}

export interface FinancePeriod {
  id: string;
  title: string;
  type: string;
  startDate: string;
  endDate: string;
  status: string;
  focus?: string;
  targetIncome?: number;
  targetExpenses?: number;
  targetSavings?: number;
  targetInvestment?: number;
  reviewNotes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceIncome {
  id: string;
  title: string;
  source: string;
  amount: number;
  currency: string;
  incomeDate?: string;
  status: string;
  notes?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  incomeType?: string;
  expectedAmount?: number;
  receivedAmount?: number;
  expectedDate?: string;
  receivedDate?: string;
  isRecurring?: boolean;
  recurrence?: string;
  confidence?: string;
  financePeriodId?: string;
  financePeriodTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceExpense {
  id: string;
  title: string;
  category: string;
  amount: number;
  currency: string;
  expenseDate?: string;
  status: string;
  notes?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  financePeriodId?: string;
  financePeriodTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceAllocationRule {
  id: string;
  name: string;
  category: string;
  percentage: number;
  priority: number;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinancePurchaseGoal {
  id: string;
  title: string;
  category: string;
  targetAmount: number;
  savedAmount: number;
  currency: string;
  priority: string;
  status: string;
  decisionStatus: string;
  targetDate?: string;
  productUrl?: string;
  imageUrl?: string;
  vendor?: string;
  reason?: string;
  expectedUse?: string;
  alternatives?: string;
  allocationCategory?: string;
  monthlyContribution?: number;
  notes?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  financePeriodId?: string;
  financePeriodTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceInvestmentIdea {
  id: string;
  title: string;
  type: string;
  plannedAmount: number;
  currency: string;
  riskLevel: string;
  ethicalStatus: string;
  status: string;
  decisionStatus: string;
  expectedHorizon?: string;
  reviewDate?: string;
  maxAllocation?: number;
  expectedReason?: string;
  pros?: string;
  cons?: string;
  risks?: string;
  redFlags?: string;
  researchLinks?: string;
  lowScenario?: string;
  baseScenario?: string;
  highScenario?: string;
  allocationCategory?: string;
  recommendedMonthlyContribution?: number;
  fundingStatus?: string;
  notes?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  financePeriodId?: string;
  financePeriodTitle?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceInvestmentRule {
  id: string;
  title: string;
  category: string;
  description?: string;
  priority: number;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceInvestmentAllocation {
  id: string;
  name: string;
  category: string;
  percentage: number;
  riskLevel: string;
  ethicalStatus: string;
  priority: number;
  isActive: boolean;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface FinanceRecurringRule {
  id: string;
  title: string;
  kind: 'income' | 'expense';
  category?: string;
  amount: number;
  currency: string;
  frequency: 'monthly' | 'weekly' | 'yearly' | 'irregular';
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  confidence: 'high' | 'medium' | 'low';
  source?: string;
  notes?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export type OpportunitiesTab = 'dashboard' | 'companies' | 'people' | 'messages' | 'deals' | 'relationships' | 'projects' | 'templates' | 'strategy' | 'plans' | 'tasks' | 'finance' | 'documents' | 'queue' | 'big_companies' | 'sme_companies' | 'freelance_leads' | 'ai-control';

export type SegmentType = 'big_company' | 'sme' | 'freelance';

export type TaskStatus = 'todo' | 'doing' | 'done' | 'blocked' | 'cancelled';
export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskCategory = 'work' | 'career' | 'freelance' | 'project' | 'money' | 'health' | 'learning' | 'family' | 'admin' | 'relationship' | 'home' | 'other';

export interface Task {
  id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  category?: TaskCategory;
  taskDate?: string;
  weekStart?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  completedAt?: string;
  linkedProjectId?: string;
  linkedProjectName?: string;
  linkedPlanId?: string;
  linkedPlanTitle?: string;
  linkedStrategyGoalId?: string;
  linkedStrategyGoalTitle?: string;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  linkedPersonId?: string;
  linkedPersonName?: string;
  linkedDocumentId?: string;
  linkedDocumentTitle?: string;
  isRecurringInstance?: boolean;
  recurringRuleId?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskInput {
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  category?: TaskCategory;
  taskDate?: string;
  weekStart?: string;
  estimatedMinutes?: number;
  actualMinutes?: number;
  completedAt?: string;
  linkedProjectId?: string;
  linkedPlanId?: string;
  linkedStrategyGoalId?: string;
  linkedCompanyId?: string;
  linkedPersonId?: string;
  linkedDocumentId?: string;
  isRecurringInstance?: boolean;
  recurringRuleId?: string;
  notes?: string;
}

export type RecurringFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

export interface RecurringTask {
  id: string;
  title: string;
  description?: string;
  frequency: RecurringFrequency;
  daysOfWeek?: string;
  priority: TaskPriority;
  category?: TaskCategory;
  estimatedMinutes?: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
  linkedProjectId?: string;
  linkedProjectName?: string;
  linkedPlanId?: string;
  linkedPlanTitle?: string;
  linkedStrategyGoalId?: string;
  linkedStrategyGoalTitle?: string;
  linkedCompanyId?: string;
  linkedCompanyName?: string;
  linkedPersonId?: string;
  linkedPersonName?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface RecurringTaskLog {
  id: string;
  recurringTaskId: string;
  logDate: string;
  status: 'done' | 'skipped';
  notes?: string;
  createdAt?: string;
}

export interface RecurringTaskLogInput {
  recurringTaskId: string;
  logDate: string;
  status: 'done' | 'skipped';
  notes?: string;
}

export interface RecurringTaskInput {
  title: string;
  description?: string;
  frequency: RecurringFrequency;
  daysOfWeek?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
  estimatedMinutes?: number;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  linkedProjectId?: string;
  linkedPlanId?: string;
  linkedStrategyGoalId?: string;
  linkedCompanyId?: string;
  linkedPersonId?: string;
  notes?: string;
}

export interface TaskWorkLog {
  id: string;
  taskId: string;
  workDate: string;
  minutesSpent: number;
  summary?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskWorkLogInput {
  taskId: string;
  workDate: string;
  minutesSpent: number;
  summary?: string;
  notes?: string;
}

export interface WeeklyTaskReview {
  id: string;
  weekStart: string;
  summary?: string;
  whatWorked?: string;
  whatFailed?: string;
  blockers?: string;
  lessons?: string;
  nextWeekFocus?: string;
  score?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface WeeklyTaskReviewInput {
  weekStart: string;
  summary?: string;
  whatWorked?: string;
  whatFailed?: string;
  blockers?: string;
  lessons?: string;
  nextWeekFocus?: string;
  score?: number;
}