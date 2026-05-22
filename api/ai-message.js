import { GoogleGenAI } from '@google/genai';

const COOKIE_NAME = 'dashboard_session';
const COOKIE_VALUE = 'test123';

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

const normalizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const buildPrompt = ({ templateText, person, company, observation, goal, tone, length, language }) => {
  const systemInstruction = [
    'You are helping write concise professional outreach messages for UX/UI career and freelance opportunities.',
    'Do not invent facts.',
    'Do not claim experience or results not provided.',
    'Do not sound spammy.',
    'Do not manipulate.',
    'Keep the message natural, respectful, and specific.',
    'Respect the selected language.',
    'Mention observation only if provided.',
    'Output only the final message text, no explanations.',
  ].join(' ');

  const contextLines = [
    `Language: ${language}`,
    `Tone: ${tone}`,
    `Length: ${length}`,
    goal ? `Goal: ${goal}` : null,
    person?.fullName ? `Person full name: ${person.fullName}` : null,
    person?.role ? `Person role: ${person.role}` : null,
    company?.name ? `Company name: ${company.name}` : null,
    company?.industry ? `Company industry: ${company.industry}` : null,
    company?.country ? `Company country: ${company.country}` : null,
    company?.website ? `Company website: ${company.website}` : null,
    observation ? `Observation: ${observation}` : null,
    '',
    'Template text:',
    templateText,
  ].filter(Boolean);

  return `${systemInstruction}\n\n${contextLines.join('\n')}`;
};

export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return toSafeJson(res, 405, { success: false, error: 'Method not allowed.' });
  }

  if (!isAuthenticated(req)) {
    return toSafeJson(res, 401, { success: false, error: 'Unauthorized' });
  }

  const provider = normalizeString(process.env.AI_PROVIDER);
  const apiKey = normalizeString(process.env.GEMINI_API_KEY);
  const model = normalizeString(process.env.GEMINI_MODEL) || 'gemini-2.0-flash';

  if (provider !== 'gemini' || !apiKey) {
    return toSafeJson(res, 200, { success: false, error: 'AI provider is not configured.' });
  }

  const body = readBody(req);
  const templateText = normalizeString(body?.templateText);
  const language = normalizeString(body?.language);

  if (!templateText) {
    return toSafeJson(res, 400, { success: false, error: 'templateText is required.' });
  }

  if (!language) {
    return toSafeJson(res, 400, { success: false, error: 'language is required.' });
  }

  const tone = normalizeString(body?.tone) || 'professional';
  const length = normalizeString(body?.length) || 'short';

  const prompt = buildPrompt({
    templateText,
    person: body?.person || {},
    company: body?.company || {},
    observation: normalizeString(body?.observation),
    goal: normalizeString(body?.goal),
    tone,
    length,
    language,
  });

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const message = normalizeString(response?.text);
    if (!message) {
      throw new Error('Empty Gemini response.');
    }

    return toSafeJson(res, 200, { success: true, message });
  } catch (error) {
    console.error('[AI Message] Generation failed', {
      message: error instanceof Error ? error.message : 'Unknown error',
    });
    return toSafeJson(res, 200, { success: false, error: 'Unable to generate message.' });
  }
}
