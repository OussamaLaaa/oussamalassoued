import React, { useState } from 'react';
import type { Company, Person, OutreachMessage, Deal } from '../../types/opportunities';

type ScoringResult = {
  databaseType: string;
  industry: string;
  priority: string;
  fitScore: number;
  ethicalFit: string;
  uxProblem: string;
  serviceToOffer: string;
  nextAction: string;
  reasoningSummary: string;
  risks: string[];
  questionsToReview: string[];
};

const AICompanyScoringModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  company: Company;
  people: Person[];
  messages: OutreachMessage[];
  deals: Deal[];
  onApply: (result: ScoringResult) => void;
}> = ({ isOpen, onClose, company, people, messages, deals, onApply }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoringResult | null>(null);

  const [databaseType, setDatabaseType] = useState('');
  const [industry, setIndustry] = useState('');
  const [priority, setPriority] = useState('');
  const [fitScore, setFitScore] = useState(5);
  const [ethicalFit, setEthicalFit] = useState('');
  const [uxProblem, setUxProblem] = useState('');
  const [serviceToOffer, setServiceToOffer] = useState('');
  const [nextAction, setNextAction] = useState('');
  const [reasoningSummary, setReasoningSummary] = useState('');
  const [risksText, setRisksText] = useState('');
  const [questionsText, setQuestionsText] = useState('');

  const populateResult = (r: ScoringResult) => {
    setDatabaseType(r.databaseType || 'sme');
    setIndustry(r.industry || '');
    setPriority(r.priority || 'medium');
    setFitScore(typeof r.fitScore === 'number' ? r.fitScore : 5);
    setEthicalFit(r.ethicalFit || 'needs_review');
    setUxProblem(r.uxProblem || '');
    setServiceToOffer(r.serviceToOffer || '');
    setNextAction(r.nextAction || '');
    setReasoningSummary(r.reasoningSummary || '');
    setRisksText(Array.isArray(r.risks) ? r.risks.join('\n') : '');
    setQuestionsText(Array.isArray(r.questionsToReview) ? r.questionsToReview.join('\n') : '');
  };

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const relatedPeople = people.filter((p) => p.companyId === company.id);
      const relatedMessages = messages.filter((m) => m.companyId === company.id);
      const relatedDeals = deals.filter((d) => d.companyId === company.id);

      const response = await fetch('/api/ai?action=lead-scoring', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company,
          people: relatedPeople,
          messages: relatedMessages,
          deals: relatedDeals,
          debug: import.meta.env.DEV,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          setError('Authentication required. Please log in again.');
        } else if (response.status === 429 || data?.code === 'AI_QUOTA_EXCEEDED') {
          setError('AI quota exceeded. Try again later or change AI model.');
        } else {
          setError(data?.error || 'AI could not score this company. Review manually.');
        }
        return;
      }

      if (!data.success || !data.result) {
        if (data?.code === 'AI_QUOTA_EXCEEDED') {
          setError('AI quota exceeded. Try again later or change AI model.');
        } else {
          setError(data?.error || 'AI could not score this company. Review manually.');
        }
        return;
      }

      setResult(data.result);
      populateResult(data.result);
    } catch (fetchError) {
      setError('AI could not score this company. Review manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleApply = () => {
    if (!result) return;
    onApply({
      ...result,
      databaseType,
      industry,
      priority,
      fitScore,
      ethicalFit,
      uxProblem,
      serviceToOffer,
      nextAction,
      reasoningSummary,
      risks: risksText.split('\n').filter(Boolean).map((l) => l.replace(/^[-*]\s*/, '').trim()),
      questionsToReview: questionsText.split('\n').filter(Boolean).map((l) => l.replace(/^[-*]\s*/, '').trim()),
    });
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/30"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg border border-[#e5e7eb] shadow-xl max-w-2xl w-full mx-4 max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e5e7eb]">
          <h2 className="text-lg font-semibold text-[#0f172a]">
            AI Lead Scoring — {company.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-[#64748b] hover:text-[#dc2626] text-xl leading-none"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#dc2626]">
              {error}
            </div>
          )}

          {!result && !loading && (
            <div className="text-sm text-[#64748b]">
              Click "Analyze Company" to get AI-powered lead scoring suggestions. The AI will analyze the company profile and suggest improvements.
            </div>
          )}

          {loading && (
            <div className="flex items-center gap-3 text-sm text-[#64748b]">
              <svg className="animate-spin h-5 w-5 text-[#2563eb]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing company...
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Database Type</label>
              <select
                value={databaseType}
                onChange={(e) => setDatabaseType(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              >
                <option value="big_company">Big Company</option>
                <option value="sme">SME</option>
                <option value="freelance">Freelance</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Industry</label>
              <input
                type="text"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
                placeholder="e.g. SaaS, E-commerce"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              >
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Fit Score (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={fitScore}
                onChange={(e) => setFitScore(Math.max(1, Math.min(10, Number(e.target.value) || 5)))}
                className="w-full text-sm px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-[#475569] mb-1">Ethical Fit</label>
              <select
                value={ethicalFit}
                onChange={(e) => setEthicalFit(e.target.value)}
                className="w-full text-sm px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              >
                <option value="good">Good</option>
                <option value="needs_review">Needs Review</option>
                <option value="avoid">Avoid</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">UX Problem</label>
            <textarea
              value={uxProblem}
              onChange={(e) => setUxProblem(e.target.value)}
              rows={2}
              className="w-full text-sm px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              placeholder="Possible UX or business problem..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">Service To Offer</label>
            <textarea
              value={serviceToOffer}
              onChange={(e) => setServiceToOffer(e.target.value)}
              rows={2}
              className="w-full text-sm px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              placeholder="Suggested service..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">Next Action</label>
            <textarea
              value={nextAction}
              onChange={(e) => setNextAction(e.target.value)}
              rows={2}
              className="w-full text-sm px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              placeholder="Recommended next action..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">Reasoning Summary</label>
            <textarea
              value={reasoningSummary}
              onChange={(e) => setReasoningSummary(e.target.value)}
              rows={2}
              className="w-full text-sm px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              placeholder="AI reasoning..."
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">Risks (one per line)</label>
            <textarea
              value={risksText}
              onChange={(e) => setRisksText(e.target.value)}
              rows={3}
              className="w-full text-sm px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              placeholder="- risk 1&#10;- risk 2"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-[#475569] mb-1">Questions To Review (one per line)</label>
            <textarea
              value={questionsText}
              onChange={(e) => setQuestionsText(e.target.value)}
              rows={3}
              className="w-full text-sm px-3 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]"
              placeholder="- question 1&#10;- question 2"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#e5e7eb]">
          <button
            type="button"
            onClick={onClose}
            className="text-sm px-4 py-2 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
          >
            Cancel
          </button>

          {!result ? (
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading}
              className="text-sm px-4 py-2 rounded border border-[#2563eb] bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Analyzing...' : 'Analyze Company'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleApply}
              className="text-sm px-4 py-2 rounded border border-[#059669] bg-[#059669] text-white hover:bg-[#047857]"
            >
              Apply Suggestions
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AICompanyScoringModal;
