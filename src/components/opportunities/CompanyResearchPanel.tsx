import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useEffect, useState } from 'react';
import type {
 CompanyInput,
 CompanyResearchConfidence,
 CompanyResearchContactMethodSuggestion,
 CompanyResearchOutreachScriptSuggestion,
 CompanyResearchProblemProfileSuggestion,
 CompanyResearchResult,
 CompanyResearchSource,
 CompanyResearchSuggestionCompany,
} from '../../types/opportunities';

type ResearchFieldKey = keyof Pick<CompanyInput, 'name' | 'databaseType' | 'category' | 'industry' | 'country' | 'city' | 'website' | 'linkedin' | 'priority' | 'fitScore' | 'ethicalFit' | 'status' | 'nextAction' | 'notes'>;

const panelClass = 'rounded-xl border border-neutral-200 bg-white';

const FIELD_LABELS: Record<ResearchFieldKey, string> = {
 name: 'Company Name',
 databaseType: 'Database Type',
 category: 'Category',
 industry: 'Industry',
 country: 'Country',
 city: 'City',
 website: 'Website',
 linkedin: 'LinkedIn',
 priority: 'Priority',
 fitScore: 'Fit Score',
 ethicalFit: 'Ethical Fit',
 status: 'Status',
 nextAction: 'Next Action',
 notes: 'Notes',
};

const hasText = (value?: string | number | null) => value !== null && value !== undefined && String(value).trim().length > 0;

const normalizeText = (value?: string | number | null) => (value === null || value === undefined ? '' : String(value).trim());

const toConfidenceClass = (value: CompanyResearchConfidence) => {
  const { t, language } = usePersonalLanguage();

 if (value === 'high') return 'border-emerald-200 bg-emerald-50 text-emerald-700';
 if (value === 'medium') return 'border-amber-200 bg-amber-50 text-amber-700';
 return 'border-neutral-200 bg-neutral-100 text-neutral-600';
};

const getFieldValue = (company: Partial<CompanyInput> | undefined, field: ResearchFieldKey) => {
 if (!company) return '';
 const value = company[field];
 return normalizeText(value as string | number | null | undefined);
};

const mapSuggestionToPatch = (field: ResearchFieldKey, suggestion: CompanyResearchSuggestionCompany) => {
 switch (field) {
 case 'name': return suggestion.name ?? null;
 case 'databaseType': return suggestion.databaseType && suggestion.databaseType !== 'other' ? suggestion.databaseType : undefined;
 case 'category': return suggestion.category ?? null;
 case 'industry': return suggestion.industry ?? null;
 case 'country': return suggestion.country ?? null;
 case 'city': return suggestion.city ?? null;
 case 'website': return suggestion.website ?? null;
 case 'linkedin': return suggestion.linkedin ?? null;
 case 'priority': return suggestion.priority ?? null;
 case 'fitScore': return suggestion.fitScore ?? null;
 case 'ethicalFit': return suggestion.ethicalFit ?? null;
 case 'status': return suggestion.status ?? null;
 case 'nextAction': return suggestion.nextAction ?? null;
 case 'notes': return suggestion.notes ?? null;
 default: return null;
 }
};

const buildSelectedPatch = (
 currentCompany: Partial<CompanyInput> | undefined,
 suggestion: CompanyResearchSuggestionCompany,
 selectedFields: Set<ResearchFieldKey>,
) => {
 const patch: Partial<CompanyInput> = {};

 (Object.keys(FIELD_LABELS) as ResearchFieldKey[]).forEach((field) => {
 if (!selectedFields.has(field)) return;
 const suggestionValue = mapSuggestionToPatch(field, suggestion);
 if (suggestionValue === undefined) return;
 const currentValue = getFieldValue(currentCompany, field);
 if (currentValue && String(currentValue).trim().length > 0 && String(currentValue) === String(suggestionValue ?? '')) return;
 if (suggestionValue === null) {
 patch[field] = undefined;
 } else {
 patch[field] = suggestionValue as CompanyInput[typeof field];
 }
 });

 return patch;
};

const formatFieldValue = (value: unknown) => {
 if (value === null || value === undefined || value === '') return '—';
 if (typeof value === 'number') return String(value);
 return String(value);
};

const CompanyResearchPanel: React.FC<{
 companyName: string;
 countryHint?: string;
 cityHint?: string;
 industryHint?: string;
 websiteHint?: string;
 language?: 'auto' | 'english' | 'french' | 'arabic';
 debug?: boolean;
 title?: string;
 currentCompany?: Partial<CompanyInput>;
 showRelatedActions?: boolean;
 onApplyCompanyPatch?: (patch: Partial<CompanyInput>, result: CompanyResearchResult) => Promise<void> | void;
 onResultChange?: (result: CompanyResearchResult | null) => void;
 onCreateContactMethods?: (items: CompanyResearchContactMethodSuggestion[]) => Promise<void> | void;
 onCreateProblemProfile?: (item: CompanyResearchProblemProfileSuggestion) => Promise<void> | void;
 onCreateOutreachScript?: (item: CompanyResearchOutreachScriptSuggestion) => Promise<void> | void;
}> = ({
 companyName,
 countryHint,
 cityHint,
 industryHint,
 websiteHint,
 language = 'auto',
 debug = false,
 title = 'AI Research',
 currentCompany,
 showRelatedActions = false,
 onApplyCompanyPatch,
 onResultChange,
 onCreateContactMethods,
 onCreateProblemProfile,
 onCreateOutreachScript,
}) => {
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const [result, setResult] = useState<CompanyResearchResult | null>(null);
 const [selectedFields, setSelectedFields] = useState<Set<ResearchFieldKey>>(new Set());
 const [showAllDetails, setShowAllDetails] = useState(false);

 const normalizedCompanyName = companyName.trim();

 useEffect(() => {
 onResultChange?.(result);
 }, [result, onResultChange]);

 useEffect(() => {
 if (!result) {
 setSelectedFields(new Set());
 return;
 }

 const nextSelected = new Set<ResearchFieldKey>();
 (Object.keys(FIELD_LABELS) as ResearchFieldKey[]).forEach((field) => {
 const suggestionValue = mapSuggestionToPatch(field, result.company);
 if (!hasText(suggestionValue)) return;

 const currentValue = getFieldValue(currentCompany, field);
 if (!currentValue || String(currentValue).trim() === String(suggestionValue).trim()) {
 nextSelected.add(field);
 }
 });
 setSelectedFields(nextSelected);
 }, [result, currentCompany]);

 const canRun = normalizedCompanyName.length > 0 && !loading;

 const handleResearch = async () => {
 if (!normalizedCompanyName) return;
 setLoading(true);
 setError(null);
 setResult(null);

 try {
 const response = await fetch('/api/ai?action=company-research', {
 method: 'POST',
 credentials: 'same-origin',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 companyName: normalizedCompanyName,
 countryHint: countryHint?.trim() || undefined,
 cityHint: cityHint?.trim() || undefined,
 industryHint: industryHint?.trim() || undefined,
 websiteHint: websiteHint?.trim() || undefined,
 language,
 debug,
 }),
 });

 const data = await response.json().catch(() => null);

 if (!response.ok) {
 if (response.status === 401) {
 throw new Error('Authentication required. Please log in again.');
 }
 if (/AI company research is not configured/i.test(String(data?.error || ''))) {
 throw new Error('AI provider is not configured for company research.');
 }
 if (/AI returned an unreadable response/i.test(String(data?.error || ''))) {
 throw new Error('AI returned an unreadable response. Try again.');
 }
 if (response.status >= 500) {
 throw new Error('AI company research failed. Check configuration or try again.');
 }
 throw new Error(String(data?.error || 'Unable to research company.'));
 }

 if (!data?.success || !data?.result) {
 throw new Error(String(data?.error || 'AI returned an unreadable response. Try again.'));
 }

 setResult(data.result as CompanyResearchResult);
 } catch (fetchError) {
 setError(fetchError instanceof Error ? fetchError.message : 'Unable to research company.');
 } finally {
 setLoading(false);
 }
 };

 const toggleField = (field: ResearchFieldKey) => {
 setSelectedFields((current) => {
 const next = new Set(current);
 if (next.has(field)) next.delete(field);
 else next.add(field);
 return next;
 });
 };

 const handleApplySelected = async () => {
 if (!result || !onApplyCompanyPatch) return;
 const patch = buildSelectedPatch(currentCompany, result.company, selectedFields);
 await onApplyCompanyPatch(patch, result);
 };

 const handleApplyAll = async () => {
 if (!result || !onApplyCompanyPatch) return;
 const patch: Partial<CompanyInput> = {};
 (Object.keys(FIELD_LABELS) as ResearchFieldKey[]).forEach((field) => {
 const suggestionValue = mapSuggestionToPatch(field, result.company);
 if (suggestionValue === undefined) return;
 if (suggestionValue === null) {
 patch[field] = undefined;
 } else {
 patch[field] = suggestionValue as CompanyInput[typeof field];
 }
 });
 await onApplyCompanyPatch(patch, result);
 };

 const handleCreateContactMethods = async () => {
 if (!result?.contactMethods?.length || !onCreateContactMethods) return;
 await onCreateContactMethods(result.contactMethods);
 };

 const handleCreateProblemProfile = async () => {
 if (!result?.problemProfile || !onCreateProblemProfile) return;
 await onCreateProblemProfile(result.problemProfile);
 };

 const handleCreateOutreachScript = async () => {
 if (!result?.outreachScript || !onCreateOutreachScript) return;
 await onCreateOutreachScript(result.outreachScript);
 };

 const renderSource = (source: CompanyResearchSource, index: number) => (
 <div key={`${source.url || source.title || 'source'}-${index}`} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm">
 <div className="flex flex-wrap items-center gap-2">
 <span className="font-medium text-neutral-900">{source.title || 'Source'}</span>
 <span className={'inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] ' + toConfidenceClass(source.confidence || 'low')}>
 {source.confidence || 'low'}
 </span>
 </div>
 {source.usedFor ? <p className="mt-1 text-xs text-neutral-600">Used for: {source.usedFor}</p> : null}
 {source.url ? (
 <a href={source.url} target="_blank" rel="noopener noreferrer" className="mt-2 inline-block break-all text-xs text-neutral-900 underline underline-offset-2">
 {source.url}
 </a>
 ) : null}
 </div>
 );

 return (
 <div className="space-y-4">
 <div className={panelClass + ' p-4'}>
 <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
 <div className="space-y-1">
 <p className="text-xs font-semibold uppercase tracking-[0.16em] text-neutral-500">{title}</p>
 <h3 className="text-base font-semibold text-neutral-900">{normalizedCompanyName || 'Company research'}</h3>
 <p className="text-xs text-neutral-500">AI analyzed public web sources and prepared suggestions. Nothing is saved automatically.</p>
 </div>
 <div className="flex items-center gap-2">
 <button type="button" onClick={handleResearch} disabled={!canRun} className="inline-flex items-center rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
 {loading ? 'Researching company...' : 'Research AI'}
 </button>
 </div>
 </div>

 {(countryHint || cityHint || industryHint || websiteHint) ? (
 <div className="mt-4 flex flex-wrap gap-2 text-xs text-neutral-600">
 {countryHint ? <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">Country: {countryHint}</span> : null}
 {cityHint ? <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">City: {cityHint}</span> : null}
 {industryHint ? <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">Industry: {industryHint}</span> : null}
 {websiteHint ? <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-1">Website hint: {websiteHint}</span> : null}
 </div>
 ) : null}

 {error ? (
 <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>
 ) : null}

 {loading ? (
 <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">Researching public company information...</div>
 ) : null}
 </div>

 {result ? (
 <div className="space-y-4">
 <div className={panelClass + ' p-4'}>
 <div className="flex flex-wrap items-center justify-between gap-2">
 <div>
 <h4 className="text-sm font-semibold text-neutral-900">AI Research Suggestions</h4>
 <p className="mt-1 text-xs text-neutral-500">Select the fields you want to apply. Empty fields are preselected.</p>
 </div>
 <span className={'inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] ' + toConfidenceClass(result.confidence)}>
 {result.confidence} confidence
 </span>
 </div>

 <div className="mt-4 grid gap-2 text-xs text-neutral-600 sm:grid-cols-3">
 <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">Search provider: {result.researchMeta?.searchProvider ? String(result.researchMeta.searchProvider).replace(/^serper$/i, 'Serper') : 'Live AI web research is not configured'}</div>
 <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">Reasoning model: {result.researchMeta?.reasoningProvider ? String(result.researchMeta.reasoningProvider).replace(/^gemini$/i, 'Gemini') : 'Gemini'}</div>
 <div className="rounded-lg border border-neutral-200 bg-neutral-50 px-3 py-2">Result count: {result.researchMeta?.resultCount ?? result.sources?.length ?? 0}</div>
 </div>

 {result.researchMeta?.searchProvider ? (
 <p className="mt-3 text-xs text-neutral-500">Search provider: {String(result.researchMeta.searchProvider).replace(/^serper$/i, 'Serper')}. Reasoning model: {String(result.researchMeta.reasoningProvider || 'Gemini').replace(/^gemini$/i, 'Gemini')}.</p>
 ) : null}

 {result.researchMeta?.resultCount === 0 ? (
 <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">AI research ran, but no reliable public sources were found.</div>
 ) : null}

 {result.warnings?.length ? (
 <div className="mt-4 space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
 <p className="font-medium">Warnings</p>
 <ul className="space-y-1 text-xs">
 {result.warnings.map((warning, index) => <li key={`${warning}-${index}`}>• {warning}</li>)}
 </ul>
 </div>
 ) : null}

 <div className="mt-4 grid gap-3 md:grid-cols-2">
 {(Object.keys(FIELD_LABELS) as ResearchFieldKey[]).map((field) => {
 const suggestionValue = mapSuggestionToPatch(field, result.company);
 if (suggestionValue === undefined || suggestionValue === null || suggestionValue === '') return null;
 const currentValue = getFieldValue(currentCompany, field);
 const isConflict = hasText(currentValue) && String(currentValue).trim() !== String(suggestionValue).trim();

 return (
 <label key={field} className={'flex gap-3 rounded-lg border p-3 ' + (isConflict ? 'border-amber-200 bg-amber-50/60' : 'border-neutral-200 bg-white')}>
 <input type="checkbox" className="mt-1 h-4 w-4 rounded border-neutral-300 text-black" checked={selectedFields.has(field)} onChange={() => toggleField(field)} />
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className="text-sm font-medium text-neutral-900">{FIELD_LABELS[field]}</span>
 {isConflict ? <span className="rounded-full border border-amber-200 bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-amber-800">Review before overwrite</span> : null}
 </div>
 <p className="mt-1 break-words text-sm text-neutral-700">{formatFieldValue(suggestionValue)}</p>
 {isConflict ? <p className="mt-1 text-xs text-neutral-500">Current value: {currentValue}</p> : null}
 </div>
 </label>
 );
 })}
 </div>

 <div className="mt-4">
 <h5 className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Sources</h5>
 <div className="mt-3 space-y-2">
 {result.sources?.length ? result.sources.map(renderSource) : <p className="text-sm text-neutral-500">No source list was returned.</p>}
 </div>
 </div>

 <div className="mt-4 flex flex-wrap items-center gap-2">
 <button type="button" onClick={handleApplySelected} disabled={!onApplyCompanyPatch || selectedFields.size === 0} className="rounded-lg bg-black px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">
 Apply Selected
 </button>
 <button type="button" onClick={handleApplyAll} disabled={!onApplyCompanyPatch} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900 disabled:cursor-not-allowed disabled:opacity-50">
 Apply All Suggestions
 </button>
 <button type="button" onClick={() => setShowAllDetails((current) => !current)} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-medium text-neutral-900">
 {showAllDetails ? 'Hide Details' : 'Show Details'}
 </button>
 </div>
 </div>

 {showAllDetails ? (
 <div className="grid gap-4 lg:grid-cols-2">
 <div className={panelClass + ' p-4'}>
 <h4 className="text-sm font-semibold text-neutral-900">Company Research Context</h4>
 <div className="mt-3 space-y-2 text-sm text-neutral-700">
 <p><span className="font-medium text-neutral-900">Legal name:</span> {result.company.legalName || '—'}</p>
 <p><span className="font-medium text-neutral-900">Description:</span> {result.company.description || '—'}</p>
 <p><span className="font-medium text-neutral-900">Phone:</span> {result.company.phone || '—'}</p>
 <p><span className="font-medium text-neutral-900">Email:</span> {result.company.email || '—'}</p>
 <p><span className="font-medium text-neutral-900">Facebook:</span> {result.company.facebook || '—'}</p>
 <p><span className="font-medium text-neutral-900">Instagram:</span> {result.company.instagram || '—'}</p>
 <p><span className="font-medium text-neutral-900">Twitter:</span> {result.company.twitter || '—'}</p>
 <p><span className="font-medium text-neutral-900">YouTube:</span> {result.company.youtube || '—'}</p>
 </div>
 </div>

 </div>
 ) : null}

 {(result.contactMethods?.length || result.problemProfile || result.outreachScript) ? (
 <div className="grid gap-4 lg:grid-cols-3">
 <div className={panelClass + ' p-4'}>
 <div className="flex items-center justify-between gap-2">
 <h4 className="text-sm font-semibold text-neutral-900">Suggested Contact Methods</h4>
 {showRelatedActions && onCreateContactMethods ? (
 <button type="button" onClick={handleCreateContactMethods} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900">
 Create
 </button>
 ) : null}
 </div>
 <div className="mt-3 space-y-2 text-sm text-neutral-700">
 {result.contactMethods?.length ? result.contactMethods.map((method, index) => (
 <div key={`${method.value || method.label || 'method'}-${index}`} className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
 <p className="font-medium text-neutral-900">{method.label || method.type || 'Contact method'}</p>
 <p className="mt-1 break-words text-sm text-neutral-700">{method.value || '—'}</p>
 <div className="mt-2 flex flex-wrap gap-2 text-[11px] text-neutral-500">
 {method.type ? <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5">{method.type}</span> : null}
 {method.confidence ? <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5">{method.confidence}</span> : null}
 {method.sourceUrl ? <a href={method.sourceUrl} target="_blank" rel="noopener noreferrer" className="rounded-full border border-neutral-200 bg-white px-2 py-0.5 text-neutral-700 underline underline-offset-2">Source</a> : null}
 </div>
 </div>
 )) : <p className="text-sm text-neutral-500">No public contact methods were returned.</p>}
 </div>
 </div>

 <div className={panelClass + ' p-4'}>
 <div className="flex items-center justify-between gap-2">
 <h4 className="text-sm font-semibold text-neutral-900">Suggested Problem Profile</h4>
 {showRelatedActions && result.problemProfile && onCreateProblemProfile ? (
 <button type="button" onClick={handleCreateProblemProfile} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900">Create</button>
 ) : null}
 </div>
 {result.problemProfile ? (
 <div className="mt-3 space-y-2 text-sm text-neutral-700">
 <p><span className="font-medium text-neutral-900">Title:</span> {result.problemProfile.problemTitle || '—'}</p>
 <p><span className="font-medium text-neutral-900">Description:</span> {result.problemProfile.problemDescription || '—'}</p>
 <p><span className="font-medium text-neutral-900">Situation:</span> {result.problemProfile.currentSituation || '—'}</p>
 <p><span className="font-medium text-neutral-900">Impact:</span> {result.problemProfile.businessImpact || '—'}</p>
 <p><span className="font-medium text-neutral-900">Solution:</span> {result.problemProfile.proposedSolution || '—'}</p>
 <p><span className="font-medium text-neutral-900">Value proposition:</span> {result.problemProfile.valueProposition || '—'}</p>
 <div className="flex flex-wrap gap-2 text-[11px] text-neutral-500">
 {result.problemProfile.urgency ? <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5">Urgency: {result.problemProfile.urgency}</span> : null}
 {result.problemProfile.confidence ? <span className="rounded-full border border-neutral-200 bg-white px-2 py-0.5">Confidence: {result.problemProfile.confidence}</span> : null}
 </div>
 </div>
 ) : (
 <p className="mt-3 text-sm text-neutral-500">No problem profile was returned.</p>
 )}
 </div>

 <div className={panelClass + ' p-4'}>
 <div className="flex items-center justify-between gap-2">
 <h4 className="text-sm font-semibold text-neutral-900">Suggested Outreach Script</h4>
 {showRelatedActions && result.outreachScript && onCreateOutreachScript ? (
 <button type="button" onClick={handleCreateOutreachScript} className="rounded-lg border border-neutral-300 bg-white px-3 py-2 text-xs font-medium text-neutral-900">Create</button>
 ) : null}
 </div>
 {result.outreachScript ? (
 <div className="mt-3 space-y-2 text-sm text-neutral-700">
 <p><span className="font-medium text-neutral-900">Name:</span> {result.outreachScript.name || '—'}</p>
 <p><span className="font-medium text-neutral-900">Channel:</span> {result.outreachScript.channel || '—'}</p>
 <p><span className="font-medium text-neutral-900">Audience:</span> {result.outreachScript.audience || '—'}</p>
 <p><span className="font-medium text-neutral-900">Goal:</span> {result.outreachScript.goal || '—'}</p>
 <p><span className="font-medium text-neutral-900">Hook:</span> {result.outreachScript.hook || '—'}</p>
 <p><span className="font-medium text-neutral-900">Message body:</span> {result.outreachScript.messageBody || '—'}</p>
 <p><span className="font-medium text-neutral-900">Call script:</span> {result.outreachScript.callScript || '—'}</p>
 <p><span className="font-medium text-neutral-900">Follow-up:</span> {result.outreachScript.followUpMessage || '—'}</p>
 </div>
 ) : (
 <p className="mt-3 text-sm text-neutral-500">No outreach script was returned.</p>
 )}
 </div>
 </div>
 ) : null}
 </div>
 ) : null}
 </div>
 );
};

export default CompanyResearchPanel;