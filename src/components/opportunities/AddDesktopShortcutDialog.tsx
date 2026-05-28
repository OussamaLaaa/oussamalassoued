import React, { useEffect, useMemo, useState } from 'react';
import { Folder, Globe, X } from 'lucide-react';
import type { DesktopGroup, DesktopShortcut, DesktopShortcutInput } from '../../types/opportunities';

const isValidUrl = (url: string) => {
 try {
 const u = new URL(url);
 return u.protocol === 'http:' || u.protocol === 'https:';
 } catch {
 return false;
 }
};

const normalizeUrl = (url: string) => {
 const trimmed = url.trim();
 if (!trimmed) return '';
 if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
 return `https://${trimmed}`;
};

const getHostname = (url: string) => {
 try {
 return new URL(url).hostname;
 } catch {
 return '';
 }
};

const getFaviconUrl = (url: string) => {
 const hostname = getHostname(url);
 if (!hostname) return '';
 return `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;
};

interface Props {
 onSave: (input: DesktopShortcutInput) => Promise<void>;
 onClose: () => void;
 editing?: DesktopShortcut | null;
 groupId?: string;
 allowGroupSelect?: boolean;
 desktopGroups?: DesktopGroup[];
}

const AddDesktopShortcutDialog: React.FC<Props> = ({ onSave, onClose, editing, groupId, allowGroupSelect, desktopGroups = [] }) => {
 const [name, setName] = useState(editing?.name ?? '');
 const [url, setUrl] = useState(editing?.url ?? '');
 const [notes, setNotes] = useState(editing?.notes ?? '');
 const [selectedGroupId, setSelectedGroupId] = useState(groupId ?? editing?.groupId ?? '');
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const normalizedUrl = useMemo(() => {
 if (!url.trim()) return '';
 return normalizeUrl(url);
 }, [url]);

 const hostname = useMemo(() => {
 if (!normalizedUrl) return '';
 return getHostname(normalizedUrl);
 }, [normalizedUrl]);

 const faviconUrl = useMemo(() => {
 if (!normalizedUrl) return '';
 return getFaviconUrl(normalizedUrl);
 }, [normalizedUrl]);

 useEffect(() => {
 if (!editing && hostname && !name.trim()) {
 const suggested = hostname
 .replace(/^www\./, '')
 .split('.')[0]
 .charAt(0).toUpperCase() + hostname.replace(/^www\./, '').split('.')[0].slice(1);
 setName(suggested);
 }
 }, [hostname, editing, name]);

 const [faviconFailed, setFaviconFailed] = useState(false);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError(null);

 const finalUrl = normalizeUrl(url);
 if (!finalUrl) {
 setError('URL is required.');
 return;
 }
 if (!isValidUrl(finalUrl)) {
 setError('Please enter a valid http or https URL.');
 return;
 }
 if (!name.trim()) {
 setError('Name is required.');
 return;
 }

 setSaving(true);
 try {
 await onSave({
 kind: 'website',
 name: name.trim(),
 url: finalUrl,
 iconUrl: faviconUrl || undefined,
 faviconSource: faviconUrl ? 'google_s2' : undefined,
 notes: notes.trim() || undefined,
 groupId: selectedGroupId || null,
 });
 onClose();
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to save shortcut.');
 } finally {
 setSaving(false);
 }
 };

 return (
 <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/20">
 <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
 <h2 className="text-sm font-semibold text-neutral-900">
 {editing ? 'Edit Shortcut' : 'Add Website Shortcut'}
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
 <label className="text-xs font-medium text-neutral-700">URL</label>
 <input
 type="text"
 value={url}
 onChange={(e) => { setUrl(e.target.value); setFaviconFailed(false); }}
 placeholder="https://youtube.com"
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300"
 />
 </div>

 {faviconUrl && !faviconFailed && (
 <div className="flex items-center gap-2.5 rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
 <img
 src={faviconUrl}
 alt=""
 className="h-5 w-5"
 onError={() => setFaviconFailed(true)}
 />
 <span className="text-xs text-neutral-500">Favicon detected</span>
 </div>
 )}

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-neutral-700">Name</label>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 placeholder="YouTube"
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300"
 />
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

 {allowGroupSelect && desktopGroups.length > 0 && (
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-neutral-700">Group <span className="text-neutral-400">(optional)</span></label>
 <div className="relative">
 <select
 value={selectedGroupId}
 onChange={(e) => setSelectedGroupId(e.target.value)}
 className="w-full appearance-none rounded-lg border border-neutral-200 bg-white px-3 py-2 pr-8 text-sm text-neutral-900 outline-none transition-colors focus:border-neutral-300"
 >
 <option value="">No group</option>
 {desktopGroups.map((g) => (
 <option key={g.id} value={g.id}>{g.name}</option>
 ))}
 </select>
 <Folder className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-400" />
 </div>
 </div>
 )}

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
 {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Shortcut'}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
};

export default AddDesktopShortcutDialog;
