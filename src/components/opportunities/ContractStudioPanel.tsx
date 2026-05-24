import React, { useEffect, useMemo, useState } from 'react';
import type { Company, Deal, DocumentBrandSettings, DocumentLanguage, DocumentStatus, GeneratedDocument, GeneratedDocumentInput, Person, Project } from '../../types/opportunities';
import ProfessionalDocumentView from './ProfessionalDocumentView';

type ContractStudioTab = 'details' | 'parties' | 'scope' | 'terms' | 'preview' | 'export';

type ContractFormState = {
  title: string;
  language: DocumentLanguage;
  status: Extract<DocumentStatus, 'draft' | 'ready'>;
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

type ContractStudioPanelProps = {
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

const TABS: Array<{ id: ContractStudioTab; label: string }> = [
  { id: 'details', label: 'Details' },
  { id: 'parties', label: 'Parties' },
  { id: 'scope', label: 'Scope' },
  { id: 'terms', label: 'Terms' },
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

const emptyForm = (brand?: DocumentBrandSettings | null): ContractFormState => ({
  title: 'New Contract',
  language: 'english',
  status: 'draft',
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  relatedProjectId: '',
  relatedCompanyId: '',
  relatedPersonId: '',
  relatedDealId: '',
  providerName: brand?.brandName || brand?.ownerName || '',
  providerEmail: brand?.email || '',
  providerPhone: brand?.phone || '',
  providerAddress: brand?.address || '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  projectName: '',
  serviceDescription: '',
  deliverables: '',
  responsibilities: '',
  paymentTerms: brand?.paymentNotes || '',
  revisionPolicy: '',
  timeline: '',
  ownershipTerms: '',
  cancellationTerms: '',
  confidentialityTerms: brand?.legalNotes || '',
  notes: '',
});

const buildContractContent = (form: ContractFormState, brand?: DocumentBrandSettings | null) => {
  const brandSignature = brand?.signatureName?.trim() || brand?.ownerName?.trim() || brand?.brandName?.trim() || 'Authorized Signatory';

  return [
    '# Parties',
    '',
    '## Provider',
    valueLine('Name', form.providerName),
    valueLine('Email', form.providerEmail),
    valueLine('Phone', form.providerPhone),
    valueLine('Address', form.providerAddress),
    '',
    '## Client',
    valueLine('Name', form.clientName),
    valueLine('Email', form.clientEmail),
    valueLine('Phone', form.clientPhone),
    valueLine('Address', form.clientAddress),
    '',
    '# Scope of Work',
    valueLine('Project Name', form.projectName),
    valueLine('Service Description', form.serviceDescription),
    '',
    '# Deliverables',
    bulletBlock('Deliverables', form.deliverables),
    '',
    '# Payment Terms',
    form.paymentTerms.trim() || 'Not provided',
    '',
    '# Revision Policy',
    form.revisionPolicy.trim() || 'Not provided',
    '',
    '# Timeline',
    form.timeline.trim() || 'Not provided',
    '',
    '# Ownership / Usage Rights',
    form.ownershipTerms.trim() || 'Not provided',
    '',
    '# Cancellation',
    form.cancellationTerms.trim() || 'Not provided',
    '',
    '# Confidentiality',
    form.confidentialityTerms.trim() || 'Not provided',
    '',
    '# Signatures',
    `Provider: ${brandSignature}`,
    `Client: ${form.clientName.trim() || 'Client representative'}`,
    form.notes.trim() ? ['', '# Notes', form.notes.trim()] : [],
  ]
    .flat()
    .filter((line) => line !== undefined)
    .join('\n');
};

const buildVariablesJson = (form: ContractFormState) => JSON.stringify(
  {
    details: {
      title: form.title,
      language: form.language,
      status: form.status,
      issueDate: form.issueDate,
      dueDate: form.dueDate,
      relatedProjectId: form.relatedProjectId,
      relatedCompanyId: form.relatedCompanyId,
      relatedPersonId: form.relatedPersonId,
      relatedDealId: form.relatedDealId,
    },
    parties: {
      providerName: form.providerName,
      providerEmail: form.providerEmail,
      providerPhone: form.providerPhone,
      providerAddress: form.providerAddress,
      clientName: form.clientName,
      clientEmail: form.clientEmail,
      clientPhone: form.clientPhone,
      clientAddress: form.clientAddress,
    },
    scope: {
      projectName: form.projectName,
      serviceDescription: form.serviceDescription,
      deliverables: form.deliverables,
      responsibilities: form.responsibilities,
    },
    terms: {
      paymentTerms: form.paymentTerms,
      revisionPolicy: form.revisionPolicy,
      timeline: form.timeline,
      ownershipTerms: form.ownershipTerms,
      cancellationTerms: form.cancellationTerms,
      confidentialityTerms: form.confidentialityTerms,
      notes: form.notes,
    },
  },
  null,
  2,
);

const buildPreviewDocument = (
  form: ContractFormState,
  brand: DocumentBrandSettings | null,
  project?: Project | null,
  company?: Company | null,
  person?: Person | null,
  deal?: Deal | null,
  pdfStoragePath?: string | null,
): GeneratedDocument => ({
  id: 'contract-preview',
  title: form.title,
  type: 'contract',
  status: form.status,
  language: form.language,
  relatedProjectId: form.relatedProjectId || undefined,
  relatedProjectName: project?.name,
  relatedCompanyId: form.relatedCompanyId || undefined,
  relatedCompanyName: company?.name,
  relatedPersonId: form.relatedPersonId || undefined,
  relatedPersonName: person?.fullName,
  relatedDealId: form.relatedDealId || undefined,
  relatedDealName: deal?.servicePackage || deal?.id,
  content: buildContractContent(form, brand),
  variablesJson: buildVariablesJson(form),
  issueDate: form.issueDate || undefined,
  dueDate: form.dueDate || undefined,
  pdfStoragePath: pdfStoragePath || undefined,
  notes: form.notes.trim() || undefined,
});

const parseDocumentForm = (document: GeneratedDocument, brand?: DocumentBrandSettings | null): ContractFormState => {
  const parsed = safeJson(document.variablesJson) as any;
  const details = parsed.details || {};
  const parties = parsed.parties || {};
  const scope = parsed.scope || {};
  const terms = parsed.terms || {};

  return {
    title: details.title || document.title || 'New Contract',
    language: details.language || document.language || 'english',
    status: details.status || document.status || 'draft',
    issueDate: toDateInput(details.issueDate || document.issueDate),
    dueDate: toDateInput(details.dueDate || document.dueDate),
    relatedProjectId: details.relatedProjectId || document.relatedProjectId || '',
    relatedCompanyId: details.relatedCompanyId || document.relatedCompanyId || '',
    relatedPersonId: details.relatedPersonId || document.relatedPersonId || '',
    relatedDealId: details.relatedDealId || document.relatedDealId || '',
    providerName: parties.providerName || brand?.brandName || brand?.ownerName || '',
    providerEmail: parties.providerEmail || brand?.email || '',
    providerPhone: parties.providerPhone || brand?.phone || '',
    providerAddress: parties.providerAddress || brand?.address || '',
    clientName: parties.clientName || '',
    clientEmail: parties.clientEmail || '',
    clientPhone: parties.clientPhone || '',
    clientAddress: parties.clientAddress || '',
    projectName: scope.projectName || document.relatedProjectName || '',
    serviceDescription: scope.serviceDescription || '',
    deliverables: scope.deliverables || '',
    responsibilities: scope.responsibilities || '',
    paymentTerms: terms.paymentTerms || brand?.paymentNotes || '',
    revisionPolicy: terms.revisionPolicy || '',
    timeline: terms.timeline || '',
    ownershipTerms: terms.ownershipTerms || '',
    cancellationTerms: terms.cancellationTerms || '',
    confidentialityTerms: terms.confidentialityTerms || brand?.legalNotes || '',
    notes: terms.notes || document.notes || '',
  };
};

const ContractStudioPanel: React.FC<ContractStudioPanelProps> = ({
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
  const [tab, setTab] = useState<ContractStudioTab>('details');
  const [form, setForm] = useState<ContractFormState>(() => emptyForm(brand));
  const [savedDocumentId, setSavedDocumentId] = useState<string | null>(null);
  const [storedPdfPath, setStoredPdfPath] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);

  const contractDocuments = useMemo(
    () => [...generatedDocuments].filter((document) => document.type === 'contract').sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()),
    [generatedDocuments],
  );
  const activeDocument = useMemo(() => contractDocuments.find((document) => document.id === savedDocumentId) ?? null, [contractDocuments, savedDocumentId]);
  const selectedProject = useMemo(() => projects.find((project) => project.id === form.relatedProjectId) ?? null, [projects, form.relatedProjectId]);
  const selectedCompany = useMemo(() => companies.find((company) => company.id === form.relatedCompanyId) ?? null, [companies, form.relatedCompanyId]);
  const selectedPerson = useMemo(() => people.find((person) => person.id === form.relatedPersonId) ?? null, [people, form.relatedPersonId]);
  const selectedDeal = useMemo(() => deals.find((deal) => deal.id === form.relatedDealId) ?? null, [deals, form.relatedDealId]);

  const previewDocument = useMemo(
    () => buildPreviewDocument(form, brand, selectedProject, selectedCompany, selectedPerson, selectedDeal, storedPdfPath || activeDocument?.pdfStoragePath || null),
    [activeDocument?.pdfStoragePath, brand, form, selectedCompany, selectedDeal, selectedPerson, selectedProject, storedPdfPath],
  );

  useEffect(() => {
    if (!savedDocumentId) return;
    const document = contractDocuments.find((item) => item.id === savedDocumentId) ?? null;
    if (!document) {
      setSavedDocumentId(null);
      setStoredPdfPath(null);
      return;
    }
    setStoredPdfPath(document.pdfStoragePath || null);
  }, [contractDocuments, savedDocumentId]);

  const updateField = (field: keyof ContractFormState, value: string) => {
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
    setTab('details');
    setMessage(`Loaded ${document.title}.`);
    setError('');
  };

  const buildPayload = (status: ContractFormState['status']): GeneratedDocumentInput => ({
    title: form.title.trim(),
    type: 'contract',
    status,
    language: form.language,
    relatedProjectId: form.relatedProjectId || undefined,
    relatedCompanyId: form.relatedCompanyId || undefined,
    relatedPersonId: form.relatedPersonId || undefined,
    relatedDealId: form.relatedDealId || undefined,
    content: buildContractContent(form, brand),
    variablesJson: buildVariablesJson(form),
    issueDate: form.issueDate || undefined,
    dueDate: form.dueDate || undefined,
    notes: form.notes.trim() || undefined,
    pdfStoragePath: storedPdfPath || activeDocument?.pdfStoragePath || undefined,
  });

  const saveDocument = async (status: ContractFormState['status']) => {
    if (!form.title.trim()) {
      setError('Contract title is required.');
      return null;
    }

    setSaving(true);
    setError('');
    setMessage('Saving contract...');

    try {
      const payload = buildPayload(status);
      if (savedDocumentId) {
        const next = await onUpdateGeneratedDocument(savedDocumentId, payload);
        setSavedDocumentId(next.id);
        setStoredPdfPath(next.pdfStoragePath || null);
        setMessage('Contract saved to Generated Documents.');
        return next;
      }

      const created = await onAddGeneratedDocument(payload);
      setSavedDocumentId(created.id);
      setStoredPdfPath(created.pdfStoragePath || null);
      setMessage('Contract saved to Generated Documents.');
      return created;
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Unable to save contract.');
      setMessage('');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const ensureSavedDocument = async () => {
    if (savedDocumentId) {
      const existing = contractDocuments.find((document) => document.id === savedDocumentId) ?? null;
      if (existing) return existing;
    }

    const saved = await saveDocument(form.status);
    return saved;
  };

  const openStoredPdf = async (documentId: string) => {
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await fetch(`/api/document-pdf-upload?sourceType=${STORAGE_SOURCE}&documentId=${encodeURIComponent(documentId)}`, {
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
      const response = await fetch('/api/generate-pdf', {
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
        throw new Error(result?.error || 'Unable to generate and store the contract PDF.');
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

  const savedDocumentList = contractDocuments.slice(0, 12);

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[#0f172a]">Contract Studio</h3>
            <p className="mt-1 text-sm text-[#64748b]">Draft, preview, and store structured contract documents.</p>
            <p className="mt-2 text-xs text-[#64748b]">This tool helps draft and organize contracts. It is not legal advice.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetForm} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]">
              New Contract
            </button>
            <button type="button" onClick={() => void saveDocument('draft')} disabled={saving} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc] disabled:opacity-60">
              Save Draft
            </button>
            <button type="button" onClick={() => void saveDocument('ready')} disabled={saving} className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e293b] disabled:opacity-60">
              Save Contract
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

      {tab === 'details' ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Contract Details" subtitle="Title, language, status, and related records" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Title"><input className="studio-input" value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Master services agreement" /></Field>
              <Field label="Language">
                <select className="studio-input" value={form.language} onChange={(event) => updateField('language', event.target.value as DocumentLanguage)}>
                  <option value="english">English</option>
                  <option value="french">French</option>
                  <option value="arabic">Arabic</option>
                </select>
              </Field>
              <Field label="Status">
                <select className="studio-input" value={form.status} onChange={(event) => updateField('status', event.target.value as ContractFormState['status'])}>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                </select>
              </Field>
              <Field label="Issue Date"><input type="date" className="studio-input" value={form.issueDate} onChange={(event) => updateField('issueDate', event.target.value)} /></Field>
              <Field label="Due Date"><input type="date" className="studio-input" value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} /></Field>
              <Field label="Related Project"><select className="studio-input" value={form.relatedProjectId} onChange={(event) => updateField('relatedProjectId', event.target.value)}><option value="">None</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}</select></Field>
              <Field label="Related Company"><select className="studio-input" value={form.relatedCompanyId} onChange={(event) => updateField('relatedCompanyId', event.target.value)}><option value="">None</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></Field>
              <Field label="Related Person"><select className="studio-input" value={form.relatedPersonId} onChange={(event) => updateField('relatedPersonId', event.target.value)}><option value="">None</option>{people.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}</select></Field>
              <Field label="Related Deal"><select className="studio-input" value={form.relatedDealId} onChange={(event) => updateField('relatedDealId', event.target.value)}><option value="">None</option>{deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.servicePackage || deal.id}</option>)}</select></Field>
            </div>
          </div>

          <aside className="space-y-4">
            <SummaryCard title="Brand context">
              <SummaryLine label="Brand" value={brand?.brandName || 'Not set'} />
              <SummaryLine label="Owner" value={brand?.ownerName || 'Not set'} />
              <SummaryLine label="Contact" value={brand?.email || brand?.phone || 'Not set'} />
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

      {tab === 'parties' ? (
        <div className="grid gap-5 xl:grid-cols-2">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Provider" subtitle="Your company or practitioner details" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Provider Name"><input className="studio-input" value={form.providerName} onChange={(event) => updateField('providerName', event.target.value)} /></Field>
              <Field label="Provider Email"><input className="studio-input" value={form.providerEmail} onChange={(event) => updateField('providerEmail', event.target.value)} /></Field>
              <Field label="Provider Phone"><input className="studio-input" value={form.providerPhone} onChange={(event) => updateField('providerPhone', event.target.value)} /></Field>
              <Field label="Provider Address"><textarea className="studio-textarea" rows={4} value={form.providerAddress} onChange={(event) => updateField('providerAddress', event.target.value)} /></Field>
            </div>
          </div>

          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Client" subtitle="Counterparty contact details" />
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Client Name"><input className="studio-input" value={form.clientName} onChange={(event) => updateField('clientName', event.target.value)} /></Field>
              <Field label="Client Email"><input className="studio-input" value={form.clientEmail} onChange={(event) => updateField('clientEmail', event.target.value)} /></Field>
              <Field label="Client Phone"><input className="studio-input" value={form.clientPhone} onChange={(event) => updateField('clientPhone', event.target.value)} /></Field>
              <Field label="Client Address"><textarea className="studio-textarea" rows={4} value={form.clientAddress} onChange={(event) => updateField('clientAddress', event.target.value)} /></Field>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'scope' ? (
        <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <SectionHeader title="Scope" subtitle="Project name, service description, deliverables, and responsibilities" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Project Name"><input className="studio-input" value={form.projectName} onChange={(event) => updateField('projectName', event.target.value)} /></Field>
            <Field label="Service Description"><textarea className="studio-textarea" rows={3} value={form.serviceDescription} onChange={(event) => updateField('serviceDescription', event.target.value)} /></Field>
            <Field label="Deliverables"><textarea className="studio-textarea" rows={8} value={form.deliverables} onChange={(event) => updateField('deliverables', event.target.value)} placeholder="One deliverable per line" /></Field>
            <Field label="Responsibilities"><textarea className="studio-textarea" rows={8} value={form.responsibilities} onChange={(event) => updateField('responsibilities', event.target.value)} placeholder="One responsibility per line" /></Field>
          </div>
        </div>
      ) : null}

      {tab === 'terms' ? (
        <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
          <SectionHeader title="Terms" subtitle="Commercial and legal clauses to structure the contract" />
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Payment Terms"><textarea className="studio-textarea" rows={4} value={form.paymentTerms} onChange={(event) => updateField('paymentTerms', event.target.value)} /></Field>
            <Field label="Revision Policy"><textarea className="studio-textarea" rows={4} value={form.revisionPolicy} onChange={(event) => updateField('revisionPolicy', event.target.value)} /></Field>
            <Field label="Timeline"><textarea className="studio-textarea" rows={4} value={form.timeline} onChange={(event) => updateField('timeline', event.target.value)} /></Field>
            <Field label="Ownership / Usage Rights"><textarea className="studio-textarea" rows={4} value={form.ownershipTerms} onChange={(event) => updateField('ownershipTerms', event.target.value)} /></Field>
            <Field label="Cancellation Terms"><textarea className="studio-textarea" rows={4} value={form.cancellationTerms} onChange={(event) => updateField('cancellationTerms', event.target.value)} /></Field>
            <Field label="Confidentiality Terms"><textarea className="studio-textarea" rows={4} value={form.confidentialityTerms} onChange={(event) => updateField('confidentialityTerms', event.target.value)} /></Field>
            <Field label="Notes"><textarea className="studio-textarea" rows={4} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} /></Field>
          </div>
        </div>
      ) : null}

      {tab === 'preview' ? (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <SectionHeader title="Preview" subtitle="Professional contract layout with brand identity" />
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
            <SummaryLine label="Issue date" value={form.issueDate || 'Not set'} />
            <SummaryLine label="Due date" value={form.dueDate || 'Not set'} />
            <SummaryLine label="Sections" value="Parties, scope, terms, signatures" />
          </SummaryCard>
        </div>
      ) : null}

      {tab === 'export' ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Export" subtitle="Save as a generated document, store a private PDF, or open the signed file" />
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
                <SummaryLine label="Related deal" value={selectedDeal?.servicePackage || selectedDeal?.id || 'None'} />
              </SummaryCard>
              <SummaryCard title="Document archive">
                <SummaryLine label="Saved docs" value={`${contractDocuments.length} contract${contractDocuments.length === 1 ? '' : 's'}`} />
                <SummaryLine label="Archive" value="Generated Documents" />
                <SummaryLine label="Storage" value="Private Supabase Storage" />
                <SummaryLine label="Source" value="/api/generate-pdf" />
              </SummaryCard>
            </div>
          </div>

          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <SectionHeader title="Saved contracts" subtitle="Load an existing contract from Generated Documents" />
            <div className="mt-4 space-y-3">
              {savedDocumentList.length === 0 ? (
                <EmptyState text="No contract documents yet. Save the first contract to add it to the archive." />
              ) : savedDocumentList.map((document) => (
                <div key={document.id} className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-[#0f172a]">{document.title}</div>
                      <div className="mt-1 text-xs text-[#64748b]">{document.relatedProjectName || document.relatedCompanyName || document.relatedPersonName || document.relatedDealName || 'No relationship set'}</div>
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

export default ContractStudioPanel;