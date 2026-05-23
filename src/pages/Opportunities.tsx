import React, { useEffect, useState } from 'react';
import OpportunitiesLayout from '../components/opportunities/OpportunitiesLayout';
import { useOpportunitiesData } from '../hooks/useOpportunitiesData';
import { checkDashboardAuth, loginToDashboard } from '../utils/apiClient';

const STORAGE_KEY = 'opportunities-theme';

const OpportunitiesPage: React.FC = () => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const opportunitiesData = useOpportunitiesData(isUnlocked);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw === 'dark') return 'dark';
    } catch {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    let mounted = true;

    const verifySession = async () => {
      setIsCheckingAuth(true);
      const authenticated = await checkDashboardAuth();
      if (!mounted) return;
      setIsUnlocked(authenticated);
      setIsCheckingAuth(false);
    };

    void verifySession();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    try {
      document.body.classList.add('opportunities-page');
    } catch {}
    return () => {
      try {
        document.body.classList.remove('opportunities-page');
      } catch {}
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {}
    // update shell class if present
    const shell = document.querySelector('.opportunities-shell');
    if (shell) {
      shell.classList.remove('opportunities-light', 'opportunities-dark');
      shell.classList.add(theme === 'light' ? 'opportunities-light' : 'opportunities-dark');
    }
  }, [theme]);

  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAuthError('');

    if (!password.trim()) {
      setAuthError('Please enter the dashboard password.');
      return;
    }

    const result = await loginToDashboard(password);
    if (!result.authenticated) {
      setAuthError(result.error || 'Invalid password.');
      return;
    }

    setIsUnlocked(true);
    setPassword('');
  };

  if (isCheckingAuth) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <div className="rounded-lg border border-[#e5e7eb] bg-white px-5 py-4 text-sm text-[#334155] shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          Checking access...
        </div>
      </main>
    );
  }

  if (!isUnlocked) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#f8fafc] px-4">
        <form
          onSubmit={handleLogin}
          className="w-full max-w-[420px] rounded-xl border border-[#e5e7eb] bg-white p-6 shadow-[0_22px_50px_-38px_rgba(15,23,42,0.45)]"
        >
          <h1 className="text-sm font-mono uppercase tracking-[0.2em] text-[#0f172a]">Opportunities Access</h1>
          <p className="mt-3 text-sm text-[#475569]">Please enter your dashboard password to continue.</p>

          <label className="mt-5 flex flex-col gap-2">
            <span className="text-xs font-mono uppercase tracking-[0.14em] text-[#64748b]">Password</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-md border border-[#cbd5e1] bg-white px-3 py-2 text-[#0f172a] outline-none focus:border-[#2563eb] focus:ring-2 focus:ring-[#2563eb]/15"
              autoFocus
            />
          </label>

          {authError ? <p className="mt-3 text-sm text-[#b91c1c]">{authError}</p> : null}

          <button
            type="submit"
            className="mt-5 inline-flex items-center justify-center rounded-md bg-[#2563eb] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1d4ed8]"
          >
            Unlock
          </button>
        </form>
      </main>
    );
  }

  return (
    <div className={`opportunities-shell min-h-screen w-full relative z-[9999] overflow-x-hidden ${theme === 'light' ? 'opportunities-light' : 'opportunities-dark'}`}>
      <OpportunitiesLayout theme={theme} setTheme={setTheme} data={opportunitiesData} />
    </div>
  );
};

export default OpportunitiesPage;
