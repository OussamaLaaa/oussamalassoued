import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useMemo, useState } from 'react';
import type {
 Company, DocumentBrandSettings, FinanceIncome, FinancePeriod,
 GeneratedDocument, Invoice, InvoiceInput, InvoiceItem, Project,
} from '../../types/opportunities';

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

const formatDate = (value?: string) => {
 if (!value) return '—';
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return value;
 return date.toLocaleDateString();
};

const statusBadge = (status: string) => {
 const styles: Record<string, string> = {
 draft: 'bg-neutral-50 text-neutral-500 border-neutral-200',
 ready: 'bg-neutral-50 text-neutral-700 border-neutral-200',
 sent: 'bg-neutral-50 text-neutral-700 border-neutral-200',
 paid: 'bg-neutral-50 text-neutral-700 border-neutral-200',
 unpaid: 'bg-neutral-50 text-neutral-600 border-neutral-200',
 overdue: 'bg-red-50 text-red-700 border-red-200',
 cancelled: 'bg-neutral-50 text-neutral-500 border-neutral-200',
 archived: 'bg-neutral-50 text-neutral-500 border-neutral-200',
 };
 return styles[status] || 'bg-neutral-50 text-neutral-500 border-neutral-200';
};

type InvoiceArchivePanelProps = {
 invoices: Invoice[];
 invoiceItems: InvoiceItem[];
 brandSettings?: DocumentBrandSettings | null;
 financeIncome: FinanceIncome[];
 financePeriods: FinancePeriod[];
 companies: Company[];
 projects: Project[];
 generatedDocuments: GeneratedDocument[];
 onNewInvoice: () => void;
 onEditInvoice: (id: string) => void;
 onPreviewInvoice: (id: string) => void;
 onDeleteInvoice: (id: string) => Promise<void>;
 onUpdateInvoice: (id: string, input: Partial<InvoiceInput>) => Promise<Invoice>;
 onAddFinanceIncome: (input: Partial<FinanceIncome>) => Promise<FinanceIncome>;
};

const InvoiceArchivePanel: React.FC<InvoiceArchivePanelProps> = ({
 invoices, invoiceItems, brandSettings, financeIncome, financePeriods,
 companies, projects, people, deals, generatedDocuments,
 onNewInvoice, onEditInvoice, onPreviewInvoice, onDeleteInvoice,
 onUpdateInvoice, onAddFinanceIncome,
}) => {
 const { t } = usePersonalLanguage();
 const [searchQuery, setSearchQuery] = useState('');
 const [statusFilter, setStatusFilter] = useState('');
 const [companyFilter, setCompanyFilter] = useState('');
 const [projectFilter, setProjectFilter] = useState('');
 const [currencyFilter, setCurrencyFilter] = useState('');
 const [pdfFilter, setPdfFilter] = useState<'all' | 'has-pdf' | 'no-pdf'>('all');
 const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);
 const [financeMessage, setFinanceMessage] = useState<string | null>(null);

 const itemsByInvoiceId = useMemo(() => {
 const map: Record<string, number> = {};
 for (const item of invoiceItems) {
 if (!map[item.invoiceId]) map[item.invoiceId] = 0;
 map[item.invoiceId]++;
 }
 return map;
 }, [invoiceItems]);

 const currencies = useMemo(() => {
 const set = new Set<string>();
 for (const inv of invoices) {
 if (inv.currency) set.add(inv.currency);
 }
 return Array.from(set).sort();
 }, [invoices]);

 const uniqueCompanies = useMemo(() => {
 const ids = new Set(invoices.map((inv) => inv.relatedCompanyId).filter(Boolean));
 return companies.filter((c) => ids.has(c.id));
 }, [invoices, companies]);

 const uniqueProjects = useMemo(() => {
 const ids = new Set(invoices.map((inv) => inv.relatedProjectId).filter(Boolean));
 return projects.filter((p) => ids.has(p.id));
 }, [invoices, projects]);

 const hasFinanceIncome = useMemo(() => {
 const map: Record<string, boolean> = {};
 for (const inc of financeIncome) {
 if (inc.source === 'invoice' && inc.sourceId) {
 map[inc.sourceId] = true;
 }
 }
 return map;
 }, [financeIncome]);

 const stats = useMemo(() => {
 const total = invoices.length;
 const paidCount = invoices.filter((inv) => inv.status === 'paid').length;
 const unpaidCount = invoices.filter((inv) => inv.status === 'unpaid' || inv.status === 'sent').length;
 const overdueCount = invoices.filter((inv) => inv.status === 'overdue').length;
 const totalPaid = invoices.filter((inv) => inv.status === 'paid').reduce((s, inv) => s + (inv.total || 0), 0);
 const totalPending = invoices.filter((inv) => inv.status === 'unpaid' || inv.status === 'sent' || inv.status === 'overdue').reduce((s, inv) => s + (inv.total || 0), 0);
 return { total, paidCount, unpaidCount, overdueCount, totalPaid, totalPending };
 }, [invoices]);

 const filteredInvoices = useMemo(() => {
 let list = invoices;
 if (searchQuery.trim()) {
 const q = searchQuery.toLowerCase();
 list = list.filter((inv) =>
 (inv.invoiceNumber || '').toLowerCase().includes(q) ||
 (inv.clientName || '').toLowerCase().includes(q) ||
 (inv.title || '').toLowerCase().includes(q) ||
 (inv.notes || '').toLowerCase().includes(q) ||
 (inv.relatedProjectName || '').toLowerCase().includes(q) ||
 (inv.relatedCompanyName || '').toLowerCase().includes(q)
 );
 }
 if (statusFilter) list = list.filter((inv) => inv.status === statusFilter);
 if (companyFilter) list = list.filter((inv) => inv.relatedCompanyId === companyFilter);
 if (projectFilter) list = list.filter((inv) => inv.relatedProjectId === projectFilter);
 if (currencyFilter) list = list.filter((inv) => inv.currency === currencyFilter);
 if (pdfFilter === 'has-pdf') list = list.filter((inv) => Boolean(inv.pdfStoragePath));
 if (pdfFilter === 'no-pdf') list = list.filter((inv) => !inv.pdfStoragePath);
 return list;
 }, [invoices, searchQuery, statusFilter, companyFilter, projectFilter, currencyFilter, pdfFilter]);

 const handleStatusUpdate = async (invoice: Invoice, status: string) => {
 await onUpdateInvoice(invoice.id, { status: status as InvoiceInput['status'] });
 };

 const handleCreateFinanceIncome = async (invoice: Invoice, isExpected: boolean) => {
 try {
 const payload: Partial<FinanceIncome> = {
 source: 'invoice',
 sourceId: invoice.invoiceNumber || invoice.id,
 description: `Invoice ${invoice.invoiceNumber || invoice.id} — ${invoice.clientName || 'Client'}`,
 amount: invoice.total || 0,
 currency: invoice.currency || 'MYR',
 date: invoice.issueDate || new Date().toISOString().slice(0, 10),
 periodId: financePeriods[0]?.id || undefined,
 type: isExpected ? 'expected' : 'actual',
 category: 'service',
 notes: isExpected
 ? `Expected income from invoice ${invoice.invoiceNumber || invoice.id}`
 : `Income from invoice ${invoice.invoiceNumber || invoice.id}`,
 };
 await onAddFinanceIncome(payload);
 setFinanceMessage(
 isExpected
 ? `Expected income created for invoice ${invoice.invoiceNumber || invoice.id}.`
 : `Finance income added for invoice ${invoice.invoiceNumber || invoice.id}.`,
 );
 } catch {
 setFinanceMessage('Failed to create finance record.');
 }
 setTimeout(() => setFinanceMessage(null), 4000);
 };

 const openStoredPdf = async (invoice: Invoice) => {
 const popup = window.open('about:blank', '_blank');
 try {
 const response = await fetch(`/api/documents?action=signed-url&sourceType=invoice&documentId=${encodeURIComponent(invoice.id)}`, {
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
 console.error('[Invoice Archive] PDF open failed', err);
 }
 };

 const inputClass = 'h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400';

 const renderStatusActions = (invoice: Invoice) => {
 const status = invoice.status;
 return (
 <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-neutral-200">
 {status === 'draft' || status === 'ready' ? (
 <button type="button" onClick={() => void handleStatusUpdate(invoice, 'sent')} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Mark Sent</button>
 ) : null}
 {status === 'sent' || status === 'unpaid' || status === 'overdue' ? (
 <button type="button" onClick={() => void handleStatusUpdate(invoice, 'paid')} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">Mark Paid</button>
 ) : null}
 {status === 'sent' || status === 'unpaid' ? (
 <button type="button" onClick={() => void handleStatusUpdate(invoice, 'overdue')} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">Mark Overdue</button>
 ) : null}
 {status === 'sent' || status === 'unpaid' || status === 'overdue' ? (
 <button type="button" onClick={() => void handleCreateFinanceIncome(invoice, true)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
 Create Expected Income
 </button>
 ) : null}
 {status === 'paid' ? (
 <button type="button" onClick={() => void handleCreateFinanceIncome(invoice, false)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
 Create Finance Income
 </button>
 ) : null}
 {status !== 'archived' && status !== 'cancelled' ? (
 <button type="button" onClick={() => void handleStatusUpdate(invoice, 'archived')} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">Archive</button>
 ) : null}
 {status === 'archived' ? (
 <button type="button" onClick={() => void handleStatusUpdate(invoice, 'draft')} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-600 hover:bg-neutral-50">Unarchive</button>
 ) : null}
 {status !== 'cancelled' ? (
 <button type="button" onClick={() => void handleStatusUpdate(invoice, 'cancelled')} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">Cancel</button>
 ) : null}
 </div>
 );
 };

 return (
 <div className="space-y-4">
 {financeMessage ? (
 <div className="rounded-md border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
 {financeMessage}
 </div>
 ) : null}

 <div className="grid gap-3 grid-cols-2 md:grid-cols-3 xl:grid-cols-6">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Total</div>
 <div className="mt-1.5 text-2xl font-bold text-neutral-900">{stats.total}</div>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Paid</div>
 <div className="mt-1.5 text-2xl font-bold text-neutral-900">{stats.paidCount}</div>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Unpaid</div>
 <div className="mt-1.5 text-2xl font-bold text-neutral-900">{stats.unpaidCount}</div>
 </div>
 <div className="rounded-xl border border-red-200 bg-red-50 p-4">
 <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-red-700">Overdue</div>
 <div className="mt-1.5 text-2xl font-bold text-red-700">{stats.overdueCount}</div>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Paid Amount</div>
 <div className="mt-1.5 text-lg font-bold text-neutral-900">{formatMoney(stats.totalPaid)}</div>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">Pending</div>
 <div className="mt-1.5 text-lg font-bold text-neutral-900">{formatMoney(stats.totalPending)}</div>
 </div>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="flex flex-wrap items-center justify-between gap-3">
 <div>
 <h3 className="text-lg font-semibold text-neutral-900">Invoice Archive</h3>
 <p className="mt-1 text-sm text-neutral-500">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} — search, filter, and manage</p>
 </div>
 <button type="button" onClick={onNewInvoice} className="rounded-md bg-neutral-900 px-3 py-2 text-sm font-medium text-white hover:bg-neutral-800">
 + New Invoice
 </button>
 </div>

 <div className="mt-4 grid gap-3 md:grid-cols-[1fr_140px_140px_140px_120px]">
 <input
 value={searchQuery}
 onChange={(event) => setSearchQuery(event.target.value)}
 placeholder="Search invoice number, client, project, or notes"
 className={inputClass}
 />
 <select
 value={statusFilter}
 onChange={(event) => setStatusFilter(event.target.value)}
 className={inputClass}
 >
 <option value="">All statuses</option>
 <option value="draft">Draft</option>
 <option value="ready">Ready</option>
 <option value="sent">Sent</option>
 <option value="paid">Paid</option>
 <option value="unpaid">Unpaid</option>
 <option value="overdue">Overdue</option>
 <option value="cancelled">Cancelled</option>
 <option value="archived">Archived</option>
 </select>
 <select
 value={companyFilter}
 onChange={(event) => setCompanyFilter(event.target.value)}
 className={inputClass}
 >
 <option value="">All companies</option>
 {uniqueCompanies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
 </select>
 <select
 value={projectFilter}
 onChange={(event) => setProjectFilter(event.target.value)}
 className={inputClass}
 >
 <option value="">All projects</option>
 {uniqueProjects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
 </select>
 <select
 value={pdfFilter}
 onChange={(event) => setPdfFilter(event.target.value as 'all' | 'has-pdf' | 'no-pdf')}
 className={inputClass}
 >
 <option value="all">All PDF</option>
 <option value="has-pdf">Has PDF</option>
 <option value="no-pdf">No PDF</option>
 </select>
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 {currencyFilter ? (
 <button type="button" onClick={() => setCurrencyFilter('')} className="rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
 Currency: {currencyFilter} ✕
 </button>
 ) : (
 <select
 value={currencyFilter}
 onChange={(event) => setCurrencyFilter(event.target.value)}
 className={inputClass}
 style={{ width: 'auto', minWidth: '130px' }}
 >
 <option value="">All currencies</option>
 {currencies.map((cur) => <option key={cur} value={cur}>{cur}</option>)}
 </select>
 )}
 </div>
 </div>

 {filteredInvoices.length === 0 ? (
 <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 p-10 text-center text-sm text-neutral-500">
 {searchQuery || statusFilter || companyFilter || projectFilter || pdfFilter !== 'all' || currencyFilter
 ? 'No invoices match the current filters.'
 : 'No invoices yet. Create your first invoice.'}
 </div>
 ) : (
 <div className="space-y-3">
 {filteredInvoices.map((invoice) => {
 const itemCount = itemsByInvoiceId[invoice.id] || 0;
 const isExpanded = openInvoiceId === invoice.id;
 const hasPdf = Boolean(invoice.pdfStoragePath);
 const hasFin = hasFinanceIncome[invoice.invoiceNumber || invoice.id] || false;

 return (
 <div key={invoice.id} className="rounded-xl border border-neutral-200 bg-white">
 <div className="p-5">
 <div className="flex flex-wrap items-start justify-between gap-4">
 <div className="min-w-0 flex-1">
 <div className="flex flex-wrap items-center gap-2">
 <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-semibold text-neutral-700">
 {invoice.invoiceNumber || 'No number'}
 </span>
 <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(invoice.status || 'draft')}`}>
 {invoice.status || 'draft'}
 </span>
 {hasPdf ? (
 <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
 PDF stored
 </span>
 ) : null}
 {hasFin ? (
 <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
 Fin
 </span>
 ) : null}
 {invoice.relatedProjectName ? (
 <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-xs font-medium text-neutral-600">
 {invoice.relatedProjectName}
 </span>
 ) : null}
 {invoice.relatedCompanyName ? (
 <span className="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-xs font-medium text-neutral-600">
 {invoice.relatedCompanyName}
 </span>
 ) : null}
 </div>
 <h4 className="mt-3 text-lg font-semibold text-neutral-900">{invoice.title}</h4>
 <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-neutral-500">
 <span className="font-medium text-neutral-900">{invoice.clientName || 'Client not set'}</span>
 <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
 <span className="font-semibold text-neutral-900">{formatMoney(invoice.total, invoice.currency || brandSettings?.defaultCurrency || 'MYR')}</span>
 </div>
 <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
 <span>Issued {formatDate(invoice.issueDate)}</span>
 <span>Due {formatDate(invoice.dueDate)}</span>
 <span>Updated {formatDate(invoice.updatedAt || invoice.createdAt)}</span>
 <span>{invoice.currency || 'MYR'}</span>
 </div>
 </div>
 <div className="flex flex-wrap gap-2 shrink-0">
 <button type="button" onClick={() => onPreviewInvoice(invoice.id)} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
 Preview
 </button>
 <button type="button" onClick={() => onEditInvoice(invoice.id)} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
 Edit
 </button>
 {hasPdf ? (
 <button type="button" onClick={() => void openStoredPdf(invoice)} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
 Open PDF
 </button>
 ) : null}
 <button
 type="button"
 onClick={() => setOpenInvoiceId(isExpanded ? null : invoice.id)}
 className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-xs font-medium text-neutral-700 hover:bg-neutral-50"
 >
 {isExpanded ? 'Less' : 'More'}
 </button>
 </div>
 </div>

 {isExpanded ? (
 <div className="mt-4 space-y-4">
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
 <InfoBlock label="Seller" value={invoice.sellerName || brandSettings?.brandName || '—'} />
 <InfoBlock label="Client" value={invoice.clientName || '—'} />
 <InfoBlock label="Project" value={invoice.relatedProjectName || '—'} />
 <InfoBlock label={t("Company", "Company", "Company")} value={invoice.relatedCompanyName || '—'} />
 </div>
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
 <InfoBlock label={t("Person", "Person", "Person")} value={invoice.relatedPersonName || '—'} />
 <InfoBlock label="Deal" value={invoice.relatedDealName || '—'} />
 <InfoBlock label="Generated Doc" value={invoice.generatedDocumentId ? 'Linked' : '—'} />
 </div>
 <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
 <InfoBlock label="Finance Income" value={hasFin ? 'Linked' : '—'} />
 <InfoBlock label="PDF" value={hasPdf ? 'Stored' : '—'} />
 <InfoBlock label="Invoice Total" value={formatMoney(invoice.total, invoice.currency || 'MYR')} />
 </div>
 {renderStatusActions(invoice)}
 <div className="border-t border-neutral-200 pt-3 flex justify-end">
 <button type="button" onClick={() => void onDeleteInvoice(invoice.id)} className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100">
 Delete Invoice
 </button>
 </div>
 </div>
 ) : null}
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
};

const InfoBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
 <div className="rounded-md border border-neutral-200 bg-neutral-50 p-3">
 <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-neutral-500">{label}</div>
 <div className="mt-1.5 text-sm font-medium text-neutral-900 truncate">{value}</div>
 </div>
);

export default InvoiceArchivePanel;
