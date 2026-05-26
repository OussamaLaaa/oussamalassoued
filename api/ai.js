import aiMessageHandler from '../server/lib/aiMessageHandler.js';
import aiFinanceHandler from '../server/lib/aiFinanceHandler.js';
import aiDocumentHandler from '../server/lib/aiDocumentHandler.js';
import aiLeadScoringHandler from '../server/lib/aiLeadScoringHandler.js';
import aiRelationshipHandler from '../server/lib/aiRelationshipHandler.js';
import { createClient } from '@supabase/supabase-js';
import { encryptApiKey, decryptApiKey } from '../server/lib/aiKeyCrypto.js';
import aiProviderRouter from '../server/lib/aiProviderRouter.js';
import { requirePersonalAccess } from '../server/lib/personalAuth.js';

const { testProviderConnection, checkAIUseCaseStatus } = aiProviderRouter;

const ALLOWED_PROVIDERS = new Set(['gemini', 'openai', 'anthropic', 'openrouter', 'nvidia', 'azure_openai', 'ollama']);

const toSafeJson = (res, status, body) => res.status(status).json(body);

const cloneRequest = (req, overrides = {}) => ({
  ...req,
  query: { ...(req.query || {}), ...(overrides.query || {}) },
  body: overrides.body !== undefined ? overrides.body : req.body,
});

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

const toCleanString = (value) => (value == null ? '' : String(value).trim());

const NOTES_AI_MODES = new Set([
  'organize_note',
  'summarize_note',
  'correct_arabic',
  'improve_writing',
  'extract_tasks',
  'suggest_category_tags',
]);

const extractTaggedSection = (source, tag) => {
  const text = toCleanString(source);
  if (!text) return '';
  const match = new RegExp(`<${tag}>([\s\S]*?)<\/${tag}>`, 'i').exec(text);
  return match ? match[1].trim() : '';
};

const normalizeTaggedList = (source, tag) => {
  const section = extractTaggedSection(source, tag);
  if (!section) return [];

  return section
    .split(/\r?\n/)
    .flatMap((line) => line.split(','))
    .map((item) => item.trim().replace(/^[-*]\s*/, ''))
    .filter(Boolean);
};

const extractJsonCandidate = (source) => {
  const text = toCleanString(source);
  if (!text) return '';

  const fencedMatch = /```(?:json)?\s*([\s\S]*?)```/i.exec(text);
  const candidate = fencedMatch ? fencedMatch[1].trim() : text;
  const firstBrace = candidate.indexOf('{');
  const firstBracket = candidate.indexOf('[');
  const start = firstBrace === -1 ? firstBracket : firstBracket === -1 ? firstBrace : Math.min(firstBrace, firstBracket);

  if (start === -1) return candidate.trim();

  const trimmed = candidate.slice(start).trim();
  const openChar = trimmed[0];
  const closeChar = openChar === '[' ? ']' : '}';
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = 0; index < trimmed.length; index += 1) {
    const char = trimmed[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === '\\') {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
      continue;
    }

    if (char === openChar) depth += 1;
    if (char === closeChar) {
      depth -= 1;
      if (depth === 0) {
        return trimmed.slice(0, index + 1);
      }
    }
  }

  return trimmed;
};

const parseJsonSafely = (source) => {
  const candidate = extractJsonCandidate(source);
  if (!candidate) return null;

  try {
    return JSON.parse(candidate);
  } catch {
    return null;
  }
};

const toCompanyResearchExecutionConfig = () => {
  const apiKey = toCleanString(process.env.GEMINI_API_KEY);
  if (!apiKey) return null;

  return {
    disabled: false,
    provider: 'gemini',
    apiKey,
    model: toCleanString(process.env.GEMINI_MODEL) || 'gemini-2.5-flash',
    baseUrl: '',
    endpoint: '',
    deploymentName: '',
    apiVersion: '',
    temperature: 0.2,
    maxOutputTokens: 2200,
  };
};

const resolveCompanyResearchExecutionConfig = async ({ supabase }) => {
  if (supabase) {
    const companyResearchConfig = await aiProviderRouter.resolveAIExecutionConfig({ supabase, useCase: 'company_research', fallbackEnvGemini: false });
    if (companyResearchConfig?.disabled) return { disabled: true };
    if (companyResearchConfig) return { executionConfig: companyResearchConfig, sourceUseCase: 'company_research' };

    const researchConfig = await aiProviderRouter.resolveAIExecutionConfig({ supabase, useCase: 'research', fallbackEnvGemini: false });
    if (researchConfig?.disabled) return { disabled: true };
    if (researchConfig) return { executionConfig: researchConfig, sourceUseCase: 'research' };

    const strategyConfig = await aiProviderRouter.resolveAIExecutionConfig({ supabase, useCase: 'strategy', fallbackEnvGemini: false });
    if (strategyConfig?.disabled) return { disabled: true };
    if (strategyConfig) return { executionConfig: strategyConfig, sourceUseCase: 'strategy' };
  }

  const envExecution = toCompanyResearchExecutionConfig();
  return envExecution ? { executionConfig: envExecution, sourceUseCase: 'env' } : { disabled: true };
};

const normalizeCompanyResearchConfidence = (value) => {
  const cleaned = toCleanString(value).toLowerCase();
  if (cleaned === 'high' || cleaned === 'medium' || cleaned === 'low') return cleaned;
  return 'low';
};

const normalizeCompanyResearchResult = (raw) => {
  const safe = raw && typeof raw === 'object' ? raw : {};
  const company = safe.company && typeof safe.company === 'object' ? safe.company : {};

  const toNullableString = (value) => {
    const cleaned = toCleanString(value);
    return cleaned ? cleaned : null;
  };

  const normalizeDatabaseType = (value) => {
    const cleaned = toCleanString(value).toLowerCase();
    if (cleaned === 'big_company' || cleaned === 'sme' || cleaned === 'freelance' || cleaned === 'other') return cleaned;
    return null;
  };

  const normalizePriority = (value) => {
    const cleaned = toCleanString(value).toLowerCase();
    if (cleaned === 'high' || cleaned === 'medium' || cleaned === 'low') return cleaned;
    return null;
  };

  const normalizeEthicalFit = (value) => {
    const cleaned = toCleanString(value).toLowerCase();
    if (cleaned === 'good' || cleaned === 'needs_review' || cleaned === 'avoid') return cleaned;
    return null;
  };

  const normalizeScore = (value) => {
    const score = Number(value);
    if (!Number.isFinite(score)) return null;
    return Math.max(0, Math.min(10, Math.round(score)));
  };

  const contactMethods = Array.isArray(safe.contactMethods)
    ? safe.contactMethods
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        type: toNullableString(item.type),
        label: toNullableString(item.label),
        value: toNullableString(item.value),
        isPrimary: item.isPrimary == null ? null : Boolean(item.isPrimary),
        notes: toNullableString(item.notes),
        sourceUrl: toNullableString(item.sourceUrl),
        confidence: normalizeCompanyResearchConfidence(item.confidence),
      }))
      .filter((item) => item.value)
    : [];

  const problemProfile = safe.problemProfile && typeof safe.problemProfile === 'object'
    ? {
        problemTitle: toNullableString(safe.problemProfile.problemTitle),
        problemDescription: toNullableString(safe.problemProfile.problemDescription),
        currentSituation: toNullableString(safe.problemProfile.currentSituation),
        businessImpact: toNullableString(safe.problemProfile.businessImpact),
        proposedSolution: toNullableString(safe.problemProfile.proposedSolution),
        serviceAngle: toNullableString(safe.problemProfile.serviceAngle),
        valueProposition: toNullableString(safe.problemProfile.valueProposition),
        urgency: toNullableString(safe.problemProfile.urgency),
        confidence: normalizeCompanyResearchConfidence(safe.problemProfile.confidence),
        status: toNullableString(safe.problemProfile.status),
        notes: toNullableString(safe.problemProfile.notes),
      }
    : null;

  const outreachScript = safe.outreachScript && typeof safe.outreachScript === 'object'
    ? {
        name: toNullableString(safe.outreachScript.name),
        channel: toNullableString(safe.outreachScript.channel),
        language: toNullableString(safe.outreachScript.language),
        audience: toNullableString(safe.outreachScript.audience),
        goal: toNullableString(safe.outreachScript.goal),
        hook: toNullableString(safe.outreachScript.hook),
        messageBody: toNullableString(safe.outreachScript.messageBody),
        callScript: toNullableString(safe.outreachScript.callScript),
        objectionHandling: toNullableString(safe.outreachScript.objectionHandling),
        followUpMessage: toNullableString(safe.outreachScript.followUpMessage),
        status: toNullableString(safe.outreachScript.status),
        isActive: safe.outreachScript.isActive == null ? null : Boolean(safe.outreachScript.isActive),
        notes: toNullableString(safe.outreachScript.notes),
      }
    : null;

  const sources = Array.isArray(safe.sources)
    ? safe.sources
      .filter((item) => item && typeof item === 'object')
      .map((item) => ({
        title: toNullableString(item.title),
        url: toNullableString(item.url),
        usedFor: toNullableString(item.usedFor),
        confidence: normalizeCompanyResearchConfidence(item.confidence),
      }))
      .filter((item) => item.title || item.url)
    : [];

  const warnings = Array.isArray(safe.warnings)
    ? safe.warnings.map((item) => toNullableString(item)).filter(Boolean)
    : [];

  const confidence = normalizeCompanyResearchConfidence(safe.confidence);

  return {
    company: {
      name: toNullableString(company.name),
      legalName: toNullableString(company.legalName),
      description: toNullableString(company.description),
      databaseType: normalizeDatabaseType(company.databaseType),
      category: toNullableString(company.category),
      industry: toNullableString(company.industry),
      country: toNullableString(company.country),
      city: toNullableString(company.city),
      website: toNullableString(company.website),
      linkedin: toNullableString(company.linkedin),
      facebook: toNullableString(company.facebook),
      instagram: toNullableString(company.instagram),
      twitter: toNullableString(company.twitter),
      youtube: toNullableString(company.youtube),
      phone: toNullableString(company.phone),
      email: toNullableString(company.email),
      priority: normalizePriority(company.priority),
      fitScore: normalizeScore(company.fitScore),
      ethicalFit: normalizeEthicalFit(company.ethicalFit),
      status: toNullableString(company.status),
      nextAction: toNullableString(company.nextAction),
      notes: toNullableString(company.notes),
    },
    contactMethods,
    problemProfile,
    outreachScript,
    sources,
    warnings,
    confidence,
  };
};

const buildCompanyResearchPrompt = ({ companyName, countryHint, cityHint, industryHint, websiteHint, language }) => [
  'You are researching a company using only public business information.',
  'Do not invent facts. If uncertain, use null and low confidence.',
  'Prefer official websites and verified public profiles when available.',
  'Do not claim you searched the live web if you did not.',
  'If live web search is unavailable, say so in warnings and keep results conservative.',
  'Avoid personal emails unless they are clearly public business contact details.',
  'Respect Islamic and ethical principles. Avoid manipulative wording.',
  'Return strict JSON only. No markdown fences. No commentary.',
  'The JSON shape must be:',
  '{"company":{...},"contactMethods":[...],"problemProfile":{...}|null,"outreachScript":{...}|null,"sources":[...],"warnings":[...],"confidence":"low|medium|high"}',
  'Required company fields: name, legalName, description, databaseType, category, industry, country, city, website, linkedin, facebook, instagram, twitter, youtube, phone, email, priority, fitScore, ethicalFit, status, nextAction, notes.',
  'Allowed databaseType values: big_company, sme, freelance, other.',
  'Allowed priority values: high, medium, low.',
  'Allowed ethicalFit values: good, needs_review, avoid.',
  'Allowed confidence values: low, medium, high.',
  'If multiple companies match, choose the best match and add a warning.',
  'For company type, infer one of: big_company, sme, freelance, other.',
  'For fitScore, use an integer from 0 to 10.',
  'For contactMethods, only include public company contact methods and include sourceUrl when possible.',
  'For problemProfile and outreachScript, keep them concise, professional, and reviewable.',
  '',
  `Language: ${language || 'auto'}`,
  `Company name: ${companyName}`,
  `Country hint: ${countryHint || 'none'}`,
  `City hint: ${cityHint || 'none'}`,
  `Industry hint: ${industryHint || 'none'}`,
  `Website hint: ${websiteHint || 'none'}`,
].join('\n');

const handleCompanyResearchAction = async (req, res) => {
  const body = readBody(req);
  const companyName = toCleanString(body.companyName);
  const countryHint = toCleanString(body.countryHint);
  const cityHint = toCleanString(body.cityHint);
  const industryHint = toCleanString(body.industryHint);
  const websiteHint = toCleanString(body.websiteHint);
  const language = ['auto', 'english', 'french', 'arabic'].includes(toCleanString(body.language).toLowerCase()) ? toCleanString(body.language).toLowerCase() : 'auto';
  const debugRequested = body?.debug === true || body?.debug === 'true' || body?.debug === 1;

  if (!companyName) {
    return toSafeJson(res, 400, { success: false, error: 'Company name is required.' });
  }

  if (companyName.length > 160 || countryHint.length > 120 || cityHint.length > 120 || industryHint.length > 120 || websiteHint.length > 240) {
    return toSafeJson(res, 400, { success: false, error: 'Company research input is too long.' });
  }

  let supabase = null;
  try {
    supabase = createSupabaseClient();
  } catch {
    supabase = null;
  }

  const routing = await resolveCompanyResearchExecutionConfig({ supabase });
  if (routing?.disabled) {
    return toSafeJson(res, 503, { success: false, error: 'AI provider is not configured for company research.' });
  }

  if (!routing?.executionConfig) {
    return toSafeJson(res, 503, { success: false, error: 'AI provider is not configured for company research.' });
  }

  const prompt = buildCompanyResearchPrompt({
    companyName,
    countryHint,
    cityHint,
    industryHint,
    websiteHint,
    language,
  });

  try {
    const rawResponse = await aiProviderRouter.requestProviderCompletion({
      ...routing.executionConfig,
      prompt,
      temperature: 0.2,
      maxOutputTokens: 2200,
    });

    const parsed = parseJsonSafely(rawResponse);
    if (!parsed) {
      return toSafeJson(res, 500, {
        success: false,
        error: 'AI returned an unreadable response. Try again.',
        ...(debugRequested ? { debug: { sourceUseCase: routing.sourceUseCase, rawResponse } } : {}),
      });
    }

    const result = normalizeCompanyResearchResult(parsed);
    const warnings = [...result.warnings, 'Live web search is not configured. Results may be incomplete.'];

    return toSafeJson(res, 200, {
      success: true,
      result: {
        ...result,
        warnings,
      },
      ...(debugRequested ? { debug: { sourceUseCase: routing.sourceUseCase, rawResponse } } : {}),
    });
  } catch (error) {
    const errorMessage = error?.providerStatus === 401 ? 'Authentication required. Please log in again.' : 'Unable to research company.';
    return toSafeJson(res, error?.providerStatus === 401 ? 401 : 500, {
      success: false,
      error: errorMessage,
      ...(debugRequested ? {
        debug: {
          sourceUseCase: routing.sourceUseCase,
          providerStatus: error?.providerStatus ?? null,
          providerErrorStatus: error?.providerErrorStatus ?? null,
          providerErrorReason: error?.providerErrorReason ?? null,
        },
      } : {}),
    });
  }
};

const parseNotesTaskLine = (line) => {
  const cleaned = toCleanString(line).replace(/^[-*]\s*/, '');
  if (!cleaned) return null;

  try {
    const parsed = JSON.parse(cleaned);
    if (parsed && typeof parsed === 'object') {
      return {
        title: toCleanString(parsed.title || parsed.task || parsed.name),
        priority: toCleanString(parsed.priority),
        category: toCleanString(parsed.category),
        suggestedDueDate: toCleanString(parsed.suggestedDueDate || parsed.due || parsed.dueDate),
        notes: toCleanString(parsed.notes),
      };
    }
  } catch {
    // fall through to line parsing
  }

  const task = {
    title: '',
    priority: '',
    category: '',
    suggestedDueDate: '',
    notes: '',
  };

  const segments = cleaned.split('|').map((segment) => segment.trim()).filter(Boolean);
  if (!segments.length) return null;

  task.title = segments[0].replace(/^(title|task|name)\s*:\s*/i, '').trim() || cleaned;

  for (const segment of segments.slice(1)) {
    const colonIndex = segment.indexOf(':');
    if (colonIndex === -1) {
      task.notes = task.notes ? `${task.notes} ${segment}` : segment;
      continue;
    }

    const key = segment.slice(0, colonIndex).trim().toLowerCase();
    const value = segment.slice(colonIndex + 1).trim();
    if (!value) continue;

    if (key === 'title' || key === 'task' || key === 'name') task.title = value;
    else if (key === 'priority' || key === 'prio') task.priority = value;
    else if (key === 'category' || key === 'type') task.category = value;
    else if (key === 'due' || key === 'duedate' || key === 'suggesteddue' || key === 'suggestedduedate') task.suggestedDueDate = value;
    else if (key === 'notes' || key === 'note') task.notes = value;
  }

  return task.title ? task : null;
};

const parseNotesTaggedResponse = (rawText, mode) => {
  const text = toCleanString(rawText);
  if (!text) {
    throw new Error('AI returned an empty response.');
  }

  const summary = extractTaggedSection(text, 'SUMMARY');
  const improvedContent = extractTaggedSection(text, 'IMPROVED_CONTENT');
  const keyPoints = normalizeTaggedList(text, 'KEY_POINTS');
  const suggestedTasksSection = extractTaggedSection(text, 'SUGGESTED_TASKS');
  const suggestedTasks = suggestedTasksSection
    ? suggestedTasksSection
      .split(/\r?\n/)
      .map((line) => parseNotesTaskLine(line))
      .filter(Boolean)
    : [];
  const suggestedCategory = extractTaggedSection(text, 'SUGGESTED_CATEGORY');
  const suggestedTags = normalizeTaggedList(text, 'SUGGESTED_TAGS');
  const nextActions = normalizeTaggedList(text, 'NEXT_ACTIONS');

  const normalized = {
    summary,
    improvedContent,
    keyPoints,
    suggestedTasks,
    suggestedCategory,
    suggestedTags,
    nextActions,
  };

  if (!normalized.improvedContent && ['organize_note', 'improve_writing', 'correct_arabic'].includes(mode)) {
    normalized.improvedContent = text;
  }

  return normalized;
};

const toNotesExecutionConfig = () => {
  const apiKey = toCleanString(process.env.GEMINI_API_KEY);
  if (!apiKey) return null;

  return {
    disabled: false,
    provider: 'gemini',
    apiKey,
    model: toCleanString(process.env.GEMINI_MODEL) || 'gemini-2.5-flash',
    baseUrl: '',
    endpoint: '',
    deploymentName: '',
    apiVersion: '',
    temperature: 0.2,
    maxOutputTokens: 1200,
  };
};

const resolveNotesExecutionConfig = async ({ supabase }) => {
  if (supabase) {
    const notesConfig = await aiProviderRouter.resolveAIExecutionConfig({ supabase, useCase: 'notes', fallbackEnvGemini: false });
    if (notesConfig?.disabled) return { disabled: true };
    if (notesConfig) return { executionConfig: notesConfig, sourceUseCase: 'notes' };

    const cleanupConfig = await aiProviderRouter.resolveAIExecutionConfig({ supabase, useCase: 'cleanup', fallbackEnvGemini: false });
    if (cleanupConfig?.disabled) {
      const envExecution = toNotesExecutionConfig();
      return envExecution ? { executionConfig: envExecution, sourceUseCase: 'env' } : { disabled: true };
    }
    if (cleanupConfig) return { executionConfig: cleanupConfig, sourceUseCase: 'cleanup' };
  }

  const envExecution = toNotesExecutionConfig();
  return envExecution ? { executionConfig: envExecution, sourceUseCase: 'env' } : { disabled: true };
};

const buildNotesPrompt = ({ mode, note, blocks, attachments, context, instructions, language }) => {
  const modeRules = {
    organize_note: 'Restructure the note into clear headings, bullets, and sections while preserving meaning.',
    summarize_note: 'Provide a concise summary with key points and next actions only when they are obvious from the note.',
    correct_arabic: 'Correct Arabic grammar, spelling, and clarity naturally. Preserve tone and meaning. Do not over-formalize.',
    improve_writing: 'Improve clarity, flow, and readability while preserving intent and factual meaning.',
    extract_tasks: 'Extract actionable tasks only. Do not invent tasks. Each task should be concrete and reviewable.',
    suggest_category_tags: 'Suggest a helpful category slug or name, tags, and priority/status only if it is clearly useful.',
  };

  return [
    'You are AI Notes Assistant for an internal note editor.',
    'General rules:',
    '- Do not invent facts.',
    '- Preserve user intent.',
    '- If the note is Arabic, correct Arabic naturally.',
    '- If the note mixes languages, preserve meaning and improve clarity.',
    '- Keep output practical and reviewable.',
    '- Do not overwrite automatically.',
    '- Output only these tags and no commentary outside them:',
    '<SUMMARY>...</SUMMARY>',
    '<IMPROVED_CONTENT>...</IMPROVED_CONTENT>',
    '<KEY_POINTS>...</KEY_POINTS>',
    '<SUGGESTED_TASKS>...</SUGGESTED_TASKS>',
    '<SUGGESTED_CATEGORY>...</SUGGESTED_CATEGORY>',
    '<SUGGESTED_TAGS>...</SUGGESTED_TAGS>',
    '<NEXT_ACTIONS>...</NEXT_ACTIONS>',
    '',
    `Mode: ${mode}`,
    `Language: ${language || 'auto'}`,
    `Mode guidance: ${modeRules[mode] || 'Follow the general rules and keep the response structured.'}`,
    instructions ? `User instructions: ${instructions}` : 'User instructions: none',
    '',
    `Note: ${JSON.stringify(note || {}, null, 2)}`,
    `Blocks: ${JSON.stringify(Array.isArray(blocks) ? blocks : [], null, 2)}`,
    `Attachments: ${JSON.stringify(Array.isArray(attachments) ? attachments : [], null, 2)}`,
    `Context: ${JSON.stringify(context || {}, null, 2)}`,
  ].join('\n');
};

const mapNotesAiError = (error) => {
  const message = toCleanString(error?.message || error?.providerErrorReason || error?.providerErrorStatus || '');
  if (error?.providerStatus === 401 || /unauthori[sz]ed/i.test(message)) {
    return 'Authentication required. Please log in again.';
  }
  if (error?.providerStatus === 429 || /quota|rate limit|too many requests/i.test(message)) {
    return 'AI quota exceeded. Try again later or change AI model.';
  }
  if (/disabled/i.test(message) && /notes/i.test(message)) {
    return 'AI is disabled for notes.';
  }
  return 'AI could not process this note. Review manually.';
};

const buildNotesContextSummary = (value) => ({
  linkedProjectName: toCleanString(value?.linkedProjectName),
  linkedCompanyName: toCleanString(value?.linkedCompanyName),
  linkedPersonName: toCleanString(value?.linkedPersonName),
  linkedRelationshipName: toCleanString(value?.linkedRelationshipName),
  linkedTaskTitle: toCleanString(value?.linkedTaskTitle),
  linkedStrategyGoalTitle: toCleanString(value?.linkedStrategyGoalTitle),
  linkedPlanTitle: toCleanString(value?.linkedPlanTitle),
});

const createSupabaseClient = () => {
  const url = toCleanString(process.env.SUPABASE_URL);
  const serviceKey = toCleanString(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY);

  if (!url || !serviceKey) {
    throw new Error('Supabase is not configured.');
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
};

const ENCRYPTION_NOT_CONFIGURED_MSG = 'AI key encryption is not configured. Set AI_KEYS_ENCRYPTION_SECRET in Vercel and redeploy.';

const toSafeEncryptionError = (error) => {
  const msg = error instanceof Error ? error.message : '';
  return msg.includes('AI_KEYS_ENCRYPTION_SECRET') ? ENCRYPTION_NOT_CONFIGURED_MSG : msg;
};

const safeKeyRow = (row) => ({
  id: row?.id,
  label: row?.label || '',
  provider: row?.provider || '',
  apiKeyLast4: row?.api_key_last4 || row?.apiKeyLast4 || '',
  baseUrl: row?.base_url || row?.baseUrl || '',
  endpoint: row?.endpoint || '',
  deploymentName: row?.deployment_name || row?.deploymentName || '',
  apiVersion: row?.api_version || row?.apiVersion || '',
  isActive: row?.is_active == null ? true : Boolean(row.is_active),
  notes: row?.notes || '',
  createdAt: row?.created_at || row?.createdAt || null,
  updatedAt: row?.updated_at || row?.updatedAt || null,
});

const buildInsertPayload = (body, existingRow = null) => {
  const provider = toCleanString(body.provider || existingRow?.provider).toLowerCase();
  if (!ALLOWED_PROVIDERS.has(provider)) {
    throw new Error('Unsupported provider.');
  }

  const apiKey = toCleanString(body.apiKey);
  const encryptedKey = apiKey ? encryptApiKey(apiKey) : existingRow?.api_key_encrypted || existingRow?.apiKeyEncrypted || '';

  if (!encryptedKey && provider !== 'ollama') {
    throw new Error('API key is required.');
  }

  return {
    label: toCleanString(body.label || existingRow?.label),
    provider,
    api_key_encrypted: encryptedKey,
    api_key_last4: apiKey ? apiKey.slice(-4) : (existingRow?.api_key_last4 || existingRow?.apiKeyLast4 || ''),
    base_url: toCleanString(body.baseUrl || existingRow?.base_url || existingRow?.baseUrl || ''),
    endpoint: toCleanString(body.endpoint || existingRow?.endpoint || ''),
    deployment_name: toCleanString(body.deploymentName || existingRow?.deployment_name || existingRow?.deploymentName || ''),
    api_version: toCleanString(body.apiVersion || existingRow?.api_version || existingRow?.apiVersion || ''),
    is_active: body.isActive == null ? (existingRow?.is_active == null ? true : Boolean(existingRow.is_active)) : Boolean(body.isActive),
    notes: toCleanString(body.notes || existingRow?.notes || ''),
  };
};

const handleProviderKeyAction = async (req, res) => {
  const supabase = createSupabaseClient();
  const body = readBody(req);
  const debugRequested = body?.debug === true || body?.debug === 'true' || body?.debug === 1;

  try {
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('ai_provider_keys')
        .select('*')
        .order('updated_at', { ascending: false });

      if (error) {
        return toSafeJson(res, 500, { success: false, error: error.message || 'Failed to load provider keys.' });
      }

      return toSafeJson(res, 200, { success: true, rows: (data || []).map(safeKeyRow) });
    }

    if (req.method === 'POST') {
      if (body.action === 'test') {
        try {
          let provider = toCleanString(body.provider).toLowerCase();
          let apiKey = toCleanString(body.apiKey);
          let model = toCleanString(body.model);
          let baseUrl = toCleanString(body.baseUrl);
          let endpoint = toCleanString(body.endpoint);
          let deploymentName = toCleanString(body.deploymentName);
          let apiVersion = toCleanString(body.apiVersion);

          if (body.id) {
            const { data: existingRow, error: existingError } = await supabase
              .from('ai_provider_keys')
              .select('*')
              .eq('id', toCleanString(body.id))
              .maybeSingle();

            if (existingError) {
              return toSafeJson(res, 500, { success: false, error: existingError.message || 'Failed to load provider key.' });
            }

            if (!existingRow) {
              return toSafeJson(res, 404, { success: false, error: 'Provider key not found.' });
            }

            provider = toCleanString(existingRow.provider).toLowerCase();
            apiKey = existingRow.api_key_encrypted ? decryptApiKey(existingRow.api_key_encrypted) : '';
            model = model || toCleanString(existingRow.model);
            baseUrl = baseUrl || toCleanString(existingRow.base_url);
            endpoint = endpoint || toCleanString(existingRow.endpoint);
            deploymentName = deploymentName || toCleanString(existingRow.deployment_name);
            apiVersion = apiVersion || toCleanString(existingRow.api_version);
          }

          if (!ALLOWED_PROVIDERS.has(provider)) {
            return toSafeJson(res, 400, { success: false, error: 'Unsupported provider.' });
          }

          if (!apiKey && provider !== 'ollama') {
            return toSafeJson(res, 400, { success: false, error: 'API key is required for testing.' });
          }

          const resultText = await testProviderConnection({
            provider,
            apiKey,
            model,
            baseUrl,
            endpoint,
            deploymentName,
            apiVersion,
          });

          const responseBody = { success: true, message: resultText || 'Connection succeeded.' };
          if (debugRequested) {
            responseBody.debug = {
              provider,
              model: model || null,
              authStyleUsed: provider === 'gemini' ? 'gemini_query_key' : (provider === 'anthropic' ? 'anthropic_x_api_key' : (provider === 'azure_openai' ? 'azure_api_key' : 'bearer')),
              endpointHost: (() => {
                try {
                  const targetUrl = provider === 'gemini'
                    ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model || 'gemini-2.0-flash')}:generateContent?key=***`
                    : (endpoint || baseUrl || '');
                  return targetUrl ? new URL(targetUrl).host : '';
                } catch {
                  return '';
                }
              })(),
            };
          }

          return toSafeJson(res, 200, responseBody);
        } catch (error) {
          if (debugRequested) {
            return toSafeJson(res, 500, {
              success: false,
              error: toSafeEncryptionError(error) || 'AI provider request failed.',
              debug: {
                provider: toCleanString(body.provider).toLowerCase(),
                model: toCleanString(body.model || body.deploymentName) || null,
                providerStatus: error?.providerStatus ?? null,
                providerErrorStatus: error?.providerErrorStatus ?? null,
                providerErrorReason: error?.providerErrorReason ?? null,
                authStyleUsed: error?.authStyleUsed || (toCleanString(body.provider).toLowerCase() === 'gemini' ? 'gemini_query_key' : (toCleanString(body.provider).toLowerCase() === 'anthropic' ? 'anthropic_x_api_key' : (toCleanString(body.provider).toLowerCase() === 'azure_openai' ? 'azure_api_key' : 'bearer'))),
                endpointHost: error?.endpointHost || (() => {
                  try {
                    const targetUrl = toCleanString(body.provider).toLowerCase() === 'gemini'
                      ? `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(toCleanString(body.model || body.deploymentName) || 'gemini-2.0-flash')}:generateContent?key=***`
                      : (body.endpoint || body.baseUrl || '');
                    return targetUrl ? new URL(targetUrl).host : '';
                  } catch {
                    return '';
                  }
                })(),
              },
            });
          }

          return toSafeJson(res, 500, { success: false, error: toSafeEncryptionError(error) || 'Failed to test provider key.' });
        }
      }

      const payload = buildInsertPayload(body);
      const { data, error } = await supabase
        .from('ai_provider_keys')
        .insert(payload)
        .select('*')
        .single();

      if (error) {
        return toSafeJson(res, 500, { success: false, error: error.message || 'Failed to create provider key.' });
      }

      return toSafeJson(res, 200, { success: true, row: safeKeyRow(data) });
    }

    if (req.method === 'PUT') {
      const id = toCleanString(body.id || req.query?.id);
      if (!id) {
        return toSafeJson(res, 400, { success: false, error: 'Provider key id is required.' });
      }

      const { data: existingRow, error: existingError } = await supabase
        .from('ai_provider_keys')
        .select('*')
        .eq('id', id)
        .maybeSingle();

      if (existingError) {
        return toSafeJson(res, 500, { success: false, error: existingError.message || 'Failed to load provider key.' });
      }

      if (!existingRow) {
        return toSafeJson(res, 404, { success: false, error: 'Provider key not found.' });
      }

      const payload = buildInsertPayload(body, existingRow);
      const { data, error } = await supabase
        .from('ai_provider_keys')
        .update(payload)
        .eq('id', id)
        .select('*')
        .single();

      if (error) {
        return toSafeJson(res, 500, { success: false, error: error.message || 'Failed to update provider key.' });
      }

      return toSafeJson(res, 200, { success: true, row: safeKeyRow(data) });
    }

    if (req.method === 'DELETE') {
      const id = toCleanString(body.id || req.query?.id);
      if (!id) {
        return toSafeJson(res, 400, { success: false, error: 'Provider key id is required.' });
      }

      const { error } = await supabase
        .from('ai_provider_keys')
        .delete()
        .eq('id', id);

      if (error) {
        return toSafeJson(res, 500, { success: false, error: error.message || 'Failed to delete provider key.' });
      }

      return toSafeJson(res, 200, { success: true });
    }

    return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
  } catch (error) {
    return toSafeJson(res, 500, { success: false, error: toSafeEncryptionError(error) || 'Internal server error.' });
  }
};

const handleUseCaseTest = async (req, res) => {
  const supabase = createSupabaseClient();
  const body = readBody(req);
  const useCase = toCleanString(body.useCase).toLowerCase();
  const allowed = ['message', 'finance', 'document', 'lead_scoring', 'relationship', 'notes', 'social_media'];

  if (!allowed.includes(useCase)) {
    return toSafeJson(res, 400, { success: false, error: 'Invalid use case for testing.' });
  }

  const testPrompts = {
    message: 'Return only JSON:\n{"message":"Hello from AI Control test"}',
    finance: 'Return only JSON:\n{"summary":"OK","incomeAnalysis":[],"expenseAnalysis":[],"allocationReview":[],"purchaseGoalReview":[],"investmentRiskReview":[],"recurringIncomeReview":[],"ethicalReviewQuestions":[],"warnings":[],"nextActions":[]}',
    document: '<SUMMARY>OK</SUMMARY>\n<IMPROVED_CONTENT></IMPROVED_CONTENT>\n<RISKS></RISKS>\n<MISSING_CLAUSES></MISSING_CLAUSES>\n<SUGGESTED_SECTIONS></SUGGESTED_SECTIONS>\n<QUESTIONS_TO_REVIEW></QUESTIONS_TO_REVIEW>\n<NEXT_ACTIONS></NEXT_ACTIONS>',
    lead_scoring: '<DATABASE_TYPE>sme</DATABASE_TYPE>\n<INDUSTRY>tech</INDUSTRY>\n<PRIORITY>medium</PRIORITY>\n<FIT_SCORE>5</FIT_SCORE>\n<ETHICAL_FIT>good</ETHICAL_FIT>\n<UX_PROBLEM></UX_PROBLEM>\n<SERVICE_TO_OFFER></SERVICE_TO_OFFER>\n<NEXT_ACTION></NEXT_ACTION>\n<REASONING_SUMMARY>OK</REASONING_SUMMARY>\n<RISKS></RISKS>\n<QUESTIONS_TO_REVIEW></QUESTIONS_TO_REVIEW>',
    relationship: '<SUMMARY>OK</SUMMARY>\n<OBSERVATIONS>\n- Test observation\n</OBSERVATIONS>\n<STRENGTHS></STRENGTHS>\n<CONCERNS></CONCERNS>\n<NEXT_STEPS>\n- Test step\n</NEXT_STEPS>\n<FOLLOW_UP_DRAFT></FOLLOW_UP_DRAFT>\n<LOG_CHANNEL>other</LOG_CHANNEL>\n<LOG_TYPE>follow_up</LOG_TYPE>\n<LOG_SUMMARY></LOG_SUMMARY>\n<LOG_OUTCOME></LOG_OUTCOME>\n<LOG_NEXT_ACTION></LOG_NEXT_ACTION>\n<APPROVAL_NOTE></APPROVAL_NOTE>',
    notes: '<SUMMARY>OK</SUMMARY>\n<IMPROVED_CONTENT>Test note content</IMPROVED_CONTENT>\n<KEY_POINTS>\n- Test point\n</KEY_POINTS>\n<SUGGESTED_TASKS>\n- title: Follow up | priority: medium | category: notes | notes: Test task\n</SUGGESTED_TASKS>\n<SUGGESTED_CATEGORY>work</SUGGESTED_CATEGORY>\n<SUGGESTED_TAGS>\n- notes\n- review\n</SUGGESTED_TAGS>\n<NEXT_ACTIONS>\n- Review the note\n</NEXT_ACTIONS>',
    social_media: '<SUMMARY>OK</SUMMARY>\n<IDEAS>\n- Test idea\n</IDEAS>\n<HOOKS>\n- Test hook\n</HOOKS>\n<CONTENT_DRAFT>Test draft</CONTENT_DRAFT>\n<WEEKLY_PLAN>Test plan</WEEKLY_PLAN>\n<REPURPOSED_CONTENT>Test repurposed</REPURPOSED_CONTENT>\n<PERFORMANCE_INSIGHTS>\n- Test insight\n</PERFORMANCE_INSIGHTS>\n<QUESTIONS_TO_REVIEW>\n- Test question\n</QUESTIONS_TO_REVIEW>\n<NEXT_ACTIONS>\n- Test action\n</NEXT_ACTIONS>',
  };

  try {
    const routedText = await aiProviderRouter.runAICompletion({
      supabase,
      useCase,
      prompt: testPrompts[useCase],
      temperature: 0,
      maxOutputTokens: 256,
    });

    if (!routedText) {
      const status = await checkAIUseCaseStatus({ supabase, useCase });
      const errorMsg = !status?.configured
        ? 'AI is not configured for this use case.'
        : 'AI is disabled for this use case.';
      return toSafeJson(res, 500, { success: false, error: errorMsg });
    }

    return toSafeJson(res, 200, { success: true, message: `${useCase} AI responded.` });
  } catch (error) {
    return toSafeJson(res, 500, { success: false, error: toSafeEncryptionError(error) || 'Use case test failed.' });
  }
};

const handleNotesAction = async (req, res) => {
  const body = readBody(req);
  const mode = toCleanString(body.mode).toLowerCase();
  const note = body?.note && typeof body.note === 'object' ? body.note : {};
  const blocks = Array.isArray(body.blocks) ? body.blocks : [];
  const attachments = Array.isArray(body.attachments) ? body.attachments : [];
  const context = buildNotesContextSummary(body.context);
  const instructions = toCleanString(body.instructions);
  const language = ['arabic', 'english', 'french', 'auto'].includes(toCleanString(body.language).toLowerCase()) ? toCleanString(body.language).toLowerCase() : 'auto';
  const debugRequested = body?.debug === true || body?.debug === 'true' || body?.debug === 1;

  if (!NOTES_AI_MODES.has(mode)) {
    return toSafeJson(res, 400, { success: false, error: 'Invalid notes AI mode.' });
  }

  const title = toCleanString(note.title);
  const content = toCleanString(note.content);
  const hasAnyContent = Boolean(title || content || blocks.length || attachments.length || Object.values(context).some(Boolean));

  if (mode !== 'suggest_category_tags' && !title && !content) {
    return toSafeJson(res, 400, { success: false, error: 'Note title or content is required.' });
  }

  if (mode === 'suggest_category_tags' && !hasAnyContent) {
    return toSafeJson(res, 400, { success: false, error: 'Note content is required.' });
  }

  let supabase = null;
  try {
    supabase = createSupabaseClient();
  } catch {
    supabase = null;
  }

  const routing = await resolveNotesExecutionConfig({ supabase });
  if (routing?.disabled) {
    return toSafeJson(res, 503, { success: false, error: 'AI is disabled for notes.' });
  }

  if (!routing?.executionConfig) {
    return toSafeJson(res, 503, { success: false, error: 'AI is disabled for notes.' });
  }

  const prompt = buildNotesPrompt({
    mode,
    note: {
      id: toCleanString(note.id),
      title,
      content,
      categorySlug: toCleanString(note.categorySlug),
      tags: toCleanString(note.tags),
      status: toCleanString(note.status),
      priority: toCleanString(note.priority),
      source: toCleanString(note.source),
      notes: toCleanString(note.notes),
    },
    blocks: blocks.map((block) => ({
      type: toCleanString(block?.type),
      content: toCleanString(block?.content),
      dataJson: block?.dataJson ?? null,
      sortOrder: block?.sortOrder ?? null,
    })),
    attachments: attachments.map((attachment) => ({
      type: toCleanString(attachment?.type),
      title: toCleanString(attachment?.title),
      url: toCleanString(attachment?.url),
      notes: toCleanString(attachment?.notes),
    })),
    context,
    instructions,
    language,
  });

  try {
    const rawResponse = await aiProviderRouter.requestProviderCompletion({
      ...routing.executionConfig,
      prompt,
      temperature: mode === 'summarize_note' ? 0.1 : 0.2,
      maxOutputTokens: 1200,
    });

    const normalized = parseNotesTaggedResponse(rawResponse, mode);

    return toSafeJson(res, 200, {
      success: true,
      mode,
      result: normalized,
      ...(debugRequested ? { debug: { sourceUseCase: routing.sourceUseCase, rawResponse } } : {}),
    });
  } catch (error) {
    return toSafeJson(res, error?.providerStatus === 401 ? 401 : 500, {
      success: false,
      error: mapNotesAiError(error),
      ...(debugRequested ? {
        debug: {
          sourceUseCase: routing.sourceUseCase,
          providerStatus: error?.providerStatus ?? null,
          providerErrorStatus: error?.providerErrorStatus ?? null,
          providerErrorReason: error?.providerErrorReason ?? null,
        },
      } : {}),
    });
  }
};

const SOCIAL_MEDIA_AI_MODES = new Set([
  'generate_ideas',
  'improve_hook',
  'rewrite_post',
  'note_to_post',
  'project_to_case_study',
  'weekly_plan',
  'repurpose_content',
  'analyze_performance',
  'next_week_focus',
]);

const toSocialMediaExecutionConfig = () => {
  const apiKey = toCleanString(process.env.GEMINI_API_KEY);
  if (!apiKey) return null;
  return {
    disabled: false,
    provider: 'gemini',
    apiKey,
    model: toCleanString(process.env.GEMINI_MODEL) || 'gemini-2.5-flash',
    baseUrl: '',
    endpoint: '',
    deploymentName: '',
    apiVersion: '',
    temperature: 0.3,
    maxOutputTokens: 2000,
  };
};

const resolveSocialMediaExecutionConfig = async ({ supabase }) => {
  if (supabase) {
    const socialMediaConfig = await aiProviderRouter.resolveAIExecutionConfig({ supabase, useCase: 'social_media', fallbackEnvGemini: false });
    if (socialMediaConfig?.disabled) return { disabled: true };
    if (socialMediaConfig) return { executionConfig: socialMediaConfig, sourceUseCase: 'social_media' };

    const strategyConfig = await aiProviderRouter.resolveAIExecutionConfig({ supabase, useCase: 'strategy', fallbackEnvGemini: false });
    if (strategyConfig?.disabled) {
      const envExecution = toSocialMediaExecutionConfig();
      return envExecution ? { executionConfig: envExecution, sourceUseCase: 'env' } : { disabled: true };
    }
    if (strategyConfig) return { executionConfig: strategyConfig, sourceUseCase: 'strategy' };
  }

  const envExecution = toSocialMediaExecutionConfig();
  return envExecution ? { executionConfig: envExecution, sourceUseCase: 'env' } : { disabled: true };
};

const buildSocialMediaPrompt = ({ mode, strategy, platforms, pillars, contentItem, note, project, weeklyPlan, recentContent, instructions, language }) => {
  const modeRules = {
    generate_ideas: 'Generate content ideas based on the strategy, pillars, and platforms. Include title, format, platform, pillar, hook, and short angle for each idea.',
    improve_hook: 'Improve the hook of the content item. Provide multiple hook options that are compelling and authentic.',
    rewrite_post: 'Rewrite the content for clarity, structure, and platform fit while preserving meaning and intent.',
    note_to_post: 'Turn this note into a platform-ready social media post. Preserve the original meaning and intent.',
    project_to_case_study: 'Turn this project into a case study style post. Do not invent metrics. If metrics are missing, use qualitative framing and questions.',
    weekly_plan: 'Suggest a weekly content mix including posts, videos, carousels, and other formats. Align with strategy targets. Include content titles and formats.',
    repurpose_content: 'Turn this content item into multiple formats: LinkedIn post, short video script, carousel outline, thread, and story.',
    analyze_performance: 'Analyze the provided performance metrics. Identify what seems to work and suggest improvements. Do not overclaim.',
    next_week_focus: 'Suggest focus for next week based on the strategy and recent content or performance data.',
  };

  const parts = [
    'You are AI Social Media Assistant helping a professional content creator.',
    'General rules:',
    '- Do not invent fake results.',
    '- Do not claim performance numbers not provided.',
    '- Respect the user positioning and brand.',
    '- Keep output practical and usable.',
    '- If information is missing, ask review questions.',
    '- Do not publish automatically.',
    '- Do not guarantee leads or sales.',
    '- Respect Islamic and ethical principles.',
    '- Avoid manipulative or deceptive marketing.',
    '- Output should help build trust, clarity, and authority.',
    '',
    'Output only these tags and no commentary outside them. No markdown fences around the tags:',
    '<SUMMARY>...</SUMMARY>',
    '<IDEAS>...</IDEAS>',
    '<HOOKS>...</HOOKS>',
    '<CONTENT_DRAFT>...</CONTENT_DRAFT>',
    '<WEEKLY_PLAN>...</WEEKLY_PLAN>',
    '<REPURPOSED_CONTENT>...</REPURPOSED_CONTENT>',
    '<PERFORMANCE_INSIGHTS>...</PERFORMANCE_INSIGHTS>',
    '<QUESTIONS_TO_REVIEW>...</QUESTIONS_TO_REVIEW>',
    '<NEXT_ACTIONS>...</NEXT_ACTIONS>',
    '',
    `Mode: ${mode}`,
    `Language: ${language || 'auto'}`,
    `Mode guidance: ${modeRules[mode] || 'Follow the general rules and keep the response structured.'}`,
    instructions ? `User instructions: ${instructions}` : 'User instructions: none',
    '',
  ];

  if (strategy) parts.push(`Strategy: ${JSON.stringify(strategy, null, 2)}`);
  if (platforms) parts.push(`Platforms: ${JSON.stringify(platforms, null, 2)}`);
  if (pillars) parts.push(`Pillars: ${JSON.stringify(pillars, null, 2)}`);
  if (contentItem) parts.push(`Content Item: ${JSON.stringify(contentItem, null, 2)}`);
  if (note) parts.push(`Note: ${JSON.stringify(note, null, 2)}`);
  if (project) parts.push(`Project: ${JSON.stringify(project, null, 2)}`);
  if (weeklyPlan) parts.push(`Weekly Plan: ${JSON.stringify(weeklyPlan, null, 2)}`);
  if (recentContent) parts.push(`Recent Content: ${JSON.stringify(recentContent, null, 2)}`);

  return parts.join('\n');
};

const parseSocialMediaTaggedResponse = (rawText) => {
  const text = toCleanString(rawText);
  if (!text) {
    throw new Error('AI returned an empty response.');
  }

  return {
    summary: extractTaggedSection(text, 'SUMMARY'),
    ideas: normalizeTaggedList(text, 'IDEAS'),
    hooks: normalizeTaggedList(text, 'HOOKS'),
    contentDraft: extractTaggedSection(text, 'CONTENT_DRAFT'),
    weeklyPlan: extractTaggedSection(text, 'WEEKLY_PLAN'),
    repurposedContent: extractTaggedSection(text, 'REPURPOSED_CONTENT'),
    performanceInsights: normalizeTaggedList(text, 'PERFORMANCE_INSIGHTS'),
    questionsToReview: normalizeTaggedList(text, 'QUESTIONS_TO_REVIEW'),
    nextActions: normalizeTaggedList(text, 'NEXT_ACTIONS'),
  };
};

const mapSocialMediaAiError = (error) => {
  const message = toCleanString(error?.message || error?.providerErrorReason || error?.providerErrorStatus || '');
  if (error?.providerStatus === 401 || /unauthori[sz]ed/i.test(message)) {
    return 'Authentication required. Please log in again.';
  }
  if (error?.providerStatus === 429 || /quota|rate limit|too many requests/i.test(message)) {
    return 'AI quota exceeded. Try again later or change AI model.';
  }
  if (/disabled/i.test(message) && /social_media/i.test(message)) {
    return 'AI is disabled for social media.';
  }
  return 'AI could not generate social media help. Review manually.';
};

const handleSocialMediaAction = async (req, res) => {
  const body = readBody(req);
  const mode = toCleanString(body.mode).toLowerCase();
  const strategy = body?.strategy && typeof body.strategy === 'object' ? body.strategy : null;
  const platforms = Array.isArray(body.platforms) ? body.platforms : null;
  const pillars = Array.isArray(body.pillars) ? body.pillars : null;
  const contentItem = body?.contentItem && typeof body.contentItem === 'object' ? body.contentItem : null;
  const note = body?.note && typeof body.note === 'object' ? body.note : null;
  const project = body?.project && typeof body.project === 'object' ? body.project : null;
  const weeklyPlan = body?.weeklyPlan && typeof body.weeklyPlan === 'object' ? body.weeklyPlan : null;
  const recentContent = Array.isArray(body.recentContent) ? body.recentContent : null;
  const instructions = toCleanString(body.instructions);
  const language = ['arabic', 'english', 'french', 'auto'].includes(toCleanString(body.language).toLowerCase()) ? toCleanString(body.language).toLowerCase() : 'auto';
  const debugRequested = body?.debug === true || body?.debug === 'true' || body?.debug === 1;

  if (!SOCIAL_MEDIA_AI_MODES.has(mode)) {
    return toSafeJson(res, 400, { success: false, error: 'Invalid social media AI mode.' });
  }

  if (['improve_hook', 'rewrite_post', 'repurpose_content', 'analyze_performance'].includes(mode) && !contentItem) {
    return toSafeJson(res, 400, { success: false, error: 'Content item is required for this mode.' });
  }

  if (mode === 'note_to_post' && !note) {
    return toSafeJson(res, 400, { success: false, error: 'Note is required for note to post.' });
  }

  if (mode === 'project_to_case_study' && !project) {
    return toSafeJson(res, 400, { success: false, error: 'Project is required for project to case study.' });
  }

  let supabase = null;
  try {
    supabase = createSupabaseClient();
  } catch {
    supabase = null;
  }

  const routing = await resolveSocialMediaExecutionConfig({ supabase });
  if (routing?.disabled) {
    return toSafeJson(res, 503, { success: false, error: 'AI is disabled for social media.' });
  }

  if (!routing?.executionConfig) {
    return toSafeJson(res, 503, { success: false, error: 'AI is disabled for social media.' });
  }

  const prompt = buildSocialMediaPrompt({
    mode,
    strategy,
    platforms,
    pillars,
    contentItem,
    note,
    project,
    weeklyPlan,
    recentContent,
    instructions,
    language,
  });

  try {
    const rawResponse = await aiProviderRouter.requestProviderCompletion({
      ...routing.executionConfig,
      prompt,
      temperature: 0.3,
      maxOutputTokens: 2000,
    });

    const normalized = parseSocialMediaTaggedResponse(rawResponse);

    return toSafeJson(res, 200, {
      success: true,
      mode,
      result: normalized,
      ...(debugRequested ? { debug: { sourceUseCase: routing.sourceUseCase, rawResponse } } : {}),
    });
  } catch (error) {
    const statusCode = error?.providerStatus === 401 ? 401 : 500;
    const errorMessage = mapSocialMediaAiError(error);
    const errorCode = error?.providerStatus === 429 || /quota|rate limit|too many requests/i.test(toCleanString(error?.message)) ? 'AI_QUOTA_EXCEEDED' : undefined;

    return toSafeJson(res, statusCode, {
      success: false,
      ...(errorCode ? { code: errorCode } : {}),
      error: errorMessage,
      ...(debugRequested ? {
        debug: {
          sourceUseCase: routing.sourceUseCase,
          providerStatus: error?.providerStatus ?? null,
          providerErrorStatus: error?.providerErrorStatus ?? null,
          providerErrorReason: error?.providerErrorReason ?? null,
        },
      } : {}),
    });
  }
};

export default async function handler(req, res) {
  const action = String(req.query?.action || req.body?.action || '').trim().toLowerCase();

  const access = await requirePersonalAccess(req);
  if (!access.emailAuthenticated || !access.allowedEmail || !access.secondFactorPassed) {
    return toSafeJson(res, 401, { success: false, error: 'Unauthorized.' });
  }

  if (req.method === 'GET' && action === 'health') {
    const type = String(req.query?.type || '').trim().toLowerCase();
    if (type === 'message') {
      return aiMessageHandler(cloneRequest(req, { query: { health: '1' } }), res);
    }
    if (type === 'finance') {
      return aiFinanceHandler(cloneRequest(req, { query: { health: '1' } }), res);
    }
    if (type === 'document') {
      return aiDocumentHandler(cloneRequest(req, { query: { health: '1' } }), res);
    }
    if (type === 'relationship') {
      return aiRelationshipHandler(cloneRequest(req, { query: { health: '1' } }), res);
    }
    if (type === 'control') {
      const encryptionConfigured = Boolean(process.env.AI_KEYS_ENCRYPTION_SECRET);
      const supabase = (() => {
        try { return createSupabaseClient(); } catch { return null; }
      })();
      const useCaseStatuses = {};
      for (const uc of ['message', 'finance', 'document', 'lead_scoring', 'relationship', 'research', 'company_research', 'cleanup', 'strategy', 'notes', 'social_media']) {
        useCaseStatuses[uc] = supabase ? await checkAIUseCaseStatus({ supabase, useCase: uc }) : { configured: false, source: 'none' };
      }
      return toSafeJson(res, 200, {
        success: true,
        route: 'api/ai',
        aiControl: true,
        encryptionConfigured,
        supportedProviders: ['gemini', 'openai', 'anthropic', 'openrouter', 'nvidia', 'azure_openai', 'ollama'],
        supportedUseCases: ['message', 'finance', 'document', 'lead_scoring', 'relationship', 'research', 'company_research', 'cleanup', 'strategy', 'notes', 'social_media'],
        envGeminiConfigured: Boolean(process.env.GEMINI_API_KEY),
        useCaseStatuses,
      });
    }
    return toSafeJson(res, 400, { success: false, error: 'Missing or invalid type.' });
  }

  if (req.method === 'POST' && action === 'message') {
    return aiMessageHandler(req, res);
  }

  if (req.method === 'POST' && action === 'finance') {
    return aiFinanceHandler(req, res);
  }

  if (req.method === 'POST' && action === 'document') {
    return aiDocumentHandler(req, res);
  }

  if (req.method === 'POST' && action === 'provider-key') {
    return handleProviderKeyAction(req, res);
  }

  if (req.method === 'POST' && action === 'lead-scoring') {
    return aiLeadScoringHandler(req, res);
  }

  if (req.method === 'POST' && action === 'relationship') {
    return aiRelationshipHandler(req, res);
  }

  if (req.method === 'POST' && action === 'company-research') {
    return handleCompanyResearchAction(req, res);
  }

  if (req.method === 'POST' && action === 'notes') {
    return handleNotesAction(req, res);
  }

  if (req.method === 'POST' && action === 'social-media') {
    return handleSocialMediaAction(req, res);
  }

  if (req.method === 'POST' && action === 'use-case-test') {
    return handleUseCaseTest(req, res);
  }

  return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
}