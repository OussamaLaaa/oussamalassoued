import React, { useState } from 'react';
import type { CompanyContactMethodInput } from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none';

const TYPES = ['email', 'phone', 'linkedin', 'whatsapp', 'twitter', 'other'] as const;

const CompanyContactMethodForm: React.FC<{
 companyId: string;
 onSubmit: (data: CompanyContactMethodInput) => void;
 onCancel: () => void;
 initialData?: CompanyContactMethodInput;
}> = ({ companyId, onSubmit, onCancel, initialData }) => {
 const [error, setError] = useState('');
 const [type, setType] = useState(initialData?.type || 'email');
 const [label, setLabel] = useState(initialData?.label || '');
 const [value, setValue] = useState(initialData?.value || '');
 const [isPrimary, setIsPrimary] = useState(initialData?.isPrimary || false);
 const [notes, setNotes] = useState(initialData?.notes || '');

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!value.trim()) {
 setError('Value is required.');
 return;
 }
 onSubmit({
 companyId,
 type,
 label: label.trim() || undefined,
 value: value.trim(),
 isPrimary,
 notes: notes.trim() || undefined,
 });
 };

 return (
 <form className="space-y-4" onSubmit={handleSubmit}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Type</span>
 <select className={baseInput} value={type} onChange={(e) => setType(e.target.value)}>
 {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
 </select>
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Is Primary</span>
 <label className="flex items-center gap-2 pt-2 text-sm text-[#0f172a]">
 <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} />
 Primary contact method
 </label>
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Label</span>
 <input className={baseInput} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Work Email, Office Phone..." />
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Value *</span>
 <input className={baseInput} value={value} onChange={(e) => setValue(e.target.value)} placeholder="email@company.com, +123456789..." required />
 </label>
 <label className="space-y-1 md:col-span-2">
 <span className="text-sm font-medium text-[#0f172a]">Notes</span>
 <textarea className={`${baseInput} min-h-20`} value={notes} onChange={(e) => setNotes(e.target.value)} />
 </label>
 </div>

 {error && (
 <div className="rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
 )}

 <div className="flex items-center justify-end gap-2 pt-2">
 <button type="button" onClick={onCancel} className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">Cancel</button>
 <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm text-white hover:bg-[#1d4ed8]">Save Contact Method</button>
 </div>
 </form>
 );
};

export default CompanyContactMethodForm;
