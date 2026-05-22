import React, { useMemo, useState } from 'react';
import type { Company, Person, ProjectInput } from '../../types/opportunities';

const baseInput = 'w-full rounded-md border border-[#dbe2ea] bg-white px-3 py-2 text-sm text-[#0f172a] placeholder:text-[#94a3b8] focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/15';

const emptyForm: ProjectInput = {
  name: '',
  type: 'portfolio',
  status: 'planned',
  phase: 'idea',
  priority: 'medium',
  progress: 0,
  startDate: '',
  deadline: '',
  relatedCompanyId: '',
  relatedPersonId: '',
  portfolioUrl: '',
  figmaUrl: '',
  githubUrl: '',
  notes: '',
  nextAction: '',
};

const AddProjectForm: React.FC<{
  companies: Company[];
  people: Person[];
  onSubmit: (data: ProjectInput) => void;
  onCancel: () => void;
  initialData?: ProjectInput;
}> = ({ companies, people, onSubmit, onCancel, initialData }) => {
  const [form, setForm] = useState<ProjectInput>(initialData || { ...emptyForm });
  const [errors, setErrors] = useState<string[]>([]);

  const filteredPeople = useMemo(() => {
    if (!form.relatedCompanyId) return [];
    return people.filter((p) => p.companyId === form.relatedCompanyId);
  }, [people, form.relatedCompanyId]);

  const setField = <K extends keyof ProjectInput>(key: K, value: ProjectInput[K]) => {
    setErrors([]);
    setForm((current) => ({ ...current, [key]: value }));
    if (key === 'relatedCompanyId') {
      setForm((current) => ({ ...current, relatedPersonId: '' }));
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const errs: string[] = [];
    if (!form.name.trim()) errs.push('Project name is required.');
    const progress = Number(form.progress);
    if (Number.isNaN(progress) || progress < 0 || progress > 100) {
      errs.push('Progress must be between 0 and 100.');
    }
    if (errs.length > 0) {
      setErrors(errs);
      return;
    }
    onSubmit({
      ...form,
      name: form.name.trim(),
      progress,
      startDate: form.startDate || '',
      deadline: form.deadline || '',
      relatedCompanyId: form.relatedCompanyId || '',
      relatedPersonId: form.relatedPersonId || '',
    });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Name *</span>
          <input className={baseInput} value={form.name} onChange={(e) => setField('name', e.target.value)} required />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Type</span>
          <select className={baseInput} value={form.type} onChange={(e) => setField('type', e.target.value as ProjectInput['type'])}>
            <option value="portfolio">Portfolio</option>
            <option value="client">Client</option>
            <option value="personal_product">Personal Product</option>
            <option value="case_study">Case Study</option>
            <option value="learning">Learning</option>
            <option value="experiment">Experiment</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Status</span>
          <select className={baseInput} value={form.status} onChange={(e) => setField('status', e.target.value as ProjectInput['status'])}>
            <option value="planned">Planned</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="blocked">Blocked</option>
            <option value="completed">Completed</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Phase</span>
          <select className={baseInput} value={form.phase} onChange={(e) => setField('phase', e.target.value as ProjectInput['phase'])}>
            <option value="idea">Idea</option>
            <option value="research">Research</option>
            <option value="ux_audit">UX Audit</option>
            <option value="wireframes">Wireframes</option>
            <option value="ui_design">UI Design</option>
            <option value="prototype">Prototype</option>
            <option value="case_study">Case Study</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Priority</span>
          <select className={baseInput} value={form.priority} onChange={(e) => setField('priority', e.target.value as ProjectInput['priority'])}>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Progress (0-100)</span>
          <input type="number" min="0" max="100" className={baseInput} value={form.progress ?? 0} onChange={(e) => setField('progress', e.target.value === '' ? 0 : Number(e.target.value))} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Start Date</span>
          <input type="date" className={baseInput} value={form.startDate || ''} onChange={(e) => setField('startDate', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Deadline</span>
          <input type="date" className={baseInput} value={form.deadline || ''} onChange={(e) => setField('deadline', e.target.value)} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Related Company</span>
          <select className={baseInput} value={form.relatedCompanyId || ''} onChange={(e) => setField('relatedCompanyId', e.target.value)}>
            <option value="">None</option>
            {companies.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
        <label className="space-y-1">
          <span className="text-sm font-medium text-[#0f172a]">Related Person</span>
          <select className={baseInput} value={form.relatedPersonId || ''} onChange={(e) => setField('relatedPersonId', e.target.value)}>
            <option value="">None</option>
            {(form.relatedCompanyId ? filteredPeople : people).map((p) => (
              <option key={p.id} value={p.id}>{p.fullName}{p.companyName ? ` (${p.companyName})` : ''}</option>
            ))}
          </select>
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Portfolio URL</span>
          <input className={baseInput} value={form.portfolioUrl || ''} onChange={(e) => setField('portfolioUrl', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Figma URL</span>
          <input className={baseInput} value={form.figmaUrl || ''} onChange={(e) => setField('figmaUrl', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">GitHub URL</span>
          <input className={baseInput} value={form.githubUrl || ''} onChange={(e) => setField('githubUrl', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Next Action</span>
          <input className={baseInput} value={form.nextAction || ''} onChange={(e) => setField('nextAction', e.target.value)} />
        </label>
        <label className="space-y-1 md:col-span-2">
          <span className="text-sm font-medium text-[#0f172a]">Notes</span>
          <textarea className={`${baseInput} min-h-24`} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
        </label>
      </div>

      {errors.length > 0 && (
        <div className="rounded-md border border-[#fecaca] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c]">
          {errors.map((err, i) => <div key={i}>{err}</div>)}
        </div>
      )}

      <div className="flex items-center justify-end gap-2 pt-2">
        <button type="button" onClick={onCancel} className="rounded-md border border-[#e5e7eb] bg-white px-4 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">Cancel</button>
        <button type="submit" className="rounded-md bg-[#2563eb] px-4 py-2 text-sm text-white hover:bg-[#1d4ed8]">Save Project</button>
      </div>
    </form>
  );
};

export default AddProjectForm;
