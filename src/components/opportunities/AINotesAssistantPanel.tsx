import React, { useMemo, useState } from 'react';
import type { NoteAttachment, NoteBlock, NoteCategory, SmartNote } from '../../types/opportunities';

export type AINotesAssistantMode =
  | 'organize_note'
  | 'summarize_note'
  | 'correct_arabic'
  | 'improve_writing'
  | 'extract_tasks'
  | 'suggest_category_tags';

export type AINotesAssistantLanguage = 'arabic' | 'english' | 'french' | 'auto';

export type AINotesAssistantTask = {
  title: string;
  priority: string;
  category: string;
  suggestedDueDate: string;
  notes: string;
};

export type AINotesAssistantResult = {
  summary: string;
  improvedContent: string;
  keyPoints: string[];
  suggestedTasks: AINotesAssistantTask[];
  suggestedCategory: string;
  suggestedTags: string[];
  nextActions: string[];
};

const shellClass = 'rounded-2xl border border-[#e5e7eb] bg-white shadow-[0_10px_28px_rgba(15,23,42,0.06)]';
const inputClass = 'w-full rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-sm text-[#0f172a] outline-none transition focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15';

const MODE_OPTIONS: Array<{ value: AINotesAssistantMode; label: string; description: string }> = [
  { value: 'organize_note', label: 'Organize Note', description: 'Restructure into sections and bullets.' },
  { value: 'summarize_note', label: 'Summarize', description: 'Compress the note into the essential points.' },
  { value: 'correct_arabic', label: 'Correct Arabic', description: 'Fix Arabic spelling, grammar, and clarity.' },
  { value: 'improve_writing', label: 'Improve Writing', description: 'Make the note clearer and more readable.' },
  { value: 'extract_tasks', label: 'Extract Tasks', description: 'Pull out actionable tasks from the note.' },
  { value: 'suggest_category_tags', label: 'Suggest Category/Tags', description: 'Recommend a category, tags, and useful metadata.' },
];

const LANGUAGE_OPTIONS: Array<{ value: AINotesAssistantLanguage; label: string }> = [
  { value: 'auto', label: 'Auto' },
  { value: 'arabic', label: 'Arabic' },
  { value: 'english', label: 'English' },
  { value: 'french', label: 'French' },
];

const copyToClipboard = async (value: string) => {
  if (!value) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = value;
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
};

const normalizeTextList = (value: string[]) => value.map((item) => item.trim()).filter(Boolean);

const formatTasksForClipboard = (tasks: AINotesAssistantTask[]) => {
  if (!tasks.length) return '';
  return tasks
    .map((task, index) => {
      const parts = [`${index + 1}. ${task.title}`];
      if (task.priority) parts.push(`priority: ${task.priority}`);
      if (task.category) parts.push(`category: ${task.category}`);
      if (task.suggestedDueDate) parts.push(`due: ${task.suggestedDueDate}`);
      if (task.notes) parts.push(`notes: ${task.notes}`);
      return parts.join(' | ');
    })
    .join('\n');
};

const AINotesAssistantPanel: React.FC<{
  note: SmartNote | null;
  blocks: NoteBlock[];
  attachments: NoteAttachment[];
  context: {
    linkedProjectName?: string;
    linkedCompanyName?: string;
    linkedPersonName?: string;
    linkedRelationshipName?: string;
    linkedTaskTitle?: string;
    linkedStrategyGoalTitle?: string;
    linkedPlanTitle?: string;
  };
  noteCategories: NoteCategory[];
  onReplaceContent: (content: string) => Promise<void> | void;
  onAppendToNote: (content: string) => Promise<void> | void;
  onApplyCategoryTags: (input: { categorySlug?: string; categoryName?: string; tags: string[]; priority?: SmartNote['priority']; status?: SmartNote['status'] }) => Promise<void> | void;
  onCreateTasksSuggestion?: (tasks: AINotesAssistantTask[]) => void;
}> = ({ note, blocks, attachments, context, noteCategories, onReplaceContent, onAppendToNote, onApplyCategoryTags, onCreateTasksSuggestion }) => {
  const [mode, setMode] = useState<AINotesAssistantMode>('organize_note');
  const [language, setLanguage] = useState<AINotesAssistantLanguage>('auto');
  const [instructions, setInstructions] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<AINotesAssistantResult | null>(null);
  const [copiedMessage, setCopiedMessage] = useState('');

  const noteSummary = useMemo(() => ({
    id: note?.id || '',
    title: note?.title || '',
    content: note?.content || '',
    categorySlug: note?.categorySlug || '',
    tags: note?.tags || '',
    status: note?.status || 'draft',
    priority: note?.priority || 'medium',
    source: note?.source || '',
    notes: note?.notes || '',
  }), [note]);

  const matchingCategory = useMemo(() => {
    const normalized = (result?.suggestedCategory || '').trim().toLowerCase();
    if (!normalized) return null;
    return noteCategories.find((category) => category.slug.toLowerCase() === normalized || category.name.trim().toLowerCase() === normalized) || null;
  }, [noteCategories, result?.suggestedCategory]);

  const analyze = async () => {
    setError('');
    setCopiedMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/ai?action=notes', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode,
          note: noteSummary,
          blocks: blocks.map((block) => ({
            type: block.type,
            content: block.content,
            dataJson: block.dataJson,
            sortOrder: block.sortOrder,
          })),
          attachments: attachments.map((attachment) => ({
            type: attachment.type,
            title: attachment.title,
            url: attachment.url,
            notes: attachment.notes,
          })),
          context,
          instructions: instructions.trim() || undefined,
          language,
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok || !data?.success) {
        const message = String(data?.error || 'AI could not process this note. Review manually.');
        if (response.status === 401) {
          throw new Error('Authentication required. Please log in again.');
        }
        if (/quota/i.test(message) || response.status === 429) {
          throw new Error('AI quota exceeded. Try again later or change AI model.');
        }
        if (/disabled/i.test(message)) {
          throw new Error('AI is disabled for notes.');
        }
        throw new Error(message);
      }

      const normalized: AINotesAssistantResult = {
        summary: String(data?.result?.summary || ''),
        improvedContent: String(data?.result?.improvedContent || ''),
        keyPoints: normalizeTextList(Array.isArray(data?.result?.keyPoints) ? data.result.keyPoints.map(String) : []),
        suggestedTasks: Array.isArray(data?.result?.suggestedTasks)
          ? data.result.suggestedTasks.map((task: any) => ({
              title: String(task?.title || '').trim(),
              priority: String(task?.priority || '').trim(),
              category: String(task?.category || '').trim(),
              suggestedDueDate: String(task?.suggestedDueDate || '').trim(),
              notes: String(task?.notes || '').trim(),
            })).filter((task: AINotesAssistantTask) => Boolean(task.title))
          : [],
        suggestedCategory: String(data?.result?.suggestedCategory || '').trim(),
        suggestedTags: normalizeTextList(Array.isArray(data?.result?.suggestedTags) ? data.result.suggestedTags.map(String) : []),
        nextActions: normalizeTextList(Array.isArray(data?.result?.nextActions) ? data.result.nextActions.map(String) : []),
      };

      setResult(normalized);
      if (onCreateTasksSuggestion && normalized.suggestedTasks.length > 0) {
        onCreateTasksSuggestion(normalized.suggestedTasks);
      }
    } catch (analysisError) {
      setError(analysisError instanceof Error ? analysisError.message : 'AI could not process this note. Review manually.');
      setResult(null);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyImprovedContent = async () => {
    if (!result?.improvedContent) return;
    await copyToClipboard(result.improvedContent);
    setCopiedMessage('Improved content copied.');
  };

  const handleReplaceContent = async () => {
    if (!result?.improvedContent) return;
    const confirmed = window.confirm('Replace the note content with the AI result?');
    if (!confirmed) return;
    await onReplaceContent(result.improvedContent);
    setCopiedMessage('Note content replaced.');
  };

  const handleAppendSummary = async () => {
    if (!result?.summary && !result?.keyPoints.length) return;
    const summaryLines = [`AI Summary — ${new Date().toISOString().slice(0, 10)}:`, result.summary || 'No summary provided.'];
    if (result.keyPoints.length) {
      summaryLines.push('');
      summaryLines.push(...result.keyPoints.map((point) => `- ${point}`));
    }
    await onAppendToNote(`\n\n${summaryLines.join('\n')}`);
    setCopiedMessage('Summary appended to the note.');
  };

  const handleApplyCategoryTags = async () => {
    const categorySlugOrName = result?.suggestedCategory?.trim() || '';
    const tags = normalizeTextList(result?.suggestedTags || []);
    const category = matchingCategory;

    await onApplyCategoryTags({
      categorySlug: category?.slug || (categorySlugOrName || undefined),
      categoryName: category?.name || categorySlugOrName || undefined,
      tags,
      priority: result?.suggestedTasks[0]?.priority?.toLowerCase() as SmartNote['priority'] | undefined,
      status: note?.status,
    });
    setCopiedMessage('Category and tags applied.');
  };

  const handleCopyTasks = async () => {
    if (!result?.suggestedTasks.length) return;
    await copyToClipboard(formatTasksForClipboard(result.suggestedTasks));
    setCopiedMessage('Suggested tasks copied.');
  };

  return (
    <div className="space-y-4">
      <div className={`${shellClass} p-4 lg:p-5`}>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-[#64748b]">AI Notes Assistant</div>
            <h3 className="mt-2 text-2xl font-semibold text-[#0f172a]">Organize and improve notes with review-first AI</h3>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[#64748b]">
              AI Notes Assistant helps organize and improve notes. Review before applying.
            </p>
          </div>
          <div className="rounded-xl border border-[#dbeafe] bg-[#eff6ff] px-4 py-3 text-sm text-[#1d4ed8]">
            Use the assistant to draft changes, then copy or apply them manually.
          </div>
        </div>
      </div>

      <div className={`${shellClass} p-4 lg:p-5`}>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <div className="space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Mode</div>
              <div className="mt-2 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {MODE_OPTIONS.map((option) => {
                  const active = mode === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setMode(option.value)}
                      className={`rounded-2xl border p-4 text-left transition ${active ? 'border-[#bfdbfe] bg-[#eff6ff]' : 'border-[#e5e7eb] bg-white hover:bg-[#f8fafc]'}`}
                    >
                      <div className="text-sm font-semibold text-[#0f172a]">{option.label}</div>
                      <div className="mt-1 text-xs leading-5 text-[#64748b]">{option.description}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="space-y-2 block">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Instructions</div>
              <textarea
                value={instructions}
                onChange={(event) => setInstructions(event.target.value)}
                rows={4}
                className={inputClass}
                placeholder="Tell the assistant exactly how you want the note improved..."
              />
            </label>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-2 block">
                <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Language</div>
                <select value={language} onChange={(event) => setLanguage(event.target.value as AINotesAssistantLanguage)} className={inputClass}>
                  {LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
              </label>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={analyze}
                  disabled={loading}
                  className="w-full rounded-md bg-[#2563eb] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {loading ? 'Analyzing...' : 'Analyze'}
                </button>
              </div>
            </div>

            {error ? <div className="rounded-md border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-sm text-[#b91c1c]">{error}</div> : null}
            {copiedMessage ? <div className="rounded-md border border-[#bfdbfe] bg-[#eff6ff] px-3 py-2 text-sm text-[#1d4ed8]">{copiedMessage}</div> : null}
          </div>

          <div className="space-y-3">
            <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Context</div>
              <div className="mt-3 space-y-2 text-sm text-[#0f172a]">
                <div>Title: {note?.title || 'Untitled note'}</div>
                <div>Blocks: {blocks.length}</div>
                <div>Attachments: {attachments.length}</div>
                {context.linkedProjectName ? <div>Project: {context.linkedProjectName}</div> : null}
                {context.linkedCompanyName ? <div>Company: {context.linkedCompanyName}</div> : null}
                {context.linkedPersonName ? <div>Person: {context.linkedPersonName}</div> : null}
                {context.linkedRelationshipName ? <div>Relationship: {context.linkedRelationshipName}</div> : null}
                {context.linkedTaskTitle ? <div>Task: {context.linkedTaskTitle}</div> : null}
                {context.linkedStrategyGoalTitle ? <div>Goal: {context.linkedStrategyGoalTitle}</div> : null}
                {context.linkedPlanTitle ? <div>Plan: {context.linkedPlanTitle}</div> : null}
              </div>
            </div>

            <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Raw note</div>
              <p className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-6 text-[#0f172a]">
                {note?.content || 'No content yet.'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {result ? (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className={`${shellClass} p-4 lg:p-5`}>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Summary</div>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[#0f172a]">{result.summary || 'No summary returned.'}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={handleCopyImprovedContent} disabled={!result.improvedContent} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50">
                Copy Improved Content
              </button>
              <button type="button" onClick={handleReplaceContent} disabled={!result.improvedContent} className="rounded-md bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50">
                Replace Note Content
              </button>
              <button type="button" onClick={handleAppendSummary} disabled={!result.summary && !result.keyPoints.length} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50">
                Append AI Summary to Note
              </button>
            </div>
          </div>

          <div className={`${shellClass} p-4 lg:p-5`}>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Improved Content</div>
            <p className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap text-sm leading-6 text-[#0f172a]">
              {result.improvedContent || 'No improved content returned.'}
            </p>
          </div>

          <div className={`${shellClass} p-4 lg:p-5`}>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Key Points</div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#0f172a]">
              {result.keyPoints.length ? result.keyPoints.map((point) => <li key={point} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">{point}</li>) : <li className="text-[#64748b]">No key points returned.</li>}
            </ul>
          </div>

          <div className={`${shellClass} p-4 lg:p-5`}>
            <div className="flex items-center justify-between gap-3">
              <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Suggested Tasks</div>
              <button type="button" onClick={handleCopyTasks} disabled={!result.suggestedTasks.length} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-xs font-semibold text-[#0f172a] hover:bg-[#f8fafc] disabled:cursor-not-allowed disabled:opacity-50">
                Copy Suggested Tasks
              </button>
            </div>
            <div className="mt-3 space-y-3">
              {result.suggestedTasks.length ? result.suggestedTasks.map((task, index) => (
                <div key={`${task.title}-${index}`} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] p-3">
                  <div className="text-sm font-semibold text-[#0f172a]">{task.title}</div>
                  <div className="mt-1 flex flex-wrap gap-2 text-xs text-[#64748b]">
                    {task.priority ? <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">Priority: {task.priority}</span> : null}
                    {task.category ? <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">Category: {task.category}</span> : null}
                    {task.suggestedDueDate ? <span className="rounded-full border border-[#e5e7eb] bg-white px-2 py-1">Due: {task.suggestedDueDate}</span> : null}
                  </div>
                  {task.notes ? <p className="mt-2 text-sm text-[#64748b]">{task.notes}</p> : null}
                </div>
              )) : <p className="text-sm text-[#64748b]">No suggested tasks returned.</p>}
            </div>
          </div>

          <div className={`${shellClass} p-4 lg:p-5`}>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Suggested Category</div>
            <div className="mt-3 text-sm text-[#0f172a]">{matchingCategory?.name || result.suggestedCategory || 'No category suggested.'}</div>
            <div className="mt-4 flex flex-wrap gap-2">
              <button type="button" onClick={handleApplyCategoryTags} disabled={!result.suggestedCategory && !result.suggestedTags.length} className="rounded-md bg-[#2563eb] px-3 py-2 text-xs font-semibold text-white hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50">
                Apply Suggested Category/Tags
              </button>
            </div>
          </div>

          <div className={`${shellClass} p-4 lg:p-5`}>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Suggested Tags</div>
            <div className="mt-3 flex flex-wrap gap-2">
              {result.suggestedTags.length ? result.suggestedTags.map((tag) => (
                <span key={tag} className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]">
                  {tag}
                </span>
              )) : <span className="text-sm text-[#64748b]">No tags suggested.</span>}
            </div>
          </div>

          <div className={`${shellClass} p-4 lg:p-5 lg:col-span-2`}>
            <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[#64748b]">Next Actions</div>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-[#0f172a]">
              {result.nextActions.length ? result.nextActions.map((action) => <li key={action} className="rounded-lg border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2">{action}</li>) : <li className="text-[#64748b]">No next actions returned.</li>}
            </ul>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AINotesAssistantPanel;
