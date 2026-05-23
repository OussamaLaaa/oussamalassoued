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
  strategyNotes: seedData.strategyNotes.map((item) => ({ ...item })),
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
    const nextStrategyItemsRaw = Array.isArray(payload?.strategy_items) ? payload.strategy_items : [];

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

  const syncDelete = async (entity: 'companies' | 'people' | 'messages' | 'deals' | 'projects' | 'message_templates' | 'project_tasks' | 'project_time_logs' | 'project_meetings' | 'project_documents' | 'project_finance_items' | 'strategy_items', id: string) => {
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
    setStrategyItems((current) => attachStrategyLinkNames(current, projects, companies, people));
  }, [projects, companies, people]);

  const resetToSeedData = () => {
    console.warn('Database reset is not implemented yet.');
    const fallback = cloneSeedData();
    setCompanies(fallback.companies);
    setPeople(fallback.people);
    setMessages(fallback.messages);
    setDeals(fallback.deals);
    setTemplates(fallback.templates);
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
    strategyNotes,
    importCompaniesBatch,
    addCompany,
    addPerson,
    addMessage,
    addDeal,
    addProject,
    addStrategyItem,
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