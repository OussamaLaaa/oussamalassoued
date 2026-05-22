import { GoogleGenAI } from '@google/genai';

const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const ALLOWED_LANGUAGES = new Set(['english', 'french', 'arabic']);
const ALLOWED_TONES = new Set(['professional', 'friendly', 'concise']);
const ALLOWED_LENGTHS = new Set(['short', 'medium']);
const MAX_TEMPLATE_LENGTH = 4000;
const MAX_OBSERVATION_LENGTH = 500;

const readBody = (req) => {
  // Read the body of the request
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
  // Parse cookies from the request header
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
  // Check if the request is authenticated
  const cookies = parseCookies(req.headers?.cookie);
  return cookies[COOKIE_NAME] === COOKIE_VALUE;
};

const toCleanString = (value) => (value == null ? '' : String(value).trim());

const truncate = (value, maxLength) => (value.length > maxLength ? value.slice(0, maxLength) : value);

const normalizeLanguage = (value) => {
  // Normalize the language input
  const language = toCleanString(value).toLowerCase();
  return ALLOWED_LANGUAGES.has(language) ? language : '';
};

const normalizeTone = (value) => {
  const tone = toCleanString(value).toLowerCase();
  return ALLOWED_TONES.has(tone) ? tone : 'professional';
};

const normalizeLength = (value) => {
  // Normalize the length input
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

const cleanModelOutput = (value) => toCleanString(value).replace(/^```(?:[a-zA-Z]+)?\s*/g, '').replace(/\s*```$/g, '').replace(/^["']|["']$/g, '').trim();

const hasDocumentArtifacts = (value) => /(?:^|\s)(Seite|Page\s*\d+|পৃষ্ঠা|von\s+\d+|document)(?:\s|$)/i.test(value);

const looksTooFragmented = (value) => {
  const lines = value.split('\n').map((line) => line.trim()).filter(Boolean);
  if (lines.length >= 4 && lines.every((line) => line.length < 40)) return true;
  const pageHits = (value.match(/\b(Page\s*\d+|Seite\s*\d+)\b/gi) || []).length;
  return pageHits >= 2;
};

const hasSentenceStructure = (value) => /[.!?]/.test(value) || /\n/.test(value) || /^[-*•]/m.test(value);

const validateModelOutput = (value, language) => {
  const message = cleanModelOutput(value);
  if (!message) {
    return { ok: false, rejectionReason: 'empty_response', message: '' };
  }
  if (message.length < 30) {
    return { ok: false, rejectionReason: 'too_short', message };
  }
  if (language !== 'arabic' && /\bSeite\b/i.test(message)) {
    return { ok: false, rejectionReason: 'garbage_detected', message };
  }
  if (language !== 'arabic' && hasDocumentArtifacts(message)) {
    return { ok: false, rejectionReason: 'garbage_detected', message };
  }
  if (looksTooFragmented(message) && message.length < 100) {
    return { ok: false, rejectionReason: 'garbage_detected', message };
  }
  if (!hasSentenceStructure(message) && message.length < 100) {
    return { ok: false, rejectionReason: 'garbage_detected', message };
  }
  return { ok: true, rejectionReason: null, message };
};

const extractResponseText = async (response) => {
  if (!response) {
    return { text: '', method: 'fallback' };
  }

  const directText = response.text;
  if (typeof directText === 'function') {
    try {
      const resolved = await directText.call(response);
  const normalizeResponseText = (value) => toCleanString(value).replace(/\r\n/g, '\n').trim();

  const stripMarkdownFences = (value) => value.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
        return { text: resolved, method: 'response.text' };
      }
    } catch {
      // fall through
    }
  } else if (typeof directText === 'string' && directText.trim()) {
    return { text: directText, method: 'response.text' };
  }

  const parts = response?.candidates?.[0]?.content?.parts;
  if (Array.isArray(parts)) {
    const merged = parts
      .map((part) => {
        if (typeof part?.text === 'string') return part.text;
        if (typeof part?.toString === 'function') {
          const rendered = part.toString();
          return typeof rendered === 'string' ? rendered : '';
        }
        return '';
      })
      .join('')
      .trim();

    if (merged) {
      return { text: merged, method: 'candidates.parts' };
    }
  }

  return { text: '', method: 'fallback' };
};

const buildPrompt = ({ templateText, person, company, observation, goal, tone, length, language }) => [
  'You are writing one concise professional outreach message.',
  'Output only the final message.',
  'Do not explain.',
  'Do not add metadata.',
  'Do not invent facts.',
  'Do not mention anything not provided.',
  'Use only the selected language.',
  'Keep it short and human.',
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

const buildFallbackPrompt = ({ templateText, language }) => `Rewrite this outreach message in ${language}. Output only one clean professional message. Template: ${templateText}`;

const withDebug = ({ success, error, debugRequested, debug }) => {
  if (!debugRequested) return { success, error };
  return { success, error, debug };
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

  const body = readBody(req);
  const debugRequested = body?.debug === true || body?.debug === 'true' || body?.debug === 1;
  const provider = toCleanString(process.env.AI_PROVIDER);
  const apiKey = toCleanString(process.env.GEMINI_API_KEY);
  const model = toCleanString(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';

  const baseDebug = {
    hasTemplateText: Boolean(toCleanString(body?.templateText)),
    templateTextLength: toCleanString(body?.templateText).length,
    language: toCleanString(body?.language),
    tone: normalizeTone(body?.tone),
    length: normalizeLength(body?.length),
    hasPerson: Boolean(body?.person && typeof body.person === 'object'),
    hasCompany: Boolean(body?.company && typeof body.company === 'object'),
    hasObservation: Boolean(toCleanString(body?.observation)),
    model,
    aiProvider: 'gemini',
    responseTextLength: 0,
    extractionMethod: 'fallback',
    rejectionReason: 'provider_error',
  };

  if (provider !== 'gemini' || !apiKey) {
    return toSafeJson(res, 200, withDebug({
      success: false,
      error: 'AI provider is not configured.',
      debugRequested,
      debug: baseDebug,
    }));
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
    return toSafeJson(res, 400, withDebug({
      success: false,
      error: 'Invalid AI message request.',
      debugRequested,
      debug: {
        ...baseDebug,
        hasTemplateText: Boolean(templateText),
        templateTextLength: templateText.length,
        language,
        tone,
        length,
        hasPerson: Boolean(body?.person && typeof body.person === 'object'),
        hasCompany: Boolean(body?.company && typeof body.company === 'object'),
        hasObservation: Boolean(observation),
        rejectionReason: 'invalid_input',
      },
    }));
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

  const ai = new GoogleGenAI({ apiKey });

  const runModel = async (contents) => {
    const response = await ai.models.generateContent({ model, contents });
    const extracted = await extractResponseText(response);
    const validation = validateModelOutput(extracted.text, language);
    return {
      responseTextLength: extracted.text.length,
      extractionMethod: extracted.method,
      validation,
    };
  };

  try {
    const primary = await runModel(prompt);

    if (primary.validation.ok) {
      return toSafeJson(res, 200, { success: true, message: primary.validation.message });
    }

    const fallbackPrompt = buildFallbackPrompt({ templateText, language });
    const fallback = await runModel(fallbackPrompt);

    if (fallback.validation.ok) {
      return toSafeJson(res, 200, { success: true, message: fallback.validation.message });
    }

    return toSafeJson(res, 200, withDebug({
      success: false,
      error: fallback.validation.rejectionReason === 'garbage_detected'
        ? 'AI generated an invalid message. Please try again.'
        : 'Unable to generate message.',
      debugRequested,
      debug: {
        ...baseDebug,
        responseTextLength: fallback.responseTextLength,
        extractionMethod: fallback.extractionMethod,
        rejectionReason: fallback.validation.rejectionReason || 'provider_error',
      },
    }));
  } catch (error) {
    console.error('[AI Message] Generation failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return toSafeJson(res, 200, withDebug({
      success: false,
      error: 'Unable to generate message.',
      debugRequested,
      debug: {
        ...baseDebug,
        rejectionReason: 'provider_error',
      },
    }));
  }
}
