import React, { useState } from 'react';
import type { CompanyInput, CompanyResearchResult } from '../../types/opportunities';
import CompanyResearchPanel from './CompanyResearchPanel';

const baseInput = 'w-full rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none';

const AddCompanyForm: React.FC<{
  onSubmit: (data: CompanyInput) => void;
  onCancel: () => void;
  initialData?: CompanyInput;
  onResearchResultChange?: (result: CompanyResearchResult | null) => void;
}> = ({ onSubmit, onCancel, initialData, onResearchResultChange }) => {
  const [form, setForm] = useState<CompanyInput>(initialData || {
    name: '',
    databaseType: 'sme',
    industry: '',
    country: '',
    targetNiche: undefined,
    outreachStatus: 'not_contacted',
    city: '',
    website: '',
    linkedin: '',
    priority: 'medium',
    notes: '',
  });
  const setField = <K extends keyof CompanyInput>(key: K, value: CompanyInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const applyResearchPatch = (patch: Partial<CompanyInput>) => {
    setForm((current) => ({
      ...current,
      ...Object.fromEntries(Object.entries(patch).filter(([, value]) => value !== undefined)),
    }));
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <CompanyResearchPanel
        title="AI Research"
        companyName={form.name}
        countryHint={form.country || undefined}
        cityHint={form.city || undefined}
        industryHint={form.industry || undefined}
        websiteHint={form.website || undefined}
        language="auto"
        currentCompany={form}
        debug={import.meta.env.DEV}
        onResultChange={(result) => {
          onResearchResultChange?.(result);
        }}
        onApplyCompanyPatch={(patch) => {
          applyResearchPatch(patch);
        }}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Target Niche</span>
          <select className={baseInput} value={form.targetNiche || ''} onChange={(e) => setField('targetNiche', (e.target.value || undefined) as CompanyInput['targetNiche'])}>
            <option value="">—</option>
            <option value="saas">SaaS</option>
            <option value="b2b_services">B2B Services</option>
            <option value="healthtech">HealthTech</option>
            <option value="edtech">EdTech</option>
            <option value="marketplace">Marketplace</option>
            <option value="ecommerce">E-commerce</option>
            <option value="startup">Startup</option>
            <option value="commercial">Commercial</option>
            <option value="agency">Agency</option>
            <option value="other">Other</option>
          </select>
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
          <span className="text-sm font-medium text-[#0f172a]">Outreach Status</span>
          <select className={baseInput} value={form.outreachStatus || ''} onChange={(e) => setField('outreachStatus', (e.target.value || undefined) as CompanyInput['outreachStatus'])}>
            <option value="">—</option>
            <option value="not_contacted">Not contacted</option>
            <option value="contacted_accepted">Contacted — accepted</option>
            <option value="contacted_rejected">Contacted — rejected</option>
            <option value="contacted_no_reply">Contacted — no reply</option>
          </select>
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
