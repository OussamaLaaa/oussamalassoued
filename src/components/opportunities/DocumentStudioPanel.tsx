import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Company,
  Deal,
  DocumentBrandSettings,
  DocumentBrandSettingsInput,
  DocumentLanguage,
  DocumentStatus,
  DocumentTemplate,
  DocumentTemplateInput,
  DocumentType,
  FinanceIncome,
  FinancePeriod,
  GeneratedDocument,
  GeneratedDocumentInput,
  Invoice,
  InvoiceItem,
  InvoiceInput,
  InvoiceItemInput,
  Person,
  Project,
} from '../../types/opportunities';
import DocumentPrintPreviewModal from './DocumentPrintPreviewModal';
import AIDocumentAssistantPanel from './AIDocumentAssistantPanel';
import CahierDeChargesBuilder from './CahierDeChargesBuilder';
import ContractStudioPanel from './ContractStudioPanel';
import InvoiceArchivePanel from './InvoiceArchivePanel';
import InvoicePrintPreviewModal from './InvoicePrintPreviewModal';
import InvoiceStudioPanel from './InvoiceStudioPanel';


type StudioTab = 'dashboard' | 'invoice-studio' | 'invoice-archive' | 'contract-studio' | 'cahier-builder' | 'templates' | 'brand' | 'builder' | 'generated' | 'ai-assistant' | 'review';

type BuilderState = {
  templateId: string;
  relatedProjectId: string;
  relatedCompanyId: string;
  relatedPersonId: string;
  relatedDealId: string;
  title: string;
  type: DocumentType;
  language: DocumentLanguage;
  amount: string;
  currency: string;
  issueDate: string;
  dueDate: string;
  variablesText: string;
  templateContent: string;
};

type TemplateEditorState = {
  mode: 'create' | 'edit';
  template?: DocumentTemplate;
};

const TABS: Array<{ id: StudioTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'invoice-studio', label: 'Invoice Studio' },
  { id: 'invoice-archive', label: 'Invoice Archive' },
  { id: 'contract-studio', label: 'Contract Studio' },
  { id: 'cahier-builder', label: 'Cahier de Charges' },
  { id: 'templates', label: 'Templates' },
  { id: 'brand', label: 'Brand Settings' },
  { id: 'builder', label: 'Builder' },
  { id: 'generated', label: 'Generated Documents' },
  { id: 'ai-assistant', label: 'AI Assistant' },
  { id: 'review', label: 'Review' },
];

const STARTER_TEMPLATES: DocumentTemplateInput[] = [
  {
    name: 'Simple Invoice',
    type: 'invoice',
    language: 'english',
    description: 'Basic invoice template for freelance and project billing.',
    content: 'Invoice\n\nBrand: {{brandName}}\nClient: {{clientName}}\nProject: {{projectName}}\nAmount: {{amount}} {{currency}}\nIssue Date: {{date}}\nDue Date: {{deadline}}\nPayment Terms: {{paymentTerms}}\n\nThank you for your business.',
    variables: 'clientName,projectName,amount,currency,date,deadline,paymentTerms,brandName',
    isActive: true,
  },
  {
    name: 'Freelance UX/UI Contract',
    type: 'contract',
    language: 'english',
    description: 'Short service agreement for design engagements.',
    content: 'Contract\n\nThis agreement is between {{brandName}} and {{clientName}}.\nProject: {{projectName}}\nService: {{serviceDescription}}\nAmount: {{amount}} {{currency}}\nStart: {{date}}\nDeadline: {{deadline}}\nSignature: {{signatureName}}',
    variables: 'clientName,projectName,serviceDescription,amount,currency,date,deadline,signatureName,brandName',
    isActive: true,
  },
  {
    name: 'Cahier de Charges',
    type: 'cahier_de_charges',
    language: 'french',
    description: 'Scope and requirements overview for project tracking.',
    content: 'Cahier de charges\n\nClient: {{clientName}}\nProjet: {{projectName}}\nDescription du service: {{serviceDescription}}\nMontant: {{amount}} {{currency}}\nDate: {{date}}\nEchéance: {{deadline}}',
    variables: 'clientName,projectName,serviceDescription,amount,currency,date,deadline,brandName',
    isActive: true,
  },
  {
    name: 'Project Proposal',
    type: 'proposal',
    language: 'english',
    description: 'Proposal template for new client opportunities.',
    content: 'Proposal\n\nBrand: {{brandName}}\nClient: {{clientName}}\nProject: {{projectName}}\nOverview: {{serviceDescription}}\nAmount: {{amount}} {{currency}}\nDeadline: {{deadline}}\nSignature: {{signatureName}}',
    variables: 'clientName,projectName,serviceDescription,amount,currency,deadline,signatureName,brandName',
    isActive: true,
  },
  {
    name: 'Receipt',
    type: 'receipt',
    language: 'english',
    description: 'Receipt confirmation for payments and deposits.',
    content: 'Receipt\n\nReceived from {{clientName}}\nAmount: {{amount}} {{currency}}\nDate: {{date}}\nFor: {{projectName}}\nBrand: {{brandName}}',
    variables: 'clientName,projectName,amount,currency,date,brandName',
    isActive: true,
  },
  {
    name: 'Agreement',
    type: 'agreement',
    language: 'english',
    description: 'General agreement template for service tracking.',
    content: 'Agreement\n\nThis agreement is between {{brandName}} and {{clientName}}.\nProject: {{projectName}}\nAmount: {{amount}} {{currency}}\nTerms: {{paymentTerms}}\nSignature: {{signatureName}}',
    variables: 'clientName,projectName,amount,currency,paymentTerms,signatureName,brandName',
    isActive: true,
  },
];

const HELP_VARIABLES = [
  '{{clientName}}',
  '{{projectName}}',
  '{{amount}}',
  '{{currency}}',
  '{{date}}',
  '{{deadline}}',
  '{{serviceDescription}}',
  '{{paymentTerms}}',
  '{{signatureName}}',
  '{{brandName}}',
];

const TYPE_OPTIONS: Array<{ value: DocumentType; label: string }> = [
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

const formatMoney = (amount?: number, currency = 'MYR') => {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  return `${currency} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const safeJson = (value: string) => {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const getObjectFromLines = (value: string) => {
  const parsed = safeJson(value);
  if (Object.keys(parsed).length > 0) {
    return Object.fromEntries(Object.entries(parsed).map(([key, item]) => [key, String(item ?? '')]));
  }

  const lines = value.split('\n').map((line) => line.trim()).filter(Boolean);
  return lines.reduce<Record<string, string>>((accumulator, line) => {
    const separator = line.indexOf(':');
    if (separator === -1) return accumulator;
    const key = line.slice(0, separator).trim();
    const entryValue = line.slice(separator + 1).trim();
    if (key) accumulator[key] = entryValue;
    return accumulator;
  }, {});
};

const buildContext = (
  brand: DocumentBrandSettings | null,
  projects: Project[],
  companies: Company[],
  people: Person[],
  deals: Deal[],
  state: BuilderState,
  variables: Record<string, string>,
) => {
  const selectedProject = projects.find((item) => item.id === state.relatedProjectId) ?? null;
  const selectedCompany = companies.find((item) => item.id === state.relatedCompanyId) ?? null;
  const selectedPerson = people.find((item) => item.id === state.relatedPersonId) ?? null;
  const selectedDeal = deals.find((item) => item.id === state.relatedDealId) ?? null;

  const dateValue = state.issueDate || new Date().toISOString().slice(0, 10);

  return {
    brandName: brand?.brandName || '',
    ownerName: brand?.ownerName || '',
    email: brand?.email || '',
    phone: brand?.phone || '',
    website: brand?.website || '',
    address: brand?.address || '',
    signatureName: brand?.signatureName || '',
    defaultCurrency: brand?.defaultCurrency || '',
    paymentNotes: brand?.paymentNotes || '',
    legalNotes: brand?.legalNotes || '',
    projectName: selectedProject?.name || '',
    companyName: selectedCompany?.name || '',
    clientName: selectedCompany?.name || selectedPerson?.fullName || '',
    personName: selectedPerson?.fullName || '',
    dealName: selectedDeal?.servicePackage || selectedDeal?.id || '',
    serviceDescription: selectedDeal?.servicePackage || selectedProject?.nextAction || selectedProject?.notes || '',
    amount: state.amount || '',
    currency: state.currency || brand?.defaultCurrency || 'MYR',
    date: dateValue,
    deadline: state.dueDate || '',
    paymentTerms: brand?.paymentNotes || '',
    ...variables,
  };
};

const renderTemplate = (template: string, context: Record<string, string>) => template.replace(/\{\{\s*([^}]+)\s*\}\}/g, (_match, key) => {
  const trimmed = String(key || '').trim();
  return context[trimmed] ?? '';
});

const buildDraftTitle = (templateName?: string, relatedProjectName?: string, relatedCompanyName?: string) => {
  const parts = [templateName, relatedProjectName || relatedCompanyName].filter(Boolean);
  return parts.length > 0 ? parts.join(' - ') : 'New Document';
};

const normalizeDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

const defaultBuilderState = (template?: DocumentTemplate | null, brand?: DocumentBrandSettings | null): BuilderState => ({
  templateId: template?.id || '',
  relatedProjectId: '',
  relatedCompanyId: '',
  relatedPersonId: '',
  relatedDealId: '',
  title: template?.name || 'New Document',
  type: template?.type || 'document',
  language: template?.language || 'english',
  amount: '',
  currency: brand?.defaultCurrency || 'MYR',
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  variablesText: '{}',
  templateContent: template?.content || '',
});

const DocumentStudioPanel: React.FC<{
  onBackToDesktop?: () => void;
  documentTemplates: DocumentTemplate[];
  documentBrandSettings: DocumentBrandSettings[];
  generatedDocuments: GeneratedDocument[];
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  projects: Project[];
  companies: Company[];
  people: Person[];
  deals: Deal[];
  selectedInvoiceId: string | null;
  onSelectInvoice: (id: string | null) => void;
  onAddDocumentTemplate: (input: DocumentTemplateInput) => Promise<DocumentTemplate>;
  onUpdateDocumentTemplate: (id: string, input: Partial<DocumentTemplateInput>) => Promise<DocumentTemplate>;
  onDeleteDocumentTemplate: (id: string) => Promise<void>;
  onAddDocumentBrandSettings: (input: DocumentBrandSettingsInput) => Promise<DocumentBrandSettings>;
  onUpdateDocumentBrandSettings: (id: string, input: Partial<DocumentBrandSettingsInput>) => Promise<DocumentBrandSettings>;
  onDeleteDocumentBrandSettings: (id: string) => Promise<void>;
  onAddGeneratedDocument: (input: GeneratedDocumentInput) => Promise<GeneratedDocument>;
  onUpdateGeneratedDocument: (id: string, input: Partial<GeneratedDocumentInput>) => Promise<GeneratedDocument>;
  onDeleteGeneratedDocument: (id: string) => Promise<void>;
  onAddInvoice: (input: InvoiceInput) => Promise<Invoice>;
  onUpdateInvoice: (id: string, input: Partial<InvoiceInput>) => Promise<Invoice>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onAddInvoiceItem: (input: InvoiceItemInput) => Promise<InvoiceItem>;
  onUpdateInvoiceItem: (id: string, input: Partial<InvoiceItemInput>) => Promise<InvoiceItem>;
  onDeleteInvoiceItem: (id: string, skipConfirm?: boolean) => Promise<void>;
  financeIncome: FinanceIncome[];
  financePeriods: FinancePeriod[];
  onAddFinanceIncome: (input: Partial<FinanceIncome>) => Promise<FinanceIncome>;
}> = ({
  onBackToDesktop,
  documentTemplates,
  documentBrandSettings,
  generatedDocuments,
  invoices,
  invoiceItems,
  projects,
  companies,
  people,
  deals,
  selectedInvoiceId,
  onSelectInvoice,
  onAddDocumentTemplate,
  onUpdateDocumentTemplate,
  onDeleteDocumentTemplate,
  onAddDocumentBrandSettings,
  onUpdateDocumentBrandSettings,
  onDeleteDocumentBrandSettings,
  onAddGeneratedDocument,
  onUpdateGeneratedDocument,
  onDeleteGeneratedDocument,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onAddInvoiceItem,
  onUpdateInvoiceItem,
  onDeleteInvoiceItem,
  financeIncome,
  financePeriods,
  onAddFinanceIncome,
}) => {
  const [tab, setTab] = useState<StudioTab>('dashboard');
  const [templateEditor, setTemplateEditor] = useState<TemplateEditorState | null>(null);
  const [brandEditorOpen, setBrandEditorOpen] = useState(false);
  const [builder, setBuilder] = useState<BuilderState>(() => defaultBuilderState(documentTemplates[0] ?? null, documentBrandSettings[0] ?? null));
  const [builderError, setBuilderError] = useState('');
  const [editingGeneratedDocumentId, setEditingGeneratedDocumentId] = useState<string | null>(null);
  const [printPreviewDocument, setPrintPreviewDocument] = useState<GeneratedDocument | null>(null);
  const [generatedTypeFilter, setGeneratedTypeFilter] = useState<'all' | 'contract' | 'cahier_de_charges'>('all');
  const builderInitializedRef = useRef(false);

  const activeTemplates = useMemo(() => documentTemplates.filter((template) => template.isActive), [documentTemplates]);
  const brand = documentBrandSettings[0] ?? null;
  const draftDocuments = useMemo(() => generatedDocuments.filter((document) => document.status === 'draft').length, [generatedDocuments]);
  const sentDocuments = useMemo(() => generatedDocuments.filter((document) => document.status === 'sent').length, [generatedDocuments]);
  const signedContracts = useMemo(() => generatedDocuments.filter((document) => document.type === 'contract' && document.status === 'signed').length, [generatedDocuments]);
  const unpaidInvoices = useMemo(() => generatedDocuments.filter((document) => document.type === 'invoice' && ['unpaid', 'overdue', 'sent'].includes(document.status)).length, [generatedDocuments]);

  const selectedTemplate = documentTemplates.find((template) => template.id === builder.templateId) ?? null;
  const selectedProject = projects.find((project) => project.id === builder.relatedProjectId) ?? null;
  const selectedCompany = companies.find((company) => company.id === builder.relatedCompanyId) ?? null;
  const selectedPerson = people.find((person) => person.id === builder.relatedPersonId) ?? null;
  const selectedDeal = deals.find((deal) => deal.id === builder.relatedDealId) ?? null;
  const builderVariables = useMemo(() => getObjectFromLines(builder.variablesText), [builder.variablesText]);
  const builderContext = useMemo(() => buildContext(brand, projects, companies, people, deals, builder, builderVariables), [brand, projects, companies, people, deals, builder, builderVariables]);
  const renderedBuilderContent = useMemo(() => renderTemplate(builder.templateContent, builderContext), [builder.templateContent, builderContext]);
  const renderedPreview = renderedBuilderContent;

  useEffect(() => {
    if (builderInitializedRef.current) return;
    if (documentTemplates.length === 0 && documentBrandSettings.length === 0) return;
    builderInitializedRef.current = true;
    setBuilder(defaultBuilderState(documentTemplates[0] ?? null, documentBrandSettings[0] ?? null));
  }, [documentTemplates, documentBrandSettings]);

  const openTemplateEditor = (template?: DocumentTemplate) => {
    setTemplateEditor({ mode: template ? 'edit' : 'create', template });
  };

  const closeTemplateEditor = () => setTemplateEditor(null);

  const saveTemplate = async (input: DocumentTemplateInput) => {
    if (templateEditor?.mode === 'edit' && templateEditor.template) {
      await onUpdateDocumentTemplate(templateEditor.template.id, input);
    } else {
      await onAddDocumentTemplate(input);
    }
    closeTemplateEditor();
  };

  const updateBuilder = (field: keyof BuilderState, value: string) => {
    setBuilder((current) => {
      const next = { ...current, [field]: value };
      if (field === 'templateId') {
        const template = documentTemplates.find((item) => item.id === value) ?? null;
        return {
          ...next,
          title: buildDraftTitle(template?.name, selectedProject?.name, selectedCompany?.name),
          type: template?.type || current.type,
          language: template?.language || current.language,
          templateContent: template?.content || '',
          variablesText: template?.variables || current.variablesText,
        };
      }
      return next;
    });
  };

  const loadGeneratedDocumentIntoBuilder = (generatedDocument: GeneratedDocument) => {
    const template = documentTemplates.find((item) => item.id === generatedDocument.templateId) ?? null;
    setEditingGeneratedDocumentId(generatedDocument.id);
    setBuilder({
      templateId: generatedDocument.templateId || '',
      relatedProjectId: generatedDocument.relatedProjectId || '',
      relatedCompanyId: generatedDocument.relatedCompanyId || '',
      relatedPersonId: generatedDocument.relatedPersonId || '',
      relatedDealId: generatedDocument.relatedDealId || '',
      title: generatedDocument.title || template?.name || 'New Document',
      type: generatedDocument.type,
      language: generatedDocument.language,
      amount: generatedDocument.amount != null ? String(generatedDocument.amount) : '',
      currency: generatedDocument.currency || brand?.defaultCurrency || 'MYR',
      issueDate: normalizeDateInput(generatedDocument.issueDate),
      dueDate: normalizeDateInput(generatedDocument.dueDate),
      variablesText: generatedDocument.variablesJson || template?.variables || '{}',
      templateContent: generatedDocument.content || template?.content || '',
    });
    setTab('builder');
  };

  const handleCreateStarterTemplates = async () => {
    await Promise.all(STARTER_TEMPLATES.map((template) => onAddDocumentTemplate(template)));
  };

  const handleSaveGenerated = async (status: DocumentStatus) => {
    setBuilderError('');
    if (!builder.title.trim()) {
      setBuilderError('Title is required.');
      return;
    }
    const amount = builder.amount.trim() ? Number(builder.amount) : undefined;
    if (builder.amount.trim() && Number.isNaN(amount)) {
      setBuilderError('Amount must be numeric.');
      return;
    }

    const payload: GeneratedDocumentInput = {
      title: builder.title.trim(),
      type: builder.type,
      status,
      language: builder.language,
      templateId: builder.templateId || undefined,
      relatedProjectId: builder.relatedProjectId || undefined,
      relatedCompanyId: builder.relatedCompanyId || undefined,
      relatedPersonId: builder.relatedPersonId || undefined,
      relatedDealId: builder.relatedDealId || undefined,
      content: renderedBuilderContent,
      variablesJson: JSON.stringify(builderVariables, null, 2),
      amount,
      currency: builder.currency.trim() || brand?.defaultCurrency || 'MYR',
      issueDate: builder.issueDate || undefined,
      dueDate: builder.dueDate || undefined,
      notes: '',
    };

    if (editingGeneratedDocumentId) {
      await onUpdateGeneratedDocument(editingGeneratedDocumentId, payload);
      setEditingGeneratedDocumentId(null);
    } else {
      await onAddGeneratedDocument(payload);
    }
    setBuilder((current) => ({ ...current, title: buildDraftTitle(selectedTemplate?.name, selectedProject?.name, selectedCompany?.name) }));
  };

  const saveBrandSettings = async (input: DocumentBrandSettingsInput) => {
    if (brand) {
      await onUpdateDocumentBrandSettings(brand.id, input);
    } else {
      await onAddDocumentBrandSettings(input);
    }
    setBrandEditorOpen(false);
  };

  const quickUpdateGenerated = async (document: GeneratedDocument, status: DocumentStatus) => {
    const patch: Partial<GeneratedDocumentInput> = { status };
    if (status === 'signed') {
      patch.signedDate = new Date().toISOString().slice(0, 10);
    }
    await onUpdateGeneratedDocument(document.id, patch);
  };

  const renderTemplatePreview = (template: DocumentTemplate) => renderTemplate(template.content, builderContext);

  const openPrintPreview = (generatedDocument: GeneratedDocument) => {
    setPrintPreviewDocument(generatedDocument);
  };

  const closePrintPreview = () => {
    setPrintPreviewDocument(null);
  };

  const handleStoredPdf = async (storagePath: string) => {
    if (!printPreviewDocument) return;
    await onUpdateGeneratedDocument(printPreviewDocument.id, { pdfStoragePath: storagePath });
    setPrintPreviewDocument((current) => (current ? { ...current, pdfStoragePath: storagePath } : current));
  };

  const openStoredPdf = async (generatedDocument: GeneratedDocument) => {
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await fetch(`/api/documents?action=signed-url&sourceType=generated_document&documentId=${encodeURIComponent(generatedDocument.id)}`, {
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
    } catch (error) {
      if (popup) {
        popup.close();
      }
      console.error('[Document PDF] Failed to open stored PDF', error);
    }
  };

  const openInvoiceStudio = (invoiceId: string | null) => {
    onSelectInvoice(invoiceId);
    setTab('invoice-studio');
  };

  const openInvoiceArchive = () => {
    setTab('invoice-archive');
  };

  const generatedSorted = useMemo(() => [...generatedDocuments].sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime()), [generatedDocuments]);
  const generatedArchiveDocuments = useMemo(
    () => generatedSorted.filter((document) => generatedTypeFilter === 'all' || document.type === generatedTypeFilter),
    [generatedSorted, generatedTypeFilter],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-1 -mb-px border-b border-neutral-200 pb-0">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`relative px-3 py-2.5 text-sm transition-colors border-b-2 ${tab === item.id ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' ? (
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
            <MetricCard title="Active Templates" value={activeTemplates.length} />
            <MetricCard title="Generated Documents" value={generatedDocuments.length} />
            <MetricCard title="Draft Documents" value={draftDocuments} />
            <MetricCard title="Sent Documents" value={sentDocuments} />
            <MetricCard title="Signed Contracts" value={signedContracts} />
            <MetricCard title="Unpaid Invoices" value={unpaidInvoices} />
          </div>
          <div className="grid gap-5 lg:grid-cols-2">
            <CardShell title="Templates" subtitle="Active vs inactive" emptyText={documentTemplates.length === 0 ? 'No templates yet. Create starter templates to begin.' : undefined}>
              <div className="space-y-3">
                    {documentTemplates.slice(0, 6).map((template) => <TemplateRow key={template.id} template={template} />)}
              </div>
            </CardShell>
            <CardShell title="Generated" subtitle="Latest outputs" emptyText={generatedDocuments.length === 0 ? 'No generated documents yet.' : undefined}>
              <div className="space-y-3">
                {generatedSorted.slice(0, 6).map((document) => <GeneratedRow key={document.id} document={document} onQuickUpdate={quickUpdateGenerated} />)}
              </div>
            </CardShell>
          </div>
        </div>
      ) : null}

      {tab === 'invoice-studio' ? (
        <InvoiceStudioPanel
          invoices={invoices}
          invoiceItems={invoiceItems}
          documentBrandSettings={documentBrandSettings}
          projects={projects}
          companies={companies}
          people={people}
          deals={deals}
          generatedDocuments={generatedDocuments}
          selectedInvoiceId={selectedInvoiceId}
          onSelectInvoice={onSelectInvoice}
          onAddInvoice={onAddInvoice}
          onUpdateInvoice={onUpdateInvoice}
          onDeleteInvoice={onDeleteInvoice}
          onAddInvoiceItem={onAddInvoiceItem}
          onUpdateInvoiceItem={onUpdateInvoiceItem}
          onDeleteInvoiceItem={onDeleteInvoiceItem}
          onAddGeneratedDocument={onAddGeneratedDocument}
          onUpdateGeneratedDocument={onUpdateGeneratedDocument}
          onDeleteGeneratedDocument={onDeleteGeneratedDocument}
        />
      ) : null}

      {tab === 'invoice-archive' ? (
        <InvoiceArchivePanel
          invoices={invoices}
          invoiceItems={invoiceItems}
          brandSettings={documentBrandSettings[0] ?? null}
          financeIncome={financeIncome}
          financePeriods={financePeriods}
          companies={companies}
          projects={projects}
          generatedDocuments={generatedDocuments}
          onNewInvoice={() => openInvoiceStudio(null)}
          onEditInvoice={openInvoiceStudio}
          onPreviewInvoice={openInvoiceStudio}
          onDeleteInvoice={onDeleteInvoice}
          onUpdateInvoice={onUpdateInvoice}
          onAddFinanceIncome={onAddFinanceIncome}
        />
      ) : null}

      {tab === 'contract-studio' ? (
        <ContractStudioPanel
          documentBrandSettings={documentBrandSettings}
          generatedDocuments={generatedDocuments}
          projects={projects}
          companies={companies}
          people={people}
          deals={deals}
          onAddGeneratedDocument={onAddGeneratedDocument}
          onUpdateGeneratedDocument={onUpdateGeneratedDocument}
          onDeleteGeneratedDocument={onDeleteGeneratedDocument}
        />
      ) : null}

      {tab === 'cahier-builder' ? (
        <CahierDeChargesBuilder
          documentBrandSettings={documentBrandSettings}
          generatedDocuments={generatedDocuments}
          projects={projects}
          companies={companies}
          people={people}
          deals={deals}
          onAddGeneratedDocument={onAddGeneratedDocument}
          onUpdateGeneratedDocument={onUpdateGeneratedDocument}
          onDeleteGeneratedDocument={onDeleteGeneratedDocument}
        />
      ) : null}

      {tab === 'templates' ? (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">Templates</h3>
                  <p className="mt-1 text-sm text-neutral-500">View, add, edit, delete, or deactivate reusable document templates.</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {documentTemplates.length === 0 ? (
                    <button type="button" onClick={() => void handleCreateStarterTemplates()} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">Create starter templates</button>
                  ) : null}
                  <button type="button" onClick={() => openTemplateEditor()} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800">Add Template</button>
                </div>
              </div>
            </div>
            {documentTemplates.length === 0 ? <EmptyState text="No templates available." /> : documentTemplates.map((template) => (
              <div key={template.id} className="rounded-xl border border-neutral-200 bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700">{template.name}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${template.isActive ? 'border-neutral-200 bg-neutral-50 text-neutral-700' : 'border-neutral-200 bg-white text-neutral-500'}`}>{template.isActive ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="mt-2 text-sm text-neutral-500">{template.description || 'No description.'}</div>
                    <div className="mt-2 text-xs text-neutral-500">{template.type} · {template.language}</div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => openTemplateEditor(template)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Edit</button>
                    <button
                      type="button"
                      onClick={() => void onUpdateDocumentTemplate(template.id, { isActive: !template.isActive })}
                      className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
                    >
                      {template.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                    <button type="button" onClick={() => void onDeleteDocumentTemplate(template.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">Delete</button>
                  </div>
                </div>
                <div className="mt-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-900 whitespace-pre-wrap">{renderTemplatePreview(template)}</div>
              </div>
            ))}
          </div>
          <CardShell title="Template Helper" subtitle="Supported variables" emptyText={undefined}>
            <p className="text-sm text-neutral-500">Use these placeholders inside template content:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {HELP_VARIABLES.map((variable) => <span key={variable} className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs text-neutral-600">{variable}</span>)}
            </div>
            <div className="mt-4 rounded-lg border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
              Template content is rendered in the builder and generated document preview. This phase only drafts text and stores it in Supabase.
            </div>
          </CardShell>
        </div>
      ) : null}

      {tab === 'brand' ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Brand Settings</h3>
                <p className="mt-1 text-sm text-neutral-500">One profile controls logo, signature, contact details, and default notes.</p>
              </div>
              <button type="button" onClick={() => setBrandEditorOpen(true)} className="rounded-md bg-neutral-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-neutral-800">
                {brand ? 'Edit Brand Settings' : 'Create brand settings'}
              </button>
            </div>

            {brand ? (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  {brand.logoUrl ? <img src={brand.logoUrl} alt={brand.brandName || 'Brand logo'} className="mb-3 h-12 w-auto rounded object-contain" /> : null}
                  <div className="text-base font-semibold text-neutral-900">{brand.brandName || 'Untitled Brand'}</div>
                  <div className="mt-1 text-sm text-neutral-500">{brand.ownerName || 'No owner set'}</div>
                  <div className="mt-3 space-y-1 text-sm text-neutral-600">
                    <div>{brand.email || 'No email set'}</div>
                    <div>{brand.phone || 'No phone set'}</div>
                    <div>{brand.website || 'No website set'}</div>
                    <div className="whitespace-pre-wrap">{brand.address || 'No address set'}</div>
                  </div>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-500">
                  <div className="font-semibold text-neutral-900">Preview Notes</div>
                  <div className="mt-2">Default currency: {brand.defaultCurrency || '—'}</div>
                  <div className="mt-1 whitespace-pre-wrap">Payment notes: {brand.paymentNotes || '—'}</div>
                  <div className="mt-1 whitespace-pre-wrap">Legal notes: {brand.legalNotes || '—'}</div>
                  {brand.signatureUrl ? (
                    <div className="mt-4">
                      <div className="text-xs font-mono uppercase tracking-[0.12em] text-neutral-500">Signature</div>
                      <img src={brand.signatureUrl} alt={brand.signatureName || 'Signature'} className="mt-2 h-10 w-auto object-contain" />
                    </div>
                  ) : null}
                </div>
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">Create brand settings to control studio defaults and preview branding.</div>
            )}
          </div>

          <CardShell title="Brand preview" subtitle="Layout and identity" emptyText={undefined}>
            <div className="space-y-3 text-sm text-neutral-600">
              <div>Logo and signature URLs are stored as links only in this phase.</div>
              <div>These settings flow into the builder preview and generated documents.</div>
              <div>No PDF export or upload behavior is included yet.</div>
            </div>
          </CardShell>
        </div>
      ) : null}

      {tab === 'builder' ? (
        <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Basic Document Builder</h3>
                <p className="mt-1 text-sm text-neutral-500">Select a template, connect related records, and preview rendered content before saving.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                {editingGeneratedDocumentId ? <span className="rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 text-sm font-medium text-neutral-700">Editing existing document</span> : null}
                <button type="button" onClick={() => void handleSaveGenerated('draft')} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">Save as Draft</button>
                <button type="button" onClick={() => void handleSaveGenerated('ready')} className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800">Save as Ready</button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Template">
                <select value={builder.templateId} onChange={(event) => updateBuilder('templateId', event.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  <option value="">Select template</option>
                  {documentTemplates.map((template) => <option key={template.id} value={template.id}>{template.name}</option>)}
                </select>
              </Field>
              <Field label="Title">
                <input value={builder.title} onChange={(event) => updateBuilder('title', event.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" placeholder="Generated document title" />
              </Field>
              <Field label="Type">
                <select value={builder.type} onChange={(event) => updateBuilder('type', event.target.value as DocumentType)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="Language">
                <select value={builder.language} onChange={(event) => updateBuilder('language', event.target.value as DocumentLanguage)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </Field>
              <Field label="Related Project">
                <select value={builder.relatedProjectId} onChange={(event) => updateBuilder('relatedProjectId', event.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  <option value="">None</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </Field>
              <Field label="Related Company">
                <select value={builder.relatedCompanyId} onChange={(event) => updateBuilder('relatedCompanyId', event.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  <option value="">None</option>
                  {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </Field>
              <Field label="Related Person">
                <select value={builder.relatedPersonId} onChange={(event) => updateBuilder('relatedPersonId', event.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  <option value="">None</option>
                  {people.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
                </select>
              </Field>
              <Field label="Related Deal">
                <select value={builder.relatedDealId} onChange={(event) => updateBuilder('relatedDealId', event.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400">
                  <option value="">None</option>
                  {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.servicePackage || deal.id}</option>)}
                </select>
              </Field>
              <Field label="Amount">
                <input value={builder.amount} onChange={(event) => updateBuilder('amount', event.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" placeholder="0.00" inputMode="decimal" />
              </Field>
              <Field label="Currency">
                <input value={builder.currency} onChange={(event) => updateBuilder('currency', event.target.value.toUpperCase())} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" placeholder="MYR" />
              </Field>
              <Field label="Issue Date">
                <input type="date" value={builder.issueDate} onChange={(event) => updateBuilder('issueDate', event.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
              </Field>
              <Field label="Due Date">
                <input type="date" value={builder.dueDate} onChange={(event) => updateBuilder('dueDate', event.target.value)} className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" />
              </Field>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Field label="Variables JSON / key:value lines">
                <textarea value={builder.variablesText} onChange={(event) => updateBuilder('variablesText', event.target.value)} rows={8} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 min-h-[140px]" placeholder='{"serviceDescription":"UX redesign"}' />
              </Field>
              <Field label="Template Content">
                <textarea value={builder.templateContent} onChange={(event) => updateBuilder('templateContent', event.target.value)} rows={8} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 min-h-[140px]" placeholder="Template content with {{placeholders}}" />
              </Field>
            </div>

            {builderError ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{builderError}</div> : null}
          </div>

          <div className="space-y-4">
            <CardShell title="Rendered Preview" subtitle="Live placeholder replacement" emptyText={undefined}>
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm leading-6 whitespace-pre-wrap text-neutral-900 min-h-[260px]">
                {renderedPreview || 'Select a template to preview rendered content.'}
              </div>
            </CardShell>
            <CardShell title="Context" subtitle="Preview sources" emptyText={undefined}>
              <div className="space-y-2 text-sm text-neutral-600">
                <div><span className="font-medium text-neutral-900">Brand:</span> {brand?.brandName || 'None'}</div>
                <div><span className="font-medium text-neutral-900">Project:</span> {selectedProject?.name || 'None'}</div>
                <div><span className="font-medium text-neutral-900">Company:</span> {selectedCompany?.name || 'None'}</div>
                <div><span className="font-medium text-neutral-900">Person:</span> {selectedPerson?.fullName || 'None'}</div>
                <div><span className="font-medium text-neutral-900">Deal:</span> {selectedDeal?.servicePackage || selectedDeal?.id || 'None'}</div>
                <div><span className="font-medium text-neutral-900">Template:</span> {selectedTemplate?.name || 'None'}</div>
              </div>
            </CardShell>
          </div>
        </div>
      ) : null}

      {tab === 'generated' ? (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-0">
            <button type="button" onClick={() => setGeneratedTypeFilter('all')} className={`relative px-3 py-2 text-sm transition-colors border-b-2 ${generatedTypeFilter === 'all' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}>
              All
            </button>
            <button type="button" onClick={() => setGeneratedTypeFilter('contract')} className={`relative px-3 py-2 text-sm transition-colors border-b-2 ${generatedTypeFilter === 'contract' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}>
              Contracts
            </button>
            <button type="button" onClick={() => setGeneratedTypeFilter('cahier_de_charges')} className={`relative px-3 py-2 text-sm transition-colors border-b-2 ${generatedTypeFilter === 'cahier_de_charges' ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'}`}>
              Cahier de Charges
            </button>
          </div>
          {generatedArchiveDocuments.length === 0 ? <EmptyState text="No generated documents match the current filter." /> : generatedArchiveDocuments.map((document) => (
            <div key={document.id} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-semibold text-neutral-900">{document.title}</h3>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-neutral-700">{document.type}</span>
                    <span className={`inline-flex rounded-full border px-2.5 py-0.5 ${document.status === 'signed' || document.status === 'paid' ? 'border-neutral-200 bg-neutral-50 text-neutral-700' : document.status === 'overdue' ? 'border-red-200 bg-red-50 text-red-700' : document.status === 'sent' ? 'border-neutral-200 bg-neutral-50 text-neutral-700' : 'border-neutral-200 bg-neutral-50 text-neutral-500'}`}>{document.status}</span>
                    <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-neutral-500">{document.language}</span>
                    {document.pdfStoragePath ? <span className="inline-flex rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-neutral-700">PDF Stored</span> : null}
                  </div>
                  <div className="mt-2 text-sm text-neutral-500">
                    {document.relatedProjectName || document.relatedCompanyName || document.relatedPersonName || document.relatedDealName || 'No relationship'}
                  </div>
                  <div className="mt-2 text-sm text-neutral-600">
                    {formatMoney(document.amount, document.currency)} · Issue {formatDate(document.issueDate)} · Due {formatDate(document.dueDate)}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => openPrintPreview(document)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Preview</button>
                  <button type="button" onClick={() => openPrintPreview(document)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Export PDF</button>
                  {!document.pdfStoragePath ? <button type="button" onClick={() => openPrintPreview(document)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Generate PDF</button> : null}
                  {document.pdfStoragePath ? <button type="button" onClick={() => void openStoredPdf(document)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Open Stored PDF</button> : null}
                  {document.externalUrl ? <a href={document.externalUrl} target="_blank" rel="noreferrer" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Open External URL</a> : null}
                  <button type="button" onClick={() => loadGeneratedDocumentIntoBuilder(document)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Edit</button>
                  <button type="button" onClick={() => void onDeleteGeneratedDocument(document.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">Delete</button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button type="button" onClick={() => void onUpdateGeneratedDocument(document.id, { status: 'ready' })} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Mark Ready</button>
                <button type="button" onClick={() => void onUpdateGeneratedDocument(document.id, { status: 'sent' })} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Mark Sent</button>
                <button type="button" onClick={() => void onUpdateGeneratedDocument(document.id, { status: 'signed', signedDate: new Date().toISOString().slice(0, 10) })} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Mark Signed</button>
                <button type="button" onClick={() => void onUpdateGeneratedDocument(document.id, { status: 'paid' })} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Mark Paid</button>
                <button type="button" onClick={() => void onUpdateGeneratedDocument(document.id, { status: 'archived' })} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">Archive</button>
              </div>
              <div className="mt-3 rounded-md border border-neutral-200 bg-neutral-50 p-3 text-sm leading-6 whitespace-pre-wrap text-neutral-900">{document.content || 'No content saved.'}</div>
            </div>
          ))}
        </div>
      ) : null}

      {tab === 'ai-assistant' ? (
        <AIDocumentAssistantPanel
          documentBrandSettings={documentBrandSettings}
          documentTemplates={documentTemplates}
          generatedDocuments={generatedDocuments}
          projects={projects}
          companies={companies}
          people={people}
          deals={deals}
          onAddDocumentTemplate={onAddDocumentTemplate}
          onAddGeneratedDocument={onAddGeneratedDocument}
          onUpdateGeneratedDocument={onUpdateGeneratedDocument}
        />
      ) : null}

      {tab === 'review' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {[
            'Which documents are missing for active projects?',
            'Which contracts are unsigned?',
            'Which invoices are unpaid?',
            'Which templates need improvement?',
            'Which documents need legal review?',
          ].map((prompt) => (
            <div key={prompt} className="rounded-xl border border-neutral-200 bg-white p-4">
              <div className="text-sm font-semibold text-neutral-900">{prompt}</div>
              <p className="mt-2 text-sm text-neutral-500">This system helps organize and draft documents. It does not provide legal advice.</p>
            </div>
          ))}
        </div>
      ) : null}

      {templateEditor ? (
        <TemplateEditorModal
          template={templateEditor.template}
          onClose={closeTemplateEditor}
          onSave={saveTemplate}
        />
      ) : null}

      {brandEditorOpen ? (
        <BrandSettingsModal
          brand={brand}
          onClose={() => setBrandEditorOpen(false)}
          onSave={saveBrandSettings}
          onDelete={brand ? () => void onDeleteDocumentBrandSettings(brand.id) : undefined}
        />
      ) : null}

      <DocumentPrintPreviewModal
        isOpen={Boolean(printPreviewDocument)}
        onClose={closePrintPreview}
        document={printPreviewDocument}
        brandSettings={brand}
        onStoredPdf={handleStoredPdf}
      />
    </div>
  );
};

const CardShell: React.FC<{ title: string; subtitle?: string; emptyText?: string; children: React.ReactNode }> = ({ title, subtitle, emptyText, children }) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <h3 className="text-base font-semibold text-neutral-900">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-neutral-500">{subtitle}</p> : null}
      </div>
    </div>
    <div className="mt-4">{emptyText && !React.Children.count(children) ? <EmptyState text={emptyText} /> : children}</div>
  </div>
);

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="space-y-1 block">
    <span className="text-xs font-mono uppercase tracking-[0.14em] text-neutral-500">{label}</span>
    {children}
  </label>
);

const MetricCard: React.FC<{ title: string; value: string | number; accent?: string }> = ({ title, value }) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
    <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-neutral-500">{title}</div>
    <div className="mt-1 text-2xl font-semibold text-neutral-900">{value}</div>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">{text}</div>
);

const TemplateRow: React.FC<{ template: DocumentTemplate }> = ({ template }) => (
  <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
    <div className="flex items-center justify-between gap-2">
      <div className="text-sm font-semibold text-neutral-900">{template.name}</div>
      <span className={`rounded-full border px-2 py-0.5 text-[11px] ${template.isActive ? 'border-neutral-200 bg-neutral-50 text-neutral-700' : 'border-neutral-200 bg-white text-neutral-500'}`}>{template.type}</span>
    </div>
    <div className="mt-1 text-xs text-neutral-500">{template.language}</div>
  </div>
);

const GeneratedRow: React.FC<{ document: GeneratedDocument; onQuickUpdate: (document: GeneratedDocument, status: DocumentStatus) => Promise<void> }> = ({ document, onQuickUpdate }) => (
  <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <div className="truncate text-sm font-semibold text-neutral-900">{document.title}</div>
        <div className="mt-1 text-xs text-neutral-500">{document.templateName || 'No template'}</div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={() => void onQuickUpdate(document, 'ready')} className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700">Ready</button>
        <button type="button" onClick={() => void onQuickUpdate(document, 'sent')} className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-[11px] font-medium text-neutral-700">Sent</button>
      </div>
    </div>
  </div>
);

const TemplateEditorModal: React.FC<{
  template?: DocumentTemplate;
  onClose: () => void;
  onSave: (input: DocumentTemplateInput) => Promise<void>;
}> = ({ template, onClose, onSave }) => {
  const [form, setForm] = useState<DocumentTemplateInput>({
    name: template?.name || '',
    type: template?.type || 'document',
    language: template?.language || 'english',
    description: template?.description || '',
    content: template?.content || '',
    variables: template?.variables || '',
    isActive: template?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  return (
    <Modal title={template ? 'Edit Template' : 'Add Template'} onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Name"><input className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} /></Field>
        <Field label="Type"><select className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value as DocumentType }))}>{TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        <Field label="Language"><select className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value as DocumentLanguage }))}>{LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></Field>
        <Field label="Active"><select className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400" value={form.isActive ? 'true' : 'false'} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.value === 'true' }))}><option value="true">Yes</option><option value="false">No</option></select></Field>
      </div>
      <div className="mt-4 grid gap-4">
        <Field label="Description"><textarea className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 min-h-[80px]" value={form.description || ''} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} rows={3} /></Field>
        <Field label="Variables"><input className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" value={form.variables || ''} onChange={(event) => setForm((current) => ({ ...current, variables: event.target.value }))} placeholder="clientName,projectName,amount" /></Field>
        <Field label="Content"><textarea className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 min-h-[240px]" value={form.content} onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))} rows={10} /></Field>
      </div>
      <div className="mt-4 flex items-center justify-end gap-2">
        <button type="button" onClick={onClose} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">Cancel</button>
        <button
          type="button"
          disabled={saving}
          onClick={async () => {
            setSaving(true);
            try {
              await onSave(form);
            } finally {
              setSaving(false);
            }
          }}
          className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
        >
          Save
        </button>
      </div>
    </Modal>
  );
};

const BrandSettingsModal: React.FC<{
  brand: DocumentBrandSettings | null;
  onClose: () => void;
  onSave: (input: DocumentBrandSettingsInput) => Promise<void>;
  onDelete?: () => void;
}> = ({ brand, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState<DocumentBrandSettingsInput>({
    brandName: brand?.brandName || '',
    ownerName: brand?.ownerName || '',
    email: brand?.email || '',
    phone: brand?.phone || '',
    website: brand?.website || '',
    address: brand?.address || '',
    logoUrl: brand?.logoUrl || '',
    signatureUrl: brand?.signatureUrl || '',
    signatureName: brand?.signatureName || '',
    defaultCurrency: brand?.defaultCurrency || 'MYR',
    paymentNotes: brand?.paymentNotes || '',
    legalNotes: brand?.legalNotes || '',
  });
  const [saving, setSaving] = useState(false);

  return (
    <Modal title={brand ? 'Edit Brand Settings' : 'Create Brand Settings'} onClose={onClose}>
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Brand Name"><input className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" value={form.brandName || ''} onChange={(event) => setForm((current) => ({ ...current, brandName: event.target.value }))} /></Field>
        <Field label="Owner Name"><input className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" value={form.ownerName || ''} onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))} /></Field>
        <Field label="Email"><input className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" value={form.email || ''} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></Field>
        <Field label="Phone"><input className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" value={form.phone || ''} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></Field>
        <Field label="Website"><input className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" value={form.website || ''} onChange={(event) => setForm((current) => ({ ...current, website: event.target.value }))} /></Field>
        <Field label="Default Currency"><input className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" value={form.defaultCurrency || ''} onChange={(event) => setForm((current) => ({ ...current, defaultCurrency: event.target.value.toUpperCase() }))} /></Field>
        <Field label="Logo URL"><input className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" value={form.logoUrl || ''} onChange={(event) => setForm((current) => ({ ...current, logoUrl: event.target.value }))} /></Field>
        <Field label="Signature URL"><input className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" value={form.signatureUrl || ''} onChange={(event) => setForm((current) => ({ ...current, signatureUrl: event.target.value }))} /></Field>
        <Field label="Signature Name"><input className="h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400" value={form.signatureName || ''} onChange={(event) => setForm((current) => ({ ...current, signatureName: event.target.value }))} /></Field>
      </div>
      <div className="mt-4 grid gap-4">
        <Field label="Address"><textarea className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 min-h-[80px]" value={form.address || ''} onChange={(event) => setForm((current) => ({ ...current, address: event.target.value }))} rows={3} /></Field>
        <Field label="Payment Notes"><textarea className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 min-h-[80px]" value={form.paymentNotes || ''} onChange={(event) => setForm((current) => ({ ...current, paymentNotes: event.target.value }))} rows={3} /></Field>
        <Field label="Legal Notes"><textarea className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 min-h-[80px]" value={form.legalNotes || ''} onChange={(event) => setForm((current) => ({ ...current, legalNotes: event.target.value }))} rows={3} /></Field>
      </div>
      <div className="mt-4 flex items-center justify-between gap-2">
        <div>{onDelete ? <button type="button" onClick={onDelete} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-100">Delete</button> : null}</div>
        <div className="flex items-center gap-2">
          <button type="button" onClick={onClose} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">Cancel</button>
          <button
            type="button"
            disabled={saving}
            onClick={async () => {
              setSaving(true);
              try {
                await onSave(form);
              } finally {
                setSaving(false);
              }
            }}
            className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
};

const Modal: React.FC<{ title: string; onClose: () => void; children: React.ReactNode }> = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/40 px-4 py-6">
    <div className="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl border border-neutral-200 bg-white p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="text-lg font-semibold text-neutral-900">{title}</div>
        <button type="button" onClick={onClose} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50">Close</button>
      </div>
      <div className="mt-4">{children}</div>
    </div>
  </div>
);

export default DocumentStudioPanel;
