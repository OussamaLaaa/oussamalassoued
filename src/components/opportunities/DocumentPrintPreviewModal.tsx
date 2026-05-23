import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { DocumentBrandSettings, GeneratedDocument } from '../../types/opportunities';
import PrintableDocumentView from './PrintableDocumentView';

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
    if (!isOpen) return undefined;
    globalThis.document.body.classList.add('document-print-active');
    return () => {
      globalThis.document.body.classList.remove('document-print-active');
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setStatusState('idle');
      setStatusMessage('');
    }
  }, [isOpen]);

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
    if (!pageRef.current || !previewDocument) {
      throw new Error('Printable document is not ready.');
    }

    const canvas = await html2canvas(pageRef.current, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      logging: false,
      scrollX: 0,
      scrollY: -window.scrollY,
      windowWidth: pageRef.current.scrollWidth,
      windowHeight: pageRef.current.scrollHeight,
    });

    const pdf = new jsPDF('p', 'mm', 'a4');
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

    return pdf.output('blob');
  };

  const generateAndStorePdf = async () => {
    if (!previewDocument) return;

    setStatusState('generating');
    setStatusMessage('Generating PDF...');

    try {
      const pdfBlob = await buildPdf();
      const pdfBase64 = await blobToBase64(pdfBlob);

      setStatusState('uploading');
      setStatusMessage('Uploading PDF...');

      const response = await fetch('/api/document-pdf-upload', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: previewDocument.id,
          fileName: safeFileName,
          pdfBase64,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result?.success) {
        throw new Error(result?.error || 'Could not store PDF.');
      }

      setStatusState('success');
      setStatusMessage(result?.message || 'PDF stored successfully.');

      if (result?.storagePath && onStoredPdf) {
        await onStoredPdf(String(result.storagePath));
      }
    } catch (error) {
      console.error('[Document PDF] Generate/store failed', error);
      setStatusState('error');
      setStatusMessage('Could not generate/store PDF. You can still use Print / Save as PDF.');
    }
  };

  if (!isOpen || !previewDocument) {
    return null;
  }

  return (
    <div className="document-print-root fixed inset-0 z-[1200] overflow-y-auto bg-[#f8fafc]">
      <div className="no-print sticky top-0 z-[2] border-b border-[#e5e7eb] bg-white/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-[210mm] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <div>
            <div className="text-sm font-semibold text-[#0f172a]">Print Preview</div>
            <div className="text-xs text-[#64748b]">Use Print / Save as PDF to generate a local PDF from the browser dialog.</div>
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
              onClick={onClose}
              className="rounded-lg border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#334155] transition-colors hover:bg-[#f8fafc]"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[210mm] px-4 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
        <PrintableDocumentView ref={pageRef} document={previewDocument} brandSettings={brandSettings} />
      </div>

      <div className="no-print mx-auto w-full max-w-[210mm] px-4 pb-6 sm:px-6 lg:px-8">
        <div className={`rounded-xl border px-4 py-3 text-sm ${statusState === 'error' ? 'border-[#fecaca] bg-[#fff1f2] text-[#b91c1c]' : statusState === 'success' ? 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]' : 'border-[#e5e7eb] bg-white text-[#475569]'}`}>
          {statusMessage || 'Stored PDFs are saved in private storage and opened through temporary signed links.'}
        </div>
      </div>
    </div>
  );
};

export default DocumentPrintPreviewModal;
