import React, { useMemo, useState } from 'react';
import { FileText, Search, Copy, Check, Pencil, Trash2 } from 'lucide-react';
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

function isArabicText(text: string): boolean {
  const clean = text.trim();
  if (!clean) return false;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    if (/[a-zA-Z\u0600-\u06FF]/.test(ch)) {
      return /[\u0600-\u06FF]/.test(ch);
    }
  }
  return false;
}

type ModalKind =
  | { type: 'view'; template: MessageTemplate }
  | { type: 'edit'; template: MessageTemplate }
  | { type: 'create' };

const MessageExamplesPanel: React.FC<{
  templates: MessageTemplate[];
  onAddTemplate: (input: MessageTemplateInput) => Promise<unknown>;
  onUpdateTemplate: (id: string, input: MessageTemplateInput) => Promise<unknown>;
  onDeleteTemplate: (id: string) => Promise<unknown>;
}> = ({ templates, onAddTemplate, onUpdateTemplate, onDeleteTemplate }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterChannel, setFilterChannel] = useState('');
  const [modal, setModal] = useState<ModalKind | null>(null);
  const [form, setForm] = useState<MessageTemplateInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

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

  const openView = (template: MessageTemplate) => {
    setModal({ type: 'view', template });
    setConfirmDelete(false);
  };

  const openEdit = (template: MessageTemplate) => {
    setForm({
      name: template.name,
      audience: template.audience,
      goal: template.goal,
      language: template.language,
      subject: template.subject || '',
      body: template.body,
      isActive: template.isActive ?? true,
    });
    setModal({ type: 'edit', template });
    setStatus('');
    setConfirmDelete(false);
  };

  const openCreate = () => {
    setForm(emptyForm);
    setModal({ type: 'create' });
    setStatus('');
    setConfirmDelete(false);
  };

  const closeModal = () => {
    setModal(null);
    setStatus('');
    setConfirmDelete(false);
  };

  const switchToEdit = (template: MessageTemplate) => {
    setForm({
      name: template.name,
      audience: template.audience,
      goal: template.goal,
      language: template.language,
      subject: template.subject || '',
      body: template.body,
      isActive: template.isActive ?? true,
    });
    setModal({ type: 'edit', template });
    setStatus('');
    setConfirmDelete(false);
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
      if (modal?.type === 'edit' && modal.template) {
        await onUpdateTemplate(modal.template.id, form);
        setStatus('Saved successfully.');
        const updated: MessageTemplate = { ...modal.template, ...form };
        setModal({ type: 'view', template: updated });
      } else {
        await onAddTemplate(form);
        closeModal();
      }
    } catch {
      setStatus('Unable to save.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [isDeleting, setIsDeleting] = useState(false);
  const handleDelete = async () => {
    if (modal?.type !== 'edit' && modal?.type !== 'view') return;
    const t = (modal.type === 'edit' || modal.type === 'view') ? modal.template : null;
    if (!t) return;
    setIsDeleting(true);
    try {
      await onDeleteTemplate(t.id);
      closeModal();
    } catch {
      setStatus('Failed to delete message example.');
    } finally {
      setIsDeleting(false);
    }
  };

  const rtl = isArabicText(form.body);

  const textDir = (text: string): React.CSSProperties => {
    const isRtl = isArabicText(text);
    return { direction: isRtl ? 'rtl' : 'ltr', textAlign: isRtl ? 'right' : 'left' };
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
        <Button type="button" variant="primary" size="sm" onClick={openCreate}>
          <FileText className="h-4 w-4" />Add Example
        </Button>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-neutral-200 bg-white p-6 text-center">
          <FileText className="mx-auto h-6 w-6 text-neutral-400" />
          <p className="mt-2 text-sm font-medium text-neutral-900">No message examples yet.</p>
          <p className="mt-0.5 text-xs text-neutral-500">Add your first example to build your library.</p>
          <div className="mt-4">
            <Button type="button" variant="primary" size="sm" onClick={openCreate}>Add Example</Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {filtered.map((template) => {
            const isRtl = isArabicText(template.name) || isArabicText(template.body);
            const cardDir: React.CSSProperties = {
              direction: isRtl ? 'rtl' : 'ltr',
              textAlign: isRtl ? 'right' : 'left',
            };
            const badgeAlign = isRtl ? 'justify-end' : 'justify-start';
            return (
              <div
                key={template.id}
                onClick={() => openView(template)}
                className="flex cursor-pointer flex-col gap-3 rounded-[18px] border border-black/10 bg-white p-5 transition-colors transition-transform hover:-translate-y-0.5 hover:border-black/20 hover:bg-neutral-50"
                style={cardDir}
              >
                {/* Header: title + status badge */}
                <div className={`flex items-center gap-2 ${badgeAlign}`}>
                  <span className="text-sm font-semibold text-neutral-900">{template.name}</span>
                  {template.isActive === false ? (
                    <Badge variant="neutral" className="rounded-full px-3 py-1">Inactive</Badge>
                  ) : null}
                </div>

                {/* Metadata badges: category, channel, language */}
                <div className={`flex flex-wrap gap-2 ${badgeAlign}`}>
                  {template.audience ? (
                    <span className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700">{template.audience}</span>
                  ) : null}
                  {template.goal ? (
                    <span className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700">{template.goal}</span>
                  ) : null}
                  {template.language ? (
                    <span className="inline-flex items-center rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700">{template.language}</span>
                  ) : null}
                </div>

                {/* Tags */}
                {template.subject ? (
                  <div className={`flex flex-wrap gap-1.5 ${badgeAlign}`}>
                    {template.subject.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs text-neutral-600">{tag}</span>
                    ))}
                  </div>
                ) : null}

                {/* Message preview */}
                <div className="line-clamp-4 whitespace-pre-wrap rounded-[14px] border border-black/5 bg-neutral-50 p-4 text-sm leading-7 text-neutral-700">
                  {template.body}
                </div>

                {/* Footer hint */}
                <div className={`text-xs ${isRtl ? 'text-right' : 'text-left'} text-neutral-400`}>
                  Click to open
                </div>
              </div>
            );
          })}
        </div>
      )}

      {modal ? (() => {
        const isCreating = modal.type === 'create';
        const isEditing = modal.type === 'edit';
        const isViewing = modal.type === 'view';
        const template = isViewing || isEditing ? modal.template : null;
        const modalRtl = isViewing && template ? isArabicText(template.name) || isArabicText(template.body) : false;
        const modalAlign = modalRtl ? 'justify-end' : 'justify-start';

        return (
          <OpportunityModal
            title={isCreating ? 'Add Message Example' : isEditing ? 'Edit Message Example' : template!.name}
            onClose={closeModal}
          >
            {isViewing && template ? (
              <div className="space-y-5" dir={modalRtl ? 'rtl' : 'ltr'} style={{ textAlign: modalRtl ? 'right' : 'left' }}>
                {/* Meta badges */}
                <div className={`flex flex-wrap items-center gap-2 ${modalAlign}`}>
                  {template.audience ? <Badge variant="neutral" className="rounded-full px-3 py-1">{template.audience}</Badge> : null}
                  {template.goal ? <Badge variant="neutral" className="rounded-full px-3 py-1">{template.goal}</Badge> : null}
                  {template.language ? <Badge variant="neutral" className="rounded-full px-3 py-1">{template.language}</Badge> : null}
                  {template.isActive === false ? <Badge variant="neutral" className="rounded-full px-3 py-1">Inactive</Badge> : null}
                </div>

                {template.subject ? (
                  <div className={`flex flex-wrap gap-1.5 ${modalAlign}`}>
                    {template.subject.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
                      <span key={tag} className="inline-flex items-center rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs text-neutral-600">{tag}</span>
                    ))}
                  </div>
                ) : null}

                {/* Gmail-like message body */}
                <div
                  className="rounded-xl border border-neutral-200 bg-white p-5 text-sm leading-relaxed text-neutral-900 whitespace-pre-wrap"
                  style={textDir(template.body)}
                >
                  {template.body}
                </div>

                {/* Footer actions */}
                <div className="flex items-center justify-between gap-2 border-t border-neutral-200 pt-4">
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(template.id, template.body)}
                      className="text-neutral-600"
                    >
                      {copiedId === template.id ? (
                        <><Check className="h-3.5 w-3.5" />Copied</>
                      ) : (
                        <><Copy className="h-3.5 w-3.5" />Copy Message</>
                      )}
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {confirmDelete ? (
                      <>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                          Cancel
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete()} disabled={isDeleting} className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
                          {isDeleting ? 'Deleting...' : 'Yes, delete'}
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" variant="ghost" size="sm" onClick={() => switchToEdit(template)} className="text-neutral-600">
                          <Pencil className="h-3.5 w-3.5" />Edit
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="text-red-600 hover:bg-red-50">
                          <Trash2 className="h-3.5 w-3.5" />Delete
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
                          Close
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <label className="block space-y-1">
                  <span className="text-sm font-medium text-neutral-900">Title</span>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="e.g. Cold Email \u2014 UX Audit Offer"
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
                    dir={rtl ? 'rtl' : 'ltr'}
                    placeholder="Write your message example here..."
                    className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
                    style={{ textAlign: rtl ? 'right' : 'left' }}
                  />
                </label>
                {status ? (
                  <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">
                    {status}
                  </div>
                ) : null}
                <div className="flex items-center justify-end gap-2 pt-1">
                  <Button type="button" variant="ghost" size="sm" onClick={closeModal}>
                    Cancel
                  </Button>
                  {!isCreating && template ? (
                    confirmDelete ? (
                      <>
                        <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(false)}>
                          Keep
                        </Button>
                        <Button type="button" variant="ghost" size="sm" onClick={() => void handleDelete()} disabled={isDeleting} className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
                          {isDeleting ? 'Deleting...' : 'Yes, delete'}
                        </Button>
                      </>
                    ) : (
                      <Button type="button" variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} className="border border-red-200 bg-red-50 text-red-700 hover:bg-red-100">
                        Delete
                      </Button>
                    )
                  ) : null}
                  <Button type="button" variant="primary" size="sm" onClick={() => void handleSave()} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Example'}
                  </Button>
                </div>
              </div>
            )}
          </OpportunityModal>
        );
      })() : null}
    </div>
  );
};

export default MessageExamplesPanel;
