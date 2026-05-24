import React, { useEffect, useMemo, useState } from 'react';
import type { Company, Deal, DocumentBrandSettings, DocumentLanguage, DocumentTemplateInput, DocumentType, GeneratedDocument, GeneratedDocumentInput, Person, Project } from '../../types/opportunities';

type AIResult = {
  summary: string;
  improvedContent: string;
  risks: string[];
  missingClauses: string[];
  suggestedSections: string[];
  questionsToReview: string[];
  nextActions: string[];
};

type AiMode = 'create_template' | 'improve_document' | 'risk_review' | 'missing_clauses' | 'adapt_to_project' | 'summarize_document' | 'rewrite_tone' | 'translate_document';
type AiTone = 'professional' | 'simple' | 'formal' | 'friendly' | 'concise';

type AIDocumentAssistantPanelProps = {
  documentBrandSettings: DocumentBrandSettings[];
  documentTemplates: DocumentTemplateInput[];
  generatedDocuments: GeneratedDocument[];
  projects: Project[];
  companies: Company[];
  people: Person[];
  deals: Deal[];
  onAddDocumentTemplate: (input: DocumentTemplateInput) => Promise<unknown>;
  onAddGeneratedDocument: (input: GeneratedDocumentInput) => Promise<GeneratedDocument>;
  onUpdateGeneratedDocument: (id: string, input: Partial<GeneratedDocumentInput>) => Promise<GeneratedDocument>;
};

const MODE_OPTIONS: Array<{ value: AiMode; label: string }> = [
  { value: 'create_template', label: 'Create Template' },
  { value: 'improve_document', label: 'Improve Document' },
  { value: 'risk_review', label: 'Risk Review' },
  { value: 'missing_clauses', label: 'Missing Clauses' },
  { value: 'adapt_to_project', label: 'Adapt to Project' },
  { value: 'summarize_document', label: 'Summarize' },
  { value: 'rewrite_tone', label: 'Rewrite Tone' },
  { value: 'translate_document', label: 'Translate' },
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
  { value: 'simple', label: 'Simple' },
  { value: 'formal', label: 'Formal' },
  { value: 'friendly', label: 'Friendly' },
  { value: 'concise', label: 'Concise' },
];

const EMPTY_RESULT: AIResult = {
  summary: '',
  improvedContent: '',
  risks: [],
  missingClauses: [],
  suggestedSections: [],
  questionsToReview: [],
  nextActions: [],
};

const DEFAULT_TITLE = 'Untitled Document';

const todayStamp = () => new Date().toISOString().slice(0, 10);

const truncate = (value: string, maxLength: number) => (value.length > maxLength ? value.slice(0, maxLength) : value);

const uniquePlaceholders = (content: string) => {
  const matches = content.match(/\{\{\s*([^}]+)\s*\}\}/g) || [];
  const values = new Set<string>();
  for (const match of matches) {
    const inner = match.replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, '').trim();
    if (inner) values.add(inner);
  }
  return Array.from(values).join(',');
};

const buildTemplateName = (documentType: DocumentType, mode: AiMode) => {
  const normalizedMode = mode.replace(/_/g, ' ');
  const normalizedType = documentType.replace(/_/g, ' ');
  return `${normalizedType} ${normalizedMode} ${todayStamp()}`;
};

const buildGeneratedTitle = (documentTitle: string, documentType: DocumentType) => {
  const base = documentTitle.trim() || documentType.replace(/_/g, ' ');
  return `${base} ${todayStamp()}`;
};

const fieldValue = (value?: string) => (value ? value.trim() : '');

const AIDocumentAssistantPanel: React.FC<AIDocumentAssistantPanelProps> = ({
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
  const brand = documentBrandSettings[0] ?? null;
  const [mode, setMode] = useState<AiMode>('create_template');
  const [documentType, setDocumentType] = useState<DocumentType>('contract');
  const [language, setLanguage] = useState<DocumentLanguage>('english');
  const [tone, setTone] = useState<AiTone>('professional');
  const [selectedDocumentId, setSelectedDocumentId] = useState('');
  const [documentTitle, setDocumentTitle] = useState(DEFAULT_TITLE);
  const [documentContent, setDocumentContent] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [selectedPersonId, setSelectedPersonId] = useState('');
  const [selectedDealId, setSelectedDealId] = useState('');
  const [instructions, setInstructions] = useState('');
  const [result, setResult] = useState<AIResult>(EMPTY_RESULT);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const selectedDocument = useMemo(
    () => generatedDocuments.find((document) => document.id === selectedDocumentId) ?? null,
    [generatedDocuments, selectedDocumentId],
  );

  const selectedProject = useMemo(() => projects.find((project) => project.id === selectedProjectId) ?? null, [projects, selectedProjectId]);
  const selectedCompany = useMemo(() => companies.find((company) => company.id === selectedCompanyId) ?? null, [companies, selectedCompanyId]);
  const selectedPerson = useMemo(() => people.find((person) => person.id === selectedPersonId) ?? null, [people, selectedPersonId]);
  const selectedDeal = useMemo(() => deals.find((deal) => deal.id === selectedDealId) ?? null, [deals, selectedDealId]);

  const hasEditableContent = mode === 'create_template' || fieldValue(documentContent).length > 0;
  const hasResultContent = fieldValue(result.improvedContent).length > 0;

  useEffect(() => {
    if (!selectedDocument) return;

    setDocumentTitle(selectedDocument.title || DEFAULT_TITLE);
    setDocumentType(selectedDocument.type);
    setLanguage(selectedDocument.language);
    setDocumentContent(selectedDocument.content || '');
    setSelectedProjectId(selectedDocument.relatedProjectId || '');
    setSelectedCompanyId(selectedDocument.relatedCompanyId || '');
    setSelectedPersonId(selectedDocument.relatedPersonId || '');
    setSelectedDealId(selectedDocument.relatedDealId || '');
  }, [selectedDocument]);

  useEffect(() => {
    if (mode === 'create_template') return;
    if (!selectedDocument) return;
    setDocumentType(selectedDocument.type);
    setLanguage(selectedDocument.language);
  }, [mode, selectedDocument]);

  const context = useMemo(() => ({
    projectName: selectedProject?.name || selectedDocument?.relatedProjectName || '',
    companyName: selectedCompany?.name || selectedDocument?.relatedCompanyName || '',
    personName: selectedPerson?.fullName || selectedDocument?.relatedPersonName || '',
    dealName: selectedDeal?.servicePackage || selectedDeal?.id || selectedDocument?.relatedDealName || '',
    serviceDescription: selectedDeal?.servicePackage || selectedProject?.nextAction || selectedProject?.notes || selectedDocument?.notes || '',
    deliverables: selectedDocument?.content || '',
    timeline: selectedDocument?.dueDate || selectedProject?.deadline || '',
    paymentTerms: brand?.paymentNotes || '',
    notes: selectedDocument?.notes || selectedProject?.notes || '',
  }), [brand?.paymentNotes, selectedDeal?.id, selectedDeal?.servicePackage, selectedDocument?.content, selectedDocument?.dueDate, selectedDocument?.notes, selectedDocument?.relatedCompanyName, selectedDocument?.relatedDealName, selectedDocument?.relatedPersonName, selectedDocument?.relatedProjectName, selectedProject?.deadline, selectedProject?.name, selectedProject?.nextAction, selectedProject?.notes, selectedCompany?.name, selectedPerson?.fullName]);

  const selectedBrand = useMemo(() => ({
    brandName: brand?.brandName || '',
    ownerName: brand?.ownerName || '',
    email: brand?.email || '',
    phone: brand?.phone || '',
    website: brand?.website || '',
    address: brand?.address || '',
    legalNotes: brand?.legalNotes || '',
    paymentNotes: brand?.paymentNotes || '',
  }), [brand]);

  const resetResult = () => {
    setResult(EMPTY_RESULT);
    setError('');
    setSuccessMessage('');
  };

  const handleAnalyze = async () => {
    if (!hasEditableContent && mode !== 'create_template') {
      setError('Select a document or paste content before analyzing.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const response = await fetch('/api/ai-document', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          documentType,
          language,
          tone,
          document: {
            title: documentTitle,
            type: documentType,
            content: documentContent,
            status: selectedDocument?.status || 'draft',
            amount: selectedDocument?.amount,
            currency: selectedDocument?.currency,
            issueDate: selectedDocument?.issueDate,
            dueDate: selectedDocument?.dueDate,
          },
          context,
          brand: selectedBrand,
          instructions: fieldValue(instructions) || undefined,
          debug: import.meta.env.DEV,
        }),
      });

      const json = await response.json().catch(() => ({}));

      if (response.status === 401) {
        setError('Authentication required. Please log in again.');
        return;
      }

      if (!response.ok) {
        if (json?.code === 'AI_QUOTA_EXCEEDED') {
          setError('AI quota exceeded. Try again later or change Gemini model.');
        } else {
          setError(json?.error || 'AI Document Assistant could not generate a response.');
        }
        return;
      }

      if (!json?.success || !json?.result) {
        setError('AI Document Assistant could not generate a response. Review manually.');
        return;
      }

      const nextResult: AIResult = {
        summary: json.result.summary || '',
        improvedContent: json.result.improvedContent || '',
        risks: Array.isArray(json.result.risks) ? json.result.risks : [],
        missingClauses: Array.isArray(json.result.missingClauses) ? json.result.missingClauses : [],
        suggestedSections: Array.isArray(json.result.suggestedSections) ? json.result.suggestedSections : [],
        questionsToReview: Array.isArray(json.result.questionsToReview) ? json.result.questionsToReview : [],
        nextActions: Array.isArray(json.result.nextActions) ? json.result.nextActions : [],
      };

      setResult(nextResult);
      setSuccessMessage('AI output generated. Review it before saving or replacing anything.');
    } catch {
      setError('AI Document Assistant could not generate a response. Review manually.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyImprovedContent = async () => {
    if (!hasResultContent) return;
    try {
      await navigator.clipboard.writeText(result.improvedContent);
      setSuccessMessage('Improved content copied to clipboard.');
    } catch {
      setError('Unable to copy content.');
    }
  };

  const handleSaveAsNewTemplate = async () => {
    if (!hasResultContent) return;

    const payload: DocumentTemplateInput = {
      name: buildTemplateName(documentType, mode),
      type: documentType,
      language,
      description: fieldValue(result.summary) || undefined,
      content: result.improvedContent,
      variables: uniquePlaceholders(result.improvedContent) || undefined,
      isActive: true,
    };

    try {
      await onAddDocumentTemplate(payload);
      setSuccessMessage('Saved as a new template.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save template.');
    }
  };

  const handleSaveAsNewGeneratedDocument = async () => {
    if (!hasResultContent) return;

    const payload: GeneratedDocumentInput = {
      title: buildGeneratedTitle(documentTitle, documentType),
      type: documentType,
      status: 'draft',
      language,
      content: result.improvedContent,
      relatedProjectId: selectedProjectId || undefined,
      relatedCompanyId: selectedCompanyId || undefined,
      relatedPersonId: selectedPersonId || undefined,
      relatedDealId: selectedDealId || undefined,
      notes: fieldValue(result.summary) || undefined,
    };

    try {
      await onAddGeneratedDocument(payload);
      setSuccessMessage('Saved as a new generated document.');
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save generated document.');
    }
  };

  const handleReplaceCurrentDocumentContent = async () => {
    if (!hasResultContent) return;
    if (!selectedDocumentId) {
      setError('Select a generated document to replace.');
      return;
    }

    const confirmed = window.confirm('Replace current document content with AI output?');
    if (!confirmed) return;

    try {
      await onUpdateGeneratedDocument(selectedDocumentId, { content: result.improvedContent });
      setSuccessMessage('Document content updated. Regenerate the PDF manually if needed.');
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'Unable to update document.');
    }
  };

  const cardClass = 'rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]';

  return (
    <div className="space-y-5">
      <div className={cardClass}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[#0f172a]">AI Document Assistant</h3>
            <p className="mt-1 text-sm text-[#64748b]">Draft, improve, summarize, and review documents with user review required.</p>
            <p className="mt-2 max-w-3xl text-xs text-[#64748b]">AI Document Assistant helps draft, improve, and review documents, but it is not legal advice. Review important documents with a qualified professional.</p>
          </div>
          <div className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
            User review required
          </div>
        </div>
      </div>

      <div className={cardClass}>
        <div className="grid gap-4 xl:grid-cols-2">
          <SectionHeader title="AI Settings" subtitle="Choose the generation mode, document type, language, and tone" />
          <SectionHeader title="Source / Target" subtitle="Select a generated document or paste content manually" />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Mode">
            <select className="studio-input" value={mode} onChange={(event) => { setMode(event.target.value as AiMode); resetResult(); }}>
              {MODE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Document Type">
            <select className="studio-input" value={documentType} onChange={(event) => setDocumentType(event.target.value as DocumentType)}>
              {DOCUMENT_TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Language">
            <select className="studio-input" value={language} onChange={(event) => setLanguage(event.target.value as DocumentLanguage)}>
              {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
          <Field label="Tone">
            <select className="studio-input" value={tone} onChange={(event) => setTone(event.target.value as AiTone)}>
              {TONE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </Field>
        </div>

        <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <Field label="Document Source">
              <select className="studio-input" value={selectedDocumentId} onChange={(event) => setSelectedDocumentId(event.target.value)}>
                <option value="">Manual entry</option>
                {generatedDocuments.map((document) => <option key={document.id} value={document.id}>{document.title} ({document.type})</option>)}
              </select>
            </Field>
            <Field label="Document Title">
              <input className="studio-input" value={documentTitle} onChange={(event) => setDocumentTitle(event.target.value)} placeholder="Document title" />
            </Field>
            <Field label="Document Content">
              <textarea
                className="studio-textarea"
                rows={14}
                value={documentContent}
                onChange={(event) => setDocumentContent(event.target.value)}
                placeholder="Paste a document or select an existing generated document"
              />
            </Field>
          </div>

          <div className="space-y-4">
            <SectionHeader title="Context" subtitle="Selected project, company, person, and deal context are used to guide the AI." />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <Field label="Related Project">
                <select className="studio-input" value={selectedProjectId} onChange={(event) => setSelectedProjectId(event.target.value)}>
                  <option value="">None</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </Field>
              <Field label="Related Company">
                <select className="studio-input" value={selectedCompanyId} onChange={(event) => setSelectedCompanyId(event.target.value)}>
                  <option value="">None</option>
                  {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </Field>
              <Field label="Related Person">
                <select className="studio-input" value={selectedPersonId} onChange={(event) => setSelectedPersonId(event.target.value)}>
                  <option value="">None</option>
                  {people.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
                </select>
              </Field>
              <Field label="Related Deal">
                <select className="studio-input" value={selectedDealId} onChange={(event) => setSelectedDealId(event.target.value)}>
                  <option value="">None</option>
                  {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.servicePackage || deal.id}</option>)}
                </select>
              </Field>
            </div>
            <Field label="Custom Instructions">
              <textarea
                className="studio-textarea"
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
              className="w-full rounded-xl bg-[#0f172a] px-4 py-3 text-sm font-medium text-white hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? 'Analyzing...' : 'Analyze / Generate with AI'}
            </button>
            {error ? <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</div> : null}
            {successMessage ? <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">{successMessage}</div> : null}
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <ResultCard title="Summary" value={result.summary || 'No summary yet.'} />
        <div className={cardClass}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-[#0f172a]">Improved Content</h4>
              <p className="mt-1 text-xs text-[#64748b]">Edit this draft before saving or replacing the current document.</p>
            </div>
            {hasResultContent ? (
              <button type="button" onClick={() => void handleCopyImprovedContent()} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-xs font-medium text-[#334155] hover:bg-[#f8fafc]">
                Copy Improved Content
              </button>
            ) : null}
          </div>
          <textarea
            className="studio-textarea mt-4"
            rows={18}
            value={result.improvedContent}
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

      <div className={cardClass}>
        <div className="grid gap-4 md:grid-cols-2">
          <ListCard title="Next Actions" items={result.nextActions} emptyText="No next actions yet." />
          <div className="space-y-3">
            <button type="button" onClick={() => void handleSaveAsNewTemplate()} disabled={!hasResultContent} className="w-full rounded-xl bg-[#2563eb] px-4 py-3 text-sm font-medium text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60">
              Save as New Template
            </button>
            <button type="button" onClick={() => void handleSaveAsNewGeneratedDocument()} disabled={!hasResultContent} className="w-full rounded-xl border border-[#bfdbfe] bg-[#eff6ff] px-4 py-3 text-sm font-medium text-[#1d4ed8] hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-60">
              Save as New Generated Document
            </button>
            <button type="button" onClick={() => void handleReplaceCurrentDocumentContent()} disabled={!hasResultContent || !selectedDocumentId} className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm font-medium text-[#334155] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-60">
              Replace Current Document Content
            </button>
            <div className="rounded-2xl border border-dashed border-[#dbe3ef] bg-[#fafcff] p-4 text-xs leading-6 text-[#64748b]">
              AI output is for drafting and review only. Do not overwrite or send a document without checking the content, context, and formatting first.
            </div>
          </div>
        </div>
      </div>

      <style>{`.studio-input{width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;background:#fff;color:#0f172a;outline:none}.studio-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.studio-textarea{width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;background:#fff;color:#0f172a;outline:none;resize:vertical;min-height:96px}.studio-textarea:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}`}</style>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="block space-y-1">
    <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">{label}</span>
    {children}
  </label>
);

const SectionHeader: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <div>
    <h4 className="text-sm font-semibold text-[#0f172a]">{title}</h4>
    {subtitle ? <p className="mt-1 text-xs text-[#64748b]">{subtitle}</p> : null}
  </div>
);

const ResultCard: React.FC<{ title: string; value: string }> = ({ title, value }) => (
  <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
    <h4 className="text-sm font-semibold text-[#0f172a]">{title}</h4>
    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#334155]">{value}</p>
  </div>
);

const ListCard: React.FC<{ title: string; items: string[]; emptyText: string }> = ({ title, items, emptyText }) => (
  <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
    <h4 className="text-sm font-semibold text-[#0f172a]">{title}</h4>
    <div className="mt-3 space-y-2">
      {items.length > 0 ? items.map((item) => <div key={item} className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-sm text-[#334155]">{item}</div>) : <div className="rounded-2xl border border-dashed border-[#dbe3ef] bg-[#fafcff] px-3 py-2 text-sm text-[#64748b]">{emptyText}</div>}
    </div>
  </div>
);

export default AIDocumentAssistantPanel;