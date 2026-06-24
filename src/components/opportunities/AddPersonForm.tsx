import React, { useMemo, useState } from 'react';
import type { Company, PersonInput } from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none';

const AddPersonForm: React.FC<{
  companies: Company[];
  onSubmit: (data: PersonInput) => void;
  onCancel: () => void;
  initialData?: PersonInput;
}> = ({ companies, onSubmit, onCancel, initialData }) => {
  const [companyId, setCompanyId] = useState(initialData?.companyId || '');
  const [error, setError] = useState('');
  const [form, setForm] = useState<PersonInput>(initialData || {
    companyId: undefined,
    fullName: '',
    role: '',
    phone: '',
    linkedin: '',
    emailPublic: '',
    contactChannel: '',
    relationType: 'medium',
    decisionPower: 'unknown',
    notes: '',
  });

  const selectedCompany = useMemo(() => companies.find((company) => company.id === companyId), [companies, companyId]);

  const setField = <K extends keyof PersonInput>(key: K, value: PersonInput[K]) => {
    setError('');
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit({ ...form, companyId: companyId || undefined });
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Company (optional)</span>
          <select className={baseInput} value={companyId} onChange={(e) => setCompanyId(e.target.value)}>
            <option value="">No company</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Full Name</span>
          <input className={baseInput} value={form.fullName} onChange={(e) => setField('fullName', e.target.value)} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Role</span>
          <input className={baseInput} value={form.role || ''} onChange={(e) => setField('role', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Phone</span>
          <input type="tel" className={baseInput} value={form.phone || ''} onChange={(e) => setField('phone', e.target.value)} placeholder="+216 ..." />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">LinkedIn</span>
          <input className={baseInput} value={form.linkedin || ''} onChange={(e) => setField('linkedin', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Public Email</span>
          <input className={baseInput} value={form.emailPublic || ''} onChange={(e) => setField('emailPublic', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Contact Channel</span>
          <input className={baseInput} value={form.contactChannel || ''} onChange={(e) => setField('contactChannel', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Relation Type</span>
          <select
            className={baseInput}
            value={form.relationType || 'medium'}
            onChange={(e) => setField('relationType', e.target.value)}
          >
            <option value="new">New</option>
            <option value="weak">Weak</option>
            <option value="medium">Medium</option>
            <option value="strong">Strong</option>
            <option value="strategic">Strategic</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Decision Power</span>
          <select className={baseInput} value={form.decisionPower} onChange={(e) => setField('decisionPower', e.target.value as PersonInput['decisionPower'])}>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
            <option value="unknown">unknown</option>
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Notes</span>
          <textarea className={`${baseInput} min-h-24`} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
        </label>
      </div>

      {error && (
        <div className="rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">
          {error}
        </div>
      )}

      <div className="rounded-md border border-[#e5e7eb] bg-[#f8fafc] p-3 text-xs text-[#64748b]">
        Selected company: <span className="font-medium text-[#0f172a]">{selectedCompany?.name || 'None'}</span>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">Cancel</button>
        <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm text-white hover:bg-[#1d4ed8]">Save Person</button>
      </div>
    </form>
  );
};

export default AddPersonForm;