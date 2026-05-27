import React, { useMemo, useState } from 'react';
import type { Company, Person } from '../../types/opportunities';

const baseInput = 'w-full rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none';

interface Props {
  company: Company;
  people: Person[];
  onSelect: (person: Person) => Promise<void>;
  onCancel: () => void;
}

const LinkExistingPersonDialog: React.FC<Props> = ({ company, people, onSelect, onCancel }) => {
  const [query, setQuery] = useState('');
  const [error, setError] = useState('');
  const [savingPersonId, setSavingPersonId] = useState<string | null>(null);

  const filteredPeople = useMemo(() => {
    const search = query.trim().toLowerCase();
    return people.filter((person) => {
      if (String(person.companyId || '') === String(company.id)) return false;
      if (!search) return true;
      return [person.fullName, person.role, person.department, person.seniority, person.companyName]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [company.id, people, query]);

  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <label className="text-sm font-medium text-neutral-900">Search existing people</label>
        <input
          className={baseInput}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Name, role, department, company"
        />
      </div>

      <div className="max-h-[420px] space-y-2 overflow-y-auto pr-1">
        {filteredPeople.length === 0 ? (
          <div className="rounded-xl border border-neutral-200 bg-white p-4 text-sm text-neutral-600">
            No matching people found.
          </div>
        ) : (
          filteredPeople.map((person) => (
            <button
              key={person.id}
              type="button"
              className="w-full rounded-xl border border-neutral-200 bg-white p-3 text-left hover:bg-neutral-50"
              onClick={async () => {
                setError('');
                setSavingPersonId(person.id);
                try {
                  await onSelect(person);
                } catch (err: any) {
                  setError(err?.message || 'Unable to link person.');
                } finally {
                  setSavingPersonId(null);
                }
              }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-medium text-neutral-900">{person.fullName}</div>
                  <div className="mt-1 text-xs text-neutral-600">
                    {[person.role, person.department, person.seniority].filter(Boolean).join(' · ') || 'No role details'}
                  </div>
                  <div className="mt-1 text-xs text-neutral-500">
                    {person.companyName ? `Current company: ${person.companyName}` : 'No company'}
                  </div>
                </div>
                <span className="rounded-full border border-neutral-200 px-2 py-1 text-xs text-neutral-700">
                  {savingPersonId === person.id ? 'Linking...' : 'Link'}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      {error ? <div className="rounded-xl border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-800">{error}</div> : null}

      <div className="flex items-center justify-end">
        <button type="button" onClick={onCancel} className="rounded-xl border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-900 hover:bg-neutral-50">
          Close
        </button>
      </div>
    </div>
  );
};

export default LinkExistingPersonDialog;
