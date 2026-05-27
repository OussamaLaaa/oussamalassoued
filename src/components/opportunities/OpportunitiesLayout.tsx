import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { MessageSquarePlus, UserPlus, Building2, Plus, Sparkles, FileText, ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';
import { normalizeDatabaseType } from '../../utils/opportunitiesMappers';
import type { OpportunitiesTab, OpportunitiesData, CompanyInput, PersonInput, MessageInput, DealInput, RelationshipInput, RelationshipInteractionInput, RelationshipOpportunityInput, RelationshipCategoryInput, RelationshipContactMethodInput, NoteCategoryInput, SmartNoteInput, NoteAttachmentInput, NoteBlockInput, Project, ProjectInput, MessageTemplateInput, Company, Person, OutreachMessage, Deal, StrategyItemInput, StrategyGoalInput, StrategyPlanInput, StrategyTacticInput, StrategyExperimentInput, StrategyDecisionInput, DocumentInput, DocumentItem, DocumentTemplateInput, DocumentTemplate, DocumentBrandSettingsInput, DocumentBrandSettings, GeneratedDocumentInput, GeneratedDocument, InvoiceInput, Invoice, InvoiceItemInput, InvoiceItem, AIProviderKeyInput, AIUseCaseSettingInput, AIProviderKey, AIUseCaseSetting, RecurringTaskLog, RecurringTaskLogInput, TaskWorkLog, TaskWorkLogInput, WeeklyTaskReview, WeeklyTaskReviewInput, SocialPlatform, ContentPillar, ContentStrategy, ContentItem, WeeklyContentPlan, SocialPlatformInput, ContentPillarInput, ContentStrategyInput, ContentItemInput, WeeklyContentPlanInput, LifeNutritionLog, LifeNutritionLogInput, LifeFitnessLog, LifeFitnessLogInput, LifeDeenLog, LifeDeenLogInput, LifeFamilyAction, LifeFamilyActionInput, LifeWeeklyReview, LifeWeeklyReviewInput, CompanyContactMethod, CompanyContactMethodInput, PersonContactMethod, PersonContactMethodInput, CompanyProblemProfile, CompanyProblemProfileInput, CompanyOutreachScript, CompanyOutreachScriptInput, DesktopShortcut, DesktopShortcutInput, DesktopGroup, DesktopGroupInput, DesktopSettings, DesktopSettingsInput } from '../../types/opportunities';
import OpportunitiesDashboard from './OpportunitiesDashboard';
import CompaniesTable, { type CompanyFilters } from './CompaniesTable';
import CompanyWorkspace from './CompanyWorkspace';
import PeopleTable, { type PersonFilters } from './PeopleTable';
import MessagesTable, { type MessageFilters } from './MessagesTable';
import DealsTable, { type DealFilters } from './DealsTable';
import ProjectsPanel from './ProjectsPanel';
import AddProjectForm from './AddProjectForm';
import StrategyPanel from './StrategyPanel';
import PlansPanel from './PlansPanel';
import FinancePanel from './FinancePanel';
import DocumentStudioPanel from './DocumentStudioPanel';
import AIControlPanel from './AIControlPanel';
import OutreachQueuePanel from './OutreachQueuePanel';
import OpportunityModal from './OpportunityModal';
import AddCompanyForm from './AddCompanyForm';
import AddPersonForm from './AddPersonForm';
import LogMessageForm from './LogMessageForm';
import AddDealForm from './AddDealForm';
import CsvImportModal from './CsvImportModal';
import ImportPeopleModal from './ImportPeopleModal';
import OutreachTemplateModal from './OutreachTemplateModal';
import TemplatesPanel from './TemplatesPanel';
import CompanySegmentView from './CompanySegmentView';
import AICompanyScoringModal from './AICompanyScoringModal';
import TasksPanel from './TasksPanel';
import RelationshipsPanel from './RelationshipsPanel';
import SmartNotesPanel from './SmartNotesPanel';
import SocialMediaPanel from './SocialMediaPanel';
import LifeManagementPanel from './LifeManagementPanel';
import DesktopLauncher from './DesktopLauncher';
import type { AppId } from './DesktopLauncher';
import FullPageAppShell from './FullPageAppShell';
import type { CompanyResearchResult } from '../../types/opportunities';

const toCompanyInput = (c: Company): CompanyInput => ({
  name: c.name,
  databaseType: c.databaseType as CompanyInput['databaseType'],
  category: c.category,
  industry: c.industry,
  country: c.country,
  city: c.city,
  website: c.website,
  linkedin: c.linkedin,
  priority: c.priority,
  fitScore: c.fitScore,
  ethicalFit: c.ethicalFit as CompanyInput['ethicalFit'],
  status: c.status as CompanyInput['status'],
  nextAction: c.nextAction,
  notes: c.notes,
});

const toPersonInput = (p: Person): PersonInput => ({
  companyId: p.companyId,
  fullName: p.fullName,
  role: p.role,
  department: p.department,
  seniority: p.seniority,
  decisionPower: p.decisionPower !== undefined ? String(p.decisionPower) as PersonInput['decisionPower'] : undefined,
  influencePower: p.influencePower !== undefined ? String(p.influencePower) as PersonInput['influencePower'] : undefined,
  relevance: p.relevance !== undefined ? String(p.relevance) as PersonInput['relevance'] : undefined,
  linkedin: p.linkedin,
  emailPublic: p.emailPublic,
  contactChannel: p.contactChannel,
  relationshipStatus: p.relationshipStatus,
  nextFollowUpDate: p.nextFollowUpDate,
  notes: p.notes,
});

const toMessageInput = (m: OutreachMessage): MessageInput => ({
  companyId: m.companyId,
  personId: m.personId,
  channel: m.channel as MessageInput['channel'],
  language: m.language as MessageInput['language'],
  messageType: m.messageType,
  messageText: m.messageText,
  sentDate: m.sentDate,
  replyStatus: m.replyStatus,
  replySummary: m.replySummary,
  nextFollowUpDate: m.nextFollowUpDate,
  status: m.status as MessageInput['status'],
});

const toDealInput = (d: Deal): DealInput => ({
  companyId: d.companyId,
  personId: d.personId,
  servicePackage: d.servicePackage,
  problem: d.problem,
  proposedSolution: d.proposedSolution,
  value: d.value,
  currency: d.currency as DealInput['currency'],
  stage: d.stage as DealInput['stage'],
  probability: d.probability !== undefined ? Math.round(d.probability * 100) : undefined,
  notes: d.notes,
});

const toProjectInput = (p: Project): ProjectInput => ({
  name: p.name,
  type: p.type as ProjectInput['type'],
  status: p.status as ProjectInput['status'],
  phase: p.phase as ProjectInput['phase'],
  priority: p.priority as ProjectInput['priority'],
  progress: p.progress,
  startDate: p.startDate,
  deadline: p.deadline,
  relatedCompanyId: p.relatedCompanyId,
  relatedPersonId: p.relatedPersonId,
  portfolioUrl: p.portfolioUrl,
  figmaUrl: p.figmaUrl,
  githubUrl: p.githubUrl,
  notes: p.notes,
  nextAction: p.nextAction,
});

const defaultCompanyFilters: CompanyFilters = {
  searchQuery: '',
  priority: '',
  status: '',
  databaseType: '',
  country: '',
};

const defaultPersonFilters: PersonFilters = {
  searchQuery: '',
  decisionPower: '',
  relevance: '',
  relationshipStatus: '',
};

const defaultMessageFilters: MessageFilters = {
  searchQuery: '',
  replyStatus: '',
  followUp: '',
  channel: '',
  messageType: '',
  dateRange: '',
};

const defaultDealFilters: DealFilters = {
  searchQuery: '',
  stage: '',
  probabilityMin: '',
  probabilityMax: '',
};

const NAV_STATE_STORAGE_KEY = 'personalOS.navigationState';

type PersistedNavState = {
  activeApp?: AppId;
  tab?: OpportunitiesTab;
  globalSearch?: string;
  companyFilters?: CompanyFilters;
  personFilters?: PersonFilters;
  messageFilters?: MessageFilters;
  dealFilters?: DealFilters;
};

const VALID_APP_IDS: AppId[] = [
  'desktop',
  'crm',
  'messages',
  'strategy',
  'plans',
  'tasks',
  'projects',
  'finance',
  'documents',
  'social',
  'relationships',
  'life',
  'notes',
  'ai_control',
];

const VALID_TABS: OpportunitiesTab[] = [
  'dashboard',
  'big_companies',
  'sme_companies',
  'freelance_leads',
  'companies',
  'people',
  'deals',
  'queue',
  'messages',
  'templates',
  'strategy',
  'plans',
  'tasks',
  'projects',
  'finance',
  'documents',
  'social',
  'relationships',
  'life',
  'notes',
  'ai-control',
];

const isObjectRecord = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readPersistedNavState = (): PersistedNavState => {
  if (typeof window === 'undefined') return {};

  try {
    const raw = window.sessionStorage.getItem(NAV_STATE_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!isObjectRecord(parsed)) return {};
    return parsed as PersistedNavState;
  } catch {
    return {};
  }
};

const resolveInitialApp = (): AppId => {
  return 'desktop';
};

const resolveInitialTab = (): OpportunitiesTab => {
  const next = readPersistedNavState().tab;
  return next && VALID_TABS.includes(next) ? next : 'dashboard';
};

const resolveInitialGlobalSearch = (): string => {
  const next = readPersistedNavState().globalSearch;
  return typeof next === 'string' ? next : '';
};

const resolveInitialCompanyFilters = (): CompanyFilters => {
  const next = readPersistedNavState().companyFilters;
  return next && isObjectRecord(next)
    ? {
        searchQuery: typeof next.searchQuery === 'string' ? next.searchQuery : '',
        priority: typeof next.priority === 'string' ? next.priority : '',
        status: typeof next.status === 'string' ? next.status : '',
        databaseType: typeof next.databaseType === 'string' ? next.databaseType : '',
        country: typeof next.country === 'string' ? next.country : '',
      }
    : defaultCompanyFilters;
};

const resolveInitialPersonFilters = (): PersonFilters => {
  const next = readPersistedNavState().personFilters;
  return next && isObjectRecord(next)
    ? {
        searchQuery: typeof next.searchQuery === 'string' ? next.searchQuery : '',
        decisionPower: typeof next.decisionPower === 'string' ? next.decisionPower : '',
        relevance: typeof next.relevance === 'string' ? next.relevance : '',
        relationshipStatus: typeof next.relationshipStatus === 'string' ? next.relationshipStatus : '',
      }
    : defaultPersonFilters;
};

const resolveInitialMessageFilters = (): MessageFilters => {
  const next = readPersistedNavState().messageFilters;
  return next && isObjectRecord(next)
    ? {
        searchQuery: typeof next.searchQuery === 'string' ? next.searchQuery : '',
        replyStatus: typeof next.replyStatus === 'string' ? next.replyStatus : '',
        followUp: typeof next.followUp === 'string' ? next.followUp : '',
        channel: typeof next.channel === 'string' ? next.channel : '',
        messageType: typeof next.messageType === 'string' ? next.messageType : '',
        dateRange: typeof next.dateRange === 'string' ? next.dateRange : '',
      }
    : defaultMessageFilters;
};

const resolveInitialDealFilters = (): DealFilters => {
  const next = readPersistedNavState().dealFilters;
  return next && isObjectRecord(next)
    ? {
        searchQuery: typeof next.searchQuery === 'string' ? next.searchQuery : '',
        stage: typeof next.stage === 'string' ? next.stage : '',
        probabilityMin: typeof next.probabilityMin === 'string' ? next.probabilityMin : '',
        probabilityMax: typeof next.probabilityMax === 'string' ? next.probabilityMax : '',
      }
    : defaultDealFilters;
};

type LifeQuickTab = 'dashboard' | 'nutrition' | 'fitness' | 'deen' | 'family' | 'weekly-review';
type AIControlQuickAction = 'add-provider-key' | 'test-provider' | 'save-routing';

const toDayKey = (value?: string) => {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const isNoContact = (value?: string) => !value || value.trim() === '' || value.trim().toLowerCase() === 'no contact';

const isHighPriorityPerson = (person: Person) => [person.relevance, person.decisionPower, person.influencePower].some((value) => typeof value === 'number' && value >= 8);

const getQueueTabCount = (people: Person[], messages: OutreachMessage[]) => {
  const today = toDayKey(new Date().toISOString()) || '';
  const highPriority = people.filter((person) => isHighPriorityPerson(person) && isNoContact(person.relationshipStatus)).length;
  const dueToday = people.filter((person) => toDayKey(person.nextFollowUpDate) === today).length + messages.filter((message) => toDayKey(message.nextFollowUpDate) === today).length;
  const overdue = people.filter((person) => {
    const next = toDayKey(person.nextFollowUpDate);
    return Boolean(next && next < today);
  }).length + messages.filter((message) => {
    const next = toDayKey(message.nextFollowUpDate);
    return Boolean(next && next < today);
  }).length;
  const newContacts = people.filter((person) => isNoContact(person.relationshipStatus)).length;

  return highPriority + dueToday + overdue + newContacts;
};

const OpportunitiesLayout: React.FC<{
  theme?: 'light' | 'dark';
  setTheme?: (t: 'light' | 'dark') => void;
  data: OpportunitiesData & {
    addCompany: (input: any) => void;
    addPerson: (input: any) => void;
    addMessage: (input: any) => void;
    addDeal: (input: any) => void;
    addRelationship: (input: RelationshipInput) => Promise<any>;
    updateRelationship: (id: string, input: Partial<RelationshipInput>) => Promise<any>;
    deleteRelationship: (id: string) => Promise<any>;
    addRelationshipInteraction: (input: RelationshipInteractionInput) => Promise<any>;
    updateRelationshipInteraction: (id: string, input: Partial<RelationshipInteractionInput>) => Promise<any>;
    deleteRelationshipInteraction: (id: string) => Promise<any>;
    addRelationshipOpportunity: (input: RelationshipOpportunityInput) => Promise<any>;
    updateRelationshipOpportunity: (id: string, input: Partial<RelationshipOpportunityInput>) => Promise<any>;
    deleteRelationshipOpportunity: (id: string) => Promise<any>;
    addRelationshipCategory: (input: RelationshipCategoryInput) => Promise<any>;
    updateRelationshipCategory: (id: string, input: Partial<RelationshipCategoryInput>) => Promise<any>;
    deleteRelationshipCategory: (id: string) => Promise<any>;
    addRelationshipContactMethod: (input: RelationshipContactMethodInput) => Promise<any>;
    updateRelationshipContactMethod: (id: string, input: Partial<RelationshipContactMethodInput>) => Promise<any>;
    deleteRelationshipContactMethod: (id: string) => Promise<any>;
    addNoteCategory: (input: NoteCategoryInput) => Promise<any>;
    updateNoteCategory: (id: string, input: Partial<NoteCategoryInput>) => Promise<any>;
    deleteNoteCategory: (id: string) => Promise<any>;
    addSmartNote: (input: SmartNoteInput) => Promise<any>;
    updateSmartNote: (id: string, input: Partial<SmartNoteInput>) => Promise<any>;
    deleteSmartNote: (id: string) => Promise<any>;
    addNoteAttachment: (input: NoteAttachmentInput) => Promise<any>;
    updateNoteAttachment: (id: string, input: Partial<NoteAttachmentInput>) => Promise<any>;
    deleteNoteAttachment: (id: string) => Promise<any>;
    addNoteBlock: (input: NoteBlockInput) => Promise<any>;
    updateNoteBlock: (id: string, input: Partial<NoteBlockInput>) => Promise<any>;
    deleteNoteBlock: (id: string) => Promise<any>;
    addProject: (input: ProjectInput) => Promise<any>;
    addStrategyItem: (input: StrategyItemInput) => Promise<any>;
    addStrategyGoal: (input: StrategyGoalInput) => Promise<any>;
    addStrategyPlan: (input: StrategyPlanInput) => Promise<any>;
    addStrategyTactic: (input: StrategyTacticInput) => Promise<any>;
    addStrategyExperiment: (input: StrategyExperimentInput) => Promise<any>;
    addStrategyDecision: (input: StrategyDecisionInput) => Promise<any>;
    addDocument: (input: DocumentInput) => Promise<DocumentItem>;
    addDocumentTemplate: (input: DocumentTemplateInput) => Promise<DocumentTemplate>;
    addDocumentBrandSettings: (input: DocumentBrandSettingsInput) => Promise<DocumentBrandSettings>;
    addGeneratedDocument: (input: GeneratedDocumentInput) => Promise<GeneratedDocument>;
    addAIProviderKey: (input: AIProviderKeyInput) => Promise<AIProviderKey>;
    updateAIProviderKey: (id: string, input: Partial<AIProviderKeyInput>) => Promise<AIProviderKey>;
    deleteAIProviderKey: (id: string) => Promise<void>;
    testAIProviderKey: (input: { id?: string; provider: string; apiKey?: string; model?: string; baseUrl?: string; endpoint?: string; deploymentName?: string; apiVersion?: string }) => Promise<string>;
    addAIUseCaseSetting: (input: AIUseCaseSettingInput) => Promise<AIUseCaseSetting>;
    updateAIUseCaseSetting: (id: string, input: Partial<AIUseCaseSettingInput>) => Promise<AIUseCaseSetting>;
    deleteAIUseCaseSetting: (id: string) => Promise<void>;
    addInvoice: (input: InvoiceInput) => Promise<Invoice>;
    addInvoiceItem: (input: InvoiceItemInput) => Promise<InvoiceItem>;
    addTemplate: (input: MessageTemplateInput) => Promise<any>;
    updateCompany: (id: string, input: CompanyInput) => void;
    deleteCompany: (id: string) => void;
    updatePerson: (id: string, input: PersonInput) => void;
    deletePerson: (id: string) => void;
    updateMessage: (id: string, input: MessageInput) => void;
    deleteMessage: (id: string) => void;
    updateDeal: (id: string, input: DealInput) => void;
    deleteDeal: (id: string) => void;
    updateProject: (id: string, input: Partial<ProjectInput>) => Promise<any>;
    deleteProject: (id: string) => Promise<any>;
    updateStrategyItem: (id: string, input: Partial<StrategyItemInput>) => Promise<any>;
    deleteStrategyItem: (id: string) => Promise<any>;
    updateStrategyGoal: (id: string, input: Partial<StrategyGoalInput>) => Promise<any>;
    deleteStrategyGoal: (id: string) => Promise<any>;
    updateStrategyPlan: (id: string, input: Partial<StrategyPlanInput>) => Promise<any>;
    deleteStrategyPlan: (id: string) => Promise<any>;
    updateStrategyTactic: (id: string, input: Partial<StrategyTacticInput>) => Promise<any>;
    deleteStrategyTactic: (id: string) => Promise<any>;
    updateStrategyExperiment: (id: string, input: Partial<StrategyExperimentInput>) => Promise<any>;
    deleteStrategyExperiment: (id: string) => Promise<any>;
    updateStrategyDecision: (id: string, input: Partial<StrategyDecisionInput>) => Promise<any>;
    deleteStrategyDecision: (id: string) => Promise<any>;
    updateDocument: (id: string, input: Partial<DocumentInput>) => Promise<DocumentItem>;
    deleteDocument: (id: string) => Promise<any>;
    updateDocumentTemplate: (id: string, input: Partial<DocumentTemplateInput>) => Promise<DocumentTemplate>;
    deleteDocumentTemplate: (id: string) => Promise<any>;
    updateDocumentBrandSettings: (id: string, input: Partial<DocumentBrandSettingsInput>) => Promise<DocumentBrandSettings>;
    deleteDocumentBrandSettings: (id: string) => Promise<any>;
    updateGeneratedDocument: (id: string, input: Partial<GeneratedDocumentInput>) => Promise<GeneratedDocument>;
      updateInvoice: (id: string, input: Partial<InvoiceInput>) => Promise<Invoice>;
      deleteInvoice: (id: string) => Promise<void>;
      updateInvoiceItem: (id: string, input: Partial<InvoiceItemInput>) => Promise<InvoiceItem>;
      deleteInvoiceItem: (id: string) => Promise<void>;
    deleteGeneratedDocument: (id: string) => Promise<any>;
    updateTemplate: (id: string, input: MessageTemplateInput) => Promise<any>;
    deleteTemplate: (id: string) => Promise<any>;
    seedDefaultTemplates?: () => Promise<any>;
    resetToSeedData: () => void;
    importCompaniesBatch?: (rows: Array<{ name: string; country?: string; industry?: string; website?: string }>) => Promise<any>;
    importPeople?: (rows: PersonInput[]) => Promise<any>;
    socialPlatforms: SocialPlatform[];
    contentPillars: ContentPillar[];
    contentStrategies: ContentStrategy[];
    contentItems: ContentItem[];
    weeklyContentPlans: WeeklyContentPlan[];
    addSocialPlatform: (input: SocialPlatformInput) => Promise<SocialPlatform>;
    updateSocialPlatform: (id: string, input: Partial<SocialPlatformInput>) => Promise<SocialPlatform>;
    deleteSocialPlatform: (id: string) => Promise<void>;
    addContentPillar: (input: ContentPillarInput) => Promise<ContentPillar>;
    updateContentPillar: (id: string, input: Partial<ContentPillarInput>) => Promise<ContentPillar>;
    deleteContentPillar: (id: string) => Promise<void>;
    addContentStrategy: (input: ContentStrategyInput) => Promise<ContentStrategy>;
    updateContentStrategy: (id: string, input: Partial<ContentStrategyInput>) => Promise<ContentStrategy>;
    deleteContentStrategy: (id: string) => Promise<void>;
    addContentItem: (input: ContentItemInput) => Promise<ContentItem>;
    updateContentItem: (id: string, input: Partial<ContentItemInput>) => Promise<ContentItem>;
    deleteContentItem: (id: string) => Promise<void>;
    addWeeklyContentPlan: (input: WeeklyContentPlanInput) => Promise<WeeklyContentPlan>;
    updateWeeklyContentPlan: (id: string, input: Partial<WeeklyContentPlanInput>) => Promise<WeeklyContentPlan>;
    deleteWeeklyContentPlan: (id: string) => Promise<void>;
    lifeNutritionLogs: LifeNutritionLog[];
    lifeFitnessLogs: LifeFitnessLog[];
    lifeDeenLogs: LifeDeenLog[];
    lifeFamilyActions: LifeFamilyAction[];
    lifeWeeklyReviews: LifeWeeklyReview[];
    addLifeNutritionLog: (input: LifeNutritionLogInput) => Promise<LifeNutritionLog>;
    updateLifeNutritionLog: (id: string, input: Partial<LifeNutritionLogInput>) => Promise<LifeNutritionLog>;
    deleteLifeNutritionLog: (id: string) => Promise<void>;
    addLifeFitnessLog: (input: LifeFitnessLogInput) => Promise<LifeFitnessLog>;
    updateLifeFitnessLog: (id: string, input: Partial<LifeFitnessLogInput>) => Promise<LifeFitnessLog>;
    deleteLifeFitnessLog: (id: string) => Promise<void>;
    addLifeDeenLog: (input: LifeDeenLogInput) => Promise<LifeDeenLog>;
    updateLifeDeenLog: (id: string, input: Partial<LifeDeenLogInput>) => Promise<LifeDeenLog>;
    deleteLifeDeenLog: (id: string) => Promise<void>;
    addLifeFamilyAction: (input: LifeFamilyActionInput) => Promise<LifeFamilyAction>;
    updateLifeFamilyAction: (id: string, input: Partial<LifeFamilyActionInput>) => Promise<LifeFamilyAction>;
    deleteLifeFamilyAction: (id: string) => Promise<void>;
    addLifeWeeklyReview: (input: LifeWeeklyReviewInput) => Promise<LifeWeeklyReview>;
    updateLifeWeeklyReview: (id: string, input: Partial<LifeWeeklyReviewInput>) => Promise<LifeWeeklyReview>;
    deleteLifeWeeklyReview: (id: string) => Promise<void>;
    companyContactMethods: CompanyContactMethod[];
    companyProblemProfiles: CompanyProblemProfile[];
    companyOutreachScripts: CompanyOutreachScript[];
    addCompanyContactMethod: (input: CompanyContactMethodInput) => Promise<CompanyContactMethod>;
    updateCompanyContactMethod: (id: string, input: Partial<CompanyContactMethodInput>) => Promise<CompanyContactMethod>;
    deleteCompanyContactMethod: (id: string) => Promise<void>;
    addCompanyProblemProfile: (input: CompanyProblemProfileInput) => Promise<CompanyProblemProfile>;
    updateCompanyProblemProfile: (id: string, input: Partial<CompanyProblemProfileInput>) => Promise<CompanyProblemProfile>;
    deleteCompanyProblemProfile: (id: string) => Promise<void>;
    addCompanyOutreachScript: (input: CompanyOutreachScriptInput) => Promise<CompanyOutreachScript>;
    updateCompanyOutreachScript: (id: string, input: Partial<CompanyOutreachScriptInput>) => Promise<CompanyOutreachScript>;
    deleteCompanyOutreachScript: (id: string) => Promise<void>;
    desktopShortcuts: DesktopShortcut[];
    desktopSettings: DesktopSettings | null;
    desktopGroups: DesktopGroup[];
    addDesktopShortcut: (input: DesktopShortcutInput) => Promise<any>;
    updateDesktopShortcut: (id: string, input: Partial<DesktopShortcutInput>) => Promise<any>;
    deleteDesktopShortcut: (id: string) => Promise<void>;
    updateDesktopSettings: (input: DesktopSettingsInput) => Promise<any>;
    addDesktopGroup: (input: DesktopGroupInput) => Promise<any>;
    updateDesktopGroup: (id: string, input: Partial<DesktopGroupInput>) => Promise<any>;
    deleteDesktopGroup: (id: string) => Promise<void>;
  };
}> = ({ theme = 'light', setTheme, data }) => {
  const [tab, setTab] = useState<OpportunitiesTab>(resolveInitialTab);
  const [activeModal, setActiveModal] = useState<'company' | 'person' | 'message' | 'deal' | 'project' | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editingMessage, setEditingMessage] = useState<OutreachMessage | null>(null);
  const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showPeopleImport, setShowPeopleImport] = useState(false);
  const [templatePerson, setTemplatePerson] = useState<Person | null>(null);
  const [messageDraft, setMessageDraft] = useState<MessageInput | null>(null);

  // Global search state
  const [globalSearch, setGlobalSearch] = useState(resolveInitialGlobalSearch);

  // Per-table filter states
  const [companyFilters, setCompanyFilters] = useState<CompanyFilters>(resolveInitialCompanyFilters);
  const [personFilters, setPersonFilters] = useState<PersonFilters>(resolveInitialPersonFilters);
  const [messageFilters, setMessageFilters] = useState<MessageFilters>(resolveInitialMessageFilters);
  const [dealFilters, setDealFilters] = useState<DealFilters>(resolveInitialDealFilters);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [aiScoringCompany, setAiScoringCompany] = useState<Company | null>(null);
  const [companyResearchDraft, setCompanyResearchDraft] = useState<CompanyResearchResult | null>(null);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [confirmDeleteCompanyId, setConfirmDeleteCompanyId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [lifeQuickTab, setLifeQuickTab] = useState<LifeQuickTab | null>(null);
  const [aiControlQuickAction, setAiControlQuickAction] = useState<AIControlQuickAction | null>(null);

  const [activeApp, setActiveApp] = useState<AppId>(resolveInitialApp);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const nextState: PersistedNavState = {
      activeApp,
      tab,
      globalSearch,
      companyFilters,
      personFilters,
      messageFilters,
      dealFilters,
    };

    try {
      window.sessionStorage.setItem(NAV_STATE_STORAGE_KEY, JSON.stringify(nextState));
    } catch {
      // Ignore storage write failures.
    }
  }, [activeApp, tab, globalSearch, companyFilters, personFilters, messageFilters, dealFilters]);

  const handleLaunchApp = (appId: AppId) => {
    setActiveApp(appId);
    if (appId === 'crm') setTab('dashboard');
    else if (appId === 'messages') setTab('messages');
    else if (appId === 'strategy') setTab('strategy');
    else if (appId === 'plans') setTab('plans');
    else if (appId === 'tasks') setTab('tasks');
    else if (appId === 'projects') setTab('projects');
    else if (appId === 'finance') setTab('finance');
    else if (appId === 'documents') setTab('documents');
    else if (appId === 'social') setTab('social');
    else if (appId === 'relationships') setTab('relationships');
    else if (appId === 'life') setTab('life');
    else if (appId === 'notes') setTab('notes');
    else if (appId === 'ai_control') setTab('ai-control');
    setGlobalSearch('');
  };

  const handleBackToDesktop = () => {
    setActiveApp('desktop');
    setTab('dashboard');
    setGlobalSearch('');
  };

  const CRM_TABS = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'big_companies', label: 'Big Companies' },
    { id: 'sme_companies', label: 'SME Companies' },
    { id: 'freelance_leads', label: 'Freelance Leads' },
    { id: 'companies', label: 'All Companies' },
    { id: 'people', label: 'People' },
    { id: 'deals', label: 'Deals' },
    { id: 'queue', label: 'Outreach Queue' },
  ];

  const MESSAGES_TABS = [
    { id: 'messages', label: 'Messages' },
    { id: 'templates', label: 'Templates' },
  ];

  const getShellTitle = () => {
    switch (activeApp) {
      case 'crm': return 'CRM';
      case 'messages': return 'Messages';
      case 'strategy': return 'Strategy';
      case 'plans': return 'Plans';
      case 'tasks': return 'Tasks';
      case 'projects': return 'Projects';
      case 'finance': return 'Finance';
      case 'documents': return 'Documents';
      case 'social': return 'Social Media';
      case 'relationships': return 'Relationships';
      case 'life': return 'Life';
      case 'notes': return 'Notes';
      case 'ai_control': return 'AI Control';
      default: return '';
    }
  };

  const getShellSubtitle = () => {
    switch (activeApp) {
      case 'crm': return 'Companies, people, deals, and outreach pipeline.';
      case 'messages': return 'Messages, templates, and outreach communication.';
      case 'strategy': return 'Goals, tactics, experiments, and strategic decisions.';
      case 'plans': return 'Yearly, monthly, weekly planning and execution structure.';
      case 'tasks': return 'Weekly tasks, daily recurring routines, and work logs.';
      case 'projects': return 'Projects, workspaces, meetings, documents, and time logs.';
      case 'finance': return 'Income, expenses, allocation, investments, and financial review.';
      case 'documents': return 'Invoices, contracts, cahier de charges, PDFs, and archive.';
      case 'social': return 'Content strategy, ideas, weekly plan, calendar, and performance.';
      case 'relationships': return 'Relationship categories, people dashboards, contact methods, and follow-ups.';
      case 'life': return 'Nutrition, fitness, deen, family, and life review.';
      case 'notes': return 'Smart notes, categories, blocks, attachments, and linked memory.';
      case 'ai_control': return 'Providers, encrypted keys, use-case routing, and AI tests.';
      default: return '';
    }
  };

  const getShellTabs = () => {
    if (activeApp === 'crm') return CRM_TABS;
    if (activeApp === 'messages') return MESSAGES_TABS;
    return undefined;
  };

  // Sync global search to all table filters
  const handleGlobalSearchChange = (value: string) => {
    setGlobalSearch(value);
    setCompanyFilters((prev) => ({ ...prev, searchQuery: value }));
    setPersonFilters((prev) => ({ ...prev, searchQuery: value }));
    setMessageFilters((prev) => ({ ...prev, searchQuery: value }));
    setDealFilters((prev) => ({ ...prev, searchQuery: value }));
  };

  const {
    companies, people, messages, deals, projects, templates, strategyItems,
    relationships, relationshipInteractions, relationshipOpportunities,
    noteCategories, smartNotes, noteAttachments, noteBlocks,
    strategyGoals, strategyPlans, strategyTactics, strategyExperiments, strategyDecisions,
    documents,
    documentTemplates,
    documentBrandSettings,
    aiProviderKeys,
    aiUseCaseSettings,
    generatedDocuments,
    invoices,
    invoiceItems,
    projectTasks, projectTimeLogs, projectMeetings, projectDocuments, projectFinanceItems,
    addCompany, addPerson, addMessage, addDeal, addProject, addStrategyItem,
    addRelationship, updateRelationship, deleteRelationship,
    addRelationshipInteraction, updateRelationshipInteraction, deleteRelationshipInteraction,
    addRelationshipOpportunity, updateRelationshipOpportunity, deleteRelationshipOpportunity,
    addRelationshipCategory, updateRelationshipCategory, deleteRelationshipCategory,
    addRelationshipContactMethod, updateRelationshipContactMethod, deleteRelationshipContactMethod,
    addNoteCategory, updateNoteCategory, deleteNoteCategory,
    addSmartNote, updateSmartNote, deleteSmartNote,
    addNoteAttachment, updateNoteAttachment, deleteNoteAttachment,
    addNoteBlock, updateNoteBlock, deleteNoteBlock,
    addStrategyGoal, addStrategyPlan, addStrategyTactic, addStrategyExperiment, addStrategyDecision,
    addDocument,
    addDocumentTemplate,
    addDocumentBrandSettings,
    addGeneratedDocument,
    addAIProviderKey,
    updateAIProviderKey,
    deleteAIProviderKey,
    testAIProviderKey,
    addAIUseCaseSetting,
    updateAIUseCaseSetting,
    deleteAIUseCaseSetting,
    addInvoice,
    addInvoiceItem,
    addTemplate,
    updateCompany, deleteCompany,
    updatePerson, deletePerson,
    updateMessage, deleteMessage,
    updateDeal, deleteDeal, updateProject, deleteProject,
    updateStrategyItem, deleteStrategyItem,
    updateStrategyGoal, deleteStrategyGoal,
    updateStrategyPlan, deleteStrategyPlan,
    updateStrategyTactic, deleteStrategyTactic,
    updateStrategyExperiment, deleteStrategyExperiment,
    updateStrategyDecision, deleteStrategyDecision,
    updateDocument, deleteDocument,
    updateDocumentTemplate, deleteDocumentTemplate,
    updateDocumentBrandSettings, deleteDocumentBrandSettings,
    updateGeneratedDocument, deleteGeneratedDocument,
    updateInvoice, deleteInvoice,
    updateInvoiceItem, deleteInvoiceItem,
    updateTemplate, deleteTemplate, seedDefaultTemplates,
    resetToSeedData,
    importCompaniesBatch,
    importPeople,
    addProjectTask, updateProjectTask, deleteProjectTask,
    addProjectTimeLog, deleteProjectTimeLog,
    addProjectMeeting, deleteProjectMeeting,
    addProjectDocument, deleteProjectDocument,
    addProjectFinanceItem, deleteProjectFinanceItem,
    plans, planItems, addPlan, updatePlan, deletePlan, addPlanItem, updatePlanItem, deletePlanItem,
    financeIncome, financeExpenses, financeAllocationRules, financePurchaseGoals, financeInvestmentIdeas,
    addFinanceIncome, updateFinanceIncome, deleteFinanceIncome,
    addFinanceExpense, updateFinanceExpense, deleteFinanceExpense,
    addFinanceAllocationRule, updateFinanceAllocationRule, deleteFinanceAllocationRule,
    addFinancePurchaseGoal, updateFinancePurchaseGoal, deleteFinancePurchaseGoal,
    addFinanceInvestmentIdea, updateFinanceInvestmentIdea, deleteFinanceInvestmentIdea,
    financeInvestmentRules, financeInvestmentAllocations,
    addFinanceInvestmentRule, updateFinanceInvestmentRule, deleteFinanceInvestmentRule,
    addFinanceInvestmentAllocation, updateFinanceInvestmentAllocation, deleteFinanceInvestmentAllocation,
    financePeriods,
    addFinancePeriod, updateFinancePeriod, deleteFinancePeriod,
    financeRecurringRules,
    addFinanceRecurringRule, updateFinanceRecurringRule, deleteFinanceRecurringRule,
    tasks, recurringTasks,
    addTask, updateTask, deleteTask,
    addRecurringTask, updateRecurringTask, deleteRecurringTask,
    recurringTaskLogs,
    addRecurringTaskLog, updateRecurringTaskLog, deleteRecurringTaskLog,
    taskWorkLogs, weeklyTaskReviews,
    addTaskWorkLog, updateTaskWorkLog, deleteTaskWorkLog,
    addWeeklyTaskReview, updateWeeklyTaskReview, deleteWeeklyTaskReview,
    socialPlatforms, contentPillars, contentStrategies, contentItems, weeklyContentPlans,
    addSocialPlatform, updateSocialPlatform, deleteSocialPlatform,
    addContentPillar, updateContentPillar, deleteContentPillar,
    addContentStrategy, updateContentStrategy, deleteContentStrategy,
    addContentItem, updateContentItem, deleteContentItem,
    addWeeklyContentPlan, updateWeeklyContentPlan, deleteWeeklyContentPlan,
    lifeNutritionLogs, lifeFitnessLogs, lifeDeenLogs, lifeFamilyActions, lifeWeeklyReviews,
    addLifeNutritionLog, updateLifeNutritionLog, deleteLifeNutritionLog,
    addLifeFitnessLog, updateLifeFitnessLog, deleteLifeFitnessLog,
    addLifeDeenLog, updateLifeDeenLog, deleteLifeDeenLog,
    addLifeFamilyAction, updateLifeFamilyAction, deleteLifeFamilyAction,
    addLifeWeeklyReview, updateLifeWeeklyReview, deleteLifeWeeklyReview,
    companyContactMethods, personContactMethods, companyProblemProfiles, companyOutreachScripts,
    addCompanyContactMethod, updateCompanyContactMethod, deleteCompanyContactMethod,
    addPersonContactMethod, updatePersonContactMethod, deletePersonContactMethod,
    addCompanyProblemProfile, updateCompanyProblemProfile, deleteCompanyProblemProfile,
    addCompanyOutreachScript, updateCompanyOutreachScript, deleteCompanyOutreachScript,
    desktopShortcuts, desktopSettings, desktopGroups,
    addDesktopShortcut, updateDesktopShortcut, deleteDesktopShortcut, updateDesktopSettings,
    addDesktopGroup, updateDesktopGroup, deleteDesktopGroup,
    loading, loadedScopes,
  } = data;

  const bigCompaniesCount = useMemo(
    () => companies.filter((c) => normalizeDatabaseType(c.databaseType) === 'big_company').length,
    [companies],
  );
  const smeCompaniesCount = useMemo(
    () => companies.filter((c) => normalizeDatabaseType(c.databaseType) === 'sme').length,
    [companies],
  );
  const freelanceLeadsCount = useMemo(
    () => companies.filter((c) => normalizeDatabaseType(c.databaseType) === 'freelance').length,
    [companies],
  );

  const handleResetDemoData = () => {
    const confirmed = window.confirm('Reset Opportunities OS demo data to the original seed data?');
    if (!confirmed) return;
    resetToSeedData();
  };

  const handleEditCompany = (company: Company) => {
    setEditingCompany(company);
  };

  const handleDeleteCompany = async (id: string) => {
    if (import.meta.env.DEV) {
      console.log('[CRM] deleting company', id);
    }
    await deleteCompany(id);
    if (import.meta.env.DEV) {
      console.log('[CRM] delete company success', id);
    }
  };

  const handleRequestDelete = (id: string) => {
    setConfirmDeleteCompanyId(id);
  };

  const handleConfirmDelete = async () => {
    const id = confirmDeleteCompanyId;
    setConfirmDeleteCompanyId(null);
    if (!id) return;
    try {
      await handleDeleteCompany(id);
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('[CRM] delete company failed', error);
      }
      const message = error instanceof Error && error.message ? error.message : 'Unable to delete company.';
      setDeleteError(message);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDeleteCompanyId(null);
  };

  const handleEditPerson = (person: Person) => {
    setEditingPerson(person);
  };

  const handleDeletePerson = (id: string) => {
    deletePerson(id);
  };

  const handleEditMessage = (message: OutreachMessage) => {
    setEditingMessage(message);
  };

  const handleDeleteMessage = (id: string) => {
    deleteMessage(id);
  };

  const handleEditDeal = (deal: Deal) => {
    setEditingDeal(deal);
  };

  const handleDeleteDeal = (id: string) => {
    deleteDeal(id);
  };

  const handleAIScore = (company: Company) => {
    setAiScoringCompany(company);
  };

  const createResearchFollowUpRecords = async (company: Company, research: CompanyResearchResult | null) => {
    if (!research) return;

    if (research.contactMethods?.length > 0) {
      const shouldCreateContactMethods = window.confirm(`Create ${research.contactMethods.length} suggested contact method(s) for ${company.name}?`);
      if (shouldCreateContactMethods) {
        for (const method of research.contactMethods) {
          if (!method.value) continue;
          await addCompanyContactMethod({
            companyId: company.id,
            type: method.type || 'other',
            label: method.label || undefined,
            value: method.value,
            isPrimary: Boolean(method.isPrimary),
            notes: method.notes || undefined,
          });
        }
      }
    }

    if (research.problemProfile) {
      const shouldCreateProblemProfile = window.confirm(`Create the suggested problem profile for ${company.name}?`);
      if (shouldCreateProblemProfile) {
        await addCompanyProblemProfile({
          companyId: company.id,
          problemTitle: research.problemProfile.problemTitle || undefined,
          problemDescription: research.problemProfile.problemDescription || undefined,
          currentSituation: research.problemProfile.currentSituation || undefined,
          businessImpact: research.problemProfile.businessImpact || undefined,
          proposedSolution: research.problemProfile.proposedSolution || undefined,
          serviceAngle: research.problemProfile.serviceAngle || undefined,
          valueProposition: research.problemProfile.valueProposition || undefined,
          urgency: research.problemProfile.urgency || undefined,
          confidence: research.problemProfile.confidence || undefined,
          status: research.problemProfile.status || undefined,
          notes: research.problemProfile.notes || undefined,
        });
      }
    }

    if (research.outreachScript) {
      const shouldCreateOutreachScript = window.confirm(`Create the suggested outreach script for ${company.name}?`);
      if (shouldCreateOutreachScript) {
        await addCompanyOutreachScript({
          companyId: company.id,
          name: research.outreachScript.name || `${company.name} AI Research Script`,
          channel: research.outreachScript.channel || undefined,
          language: research.outreachScript.language || undefined,
          audience: research.outreachScript.audience || undefined,
          goal: research.outreachScript.goal || undefined,
          hook: research.outreachScript.hook || undefined,
          messageBody: research.outreachScript.messageBody || undefined,
          callScript: research.outreachScript.callScript || undefined,
          objectionHandling: research.outreachScript.objectionHandling || undefined,
          followUpMessage: research.outreachScript.followUpMessage || undefined,
          status: research.outreachScript.status || undefined,
          isActive: research.outreachScript.isActive ?? undefined,
          notes: research.outreachScript.notes || undefined,
        });
      }
    }
  };

  const handleApplyAIScore = async (result: any) => {
    if (!aiScoringCompany) return;

    const today = new Date().toISOString().slice(0, 10);
    const aiNotes = [
      '',
      `AI Lead Scoring Analysis — ${today}:`,
      `UX Problem: ${result.uxProblem || 'N/A'}`,
      `Service To Offer: ${result.serviceToOffer || 'N/A'}`,
      `Reasoning: ${result.reasoningSummary || 'N/A'}`,
      'Risks:',
      ...(Array.isArray(result.risks) ? result.risks.map((r: string) => `- ${r}`) : ['- N/A']),
      'Questions To Review:',
      ...(Array.isArray(result.questionsToReview) ? result.questionsToReview.map((q: string) => `- ${q}`) : ['- N/A']),
    ].join('\n');

    const payload: any = {
      name: aiScoringCompany.name,
      databaseType: result.databaseType || aiScoringCompany.databaseType,
      category: aiScoringCompany.category,
      industry: result.industry || aiScoringCompany.industry,
      country: aiScoringCompany.country,
      city: aiScoringCompany.city,
      website: aiScoringCompany.website,
      linkedin: aiScoringCompany.linkedin,
      priority: result.priority || aiScoringCompany.priority,
      fitScore: typeof result.fitScore === 'number' ? result.fitScore : aiScoringCompany.fitScore,
      ethicalFit: result.ethicalFit || aiScoringCompany.ethicalFit,
      status: aiScoringCompany.status,
      nextAction: result.nextAction || aiScoringCompany.nextAction,
      notes: (aiScoringCompany.notes || '') + aiNotes,
    };

    try {
      await updateCompany(aiScoringCompany.id, payload as any);
      setAiScoringCompany(null);
    } catch (error) {
      console.error('[Opportunities] Failed to apply AI scoring.', error);
    }
  };

  const handleEditProject = (project: Project) => {
    setEditingProject(project);
  };

  const handleDeleteProject = async (id: string) => {
    await deleteProject(id);
  };

  const handleCompanyClick = useCallback((companyId: string) => {
    setSelectedCompanyId(companyId);
  }, []);

  if (activeApp === 'desktop') {
    return (
      <DesktopLauncher
        onLaunchApp={handleLaunchApp}
        desktopShortcuts={desktopShortcuts}
        desktopSettings={desktopSettings}
        desktopGroups={desktopGroups}
        addDesktopShortcut={addDesktopShortcut}
        updateDesktopShortcut={updateDesktopShortcut}
        deleteDesktopShortcut={deleteDesktopShortcut}
        updateDesktopSettings={updateDesktopSettings}
        addDesktopGroup={addDesktopGroup}
        updateDesktopGroup={updateDesktopGroup}
        deleteDesktopGroup={deleteDesktopGroup}
        isDesktopLoading={!loadedScopes?.desktop && (loading ?? true)}
        desktopLoadError={!loadedScopes?.desktop && !loading}
      />
    );
  }

  const handleShellTabChange = (tabId: string) => {
    setTab(tabId as OpportunitiesTab);
    setSelectedCompanyId(null);
    setGlobalSearch('');
  };

  return (
    <FullPageAppShell
      title={getShellTitle()}
      subtitle={getShellSubtitle()}
      onBackToDesktop={handleBackToDesktop}
      tabs={getShellTabs()}
      activeTab={tab}
      onTabChange={handleShellTabChange}
      rightActions={activeApp === 'crm' ? (
        <>
          <Button variant="secondary" size="md" onClick={() => setActiveModal('message')}><MessageSquarePlus className="h-4 w-4" />Log Message</Button>
          <Button variant="secondary" size="md" onClick={() => setActiveModal('person')}><UserPlus className="h-4 w-4" />Add Person</Button>
          <Button variant="secondary" size="md" onClick={() => setActiveModal('company')}><Building2 className="h-4 w-4" />Add Company</Button>
          <Button variant="primary" size="md" onClick={() => setActiveModal('deal')}><Plus className="h-4 w-4" />Add Deal</Button>
        </>
      ) : activeApp === 'life' ? (
        <>
          <Button variant="secondary" size="md" onClick={() => setLifeQuickTab('nutrition')}>Add Meal</Button>
          <Button variant="secondary" size="md" onClick={() => setLifeQuickTab('fitness')}>Add Workout</Button>
          <Button variant="secondary" size="md" onClick={() => setLifeQuickTab('family')}>Add Family Action</Button>
          <Button variant="primary" size="md" onClick={() => setLifeQuickTab('weekly-review')}>Create Review</Button>
        </>
      ) : activeApp === 'messages' ? (
        <>
          <Button variant="secondary" size="md" onClick={() => {
            const firstPerson = people[0];
            if (firstPerson) {
              setTemplatePerson(firstPerson);
            }
          }}><Sparkles className="h-4 w-4" />AI Personalize</Button>
          <Button variant="secondary" size="md" onClick={() => setTab('templates')}><FileText className="h-4 w-4" />New Template</Button>
          <Button variant="primary" size="md" onClick={() => setActiveModal('message')}><MessageSquarePlus className="h-4 w-4" />Log Message</Button>
        </>
      ) : activeApp === 'ai_control' ? (
        <>
          <Button variant="primary" size="md" onClick={() => setAiControlQuickAction('add-provider-key')}>Add Provider Key</Button>
          <Button variant="secondary" size="md" onClick={() => setAiControlQuickAction('test-provider')}>Test Provider</Button>
          <Button variant="secondary" size="md" onClick={() => setAiControlQuickAction('save-routing')}>Save Routing</Button>
        </>
      ) : undefined}
      searchValue={activeApp === 'crm' ? globalSearch : undefined}
      onSearchChange={activeApp === 'crm' ? handleGlobalSearchChange : undefined}
      searchPlaceholder="Search companies, people, deals..."
    >
      <div className="space-y-4">
        {selectedCompanyId ? (
          <CompanyWorkspace
            companyId={selectedCompanyId}
            companies={companies}
            people={people}
            messages={messages}
            deals={deals}
            companyContactMethods={companyContactMethods}
            personContactMethods={personContactMethods || []}
            companyProblemProfiles={companyProblemProfiles}
            companyOutreachScripts={companyOutreachScripts}
            onBack={() => setSelectedCompanyId(null)}
            onEditCompany={handleEditCompany}
            onAIScoreCompany={handleAIScore}
            addCompanyContactMethod={addCompanyContactMethod}
            updateCompanyContactMethod={updateCompanyContactMethod}
            deleteCompanyContactMethod={deleteCompanyContactMethod}
            addPersonContactMethod={addPersonContactMethod}
            updatePersonContactMethod={updatePersonContactMethod}
            deletePersonContactMethod={deletePersonContactMethod}
            addCompanyProblemProfile={addCompanyProblemProfile}
            updateCompanyProblemProfile={updateCompanyProblemProfile}
            deleteCompanyProblemProfile={deleteCompanyProblemProfile}
            addCompanyOutreachScript={addCompanyOutreachScript}
            updateCompanyOutreachScript={updateCompanyOutreachScript}
            deleteCompanyOutreachScript={deleteCompanyOutreachScript}
            addPerson={addPerson}
            updatePerson={updatePerson}
            deletePerson={deletePerson}
            addMessage={addMessage}
            updateMessage={updateMessage}
            deleteMessage={deleteMessage}
            addDeal={addDeal}
            updateDeal={updateDeal}
            deleteDeal={deleteDeal}
            updateCompany={updateCompany}
            deleteCompany={handleDeleteCompany}
          />
        ) : (
        <>
        {tab === 'dashboard' && (
              <OpportunitiesDashboard
                companies={companies}
                people={people}
                messages={messages}
                deals={deals}
                updatePerson={updatePerson}
                updateMessage={updateMessage}
                onUseTemplate={(person) => setTemplatePerson(person)}
                onAddCompany={() => setActiveModal('company')}
                onAddPerson={() => setActiveModal('person')}
                onAddMessage={() => setActiveModal('message')}
                onResetDemoData={handleResetDemoData}
                onOpenCompaniesTab={() => setTab('companies')}
              />
            )}

            {tab === 'big_companies' && (
              <CompanySegmentView
                segmentType="big_company"
                title="Big Companies"
                subtitle="Enterprise-level targets — internships, junior roles, recruiter relationships."
                companies={companies}
                people={people}
                messages={messages}
                deals={deals}
                onAddCompany={() => setActiveModal('company')}
                onEdit={handleEditCompany}
                onDelete={handleRequestDelete}
                onAIScore={handleAIScore}
                onImportCompaniesBatch={importCompaniesBatch}
                onCompanyClick={handleCompanyClick}
              />
            )}

            {tab === 'sme_companies' && (
              <CompanySegmentView
                segmentType="sme"
                title="SME Companies"
                subtitle="Small & medium businesses — faster decisions, partnership potential, agency work."
                companies={companies}
                people={people}
                messages={messages}
                deals={deals}
                onAddCompany={() => setActiveModal('company')}
                onEdit={handleEditCompany}
                onDelete={handleRequestDelete}
                onAIScore={handleAIScore}
                onImportCompaniesBatch={importCompaniesBatch}
                onCompanyClick={handleCompanyClick}
              />
            )}

            {tab === 'freelance_leads' && (
              <CompanySegmentView
                segmentType="freelance"
                title="Freelance Leads"
                subtitle="Independent professionals — paid UX/UI work, audits, recurring clients."
                companies={companies}
                people={people}
                messages={messages}
                deals={deals}
                onAddCompany={() => setActiveModal('company')}
                onEdit={handleEditCompany}
                onDelete={handleRequestDelete}
                onAIScore={handleAIScore}
                onImportCompaniesBatch={importCompaniesBatch}
                onCompanyClick={handleCompanyClick}
              />
            )}

            {tab === 'queue' && (
              <OutreachQueuePanel
                companies={companies}
                people={people}
                messages={messages}
                onUseTemplate={(person) => setTemplatePerson(person)}
                onLogMessage={(person) => {
                  setMessageDraft({
                    companyId: person.companyId,
                    personId: person.id,
                    channel: person.contactChannel === 'email' ? 'Email' : person.contactChannel === 'linkedin' ? 'LinkedIn' : person.contactChannel || 'LinkedIn',
                    language: 'English',
                    messageType: 'outreach',
                    messageText: '',
                    sentDate: new Date().toISOString().slice(0, 16),
                    replyStatus: 'no_reply',
                    replySummary: '',
                    nextFollowUpDate: '',
                    status: 'sent',
                  });
                  setActiveModal('message');
                }}
                onMarkContacted={async (person) => {
                  await updatePerson(person.id, {
                    ...toPersonInput(person),
                    relationshipStatus: 'Message Sent',
                    nextFollowUpDate: new Date(Date.now() + 3 * 24 * 3600 * 1000).toISOString(),
                  });
                }}
                onReschedule={async (person, message, nextFollowUpDate) => {
                  if (message) {
                    await updateMessage(message.id, {
                      ...toMessageInput(message),
                      nextFollowUpDate,
                    });
                    return;
                  }

                  await updatePerson(person.id, {
                    ...toPersonInput(person),
                    nextFollowUpDate,
                  });
                }}
                onOpenLinkedIn={(person) => {
                  if (!person.linkedin) return;
                  window.open(person.linkedin, '_blank', 'noopener,noreferrer');
                }}
              />
            )}

            {tab === 'companies' && (
              <>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowCsvImport(true)}
                    className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
                  >
                    Import CSV
                  </button>
                </div>
                <CompaniesTable
                  companies={companies}
                  onEdit={handleEditCompany}
                  onDelete={handleRequestDelete}
                  onAIScore={handleAIScore}
                  onCompanyClick={handleCompanyClick}
                  filters={companyFilters}
                  onFilterChange={setCompanyFilters}
                />
              </>
            )}

            {tab === 'people' && (
              <>
                <div className="flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => setShowPeopleImport(true)}
                    className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
                  >
                    Import CSV
                  </button>
                </div>
                <PeopleTable
                  people={people}
                  onEdit={handleEditPerson}
                  onDelete={handleDeletePerson}
                  onUseTemplate={(person) => setTemplatePerson(person)}
                  filters={personFilters}
                  onFilterChange={setPersonFilters}
                />
              </>
            )}

            {tab === 'messages' && (
              <MessagesTable
                messages={messages}
                onEdit={handleEditMessage}
                onDelete={handleDeleteMessage}
                filters={messageFilters}
                onFilterChange={setMessageFilters}
                onLogMessage={() => setActiveModal('message')}
              />
            )}

            {tab === 'deals' && (
              <DealsTable
                deals={deals}
                onEdit={handleEditDeal}
                onDelete={handleDeleteDeal}
                filters={dealFilters}
                onFilterChange={setDealFilters}
              />
            )}

            {tab === 'relationships' && (
              <RelationshipsPanel
                relationships={relationships}
                relationshipInteractions={relationshipInteractions}
                relationshipOpportunities={relationshipOpportunities}
                relationshipCategories={data.relationshipCategories}
                relationshipContactMethods={data.relationshipContactMethods}
                people={people}
                companies={companies}
                projects={projects}
                onAddRelationship={addRelationship}
                onUpdateRelationship={updateRelationship}
                onDeleteRelationship={deleteRelationship}
                onAddRelationshipInteraction={addRelationshipInteraction}
                onUpdateRelationshipInteraction={updateRelationshipInteraction}
                onDeleteRelationshipInteraction={deleteRelationshipInteraction}
                onAddRelationshipOpportunity={addRelationshipOpportunity}
                onUpdateRelationshipOpportunity={updateRelationshipOpportunity}
                onDeleteRelationshipOpportunity={deleteRelationshipOpportunity}
                onAddRelationshipCategory={addRelationshipCategory}
                onUpdateRelationshipCategory={updateRelationshipCategory}
                onDeleteRelationshipCategory={deleteRelationshipCategory}
                onAddRelationshipContactMethod={addRelationshipContactMethod}
                onUpdateRelationshipContactMethod={updateRelationshipContactMethod}
                onDeleteRelationshipContactMethod={deleteRelationshipContactMethod}
              />
            )}

            {tab === 'notes' && (
              <SmartNotesPanel
                noteCategories={noteCategories}
                smartNotes={smartNotes}
                noteAttachments={noteAttachments}
                noteBlocks={noteBlocks}
                projects={projects}
                companies={companies}
                people={people}
                relationships={relationships}
                tasks={tasks}
                strategyGoals={strategyGoals}
                plans={plans}
                onAddNoteCategory={addNoteCategory}
                onUpdateNoteCategory={updateNoteCategory}
                onDeleteNoteCategory={deleteNoteCategory}
                onAddSmartNote={addSmartNote}
                onUpdateSmartNote={updateSmartNote}
                onDeleteSmartNote={deleteSmartNote}
                onAddNoteAttachment={addNoteAttachment}
                onUpdateNoteAttachment={updateNoteAttachment}
                onDeleteNoteAttachment={deleteNoteAttachment}
                onAddNoteBlock={addNoteBlock}
                onUpdateNoteBlock={updateNoteBlock}
                onDeleteNoteBlock={deleteNoteBlock}
              />
            )}

            {tab === 'projects' && (
              <ProjectsPanel
                projects={projects}
                companies={companies}
                people={people}
                messages={messages}
                deals={deals}
                projectTasks={projectTasks}
                projectTimeLogs={projectTimeLogs}
                projectMeetings={projectMeetings}
                projectDocuments={projectDocuments}
                projectFinanceItems={projectFinanceItems}
                onAddProject={() => setActiveModal('project')}
                onEdit={handleEditProject}
                onUpdateProject={updateProject}
                onDelete={handleDeleteProject}
                onAddTask={addProjectTask}
                onUpdateTask={updateProjectTask}
                onDeleteTask={deleteProjectTask}
                onAddTimeLog={addProjectTimeLog}
                onDeleteTimeLog={deleteProjectTimeLog}
                onAddMeeting={addProjectMeeting}
                onDeleteMeeting={deleteProjectMeeting}
                onAddDocument={addProjectDocument}
                onDeleteDocument={deleteProjectDocument}
                onAddFinanceItem={addProjectFinanceItem}
                onDeleteFinanceItem={deleteProjectFinanceItem}
              />
            )}

            {tab === 'templates' && (
              <TemplatesPanel
                templates={templates}
                onAddTemplate={addTemplate}
                onUpdateTemplate={updateTemplate}
                onDeleteTemplate={deleteTemplate}
                onSeedDefaults={seedDefaultTemplates}
              />
            )}

            {tab === 'strategy' && (
              <StrategyPanel
                strategyItems={strategyItems}
                strategyNotes={strategyNotes}
                strategyGoals={strategyGoals}
                strategyPlans={strategyPlans}
                strategyTactics={strategyTactics}
                strategyExperiments={strategyExperiments}
                strategyDecisions={strategyDecisions}
                projects={projects}
                companies={companies}
                people={people}
                onBackToDesktop={handleBackToDesktop}
                onAddStrategyItem={addStrategyItem}
                onUpdateStrategyItem={updateStrategyItem}
                onDeleteStrategyItem={deleteStrategyItem}
                onAddStrategyGoal={addStrategyGoal}
                onUpdateStrategyGoal={updateStrategyGoal}
                onDeleteStrategyGoal={deleteStrategyGoal}
                onAddStrategyPlan={addStrategyPlan}
                onUpdateStrategyPlan={updateStrategyPlan}
                onDeleteStrategyPlan={deleteStrategyPlan}
                onAddStrategyTactic={addStrategyTactic}
                onUpdateStrategyTactic={updateStrategyTactic}
                onDeleteStrategyTactic={deleteStrategyTactic}
                onAddStrategyExperiment={addStrategyExperiment}
                onUpdateStrategyExperiment={updateStrategyExperiment}
                onDeleteStrategyExperiment={deleteStrategyExperiment}
                onAddStrategyDecision={addStrategyDecision}
                onUpdateStrategyDecision={updateStrategyDecision}
                onDeleteStrategyDecision={deleteStrategyDecision}
              />
            )}

            {tab === 'plans' && (
              <PlansPanel
                plans={plans}
                planItems={planItems}
                projects={projects}
                strategyGoals={strategyGoals}
                onAddPlan={addPlan}
                onUpdatePlan={updatePlan}
                onDeletePlan={deletePlan}
                onAddPlanItem={addPlanItem}
                onUpdatePlanItem={updatePlanItem}
                onDeletePlanItem={deletePlanItem}
              />
            )}

            {tab === 'tasks' && (
              <TasksPanel
                tasks={tasks}
                recurringTasks={recurringTasks}
                projects={projects}
                plans={plans}
                strategyGoals={strategyGoals}
                companies={companies}
                people={people}
                generatedDocuments={generatedDocuments}
                onAddTask={addTask}
                onUpdateTask={updateTask}
                onDeleteTask={deleteTask}
                onAddRecurringTask={addRecurringTask}
                onUpdateRecurringTask={updateRecurringTask}
                onDeleteRecurringTask={deleteRecurringTask}
                recurringTaskLogs={recurringTaskLogs}
                onAddRecurringTaskLog={addRecurringTaskLog}
                onUpdateRecurringTaskLog={updateRecurringTaskLog}
                onDeleteRecurringTaskLog={deleteRecurringTaskLog}
                taskWorkLogs={taskWorkLogs}
                weeklyTaskReviews={weeklyTaskReviews}
                onAddTaskWorkLog={addTaskWorkLog}
                onUpdateTaskWorkLog={updateTaskWorkLog}
                onDeleteTaskWorkLog={deleteTaskWorkLog}
                onAddWeeklyTaskReview={addWeeklyTaskReview}
                onUpdateWeeklyTaskReview={updateWeeklyTaskReview}
                onDeleteWeeklyTaskReview={deleteWeeklyTaskReview}
              />
            )}

            {tab === 'finance' && (
              <FinancePanel
                onBackToDesktop={handleBackToDesktop}
                financeIncome={financeIncome}
                financeExpenses={financeExpenses}
                financeAllocationRules={financeAllocationRules}
                financePurchaseGoals={financePurchaseGoals}
                financeInvestmentIdeas={financeInvestmentIdeas}
                financeInvestmentRules={financeInvestmentRules}
                financeInvestmentAllocations={financeInvestmentAllocations}
                projects={projects}
                companies={companies}
                onAddFinanceIncome={addFinanceIncome}
                onUpdateFinanceIncome={updateFinanceIncome}
                onDeleteFinanceIncome={deleteFinanceIncome}
                onAddFinanceExpense={addFinanceExpense}
                onUpdateFinanceExpense={updateFinanceExpense}
                onDeleteFinanceExpense={deleteFinanceExpense}
                onAddFinanceAllocationRule={addFinanceAllocationRule}
                onUpdateFinanceAllocationRule={updateFinanceAllocationRule}
                onDeleteFinanceAllocationRule={deleteFinanceAllocationRule}
                onAddFinancePurchaseGoal={addFinancePurchaseGoal}
                onUpdateFinancePurchaseGoal={updateFinancePurchaseGoal}
                onDeleteFinancePurchaseGoal={deleteFinancePurchaseGoal}
                onAddFinanceInvestmentIdea={addFinanceInvestmentIdea}
                onUpdateFinanceInvestmentIdea={updateFinanceInvestmentIdea}
                onDeleteFinanceInvestmentIdea={deleteFinanceInvestmentIdea}
                onAddFinanceInvestmentRule={addFinanceInvestmentRule}
                onUpdateFinanceInvestmentRule={updateFinanceInvestmentRule}
                onDeleteFinanceInvestmentRule={deleteFinanceInvestmentRule}
                onAddFinanceInvestmentAllocation={addFinanceInvestmentAllocation}
                onUpdateFinanceInvestmentAllocation={updateFinanceInvestmentAllocation}
                onDeleteFinanceInvestmentAllocation={deleteFinanceInvestmentAllocation}
                financePeriods={financePeriods}
                onAddFinancePeriod={addFinancePeriod}
                onUpdateFinancePeriod={updateFinancePeriod}
                onDeleteFinancePeriod={deleteFinancePeriod}
                financeRecurringRules={financeRecurringRules}
                onAddFinanceRecurringRule={addFinanceRecurringRule}
                onUpdateFinanceRecurringRule={updateFinanceRecurringRule}
                onDeleteFinanceRecurringRule={deleteFinanceRecurringRule}
              />
            )}

            {tab === 'documents' && (
              <DocumentStudioPanel
                onBackToDesktop={handleBackToDesktop}
                documentTemplates={documentTemplates}
                documentBrandSettings={documentBrandSettings}
                generatedDocuments={generatedDocuments}
                invoices={invoices}
                invoiceItems={invoiceItems}
                projects={projects}
                companies={companies}
                people={people}
                deals={deals}
                onAddDocumentTemplate={addDocumentTemplate}
                onUpdateDocumentTemplate={updateDocumentTemplate}
                onDeleteDocumentTemplate={deleteDocumentTemplate}
                onAddDocumentBrandSettings={addDocumentBrandSettings}
                onUpdateDocumentBrandSettings={updateDocumentBrandSettings}
                onDeleteDocumentBrandSettings={deleteDocumentBrandSettings}
                onAddGeneratedDocument={addGeneratedDocument}
                onUpdateGeneratedDocument={updateGeneratedDocument}
                onDeleteGeneratedDocument={deleteGeneratedDocument}
                selectedInvoiceId={selectedInvoiceId}
                onSelectInvoice={setSelectedInvoiceId}
                onAddInvoice={addInvoice}
                onUpdateInvoice={updateInvoice}
                onDeleteInvoice={deleteInvoice}
                onAddInvoiceItem={addInvoiceItem}
                onUpdateInvoiceItem={updateInvoiceItem}
                onDeleteInvoiceItem={deleteInvoiceItem}
                financeIncome={financeIncome}
                financePeriods={financePeriods}
                onAddFinanceIncome={addFinanceIncome}
              />
            )}

            {tab === 'ai-control' && (
              <AIControlPanel
                aiProviderKeys={aiProviderKeys}
                aiUseCaseSettings={aiUseCaseSettings}
                quickAction={aiControlQuickAction}
                onQuickActionHandled={() => setAiControlQuickAction(null)}
                onAddAIProviderKey={addAIProviderKey}
                onUpdateAIProviderKey={updateAIProviderKey}
                onDeleteAIProviderKey={deleteAIProviderKey}
                onTestAIProviderKey={testAIProviderKey}
                onAddAIUseCaseSetting={addAIUseCaseSetting}
                onUpdateAIUseCaseSetting={updateAIUseCaseSetting}
                onDeleteAIUseCaseSetting={deleteAIUseCaseSetting}
              />
            )}

            {tab === 'social' && (
              <SocialMediaPanel
                socialPlatforms={socialPlatforms}
                contentPillars={contentPillars}
                contentStrategies={contentStrategies}
                contentItems={contentItems}
                weeklyContentPlans={weeklyContentPlans}
                projects={projects}
                smartNotes={smartNotes}
                companies={companies}
                onAddSocialPlatform={addSocialPlatform}
                onUpdateSocialPlatform={updateSocialPlatform}
                onDeleteSocialPlatform={deleteSocialPlatform}
                onAddContentPillar={addContentPillar}
                onUpdateContentPillar={updateContentPillar}
                onDeleteContentPillar={deleteContentPillar}
                onAddContentStrategy={addContentStrategy}
                onUpdateContentStrategy={updateContentStrategy}
                onDeleteContentStrategy={deleteContentStrategy}
                onAddContentItem={addContentItem}
                onUpdateContentItem={updateContentItem}
                onDeleteContentItem={deleteContentItem}
                onAddWeeklyContentPlan={addWeeklyContentPlan}
                onUpdateWeeklyContentPlan={updateWeeklyContentPlan}
                onDeleteWeeklyContentPlan={deleteWeeklyContentPlan}
              />
            )}

            {tab === 'life' && (
              <LifeManagementPanel
                lifeNutritionLogs={lifeNutritionLogs}
                lifeFitnessLogs={lifeFitnessLogs}
                lifeDeenLogs={lifeDeenLogs}
                lifeFamilyActions={lifeFamilyActions}
                lifeWeeklyReviews={lifeWeeklyReviews}
                requestedTab={lifeQuickTab}
                onAddLifeNutritionLog={addLifeNutritionLog}
                onUpdateLifeNutritionLog={updateLifeNutritionLog}
                onDeleteLifeNutritionLog={deleteLifeNutritionLog}
                onAddLifeFitnessLog={addLifeFitnessLog}
                onUpdateLifeFitnessLog={updateLifeFitnessLog}
                onDeleteLifeFitnessLog={deleteLifeFitnessLog}
                onAddLifeDeenLog={addLifeDeenLog}
                onUpdateLifeDeenLog={updateLifeDeenLog}
                onDeleteLifeDeenLog={deleteLifeDeenLog}
                onAddLifeFamilyAction={addLifeFamilyAction}
                onUpdateLifeFamilyAction={updateLifeFamilyAction}
                onDeleteLifeFamilyAction={deleteLifeFamilyAction}
                onAddLifeWeeklyReview={addLifeWeeklyReview}
                onUpdateLifeWeeklyReview={updateLifeWeeklyReview}
                onDeleteLifeWeeklyReview={deleteLifeWeeklyReview}
              />
            )}
          </>)}
          </div>

      {/* Add Company Modal */}
      {activeModal === 'company' ? (
        <OpportunityModal title="Add Company" onClose={() => { setActiveModal(null); setCompanyResearchDraft(null); }}>
          <AddCompanyForm
            onResearchResultChange={setCompanyResearchDraft}
            onSubmit={async (input) => {
              try {
                const savedCompany = await addCompany(input);
                await createResearchFollowUpRecords(savedCompany, companyResearchDraft);
                setActiveModal(null);
                setCompanyResearchDraft(null);
              } catch (error) {
                console.error('[Opportunities] Failed to add company.', error);
              }
            }}
            onCancel={() => {
              setActiveModal(null);
              setCompanyResearchDraft(null);
            }}
          />
        </OpportunityModal>
      ) : null}

      {/* Edit Company Modal */}
      {editingCompany ? (
        <OpportunityModal title="Edit Company" onClose={() => { setEditingCompany(null); setCompanyResearchDraft(null); }}>
          <AddCompanyForm
            initialData={toCompanyInput(editingCompany)}
            onResearchResultChange={setCompanyResearchDraft}
            onSubmit={async (input) => {
              try {
                const savedCompany = await updateCompany(editingCompany.id, input);
                await createResearchFollowUpRecords(savedCompany, companyResearchDraft);
                setEditingCompany(null);
                setCompanyResearchDraft(null);
              } catch (error) {
                console.error('[Opportunities] Failed to update company.', error);
              }
            }}
            onCancel={() => {
              setEditingCompany(null);
              setCompanyResearchDraft(null);
            }}
          />
        </OpportunityModal>
      ) : null}

      {/* Add Person Modal */}
      {activeModal === 'person' ? (
        <OpportunityModal title="Add Person" onClose={() => setActiveModal(null)}>
          <AddPersonForm
            companies={companies}
            onSubmit={async (input) => {
              try {
                await addPerson(input);
                setActiveModal(null);
              } catch (error) {
                console.error('[Opportunities] Failed to add person.', error);
              }
            }}
            onCancel={() => setActiveModal(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Edit Person Modal */}
      {editingPerson ? (
        <OpportunityModal title="Edit Person" onClose={() => setEditingPerson(null)}>
          <AddPersonForm
            companies={companies}
            initialData={toPersonInput(editingPerson)}
            onSubmit={async (input) => {
              try {
                await updatePerson(editingPerson.id, input);
                setEditingPerson(null);
              } catch (error) {
                console.error('[Opportunities] Failed to update person.', error);
              }
            }}
            onCancel={() => setEditingPerson(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Add Message Modal */}
      {activeModal === 'message' ? (
        <OpportunityModal title="Log Message" onClose={() => { setActiveModal(null); setMessageDraft(null); }}>
          <LogMessageForm
            companies={companies}
            people={people}
            onSubmit={async (input) => {
              try {
                await addMessage(input);
                setActiveModal(null);
                setMessageDraft(null);
              } catch (error) {
                console.error('[Opportunities] Failed to add message.', error);
              }
            }}
            initialData={messageDraft || undefined}
            onCancel={() => {
              setActiveModal(null);
              setMessageDraft(null);
            }}
          />
        </OpportunityModal>
      ) : null}

      {/* Edit Message Modal */}
      {editingMessage ? (
        <OpportunityModal title="Edit Message" onClose={() => setEditingMessage(null)}>
          <LogMessageForm
            companies={companies}
            people={people}
            initialData={toMessageInput(editingMessage)}
            onSubmit={async (input) => {
              try {
                await updateMessage(editingMessage.id, input);
                setEditingMessage(null);
              } catch (error) {
                console.error('[Opportunities] Failed to update message.', error);
              }
            }}
            onCancel={() => setEditingMessage(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Add Project Modal */}
      {activeModal === 'project' ? (
        <OpportunityModal title="Add Project" onClose={() => setActiveModal(null)}>
          <AddProjectForm
            companies={companies}
            people={people}
            onSubmit={async (input) => {
              try {
                await addProject(input);
                setActiveModal(null);
              } catch (error) {
                console.error('[Opportunities] Failed to add project.', error);
              }
            }}
            onCancel={() => setActiveModal(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Edit Project Modal */}
      {editingProject ? (
        <OpportunityModal title="Edit Project" onClose={() => setEditingProject(null)}>
          <AddProjectForm
            companies={companies}
            people={people}
            initialData={toProjectInput(editingProject)}
            onSubmit={async (input) => {
              try {
                await updateProject(editingProject.id, input);
                setEditingProject(null);
              } catch (error) {
                console.error('[Opportunities] Failed to update project.', error);
              }
            }}
            onCancel={() => setEditingProject(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Add Deal Modal */}
      {activeModal === 'deal' ? (
        <OpportunityModal title="Add Deal" onClose={() => setActiveModal(null)}>
          <AddDealForm
            companies={companies}
            people={people}
            onSubmit={async (input) => {
              try {
                await addDeal(input);
                setActiveModal(null);
              } catch (error) {
                console.error('[Opportunities] Failed to add deal.', error);
              }
            }}
            onCancel={() => setActiveModal(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* Edit Deal Modal */}
      {editingDeal ? (
        <OpportunityModal title="Edit Deal" onClose={() => setEditingDeal(null)}>
          <AddDealForm
            companies={companies}
            people={people}
            initialData={toDealInput(editingDeal)}
            onSubmit={async (input) => {
              try {
                await updateDeal(editingDeal.id, input);
                setEditingDeal(null);
              } catch (error) {
                console.error('[Opportunities] Failed to update deal.', error);
              }
            }}
            onCancel={() => setEditingDeal(null)}
          />
        </OpportunityModal>
      ) : null}

      {/* CSV Import Modal */}
      {showCsvImport && (
        <CsvImportModal
          onClose={() => setShowCsvImport(false)}
          onImport={async (rows) => {
            if (!importCompaniesBatch) {
              return { success: false, error: 'Import function not available.' };
            }
            try {
              const inserted = await importCompaniesBatch(rows);
              return { success: true, count: inserted.length };
            } catch (err) {
              return { success: false, error: err instanceof Error ? err.message : 'Import failed.' };
            }
          }}
        />
      )}

      {showPeopleImport && (
        <ImportPeopleModal
          companies={companies}
          onClose={() => setShowPeopleImport(false)}
          onImport={async (rows) => {
            if (!importPeople) {
              throw new Error('Import function not available.');
            }

            try {
              const inserted = await importPeople(rows);
              return inserted;
            } catch (err) {
              throw err instanceof Error ? err : new Error('Import failed.');
            }
          }}
        />
      )}

      {templatePerson ? (
        <OutreachTemplateModal
          isOpen
          person={templatePerson}
          company={companies.find((company) => company.id === templatePerson.companyId) || null}
          templates={templates}
          onClose={() => setTemplatePerson(null)}
          onLogMessage={async (messageInput) => {
            await addMessage(messageInput);
          }}
          onUpdatePerson={async (id, input) => {
            await updatePerson(id, input);
          }}
        />
      ) : null}

      {aiScoringCompany ? (
        <AICompanyScoringModal
          isOpen
          company={aiScoringCompany}
          people={people}
          messages={messages}
          deals={deals}
          onClose={() => setAiScoringCompany(null)}
          onApply={handleApplyAIScore}
        />
      ) : null}

      {confirmDeleteCompanyId ? (
        <OpportunityModal title="Confirm Delete" onClose={handleCancelDelete}>
          <p className="text-sm leading-6 text-neutral-700">This may leave related people, messages, and deals without a company. Continue?</p>
          <div className="mt-6 flex items-center gap-3">
            <Button variant="primary" size="md" onClick={handleConfirmDelete}>Delete</Button>
            <Button variant="secondary" size="md" onClick={handleCancelDelete}>Cancel</Button>
          </div>
        </OpportunityModal>
      ) : null}

      {deleteError ? (
        <OpportunityModal title="Error" onClose={() => setDeleteError(null)}>
          <p className="text-sm leading-6 text-neutral-700">{deleteError}</p>
          <div className="mt-6">
            <Button variant="primary" size="md" onClick={() => setDeleteError(null)}>OK</Button>
          </div>
        </OpportunityModal>
      ) : null}
    </FullPageAppShell>
  );
};

export default OpportunitiesLayout;