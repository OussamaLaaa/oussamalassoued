import React, { useEffect, useMemo, useRef, useState } from 'react';
import type {
  Company,
  Deal,
  DocumentBrandSettings,
  GeneratedDocument,
  GeneratedDocumentInput,
  Invoice,
  InvoiceInput,
  InvoiceItem,
  InvoiceItemInput,
  Person,
  Project,
} from '../../types/opportunities';
import { isValidUuid } from '../../utils/securityUtils';
import InvoicePreview from './InvoicePreview';
import InvoicePrintPreviewModal from './InvoicePrintPreviewModal';

type InvoiceStudioTab = 'details' | 'items' | 'preview' | 'export';

type InvoiceDraftItem = {
  id: string;
  description: string;
  quantity: string;
  rate: string;
  amount: string;
  sortOrder: string;
};

type InvoiceFormState = {
  invoiceNumber: string;
  title: string;
  status: InvoiceInput['status'];
  language: InvoiceInput['language'];
  issueDate: string;
  dueDate: string;
  currency: string;
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
  sellerAddress: string;
  sellerCity: string;
  sellerState: string;
  sellerZip: string;
  sellerTaxId: string;
  sellerLogoUrl: string;
  clientName: string;
  clientEmail: string;
  clientPhone: string;
  clientAddress: string;
  clientCity: string;
  clientState: string;
  clientZip: string;
  subtotal: string;
  discountAmount: string;
  taxRate: string;
  taxAmount: string;
  total: string;
  terms: string;
  notes: string;
  relatedProjectId: string;
  relatedCompanyId: string;
  relatedPersonId: string;
  relatedDealId: string;
};

const TABS: Array<{ id: InvoiceStudioTab; label: string }> = [
  { id: 'details', label: 'Details' },
  { id: 'items', label: 'Items' },
  { id: 'preview', label: 'Preview' },
  { id: 'export', label: 'Export' },
];

const DEFAULT_STATUS: InvoiceInput['status'] = 'draft';
const DEFAULT_LANGUAGE: InvoiceInput['language'] = 'english';

const makeDraftItemId = () => `draft-${Math.random().toString(36).slice(2, 10)}`;

const formatMoney = (amount?: number, currency = 'MYR') => {
  if (amount == null || Number.isNaN(Number(amount))) return '—';
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'MYR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency} ${Number(amount).toFixed(2)}`;
  }
};

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

const toDraftItem = (item?: InvoiceItem): InvoiceDraftItem => ({
  id: item?.id || makeDraftItemId(),
  description: item?.description || '',
  quantity: item?.quantity != null ? String(item.quantity) : '1',
  rate: item?.rate != null ? String(item.rate) : '0',
  amount: item?.amount != null ? String(item.amount) : '',
  sortOrder: item?.sortOrder != null ? String(item.sortOrder) : '',
});

const emptyForm = (brand?: DocumentBrandSettings | null): InvoiceFormState => ({
  invoiceNumber: '',
  title: 'New Invoice',
  status: DEFAULT_STATUS,
  language: DEFAULT_LANGUAGE,
  issueDate: new Date().toISOString().slice(0, 10),
  dueDate: '',
  currency: brand?.defaultCurrency || 'MYR',
  sellerName: brand?.brandName || '',
  sellerEmail: brand?.email || '',
  sellerPhone: brand?.phone || '',
  sellerAddress: brand?.address || '',
  sellerCity: '',
  sellerState: '',
  sellerZip: '',
  sellerTaxId: '',
  sellerLogoUrl: brand?.logoUrl || '',
  clientName: '',
  clientEmail: '',
  clientPhone: '',
  clientAddress: '',
  clientCity: '',
  clientState: '',
  clientZip: '',
  subtotal: '',
  discountAmount: '',
  taxRate: '',
  taxAmount: '',
  total: '',
  terms: brand?.paymentNotes || '',
  notes: brand?.legalNotes || '',
  relatedProjectId: '',
  relatedCompanyId: '',
  relatedPersonId: '',
  relatedDealId: '',
});

const toFormState = (invoice: Invoice | null, brand?: DocumentBrandSettings | null): InvoiceFormState => {
  if (!invoice) return emptyForm(brand);

  return {
    invoiceNumber: invoice.invoiceNumber || '',
    title: invoice.title || 'New Invoice',
    status: invoice.status || DEFAULT_STATUS,
    language: invoice.language || DEFAULT_LANGUAGE,
    issueDate: toDateInput(invoice.issueDate),
    dueDate: toDateInput(invoice.dueDate),
    currency: invoice.currency || brand?.defaultCurrency || 'MYR',
    sellerName: invoice.sellerName || brand?.brandName || '',
    sellerEmail: invoice.sellerEmail || brand?.email || '',
    sellerPhone: invoice.sellerPhone || brand?.phone || '',
    sellerAddress: invoice.sellerAddress || brand?.address || '',
    sellerCity: invoice.sellerCity || '',
    sellerState: invoice.sellerState || '',
    sellerZip: invoice.sellerZip || '',
    sellerTaxId: invoice.sellerTaxId || '',
    sellerLogoUrl: invoice.sellerLogoUrl || brand?.logoUrl || '',
    clientName: invoice.clientName || '',
    clientEmail: invoice.clientEmail || '',
    clientPhone: invoice.clientPhone || '',
    clientAddress: invoice.clientAddress || '',
    clientCity: invoice.clientCity || '',
    clientState: invoice.clientState || '',
    clientZip: invoice.clientZip || '',
    subtotal: invoice.subtotal != null ? String(invoice.subtotal) : '',
    discountAmount: invoice.discountAmount != null ? String(invoice.discountAmount) : '',
    taxRate: invoice.taxRate != null ? String(invoice.taxRate) : '',
    taxAmount: invoice.taxAmount != null ? String(invoice.taxAmount) : '',
    total: invoice.total != null ? String(invoice.total) : '',
    terms: invoice.terms || brand?.paymentNotes || '',
    notes: invoice.notes || brand?.legalNotes || '',
    relatedProjectId: invoice.relatedProjectId || '',
    relatedCompanyId: invoice.relatedCompanyId || '',
    relatedPersonId: invoice.relatedPersonId || '',
    relatedDealId: invoice.relatedDealId || '',
  };
};

const toInvoicePayload = (form: InvoiceFormState, totals: { subtotal: number; discountAmount: number; taxRate: number; taxAmount: number; total: number }): InvoiceInput => ({
  invoiceNumber: form.invoiceNumber.trim(),
  title: form.title.trim(),
  status: form.status,
  language: form.language,
  issueDate: form.issueDate || undefined,
  dueDate: form.dueDate || undefined,
  currency: form.currency.trim() || 'MYR',
  sellerName: form.sellerName.trim() || undefined,
  sellerEmail: form.sellerEmail.trim() || undefined,
  sellerPhone: form.sellerPhone.trim() || undefined,
  sellerAddress: form.sellerAddress.trim() || undefined,
  sellerCity: form.sellerCity.trim() || undefined,
  sellerState: form.sellerState.trim() || undefined,
  sellerZip: form.sellerZip.trim() || undefined,
  sellerTaxId: form.sellerTaxId.trim() || undefined,
  sellerLogoUrl: form.sellerLogoUrl.trim() || undefined,
  clientName: form.clientName.trim() || undefined,
  clientEmail: form.clientEmail.trim() || undefined,
  clientPhone: form.clientPhone.trim() || undefined,
  clientAddress: form.clientAddress.trim() || undefined,
  clientCity: form.clientCity.trim() || undefined,
  clientState: form.clientState.trim() || undefined,
  clientZip: form.clientZip.trim() || undefined,
  subtotal: totals.subtotal,
  discountAmount: totals.discountAmount,
  taxRate: totals.taxRate,
  taxAmount: totals.taxAmount,
  total: totals.total,
  terms: form.terms.trim() || undefined,
  notes: form.notes.trim() || undefined,
  relatedProjectId: form.relatedProjectId || undefined,
  relatedCompanyId: form.relatedCompanyId || undefined,
  relatedPersonId: form.relatedPersonId || undefined,
  relatedDealId: form.relatedDealId || undefined,
});

const toItemPayload = (invoiceId: string, item: InvoiceDraftItem): InvoiceItemInput => ({
  invoiceId,
  description: item.description.trim(),
  quantity: Number(item.quantity) || 0,
  rate: Number(item.rate) || 0,
  amount: Number(item.amount) || 0,
  sortOrder: item.sortOrder ? Number(item.sortOrder) : undefined,
});

const computeLineTotal = (item: InvoiceDraftItem) => {
  const amount = Number(item.amount);
  if (Number.isFinite(amount) && amount > 0) return amount;
  const quantity = Number(item.quantity) || 0;
  const rate = Number(item.rate) || 0;
  return quantity * rate;
};

type InvoiceStudioPanelProps = {
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  documentBrandSettings: DocumentBrandSettings[];
  projects: Project[];
  companies: Company[];
  people: Person[];
  deals: Deal[];
  generatedDocuments: GeneratedDocument[];
  onSelectInvoice: (id: string | null) => void;
  selectedInvoiceId: string | null;
  onAddInvoice: (input: InvoiceInput) => Promise<Invoice>;
  onUpdateInvoice: (id: string, input: Partial<InvoiceInput>) => Promise<Invoice>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onAddInvoiceItem: (input: InvoiceItemInput) => Promise<InvoiceItem>;
  onUpdateInvoiceItem: (id: string, input: Partial<InvoiceItemInput>) => Promise<InvoiceItem>;
  onDeleteInvoiceItem: (id: string, skipConfirm?: boolean) => Promise<void>;
  onAddGeneratedDocument: (input: GeneratedDocumentInput) => Promise<GeneratedDocument>;
  onUpdateGeneratedDocument: (id: string, input: Partial<GeneratedDocumentInput>) => Promise<GeneratedDocument>;
  onDeleteGeneratedDocument: (id: string) => Promise<void>;
};

const InvoiceStudioPanel: React.FC<InvoiceStudioPanelProps> = ({
  invoices,
  invoiceItems,
  documentBrandSettings,
  projects,
  companies,
  people,
  deals,
  generatedDocuments,
  onSelectInvoice,
  selectedInvoiceId,
  onAddInvoice,
  onUpdateInvoice,
  onDeleteInvoice,
  onAddInvoiceItem,
  onUpdateInvoiceItem,
  onDeleteInvoiceItem,
  onAddGeneratedDocument,
  onUpdateGeneratedDocument,
  onDeleteGeneratedDocument,
}) => {
  const brand = documentBrandSettings[0] ?? null;
  const [tab, setTab] = useState<InvoiceStudioTab>('details');
  const [form, setForm] = useState<InvoiceFormState>(() => emptyForm(brand));
  const [draftItems, setDraftItems] = useState<InvoiceDraftItem[]>([toDraftItem()]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const invoiceIdRef = useRef<string | null>(null);

  const selectedInvoice = useMemo(() => invoices.find((invoice) => invoice.id === selectedInvoiceId) ?? null, [invoices, selectedInvoiceId]);
  const selectedItems = useMemo(() => invoiceItems.filter((item) => item.invoiceId === selectedInvoice?.id), [invoiceItems, selectedInvoice?.id]);
  const selectedGeneratedDocument = useMemo(() => {
    if (!selectedInvoice?.generatedDocumentId) return null;
    return generatedDocuments.find((document) => document.id === selectedInvoice.generatedDocumentId) ?? null;
  }, [generatedDocuments, selectedInvoice?.generatedDocumentId]);

  const relatedProject = useMemo(() => projects.find((project) => project.id === form.relatedProjectId) ?? null, [projects, form.relatedProjectId]);
  const relatedCompany = useMemo(() => companies.find((company) => company.id === form.relatedCompanyId) ?? null, [companies, form.relatedCompanyId]);
  const relatedPerson = useMemo(() => people.find((person) => person.id === form.relatedPersonId) ?? null, [people, form.relatedPersonId]);
  const relatedDeal = useMemo(() => deals.find((deal) => deal.id === form.relatedDealId) ?? null, [deals, form.relatedDealId]);

  const computedTotals = useMemo(() => {
    const subtotal = draftItems.reduce((sum, item) => sum + computeLineTotal(item), 0);
    const discountAmount = Number(form.discountAmount) || 0;
    const taxRate = Number(form.taxRate) || 0;
    const taxableAmount = Math.max(0, subtotal - discountAmount);
    const taxAmount = Number(form.taxAmount) || Math.round(taxableAmount * taxRate) / 100;
    const total = Number(form.total) || Math.max(0, taxableAmount + taxAmount);
    return { subtotal, discountAmount, taxRate, taxAmount, total };
  }, [draftItems, form.discountAmount, form.taxAmount, form.taxRate, form.total]);

  const updateField = (field: keyof InvoiceFormState, value: string) => {
    setForm((current) => ({ ...current, [field]: value }));
  };

  useEffect(() => {
    if (selectedInvoice) {
      setForm(toFormState(selectedInvoice, brand));
      setDraftItems(
        selectedItems.length > 0
          ? selectedItems
              .slice()
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((item) => toDraftItem(item))
          : [toDraftItem()],
      );
      return;
    }

    setForm(emptyForm(brand));
    setDraftItems([toDraftItem()]);
  }, [brand, selectedInvoice, selectedItems]);

  useEffect(() => {
    invoiceIdRef.current = selectedInvoiceId;
    if (!selectedInvoiceId) {
      setMessage('');
      setError('');
    }
  }, [selectedInvoiceId]);

  const ensureGeneratedDocument = async (invoice: Invoice, nextStatus: InvoiceInput['status']) => {
    const generatedPayload: GeneratedDocumentInput = {
      title: invoice.title,
      type: 'invoice',
      status: nextStatus === 'paid' ? 'paid' : nextStatus === 'sent' ? 'sent' : 'draft',
      language: invoice.language,
      relatedProjectId: invoice.relatedProjectId,
      relatedCompanyId: invoice.relatedCompanyId,
      relatedPersonId: invoice.relatedPersonId,
      relatedDealId: invoice.relatedDealId,
      content: [
        `Invoice ${invoice.invoiceNumber}`,
        `Client: ${invoice.clientName || '—'}`,
        `Project: ${invoice.relatedProjectName || relatedProject?.name || '—'}`,
        `Total: ${invoice.total ?? computedTotals.total} ${invoice.currency}`,
        `Issue Date: ${invoice.issueDate || ''}`,
        `Due Date: ${invoice.dueDate || ''}`,
      ].join('\n'),
      variablesJson: JSON.stringify(
        {
          invoiceNumber: invoice.invoiceNumber,
          title: invoice.title,
          clientName: invoice.clientName,
          projectName: invoice.relatedProjectName || relatedProject?.name || '',
          companyName: invoice.relatedCompanyName || relatedCompany?.name || '',
          personName: invoice.relatedPersonName || relatedPerson?.fullName || '',
          dealName: invoice.relatedDealName || relatedDeal?.servicePackage || '',
          amount: invoice.total ?? computedTotals.total,
          currency: invoice.currency,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
        },
        null,
        2,
      ),
      amount: invoice.total ?? computedTotals.total,
      currency: invoice.currency,
      issueDate: invoice.issueDate,
      dueDate: invoice.dueDate,
      notes: invoice.notes,
      externalUrl: invoice.externalUrl,
    };

    const linkedGeneratedDocument = invoice.generatedDocumentId
      ? generatedDocuments.find((document) => document.id === invoice.generatedDocumentId) ?? null
      : generatedDocuments.find(
          (document) =>
            document.type === 'invoice' &&
            document.title === invoice.title &&
            document.relatedProjectId === invoice.relatedProjectId &&
            document.relatedCompanyId === invoice.relatedCompanyId,
        ) ?? null;

    if (linkedGeneratedDocument) {
      await onUpdateGeneratedDocument(linkedGeneratedDocument.id, generatedPayload);
      return linkedGeneratedDocument.id;
    }

    const created = await onAddGeneratedDocument(generatedPayload);
    return created.id;
  };

  const persistItems = async (invoiceId: string, nextItems: InvoiceDraftItem[]) => {
    const existingItems = invoiceItems.filter((item) => item.invoiceId === invoiceId);
    for (const item of existingItems) {
      await onDeleteInvoiceItem(item.id, true);
    }

    for (let index = 0; index < nextItems.length; index += 1) {
      const item = nextItems[index];
      if (!item.description.trim()) continue;
      await onAddInvoiceItem({
        ...toItemPayload(invoiceId, item),
        sortOrder: item.sortOrder ? Number(item.sortOrder) : index + 1,
      });
    }
  };

  const saveInvoice = async (nextStatus: InvoiceInput['status']) => {
    setSaving(true);
    setError('');
    setMessage('');

    try {
      if (!form.invoiceNumber.trim()) throw new Error('Invoice number is required.');
      if (!form.title.trim()) throw new Error('Invoice title is required.');
      if (!form.clientName.trim()) throw new Error('Client name is required.');

      const totals = computedTotals;
      const payload = toInvoicePayload({ ...form, status: nextStatus }, totals);

      let savedInvoice: Invoice;
      if (selectedInvoice) {
        savedInvoice = await onUpdateInvoice(selectedInvoice.id, payload);
      } else {
        savedInvoice = await onAddInvoice(payload);
        onSelectInvoice(savedInvoice.id);
      }

      await persistItems(savedInvoice.id, draftItems);

      const generatedDocumentId = await ensureGeneratedDocument(savedInvoice, nextStatus);
      const updatedInvoice = await onUpdateInvoice(savedInvoice.id, { generatedDocumentId });
      onSelectInvoice(updatedInvoice.id);

      setMessage(nextStatus === 'draft' ? 'Invoice saved as draft.' : 'Invoice saved and synced to the archive.');
      setForm(toFormState(updatedInvoice, brand));
      setDraftItems(
        invoiceItems.filter((item) => item.invoiceId === updatedInvoice.id).length > 0
          ? invoiceItems
              .filter((item) => item.invoiceId === updatedInvoice.id)
              .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .map((item) => toDraftItem(item))
          : draftItems,
      );
      return updatedInvoice;
    } catch (saveError) {
      console.error('[Invoice Studio] Failed to save invoice', saveError);
      setError(saveError instanceof Error ? saveError.message : 'Unable to save the invoice.');
      return null;
    } finally {
      setSaving(false);
    }
  };

  const ensureSavedInvoice = async (): Promise<Invoice> => {
    if (selectedInvoice && isValidUuid(selectedInvoice.id)) return selectedInvoice;
    const saved = await saveInvoice('draft');
    if (!saved) throw new Error('Failed to save invoice.');
    return saved;
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    const confirmed = window.confirm('Delete this invoice and its linked generated document?');
    if (!confirmed) return;

    try {
      if (selectedGeneratedDocument) {
        await onDeleteGeneratedDocument(selectedGeneratedDocument.id);
      }
      await onDeleteInvoice(selectedInvoice.id);
      onSelectInvoice(null);
      setForm(emptyForm(brand));
      setDraftItems([toDraftItem()]);
      setMessage('Invoice deleted.');
    } catch (deleteError) {
      console.error('[Invoice Studio] Failed to delete invoice', deleteError);
      setError(deleteError instanceof Error ? deleteError.message : 'Unable to delete the invoice.');
    }
  };

  const addLineItem = () => {
    setDraftItems((current) => [...current, toDraftItem()]);
  };

  const updateLineItem = (id: string, field: keyof InvoiceDraftItem, value: string) => {
    setDraftItems((current) => current.map((item) => (item.id === id ? { ...item, [field]: value } : item)));
  };

  const removeLineItem = (id: string) => {
    setDraftItems((current) => current.filter((item) => item.id !== id));
  };

  const openPreview = () => {
    setPreviewOpen(true);
    setTab('preview');
  };

  const invoiceForPreview: Invoice = useMemo(() => ({
    id: selectedInvoice?.id || 'preview',
    invoiceNumber: form.invoiceNumber,
    title: form.title,
    status: form.status,
    language: form.language,
    issueDate: form.issueDate || undefined,
    dueDate: form.dueDate || undefined,
    currency: form.currency,
    sellerName: form.sellerName,
    sellerEmail: form.sellerEmail,
    sellerPhone: form.sellerPhone,
    sellerAddress: form.sellerAddress,
    sellerCity: form.sellerCity,
    sellerState: form.sellerState,
    sellerZip: form.sellerZip,
    sellerTaxId: form.sellerTaxId,
    sellerLogoUrl: form.sellerLogoUrl,
    clientName: form.clientName,
    clientEmail: form.clientEmail,
    clientPhone: form.clientPhone,
    clientAddress: form.clientAddress,
    clientCity: form.clientCity,
    clientState: form.clientState,
    clientZip: form.clientZip,
    subtotal: computedTotals.subtotal,
    discountAmount: computedTotals.discountAmount,
    taxRate: computedTotals.taxRate,
    taxAmount: computedTotals.taxAmount,
    total: computedTotals.total,
    terms: form.terms,
    notes: form.notes,
    relatedProjectId: form.relatedProjectId || undefined,
    relatedProjectName: relatedProject?.name,
    relatedCompanyId: form.relatedCompanyId || undefined,
    relatedCompanyName: relatedCompany?.name,
    relatedPersonId: form.relatedPersonId || undefined,
    relatedPersonName: relatedPerson?.fullName,
    relatedDealId: form.relatedDealId || undefined,
    relatedDealName: relatedDeal?.servicePackage || relatedDeal?.id,
    generatedDocumentId: selectedInvoice?.generatedDocumentId,
    pdfStoragePath: selectedInvoice?.pdfStoragePath,
    externalUrl: selectedInvoice?.externalUrl,
    createdAt: selectedInvoice?.createdAt,
    updatedAt: selectedInvoice?.updatedAt,
  }), [computedTotals, form, relatedCompany?.name, relatedDeal?.id, relatedDeal?.servicePackage, relatedPerson?.fullName, relatedProject?.name, selectedInvoice]);

  const handlePrintPdf = () => {
    setPreviewOpen(true);
  };

  const openStoredPdf = async (sourceType: string, id: string) => {
    const params =
      sourceType === 'invoice'
        ? `sourceType=invoice&invoiceId=${encodeURIComponent(id)}`
        : `sourceType=generated_document&documentId=${encodeURIComponent(id)}`;

    const response = await fetch(`/api/document-pdf-upload?${params}`, {
      method: 'GET',
      credentials: 'include',
      cache: 'no-store',
    });

    const result = await response.json().catch(() => ({}));
    if (!response.ok || !result?.success || !result?.signedUrl) {
      throw new Error(result?.error || 'Unable to open stored PDF.');
    }

    window.open(String(result.signedUrl), '_blank', 'noopener,noreferrer');
  };

  const handleOpenStoredPdf = async () => {
    if (!selectedInvoice?.pdfStoragePath || !selectedInvoice) return;
    try {
      await openStoredPdf('invoice', selectedInvoice.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to open PDF.');
    }
  };

  const handleDownloadStoredPdf = async () => {
    if (!selectedInvoice?.pdfStoragePath || !selectedInvoice) return;
    try {
      const sourceType = 'invoice';
      const id = selectedInvoice.id;
      const params = `sourceType=invoice&invoiceId=${encodeURIComponent(id)}`;
      const response = await fetch(`/api/document-pdf-upload?${params}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success || !result?.signedUrl) {
        throw new Error(result?.error || 'Unable to download stored PDF.');
      }
      const fileName = `${(selectedInvoice.invoiceNumber || selectedInvoice.title || 'invoice').replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase()}.pdf`;
      const anchor = document.createElement('a');
      anchor.href = String(result.signedUrl);
      anchor.download = fileName;
      anchor.style.display = 'none';
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to download PDF.');
    }
  };

  return (
    <div className="space-y-5">
      <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f172a]">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
                <polyline points="10 9 9 9 8 9" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-[#0f172a]">Invoice Studio</h3>
              <p className="text-sm text-[#64748b]">
                {selectedInvoice ? `${form.invoiceNumber || 'New'} — ${form.clientName || 'No client'}` : 'Create a new professional invoice'}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onSelectInvoice(null)} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]">
              New Invoice
            </button>
            <button type="button" onClick={() => void saveInvoice('draft')} disabled={saving} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc] disabled:opacity-60">
              Save Draft
            </button>
            <button type="button" onClick={() => void saveInvoice('ready')} disabled={saving} className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e293b] disabled:opacity-60">
              Save Invoice
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
            className={`rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
              tab === item.id
                ? 'bg-[#0f172a] text-white shadow-sm'
                : 'bg-white text-[#64748b] hover:bg-[#f8fafc] hover:text-[#0f172a]'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'details' ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-[#0f172a]"> Invoice Details</h4>
              <p className="mt-1 text-xs text-[#64748b]">Invoice number, dates, currency, status, and language</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Invoice Number"><input className="studio-input" value={form.invoiceNumber} onChange={(event) => updateField('invoiceNumber', event.target.value)} placeholder="INV-2026-001" /></Field>
              <Field label="Title"><input className="studio-input" value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Website redesign invoice" /></Field>
              <Field label="Issue Date"><input type="date" className="studio-input" value={form.issueDate} onChange={(event) => updateField('issueDate', event.target.value)} /></Field>
              <Field label="Due Date"><input type="date" className="studio-input" value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} /></Field>
              <Field label="Currency"><input className="studio-input" value={form.currency} onChange={(event) => updateField('currency', event.target.value.toUpperCase())} placeholder="MYR" /></Field>
              <Field label="Status">
                <select className="studio-input" value={form.status} onChange={(event) => updateField('status', event.target.value as InvoiceInput['status'])}>
                  <option value="draft">Draft</option>
                  <option value="ready">Ready</option>
                  <option value="sent">Sent</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="overdue">Overdue</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="archived">Archived</option>
                </select>
              </Field>
              <Field label="Language">
                <select className="studio-input" value={form.language} onChange={(event) => updateField('language', event.target.value as InvoiceInput['language'])}>
                  <option value="english">English</option>
                  <option value="french">French</option>
                  <option value="arabic">Arabic</option>
                </select>
              </Field>
            </div>

            <div className="mb-4 mt-8">
              <h4 className="text-sm font-semibold text-[#0f172a]">Seller / Company Details</h4>
              <p className="mt-1 text-xs text-[#64748b]">Pre-filled from brand settings</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name"><input className="studio-input" value={form.sellerName} onChange={(event) => updateField('sellerName', event.target.value)} placeholder="Your company name" /></Field>
              <Field label="Email"><input className="studio-input" value={form.sellerEmail} onChange={(event) => updateField('sellerEmail', event.target.value)} placeholder="billing@company.com" /></Field>
              <Field label="Phone"><input className="studio-input" value={form.sellerPhone} onChange={(event) => updateField('sellerPhone', event.target.value)} placeholder="+60 12-345 6789" /></Field>
              <Field label="Tax ID"><input className="studio-input" value={form.sellerTaxId} onChange={(event) => updateField('sellerTaxId', event.target.value)} placeholder="Tax registration number" /></Field>
              <Field label="Address"><textarea className="studio-textarea" rows={2} value={form.sellerAddress} onChange={(event) => updateField('sellerAddress', event.target.value)} placeholder="Street address" /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="City"><input className="studio-input" value={form.sellerCity} onChange={(event) => updateField('sellerCity', event.target.value)} placeholder="City" /></Field>
                <Field label="State"><input className="studio-input" value={form.sellerState} onChange={(event) => updateField('sellerState', event.target.value)} placeholder="State" /></Field>
                <Field label="ZIP"><input className="studio-input" value={form.sellerZip} onChange={(event) => updateField('sellerZip', event.target.value)} placeholder="ZIP" /></Field>
              </div>
              <Field label="Logo URL"><input className="studio-input" value={form.sellerLogoUrl} onChange={(event) => updateField('sellerLogoUrl', event.target.value)} placeholder="https://example.com/logo.png" /></Field>
            </div>

            <div className="mb-4 mt-8">
              <h4 className="text-sm font-semibold text-[#0f172a]">Client Details</h4>
              <p className="mt-1 text-xs text-[#64748b]">Who is being billed</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name"><input className="studio-input" value={form.clientName} onChange={(event) => updateField('clientName', event.target.value)} placeholder="Client company or contact" /></Field>
              <Field label="Email"><input className="studio-input" value={form.clientEmail} onChange={(event) => updateField('clientEmail', event.target.value)} placeholder="client@company.com" /></Field>
              <Field label="Phone"><input className="studio-input" value={form.clientPhone} onChange={(event) => updateField('clientPhone', event.target.value)} placeholder="+60 12-345 6789" /></Field>
              <Field label="Address"><textarea className="studio-textarea" rows={2} value={form.clientAddress} onChange={(event) => updateField('clientAddress', event.target.value)} placeholder="Street address" /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="City"><input className="studio-input" value={form.clientCity} onChange={(event) => updateField('clientCity', event.target.value)} placeholder="City" /></Field>
                <Field label="State"><input className="studio-input" value={form.clientState} onChange={(event) => updateField('clientState', event.target.value)} placeholder="State" /></Field>
                <Field label="ZIP"><input className="studio-input" value={form.clientZip} onChange={(event) => updateField('clientZip', event.target.value)} placeholder="ZIP" /></Field>
              </div>
            </div>

            <div className="mb-4 mt-8">
              <h4 className="text-sm font-semibold text-[#0f172a]">Links</h4>
              <p className="mt-1 text-xs text-[#64748b]">Connect invoice to related records</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Related Project">
                <select className="studio-input" value={form.relatedProjectId} onChange={(event) => updateField('relatedProjectId', event.target.value)}>
                  <option value="">None</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </Field>
              <Field label="Related Company">
                <select className="studio-input" value={form.relatedCompanyId} onChange={(event) => updateField('relatedCompanyId', event.target.value)}>
                  <option value="">None</option>
                  {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </Field>
              <Field label="Related Person">
                <select className="studio-input" value={form.relatedPersonId} onChange={(event) => updateField('relatedPersonId', event.target.value)}>
                  <option value="">None</option>
                  {people.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
                </select>
              </Field>
              <Field label="Related Deal">
                <select className="studio-input" value={form.relatedDealId} onChange={(event) => updateField('relatedDealId', event.target.value)}>
                  <option value="">None</option>
                  {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.servicePackage || deal.id}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <h4 className="text-sm font-semibold text-[#0f172a]">Totals</h4>
              <p className="mt-1 mb-4 text-xs text-[#64748b]">Live calculation from items, discount, and tax</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Discount Amount"><input className="studio-input" value={form.discountAmount} onChange={(event) => updateField('discountAmount', event.target.value)} placeholder="0.00" /></Field>
                <Field label="Tax Rate (%)"><input className="studio-input" value={form.taxRate} onChange={(event) => updateField('taxRate', event.target.value)} placeholder="0" /></Field>
              </div>
              <div className="mt-4 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-[#64748b]">Subtotal</span><span className="font-medium text-[#0f172a]">{formatMoney(computedTotals.subtotal, form.currency || 'MYR')}</span></div>
                <div className="flex items-center justify-between"><span className="text-[#64748b]">Discount</span><span className="font-medium text-[#0f172a]">-{formatMoney(computedTotals.discountAmount, form.currency || 'MYR')}</span></div>
                <div className="flex items-center justify-between"><span className="text-[#64748b]">Tax ({(computedTotals.taxRate).toFixed(1)}%)</span><span className="font-medium text-[#0f172a]">{formatMoney(computedTotals.taxAmount, form.currency || 'MYR')}</span></div>
                <div className="border-t border-[#e5e7eb] pt-2 flex items-center justify-between text-base"><span className="font-semibold text-[#0f172a]">Total</span><span className="font-bold text-[#0f172a]">{formatMoney(computedTotals.total, form.currency || 'MYR')}</span></div>
              </div>
              <div className="mt-4 grid gap-4">
                <Field label="Terms / Payment Notes"><textarea className="studio-textarea" rows={3} value={form.terms} onChange={(event) => updateField('terms', event.target.value)} placeholder="Payment due within 30 days" /></Field>
                <Field label="Notes"><textarea className="studio-textarea" rows={3} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Additional notes" /></Field>
              </div>
            </div>

            <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <div className="text-sm font-semibold text-[#0f172a]">Context</div>
              <div className="mt-3 space-y-2 text-sm text-[#475569]">
                <div><span className="font-medium text-[#0f172a]">Project:</span> {relatedProject?.name || 'None'}</div>
                <div><span className="font-medium text-[#0f172a]">Company:</span> {relatedCompany?.name || 'None'}</div>
                <div><span className="font-medium text-[#0f172a]">Person:</span> {relatedPerson?.fullName || 'None'}</div>
                <div><span className="font-medium text-[#0f172a]">Deal:</span> {relatedDeal?.servicePackage || relatedDeal?.id || 'None'}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'items' ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h4 className="text-sm font-semibold text-[#0f172a]">Invoice Items</h4>
                <p className="mt-1 text-xs text-[#64748b]">Add services or products with quantities and rates</p>
              </div>
              <button type="button" onClick={addLineItem} className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e293b]">
                + Add Item
              </button>
            </div>

            <div className="hidden md:grid md:grid-cols-[2fr_0.6fr_0.6fr_0.6fr_80px] gap-3 mb-2 px-1">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#64748b]">Description</div>
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#64748b] text-right">Qty</div>
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#64748b] text-right">Rate</div>
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-[#64748b] text-right">Amount</div>
              <div />
            </div>

            <div className="space-y-2">
              {draftItems.map((item, index) => (
                <div key={item.id} className="grid gap-3 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4 md:grid-cols-[2fr_0.6fr_0.6fr_0.6fr_80px] items-end">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#64748b] md:hidden">Description</span>
                    <input className="studio-input" value={item.description} onChange={(event) => updateLineItem(item.id, 'description', event.target.value)} placeholder={`Item ${index + 1} description`} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#64748b] md:hidden">Quantity</span>
                    <input className="studio-input text-right" value={item.quantity} onChange={(event) => updateLineItem(item.id, 'quantity', event.target.value)} inputMode="decimal" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#64748b] md:hidden">Rate</span>
                    <input className="studio-input text-right" value={item.rate} onChange={(event) => updateLineItem(item.id, 'rate', event.target.value)} inputMode="decimal" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-[#64748b] md:hidden">Amount</span>
                    <input className="studio-input text-right font-medium" value={item.amount || String(computeLineTotal(item).toFixed(2))} onChange={(event) => updateLineItem(item.id, 'amount', event.target.value)} inputMode="decimal" placeholder="Auto" />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button type="button" onClick={() => removeLineItem(item.id)} className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e6]">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {draftItems.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#dbe3ef] bg-[#fafcff] p-6 text-center text-sm text-[#64748b]">
                No items yet. Click "Add Item" to add services or products.
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <h4 className="text-sm font-semibold text-[#0f172a]">Invoice Totals</h4>
            <div className="mt-4 max-w-sm ml-auto space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-[#64748b]">Subtotal ({draftItems.filter((i) => i.description.trim()).length} items)</span>
                <span className="font-medium text-[#0f172a]">{formatMoney(computedTotals.subtotal, form.currency || 'MYR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748b]">Discount</span>
                <input
                  className="w-28 rounded-lg border border-[#cbd5e1] px-3 py-1.5 text-right text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                  value={form.discountAmount}
                  onChange={(event) => updateField('discountAmount', event.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748b]">Tax Rate (%)</span>
                <input
                  className="w-28 rounded-lg border border-[#cbd5e1] px-3 py-1.5 text-right text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
                  value={form.taxRate}
                  onChange={(event) => updateField('taxRate', event.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#64748b]">Tax Amount</span>
                <span className="font-medium text-[#0f172a]">{formatMoney(computedTotals.taxAmount, form.currency || 'MYR')}</span>
              </div>
              <div className="border-t border-[#e5e7eb] pt-3 flex items-center justify-between text-base">
                <span className="font-semibold text-[#0f172a]">Total</span>
                <span className="text-lg font-bold text-[#0f172a]">{formatMoney(computedTotals.total, form.currency || 'MYR')}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'preview' ? (
        <div className="space-y-4">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-[#0f172a]">Invoice Preview</h4>
                <p className="mt-1 text-xs text-[#64748b]">Live preview of the invoice as it will appear when printed or exported</p>
              </div>
              <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e293b]">
                Open Preview Modal
              </button>
            </div>
          </div>
          <InvoicePreview invoice={invoiceForPreview} items={draftItems.map((item) => ({
            id: item.id,
            invoiceId: invoiceForPreview.id,
            description: item.description,
            quantity: Number(item.quantity) || 0,
            rate: Number(item.rate) || 0,
            amount: Number(item.amount) || 0,
            sortOrder: item.sortOrder ? Number(item.sortOrder) : undefined,
          }))} brandSettings={brand} />
        </div>
      ) : null}

      {tab === 'export' ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <h4 className="text-sm font-semibold text-[#0f172a]">Export Invoice</h4>
            <p className="mt-1 text-sm text-[#64748b]">Save, print, or generate a stored PDF for this invoice.</p>

            <div className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-[#64748b]">Invoice #</span><span className="font-medium text-[#0f172a]">{form.invoiceNumber || '—'}</span></div>
              <div className="flex items-center justify-between"><span className="text-[#64748b]">Client</span><span className="font-medium text-[#0f172a]">{form.clientName || '—'}</span></div>
              <div className="flex items-center justify-between"><span className="text-[#64748b]">Total</span><span className="font-bold text-[#0f172a]">{formatMoney(computedTotals.total, form.currency || 'MYR')}</span></div>
              <div className="flex items-center justify-between"><span className="text-[#64748b]">Status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  form.status === 'paid' ? 'bg-[#f0fdf4] text-[#166534] border border-[#bbf7d0]' :
                  form.status === 'overdue' ? 'bg-[#fff1f2] text-[#b91c1c] border border-[#fecaca]' :
                  form.status === 'sent' ? 'bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe]' :
                  'bg-[#f8fafc] text-[#475569] border border-[#e5e7eb]'
                }`}>{form.status}</span>
              </div>
              <div className="flex items-center justify-between"><span className="text-[#64748b]">Items</span><span className="font-medium text-[#0f172a]">{draftItems.filter((i) => i.description.trim()).length}</span></div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void saveInvoice('draft')} disabled={saving} className="rounded-lg border border-[#cbd5e1] bg-white px-5 py-2.5 text-sm font-medium text-[#334155] hover:bg-[#f8fafc] disabled:opacity-60">
                Save Draft
              </button>
              <button type="button" onClick={() => void saveInvoice('ready')} disabled={saving} className="rounded-lg bg-[#0f172a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#1e293b] disabled:opacity-60">
                Save Invoice
              </button>
              <button type="button" onClick={handlePrintPdf} className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-5 py-2.5 text-sm font-medium text-[#1d4ed8] hover:bg-[#dbeafe]">
                Print / Save as PDF
              </button>
              <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-5 py-2.5 text-sm font-medium text-[#166534] hover:bg-[#dcfce7]">
                Generate & Store PDF
              </button>
              {selectedInvoice?.pdfStoragePath ? (
                <span className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#166534] border border-[#bbf7d0]">
                  PDF Stored
                </span>
              ) : null}
            </div>

            {selectedInvoice ? (
              <div className="mt-6 border-t border-[#e5e7eb] pt-4">
                <button type="button" onClick={() => void handleDeleteInvoice()} className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-5 py-2.5 text-sm font-medium text-[#b91c1c] hover:bg-[#fee2e6]">
                  Delete Invoice
                </button>
              </div>
            ) : null}
          </div>

          <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <h4 className="text-sm font-semibold text-[#0f172a]">Status & Sync</h4>
            <div className="mt-4 space-y-3 text-sm">
              {message ? (
                <div className="rounded-2xl border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-3 text-[#166534]">{message}</div>
              ) : null}
              {error ? (
                <div className="rounded-2xl border border-[#fecaca] bg-[#fff1f2] px-4 py-3 text-[#b91c1c]">{error}</div>
              ) : null}
              <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4 space-y-3 text-[#475569]">
                <div className="flex items-center justify-between">
                  <span>Stored PDF:</span>
                  <span className="font-medium text-[#0f172a]">{selectedInvoice?.pdfStoragePath ? 'Available' : 'Not generated yet'}</span>
                </div>
                {selectedInvoice?.pdfStoragePath ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={handleOpenStoredPdf} className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-medium text-[#166534] hover:bg-[#dcfce7]">
                      Open PDF
                    </button>
                    <button type="button" onClick={handleDownloadStoredPdf} className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-medium text-[#1d4ed8] hover:bg-[#dbeafe]">
                      Download PDF
                    </button>
                  </div>
                ) : null}
                <div>Generated doc: <span className="font-medium text-[#0f172a]">{selectedGeneratedDocument?.title || 'Will be created on save'}</span></div>
                <div>Archive: <span className="font-medium text-[#0f172a]">Invoices and documents stay linked</span></div>
                <div className="text-xs text-[#64748b] mt-2">PDF export uses private Supabase Storage with signed URLs.</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <InvoicePrintPreviewModal
        isOpen={previewOpen}
        onClose={() => setPreviewOpen(false)}
        invoice={invoiceForPreview}
        items={draftItems.map((item) => ({
          id: item.id,
          invoiceId: invoiceForPreview.id,
          description: item.description,
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          amount: Number(item.amount) || 0,
          sortOrder: item.sortOrder ? Number(item.sortOrder) : undefined,
        }))}
        brandSettings={brand}
        onEnsureSavedInvoice={ensureSavedInvoice}
        onStoredPdf={async (storagePath) => {
          const id = invoiceIdRef.current;
          if (!id) return;
          await onUpdateInvoice(id, { pdfStoragePath: storagePath });
        }}
      />

      <style>{`
        .studio-input{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;background:#fff;color:#0f172a;outline:none;font-size:14px;transition:border-color 0.15s,box-shadow 0.15s}
        .studio-input:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
        .studio-textarea{width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px 12px;background:#fff;color:#0f172a;outline:none;min-height:80px;font-size:14px;resize:vertical;transition:border-color 0.15s,box-shadow 0.15s}
        .studio-textarea:focus{border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}
      `}</style>
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="space-y-1 block">
    <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">{label}</span>
    {children}
  </label>
);

export default InvoiceStudioPanel;
