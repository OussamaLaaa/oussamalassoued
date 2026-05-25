export const customLogin = async (email: string, password: string) => {
  try {
    const response = await fetch('/api/personal-auth/login', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Login failed. Try again.',
        status: response.status,
      };
    }

    return { success: true, email: data.email };
  } catch {
    return { success: false, error: 'Login failed. Try again.', status: 0 };
  }
};

export const personalLogout = async () => {
  await fetch('/api/personal-auth/logout', {
    method: 'POST',
    credentials: 'include',
  });
};

export const fetchPersonalAuthStatus = async () => {
  const response = await fetch('/api/personal-auth/status', {
    method: 'GET',
    credentials: 'include',
    cache: 'no-store',
  });

  return response.json();
};

export const verifyPersonalSecondFactor = async (password: string, rememberDevice = false) => {
  const response = await fetch('/api/personal-auth/verify-second-factor', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ password, rememberDevice }),
  });

  return response.json();
};
