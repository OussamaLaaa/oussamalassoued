import React, { useEffect, useRef, useState } from 'react';
import type { DocumentBrandSettings, Invoice, InvoiceItem } from '../../types/opportunities';
import { isValidUuid } from '../../utils/securityUtils';
import InvoicePreview from './InvoicePreview';

type InvoicePrintPreviewModalProps = {
 isOpen: boolean;
 onClose: () => void;
 invoice: Invoice | null;
 items: InvoiceItem[];
 brandSettings?: DocumentBrandSettings | null;
 onStoredPdf: (storagePath: string) => Promise<void>;
 onEnsureSavedInvoice?: () => Promise<Invoice>;
};

const openStoredPdf = async (sourceType: string, id: string) => {
 const params =
 sourceType === 'invoice'
 ? `sourceType=invoice&invoiceId=${encodeURIComponent(id)}`
 : `sourceType=generated_document&documentId=${encodeURIComponent(id)}`;

 const response = await fetch(`/api/documents?action=signed-url&${params}`, {
 method: 'GET',
 credentials: 'include',
 cache: 'no-store',
 });

 const result = await response.json().catch(() => ({}));
 if (!response.ok || !result?.success || !result?.signedUrl) {
 throw new Error(result?.error || 'Unable to open stored PDF.');
 }

 window.open(String(result.signedUrl), '_blank', 'noopener,noreferrer');
 return result.signedUrl;
};

const downloadStoredPdf = async (sourceType: string, id: string, fileName: string) => {
 const params =
 sourceType === 'invoice'
 ? `sourceType=invoice&invoiceId=${encodeURIComponent(id)}`
 : `sourceType=generated_document&documentId=${encodeURIComponent(id)}`;

 const response = await fetch(`/api/documents?action=signed-url&${params}`, {
 method: 'GET',
 credentials: 'include',
 cache: 'no-store',
 });

 const result = await response.json().catch(() => ({}));
 if (!response.ok || !result?.success || !result?.signedUrl) {
 throw new Error(result?.error || 'Unable to download stored PDF.');
 }

 const anchor = document.createElement('a');
 anchor.href = String(result.signedUrl);
 anchor.download = fileName;
 anchor.style.display = 'none';
 document.body.appendChild(anchor);
 anchor.click();
 document.body.removeChild(anchor);
};

const InvoicePrintPreviewModal: React.FC<InvoicePrintPreviewModalProps> = ({
 isOpen,
 onClose,
 invoice,
 items,
 brandSettings,
 onStoredPdf,
 onEnsureSavedInvoice,
}) => {
 const pageRef = useRef<HTMLDivElement>(null);
 const [status, setStatus] = useState('');
 const [isGenerating, setIsGenerating] = useState(false);
 const [error, setError] = useState('');
 const [storedPdfPath, setStoredPdfPath] = useState<string | null>(null);
 const pdfSourceType = 'invoice';

 const pdfStoragePath = storedPdfPath || invoice?.pdfStoragePath || null;

 useEffect(() => {
 if (!isOpen) {
 setStatus('');
 setIsGenerating(false);
 setError('');
 setStoredPdfPath(null);
 }
 }, [isOpen]);

 useEffect(() => {
 const handleEscape = (event: KeyboardEvent) => {
 if (event.key === 'Escape') onClose();
 };

 if (!isOpen) return undefined;
 window.addEventListener('keydown', handleEscape);
 return () => window.removeEventListener('keydown', handleEscape);
 }, [isOpen, onClose]);

 if (!isOpen || !invoice) return null;

 const handlePrint = () => {
 try {
 window.print();
 } catch (err) {
 console.error('[Print] window.print() failed:', err);
 }
 };

 const getInvoiceId = async (): Promise<string> => {
 if (invoice && isValidUuid(invoice.id)) return invoice.id;
 if (!onEnsureSavedInvoice) {
 throw new Error('Save the invoice before storing PDF.');
 }
 setStatus('Saving invoice before storing PDF...');
 const saved = await onEnsureSavedInvoice();
 if (!saved || !isValidUuid(saved.id)) {
 throw new Error('Failed to save invoice. Please save manually first.');
 }
 return saved.id;
 };

 const handleGenerateAndStore = async () => {
 setIsGenerating(true);
 setError('');
 setStatus('');

 try {
 const invoiceId = await getInvoiceId();

 setStatus('Generating PDF...');
 const response = await fetch('/api/documents?action=generate-pdf', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 sourceType: 'invoice',
 invoiceId,
 }),
 });

 const result = await response.json().catch(() => ({}));

 if (!response.ok || !result?.success || !result?.storagePath) {
 throw new Error(result?.error || 'Unable to generate and store the invoice PDF.');
 }

 setStoredPdfPath(String(result.storagePath));
 await onStoredPdf(String(result.storagePath));
 setStatus('PDF stored successfully.');
 } catch (buildError) {
 setError(buildError instanceof Error ? buildError.message : 'PDF generation failed.');
 setStatus('');
 } finally {
 setIsGenerating(false);
 }
 };

 const handleOpenPdf = async () => {
 if (!pdfStoragePath) return;
 try {
 const id = invoice?.id;
 if (!id) throw new Error('Invoice ID not available.');
 await openStoredPdf(pdfSourceType, id);
 } catch (openError) {
 setError(openError instanceof Error ? openError.message : 'Unable to open the stored PDF.');
 }
 };

 const handleDownloadPdf = async () => {
 if (!pdfStoragePath) return;
 try {
 const id = invoice?.id;
 if (!id) throw new Error('Invoice ID not available.');
 const fileName = `${(invoice.invoiceNumber || invoice.title || 'invoice').replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase()}.pdf`;
 await downloadStoredPdf(pdfSourceType, id, fileName);
 } catch (dlError) {
 setError(dlError instanceof Error ? dlError.message : 'Unable to download the stored PDF.');
 }
 };

 return (
 <div className="print-wrapper fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 p-4 print:bg-transparent print:backdrop-blur-none">
 <button type="button" aria-label="Close invoice preview" className="no-print absolute inset-0" onClick={onClose} />
 <div className="print-card relative z-10 flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white print:h-auto print:flex print:overflow-visible print:rounded-none print:border-0 print:shadow-none print:max-w-none print:w-full">
 <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
 <div>
 <h3 className="text-base font-semibold text-[#0f172a]">Invoice Preview</h3>
 <p className="mt-0.5 text-sm text-[#64748b]">Print, export, or store as a private PDF.</p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 {pdfStoragePath ? (
 <span className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#166534] border border-[#bbf7d0]">
 PDF Stored
 </span>
 ) : null}
 <button type="button" onClick={handlePrint} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]">
 Print / Save as PDF
 </button>
 <button type="button" onClick={handleGenerateAndStore} disabled={isGenerating} className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e293b] disabled:opacity-60">
 {isGenerating ? 'Working...' : 'Generate & Store PDF'}
 </button>
 {!isValidUuid(invoice.id) && onEnsureSavedInvoice ? (
 <span className="text-xs text-[#64748b]">Invoice will be saved first.</span>
 ) : null}
 {pdfStoragePath ? (
 <>
 <button type="button" onClick={handleOpenPdf} className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2 text-sm font-medium text-[#166534] hover:bg-[#dcfce7]">
 Open PDF
 </button>
 <button type="button" onClick={handleDownloadPdf} className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-medium text-[#1d4ed8] hover:bg-[#dbeafe]">
 Download PDF
 </button>
 </>
 ) : null}
 <button type="button" onClick={onClose} className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]">
 Close
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-auto bg-[#f8fafc] px-6 py-6 print:overflow-visible print:bg-white print:p-0">
 <div className="mx-auto w-fit print:w-full print:max-w-none">
 <div className="print-scaler">
 <InvoicePreview ref={pageRef} invoice={invoice} items={items} brandSettings={brandSettings} />
 </div>
 </div>
 </div>

 <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] px-6 py-3 text-sm text-[#64748b]">
 <div>{status || error || (pdfStoragePath ? 'PDF stored.' : 'Ready')}</div>
 <div>{pdfStoragePath ? 'Stored PDF available.' : 'Generate & Store PDF to save privately.'}</div>
 </div>
 </div>
 </div>
 );
};

export default InvoicePrintPreviewModal;
