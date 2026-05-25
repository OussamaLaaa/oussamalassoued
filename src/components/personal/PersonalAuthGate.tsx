import React, { useEffect, useState } from 'react';
import {
  customLogin,
  fetchPersonalAuthStatus,
  personalLogout,
  verifyPersonalSecondFactor,
} from '../../utils/personalAuth';

type PersonalAuthState = {
  success: boolean;
  emailAuthenticated: boolean;
  allowedEmail: boolean;
  secondFactorPassed: boolean;
  email?: string;
  error?: string;
};

const initialState: PersonalAuthState = {
  success: true,
  emailAuthenticated: false,
  allowedEmail: false,
  secondFactorPassed: false,
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
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const refreshStatus = async () => {
    setIsLoading(true);
    try {
      const nextStatus = (await fetchPersonalAuthStatus()) as PersonalAuthState;
      setStatus({
        success: true,
        emailAuthenticated: Boolean(nextStatus.emailAuthenticated),
        allowedEmail: Boolean(nextStatus.allowedEmail),
        secondFactorPassed: Boolean(nextStatus.secondFactorPassed),
        email: nextStatus.email,
      });
      if (!nextStatus.emailAuthenticated) {
        setLoginPassword('');
        setPassword('');
        setRememberDevice(false);
      }
      if (nextStatus.emailAuthenticated && !nextStatus.allowedEmail) {
        setLoginPassword('');
        setPassword('');
      }
      if (nextStatus.emailAuthenticated && nextStatus.allowedEmail && !nextStatus.secondFactorPassed) {
        setPassword('');
      }
      setAuthError('');
    } catch {
      setStatus(initialState);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshStatus();
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void refreshStatus();
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSigningIn(true);
    setAuthError('');
    try {
      const result = await customLogin(email.trim(), loginPassword);
      if (!result.success) {
        setAuthError(result.error || 'Login failed. Try again.');
        return;
      }

      setLoginPassword('');
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
      const response = (await verifyPersonalSecondFactor(password)) as {
        success: boolean;
        error?: string;
      };

      if (!response.success) {
        setAuthError('Invalid password.');
        return;
      }

      setPassword('');
      setRememberDevice(false);
      await refreshStatus();
    } catch {
      setAuthError('Invalid password.');
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await personalLogout();
      setStatus(initialState);
      setEmail('');
      setLoginPassword('');
      setPassword('');
      setRememberDevice(false);
      setAuthError('');
      await refreshStatus();
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return <AuthShell><div className="text-sm text-neutral-600">Checking access...</div></AuthShell>;
  }

  if (!status.emailAuthenticated) {
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

  if (!status.allowedEmail) {
    return (
      <AuthShell>
        <div className="space-y-6">
          <div className="space-y-3">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Personal OS</p>
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-950">Access denied</h1>
            <p className="text-sm leading-6 text-neutral-600">This account does not have access to this workspace.</p>
          </div>

          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex w-full items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-neutral-800"
          >
            Back to sign in
          </button>
        </div>
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
            <span>Remember this device for 30 days</span>
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

  return (
    <div className="relative min-h-screen bg-neutral-50 text-neutral-950">
      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={isLoggingOut}
        className="fixed right-4 top-4 z-[10001] rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-medium uppercase tracking-[0.18em] text-neutral-700 transition-colors hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLoggingOut ? 'Logging out...' : 'Logout'}
      </button>
      {children}
    </div>
  );
};

export default PersonalAuthGate;
