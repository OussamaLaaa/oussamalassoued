import React, { useEffect, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { DocumentBrandSettings, Invoice, InvoiceItem } from '../../types/opportunities';
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
    if (!pageRef.current) {
      throw new Error('Invoice preview is not ready.');
    }

    const canvas = await html2canvas(pageRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      onclone: (clonedDoc) => {
        const elements = clonedDoc.querySelectorAll('.invoice-pdf-page');
        elements.forEach((el) => {
          (el as HTMLElement).style.boxShadow = 'none';
          (el as HTMLElement).style.borderRadius = '0';
          (el as HTMLElement).style.border = 'none';
        });
      },
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
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

    return pdf;
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateAndStore = async () => {
    setIsGenerating(true);
    setError('');
    setStatus('Generating PDF...');

    try {
      const pdf = await buildPdf();
      const pdfBase64 = pdf.output('datauristring');
      const fileName = `${(invoice.invoiceNumber || invoice.title || 'invoice').replace(/[^a-zA-Z0-9.-]+/g, '-').toLowerCase()}.pdf`;

      setStatus('Uploading PDF...');
      const response = await fetch('/api/document-pdf-upload', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: invoice.id, fileName, pdfBase64 }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result?.success || !result?.storagePath) {
        throw new Error(result?.error || 'Unable to store the invoice PDF.');
      }

      await onStoredPdf(String(result.storagePath));
      setStatus('PDF stored successfully.');
    } catch (buildError) {
      console.error('[Invoice PDF] Failed to generate or store PDF', buildError);
      setError(buildError instanceof Error ? buildError.message : 'Unable to generate the PDF.');
      setStatus('');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleOpenStoredPdf = async () => {
    try {
      const response = await fetch(`/api/document-pdf-upload?invoiceId=${encodeURIComponent(invoice.id)}`, {
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
    <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px]">
      <button type="button" aria-label="Close invoice preview" className="absolute inset-0" onClick={onClose} />
      <div className="flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)]">
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

        <div className="no-print flex-1 overflow-auto bg-[#f8fafc] px-6 py-6">
          <div className="mx-auto w-fit">
            <InvoicePreview ref={pageRef} invoice={invoice} items={items} brandSettings={brandSettings} />
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
