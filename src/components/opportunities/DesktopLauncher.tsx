import React, { useContext, useEffect, useRef, useState } from 'react';
import type { LucideIcon, LucideProps } from 'lucide-react';
import {
  Bell,
  CalendarDays,
  CheckSquare,
  CircleUserRound,
  Compass,
  FileText,
  FolderKanban,
  Heart,
  LayoutGrid,
  Leaf,
  MessageSquare,
  Settings,
  Share2,
  Sparkles,
  StickyNote,
  Wallet,
} from 'lucide-react';
import { AuthContext } from '../personal/PersonalAuthGate';

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
  { id: 'messages', label: 'Messages', icon: MessageSquare },
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

function TopBarButton({ icon: Icon, label }: { icon: LucideIcon; label: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-transparent text-neutral-500 transition-colors hover:border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900"
    >
      <Icon className="h-[15px] w-[15px]" {...iconProps} />
    </button>
  );
}

function AppTile({ label, icon: Icon, onOpen }: AppShortcut & { onOpen?: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex min-w-0 flex-col items-center justify-start gap-2 rounded-xl px-2 py-2 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-neutral-900/10"
    >
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl border border-neutral-200 bg-white text-neutral-900 transition-colors group-hover:border-neutral-300 group-hover:bg-neutral-50">
        <Icon className="h-7 w-7" {...iconProps} />
      </span>
      <span className="w-full max-w-[6.5rem] text-xs font-medium leading-tight text-neutral-700 transition-colors group-hover:text-neutral-900">
        {label}
      </span>
    </button>
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

const DesktopLauncher: React.FC<{ onLaunchApp: (appId: AppId) => void }> = ({ onLaunchApp }) => {
  return (
    <div className="flex min-h-screen w-full flex-col overflow-x-hidden bg-white text-neutral-900">
      <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/95 backdrop-blur-sm">
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
            <TopBarButton icon={Bell} label="Notifications" />
            <TopBarButton icon={Settings} label="Settings" />
            <ProfileDropdown />
          </div>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex-1 flex items-center justify-center py-6 sm:py-10">
          <div className="grid w-full max-w-5xl grid-cols-2 gap-x-4 gap-y-8 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6">
            {APPS.map((app) => (
              <AppTile key={app.id} {...app} onOpen={() => onLaunchApp(app.id)} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default DesktopLauncher;
