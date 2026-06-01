import React, { forwardRef } from 'react';
import type { DocumentBrandSettings, Invoice, InvoiceItem } from '../../types/opportunities';

const formatMoney = (amount: number, currency = 'MYR') => {
 const value = Number.isFinite(amount) ? amount : 0;
 const cur = (currency || 'MYR').toUpperCase();
 if (cur === 'USD') return `$${value.toFixed(2)}`;
 if (cur === 'EUR') return `€${value.toFixed(2)}`;
 if (cur === 'TND') return `${value.toFixed(2)} TND`;
 return `${cur} ${value.toFixed(2)}`;
};

const formatDate = (value?: string) => {
 if (!value) return '—';
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return value;
 return date.toLocaleDateString('en-US', { year: 'numeric', month: 'numeric', day: 'numeric' });
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
 const taxAmount = safeInvoice?.taxAmount ?? Math.round(taxableAmount * taxRate * 100) / 10000;
 const total = safeInvoice?.total ?? Math.max(0, taxableAmount + taxAmount);

 const terms = safeInvoice?.terms?.trim() || brandSettings?.paymentNotes?.trim();

 return (
 <div ref={ref} className={`invoice-pdf-page ${className || ''}`}>
 <div className="mx-auto w-full max-w-[900px] rounded-xl border border-[#e5e7eb] bg-white px-10 py-10 text-[#0f172a] print:rounded-none print:border-0 print:shadow-none">
 <div className="flex items-start justify-between gap-8">
 <div className="flex-1">
 <h1 className="text-3xl font-bold text-[#0f172a]">
 {safeInvoice?.sellerName || brandSettings?.brandName || 'Your Company'}
 </h1>
 <div className="mt-2 space-y-0.5 text-sm leading-relaxed text-[#334155]">
 {safeInvoice?.sellerAddress ? <div className="whitespace-pre-wrap">{safeInvoice.sellerAddress}</div> : null}
 <div className="flex gap-1 text-[#64748b]">
 {safeInvoice?.sellerCity ? <span>{safeInvoice.sellerCity}</span> : null}
 {safeInvoice?.sellerState ? <span>{safeInvoice.sellerState ? (safeInvoice.sellerCity ? ',' : '') + ' ' + safeInvoice.sellerState : null}</span> : null}
 {safeInvoice?.sellerZip ? <span>{safeInvoice.sellerZip}</span> : null}
 </div>
 {safeInvoice?.sellerEmail ? <div>{safeInvoice.sellerEmail}</div> : null}
 {safeInvoice?.sellerPhone ? <div>{safeInvoice.sellerPhone}</div> : null}
 {safeInvoice?.sellerTaxId ? <div className="text-xs text-[#64748b]">Tax ID: {safeInvoice.sellerTaxId}</div> : null}
 </div>
 </div>

 <div className="flex flex-col items-end gap-4">
 {safeInvoice?.sellerLogoUrl ? (
 <img
 src={safeInvoice.sellerLogoUrl}
 alt="Logo"
 className="max-h-16 w-auto max-w-[90px] rounded-md object-contain"
 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
 />
 ) : null}
 <div className="min-w-[200px] space-y-1.5 text-right text-sm">
 <div className="text-base font-bold text-[#0f172a]">INVOICE</div>
 <div className="flex items-center justify-end gap-4">
 <span className="font-semibold text-[#64748b]">Invoice #</span>
 <span className="text-[#0f172a]">{safeInvoice?.invoiceNumber || '—'}</span>
 </div>
 <div className="flex items-center justify-end gap-4">
 <span className="font-semibold text-[#64748b]">Date</span>
 <span className="text-[#0f172a]">{formatDate(safeInvoice?.issueDate)}</span>
 </div>
 <div className="flex items-center justify-end gap-4">
 <span className="font-semibold text-[#64748b]">Due Date</span>
 <span className="text-[#0f172a]">{formatDate(safeInvoice?.dueDate)}</span>
 </div>
 </div>
 </div>
 </div>

 <div className="mt-10">
 <div className="text-sm font-bold uppercase tracking-[0.05em] text-[#64748b]">Bill To</div>
 <div className="mt-2 space-y-0.5 text-sm leading-relaxed text-[#334155]">
 <div className="text-base font-semibold text-[#0f172a]">{safeInvoice?.clientName || 'Client name'}</div>
 {safeInvoice?.clientAddress ? <div className="whitespace-pre-wrap">{safeInvoice.clientAddress}</div> : null}
 <div className="flex gap-1 text-[#64748b]">
 {safeInvoice?.clientCity ? <span>{safeInvoice.clientCity}</span> : null}
 {safeInvoice?.clientState ? <span>{safeInvoice.clientState ? (safeInvoice.clientCity ? ',' : '') + ' ' + safeInvoice.clientState : null}</span> : null}
 {safeInvoice?.clientZip ? <span>{safeInvoice.clientZip}</span> : null}
 </div>
 {safeInvoice?.clientEmail ? <div>{safeInvoice.clientEmail}</div> : null}
 {safeInvoice?.clientPhone ? <div>{safeInvoice.clientPhone}</div> : null}
 </div>
 </div>

 <div className="mt-10">
 <table className="w-full text-sm">
 <thead>
 <tr className="border-b border-[#d1d5db]">
 <th className="pb-3 text-left font-semibold text-[#0f172a]">Description</th>
 <th className="pb-3 text-center font-semibold text-[#0f172a]">Qty</th>
 <th className="pb-3 text-right font-semibold text-[#0f172a]">Rate</th>
 <th className="pb-3 text-right font-semibold text-[#0f172a]">Amount</th>
 </tr>
 </thead>
 <tbody>
 {items.length > 0 ? items.map((item) => (
 <tr key={item.id} className="border-b border-[#e5e7eb]">
 <td className="py-3.5 pr-4 text-[#0f172a]">
 <div className="font-medium">{item.description}</div>
 </td>
 <td className="py-3.5 text-center text-[#334155]">{Number(item.quantity || 0).toFixed(2)}</td>
 <td className="py-3.5 text-right text-[#334155]">{formatMoney(Number(item.rate || 0), currency)}</td>
 <td className="py-3.5 text-right font-medium text-[#0f172a]">{formatMoney(getLineTotal(item), currency)}</td>
 </tr>
 )) : (
 <tr>
 <td colSpan={4} className="py-10 text-center text-sm text-[#64748b]">Add invoice line items to build the preview.</td>
 </tr>
 )}
 </tbody>
 </table>
 </div>

 <div className="mt-8 flex justify-end">
 <div className="w-[280px] space-y-2.5 text-sm">
 <div className="flex items-center justify-between">
 <span className="text-[#64748b]">Subtotal</span>
 <span className="font-medium text-[#0f172a]">{formatMoney(subtotal, currency)}</span>
 </div>
 {discountAmount > 0 && (
 <div className="flex items-center justify-between">
 <span className="text-[#64748b]">Discount</span>
 <span className="font-medium text-[#dc2626]">-{formatMoney(discountAmount, currency)}</span>
 </div>
 )}
 <div className="flex items-center justify-between">
 <span className="text-[#64748b]">Tax {taxRate > 0 ? `(${taxRate.toFixed(0)}%)` : ''}</span>
 <span className="font-medium text-[#0f172a]">{formatMoney(taxAmount, currency)}</span>
 </div>
 <div className="border-t border-[#d1d5db] pt-3 flex items-center justify-between">
 <span className="font-bold text-[#0f172a]">Total</span>
 <span className="text-lg font-bold text-[#0f172a]">{formatMoney(total, currency)}</span>
 </div>
 </div>
 </div>

 {terms && (
 <div className="mt-10">
 <div className="text-sm font-bold text-[#0f172a]">Terms &amp; Conditions</div>
 <div className="mt-2 max-w-xl whitespace-pre-wrap text-sm leading-relaxed text-[#334155]">{terms}</div>
 </div>
 )}

 {brandSettings?.signatureUrl ? (
 <div className="mt-10 border-t border-[#e5e7eb] pt-6">
 <div className="text-sm font-bold text-[#0f172a]">Authorized Signature</div>
 <img src={brandSettings.signatureUrl} alt="Signature" className="mt-2 h-14 w-auto rounded object-contain" />
 {brandSettings.signatureName ? <div className="mt-1 text-sm text-[#475569]">{brandSettings.signatureName}</div> : null}
 </div>
 ) : null}
 </div>
 <style>{`
 @media print {
 .no-print { display: none !important; }
 body { background: #fff !important; }
 .invoice-pdf-page > div {
 box-shadow: none !important;
 border-radius: 0 !important;
 border: none !important;
 }
 }
 `}</style>
 </div>
 );
});

InvoicePreview.displayName = 'InvoicePreview';

export default InvoicePreview;
