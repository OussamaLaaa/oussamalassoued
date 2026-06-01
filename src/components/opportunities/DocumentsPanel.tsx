import React, { useMemo, useState } from 'react';
import OpportunityModal from './OpportunityModal';
import DocumentForm from './DocumentForm';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Input from '../ui/Input';
import Select from '../ui/Select';
import StatCard from '../ui/StatCard';
import type { Company, Deal, DocumentInput, DocumentItem, DocumentStatus, DocumentType, Person, Project } from '../../types/opportunities';
import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';

type DocumentsTab = 'dashboard' | 'all' | 'invoices' | 'contracts' | 'agreements' | 'receipts' | 'review';

interface DocumentsPanelProps {
 documents: DocumentItem[];
 projects: Project[];
 companies: Company[];
 people: Person[];
 deals: Deal[];
 onAddDocument: (input: DocumentInput) => Promise<DocumentItem>;
 onUpdateDocument: (id: string, input: Partial<DocumentInput>) => Promise<DocumentItem>;
 onDeleteDocument: (id: string) => Promise<void>;
}

const REVIEW_PROMPTS = [
 'Which invoices are unpaid?',
 'Which contracts need signing?',
 'Which documents are overdue?',
 'Which documents should be archived?',
 'Which documents are missing for this project/client?',
];

const formatDate = (value?: string) => {
 if (!value) return '—';
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return value;
 return date.toLocaleDateString();
};

const toDateOnly = (value?: string) => {
 if (!value) return null;
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return null;
 date.setHours(0, 0, 0, 0);
 return date;
};

const formatAmount = (amount?: number, currency = 'MYR') => {
 if (amount == null || Number.isNaN(Number(amount))) return '—';
 return `${currency} ${Number(amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const getTypeBadgeVariant = (type: DocumentType): 'blue' | 'purple' | 'success' | 'warning' | 'danger' | 'neutral' => {
 switch (type) {
 case 'invoice': return 'blue';
 case 'contract': return 'purple';
 case 'agreement': return 'success';
 case 'receipt': return 'warning';
 case 'proposal': return 'purple';
 case 'legal': return 'danger';
 case 'admin': return 'neutral';
 case 'other': return 'neutral';
 }
};

const getStatusBadgeVariant = (status: DocumentStatus): 'success' | 'blue' | 'warning' | 'danger' | 'neutral' => {
 switch (status) {
 case 'paid':
 case 'signed':
 return 'success';
 case 'sent':
 return 'blue';
 case 'unpaid':
 return 'warning';
 case 'overdue':
 return 'danger';
 case 'archived':
 case 'cancelled':
 return 'neutral';
 case 'draft':
 default:
 return 'neutral';
 }
};

const isOverdueDocument = (document: DocumentItem, today: Date) => {
 const dueDate = toDateOnly(document.dueDate);
 if (!dueDate) return false;
 if (dueDate.getTime() >= today.getTime()) return false;
 return !['paid', 'signed', 'archived', 'cancelled'].includes(document.status);
};

const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ documents, projects, companies, people, deals, onAddDocument, onUpdateDocument, onDeleteDocument }) => {
 const { t } = usePersonalLanguage();
 const [tab, setTab] = useState<DocumentsTab>('dashboard');
 const [searchQuery, setSearchQuery] = useState('');
 const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
 const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
 const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; document?: DocumentItem } | null>(null);

 const TABS: Array<{ id: DocumentsTab; label: string }> = [
 { id: 'dashboard', label: t('documents.Dashboard', 'Dashboard') },
 { id: 'all', label: t('documents.All Documents', 'All Documents') },
 { id: 'invoices', label: t('documents.Invoices', 'Invoices') },
 { id: 'contracts', label: t('documents.Contracts', 'Contracts') },
 { id: 'agreements', label: t('documents.Agreements', 'Agreements') },
 { id: 'receipts', label: t('documents.Receipts', 'Receipts') },
 { id: 'review', label: t('documents.Review', 'Review') },
 ];

 const TYPE_LABELS: Record<DocumentType, string> = {
 document: t('documents.Document', 'Document'),
 invoice: t('documents.Invoice', 'Invoice'),
 contract: t('documents.Contract', 'Contract'),
 agreement: t('documents.Agreement', 'Agreement'),
 receipt: t('documents.Receipt', 'Receipt'),
 proposal: t('documents.Proposal', 'Proposal'),
 legal: t('documents.Legal', 'Legal'),
 admin: t('documents.Admin', 'Admin'),
 other: t('documents.Other', 'Other'),
 cahier_de_charges: t('documents.Cahier de Charges', 'Cahier de Charges'),
 ux_audit_report: t('documents.UX Audit Report', 'UX Audit Report'),
 project_brief: t('documents.Project Brief', 'Project Brief'),
 };

 const STATUS_LABELS: Record<DocumentStatus, string> = {
 draft: t('documents.Draft', 'Draft'),
 ready: t('documents.Ready', 'Ready'),
 sent: t('documents.Sent', 'Sent'),
 signed: t('documents.Signed', 'Signed'),
 paid: t('documents.Paid', 'Paid'),
 unpaid: t('documents.Unpaid', 'Unpaid'),
 overdue: t('documents.Overdue', 'Overdue'),
 archived: t('documents.Archived', 'Archived'),
 cancelled: t('documents.Cancelled', 'Cancelled'),
 };

 const TYPE_OPTIONS = [
 { value: 'all', label: t('documents.All', 'All') },
 ...Object.entries(TYPE_LABELS).map(([value, label]) => ({ value, label })),
 ];

 const STATUS_OPTIONS = [
 { value: 'all', label: t('documents.All', 'All') },
 ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
 ];

 const today = useMemo(() => {
 const date = new Date();
 date.setHours(0, 0, 0, 0);
 return date;
 }, []);

 const visibleDocuments = useMemo(() => {
 const query = searchQuery.trim().toLowerCase();
 const base = documents.filter((document) => {
 const matchesType = typeFilter === 'all' || document.type === typeFilter;
 const matchesStatus = statusFilter === 'all' || document.status === statusFilter;
 const searchable = [
 document.name,
 document.type,
 document.status,
 document.relatedProjectName,
 document.relatedCompanyName,
 document.relatedPersonName,
 document.relatedDealName,
 document.notes,
 ]
 .filter(Boolean)
 .join(' ')
 .toLowerCase();
 const matchesSearch = !query || searchable.includes(query);
 return matchesType && matchesStatus && matchesSearch;
 });

 const filteredByTab = base.filter((document) => {
 if (tab === 'all' || tab === 'dashboard' || tab === 'review') return true;
 return document.type === tab.slice(0, -1) || (tab === 'agreements' && document.type === 'agreement') || (tab === 'receipts' && document.type === 'receipt') || (tab === 'invoices' && document.type === 'invoice') || (tab === 'contracts' && document.type === 'contract');
 });

 return [...filteredByTab].sort((a, b) => {
 const aTime = new Date(a.updatedAt || a.createdAt || 0).getTime();
 const bTime = new Date(b.updatedAt || b.createdAt || 0).getTime();
 return bTime - aTime;
 });
 }, [documents, searchQuery, statusFilter, tab, typeFilter]);

 const metrics = useMemo(() => {
 const openInvoices = documents.filter((document) => document.type === 'invoice' && !['paid', 'cancelled', 'archived'].includes(document.status)).length;
 const unpaidAmount = documents
 .filter((document) => document.type === 'invoice' && ['unpaid', 'overdue', 'sent'].includes(document.status))
 .reduce((sum, document) => sum + (Number(document.amount) || 0), 0);
 const contractsSigned = documents.filter((document) => document.type === 'contract' && document.status === 'signed').length;
 const dueSoon = documents.filter((document) => {
 const dueDate = toDateOnly(document.dueDate);
 if (!dueDate) return false;
 const windowEnd = new Date(today);
 windowEnd.setDate(windowEnd.getDate() + 7);
 return dueDate.getTime() >= today.getTime() && dueDate.getTime() <= windowEnd.getTime();
 }).length;
 const overdue = documents.filter((document) => isOverdueDocument(document, today)).length;

 return {
 totalDocuments: documents.length,
 openInvoices,
 unpaidAmount,
 contractsSigned,
 dueSoon,
 overdue,
 };
 }, [documents, today]);

 const dueSoonList = useMemo(() => {
 const windowEnd = new Date(today);
 windowEnd.setDate(windowEnd.getDate() + 7);
 return documents.filter((document) => {
 const dueDate = toDateOnly(document.dueDate);
 if (!dueDate) return false;
 return dueDate.getTime() >= today.getTime() && dueDate.getTime() <= windowEnd.getTime();
 });
 }, [documents, today]);

 const overdueList = useMemo(() => documents.filter((document) => isOverdueDocument(document, today)), [documents, today]);

 const documentsForQuickTab = useMemo(() => {
 if (tab === 'invoices') return visibleDocuments.filter((document) => document.type === 'invoice');
 if (tab === 'contracts') return visibleDocuments.filter((document) => document.type === 'contract');
 if (tab === 'agreements') return visibleDocuments.filter((document) => document.type === 'agreement');
 if (tab === 'receipts') return visibleDocuments.filter((document) => document.type === 'receipt');
 if (tab === 'all') return visibleDocuments;
 if (tab === 'dashboard' || tab === 'review') return visibleDocuments;
 return visibleDocuments;
 }, [tab, visibleDocuments]);

 const openCreate = () => setEditor({ mode: 'create' });
 const openEdit = (document: DocumentItem) => setEditor({ mode: 'edit', document });
 const closeEditor = () => setEditor(null);

 const handleQuickStatus = async (document: DocumentItem, status: DocumentStatus) => {
 const patch: Partial<DocumentInput> = { status };
 if (status === 'paid') {
 patch.paidDate = new Date().toISOString().slice(0, 10);
 }
 await onUpdateDocument(document.id, patch);
 };

 const handleSubmitDocument = async (input: DocumentInput) => {
 if (editor?.mode === 'edit' && editor.document) {
 await onUpdateDocument(editor.document.id, input);
 } else {
 await onAddDocument(input);
 }
 closeEditor();
 };

 const renderDocumentCard = (document: DocumentItem) => {
 const relatedParts = [document.relatedProjectName, document.relatedCompanyName, document.relatedPersonName, document.relatedDealName].filter(Boolean);
 const isInvoice = document.type === 'invoice';
 const isContract = document.type === 'contract';

 return (
 <article key={document.id} className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="min-w-0 flex-1">
 <h3 className="truncate text-base font-semibold text-black">{document.name}</h3>
 <div className="mt-2 flex flex-wrap gap-2">
 <Badge variant={getTypeBadgeVariant(document.type)}>{TYPE_LABELS[document.type]}</Badge>
 <Badge variant={getStatusBadgeVariant(document.status)}>{STATUS_LABELS[document.status]}</Badge>
 </div>
 </div>

 <div className="flex flex-wrap gap-2">
 {document.url ? (
 <Button
 variant="secondary"
 size="sm"
 onClick={() => window.open(document.url, '_blank', 'noopener,noreferrer')}
 >
 {t('documents.Open', 'Open')}
 </Button>
 ) : null}
 <Button
 variant="secondary"
 size="sm"
 onClick={() => openEdit(document)}
 >
 {t('documents.Edit', 'Edit')}
 </Button>
 <Button
 variant="danger"
 size="sm"
 onClick={() => void onDeleteDocument(document.id)}
 >
 {t('documents.Delete', 'Delete')}
 </Button>
 </div>
 </div>

 <div className="mt-4 grid gap-3 text-sm text-neutral-600 md:grid-cols-2">
 <div className="space-y-1">
 <div><span className="font-medium text-black">{t('documents.Amount:', 'Amount:')}</span> {formatAmount(document.amount, document.currency)}</div>
 <div><span className="font-medium text-black">{t('documents.Issue:', 'Issue:')}</span> {formatDate(document.issueDate)}</div>
 <div><span className="font-medium text-black">{t('documents.Due:', 'Due:')}</span> {formatDate(document.dueDate)}</div>
 <div><span className="font-medium text-black">{t('documents.Paid:', 'Paid:')}</span> {formatDate(document.paidDate)}</div>
 </div>
 <div className="space-y-1">
 <div><span className="font-medium text-black">{t('documents.Related:', 'Related:')}</span> {relatedParts.length > 0 ? relatedParts.join(' · ') : t('documents.None', 'None')}</div>
 <div><span className="font-medium text-black">{t('documents.Updated:', 'Updated:')}</span> {formatDate(document.updatedAt || document.createdAt)}</div>
 {document.url ? <div className="break-all"><span className="font-medium text-black">{t('documents.Link:', 'Link:')}</span> {document.url}</div> : null}
 </div>
 </div>

 {(isInvoice || isContract) && (
 <div className="mt-4 flex flex-wrap gap-2 border-t border-neutral-200 pt-3">
 <Button variant="secondary" size="sm" onClick={() => void handleQuickStatus(document, 'sent')}>{t('documents.Mark Sent', 'Mark Sent')}</Button>
 {isInvoice ? (
 <>
 <Button variant="success" size="sm" onClick={() => void handleQuickStatus(document, 'paid')}>{t('documents.Mark Paid', 'Mark Paid')}</Button>
 <Button variant="danger" size="sm" onClick={() => void handleQuickStatus(document, 'overdue')}>{t('documents.Mark Overdue', 'Mark Overdue')}</Button>
 </>
 ) : null}
 {isContract ? (
 <Button variant="success" size="sm" onClick={() => void handleQuickStatus(document, 'signed')}>{t('documents.Mark Signed', 'Mark Signed')}</Button>
 ) : null}
 <Button variant="ghost" size="sm" onClick={() => void handleQuickStatus(document, 'archived')}>{t('documents.Archive', 'Archive')}</Button>
 </div>
 )}
 </article>
 );
 };

 return (
 <div className="space-y-5">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="flex flex-wrap items-center justify-between gap-4">
 <div>
 <h2 className="text-lg font-semibold text-black">{t('documents.Documents OS', 'Documents OS')}</h2>
 <p className="mt-1 text-sm text-neutral-500">{t('documents.Track invoices, contracts, agreements, receipts, proposals, and admin notes in one place.', 'Track invoices, contracts, agreements, receipts, proposals, and admin notes in one place.')}</p>
 </div>
 <Button variant="primary" onClick={openCreate}>{t('documents.New Document', 'New Document')}</Button>
 </div>

 <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
 <StatCard label={t('documents.Total Documents', 'Total Documents')} value={metrics.totalDocuments} />
 <StatCard label={t('documents.Open Invoices', 'Open Invoices')} value={metrics.openInvoices} />
 <StatCard label={t('documents.Unpaid Amount', 'Unpaid Amount')} value={formatAmount(metrics.unpaidAmount)} />
 <StatCard label={t('documents.Contracts Signed', 'Contracts Signed')} value={metrics.contractsSigned} />
 <StatCard label={t('documents.Documents Due Soon', 'Documents Due Soon')} value={metrics.dueSoon} />
 <StatCard label={t('documents.Overdue Documents', 'Overdue Documents')} value={metrics.overdue} />
 </div>
 </div>

 <div className="flex flex-wrap gap-2 border-b border-neutral-200 pb-3">
 {TABS.map((item) => (
 <button
 key={item.id}
 type="button"
 onClick={() => setTab(item.id)}
 className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === item.id ? 'bg-neutral-100 text-black' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
 >
 {item.label}
 </button>
 ))}
 </div>

 {tab === 'dashboard' ? (
 <div className="grid gap-5 lg:grid-cols-2">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">{t('documents.Due Soon', 'Due Soon')}</h3>
 <div className="mt-4 space-y-3">
 {dueSoonList.length === 0 ? <EmptyState text={t('documents.No documents due in next 7 days.', 'No documents are due in the next 7 days.')} /> : dueSoonList.slice(0, 6).map(renderDocumentCard)}
 </div>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <h3 className="text-sm font-semibold uppercase tracking-widest text-neutral-500">{t('documents.Overdue', 'Overdue')}</h3>
 <div className="mt-4 space-y-3">
 {overdueList.length === 0 ? <EmptyState text={t('documents.No overdue documents right now.', 'No overdue documents right now.')} /> : overdueList.slice(0, 6).map(renderDocumentCard)}
 </div>
 </div>
 </div>
 ) : null}

 {tab === 'review' ? (
 <div className="grid gap-4 md:grid-cols-2">
 {REVIEW_PROMPTS.map((prompt) => (
 <div key={prompt} className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="text-sm font-semibold text-black">{prompt}</div>
 <p className="mt-2 text-sm text-neutral-500">Use the document dashboard filters and status labels to answer this for your internal workflow. No legal advice is provided here.</p>
 </div>
 ))}
 </div>
 ) : null}

 {tab !== 'dashboard' && tab !== 'review' ? (
 <div className="space-y-4">
 {tab === 'all' ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="grid gap-3 md:grid-cols-4">
 <div className="md:col-span-2">
 <Input
 label={t('documents.Search', 'Search')}
 value={searchQuery}
 onChange={(event) => setSearchQuery(event.target.value)}
 placeholder={t('documents.Search by name, type, status, relation, or notes', 'Search by name, type, status, relation, or notes')}
 />
 </div>
 <Select
 label={t('documents.Type', 'Type')}
 value={typeFilter}
 onChange={(event) => setTypeFilter(event.target.value as DocumentType | 'all')}
 options={TYPE_OPTIONS}
 />
 <Select
 label={t('documents.Status', 'Status')}
 value={statusFilter}
 onChange={(event) => setStatusFilter(event.target.value as DocumentStatus | 'all')}
 options={STATUS_OPTIONS}
 />
 </div>
 </div>
 ) : null}

 <div className="grid gap-4 lg:grid-cols-2">
 {documentsForQuickTab.length === 0 ? <EmptyState text={t('documents.No documents match the current view.', 'No documents match the current view.')} /> : documentsForQuickTab.map(renderDocumentCard)}
 </div>
 </div>
 ) : null}

 {editor ? (
 <OpportunityModal title={editor.mode === 'edit' ? t('documents.Edit Document', 'Edit Document') : t('documents.New Document Title', 'New Document')} onClose={closeEditor}>
 <DocumentForm
 initialData={editor.document || undefined}
 projects={projects}
 companies={companies}
 people={people}
 deals={deals}
 onSubmit={handleSubmitDocument}
 onCancel={closeEditor}
 />
 </OpportunityModal>
 ) : null}
 </div>
 );
};

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
 <div className="rounded-lg border border-dashed border-neutral-300 bg-neutral-50 p-4 text-sm text-neutral-500">{text}</div>
);

export default DocumentsPanel;