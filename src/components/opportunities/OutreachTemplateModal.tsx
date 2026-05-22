import React, { useMemo, useState } from 'react';
import type { Company, MessageInput, Person, PersonInput } from '../../types/opportunities';
import { audienceOptions, goalOptions, languageOptions, messageTemplates, type MessageTemplate, type TemplateAudience, type TemplateGoal, type TemplateLanguage } from '../../data/messageTemplates';
import { renderMessageTemplate } from '../../utils/renderMessageTemplate';

const baseInput = 'w-full rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15';

const todayDate = () => new Date().toISOString().slice(0, 10);

const followUpDate = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const filterTemplates = (audience: string, goal: string, language: string) => messageTemplates.filter((template) => {
  if (audience && template.audience !== audience) return false;
  if (goal && template.goal !== goal) return false;
  if (language && template.language !== language) return false;
  return true;
});

const OutreachTemplateModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  person: Person;
  company: Company | null;
  onLogMessage: (input: MessageInput) => Promise<unknown>;
  onUpdatePerson?: (id: string, input: PersonInput) => Promise<unknown>;
}> = ({ isOpen, onClose, person, company, onLogMessage, onUpdatePerson }) => {
  const [audience, setAudience] = useState<TemplateAudience | ''>('founder');
  const [goal, setGoal] = useState<TemplateGoal | ''>('ux_audit_offer');
  const [language, setLanguage] = useState<TemplateLanguage | ''>('english');
  const [selectedTemplateId, setSelectedTemplateId] = useState(messageTemplates[0]?.id || '');
  const [observation, setObservation] = useState('');
  const [isCopying, setIsCopying] = useState(false);
  const [isLogging, setIsLogging] = useState(false);
  const [status, setStatus] = useState('');

  const filteredTemplates = useMemo(() => filterTemplates(audience, goal, language), [audience, goal, language]);

  const selectedTemplate = useMemo<MessageTemplate | undefined>(() => {
    return filteredTemplates.find((template) => template.id === selectedTemplateId) || filteredTemplates[0] || messageTemplates.find((template) => template.id === selectedTemplateId);
  }, [filteredTemplates, selectedTemplateId]);

  const variables = {
    personName: person.fullName,
    companyName: company?.name || person.companyName || '',
    role: person.role || '',
    myName: 'Oussama',
    service: 'UX audit',
    observation: observation.trim(),
  };

  const renderedSubject = selectedTemplate?.subject ? renderMessageTemplate(selectedTemplate.subject, variables) : '';
  const renderedBody = selectedTemplate ? renderMessageTemplate(selectedTemplate.body, variables) : '';
  const messageText = [renderedSubject ? `Subject: ${renderedSubject}` : '', renderedBody].filter(Boolean).join('\n\n');

  const handleCopy = async () => {
    try {
      setIsCopying(true);
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(messageText);
        setStatus('Message copied to clipboard.');
      } else {
        setStatus('Clipboard is not available in this browser.');
      }
    } catch {
      setStatus('Could not copy the message.');
    } finally {
      setIsCopying(false);
    }
  };

  const handleLog = async () => {
    if (!selectedTemplate) return;

    try {
      setIsLogging(true);
      setStatus('');
      await onLogMessage({
        companyId: company?.id || person.companyId,
        personId: person.id,
        channel: person.contactChannel || 'LinkedIn',
        language: selectedTemplate.language,
        messageType: selectedTemplate.goal,
        messageText,
        sentDate: todayDate(),
        replyStatus: 'waiting',
        replySummary: '',
        nextFollowUpDate: followUpDate(3),
        status: 'sent',
      });

      if (onUpdatePerson) {
        await onUpdatePerson(person.id, {
          companyId: person.companyId,
          fullName: person.fullName,
          role: person.role,
          department: person.department,
          seniority: person.seniority,
          decisionPower: person.decisionPower !== undefined ? String(person.decisionPower) as PersonInput['decisionPower'] : undefined,
          influencePower: person.influencePower !== undefined ? String(person.influencePower) as PersonInput['influencePower'] : undefined,
          relevance: person.relevance !== undefined ? String(person.relevance) as PersonInput['relevance'] : undefined,
          linkedin: person.linkedin,
          emailPublic: person.emailPublic,
          contactChannel: person.contactChannel,
          relationshipStatus: 'Message Sent',
          nextFollowUpDate: person.nextFollowUpDate,
          notes: person.notes,
        });
      }

      setStatus('Message logged successfully.');
      setTimeout(() => onClose(), 300);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to log message.');
    } finally {
      setIsLogging(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-lg border border-[#e5e7eb] bg-white p-6 shadow-[0_22px_44px_-18px_rgba(0,0,0,0.28)]">
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-mono uppercase text-[#0f172a]">Outreach Template</h3>
            <p className="mt-1 text-xs text-[#64748b]">Pick a template, preview the message, copy it, or log it as sent.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-xs px-2 py-1 rounded border border-[#e5e7eb] text-[#64748b] hover:bg-[#f8fafc]"
          >
            Close
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <label className="space-y-1 text-xs text-[#64748b]">
                <span>Audience</span>
                <select className={baseInput} value={audience} onChange={(event) => setAudience(event.target.value as TemplateAudience | '')}>
                  <option value="">All</option>
                  {audienceOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs text-[#64748b]">
                <span>Goal</span>
                <select className={baseInput} value={goal} onChange={(event) => setGoal(event.target.value as TemplateGoal | '')}>
                  <option value="">All</option>
                  {goalOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <label className="space-y-1 text-xs text-[#64748b]">
                <span>Language</span>
                <select className={baseInput} value={language} onChange={(event) => setLanguage(event.target.value as TemplateLanguage | '')}>
                  <option value="">All</option>
                  {languageOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
            </div>

            <label className="block space-y-1 text-xs text-[#64748b]">
              <span>Template</span>
              <select className={baseInput} value={selectedTemplate?.id || ''} onChange={(event) => setSelectedTemplateId(event.target.value)}>
                {filteredTemplates.map((template) => (
                  <option key={template.id} value={template.id}>{template.name}</option>
                ))}
                {filteredTemplates.length === 0 && <option value="">No templates found</option>}
              </select>
            </label>

            <label className="block space-y-1 text-xs text-[#64748b]">
              <span>Observation</span>
              <textarea
                className={`${baseInput} min-h-24`}
                value={observation}
                onChange={(event) => setObservation(event.target.value)}
                placeholder="Add a quick observation about the person, company, or project..."
              />
            </label>

            <div className="rounded-md border border-[#e5e7eb] bg-[#f8fafc] p-3 text-xs text-[#64748b]">
              <div className="font-medium text-[#0f172a]">Context</div>
              <div className="mt-1">Person: {person.fullName}</div>
              <div>Company: {company?.name || person.companyName || 'Unknown company'}</div>
              <div>Role: {person.role || '—'}</div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="rounded-lg border border-[#e5e7eb] bg-white p-3">
              <div className="mb-2 text-xs font-medium text-[#0f172a]">Preview</div>
              {selectedTemplate?.subject && (
                <div className="mb-2 text-xs text-[#64748b]">
                  Subject: <span className="font-medium text-[#0f172a]">{renderedSubject}</span>
                </div>
              )}
              <textarea
                readOnly
                value={messageText}
                className={`${baseInput} min-h-[360px] bg-[#f8fafc]`}
              />
            </div>

            {status && (
              <div className="rounded-md border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-xs text-[#1d4ed8]">
                {status}
              </div>
            )}

            <div className="flex flex-wrap justify-end gap-2">
              <button
                type="button"
                onClick={handleCopy}
                disabled={isCopying || !messageText}
                className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc] disabled:opacity-50"
              >
                {isCopying ? 'Copying...' : 'Copy Message'}
              </button>
              <button
                type="button"
                onClick={() => void handleLog()}
                disabled={isLogging || !selectedTemplate}
                className="rounded-md bg-[#2563eb] px-4 py-2 text-sm text-white hover:bg-[#1d4ed8] disabled:opacity-50"
              >
                {isLogging ? 'Logging...' : 'Log as Sent'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OutreachTemplateModal;