import React, { useMemo, useState } from 'react';
import { Button, Badge } from '../ui';
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

const pillClass = 'rounded-full border border-neutral-200 bg-white px-3 py-1.5 text-sm text-black hover:bg-neutral-50';
const activePillClass = 'rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm text-blue-700';

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
        {category.name} <span className="ml-1 text-xs text-neutral-500">{category.count}</span>
      </button>
    );
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

  const formatNoteDate = (date?: string): string => {
    if (!date) return 'Created: —';
    try { return `Created: ${new Date(date).toLocaleDateString('en-CA')}`; }
    catch { return 'Created: —'; }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl min-w-0 break-words">
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">Smart Notes OS</div>
            <h2 className="mt-2 text-xl font-semibold leading-tight text-black sm:text-2xl">Notes that feel like a living workspace</h2>
            <p className="mt-2 max-w-2xl whitespace-normal break-words text-sm leading-relaxed text-neutral-500">
              Capture ideas, link them to the rest of the OS, and sort them fast.
              <br />
              Open any note into a full-page editor when you need to write seriously.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button type="button" variant="primary" size="sm" onClick={openCreateNote}>
              + New Note
            </Button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-neutral-200 bg-white p-3 shadow-sm">
        <div className="flex min-w-max items-center gap-2">
          {categoryMenu.map((category) => renderCategoryPill(category))}
          <Button type="button" variant="outline" size="sm" onClick={openCreateCategory}>
            + Category
          </Button>
        </div>
      </div>

      <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            <div className="min-w-[260px] flex-1">
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search notes, content, tags..." className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-black outline-none focus:border-neutral-300" />
            </div>
            <select value={sortBy} onChange={(event) => setSortBy(event.target.value as typeof sortBy)} className="rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-black">
              <option value="created_desc">Newest</option>
              <option value="created_asc">Oldest</option>
              <option value="updated_desc">Recently updated</option>
              <option value="name_asc">Name A-Z</option>
              <option value="name_desc">Name Z-A</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          <Button type="button" variant="primary" size="md" onClick={openCreateNote}>
            + New Note
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredNotes.map((note) => {
          const category = noteCategories.find((item) => item.id === note.categoryId) || categoryBySlug.get(note.categorySlug || '') || null;

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

          return (
            <div
              key={note.id}
              onClick={() => openNote(note)}
              className="group cursor-pointer rounded-xl border border-neutral-200 bg-white px-4 py-3 text-left transition hover:bg-neutral-50"
            >
              <div className="flex flex-col gap-2 xl:flex-row xl:items-start">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-black">{note.title}</h3>
                  <p className="mt-0.5 line-clamp-2 overflow-hidden break-words text-sm text-neutral-500">
                    {excerpt(note) || 'No content yet.'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-1.5 text-xs">
                  {category ? (
                    <Badge variant="blue">{category.name}</Badge>
                  ) : null}
                  <Badge variant="neutral">{note.priority}</Badge>
                  <Badge variant="neutral">{note.status}</Badge>
                  {note.tags
                    ? note.tags.split(',').slice(0, 2).map((tag) => (
                        <Badge key={tag.trim()} variant="neutral">{tag.trim()}</Badge>
                      ))
                    : null}
                </div>
                <div className="flex shrink-0 items-center gap-3 xl:flex-col xl:items-end xl:gap-1">
                  <span className="whitespace-nowrap text-xs text-neutral-500">{formatNoteDate(note.createdAt)}</span>
                  <div className="flex items-center gap-1">
                    <Button type="button" variant="ghost" size="sm" onClick={editNote}>Edit</Button>
                    <Button type="button" variant="ghost" size="sm" onClick={archiveNote}>Archive</Button>
                    <Button type="button" variant="danger" size="sm" onClick={deleteNote}>Delete</Button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredNotes.length === 0 ? (
          <div className="rounded-xl border border-dashed border-neutral-200 bg-neutral-50 p-6 text-sm text-neutral-500">
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
