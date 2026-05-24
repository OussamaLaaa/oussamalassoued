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

const getProviderConfig = () => {
  const provider = toCleanString(process.env.AI_PROVIDER);
  const apiKey = toCleanString(process.env.GEMINI_API_KEY);
  const model = toCleanString(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';
  return { provider, apiKey, model };
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
  try {
    json = JSON.parse(rawText);
  } catch {
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

const extractAnalysis = (text) => {
  let sanitized = toCleanString(text);
  sanitized = sanitized.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  if (!sanitized) return { analysis: null, parseStep: 'empty_text' };

  try {
    const parsed = JSON.parse(sanitized);
    return { analysis: parsed, parseStep: 'json_parse' };
  } catch {
    const start = sanitized.indexOf('{');
    const end = sanitized.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        const parsed = JSON.parse(sanitized.slice(start, end + 1));
        return { analysis: parsed, parseStep: 'substring_json_parse' };
      } catch {
        return { analysis: null, parseStep: 'substring_json_parse_failed' };
      }
    }
    return { analysis: null, parseStep: 'json_parse_failed' };
  }
};

const validateAnalysis = (analysis) => {
  if (!analysis || typeof analysis !== 'object') return null;
  return {
    summary: typeof analysis.summary === 'string' ? analysis.summary : '',
    incomeAnalysis: Array.isArray(analysis.incomeAnalysis) ? analysis.incomeAnalysis : [],
    expenseAnalysis: Array.isArray(analysis.expenseAnalysis) ? analysis.expenseAnalysis : [],
    allocationReview: Array.isArray(analysis.allocationReview) ? analysis.allocationReview : [],
    purchaseGoalReview: Array.isArray(analysis.purchaseGoalReview) ? analysis.purchaseGoalReview : [],
    investmentRiskReview: Array.isArray(analysis.investmentRiskReview) ? analysis.investmentRiskReview : [],
    recurringIncomeReview: Array.isArray(analysis.recurringIncomeReview) ? analysis.recurringIncomeReview : [],
    ethicalReviewQuestions: Array.isArray(analysis.ethicalReviewQuestions) ? analysis.ethicalReviewQuestions : [],
    warnings: Array.isArray(analysis.warnings) ? analysis.warnings : [],
    nextActions: Array.isArray(analysis.nextActions) ? analysis.nextActions : [],
  };
};

const generateAnalysis = async ({ apiKey, model, prompt }) => {
  try {
    const routedText = await runAICompletion({
      supabase: createSupabaseClient(),
      useCase: 'finance',
      prompt,
    });

    if (routedText) {
      const parsed = extractAnalysis(routedText);
      if (parsed.analysis) {
        return {
          success: true,
          status: 200,
          text: routedText,
          analysis: parsed.analysis,
          parseStep: parsed.parseStep,
          providerError: null,
        };
      }
    }
  } catch (error) {
    console.warn('[ai-finance] routed provider request failed, falling back to Gemini.', error);
  }

  const firstAttempt = await requestGemini({ apiKey, model, prompt, useResponseMimeType: true });

  if (firstAttempt.ok) {
    const text = readGeminiResponseText(firstAttempt.data);
    const { analysis, parseStep } = extractAnalysis(text);
    const validated = validateAnalysis(analysis);
    return {
      success: validated !== null,
      status: firstAttempt.status,
      text,
      analysis: validated || analysis,
      parseStep,
      providerError: null,
    };
  }

  const mimeRelated = /responseMimeType|mime|JSON|application\/json/i.test(firstAttempt.error?.message || '');
  if (!mimeRelated) {
    return {
      success: false,
      status: firstAttempt.status,
      text: firstAttempt.rawText,
      analysis: null,
      parseStep: 'provider_error',
      providerError: firstAttempt.error,
    };
  }

  const retryAttempt = await requestGemini({ apiKey, model, prompt, useResponseMimeType: false });
  if (retryAttempt.ok) {
    const text = readGeminiResponseText(retryAttempt.data);
    const { analysis, parseStep } = extractAnalysis(text);
    const validated = validateAnalysis(analysis);
    return {
      success: validated !== null,
      status: retryAttempt.status,
      text,
      analysis: validated || analysis,
      parseStep,
      providerError: null,
    };
  }

  return {
    success: false,
    status: retryAttempt.status,
    text: retryAttempt.rawText,
    analysis: null,
    parseStep: 'provider_error',
    providerError: retryAttempt.error,
  };
};

const buildFinancePrompt = ({ financeSummary, mode, recurringRules, allocationRules, purchaseGoals, investmentIdeas, incomeItems, expenseItems, horizonSummary }) => {
  const safetyHeader = [
    'You are a Finance Organization Assistant.',
    'You provide organization analysis, risk review, scenario thinking, ethical/Islamic review questions, and next-action suggestions.',
    'You do NOT give financial, legal, tax, or investment advice.',
    'You do NOT tell the user to buy, sell, or invest in anything.',
    'You do NOT guarantee returns or predict profits as certainty.',
    '',
    'Return valid JSON only. No markdown. No code fences. No explanations outside JSON.',
    'If a field has no items, return an empty array.',
    '',
  ].join('\n');

  const outputShape = [
    'Output JSON in this exact shape:',
    '{',
    '  "summary": "short finance summary",',
    '  "incomeAnalysis": ["..."],',
    '  "expenseAnalysis": ["..."],',
    '  "allocationReview": ["..."],',
    '  "purchaseGoalReview": ["..."],',
    '  "investmentRiskReview": ["..."],',
    '  "recurringIncomeReview": ["..."],',
    '  "ethicalReviewQuestions": ["..."],',
    '  "warnings": ["..."],',
    '  "nextActions": ["..."]',
    '}',
    '',
  ].join('\n');

  const analysisRules = [
    '--- ANALYSIS RULES ---',
    'Focus on organization, risks, questions, and next actions.',
    'If ethicalStatus is "needs_review" or "avoid", highlight it.',
    'If allocation total is not 100%, mention it.',
    'If pending income is high, mention income uncertainty.',
    'If recurring income is low or missing, mention income stability risk.',
    'If availableToAllocate <= 0, suggest waiting, reducing expenses, or improving income tracking.',
    'If purchase goals exceed available allocation, flag affordability risk.',
    'Respect Islamic/ethical principles in analysis.',
    'Use cautious language throughout.',
    'Keep response practical and concise.',
    '',
  ].join('\n');

  const modeInstruction = getModeInstruction(mode);

  const summarySection = financeSummary ? [
    '--- FINANCE SUMMARY ---',
    `Period: ${financeSummary.selectedPeriodTitle || 'N/A'} (${financeSummary.selectedPeriodType || 'N/A'})`,
    `Expected Income: ${financeSummary.expectedIncome || 0}`,
    `Received Income: ${financeSummary.receivedIncome || 0}`,
    `Pending Income: ${financeSummary.pendingIncome || 0}`,
    `Delayed Income: ${financeSummary.delayedIncome || 0}`,
    `Paid Expenses: ${financeSummary.paidExpenses || 0}`,
    `Planned Expenses: ${financeSummary.plannedExpenses || 0}`,
    `Net Received: ${financeSummary.netReceived || 0}`,
    `Expected Net: ${financeSummary.expectedNet || 0}`,
    `Available to Allocate: ${financeSummary.availableToAllocate || 0}`,
    `Savings Rate: ${financeSummary.savingsRate || 0}%`,
    `Allocation Total: ${financeSummary.allocationTotalPercentage || 0}%`,
    '',
  ] : [];

  const recurringSection = recurringRules?.length > 0 ? [
    '--- RECURRING RULES ---',
    ...recurringRules.map((r, i) => `${i + 1}. ${r.title || 'Untitled'} | kind: ${r.kind || 'N/A'} | category: ${r.category || 'N/A'} | amount: ${r.amount || 0} | frequency: ${r.frequency || 'N/A'} | active: ${r.isActive || false} | confidence: ${r.confidence || 'N/A'}`),
    '',
  ] : ['--- RECURRING RULES ---', 'No recurring rules defined.', ''];

  const allocationSection = allocationRules?.length > 0 ? [
    '--- ALLOCATION RULES ---',
    ...allocationRules.map((r, i) => `${i + 1}. ${r.name || 'Untitled'} | category: ${r.category || 'N/A'} | ${r.percentage || 0}% | priority: ${r.priority || 0} | active: ${r.isActive || false}`),
    '',
  ] : ['--- ALLOCATION RULES ---', 'No allocation rules defined.', ''];

  const goalsSection = purchaseGoals?.length > 0 ? [
    '--- PURCHASE GOALS ---',
    ...purchaseGoals.map((g, i) => `${i + 1}. ${g.title || 'Untitled'} | category: ${g.category || 'N/A'} | target: ${g.targetAmount || 0} | saved: ${g.savedAmount || 0} | monthly: ${g.monthlyContribution || 0} | priority: ${g.priority || 'N/A'} | status: ${g.status || 'N/A'} | decision: ${g.decisionStatus || 'N/A'} | allocCat: ${g.allocationCategory || 'N/A'}`),
    '',
  ] : ['--- PURCHASE GOALS ---', 'No purchase goals defined.', ''];

  const ideasSection = investmentIdeas?.length > 0 ? [
    '--- INVESTMENT IDEAS ---',
    ...investmentIdeas.map((i, idx) => `${idx + 1}. ${i.title || 'Untitled'} | type: ${i.type || 'N/A'} | planned: ${i.plannedAmount || 0} | maxAlloc: ${i.maxAllocation || 0} | risk: ${i.riskLevel || 'N/A'} | ethics: ${i.ethicalStatus || 'N/A'} | funding: ${i.fundingStatus || 'N/A'} | status: ${i.status || 'N/A'} | allocCat: ${i.allocationCategory || 'N/A'}`),
    '',
  ] : ['--- INVESTMENT IDEAS ---', 'No investment ideas defined.', ''];

  const incomeItemsSection = incomeItems?.length > 0 ? [
    '--- INCOME ITEMS ---',
    ...incomeItems.map((i, idx) => `${idx + 1}. ${i.title || 'Untitled'} | source: ${i.source || i.incomeType || 'N/A'} | expected: ${i.expectedAmount || i.amount || 0} | received: ${i.receivedAmount || 0} | status: ${i.status || 'N/A'} | confidence: ${i.confidence || 'N/A'} | recurring: ${i.isRecurring || false} ${i.recurrence || ''} | period: ${i.financePeriodTitle || 'N/A'}`),
    '',
  ] : [];

  const expenseItemsSection = expenseItems?.length > 0 ? [
    '--- EXPENSE ITEMS ---',
    ...expenseItems.map((e, idx) => `${idx + 1}. ${e.title || 'Untitled'} | category: ${e.category || 'N/A'} | amount: ${e.amount || 0} | status: ${e.status || 'N/A'} | period: ${e.financePeriodTitle || 'N/A'}`),
    '',
  ] : [];

  const horizonSection = horizonSummary ? [
    '--- HORIZON SUMMARY ---',
    `Type: ${horizonSummary.type || 'N/A'}`,
    `Total Expected Income: ${horizonSummary.totalExpectedIncome || 0}`,
    `Total Received Income: ${horizonSummary.totalReceivedIncome || 0}`,
    `Total Expenses: ${horizonSummary.totalExpenses || 0}`,
    `Total Net: ${horizonSummary.totalNet || 0}`,
    `Average Monthly Net: ${horizonSummary.averageMonthlyNet || 0}`,
    '',
  ] : [];

  return [
    safetyHeader,
    outputShape,
    analysisRules,
    modeInstruction,
    `Mode: ${mode || 'monthly_review'}`,
    '',
    ...summarySection,
    ...recurringSection,
    ...allocationSection,
    ...goalsSection,
    ...ideasSection,
    ...incomeItemsSection,
    ...expenseItemsSection,
    ...horizonSection,
    'Now generate the analysis in JSON format only.',
  ].join('\n');
};

const getModeInstruction = (mode) => {
  const instructions = {
    monthly_review: 'Focus on this period\'s income, expenses, and net position. Highlight variances between expected and received income. Check if expenses are within normal ranges. Suggest organization improvements.',
    allocation_review: 'Focus on income allocation rules. Check if percentages add up to 100%. Identify gaps in allocation categories. Suggest whether allocation matches needs, savings, and giving priorities.',
    purchase_review: 'Focus on purchase goals. Check if savings progress is on track. Flag affordability risks if goals exceed available allocation. Review priority alignment.',
    investment_review: 'Focus on investment ideas and their risk/ethical profiles. Highlight ideas with ethicalStatus "needs_review" or "avoid". Review diversification across types. Do NOT recommend buying or selling specific assets.',
    recurring_income_review: 'Focus on recurring income rules. Check income stability based on active recurring rules. Highlight gaps where recurring income is missing or low confidence. Suggest improving income tracking.',
    next_actions: 'Suggest practical next actions based on all available data. Prioritize organization improvements, risk mitigation, and ethical review. Keep suggestions actionable and cautious.',
  };
  const instruction = instructions[mode] || instructions.monthly_review;
  return `--- MODE INSTRUCTION ---\n${instruction}\n`;
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
          route: 'api/ai.js',
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

    if (body?.testProvider === true || body?.testProvider === 'true' || body?.testProvider === 1) {
      const testPrompt = [
        'Return only valid JSON:',
        '{',
        '  "summary": "Hello from Gemini Finance Assistant",',
        '  "incomeAnalysis": [],',
        '  "expenseAnalysis": [],',
        '  "allocationReview": [],',
        '  "purchaseGoalReview": [],',
        '  "investmentRiskReview": [],',
        '  "recurringIncomeReview": [],',
        '  "ethicalReviewQuestions": [],',
        '  "warnings": [],',
        '  "nextActions": []',
        '}',
      ].join('\n');

      const testResult = await generateAnalysis({ apiKey, model, prompt: testPrompt });

      if (testResult.success) {
        const responseBody = {
          success: true,
          analysis: testResult.analysis,
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

      const responseBody = { success: false, error: 'Unable to generate analysis.', debug };
      if (!debugRequested) delete responseBody.debug;
      return toSafeJson(res, 500, responseBody);
    }

    const { financeSummary, mode, recurringRules, allocationRules, purchaseGoals, investmentIdeas, incomeItems, expenseItems, horizonSummary } = body;

    if (!financeSummary || typeof financeSummary !== 'object') {
      return toSafeJson(res, 400, { success: false, error: 'financeSummary is required.' });
    }

    const allowedModes = new Set(['monthly_review', 'allocation_review', 'purchase_review', 'investment_review', 'recurring_income_review', 'next_actions']);
    if (!mode || !allowedModes.has(mode)) {
      return toSafeJson(res, 400, { success: false, error: 'Valid mode is required.' });
    }

    const prompt = buildFinancePrompt({
      financeSummary,
      mode,
      recurringRules: Array.isArray(recurringRules) ? recurringRules : [],
      allocationRules: Array.isArray(allocationRules) ? allocationRules : [],
      purchaseGoals: Array.isArray(purchaseGoals) ? purchaseGoals : [],
      investmentIdeas: Array.isArray(investmentIdeas) ? investmentIdeas : [],
      incomeItems: Array.isArray(incomeItems) ? incomeItems : [],
      expenseItems: Array.isArray(expenseItems) ? expenseItems : [],
      horizonSummary: horizonSummary || null,
    });

    const result = await generateAnalysis({ apiKey, model, prompt });

    if (result.success) {
      return toSafeJson(res, 200, { success: true, analysis: result.analysis });
    }

    const isQuota = result?.providerError?.status === 429 || /quota|rate.?limit/i.test(result?.providerError?.message || '');
    if (isQuota) {
      return toSafeJson(res, 429, { success: false, code: 'AI_QUOTA_EXCEEDED', error: 'AI quota exceeded. Try again later or change Gemini model.' });
    }

    console.error('[AI Finance] Analysis failed', {
      route: 'ai-finance',
      model,
      providerStatus: result.status,
      providerErrorMessage: result.providerError?.message || 'Unknown error',
    });

    return toSafeJson(res, 200, { success: false, error: 'Unable to generate finance analysis.' });
  } catch (error) {
    console.error('[AI Finance] Unhandled error', {
      route: 'ai-finance',
      method: req?.method,
      message: error instanceof Error ? error.message : 'Unknown error',
    });

    return toSafeJson(res, 500, { success: false, error: 'AI finance function failed.' });
  }
}
