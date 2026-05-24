import React, { useState } from 'react';
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

const USE_CASE_OPTIONS: Array<{ value: AIUseCase; label: string; hint: string }> = [
  { value: 'message', label: 'Message generation', hint: 'Outreach and reply drafting' },
  { value: 'finance', label: 'Finance assistant', hint: 'Budgeting, allocation, and forecasting' },
  { value: 'document', label: 'Document assistant', hint: 'Drafting, rewrites, and reviews' },
  { value: 'lead_scoring', label: 'Lead scoring', hint: 'Rank people and companies' },
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
    const payload: AIUseCaseSettingInput = {
      ...useCaseForm,
      useCase: useCaseForm.useCase,
      providerKeyId: useCaseForm.providerKeyId?.trim() || undefined,
      provider: useCaseForm.provider || undefined,
      model: useCaseForm.model?.trim() || undefined,
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

  return (
    <div className="space-y-6">
      <section className={cardClass}>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">AI Control Center</p>
            <h2 className="mt-2 text-2xl font-semibold text-slate-900">Workspace AI providers and routing</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
              Provider keys are encrypted server-side and are never returned to the browser. Routing rules are stored at the workspace level, so treat them as shared configuration until ownership-level controls are added.
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

      <section className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
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
                onChange={(event) => setUseCaseForm((current) => ({ ...current, providerKeyId: event.target.value }))}
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
                  onChange={(event) => setUseCaseForm((current) => ({ ...current, provider: event.target.value as AIProvider }))}
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
                  placeholder="Optional model override"
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
      </section>
    </div>
  );
};

export default AIControlPanel;
