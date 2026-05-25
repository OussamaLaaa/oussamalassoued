import React, { useEffect, useState } from 'react';
import { fetchPersonalAuthStatus, getPersonalSupabaseClient, personalLogout, startGooglePersonalLogin, verifyPersonalSecondFactor } from '../../utils/personalAuth';

type PersonalAuthState = {
  success: boolean;
  googleAuthenticated: boolean;
  allowedEmail: boolean;
  secondFactorPassed: boolean;
  email?: string;
  error?: string;
};

const initialState: PersonalAuthState = {
  success: true,
  googleAuthenticated: false,
  allowedEmail: false,
  secondFactorPassed: false,
};

const PersonalAuthGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<PersonalAuthState>(initialState);
  const [isLoading, setIsLoading] = useState(true);
  const [password, setPassword] = useState('');
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
        googleAuthenticated: Boolean(nextStatus.googleAuthenticated),
        allowedEmail: Boolean(nextStatus.allowedEmail),
        secondFactorPassed: Boolean(nextStatus.secondFactorPassed),
        email: nextStatus.email,
      });
      setAuthError('');
      if (!nextStatus.googleAuthenticated && !nextStatus.allowedEmail) {
        setPassword('');
      }
    } catch {
      setStatus(initialState);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void refreshStatus();

    const timer = window.setTimeout(() => {
      void refreshStatus();
    }, 400);

    const supabase = getPersonalSupabaseClient();
    let subscription: { unsubscribe: () => void } | undefined;

    if (supabase) {
      const { data } = supabase.auth.onAuthStateChange(() => {
        void refreshStatus();
      });
      subscription = data.subscription;
    }

    return () => {
      window.clearTimeout(timer);
      subscription?.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const onFocus = () => {
      void refreshStatus();
    };

    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, []);

  const handleGoogleSignIn = async () => {
    setIsSigningIn(true);
    setAuthError('');
    try {
      const result = await startGooglePersonalLogin();
      if (!result.success) {
        setAuthError(result.error || 'Unable to start Google sign-in.');
      }
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
        setAuthError(response.error || 'Invalid password.');
        return;
      }

      setPassword('');
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
      setPassword('');
      setAuthError('');
      await refreshStatus();
    } finally {
      setIsLoggingOut(false);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-950">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-8 text-sm text-neutral-600">
            Checking Personal OS access...
          </div>
        </div>
      </main>
    );
  }

  if (!status.googleAuthenticated) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-950">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-8">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Personal OS</p>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Sign in with Google to continue.</h1>
              <p className="text-sm text-neutral-600">Use an allowed account to access the internal workspace.</p>
            </div>

            {authError ? <p className="mt-4 text-sm text-red-600">{authError}</p> : null}

            <button
              type="button"
              onClick={() => void handleGoogleSignIn()}
              disabled={isSigningIn}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSigningIn ? 'Redirecting...' : 'Sign in with Google'}
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!status.allowedEmail) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-950">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <div className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-8">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Personal OS</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-neutral-950">Access denied.</h1>
            <p className="mt-3 text-sm text-neutral-600">The signed-in Google account is not in the allowlist.</p>
            <button
              type="button"
              onClick={() => void handleLogout()}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm font-medium text-neutral-950 transition-colors hover:bg-neutral-100"
            >
              Use another account
            </button>
          </div>
        </div>
      </main>
    );
  }

  if (!status.secondFactorPassed) {
    return (
      <main className="min-h-screen bg-neutral-50 px-4 py-8 text-neutral-950">
        <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center">
          <form onSubmit={handleSecondFactorSubmit} className="w-full rounded-2xl border border-neutral-200 bg-white px-6 py-8">
            <div className="space-y-3">
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-neutral-500">Personal OS</p>
              <h1 className="text-2xl font-semibold tracking-tight text-neutral-950">Enter your second password.</h1>
              <p className="text-sm text-neutral-600">Confirm access after Google sign-in.</p>
            </div>

            <label className="mt-6 block">
              <span className="mb-2 block text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">Second password</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-neutral-300 bg-white px-4 py-2.5 text-sm text-neutral-950 outline-none transition-colors placeholder:text-neutral-400 focus:border-neutral-950"
                autoComplete="current-password"
                autoFocus
              />
            </label>

            {authError ? <p className="mt-4 text-sm text-red-600">{authError}</p> : null}

            <button
              type="submit"
              disabled={isSubmittingPassword}
              className="mt-6 inline-flex w-full items-center justify-center rounded-xl border border-neutral-950 bg-neutral-950 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmittingPassword ? 'Verifying...' : 'Unlock Personal OS'}
            </button>
          </form>
        </div>
      </main>
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