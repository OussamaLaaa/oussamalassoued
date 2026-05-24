import React from 'react';
import type { NoteAttachment, SmartNote } from '../../types/opportunities';

const badgeClass = (kind?: string) => {
  const value = String(kind || '').toLowerCase();
  if (['pinned', 'high'].includes(value)) return 'border-[#bfdbfe] bg-[#eff6ff] text-[#1d4ed8]';
  if (['archived', 'low'].includes(value)) return 'border-[#e2e8f0] bg-[#f8fafc] text-[#475569]';
  if (['draft', 'medium'].includes(value)) return 'border-[#fde68a] bg-[#fffbeb] text-[#a16207]';
  return 'border-[#dbeafe] bg-[#eff6ff] text-[#2563eb]';
};

const NoteWorkspace: React.FC<{
  note: SmartNote | null;
  attachments: NoteAttachment[];
  onBack: () => void;
  onEdit: (note: SmartNote) => void;
  onDelete: (id: string) => void | Promise<void>;
  onAddAttachment: (note?: SmartNote) => void;
  onEditAttachment: (attachment: NoteAttachment) => void;
  onDeleteAttachment: (id: string) => void | Promise<void>;
}> = ({ note, attachments, onBack, onEdit, onDelete, onAddAttachment, onEditAttachment, onDeleteAttachment }) => {
  if (!note) {
    return (
      <div className="rounded-2xl border border-dashed border-[#dbeafe] bg-[#f8fafc] p-6 text-sm text-[#64748b]">
        Select a note to open the workspace.
      </div>
    );
  }

  const linkedItems = [
    note.linkedProjectName ? { label: 'Project', value: note.linkedProjectName } : null,
    note.linkedCompanyName ? { label: 'Company', value: note.linkedCompanyName } : null,
    note.linkedPersonName ? { label: 'Person', value: note.linkedPersonName } : null,
    note.linkedRelationshipName ? { label: 'Relationship', value: note.linkedRelationshipName } : null,
    note.linkedTaskTitle ? { label: 'Task', value: note.linkedTaskTitle } : null,
    note.linkedStrategyGoalTitle ? { label: 'Goal', value: note.linkedStrategyGoalTitle } : null,
    note.linkedPlanTitle ? { label: 'Plan', value: note.linkedPlanTitle } : null,
  ].filter(Boolean) as Array<{ label: string; value: string }>;

  return (
    <div className="space-y-4 rounded-2xl border border-[#e5e7eb] bg-white p-5 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeClass(note.status)}`}>{note.status}</span>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${badgeClass(note.priority)}`}>{note.priority}</span>
            {note.categoryName ? <span className="rounded-full border border-[#dbeafe] bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]">{note.categoryName}</span> : null}
          </div>
          <h3 className="mt-3 text-2xl font-semibold text-[#0f172a]">{note.title}</h3>
          {note.source ? <p className="mt-2 text-sm text-[#64748b]">Source: {note.source}</p> : null}
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          <button type="button" onClick={onBack} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-2 text-sm text-[#0f172a] hover:bg-[#f8fafc]">
            Back
          </button>
          <button type="button" onClick={() => onEdit(note)} className="rounded-md border border-[#dbeafe] bg-[#eff6ff] px-3 py-2 text-sm text-[#1d4ed8] hover:bg-[#dbeafe]">
            Edit
          </button>
          <button type="button" onClick={() => onAddAttachment(note)} className="rounded-md bg-[#2563eb] px-3 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8]">
            Add Attachment
          </button>
        </div>
      </div>

      {note.content ? <div className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4 text-sm leading-6 text-[#334155] whitespace-pre-wrap">{note.content}</div> : null}

      {linkedItems.length > 0 ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Linked Context</div>
          <div className="flex flex-wrap gap-2">
            {linkedItems.map((item) => (
              <span key={`${item.label}-${item.value}`} className="rounded-full border border-[#e5e7eb] bg-[#fafafa] px-3 py-1 text-xs text-[#475569]">
                <span className="font-medium text-[#0f172a]">{item.label}:</span> {item.value}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      {note.tags ? (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Tags</div>
          <div className="flex flex-wrap gap-2">
            {note.tags.split(',').map((tag) => tag.trim()).filter(Boolean).map((tag) => (
              <span key={tag} className="rounded-full border border-[#e5e7eb] bg-white px-3 py-1 text-xs text-[#475569]">{tag}</span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold uppercase tracking-[0.14em] text-[#64748b]">Attachments</div>
          <span className="text-xs text-[#64748b]">{attachments.length} item{attachments.length === 1 ? '' : 's'}</span>
        </div>
        {attachments.length > 0 ? (
          <div className="space-y-3">
            {attachments.map((attachment) => (
              <div key={attachment.id} className="rounded-xl border border-[#e5e7eb] bg-[#f8fafc] p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-medium text-[#0f172a]">{attachment.title || attachment.url}</div>
                    <div className="mt-1 text-xs uppercase tracking-[0.12em] text-[#64748b]">{attachment.type}</div>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => onEditAttachment(attachment)} className="rounded-md border border-[#e5e7eb] bg-white px-3 py-1.5 text-xs text-[#0f172a] hover:bg-[#f8fafc]">
                      Edit
                    </button>
                    <button type="button" onClick={() => onDeleteAttachment(attachment.id)} className="rounded-md border border-[#fee2e2] bg-[#fff1f2] px-3 py-1.5 text-xs text-[#b91c1c] hover:bg-[#fee2e2]">
                      Delete
                    </button>
                  </div>
                </div>
                <a href={attachment.url} target="_blank" rel="noreferrer" className="mt-3 block break-all text-sm text-[#2563eb] hover:underline">
                  {attachment.url}
                </a>
                {attachment.notes ? <p className="mt-2 text-sm text-[#64748b]">{attachment.notes}</p> : null}
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-[#dbeafe] bg-[#f8fafc] px-4 py-5 text-sm text-[#64748b]">
            No attachments yet.
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-3 border-t border-[#e5e7eb] pt-4">
        <div className="text-xs text-[#64748b]">Created {note.createdAt ? new Date(note.createdAt).toLocaleString() : 'recently'}</div>
        <button type="button" onClick={() => onDelete(note.id)} className="rounded-md border border-[#fee2e2] bg-[#fff1f2] px-3 py-2 text-sm text-[#b91c1c] hover:bg-[#fee2e2]">
          Delete Note
        </button>
      </div>
    </div>
  );
};

export default NoteWorkspace;
