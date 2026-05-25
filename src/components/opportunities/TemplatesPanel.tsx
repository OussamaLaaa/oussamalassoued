import React, { useMemo, useState } from 'react';
import { audienceOptions, goalOptions, languageOptions } from '../../data/messageTemplates';
import type { MessageTemplate, MessageTemplateInput } from '../../types/opportunities';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

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

  const AUDIENCE_SELECT_OPTIONS = [
    { value: '', label: 'All audiences' },
    ...audienceOptions.map((o) => ({ value: o.value, label: o.label })),
  ];

  const GOAL_SELECT_OPTIONS = [
    { value: '', label: 'All goals' },
    ...goalOptions.map((o) => ({ value: o.value, label: o.label })),
  ];

  const LANGUAGE_SELECT_OPTIONS = [
    { value: '', label: 'All languages' },
    ...languageOptions.map((o) => ({ value: o.value, label: o.label })),
  ];

  const FORM_LANGUAGE_OPTIONS = languageOptions.map((o) => ({ value: o.value, label: o.label }));
  const FORM_AUDIENCE_OPTIONS = audienceOptions.map((o) => ({ value: o.value, label: o.label }));
  const FORM_GOAL_OPTIONS = goalOptions.map((o) => ({ value: o.value, label: o.label }));

  return (
    <div className="rounded-xl border border-neutral-200 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-medium text-black">Message Templates</h3>
        <div className="flex items-center gap-2">
          {templates.length === 0 && onSeedDefaults && (
            <Button variant="secondary" size="sm" onClick={() => void onSeedDefaults()}>
              Seed default templates
            </Button>
          )}
          <Button variant="primary" size="sm" onClick={startAdd}>
            Add Template
          </Button>
        </div>
      </div>

      <p className="mt-2 text-xs text-neutral-500">
        Supported placeholders: {'{{personName}}'}, {'{{companyName}}'}, {'{{role}}'}, {'{{myName}}'}, {'{{service}}'}, {'{{observation}}'}.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-b border-neutral-200 pb-3">
        <Select
          value={filterAudience}
          onChange={(event) => setFilterAudience(event.target.value)}
          options={AUDIENCE_SELECT_OPTIONS}
          className="text-xs"
        />
        <Select
          value={filterGoal}
          onChange={(event) => setFilterGoal(event.target.value)}
          options={GOAL_SELECT_OPTIONS}
          className="text-xs"
        />
        <Select
          value={filterLanguage}
          onChange={(event) => setFilterLanguage(event.target.value)}
          options={LANGUAGE_SELECT_OPTIONS}
          className="text-xs"
        />
      </div>

      {showForm && (
        <div className="mt-4 space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Input
              label="Name"
              type="text"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Founder / UX audit offer / English"
            />

            <Select
              label="Language"
              value={form.language}
              onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))}
              options={FORM_LANGUAGE_OPTIONS}
            />

            <Select
              label="Audience"
              value={form.audience}
              onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}
              options={FORM_AUDIENCE_OPTIONS}
            />

            <Select
              label="Goal"
              value={form.goal}
              onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
              options={FORM_GOAL_OPTIONS}
            />
          </div>

          <Input
            label="Subject"
            type="text"
            value={form.subject || ''}
            onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
            placeholder="Quick UX audit idea for {{companyName}}"
          />

          <Textarea
            label="Body"
            value={form.body}
            onChange={(event) => setForm((current) => ({ ...current, body: event.target.value }))}
            className="min-h-44"
            placeholder="Hi {{personName}}, ..."
          />

          <label className="inline-flex items-center gap-2 text-xs text-neutral-500">
            <input
              type="checkbox"
              checked={form.isActive !== false}
              onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
            />
            Active template
          </label>

          <div className="flex flex-wrap justify-end gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setShowForm(false);
                setEditingTemplate(null);
                setForm(emptyForm);
                setStatus('');
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => void handleSave()}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
            </Button>
          </div>
        </div>
      )}

      <div className="mt-4 overflow-x-auto">
        <table className="w-full table-auto text-left">
          <thead>
            <tr className="bg-neutral-50 text-xs text-neutral-600">
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
              <tr key={template.id} className="border-t border-neutral-200 hover:bg-neutral-50">
                <td className="px-3 py-3">
                  <div className="font-medium text-black">{template.name}</div>
                  <div className="max-w-[360px] truncate text-xs text-neutral-500">{template.subject || template.body}</div>
                </td>
                <td className="px-3 py-3 text-sm text-black">{template.audience}</td>
                <td className="px-3 py-3 text-sm text-black">{template.goal}</td>
                <td className="px-3 py-3 text-sm text-black">{template.language}</td>
                <td className="px-3 py-3 text-sm">
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${template.isActive === false ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {template.isActive === false ? 'Inactive' : 'Active'}
                  </span>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => startEdit(template)}
                    >
                      Edit
                    </Button>
                    {template.isActive !== false && (
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => void handleDeactivate(template.id)}
                      >
                        Deactivate
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredTemplates.length === 0 && (
              <tr>
                <td colSpan={6} className="px-3 py-8 text-center text-sm text-neutral-500">No templates match the current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {status && (
        <div className="mt-3 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-xs text-blue-700">
          {status}
        </div>
      )}
    </div>
  );
};

export default TemplatesPanel;
