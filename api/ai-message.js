const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const ALLOWED_LANGUAGES = new Set(['english', 'french', 'arabic']);
const ALLOWED_TONES = new Set(['professional', 'friendly', 'concise']);
const ALLOWED_LENGTHS = new Set(['short', 'medium']);
const ALLOWED_CTA_TYPES = new Set([
  'ask_permission_to_send_audit',
  'ask_for_feedback',
  'ask_for_call',
  'ask_for_referral',
  'ask_for_opportunity',
  'soft_follow_up',
]);
const MAX_TEMPLATE_LENGTH = 4000;
const MAX_OBSERVATION_LENGTH = 500;

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

const toCleanString = (value) => (value == null ? '' : String(value).trim());

const truncate = (value, maxLength) =>
  value.length > maxLength ? value.slice(0, maxLength) : value;

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

const normalizeCtaType = (value) => {
  const ctaType = toCleanString(value).toLowerCase();
  return ALLOWED_CTA_TYPES.has(ctaType) ? ctaType : 'ask_permission_to_send_audit';
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

const getProviderConfig = () => {
  const provider = toCleanString(process.env.AI_PROVIDER);
  const apiKey = toCleanString(process.env.GEMINI_API_KEY);
  const model = toCleanString(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';
  return { provider, apiKey, model };
};

const requestGemini = async ({ apiKey, model, prompt, useResponseMimeType = true }) => {
  const body = {
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
      ...(useResponseMimeType ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }
  );

  const rawText = await response.text();
  let json = null;
  try {
    json = JSON.parse(rawText);
  } catch {
    // raw text will be used directly
  }

  return {
    ok: response.ok,
    status: response.status,
    data: json,
    rawText,
    error: response.ok
      ? null
      : {
          status: response.status,
          code: json?.error?.code ? String(json.error.code) : null,
          message: json?.error?.message ? String(json.error.message) : null,
          statusText: json?.error?.status ? String(json.error.status) : null,
        },
  };
};

const readGeminiResponseText = (data) => {
  if (!data?.candidates?.[0]?.content?.parts) return '';
  return data.candidates[0].content.parts
    .map((part) => (part && part.text ? part.text : ''))
    .join('')
    .trim();
};

const extractMessage = (value) => {
  let sanitized = toCleanString(value);
  sanitized = sanitized.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  if (!sanitized) return { message: '', parseStep: 'empty_text' };

  try {
    const parsed = JSON.parse(sanitized);
    return { message: toCleanString(parsed?.message), parseStep: 'json_parse' };
  } catch {
    const start = sanitized.indexOf('{');
    const end = sanitized.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        const parsed = JSON.parse(sanitized.slice(start, end + 1));
        return { message: toCleanString(parsed?.message), parseStep: 'substring_json_parse' };
      } catch {
        return { message: '', parseStep: 'substring_json_parse_failed' };
      }
    }
    return { message: '', parseStep: 'json_parse_failed' };
  }
};

const getCtaInstruction = (ctaType) => {
  const instructions = {
    ask_permission_to_send_audit: 'End the message by asking politely if the person would be open to a short 3-point UX audit of their site or product. Make it genuine and low-pressure.',
    ask_for_feedback: 'End the message by asking for 2-3 quick notes, thoughts, or feedback on the topic discussed. Keep it easy to respond to.',
    ask_for_call: 'End the message by asking if a short call would make sense to discuss further. Suggest a specific duration (e.g. 10-15 min).',
    ask_for_referral: 'End the message by asking if they are the right person to talk to, or if there is someone else on their team who would be a better fit.',
    ask_for_opportunity: 'End the message by asking if there are any junior, internship, freelance, or collaboration opportunities available.',
    soft_follow_up: 'End the message with a gentle follow-up and no pressure. Acknowledge they are busy and offer to reconnect at a better time.',
  };
  return instructions[ctaType] || instructions.ask_permission_to_send_audit;
};

const buildPrompt = ({ templateText, person, company, observation, goal, tone, length, language, ctaType }) => {
  const toneRule = tone !== 'friendly'
    ? 'Do not use "I hope this message finds you well" or similar platitudes.'
    : 'A warm opening is fine since tone is friendly.';
  const lengthRule = length === 'short'
    ? 'Keep the total message under 120 words.'
    : '';

  return [
    'Return JSON only in this exact shape:',
    '{"message":"..."}',
    'No markdown. No code fences. No explanations. No metadata.',
    'Write one concise outreach message in the selected language only.',
    'Do not invent facts or mention anything not provided.',
    '',
    '--- STYLE RULES ---',
    'Avoid generic phrases like "I hope this message finds you well" unless tone is "friendly".',
    'Mention the person\'s company and role if context is available to make it specific.',
    'Keep the message human, direct, and personalized rather than templated.',
    toneRule,
    lengthRule,
    '',
    '--- CTA INSTRUCTION ---',
    getCtaInstruction(ctaType),
    '',
    `Template: ${templateText}`,
    `Person: ${person.fullName || ''}${person.role ? ` | ${person.role}` : ''}`,
    `Company: ${company.name || ''}${company.industry ? ` | ${company.industry}` : ''}${company.country ? ` | ${company.country}` : ''}${company.website ? ` | ${company.website}` : ''}`,
    `Observation: ${observation || ''}`,
    `Goal: ${goal || ''}`,
    `Tone: ${tone}`,
    `Length: ${length}`,
    `Language: ${language}`,
    `CTA Type: ${ctaType}`,
  ].join('\n');
};

const buildFallbackPrompt = ({ templateText, language }) => [
  'Return JSON only in this exact shape:',
  '{"message":"..."}',
  'No markdown. No explanations. No metadata.',
  `Rewrite the following outreach message in ${language}.`,
  `Template: ${templateText}`,
].join('\n');

const generateMessage = async ({ apiKey, model, prompt }) => {
  const firstAttempt = await requestGemini({ apiKey, model, prompt, useResponseMimeType: true });

  if (firstAttempt.ok) {
    const text = readGeminiResponseText(firstAttempt.data);
    const parsed = extractMessage(text);
    return {
      success: Boolean(parsed.message),
      status: firstAttempt.status,
      text,
      message: parsed.message,
      parseStep: parsed.parseStep,
      providerError: null,
    };
  }

  const mimeRelated = /responseMimeType|mime|JSON|application\/json/i.test(firstAttempt.error?.message || '');
  if (!mimeRelated) {
    return {
      success: false,
      status: firstAttempt.status,
      text: firstAttempt.rawText,
      message: '',
      parseStep: 'provider_error',
      providerError: firstAttempt.error,
    };
  }

  const retryAttempt = await requestGemini({ apiKey, model, prompt, useResponseMimeType: false });
  if (retryAttempt.ok) {
    const text = readGeminiResponseText(retryAttempt.data);
    const parsed = extractMessage(text);
    return {
      success: Boolean(parsed.message),
      status: retryAttempt.status,
      text,
      message: parsed.message,
      parseStep: parsed.parseStep,
      providerError: null,
    };
  }

  return {
    success: false,
    status: retryAttempt.status,
    text: retryAttempt.rawText,
    message: '',
    parseStep: 'provider_error',
    providerError: retryAttempt.error,
  };
};

const makeSafeDebug = (overrides = {}) => ({
  phase: 'unknown',
  model: 'gemini-2.0-flash',
  provider: 'gemini',
  hasTemplateText: false,
  templateTextLength: 0,
  language: '',
  hasApiKey: false,
  providerStatus: null,
  providerErrorCode: null,
  providerErrorMessage: null,
  responseTextLength: null,
  parseStep: null,
  rejectionReason: null,
  ...overrides,
});

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    const { provider, apiKey, model } = getProviderConfig();

    if (req.method === 'GET') {
      if (req?.query?.health === '1') {
        return toSafeJson(res, 200, {
          success: true,
          route: 'api/ai-message.js',
          provider: process.env.AI_PROVIDER || null,
          configured: Boolean(process.env.GEMINI_API_KEY),
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
        });
      }
      return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
    }

    if (req.method !== 'POST') {
      return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
    }

    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Unauthorized' });
    }

    const body = readBody(req);
    const debugRequested =
      body?.debug === true || body?.debug === 'true' || body?.debug === 1;

    if (provider !== 'gemini' || !apiKey) {
      return toSafeJson(res, 500, { success: false, error: 'AI provider is not configured.' });
    }

    // --- testProvider mode ---
    if (body?.testProvider === true || body?.testProvider === 'true' || body?.testProvider === 1) {
      const testResult = await generateMessage({
        apiKey,
        model,
        prompt: 'Return only JSON:\n{"message":"Hello from Gemini"}',
      });

      if (testResult.success) {
        const responseBody = {
          success: true,
          message: testResult.message,
          debug: {
            providerStatus: testResult.status,
            model,
            responseTextLength: testResult.text.length,
            parseStep: testResult.parseStep,
          },
        };
        if (!debugRequested) delete responseBody.debug;
        return toSafeJson(res, 200, responseBody);
      }

      const debug = {
        phase: 'provider_response',
        model,
        provider: 'gemini',
        providerStatus: testResult.status,
        providerErrorMessage: testResult.providerError?.message || null,
        responseTextLength: testResult.text ? testResult.text.length : 0,
        parseStep: testResult.parseStep,
      };

      const responseBody = { success: false, error: 'Unable to generate a clean message.', debug };
      if (!debugRequested) delete responseBody.debug;
      return toSafeJson(res, 500, responseBody);
    }

    // --- Normal generation ---
    const templateText = truncate(toCleanString(body?.templateText), MAX_TEMPLATE_LENGTH);
    const language = normalizeLanguage(body?.language);

    if (!templateText || templateText.length < 10 || !language) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid AI message request.' });
    }

    const tone = normalizeTone(body?.tone);
    const length = normalizeLength(body?.length);
    const observation = truncate(toCleanString(body?.observation), MAX_OBSERVATION_LENGTH);
    const person = normalizePerson(body?.person);
    const company = normalizeCompany(body?.company);
    const goal = truncate(toCleanString(body?.goal), 100);

    const ctaType = normalizeCtaType(body?.ctaType);
    const primaryPrompt = buildPrompt({
      templateText,
      person,
      company,
      observation,
      goal,
      tone,
      length,
      language,
      ctaType,
    });

    const primary = await generateMessage({ apiKey, model, prompt: primaryPrompt });

    if (primary.success) {
      return toSafeJson(res, 200, { success: true, message: primary.message });
    }

    const fallbackPrompt = buildFallbackPrompt({ templateText, language });
    const fallback = await generateMessage({ apiKey, model, prompt: fallbackPrompt });

    if (fallback.success) {
      return toSafeJson(res, 200, { success: true, message: fallback.message });
    }

    console.error('[AI Message] Both primary and fallback failed', {
      route: 'ai-message',
      model,
      providerStatus: fallback.status,
      providerErrorMessage: fallback.providerError?.message || 'Unknown error',
    });

    return toSafeJson(res, 200, { success: false, error: 'Unable to generate a clean message.' });
  } catch (error) {
    console.error('[AI Message] Unhandled error', {
      route: 'ai-message',
      method: req?.method,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return toSafeJson(res, 500, { success: false, error: 'AI message function failed.' });
  }
}