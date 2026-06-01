import React, { useState } from 'react';
import type { CompanyProblemProfileInput } from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none';

const CompanyProblemProfileForm: React.FC<{
 companyId: string;
 onSubmit: (data: CompanyProblemProfileInput) => void;
 onCancel: () => void;
 initialData?: CompanyProblemProfileInput;
}> = ({ companyId, onSubmit, onCancel, initialData }) => {
 const [error, setError] = useState('');
 const [problemTitle, setProblemTitle] = useState(initialData?.problemTitle || '');
 const [problemDescription, setProblemDescription] = useState(initialData?.problemDescription || '');
 const [currentSituation, setCurrentSituation] = useState(initialData?.currentSituation || '');
 const [businessImpact, setBusinessImpact] = useState(initialData?.businessImpact || '');
 const [proposedSolution, setProposedSolution] = useState(initialData?.proposedSolution || '');
 const [serviceAngle, setServiceAngle] = useState(initialData?.serviceAngle || '');
 const [valueProposition, setValueProposition] = useState(initialData?.valueProposition || '');
 const [urgency, setUrgency] = useState(initialData?.urgency || 'medium');
 const [confidence, setConfidence] = useState(initialData?.confidence || 'medium');
 const [status, setStatus] = useState(initialData?.status || 'draft');
 const [notes, setNotes] = useState(initialData?.notes || '');

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!problemTitle.trim()) {
 setError('Problem title is required.');
 return;
 }
 onSubmit({
 companyId,
 problemTitle: problemTitle.trim(),
 problemDescription: problemDescription.trim() || undefined,
 currentSituation: currentSituation.trim() || undefined,
 businessImpact: businessImpact.trim() || undefined,
 proposedSolution: proposedSolution.trim() || undefined,
 serviceAngle: serviceAngle.trim() || undefined,
 valueProposition: valueProposition.trim() || undefined,
 urgency,
 confidence,
 status,
 notes: notes.trim() || undefined,
 });
 };

 return (
 <form className="space-y-4" onSubmit={handleSubmit}>
 <div className="rounded-md border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-[#0f172a]">1. Problem</div>
 <div className="grid grid-cols-1 gap-4">
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Problem Title *</span>
 <input className={baseInput} value={problemTitle} onChange={(e) => setProblemTitle(e.target.value)} placeholder="What problem does this company have?" required />
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Problem Description</span>
 <textarea className={`${baseInput} min-h-20`} value={problemDescription} onChange={(e) => setProblemDescription(e.target.value)} placeholder="Describe the problem in detail..." />
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Current Situation</span>
 <textarea className={`${baseInput} min-h-20`} value={currentSituation} onChange={(e) => setCurrentSituation(e.target.value)} placeholder="What are they doing now? How are they handling it?" />
 </label>
 </div>

 <div className="rounded-md border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-[#0f172a]">2. Solution</div>
 <div className="grid grid-cols-1 gap-4">
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Business Impact</span>
 <textarea className={`${baseInput} min-h-20`} value={businessImpact} onChange={(e) => setBusinessImpact(e.target.value)} placeholder="How does this problem impact their business?" />
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Proposed Solution</span>
 <textarea className={`${baseInput} min-h-20`} value={proposedSolution} onChange={(e) => setProposedSolution(e.target.value)} placeholder="What is your proposed solution?" />
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Service Angle</span>
 <input className={baseInput} value={serviceAngle} onChange={(e) => setServiceAngle(e.target.value)} placeholder="How does your service fit here?" />
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Value Proposition</span>
 <textarea className={`${baseInput} min-h-20`} value={valueProposition} onChange={(e) => setValueProposition(e.target.value)} placeholder="What unique value do you bring?" />
 </label>
 </div>

 <div className="rounded-md border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-xs font-semibold text-[#0f172a]">3. Qualification</div>
 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Urgency</span>
 <select className={baseInput} value={urgency} onChange={(e) => setUrgency(e.target.value)}>
 <option value="low">Low</option>
 <option value="medium">Medium</option>
 <option value="high">High</option>
 <option value="critical">Critical</option>
 </select>
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Confidence</span>
 <select className={baseInput} value={confidence} onChange={(e) => setConfidence(e.target.value)}>
 <option value="low">Low</option>
 <option value="medium">Medium</option>
 <option value="high">High</option>
 </select>
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Status</span>
 <select className={baseInput} value={status} onChange={(e) => setStatus(e.target.value)}>
 <option value="draft">Draft</option>
 <option value="active">Active</option>
 <option value="validated">Validated</option>
 <option value="irrelevant">Irrelevant</option>
 </select>
 </label>
 </div>

 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Notes</span>
 <textarea className={`${baseInput} min-h-20`} value={notes} onChange={(e) => setNotes(e.target.value)} />
 </label>

 {error && (
 <div className="rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
 )}

 <div className="flex items-center justify-end gap-2 pt-2">
 <button type="button" onClick={onCancel} className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">Cancel</button>
 <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm text-white hover:bg-[#1d4ed8]">Save Problem Profile</button>
 </div>
 </form>
 );
};

export default CompanyProblemProfileForm;
