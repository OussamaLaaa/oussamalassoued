import { createClient } from '@supabase/supabase-js';

const allowedEntities = new Set(['companies', 'people', 'messages', 'deals']);

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

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return toSafeJson(res, 500, {
      success: false,
      error: 'Supabase environment variables are not configured.',
    });
  }

  if (req.method === 'GET') {
    try {
      const [companiesResult, peopleResult, messagesResult, dealsResult] = await Promise.all([
        supabase.from('companies').select('*'),
        supabase.from('people').select('*'),
        supabase.from('messages').select('*'),
        supabase.from('deals').select('*'),
      ]);

      if (companiesResult.error || peopleResult.error || messagesResult.error || dealsResult.error) {
        return toSafeJson(res, 500, {
          success: false,
          error: 'Unable to load Opportunities data from Supabase.',
        });
      }

      return toSafeJson(res, 200, {
        companies: companiesResult.data || [],
        people: peopleResult.data || [],
        messages: messagesResult.data || [],
        deals: dealsResult.data || [],
        strategyNotes: [],
      });
    } catch (error) {
      return toSafeJson(res, 500, {
        success: false,
        error: 'Unable to load Opportunities data from Supabase.',
      });
    }
  }

  if (req.method === 'POST') {
    const body = readBody(req);
    const { entity, action, data } = body || {};

    if (action !== 'insert') {
      return toSafeJson(res, 400, { success: false, error: 'Unsupported action.' });
    }

    if (!allowedEntities.has(entity)) {
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
        return toSafeJson(res, 500, { success: false, error: 'Unable to save Opportunities data.' });
      }

      return toSafeJson(res, 200, { success: true, row: insertedRow });
    } catch (error) {
      return toSafeJson(res, 500, { success: false, error: 'Unable to save Opportunities data.' });
    }
  }

  return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
}