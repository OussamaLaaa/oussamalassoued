import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { DocumentBrandSettings, GeneratedDocument } from '../../types/opportunities';
import ProfessionalDocumentView from './ProfessionalDocumentView';

type DocumentPrintPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  document: GeneratedDocument | null;
  brandSettings?: DocumentBrandSettings | null;
  onStoredPdf?: (storagePath: string) => void | Promise<void>;
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
  const [statusState, setStatusState] = useState<'idle' | 'generating' | 'uploading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (!isOpen) {
      setStatusState('idle');
      setStatusMessage('');
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

  const safeFileName = useMemo(() => {
    const raw = String(previewDocument?.title || 'document')
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9.-]+/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-+|-+$/g, '');

    return `${raw || 'document'}.pdf`;
  }, [previewDocument?.title]);

  const blobToBase64 = async (blob: Blob) => {
    const arrayBuffer = await blob.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    let binary = '';
    const chunkSize = 0x8000;

    for (let index = 0; index < bytes.length; index += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
    }

    return globalThis.btoa(binary);
  };

  const buildPdf = async () => {
    console.log('[PDF] Step 2: buildPdf called');
    console.log('[PDF] Step 2a: pageRef.current exists:', !!pageRef?.current);
    console.log('[PDF] Step 2b: previewDocument exists:', !!previewDocument);

    if (!pageRef.current || !previewDocument) {
      console.error('[PDF] ERROR capture ref or document missing:', { hasRef: !!pageRef?.current, hasDoc: !!previewDocument });
      throw new Error('Printable document is not ready.');
    }

    console.log('[PDF] Step 2c: capture element className:', pageRef.current.className);
    console.log('[PDF] Step 3: Running html2canvas...');

    const canvas = await html2canvas(pageRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: true,
      scrollX: 0,
      scrollY: 0,
      windowWidth: pageRef.current.scrollWidth,
      windowHeight: pageRef.current.scrollHeight,
    });

    if (!canvas) {
      throw new Error('html2canvas returned null canvas');
    }

    console.log('[PDF] Step 4: Canvas generated, size:', canvas.width, 'x', canvas.height);
    console.log('[PDF] Step 5: Creating jsPDF...');

    const pdf = new jsPDF('p', 'mm', 'a4');
    console.log('[PDF] Step 5a: jsPDF created');

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const imageWidth = pageWidth;
    const imageHeight = (canvas.height * imageWidth) / canvas.width;
    const imageData = canvas.toDataURL('image/png');
    let remainingHeight = imageHeight;
    let offset = 0;

    pdf.addImage(imageData, 'PNG', 0, offset, imageWidth, imageHeight, undefined, 'FAST');
    remainingHeight -= pageHeight;

    while (remainingHeight > 0) {
      offset -= pageHeight;
      pdf.addPage();
      pdf.addImage(imageData, 'PNG', 0, offset, imageWidth, imageHeight, undefined, 'FAST');
      remainingHeight -= pageHeight;
    }

    console.log('[PDF] Step 6: PDF created, pages:', Math.ceil(imageHeight / pageHeight));
    return pdf.output('blob');
  };

  const generateAndStorePdf = async () => {
    console.log('[PDF] Step 1: generateAndStorePdf STARTED');
    console.log('[PDF] Step 1a: previewDocument?.id:', previewDocument?.id);
    console.log('[PDF] Step 1b: previewDocument?.type:', previewDocument?.type);
    console.log('[PDF] Step 1c: pageRef?.current?.tagName:', pageRef?.current?.tagName);

    if (!previewDocument) {
      console.error('[PDF] ERROR: previewDocument is null, cannot generate');
      return;
    }

    setStatusState('generating');
    setStatusMessage('Generating PDF...');

    try {
      console.log('[PDF] Calling buildPdf...');
      const pdfBlob = await buildPdf();
      console.log('[PDF] buildPdf returned blob, size:', pdfBlob?.size);

      console.log('[PDF] Step 7: Converting blob to base64...');
      const pdfBase64 = await blobToBase64(pdfBlob);
      console.log('[PDF] Step 8: Base64 ready, length:', pdfBase64?.length);

      setStatusState('uploading');
      setStatusMessage('Uploading PDF...');

      console.log('[PDF] Step 9: Sending POST to /api/document-pdf-upload');
      const response = await fetch('/api/document-pdf-upload', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sourceType: 'generated_document',
          documentId: previewDocument.id,
          fileName: safeFileName,
          pdfBase64,
          debug: import.meta.env.DEV,
        }),
      });

      console.log('[PDF] Step 10: Response received, status:', response.status);
      const result = await response.json().catch(() => ({}));
      console.log('[PDF] Step 10a: Response body:', result);

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Could not store PDF.');
      }

      setStatusState('success');
      setStatusMessage(result?.message || 'PDF stored successfully.');

      if (result?.storagePath && onStoredPdf) {
        await onStoredPdf(String(result.storagePath));
      }
    } catch (error) {
      console.error('[PDF] FULL ERROR:', error);
      console.error('[PDF] ERROR message:', error instanceof Error ? error.message : String(error));
      setStatusState('error');
      setStatusMessage('PDF generation failed. Check console for details.');
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
    <div className="print-wrapper fixed inset-0 z-[10000] flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-[2px] print:bg-transparent print:backdrop-blur-none">
      <button type="button" aria-label="Close preview" className="no-print absolute inset-0" onClick={onClose} />
      <div className="print-card relative z-10 flex h-[90vh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.22)] print:h-auto print:flex print:overflow-visible print:rounded-none print:border-0 print:shadow-none print:max-w-none print:w-full">
        <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-[#e5e7eb] px-6 py-4">
          <div>
            <h3 className="text-base font-semibold text-[#0f172a]">Print Preview</h3>
            <p className="mt-0.5 text-sm text-[#64748b]">Print, export, or store as a private PDF.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void generateAndStorePdf()}
              disabled={statusState === 'generating' || statusState === 'uploading'}
              className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-4 py-2 text-sm font-medium text-[#1d4ed8] transition-colors hover:bg-[#dbeafe] disabled:cursor-not-allowed disabled:opacity-70"
            >
              {statusState === 'generating' ? 'Generating PDF...' : statusState === 'uploading' ? 'Uploading PDF...' : 'Generate & Store PDF'}
            </button>
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
            {statusMessage || (statusState === 'idle' ? 'Ready' : '')}
          </div>
          <div>
            {statusState === 'error' ? statusMessage : 'Stored PDFs are saved in private storage and opened through temporary signed links.'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentPrintPreviewModal;
