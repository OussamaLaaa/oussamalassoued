import React, { useMemo, useState } from 'react';
import OpportunityModal from './OpportunityModal';
import DocumentForm from './DocumentForm';
import type { Company, Deal, DocumentInput, DocumentItem, DocumentStatus, DocumentType, Person, Project } from '../../types/opportunities';

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

const TABS: Array<{ id: DocumentsTab; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'all', label: 'All Documents' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'contracts', label: 'Contracts' },
  { id: 'agreements', label: 'Agreements' },
  { id: 'receipts', label: 'Receipts' },
  { id: 'review', label: 'Review' },
];

const REVIEW_PROMPTS = [
  'Which invoices are unpaid?',
  'Which contracts need signing?',
  'Which documents are overdue?',
  'Which documents should be archived?',
  'Which documents are missing for this project/client?',
];

const TYPE_LABELS: Record<DocumentType, string> = {
  document: 'Document',
  invoice: 'Invoice',
  contract: 'Contract',
  agreement: 'Agreement',
  receipt: 'Receipt',
  proposal: 'Proposal',
  legal: 'Legal',
  admin: 'Admin',
  other: 'Other',
};

const STATUS_LABELS: Record<DocumentStatus, string> = {
  draft: 'Draft',
  sent: 'Sent',
  signed: 'Signed',
  paid: 'Paid',
  unpaid: 'Unpaid',
  overdue: 'Overdue',
  archived: 'Archived',
  cancelled: 'Cancelled',
};

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

const getTypeBadgeClass = (type: DocumentType) => {
  switch (type) {
    case 'invoice':
      return 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]';
    case 'contract':
      return 'border-[#c7d2fe] bg-[#eef2ff] text-[#4338ca]';
    case 'agreement':
      return 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]';
    case 'receipt':
      return 'border-[#fde68a] bg-[#fffbeb] text-[#92400e]';
    case 'proposal':
      return 'border-[#f9a8d4] bg-[#fdf2f8] text-[#be185d]';
    case 'legal':
      return 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]';
    case 'admin':
      return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';
    case 'other':
      return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';
    default:
      return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';
  }
};

const getStatusBadgeClass = (status: DocumentStatus) => {
  switch (status) {
    case 'paid':
    case 'signed':
      return 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]';
    case 'sent':
      return 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]';
    case 'unpaid':
      return 'border-[#fcd34d] bg-[#fffbeb] text-[#92400e]';
    case 'overdue':
      return 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]';
    case 'archived':
      return 'border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]';
    case 'cancelled':
      return 'border-[#e2e8f0] bg-[#f8fafc] text-[#64748b]';
    case 'draft':
    default:
      return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';
  }
};

const isOverdueDocument = (document: DocumentItem, today: Date) => {
  const dueDate = toDateOnly(document.dueDate);
  if (!dueDate) return false;
  if (dueDate.getTime() >= today.getTime()) return false;
  return !['paid', 'signed', 'archived', 'cancelled'].includes(document.status);
};

const DocumentsPanel: React.FC<DocumentsPanelProps> = ({ documents, projects, companies, people, deals, onAddDocument, onUpdateDocument, onDeleteDocument }) => {
  const [tab, setTab] = useState<DocumentsTab>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [editor, setEditor] = useState<{ mode: 'create' | 'edit'; document?: DocumentItem } | null>(null);

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
      <article key={document.id} className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-[#0f172a]">{document.name}</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getTypeBadgeClass(document.type)}`}>
                {TYPE_LABELS[document.type]}
              </span>
              <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeClass(document.status)}`}>
                {STATUS_LABELS[document.status]}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {document.url ? (
              <button
                type="button"
                onClick={() => window.open(document.url, '_blank', 'noopener,noreferrer')}
                className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-medium text-[#1d4ed8] transition-colors hover:bg-[#dbeafe]"
              >
                Open
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => openEdit(document)}
              className="rounded-lg border border-[#cbd5e1] bg-white px-3 py-1.5 text-xs font-medium text-[#334155] transition-colors hover:bg-[#f8fafc]"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => void onDeleteDocument(document.id)}
              className="rounded-lg border border-[#fecaca] bg-[#fff1f2] px-3 py-1.5 text-xs font-medium text-[#b91c1c] transition-colors hover:bg-[#ffe4e6]"
            >
              Delete
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 text-sm text-[#475569] md:grid-cols-2">
          <div className="space-y-1">
            <div><span className="font-medium text-[#0f172a]">Amount:</span> {formatAmount(document.amount, document.currency)}</div>
            <div><span className="font-medium text-[#0f172a]">Issue:</span> {formatDate(document.issueDate)}</div>
            <div><span className="font-medium text-[#0f172a]">Due:</span> {formatDate(document.dueDate)}</div>
            <div><span className="font-medium text-[#0f172a]">Paid:</span> {formatDate(document.paidDate)}</div>
          </div>
          <div className="space-y-1">
            <div><span className="font-medium text-[#0f172a]">Related:</span> {relatedParts.length > 0 ? relatedParts.join(' · ') : 'None'}</div>
            <div><span className="font-medium text-[#0f172a]">Updated:</span> {formatDate(document.updatedAt || document.createdAt)}</div>
            {document.url ? <div className="break-all"><span className="font-medium text-[#0f172a]">Link:</span> {document.url}</div> : null}
          </div>
        </div>

        {(isInvoice || isContract) && (
          <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e5e7eb] pt-3">
            <button type="button" onClick={() => void handleQuickStatus(document, 'sent')} className="rounded-lg border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-xs font-medium text-[#1d4ed8] hover:bg-[#dbeafe]">
              Mark Sent
            </button>
            {isInvoice ? (
              <>
                <button type="button" onClick={() => void handleQuickStatus(document, 'paid')} className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-medium text-[#166534] hover:bg-[#dcfce7]">
                  Mark Paid
                </button>
                <button type="button" onClick={() => void handleQuickStatus(document, 'overdue')} className="rounded-lg border border-[#fecaca] bg-[#fef2f2] px-3 py-1.5 text-xs font-medium text-[#b91c1c] hover:bg-[#fee2e2]">
                  Mark Overdue
                </button>
              </>
            ) : null}
            {isContract ? (
              <button type="button" onClick={() => void handleQuickStatus(document, 'signed')} className="rounded-lg border border-[#bbf7d0] bg-[#f0fdf4] px-3 py-1.5 text-xs font-medium text-[#166534] hover:bg-[#dcfce7]">
                Mark Signed
              </button>
            ) : null}
            <button type="button" onClick={() => void handleQuickStatus(document, 'archived')} className="rounded-lg border border-[#e2e8f0] bg-[#f8fafc] px-3 py-1.5 text-xs font-medium text-[#475569] hover:bg-[#eef2f7]">
              Archive
            </button>
          </div>
        )}
      </article>
    );
  };

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold text-[#0f172a]">Documents OS</h2>
            <p className="mt-1 text-sm text-[#64748b]">Track invoices, contracts, agreements, receipts, proposals, and admin notes in one place.</p>
          </div>
          <button
            type="button"
            onClick={openCreate}
            className="rounded-lg bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
          >
            New Document
          </button>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <MetricCard title="Total Documents" value={metrics.totalDocuments} />
          <MetricCard title="Open Invoices" value={metrics.openInvoices} accent="text-[#1d4ed8]" />
          <MetricCard title="Unpaid Amount" value={formatAmount(metrics.unpaidAmount)} accent="text-[#991b1b]" />
          <MetricCard title="Contracts Signed" value={metrics.contractsSigned} accent="text-[#166534]" />
          <MetricCard title="Documents Due Soon" value={metrics.dueSoon} accent="text-[#92400e]" />
          <MetricCard title="Overdue Documents" value={metrics.overdue} accent="text-[#b91c1c]" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-[#e5e7eb] pb-3">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setTab(item.id)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${tab === item.id ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'bg-white text-[#64748b] hover:bg-[#f8fafc]'}`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {tab === 'dashboard' ? (
        <div className="grid gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#64748b]">Due Soon</h3>
            <div className="mt-4 space-y-3">
              {dueSoonList.length === 0 ? <EmptyState text="No documents are due in the next 7 days." /> : dueSoonList.slice(0, 6).map(renderDocumentCard)}
            </div>
          </div>
          <div className="rounded-xl border border-[#e5e7eb] bg-white p-5 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
            <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-[#64748b]">Overdue</h3>
            <div className="mt-4 space-y-3">
              {overdueList.length === 0 ? <EmptyState text="No overdue documents right now." /> : overdueList.slice(0, 6).map(renderDocumentCard)}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'review' ? (
        <div className="grid gap-4 md:grid-cols-2">
          {REVIEW_PROMPTS.map((prompt) => (
            <div key={prompt} className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <div className="text-sm font-semibold text-[#0f172a]">{prompt}</div>
              <p className="mt-2 text-sm text-[#64748b]">Use the document dashboard filters and status labels to answer this for your internal workflow. No legal advice is provided here.</p>
            </div>
          ))}
        </div>
      ) : null}

      {tab !== 'dashboard' && tab !== 'review' ? (
        <div className="space-y-4">
          {tab === 'all' ? (
            <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
              <div className="grid gap-3 md:grid-cols-4">
                <label className="space-y-1 md:col-span-2">
                  <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Search</span>
                  <input
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by name, type, status, relation, or notes"
                    className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Type</span>
                  <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as DocumentType | 'all')} className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15">
                    <option value="all">All</option>
                    {Object.entries(TYPE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Status</span>
                  <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as DocumentStatus | 'all')} className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15">
                    <option value="all">All</option>
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </label>
              </div>
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-2">
            {documentsForQuickTab.length === 0 ? <EmptyState text="No documents match the current view." /> : documentsForQuickTab.map(renderDocumentCard)}
          </div>
        </div>
      ) : null}

      {editor ? (
        <OpportunityModal title={editor.mode === 'edit' ? 'Edit Document' : 'New Document'} onClose={closeEditor}>
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

const MetricCard: React.FC<{ title: string; value: string | number; accent?: string }> = ({ title, value, accent = 'text-[#0f172a]' }) => (
  <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
    <div className="text-[11px] font-mono uppercase tracking-[0.12em] text-[#64748b]">{title}</div>
    <div className={`mt-1 text-2xl font-semibold ${accent}`}>{value}</div>
  </div>
);

const EmptyState: React.FC<{ text: string }> = ({ text }) => (
  <div className="rounded-lg border border-dashed border-[#dbe3ef] bg-[#fafcff] p-4 text-sm text-[#64748b]">{text}</div>
);

export default DocumentsPanel;
