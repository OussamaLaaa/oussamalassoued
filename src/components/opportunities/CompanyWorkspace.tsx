import React, { useEffect, useState } from 'react';
import type {
 Company, Person, OutreachMessage, Deal,
 CompanyContactMethod, CompanyContactMethodInput,
 CompanyProblemProfile, CompanyProblemProfileInput,
 CompanyOutreachScript, CompanyOutreachScriptInput,
 PersonInput, MessageInput, DealInput,
 PersonContactMethod, PersonContactMethodInput,
} from '../../types/opportunities';
import { Archive, ArrowLeft } from 'lucide-react';
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
import CompanyProblemProfileForm from './CompanyProblemProfileForm';
import CompanyOutreachScriptForm from './CompanyOutreachScriptForm';
import CompanyResearchPanel from './CompanyResearchPanel';
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

type WorkspaceTab = 'overview' | 'contact_methods' | 'people' | 'problem' | 'outreach_script' | 'messages' | 'deals' | 'notes' | 'ai_score' | 'research';

const TABS: { id: WorkspaceTab; label: string }[] = [
 { id: 'overview', label: 'Overview' },
 { id: 'contact_methods', label: 'Contact Methods' },
 { id: 'people', label: 'People' },
 { id: 'problem', label: 'Problem / Opportunity' },
 { id: 'outreach_script', label: 'Outreach Script' },
 { id: 'messages', label: 'Messages' },
 { id: 'deals', label: 'Deals' },
 { id: 'notes', label: 'Notes' },
 { id: 'ai_score', label: 'AI Score' },
 { id: 'research', label: 'Research' },
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
 companyProblemProfiles,
 companyOutreachScripts,
 onBack,
 onEditCompany,
 onAIScoreCompany,
 addCompanyContactMethod,
 updateCompanyContactMethod,
 deleteCompanyContactMethod,
 addCompanyProblemProfile,
 updateCompanyProblemProfile,
 deleteCompanyProblemProfile,
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

 const [showProblemProfileForm, setShowProblemProfileForm] = useState(false);
 const [editingProblemProfile, setEditingProblemProfile] = useState<CompanyProblemProfile | null>(null);

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
 const safeCompanyProblemProfiles = companyProblemProfiles ?? [];
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
 const problemProfilesForCompany = safeCompanyProblemProfiles.filter((item) => String(item.companyId) === String(company.id));
 const outreachScriptsForCompany = safeCompanyOutreachScripts.filter((item) => String(item.companyId) === String(company.id));

 console.log('[CompanyWorkspace] companyId', companyId);
 console.log('[CompanyWorkspace] contact methods total', safeCompanyContactMethods.length);
 console.log('[CompanyWorkspace] contact methods for company', contactMethodsForCompany.length);
 console.log('[CompanyWorkspace] first contact method', safeCompanyContactMethods[0] || null);
 console.log('[CompanyWorkspace] problem profiles for company', problemProfilesForCompany.length);
 console.log('[CompanyWorkspace] outreach scripts for company', outreachScriptsForCompany.length);
 }, [company, companyId, safeCompanyContactMethods, safeCompanyProblemProfiles, safeCompanyOutreachScripts]);

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
      setShowDeleteModal(false);
      onBack();
    } catch (error) {
      const message = error instanceof Error && error.message ? error.message : 'Unable to archive company.';
      setFormError(message);
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

 const handleCreateResearchContactMethods = async (items: any[]) => {
 if (!items?.length) return;
 for (const item of items) {
 if (!item?.value) continue;
 await addCompanyContactMethod({
 companyId: company.id,
 type: item.type || 'other',
 label: item.label || undefined,
 value: item.value,
 isPrimary: Boolean(item.isPrimary),
 notes: item.notes || undefined,
 });
 }
 };

 const handleCreateResearchProblemProfile = async (item: any) => {
 await addCompanyProblemProfile({
 companyId: company.id,
 problemTitle: item.problemTitle || undefined,
 problemDescription: item.problemDescription || undefined,
 currentSituation: item.currentSituation || undefined,
 businessImpact: item.businessImpact || undefined,
 proposedSolution: item.proposedSolution || undefined,
 serviceAngle: item.serviceAngle || undefined,
 valueProposition: item.valueProposition || undefined,
 urgency: item.urgency || undefined,
 confidence: item.confidence || undefined,
 status: item.status || undefined,
 notes: item.notes || undefined,
 });
 };

 const handleCreateResearchOutreachScript = async (item: any) => {
 await addCompanyOutreachScript({
 companyId: company.id,
 name: item.name || `${company.name} AI Research Script`,
 channel: item.channel || undefined,
 language: item.language || undefined,
 audience: item.audience || undefined,
 goal: item.goal || undefined,
 hook: item.hook || undefined,
 messageBody: item.messageBody || undefined,
 callScript: item.callScript || undefined,
 objectionHandling: item.objectionHandling || undefined,
 followUpMessage: item.followUpMessage || undefined,
 status: item.status || undefined,
 isActive: item.isActive ?? undefined,
 notes: item.notes || undefined,
 });
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

 // ── Problem Profile Handlers ──
 const openAddProblemProfile = () => {
 setEditingProblemProfile(null);
 setFormError(null);
 setShowProblemProfileForm(true);
 };

 const openEditProblemProfile = (profile: CompanyProblemProfile) => {
 setEditingProblemProfile(profile);
 setFormError(null);
 setShowProblemProfileForm(true);
 };

 const handleSaveProblemProfile = async (data: CompanyProblemProfileInput) => {
 await wrapSave(async () => {
 if (editingProblemProfile) {
 await updateCompanyProblemProfile(editingProblemProfile.id, data);
 } else {
 await addCompanyProblemProfile(data);
 }
 });
 setShowProblemProfileForm(false);
 setEditingProblemProfile(null);
 };

 const handleDeleteProblemProfile = async (id: string) => {
 const ok = window.confirm('Delete this problem profile?');
 if (!ok) return;
 await deleteCompanyProblemProfile(id);
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
  case 'overview':
  return (
  <div className="space-y-6">
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <h3 className="mb-3 text-sm font-semibold text-neutral-900">Company Details</h3>
  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
  <div className="text-neutral-500">Name</div>
  <div className="text-neutral-900 font-medium">{company.name}</div>
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
  <h3 className="mb-3 text-sm font-semibold text-neutral-900">CRM Classification</h3>
  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
  <div className="text-neutral-500">Database Type</div>
  <div className="text-neutral-900"><Badge variant="neutral" className="text-neutral-600 bg-neutral-50 border-neutral-200">{DATABASE_TYPE_LABELS[normalizeDatabaseType(company.databaseType)] || company.databaseType || '—'}</Badge></div>
  <div className="text-neutral-500">Priority</div>
  <div className="text-neutral-900"><PriorityBadge priority={company.priority} /></div>
  <div className="text-neutral-500">Fit Score</div>
  <div className="text-neutral-900">{typeof company.fitScore === 'number' ? (
  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border border-indigo-200 text-indigo-700 bg-indigo-50">Fit: {company.fitScore}</span>
  ) : '—'}</div>
  <div className="text-neutral-500">Ethical Fit</div>
  <div className="text-neutral-900">{company.ethicalFit === 'good' ? (
  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border border-emerald-200 text-emerald-700 bg-emerald-50">{ETHICAL_LABELS[company.ethicalFit] || company.ethicalFit}</span>
  ) : company.ethicalFit === 'needs_review' ? (
  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border border-amber-200 text-amber-700 bg-amber-50">{ETHICAL_LABELS[company.ethicalFit] || company.ethicalFit}</span>
  ) : company.ethicalFit === 'avoid' ? (
  <span className="inline-flex items-center px-2 py-0.5 text-xs font-semibold rounded-md border border-red-200 text-red-700 bg-red-50">{ETHICAL_LABELS[company.ethicalFit] || company.ethicalFit}</span>
  ) : (
  <Badge variant="neutral">{ETHICAL_LABELS[company.ethicalFit || ''] || company.ethicalFit || '—'}</Badge>
  )}</div>
  <div className="text-neutral-500">Status</div>
  <div className="text-neutral-900"><StatusBadge status={company.status} /></div>
  <div className="text-neutral-500">Next Action</div>
  <div className="text-neutral-900">{company.nextAction || '—'}</div>
  </div>
  </div>

  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <h3 className="mb-3 text-sm font-semibold text-neutral-900">Web Presence</h3>
  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
  {company.website ? <><div className="text-neutral-500">Website</div><div className="text-neutral-900"><ContactLink type="website" value={company.website} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline" compact /></div></> : null}
  {company.linkedin ? <><div className="text-neutral-500">LinkedIn</div><div className="text-neutral-900"><ContactLink type="linkedin" value={company.linkedin} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline" compact /></div></> : null}
  {company.facebook ? <><div className="text-neutral-500">Facebook</div><div className="text-neutral-900"><ContactLink type="facebook" value={company.facebook} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline" compact /></div></> : null}
  {company.instagram ? <><div className="text-neutral-500">Instagram</div><div className="text-neutral-900"><ContactLink type="instagram" value={company.instagram} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline" compact /></div></> : null}
  {company.twitter ? <><div className="text-neutral-500">X / Twitter</div><div className="text-neutral-900"><ContactLink type="x" value={company.twitter} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline" compact /></div></> : null}
  {company.youtube ? <><div className="text-neutral-500">YouTube</div><div className="text-neutral-900"><ContactLink type="other" value={company.youtube} className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline" compact /></div></> : null}
  {!company.website && !company.linkedin && !company.facebook && !company.instagram && !company.twitter && !company.youtube ? <div className="text-neutral-500 col-span-2">No web presence data.</div> : null}
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
 const primaryMethod = methods.find((method) => method.isPrimary) || methods[0] || null;
 const quickTypes = ['email', 'linkedin', 'phone', 'whatsapp'] as const;

 const openContact = (method: PersonContactMethod) => {
 const href = getContactHref(method.type, method.value);
 if (href) {
 window.open(href, '_blank', 'noopener,noreferrer');
 return;
 }
 void navigator.clipboard.writeText(method.value).catch(() => undefined);
 };

 return (
 <div
 key={person.id}
 role="button"
 tabIndex={0}
 onClick={() => setSelectedPersonId(person.id)}
 onKeyDown={(event) => {
 if (event.key === 'Enter' || event.key === ' ') {
 event.preventDefault();
 setSelectedPersonId(person.id);
 }
 }}
 className="rounded-xl border border-neutral-200 bg-white p-4 text-left transition-colors hover:bg-neutral-50 focus:outline-none"
 >
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0 space-y-2">
 <div className="flex flex-wrap items-center gap-2">
 <div className="text-sm font-semibold text-neutral-900">{person.fullName}</div>
 {person.relationshipStatus ? <Badge variant="neutral">{person.relationshipStatus}</Badge> : null}
 </div>
 <div className="text-sm text-neutral-700">
 {[person.role, person.department, person.seniority].filter(Boolean).join(' · ') || '—'}
 </div>
 <div className="flex flex-wrap gap-2 text-xs text-neutral-500">
 <span>Decision: {person.decisionPower || '—'}</span>
 <span>Influence: {person.influencePower || '—'}</span>
 <span>Relevance: {person.relevance || '—'}</span>
 <span>Next follow-up: {person.nextFollowUpDate || '—'}</span>
 </div>
 </div>
 <div className="flex shrink-0 flex-wrap justify-end gap-1">
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => setSelectedPersonId(person.id))} className="text-neutral-600">Open Person</Button>
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => openEditPerson(person))} className="text-neutral-600">Edit</Button>
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => openPersonContactMethodFlow(person.id))} className="text-neutral-600">Add Contact Method</Button>
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleDeletePerson(person.id))} className="text-neutral-600">Delete</Button>
 </div>
 </div>

 <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
 <div className="space-y-2">
 <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Primary Contact</div>
  <div className="text-sm text-neutral-900 max-w-[200px] min-w-0 overflow-hidden truncate whitespace-nowrap">
  {primaryMethod ? <ContactLink type={primaryMethod.type} value={primaryMethod.value} displayValue={primaryMethod.label || primaryMethod.value} compact className="text-sm font-medium text-neutral-900 underline underline-offset-2 hover:text-neutral-700" /> : '—'}
  </div>
 </div>
 <div className="space-y-2">
 <div className="text-xs font-medium uppercase tracking-wide text-neutral-500">Quick Contact</div>
 <div className="flex flex-wrap gap-2">
 {quickTypes.map((type) => {
 const method = methods.find((item) => String(item.type).toLowerCase() === type) || null;
 if (!method) return null;
 return (
 <Button key={`${person.id}-${type}`} type="button" variant="ghost" size="sm" onClick={handleActionClick(() => openContact(method))} className="text-neutral-600">
 {type === 'linkedin' ? 'LinkedIn' : type === 'whatsapp' ? 'WhatsApp' : type.charAt(0).toUpperCase() + type.slice(1)}
 </Button>
 );
 })}
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
 }

 case 'problem': {
 const profiles = companyProblemProfiles.filter((p) => String(p.companyId) === String(company.id));
 return (
 <div className="space-y-4">
 <div className="flex justify-end">
 <Button type="button" variant="primary" size="sm" onClick={handleActionClick(openAddProblemProfile)}>Add Problem Profile</Button>
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
 <div className="flex shrink-0 gap-1">
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => openEditProblemProfile(profile))} className="text-neutral-600">Edit</Button>
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleDeleteProblemProfile(profile.id))} className="text-neutral-600">Delete</Button>
 </div>
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

 case 'messages':
 return (
 <div className="space-y-4">
 <div className="flex justify-end">
 <Button type="button" variant="primary" size="sm" onClick={handleActionClick(() => openAddMessage())}>Log Message</Button>
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
 <td className="px-3 py-3 text-neutral-700">{msg.sentDate || msg.createdAt || '—'}</td>
 <td className="px-3 py-3 text-neutral-900">{person?.fullName || '—'}</td>
 <td className="px-3 py-3"><Badge variant="neutral">{msg.channel || '—'}</Badge></td>
 <td className="px-3 py-3 text-neutral-700">{msg.messageType || '—'}</td>
 <td className="px-3 py-3"><StatusBadge status={msg.replyStatus} /></td>
 <td className="px-3 py-3 text-neutral-700">{msg.nextFollowUpDate || '—'}</td>
 <td className="px-3 py-3 text-neutral-700 max-w-[200px] truncate">{msg.messageText || msg.replySummary || '—'}</td>
 <td className="px-3 py-3">
 <div className="flex justify-end gap-1">
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => openEditMessage(msg))} className="text-neutral-600">Edit</Button>
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleDeleteMessage(msg.id))} className="text-neutral-600">Delete</Button>
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
 <Button type="button" variant="primary" size="sm" onClick={handleActionClick(openAddDeal)}>Add Deal</Button>
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
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => openEditDeal(deal))} className="text-neutral-600">Edit</Button>
 <Button type="button" variant="ghost" size="sm" onClick={handleActionClick(() => handleDeleteDeal(deal.id))} className="text-neutral-600">Delete</Button>
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

  case 'ai_score':
  return (
  <div className="space-y-4">
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">Fit Score</p>
  <p className="mt-1 text-2xl font-bold text-indigo-600 tabular-nums">{typeof company.fitScore === 'number' ? company.fitScore : '—'}</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">Priority</p>
  <p className="mt-1 text-2xl font-bold text-neutral-900">{company.priority || '—'}</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <p className="text-xs text-neutral-500">Ethical Fit</p>
  <p className="mt-1 text-2xl font-bold text-neutral-900">{ETHICAL_LABELS[company.ethicalFit || ''] || company.ethicalFit || '—'}</p>
  </div>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-4">
  <div className="flex items-center justify-between">
  <h3 className="text-sm font-semibold text-neutral-900">AI Scoring</h3>
  <Button type="button" variant="primary" size="sm" onClick={handleActionClick(() => onAIScoreCompany(company))}>Run AI Score</Button>
  </div>
  <p className="mt-2 text-sm text-neutral-500">Run an AI-powered analysis to evaluate fit score, priority, ethical fit, and industry classification for this company.</p>
  </div>
  </div>
  );

  case 'research':
  return (
  <CompanyResearchPanel
  title="Research / Refresh AI"
  company={company}
  countryHint={company.country || undefined}
  cityHint={company.city || undefined}
  industryHint={company.industry || undefined}
  websiteHint={company.website || undefined}
  currentCompany={company}
  showRelatedActions
  debug={import.meta.env.DEV}
  onApplyCompanyPatch={async (patch) => {
  await updateCompany(company.id, patch);
  }}
  onCreateContactMethods={handleCreateResearchContactMethods}
  onCreateProblemProfile={handleCreateResearchProblemProfile}
  onCreateOutreachScript={handleCreateResearchOutreachScript}
  />
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
  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
  <div className="rounded-xl border border-neutral-200 bg-white p-3">
  <p className="text-xs text-neutral-500">Fit Score</p>
  <p className="mt-1 text-lg font-bold text-indigo-600 tabular-nums">{typeof company.fitScore === 'number' ? company.fitScore : '—'}</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-3">
  <p className="text-xs text-neutral-500">Priority</p>
  <p className="mt-1 text-lg font-bold text-neutral-900">{company.priority || '—'}</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-3">
  <p className="text-xs text-neutral-500">People</p>
  <p className="mt-1 text-lg font-bold text-neutral-900 tabular-nums">{companyPeople.length}</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-3">
  <p className="text-xs text-neutral-500">Messages</p>
  <p className="mt-1 text-lg font-bold text-indigo-600 tabular-nums">{companyMessages.length}</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-3">
  <p className="text-xs text-neutral-500">Open Deals</p>
  <p className="mt-1 text-lg font-bold text-emerald-600 tabular-nums">{openDeals.length}</p>
  </div>
  <div className="rounded-xl border border-neutral-200 bg-white p-3">
  <p className="text-xs text-neutral-500">Next Action</p>
  <p className="mt-1 text-lg font-bold text-neutral-900 truncate">{company.nextAction || '—'}</p>
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

 {/* ── Modal: Problem Profile Form ── */}
 {showProblemProfileForm && (
 <OpportunityModal title={editingProblemProfile ? 'Edit Problem Profile' : 'Add Problem Profile'} onClose={() => { setShowProblemProfileForm(false); setEditingProblemProfile(null); setFormError(null); }}>
 <CompanyProblemProfileForm
 companyId={company.id}
 onSubmit={handleSaveProblemProfile}
 onCancel={() => { setShowProblemProfileForm(false); setEditingProblemProfile(null); setFormError(null); }}
 initialData={editingProblemProfile ? {
 companyId: editingProblemProfile.companyId,
 problemTitle: editingProblemProfile.problemTitle,
 problemDescription: editingProblemProfile.problemDescription,
 currentSituation: editingProblemProfile.currentSituation,
 businessImpact: editingProblemProfile.businessImpact,
 proposedSolution: editingProblemProfile.proposedSolution,
 serviceAngle: editingProblemProfile.serviceAngle,
 valueProposition: editingProblemProfile.valueProposition,
 urgency: editingProblemProfile.urgency,
 confidence: editingProblemProfile.confidence,
 status: editingProblemProfile.status,
 notes: editingProblemProfile.notes,
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
