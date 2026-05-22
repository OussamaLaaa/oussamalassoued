import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

const allowedEntities = new Set(['companies', 'people', 'messages', 'deals', 'projects', 'message_templates']);
const tablesAttempted = ['companies', 'people', 'messages', 'deals', 'projects', 'message_templates'];
const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';

const getSupabaseClient = () => {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY;

  if (!supabaseUrl || !supabaseSecretKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: { persistSession: false },
  });
};

const getEnvPresence = () => ({
  SUPABASE_URL: Boolean(process.env.SUPABASE_URL),
  SUPABASE_SECRET_KEY: Boolean(process.env.SUPABASE_SECRET_KEY),
});

const isDebugEnabled = (req) => req?.query?.debug === '1' || req?.query?.debug === 1;

const buildMutationFailurePayload = ({ entity, action, error }) => ({
  success: false,
  error: action === 'update' ? 'Unable to update Opportunities data.' : action === 'delete' ? 'Unable to delete Opportunities data.' : 'Unable to save Opportunities data.',
  entity,
  action,
  errorCode: error?.code ?? null,
});

const buildFailurePayload = ({ debug, failedTable, error, envPresent }) => ({
  success: false,
  ...(debug
    ? {
        envPresent,
        tablesAttempted,
        failedTable,
        errorCode: error?.code ?? null,
        errorMessage: 'Unable to query Opportunities data.',
      }
    : {
        failedTable,
        error: 'Unable to load Opportunities data from Supabase.',
      }),
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

const toSafeJson = (res, status, body) => res.status(status).json(body);

const toNullableString = (value) => {
  if (value == null) return null;
  const parsed = String(value).trim();
  return parsed.length > 0 ? parsed : null;
};

const toRequiredString = (value, fallback = '') => {
  const parsed = toNullableString(value);
  return parsed ?? fallback;
};

const normalizeTemplateRow = (row, { forUpdate = false } = {}) => {
  const base = {
    name: toRequiredString(row?.name),
    audience: toRequiredString(row?.audience),
    goal: toRequiredString(row?.goal),
    language: toRequiredString(row?.language),
    subject: toNullableString(row?.subject),
    body: toRequiredString(row?.body),
    is_active: row?.is_active == null ? true : Boolean(row.is_active),
    updated_at: new Date().toISOString(),
  };

  if (forUpdate) {
    return base;
  }

  return {
    id: row?.id ?? randomUUID(),
    ...base,
    created_at: row?.created_at ?? new Date().toISOString(),
  };
};

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

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'GET' && (req?.query?.health === '1' || req?.query?.health === 1)) {
    return toSafeJson(res, 200, {
      success: true,
      route: 'api/opportunities.js',
      message: 'Opportunities API is reachable',
    });
  }

  const debug = isDebugEnabled(req);
  const envPresent = getEnvPresence();
  const supabase = getSupabaseClient();
  if (!supabase) {
    return toSafeJson(res, 500, {
      success: false,
      ...(debug
        ? {
            error: 'Missing Supabase environment variables',
            envPresent,
            tablesAttempted,
            failedTable: null,
            errorCode: null,
            errorMessage: 'Missing Supabase environment variables',
          }
        : {
            error: 'Missing Supabase environment variables',
            failedTable: null,
          }),
    });
  }

  if (req.method === 'GET') {
    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Authentication required.' });
    }

    try {
      const results = {};
      let templatesWarning = null;

      for (const table of tablesAttempted) {
        const { data, error } = await supabase.from(table).select('*');

        if (error) {
          // Keep main CRM data available even if templates table is unavailable/misconfigured.
          if (table === 'message_templates') {
            templatesWarning = 'Templates are temporarily unavailable.';
            results[table] = [];
            console.warn('[Opportunities] Optional table query failed for message_templates', error);
            continue;
          }

          console.error(`[Opportunities] Supabase query failed for ${table}`, error);
          return toSafeJson(
            res,
            500,
            buildFailurePayload({
              debug,
              failedTable: table,
              error,
              envPresent,
            })
          );
        }

        results[table] = data || [];
      }

      return toSafeJson(res, 200, {
        companies: results.companies || [],
        people: results.people || [],
        messages: results.messages || [],
        deals: results.deals || [],
        projects: results.projects || [],
        message_templates: results.message_templates || [],
        templatesWarning,
        strategyNotes: [],
      });
    } catch (error) {
      console.error('[Opportunities] Unexpected GET failure', error);
      return toSafeJson(res, 500, {
        ...buildFailurePayload({
          debug,
          failedTable: null,
          error,
          envPresent,
        }),
      });
    }
  }

  if (req.method === 'POST') {
    const body = readBody(req);
    const { entity, action, data } = body || {};

    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Authentication required.' });
    }

    if (action !== 'insert' && action !== 'bulk_insert') {
      return toSafeJson(res, 400, { success: false, error: 'Unsupported action.' });
    }

    if (!allowedEntities.has(entity)) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid entity.' });
    }

    if (!data || typeof data !== 'object') {
      return toSafeJson(res, 400, { success: false, error: 'Missing data payload.' });
    }

    const isBatch = Array.isArray(data) || action === 'bulk_insert';

    if (isBatch && (!Array.isArray(data) || data.length === 0)) {
      return toSafeJson(res, 400, { success: false, error: 'Empty batch payload.' });
    }

    try {
      const payload = entity === 'message_templates'
        ? (Array.isArray(data)
            ? data.map((row) => normalizeTemplateRow(row, { forUpdate: false }))
            : normalizeTemplateRow(data, { forUpdate: false }))
        : data;

      if (isBatch) {
        const { data: insertedRows, error } = await supabase
          .from(entity)
          .insert(payload)
          .select();

        if (error) {
          console.error('[Opportunities] Supabase batch insert failed', { entity, action, error });
          return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
        }

        return toSafeJson(res, 200, { success: true, rows: insertedRows || [] });
      }

      // Single insert
      const { data: insertedRow, error } = await supabase
        .from(entity)
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error('[Opportunities] Supabase insert failed', { entity, action, error });
        return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
      }

      return toSafeJson(res, 200, { success: true, row: insertedRow });
    } catch (error) {
      console.error('[Opportunities] Unexpected insert failure', { entity, action, error });
      return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
    }
  }

  if (req.method === 'PUT') {
    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Authentication required.' });
    }

    const body = readBody(req);
    const { entity, action, id, data } = body || {};

    if (action !== 'update') {
      return toSafeJson(res, 400, { success: false, error: 'Unsupported action.' });
    }

    if (!allowedEntities.has(entity)) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid entity.' });
    }

    if (!id) {
      return toSafeJson(res, 400, { success: false, error: 'Missing id.' });
    }

    if (!data || typeof data !== 'object') {
      return toSafeJson(res, 400, { success: false, error: 'Missing data payload.' });
    }

    try {
      const payload = entity === 'message_templates'
        ? normalizeTemplateRow(data, { forUpdate: true })
        : data;

      const { data: updatedRow, error } = await supabase
        .from(entity)
        .update(payload)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[Opportunities] Supabase update failed', { entity, action, id, error });
        return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
      }

      if (!updatedRow) {
        return toSafeJson(res, 404, { success: false, error: 'Record not found.' });
      }

      return toSafeJson(res, 200, { success: true, row: updatedRow });
    } catch (error) {
      console.error('[Opportunities] Unexpected update failure', { entity, action, id, error });
      return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
    }
  }

  if (req.method === 'DELETE') {
    if (!isAuthenticated(req)) {
      return toSafeJson(res, 401, { success: false, error: 'Authentication required.' });
    }

    const body = readBody(req);
    const { entity, action, id } = body || {};

    if (action !== 'delete') {
      return toSafeJson(res, 400, { success: false, error: 'Unsupported action.' });
    }

    if (!allowedEntities.has(entity)) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid entity.' });
    }

    if (!id) {
      return toSafeJson(res, 400, { success: false, error: 'Missing id.' });
    }

    try {
      const query = entity === 'message_templates'
        ? supabase
            .from(entity)
            .update({ is_active: false, updated_at: new Date().toISOString() })
            .eq('id', id)
            .select('id')
            .single()
        : supabase
            .from(entity)
            .delete()
            .eq('id', id);

      const { error } = await query;

      if (error) {
        console.error('[Opportunities] Supabase delete failed', { entity, action, id, error });
        return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
      }

      return toSafeJson(res, 200, { success: true });
    } catch (error) {
      console.error('[Opportunities] Unexpected delete failure', { entity, action, id, error });
      return toSafeJson(res, 500, buildMutationFailurePayload({ entity, action, error }));
    }
  }

  return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
}