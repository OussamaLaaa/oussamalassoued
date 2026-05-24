import React, { useMemo, useState } from 'react';
import type {
  Company,
  Person,
  Project,
  Relationship,
  RelationshipCategory,
  RelationshipCategoryInput,
  RelationshipContactMethod,
  RelationshipContactMethodInput,
  RelationshipInteraction,
  RelationshipInteractionInput,
  RelationshipOpportunity,
  RelationshipOpportunityInput,
  RelationshipInput,
} from '../../types/opportunities';
import OpportunityModal from './OpportunityModal';
import RelationshipCategoryForm from './RelationshipCategoryForm';
import RelationshipForm from './RelationshipForm';
import RelationshipWorkspace from './RelationshipWorkspace';

const VIEW_TABS = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'categories', label: 'Categories' },
  { id: 'relationships', label: 'Relationships' },
  { id: 'workspace', label: 'Workspace' },
] as const;

const badgeClass = (kind?: string) => {
  const value = String(kind || '').toLowerCase();
  if (['strong', 'high', 'active', 'warm'].includes(value)) return 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]';
  if (['medium', 'unknown', 'paused'].includes(value)) return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';
  if (['weak', 'low', 'cold'].includes(value)) return 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]';
  if (['avoid', 'archived'].includes(value)) return 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]';
  return 'border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]';
};

const defaultCategoryId = 'all';

const RelationshipsPanel: React.FC<{
  relationships: Relationship[];
  relationshipInteractions: RelationshipInteraction[];
  relationshipOpportunities: RelationshipOpportunity[];
  relationshipCategories: RelationshipCategory[];
  relationshipContactMethods: RelationshipContactMethod[];
  people: Person[];
  companies: Company[];
  projects: Project[];
  onAddRelationship: (input: RelationshipInput) => Promise<any>;
  onUpdateRelationship: (id: string, input: Partial<RelationshipInput>) => Promise<any>;
  onDeleteRelationship: (id: string) => Promise<any>;
  onAddRelationshipInteraction: (input: RelationshipInteractionInput) => Promise<any>;
  onUpdateRelationshipInteraction: (id: string, input: Partial<RelationshipInteractionInput>) => Promise<any>;
  onDeleteRelationshipInteraction: (id: string) => Promise<any>;
  onAddRelationshipOpportunity: (input: RelationshipOpportunityInput) => Promise<any>;
  onUpdateRelationshipOpportunity: (id: string, input: Partial<RelationshipOpportunityInput>) => Promise<any>;
  onDeleteRelationshipOpportunity: (id: string) => Promise<any>;
  onAddRelationshipCategory: (input: RelationshipCategoryInput) => Promise<any>;
  onUpdateRelationshipCategory: (id: string, input: Partial<RelationshipCategoryInput>) => Promise<any>;
  onDeleteRelationshipCategory: (id: string) => Promise<any>;
  onAddRelationshipContactMethod: (input: RelationshipContactMethodInput) => Promise<any>;
  onUpdateRelationshipContactMethod: (id: string, input: Partial<RelationshipContactMethodInput>) => Promise<any>;
  onDeleteRelationshipContactMethod: (id: string) => Promise<any>;
}> = ({
  relationships,
  relationshipInteractions,
  relationshipOpportunities,
  relationshipCategories,
  relationshipContactMethods,
  people,
  companies,
  projects,
  onAddRelationship,
  onUpdateRelationship,
  onDeleteRelationship,
  onAddRelationshipInteraction,
  onUpdateRelationshipInteraction,
  onDeleteRelationshipInteraction,
  onAddRelationshipOpportunity,
  onUpdateRelationshipOpportunity,
  onDeleteRelationshipOpportunity,
  onAddRelationshipCategory,
  onUpdateRelationshipCategory,
  onDeleteRelationshipCategory,
  onAddRelationshipContactMethod,
  onUpdateRelationshipContactMethod,
  onDeleteRelationshipContactMethod,
}) => {
  const [activeView, setActiveView] = useState<typeof VIEW_TABS[number]['id']>('dashboard');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>(defaultCategoryId);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(relationships[0]?.id || null);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [editingCategory, setEditingCategory] = useState<RelationshipCategory | null>(null);
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);

  const peopleById = useMemo(() => new Map(people.map((person) => [person.id, person] as const)), [people]);
  const categoryById = useMemo(() => new Map(relationshipCategories.map((category) => [category.id, category] as const)), [relationshipCategories]);

  const relationshipsByCategory = useMemo(() => {
    const grouped = new Map<string, Relationship[]>();
    grouped.set(defaultCategoryId, relationships.filter((relationship) => !relationship.categoryId));
    relationshipCategories.forEach((category) => grouped.set(category.id, relationships.filter((relationship) => relationship.categoryId === category.id)));
    return grouped;
  }, [relationships, relationshipCategories]);

  const selectedCategoryRelationships = selectedCategoryId === defaultCategoryId
    ? relationships.filter((relationship) => !relationship.categoryId)
    : relationships.filter((relationship) => relationship.categoryId === selectedCategoryId);

  const selectedRelationship = useMemo(
    () => relationships.find((relationship) => relationship.id === selectedRelationshipId) || null,
    [relationships, selectedRelationshipId],
  );

  const selectedRelationshipCategory = selectedRelationship?.categoryId ? categoryById.get(selectedRelationship.categoryId) || null : null;
  const strongCount = relationships.filter((relationship) => relationship.relationshipStrength === 'strong').length;
  const dueCount = relationships.filter((relationship) => {
    if (!relationship.nextContactDate) return false;
    return relationship.nextContactDate.slice(0, 10) <= new Date().toISOString().slice(0, 10);
  }).length;
  const contactMethodCount = relationshipContactMethods.length;
  const openOpportunityCount = relationshipOpportunities.filter((item) => !['archived', 'lost'].includes(String(item.status || '').toLowerCase())).length;

  const dashboardCategories = useMemo(() => {
    const withCounts = relationshipCategories.map((category) => ({
      category,
      count: relationshipsByCategory.get(category.id)?.length || 0,
    }));
    return [
      { id: defaultCategoryId, name: 'Uncategorized', description: 'Relationships without a category', count: relationshipsByCategory.get(defaultCategoryId)?.length || 0, color: '#2563eb' },
      ...withCounts.map(({ category, count }) => ({ id: category.id, name: category.name, description: category.description || 'Relationship category', count, color: category.color || '#2563eb' })),
    ];
  }, [relationshipCategories, relationshipsByCategory]);

  const handleOpenRelationship = (relationshipId: string) => {
    setSelectedRelationshipId(relationshipId);
    setActiveView('workspace');
  };

  const handleSubmitRelationship = async (input: RelationshipInput) => {
    if (editingRelationship) {
      await onUpdateRelationship(editingRelationship.id, input);
    } else {
      await onAddRelationship(input);
    }
    setEditingRelationship(null);
    setIsAddingRelationship(false);
  };

  const handleSubmitCategory = async (input: RelationshipCategoryInput) => {
    if (editingCategory) {
      await onUpdateRelationshipCategory(editingCategory.id, input);
    } else {
      await onAddRelationshipCategory(input);
    }
    setEditingCategory(null);
    setIsAddingCategory(false);
  };

  const dashboardCard = 'rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]';
  const primaryButton = 'rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]';
  const tableButton = 'rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#0f172a] hover:bg-[#f8fafc]';

  const relationshipsView = activeView === 'relationships' || activeView === 'workspace';

  return (
    <section className="space-y-4">
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#0f172a]">Relationships OS</h2>
            <p className="mt-1 text-sm text-[#64748b]">A personal CRM workspace for categories, contact methods, and follow-through.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryButton} onClick={() => { setEditingRelationship(null); setIsAddingRelationship(true); }}>Add Relationship</button>
            <button type="button" className={tableButton} onClick={() => { setEditingCategory(null); setIsAddingCategory(true); }}>Add Category</button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 border-t border-[#e5e7eb] pt-4">
          {VIEW_TABS.map((view) => (
            <button
              key={view.id}
              type="button"
              onClick={() => setActiveView(view.id)}
              className={`rounded-full px-3 py-1.5 text-sm transition-colors ${activeView === view.id ? 'bg-[#eff6ff] text-[#1d4ed8]' : 'bg-[#f8fafc] text-[#475569] hover:bg-[#eef2ff]'}`}
            >
              {view.label}
            </button>
          ))}
        </div>
      </div>

      {activeView === 'dashboard' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Relationships</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{relationships.length}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Strong</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{strongCount}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Follow-ups Due</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{dueCount}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Contact Methods</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{contactMethodCount}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Open Opportunities</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{openOpportunityCount}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Categories</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{relationshipCategories.length}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Uncategorized</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{relationshipsByCategory.get(defaultCategoryId)?.length || 0}</div></div>
          <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">People linked</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{relationships.filter((relationship) => relationship.personId).length}</div></div>
        </div>
      ) : null}

      {activeView === 'categories' ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {dashboardCategories.map((category) => (
            <button key={category.id} type="button" onClick={() => setSelectedCategoryId(category.id)} className={`${dashboardCard} text-left transition hover:border-[#93c5fd]`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-[#0f172a]">{category.name}</div>
                  <div className="mt-1 text-sm text-[#64748b]">{category.description}</div>
                </div>
                <span className="rounded-full border px-2 py-1 text-xs text-[#334155]" style={{ borderColor: category.color || '#dbeafe' }}>{category.count}</span>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className={`rounded-full border px-2 py-1 text-xs ${badgeClass(category.id === defaultCategoryId ? 'medium' : 'active')}`}>{category.id === defaultCategoryId ? 'Default bucket' : 'Category'}</span>
              </div>
            </button>
          ))}
        </div>
      ) : null}

      {relationshipsView ? (
        <div className="grid gap-4 xl:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4">
            <div className={dashboardCard}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Category Focus</div>
                  <div className="mt-1 text-lg font-semibold text-[#0f172a]">{selectedCategoryId === defaultCategoryId ? 'Uncategorized' : categoryById.get(selectedCategoryId)?.name || 'Selected category'}</div>
                </div>
                <button type="button" className={tableButton} onClick={() => setActiveView('categories')}>Switch</button>
              </div>
              <div className="mt-3 text-sm text-[#64748b]">{selectedCategoryRelationships.length} relationships in this view. {selectedRelationshipCategory ? `Selected: ${selectedRelationshipCategory.name}.` : ''}</div>
            </div>

            <div className={dashboardCard}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#0f172a]">Relationships</h3>
                  <p className="mt-1 text-sm text-[#64748b]">Pick a person to open the workspace.</p>
                </div>
                <button type="button" className={tableButton} onClick={() => { setEditingRelationship(null); setIsAddingRelationship(true); }}>New</button>
              </div>
              <div className="mt-4 space-y-2">
                {(selectedCategoryRelationships.length > 0 ? selectedCategoryRelationships : relationships).map((relationship) => {
                  const personName = relationship.personName || (relationship.personId ? peopleById.get(relationship.personId)?.fullName : null);
                  const categoryName = relationship.categoryName || (relationship.categoryId ? categoryById.get(relationship.categoryId)?.name : 'Uncategorized');
                  return (
                    <button key={relationship.id} type="button" onClick={() => handleOpenRelationship(relationship.id)} className={`w-full rounded-lg border px-3 py-3 text-left transition hover:border-[#93c5fd] ${selectedRelationshipId === relationship.id ? 'border-[#93c5fd] bg-[#eff6ff]' : 'border-[#e5e7eb] bg-white'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="text-sm font-medium text-[#0f172a]">{relationship.displayName}</div>
                          <div className="mt-1 text-xs text-[#64748b]">{personName || 'No linked person'}</div>
                        </div>
                        <span className={`rounded-full border px-2 py-1 text-[11px] ${badgeClass(relationship.status)}`}>{relationship.status || 'open'}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className={`rounded-full border px-2 py-1 ${badgeClass(relationship.relationshipStrength)}`}>{relationship.relationshipStrength || '—'}</span>
                        <span className={`rounded-full border px-2 py-1 ${badgeClass(relationship.trustLevel)}`}>{relationship.trustLevel || '—'}</span>
                        <span className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2 py-1 text-[#334155]">{categoryName}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div>
            {selectedRelationship ? (
              <RelationshipWorkspace
                relationships={relationships}
                relationshipInteractions={relationshipInteractions}
                relationshipOpportunities={relationshipOpportunities}
                relationshipCategories={relationshipCategories}
                relationshipContactMethods={relationshipContactMethods}
                people={people}
                projects={projects}
                companies={companies}
                selectedRelationshipId={selectedRelationship.id}
                onBack={() => setActiveView('relationships')}
                onEditRelationship={(relationship) => setEditingRelationship(relationship)}
                onUpdateRelationship={onUpdateRelationship}
                onDeleteRelationship={onDeleteRelationship}
                onAddRelationshipInteraction={onAddRelationshipInteraction}
                onUpdateRelationshipInteraction={onUpdateRelationshipInteraction}
                onDeleteRelationshipInteraction={onDeleteRelationshipInteraction}
                onAddRelationshipOpportunity={onAddRelationshipOpportunity}
                onUpdateRelationshipOpportunity={onUpdateRelationshipOpportunity}
                onDeleteRelationshipOpportunity={onDeleteRelationshipOpportunity}
                onAddRelationshipContactMethod={onAddRelationshipContactMethod}
                onUpdateRelationshipContactMethod={onUpdateRelationshipContactMethod}
                onDeleteRelationshipContactMethod={onDeleteRelationshipContactMethod}
              />
            ) : (
              <div className={dashboardCard}>
                <div className="text-sm text-[#64748b]">Select a relationship to open its workspace.</div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {isAddingRelationship || editingRelationship ? (
        <OpportunityModal title={editingRelationship ? 'Edit Relationship' : 'Add Relationship'} onClose={() => { setEditingRelationship(null); setIsAddingRelationship(false); }}>
          <RelationshipForm
            people={people}
            categories={relationshipCategories}
            initialData={editingRelationship || undefined}
            submitLabel={editingRelationship ? 'Update Relationship' : 'Create Relationship'}
            onSubmit={handleSubmitRelationship}
            onCancel={() => { setEditingRelationship(null); setIsAddingRelationship(false); }}
          />
        </OpportunityModal>
      ) : null}

      {isAddingCategory || editingCategory ? (
        <OpportunityModal title={editingCategory ? 'Edit Category' : 'Add Category'} onClose={() => { setEditingCategory(null); setIsAddingCategory(false); }}>
          <RelationshipCategoryForm
            initialData={editingCategory || undefined}
            submitLabel={editingCategory ? 'Update Category' : 'Create Category'}
            onSubmit={handleSubmitCategory}
            onCancel={() => { setEditingCategory(null); setIsAddingCategory(false); }}
          />
        </OpportunityModal>
      ) : null}
    </section>
  );
};

export default RelationshipsPanel;
