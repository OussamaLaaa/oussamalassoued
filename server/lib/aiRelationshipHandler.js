import { createClient } from '@supabase/supabase-js';
import aiProviderRouter from './aiProviderRouter.js';

const { runAICompletion } = aiProviderRouter;

const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const ALLOWED_MODES = new Set(['review', 'follow_up', 'repair']);
const ALLOWED_INTERACTION_CHANNELS = new Set(['linkedin', 'email', 'phone', 'meeting', 'whatsapp', 'in_person', 'other']);
const ALLOWED_INTERACTION_TYPES = new Set(['first_contact', 'follow_up', 'meeting', 'help_given', 'help_received', 'problem', 'opportunity', 'note']);

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

const createSupabaseClient = () => {
  const url = toCleanString(process.env.SUPABASE_URL);
  const serviceKey = toCleanString(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY);

  if (!url || !serviceKey) {
    return null;
  }

  return createClient(url, serviceKey, {
    auth: { persistSession: false },
  });
};

const extractTag = (text, tagName) => {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\/${tagName}>`, 'i');
  const match = toCleanString(text).match(regex);
  return match ? match[1].trim() : '';
};

const parseBulletList = (text) => {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
};

const normalizeMode = (value) => {
  const mode = toCleanString(value).toLowerCase();
  return ALLOWED_MODES.has(mode) ? mode : 'review';
};

const normalizeInteractionChannel = (value) => {
  const channel = toCleanString(value).toLowerCase();
  return ALLOWED_INTERACTION_CHANNELS.has(channel) ? channel : 'other';
};

const normalizeInteractionType = (value) => {
  const type = toCleanString(value).toLowerCase();
  return ALLOWED_INTERACTION_TYPES.has(type) ? type : 'follow_up';
};

const buildPrompt = ({ relationship, person, categoryName, contactMethods, interactions, opportunities, mode, instructions }) => {
  const contactSummary = (Array.isArray(contactMethods) ? contactMethods : []).slice(0, 5).map((item, index) => `${index + 1}. ${truncate(item?.type || 'contact', 50)} | ${truncate(item?.label || '', 80)} | ${truncate(item?.value || '', 120)} | primary: ${item?.isPrimary ? 'yes' : 'no'} | notes: ${truncate(item?.notes || '', 120)}`);
  const interactionSummary = (Array.isArray(interactions) ? interactions : []).slice(0, 5).map((item, index) => `${index + 1}. ${truncate(item?.interactionDate || '', 20)} | ${truncate(item?.channel || '', 20)} | ${truncate(item?.type || '', 30)} | ${truncate(item?.summary || '', 160)} | outcome: ${truncate(item?.outcome || '', 120)} | next: ${truncate(item?.nextAction || '', 120)}`);
  const opportunitySummary = (Array.isArray(opportunities) ? opportunities : []).slice(0, 5).map((item, index) => `${index + 1}. ${truncate(item?.title || '', 100)} | status: ${truncate(item?.status || '', 30)} | priority: ${truncate(item?.priority || '', 30)} | due: ${truncate(item?.dueDate || '', 20)} | next: ${truncate(item?.nextAction || '', 120)}`);

  const modeInstruction = {
    review: 'Prioritize a calm, balanced relationship review with concrete next steps.',
    follow_up: 'Prioritize a respectful follow-up draft that feels warm, light, and low-pressure.',
    repair: 'Prioritize de-escalation, patience, and careful repair if there are signs of friction or distance.',
  }[mode] || 'Prioritize a calm, balanced relationship review with concrete next steps.';

  return [
    'You are a respectful relationship assistant inside a personal CRM.',
    'Use only the provided context.',
    'Do not pressure, guilt, manipulate, or overclaim closeness.',
    'Separate facts from suggestions and keep the tone kind, cautious, and practical.',
    'If context is thin or uncertain, say so plainly.',
    '',
    'Return text only in this exact tagged format. No markdown. No code fences. No JSON.',
    '<SUMMARY>...</SUMMARY>',
    '<OBSERVATIONS>',
    '- ...',
    '</OBSERVATIONS>',
    '<STRENGTHS>',
    '- ...',
    '</STRENGTHS>',
    '<CONCERNS>',
    '- ...',
    '</CONCERNS>',
    '<NEXT_STEPS>',
    '- ...',
    '</NEXT_STEPS>',
    '<FOLLOW_UP_DRAFT>...</FOLLOW_UP_DRAFT>',
    '<LOG_CHANNEL>other</LOG_CHANNEL>',
    '<LOG_TYPE>follow_up</LOG_TYPE>',
    '<LOG_SUMMARY>...</LOG_SUMMARY>',
    '<LOG_OUTCOME>...</LOG_OUTCOME>',
    '<LOG_NEXT_ACTION>...</LOG_NEXT_ACTION>',
    '<APPROVAL_NOTE>...</APPROVAL_NOTE>',
    '',
    `Mode: ${mode}`,
    `Mode guidance: ${modeInstruction}`,
    instructions ? `User note: ${truncate(instructions, 600)}` : '',
    '',
    `Relationship: ${truncate(relationship?.displayName || relationship?.personName || '', 160)}`,
    `Category: ${truncate(categoryName || relationship?.categoryName || relationship?.categorySlug || relationship?.domain || '', 120)}`,
    `Person: ${truncate(person?.fullName || '', 160)}${person?.role ? ` | ${truncate(person.role, 120)}` : ''}${person?.companyName ? ` | ${truncate(person.companyName, 120)}` : ''}`,
    `Status: ${truncate(relationship?.status || '', 60)} | Strength: ${truncate(relationship?.relationshipStrength || '', 60)} | Trust: ${truncate(relationship?.trustLevel || '', 60)}`,
    `How we met: ${truncate(relationship?.howWeMet || '', 200)}`,
    `What they need: ${truncate(relationship?.whatTheyNeed || '', 250)}`,
    `How I can help: ${truncate(relationship?.howICanHelp || '', 250)}`,
    `How they can help me: ${truncate(relationship?.howTheyCanHelpMe || '', 250)}`,
    `Shared interests: ${truncate(relationship?.sharedInterests || '', 250)}`,
    `Last contact: ${truncate(relationship?.lastContactDate || '', 20)} | Next contact: ${truncate(relationship?.nextContactDate || '', 20)} | Next action: ${truncate(relationship?.nextAction || '', 250)}`,
    `Problems: ${truncate(relationship?.problems || '', 300)}`,
    `Risk notes: ${truncate(relationship?.riskNotes || '', 300)}`,
    `Notes: ${truncate(relationship?.notes || '', 500)}`,
    '',
    'Contact methods:',
    contactSummary.length > 0 ? contactSummary.join('\n') : '- none provided',
    '',
    'Recent interactions:',
    interactionSummary.length > 0 ? interactionSummary.join('\n') : '- none provided',
    '',
    'Open opportunities:',
    opportunitySummary.length > 0 ? opportunitySummary.join('\n') : '- none provided',
  ].filter(Boolean).join('\n');
};

const parseRelationshipResult = (text) => {
  const cleaned = toCleanString(text);
  if (!cleaned) return null;

  return {
    summary: extractTag(cleaned, 'SUMMARY'),
    observations: parseBulletList(extractTag(cleaned, 'OBSERVATIONS')),
    strengths: parseBulletList(extractTag(cleaned, 'STRENGTHS')),
    concerns: parseBulletList(extractTag(cleaned, 'CONCERNS')),
    nextSteps: parseBulletList(extractTag(cleaned, 'NEXT_STEPS')),
    followUpDraft: extractTag(cleaned, 'FOLLOW_UP_DRAFT'),
    suggestedLogEntry: {
      channel: normalizeInteractionChannel(extractTag(cleaned, 'LOG_CHANNEL')),
      type: normalizeInteractionType(extractTag(cleaned, 'LOG_TYPE')),
      summary: truncate(extractTag(cleaned, 'LOG_SUMMARY'), 300),
      outcome: truncate(extractTag(cleaned, 'LOG_OUTCOME'), 300),
      nextAction: truncate(extractTag(cleaned, 'LOG_NEXT_ACTION'), 300),
    },
    approvalNote: extractTag(cleaned, 'APPROVAL_NOTE'),
  };
};

const handleRelationshipAction = async (req, res) => {
  if (req.method === 'GET' && req.query?.health === '1') {
    return toSafeJson(res, 200, {
      success: true,
      route: 'api/ai.js',
      type: 'relationship',
      configured: Boolean(process.env.GEMINI_API_KEY),
      model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    });
  }

  if (!isAuthenticated(req)) {
    return toSafeJson(res, 401, { success: false, error: 'Unauthorized.' });
  }

  const supabase = createSupabaseClient();
  const body = readBody(req);
  const mode = normalizeMode(body.mode);
  const debugRequested = body?.debug === true || body?.debug === 'true' || body?.debug === 1;
  const relationship = body.relationship || body.selectedRelationship || null;

  if (!relationship || typeof relationship !== 'object') {
    return toSafeJson(res, 400, { success: false, error: 'Relationship data is required.' });
  }

  const prompt = buildPrompt({
    relationship,
    person: body.person || body.linkedPerson || null,
    categoryName: body.categoryName || '',
    contactMethods: Array.isArray(body.contactMethods) ? body.contactMethods : [],
    interactions: Array.isArray(body.interactions) ? body.interactions : [],
    opportunities: Array.isArray(body.opportunities) ? body.opportunities : [],
    mode,
    instructions: body.instructions || '',
  });

  try {
    const routedText = await runAICompletion({
      supabase,
      useCase: 'relationship',
      prompt,
      temperature: 0.25,
      maxOutputTokens: 1100,
    });

    if (!routedText) {
      return toSafeJson(res, 500, { success: false, error: 'AI provider is not configured.' });
    }

    const result = parseRelationshipResult(routedText);

    if (!result || !result.summary) {
      return toSafeJson(res, 500, { success: false, error: 'AI Relationship Assistant could not generate a structured response.' });
    }

    const responseBody = {
      success: true,
      result,
      mode,
    };

    if (body.debug === true || body.debug === 'true') {
      responseBody.debug = {
        responseTextLength: routedText.length,
        hasFollowUpDraft: Boolean(result.followUpDraft),
        nextStepsCount: Array.isArray(result.nextSteps) ? result.nextSteps.length : 0,
      };
    }

    return toSafeJson(res, 200, responseBody);
  } catch (error) {
    if (debugRequested) {
      return toSafeJson(res, 500, {
        success: false,
        error: 'AI provider request failed.',
        debug: {
          provider: error?.provider || 'gemini',
          model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
          providerStatus: error?.providerStatus ?? null,
          providerErrorStatus: error?.providerErrorStatus ?? null,
          providerErrorReason: error?.providerErrorReason ?? null,
          authStyleUsed: error?.authStyleUsed || 'gemini_query_key',
          endpointHost: error?.endpointHost || 'generativelanguage.googleapis.com',
        },
      });
    }

    return toSafeJson(res, 500, { success: false, error: error instanceof Error ? error.message : 'Internal server error.' });
  }
};

export default handleRelationshipAction;