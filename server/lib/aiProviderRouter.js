import { decryptApiKey } from './aiKeyCrypto.js';

export const AI_PROVIDERS = new Set(['gemini', 'openai', 'anthropic', 'openrouter', 'nvidia', 'azure_openai', 'ollama']);
export const AI_USE_CASES = new Set(['message', 'finance', 'document', 'lead_scoring', 'research', 'cleanup', 'strategy']);

const toCleanString = (value) => (value == null ? '' : String(value).trim());

const toNumber = (value, fallback) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const buildHeaders = ({ provider, apiKey, apiVersion }) => {
  const headers = { 'Content-Type': 'application/json' };

  if (provider === 'anthropic') {
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
  } else if (provider !== 'ollama') {
    headers.Authorization = `Bearer ${apiKey}`;
  }

  if (provider === 'openrouter') {
    headers['HTTP-Referer'] = 'https://openrouter.ai';
    headers['X-Title'] = 'Opportunities AI Control Center';
  }

  if (provider === 'azure_openai' && apiVersion) {
    headers['api-version'] = apiVersion;
  }

  return headers;
};

const buildUrl = ({ provider, baseUrl, endpoint, deploymentName, model, apiVersion }) => {
  if (provider === 'gemini') {
    const resolvedModel = model || 'gemini-2.0-flash';
    return `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(resolvedModel)}:generateContent`;
  }

  if (provider === 'openai') {
    return `${baseUrl || 'https://api.openai.com/v1'}/chat/completions`;
  }

  if (provider === 'openrouter') {
    return `${baseUrl || 'https://openrouter.ai/api/v1'}/chat/completions`;
  }

  if (provider === 'nvidia') {
    return `${baseUrl || 'https://integrate.api.nvidia.com/v1'}/chat/completions`;
  }

  if (provider === 'anthropic') {
    return `${baseUrl || 'https://api.anthropic.com/v1'}/messages`;
  }

  if (provider === 'azure_openai') {
    if (endpoint) {
      if (/api-version=/i.test(endpoint)) return endpoint;
      return `${endpoint}${endpoint.includes('?') ? '&' : '?'}api-version=${encodeURIComponent(apiVersion || '2024-06-01')}`;
    }

    if (baseUrl && deploymentName) {
      return `${baseUrl.replace(/\/+$/, '')}/openai/deployments/${encodeURIComponent(deploymentName)}/chat/completions?api-version=${encodeURIComponent(apiVersion || '2024-06-01')}`;
    }

    throw new Error('Azure OpenAI endpoint or deployment is required.');
  }

  if (provider === 'ollama') {
    const resolvedBase = (endpoint || baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
    return resolvedBase.endsWith('/api/chat') ? resolvedBase : `${resolvedBase}/api/chat`;
  }

  throw new Error(`Unsupported AI provider: ${provider}`);
};

const extractText = async (response, provider) => {
  const rawText = await response.text();
  if (!response.ok) {
    throw new Error(rawText || `${provider} request failed with status ${response.status}.`);
  }

  if (!rawText) return '';

  try {
    const data = JSON.parse(rawText);

    if (provider === 'gemini') {
      return data?.candidates?.[0]?.content?.parts?.map((part) => part?.text || '').join('') || '';
    }

    if (provider === 'anthropic') {
      return data?.content?.map((item) => item?.text || '').join('') || '';
    }

    if (provider === 'ollama') {
      return data?.message?.content || data?.response || '';
    }

    return data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || data?.output_text || '';
  } catch {
    return rawText;
  }
};

export const requestProviderCompletion = async ({ provider, apiKey, model, prompt, temperature = 0.2, maxOutputTokens = 900, baseUrl, endpoint, deploymentName, apiVersion }) => {
  if (!AI_PROVIDERS.has(provider)) {
    throw new Error(`Unsupported AI provider: ${provider}`);
  }

  if (provider === 'gemini' && !apiKey) {
    throw new Error('Gemini API key is missing.');
  }

  if (provider !== 'ollama' && provider !== 'gemini' && !apiKey) {
    throw new Error(`${provider} API key is missing.`);
  }

  const url = buildUrl({ provider, baseUrl, endpoint, deploymentName, model, apiVersion });
  const headers = buildHeaders({ provider, apiKey, apiVersion });
  let body;

  if (provider === 'gemini') {
    body = {
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: {
        temperature,
        topP: 0.9,
        maxOutputTokens,
      },
    };
  } else if (provider === 'anthropic') {
    body = {
      model: model || 'claude-3-5-sonnet-20240620',
      max_tokens: Math.max(1, Math.min(maxOutputTokens, 4096)),
      temperature,
      messages: [{ role: 'user', content: prompt }],
    };
  } else if (provider === 'ollama') {
    body = {
      model: model || 'llama3.1',
      messages: [{ role: 'user', content: prompt }],
      options: {
        temperature,
        num_predict: maxOutputTokens,
      },
      stream: false,
    };
  } else {
    body = {
      model: model || (provider === 'azure_openai' ? deploymentName : 'gpt-4o-mini'),
      temperature,
      max_tokens: maxOutputTokens,
      messages: [{ role: 'user', content: prompt }],
    };

    if (provider === 'openai' || provider === 'openrouter' || provider === 'nvidia' || provider === 'azure_openai') {
      body.stream = false;
    }
  }

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  return extractText(response, provider);
};

export const resolveAIExecutionConfig = async ({ supabase, useCase, fallbackEnvGemini = true }) => {
  const normalizedUseCase = toCleanString(useCase).toLowerCase();

  if (supabase && AI_USE_CASES.has(normalizedUseCase)) {
    const { data: setting } = await supabase
      .from('ai_use_case_settings')
      .select('*')
      .eq('use_case', normalizedUseCase)
      .eq('is_enabled', true)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (setting) {
      let providerKey = null;

      if (setting.provider_key_id) {
        const { data: keyRow } = await supabase
          .from('ai_provider_keys')
          .select('*')
          .eq('id', setting.provider_key_id)
          .eq('is_active', true)
          .maybeSingle();

        providerKey = keyRow || null;
      }

      if (setting.provider === 'ollama') {
        return {
          provider: 'ollama',
          apiKey: '',
          model: setting.model || providerKey?.model || 'llama3.1',
          baseUrl: providerKey?.base_url || setting.base_url || providerKey?.endpoint || setting.endpoint || 'http://localhost:11434',
          endpoint: providerKey?.endpoint || setting.endpoint || '',
          deploymentName: providerKey?.deployment_name || setting.deployment_name || '',
          apiVersion: providerKey?.api_version || setting.api_version || '',
          temperature: toNumber(setting.temperature, 0.2),
          maxOutputTokens: toNumber(setting.max_output_tokens, 900),
        };
      }

      if (providerKey?.api_key_encrypted) {
        return {
          provider: setting.provider || providerKey.provider,
          apiKey: decryptApiKey(providerKey.api_key_encrypted),
          model: setting.model || providerKey.model || '',
          baseUrl: providerKey.base_url || setting.base_url || '',
          endpoint: providerKey.endpoint || setting.endpoint || '',
          deploymentName: providerKey.deployment_name || setting.deployment_name || '',
          apiVersion: providerKey.api_version || setting.api_version || '',
          temperature: toNumber(setting.temperature, 0.2),
          maxOutputTokens: toNumber(setting.max_output_tokens, 900),
        };
      }
    }
  }

  if (!fallbackEnvGemini) return null;

  const apiKey = toCleanString(process.env.GEMINI_API_KEY);
  if (!apiKey) return null;

  return {
    provider: 'gemini',
    apiKey,
    model: toCleanString(process.env.GEMINI_MODEL) || 'gemini-2.0-flash',
    baseUrl: '',
    endpoint: '',
    deploymentName: '',
    apiVersion: '',
    temperature: 0.2,
    maxOutputTokens: 900,
  };
};

export const runAICompletion = async ({ supabase, useCase, prompt, temperature, maxOutputTokens, fallbackEnvGemini = true }) => {
  const executionConfig = await resolveAIExecutionConfig({ supabase, useCase, fallbackEnvGemini });

  if (!executionConfig) {
    return null;
  }

  return requestProviderCompletion({
    ...executionConfig,
    prompt,
    temperature: temperature ?? executionConfig.temperature ?? 0.2,
    maxOutputTokens: maxOutputTokens ?? executionConfig.maxOutputTokens ?? 900,
  });
};

export const testProviderConnection = async ({ provider, apiKey, model, baseUrl, endpoint, deploymentName, apiVersion }) => {
  const responseText = await requestProviderCompletion({
    provider,
    apiKey,
    model,
    baseUrl,
    endpoint,
    deploymentName,
    apiVersion,
    prompt: 'Reply with OK.',
    temperature: 0,
    maxOutputTokens: 32,
  });

  return responseText;
};

export default {
  AI_PROVIDERS,
  AI_USE_CASES,
  requestProviderCompletion,
  resolveAIExecutionConfig,
  runAICompletion,
  testProviderConnection,
};
