import React, { useMemo, useState } from 'react';
import type { DocumentBrandSettings, Invoice, InvoiceItem } from '../../types/opportunities';

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

type InvoiceArchivePanelProps = {
  invoices: Invoice[];
  invoiceItems: InvoiceItem[];
  brandSettings?: DocumentBrandSettings | null;
  onNewInvoice: () => void;
  onEditInvoice: (id: string) => void;
  onPreviewInvoice: (id: string) => void;
  onDeleteInvoice: (id: string) => Promise<void>;
};

const InvoiceArchivePanel: React.FC<InvoiceArchivePanelProps> = ({
  invoices,
  invoiceItems,
  brandSettings,
  onNewInvoice,
  onEditInvoice,
  onPreviewInvoice,
  onDeleteInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [openInvoiceId, setOpenInvoiceId] = useState<string | null>(null);

  const itemsByInvoiceId = useMemo(() => {
    return invoiceItems.reduce<Record<string, number>>((accumulator, item) => {
      accumulator[item.invoiceId] = (accumulator[item.invoiceId] || 0) + 1;
      return accumulator;
    }, {});
  }, [invoiceItems]);

  const filteredInvoices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return [...invoices]
      .filter((invoice) => {
        if (statusFilter && invoice.status !== statusFilter) return false;
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
  }, [invoices, searchQuery, statusFilter]);

  const openStoredPdf = async (invoice: Invoice) => {
    const popup = window.open('about:blank', '_blank');
    try {
      const response = await fetch(`/api/document-pdf-upload?invoiceId=${encodeURIComponent(invoice.id)}`, {
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

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-semibold text-[#0f172a]">Invoice Archive</h3>
            <p className="mt-1 text-sm text-[#64748b]">Search, reopen, preview, and manage previously created invoices.</p>
          </div>
          <button type="button" onClick={onNewInvoice} className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">
            New Invoice
          </button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-[1fr_220px]">
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
        </div>
      </div>

      {filteredInvoices.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#dbe3ef] bg-[#fafcff] p-6 text-sm text-[#64748b]">
          No invoices match the current filters.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredInvoices.map((invoice) => {
            const itemCount = itemsByInvoiceId[invoice.id] || 0;
            const isExpanded = openInvoiceId === invoice.id;

            return (
              <div key={invoice.id} className="rounded-3xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-2.5 py-0.5 text-xs font-medium text-[#1d4ed8]">
                        {invoice.invoiceNumber || 'No number'}
                      </span>
                      <span className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-0.5 text-xs font-medium text-[#475569] capitalize">
                        {invoice.status}
                      </span>
                      {invoice.pdfStoragePath ? (
                        <span className="rounded-full border border-[#bbf7d0] bg-[#f0fdf4] px-2.5 py-0.5 text-xs font-medium text-[#166534]">
                          PDF stored
                        </span>
                      ) : null}
                    </div>
                    <h4 className="mt-3 text-lg font-semibold text-[#0f172a]">{invoice.title}</h4>
                    <div className="mt-2 flex flex-wrap gap-3 text-sm text-[#64748b]">
                      <span>{invoice.clientName || 'Client not set'}</span>
                      <span>Items: {itemCount}</span>
                      <span>{formatMoney(invoice.total, invoice.currency || brandSettings?.defaultCurrency || 'MYR')}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-[#64748b]">
                      <span>Issue: {formatDate(invoice.issueDate)}</span>
                      <span>Due: {formatDate(invoice.dueDate)}</span>
                      <span>Updated: {formatDate(invoice.updatedAt || invoice.createdAt)}</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => onPreviewInvoice(invoice.id)} className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-xs font-medium text-[#1d4ed8] hover:bg-[#dbeafe]">
                      Preview
                    </button>
                    <button type="button" onClick={() => onEditInvoice(invoice.id)} className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-2 text-xs font-medium text-[#334155] hover:bg-[#f8fafc]">
                      Edit
                    </button>
                    <button type="button" onClick={() => void openStoredPdf(invoice)} className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-2 text-xs font-medium text-[#166534] hover:bg-[#dcfce7]">
                      Open Stored PDF
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenInvoiceId(isExpanded ? null : invoice.id)}
                      className="rounded-lg border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-medium text-[#334155] hover:bg-[#f8fafc]"
                    >
                      {isExpanded ? 'Hide details' : 'Details'}
                    </button>
                    <button type="button" onClick={() => void onDeleteInvoice(invoice.id)} className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e6]">
                      Delete
                    </button>
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <InfoBlock label="Seller" value={invoice.sellerName || brandSettings?.brandName || '—'} />
                    <InfoBlock label="Client" value={invoice.clientName || '—'} />
                    <InfoBlock label="Project" value={invoice.relatedProjectName || '—'} />
                    <InfoBlock label="Deal" value={invoice.relatedDealName || '—'} />
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const InfoBlock: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
    <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">{label}</div>
    <div className="mt-2 text-sm font-medium text-[#0f172a]">{value}</div>
  </div>
);

export default InvoiceArchivePanel;
