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

  const handlePrint = () => {
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
      }, 100);
    });
  };

  if (!isOpen || !previewDocument) {
    return null;
  }

  return (
    <div className="doc-preview-overlay">
      <div className="no-print doc-preview-toolbar">
        <div className="doc-preview-toolbar-inner">
          <div>
            <div className="doc-preview-toolbar-title">Print Preview</div>
            <div className="doc-preview-toolbar-subtitle">
              Use Print / Save as PDF to generate a local PDF from the browser dialog.
            </div>
          </div>
          <div className="doc-preview-toolbar-actions">
            <button
              type="button"
              onClick={() => void generateAndStorePdf()}
              disabled={statusState === 'generating' || statusState === 'uploading'}
              className="doc-preview-btn-secondary"
            >
              {statusState === 'generating' ? 'Generating PDF...' : statusState === 'uploading' ? 'Uploading PDF...' : 'Generate & Store PDF'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="doc-preview-btn-ghost"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="doc-preview-btn-primary"
            >
              Print / Save as PDF
            </button>
          </div>
        </div>
      </div>

      <div className="doc-preview-content">
        <ProfessionalDocumentView ref={pageRef} document={previewDocument} brandSettings={brandSettings} />
      </div>

      <div className="no-print doc-preview-status">
        <div className={`doc-preview-status-inner ${statusState === 'error' ? 'doc-preview-status-error' : statusState === 'success' ? 'doc-preview-status-success' : ''}`}>
          {statusMessage || 'Stored PDFs are saved in private storage and opened through temporary signed links.'}
        </div>
      </div>

      <style>{`
        .doc-preview-overlay {
          position: fixed;
          inset: 0;
          z-index: 1200;
          overflow-y: auto;
          background: #f8fafc;
        }
        .doc-preview-toolbar {
          position: sticky;
          top: 0;
          z-index: 2;
          border-bottom: 1px solid #e5e7eb;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(8px);
        }
        .doc-preview-toolbar-inner {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          max-width: 210mm;
          margin: 0 auto;
          padding: 12px 16px;
        }
        .doc-preview-toolbar-title {
          font-size: 14px;
          font-weight: 600;
          color: #0f172a;
        }
        .doc-preview-toolbar-subtitle {
          font-size: 12px;
          color: #64748b;
        }
        .doc-preview-toolbar-actions {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }
        .doc-preview-btn-primary {
          border-radius: 8px;
          background: #2563eb;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #fff;
          border: none;
          cursor: pointer;
        }
        .doc-preview-btn-primary:hover { background: #1d4ed8; }
        .doc-preview-btn-secondary {
          border-radius: 8px;
          border: 1px solid #bfdbfe;
          background: #eff6ff;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #1d4ed8;
          cursor: pointer;
        }
        .doc-preview-btn-secondary:hover { background: #dbeafe; }
        .doc-preview-btn-secondary:disabled { opacity: 0.7; cursor: not-allowed; }
        .doc-preview-btn-ghost {
          border-radius: 8px;
          border: 1px solid #cbd5e1;
          background: #fff;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 500;
          color: #334155;
          cursor: pointer;
        }
        .doc-preview-btn-ghost:hover { background: #f8fafc; }
        .doc-preview-content {
          max-width: 210mm;
          margin: 0 auto;
          padding: 24px 16px;
        }
        .doc-preview-status {
          max-width: 210mm;
          margin: 0 auto;
          padding: 0 16px 24px;
        }
        .doc-preview-status-inner {
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          background: #fff;
          padding: 12px 16px;
          font-size: 13px;
          color: #475569;
        }
        .doc-preview-status-error {
          border-color: #fecaca !important;
          background: #fff1f2 !important;
          color: #b91c1c !important;
        }
        .doc-preview-status-success {
          border-color: #bbf7d0 !important;
          background: #f0fdf4 !important;
          color: #166534 !important;
        }
        @media print {
          .doc-preview-overlay {
            position: static !important;
            background: #fff !important;
            overflow: visible !important;
          }
          .doc-preview-content {
            max-width: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
};

export default DocumentPrintPreviewModal;
