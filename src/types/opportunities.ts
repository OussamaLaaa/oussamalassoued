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

export interface OpportunitiesData {
  companies: Company[];
  people: Person[];
  messages: OutreachMessage[];
  deals: Deal[];
  strategyNotes: StrategyNote[];
}

export interface StrategyNote {
  id: string;
  section: string;
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
}

export type OpportunitiesTab = 'dashboard' | 'companies' | 'people' | 'messages' | 'deals' | 'strategy';
