import React, { useEffect } from 'react';
import type { DocumentBrandSettings, GeneratedDocument } from '../../types/opportunities';
import PrintableDocumentView from './PrintableDocumentView';

type DocumentPrintPreviewModalProps = {
  isOpen: boolean;
  onClose: () => void;
  document: GeneratedDocument | null;
  brandSettings?: DocumentBrandSettings | null;
};

const DocumentPrintPreviewModal: React.FC<DocumentPrintPreviewModalProps> = ({
  isOpen,
  onClose,
  document: previewDocument,
  brandSettings,
}) => {
  useEffect(() => {
    if (!isOpen) return undefined;
    globalThis.document.body.classList.add('document-print-active');
    return () => {
      globalThis.document.body.classList.remove('document-print-active');
    };
  }, [isOpen]);

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
        <PrintableDocumentView document={previewDocument} brandSettings={brandSettings} showActions />
      </div>
    </div>
  );
};

export default DocumentPrintPreviewModal;
