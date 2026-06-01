import React, { useMemo, useState } from 'react';
import type { Company, Person, MessageInput } from '../../types/opportunities';
import { detectTextDirection } from '../../utils/textDirection';

const inputClass = 'w-full h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400';
const textareaClass = 'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400';
const selectClass = 'w-full h-9 rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-400';

const LogMessageForm: React.FC<{
 companies: Company[];
 people: Person[];
 onSubmit: (data: MessageInput) => void;
 onCancel: () => void;
 initialData?: MessageInput;
}> = ({ companies, people, onSubmit, onCancel, initialData }) => {
 const [companyId, setCompanyId] = useState(initialData?.companyId || companies[0]?.id || '');
 const filteredPeople = useMemo(() => {
 if (initialData?.companyId) {
 return people.filter((person) => person.companyId === initialData.companyId);
 }
 return people.filter((person) => !companyId || person.companyId === companyId);
 }, [companyId, people, initialData?.companyId]);
 const [personId, setPersonId] = useState(initialData?.personId || filteredPeople[0]?.id || '');
 const [form, setForm] = useState<MessageInput>(initialData || {
 companyId: companies[0]?.id,
 personId: filteredPeople[0]?.id,
 channel: 'LinkedIn',
 language: 'English',
 messageType: 'outreach',
 messageText: '',
 sentDate: new Date().toISOString().slice(0, 16),
 replyStatus: 'no_reply',
 replySummary: '',
 nextFollowUpDate: '',
 status: 'sent',
 });

 const setField = <K extends keyof MessageInput>(key: K, value: MessageInput[K]) => {
 setForm((current) => ({ ...current, [key]: value }));
 };

 return (
 <form
 className="space-y-4"
 onSubmit={(event) => {
 event.preventDefault();
 onSubmit({ ...form, companyId, personId });
 }}
 >
 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
 <label className="space-y-1.5 md:col-span-2">
 <span className="text-sm font-medium text-neutral-900">Company</span>
 <select
 className={selectClass}
 value={companyId}
 onChange={(e) => {
 const nextCompanyId = e.target.value;
 setCompanyId(nextCompanyId);
 const nextPeople = people.filter((person) => person.companyId === nextCompanyId);
 setPersonId(nextPeople[0]?.id || '');
 setField('companyId', nextCompanyId);
 setField('personId', nextPeople[0]?.id || '');
 }}
 >
 {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
 </select>
 </label>
 <label className="space-y-1.5 md:col-span-2">
 <span className="text-sm font-medium text-neutral-900">Person</span>
 <select className={selectClass} value={personId} onChange={(e) => { setPersonId(e.target.value); setField('personId', e.target.value); }}>
 <option value="">Select a person</option>
 {filteredPeople.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
 </select>
 </label>
 <label className="space-y-1.5">
 <span className="text-sm font-medium text-neutral-900">Channel</span>
 <select className={selectClass} value={form.channel} onChange={(e) => setField('channel', e.target.value)}>
 <option>LinkedIn</option>
 <option>Email</option>
 <option>Website Form</option>
 <option>Instagram</option>
 <option>Other</option>
 </select>
 </label>
 <label className="space-y-1.5">
 <span className="text-sm font-medium text-neutral-900">Message Type</span>
 <input className={inputClass} value={form.messageType || ''} onChange={(e) => setField('messageType', e.target.value)} placeholder="e.g. Cold, Proposal, Check-in" />
 </label>
 <label className="space-y-1.5">
 <span className="text-sm font-medium text-neutral-900">Sent Date</span>
 <input type="datetime-local" className={inputClass} value={form.sentDate?.slice(0, 16) || ''} onChange={(e) => setField('sentDate', e.target.value)} />
 </label>
 <label className="space-y-1.5">
 <span className="text-sm font-medium text-neutral-900">Reply Status</span>
 <select className={selectClass} value={form.replyStatus} onChange={(e) => setField('replyStatus', e.target.value as MessageInput['replyStatus'])}>
 <option value="no_reply">No Reply</option>
 <option value="replied">Replied</option>
 <option value="waiting">Waiting</option>
 <option value="bounced">Bounced</option>
 <option value="none">None</option>
 </select>
 </label>
 <label className="space-y-1.5 md:col-span-2">
 <span className="text-sm font-medium text-neutral-900">Message Text</span>
   <textarea className={`${textareaClass} min-h-24`} dir={detectTextDirection(form.messageText || '')} value={form.messageText || ''} onChange={(e) => setField('messageText', e.target.value)} placeholder="Message content..." />
 </label>
 <label className="space-y-1.5">
 <span className="text-sm font-medium text-neutral-900">Follow-up Date</span>
 <input type="date" className={inputClass} value={form.nextFollowUpDate || ''} onChange={(e) => setField('nextFollowUpDate', e.target.value)} />
 </label>
 <label className="space-y-1.5">
 <span className="text-sm font-medium text-neutral-900">Status</span>
 <select className={selectClass} value={form.status} onChange={(e) => setField('status', e.target.value as MessageInput['status'])}>
 <option value="sent">Sent</option>
 <option value="scheduled">Scheduled</option>
 <option value="failed">Failed</option>
 <option value="draft">Draft</option>
 </select>
 </label>
 <label className="space-y-1.5 md:col-span-2">
 <span className="text-sm font-medium text-neutral-900">Notes</span>
   <textarea className={`${textareaClass} min-h-20`} dir={detectTextDirection(form.replySummary || '')} value={form.replySummary || ''} onChange={(e) => setField('replySummary', e.target.value)} placeholder="Private notes for next steps, objections, or context." />
 </label>
 </div>

 <div className="flex items-center justify-end gap-2 pt-2">
 <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50 transition-colors">Cancel</button>
 <button type="submit" className="rounded-md border border-black bg-black px-4 py-2 text-sm text-white hover:bg-neutral-800 transition-colors">Save Message</button>
 </div>
 </form>
 );
};

export default LogMessageForm;
