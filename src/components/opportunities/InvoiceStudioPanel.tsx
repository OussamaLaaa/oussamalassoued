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
  sortOrder: item?.sortOrder != null ? String(item.sortOrder) : '0',
});

const lineItemTotal = (item: InvoiceDraftItem) => {
  if (item.amount && !Number.isNaN(Number(item.amount))) return Number(item.amount);
  const quantity = Number(item.quantity) || 0;
  const rate = Number(item.rate) || 0;
  return quantity * rate;
};

const computeLineTotal = (item: InvoiceDraftItem) => {
  try {
    return lineItemTotal(item);
  } catch {
    return 0;
  }
};

const computeTotals = (items: InvoiceDraftItem[], discount: string, taxRate: string) => {
  const subtotal = items.reduce((sum, item) => sum + lineItemTotal(item), 0);
  const discountAmount = Number(discount) || 0;
  const afterDiscount = Math.max(0, subtotal - discountAmount);
  const rateValue = Number(taxRate) || 0;
  const taxAmount = afterDiscount * (rateValue / 100);
  const total = afterDiscount + taxAmount;
  return { subtotal, discountAmount, taxRate: rateValue, taxAmount, total };
};

const defaultForm = (brand?: DocumentBrandSettings | null): InvoiceFormState => ({
  invoiceNumber: '',
  title: '',
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
  notes: '',
  relatedProjectId: '',
  relatedCompanyId: '',
  relatedPersonId: '',
  relatedDealId: '',
});

const InvoiceStudioPanel: React.FC<{
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  documentBrandSettings: DocumentBrandSettings[];
  projects: Project[];
  companies: Company[];
  people: Person[];
  deals: Deal[];
  generatedDocuments: GeneratedDocument[];
  selectedInvoiceId: string | null;
  onSelectInvoice: (id: string | null) => void;
  onAddInvoice: (input: InvoiceInput) => Promise<Invoice>;
  onUpdateInvoice: (id: string, input: Partial<InvoiceInput>) => Promise<Invoice>;
  onDeleteInvoice: (id: string) => Promise<void>;
  onAddInvoiceItem: (input: InvoiceItemInput) => Promise<InvoiceItem>;
  onUpdateInvoiceItem: (id: string, input: Partial<InvoiceItemInput>) => Promise<InvoiceItem>;
  onDeleteInvoiceItem: (id: string, skipConfirm?: boolean) => Promise<void>;
  onAddGeneratedDocument: (input: GeneratedDocumentInput) => Promise<GeneratedDocument>;
  onUpdateGeneratedDocument: (id: string, input: Partial<GeneratedDocumentInput>) => Promise<GeneratedDocument>;
  onDeleteGeneratedDocument: (id: string) => Promise<void>;
}> = ({
  invoices,
  invoiceItems,
  documentBrandSettings,
  projects,
  companies,
  people,
  deals,
  generatedDocuments,
  selectedInvoiceId,
  onSelectInvoice,
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
  const [tab, setTab] = useState<InvoiceStudioTab>('details');
  const [draftItems, setDraftItems] = useState<InvoiceDraftItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const savedInvoiceIdRef = useRef<string | null>(selectedInvoiceId);

  const brand = documentBrandSettings[0] ?? null;

  const selectedInvoice = useMemo(
    () => invoices.find((inv) => inv.id === selectedInvoiceId) || null,
    [invoices, selectedInvoiceId],
  );

  const selectedGeneratedDocument = useMemo(
    () => (selectedInvoice?.generatedDocumentId ? generatedDocuments.find((doc) => doc.id === selectedInvoice.generatedDocumentId) : null),
    [selectedInvoice, generatedDocuments],
  );

  const relatedProject = projects.find((p) => p.id === selectedInvoice?.relatedProjectId) ?? null;
  const relatedCompany = companies.find((c) => c.id === selectedInvoice?.relatedCompanyId) ?? null;
  const relatedPerson = people.find((p) => p.id === selectedInvoice?.relatedPersonId) ?? null;
  const relatedDeal = deals.find((d) => d.id === selectedInvoice?.relatedDealId) ?? null;

  const relatedInvoiceItems = useMemo(
    () => invoiceItems.filter((item) => item.invoiceId === selectedInvoiceId),
    [invoiceItems, selectedInvoiceId],
  );

  const [form, setForm] = useState<InvoiceFormState>(() => {
    if (selectedInvoice) {
      return {
        invoiceNumber: selectedInvoice.invoiceNumber || '',
        title: selectedInvoice.title || '',
        status: selectedInvoice.status || DEFAULT_STATUS,
        language: selectedInvoice.language || DEFAULT_LANGUAGE,
        issueDate: toDateInput(selectedInvoice.issueDate),
        dueDate: toDateInput(selectedInvoice.dueDate),
        currency: selectedInvoice.currency || brand?.defaultCurrency || 'MYR',
        sellerName: selectedInvoice.sellerName || brand?.brandName || '',
        sellerEmail: selectedInvoice.sellerEmail || brand?.email || '',
        sellerPhone: selectedInvoice.sellerPhone || brand?.phone || '',
        sellerAddress: selectedInvoice.sellerAddress || brand?.address || '',
        sellerCity: selectedInvoice.sellerCity || '',
        sellerState: selectedInvoice.sellerState || '',
        sellerZip: selectedInvoice.sellerZip || '',
        sellerTaxId: selectedInvoice.sellerTaxId || '',
        sellerLogoUrl: selectedInvoice.sellerLogoUrl || brand?.logoUrl || '',
        clientName: selectedInvoice.clientName || '',
        clientEmail: selectedInvoice.clientEmail || '',
        clientPhone: selectedInvoice.clientPhone || '',
        clientAddress: selectedInvoice.clientAddress || '',
        clientCity: selectedInvoice.clientCity || '',
        clientState: selectedInvoice.clientState || '',
        clientZip: selectedInvoice.clientZip || '',
        subtotal: '',
        discountAmount: selectedInvoice.discountAmount != null ? String(selectedInvoice.discountAmount) : '',
        taxRate: selectedInvoice.taxRate != null ? String(selectedInvoice.taxRate) : '',
        taxAmount: selectedInvoice.taxAmount != null ? String(selectedInvoice.taxAmount) : '',
        total: '',
        terms: selectedInvoice.terms || brand?.paymentNotes || '',
        notes: selectedInvoice.notes || '',
        relatedProjectId: selectedInvoice.relatedProjectId || '',
        relatedCompanyId: selectedInvoice.relatedCompanyId || '',
        relatedPersonId: selectedInvoice.relatedPersonId || '',
        relatedDealId: selectedInvoice.relatedDealId || '',
      };
    }
    return defaultForm(brand);
  });

  useEffect(() => {
    savedInvoiceIdRef.current = selectedInvoiceId;
    if (selectedInvoice) {
      setForm({
        invoiceNumber: selectedInvoice.invoiceNumber || '',
        title: selectedInvoice.title || '',
        status: selectedInvoice.status || DEFAULT_STATUS,
        language: selectedInvoice.language || DEFAULT_LANGUAGE,
        issueDate: toDateInput(selectedInvoice.issueDate),
        dueDate: toDateInput(selectedInvoice.dueDate),
        currency: selectedInvoice.currency || brand?.defaultCurrency || 'MYR',
        sellerName: selectedInvoice.sellerName || brand?.brandName || '',
        sellerEmail: selectedInvoice.sellerEmail || brand?.email || '',
        sellerPhone: selectedInvoice.sellerPhone || brand?.phone || '',
        sellerAddress: selectedInvoice.sellerAddress || brand?.address || '',
        sellerCity: selectedInvoice.sellerCity || '',
        sellerState: selectedInvoice.sellerState || '',
        sellerZip: selectedInvoice.sellerZip || '',
        sellerTaxId: selectedInvoice.sellerTaxId || '',
        sellerLogoUrl: selectedInvoice.sellerLogoUrl || brand?.logoUrl || '',
        clientName: selectedInvoice.clientName || '',
        clientEmail: selectedInvoice.clientEmail || '',
        clientPhone: selectedInvoice.clientPhone || '',
        clientAddress: selectedInvoice.clientAddress || '',
        clientCity: selectedInvoice.clientCity || '',
        clientState: selectedInvoice.clientState || '',
        clientZip: selectedInvoice.clientZip || '',
        subtotal: '',
        discountAmount: selectedInvoice.discountAmount != null ? String(selectedInvoice.discountAmount) : '',
        taxRate: selectedInvoice.taxRate != null ? String(selectedInvoice.taxRate) : '',
        taxAmount: selectedInvoice.taxAmount != null ? String(selectedInvoice.taxAmount) : '',
        total: '',
        terms: selectedInvoice.terms || brand?.paymentNotes || '',
        notes: selectedInvoice.notes || '',
        relatedProjectId: selectedInvoice.relatedProjectId || '',
        relatedCompanyId: selectedInvoice.relatedCompanyId || '',
        relatedPersonId: selectedInvoice.relatedPersonId || '',
        relatedDealId: selectedInvoice.relatedDealId || '',
      });
      setDraftItems(relatedInvoiceItems.map(toDraftItem));
    } else {
      setForm(defaultForm(brand));
      setDraftItems([makeDraftItem()]);
      savedInvoiceIdRef.current = null;
    }
  }, [selectedInvoiceId, selectedInvoice, brand, relatedInvoiceItems]);

  const makeDraftItem = () => ({
    id: makeDraftItemId(),
    description: '',
    quantity: '1',
    rate: '0',
    amount: '',
    sortOrder: String(draftItems.length + 1),
  });

  const updateField = (field: keyof InvoiceFormState, value: string) =>
    setForm((current) => ({ ...current, [field]: value }));

  const updateLineItem = (id: string, field: keyof InvoiceDraftItem, value: string) =>
    setDraftItems((current) =>
      current.map((item) => (item.id === id ? { ...item, [field]: value } : item)),
    );

  const addLineItem = () =>
    setDraftItems((current) => [...current, makeDraftItem()]);

  const removeLineItem = (id: string) =>
    setDraftItems((current) => current.filter((item) => item.id !== id));

  const computedTotals = useMemo(
    () => computeTotals(draftItems, form.discountAmount, form.taxRate),
    [draftItems, form.discountAmount, form.taxRate],
  );

  const ensureSavedInvoice = async () => {
    if (savedInvoiceIdRef.current && isValidUuid(savedInvoiceIdRef.current)) {
      return savedInvoiceIdRef.current;
    }
    const input: InvoiceInput = {
      invoiceNumber: form.invoiceNumber || undefined,
      title: form.title || undefined,
      status: form.status,
      language: form.language,
      issueDate: form.issueDate || undefined,
      dueDate: form.dueDate || undefined,
      currency: form.currency || brand?.defaultCurrency || 'MYR',
      sellerName: form.sellerName || undefined,
      sellerEmail: form.sellerEmail || undefined,
      sellerPhone: form.sellerPhone || undefined,
      sellerAddress: form.sellerAddress || undefined,
      sellerCity: form.sellerCity || undefined,
      sellerState: form.sellerState || undefined,
      sellerZip: form.sellerZip || undefined,
      sellerTaxId: form.sellerTaxId || undefined,
      sellerLogoUrl: form.sellerLogoUrl || undefined,
      clientName: form.clientName || undefined,
      clientEmail: form.clientEmail || undefined,
      clientPhone: form.clientPhone || undefined,
      clientAddress: form.clientAddress || undefined,
      clientCity: form.clientCity || undefined,
      clientState: form.clientState || undefined,
      clientZip: form.clientZip || undefined,
      subtotal: computedTotals.subtotal,
      discountAmount: computedTotals.discountAmount,
      taxRate: computedTotals.taxRate,
      taxAmount: computedTotals.taxAmount,
      total: computedTotals.total,
      terms: form.terms || undefined,
      notes: form.notes || undefined,
      relatedProjectId: form.relatedProjectId || undefined,
      relatedCompanyId: form.relatedCompanyId || undefined,
      relatedPersonId: form.relatedPersonId || undefined,
      relatedDealId: form.relatedDealId || undefined,
    };
    const saved = await onAddInvoice(input);
    savedInvoiceIdRef.current = saved.id;
    onSelectInvoice(saved.id);

    for (const item of draftItems) {
      if (item.description.trim()) {
        await onAddInvoiceItem({
          invoiceId: saved.id,
          description: item.description,
          quantity: Number(item.quantity) || 0,
          rate: Number(item.rate) || 0,
          amount: lineItemTotal(item),
          sortOrder: Number(item.sortOrder) || 0,
        });
      }
    }
    return saved.id;
  };

  const saveInvoice = async (status: InvoiceInput['status']) => {
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const input: InvoiceInput = {
        invoiceNumber: form.invoiceNumber || undefined,
        title: form.title || undefined,
        status,
        language: form.language,
        issueDate: form.issueDate || undefined,
        dueDate: form.dueDate || undefined,
        currency: form.currency || brand?.defaultCurrency || 'MYR',
        sellerName: form.sellerName || undefined,
        sellerEmail: form.sellerEmail || undefined,
        sellerPhone: form.sellerPhone || undefined,
        sellerAddress: form.sellerAddress || undefined,
        sellerCity: form.sellerCity || undefined,
        sellerState: form.sellerState || undefined,
        sellerZip: form.sellerZip || undefined,
        sellerTaxId: form.sellerTaxId || undefined,
        sellerLogoUrl: form.sellerLogoUrl || undefined,
        clientName: form.clientName || undefined,
        clientEmail: form.clientEmail || undefined,
        clientPhone: form.clientPhone || undefined,
        clientAddress: form.clientAddress || undefined,
        clientCity: form.clientCity || undefined,
        clientState: form.clientState || undefined,
        clientZip: form.clientZip || undefined,
        subtotal: computedTotals.subtotal,
        discountAmount: computedTotals.discountAmount,
        taxRate: computedTotals.taxRate,
        taxAmount: computedTotals.taxAmount,
        total: computedTotals.total,
        terms: form.terms || undefined,
        notes: form.notes || undefined,
        relatedProjectId: form.relatedProjectId || undefined,
        relatedCompanyId: form.relatedCompanyId || undefined,
        relatedPersonId: form.relatedPersonId || undefined,
        relatedDealId: form.relatedDealId || undefined,
      };

      if (selectedInvoice) {
        await onUpdateInvoice(selectedInvoice.id, input);
        for (const item of draftItems) {
          if (item.description.trim()) {
            if (item.id.startsWith('draft-')) {
              await onAddInvoiceItem({
                invoiceId: selectedInvoice.id,
                description: item.description,
                quantity: Number(item.quantity) || 0,
                rate: Number(item.rate) || 0,
                amount: lineItemTotal(item),
                sortOrder: Number(item.sortOrder) || 0,
              });
            } else {
              await onUpdateInvoiceItem(item.id, {
                description: item.description,
                quantity: Number(item.quantity) || 0,
                rate: Number(item.rate) || 0,
                amount: lineItemTotal(item),
                sortOrder: Number(item.sortOrder) || 0,
              });
            }
          }
        }
        setMessage(`Invoice "${form.invoiceNumber || form.title || 'Untitled'}" saved.`);
      } else {
        const saved = await onAddInvoice(input);
        onSelectInvoice(saved.id);
        for (const item of draftItems) {
          if (item.description.trim()) {
            await onAddInvoiceItem({
              invoiceId: saved.id,
              description: item.description,
              quantity: Number(item.quantity) || 0,
              rate: Number(item.rate) || 0,
              amount: lineItemTotal(item),
              sortOrder: Number(item.sortOrder) || 0,
            });
          }
        }
        setMessage(`Invoice "${form.invoiceNumber || form.title || 'Untitled'}" created.`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save invoice.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteInvoice = async () => {
    if (!selectedInvoice) return;
    if (!window.confirm('Delete this invoice permanently?')) return;
    try {
      await onDeleteInvoice(selectedInvoice.id);
      onSelectInvoice(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete invoice.');
    }
  };

  const handlePrintPdf = () => {
    if (!savedInvoiceIdRef.current && !selectedInvoiceId) {
      setError('Save the invoice first before printing.');
      return;
    }
    setPreviewOpen(true);
  };

  const handleOpenStoredPdf = async () => {
    const id = savedInvoiceIdRef.current || selectedInvoiceId;
    if (!id || !isValidUuid(id)) return;
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await fetch(`/api/documents?action=signed-url&sourceType=invoice&documentId=${encodeURIComponent(id)}`, {
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

  const handleDownloadStoredPdf = async () => {
    const id = savedInvoiceIdRef.current || selectedInvoiceId;
    if (!id || !isValidUuid(id)) return;
    try {
      const response = await fetch(`/api/documents?action=signed-url&sourceType=invoice&documentId=${encodeURIComponent(id)}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success || !result?.signedUrl) {
        throw new Error(result?.error || 'No stored PDF found.');
      }
      const link = document.createElement('a');
      link.href = String(result.signedUrl);
      link.download = `invoice-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to download PDF.');
    }
  };

  const invoiceForPreview: Invoice = {
    id: selectedInvoice?.id || 'preview',
    invoiceNumber: form.invoiceNumber,
    title: form.title,
    status: form.status,
    language: form.language,
    issueDate: form.issueDate,
    dueDate: form.dueDate,
    currency: form.currency || 'MYR',
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
    relatedProjectId: form.relatedProjectId,
    relatedCompanyId: form.relatedCompanyId,
    relatedPersonId: form.relatedPersonId,
    relatedDealId: form.relatedDealId,
    pdfStoragePath: selectedInvoice?.pdfStoragePath,
    createdAt: selectedInvoice?.createdAt || new Date().toISOString(),
    updatedAt: selectedInvoice?.updatedAt || new Date().toISOString(),
  };

  const inputClass = 'h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400';
  const textareaClass = 'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 resize-y min-h-[80px]';

  const renderTabButton = (item: { id: InvoiceStudioTab; label: string }) => (
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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900">Invoice Studio</h3>
            <p className="text-sm text-neutral-500">
              {selectedInvoice ? `${form.invoiceNumber || 'New'} — ${form.clientName || 'No client'}` : 'Create a new professional invoice'}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => onSelectInvoice(null)} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
              New Invoice
            </button>
            <button type="button" onClick={() => void saveInvoice('draft')} disabled={saving} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60">
              Save Draft
            </button>
            <button type="button" onClick={() => void saveInvoice('ready')} disabled={saving} className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
              Save Invoice
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-1 -mb-px border-b border-neutral-200 pb-0">
        {TABS.map(renderTabButton)}
      </div>

      {tab === 'details' ? (
        <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-neutral-900"> Invoice Details</h4>
              <p className="mt-1 text-xs text-neutral-500">Invoice number, dates, currency, status, and language</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Invoice Number"><input className={inputClass} value={form.invoiceNumber} onChange={(event) => updateField('invoiceNumber', event.target.value)} placeholder="INV-2026-001" /></Field>
              <Field label="Title"><input className={inputClass} value={form.title} onChange={(event) => updateField('title', event.target.value)} placeholder="Website redesign invoice" /></Field>
              <Field label="Issue Date"><input type="date" className={inputClass} value={form.issueDate} onChange={(event) => updateField('issueDate', event.target.value)} /></Field>
              <Field label="Due Date"><input type="date" className={inputClass} value={form.dueDate} onChange={(event) => updateField('dueDate', event.target.value)} /></Field>
              <Field label="Currency"><input className={inputClass} value={form.currency} onChange={(event) => updateField('currency', event.target.value.toUpperCase())} placeholder="MYR" /></Field>
              <Field label="Status">
                <select className={inputClass} value={form.status} onChange={(event) => updateField('status', event.target.value as InvoiceInput['status'])}>
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
                <select className={inputClass} value={form.language} onChange={(event) => updateField('language', event.target.value as InvoiceInput['language'])}>
                  <option value="english">English</option>
                  <option value="french">French</option>
                  <option value="arabic">Arabic</option>
                </select>
              </Field>
            </div>

            <div className="mb-4 mt-8">
              <h4 className="text-sm font-semibold text-neutral-900">Seller / Company Details</h4>
              <p className="mt-1 text-xs text-neutral-500">Pre-filled from brand settings</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name"><input className={inputClass} value={form.sellerName} onChange={(event) => updateField('sellerName', event.target.value)} placeholder="Your company name" /></Field>
              <Field label="Email"><input className={inputClass} value={form.sellerEmail} onChange={(event) => updateField('sellerEmail', event.target.value)} placeholder="billing@company.com" /></Field>
              <Field label="Phone"><input className={inputClass} value={form.sellerPhone} onChange={(event) => updateField('sellerPhone', event.target.value)} placeholder="+60 12-345 6789" /></Field>
              <Field label="Tax ID"><input className={inputClass} value={form.sellerTaxId} onChange={(event) => updateField('sellerTaxId', event.target.value)} placeholder="Tax registration number" /></Field>
              <Field label="Address"><textarea className={textareaClass} rows={2} value={form.sellerAddress} onChange={(event) => updateField('sellerAddress', event.target.value)} placeholder="Street address" /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="City"><input className={inputClass} value={form.sellerCity} onChange={(event) => updateField('sellerCity', event.target.value)} placeholder="City" /></Field>
                <Field label="State"><input className={inputClass} value={form.sellerState} onChange={(event) => updateField('sellerState', event.target.value)} placeholder="State" /></Field>
                <Field label="ZIP"><input className={inputClass} value={form.sellerZip} onChange={(event) => updateField('sellerZip', event.target.value)} placeholder="ZIP" /></Field>
              </div>
              <Field label="Logo URL"><input className={inputClass} value={form.sellerLogoUrl} onChange={(event) => updateField('sellerLogoUrl', event.target.value)} placeholder="https://example.com/logo.png" /></Field>
            </div>

            <div className="mb-4 mt-8">
              <h4 className="text-sm font-semibold text-neutral-900">Client Details</h4>
              <p className="mt-1 text-xs text-neutral-500">Who is being billed</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Name"><input className={inputClass} value={form.clientName} onChange={(event) => updateField('clientName', event.target.value)} placeholder="Client company or contact" /></Field>
              <Field label="Email"><input className={inputClass} value={form.clientEmail} onChange={(event) => updateField('clientEmail', event.target.value)} placeholder="client@company.com" /></Field>
              <Field label="Phone"><input className={inputClass} value={form.clientPhone} onChange={(event) => updateField('clientPhone', event.target.value)} placeholder="+60 12-345 6789" /></Field>
              <Field label="Address"><textarea className={textareaClass} rows={2} value={form.clientAddress} onChange={(event) => updateField('clientAddress', event.target.value)} placeholder="Street address" /></Field>
              <div className="grid grid-cols-3 gap-2">
                <Field label="City"><input className={inputClass} value={form.clientCity} onChange={(event) => updateField('clientCity', event.target.value)} placeholder="City" /></Field>
                <Field label="State"><input className={inputClass} value={form.clientState} onChange={(event) => updateField('clientState', event.target.value)} placeholder="State" /></Field>
                <Field label="ZIP"><input className={inputClass} value={form.clientZip} onChange={(event) => updateField('clientZip', event.target.value)} placeholder="ZIP" /></Field>
              </div>
            </div>

            <div className="mb-4 mt-8">
              <h4 className="text-sm font-semibold text-neutral-900">Links</h4>
              <p className="mt-1 text-xs text-neutral-500">Connect invoice to related records</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Related Project">
                <select className={inputClass} value={form.relatedProjectId} onChange={(event) => updateField('relatedProjectId', event.target.value)}>
                  <option value="">None</option>
                  {projects.map((project) => <option key={project.id} value={project.id}>{project.name}</option>)}
                </select>
              </Field>
              <Field label="Related Company">
                <select className={inputClass} value={form.relatedCompanyId} onChange={(event) => updateField('relatedCompanyId', event.target.value)}>
                  <option value="">None</option>
                  {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
                </select>
              </Field>
              <Field label="Related Person">
                <select className={inputClass} value={form.relatedPersonId} onChange={(event) => updateField('relatedPersonId', event.target.value)}>
                  <option value="">None</option>
                  {people.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
                </select>
              </Field>
              <Field label="Related Deal">
                <select className={inputClass} value={form.relatedDealId} onChange={(event) => updateField('relatedDealId', event.target.value)}>
                  <option value="">None</option>
                  {deals.map((deal) => <option key={deal.id} value={deal.id}>{deal.servicePackage || deal.id}</option>)}
                </select>
              </Field>
            </div>
          </div>

          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <h4 className="text-sm font-semibold text-neutral-900">Totals</h4>
              <p className="mt-1 mb-4 text-xs text-neutral-500">Live calculation from items, discount, and tax</p>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Discount Amount"><input className={inputClass} value={form.discountAmount} onChange={(event) => updateField('discountAmount', event.target.value)} placeholder="0.00" /></Field>
                <Field label="Tax Rate (%)"><input className={inputClass} value={form.taxRate} onChange={(event) => updateField('taxRate', event.target.value)} placeholder="0" /></Field>
              </div>
              <div className="mt-4 rounded-md border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-neutral-500">Subtotal</span><span className="font-medium text-neutral-900">{formatMoney(computedTotals.subtotal, form.currency || 'MYR')}</span></div>
                <div className="flex items-center justify-between"><span className="text-neutral-500">Discount</span><span className="font-medium text-neutral-900">-{formatMoney(computedTotals.discountAmount, form.currency || 'MYR')}</span></div>
                <div className="flex items-center justify-between"><span className="text-neutral-500">Tax ({(computedTotals.taxRate).toFixed(1)}%)</span><span className="font-medium text-neutral-900">{formatMoney(computedTotals.taxAmount, form.currency || 'MYR')}</span></div>
                <div className="border-t border-neutral-200 pt-2 flex items-center justify-between text-base"><span className="font-semibold text-neutral-900">Total</span><span className="font-bold text-neutral-900">{formatMoney(computedTotals.total, form.currency || 'MYR')}</span></div>
              </div>
              <div className="mt-4 grid gap-4">
                <Field label="Terms / Payment Notes"><textarea className={textareaClass} rows={3} value={form.terms} onChange={(event) => updateField('terms', event.target.value)} placeholder="Payment due within 30 days" /></Field>
                <Field label="Notes"><textarea className={textareaClass} rows={3} value={form.notes} onChange={(event) => updateField('notes', event.target.value)} placeholder="Additional notes" /></Field>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-5">
              <div className="text-sm font-semibold text-neutral-900">Context</div>
              <div className="mt-3 space-y-2 text-sm text-neutral-600">
                <div><span className="font-medium text-neutral-900">Project:</span> {relatedProject?.name || 'None'}</div>
                <div><span className="font-medium text-neutral-900">Company:</span> {relatedCompany?.name || 'None'}</div>
                <div><span className="font-medium text-neutral-900">Person:</span> {relatedPerson?.fullName || 'None'}</div>
                <div><span className="font-medium text-neutral-900">Deal:</span> {relatedDeal?.servicePackage || relatedDeal?.id || 'None'}</div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'items' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h4 className="text-sm font-semibold text-neutral-900">Invoice Items</h4>
                <p className="mt-1 text-xs text-neutral-500">Add services or products with quantities and rates</p>
              </div>
              <button type="button" onClick={addLineItem} className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800">
                + Add Item
              </button>
            </div>

            <div className="hidden md:grid md:grid-cols-[2fr_0.6fr_0.6fr_0.6fr_80px] gap-3 mb-2 px-1">
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500">Description</div>
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 text-right">Qty</div>
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 text-right">Rate</div>
              <div className="text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500 text-right">Amount</div>
              <div />
            </div>

            <div className="space-y-2">
              {draftItems.map((item, index) => (
                <div key={item.id} className="grid gap-3 rounded-md border border-neutral-200 bg-neutral-50 p-4 md:grid-cols-[2fr_0.6fr_0.6fr_0.6fr_80px] items-end">
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-neutral-500 md:hidden">Description</span>
                    <input className={inputClass} value={item.description} onChange={(event) => updateLineItem(item.id, 'description', event.target.value)} placeholder={`Item ${index + 1} description`} />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-neutral-500 md:hidden">Quantity</span>
                    <input className={`${inputClass} text-right`} value={item.quantity} onChange={(event) => updateLineItem(item.id, 'quantity', event.target.value)} inputMode="decimal" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-neutral-500 md:hidden">Rate</span>
                    <input className={`${inputClass} text-right`} value={item.rate} onChange={(event) => updateLineItem(item.id, 'rate', event.target.value)} inputMode="decimal" />
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs font-medium text-neutral-500 md:hidden">Amount</span>
                    <input className={`${inputClass} text-right font-medium`} value={item.amount || String(computeLineTotal(item).toFixed(2))} onChange={(event) => updateLineItem(item.id, 'amount', event.target.value)} inputMode="decimal" placeholder="Auto" />
                  </div>
                  <div className="flex justify-end pt-1">
                    <button type="button" onClick={() => removeLineItem(item.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100">
                      Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {draftItems.length === 0 ? (
              <div className="rounded-md border border-dashed border-neutral-300 bg-neutral-50 p-6 text-center text-sm text-neutral-500">
                No items yet. Click "Add Item" to add services or products.
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h4 className="text-sm font-semibold text-neutral-900">Invoice Totals</h4>
            <div className="mt-4 max-w-sm ml-auto space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Subtotal ({draftItems.filter((i) => i.description.trim()).length} items)</span>
                <span className="font-medium text-neutral-900">{formatMoney(computedTotals.subtotal, form.currency || 'MYR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Discount</span>
                <input
                  className={inputClass}
                  style={{ width: '7rem' }}
                  value={form.discountAmount}
                  onChange={(event) => updateField('discountAmount', event.target.value)}
                  placeholder="0.00"
                  inputMode="decimal"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Tax Rate (%)</span>
                <input
                  className={inputClass}
                  style={{ width: '7rem' }}
                  value={form.taxRate}
                  onChange={(event) => updateField('taxRate', event.target.value)}
                  placeholder="0"
                  inputMode="decimal"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-neutral-500">Tax Amount</span>
                <span className="font-medium text-neutral-900">{formatMoney(computedTotals.taxAmount, form.currency || 'MYR')}</span>
              </div>
              <div className="border-t border-neutral-200 pt-3 flex items-center justify-between text-base">
                <span className="font-semibold text-neutral-900">Total</span>
                <span className="text-lg font-bold text-neutral-900">{formatMoney(computedTotals.total, form.currency || 'MYR')}</span>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'preview' ? (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h4 className="text-sm font-semibold text-neutral-900">Invoice Preview</h4>
                <p className="mt-1 text-xs text-neutral-500">Live preview of the invoice as it will appear when printed or exported</p>
              </div>
              <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800">
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
          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h4 className="text-sm font-semibold text-neutral-900">Export Invoice</h4>
            <p className="mt-1 text-sm text-neutral-500">Save, print, or generate a stored PDF for this invoice.</p>

            <div className="mt-6 rounded-md border border-neutral-200 bg-neutral-50 p-4 space-y-2 text-sm">
              <div className="flex items-center justify-between"><span className="text-neutral-500">Invoice #</span><span className="font-medium text-neutral-900">{form.invoiceNumber || '—'}</span></div>
              <div className="flex items-center justify-between"><span className="text-neutral-500">Client</span><span className="font-medium text-neutral-900">{form.clientName || '—'}</span></div>
              <div className="flex items-center justify-between"><span className="text-neutral-500">Total</span><span className="font-bold text-neutral-900">{formatMoney(computedTotals.total, form.currency || 'MYR')}</span></div>
              <div className="flex items-center justify-between"><span className="text-neutral-500">Status</span>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                  form.status === 'paid' ? 'bg-neutral-50 text-neutral-700 border border-neutral-200' :
                  form.status === 'overdue' ? 'bg-red-50 text-red-700 border border-red-200' :
                  form.status === 'sent' ? 'bg-neutral-50 text-neutral-700 border border-neutral-200' :
                  'bg-neutral-50 text-neutral-500 border border-neutral-200'
                }`}>{form.status}</span>
              </div>
              <div className="flex items-center justify-between"><span className="text-neutral-500">Items</span><span className="font-medium text-neutral-900">{draftItems.filter((i) => i.description.trim()).length}</span></div>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => void saveInvoice('draft')} disabled={saving} className="rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50 disabled:opacity-60">
                Save Draft
              </button>
              <button type="button" onClick={() => void saveInvoice('ready')} disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
                Save Invoice
              </button>
              <button type="button" onClick={handlePrintPdf} className="rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                Print / Save as PDF
              </button>
              <button type="button" onClick={() => setPreviewOpen(true)} className="rounded-md border border-neutral-200 bg-white px-4 py-2.5 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
                Generate & Store PDF
              </button>
              {selectedInvoice?.pdfStoragePath ? (
                <span className="rounded-full bg-neutral-50 px-3 py-1 text-xs font-semibold text-neutral-700 border border-neutral-200">
                  PDF Stored
                </span>
              ) : null}
            </div>

            {selectedInvoice ? (
              <div className="mt-6 border-t border-neutral-200 pt-4">
                <button type="button" onClick={() => void handleDeleteInvoice()} className="rounded-md border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-100">
                  Delete Invoice
                </button>
              </div>
            ) : null}
          </div>

          <div className="rounded-xl border border-neutral-200 bg-white p-5">
            <h4 className="text-sm font-semibold text-neutral-900">Status & Sync</h4>
            <div className="mt-4 space-y-3 text-sm">
              {message ? (
                <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-neutral-700">{message}</div>
              ) : null}
              {error ? (
                <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">{error}</div>
              ) : null}
              <div className="rounded-md border border-neutral-200 bg-neutral-50 p-4 space-y-3 text-neutral-600">
                <div className="flex items-center justify-between">
                  <span>Stored PDF:</span>
                  <span className="font-medium text-neutral-900">{selectedInvoice?.pdfStoragePath ? 'Available' : 'Not generated yet'}</span>
                </div>
                {selectedInvoice?.pdfStoragePath ? (
                  <div className="flex gap-2">
                    <button type="button" onClick={handleOpenStoredPdf} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                      Open PDF
                    </button>
                    <button type="button" onClick={handleDownloadStoredPdf} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
                      Download PDF
                    </button>
                  </div>
                ) : null}
                <div>Generated doc: <span className="font-medium text-neutral-900">{selectedGeneratedDocument?.title || 'Will be created on save'}</span></div>
                <div>Archive: <span className="font-medium text-neutral-900">Invoices and documents stay linked</span></div>
                <div className="text-xs text-neutral-500 mt-2">PDF export uses private Supabase Storage with signed URLs.</div>
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
          const id = savedInvoiceIdRef.current;
          if (!id || !isValidUuid(id)) return;
          await onUpdateInvoice(id, { pdfStoragePath: storagePath });
        }}
      />
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <label className="space-y-1 block">
    <span className="text-xs font-mono uppercase tracking-[0.14em] text-neutral-500">{label}</span>
    {children}
  </label>
);

export default InvoiceStudioPanel;
