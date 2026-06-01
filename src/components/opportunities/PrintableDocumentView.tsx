import React, { forwardRef, useMemo } from 'react';
import type { DocumentBrandSettings, GeneratedDocument } from '../../types/opportunities';

type PrintableDocumentViewProps = {
 document: GeneratedDocument;
 brandSettings?: DocumentBrandSettings | null;
 onClose?: () => void;
 showActions?: boolean;
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

const formatDocumentType = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());

const formatDate = (value?: string) => {
 if (!value) return '—';
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return value;
 return date.toLocaleDateString();
};

const formatMoney = (amount?: number, currency?: string) => {
 if (amount == null || Number.isNaN(Number(amount))) return '—';
 const resolvedCurrency = currency || 'MYR';
 return `${resolvedCurrency} ${Number(amount).toLocaleString('en-US', {
 minimumFractionDigits: 2,
 maximumFractionDigits: 2,
 })}`;
};

const resolveBrandSettings = (brandSettings?: DocumentBrandSettings | null): DocumentBrandSettings => ({
 ...DEFAULT_BRAND,
 ...brandSettings,
 brandName: brandSettings?.brandName?.trim() || DEFAULT_BRAND.brandName || 'Your Brand',
 ownerName: brandSettings?.ownerName?.trim() || DEFAULT_BRAND.ownerName || 'Your Name',
 signatureName: brandSettings?.signatureName?.trim() || brandSettings?.ownerName?.trim() || DEFAULT_BRAND.signatureName || 'Your Name',
});

const parseContentBlocks = (content?: string): ContentBlock[] => {
 const lines = String(content || '').split(/\r?\n/);
 const blocks: ContentBlock[] = [];
 let paragraphLines: string[] = [];

 const flushParagraph = () => {
 const paragraphText = paragraphLines.join('\n').trim();
 if (paragraphText) {
 blocks.push({ type: 'paragraph', text: paragraphText });
 }
 paragraphLines = [];
 };

 for (const rawLine of lines) {
 const line = rawLine.trim();
 if (!line) {
 flushParagraph();
 continue;
 }

 if (line.startsWith('# ')) {
 flushParagraph();
 blocks.push({ type: 'heading', text: line.slice(2).trim() });
 continue;
 }

 paragraphLines.push(rawLine);
 }

 flushParagraph();
 return blocks;
};

const InfoRow: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
 <div className="rounded-xl border border-[#e5e7eb] bg-white p-3">
 <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[#64748b]">{label}</div>
 <div className="mt-1 text-sm text-[#0f172a]">{value ?? '—'}</div>
 </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
 <h3 className="text-[15px] font-semibold tracking-tight text-[#0f172a]">{children}</h3>
);

const PrintableDocumentView = forwardRef<HTMLDivElement, PrintableDocumentViewProps>(({ document, brandSettings, showActions }, ref) => {
 const brand = useMemo(() => resolveBrandSettings(brandSettings), [brandSettings]);
 const blocks = useMemo(() => parseContentBlocks(document.content), [document.content]);
 const paidDate = (document as GeneratedDocument & { paidDate?: string }).paidDate;
 const isInvoice = document.type === 'invoice';
 const isAgreementStyle = ['contract', 'agreement', 'cahier_de_charges', 'proposal'].includes(document.type);

 return (
 <div className="document-print-root bg-[#f8fafc] text-[#0f172a]">
 <div ref={ref} className="document-print-page mx-auto w-full max-w-[210mm] bg-white px-5 py-6 sm:px-8 sm:py-8 lg:px-10">
 <header className="border-b border-[#e5e7eb] pb-5">
 <div className="flex items-start justify-between gap-4">
 <div className="flex min-w-0 items-start gap-4">
 {brand.logoUrl ? (
 <img
 src={brand.logoUrl}
 alt={brand.brandName || 'Brand logo'}
 crossOrigin="anonymous"
 referrerPolicy="no-referrer"
 className="h-14 w-14 shrink-0 rounded-xl object-contain"
 />
 ) : null}
 <div className="min-w-0">
 <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Document Studio</div>
 <div className="mt-1 text-2xl font-semibold tracking-tight text-[#0f172a]">
 {brand.brandName || 'Your Brand'}
 </div>
 <div className="mt-1 text-sm text-[#475569]">{brand.ownerName || 'Your Name'}</div>
 </div>
 </div>
 <div className="text-right text-sm text-[#475569]">
 {brand.website ? <div>{brand.website}</div> : null}
 {brand.email ? <div>{brand.email}</div> : null}
 {brand.phone ? <div>{brand.phone}</div> : null}
 </div>
 </div>
 </header>

 <section className="mt-6">
 <div className="flex flex-wrap items-start justify-between gap-4">
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">{formatDocumentType(document.type)}</div>
 <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#0f172a]">{document.title}</h1>
 {document.notes ? <p className="mt-2 max-w-2xl text-sm leading-6 text-[#475569]">{document.notes}</p> : null}
 </div>
 <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 text-right text-sm text-[#475569]">
 <div className="font-semibold text-[#0f172a]">Status</div>
 <div className="mt-1 capitalize">{document.status.replace(/_/g, ' ')}</div>
 </div>
 </div>
 </section>

 <section className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
 <InfoRow label="Issue Date" value={formatDate(document.issueDate)} />
 <InfoRow label="Due Date" value={formatDate(document.dueDate)} />
 <InfoRow label={t("Amount", "Amount", "Amount")} value={isInvoice || document.amount != null ? formatMoney(document.amount, document.currency) : '—'} />
 <InfoRow
 label="Related"
 value={document.relatedCompanyName || document.relatedProjectName || document.relatedPersonName || document.relatedDealName || '—'}
 />
 </section>

 {isInvoice ? (
 <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
 <SectionTitle>Invoice Details</SectionTitle>
 <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 <InfoRow label={t("Amount", "Amount", "Amount")} value={formatMoney(document.amount, document.currency)} />
 <InfoRow label="Currency" value={document.currency || brand.defaultCurrency || 'MYR'} />
 <InfoRow label="Issue Date" value={formatDate(document.issueDate)} />
 <InfoRow label="Due Date" value={formatDate(document.dueDate)} />
 </div>
 <div className="mt-3 grid gap-3 sm:grid-cols-2">
 <InfoRow label={t("Status", "Status", "Status")} value={<span className="capitalize">{document.status.replace(/_/g, ' ')}</span>} />
 <InfoRow label="Paid Date" value={document.status === 'paid' ? formatDate(paidDate) : '—'} />
 </div>
 {brand.paymentNotes ? (
 <div className="mt-4 rounded-xl border border-[#dbe4f0] bg-white p-4 text-sm leading-6 text-[#475569]">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Payment Notes</div>
 <div className="mt-2 whitespace-pre-wrap">{brand.paymentNotes}</div>
 </div>
 ) : null}
 </section>
 ) : null}

 {isAgreementStyle ? (
 <section className="mt-6 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
 <SectionTitle>Agreement / Scope Details</SectionTitle>
 <div className="mt-3 grid gap-3 sm:grid-cols-2">
 <InfoRow label="Project" value={document.relatedProjectName || '—'} />
 <InfoRow label={t("Company", "Company", "Company")} value={document.relatedCompanyName || '—'} />
 <InfoRow label={t("Person", "Person", "Person")} value={document.relatedPersonName || '—'} />
 <InfoRow label="Deal" value={document.relatedDealName || '—'} />
 </div>
 <div className="mt-3 grid gap-3 sm:grid-cols-2">
 <InfoRow label="Signed Date" value={formatDate(document.signedDate)} />
 <InfoRow label="Currency" value={document.currency || brand.defaultCurrency || 'MYR'} />
 </div>
 {brand.legalNotes ? (
 <div className="mt-4 rounded-xl border border-[#dbe4f0] bg-white p-4 text-sm leading-6 text-[#475569]">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Legal Notes</div>
 <div className="mt-2 whitespace-pre-wrap">{brand.legalNotes}</div>
 </div>
 ) : null}
 </section>
 ) : null}

 <section className="mt-6">
 <SectionTitle>Document Content</SectionTitle>
 <div className="mt-3 space-y-4 rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-5 text-sm leading-7 text-[#0f172a]">
 {blocks.length > 0 ? (
 blocks.map((block, index) =>
 block.type === 'heading' ? (
 <h2 key={`${block.type}-${index}`} className="pt-1 text-lg font-semibold tracking-tight text-[#0f172a]">
 {block.text}
 </h2>
 ) : (
 <p key={`${block.type}-${index}`} className="whitespace-pre-line text-[#0f172a]">
 {block.text}
 </p>
 ),
 )
 ) : (
 <p className="text-[#64748b]">No document content saved.</p>
 )}
 </div>
 </section>

 <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
 <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
 <SectionTitle>Signature</SectionTitle>
 <div className="mt-4 flex items-end gap-4">
 <div className="min-w-0 flex-1">
 <div className="text-sm text-[#475569]">{brand.signatureName || brand.ownerName || 'Your Name'}</div>
 <div className="mt-3 h-px w-full bg-[#cbd5e1]" />
 <div className="mt-2 text-xs uppercase tracking-[0.16em] text-[#64748b]">Authorized Signature</div>
 </div>
 {brand.signatureUrl ? (
 <img
 src={brand.signatureUrl}
 alt={brand.signatureName || brand.ownerName || 'Signature'}
 crossOrigin="anonymous"
 referrerPolicy="no-referrer"
 className="max-h-16 max-w-[180px] object-contain"
 />
 ) : null}
 </div>
 </div>

 <div className="rounded-2xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
 <SectionTitle>Brand Contact</SectionTitle>
 <div className="mt-3 space-y-2 text-sm leading-6 text-[#475569]">
 <div>{brand.ownerName || 'Your Name'}</div>
 <div>{brand.brandName || 'Your Brand'}</div>
 {brand.address ? <div className="whitespace-pre-wrap">{brand.address}</div> : null}
 {brand.email ? <div>{brand.email}</div> : null}
 {brand.phone ? <div>{brand.phone}</div> : null}
 {brand.website ? <div>{brand.website}</div> : null}
 </div>
 </div>
 </section>

 {showActions ? (
 <div className="no-print mt-6 rounded-xl border border-dashed border-[#dbe4f0] bg-[#fafcff] px-4 py-3 text-sm text-[#64748b]">
 Use the print controls above to save this document as a PDF.
 </div>
 ) : null}
 </div>
 </div>
 );
});

PrintableDocumentView.displayName = 'PrintableDocumentView';

export default PrintableDocumentView;
