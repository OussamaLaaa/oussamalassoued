import React, { useEffect, useState } from 'react';
import { ArrowLeft, Edit3, Folder, MoreHorizontal, Plus, Trash2, X } from 'lucide-react';
import type { DesktopGroup, DesktopShortcut } from '../../types/opportunities';

interface Props {
  group: DesktopGroup;
  shortcuts: DesktopShortcut[];
  onBack: () => void;
  onEditGroup: (group: DesktopGroup) => void;
  onDeleteGroup: (group: DesktopGroup) => void;
  onAddShortcut: (groupId?: string) => void;
  onEditShortcut: (shortcut: DesktopShortcut) => void;
  onDeleteShortcut: (shortcut: DesktopShortcut) => void;
  onRemoveFromGroup: (shortcut: DesktopShortcut) => void;
  iconSizeClass: string;
  iconInnerSize: string;
}

function GroupShortcutTile({
  shortcut,
  iconSizeClass,
  iconInnerSize,
  onEdit,
  onDelete,
  onRemoveFromGroup,
}: {
  shortcut: DesktopShortcut;
  iconSizeClass: string;
  iconInnerSize: string;
  onEdit: (s: DesktopShortcut) => void;
  onDelete: (s: DesktopShortcut) => void;
  onRemoveFromGroup: (s: DesktopShortcut) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [imgError, setImgError] = useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    if (menuOpen) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const handleOpen = () => {
    if (!shortcut.url) return;
    const u = shortcut.url.startsWith('http://') || shortcut.url.startsWith('https://') ? shortcut.url : `https://${shortcut.url}`;
    window.open(u, '_blank', 'noopener,noreferrer');
  };

  const displayChar = shortcut.name.charAt(0).toUpperCase();

  return (
    <div className="relative flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-2 py-2">
      <button
        type="button"
        onClick={handleOpen}
        className="group flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-2 py-2 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900/10"
      >
        <span className={`flex items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-900 transition-colors group-hover:border-neutral-300 group-hover:bg-neutral-50 ${iconSizeClass}`}>
          {shortcut.iconUrl && !imgError ? (
            <img src={shortcut.iconUrl} alt="" className={iconInnerSize} onError={() => setImgError(true)} />
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
          <div className="absolute right-0 top-7 z-30 w-32 rounded-xl border border-neutral-200 bg-white py-1">
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onEdit(shortcut); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => { setMenuOpen(false); onRemoveFromGroup(shortcut); }}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-xs text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              Remove from group
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

const DesktopGroupPanel: React.FC<Props> = ({
  group,
  shortcuts,
  onBack,
  onEditGroup,
  onDeleteGroup,
  onAddShortcut,
  onEditShortcut,
  onDeleteShortcut,
  onRemoveFromGroup,
  iconSizeClass,
  iconInnerSize,
}) => {
  return (
    <div className="flex-1 flex items-center justify-center py-6 sm:py-10">
      <div className="w-full max-w-5xl">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-500 transition-colors hover:border-neutral-300 hover:text-neutral-700"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-neutral-200 bg-white"
              style={group.color ? { borderColor: group.color } : undefined}
            >
              <Folder className="h-5 w-5" style={group.color ? { color: group.color } : undefined} />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">{group.name}</h2>
              <p className="text-xs text-neutral-500">{shortcuts.length} shortcut{shortcuts.length !== 1 ? 's' : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onEditGroup(group)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-neutral-700 transition-colors hover:bg-neutral-50"
            >
              <Edit3 className="h-3.5 w-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => onDeleteGroup(group)}
              className="flex h-8 items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-3 text-xs font-medium text-red-600 transition-colors hover:bg-neutral-50"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
          {shortcuts.map((shortcut) => (
            <GroupShortcutTile
              key={shortcut.id}
              shortcut={shortcut}
              iconSizeClass={iconSizeClass}
              iconInnerSize={iconInnerSize}
              onEdit={onEditShortcut}
              onDelete={onDeleteShortcut}
              onRemoveFromGroup={onRemoveFromGroup}
            />
          ))}

          <button
            type="button"
            onClick={() => onAddShortcut(group.id)}
            className="group flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-2 py-2 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900/10"
          >
            <span className={`flex items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white text-neutral-400 transition-colors group-hover:border-neutral-400 group-hover:bg-neutral-50 ${iconSizeClass}`}>
              <Plus className={iconInnerSize} strokeWidth={1.5} />
            </span>
            <span className="w-full max-w-[6.5rem] text-xs font-medium leading-tight text-neutral-500 transition-colors group-hover:text-neutral-700">
              Add
            </span>
          </button>
        </div>

        {shortcuts.length === 0 && (
          <div className="mt-12 flex flex-col items-center gap-2 text-center">
            <Folder className="h-8 w-8 text-neutral-300" />
            <p className="text-sm font-medium text-neutral-500">This group is empty</p>
            <p className="text-xs text-neutral-400">Add shortcuts to this group to get started</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DesktopGroupPanel;
