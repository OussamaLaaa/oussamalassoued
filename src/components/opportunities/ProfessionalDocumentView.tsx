import React, { forwardRef, useMemo } from 'react';
import type { DocumentBrandSettings, GeneratedDocument } from '../../types/opportunities';

type ProfessionalDocumentViewProps = {
  document: GeneratedDocument;
  brandSettings?: DocumentBrandSettings | null;
};

type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string };

const DEFAULT_BRAND: DocumentBrandSettings = {
  id: 'fallback',
  brandName: 'Your Brand',
  ownerName: 'Your Name',
  signatureName: 'Your Name',
  defaultCurrency: 'MYR',
};

const formatDocumentType = (value: string) =>
  value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const formatDate = (value?: string) => {
  if (!value) return '\u2014';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatMoney = (amount?: number, currency?: string) => {
  if (amount == null || Number.isNaN(Number(amount))) return '\u2014';
  const c = currency || 'MYR';
  return `${c} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const resolveBrand = (s?: DocumentBrandSettings | null): DocumentBrandSettings => ({
  ...DEFAULT_BRAND,
  ...s,
  brandName: s?.brandName?.trim() || DEFAULT_BRAND.brandName || 'Your Brand',
  ownerName: s?.ownerName?.trim() || DEFAULT_BRAND.ownerName || 'Your Name',
  signatureName: s?.signatureName?.trim() || s?.ownerName?.trim() || DEFAULT_BRAND.signatureName || 'Your Name',
});

const parseContent = (content?: string): ContentBlock[] => {
  const lines = String(content || '').split(/\r?\n/);
  const blocks: ContentBlock[] = [];
  let para: string[] = [];

  const flush = () => {
    const t = para.join('\n').trim();
    if (t) blocks.push({ type: 'paragraph', text: t });
    para = [];
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }
    if (line.startsWith('# ')) {
      flush();
      blocks.push({ type: 'heading', text: line.slice(2).trim() });
      continue;
    }
    para.push(raw);
  }

  flush();
  return blocks;
};

const typeLabel = (type: string): string => {
  const map: Record<string, string> = {
    contract: 'Contract',
    cahier_de_charges: 'Statement of Work',
    proposal: 'Proposal',
    agreement: 'Agreement',
    receipt: 'Receipt',
    ux_audit_report: 'UX Audit Report',
    project_brief: 'Project Brief',
  };
  return map[type] || formatDocumentType(type);
};

const ProfessionalDocumentView = forwardRef<HTMLDivElement, ProfessionalDocumentViewProps>(
  ({ document, brandSettings }, ref) => {
    const brand = useMemo(() => resolveBrand(brandSettings), [brandSettings]);
    const blocks = useMemo(() => parseContent(document.content), [document.content]);
    const isContractLike = ['contract', 'agreement', 'cahier_de_charges', 'proposal'].includes(document.type);
    const isReceipt = document.type === 'receipt';

    return (
      <div ref={ref} className="professional-doc-page">
        <div className="pro-doc-inner">
          {/* ── Header ── */}
          <header className="pro-doc-header">
            <div className="pro-doc-header-left">
              {brand.logoUrl ? (
                <img
                  src={brand.logoUrl}
                  alt={brand.brandName || 'Logo'}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  className="pro-doc-logo"
                />
              ) : null}
              <div>
                <div className="pro-doc-brand-name">{brand.brandName || 'Your Brand'}</div>
                <div className="pro-doc-owner">{brand.ownerName || 'Your Name'}</div>
              </div>
            </div>
            <div className="pro-doc-header-right">
              {brand.website ? <span>{brand.website}</span> : null}
              {brand.email ? <span>{brand.email}</span> : null}
              {brand.phone ? <span>{brand.phone}</span> : null}
            </div>
          </header>

          {/* ── Title Section ── */}
          <section className="pro-doc-title-section">
            <div>
              <div className="pro-doc-type-label">{typeLabel(document.type)}</div>
              <h1 className="pro-doc-title">{document.title}</h1>
              {document.notes ? <p className="pro-doc-notes">{document.notes}</p> : null}
            </div>
            <div className="pro-doc-status-badge">
              {document.status.replace(/_/g, ' ')}
            </div>
          </section>

          {/* ── Meta Grid ── */}
          <div className="pro-doc-meta-grid">
            <div className="pro-doc-meta-item">
              <span className="pro-doc-meta-label">Issue Date</span>
              <span className="pro-doc-meta-value">{formatDate(document.issueDate)}</span>
            </div>
            <div className="pro-doc-meta-item">
              <span className="pro-doc-meta-label">Due Date</span>
              <span className="pro-doc-meta-value">{formatDate(document.dueDate)}</span>
            </div>
            {document.amount != null ? (
              <div className="pro-doc-meta-item">
                <span className="pro-doc-meta-label">Amount</span>
                <span className="pro-doc-meta-value">{formatMoney(document.amount, document.currency)}</span>
              </div>
            ) : null}
            <div className="pro-doc-meta-item">
              <span className="pro-doc-meta-label">Related</span>
              <span className="pro-doc-meta-value">
                {document.relatedCompanyName || document.relatedProjectName || document.relatedPersonName || document.relatedDealName || '\u2014'}
              </span>
            </div>
          </div>

          {/* ── Type-Specific Information ── */}
          {isContractLike ? (
            <div className="pro-doc-section">
              <div className="pro-doc-section-title">Agreement Details</div>
              <div className="pro-doc-section-grid">
                <div className="pro-doc-meta-item">
                  <span className="pro-doc-meta-label">Project</span>
                  <span className="pro-doc-meta-value">{document.relatedProjectName || '\u2014'}</span>
                </div>
                <div className="pro-doc-meta-item">
                  <span className="pro-doc-meta-label">Company</span>
                  <span className="pro-doc-meta-value">{document.relatedCompanyName || '\u2014'}</span>
                </div>
                <div className="pro-doc-meta-item">
                  <span className="pro-doc-meta-label">Contact</span>
                  <span className="pro-doc-meta-value">{document.relatedPersonName || '\u2014'}</span>
                </div>
                <div className="pro-doc-meta-item">
                  <span className="pro-doc-meta-label">Signed Date</span>
                  <span className="pro-doc-meta-value">{formatDate(document.signedDate)}</span>
                </div>
              </div>
              {brand.legalNotes ? (
                <div className="pro-doc-notes-box">
                  <div className="pro-doc-notes-box-label">Legal Notes</div>
                  <div className="pro-doc-notes-box-text">{brand.legalNotes}</div>
                </div>
              ) : null}
            </div>
          ) : null}

          {isReceipt ? (
            <div className="pro-doc-section">
              <div className="pro-doc-section-title">Payment Receipt</div>
              <div className="pro-doc-section-grid">
                <div className="pro-doc-meta-item">
                  <span className="pro-doc-meta-label">Amount Paid</span>
                  <span className="pro-doc-meta-value">{formatMoney(document.amount, document.currency)}</span>
                </div>
                <div className="pro-doc-meta-item">
                  <span className="pro-doc-meta-label">Payment Date</span>
                  <span className="pro-doc-meta-value">{formatDate(document.issueDate)}</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* ── Document Content ── */}
          <div className="pro-doc-section">
            <div className="pro-doc-section-title">Document Content</div>
            <div className="pro-doc-content">
              {blocks.length > 0 ? (
                blocks.map((block, i) =>
                  block.type === 'heading' ? (
                    <h2 key={`h-${i}`} className="pro-doc-content-heading">{block.text}</h2>
                  ) : (
                    <p key={`p-${i}`} className="pro-doc-content-para">{block.text}</p>
                  ),
                )
              ) : (
                <p className="pro-doc-empty">No document content saved.</p>
              )}
            </div>
          </div>

          {/* ── Signature + Brand Contact ── */}
          <div className="pro-doc-footer-grid">
            <div className="pro-doc-section">
              <div className="pro-doc-section-title">Signature</div>
              <div className="pro-doc-sig-block">
                <div className="pro-doc-sig-name">{brand.signatureName || brand.ownerName || 'Your Name'}</div>
                <div className="pro-doc-sig-line" />
                <div className="pro-doc-sig-label">Authorized Signature</div>
              </div>
              {brand.signatureUrl ? (
                <img
                  src={brand.signatureUrl}
                  alt={brand.signatureName || 'Signature'}
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  className="pro-doc-sig-img"
                />
              ) : null}
            </div>
            <div className="pro-doc-section">
              <div className="pro-doc-section-title">Contact</div>
              <div className="pro-doc-contact">
                <div>{brand.ownerName || 'Your Name'}</div>
                <div>{brand.brandName || 'Your Brand'}</div>
                {brand.address ? <div className="pro-doc-pre-wrap">{brand.address}</div> : null}
                {brand.email ? <div>{brand.email}</div> : null}
                {brand.phone ? <div>{brand.phone}</div> : null}
                {brand.website ? <div>{brand.website}</div> : null}
              </div>
            </div>
          </div>
        </div>

        <style>{`
          .professional-doc-page {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            color: #0f172a;
            background: #ffffff;
          }
          .pro-doc-inner {
            max-width: 210mm;
            margin: 0 auto;
            padding: 40px 48px;
            background: #ffffff;
          }
          .pro-doc-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            padding-bottom: 20px;
            border-bottom: 1px solid #e5e7eb;
          }
          .pro-doc-header-left {
            display: flex;
            align-items: center;
            gap: 16px;
            min-width: 0;
          }
          .pro-doc-logo {
            width: 56px;
            height: 56px;
            border-radius: 12px;
            object-fit: contain;
            flex-shrink: 0;
          }
          .pro-doc-brand-name {
            font-size: 22px;
            font-weight: 600;
            letter-spacing: -0.02em;
            color: #0f172a;
          }
          .pro-doc-owner {
            font-size: 14px;
            color: #475569;
            margin-top: 2px;
          }
          .pro-doc-header-right {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 4px;
            font-size: 13px;
            color: #475569;
            white-space: nowrap;
          }
          .pro-doc-title-section {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 24px;
            margin-top: 28px;
          }
          .pro-doc-type-label {
            font-size: 12px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.18em;
            color: #64748b;
          }
          .pro-doc-title {
            font-size: 28px;
            font-weight: 600;
            letter-spacing: -0.02em;
            color: #0f172a;
            margin-top: 6px;
          }
          .pro-doc-notes {
            font-size: 14px;
            color: #475569;
            line-height: 1.6;
            margin-top: 8px;
            max-width: 560px;
          }
          .pro-doc-status-badge {
            flex-shrink: 0;
            padding: 6px 16px;
            border-radius: 8px;
            font-size: 13px;
            font-weight: 500;
            text-transform: capitalize;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            color: #334155;
          }
          .pro-doc-meta-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 12px;
            margin-top: 24px;
          }
          .pro-doc-meta-item {
            padding: 12px 14px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 10px;
          }
          .pro-doc-meta-label {
            display: block;
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #64748b;
          }
          .pro-doc-meta-value {
            display: block;
            margin-top: 4px;
            font-size: 14px;
            color: #0f172a;
          }
          .pro-doc-section {
            margin-top: 24px;
          }
          .pro-doc-section-title {
            font-size: 15px;
            font-weight: 600;
            letter-spacing: -0.01em;
            color: #0f172a;
            margin-bottom: 12px;
          }
          .pro-doc-section-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 10px;
          }
          .pro-doc-notes-box {
            margin-top: 14px;
            padding: 14px 16px;
            background: #fafcff;
            border: 1px solid #dbe4f0;
            border-radius: 10px;
          }
          .pro-doc-notes-box-label {
            font-size: 11px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.14em;
            color: #64748b;
          }
          .pro-doc-notes-box-text {
            margin-top: 6px;
            font-size: 14px;
            line-height: 1.6;
            color: #475569;
            white-space: pre-wrap;
          }
          .pro-doc-content {
            padding: 20px 24px;
            background: #f8fafc;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
          }
          .pro-doc-content-heading {
            font-size: 18px;
            font-weight: 600;
            letter-spacing: -0.01em;
            color: #0f172a;
            margin-top: 16px;
            margin-bottom: 8px;
          }
          .pro-doc-content-heading:first-child {
            margin-top: 0;
          }
          .pro-doc-content-para {
            font-size: 14px;
            line-height: 1.7;
            color: #0f172a;
            margin-top: 8px;
            white-space: pre-line;
          }
          .pro-doc-content-para:first-child {
            margin-top: 0;
          }
          .pro-doc-empty {
            font-size: 14px;
            color: #64748b;
          }
          .pro-doc-footer-grid {
            display: grid;
            grid-template-columns: 1.2fr 0.8fr;
            gap: 16px;
            margin-top: 28px;
          }
          .pro-doc-sig-block {
            margin-top: 8px;
          }
          .pro-doc-sig-name {
            font-size: 14px;
            color: #475569;
          }
          .pro-doc-sig-line {
            height: 1px;
            background: #cbd5e1;
            margin-top: 12px;
            width: 100%;
          }
          .pro-doc-sig-label {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.16em;
            color: #64748b;
            margin-top: 6px;
          }
          .pro-doc-sig-img {
            max-height: 64px;
            max-width: 180px;
            object-fit: contain;
            margin-top: 8px;
          }
          .pro-doc-contact {
            font-size: 14px;
            line-height: 1.6;
            color: #475569;
          }
          .pro-doc-pre-wrap {
            white-space: pre-wrap;
          }

          @media print {
            .no-print { display: none !important; }
            body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
            .professional-doc-page {
              position: static !important;
            }
            .pro-doc-inner {
              max-width: none !important;
              padding: 20mm 12mm !important;
              box-shadow: none !important;
              border: none !important;
              border-radius: 0 !important;
              margin: 0 !important;
            }
            .pro-doc-header {
              border-bottom-color: #000 !important;
            }
            .pro-doc-meta-item {
              border-color: #d1d5db !important;
              background: #f9fafb !important;
            }
            .pro-doc-content {
              border-color: #d1d5db !important;
              background: #f9fafb !important;
            }
            .pro-doc-status-badge {
              border-color: #d1d5db !important;
              background: #f9fafb !important;
            }
            img { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
            .pro-doc-notes-box { break-inside: avoid; }
            .pro-doc-footer-grid { break-inside: avoid; }
          }
        `}</style>
      </div>
    );
  },
);

ProfessionalDocumentView.displayName = 'ProfessionalDocumentView';

export default ProfessionalDocumentView;
