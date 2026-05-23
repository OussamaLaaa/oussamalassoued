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

export interface OpportunitiesData {
  companies: Company[];
  people: Person[];
  messages: OutreachMessage[];
  deals: Deal[];
  projects: Project[];
  projectTasks: ProjectTask[];
  projectTimeLogs: ProjectTimeLog[];
  projectMeetings: ProjectMeeting[];
  projectDocuments: ProjectDocument[];
  projectFinanceItems: ProjectFinanceItem[];
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

export type OpportunitiesTab = 'dashboard' | 'companies' | 'people' | 'messages' | 'deals' | 'projects' | 'templates' | 'strategy' | 'plans' | 'queue' | 'big_companies' | 'sme_companies' | 'freelance_leads';

export type SegmentType = 'big_company' | 'sme' | 'freelance';