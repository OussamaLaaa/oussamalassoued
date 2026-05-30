import type { NoteCategory, SmartNote, SmartNoteInput } from '../../types/opportunities';

export const fixedCategories = [
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

export const fixedCategorySlugSet = new Set(fixedCategories.map((item) => item.slug));
export const protectedCategorySlugSet = new Set(['all', 'uncategorized', ...fixedCategories.map((item) => item.slug)]);

export const categoryKey = (category: NoteCategory) => category.slug || category.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');

export const noteCategorySlug = (note: SmartNote, noteCategories: NoteCategory[]) => {
  const categoryById = new Map(noteCategories.map((category) => [category.id, category] as const));
  return categoryById.get(note.categoryId || '')?.slug || note.categorySlug || 'uncategorized';
};

export const buildDraft = (selectedCategorySlug: string, noteCategories: NoteCategory[]): Partial<SmartNoteInput> => {
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

export type NoteCategorySidebarItem = {
  id: string;
  categoryId?: string;
  slug: string;
  name: string;
  count: number;
  isProtected?: boolean;
};

export const buildNoteCategoryMenu = (noteCategories: NoteCategory[], smartNotes: SmartNote[]): NoteCategorySidebarItem[] => {
  const customCategories = noteCategories
    .filter((category) => !fixedCategorySlugSet.has(categoryKey(category)))
    .slice()
    .sort((a, b) => a.name.localeCompare(b.name));

  return [
    { id: 'all', slug: 'all', name: 'All', count: smartNotes.length, isProtected: true },
    ...fixedCategories.map((item) => ({
      id: item.slug,
      slug: item.slug,
      name: item.label,
      count: smartNotes.filter((note) => noteCategorySlug(note, noteCategories) === item.slug).length,
      isProtected: true,
    })),
    ...customCategories.map((category) => ({
      id: categoryKey(category),
      categoryId: category.id,
      slug: categoryKey(category),
      name: category.name,
      count: smartNotes.filter((note) => noteCategorySlug(note, noteCategories) === categoryKey(category)).length,
    })),
    { id: 'uncategorized', slug: 'uncategorized', name: 'Uncategorized', count: smartNotes.filter((note) => noteCategorySlug(note, noteCategories) === 'uncategorized').length, isProtected: true },
  ];
};