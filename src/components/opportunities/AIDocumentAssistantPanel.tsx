import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useCallback, useMemo, useState } from 'react';
import type {
 Company,
 Deal,
 DocumentBrandSettings,
 DocumentLanguage,
 DocumentTemplate,
 DocumentTemplateInput,
 DocumentType,
 GeneratedDocument,
 GeneratedDocumentInput,
 Person,
 Project,
} from '../../types/opportunities';

type AiMode = 'create_template' | 'improve_document' | 'generate_document' | 'summarize' | 'review_document';
type AiTone = 'professional' | 'friendly' | 'formal' | 'neutral';

const MODE_OPTIONS: Array<{ value: AiMode; label: string }> = [
 { value: 'create_template', label: 'Create Template' },
 { value: 'generate_document', label: 'Generate Document' },
 { value: 'improve_document', label: 'Improve Document' },
 { value: 'summarize', label: 'Summarize' },
 { value: 'review_document', label: 'Review Document' },
];

const DOCUMENT_TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
 { value: 'invoice', label: 'Invoice' },
 { value: 'contract', label: 'Contract' },
 { value: 'cahier_de_charges', label: 'Cahier de Charges' },
 { value: 'proposal', label: 'Proposal' },
 { value: 'agreement', label: 'Agreement' },
 { value: 'receipt', label: 'Receipt' },
 { value: 'ux_audit_report', label: 'UX Audit Report' },
 { value: 'project_brief', label: 'Project Brief' },
 { value: 'document', label: 'Document' },
 { value: 'other', label: 'Other' },
];

const LANGUAGE_OPTIONS: Array<{ value: DocumentLanguage; label: string }> = [
 { value: 'english', label: 'English' },
 { value: 'french', label: 'French' },
 { value: 'arabic', label: 'Arabic' },
];

const TONE_OPTIONS: Array<{ value: AiTone; label: string }> = [
 { value: 'professional', label: 'Professional' },
 { value: 'friendly', label: 'Friendly' },
 { value: 'formal', label: 'Formal' },
 { value: 'neutral', label: 'Neutral' },
];

type AiResult = {
 summary: string;
 improvedContent: string;
 risks: string[];
 missingClauses: string[];
 suggestedSections: string[];
 questionsToReview: string[];
 nextActions: string[];
 templateContent: string;
 templateVariables: string[];
};

const hasText = (value?: string | null) => Boolean(value && value.trim().length > 0);

const callAiDocument = async (promptBody: Record<string, unknown>): Promise<AiResult> => {
 // Build the payload with all available data
 const response = await fetch('/api/ai?action=document', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json' },
 credentials: 'include',
 body: JSON.stringify(promptBody),
 });

 if (!response.ok) {
 const body = await response.json().catch(() => ({}));
 throw new Error(body?.error || `AI request failed — ${response.status}`);
 }

 const result = await response.json();
 return {
 summary: result?.summary || '',
 improvedContent: result?.improvedContent || result?.content || '',
 risks: Array.isArray(result?.risks) ? result.risks : [],
 missingClauses: Array.isArray(result?.missingClauses) ? result.missingClauses : [],
 suggestedSections: Array.isArray(result?.suggestedSections) ? result.suggestedSections : [],
 questionsToReview: Array.isArray(result?.questionsToReview) ? result.questionsToReview : [],
 nextActions: Array.isArray(result?.nextActions) ? result.nextActions : [],
 templateContent: result?.templateContent || '',
 templateVariables: Array.isArray(result?.templateVariables) ? result.templateVariables : [],
 };
};

const AIDocumentAssistantPanel: React.FC<{
  documentBrandSettings: DocumentBrandSettings[];
  documentTemplates: DocumentTemplate[];
  generatedDocuments: GeneratedDocument[];
  projects: Project[];
  companies: Company[];
  people: Person[];

 deals: Deal[];
 onAddDocumentTemplate: (input: DocumentTemplateInput) => Promise<DocumentTemplate>;
 onAddGeneratedDocument: (input: GeneratedDocumentInput) => Promise<GeneratedDocument>;
 onUpdateGeneratedDocument: (id: string, input: Partial<GeneratedDocumentInput>) => Promise<GeneratedDocument>;
}> = ({
 documentBrandSettings,
 documentTemplates,
 generatedDocuments,
 projects,
 companies,
 people,
 deals,
 onAddDocumentTemplate,
 onAddGeneratedDocument,
 onUpdateGeneratedDocument,
}) => {
  const { t } = usePersonalLanguage();
  const [mode, setMode] = useState<AiMode>('generate_document');
 const [documentType, setDocumentType] = useState<DocumentType>('document');
 const [language, setLanguage] = useState<DocumentLanguage>('english');
 const [tone, setTone] = useState<AiTone>('professional');
 const [selectedDocumentId, setSelectedDocumentId] = useState<string>('');
 const [selectedProjectId, setSelectedProjectId] = useState<string>('');
 const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
 const [selectedPersonId, setSelectedPersonId] = useState<string>('');
 const [selectedDealId, setSelectedDealId] = useState<string>('');
 const [documentTitle, setDocumentTitle] = useState('');
 const [documentContent, setDocumentContent] = useState('');
 const [instructions, setInstructions] = useState('');
 const [result, setResult] = useState<AiResult>({
 summary: '',
 improvedContent: '',
 risks: [],
 missingClauses: [],
 suggestedSections: [],
 questionsToReview: [],
 nextActions: [],
 templateContent: '',
 templateVariables: [],
 });
 const [loading, setLoading] = useState(false);
 const [error, setError] = useState('');
 const [successMessage, setSuccessMessage] = useState('');

 const brand = documentBrandSettings[0] ?? null;
 const hasResultContent = useMemo(() => hasText(result.improvedContent) || hasText(result.templateContent), [result]);
 const hasEditableContent = useMemo(() => hasText(documentContent) || hasText(result.improvedContent), [documentContent, result]);
 const savedDocumentTitle = documentTitle || 'Untitled Document';

 const resetResult = useCallback(() => {
 setResult({
 summary: '',
 improvedContent: '',
 risks: [],
 missingClauses: [],
 suggestedSections: [],
 questionsToReview: [],
 nextActions: [],
 templateContent: '',
 templateVariables: [],
 });
 setError('');
 setSuccessMessage('');
 }, []);

 const handleAnalyze = async () => {
 setLoading(true);
 setError('');
 setSuccessMessage('');

 try {
 const promptBody: Record<string, unknown> = {
 action: 'document',
 mode,
 documentType,
 language,
 tone,
 sourceDocumentId: selectedDocumentId || null,
 selectedProjectId: selectedProjectId || null,
 selectedCompanyId: selectedCompanyId || null,
 selectedPersonId: selectedPersonId || null,
 selectedDealId: selectedDealId || null,
 documentTitle: savedDocumentTitle,
 documentContent,
 instructions,
 projectName: projects.find((p) => p.id === selectedProjectId)?.name || null,
 companyName: companies.find((c) => c.id === selectedCompanyId)?.name || null,
 personName: people.find((p) => p.id === selectedPersonId)?.fullName || null,
 brandName: brand?.brandName || null,
 defaultCurrency: brand?.defaultCurrency || null,
 ownerName: brand?.ownerName || null,
 email: brand?.email || null,
 phone: brand?.phone || null,
 website: brand?.website || null,
 address: brand?.address || null,
 signatureName: brand?.signatureName || null,
 allLanguages: LANGUAGE_OPTIONS.map((l) => l.value).join(','),
 allDocumentTypes: DOCUMENT_TYPE_OPTIONS.map((d) => d.value).join(','),
 };

 const response = await callAiDocument(promptBody);
 setResult((current) => ({
 ...current,
 ...response,
 }));
 } catch (err) {
 setError(err instanceof Error ? err.message : 'AI request failed.');
 } finally {
 setLoading(false);
 }
 };

 const handleCopyImprovedContent = async () => {
 try {
 const contentToCopy = result.templateContent || result.improvedContent;
 if (!contentToCopy) throw new Error('No content to copy.');
 await navigator.clipboard.writeText(contentToCopy);
 setSuccessMessage('Content copied to clipboard.');
 } catch (clipboardError) {
 setError(clipboardError instanceof Error ? clipboardError.message : 'Copy failed.');
 }
 };

 const handleSaveAsNewTemplate = async () => {
 try {
 if (!hasText(result.improvedContent) && !hasText(result.templateContent)) {
 setError('No AI content to save as template.');
 return;
 }

 const variablesList = result.templateVariables.length > 0
 ? result.templateVariables.join(',')
 : 'clientName,projectName,amount,currency,date,deadline';

 await onAddDocumentTemplate({
 name: `${savedDocumentTitle} Template`,
 type: documentType,
 language,
 description: `AI-generated template for ${savedDocumentTitle}`,
 content: result.templateContent || result.improvedContent,
 variables: variablesList,
 isActive: true,
 });

 setSuccessMessage(`Template "${savedDocumentTitle} Template" created.`);
 } catch (saveError) {
 setError(saveError instanceof Error ? saveError.message : 'Unable to save template.');
 }
 };

 const handleSaveAsNewGeneratedDocument = async () => {
 try {
 const contentToSave = result.improvedContent || result.templateContent;
 if (!hasText(contentToSave)) {
 setError('No AI content to save as generated document.');
 return;
 }

 await onAddGeneratedDocument({
 title: savedDocumentTitle,
 type: documentType,
 status: 'draft',
 language,
 templateId: undefined,
 relatedProjectId: selectedProjectId || undefined,
 relatedCompanyId: selectedCompanyId || undefined,
 relatedPersonId: selectedPersonId || undefined,
 relatedDealId: selectedDealId || undefined,
 content: contentToSave,
 variablesJson: JSON.stringify({}),
 amount: undefined,
 currency: brand?.defaultCurrency || 'MYR',
 issueDate: undefined,
 dueDate: undefined,
 notes: '',
 });

 setSuccessMessage(`Generated document "${savedDocumentTitle}" created as draft.`);
 } catch (saveError) {
 setError(saveError instanceof Error ? saveError.message : 'Unable to save generated document.');
 }
 };

 const handleReplaceCurrentDocumentContent = async () => {
 try {
 if (!selectedDocumentId) {
 setError('No document selected for replacement.');
 return;
 }

 const contentToUse = result.improvedContent;
 if (!hasText(contentToUse)) {
 setError('No AI content available to replace with.');
 return;
 }

 const currentDocument = generatedDocuments.find((doc) => doc.id === selectedDocumentId);
 if (!currentDocument) {
 setError('Selected document not found.');
 return;
 }

 const patch: Partial<GeneratedDocumentInput> = {
 content: contentToUse,
 notes: `Updated via AI assistant on ${new Date().toISOString().slice(0, 10)}`,
 };

 await onUpdateGeneratedDocument(selectedDocumentId, patch);
 setSuccessMessage('Document content updated. Regenerate the PDF manually if needed.');
 } catch (updateError) {
 setError(updateError instanceof Error ? updateError.message : 'Unable to update document.');
 }
 };

 const inputClass = 'h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400';
 const textareaClass = 'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 resize-y min-h-[96px]';

 return (
 <div className="space-y-5">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="flex flex-wrap items-start justify-between gap-4">
 <div>
 <h3 className="text-lg font-semibold text-neutral-900">AI Document Assistant</h3>
 <p className="mt-1 text-sm text-neutral-500">Draft, improve, summarize, and review documents with user review required.</p>
 <p className="mt-2 max-w-3xl text-xs text-neutral-500">AI Document Assistant helps draft, improve, and review documents, but it is not legal advice. Review important documents with a qualified professional.</p>
 </div>
 <div className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-600">
 User review required
 </div>
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="grid gap-4 xl:grid-cols-2">
 <SectionHeader title="AI Settings" subtitle="Choose the generation mode, document type, language, and tone" />
 <SectionHeader title="Source / Target" subtitle="Select a generated document or paste content manually" />
 </div>

 <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
 <Field label="Mode">
 <select className={inputClass} value={mode} onChange={(event) => { setMode(event.target.value as AiMode); resetResult(); }}>
 {MODE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 </Field>
 <Field label="Document Type">
 <select className={inputClass} value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType)}>
 {DOCUMENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 </Field>
 <Field label={t("common.language", "common.language", "Language")}>
 <select className={inputClass} value={language} onChange={(event) => setLanguage(event.target.value as DocumentLanguage)}>
 {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 </Field>
 <Field label="Tone">
 <select className={inputClass} value={tone} onChange={(event) => setTone(event.target.value as AiTone)}>
 {TONE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 </Field>
 </div>

 <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
 <div className="space-y-4">
 <Field label="Document Source">
 <select className={inputClass} value={selectedDocumentId} onChange={(event) => setSelectedDocumentId(event.target.value)}>
 <option value="">Manual entry</option>
 {generatedDocuments.map((document) => <option key={document.id} value={document.id}>{document.title} ({document.type})</option>)}
 </select>
 </Field>
 <Field label="Document Title">
 <input className={inputClass} value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} placeholder="Document title" />
 </Field>
 <Field label="Document Content">
 <textarea
 className={textareaClass}
 rows={14}
 value={documentContent}
 onChange={(event) => setDocumentContent(event.target.value)}
 placeholder="Paste a document or select an existing generated document"
 />
 </Field>
 </div>

 <div className="space-y-4">
 <SectionHeader title={t("common.context", "common.context", "Context")} subtitle="Selected project, company, person, and deal context are used to guide the AI." />
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
 <Field label="Related Project">
 <select className={inputClass} value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
 <option value="">None</option>
 {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
 </select>
 </Field>
 <Field label="Related Company">
 <select className={inputClass} value={selectedCompanyId} onChange={(event) => setSelectedCompanyId(event.target.value)}>
 <option value="">None</option>
 {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
 </select>
 </Field>
 <Field label="Related Person">
 <select className={inputClass} value={selectedPersonId} onChange={(event) => setSelectedPersonId(event.target.value)}>
 <option value="">None</option>
 {people.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
 </select>
 </Field>
 <Field label="Related Deal">
 <select className={inputClass} value={selectedDealId} onChange={(event) => setSelectedDealId(event.target.value)}>
 <option value="">None</option>
 {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.servicePackage || deal.id}</option>)}
 </select>
 </Field>
 </div>
 <Field label="Custom Instructions">
 <textarea
 className={textareaClass}
 rows={8}
 value={instructions}
 onChange={(event) => setInstructions(event.target.value)}
 placeholder="Optional guidance for the AI, such as focus areas or style preferences"
 />
 </Field>
 <button
 type="button"
 onClick={() => void handleAnalyze()}
 disabled={loading || (!hasEditableContent && mode !== 'create_template')}
 className="w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
 >
 {loading ? 'Analyzing...' : 'Analyze / Generate with AI'}
 </button>
 {error ? <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
 {successMessage ? <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">{successMessage}</div> : null}
 </div>
 </div>
 </div>

 <div className="grid gap-5 xl:grid-cols-2">
 <ResultCard title={t("Summary", "Summary", "Summary")} value={result.summary || 'No summary yet.'} />
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="flex items-start justify-between gap-3">
 <div>
 <h4 className="text-sm font-semibold text-neutral-900">Improved Content</h4>
 <p className="mt-1 text-xs text-neutral-500">Edit this draft before saving or replacing the current document.</p>
 </div>
 {hasResultContent ? (
 <button type="button" onClick={() => void handleCopyImprovedContent()} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
 Copy Improved Content
 </button>
 ) : null}
 </div>
 <textarea
 className="mt-4 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 resize-y min-h-[432px]"
 rows={18}
 value={normalizeResultText(result)}
 onChange={(event) => setResult((current) => ({ ...current, improvedContent: event.target.value }))}
 placeholder="AI output appears here for review"
 />
 </div>
 </div>

 <div className="grid gap-5 xl:grid-cols-2">
 <ListCard title="Risks" items={result.risks} emptyText="No risks identified yet." />
 <ListCard title="Missing Clauses" items={result.missingClauses} emptyText="No missing clauses identified yet." />
 <ListCard title="Suggested Sections" items={result.suggestedSections} emptyText="No suggested sections yet." />
 <ListCard title="Questions to Review" items={result.questionsToReview} emptyText="No review questions yet." />
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="grid gap-4 md:grid-cols-2">
 <ListCard title="Next Actions" items={result.nextActions} emptyText="No next actions yet." />
 <div className="space-y-3">
 <button type="button" onClick={() => void handleSaveAsNewTemplate()} disabled={!hasResultContent} className="w-full rounded-md bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60">
 Save as New Template
 </button>
 <button type="button" onClick={() => void handleSaveAsNewGeneratedDocument()} disabled={!hasResultContent} className="w-full rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60">
 Save as New Generated Document
 </button>
 <button type="button" onClick={() => void handleReplaceCurrentDocumentContent()} disabled={!hasResultContent || !selectedDocumentId} className="w-full rounded-md border border-neutral-200 bg-white px-4 py-3 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60">
 Replace Current Document Content
 </button>
 <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-xs leading-6 text-neutral-500">
 AI output is for drafting and review only. Do not overwrite or send a document without checking the content, context, and formatting first.
 </div>
 </div>
 </div>
 </div>
 </div>
 );
};

const normalizeResultText = (result: AiResult) => {
 const sections: string[] = [];
 if (result.improvedContent) sections.push(result.improvedContent);
 if (result.templateContent) sections.push(result.templateContent);
 if (result.summary) sections.push(result.summary);
 return sections.join('\n\n---\n\n');
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
 <label className="block space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-neutral-500">{label}</span>
 {children}
 </label>
);

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
 <div>
 <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
 {subtitle ? <p className="mt-1 text-xs text-neutral-500">{subtitle}</p> : null}
 </div>
);

const ResultCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
 <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-neutral-600">{value}</p>
 </div>
);

const ListCard: React.FC<{ title: string; items: string[]; emptyText: string }> = ({ title, items, emptyText }) => (
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h4 className="text-sm font-semibold text-neutral-900">{title}</h4>
 <div className="mt-3 space-y-2">
 {items.length > 0 ? items.map((item) => <div key={item} className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm text-neutral-600">{item}</div>) : <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-sm text-neutral-500">{emptyText}</div>}
 </div>
 </div>
);

export default AIDocumentAssistantPanel;
