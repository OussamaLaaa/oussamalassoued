import React, { useMemo, useState } from 'react';
import { audienceOptions, goalOptions, languageOptions } from '../../data/messageTemplates';
import type { MessageTemplate, MessageTemplateInput } from '../../types/opportunities';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

const emptyForm: MessageTemplateInput = {
 name: '',
 audience: 'founder',
 goal: 'ux_audit_offer',
 language: 'english',
 subject: '',
 body: '',
 isActive: true,
};

const formatDateLabel = (value?: string) => {
 if (!value) return 'Current';
 const date = new Date(value);
 if (Number.isNaN(date.getTime())) return 'Current';
 return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

const TemplatesPanel: React.FC<{
 templates: MessageTemplate[];
 onAddTemplate: (input: MessageTemplateInput) => Promise<unknown>;
 onUpdateTemplate: (id: string, input: MessageTemplateInput) => Promise<unknown>;
 onDeleteTemplate: (id: string) => Promise<unknown>;
 onSeedDefaults?: () => Promise<unknown>;
}> = ({ templates, onAddTemplate, onUpdateTemplate, onDeleteTemplate, onSeedDefaults }) => {
 const [showForm, setShowForm] = useState(false);
 const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
 const [form, setForm] = useState<MessageTemplateInput>(emptyForm);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [status, setStatus] = useState('');
 const [searchQuery, setSearchQuery] = useState('');
 const [filterAudience, setFilterAudience] = useState('');
 const [filterGoal, setFilterGoal] = useState('');
 const [filterLanguage, setFilterLanguage] = useState('');
 const [filterStatus, setFilterStatus] = useState('');

 const filteredTemplates = useMemo(() => {
 return templates.filter((template) => {
 const haystack = [template.name, template.audience, template.goal, template.language, template.subject || '', template.body || '']
 .join(' ')
 .toLowerCase();

 if (searchQuery && !haystack.includes(searchQuery.toLowerCase())) return false;
 if (filterAudience && template.audience !== filterAudience) return false;
 if (filterGoal && template.goal !== filterGoal) return false;
 if (filterLanguage && template.language !== filterLanguage) return false;
 if (filterStatus === 'active' && template.isActive === false) return false;
 if (filterStatus === 'inactive' && template.isActive !== false) return false;
 return true;
 });
 }, [templates, searchQuery, filterAudience, filterGoal, filterLanguage, filterStatus]);

 const startAdd = () => {
 setEditingTemplate(null);
 setForm(emptyForm);
 setShowForm(true);
 setStatus('');
 };

 const startEdit = (template: MessageTemplate) => {
 setEditingTemplate(template);
 setForm({
 name: template.name,
 audience: template.audience,
 goal: template.goal,
 language: template.language,
 subject: template.subject || '',
 body: template.body,
 isActive: template.isActive !== false,
 });
 setShowForm(true);
 setStatus('');
 };

 const handleSave = async () => {
 if (!form.name.trim()) {
 setStatus('Template name is required.');
 return;
 }

 if (!form.body.trim()) {
 setStatus('Template body is required.');
 return;
 }

 setIsSubmitting(true);
 setStatus('');
 try {
 if (editingTemplate) {
 await onUpdateTemplate(editingTemplate.id, form);
 setStatus('Template updated.');
 } else {
 await onAddTemplate(form);
 setStatus('Template added.');
 }

 setShowForm(false);
 setEditingTemplate(null);
 setForm(emptyForm);
 } catch (error) {
 setStatus(error instanceof Error ? error.message : 'Failed to save template.');
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleDeactivate = async (id: string) => {
 setStatus('');
 try {
 await onDeleteTemplate(id);
 setStatus('Template deactivated.');
 } catch (error) {
 setStatus(error instanceof Error ? error.message : 'Failed to deactivate template.');
 }
 };

 const audienceSelectOptions = [
 { value: '', label: 'All audiences' },
 ...audienceOptions.map((option) => ({ value: option.value, label: option.label })),
 ];
 const goalSelectOptions = [
 { value: '', label: 'All goals' },
 ...goalOptions.map((option) => ({ value: option.value, label: option.label })),
 ];
 const languageSelectOptions = [
 { value: '', label: 'All languages' },
 ...languageOptions.map((option) => ({ value: option.value, label: option.label })),
 ];
 const statusSelectOptions = [
 { value: '', label: 'Status' },
 { value: 'active', label: 'Active' },
 { value: 'inactive', label: 'Inactive' },
 ];

 return (
 <div className="space-y-4">
 <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2">
 <div className="relative min-w-0 flex-1">
 <svg
 className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400"
 width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
 >
 <circle cx="11" cy="11" r="8" />
 <path d="m21 21-4.35-4.35" />
 </svg>
 <input
 type="text"
 value={searchQuery}
 onChange={(event) => setSearchQuery(event.target.value)}
 placeholder="Search templates..."
 className="h-9 w-full rounded-md border border-neutral-200 bg-white pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none transition-colors focus:border-neutral-400"
 />
 </div>
 <select
 value={filterAudience}
 onChange={(event) => setFilterAudience(event.target.value)}
 className={`h-9 rounded-md border bg-white px-3 text-sm outline-none transition-colors ${filterAudience ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}
 >
 {audienceSelectOptions.map((o) => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 </select>
 <select
 value={filterGoal}
 onChange={(event) => setFilterGoal(event.target.value)}
 className={`h-9 rounded-md border bg-white px-3 text-sm outline-none transition-colors ${filterGoal ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}
 >
 {goalSelectOptions.map((o) => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 </select>
 <select
 value={filterLanguage}
 onChange={(event) => setFilterLanguage(event.target.value)}
 className={`h-9 rounded-md border bg-white px-3 text-sm outline-none transition-colors ${filterLanguage ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}
 >
 {languageSelectOptions.map((o) => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 </select>
 <select
 value={filterStatus}
 onChange={(event) => setFilterStatus(event.target.value)}
 className={`h-9 rounded-md border bg-white px-3 text-sm outline-none transition-colors ${filterStatus ? 'border-neutral-900 text-neutral-900' : 'border-neutral-200 text-neutral-700 hover:border-neutral-300'}`}
 >
 {statusSelectOptions.map((o) => (
 <option key={o.value} value={o.value}>{o.label}</option>
 ))}
 </select>
 {templates.length === 0 && onSeedDefaults ? (
 <Button variant="secondary" size="sm" onClick={() => void onSeedDefaults()}>
 Seed default templates
 </Button>
 ) : null}
 <Button variant="primary" size="sm" onClick={startAdd}>
 New Template
 </Button>
 </div>

 <div className="text-xs text-neutral-500">
 Supported placeholders: {'{{personName}}'}, {'{{companyName}}'}, {'{{role}}'}, {'{{myName}}'}, {'{{service}}'}, {'{{observation}}'}.
 </div>

 {showForm ? (
 <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
 <div className="border-b border-neutral-200 px-5 py-4">
 <h3 className="text-sm font-semibold text-neutral-900">{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
 <p className="mt-1 text-xs text-neutral-500">Reusable outreach copy you can personalize on send.</p>
 </div>
 <div className="space-y-4 p-5">
 <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
 <Input
 label="Name"
 type="text"
 value={form.name}
 onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
 placeholder="Founder / UX audit offer / English"
 />
 <Select
 label="Language"
 value={form.language}
 onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
 options={languageOptions.map((option) => ({ value: option.value, label: option.label }))}
 />
 <Select
 label="Audience"
 value={form.audience}
 onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}
 options={audienceOptions.map((option) => ({ value: option.value, label: option.label }))}
 />
 <Select
 label="Goal"
 value={form.goal}
 onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
 options={goalOptions.map((option) => ({ value: option.value, label: option.label }))}
 />
 </div>

 <Input
 label="Subject"
 type="text"
 value={form.subject || ''}
 onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
 placeholder="Quick UX audit idea for {{companyName}}"
 />

 <Textarea
 label="Body"
 value={form.body}
 onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
 className="min-h-44"
 placeholder="Hi {{personName}}, ..."
 />

 <label className="inline-flex items-center gap-2 text-xs text-neutral-500">
 <input
 type="checkbox"
 checked={form.isActive !== false}
 onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
 />
 Active template
 </label>

 <div className="flex flex-wrap justify-end gap-2">
 <Button
 variant="secondary"
 size="sm"
 onClick={() => {
 setShowForm(false);
 setEditingTemplate(null);
 setForm(emptyForm);
 setStatus('');
 }}
 >
 Cancel
 </Button>
 <Button
 variant="primary"
 size="sm"
 onClick={() => void handleSave()}
 disabled={isSubmitting}
 >
 {isSubmitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
 </Button>
 </div>
 </div>
 </div>
 ) : null}

 {filteredTemplates.length ? (
 <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
 <div className="overflow-x-auto">
 <table className="min-w-full border-collapse">
 <thead>
 <tr className="border-b border-neutral-200 bg-neutral-50 text-left text-xs uppercase tracking-wide text-neutral-500">
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Template Name</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Audience</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Goal</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Language</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Status</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap">Updated</th>
 <th className="px-4 py-2.5 font-medium whitespace-nowrap text-right">Actions</th>
 </tr>
 </thead>
 <tbody>
 {filteredTemplates.map((template) => (
 <tr key={template.id} className="border-b border-neutral-100 last:border-b-0 hover:bg-neutral-50 transition-colors">
 <td className="px-4 py-3 align-middle">
 <div className="text-sm font-medium text-neutral-900 max-w-[280px] truncate">{template.name}</div>
 <div className="mt-0.5 max-w-[280px] truncate text-xs text-neutral-500">{template.subject || template.body}</div>
 </td>
 <td className="px-4 py-3 align-middle">
 <Badge variant="neutral">{template.audience}</Badge>
 </td>
 <td className="px-4 py-3 align-middle">
 <Badge variant="neutral">{template.goal.replace(/_/g, ' ')}</Badge>
 </td>
 <td className="px-4 py-3 align-middle text-sm text-neutral-700">{template.language}</td>
 <td className="px-4 py-3 align-middle">
 <Badge variant={template.isActive === false ? 'warning' : 'success'}>
 {template.isActive === false ? 'Inactive' : 'Active'}
 </Badge>
 </td>
 <td className="px-4 py-3 align-middle text-sm text-neutral-500">{formatDateLabel(template.updatedAt)}</td>
 <td className="px-4 py-3 align-middle">
 <div className="flex items-center justify-end gap-1">
 <button
 type="button"
 aria-label="Edit"
 onClick={() => startEdit(template)}
 className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-neutral-900 hover:border-neutral-200 hover:bg-neutral-50 transition-colors"
 >
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
 </svg>
 </button>
 <button
 type="button"
 aria-label="Deactivate"
 onClick={() => void handleDeactivate(template.id)}
 className="inline-flex items-center justify-center h-7 w-7 rounded-md border border-transparent text-neutral-500 hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors"
 >
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
 <path d="M3 6h18" /><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" /><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
 </svg>
 </button>
 </div>
 </td>
 </tr>
 ))}
 </tbody>
 </table>
 </div>
 </div>
 ) : (
 <div className="rounded-xl border border-neutral-200 bg-white">
 <div className="px-5 py-8 text-center">
 <div className="mx-auto max-w-sm">
 <h4 className="text-sm font-semibold text-neutral-900">No templates yet.</h4>
 <p className="mt-1 text-sm text-neutral-500">Create your first outreach template.</p>
 <div className="mt-4 inline-flex">
 <Button variant="primary" size="sm" onClick={startAdd}>New Template</Button>
 </div>
 </div>
 </div>
 </div>
 )}

 {status ? <p className="text-xs text-neutral-500">{status}</p> : null}
 </div>
 );
};

export default TemplatesPanel;
