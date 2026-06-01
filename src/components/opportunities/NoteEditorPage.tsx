import React, { useEffect, useMemo, useState } from 'react';
import AINotesAssistantPanel from './AINotesAssistantPanel';
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
import { detectTextDirection, getDirectionClass } from '../../utils/textDirection';

const inputClass = 'h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400';
const textareaClass = 'w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400 resize-y';
const directionInputClass = (text: string) => `${inputClass} ${getDirectionClass(text)}`;
const directionTextareaClass = (text: string) => `${textareaClass} ${getDirectionClass(text)}`;

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
 const [activeTab, setActiveTab] = useState<'write' | 'ai' | 'blocks' | 'attachments' | 'links' | 'metadata'>('write');
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
 if (!draftAttachment) return;

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

 const assistantContext = {
 linkedProjectName: linkedItems.find((item) => item.label === 'Project')?.value,
 linkedCompanyName: linkedItems.find((item) => item.label === 'Company')?.value,
 linkedPersonName: linkedItems.find((item) => item.label === 'Person')?.value,
 linkedRelationshipName: linkedItems.find((item) => item.label === 'Relationship')?.value,
 linkedTaskTitle: linkedItems.find((item) => item.label === 'Task')?.value,
 linkedStrategyGoalTitle: linkedItems.find((item) => item.label === 'Goal')?.value,
 linkedPlanTitle: linkedItems.find((item) => item.label === 'Plan')?.value,
 };

 const assistantNote = note || ({
 id: '',
 title: form.title || '',
 content: form.content || '',
 categoryId: form.categoryId || '',
 categorySlug: form.categorySlug || '',
 status: form.status || 'draft',
 priority: form.priority || 'medium',
 tags: form.tags || '',
 source: form.source || '',
 notes: form.notes || '',
 } as SmartNote);

 const appendToCurrentNote = async (appendText: string) => {
 const nextContent = `${form.content || ''}${appendText}`;
 setForm((current) => ({ ...current, content: nextContent }));
 if (note?.id) {
 await onUpdateNote(note.id, { content: nextContent });
 }
 };

 const replaceCurrentNote = async (content: string) => {
 setForm((current) => ({ ...current, content }));
 if (note?.id) {
 await onUpdateNote(note.id, { content });
 }
 };

 const applyCategoryAndTags = async (input: { categorySlug?: string; categoryName?: string; tags: string[]; priority?: SmartNote['priority']; status?: SmartNote['status'] }) => {
 const existingTags = String(form.tags || '')
 .split(',')
 .map((tag) => tag.trim())
 .filter(Boolean);
 const mergedTags = Array.from(new Set([...existingTags, ...(input.tags || []).map((tag) => tag.trim()).filter(Boolean)]));

 const matchingCategory = noteCategories.find((category) => {
 const slugMatches = input.categorySlug ? category.slug.toLowerCase() === input.categorySlug.trim().toLowerCase() : false;
 const nameMatches = input.categoryName ? category.name.trim().toLowerCase() === input.categoryName.trim().toLowerCase() : false;
 return slugMatches || nameMatches;
 });

 const nextPatch: Partial<SmartNoteInput> = {
 tags: mergedTags.join(', '),
 categoryId: matchingCategory?.id || form.categoryId || undefined,
 categorySlug: matchingCategory?.slug || form.categorySlug || undefined,
 };

 setForm((current) => ({
 ...current,
 tags: mergedTags.join(', '),
 categoryId: matchingCategory?.id || current.categoryId,
 categorySlug: matchingCategory?.slug || current.categorySlug,
 }));

 if (note?.id) {
 await onUpdateNote(note.id, nextPatch);
 }
 };

 const priorityBadge = (priority: string) => {
 if (priority === 'high') return 'border-red-200 bg-red-50 text-red-700';
 if (priority === 'low') return 'border-neutral-200 bg-neutral-50 text-neutral-500';
 return 'border-neutral-200 bg-neutral-50 text-neutral-700';
 };

 const statusBadge = (status: string) => {
 if (status === 'archived') return 'border-neutral-200 bg-neutral-50 text-neutral-500';
 if (status === 'pinned') return 'border-neutral-200 bg-neutral-50 text-neutral-700';
 return 'border-neutral-200 bg-neutral-50 text-neutral-700';
 };

 const categoryName = note?.categoryName || categoryOptions.find((c) => c.id === form.categoryId)?.name || null;
 const titleDir = detectTextDirection(form.title || '');
 const contentDir = detectTextDirection(form.content || '');

 return (
 <div className="space-y-6">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
 <div className="min-w-0">
 <button type="button" onClick={onBack} className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
 <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
 <path d="m15 18-6-6 6-6" />
 </svg>
 Back to Notes
 </button>
 <div className="mt-3 flex flex-wrap items-center gap-2">
 <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge(note?.status || form.status || 'active')}`}>
 {note?.status || form.status || 'active'}
 </span>
 <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityBadge(note?.priority || form.priority || 'medium')}`}>
 {note?.priority || form.priority || 'medium'}
 </span>
 {categoryName ? (
 <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
 {categoryName}
 </span>
 ) : null}
 </div>
 </div>
 <div className="flex flex-wrap gap-2">
 <button type="button" onClick={persistNote} disabled={saving} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
 {saving ? 'Saving...' : 'Save'}
 </button>
 {noteId ? (
 <button type="button" onClick={() => onArchiveNote(noteId)} className="rounded-md border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50">
 Archive
 </button>
 ) : null}
 {noteId ? (
 <button type="button" onClick={() => onDeleteNote(noteId)} className="rounded-md border border-red-200 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100">
 Delete
 </button>
 ) : null}
 </div>
 </div>
 {error ? <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div> : null}
 </div>

 <div className="flex flex-wrap gap-1 border-b border-neutral-200 pb-3">
 {(['write', 'ai', 'blocks', 'attachments', 'links', 'metadata'] as const).map((tab) => (
 <button
 key={tab}
 type="button"
 onClick={() => setActiveTab(tab)}
 className={`relative px-3 py-2 text-sm transition-colors border-b-2 ${
 activeTab === tab ? 'border-neutral-900 text-neutral-900' : 'border-transparent text-neutral-500 hover:text-neutral-900'
 }`}
 >
 {tab === 'write' ? 'Write' : tab === 'ai' ? 'AI Assistant' : tab === 'blocks' ? 'Blocks' : tab === 'attachments' ? 'Attachments' : tab === 'links' ? 'Links' : 'Metadata'}
 </button>
 ))}
 </div>

 {activeTab === 'ai' ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <AINotesAssistantPanel
 note={assistantNote}
 blocks={blocks}
 attachments={attachments}
 context={assistantContext}
 noteCategories={noteCategories}
 onReplaceContent={replaceCurrentNote}
 onAppendToNote={appendToCurrentNote}
 onApplyCategoryTags={applyCategoryAndTags}
 />
 </div>
 ) : null}

 {activeTab === 'write' ? (
 <div className="grid gap-5 xl:grid-cols-[1.5fr_0.9fr]">
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Title</div>
 <input
 value={form.title}
 onChange={(event) => setField('title', event.target.value)}
 dir={titleDir}
 className={`mt-2 w-full rounded-md border border-neutral-200 bg-white px-3 py-2.5 text-lg font-medium text-neutral-900 outline-none focus:border-neutral-400 ${titleDir === 'rtl' ? 'text-right' : 'text-left'}`}
 placeholder="Untitled note"
 />
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Content</div>
 <textarea
 value={form.content || ''}
 onChange={(event) => setField('content', event.target.value)}
 rows={20}
 dir={contentDir}
 className={`mt-2 w-full rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm leading-relaxed text-neutral-900 outline-none focus:border-neutral-400 resize-y min-h-[400px] whitespace-pre-wrap ${contentDir === 'rtl' ? 'text-right' : 'text-left'}`}
 placeholder="Write your note here..."
 />
 </div>
 </div>

 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-4">
 <label className="block space-y-1.5">
 <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Category</span>
 <select value={form.categoryId || ''} onChange={(event) => {
 const selected = categoryOptions.find((category) => category.id === event.target.value);
 setField('categoryId', event.target.value);
 setField('categorySlug', selected?.slug || '');
 }} className={inputClass}>
 <option value="">Uncategorized</option>
 {categoryOptions.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
 </select>
 </label>
 <label className="block space-y-1.5">
 <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Priority</span>
 <select value={form.priority || 'medium'} onChange={(event) => setField('priority', event.target.value as SmartNoteInput['priority'])} className={inputClass}>
 {notePriorities.map((priority) => <option key={priority} value={priority}>{priority}</option>)}
 </select>
 </label>
 <label className="block space-y-1.5">
 <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Status</span>
 <select value={form.status || 'active'} onChange={(event) => setField('status', event.target.value as SmartNoteInput['status'])} className={inputClass}>
 {noteStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
 </select>
 </label>
 <label className="block space-y-1.5">
 <span className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Tags</span>
 <input value={form.tags || ''} onChange={(event) => setField('tags', event.target.value)} className={inputClass} placeholder="strategy, research, follow-up" />
 </label>
 </div>

 <div className="rounded-xl border border-neutral-200 bg-white p-5 space-y-3">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Quick actions</div>
 <button type="button" onClick={persistNote} disabled={saving} className="w-full rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-60">
 {saving ? 'Saving...' : 'Save note'}
 </button>
 <p className="text-sm leading-6 text-neutral-500">Save once to unlock blocks and attachments. You can still write freely before the first save.</p>
 </div>
 </div>
 </div>
 ) : null}

 {activeTab === 'blocks' ? (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="flex flex-wrap gap-2">
 {blockTypes.map((type) => (
 <button key={type} type="button" onClick={() => addBlock(type)} className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-sm text-neutral-700 hover:bg-neutral-50">
 + {type}
 </button>
 ))}
 </div>
 {!noteId ? (
 <div className="mt-4 rounded-md border border-dashed border-neutral-300 bg-neutral-50 px-4 py-5 text-sm text-neutral-500">
 Save the note first to add blocks.
 </div>
 ) : null}
 </div>
 <div className="space-y-3">
 {sortedBlocks.map((block, index) => (
 <div key={block.id} className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 pb-3">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{block.type}</div>
 <div className="flex gap-2">
 <button type="button" onClick={() => onDeleteBlock(block.id)} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
 Delete
 </button>
 </div>
 </div>
 <div className="mt-4 space-y-4">
 {block.type === 'paragraph' ? (
 <textarea value={block.content || ''} onChange={(event) => onUpdateBlock(block.id, { content: event.target.value })} rows={4} dir={detectTextDirection(block.content || '')} className={directionTextareaClass(block.content || '')} placeholder="Paragraph text" />
 ) : null}
 {block.type === 'heading' ? (
 <input value={block.content || ''} onChange={(event) => onUpdateBlock(block.id, { content: event.target.value })} dir={detectTextDirection(block.content || '')} className={directionInputClass(block.content || '')} placeholder="Heading" />
 ) : null}
 {block.type === 'quote' ? (
 <textarea value={block.content || ''} onChange={(event) => onUpdateBlock(block.id, { content: event.target.value })} rows={4} dir={detectTextDirection(block.content || '')} className={`${directionTextareaClass(block.content || '')} border-l-4 border-l-neutral-400 pl-4 italic`} placeholder="Quote" />
 ) : null}
 {block.type === 'link' ? (
 <div className="grid gap-3 md:grid-cols-2">
 <input value={block.content || ''} onChange={(event) => updateMediaBlock(block, event.target.value, String((block.dataJson as any)?.title || ''))} dir="ltr" className={`${inputClass} text-left`} placeholder="https://..." />
 <input value={String((block.dataJson as any)?.title || '')} onChange={(event) => onUpdateBlock(block.id, { dataJson: { ...(block.dataJson || {}), title: event.target.value } })} dir={detectTextDirection(String((block.dataJson as any)?.title || ''))} className={directionInputClass(String((block.dataJson as any)?.title || ''))} placeholder="Link label" />
 </div>
 ) : null}
 {block.type === 'image' ? (
 <div className="space-y-3">
 <div className="grid gap-3 md:grid-cols-2">
 <input value={block.content || ''} onChange={(event) => updateMediaBlock(block, event.target.value, String((block.dataJson as any)?.title || ''))} dir="ltr" className={`${inputClass} text-left`} placeholder="Image URL" />
 <input value={String((block.dataJson as any)?.title || '')} onChange={(event) => onUpdateBlock(block.id, { dataJson: { ...(block.dataJson || {}), title: event.target.value } })} dir={detectTextDirection(String((block.dataJson as any)?.title || ''))} className={directionInputClass(String((block.dataJson as any)?.title || ''))} placeholder="Caption" />
 </div>
 {block.content ? <img src={block.content} alt={String((block.dataJson as any)?.title || 'Note image')} className="max-h-[280px] w-full rounded-md border border-neutral-200 object-cover" /> : null}
 </div>
 ) : null}
 {block.type === 'video' ? (
 <div className="space-y-3">
 <div className="grid gap-3 md:grid-cols-2">
 <input value={block.content || ''} onChange={(event) => updateMediaBlock(block, event.target.value, String((block.dataJson as any)?.title || ''))} dir="ltr" className={`${inputClass} text-left`} placeholder="Video URL" />
 <input value={String((block.dataJson as any)?.title || '')} onChange={(event) => onUpdateBlock(block.id, { dataJson: { ...(block.dataJson || {}), title: event.target.value } })} dir={detectTextDirection(String((block.dataJson as any)?.title || ''))} className={directionInputClass(String((block.dataJson as any)?.title || ''))} placeholder="Title" />
 </div>
 {block.content ? <a href={block.content} target="_blank" rel="noreferrer" className="text-sm text-neutral-600 hover:underline">Open video</a> : null}
 </div>
 ) : null}
 {block.type === 'audio' ? (
 <div className="space-y-3">
 <div className="grid gap-3 md:grid-cols-2">
 <input value={block.content || ''} onChange={(event) => updateMediaBlock(block, event.target.value, String((block.dataJson as any)?.title || ''))} dir="ltr" className={`${inputClass} text-left`} placeholder="Audio URL" />
 <input value={String((block.dataJson as any)?.title || '')} onChange={(event) => onUpdateBlock(block.id, { dataJson: { ...(block.dataJson || {}), title: event.target.value } })} dir={detectTextDirection(String((block.dataJson as any)?.title || ''))} className={directionInputClass(String((block.dataJson as any)?.title || ''))} placeholder="Title" />
 </div>
 {block.content ? <audio controls src={block.content} className="w-full" /> : null}
 </div>
 ) : null}
 {block.type === 'divider' ? <hr className="border-neutral-200" /> : null}
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
 <div className="text-xs text-neutral-500">Block #{index + 1}</div>
 </div>
 </div>
 ))}
 {sortedBlocks.length === 0 ? (
 <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-sm text-neutral-500">
 No blocks yet. Add one above.
 </div>
 ) : null}
 </div>
 </div>
 ) : null}

 {activeTab === 'attachments' ? (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
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
 <input value={attachmentDraft.title || ''} onChange={(event) => setAttachmentDraft((current) => ({ ...current, title: event.target.value }))} dir={detectTextDirection(attachmentDraft.title || '')} className={directionInputClass(attachmentDraft.title || '')} placeholder="Title" />
 <input value={attachmentDraft.url || ''} onChange={(event) => setAttachmentDraft((current) => ({ ...current, url: event.target.value }))} dir="ltr" className={`${inputClass} text-left`} placeholder="URL" />
 <button type="button" onClick={handleAttachmentSubmit} className="rounded-md bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800">
 Add attachment
 </button>
 </div>
 <textarea value={attachmentDraft.notes || ''} onChange={(event) => setAttachmentDraft((current) => ({ ...current, notes: event.target.value }))} rows={3} dir={detectTextDirection(attachmentDraft.notes || '')} className={`${directionTextareaClass(attachmentDraft.notes || '')} mt-3`} placeholder="Optional notes" />
 </div>

 <div className="space-y-3">
 {sortedAttachments.map((attachment) => (
 <div key={attachment.id} className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-start justify-between gap-3">
 <div className="min-w-0 flex-1">
 <div dir={detectTextDirection(attachment.title || attachment.notes || attachment.url || '')} className={`text-sm font-medium text-neutral-900 break-words whitespace-pre-wrap ${getDirectionClass(attachment.title || attachment.notes || attachment.url || '')}`}>{attachment.title || attachment.url}</div>
 <div className="mt-1 text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{attachment.type}</div>
 </div>
 <div className="flex gap-2">
 <button type="button" onClick={() => onDeleteAttachment(attachment.id)} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100">Delete</button>
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
 dir={detectTextDirection(attachmentEdits[attachment.id]?.title || attachment.title || '')}
 className={directionInputClass(attachmentEdits[attachment.id]?.title || attachment.title || '')}
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
 dir="ltr"
 className={`${inputClass} text-left md:col-span-2`}
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
 dir={detectTextDirection(attachmentEdits[attachment.id]?.notes || attachment.notes || '')}
 className={`${directionTextareaClass(attachmentEdits[attachment.id]?.notes || attachment.notes || '')} md:col-span-2`}
 placeholder="Notes"
 />
 </div>
 <div className="mt-3 flex flex-wrap gap-2">
 <button type="button" onClick={() => handleAttachmentSave(attachment.id)} className="rounded-md bg-neutral-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-neutral-800">
 Save
 </button>
 <a href={attachment.url} target="_blank" rel="noreferrer" className="rounded-md border border-neutral-200 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
 Open
 </a>
 </div>
 </div>
 ))}
 {sortedAttachments.length === 0 ? (
 <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-sm text-neutral-500">
 No attachments yet. Add a link, image, video, audio, PDF, or file URL.
 </div>
 ) : null}
 </div>
 </div>
 ) : null}

 {activeTab === 'links' ? (
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 {linkedItems.length === 0 ? (
 <div className="text-sm text-neutral-500">This note is not linked to anything yet.</div>
 ) : (
 <div className="grid gap-4 md:grid-cols-2">
 {linkedItems.map((item) => (
 <div key={`${item.label}-${item.value}`} className="rounded-md border border-neutral-200 bg-neutral-50 p-4">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">{item.label}</div>
 <div className="mt-1.5 text-sm font-medium text-neutral-900 truncate">{item.value}</div>
 </div>
 ))}
 </div>
 )}
 </div>
 ) : null}

 {activeTab === 'metadata' ? (
 <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Created</div>
 <div className="mt-1.5 text-sm font-medium text-neutral-900">{formatDate(note?.createdAt)}</div>
 </div>
 <div className="rounded-xl border border-neutral-200 bg-white p-5">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Updated</div>
 <div className="mt-1.5 text-sm font-medium text-neutral-900">{formatDate(note?.updatedAt)}</div>
 </div>
 <label className="rounded-xl border border-neutral-200 bg-white p-5 space-y-1.5">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Source</div>
 <input value={form.source || ''} onChange={(event) => setField('source', event.target.value)} dir={detectTextDirection(form.source || '')} className={directionInputClass(form.source || '')} placeholder="Meeting, link, doc, call" />
 </label>
 <label className="rounded-xl border border-neutral-200 bg-white p-5 space-y-1.5 md:col-span-2 xl:col-span-3">
 <div className="text-xs font-semibold uppercase tracking-[0.14em] text-neutral-500">Internal notes</div>
 <textarea value={form.notes || ''} onChange={(event) => setField('notes', event.target.value)} rows={4} dir={detectTextDirection(form.notes || '')} className={directionTextareaClass(form.notes || '')} placeholder="Private notes about this note." />
 </label>
 </div>
 ) : null}
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
 <div key={index} className="flex items-start gap-3 rounded-md border border-neutral-200 bg-white p-3">
 <input type="checkbox" checked={Boolean(item.done)} onChange={(event) => setItem(index, { done: event.target.checked })} className="mt-1" />
 <input value={item.text} onChange={(event) => setItem(index, { text: event.target.value })} dir={detectTextDirection(item.text || '')} className={directionInputClass(item.text || '')} placeholder={`Item ${index + 1}`} />
 <button type="button" onClick={() => onChange(items.filter((_, currentIndex) => currentIndex !== index))} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
 Remove
 </button>
 </div>
 ))}
 <button type="button" onClick={() => onChange([...items, { text: '', done: false }])} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
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
 <button type="button" onClick={() => onChange({ columns: [...columns, `Column ${columns.length + 1}`], rows: rows.map((row) => [...row, '']) })} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
 Add column
 </button>
 <button type="button" onClick={() => onChange({ columns, rows: [...rows, Array(columns.length).fill('')] })} className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700 hover:bg-neutral-50">
 Add row
 </button>
 </div>
 <div className="min-w-[520px] rounded-md border border-neutral-200 bg-white">
 <div className="grid gap-0 border-b border-neutral-200" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
 {columns.map((column, index) => (
 <input key={index} value={column} onChange={(event) => updateColumn(index, event.target.value)} dir={detectTextDirection(column || '')} className={`border-0 border-r border-neutral-200 px-3 py-2 text-sm font-medium text-neutral-900 outline-none last:border-r-0 ${getDirectionClass(column || '')}`} />
 ))}
 </div>
 {rows.map((row, rowIndex) => (
 <div key={rowIndex} className="grid gap-0 border-b border-neutral-200 last:border-b-0" style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}>
 {columns.map((_, columnIndex) => (
 <textarea
 key={columnIndex}
 value={row[columnIndex] || ''}
 onChange={(event) => updateCell(rowIndex, columnIndex, event.target.value)}
 rows={2}
 dir={detectTextDirection(row[columnIndex] || '')}
 className={`border-0 border-r border-neutral-200 px-3 py-2 text-sm text-neutral-900 outline-none last:border-r-0 ${getDirectionClass(row[columnIndex] || '')}`}
 />
 ))}
 </div>
 ))}
 </div>
 </div>
 );
};

export default NoteEditorPage;
