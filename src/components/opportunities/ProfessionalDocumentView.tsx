import React, { forwardRef, useMemo } from 'react';
import type { DocumentBrandSettings, GeneratedDocument } from '../../types/opportunities';

type ProfessionalDocumentViewProps = {
 document: GeneratedDocument;
 brandSettings?: DocumentBrandSettings | null;
};

type ContentBlock =
 | { type: 'heading1'; text: string }
 | { type: 'heading2'; text: string }
 | { type: 'bullet'; text: string }
 | { type: 'paragraph'; text: string };

type DocType = GeneratedDocument['type'];

const DEFAULT_BRAND: DocumentBrandSettings = {
 id: 'fallback',
 brandName: 'Your Brand',
 ownerName: 'Your Name',
 signatureName: 'Your Name',
 defaultCurrency: 'MYR',
};

const FORMATTED_TYPE_LABELS: Record<string, string> = {
 contract: 'CONTRACT',
 cahier_de_charges: 'CAHIER DE CHARGES',
 proposal: 'PROPOSAL',
 agreement: 'AGREEMENT',
 receipt: 'RECEIPT',
 ux_audit_report: 'UX AUDIT REPORT',
 project_brief: 'PROJECT BRIEF',
 document: 'DOCUMENT',
 other: 'DOCUMENT',
 legal: 'LEGAL DOCUMENT',
 admin: 'ADMIN DOCUMENT',
};

const STATUS_STYLES: Record<string, string> = {
 draft: 'border-gray-200 bg-gray-50 text-gray-600',
 ready: 'border-blue-200 bg-blue-50 text-blue-700',
 sent: 'border-blue-200 bg-blue-50 text-blue-700',
 signed: 'border-green-200 bg-green-50 text-green-700',
 paid: 'border-green-200 bg-green-50 text-green-700',
 unpaid: 'border-amber-200 bg-amber-50 text-amber-700',
 overdue: 'border-red-200 bg-red-50 text-red-700',
 archived: 'border-gray-200 bg-gray-50 text-gray-500',
 cancelled: 'border-red-200 bg-red-50 text-red-700',
};

const TYPE_SECTION_TITLES: Record<string, string> = {
 contract: 'Client / Project',
 cahier_de_charges: 'Client / Project',
 proposal: 'Client / Project',
 agreement: 'Client / Project',
 receipt: 'Received From / Related To',
 ux_audit_report: 'Audited Entity',
 project_brief: 'Related Information',
 document: 'Related Information',
 other: 'Related Information',
 legal: 'Related Information',
 admin: 'Related Information',
};

const formatDate = (value?: string) => {
 if (!value) return '\u2014';
 const d = new Date(value);
 if (Number.isNaN(d.getTime())) return value;
 return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

const formatMoney = (amount?: number, currency?: string) => {
 if (amount == null || Number.isNaN(Number(amount))) return '\u2014';
 const c = currency || 'MYR';
 const cur = c.toUpperCase();
 if (cur === 'USD') return `$${Number(amount).toFixed(2)}`;
 if (cur === 'EUR') return `\u20AC${Number(amount).toFixed(2)}`;
 if (cur === 'TND') return `${Number(amount).toFixed(2)} TND`;
 return `${cur} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
 if (line.startsWith('## ')) {
 flush();
 blocks.push({ type: 'heading2', text: line.slice(3).trim() });
 continue;
 }
 if (line.startsWith('# ')) {
 flush();
 blocks.push({ type: 'heading1', text: line.slice(2).trim() });
 continue;
 }
 if (line.startsWith('- ') || line.startsWith('* ')) {
 flush();
 blocks.push({ type: 'bullet', text: line.slice(2).trim() });
 continue;
 }
 para.push(raw);
 }

 flush();
 return blocks;
};

const MetaCard: React.FC<{ label: string; value: React.ReactNode }> = ({ label, value }) => (
 <div className="rounded-lg border border-[#e5e7eb] bg-[#fafafa] p-3">
 <div className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[#64748b]">{label}</div>
 <div className="mt-1 text-sm font-medium text-[#0f172a]">{value}</div>
 </div>
);

const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
 <h3 className="text-sm font-bold uppercase tracking-[0.05em] text-[#64748b]">{children}</h3>
);

const ProfessionalDocumentView = forwardRef<HTMLDivElement, ProfessionalDocumentViewProps>(
 ({ document, brandSettings }, ref) => {
 const brand = useMemo(() => resolveBrand(brandSettings), [brandSettings]);
 const blocks = useMemo(() => parseContent(document.content), [document.content]);
 const statusClass = STATUS_STYLES[document.status] || STATUS_STYLES.draft;
 const typeLabel = FORMATTED_TYPE_LABELS[document.type] || document.type.replace(/_/g, ' ').toUpperCase();
 const sectionTitle = TYPE_SECTION_TITLES[document.type] || 'Related Information';
 const isContractLike: DocType[] = ['contract', 'agreement', 'cahier_de_charges', 'proposal'];
 const showContractDetails = isContractLike.includes(document.type);
 const isReceipt = document.type === 'receipt';
 const hasRelated = Boolean(
 document.relatedCompanyName || document.relatedProjectName || document.relatedPersonName || document.relatedDealName,
 );
 const showLegalNotes = Boolean(brand.legalNotes);
 const showPaymentNotes = Boolean(brand.paymentNotes);
 const showSignature = Boolean(brand.signatureUrl || brand.signatureName);
 const showContact = Boolean(brand.ownerName || brand.brandName || brand.address || brand.email || brand.phone || brand.website);

 const metaItems: { label: string; value: React.ReactNode }[] = [];
 metaItems.push({ label: 'Type', value: typeLabel });
 if (document.issueDate) metaItems.push({ label: 'Issue Date', value: formatDate(document.issueDate) });
 if (document.dueDate) metaItems.push({ label: 'Due Date', value: formatDate(document.dueDate) });
 if (document.signedDate) metaItems.push({ label: 'Signed Date', value: formatDate(document.signedDate) });
 if (document.amount != null && !isReceipt) metaItems.push({ label: 'Amount', value: formatMoney(document.amount, document.currency) });

 return (
 <div
 ref={ref}
 className="document-print-page mx-auto w-full max-w-[900px] rounded-xl border border-[#e5e7eb] bg-white px-10 py-10 text-[#0f172a] print:rounded-none print:border-0 print:shadow-none"
 >
 {/* ─── Header ─── */}
 <div className="flex items-start justify-between gap-8">
 <div className="flex-1">
 <h1 className="text-3xl font-bold text-[#0f172a]">
 {brand.brandName || 'Your Brand'}
 </h1>
 <div className="mt-2 space-y-0.5 text-sm leading-relaxed text-[#334155]">
 {brand.ownerName ? <div>{brand.ownerName}</div> : null}
 {brand.address ? <div className="whitespace-pre-wrap">{brand.address}</div> : null}
 <div className="flex flex-wrap gap-x-4 text-[#64748b]">
 {brand.email ? <span>{brand.email}</span> : null}
 {brand.phone ? <span>{brand.phone}</span> : null}
 {brand.website ? <span>{brand.website}</span> : null}
 </div>
 </div>
 </div>
 <div className="flex flex-col items-end gap-4">
 {brand.logoUrl ? (
 <img
 src={brand.logoUrl}
 alt="Logo"
 className="max-h-16 w-auto max-w-[90px] rounded-md object-contain"
 onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
 />
 ) : null}
 <div className="min-w-[200px] space-y-1.5 text-right text-sm">
 <div className="inline-block rounded-md border border-[#e5e7eb] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#64748b]">
 {typeLabel}
 </div>
 <div className="flex items-center justify-end gap-3">
 <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Status</span>
 <span className={`inline-block rounded-md border px-2.5 py-0.5 text-xs font-medium capitalize ${statusClass}`}>
 {document.status.replace(/_/g, ' ')}
 </span>
 </div>
 {document.issueDate ? (
 <div className="flex items-center justify-end gap-3">
 <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Date</span>
 <span className="text-sm text-[#0f172a]">{formatDate(document.issueDate)}</span>
 </div>
 ) : null}
 {document.dueDate ? (
 <div className="flex items-center justify-end gap-3">
 <span className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Due</span>
 <span className="text-sm text-[#0f172a]">{formatDate(document.dueDate)}</span>
 </div>
 ) : null}
 </div>
 </div>
 </div>

 {/* ─── Separator ─── */}
 <div className="mt-6 border-t border-[#e5e7eb]" />

 {/* ─── Document Title ─── */}
 <div className="mt-6">
 <div className="flex items-center gap-3">
 <span className="rounded-md bg-[#f1f5f9] px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#64748b]">
 {typeLabel}
 </span>
 <span className={`rounded-md border px-2.5 py-1 text-xs font-medium capitalize ${statusClass}`}>
 {document.status.replace(/_/g, ' ')}
 </span>
 </div>
 <h2 className="mt-3 text-2xl font-bold text-[#0f172a]">{document.title}</h2>
 {document.notes ? (
 <p className="mt-2 max-w-2xl whitespace-pre-wrap text-sm leading-relaxed text-[#334155]">
 {document.notes}
 </p>
 ) : null}
 </div>

 {/* ─── Related / Recipient Info ─── */}
 {hasRelated ? (
 <div className="mt-8">
 <SectionTitle>{sectionTitle}</SectionTitle>
 <div className="mt-3 space-y-0.5 text-sm leading-relaxed text-[#334155]">
 {document.relatedCompanyName ? (
 <div className="text-base font-semibold text-[#0f172a]">{document.relatedCompanyName}</div>
 ) : null}
 {document.relatedProjectName ? <div>{document.relatedProjectName}</div> : null}
 {document.relatedPersonName ? <div className="text-[#64748b]">{document.relatedPersonName}</div> : null}
 {document.relatedDealName ? <div className="text-[#64748b]">{document.relatedDealName}</div> : null}
 </div>
 </div>
 ) : null}

 {/* ─── Receipt Amount Block ─── */}
 {isReceipt && document.amount != null ? (
 <div className="mt-8 rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-5">
 <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Amount</div>
 <div className="mt-1 text-xl font-bold text-[#0f172a]">{formatMoney(document.amount, document.currency)}</div>
 </div>
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Currency</div>
 <div className="mt-1 text-sm font-medium text-[#334155]">{document.currency || brand.defaultCurrency || 'MYR'}</div>
 </div>
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Issue Date</div>
 <div className="mt-1 text-sm font-medium text-[#334155]">{formatDate(document.issueDate)}</div>
 </div>
 <div>
 <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Status</div>
 <div className="mt-1">
 <span className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium capitalize ${statusClass}`}>
 {document.status.replace(/_/g, ' ')}
 </span>
 </div>
 </div>
 </div>
 </div>
 ) : null}

 {/* ─── Amount inline for non-receipt ─── */}
 {!isReceipt && document.amount != null ? (
 <div className="mt-6">
 <MetaCard label="Amount" value={formatMoney(document.amount, document.currency)} />
 </div>
 ) : null}

 {/* ─── Contract Details ─── */}
 {showContractDetails && (document.relatedProjectName || document.relatedCompanyName || document.relatedPersonName || document.signedDate || showLegalNotes) ? (
 <div className="mt-8">
 <SectionTitle>Agreement Details</SectionTitle>
 <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 {document.relatedProjectName ? <MetaCard label="Project" value={document.relatedProjectName} /> : null}
 {document.relatedCompanyName ? <MetaCard label="Company" value={document.relatedCompanyName} /> : null}
 {document.relatedPersonName ? <MetaCard label="Contact" value={document.relatedPersonName} /> : null}
 {document.signedDate ? <MetaCard label="Signed Date" value={formatDate(document.signedDate)} /> : null}
 </div>
 {showLegalNotes ? (
 <div className="mt-4 rounded-lg border border-[#dbe4f0] bg-[#fafcff] p-4">
 <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Legal Notes</div>
 <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#475569]">{brand.legalNotes}</div>
 </div>
 ) : null}
 </div>
 ) : null}

 {/* ─── Meta Grid for other types ─── */}
 {!showContractDetails && !isReceipt && metaItems.length > 1 ? (
 <div className="mt-8">
 <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
 {metaItems.map((item, i) => (
 <MetaCard key={i} label={item.label} value={item.value} />
 ))}
 </div>
 </div>
 ) : null}

 {/* ─── Main Content ─── */}
 <div className="mt-8">
 <SectionTitle>Document Content</SectionTitle>
 {blocks.length > 0 ? (
 <div className="mt-4 space-y-3">
 {blocks.map((block, i) => {
 if (block.type === 'heading1') {
 return (
 <h2 key={i} className="pt-3 text-lg font-bold text-[#0f172a] first:pt-0">
 {block.text}
 </h2>
 );
 }
 if (block.type === 'heading2') {
 return (
 <h3 key={i} className="pt-2 text-base font-semibold text-[#0f172a] first:pt-0">
 {block.text}
 </h3>
 );
 }
 if (block.type === 'bullet') {
 return (
 <div key={i} className="ml-4 flex items-start gap-3 text-sm leading-relaxed text-[#334155]">
 <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-[#64748b]" />
 <span className="flex-1 whitespace-pre-line">{block.text}</span>
 </div>
 );
 }
 return (
 <p key={i} className="whitespace-pre-line text-sm leading-relaxed text-[#334155]">
 {block.text}
 </p>
 );
 })}
 </div>
 ) : (
 <p className="mt-3 text-sm italic text-[#64748b]">No document content saved.</p>
 )}
 </div>

 {/* ─── Signature + Footer ─── */}
 {(showSignature || showContact || showLegalNotes || showPaymentNotes) ? (
 <div className="mt-10 border-t border-[#e5e7eb] pt-8">
 <div className="grid gap-8 lg:grid-cols-2">
 {showSignature ? (
 <div>
 <SectionTitle>Signature</SectionTitle>
 {brand.signatureUrl ? (
 <img
 src={brand.signatureUrl}
 alt="Signature"
 className="mt-3 max-h-[70px] w-auto rounded object-contain"
 />
 ) : null}
 <div className="mt-2 text-sm font-semibold text-[#0f172a]">
 {brand.signatureName || brand.ownerName || 'Your Name'}
 </div>
 <div className="mt-2 h-px w-48 bg-[#cbd5e1]" />
 <div className="mt-1 text-xs uppercase tracking-[0.1em] text-[#64748b]">
 Authorized Signature
 </div>
 </div>
 ) : null}
 {showContact ? (
 <div>
 <SectionTitle>Contact</SectionTitle>
 <div className="mt-3 space-y-1 text-sm leading-relaxed text-[#334155]">
 <div className="font-semibold text-[#0f172a]">{brand.ownerName || 'Your Name'}</div>
 <div>{brand.brandName || 'Your Brand'}</div>
 {brand.address ? <div className="whitespace-pre-wrap text-[#64748b]">{brand.address}</div> : null}
 {brand.email ? <div className="text-[#64748b]">{brand.email}</div> : null}
 {brand.phone ? <div className="text-[#64748b]">{brand.phone}</div> : null}
 {brand.website ? <div className="text-[#64748b]">{brand.website}</div> : null}
 </div>
 </div>
 ) : null}
 </div>
 {showLegalNotes ? (
 <div className="mt-6 rounded-lg border border-[#dbe4f0] bg-[#fafcff] p-4">
 <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Legal Notes</div>
 <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#475569]">{brand.legalNotes}</div>
 </div>
 ) : null}
 {showPaymentNotes && isReceipt ? (
 <div className="mt-4 rounded-lg border border-[#dbe4f0] bg-[#fafcff] p-4">
 <div className="text-xs font-semibold uppercase tracking-[0.08em] text-[#64748b]">Payment Notes</div>
 <div className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-[#475569]">{brand.paymentNotes}</div>
 </div>
 ) : null}
 </div>
 ) : null}

 {/* ─── Print CSS ─── */}
 <style>{`
 @media print {
 .no-print { display: none !important; }
 body { background: #fff !important; margin: 0 !important; padding: 0 !important; }
 .document-print-page {
 page-break-after: avoid;
 }
 img { print-color-adjust: exact; -webkit-print-color-adjust: exact; }
 }
 `}</style>
 </div>
 );
 },
);

ProfessionalDocumentView.displayName = 'ProfessionalDocumentView';

export default ProfessionalDocumentView;
