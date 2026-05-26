import React, { useState } from 'react';
import type {
  Company, Person, OutreachMessage, Deal,
  CompanyContactMethod, CompanyContactMethodInput,
  CompanyProblemProfile, CompanyProblemProfileInput,
  CompanyOutreachScript, CompanyOutreachScriptInput,
} from '../../types/opportunities';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import StatCard from '../ui/StatCard';
import EmptyState from '../ui/EmptyState';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';

interface Props {
  companyId: string;
  companies: Company[];
  people: Person[];
  messages: OutreachMessage[];
  deals: Deal[];
  companyContactMethods: CompanyContactMethod[];
  companyProblemProfiles: CompanyProblemProfile[];
  companyOutreachScripts: CompanyOutreachScript[];
  onBack: () => void;
  onEditCompany: (company: Company) => void;
  onAIScoreCompany: (company: Company) => void;
  addCompanyContactMethod: (input: CompanyContactMethodInput) => Promise<CompanyContactMethod>;
  updateCompanyContactMethod: (id: string, input: Partial<CompanyContactMethodInput>) => Promise<CompanyContactMethod>;
  deleteCompanyContactMethod: (id: string) => Promise<void>;
  addCompanyProblemProfile: (input: CompanyProblemProfileInput) => Promise<CompanyProblemProfile>;
  updateCompanyProblemProfile: (id: string, input: Partial<CompanyProblemProfileInput>) => Promise<CompanyProblemProfile>;
  deleteCompanyProblemProfile: (id: string) => Promise<void>;
  addCompanyOutreachScript: (input: CompanyOutreachScriptInput) => Promise<CompanyOutreachScript>;
  updateCompanyOutreachScript: (id: string, input: Partial<CompanyOutreachScriptInput>) => Promise<CompanyOutreachScript>;
  deleteCompanyOutreachScript: (id: string) => Promise<void>;
  addPerson: (input: any) => Promise<Person>;
  updatePerson: (id: string, input: any) => Promise<Person>;
  deletePerson: (id: string) => Promise<void>;
  addMessage: (input: any) => Promise<OutreachMessage>;
  updateMessage: (id: string, input: any) => Promise<OutreachMessage>;
  deleteMessage: (id: string) => Promise<void>;
  addDeal: (input: any) => Promise<Deal>;
  updateDeal: (id: string, input: any) => Promise<Deal>;
  deleteDeal: (id: string) => Promise<void>;
  updateCompany: (id: string, input: any) => Promise<Company>;
  deleteCompany: (id: string) => Promise<void>;
}

type WorkspaceTab = 'overview' | 'contact_methods' | 'people' | 'problem' | 'outreach_script' | 'messages' | 'deals' | 'notes';

const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'contact_methods', label: 'Contact Methods' },
  { id: 'people', label: 'People' },
  { id: 'problem', label: 'Problem / Opportunity' },
  { id: 'outreach_script', label: 'Outreach Script' },
  { id: 'messages', label: 'Messages' },
  { id: 'deals', label: 'Deals' },
  { id: 'notes', label: 'Notes' },
];

const DATABASE_TYPE_LABELS: Record<string, string> = {
  big_company: 'Big Company',
  sme: 'SME',
  freelance: 'Freelance',
};

const ETHICAL_LABELS: Record<string, string> = {
  good: 'Good',
  neutral: 'Neutral',
  needs_review: 'Needs Review',
  avoid: 'Avoid',
};

const URGENCY_LABELS: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

const CHANNEL_LABELS: Record<string, string> = {
  email: 'Email',
  phone: 'Phone',
  linkedin: 'LinkedIn',
  whatsapp: 'WhatsApp',
  twitter: 'Twitter',
  other: 'Other',
};

const NOTABLE_VALUE = (v: any) => v ?? '—';

const CompanyWorkspace: React.FC<Props> = ({
  companyId, companies, people, messages, deals,
  companyContactMethods, companyProblemProfiles, companyOutreachScripts,
  onBack, onEditCompany, onAIScoreCompany,
  addCompanyContactMethod, updateCompanyContactMethod, deleteCompanyContactMethod,
  addCompanyProblemProfile, updateCompanyProblemProfile, deleteCompanyProblemProfile,
  addCompanyOutreachScript, updateCompanyOutreachScript, deleteCompanyOutreachScript,
  addPerson, updatePerson, deletePerson,
  addMessage, updateMessage, deleteMessage,
  addDeal, updateDeal, deleteDeal,
  updateCompany, deleteCompany,
}) => {
  const [tab, setTab] = useState<WorkspaceTab>('overview');
  const [notesDraft, setNotesDraft] = useState('');
  const [notesSaving, setNotesSaving] = useState(false);

  const company = companies.find((c) => c.id === companyId);

  if (!company) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onBack}>← Back to CRM</Button>
        <EmptyState title="Company not found." description="The company you are looking for does not exist." />
      </div>
    );
  }

  // Derived data
  const companyPeople = people.filter((p) => p.companyId === company.id);
  const companyMessages = messages.filter((m) => m.companyId === company.id);
  const companyDeals = deals.filter((d) => d.companyId === company.id);
  const openDeals = companyDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // silently fail
    }
  };

  const handleSaveNotes = async () => {
    if (!company) return;
    setNotesSaving(true);
    try {
      await updateCompany(company.id, { notes: notesDraft });
    } finally {
      setNotesSaving(false);
    }
  };

  const handleSetPrimaryContactMethod = async (method: CompanyContactMethod) => {
    await updateCompanyContactMethod(method.id, {
      companyId: method.companyId,
      isPrimary: true,
    });
    for (const other of companyContactMethods.filter((m) => m.companyId === company.id && m.id !== method.id && m.isPrimary)) {
      await updateCompanyContactMethod(other.id, {
        companyId: other.companyId,
        isPrimary: false,
      });
    }
  };

  const handleEditContactMethod = async (method: CompanyContactMethod) => {
    const label = window.prompt('Label:', method.label || '');
    if (label === null) return;
    const value = window.prompt('Value:', method.value || '');
    if (value === null) return;
    const type = window.prompt('Type (email/phone/linkedin/whatsapp/twitter/other):', method.type || 'other');
    if (type === null) return;
    await updateCompanyContactMethod(method.id, { companyId: method.companyId, label, value, type, isPrimary: method.isPrimary });
  };

  const handleDeleteContactMethod = async (id: string) => {
    const ok = window.confirm('Delete this contact method?');
    if (!ok) return;
    await deleteCompanyContactMethod(id);
  };

  const handleAddContactMethod = async () => {
    const type = window.prompt('Type (email/phone/linkedin/whatsapp/twitter/other):', 'email');
    if (!type) return;
    const label = window.prompt('Label (e.g. Work Email):');
    if (label === null) return;
    const value = window.prompt('Value:');
    if (!value) return;
    await addCompanyContactMethod({ companyId: company.id, type, label: label || undefined, value, isPrimary: false });
  };

  const handleAddProblemProfile = async () => {
    const title = window.prompt('Problem title:');
    if (!title) return;
    const desc = window.prompt('Problem description:');
    if (desc === null) return;
    await addCompanyProblemProfile({ companyId: company.id, problemTitle: title, problemDescription: desc || undefined });
  };

  const handleEditProblemProfile = async (profile: CompanyProblemProfile) => {
    const title = window.prompt('Problem title:', profile.problemTitle || '');
    if (!title) return;
    const desc = window.prompt('Problem description:', profile.problemDescription || '');
    if (desc === null) return;
    await updateCompanyProblemProfile(profile.id, {
      companyId: profile.companyId,
      problemTitle: title,
      problemDescription: desc || undefined,
      urgency: profile.urgency,
      confidence: profile.confidence,
      status: profile.status,
    });
  };

  const handleAddOutreachScript = async () => {
    const name = window.prompt('Script name:');
    if (!name) return;
    await addCompanyOutreachScript({ companyId: company.id, name });
  };

  const handleCopyScript = async (field: string | undefined) => {
    if (field) await handleCopyToClipboard(field);
  };

  const handleMarkActive = async (script: CompanyOutreachScript) => {
    await updateCompanyOutreachScript(script.id, {
      companyId: script.companyId,
      isActive: !script.isActive,
    });
  };

  const handleAddPerson = () => {
    addPerson({ companyId: company.id, fullName: '' });
  };

  const handleLogMessage = (personId?: string) => {
    addMessage({ companyId: company.id, personId: personId || '', channel: 'Email', messageType: 'outreach' });
  };

  const handleAddDeal = () => {
    addDeal({ companyId: company.id, servicePackage: '' });
  };

  const tabContent = () => {
    switch (tab) {
      case 'overview':
        return (
          <div className="space-y-6">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Company Details</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="text-neutral-500">Name</div>
                <div className="text-neutral-900 font-medium">{company.name}</div>
                <div className="text-neutral-500">Database Type</div>
                <div className="text-neutral-900">{DATABASE_TYPE_LABELS[normalizeDatabaseType(company.databaseType)] || company.databaseType || '—'}</div>
                <div className="text-neutral-500">Category</div>
                <div className="text-neutral-900">{company.category || '—'}</div>
                <div className="text-neutral-500">Industry</div>
                <div className="text-neutral-900">{company.industry || '—'}</div>
                <div className="text-neutral-500">Country</div>
                <div className="text-neutral-900">{company.country || '—'}</div>
                <div className="text-neutral-500">City</div>
                <div className="text-neutral-900">{company.city || '—'}</div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">Web Presence</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="text-neutral-500">Website</div>
                <div className="text-neutral-900 break-words">{company.website || '—'}</div>
                <div className="text-neutral-500">LinkedIn</div>
                <div className="text-neutral-900 break-words">{company.linkedin || '—'}</div>
              </div>
            </div>

            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <h3 className="mb-3 text-sm font-semibold text-neutral-900">CRM Status</h3>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
                <div className="text-neutral-500">Priority</div>
                <div className="text-neutral-900"><PriorityBadge priority={company.priority} /></div>
                <div className="text-neutral-500">Fit Score</div>
                <div className="text-neutral-900 font-medium">{typeof company.fitScore === 'number' ? company.fitScore : '—'}</div>
                <div className="text-neutral-500">Ethical Fit</div>
                <div className="text-neutral-900"><Badge variant="neutral">{ETHICAL_LABELS[company.ethicalFit || ''] || company.ethicalFit || '—'}</Badge></div>
                <div className="text-neutral-500">Status</div>
                <div className="text-neutral-900"><StatusBadge status={company.status} /></div>
                <div className="text-neutral-500">Next Action</div>
                <div className="text-neutral-900">{company.nextAction || '—'}</div>
              </div>
            </div>

            {company.notes && (
              <div className="rounded-xl border border-neutral-200 bg-white p-4">
                <h3 className="mb-3 text-sm font-semibold text-neutral-900">Notes</h3>
                <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words">{company.notes}</p>
              </div>
            )}
          </div>
        );

      case 'contact_methods': {
        const methods = companyContactMethods.filter((m) => m.companyId === company.id);
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={handleAddContactMethod}>Add Contact Method</Button>
            </div>
            {methods.length === 0 ? (
              <EmptyState
                title="No company contact methods yet."
                description="Add email, phone, website, LinkedIn, WhatsApp, or another channel."
              />
            ) : (
              <div className="space-y-2">
                {methods.map((method) => (
                  <div key={method.id} className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-white p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-neutral-900">{NOTABLE_VALUE(method.label)}</span>
                        <Badge variant="neutral">{CHANNEL_LABELS[method.type] || method.type}</Badge>
                        {method.isPrimary && <Badge variant="blue">Primary</Badge>}
                      </div>
                      <div className="mt-0.5 text-sm text-neutral-700 break-words">{method.value}</div>
                      {method.notes && <div className="mt-1 text-xs text-neutral-500">{method.notes}</div>}
                    </div>
                    <div className="flex shrink-0 gap-1">
                      {!method.isPrimary && (
                        <Button variant="ghost" size="sm" onClick={() => handleSetPrimaryContactMethod(method)} className="text-neutral-600">Set Primary</Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => handleEditContactMethod(method)} className="text-neutral-600">Edit</Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteContactMethod(method.id)} className="text-neutral-600">Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'people': {
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={handleAddPerson}>Add Person</Button>
            </div>
            {companyPeople.length === 0 ? (
              <EmptyState
                title="No people linked to this company yet."
                description="Add decision makers, influencers, or relevant contacts."
              />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                      <th className="px-3 py-2 font-medium">Name</th>
                      <th className="px-3 py-2 font-medium">Role</th>
                      <th className="px-3 py-2 font-medium">Department</th>
                      <th className="px-3 py-2 font-medium">Decision Power</th>
                      <th className="px-3 py-2 font-medium">Influence</th>
                      <th className="px-3 py-2 font-medium">Status</th>
                      <th className="px-3 py-2 font-medium">Next Follow-up</th>
                      <th className="px-3 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyPeople.map((person) => (
                      <tr key={person.id} className="border-b border-neutral-100 text-sm">
                        <td className="px-3 py-3 font-medium text-neutral-900">{person.fullName}</td>
                        <td className="px-3 py-3 text-neutral-700">{person.role || '—'}</td>
                        <td className="px-3 py-3 text-neutral-700">{person.department || '—'}</td>
                        <td className="px-3 py-3 text-neutral-700">{person.decisionPower || '—'}</td>
                        <td className="px-3 py-3 text-neutral-700">{person.influencePower || '—'}</td>
                        <td className="px-3 py-3"><StatusBadge status={person.relationshipStatus} /></td>
                        <td className="px-3 py-3 text-neutral-700">{person.nextFollowUpDate || '—'}</td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => updatePerson(person.id, person)} className="text-neutral-600">Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => handleLogMessage(person.id)} className="text-neutral-600">Message</Button>
                            <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Delete this person?')) deletePerson(person.id); }} className="text-neutral-600">Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );
      }

      case 'problem': {
        const profiles = companyProblemProfiles.filter((p) => p.companyId === company.id);
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={handleAddProblemProfile}>Add Problem Profile</Button>
            </div>
            {profiles.length === 0 ? (
              <EmptyState
                title="No problem profile yet."
                description="Define what problem you can solve before outreach."
              />
            ) : (
              <div className="space-y-3">
                {profiles.map((profile) => (
                  <div key={profile.id} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-neutral-900">{profile.problemTitle || 'Untitled'}</h4>
                        <div className="mt-1 flex flex-wrap gap-2">
                          <Badge variant="neutral">Urgency: {URGENCY_LABELS[profile.urgency] || profile.urgency}</Badge>
                          <Badge variant="neutral">Confidence: {profile.confidence || '—'}</Badge>
                          <StatusBadge status={profile.status} />
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleEditProblemProfile(profile)} className="text-neutral-600">Edit</Button>
                    </div>

                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-xs font-medium text-neutral-500">Problem Description</p>
                        <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{profile.problemDescription || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500">Current Situation</p>
                        <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{profile.currentSituation || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500">Business Impact</p>
                        <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{profile.businessImpact || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500">Proposed Solution</p>
                        <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{profile.proposedSolution || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500">Service Angle</p>
                        <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{profile.serviceAngle || '—'}</p>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-neutral-500">Value Proposition</p>
                        <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{profile.valueProposition || '—'}</p>
                      </div>
                    </div>

                    {profile.notes && (
                      <div>
                        <p className="text-xs font-medium text-neutral-500">Notes</p>
                        <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{profile.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'outreach_script': {
        const scripts = companyOutreachScripts.filter((s) => s.companyId === company.id);
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={handleAddOutreachScript}>Add Outreach Script</Button>
            </div>
            {scripts.length === 0 ? (
              <EmptyState
                title="No outreach script yet."
                description="Prepare what to send or say before contacting this company."
              />
            ) : (
              <div className="space-y-3">
                {scripts.map((script) => (
                  <div key={script.id} className="rounded-xl border border-neutral-200 bg-white p-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-semibold text-neutral-900">{script.name}</h4>
                          <Badge variant="neutral">{CHANNEL_LABELS[script.channel] || script.channel}</Badge>
                          <Badge variant="neutral">{script.language}</Badge>
                          {script.isActive && <Badge variant="blue">Active</Badge>}
                          <StatusBadge status={script.status} />
                        </div>
                        {script.audience && <p className="mt-1 text-xs text-neutral-500">Audience: {script.audience}</p>}
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <Button variant="ghost" size="sm" onClick={() => handleMarkActive(script)} className="text-neutral-600">{script.isActive ? 'Deactivate' : 'Activate'}</Button>
                        <Button variant="ghost" size="sm" onClick={() => {
                          const name = window.prompt('Name:', script.name);
                          if (!name) return;
                          const channel = window.prompt('Channel (email/phone/linkedin):', script.channel);
                          if (!channel) return;
                          updateCompanyOutreachScript(script.id, { companyId: script.companyId, name, channel });
                        }} className="text-neutral-600">Edit</Button>
                        <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Delete this script?')) deleteCompanyOutreachScript(script.id); }} className="text-neutral-600">Delete</Button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {script.goal && (
                        <div>
                          <p className="text-xs font-medium text-neutral-500">Goal</p>
                          <p className="mt-1 text-sm text-neutral-700">{script.goal}</p>
                        </div>
                      )}
                      {script.hook && (
                        <div>
                          <p className="text-xs font-medium text-neutral-500">Hook</p>
                          <p className="mt-1 text-sm text-neutral-700">{script.hook}</p>
                        </div>
                      )}
                      {script.messageBody && (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-neutral-500">Message Body</p>
                            <Button variant="ghost" size="sm" onClick={() => handleCopyScript(script.messageBody)} className="text-neutral-500 text-xs">Copy</Button>
                          </div>
                          <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{script.messageBody}</p>
                        </div>
                      )}
                      {script.callScript && (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-neutral-500">Call Script</p>
                            <Button variant="ghost" size="sm" onClick={() => handleCopyScript(script.callScript)} className="text-neutral-500 text-xs">Copy</Button>
                          </div>
                          <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{script.callScript}</p>
                        </div>
                      )}
                      {script.objectionHandling && (
                        <div>
                          <p className="text-xs font-medium text-neutral-500">Objection Handling</p>
                          <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{script.objectionHandling}</p>
                        </div>
                      )}
                      {script.followUpMessage && (
                        <div>
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-neutral-500">Follow-up Message</p>
                            <Button variant="ghost" size="sm" onClick={() => handleCopyScript(script.followUpMessage)} className="text-neutral-500 text-xs">Copy</Button>
                          </div>
                          <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{script.followUpMessage}</p>
                        </div>
                      )}
                    </div>

                    {script.notes && (
                      <div>
                        <p className="text-xs font-medium text-neutral-500">Notes</p>
                        <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap">{script.notes}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'messages':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={() => handleLogMessage()}>Log Message</Button>
            </div>
            {companyMessages.length === 0 ? (
              <EmptyState title="No messages logged for this company yet." description="Start logging outreach messages." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                      <th className="px-3 py-2 font-medium">Date</th>
                      <th className="px-3 py-2 font-medium">Person</th>
                      <th className="px-3 py-2 font-medium">Channel</th>
                      <th className="px-3 py-2 font-medium">Type</th>
                      <th className="px-3 py-2 font-medium">Reply Status</th>
                      <th className="px-3 py-2 font-medium">Follow-up</th>
                      <th className="px-3 py-2 font-medium">Summary</th>
                      <th className="px-3 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyMessages.map((msg) => {
                      const person = people.find((p) => p.id === msg.personId);
                      return (
                        <tr key={msg.id} className="border-b border-neutral-100 text-sm">
                          <td className="px-3 py-3 text-neutral-700">{msg.date || msg.createdAt || '—'}</td>
                          <td className="px-3 py-3 text-neutral-900">{person?.fullName || '—'}</td>
                          <td className="px-3 py-3"><Badge variant="neutral">{msg.channel || '—'}</Badge></td>
                          <td className="px-3 py-3 text-neutral-700">{msg.messageType || '—'}</td>
                          <td className="px-3 py-3"><StatusBadge status={msg.replyStatus} /></td>
                          <td className="px-3 py-3 text-neutral-700">{msg.nextFollowUpDate || '—'}</td>
                          <td className="px-3 py-3 text-neutral-700 max-w-[200px] truncate">{msg.summary || '—'}</td>
                          <td className="px-3 py-3">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="sm" onClick={() => updateMessage(msg.id, msg)} className="text-neutral-600">Edit</Button>
                              <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Delete this message?')) deleteMessage(msg.id); }} className="text-neutral-600">Delete</Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'deals':
        return (
          <div className="space-y-4">
            <div className="flex justify-end">
              <Button variant="primary" size="sm" onClick={handleAddDeal}>Add Deal</Button>
            </div>
            {companyDeals.length === 0 ? (
              <EmptyState title="No deals linked to this company yet." description="Add a deal to track progress." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                      <th className="px-3 py-2 font-medium">Service Package</th>
                      <th className="px-3 py-2 font-medium">Stage</th>
                      <th className="px-3 py-2 font-medium">Probability</th>
                      <th className="px-3 py-2 font-medium">Value</th>
                      <th className="px-3 py-2 font-medium">Problem</th>
                      <th className="px-3 py-2 font-medium">Next Action</th>
                      <th className="px-3 py-2 text-right font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyDeals.map((deal) => (
                      <tr key={deal.id} className="border-b border-neutral-100 text-sm">
                        <td className="px-3 py-3 font-medium text-neutral-900">{deal.servicePackage || '—'}</td>
                        <td className="px-3 py-3"><StatusBadge status={deal.stage as string} /></td>
                        <td className="px-3 py-3 text-neutral-700">{typeof deal.probability === 'number' ? `${deal.probability}%` : '—'}</td>
                        <td className="px-3 py-3 text-neutral-700">{deal.value ? `${deal.currency || '$'}${deal.value}` : '—'}</td>
                        <td className="px-3 py-3 text-neutral-700 max-w-[200px] truncate">{deal.problem || '—'}</td>
                        <td className="px-3 py-3 text-neutral-700">{deal.nextAction || '—'}</td>
                        <td className="px-3 py-3">
                          <div className="flex justify-end gap-1">
                            <Button variant="ghost" size="sm" onClick={() => updateDeal(deal.id, deal)} className="text-neutral-600">Edit</Button>
                            <Button variant="ghost" size="sm" onClick={() => { if (window.confirm('Delete this deal?')) deleteDeal(deal.id); }} className="text-neutral-600">Delete</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        );

      case 'notes':
        return (
          <div className="space-y-4">
            <div className="rounded-xl border border-neutral-200 bg-white p-4">
              <textarea
                className="w-full min-h-[200px] rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-900 resize-y focus:outline-none focus:ring-1 focus:ring-neutral-400"
                value={notesDraft}
                onChange={(e) => setNotesDraft(e.target.value)}
                placeholder="Write notes about this company..."
              />
              <div className="mt-3 flex justify-end">
                <Button variant="primary" size="sm" onClick={handleSaveNotes} disabled={notesSaving}>
                  {notesSaving ? 'Saving...' : 'Save Notes'}
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const stageLabel = (stage?: string) => {
    if (!stage) return '—';
    return stage.replace(/_/g, ' ');
  };

  const normalizeDatabaseType = (dbType?: string): string => {
    if (!dbType) return '';
    const val = dbType.toLowerCase().replace(/\s+/g, '_');
    if (val.includes('big') || val === 'big_company') return 'big_company';
    if (val.includes('sme') || val === 'sme') return 'sme';
    if (val.includes('freelance') || val === 'freelance') return 'freelance';
    return val;
  };

  const ethicalFitColor = (ethicalFit?: string) => {
    if (ethicalFit === 'good') return 'success';
    if (ethicalFit === 'neutral') return 'neutral';
    if (ethicalFit === 'needs_review') return 'warning';
    if (ethicalFit === 'avoid') return 'danger';
    return 'neutral';
  };

  const handleDeleteAndBack = async (id: string) => {
    const ok = window.confirm(`Delete "${company.name}"? This cannot be undone.`);
    if (!ok) return;
    await deleteCompany(id);
    onBack();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <Button variant="ghost" size="sm" onClick={onBack} className="mb-2 -ml-2 text-neutral-600">← Back to CRM</Button>
          <h2 className="text-2xl font-semibold text-black break-words">{company.name}</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge variant="neutral">{DATABASE_TYPE_LABELS[normalizeDatabaseType(company.databaseType)] || company.databaseType || '—'}</Badge>
            <PriorityBadge priority={company.priority} />
            <Badge variant={ethicalFitColor(company.ethicalFit) as any}>{ETHICAL_LABELS[company.ethicalFit || ''] || company.ethicalFit || '—'}</Badge>
            <StatusBadge status={company.status} />
            {typeof company.fitScore === 'number' && <Badge variant="neutral">Fit: {company.fitScore}</Badge>}
          </div>
          <div className="mt-1 text-xs text-neutral-500">
            {[company.website, company.linkedin].filter(Boolean).join(' · ') || '—'}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button variant="primary" size="sm" onClick={() => onEditCompany(company)}>Edit Company</Button>
          <Button variant="secondary" size="sm" onClick={() => onAIScoreCompany(company)}>AI Score</Button>
          <Button variant="secondary" size="sm" onClick={() => handleAddPerson()}>Add Person</Button>
          <Button variant="secondary" size="sm" onClick={() => handleAddContactMethod()}>Add Contact</Button>
          <Button variant="secondary" size="sm" onClick={() => handleAddProblemProfile()}>Add Problem</Button>
          <Button variant="secondary" size="sm" onClick={() => handleAddOutreachScript()}>Add Script</Button>
          <Button variant="danger" size="sm" onClick={() => handleDeleteAndBack(company.id)}>Delete</Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Fit Score" value={typeof company.fitScore === 'number' ? company.fitScore : '—'} />
        <StatCard label="Priority" value={company.priority || '—'} />
        <StatCard label="People" value={companyPeople.length} />
        <StatCard label="Messages" value={companyMessages.length} />
        <StatCard label="Open Deals" value={openDeals.length} />
        <StatCard label="Next Action" value={company.nextAction || '—'} hint={company.nextActionDate || undefined} />
      </div>

      {/* Tabs */}
      <div className="overflow-x-auto">
        <div className="flex gap-0 border-b border-neutral-200 min-w-max">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                tab === t.id
                  ? 'border-neutral-900 text-neutral-900'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {tabContent()}
    </div>
  );
};

export default CompanyWorkspace;
