import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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

  useEffect(() => {
    if (!isOpen) {
      setStatus('');
      setIsGenerating(false);
      setError('');
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

  const buildPdf = async () => {
    console.log('[InvoicePDF] Step 2: buildPdf called');
    console.log('[InvoicePDF] Step 2a: pageRef.current exists:', !!pageRef?.current);
    console.log('[InvoicePDF] Step 2b: invoice exists:', !!invoice);

    if (!pageRef.current) {
      console.error('[InvoicePDF] ERROR: pageRef.current is null');
      throw new Error('Invoice preview is not ready.');
    }

    console.log('[InvoicePDF] Step 2c: capture element className:', pageRef.current.className);
    console.log('[InvoicePDF] Step 3: Running html2canvas...');

    const canvas = await html2canvas(pageRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: true,
      onclone: (clonedDoc) => {
        const elements = clonedDoc.querySelectorAll('.invoice-pdf-page');
        elements.forEach((el) => {
          (el as HTMLElement).style.boxShadow = 'none';
          (el as HTMLElement).style.borderRadius = '0';
          (el as HTMLElement).style.border = 'none';
        });
      },
    });

    if (!canvas) {
      throw new Error('html2canvas returned null canvas');
    }

    console.log('[InvoicePDF] Step 4: Canvas generated, size:', canvas.width, 'x', canvas.height);
    console.log('[InvoicePDF] Step 5: Creating jsPDF...');

    const pdf = new jsPDF('p', 'mm', 'a4');
    console.log('[InvoicePDF] Step 5a: jsPDF created');

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const imageWidth = pdfWidth;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;
    const imageData = canvas.toDataURL('image/png');

    let position = 0;
    pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight, undefined, 'FAST');
    let remainingHeight = imageHeight - pdfHeight;

    while (remainingHeight > 0) {
      position -= pdfHeight;
      pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, position, imageWidth, imageHeight, undefined, 'FAST');
      remainingHeight -= pdfHeight;
    }

    console.log('[InvoicePDF] Step 6: PDF created, pages:', Math.ceil(imageHeight / pdfHeight));
    return pdf;
  };

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
    console.log('[InvoicePDF] Step 1: handleGenerateAndStore STARTED');
    console.log('[InvoicePDF] Step 1a: invoice?.id:', invoice?.id);

    setIsGenerating(true);
    setError('');
    setStatus('');

    try {
      const invoiceId = await getInvoiceId();
      console.log('[InvoicePDF] Using invoiceId:', invoiceId);

      setStatus('Generating PDF...');
      console.log('[InvoicePDF] Calling buildPdf...');
      const pdf = await buildPdf();
      console.log('[InvoicePDF] buildPdf returned pdf object');

      console.log('[InvoicePDF] Step 7: Converting to base64...');
      const pdfBase64 = pdf.output('datauristring');
      console.log('[InvoicePDF] Step 8: Base64 ready, length:', pdfBase64?.length);

      const fileName = `${(invoice.invoiceNumber || invoice.title || 'invoice').replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase()}.pdf`;

      setStatus('Uploading PDF...');
      console.log('[InvoicePDF] Step 9: Sending POST to /api/document-pdf-upload');
      const response = await fetch('/api/document-pdf-upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceType: 'invoice',
          invoiceId,
          fileName,
          pdfBase64,
          debug: true,
        }),
      });

      console.log('[InvoicePDF] Step 10: Response received, status:', response.status);
      const result = await response.json().catch(() => ({}));
      console.log('[InvoicePDF] Step 10a: Response body:', result);

      if (!response.ok || !result?.success || !result?.storagePath) {
        throw new Error(result?.error || 'Unable to store the invoice PDF.');
      }

      await onStoredPdf(String(result.storagePath));
      setStatus('PDF stored successfully.');
    } catch (buildError) {
      console.error('[InvoicePDF] FULL ERROR:', buildError);
      console.error('[InvoicePDF] ERROR message:', buildError instanceof Error ? buildError.message : String(buildError));
      setError(buildError instanceof Error ? buildError.message : 'PDF generation failed. Check console for details.');
      setStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenStoredPdf = async () => {
    try {
      const response = await fetch(`/api/document-pdf-upload?sourceType=invoice&invoiceId=${encodeURIComponent(invoice.id)}`, {
        method: 'GET',
        credentials: 'include',
        cache: 'no-store',
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success || !result?.signedUrl) {
        throw new Error(result?.error || 'No stored invoice PDF found.');
      }

      window.open(String(result.signedUrl), '_blank', 'noopener,noreferrer');
    } catch (openError) {
      console.error('[Invoice PDF] Failed to open stored PDF', openError);
      setError(openError instanceof Error ? openError.message : 'Unable to open the stored PDF.');
    }
  };

  return (
    <div className="print-wrapper fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px] print:bg-transparent print:backdrop-blur-none">
      <button type="button" aria-label="Close invoice preview" className="no-print absolute inset-0" onClick={onClose} />
      <div className="print-card relative z-10 flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] print:h-auto print:flex print:overflow-visible print:rounded-none print:border-0 print:shadow-none print:max-w-none print:w-full">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#0f172a]">Invoice Preview</h3>
            <p className="mt-0.5 text-sm text-[#64748b]">Print, export, or store as a private PDF.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={handlePrint} className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc]">
              Print / Save as PDF
            </button>
            <button type="button" onClick={handleGenerateAndStore} disabled={isGenerating} className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-[#1e293b] disabled:opacity-60">
              {isGenerating ? 'Working...' : 'Generate & Store PDF'}
            </button>
            {!isValidUuid(invoice.id) && onEnsureSavedInvoice ? (
              <span className="text-xs text-[#64748b]">Invoice will be saved first.</span>
            ) : null}
            {invoice.pdfStoragePath ? (
              <button type="button" onClick={handleOpenStoredPdf} className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-4 py-2 text-sm font-medium text-[#166534] hover:bg-[#dcfce7]">
                Open Stored PDF
              </button>
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
          <div>{status || error || 'Ready'}</div>
          <div>{invoice.pdfStoragePath ? 'Stored PDF available.' : 'Generate & Store PDF to save privately.'}</div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePrintPreviewModal;
