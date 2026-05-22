import React, { useMemo, useState } from 'react';
import type { Company, DealInput, Person } from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15';

const AddDealForm: React.FC<{
  companies: Company[];
  people: Person[];
  onSubmit: (data: DealInput) => void;
  onCancel: () => void;
}> = ({ companies, people, onSubmit, onCancel }) => {
  const [companyId, setCompanyId] = useState(companies[0]?.id || '');
  const filteredPeople = useMemo(() => people.filter((person) => !companyId || person.companyId === companyId), [companyId, people]);
  const [personId, setPersonId] = useState(filteredPeople[0]?.id || '');
  const [form, setForm] = useState<DealInput>({
    companyId: companies[0]?.id,
    personId: filteredPeople[0]?.id,
    servicePackage: '',
    problem: '',
    proposedSolution: '',
    value: 0,
    currency: 'USD',
    stage: 'discovery',
    probability: 50,
    notes: '',
  });

  const setField = <K extends keyof DealInput>(key: K, value: DealInput[K]) => {
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
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Service Package</span>
          <input className={baseInput} value={form.servicePackage || ''} onChange={(e) => setField('servicePackage', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Problem</span>
          <textarea className={`${baseInput} min-h-20`} value={form.problem || ''} onChange={(e) => setField('problem', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Proposed Solution</span>
          <textarea className={`${baseInput} min-h-20`} value={form.proposedSolution || ''} onChange={(e) => setField('proposedSolution', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Value</span>
          <input type="number" min="0" className={baseInput} value={form.value ?? ''} onChange={(e) => setField('value', Number(e.target.value))} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Currency</span>
          <select className={baseInput} value={form.currency} onChange={(e) => setField('currency', e.target.value as DealInput['currency'])}>
            <option value="TND">TND</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
            <option value="AED">AED</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Stage</span>
          <select className={baseInput} value={form.stage} onChange={(e) => setField('stage', e.target.value)}>
            <option value="discovery">discovery</option>
            <option value="proposal_sent">proposal_sent</option>
            <option value="negotiation">negotiation</option>
            <option value="won">won</option>
            <option value="lost">lost</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Probability</span>
          <input type="number" min="0" max="100" className={baseInput} value={form.probability ?? ''} onChange={(e) => setField('probability', Number(e.target.value))} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Notes</span>
          <textarea className={`${baseInput} min-h-24`} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">Cancel</button>
        <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm text-white hover:bg-[#1d4ed8]">Save Deal</button>
      </div>
    </form>
  );
};

export default AddDealForm;