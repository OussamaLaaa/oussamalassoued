const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const DEFAULT_MODEL = 'gemini-1.5-flash';
const MAX_TEXT_LENGTH = 8000;
const MAX_CONTEXT_LENGTH = 1200;
const MAX_INSTRUCTIONS_LENGTH = 1200;

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

const truncate = (value, maxLength) => {
  const text = toCleanString(value);
  return text.length > maxLength ? text.slice(0, maxLength) : text;
};

const normalizeLanguage = (value) => {
  const language = toCleanString(value).toLowerCase();
  return ['english', 'french', 'arabic'].includes(language) ? language : '';
};

const normalizeTone = (value) => {
  const tone = toCleanString(value).toLowerCase();
  return ['professional', 'simple', 'formal', 'friendly', 'concise'].includes(tone) ? tone : 'professional';
};

const normalizeDocumentType = (value) => {
  const type = toCleanString(value).toLowerCase();
  return ['invoice', 'contract', 'cahier_de_charges', 'proposal', 'agreement', 'receipt', 'ux_audit_report', 'project_brief', 'document', 'other'].includes(type)
    ? type
    : '';
};

const getProviderConfig = () => {
  const provider = toCleanString(process.env.AI_PROVIDER).toLowerCase();
  const apiKey = toCleanString(process.env.GEMINI_API_KEY);
  const model = toCleanString(process.env.GEMINI_MODEL) || DEFAULT_MODEL;
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
      maxOutputTokens: 1400,
      ...(useResponseMimeType ? { responseMimeType: 'application/json' } : {}),
    },
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    },
  );

  const rawText = await response.text();
  let json = null;
  try {
    json = JSON.parse(rawText);
  } catch {
    // Keep raw text for fallback parsing.
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
    .map((part) => (part && typeof part.text === 'string' ? part.text : ''))
    .join('')
    .trim();
};

const stripMarkdownFences = (value) => String(value || '')
  .replace(/^```json\s*/i, '')
  .replace(/^```\s*/i, '')
  .replace(/\s*```$/i, '')
  .trim();

const extractFirstJsonObject = (value) => {
  const text = stripMarkdownFences(value);
  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
  }

  return null;
};

const normalizeList = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => truncate(item, 500))
    .map((item) => item.trim())
    .filter(Boolean);
};

const normalizeResult = (analysis) => ({
  summary: truncate(analysis?.summary, 1000),
  improvedContent: truncate(analysis?.improvedContent, MAX_TEXT_LENGTH),
  risks: normalizeList(analysis?.risks),
  missingClauses: normalizeList(analysis?.missingClauses),
  suggestedSections: normalizeList(analysis?.suggestedSections),
  questionsToReview: normalizeList(analysis?.questionsToReview),
  nextActions: normalizeList(analysis?.nextActions),
});

const makeSafeDebug = (overrides = {}) => ({
  phase: 'unknown',
  provider: 'gemini',
  model: DEFAULT_MODEL,
  providerStatus: null,
  responseTextLength: 0,
  parseStep: 'not_started',
  ...overrides,
});

const truncateDocument = (document = {}) => ({
  title: truncate(document.title, 300),
  type: normalizeDocumentType(document.type),
  content: truncate(document.content, MAX_TEXT_LENGTH),
  status: truncate(document.status, 100),
  amount: Number.isFinite(Number(document.amount)) ? Number(document.amount) : undefined,
  currency: truncate(document.currency, 16),
  issueDate: truncate(document.issueDate, 32),
  dueDate: truncate(document.dueDate, 32),
});

const truncateContext = (context = {}) => ({
  projectName: truncate(context.projectName, MAX_CONTEXT_LENGTH),
  companyName: truncate(context.companyName, MAX_CONTEXT_LENGTH),
  personName: truncate(context.personName, MAX_CONTEXT_LENGTH),
  dealName: truncate(context.dealName, MAX_CONTEXT_LENGTH),
  serviceDescription: truncate(context.serviceDescription, MAX_CONTEXT_LENGTH),
  deliverables: truncate(context.deliverables, MAX_CONTEXT_LENGTH),
  timeline: truncate(context.timeline, MAX_CONTEXT_LENGTH),
  paymentTerms: truncate(context.paymentTerms, MAX_CONTEXT_LENGTH),
  notes: truncate(context.notes, MAX_CONTEXT_LENGTH),
});

const truncateBrand = (brand = {}) => ({
  brandName: truncate(brand.brandName, MAX_CONTEXT_LENGTH),
  ownerName: truncate(brand.ownerName, MAX_CONTEXT_LENGTH),
  email: truncate(brand.email, 320),
  phone: truncate(brand.phone, 120),
  website: truncate(brand.website, 320),
  address: truncate(brand.address, MAX_CONTEXT_LENGTH),
  legalNotes: truncate(brand.legalNotes, MAX_CONTEXT_LENGTH),
  paymentNotes: truncate(brand.paymentNotes, MAX_CONTEXT_LENGTH),
  signatureName: truncate(brand.signatureName, MAX_CONTEXT_LENGTH),
});

const languageInstruction = (language) => {
  if (language === 'arabic') return 'All string values must be in Arabic only. Keep JSON keys exactly as specified.';
  if (language === 'french') return 'All string values must be in French only. Keep JSON keys exactly as specified.';
  return 'All string values must be in English only. Keep JSON keys exactly as specified.';
};

const outputShape = [
  '{',
  '  "summary": "short explanation of the AI result",',
  '  "improvedContent": "full improved or generated document content if applicable",',
  '  "risks": ["possible ambiguity or risk, not legal advice"],',
  '  "missingClauses": ["possibly missing clause or section"],',
  '  "suggestedSections": ["section name or improvement"],',
  '  "questionsToReview": ["question user should review before sending"],',
  '  "nextActions": ["practical next step"]',
  '}',
].join('\n');

const placeholderList = [
  '{{clientName}}',
  '{{projectName}}',
  '{{serviceDescription}}',
  '{{deliverables}}',
  '{{amount}}',
  '{{currency}}',
  '{{deadline}}',
  '{{paymentTerms}}',
  '{{signatureName}}',
];

const buildPrompt = ({ mode, documentType, language, tone, document, context, brand, instructions }) => {
  const modeRules = {
    create_template: [
      'Generate a reusable template for the selected document type.',
      `Include placeholders such as: ${placeholderList.join(', ')}`,
      'Put the full template in improvedContent.',
      'Include only sections relevant to the selected document type.',
    ],
    improve_document: [
      'Rewrite the document for clarity, structure, and professional tone.',
      'Keep the original meaning and do not invent facts.',
      'Use improvedContent for the revised full document.',
    ],
    risk_review: [
      'Focus on ambiguity, missing information, unclear scope, unclear payment terms, unclear timelines, unclear responsibilities, unclear acceptance criteria, unclear cancellation terms, and unclear revision terms.',
      'Do not provide legal advice.',
      'Keep improvedContent empty unless a short safer wording is genuinely helpful.',
    ],
    missing_clauses: [
      'Identify possible missing sections without claiming legal necessity.',
      'Fill missingClauses and suggestedSections.',
      'Do not provide legal advice.',
    ],
    adapt_to_project: [
      'Adapt the document to the project and client context without inventing facts.',
      'If key information is missing, add questionsToReview.',
      'Keep the user intent and structure clear.',
    ],
    summarize_document: [
      'Summarize the document clearly and concisely.',
      'Keep improvedContent empty unless a compact summary rewrite is helpful.',
    ],
    rewrite_tone: [
      'Rewrite the document using the selected tone while preserving meaning.',
      'Put the full rewritten version in improvedContent.',
    ],
    translate_document: [
      'Translate the document content into the selected language while preserving structure.',
      'Put the full translation in improvedContent.',
    ],
  };

  const safetyHeader = [
    'You are AI Document Assistant v1.',
    'You help with drafting, clarity, structure, missing sections, ambiguity review, summarizing, adapting to project/client context, and review questions only.',
    'You are not a lawyer and you do not provide legal advice.',
    'Do not claim legal validity or enforceability.',
    'Do not guarantee outcomes.',
    'Do not overwrite user content automatically.',
    'Return JSON only. No markdown. No code fences. No explanations outside JSON.',
    'Use cautious, practical language.',
    languageInstruction(language),
    '',
    'Output JSON must match this exact shape:',
    outputShape,
    '',
  ].join('\n');

  const docSection = [
    '--- DOCUMENT ---',
    `Type: ${documentType}`,
    `Mode: ${mode}`,
    `Title: ${document.title || ''}`,
    `Status: ${document.status || ''}`,
    `Issue Date: ${document.issueDate || ''}`,
    `Due Date: ${document.dueDate || ''}`,
    `Amount: ${document.amount ?? ''}`,
    `Currency: ${document.currency || ''}`,
    'Content:',
    document.content || '',
    '',
  ].join('\n');

  const contextSection = [
    '--- CONTEXT ---',
    `Project: ${context.projectName || ''}`,
    `Company: ${context.companyName || ''}`,
    `Person: ${context.personName || ''}`,
    `Deal: ${context.dealName || ''}`,
    `Service Description: ${context.serviceDescription || ''}`,
    `Deliverables: ${context.deliverables || ''}`,
    `Timeline: ${context.timeline || ''}`,
    `Payment Terms: ${context.paymentTerms || ''}`,
    `Notes: ${context.notes || ''}`,
    '',
  ].join('\n');

  const brandSection = [
    '--- BRAND ---',
    `Brand Name: ${brand.brandName || ''}`,
    `Owner Name: ${brand.ownerName || ''}`,
    `Email: ${brand.email || ''}`,
    `Phone: ${brand.phone || ''}`,
    `Website: ${brand.website || ''}`,
    `Address: ${brand.address || ''}`,
    `Legal Notes: ${brand.legalNotes || ''}`,
    `Payment Notes: ${brand.paymentNotes || ''}`,
    `Signature Name: ${brand.signatureName || ''}`,
    '',
  ].join('\n');

  const toneSection = [
    '--- STYLE ---',
    `Tone: ${tone || 'professional'}`,
    `Language: ${language}`,
    '',
  ].join('\n');

  const modeSection = [
    '--- MODE RULES ---',
    ...(modeRules[mode] || modeRules.improve_document),
    '',
  ].join('\n');

  const instructionSection = instructions
    ? [
        '--- USER INSTRUCTIONS ---',
        truncate(instructions, MAX_INSTRUCTIONS_LENGTH),
        '',
      ].join('\n')
    : '';

  return [safetyHeader, modeSection, docSection, contextSection, brandSection, toneSection, instructionSection].join('\n');
};

const buildTestPrompt = () => [
  'Return only valid JSON exactly in this shape:',
  outputShape,
  'Use the following values exactly:',
  'summary: Hello from AI Document Assistant',
  'improvedContent: empty string',
  'risks: empty array',
  'missingClauses: empty array',
  'suggestedSections: empty array',
  'questionsToReview: empty array',
  'nextActions: empty array',
].join('\n');

const analyzeResponse = async ({ apiKey, model, prompt }) => {
  const firstAttempt = await requestGemini({ apiKey, model, prompt, useResponseMimeType: true });

  const parseAttempt = (attempt, parseStep) => {
    const text = readGeminiResponseText(attempt.data);
    const parsed = extractFirstJsonObject(text);
    const result = parsed ? normalizeResult(parsed) : normalizeResult({});
    return {
      success: Boolean(parsed),
      status: attempt.status,
      text,
      result,
      parseStep,
      providerError: null,
    };
  };

  if (firstAttempt.ok) {
    return parseAttempt(firstAttempt, 'json_parse');
  }

  const mimeRelated = /responseMimeType|mime|JSON|application\/json/i.test(firstAttempt.error?.message || '');
  if (!mimeRelated) {
    return {
      success: false,
      status: firstAttempt.status,
      text: firstAttempt.rawText,
      result: null,
      parseStep: 'provider_error',
      providerError: firstAttempt.error,
    };
  }

  const retryAttempt = await requestGemini({ apiKey, model, prompt, useResponseMimeType: false });
  if (retryAttempt.ok) {
    return parseAttempt(retryAttempt, 'retry_without_response_mime_type');
  }

  return {
    success: false,
    status: retryAttempt.status,
    text: retryAttempt.rawText,
    result: null,
    parseStep: 'provider_error',
    providerError: retryAttempt.error,
  };
};

const isQuotaError = (errorResult) => {
  const status = Number(errorResult?.status || 0);
  const code = String(errorResult?.code || '');
  const message = String(errorResult?.message || '');
  return status === 429 || code === '429' || /quota|resource has been exhausted|rate limit/i.test(message);
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

    const { provider, apiKey, model } = getProviderConfig();

    if (req.method === 'GET') {
      if (req?.query?.health === '1') {
        return toSafeJson(res, 200, {
          success: true,
          route: 'api/ai-document.js',
          provider: provider || process.env.AI_PROVIDER || 'gemini',
          configured: provider === 'gemini' && Boolean(apiKey),
          model,
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

    if (provider !== 'gemini' || !apiKey) {
      return toSafeJson(res, 500, { success: false, error: 'AI provider is not configured.' });
    }

    if (body?.testProvider === true) {
      const testResult = await analyzeResponse({ apiKey, model, prompt: buildTestPrompt() });

      if (testResult.success) {
        return toSafeJson(res, 200, {
          success: true,
          result: testResult.result,
          debug: {
            providerStatus: testResult.status,
            model,
            responseTextLength: testResult.text.length,
            parseStep: testResult.parseStep,
          },
        });
      }

      if (isQuotaError(testResult.providerError)) {
        return toSafeJson(res, 429, {
          success: false,
          code: 'AI_QUOTA_EXCEEDED',
          error: 'AI quota exceeded. Try again later or change Gemini model.',
          debug: {
            providerStatus: testResult.status,
            model,
            responseTextLength: testResult.text ? testResult.text.length : 0,
            parseStep: testResult.parseStep,
          },
        });
      }

      return toSafeJson(res, 500, {
        success: false,
        error: 'Unable to generate a clean response.',
        debug: {
          providerStatus: testResult.status,
          model,
          responseTextLength: testResult.text ? testResult.text.length : 0,
          parseStep: testResult.parseStep,
        },
      });
    }

    const mode = toCleanString(body?.mode);
    const documentType = normalizeDocumentType(body?.documentType);
    const language = normalizeLanguage(body?.language);
    const tone = normalizeTone(body?.tone);

    if (!mode || !documentType || !language) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid AI document request.' });
    }

    const document = truncateDocument(body?.document);
    const context = truncateContext(body?.context);
    const brand = truncateBrand(body?.brand);
    const instructions = truncate(body?.instructions, MAX_INSTRUCTIONS_LENGTH);

    const prompt = buildPrompt({
      mode,
      documentType,
      language,
      tone,
      document,
      context,
      brand,
      instructions,
    });

    const analysis = await analyzeResponse({ apiKey, model, prompt });

    if (analysis.success) {
      return toSafeJson(res, 200, {
        success: true,
        result: analysis.result,
      });
    }

    if (isQuotaError(analysis.providerError)) {
      return toSafeJson(res, 429, {
        success: false,
        code: 'AI_QUOTA_EXCEEDED',
        error: 'AI quota exceeded. Try again later or change Gemini model.',
      });
    }

    console.error('[AI Document] Failed to generate output', {
      route: 'ai-document',
      phase: 'generate',
      message: analysis.providerError?.message || 'Unknown error',
      providerStatus: analysis.status,
    });

    return toSafeJson(res, 500, {
      success: false,
      error: 'AI document assistant could not generate a response.',
    });
  } catch (error) {
    console.error('[AI Document] Unhandled error', {
      route: 'ai-document',
      phase: 'unhandled',
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return toSafeJson(res, 500, {
      success: false,
      error: 'AI document assistant failed.',
    });
  }
}