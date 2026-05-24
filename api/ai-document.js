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

const requestGemini = async ({ apiKey, model, prompt }) => {
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
      maxOutputTokens: 2800,
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

const extractTag = (text, tagName) => {
  const raw = toCleanString(text);
  if (!raw) return '';
  const match = raw.match(new RegExp(`<${tagName}>\\s*([\\s\\S]*?)\\s*<\\/${tagName}>`, 'i'));
  return match ? match[1].trim() : '';
};

const parseBulletList = (sectionText) => toCleanString(sectionText)
  .split('\n')
  .map((line) => line.replace(/^\s*[-*•]\s*/, '').trim())
  .filter(Boolean);

const stripTaggedLabels = (text) => toCleanString(text)
  .replace(/<\/?SUMMARY>/gi, '')
  .replace(/<\/?IMPROVED_CONTENT>/gi, '')
  .replace(/<\/?RISKS>/gi, '')
  .replace(/<\/?MISSING_CLAUSES>/gi, '')
  .replace(/<\/?SUGGESTED_SECTIONS>/gi, '')
  .replace(/<\/?QUESTIONS_TO_REVIEW>/gi, '')
  .replace(/<\/?NEXT_ACTIONS>/gi, '')
  .replace(/^\s*[-*•]\s*/gm, '')
  .trim();

const parseAiDocumentTaggedResponse = (text) => {
  const rawText = toCleanString(text);
  const summary = extractTag(rawText, 'SUMMARY');
  const improvedContent = extractTag(rawText, 'IMPROVED_CONTENT');
  const risks = parseBulletList(extractTag(rawText, 'RISKS'));
  const missingClauses = parseBulletList(extractTag(rawText, 'MISSING_CLAUSES'));
  const suggestedSections = parseBulletList(extractTag(rawText, 'SUGGESTED_SECTIONS'));
  const questionsToReview = parseBulletList(extractTag(rawText, 'QUESTIONS_TO_REVIEW'));
  const nextActions = parseBulletList(extractTag(rawText, 'NEXT_ACTIONS'));

  const tagsFound = {
    summary: Boolean(summary),
    improvedContent: Boolean(improvedContent),
    risks: Boolean(extractTag(rawText, 'RISKS')),
    missingClauses: Boolean(extractTag(rawText, 'MISSING_CLAUSES')),
    suggestedSections: Boolean(extractTag(rawText, 'SUGGESTED_SECTIONS')),
    questionsToReview: Boolean(extractTag(rawText, 'QUESTIONS_TO_REVIEW')),
    nextActions: Boolean(extractTag(rawText, 'NEXT_ACTIONS')),
  };

  return {
    summary,
    improvedContent,
    risks,
    missingClauses,
    suggestedSections,
    questionsToReview,
    nextActions,
    tagsFound,
  };
};

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

const getAnalysisErrorMessage = (errorResult, fallback = 'Unable to generate document response.') => {
  if (!errorResult) return fallback;
  const message = String(errorResult.message || errorResult.statusText || '').trim();
  return message || fallback;
};

const analyzeResponse = async ({ apiKey, model, prompt, mode }) => {
  const attempt = await requestGemini({ apiKey, model, prompt });
  const responseText = readGeminiResponseText(attempt.data);

  if (!responseText) {
    return {
      success: false,
      status: attempt.status,
      text: responseText,
      result: null,
      parseStep: 'empty_response',
      providerError: attempt.ok ? null : attempt.error,
      tagsFound: {
        summary: false,
        improvedContent: false,
        risks: false,
        missingClauses: false,
        suggestedSections: false,
        questionsToReview: false,
        nextActions: false,
      },
    };
  }

  const parsed = parseAiDocumentTaggedResponse(responseText);
  const isContentMode = ['create_template', 'improve_document', 'rewrite_tone', 'translate_document', 'adapt_to_project'].includes(mode);
  const result = {
    summary: parsed.summary || 'AI generated a document response. Please review before using.',
    improvedContent: parsed.improvedContent,
    risks: parsed.risks,
    missingClauses: parsed.missingClauses,
    suggestedSections: parsed.suggestedSections,
    questionsToReview: parsed.questionsToReview,
    nextActions: parsed.nextActions,
  };

  if (!result.improvedContent && isContentMode) {
    result.improvedContent = stripTaggedLabels(responseText);
  }

  const hasAnyParsedContent = Boolean(
    result.summary ||
    result.improvedContent ||
    result.risks.length ||
    result.missingClauses.length ||
    result.suggestedSections.length ||
    result.questionsToReview.length ||
    result.nextActions.length,
  );

  if (!hasAnyParsedContent) {
    return {
      success: false,
      status: attempt.status,
      text: responseText,
      result: null,
      parseStep: 'empty_response',
      providerError: attempt.ok ? null : attempt.error,
      tagsFound: parsed.tagsFound,
    };
  }

  return {
    success: true,
    status: attempt.status,
    text: responseText,
    result,
    parseStep: parsed.tagsFound.summary || parsed.tagsFound.improvedContent || parsed.tagsFound.risks || parsed.tagsFound.missingClauses || parsed.tagsFound.suggestedSections || parsed.tagsFound.questionsToReview || parsed.tagsFound.nextActions
      ? 'tagged_parse_success'
      : 'tagged_parse_partial',
    providerError: attempt.ok ? null : attempt.error,
    tagsFound: parsed.tagsFound,
  };
};

const languageInstruction = (language) => {
  if (language === 'arabic') return 'All string values must be in Arabic only. Keep JSON keys exactly as specified.';
  if (language === 'french') return 'All string values must be in French only. Keep JSON keys exactly as specified.';
  return 'All string values must be in English only. Keep JSON keys exactly as specified.';
};

const outputShape = [
  '<SUMMARY>Short summary here.</SUMMARY>',
  '<IMPROVED_CONTENT>Full generated or improved document content here.</IMPROVED_CONTENT>',
  '<RISKS>',
  '- risk 1',
  '- risk 2',
  '</RISKS>',
  '<MISSING_CLAUSES>',
  '- missing clause 1',
  '</MISSING_CLAUSES>',
  '<SUGGESTED_SECTIONS>',
  '- section 1',
  '</SUGGESTED_SECTIONS>',
  '<QUESTIONS_TO_REVIEW>',
  '- question 1',
  '</QUESTIONS_TO_REVIEW>',
  '<NEXT_ACTIONS>',
  '- action 1',
  '</NEXT_ACTIONS>',
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
      'Put the full reusable template in <IMPROVED_CONTENT>.',
      'Include the included sections in <SUGGESTED_SECTIONS>.',
      'Include only sections relevant to the selected document type.',
    ],
    improve_document: [
      'Rewrite the document for clarity, structure, and professional tone.',
      'Keep the original meaning and do not invent facts.',
      'Put the full revised document in <IMPROVED_CONTENT>.',
    ],
    risk_review: [
      'Focus on ambiguity, missing information, unclear scope, unclear payment terms, unclear timelines, unclear responsibilities, unclear acceptance criteria, unclear cancellation terms, and unclear revision terms.',
      'Do not provide legal advice.',
      'Keep <IMPROVED_CONTENT> empty unless a short safer wording is genuinely helpful.',
    ],
    missing_clauses: [
      'Identify possible missing sections without claiming legal necessity.',
      'Put the main output in <MISSING_CLAUSES>, <SUGGESTED_SECTIONS>, and <QUESTIONS_TO_REVIEW>.',
      'Do not provide legal advice.',
    ],
    adapt_to_project: [
      'Adapt the document to the project and client context without inventing facts.',
      'If key information is missing, add questionsToReview.',
      'Keep the user intent and structure clear.',
    ],
    summarize_document: [
      'Summarize the document clearly and concisely.',
      'Put the main output in <SUMMARY>.',
      'Keep <IMPROVED_CONTENT> empty unless a compact summary rewrite is helpful.',
    ],
    rewrite_tone: [
      'Rewrite the document using the selected tone while preserving meaning.',
      'Put the full rewritten version in <IMPROVED_CONTENT>.',
    ],
    translate_document: [
      'Translate the document content into the selected language while preserving structure.',
      'Put the full translation in <IMPROVED_CONTENT>.',
    ],
  };

  const safetyHeader = [
    'You are AI Document Assistant v1.',
    'You help with drafting, clarity, structure, missing sections, ambiguity review, summarizing, adapting to project/client context, and review questions only.',
    'You are not a lawyer and you do not provide legal advice.',
    'Do not claim legal validity or enforceability.',
    'Do not guarantee outcomes.',
    'Do not overwrite user content automatically.',
    'Return only the tagged format. No JSON. No markdown fences. No commentary outside the tags.',
    'Use cautious, practical language.',
    languageInstruction(language),
    '',
    'Output must use these tags exactly:',
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
  'Return only tagged text exactly in this shape:',
  outputShape,
  'Use the following values exactly inside the tags:',
  '<SUMMARY>Hello from AI Document Assistant</SUMMARY>',
  '<IMPROVED_CONTENT></IMPROVED_CONTENT>',
  '<RISKS></RISKS>',
  '<MISSING_CLAUSES></MISSING_CLAUSES>',
  '<SUGGESTED_SECTIONS></SUGGESTED_SECTIONS>',
  '<QUESTIONS_TO_REVIEW></QUESTIONS_TO_REVIEW>',
  '<NEXT_ACTIONS></NEXT_ACTIONS>',
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
      const testResult = await analyzeResponse({ apiKey, model, prompt: buildTestPrompt(), mode: 'create_template' });

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
            tagsFound: testResult.tagsFound,
          },
        });
      }

      phase = testResult.parseStep === 'empty_response' ? 'parse_response' : 'provider_response';

      if (isQuotaError(testResult.providerError)) {
        return buildFailure(res, 429, 'AI quota exceeded. Try again later or change Gemini model.', debugRequested ? buildDebug({
          phase,
          providerStatus: testResult.status,
          providerErrorMessage: getAnalysisErrorMessage(testResult.providerError),
          responseTextLength: testResult.text ? testResult.text.length : 0,
          parseStep: testResult.parseStep,
          tagsFound: testResult.tagsFound,
        }) : null, 'AI_QUOTA_EXCEEDED');
      }

      const providerStatus = Number(testResult.status || 0);
      const errorMessage = 'AI document assistant could not generate a usable response.';

      if (debugRequested) {
        return buildFailure(res, providerStatus === 400 ? 400 : 500, errorMessage, buildDebug({
          phase: providerStatus === 400 ? 'provider_response' : 'parse_response',
          providerStatus: testResult.status,
          providerErrorMessage: getAnalysisErrorMessage(testResult.providerError),
          responseTextLength: testResult.text ? testResult.text.length : 0,
          parseStep: testResult.parseStep,
          tagsFound: testResult.tagsFound,
        }));
      }

      return buildFailure(res, providerStatus === 400 ? 400 : 500, errorMessage);
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
    const analysis = await analyzeResponse({ apiKey, model, prompt, mode });

    phase = analysis.success ? 'normalize_result' : (analysis.parseStep === 'empty_response' ? 'parse_response' : 'provider_response');

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
          tagsFound: analysis.tagsFound,
        }), 'AI_QUOTA_EXCEEDED');
      }

      return buildFailure(res, 429, 'AI quota exceeded. Try again later or change Gemini model.', null, 'AI_QUOTA_EXCEEDED');
    }

    const providerStatus = Number(analysis.status || 0);
    const providerErrorMessage = getAnalysisErrorMessage(analysis.providerError);
    const errorMessage = 'AI document assistant could not generate a usable response.';

    if (debugRequested) {
      return buildFailure(res, providerStatus === 400 ? 400 : 500, errorMessage, buildDebug({
        ...debugBase,
        phase: providerStatus === 400 ? 'provider_response' : phase,
        providerStatus: analysis.status,
        providerErrorMessage,
        responseTextLength: analysis.text ? analysis.text.length : 0,
        parseStep: analysis.parseStep,
        tagsFound: analysis.tagsFound,
      }));
    }

    return buildFailure(res, providerStatus === 400 ? 400 : 500, errorMessage);
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