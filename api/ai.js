import aiMessageHandler from '../server/lib/aiMessageHandler.js';
import aiFinanceHandler from '../server/lib/aiFinanceHandler.js';
import aiDocumentHandler from '../server/lib/aiDocumentHandler.js';
import aiLeadScoringHandler from '../server/lib/aiLeadScoringHandler.js';
import aiRelationshipHandler from '../server/lib/aiRelationshipHandler.js';
import { createClient } from '@supabase/supabase-js';
import aiKeyCrypto from '../server/lib/aiKeyCrypto.js';
import aiProviderRouter from '../server/lib/aiProviderRouter.js';

const { testProviderConnection, checkAIUseCaseStatus } = aiProviderRouter;

const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const ALLOWED_PROVIDERS = new Set(['gemini', 'openai', 'anthropic', 'openrouter', 'nvidia', 'azure_openai', 'ollama']);

const toSafeJson = (res, status, body) => res.status(status).json(body);

const cloneRequest = (req, overrides = {}) => ({
  ...req,
  query: { ...(req.query || {}), ...(overrides.query || {}) },
  body: overrides.body !== undefined ? overrides.body : req.body,
});

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

const toCleanString = (value) => (value == null ? '' : String(value).trim());

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
  if (!isAuthenticated(req)) {
    return toSafeJson(res, 401, { success: false, error: 'Unauthorized.' });
  }

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
              error: 'AI provider request failed.',
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

          return toSafeJson(res, 500, { success: false, error: error instanceof Error ? error.message : 'Failed to test provider key.' });
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
    return toSafeJson(res, 500, { success: false, error: error instanceof Error ? error.message : 'Internal server error.' });
  }
};

const handleUseCaseTest = async (req, res) => {
  if (!isAuthenticated(req)) {
    return toSafeJson(res, 401, { success: false, error: 'Unauthorized.' });
  }

  const supabase = createSupabaseClient();
  const body = readBody(req);
  const useCase = toCleanString(body.useCase).toLowerCase();
  const allowed = ['message', 'finance', 'document', 'lead_scoring', 'relationship'];

  if (!allowed.includes(useCase)) {
    return toSafeJson(res, 400, { success: false, error: 'Invalid use case for testing.' });
  }

  const testPrompts = {
    message: 'Return only JSON:\n{"message":"Hello from AI Control test"}',
    finance: 'Return only JSON:\n{"summary":"OK","incomeAnalysis":[],"expenseAnalysis":[],"allocationReview":[],"purchaseGoalReview":[],"investmentRiskReview":[],"recurringIncomeReview":[],"ethicalReviewQuestions":[],"warnings":[],"nextActions":[]}',
    document: '<SUMMARY>OK</SUMMARY>\n<IMPROVED_CONTENT></IMPROVED_CONTENT>\n<RISKS></RISKS>\n<MISSING_CLAUSES></MISSING_CLAUSES>\n<SUGGESTED_SECTIONS></SUGGESTED_SECTIONS>\n<QUESTIONS_TO_REVIEW></QUESTIONS_TO_REVIEW>\n<NEXT_ACTIONS></NEXT_ACTIONS>',
    lead_scoring: '<DATABASE_TYPE>sme</DATABASE_TYPE>\n<INDUSTRY>tech</INDUSTRY>\n<PRIORITY>medium</PRIORITY>\n<FIT_SCORE>5</FIT_SCORE>\n<ETHICAL_FIT>good</ETHICAL_FIT>\n<UX_PROBLEM></UX_PROBLEM>\n<SERVICE_TO_OFFER></SERVICE_TO_OFFER>\n<NEXT_ACTION></NEXT_ACTION>\n<REASONING_SUMMARY>OK</REASONING_SUMMARY>\n<RISKS></RISKS>\n<QUESTIONS_TO_REVIEW></QUESTIONS_TO_REVIEW>',
    relationship: '<SUMMARY>OK</SUMMARY>\n<OBSERVATIONS>\n- Test observation\n</OBSERVATIONS>\n<STRENGTHS></STRENGTHS>\n<CONCERNS></CONCERNS>\n<NEXT_STEPS>\n- Test step\n</NEXT_STEPS>\n<FOLLOW_UP_DRAFT></FOLLOW_UP_DRAFT>\n<LOG_CHANNEL>other</LOG_CHANNEL>\n<LOG_TYPE>follow_up</LOG_TYPE>\n<LOG_SUMMARY></LOG_SUMMARY>\n<LOG_OUTCOME></LOG_OUTCOME>\n<LOG_NEXT_ACTION></LOG_NEXT_ACTION>\n<APPROVAL_NOTE></APPROVAL_NOTE>',
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
    return toSafeJson(res, 500, { success: false, error: error instanceof Error ? error.message : 'Use case test failed.' });
  }
};

export default async function handler(req, res) {
  const action = String(req.query?.action || req.body?.action || '').trim().toLowerCase();

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
      for (const uc of ['message', 'finance', 'document', 'lead_scoring', 'relationship', 'research', 'cleanup', 'strategy']) {
        useCaseStatuses[uc] = supabase ? await checkAIUseCaseStatus({ supabase, useCase: uc }) : { configured: false, source: 'none' };
      }
      return toSafeJson(res, 200, {
        success: true,
        route: 'api/ai',
        aiControl: true,
        encryptionConfigured,
        supportedProviders: ['gemini', 'openai', 'anthropic', 'openrouter', 'nvidia', 'azure_openai', 'ollama'],
        supportedUseCases: ['message', 'finance', 'document', 'lead_scoring', 'relationship', 'research', 'cleanup', 'strategy'],
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

  if (req.method === 'POST' && action === 'use-case-test') {
    return handleUseCaseTest(req, res);
  }

  return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
}