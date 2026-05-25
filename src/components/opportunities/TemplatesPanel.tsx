import React, { useMemo, useState } from 'react';
import { audienceOptions, goalOptions, languageOptions } from '../../data/messageTemplates';
import type { MessageTemplate, MessageTemplateInput } from '../../types/opportunities';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import EmptyState from '../ui/EmptyState';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';

const emptyForm: MessageTemplateInput = {
  name: '',
  audience: 'founder',
  goal: 'ux_audit_offer',
  language: 'english',
  subject: '',
  body: '',
  isActive: true,
};

const formatDateLabel = (value?: string) => {
  if (!value) return 'Current';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Current';
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
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
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAudience, setFilterAudience] = useState('');
  const [filterGoal, setFilterGoal] = useState('');
  const [filterLanguage, setFilterLanguage] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const filteredTemplates = useMemo(() => {
    return templates.filter((template) => {
      const haystack = [template.name, template.audience, template.goal, template.language, template.subject || '', template.body || '']
        .join(' ')
        .toLowerCase();

      if (searchQuery && !haystack.includes(searchQuery.toLowerCase())) return false;
      if (filterAudience && template.audience !== filterAudience) return false;
      if (filterGoal && template.goal !== filterGoal) return false;
      if (filterLanguage && template.language !== filterLanguage) return false;
      if (filterStatus === 'active' && template.isActive === false) return false;
      if (filterStatus === 'inactive' && template.isActive !== false) return false;
      return true;
    });
  }, [templates, searchQuery, filterAudience, filterGoal, filterLanguage, filterStatus]);

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

  const audienceSelectOptions = [
    { value: '', label: 'All audiences' },
    ...audienceOptions.map((option) => ({ value: option.value, label: option.label })),
  ];
  const goalSelectOptions = [
    { value: '', label: 'All goals' },
    ...goalOptions.map((option) => ({ value: option.value, label: option.label })),
  ];
  const languageSelectOptions = [
    { value: '', label: 'All languages' },
    ...languageOptions.map((option) => ({ value: option.value, label: option.label })),
  ];
  const statusSelectOptions = [
    { value: '', label: 'Status' },
    { value: 'active', label: 'Active' },
    { value: 'inactive', label: 'Inactive' },
  ];

  return (
    <div className="space-y-4">
      <div className="text-xs text-neutral-500">
        Supported placeholders: {'{{personName}}'}, {'{{companyName}}'}, {'{{role}}'}, {'{{myName}}'}, {'{{service}}'}, {'{{observation}}'}.
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-neutral-200 bg-white p-2">
        <Input
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
          placeholder="Search templates..."
          className="min-w-[220px] flex-1"
        />
        <Select value={filterAudience} onChange={(event) => setFilterAudience(event.target.value)} options={audienceSelectOptions} />
        <Select value={filterGoal} onChange={(event) => setFilterGoal(event.target.value)} options={goalSelectOptions} />
        <Select value={filterLanguage} onChange={(event) => setFilterLanguage(event.target.value)} options={languageSelectOptions} />
        <Select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)} options={statusSelectOptions} />
        {templates.length === 0 && onSeedDefaults ? (
          <Button variant="secondary" size="sm" onClick={() => void onSeedDefaults()}>
            Seed default templates
          </Button>
        ) : null}
        <Button variant="primary" size="sm" onClick={startAdd}>
          New Template
        </Button>
      </div>

      {showForm ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="border-b border-neutral-200 px-5 py-4">
            <h3 className="text-sm font-semibold text-neutral-900">{editingTemplate ? 'Edit Template' : 'New Template'}</h3>
            <p className="mt-1 text-xs text-neutral-500">Reusable outreach copy you can personalize on send.</p>
          </div>
          <div className="space-y-4 p-5">
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
                options={languageOptions.map((option) => ({ value: option.value, label: option.label }))}
              />
              <Select
                label="Audience"
                value={form.audience}
                onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))}
                options={audienceOptions.map((option) => ({ value: option.value, label: option.label }))}
              />
              <Select
                label="Goal"
                value={form.goal}
                onChange={(event) => setForm((current) => ({ ...current, goal: event.target.value }))}
                options={goalOptions.map((option) => ({ value: option.value, label: option.label }))}
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
        </div>
      ) : null}

      {filteredTemplates.length ? (
        <div className="overflow-hidden rounded-xl border border-neutral-200 bg-white">
          <div className="overflow-x-auto">
            <table className="min-w-[1080px] w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3 font-medium">Template Name</th>
                  <th className="px-4 py-3 font-medium">Audience</th>
                  <th className="px-4 py-3 font-medium">Goal</th>
                  <th className="px-4 py-3 font-medium">Language</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Updated</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTemplates.map((template) => (
                  <tr key={template.id} className="border-b border-neutral-100 transition-colors hover:bg-neutral-50">
                    <td className="px-4 py-4 align-top">
                      <div className="font-semibold text-neutral-900">{template.name}</div>
                      <div className="mt-1 max-w-[320px] truncate text-xs text-neutral-500">{template.subject || template.body}</div>
                    </td>
                    <td className="px-4 py-4 align-top"><Badge variant="neutral">{template.audience}</Badge></td>
                    <td className="px-4 py-4 align-top"><Badge variant="neutral">{template.goal.replace(/_/g, ' ')}</Badge></td>
                    <td className="px-4 py-4 align-top text-neutral-700">{template.language}</td>
                    <td className="px-4 py-4 align-top">
                      <Badge variant={template.isActive === false ? 'warning' : 'success'}>
                        {template.isActive === false ? 'Inactive' : 'Active'}
                      </Badge>
                    </td>
                    <td className="px-4 py-4 align-top text-neutral-500">{formatDateLabel(template.updatedAt)}</td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap justify-end gap-1.5">
                        <Button variant="ghost" size="sm" onClick={() => startEdit(template)} className="text-neutral-700 hover:text-neutral-900">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => void handleDeactivate(template.id)} className="text-neutral-700 hover:text-neutral-900">
                          Deactivate
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState
          title="No templates yet."
          description="Create your first outreach template."
          action={<Button variant="primary" size="sm" onClick={startAdd}>New Template</Button>}
        />
      )}

      {status ? <p className="text-xs text-neutral-500">{status}</p> : null}
    </div>
  );
};

export default TemplatesPanel;
