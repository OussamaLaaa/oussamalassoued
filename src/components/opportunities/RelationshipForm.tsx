import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';
import React, { useEffect, useState } from 'react';
import type { Person, RelationshipCategory, RelationshipInput } from '../../types/opportunities';

const DOMAIN_OPTIONS = [
 { value: '', label: 'Unspecified' },
 { value: 'ux_ui', label: 'UX / UI' },
 { value: 'founders', label: 'Founders' },
 { value: 'recruiters', label: 'Recruiters' },
 { value: 'designers', label: 'Designers' },
 { value: 'developers', label: 'Developers' },
 { value: 'clients', label: 'Clients' },
 { value: 'mentors', label: 'Mentors' },
 { value: 'investors', label: 'Investors' },
 { value: 'local_business', label: 'Local Business' },
 { value: 'family', label: 'Family' },
 { value: 'friends', label: 'Friends' },
 { value: 'other', label: 'Other' },
];

const TYPE_OPTIONS = [
 { value: '', label: 'Unspecified' },
 { value: 'professional', label: 'Professional' },
 { value: 'client', label: 'Client' },
 { value: 'mentor', label: 'Mentor' },
 { value: 'peer', label: 'Peer' },
 { value: 'recruiter', label: 'Recruiter' },
 { value: 'founder', label: 'Founder' },
 { value: 'family', label: 'Family' },
 { value: 'friend', label: 'Friend' },
 { value: 'community', label: 'Community' },
 { value: 'other', label: 'Other' },
];

const STRENGTH_OPTIONS = [
 { value: '', label: 'Unspecified' },
 { value: 'weak', label: 'Weak' },
 { value: 'medium', label: 'Medium' },
 { value: 'strong', label: 'Strong' },
];

const TRUST_OPTIONS = [
 { value: '', label: 'Unspecified' },
 { value: 'unknown', label: 'Unknown' },
 { value: 'low', label: 'Low' },
 { value: 'medium', label: 'Medium' },
 { value: 'high', label: 'High' },
];

const STATUS_OPTIONS = [
 { value: '', label: 'Unspecified' },
 { value: 'active', label: 'Active' },
 { value: 'warm', label: 'Warm' },
 { value: 'cold', label: 'Cold' },
 { value: 'paused', label: 'Paused' },
 { value: 'avoid', label: 'Avoid' },
 { value: 'archived', label: 'Archived' },
];

const toInputValue = (value?: string | null) => value ?? '';

const createInitialState = (initialData?: Partial<RelationshipInput>): RelationshipInput => ({
 personId: initialData?.personId ?? null,
 categoryId: initialData?.categoryId ?? null,
 displayName: initialData?.displayName ?? '',
 domain: initialData?.domain,
 relationshipType: initialData?.relationshipType,
 relationshipStrength: initialData?.relationshipStrength,
 trustLevel: initialData?.trustLevel,
 status: initialData?.status,
 howWeMet: initialData?.howWeMet,
 whatTheyNeed: initialData?.whatTheyNeed,
 howICanHelp: initialData?.howICanHelp,
 howTheyCanHelpMe: initialData?.howTheyCanHelpMe,
 sharedInterests: initialData?.sharedInterests,
 lastContactDate: initialData?.lastContactDate ?? null,
 nextContactDate: initialData?.nextContactDate ?? null,
 nextAction: initialData?.nextAction,
 problems: initialData?.problems,
 riskNotes: initialData?.riskNotes,
 notes: initialData?.notes,
});

const baseInput = 'h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400';
const baseTextarea = 'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400';
const baseLabel = 'text-xs font-semibold uppercase tracking-[0.1em] text-neutral-500';

const RelationshipForm: React.FC<{
 people?: Person[];
 categories?: RelationshipCategory[];
 initialData?: Partial<RelationshipInput>;
 onSubmit: (input: RelationshipInput) => Promise<void> | void;
 onCancel: () => void;
 submitLabel?: string;
}> = ({ people = [], categories = [], initialData, onSubmit, onCancel, submitLabel = 'Save Relationship' }) => {
  const { t, language } = usePersonalLanguage();

 const [form, setForm] = useState<RelationshipInput>(() => createInitialState(initialData));
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState('');

 useEffect(() => {
 setForm(createInitialState(initialData));
 setError('');
 }, [initialData]);

 const setField = <K extends keyof RelationshipInput>(key: K, value: RelationshipInput[K]) => {
 setForm((current) => ({ ...current, [key]: value }));
 };

 const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
 event.preventDefault();
 setError('');

 const displayName = String(form.displayName || '').trim();
 if (!displayName) {
 setError('Display name is required.');
 return;
 }

 const payload: RelationshipInput = {
 ...form,
 displayName,
 personId: form.personId ? String(form.personId).trim() : null,
 categoryId: form.categoryId ? String(form.categoryId).trim() : null,
 lastContactDate: form.lastContactDate ? String(form.lastContactDate).trim() : null,
 nextContactDate: form.nextContactDate ? String(form.nextContactDate).trim() : null,
 howWeMet: form.howWeMet?.trim() || undefined,
 whatTheyNeed: form.whatTheyNeed?.trim() || undefined,
 howICanHelp: form.howICanHelp?.trim() || undefined,
 howTheyCanHelpMe: form.howTheyCanHelpMe?.trim() || undefined,
 sharedInterests: form.sharedInterests?.trim() || undefined,
 nextAction: form.nextAction?.trim() || undefined,
 problems: form.problems?.trim() || undefined,
 riskNotes: form.riskNotes?.trim() || undefined,
 notes: form.notes?.trim() || undefined,
 };

 try {
 setSaving(true);
 await onSubmit(payload);
 } catch (submitError) {
 setError(submitError instanceof Error ? submitError.message : 'Failed to save relationship.');
 } finally {
 setSaving(false);
 }
 };

 return (
 <form onSubmit={handleSubmit} className="space-y-5">
 <div className="grid gap-4 md:grid-cols-2">
 <label className="space-y-1.5 md:col-span-2">
 <div className={baseLabel}>Display Name</div>
 <input
 value={form.displayName}
 onChange={(event) => setField('displayName', event.target.value)}
 className={baseInput}
 placeholder="Maya Carter"
 />
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>Linked Person</div>
 <select
 value={toInputValue(form.personId)}
 onChange={(event) => setField('personId', event.target.value || null)}
 className={baseInput}
 >
 <option value="">No linked person</option>
 {people.map((person) => (
 <option key={person.id} value={person.id}>{person.fullName}</option>
 ))}
 </select>
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>Category</div>
 <select
 value={toInputValue(form.categoryId)}
 onChange={(event) => {
 const catId = event.target.value || null;
 setField('categoryId', catId);
 const cat = categories.find((c) => c.id === catId);
 if (cat && cat.slug) {
 setField('domain', cat.slug as RelationshipInput['domain']);
 }
 }}
 className={baseInput}
 >
 <option value="">Uncategorized</option>
 {categories.map((category) => (
 <option key={category.id} value={category.id}>{category.name}</option>
 ))}
 </select>
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>Domain</div>
 <select
 value={toInputValue(form.domain)}
 onChange={(event) => setField('domain', event.target.value as RelationshipInput['domain'])}
 className={baseInput}
 >
 {DOMAIN_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>Relationship Type</div>
 <select
 value={toInputValue(form.relationshipType)}
 onChange={(event) => setField('relationshipType', event.target.value as RelationshipInput['relationshipType'])}
 className={baseInput}
 >
 {TYPE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>Strength</div>
 <select
 value={toInputValue(form.relationshipStrength)}
 onChange={(event) => setField('relationshipStrength', event.target.value as RelationshipInput['relationshipStrength'])}
 className={baseInput}
 >
 {STRENGTH_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>Trust Level</div>
 <select
 value={toInputValue(form.trustLevel)}
 onChange={(event) => setField('trustLevel', event.target.value as RelationshipInput['trustLevel'])}
 className={baseInput}
 >
 {TRUST_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>Status</div>
 <select
 value={toInputValue(form.status)}
 onChange={(event) => setField('status', event.target.value as RelationshipInput['status'])}
 className={baseInput}
 >
 {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
 </select>
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>Last Contact Date</div>
 <input
 type="date"
 value={toInputValue(form.lastContactDate)}
 onChange={(event) => setField('lastContactDate', event.target.value || null)}
 className={baseInput}
 />
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>Next Contact Date</div>
 <input
 type="date"
 value={toInputValue(form.nextContactDate)}
 onChange={(event) => setField('nextContactDate', event.target.value || null)}
 className={baseInput}
 />
 </label>

 <label className="space-y-1.5 md:col-span-2">
 <div className={baseLabel}>How We Met</div>
 <textarea
 value={form.howWeMet || ''}
 onChange={(event) => setField('howWeMet', event.target.value)}
 rows={3}
 className={baseTextarea}
 />
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>What They Need</div>
 <textarea
 value={form.whatTheyNeed || ''}
 onChange={(event) => setField('whatTheyNeed', event.target.value)}
 rows={4}
 className={baseTextarea}
 />
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>How I Can Help</div>
 <textarea
 value={form.howICanHelp || ''}
 onChange={(event) => setField('howICanHelp', event.target.value)}
 rows={4}
 className={baseTextarea}
 />
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>How They Can Help Me</div>
 <textarea
 value={form.howTheyCanHelpMe || ''}
 onChange={(event) => setField('howTheyCanHelpMe', event.target.value)}
 rows={4}
 className={baseTextarea}
 />
 </label>

 <label className="space-y-1.5">
 <div className={baseLabel}>Shared Interests</div>
 <textarea
 value={form.sharedInterests || ''}
 onChange={(event) => setField('sharedInterests', event.target.value)}
 rows={4}
 className={baseTextarea}
 />
 </label>

 <label className="space-y-1.5 md:col-span-2">
 <div className={baseLabel}>Next Action</div>
 <textarea
 value={form.nextAction || ''}
 onChange={(event) => setField('nextAction', event.target.value)}
 rows={3}
 className={baseTextarea}
 />
 </label>

 <label className="space-y-1.5 md:col-span-2">
 <div className={baseLabel}>Problems / Friction</div>
 <textarea
 value={form.problems || ''}
 onChange={(event) => setField('problems', event.target.value)}
 rows={3}
 className={baseTextarea}
 />
 </label>

 <label className="space-y-1.5 md:col-span-2">
 <div className={baseLabel}>Risk Notes</div>
 <textarea
 value={form.riskNotes || ''}
 onChange={(event) => setField('riskNotes', event.target.value)}
 rows={3}
 className={baseTextarea}
 />
 </label>

 <label className="space-y-1.5 md:col-span-2">
 <div className={baseLabel}>Notes</div>
 <textarea
 value={form.notes || ''}
 onChange={(event) => setField('notes', event.target.value)}
 rows={4}
 className={baseTextarea}
 />
 </label>
 </div>

 {error ? <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}

 <div className="flex items-center justify-end gap-3 pt-2">
 <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50 transition-colors">
 Cancel
 </button>
 <button
 type="submit"
 disabled={saving}
 className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-70"
 >
 {saving ? 'Saving...' : submitLabel}
 </button>
 </div>
 </form>
 );
};

export default RelationshipForm;
