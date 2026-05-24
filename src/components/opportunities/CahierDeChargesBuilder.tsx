import React, { useEffect, useMemo, useState } from 'react';
import type { Company, Deal, DocumentBrandSettings, DocumentLanguage, DocumentStatus, GeneratedDocument, GeneratedDocumentInput, Person, Project } from '../../types/opportunities';
import ProfessionalDocumentView from './ProfessionalDocumentView';

type CahierTab = 'context' | 'requirements' | 'deliverables' | 'timeline' | 'preview' | 'export';

type CahierFormState = {
  title: string;
  language: DocumentLanguage;
  status: Extract<DocumentStatus, 'draft' | 'ready'>;
  relatedProjectId: string;
  relatedCompanyId: string;
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
  startDate: string;
  dueDate: string;
  milestones: string;
  risks: string;
  notes: string;
};

type CahierDeChargesBuilderProps = {
  documentBrandSettings: DocumentBrandSettings[];
  generatedDocuments: GeneratedDocument[];
  projects: Project[];
  companies: Company[];
  people: Person[];
  deals: Deal[];
  onAddGeneratedDocument: (input: GeneratedDocumentInput) => Promise<GeneratedDocument>;
  onUpdateGeneratedDocument: (id: string, input: Partial<GeneratedDocumentInput>) => Promise<GeneratedDocument>;
  onDeleteGeneratedDocument: (id: string) => Promise<void>;
};

const TABS: Array<{ id: CahierTab; label: string }> = [
  { id: 'context', label: 'Context' },
  { id: 'requirements', label: 'Requirements' },
  { id: 'deliverables', label: 'Deliverables' },
  { id: 'timeline', label: 'Timeline' },
  { id: 'preview', label: 'Preview' },
  { id: 'export', label: 'Export' },
];

const STORAGE_SOURCE = 'generated_document';

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

const safeJson = (value?: string) => {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const listLines = (value: string) => value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);

const bulletBlock = (label: string, value: string) => {
  const lines = listLines(value);
  if (lines.length === 0) return `- ${label}: Not provided`;
  return lines.map((line) => `- ${line}`).join('\n');
};

const valueLine = (label: string, value?: string) => `${label}: ${value?.trim() || 'Not provided'}`;

const emptyForm = (brand?: DocumentBrandSettings | null): CahierFormState => ({
  title: 'New Cahier de Charges',
  language: 'french',
  status: 'draft',
  relatedProjectId: '',
  relatedCompanyId: '',
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
  startDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  milestones: '',
  risks: '',
  notes: brand?.legalNotes || '',
});

const buildCahierContent = (form: CahierFormState, brand?: DocumentBrandSettings | null, project?: Project | null, company?: Company | null) => {
  const brandSignature = brand?.signatureName?.trim() || brand?.ownerName?.trim() || brand?.brandName?.trim() || 'Authorized Signatory';

  return [
    '# Project Context',
    valueLine('Title', form.title),
    valueLine('Client Context', form.clientContext),
    valueLine('Project Background', form.projectBackground),
    valueLine('Problem Statement', form.problemStatement),
    '',
    '# Objectives',
    bulletBlock('Objectives', form.objectives),
    '',
    '# Scope',
    valueLine('Project', form.relatedProjectId ? project?.name : 'Not provided'),
    valueLine('Company', form.relatedCompanyId ? company?.name : 'Not provided'),
    valueLine('Client Context', form.clientContext),
    '',
    '# Functional Requirements',
    bulletBlock('Functional Requirements', form.functionalRequirements),
    '',
    '# Non-Functional Requirements',
    bulletBlock('Non-Functional Requirements', form.nonFunctionalRequirements),
    '',
    '# UX/UI Requirements',
    bulletBlock('UX/UI Requirements', form.uxUiRequirements),
    '',
    '# Deliverables',
    bulletBlock('Deliverables', form.deliverables),
    '',
    '# Constraints',
    form.constraints.trim() || 'Not provided',
    '',
    '# Timeline',
    valueLine('Start Date', form.startDate),
    valueLine('Due Date', form.dueDate),
    valueLine('Milestones', form.milestones),
    valueLine('Risks', form.risks),
    '',
    '# Acceptance Criteria',
    bulletBlock('Acceptance Criteria', form.acceptanceCriteria),
    '',
    '# Responsibilities',
    bulletBlock('Responsibilities', form.responsibilities),
    '',
    '# Risks',
    form.risks.trim() || 'Not provided',
    '',
    '# Signatures',
    `Provider: ${brandSignature}`,
    `Client: ${company?.name || 'Client representative'}`,
    form.notes.trim() ? ['', '# Notes', form.notes.trim()] : [],
  ]
    .flat()
    .filter((line) => line !== undefined)
    .join('\n');
};

const buildVariablesJson = (form: CahierFormState) => JSON.stringify(
  {
    context: {
      title: form.title,
      language: form.language,
      status: form.status,
      relatedProjectId: form.relatedProjectId,
      relatedCompanyId: form.relatedCompanyId,
      clientContext: form.clientContext,
      projectBackground: form.projectBackground,
      problemStatement: form.problemStatement,
    },
    requirements: {
      objectives: form.objectives,
      functionalRequirements: form.functionalRequirements,
      nonFunctionalRequirements: form.nonFunctionalRequirements,
      uxUiRequirements: form.uxUiRequirements,
      constraints: form.constraints,
    },
    deliverables: {
      deliverables: form.deliverables,
      responsibilities: form.responsibilities,
      acceptanceCriteria: form.acceptanceCriteria,
      successMetrics: form.successMetrics,
    },
    timeline: {
      startDate: form.startDate,
      dueDate: form.dueDate,
      milestones: form.milestones,
      risks: form.risks,
      notes: form.notes,
    },
  },
  null,
  2,
);

const buildPreviewDocument = (
  form: CahierFormState,
  brand: DocumentBrandSettings | null,
  project?: Project | null,
  company?: Company | null,
  pdfStoragePath?: string | null,
): GeneratedDocument => ({
  id: 'cahier-preview',
  title: form.title,
  type: 'cahier_de_charges',
  status: form.status,
  language: form.language,
  relatedProjectId: form.relatedProjectId || undefined,
  relatedProjectName: project?.name,
  relatedCompanyId: form.relatedCompanyId || undefined,
  relatedCompanyName: company?.name,
  content: buildCahierContent(form, brand, project, company),
  variablesJson: buildVariablesJson(form),
  issueDate: form.startDate || undefined,
  dueDate: form.dueDate || undefined,
  pdfStoragePath: pdfStoragePath || undefined,
  notes: form.notes.trim() || undefined,
});

const parseDocumentForm = (document: GeneratedDocument, brand?: DocumentBrandSettings | null): CahierFormState => {
  const parsed = safeJson(document.variablesJson) as any;
  const context = parsed.context || {};
  const requirements = parsed.requirements || {};
  const deliverables = parsed.deliverables || {};
  const timeline = parsed.timeline || {};

  return {
    title: context.title || document.title || 'New Cahier de Charges',
    language: context.language || document.language || 'french',
    status: context.status || document.status || 'draft',
    relatedProjectId: context.relatedProjectId || document.relatedProjectId || '',
    relatedCompanyId: context.relatedCompanyId || document.relatedCompanyId || '',
    clientContext: context.clientContext || '',
    projectBackground: context.projectBackground || '',
    problemStatement: context.problemStatement || '',
    objectives: requirements.objectives || '',
    functionalRequirements: requirements.functionalRequirements || '',
    nonFunctionalRequirements: requirements.nonFunctionalRequirements || '',
    uxUiRequirements: requirements.uxUiRequirements || '',
    constraints: requirements.constraints || '',
    deliverables: deliverables.deliverables || '',
    responsibilities: deliverables.responsibilities || '',
    acceptanceCriteria: deliverables.acceptanceCriteria || '',
    successMetrics: deliverables.successMetrics || '',
    startDate: toDateInput(timeline.startDate || document.issueDate),
    dueDate: toDateInput(timeline.dueDate || document.dueDate),
    milestones: timeline.milestones || '',
    risks: timeline.risks || '',
    notes: timeline.notes || document.notes || brand?.legalNotes || '',
  };
};

const CahierDeChargesBuilder: React.FC<CahierDeChargesBuilderProps> = ({
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
  const brand = documentBrandSettings[0] ?? null;
  const [tab, setTab] = useState<CahierTab>('context');
  const [form, setForm] = useState<CahierFormState>(() => emptyForm(brand));
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [storedPdfPath, setStoredPdfPath] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const cahierDocuments = useMemo(
    () => [...generatedDocuments].filter((document) => document.type === 'cahier_de_charges').sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()),
    [generatedDocuments],
  );
  const activeDocument = useMemo(() => cahierDocuments.find((document) => document.id === savedDocumentId) ?? null, [cahierDocuments, savedDocumentId]);
  const selectedProject = useMemo(() => projects.find((project) => project.id === form.relatedProjectId) ?? null, [projects, form.relatedProjectId]);
  const selectedCompany = useMemo(() => companies.find((company) => company.id === form.relatedCompanyId) ?? null, [companies, form.relatedCompanyId]);
  const selectedDeal = useMemo(() => deals.find((deal) => deal.id === form.relatedCompanyId) ?? null, [deals, form.relatedCompanyId]);
  const selectedPerson = useMemo(() => people.find((person) => person.id === form.relatedCompanyId) ?? null, [people, form.relatedCompanyId]);

  const previewDocument = useMemo(
    () => buildPreviewDocument(form, brand, selectedProject, selectedCompany, storedPdfPath || activeDocument?.pdfStoragePath || null),
    [activeDocument?.pdfStoragePath, brand, form, selectedCompany, selectedProject, storedPdfPath],
  );

  useEffect(() => {
    if (!savedDocumentId) return;
    const document = cahierDocuments.find((item) => item.id === savedDocumentId) ?? null;
    if (!document) {
      setSavedDocumentId(null);
      setStoredPdfPath(null);
      return;
    }
    setStoredPdfPath(document.pdfStoragePath || null);
  }, [cahierDocuments, savedDocumentId]);

  const updateField = (field: keyof CahierFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  const resetForm = () => {
    setForm(emptyForm(brand));
    setSavedDocumentId(null);
    setStoredPdfPath(null);
    setMessage('');
    setError('');
  };

  const loadDocument = (document: GeneratedDocument) => {
    setForm(parseDocumentForm(document, brand));
    setSavedDocumentId(document.id);
    setStoredPdfPath(document.pdfStoragePath || null);
    setTab('context');
    setMessage(`Loaded ${document.title}.`);
    setError('');
  };

  const buildPayload = (status: CahierFormState['status']): GeneratedDocumentInput => ({
    title: form.title.trim(),
    type: 'cahier_de_charges',
    status,
    language: form.language,
    relatedProjectId: form.relatedProjectId || undefined,
    relatedCompanyId: form.relatedCompanyId || undefined,
    content: buildCahierContent(form, brand, selectedProject, selectedCompany),
    variablesJson: buildVariablesJson(form),
    issueDate: form.startDate || undefined,
    dueDate: form.dueDate || undefined,
    notes: form.notes.trim() || undefined,
    pdfStoragePath: storedPdfPath || activeDocument?.pdfStoragePath || undefined,
  });

  const saveDocument = async (status: CahierFormState['status']) => {
    if (!form.title.trim()) {
      setError('Title is required.');
      return null;
    }

    setSaving(true);
    setError('');
    setMessage('Saving cahier...');

    try {
      const payload = buildPayload(status);
      if (savedDocumentId) {
        const next = await onUpdateGeneratedDocument(savedDocumentId, payload);
        setSavedDocumentId(next.id);
        setStoredPdfPath(next.pdfStoragePath || null);
        setMessage('Cahier saved to Generated Documents.');
        return next;
      }

      const created = await onAddGeneratedDocument(payload);
      setSavedDocumentId(created.id);
      setStoredPdfPath(created.pdfStoragePath || null);
      setMessage('Cahier saved to Generated Documents.');
      return created;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save cahier.');
      setMessage('');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const ensureSavedDocument = async () => {
    if (savedDocumentId) {
      const existing = cahierDocuments.find((document) => document.id === savedDocumentId) ?? null;
      if (existing) return existing;
    }

    const saved = await saveDocument(form.status);
    return saved;
  };

  const openStoredPdf = async (documentId: string) => {
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await fetch(`/api/documents?action=signed-url&sourceType=${STORAGE_SOURCE}&documentId=${encodeURIComponent(documentId)}`, {
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
    } catch (openError) {
      if (popup) popup.close();
      setError(openError instanceof Error ? openError.message : 'Unable to open PDF.');
    }
  };

  const generateAndStorePdf = async () => {
    const document = await ensureSavedDocument();
    if (!document) return;

    setGenerating(true);
    setMessage('Generating PDF...');
    setError('');

    try {
      const response = await fetch('/api/documents?action=generate-pdf', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: STORAGE_SOURCE,
          documentId: document.id,
        }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success || !result?.storagePath) {
        throw new Error(result?.error || 'Unable to generate and store the cahier PDF.');
      }

      const storagePath = String(result.storagePath);
      setStoredPdfPath(storagePath);
      await onUpdateGeneratedDocument(document.id, { pdfStoragePath: storagePath });
      setMessage('PDF stored successfully.');
    } catch (pdfError) {
      setError(pdfError instanceof Error ? pdfError.message : 'PDF generation failed.');
      setMessage('');
    } finally {
      setGenerating(false);
    }
  };

  const savedDocumentList = cahierDocuments.slice(0, 12);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[#0f172a]">Cahier de Charges Builder</h3>
            <p className="mt-1 text-sm text-[#64748b]">Structure project requirements, deliverables, and timeline into a professional document.</p>
            <p className="mt-2 text-xs text-[#64748b]">This tool helps structure project requirements. Review details carefully before sending.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetForm} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]">
              New Cahier
            </button>
            <button type="button" onClick={() => void saveDocument('draft')} disabled={saving} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc] disabled:opacity-60">
              Save Draft
            </button>
            <button type="button" onClick={() => void saveDocument('ready')} disabled={saving} className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e293b] disabled:opacity-60">
              Save Cahier
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#e5e7eb] pb-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === item.id ? 'bg-[#0f172a] text-white' : 'bg-white text-[#64748b] hover:bg-[#f8fafc]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'context' ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Project Context" subtitle="Set the framing, audience, and core challenge" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Title"><input className="studio-input" value={form.title} onChange={(event) => updateField('title', event.target.value)} /></Field>
              <Field label="Language">
                <select className="studio-input" value={form.language} onChange={(event) => updateField('language', event.target.value as DocumentLanguage)}>
                  <option value="english">English</option>
                  <option value="french">French</option>
                  <option value="arabic">Arabic</option>
                </select>
              </Field>
              <Field label="Status">
                <select className="studio-input" value={form.status} onChange={(event) => updateField('status', event.target.value as CahierFormState['status'])}>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                </select>
              </Field>
              <Field label="Related Project"><select className="studio-input" value={form.relatedProjectId} onChange={(event) => updateField('relatedProjectId', event.target.value)}><option value="">None</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
              <Field label="Related Company"><select className="studio-input" value={form.relatedCompanyId} onChange={(event) => updateField('relatedCompanyId', event.target.value)}><option value="">None</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field>
            </div>
            <div className="mt-4 grid gap-4">
              <Field label="Client Context"><textarea className="studio-textarea" rows={4} value={form.clientContext} onChange={(event) => updateField('clientContext', event.target.value)} /></Field>
              <Field label="Project Background"><textarea className="studio-textarea" rows={4} value={form.projectBackground} onChange={(event) => updateField('projectBackground', event.target.value)} /></Field>
              <Field label="Problem Statement"><textarea className="studio-textarea" rows={4} value={form.problemStatement} onChange={(event) => updateField('problemStatement', event.target.value)} /></Field>
            </div>
          </div>

          <aside className="space-y-4">
            <SummaryCard title="Brand context">
              <SummaryLine label="Brand" value={brand?.brandName || 'Not set'} />
              <SummaryLine label="Owner" value={brand?.ownerName || 'Not set'} />
              <SummaryLine label="Signature" value={brand?.signatureName || 'Not set'} />
              <SummaryLine label="PDF" value={storedPdfPath || activeDocument?.pdfStoragePath ? 'Stored' : 'Not stored yet'} />
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
        <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <SectionHeader title="Requirements" subtitle="Define objectives, functional, non-functional, and UX/UI requirements" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Objectives"><textarea className="studio-textarea" rows={8} value={form.objectives} onChange={(event) => updateField('objectives', event.target.value)} placeholder="One objective per line" /></Field>
            <Field label="Functional Requirements"><textarea className="studio-textarea" rows={8} value={form.functionalRequirements} onChange={(event) => updateField('functionalRequirements', event.target.value)} placeholder="One requirement per line" /></Field>
            <Field label="Non-Functional Requirements"><textarea className="studio-textarea" rows={8} value={form.nonFunctionalRequirements} onChange={(event) => updateField('nonFunctionalRequirements', event.target.value)} placeholder="One requirement per line" /></Field>
            <Field label="UX/UI Requirements"><textarea className="studio-textarea" rows={8} value={form.uxUiRequirements} onChange={(event) => updateField('uxUiRequirements', event.target.value)} placeholder="One requirement per line" /></Field>
            <Field label="Constraints"><textarea className="studio-textarea" rows={6} value={form.constraints} onChange={(event) => updateField('constraints', event.target.value)} /></Field>
            <Field label="Notes"><textarea className="studio-textarea" rows={6} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} /></Field>
          </div>
        </div>
      ) : null}

      {tab === 'deliverables' ? (
        <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <SectionHeader title="Deliverables" subtitle="List deliverables, responsibilities, acceptance criteria, and success metrics" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Deliverables"><textarea className="studio-textarea" rows={8} value={form.deliverables} onChange={(event) => updateField('deliverables', event.target.value)} placeholder="One deliverable per line" /></Field>
            <Field label="Responsibilities"><textarea className="studio-textarea" rows={8} value={form.responsibilities} onChange={(event) => updateField('responsibilities', event.target.value)} placeholder="One responsibility per line" /></Field>
            <Field label="Acceptance Criteria"><textarea className="studio-textarea" rows={8} value={form.acceptanceCriteria} onChange={(event) => updateField('acceptanceCriteria', event.target.value)} placeholder="One criterion per line" /></Field>
            <Field label="Success Metrics"><textarea className="studio-textarea" rows={8} value={form.successMetrics} onChange={(event) => updateField('successMetrics', event.target.value)} placeholder="One metric per line" /></Field>
          </div>
        </div>
      ) : null}

      {tab === 'timeline' ? (
        <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <SectionHeader title="Timeline" subtitle="Frame the delivery plan, milestones, risks, and dates" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Start Date"><input type="date" className="studio-input" value={form.startDate} onChange={(event) => updateField('startDate', event.target.value)} /></Field>
            <Field label="Due Date"><input type="date" className="studio-input" value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} /></Field>
            <Field label="Milestones"><textarea className="studio-textarea" rows={8} value={form.milestones} onChange={(event) => updateField('milestones', event.target.value)} placeholder="One milestone per line" /></Field>
            <Field label="Risks"><textarea className="studio-textarea" rows={8} value={form.risks} onChange={(event) => updateField('risks', event.target.value)} placeholder="One risk per line" /></Field>
          </div>
        </div>
      ) : null}

      {tab === 'preview' ? (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeader title="Preview" subtitle="Professional document layout for project requirements" />
              <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${storedPdfPath || activeDocument?.pdfStoragePath ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]' : 'border-[#e5e7eb] bg-[#f8fafc] text-[#64748b]'}`}>
                {storedPdfPath || activeDocument?.pdfStoragePath ? 'PDF Stored' : 'Live Draft'}
              </span>
            </div>
            <div className="mt-4 overflow-auto rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
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
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Export" subtitle="Save, generate a stored PDF, and open the private link when ready" />
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void saveDocument('ready')} disabled={saving} className="rounded-lg bg-[#0f172a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1e293b] disabled:opacity-60">
                Save as Generated Document
              </button>
              <button type="button" onClick={() => void generateAndStorePdf()} disabled={generating || saving} className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-5 py-2.5 text-sm font-medium text-[#1d4ed8] hover:bg-[#dbeafe] disabled:opacity-60">
                {generating ? 'Generating PDF...' : 'Generate & Store PDF'}
              </button>
              {(storedPdfPath || activeDocument?.pdfStoragePath) ? (
                <>
                  <button type="button" onClick={() => void openStoredPdf(savedDocumentId || activeDocument?.id || '')} className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-2.5 text-sm font-medium text-[#166534] hover:bg-[#dcfce7]">
                    Open Stored PDF
                  </button>
                  <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#166534]">PDF Stored</span>
                </>
              ) : null}
            </div>

            {message ? <div className="mt-4 rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-sm text-[#166534]">{message}</div> : null}
            {error ? <div className="mt-4 rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-sm text-[#b91c1c]">{error}</div> : null}

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

          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Saved cahiers" subtitle="Load an existing cahier from Generated Documents" />
            <div className="mt-4 space-y-3">
              {savedDocumentList.length === 0 ? (
                <EmptyState text="No cahier documents yet. Save the first cahier to add it to the archive." />
              ) : savedDocumentList.map((document) => (
                <div key={document.id} className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#0f172a]">{document.title}</div>
                      <div className="mt-1 text-xs text-[#64748b]">{document.relatedProjectName || document.relatedCompanyName || 'No relationship set'}</div>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs text-[#64748b]">
                        <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-0.5 text-[#1d4ed8]">{document.status}</span>
                        {document.pdfStoragePath ? <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-0.5 text-[#166534]">PDF Stored</span> : null}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => loadDocument(document)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs font-medium text-[#334155] hover:bg-[#f8fafc]">Edit</button>
                      {document.pdfStoragePath ? <button type="button" onClick={() => void openStoredPdf(document.id)} className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-medium text-[#166534] hover:bg-[#dcfce7]">Open PDF</button> : null}
                      <button type="button" onClick={() => void onDeleteGeneratedDocument(document.id)} className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-1.5 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e6]">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      <style>{`.studio-input{width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;background:#fff;color:#0f172a;outline:none}.studio-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.studio-textarea{width:100%;border:1px solid #cbd5e1;border-radius:12px;padding:10px 12px;background:#fff;color:#0f172a;outline:none;min-height:96px;resize:vertical}.studio-textarea:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}`}</style>
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

const SummaryCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="rounded-3xl border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
    <div className="text-sm font-semibold text-[#0f172a]">{title}</div>
    <div className="mt-3 space-y-2">{children}</div>
  </div>
);

const SummaryLine: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex items-center justify-between gap-3 text-sm text-[#475569]">
    <span>{label}</span>
    <span className="max-w-[60%] truncate font-medium text-[#0f172a]">{value}</span>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-2xl border border-dashed border-[#dbe3ef] bg-[#fafcff] p-5 text-sm text-[#64748b]">{text}</div>
);

export default CahierDeChargesBuilder;