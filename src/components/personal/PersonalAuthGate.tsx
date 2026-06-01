import React, { createContext, useEffect, useState } from 'react';
import {
  customLogin,
  fetchPersonalAuthStatus,
  personalLogout,
  verifyPersonalSecondFactor,
} from '../../utils/personalAuth';

const NAV_STATE_STORAGE_KEY = 'personalOS.navigationState';

type PersonalAuthState = {
  success: boolean;
  mainPasswordPassed: boolean;
  secondFactorPassed: boolean;
  email?: string;
  displayName?: string;
};

const initialState: PersonalAuthState = {
  success: true,
  mainPasswordPassed: false,
  secondFactorPassed: false,
};

type AuthContextValue = {
  handleLogout: () => Promise<void>;
  displayName?: string;
  email?: string;
};

export const AuthContext = createContext<AuthContextValue | null>(null);

const getStatusError = (status: number, fallback: string): string => {
  const statusMessages: Record<number, string> = {
    500: 'Login service is temporarily unavailable.',
    403: 'Access denied.',
    429: 'Too many failed attempts. Try again later.',
  };
  return statusMessages[status] || fallback;
};

const AuthShell: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <main className="min-h-screen bg-[#fafafa] px-4 py-4 text-neutral-950 sm:px-6 sm:py-6">
    <div className="flex min-h-[calc(100vh-2rem)] items-center justify-center sm:min-h-[calc(100vh-3rem)]">
      <div className="w-full max-w-[420px] rounded-2xl border border-neutral-200 bg-white px-6 py-6 sm:px-8 sm:py-8">
        {children}
      </div>
    </div>
  </main>
);

const PersonalAuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<PersonalAuthState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [password, setPassword] = useState('');
  const [rememberDevice, setRememberDevice] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  const refreshStatus = async (showLoading = true) => {
    if (showLoading) setIsLoading(true);
    try {
      const nextStatus = await fetchPersonalAuthStatus();
      setStatus({
        success: true,
        mainPasswordPassed: Boolean(nextStatus.mainPasswordPassed),
        secondFactorPassed: Boolean(nextStatus.secondFactorPassed),
        email: nextStatus.email,
        displayName: nextStatus.displayName,
      });
      if (!nextStatus.mainPasswordPassed) {
        setLoginPassword('');
        setPassword('');
        setRememberDevice(false);
      }
      if (nextStatus.mainPasswordPassed && !nextStatus.secondFactorPassed) {
        setPassword('');
      }
      setAuthError('');
    } catch {
      setStatus(initialState);
    } finally {
      if (showLoading) setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshStatus(true);
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void refreshStatus(false);
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleLogout = async () => {
    try {
      await personalLogout();
      setStatus(initialState);
      setEmail('');
      setLoginPassword('');
      setPassword('');
      setRememberDevice(false);
      setAuthError('');
      await refreshStatus();
    } catch {
      setStatus(initialState);
    }
  };

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSigningIn(true);
    setAuthError('');
    try {
      const result = await customLogin(email.trim(), loginPassword, rememberDevice);
      if (!result.success) {
        setAuthError(getStatusError(result.status || 0, result.error || 'Invalid email or password.'));
        return;
      }

      setLoginPassword('');
      try {
        window.sessionStorage.removeItem(NAV_STATE_STORAGE_KEY);
      } catch {
        // ignore
      }
      await refreshStatus();
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSecondFactorSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingPassword(true);
    setAuthError('');

    try {
      const response = await verifyPersonalSecondFactor(password, rememberDevice);

      if (!response.success) {
        setAuthError('Invalid password.');
        return;
      }

      setPassword('');
      setRememberDevice(false);
      try {
        window.sessionStorage.removeItem(NAV_STATE_STORAGE_KEY);
      } catch {
        // ignore
      }
      await refreshStatus();
    } catch {
      setAuthError('Invalid password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  if (isLoading) {
    return <AuthShell><div className="text-sm text-neutral-600">Checking access...</div></AuthShell>;
  }

  if (!status.mainPasswordPassed) {
    return (
      <AuthShell>
        <form onSubmit={handleSignIn} className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Personal OS</p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Welcome back</h1>
            <p className="text-sm leading-6 text-neutral-600">Sign in to access your workspace.</p>
          </div>

          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="block text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Email</span>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
                placeholder="you@example.com"
              />
            </label>

            <label className="block space-y-2">
              <span className="block text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Password</span>
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                autoComplete="current-password"
                required
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
                placeholder="Enter your password"
              />
            </label>
          </div>

          <label className="flex items-center gap-3 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-0 focus:ring-offset-0"
            />
            <span>Remember this browser for 30 days</span>
          </label>

          {authError ? <p className="text-sm text-red-600">{authError}</p> : null}

          <button
            type="submit"
            disabled={isSigningIn}
            className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSigningIn ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-sm text-neutral-500">Secure access only.</p>
        </form>
      </AuthShell>
    );
  }

  if (!status.secondFactorPassed) {
    return (
      <AuthShell>
        <form onSubmit={handleSecondFactorSubmit} className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Security check</p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Unlock Personal OS</h1>
            <p className="text-sm leading-6 text-neutral-600">Enter your second password to continue.</p>
          </div>

          <label className="block space-y-2">
            <span className="block text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Second password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
              autoComplete="current-password"
              autoFocus
              required
            />
          </label>

          <label className="flex items-center gap-3 text-sm text-neutral-700">
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(event) => setRememberDevice(event.target.checked)}
              className="h-4 w-4 rounded border-neutral-300 text-neutral-950 focus:ring-0 focus:ring-offset-0"
            />
            <span>Remember this browser for 30 days</span>
          </label>

          {authError ? <p className="text-sm text-red-600">{authError}</p> : null}

          <button
            type="submit"
            disabled={isSubmittingPassword}
            className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmittingPassword ? 'Unlocking...' : 'Unlock Personal OS'}
          </button>
        </form>
      </AuthShell>
    );
  }

  const contextValue: AuthContextValue = {
    handleLogout,
    displayName: status.displayName,
    email: status.email,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      <div className="relative min-h-screen bg-neutral-50 text-neutral-950">
        {children}
      </div>
    </AuthContext.Provider>
  );
};

export default PersonalAuthGate;
