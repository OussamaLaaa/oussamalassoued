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
    try { return JSON.parse(req.body); }
    catch { return {}; }
  }
  if (typeof req.body === 'object') return req.body;
  return {};
};

const toSafeJson = (res, status, body) => res.status(status).json(body);

const toCleanString = (value) => (value == null ? '' : String(value).trim());

const truncateArr = (arr, max = 20) => Array.isArray(arr) ? arr.slice(0, max) : [];

const ALLOWED_MODES = new Set(['monthly_review', 'allocation_review', 'purchase_review', 'investment_review', 'next_actions']);

const getProviderConfig = () => {
  const provider = toCleanString(process.env.AI_PROVIDER);
  const apiKey = toCleanString(process.env.GEMINI_API_KEY);
  const model = toCleanString(process.env.GEMINI_MODEL) || 'gemini-1.5-flash';
  return { provider, apiKey, model };
};

const requestGemini = async ({ apiKey, model, prompt, useResponseMimeType = true }) => {
  const body = {
    contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: {
      temperature: 0.3,
      topP: 0.8,
      maxOutputTokens: 1024,
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
  try { json = JSON.parse(rawText); } catch {}

  return {
    ok: response.ok,
    status: response.status,
    data: json,
    rawText,
    error: response.ok ? null : {
      status: response.status,
      code: json?.error?.code ? String(json.error.code) : null,
      message: json?.error?.message ? String(json.error.message) : null,
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

const extractAnalysis = (value) => {
  let sanitized = toCleanString(value);
  sanitized = sanitized.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  if (!sanitized) return null;

  try { return JSON.parse(sanitized); }
  catch {
    const start = sanitized.indexOf('{');
    const end = sanitized.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try { return JSON.parse(sanitized.slice(start, end + 1)); }
      catch { return null; }
    }
    return null;
  }
};

const SUMMARIZE = (s) => {
  if (s == null) return '0';
  return String(typeof s === 'number' ? Math.round(s * 100) / 100 : s);
};

const buildPrompt = ({ financeSummary, allocationRules, purchaseGoals, investmentIdeas, incomeItems, expenseItems, mode }) => {
  const modeInstructions = {
    monthly_review: 'Focus on comparing expected vs received income, expense patterns, savings rate, and overall monthly financial health. Highlight income uncertainty if pending income is high.',
    allocation_review: 'Focus on whether the allocation percentages make sense given current income and expenses. If total allocation is not 100%, mention it. Suggest organizational improvements.',
    purchase_review: 'Focus on purchase goals: Are they realistic? Are they funded? Check if monthly contributions align with goals. Highlight products with no monthly contribution set.',
    investment_review: 'Focus on risk levels, ethical status (highlight needs_review or avoid), red flags, and whether ideas have sufficient research. Do not recommend specific investments.',
    next_actions: 'Focus on practical next steps: improving income tracking, reducing expenses, balancing allocation, funding goals, reviewing flagged investments.',
  };

  const instruction = modeInstructions[mode] || modeInstructions.monthly_review;

  const summaryText = [
    `Expected Income: ${SUMMARIZE(financeSummary?.expectedIncome)}`,
    `Received Income: ${SUMMARIZE(financeSummary?.receivedIncome)}`,
    `Pending Income: ${SUMMARIZE(financeSummary?.pendingIncome)}`,
    `Delayed Income: ${SUMMARIZE(financeSummary?.delayedIncome)}`,
    `Paid Expenses: ${SUMMARIZE(financeSummary?.paidExpenses)}`,
    `Planned Expenses: ${SUMMARIZE(financeSummary?.plannedExpenses)}`,
    `Net Received: ${SUMMARIZE(financeSummary?.netReceived)}`,
    `Expected Net: ${SUMMARIZE(financeSummary?.expectedNet)}`,
    `Available to Allocate: ${SUMMARIZE(financeSummary?.availableToAllocate)}`,
    `Savings Rate: ${SUMMARIZE(financeSummary?.savingsRate)}%`,
    `Allocation Total: ${SUMMARIZE(financeSummary?.allocationTotalPercentage)}%`,
  ].join('\n');

  const allocText = truncArr(allocationRules, 20).map((r) =>
    `${r.name || r.category}: ${r.percentage}% (${r.isActive ? 'active' : 'inactive'}, priority ${r.priority})`
  ).join('\n') || 'No allocation rules.';

  const goalsText = truncArr(purchaseGoals, 20).map((g) =>
    `${g.title}: target ${g.targetAmount}, saved ${g.savedAmount}, monthly ${g.monthlyContribution || 0}, status ${g.status}, decision ${g.decisionStatus}${g.allocationCategory ? `, funded from ${g.allocationCategory}` : ''}`
  ).join('\n') || 'No purchase goals.';

  const ideasText = truncArr(investmentIdeas, 20).map((i) =>
    `${i.title}: type ${i.type}, amount ${i.plannedAmount}, risk ${i.riskLevel}, ethical ${i.ethicalStatus}, status ${i.status}, decision ${i.decisionStatus}${i.redFlags ? `, RED FLAG: ${i.redFlags}` : ''}${i.fundingStatus ? `, funding: ${i.fundingStatus}` : ''}`
  ).join('\n') || 'No investment ideas.';

  const incomeText = truncArr(incomeItems, 30).map((i) =>
    `${i.title}: expected ${i.expectedAmount ?? i.amount}, received ${i.receivedAmount ?? (i.status === 'received' ? i.amount : 0)}, status ${i.status}, date ${i.expectedDate || i.incomeDate || '-'}`
  ).join('\n') || 'No income items.';

  const expenseText = truncArr(expenseItems, 30).map((e) =>
    `${e.title}: ${e.amount}, category ${e.category}, status ${e.status}, date ${e.expenseDate || '-'}`
  ).join('\n') || 'No expense items.';

  return [
    'You are a financial organization assistant. Return valid JSON only. No markdown. No code fences.',
    'Do NOT give financial advice. Do NOT recommend buying or selling any investment. Do NOT guarantee returns. Do NOT predict profits.',
    'Use cautious language. Focus on organization, risks, questions, and next actions.',
    'Respect Islamic/ethical principles. If ethicalStatus is needs_review or avoid, highlight it as a flag.',
    '',
    `Mode: ${mode}`,
    instruction,
    '',
    '--- FINANCIAL SUMMARY ---',
    summaryText,
    '',
    '--- ALLOCATION RULES ---',
    allocText,
    '',
    '--- PURCHASE GOALS ---',
    goalsText,
    '',
    '--- INVESTMENT IDEAS ---',
    ideasText,
    '',
    '--- INCOME ITEMS ---',
    incomeText,
    '',
    '--- EXPENSE ITEMS ---',
    expenseText,
    '',
    '--- OUTPUT FORMAT ---',
    'Return JSON with these exact keys. Each value must be an array of strings (can be empty):',
    JSON.stringify({
      summary: 'short finance summary',
      incomeAnalysis: ['...'],
      expenseAnalysis: ['...'],
      allocationReview: ['...'],
      purchaseGoalReview: ['...'],
      investmentRiskReview: ['...'],
      ethicalReviewQuestions: ['...'],
      warnings: ['...'],
      nextActions: ['...'],
    }),
    '',
    'Rules:',
    '- summary must be 1-2 sentences.',
    '- Each array should have 1-5 items.',
    '- If allocation total is not 100%, mention it in warnings.',
    '- If pending income is high relative to expected, mention income uncertainty.',
    '- If availableToAllocate <= 0, recommend waiting or reducing expenses.',
    '- If any investment has redFlags, include it in warnings.',
    '- If ethicalStatus is needs_review or avoid, flag in ethicalReviewQuestions.',
    '- If a purchase goal has no monthlyContribution, suggest setting one.',
  ].join('\n');
};

const generateAnalysis = async ({ apiKey, model, prompt }) => {
  const firstAttempt = await requestGemini({ apiKey, model, prompt, useResponseMimeType: true });

  if (firstAttempt.ok) {
    const text = readGeminiResponseText(firstAttempt.data);
    const parsed = extractAnalysis(text);
    if (parsed) return { success: true, analysis: parsed, text };
  }

  const mimeRelated = /responseMimeType|mime|JSON|application\/json/i.test(firstAttempt.error?.message || '');
  if (!mimeRelated) {
    if (firstAttempt.status === 429 || firstAttempt.status === 403) {
      return { success: false, code: 'AI_QUOTA_EXCEEDED', error: 'AI quota exceeded. Try again later or change Gemini model.' };
    }
    return { success: false, error: firstAttempt.error?.message || 'AI request failed.' };
  }

  const retryAttempt = await requestGemini({ apiKey, model, prompt, useResponseMimeType: false });
  if (retryAttempt.ok) {
    const text = readGeminiResponseText(retryAttempt.data);
    const parsed = extractAnalysis(text);
    if (parsed) return { success: true, analysis: parsed, text };
  }

  if (retryAttempt.status === 429 || retryAttempt.status === 403) {
    return { success: false, code: 'AI_QUOTA_EXCEEDED', error: 'AI quota exceeded. Try again later or change Gemini model.' };
  }

  return { success: false, error: retryAttempt.error?.message || 'AI analysis failed.' };
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  try {
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });

    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Unauthorized' });
    }

    const body = readBody(req);
    const { financeSummary, allocationRules, purchaseGoals, investmentIdeas, incomeItems, expenseItems, mode } = body;

    if (!financeSummary || typeof financeSummary !== 'object') {
      return toSafeJson(res, 400, { success: false, error: 'financeSummary is required.' });
    }

    if (!mode || !ALLOWED_MODES.has(mode)) {
      return toSafeJson(res, 400, { success: false, error: 'Valid mode is required.' });
    }

    const { provider, apiKey, model } = getProviderConfig();

    if (provider !== 'gemini' || !apiKey) {
      return toSafeJson(res, 500, { success: false, error: 'AI provider is not configured.' });
    }

    const prompt = buildPrompt({
      financeSummary,
      allocationRules: Array.isArray(allocationRules) ? allocationRules : [],
      purchaseGoals: Array.isArray(purchaseGoals) ? purchaseGoals : [],
      investmentIdeas: Array.isArray(investmentIdeas) ? investmentIdeas : [],
      incomeItems: Array.isArray(incomeItems) ? incomeItems : [],
      expenseItems: Array.isArray(expenseItems) ? expenseItems : [],
      mode,
    });

    const result = await generateAnalysis({ apiKey, model, prompt });

    if (result.success) {
      return toSafeJson(res, 200, { success: true, analysis: result.analysis });
    }

    return toSafeJson(res, 200, { success: false, code: result.code || null, error: result.error || 'AI analysis failed.' });
  } catch (error) {
    console.error('[AI Finance] Unhandled error', {
      route: 'ai-finance',
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return toSafeJson(res, 500, { success: false, error: 'AI finance function failed.' });
  }
}
