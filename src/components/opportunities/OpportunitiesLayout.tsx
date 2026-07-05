import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  UserPlus, Building2, Plus, Sparkles, FileText,
  LayoutDashboard, Store, Briefcase, Globe, Users,
  ListChecks, RotateCcw, Clock, Archive, Star,
  Calendar, TrendingUp, DollarSign, PiggyBank, Target, BarChart3, Shield,
  Activity, FolderOpen, FileEdit, Image, Smartphone, Heart, Leaf,
  Key, Route, TestTube, Lock, Search, MoreHorizontal,
} from 'lucide-react';
import Button from '../ui/Button';
import SectionHeader from '../ui/SectionHeader';
import { normalizeDatabaseType } from '../../utils/opportunitiesMappers';
import type { OpportunitiesTab, OpportunitiesData, CompanyInput, PersonInput, MessageInput, DealInput, RelationshipInput, RelationshipInteractionInput, RelationshipOpportunityInput, RelationshipCategoryInput, RelationshipContactMethodInput, NoteCategoryInput, NoteCategory, SmartNoteInput, NoteAttachmentInput, NoteBlockInput, Project, ProjectInput, MessageTemplateInput, Company, Person, StrategyItemInput, StrategyGoalInput, StrategyPlanInput, StrategyTacticInput, StrategyExperimentInput, StrategyDecisionInput, DocumentInput, DocumentItem, DocumentTemplateInput, DocumentTemplate, DocumentBrandSettingsInput, DocumentBrandSettings, GeneratedDocumentInput, GeneratedDocument, InvoiceInput, Invoice, InvoiceItemInput, InvoiceItem, AIProviderKeyInput, AIUseCaseSettingInput, AIProviderKey, AIUseCaseSetting, RecurringTaskLog, RecurringTaskLogInput, TaskWorkLog, TaskWorkLogInput, WeeklyTaskReview, WeeklyTaskReviewInput, SocialPlatform, SocialPerson, SocialPersonInput, ContentPillar, ContentStrategy, ContentItem, WeeklyContentPlan, SocialPlatformInput, ContentPillarInput, ContentStrategyInput, ContentItemInput, WeeklyContentPlanInput, LifeNutritionLog, LifeNutritionLogInput, LifeFitnessLog, LifeFitnessLogInput, LifeDeenLog, LifeDeenLogInput, LifeFamilyAction, LifeFamilyActionInput, LifeWeeklyReview, LifeWeeklyReviewInput, CompanyContactMethod, CompanyContactMethodInput, PersonContactMethod, PersonContactMethodInput, CompanyProblemProfile, CompanyProblemProfileInput, CompanyOutreachScript, CompanyOutreachScriptInput, DesktopShortcut, DesktopShortcutInput, DesktopGroup, DesktopGroupInput, DesktopSettings, DesktopSettingsInput } from '../../types/opportunities';
import OpportunitiesDashboard from './OpportunitiesDashboard';
import CompaniesTable, { type CompanyFilters } from './CompaniesTable';
import CompanyWorkspace from './CompanyWorkspace';
import PeopleTable, { type PersonFilters } from './PeopleTable';
import ProjectsPanel from './ProjectsPanel';
import AddProjectForm from './AddProjectForm';
import StrategyPanel from './StrategyPanel';
import PlansPanel from './PlansPanel';
import FinancePanel from './FinancePanel';
import DocumentStudioPanel from './DocumentStudioPanel';
import AIControlPanel from './AIControlPanel';
import OpportunityModal from './OpportunityModal';
import AddCompanyForm from './AddCompanyForm';
import AddPersonForm from './AddPersonForm';
import CsvImportModal from './CsvImportModal';
import ImportPeopleModal from './ImportPeopleModal';
import MessageExamplesPanel from './MessageExamplesPanel';
import CompanySegmentView from './CompanySegmentView';
import PersonWorkspace from './PersonWorkspace';
import AICompanyScoringModal from './AICompanyScoringModal';
import TasksPanel from './TasksPanel';
import RelationshipsPanel from './RelationshipsPanel';
import SmartNotesPanel from './SmartNotesPanel';
import NoteCategoryForm from './NoteCategoryForm';
import SocialMediaPanel from './SocialMediaPanel';
import LifeManagementPanel from './LifeManagementPanel';
import LeadResearchPlaybook from './LeadResearchPlaybook';
import DeleteCompanyModal from './DeleteCompanyModal';
import DesktopLauncher from './DesktopLauncher';
import type { AppId } from './DesktopLauncher';
import AppDashboardShell from './AppDashboardShell';
import type { SidebarItem } from './AppDashboardShell';
import { buildNoteCategoryMenu, protectedCategorySlugSet } from './noteCategoryUtils';
import type { CompanyResearchResult } from '../../types/opportunities';

const toCompanyInput = (c: Company): CompanyInput => ({
  name: c.name,
  databaseType: c.databaseType as CompanyInput['databaseType'],
  category: c.category,
  industry: c.industry,
  country: c.country,
  city: c.city,
  phone: c.phone,
  email: c.email,
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
 phone: p.phone ?? null,
 relationType: p.relationType ?? null,
 status: p.status ?? 'active',
 archivedAt: p.archivedAt ?? null,
});

// toMessageInput/toDealInput removed — tracking system retired

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
 targetNiche: '',
 outreachStatus: '',
 country: '',
 status: 'active',
};

const defaultPersonFilters: PersonFilters = {
 searchQuery: '',
 decisionPower: '',
 status: 'active',
};

// message/deal filters removed — tracking system retired

const NAV_STATE_STORAGE_KEY = 'personalOS.navigationState';

type PersistedNavState = {
  activeApp?: AppId;
  tab?: OpportunitiesTab;
  globalSearch?: string;
  companyFilters?: CompanyFilters;
  personFilters?: PersonFilters;
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
  'message_examples',
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
   'lead_research',
  'archived',
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
 targetNiche: typeof next.targetNiche === 'string' ? next.targetNiche : '',
 outreachStatus: typeof next.outreachStatus === 'string' ? next.outreachStatus : '',
 country: typeof next.country === 'string' ? next.country : '',
 status: typeof next.status === 'string' ? next.status : 'active',
 }
 : defaultCompanyFilters;
};

const resolveInitialPersonFilters = (): PersonFilters => {
 const next = readPersistedNavState().personFilters;
 return next && isObjectRecord(next)
 ? {
 searchQuery: typeof next.searchQuery === 'string' ? next.searchQuery : '',
 decisionPower: typeof next.decisionPower === 'string' ? next.decisionPower : '',
 status: typeof next.status === 'string' ? next.status : 'active',
 }
 : defaultPersonFilters;
};

// message/deal filter resolvers removed — tracking system retired

type AIControlQuickAction = 'add-provider-key' | 'test-provider' | 'save-routing';

// isNoContact / isHighPriorityPerson / toDayKey / getQueueTabCount removed — queue tab retired

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
  socialPeople: SocialPerson[];
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
  const [activeModal, setActiveModal] = useState<'company' | 'person' | 'project' | null>(null);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [editingPerson, setEditingPerson] = useState<Person | null>(null);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [showCsvImport, setShowCsvImport] = useState(false);
  const [showPeopleImport, setShowPeopleImport] = useState(false);

 // Global search state
 const [globalSearch, setGlobalSearch] = useState(resolveInitialGlobalSearch);

 // Per-table filter states
 const [companyFilters, setCompanyFilters] = useState<CompanyFilters>(resolveInitialCompanyFilters);
 const [personFilters, setPersonFilters] = useState<PersonFilters>(resolveInitialPersonFilters);
  // message/deal filters removed — tracking system retired
 const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
 const [aiScoringCompany, setAiScoringCompany] = useState<Company | null>(null);
 const [companyResearchDraft, setCompanyResearchDraft] = useState<CompanyResearchResult | null>(null);
 const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [personWorkspaceContext, setPersonWorkspaceContext] = useState<'global' | 'company'>('global');
 const [selectedPersonIds, setSelectedPersonIds] = useState<Set<string>>(new Set());
 const [confirmDeleteCompanyId, setConfirmDeleteCompanyId] = useState<string | null>(null);
 const [deleteError, setDeleteError] = useState<string | null>(null);
 const [showDeleteModal, setShowDeleteModal] = useState(false);
 const [companyToDelete, setCompanyToDelete] = useState<Company | null>(null);
  const [aiControlQuickAction, setAiControlQuickAction] = useState<AIControlQuickAction | null>(null);

  const [archiveSubTab, setArchiveSubTab] = useState<'companies' | 'people'>('companies');
  const [selectedArchivedPersonIds, setSelectedArchivedPersonIds] = useState<Set<string>>(new Set());
  const [activeApp, setActiveApp] = useState<AppId>(resolveInitialApp);
   const [appSection, setAppSection] = useState<string>('');
  const [selectedNoteCategorySlug, setSelectedNoteCategorySlug] = useState('all');
  const [noteCategoryEditor, setNoteCategoryEditor] = useState<{ mode: 'add' | 'edit'; category?: NoteCategory } | null>(null);
  const [noteCategoryActionError, setNoteCategoryActionError] = useState<string | null>(null);

  useEffect(() => {
 if (typeof window === 'undefined') return;

 const nextState: PersistedNavState = {
 activeApp,
 tab,
 globalSearch,
 companyFilters,
 personFilters,
  // message/deal filters removed
 };

 try {
 window.sessionStorage.setItem(NAV_STATE_STORAGE_KEY, JSON.stringify(nextState));
 } catch {
 // Ignore storage write failures.
 }
  }, [activeApp, tab, globalSearch, companyFilters, personFilters]);

  const handleLaunchApp = (appId: AppId) => {
  setActiveApp(appId);
  if (appId === 'crm' || appId === 'messages') { setTab('messages'); setAppSection(''); }
  else if (appId === 'strategy') { setTab('strategy'); setAppSection('goals'); }
  else if (appId === 'plans') { setTab('plans'); setAppSection('dashboard'); }
  else if (appId === 'tasks') { setTab('tasks'); setAppSection('weekly'); }
  else if (appId === 'projects') setTab('projects');
  else if (appId === 'finance') { setTab('finance'); setAppSection('dashboard'); }
  else if (appId === 'documents') { setTab('documents'); setAppSection('dashboard'); }
  else if (appId === 'social') { setTab('social'); setAppSection('dashboard'); }
  else if (appId === 'relationships') setTab('relationships');
  else if (appId === 'life') { setTab('life'); setAppSection('dashboard'); }
  else if (appId === 'notes') setTab('notes');
  else if (appId === 'ai_control') { setTab('ai-control'); setAppSection('overview'); }
  setGlobalSearch('');
 };

 const handleBackToDesktop = () => {
 setActiveApp('desktop');
 setTab('dashboard');
 setGlobalSearch('');
 };

  const getShellTitle = () => {
 switch (activeApp) {
  case 'crm': return 'CRM';
  case 'messages': return 'CRM';
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

   const SIDEBAR_ITEMS: Record<string, SidebarItem[]> = {
    crm: [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'big_companies', label: 'Big Companies', icon: Building2 },
    { id: 'sme_companies', label: 'SME Companies', icon: Store },
    { id: 'freelance_leads', label: 'Freelance Leads', icon: Briefcase },
    { id: 'companies', label: 'All Companies', icon: Globe },
    { id: 'people', label: 'People', icon: Users },
    { id: 'message_examples', label: 'Message Examples', icon: FileText },
     { id: 'lead_research', label: 'Lead Research', icon: Search },
     { id: 'archived', label: 'Archived', icon: Archive },
     ],
   plans: [
   { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
   { id: 'plans', label: 'Plans', icon: Calendar },
   { id: 'plan_items', label: 'Plan Items', icon: ListChecks },
   { id: 'timeline', label: 'Timeline', icon: Clock },
   { id: 'review', label: 'Review', icon: Star },
   ],
   tasks: [
   { id: 'weekly', label: 'Weekly Tasks', icon: ListChecks },
   { id: 'daily', label: 'Daily Recurring', icon: RotateCcw },
   { id: 'worklogs', label: 'Work Logs', icon: Clock },
   { id: 'backlog', label: 'Backlog', icon: Archive },
   { id: 'review', label: 'Weekly Review', icon: Star },
   ],
   finance: [
   { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
   { id: 'periods', label: 'Periods', icon: Calendar },
   { id: 'income', label: 'Income', icon: TrendingUp },
   { id: 'expenses', label: 'Expenses', icon: Activity },
   { id: 'allocation', label: 'Allocation', icon: BarChart3 },
   { id: 'purchase_goals', label: 'Purchase Goals', icon: Target },
   { id: 'investments', label: 'Investments', icon: TrendingUp },
   { id: 'recurring', label: 'Recurring Rules', icon: RotateCcw },
   { id: 'ai_assistant', label: 'AI Finance', icon: Sparkles },
   ],
   documents: [
   { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
   { id: 'generated', label: 'Generated Documents', icon: FileText },
   { id: 'invoice-studio', label: 'Invoice Studio', icon: FileEdit },
   { id: 'invoice-archive', label: 'Invoice Archive', icon: Archive },
   { id: 'contract-studio', label: 'Contract Studio', icon: FileEdit },
   { id: 'cahier-builder', label: 'Cahier de Charges', icon: FileText },
   { id: 'templates', label: 'Templates', icon: FileText },
   { id: 'brand', label: 'Brand Settings', icon: LayoutDashboard },
   { id: 'builder', label: 'Builder', icon: LayoutDashboard },
   { id: 'ai-assistant', label: 'AI Document', icon: Sparkles },
   { id: 'review', label: 'Review', icon: Star },
   ],
    social: [
      { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { id: 'strategy', label: 'Strategy', icon: Target },
      { id: 'platforms', label: 'Platforms', icon: Smartphone },
      { id: 'pillars', label: 'Pillars', icon: LayoutDashboard },
      { id: 'ideas', label: 'Ideas', icon: Star },
      { id: 'people', label: 'People', icon: Users },
      { id: 'weekly', label: 'Weekly Plan', icon: Calendar },
      { id: 'ai-assistant', label: 'AI Assistant', icon: Sparkles },
    ],
   life: [
   { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
   { id: 'nutrition', label: 'Nutrition', icon: Heart },
   { id: 'fitness', label: 'Fitness', icon: Activity },
   { id: 'deen', label: 'Deen', icon: Star },
   { id: 'family', label: 'Family', icon: Heart },
   { id: 'weekly-review', label: 'Weekly Review', icon: Star },
   ],
   ai_control: [
   { id: 'overview', label: 'Overview', icon: LayoutDashboard },
   { id: 'keys', label: 'Provider Keys', icon: Key },
   { id: 'routing', label: 'Use Case Routing', icon: Route },
   { id: 'tests', label: 'Provider Tests', icon: TestTube },
   { id: 'security', label: 'Security Notes', icon: Lock },
   ],
   strategy: [
   { id: 'goals', label: 'Goals', icon: Target },
   ],
   };

  const getSidebarItems = (): SidebarItem[] => {
  if (tab === 'notes' || activeApp === 'notes') return noteSidebarItems;
  return SIDEBAR_ITEMS[activeApp] || [];
  };

  const handleSectionChange = (sectionId: string) => {
  if (sectionId === 'add-category') {
  setNoteCategoryEditor({ mode: 'add' });
  setNoteCategoryActionError(null);
  return;
  }

  if (tab === 'notes' || activeApp === 'notes') {
  setSelectedNoteCategorySlug(sectionId);
  return;
  }

  if (activeApp === 'crm' || activeApp === 'messages') {
  setTab(sectionId as OpportunitiesTab);
  setSelectedCompanyId(null);
  setGlobalSearch('');
  } else {
  setAppSection(sectionId);
  }
  };

  const handleSubmitNoteCategory = async (input: NoteCategoryInput) => {
  if (!noteCategoryEditor) return;

  try {
  if (noteCategoryEditor.mode === 'edit' && noteCategoryEditor.category) {
  const next = await updateNoteCategory(noteCategoryEditor.category.id, input);
  if (selectedNoteCategorySlug === noteCategoryEditor.category.slug) {
  setSelectedNoteCategorySlug(next.slug);
  }
  } else {
  await addNoteCategory(input);
  }
  setNoteCategoryEditor(null);
  setNoteCategoryActionError(null);
  } catch (error) {
  throw error instanceof Error ? error : new Error('Failed to save category.');
  }
  };

  const handleDeleteNoteCategory = async (category: NoteCategory) => {
  const confirmed = window.confirm('Delete this category? Notes inside it will become Uncategorized.');
  if (!confirmed) return;

  try {
  const affectedNotes = smartNotes.filter((note) => note.categoryId === category.id || note.categorySlug === category.slug);
  await Promise.all(affectedNotes.map((note) => updateSmartNote(note.id, { categoryId: '', categorySlug: '' })));
  await deleteNoteCategory(category.id);
  if (selectedNoteCategorySlug === category.slug) {
  setSelectedNoteCategorySlug('uncategorized');
  }
  setNoteCategoryEditor(null);
  setNoteCategoryActionError(null);
  } catch (error) {
  console.error('[Notes] Failed to delete category.', error);
  setNoteCategoryActionError('Unable to delete category.');
  }
  };

  const {
 companies, people, messages, deals, projects, templates, strategyItems,
 relationships, relationshipInteractions, relationshipOpportunities,
 noteCategories, smartNotes, noteAttachments, noteBlocks,
 strategyGoals, strategyPlans, strategyTactics, strategyExperiments, strategyDecisions, strategyNotes,
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
  updateMessage, deleteMessage,
  updateDeal, deleteDeal,
  updateCompany, deleteCompany,
  updatePerson, deletePerson,
   updateProject, deleteProject,
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
   socialPlatforms, socialPeople, contentPillars, contentStrategies, contentItems, weeklyContentPlans,
   socialWeeklySystems, activeSocialWeeklySystem, socialWeeklyTasks,
   addSocialWeeklyTask, updateSocialWeeklyTask, deleteSocialWeeklyTask,
   addSocialPlatform, updateSocialPlatform, deleteSocialPlatform,
  addSocialPerson, updateSocialPerson, deleteSocialPerson,
  addContentPillar, updateContentPillar, deleteContentPillar,
  addContentStrategy, updateContentStrategy, deleteContentStrategy,
  addContentItem, updateContentItem, deleteContentItem,
  addWeeklyContentPlan, updateWeeklyContentPlan, deleteWeeklyContentPlan,
  addSocialWeeklySystem, updateSocialWeeklySystem, deleteSocialWeeklySystem,
  ensureDefaultSocialWeeklySystem,
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
 const noteCategoryMenu = useMemo(() => buildNoteCategoryMenu(noteCategories, smartNotes), [noteCategories, smartNotes]);
 const noteSidebarItems = useMemo<SidebarItem[]>(() => {
 return [
 ...noteCategoryMenu.map((category) => ({
 id: category.slug,
 label: category.name,
 icon: FileText,
 badge: category.count,
 trailingAction: category.isProtected ? undefined : (
 <button
 type="button"
 onClick={(event) => {
 event.stopPropagation();
 const categoryToEdit = noteCategories.find((item) => item.id === category.categoryId);
 if (categoryToEdit) setNoteCategoryEditor({ mode: 'edit', category: categoryToEdit });
 }}
 className="hidden h-7 w-7 items-center justify-center rounded-md border border-transparent text-neutral-400 transition hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 group-hover:flex"
 aria-label={`Edit ${category.name}`}
 >
 <MoreHorizontal className="h-4 w-4" />
 </button>
 ),
 })),
 { id: 'add-category', label: 'Category', icon: Plus },
 ];
 }, [noteCategoryMenu, noteCategories]);

 const handleResetDemoData = () => {
 const confirmed = window.confirm('Reset Opportunities OS demo data to the original seed data?');
 if (!confirmed) return;
 resetToSeedData();
 };

 const handleEditCompany = (company: Company) => {
 setEditingCompany(company);
 };

 const handleDeleteCompany = async (id: string, options?: { preserveRelated?: boolean }) => {
 if (import.meta.env.DEV) {
 console.log('[CRM] deleting company', id, 'preserveRelated:', options?.preserveRelated);
 }
 await deleteCompany(id, options);
 if (import.meta.env.DEV) {
 console.log('[CRM] delete company success', id);
 }
};

 const handleRequestDelete = (company: Company) => {
 setCompanyToDelete(company);
 setShowDeleteModal(true);
};

  const handleBulkArchive = async (ids: string[]) => {
    for (const id of ids) {
      try {
        await updateCompany(id, { status: 'archived' });
      } catch (e) {
        console.error('[CRM] bulk archive failed for', id, e);
      }
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    for (const id of ids) {
      try {
        await deleteCompany(id, { preserveRelated: true });
      } catch (e) {
        console.error('[CRM] bulk delete failed for', id, e);
      }
    }
  };

  const handleArchiveCompany = async (company: { id: string; name: string }) => {
    console.log("ARCHIVE DEBUG", company);
    if (!company || typeof company.id !== "string") {
      console.error("Invalid company object", company);
      return;
    }
    try {
      await updateCompany(company.id, { status: 'archived' });
      console.log("[CRM] archive company success", company.id);
      setShowDeleteModal(false);
      setCompanyToDelete(null);
    } catch (error) {
      console.error('[CRM] archive company failed', error);
      const message = error instanceof Error && error.message ? error.message : 'Unable to archive company.';
      setDeleteError(message);
      throw error;
    }
  };

 const handleDeletePermanently = async () => {
 if (!companyToDelete) return;
 try {
 await handleDeleteCompany(companyToDelete.id, { preserveRelated: true });
 setShowDeleteModal(false);
 setCompanyToDelete(null);
 } catch (error) {
 if (import.meta.env.DEV) {
 console.error('[CRM] delete company failed', error);
 }
 const message = error instanceof Error && error.message ? error.message : 'Unable to delete company.';
 setDeleteError(message);
 throw error;
 }
};

 const handleEditPerson = (person: Person) => {
 setEditingPerson(person);
 };

 const handleArchivePerson = async (person: Person) => {
  try {
  await updatePerson(person.id, {
    ...toPersonInput(person),
    status: 'archived',
    archivedAt: new Date().toISOString(),
  });
  } catch (error) {
  console.error('[CRM] archive person failed', error);
  const message = error instanceof Error && error.message ? error.message : 'Unable to archive person.';
  setDeleteError(message);
  throw error;
  }
  };

  const handleRestorePerson = async (person: Person) => {
  try {
  await updatePerson(person.id, {
    ...toPersonInput(person),
    status: 'active',
    archivedAt: null,
  });
  } catch (error) {
  console.error('[CRM] restore person failed', error);
  const message = error instanceof Error && error.message ? error.message : 'Unable to restore person.';
  setDeleteError(message);
  throw error;
  }
  };

  const handleRestoreCompany = async (company: Company) => {
  try {
  await updateCompany(company.id, { status: 'active' as const });
  } catch (error) {
  console.error('[CRM] restore company failed', error);
  const message = error instanceof Error && error.message ? error.message : 'Unable to restore company.';
  setDeleteError(message);
  throw error;
  }
  };

 const handleDeletePerson = async (id: string) => {
 const confirmed = window.confirm('Delete this person permanently?\n\nThis will remove their contact methods. Other linked records will be kept and unlinked.');
 if (!confirmed) return;
 try {
 await deletePerson(id);
 } catch (error) {
 console.error('[CRM] delete person failed', error);
 const message = error instanceof Error && error.message ? error.message : 'Unable to delete person.';
 setDeleteError(message);
 throw error;
 }
 };

 const handleSelectAllPeople = useCallback((ids: string[]) => {
 setSelectedPersonIds((prev) => {
 const next = new Set(prev);
 ids.forEach((id) => next.add(id));
 return next;
 });
 }, []);

 const handleSelectOnePerson = useCallback((id: string, selected: boolean) => {
 setSelectedPersonIds((prev) => {
 const next = new Set(prev);
 if (selected) next.add(id); else next.delete(id);
 return next;
 });
 }, []);

 const handleClearPeopleSelection = useCallback(() => {
 setSelectedPersonIds(new Set());
 }, []);

 const handleBulkArchivePeople = async () => {
 if (selectedPersonIds.size === 0) return;
 const confirmed = window.confirm(`Archive ${selectedPersonIds.size} selected people?`);
 if (!confirmed) return;
 for (const id of selectedPersonIds) {
 try {
 const person = people.find((p) => p.id === id);
 if (!person) continue;
 await updatePerson(id, {
   ...toPersonInput(person),
   status: 'archived',
   archivedAt: new Date().toISOString(),
 });
 } catch (e) {
 console.error('[CRM] bulk archive person failed for', id, e);
 }
 }
 setSelectedPersonIds(new Set());
 };

 const handleBulkDeletePeople = async () => {
 if (selectedPersonIds.size === 0) return;
 const confirmed = window.confirm(
 `Delete ${selectedPersonIds.size} selected people permanently?\n\nThis will remove their contact methods. Other linked records will be kept and unlinked.`
 );
 if (!confirmed) return;
 for (const id of selectedPersonIds) {
 try {
 await deletePerson(id);
 } catch (e) {
 console.error('[CRM] bulk delete person failed for', id, e);
 }
 }
 setSelectedPersonIds(new Set());
 };

  // message and deal handlers removed — tracking system retired

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

  const handlePersonClick = useCallback((personId: string) => {
  setSelectedPersonId(personId);
  setPersonWorkspaceContext('global');
  }, []);

  const handleBackFromPersonWorkspace = useCallback(() => {
  setSelectedPersonId(null);
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

   return (
   <AppDashboardShell
   appName={getShellTitle()}
   sidebarItems={getSidebarItems()}
    activeSection={tab === 'notes' || activeApp === 'notes' ? selectedNoteCategorySlug : activeApp === 'crm' || activeApp === 'messages' ? tab : appSection}
   onSectionChange={handleSectionChange}
   onBackToDesktop={handleBackToDesktop}
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
    addMessage={addMessage}
    updateMessage={updateMessage}
    deleteMessage={deleteMessage}
    addDeal={addDeal}
    updateDeal={updateDeal}
    deleteDeal={deleteDeal}
    addPerson={addPerson}
    updatePerson={updatePerson}
    deletePerson={deletePerson}
    updateCompany={updateCompany}
    deleteCompany={handleDeleteCompany}
    />
  ) : selectedPersonId && personWorkspaceContext === 'global' ? (
  (() => {
  const person = people.find((p) => p.id === selectedPersonId);
  if (!person) return null;
  return (
   <PersonWorkspace
   companies={companies}
   person={person}
   people={people}
   messages={messages}
   deals={deals}
   personContactMethods={personContactMethods}
   onBack={handleBackFromPersonWorkspace}
   onEditPerson={handleEditPerson}
    addPersonContactMethod={addPersonContactMethod}
    updatePersonContactMethod={updatePersonContactMethod}
    deletePersonContactMethod={deletePersonContactMethod}
    addMessage={addMessage}
    updateMessage={updateMessage}
    deleteMessage={deleteMessage}
    addDeal={addDeal}
    updateDeal={updateDeal}
    deleteDeal={deleteDeal}
    onAddMessage={(_personId?: string) => {}}
    onAddDeal={(_personId?: string) => {}}
    updatePerson={updatePerson}
    />
  );
  })()
  ) : (
 <>
   {tab === 'dashboard' && (
   <div className="space-y-5">
   <SectionHeader
   title="Dashboard"
   description="CRM overview and pipeline health."
   actions={
   <Button variant="outline" size="sm" onClick={() => setActiveModal('company')}><Building2 className="h-4 w-4" />Add Company</Button>
   }
   />
   <OpportunitiesDashboard
  companies={companies}
  people={people}
  templateCount={templates.length}
  onAddCompany={() => setActiveModal('company')}
  onAddPerson={() => setActiveModal('person')}
   onOpenCompaniesTab={() => setTab('companies')}
   />
   </div>
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
  onUpdateCompany={updateCompany}
  onBulkArchive={handleBulkArchive}
  onBulkDelete={handleBulkDelete}
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
  onUpdateCompany={updateCompany}
  onBulkArchive={handleBulkArchive}
  onBulkDelete={handleBulkDelete}
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
  onUpdateCompany={updateCompany}
  onBulkArchive={handleBulkArchive}
  onBulkDelete={handleBulkDelete}
  />
  )}

   {/* Outreach Queue removed — tracking system retired */}

  {tab === 'companies' && (
  <div className="space-y-5">
  {(() => {
  const totalCompanies = companies.length;
  const scoredCompanies = companies.filter(c => c.fitScore != null);
  const avgFitScore = scoredCompanies.length > 0
  ? (scoredCompanies.reduce((sum, c) => sum + (c.fitScore || 0), 0) / scoredCompanies.length).toFixed(1)
  : '—';
  const highPriority = companies.filter(c => c.priority === 'high').length;
  const cIds = companies.map(c => c.id);
  const peopleConnected = people.filter(p => p.companyId && cIds.includes(p.companyId)).length;
   const primaryStats = [
   { label: 'Total', value: totalCompanies, color: '' },
   { label: 'Avg Fit Score', value: avgFitScore, color: 'text-blue-600' },
   { label: 'High Priority', value: highPriority, color: 'text-amber-600' },
   { label: 'People Connected', value: peopleConnected, color: '' },
   ];
  return (
  <>
  <div>
  <h2 className="text-xl font-semibold text-neutral-900">All Companies</h2>
  <p className="mt-0.5 text-sm text-neutral-500">Every company record across your CRM pipeline.</p>
  </div>
  <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-blue-50/40 p-3.5">
  <div className="mt-0.5 shrink-0 text-blue-600">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  </svg>
  </div>
  <div className="min-w-0">
  <div className="text-sm font-semibold text-neutral-900">Full CRM pipeline view</div>
  <div className="mt-0.5 text-xs leading-relaxed text-neutral-500">Review all companies, compare segments, and decide the next best action.</div>
  </div>
  </div>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
  {primaryStats.map(stat => (
  <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">{stat.label}</p>
  <p className={`mt-1.5 text-xl font-bold tabular-nums ${stat.color || 'text-neutral-900'}`}>{stat.value}</p>
  </div>
  ))}
  </div>
  <div className="flex flex-wrap justify-end gap-2">
  <Button variant="primary" size="sm" onClick={() => setActiveModal('company')}><Building2 className="h-4 w-4" />Add Company</Button>
  <Button variant="secondary" size="sm" onClick={() => setShowCsvImport(true)}>Import CSV</Button>
  </div>
   <CompaniesTable
   companies={companies}
   onEdit={handleEditCompany}
   onDelete={handleRequestDelete}
   onAIScore={handleAIScore}
   onCompanyClick={handleCompanyClick}
   onUpdateCompany={updateCompany}
   filters={companyFilters}
   onFilterChange={setCompanyFilters}
   onBulkArchive={handleBulkArchive}
   onBulkDelete={handleBulkDelete}
   />
   </>
   );
   })()}
   </div>
   )}

   {tab === 'archived' && (
  <div className="space-y-5">
    <div>
      <h2 className="text-xl font-semibold text-neutral-900">Archived</h2>
      <p className="mt-0.5 text-sm text-neutral-500">Archived CRM records. Restore companies or people when needed.</p>
    </div>

    {/* Sub-tabs */}
    <div className="flex gap-0 border-b border-neutral-200">
      <button
        onClick={() => setArchiveSubTab('companies')}
        className={`relative px-4 py-2 text-sm font-medium transition-colors ${
          archiveSubTab === 'companies'
            ? 'text-neutral-900'
            : 'text-neutral-500 hover:text-neutral-700'
        }`}
      >
        Companies
        {archiveSubTab === 'companies' && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900" />
        )}
      </button>
      <button
        onClick={() => setArchiveSubTab('people')}
        className={`relative px-4 py-2 text-sm font-medium transition-colors ${
          archiveSubTab === 'people'
            ? 'text-neutral-900'
            : 'text-neutral-500 hover:text-neutral-700'
        }`}
      >
        People
        {archiveSubTab === 'people' && (
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-neutral-900" />
        )}
      </button>
    </div>

    {archiveSubTab === 'companies' && (
      <CompaniesTable
        companies={companies.filter(c => c.status === 'archived')}
        onEdit={handleEditCompany}
        onDelete={handleRequestDelete}
        onAIScore={handleAIScore}
        onCompanyClick={handleCompanyClick}
        onUpdateCompany={updateCompany}
        onBulkArchive={handleBulkArchive}
        onBulkDelete={handleBulkDelete}
        onRestore={handleRestoreCompany}
      />
    )}

    {archiveSubTab === 'people' && (
      <div>
        {people.filter(p => p.status === 'archived').length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-8 text-center">
            <p className="text-sm text-neutral-500">No archived people.</p>
          </div>
        ) : (
          <div className="rounded-xl border border-neutral-200 bg-white overflow-x-auto">
            <table className="min-w-[960px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200 text-xs font-medium text-neutral-500">
                  <th className="w-10 px-2 py-3 text-center">
                    <input
                      type="checkbox"
                      checked={people.filter(p => p.status === 'archived').length > 0 && selectedArchivedPersonIds.size === people.filter(p => p.status === 'archived').length}
                      onChange={() => {
                        const archived = people.filter(p => p.status === 'archived');
                        if (selectedArchivedPersonIds.size === archived.length) {
                          setSelectedArchivedPersonIds(new Set());
                        } else {
                          setSelectedArchivedPersonIds(new Set(archived.map((p) => p.id)));
                        }
                      }}
                      className="h-4 w-4 cursor-pointer rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 font-medium">Person</th>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Relation</th>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Phone</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Archived</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {people.filter(p => p.status === 'archived').map((person) => {
                  const company = companies.find((c) => c.id === person.companyId);
                  const isSelected = selectedArchivedPersonIds.has(person.id);
                  return (
                    <tr
                      key={person.id}
                      className={`border-b border-neutral-100 transition-colors hover:bg-neutral-50 cursor-pointer ${isSelected ? 'bg-blue-50/50' : ''}`}
                      onClick={() => handlePersonClick(person.id)}
                    >
                      <td className="w-10 px-2 py-3.5 align-top text-center" onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {
                            setSelectedArchivedPersonIds((prev) => {
                              const next = new Set(prev);
                              if (next.has(person.id)) next.delete(person.id); else next.add(person.id);
                              return next;
                            });
                          }}
                          className="h-4 w-4 cursor-pointer rounded border-neutral-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <button
                          onClick={(e) => { e.stopPropagation(); handlePersonClick(person.id); }}
                          className="font-medium text-neutral-900 hover:text-blue-600 transition-colors"
                        >
                          {person.fullName}
                        </button>
                      </td>
                      <td className="px-4 py-3.5 align-top text-sm text-neutral-700">
                        <div className="max-w-[140px] truncate">{company?.name || 'Not added yet'}</div>
                      </td>
                      <td className="px-4 py-3.5 align-top text-sm text-neutral-700">
                        {person.role || 'Not added yet'}
                      </td>
                      <td className="px-4 py-3.5 align-top text-sm text-neutral-700">
                        {person.relationType ? (
                          <span className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs text-neutral-600">{person.relationType}</span>
                        ) : 'Not added yet'}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        {person.emailPublic || person.linkedin || person.contactChannel ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-xs font-medium text-green-700">Known</span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-medium text-neutral-500">Unknown</span>
                        )}
                      </td>
                      <td className="px-4 py-3.5 align-top text-sm text-neutral-700">
                        {person.phone || 'Not added yet'}
                      </td>
                      <td className="px-4 py-3.5 align-top text-sm text-neutral-700">
                        {person.emailPublic || 'Not added yet'}
                      </td>
                      <td className="px-4 py-3.5 align-top text-xs text-neutral-500">
                        {person.archivedAt ? new Date(person.archivedAt).toLocaleDateString() : 'Not added yet'}
                      </td>
                      <td className="px-4 py-3.5 align-top">
                        <div className="inline-flex items-center justify-end gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRestorePerson(person).then(() => { setSelectedArchivedPersonIds((prev) => { const next = new Set(prev); next.delete(person.id); return next; }); }); }}
                            className="rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white transition-colors hover:bg-green-700"
                          >
                            Restore
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePersonClick(person.id); }}
                            className="rounded-md px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                          >
                            Open
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleEditPerson(person); }}
                            className="rounded-md px-2.5 py-1 text-xs font-medium text-neutral-600 transition-colors hover:bg-neutral-100 hover:text-neutral-900"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}
  </div>
  )}

  {tab === 'people' && (
  <div className="space-y-5">
  {(() => {
  const totalPeople = people.length;
  const withContactMethod = people.filter(p => p.emailPublic || p.linkedin || p.contactChannel || p.phone).length;
  const companiesConnected = new Set(people.map(p => p.companyId).filter(Boolean)).size;
  const strategicRelations = people.filter(p => p.relationType === 'strategic').length;
  const strongRelations = people.filter(p => p.relationType === 'strong').length;
  const archivedCount = people.filter(p => p.status === 'archived').length;
  const peopleStats = [
  { label: 'Total People', value: totalPeople, color: '' },
  { label: 'With Contact', value: withContactMethod, color: 'text-emerald-600' },
  { label: 'Companies Connected', value: companiesConnected, color: '' },
  { label: 'Strategic Relations', value: strategicRelations, color: 'text-violet-600' },
  { label: 'Strong Relations', value: strongRelations, color: 'text-blue-600' },
  ...(personFilters.status === 'archived' || archivedCount > 0 ? [{ label: 'Archived', value: archivedCount, color: '' }] : []),
  ];
  return (
  <>
  <div>
  <h2 className="text-xl font-semibold text-neutral-900">People</h2>
  <p className="mt-0.5 text-sm text-neutral-500">Contacts, decision makers, and relationship context.</p>
  </div>
  <div className="flex items-start gap-3 rounded-xl border border-neutral-200 bg-blue-50/40 p-3.5">
  <div className="mt-0.5 shrink-0 text-blue-600">
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
  </svg>
  </div>
  <div className="min-w-0">
  <div className="text-sm font-semibold text-neutral-900">Relationship intelligence</div>
  <div className="mt-0.5 text-xs leading-relaxed text-neutral-500">Track decision makers, contact options, follow-ups, and outreach context.</div>
  </div>
  </div>
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
  {peopleStats.map(stat => (
  <div key={stat.label} className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">{stat.label}</p>
  <p className={`mt-1.5 text-xl font-bold tabular-nums ${stat.color || 'text-neutral-900'}`}>{stat.value}</p>
  </div>
  ))}
  </div>
  <div className="flex flex-wrap justify-end gap-2">
  <Button variant="primary" size="sm" onClick={() => setActiveModal('person')}><UserPlus className="h-4 w-4" />Add Person</Button>
  <Button variant="secondary" size="sm" onClick={() => setShowPeopleImport(true)}>Import CSV</Button>
  </div>
  <PeopleTable
  people={people}
  selectedPersonIds={selectedPersonIds}
  onSelectAll={handleSelectAllPeople}
  onSelectOne={handleSelectOnePerson}
  onClearSelection={handleClearPeopleSelection}
  onBulkArchive={handleBulkArchivePeople}
  onBulkDelete={handleBulkDeletePeople}
  onEdit={handleEditPerson}
  onArchive={handleArchivePerson}
  onDelete={handleDeletePerson}
  onPersonClick={handlePersonClick}
   personContactMethods={personContactMethods}
   filters={personFilters}
  onFilterChange={setPersonFilters}
  />
  </>
  );
  })()}
  </div>
  )}

   {/* Messages page removed — tracking system retired */}

   {/* Deals page removed — deal tracking retired from CRM UI */}

 {tab === 'relationships' && (
  <div className="space-y-5">
   <SectionHeader
    title="Relationships"
    description="Professional connections, interactions, and relationship management."
    actions={
     <Button variant="primary" size="sm" onClick={() => addRelationship()}><Heart className="h-4 w-4" />Add Relationship</Button>
    }
   />
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
  </div>
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
 onAddSmartNote={addSmartNote}
 onUpdateSmartNote={updateSmartNote}
 onDeleteSmartNote={deleteSmartNote}
 onAddNoteAttachment={addNoteAttachment}
 onUpdateNoteAttachment={updateNoteAttachment}
 onDeleteNoteAttachment={deleteNoteAttachment}
 onAddNoteBlock={addNoteBlock}
 onUpdateNoteBlock={updateNoteBlock}
 onDeleteNoteBlock={deleteNoteBlock}
 selectedCategorySlug={selectedNoteCategorySlug}
 />
  )}

  {tab === 'projects' && (
  <div className="space-y-5">
   <SectionHeader
    title="Projects"
    description="Project management, tracking, and deliverables."
    actions={
     <Button variant="primary" size="sm" onClick={() => setActiveModal('project')}><Target className="h-4 w-4" />Add Project</Button>
    }
   />
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
  </div>
  )}

   {tab === 'message_examples' && (
   <div className="space-y-5">
    <MessageExamplesPanel
    templates={templates}
    onAddTemplate={addTemplate}
    onUpdateTemplate={updateTemplate}
    onDeleteTemplate={deleteTemplate}
    />
   </div>
   )}

  {tab === 'lead_research' && (
   <LeadResearchPlaybook />
  )}

  {tab === 'strategy' && (
   <div className="space-y-5">
    <SectionHeader
     title="Strategy"
     description="Strategic goals, objectives, and progress tracking."
     actions={
      <Button variant="primary" size="sm" onClick={() => addStrategyGoal()}><Target className="h-4 w-4" />Add Goal</Button>
     }
    />
    <StrategyPanel
  section={appSection}
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
  </div>
  )}

  {tab === 'plans' && (
   <div className="space-y-5">
    <SectionHeader
     title="Plans"
     description="Yearly, monthly, weekly planning and execution structure."
     actions={
      <Button variant="primary" size="sm" onClick={() => addPlan()}><Calendar className="h-4 w-4" />Add Plan</Button>
     }
    />
    <PlansPanel
  plans={plans}
  planItems={planItems}
  projects={projects}
  strategyGoals={strategyGoals}
  section={appSection}
  onAddPlan={addPlan}
  onUpdatePlan={updatePlan}
  onDeletePlan={deletePlan}
onAddPlanItem={addPlanItem}
  />
  </div>
  )}

  {tab === 'tasks' && (
  <div className="space-y-5">
   <SectionHeader
    title="Tasks"
    description="Task management, tracking, and weekly reviews."
   />
   <TasksPanel
  tasks={tasks}
  recurringTasks={recurringTasks}
  projects={projects}
  plans={plans}
  strategyGoals={strategyGoals}
  companies={companies}
  people={people}
  generatedDocuments={generatedDocuments}
  section={appSection}
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
  </div>
  )}


 {tab === 'finance' && (
   <div className="space-y-5">
    <SectionHeader
     title="Finance"
     description="Income, expenses, investments, and financial planning."
    />
    <FinancePanel
  section={appSection}
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
  </div>
  )}

 {tab === 'documents' && (
   <div className="space-y-5">
    <SectionHeader
     title="Documents"
     description="Document generation, templates, branding, and invoices."
    />
    <DocumentStudioPanel
  section={appSection}
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
  </div>
  )}

 {tab === 'ai-control' && (
   <div className="space-y-5">
    <SectionHeader
     title="AI Control"
     description="AI provider keys, use case settings, and model configuration."
    />
    <AIControlPanel
  section={appSection}
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
  </div>
  )}

  {tab === 'social' && (
    <SocialMediaPanel
  section={appSection}
   socialPlatforms={socialPlatforms}
   socialPeople={socialPeople}
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
  onAddSocialPerson={addSocialPerson}
  onUpdateSocialPerson={updateSocialPerson}
  onDeleteSocialPerson={deleteSocialPerson}
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
  socialWeeklySystems={socialWeeklySystems}
  activeSocialWeeklySystem={activeSocialWeeklySystem}
  onAddSocialWeeklySystem={addSocialWeeklySystem}
  onUpdateSocialWeeklySystem={updateSocialWeeklySystem}
  onDeleteSocialWeeklySystem={deleteSocialWeeklySystem}
   onEnsureDefaultSocialWeeklySystem={ensureDefaultSocialWeeklySystem}
   socialWeeklyTasks={socialWeeklyTasks}
   onAddSocialWeeklyTask={addSocialWeeklyTask}
   onUpdateSocialWeeklyTask={updateSocialWeeklyTask}
   onDeleteSocialWeeklyTask={deleteSocialWeeklyTask}
    />
  )}

 {tab === 'life' && (
   <div className="space-y-5">
    <SectionHeader
     title="Life Management"
     description="Nutrition, fitness, deen, family, and weekly reviews."
    />
    <LifeManagementPanel
  section={appSection}
  lifeNutritionLogs={lifeNutritionLogs}
  lifeFitnessLogs={lifeFitnessLogs}
  lifeDeenLogs={lifeDeenLogs}
  lifeFamilyActions={lifeFamilyActions}
  lifeWeeklyReviews={lifeWeeklyReviews}
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
  </div>
  )}
 </>)}
 </div>

 {noteCategoryActionError ? (
 <div className="fixed right-6 top-6 z-[999] rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 shadow-none">
 {noteCategoryActionError}
 </div>
 ) : null}

 {noteCategoryEditor ? (
 <OpportunityModal
 title={noteCategoryEditor.mode === 'edit' ? 'Edit Note Category' : 'Add Note Category'}
 onClose={() => setNoteCategoryEditor(null)}
 >
 <div className="space-y-4">
 <NoteCategoryForm
 initialData={noteCategoryEditor.category}
 onSubmit={handleSubmitNoteCategory}
 onCancel={() => setNoteCategoryEditor(null)}
 submitLabel={noteCategoryEditor.mode === 'edit' ? 'Save Category' : 'Create Category'}
 />
 {noteCategoryEditor.mode === 'edit' && noteCategoryEditor.category && !protectedCategorySlugSet.has(noteCategoryEditor.category.slug) ? (
 <div className="flex justify-end pt-1">
 <Button
 variant="ghost"
 size="sm"
 onClick={() => handleDeleteNoteCategory(noteCategoryEditor.category!)}
 className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
 >
 Delete Category
 </Button>
 </div>
 ) : null}
 </div>
 </OpportunityModal>
 ) : null}

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
 const { category, fitScore, ethicalFit, status, nextAction, ...allowedUpdate } = input;
 const savedCompany = await updateCompany(editingCompany.id, allowedUpdate);
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

 {/* Message modals removed — tracking system retired */}

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

 {/* Deal modals removed — deal tracking retired */}

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

 {/* OutreachTemplateModal removed — tracking system retired */}

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

 {showDeleteModal && companyToDelete ? (
 <DeleteCompanyModal
 isOpen={showDeleteModal}
  company={companyToDelete}
 onClose={() => { setShowDeleteModal(false); setCompanyToDelete(null); }}
 onArchive={handleArchiveCompany}
 onDeletePermanently={handleDeletePermanently}
 />
 ) : null}

 {deleteError ? (
 <OpportunityModal title="Error" onClose={() => setDeleteError(null)}>
 <p className="text-sm leading-6 text-neutral-700">{deleteError}</p>
 <div className="mt-6">
 <Button variant="primary" size="md" onClick={() => setDeleteError(null)}>OK</Button>
 </div>
 </OpportunityModal>
 ) : null}
  </AppDashboardShell>
  );
};

export default OpportunitiesLayout;