export interface ParsedPeopleCsvRow {
  companyName: string;
  fullName: string;
  role?: string;
  department?: string;
  seniority?: string;
  decisionPower?: string;
  influencePower?: string;
  relevance?: string;
  linkedin?: string;
  emailPublic?: string;
  contactChannel?: string;
  relationshipStatus?: string;
  nextFollowUpDate?: string;
  notes?: string;
}

export interface ParsePeopleCsvResult {
  rows: ParsedPeopleCsvRow[];
  skippedNoFullName: number;
  skippedNoCompanyName: number;
  errors: string[];
}

const headerGroups = {
  companyName: ['company name', 'company_name', 'company'],
  fullName: ['full name', 'full_name', 'name', 'person name', 'person_name'],
  role: ['role', 'job title', 'job_title', 'title'],
  department: ['department'],
  seniority: ['seniority', 'experience'],
  decisionPower: ['decision power', 'decision_power', 'decisionpower'],
  influencePower: ['influence power', 'influence_power', 'influencepower'],
  relevance: ['relevance'],
  linkedin: ['linkedin', 'linkedin profile', 'linkedin_profile'],
  emailPublic: ['email', 'public email', 'email_public'],
  contactChannel: ['contact channel', 'contact_channel'],
  relationshipStatus: ['relationship status', 'relationship_status'],
  nextFollowUpDate: ['next follow-up date', 'next_followup_date', 'follow-up date', 'followup_date'],
  notes: ['notes'],
} as const;

const normalizeText = (value: string) => value.trim().toLowerCase();

const normalizeValue = (value: string | undefined) => {
  if (value == null) return '';
  return value.trim();
};

const splitCsvLine = (line: string) => {
  const cells: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === ',' && !inQuotes) {
      cells.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
};

const getHeaderIndex = (headers: string[], aliases: readonly string[]) => {
  const normalizedHeaders = headers.map(normalizeText);
  return normalizedHeaders.findIndex((header) => aliases.includes(header));
};

const toNormalizedSelection = (value: string | undefined, allowed: string[], fallback: string) => {
  const normalized = normalizeText(value || '');
  if (!normalized) return fallback;
  const match = allowed.find((candidate) => candidate === normalized);
  return match || fallback;
};

export const parsePeopleCsv = (text: string): ParsePeopleCsvResult => {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (lines.length < 2) {
    return {
      rows: [],
      skippedNoFullName: 0,
      skippedNoCompanyName: 0,
      errors: ['CSV must have a header row and at least one data row.'],
    };
  }

  const headers = splitCsvLine(lines[0]);
  const indices = {
    companyName: getHeaderIndex(headers, headerGroups.companyName),
    fullName: getHeaderIndex(headers, headerGroups.fullName),
    role: getHeaderIndex(headers, headerGroups.role),
    department: getHeaderIndex(headers, headerGroups.department),
    seniority: getHeaderIndex(headers, headerGroups.seniority),
    decisionPower: getHeaderIndex(headers, headerGroups.decisionPower),
    influencePower: getHeaderIndex(headers, headerGroups.influencePower),
    relevance: getHeaderIndex(headers, headerGroups.relevance),
    linkedin: getHeaderIndex(headers, headerGroups.linkedin),
    emailPublic: getHeaderIndex(headers, headerGroups.emailPublic),
    contactChannel: getHeaderIndex(headers, headerGroups.contactChannel),
    relationshipStatus: getHeaderIndex(headers, headerGroups.relationshipStatus),
    nextFollowUpDate: getHeaderIndex(headers, headerGroups.nextFollowUpDate),
    notes: getHeaderIndex(headers, headerGroups.notes),
  };

  if (indices.companyName === -1 && indices.fullName === -1) {
    return {
      rows: [],
      skippedNoFullName: 0,
      skippedNoCompanyName: 0,
      errors: ['CSV must contain at least Company Name and Full Name columns.'],
    };
  }

  const rows: ParsedPeopleCsvRow[] = [];
  let skippedNoFullName = 0;
  let skippedNoCompanyName = 0;

  for (let rowIndex = 1; rowIndex < lines.length; rowIndex += 1) {
    const values = splitCsvLine(lines[rowIndex]);
    const readValue = (index: number) => normalizeValue(index >= 0 ? values[index] : undefined);

    const companyName = readValue(indices.companyName);
    const fullName = readValue(indices.fullName);

    if (!fullName) {
      skippedNoFullName += 1;
      continue;
    }

    if (!companyName) {
      skippedNoCompanyName += 1;
      continue;
    }

    rows.push({
      companyName,
      fullName,
      role: readValue(indices.role) || undefined,
      department: readValue(indices.department) || undefined,
      seniority: readValue(indices.seniority) || undefined,
      decisionPower: toNormalizedSelection(readValue(indices.decisionPower), ['high', 'medium', 'low', 'unknown'], 'unknown'),
      influencePower: toNormalizedSelection(readValue(indices.influencePower), ['high', 'medium', 'low', 'unknown'], 'unknown'),
      relevance: toNormalizedSelection(readValue(indices.relevance), ['high', 'medium', 'low'], 'medium'),
      linkedin: readValue(indices.linkedin) || undefined,
      emailPublic: readValue(indices.emailPublic) || undefined,
      contactChannel: readValue(indices.contactChannel) || 'LinkedIn',
      relationshipStatus: readValue(indices.relationshipStatus) || 'No Contact',
      nextFollowUpDate: readValue(indices.nextFollowUpDate) || undefined,
      notes: readValue(indices.notes) || undefined,
    });
  }

  return {
    rows,
    skippedNoFullName,
    skippedNoCompanyName,
    errors: [],
  };
};
