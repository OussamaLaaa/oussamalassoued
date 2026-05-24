import React, { useEffect, useMemo, useState } from 'react';
import type {
  Company,
  NoteAttachment,
  NoteAttachmentInput,
  NoteBlock,
  NoteBlockInput,
  NoteBlockType,
  NoteCategory,
  Person,
  Plan,
  Project,
  Relationship,
  SmartNote,
  SmartNoteInput,
  StrategyGoal,
  Task,
} from '../../types/opportunities';

const shellClass = 'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]';
const inputClass = 'w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15';
const labelClass = 'text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]';
const tabClass = (active: boolean) => `rounded-full border px-3 py-1.5 text-sm transition ${active ? 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]' : 'border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]'}`;

const noteStatuses: SmartNoteInput['status'][] = ['active', 'pinned', 'draft', 'archived'];
const notePriorities: SmartNoteInput['priority'][] = ['high', 'medium', 'low'];
const blockTypes: NoteBlockType[] = ['paragraph', 'heading', 'checklist', 'table', 'image', 'video', 'audio', 'quote', 'link', 'divider'];

const createFormState = (note?: Partial<SmartNote>, draft?: Partial<SmartNoteInput>): SmartNoteInput => ({
  title: note?.title ?? draft?.title ?? '',
  content: note?.content ?? draft?.content ?? '',
  categoryId: note?.categoryId ?? draft?.categoryId ?? '',
  categorySlug: note?.categorySlug ?? draft?.categorySlug ?? '',
  status: note?.status ?? draft?.status ?? 'active',
  priority: note?.priority ?? draft?.priority ?? 'medium',
  tags: note?.tags ?? draft?.tags ?? '',
  linkedProjectId: note?.linkedProjectId ?? draft?.linkedProjectId ?? '',
  linkedCompanyId: note?.linkedCompanyId ?? draft?.linkedCompanyId ?? '',
  linkedPersonId: note?.linkedPersonId ?? draft?.linkedPersonId ?? '',
  linkedRelationshipId: note?.linkedRelationshipId ?? draft?.linkedRelationshipId ?? '',
  linkedTaskId: note?.linkedTaskId ?? draft?.linkedTaskId ?? '',
  linkedStrategyGoalId: note?.linkedStrategyGoalId ?? draft?.linkedStrategyGoalId ?? '',
  linkedPlanId: note?.linkedPlanId ?? draft?.linkedPlanId ?? '',
  source: note?.source ?? draft?.source ?? '',
  notes: note?.notes ?? draft?.notes ?? '',
});

const createDefaultBlock = (type: NoteBlockType, noteId: string, sortOrder: number): NoteBlockInput => {
  if (type === 'checklist') {
    return { noteId, type, dataJson: { items: [{ text: '', done: false }] }, sortOrder };
  }

  if (type === 'table') {
    return { noteId, type, dataJson: { columns: ['Column 1', 'Column 2'], rows: [['', '']] }, sortOrder };
  }

  if (type === 'divider') {
    return { noteId, type, content: '', dataJson: null, sortOrder };
  }

  if (type === 'image' || type === 'video' || type === 'audio' || type === 'link') {
    return { noteId, type, content: '', dataJson: { title: '' }, sortOrder };
  }

  return { noteId, type, content: '', dataJson: null, sortOrder };
};

const formatDate = (value?: string) => (value ? new Date(value).toLocaleString() : 'Not saved yet');

const copyRows = (rows: string[][]) => rows.map((row) => row.slice());

const NoteEditorPage: React.FC<{
  note: SmartNote | null;
  isCreating: boolean;
  draft?: Partial<SmartNoteInput>;
  blocks: NoteBlock[];
  attachments: NoteAttachment[];
  noteCategories: NoteCategory[];
  projects: Project[];
  companies: Company[];
  people: Person[];
  relationships: Relationship[];
  tasks: Task[];
  strategyGoals: StrategyGoal[];
  plans: Plan[];
  onBack: () => void;
  onCreateNote: (input: SmartNoteInput) => Promise<SmartNote>;
  onUpdateNote: (id: string, input: Partial<SmartNoteInput>) => Promise<SmartNote>;
  onDeleteNote: (id: string) => Promise<void>;
  onArchiveNote: (id: string) => Promise<SmartNote>;
  onAddBlock: (input: NoteBlockInput) => Promise<NoteBlock>;
  onUpdateBlock: (id: string, input: Partial<NoteBlockInput>) => Promise<NoteBlock>;
  onDeleteBlock: (id: string) => Promise<void>;
  onAddAttachment: (input: NoteAttachmentInput) => Promise<NoteAttachment>;
  onUpdateAttachment: (id: string, input: Partial<NoteAttachmentInput>) => Promise<NoteAttachment>;
  onDeleteAttachment: (id: string) => Promise<void>;
}> = ({
  note,
  isCreating,
  draft,
  blocks,
  attachments,
  noteCategories,
  projects,
  companies,
  people,
  relationships,
  tasks,
  strategyGoals,
  plans,
  onBack,
  onCreateNote,
  onUpdateNote,
  onDeleteNote,
  onArchiveNote,
  onAddBlock,
  onUpdateBlock,
  onDeleteBlock,
  onAddAttachment,
  onUpdateAttachment,
  onDeleteAttachment,
}) => {
  const [form, setForm] = useState<SmartNoteInput>(() => createFormState(note || undefined, draft));
  const [activeTab, setActiveTab] = useState<'write' | 'blocks' | 'attachments' | 'links' | 'metadata'>('write');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [attachmentDraft, setAttachmentDraft] = useState<NoteAttachmentInput>({ noteId: note?.id || '', type: 'link', title: '', url: '', notes: '' });
  const [attachmentEdits, setAttachmentEdits] = useState<Record<string, { type: NoteAttachment['type']; title: string; url: string; notes: string }>>({});

  useEffect(() => {
    setForm(createFormState(note || undefined, draft));
    setError('');
    setAttachmentDraft({ noteId: note?.id || '', type: 'link', title: '', url: '', notes: '' });
  }, [note?.id, isCreating, draft]);

  useEffect(() => {
    setAttachmentEdits((current) => {
      const next = { ...current };
      for (const attachment of attachments) {
        if (!next[attachment.id]) {
          next[attachment.id] = {
            type: attachment.type,
            title: attachment.title || '',
            url: attachment.url || '',
            notes: attachment.notes || '',
          };
        }
      }
      return next;
    });
  }, [attachments]);

  const categoryOptions = useMemo(() => noteCategories.slice().sort((a, b) => a.name.localeCompare(b.name)), [noteCategories]);
  const sortedBlocks = useMemo(() => blocks.slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)), [blocks]);
  const sortedAttachments = useMemo(() => attachments.slice().sort((a, b) => a.createdAt && b.createdAt ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime() : 0), [attachments]);

  const setField = <K extends keyof SmartNoteInput>(key: K, value: SmartNoteInput[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const noteId = note?.id || '';

  const persistNote = async () => {
    setError('');
    const title = String(form.title || '').trim() || 'Untitled note';

    try {
      setSaving(true);
      const payload: SmartNoteInput = {
        ...form,
        title,
        content: form.content?.trim() || undefined,
        categoryId: form.categoryId?.trim() || undefined,
        categorySlug: form.categorySlug?.trim() || undefined,
        tags: form.tags?.trim() || undefined,
        linkedProjectId: form.linkedProjectId?.trim() || undefined,
        linkedCompanyId: form.linkedCompanyId?.trim() || undefined,
        linkedPersonId: form.linkedPersonId?.trim() || undefined,
        linkedRelationshipId: form.linkedRelationshipId?.trim() || undefined,
        linkedTaskId: form.linkedTaskId?.trim() || undefined,
        linkedStrategyGoalId: form.linkedStrategyGoalId?.trim() || undefined,
        linkedPlanId: form.linkedPlanId?.trim() || undefined,
        source: form.source?.trim() || undefined,
        notes: form.notes?.trim() || undefined,
      };

      const saved = note ? await onUpdateNote(note.id, payload) : await onCreateNote(payload);
      setForm(createFormState(saved));
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'Failed to save note.');
    } finally {
      setSaving(false);
    }
  };

  const activeNote = note;

  const addBlock = async (type: NoteBlockType) => {
    if (!noteId) {
      setError('Save the note first before adding blocks.');
      return;
    }
    const nextOrder = (sortedBlocks.at(-1)?.sortOrder ?? sortedBlocks.length - 1) + 1;
    await onAddBlock(createDefaultBlock(type, noteId, nextOrder));
  };

  const updateChecklistItem = async (block: NoteBlock, items: Array<{ text: string; done: boolean }>) => {
    await onUpdateBlock(block.id, { dataJson: { items } });
  };

  const updateTable = async (block: NoteBlock, table: { columns: string[]; rows: string[][] }) => {
    await onUpdateBlock(block.id, { dataJson: table });
  };

  const updateMediaBlock = async (block: NoteBlock, content: string, title?: string) => {
    await onUpdateBlock(block.id, { content, dataJson: { title: title || '' } });
  };

  const handleAttachmentSubmit = async () => {
    if (!noteId) {
      setError('Save the note first before adding attachments.');
      return;
    }

    const url = String(attachmentDraft.url || '').trim();
    if (!url) {
      setError('Attachment URL is required.');
      return;
    }

    await onAddAttachment({
      ...attachmentDraft,
      noteId,
      url,
      title: attachmentDraft.title?.trim() || undefined,
      notes: attachmentDraft.notes?.trim() || undefined,
    });
    setAttachmentDraft({ noteId, type: 'link', title: '', url: '', notes: '' });
  };

  const handleAttachmentSave = async (attachmentId: string) => {
    const draftAttachment = attachmentEdits[attachmentId];
    if (!draftAttachment) {
      return;
    }

    const url = draftAttachment.url.trim();
    if (!url) {
      setError('Attachment URL is required.');
      return;
    }

    await onUpdateAttachment(attachmentId, {
      type: draftAttachment.type,
      title: draftAttachment.title.trim() || undefined,
      url,
      notes: draftAttachment.notes.trim() || undefined,
    });
  };

  const linkedItems = [
    form.linkedProjectId ? { label: 'Project', value: projects.find((item) => item.id === form.linkedProjectId)?.name || form.linkedProjectId } : null,
    form.linkedCompanyId ? { label: 'Company', value: companies.find((item) => item.id === form.linkedCompanyId)?.name || form.linkedCompanyId } : null,
    form.linkedPersonId ? { label: 'Person', value: people.find((item) => item.id === form.linkedPersonId)?.fullName || form.linkedPersonId } : null,
    form.linkedRelationshipId ? { label: 'Relationship', value: relationships.find((item) => item.id === form.linkedRelationshipId)?.displayName || form.linkedRelationshipId } : null,
    form.linkedTaskId ? { label: 'Task', value: tasks.find((item) => item.id === form.linkedTaskId)?.title || form.linkedTaskId } : null,
    form.linkedStrategyGoalId ? { label: 'Goal', value: strategyGoals.find((item) => item.id === form.linkedStrategyGoalId)?.title || form.linkedStrategyGoalId } : null,
    form.linkedPlanId ? { label: 'Plan', value: plans.find((item) => item.id === form.linkedPlanId)?.title || form.linkedPlanId } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="space-y-4">
      <div className={`${shellClass} p-4 lg:p-5`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <button type="button" onClick={onBack} className="text-sm text-[#2563eb] hover:underline">
              Back to Notes
            </button>
            <h2 className="mt-2 text-2xl font-semibold text-[#0f172a]">{note?.title || 'New Note'}</h2>
            <div className="mt-2 flex flex-wrap gap-2 text-xs">
              <span className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-3 py-1 text-[#475569]">{note?.status || form.status || 'draft'}</span>
              <span className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-3 py-1 text-[#475569]">{note?.priority || form.priority || 'medium'}</span>
              {activeNote?.categoryName || form.categoryId ? (
                <span className="rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-[#1d4ed8]">{activeNote?.categoryName || categoryOptions.find((category) => category.id === form.categoryId)?.name || 'Uncategorized'}</span>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={persistNote} className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]" disabled={saving}>
              {saving ? 'Saving...' : 'Save'}
            </button>
            {noteId ? (
              <button type="button" onClick={() => onArchiveNote(noteId)} className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">
                Archive
              </button>
            ) : null}
            {noteId ? (
              <button type="button" onClick={() => onDeleteNote(noteId)} className="rounded-md border border-[#fee2e2] bg-[#fff1f2] px-4 py-2 text-sm text-[#b91c1c] hover:bg-[#fee2e2]">
                Delete
              </button>
            ) : null}
          </div>
        </div>
        {error ? <div className="mt-4 rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div> : null}
      </div>

      <div className={`${shellClass} p-4 lg:p-5`}>
        <div className="flex flex-wrap gap-2 border-b border-[#e5e7eb] pb-4">
          <button type="button" onClick={() => setActiveTab('write')} className={tabClass(activeTab === 'write')}>Write</button>
          <button type="button" onClick={() => setActiveTab('blocks')} className={tabClass(activeTab === 'blocks')}>Blocks</button>
          <button type="button" onClick={() => setActiveTab('attachments')} className={tabClass(activeTab === 'attachments')}>Attachments</button>
          <button type="button" onClick={() => setActiveTab('links')} className={tabClass(activeTab === 'links')}>Links</button>
          <button type="button" onClick={() => setActiveTab('metadata')} className={tabClass(activeTab === 'metadata')}>Metadata</button>
        </div>

        {activeTab === 'write' ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.9fr)]">
            <div className="space-y-4">
              <label className="space-y-2">
                <div className={labelClass}>Title</div>
                <input value={form.title} onChange={(event) => setField('title', event.target.value)} className="w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-xl font-medium text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15" placeholder="Untitled note" />
              </label>
              <label className="space-y-2">
                <div className={labelClass}>Content</div>
                <textarea value={form.content || ''} onChange={(event) => setField('content', event.target.value)} rows={18} className="min-h-[420px] w-full rounded-xl border border-[#cbd5e1] bg-white px-4 py-3 text-sm leading-6 text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15" placeholder="Write your note here..." />
              </label>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4 space-y-4">
                <label className="space-y-2">
                  <div className={labelClass}>Category</div>
                  <select value={form.categoryId || ''} onChange={(event) => {
                    const selected = categoryOptions.find((category) => category.id === event.target.value);
                    setField('categoryId', event.target.value);
                    setField('categorySlug', selected?.slug || '');
                  }} className={inputClass}>
                    <option value="">Uncategorized</option>
                    {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <div className={labelClass}>Priority</div>
                  <select value={form.priority || 'medium'} onChange={(event) => setField('priority', event.target.value as SmartNoteInput['priority'])} className={inputClass}>
                    {notePriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <div className={labelClass}>Status</div>
                  <select value={form.status || 'active'} onChange={(event) => setField('status', event.target.value as SmartNoteInput['status'])} className={inputClass}>
                    {noteStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
                  </select>
                </label>
                <label className="space-y-2">
                  <div className={labelClass}>Tags</div>
                  <input value={form.tags || ''} onChange={(event) => setField('tags', event.target.value)} className={inputClass} placeholder="strategy, research, follow-up" />
                </label>
              </div>

              <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4 space-y-4">
                <div className={labelClass}>Quick actions</div>
                <button type="button" onClick={persistNote} className="w-full rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]" disabled={saving}>
                  {saving ? 'Saving...' : 'Save note'}
                </button>
                <p className="text-sm leading-6 text-[#64748b]">Save once to unlock blocks and attachments. You can still write freely before the first save.</p>
              </div>
            </div>
          </div>
        ) : null}

        {activeTab === 'blocks' ? (
          <div className="mt-4 space-y-4">
            <div className="flex flex-wrap gap-2">
              {blockTypes.map((type) => (
                <button key={type} type="button" onClick={() => addBlock(type)} className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#0f172a] hover:bg-[#f8fafc]">
                  + {type}
                </button>
              ))}
            </div>
            {!noteId ? <div className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f8fafc] px-4 py-5 text-sm text-[#64748b]">Save the note first to add blocks.</div> : null}
            <div className="space-y-4">
              {sortedBlocks.map((block, index) => (
                <div key={block.id} className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_4px_12px_rgba(15,23,42,0.04)]">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e5e7eb] pb-3">
                    <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">{block.type}</div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onDeleteBlock(block.id)} className="rounded-md border border-[#fee2e2] bg-[#fff1f2] px-3 py-1.5 text-xs text-[#b91c1c] hover:bg-[#fee2e2]">
                        Delete
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 space-y-4">
                    {block.type === 'paragraph' ? (
                      <textarea value={block.content || ''} onChange={(event) => onUpdateBlock(block.id, { content: event.target.value })} rows={4} className={inputClass} placeholder="Paragraph text" />
                    ) : null}
                    {block.type === 'heading' ? (
                      <input value={block.content || ''} onChange={(event) => onUpdateBlock(block.id, { content: event.target.value })} className={inputClass} placeholder="Heading" />
                    ) : null}
                    {block.type === 'quote' ? (
                      <textarea value={block.content || ''} onChange={(event) => onUpdateBlock(block.id, { content: event.target.value })} rows={4} className={`${inputClass} border-l-4 border-l-[#2563eb] pl-4 italic`} placeholder="Quote" />
                    ) : null}
                    {block.type === 'link' ? (
                      <div className="grid gap-3 md:grid-cols-2">
                        <input value={block.content || ''} onChange={(event) => updateMediaBlock(block, event.target.value, String((block.dataJson as any)?.title || ''))} className={inputClass} placeholder="https://..." />
                        <input value={String((block.dataJson as any)?.title || '')} onChange={(event) => onUpdateBlock(block.id, { dataJson: { ...(block.dataJson || {}), title: event.target.value } })} className={inputClass} placeholder="Link label" />
                      </div>
                    ) : null}
                    {block.type === 'image' ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input value={block.content || ''} onChange={(event) => updateMediaBlock(block, event.target.value, String((block.dataJson as any)?.title || ''))} className={inputClass} placeholder="Image URL" />
                          <input value={String((block.dataJson as any)?.title || '')} onChange={(event) => onUpdateBlock(block.id, { dataJson: { ...(block.dataJson || {}), title: event.target.value } })} className={inputClass} placeholder="Caption" />
                        </div>
                        {block.content ? <img src={block.content} alt={String((block.dataJson as any)?.title || 'Note image')} className="max-h-[280px] w-full rounded-xl border border-[#e5e7eb] object-cover" /> : null}
                      </div>
                    ) : null}
                    {block.type === 'video' ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input value={block.content || ''} onChange={(event) => updateMediaBlock(block, event.target.value, String((block.dataJson as any)?.title || ''))} className={inputClass} placeholder="Video URL" />
                          <input value={String((block.dataJson as any)?.title || '')} onChange={(event) => onUpdateBlock(block.id, { dataJson: { ...(block.dataJson || {}), title: event.target.value } })} className={inputClass} placeholder="Title" />
                        </div>
                        {block.content ? <a href={block.content} target="_blank" rel="noreferrer" className="text-sm text-[#2563eb] hover:underline">Open video</a> : null}
                      </div>
                    ) : null}
                    {block.type === 'audio' ? (
                      <div className="space-y-3">
                        <div className="grid gap-3 md:grid-cols-2">
                          <input value={block.content || ''} onChange={(event) => updateMediaBlock(block, event.target.value, String((block.dataJson as any)?.title || ''))} className={inputClass} placeholder="Audio URL" />
                          <input value={String((block.dataJson as any)?.title || '')} onChange={(event) => onUpdateBlock(block.id, { dataJson: { ...(block.dataJson || {}), title: event.target.value } })} className={inputClass} placeholder="Title" />
                        </div>
                        {block.content ? <audio controls src={block.content} className="w-full" /> : null}
                      </div>
                    ) : null}
                    {block.type === 'divider' ? <hr className="border-[#e5e7eb]" /> : null}
                    {block.type === 'checklist' ? (
                      <ChecklistEditor
                        items={Array.isArray((block.dataJson as any)?.items) ? (block.dataJson as any).items : [{ text: '', done: false }]}
                        onChange={(items) => updateChecklistItem(block, items)}
                      />
                    ) : null}
                    {block.type === 'table' ? (
                      <TableEditor
                        table={block.dataJson as any}
                        onChange={(nextTable) => updateTable(block, nextTable)}
                      />
                    ) : null}
                    <div className="text-xs text-[#64748b]">Block #{index + 1}</div>
                  </div>
                </div>
              ))}
              {sortedBlocks.length === 0 ? <div className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f8fafc] px-4 py-5 text-sm text-[#64748b]">No blocks yet. Add one above.</div> : null}
            </div>
          </div>
        ) : null}

        {activeTab === 'attachments' ? (
          <div className="mt-4 space-y-4">
            <div className="grid gap-3 md:grid-cols-4">
              <select value={attachmentDraft.type || 'link'} onChange={(event) => setAttachmentDraft((current) => ({ ...current, type: event.target.value as NoteAttachment['type'] }))} className={inputClass}>
                <option value="link">Link</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
                <option value="audio">Audio</option>
                <option value="pdf">PDF</option>
                <option value="file">File</option>
                <option value="other">Other</option>
              </select>
              <input value={attachmentDraft.title || ''} onChange={(event) => setAttachmentDraft((current) => ({ ...current, title: event.target.value }))} className={inputClass} placeholder="Title" />
              <input value={attachmentDraft.url || ''} onChange={(event) => setAttachmentDraft((current) => ({ ...current, url: event.target.value }))} className={inputClass} placeholder="URL" />
              <button type="button" onClick={handleAttachmentSubmit} className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">
                Add attachment
              </button>
            </div>
            <textarea value={attachmentDraft.notes || ''} onChange={(event) => setAttachmentDraft((current) => ({ ...current, notes: event.target.value }))} rows={3} className={inputClass} placeholder="Optional notes" />
            <div className="space-y-3">
              {sortedAttachments.map((attachment) => (
                <div key={attachment.id} className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-[#0f172a]">{attachment.title || attachment.url}</div>
                      <div className="mt-1 text-xs uppercase tracking-[0.14em] text-[#64748b]">{attachment.type}</div>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={() => onDeleteAttachment(attachment.id)} className="rounded-md border border-[#fee2e2] bg-[#fff1f2] px-3 py-1.5 text-xs text-[#b91c1c] hover:bg-[#fee2e2]">Delete</button>
                    </div>
                  </div>
                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <select
                      value={attachmentEdits[attachment.id]?.type || attachment.type}
                      onChange={(event) => setAttachmentEdits((current) => ({
                        ...current,
                        [attachment.id]: {
                          ...(current[attachment.id] || { title: attachment.title || '', url: attachment.url || '', notes: attachment.notes || '' }),
                          type: event.target.value as NoteAttachment['type'],
                        },
                      }))}
                      className={inputClass}
                    >
                      <option value="link">Link</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                      <option value="audio">Audio</option>
                      <option value="pdf">PDF</option>
                      <option value="file">File</option>
                      <option value="other">Other</option>
                    </select>
                    <input
                      value={attachmentEdits[attachment.id]?.title || attachment.title || ''}
                      onChange={(event) => setAttachmentEdits((current) => ({
                        ...current,
                        [attachment.id]: {
                          ...(current[attachment.id] || { type: attachment.type, url: attachment.url || '', notes: attachment.notes || '' }),
                          title: event.target.value,
                        },
                      }))}
                      className={inputClass}
                      placeholder="Title"
                    />
                    <input
                      value={attachmentEdits[attachment.id]?.url || attachment.url || ''}
                      onChange={(event) => setAttachmentEdits((current) => ({
                        ...current,
                        [attachment.id]: {
                          ...(current[attachment.id] || { type: attachment.type, title: attachment.title || '', notes: attachment.notes || '' }),
                          url: event.target.value,
                        },
                      }))}
                      className={`${inputClass} md:col-span-2`}
                      placeholder="URL"
                    />
                    <textarea
                      value={attachmentEdits[attachment.id]?.notes || attachment.notes || ''}
                      onChange={(event) => setAttachmentEdits((current) => ({
                        ...current,
                        [attachment.id]: {
                          ...(current[attachment.id] || { type: attachment.type, title: attachment.title || '', url: attachment.url || '' }),
                          notes: event.target.value,
                        },
                      }))}
                      rows={3}
                      className={`${inputClass} md:col-span-2`}
                      placeholder="Notes"
                    />
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button type="button" onClick={() => handleAttachmentSave(attachment.id)} className="rounded-md bg-[#2563eb] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#1d4ed8]">
                      Save
                    </button>
                    <a href={attachment.url} target="_blank" rel="noreferrer" className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#0f172a] hover:bg-[#f8fafc]">
                      Open
                    </a>
                  </div>
                </div>
              ))}
              {sortedAttachments.length === 0 ? <div className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f8fafc] px-4 py-5 text-sm text-[#64748b]">No attachments yet.</div> : null}
            </div>
          </div>
        ) : null}

        {activeTab === 'links' ? (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {linkedItems.map((item) => (
              <div key={`${item.label}-${item.value}`} className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
                <div className={labelClass}>{item.label}</div>
                <div className="mt-2 text-sm text-[#0f172a]">{item.value}</div>
              </div>
            ))}
            {linkedItems.length === 0 ? <div className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f8fafc] px-4 py-5 text-sm text-[#64748b]">No linked items yet.</div> : null}
          </div>
        ) : null}

        {activeTab === 'metadata' ? (
          <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <div className={labelClass}>Created</div>
              <div className="mt-2 text-sm text-[#0f172a]">{formatDate(activeNote?.createdAt)}</div>
            </div>
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <div className={labelClass}>Updated</div>
              <div className="mt-2 text-sm text-[#0f172a]">{formatDate(activeNote?.updatedAt)}</div>
            </div>
            <label className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <div className={labelClass}>Source</div>
              <input value={form.source || ''} onChange={(event) => setField('source', event.target.value)} className={`${inputClass} mt-2`} placeholder="Meeting, link, doc, call" />
            </label>
            <label className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4 md:col-span-2 xl:col-span-3">
              <div className={labelClass}>Internal notes</div>
              <textarea value={form.notes || ''} onChange={(event) => setField('notes', event.target.value)} rows={4} className={`${inputClass} mt-2`} placeholder="Private notes about this note." />
            </label>
          </div>
        ) : null}
      </div>
    </div>
  );
};

const ChecklistEditor: React.FC<{
  items: Array<{ text: string; done: boolean }>;
  onChange: (items: Array<{ text: string; done: boolean }>) => void;
}> = ({ items, onChange }) => {
  const setItem = (index: number, next: Partial<{ text: string; done: boolean }>) => {
    onChange(items.map((item, currentIndex) => (currentIndex === index ? { ...item, ...next } : item)));
  };

  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-3 rounded-lg border border-[#e5e7eb] bg-white p-3">
          <input type="checkbox" checked={Boolean(item.done)} onChange={(event) => setItem(index, { done: event.target.checked })} className="mt-1" />
          <input value={item.text} onChange={(event) => setItem(index, { text: event.target.value })} className={inputClass} placeholder={`Item ${index + 1}`} />
          <button type="button" onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))} className="rounded-md border border-[#fee2e2] bg-[#fff1f2] px-3 py-2 text-xs text-[#b91c1c]">
            Remove
          </button>
        </div>
      ))}
      <button type="button" onClick={() => onChange([...items, { text: '', done: false }])} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">
        Add item
      </button>
    </div>
  );
};

const TableEditor: React.FC<{
  table: { columns?: string[]; rows?: string[][] };
  onChange: (next: { columns: string[]; rows: string[][] }) => void;
}> = ({ table, onChange }) => {
  const columns = table?.columns?.length ? table.columns : ['Column 1', 'Column 2'];
  const rows = table?.rows?.length ? table.rows : [['', '']];

  const updateColumn = (index: number, value: string) => {
    const next = columns.slice();
    next[index] = value;
    onChange({ columns: next, rows });
  };

  const updateCell = (rowIndex: number, columnIndex: number, value: string) => {
    const nextRows = copyRows(rows);
    while (nextRows[rowIndex].length < columns.length) nextRows[rowIndex].push('');
    nextRows[rowIndex][columnIndex] = value;
    onChange({ columns, rows: nextRows });
  };

  return (
    <div className="space-y-4 overflow-x-auto">
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => onChange({ columns: [...columns, `Column ${columns.length + 1}`], rows: rows.map((row) => [...row, '']) })} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">
          Add column
        </button>
        <button type="button" onClick={() => onChange({ columns, rows: [...rows, Array(columns.length).fill('')] })} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">
          Add row
        </button>
      </div>
      <div className="min-w-[520px] rounded-xl border border-[#e5e7eb] bg-white">
        <div className="grid gap-0 border-b border-[#e5e7eb]" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
          {columns.map((column, index) => (
            <input key={index} value={column} onChange={(event) => updateColumn(index, event.target.value)} className="border-0 border-r border-[#e5e7eb] px-3 py-2 text-sm font-medium text-[#0f172a] outline-none last:border-r-0" />
          ))}
        </div>
        {rows.map((row, rowIndex) => (
          <div key={rowIndex} className="grid gap-0 border-b border-[#e5e7eb] last:border-b-0" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
            {columns.map((_, columnIndex) => (
              <textarea
                key={columnIndex}
                value={row[columnIndex] || ''}
                onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
                rows={2}
                className="border-0 border-r border-[#e5e7eb] px-3 py-2 text-sm text-[#0f172a] outline-none last:border-r-0"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default NoteEditorPage;
