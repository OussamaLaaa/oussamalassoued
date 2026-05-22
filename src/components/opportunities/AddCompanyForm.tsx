import React, { useState } from 'react';
import type { CompanyInput } from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15';

const AddCompanyForm: React.FC<{
  onSubmit: (data: CompanyInput) => void;
  onCancel: () => void;
}> = ({ onSubmit, onCancel }) => {
  const [form, setForm] = useState<CompanyInput>({
    name: '',
    databaseType: 'sme',
    category: '',
    industry: '',
    country: '',
    city: '',
    website: '',
    linkedin: '',
    priority: 'medium',
    fitScore: 6,
    ethicalFit: 'good',
    status: 'prospect',
    nextAction: '',
    notes: '',
  });

  const setField = <K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Name</span>
          <input className={baseInput} value={form.name} onChange={(e) => setField('name', e.target.value)} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Database Type</span>
          <select className={baseInput} value={form.databaseType} onChange={(e) => setField('databaseType', e.target.value as CompanyInput['databaseType'])}>
            <option value="big_company">big_company</option>
            <option value="sme">sme</option>
            <option value="freelance">freelance</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Category</span>
          <input className={baseInput} value={form.category || ''} onChange={(e) => setField('category', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Industry</span>
          <input className={baseInput} value={form.industry || ''} onChange={(e) => setField('industry', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Country</span>
          <input className={baseInput} value={form.country || ''} onChange={(e) => setField('country', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">City</span>
          <input className={baseInput} value={form.city || ''} onChange={(e) => setField('city', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Website</span>
          <input className={baseInput} value={form.website || ''} onChange={(e) => setField('website', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">LinkedIn</span>
          <input className={baseInput} value={form.linkedin || ''} onChange={(e) => setField('linkedin', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Priority</span>
          <select className={baseInput} value={form.priority} onChange={(e) => setField('priority', e.target.value as CompanyInput['priority'])}>
            <option value="high">high</option>
            <option value="medium">medium</option>
            <option value="low">low</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Fit Score</span>
          <input type="number" min="1" max="10" className={baseInput} value={form.fitScore ?? ''} onChange={(e) => setField('fitScore', Number(e.target.value))} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Ethical Fit</span>
          <select className={baseInput} value={form.ethicalFit} onChange={(e) => setField('ethicalFit', e.target.value as CompanyInput['ethicalFit'])}>
            <option value="good">good</option>
            <option value="needs_review">needs_review</option>
            <option value="avoid">avoid</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Status</span>
          <select className={baseInput} value={form.status} onChange={(e) => setField('status', e.target.value as CompanyInput['status'])}>
            <option value="prospect">prospect</option>
            <option value="contacted">contacted</option>
            <option value="qualified">qualified</option>
            <option value="customer">customer</option>
            <option value="lost">lost</option>
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Next Action</span>
          <input className={baseInput} value={form.nextAction || ''} onChange={(e) => setField('nextAction', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Notes</span>
          <textarea className={`${baseInput} min-h-24`} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
        </label>
      </div>

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">Cancel</button>
        <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm text-white hover:bg-[#1d4ed8]">Save Company</button>
      </div>
    </form>
  );
};

export default AddCompanyForm;