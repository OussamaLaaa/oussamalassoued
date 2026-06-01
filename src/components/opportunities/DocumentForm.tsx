import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useEffect, useMemo, useState } from 'react';
import type { Company, Deal, DocumentInput, DocumentType, DocumentStatus, Person, Project } from '../../types/opportunities';

interface DocumentFormProps {
 initialData?: Partial<DocumentInput>;
 projects: Project[];
 companies: Company[];
 people: Person[];
 deals: Deal[];
 onSubmit: (input: DocumentInput) => Promise<unknown> | unknown;
 onCancel: () => void;
}

type DocumentFormState = {
 name: string;
 type: DocumentType;
 status: DocumentStatus;
 relatedProjectId: string;
 relatedCompanyId: string;
 relatedPersonId: string;
 relatedDealId: string;
 amount: string;
 currency: string;
 issueDate: string;
 dueDate: string;
 paidDate: string;
 url: string;
 notes: string;
};

const DOCUMENT_TYPES: Array<{ value: DocumentType; label: string }> = [
 { value: 'document', label: 'Document' },
 { value: 'invoice', label: 'Invoice' },
 { value: 'contract', label: 'Contract' },
 { value: 'agreement', label: 'Agreement' },
 { value: 'receipt', label: 'Receipt' },
 { value: 'proposal', label: 'Proposal' },
 { value: 'legal', label: 'Legal' },
 { value: 'admin', label: 'Admin' },
 { value: 'other', label: 'Other' },
];

const DOCUMENT_STATUSES: Array<{ value: DocumentStatus; label: string }> = [
 { value: 'draft', label: 'Draft' },
 { value: 'sent', label: 'Sent' },
 { value: 'signed', label: 'Signed' },
 { value: 'paid', label: 'Paid' },
 { value: 'unpaid', label: 'Unpaid' },
 { value: 'overdue', label: 'Overdue' },
 { value: 'archived', label: 'Archived' },
 { value: 'cancelled', label: 'Cancelled' },
];

const toDateInput = (value?: string) => (value ? value.slice(0, 10) : '');

const buildState = (input?: Partial<DocumentInput>): DocumentFormState => ({
 name: input?.name || '',
 type: input?.type || 'document',
 status: input?.status || 'draft',
 relatedProjectId: input?.relatedProjectId || '',
 relatedCompanyId: input?.relatedCompanyId || '',
 relatedPersonId: input?.relatedPersonId || '',
 relatedDealId: input?.relatedDealId || '',
 amount: input?.amount == null ? '' : String(input.amount),
 currency: input?.currency || 'MYR',
 issueDate: toDateInput(input?.issueDate),
 dueDate: toDateInput(input?.dueDate),
 paidDate: toDateInput(input?.paidDate),
 url: input?.url || '',
 notes: input?.notes || '',
});

const labelForProject = (project: Project) => project.name;
const labelForCompany = (company: Company) => company.name;
const labelForPerson = (person: Person) => person.fullName;
const labelForDeal = (deal: Deal) => deal.servicePackage || deal.id;

const DocumentForm: React.FC<DocumentFormProps> = ({ initialData, projects, companies, people, deals, onSubmit, onCancel }) => {
  const { t, language } = usePersonalLanguage();

 const [form, setForm] = useState<DocumentFormState>(() => buildState(initialData));
 const [error, setError] = useState('');
 const [saving, setSaving] = useState(false);

 useEffect(() => {
 setForm(buildState(initialData));
 setError('');
 }, [initialData]);

 const projectOptions = useMemo(() => projects.map((project) => ({ value: project.id, label: labelForProject(project) })), [projects]);
 const companyOptions = useMemo(() => companies.map((company) => ({ value: company.id, label: labelForCompany(company) })), [companies]);
 const personOptions = useMemo(() => people.map((person) => ({ value: person.id, label: labelForPerson(person) })), [people]);
 const dealOptions = useMemo(() => deals.map((deal) => ({ value: deal.id, label: labelForDeal(deal) })), [deals]);

 const updateField = <K extends keyof DocumentFormState>(field: K, value: DocumentFormState[K]) => {
 setForm((current) => ({ ...current, [field]: value }));
 };

 const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setError('');

 const name = form.name.trim();
 if (!name) {
 setError('Document name is required.');
 return;
 }

 const trimmedAmount = form.amount.trim();
 if (trimmedAmount && Number.isNaN(Number(trimmedAmount))) {
 setError('Amount must be numeric.');
 return;
 }

 const payload: DocumentInput = {
 name,
 type: form.type,
 status: form.status,
 relatedProjectId: form.relatedProjectId.trim() || undefined,
 relatedCompanyId: form.relatedCompanyId.trim() || undefined,
 relatedPersonId: form.relatedPersonId.trim() || undefined,
 relatedDealId: form.relatedDealId.trim() || undefined,
 amount: trimmedAmount ? Number(trimmedAmount) : undefined,
 currency: form.currency.trim() || 'MYR',
 issueDate: form.issueDate.trim() || undefined,
 dueDate: form.dueDate.trim() || undefined,
 paidDate: form.paidDate.trim() || undefined,
 url: form.url.trim() || undefined,
 notes: form.notes.trim() || undefined,
 };

 try {
 setSaving(true);
 await onSubmit(payload);
 } catch (submitError) {
 setError(submitError instanceof Error ? submitError.message : 'Failed to save document.');
 } finally {
 setSaving(false);
 }
 };

 return (
 <form onSubmit={handleSubmit} className="space-y-4">
 <div className="grid gap-4 md:grid-cols-2">
 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Name</span>
 <input
 value={form.name}
 onChange={(event) => updateField('name', event.target.value)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 placeholder="Statement of work, invoice #102, signed contract"
 autoFocus
 />
 </label>

 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Type</span>
 <select
 value={form.type}
 onChange={(event) => updateField('type', event.target.value as DocumentType)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 >
 {DOCUMENT_TYPES.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Status</span>
 <select
 value={form.status}
 onChange={(event) => updateField('status', event.target.value as DocumentStatus)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 >
 {DOCUMENT_STATUSES.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Amount</span>
 <input
 type="text"
 inputMode="decimal"
 value={form.amount}
 onChange={(event) => updateField('amount', event.target.value)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 placeholder="0.00"
 />
 </label>

 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Currency</span>
 <input
 value={form.currency}
 onChange={(event) => updateField('currency', event.target.value.toUpperCase())}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 placeholder="MYR"
 />
 </label>

 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Issue Date</span>
 <input
 type="date"
 value={form.issueDate}
 onChange={(event) => updateField('issueDate', event.target.value)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 />
 </label>

 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Due Date</span>
 <input
 type="date"
 value={form.dueDate}
 onChange={(event) => updateField('dueDate', event.target.value)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 />
 </label>

 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Paid Date</span>
 <input
 type="date"
 value={form.paidDate}
 onChange={(event) => updateField('paidDate', event.target.value)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 />
 </label>

 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">URL</span>
 <input
 type="url"
 value={form.url}
 onChange={(event) => updateField('url', event.target.value)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 placeholder="https://..."
 />
 </label>
 </div>

 <div className="grid gap-4 md:grid-cols-2">
 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Related Project</span>
 <select
 value={form.relatedProjectId}
 onChange={(event) => updateField('relatedProjectId', event.target.value)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 >
 <option value="">None</option>
 {projectOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Related Company</span>
 <select
 value={form.relatedCompanyId}
 onChange={(event) => updateField('relatedCompanyId', event.target.value)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 >
 <option value="">None</option>
 {companyOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Related Person</span>
 <select
 value={form.relatedPersonId}
 onChange={(event) => updateField('relatedPersonId', event.target.value)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 >
 <option value="">None</option>
 {personOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>

 <label className="space-y-1">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Related Deal</span>
 <select
 value={form.relatedDealId}
 onChange={(event) => updateField('relatedDealId', event.target.value)}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 >
 <option value="">None</option>
 {dealOptions.map((option) => (
 <option key={option.value} value={option.value}>
 {option.label}
 </option>
 ))}
 </select>
 </label>
 </div>

 <label className="space-y-1 block">
 <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Notes</span>
 <textarea
 value={form.notes}
 onChange={(event) => updateField('notes', event.target.value)}
 rows={4}
 className="w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
 placeholder="Admin notes, legal tracking, payment context, or follow-up details"
 />
 </label>

 {error ? <div className="rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div> : null}

 <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#e5e7eb] pt-4">
 <button
 type="button"
 onClick={onCancel}
 className="rounded-md border border-[#cbd5e1] bg-white px-4 py-2 text-sm font-medium text-[#334155] transition-colors hover:bg-[#f8fafc]"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={saving}
 className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-60"
 >
 {saving ? 'Saving...' : 'Save Document'}
 </button>
 </div>
 </form>
 );
};

export default DocumentForm;
