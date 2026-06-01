import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import {
 Bell,
 CalendarDays,
 CheckSquare,
 Compass,
 FileText,
 Folder,
 FolderKanban,
 Heart,
 LayoutGrid,
 Leaf,
  MoreHorizontal,
 Palette,
 Plus,
 Share2,
 Sparkles,
 StickyNote,
 Wallet,
 X,
} from 'lucide-react';
import { AuthContext } from '../personal/PersonalAuthGate';
import type { DesktopGroup, DesktopGroupInput, DesktopShortcut, DesktopShortcutInput, DesktopSettings, DesktopSettingsInput } from '../../types/opportunities';
import AddDesktopShortcutDialog from './AddDesktopShortcutDialog';
import CreateGroupDialog from './CreateGroupDialog';
import DesktopGroupPanel from './DesktopGroupPanel';
import { usePersonalLanguage } from '../../i18n/usePersonalLanguage';

type AppId = 'desktop' | 'crm' | 'messages' | 'strategy' | 'plans' | 'tasks' | 'projects' | 'finance' | 'documents' | 'social' | 'relationships' | 'life' | 'notes' | 'ai_control';

type AppShortcut = {
 id: Exclude<AppId, 'desktop'>;
 label: string;
 icon: LucideIcon;
};

const iconProps: Partial<LucideProps> = {
 strokeWidth: 1.75,
};

const APPS: AppShortcut[] = [
  { id: 'crm', label: 'CRM', icon: LayoutGrid },
  { id: 'strategy', label: 'Strategy', icon: Compass },
 { id: 'plans', label: 'Plans', icon: CalendarDays },
 { id: 'tasks', label: 'Tasks', icon: CheckSquare },
 { id: 'projects', label: 'Projects', icon: FolderKanban },
 { id: 'finance', label: 'Finance', icon: Wallet },
 { id: 'documents', label: 'Documents', icon: FileText },
 { id: 'social', label: 'Social Media', icon: Share2 },
 { id: 'relationships', label: 'Relationships', icon: Heart },
 { id: 'life', label: 'Life', icon: Leaf },
 { id: 'notes', label: 'Notes', icon: StickyNote },
 { id: 'ai_control', label: 'AI Control', icon: Sparkles },
];

type DragItem = {
 type: 'shortcut' | 'group';
 id: string;
 sourceGroupId?: string | null;
};

function TopBarButton({ icon: Icon, label, onClick }: { icon: LucideIcon; label: string; onClick?: () => void }) {
 return (
 <button
 type="button"
 aria-label={label}
 onClick={onClick}
 className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-neutral-500 transition-colors hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900"
 >
 <Icon className="h-[15px] w-[15px]" {...iconProps} />
 </button>
 );
}

function AppTile({ label, icon: Icon, onOpen, className }: AppShortcut & { onOpen?: () => void; className?: string }) {
 const { t } = usePersonalLanguage();
 return (
 <button
 type="button"
 onClick={onOpen}
 className={`group flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-2 py-2 text-center outline-none transition-colors ${className ?? ''}`}
 >
 <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-900 transition-colors group-hover:border-neutral-300 group-hover:bg-neutral-50">
 <Icon className="h-7 w-7" {...iconProps} />
 </span>
 <span className="w-full max-w-[6.5rem] text-xs font-medium leading-tight text-neutral-700 transition-colors group-hover:text-neutral-900">
 {t(label)}
 </span>
 </button>
 );
}

function WebsiteTile({ shortcut, onEdit, onDelete, isDragging }: { shortcut: DesktopShortcut; onEdit: (s: DesktopShortcut) => void; onDelete: (s: DesktopShortcut) => void; isDragging?: boolean }) {
 const [menuOpen, setMenuOpen] = useState(false);
 const menuRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
 setMenuOpen(false);
 }
 };
 if (menuOpen) document.addEventListener('mousedown', handler);
 return () => document.removeEventListener('mousedown', handler);
 }, [menuOpen]);

 const [imgError, setImgError] = useState(false);

 const handleOpen = useCallback(() => {
 if (isDragging) return;
 if (!shortcut.url) return;
 const u = shortcut.url.startsWith('http://') || shortcut.url.startsWith('https://') ? shortcut.url : `https://${shortcut.url}`;
 window.open(u, '_blank', 'noopener,noreferrer');
 }, [shortcut.url, isDragging]);

 const displayChar = shortcut.name.charAt(0).toUpperCase();

 return (
 <div className={`relative flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-2 py-2 ${isDragging ? 'opacity-40' : ''}`}>
 <button
 type="button"
 onClick={handleOpen}
 className="group flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-2 py-2 text-center outline-none transition-colors"
 >
 <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-900 transition-colors group-hover:border-neutral-300 group-hover:bg-neutral-50">
 {shortcut.iconUrl && !imgError ? (
 <img src={shortcut.iconUrl} alt="" className="h-7 w-7" onError={() => setImgError(true)} />
 ) : (
 <span className="text-lg font-semibold text-neutral-500">{displayChar}</span>
 )}
 </span>
 <span className="w-full max-w-[6.5rem] truncate text-xs font-medium leading-tight text-neutral-700 transition-colors group-hover:text-neutral-900">
 {shortcut.name}
 </span>
 </button>

 <div ref={menuRef} className="absolute right-0 top-1 z-20">
 <button
 type="button"
 onClick={(e) => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
 className="flex h-6 w-6 items-center justify-center rounded-md border border-transparent text-neutral-400 transition-colors hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-700"
 >
 <MoreHorizontal className="h-3.5 w-3.5" />
 </button>
 {menuOpen && (
 <div className="absolute right-0 top-7 z-30 w-28 rounded-xl border border-neutral-200 bg-white py-1">
 <button
 type="button"
 onClick={() => { setMenuOpen(false); onEdit(shortcut); }}
 className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-700 transition-colors hover:bg-neutral-50"
 >
 Edit
 </button>
 <button
 type="button"
 onClick={() => { setMenuOpen(false); onDelete(shortcut); }}
 className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-red-600 transition-colors hover:bg-neutral-50"
 >
 Delete
 </button>
 </div>
 )}
 </div>
 </div>
 );
}

function ProfileDropdown() {
 const auth = useContext(AuthContext);
 const [open, setOpen] = useState(false);
 const ref = useRef<HTMLDivElement>(null);

 useEffect(() => {
 const handler = (e: MouseEvent) => {
 if (ref.current && !ref.current.contains(e.target as Node)) {
 setOpen(false);
 }
 };
 if (open) document.addEventListener('mousedown', handler);
 return () => document.removeEventListener('mousedown', handler);
 }, [open]);

 const displayName = auth?.displayName || auth?.email || '';
 const initials = (auth?.displayName || auth?.email || 'U')
 .split(' ')
 .map((part) => part.charAt(0).toUpperCase())
 .slice(0, 2)
 .join('')
 || 'U';

 return (
 <div ref={ref} className="relative inline-block">
 <button
 type="button"
 aria-label="User avatar"
 onClick={() => setOpen(!open)}
 className="ml-1 inline-flex h-8 w-8 items-center justify-center rounded-full border border-neutral-200 bg-neutral-100 text-xs font-semibold text-neutral-700 transition-colors hover:border-neutral-300 hover:bg-neutral-50"
 >
 {initials}
 </button>
 {open && (
 <div
 className="absolute right-0 z-[9999] mt-1.5 w-56 rounded-xl border border-neutral-200 bg-white py-1"
 onClick={() => setOpen(false)}
 >
 <div className="border-b border-neutral-100 px-3 py-2.5">
 <div className="truncate text-sm font-medium text-neutral-950">
 {auth?.displayName || 'Signed in'}
 </div>
 {auth?.email ? (
 <div className="truncate text-xs text-neutral-500">{auth.email}</div>
 ) : null}
 </div>

 <button
 type="button"
 className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
 >
 Account settings
 </button>

 <button
 type="button"
 className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-neutral-700 transition-colors hover:bg-neutral-50"
 >
 Security
 </button>

 <div className="border-t border-neutral-100" />

 <button
 type="button"
 onClick={() => {
 setOpen(false);
 auth?.handleLogout();
 }}
 className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-neutral-50"
 >
 Logout
 </button>
 </div>
 )}
 </div>
 );
}

function DesktopSettingsDialog({ settings, onSave, onClose }: { settings: DesktopSettings | null; onSave: (input: DesktopSettingsInput) => Promise<void>; onClose: () => void }) {
 const [backgroundType, setBackgroundType] = useState<DesktopSettingsInput['backgroundType']>(settings?.backgroundType ?? 'solid');
 const [backgroundValue, setBackgroundValue] = useState(settings?.backgroundValue ?? '');
 const [backgroundImageUrl, setBackgroundImageUrl] = useState(settings?.backgroundImageUrl ?? '');
 const [iconSize, setIconSize] = useState<DesktopSettingsInput['iconSize']>(settings?.iconSize ?? 'medium');
 const [layoutDensity, setLayoutDensity] = useState<DesktopSettingsInput['layoutDensity']>(settings?.layoutDensity ?? 'comfortable');
 const [saving, setSaving] = useState(false);
 const [error, setError] = useState<string | null>(null);

 const handleSubmit = async (e: React.FormEvent) => {
 e.preventDefault();
 setError(null);

 if (backgroundType === 'image') {
 const url = backgroundImageUrl.trim();
 if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
 setError('Image URL must be http or https.');
 return;
 }
 }

 setSaving(true);
 try {
 await onSave({
 backgroundType,
 backgroundValue: backgroundValue || undefined,
 backgroundImageUrl: backgroundImageUrl || undefined,
 iconSize,
 layoutDensity,
 });
 onClose();
 } catch (err) {
 setError(err instanceof Error ? err.message : 'Failed to save settings.');
 } finally {
 setSaving(false);
 }
 };

 return (
 <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/20">
 <div className="w-full max-w-md rounded-xl border border-neutral-200 bg-white">
 <div className="flex items-center justify-between border-b border-neutral-100 px-5 py-3.5">
 <h2 className="text-sm font-semibold text-neutral-900">Desktop Settings</h2>
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
 <label className="text-xs font-medium text-neutral-700">Background Type</label>
 <div className="flex gap-2">
 {(['solid', 'gradient', 'image'] as const).map((type) => (
 <button
 key={type}
 type="button"
 onClick={() => setBackgroundType(type)}
 className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
 backgroundType === type
 ? 'border-neutral-900 bg-neutral-900 text-white'
 : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
 }`}
 >
 {type.charAt(0).toUpperCase() + type.slice(1)}
 </button>
 ))}
 </div>
 </div>

 {backgroundType === 'solid' && (
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-neutral-700">Color</label>
 <div className="flex gap-2">
 <input
 type="color"
 value={backgroundValue || '#fafafa'}
 onChange={(e) => setBackgroundValue(e.target.value)}
 className="h-9 w-9 cursor-pointer rounded-lg border border-neutral-200 p-0.5"
 />
 <input
 type="text"
 value={backgroundValue}
 onChange={(e) => setBackgroundValue(e.target.value)}
 placeholder="#fafafa"
 className="flex-1 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300"
 />
 </div>
 </div>
 )}

 {backgroundType === 'gradient' && (
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-neutral-700">Gradient CSS value</label>
 <input
 type="text"
 value={backgroundValue}
 onChange={(e) => setBackgroundValue(e.target.value)}
 placeholder="linear-gradient(135deg, #667eea, #764ba2)"
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300"
 />
 </div>
 )}

 {backgroundType === 'image' && (
 <div className="space-y-1.5">
 <label className="text-xs font-medium text-neutral-700">Image URL</label>
 <input
 type="text"
 value={backgroundImageUrl}
 onChange={(e) => setBackgroundImageUrl(e.target.value)}
 placeholder="https://example.com/background.jpg"
 className="w-full rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm text-neutral-900 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-300"
 />
 {backgroundImageUrl && (
 <div className="mt-1 h-20 w-full overflow-hidden rounded-lg border border-neutral-100">
 <img src={backgroundImageUrl} alt="" className="h-full w-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
 </div>
 )}
 </div>
 )}

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-neutral-700">Icon Size</label>
 <div className="flex gap-2">
 {(['small', 'medium', 'large'] as const).map((size) => (
 <button
 key={size}
 type="button"
 onClick={() => setIconSize(size)}
 className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
 iconSize === size
 ? 'border-neutral-900 bg-neutral-900 text-white'
 : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
 }`}
 >
 {size.charAt(0).toUpperCase() + size.slice(1)}
 </button>
 ))}
 </div>
 </div>

 <div className="space-y-1.5">
 <label className="text-xs font-medium text-neutral-700">Layout Density</label>
 <div className="flex gap-2">
 {(['compact', 'comfortable', 'spacious'] as const).map((density) => (
 <button
 key={density}
 type="button"
 onClick={() => setLayoutDensity(density)}
 className={`flex-1 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
 layoutDensity === density
 ? 'border-neutral-900 bg-neutral-900 text-white'
 : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
 }`}
 >
 {density.charAt(0).toUpperCase() + density.slice(1)}
 </button>
 ))}
 </div>
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
 {saving ? 'Saving...' : 'Save Settings'}
 </button>
 </div>
 </form>
 </div>
 </div>
 );
}

const DesktopLauncher: React.FC<{
 onLaunchApp: (appId: AppId) => void;
 desktopShortcuts?: DesktopShortcut[];
 desktopSettings?: DesktopSettings | null;
 addDesktopShortcut?: (input: DesktopShortcutInput) => Promise<any>;
 updateDesktopShortcut?: (id: string, input: Partial<DesktopShortcutInput>) => Promise<any>;
 deleteDesktopShortcut?: (id: string) => Promise<void>;
 updateDesktopSettings?: (input: DesktopSettingsInput) => Promise<any>;
 desktopGroups?: DesktopGroup[];
 addDesktopGroup?: (input: DesktopGroupInput) => Promise<any>;
 updateDesktopGroup?: (id: string, input: Partial<DesktopGroupInput>) => Promise<any>;
 deleteDesktopGroup?: (id: string) => Promise<void>;
 isDesktopLoading?: boolean;
 desktopLoadError?: boolean;
}> = ({ onLaunchApp, desktopShortcuts = [], desktopSettings = null, addDesktopShortcut, updateDesktopShortcut, deleteDesktopShortcut, updateDesktopSettings, desktopGroups = [], addDesktopGroup, updateDesktopGroup, deleteDesktopGroup, isDesktopLoading, desktopLoadError }) => {
 const { t } = usePersonalLanguage();
 const [showAddDialog, setShowAddDialog] = useState(false);
 const [showSettingsDialog, setShowSettingsDialog] = useState(false);
 const [showCreateGroupDialog, setShowCreateGroupDialog] = useState(false);
 const [showBuiltInFallback, setShowBuiltInFallback] = useState(false);
 const [editingShortcut, setEditingShortcut] = useState<DesktopShortcut | null>(null);
 const [editingGroup, setEditingGroup] = useState<DesktopGroup | null>(null);
 const [activeGroup, setActiveGroup] = useState<DesktopGroup | null>(null);
 const [moveGroupId, setMoveGroupId] = useState<string | null>(null);
 const [moveShortcutId, setMoveShortcutId] = useState<string | null>(null);

 // ── Drag state ──
 const [dragItem, setDragItem] = useState<DragItem | null>(null);
 const [dragOverItem, setDragOverItem] = useState<DragItem | null>(null);
 const [isDragging, setIsDragging] = useState(false);
 const [justDragged, setJustDragged] = useState(false);
 const [createGroupFromDrag, setCreateGroupFromDrag] = useState<{ shortcut1: DesktopShortcut; shortcut2: DesktopShortcut } | null>(null);

 const bgStyle = useMemo(() => {
 if (!desktopSettings) return { backgroundColor: '#fafafa' };
 if (desktopSettings.backgroundType === 'solid') {
 return { backgroundColor: desktopSettings.backgroundValue || '#fafafa' };
 }
 if (desktopSettings.backgroundType === 'gradient') {
 return { backgroundImage: desktopSettings.backgroundValue || 'linear-gradient(135deg, #667eea, #764ba2)' };
 }
 if (desktopSettings.backgroundType === 'image') {
 return {
 backgroundImage: `url(${desktopSettings.backgroundImageUrl})`,
 backgroundSize: 'cover',
 backgroundPosition: 'center',
 backgroundRepeat: 'no-repeat',
 };
 }
 return { backgroundColor: '#fafafa' };
 }, [desktopSettings]);

 const itemPadding = useMemo(() => {
 if (!desktopSettings) return 'py-10 sm:py-14';
 if (desktopSettings.layoutDensity === 'compact') return 'py-6 sm:py-8';
 if (desktopSettings.layoutDensity === 'spacious') return 'py-14 sm:py-20';
 return 'py-10 sm:py-14';
 }, [desktopSettings]);

 const iconSizeClass = useMemo(() => {
 if (!desktopSettings) return 'h-16 w-16';
 if (desktopSettings.iconSize === 'small') return 'h-12 w-12';
 if (desktopSettings.iconSize === 'large') return 'h-20 w-20';
 return 'h-16 w-16';
 }, [desktopSettings]);

 const iconInnerSize = useMemo(() => {
 if (!desktopSettings) return 'h-7 w-7';
 if (desktopSettings.iconSize === 'small') return 'h-5 w-5';
 if (desktopSettings.iconSize === 'large') return 'h-9 w-9';
 return 'h-7 w-7';
 }, [desktopSettings]);

 // ── Sort helpers ──
 const sortedUngroupedShortcuts = useMemo(
 () => desktopShortcuts.filter((s) => s.isActive !== false && !s.groupId).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
 [desktopShortcuts]
 );

 const sortedGroups = useMemo(
 () => desktopGroups.filter((g) => g.isActive !== false).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
 [desktopGroups]
 );

 const ungroupedShortcuts = useMemo(
 () => desktopShortcuts.filter((s) => s.isActive !== false && !s.groupId),
 [desktopShortcuts]
 );

 const activeGroupShortcuts = useMemo(
 () => desktopShortcuts.filter((s) => s.isActive !== false && s.groupId === activeGroup?.id).sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)),
 [desktopShortcuts, activeGroup]
 );

 // ── Drag handlers ──
 const resetDragState = useCallback(() => {
 setDragItem(null);
 setDragOverItem(null);
 setIsDragging(false);
 }, []);

 const handleDragStart = useCallback((e: React.DragEvent, type: DragItem['type'], id: string, sourceGroupId?: string | null) => {
 e.dataTransfer.setData('text/plain', JSON.stringify({ type, id, sourceGroupId }));
 e.dataTransfer.effectAllowed = 'move';
 setDragItem({ type, id, sourceGroupId });
 setIsDragging(true);
 setJustDragged(false);
 }, []);

 const handleDragEnd = useCallback(() => {
 resetDragState();
 setJustDragged(true);
 setTimeout(() => setJustDragged(false), 150);
 }, [resetDragState]);

 const handleDragOver = useCallback((e: React.DragEvent, type: DragItem['type'], id: string) => {
 e.preventDefault();
 e.dataTransfer.dropEffect = 'move';
 setDragOverItem({ type, id });
 }, []);

 const handleDragLeave = useCallback(() => {
 setDragOverItem(null);
 }, []);

 const normalizeSortOrder = useCallback((items: Array<{ id: string; sortOrder?: number }>, startIndex = 0) => {
 return items.map((item, i) => ({
 id: item.id,
 sortOrder: startIndex + i,
 }));
 }, []);

 const handleReorderShortcuts = useCallback(async (sourceId: string, targetId: string, items: DesktopShortcut[]) => {
 const sourceIndex = items.findIndex((s) => s.id === sourceId);
 const targetIndex = items.findIndex((s) => s.id === targetId);
 if (sourceIndex === -1 || targetIndex === -1) return;
 const reordered = [...items];
 const [removed] = reordered.splice(sourceIndex, 1);
 reordered.splice(targetIndex, 0, removed);
 const updates = normalizeSortOrder(reordered);
 await Promise.all(updates.map((u) => updateDesktopShortcut?.(u.id, { sortOrder: u.sortOrder })));
 }, [normalizeSortOrder, updateDesktopShortcut]);

 const handleReorderGroups = useCallback(async (sourceId: string, targetId: string) => {
 const sourceIndex = sortedGroups.findIndex((g) => g.id === sourceId);
 const targetIndex = sortedGroups.findIndex((g) => g.id === targetId);
 if (sourceIndex === -1 || targetIndex === -1) return;
 const reordered = [...sortedGroups];
 const [removed] = reordered.splice(sourceIndex, 1);
 reordered.splice(targetIndex, 0, removed);
 const updates = normalizeSortOrder(reordered);
 await Promise.all(updates.map((u) => updateDesktopGroup?.(u.id, { sortOrder: u.sortOrder })));
 }, [sortedGroups, normalizeSortOrder, updateDesktopGroup]);

 const handleMoveToGroup = useCallback(async (shortcutId: string, groupId: string) => {
 const groupShortcuts = desktopShortcuts.filter((s) => s.groupId === groupId && s.isActive !== false);
 const maxSortOrder = Math.max(0, ...groupShortcuts.map((s) => s.sortOrder ?? 0));
 await updateDesktopShortcut?.(shortcutId, { groupId, sortOrder: maxSortOrder + 1 });
 }, [desktopShortcuts, updateDesktopShortcut]);

 const handleDrop = useCallback((e: React.DragEvent, targetType: DragItem['type'], targetId: string) => {
 e.preventDefault();
 if (!dragItem) return;
 if (dragItem.type === 'shortcut' && targetType === 'group') {
 handleMoveToGroup(dragItem.id, targetId);
 } else if (dragItem.type === 'shortcut' && targetType === 'shortcut' && dragItem.id !== targetId) {
 const s1 = desktopShortcuts.find((s) => s.id === dragItem.id);
 const s2 = desktopShortcuts.find((s) => s.id === targetId);
 if (s1 && s2) {
 setCreateGroupFromDrag({ shortcut1: s1, shortcut2: s2 });
 }
 } else if (dragItem.type === 'group' && targetType === 'group' && dragItem.id !== targetId) {
 handleReorderGroups(dragItem.id, targetId);
 }
 resetDragState();
 }, [dragItem, desktopShortcuts, handleMoveToGroup, handleReorderGroups, resetDragState]);

 const handleConfirmCreateGroup = useCallback(async () => {
 if (!createGroupFromDrag) return;
 const { shortcut1, shortcut2 } = createGroupFromDrag;
 try {
 const newGroupRow = await addDesktopGroup?.({ name: 'New Group' });
 if (!newGroupRow) return;
 await Promise.all([
 updateDesktopShortcut?.(shortcut1.id, { groupId: newGroupRow.id, sortOrder: 0 }),
 updateDesktopShortcut?.(shortcut2.id, { groupId: newGroupRow.id, sortOrder: 1 }),
 ]);
 } catch {
 // silent fail
 }
 setCreateGroupFromDrag(null);
 }, [createGroupFromDrag, addDesktopGroup, updateDesktopShortcut]);

 const isDragOver = useCallback((type: DragItem['type'], id: string) => {
 return dragOverItem?.type === type && dragOverItem?.id === id;
 }, [dragOverItem]);

 // ── Existing handlers ──
 const handleAddSave = async (input: DesktopShortcutInput) => {
 if (editingShortcut && updateDesktopShortcut) {
 await updateDesktopShortcut(editingShortcut.id, input);
 } else if (addDesktopShortcut) {
 await addDesktopShortcut(input);
 }
 };

 const handleDeleteShortcut = (shortcut: DesktopShortcut) => {
 if (window.confirm(`Delete "${shortcut.name}" shortcut?`)) {
 deleteDesktopShortcut?.(shortcut.id);
 }
 };

 const handleAddGroup = async (input: DesktopGroupInput) => {
 await addDesktopGroup?.(input);
 };

 const handleEditGroup = async (input: DesktopGroupInput) => {
 if (editingGroup && updateDesktopGroup) {
 await updateDesktopGroup(editingGroup.id, input);
 }
 };

 const handleDeleteGroup = (group: DesktopGroup) => {
 if (window.confirm(`Delete group "${group.name}"? Shortcuts in this group will be ungrouped.`)) {
 const shortcutsInGroup = desktopShortcuts.filter((s) => s.groupId === group.id);
 Promise.all(
 shortcutsInGroup.map((s) => updateDesktopShortcut?.(s.id, { groupId: null }))
 ).then(() => {
 deleteDesktopGroup?.(group.id);
 if (activeGroup?.id === group.id) setActiveGroup(null);
 });
 }
 };

 const handleRemoveFromGroup = (shortcut: DesktopShortcut) => {
 updateDesktopShortcut?.(shortcut.id, { groupId: null });
 };

 // ── Active Group View ──
 if (activeGroup) {
 return (
 <div className="flex min-h-screen w-full flex-col overflow-x-hidden text-neutral-900" style={bgStyle}>
 <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95">
 <div className="mx-auto flex h-11 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
 <div className="flex min-w-0 items-center gap-2.5">
 <span className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-black text-white">
 <span className="block h-1.5 w-1.5 rounded-[2px] bg-white" />
 </span>
 <div className="min-w-0">
 <div className="truncate text-sm font-semibold tracking-tight text-neutral-900">Personal OS</div>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <TopBarButton icon={Bell} label={t("desktop.Notifications", "desktop.Notifications", "Notifications")} />
 <TopBarButton icon={Palette} label={t("desktop.Desktop Settings", "desktop.Desktop Settings", "Desktop Settings")} onClick={() => setShowSettingsDialog(true)} />
 <ProfileDropdown />
 </div>
 </div>
 </header>

 <main className={`mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 ${itemPadding} sm:px-6`}>
 <DesktopGroupPanel
 group={activeGroup}
 shortcuts={activeGroupShortcuts}
 onBack={() => setActiveGroup(null)}
 onEditGroup={(g) => { setEditingGroup(g); setShowCreateGroupDialog(true); }}
 onDeleteGroup={handleDeleteGroup}
 onAddShortcut={(gid) => { setEditingShortcut(null); setMoveGroupId(gid ?? null); setShowAddDialog(true); }}
 onEditShortcut={(s) => { setEditingShortcut(s); setMoveGroupId(s.groupId ?? null); setShowAddDialog(true); }}
 onDeleteShortcut={handleDeleteShortcut}
 onRemoveFromGroup={(s) => {
 if (window.confirm(`Remove "${s.name}" from this group?`)) {
 handleRemoveFromGroup(s);
 }
 }}
 iconSizeClass={iconSizeClass}
 iconInnerSize={iconInnerSize}
 updateDesktopShortcut={updateDesktopShortcut as (id: string, input: Partial<DesktopShortcutInput>) => Promise<any>}
 ungroupedShortcuts={ungroupedShortcuts}
 />
 </main>

 {showAddDialog && (
 <AddDesktopShortcutDialog
 editing={editingShortcut}
 groupId={moveGroupId ?? activeGroup.id}
 onSave={handleAddSave}
 onClose={() => { setShowAddDialog(false); setEditingShortcut(null); setMoveGroupId(null); }}
 />
 )}

 {showSettingsDialog && (
 <DesktopSettingsDialog
 settings={desktopSettings}
 onSave={async (input) => {
 await updateDesktopSettings?.(input);
 setShowSettingsDialog(false);
 }}
 onClose={() => setShowSettingsDialog(false)}
 />
 )}

 {showCreateGroupDialog && (
 <CreateGroupDialog
 editing={editingGroup}
 onSave={handleEditGroup}
 onClose={() => { setShowCreateGroupDialog(false); setEditingGroup(null); }}
 />
 )}
 </div>
 );
 }

 // ── Loading State ──
 if (!showBuiltInFallback && isDesktopLoading) {
 return (
 <div className="flex min-h-screen w-full flex-col overflow-x-hidden text-neutral-900" style={bgStyle}>
 <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95">
 <div className="mx-auto flex h-11 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
 <div className="flex min-w-0 items-center gap-2.5">
 <span className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-black text-white">
 <span className="block h-1.5 w-1.5 rounded-[2px] bg-white" />
 </span>
 <div className="min-w-0">
 <div className="truncate text-sm font-semibold tracking-tight text-neutral-900">Personal OS</div>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <TopBarButton icon={Bell} label={t("desktop.Notifications", "desktop.Notifications", "Notifications")} />
 <TopBarButton icon={Palette} label={t("desktop.Desktop Settings", "desktop.Desktop Settings", "Desktop Settings")} />
 <ProfileDropdown />
 </div>
 </div>
 </header>
 <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 sm:px-6">
 <div className="flex flex-1 flex-col items-center justify-center gap-6">
 <div className="text-sm text-neutral-400">Loading your desktop...</div>
 <div className="grid w-full max-w-5xl grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
 {Array.from({ length: 12 }).map((_, i) => (
 <div key={i} className="flex flex-col items-center gap-2">
 <div className="h-16 w-16 rounded-2xl border border-neutral-200 bg-neutral-50" />
 <div className="h-3 w-14 rounded border border-neutral-200 bg-neutral-50" />
 </div>
 ))}
 </div>
 </div>
 </main>
 </div>
 );
 }

 // ── Error Fallback ──
 if (!showBuiltInFallback && desktopLoadError) {
 return (
 <div className="flex min-h-screen w-full flex-col overflow-x-hidden text-neutral-900" style={bgStyle}>
 <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95">
 <div className="mx-auto flex h-11 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
 <div className="flex min-w-0 items-center gap-2.5">
 <span className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-black text-white">
 <span className="block h-1.5 w-1.5 rounded-[2px] bg-white" />
 </span>
 <div className="min-w-0">
 <div className="truncate text-sm font-semibold tracking-tight text-neutral-900">Personal OS</div>
 </div>
 </div>
 <div className="flex items-center gap-1">
 <ProfileDropdown />
 </div>
 </div>
 </header>
 <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center px-4 sm:px-6">
 <div className="flex flex-col items-center gap-4 text-center">
 <div className="text-sm font-medium text-neutral-900">Desktop items could not be loaded.</div>
 <div className="flex gap-3">
 <button
 type="button"
 onClick={() => window.location.reload()}
 className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-50"
 >
 Retry
 </button>
 <button
 type="button"
 onClick={() => setShowBuiltInFallback(true)}
 className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
 >
 Continue with built-in apps
 </button>
 </div>
 </div>
 </main>
 </div>
 );
 }

 // ── Main Desktop View ──
 return (
 <div className="flex min-h-screen w-full flex-col overflow-x-hidden text-neutral-900" style={bgStyle}>
 <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95">
 <div className="mx-auto flex h-11 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6">
 <div className="flex min-w-0 items-center gap-2.5">
 <span className="flex h-7 w-7 items-center justify-center rounded-md border border-neutral-200 bg-black text-white">
 <span className="block h-1.5 w-1.5 rounded-[2px] bg-white" />
 </span>
 <div className="min-w-0">
 <div className="truncate text-sm font-semibold tracking-tight text-neutral-900">Personal OS</div>
 </div>
 </div>

 <div className="flex items-center gap-1">
 <TopBarButton icon={Bell} label={t("desktop.Notifications", "desktop.Notifications", "Notifications")} />
 <TopBarButton icon={Palette} label={t("desktop.Desktop Settings", "desktop.Desktop Settings", "Desktop Settings")} onClick={() => setShowSettingsDialog(true)} />
 <ProfileDropdown />
 </div>
 </div>
 </header>

 <main className={`mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 ${itemPadding} sm:px-6`}>
 <div className="flex-1 flex items-center justify-center py-6 sm:py-10">
 <div className="grid w-full max-w-5xl grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
 {APPS.map((app) => (
 <AppTile key={app.id} {...app} onOpen={() => { if (!justDragged && !isDragging) onLaunchApp(app.id); }} />
 ))}

 {sortedGroups.map((group) => {
 const count = desktopShortcuts.filter((s) => s.groupId === group.id && s.isActive !== false).length;
 const over = isDragOver('group', group.id);
 const isThisDragging = dragItem?.type === 'group' && dragItem.id === group.id;
 return (
 <div
 key={group.id}
 draggable={!isDragging || isThisDragging}
 onDragStart={(e) => handleDragStart(e, 'group', group.id)}
 onDragEnd={handleDragEnd}
 onDragOver={(e) => handleDragOver(e, 'group', group.id)}
 onDragLeave={handleDragLeave}
 onDrop={(e) => handleDrop(e, 'group', group.id)}
 className={`relative flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-2 py-2 text-center outline-none transition-colors cursor-grab active:cursor-grabbing ${isThisDragging ? 'opacity-40' : ''} ${over ? 'bg-neutral-50' : ''}`}
 >
 <button
 type="button"
 onClick={() => { if (!justDragged && !isDragging) setActiveGroup(group); }}
 className="group flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-2 py-2 text-center outline-none transition-colors"
 >
 <span
 className={`flex h-16 w-16 items-center justify-center rounded-2xl border bg-white text-neutral-900 transition-colors group-hover:bg-neutral-50 ${iconSizeClass} ${over ? 'border-neutral-900' : ''}`}
 style={group.color && !over ? { borderColor: group.color } : over ? undefined : { borderColor: '#e5e5e5' }}
 >
 <Folder className="h-7 w-7" style={group.color && !over ? { color: group.color } : over ? { color: '#171717' } : undefined} strokeWidth={1.5} />
 </span>
 {over && dragItem?.type === 'shortcut' && (
 <span className="absolute inset-0 flex items-center justify-center rounded-xl bg-neutral-900/5 text-[10px] font-medium text-neutral-600">
 Drop to add
 </span>
 )}
 <span className="w-full max-w-[6.5rem] truncate text-xs font-medium leading-tight text-neutral-700 transition-colors group-hover:text-neutral-900">
 {group.name}
 </span>
 <span className="text-[10px] text-neutral-400">{count} item{count !== 1 ? 's' : ''}</span>
 </button>
 </div>
 );
 })}

 {sortedUngroupedShortcuts.map((shortcut) => {
 const over = isDragOver('shortcut', shortcut.id);
 const isThisDragging = dragItem?.type === 'shortcut' && dragItem.id === shortcut.id;
 return (
 <div
 key={shortcut.id}
 draggable={!isDragging || isThisDragging}
 onDragStart={(e) => handleDragStart(e, 'shortcut', shortcut.id, null)}
 onDragEnd={handleDragEnd}
 onDragOver={(e) => handleDragOver(e, 'shortcut', shortcut.id)}
 onDragLeave={handleDragLeave}
 onDrop={(e) => handleDrop(e, 'shortcut', shortcut.id)}
 className={`cursor-grab active:cursor-grabbing ${over ? 'rounded-xl border-2 border-neutral-900 bg-neutral-50' : ''}`}
 >
 <WebsiteTile
 shortcut={shortcut}
 onEdit={(s) => { setEditingShortcut(s); setShowAddDialog(true); }}
 onDelete={handleDeleteShortcut}
 isDragging={isThisDragging}
 />
 </div>
 );
 })}

 <button
 type="button"
 onClick={() => { setEditingShortcut(null); setShowAddDialog(true); }}
 className="group flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-2 py-2 text-center outline-none transition-colors"
 >
 <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-neutral-400 transition-colors group-hover:border-neutral-400 group-hover:bg-neutral-50">
 <Plus className="h-7 w-7" strokeWidth={1.5} />
 </span>
 <span className="w-full max-w-[6.5rem] text-xs font-medium leading-tight text-neutral-500 transition-colors group-hover:text-neutral-700">
 Add
 </span>
 </button>

 <button
 type="button"
 onClick={() => { setEditingGroup(null); setShowCreateGroupDialog(true); }}
 className="group flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-2 py-2 text-center outline-none transition-colors"
 >
 <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-neutral-400 transition-colors group-hover:border-neutral-400 group-hover:bg-neutral-50">
 <Folder className="h-7 w-7" strokeWidth={1.5} />
 </span>
 <span className="w-full max-w-[6.5rem] text-xs font-medium leading-tight text-neutral-500 transition-colors group-hover:text-neutral-700">
 New Group
 </span>
 </button>
 </div>
 </div>
 </main>

 {showAddDialog && (
 <AddDesktopShortcutDialog
 editing={editingShortcut}
 onSave={handleAddSave}
 onClose={() => { setShowAddDialog(false); setEditingShortcut(null); }}
 />
 )}

 {showCreateGroupDialog && (
 <CreateGroupDialog
 editing={editingGroup}
 onSave={editingGroup ? handleEditGroup : handleAddGroup}
 onClose={() => { setShowCreateGroupDialog(false); setEditingGroup(null); }}
 />
 )}

 {showSettingsDialog && (
 <DesktopSettingsDialog
 settings={desktopSettings}
 onSave={async (input) => {
 await updateDesktopSettings?.(input);
 setShowSettingsDialog(false);
 }}
 onClose={() => setShowSettingsDialog(false)}
 />
 )}

 {createGroupFromDrag && (
 <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-neutral-950/20">
 <div className="w-full max-w-sm rounded-xl border border-neutral-200 bg-white p-5">
 <h3 className="text-sm font-semibold text-neutral-900">Create group with these shortcuts?</h3>
 <p className="mt-1.5 text-xs text-neutral-500">
 "{createGroupFromDrag.shortcut1.name}" and "{createGroupFromDrag.shortcut2.name}" will be grouped together.
 </p>
 <div className="mt-4 flex items-center justify-end gap-2">
 <button
 type="button"
 onClick={() => setCreateGroupFromDrag(null)}
 className="rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
 >
 Cancel
 </button>
 <button
 type="button"
 onClick={handleConfirmCreateGroup}
 className="rounded-lg border border-transparent bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
 >
 Create Group
 </button>
 </div>
 </div>
 </div>
 )}
 </div>
 );
};

export default DesktopLauncher;
export type { AppId };
