import React, { forwardRef } from 'react';
import type { DocumentBrandSettings, Invoice, InvoiceItem } from '../../types/opportunities';

const formatMoney = (amount: number, currency = 'MYR') => {
  const value = Number.isFinite(amount) ? amount : 0;

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency || 'MYR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency || 'MYR'} ${value.toFixed(2)}`;
  }
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString();
};

const safeNumber = (value?: number) => (Number.isFinite(Number(value)) ? Number(value) : 0);

const getLineTotal = (item: InvoiceItem) => {
  const quantity = safeNumber(item.quantity);
  const rate = safeNumber(item.rate);
  const amount = safeNumber(item.amount);
  return amount > 0 ? amount : quantity * rate;
};

type InvoicePreviewProps = {
  invoice: Invoice | null;
  items: InvoiceItem[];
  brandSettings?: DocumentBrandSettings | null;
  className?: string;
};

const InvoicePreview = forwardRef<HTMLDivElement, InvoicePreviewProps>(({ invoice, items, brandSettings, className }, ref) => {
  const safeInvoice = invoice;
  const currency = safeInvoice?.currency || brandSettings?.defaultCurrency || 'MYR';
  const subtotal = safeInvoice?.subtotal ?? items.reduce((sum, item) => sum + getLineTotal(item), 0);
  const discountAmount = safeInvoice?.discountAmount ?? 0;
  const taxableAmount = Math.max(0, subtotal - discountAmount);
  const taxRate = safeInvoice?.taxRate ?? 0;
  const taxAmount = safeInvoice?.taxAmount ?? taxableAmount * (taxRate / 100);
  const total = safeInvoice?.total ?? Math.max(0, taxableAmount + taxAmount);

  return (
    <div ref={ref} className={className || ''}>
      <div className="mx-auto w-full max-w-[840px] rounded-[28px] border border-[#dbe3ef] bg-white px-7 py-8 text-[#0f172a] shadow-[0_24px_60px_rgba(15,23,42,0.08)] print:rounded-none print:border-0 print:shadow-none">
        <div className="flex flex-wrap items-start justify-between gap-6 border-b border-[#e5e7eb] pb-6">
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#1d4ed8]">
              Invoice
            </div>
            <div>
              <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[#0f172a]">{safeInvoice?.title || 'Untitled Invoice'}</h1>
              <p className="mt-2 max-w-xl text-sm leading-6 text-[#475569]">
                {brandSettings?.brandName || 'Your studio'} billing summary and line items in a clean, print-ready format.
              </p>
            </div>
          </div>

          <div className="min-w-[220px] rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Invoice Details</div>
            <div className="mt-3 space-y-2 text-sm text-[#334155]">
              <div className="flex items-center justify-between gap-4"><span className="text-[#64748b]">Number</span><span className="font-medium">{safeInvoice?.invoiceNumber || '—'}</span></div>
              <div className="flex items-center justify-between gap-4"><span className="text-[#64748b]">Status</span><span className="font-medium capitalize">{safeInvoice?.status || 'draft'}</span></div>
              <div className="flex items-center justify-between gap-4"><span className="text-[#64748b]">Issue Date</span><span className="font-medium">{formatDate(safeInvoice?.issueDate)}</span></div>
              <div className="flex items-center justify-between gap-4"><span className="text-[#64748b]">Due Date</span><span className="font-medium">{formatDate(safeInvoice?.dueDate)}</span></div>
              <div className="flex items-center justify-between gap-4"><span className="text-[#64748b]">Currency</span><span className="font-medium">{currency}</span></div>
            </div>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Seller</div>
            <div className="mt-3 space-y-1 text-sm text-[#334155]">
              <div className="text-base font-semibold text-[#0f172a]">{safeInvoice?.sellerName || brandSettings?.brandName || 'Seller name'}</div>
              <div>{safeInvoice?.sellerEmail || brandSettings?.email || 'seller@email.com'}</div>
              <div>{safeInvoice?.sellerPhone || brandSettings?.phone || '—'}</div>
              <div className="whitespace-pre-wrap">{safeInvoice?.sellerAddress || brandSettings?.address || 'Seller address'}</div>
              <div className="flex flex-wrap gap-3 text-xs text-[#64748b]">
                <span>{safeInvoice?.sellerCity || 'City'}</span>
                <span>{safeInvoice?.sellerState || 'State'}</span>
                <span>{safeInvoice?.sellerZip || 'ZIP'}</span>
              </div>
              <div className="text-xs text-[#64748b]">Tax ID: {safeInvoice?.sellerTaxId || '—'}</div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Bill To</div>
            <div className="mt-3 space-y-1 text-sm text-[#334155]">
              <div className="text-base font-semibold text-[#0f172a]">{safeInvoice?.clientName || 'Client name'}</div>
              <div>{safeInvoice?.clientEmail || 'client@email.com'}</div>
              <div>{safeInvoice?.clientPhone || '—'}</div>
              <div className="whitespace-pre-wrap">{safeInvoice?.clientAddress || 'Client address'}</div>
              <div className="flex flex-wrap gap-3 text-xs text-[#64748b]">
                <span>{safeInvoice?.clientCity || 'City'}</span>
                <span>{safeInvoice?.clientState || 'State'}</span>
                <span>{safeInvoice?.clientZip || 'ZIP'}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-[22px] border border-[#e5e7eb]">
          <table className="w-full border-separate border-spacing-0 text-left text-sm">
            <thead className="bg-[#0f172a] text-white">
              <tr>
                <th className="px-4 py-3 font-medium">Description</th>
                <th className="px-4 py-3 font-medium text-right">Qty</th>
                <th className="px-4 py-3 font-medium text-right">Rate</th>
                <th className="px-4 py-3 font-medium text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item) => (
                <tr key={item.id} className="border-t border-[#e5e7eb] odd:bg-[#fafcff]">
                  <td className="px-4 py-3 align-top text-[#0f172a]">
                    <div className="font-medium">{item.description}</div>
                    {item.sortOrder != null ? <div className="mt-1 text-xs text-[#64748b]">Line #{item.sortOrder}</div> : null}
                  </td>
                  <td className="px-4 py-3 align-top text-right text-[#334155]">{Number(item.quantity || 0).toFixed(2)}</td>
                  <td className="px-4 py-3 align-top text-right text-[#334155]">{formatMoney(Number(item.rate || 0), currency)}</td>
                  <td className="px-4 py-3 align-top text-right font-medium text-[#0f172a]">{formatMoney(getLineTotal(item), currency)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-sm text-[#64748b]">Add invoice line items to build the preview.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4 text-sm text-[#334155]">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Terms</div>
            <div className="mt-2 whitespace-pre-wrap leading-6 text-[#475569]">{safeInvoice?.terms || 'Payment terms and conditions appear here.'}</div>
            <div className="mt-4 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#64748b]">Notes</div>
            <div className="mt-2 whitespace-pre-wrap leading-6 text-[#475569]">{safeInvoice?.notes || 'Optional notes or delivery instructions.'}</div>
          </div>

          <div className="rounded-2xl border border-[#0f172a] bg-[#0f172a] p-4 text-white">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#cbd5e1]">Summary</div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4"><span className="text-[#cbd5e1]">Subtotal</span><span className="font-medium">{formatMoney(subtotal, currency)}</span></div>
              <div className="flex items-center justify-between gap-4"><span className="text-[#cbd5e1]">Discount</span><span className="font-medium">{formatMoney(discountAmount, currency)}</span></div>
              <div className="flex items-center justify-between gap-4"><span className="text-[#cbd5e1]">Tax {taxRate ? `(${taxRate.toFixed(2)}%)` : ''}</span><span className="font-medium">{formatMoney(taxAmount, currency)}</span></div>
              <div className="my-3 h-px bg-white/15" />
              <div className="flex items-center justify-between gap-4 text-base"><span className="font-medium">Total</span><span className="font-semibold">{formatMoney(total, currency)}</span></div>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#e5e7eb] pt-5 text-xs text-[#64748b]">
          <div>{brandSettings?.brandName || 'Invoice Studio'}</div>
          <div>{brandSettings?.website || brandSettings?.email || 'Prepared for digital delivery and PDF export'}</div>
        </div>
      </div>
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
