import { GoogleGenAI } from '@google/genai';

const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const ALLOWED_LANGUAGES = new Set(['english', 'french', 'arabic']);
const ALLOWED_TONES = new Set(['professional', 'friendly', 'concise']);
const ALLOWED_LENGTHS = new Set(['short', 'medium']);
const MAX_TEMPLATE_LENGTH = 4000;
const MAX_OBSERVATION_LENGTH = 500;

const readBody = (req) => {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  if (typeof req.body === 'object') return req.body;
  return {};
};

const toSafeJson = (res, status, body) => res.status(status).json(body);

const parseCookies = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};
  return cookieHeader.split(';').reduce((accumulator, part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) return accumulator;
    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (key) accumulator[key] = value;
    return accumulator;
  }, {});
};

const isAuthenticated = (req) => {
  const cookies = parseCookies(req.headers?.cookie);
  return cookies[COOKIE_NAME] === COOKIE_VALUE;
};

const toCleanString = (value) => (value == null ? '' : String(value).trim());

const truncate = (value, maxLength) => (value.length > maxLength ? value.slice(0, maxLength) : value);

const stripMarkdownFences = (value) => value.replace(/^```(?:[a-zA-Z]+)?\s*/g, '').replace(/\s*```$/g, '');

const stripOuterQuotes = (value) => {
  const trimmed = value.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
};

const hasDocumentArtifacts = (value) => /(^|\b)(Seite|Page |পৃষ্ঠা|von |document)(\b|$)/i.test(value);

const isClearlyInvalidOutput = (value, language) => {
  if (!value || value.length < 20) return true;
  if (/^(\{|\[)/.test(value.trim())) return true;
  if (language !== 'arabic' && /[A-Za-z]/.test(value) && /\b(Seite|Page|document|von)\b/i.test(value)) return true;
  if (language !== 'french' && /\b(Bonjour|Cordialement|Merci)\b/i.test(value) && language === 'english') {
    return false;
  }
  return hasDocumentArtifacts(value);
};

const normalizeLanguage = (value) => {
  const language = toCleanString(value).toLowerCase();
  return ALLOWED_LANGUAGES.has(language) ? language : '';
};

const normalizeTone = (value) => {
  const tone = toCleanString(value).toLowerCase();
  return ALLOWED_TONES.has(tone) ? tone : 'professional';
};

const normalizeLength = (value) => {
  const length = toCleanString(value).toLowerCase();
  return ALLOWED_LENGTHS.has(length) ? length : 'short';
};

const normalizePerson = (person) => ({
  fullName: truncate(toCleanString(person?.fullName), 200),
  role: truncate(toCleanString(person?.role), 200),
  companyName: truncate(toCleanString(person?.companyName), 200),
  contactChannel: truncate(toCleanString(person?.contactChannel), 100),
  relationshipStatus: truncate(toCleanString(person?.relationshipStatus), 100),
});

const normalizeCompany = (company) => ({
  name: truncate(toCleanString(company?.name), 200),
  industry: truncate(toCleanString(company?.industry), 200),
  country: truncate(toCleanString(company?.country), 100),
  website: truncate(toCleanString(company?.website), 300),
  notes: truncate(toCleanString(company?.notes), 400),
});

const extractResponseText = async (response) => {
  const directText = response?.text;
  if (typeof directText === 'string' && directText.trim()) {
    return directText;
  }

  if (typeof directText === 'function') {
    try {
      const resolved = await directText.call(response);
      if (typeof resolved === 'string' && resolved.trim()) return resolved;
    } catch {
      // fall through to candidate parsing
    }
  }

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts) && parts.length > 0) {
    const merged = parts
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('')
      .trim();
    if (merged) return merged;
  }

  return '';
};

const cleanModelOutput = (value) => {
  let output = toCleanString(value);
  output = stripMarkdownFences(output);
  output = stripOuterQuotes(output);
  output = output.replace(/\r\n/g, '\n').trim();
  return output;
};

const buildPrompt = ({ templateText, person, company, observation, goal, tone, length, language }) => {
  const systemInstruction = [
    'You are helping write concise professional outreach messages for UX/UI career and freelance opportunities.',
    'You must write exactly one outreach message.',
    'Do not output analysis.',
    'Do not output bullet points unless the template requires it.',
    'Do not output German unless language is German, which is not supported here.',
    'Do not include page labels, document fragments, metadata, explanations, or unrelated text.',
    'Output only the final message.',
    'Do not invent facts.',
    'Do not claim experience or results not provided.',
    'Do not sound spammy.',
    'Do not manipulate.',
    'Keep the message natural, respectful, and specific.',
    'If there is not enough context, still produce a clean generic outreach message based on the template. Do not invent facts.',
    `Language rules: english => output only English; french => output only French; arabic => output only Arabic.`,
  ].join(' ');

  const contextLines = [
    `Template: ${templateText}`,
    person.fullName ? `Person name: ${person.fullName}` : 'Person name: ',
    person.role ? `Person role: ${person.role}` : 'Person role: ',
    company.name ? `Company name: ${company.name}` : 'Company name: ',
    company.industry ? `Company industry: ${company.industry}` : 'Company industry: ',
    company.country ? `Company country: ${company.country}` : 'Company country: ',
    company.website ? `Company website: ${company.website}` : 'Company website: ',
    observation ? `Observation: ${observation}` : 'Observation: ',
    goal ? `Goal: ${goal}` : 'Goal: ',
    `Tone: ${tone}`,
    `Length: ${length}`,
    `Language: ${language}`,
  ];

  return `${systemInstruction}\n\n${contextLines.join('\n')}`;
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
  }

  if (!isAuthenticated(req)) {
    return toSafeJson(res, 401, { success: false, error: 'Unauthorized' });
  }

  const provider = toCleanString(process.env.AI_PROVIDER);
  const apiKey = toCleanString(process.env.GEMINI_API_KEY);
  const model = toCleanString(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';

  if (provider !== 'gemini' || !apiKey) {
    return toSafeJson(res, 200, { success: false, error: 'AI provider is not configured.' });
  }

  const body = readBody(req);
  const templateText = truncate(toCleanString(body?.templateText), MAX_TEMPLATE_LENGTH);
  const language = normalizeLanguage(body?.language);
  const tone = normalizeTone(body?.tone);
  const length = normalizeLength(body?.length);
  const observation = truncate(toCleanString(body?.observation), MAX_OBSERVATION_LENGTH);
  const person = normalizePerson(body?.person);
  const company = normalizeCompany(body?.company);
  const goal = truncate(toCleanString(body?.goal), 100);

  if (!templateText || !language) {
    return toSafeJson(res, 400, { success: false, error: 'Invalid AI message request.' });
  }

  const prompt = buildPrompt({
    templateText,
    person,
    company,
    observation,
    goal,
    tone,
    length,
    language,
  });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const rawText = await extractResponseText(response);
    const message = cleanModelOutput(rawText);

    if (!message || isClearlyInvalidOutput(message, language)) {
      return toSafeJson(res, 200, { success: false, error: 'AI generated an invalid message. Please try again.' });
    }

    return toSafeJson(res, 200, { success: true, message });
  } catch (error) {
    console.error('[AI Message] Generation failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return toSafeJson(res, 200, { success: false, error: 'Unable to generate message.' });
  }
}
