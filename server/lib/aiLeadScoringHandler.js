import { createClient } from '@supabase/supabase-js';
import aiProviderRouter from './aiProviderRouter.js';

const { runAICompletion } = aiProviderRouter;

const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';

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
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`, 'i');
  const match = text.match(regex);
  return match ? match[1].trim() : '';
};

const parseBulletList = (text) => {
  if (!text) return [];
  return text
    .split('\n')
    .map((line) => line.replace(/^[-*]\s*/, '').trim())
    .filter(Boolean);
};

const normalizeValue = (value, validValues, defaultValue) => {
  const cleaned = toCleanString(value).toLowerCase();
  return validValues.includes(cleaned) ? cleaned : defaultValue;
};

const normalizeScore = (value) => {
  const num = Number(value);
  if (Number.isFinite(num)) {
    return Math.max(1, Math.min(10, Math.round(num)));
  }
  return 5;
};

const parseLeadScoringResult = (text) => {
  if (!text) return null;

  const databaseType = normalizeValue(
    extractTag(text, 'DATABASE_TYPE'),
    ['big_company', 'sme', 'freelance'],
    'sme'
  );

  const priority = normalizeValue(
    extractTag(text, 'PRIORITY'),
    ['high', 'medium', 'low'],
    'medium'
  );

  const ethicalFit = normalizeValue(
    extractTag(text, 'ETHICAL_FIT'),
    ['good', 'needs_review', 'avoid'],
    'needs_review'
  );

  const fitScore = normalizeScore(extractTag(text, 'FIT_SCORE'));

  const industry = extractTag(text, 'INDUSTRY');
  const uxProblem = extractTag(text, 'UX_PROBLEM');
  const serviceToOffer = extractTag(text, 'SERVICE_TO_OFFER');
  const nextAction = extractTag(text, 'NEXT_ACTION');
  const reasoningSummary = extractTag(text, 'REASONING_SUMMARY');
  const risksRaw = extractTag(text, 'RISKS');
  const questionsRaw = extractTag(text, 'QUESTIONS_TO_REVIEW');

  return {
    databaseType,
    industry,
    priority,
    fitScore,
    ethicalFit,
    uxProblem,
    serviceToOffer,
    nextAction,
    reasoningSummary,
    risks: parseBulletList(risksRaw),
    questionsToReview: parseBulletList(questionsRaw),
  };
};

const buildLeadScoringPrompt = ({ company, people, messages, deals, debug }) => {
  const sections = [
    'You are a UX/UI career opportunity analyst and lead scorer.',
    'Your task is to analyze the following company as a potential UX/UI design freelance or career opportunity.',
    '',
    'RULES:',
    '- Do NOT invent facts. Infer carefully from available fields only.',
    '- If uncertain, say so explicitly in REASONING_SUMMARY.',
    '- Be realistic. Do NOT overrate every company.',
    '- Do NOT classify every company as high priority.',
    '- Respect Islamic/ethical principles.',
    '- Treat this as lead scoring and opportunity analysis, not guaranteed business advice.',
    '',
    'ETHICAL FIT GUIDELINES:',
    '- good: Clean industry, no ethical concerns.',
    '- needs_review: Unclear ethical position, needs further investigation.',
    '- avoid: Gambling, adult content, interest-based lending, deceptive products, harmful industries.',
    '',
    'DATABASE TYPE GUIDELINES:',
    '- big_company: Large enterprise, structured HR, internship programs, many employees.',
    '- sme: Small to medium business, faster decisions, direct founder/CTO contact.',
    '- freelance: Individual or very small team needing per-project UX/UI work.',
    '',
    'PRIORITY GUIDELINES:',
    '- high: Strong fit, clear UX need, good budget, ethical, actionable now.',
    '- medium: Possible fit, needs more research, moderate potential.',
    '- low: Weak fit, unclear need, small budget, or ethical concerns.',
    '',
    'FIT SCORE GUIDELINES:',
    '- 1-3: Very weak fit (wrong industry, no UX need, tiny budget).',
    '- 4-6: Moderate fit (some alignment, needs development).',
    '- 7-8: Good fit (clear UX need, reasonable budget, aligned industry).',
    '- 9-10: Excellent fit (strong UX need, good budget, ideal client profile).',
    '',
    '--- COMPANY DATA ---',
  ];

  const companyData = [
    `Name: ${toCleanString(company.name)}`,
    `Database Type: ${toCleanString(company.databaseType)}`,
    `Category: ${toCleanString(company.category)}`,
    `Industry: ${toCleanString(company.industry)}`,
    `Country: ${toCleanString(company.country)}`,
    `City: ${toCleanString(company.city)}`,
    `Website: ${toCleanString(company.website)}`,
    `LinkedIn: ${toCleanString(company.linkedin)}`,
    `Priority: ${toCleanString(company.priority)}`,
    `Fit Score: ${company.fitScore != null ? company.fitScore : 'Not set'}`,
    `Ethical Fit: ${toCleanString(company.ethicalFit)}`,
    `Status: ${toCleanString(company.status)}`,
    `Next Action: ${toCleanString(company.nextAction)}`,
    `Notes: ${toCleanString(company.notes)}`,
  ];

  sections.push(...companyData);

  if (people && people.length > 0) {
    sections.push('', '--- RELATED PEOPLE ---');
    people.forEach((p, i) => {
      sections.push(
        `${i + 1}. ${toCleanString(p.fullName)} | role: ${toCleanString(p.role)} | department: ${toCleanString(p.department)} | seniority: ${toCleanString(p.seniority)} | decisionPower: ${p.decisionPower != null ? p.decisionPower : 'N/A'} | influencePower: ${p.influencePower != null ? p.influencePower : 'N/A'} | relevance: ${p.relevance != null ? p.relevance : 'N/A'} | relationship: ${toCleanString(p.relationshipStatus)} | channel: ${toCleanString(p.contactChannel)} | notes: ${toCleanString(p.notes)}`
      );
    });
  }

  if (messages && messages.length > 0) {
    sections.push('', '--- RELATED MESSAGES ---');
    messages.forEach((m, i) => {
      sections.push(
        `${i + 1}. channel: ${toCleanString(m.channel)} | language: ${toCleanString(m.language)} | type: ${toCleanString(m.messageType)} | sent: ${toCleanString(m.sentDate)} | reply: ${toCleanString(m.replyStatus)} | replySummary: ${toCleanString(m.replySummary)} | status: ${toCleanString(m.status)}`
      );
    });
  }

  if (deals && deals.length > 0) {
    sections.push('', '--- RELATED DEALS ---');
    deals.forEach((d, i) => {
      sections.push(
        `${i + 1}. service: ${toCleanString(d.servicePackage)} | problem: ${toCleanString(d.problem)} | solution: ${toCleanString(d.proposedSolution)} | value: ${d.value != null ? d.value : 'N/A'} | currency: ${toCleanString(d.currency)} | stage: ${toCleanString(d.stage)} | probability: ${d.probability != null ? d.probability : 'N/A'} | notes: ${toCleanString(d.notes)}`
      );
    });
  }

  sections.push(
    '',
    '--- OUTPUT FORMAT ---',
    'Return ONLY the following tags. No markdown fences. No extra commentary outside tags.',
    '',
    '<DATABASE_TYPE>',
    'big_company | sme | freelance',
    '</DATABASE_TYPE>',
    '',
    '<INDUSTRY>',
    'industry classification',
    '</INDUSTRY>',
    '',
    '<PRIORITY>',
    'high | medium | low',
    '</PRIORITY>',
    '',
    '<FIT_SCORE>',
    '1-10',
    '</FIT_SCORE>',
    '',
    '<ETHICAL_FIT>',
    'good | needs_review | avoid',
    '</ETHICAL_FIT>',
    '',
    '<UX_PROBLEM>',
    'Describe the possible UX or business problem this company might need help with.',
    '</UX_PROBLEM>',
    '',
    '<SERVICE_TO_OFFER>',
    'Suggest what UX/UI service to offer this company.',
    '</SERVICE_TO_OFFER>',
    '',
    '<NEXT_ACTION>',
    'Recommended next action for the user.',
    '</NEXT_ACTION>',
    '',
    '<REASONING_SUMMARY>',
    'Short reasoning summary explaining the score and classification.',
    '</REASONING_SUMMARY>',
    '',
    '<RISKS>',
    '- risk 1',
    '- risk 2',
    '</RISKS>',
    '',
    '<QUESTIONS_TO_REVIEW>',
    '- question 1',
    '- question 2',
    '</QUESTIONS_TO_REVIEW>',
  );

  return sections.join('\n');
};

const generateLeadScoring = async ({ company, people, messages, deals, debug }) => {
  const prompt = buildLeadScoringPrompt({ company, people, messages, deals, debug });

  try {
    const routedText = await runAICompletion({
      supabase: createSupabaseClient(),
      useCase: 'lead_scoring',
      prompt,
      temperature: 0.3,
      maxOutputTokens: 1200,
    });

    if (routedText) {
      const parsed = parseLeadScoringResult(routedText);
      if (parsed) {
        return { success: true, result: parsed, rawText: routedText };
      }
    }
  } catch (error) {
    console.warn('[ai-lead-scoring] routed provider request failed, falling back to Gemini.', error);
  }

  const apiKey = toCleanString(process.env.GEMINI_API_KEY);
  if (!apiKey) {
    return { success: false, error: 'AI provider is not configured.' };
  }

  const model = toCleanString(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';

  try {
    const body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.3,
        topP: 0.9,
        maxOutputTokens: 1200,
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
    if (!response.ok) {
      let json = null;
      try { json = JSON.parse(rawText); } catch {}

      const isQuota = response.status === 429 || /quota|rate.?limit/i.test(rawText);
      if (isQuota) {
        return { success: false, code: 'AI_QUOTA_EXCEEDED', error: 'AI quota exceeded. Try again later or change AI model.' };
      }

      return { success: false, error: 'AI could not score this company.' };
    }

    let data = null;
    try { data = JSON.parse(rawText); } catch {}

    const responseText = data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('') || '';

    if (!responseText) {
      return { success: false, error: 'AI could not score this company.' };
    }

    const parsed = parseLeadScoringResult(responseText);
    if (!parsed) {
      return { success: false, error: 'AI could not score this company.' };
    }

    return { success: true, result: parsed, rawText: responseText };
  } catch (error) {
    return { success: false, error: 'AI could not score this company.' };
  }
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

    if (req.method === 'GET') {
      if (req?.query?.health === '1') {
        return toSafeJson(res, 200, {
          success: true,
          route: 'api/ai.js (lead-scoring)',
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
    const company = body?.company;

    if (!company || !toCleanString(company.name)) {
      return toSafeJson(res, 400, { success: false, error: 'company.name is required.' });
    }

    const debug = body?.debug === true || body?.debug === 'true' || body?.debug === 1;

    const result = await generateLeadScoring({
      company,
      people: Array.isArray(body?.people) ? body.people : [],
      messages: Array.isArray(body?.messages) ? body.messages : [],
      deals: Array.isArray(body?.deals) ? body.deals : [],
      debug,
    });

    if (result.success) {
      const responseBody = { success: true, result: result.result };
      if (debug) {
        responseBody.rawText = result.rawText;
      }
      return toSafeJson(res, 200, responseBody);
    }

    if (result.code === 'AI_QUOTA_EXCEEDED') {
      return toSafeJson(res, 429, { success: false, code: 'AI_QUOTA_EXCEEDED', error: result.error });
    }

    return toSafeJson(res, 200, { success: false, error: result.error || 'AI could not score this company.' });
  } catch (error) {
    console.error('[AI Lead Scoring] Unhandled error', {
      route: 'ai-lead-scoring',
      method: req?.method,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return toSafeJson(res, 500, { success: false, error: 'AI lead scoring function failed.' });
  }
}
