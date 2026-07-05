import React, { useMemo, useState } from 'react';
import { FileText, Search, Copy, Check } from 'lucide-react';
import type { MessageTemplate, MessageTemplateInput } from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import OpportunityModal from './OpportunityModal';

const CATEGORIES = [
  'Cold Outreach',
  'Follow-up',
  'Proposal',
  'Discovery',
  'Re-engagement',
  'Thank You',
  'Pricing',
  'AI Product',
  'UX/UI',
  'Freelance',
] as const;

const CHANNELS = [
  'Email',
  'LinkedIn',
  'WhatsApp',
  'Instagram DM',
  'X/Twitter',
  'Other',
] as const;

const emptyForm: MessageTemplateInput = {
  name: '',
  audience: 'Cold Outreach',
  goal: 'Email',
  language: 'English',
  subject: '',
  body: '',
  isActive: true,
};

const MessageExamplesPanel: React.FC<{
  templates: MessageTemplate[];
  onAddTemplate: (input: MessageTemplateInput) => Promise<unknown>;
  onUpdateTemplate: (id: string, input: MessageTemplateInput) => Promise<unknown>;
  onDeleteTemplate: (id: string) => Promise<unknown>;
}> = ({ templates, onAddTemplate, onUpdateTemplate, onDeleteTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState<MessageTemplateInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return templates.filter((t) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const haystack = [t.name, t.audience, t.goal, t.body, t.subject || ''].join(' ').toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      if (filterCategory && t.audience !== filterCategory) return false;
      if (filterChannel && t.goal !== filterChannel) return false;
      return true;
    });
  }, [templates, searchQuery, filterCategory, filterChannel]);

  const handleCopy = async (id: string, body: string) => {
    try {
      await navigator.clipboard.writeText(body);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = body;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const openAddForm = () => {
    setEditingTemplate(null);
    setForm(emptyForm);
    setStatus('');
    setShowForm(true);
  };

  const openEditForm = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      audience: template.audience,
      goal: template.goal,
      language: template.language,
      subject: template.subject || '',
      body: template.body,
      isActive: template.isActive ?? true,
    });
    setStatus('');
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setStatus('Title is required.');
      return;
    }
    if (!form.body.trim()) {
      setStatus('Message body is required.');
      return;
    }
    setIsSubmitting(true);
    setStatus('');
    try {
      if (editingTemplate) {
        await onUpdateTemplate(editingTemplate.id, form);
        setStatus('Saved successfully.');
      } else {
        await onAddTemplate(form);
        setStatus('Saved successfully.');
      }
      setTimeout(() => setShowForm(false), 800);
    } catch {
      setStatus('Unable to save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const ok = window.confirm('Delete this message example? It will be hidden from the library.');
    if (!ok) return;
    await onDeleteTemplate(id);
  };

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-xl font-semibold text-neutral-900">Message Examples</h2>
        <p className="mt-0.5 text-sm text-neutral-500">
          Reusable outreach and communication examples for manual use.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search title, body, tags..."
            className="w-full rounded-xl border border-neutral-200 bg-white py-2 pl-9 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
          />
        </div>
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
        <select
          value={filterChannel}
          onChange={(e) => setFilterChannel(e.target.value)}
          className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
        >
          <option value="">All Channels</option>
          {CHANNELS.map((ch) => (
            <option key={ch} value={ch}>{ch}</option>
          ))}
        </select>
        <Button type="button" variant="primary" size="sm" onClick={openAddForm}>
          <FileText className="h-4 w-4" />Add Example
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
          <FileText className="mx-auto h-6 w-6 text-neutral-400" />
          <p className="mt-2 text-sm font-medium text-neutral-900">No message examples yet.</p>
          <p className="mt-0.5 text-xs text-neutral-500">Add your first example to build your library.</p>
          <div className="mt-4">
            <Button type="button" variant="primary" size="sm" onClick={openAddForm}>Add Example</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          {filtered.map((template) => (
            <div
              key={template.id}
              className="rounded-xl border border-neutral-200 bg-white p-4 transition-colors hover:border-neutral-300"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-sm font-semibold text-neutral-900">{template.name}</div>
                    {template.isActive !== false ? null : (
                      <Badge variant="neutral">Inactive</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {template.audience ? <Badge variant="neutral">{template.audience}</Badge> : null}
                    {template.goal ? <Badge variant="neutral">{template.goal}</Badge> : null}
                    {template.language ? <Badge variant="neutral">{template.language}</Badge> : null}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(template.id, template.body)}
                    className="text-neutral-600"
                  >
                    {copiedId === template.id ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedId === template.id ? 'Copied' : 'Copy'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => openEditForm(template)} className="text-neutral-600">Edit</Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete(template.id)} className="text-neutral-600">Delete</Button>
                </div>
              </div>
              <div className="mt-3 rounded-lg bg-neutral-50 px-3 py-2.5 text-xs leading-relaxed text-neutral-700 whitespace-pre-wrap line-clamp-4">
                {template.body}
              </div>
              {template.subject ? (
                <div className="mt-2 flex flex-wrap gap-1">
                  {template.subject.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                    <span key={tag} className="rounded-md bg-neutral-100 px-2 py-0.5 text-xs text-neutral-600">{tag}</span>
                  ))}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      )}

      {showForm ? (
        <OpportunityModal
          title={editingTemplate ? 'Edit Message Example' : 'Add Message Example'}
          onClose={() => { setShowForm(false); setEditingTemplate(null); setStatus(''); }}
        >
          <div className="space-y-4">
            <label className="block space-y-1">
              <span className="text-sm font-medium text-neutral-900">Title</span>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Cold Email — UX Audit Offer"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
            </label>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-sm font-medium text-neutral-900">Category</span>
                <select
                  value={form.audience}
                  onChange={(e) => setForm({ ...form, audience: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </label>
              <label className="block space-y-1">
                <span className="text-sm font-medium text-neutral-900">Channel</span>
                <select
                  value={form.goal}
                  onChange={(e) => setForm({ ...form, goal: e.target.value })}
                  className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
                >
                  {CHANNELS.map((ch) => (
                    <option key={ch} value={ch}>{ch}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-neutral-900">Language</span>
              <select
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 focus:border-neutral-400 focus:outline-none"
              >
                <option value="English">English</option>
                <option value="French">French</option>
                <option value="Arabic">Arabic</option>
              </select>
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-neutral-900">Tags</span>
              <input
                type="text"
                value={form.subject || ''}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder="e.g. urgent, design, saas (comma separated)"
                className="w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-neutral-900">Message Body</span>
              <textarea
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                rows={10}
                placeholder="Write your message example here..."
                className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
              />
            </label>
            {status ? (
              <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">
                {status}
              </div>
            ) : null}
            <div className="flex items-center justify-end gap-2 pt-1">
              <Button type="button" variant="ghost" size="sm" onClick={() => { setShowForm(false); setEditingTemplate(null); setStatus(''); }}>
                Cancel
              </Button>
              {editingTemplate ? (
                <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete(editingTemplate.id)} className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
                  Delete
                </Button>
              ) : null}
              <Button type="button" variant="primary" size="sm" onClick={() => void handleSave()} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Example'}
              </Button>
            </div>
          </div>
        </OpportunityModal>
      ) : null}
    </div>
  );
};

export default MessageExamplesPanel;
