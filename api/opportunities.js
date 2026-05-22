import { createClient } from '@supabase/supabase-js';

const allowedEntities = new Set(['companies', 'people', 'messages', 'deals']);
const tablesAttempted = ['companies', 'people', 'messages', 'deals'];
const DASHBOARD_SESSION_COOKIE = 'dashboard_session';
const DASHBOARD_SESSION_VALUE = 'test123';

const ENTITY_CONFIG = {
  companies: {
    idField: 'id',
  },
  people: {
    idField: 'id',
  },
  messages: {
    idField: 'id',
  },
  deals: {
    idField: 'id',
  },
};

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

const parseCookies = (cookieHeader) => {
  if (!cookieHeader || typeof cookieHeader !== 'string') return {};

  return cookieHeader.split(';').reduce((accumulator, part) => {
    const separatorIndex = part.indexOf('=');
    if (separatorIndex === -1) return accumulator;

    const key = part.slice(0, separatorIndex).trim();
    const value = part.slice(separatorIndex + 1).trim();
    if (key) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
};

const isDashboardAuthenticated = (req) => {
  const cookies = parseCookies(req?.headers?.cookie);
  return cookies[DASHBOARD_SESSION_COOKIE] === DASHBOARD_SESSION_VALUE;
};

const summarizeSupabaseError = (error) => {
  if (!error) return 'Unknown Supabase error';

  const safeParts = [error.code, error.details, error.hint, error.message]
    .filter(Boolean)
    .map((part) => String(part).replace(/https?:\/\/\S+/gi, '[redacted]'));

  return safeParts.join(' | ') || 'Unknown Supabase error';
};

const buildFailurePayload = ({ debug, failedTable, error, envPresent }) => ({
  success: false,
  ...(debug
    ? {
        envPresent,
        tablesAttempted,
        failedTable,
        errorCode: error?.code ?? null,
        errorMessage: summarizeSupabaseError(error),
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

const isValidEntity = (entity) => allowedEntities.has(entity);

const isValidId = (value) => typeof value === 'string' && value.trim().length > 0;

const buildMutationFailure = (message = 'Unable to save Opportunities data.') => ({
  success: false,
  error: message,
});

const toSafeJson = (res, status, body) => res.status(status).json(body);

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
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

  // When debug is requested, return safe, non-secret diagnostics about auth and env
  if (debug) {
    const cookies = parseCookies(req.headers?.cookie);
    const hasCookie = Boolean(cookies[DASHBOARD_SESSION_COOKIE]);
    const cookieMatches = cookies[DASHBOARD_SESSION_COOKIE] === DASHBOARD_SESSION_VALUE;

    return toSafeJson(res, 200, {
      success: true,
      debug: true,
      auth: {
        isAuthenticated: isDashboardAuthenticated(req),
        hasCookie,
        cookieMatches,
      },
      envPresent: getEnvPresence(),
    });
  }

  if (!isDashboardAuthenticated(req)) {
    return toSafeJson(res, 401, {
      success: false,
      error: 'Unauthorized',
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
    try {
      const results = {};

      for (const table of tablesAttempted) {
        const { data, error } = await supabase.from(table).select('*');

        if (error) {
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

    if (action !== 'insert') {
      return toSafeJson(res, 400, { success: false, error: 'Unsupported action.' });
    }

    if (!isValidEntity(entity)) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid entity.' });
    }

    if (!data || typeof data !== 'object') {
      return toSafeJson(res, 400, { success: false, error: 'Missing data payload.' });
    }

    try {
      const { data: insertedRow, error } = await supabase
        .from(entity)
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error(`[Opportunities] Supabase insert failed for ${entity}`, error);
        return toSafeJson(res, 500, { success: false, error: 'Unable to save Opportunities data.' });
      }

      return toSafeJson(res, 200, { success: true, row: insertedRow });
    } catch (error) {
      console.error(`[Opportunities] Unexpected insert failure for ${entity}`, error);
      return toSafeJson(res, 500, { success: false, error: 'Unable to save Opportunities data.' });
    }
  }

  if (req.method === 'PUT') {
    const body = readBody(req);
    const { entity, action, id, data } = body || {};

    if (action !== 'update') {
      return toSafeJson(res, 400, { success: false, error: 'Unsupported action.' });
    }

    if (!isValidEntity(entity)) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid entity.' });
    }

    if (!isValidId(id)) {
      return toSafeJson(res, 400, { success: false, error: 'Missing id.' });
    }

    if (!data || typeof data !== 'object') {
      return toSafeJson(res, 400, { success: false, error: 'Missing data payload.' });
    }

    try {
      const { data: updatedRow, error } = await supabase
        .from(entity)
        .update(data)
        .eq(ENTITY_CONFIG[entity].idField, id)
        .select()
        .single();

      if (error) {
        console.error(`[Opportunities] Supabase update failed for ${entity}`, error);
        return toSafeJson(res, 500, buildMutationFailure());
      }

      return toSafeJson(res, 200, { success: true, row: updatedRow });
    } catch (error) {
      console.error(`[Opportunities] Unexpected update failure for ${entity}`, error);
      return toSafeJson(res, 500, buildMutationFailure());
    }
  }

  if (req.method === 'DELETE') {
    const body = readBody(req);
    const { entity, action, id } = body || {};

    if (action !== 'delete') {
      return toSafeJson(res, 400, { success: false, error: 'Unsupported action.' });
    }

    if (!isValidEntity(entity)) {
      return toSafeJson(res, 400, { success: false, error: 'Invalid entity.' });
    }

    if (!isValidId(id)) {
      return toSafeJson(res, 400, { success: false, error: 'Missing id.' });
    }

    try {
      const { error } = await supabase.from(entity).delete().eq(ENTITY_CONFIG[entity].idField, id);

      if (error) {
        console.error(`[Opportunities] Supabase delete failed for ${entity}`, error);
        return toSafeJson(res, 500, buildMutationFailure());
      }

      return toSafeJson(res, 200, { success: true });
    } catch (error) {
      console.error(`[Opportunities] Unexpected delete failure for ${entity}`, error);
      return toSafeJson(res, 500, buildMutationFailure());
    }
  }

  return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
}