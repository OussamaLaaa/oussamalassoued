import React, { useState } from 'react';
import type { Company, Person, OutreachMessage, Deal } from '../../types/opportunities';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import Badge from '../ui/Badge';

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
    <Modal open={isOpen} onClose={onClose} title={`AI Lead Scoring — ${company.name}`} width="640px">
      <div className="flex flex-col gap-4">
        {error && (
          <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-4 py-3 text-xs text-neutral-700">
            {error}
          </div>
        )}

        {!result && !loading && (
          <p className="m-0 text-xs text-neutral-500">
            Click "Analyze Company" to get AI-powered lead scoring suggestions. The AI will analyze the company profile and suggest improvements.
          </p>
        )}

        {loading && (
          <div className="flex items-center gap-3 text-xs text-neutral-500">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" className="opacity-25" />
              <path d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" fill="currentColor" className="opacity-75" />
            </svg>
            Analyzing company...
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Database Type"
            value={databaseType}
            onChange={(e) => setDatabaseType(e.target.value)}
            options={[
              { value: 'big_company', label: 'Big Company' },
              { value: 'sme', label: 'SME' },
              { value: 'freelance', label: 'Freelance' },
            ]}
          />
          <Input
            label="Industry"
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="e.g. SaaS, E-commerce"
          />
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            options={[
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
          />
          <Input
            label="Fit Score (1-10)"
            type="number"
            min={1}
            max={10}
            value={fitScore}
            onChange={(e) => setFitScore(Math.max(1, Math.min(10, Number(e.target.value) || 5)))}
          />
          <Select
            label="Ethical Fit"
            value={ethicalFit}
            onChange={(e) => setEthicalFit(e.target.value)}
            options={[
              { value: 'good', label: 'Good' },
              { value: 'needs_review', label: 'Needs Review' },
              { value: 'avoid', label: 'Avoid' },
            ]}
          />
        </div>

        <Textarea
          label="UX Problem"
          value={uxProblem}
          onChange={(e) => setUxProblem(e.target.value)}
          rows={2}
          placeholder="Possible UX or business problem..."
        />
        <Textarea
          label="Service To Offer"
          value={serviceToOffer}
          onChange={(e) => setServiceToOffer(e.target.value)}
          rows={2}
          placeholder="Suggested service..."
        />
        <Textarea
          label="Next Action"
          value={nextAction}
          onChange={(e) => setNextAction(e.target.value)}
          rows={2}
          placeholder="Recommended next action..."
        />
        <Textarea
          label="Reasoning Summary"
          value={reasoningSummary}
          onChange={(e) => setReasoningSummary(e.target.value)}
          rows={2}
          placeholder="AI reasoning..."
        />
        <Textarea
          label="Risks (one per line)"
          value={risksText}
          onChange={(e) => setRisksText(e.target.value)}
          rows={3}
          placeholder="- risk 1&#10;- risk 2"
        />
        <Textarea
          label="Questions To Review (one per line)"
          value={questionsText}
          onChange={(e) => setQuestionsText(e.target.value)}
          rows={3}
          placeholder="- question 1&#10;- question 2"
        />
      </div>

      <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-neutral-200">
        <Button variant="secondary" size="md" onClick={onClose}>Cancel</Button>
        {!result ? (
          <Button variant="primary" size="md" onClick={handleAnalyze} disabled={loading}>
            {loading ? 'Analyzing...' : 'Analyze Company'}
          </Button>
        ) : (
          <Button variant="primary" size="md" onClick={handleApply}>Apply Suggestions</Button>
        )}
      </div>
    </Modal>
  );
};

export default AICompanyScoringModal;
