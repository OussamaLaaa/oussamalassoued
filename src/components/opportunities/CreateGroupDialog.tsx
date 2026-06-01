import React, { useState } from 'react';
import { Folder, X } from 'lucide-react';
import type { DesktopGroup, DesktopGroupInput } from '../../types/opportunities';

const GROUP_COLORS = [
 { label: 'Default', value: '' },
 { label: 'Slate', value: '#64748b' },
 { label: 'Red', value: '#ef4444' },
 { label: 'Orange', value: '#f97316' },
 { label: 'Amber', value: '#f59e0b' },
 { label: 'Lime', value: '#84cc16' },
 { label: 'Green', value: '#22c55e' },
 { label: 'Teal', value: '#14b8a6' },
 { label: 'Cyan', value: '#06b6d4' },
 { label: 'Blue', value: '#3b82f6' },
 { label: 'Indigo', value: '#6366f1' },
 { label: 'Violet', value: '#8b5cf6' },
 { label: 'Fuchsia', value: '#d946ef' },
 { label: 'Pink', value: '#ec4899' },
];

interface Props {
 onSave: (input: DesktopGroupInput) => Promise<void>;
 onClose: () => void;
 editing?: DesktopGroup | null;
}

const CreateGroupDialog: React.FC<Props> = ({ onSave, onClose, editing }) => {
 const [name, setName] = useState(editing?.name ?? '');
 const [color, setColor] = useState(editing?.color ?? '');
 const [notes, setNotes] = useState(editing?.notes ?? '');
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError(null);

 if (!name.trim()) {
 setError('Group name is required.');
 return;
 }

 setSaving(true);
 try {
 await onSave({
 name: name.trim(),
 color: color || undefined,
 notes: notes.trim() || undefined,
 });
 onClose();
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to save group.');
 } finally {
 setSaving(false);
 }
 };

 return (
 <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/20">
 <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
 <h2 className="text-sm font-semibold text-neutral-900">
 {editing ? 'Edit Group' : 'Create Group'}
 </h2>
 <button
 type="button"
 onClick={onClose}
 className="flex h-7 w-7 items-center justify-center rounded-md border border-transparent text-neutral-500 transition-colors hover:border-neutral-200 hover:text-neutral-900"
 >
 <X className="h-4 w-4" />
 </button>
 </div>

 <form onSubmit={handleSubmit} className="space-y-4 px-5 py-4">
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-neutral-700">Group Name</label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="Work, Social, Tools..."
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300"
 />
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-neutral-700">Color <span className="text-neutral-400">(optional)</span></label>
 <div className="flex flex-wrap gap-2">
 {GROUP_COLORS.map((c) => (
 <button
 key={c.value || '__default'}
 type="button"
 onClick={() => setColor(c.value)}
 title={c.label}
 className={`flex h-7 w-7 items-center justify-center rounded-full border transition-all ${
 color === c.value
 ? 'border-neutral-900'
 : 'border-neutral-200 hover:border-neutral-300'
 }`}
 style={c.value ? { backgroundColor: c.value } : undefined}
 >
 {!c.value && <Folder className="h-3.5 w-3.5 text-neutral-400" />}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-neutral-700">Notes <span className="text-neutral-400">(optional)</span></label>
 <textarea
 value={notes}
 onChange={(e) => setNotes(e.target.value)}
 rows={2}
 placeholder="Add a note..."
 className="w-full resize-none rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300"
 />
 </div>

 {error && (
 <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
 {error}
 </div>
 )}

 <div className="flex items-center justify-end gap-2 border-t border-neutral-100 pt-4">
 <button
 type="button"
 onClick={onClose}
 className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
 >
 Cancel
 </button>
 <button
 type="submit"
 disabled={saving}
 className="rounded-lg border border-transparent bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:opacity-50"
 >
 {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create Group'}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};

export default CreateGroupDialog;
