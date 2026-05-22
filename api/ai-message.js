const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const ALLOWED_LANGUAGES = new Set(['english', 'french', 'arabic']);
const ALLOWED_TONES = new Set(['professional', 'friendly', 'concise']);
const ALLOWED_LENGTHS = new Set(['short', 'medium']);
const MAX_TEMPLATE_LENGTH = 4000;
const MAX_OBSERVATION_LENGTH = 500;
const VALIDATION_ERROR = 'Invalid AI message request.';
const PROVIDER_NOT_CONFIGURED_ERROR = 'AI provider is not configured.';
const CLEAN_MESSAGE_ERROR = 'Unable to generate a clean message.';

const createDebug = (overrides = {}) => ({
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
const readProviderBody = async (response) => {
  const text = await response.text();
  if (!text) return { rawText: '', json: null };

  try {
    return { rawText: text, json: JSON.parse(text) };
  } catch {
    return { rawText: text, json: null };
  }
};

const readGeminiResponseText = (data) => data?.candidates?.[0]?.content?.parts
  ?.map((part) => part?.text || '')
  .join('')
  .trim() || '';

const toProviderError = (status, body) => ({
  status,
  code: body?.error?.code ? String(body.error.code) : null,
  message: body?.error?.message ? String(body.error.message) : null,
  statusText: body?.error?.status ? String(body.error.status) : null,
});

const requestGemini = async ({ apiKey, model, prompt, useResponseMimeType = true }) => {
  if (typeof fetch !== 'function') {
    throw new Error('fetch unavailable');
  }

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

  const payload = await readProviderBody(response);
  return {
    ok: response.ok,
    status: response.status,
    data: payload.json,
    rawText: payload.rawText,
    error: response.ok ? null : toProviderError(response.status, payload.json),
  };
};
      body: JSON.stringify(buildRequestPayload(prompt)),
const generateMessage = async ({ apiKey, model, prompt, debug }) => {
  const firstAttempt = await requestGemini({ apiKey, model, prompt, useResponseMimeType: true });

  if (!firstAttempt.ok) {
    const mimeRelated = /responseMimeType|mime|JSON|application\/json/i.test(firstAttempt.error?.message || '');
    if (mimeRelated) {
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
          debug: {
            ...debug,
            providerStatus: retryAttempt.status,
            responseTextLength: text.length,
            parseStep: parsed.parseStep,
          },
        };
      }

      return {
        success: false,
        status: retryAttempt.status,
        text: retryAttempt.rawText,
        message: '',
        parseStep: 'provider_error',
        providerError: retryAttempt.error,
        debug: {
          ...debug,
          phase: 'provider_response',
          providerStatus: retryAttempt.status,
          providerErrorCode: retryAttempt.error?.code || null,
          providerErrorMessage: retryAttempt.error?.message || null,
          responseTextLength: retryAttempt.rawText.length,
          parseStep: 'provider_error',
          rejectionReason: 'provider_request_failed',
        },
      };
    }

    return {
      success: false,
      status: firstAttempt.status,
      text: firstAttempt.rawText,
      message: '',
      parseStep: 'provider_error',
      providerError: firstAttempt.error,
      debug: {
        ...debug,
        phase: 'provider_response',
        providerStatus: firstAttempt.status,
        providerErrorCode: firstAttempt.error?.code || null,
        providerErrorMessage: firstAttempt.error?.message || null,
        responseTextLength: firstAttempt.rawText.length,
        parseStep: 'provider_error',
        rejectionReason: 'provider_request_failed',
      },
    };
  }

  const text = readGeminiResponseText(firstAttempt.data);
  const parsed = extractMessage(text);

  return {
    success: Boolean(parsed.message),
    status: firstAttempt.status,
    text,
    message: parsed.message,
    parseStep: parsed.parseStep,
    providerError: null,
    debug: {
      ...debug,
      phase: parsed.message ? 'validation_output' : 'parse',
      providerStatus: firstAttempt.status,
      responseTextLength: text.length,
      parseStep: parsed.parseStep,
      rejectionReason: parsed.message ? null : 'parse_failed',
    },
  };
};

const withDebug = (body, debugRequested, debug) => {
  if (!debugRequested) return body;
  return { ...body, debug };
};

const validateRequest = ({ templateText, language }) => {
  if (!templateText || templateText.length < 10) {
    return { ok: false, status: 400, error: VALIDATION_ERROR, phase: 'validation' };
  }

  if (!language) {
    return { ok: false, status: 400, error: VALIDATION_ERROR, phase: 'validation' };
  }

  return { ok: true };
};

const makeSafeDebug = ({ phase, model, provider, hasTemplateText, templateTextLength, language, hasApiKey, providerStatus = null, providerErrorCode = null, providerErrorMessage = null, responseTextLength = null, parseStep = null, rejectionReason = null }) => ({
  phase,
  model,
  provider,
  hasTemplateText,
  templateTextLength,
  language,
  hasApiKey,
  providerStatus,
  providerErrorCode,
  providerErrorMessage,
  responseTextLength,
  parseStep,
  rejectionReason,
});

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
    const debugRequested = body?.debug === true || body?.debug === 'true' || body?.debug === 1;
    const testProvider = body?.testProvider === true || body?.testProvider === 'true' || body?.testProvider === 1;
    const provider = toCleanString(process.env.AI_PROVIDER);
    const apiKey = toCleanString(process.env.GEMINI_API_KEY);
    const model = toCleanString(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';
    const language = normalizeLanguage(body?.language);
    const templateText = truncate(toCleanString(body?.templateText), MAX_TEMPLATE_LENGTH);
    const tone = normalizeTone(body?.tone);
    const length = normalizeLength(body?.length);
    const observation = truncate(toCleanString(body?.observation), MAX_OBSERVATION_LENGTH);
    const person = normalizePerson(body?.person);
    const company = normalizeCompany(body?.company);
    const goal = truncate(toCleanString(body?.goal), 100);
    const baseDebug = createDebug({
      model,
      provider,
      hasTemplateText: Boolean(templateText),
      templateTextLength: templateText.length,
      language,
      hasApiKey: Boolean(apiKey),
    });

    if (provider !== 'gemini' || !apiKey) {
      return toSafeJson(res, 500, withDebug({ success: false, error: PROVIDER_NOT_CONFIGURED_ERROR }, debugRequested, {
        ...baseDebug,
        phase: 'provider_request',
        rejectionReason: 'provider_not_configured',
      }));
    }

    if (testProvider) {
      const testPrompt = 'Return only JSON:\n{"message":"Hello from Gemini"}';
      const testResult = await generateMessage({ apiKey, model, prompt: testPrompt, debug: baseDebug });

      if (testResult.success) {
        return toSafeJson(res, 200, withDebug({ success: true, message: testResult.message }, debugRequested, {
          ...baseDebug,
          phase: 'validation_output',
          providerStatus: testResult.status,
          responseTextLength: testResult.debug.responseTextLength,
          parseStep: testResult.parseStep,
        }));
      }

      console.error('[AI Message] api/ai-message.js failed', {
        route: 'ai-message',
        phase: testResult.debug.phase,
        model,
        providerStatus: testResult.debug.providerStatus,
        providerErrorCode: testResult.debug.providerErrorCode,
        providerErrorMessage: testResult.debug.providerErrorMessage,
        message: testResult.providerError?.message || 'Unknown error',
      });

      return toSafeJson(res, 500, withDebug({ success: false, error: CLEAN_MESSAGE_ERROR }, debugRequested, testResult.debug));
    }

    const validation = validateRequest({ templateText, language });
    if (!validation.ok) {
      return toSafeJson(res, validation.status, withDebug({ success: false, error: validation.error }, debugRequested, {
        ...baseDebug,
        phase: validation.phase,
        rejectionReason: 'invalid_request',
      }));
    }

    const primaryPrompt = buildPrompt({
      templateText,
      person,
      company,
      observation,
      goal,
      tone,
      length,
      language,
    });

    const primary = await generateMessage({ apiKey, model, prompt: primaryPrompt, debug: baseDebug });

    if (primary.success) {
      return toSafeJson(res, 200, withDebug({ success: true, message: primary.message }, debugRequested, {
        ...baseDebug,
        phase: primary.debug.phase,
        providerStatus: primary.status,
        responseTextLength: primary.debug.responseTextLength,
        parseStep: primary.parseStep,
      }));
    }

    const fallback = await generateMessage({
      apiKey,
      model,
      prompt: buildFallbackPrompt({ templateText, language }),
      debug: baseDebug,
    });

    if (fallback.success) {
      return toSafeJson(res, 200, withDebug({ success: true, message: fallback.message }, debugRequested, {
        ...baseDebug,
        phase: fallback.debug.phase,
        providerStatus: fallback.status,
        responseTextLength: fallback.debug.responseTextLength,
        parseStep: fallback.parseStep,
      }));
    }

    console.error('[AI Message] api/ai-message.js failed', {
      route: 'ai-message',
      phase: fallback.debug.phase,
      model,
      providerStatus: fallback.debug.providerStatus,
      providerErrorCode: fallback.debug.providerErrorCode,
      providerErrorMessage: fallback.debug.providerErrorMessage,
      message: fallback.providerError?.message || 'Unknown error',
    });

    return toSafeJson(res, 200, withDebug({ success: false, error: CLEAN_MESSAGE_ERROR }, debugRequested, fallback.debug));
  } catch (error) {
    console.error('[AI Message] api/ai-message.js failed', {
      route: 'ai-message',
      phase: 'unknown',
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
      providerStatus: null,
      providerErrorCode: null,
      providerErrorMessage: null,
      method: req?.method,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return toSafeJson(res, 500, { success: false, error: 'AI message function failed.' });
  }
}
