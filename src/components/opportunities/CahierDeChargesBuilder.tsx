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

type CahierTab = 'context' | 'requirements' | 'deliverables' | 'timeline' | 'preview' | 'export';

type CahierFormState = {
  title: string;
  language: DocumentLanguage;
  status: DocumentStatus;
  relatedProjectId: string;
  relatedCompanyId: string;
  relatedPersonId: string;
  relatedDealId: string;
  startDate: string;
  dueDate: string;
  clientContext: string;
  projectBackground: string;
  problemStatement: string;
  objectives: string;
  functionalRequirements: string;
  nonFunctionalRequirements: string;
  uxUiRequirements: string;
  constraints: string;
  deliverables: string;
  responsibilities: string;
  acceptanceCriteria: string;
  successMetrics: string;
  milestones: string;
  risks: string;
  notes: string;
};

const defaultForm = (): CahierFormState => ({
  title: '',
  language: 'english',
  status: 'draft',
  relatedProjectId: '',
  relatedCompanyId: '',
  relatedPersonId: '',
  relatedDealId: '',
  startDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  clientContext: '',
  projectBackground: '',
  problemStatement: '',
  objectives: '',
  functionalRequirements: '',
  nonFunctionalRequirements: '',
  uxUiRequirements: '',
  constraints: '',
  deliverables: '',
  responsibilities: '',
  acceptanceCriteria: '',
  successMetrics: '',
  milestones: '',
  risks: '',
  notes: '',
});

const TABS: Array<{ id: CahierTab; label: string }> = [
  { id: 'context', label: 'Context' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'preview', label: 'Preview' },
  { id: 'export', label: 'Export' },
];

const inputClass = 'h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400';
const textareaClass = 'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 resize-y min-h-[96px]';

const CahierDeChargesBuilder: React.FC<{
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
  const [tab, setTab] = useState<CahierTab>('context');
  const [form, setForm] = useState<CahierFormState>(defaultForm);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [storedPdfPath, setStoredPdfPath] = useState<string | null>(null);

  const brand = documentBrandSettings[0] ?? null;
  const cahierDocuments = useMemo(() => generatedDocuments.filter((document) => document.type === 'cahier_de_charges'), [generatedDocuments]);
  const selectedProject = projects.find((project) => project.id === form.relatedProjectId) ?? null;
  const selectedCompany = companies.find((company) => company.id === form.relatedCompanyId) ?? null;
  const selectedPerson = people.find((person) => person.id === form.relatedPersonId) ?? null;
  const selectedDeal = deals.find((deal) => deal.id === form.relatedDealId) ?? null;
  const activeDoc = useMemo(() => cahierDocuments.find((document) => document.id === activeDocumentId) ?? null, [cahierDocuments, activeDocumentId]);
  const savedDocumentId = activeDocumentId || '';

  const updateField = (field: keyof CahierFormState, value: string) => setForm((current) => ({ ...current, [field]: value }));

  const resetForm = () => {
    setForm(defaultForm());
    setActiveDocumentId(null);
    setStoredPdfPath(null);
    setMessage('');
    setError('');
  };

  const buildPreviewDocument = (): GeneratedDocumentInput => ({
    title: form.title || 'Untitled Cahier de Charges',
    type: 'cahier_de_charges',
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
    issueDate: undefined,
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
        setMessage(`Cahier de charges "${form.title}" updated.`);
      } else {
        const saved = await onAddGeneratedDocument(input);
        setActiveDocumentId(saved.id);
        setMessage(`Cahier de charges "${form.title}" saved.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save cahier de charges.');
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
      setTab('context');
      setMessage('');
      setError('');
    } catch {
      setError('Failed to load cahier content.');
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

  const savedDocumentList = cahierDocuments.slice(0, 12);

  const renderTabButton = (item: { id: CahierTab; label: string }) => (
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
    <div className="space-y-5">
      <div className="rounded-xl border border-neutral-200 bg-white p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Cahier de Charges Builder</h3>
            <p className="mt-1 text-sm text-neutral-500">Structure project requirements, deliverables, and timeline into a professional document.</p>
            <p className="mt-2 text-xs text-neutral-500">This tool helps structure project requirements. Review details carefully before sending.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetForm} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              New Cahier
            </button>
            <button type="button" onClick={() => void saveDocument('draft')} disabled={saving} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60">
              Save Draft
            </button>
            <button type="button" onClick={() => void saveDocument('ready')} disabled={saving} className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
              Save Cahier
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 -mb-px border-b border-neutral-200 pb-0">
        {TABS.map(renderTabButton)}
      </div>

      {tab === 'context' ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <SectionHeader title="Project Context" subtitle="Set the framing, audience, and core challenge" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Title"><input className={inputClass} value={form.title} onChange={(event) => updateField('title', event.target.value)} /></Field>
              <Field label="Language">
                <select className={inputClass} value={form.language} onChange={(event) => updateField('language', event.target.value as DocumentLanguage)}>
                  <option value="english">English</option>
                  <option value="french">French</option>
                  <option value="arabic">Arabic</option>
                </select>
              </Field>
              <Field label="Status">
                <select className={inputClass} value={form.status} onChange={(event) => updateField('status', event.target.value as CahierFormState['status'])}>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                </select>
              </Field>
              <Field label="Related Project"><select className={inputClass} value={form.relatedProjectId} onChange={(event) => updateField('relatedProjectId', event.target.value)}><option value="">None</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
              <Field label="Related Company"><select className={inputClass} value={form.relatedCompanyId} onChange={(event) => updateField('relatedCompanyId', event.target.value)}><option value="">None</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Client Context"><textarea className={textareaClass} rows={4} value={form.clientContext} onChange={(event) => updateField('clientContext', event.target.value)} /></Field>
              <Field label="Project Background"><textarea className={textareaClass} rows={4} value={form.projectBackground} onChange={(event) => updateField('projectBackground', event.target.value)} /></Field>
              <Field label="Problem Statement"><textarea className={textareaClass} rows={4} value={form.problemStatement} onChange={(event) => updateField('problemStatement', event.target.value)} /></Field>
            </div>
          </div>

          <aside className="space-y-4">
            <SummaryCard title="Brand context">
              <SummaryLine label="Brand" value={brand?.brandName || 'Not set'} />
              <SummaryLine label="Owner" value={brand?.ownerName || 'Not set'} />
              <SummaryLine label="Signature" value={brand?.signatureName || 'Not set'} />
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

      {tab === 'requirements' ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <SectionHeader title="Requirements" subtitle="Define objectives, functional, non-functional, and UX/UI requirements" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Objectives"><textarea className={textareaClass} rows={8} value={form.objectives} onChange={(event) => updateField('objectives', event.target.value)} placeholder="One objective per line" /></Field>
            <Field label="Functional Requirements"><textarea className={textareaClass} rows={8} value={form.functionalRequirements} onChange={(event) => updateField('functionalRequirements', event.target.value)} placeholder="One requirement per line" /></Field>
            <Field label="Non-Functional Requirements"><textarea className={textareaClass} rows={8} value={form.nonFunctionalRequirements} onChange={(event) => updateField('nonFunctionalRequirements', event.target.value)} placeholder="One requirement per line" /></Field>
            <Field label="UX/UI Requirements"><textarea className={textareaClass} rows={8} value={form.uxUiRequirements} onChange={(event) => updateField('uxUiRequirements', event.target.value)} placeholder="One requirement per line" /></Field>
            <Field label="Constraints"><textarea className={textareaClass} rows={6} value={form.constraints} onChange={(event) => updateField('constraints', event.target.value)} /></Field>
            <Field label="Notes"><textarea className={textareaClass} rows={6} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} /></Field>
          </div>
        </div>
      ) : null}

      {tab === 'deliverables' ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <SectionHeader title="Deliverables" subtitle="List deliverables, responsibilities, acceptance criteria, and success metrics" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Deliverables"><textarea className={textareaClass} rows={8} value={form.deliverables} onChange={(event) => updateField('deliverables', event.target.value)} placeholder="One deliverable per line" /></Field>
            <Field label="Responsibilities"><textarea className={textareaClass} rows={8} value={form.responsibilities} onChange={(event) => updateField('responsibilities', event.target.value)} placeholder="One responsibility per line" /></Field>
            <Field label="Acceptance Criteria"><textarea className={textareaClass} rows={8} value={form.acceptanceCriteria} onChange={(event) => updateField('acceptanceCriteria', event.target.value)} placeholder="One criterion per line" /></Field>
            <Field label="Success Metrics"><textarea className={textareaClass} rows={8} value={form.successMetrics} onChange={(event) => updateField('successMetrics', event.target.value)} placeholder="One metric per line" /></Field>
          </div>
        </div>
      ) : null}

      {tab === 'timeline' ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-5">
          <SectionHeader title="Timeline" subtitle="Frame the delivery plan, milestones, risks, and dates" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Start Date"><input type="date" className={inputClass} value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} /></Field>
            <Field label="Due Date"><input type="date" className={inputClass} value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} /></Field>
            <Field label="Milestones"><textarea className={textareaClass} rows={8} value={form.milestones} onChange={(event) => updateField('milestones', event.target.value)} placeholder="One milestone per line" /></Field>
            <Field label="Risks"><textarea className={textareaClass} rows={8} value={form.risks} onChange={(event) => updateField('risks', event.target.value)} placeholder="One risk per line" /></Field>
          </div>
        </div>
      ) : null}

      {tab === 'preview' ? (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeader title="Preview" subtitle="Professional document layout for project requirements" />
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
            <SummaryLine label="Start date" value={form.startDate || 'Not set'} />
            <SummaryLine label="Due date" value={form.dueDate || 'Not set'} />
            <SummaryLine label="Sections" value="Context, requirements, deliverables, timeline, signatures" />
          </SummaryCard>
        </div>
      ) : null}

      {tab === 'export' ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <SectionHeader title="Export" subtitle="Save, generate a stored PDF, and open the private link when ready" />
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
                <SummaryLine label="Archive" value="Generated Documents" />
              </SummaryCard>
              <SummaryCard title="Document archive">
                <SummaryLine label="Saved docs" value={`${cahierDocuments.length} cahier${cahierDocuments.length === 1 ? '' : 's'}`} />
                <SummaryLine label="Storage" value="Private Supabase Storage" />
                <SummaryLine label="Source" value="/api/documents?action=generate-pdf" />
                <SummaryLine label="Related records" value={selectedDeal?.servicePackage || selectedPerson?.fullName || 'Optional'} />
              </SummaryCard>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <SectionHeader title="Saved cahiers" subtitle="Load an existing cahier from Generated Documents" />
            <div className="mt-4 space-y-3">
              {savedDocumentList.length === 0 ? (
                <EmptyState text="No cahier documents yet. Save the first cahier to add it to the archive." />
              ) : savedDocumentList.map((document) => (
                <div key={document.id} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-neutral-900">{document.title}</div>
                      <div className="mt-1 text-xs text-neutral-500">{document.relatedProjectName || document.relatedCompanyName || 'No relationship set'}</div>
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

export default CahierDeChargesBuilder;
