import React, { useEffect, useMemo, useState } from 'react';
import type {
  AIProvider,
  AIProviderKey,
  AIProviderKeyInput,
  AIUseCase,
  AIUseCaseSetting,
  AIUseCaseSettingInput,
} from '../../types/opportunities';

type AIControlQuickAction = 'add-provider-key' | 'test-provider' | 'save-routing';

type ControlTab = 'overview' | 'keys' | 'routing' | 'tests' | 'security';

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

const USE_CASE_OPTIONS: Array<{ value: AIUseCase; label: string; hint: string }> = [
  { value: 'message', label: 'Message', hint: 'Outreach and reply drafting' },
  { value: 'finance', label: 'Finance', hint: 'Budgeting, allocation, and forecasting' },
  { value: 'document', label: 'Document', hint: 'Drafting, rewrites, and reviews' },
  { value: 'lead_scoring', label: 'Lead Scoring', hint: 'Rank people and companies' },
  { value: 'relationship', label: 'Relationship', hint: 'Respectful follow-ups and relationship analysis' },
  { value: 'research', label: 'Research', hint: 'Briefs, summaries, and analysis' },
  { value: 'cleanup', label: 'Cleanup', hint: 'Normalization and content cleanup' },
  { value: 'strategy', label: 'Strategy', hint: 'Plans, goals, and decision support' },
  { value: 'notes', label: 'Notes', hint: 'Organize, summarize, and improve notes' },
  { value: 'social_media', label: 'Social Media', hint: 'Content ideas, hooks, rewrites, and planning' },
];

const TABS: Array<{ id: ControlTab; label: string }> = [
  { id: 'overview', label: 'Overview' },
  { id: 'keys', label: 'Provider Keys' },
  { id: 'routing', label: 'Use Case Routing' },
  { id: 'tests', label: 'Provider Tests' },
  { id: 'security', label: 'Security Notes' },
];

const getDefaultModelForProvider = (provider: string): string => DEFAULT_MODELS[provider] || 'default';

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

const panelClass = 'rounded-2xl border border-neutral-200 bg-white';
const sectionClass = 'rounded-2xl border border-neutral-200 bg-white p-5';
const inputClass = 'h-10 w-full rounded-xl border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400';
const textAreaClass = 'min-h-[96px] w-full rounded-xl border border-neutral-200 bg-white px-3 py-2.5 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400';

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '—';
  return date.toLocaleDateString();
};

const statusBadgeClass = (value: string) => {
  if (value === 'configured' || value === 'byok') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (value === 'env_fallback') return 'border-neutral-300 bg-neutral-100 text-neutral-700';
  if (value === 'disabled') return 'border-neutral-200 bg-neutral-100 text-neutral-500';
  return 'border-amber-200 bg-amber-50 text-amber-700';
};

const providerLabel = (provider?: string) => PROVIDER_OPTIONS.find((item) => item.value === provider)?.label || provider || '—';

const toEndpointHost = (raw?: string) => {
  if (!raw) return '—';
  try {
    return new URL(raw).host || raw;
  } catch {
    return raw;
  }
};

const getUseCaseStatus = (healthData: any, useCase: AIUseCase) => {
  const status = healthData?.useCaseStatuses?.[useCase];
  if (!status) return { label: 'Missing provider', source: 'missing' };
  if (!status.configured) {
    if (status.source === 'disabled') return { label: 'Disabled', source: 'disabled' };
    return { label: 'Missing provider', source: 'missing' };
  }
  if (status.source === 'env_fallback') return { label: 'Env fallback', source: 'env_fallback' };
  if (status.source === 'byok') return { label: 'Configured', source: 'configured' };
  return { label: 'Configured', source: 'configured' };
};

const AIControlPanel: React.FC<{
  aiProviderKeys: AIProviderKey[];
  aiUseCaseSettings: AIUseCaseSetting[];
  quickAction?: AIControlQuickAction | null;
  onQuickActionHandled?: () => void;
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
  quickAction,
  onQuickActionHandled,
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
  const [activeTab, setActiveTab] = useState<ControlTab>('overview');
  const [testResults, setTestResults] = useState<Record<string, string>>({});
  const [testingUseCase, setTestingUseCase] = useState<string | null>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [selectedTestProviderKeyId, setSelectedTestProviderKeyId] = useState('');
  const [selectedTestModel, setSelectedTestModel] = useState('');

  useEffect(() => {
    fetch('/api/ai?action=health&type=control', { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        if (d.success) setHealthData(d);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!quickAction) return;

    if (quickAction === 'add-provider-key') {
      setActiveTab('keys');
      setProviderEditingId(null);
      setProviderForm(defaultProviderForm());
    }

    if (quickAction === 'test-provider') {
      setActiveTab('tests');
    }

    if (quickAction === 'save-routing') {
      setActiveTab('routing');
      setStatusMessage('Routing section ready. Review model and Save Rule.');
    }

    onQuickActionHandled?.();
  }, [quickAction, onQuickActionHandled]);

  useEffect(() => {
    if (!selectedTestProviderKeyId) {
      const firstActive = aiProviderKeys.find((item) => item.isActive);
      if (firstActive) {
        setSelectedTestProviderKeyId(firstActive.id);
        setSelectedTestModel(firstActive.deploymentName || getDefaultModelForProvider(firstActive.provider));
      }
    }
  }, [aiProviderKeys, selectedTestProviderKeyId]);

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

  const runSelectedProviderTest = async () => {
    const key = aiProviderKeys.find((item) => item.id === selectedTestProviderKeyId);
    if (!key) {
      setTestResults((prev) => ({ ...prev, selectedProvider: 'Select a provider key first.' }));
      return;
    }

    setTestResults((prev) => ({ ...prev, selectedProvider: 'Testing...' }));

    try {
      const message = await onTestAIProviderKey({
        id: key.id,
        provider: key.provider,
        model: selectedTestModel.trim() || key.deploymentName,
        baseUrl: key.baseUrl,
        endpoint: key.endpoint,
        deploymentName: key.deploymentName,
        apiVersion: key.apiVersion,
      });
      setTestResults((prev) => ({ ...prev, selectedProvider: message || 'OK' }));
    } catch (error) {
      setTestResults((prev) => ({ ...prev, selectedProvider: error instanceof Error ? error.message : 'Failed' }));
    }
  };

  const saveUseCaseRow = async (useCase: AIUseCase, setting?: AIUseCaseSetting) => {
    const provider = setting?.provider || 'gemini';
    const payload: AIUseCaseSettingInput = {
      useCase,
      providerKeyId: setting?.providerKeyId || undefined,
      provider,
      model: (setting?.model || '').trim() || getDefaultModelForProvider(provider),
      temperature: setting?.temperature ?? 0.2,
      maxOutputTokens: setting?.maxOutputTokens ?? 900,
      isEnabled: setting?.isEnabled ?? true,
      notes: setting?.notes || undefined,
    };

    if (setting?.id) {
      await onUpdateAIUseCaseSetting(setting.id, payload);
      setStatusMessage(`${useCase} rule saved.`);
    } else {
      await onAddAIUseCaseSetting(payload);
      setStatusMessage(`${useCase} rule created.`);
    }
  };

  const toggleUseCaseEnabled = async (useCase: AIUseCase, setting: AIUseCaseSetting | undefined, enabled: boolean) => {
    const provider = setting?.provider || 'gemini';
    const payload: AIUseCaseSettingInput = {
      useCase,
      providerKeyId: setting?.providerKeyId || undefined,
      provider,
      model: (setting?.model || '').trim() || getDefaultModelForProvider(provider),
      temperature: setting?.temperature ?? 0.2,
      maxOutputTokens: setting?.maxOutputTokens ?? 900,
      isEnabled: enabled,
      notes: setting?.notes || undefined,
    };

    if (setting?.id) {
      await onUpdateAIUseCaseSetting(setting.id, payload);
    } else {
      await onAddAIUseCaseSetting(payload);
    }

    setStatusMessage(`${useCase} is now ${enabled ? 'enabled' : 'disabled'}.`);
  };

  const activeProviderCount = useMemo(() => aiProviderKeys.filter((item) => item.isActive).length, [aiProviderKeys]);
  const enabledUseCasesCount = useMemo(() => aiUseCaseSettings.filter((item) => item.isEnabled).length, [aiUseCaseSettings]);
  const supportedProviders = useMemo(() => (Array.isArray(healthData?.supportedProviders) ? healthData.supportedProviders : []), [healthData]);
  const supportedUseCases = useMemo(() => (Array.isArray(healthData?.supportedUseCases) ? healthData.supportedUseCases : []), [healthData]);

  const relationshipStatus = getUseCaseStatus(healthData, 'relationship');
  const notesStatus = getUseCaseStatus(healthData, 'notes');
  const socialStatus = getUseCaseStatus(healthData, 'social_media');
  const documentStatus = getUseCaseStatus(healthData, 'document');

  const selectedTestKey = aiProviderKeys.find((item) => item.id === selectedTestProviderKeyId);

  return (
    <div className="space-y-6 min-w-0">
      <div className="border-b border-neutral-200 overflow-x-auto">
        <div className="flex min-w-max gap-1">
          {TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={
                  'relative px-3 py-2.5 text-sm border-b-2 transition-colors whitespace-nowrap ' +
                  (isActive
                    ? 'border-neutral-900 text-neutral-900'
                    : 'border-transparent text-neutral-500 hover:text-neutral-900')
                }
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {statusMessage ? (
        <div className="rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">{statusMessage}</div>
      ) : null}

      {activeTab === 'overview' ? (
        <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr] min-w-0">
          <div className="space-y-6 min-w-0">
            <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 min-w-0">
              <div className={sectionClass}>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Active Provider Keys</p>
                <p className="mt-2 text-2xl font-semibold text-neutral-900">{activeProviderCount}</p>
                <p className="mt-1 text-xs text-neutral-500">{aiProviderKeys.length} total saved keys</p>
              </div>
              <div className={sectionClass}>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Enabled Use Cases</p>
                <p className="mt-2 text-2xl font-semibold text-neutral-900">{enabledUseCasesCount}</p>
                <p className="mt-1 text-xs text-neutral-500">{aiUseCaseSettings.length} total use cases</p>
              </div>
              <div className={sectionClass}>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Encryption Configured</p>
                <p className="mt-2 text-base font-semibold text-neutral-900">{healthData?.encryptionConfigured ? 'Configured' : 'Missing Secret'}</p>
                <p className="mt-1 text-xs text-neutral-500">No decrypted key is exposed in the UI</p>
              </div>
              <div className={sectionClass}>
                <p className="text-xs uppercase tracking-[0.18em] text-neutral-500">Gemini Env Fallback</p>
                <p className="mt-2 text-base font-semibold text-neutral-900">{healthData?.envGeminiConfigured ? 'Available' : 'Not configured'}</p>
                <p className="mt-1 text-xs text-neutral-500">Shown as fallback status only</p>
              </div>
            </section>

            <section className={panelClass + ' overflow-hidden'}>
              <div className="border-b border-neutral-200 px-5 py-4">
                <h3 className="text-sm font-semibold text-neutral-900">AI Health Status</h3>
                <p className="mt-1 text-xs text-neutral-500">Use-case routing state from the health endpoint.</p>
              </div>
              <div className="grid gap-3 p-5 sm:grid-cols-2">
                {[{ label: 'Relationship AI Status', status: relationshipStatus }, { label: 'Notes AI Status', status: notesStatus }, { label: 'Social Media AI Status', status: socialStatus }, { label: 'Document AI Status', status: documentStatus }].map((item) => (
                  <div key={item.label} className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                    <p className="text-xs text-neutral-500">{item.label}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ' + statusBadgeClass(item.status.source)}>
                        {item.status.label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <section className={panelClass + ' overflow-hidden'}>
              <div className="border-b border-neutral-200 px-5 py-4">
                <h3 className="text-sm font-semibold text-neutral-900">Coverage Summary</h3>
                <p className="mt-1 text-xs text-neutral-500">Providers and use cases reported by health data.</p>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-2">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Supported Providers</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {supportedProviders.length > 0 ? supportedProviders.map((provider: string) => (
                      <span key={provider} className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-700">{providerLabel(provider)}</span>
                    )) : <span className="text-xs text-neutral-500">No provider metadata reported.</span>}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.15em] text-neutral-500">Supported Use Cases</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {supportedUseCases.length > 0 ? supportedUseCases.map((useCase: string) => (
                      <span key={useCase} className="inline-flex items-center rounded-full border border-neutral-200 bg-white px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.12em] text-neutral-700">{useCase.replace('_', ' ')}</span>
                    )) : <span className="text-xs text-neutral-500">No use-case metadata reported.</span>}
                  </div>
                </div>
              </div>
            </section>
          </div>

          <aside className="space-y-4 min-w-0">
            <section className={sectionClass}>
              <h3 className="text-sm font-semibold text-neutral-900">Security Reminders</h3>
              <ul className="mt-3 space-y-2 text-xs text-neutral-600">
                <li>Only last 4 characters are shown in this dashboard.</li>
                <li>Encrypted keys are never returned to browser views.</li>
                <li>Use BYOK keys for configurable routing per workspace.</li>
              </ul>
            </section>
            <section className={sectionClass}>
              <h3 className="text-sm font-semibold text-neutral-900">Encryption Status</h3>
              <p className="mt-2 text-xs text-neutral-600">{healthData?.encryptionConfigured ? 'Encryption secret is configured for key storage.' : 'Encryption secret is missing. Configure before production use.'}</p>
            </section>
            <section className={sectionClass}>
              <h3 className="text-sm font-semibold text-neutral-900">Public Launch Warning</h3>
              <p className="mt-2 text-xs text-neutral-600">Workspace-level keys are not sufficient for multi-user public launch. Add ownership and row isolation before release.</p>
            </section>
          </aside>
        </div>
      ) : null}

      {activeTab === 'keys' ? (
        <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr] min-w-0">
          <section className={panelClass + ' overflow-hidden'}>
            <div className="border-b border-neutral-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-neutral-900">Provider Keys</h3>
              <p className="mt-1 text-xs text-neutral-500">Secure credential manager for BYOK providers. Only last4 is visible.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[980px] w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    <th className="px-5 py-3">Label</th>
                    <th className="px-3 py-3">Provider</th>
                    <th className="px-3 py-3">Last 4</th>
                    <th className="px-3 py-3">Active</th>
                    <th className="px-3 py-3">Base URL / Endpoint</th>
                    <th className="px-3 py-3">Notes</th>
                    <th className="px-3 py-3">Updated</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {aiProviderKeys.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-5 py-10">
                        <div className="mx-auto max-w-md rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-5 py-6 text-center">
                          <p className="text-sm font-medium text-neutral-900">No provider keys yet.</p>
                          <p className="mt-1 text-xs text-neutral-500">Add a provider key to use BYOK routing.</p>
                          <button
                            type="button"
                            onClick={() => {
                              setProviderEditingId(null);
                              setProviderForm(defaultProviderForm());
                            }}
                            className="mt-4 inline-flex items-center rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white"
                          >
                            Add Provider Key
                          </button>
                        </div>
                      </td>
                    </tr>
                  ) : aiProviderKeys.map((key) => (
                    <tr key={key.id} className="border-b border-neutral-100 align-top">
                      <td className="px-5 py-3 font-medium text-neutral-900">{key.label}</td>
                      <td className="px-3 py-3 text-neutral-700">
                        <span className="inline-flex items-center rounded-full border border-neutral-200 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-neutral-700">{providerLabel(key.provider)}</span>
                      </td>
                      <td className="px-3 py-3 text-neutral-700">{key.apiKeyLast4 ? `••••${key.apiKeyLast4}` : '••••'}</td>
                      <td className="px-3 py-3">
                        <span className={'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ' + (key.isActive ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-neutral-200 bg-neutral-100 text-neutral-500')}>
                          {key.isActive ? 'Enabled' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-neutral-600 max-w-[250px] break-words">{key.baseUrl || key.endpoint || '—'}</td>
                      <td className="px-3 py-3 text-neutral-600 max-w-[180px] break-words">{key.notes || '—'}</td>
                      <td className="px-3 py-3 text-neutral-600">{formatDate(key.updatedAt || key.createdAt)}</td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
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
                            className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700"
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
                            className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700"
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
                            className="rounded-lg border border-red-200 px-2.5 py-1.5 text-xs font-medium text-red-700"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className={sectionClass}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-neutral-900">{providerEditingId ? 'Edit Provider Key' : 'Add Provider Key'}</h3>
              {providerEditingId ? (
                <button
                  type="button"
                  onClick={() => {
                    setProviderEditingId(null);
                    setProviderForm(defaultProviderForm());
                  }}
                  className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700"
                >
                  Cancel Edit
                </button>
              ) : null}
            </div>
            <p className="mt-2 text-xs text-neutral-500">API keys are encrypted server-side and never shown again.</p>

            <div className="mt-4 grid gap-3">
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-neutral-700">Label</span>
                <input value={providerForm.label} onChange={(event) => setProviderForm((current) => ({ ...current, label: event.target.value }))} className={inputClass} placeholder="Primary OpenAI workspace key" />
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-neutral-700">Provider</span>
                <select value={providerForm.provider} onChange={(event) => setProviderForm((current) => ({ ...current, provider: event.target.value as AIProvider }))} className={inputClass}>
                  {PROVIDER_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-neutral-700">API Key</span>
                <input
                  value={providerForm.apiKey || ''}
                  onChange={(event) => setProviderForm((current) => ({ ...current, apiKey: event.target.value }))}
                  className={inputClass}
                  placeholder="Paste a new key to replace the existing one."
                  type="password"
                />
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-neutral-700">Model / Deployment Name</span>
                <input value={providerForm.deploymentName || ''} onChange={(event) => setProviderForm((current) => ({ ...current, deploymentName: event.target.value }))} className={inputClass} placeholder="Model or deployment name" />
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="text-xs font-medium text-neutral-700">Base URL</span>
                  <input value={providerForm.baseUrl || ''} onChange={(event) => setProviderForm((current) => ({ ...current, baseUrl: event.target.value }))} className={inputClass} placeholder="Optional API base URL" />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-xs font-medium text-neutral-700">Endpoint</span>
                  <input value={providerForm.endpoint || ''} onChange={(event) => setProviderForm((current) => ({ ...current, endpoint: event.target.value }))} className={inputClass} placeholder="Optional direct endpoint" />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="text-xs font-medium text-neutral-700">API Version</span>
                  <input value={providerForm.apiVersion || ''} onChange={(event) => setProviderForm((current) => ({ ...current, apiVersion: event.target.value }))} className={inputClass} placeholder="Required for some Azure deployments" />
                </label>
                <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-700">
                  <input type="checkbox" checked={providerForm.isActive !== false} onChange={(event) => setProviderForm((current) => ({ ...current, isActive: event.target.checked }))} />
                  Active provider key
                </label>
              </div>

              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-neutral-700">Notes</span>
                <textarea value={providerForm.notes || ''} onChange={(event) => setProviderForm((current) => ({ ...current, notes: event.target.value }))} className={textAreaClass} placeholder="Optional notes" />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await submitProviderForm();
                  } catch (error) {
                    setStatusMessage(error instanceof Error ? error.message : 'Failed to save provider key.');
                  }
                }}
                className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white"
              >
                {providerEditingId ? 'Update Key' : 'Save Key'}
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
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-medium text-neutral-700"
              >
                Test Provider
              </button>
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === 'routing' ? (
        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr] min-w-0">
          <section className={panelClass + ' overflow-hidden'}>
            <div className="border-b border-neutral-200 px-5 py-4">
              <h3 className="text-sm font-semibold text-neutral-900">Use Case Routing</h3>
              <p className="mt-1 text-xs text-neutral-500">Model, provider, and token settings by use case.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-[1120px] w-full text-sm">
                <thead>
                  <tr className="border-b border-neutral-200 text-left text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                    <th className="px-5 py-3">Use Case</th>
                    <th className="px-3 py-3">Enabled</th>
                    <th className="px-3 py-3">Provider Key</th>
                    <th className="px-3 py-3">Provider</th>
                    <th className="px-3 py-3">Model</th>
                    <th className="px-3 py-3">Temperature</th>
                    <th className="px-3 py-3">Max Output Tokens</th>
                    <th className="px-3 py-3">Status</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {USE_CASE_OPTIONS.map((item) => {
                    const setting = aiUseCaseSettings.find((entry) => entry.useCase === item.value);
                    const useCaseStatus = getUseCaseStatus(healthData, item.value);
                    const provider = setting?.provider || 'gemini';
                    const model = (setting?.model || '').trim() || getDefaultModelForProvider(provider);
                    return (
                      <tr key={item.value} className="border-b border-neutral-100 align-top">
                        <td className="px-5 py-3">
                          <p className="font-medium text-neutral-900">{item.label}</p>
                          <p className="mt-0.5 text-xs text-neutral-500">{item.hint}</p>
                        </td>
                        <td className="px-3 py-3">
                          <label className="inline-flex items-center gap-2 text-xs text-neutral-700">
                            <input
                              type="checkbox"
                              checked={setting?.isEnabled ?? false}
                              onChange={async (event) => {
                                try {
                                  await toggleUseCaseEnabled(item.value, setting, event.target.checked);
                                } catch (error) {
                                  setStatusMessage(error instanceof Error ? error.message : 'Failed to update use case state.');
                                }
                              }}
                            />
                            {setting?.isEnabled ? 'Enabled' : 'Disabled'}
                          </label>
                        </td>
                        <td className="px-3 py-3 text-neutral-700">{setting?.providerKeyLabel || '—'}</td>
                        <td className="px-3 py-3 text-neutral-700">{providerLabel(provider)}</td>
                        <td className="px-3 py-3 text-neutral-700">{model}</td>
                        <td className="px-3 py-3 text-neutral-700">{setting?.temperature ?? 0.2}</td>
                        <td className="px-3 py-3 text-neutral-700">{setting?.maxOutputTokens ?? 900}</td>
                        <td className="px-3 py-3">
                          <span className={'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ' + statusBadgeClass(useCaseStatus.source)}>
                            {useCaseStatus.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={async () => {
                                try {
                                  await saveUseCaseRow(item.value, setting);
                                } catch (error) {
                                  setStatusMessage(error instanceof Error ? error.message : 'Failed to save routing rule.');
                                }
                              }}
                              className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700"
                            >
                              Save Rule
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setUseCaseEditingId(setting?.id || null);
                                setUseCaseForm({
                                  useCase: item.value,
                                  providerKeyId: setting?.providerKeyId || '',
                                  provider,
                                  model,
                                  temperature: setting?.temperature ?? 0.2,
                                  maxOutputTokens: setting?.maxOutputTokens ?? 900,
                                  isEnabled: setting?.isEnabled ?? true,
                                  notes: setting?.notes || '',
                                });
                              }}
                              className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700"
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              onClick={() => runUseCaseTest(item.value)}
                              disabled={testingUseCase === item.value}
                              className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 disabled:opacity-50"
                            >
                              {testingUseCase === item.value ? '...' : 'Test'}
                            </button>
                          </div>
                          {testResults[`useCase:${item.value}`] ? (
                            <p className={'mt-1 text-right text-xs ' + (testResults[`useCase:${item.value}`] === 'OK' ? 'text-emerald-700' : testResults[`useCase:${item.value}`] === 'Testing...' ? 'text-neutral-500' : 'text-red-700')}>
                              {testResults[`useCase:${item.value}`]}
                            </p>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          <section className={sectionClass}>
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-neutral-900">{useCaseEditingId ? 'Edit Use Case Rule' : 'New Use Case Rule'}</h3>
              <button
                type="button"
                onClick={() => {
                  setUseCaseEditingId(null);
                  setUseCaseForm(defaultUseCaseForm());
                }}
                className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700"
              >
                Reset
              </button>
            </div>

            <div className="mt-4 grid gap-3">
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-neutral-700">Use Case</span>
                <select
                  value={useCaseForm.useCase}
                  onChange={(event) => setUseCaseForm((current) => ({ ...current, useCase: event.target.value as AIUseCase }))}
                  className={inputClass}
                >
                  {USE_CASE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-neutral-700">Provider Key</span>
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
                  className={inputClass}
                >
                  <option value="">Use provider defaults</option>
                  {aiProviderKeys.map((key) => (
                    <option key={key.id} value={key.id}>{key.label} ({providerLabel(key.provider)})</option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="text-xs font-medium text-neutral-700">Provider</span>
                  <select
                    value={useCaseForm.provider || 'gemini'}
                    onChange={(event) => {
                      const nextProvider = event.target.value as AIProvider;
                      setUseCaseForm((current) => {
                        const nextModel = current.model?.trim() || getDefaultModelForProvider(nextProvider);
                        return { ...current, provider: nextProvider, model: nextModel };
                      });
                    }}
                    className={inputClass}
                  >
                    {PROVIDER_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-xs font-medium text-neutral-700">Model</span>
                  <input
                    value={useCaseForm.model || ''}
                    onChange={(event) => setUseCaseForm((current) => ({ ...current, model: event.target.value }))}
                    className={inputClass}
                    placeholder={`Model (e.g. ${getDefaultModelForProvider(useCaseForm.provider || 'gemini')})`}
                  />
                </label>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-sm">
                  <span className="text-xs font-medium text-neutral-700">Temperature</span>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="2"
                    value={useCaseForm.temperature ?? ''}
                    onChange={(event) => setUseCaseForm((current) => ({ ...current, temperature: event.target.value === '' ? undefined : Number(event.target.value) }))}
                    className={inputClass}
                  />
                </label>
                <label className="space-y-1.5 text-sm">
                  <span className="text-xs font-medium text-neutral-700">Max Output Tokens</span>
                  <input
                    type="number"
                    min="64"
                    max="8192"
                    value={useCaseForm.maxOutputTokens ?? ''}
                    onChange={(event) => setUseCaseForm((current) => ({ ...current, maxOutputTokens: event.target.value === '' ? undefined : Number(event.target.value) }))}
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="flex items-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2.5 text-xs text-neutral-700">
                <input
                  type="checkbox"
                  checked={useCaseForm.isEnabled !== false}
                  onChange={(event) => setUseCaseForm((current) => ({ ...current, isEnabled: event.target.checked }))}
                />
                Enabled
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-neutral-700">Notes</span>
                <textarea value={useCaseForm.notes || ''} onChange={(event) => setUseCaseForm((current) => ({ ...current, notes: event.target.value }))} className={textAreaClass} placeholder="Optional routing details" />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={async () => {
                  try {
                    await submitUseCaseForm();
                  } catch (error) {
                    setStatusMessage(error instanceof Error ? error.message : 'Failed to save routing rule.');
                  }
                }}
                className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white"
              >
                {useCaseEditingId ? 'Update Rule' : 'Save Rule'}
              </button>
              {useCaseEditingId ? (
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      await onDeleteAIUseCaseSetting(useCaseEditingId);
                      setUseCaseEditingId(null);
                      setUseCaseForm(defaultUseCaseForm());
                      setStatusMessage('Routing rule removed.');
                    } catch (error) {
                      setStatusMessage(error instanceof Error ? error.message : 'Failed to delete routing rule.');
                    }
                  }}
                  className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700"
                >
                  Delete Rule
                </button>
              ) : null}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === 'tests' ? (
        <div className="grid gap-6 xl:grid-cols-[1fr_1fr] min-w-0">
          <section className={sectionClass}>
            <h3 className="text-sm font-semibold text-neutral-900">Provider Tests</h3>
            <p className="mt-1 text-xs text-neutral-500">Select a provider key and run a diagnostic test.</p>

            <div className="mt-4 grid gap-3">
              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-neutral-700">Provider Key</span>
                <select
                  value={selectedTestProviderKeyId}
                  onChange={(event) => {
                    const keyId = event.target.value;
                    const selected = aiProviderKeys.find((item) => item.id === keyId);
                    setSelectedTestProviderKeyId(keyId);
                    if (selected) {
                      setSelectedTestModel(selected.deploymentName || getDefaultModelForProvider(selected.provider));
                    }
                  }}
                  className={inputClass}
                >
                  <option value="">Select provider key</option>
                  {aiProviderKeys.map((key) => (
                    <option key={key.id} value={key.id}>{key.label} ({providerLabel(key.provider)})</option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-sm">
                <span className="text-xs font-medium text-neutral-700">Model</span>
                <input
                  value={selectedTestModel}
                  onChange={(event) => setSelectedTestModel(event.target.value)}
                  className={inputClass}
                  placeholder="Model for provider test"
                />
              </label>

              <button type="button" onClick={runSelectedProviderTest} className="inline-flex w-fit rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white">
                Test Provider
              </button>
            </div>

            <div className="mt-4 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
              <div className="flex items-center gap-2">
                <span className={'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ' + (testResults.selectedProvider === 'OK' ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : testResults.selectedProvider === 'Testing...' ? 'border-neutral-200 bg-white text-neutral-600' : testResults.selectedProvider ? 'border-red-200 bg-red-50 text-red-700' : 'border-neutral-200 bg-white text-neutral-600')}>
                  {testResults.selectedProvider === 'OK' ? 'Success' : testResults.selectedProvider ? 'Result' : 'Idle'}
                </span>
              </div>
              <div className="mt-3 space-y-1 text-xs text-neutral-700">
                <p>Provider: {providerLabel(selectedTestKey?.provider)}</p>
                <p>Model: {selectedTestModel || selectedTestKey?.deploymentName || '—'}</p>
                <p>Endpoint Host: {toEndpointHost(selectedTestKey?.endpoint || selectedTestKey?.baseUrl)}</p>
                <p className="break-words">Message: {testResults.selectedProvider || 'Select a provider key and run a test.'}</p>
              </div>
            </div>
          </section>

          <section className={sectionClass}>
            <h3 className="text-sm font-semibold text-neutral-900">Use Case Tests</h3>
            <p className="mt-1 text-xs text-neutral-500">Run routing tests per use case.</p>

            <div className="mt-4 space-y-2">
              {USE_CASE_OPTIONS.map((item) => (
                <div key={item.value} className="rounded-xl border border-neutral-200 bg-neutral-50 p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium text-neutral-900">{item.label}</p>
                      <p className="text-xs text-neutral-500">{item.hint}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => runUseCaseTest(item.value)}
                      disabled={testingUseCase === item.value}
                      className="rounded-lg border border-neutral-300 px-2.5 py-1.5 text-xs font-medium text-neutral-700 disabled:opacity-50"
                    >
                      {testingUseCase === item.value ? '...' : 'Test Use Case'}
                    </button>
                  </div>
                  {testResults[`useCase:${item.value}`] ? (
                    <p className={'mt-2 text-xs break-words ' + (testResults[`useCase:${item.value}`] === 'OK' ? 'text-emerald-700' : testResults[`useCase:${item.value}`] === 'Testing...' ? 'text-neutral-500' : 'text-red-700')}>
                      {testResults[`useCase:${item.value}`]}
                    </p>
                  ) : null}
                </div>
              ))}
            </div>
          </section>
        </div>
      ) : null}

      {activeTab === 'security' ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <section className={sectionClass}>
            <h3 className="text-sm font-semibold text-neutral-900">API Key Storage</h3>
            <ul className="mt-3 space-y-2 text-xs text-neutral-600">
              <li>API keys are encrypted server-side.</li>
              <li>Keys are never returned to the browser.</li>
              <li>Only last 4 characters are shown.</li>
            </ul>
          </section>

          <section className={sectionClass}>
            <h3 className="text-sm font-semibold text-neutral-900">BYOK</h3>
            <p className="mt-3 text-xs text-neutral-600">Provider costs are billed by your provider. This workspace uses user-provided keys where configured.</p>
          </section>

          <section className={sectionClass}>
            <h3 className="text-sm font-semibold text-neutral-900">Public Launch Warning</h3>
            <p className="mt-3 text-xs text-neutral-600">Workspace-level keys are not enough for public multi-user launch. Add user/workspace ownership and RLS before public release.</p>
          </section>

          <section className={sectionClass}>
            <h3 className="text-sm font-semibold text-neutral-900">Env Fallback</h3>
            <p className="mt-3 text-xs text-neutral-600">Gemini env fallback may exist for backward compatibility. Prefer BYOK for configurable routing.</p>
          </section>
        </div>
      ) : null}
    </div>
  );
};

export default AIControlPanel;
