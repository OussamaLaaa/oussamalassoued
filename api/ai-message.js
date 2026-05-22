const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const ALLOWED_LANGUAGES = new Set(['english', 'french', 'arabic']);
const ALLOWED_TONES = new Set(['professional', 'friendly', 'concise']);
const ALLOWED_LENGTHS = new Set(['short', 'medium']);
const MAX_TEMPLATE_LENGTH = 4000;
const MAX_OBSERVATION_LENGTH = 500;

const toSafeJson = (res, status, body) => res.status(status).json(body);

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

const sanitizeJsonText = (value) => toCleanString(value)
  .replace(/^```json\s*/i, '')
  .replace(/^```\s*/i, '')
  .replace(/\s*```$/i, '')
  .trim();

const extractMessage = (value) => {
  const sanitized = sanitizeJsonText(value);
  if (!sanitized) return '';

  try {
    const parsed = JSON.parse(sanitized);
    return toCleanString(parsed?.message);
  } catch {
    const start = sanitized.indexOf('{');
    const end = sanitized.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        const parsed = JSON.parse(sanitized.slice(start, end + 1));
        return toCleanString(parsed?.message);
      } catch {
        return '';
      }
    }

    return '';
  }
};

const buildPrompt = ({ templateText, person, company, observation, goal, tone, length, language }) => [
  'Return JSON only in this exact shape:',
  '{"message":"..."}',
  'No markdown. No code fences. No explanations. No metadata.',
  'Write one concise outreach message in the selected language only.',
  'Do not invent facts or mention anything not provided.',
  '',
  `Template: ${templateText}`,
  `Person: ${person.fullName || ''}${person.role ? ` | ${person.role}` : ''}`,
  `Company: ${company.name || ''}${company.industry ? ` | ${company.industry}` : ''}${company.country ? ` | ${company.country}` : ''}${company.website ? ` | ${company.website}` : ''}`,
  `Observation: ${observation || ''}`,
  `Goal: ${goal || ''}`,
  `Tone: ${tone}`,
  `Length: ${length}`,
  `Language: ${language}`,
].join('\n');

const buildFallbackPrompt = ({ templateText, language }) => [
  'Return JSON only in this exact shape:',
  '{"message":"..."}',
  'No markdown. No explanations. No metadata.',
  `Rewrite the following outreach message in ${language}.`,
  `Template: ${templateText}`,
].join('\n');

const buildRequestPayload = (prompt) => ({
  contents: [
    {
      role: 'user',
      parts: [{ text: prompt }],
    },
  ],
  generationConfig: {
    temperature: 0.2,
    topP: 0.8,
    maxOutputTokens: 500,
    responseMimeType: 'application/json',
  },
});

const readGeminiResponseText = (data) => data?.candidates?.[0]?.content?.parts
  ?.map((part) => part?.text || '')
  .join('')
  .trim() || '';

const generateMessage = async ({ apiKey, model, prompt }) => {
  if (typeof fetch !== 'function') {
    throw new Error('fetch unavailable');
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildRequestPayload(prompt)),
    }
  );

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMessage = data?.error?.message || `Gemini request failed with status ${response.status}`;
    throw new Error(errorMessage);
  }

  const text = readGeminiResponseText(data);
  return {
    text,
    message: extractMessage(text),
  };
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'GET' && req?.query?.health === '1') {
      return toSafeJson(res, 200, {
        success: true,
        route: 'api/ai-message.js',
        provider: process.env.AI_PROVIDER || null,
        configured: Boolean(process.env.GEMINI_API_KEY),
        model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      });
    }

    if (req.method !== 'POST') {
      return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
    }

    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Unauthorized' });
    }

    const body = readBody(req);
    const provider = toCleanString(process.env.AI_PROVIDER);
    const apiKey = toCleanString(process.env.GEMINI_API_KEY);
    const model = toCleanString(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';

    if (provider !== 'gemini' || !apiKey) {
      return toSafeJson(res, 500, { success: false, error: 'AI provider is not configured.' });
    }

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

    const primary = await generateMessage({
      apiKey,
      model,
      prompt: buildPrompt({ templateText, person, company, observation, goal, tone, length, language }),
    });

    if (primary.message) {
      return toSafeJson(res, 200, { success: true, message: primary.message });
    }

    const fallback = await generateMessage({
      apiKey,
      model,
      prompt: buildFallbackPrompt({ templateText, language }),
    });

    if (fallback.message) {
      return toSafeJson(res, 200, { success: true, message: fallback.message });
    }

    return toSafeJson(res, 200, { success: false, error: 'Unable to generate a clean message.' });
  } catch (error) {
    console.error('[AI Message] api/ai-message.js failed', {
      method: req?.method,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return toSafeJson(res, 500, { success: false, error: 'AI message function failed.' });
  }
}
