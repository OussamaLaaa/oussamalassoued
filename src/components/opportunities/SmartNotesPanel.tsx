import React, { useMemo, useState } from 'react';
import type {
  Company,
  NoteAttachment,
  NoteAttachmentInput,
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
import NoteAttachmentForm from './NoteAttachmentForm';
import NoteCategoryForm from './NoteCategoryForm';
import NoteWorkspace from './NoteWorkspace';
import SmartNoteForm from './SmartNoteForm';

const cardClass = 'rounded-2xl border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]';
const filterButton = 'rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#0f172a] hover:bg-[#f8fafc]';

const categoryKey = (category: NoteCategory) => category.slug || category.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

const SmartNotesPanel: React.FC<{
  noteCategories: NoteCategory[];
  smartNotes: SmartNote[];
  noteAttachments: NoteAttachment[];
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
}> = ({
  noteCategories,
  smartNotes,
  noteAttachments,
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
}) => {
  const [selectedCategorySlug, setSelectedCategorySlug] = useState('all');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryModal, setCategoryModal] = useState<{ mode: 'create' | 'edit'; item?: NoteCategory } | null>(null);
  const [noteModal, setNoteModal] = useState<{ mode: 'create' | 'edit'; item?: SmartNote } | null>(null);
  const [attachmentModal, setAttachmentModal] = useState<{ mode: 'create' | 'edit'; item?: NoteAttachment } | null>(null);

  const categoryBySlug = useMemo(() => new Map(noteCategories.map((category) => [categoryKey(category), category] as const)), [noteCategories]);
  const categoryCountBySlug = useMemo(() => {
    const counts = new Map<string, number>();
    for (const note of smartNotes) {
      const slug = note.categorySlug || categoryBySlug.get(note.categoryId || '')?.slug || 'uncategorized';
      counts.set(slug, (counts.get(slug) || 0) + 1);
    }
    return counts;
  }, [smartNotes, categoryBySlug]);

  const categories = useMemo(() => {
    const normalized = noteCategories
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((category) => ({
        ...category,
        slug: categoryKey(category),
        count: categoryCountBySlug.get(categoryKey(category)) || 0,
      }));

    return [
      { id: 'all', slug: 'all', name: 'All Notes', description: 'Everything captured in one place', color: '#2563eb', count: smartNotes.length, isActive: true },
      { id: 'uncategorized', slug: 'uncategorized', name: 'Uncategorized', description: 'Notes without a category', color: '#64748b', count: categoryCountBySlug.get('uncategorized') || 0, isActive: true },
      ...normalized,
    ];
  }, [noteCategories, categoryCountBySlug, smartNotes.length]);

  const selectedCategory = categories.find((category) => category.slug === selectedCategorySlug) || categories[0];

  const filteredNotes = useMemo(() => {
    return smartNotes.filter((note) => {
      const noteCategorySlug = note.categorySlug || categoryBySlug.get(note.categoryId || '')?.slug || 'uncategorized';
      const categoryMatches = selectedCategorySlug === 'all' || noteCategorySlug === selectedCategorySlug;
      const searchMatches = !searchQuery || [note.title, note.content || '', note.tags || '', note.source || '', note.notes || ''].join(' ').toLowerCase().includes(searchQuery.toLowerCase());
      const statusMatches = !statusFilter || note.status === statusFilter;
      const priorityMatches = !priorityFilter || note.priority === priorityFilter;
      return categoryMatches && searchMatches && statusMatches && priorityMatches;
    });
  }, [smartNotes, selectedCategorySlug, searchQuery, statusFilter, priorityFilter, categoryBySlug]);

  const selectedNote = useMemo(() => filteredNotes.find((note) => note.id === selectedNoteId) || smartNotes.find((note) => note.id === selectedNoteId) || null, [filteredNotes, selectedNoteId, smartNotes]);
  const selectedNoteAttachments = useMemo(() => noteAttachments.filter((attachment) => attachment.noteId === selectedNote?.id), [noteAttachments, selectedNote?.id]);

  const openCreateCategory = () => setCategoryModal({ mode: 'create' });
  const openEditCategory = (item: NoteCategory) => setCategoryModal({ mode: 'edit', item });
  const openCreateNote = () => setNoteModal({ mode: 'create', item: selectedCategorySlug !== 'all' && selectedCategorySlug !== 'uncategorized'
    ? { categorySlug: selectedCategorySlug, categoryId: categoryBySlug.get(selectedCategorySlug)?.id } as Partial<SmartNote>
    : undefined,
  });
  const openEditNote = (item: SmartNote) => setNoteModal({ mode: 'edit', item });
  const openCreateAttachment = (note?: SmartNote) => setAttachmentModal({ mode: 'create', item: note ? { noteId: note.id } as Partial<NoteAttachment> : undefined });
  const openEditAttachment = (item: NoteAttachment) => setAttachmentModal({ mode: 'edit', item });

  const handleSubmitCategory = async (input: NoteCategoryInput) => {
    if (categoryModal?.mode === 'edit' && categoryModal.item) {
      await onUpdateNoteCategory(categoryModal.item.id, input);
    } else {
      await onAddNoteCategory(input);
    }
    setCategoryModal(null);
  };

  const handleSubmitNote = async (input: SmartNoteInput) => {
    if (noteModal?.mode === 'edit' && noteModal.item) {
      await onUpdateSmartNote(noteModal.item.id, input);
    } else {
      await onAddSmartNote(input);
    }
    setNoteModal(null);
  };

  const handleSubmitAttachment = async (input: NoteAttachmentInput) => {
    if (attachmentModal?.mode === 'edit' && attachmentModal.item) {
      await onUpdateNoteAttachment(attachmentModal.item.id, input);
    } else {
      await onAddNoteAttachment(input);
    }
    setAttachmentModal(null);
  };

  const selectedCategoryNotes = filteredNotes.length;

  return (
    <div className="space-y-4">
      <div className={cardClass}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Smart Notes OS</div>
            <h2 className="mt-2 text-2xl font-semibold text-[#0f172a]">Memory layer for the Personal Work OS</h2>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">
              Capture context, link it to the rest of the workspace, and keep every note one click away from the projects, people, tasks, and plans it belongs to.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={openCreateCategory} className={filterButton}>
              New Category
            </button>
            <button type="button" onClick={openCreateNote} className="rounded-full bg-[#2563eb] px-4 py-1.5 text-sm font-medium text-white hover:bg-[#1d4ed8]">
              New Note
            </button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)_420px]">
        <aside className="space-y-4">
          <div className={cardClass}>
            <div className="space-y-3">
              <input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search notes, tags, sources..."
                className="w-full rounded-md border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-sm text-[#0f172a] outline-none focus:border-[#2563eb]"
              />
              <div className="grid grid-cols-2 gap-2">
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a]">
                  <option value="">All Statuses</option>
                  <option value="active">Active</option>
                  <option value="pinned">Pinned</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </select>
                <select value={priorityFilter} onChange={(event) => setPriorityFilter(event.target.value)} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a]">
                  <option value="">All Priorities</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Categories</div>
                <div className="mt-1 text-sm text-[#64748b]">{categories.length} views</div>
              </div>
              <button type="button" onClick={() => setSelectedCategorySlug('all')} className="text-xs text-[#2563eb] hover:underline">
                Reset
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {categories.map((category) => {
                const active = selectedCategorySlug === category.slug;
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => {
                      setSelectedCategorySlug(category.slug);
                      setSelectedNoteId(null);
                    }}
                    className={`w-full rounded-xl border px-3 py-3 text-left transition ${active ? 'border-[#bfdbfe] bg-[#eff6ff]' : 'border-[#e5e7eb] bg-white hover:bg-[#f8fafc]'}`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="text-sm font-medium text-[#0f172a]">{category.name}</div>
                        <div className="mt-1 text-xs text-[#64748b]">{category.description}</div>
                      </div>
                      <div className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1 text-xs text-[#475569]">{category.count}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className={cardClass}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Category Actions</div>
                <div className="mt-1 text-sm text-[#64748b]">Manage the note taxonomy</div>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={openCreateCategory} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">
                Add Category
              </button>
              {selectedCategorySlug !== 'all' && selectedCategorySlug !== 'uncategorized' && selectedCategory?.id ? (
                <>
                  <button type="button" onClick={() => openEditCategory(selectedCategory as NoteCategory)} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">
                    Edit Category
                  </button>
                  <button type="button" onClick={() => onDeleteNoteCategory(selectedCategory.id)} className="rounded-md border border-[#fee2e2] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c] hover:bg-[#fee2e2]">
                    Delete Category
                  </button>
                </>
              ) : null}
            </div>
          </div>
        </aside>

        <section className={cardClass}>
          <div className="flex items-center justify-between gap-3 border-b border-[#e5e7eb] pb-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">Notes</div>
              <h3 className="mt-1 text-xl font-semibold text-[#0f172a]">{selectedCategory?.name || 'All Notes'}</h3>
              <p className="mt-1 text-sm text-[#64748b]">{selectedCategoryNotes} matching note{selectedCategoryNotes === 1 ? '' : 's'}</p>
            </div>
            <button type="button" onClick={openCreateNote} className="rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">
              New Note
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {filteredNotes.length > 0 ? filteredNotes.map((note) => {
              const active = note.id === selectedNoteId;
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`w-full rounded-xl border p-4 text-left transition ${active ? 'border-[#bfdbfe] bg-[#eff6ff]' : 'border-[#e5e7eb] bg-white hover:bg-[#f8fafc]'}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-base font-medium text-[#0f172a]">{note.title}</div>
                      <div className="mt-1 line-clamp-2 text-sm text-[#64748b]">{note.content || 'No content yet.'}</div>
                    </div>
                    <div className="flex flex-wrap justify-end gap-2 text-xs">
                      <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1 text-[#475569]">{note.priority}</span>
                      <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1 text-[#475569]">{note.status}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-[#64748b]">
                    {note.categoryName ? <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-2 py-1 text-[#1d4ed8]">{note.categoryName}</span> : null}
                    {note.tags ? note.tags.split(',').slice(0, 3).map((tag) => {
                      const trimmed = tag.trim();
                      return trimmed ? <span key={trimmed} className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">{trimmed}</span> : null;
                    }) : null}
                  </div>
                </button>
              );
            }) : (
              <div className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f8fafc] px-4 py-6 text-sm text-[#64748b]">
                No notes match the current filters.
              </div>
            )}
          </div>
        </section>

        <section>
          <NoteWorkspace
            note={selectedNote}
            attachments={selectedNoteAttachments}
            onBack={() => setSelectedNoteId(null)}
            onEdit={(note) => setNoteModal({ mode: 'edit', item: note })}
            onDelete={async (id) => {
              await onDeleteSmartNote(id);
              setSelectedNoteId(null);
            }}
            onAddAttachment={(note) => openCreateAttachment(note)}
            onEditAttachment={(attachment) => setAttachmentModal({ mode: 'edit', item: attachment })}
            onDeleteAttachment={onDeleteNoteAttachment}
          />
        </section>
      </div>

      {categoryModal ? (
        <OpportunityModal title={categoryModal.mode === 'edit' ? 'Edit Category' : 'Add Category'} onClose={() => setCategoryModal(null)}>
          <NoteCategoryForm
            initialData={categoryModal.item}
            onSubmit={handleSubmitCategory}
            onCancel={() => setCategoryModal(null)}
            submitLabel={categoryModal.mode === 'edit' ? 'Save Changes' : 'Create Category'}
          />
        </OpportunityModal>
      ) : null}

      {noteModal ? (
        <OpportunityModal title={noteModal.mode === 'edit' ? 'Edit Note' : 'Add Note'} onClose={() => setNoteModal(null)}>
          <SmartNoteForm
            initialData={noteModal.item}
            categories={noteCategories}
            projects={projects}
            companies={companies}
            people={people}
            relationships={relationships}
            tasks={tasks}
            strategyGoals={strategyGoals}
            plans={plans}
            onSubmit={handleSubmitNote}
            onCancel={() => setNoteModal(null)}
            submitLabel={noteModal.mode === 'edit' ? 'Save Changes' : 'Create Note'}
          />
        </OpportunityModal>
      ) : null}

      {attachmentModal ? (
        <OpportunityModal title={attachmentModal.mode === 'edit' ? 'Edit Attachment' : 'Add Attachment'} onClose={() => setAttachmentModal(null)}>
          <NoteAttachmentForm
            initialData={attachmentModal.item}
            notes={smartNotes}
            onSubmit={handleSubmitAttachment}
            onCancel={() => setAttachmentModal(null)}
            submitLabel={attachmentModal.mode === 'edit' ? 'Save Changes' : 'Create Attachment'}
          />
        </OpportunityModal>
      ) : null}
    </div>
  );
};

export default SmartNotesPanel;
