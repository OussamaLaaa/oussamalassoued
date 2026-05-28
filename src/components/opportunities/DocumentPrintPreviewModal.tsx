import React, { useEffect, useRef, useState } from 'react';
import type { DocumentBrandSettings, GeneratedDocument } from '../../types/opportunities';
import ProfessionalDocumentView from './ProfessionalDocumentView';

type DocumentPrintPreviewModalProps = {
 isOpen: boolean;
 onClose: () => void;
 document: GeneratedDocument | null;
 brandSettings?: DocumentBrandSettings | null;
 onStoredPdf?: (storagePath: string) => void | Promise<void>;
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

const DocumentPrintPreviewModal: React.FC<DocumentPrintPreviewModalProps> = ({
 isOpen,
 onClose,
 document: previewDocument,
 brandSettings,
 onStoredPdf,
}) => {
 const pageRef = useRef<HTMLDivElement | null>(null);
 const [statusMessage, setStatusMessage] = useState('');
 const [statusState, setStatusState] = useState<'idle' | 'generating' | 'success' | 'error'>('idle');
 const [storedPdfPath, setStoredPdfPath] = useState<string | null>(null);
 const pdfSourceType = 'generated_document';

 const pdfStoragePath = storedPdfPath || previewDocument?.pdfStoragePath || null;

 useEffect(() => {
 if (!isOpen) {
 setStatusState('idle');
 setStatusMessage('');
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

 const generateAndStorePdf = async () => {
 if (!previewDocument) return;

 setStatusState('generating');
 setStatusMessage('Generating PDF...');

 try {
 const response = await fetch('/api/documents?action=generate-pdf', {
 method: 'POST',
 credentials: 'include',
 headers: { 'Content-Type': 'application/json' },
 body: JSON.stringify({
 sourceType: 'generated_document',
 documentId: previewDocument.id,
 }),
 });

 const result = await response.json().catch(() => ({}));

 if (!response.ok || !result?.success) {
 throw new Error(result?.error || 'Could not generate and store PDF.');
 }

 if (result?.storagePath) {
 setStoredPdfPath(String(result.storagePath));
 }

 setStatusState('success');
 setStatusMessage('PDF stored successfully.');

 if (result?.storagePath && onStoredPdf) {
 await onStoredPdf(String(result.storagePath));
 }
 } catch (error) {
 setStatusState('error');
 setStatusMessage('PDF generation failed.');
 }
 };

 const handleOpenPdf = async () => {
 if (!previewDocument) return;
 try {
 await openStoredPdf(pdfSourceType, previewDocument.id);
 } catch (openError) {
 setStatusState('error');
 setStatusMessage(openError instanceof Error ? openError.message : 'Unable to open PDF.');
 }
 };

 const handleDownloadPdf = async () => {
 if (!previewDocument) return;
 try {
 const fileName = `${(previewDocument.title || 'document').replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase()}.pdf`;
 await downloadStoredPdf(pdfSourceType, previewDocument.id, fileName);
 } catch (dlError) {
 setStatusState('error');
 setStatusMessage(dlError instanceof Error ? dlError.message : 'Unable to download PDF.');
 }
 };

 const handlePrint = () => {
 try {
 window.print();
 } catch (err) {
 console.error('[Print] window.print() failed:', err);
 }
 };

 if (!isOpen || !previewDocument) {
 return null;
 }

 return (
 <div className="print-wrapper fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 p-4 print:bg-transparent print:backdrop-blur-none">
 <button type="button" aria-label="Close preview" className="no-print absolute inset-0" onClick={onClose} />
 <div className="print-card relative z-10 flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white print:h-auto print:flex print:overflow-visible print:rounded-none print:border-0 print:shadow-none print:max-w-none print:w-full">
 <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
 <div>
 <h3 className="text-base font-semibold text-[#0f172a]">Print Preview</h3>
 <p className="mt-0.5 text-sm text-[#64748b]">Print, export, or store as a private PDF.</p>
 </div>
 <div className="flex flex-wrap items-center gap-2">
 {pdfStoragePath ? (
 <span className="rounded-full bg-[#f0fdf4] px-3 py-1 text-xs font-semibold text-[#166534] border border-[#bbf7d0]">
 PDF Stored
 </span>
 ) : null}
 <button
 type="button"
 onClick={() => void generateAndStorePdf()}
 disabled={statusState === 'generating'}
 className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-medium text-[#1d4ed8] transition-colors hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-70"
 >
 {statusState === 'generating' ? 'Generating PDF...' : 'Generate & Store PDF'}
 </button>
 {pdfStoragePath ? (
 <>
 <button
 type="button"
 onClick={handleOpenPdf}
 className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2 text-sm font-medium text-[#166534] hover:bg-[#dcfce7]"
 >
 Open PDF
 </button>
 <button
 type="button"
 onClick={handleDownloadPdf}
 className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-medium text-[#1d4ed8] hover:bg-[#dbeafe]"
 >
 Download PDF
 </button>
 </>
 ) : null}
 <button
 type="button"
 onClick={handlePrint}
 className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
 >
 Print / Save as PDF
 </button>
 <button
 type="button"
 onClick={onClose}
 className="rounded-lg border border-[#e5e7eb] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]"
 >
 Close
 </button>
 </div>
 </div>

 <div className="flex-1 overflow-auto bg-[#f8fafc] px-6 py-6 print:overflow-visible print:bg-white print:p-0">
 <div className="mx-auto w-fit print:w-full print:max-w-none">
 <div className="print-scaler">
 <ProfessionalDocumentView ref={pageRef} document={previewDocument} brandSettings={brandSettings} />
 </div>
 </div>
 </div>

 <div className="no-print flex flex-wrap items-center justify-between gap-3 border-t border-[#e5e7eb] px-6 py-3 text-sm text-[#64748b]">
 <div>
 {statusMessage || (statusState === 'idle' ? (pdfStoragePath ? 'PDF stored.' : 'Ready') : '')}
 </div>
 <div>
 {statusState === 'error' ? statusMessage : (pdfStoragePath ? 'Stored PDF available.' : 'Stored PDFs are saved in private storage and opened through temporary signed links.')}
 </div>
 </div>
 </div>
 </div>
 );
};

export default DocumentPrintPreviewModal;
