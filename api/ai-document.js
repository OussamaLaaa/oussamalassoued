const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const DEFAULT_MODEL = 'gemini-1.5-flash';
const MAX_CONTENT_CHARS = 12000;
const MAX_CONTEXT_LENGTH = 2000;
const MAX_INSTRUCTIONS_LENGTH = 2000;

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

const buildDebug = (overrides = {}) => ({
  phase: 'start',
  mode: '',
  documentType: '',
  language: '',
  tone: '',
  hasDocumentContent: false,
  documentContentLength: 0,
  instructionsLength: 0,
  providerStatus: null,
  providerErrorMessage: '',
  responseTextLength: 0,
  parseStep: 'not_started',
  parseErrorMessage: '',
  validationError: '',
  retryWithoutJsonMimeUsed: false,
  ...overrides,
});

const buildFailure = (res, status, error, debug, code) => toSafeJson(res, status, {
  success: false,
  ...(code ? { code } : {}),
  error,
  ...(debug ? { debug } : {}),
});

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

const normalizeContentLines = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => truncate(item, 1000))
    .map((item) => item.replace(/\r/g, '').trim())
    .filter(Boolean);
};

const normalizeResult = (analysis) => ({
  summary: truncate(analysis?.summary, 1000),
  improvedContentLines: normalizeContentLines(analysis?.improvedContentLines),
  improvedContent: (() => {
    const directContent = toCleanString(analysis?.improvedContent);
    if (directContent) return truncate(directContent, MAX_CONTENT_CHARS);
    return normalizeContentLines(analysis?.improvedContentLines).join('\n');
  })(),
  risks: normalizeList(analysis?.risks),
  missingClauses: normalizeList(analysis?.missingClauses),
  suggestedSections: normalizeList(analysis?.suggestedSections),
  questionsToReview: normalizeList(analysis?.questionsToReview),
  nextActions: normalizeList(analysis?.nextActions),
});

const truncateDocument = (document = {}) => ({
  title: truncate(document.title, 300),
  type: normalizeDocumentType(document.type),
  content: truncate(document.content, MAX_CONTENT_CHARS),
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

const validateAnalysis = (analysis) => {
  if (!analysis || typeof analysis !== 'object') return null;
  return normalizeResult(analysis);
};

const parseAnalysisText = (value) => {
  const rawText = toCleanString(value);
  const cleaned = rawText.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  if (!cleaned) {
    return {
      analysis: null,
      parseStep: 'empty_text',
      parseErrorMessage: 'Empty Gemini response text.',
      responseText: rawText,
    };
  }

  try {
    return {
      analysis: JSON.parse(cleaned),
      parseStep: 'json_parse',
      parseErrorMessage: '',
      responseText: rawText,
    };
  } catch (error) {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return {
          analysis: JSON.parse(cleaned.slice(start, end + 1)),
          parseStep: 'substring_json_parse',
          parseErrorMessage: '',
          responseText: rawText,
        };
      } catch (substringError) {
        return {
          analysis: null,
          parseStep: 'substring_json_parse_failed',
          parseErrorMessage: substringError instanceof Error ? substringError.message : 'Unable to parse JSON substring.',
          responseText: rawText,
        };
      }
    }

    return {
      analysis: null,
      parseStep: 'json_parse_failed',
      parseErrorMessage: error instanceof Error ? error.message : 'Unable to parse Gemini JSON response.',
      responseText: rawText,
    };
  }
};

const getAnalysisErrorMessage = (errorResult, fallback = 'Unable to generate document response.') => {
  if (!errorResult) return fallback;
  const message = String(errorResult.message || errorResult.statusText || '').trim();
  return message || fallback;
};

const analyzeResponse = async ({ apiKey, model, prompt }) => {
  const firstAttempt = await requestGemini({ apiKey, model, prompt, useResponseMimeType: true });
  const firstText = readGeminiResponseText(firstAttempt.data);
  const firstParsed = parseAnalysisText(firstText);
  const firstValidated = validateAnalysis(firstParsed.analysis);

  if (firstAttempt.ok && firstValidated) {
    return {
      success: true,
      status: firstAttempt.status,
      text: firstText,
      result: firstValidated,
      parseStep: firstParsed.parseStep,
      parseErrorMessage: '',
      providerError: null,
      retryWithoutJsonMimeUsed: false,
    };
  }

  const firstParseFailure = firstAttempt.ok && !firstValidated;
  const mimeRelated = !firstAttempt.ok && /responseMimeType|mime|JSON|application\/json/i.test(firstAttempt.error?.message || '');
  if (!firstParseFailure && !firstAttempt.ok && !mimeRelated) {
    return {
      success: false,
      status: firstAttempt.status,
      text: firstAttempt.rawText,
      result: null,
      parseStep: 'provider_error',
      parseErrorMessage: '',
      providerError: firstAttempt.error,
      retryWithoutJsonMimeUsed: false,
    };
  }

  const retryAttempt = await requestGemini({ apiKey, model, prompt, useResponseMimeType: false });
  const retryText = readGeminiResponseText(retryAttempt.data);
  const retryParsed = parseAnalysisText(retryText);
  const retryValidated = validateAnalysis(retryParsed.analysis);

  if (retryAttempt.ok && retryValidated) {
    return {
      success: true,
      status: retryAttempt.status,
      text: retryText,
      result: retryValidated,
      parseStep: retryParsed.parseStep,
      parseErrorMessage: '',
      providerError: null,
      retryWithoutJsonMimeUsed: true,
    };
  }

  return {
    success: false,
    status: retryAttempt.ok ? retryAttempt.status : firstAttempt.status,
    text: retryText || firstText || retryAttempt.rawText || firstAttempt.rawText,
    result: null,
    parseStep: retryParsed.parseStep === 'empty_text' && firstParsed.parseStep !== 'empty_text' ? firstParsed.parseStep : retryParsed.parseStep,
    parseErrorMessage: retryParsed.parseErrorMessage || firstParsed.parseErrorMessage || '',
    providerError: retryAttempt.ok ? null : retryAttempt.error || firstAttempt.error,
    retryWithoutJsonMimeUsed: true,
  };
};

const languageInstruction = (language) => {
  if (language === 'arabic') return 'All string values must be in Arabic only. Keep JSON keys exactly as specified.';
  if (language === 'french') return 'All string values must be in French only. Keep JSON keys exactly as specified.';
  return 'All string values must be in English only. Keep JSON keys exactly as specified.';
};

const outputShape = [
  '{',
  '  "summary": "short explanation of the AI result",',
  '  "improvedContentLines": ["string"],',
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
      'Put the full template in improvedContentLines.',
      'Use one array item per heading, paragraph, or bullet.',
      'Include only sections relevant to the selected document type.',
    ],
    improve_document: [
      'Rewrite the document for clarity, structure, and professional tone.',
      'Keep the original meaning and do not invent facts.',
      'Put the full revised document in improvedContentLines.',
    ],
    risk_review: [
      'Focus on ambiguity, missing information, unclear scope, unclear payment terms, unclear timelines, unclear responsibilities, unclear acceptance criteria, unclear cancellation terms, and unclear revision terms.',
      'Do not provide legal advice.',
      'Keep improvedContentLines empty unless a short safer wording is genuinely helpful.',
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
      'Keep improvedContentLines empty unless a compact summary rewrite is helpful.',
    ],
    rewrite_tone: [
      'Rewrite the document using the selected tone while preserving meaning.',
      'Put the full rewritten version in improvedContentLines.',
    ],
    translate_document: [
      'Translate the document content into the selected language while preserving structure.',
      'Put the full translation in improvedContentLines.',
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
    'Do not include newline characters inside individual JSON strings.',
    'Do not include unescaped quotes inside strings.',
    'If quotation marks are needed, prefer single quotes or avoid quotes.',
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
  'improvedContentLines: empty array',
  'risks: empty array',
  'missingClauses: empty array',
  'suggestedSections: empty array',
  'questionsToReview: empty array',
  'nextActions: empty array',
].join('\n');

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

  let phase = 'start';

  try {
    phase = 'parse_body';
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    phase = 'validate';
    const { provider, apiKey, model } = getProviderConfig();

    if (req.method === 'GET') {
      phase = 'success';
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

    phase = 'auth';
    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Unauthorized' });
    }

    phase = 'parse_body';
    const body = readBody(req);
    const debugRequested = Boolean(body?.debug);

    if (body?.testProvider === true) {
      phase = 'build_prompt';
      const testResult = await analyzeResponse({ apiKey, model, prompt: buildTestPrompt() });

      if (testResult.success) {
        phase = 'success';
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

      phase = testResult.parseStep === 'provider_error' ? 'provider_response' : 'parse_response';

      if (isQuotaError(testResult.providerError)) {
        return buildFailure(res, 429, 'AI quota exceeded. Try again later or change Gemini model.', debugRequested ? buildDebug({
          phase,
          providerStatus: testResult.status,
          providerErrorMessage: getAnalysisErrorMessage(testResult.providerError),
          responseTextLength: testResult.text ? testResult.text.length : 0,
          parseStep: testResult.parseStep,
          parseErrorMessage: testResult.parseErrorMessage || '',
          retryWithoutJsonMimeUsed: Boolean(testResult.retryWithoutJsonMimeUsed),
        }) : null, 'AI_QUOTA_EXCEEDED');
      }

      const providerStatus = Number(testResult.status || 0);
      const errorMessage = providerStatus === 400
        ? 'AI provider rejected the document request.'
        : testResult.parseStep === 'json_parse_failed' || testResult.parseStep === 'substring_json_parse_failed' || testResult.parseStep === 'empty_text'
          ? 'AI returned an invalid document response.'
          : 'Unable to generate document response.';

      if (debugRequested) {
        return buildFailure(res, providerStatus === 400 ? 400 : 500, errorMessage, buildDebug({
          phase: providerStatus === 400 ? 'provider_response' : 'parse_response',
          providerStatus: testResult.status,
          providerErrorMessage: getAnalysisErrorMessage(testResult.providerError),
          responseTextLength: testResult.text ? testResult.text.length : 0,
          parseStep: testResult.parseStep,
          parseErrorMessage: testResult.parseErrorMessage || (testResult.parseStep === 'provider_error' ? getAnalysisErrorMessage(testResult.providerError) : ''),
          retryWithoutJsonMimeUsed: Boolean(testResult.retryWithoutJsonMimeUsed),
        }), providerStatus === 400 ? undefined : undefined);
      }

      return buildFailure(res, providerStatus === 400 ? 400 : 500, errorMessage, null, providerStatus === 400 ? undefined : undefined);
    }

    phase = 'validate';
    const mode = toCleanString(body?.mode);
    const documentType = normalizeDocumentType(body?.documentType);
    const language = normalizeLanguage(body?.language);
    const tone = normalizeTone(body?.tone);

    if (!mode || !documentType || !language) {
      phase = 'validate';
      return buildFailure(
        res,
        400,
        'Invalid AI document request.',
        debugRequested ? buildDebug({
          phase,
          mode,
          documentType,
          language,
          tone,
          hasDocumentContent: false,
          documentContentLength: 0,
          instructionsLength: 0,
          validationError: 'mode, documentType, and language are required.',
        }) : null,
      );
    }

    phase = 'sanitize_payload';
    const document = truncateDocument(body?.document);
    const context = truncateContext(body?.context);
    const brand = truncateBrand(body?.brand);
    const instructions = truncate(body?.instructions, MAX_INSTRUCTIONS_LENGTH);

    const documentContent = toCleanString(body?.document?.content);
    const debugBase = debugRequested ? buildDebug({
      phase,
      mode,
      documentType,
      language,
      tone,
      hasDocumentContent: Boolean(documentContent),
      documentContentLength: documentContent.length,
      instructionsLength: instructions.length,
    }) : null;

    if (provider !== 'gemini' || !apiKey) {
      return buildFailure(
        res,
        500,
        'AI provider is not configured.',
        debugRequested ? buildDebug({
          ...(debugBase || {}),
          phase,
          providerStatus: null,
          providerErrorMessage: 'AI provider is not configured.',
          validationError: 'Missing AI provider configuration.',
        }) : null,
      );
    }

    phase = 'build_prompt';
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

    phase = 'provider_request';
    const analysis = await analyzeResponse({ apiKey, model, prompt });

    phase = analysis.success ? 'normalize_result' : (analysis.parseStep === 'provider_error' ? 'provider_response' : 'parse_response');

    if (analysis.success) {
      phase = 'success';
      return toSafeJson(res, 200, {
        success: true,
        result: analysis.result,
      });
    }

    if (isQuotaError(analysis.providerError)) {
      if (debugRequested) {
        return buildFailure(res, 429, 'AI quota exceeded. Try again later or change Gemini model.', buildDebug({
          ...debugBase,
          phase,
          providerStatus: analysis.status,
          providerErrorMessage: getAnalysisErrorMessage(analysis.providerError),
          responseTextLength: analysis.text ? analysis.text.length : 0,
          parseStep: analysis.parseStep,
          parseErrorMessage: analysis.parseErrorMessage || '',
          retryWithoutJsonMimeUsed: Boolean(analysis.retryWithoutJsonMimeUsed),
        }), 'AI_QUOTA_EXCEEDED');
      }

      return buildFailure(res, 429, 'AI quota exceeded. Try again later or change Gemini model.', null, 'AI_QUOTA_EXCEEDED');
    }

    const providerStatus = Number(analysis.status || 0);
    const providerErrorMessage = getAnalysisErrorMessage(analysis.providerError);
    const parseFailed = analysis.parseStep === 'json_parse_failed' || analysis.parseStep === 'substring_json_parse_failed' || analysis.parseStep === 'empty_text';
    const errorMessage = providerStatus === 400
      ? 'AI provider rejected the document request.'
      : parseFailed
        ? 'AI returned an invalid document response.'
        : 'Unable to generate document response.';

    if (debugRequested) {
      return buildFailure(res, providerStatus === 400 ? 400 : 500, errorMessage, buildDebug({
        ...debugBase,
        phase: providerStatus === 400 ? 'provider_response' : parseFailed ? 'parse_response' : phase,
        providerStatus: analysis.status,
        providerErrorMessage,
        responseTextLength: analysis.text ? analysis.text.length : 0,
        parseStep: analysis.parseStep,
        parseErrorMessage: analysis.parseErrorMessage || (parseFailed ? 'Gemini returned invalid JSON.' : ''),
        validationError: analysis.success ? '' : (parseFailed ? 'Response could not be parsed as JSON.' : ''),
        retryWithoutJsonMimeUsed: Boolean(analysis.retryWithoutJsonMimeUsed),
      }), providerStatus === 400 ? undefined : undefined);
    }

    return buildFailure(res, providerStatus === 400 ? 400 : 500, errorMessage, null, providerStatus === 400 ? undefined : undefined);
  } catch (error) {
    return buildFailure(res, 500, 'AI document assistant failed.', buildDebug({
      phase,
      providerStatus: null,
      providerErrorMessage: error instanceof Error ? error.message : 'Unknown error',
      parseStep: 'unhandled_error',
      parseErrorMessage: error instanceof Error ? error.message : 'Unknown error',
    }));
  }
}