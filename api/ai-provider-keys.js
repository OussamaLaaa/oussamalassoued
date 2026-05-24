import { createClient } from '@supabase/supabase-js';
import aiKeyCrypto from './lib/aiKeyCrypto.js';
import aiProviderRouter from './lib/aiProviderRouter.js';

const { encryptApiKey, decryptApiKey } = aiKeyCrypto;
const { testProviderConnection } = aiProviderRouter;

const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';
const ALLOWED_PROVIDERS = new Set(['gemini', 'openai', 'anthropic', 'openrouter', 'nvidia', 'azure_openai', 'ollama']);

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

export default async function handler(req, res) {
  if (!isAuthenticated(req)) {
    return toSafeJson(res, 401, { success: false, error: 'Unauthorized.' });
  }

  const supabase = createSupabaseClient();
  const body = readBody(req);

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

        return toSafeJson(res, 200, { success: true, message: resultText || 'Connection succeeded.' });
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
}