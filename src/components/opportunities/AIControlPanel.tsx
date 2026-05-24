import React, { useState, useEffect } from 'react';
import type {
  AIProvider,
  AIProviderKey,
  AIProviderKeyInput,
  AIUseCase,
  AIUseCaseSetting,
  AIUseCaseSettingInput,
} from '../../types/opportunities';

const PROVIDER_OPTIONS: Array<{ value: AIProvider; label: string; hint: string }> = [
  { value: 'gemini', label: 'Gemini', hint: 'Google AI Studio / Vertex AI compatible key' },
  { value: 'openai', label: 'OpenAI', hint: 'OpenAI chat-completions API' },
  { value: 'anthropic', label: 'Anthropic', hint: 'Claude messages API' },
  { value: 'openrouter', label: 'OpenRouter', hint: 'Multi-model routing endpoint' },
  { value: 'nvidia', label: 'NVIDIA', hint: 'NIM / hosted model endpoint' },
  { value: 'azure_openai', label: 'Azure OpenAI', hint: 'Azure deployment plus API version' },
  { value: 'ollama', label: 'Ollama', hint: 'Local or self-hosted endpoint' },
];

const DEFAULT_MODELS: Record<string, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
  anthropic: 'claude-3-5-haiku-latest',
  openrouter: 'google/gemini-2.0-flash-001',
  nvidia: 'meta/llama-3.1-70b-instruct',
  azure_openai: 'default-deployment',
  ollama: 'llama3.1',
};

const getDefaultModelForProvider = (provider: string): string => DEFAULT_MODELS[provider] || 'default';

const USE_CASE_OPTIONS: Array<{ value: AIUseCase; label: string; hint: string }> = [
  { value: 'message', label: 'Message generation', hint: 'Outreach and reply drafting' },
  { value: 'finance', label: 'Finance assistant', hint: 'Budgeting, allocation, and forecasting' },
  { value: 'document', label: 'Document assistant', hint: 'Drafting, rewrites, and reviews' },
  { value: 'lead_scoring', label: 'Lead scoring', hint: 'Rank people and companies' },
  { value: 'relationship', label: 'Relationship assistant', hint: 'Respectful follow-ups and relationship analysis' },
  { value: 'research', label: 'Research', hint: 'Briefs, summaries, and analysis' },
  { value: 'cleanup', label: 'Cleanup', hint: 'Normalization and content cleanup' },
  { value: 'strategy', label: 'Strategy', hint: 'Plans, goals, and decision support' },
];

const defaultProviderForm = (): AIProviderKeyInput => ({
  label: '',
  provider: 'gemini',
  apiKey: '',
  baseUrl: '',
  endpoint: '',
  deploymentName: '',
  apiVersion: '',
  isActive: true,
  notes: '',
});

const defaultUseCaseForm = (): AIUseCaseSettingInput => ({
  useCase: 'message',
  providerKeyId: '',
  provider: 'gemini',
  model: '',
  temperature: 0.2,
  maxOutputTokens: 900,
  isEnabled: true,
  notes: '',
});

const cardClass = 'rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm shadow-slate-200/50';

const AIControlPanel: React.FC<{
  aiProviderKeys: AIProviderKey[];
  aiUseCaseSettings: AIUseCaseSetting[];
  onAddAIProviderKey: (input: AIProviderKeyInput) => Promise<AIProviderKey>;
  onUpdateAIProviderKey: (id: string, input: Partial<AIProviderKeyInput>) => Promise<AIProviderKey>;
  onDeleteAIProviderKey: (id: string) => Promise<void>;
  onTestAIProviderKey: (input: { id?: string; provider: string; apiKey?: string; model?: string; baseUrl?: string; endpoint?: string; deploymentName?: string; apiVersion?: string }) => Promise<string>;
  onAddAIUseCaseSetting: (input: AIUseCaseSettingInput) => Promise<AIUseCaseSetting>;
  onUpdateAIUseCaseSetting: (id: string, input: Partial<AIUseCaseSettingInput>) => Promise<AIUseCaseSetting>;
  onDeleteAIUseCaseSetting: (id: string) => Promise<void>;
}> = ({
  aiProviderKeys,
  aiUseCaseSettings,
  onAddAIProviderKey,
  onUpdateAIProviderKey,
  onDeleteAIProviderKey,
  onTestAIProviderKey,
  onAddAIUseCaseSetting,
  onUpdateAIUseCaseSetting,
  onDeleteAIUseCaseSetting,
}) => {
  const [providerForm, setProviderForm] = useState<AIProviderKeyInput>(defaultProviderForm);
  const [providerEditingId, setProviderEditingId] = useState<string | null>(null);
  const [useCaseForm, setUseCaseForm] = useState<AIUseCaseSettingInput>(defaultUseCaseForm);
  const [useCaseEditingId, setUseCaseEditingId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'routing' | 'tests' | 'security'>('overview');
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [testingUseCase, setTestingUseCase] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<any>(null);

  useEffect(() => {
    fetch('/api/ai?action=health&type=control', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => { if (d.success) setHealthData(d); })
      .catch(() => {});
  }, []);

  const submitProviderForm = async () => {
    const payload = {
      ...providerForm,
      apiKey: providerForm.apiKey?.trim() || undefined,
      label: providerForm.label.trim(),
      baseUrl: providerForm.baseUrl?.trim() || undefined,
      endpoint: providerForm.endpoint?.trim() || undefined,
      deploymentName: providerForm.deploymentName?.trim() || undefined,
      apiVersion: providerForm.apiVersion?.trim() || undefined,
      notes: providerForm.notes?.trim() || undefined,
    };

    if (!payload.label) {
      throw new Error('Provider label is required.');
    }

    if (providerEditingId) {
      await onUpdateAIProviderKey(providerEditingId, payload);
      setStatusMessage('Provider key updated.');
    } else {
      await onAddAIProviderKey(payload);
      setStatusMessage('Provider key saved and encrypted.');
    }

    setProviderForm(defaultProviderForm());
    setProviderEditingId(null);
  };

  const submitUseCaseForm = async () => {
    const resolvedProvider = useCaseForm.provider || 'gemini';
    const modelRaw = useCaseForm.model?.trim() || '';
    const resolvedModel = modelRaw || getDefaultModelForProvider(resolvedProvider);

    if (!resolvedModel) {
      throw new Error('Model is required. Choose or enter a model before saving.');
    }

    const payload: AIUseCaseSettingInput = {
      ...useCaseForm,
      useCase: useCaseForm.useCase,
      providerKeyId: useCaseForm.providerKeyId?.trim() || undefined,
      provider: resolvedProvider,
      model: resolvedModel,
      temperature: useCaseForm.temperature == null ? undefined : Number(useCaseForm.temperature),
      maxOutputTokens: useCaseForm.maxOutputTokens == null ? undefined : Number(useCaseForm.maxOutputTokens),
      notes: useCaseForm.notes?.trim() || undefined,
      isEnabled: useCaseForm.isEnabled,
    };

    if (useCaseEditingId) {
      await onUpdateAIUseCaseSetting(useCaseEditingId, payload);
      setStatusMessage('Use-case routing updated.');
    } else {
      await onAddAIUseCaseSetting(payload);
      setStatusMessage('Use-case routing saved.');
    }

    setUseCaseForm(defaultUseCaseForm());
    setUseCaseEditingId(null);
  };

  const runUseCaseTest = async (useCase: string) => {
    setTestingUseCase(useCase);
    setTestResults((prev) => ({ ...prev, [`useCase:${useCase}`]: 'Testing...' }));
    try {
      const response = await fetch('/api/ai?action=use-case-test', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ useCase }),
      });
      const data = await response.json();
      setTestResults((prev) => ({ ...prev, [`useCase:${useCase}`]: data.success ? 'OK' : data.error || 'Failed' }));
    } catch {
      setTestResults((prev) => ({ ...prev, [`useCase:${useCase}`]: 'Request failed' }));
    } finally {
      setTestingUseCase(null);
    }
  };

  const runProviderTest = async (provider: AIProvider) => {
    setTestResults((prev) => ({ ...prev, [`provider:${provider}`]: 'Testing...' }));
    try {
      const key = aiProviderKeys.find((k) => k.provider === provider && k.isActive);
      if (!key) {
        setTestResults((prev) => ({ ...prev, [`provider:${provider}`]: 'No active key found' }));
        return;
      }
      const message = await onTestAIProviderKey({
        id: key.id, provider: key.provider, model: key.deploymentName,
        baseUrl: key.baseUrl, endpoint: key.endpoint,
        deploymentName: key.deploymentName, apiVersion: key.apiVersion,
      });
      setTestResults((prev) => ({ ...prev, [`provider:${provider}`]: message || 'OK' }));
    } catch (error) {
      setTestResults((prev) => ({ ...prev, [`provider:${provider}`]: error instanceof Error ? error.message : 'Failed' }));
    }
  };

  const overviewCards = [
    { label: 'Active provider keys', value: aiProviderKeys.filter((k) => k.isActive).length, total: aiProviderKeys.length },
    { label: 'Enabled use cases', value: aiUseCaseSettings.filter((s) => s.isEnabled).length, total: aiUseCaseSettings.length },
    { label: 'Gemini fallback configured', value: healthData?.envGeminiConfigured ? 'Yes' : 'No', total: '' },
    { label: 'Encryption configured', value: healthData?.encryptionConfigured ? 'Yes' : 'No', total: 'AES-256-GCM' },
  ];

  const useCaseStatuses = healthData?.useCaseStatuses || {};
  const detailCards = [
    { label: 'Document AI', key: 'document' },
    { label: 'Finance AI', key: 'finance' },
    { label: 'Relationship AI', key: 'relationship' },
    { label: 'Lead Scoring AI', key: 'lead_scoring' },
  ];

  const tabs = [
    { key: 'overview', label: 'Overview' },
    { key: 'keys', label: 'Provider Keys' },
    { key: 'routing', label: 'Use Case Routing' },
    { key: 'tests', label: 'Provider Tests' },
    { key: 'security', label: 'Security Notes' },
  ] as const;

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">AI Control Center</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Workspace AI providers and routing</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Provider keys are encrypted server-side and are never returned to the browser. Routing rules are stored at the workspace level.
            </p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Keys are stored once, encrypted with AES-256-GCM, and cannot be recovered from the browser.
          </div>
        </div>
        {statusMessage ? (
          <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
            {statusMessage}
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab.key
                ? 'border-slate-900 text-slate-900'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {overviewCards.map((card) => (
            <div key={card.label} className={cardClass}>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">{String(card.value)}</p>
              {card.total ? <p className="mt-1 text-xs text-slate-500">of {card.total}</p> : null}
            </div>
          ))}
          {detailCards.map((card) => {
            const status = useCaseStatuses[card.key];
            const configured = status?.configured;
            const source = status?.source || 'none';
            return (
              <div key={card.key} className={cardClass}>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{card.label}</p>
                <p className={`mt-2 text-sm font-semibold ${configured ? 'text-emerald-700' : 'text-slate-500'}`}>
                  {configured ? 'Configured' : 'Not configured'}
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {source === 'byok' ? 'BYOK' : source === 'env_fallback' ? 'Env fallback' : source === 'disabled' ? 'Disabled' : '—'}
                </p>
              </div>
            );
          })}
        </div>
      )}

      {activeTab === 'keys' && (
        <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
          <div className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Provider keys</h3>
                <p className="text-sm text-slate-600">Add, test, and rotate encrypted provider credentials.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setProviderForm(defaultProviderForm());
                  setProviderEditingId(null);
                }}
                className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                New key
              </button>
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-2">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">Label</span>
                <input
                  value={providerForm.label}
                  onChange={(event) => setProviderForm((current) => ({ ...current, label: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-400"
                  placeholder="Primary OpenAI workspace key"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">Provider</span>
                <select
                  value={providerForm.provider}
                  onChange={(event) => setProviderForm((current) => ({ ...current, provider: event.target.value as AIProvider }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  {PROVIDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">API key</span>
                <input
                  value={providerForm.apiKey || ''}
                  onChange={(event) => setProviderForm((current) => ({ ...current, apiKey: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-400"
                  placeholder={providerEditingId ? 'Leave blank to keep the existing secret' : 'Paste the provider secret'}
                  type="password"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">Model</span>
                <input
                  value={providerForm.deploymentName || ''}
                  onChange={(event) => setProviderForm((current) => ({ ...current, deploymentName: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-400"
                  placeholder="Model or deployment name"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">Base URL</span>
                <input
                  value={providerForm.baseUrl || ''}
                  onChange={(event) => setProviderForm((current) => ({ ...current, baseUrl: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-400"
                  placeholder="Optional API base URL"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">Endpoint</span>
                <input
                  value={providerForm.endpoint || ''}
                  onChange={(event) => setProviderForm((current) => ({ ...current, endpoint: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-400"
                  placeholder="Optional direct endpoint"
                />
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">API version</span>
                <input
                  value={providerForm.apiVersion || ''}
                  onChange={(event) => setProviderForm((current) => ({ ...current, apiVersion: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-400"
                  placeholder="Required for some Azure deployments"
                />
              </label>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-700 lg:col-span-2">
                <input
                  type="checkbox"
                  checked={providerForm.isActive !== false}
                  onChange={(event) => setProviderForm((current) => ({ ...current, isActive: event.target.checked }))}
                />
                Active provider key
              </label>

              <label className="space-y-2 text-sm lg:col-span-2">
                <span className="font-medium text-slate-700">Notes</span>
                <textarea
                  value={providerForm.notes || ''}
                  onChange={(event) => setProviderForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-[88px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Optional notes about ownership, limits, or environment"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await submitProviderForm();
                  } catch (error) {
                    setStatusMessage(error instanceof Error ? error.message : 'Failed to save provider key.');
                  }
                }}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {providerEditingId ? 'Update key' : 'Save key'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    const message = await onTestAIProviderKey({
                      provider: providerForm.provider,
                      apiKey: providerForm.apiKey?.trim() || undefined,
                      model: providerForm.deploymentName?.trim() || undefined,
                      baseUrl: providerForm.baseUrl?.trim() || undefined,
                      endpoint: providerForm.endpoint?.trim() || undefined,
                      deploymentName: providerForm.deploymentName?.trim() || undefined,
                      apiVersion: providerForm.apiVersion?.trim() || undefined,
                    });
                    setStatusMessage(message || 'Provider test succeeded.');
                  } catch (error) {
                    setStatusMessage(error instanceof Error ? error.message : 'Provider test failed.');
                  }
                }}
                className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                Test draft
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {aiProviderKeys.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No provider keys yet.
                </div>
              ) : aiProviderKeys.map((key) => (
                <div key={key.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{key.label}</h4>
                        <span className="rounded-full bg-slate-900 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">{key.provider}</span>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${key.isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {key.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        Secret stored securely. Last 4: {key.apiKeyLast4 || '—'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {key.baseUrl || key.endpoint || key.deploymentName || key.apiVersion ? [key.baseUrl, key.endpoint, key.deploymentName, key.apiVersion].filter(Boolean).join(' • ') : 'No extra routing details saved.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            const message = await onTestAIProviderKey({ id: key.id, provider: key.provider, model: key.deploymentName, baseUrl: key.baseUrl, endpoint: key.endpoint, deploymentName: key.deploymentName, apiVersion: key.apiVersion });
                            setStatusMessage(message || 'Provider test succeeded.');
                          } catch (error) {
                            setStatusMessage(error instanceof Error ? error.message : 'Provider test failed.');
                          }
                        }}
                        className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                      >
                        Test
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setProviderEditingId(key.id);
                          setProviderForm({
                            label: key.label,
                            provider: key.provider,
                            apiKey: '',
                            baseUrl: key.baseUrl || '',
                            endpoint: key.endpoint || '',
                            deploymentName: key.deploymentName || '',
                            apiVersion: key.apiVersion || '',
                            isActive: key.isActive,
                            notes: key.notes || '',
                          });
                        }}
                        className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await onDeleteAIProviderKey(key.id);
                            if (providerEditingId === key.id) {
                              setProviderEditingId(null);
                              setProviderForm(defaultProviderForm());
                            }
                            setStatusMessage('Provider key removed.');
                          } catch (error) {
                            setStatusMessage(error instanceof Error ? error.message : 'Failed to delete provider key.');
                          }
                        }}
                        className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Use-case routing</h3>
                <p className="text-sm text-slate-600">Map each AI workflow to a provider key and model.</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setUseCaseForm(defaultUseCaseForm());
                  setUseCaseEditingId(null);
                }}
                className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50"
              >
                New rule
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">Use case</span>
                <select
                  value={useCaseForm.useCase}
                  onChange={(event) => setUseCaseForm((current) => ({ ...current, useCase: event.target.value as AIUseCase }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                >
                  {USE_CASE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">Provider key</span>
                  <select
                    value={useCaseForm.providerKeyId || ''}
                    onChange={(event) => {
                      const keyId = event.target.value;
                      const selectedKey = keyId ? aiProviderKeys.find((k) => k.id === keyId) : undefined;
                      setUseCaseForm((current) => {
                        const nextProvider = (selectedKey?.provider || current.provider || 'gemini') as AIProvider;
                        const nextModel = current.model?.trim() || getDefaultModelForProvider(nextProvider);
                        return { ...current, providerKeyId: keyId, provider: nextProvider, model: nextModel };
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    <option value="">Use the provider's defaults</option>
                    {aiProviderKeys.map((key) => (
                      <option key={key.id} value={key.id}>{key.label} ({key.provider})</option>
                    ))}
                  </select>
              </label>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Provider override</span>
                  <select
                    value={useCaseForm.provider || 'gemini'}
                    onChange={(event) => {
                      const nextProvider = event.target.value as AIProvider;
                      setUseCaseForm((current) => {
                        const nextModel = current.model?.trim() || getDefaultModelForProvider(nextProvider);
                        return { ...current, provider: nextProvider, model: nextModel };
                      });
                    }}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  >
                    {PROVIDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Model</span>
                  <input
                    value={useCaseForm.model || ''}
                    onChange={(event) => setUseCaseForm((current) => ({ ...current, model: event.target.value }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-400"
                    placeholder={`Model (e.g. ${getDefaultModelForProvider(useCaseForm.provider || 'gemini')})`}
                  />
                </label>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Temperature</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={useCaseForm.temperature ?? ''}
                    onChange={(event) => setUseCaseForm((current) => ({ ...current, temperature: event.target.value === '' ? undefined : Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-400"
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="font-medium text-slate-700">Max output tokens</span>
                  <input
                    type="number"
                    min="64"
                    max="8192"
                    value={useCaseForm.maxOutputTokens ?? ''}
                    onChange={(event) => setUseCaseForm((current) => ({ ...current, maxOutputTokens: event.target.value === '' ? undefined : Number(event.target.value) }))}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none ring-0 transition focus:border-slate-400"
                  />
                </label>
              </div>

              <label className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={useCaseForm.isEnabled !== false}
                  onChange={(event) => setUseCaseForm((current) => ({ ...current, isEnabled: event.target.checked }))}
                />
                Enabled
              </label>

              <label className="space-y-2 text-sm">
                <span className="font-medium text-slate-700">Notes</span>
                <textarea
                  value={useCaseForm.notes || ''}
                  onChange={(event) => setUseCaseForm((current) => ({ ...current, notes: event.target.value }))}
                  className="min-h-[88px] w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-400"
                  placeholder="Optional routing details"
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await submitUseCaseForm();
                  } catch (error) {
                    setStatusMessage(error instanceof Error ? error.message : 'Failed to save routing rule.');
                  }
                }}
                className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
              >
                {useCaseEditingId ? 'Update rule' : 'Save rule'}
              </button>
            </div>

            <div className="mt-6 space-y-3">
              {aiUseCaseSettings.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                  No routing rules yet.
                </div>
              ) : aiUseCaseSettings.map((setting) => (
                <div key={setting.id} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-sm font-semibold text-slate-900">{setting.useCase}</h4>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${setting.isEnabled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                          {setting.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <p className="mt-2 text-xs text-slate-600">
                        {setting.providerKeyLabel ? `${setting.providerKeyLabel} (${setting.provider || 'provider'})` : 'No provider key selected.'}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {setting.model || 'Model inherited from the provider defaults'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setUseCaseEditingId(setting.id);
                          setUseCaseForm({
                            useCase: setting.useCase,
                            providerKeyId: setting.providerKeyId || '',
                            provider: setting.provider || 'gemini',
                            model: setting.model || '',
                            temperature: setting.temperature ?? 0.2,
                            maxOutputTokens: setting.maxOutputTokens ?? 900,
                            isEnabled: setting.isEnabled,
                            notes: setting.notes || '',
                          });
                        }}
                        className="rounded-full border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await onDeleteAIUseCaseSetting(setting.id);
                            if (useCaseEditingId === setting.id) {
                              setUseCaseEditingId(null);
                              setUseCaseForm(defaultUseCaseForm());
                            }
                            setStatusMessage('Routing rule removed.');
                          } catch (error) {
                            setStatusMessage(error instanceof Error ? error.message : 'Failed to delete routing rule.');
                          }
                        }}
                        className="rounded-full border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'routing' && (
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-slate-900">Use case routing table</h3>
          <p className="mt-1 text-sm text-slate-600">Quick overview and inline toggles for all use cases.</p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs font-semibold uppercase tracking-[0.15em] text-slate-500">
                  <th className="pb-2 pr-4">Use case</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Provider</th>
                  <th className="pb-2 pr-4">Model</th>
                  <th className="pb-2 pr-4">Temp</th>
                  <th className="pb-2 pr-4">Max tokens</th>
                  <th className="pb-2 pr-4">Test</th>
                </tr>
              </thead>
              <tbody>
                {USE_CASE_OPTIONS.map((option) => {
                  const setting = aiUseCaseSettings.find((s) => s.useCase === option.value);
                  return (
                    <tr key={option.value} className="border-b border-slate-100">
                      <td className="py-3 pr-4 font-medium text-slate-900">{option.label}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.15em] ${
                          setting?.isEnabled
                            ? 'bg-emerald-100 text-emerald-800'
                            : setting
                            ? 'bg-slate-200 text-slate-600'
                            : 'bg-slate-100 text-slate-400'
                        }`}>
                          {setting?.isEnabled ? 'On' : setting ? 'Off' : 'Default'}
                        </span>
                      </td>
                      <td className="py-3 pr-4 text-slate-700">{setting?.provider || '—'}</td>
                      <td className="py-3 pr-4 text-slate-700">{setting?.model || '—'}</td>
                      <td className="py-3 pr-4 text-slate-700">{setting?.temperature ?? '—'}</td>
                      <td className="py-3 pr-4 text-slate-700">{setting?.maxOutputTokens ?? '—'}</td>
                      <td className="py-3">
                        <button
                          type="button"
                          onClick={() => runUseCaseTest(option.value)}
                          disabled={testingUseCase === option.value}
                          className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 disabled:opacity-50"
                        >
                          {testingUseCase === option.value ? '...' : 'Test'}
                        </button>
                        {testResults[`useCase:${option.value}`] ? (
                          <span className={`ml-2 text-xs ${testResults[`useCase:${option.value}`] === 'OK' ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {testResults[`useCase:${option.value}`]}
                          </span>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tests' && (
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-slate-900">Provider tests</h3>
          <p className="mt-1 text-sm text-slate-600">Test each provider using an active saved key.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PROVIDER_OPTIONS.map((option) => {
              const hasActiveKey = aiProviderKeys.some((k) => k.provider === option.value && k.isActive);
              return (
                <div key={option.value} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{option.hint}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => runProviderTest(option.value)}
                      disabled={!hasActiveKey}
                      className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Test
                    </button>
                  </div>
                  {testResults[`provider:${option.value}`] ? (
                    <p className={`mt-2 text-xs ${testResults[`provider:${option.value}`] === 'Testing...' ? 'text-slate-500' : testResults[`provider:${option.value}`] === 'No active key found' ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {testResults[`provider:${option.value}`]}
                    </p>
                  ) : !hasActiveKey ? (
                    <p className="mt-2 text-xs text-slate-400">No active key saved</p>
                  ) : null}
                </div>
              );
            })}
          </div>

          <h3 className="mt-8 text-lg font-semibold text-slate-900">Use case tests</h3>
          <p className="mt-1 text-sm text-slate-600">Test each use case routing end-to-end.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {USE_CASE_OPTIONS.slice(0, 5).map((option) => (
              <div key={option.value} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{option.label}</p>
                    <p className="mt-0.5 text-xs text-slate-500">{option.hint}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => runUseCaseTest(option.value)}
                    disabled={testingUseCase === option.value}
                    className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 hover:bg-white disabled:opacity-40"
                  >
                    {testingUseCase === option.value ? '...' : 'Test'}
                  </button>
                </div>
                {testResults[`useCase:${option.value}`] ? (
                  <p className={`mt-2 text-xs ${testResults[`useCase:${option.value}`] === 'OK' ? 'text-emerald-600' : testResults[`useCase:${option.value}`] === 'Testing...' ? 'text-slate-500' : 'text-rose-600'}`}>
                    {testResults[`useCase:${option.value}`]}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className={cardClass}>
          <h3 className="text-lg font-semibold text-slate-900">Security notes</h3>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              API keys are encrypted server-side using AES-256-GCM and never shown again. Only the last 4 characters are stored for identification.
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
              Usage costs are billed by your AI provider. This system does not track or limit usage.
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Public deployment warning</p>
              <p className="mt-1">
                This version stores AI provider keys at workspace level. Before public multi-user launch, add user-level ownership and row isolation. Currently all authenticated users share the same AI provider keys.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <p className="font-semibold">Encryption status</p>
              <p className="mt-1">
                {healthData?.encryptionConfigured
                  ? 'AI_KEYS_ENCRYPTION_SECRET is configured. Keys are encrypted at rest.'
                  : 'AI_KEYS_ENCRYPTION_SECRET is not configured. Key encryption is NOT active.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIControlPanel;