import React, { useEffect, useState } from 'react';
import type { Person, Relationship, RelationshipContactMethod, RelationshipContactMethodInput } from '../../types/opportunities';

const CONTACT_METHOD_TYPES = [
 { value: '', label: 'Unspecified' },
 { value: 'email', label: 'Email' },
 { value: 'phone', label: 'Phone' },
 { value: 'linkedin', label: 'LinkedIn' },
 { value: 'whatsapp', label: 'WhatsApp' },
 { value: 'telegram', label: 'Telegram' },
 { value: 'instagram', label: 'Instagram' },
 { value: 'facebook', label: 'Facebook' },
 { value: 'website', label: 'Website' },
 { value: 'location', label: 'Location' },
 { value: 'other', label: 'Other' },
];

const baseInput = 'h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400';
const baseLabel = 'text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500';

const createInitialState = (initialData?: Partial<RelationshipContactMethod>): RelationshipContactMethodInput => ({
 relationshipId: initialData?.relationshipId ?? '',
 type: initialData?.type,
 label: initialData?.label,
 value: initialData?.value,
 isPrimary: initialData?.isPrimary ?? false,
 notes: initialData?.notes,
});

const toInputValue = (value?: string | null) => value ?? '';

const RelationshipContactMethodForm: React.FC<{
 relationships: Relationship[];
 people?: Person[];
 relationshipId?: string;
 initialData?: Partial<RelationshipContactMethod>;
 onSubmit: (input: RelationshipContactMethodInput) => Promise<void> | void;
 onCancel: () => void;
 submitLabel?: string;
}> = ({ relationships, people = [], relationshipId, initialData, onSubmit, onCancel, submitLabel = 'Save Contact Method' }) => {
 const [form, setForm] = useState<RelationshipContactMethodInput>(() => ({ ...createInitialState(initialData), relationshipId: relationshipId || initialData?.relationshipId || '' }));
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState('');

 useEffect(() => {
 setForm({ ...createInitialState(initialData), relationshipId: relationshipId || initialData?.relationshipId || '' });
 setError('');
 }, [initialData, relationshipId]);

 const setField = <K extends keyof RelationshipContactMethodInput>(key: K, value: RelationshipContactMethodInput[K]) => {
 setForm((current) => ({ ...current, [key]: value }));
 };

 const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setError('');

 const nextRelationshipId = String(form.relationshipId || '').trim();
 if (!nextRelationshipId) {
 setError('Select a relationship.');
 return;
 }

 try {
 setSaving(true);
 await onSubmit({
 ...form,
 relationshipId: nextRelationshipId,
 label: form.label?.trim() || undefined,
 value: form.value?.trim() || undefined,
 notes: form.notes?.trim() || undefined,
 isPrimary: Boolean(form.isPrimary),
 });
 } catch (submitError) {
 setError(submitError instanceof Error ? submitError.message : 'Failed to save contact method.');
 } finally {
 setSaving(false);
 }
 };

 return (
 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="grid gap-4 md:grid-cols-2">
 {!relationshipId ? (
 <label className="space-y-1.5 md:col-span-2">
 <div className={baseLabel}>Relationship</div>
 <select value={toInputValue(form.relationshipId)} onChange={(event) => setField('relationshipId', event.target.value)} className={baseInput}>
 <option value="">Select a relationship</option>
 {relationships.map((relationship) => {
 const personName = relationship.personName || people.find((person) => person.id === relationship.personId)?.fullName;
 return (
 <option key={relationship.id} value={relationship.id}>
 {relationship.displayName}{personName ? ` · ${personName}` : ''}
 </option>
 );
 })}
 </select>
 </label>
 ) : null}

 <label className="space-y-1.5">
 <div className={baseLabel}>Type</div>
 <select value={toInputValue(form.type)} onChange={(event) => setField('type', event.target.value as RelationshipContactMethodInput['type'])} className={baseInput}>
 {CONTACT_METHOD_TYPES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>Label</div>
 <input value={form.label || ''} onChange={(event) => setField('label', event.target.value)} className={baseInput} placeholder="Primary email" />
 </label>

 <label className="space-y-1.5 md:col-span-2">
 <div className={baseLabel}>Value</div>
 <input value={form.value || ''} onChange={(event) => setField('value', event.target.value)} className={baseInput} placeholder="maya@example.com" />
 </label>

 <label className="flex items-center gap-3 rounded-md border border-neutral-200 bg-neutral-50 px-3 py-2 md:col-span-2">
 <input type="checkbox" checked={form.isPrimary ?? false} onChange={(event) => setField('isPrimary', event.target.checked)} className="h-4 w-4" />
 <span className="text-sm text-neutral-900">Primary contact method</span>
 </label>

 <label className="space-y-1.5 md:col-span-2">
 <div className={baseLabel}>Notes</div>
 <textarea value={form.notes || ''} onChange={(event) => setField('notes', event.target.value)} rows={3} className="w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400" />
 </label>
 </div>

 {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

 <div className="flex items-center justify-end gap-3 pt-2">
 <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">
 Cancel
 </button>
 <button type="submit" disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70">
 {saving ? 'Saving...' : submitLabel}
 </button>
 </div>
 </form>
 );
};

export default RelationshipContactMethodForm;
