import React, { useMemo, useState } from 'react';
import { audienceOptions, goalOptions, languageOptions } from '../../data/messageTemplates';
import type { MessageTemplate, MessageTemplateInput } from '../../types/opportunities';

const inputClassName = 'w-full rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15';

const emptyForm: MessageTemplateInput = {
  name: '',
  audience: 'founder',
  goal: 'ux_audit_offer',
  language: 'english',
  subject: '',
  body: '',
  isActive: true,
};

const TemplatesPanel: React.FC<{
  templates: MessageTemplate[];
  onAddTemplate: (input: MessageTemplateInput) => Promise<unknown>;
  onUpdateTemplate: (id: string, input: MessageTemplateInput) => Promise<unknown>;
  onDeleteTemplate: (id: string) => Promise<unknown>;
  onSeedDefaults?: () => Promise<unknown>;
}> = ({ templates, onAddTemplate, onUpdateTemplate, onDeleteTemplate, onSeedDefaults }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null);
  const [form, setForm] = useState<MessageTemplateInput>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState('');
  const [filterAudience, setFilterAudience] = useState('');
  const [filterGoal, setFilterGoal] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      if (filterAudience && template.audience !== filterAudience) return false;
      if (filterGoal && template.goal !== filterGoal) return false;
      if (filterLanguage && template.language !== filterLanguage) return false;
      return true;
    });
  }, [templates, filterAudience, filterGoal, filterLanguage]);

  const startAdd = () => {
    setEditingTemplate(null);
    setForm(emptyForm);
    setShowForm(true);
    setStatus('');
  };

  const startEdit = (template: MessageTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      audience: template.audience,
      goal: template.goal,
      language: template.language,
      subject: template.subject || '',
      body: template.body,
      isActive: template.isActive !== false,
    });
    setShowForm(true);
    setStatus('');
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setStatus('Template name is required.');
      return;
    }

    if (!form.body.trim()) {
      setStatus('Template body is required.');
      return;
    }

    setIsSubmitting(true);
    setStatus('');
    try {
      if (editingTemplate) {
        await onUpdateTemplate(editingTemplate.id, form);
        setStatus('Template updated.');
      } else {
        await onAddTemplate(form);
        setStatus('Template added.');
      }

      setShowForm(false);
      setEditingTemplate(null);
      setForm(emptyForm);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to save template.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    setStatus('');
    try {
      await onDeleteTemplate(id);
      setStatus('Template deactivated.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Failed to deactivate template.');
    }
  };

  return (
    <div className="rounded-lg border border-[#e5e7eb] bg-white p-4 shadow-[0_6px_18px_rgba(15,23,42,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-medium text-lg text-[#0f172a]">Message Templates</h3>
        <div className="flex items-center gap-2">
          {templates.length === 0 && onSeedDefaults && (
            <button
              type="button"
              onClick={() => void onSeedDefaults()}
              className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
            >
              Seed default templates
            </button>
          )}
          <button
            type="button"
            onClick={startAdd}
            className="text-xs px-3 py-1.5 rounded border border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8] hover:bg-[#dbeafe]"
          >
            Add Template
          </button>
        </div>
      </div>

      <p className="mt-2 text-xs text-[#64748b]">
        Supported placeholders: {'{{personName}}'}, {'{{companyName}}'}, {'{{role}}'}, {'{{myName}}'}, {'{{service}}'}, {'{{observation}}'}.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-[#e5e7eb] pb-3">
        <select value={filterAudience} onChange={(event) => setFilterAudience(event.target.value)} className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
          <option value="">All audiences</option>
          {audienceOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select value={filterGoal} onChange={(event) => setFilterGoal(event.target.value)} className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
          <option value="">All goals</option>
          {goalOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        <select value={filterLanguage} onChange={(event) => setFilterLanguage(event.target.value)} className="text-xs px-2 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] focus:outline-none focus:ring-1 focus:ring-[#2563eb]">
          <option value="">All languages</option>
          {languageOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </div>

      {showForm && (
        <div className="mt-4 rounded-md border border-[#e5e7eb] bg-[#f8fafc] p-3 space-y-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <label className="text-xs text-[#64748b] space-y-1">
              <span>Name</span>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className={inputClassName}
                placeholder="Founder / UX audit offer / English"
              />
            </label>

            <label className="text-xs text-[#64748b] space-y-1">
              <span>Language</span>
              <select
                value={form.language}
                onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
                className={inputClassName}
              >
                {languageOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="text-xs text-[#64748b] space-y-1">
              <span>Audience</span>
              <select
                value={form.audience}
                onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}
                className={inputClassName}
              >
                {audienceOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>

            <label className="text-xs text-[#64748b] space-y-1">
              <span>Goal</span>
              <select
                value={form.goal}
                onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
                className={inputClassName}
              >
                {goalOptions.map((option) => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="text-xs text-[#64748b] space-y-1 block">
            <span>Subject</span>
            <input
              type="text"
              value={form.subject || ''}
              onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
              className={inputClassName}
              placeholder="Quick UX audit idea for {{companyName}}"
            />
          </label>

          <label className="text-xs text-[#64748b] space-y-1 block">
            <span>Body</span>
            <textarea
              value={form.body}
              onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
              className={`${inputClassName} min-h-44`}
              placeholder="Hi {{personName}}, ..."
            />
          </label>

          <label className="inline-flex items-center gap-2 text-xs text-[#64748b]">
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />
            Active template
          </label>

          <div className="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setEditingTemplate(null);
                setForm(emptyForm);
                setStatus('');
              }}
              className="text-xs px-3 py-1.5 rounded border border-[#e5e7eb] bg-white text-[#0f172a] hover:bg-[#f8fafc]"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSubmitting}
              className="text-xs px-3 py-1.5 rounded bg-[#2563eb] text-white hover:bg-[#1d4ed8] disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full text-left table-auto">
          <thead>
            <tr className="text-xs text-[#475569] bg-[#f8fafc]">
              <th className="px-3 py-2">Name</th>
              <th className="px-3 py-2">Audience</th>
              <th className="px-3 py-2">Goal</th>
              <th className="px-3 py-2">Language</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTemplates.map((template) => (
              <tr key={template.id} className="border-t border-[#e5e7eb] hover:bg-[#f9fafb]">
                <td className="px-3 py-3">
                  <div className="font-medium text-[#0f172a]">{template.name}</div>
                  <div className="text-xs text-[#64748b] truncate max-w-[360px]">{template.subject || template.body}</div>
                </td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{template.audience}</td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{template.goal}</td>
                <td className="px-3 py-3 text-sm text-[#0f172a]">{template.language}</td>
                <td className="px-3 py-3 text-sm">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${template.isActive === false ? 'bg-[#fee2e2] text-[#991b1b]' : 'bg-[#dcfce7] text-[#166534]'}`}>
                    {template.isActive === false ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => startEdit(template)}
                      className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#2563eb] hover:bg-[#eff6ff]"
                    >
                      Edit
                    </button>
                    {template.isActive !== false && (
                      <button
                        type="button"
                        onClick={() => void handleDeactivate(template.id)}
                        className="px-2 py-1 text-xs rounded border border-[#e5e7eb] text-[#dc2626] hover:bg-[#fef2f2]"
                      >
                        Deactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTemplates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-[#64748b]">No templates match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {status && (
        <div className="mt-3 rounded-md border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-xs text-[#1d4ed8]">
          {status}
        </div>
      )}
    </div>
  );
};

export default TemplatesPanel;
