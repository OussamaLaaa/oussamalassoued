import React, { useMemo, useState } from 'react';
import type { Company, Person, MessageInput } from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400';

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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-neutral-900">Company</span>
          <select
            className={baseInput}
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
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-neutral-900">Person</span>
          <select className={baseInput} value={personId} onChange={(e) => { setPersonId(e.target.value); setField('personId', e.target.value); }}>
            <option value="">Select a person</option>
            {filteredPeople.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-neutral-900">Channel</span>
          <select className={baseInput} value={form.channel} onChange={(e) => setField('channel', e.target.value)}>
            <option>LinkedIn</option>
            <option>Email</option>
            <option>Website Form</option>
            <option>Instagram</option>
            <option>Other</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-neutral-900">Language</span>
          <select className={baseInput} value={form.language} onChange={(e) => setField('language', e.target.value)}>
            <option>Arabic</option>
            <option>French</option>
            <option>English</option>
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-neutral-900">Message Type</span>
          <input className={baseInput} value={form.messageType || ''} onChange={(e) => setField('messageType', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-neutral-900">Message Text</span>
          <textarea className={`${baseInput} min-h-24`} value={form.messageText || ''} onChange={(e) => setField('messageText', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-neutral-900">Sent Date</span>
          <input type="datetime-local" className={baseInput} value={form.sentDate?.slice(0, 16) || ''} onChange={(e) => setField('sentDate', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-neutral-900">Reply Status</span>
          <select className={baseInput} value={form.replyStatus} onChange={(e) => setField('replyStatus', e.target.value as MessageInput['replyStatus'])}>
            <option value="no_reply">no_reply</option>
            <option value="replied">replied</option>
            <option value="waiting">waiting</option>
            <option value="bounced">bounced</option>
            <option value="none">none</option>
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-neutral-900">Reply Summary</span>
          <input className={baseInput} value={form.replySummary || ''} onChange={(e) => setField('replySummary', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-neutral-900">Next Follow-up Date</span>
          <input type="date" className={baseInput} value={form.nextFollowUpDate || ''} onChange={(e) => setField('nextFollowUpDate', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-neutral-900">Status</span>
          <select className={baseInput} value={form.status} onChange={(e) => setField('status', e.target.value as MessageInput['status'])}>
            <option value="sent">sent</option>
            <option value="scheduled">scheduled</option>
            <option value="failed">failed</option>
            <option value="draft">draft</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-50">Cancel</button>
        <button type="submit" className="rounded-md border border-black bg-black px-4 py-2 text-sm text-white hover:bg-neutral-800">Save Message</button>
      </div>
    </form>
  );
};

export default LogMessageForm;