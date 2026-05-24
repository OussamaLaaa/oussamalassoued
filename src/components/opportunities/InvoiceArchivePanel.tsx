import React, { useMemo, useState } from 'react';
import type { DocumentBrandSettings, Invoice, InvoiceInput, InvoiceItem } from '../../types/opportunities';

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
    draft: 'bg-[#f8fafc] text-[#475569] border-[#e5e7eb]',
    ready: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
    sent: 'bg-[#eff6ff] text-[#1d4ed8] border-[#bfdbfe]',
    paid: 'bg-[#f0fdf4] text-[#166534] border-[#bbf7d0]',
    unpaid: 'bg-[#fffbeb] text-[#92400e] border-[#fde68a]',
    overdue: 'bg-[#fff1f2] text-[#b91c1c] border-[#fecaca]',
    cancelled: 'bg-[#f8fafc] text-[#64748b] border-[#e5e7eb]',
    archived: 'bg-[#f8fafc] text-[#64748b] border-[#e5e7eb]',
  };
  return styles[status] || 'bg-[#f8fafc] text-[#475569] border-[#e5e7eb]';
};

type InvoiceArchivePanelProps = {
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  brandSettings?: DocumentBrandSettings | null;
  onNewInvoice: () => void;
  onEditInvoice: (id: string) => void;
  onPreviewInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => Promise<void>;
  onUpdateInvoice: (id: string, input: Partial<InvoiceInput>) => Promise<Invoice>;
};

const InvoiceArchivePanel: React.FC<InvoiceArchivePanelProps> = ({
  invoices,
  invoiceItems,
  brandSettings,
  onNewInvoice,
  onEditInvoice,
  onPreviewInvoice,
  onDeleteInvoice,
  onUpdateInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currencyFilter, setCurrencyFilter] = useState('');
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);

  const currencies = useMemo(() => {
    const set = new Set(invoices.map((inv) => inv.currency || 'MYR').filter(Boolean));
    return Array.from(set).sort();
  }, [invoices]);

  const itemsByInvoiceId = useMemo(() => {
    const result: Record<string, number> = {};
    for (const item of invoiceItems) {
      result[item.invoiceId] = (result[item.invoiceId] || 0) + 1;
    }
    return result;
  }, [invoiceItems]);

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...invoices]
      .filter((invoice) => {
        if (statusFilter && invoice.status !== statusFilter) return false;
        if (currencyFilter && invoice.currency !== currencyFilter) return false;
        if (!query) return true;

        const haystack = [
          invoice.invoiceNumber,
          invoice.title,
          invoice.clientName,
          invoice.relatedCompanyName,
          invoice.relatedProjectName,
          invoice.relatedPersonName,
          invoice.relatedDealName,
          invoice.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(query);
      })
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0).getTime() - new Date(a.updatedAt || a.createdAt || 0).getTime());
  }, [invoices, searchQuery, statusFilter, currencyFilter]);

  const openStoredPdf = async (invoice: Invoice) => {
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await fetch(`/api/documents?action=signed-url&invoiceId=${encodeURIComponent(invoice.id)}`, {
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
      if (popup) popup.close();
      console.error('[Invoice Archive] Failed to open stored PDF', error);
    }
  };

  const handleStatusUpdate = async (invoice: Invoice, newStatus: InvoiceInput['status']) => {
    try {
      await onUpdateInvoice(invoice.id, { status: newStatus });
    } catch (err) {
      console.error('[Invoice Archive] Status update failed', err);
    }
  };

  const renderStatusActions = (invoice: Invoice) => {
    const status = invoice.status;
    return (
      <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[#e5e7eb]">
        {status === 'draft' || status === 'ready' ? (
          <button type="button" onClick={() => void handleStatusUpdate(invoice, 'sent')} className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-medium text-[#1d4ed8] hover:bg-[#dbeafe]">Mark Sent</button>
        ) : null}
        {status === 'sent' || status === 'unpaid' || status === 'overdue' ? (
          <button type="button" onClick={() => void handleStatusUpdate(invoice, 'paid')} className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-medium text-[#166534] hover:bg-[#dcfce7]">Mark Paid</button>
        ) : null}
        {status === 'sent' || status === 'unpaid' ? (
          <button type="button" onClick={() => void handleStatusUpdate(invoice, 'overdue')} className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-1.5 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e6]">Mark Overdue</button>
        ) : null}
        {status !== 'archived' && status !== 'cancelled' ? (
          <button type="button" onClick={() => void handleStatusUpdate(invoice, 'archived')} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] px-3 py-1.5 text-xs font-medium text-[#475569] hover:bg-[#eef2f7]">Archive</button>
        ) : null}
        {status === 'archived' ? (
          <button type="button" onClick={() => void handleStatusUpdate(invoice, 'draft')} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] px-3 py-1.5 text-xs font-medium text-[#475569] hover:bg-[#eef2f7]">Unarchive</button>
        ) : null}
        {status !== 'cancelled' ? (
          <button type="button" onClick={() => void handleStatusUpdate(invoice, 'cancelled')} className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-1.5 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e6]">Cancel</button>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[#0f172a]">Invoice Archive</h3>
            <p className="mt-1 text-sm text-[#64748b]">{invoices.length} invoice{invoices.length !== 1 ? 's' : ''} — search, filter, and manage status</p>
          </div>
          <button type="button" onClick={onNewInvoice} className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e293b]">
            + New Invoice
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_180px_160px]">
          <input
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search invoice number, client, project, or notes"
            className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
          />
          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
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
            value={currencyFilter}
            onChange={(event) => setCurrencyFilter(event.target.value)}
            className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-4 focus:ring-[#dbeafe]"
          >
            <option value="">All currencies</option>
            {currencies.map((cur) => <option key={cur} value={cur}>{cur}</option>)}
          </select>
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dbe3ef] bg-[#fafcff] p-10 text-center text-sm text-[#64748b]">
          {searchQuery || statusFilter || currencyFilter
            ? 'No invoices match the current filters.'
            : 'No invoices yet. Create your first invoice.'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => {
            const itemCount = itemsByInvoiceId[invoice.id] || 0;
            const isExpanded = openInvoiceId === invoice.id;

            return (
              <div key={invoice.id} className="rounded-3xl border border-[#e5e7eb] bg-white shadow-[0_2px_8px_rgba(15,23,42,0.04)]">
                <div className="p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-0.5 text-xs font-semibold text-[#1d4ed8]">
                          {invoice.invoiceNumber || 'No number'}
                        </span>
                        <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize ${statusBadge(invoice.status || 'draft')}`}>
                          {invoice.status || 'draft'}
                        </span>
                        {invoice.pdfStoragePath ? (
                          <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-medium text-[#166534]">
                            PDF stored
                          </span>
                        ) : null}
                        {invoice.relatedProjectName ? (
                          <span className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-0.5 text-xs font-medium text-[#475569]">
                            {invoice.relatedProjectName}
                          </span>
                        ) : null}
                        {invoice.relatedCompanyName ? (
                          <span className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-0.5 text-xs font-medium text-[#475569]">
                            {invoice.relatedCompanyName}
                          </span>
                        ) : null}
                      </div>
                      <h4 className="mt-3 text-lg font-semibold text-[#0f172a]">{invoice.title}</h4>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#64748b]">
                        <span className="font-medium text-[#0f172a]">{invoice.clientName || 'Client not set'}</span>
                        <span>{itemCount} item{itemCount !== 1 ? 's' : ''}</span>
                        <span className="font-semibold text-[#0f172a]">{formatMoney(invoice.total, invoice.currency || brandSettings?.defaultCurrency || 'MYR')}</span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#64748b]">
                        <span>Issued {formatDate(invoice.issueDate)}</span>
                        <span>Due {formatDate(invoice.dueDate)}</span>
                        <span>Updated {formatDate(invoice.updatedAt || invoice.createdAt)}</span>
                        <span>{invoice.currency || 'MYR'}</span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      <button type="button" onClick={() => onPreviewInvoice(invoice.id)} className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-xs font-medium text-[#1d4ed8] hover:bg-[#dbeafe]">
                        Preview
                      </button>
                      <button type="button" onClick={() => onEditInvoice(invoice.id)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-xs font-medium text-[#334155] hover:bg-[#f8fafc]">
                        Edit
                      </button>
                      {invoice.pdfStoragePath ? (
                        <button type="button" onClick={() => void openStoredPdf(invoice)} className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-xs font-medium text-[#166534] hover:bg-[#dcfce7]">
                          Open PDF
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => setOpenInvoiceId(isExpanded ? null : invoice.id)}
                        className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-medium text-[#334155] hover:bg-[#f8fafc]"
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
                        <InfoBlock label="Company" value={invoice.relatedCompanyName || '—'} />
                      </div>
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        <InfoBlock label="Person" value={invoice.relatedPersonName || '—'} />
                        <InfoBlock label="Deal" value={invoice.relatedDealName || '—'} />
                        <InfoBlock label="Generated Doc" value={invoice.generatedDocumentId ? 'Linked' : '—'} />
                      </div>
                      {renderStatusActions(invoice)}
                      <div className="border-t border-[#e5e7eb] pt-3 flex justify-end">
                        <button type="button" onClick={() => void onDeleteInvoice(invoice.id)} className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-1.5 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e6]">
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
  <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-3">
    <div className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#64748b]">{label}</div>
    <div className="mt-1.5 text-sm font-medium text-[#0f172a] truncate">{value}</div>
  </div>
);

export default InvoiceArchivePanel;
