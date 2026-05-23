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
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
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
  const taxAmount = safeInvoice?.taxAmount ?? (taxableAmount * taxRate) / 100;
  const total = safeInvoice?.total ?? Math.max(0, taxableAmount + taxAmount);

  return (
    <div ref={ref} className={className || ''}>
      <div className="mx-auto w-full max-w-[840px] rounded-[28px] border border-[#dbe3ef] bg-white px-9 py-9 text-[#0f172a] shadow-[0_24px_60px_rgba(15,23,42,0.08)] print:rounded-none print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-8">
          <div className="flex-1">
            {safeInvoice?.sellerLogoUrl ? (
              <img
                src={safeInvoice.sellerLogoUrl}
                alt="Logo"
                className="mb-4 h-14 w-auto rounded-lg object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            ) : null}
            <h1 className="text-3xl font-bold tracking-[-0.03em] text-[#0f172a]">
              {safeInvoice?.sellerName || brandSettings?.brandName || 'Your Company'}
            </h1>
            <div className="mt-2 text-sm leading-6 text-[#475569] space-y-0.5">
              {safeInvoice?.sellerEmail || brandSettings?.email ? <div>{safeInvoice?.sellerEmail || brandSettings?.email}</div> : null}
              {safeInvoice?.sellerPhone || brandSettings?.phone ? <div>{safeInvoice?.sellerPhone || brandSettings?.phone}</div> : null}
              {safeInvoice?.sellerAddress ? <div className="whitespace-pre-wrap">{safeInvoice.sellerAddress}</div> : null}
              <div className="flex gap-2 text-xs text-[#64748b]">
                {safeInvoice?.sellerCity ? <span>{safeInvoice.sellerCity}</span> : null}
                {safeInvoice?.sellerState ? <span>{safeInvoice.sellerState}</span> : null}
                {safeInvoice?.sellerZip ? <span>{safeInvoice.sellerZip}</span> : null}
              </div>
              {safeInvoice?.sellerTaxId ? <div className="text-xs text-[#64748b]">Tax ID: {safeInvoice.sellerTaxId}</div> : null}
            </div>
          </div>

          <div className="min-w-[240px] rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748b]">Invoice</div>
            <div className="mt-4 space-y-2.5 text-sm">
              <div className="flex items-center justify-between gap-4 border-b border-[#e5e7eb] pb-2">
                <span className="text-[#64748b]">Number</span>
                <span className="font-semibold text-[#0f172a]">{safeInvoice?.invoiceNumber || '—'}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#64748b]">Date</span>
                <span className="font-medium text-[#0f172a]">{formatDate(safeInvoice?.issueDate)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#64748b]">Due Date</span>
                <span className="font-medium text-[#0f172a]">{formatDate(safeInvoice?.dueDate)}</span>
              </div>
              <div className="flex items-center justify-between gap-4 pt-1">
                <span className="text-[#64748b]">Currency</span>
                <span className="font-medium text-[#0f172a]">{currency}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748b]">Bill To</div>
            <div className="mt-3 space-y-1 text-sm text-[#334155]">
              <div className="text-base font-semibold text-[#0f172a]">{safeInvoice?.clientName || 'Client name'}</div>
              {safeInvoice?.clientEmail ? <div>{safeInvoice.clientEmail}</div> : null}
              {safeInvoice?.clientPhone ? <div>{safeInvoice.clientPhone}</div> : null}
              {safeInvoice?.clientAddress ? <div className="whitespace-pre-wrap">{safeInvoice.clientAddress}</div> : null}
              <div className="flex gap-2 text-xs text-[#64748b]">
                {safeInvoice?.clientCity ? <span>{safeInvoice.clientCity}</span> : null}
                {safeInvoice?.clientState ? <span>{safeInvoice.clientState}</span> : null}
                {safeInvoice?.clientZip ? <span>{safeInvoice.clientZip}</span> : null}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-[#0f172a]">
                <th className="pb-3 font-semibold text-[#0f172a]">Description</th>
                <th className="pb-3 font-semibold text-[#0f172a] text-right">Qty</th>
                <th className="pb-3 font-semibold text-[#0f172a] text-right">Rate</th>
                <th className="pb-3 font-semibold text-[#0f172a] text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.length > 0 ? items.map((item) => (
                <tr key={item.id} className="border-b border-[#e5e7eb]">
                  <td className="py-3 pr-4 text-[#0f172a]">
                    <div className="font-medium">{item.description}</div>
                    {item.sortOrder != null ? <div className="mt-0.5 text-xs text-[#64748b]">Line #{item.sortOrder}</div> : null}
                  </td>
                  <td className="py-3 text-right text-[#334155]">{Number(item.quantity || 0).toFixed(2)}</td>
                  <td className="py-3 text-right text-[#334155]">{formatMoney(Number(item.rate || 0), currency)}</td>
                  <td className="py-3 text-right font-medium text-[#0f172a]">{formatMoney(getLineTotal(item), currency)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-sm text-[#64748b]">Add invoice line items to build the preview.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-[1.3fr_1fr]">
          <div className="space-y-4 text-sm text-[#334155]">
            {safeInvoice?.terms ? (
              <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748b]">Terms</div>
                <div className="mt-2 whitespace-pre-wrap leading-6 text-[#475569]">{safeInvoice.terms}</div>
              </div>
            ) : null}
            {safeInvoice?.notes ? (
              <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
                <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748b]">Notes</div>
                <div className="mt-2 whitespace-pre-wrap leading-6 text-[#475569]">{safeInvoice.notes}</div>
              </div>
            ) : null}
          </div>

          <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-5">
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#64748b]">Subtotal</span>
                <span className="font-medium text-[#0f172a]">{formatMoney(subtotal, currency)}</span>
              </div>
              {discountAmount > 0 ? (
                <div className="flex items-center justify-between gap-4">
                  <span className="text-[#64748b]">Discount</span>
                  <span className="font-medium text-[#0f172a]">-{formatMoney(discountAmount, currency)}</span>
                </div>
              ) : null}
              <div className="flex items-center justify-between gap-4">
                <span className="text-[#64748b]">Tax {taxRate > 0 ? `(${taxRate.toFixed(2)}%)` : ''}</span>
                <span className="font-medium text-[#0f172a]">{formatMoney(taxAmount, currency)}</span>
              </div>
              <div className="border-t border-[#e5e7eb] pt-3 flex items-center justify-between gap-4">
                <span className="font-semibold text-[#0f172a]">Total</span>
                <span className="text-lg font-bold text-[#0f172a]">{formatMoney(total, currency)}</span>
              </div>
            </div>
          </div>
        </div>

        {brandSettings?.signatureUrl ? (
          <div className="mt-8 border-t border-[#e5e7eb] pt-5">
            <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#64748b]">Authorized Signature</div>
            <img src={brandSettings.signatureUrl} alt="Signature" className="mt-2 h-12 w-auto object-contain" />
            {brandSettings.signatureName ? <div className="mt-1 text-sm text-[#475569]">{brandSettings.signatureName}</div> : null}
          </div>
        ) : null}

        <div className="mt-8 border-t border-[#e5e7eb] pt-5 flex flex-wrap items-center justify-between gap-4 text-xs text-[#64748b]">
          <div className="font-medium">{brandSettings?.brandName || safeInvoice?.sellerName || 'Invoice'}</div>
          <div>{brandSettings?.website || brandSettings?.email || 'Thank you for your business'}</div>
        </div>
      </div>
    </div>
  );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
