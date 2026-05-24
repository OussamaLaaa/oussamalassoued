import React, { useMemo, useState } from 'react';
import type {
  Company,
  NoteAttachment,
  NoteAttachmentInput,
  NoteBlock,
  NoteBlockInput,
  NoteCategory,
  NoteCategoryInput,
  Person,
  Plan,
  Project,
  Relationship,
  SmartNote,
  SmartNoteInput,
  StrategyGoal,
  Task,
} from '../../types/opportunities';
import OpportunityModal from './OpportunityModal';
import NoteCategoryForm from './NoteCategoryForm';
import NoteEditorPage from './NoteEditorPage';

const shellClass = 'rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]';
const pillClass = 'rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#0f172a] hover:bg-[#f8fafc]';
const activePillClass = 'rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1.5 text-sm text-[#1d4ed8]';
const cardClass = 'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]';

const fixedCategories = [
  { slug: 'work', label: 'Work' },
  { slug: 'home', label: 'Home' },
  { slug: 'money', label: 'Money' },
  { slug: 'projects', label: 'Projects' },
  { slug: 'ideas', label: 'Ideas' },
  { slug: 'learning', label: 'Learning' },
  { slug: 'health', label: 'Health' },
  { slug: 'relationships', label: 'Relationships' },
  { slug: 'islamic-ethics', label: 'Islamic/Ethics' },
  { slug: 'admin', label: 'Admin' },
  { slug: 'other', label: 'Other' },
] as const;

const fixedCategorySlugSet = new Set(fixedCategories.map((item) => item.slug));

const categoryKey = (category: NoteCategory) => category.slug || category.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
const noteCategorySlug = (note: SmartNote, noteCategories: NoteCategory[]) => {
  const categoryById = new Map(noteCategories.map((category) => [category.id, category] as const));
  return note.categorySlug || categoryById.get(note.categoryId || '')?.slug || 'uncategorized';
};

const buildDraft = (selectedCategorySlug: string, noteCategories: NoteCategory[]): Partial<SmartNoteInput> => {
  const categoryBySlug = new Map(noteCategories.map((category) => [categoryKey(category), category] as const));
  const selectedCategory = categoryBySlug.get(selectedCategorySlug);
  return {
    title: '',
    content: '',
    categoryId: selectedCategory?.id,
    categorySlug: selectedCategory?.slug,
    status: 'active',
    priority: 'medium',
    tags: '',
    source: '',
    notes: '',
  };
};

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
  onAddNoteCategory: (input: NoteCategoryInput) => Promise<any>;
  onUpdateNoteCategory: (id: string, input: Partial<NoteCategoryInput>) => Promise<any>;
  onDeleteNoteCategory: (id: string) => Promise<any>;
  onAddSmartNote: (input: SmartNoteInput) => Promise<any>;
  onUpdateSmartNote: (id: string, input: Partial<SmartNoteInput>) => Promise<any>;
  onDeleteSmartNote: (id: string) => Promise<any>;
  onAddNoteAttachment: (input: NoteAttachmentInput) => Promise<any>;
  onUpdateNoteAttachment: (id: string, input: Partial<NoteAttachmentInput>) => Promise<any>;
  onDeleteNoteAttachment: (id: string) => Promise<any>;
  onAddNoteBlock: (input: NoteBlockInput) => Promise<any>;
  onUpdateNoteBlock: (id: string, input: Partial<NoteBlockInput>) => Promise<any>;
  onDeleteNoteBlock: (id: string) => Promise<any>;
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
  onAddNoteCategory,
  onUpdateNoteCategory,
  onDeleteNoteCategory,
  onAddSmartNote,
  onUpdateSmartNote,
  onDeleteSmartNote,
  onAddNoteAttachment,
  onUpdateNoteAttachment,
  onDeleteNoteAttachment,
  onAddNoteBlock,
  onUpdateNoteBlock,
  onDeleteNoteBlock,
}) => {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [isCreatingNote, setIsCreatingNote] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'created_desc' | 'created_asc' | 'updated_desc' | 'name_asc' | 'name_desc' | 'priority'>('created_desc');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
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

  const categoryMenu = useMemo(() => {
    const customCategories = noteCategories
      .filter((category) => !fixedCategorySlugSet.has(categoryKey(category)))
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));

    return [
      { id: 'all', slug: 'all', name: 'All', color: '#2563eb', count: smartNotes.length },
      ...fixedCategories.map((item) => ({
        id: item.slug,
        slug: item.slug,
        name: item.label,
        color: '#2563eb',
        count: smartNotes.filter((note) => noteCategorySlug(note, noteCategories) === item.slug).length,
      })),
      ...customCategories.map((category) => ({
        ...category,
        slug: categoryKey(category),
        count: smartNotes.filter((note) => noteCategorySlug(note, noteCategories) === categoryKey(category)).length,
      })),
      { id: 'uncategorized', slug: 'uncategorized', name: 'Uncategorized', color: '#64748b', count: smartNotes.filter((note) => noteCategorySlug(note, noteCategories) === 'uncategorized').length },
    ];
  }, [noteCategories, smartNotes]);

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

  const openCreateCategory = () => setCategoryModalOpen(true);
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

  const handleSubmitCategory = async (input: NoteCategoryInput) => {
    await onAddNoteCategory(input);
    setCategoryModalOpen(false);
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

  const handleSaveCategoryEdit = async (input: NoteCategoryInput) => {
    if (categoryModalOpen) {
      await onAddNoteCategory(input);
    }
  };

  const renderCategoryPill = (category: { id: string; slug: string; name: string; count: number }) => {
    const active = selectedCategorySlug === category.slug;
    return (
      <button
        key={category.id}
        type="button"
        onClick={() => {
          setSelectedCategorySlug(category.slug);
          setSelectedNoteId(null);
          setIsCreatingNote(false);
        }}
        className={active ? activePillClass : pillClass}
      >
        {category.name} <span className="ml-1 text-xs text-[#64748b]">{category.count}</span>
      </button>
    );
  };

  const selectedCategoryName = categoryMenu.find((category) => category.slug === selectedCategorySlug)?.name || 'All';
  const blockCountByNote = new Map<string, number>();
  for (const block of noteBlocks) blockCountByNote.set(block.noteId, (blockCountByNote.get(block.noteId) || 0) + 1);
  const attachmentCountByNote = new Map<string, number>();
  for (const attachment of noteAttachments) attachmentCountByNote.set(attachment.noteId, (attachmentCountByNote.get(attachment.noteId) || 0) + 1);

  const linkedBadges = (note: SmartNote) => [
    note.linkedProjectName ? `Project: ${note.linkedProjectName}` : null,
    note.linkedCompanyName ? `Company: ${note.linkedCompanyName}` : null,
    note.linkedPersonName ? `Person: ${note.linkedPersonName}` : null,
    note.linkedRelationshipName ? `Relationship: ${note.linkedRelationshipName}` : null,
    note.linkedTaskTitle ? `Task: ${note.linkedTaskTitle}` : null,
    note.linkedStrategyGoalTitle ? `Goal: ${note.linkedStrategyGoalTitle}` : null,
    note.linkedPlanTitle ? `Plan: ${note.linkedPlanTitle}` : null,
  ].filter(Boolean) as string[];

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

  const noteView = viewMode === 'grid'
    ? 'grid gap-4 sm:grid-cols-2 xl:grid-cols-3'
    : 'space-y-3';

  return (
    <div className="space-y-4">
      <div className={cardClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Smart Notes OS</div>
            <h2 className="mt-2 text-2xl font-semibold text-[#0f172a]">Notes that feel like a living workspace</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">Capture ideas, link them to the rest of the OS, sort them fast, and open any note into a full-page editor when you need to write seriously.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={openCreateNote} className="rounded-full bg-[#2563eb] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1d4ed8]">
              + New Note
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-[#e5e7eb] bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="flex min-w-max items-center gap-2">
          {categoryMenu.map((category) => renderCategoryPill(category))}
          <button type="button" onClick={openCreateCategory} className={pillClass}>
            + Category
          </button>
        </div>
      </div>

      <div className={shellClass}>
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="min-w-[260px] flex-1">
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search notes, content, tags..." className="w-full rounded-md border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]" />
            </div>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a]">
              <option value="created_desc">Newest</option>
              <option value="created_asc">Oldest</option>
              <option value="updated_desc">Recently updated</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="priority">Priority</option>
            </select>
            <div className="flex rounded-full border border-[#e5e7eb] bg-white p-1">
              <button type="button" onClick={() => setViewMode('grid')} className={viewMode === 'grid' ? activePillClass : 'rounded-full px-3 py-1.5 text-sm text-[#0f172a]'}>
                Grid
              </button>
              <button type="button" onClick={() => setViewMode('list')} className={viewMode === 'list' ? activePillClass : 'rounded-full px-3 py-1.5 text-sm text-[#0f172a]'}>
                List
              </button>
            </div>
          </div>
          <button type="button" onClick={openCreateNote} className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">
            + New Note
          </button>
        </div>
      </div>

      <div className={noteView}>
        {filteredNotes.map((note) => {
          const blockCount = blockCountByNote.get(note.id) || 0;
          const attachmentCount = attachmentCountByNote.get(note.id) || 0;
          const badges = linkedBadges(note);
          const category = noteCategories.find((item) => item.id === note.categoryId) || categoryBySlug.get(note.categorySlug || '') || null;
          const active = note.id === selectedNoteId;

          const toggleStatus = async (event: React.MouseEvent) => {
            event.stopPropagation();
            await onUpdateSmartNote(note.id, { status: note.status === 'pinned' ? 'active' : 'pinned' });
          };

          const archiveNote = async (event: React.MouseEvent) => {
            event.stopPropagation();
            await onUpdateSmartNote(note.id, { status: 'archived' });
          };

          const deleteNote = async (event: React.MouseEvent) => {
            event.stopPropagation();
            await onDeleteSmartNote(note.id);
          };

          if (viewMode === 'list') {
            return (
              <button key={note.id} type="button" onClick={() => openNote(note)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-[#bfdbfe] bg-[#eff6ff]' : 'border-[#e5e7eb] bg-white hover:bg-[#f8fafc]'}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-[#0f172a]">{note.title}</h3>
                      <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1 text-xs text-[#475569]">{note.priority}</span>
                      <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1 text-xs text-[#475569]">{note.status}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-[#64748b]">{excerpt(note) || 'No content yet.'}</p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#64748b]">
                      {category ? <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-2 py-1 text-[#1d4ed8]">{category.name}</span> : null}
                      {note.tags ? note.tags.split(',').slice(0, 3).map((tag) => <span key={tag.trim()} className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">{tag.trim()}</span>) : null}
                      {badges.slice(0, 3).map((badge) => <span key={badge} className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">{badge}</span>)}
                      <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">{attachmentCount} attachment{attachmentCount === 1 ? '' : 's'}</span>
                      <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">{blockCount} block{blockCount === 1 ? '' : 's'}</span>
                      <span>{note.updatedAt || note.createdAt ? new Date(note.updatedAt || note.createdAt || '').toLocaleDateString() : 'New'}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    <button type="button" onClick={toggleStatus} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#0f172a] hover:bg-[#f8fafc]">{note.status === 'pinned' ? 'Unpin' : 'Pin'}</button>
                    <button type="button" onClick={archiveNote} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#0f172a] hover:bg-[#f8fafc]">Archive</button>
                    <button type="button" onClick={deleteNote} className="rounded-md border border-[#fee2e2] bg-[#fff1f2] px-3 py-1.5 text-xs text-[#b91c1c] hover:bg-[#fee2e2]">Delete</button>
                  </div>
                </div>
              </button>
            );
          }

          return (
            <button key={note.id} type="button" onClick={() => openNote(note)} className={`w-full rounded-2xl border p-4 text-left transition ${active ? 'border-[#bfdbfe] bg-[#eff6ff]' : 'border-[#e5e7eb] bg-white hover:bg-[#f8fafc]'}`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-base font-semibold text-[#0f172a]">{note.title}</h3>
                      <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1 text-xs text-[#475569]">{note.priority}</span>
                      <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1 text-xs text-[#475569]">{note.status}</span>
                    </div>
                    <p className="mt-2 text-sm text-[#64748b]">{excerpt(note) || 'No content yet.'}</p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-2">
                    <button type="button" onClick={toggleStatus} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#0f172a] hover:bg-[#f8fafc]">{note.status === 'pinned' ? 'Unpin' : 'Pin'}</button>
                    <button type="button" onClick={archiveNote} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#0f172a] hover:bg-[#f8fafc]">Archive</button>
                    <button type="button" onClick={deleteNote} className="rounded-md border border-[#fee2e2] bg-[#fff1f2] px-3 py-1.5 text-xs text-[#b91c1c] hover:bg-[#fee2e2]">Delete</button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[#64748b]">
                  {category ? <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-2 py-1 text-[#1d4ed8]">{category.name}</span> : null}
                  {note.tags ? note.tags.split(',').slice(0, 4).map((tag) => <span key={tag.trim()} className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">{tag.trim()}</span>) : null}
                  {badges.slice(0, 4).map((badge) => <span key={badge} className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">{badge}</span>)}
                </div>
                <div className="flex flex-wrap gap-2 text-xs text-[#64748b]">
                  <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">{attachmentCount} attachment{attachmentCount === 1 ? '' : 's'}</span>
                  <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">{blockCount} block{blockCount === 1 ? '' : 's'}</span>
                  <span>{note.updatedAt || note.createdAt ? new Date(note.updatedAt || note.createdAt || '').toLocaleDateString() : 'New'}</span>
                </div>
              </div>
            </button>
          );
        })}
        {filteredNotes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[#dbeafe] bg-[#f8fafc] p-8 text-sm text-[#64748b]">
            No notes found in {selectedCategoryName.toLowerCase()}. Try a different category or create a new note.
          </div>
        ) : null}
      </div>

      {categoryModalOpen ? (
        <OpportunityModal title="Add Category" onClose={() => setCategoryModalOpen(false)}>
          <NoteCategoryForm
            onSubmit={handleSubmitCategory}
            onCancel={() => setCategoryModalOpen(false)}
            submitLabel="Create Category"
          />
        </OpportunityModal>
      ) : null}
    </div>
  );
};

export default SmartNotesPanel;
