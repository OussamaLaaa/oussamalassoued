import React, { useMemo, useState } from 'react';
import type {
 Company,
 NoteAttachment,
 NoteAttachmentInput,
 NoteBlock,
 NoteBlockInput,
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
import Button from '../ui/Button';
import NoteEditorPage from './NoteEditorPage';
import {
 buildDraft,
 buildNoteCategoryMenu,
 categoryKey,
 noteCategorySlug,
 } from './noteCategoryUtils';

const sortNotes = (notes: SmartNote[], sortBy: string) => {
 const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
 const timeValue = (value?: string) => (value ? new Date(value).getTime() : 0);

 return notes.slice().sort((a, b) => {
 if (sortBy === 'created_asc') return timeValue(a.createdAt) - timeValue(b.createdAt);
 if (sortBy === 'updated_desc') return timeValue(b.updatedAt) - timeValue(a.updatedAt);
 if (sortBy === 'name_asc') return a.title.localeCompare(b.title);
 if (sortBy === 'name_desc') return b.title.localeCompare(a.title);
 if (sortBy === 'priority') return priorityRank[a.priority] - priorityRank[b.priority] || timeValue(b.updatedAt) - timeValue(a.updatedAt);
 return timeValue(b.createdAt) - timeValue(a.createdAt);
 });
};

const excerpt = (note: SmartNote) => String(note.content || note.notes || '').trim().replace(/\s+/g, ' ').slice(0, 160);

const formatNoteDate = (date?: string): string => {
 if (!date) return '—';
 try { return new Date(date).toLocaleDateString('en-CA'); }
 catch { return '—'; }
};

const inputClass = 'h-9 w-full rounded-md border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400';

const SmartNotesPanel: React.FC<{
 noteCategories: NoteCategory[];
 smartNotes: SmartNote[];
 noteAttachments: NoteAttachment[];
 noteBlocks: NoteBlock[];
 projects: Project[];
 companies: Company[];
 people: Person[];
 relationships: Relationship[];
 tasks: Task[];
 strategyGoals: StrategyGoal[];
 plans: Plan[];
 onAddSmartNote: (input: SmartNoteInput) => Promise<any>;
 onUpdateSmartNote: (id: string, input: Partial<SmartNoteInput>) => Promise<any>;
 onDeleteSmartNote: (id: string) => Promise<any>;
 onAddNoteAttachment: (input: NoteAttachmentInput) => Promise<any>;
 onUpdateNoteAttachment: (id: string, input: Partial<NoteAttachmentInput>) => Promise<any>;
 onDeleteNoteAttachment: (id: string) => Promise<any>;
 onAddNoteBlock: (input: NoteBlockInput) => Promise<any>;
 onUpdateNoteBlock: (id: string, input: Partial<NoteBlockInput>) => Promise<any>;
 onDeleteNoteBlock: (id: string) => Promise<any>;
 selectedCategorySlug: string;
}> = ({
 noteCategories,
 smartNotes,
 noteAttachments,
 noteBlocks,
 projects,
 companies,
 people,
 relationships,
 tasks,
 strategyGoals,
 plans,
 onAddSmartNote,
 onUpdateSmartNote,
 onDeleteSmartNote,
 onAddNoteAttachment,
 onUpdateNoteAttachment,
 onDeleteNoteAttachment,
 onAddNoteBlock,
 onUpdateNoteBlock,
 onDeleteNoteBlock,
 selectedCategorySlug,
}) => {
 const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
 const [isCreatingNote, setIsCreatingNote] = useState(false);
 const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'updated_desc' | 'name_asc' | 'name_desc' | 'priority'>('created_desc');
 const [searchQuery, setSearchQuery] = useState('');
 const [draftNote, setDraftNote] = useState<Partial<SmartNoteInput>>(buildDraft('all', noteCategories));

 const categoryBySlug = useMemo(() => new Map(noteCategories.map((category) => [categoryKey(category), category] as const)), [noteCategories]);
 const noteById = useMemo(() => new Map(smartNotes.map((note) => [note.id, note] as const)), [smartNotes]);
 const blocksByNoteId = useMemo(() => {
 const map = new Map<string, NoteBlock[]>();
 for (const block of noteBlocks) {
 const list = map.get(block.noteId) || [];
 list.push(block);
 map.set(block.noteId, list);
 }
 return map;
 }, [noteBlocks]);
 const attachmentsByNoteId = useMemo(() => {
 const map = new Map<string, NoteAttachment[]>();
 for (const attachment of noteAttachments) {
 const list = map.get(attachment.noteId) || [];
 list.push(attachment);
 map.set(attachment.noteId, list);
 }
 return map;
 }, [noteAttachments]);

 const categoryMenu = useMemo(() => buildNoteCategoryMenu(noteCategories, smartNotes), [noteCategories, smartNotes]);

 const filteredNotes = useMemo(() => {
 const query = searchQuery.trim().toLowerCase();
 const matched = smartNotes.filter((note) => {
 const slug = noteCategorySlug(note, noteCategories);
 const categoryMatches = selectedCategorySlug === 'all' || slug === selectedCategorySlug;
 const searchMatches = !query || [note.title, note.content || '', note.tags || ''].join(' ').toLowerCase().includes(query);
 return categoryMatches && searchMatches;
 });
 return sortNotes(matched, sortBy);
 }, [smartNotes, noteCategories, selectedCategorySlug, searchQuery, sortBy]);

 const selectedNote = selectedNoteId ? noteById.get(selectedNoteId) || null : null;
 const selectedBlocks = selectedNote ? (blocksByNoteId.get(selectedNote.id) || []).slice().sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)) : [];
 const selectedAttachments = selectedNote ? (attachmentsByNoteId.get(selectedNote.id) || []).slice() : [];

 const openCreateNote = () => {
 setDraftNote(buildDraft(selectedCategorySlug, noteCategories));
 setSelectedNoteId(null);
 setIsCreatingNote(true);
 };
 const openNote = (note: SmartNote) => {
 setSelectedNoteId(note.id);
 setIsCreatingNote(false);
 setDraftNote({});
 };

 const handleSaveNewNote = async (input: SmartNoteInput) => {
 const saved = await onAddSmartNote(input);
 setSelectedNoteId(saved.id);
 setIsCreatingNote(false);
 setDraftNote({});
 return saved;
 };

 const handleSaveExistingNote = async (id: string, input: Partial<SmartNoteInput>) => {
 const saved = await onUpdateSmartNote(id, input);
 setSelectedNoteId(saved.id);
 return saved;
 };

 const handleArchiveNote = async (id: string) => {
 const saved = await onUpdateSmartNote(id, { status: 'archived' });
 setSelectedNoteId(saved.id);
 setIsCreatingNote(false);
 };

 const handleDeleteNote = async (id: string) => {
 await onDeleteSmartNote(id);
 setSelectedNoteId(null);
 setIsCreatingNote(false);
 };

 const selectedCategoryName = categoryMenu.find((category) => category.slug === selectedCategorySlug)?.name || 'All';

 if (selectedNoteId || isCreatingNote) {
 return (
 <NoteEditorPage
 note={selectedNote}
 isCreating={isCreatingNote}
 draft={draftNote}
 blocks={selectedNote ? selectedBlocks : []}
 attachments={selectedNote ? selectedAttachments : []}
 noteCategories={noteCategories}
 projects={projects}
 companies={companies}
 people={people}
 relationships={relationships}
 tasks={tasks}
 strategyGoals={strategyGoals}
 plans={plans}
 onBack={() => {
 setSelectedNoteId(null);
 setIsCreatingNote(false);
 setDraftNote(buildDraft(selectedCategorySlug, noteCategories));
 }}
 onCreateNote={handleSaveNewNote}
 onUpdateNote={handleSaveExistingNote}
 onDeleteNote={handleDeleteNote}
 onArchiveNote={handleArchiveNote}
 onAddBlock={(input) => onAddNoteBlock(input)}
 onUpdateBlock={(id, input) => onUpdateNoteBlock(id, input)}
 onDeleteBlock={(id) => onDeleteNoteBlock(id)}
 onAddAttachment={(input) => onAddNoteAttachment(input)}
 onUpdateAttachment={(id, input) => onUpdateNoteAttachment(id, input)}
 onDeleteAttachment={(id) => onDeleteNoteAttachment(id)}
 />
 );
 }

 return (
 <div className="space-y-4">
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <div className="flex flex-wrap items-center gap-3">
 <div className="min-w-0 flex-1">
 <input
 value={searchQuery}
 onChange={(event) => setSearchQuery(event.target.value)}
 placeholder="Search notes, content, tags..."
 className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 placeholder:text-neutral-400 outline-none focus:border-neutral-400"
 />
 </div>
 <select
 value={sortBy}
 onChange={(event) => setSortBy(event.target.value as typeof sortBy)}
 className="h-10 w-full rounded-lg border border-neutral-200 bg-white px-3 text-sm text-neutral-900 outline-none focus:border-neutral-400 md:w-auto md:min-w-[160px]"
 >
 <option value="created_desc">Newest</option>
 <option value="created_asc">Oldest</option>
 <option value="updated_desc">Recently updated</option>
 <option value="name_asc">Name A-Z</option>
 <option value="name_desc">Name Z-A</option>
 <option value="priority">Priority</option>
 </select>
 <Button variant="primary" size="sm" onClick={openCreateNote} className="h-10 px-4">
 + New Note
 </Button>
 </div>
 {selectedCategorySlug !== 'all' ? (
 <div className="mt-3 text-xs text-neutral-500">
 Showing <span className="font-medium text-neutral-900">{selectedCategoryName}</span> notes
 </div>
 ) : null}
 </div>

 <div className="space-y-2">
 {filteredNotes.map((note) => {
 const filterCategory = noteCategories.find((item) => item.id === note.categoryId) || categoryBySlug.get(note.categorySlug || '') || null;

 const editNote = (event: React.MouseEvent) => {
 event.stopPropagation();
 openNote(note);
 };

 const archiveNote = async (event: React.MouseEvent) => {
 event.stopPropagation();
 await onUpdateSmartNote(note.id, { status: 'archived' });
 };

 const deleteNote = async (event: React.MouseEvent) => {
 event.stopPropagation();
 await onDeleteSmartNote(note.id);
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

 const blocks = blocksByNoteId.get(note.id);
 const attachments = attachmentsByNoteId.get(note.id);

 return (
 <div
 key={note.id}
 onClick={() => openNote(note)}
 className="group cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left transition hover:bg-neutral-50"
 >
 <div className="flex items-start justify-between gap-4">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <h3 className="truncate text-sm font-semibold text-neutral-900">{note.title}</h3>
 {blocks?.length ? <span className="shrink-0 text-xs text-neutral-400">B:{blocks.length}</span> : null}
 {attachments?.length ? <span className="shrink-0 text-xs text-neutral-400">A:{attachments.length}</span> : null}
 </div>
 <p className="mt-0.5 line-clamp-2 overflow-hidden break-words text-sm text-neutral-500">
 {excerpt(note) || 'No content yet.'}
 </p>
 </div>
 <div className="flex shrink-0 flex-wrap items-center gap-1.5">
 {filterCategory ? (
 <span className="rounded-full border border-neutral-200 bg-neutral-50 px-2.5 py-0.5 text-xs font-medium text-neutral-700">
 {filterCategory.name}
 </span>
 ) : null}
 <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${priorityBadge(note.priority)}`}>
 {note.priority}
 </span>
 <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusBadge(note.status)}`}>
 {note.status}
 </span>
 {note.tags ? note.tags.split(',').slice(0, 2).map((tag) => (
 <span key={tag.trim()} className="rounded-full border border-neutral-200 bg-white px-2.5 py-0.5 text-xs text-neutral-600">
 {tag.trim()}
 </span>
 )) : null}
 <span className="text-xs text-neutral-500">{formatNoteDate(note.createdAt)}</span>
 <div className="flex items-center gap-1">
 <button type="button" onClick={editNote} className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-700 hover:bg-neutral-50">
 Open
 </button>
 <button type="button" onClick={archiveNote} className="rounded-md border border-neutral-200 bg-white px-2 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-50">
 Archive
 </button>
 <button type="button" onClick={deleteNote} className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-100">
 Delete
 </button>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 {filteredNotes.length === 0 ? (
 <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-6 py-8 text-sm text-neutral-500">
 {searchQuery || selectedCategorySlug !== 'all'
 ? 'No notes match your filters. Try changing search or category.'
 : 'No notes yet. Create your first note to start building your personal memory.'}
 </div>
 ) : null}
 </div>

 </div>
 );
};

export default SmartNotesPanel;
