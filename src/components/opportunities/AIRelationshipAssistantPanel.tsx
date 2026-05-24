import React, { useMemo, useState } from 'react';
import type {
  Relationship,
  RelationshipContactMethod,
  RelationshipInteraction,
  RelationshipInteractionChannel,
  RelationshipInteractionInput,
  RelationshipInteractionType,
  RelationshipOpportunity,
  RelationshipInput,
  Person,
} from '../../types/opportunities';

type RelationshipAssistantMode = 'review' | 'follow_up' | 'repair';

type RelationshipAssistantResult = {
  summary: string;
  observations: string[];
  strengths: string[];
  concerns: string[];
  nextSteps: string[];
  followUpDraft: string;
  suggestedLogEntry: {
    channel: RelationshipInteractionChannel;
    type: RelationshipInteractionType;
    summary: string;
    outcome: string;
    nextAction: string;
  };
  approvalNote: string;
};

const cardClass = 'rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_8px_24px_rgba(15,23,42,0.05)]';

const AIRelationshipAssistantPanel: React.FC<{
  relationship: Relationship;
  categoryName?: string;
  linkedPerson?: Person | null;
  contactMethods: RelationshipContactMethod[];
  interactions: RelationshipInteraction[];
  opportunities: RelationshipOpportunity[];
  onAddRelationshipInteraction: (input: RelationshipInteractionInput) => Promise<any>;
  onUpdateRelationship: (id: string, input: Partial<RelationshipInput>) => Promise<any>;
}> = ({
  relationship,
  categoryName,
  linkedPerson,
  contactMethods,
  interactions,
  opportunities,
  onAddRelationshipInteraction,
  onUpdateRelationship,
}) => {
  const [mode, setMode] = useState<RelationshipAssistantMode>('review');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [result, setResult] = useState<RelationshipAssistantResult | null>(null);

  const recentContactMethods = useMemo(() => contactMethods.slice(0, 5), [contactMethods]);
  const recentInteractions = useMemo(() => interactions.slice(0, 5), [interactions]);
  const recentOpportunities = useMemo(() => opportunities.slice(0, 5), [opportunities]);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch('/api/ai?action=relationship', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'relationship',
          mode,
          relationship,
          categoryName,
          person: linkedPerson || undefined,
          contactMethods: recentContactMethods,
          interactions: recentInteractions,
          opportunities: recentOpportunities,
          instructions: instructions.trim() || undefined,
          debug: import.meta.env.DEV,
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please log in again.');
        } else if (json?.code === 'AI_QUOTA_EXCEEDED' || response.status === 429) {
          setError('AI quota exceeded. Try again later or change the AI model.');
        } else {
          setError(json?.error || 'AI Relationship Assistant could not generate a response.');
        }
        return;
      }

      if (!json?.success || !json?.result) {
        setError(json?.error || 'AI Relationship Assistant could not generate a response.');
        return;
      }

      setResult(json.result as RelationshipAssistantResult);
      setSuccessMessage('AI output generated. Review it before saving anything.');
    } catch {
      setError('AI Relationship Assistant could not generate a response.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyFollowUp = async () => {
    if (!result?.followUpDraft) return;

    try {
      await navigator.clipboard.writeText(result.followUpDraft);
      setSuccessMessage('Follow-up draft copied to clipboard.');
    } catch {
      setError('Unable to copy the follow-up draft.');
    }
  };

  const handleSaveFollowUp = async () => {
    if (!result) return;

    const confirmed = window.confirm('Save this AI follow-up as a new relationship interaction?');
    if (!confirmed) return;

    const today = new Date().toISOString().slice(0, 10);

    try {
      await onAddRelationshipInteraction({
        relationshipId: relationship.id,
        interactionDate: today,
        channel: result.suggestedLogEntry.channel || 'other',
        type: result.suggestedLogEntry.type || 'follow_up',
        summary: result.suggestedLogEntry.summary || result.summary || 'AI suggested follow-up',
        outcome: result.suggestedLogEntry.outcome || '',
        nextAction: result.suggestedLogEntry.nextAction || result.nextSteps[0] || '',
      });
      setSuccessMessage('Follow-up saved as a new interaction.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the follow-up.');
    }
  };

  const handleApplyNextAction = async () => {
    if (!result) return;

    const nextAction = result.suggestedLogEntry.nextAction || result.nextSteps[0] || '';
    if (!nextAction) return;

    const confirmed = window.confirm('Apply the AI suggested next action to this relationship?');
    if (!confirmed) return;

    try {
      await onUpdateRelationship(relationship.id, { nextAction });
      setSuccessMessage('Next action updated on the relationship.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update the next action.');
    }
  };

  const modeButtons: Array<{ value: RelationshipAssistantMode; label: string; hint: string }> = [
    { value: 'review', label: 'Relationship review', hint: 'Balanced analysis and next steps' },
    { value: 'follow_up', label: 'Follow-up draft', hint: 'Low-pressure messaging and timing' },
    { value: 'repair', label: 'Repair focus', hint: 'Careful, de-escalating guidance' },
  ];

  if (!relationship) {
    return null;
  }

  return (
    <div className="space-y-5">
      <section className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#64748b]">AI Assistant</p>
            <h3 className="mt-2 text-2xl font-semibold text-[#0f172a]">Relationship analysis and follow-up drafting</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">
              This assistant reviews the relationship context, highlights what looks strong or uncertain, and drafts a respectful next step. Nothing is saved automatically.
            </p>
          </div>
          <div className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
            User-approved saves only
          </div>
        </div>
      </section>

      <section className={cardClass}>
        <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-4">
            <div>
              <div className="text-sm font-semibold text-[#0f172a]">Analysis mode</div>
              <div className="mt-2 flex flex-wrap gap-2">
                {modeButtons.map((item) => (
                  <button
                    key={item.value}
                    type="button"
                    onClick={() => setMode(item.value)}
                    className={`rounded-full border px-3 py-2 text-left text-xs font-semibold transition ${mode === item.value ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]' : 'border-[#e5e7eb] bg-[#f8fafc] text-[#475569] hover:bg-white'}`}
                  >
                    <span className="block">{item.label}</span>
                    <span className="block font-normal text-[11px] text-[#64748b]">{item.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            <label className="block space-y-2 text-sm">
              <span className="font-medium text-[#334155]">Optional guidance</span>
              <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                className="min-h-[120px] w-full rounded-2xl border border-[#e5e7eb] bg-white px-3 py-2.5 text-sm text-[#0f172a] outline-none transition focus:border-[#93c5fd]"
                placeholder="Example: focus on a respectful follow-up, mention the shared context, and keep the message low-pressure."
              />
            </label>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={runAnalysis}
                disabled={loading}
                className="rounded-full bg-[#2563eb] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:bg-[#93c5fd]"
              >
                {loading ? 'Analyzing...' : 'Analyze relationship'}
              </button>
              <button
                type="button"
                onClick={handleCopyFollowUp}
                disabled={!result?.followUpDraft}
                className="rounded-full border border-[#e5e7eb] px-4 py-2 text-sm font-semibold text-[#334155] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Copy follow-up
              </button>
              <button
                type="button"
                onClick={handleSaveFollowUp}
                disabled={!result}
                className="rounded-full border border-[#e5e7eb] px-4 py-2 text-sm font-semibold text-[#334155] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Save follow-up
              </button>
              <button
                type="button"
                onClick={handleApplyNextAction}
                disabled={!result?.suggestedLogEntry?.nextAction && !result?.nextSteps?.length}
                className="rounded-full border border-[#e5e7eb] px-4 py-2 text-sm font-semibold text-[#334155] transition hover:border-[#cbd5e1] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50"
              >
                Apply next action
              </button>
            </div>

            <div className="rounded-2xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">
              AI assistant output is a draft. Review it before sharing or saving anything.
            </div>

            {error ? <div className="rounded-2xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</div> : null}
            {successMessage ? <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">{successMessage}</div> : null}
          </div>

          <div className="space-y-3 text-sm text-[#334155]">
            <div className="rounded-2xl bg-[#f8fafc] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[#64748b]">Current context</div>
              <div className="mt-2 space-y-1">
                <div><span className="font-medium text-[#0f172a]">Relationship:</span> {relationship.displayName}</div>
                <div><span className="font-medium text-[#0f172a]">Category:</span> {categoryName || relationship.categoryName || relationship.categorySlug || relationship.domain || 'Uncategorized'}</div>
                <div><span className="font-medium text-[#0f172a]">Person:</span> {linkedPerson?.fullName || relationship.personName || 'No linked person'}</div>
                <div><span className="font-medium text-[#0f172a]">Next action:</span> {relationship.nextAction || '—'}</div>
              </div>
            </div>
            <div className="rounded-2xl bg-[#f8fafc] p-4">
              <div className="text-xs uppercase tracking-[0.16em] text-[#64748b]">Data included in the prompt</div>
              <div className="mt-2 space-y-1">
                <div>Contact methods: {recentContactMethods.length}</div>
                <div>Interactions: {recentInteractions.length}</div>
                <div>Opportunities: {recentOpportunities.length}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {result ? (
        <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4">
            <div className={cardClass}>
              <div className="text-xs uppercase tracking-[0.16em] text-[#64748b]">Summary</div>
              <p className="mt-2 text-sm leading-6 text-[#0f172a]">{result.summary || 'No summary returned.'}</p>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className={cardClass}>
                <div className="text-xs uppercase tracking-[0.16em] text-[#64748b]">Strengths</div>
                <div className="mt-3 space-y-2 text-sm text-[#0f172a]">
                  {result.strengths.length > 0 ? result.strengths.map((item, index) => <div key={index} className="rounded-xl bg-[#f8fafc] px-3 py-2">{item}</div>) : <div className="rounded-xl bg-[#f8fafc] px-3 py-2 text-[#64748b]">No strengths returned.</div>}
                </div>
              </div>

              <div className={cardClass}>
                <div className="text-xs uppercase tracking-[0.16em] text-[#64748b]">Concerns</div>
                <div className="mt-3 space-y-2 text-sm text-[#0f172a]">
                  {result.concerns.length > 0 ? result.concerns.map((item, index) => <div key={index} className="rounded-xl bg-[#f8fafc] px-3 py-2">{item}</div>) : <div className="rounded-xl bg-[#f8fafc] px-3 py-2 text-[#64748b]">No concerns returned.</div>}
                </div>
              </div>
            </div>

            <div className={cardClass}>
              <div className="text-xs uppercase tracking-[0.16em] text-[#64748b]">Next steps</div>
              <div className="mt-3 space-y-2 text-sm text-[#0f172a]">
                {result.nextSteps.length > 0 ? result.nextSteps.map((item, index) => <div key={index} className="rounded-xl bg-[#f8fafc] px-3 py-2">{item}</div>) : <div className="rounded-xl bg-[#f8fafc] px-3 py-2 text-[#64748b]">No next steps returned.</div>}
              </div>
            </div>
          </div>

          <aside className="space-y-4">
            <div className={cardClass}>
              <div className="text-xs uppercase tracking-[0.16em] text-[#64748b]">Observations</div>
              <div className="mt-3 space-y-2 text-sm text-[#0f172a]">
                {result.observations.length > 0 ? result.observations.map((item, index) => <div key={index} className="rounded-xl bg-[#f8fafc] px-3 py-2">{item}</div>) : <div className="rounded-xl bg-[#f8fafc] px-3 py-2 text-[#64748b]">No observations returned.</div>}
              </div>
            </div>

            <div className={cardClass}>
              <div className="text-xs uppercase tracking-[0.16em] text-[#64748b]">Follow-up draft</div>
              <div className="mt-3 whitespace-pre-wrap rounded-2xl bg-[#f8fafc] px-3 py-3 text-sm leading-6 text-[#0f172a]">
                {result.followUpDraft || 'No follow-up draft returned.'}
              </div>
            </div>

            <div className={cardClass}>
              <div className="text-xs uppercase tracking-[0.16em] text-[#64748b]">Suggested save</div>
              <div className="mt-3 space-y-2 text-sm text-[#0f172a]">
                <div className="rounded-xl bg-[#f8fafc] px-3 py-2"><span className="font-medium text-[#334155]">Channel:</span> {result.suggestedLogEntry.channel}</div>
                <div className="rounded-xl bg-[#f8fafc] px-3 py-2"><span className="font-medium text-[#334155]">Type:</span> {result.suggestedLogEntry.type}</div>
                <div className="rounded-xl bg-[#f8fafc] px-3 py-2"><span className="font-medium text-[#334155]">Summary:</span> {result.suggestedLogEntry.summary || '—'}</div>
                <div className="rounded-xl bg-[#f8fafc] px-3 py-2"><span className="font-medium text-[#334155]">Next action:</span> {result.suggestedLogEntry.nextAction || '—'}</div>
              </div>
            </div>

            {result.approvalNote ? (
              <div className={cardClass}>
                <div className="text-xs uppercase tracking-[0.16em] text-[#64748b]">Approval note</div>
                <p className="mt-2 text-sm leading-6 text-[#0f172a]">{result.approvalNote}</p>
              </div>
            ) : null}
          </aside>
        </section>
      ) : null}
    </div>
  );
};

export default AIRelationshipAssistantPanel;