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
  ethicalFit?: 'low' | 'medium' | 'high';
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
  replyStatus?: 'none' | 'replied' | 'bounced';
  replySummary?: string;
  nextFollowUpDate?: string;
  status?: 'sent' | 'scheduled' | 'failed';
}

export interface Deal {
  id: string;
  companyId?: string;
  companyName?: string;
  personName?: string;
  servicePackage?: string;
  problem?: string;
  proposedSolution?: string;
  value?: number;
  currency?: string;
  stage?: string;
  probability?: number;
  notes?: string;
}

export interface StrategyNote {
  id: string;
  section: string;
  title: string;
  content: string;
  priority?: 'low' | 'medium' | 'high';
}

export type OpportunitiesTab = 'dashboard' | 'companies' | 'people' | 'messages' | 'deals' | 'strategy';
