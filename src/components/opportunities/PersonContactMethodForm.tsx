import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useState } from 'react';
import type { PersonContactMethodInput } from '../../types/opportunities';

const baseInput = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none';

const CONTACT_METHOD_TYPES = [
 'email',
 'phone',
 'linkedin',
 'whatsapp',
 'telegram',
 'website',
 'instagram',
 'facebook',
 'x',
 'other',
] as const;

interface Props {
 personId: string;
 onSubmit: (data: PersonContactMethodInput) => Promise<unknown>;
 onCancel: () => void;
 initialData?: Partial<PersonContactMethodInput>;
}

const PersonContactMethodForm: React.FC<Props> = ({ personId, onSubmit, onCancel, initialData }) => {
  const { t, language } = usePersonalLanguage();

 const [error, setError] = useState('');
 const [saving, setSaving] = useState(false);
 const [form, setForm] = useState<PersonContactMethodInput>({
 personId,
 type: initialData?.type || 'email',
 label: initialData?.label || '',
 value: initialData?.value || '',
 isPrimary: initialData?.isPrimary || false,
 notes: initialData?.notes || '',
 });

 const setField = <K extends keyof PersonContactMethodInput>(key: K, value: PersonContactMethodInput[K]) => {
 setError('');
 setForm((current) => ({ ...current, [key]: value }));
 };

 return (
 <form
 className="space-y-4"
 onSubmit={async (event) => {
 event.preventDefault();
 if (!String(form.value || '').trim()) {
 setError('Please enter a contact value.');
 return;
 }

 setSaving(true);
 setError('');
 try {
 await onSubmit({ ...form, personId });
 } catch (err: any) {
 setError(err?.message || 'Unable to save contact method.');
 } finally {
 setSaving(false);
 }
 }}
 >
 <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
 <label className="space-y-1">
 <span className="text-sm font-medium text-neutral-900">Type</span>
 <select className={baseInput} value={form.type || 'other'} onChange={(event) => setField('type', event.target.value)}>
 {CONTACT_METHOD_TYPES.map((type) => (
 <option key={type} value={type}>
 {type}
 </option>
 ))}
 </select>
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-neutral-900">Label</span>
 <input className={baseInput} value={form.label || ''} onChange={(event) => setField('label', event.target.value)} placeholder="Primary email" />
 </label>
 <label className="space-y-1 md:col-span-2">
 <span className="text-sm font-medium text-neutral-900">Value</span>
 <input className={baseInput} value={form.value || ''} onChange={(event) => setField('value', event.target.value)} placeholder="name@example.com" required />
 </label>
 <label className="flex items-center gap-2 md:col-span-2 text-sm text-neutral-700">
 <input
 type="checkbox"
 checked={Boolean(form.isPrimary)}
 onChange={(event) => setField('isPrimary', event.target.checked)}
 className="h-4 w-4 rounded border-neutral-300 text-neutral-900"
 />
 Mark as primary
 </label>
 <label className="space-y-1 md:col-span-2">
 <span className="text-sm font-medium text-neutral-900">Notes</span>
 <textarea className={`${baseInput} min-h-24`} value={form.notes || ''} onChange={(event) => setField('notes', event.target.value)} />
 </label>
 </div>

 {error ? <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">{error}</div> : null}

 <div className="flex items-center justify-end gap-2 pt-1">
 <button type="button" onClick={onCancel} className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50">
 Cancel
 </button>
 <button type="submit" disabled={saving} className="rounded-xl border border-neutral-900 bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
 {saving ? 'Saving...' : 'Save Contact Method'}
 </button>
 </div>
 </form>
 );
};

export default PersonContactMethodForm;
