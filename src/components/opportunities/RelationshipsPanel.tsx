import React, { useEffect, useMemo, useState } from 'react';
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

const badgeClass = (kind?: string) => {
  const value = String(kind || '').toLowerCase();
  if (['strong', 'high', 'active', 'warm'].includes(value)) return 'border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]';
  if (['medium', 'unknown', 'paused'].includes(value)) return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';
  if (['weak', 'low', 'cold'].includes(value)) return 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]';
  if (['avoid', 'archived'].includes(value)) return 'border-[#fecaca] bg-[#fef2f2] text-[#b91c1c]';
  return 'border-[#dbeafe] bg-[#eff6ff] text-[#1d4ed8]';
};

const todayKey = () => new Date().toISOString().slice(0, 10);
const isFollowUpDue = (relationship: Relationship) => Boolean(relationship.nextContactDate && relationship.nextContactDate.slice(0, 10) <= todayKey() && !['avoid', 'archived'].includes(String(relationship.status || '').toLowerCase()));

const categoryKey = (category: RelationshipCategory) => category.slug || category.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
const categoryNameFromSlug = (categories: RelationshipCategory[], slug: string) => categories.find((category) => categoryKey(category) === slug)?.name || slug;

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
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [selectedRelationshipId, setSelectedRelationshipId] = useState<string | null>(null);
  const [editingRelationship, setEditingRelationship] = useState<Relationship | null>(null);
  const [editingCategory, setEditingCategory] = useState<RelationshipCategory | null>(null);
  const [isAddingRelationship, setIsAddingRelationship] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [strengthFilter, setStrengthFilter] = useState('');
  const [trustFilter, setTrustFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [followUpFilter, setFollowUpFilter] = useState('');

  const categoryBySlug = useMemo(() => new Map(relationshipCategories.map((category) => [categoryKey(category), category] as const)), [relationshipCategories]);
  const peopleById = useMemo(() => new Map(people.map((person) => [person.id, person] as const)), [people]);
  const companyById = useMemo(() => new Map(companies.map((company) => [company.id, company] as const)), [companies]);
  const relationshipById = useMemo(() => new Map(relationships.map((relationship) => [relationship.id, relationship] as const)), [relationships]);

  const categoryDashboardItems = useMemo(() => {
    const allCategories = relationshipCategories.length > 0
      ? relationshipCategories
      : [
          { id: 'founders', name: 'Founders', slug: 'founders', description: 'Founders and startup operators', color: '#2563eb' },
          { id: 'clients', name: 'Clients', slug: 'clients', description: 'Current and former clients', color: '#0f766e' },
          { id: 'recruiters', name: 'Recruiters', slug: 'recruiters', description: 'Hiring and talent contacts', color: '#7c3aed' },
          { id: 'designers', name: 'Designers', slug: 'designers', description: 'Design peers and collaborators', color: '#db2777' },
          { id: 'mentors', name: 'Mentors', slug: 'mentors', description: 'Advisors and guides', color: '#ea580c' },
          { id: 'other', name: 'Other', slug: 'other', description: 'Unsorted relationships', color: '#64748b' },
        ];

    return allCategories.map((category) => {
      const slug = categoryKey(category);
      const count = relationships.filter((relationship) => (relationship.domain || 'other') === slug).length;
      return { ...category, slug, count };
    });
  }, [relationshipCategories, relationships]);

  const selectedCategory = selectedCategorySlug ? categoryBySlug.get(selectedCategorySlug) || null : null;

  const selectedCategoryRelationships = useMemo(() => {
    if (!selectedCategorySlug) return [];
    return relationships.filter((relationship) => {
      const relationshipSlug = relationship.domain || 'other';
      const categoryMatches = relationshipSlug === selectedCategorySlug || (!relationship.domain && selectedCategorySlug === 'other');
      const searchMatches = !searchQuery || [relationship.displayName, relationship.personName || '', relationship.notes || '', relationship.nextAction || ''].join(' ').toLowerCase().includes(searchQuery.toLowerCase());
      const strengthMatches = !strengthFilter || relationship.relationshipStrength === strengthFilter;
      const trustMatches = !trustFilter || relationship.trustLevel === trustFilter;
      const statusMatches = !statusFilter || relationship.status === statusFilter;
      const followUpMatches = !followUpFilter || (followUpFilter === 'due' ? isFollowUpDue(relationship) : true);
      return categoryMatches && searchMatches && strengthMatches && trustMatches && statusMatches && followUpMatches;
    });
  }, [relationships, selectedCategorySlug, searchQuery, strengthFilter, trustFilter, statusFilter, followUpFilter]);

  const selectedRelationship = useMemo(
    () => relationships.find((relationship) => relationship.id === selectedRelationshipId) || null,
    [relationships, selectedRelationshipId],
  );

  useEffect(() => {
    if (!selectedRelationshipId) return;
    const exists = relationships.some((relationship) => relationship.id === selectedRelationshipId);
    if (!exists) setSelectedRelationshipId(null);
  }, [relationships, selectedRelationshipId]);

  const openCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    setSelectedRelationshipId(null);
    setSearchQuery('');
    setStrengthFilter('');
    setTrustFilter('');
    setStatusFilter('');
    setFollowUpFilter('');
  };

  const closeToDashboard = () => {
    setSelectedCategorySlug(null);
    setSelectedRelationshipId(null);
  };

  const closeToCategoryList = () => {
    setSelectedRelationshipId(null);
  };

  const handleEditRelationship = (relationship: Relationship) => {
    setEditingRelationship(relationship);
    setIsAddingRelationship(false);
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

  const handleAddRelationshipFromCategory = () => {
    setEditingRelationship(null);
    setIsAddingRelationship(true);
  };

  const dashboardCard = 'rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)]';
  const primaryButton = 'rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]';
  const secondaryButton = 'rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]';
  const chipButton = 'rounded-full border border-[#e5e7eb] bg-white px-3 py-1.5 text-sm text-[#0f172a] hover:bg-[#f8fafc]';

  const selectedCategoryCounts = {
    total: selectedCategoryRelationships.length,
    strong: selectedCategoryRelationships.filter((relationship) => relationship.relationshipStrength === 'strong').length,
    due: selectedCategoryRelationships.filter(isFollowUpDue).length,
    friction: selectedCategoryRelationships.filter((relationship) => Boolean(String(relationship.problems || '').trim() || String(relationship.riskNotes || '').trim())).length,
  };

  const renderCategoryDashboard = () => (
    <div className="space-y-4">
      <div className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold text-[#0f172a]">Relationships</h2>
            <p className="mt-1 text-sm text-[#64748b]">A personal CRM workspace for people, categories, follow-ups, and exchange.</p>
          </div>
          <button type="button" className={primaryButton} onClick={() => { setEditingCategory(null); setIsAddingCategory(true); }}>Add Category</button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {categoryDashboardItems.map((category) => (
          <button
            key={category.slug}
            type="button"
            className={`${dashboardCard} cursor-pointer text-left transition hover:-translate-y-0.5 hover:border-[#93c5fd] hover:shadow-[0_12px_28px_rgba(37,99,235,0.08)]`}
            onClick={() => openCategory(category.slug)}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-lg font-semibold text-[#0f172a]">{category.name}</div>
                <div className="mt-1 text-sm text-[#64748b]">{category.description || 'Relationship category'}</div>
              </div>
              <span className="rounded-full border px-2 py-1 text-xs text-[#0f172a]" style={{ borderColor: category.color || '#dbeafe' }}>{category.count}</span>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <span className={`rounded-full border px-2 py-1 text-xs ${badgeClass('active')}`}>Open category</span>
              <button type="button" className={chipButton} onClick={(event) => { event.stopPropagation(); openCategory(category.slug); }}>Open Category</button>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  const renderCategoryList = () => (
    <div className="space-y-4">
      <div className={dashboardCard}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <button type="button" className={secondaryButton} onClick={closeToDashboard}>Back to Categories</button>
            <h2 className="mt-3 text-2xl font-semibold text-[#0f172a]">{selectedCategory?.name || categoryNameFromSlug(relationshipCategories, selectedCategorySlug || 'other')}</h2>
            <p className="mt-1 text-sm text-[#64748b]">{selectedCategoryRelationships.length} relationships in this category.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primaryButton} onClick={handleAddRelationshipFromCategory}>Add Relationship</button>
            <button type="button" className={secondaryButton} onClick={() => setIsAddingCategory(true)}>Edit Categories</button>
          </div>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]" placeholder="Search relationships" />
          <select value={strengthFilter} onChange={(event) => setStrengthFilter(event.target.value)} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
            <option value="">All strengths</option>
            <option value="weak">Weak</option>
            <option value="medium">Medium</option>
            <option value="strong">Strong</option>
          </select>
          <select value={trustFilter} onChange={(event) => setTrustFilter(event.target.value)} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
            <option value="">All trust levels</option>
            <option value="unknown">Unknown</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="warm">Warm</option>
            <option value="cold">Cold</option>
            <option value="paused">Paused</option>
            <option value="avoid">Avoid</option>
            <option value="archived">Archived</option>
          </select>
          <select value={followUpFilter} onChange={(event) => setFollowUpFilter(event.target.value)} className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a]">
            <option value="">All follow-up states</option>
            <option value="due">Follow-up due</option>
          </select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Relationships</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{selectedCategoryCounts.total}</div></div>
        <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Strong</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{selectedCategoryCounts.strong}</div></div>
        <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Follow-ups Due</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{selectedCategoryCounts.due}</div></div>
        <div className={dashboardCard}><div className="text-xs uppercase tracking-[0.14em] text-[#64748b]">Friction</div><div className="mt-2 text-3xl font-semibold text-[#0f172a]">{selectedCategoryCounts.friction}</div></div>
      </div>

      <div className="space-y-3">
        {selectedCategoryRelationships.length > 0 ? selectedCategoryRelationships.map((relationship) => {
          const personName = relationship.personName || (relationship.personId ? peopleById.get(relationship.personId)?.fullName : null);
          const companyName = relationship.personId ? peopleById.get(relationship.personId)?.companyName : null;
          return (
            <div
              key={relationship.id}
              className="rounded-xl border border-[#e5e7eb] bg-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.05)] transition hover:border-[#93c5fd]"
              role="button"
              tabIndex={0}
              onClick={() => setSelectedRelationshipId(relationship.id)}
              onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') setSelectedRelationshipId(relationship.id); }}
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold text-[#0f172a]">{relationship.displayName}</div>
                  <div className="mt-1 text-sm text-[#64748b]">{personName || 'No linked person'}{companyName ? ` · ${companyName}` : ''}</div>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-medium">
                  <span className={`rounded-full border px-2.5 py-1 ${badgeClass(relationship.relationshipStrength)}`}>{relationship.relationshipStrength || '—'}</span>
                  <span className={`rounded-full border px-2.5 py-1 ${badgeClass(relationship.trustLevel)}`}>{relationship.trustLevel || '—'}</span>
                  <span className={`rounded-full border px-2.5 py-1 ${badgeClass(relationship.status)}`}>{relationship.status || '—'}</span>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-2 text-xs text-[#334155]">
                  <span className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2 py-1">Last {relationship.lastContactDate ? relationship.lastContactDate.slice(0, 10) : '—'}</span>
                  <span className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2 py-1">Next {relationship.nextContactDate ? relationship.nextContactDate.slice(0, 10) : '—'}</span>
                  {relationship.nextAction ? <span className="rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-2 py-1">{relationship.nextAction}</span> : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button type="button" className={secondaryButton} onClick={(event) => { event.stopPropagation(); setSelectedRelationshipId(relationship.id); }}>Open Dashboard</button>
                  <button type="button" className={secondaryButton} onClick={(event) => { event.stopPropagation(); handleEditRelationship(relationship); }}>Edit</button>
                  <button type="button" className={secondaryButton} onClick={async (event) => { event.stopPropagation(); await onDeleteRelationship(relationship.id); }}>Delete</button>
                  <button type="button" className={secondaryButton} onClick={async (event) => {
                    event.stopPropagation();
                    await onAddRelationshipInteraction({
                      relationshipId: relationship.id,
                      interactionDate: todayKey(),
                      channel: 'other',
                      type: 'follow_up',
                      summary: relationship.nextAction || 'Followed up',
                      nextAction: relationship.nextAction,
                    });
                  }}>Add Interaction</button>
                  <button type="button" className={secondaryButton} onClick={async (event) => {
                    event.stopPropagation();
                    await onUpdateRelationship(relationship.id, { lastContactDate: todayKey() });
                  }}>Mark Followed Up</button>
                </div>
              </div>
            </div>
          );
        }) : (
          <div className="rounded-xl border border-dashed border-[#cbd5e1] bg-white p-6 text-sm text-[#64748b]">No relationships found in this category.</div>
        )}
      </div>
    </div>
  );

  const renderWorkspace = () => {
    if (!selectedRelationship) return null;
    return (
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
        onBack={() => {
          if (selectedCategorySlug) {
            setSelectedRelationshipId(null);
          } else {
            closeToDashboard();
          }
        }}
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
    );
  };

  return (
    <section className="space-y-4">
      {selectedRelationshipId ? renderWorkspace() : selectedCategorySlug ? renderCategoryList() : renderCategoryDashboard()}

      {isAddingRelationship || editingRelationship ? (
        <OpportunityModal title={editingRelationship ? 'Edit Relationship' : 'Add Relationship'} onClose={() => { setEditingRelationship(null); setIsAddingRelationship(false); }}>
          <RelationshipForm
            people={people}
            categories={relationshipCategories}
            initialData={editingRelationship ? { ...editingRelationship, domain: selectedCategorySlug || editingRelationship.domain } : { domain: selectedCategorySlug || undefined }}
            submitLabel={editingRelationship ? 'Update Relationship' : 'Create Relationship'}
            onSubmit={async (input) => {
              const nextInput = selectedCategorySlug && !editingRelationship ? { ...input, domain: selectedCategorySlug as RelationshipInput['domain'] } : input;
              await handleSubmitRelationship(nextInput);
              setIsAddingRelationship(false);
              setEditingRelationship(null);
            }}
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
