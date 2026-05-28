import React, { useState } from 'react';
import type { CompanyOutreachScriptInput } from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none';

const CHANNELS = ['email', 'phone', 'linkedin', 'whatsapp', 'twitter', 'other'] as const;
const LANGUAGES = ['english', 'french', 'arabic', 'spanish', 'german', 'other'] as const;
const STATUSES = ['draft', 'active', 'archived'] as const;

const CompanyOutreachScriptForm: React.FC<{
 companyId: string;
 onSubmit: (data: CompanyOutreachScriptInput) => void;
 onCancel: () => void;
 initialData?: CompanyOutreachScriptInput;
}> = ({ companyId, onSubmit, onCancel, initialData }) => {
 const [error, setError] = useState('');
 const [name, setName] = useState(initialData?.name || '');
 const [channel, setChannel] = useState(initialData?.channel || 'email');
 const [language, setLanguage] = useState(initialData?.language || 'english');
 const [audience, setAudience] = useState(initialData?.audience || '');
 const [goal, setGoal] = useState(initialData?.goal || '');
 const [hook, setHook] = useState(initialData?.hook || '');
 const [messageBody, setMessageBody] = useState(initialData?.messageBody || '');
 const [callScript, setCallScript] = useState(initialData?.callScript || '');
 const [objectionHandling, setObjectionHandling] = useState(initialData?.objectionHandling || '');
 const [followUpMessage, setFollowUpMessage] = useState(initialData?.followUpMessage || '');
 const [status, setStatus] = useState(initialData?.status || 'draft');
 const [isActive, setIsActive] = useState(initialData?.isActive ?? true);
 const [notes, setNotes] = useState(initialData?.notes || '');

 const handleSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (!name.trim()) {
 setError('Script name is required.');
 return;
 }
 onSubmit({
 companyId,
 name: name.trim(),
 channel,
 language,
 audience: audience.trim() || undefined,
 goal: goal.trim() || undefined,
 hook: hook.trim() || undefined,
 messageBody: messageBody.trim() || undefined,
 callScript: callScript.trim() || undefined,
 objectionHandling: objectionHandling.trim() || undefined,
 followUpMessage: followUpMessage.trim() || undefined,
 status,
 isActive,
 notes: notes.trim() || undefined,
 });
 };

 return (
 <form className="space-y-4" onSubmit={handleSubmit}>
 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Name *</span>
 <input className={baseInput} value={name} onChange={(e) => setName(e.target.value)} placeholder="Script name..." required />
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Channel</span>
 <select className={baseInput} value={channel} onChange={(e) => setChannel(e.target.value)}>
 {CHANNELS.map((c) => <option key={c} value={c}>{c}</option>)}
 </select>
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Language</span>
 <select className={baseInput} value={language} onChange={(e) => setLanguage(e.target.value)}>
 {LANGUAGES.map((l) => <option key={l} value={l}>{l}</option>)}
 </select>
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Status</span>
 <select className={baseInput} value={status} onChange={(e) => setStatus(e.target.value)}>
 {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
 </select>
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Audience</span>
 <input className={baseInput} value={audience} onChange={(e) => setAudience(e.target.value)} placeholder="Target role or department..." />
 </label>
 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Active</span>
 <label className="flex items-center gap-2 pt-2 text-sm text-[#0f172a]">
 <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
 Active script
 </label>
 </label>
 </div>

 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Goal</span>
 <input className={baseInput} value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="What is the goal of this outreach?" />
 </label>

 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Hook</span>
 <input className={baseInput} value={hook} onChange={(e) => setHook(e.target.value)} placeholder="Opening hook to grab attention..." />
 </label>

 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Message Body</span>
 <textarea className={`${baseInput} min-h-24`} value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="The main message content..." />
 </label>

 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Call Script</span>
 <textarea className={`${baseInput} min-h-20`} value={callScript} onChange={(e) => setCallScript(e.target.value)} placeholder="What to say during a call..." />
 </label>

 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Objection Handling</span>
 <textarea className={`${baseInput} min-h-20`} value={objectionHandling} onChange={(e) => setObjectionHandling(e.target.value)} placeholder="How to handle common objections..." />
 </label>

 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Follow-up Message</span>
 <textarea className={`${baseInput} min-h-20`} value={followUpMessage} onChange={(e) => setFollowUpMessage(e.target.value)} placeholder="Follow-up message if no reply..." />
 </label>

 <label className="space-y-1">
 <span className="text-sm font-medium text-[#0f172a]">Notes</span>
 <textarea className={`${baseInput} min-h-20`} value={notes} onChange={(e) => setNotes(e.target.value)} />
 </label>

 {error && (
 <div className="rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div>
 )}

 <div className="flex items-center justify-end gap-2 pt-2">
 <button type="button" onClick={onCancel} className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">Cancel</button>
 <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm text-white hover:bg-[#1d4ed8]">Save Outreach Script</button>
 </div>
 </form>
 );
};

export default CompanyOutreachScriptForm;
