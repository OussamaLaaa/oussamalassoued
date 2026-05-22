import { useCallback, useEffect, useState } from 'react';
import seedData from '../data/opportunitiesSeed';
import type {
  OpportunitiesData,
  CompanyInput,
  PersonInput,
  MessageInput,
  DealInput,
  Company,
  Person,
  OutreachMessage,
  Deal,
} from '../types/opportunities';

const API_ENDPOINT = '/api/opportunities';

const cloneSeedData = (): OpportunitiesData => ({
  companies: seedData.companies.map((item) => ({ ...item })),
  people: seedData.people.map((item) => ({ ...item })),
  messages: seedData.messages.map((item) => ({ ...item })),
  deals: seedData.deals.map((item) => ({ ...item })),
  strategyNotes: seedData.strategyNotes.map((item) => ({ ...item })),
});

const safeString = (value: unknown) => (typeof value === 'string' ? value : value == null ? '' : String(value));
const safeNumber = (value: unknown) => (typeof value === 'number' ? value : Number.isFinite(Number(value)) ? Number(value) : undefined);

const toIso = (value: unknown) => {
  if (!value) return undefined;
  if (typeof value === 'string') return value;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
};

const getRowRefId = (row: any, snakeKey: string, camelKey: string) => row?.[snakeKey] ?? row?.[camelKey];

const mapCompanyRow = (row: any): Company => ({
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

const mapPersonRow = (row: any, companyName?: string): Person => ({
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

const mapMessageRow = (row: any, companyName?: string, personName?: string): OutreachMessage => ({
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

const mapDealRow = (row: any, companyName?: string, personName?: string): Deal => ({
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

const toCompanyDb = (input: CompanyInput) => ({
  name: input.name.trim(),
  database_type: input.databaseType,
  category: input.category,
  industry: input.industry,
  country: input.country,
  city: input.city,
  website: input.website,
  linkedin: input.linkedin,
  priority: input.priority,
  fit_score: input.fitScore,
  ethical_fit: input.ethicalFit,
  status: input.status,
  next_action: input.nextAction,
  notes: input.notes,
});

const toPersonDb = (input: PersonInput) => ({
  company_id: input.companyId,
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
  next_followup_date: input.nextFollowUpDate,
  notes: input.notes,
});

const toMessageDb = (input: MessageInput) => ({
  company_id: input.companyId,
  person_id: input.personId,
  channel: input.channel,
  language: input.language,
  message_type: input.messageType,
  message_text: input.messageText,
  sent_date: input.sentDate,
  reply_status: input.replyStatus,
  reply_summary: input.replySummary,
  next_followup_date: input.nextFollowUpDate,
  status: input.status,
});

const toDealDb = (input: DealInput) => ({
  company_id: input.companyId,
  person_id: input.personId,
  service_package: input.servicePackage,
  problem: input.problem,
  proposed_solution: input.proposedSolution,
  value: input.value,
  currency: input.currency,
  stage: input.stage,
  probability: typeof input.probability === 'number' ? input.probability / 100 : undefined,
  notes: input.notes,
});

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

const loadFromApi = async () => {
  const response = await fetch(API_ENDPOINT, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`Failed to load Opportunities data (${response.status})`);
  }

  return response.json();
};

export const useOpportunitiesData = () => {
  const [companies, setCompanies] = useState<Company[]>(() => cloneSeedData().companies);
  const [people, setPeople] = useState<Person[]>(() => cloneSeedData().people);
  const [messages, setMessages] = useState<OutreachMessage[]>(() => cloneSeedData().messages);
  const [deals, setDeals] = useState<Deal[]>(() => cloneSeedData().deals);
  const [strategyNotes] = useState(() => cloneSeedData().strategyNotes);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const applyPayload = useCallback((payload: any) => {
    const nextCompanies = Array.isArray(payload?.companies) ? payload.companies.map(mapCompanyRow) : [];
    const nextPeopleRaw = Array.isArray(payload?.people) ? payload.people : [];
    const nextMessagesRaw = Array.isArray(payload?.messages) ? payload.messages : [];
    const nextDealsRaw = Array.isArray(payload?.deals) ? payload.deals : [];

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

    const derived = getDerivedCollections(nextCompanies, nextPeople, nextMessages, nextDeals);

    setCompanies(nextCompanies);
    setPeople(derived.people);
    setMessages(derived.messages);
    setDeals(derived.deals);
  }, []);

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      setLoading(true);
      setError(null);

      try {
        const payload = await loadFromApi();
        if (!mounted) return;
        applyPayload(payload);
      } catch (apiError) {
        console.error('[Opportunities] Failed to load from /api/opportunities, falling back to seed data.', apiError);
        if (!mounted) return;
        const fallback = cloneSeedData();
        setCompanies(fallback.companies);
        setPeople(fallback.people);
        setMessages(fallback.messages);
        setDeals(fallback.deals);
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
  }, [applyPayload]);

  const syncInsert = async (entity: 'companies' | 'people' | 'messages' | 'deals', data: Record<string, unknown>) => {
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity, action: 'insert', data }),
    });

    const result = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(result?.error || 'Failed to save Opportunities data.');
    }

    return result?.row;
  };

  const addCompany = async (input: CompanyInput) => {
    const row = await syncInsert('companies', toCompanyDb(input));
    const next = mapCompanyRow(row);
    setCompanies((current) => [next, ...current]);
    return next;
  };

  const addPerson = async (input: PersonInput) => {
    const row = await syncInsert('people', toPersonDb(input));
    const companyId = getRowRefId(row, 'company_id', 'companyId');
    const companyName = companies.find((company) => company.id === companyId)?.name;
    const next = mapPersonRow(row, companyName);
    setPeople((current) => [next, ...current]);
    return next;
  };

  const addMessage = async (input: MessageInput) => {
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
    const row = await syncInsert('deals', toDealDb(input));
    const companyId = getRowRefId(row, 'company_id', 'companyId');
    const personId = getRowRefId(row, 'person_id', 'personId');
    const companyName = companies.find((company) => company.id === companyId)?.name;
    const personName = people.find((person) => person.id === personId)?.fullName;
    const next = mapDealRow(row, companyName, personName);
    setDeals((current) => [next, ...current]);
    return next;
  };

  const resetToSeedData = () => {
    console.warn('Database reset is not implemented yet.');
    const fallback = cloneSeedData();
    setCompanies(fallback.companies);
    setPeople(fallback.people);
    setMessages(fallback.messages);
    setDeals(fallback.deals);
  };

  return {
    companies,
    people,
    messages,
    deals,
    strategyNotes,
    addCompany,
    addPerson,
    addMessage,
    addDeal,
    resetToSeedData,
    loading,
    error,
  };
};

export default useOpportunitiesData;
  Company,
  Person,
  OutreachMessage,
  Deal,
} from '../types/opportunities';

const STORAGE_KEY = 'opportunities-os-data';

const cloneSeedData = (): OpportunitiesData => ({
  companies: seedData.companies.map((item) => ({ ...item })),
  people: seedData.people.map((item) => ({ ...item })),
  messages: seedData.messages.map((item) => ({ ...item })),
  deals: seedData.deals.map((item) => ({ ...item })),
  strategyNotes: seedData.strategyNotes.map((item) => ({ ...item })),
});

const safeParse = (value: string | null): OpportunitiesData | null => {
  if (!value) return null;

  try {
    const parsed = JSON.parse(value) as Partial<OpportunitiesData>;
    if (!parsed || typeof parsed !== 'object') return null;

    return {
      companies: Array.isArray(parsed.companies) ? (parsed.companies as Company[]) : [],
      people: Array.isArray(parsed.people) ? (parsed.people as Person[]) : [],
      messages: Array.isArray(parsed.messages) ? (parsed.messages as OutreachMessage[]) : [],
      deals: Array.isArray(parsed.deals) ? (parsed.deals as Deal[]) : [],
      strategyNotes: Array.isArray(parsed.strategyNotes) ? parsed.strategyNotes : cloneSeedData().strategyNotes,
    };
  } catch {
    return null;
  }
};

const loadInitialData = (): OpportunitiesData => {
  if (typeof window === 'undefined') return cloneSeedData();

  try {
    const stored = safeParse(window.localStorage.getItem(STORAGE_KEY));
    if (stored) return stored;
  } catch {
    // ignore and fallback to seed data
  }

  return cloneSeedData();
};

const saveData = (data: OpportunitiesData) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore write errors for MVP
  }
};

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

export const useOpportunitiesData = () => {
  const [data, setData] = useState<OpportunitiesData>(() => loadInitialData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const companiesById = useMemo(() => {
    const map = new Map<string, Company>();
    data.companies.forEach((company) => map.set(company.id, company));
    return map;
  }, [data.companies]);

  const peopleById = useMemo(() => {
    const map = new Map<string, Person>();
    data.people.forEach((person) => map.set(person.id, person));
    return map;
  }, [data.people]);

  const addCompany = (input: CompanyInput) => {
    const next: Company = {
      id: createId('company'),
      name: input.name.trim(),
      databaseType: input.databaseType,
      category: input.category,
      industry: input.industry,
      country: input.country,
      city: input.city,
      website: input.website,
      linkedin: input.linkedin,
      priority: input.priority,
      fitScore: input.fitScore,
      ethicalFit: input.ethicalFit as Company['ethicalFit'],
      status: input.status,
      nextAction: input.nextAction,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };

    setData((current) => ({ ...current, companies: [next, ...current.companies] }));
    return next;
  };

  const addPerson = (input: PersonInput) => {
    const company = input.companyId ? companiesById.get(input.companyId) : undefined;
    const next: Person = {
      id: createId('person'),
      companyId: input.companyId,
      companyName: company?.name,
      fullName: input.fullName.trim(),
      role: input.role,
      department: input.department,
      seniority: input.seniority,
      decisionPower: input.decisionPower === 'high' ? 8 : input.decisionPower === 'medium' ? 5 : input.decisionPower === 'low' ? 2 : undefined,
      influencePower: input.influencePower === 'high' ? 8 : input.influencePower === 'medium' ? 5 : input.influencePower === 'low' ? 2 : undefined,
      relevance: input.relevance === 'high' ? 9 : input.relevance === 'medium' ? 6 : input.relevance === 'low' ? 3 : undefined,
      linkedin: input.linkedin,
      emailPublic: input.emailPublic,
      contactChannel: input.contactChannel,
      relationshipStatus: input.relationshipStatus,
      nextFollowUpDate: input.nextFollowUpDate,
      notes: input.notes,
    };

    setData((current) => ({ ...current, people: [next, ...current.people] }));
    return next;
  };

  const addMessage = (input: MessageInput) => {
    const company = input.companyId ? companiesById.get(input.companyId) : undefined;
    const person = input.personId ? peopleById.get(input.personId) : undefined;

    const next: OutreachMessage = {
      id: createId('message'),
      companyId: input.companyId,
      companyName: company?.name,
      personId: input.personId,
      personName: person?.fullName,
      channel: input.channel,
      language: input.language,
      messageType: input.messageType,
      messageText: input.messageText,
      sentDate: input.sentDate || new Date().toISOString(),
      replyStatus: input.replyStatus,
      replySummary: input.replySummary,
      nextFollowUpDate: input.nextFollowUpDate,
      status: input.status,
    };

    setData((current) => ({ ...current, messages: [next, ...current.messages] }));
    return next;
  };

  const addDeal = (input: DealInput) => {
    const company = input.companyId ? companiesById.get(input.companyId) : undefined;
    const person = input.personId ? peopleById.get(input.personId) : undefined;

    const next: Deal = {
      id: createId('deal'),
      companyId: input.companyId,
      companyName: company?.name,
      personName: person?.fullName,
      servicePackage: input.servicePackage,
      problem: input.problem,
      proposedSolution: input.proposedSolution,
      value: typeof input.value === 'number' ? input.value : undefined,
      currency: input.currency,
      stage: input.stage,
      probability: typeof input.probability === 'number' ? input.probability / 100 : undefined,
      notes: input.notes,
    };

    setData((current) => ({ ...current, deals: [next, ...current.deals] }));
    return next;
  };

  const resetToSeedData = () => {
    setData(cloneSeedData());
  };

  return {
    companies: data.companies,
    people: data.people,
    messages: data.messages,
    deals: data.deals,
    strategyNotes: data.strategyNotes,
    addCompany,
    addPerson,
    addMessage,
    addDeal,
    resetToSeedData,
  };
};

export default useOpportunitiesData;