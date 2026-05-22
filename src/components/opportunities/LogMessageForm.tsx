import React, { useMemo, useState } from 'react';
import type { Company, Person, MessageInput } from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15';

const LogMessageForm: React.FC<{
  companies: Company[];
  people: Person[];
  onSubmit: (data: MessageInput) => void;
  onCancel: () => void;
}> = ({ companies, people, onSubmit, onCancel }) => {
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const filteredPeople = useMemo(() => people.filter((person) => !companyId || person.companyId === companyId), [companyId, people]);
  const [personId, setPersonId] = useState(filteredPeople[0]?.id || '');
  const [form, setForm] = useState<MessageInput>({
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
          <span className="text-sm font-medium text-[#0f172a]">Company</span>
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
          <span className="text-sm font-medium text-[#0f172a]">Person</span>
          <select className={baseInput} value={personId} onChange={(e) => { setPersonId(e.target.value); setField('personId', e.target.value); }}>
            <option value="">Select a person</option>
            {filteredPeople.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Channel</span>
          <select className={baseInput} value={form.channel} onChange={(e) => setField('channel', e.target.value)}>
            <option>LinkedIn</option>
            <option>Email</option>
            <option>Website Form</option>
            <option>Instagram</option>
            <option>Other</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Language</span>
          <select className={baseInput} value={form.language} onChange={(e) => setField('language', e.target.value)}>
            <option>Arabic</option>
            <option>French</option>
            <option>English</option>
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Message Type</span>
          <input className={baseInput} value={form.messageType || ''} onChange={(e) => setField('messageType', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Message Text</span>
          <textarea className={`${baseInput} min-h-24`} value={form.messageText || ''} onChange={(e) => setField('messageText', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Sent Date</span>
          <input type="datetime-local" className={baseInput} value={form.sentDate?.slice(0, 16) || ''} onChange={(e) => setField('sentDate', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Reply Status</span>
          <select className={baseInput} value={form.replyStatus} onChange={(e) => setField('replyStatus', e.target.value as MessageInput['replyStatus'])}>
            <option value="no_reply">no_reply</option>
            <option value="replied">replied</option>
            <option value="waiting">waiting</option>
            <option value="bounced">bounced</option>
            <option value="none">none</option>
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Reply Summary</span>
          <input className={baseInput} value={form.replySummary || ''} onChange={(e) => setField('replySummary', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Next Follow-up Date</span>
          <input type="date" className={baseInput} value={form.nextFollowUpDate || ''} onChange={(e) => setField('nextFollowUpDate', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Status</span>
          <select className={baseInput} value={form.status} onChange={(e) => setField('status', e.target.value as MessageInput['status'])}>
            <option value="sent">sent</option>
            <option value="scheduled">scheduled</option>
            <option value="failed">failed</option>
            <option value="draft">draft</option>
          </select>
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">Cancel</button>
        <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm text-white hover:bg-[#1d4ed8]">Save Message</button>
      </div>
    </form>
  );
};

export default LogMessageForm;