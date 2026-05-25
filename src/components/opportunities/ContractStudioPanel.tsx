import React, { useCallback, useEffect, useMemo, useState } from 'react';
import type {
  Company,
  Deal,
  DocumentBrandSettings,
  DocumentLanguage,
  DocumentStatus,
  GeneratedDocument,
  GeneratedDocumentInput,
  Person,
  Project,
} from '../../types/opportunities';
import ProfessionalDocumentView from './ProfessionalDocumentView';

type ContractTab = 'details' | 'parties' | 'scope' | 'terms' | 'preview' | 'export';

type ContractFormState = {
  title: string;
  language: DocumentLanguage;
  status: DocumentStatus;
  issueDate: string;
  dueDate: string;
  relatedProjectId: string;
  relatedCompanyId: string;
  relatedPersonId: string;
  relatedDealId: string;
  providerName: string;
  providerEmail: string;
  providerPhone: string;
  providerAddress: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  projectName: string;
  serviceDescription: string;
  deliverables: string;
  responsibilities: string;
  paymentTerms: string;
  revisionPolicy: string;
  timeline: string;
  ownershipTerms: string;
  cancellationTerms: string;
  confidentialityTerms: string;
  notes: string;
};

const defaultForm = (): ContractFormState => ({
  title: '',
  language: 'english',
  status: 'draft',
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  relatedProjectId: '',
  relatedCompanyId: '',
  relatedPersonId: '',
  relatedDealId: '',
  providerName: '',
  providerEmail: '',
  providerPhone: '',
  providerAddress: '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  projectName: '',
  serviceDescription: '',
  deliverables: '',
  responsibilities: '',
  paymentTerms: '',
  revisionPolicy: '',
  timeline: '',
  ownershipTerms: '',
  cancellationTerms: '',
  confidentialityTerms: '',
  notes: '',
});

const TABS: Array<{ id: ContractTab; label: string }> = [
  { id: 'details', label: 'Details' },
  { id: 'parties', label: 'Parties' },
  { id: 'scope', label: 'Scope' },
  { id: 'terms', label: 'Terms' },
  { id: 'preview', label: 'Preview' },
  { id: 'export', label: 'Export' },
];

const inputClass = 'h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400';
const textareaClass = 'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 resize-y min-h-[96px]';

const ContractStudioPanel: React.FC<{
  documentBrandSettings: DocumentBrandSettings[];
  generatedDocuments: GeneratedDocument[];
  projects: Project[];
  companies: Company[];
  people: Person[];
  deals: Deal[];
  onAddGeneratedDocument: (input: GeneratedDocumentInput) => Promise<GeneratedDocument>;
  onUpdateGeneratedDocument: (id: string, input: Partial<GeneratedDocumentInput>) => Promise<GeneratedDocument>;
  onDeleteGeneratedDocument: (id: string) => Promise<void>;
}> = ({
  documentBrandSettings,
  generatedDocuments,
  projects,
  companies,
  people,
  deals,
  onAddGeneratedDocument,
  onUpdateGeneratedDocument,
  onDeleteGeneratedDocument,
}) => {
  const [tab, setTab] = useState<ContractTab>('details');
  const [form, setForm] = useState<ContractFormState>(defaultForm);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [storedPdfPath, setStoredPdfPath] = useState<string | null>(null);

  const brand = documentBrandSettings[0] ?? null;
  const contractDocuments = useMemo(() => generatedDocuments.filter((document) => document.type === 'contract'), [generatedDocuments]);
  const selectedProject = projects.find((project) => project.id === form.relatedProjectId) ?? null;
  const selectedCompany = companies.find((company) => company.id === form.relatedCompanyId) ?? null;
  const selectedPerson = people.find((person) => person.id === form.relatedPersonId) ?? null;
  const selectedDeal = deals.find((deal) => deal.id === form.relatedDealId) ?? null;
  const activeDoc = useMemo(() => contractDocuments.find((document) => document.id === activeDocumentId) ?? null, [contractDocuments, activeDocumentId]);
  const savedDocumentId = activeDocumentId || '';

  const updateField = (field: keyof ContractFormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setForm(defaultForm());
    setActiveDocumentId(null);
    setStoredPdfPath(null);
    setMessage('');
    setError('');
  };

  const buildPreviewDocument = (): GeneratedDocumentInput => ({
    title: form.title || 'Untitled Contract',
    type: 'contract',
    status: form.status,
    language: form.language,
    templateId: undefined,
    relatedProjectId: form.relatedProjectId || undefined,
    relatedCompanyId: form.relatedCompanyId || undefined,
    relatedPersonId: form.relatedPersonId || undefined,
    relatedDealId: form.relatedDealId || undefined,
    content: JSON.stringify(form),
    variablesJson: JSON.stringify({}),
    amount: undefined,
    currency: brand?.defaultCurrency || 'MYR',
    issueDate: form.issueDate || undefined,
    dueDate: form.dueDate || undefined,
    notes: '',
  });

  const previewDocument = buildPreviewDocument();

  const saveDocument = async (status: DocumentStatus) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const input = buildPreviewDocument();
      input.status = status;
      if (activeDocumentId) {
        await onUpdateGeneratedDocument(activeDocumentId, input);
        setMessage(`Contract "${form.title}" updated.`);
      } else {
        const saved = await onAddGeneratedDocument(input);
        setActiveDocumentId(saved.id);
        setMessage(`Contract "${form.title}" saved.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save contract.');
    } finally {
      setSaving(false);
    }
  };

  const loadDocument = (document: GeneratedDocument) => {
    try {
      const content = JSON.parse(document.content || '{}');
      setForm((current) => ({ ...current, ...content, title: document.title || current.title, language: document.language || current.language, status: document.status || current.status }));
      setActiveDocumentId(document.id);
      setStoredPdfPath(document.pdfStoragePath || null);
      setTab('details');
      setMessage('');
      setError('');
    } catch {
      setError('Failed to load contract content.');
    }
  };

  const generateAndStorePdf = async () => {
    setGenerating(true);
    setError('');
    setMessage('');
    try {
      let documentId = activeDocumentId;
      if (!documentId) {
        const saved = await onAddGeneratedDocument(buildPreviewDocument());
        documentId = saved.id;
        setActiveDocumentId(documentId);
      }
      const popup = window.open('about:blank', '_blank');
      const response = await fetch(`/api/documents?action=generate-pdf&sourceType=generated_document&documentId=${encodeURIComponent(documentId)}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'PDF generation failed.');
      }
      setStoredPdfPath(result.storagePath || result.signedUrl || null);
      if (result.storagePath) {
        await onUpdateGeneratedDocument(documentId, { pdfStoragePath: result.storagePath });
      }
      setMessage('PDF generated and stored in private Supabase Storage.');

      if (popup && result.signedUrl) {
        popup.location.href = String(result.signedUrl);
        popup.focus();
      } else if (popup) {
        popup.close();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'PDF generation failed.');
    } finally {
      setGenerating(false);
    }
  };

  const openStoredPdf = async (documentId: string) => {
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await fetch(`/api/documents?action=signed-url&sourceType=generated_document&documentId=${encodeURIComponent(documentId)}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success || !result?.signedUrl) {
        throw new Error(result?.error || 'No stored PDF found.');
      }
      if (popup) {
        popup.location.href = String(result.signedUrl);
        popup.focus();
        return;
      }
      window.open(String(result.signedUrl), '_blank', 'noopener,noreferrer');
    } catch (err) {
      if (popup) popup.close();
      setError(err instanceof Error ? err.message : 'Failed to open PDF.');
    }
  };

  const savedDocumentList = contractDocuments.slice(0, 12);

  const renderTabButton = (item: { id: ContractTab; label: string }) => (
    <button
      key={item.id}
      type="button"
      onClick={() => setTab(item.id)}
      className={`relative px-3 py-2.5 text-sm transition-colors border-b-2 ${tab === item.id ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
    >
      {item.label}
    </button>
  );

  return (
    <div className="space-y-7">
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Contract Studio</h3>
            <p className="mt-1 text-sm text-neutral-500">Draft, preview, and store structured contract documents.</p>
            <p className="mt-2 text-xs text-neutral-500">This tool helps draft and organize contracts. It is not legal advice.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetForm} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              New Contract
            </button>
            <button type="button" onClick={() => void saveDocument('draft')} disabled={saving} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60">
              Save Draft
            </button>
            <button type="button" onClick={() => void saveDocument('ready')} disabled={saving} className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
              Save Contract
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-3">
        {TABS.map(renderTabButton)}
      </div>

      {tab === 'details' ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <SectionHeader title="Contract Details" subtitle="Title, language, status, and related records" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Title"><input className={inputClass} value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Master services agreement" /></Field>
              <Field label="Language">
                <select className={inputClass} value={form.language} onChange={(event) => updateField('language', event.target.value as DocumentLanguage)}>
                  <option value="english">English</option>
                  <option value="french">French</option>
                  <option value="arabic">Arabic</option>
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClass} value={form.status} onChange={(event) => updateField('status', event.target.value as ContractFormState['status'])}>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                </select>
              </Field>
              <Field label="Issue Date"><input type="date" className={inputClass} value={form.issueDate} onChange={(event) => updateField('issueDate', event.target.value)} /></Field>
              <Field label="Due Date"><input type="date" className={inputClass} value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} /></Field>
              <Field label="Related Project"><select className={inputClass} value={form.relatedProjectId} onChange={(event) => updateField('relatedProjectId', event.target.value)}><option value="">None</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
              <Field label="Related Company"><select className={inputClass} value={form.relatedCompanyId} onChange={(event) => updateField('relatedCompanyId', event.target.value)}><option value="">None</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field>
              <Field label="Related Person"><select className={inputClass} value={form.relatedPersonId} onChange={(event) => updateField('relatedPersonId', event.target.value)}><option value="">None</option>{people.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</select></Field>
              <Field label="Related Deal"><select className={inputClass} value={form.relatedDealId} onChange={(event) => updateField('relatedDealId', event.target.value)}><option value="">None</option>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.servicePackage || deal.id}</option>)}</select></Field>
            </div>
          </div>

          <aside className="space-y-4">
            <SummaryCard title="Brand context">
              <SummaryLine label="Brand" value={brand?.brandName || 'Not set'} />
              <SummaryLine label="Owner" value={brand?.ownerName || 'Not set'} />
              <SummaryLine label="Contact" value={brand?.email || brand?.phone || 'Not set'} />
              <SummaryLine label="PDF" value={storedPdfPath || activeDoc?.pdfStoragePath ? 'Stored' : 'Not stored yet'} />
            </SummaryCard>
            <SummaryCard title="Related records">
              <SummaryLine label="Project" value={selectedProject?.name || 'None'} />
              <SummaryLine label="Company" value={selectedCompany?.name || 'None'} />
              <SummaryLine label="Person" value={selectedPerson?.fullName || 'None'} />
              <SummaryLine label="Deal" value={selectedDeal?.servicePackage || selectedDeal?.id || 'None'} />
            </SummaryCard>
          </aside>
        </div>
      ) : null}

      {tab === 'parties' ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <SectionHeader title="Provider" subtitle="Your company or practitioner details" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Provider Name"><input className={inputClass} value={form.providerName} onChange={(event) => updateField('providerName', event.target.value)} /></Field>
              <Field label="Provider Email"><input className={inputClass} value={form.providerEmail} onChange={(event) => updateField('providerEmail', event.target.value)} /></Field>
              <Field label="Provider Phone"><input className={inputClass} value={form.providerPhone} onChange={(event) => updateField('providerPhone', event.target.value)} /></Field>
              <Field label="Provider Address"><textarea className={textareaClass} rows={4} value={form.providerAddress} onChange={(event) => updateField('providerAddress', event.target.value)} /></Field>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <SectionHeader title="Client" subtitle="Counterparty contact details" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Client Name"><input className={inputClass} value={form.clientName} onChange={(event) => updateField('clientName', event.target.value)} /></Field>
              <Field label="Client Email"><input className={inputClass} value={form.clientEmail} onChange={(event) => updateField('clientEmail', event.target.value)} /></Field>
              <Field label="Client Phone"><input className={inputClass} value={form.clientPhone} onChange={(event) => updateField('clientPhone', event.target.value)} /></Field>
              <Field label="Client Address"><textarea className={textareaClass} rows={4} value={form.clientAddress} onChange={(event) => updateField('clientAddress', event.target.value)} /></Field>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'scope' ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <SectionHeader title="Scope" subtitle="Project name, service description, deliverables, and responsibilities" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Project Name"><input className={inputClass} value={form.projectName} onChange={(event) => updateField('projectName', event.target.value)} /></Field>
            <Field label="Service Description"><textarea className={textareaClass} rows={3} value={form.serviceDescription} onChange={(event) => updateField('serviceDescription', event.target.value)} /></Field>
            <Field label="Deliverables"><textarea className={textareaClass} rows={8} value={form.deliverables} onChange={(event) => updateField('deliverables', event.target.value)} placeholder="One deliverable per line" /></Field>
            <Field label="Responsibilities"><textarea className={textareaClass} rows={8} value={form.responsibilities} onChange={(event) => updateField('responsibilities', event.target.value)} placeholder="One responsibility per line" /></Field>
          </div>
        </div>
      ) : null}

      {tab === 'terms' ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <SectionHeader title="Terms" subtitle="Commercial and legal clauses to structure the contract" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Payment Terms"><textarea className={textareaClass} rows={4} value={form.paymentTerms} onChange={(event) => updateField('paymentTerms', event.target.value)} /></Field>
            <Field label="Revision Policy"><textarea className={textareaClass} rows={4} value={form.revisionPolicy} onChange={(event) => updateField('revisionPolicy', event.target.value)} /></Field>
            <Field label="Timeline"><textarea className={textareaClass} rows={4} value={form.timeline} onChange={(event) => updateField('timeline', event.target.value)} /></Field>
            <Field label="Ownership / Usage Rights"><textarea className={textareaClass} rows={4} value={form.ownershipTerms} onChange={(event) => updateField('ownershipTerms', event.target.value)} /></Field>
            <Field label="Cancellation Terms"><textarea className={textareaClass} rows={4} value={form.cancellationTerms} onChange={(event) => updateField('cancellationTerms', event.target.value)} /></Field>
            <Field label="Confidentiality Terms"><textarea className={textareaClass} rows={4} value={form.confidentialityTerms} onChange={(event) => updateField('confidentialityTerms', event.target.value)} /></Field>
            <Field label="Notes"><textarea className={textareaClass} rows={4} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} /></Field>
          </div>
        </div>
      ) : null}

      {tab === 'preview' ? (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeader title="Preview" subtitle="Professional contract layout with brand identity" />
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${storedPdfPath || activeDoc?.pdfStoragePath ? 'border-neutral-200 bg-neutral-50 text-neutral-700' : 'border-neutral-200 bg-neutral-50 text-neutral-500'}`}>
                {storedPdfPath || activeDoc?.pdfStoragePath ? 'PDF Stored' : 'Live Draft'}
              </span>
            </div>
            <div className="mt-4 overflow-auto rounded-md border border-neutral-200 bg-neutral-50 p-4">
              <ProfessionalDocumentView document={previewDocument} brandSettings={brand} />
            </div>
          </div>

          <SummaryCard title="Preview summary">
            <SummaryLine label="Title" value={form.title || 'Untitled'} />
            <SummaryLine label="Status" value={form.status} />
            <SummaryLine label="Language" value={form.language} />
            <SummaryLine label="Issue date" value={form.issueDate || 'Not set'} />
            <SummaryLine label="Due date" value={form.dueDate || 'Not set'} />
            <SummaryLine label="Sections" value="Parties, scope, terms, signatures" />
          </SummaryCard>
        </div>
      ) : null}

      {tab === 'export' ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <SectionHeader title="Export" subtitle="Save as a generated document, store a private PDF, or open the signed file" />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void saveDocument('ready')} disabled={saving} className="rounded-md bg-neutral-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
                Save as Generated Document
              </button>
              <button type="button" onClick={() => void generateAndStorePdf()} disabled={generating || saving} className="rounded-md border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60">
                {generating ? 'Generating PDF...' : 'Generate & Store PDF'}
              </button>
              {(storedPdfPath || activeDoc?.pdfStoragePath) ? (
                <>
                  <button type="button" onClick={() => void openStoredPdf(savedDocumentId || activeDoc?.id || '')} className="rounded-md border border-neutral-200 bg-white px-5 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                    Open Stored PDF
                  </button>
                  <span className="rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700">PDF Stored</span>
                </>
              ) : null}
            </div>

            {message ? <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">{message}</div> : null}
            {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}

            <div className="mt-6 grid gap-3 md:grid-cols-2">
              <SummaryCard title="Export summary">
                <SummaryLine label="Title" value={form.title || 'Untitled'} />
                <SummaryLine label="Related company" value={selectedCompany?.name || 'None'} />
                <SummaryLine label="Related project" value={selectedProject?.name || 'None'} />
                <SummaryLine label="Related deal" value={selectedDeal?.servicePackage || selectedDeal?.id || 'None'} />
              </SummaryCard>
              <SummaryCard title="Document archive">
                <SummaryLine label="Saved docs" value={`${contractDocuments.length} contract${contractDocuments.length === 1 ? '' : 's'}`} />
                <SummaryLine label="Archive" value="Generated Documents" />
                <SummaryLine label="Storage" value="Private Supabase Storage" />
                <SummaryLine label="Source" value="/api/documents?action=generate-pdf" />
              </SummaryCard>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <SectionHeader title="Saved contracts" subtitle="Load an existing contract from Generated Documents" />
            <div className="mt-4 space-y-3">
              {savedDocumentList.length === 0 ? (
                <EmptyState text="No contract documents yet. Save the first contract to add it to the archive." />
              ) : savedDocumentList.map((document) => (
                <div key={document.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{document.title}</div>
                      <div className="mt-1 text-xs text-neutral-500">{document.relatedProjectName || document.relatedCompanyName || document.relatedPersonName || document.relatedDealName || 'No relationship set'}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-neutral-500">
                        <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-neutral-600">{document.status}</span>
                        {document.pdfStoragePath ? <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-neutral-700">PDF Stored</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => loadDocument(document)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Edit</button>
                      {document.pdfStoragePath ? <button type="button" onClick={() => void openStoredPdf(document.id)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Open PDF</button> : null}
                      <button type="button" onClick={() => void onDeleteGeneratedDocument(document.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
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

const SummaryCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
    <div className="text-sm font-semibold text-neutral-900">{title}</div>
    <div className="mt-3 space-y-2">{children}</div>
  </div>
);

const SummaryLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 text-sm text-neutral-600">
    <span>{label}</span>
    <span className="max-w-[60%] truncate font-medium text-neutral-900">{value}</span>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-5 text-sm text-neutral-500">{text}</div>
);

export default ContractStudioPanel;
