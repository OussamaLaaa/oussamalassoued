import React, { useEffect, useState } from 'react';
import type {
 Company, Person, OutreachMessage, Deal,
 CompanyContactMethod, CompanyContactMethodInput,
 CompanyProblemProfile, CompanyProblemProfileInput,
 CompanyOutreachScript, CompanyOutreachScriptInput,
 PersonInput, MessageInput, DealInput,
 PersonContactMethod, PersonContactMethodInput,
} from '../../types/opportunities';
import { ArrowLeft } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import EmptyState from '../ui/EmptyState';
import StatusBadge from './StatusBadge';
import PriorityBadge from './PriorityBadge';
import OpportunityModal from './OpportunityModal';
import AddPersonForm from './AddPersonForm';
import LogMessageForm from './LogMessageForm';
import AddDealForm from './AddDealForm';
import CompanyContactMethodForm from './CompanyContactMethodForm';
import CompanyOutreachScriptForm from './CompanyOutreachScriptForm';
import PersonWorkspace from './PersonWorkspace';
import LinkExistingPersonDialog from './LinkExistingPersonDialog';
import { ContactLink, getContactHref } from './contactHelpers';

interface Props {
 companyId: string;
 companies: Company[];
 people: Person[];
 messages: OutreachMessage[];
 deals: Deal[];
 companyContactMethods: CompanyContactMethod[];
 personContactMethods?: PersonContactMethod[];
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
 addPerson: (input: PersonInput) => Promise<Person>;
 updatePerson: (id: string, input: Partial<PersonInput>) => Promise<Person>;
 deletePerson: (id: string) => Promise<void>;
 addPersonContactMethod: (input: PersonContactMethodInput) => Promise<PersonContactMethod>;
 updatePersonContactMethod: (id: string, input: Partial<PersonContactMethodInput>) => Promise<PersonContactMethod>;
 deletePersonContactMethod: (id: string) => Promise<void>;
 addMessage: (input: MessageInput) => Promise<OutreachMessage>;
 updateMessage: (id: string, input: Partial<MessageInput>) => Promise<OutreachMessage>;
 deleteMessage: (id: string) => Promise<void>;
 addDeal: (input: DealInput) => Promise<Deal>;
 updateDeal: (id: string, input: Partial<DealInput>) => Promise<Deal>;
 deleteDeal: (id: string) => Promise<void>;
 updateCompany: (id: string, input: any) => Promise<Company>;
 deleteCompany: (id: string) => Promise<void>;
}

type WorkspaceTab = 'overview' | 'contact_methods' | 'people' | 'outreach_script' | 'notes';

const TABS: { id: WorkspaceTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'contact_methods', label: 'Contact Methods' },
  { id: 'people', label: 'People' },
  { id: 'outreach_script', label: 'Outreach Script' },
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
  website: 'Website',
  other: 'Other',
};

const NICHE_LABELS: Record<string, string> = {
  saas: 'SaaS',
  b2b_services: 'B2B Services',
  healthtech: 'HealthTech',
  edtech: 'EdTech',
  marketplace: 'Marketplace',
  ecommerce: 'E-Commerce',
  startup: 'Startup',
  commercial: 'Commercial',
  agency: 'Agency',
  other: 'Other',
};

const toPersonInput = (person: Person, overrides: Partial<PersonInput> = {}): PersonInput => ({
 companyId: overrides.companyId !== undefined ? overrides.companyId : person.companyId,
 fullName: overrides.fullName ?? person.fullName,
 role: overrides.role !== undefined ? overrides.role : person.role,
 department: overrides.department !== undefined ? overrides.department : person.department,
 seniority: overrides.seniority !== undefined ? overrides.seniority : person.seniority,
 decisionPower: overrides.decisionPower !== undefined ? overrides.decisionPower : (person.decisionPower ? String(person.decisionPower) as PersonInput['decisionPower'] : undefined),
 influencePower: overrides.influencePower !== undefined ? overrides.influencePower : (person.influencePower ? String(person.influencePower) as PersonInput['influencePower'] : undefined),
 relevance: overrides.relevance !== undefined ? overrides.relevance : (person.relevance ? String(person.relevance) as PersonInput['relevance'] : undefined),
 linkedin: overrides.linkedin !== undefined ? overrides.linkedin : person.linkedin,
 emailPublic: overrides.emailPublic !== undefined ? overrides.emailPublic : person.emailPublic,
 contactChannel: overrides.contactChannel !== undefined ? overrides.contactChannel : person.contactChannel,
 relationshipStatus: overrides.relationshipStatus !== undefined ? overrides.relationshipStatus : person.relationshipStatus,
 nextFollowUpDate: overrides.nextFollowUpDate !== undefined ? overrides.nextFollowUpDate : person.nextFollowUpDate,
 notes: overrides.notes !== undefined ? overrides.notes : person.notes,
});

const CompanyWorkspace: React.FC<Props> = ({
 companyId,
 companies,
 people,
 messages,
 deals,
 companyContactMethods,
 personContactMethods = [],
  companyOutreachScripts,
  onBack,
  onEditCompany,
  addCompanyContactMethod,
  updateCompanyContactMethod,
  deleteCompanyContactMethod,
 addCompanyOutreachScript,
 updateCompanyOutreachScript,
 deleteCompanyOutreachScript,
 addPerson,
 updatePerson,
 deletePerson,
 addPersonContactMethod,
 updatePersonContactMethod,
 deletePersonContactMethod,
 addMessage,
 updateMessage,
 deleteMessage,
 addDeal,
 updateDeal,
 deleteDeal,
 updateCompany,
 deleteCompany,
}) => {
 const [tab, setTab] = useState<WorkspaceTab>('overview');
 const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
 const [notesDraft, setNotesDraft] = useState('');
 const [notesSaving, setNotesSaving] = useState(false);
 const [notesSaved, setNotesSaved] = useState(false);

 // Modal state
 const [showPersonForm, setShowPersonForm] = useState(false);
 const [editingPerson, setEditingPerson] = useState<Person | null>(null);

 const [showMessageForm, setShowMessageForm] = useState(false);
 const [editingMessage, setEditingMessage] = useState<OutreachMessage | null>(null);
 const [messagePersonId, setMessagePersonId] = useState<string | undefined>(undefined);

 const [showDealForm, setShowDealForm] = useState(false);
 const [editingDeal, setEditingDeal] = useState<Deal | null>(null);
 const [dealPersonId, setDealPersonId] = useState<string | undefined>(undefined);

 const [showContactMethodForm, setShowContactMethodForm] = useState(false);
 const [editingContactMethod, setEditingContactMethod] = useState<CompanyContactMethod | null>(null);

  const [showOutreachScriptForm, setShowOutreachScriptForm] = useState(false);
 const [editingOutreachScript, setEditingOutreachScript] = useState<CompanyOutreachScript | null>(null);

 const [showPersonChoiceModal, setShowPersonChoiceModal] = useState(false);
 const [showLinkExistingPersonDialog, setShowLinkExistingPersonDialog] = useState(false);
 const [personWorkspaceActionPersonId, setPersonWorkspaceActionPersonId] = useState<string | null>(null);

 const [formSaving, setFormSaving] = useState(false);
 const [formError, setFormError] = useState<string | null>(null);
 const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
 const [showDeleteModal, setShowDeleteModal] = useState(false);

 const safeCompanies = companies ?? [];
 const safePeople = people ?? [];
 const safeMessages = messages ?? [];
 const safeDeals = deals ?? [];
 const safeCompanyContactMethods = companyContactMethods ?? [];
 const safePersonContactMethods = personContactMethods ?? [];
  const safeCompanyOutreachScripts = companyOutreachScripts ?? [];

 if (import.meta.env.DEV) {
 if (typeof safePersonContactMethods === 'undefined') {
 console.error('[CompanyWorkspace] safePersonContactMethods is undefined');
 }
 console.log('[CompanyWorkspace] person contact methods count', safePersonContactMethods.length);
 }

 const company = safeCompanies.find((c) => c.id === companyId);

  useEffect(() => {
  if (!import.meta.env.DEV || !company) return;

  const contactMethodsForCompany = safeCompanyContactMethods.filter((item) => String(item.companyId) === String(company.id));
  const outreachScriptsForCompany = safeCompanyOutreachScripts.filter((item) => String(item.companyId) === String(company.id));

  console.log('[CompanyWorkspace] companyId', companyId);
  console.log('[CompanyWorkspace] contact methods total', safeCompanyContactMethods.length);
  console.log('[CompanyWorkspace] contact methods for company', contactMethodsForCompany.length);
  console.log('[CompanyWorkspace] first contact method', safeCompanyContactMethods[0] || null);
  console.log('[CompanyWorkspace] outreach scripts for company', outreachScriptsForCompany.length);
  }, [company, companyId, safeCompanyContactMethods, safeCompanyOutreachScripts]);

 useEffect(() => {
 if (!company) return;

 setNotesDraft(company.notes || '');
 setNotesSaved(false);
 }, [company?.id, company?.notes]);

 useEffect(() => {
 setSelectedPersonId(null);
 }, [company.id]);

 useEffect(() => {
 if (selectedPersonId && !safePeople.some((person) => person.id === selectedPersonId)) {
 setSelectedPersonId(null);
 setTab('people');
 }
 }, [safePeople, selectedPersonId]);

 useEffect(() => {
 if (!selectedPersonId) return;
 if (personWorkspaceActionPersonId !== selectedPersonId) return;

 const timeoutId = window.setTimeout(() => {
 setPersonWorkspaceActionPersonId(null);
 }, 0);

 return () => window.clearTimeout(timeoutId);
 }, [personWorkspaceActionPersonId, selectedPersonId]);

 if (!company) {
 return (
 <div className="space-y-4">
 <Button variant="ghost" size="sm" onClick={onBack}>← Back to CRM</Button>
 <EmptyState title="Company not found." description="The company you are looking for does not exist." />
 </div>
 );
 }

 const companyPeople = safePeople.filter((p) => p.companyId === company.id);
 const companyMessages = safeMessages.filter((m) => m.companyId === company.id);
 const companyDeals = safeDeals.filter((d) => d.companyId === company.id);
 const openDeals = companyDeals.filter((d) => d.stage !== 'won' && d.stage !== 'lost');
 const selectedPerson = selectedPersonId ? safePeople.find((person) => person.id === selectedPersonId) || null : null;

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

 const handleCopyToClipboard = async (text: string) => {
 try {
 await navigator.clipboard.writeText(text);
 setCopyFeedback('Copied to clipboard.');
 } catch {
 const ta = document.createElement('textarea');
 ta.value = text;
 ta.style.position = 'fixed';
 ta.style.opacity = '0';
 document.body.appendChild(ta);
 ta.select();
 document.execCommand('copy');
 document.body.removeChild(ta);
 setCopyFeedback('Copied to clipboard.');
 }

 window.setTimeout(() => setCopyFeedback(null), 1400);
 };

 const handleActionClick = (handler: () => void | Promise<void>) => (event: React.MouseEvent<HTMLButtonElement>) => {
 event.stopPropagation();
 event.preventDefault();
 void handler();
 };

 const wrapSave = async <T,>(fn: () => Promise<T>) => {
 setFormSaving(true);
 setFormError(null);
 try {
 const result = await fn();
 return result;
 } catch (err: any) {
 setFormError(err?.message || 'Save failed. Please try again.');
 throw err;
 } finally {
 setFormSaving(false);
 }
 };

 const handleSaveNotes = async () => {
 if (!company) return;
 setNotesSaving(true);
 setNotesSaved(false);
 try {
 await updateCompany(company.id, { notes: notesDraft });
 setNotesSaved(true);
 setTimeout(() => setNotesSaved(false), 2000);
 } catch {
 setFormError('Unable to save notes.');
 } finally {
 setNotesSaving(false);
 }
 };

 const handleSetPrimaryContactMethod = async (method: CompanyContactMethod) => {
 await updateCompanyContactMethod(method.id, {
 companyId: method.companyId,
 isPrimary: true,
 });
 for (const other of safeCompanyContactMethods.filter((m) => m.companyId === company.id && m.id !== method.id && m.isPrimary)) {
 await updateCompanyContactMethod(other.id, {
 companyId: other.companyId,
 isPrimary: false,
 });
 }
 };

 const handleDeleteAndBack = async (id: string) => {
 const ok = window.confirm(`Delete "${company.name}"? This cannot be undone.`);
 if (!ok) return;
 await deleteCompany(id);
 onBack();
 };

 const handleDeleteClick = () => {
 setShowDeleteModal(true);
 };

  const handleArchiveAndBack = async (companyArg: { id: string; name: string }) => {
    console.log("ARCHIVE DEBUG", companyArg);
    if (!companyArg || typeof companyArg.id !== "string") {
      console.error("Invalid company object", companyArg);
      return;
    }
    try {
      await updateCompany(companyArg.id, { status: 'archived' });
      console.log("[CRM] archive company success", companyArg.id);
      setShowDeleteModal(false);
      onBack();
    } catch (error) {
      console.error('[CRM] archive company failed', error);
      const message = error instanceof Error && error.message ? error.message : 'Unable to archive company.';
      setFormError(message);
      throw error;
    }
  };

 const handleDeletePermanentlyAndBack = async () => {
 try {
 await deleteCompany(company.id, { preserveRelated: true });
 setShowDeleteModal(false);
 onBack();
 } catch (error) {
 const message = error instanceof Error && error.message ? error.message : 'Unable to delete company.';
 setFormError(message);
 }
 };

  // ── Contact Method Handlers ──
 const openAddContactMethod = () => {
 setEditingContactMethod(null);
 setFormError(null);
 setShowContactMethodForm(true);
 };

 const openEditContactMethod = (method: CompanyContactMethod) => {
 setEditingContactMethod(method);
 setFormError(null);
 setShowContactMethodForm(true);
 };

 const handleSaveContactMethod = async (data: CompanyContactMethodInput) => {
 await wrapSave(async () => {
 if (editingContactMethod) {
 await updateCompanyContactMethod(editingContactMethod.id, data);
 } else {
 await addCompanyContactMethod(data);
 }
 });
 setShowContactMethodForm(false);
 setEditingContactMethod(null);
 };

 const handleDeleteContactMethod = async (id: string) => {
 const ok = window.confirm('Delete this contact method?');
 if (!ok) return;
 await deleteCompanyContactMethod(id);
 };

  // ── Outreach Script Handlers ──
 const openAddOutreachScript = () => {
 setEditingOutreachScript(null);
 setFormError(null);
 setShowOutreachScriptForm(true);
 };

 const openEditOutreachScript = (script: CompanyOutreachScript) => {
 setEditingOutreachScript(script);
 setFormError(null);
 setShowOutreachScriptForm(true);
 };

 const handleSaveOutreachScript = async (data: CompanyOutreachScriptInput) => {
 await wrapSave(async () => {
 if (editingOutreachScript) {
 await updateCompanyOutreachScript(editingOutreachScript.id, data);
 } else {
 await addCompanyOutreachScript(data);
 }
 });
 setShowOutreachScriptForm(false);
 setEditingOutreachScript(null);
 };

 const handleDeleteOutreachScript = async (id: string) => {
 const ok = window.confirm('Delete this script?');
 if (!ok) return;
 await deleteCompanyOutreachScript(id);
 };

 const handleMarkActive = async (script: CompanyOutreachScript) => {
 const nextIsActive = !script.isActive;
 await updateCompanyOutreachScript(script.id, {
 companyId: script.companyId,
 isActive: nextIsActive,
 });

 if (nextIsActive) {
 const otherActiveScripts = companyOutreachScripts.filter((item) => item.companyId === company.id && item.id !== script.id && item.isActive);
 for (const other of otherActiveScripts) {
 await updateCompanyOutreachScript(other.id, {
 companyId: other.companyId,
 isActive: false,
 });
 }
 }
 };

 // ── Person Handlers ──
 const openAddPerson = () => {
 setFormError(null);
 setShowPersonChoiceModal(true);
 };

 const openCreatePersonForm = () => {
 setEditingPerson(null);
 setFormError(null);
 setShowPersonChoiceModal(false);
 setShowLinkExistingPersonDialog(false);
 setShowPersonForm(true);
 };

 const openLinkExistingPersonFlow = () => {
 setFormError(null);
 setShowPersonChoiceModal(false);
 setShowPersonForm(false);
 setShowLinkExistingPersonDialog(true);
 };

 const openEditPerson = (person: Person) => {
 setEditingPerson(person);
 setFormError(null);
 setShowPersonForm(true);
 };

 const handleSavePerson = async (data: PersonInput) => {
 await wrapSave(async () => {
 if (editingPerson) {
 await updatePerson(editingPerson.id, data);
 } else {
 const created = await addPerson(data);
 setSelectedPersonId(created.id);
 setTab('people');
 }
 });
 setShowPersonForm(false);
 setEditingPerson(null);
 setShowPersonChoiceModal(false);
 };

 const handleLinkExistingPerson = async (person: Person) => {
 await wrapSave(async () => {
 await updatePerson(person.id, toPersonInput(person, { companyId: company.id }));
 setSelectedPersonId(person.id);
 setTab('people');
 });
 setShowLinkExistingPersonDialog(false);
 setShowPersonChoiceModal(false);
 };

 const openPersonContactMethodFlow = (personId: string) => {
 setSelectedPersonId(personId);
 setPersonWorkspaceActionPersonId(personId);
 setTab('people');
 };

 const handleDeletePerson = async (id: string) => {
 const ok = window.confirm('Delete this person?');
 if (!ok) return;
 await deletePerson(id);
 };

 // ── Message Handlers ──
 const openAddMessage = (personId?: string) => {
 setEditingMessage(null);
 setMessagePersonId(personId);
 setFormError(null);
 setShowMessageForm(true);
 };

 const openEditMessage = (message: OutreachMessage) => {
 setEditingMessage(message);
 setMessagePersonId(message.personId);
 setFormError(null);
 setShowMessageForm(true);
 };

 const handleSaveMessage = async (data: MessageInput) => {
 await wrapSave(async () => {
 if (editingMessage) {
 await updateMessage(editingMessage.id, data);
 } else {
 await addMessage(data);
 }
 });
 setShowMessageForm(false);
 setEditingMessage(null);
 setMessagePersonId(undefined);
 };

 const handleDeleteMessage = async (id: string) => {
 const ok = window.confirm('Delete this message?');
 if (!ok) return;
 await deleteMessage(id);
 };

 // ── Deal Handlers ──
 const openAddDeal = (personId?: string) => {
 setEditingDeal(null);
 setDealPersonId(personId);
 setFormError(null);
 setShowDealForm(true);
 };

 const openEditDeal = (deal: Deal) => {
 setEditingDeal(deal);
 setFormError(null);
 setShowDealForm(true);
 };

 const handleSaveDeal = async (data: DealInput) => {
 await wrapSave(async () => {
 if (editingDeal) {
 await updateDeal(editingDeal.id, data);
 } else {
 await addDeal(data);
 }
 });
 setShowDealForm(false);
 setEditingDeal(null);
 setDealPersonId(undefined);
 };

 const handleDeleteDeal = async (id: string) => {
 const ok = window.confirm('Delete this deal?');
 if (!ok) return;
 await deleteDeal(id);
 };

 const tabContent = () => {
 switch (tab) {
  case 'overview': {
  const companyMethods = companyContactMethods.filter((m) => String(m.companyId) === String(company.id));
  const primaryPeople = companyPeople.filter((p) => p.role && ['ceo', 'founder', 'owner', 'manager', 'director'].includes(p.role.toLowerCase()));
  const topPeople = companyPeople.slice(0, 3);

  const InfoTile: React.FC<{ label: string; value?: string; valueClass?: string }> = ({ label, value, valueClass }) => (
  <div className="rounded-xl border border-neutral-200 bg-white p-3.5">
  <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</div>
  <div className={`mt-1 text-sm text-neutral-900 break-words leading-relaxed ${valueClass || ''}`}>
  {value || <span className="text-neutral-400">Not added yet</span>}
  </div>
  </div>
  );

  const renderCopyButton = (text: string) => (
  <button
  type="button"
  onClick={(e) => { e.stopPropagation(); handleCopyToClipboard(text); }}
  className="text-xs font-medium text-neutral-400 hover:text-neutral-700 transition-colors"
  >
  Copy
  </button>
  );

  const renderOpenButton = (url: string) => (
  <a
  href={url.startsWith('http') ? url : `https://${url}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-xs font-medium text-blue-500 hover:text-blue-700 transition-colors"
  >
  Open
  </a>
  );

  const contactRowBg = (type: string) => {
  if (type === 'phone') return 'bg-green-50/60 border-green-100';
  if (type === 'email') return 'bg-indigo-50/60 border-indigo-100';
  if (type === 'website') return 'bg-neutral-50 border-neutral-200';
  if (type === 'linkedin') return 'bg-blue-50/60 border-blue-100';
  return 'bg-neutral-50 border-neutral-200';
  };

  const contactTypeColor = (type: string) => {
  if (type === 'phone') return 'text-green-700';
  if (type === 'email') return 'text-indigo-700';
  if (type === 'website') return 'text-neutral-700';
  if (type === 'linkedin') return 'text-blue-700';
  return 'text-neutral-600';
  };

  const methodTagVariant = (type: string) => {
  if (type === 'email') return 'blue' as const;
  if (type === 'phone' || type === 'whatsapp') return 'success' as const;
  if (type === 'website') return 'neutral' as const;
  if (type === 'linkedin') return 'blue' as const;
  return 'neutral' as const;
  };

  return (
  <div className="space-y-6">

  {/* A. Company Summary Card */}
  <div className="rounded-xl border border-neutral-200 bg-white p-5">
  <div className="mb-4 flex flex-col gap-3">
  <div className="text-lg font-semibold text-neutral-900">{company.name}</div>
  <div className="flex flex-wrap gap-1.5">
  {company.databaseType && (
  <Badge variant="neutral" className="text-neutral-600 bg-neutral-50 border-neutral-200 text-xs">
  {DATABASE_TYPE_LABELS[normalizeDatabaseType(company.databaseType)] || company.databaseType}
  </Badge>
  )}
  {company.priority && <PriorityBadge priority={company.priority} />}
  {company.status && <StatusBadge status={company.status} />}
  {company.ethicalFit && (
  <Badge variant={ethicalFitColor(company.ethicalFit) as 'success' | 'neutral' | 'warning' | 'danger'} className="text-xs">
  {ETHICAL_LABELS[company.ethicalFit] || company.ethicalFit}
  </Badge>
  )}
  {company.targetNiche && (
  <Badge variant="purple" className="text-xs">
  {NICHE_LABELS[company.targetNiche] || company.targetNiche}
  </Badge>
  )}
  </div>
  </div>

  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
  {company.industry && company.industry.length > 60 ? (
  <div className="sm:col-span-2 xl:col-span-3 rounded-xl border border-neutral-200 bg-neutral-50 p-3.5">
  <div className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Industry / Description</div>
  <div className="text-sm text-neutral-900 leading-relaxed">{company.industry}</div>
  </div>
  ) : null}
  {company.industry && company.industry.length <= 60 ? (
  <InfoTile label="Industry" value={company.industry} />
  ) : !company.industry ? (
  <InfoTile label="Industry" />
  ) : null}
  <InfoTile label="Category" value={company.category} />
  <InfoTile label="Target Niche" value={company.targetNiche ? (NICHE_LABELS[company.targetNiche] || company.targetNiche) : undefined} />
  <InfoTile label="Status" value={company.status ? company.status.replace(/_/g, ' ') : undefined} />
  <InfoTile label="Priority" value={company.priority || undefined} />
  <InfoTile label="Ethical Fit" value={company.ethicalFit ? (ETHICAL_LABELS[company.ethicalFit] || company.ethicalFit) : undefined} />
  {typeof company.fitScore === 'number' && (
  <InfoTile label="Fit Score" value={String(company.fitScore)} valueClass="font-semibold text-indigo-600" />
  )}
  {company.nextAction && (
  <InfoTile label="Next Action" value={company.nextAction} />
  )}
  </div>
  </div>

  {/* B. Location / Market Card */}
  <div className="rounded-xl border border-neutral-200 bg-white p-5">
  <h3 className="mb-3 text-sm font-semibold text-neutral-900">Location / Market</h3>
  <div className="space-y-1.5 text-sm">
  {company.country ? (
  <div className="flex items-center gap-2">
  <span className="text-neutral-500">Country</span>
  <span className="text-neutral-900">{company.country}</span>
  </div>
  ) : (
  <div className="text-neutral-400">Not added yet</div>
  )}
  {company.city && (
  <div className="flex items-center gap-2">
  <span className="text-neutral-500">City</span>
  <span className="text-neutral-900">{company.city}</span>
  </div>
  )}
  {company.country && company.city && (
  <div className="flex items-center gap-2">
  <span className="text-neutral-500">Location</span>
  <span className="text-neutral-900">{company.city}, {company.country}</span>
  </div>
  )}
  </div>
  </div>

  {/* C. Contact Snapshot Card */}
  <div className="rounded-xl border border-neutral-200 bg-white p-5">
  <h3 className="mb-3 text-sm font-semibold text-neutral-900">Contact Snapshot</h3>
  <div className="space-y-2">
  {/* Phone */}
  <div className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 ${contactRowBg('phone')}`}>
  <div className="min-w-0 flex-1">
  <div className={`text-xs font-semibold uppercase tracking-wide ${contactTypeColor('phone')}`}>Phone</div>
  <div className="mt-0.5 text-sm text-neutral-900 break-words">
  {company.phone || <span className="text-neutral-400">Not added yet</span>}
  </div>
  </div>
  {company.phone && (
  <div className="ml-3 shrink-0">{renderCopyButton(company.phone)}</div>
  )}
  </div>

  {/* Email */}
  <div className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 ${contactRowBg('email')}`}>
  <div className="min-w-0 flex-1">
  <div className={`text-xs font-semibold uppercase tracking-wide ${contactTypeColor('email')}`}>Email</div>
  <div className="mt-0.5 text-sm text-neutral-900 break-words">
  {company.email || <span className="text-neutral-400">Not added yet</span>}
  </div>
  </div>
  {company.email && (
  <div className="ml-3 shrink-0">{renderCopyButton(company.email)}</div>
  )}
  </div>

  {/* Website */}
  <div className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 ${contactRowBg('website')}`}>
  <div className="min-w-0 flex-1">
  <div className={`text-xs font-semibold uppercase tracking-wide ${contactTypeColor('website')}`}>Website</div>
  <div className="mt-0.5 text-sm text-neutral-900 break-words">
  {company.website || <span className="text-neutral-400">Not added yet</span>}
  </div>
  </div>
  {company.website && (
  <div className="ml-3 flex shrink-0 items-center gap-2">
  {renderOpenButton(company.website)}
  {renderCopyButton(company.website)}
  </div>
  )}
  </div>

  {/* LinkedIn */}
  <div className={`flex items-center justify-between rounded-lg border px-3.5 py-2.5 ${contactRowBg('linkedin')}`}>
  <div className="min-w-0 flex-1">
  <div className={`text-xs font-semibold uppercase tracking-wide ${contactTypeColor('linkedin')}`}>LinkedIn</div>
  <div className="mt-0.5 text-sm text-neutral-900 break-words">
  {company.linkedin || <span className="text-neutral-400">Not added yet</span>}
  </div>
  </div>
  {company.linkedin && (
  <div className="ml-3 flex shrink-0 items-center gap-2">
  {renderOpenButton(company.linkedin)}
  {renderCopyButton(company.linkedin)}
  </div>
  )}
  </div>
  </div>
  </div>

  {/* D. Contact Methods Preview (PART 4) */}
  {companyMethods.length > 0 && (
  <div className="rounded-xl border border-neutral-200 bg-white p-5">
  <h3 className="mb-3 text-sm font-semibold text-neutral-900">Contact Methods</h3>
  <div className="space-y-2">
  {companyMethods.map((method) => (
  <div key={method.id} className="flex items-center justify-between rounded-lg border border-neutral-200 bg-neutral-50/50 px-3.5 py-2.5">
  <div className="flex min-w-0 flex-1 items-center gap-2.5">
  <Badge variant={methodTagVariant(method.type)} className="shrink-0 text-xs">
  {CHANNEL_LABELS[method.type] || method.type}
  </Badge>
  <span className="text-sm text-neutral-900 break-words">{method.value}</span>
  {method.isPrimary && <span className="text-xs text-neutral-400">Primary</span>}
  </div>
  <div className="ml-3 flex shrink-0 items-center gap-2">
  {(['website', 'linkedin'].includes(method.type) || method.value.startsWith('http')) && renderOpenButton(method.value)}
  {renderCopyButton(method.value)}
  </div>
  </div>
  ))}
  </div>
  </div>
  )}

  {companyMethods.length === 0 && (company.phone || company.email || company.website || company.linkedin) && (
  <div className="rounded-xl border border-neutral-200 bg-white p-5">
  <h3 className="mb-3 text-sm font-semibold text-neutral-500">Contact Methods</h3>
  <p className="text-sm text-neutral-400">No additional contact methods yet.</p>
  </div>
  )}

  {/* E. People Preview */}
  <div className="rounded-xl border border-neutral-200 bg-white p-5">
  <div className="flex items-center justify-between mb-3">
  <h3 className="text-sm font-semibold text-neutral-900">People {companyPeople.length > 0 && <span className="font-normal text-neutral-500">({companyPeople.length})</span>}</h3>
  <button type="button" onClick={() => setTab('people')} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">View All →</button>
  </div>
  {companyPeople.length === 0 ? (
  <p className="text-sm text-neutral-400">No people linked yet.</p>
  ) : (
  <div className="space-y-2">
  {topPeople.map((person) => (
  <div
  key={person.id}
  role="button"
  tabIndex={0}
  onClick={() => setSelectedPersonId(person.id)}
  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setSelectedPersonId(person.id); } }}
  className="flex items-center justify-between rounded-lg border border-neutral-200 px-3.5 py-2 hover:bg-neutral-50 transition-colors cursor-pointer"
  >
  <div className="min-w-0 flex-1">
  <div className="text-sm font-medium text-neutral-900">{person.fullName}</div>
  <div className="text-xs text-neutral-500">{[person.role, person.department].filter(Boolean).join(' · ') || '—'}</div>
  </div>
  <svg className="h-4 w-4 shrink-0 text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
  </div>
  ))}
  {companyPeople.length > 3 && (
  <button type="button" onClick={() => setTab('people')} className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors">+{companyPeople.length - 3} more</button>
  )}
  </div>
  )}
  </div>

  {/* F. Notes Quick Add (PART 6) */}
  <div className="rounded-xl border border-neutral-200 bg-white p-5">
  <h3 className="mb-3 text-sm font-semibold text-neutral-900">Notes</h3>
  {company.notes && (
  <div className="mb-3 rounded-lg bg-neutral-50 border border-neutral-200 px-3.5 py-2.5">
  <p className="text-sm text-neutral-700 whitespace-pre-wrap break-words line-clamp-3">{company.notes}</p>
  </div>
  )}
  <textarea
  value={notesDraft}
  onChange={(e) => { setNotesDraft(e.target.value); setNotesSaved(false); }}
  placeholder="Add a quick note about this company..."
  className="w-full min-h-[80px] rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-900 resize-y focus:outline-none"
  />
  <div className="mt-3 flex items-center justify-end gap-3">
  {notesSaved && <span className="text-xs text-emerald-600">Saved</span>}
  <Button type="button" variant="primary" size="sm" onClick={handleActionClick(handleSaveNotes)} disabled={notesSaving}>
  {notesSaving ? 'Saving...' : 'Save Note'}
  </Button>
  </div>
  </div>

  </div>
  );
  }

 case 'contact_methods': {
 const methods = companyContactMethods.filter((m) => String(m.companyId) === String(company.id));
 return (
 <div className="space-y-4">
 <div className="flex justify-end">
 <Button type="button" variant="primary" size="sm" onClick={handleActionClick(openAddContactMethod)}>Add Contact Method</Button>
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
 <span className="text-sm font-medium text-neutral-900">{method.label || method.type}</span>
 <Badge variant="neutral">{CHANNEL_LABELS[method.type] || method.type}</Badge>
 {method.isPrimary && <Badge variant="blue">Primary</Badge>}
 </div>
 <div className="mt-0.5 text-sm text-neutral-700 break-words"><ContactLink type={method.type} value={method.value} className="text-sm font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700" /></div>
 {method.notes && <div className="mt-1 text-xs text-neutral-500">{method.notes}</div>}
 </div>
 <div className="flex shrink-0 gap-1">
 {!method.isPrimary && (
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleSetPrimaryContactMethod(method))} className="text-neutral-600">Set Primary</Button>
 )}
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => openEditContactMethod(method))} className="text-neutral-600">Edit</Button>
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleDeleteContactMethod(method.id))} className="text-neutral-600">Delete</Button>
 </div>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 }
  case 'people': {
  const personMethodsById = new Map<string, PersonContactMethod[]>(
  companyPeople.map((person) => [
  person.id,
  safePersonContactMethods.filter((method) => String(method.personId) === String(person.id)),
  ] as const),
  );

  return (
  <div className="space-y-4">
  <div className="flex justify-end">
  <Button type="button" variant="primary" size="sm" onClick={handleActionClick(openAddPerson)}>Add Person</Button>
  </div>
  {companyPeople.length === 0 ? (
  <EmptyState
  title="No people linked to this company yet."
  description="Add decision makers, influencers, or relevant contacts."
  />
  ) : (
  <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
  {companyPeople.map((person) => {
  const methods = personMethodsById.get(person.id) || [];
  const primaryEmail = methods.find((m) => m.type === 'email');
  const primaryPhone = methods.find((m) => m.type === 'phone');
  const linkedInMethod = methods.find((m) => m.type === 'linkedin');
  const whatsAppMethod = methods.find((m) => m.type === 'whatsapp');

  return (
  <div
  key={person.id}
  role="button"
  tabIndex={0}
  onClick={handleActionClick(() => setSelectedPersonId(person.id))}
  onKeyDown={(event) => {
  if (event.key === 'Enter' || event.key === ' ') {
  event.preventDefault();
  setSelectedPersonId(person.id);
  }
  }}
  className="rounded-xl border border-neutral-200 bg-white p-5 text-left transition-colors hover:bg-neutral-50 focus:outline-none"
  >
  <div className="mb-4">
  <div className="flex flex-wrap items-center gap-2">
  <div className="text-base font-semibold text-neutral-900">{person.fullName}</div>
  {person.relationshipStatus ? <Badge variant="neutral">{person.relationshipStatus}</Badge> : null}
  </div>
  <div className="mt-1 text-sm text-neutral-500">
  {[person.role, person.department, person.seniority].filter(Boolean).join(' · ') || 'Not added yet'}
  </div>
  </div>

  <div className="mb-4 space-y-2">
  {primaryEmail ? (
  <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/60 px-3.5 py-2.5">
  <div className="flex items-center gap-2 min-w-0">
  <span className="text-xs font-medium tracking-wide text-neutral-500 shrink-0">Email</span>
  <span className="text-sm text-neutral-900 truncate max-w-[220px]">{primaryEmail.value}</span>
  </div>
  <button type="button" onClick={handleActionClick(() => handleCopyToClipboard(primaryEmail.value))} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-1.5 py-0.5 shrink-0 ml-2">Copy</button>
  </div>
  ) : null}
  {primaryPhone ? (
  <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/60 px-3.5 py-2.5">
  <div className="flex items-center gap-2 min-w-0">
  <span className="text-xs font-medium tracking-wide text-neutral-500 shrink-0">Phone</span>
  <span className="text-sm text-neutral-900 truncate max-w-[220px]">{primaryPhone.value}</span>
  </div>
  <button type="button" onClick={handleActionClick(() => handleCopyToClipboard(primaryPhone.value))} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-1.5 py-0.5 shrink-0 ml-2">Copy</button>
  </div>
  ) : null}
  {linkedInMethod ? (
  <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/60 px-3.5 py-2.5">
  <div className="flex items-center gap-2 min-w-0">
  <span className="text-xs font-medium tracking-wide text-neutral-500 shrink-0">LinkedIn</span>
  <span className="text-sm text-neutral-900 truncate max-w-[220px]">{linkedInMethod.value}</span>
  </div>
  <div className="flex shrink-0 gap-1 ml-2">
  <button type="button" onClick={handleActionClick(() => { const href = getContactHref('linkedin', linkedInMethod.value); if (href) window.open(href, '_blank', 'noopener,noreferrer'); })} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-1.5 py-0.5">Open</button>
  <button type="button" onClick={handleActionClick(() => handleCopyToClipboard(linkedInMethod.value))} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-1.5 py-0.5">Copy</button>
  </div>
  </div>
  ) : null}
  {whatsAppMethod ? (
  <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/60 px-3.5 py-2.5">
  <div className="flex items-center gap-2 min-w-0">
  <span className="text-xs font-medium tracking-wide text-neutral-500 shrink-0">WhatsApp</span>
  <span className="text-sm text-neutral-900 truncate max-w-[220px]">{whatsAppMethod.value}</span>
  </div>
  <div className="flex shrink-0 gap-1 ml-2">
  <button type="button" onClick={handleActionClick(() => { const href = getContactHref('whatsapp', whatsAppMethod.value); if (href) window.open(href, '_blank', 'noopener,noreferrer'); })} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-1.5 py-0.5">Open</button>
  <button type="button" onClick={handleActionClick(() => handleCopyToClipboard(whatsAppMethod.value))} className="text-xs font-medium text-neutral-500 hover:text-neutral-900 px-1.5 py-0.5">Copy</button>
  </div>
  </div>
  ) : null}
  </div>

  <div className="mb-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-500">
  {person.decisionPower ? <span>Decision: <span className="font-medium text-neutral-700">{person.decisionPower}</span></span> : null}
  {person.influencePower ? <span>Influence: <span className="font-medium text-neutral-700">{person.influencePower}</span></span> : null}
  {person.relevance ? <span>Relevance: <span className="font-medium text-neutral-700">{person.relevance}</span></span> : null}
  <span>Next follow-up: <span className="font-medium text-neutral-700">{person.nextFollowUpDate || '—'}</span></span>
  </div>

  <div className="flex flex-wrap gap-1 border-t border-neutral-100 pt-3">
  <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => setSelectedPersonId(person.id))} className="text-neutral-600">Open Person</Button>
  <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => openEditPerson(person))} className="text-neutral-600">Edit</Button>
  <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => openPersonContactMethodFlow(person.id))} className="text-neutral-600">+ Contact</Button>
  <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleDeletePerson(person.id))} className="text-neutral-600">Delete</Button>
  </div>
  </div>
  );
  })}
  </div>
  )}
  </div>
  );
  }



 case 'outreach_script': {
 const scripts = companyOutreachScripts.filter((s) => String(s.companyId) === String(company.id));
 return (
 <div className="space-y-4">
 <div className="flex justify-end">
 <Button type="button" variant="primary" size="sm" onClick={handleActionClick(openAddOutreachScript)}>Add Outreach Script</Button>
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
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleMarkActive(script))} className="text-neutral-600">{script.isActive ? 'Deactivate' : 'Activate'}</Button>
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => openEditOutreachScript(script))} className="text-neutral-600">Edit</Button>
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleDeleteOutreachScript(script.id))} className="text-neutral-600">Delete</Button>
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
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleCopyToClipboard(script.messageBody!))} className="text-neutral-500 text-xs">Copy Message Body</Button>
 </div>
 <p className="mt-1 text-sm text-neutral-700 whitespace-pre-wrap break-words">{script.messageBody}</p>
 </div>
 )}
 {script.callScript && (
 <div>
 <div className="flex items-center justify-between">
 <p className="text-xs font-medium text-neutral-500">Call Script</p>
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleCopyToClipboard(script.callScript!))} className="text-neutral-500 text-xs">Copy Call Script</Button>
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
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleCopyToClipboard(script.followUpMessage!))} className="text-neutral-500 text-xs">Copy Follow-up Message</Button>
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

  case 'notes':
 return (
 <div className="space-y-4">
 {formError && (
 <div className="rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{formError}</div>
 )}
 <div className="rounded-xl border border-neutral-200 bg-white p-4">
 <textarea
 className="w-full min-h-[200px] rounded-lg border border-neutral-200 bg-neutral-50 p-3 text-sm text-neutral-900 resize-y focus:outline-none"
 value={notesDraft}
 onChange={(e) => { setNotesDraft(e.target.value); setNotesSaved(false); }}
 placeholder="Write notes about this company..."
 />
 <div className="mt-3 flex items-center justify-end gap-3">
 {notesSaved && <span className="text-xs text-emerald-600">Saved</span>}
 <Button type="button" variant="primary" size="sm" onClick={handleActionClick(handleSaveNotes)} disabled={notesSaving}>
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

  return (
  <div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
  <Button variant="ghost" size="sm" onClick={onBack} className="-ml-1.5 h-7 px-1.5 text-xs text-neutral-400 hover:text-neutral-900">
  <ArrowLeft className="h-3 w-3" />
  Back to CRM
  </Button>
  <div className="flex items-center gap-2">
  <h2 className="text-xl font-semibold text-neutral-900">{company.name}</h2>
  <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => onEditCompany(company))} className="text-neutral-400 hover:text-neutral-900">Edit Company</Button>
  </div>
  <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(handleDeleteClick)} className="text-neutral-300 hover:text-red-500">Delete</Button>
  </div>

  {copyFeedback ? (
  <div className="rounded-md border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-700">
  {copyFeedback}
  </div>
  ) : null}

  {/* Summary Cards */}
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
  <div className="rounded-xl border border-neutral-200 bg-white p-3">
  <p className="text-xs text-neutral-500">Priority</p>
  <p className="mt-1 text-lg font-bold text-neutral-900">{company.priority || '—'}</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-3">
  <p className="text-xs text-neutral-500">People</p>
  <p className="mt-1 text-lg font-bold text-neutral-900 tabular-nums">{companyPeople.length}</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-3">
  <p className="text-xs text-neutral-500">Contact Methods</p>
  <p className="mt-1 text-lg font-bold text-neutral-900 tabular-nums">{safeCompanyContactMethods.filter((m) => String(m.companyId) === String(company.id)).length}</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-3">
  <p className="text-xs text-neutral-500">Next Action</p>
  <p className="mt-1 text-lg font-bold text-neutral-900 truncate">{company.nextAction || '—'}</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-3">
  <p className="text-xs text-neutral-500">Fit Score</p>
  <p className="mt-1 text-lg font-bold text-indigo-600 tabular-nums">{typeof company.fitScore === 'number' ? company.fitScore : '—'}</p>
  </div>
  </div>

 {selectedPerson ? (
 <PersonWorkspace
 company={company}
 person={selectedPerson}
 people={safePeople}
 messages={safeMessages}
 deals={safeDeals}
 personContactMethods={safePersonContactMethods}
 autoOpenAddContactMethod={personWorkspaceActionPersonId === selectedPerson.id}
 onBack={() => { setSelectedPersonId(null); setPersonWorkspaceActionPersonId(null); setTab('people'); }}
 onEditPerson={openEditPerson}
 onAddMessage={(personId) => openAddMessage(personId)}
 onAddDeal={(personId) => openAddDeal(personId)}
 addPersonContactMethod={addPersonContactMethod}
 updatePersonContactMethod={updatePersonContactMethod}
 deletePersonContactMethod={deletePersonContactMethod}
 updatePerson={updatePerson}
 addMessage={addMessage}
 updateMessage={updateMessage}
 deleteMessage={deleteMessage}
 addDeal={addDeal}
 updateDeal={updateDeal}
 deleteDeal={deleteDeal}
 />
 ) : (
 <>
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
 </>
 )}

 {showDeleteModal && (
 <DeleteCompanyModal
 isOpen={showDeleteModal}
  company={company}
 onClose={() => setShowDeleteModal(false)}
 onArchive={handleArchiveAndBack}
 onDeletePermanently={handleDeletePermanentlyAndBack}
 />
 )}

 {/* ── Modal: Contact Method Form ── */}
 {showContactMethodForm && (
 <OpportunityModal title={editingContactMethod ? 'Edit Contact Method' : 'Add Contact Method'} onClose={() => { setShowContactMethodForm(false); setEditingContactMethod(null); setFormError(null); }}>
 <CompanyContactMethodForm
 companyId={company.id}
 onSubmit={handleSaveContactMethod}
 onCancel={() => { setShowContactMethodForm(false); setEditingContactMethod(null); setFormError(null); }}
 initialData={editingContactMethod ? {
 companyId: editingContactMethod.companyId,
 type: editingContactMethod.type,
 label: editingContactMethod.label,
 value: editingContactMethod.value,
 isPrimary: editingContactMethod.isPrimary,
 notes: editingContactMethod.notes,
 } : undefined}
 />
 {formError && (
 <div className="mt-3 rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{formError}</div>
 )}
 </OpportunityModal>
 )}



 {/* ── Modal: Outreach Script Form ── */}
 {showOutreachScriptForm && (
 <OpportunityModal title={editingOutreachScript ? 'Edit Outreach Script' : 'Add Outreach Script'} onClose={() => { setShowOutreachScriptForm(false); setEditingOutreachScript(null); setFormError(null); }}>
 <CompanyOutreachScriptForm
 companyId={company.id}
 onSubmit={handleSaveOutreachScript}
 onCancel={() => { setShowOutreachScriptForm(false); setEditingOutreachScript(null); setFormError(null); }}
 initialData={editingOutreachScript ? {
 companyId: editingOutreachScript.companyId,
 name: editingOutreachScript.name,
 channel: editingOutreachScript.channel,
 language: editingOutreachScript.language,
 audience: editingOutreachScript.audience,
 goal: editingOutreachScript.goal,
 hook: editingOutreachScript.hook,
 messageBody: editingOutreachScript.messageBody,
 callScript: editingOutreachScript.callScript,
 objectionHandling: editingOutreachScript.objectionHandling,
 followUpMessage: editingOutreachScript.followUpMessage,
 status: editingOutreachScript.status,
 isActive: editingOutreachScript.isActive,
 notes: editingOutreachScript.notes,
 } : undefined}
 />
 {formError && (
 <div className="mt-3 rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{formError}</div>
 )}
 </OpportunityModal>
 )}



 {showPersonChoiceModal ? (
 <OpportunityModal title="Add Person" onClose={() => setShowPersonChoiceModal(false)}>
 <div className="space-y-3">
 <p className="text-sm text-neutral-600">Choose how you want to add a person to this company.</p>
 <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
 <button type="button" onClick={openCreatePersonForm} className="rounded-xl border border-neutral-200 bg-white p-4 text-left hover:bg-neutral-50">
 <div className="text-sm font-semibold text-neutral-900">Create New Person</div>
 <div className="mt-1 text-sm text-neutral-600">Start a new person profile with this company already filled in.</div>
 </button>
 <button type="button" onClick={openLinkExistingPersonFlow} className="rounded-xl border border-neutral-200 bg-white p-4 text-left hover:bg-neutral-50">
 <div className="text-sm font-semibold text-neutral-900">Link Existing Person</div>
 <div className="mt-1 text-sm text-neutral-600">Attach an existing person from the CRM to this company.</div>
 </button>
 </div>
 <div className="flex items-center justify-end">
 <Button type="button" variant="ghost" size="sm" onClick={() => setShowPersonChoiceModal(false)}>Cancel</Button>
 </div>
 </div>
 </OpportunityModal>
 ) : null}

 {showLinkExistingPersonDialog ? (
 <OpportunityModal title="Link Existing Person" onClose={() => setShowLinkExistingPersonDialog(false)}>
 <LinkExistingPersonDialog
 company={company}
 people={people}
 onSelect={handleLinkExistingPerson}
 onCancel={() => setShowLinkExistingPersonDialog(false)}
 />
 </OpportunityModal>
 ) : null}

 {/* ── Modal: Person Form ── */}
 {showPersonForm && (
 <OpportunityModal title={editingPerson ? 'Edit Person' : 'Add Person'} onClose={() => { setShowPersonForm(false); setEditingPerson(null); setFormError(null); }}>
 <AddPersonForm
 companies={companies}
 onSubmit={handleSavePerson}
 onCancel={() => { setShowPersonForm(false); setEditingPerson(null); setFormError(null); }}
 initialData={editingPerson ? toPersonInput(editingPerson) : { companyId: company.id, fullName: '', role: '', department: '', seniority: '', decisionPower: 'unknown', influencePower: 'unknown', relevance: 'medium', linkedin: '', emailPublic: '', contactChannel: 'email', relationshipStatus: '', nextFollowUpDate: '', notes: '' }}
 />
 {formError && (
 <div className="mt-3 rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{formError}</div>
 )}
 </OpportunityModal>
 )}

 {/* ── Modal: Message Form ── */}
 {showMessageForm && (
 <OpportunityModal title={editingMessage ? 'Edit Message' : 'Log Message'} onClose={() => { setShowMessageForm(false); setEditingMessage(null); setMessagePersonId(undefined); setFormError(null); }}>
 <LogMessageForm
 companies={companies}
 people={people}
 onSubmit={handleSaveMessage}
 onCancel={() => { setShowMessageForm(false); setEditingMessage(null); setMessagePersonId(undefined); setFormError(null); }}
 initialData={editingMessage ? {
 companyId: editingMessage.companyId || company.id,
 personId: editingMessage.personId || messagePersonId || '',
 channel: editingMessage.channel || 'Email',
 language: editingMessage.language || 'English',
 messageType: editingMessage.messageType || 'outreach',
 messageText: editingMessage.messageText || '',
 sentDate: editingMessage.sentDate || '',
 replyStatus: editingMessage.replyStatus || 'no_reply',
 replySummary: editingMessage.replySummary || '',
 nextFollowUpDate: editingMessage.nextFollowUpDate || '',
 status: editingMessage.status || 'draft',
 } : {
 companyId: company.id,
 personId: messagePersonId || '',
 channel: 'Email',
 language: 'English',
 messageType: 'outreach',
 messageText: '',
 sentDate: new Date().toISOString(),
 replyStatus: 'no_reply',
 replySummary: '',
 nextFollowUpDate: '',
 status: 'sent',
 }}
 />
 {formError && (
 <div className="mt-3 rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{formError}</div>
 )}
 </OpportunityModal>
 )}

 {/* ── Modal: Deal Form ── */}
 {showDealForm && (
 <OpportunityModal title={editingDeal ? 'Edit Deal' : 'Add Deal'} onClose={() => { setShowDealForm(false); setEditingDeal(null); setDealPersonId(undefined); setFormError(null); }}>
 <AddDealForm
 companies={companies}
 people={people}
 onSubmit={handleSaveDeal}
 onCancel={() => { setShowDealForm(false); setEditingDeal(null); setDealPersonId(undefined); setFormError(null); }}
 initialData={editingDeal ? {
 companyId: editingDeal.companyId || company.id,
 personId: editingDeal.personId || '',
 servicePackage: editingDeal.servicePackage || '',
 problem: editingDeal.problem || '',
 proposedSolution: editingDeal.proposedSolution || '',
 value: editingDeal.value,
 currency: (editingDeal.currency as DealInput['currency']) || 'USD',
 stage: editingDeal.stage || 'discovery',
 probability: editingDeal.probability,
 notes: editingDeal.notes || '',
 } : {
 companyId: company.id,
 personId: dealPersonId || '',
 servicePackage: '',
 problem: '',
 proposedSolution: '',
 value: 0,
 currency: 'USD',
 stage: 'discovery',
 probability: 50,
 notes: '',
 }}
 />
 {formError && (
 <div className="mt-3 rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">{formError}</div>
 )}
 </OpportunityModal>
 )}
 </div>
 );
};

export default CompanyWorkspace;
